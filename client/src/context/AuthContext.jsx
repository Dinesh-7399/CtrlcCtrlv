// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchCurrentUserAPI,
  loginUserAPI,
  logoutUserAPI,
  registerUserAPI
} from '../services/authService'; // Adjust path as needed

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [internalCurrentUser, setInternalCurrentUser] = useState(null); // Renamed to avoid confusion
  const [internalIsAuthenticated, setInternalIsAuthenticated] = useState(false); // Renamed
  const [internalIsLoading, setInternalIsLoading] = useState(true); // Renamed for clarity
  const [internalAuthError, setInternalAuthError] = useState(null); // Renamed

  const handleAuthSuccess = (userData) => {
    console.log('AuthContext: handleAuthSuccess called with userData:', userData);
    setInternalCurrentUser(userData);
    setInternalIsAuthenticated(true);
    setInternalAuthError(null); // Clear any previous errors
  };

  const handleAuthFailure = (errorMsg = null, isLogout = false) => {
    console.log(`AuthContext: handleAuthFailure called. Error: "${errorMsg}", IsLogout: ${isLogout}`);
    setInternalCurrentUser(null);
    setInternalIsAuthenticated(false);
    if (errorMsg && !isLogout) { // Only set authError if it's a real error, not a logout
      setInternalAuthError(errorMsg);
    } else {
      setInternalAuthError(null); // Clear error on logout or if no specific error message
    }
  };

  const checkAuthState = useCallback(async () => {
    console.log('AuthContext: checkAuthState - Starting initial authentication check.');
    setInternalIsLoading(true);
    setInternalAuthError(null); // Clear previous errors
    try {
      const response = await fetchCurrentUserAPI();
      console.log('AuthContext: checkAuthState - API response received:', response);
      if (response.success && response.data.user) {
        handleAuthSuccess(response.data.user);
      } else {
        // API reported success:false or no user data
        handleAuthFailure(response.message || 'Session validation returned no user or failed.');
      }
    } catch (error) {
      // Network error or error thrown by fetchCurrentUserAPI
      const message = error.message || 'No active session or failed to connect during checkAuthState.';
      console.error('AuthContext: checkAuthState - API call failed:', error);
      handleAuthFailure(message);
    } finally {
      setInternalIsLoading(false);
      console.log('AuthContext: checkAuthState - Finished. Loading set to false.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: memoize once, as it has no external dependencies

  useEffect(() => {
    console.log('AuthContext: Provider mounted. Calling checkAuthState.');
    checkAuthState();
  }, [checkAuthState]); // checkAuthState is stable due to useCallback([])

  const login = async (credentials) => {
    console.log('AuthContext: login - Attempting login with credentials:', credentials);
    setInternalIsLoading(true);
    setInternalAuthError(null);
    try {
      const response = await loginUserAPI(credentials);
      console.log('AuthContext: login - API response:', response);
      if (response.success && response.data.user) {
        handleAuthSuccess(response.data.user);
        return response.data.user; // Return user data for component to use if needed
      } else {
        const loginErrorMessage = response.message || 'Login failed: Unexpected response structure.';
        handleAuthFailure(loginErrorMessage);
        throw new Error(loginErrorMessage); // Propagate error for form handling
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      handleAuthFailure(errorMessage);
      console.error('AuthContext: login - Error during login:', error);
      throw error; // Re-throw for component to handle
    } finally {
      setInternalIsLoading(false);
      console.log('AuthContext: login - Finished. Loading set to false.');
    }
  };

  const register = async (userData) => {
    console.log('AuthContext: register - Attempting registration with data:', userData);
    setInternalIsLoading(true);
    setInternalAuthError(null);
    try {
      const response = await registerUserAPI(userData);
      console.log('AuthContext: register - API response:', response);
      if (response.success && response.data.user) {
        handleAuthSuccess(response.data.user);
        return response.data.user;
      } else {
        const regErrorMessage = response.message || 'Registration failed: Unexpected response structure.';
        handleAuthFailure(regErrorMessage);
        throw new Error(regErrorMessage);
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      handleAuthFailure(errorMessage);
      console.error('AuthContext: register - Error during registration:', error);
      throw error;
    } finally {
      setInternalIsLoading(false);
      console.log('AuthContext: register - Finished. Loading set to false.');
    }
  };

  const logout = async () => {
    console.log('AuthContext: logout - Initiating logout.');
    setInternalIsLoading(true); // Optional: if logoutUserAPI is slow or you want a loading state
    setInternalAuthError(null); // Clear any existing errors on logout action
    try {
      await logoutUserAPI();
      console.log('AuthContext: logout - API call successful.');
    } catch (error) {
      console.error('AuthContext: logout - API call failed:', error.message || error);
      // Still proceed to clear client-side state even if API fails
    } finally {
      handleAuthFailure(null, true); // Clear user state, indicate it's a logout (so no error is set)
      setInternalIsLoading(false);
      console.log('AuthContext: logout - Finished. Client state cleared, loading set to false.');
      // Navigation after logout should be handled by the UI component that calls logout,
      // or by a top-level effect watching the `user` state.
    }
  };

  // *** THIS IS THE CRITICAL CHANGE FOR YOUR COMPONENTS ***
  // The 'value' object provided to the context consumers.
  // Names here (user, loading, error) MUST match what components expect from useAuth().
  const value = {
    user: internalCurrentUser,        // Expose internalCurrentUser as 'user'
    isAuthenticated: internalIsAuthenticated, // Can be derived from 'user !== null' but kept for explicitness
    loading: internalIsLoading,       // Expose internalIsLoading as 'loading'
    error: internalAuthError,         // Expose internalAuthError as 'error' (more common than authError)
    login,
    register,
    logout,
    checkAuthState, // Exposing this if components need to trigger a re-check, otherwise can be omitted
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};