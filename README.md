# ResumeGuru

An AI-powered resume and code snippet analyzer that provides real-time feedback using Groq LPU models.
Now features a fully integrated **Knowledge Base** powered by an isolated Python FastAPI RAG microservice.

## Project Structure

- `/client` - React & Vite frontend (Tailwind CSS UI)
- `/server` - Express & MongoDB backend (Auth & App Gateway)
- `/rag_service` - Python FastAPI Microservice (FAISS + Langchain RAG Engine)

## Setup & Run Instructions

To run the full stack, you need three terminal windows:

### 1. Python RAG Microservice
```bash
cd rag_service

# Install dependencies (requires Python 3.9+)
pip install -r requirements.txt

# Create a local .env file in rag_service or use the system env
# Ensure you configure GROQ_API_KEY.

# Start the uvicorn server
uvicorn main:app --host localhost --port 8000
```

### 2. Node.js Express Backend
```bash
cd server

# Install the updated dependencies (multer, form-data, etc.)
npm install

# Start the server (runs on port 5001)
node index.js
```

### 3. Vite React Frontend
```bash
cd client

# Install the newly added Tailwind dependencies
npm install

# Start the dev server
npm run dev
```

Enjoy intelligent resume analysis and customized document QA logic!
