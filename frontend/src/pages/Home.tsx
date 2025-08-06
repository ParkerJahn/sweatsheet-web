

import { useEffect, useState } from 'react';
import api from '../api';

interface ProfileData {
    first_name: string;
}

function Home() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [welcomeMessage, setWelcomeMessage] = useState("");

    useEffect(() => {
        api.get('/api/profile/')
            .then(res => {
                setProfile(res.data);
                const lastLogin = localStorage.getItem('lastLogin');
                if (lastLogin) {
                    const messages = ["Welcome Back!", "Let's Get To Work!", "No Better Day Than Today!"];
                    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
                    setWelcomeMessage(randomMessage);
                } else {
                    setWelcomeMessage(`Welcome, ${res.data.first_name}!`);
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
                <h1>{welcomeMessage}</h1>
            </div>
        </div>
    );
}

export default Home;