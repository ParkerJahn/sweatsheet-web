import { useEffect, useState } from 'react';
import { Edit, Save, X, Mail, Phone } from 'lucide-react';
import api from '../api';
import Avatar from '../components/Avatar';
import LoadingIndicator from '../components/LoadingIndicator';

interface ProfileData {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    profile: {
        role: string;
        phone_number: string;
    };
}

interface EditFormData {
    first_name?: string;
    last_name?: string;
    email?: string;
    profile?: {
        phone_number?: string;
    };
}

function Profile() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState<EditFormData>({});

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await api.get('/api/profile/');
            setProfile(response.data);
            setEditForm({
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                email: response.data.email,
                profile: {
                    phone_number: response.data.profile.phone_number || ''
                }
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await api.put('/api/profile/', editForm);
            setProfile(response.data);
            setIsEditing(false);
        } catch (err) {
            console.error('Error updating profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setEditForm({
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                profile: {
                    phone_number: profile.profile.phone_number || ''
                }
            });
        }
        setIsEditing(false);
    };

    const getRoleDisplay = (role: string) => {
        switch (role) {
            case 'PRO': return 'SweatPro';
            case 'SWEAT_TEAM_MEMBER': return 'SweatTeamMember';
            case 'ATHLETE': return 'SweatAthlete';
            default: return role;
        }
    };

    if (!profile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-200 dark:bg-neutral-800">
                <LoadingIndicator />
            </div>
        );
    }

    return (
        <div className="mt-12 max-w-2xl mx-auto relative p-1 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-600 to-cyan-500 shadow-lg">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="font-ethnocentric text-2xl font-semibold text-gray-800 dark:text-white">Profile</h1>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-6">
                    <Avatar profile={{ first_name: profile.first_name, last_name: profile.last_name }} />
                    
                    <div className="flex-1">
                        {!isEditing ? (
                            // Display Mode
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                                        {profile.first_name} {profile.last_name}
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400">@{profile.username}</p>
                                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                                        {getRoleDisplay(profile.profile.role)}
                                    </p>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-800 dark:text-white">{profile.email}</span>
                                    </div>
                                    {profile.profile.phone_number && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-800 dark:text-white">{profile.profile.phone_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            // Edit Mode
                            <div className="space-y-4 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.first_name || ''}
                                            onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editForm.last_name || ''}
                                            onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editForm.email || ''}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={editForm.profile?.phone_number || ''}
                                        onChange={(e) => setEditForm({
                                            ...editForm, 
                                            profile: {...editForm.profile, phone_number: e.target.value}
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;