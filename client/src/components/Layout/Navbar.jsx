// client/src/components/Layout/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css'; // Make sure this CSS file includes styles for .theme-toggle-button
import Button from '../common/Button'; // Assuming you have this styled Button
import { useAuth } from '../../context/AuthContext'; // If still using context for auth

// --- Redux Imports ---
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, selectCurrentTheme } from '../../features/theme/themeSlice.js'; // Import action and selector
// --- End Redux Imports ---

// Optional: Use icons for theme toggle and mobile menu
// import { FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth(); // Get auth state if needed
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- Get theme state and dispatch function from Redux ---
  const currentTheme = useSelector(selectCurrentTheme); // Use the selector
  const dispatch = useDispatch(); // Get the dispatch function
  // --- End Redux State/Dispatch ---

  // Function to toggle theme using the Redux action
  const handleToggleTheme = () => {
    dispatch(toggleTheme()); // Dispatch the toggleTheme action
  };

  // Effect to add/remove the theme class from the body
  // This ensures the CSS variables in index.css apply correctly
  useEffect(() => {
    document.body.className = ''; // Clear previous theme classes
    document.body.classList.add(`${currentTheme}-theme`); // Add current theme class
    // console.log(`Theme set to: ${currentTheme}`); // For debugging
  }, [currentTheme]); // Re-run whenever currentTheme changes in Redux

  // --- Mobile Menu Handlers (remain the same) ---
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // --- Logout Handler (remains the same) ---
  const handleLogout = () => {
    // Add logout logic here (e.g., dispatch Redux logout action if managing auth in Redux)
    if (logout) logout(); // Call context logout if using context
    closeMobileMenu();
    navigate('/');
  };
  // --- End Handlers ---

  return (
    // Use class names from Navbar.css for styling
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          LMS Platform
        </Link>

        {/* Mobile Menu Toggle Button */}
        <button
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Wrapper for Links + Actions */}
        <div className={`navbar-links-auth-wrapper ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
          {/* Main Navigation Links */}
          <ul className="navbar-menu">
            <li className="navbar-item">
              <Link to="/courses" className="navbar-link" onClick={closeMobileMenu}>
                Courses
              </Link>
            </li>
            {isAuthenticated && ( // Check if user is authenticated (from context or Redux)
              <li className="navbar-item">
                <Link to="/dashboard" className="navbar-link" onClick={closeMobileMenu}>
                  Dashboard
                </Link>
              </li>
            )}
            {/* Add other main links here */}
          </ul>

          {/* Actions Section (Theme Toggle + Auth) */}
          <div className="navbar-actions">
             {/* --- Theme Toggle Button --- */}
            <button
              onClick={handleToggleTheme} // Use the Redux dispatching function
              className="theme-toggle-button" // Style this in Navbar.css
              aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} theme`}
            >
               {/* Display icon based on currentTheme from Redux */}
               {currentTheme === 'light' ? '🌙' : '☀️'}
            </button>
            {/* --- End Theme Toggle Button --- */}

            {/* Authentication Links/Buttons */}
            <div className="navbar-auth">
              {isAuthenticated ? (
                <>
                   <span className="navbar-user-greeting">Hi, {user?.name || 'User'}!</span>
                   <Link to="/settings" className="navbar-user-link navbar-link" onClick={closeMobileMenu}>Settings</Link>
                   <button onClick={handleLogout} className="navbar-link logout-button">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobileMenu}>
                     <Button variant="outline" size="small" className="nav-button">Login</Button>
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu}>
                    <Button variant="primary" size="small" className="nav-button">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
            {/* End Authentication */}
          </div>
          {/* End Actions Section */}
        </div>
        {/* End Links + Actions Wrapper */}
      </div>
      {/* End Navbar Container */}
    </nav>
  );
};

export default Navbar;