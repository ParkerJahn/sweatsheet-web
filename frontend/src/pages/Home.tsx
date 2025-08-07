

import { useEffect, useState } from 'react';
import api from '../api';

function Home() {
    const [welcomeMessage, setWelcomeMessage] = useState("");

    useEffect(() => {
        api.get('/api/profile/')
            .then(res => {
                const lastLogin = localStorage.getItem('lastLogin');
                if (lastLogin) {
                    const messages = [
                        `WELCOME BACK, ${res.data.first_name.toUpperCase()}!`,
                        "LET'S GET TO WORK!",
                        "NO BETTER DAY THAN TODAY!"
                    ];
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    setWelcomeMessage(randomMessage);
                } else {
                    setWelcomeMessage(`WELCOME, ${res.data.first_name.toUpperCase()}!`);
                }
                localStorage.setItem('lastLogin', new Date().toISOString());
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

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