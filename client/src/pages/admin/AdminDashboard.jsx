// client/src/pages/admin/AdminDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // For linking cards if needed
import './AdminDashboard.css'; // Import CSS file
// Import Icons for stats cards
import { FaUsers, FaBook, FaUserCheck, FaRupeeSign, FaChartLine, FaTasks, FaNewspaper } from 'react-icons/fa';

// Dummy data for stats cards
const dashboardStats = [
  { id: 1, title: 'Total Users', value: '1,234', icon: <FaUsers />, color: 'blue', link: '/admin/users' },
  { id: 2, title: 'Total Courses', value: '56', icon: <FaBook />, color: 'green', link: '/admin/courses' },
  { id: 3, title: 'Active Learners', value: '890', icon: <FaUserCheck />, color: 'purple', link: '/admin/users?status=active' }, // Example link with query
  { id: 4, title: 'Monthly Revenue', value: '₹45,678', icon: <FaRupeeSign />, color: 'orange', link: '/admin/analytics' }, // Example link
];

// Dummy data for quick actions
const quickActions = [
    { id: 'qa1', label: 'Add New Course', link: '/admin/courses/new', icon: <FaPlusCircle/> }, // Assuming FaPlusCircle exists or use FaPlus
    { id: 'qa2', label: 'View Reports', link: '/admin/analytics', icon: <FaChartLine/> },
    { id: 'qa3', label: 'Manage Enrollments', link: '/admin/enrollments', icon: <FaTasks/> }, // Example link,
    {id : 'qa4' , label : 'Manage Articles' , link : '/admin/articles' , icon : <FaNewspaper/>}, // Example link
]

const AdminDashboard = () => {
    return (
        <div className="admin-dashboard-container">
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-welcome">Welcome back! Here's a quick overview of your platform.</p>

            {/* Stats Cards Section */}
            <section className="dashboard-section">
                <h2 className="dashboard-section-title">Platform Statistics</h2>
                <div className="stats-grid">
                    {dashboardStats.map(stat => (
                        // Making the whole card a link (optional)
                        <Link to={stat.link || '#'} key={stat.id} className={`stat-card-link ${!stat.link ? 'disabled-link' : ''}`}>
                            <div className={`stat-card color-${stat.color}`}>
                                <div className="stat-icon-wrapper">
                                    {stat.icon}
                                </div>
                                <div className="stat-info">
                                    <p className="stat-value">{stat.value}</p>
                                    <p className="stat-label">{stat.title}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Placeholder for other sections like Recent Activity, Quick Actions, Charts */}
            <section className="dashboard-section">
                <h2 className="dashboard-section-title">Quick Actions</h2>
                {/* Simple list or button group for actions */}
                 <div className="quick-actions-list">
                    {/* You would use Button component here if preferred */}
                    <Link to="/admin/courses/new" className="quick-action-button">
                         <FaBook /> Add Course
                    </Link>
                     <Link to="/admin/users" className="quick-action-button">
                         <FaUsers /> Manage Users
                    </Link>
                     <Link to="/admin/analytics" className="quick-action-button">
                         <FaChartLine /> View Analytics
                    </Link>
                    <Link to="/admin/articles" className="quick-action-button">
                         <FaNewspaper /> Manage Articles
                    </Link>
                 </div>
            </section>

            <section className="dashboard-section">
                <h2 className="dashboard-section-title">Recent Activity</h2>
                 <div className="activity-placeholder card-style">
                    <p>Recent activity feed (e.g., new users, course enrollments) will appear here.</p>
                </div>
            </section>

             <section className="dashboard-section">
                <h2 className="dashboard-section-title">Charts Overview</h2>
                 <div className="charts-placeholder card-style">
                    <p>Charts (e.g., user growth, revenue trend) will appear here.</p>
                     {/* Add chart components later */}
                </div>
            </section>

        </div>
    );
};

// Helper function for quick action icons (ensure icons are imported)
import { FaPlusCircle } from 'react-icons/fa'; // Example for quick actions

export default AdminDashboard;