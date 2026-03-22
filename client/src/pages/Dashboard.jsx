import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, User } from 'lucide-react';
import AnalyzeSection from '../components/AnalyzeSection';
import HistorySection from '../components/HistorySection';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const { data } = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(data);
      } catch (err) {
        setError('Failed to fetch user data. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header glass-panel" style={{ padding: '1rem 2rem' }}>
        <h2>Dashboard</h2>
        <button className="btn-secondary" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="dashboard-content glass-panel">
          <h1 className="welcome-text">
            Welcome back, <span style={{ color: 'var(--primary-color)' }}>{userData?.name}</span>!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            You have successfully authenticated and accessed a protected route.
          </p>

          <div className="user-details">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <User size={24} color="var(--primary-color)" />
              <h3>Your Profile Information</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>ID:</strong>
              <span>{userData?._id}</span>
              
              <strong style={{ color: 'var(--text-secondary)' }}>Name:</strong>
              <span>{userData?.name}</span>
              
              <strong style={{ color: 'var(--text-secondary)' }}>Email:</strong>
              <span>{userData?.email}</span>
              
              <strong style={{ color: 'var(--text-secondary)' }}>Joined:</strong>
              <span>{new Date(userData?.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <AnalyzeSection />
          <HistorySection />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
