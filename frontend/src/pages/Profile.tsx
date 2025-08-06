import { useEffect, useState } from 'react';
import api from '../api';
import Avatar from '../components/Avatar';

interface ProfileData {
    username: string;
    first_name: string;
    last_name: string;
    profile: {
        role: string;
    };
}

function Profile() {
    const [profile, setProfile] = useState<ProfileData | null>(null);

    useEffect(() => {
        api.get('/api/profile/')
            .then(res => {
                setProfile(res.data);
            })
            .catch(err => {
                console.error(err);
            });
    }, []);

    if (!profile) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-md mx-auto mt-12 p-5 rounded-lg shadow-md bg-white dark:bg-neutral-900">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Profile</h1>
            <div className="flex items-center mb-4">
                <Avatar profile={{ first_name: profile.first_name, last_name: profile.last_name }} />
                <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{profile.first_name} {profile.last_name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
                    <p className="text-gray-500 dark:text-gray-400">{profile.profile.role === 'PRO' ? 'SweatPro' : 'SweatAthlete'}</p>
                </div>
            </div>
        </div>
    );
}

export default Profile;