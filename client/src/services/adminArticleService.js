// src/services/adminArticleService.js
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
 * Fetches a list of articles for the admin panel with pagination and filters.
 * @param {object} params - Query parameters (page, limit, status, categoryId, authorId, searchTerm, sortBy)
 * @returns {Promise<object>} API response data
 */
export const fetchAdminArticlesListAPI = async (params = {}) => {
  try {
    const response = await adminApiClient.get('/articles', { params });
    return response.data; // Expects ApiResponse: { success, data: { articles, currentPage, totalPages, totalArticles }, message }
  } catch (error) {
    console.error('Error fetching admin articles list:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch articles list');
  }
};

export const fetchAdminArticleByIdAPI = async (articleId) => {
  try {
    const response = await adminApiClient.get(`/articles/${articleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching admin article ${articleId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch article for editing');
  }
};

export const createAdminArticleAPI = async (articleData) => {
  try {
    const response = await adminApiClient.post('/articles', articleData);
    return response.data;
  } catch (error) {
    console.error('Error creating admin article:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to create article');
  }
};

/**
 * Updates an existing article.
 * @param {string|number} articleId - The ID of the article to update.
 * @param {object} articleData - The data to update (can be partial, e.g., just status).
 * @returns {Promise<object>} API response data
 */
export const updateAdminArticleAPI = async (articleId, articleData) => {
  try {
    const response = await adminApiClient.put(`/articles/${articleId}`, articleData);
    return response.data;
  } catch (error) {
    console.error(`Error updating admin article ${articleId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update article');
  }
};

/**
 * Deletes an article.
 * @param {string|number} articleId - The ID of the article to delete.
 * @returns {Promise<object>} API response data
 */
export const deleteAdminArticleAPI = async (articleId) => {
  try {
    const response = await adminApiClient.delete(`/articles/${articleId}`);
    return response.data; // Expects ApiResponse: { success, message }
  } catch (error) {
    console.error(`Error deleting admin article ${articleId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to delete article');
  }
};
