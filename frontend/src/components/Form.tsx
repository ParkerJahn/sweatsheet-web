import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import LoadingIndicator from './LoadingIndicator';
import analytics from '../services/analytics';

interface UserData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  phone_number?: string;
}

function Form() {
  const [formData, setFormData] = useState<UserData>({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
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

    // Track registration attempt
    analytics.auth('registration_attempt', {
      userRole: formData.role,
      method: 'email',
      source: 'registration_form'
    });

    try {
      const response = await api.post('/api/user/register/', formData);
      
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
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            aria-label="Select your role"
          >
            <option value="ATHLETE">Athlete</option>
            <option value="SWEAT_TEAM_MEMBER">Sweat Team Member</option>
            <option value="PRO">SweatPro</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Register
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => {
              analytics.event('Navigation', 'click', 'login_link_from_register');
              navigate('/login');
            }}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Form;