import asyncio
import logging
import os
import shutil
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, Header, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from fastembed import TextEmbedding
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
from langchain_core.embeddings import Embeddings
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not set in environment variables")

MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
BASE_DATA_DIR = Path(os.getenv("DATA_DIR", "data"))
BASE_DATA_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".txt"}

app = FastAPI(title="ResumeGuru RAG Internal Microservice")

# Global instances
global_embeddings = None
store_locks: dict[str, asyncio.Lock] = {}

# Multi-tenant state
vector_stores: dict[str, Any] = {}
memories: dict[str, ConversationBufferMemory] = {}
query_caches: dict[str, dict[str, Any]] = {}


class QueryRequest(BaseModel):
    question: str
    k: int = 3


class LocalFastEmbedEmbeddings(Embeddings):
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model = TextEmbedding(model_name=model_name)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [list(vec) for vec in self.model.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        return list(next(self.model.embed([text])))


def get_embeddings() -> LocalFastEmbedEmbeddings:
    global global_embeddings
    if global_embeddings is None:
        logger.info("Loading FastEmbed model...")
        global_embeddings = LocalFastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    return global_embeddings

def get_user_lock(user_id: str) -> asyncio.Lock:
    if user_id not in store_locks:
        store_locks[user_id] = asyncio.Lock()
    return store_locks[user_id]

def get_user_dirs(user_id: str) -> tuple[Path, Path]:
    user_dir = BASE_DATA_DIR / user_id
    upload_dir = user_dir / "uploads"
    faiss_dir = user_dir / "faiss_index"
    upload_dir.mkdir(parents=True, exist_ok=True)
    faiss_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir, faiss_dir

def get_vector_store(user_id: str):
    if user_id in vector_stores:
        return vector_stores[user_id]

    _, faiss_dir = get_user_dirs(user_id)
    index_file = faiss_dir / "index.faiss"
    meta_file = faiss_dir / "index.pkl"

    if index_file.exists() and meta_file.exists():
        logger.info(f"Loading existing FAISS index for {user_id}...")
        store = FAISS.load_local(
            str(faiss_dir),
            get_embeddings(),
            allow_dangerous_deserialization=True,
        )
        vector_stores[user_id] = store
        return store

    return None


def get_user_memory(user_id: str) -> ConversationBufferMemory:
    if user_id not in memories:
        memories[user_id] = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer",
        )
    return memories[user_id]

def get_user_cache(user_id: str) -> dict[str, Any]:
    if user_id not in query_caches:
        query_caches[user_id] = {}
    return query_caches[user_id]


def load_document(file_path: str):
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        loader = PyPDFLoader(file_path)
    elif ext == ".txt":
        loader = TextLoader(file_path, encoding="utf-8", autodetect_encoding=True)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
    return loader.load()


def build_vector_store(documents):
    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=50)
    chunks = splitter.split_documents(documents)
    if not chunks:
        raise ValueError("No readable text could be extracted from the document.")
    return FAISS.from_documents(chunks, get_embeddings())


def process_uploaded_file(file_path: Path, user_id: str) -> None:
    _, faiss_dir = get_user_dirs(user_id)
    logger.info(f"[{user_id}] Loading document...")
    docs = load_document(str(file_path))

    logger.info(f"[{user_id}] Splitting and embedding...")
    new_store = build_vector_store(docs)

    logger.info(f"[{user_id}] Merging vector store...")
    current_store = get_vector_store(user_id)

    if current_store is None:
        vector_stores[user_id] = new_store
    else:
        current_store.merge_from(new_store)
        vector_stores[user_id] = current_store

    logger.info(f"[{user_id}] Saving FAISS index...")
    vector_stores[user_id].save_local(str(faiss_dir))

    get_user_cache(user_id).clear()
    logger.info("[%s] SUCCESS: %s indexed", user_id, file_path.name)


def save_uploaded_file(upload: UploadFile, destination: Path) -> None:
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)


def get_qa_chain(store, memory, k: int = 3):
    llm = ChatGroq(
        model_name=MODEL_NAME,
        groq_api_key=GROQ_API_KEY,
    )

    prompt_template = """Use the following pieces of context to answer the question at the end.
If the answer is not in the context, say "I don't know based on the provided documents."

Context:
{context}

Question: {question}

Helpful Answer:"""

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question"],
    )

    retriever = store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": max(1, min(k, 10))},
    )

    return ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=retriever,
        memory=memory,
        return_source_documents=True,
        combine_docs_chain_kwargs={"prompt": prompt},
    )


def invoke_chain(chain, question: str):
    return chain.invoke({"question": question}, config={"timeout": 20})


# Dependency to get user ID
def get_user_id(x_user_id: str = Header(...)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header missing")
    return x_user_id


@app.get("/documents")
async def list_documents(user_id: str = Depends(get_user_id)):
    upload_dir, _ = get_user_dirs(user_id)
    files = [f.name for f in upload_dir.iterdir() if f.is_file()]
    return {"documents": sorted(files)}


@app.post("/upload")
async def upload_document(file: UploadFile = File(...), user_id: str = Depends(get_user_id)):
    filename = Path(file.filename or "").name
    if not filename:
        raise HTTPException(status_code=400, detail="No file name provided.")

    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    upload_dir, faiss_dir = get_user_dirs(user_id)
    file_path = upload_dir / filename

    try:
        await run_in_threadpool(save_uploaded_file, file, file_path)
        
        lock = get_user_lock(user_id)
        async with lock:
            await run_in_threadpool(process_uploaded_file, file_path, user_id)
            
        return {"message": f"Successfully uploaded and indexed '{filename}'."}
    except Exception as e:
        logger.exception(f"[{user_id}] Error processing upload for {filename}")
        if file_path.exists():
            file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()


@app.post("/query")
async def query_document(req: QueryRequest, user_id: str = Depends(get_user_id)):
    store = get_vector_store(user_id)
    if store is None:
        raise HTTPException(status_code=400, detail="No documents uploaded yet. Please upload a document first.")

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    cache = get_user_cache(user_id)
    cache_key = f"{question.lower()}::k={max(1, min(req.k, 10))}"
    if cache_key in cache:
        return cache[cache_key]

    try:
        memory = get_user_memory(user_id)
        qa_chain = get_qa_chain(store, memory, k=req.k)
        res = await run_in_threadpool(invoke_chain, qa_chain, question)

        answer = res.get("answer", "")
        source_docs = res.get("source_documents", [])
        sources = [{"content": doc.page_content.strip()} for doc in source_docs]

        payload = {"answer": answer, "sources": sources}
        cache[cache_key] = payload
        return payload
    except Exception as e:
        logger.exception(f"[{user_id}] Error during query processing")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/history")
async def clear_memory(user_id: str = Depends(get_user_id)):
    if user_id in memories:
        memories[user_id].clear()
    if user_id in query_caches:
        query_caches[user_id].clear()
    logger.info(f"[{user_id}] Cleared conversation memory and cache.")
    return {"message": "Memory and cache cleared."}
