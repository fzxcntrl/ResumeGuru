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
          <div className="w-10 h-10 border-4 border-zinc-800 border-t-red-500 rounded-full animate-spin"></div>
          <p className="text-zinc-400 font-medium tracking-wide">Loading dashboard...</p>
        </div>
      </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-8">
      {/* Top Nav segment */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
            <Bot className="text-red-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">
            ResumeGuru
          </h2>
        </div>
        <button 
          className="btn-secondary flex items-center gap-2 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 group border-white/10" 
          onClick={handleLogout}
        >
          <LogOut size={16} className="group-hover:text-red-400 transition-colors duration-300" />
          <span className="hidden sm:inline font-semibold">Logout</span>
        </button>
      </div>

      {error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Welcome Card */}
          <div className="glass-panel p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-zinc-100 tracking-tight">
                Welcome back, <span className="text-red-500">{userData?.name}</span>
              </h1>
              <p className="text-zinc-400">
                Access your intelligent analysis tools and personalized knowledge base below.
              </p>
            </div>

            {/* Profile Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-zinc-900 p-2.5 rounded-lg border border-white/5"><User size={20} className="text-zinc-400" /></div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm font-medium text-zinc-200">{userData?.email}</p>
                </div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-zinc-900 p-2.5 rounded-lg border border-white/5"><FileText size={20} className="text-zinc-400" /></div>
                <div>
                  <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Member Since</p>
                  <p className="text-sm font-medium text-zinc-200">{new Date(userData?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Elevated Tab Navigation */}
          <div className="flex justify-start">
            <div className="bg-zinc-900/80 border border-white/10 p-1.5 rounded-xl inline-flex gap-1 shadow-sm">
              <button
                onClick={() => setActiveTab('analyze')}
                className={`px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out rounded-lg flex items-center gap-2 ${
                  activeTab === 'analyze' 
                    ? 'bg-zinc-800 text-white shadow-md border border-white/10' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Bot size={18} className={activeTab === 'analyze' ? 'text-red-400' : ''} />
                AI Resume Analysis
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`px-5 py-2.5 text-sm font-semibold transition-all duration-300 ease-in-out rounded-lg flex items-center gap-2 ${
                  activeTab === 'knowledge' 
                    ? 'bg-zinc-800 text-white shadow-md border border-white/10' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Database size={18} className={activeTab === 'knowledge' ? 'text-red-400' : ''} />
                Knowledge Base (RAG)
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in duration-500">
            {activeTab === 'analyze' ? (
              <div className="flex flex-col gap-8">
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
