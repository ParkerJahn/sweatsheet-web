import React, { useState, useEffect } from 'react';
import SweatSheetCreator from '../components/SweatSheetCreator';
import SweatSheetViewer from '../components/SweatSheetViewer';
import api from '../api';

const SweatSheet: React.FC = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await api.get('/api/profile/');
        setUserRole(response.data.profile.role);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-neutral-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {(userRole === 'PRO' || userRole === 'SWEAT_TEAM_MEMBER') ? (
        <SweatSheetCreator />
      ) : (
        <SweatSheetViewer />
      )}
    </div>
  );
};

export default SweatSheet; 