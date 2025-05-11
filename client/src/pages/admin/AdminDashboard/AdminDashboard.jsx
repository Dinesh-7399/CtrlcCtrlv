// client/src/pages/admin/AdminDashboard.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import './AdminDashboard.css'; // Import CSS file

// Import Redux actions and selectors from adminAnalyticsSlice
import {
  fetchPlatformStats,
  selectPlatformStats,
  selectPlatformStatsLoading,
  selectPlatformStatsError,
} from '../../../features/admin/adminAnalyticsSlice.js'; // Adjust path as needed

// Import Icons
import {
  FaUsers, FaBook, FaUserCheck, FaRupeeSign, FaChartLine,
  FaTasks, FaNewspaper, FaPlusCircle, FaExclamationTriangle, FaSpinner
} from 'react-icons/fa';
import AnimatedNumber from '../../../components/common/AnimatedNumber'; // Assuming you have this

// Stat Card Sub-Component
const StatCard = ({ title, value, icon, colorClass, link = '#', isLoading, error }) => {
  const IconComponent = icon;

  if (error) {
    return (
      <Link to={link} className={`stat-card-link ${!link || link === '#' ? 'disabled-link' : ''}`}>
        <div className={`stat-card error-card ${colorClass}`}>
          <div className="stat-icon-wrapper error-icon-wrapper">
            <FaExclamationTriangle />
          </div>
          <div className="stat-info">
            <p className="stat-value small-error">Error</p>
            <p className="stat-label">{title}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={link} className={`stat-card-link ${!link || link === '#' ? 'disabled-link' : ''}`}>
      <div className={`stat-card ${colorClass}`}>
        <div className="stat-icon-wrapper">
          {isLoading ? <FaSpinner className="spinner-icon" /> : <IconComponent />}
        </div>
        <div className="stat-info">
          {isLoading ? (
            <p className="stat-value">-</p>
          ) : (
            <AnimatedNumber targetValue={parseFloat(value) || 0} className="stat-value" isCurrency={title.toLowerCase().includes('revenue')} locale="en-IN" />
          )}
          <p className="stat-label">{title}</p>
        </div>
      </div>
    </Link>
  );
};


const AdminDashboard = () => {
  const dispatch = useDispatch();
  const platformStats = useSelector(selectPlatformStats);
  const isLoadingStats = useSelector(selectPlatformStatsLoading);
  const errorStats = useSelector(selectPlatformStatsError);

  useEffect(() => {
    // Fetch stats if not already loading or successfully loaded (or if an error occurred previously)
    if (isLoadingStats === false && !errorStats && (!platformStats || Object.keys(platformStats).every(k => platformStats[k] === 0))) {
         dispatch(fetchPlatformStats());
    } else if(errorStats){ // Allow retrying if there was an error
        // Potentially add a button or auto-retry logic here
        // For now, it will re-fetch if errorStats exists and isLoading is false
        // To prevent infinite loops on persistent errors, manage retry attempts or use a manual retry button
    }
  }, [dispatch, isLoadingStats, errorStats, platformStats]);


  // Define stats cards based on data from Redux store
  // The keys here should match the keys in `platformStats` from your `adminAnalyticsSlice.js`
  const dashboardStatsCards = [
    { id: 1, title: 'Total Users', value: platformStats.totalUsers, icon: FaUsers, colorClass: 'color-blue', link: '/admin/users' },
    { id: 2, title: 'Published Courses', value: platformStats.totalPublishedCourses, icon: FaBook, colorClass: 'color-green', link: '/admin/courses' },
    { id: 3, title: 'Total Enrollments', value: platformStats.totalEnrollments, icon: FaUserCheck, colorClass: 'color-purple', link: '/admin/enrollments' }, // Link to a future enrollments page
    { id: 4, title: 'Revenue (Last 30d)', value: platformStats.recentRevenue, icon: FaRupeeSign, colorClass: 'color-orange', link: '/admin/analytics' },
    { id: 5, title: 'New Users (Last 7d)', value: platformStats.newUsersLast7Days, icon: FaUsers, colorClass: 'color-teal', link: '/admin/users?filter=recent' },
    { id: 6, title: 'Open Doubts', value: platformStats.openDoubtsCount, icon: FaTasks, colorClass: 'color-red', link: '/admin/doubts?status=OPEN' },
    { id: 7, title: 'Draft Courses', value: platformStats.draftCourses, icon: FaBook, colorClass: 'color-yellow', link: '/admin/courses?status=DRAFT' },
    { id: 8, title: 'Recent Articles (7d)', value: platformStats.recentArticlesCount, icon: FaNewspaper, colorClass: 'color-cyan', link: '/admin/articles?filter=recent' },
  ];

  const quickActions = [
    { id: 'qa1', label: 'Add New Course', link: '/admin/courses/new', icon: FaPlusCircle },
    { id: 'qa2', label: 'View Analytics', link: '/admin/analytics', icon: FaChartLine },
    { id: 'qa3', label: 'Manage Users', link: '/admin/users', icon: FaUsers },
    { id: 'qa4', label: 'Manage Articles', link: '/admin/articles', icon: FaNewspaper },
  ];

  return (
    <div className="admin-dashboard-container">
      <h1 className="dashboard-title">Admin Dashboard</h1>
      <p className="dashboard-welcome">Welcome back, Admin! Here's a quick overview of your platform.</p>

      {/* Stats Cards Section */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Platform Statistics</h2>
        {isLoadingStats && !platformStats.totalUsers && <div className="loading-section"><Spinner label="Loading statistics..." /></div>}
        {errorStats && <div className="error-section">
            <FaExclamationTriangle className="error-icon-main" />
            <p>Could not load platform statistics: {typeof errorStats === 'string' ? errorStats : JSON.stringify(errorStats)}</p>
            <Button onClick={() => dispatch(fetchPlatformStats())} variant="secondary" size="small">Retry</Button>
        </div>}
        {(!isLoadingStats || platformStats.totalUsers > 0) && !errorStats && (
            <div className="stats-grid">
                {dashboardStatsCards.map(stat => (
                <StatCard
                    key={stat.id}
                    title={stat.title}
                    value={stat.value}
                    icon={stat.icon}
                    colorClass={stat.colorClass}
                    link={stat.link}
                    isLoading={isLoadingStats && !platformStats.totalUsers} // Show individual spinner only if main stats are still loading
                    error={null} // Individual errors could be handled if API gave partial success
                />
                ))}
            </div>
        )}
      </section>

      {/* Quick Actions Section */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Quick Actions</h2>
        <div className="quick-actions-list">
          {quickActions.map(action => (
            <Link key={action.id} to={action.link} className="quick-action-button">
              <action.icon className="quick-action-icon" />
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Placeholder for other sections */}
      <div className="dashboard-grid-halves">
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Recent Activity (Placeholder)</h2>
          <div className="activity-placeholder card-style">
            <p>Recent activity feed (e.g., new users, course enrollments) will appear here.</p>
          </div>
        </section>

        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Charts Overview (Placeholder)</h2>
          <div className="charts-placeholder card-style">
            <p>Links to detailed charts (e.g., user growth, revenue trend) will appear here. Full charts are on the Analytics page.</p>
            <Link to="/admin/analytics" className="view-analytics-link">
                Go to Full Analytics <FaChartLine />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
