import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Team from './pages/Team';
import SweatSheet from './pages/SweatSheet';
import Calendar from './pages/Calendar';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Shop from './pages/Shop';
import Header from './components/Header';
import LoadingPage from './components/LoadingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingProvider } from './contexts/LoadingContext';
import analytics from './services/analytics';

interface DecodedToken {
  user_id: string;
  exp: number;
}

// Component to track page views
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    analytics.pageView(location.pathname + location.search, document.title);
  }, [location]);

  return <>{children}</>;
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage
    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      } else {
        // Default to light mode if no preference is saved
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };

    // Initialize Google Analytics
    analytics.initialize();

    // Initialize theme first
    initializeTheme();

    // Check for existing authentication and set user properties
    const initializeAuth = () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        try {
          const decodedToken = jwtDecode<DecodedToken>(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp > currentTime) {
            // Get user profile data if available
            const userProfile = localStorage.getItem('user_profile');
            if (userProfile) {
              const profile = JSON.parse(userProfile);
              
              // Set user properties in Google Analytics
              analytics.setUserProperties(decodedToken.user_id, {
                user_role: profile.role || 'ATHLETE',
                user_type: 'authenticated',
                subscription_tier: profile.role === 'PRO' ? 'premium' : 'free'
              });

              // Track user session start
              analytics.event('Session', 'start', 'authenticated_user');
            }
          } else {
            // Token expired, clean up
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            localStorage.removeItem('user_profile');
          }
        } catch (error) {
          console.error('Error decoding token:', error);
          analytics.error(error as Error, { context: 'token_decode' });
        }
      } else {
        // Track anonymous user session
        analytics.event('Session', 'start', 'anonymous_user');
      }
    };

    // Initialize with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeAuth();
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Track app performance
  useEffect(() => {
    const startTime = performance.now();
    
    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      analytics.timing('App', 'load_time', loadTime);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  // Track errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.error(event.error || new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.error(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'promise_rejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!isInitialized) {
    return <LoadingPage />;
  }

  return (
    <LoadingProvider>
      <Router>
        <AnalyticsWrapper>
          <div className="App bg-white dark:bg-neutral-700 min-h-screen">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/register" replace />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/home" 
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/team" 
                  element={
                    <ProtectedRoute>
                      <Team />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/sweatsheet" 
                  element={
                    <ProtectedRoute>
                      <SweatSheet />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/calendar" 
                  element={
                    <ProtectedRoute>
                      <Calendar />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/messages" 
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/shop" 
                  element={
                    <ProtectedRoute>
                      <Shop />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </AnalyticsWrapper>
      </Router>
    </LoadingProvider>
  );
}

export default App;