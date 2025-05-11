import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const authApiClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for cookie-based authentication
});

// Add retry logic for transient network errors
axiosRetry(authApiClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return !error.response || error.response.status >= 500;
  },
});

// Request interceptor for debugging
authApiClient.interceptors.request.use(
  (config) => {
    console.debug('API Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      withCredentials: config.withCredentials,
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
authApiClient.interceptors.response.use(
  (response) => {
    console.debug('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('401 Unauthorized: Attempting token refresh');
      originalRequest._retry = true;
      try {
        // Attempt to refresh token (adjust endpoint as needed)
        await authApiClient.post('/refresh');
        // Retry the original request
        return authApiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        // Clear any local state (if applicable)
        localStorage.removeItem('token'); // Optional, if using localStorage
        // Redirect to login (handled in AuthContext)
        throw new Error('Session expired. Please log in again.');
      }
    }
    console.error('Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export const registerUserAPI = async (userData) => {
  try {
    const response = await authApiClient.post('/register', userData);
    return response.data;
  } catch (error) {
    const errorData = error.response
      ? error.response.data
      : { success: false, message: 'Registration failed', errors: [error.message] };
    console.error('Error registering user:', errorData);
    throw errorData;
  }
};

export const loginUserAPI = async (credentials) => {
  try {
    const response = await authApiClient.post('/login', credentials);
    return response.data;
  } catch (error) {
    const errorData = error.response
      ? error.response.data
      : { success: false, message: 'Login failed', errors: [error.message] };
    console.error('Error logging in user:', errorData);
    throw errorData;
  }
};

export const fetchCurrentUserAPI = async () => {
  try {
    const response = await authApiClient.get('/me');
    return response.data;
  } catch (error) {
    const errorData = error.response
      ? error.response.data
      : { success: false, message: 'Failed to fetch current user', errors: [error.message] };
    console.error('Error fetching current user:', errorData);
    throw errorData;
  }
};

export const logoutUserAPI = async () => {
  try {
    const response = await authApiClient.post('/logout');
    return response.data;
  } catch (error) {
    const errorData = error.response
      ? error.response.data
      : { success: false, message: 'Logout failed', errors: [error.message] };
    console.error('Error logging out user:', errorData);
    throw errorData;
  }
};

export const requestPasswordResetAPI = async (email) => {
  // try {
    // const response = await authApiClient.post('/request-password-reset', { email });
    // return response.data;
  // } catch (error) {
    // const errorData = error.response
      // ? error.response.data
      // : { success: false, message: 'Password reset request failed', errors: [error.message] };
    // console.error('Error requesting password reset:', errorData);
    // throw errorData;
  // }
};

export const resetPasswordAPI = async (token, passwordData) => {
  // try {
    // const response = await authApiClient.post(`/reset-password/${token}`, passwordData);
    // return response.data;
  // } catch (error) {
    // const errorData = error.response
      // ? error.response.data
      // : { success: false, message: 'Password reset failed', errors: [error.message] };
    // console.error('Error resetting password:', errorData);
    // throw errorData;
  // }
};

export const changePasswordAPI = async (passwordData) => {
  // try {
    // const response = await authApiClient.put('/change-password', passwordData);
    // return response.data;
  // } catch (error) {
    // const errorData = error.response
      // ? error.response.data
      // : { success: false, message: 'Failed to change password', errors: [error.message] };
    // console.error('Error changing  change password:', errorData);
    // throw errorData;
  // }
};

export const deleteAccountAPI = async (data = {}) => {
  // try {
    // const response = await authApiClient.delete('/delete-account', { data });
    // return response.data;
  // } catch (error) {
    // const errorData = error.response
      // ? error.response.data
      // : { success: false, message: 'Failed to delete account', errors: [error.message] };
    // console.error('Error deleting account:', errorData);
    // throw errorData;
  // }
};

// Optional: Helper to check authentication status
export const isAuthenticated = async () => {
  try {
    await fetchCurrentUserAPI();
    return true;
  } catch (error) {
    return false;
  }
};