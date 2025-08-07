import React, { useState, useEffect } from 'react';
import SweatSheetCreator from '../components/SweatSheetCreator';
import SweatSheetViewer from '../components/SweatSheetViewer';
import api from '../api';
import LoadingIndicator from '../components/LoadingIndicator';

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
      <div className="flex items-center justify-center min-h-screen bg-neutral-200 dark:bg-neutral-800">
        <LoadingIndicator />
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