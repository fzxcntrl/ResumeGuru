import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, Database, Network, Search, Trash2, Send } from 'lucide-react';

const RagSection = () => {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ state: 'idle', message: '' }); 
  
  const [question, setQuestion] = useState('');
  const [kValue, setKValue] = useState(3);
  const [isQuerying, setIsQuerying] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [queryError, setQueryError] = useState('');

  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/rag/documents`, { headers: getHeaders() });
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus({ state: 'uploading', message: '' });
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post(`${API_URL}/api/rag/upload`, formData, {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus({ state: 'success', message: data.message });
      setFile(null);
      fetchDocuments();
      setTimeout(() => setUploadStatus({ state: 'idle', message: '' }), 4000);
    } catch (err) {
      setUploadStatus({ 
        state: 'error', 
        message: err.response?.data?.detail || err.response?.data?.message || 'Upload failed.' 
      });
    }
  };

  const handleAsk = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    const currentQ = question;
    setQuestion('');
    setQueryError('');
    setIsQuerying(true);

    setChatHistory(prev => [...prev, { role: 'user', content: currentQ }]);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/rag/query`,
        { question: currentQ, k: parseInt(kValue) || 3 },
        { headers: getHeaders() }
      );
      
      setChatHistory(prev => [
        ...prev, 
        { role: 'assistant', content: data.answer, sources: data.sources }
      ]);
    } catch (err) {
      setQueryError(err.response?.data?.detail || err.response?.data?.message || 'Query failed.');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear conversation memory?')) return;
    try {
      await axios.delete(`${API_URL}/api/rag/history`, { headers: getHeaders() });
      setChatHistory([]);
    } catch {
      alert('Failed to clear memory');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Panel: Upload & Knowledge Base */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="glass-panel p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              <Database className="text-red-400" size={20} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Knowledge Base</h3>
          </div>
          <p className="text-zinc-400 text-sm">
            Upload custom PDFs or Text files to train your personalized vector assistant.
          </p>

          <div className="relative group mt-2">
            <input 
              type="file" 
              accept=".pdf,.txt" 
              id="file-upload" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileChange}
              disabled={uploadStatus.state === 'uploading'}
            />
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${file ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-500 group-hover:bg-zinc-800/80'}`}>
              <Upload className={`mx-auto mb-3 ${file ? 'text-red-400' : 'text-zinc-500'}`} size={28} />
              <p className={`font-medium ${file ? 'text-red-400' : 'text-zinc-300'}`}>
                {file ? file.name : 'Click or drag file here'}
              </p>
              {!file && <p className="text-zinc-500 text-xs mt-1">Supports .pdf, .txt</p>}
            </div>
          </div>

          <button 
            className="btn-primary w-full py-3 mt-2"
            onClick={handleUpload}
            disabled={!file || uploadStatus.state === 'uploading'}
          >
            {uploadStatus.state === 'uploading' ? 'Uploading & Indexing...' : 'Add to Knowledge Base'}
          </button>

          {uploadStatus.state === 'success' && <div className="success-message">{uploadStatus.message}</div>}
          {uploadStatus.state === 'error' && <div className="error-message">{uploadStatus.message}</div>}
        </div>

        <div className="glass-panel p-6">
          <h4 className="text-zinc-200 font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <Network size={16} className="text-red-400" />
            Indexed Documents
          </h4>
          {documents.length > 0 ? (
            <div className="flex flex-col gap-2">
              {documents.map((doc, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 flex items-center gap-3">
                  <span className="text-lg opacity-80">📄</span>
                  <span className="text-zinc-300 text-sm truncate font-medium" title={doc}>{doc}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm italic py-2">No documents indexed yet.</p>
          )}
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="lg:col-span-2">
        <div className="glass-panel h-[600px] flex flex-col overflow-hidden relative border border-white/10">
          
          {/* Chat Header */}
          <div className="border-b border-white/5 bg-zinc-900 p-4 px-6 flex justify-between items-center z-20 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <Search size={18} className="text-red-400" />
              <span className="font-semibold text-zinc-100">Intelligent RAG Assistant</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
                <label>Context Depth (k):</label>
                <input 
                  type="number" 
                  value={kValue} 
                  onChange={(e) => setKValue(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 w-14 text-center focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  min="1" max="10"
                />
              </div>
              <button onClick={handleClearHistory} className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-md transition-colors" title="Clear Memory">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-zinc-950/40">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                <Database size={48} className="mb-4 opacity-20 text-zinc-400" />
                <p className="text-lg font-semibold text-zinc-300">Ask your documents anything.</p>
                <p className="text-sm mt-1">Upload a document first, then start typing below.</p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-4 ${
                    msg.role === 'user' 
                    ? 'bg-zinc-800 border border-white/10 text-white rounded-2xl rounded-tr-sm shadow-md' 
                    : 'bg-zinc-900 border border-white/5 text-zinc-300 rounded-2xl rounded-tl-sm shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
                    
                    {/* Render Sources if Assistant */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Extracted Sources:</p>
                        <div className="flex flex-col gap-2">
                          {msg.sources.map((s, i) => (
                            <div key={i} className="bg-zinc-950/50 rounded-lg p-3 text-xs text-zinc-400 border border-zinc-800/50">
                              [{i+1}] {s.content.substring(0, 200)}...
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isQuerying && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            {queryError && (
              <div className="flex justify-center">
                <span className="error-message text-xs py-2 px-4 shadow-sm">{queryError}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-zinc-900 border-t border-white/5 z-20 shrink-0">
            <form onSubmit={handleAsk} className="flex gap-3 relative">
              <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question..."
                className="input-field !py-3.5 bg-zinc-950 border-zinc-800 flex-1 pr-16"
                disabled={isQuerying || documents.length === 0}
              />
              <button 
                type="submit" 
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                disabled={isQuerying || !question.trim() || documents.length === 0}
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
};

export default RagSection;
