import { useState } from 'react';
import axios from 'axios';
import { CheckCircle, AlertTriangle, HelpCircle, Lightbulb, Sparkles } from 'lucide-react';

const AnalyzeSection = () => {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) {
      return setError('Please enter some text to analyze.');
    }
    
    setError('');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(
        `${API_URL}/api/analyze`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary-600/20 p-2.5 rounded-xl border border-primary-500/30">
          <Sparkles className="text-primary-400" size={24} />
        </div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
          AI Resume & Code Analyzer
        </h2>
      </div>
      
      <p className="text-zinc-400 mb-6 max-w-2xl">
        Paste your resume text or code snippet below to get actionable feedback, identify weaknesses, and prepare for interviews.
      </p>
      
      {error && <div className="error-message mb-6">{error}</div>}
      
      <div className="relative group">
        <textarea
          className="input-field min-h-[240px] resize-y leading-relaxed"
          placeholder="Paste your text here... (e.g. your latest resume summary or a code block)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <button 
        className="btn-primary mt-6 !inline-flex items-center justify-center gap-2 sm:w-auto px-8" 
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-zinc-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Analyzing...
          </>
        ) : (
          'Analyze Text'
        )}
      </button>

      {loading && (
        <div className="mt-8 text-center text-zinc-400 animate-pulse bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
           <p className="font-medium text-primary-400 mb-2">Processing Document</p>
           <p className="text-sm">Our AI model is thoroughly evaluating your submission. This may take a few seconds...</p>
        </div>
      )}

      {results && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="glass-panel-hover p-6 bg-zinc-950/40 border-[1px] border-emerald-500/20 group">
            <h3 className="text-emerald-400 font-semibold text-lg mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="group-hover:scale-110 transition-transform" /> 
              Strengths
            </h3>
            <ul className="space-y-3">
              {results.strengths?.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-zinc-300 text-sm leading-relaxed">
                  <span className="text-emerald-500/50 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="glass-panel-hover p-6 bg-zinc-950/40 border-[1px] border-red-500/20 group">
            <h3 className="text-red-400 font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="group-hover:scale-110 transition-transform" /> 
              Weaknesses
            </h3>
            <ul className="space-y-3">
              {results.weaknesses?.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-zinc-300 text-sm leading-relaxed">
                  <span className="text-red-500/50 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="glass-panel-hover p-6 bg-zinc-950/40 border-[1px] border-blue-500/20 group">
            <h3 className="text-blue-400 font-semibold text-lg mb-4 flex items-center gap-2">
              <HelpCircle size={20} className="group-hover:scale-110 transition-transform" /> 
              Interview Questions
            </h3>
            <ul className="space-y-3">
              {results.questions?.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-zinc-300 text-sm leading-relaxed">
                  <span className="text-blue-500/50 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="glass-panel-hover p-6 bg-zinc-950/40 border-[1px] border-amber-500/20 group">
            <h3 className="text-amber-400 font-semibold text-lg mb-4 flex items-center gap-2">
              <Lightbulb size={20} className="group-hover:scale-110 transition-transform" /> 
              Suggestions
            </h3>
            <ul className="space-y-3">
              {results.suggestions?.map((item, idx) => (
                <li key={idx} className="flex gap-3 text-zinc-300 text-sm leading-relaxed">
                  <span className="text-amber-500/50 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeSection;
