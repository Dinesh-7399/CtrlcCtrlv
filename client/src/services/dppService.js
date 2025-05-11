// src/services/dppService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For HttpOnly JWT cookie if needed for this endpoint
});

/**
 * Submits DPP solution metadata (like file URL and comments) to the backend.
 * @param {object} submissionData - { courseId, lessonId, dppId, fileUrl, originalFileName, comments? }
 * @returns {Promise<object>} API response data.
 */
export const submitDppSolutionAPI = async (submissionData) => {
  try {
    // Adjust the endpoint as per your backend API, e.g., /dpp/:dppId/submit
    // or /lessons/:lessonId/dpp/submit
    const response = await apiClient.post(`/dpps/${submissionData.dppId}/submit`, submissionData);
    // Assuming backend returns: { success: true, message: "Solution submitted successfully!", data: { submission } }
    return response.data;
  } catch (error) {
    console.error('Error submitting DPP solution:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to submit DPP solution');
  }
};

/**
 * Fetches DPP details and prior submission if any (Optional - if not part of CoursesSlice)
 * @param {string} dppId - The ID of the DPP.
 * @returns {Promise<object>} API response data.
 */
export const fetchDppDetailsAndSubmissionAPI = async (dppId) => {
    try {
        const response = await apiClient.get(`/dpps/${dppId}/details`); // Example endpoint
        return response.data; // Expected: { success: true, data: { dpp: {}, submission: {} } }
    } catch (error) {
        console.error(`Error fetching DPP details for ${dppId}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Failed to fetch DPP details.');
    }
};