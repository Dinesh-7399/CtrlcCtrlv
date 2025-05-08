// client/src/components/Routes/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../common/Spinner'; // Assuming you have a Spinner component

const AdminRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show loading indicator while checking auth status
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spinner size="large" />
        </div>
    );
  }

  // Check authentication status
  if (!isAuthenticated) {
    // Not logged in, redirect to login page, saving the current location
    console.log('AdminRoute: Not authenticated, redirecting to login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // *** Role Check (Simulated/Placeholder) ***
  // In a real app, user.role would come from the verified token/backend
  // For now, we might assume the simulated user IS an admin, or add a temporary bypass
  const isAdmin = user?.role === 'admin'; // Check if the user object has the admin role

  // --- TEMPORARY BYPASS FOR DEVELOPMENT (REMOVE LATER) ---
  // Uncomment the line below to allow access even if user.role isn't 'admin' during frontend dev
  // const isAdmin = true;
  // console.warn('AdminRoute: Role check bypass active for development!');
  // --- END TEMPORARY BYPASS ---


  if (!isAdmin) {
      // Logged in, but not an admin - redirect to user dashboard or homepage
      console.log('AdminRoute: Not authorized (not admin), redirecting to dashboard.');
      // You could show an "Unauthorized" page instead
      return <Navigate to="/dashboard" state={{ message: "You are not authorized to access this page." }} replace />;
  }

  // User is authenticated AND is an admin, render the requested admin page
  console.log('AdminRoute: Authorized, rendering admin content.');
  return <Outlet />; // Renders the nested route defined in App.jsx (e.g., AdminLayout)
};

export default AdminRoute;
