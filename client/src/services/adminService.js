// src/services/adminService.js
import axios from 'axios';

// Define the base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create an axios instance for API calls
// This instance should ideally be shared across services or configured globally
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for HttpOnly cookies (JWT for admin auth)
});

/**
 * Fetches platform statistics for the admin dashboard.
 * Requires admin authentication (handled by HttpOnly cookie).
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export const fetchAdminPlatformStatsAPI = async () => {
  try {
    // Backend endpoint: GET /api/admin/analytics/stats
    // The adminAnalyticsController.js handles this.
    const response = await apiClient.get('/admin/analytics/stats');
    return response.data; // Axios wraps the response in 'data'. We want the backend's ApiResponse.
  } catch (error) {
    console.error('Error fetching admin platform stats:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch platform statistics');
  }
};

/**
 * Fetches user registration trends for the admin dashboard.
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export const fetchAdminUserTrendsAPI = async () => {
  try {
    const response = await apiClient.get('/admin/analytics/user-trends');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin user trends:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch user registration trends');
  }
};

/**
 * Fetches enrollment overview for the admin dashboard.
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export const fetchAdminEnrollmentOverviewAPI = async () => {
  try {
    const response = await apiClient.get('/admin/analytics/enrollment-overview');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin enrollment overview:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch enrollment overview');
  }
};

// Add other admin-specific API calls here as needed.
