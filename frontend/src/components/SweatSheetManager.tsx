import React, { useState, useEffect } from 'react';
import { User, Users, CheckCircle, Calendar, ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { sweatSheetApi } from '../api';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

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





const SweatSheetManager: React.FC = () => {
  const [athletes, setAthletes] = useState<User[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);
  const [sweatSheet, setSweatSheet] = useState<SweatSheet | null>(null);
  const [workoutCategories, setWorkoutCategories] = useState<any[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      console.log('Loading initial data...');
      const [athletesResponse, categoriesResponse, exercisesResponse] = await Promise.all([
        sweatSheetApi.getAthletes(),
        sweatSheetApi.getWorkoutCategories(),
        sweatSheetApi.getAllExercises()
      ]);
      
      console.log('Athletes:', athletesResponse.data);
      console.log('Categories:', categoriesResponse.data);
      console.log('Exercises:', exercisesResponse.data);
      
      setAthletes(athletesResponse.data);
      setWorkoutCategories(categoriesResponse.data);
      setWorkoutExercises(exercisesResponse.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAthleteSweatSheet = async (athleteId: number) => {
    try {
      console.log('Loading SweatSheet for athlete ID:', athleteId);
      
      // Load all SweatSheets from API
      const response = await sweatSheetApi.getSweatSheets();
      console.log('All SweatSheets loaded:', response.data);
      
      // Find the athlete's SweatSheet
      const athleteSweatSheet = response.data.find((sheet: any) => sheet.assigned_to === athleteId);
      
      if (athleteSweatSheet) {
        console.log('Found existing SweatSheet:', athleteSweatSheet);
        setSweatSheet(athleteSweatSheet);
        setCurrentPhase(1);
        setCurrentSection(0);
      } else {
        console.log('No existing SweatSheet found, creating new one...');
        await createNewSweatSheet(athleteId);
      }
    } catch (error) {
      console.error('Error loading athlete SweatSheet:', error);
    }
  };

  const createNewSweatSheet = async (athleteId: number) => {
    try {
      const athlete = athletes.find(a => a.id === athleteId);
      if (!athlete) return;

      console.log('Creating new SweatSheet for:', athlete.first_name);

      // Create new SweatSheet
      const newSweatSheetData = {
        name: `${athlete.first_name}'s Training Program`,
        assigned_to: athleteId
      };

      const response = await sweatSheetApi.createSweatSheet(newSweatSheetData);
      console.log('Created SweatSheet:', response.data);
      const newSweatSheet = response.data;

      // Initialize the first phase with 8 sections and 6 exercises each
      await initializeSweatSheet(newSweatSheet.id);

      // Wait a moment for the backend to process
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload the SweatSheet to get the full structure
      console.log('Reloading SweatSheet after creation...');
      const reloadResponse = await sweatSheetApi.getSweatSheet(newSweatSheet.id);
      console.log('Reloaded SweatSheet data:', reloadResponse.data);
      
      setSweatSheet(reloadResponse.data);
      setCurrentPhase(1);
      setCurrentSection(0);
    } catch (error) {
      console.error('Error creating new SweatSheet:', error);
    }
  };

  const initializeSweatSheet = async (sweatSheetId: number) => {
    try {
      console.log('Initializing SweatSheet with ID:', sweatSheetId);
      
      // Create Phase 1
      const phaseData = {
        phase_number: 1,
        is_completed: false
      };
      
      const phaseResponse = await sweatSheetApi.createPhase(sweatSheetId, phaseData);
      const phaseId = phaseResponse.data.id;
      console.log('Created phase with ID:', phaseId);

      // Create 8 sections for Phase 1
      for (let sectionNum = 1; sectionNum <= 8; sectionNum++) {
        const sectionData = {
          section_number: sectionNum,
          date: new Date(Date.now() + (sectionNum - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        
        const sectionResponse = await sweatSheetApi.createSection(phaseId, sectionData);
        const sectionId = sectionResponse.data.id;
        console.log(`Created section ${sectionNum} with ID:`, sectionId);

        // Create 6 exercises for each section
        for (let exerciseNum = 1; exerciseNum <= 6; exerciseNum++) {
          const exerciseData = {
            workout_category_id: 1, // Default to first category
            specific_workout_id: 1, // Default to first exercise
            sets: '',
            reps: '',
            weight: '',
            completed: false,
            order: exerciseNum
          };
          
          const exerciseResponse = await sweatSheetApi.createExercise(sectionId, exerciseData);
          console.log(`Created exercise ${exerciseNum} with ID:`, exerciseResponse.data.id);
        }
      }
      
      console.log('SweatSheet initialization complete');
    } catch (error) {
      console.error('Error initializing SweatSheet:', error);
    }
  };

  const handleAthleteSelect = async (athlete: User) => {
    setSelectedAthlete(athlete);
    await loadAthleteSweatSheet(athlete.id);
    setCurrentPhase(1);
    setCurrentSection(0);
  };

  const toggleExerciseCompletion = async (exerciseId: number) => {
    try {
      await sweatSheetApi.completeExercise(exerciseId);
      // Reload the SweatSheet to get updated completion status
      if (selectedAthlete) {
        await loadAthleteSweatSheet(selectedAthlete.id);
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

  const getSpecificWorkouts = (categoryName: string) => {
    console.log('Getting specific workouts for category:', categoryName);
    console.log('Available categories:', workoutCategories);
    console.log('Available exercises:', workoutExercises);
    
    const category = workoutCategories.find(cat => cat.name === categoryName);
    console.log('Found category:', category);
    
    if (!category) return [];
    
    const exercises = workoutExercises.filter(exercise => exercise.category.id === category.id);
    console.log('Filtered exercises:', exercises);
    return exercises;
  };

  const updateExercise = async (exerciseId: number, field: string, value: string | boolean) => {
    try {
      // This would need a proper update API endpoint
      console.log('Updating exercise:', exerciseId, field, value);
      // For now, we'll just reload the SweatSheet
      if (selectedAthlete) {
        await loadAthleteSweatSheet(selectedAthlete.id);
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const addExercise = async (sectionId: number) => {
    try {
      const exerciseData = {
        workout_category_id: 1,
        specific_workout_id: 1,
        sets: '',
        reps: '',
        weight: '',
        completed: false,
        order: 1
      };
      
      await sweatSheetApi.createExercise(sectionId, exerciseData);
      
      // Reload the SweatSheet
      if (selectedAthlete) {
        await loadAthleteSweatSheet(selectedAthlete.id);
      }
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  const removeExercise = async (exerciseId: number) => {
    try {
      // This would need a proper delete API endpoint
      console.log('Removing exercise:', exerciseId);
      // For now, we'll just reload the SweatSheet
      if (selectedAthlete) {
        await loadAthleteSweatSheet(selectedAthlete.id);
      }
    } catch (error) {
      console.error('Error removing exercise:', error);
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
      <div className="max-w-7xl mx-auto">
        <h1 className="font-ethnocentric text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Athlete SweatSheet Manager
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Athletes List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6">
              <h2 className="font-ethnocentric text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Your Athletes
              </h2>
              
              <div className="space-y-3">
                {athletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAthlete?.id === athlete.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-neutral-700 hover:border-blue-400'
                    }`}
                    onClick={() => handleAthleteSelect(athlete)}
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

          {/* SweatSheet Display */}
          <div className="lg:col-span-2">
            {!selectedAthlete ? (
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="font-ethnocentric text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Select an Athlete
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose an athlete from the list to view their SweatSheet and track progress.
                </p>
              </div>
            ) : !sweatSheet ? (
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="font-ethnocentric text-xl font-bold text-gray-800 dark:text-white mb-2">
                  Creating SweatSheet...
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Setting up a new training program for {selectedAthlete.first_name} {selectedAthlete.last_name}.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6">
                {/* Debug Info */}
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info:</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Categories loaded: {workoutCategories.length} | 
                    Exercises loaded: {workoutExercises.length} | 
                    SweatSheet phases: {sweatSheet.phases.length} | 
                    Current section exercises: {sweatSheet.phases[currentPhase - 1]?.sections[currentSection]?.exercises.length || 0}
                  </p>
                </div>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-ethnocentric text-2xl font-bold text-gray-800 dark:text-white mb-2">
                      {sweatSheet.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Athlete: {selectedAthlete.first_name} {selectedAthlete.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {getCompletionPercentage(sweatSheet)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
                  </div>
                </div>

                {/* Phase Navigation */}
                <div className="mb-6">
                  <div className="flex space-x-2">
                    {sweatSheet.phases.map((phase, phaseIndex) => (
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
                {sweatSheet.phases[currentPhase - 1] && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-ethnocentric text-xl font-bold text-gray-800 dark:text-white">
                        Phase {currentPhase}
                      </h3>
                      {sweatSheet.phases[currentPhase - 1].is_completed && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm font-semibold">Completed</span>
                        </div>
                      )}
                    </div>

                    {/* Single Section Display with Navigation */}
                    <div className="relative">
                      {/* Navigation Arrows */}
                      <button
                        onClick={() => setCurrentSection(prev => prev > 0 ? prev - 1 : 7)}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-neutral-900 rounded-full p-2 shadow-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                        disabled={currentSection === 0}
                      >
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </button>
                      
                      <button
                        onClick={() => setCurrentSection(prev => prev < 7 ? prev + 1 : 0)}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white dark:bg-neutral-900 rounded-full p-2 shadow-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                        disabled={currentSection === 7}
                      >
                        <ArrowRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      </button>

                      {/* Section Indicator */}
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-neutral-800 rounded-full px-4 py-2 shadow-md border border-gray-200 dark:border-neutral-700">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Day {currentSection + 1} of 8
                          </span>
                          <div className="flex space-x-1">
                            {Array.from({ length: 8 }, (_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i === currentSection
                                    ? 'bg-blue-600'
                                    : 'bg-gray-300 dark:bg-neutral-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Current Section */}
                      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 border border-gray-200 dark:border-neutral-700">
                        {sweatSheet.phases[currentPhase - 1].sections[currentSection] && (
                          <>
                            {/* Section Header */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    Day {currentSection + 1}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(sweatSheet.phases[currentPhase - 1].sections[currentSection].date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Exercises Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200 dark:border-neutral-700">
                                    <th className="text-left p-2">Category</th>
                                    <th className="text-left p-2">Exercise</th>
                                    <th className="text-left p-2">Sets</th>
                                    <th className="text-left p-2">Reps</th>
                                    <th className="text-left p-2">Weight</th>
                                    <th className="text-left p-2">Done</th>
                                    <th className="text-left p-2"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sweatSheet.phases[currentPhase - 1].sections[currentSection].exercises.map((exercise) => {
                                    console.log('Rendering exercise:', exercise);
                                    console.log('Exercise workout_category:', exercise.workout_category);
                                    console.log('Exercise specific_workout:', exercise.specific_workout);
                                    return (
                                      <tr key={exercise.id} className="border-b border-gray-100 dark:border-neutral-800">
                                        <td className="p-2">
                                          <select
                                            value={exercise.workout_category?.name || ''}
                                            onChange={(e) => updateExercise(exercise.id, 'workout_category', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                          >
                                            <option value="">Select</option>
                                            {workoutCategories.map(category => (
                                              <option key={category.id} value={category.name}>{category.name}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="p-2">
                                          <select
                                            value={exercise.specific_workout?.name || ''}
                                            onChange={(e) => updateExercise(exercise.id, 'specific_workout', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                            disabled={!exercise.workout_category?.name}
                                          >
                                            <option value="">Select</option>
                                            {getSpecificWorkouts(exercise.workout_category?.name || '').map(workout => (
                                              <option key={workout.id} value={workout.name}>{workout.name}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="p-2">
                                          <select
                                            value={exercise.sets || ''}
                                            onChange={(e) => updateExercise(exercise.id, 'sets', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                          >
                                            <option value="">Sets</option>
                                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(set => (
                                              <option key={set} value={set}>{set}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="p-2">
                                          <select
                                            value={exercise.reps || ''}
                                            onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                                            className="w-full p-2 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                          >
                                            <option value="">Reps</option>
                                            {['5', '8', '10', '12', '15', '20', '25', '30'].map(rep => (
                                              <option key={rep} value={rep}>{rep}</option>
                                            ))}
                                          </select>
                                        </td>
                                        <td className="p-2">
                                          <input
                                            type="text"
                                            value={exercise.weight || ''}
                                            onChange={(e) => updateExercise(exercise.id, 'weight', e.target.value)}
                                            placeholder="lbs"
                                            className="w-full p-2 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                          />
                                        </td>
                                        <td className="p-2">
                                          <input
                                            type="checkbox"
                                            checked={exercise.completed || false}
                                            onChange={() => toggleExerciseCompletion(exercise.id)}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                          />
                                        </td>
                                        <td className="p-2">
                                          {sweatSheet.phases[currentPhase - 1].sections[currentSection].exercises.length > 6 && (
                                            <button
                                              onClick={() => removeExercise(exercise.id)}
                                              className="text-red-500 hover:text-red-700"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Add Exercise Button */}
                            {sweatSheet.phases[currentPhase - 1].sections[currentSection].exercises.length < 15 && (
                              <button
                                onClick={() => addExercise(sweatSheet.phases[currentPhase - 1].sections[currentSection].id)}
                                className="mt-4 w-full py-2 px-4 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Exercise
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SweatSheetManager; 