// Login.jsx
import React, { useState } from "react";
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { IoIosArrowBack } from "react-icons/io";

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      navigate('/'); // or navigate('/user-dashboard') if needed
    } catch {
      setError('Google Sign-In Error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div>
          <Link to="/">
            <IoIosArrowBack className="hover:text-blue-500" />
          </Link>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Login
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in with your Google account to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <FcGoogle size={24} />
          <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
