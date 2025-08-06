


import lightModeLogo from '/lightmodelogo.png';
import darkModeLogo from '/darkmodelogo.png';

const LoadingIndicator = () => {
    return (
        <div className="flex justify-center items-center">
            <img 
                src={lightModeLogo} 
                alt="Loading..." 
                className="w-10 h-10 animate-flip-vertical dark:hidden"
            />
            <img 
                src={darkModeLogo} 
                alt="Loading..." 
                className="w-10 h-10 animate-flip-vertical hidden dark:block"
            />
        </div>
    );
};

export default LoadingIndicator;