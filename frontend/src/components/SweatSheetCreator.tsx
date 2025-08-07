import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react';
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
  sets_data: {
    reps: string;
    weight: string;
    completed: boolean;
  }[];
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

// API response interface for SweatSheets
interface SweatSheetApiResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_template: boolean;
  phases: Phase[];
  creator_name: string;
  assigned_to_name: string;
  assigned_to?: number;
  assigned_to_id?: number;
}

// Workout data from API
interface WorkoutCategory {
  id: number;
  name: string;
  description: string;
}

interface WorkoutExercise {
  id: number;
  name: string;
  description: string;
  category: WorkoutCategory;
}

const setOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const repOptions = ['5', '8', '10', '12', '15', '20', '25', '30'];

const SweatSheetCreator: React.FC = () => {
  const [athletes, setAthletes] = useState<User[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);
  const [sweatSheet, setSweatSheet] = useState<SweatSheet | null>(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [currentSection, setCurrentSection] = useState(0);
  
  // Workout data from API
  const [workoutCategories, setWorkoutCategories] = useState<WorkoutCategory[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Load athletes
        const athletesResponse = await sweatSheetApi.getAthletes();
        setAthletes(athletesResponse.data);
        
        // Load workout data
        const categoriesResponse = await sweatSheetApi.getWorkoutCategories();
        setWorkoutCategories(categoriesResponse.data);
        
        const exercisesResponse = await sweatSheetApi.getAllExercises();
        setWorkoutExercises(exercisesResponse.data);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load workout data. Please refresh the page and try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Initialize first phase and section
  React.useEffect(() => {
    if (sweatSheet && sweatSheet.phases.length === 0) {
      initializePhase(1);
    }
  }, [sweatSheet]);

  const initializePhase = (phaseNumber: number) => {
    const newPhase: Phase = {
      id: Date.now() + Math.random(), // Use numeric ID
      phase_number: phaseNumber,
      is_completed: false,
      completed_at: null,
      sections: []
    };

    // Create 8 sections for the phase
    for (let i = 1; i <= 8; i++) {
      const newSection: Section = {
        id: Date.now() + Math.random() + i, // Use numeric ID
        section_number: i,
        date: new Date().toISOString().split('T')[0], // Today's date
        exercises: []
      };

      // Add 6 initial exercises to each section
      for (let j = 1; j <= 6; j++) {
        const newExercise: Exercise = {
          id: Date.now() + Math.random() + (i * 100) + j, // Ensure unique numeric ID
          workout_category: { id: 0, name: '' },
          specific_workout: { id: 0, name: '' },
          sets: '',
          sets_data: [],
          completed: false,
          order: j
        };
        newSection.exercises.push(newExercise);
      }

      newPhase.sections.push(newSection);
    }

    setSweatSheet(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        phases: [...prev.phases, newPhase]
      };
    });
  };

  const addExercise = (phaseIndex: number, sectionIndex: number) => {
    console.log('Adding exercise to phase:', phaseIndex, 'section:', sectionIndex);
    
    // Create a completely new exercise object with unique ID
    const newExercise: Exercise = {
      id: Date.now() + Math.random(), // Ensure unique ID
      workout_category: { id: 0, name: '' },
      specific_workout: { id: 0, name: '' },
      sets: '',
      sets_data: [],
      completed: false,
      order: 0
    };

    console.log('Created new exercise with ID:', newExercise.id);

    setSweatSheet(prev => {
      if (!prev) return prev;
      
      const updatedPhases = [...prev.phases];
      const updatedSections = [...updatedPhases[phaseIndex].sections];
      const updatedExercises = [...updatedSections[sectionIndex].exercises];
      
      // Add the new exercise
      updatedExercises.push(newExercise);
      
      // Update the section with new exercises array
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        exercises: updatedExercises
      };
      
      // Update the phase with new sections array
      updatedPhases[phaseIndex] = {
        ...updatedPhases[phaseIndex],
        sections: updatedSections
      };
      
      console.log('Added exercise, total exercises now:', updatedExercises.length);
      console.log('Exercise IDs after adding:', updatedExercises.map(e => e.id));
      
      return { ...prev, phases: updatedPhases };
    });
  };

  const removeExercise = (phaseIndex: number, sectionIndex: number, exerciseIndex: number) => {
    setSweatSheet(prev => {
      if (!prev) return prev;
      
      const updatedPhases = [...prev.phases];
      updatedPhases[phaseIndex].sections[sectionIndex].exercises.splice(exerciseIndex, 1);
      return { ...prev, phases: updatedPhases };
    });
  };

  const updateExercise = (
    phaseIndex: number, 
    sectionIndex: number, 
    exerciseIndex: number, 
    field: keyof Exercise, 
    value: string | boolean
  ) => {
    setSweatSheet(prev => {
      if (!prev) return prev;
      
      const updatedPhases = [...prev.phases];
      const updatedSections = [...updatedPhases[phaseIndex].sections];
      const updatedExercises = [...updatedSections[sectionIndex].exercises];
      
      // Create a new exercise object to avoid shared references
      const updatedExercise = { ...updatedExercises[exerciseIndex] };
      
      // Handle nested object updates
      if (field === 'workout_category') {
        const category = workoutCategories.find(cat => cat.name === value);
        updatedExercise.workout_category = category ? { id: category.id, name: category.name } : { id: 0, name: '' };
        // Reset specific workout when category changes
        updatedExercise.specific_workout = { id: 0, name: '' };
      } else if (field === 'specific_workout') {
        const workout = workoutExercises.find(w => w.name === value);
        updatedExercise.specific_workout = workout ? { id: workout.id, name: workout.name } : { id: 0, name: '' };
      } else if (field === 'sets') {
        // Handle sets change - create or update sets_data array
        const numSets = parseInt(value as string) || 0;
        updatedExercise.sets = value as string;
        
        // Initialize or update sets_data array
        if (numSets > 0) {
          const currentSetsData = updatedExercise.sets_data || [];
          const newSetsData = [];
          
          for (let i = 0; i < numSets; i++) {
            if (currentSetsData[i]) {
              newSetsData.push(currentSetsData[i]);
            } else {
              newSetsData.push({
                reps: '',
                weight: '',
                completed: false
              });
            }
          }
          updatedExercise.sets_data = newSetsData;
        } else {
          updatedExercise.sets_data = [];
        }
      } else {
        // Handle simple field updates
        (updatedExercise as any)[field] = value;
      }
      
      // Update the exercises array with the new exercise
      updatedExercises[exerciseIndex] = updatedExercise;
      
      // Update the section with new exercises array
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        exercises: updatedExercises
      };
      
      // Update the phase with new sections array
      updatedPhases[phaseIndex] = {
        ...updatedPhases[phaseIndex],
        sections: updatedSections
      };
      
      return { ...prev, phases: updatedPhases };
    });
  };

  const updateExerciseSet = (
    phaseIndex: number,
    sectionIndex: number,
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight' | 'completed',
    value: string | boolean
  ) => {
    setSweatSheet(prev => {
      if (!prev) return prev;
      
      const updatedPhases = [...prev.phases];
      const updatedSections = [...updatedPhases[phaseIndex].sections];
      const updatedExercises = [...updatedSections[sectionIndex].exercises];
      
      // Create a new exercise object to avoid shared references
      const updatedExercise = { ...updatedExercises[exerciseIndex] };
      const updatedSetsData = [...updatedExercise.sets_data];
      
      // Update the specific set
      updatedSetsData[setIndex] = {
        ...updatedSetsData[setIndex],
        [field]: value
      };
      
      updatedExercise.sets_data = updatedSetsData;
      
      // Update the exercises array with the new exercise
      updatedExercises[exerciseIndex] = updatedExercise;
      
      // Update the section with new exercises array
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        exercises: updatedExercises
      };
      
      // Update the phase with new sections array
      updatedPhases[phaseIndex] = {
        ...updatedPhases[phaseIndex],
        sections: updatedSections
      };
      
      return { ...prev, phases: updatedPhases };
    });
  };



  const completePhase = (phaseIndex: number) => {
    if (phaseIndex < 4) {
      initializePhase(phaseIndex + 2); // +2 because array is 0-indexed
      setCurrentPhase(phaseIndex + 2);
    }
  };

  const getSpecificWorkouts = (categoryName: string) => {
    if (!categoryName) return [];
    const category = workoutCategories.find(cat => cat.name === categoryName);
    if (!category) return [];
    return workoutExercises.filter(exercise => exercise.category.id === category.id);
  };

  const ensureSectionsHaveExercises = (sweatSheet: SweatSheet) => {
    console.log('Original SweatSheet phases:', sweatSheet.phases.length);
    console.log('Original sections per phase:', sweatSheet.phases.map(p => p.sections.length));
    
    const updatedPhases = sweatSheet.phases.map(phase => {
      console.log(`Phase ${phase.phase_number} has ${phase.sections.length} sections`);
      
      // Ensure we have exactly 8 sections
      const sections = [...phase.sections];
      
      // If we have fewer than 8 sections, add missing ones
      while (sections.length < 8) {
        const newSectionNumber = sections.length + 1;
        console.log(`Adding missing section ${newSectionNumber}`);
        
        const newSection: Section = {
          id: Date.now() + Math.random() + newSectionNumber,
          section_number: newSectionNumber,
          date: new Date(Date.now() + (newSectionNumber - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          exercises: []
        };
        
        // Add 6 default exercises to the new section
        for (let j = 1; j <= 6; j++) {
          newSection.exercises.push({
            id: Date.now() + Math.random() + (newSectionNumber * 100) + j,
            workout_category: { id: 0, name: '' },
            specific_workout: { id: 0, name: '' },
            sets: '',
            sets_data: [],
            completed: false,
            order: j
          });
        }
        
        sections.push(newSection);
      }
      
      // Ensure each section has exercises
      const updatedSections = sections.map(section => {
        console.log(`Section ${section.section_number} has ${section.exercises.length} exercises`);
        
        if (!section.exercises || section.exercises.length === 0) {
          console.log(`Adding exercises to section ${section.section_number}`);
          const defaultExercises: Exercise[] = [];
          for (let j = 1; j <= 6; j++) {
            defaultExercises.push({
              id: Date.now() + Math.random() + (section.section_number * 100) + j,
              workout_category: { id: 0, name: '' },
              specific_workout: { id: 0, name: '' },
              sets: '',
              sets_data: [],
              completed: false,
              order: j
            });
          }
          return { ...section, exercises: defaultExercises };
        }
        return section;
      });
      
      return { ...phase, sections: updatedSections };
    });
    
    const updatedSweatSheet = { ...sweatSheet, phases: updatedPhases };
    console.log('Updated SweatSheet phases:', updatedSweatSheet.phases.length);
    console.log('Updated sections per phase:', updatedSweatSheet.phases.map(p => p.sections.length));
    
    return updatedSweatSheet;
  };

  const handleAthleteSelect = async (athlete: User) => {
    try {
      setSelectedAthlete(athlete);
      console.log('Selected athlete:', athlete);

      // Try to load existing SweatSheet for this athlete
      const response = await sweatSheetApi.getSweatSheets();
      console.log('All SweatSheets from API:', response.data);
      
      const athleteSweatSheet = response.data.find((sheet: SweatSheetApiResponse) => {
        // Check if the sheet is assigned to this athlete
        // The backend might return different field names, so we'll be flexible
        return sheet.assigned_to === athlete.id || 
               sheet.assigned_to_id === athlete.id ||
               sheet.assigned_to_name === `${athlete.first_name} ${athlete.last_name}`;
      });

      if (athleteSweatSheet) {
        console.log('Found existing SweatSheet:', athleteSweatSheet);
        console.log('SweatSheet phases:', athleteSweatSheet.phases);
        console.log('First phase sections:', athleteSweatSheet.phases[0]?.sections);
        
        // Ensure all sections have exercises
        const updatedSweatSheet = ensureSectionsHaveExercises(athleteSweatSheet);
        console.log('After ensuring sections:', updatedSweatSheet);
        setSweatSheet(updatedSweatSheet);
        setCurrentPhase(1);
        setCurrentSection(0);
      } else {
        console.log('No existing SweatSheet, creating new one...');
        await createNewSweatSheet(athlete);
      }
    } catch (error) {
      console.error('Error selecting athlete:', error);
    }
  };

  const createNewSweatSheet = async (athlete: User) => {
    try {
      console.log('Creating new SweatSheet for:', athlete.first_name);

      // Create new SweatSheet
      const newSweatSheetData = {
        name: `${athlete.first_name}'s Training Program`,
        assigned_to: athlete.id
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

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-neutral-800 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading workout data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-neutral-800 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-ethnocentric text-3xl font-bold text-gray-800 dark:text-white mb-6">
          SweatSheet Creator
        </h1>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Athletes Dropdown */}
        <div className="mb-6">
          <h2 className="font-ethnocentric text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Select Athlete
          </h2>
          <div className="relative">
            <select
              value={selectedAthlete?.id || ''}
              onChange={(e) => {
                const athleteId = parseInt(e.target.value);
                const athlete = athletes.find(a => a.id === athleteId);
                if (athlete) {
                  handleAthleteSelect(athlete);
                }
              }}
              className="w-full p-3 text-lg border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            >
              <option value="">Select an athlete to activate their training program...</option>
              {athletes.map(athlete => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.first_name} {athlete.last_name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Selected Athlete Display */}
          {selectedAthlete && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    {selectedAthlete.first_name} {selectedAthlete.last_name}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Training program activated
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Athlete SweatSheet */}
        {selectedAthlete && (
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 border-2 border-gray-200 dark:border-neutral-700 max-w-4xl mx-auto">
            <h2 className="font-ethnocentric text-2xl font-bold text-gray-800 dark:text-white mb-4">
              {sweatSheet?.name || `SweatSheet for ${selectedAthlete.first_name} ${selectedAthlete.last_name}`}
            </h2>

            {/* Phase Navigation */}
            <div className="mb-6">
              <div className="flex space-x-2">
                {sweatSheet?.phases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => setCurrentPhase(phase.phase_number)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      currentPhase === phase.phase_number
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    Phase {phase.phase_number}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Phase Display */}
            {sweatSheet?.phases[currentPhase - 1] && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-ethnocentric text-2xl font-bold text-gray-800 dark:text-white">
                    Phase {currentPhase}
                  </h2>
                  {currentPhase < 4 && (
                    <button
                      onClick={() => completePhase(currentPhase - 1)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Complete Phase {currentPhase}
                    </button>
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
                    <div className="inline-flex items-center space-x-2 bg-white dark:bg-neutral-900 rounded-full px-4 py-2 shadow-md border border-gray-200 dark:border-neutral-700">
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

                        {/* Debug Info for Current Section */}
                        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                          <p>Current Section: {currentSection + 1}</p>
                          <p>Section ID: {sweatSheet.phases[currentPhase - 1].sections[currentSection].id}</p>
                          <p>Exercises in this section: {sweatSheet.phases[currentPhase - 1].sections[currentSection].exercises.length}</p>
                          <p>Total sections in phase: {sweatSheet.phases[currentPhase - 1].sections.length}</p>
                        </div>

                        {/* Exercises Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                                                            <thead>
                                  <tr className="border-b border-gray-200 dark:border-neutral-700">
                                    <th className="text-left p-2">Category</th>
                                    <th className="text-left p-2">Exercise</th>
                                    <th className="text-left p-2">Sets</th>
                                    <th className="text-left p-2">Sets Details (Reps/Weight/Done)</th>
                                    <th className="text-left p-2">Done</th>
                                    <th className="text-left p-2"></th>
                                  </tr>
                                </thead>
                            <tbody>
                                  {(() => {
                                    const exercises = sweatSheet.phases[currentPhase - 1].sections[currentSection].exercises;
                                    console.log('Total exercises in section:', exercises.length);
                                    console.log('Exercise IDs:', exercises.map(e => e.id));
                                    
                                    // Check for duplicates
                                    const ids = exercises.map(e => e.id);
                                    const uniqueIds = [...new Set(ids)];
                                    console.log('Unique IDs:', uniqueIds);
                                    console.log('Duplicate IDs found:', ids.length !== uniqueIds.length);
                                    
                                    return exercises.map((exercise, exerciseIndex) => {
                                      console.log('Rendering exercise:', exercise);
                                      console.log('Exercise workout_category:', exercise.workout_category);
                                      console.log('Exercise specific_workout:', exercise.specific_workout);
                                      console.log('Available categories:', workoutCategories.length);
                                      console.log('Available exercises:', workoutExercises.length);
                                      console.log('Exercise index:', exerciseIndex);
                                      console.log('Exercise ID:', exercise.id);
                                      
                                      return (
                                        <tr key={`exercise-${exercise.id}-${exerciseIndex}`} className="border-b border-gray-100 dark:border-neutral-800">
                                          <td className="p-2">
                                            <select
                                              value={exercise.workout_category?.name || ''}
                                              onChange={(e) => {
                                                console.log('Category changed to:', e.target.value);
                                                updateExercise(currentPhase - 1, currentSection, exerciseIndex, 'workout_category', e.target.value);
                                              }}
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
                                              onChange={(e) => {
                                                console.log('Exercise changed to:', e.target.value);
                                                updateExercise(currentPhase - 1, currentSection, exerciseIndex, 'specific_workout', e.target.value);
                                              }}
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
                                              value={exercise.sets}
                                              onChange={(e) => updateExercise(currentPhase - 1, currentSection, exerciseIndex, 'sets', e.target.value)}
                                              className="w-full p-2 text-sm border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                            >
                                              <option value="">Sets</option>
                                              {setOptions.map(set => (
                                                <option key={set} value={set}>{set}</option>
                                              ))}
                                            </select>
                                          </td>
                                          <td className="p-2">
                                            {/* Dynamic Sets Display */}
                                            {exercise.sets_data && exercise.sets_data.length > 0 ? (
                                              <div className="space-y-2">
                                                {exercise.sets_data.map((setData, setIndex) => (
                                                  <div key={setIndex} className="flex space-x-2 items-center">
                                                    <span className="text-xs text-gray-500 w-8">Set {setIndex + 1}:</span>
                                                    <select
                                                      value={setData.reps}
                                                      onChange={(e) => updateExerciseSet(currentPhase - 1, currentSection, exerciseIndex, setIndex, 'reps', e.target.value)}
                                                      className="flex-1 p-1 text-xs border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                                    >
                                                      <option value="">Reps</option>
                                                      {repOptions.map(rep => (
                                                        <option key={rep} value={rep}>{rep}</option>
                                                      ))}
                                                    </select>
                                                    <input
                                                      type="text"
                                                      value={setData.weight}
                                                      onChange={(e) => updateExerciseSet(currentPhase - 1, currentSection, exerciseIndex, setIndex, 'weight', e.target.value)}
                                                      placeholder="lbs"
                                                      className="flex-1 p-1 text-xs border border-gray-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                                                    />
                                                    <input
                                                      type="checkbox"
                                                      checked={setData.completed}
                                                      onChange={(e) => updateExerciseSet(currentPhase - 1, currentSection, exerciseIndex, setIndex, 'completed', e.target.checked)}
                                                      className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="text-gray-400 text-xs">Select sets first</div>
                                            )}
                                          </td>
                                          <td className="p-2">
                                            <input
                                              type="checkbox"
                                              checked={exercise.completed}
                                              onChange={(e) => updateExercise(currentPhase - 1, currentSection, exerciseIndex, 'completed', e.target.checked)}
                                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                            />
                                          </td>
                                          <td className="p-2">
                                            {sweatSheet.phases[currentPhase - 1].sections[currentSection].exercises.length > 6 && (
                                              <button
                                                onClick={() => removeExercise(currentPhase - 1, currentSection, exerciseIndex)}
                                                className="text-red-500 hover:text-red-700"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    });
                                  })()}
                            </tbody>
                          </table>
                        </div>

                        {/* Add Exercise Button */}
                        {sweatSheet.phases[currentPhase - 1].sections[currentSection].exercises.length < 15 && (
                          <button
                            onClick={() => addExercise(currentPhase - 1, currentSection)}
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

            {/* Save Button */}
            <div className="mt-8">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold">
                Save SweatSheet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SweatSheetCreator; 