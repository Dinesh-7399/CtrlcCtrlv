// client/src/services/articleService.js
import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:5001/api';
let apiBaseUrl;

if (import.meta.env && import.meta.env.VITE_API_BASE_URL) {
  apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
} else if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) {
  apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
} else {
  apiBaseUrl = DEFAULT_API_URL;
}

const API_BASE_URL = apiBaseUrl;
const ARTICLES_ENDPOINT = `${API_BASE_URL}/articles`;

export const getArticlesAPI = async (filters = {}) => {
  const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  try {
    console.log("ArticleService (getArticlesAPI): Fetching articles with filters:", cleanFilters, "from endpoint:", ARTICLES_ENDPOINT);
    const response = await axios.get(ARTICLES_ENDPOINT, { params: cleanFilters });

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    } else if (response.data && Array.isArray(response.data.articles)) {
      console.warn("ArticleService (getArticlesAPI): API response structure might be less nested.");
      return response.data;
    }
    if (response.data && response.data.success === false) {
        console.error("ArticleService (getArticlesAPI): API indicated failure.", response.data);
        throw new Error(response.data.message || "API returned success:false without a message.");
    }
    console.error("ArticleService (getArticlesAPI): Received unexpected data structure from articles API.", response.data);
    throw new Error("Received unexpected data structure from articles API.");
  } catch (error) {
    let errorMessage = "Failed to fetch articles. Please try again later.";
    let errorDetails = {};
    if (error.response) {
      console.error("Error in getArticlesAPI - Server Response:", error.response.data, error.response.status, error.response.headers);
      errorMessage = error.response.data?.message || error.response.data?.errors?.join(', ') || error.message;
      errorDetails = { status: error.response.status, data: error.response.data };
    } else if (error.request) {
      console.error("Error in getArticlesAPI - No Server Response:", error.request);
      errorMessage = "Could not connect to the server. Check network or if the server is running.";
      errorDetails = { message: "No response received from server." };
    } else {
      console.error("Error in getArticlesAPI - Request Setup Error:", error.message);
      errorMessage = error.message || "An unexpected error occurred while setting up the request.";
    }
    console.error("Full error object in getArticlesAPI:", error);
    const customError = new Error(errorMessage);
    customError.details = errorDetails;
    customError.originalError = error;
    throw customError;
  }
};

export const getArticleBySlugAPI = async (slug) => {
  if (!slug || String(slug).trim() === '') {
    const errorMsg = "Article slug is required for getArticleBySlugAPI.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  try {
    const apiUrl = `${ARTICLES_ENDPOINT}/${slug}`;
    console.log(`ArticleService (getArticleBySlugAPI): Fetching article from URL: ${apiUrl}`);
    const response = await axios.get(apiUrl);
    console.log('ArticleService (getArticleBySlugAPI): Raw response.data from API:', JSON.stringify(response.data, null, 2));

    if (response.data && response.data.success && response.data.data && response.data.data.article) {
      return response.data.data; // Expects { article: {...} }
    } else if (response.data && response.data.success && response.data.data) {
        console.warn("ArticleService (getArticleBySlugAPI): API response data might be the article itself. Verify backend.", response.data.data);
        return { article: response.data.data }; // Wrap for consistency
    }
    if (response.data && response.data.success === false) {
        console.error("ArticleService (getArticleBySlugAPI): API indicated failure.", response.data);
        throw new Error(response.data.message || `API returned success:false for slug ${slug}.`);
    }
    console.error("ArticleService (getArticleBySlugAPI): Unexpected data structure for article:", slug, response.data);
    throw new Error(`Received unexpected data structure for article "${slug}".`);
  } catch (error) {
    let errorMessage = `Failed to fetch article "${slug}".`;
    let errorDetails = {};
    if (error.response) {
      console.error(`Error in getArticleBySlugAPI for slug "${slug}" - Server Response:`, error.response.data, error.response.status);
      errorMessage = error.response.data?.message || error.response.data?.errors?.join(', ') || error.message;
      errorDetails = { status: error.response.status, data: error.response.data };
    } else if (error.request) {
      console.error(`Error in getArticleBySlugAPI for slug "${slug}" - No Server Response:`, error.request);
      errorMessage = `Could not connect to the server to fetch article "${slug}".`;
      errorDetails = { message: "No response received from server." };
    } else {
      console.error(`Error in getArticleBySlugAPI for slug "${slug}" - Request Setup Error:`, error.message);
      errorMessage = error.message || `An unexpected error while fetching article "${slug}".`;
    }
    console.error(`Full error object in getArticleBySlugAPI for slug "${slug}":`, error);
    const customError = new Error(errorMessage);
    customError.details = errorDetails;
    customError.originalError = error;
    throw customError;
  }
};