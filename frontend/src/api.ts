import axios from 'axios';
import { ACCESS_TOKEN } from './constants';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// SweatSheet API functions
export const sweatSheetApi = {
    // Get workout categories
    getWorkoutCategories: () => api.get('/api/workout-categories/'),
    
    // Get exercises by category
    getExercisesByCategory: (categoryId: number) => api.get(`/api/workout-exercises/?category_id=${categoryId}`),
    
    // Get all exercises
    getAllExercises: () => api.get('/api/workout-exercises/'),
    
    // SweatSheet CRUD
    getSweatSheets: () => api.get('/api/sweatsheets/'),
    createSweatSheet: (data: any) => api.post('/api/sweatsheets/', data),
    getSweatSheet: (id: number) => api.get(`/api/sweatsheets/${id}/`),
    updateSweatSheet: (id: number, data: any) => api.put(`/api/sweatsheets/${id}/`, data),
    deleteSweatSheet: (id: number) => api.delete(`/api/sweatsheets/${id}/`),
    
    // Assignment
    assignSweatSheet: (id: number, athleteId: number) => api.put(`/api/sweatsheets/${id}/assign/`, { assigned_to: athleteId }),
    getAthletes: () => api.get('/api/users/athletes/'),
    
    // Phase CRUD
    getPhases: (sweatSheetId: number) => api.get(`/api/sweatsheets/${sweatSheetId}/phases/`),
    createPhase: (sweatSheetId: number, data: any) => api.post(`/api/sweatsheets/${sweatSheetId}/phases/`, data),
    
    // Section CRUD
    getSections: (phaseId: number) => api.get(`/api/phases/${phaseId}/sections/`),
    createSection: (phaseId: number, data: any) => api.post(`/api/phases/${phaseId}/sections/`, data),
    
    // Exercise CRUD
    getExercises: (sectionId: number) => api.get(`/api/sections/${sectionId}/exercises/`),
    createExercise: (sectionId: number, data: any) => api.post(`/api/sections/${sectionId}/exercises/`, data),
    
    // Completion actions
    completePhase: (phaseId: number) => api.post(`/api/phases/${phaseId}/complete/`),
    completeExercise: (exerciseId: number) => api.post(`/api/exercises/${exerciseId}/complete/`),
};

export default api;