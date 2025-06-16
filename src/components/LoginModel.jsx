import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { X, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from './AuthContext'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ showLoginModal, setShowLoginModal }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  const { login, signup, resetPassword, signInWithGoogle } = useAuth();

  if (!showLoginModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setMessage('Password reset email sent! Check your inbox.');
      } else if (isLogin) {
        await login(email, password);
        setShowLoginModal(false);
        navigate('/');
      } else {
        await signup(email, password, displayName);
        setMessage('Account created successfully!');
        setIsLogin(true);
      }
    } catch (error) {
      setMessage(error.message || 'An error occurred');
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      setShowLoginModal(false);
      navigate('/');
    } catch (error) {
      setMessage('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (isForgotPassword) {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Reset Password</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          
          <button 
            type="button"
            onClick={() => setIsForgotPassword(false)}
            className="w-full text-gray-600 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200 mt-2"
          >
            Back to Login
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {isLogin ? 'Sign in to Chinju Store' : 'Create an Account'}
        </h2>
        
        {!isLogin && (
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        
        <div className="relative">
          <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="relative">
          <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        {isLogin && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Forgot password?
            </button>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
        >
          {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
        
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        
        <button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 px-4 text-gray-700 hover:bg-gray-50 transition duration-200 disabled:bg-gray-100 disabled:text-gray-400"
        >
          <FcGoogle size={24} />
          <span>Continue with Google</span>
        </button>
        
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl p-6 transform transition-all">
        <div className="flex justify-end">
          <button 
            onClick={() => setShowLoginModal(false)}
            className="text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-2"
          >
            <X size={18} />
          </button>
        </div>
        
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${
            message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {message}
          </div>
        )}
        
        {renderForm()}
      </div>
    </div>
  );
};

export default LoginModal;