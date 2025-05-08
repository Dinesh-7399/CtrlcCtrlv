import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
// !! Ensure path is correct !!
import { selectAllUsers } from '../../../features/users/UsersSlice.js';
import './AdminUserList.css'; // We'll create this CSS file
import { FaUserEdit, FaUserSlash, FaUserCheck, FaTrashAlt, FaUserPlus } from 'react-icons/fa'; // Icons

const AdminUserList = () => {
    // Fetch all users from the Redux store
    const users = useSelector(selectAllUsers) || []; // Default to empty array

    // --- Placeholder Action Handlers ---
    const handleStatusToggle = (userId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        console.log(`TODO: Toggle status for user ${userId} to ${newStatus}`);
        alert(`Simulating toggle status for user ${userId} to ${newStatus}`);
        // Example: dispatch(updateUserStatus({ id: userId, status: newStatus }));
    };

    const handleDeleteUser = (userId, userName) => {
        console.log(`TODO: Delete user ${userId} (${userName})`);
        if (window.confirm(`Are you sure you want to delete the user "${userName}"? This action cannot be undone.`)) {
            alert(`Simulating delete for user ${userId}`);
            // Example: dispatch(deleteUser(userId));
        }
    };
    // --- End Placeholder Action Handlers ---

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <h1 className="admin-page-title">Manage Users</h1>
                {/* Link to a future "Add New User" page */}
                <Link to="/admin/users/new">
                    <Button variant="primary" size="medium">
                        <FaUserPlus className="button-icon" /> Add New User
                    </Button>
                </Link>
            </div>

            {users.length > 0 ? (
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td data-label="ID">{user.id}</td>
                                    <td data-label="Name">{user.name || '-'}</td>
                                    <td data-label="Email">{user.email || '-'}</td>
                                    <td data-label="Role">
                                         <span className={`role-badge role-${user.role || 'student'}`}>
                                             {user.role || 'student'}
                                         </span>
                                    </td>
                                    <td data-label="Status">
                                        {/* Assumes user object has 'status': 'active' or 'suspended' */}
                                        <span className={`status-badge status-${user.status || 'active'}`}>
                                            {user.status === 'suspended' ? 'Suspended' : 'Active'}
                                        </span>
                                    </td>
                                    <td data-label="Actions">
                                        <div className="action-buttons">
                                            {/* Suspend/Unsuspend Toggle */}
                                            <Button
                                                variant="icon"
                                                size="small"
                                                onClick={() => handleStatusToggle(user.id, user.status)}
                                                title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                                                className={`status-toggle-btn ${user.status === 'active' ? 'active' : 'suspended'}`}
                                            >
                                                {user.status === 'active' ? <FaUserSlash /> : <FaUserCheck />}
                                            </Button>
                                            {/* Edit Button (e.g., to change role) - links to future edit page */}
                                            <Link to={`/admin/users/edit/${user.id}`}>
                                                 <Button variant="icon" size="small" title="Edit User/Role">
                                                    <FaUserEdit />
                                                 </Button>
                                            </Link>
                                            {/* Delete Button */}
                                            <Button
                                                variant="icon"
                                                color="danger"
                                                size="small"
                                                onClick={() => handleDeleteUser(user.id, user.name)}
                                                title="Delete User"
                                                className="delete-btn"
                                            >
                                                <FaTrashAlt />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="admin-empty-message">No users found.</p>
            )}
        </div>
    );
};

export default AdminUserList;