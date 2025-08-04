import './Header.css';
import { useEffect, useRef, useState } from 'react';
import { Moon, Sun, Menu, X } from 'lucide-react';

function Header() {
    return (
    <>
    <div className="flex justify-center items-center relative p-5">
      <img 
      className="block dark:hidden w-[160px] h-[95px] transition-opacity duration-300" 
      src="src/assets/lightmodelogo.png" 
      alt="DRP Workshop Light Logo"/>
      <img 
      className="hidden dark:block w-[160px] h-[95px] transition-opacity duration-300" 
      src="src/assets/darkmodelogo.png" 
      alt="DRP Workshop Dark Logo"/>
        <div className="flex ml-10 justify-end items-center relative">
          <SideDrawer/>
        </div>
    </div>
    </>
  );
}
const SideDrawer: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
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

  // Apply dark mode class to <body>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <>
      {/* Open Button */}
      <button className="cursor-pointer items-center justify-center p-1 bg-gray-300 dark:bg-black text-black dark:text-white rounded shadow"
        id="open-btn"
        onClick={() => setIsOpen(true)}
      >
        {isOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <div
        id="mySidenav"
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-64 bg-neutral-200 dark:bg-neutral-900 text-black dark:text-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 ${
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
          <button className="text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black text-black dark:text-white px-4 py-2 rounded transition">
            <a className="text-black dark:text-white" href="/">Home</a>
          </button>
          <button className="text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black text-black dark:text-white px-4 py-2 rounded transition">
            <a className="text-black dark:text-white" href="/about">About</a>
            </button>
            <button className="text-left hover:outline hover:outline-neutral-300 dark:hover:outline-neutral-800 block w-full hover:bg-neutral-100 dark:hover:bg-black text-black dark:text-white px-4 py-2 rounded transition">
            <a className="text-black dark:text-white" href="/contact">Contact</a>
          </button>
        </nav>
      </div>
    </>
  );
};
export default Header;
