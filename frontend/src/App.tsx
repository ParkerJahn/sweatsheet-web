import Header from "./components/Header";
import Footer from "./components/Footer";
import './components/Header.css';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Calendar from './pages/Calendar';
import Profile from './pages/Profile';
import SweatSheet from './pages/SweatSheet';
import { ACCESS_TOKEN } from './constants';

// Initialize theme on app load
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Apply theme immediately
initializeTheme();

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

// Wrapper for login page - redirect authenticated users to home
function LoginWrapper() {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) {
    return <Navigate to="/" />;
  }
  return <Login />;
}

// Wrapper for register page - redirect authenticated users to home
function RegisterWrapper() {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) {
    return <Navigate to="/" />;
  }
  return <Register />;
}

function App() {

  
  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white">
      <div className="bg-neutral-100 dark:bg-neutral-900">
        <Header />
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
              </ProtectedRoute>
             }
          />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/sweatsheet" element={
            <ProtectedRoute>
              <SweatSheet />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/register" element={<RegisterWrapper />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </BrowserRouter>
      <Footer />
    </div>
  );

}

export default App;