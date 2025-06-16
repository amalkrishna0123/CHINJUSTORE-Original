// AdminLogin.jsx
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    // setError('');
    // setLoading(true);
    try {
      if (email === 'admin@gmail.com' && password === '123456') {
        localStorage.setItem('isAdmin', 'true');
        navigate('/dashboard', { replace: true });
        return;
      } else {
        // setError('Invalid admin credentials');
      }
    } catch (error) {
    //   setError('Failed to login. Please try again.');
    }
    // setLoading(false);
  };

  return (
    <form onSubmit={handleAdminLogin} className="space-y-6 min-h-screen flex flex-col justify-center items-center w-full px-2">
      <div className="space-y-4 w-full">
        <div className="relative w-full">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg"
            placeholder="Admin Email"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg"
            placeholder="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
      >
        Sign in as Admin
      </button>
    </form>
  );
};

export default AdminLogin;
