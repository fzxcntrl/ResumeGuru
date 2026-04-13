import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Upload, Database, Network, Search, Trash2, Send } from 'lucide-react';

const RagSection = () => {
  const [documents, setDocuments] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({ state: 'idle', message: '' }); // idle | uploading | success | error
  
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

    // Initial state: Add user question
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
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary-600/20 p-2 rounded-lg border border-primary-500/30">
              <Database className="text-primary-400" size={20} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100">Knowledge Base</h3>
          </div>
          <p className="text-zinc-400 text-sm mb-6">
            Upload custom PDFs or Text files to train your personalized vector assistant.
          </p>

          <div className="mb-6 relative group">
            <input 
              type="file" 
              accept=".pdf,.txt" 
              id="file-upload" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileChange}
              disabled={uploadStatus.state === 'uploading'}
            />
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${file ? 'border-primary-500 bg-primary-500/5' : 'border-zinc-700 bg-zinc-900/50 group-hover:border-primary-500/50 group-hover:bg-zinc-800/50'}`}>
              <Upload className={`mx-auto mb-3 ${file ? 'text-primary-400' : 'text-zinc-500'}`} size={28} />
              <p className={`font-medium ${file ? 'text-primary-400' : 'text-zinc-300'}`}>
                {file ? file.name : 'Click or drag file here'}
              </p>
              {!file && <p className="text-zinc-500 text-xs mt-1">Supports .pdf, .txt</p>}
            </div>
          </div>

          <button 
            className="btn-primary w-full shadow-md py-3"
            onClick={handleUpload}
            disabled={!file || uploadStatus.state === 'uploading'}
          >
            {uploadStatus.state === 'uploading' ? 'Uploading & Indexing...' : 'Add to Knowledge Base'}
          </button>

          {uploadStatus.state === 'success' && <div className="success-message mt-4">{uploadStatus.message}</div>}
          {uploadStatus.state === 'error' && <div className="error-message mt-4">{uploadStatus.message}</div>}
        </div>

        <div className="glass-panel p-6">
          <h4 className="text-zinc-200 font-semibold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
            <Network size={16} className="text-indigo-400" />
            Indexed Documents
          </h4>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc, i) => (
                <div key={i} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg py-2 px-3 flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <span className="text-zinc-300 text-sm truncate" title={doc}>{doc}</span>
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
        <div className="glass-panel h-[600px] flex flex-col overflow-hidden relative">
          
          {/* Chat Header */}
          <div className="border-b border-white/5 bg-zinc-900/80 p-4 flex justify-between items-center z-20">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-primary-400" />
              <span className="font-semibold text-zinc-100">Intelligent RAG Assistant</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <label>Context Depth (k):</label>
                <input 
                  type="number" 
                  value={kValue} 
                  onChange={(e) => setKValue(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 w-12 text-center focus:outline-none focus:border-primary-500"
                  min="1" max="10"
                />
              </div>
              <button onClick={handleClearHistory} className="text-zinc-500 hover:text-red-400 transition-colors" title="Clear Memory">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-zinc-950/20">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-80">
                <Database size={48} className="mb-4 opacity-50 text-indigo-400" />
                <p className="text-lg font-medium text-zinc-300">Ask your documents anything.</p>
                <p className="text-sm">Upload a document first, then start typing below.</p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    msg.role === 'user' 
                    ? 'bg-primary-600 text-white rounded-br-sm shadow-md' 
                    : 'bg-zinc-800/80 border border-zinc-700/50 text-zinc-200 rounded-bl-sm shadow-md'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    
                    {/* Render Sources if Assistant */}
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-700/50">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Extracted Sources:</p>
                        <div className="space-y-2">
                          {msg.sources.map((s, i) => (
                            <div key={i} className="bg-zinc-950/50 rounded-lg p-3 text-xs text-zinc-400 border border-zinc-800/50 hover:border-zinc-700 hover:text-zinc-300 transition-colors">
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
                <div className="bg-zinc-800/50 rounded-2xl rounded-bl-sm px-5 py-4 text-zinc-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            {queryError && (
              <div className="flex justify-center">
                <span className="error-message text-xs py-2 px-4 inline-block">{queryError}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-zinc-900 border-t border-white/5 z-20">
            <form onSubmit={handleAsk} className="flex gap-3">
              <input 
                type="text" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Type your question..."
                className="input-field !py-3 bg-zinc-950 border-zinc-700 flex-1"
                disabled={isQuerying || documents.length === 0}
              />
              <button 
                type="submit" 
                className="bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-5 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isQuerying || !question.trim() || documents.length === 0}
              >
                <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
};

export default RagSection;
