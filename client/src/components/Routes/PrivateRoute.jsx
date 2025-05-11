// client/src/components/routes/PrivateRoute.jsx (or your specific path)
import React from 'react';
import { useAuth } from '../../context/AuthContext'; // Adjust path to your AuthContext
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Spinner from '../common/Spinner'; // Assuming you have a common Spinner component

const PrivateRoute = () => {
  // 'loading' here should reflect the initial loading state of the AuthContext
  // when it's trying to determine if a user is already authenticated (e.g., via a stored token)
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Debugging logs (keep them during development if helpful)
  console.log('PrivateRoute Check: loading:', loading);
  console.log('PrivateRoute Check: isAuthenticated:', isAuthenticated);
  if (user) {
    console.log('PrivateRoute Check: User Info:', { id: user.id, role: user.role });
  } else {
    console.log('PrivateRoute Check: User object is null or undefined.');
  }

  if (loading) {
    // Display a full-page loader or a more integrated spinner
    // while the initial authentication check is in progress.
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center' }}>
        <Spinner size="large" />
        <p style={{ marginTop: '1rem' }}>Verifying authentication, please wait...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // User is not authenticated after the check, redirect them to the login page.
    // 'state={{ from: location }}' is good practice: it allows you to redirect the user
    // back to the page they were trying to access after they successfully log in.
    console.log(`PrivateRoute: User not authenticated. Redirecting from "${location.pathname}" to "/login".`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected component via <Outlet />
  console.log(`PrivateRoute: User is authenticated. Rendering Outlet for path "${location.pathname}".`);
  return <Outlet />;
};

export default PrivateRoute;