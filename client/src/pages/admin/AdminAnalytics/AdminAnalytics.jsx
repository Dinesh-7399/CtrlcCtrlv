import React from 'react';
import './AdminAnalytics.css'; // We'll create this CSS file
import { FaUsers, FaGraduationCap, FaShoppingCart, FaRupeeSign, FaChartLine, FaChartBar, FaChartPie } from 'react-icons/fa'; // Icons

// --- Placeholder Data (Replace with actual data fetching later) ---
const placeholderStats = {
    totalUsers: 1250,
    activeCourses: 45,
    monthlyEnrollments: 312,
    monthlyRevenue: 45800,
};

const AdminAnalytics = () => {
    // In a real app, you'd fetch aggregated data here using useEffect and API calls
    const stats = placeholderStats;

    return (
        <div className="admin-page-container">
            <h1 className="admin-page-title">Platform Analytics</h1>

            {/* --- Key Metric Widgets --- */}
            <div className="analytics-widgets">
                 {/* Reusing widget styles from AdminDashboard CSS perhaps? */}
                <div className="widget users-widget">
                    <FaUsers className="widget-icon" />
                    <div className="widget-content">
                        <span className="widget-value">{stats.totalUsers.toLocaleString('en-IN')}</span>
                        <span className="widget-label">Total Users</span>
                    </div>
                </div>

                <div className="widget courses-widget">
                    <FaGraduationCap className="widget-icon" />
                    <div className="widget-content">
                        <span className="widget-value">{stats.activeCourses}</span>
                        <span className="widget-label">Active Courses</span>
                    </div>
                </div>

                <div className="widget enrollments-widget">
                    <FaShoppingCart className="widget-icon" />
                    <div className="widget-content">
                        <span className="widget-value">{stats.monthlyEnrollments}</span>
                        <span className="widget-label">Enrollments (Month)</span>
                    </div>
                </div>

                 <div className="widget revenue-widget">
                    <FaRupeeSign className="widget-icon" />
                    <div className="widget-content">
                        <span className="widget-value">{stats.monthlyRevenue.toLocaleString('en-IN')}</span>
                        <span className="widget-label">Revenue (Month)</span>
                    </div>
                </div>
            </div>

             {/* --- Chart Placeholders --- */}
             <div className="analytics-charts">
                <section className="chart-section">
                    <h2 className="section-title"><FaChartLine /> User Registrations Trend</h2>
                    <div className="chart-placeholder">
                        (Line chart showing user signups over the last 6 months will go here)
                        {/* Example: <UserRegistrationChart data={chartData.userTrend} /> */}
                    </div>
                </section>

                 <section className="chart-section">
                    <h2 className="section-title"><FaChartBar /> Course Enrollment Overview</h2>
                    <div className="chart-placeholder">
                        (Bar chart showing enrollments per category or top 5 courses will go here)
                         {/* Example: <EnrollmentChart data={chartData.enrollmentOverview} /> */}
                    </div>
                </section>

                 <section className="chart-section">
                    <h2 className="section-title"><FaChartPie /> Revenue Breakdown</h2>
                    <div className="chart-placeholder">
                         (Pie chart showing revenue sources - e.g., course sales vs subscriptions - will go here)
                          {/* Example: <RevenueSourceChart data={chartData.revenueSources} /> */}
                    </div>
                </section>
                 {/* Add more chart sections as needed */}
             </div>

        </div>
    );
};

export default AdminAnalytics;