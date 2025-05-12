// src/services/authService.js
import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const authApiClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`, // Corrected to point to /auth base
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosRetry(authApiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => !error.response || error.response.status >= 500,
});

authApiClient.interceptors.request.use(
  (config) => {
    console.log('[authService INTERCEPTOR] API Request:', { // Changed to log for visibility
      url: config.url, method: config.method, data: config.data, params: config.params 
    });
    return config;
  },
  (error) => {
    console.error('[authService INTERCEPTOR] Request Error:', error.message, error.config);
    return Promise.reject(error);
  }
);

authApiClient.interceptors.response.use(
  (response) => {
    console.log('[authService INTERCEPTOR] API Response:', { // Changed to log for visibility
      url: response.config.url, status: response.status, data: response.data 
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error('[authService INTERCEPTOR] Response Error (Initial):', { 
        url: originalRequest?.url, status: error.response?.status, data: error.response?.data, message: error.message 
    });

    if (error.response?.status === 401 && originalRequest && !originalRequest._retryAttempted) {
      console.warn('[authService INTERCEPTOR] 401 Unauthorized. Attempting token refresh for request to:', originalRequest.url);
      originalRequest._retryAttempted = true; // Mark that we've tried to refresh for this request
      try {
        console.log('[authService INTERCEPTOR] Calling /refresh endpoint...');
        // Ensure your backend has a POST /api/auth/refresh endpoint
        const refreshResponse = await authApiClient.post('/refresh'); 
        console.log('[authService INTERCEPTOR] /refresh response:', refreshResponse.data);
        // If refresh is successful, backend should set a new cookie.
        // Then retry the original request.
        console.log('[authService INTERCEPTOR] Token refresh successful, retrying original request:', originalRequest.url);
        return authApiClient(originalRequest);
      } catch (refreshError) {
        console.error('[authService INTERCEPTOR] Token refresh failed:', refreshError.response?.data || refreshError.message);
        // TODO: Implement proper logout or redirect logic here or in AuthContext based on this failure
        // For now, just rethrow a specific error indicating refresh failure.
        const specificError = new Error('Session refresh failed. Please log in again.');
        specificError.isRefreshError = true;
        specificError.originalErrorData = refreshError.response?.data;
        throw specificError;
      }
    }
    // If it's not a 401, or if refresh already attempted, or other error, reject with the original error details.
    return Promise.reject(error);
  }
);

export const fetchCurrentUserAPI = async () => {
  console.log('authService: fetchCurrentUserAPI [START] - Attempting GET /me');
  try {
    const response = await authApiClient.get('/me'); // This calls baseURL + /me
    console.log('authService: fetchCurrentUserAPI - GET /me successful. Response data:', response.data);
    // Backend should return { success: true, data: { user: ... } } or { success: false, ... }
    return response.data;
  } catch (error) {
    // This catch block will receive errors from Axios (network, HTTP status codes)
    // or errors re-thrown by the interceptor (like the session refresh failure).
    console.error('authService: fetchCurrentUserAPI - CATCH block. Error making GET /me:', error);
    
    if (error.isRefreshError) { // Custom property we set if refresh failed
        throw { success: false, message: error.message, errors: [error.message], originalErrorData: error.originalErrorData };
    }
    
    const errorData = error.response?.data || { 
      success: false, 
      message: error.message || 'Failed to fetch current user due to an unknown error in service.', 
      errors: [error.message || 'Unknown error'] 
    };
    console.error('authService: fetchCurrentUserAPI - Processed errorData to throw:', errorData);
    throw errorData; // Ensure a structured error is thrown
  } finally {
    console.log('authService: fetchCurrentUserAPI [END]');
  }
};

// ... other API functions (loginUserAPI, registerUserAPI, logoutUserAPI)
// Ensure they also use authApiClient and have similar try/catch logging if needed.

export const loginUserAPI = async (credentials) => {
  console.log('authService: loginUserAPI [START] - Attempting POST /login');
  try {
    const response = await authApiClient.post('/login', credentials);
    console.log('authService: loginUserAPI - POST /login successful. Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('authService: loginUserAPI - CATCH block. Error:', error);
    const errorData = error.response?.data || { success: false, message: error.message || 'Login failed in service.', errors: [error.message] };
    throw errorData;
  } finally {
    console.log('authService: loginUserAPI [END]');
  }
};

export const registerUserAPI = async (userData) => {
  console.log('authService: registerUserAPI [START] - Attempting POST /register');
  try {
    const response = await authApiClient.post('/register', userData);
    console.log('authService: registerUserAPI - POST /register successful. Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('authService: registerUserAPI - CATCH block. Error:', error);
    const errorData = error.response?.data || { success: false, message: error.message || 'Registration failed in service.', errors: [error.message] };
    throw errorData;
  } finally {
    console.log('authService: registerUserAPI [END]');
  }
};

export const logoutUserAPI = async () => {
  console.log('authService: logoutUserAPI [START] - Attempting POST /logout');
  try {
    const response = await authApiClient.post('/logout');
    console.log('authService: logoutUserAPI - POST /logout successful. Response data:', response.data);
    return response.data;
  } catch (error) {
    console.error('authService: logoutUserAPI - CATCH block. Error:', error);
    const errorData = error.response?.data || { success: false, message: error.message || 'Logout failed in service.', errors: [error.message] };
    throw errorData;
  } finally {
    console.log('authService: logoutUserAPI [END]');
  }
};

// Commented out API functions should also be reviewed if/when implemented
export const requestPasswordResetAPI = async (email) => { /* ... */ };
export const resetPasswordAPI = async (token, passwordData) => { /* ... */ };
export const changePasswordAPI = async (passwordData) => { /* ... */ };
export const deleteAccountAPI = async (data = {}) => { /* ... */ };

export const isAuthenticated = async () => {
  try {
    await fetchCurrentUserAPI(); // This will have the new logging
    return true;
  } catch (error) {
    return false;
  }
};