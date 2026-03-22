import { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

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
    return <div style={{ marginTop: '2rem', padding: '1rem', color: 'var(--text-secondary)' }}>Loading history...</div>;
  }

  if (error) {
    return <div className="error-message" style={{ marginTop: '2rem' }}>{error}</div>;
  }

  if (history.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', textAlign: 'center' }}>
        <Clock size={48} color="var(--text-secondary)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <h3 style={{ color: 'var(--text-secondary)' }}>No analysis history yet</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Your past requests will appear here after you analyze text.</p>
      </div>
    );
  }

  return (
    <div className="history-section glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={24} />
        Past Analyses
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {history.map((record) => (
          <div key={record._id} style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            <div 
              style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => toggleExpand(record._id)}
            >
              <div>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {new Date(record.createdAt).toLocaleDateString()} at {new Date(record.createdAt).toLocaleTimeString()}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                  {record.inputText.substring(0, 60)}...
                </p>
              </div>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                {expandedId === record._id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </button>
            </div>
            
            {expandedId === record._id && (
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Strengths</h4>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {record.aiResponse.strengths?.map((str, i) => <li key={i}>{str}</li>)}
                  </ul>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Weaknesses</h4>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {record.aiResponse.weaknesses?.map((wk, i) => <li key={i}>{wk}</li>)}
                  </ul>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Questions</h4>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {record.aiResponse.questions?.map((q, i) => <li key={i}>{q}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>Suggestions</h4>
                  <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {record.aiResponse.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
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
