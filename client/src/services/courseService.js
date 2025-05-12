// client/src/services/courseService.js
import axios from 'axios';

// Ensure VITE_API_URL is set in your .env file for Vite projects
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // If your API uses cookies for auth
});

// Add a request interceptor to include JWT token if you have one
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken'); // Or however you store your token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});


// Centralized API Error Handler - REVISED TO THROW AN ACTUAL ERROR OBJECT
const handleApiError = (error, defaultMessage = 'An unexpected API error occurred.') => {
  console.error(`[courseService] API Error. DefaultMsg: "${defaultMessage}"`, {
    url: error.config?.url,
    method: error.config?.method,
    responseStatus: error.response?.status,
    responseData: error.response?.data, // Be cautious logging full data in prod
    originalMessage: error.message,
  });

  let messageForErrorObject = defaultMessage;
  let status = null;
  let fieldErrors = []; // For field-specific validation errors from backend

  if (error.isAxiosError && error.response) {
    status = error.response.status;
    const errorData = error.response.data;
    if (errorData) {
      messageForErrorObject = errorData.message || `Request failed with status code ${status || 'unknown'}`;
      if (Array.isArray(errorData.errors)) {
        fieldErrors = errorData.errors;
      } else if (typeof errorData === 'string' && errorData.length < 300) {
        fieldErrors = [errorData];
      }
    } else if (status) {
      messageForErrorObject = `Request failed with status code ${status}`;
    }
  } else if (error.isAxiosError && error.request) {
    messageForErrorObject = 'Network Error: No response from server. Please check your connection.';
  } else if (error.message) {
    messageForErrorObject = error.message;
  }
  
  const processedError = new Error(messageForErrorObject);
  processedError.status = status;
  processedError.errors = fieldErrors; // Array of error details
  processedError.isApiServiceError = true;
  
  console.error('[courseService] Throwing processed error:', processedError);
  throw processedError; // CRITICAL: Actually throw the error object
};

// --- API Functions ---
export const fetchCoursesAPI = async (params = {}) => {
  try {
    const response = await apiClient.get('/courses', { params });
    return response.data;
  } catch (error) {
    // handleApiError will throw the processed error
    return handleApiError(error, 'Failed to fetch courses.');
  }
};

export const fetchCourseByIdentifierAPI = async (identifier) => {
  if (!identifier) {
    throw new Error("Course identifier is required for fetchCourseByIdentifierAPI.");
  }
  try {
    const response = await apiClient.get(`/courses/${identifier}`);
    if (!response.data || typeof response.data.success !== 'boolean') {
        throw new Error('Invalid response structure from server when fetching course details.');
    }
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch course details for "${identifier}".`);
  }
};

export const fetchLessonDetailsAPI = async (courseId, lessonId) => {
  if (!courseId || !lessonId) {
    throw new Error("Course and Lesson identifiers are required.");
  }
  try {
    const response = await apiClient.get(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch lesson content for lesson ${lessonId}.`);
  }
};

export const enrollInCourseAPI = async (courseId) => {
  if (!courseId) {
     throw new Error("Course ID is required for enrollment.");
  }
  try {
    const response = await apiClient.post('/enrollments', { courseId }); 
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to enroll in course.`);
  }
};

export const fetchMyEnrolledCoursesAPI = async () => {
  try {
    const response = await apiClient.get('/enrollments/my-courses');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'Failed to fetch your enrolled courses.');
  }
};

export const submitCourseReviewAPI = async (courseId, reviewData) => {
  if (!courseId) {
    throw new Error("Course ID is required for review submission.");
  }
  try {
    const response = await apiClient.post(`/courses/${courseId}/reviews`, reviewData);
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to submit review for course ${courseId}.`);
  }
};

export const fetchCourseReviewsAPI = async (courseId, params = {}) => {
  if (!courseId) {
    throw new Error("Course ID is required for fetching reviews.");
  }
  try {
    const response = await apiClient.get(`/courses/${courseId}/reviews`, { params });
    return response.data;
  } catch (error) {
    return handleApiError(error, `Failed to fetch course reviews for course ${courseId}.`);
  }
};