import { useState } from 'react';
import axios from 'axios';
import { CheckCircle, AlertTriangle, HelpCircle, Lightbulb } from 'lucide-react';

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
    <div className="analyze-section glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>AI Resume & Code Analyzer</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Paste your resume text or code snippet below to get actionable feedback, identify weaknesses, and prepare for interviews.
      </p>
      
      {error && <div className="error-message">{error}</div>}
      
      <textarea
        className="input-field analyze-textarea"
        placeholder="Paste your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      
      <button 
        className="btn-primary" 
        style={{ marginTop: '1rem', width: 'auto' }}
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
      >
        {loading ? 'Analyzing...' : 'Analyze Text'}
      </button>

      {loading && (
        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
           <p>Our AI model is thoroughly evaluating your submission. This may take a few seconds...</p>
        </div>
      )}

      {results && !loading && (
        <div className="results-grid">
          <div className="result-card card-success">
            <h3 style={{ color: '#10b981' }}><CheckCircle size={20} /> Strengths</h3>
            <ul>
              {results.strengths?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          
          <div className="result-card card-danger">
            <h3 style={{ color: '#ef4444' }}><AlertTriangle size={20} /> Weaknesses</h3>
            <ul>
              {results.weaknesses?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          
          <div className="result-card card-info">
            <h3 style={{ color: '#3b82f6' }}><HelpCircle size={20} /> Interview Questions</h3>
            <ul>
              {results.questions?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
          
          <div className="result-card card-warning">
            <h3 style={{ color: '#f59e0b' }}><Lightbulb size={20} /> Suggestions</h3>
            <ul>
              {results.suggestions?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeSection;
