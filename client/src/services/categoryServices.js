// src/services/categoryService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetches all categories from the backend.
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export const fetchCategoriesAPI = async () => {
  try {
    // Backend endpoint: GET /api/categories
    const response = await apiClient.get('/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch categories');
  }
};

/**
 * Fetches a single category by its slug or ID.
 * @param {string|number} identifier - The category slug or ID.
 * @returns {Promise<object>} A promise that resolves to the API response data.
 */
export const fetchCategoryByIdentifierAPI = async (identifier) => {
  try {
    // Backend endpoint: GET /api/categories/:slugOrId
    const response = await apiClient.get(`/categories/${identifier}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching category ${identifier}:`, error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to fetch category details');
  }
};
