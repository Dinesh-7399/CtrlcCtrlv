// client/src/services/courseService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Centralized API Error Handler
const handleApiError = (error, defaultMessage = 'An unexpected API error occurred.') => {
  console.error(`API Service Error [${error.config?.method?.toUpperCase()} ${error.config?.url}]: ${error.message}`, {
    requestPath: error.config?.url,
    responseData: error.response?.data,
    responseStatus: error.response?.status,
    originalError: error, // Keep original error for deeper debugging if needed
  });

  if (error.response && error.response.data) {
    const errorData = error.response.data; // This is your backend's ApiError structure or other error response
    return {
      message: errorData.message || defaultMessage,
      status: error.response.status,
      errors: errorData.errors || [], // Field-specific errors
      isApiServiceError: true, // Custom flag
    };
  } else if (error.request) {
    return {
      message: 'Network Error: Could not connect to the server. Please check your connection.',
      status: null,
      isApiServiceError: true,
    };
  } else {
    return {
      message: error.message || defaultMessage,
      status: null,
      isApiServiceError: true,
    };
  }
};

export const fetchCoursesAPI = async (params = {}) => {
  try {
    const response = await apiClient.get('/courses', { params });
    // response.data is expected to be from your backend's ApiResponse utility
    // e.g., { success: true, data: { courses: [], ... }, message: "..." }
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch courses.');
  }
};

export const fetchCourseByIdentifierAPI = async (identifier) => {
  try {
    const response = await apiClient.get(`/courses/${identifier}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, `Failed to fetch course details for "${identifier}".`);
  }
};

export const fetchLessonDetailsAPI = async (courseId, lessonId) => {
  try {
    const response = await apiClient.get(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, `Failed to fetch lesson details for lesson ${lessonId}.`);
  }
};

export const enrollInCourseAPI = async (courseId) => {
  try {
    const response = await apiClient.post('/enrollments', { courseId });
    return response.data;
  } catch (error) {
    throw handleApiError(error, `Failed to enroll in course ${courseId}.`);
  }
};

export const fetchMyEnrolledCoursesAPI = async () => {
  try {
    const response = await apiClient.get('/enrollments/my-courses');
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch your enrolled courses.');
  }
};

export const submitCourseReviewAPI = async (courseId, reviewData) => {
  try {
    const response = await apiClient.post(`/courses/${courseId}/reviews`, reviewData);
    return response.data;
  } catch (error) {
    throw handleApiError(error, `Failed to submit review for course ${courseId}.`);
  }
};

export const fetchCourseReviewsAPI = async (courseId, params = {}) => {
  try {
    const response = await apiClient.get(`/courses/${courseId}/reviews`, { params });
    return response.data;
  } catch (error) {
    throw handleApiError(error, `Failed to fetch course reviews for course ${courseId}.`);
  }
};