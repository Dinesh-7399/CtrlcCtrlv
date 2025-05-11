// src/services/contactService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Submits the contact form data to the backend.
 * @param {object} formData - { name, email, subject, message }
 * @returns {Promise<object>} API response data.
 */
export const submitContactFormAPI = async (formData) => {
  try {
    // Replace '/contact/submit' with your actual backend endpoint for contact form submissions
    const response = await apiClient.post('/contact/submit', formData);
    // Assuming backend returns: { success: true, message: "Your message has been sent successfully!" }
    // or { success: false, message/errors: "..." }
    return response.data;
  } catch (error) {
    console.error('Error submitting contact form:', error.response ? error.response.data : error.message);
    // Rethrow a structured error that the slice can handle
    throw error.response ? error.response.data : new Error('Failed to submit contact form due to a network or server issue.');
  }
};