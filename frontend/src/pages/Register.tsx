import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from '../components/LoadingIndicator';
import analytics from '../services/analytics';

interface UserData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  password2: string;
  role: string;
  phone_number?: string;
}

function Register() {
  const [formData, setFormData] = useState<UserData>({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    password2: '',
    role: 'ATHLETE',
    phone_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Track registration attempt
    analytics.auth('registration_attempt', {
      userRole: formData.role,
      method: 'email',
      source: 'registration_form'
    });

    try {
      const payload = {
        username: formData.username,
        password: formData.password,
        password2: formData.password2,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        profile: {
          phone_number: formData.phone_number,
          role: formData.role
        }
      };

      const response = await api.post('/api/user/register/', payload);
      
      if (response.status === 201) {
        // Track successful registration
        analytics.auth('registration_success', {
          userRole: formData.role,
          method: 'email',
          source: 'registration_form'
        });

        // Track conversion
        analytics.conversion('user_registration', {
          value: 1,
          userRole: formData.role,
          source: 'organic'
        });

        navigate('/login');
      }
    } catch (error: unknown) {
      // Track registration failure
      analytics.auth('registration_failure', {
        userRole: formData.role,
        method: 'email',
        source: 'registration_form'
      });

      if (error && typeof error === 'object' && 'response' in error) {
        const responseError = error as { response: { data: { username?: string[]; email?: string[]; password?: string[] } } };
        if (responseError.response?.data) {
          const errorData = responseError.response.data;
          if (errorData.username) {
            setError(`Username error: ${errorData.username[0]}`);
          } else if (errorData.email) {
            setError(`Email error: ${errorData.email[0]}`);
          } else if (errorData.password) {
            setError(`Password error: ${errorData.password[0]}`);
          } else {
            setError('Registration failed. Please check your information.');
          }
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }

      // Track error in analytics
      analytics.error(error as Error, { 
        context: 'user_registration',
        role: formData.role,
        has_phone: !!formData.phone_number
      });
    } finally {
      setLoading(false);
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
        <h1 className="font-ethnocentric text-2xl font-semibold text-gray-800 dark:text-white mb-4">Register</h1>
        
        {error && (
          <div className="w-full p-3 mb-4 text-red-700 bg-red-100 border border-red-300 rounded-md dark:bg-red-900 dark:text-red-300 dark:border-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <select
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="role"
            value={formData.role}
            onChange={handleChange}
            aria-label="Select your role"
          >
            <option value="PRO">SweatPro (coach, trainer, provider)</option>
            <option value="SWEAT_TEAM_MEMBER">SweatTeamMember (staff, admin, team member)</option>
            <option value="ATHLETE">SweatAthlete (player, client, patient)</option>
          </select>

          {/* Name Fields */}
          <input
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            name="first_name"
            placeholder="First Name" 
            value={formData.first_name} 
            onChange={handleChange}
            required 
          />
          <input
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            name="last_name"
            placeholder="Last Name" 
            value={formData.last_name} 
            onChange={handleChange}
            required 
          />
          <input 
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="email"
            name="email"
            placeholder="Email" 
            value={formData.email} 
            onChange={handleChange}
            required 
          />
          <input 
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="tel"
            name="phone_number"
            placeholder="Phone Number" 
            value={formData.phone_number} 
            onChange={handleChange}
            required 
          />

          {/* Username and Password */}
          <input
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            name="username"
            placeholder="Username" 
            value={formData.username} 
            onChange={handleChange}
            required 
          />
          <input
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            name="password"
            placeholder="Password" 
            value={formData.password} 
            onChange={handleChange}
            required 
          />
          <input
            className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            name="password2"
            placeholder="Confirm Password"
            value={formData.password2}
            onChange={handleChange}
            required
          />

          <button
            className={`w-full py-2 mt-4 mb-2 rounded text-white transition-colors duration-300 ease-in-out ${loading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-800"}`}
            type="submit"
            disabled={loading}
          >
            {loading ? "Loading..." : "Register"}
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
              analytics.event('Navigation', 'click', 'login_link_from_register');
              navigate('/login');
            }}
            className="text-blue-500 dark:text-blue-400 hover:underline"
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;