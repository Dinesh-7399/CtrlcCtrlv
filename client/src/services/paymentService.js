// src/services/paymentService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create an axios instance for API calls
// This instance should be configured to send credentials (like HttpOnly cookies) if your backend requires authentication for these endpoints.
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sessions/cookies
});

/**
 * Creates a payment order on the backend.
 * @param {string} courseId - The ID of the course for which the order is being created.
 * @returns {Promise<object>} API response data.
 */
export const createPaymentOrderAPI = async (courseId) => {
  try {
    // Endpoint: POST /api/payment/create-order (matches existing CheckoutPage)
    const response = await apiClient.post('/payment/create-order', { courseId });
    return response.data; // Expected: { success: true, data: { id (order_id), amount, currency, key (key_id) } } or error
  } catch (error) {
    console.error('Error creating payment order:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to create payment order');
  }
};

/**
 * Verifies a payment on the backend after Razorpay processes it.
 * @param {object} verificationData - Data from Razorpay (razorpay_order_id, razorpay_payment_id, razorpay_signature) and courseId.
 * @returns {Promise<object>} API response data.
 */
export const verifyPaymentAPI = async (verificationData) => {
  try {
    // Endpoint: POST /api/payment/verify (matches existing CheckoutPage)
    const response = await apiClient.post('/payment/verify', verificationData);
    return response.data; // Expected: { success: true, message: "Payment verified" } or error
  } catch (error) {
    console.error('Error verifying payment:', error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error('Failed to verify payment');
  }
};