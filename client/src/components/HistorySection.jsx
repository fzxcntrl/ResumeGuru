import { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, ChevronDown, ChevronUp, Clock3 } from 'lucide-react';

const HistorySection = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data } = await axios.get(`${API_URL}/api/analyze/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(data);
      } catch (err) {
        setError('Failed to load analysis history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="glass-panel p-8 text-center bg-zinc-900/50">
        <div className="inline-block w-8 h-8 border-4 border-zinc-800 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 font-medium">Loading your history...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message mt-6 mb-2">{error}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="glass-panel p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-zinc-800">
        <div className="bg-zinc-800/50 p-4 rounded-full mb-4">
          <Clock size={40} className="text-zinc-500" />
        </div>
        <h3 className="text-xl font-semibold text-zinc-200 mb-2">No history yet</h3>
        <p className="text-zinc-400 max-w-sm">Your past analyses and reports will securely appear here once you scan a document.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary-600/20 p-2.5 rounded-xl border border-primary-500/30">
          <Clock3 className="text-primary-400" size={24} />
        </div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
          Past Analyses
        </h2>
      </div>
      
      <div className="space-y-4">
        {history.map((record) => (
          <div key={record._id} className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-primary-500/30 transition-colors duration-300">
            <div 
              className="p-5 sm:px-6 flex justify-between items-center cursor-pointer hover:bg-zinc-800/30 transition-colors"
              onClick={() => toggleExpand(record._id)}
            >
              <div className="pr-4 overflow-hidden">
                <p className="font-semibold text-zinc-200 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  {new Date(record.createdAt).toLocaleDateString()} at {new Date(record.createdAt).toLocaleTimeString()}
                </p>
                <p className="text-zinc-400 text-sm truncate max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl">
                  {record.inputText}
                </p>
              </div>
              <button className="text-zinc-500 hover:text-zinc-200 transition-colors bg-zinc-900/80 p-2 rounded-lg">
                {expandedId === record._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
            
            {expandedId === record._id && (
              <div className="p-6 border-t border-zinc-800 bg-black/20 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Strengths */}
                  <div>
                    <h4 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {record.aiResponse.strengths?.map((str, i) => (
                        <li key={i} className="flex gap-2 text-zinc-300 text-sm leading-relaxed">
                          <span className="text-emerald-500/50 mt-1 text-xs">●</span> {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Weaknesses */}
                  <div>
                    <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      Weaknesses
                    </h4>
                    <ul className="space-y-2">
                      {record.aiResponse.weaknesses?.map((wk, i) => (
                        <li key={i} className="flex gap-2 text-zinc-300 text-sm leading-relaxed">
                          <span className="text-red-500/50 mt-1 text-xs">●</span> {wk}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Questions */}
                  <div>
                    <h4 className="text-blue-400 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      Interview Questions
                    </h4>
                    <ul className="space-y-2">
                      {record.aiResponse.questions?.map((q, i) => (
                        <li key={i} className="flex gap-2 text-zinc-300 text-sm leading-relaxed">
                          <span className="text-blue-500/50 mt-1 text-xs">●</span> {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Suggestions */}
                  <div>
                    <h4 className="text-amber-400 font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      Suggestions
                    </h4>
                    <ul className="space-y-2">
                      {record.aiResponse.suggestions?.map((s, i) => (
                        <li key={i} className="flex gap-2 text-zinc-300 text-sm leading-relaxed">
                          <span className="text-amber-500/50 mt-1 text-xs">●</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySection;
