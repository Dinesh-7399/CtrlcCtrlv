// src/services/userService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL, // General API base, not necessarily /users
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const updateUserProfileAPI = async (profileData) => {
  try {
    // Endpoint for updating the current authenticated user's profile
    const response = await apiClient.put('/users/profile/me', profileData); // Example endpoint
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to update profile');
  }
};

export const fetchPublicUserProfileAPI = async (userId) => {
  try {
    const response = await apiClient.get(`/users/profile/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public user profile:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch public profile');
  }
};

export const fetchNotificationPreferencesAPI = async () => {
    try {
        // Endpoint for fetching the current authenticated user's notification preferences
        const response = await apiClient.get('/users/profile/me/notification-preferences'); // Example endpoint
        return response.data;
    } catch (error) {
        console.error('Error fetching notification preferences:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Failed to fetch notification preferences');
    }
};

export const updateNotificationPreferencesAPI = async (preferencesData) => {
    try {
        // Endpoint for updating the current authenticated user's notification preferences
        const response = await apiClient.put('/users/profile/me/notification-preferences', preferencesData); // Example endpoint
        return response.data;
    } catch (error) {
        console.error('Error updating notification preferences:', error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Failed to update notification preferences');
    }
};