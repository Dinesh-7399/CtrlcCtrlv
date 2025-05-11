// src/pages/admin/AdminAnalytics/AdminAnalytics.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPlatformStats,
  fetchUserTrends,
  fetchEnrollmentOverview,
  selectPlatformStats,
  selectPlatformStatsLoading,
  selectPlatformStatsError,
  selectUserTrends,
  selectUserTrendsLoading,
  selectUserTrendsError, // Use this for specific error messages
  selectEnrollmentOverview,
  selectEnrollmentOverviewLoading,
  selectEnrollmentOverviewError, // Use this for specific error messages
} from '../../../features/admin/adminAnalyticsSlice.js'; // Adjust path
import './AdminAnalytics.css'; // We'll create this CSS file
import { FaUsers, FaGraduationCap, FaShoppingCart, FaRupeeSign, FaChartLine, FaChartBar, FaChartPie, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import AnimatedNumber from '../../../components/common/AnimatedNumber'; // Assuming you have this

const StatWidget = ({ icon, value, label, currency = false, isLoading, error }) => {
  const IconComponent = icon;
  if (error) {
    return (
      <div className="stat-widget error-widget">
        <FaExclamationCircle className="widget-icon-svg error-icon" />
        <div className="widget-text-content">
          <strong className="error-label">Error!</strong>
          <span className="error-message"> {label}: {error.toString()}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="stat-widget">
      <div className="widget-icon-container">
        <IconComponent className="widget-icon-svg" />
      </div>
      <div className="widget-text-content">
        {isLoading ? (
          <FaSpinner className="widget-spinner" />
        ) : (
          <AnimatedNumber
            targetValue={value}
            className="widget-value"
            isCurrency={currency}
            locale="en-IN"
          />
        )}
        <p className="widget-label">{label}</p>
      </div>
    </div>
  );
};


const AdminAnalytics = () => {
  const dispatch = useDispatch();
  const platformStats = useSelector(selectPlatformStats);
  const isLoadingStats = useSelector(selectPlatformStatsLoading);
  const errorStats = useSelector(selectPlatformStatsError);

  const userTrendsData = useSelector(selectUserTrends);
  const isLoadingUserTrends = useSelector(selectUserTrendsLoading);
  const errorUserTrends = useSelector(selectUserTrendsError);


  const enrollmentOverviewData = useSelector(selectEnrollmentOverview);
  const isLoadingEnrollmentOverview = useSelector(selectEnrollmentOverviewLoading);
  const errorEnrollmentOverview = useSelector(selectEnrollmentOverviewError);


  useEffect(() => {
    dispatch(fetchPlatformStats());
    dispatch(fetchUserTrends());
    dispatch(fetchEnrollmentOverview());
  }, [dispatch]);

  // Colors for Pie Chart (can be moved to CSS variables if preferred)
  const PIE_CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];


  return (
    <div className="admin-analytics-page">
      <h1 className="admin-analytics-title">Platform Analytics</h1>

      {/* --- Key Metric Widgets --- */}
      <div className="analytics-widgets-grid">
        <StatWidget
          icon={FaUsers}
          value={platformStats.totalUsers}
          label="Total Users"
          isLoading={isLoadingStats}
          error={errorStats && "Failed to load total users."}
        />
        <StatWidget
          icon={FaGraduationCap}
          value={platformStats.totalPublishedCourses}
          label="Published Courses"
          isLoading={isLoadingStats}
          error={errorStats && "Failed to load published courses."}
        />
        <StatWidget
          icon={FaShoppingCart}
          value={platformStats.totalEnrollments}
          label="Total Enrollments"
          isLoading={isLoadingStats}
          error={errorStats && "Failed to load total enrollments."}
        />
        <StatWidget
          icon={FaRupeeSign}
          value={platformStats.recentRevenue}
          label="Revenue (Last 30 Days)"
          currency={true}
          isLoading={isLoadingStats}
          error={errorStats && "Failed to load recent revenue."}
        />
         <StatWidget
            icon={FaUsers} // Consider a different icon for "new" users
            value={platformStats.newUsersLast7Days}
            label="New Users (Last 7 Days)"
            isLoading={isLoadingStats}
            error={errorStats && "Failed to load new users count."}
          />
          <StatWidget
            icon={FaGraduationCap} // Consider a different icon for "draft"
            value={platformStats.draftCourses}
            label="Draft Courses"
            isLoading={isLoadingStats}
            error={errorStats && "Failed to load draft courses count."}
          />
          <StatWidget
            icon={FaExclamationCircle}
            value={platformStats.openDoubtsCount}
            label="Open Doubts"
            isLoading={isLoadingStats}
            error={errorStats && "Failed to load open doubts count."}
          />
          <StatWidget
            icon={FaChartLine} // Consider FaNewspaper or similar
            value={platformStats.recentArticlesCount}
            label="New Articles (Last 7 Days)"
            isLoading={isLoadingStats}
            error={errorStats && "Failed to load new articles count."}
          />
      </div>

      {/* --- Chart Sections --- */}
      <div className="analytics-charts-grid">
        <section className="chart-section-card">
          <h2 className="chart-title"><FaChartLine className="chart-icon icon-user-trend" /> User Registrations Trend</h2>
          {isLoadingUserTrends ? (
            <div className="chart-loading-container"><FaSpinner className="chart-spinner"/></div>
          ) : errorUserTrends ? (
            <div className="chart-error-message">Error loading user trends: {errorUserTrends.toString()}</div>
          ) : userTrendsData && userTrendsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userTrendsData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="registrations" stroke="var(--color-primary)" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="chart-placeholder-message">No user trend data available.</p>}
        </section>

        <section className="chart-section-card">
          <h2 className="chart-title"><FaChartBar className="chart-icon icon-enrollment-overview" /> Enrollment Overview (by Category)</h2>
          {isLoadingEnrollmentOverview ? (
             <div className="chart-loading-container"><FaSpinner className="chart-spinner"/></div>
          ) : errorEnrollmentOverview ? (
            <div className="chart-error-message">Error loading enrollment overview: {errorEnrollmentOverview.toString()}</div>
          ) : enrollmentOverviewData && enrollmentOverviewData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentOverviewData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoryName" angle={-25} textAnchor="end" height={70} interval={0} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalEnrollments" fill="var(--color-secondary-creamy)" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="chart-placeholder-message">No enrollment overview data available.</p>}
        </section>

        <section className="chart-section-card chart-section-span-2">
          <h2 className="chart-title"><FaChartPie className="chart-icon icon-revenue-breakdown" /> Revenue Breakdown (Example)</h2>
          <div className="chart-placeholder-message">
            (Pie chart showing revenue sources will go here. Needs backend data and chart implementation.)
            {/* Example Pie Chart Structure:
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={revenueBreakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {revenueBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            */}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminAnalytics;
