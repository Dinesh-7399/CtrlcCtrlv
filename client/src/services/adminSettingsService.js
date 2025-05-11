// src/services/adminSettingsService.js
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
 * Fetches all platform settings for the admin panel.
 * @returns {Promise<object>} API response data (an object of key-value pairs).
 */
export const fetchAdminPlatformSettingsAPI = async () => {
  try {
    // Backend endpoint: GET /api/admin/platform-settings
    const response = await adminApiClient.get('/platform-settings');
    return response.data; // Expects ApiResponse: { success, data: { settingKey: value, ... }, message }
  } catch (error) {
    console.error('Error fetching admin platform settings:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch platform settings');
  }
};

/**
 * Updates platform settings.
 * @param {object} settingsData - An object where keys are setting names and values are the new setting values.
 * @returns {Promise<object>} API response data.
 */
export const updateAdminPlatformSettingsAPI = async (settingsData) => {
  try {
    // Backend endpoint: PUT /api/admin/platform-settings
    const response = await adminApiClient.put('/platform-settings', settingsData);
    return response.data; // Expects ApiResponse: { success, data: { updatedSettingKey: value, ... }, message }
  } catch (error) {
    console.error('Error updating admin platform settings:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update platform settings');
  }
};
