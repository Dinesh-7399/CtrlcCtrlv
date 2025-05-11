// src/services/platformService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches public platform statistics (e.g., total users, courses, instructors).
 * @returns {Promise<object>} API response data.
 */
export const fetchPublicPlatformStatsAPI = async () => {
  try {
    // Adjust the endpoint as per your backend API, e.g., /api/platform/stats
    const response = await apiClient.get('/platform/public-stats');
    // Example expected response:
    // { success: true, data: { totalUsers: 5000, totalInstructors: 20, totalCourses: 150, totalCategories: 10 }, message: "Stats fetched" }
    return response.data;
  } catch (error) {
    console.error('Error fetching public platform stats:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch platform statistics');
  }
};