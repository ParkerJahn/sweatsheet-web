import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import LoadingIndicator from '../components/LoadingIndicator';
import analytics from '../services/analytics';

interface DecodedToken {
  user_id: string;
  exp: number;
}

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate input before sending request
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      setLoading(false);
      return;
    }

    console.log('Login attempt started...'); // Debug log

    // Track login attempt
    try {
      analytics.auth('login_attempt', {
        method: 'email',
        source: 'login_form'
      });
    } catch (analyticsError) {
      console.warn('Analytics error (non-blocking):', analyticsError);
    }

    try {
      console.log('Sending login request...'); // Debug log
      const response = await api.post('/api/token/', {
        username: username.trim(),
        password: password.trim()
      });

      console.log('Login response received:', response.status); // Debug log

      if (response.data.access) {
        // Store tokens
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

        // Decode token to get user info
        const decodedToken = jwtDecode<DecodedToken>(response.data.access);
        
        console.log('Tokens stored, fetching profile...'); // Debug log
        
        // Fetch user profile
        try {
          const profileResponse = await api.get('/api/profile/');
          const profile = profileResponse.data;
          
          console.log('Profile fetched:', profile.username); // Debug log
          
          // Store user profile
          localStorage.setItem('user_profile', JSON.stringify(profile));

          // Set user properties in Google Analytics (non-blocking)
          try {
            analytics.setUserProperties(decodedToken.user_id, {
              user_role: profile.role || 'ATHLETE',
              user_type: 'authenticated',
              subscription_tier: profile.role === 'PRO' ? 'premium' : 'free'
            });

            // Track successful login
            analytics.auth('login_success', {
              userRole: profile.role || 'ATHLETE',
              method: 'email',
              source: 'login_form'
            });
          } catch (analyticsError) {
            console.warn('Analytics error (non-blocking):', analyticsError);
          }

          console.log('Navigating to home...'); // Debug log
          navigate('/home');
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // Still track login success even if profile fetch fails
          try {
            analytics.auth('login_success', {
              method: 'email',
              source: 'login_form'
            });
          } catch (analyticsError) {
            console.warn('Analytics error (non-blocking):', analyticsError);
          }

          console.log('Profile fetch failed, but navigating to home anyway...'); // Debug log
          navigate('/home');
        }
      } else {
        console.error('No access token in response'); // Debug log
        setError('Login failed: No access token received.');
      }
    } catch (error: unknown) {
      console.error('Login error caught:', error); // Debug log
      
      // Track login failure (non-blocking)
      try {
        analytics.auth('login_failure', {
          method: 'email',
          source: 'login_form'
        });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }

      // Set user-friendly error message
      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response: { status: number; data: { detail?: string } } };
        console.log('Response error details:', responseError.response); // Debug log
        
        if (responseError.response?.status === 401) {
          setError('Invalid username or password. Please check your credentials and try again.');
        } else if (responseError.response?.status === 400) {
          setError('Invalid login data. Please check your username and password.');
        } else if (responseError.response?.data?.detail) {
          setError(responseError.response.data.detail);
        } else {
          setError(`Login failed: ${responseError.response?.status || 'Unknown error'}`);
        }
      } else if (error instanceof Error) {
        setError(`Login failed: ${error.message}`);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      // Track error in analytics (non-blocking)
      try {
        analytics.error(error as Error, { 
          context: 'user_login'
        });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }
    } finally {
      setLoading(false);
      console.log('Login attempt completed'); // Debug log
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center mx-auto mt-12 p-1 rounded-lg shadow-m max-w-md relative bg-gradient-to-r from-blue-600 via-cyan-600 to-cyan-500 shadow-lg">
      <div className="w-full bg-white dark:bg-neutral-900 rounded-lg p-5">
        <h1 className="font-ethnocentric text-2xl font-semibold text-gray-800 dark:text-white mb-4">Login</h1>
        
        {error && (
          <div className="w-full p-3 mb-4 text-red-700 bg-red-100 border border-red-300 rounded-md dark:bg-red-900 dark:text-red-300 dark:border-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            required 
          />
          <input
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button
            className={`w-full py-2 mt-4 mb-2 rounded text-white transition-colors duration-300 ease-in-out ${loading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-800"}`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Loading..." : "Login"}
          </button>
          {loading && (
            <div className="flex justify-center mt-2">
              <LoadingIndicator />
            </div>
          )}
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              analytics.event('Navigation', 'click', 'register_link_from_login');
              navigate('/register');
            }}
            className="text-blue-500 dark:text-blue-400 hover:underline"
          >
            Don't have an account? Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;