import './Header.css';
import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Menu, X, HelpCircle, Settings } from 'lucide-react';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants';
import api from '../api';
import Avatar from './Avatar';

interface ProfileData {
    first_name: string;
    last_name: string;
}

function Header() {
    const [profile, setProfile] = useState<ProfileData | null>(null);

    useEffect(() => {
        if (localStorage.getItem(ACCESS_TOKEN)) {
            api.get('/api/profile/')
                .then(res => {
                    // Transform the data to match Avatar component expectations
                    const profileData = {
                        first_name: res.data.first_name,
                        last_name: res.data.last_name
                    };
                    setProfile(profileData);
                })
                .catch(err => {
                    console.error(err);
                });
        }
    }, []);

    return (
    <>
    <div className="flex justify-center items-center relative p-5">
        {profile && (
            <a href="/profile" className="cursor-pointer hover:scale-105 transition-transform duration-200 absolute right-4">
                <Avatar profile={profile} />
            </a>
        )}
      <img 
      className="block dark:hidden w-[200px] h-[120px] transition-opacity duration-300" 
      src="lightmodelogo.png" 
      alt="DRP Workshop Light Logo"/>
      <img 
      className="hidden dark:block w-[200px] h-[120px] transition-opacity duration-300" 
      src="darkmodelogo.png" 
      alt="DRP Workshop Dark Logo"/>
        <div className="flex ml-10 justify-end items-center relative">
          <SideDrawer/>
        </div>
        {/* Animated line at the bottom of header */}
        <div className="animated-line"></div>
        {/* Alternative flowing line animation (uncomment to use instead) */}
        {/* <div className="flowing-line"></div> */}
    </div>
    </>
  );
}
const SideDrawer: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Load theme preference from localStorage on initial render
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Default to light mode if no preference is saved
    return false;
  });
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Toggle dark mode and save to localStorage
  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  // Close sidebar if clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Apply dark mode class to <body> and save to localStorage
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <>
      {/* Open Button */}
      <button className="w-15 h-15 cursor-pointer items-center justify-center p-1 bg-gray-300 dark:bg-black text-black dark:text-white rounded shadow"
        id="open-btn"
        onClick={() => setIsOpen(true)}
      >
        {isOpen ? <X className="w-10 h-10" /> : <Menu className="w-10 h-10" />}
      </button>

      {/* Sidebar */}
      <div
        id="mySidenav"
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-64 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Theme Toggle Button */}
        <button
          id="themeToggle"
          onClick={toggleDarkMode}
          className="mt-12 ml-5 bg-neutral-400 dark:bg-neutral-600 px-4 py-2 rounded hover:bg-neutral-500 dark:hover:bg-neutral-800 hover:outline hover:outline-neutral-900 dark:hover:outline-neutral-500 transition animate-pulse"
          onAnimationEnd={(e) => e.currentTarget.classList.remove('animate-pulse')}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Example Navigation Links */}
        <nav className="mt-4 space-y-2 pl-2">
          <a 
            href="/"
            className="font-ethnocentric text-left text-black dark:text-white hover:text-white dark:hover:text-black bg-blue-500 dark:bg-blue-600 hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-700 dark:hover:bg-neutral-100 px-4 py-2 rounded transition"
            onClick={() => setIsOpen(false)}
            >
            Home
          </a>
          <a 
           href="/calendar"
           className="font-ethnocentric text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black px-4 py-2 rounded transition"
           onClick={() => setIsOpen(false)}
           >
            Calendar
          </a>
          <a 
           href="/messages"
           className="font-ethnocentric text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black px-4 py-2 rounded transition"
           onClick={() => setIsOpen(false)}
           >
            Messages
          </a>
          <a
            href="/clients"
            className="font-ethnocentric text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black px-4 py-2 rounded transition"
            onClick={() => setIsOpen(false)}
            >
            Your Clients
          </a>
          <a
            href="/shop"
            className="font-ethnocentric text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black px-4 py-2 rounded transition"
            onClick={() => setIsOpen(false)}
            >
            Shop DRP
          </a>
          <a 
            href="/profile"
            className="font-ethnocentric text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black px-4 py-2 rounded transition text-black dark:text-white flex items-center gap-2"
            onClick={() => setIsOpen(false)}
            >
            Profile
          </a>
          <a 
            href="/settings"
            className="font-ethnocentric text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black px-4 py-2 rounded transition text-black dark:text-white flex items-center gap-2"
            onClick={() => setIsOpen(false)}
            >
            Settings <Settings className="w-5 h-5" /> 
          </a>
          <button className="font-ethnocentric text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-red-100 dark:hover:bg-red-300 px-4 py-2 rounded transition text-red-600 dark:text-red-600 text-shadow" 
          onClick={() => {
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            window.location.reload();
          }}>
            Logout
          </button>
          <a 
            href="/help"
            className="font-ethnocentric text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black px-4 py-2 rounded transition text-blue-700 dark:text-blue-500"
            onClick={() => setIsOpen(false)}
            >
            Help <HelpCircle className="w-5 h-5"/>
          </a>
        </nav>
      </div>
    </>
  );
};
export default Header;
