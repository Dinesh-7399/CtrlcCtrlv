// client/src/services/articleService.js
import axios from 'axios';

// IMPORTANT: Adjust this to your actual backend API base URL
const API_BASE_URL = 'http://localhost:5001/api'; // Ensure this is correct
const ARTICLES_ENDPOINT = `${API_BASE_URL}/articles`;

/**
 * Fetch articles with optional filters.
 * @param {object} filters - e.g., { page, limit, tag, categorySlug, sortBy, searchTerm }
 * @returns {Promise<object>} Expected: { articles, currentPage, totalPages, totalArticles, limit? }
 */
export const getArticlesAPI = async (filters = {}) => {
  // Remove null, undefined, or empty string filters
  const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  try {
    // console.log("ArticleService (getArticlesAPI): Fetching articles with filters:", cleanFilters);
    const response = await axios.get(ARTICLES_ENDPOINT, { params: cleanFilters });

    // Primary expected structure from backend
    if (response.data && response.data.success && response.data.data) {
      // console.log("ArticleService (getArticlesAPI): Returning response.data.data:", response.data.data);
      return response.data.data;
    }
    // Fallback for a structure where data might be directly under response.data
    // (e.g., if backend returns { articles: [], ...pagination } directly)
    else if (response.data && Array.isArray(response.data.articles)) {
      console.warn("ArticleService (getArticlesAPI): API response structure might be less nested. Check if this is expected.");
      // console.log("ArticleService (getArticlesAPI): Returning response.data (fallback structure):", response.data);
      return response.data;
    }
    // If neither structure matches, throw an error.
    console.error("ArticleService (getArticlesAPI): Received unexpected data structure from articles API.", response.data);
    throw new Error("Received unexpected data structure from articles API.");
  } catch (error) {
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errors?.join(', ') ||
      error.message ||
      "Failed to fetch articles";
    console.error("Error in getArticlesAPI:", errorMessage, error.response?.data || error);
    throw new Error(errorMessage);
  }
};

/**
 * Fetch a single published article by its slug.
 * @param {string} slug
 * @returns {Promise<object>} The article object (expected to contain 'content').
 */
export const getArticleBySlugAPI = async (slug) => {
  if (!slug || String(slug).trim() === '') {
    const errorMsg = "Article slug is required for getArticleBySlugAPI.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const apiUrl = `${ARTICLES_ENDPOINT}/${slug}`;
    // console.log(`ArticleService (getArticleBySlugAPI): Fetching article from URL: ${apiUrl}`);
    const response = await axios.get(apiUrl);

    // --- CRITICAL LOG 1: Inspect the RAW response from the backend ---
    // This will show you exactly what the frontend receives from the API.
    // Check if 'content' is present and populated here.
    console.log('ArticleService (getArticleBySlugAPI): Raw response.data from API:', JSON.stringify(response.data, null, 2));

    // Primary expected structure: { success: true, data: { article_object_with_content } }
    if (response.data && response.data.success && response.data.data) {
      // --- CRITICAL LOG 2A: Inspect the data being returned by the service in the ideal case ---
      // This should be your article object. Check for 'content'.
      console.log('ArticleService (getArticleBySlugAPI): Returning response.data.data (expected success case):', JSON.stringify(response.data.data, null, 2));
      return response.data.data; // This should be the article object
    }
    // Fallback for a flatter structure: { article_object_with_content }
    // This checks if response.data itself looks like an article (e.g., has a 'slug' property matching the request)
    else if (response.data && response.data.slug === slug) {
      console.warn("ArticleService (getArticleBySlugAPI): API response structure might be flat (not nested under 'data'). Check if this is expected.");
      // --- CRITICAL LOG 2B: Inspect the data being returned by the service in the fallback case ---
      console.log('ArticleService (getArticleBySlugAPI): Returning response.data (fallback flat structure):', JSON.stringify(response.data, null, 2));
      return response.data; // This should be the article object
    }

    // If neither expected structure is found:
    console.error("ArticleService (getArticleBySlugAPI): Received unexpected data structure from article detail API.", response.data);
    throw new Error("Received unexpected data structure from article detail API. Check CRITICAL LOG 1 for details.");
  } catch (error) {
    // This catch block handles errors from the axios.get call or errors thrown above.
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errors?.join(', ') ||
      error.message || // Use error.message if it's an error thrown by this function
      `Failed to fetch article "${slug}"`;
    console.error(`Error in getArticleBySlugAPI for slug "${slug}":`, errorMessage, error.response?.data || error);
    throw new Error(errorMessage);
  }
};