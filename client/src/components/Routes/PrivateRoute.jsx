import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
// Inside PrivateRoute.jsx
const PrivateRoute = (/*...props...*/) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // *** Add these logs ***
  console.log('PrivateRoute Check: Loading:', loading);
  console.log('PrivateRoute Check: IsAuthenticated:', isAuthenticated);
  // *** End logs ***

  if (loading) {
    return <div>Loading Authentication...</div>;
  }

  if (!isAuthenticated) {
     console.log('PrivateRoute: Redirecting to /login'); // <-- Add log
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('PrivateRoute: Rendering Outlet'); // <-- Add log
  return <Outlet />;
};


export default PrivateRoute;