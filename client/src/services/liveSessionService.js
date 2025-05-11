// src/services/liveSessionService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // If authentication is cookie-based
});

/**
 * Fetches details for a specific live session.
 * @param {string} sessionId - The ID of the live session (could be courseId or a unique session ID).
 * @returns {Promise<object>} API response data (e.g., { success: true, data: { title, status, streamUrl, startTime, courseId } }).
 */
export const fetchLiveSessionDetailsAPI = async (sessionId) => {
  try {
    // Adjust the endpoint as per your backend API
    const response = await apiClient.get(`/live-sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching live session details for ${sessionId}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch live session details.');
  }
};