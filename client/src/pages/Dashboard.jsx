import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, User, FileText, Bot, Database } from 'lucide-react';
import AnalyzeSection from '../components/AnalyzeSection';
import HistorySection from '../components/HistorySection';
import RagSection from '../components/RagSection';
import PageWrapper from '../components/PageWrapper';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analyze');
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
      <PageWrapper>
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium tracking-wide">Loading dashboard...</p>
        </div>
      </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
    <div className="max-w-6xl mx-auto px-4 py-8 w-full">
      <div className="glass-panel px-6 py-4 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center border border-primary-500/30">
            <Bot className="text-primary-400" size={24} />
          </div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-400">
            ResumeGuru
          </h2>
        </div>
        <button 
          className="btn-secondary flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 group" 
          onClick={handleLogout}
        >
          <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {error ? (
        <div className="error-message mb-8">{error}</div>
      ) : (
        <div className="space-y-8">
          {/* Welcome Card */}
          <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-primary-600/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, <span className="text-primary-400">{userData?.name}</span>!
            </h1>
            <p className="text-zinc-400 mb-6">
              Access your intelligent analysis tools and personalized knowledge base below.
            </p>

            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-5 inline-flex flex-col sm:flex-row gap-6 sm:gap-12 items-start sm:items-center">
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg"><User size={20} className="text-primary-400" /></div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium text-zinc-200">{userData?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-zinc-800 p-2 rounded-lg"><FileText size={20} className="text-indigo-400" /></div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-medium text-zinc-200">{new Date(userData?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-px">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`px-5 py-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
                activeTab === 'analyze' 
                  ? 'text-primary-400' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-t-lg'
              }`}
            >
              <Bot size={18} />
              AI Resume Analysis
              {activeTab === 'analyze' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`px-5 py-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
                activeTab === 'knowledge' 
                  ? 'text-primary-400' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-t-lg'
              }`}
            >
              <Database size={18} />
              Knowledge Base (RAG)
              {activeTab === 'knowledge' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 shadow-[0_-2px_10px_rgba(99,102,241,0.5)]"></div>
              )}
            </button>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in duration-500">
            {activeTab === 'analyze' ? (
              <div className="space-y-8">
                <AnalyzeSection />
                <HistorySection />
              </div>
            ) : (
              <RagSection />
            )}
          </div>
        </div>
      )}
    </div>
    </PageWrapper>
  );
};

export default Dashboard;
