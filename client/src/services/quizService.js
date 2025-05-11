// src/services/quizService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // If authentication is cookie-based
});

/**
 * Submits quiz answers to the backend for grading and storage.
 * @param {object} submissionData - { quizId, courseId, lessonId, answers: { questionId: selectedOption, ... } }
 * @returns {Promise<object>} API response data.
 * Expected: { success: true, data: { score, totalQuestions, gradedAnswers: [{questionId, selected, correct, correctAnswer}], attemptId }, message }
 */
export const submitQuizAnswersAPI = async (submissionData) => {
  try {
    // Adjust your endpoint: e.g., POST /api/quizzes/:quizId/submit
    // or /api/courses/:courseId/lessons/:lessonId/quiz/submit
    const response = await apiClient.post(`/quizzes/${submissionData.quizId}/submit`, submissionData);
    return response.data;
  } catch (error) {
    console.error('Error submitting quiz answers:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to submit quiz answers');
  }
};

/**
 * Fetches details for a specific quiz (Optional - if not fully covered by CoursesSlice).
 * @param {string} quizId - The ID of the quiz.
 * @returns {Promise<object>} API response data.
 */
export const fetchQuizDetailsAPI = async (quizId) => {
    try {
        const response = await apiClient.get(`/quizzes/${quizId}`); // Example endpoint
        // Expected: { success: true, data: { id, title, questions: [...] } }
        return response.data;
    } catch (error) {
        console.error(`Error fetching quiz details for ${quizId}:`, error.response ? error.response.data : error.message);
        throw error.response ? error.response.data : new Error('Failed to fetch quiz details.');
    }
};