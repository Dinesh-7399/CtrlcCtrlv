// src/services/testimonialService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches all visible testimonials from the backend.
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export const fetchVisibleTestimonialsAPI = async () => {
  try {
    // Backend endpoint: GET /api/testimonials
    const response = await apiClient.get('/testimonials');
    return response.data;
  } catch (error) {
    console.error('Error fetching testimonials:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch testimonials');
  }
};
