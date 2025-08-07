

import { useEffect, useState } from 'react';
import api from '../api';

function Home() {
    const [welcomeMessage, setWelcomeMessage] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await api.get('/api/profile/');
            
            const lastLogin = localStorage.getItem('lastLogin');
            if (lastLogin) {
                const messages = [
                    `WELCOME BACK, ${response.data.first_name.toUpperCase()}!`,
                    "LET'S GET TO WORK!",
                    "NO BETTER DAY THAN TODAY!"
                ];
                const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                setWelcomeMessage(randomMessage);
            } else {
                setWelcomeMessage(`WELCOME, ${response.data.first_name.toUpperCase()}!`);
            }
            localStorage.setItem('lastLogin', new Date().toISOString());
        } catch (err) {
            console.error('Error loading profile:', err);
            setWelcomeMessage("WELCOME!");
        }
    };

    return (
        <div>
            <div>
                <h1 className="font-ethnocentric m-10 text-4xl font-bold text-center text-gray-800 dark:text-white">
                    {welcomeMessage}
                </h1>
            </div>
        </div>
    );
}

export default Home;