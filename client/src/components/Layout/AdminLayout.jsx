// client/src/components/Layout/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import './AdminLayout.css'; // Import the final CSS
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button'; // Assuming Button component exists
import {
    FaTachometerAlt, FaBook, FaUsers, FaNewspaper, FaChartBar,
    FaCog, FaSignOutAlt, FaHome, FaMoon, FaSun,
    FaBars, FaTimes // Icons for mobile toggle
} from 'react-icons/fa';

const AdminLayout = () => {
    // --- State ---
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // Used to close menu on navigation
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // --- Effects ---
    // Apply theme class to body
    useEffect(() => {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Close mobile nav on route change
    useEffect(() => {
        closeMobileNav();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]); // Depend only on pathname

    // --- Functions ---
    const toggleMobileNav = () => setIsMobileNavOpen(prev => !prev);
    const closeMobileNav = () => setIsMobileNavOpen(false);
    const toggleTheme = () => setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');

    const handleLogout = () => {
        logout();
        closeMobileNav(); // Ensure menu closes on logout
        navigate('/login');
    };

    // Helper for NavLink active class
    const getNavLinkClass = ({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link';

    // --- Animation Variants (Clip Path + Opacity for Smoothness) ---
    const mobileMenuVariants = {
        hidden: {
            opacity: 0,
            clipPath: "inset(0 0 100% 0)", // Clip from bottom edge up
            transition: { duration: 0.3, ease: "easeInOut" }
        },
        visible: {
            opacity: 1,
            clipPath: "inset(0 0 0% 0)", // Reveal full height
            transition: { duration: 0.4, ease: "easeInOut" }
        },
        exit: {
             opacity: 0,
             clipPath: "inset(0 0 100% 0)",
             transition: { duration: 0.3, ease: "easeInOut" }
        }
    };
     const overlayVariants = {
        hidden: { opacity: 0, transition: { duration: 0.3 } },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.3 } }
     };
    // --- End Animation Variants ---

    return (
        // Class added for potential overlay targeting, not animation itself
        <div className={`admin-layout ${isMobileNavOpen ? 'mobile-nav-active' : ''}`}>
            <aside className="admin-sidebar">
                {/* Header: Logo + Mobile Toggle */}
                <div className="admin-sidebar-header">
                    <Link to="/admin" className="admin-logo" onClick={closeMobileNav}>Admin Panel</Link>
                    {/* Hamburger Button - shown/hidden via CSS */}
                    <button
                        className="admin-mobile-toggle"
                        onClick={toggleMobileNav}
                        aria-label={isMobileNavOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMobileNavOpen}
                    >
                        {isMobileNavOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>

                {/* --- Desktop Navigation (Hidden on mobile via CSS) --- */}
                <nav className="admin-sidebar-nav desktop-only">
                    <ul>
                         <li><NavLink to="/admin/dashboard" className={getNavLinkClass}><FaTachometerAlt /> Dashboard</NavLink></li>
                         <li><NavLink to="/admin/courses" className={getNavLinkClass}><FaBook /> Courses</NavLink></li>
                         <li><NavLink to="/admin/users" className={getNavLinkClass}><FaUsers /> Users</NavLink></li>
                         <li><NavLink to="/admin/articles" className={getNavLinkClass}><FaNewspaper /> Articles</NavLink></li>
                         <li><NavLink to="/admin/analytics" className={getNavLinkClass}><FaChartBar /> Analytics</NavLink></li>
                         <li><NavLink to="/admin/settings" className={getNavLinkClass}><FaCog /> Settings</NavLink></li>
                    </ul>
                </nav>
                {/* --- Desktop Footer (Hidden on mobile via CSS) --- */}
                <div className="admin-sidebar-footer desktop-only">
                    <Link to="/" className="admin-nav-link site-link"><FaHome /> Go to Site</Link>
                    <Button onClick={toggleTheme} variant="icon" size="small" className="theme-toggle-button" title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`} aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}>
                        {theme === 'light' ? <FaMoon /> : <FaSun />}
                    </Button>
                    <Button onClick={handleLogout} variant="secondary" size="small" className="admin-logout-button"><FaSignOutAlt /> Logout</Button>
                </div>

                {/* --- Animated Mobile Menu Wrapper --- */}
                <AnimatePresence>
                    {isMobileNavOpen && (
                        <motion.div
                            className="mobile-menu-content"
                            key="mobile-menu"
                            variants={mobileMenuVariants}
                            initial="hidden" animate="visible" exit="exit"
                        >
                            {/* Mobile Navigation */}
                             <nav className="admin-sidebar-nav mobile-only">
                                <ul>
                                     <li><NavLink to="/admin/dashboard" className={getNavLinkClass} onClick={closeMobileNav}><FaTachometerAlt /> Dashboard</NavLink></li>
                                     <li><NavLink to="/admin/courses" className={getNavLinkClass} onClick={closeMobileNav}><FaBook /> Courses</NavLink></li>
                                     <li><NavLink to="/admin/users" className={getNavLinkClass} onClick={closeMobileNav}><FaUsers /> Users</NavLink></li>
                                     <li><NavLink to="/admin/articles" className={getNavLinkClass} onClick={closeMobileNav}><FaNewspaper /> Articles</NavLink></li>
                                     <li><NavLink to="/admin/analytics" className={getNavLinkClass} onClick={closeMobileNav}><FaChartBar /> Analytics</NavLink></li>
                                     <li><NavLink to="/admin/settings" className={getNavLinkClass} onClick={closeMobileNav}><FaCog /> Settings</NavLink></li>
                                </ul>
                            </nav>
                            {/* Mobile Footer */}
                            <div className="admin-sidebar-footer mobile-only">
                                <Button onClick={toggleTheme} variant="icon" size="small" className="theme-toggle-button" title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`} aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}>
                                    {theme === 'light' ? <FaMoon /> : <FaSun />}
                                </Button>
                                <Button onClick={handleLogout} variant="secondary" size="small" className="admin-logout-button"><FaSignOutAlt /> Logout</Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </aside>

            {/* Animated Overlay */}
            <AnimatePresence>
                {isMobileNavOpen && (
                    <motion.div
                         key="overlay" className="mobile-nav-overlay"
                         variants={overlayVariants} initial="hidden" animate="visible" exit="exit"
                         onClick={closeMobileNav}
                    />
                 )}
            </AnimatePresence>

            {/* Main content */}
            <main className="admin-content-area">
                <div className="admin-page-content"> <Outlet /> </div>
            </main>
        </div>
    );
};

export default AdminLayout;