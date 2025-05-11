// client/src/components/Layout/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from '../../context/AuthContext'; // Ensure this path is correct and useAuth provides correct states
import Button from '../common/Button'; // Ensure this component is working as expected
import './Navbar.css';
import { FaSun, FaMoon, FaSearch, FaUserCircle, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import { toggleTheme, selectCurrentTheme } from '../../features/theme/themeSlice';

// Placeholder for Spinner if it's a custom component
const Spinner = ({ size }) => <div style={{ padding: '5px', fontSize: size === 'small' ? '0.8em' : '1em', display: 'inline-block' }}>Loading...</div>;

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Critical: The values of 'user' and 'authLoading' from useAuth() determine UI
  const { user, logout: contextLogout, loading: authLoading } = useAuth();
  const currentTheme = useSelector(selectCurrentTheme);

  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // General log to see the state on every render
  console.log('[Navbar Render] Auth State:', { user, authLoading, isAuthenticated: !!user });

  useEffect(() => {
    document.body.className = ''; // Clear existing theme classes
    document.body.classList.add(`${currentTheme}-theme`);
  }, [currentTheme]);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await contextLogout();
      setIsProfileDropdownOpen(false);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeAllMenus = () => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  };

  const closeMobileMenuOnly = () => {
    setIsMobileMenuOpen(false);
  };

  // Helper function to render auth-dependent sections with logging
  const renderAuthSensitiveContent = (sectionName, loggedInContent, loggedOutContent) => {
    if (authLoading) {
      console.log(`[Navbar Diagnostics] Rendering <Spinner /> for "${sectionName}" because authLoading is true.`);
      return <Spinner size="small" />;
    }
    if (user) {
      console.log(`[Navbar Diagnostics] Rendering Logged-In UI for "${sectionName}" because authLoading is false and user object exists. User:`, JSON.stringify(user));
      return loggedInContent;
    }
    console.log(`[Navbar Diagnostics] Rendering Logged-Out UI for "${sectionName}" because authLoading is false and user is falsy. User:`, user);
    return loggedOutContent;
  };

  return (
    <nav className={`navbar ${isMobileMenuOpen ? 'mobile-menu-active' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeAllMenus}>
          LMS Platform
        </Link>

        <form onSubmit={handleSearchSubmit} className="navbar-search-form">
          <input
            type="search"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="navbar-search-input"
          />
          <Button type="submit" variant="icon" className="navbar-search-button" aria-label="Search">
            <FaSearch />
          </Button>
        </form>

        <div className="navbar-mobile-header-actions">
          {!authLoading && user && ( // This small section also depends on user state
            <Link
              to="/dashboard"
              className="navbar-mobile-profile-icon"
              aria-label="View Profile"
              onClick={closeMobileMenuOnly}
            >
              <FaUserCircle size={22} />
            </Link>
          )}
          <div
            className="navbar-hamburger-icon"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && toggleMobileMenu()}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>

        <ul className={`navbar-links ${isMobileMenuOpen ? 'active' : ''}`}>
          <li><NavLink to="/courses" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenuOnly}>Courses</NavLink></li>
          <li><NavLink to="/articles" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenuOnly}>Articles</NavLink></li>
          <li><NavLink to="/qna" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenuOnly}>Q&A</NavLink></li>
          <li><NavLink to="/contact" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={closeMobileMenuOnly}>Contact</NavLink></li>

          <li className="navbar-actions-in-mobile-slideout-menu">
            <Button onClick={handleThemeToggle} variant="icon" aria-label="Toggle theme" className="theme-toggle-button-mobile-slideout">
              {currentTheme === 'light' ? <FaMoon /> : <FaSun />}
            </Button>
            {renderAuthSensitiveContent(
              "Mobile Slideout Actions",
              ( // Logged-in content for mobile
                <div className="profile-actions-in-mobile-slideout-menu">
                  <NavLink to="/dashboard" className="nav-link" onClick={closeMobileMenuOnly}>Dashboard</NavLink>
                  <NavLink to="/settings" className="nav-link" onClick={closeMobileMenuOnly}>Settings</NavLink>
                  {user && user.role === 'ADMIN' && ( // Ensure user exists before checking role
                    <NavLink to="/admin/dashboard" className="nav-link" onClick={closeMobileMenuOnly}>Admin Panel</NavLink>
                  )}
                  <Button onClick={handleLogout} variant="secondary" size="small" className="logout-button-mobile-slideout">Logout</Button>
                </div>
              ),
              ( // Logged-out content for mobile
                <div className="auth-actions-in-mobile-slideout-menu">
                  <Link to="/login" onClick={closeMobileMenuOnly}><Button variant="outline" size="small">Login</Button></Link>
                  <Link to="/register" onClick={closeMobileMenuOnly}><Button variant="primary" size="small">Sign Up</Button></Link>
                </div>
              )
            )}
          </li>
        </ul>

        <div className="navbar-actions-desktop">
          <Button onClick={handleThemeToggle} variant="icon" aria-label="Toggle theme" className="theme-toggle-button">
            {currentTheme === 'light' ? <FaMoon /> : <FaSun />}
          </Button>
          {renderAuthSensitiveContent(
            "Desktop Actions",
            ( // Logged-in content for desktop
              <>
                <div className="profile-dropdown-container" ref={profileDropdownRef}>
                  <Button
                    onClick={toggleProfileDropdown}
                    variant="icon"
                    className="profile-button"
                    aria-label="Profile menu"
                    aria-expanded={isProfileDropdownOpen}
                    title="Profile options"
                  >
                    <FaUserCircle size={24} />
                    <FaChevronDown className={`dropdown-arrow ${isProfileDropdownOpen ? 'open' : ''}`} />
                  </Button>
                  {isProfileDropdownOpen && (
                    <div className="profile-dropdown-menu">
                      <div className="dropdown-user-info">
                        <strong>{user?.name || 'User'}</strong> {/* Optional chaining for safety */}
                        <small>{user?.email}</small> {/* Optional chaining for safety */}
                      </div>
                      <NavLink to="/dashboard" className="dropdown-item" onClick={closeAllMenus}>Dashboard</NavLink>
                      <NavLink to="/settings" className="dropdown-item" onClick={closeAllMenus}>Settings</NavLink>
                      {user && user.role === 'ADMIN' && ( // Ensure user exists before checking role
                        <NavLink to="/admin/dashboard" className="dropdown-item" onClick={closeAllMenus}>Admin Panel</NavLink>
                      )}
                    </div>
                  )}
                </div>
                <Button onClick={handleLogout} variant="outline" className="logout-btn-desktop">
                  Logout
                </Button>
              </>
            ),
            ( // Logged-out content for desktop
              <>
                <Link to="/login"><Button variant="outline" className="login-btn-desktop">Login</Button></Link>
                <Link to="/register"><Button variant="primary" className="signup-btn-desktop">Sign Up</Button></Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;