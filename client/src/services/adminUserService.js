// src/services/adminUserService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const adminApiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin`, // Base for admin routes
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For HttpOnly JWT cookie
});

/**
 * Fetches a list of users for the admin panel with pagination and filters.
 * @param {object} params - Query parameters (page, limit, role, status, searchTerm, sortBy)
 * @returns {Promise<object>} API response data
 */
export const fetchAdminUsersListAPI = async (params = {}) => {
  try {
    const response = await adminApiClient.get('/users', { params });
    return response.data; // Expects ApiResponse: { success, data: { users, currentPage, totalPages, totalUsers }, message }
  } catch (error) {
    console.error('Error fetching admin users list:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch users list');
  }
};

/**
 * Updates an existing user's details (e.g., role, status) by an admin.
 * @param {string|number} userId - The ID of the user to update.
 * @param {object} userData - The data to update (can be partial, e.g., { status: 'SUSPENDED' }).
 * @returns {Promise<object>} API response data
 */
export const updateAdminUserAPI = async (userId, userData) => {
  try {
    const response = await adminApiClient.put(`/users/${userId}`, userData);
    return response.data; // Expects ApiResponse: { success, data: { user }, message }
  } catch (error) {
    console.error(`Error updating admin user ${userId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update user');
  }
};

/**
 * Deletes a user by an admin.
 * @param {string|number} userId - The ID of the user to delete.
 * @returns {Promise<object>} API response data
 */
export const deleteAdminUserAPI = async (userId) => {
  try {
    const response = await adminApiClient.delete(`/users/${userId}`);
    return response.data; // Expects ApiResponse: { success, message }
  } catch (error) {
    console.error(`Error deleting admin user ${userId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to delete user');
  }
};

// fetchAdminUserByIdAPI can be added here if an admin edit page needs to fetch full user details
// export const fetchAdminUserByIdAPI = async (userId) => { ... };
