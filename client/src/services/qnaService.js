// src/services/qnaService.js
import axios from 'axios';

// Ensure VITE_API_URL is set in your .env file for Vite projects
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // Uncomment if your API uses cookies for auth and requires this
});

// Add a request interceptor to include JWT token if you have one
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('yourAuthTokenKey'); // Or however you store your token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});


export const fetchQuestionsAPI = async (params = {}) => {
  try {
    const response = await apiClient.get('/qna/questions', { params });
    return response.data; // Expected: { success: true, data: { questions: [], ... }, message }
  } catch (error) {
    console.error('Error fetching Q&A questions:', error.response ? error.response.data : error.message);
    // Consistently throw an object that can be handled by rejectWithValue
    throw error.response?.data || { message: error.message || 'Failed to fetch questions' };
  }
};

export const postQuestionAPI = async (questionData) => {
    try {
      const response = await apiClient.post('/qna/questions', questionData);
      return response.data; // Expected: { success: true, data: { question: { ... } }, message }
    } catch (error) {
      console.error('Error posting new question:', error.response ? error.response.data : error.message);
      throw error.response?.data || { message: error.message || 'Failed to post question' };
    }
};