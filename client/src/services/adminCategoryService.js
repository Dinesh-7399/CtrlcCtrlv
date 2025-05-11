// client/src/services/adminCategoryService.js
import axios from 'axios';

// Determine the API base URL from environment variables or default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create an Axios instance for admin-related API calls.
const adminApiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin`, // Base path for all admin API routes
  withCredentials: true, // Important for sending cookies (e.g., for session management)
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Helper to handle API errors and ensure a consistent error object ---
const handleApiError = (error, defaultMessage = 'An unexpected error occurred.') => {
  // Log the full error for detailed debugging
  console.error(`API Service Error: ${error.message}`, error.response || error.request || error);

  if (error.response && error.response.data) {
    // If the backend provides a structured error with a message
    // (e.g., { success: false, message: 'Details...', errors: [] })
    // or just { message: 'Details...' }
    const errorData = error.response.data;
    return {
      message: errorData.message || defaultMessage,
      status: error.response.status,
      data: errorData, // Include the full error data payload if available
      isApiServiceError: true, // Flag to identify this custom error object
    };
  } else if (error.request) {
    // The request was made but no response was received (e.g., network error)
    return {
      message: 'Network error: Could not connect to the server. Please check your connection.',
      status: null, // No HTTP status
      isApiServiceError: true,
    };
  } else {
    // Something else happened in setting up the request that triggered an Error
    return {
      message: error.message || defaultMessage,
      status: null,
      isApiServiceError: true,
    };
  }
};

/**
 * Fetches a list of all categories for the admin panel.
 * @param {object} params - Optional query parameters (e.g., for pagination, search)
 * @returns {Promise<object>} API response data (the entire response.data object from Axios)
 * @throws {object} A structured error object if the API call fails.
 */
export const fetchAdminCategoriesAPI = async (params = {}) => {
  try {
    console.log('[API Service] Fetching admin categories with params:', params);
    const response = await adminApiClient.get('/categories', { params });
    // The backend is expected to return an ApiResponse-like structure.
    // Example: { success: true, data: { categories: [...], totalPages: 3, currentPage: 1 }, message: "Categories fetched" }
    console.log('[API Service] Fetched admin categories response:', response.data);
    return response.data; // Return the full data part of the response
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch admin categories.');
  }
};

/**
 * Creates a new category by an admin.
 * @param {object} categoryData - The data for the new category (e.g., { name, description, parentId })
 * @returns {Promise<object>} API response data
 * @throws {object} A structured error object if the API call fails.
 */
export const createAdminCategoryAPI = async (categoryData) => {
  try {
    console.log('[API Service] Creating admin category with data:', categoryData);
    const response = await adminApiClient.post('/categories', categoryData);
    console.log('[API Service] Created admin category response:', response.data);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to create category.');
  }
};

/**
 * Updates an existing category by an admin.
 * @param {string|number} categoryId - The ID of the category to update.
 * @param {object} categoryData - The data to update (can be partial).
 * @returns {Promise<object>} API response data
 * @throws {object} A structured error object if the API call fails.
 */
export const updateAdminCategoryAPI = async (categoryId, categoryData) => {
  try {
    console.log(`[API Service] Updating admin category ${categoryId} with data:`, categoryData);
    const response = await adminApiClient.put(`/categories/${categoryId}`, categoryData);
    console.log(`[API Service] Updated admin category ${categoryId} response:`, response.data);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to update category.');
  }
};

/**
 * Deletes a category by an admin.
 * @param {string|number} categoryId - The ID of the category to delete.
 * @returns {Promise<object>} API response data
 * @throws {object} A structured error object if the API call fails.
 */
export const deleteAdminCategoryAPI = async (categoryId) => {
  try {
    console.log(`[API Service] Deleting admin category ${categoryId}`);
    const response = await adminApiClient.delete(`/categories/${categoryId}`);
    console.log(`[API Service] Deleted admin category ${categoryId} response:`, response.data);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to delete category.');
  }
};

// You can add more specific admin category-related API calls here if needed,
// for example, fetching a single category by ID if not done via client-side filtering.
/**
 * Optional: Fetches a single category by its ID.
 * @param {string|number} categoryId - The ID of the category to fetch.
 * @returns {Promise<object>} API response data, typically { success: boolean, data: { category: { ... } }, message?: string }
 * @throws {object} A structured error object if the API call fails.
 */
// export const fetchAdminCategoryByIdAPI = async (categoryId) => {
//   try {
//     console.log(`[API Service] Fetching admin category by ID: ${categoryId}`);
//     const response = await adminApiClient.get(`/categories/${categoryId}`);
//     console.log(`[API Service] Fetched admin category ${categoryId} response:`, response.data);
//     return response.data;
//   } catch (error) {
//     throw handleApiError(error, 'Failed to fetch category details.');
//   }
// };