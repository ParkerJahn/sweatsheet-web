import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Calendar, User, Trophy } from 'lucide-react';
import { sweatSheetApi } from '../api';

interface Exercise {
  id: number;
  workout_category: {
    id: number;
    name: string;
  };
  specific_workout: {
    id: number;
    name: string;
  };
  sets: string;
  reps: string;
  weight: string;
  completed: boolean;
  order: number;
}

interface Section {
  id: number;
  section_number: number;
  date: string;
  exercises: Exercise[];
}

interface Phase {
  id: number;
  phase_number: number;
  is_completed: boolean;
  completed_at: string | null;
  sections: Section[];
}

interface SweatSheet {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_template: boolean;
  phases: Phase[];
  creator_name: string;
  assigned_to_name: string;
}

const SweatSheetViewer: React.FC = () => {
  const [sweatSheets, setSweatSheets] = useState<SweatSheet[]>([]);
  const [selectedSweatSheet, setSelectedSweatSheet] = useState<SweatSheet | null>(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSweatSheets();
  }, []);

  const loadSweatSheets = async () => {
    try {
      const response = await sweatSheetApi.getSweatSheets();
      setSweatSheets(response.data);
      if (response.data.length > 0) {
        setSelectedSweatSheet(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading SweatSheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExerciseCompletion = async (exerciseId: number) => {
    try {
      await sweatSheetApi.completeExercise(exerciseId);
      // Reload the selected SweatSheet to get updated completion status
      if (selectedSweatSheet) {
        const response = await sweatSheetApi.getSweatSheet(selectedSweatSheet.id);
        setSelectedSweatSheet(response.data);
      }
    } catch (error) {
      console.error('Error updating exercise completion:', error);
    }
  };

  const getCompletionPercentage = (sweatSheet: SweatSheet) => {
    let totalExercises = 0;
    let completedExercises = 0;

    sweatSheet.phases.forEach(phase => {
      phase.sections.forEach(section => {
        section.exercises.forEach(exercise => {
          totalExercises++;
          if (exercise.completed) {
            completedExercises++;
          }
        });
      });
    });

    return totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-neutral-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your SweatSheets...</p>
        </div>
      </div>
    );
  }

  if (sweatSheets.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-neutral-800 min-h-screen">
        <div className="max-w-4xl mx-auto text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="font-ethnocentric text-2xl font-bold text-gray-800 dark:text-white mb-4">
            No SweatSheets Assigned
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your trainer hasn't assigned any SweatSheets yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-neutral-800 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-ethnocentric text-3xl font-bold text-gray-800 dark:text-white mb-6">
          My SweatSheets
        </h1>

        {/* SweatSheet Selection */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            {sweatSheets.map((sweatSheet) => (
              <button
                key={sweatSheet.id}
                onClick={() => setSelectedSweatSheet(sweatSheet)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSweatSheet?.id === sweatSheet.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-400'
                }`}
              >
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                    {sweatSheet.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <User className="w-4 h-4 mr-1" />
                    {sweatSheet.creator_name}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(sweatSheet.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      {getCompletionPercentage(sweatSheet)}% Complete
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected SweatSheet Display */}
        {selectedSweatSheet && (
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-ethnocentric text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {selectedSweatSheet.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Created by {selectedSweatSheet.creator_name}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {getCompletionPercentage(selectedSweatSheet)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
              </div>
            </div>

            {/* Phase Navigation */}
            <div className="mb-6">
              <div className="flex space-x-2">
                {selectedSweatSheet.phases.map((phase, phaseIndex) => (
                  <button
                    key={phase.id}
                    onClick={() => setCurrentPhase(phaseIndex + 1)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      currentPhase === phaseIndex + 1
                        ? 'bg-blue-600 text-white'
                        : phase.is_completed
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    Phase {phaseIndex + 1}
                    {phase.is_completed && <CheckCircle className="w-4 h-4 ml-1 inline" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Phase Display */}
            {selectedSweatSheet.phases[currentPhase - 1] && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-ethnocentric text-xl font-bold text-gray-800 dark:text-white">
                    Phase {currentPhase}
                  </h3>
                  {selectedSweatSheet.phases[currentPhase - 1].is_completed && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-semibold">Completed</span>
                    </div>
                  )}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedSweatSheet.phases[currentPhase - 1].sections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            Day {sectionIndex + 1}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(section.date).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Exercises */}
                      <div className="space-y-2">
                        {section.exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className={`p-2 rounded border ${
                              exercise.completed
                                ? 'border-green-200 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-sm text-gray-800 dark:text-white">
                                  {exercise.specific_workout.name}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {exercise.sets}x{exercise.reps}
                                  {exercise.weight && ` @ ${exercise.weight}lbs`}
                                </div>
                              </div>
                              <button
                                onClick={() => toggleExerciseCompletion(exercise.id)}
                                className={`ml-2 p-1 rounded transition-colors ${
                                  exercise.completed
                                    ? 'text-green-600 hover:text-green-700'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                {exercise.completed ? (
                                  <CheckCircle className="w-5 h-5" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SweatSheetViewer; 