import React, { useState, useEffect } from 'react';
import { Crown, Shield, UserCheck } from 'lucide-react';
import api from '../api';
import LoadingIndicator from '../components/LoadingIndicator';

interface TeamMember {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  profile: {
    role: string;
    phone_number: string;
  };
}

const Team: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true);
        
        // Load user's role and team data in parallel
        const [profileResponse, usersResponse] = await Promise.all([
          api.get('/api/profile/'),
          api.get('/api/users/')
        ]);
        
        setUserRole(profileResponse.data.profile.role);
        setTeamMembers(usersResponse.data);
      } catch (error) {
        console.error('Error loading team data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, []);

  // Filter team members by role
  const sweatPros = teamMembers.filter(member => member.profile.role === 'PRO');
  const sweatTeamMembers = teamMembers.filter(member => member.profile.role === 'SWEAT_TEAM_MEMBER');
  const sweatAthletes = teamMembers.filter(member => member.profile.role === 'ATHLETE');

  const TeamSection: React.FC<{ 
    title: string; 
    members: TeamMember[]; 
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
  }> = ({ title, members, icon, bgColor, borderColor }) => (
    <div className={`${bgColor} ${borderColor} border-2 rounded-lg p-6 mb-6`}>
      <div className="flex items-center mb-4">
        {icon}
        <h2 className="font-ethnocentric text-xl font-bold ml-2">{title}</h2>
        <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {members.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 italic">No {title.toLowerCase()} found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div key={member.id} className="bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                  {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {member.first_name} {member.last_name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{member.username}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>{member.email}</p>
                {member.profile.phone_number && (
                  <p>{member.profile.phone_number}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-200 dark:bg-neutral-800">
        <LoadingIndicator />
      </div>
    );
  }

  // Show team page to all users, but with different content based on role
  const isTeamLeader = userRole === 'PRO' || userRole === 'SWEAT_TEAM_MEMBER';

  return (
    <div className="p-6 bg-gray-50 dark:bg-neutral-800 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-ethnocentric text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Your Team
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isTeamLeader 
              ? "Manage your team hierarchy and view all members"
              : "View your team members and trainers"
            }
          </p>
        </div>

        {/* Team Hierarchy */}
        <div className="space-y-6">
          {/* SweatPros Section */}
          <TeamSection
            title="SweatPros"
            members={sweatPros}
            icon={<Crown className="w-6 h-6 text-yellow-600" />}
            bgColor="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
            borderColor="border-yellow-300 dark:border-yellow-700"
          />

          {/* SweatTeamMembers Section */}
          <TeamSection
            title="SweatTeamMembers"
            members={sweatTeamMembers}
            icon={<Shield className="w-6 h-6 text-blue-600" />}
            bgColor="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
            borderColor="border-blue-300 dark:border-blue-700"
          />

          {/* SweatAthletes Section */}
          <TeamSection
            title="SweatAthletes"
            members={sweatAthletes}
            icon={<UserCheck className="w-6 h-6 text-green-600" />}
            bgColor="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
            borderColor="border-green-300 dark:border-green-700"
          />
        </div>

        {/* Team Statistics */}
        <div className="mt-8 bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-md">
          <h2 className="font-ethnocentric text-xl font-bold text-gray-800 dark:text-white mb-4">
            Team Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{sweatPros.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">SweatPros</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sweatTeamMembers.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sweatAthletes.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Athletes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team; 