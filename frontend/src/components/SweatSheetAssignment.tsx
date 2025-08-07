import React, { useState, useEffect } from 'react';
import { User, Users, CheckCircle, Plus } from 'lucide-react';
import { sweatSheetApi } from '../api';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface SweatSheet {
  id: number;
  name: string;
  created_at: string;
  assigned_to_name: string | null;
  is_template: boolean;
}

const SweatSheetAssignment: React.FC = () => {
  const [sweatSheets, setSweatSheets] = useState<SweatSheet[]>([]);
  const [athletes, setAthletes] = useState<User[]>([]);
  const [selectedSweatSheet, setSelectedSweatSheet] = useState<SweatSheet | null>(null);
  const [selectedAthlete, setSelectedAthlete] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sweatSheetsResponse, athletesResponse] = await Promise.all([
        sweatSheetApi.getSweatSheets(),
        sweatSheetApi.getAthletes()
      ]);
      
      setSweatSheets(sweatSheetsResponse.data);
      setAthletes(athletesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedSweatSheet || !selectedAthlete) return;

    setAssigning(true);
    try {
      await sweatSheetApi.assignSweatSheet(selectedSweatSheet.id, selectedAthlete);
      
      // Reload data to get updated assignment info
      await loadData();
      
      // Reset selection
      setSelectedSweatSheet(null);
      setSelectedAthlete(null);
      
      alert('SweatSheet assigned successfully!');
    } catch (error) {
      console.error('Error assigning SweatSheet:', error);
      alert('Failed to assign SweatSheet. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

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
    <div className="p-6 bg-gray-50 dark:bg-neutral-800 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-ethnocentric text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Assign SweatSheets
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SweatSheets List */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6">
            <h2 className="font-ethnocentric text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Your SweatSheets
            </h2>
            
            <div className="space-y-3">
              {sweatSheets.map((sweatSheet) => (
                <div
                  key={sweatSheet.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedSweatSheet?.id === sweatSheet.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-blue-400'
                  }`}
                  onClick={() => setSelectedSweatSheet(sweatSheet)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {sweatSheet.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Created: {new Date(sweatSheet.created_at).toLocaleDateString()}
                      </p>
                      {sweatSheet.assigned_to_name && (
                        <div className="flex items-center text-sm text-green-600 mt-1">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Assigned to {sweatSheet.assigned_to_name}
                        </div>
                      )}
                    </div>
                    {sweatSheet.is_template && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Template
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Athletes List */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6">
            <h2 className="font-ethnocentric text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Available Athletes
            </h2>
            
            <div className="space-y-3">
              {athletes.map((athlete) => (
                <div
                  key={athlete.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAthlete === athlete.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-blue-400'
                  }`}
                  onClick={() => setSelectedAthlete(athlete.id)}
                >
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {athlete.first_name} {athlete.last_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{athlete.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      {athlete.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Assignment Action */}
        {selectedSweatSheet && selectedAthlete && (
          <div className="mt-6 bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6">
            <h3 className="font-ethnocentric text-lg font-bold text-gray-800 dark:text-white mb-4">
              Assign SweatSheet
            </h3>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
              <p className="text-gray-800 dark:text-white">
                <span className="font-semibold">SweatSheet:</span> {selectedSweatSheet.name}
              </p>
              <p className="text-gray-800 dark:text-white">
                <span className="font-semibold">Athlete:</span> {athletes.find(a => a.id === selectedAthlete)?.first_name} {athletes.find(a => a.id === selectedAthlete)?.last_name}
              </p>
            </div>

            <button
              onClick={handleAssign}
              disabled={assigning}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center ${
                assigning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Assign SweatSheet
                </>
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            How to Assign SweatSheets:
          </h4>
          <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>1. Select a SweatSheet from the left panel</li>
            <li>2. Choose an athlete from the right panel</li>
            <li>3. Click "Assign SweatSheet" to complete the assignment</li>
            <li>4. The athlete will be able to view and track progress on their assigned SweatSheet</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SweatSheetAssignment; 