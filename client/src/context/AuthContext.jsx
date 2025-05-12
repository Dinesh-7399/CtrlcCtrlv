// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentUserAPI,
  loginUserAPI,
  logoutUserAPI,
  registerUserAPI
} from '../services/authService'; // Ensure this path is correct

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [internalCurrentUser, setInternalCurrentUser] = useState(null);
  const [internalIsAuthenticated, setInternalIsAuthenticated] = useState(false);
  const [internalIsLoading, setInternalIsLoading] = useState(true); // Start true
  const [internalAuthError, setInternalAuthError] = useState(null);

  console.log('AuthContext: Provider rendering. Current state:', { 
    user: internalCurrentUser, 
    isAuthenticated: internalIsAuthenticated, 
    isLoading: internalIsLoading, 
    error: internalAuthError 
  });

  const handleAuthSuccess = (userData) => {
    console.log('AuthContext: handleAuthSuccess - User data:', userData);
    setInternalCurrentUser(userData);
    setInternalIsAuthenticated(true);
    setInternalAuthError(null);
    // setInternalIsLoading(false); // isLoading should be set in the main async function's finally block
  };

  const handleAuthFailure = (errorMsg = null, isLogout = false) => {
    console.log(`AuthContext: handleAuthFailure - Error: "${errorMsg}", IsLogout: ${isLogout}`);
    setInternalCurrentUser(null);
    setInternalIsAuthenticated(false);
    if (errorMsg && !isLogout) {
      setInternalAuthError(errorMsg);
    } else {
      setInternalAuthError(null);
    }
    // setInternalIsLoading(false); // isLoading should be set in the main async function's finally block
  };

  const checkAuthState = useCallback(async () => {
    console.log('AuthContext: checkAuthState [START]');
    // This is critical: Ensure isLoading is true BEFORE the async operation
    // If it's already true from initial state, this might seem redundant but ensures it if called again.
    setInternalIsLoading(true); 
    setInternalAuthError(null); // Clear previous errors at the start of a check

    try {
      console.log('AuthContext: checkAuthState - Attempting to call fetchCurrentUserAPI()...');
      const response = await fetchCurrentUserAPI(); // FROM authService.js
      
      // This log will tell us what fetchCurrentUserAPI() returned BEFORE any conditions
      console.log('AuthContext: checkAuthState - Raw response from fetchCurrentUserAPI():', response);

      if (response && response.success && response.data && response.data.user) {
        console.log('AuthContext: checkAuthState - API success, user data found.');
        handleAuthSuccess(response.data.user);
      } else {
        // This includes cases where response.success is false, or response.data.user is missing
        const message = response?.message || 'Session validation failed or user data missing in response.';
        console.log('AuthContext: checkAuthState - API reported no user or failure:', message, 'Full response:', response);
        handleAuthFailure(message);
      }
    } catch (error) {
      // This catches errors from fetchCurrentUserAPI (network, 4xx/5xx, or errors thrown by the service itself)
      // The error object here should be what authService.js throws in its catch blocks
      const errorMessage = error?.message || error?.errors?.join(', ') || 'An unexpected error occurred during authentication check.';
      console.error('AuthContext: checkAuthState - CATCH block. Error from fetchCurrentUserAPI():', errorMessage, 'Full error object:', error);
      handleAuthFailure(errorMessage);
    } finally {
      // THIS MUST ALWAYS RUN to stop loading spinners
      setInternalIsLoading(false);
      console.log('AuthContext: checkAuthState [END] - internalIsLoading set to false.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // useCallback with empty deps ensures checkAuthState function reference is stable

  useEffect(() => {
    console.log('AuthContext: Provider useEffect[] fired. Calling checkAuthState. (Timestamp: ' + new Date().toLocaleTimeString() + ')');
    checkAuthState();
  }, [checkAuthState]);

  // LOGIN function
  const login = async (credentials) => {
    console.log('AuthContext: login [START]');
    setInternalIsLoading(true);
    setInternalAuthError(null);
    try {
      const response = await loginUserAPI(credentials); // from authService.js
      console.log('AuthContext: login - Raw response from loginUserAPI():', response);
      if (response && response.success && response.data && response.data.user) {
        handleAuthSuccess(response.data.user);
        return response.data.user;
      } else {
        const loginErrorMessage = response?.message || 'Login failed: Unexpected API response structure.';
        handleAuthFailure(loginErrorMessage);
        throw new Error(loginErrorMessage);
      }
    } catch (error) {
      const errorMessage = error?.message || error?.errors?.join(', ') || 'Login attempt failed.';
      console.error('AuthContext: login - CATCH block. Error:', errorMessage, 'Full error object:', error);
      handleAuthFailure(errorMessage);
      throw new Error(errorMessage); // Re-throw for form error handling
    } finally {
      setInternalIsLoading(false);
      console.log('AuthContext: login [END] - internalIsLoading set to false.');
    }
  };

  // REGISTER function
  const register = async (userData) => {
    console.log('AuthContext: register [START]');
    setInternalIsLoading(true);
    setInternalAuthError(null);
    try {
      const response = await registerUserAPI(userData); // from authService.js
      console.log('AuthContext: register - Raw response from registerUserAPI():', response);
      if (response && response.success && response.data && response.data.user) {
        handleAuthSuccess(response.data.user);
        return response.data.user;
      } else {
        const regErrorMessage = response?.message || 'Registration failed: Unexpected API response structure.';
        handleAuthFailure(regErrorMessage);
        throw new Error(regErrorMessage);
      }
    } catch (error) {
      const errorMessage = error?.message || error?.errors?.join(', ') || 'Registration attempt failed.';
      console.error('AuthContext: register - CATCH block. Error:', errorMessage, 'Full error object:', error);
      handleAuthFailure(errorMessage);
      throw new Error(errorMessage); // Re-throw for form error handling
    } finally {
      setInternalIsLoading(false);
      console.log('AuthContext: register [END] - internalIsLoading set to false.');
    }
  };

  // LOGOUT function
  const logout = async () => {
    console.log('AuthContext: logout [START]');
    setInternalIsLoading(true); // Optional: show loading during logout API call
    setInternalAuthError(null);
    try {
      await logoutUserAPI(); // from authService.js
      console.log('AuthContext: logout - logoutUserAPI() successful.');
    } catch (error) {
      // Even if API fails, we still want to log out on client, but log the API error
      const errorMessage = error?.message || error?.errors?.join(', ') || 'Logout API call failed.';
      console.error('AuthContext: logout - CATCH block. Error from logoutUserAPI():', errorMessage, 'Full error object:', error);
    } finally {
      handleAuthFailure(null, true); // true for isLogout, so no error is set on authError state
      setInternalIsLoading(false);
      console.log('AuthContext: logout [END] - Client state cleared, internalIsLoading set to false.');
    }
  };

  const value = {
    user: internalCurrentUser,
    isAuthenticated: internalIsAuthenticated,
    loading: internalIsLoading, // This is what your Navbar uses
    error: internalAuthError,
    login,
    register,
    logout,
    // checkAuthState, // Typically not exposed; runs on mount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};