// src/services/adminCourseService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const adminApiClient = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Fetch all courses for admin panel (with pagination and filters)
export const fetchAdminCoursesListAPI = async (params = {}) => {
  try {
    const response = await adminApiClient.get('/courses', { params });
    // Assuming ApiResponse structure: { success, data: { courses, currentPage, totalPages, totalCourses }, message }
    return response.data;
  } catch (error) {
    console.error('Error fetching admin courses list:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch courses list for admin');
  }
};

// Fetch a single course by ID for admin
export const fetchAdminCourseByIdAPI = async (courseId) => {
  try {
    const response = await adminApiClient.get(`/courses/${courseId}`);
    return response.data; // Expects ApiResponse: { success, data: { course }, message }
  } catch (error) {
    console.error(`Error fetching admin course ${courseId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch course for admin');
  }
};

// Create a new course by admin
export const createAdminCourseAPI = async (courseData) => {
  try {
    const response = await adminApiClient.post('/courses', courseData);
    return response.data; // Expects ApiResponse: { success, data: { course }, message }
  } catch (error) {
    console.error('Error creating admin course:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to create course');
  }
};

// Update an existing course by admin
export const updateAdminCourseAPI = async (courseId, courseData) => {
  try {
    const response = await adminApiClient.put(`/courses/${courseId}`, courseData);
    return response.data; // Expects ApiResponse: { success, data: { course }, message }
  } catch (error) {
    console.error(`Error updating admin course ${courseId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to update course');
  }
};

// Delete a course by admin
export const deleteAdminCourseAPI = async (courseId) => {
  try {
    const response = await adminApiClient.delete(`/courses/${courseId}`);
    return response.data; // Expects ApiResponse: { success, message }
  } catch (error) {
    console.error(`Error deleting admin course ${courseId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to delete course');
  }
};

// You might have other admin course related APIs here (e.g., for modules, lessons within admin context)