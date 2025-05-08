// client/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const AuthContext = createContext(null);

// --- Define Your Test User Data Here ---
// !! IMPORTANT !! Replace these values with your actual test user's data
// The 'id' MUST match the user you added 'enrolledCourses' to in dummyUsers.json
// The 'enrolledCourses' MUST contain ACTUAL course IDs from your dummyCourses.json
const testUserData = {
  id: 'user-123', // <<< Replace with YOUR test user ID
  name: 'Test Dev User', // <<< Replace with a test name
  email: 'test-dev@example.com', // <<< Replace with a test email
  role: 'admin', // Or 'admin' if testing admin routes
  enrolledCourses: [
      'course1', // <<< Replace with ACTUAL ID of first enrolled course
      'course3'  // <<< Replace with ACTUAL ID of second enrolled course
  ]
};
// --- End Test User Data ---


// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Start as null initially
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Start as false initially
  const [loading, setLoading] = useState(true); // Start loading

  // Simulate checking initial auth status and log in the test user
  useEffect(() => {
    // Simulate a quick check (e.g., for a token)
    const timer = setTimeout(() => {
      // --- Simulate successful login with test user ---
      console.log("AuthContext: Simulating login for development with user:", testUserData.id);
      setUser(testUserData);
      setIsAuthenticated(true);
      // --- End Simulation ---

      setLoading(false); // Finished initial "check"
    }, 50); // Short delay to mimic async check

    return () => clearTimeout(timer); // Cleanup timer
  }, []); // Run only once on mount

  // Login function (for potential future real login)
  const login = (userData) => {
    // This would override the test user if called
    setUser(userData);
    setIsAuthenticated(true);
    console.log('AuthContext: User logged in (via login function)', userData);
    // localStorage.setItem('token', userData.token); // Example for real auth
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    console.log('AuthContext: User logged out');
    // localStorage.removeItem('token'); // Example for real auth
  };

  // Value provided by the context
  const value = {
    user, // This will be populated with testUserData after the useEffect runs
    isAuthenticated, // This will become true after the useEffect runs
    loading, // True initially, then false
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Only render children after the initial loading/simulation is done */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily use the Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This error guard is important!
    throw new Error('useAuth must be used within an AuthProvider. Make sure your App is wrapped.');
  }
  return context;
};