import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PageWrapper from '../components/PageWrapper';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${API_URL}/api/auth/signup`, {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-8 py-12">
      <div className="w-full max-w-[460px] glass-panel p-8 sm:p-10 flex flex-col gap-2 relative overflow-hidden">

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-2">
            Create an Account
          </h1>
          <p className="text-zinc-400 text-sm">Join us today to get started with intelligent analysis</p>
        </div>
        
        {error && <div className="error-message mb-6 relative z-10">{error}</div>}
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300">Full Name</label>
            <input 
              type="text" 
              id="name"
              name="name" 
              className="input-field"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">Email Address</label>
            <input 
              type="email" 
              id="email"
              name="email" 
              className="input-field"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>
          
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300">Password</label>
            <input 
              type="password" 
              id="password"
              name="password" 
              className="input-field"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword"
              name="confirmPassword" 
              className="input-field"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
          </div>
          
          <button type="submit" className="btn-primary mt-6 !py-3.5" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-zinc-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Creating account...
              </span>
            ) : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-sm text-zinc-400 relative z-10 pb-1">
          Already have an account? <Link to="/login" className="text-red-400 hover:text-red-300 hover:underline font-medium ml-1 transition-colors">Sign in</Link>
        </div>
      </div>
    </div>
    </PageWrapper>
  );
};

export default Signup;
