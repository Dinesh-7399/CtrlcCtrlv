// client/src/pages/admin/AdminUserList/AdminUserList.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import {
  fetchAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  selectAdminAllUsers,
  selectAdminUsersStatus,
  selectAdminUsersError,
  selectAdminUsersPagination,
  clearAdminUsersError,
} from '../../../features/admin/adminUsersSlice.js'; // Adjust path

import { FaUserEdit, FaUserSlash, FaUserCheck, FaTrashAlt, FaUserPlus, FaExclamationTriangle, FaFilter } from 'react-icons/fa';
import './AdminUserList.css';
import { Role, UserStatus } from '@prisma/client'; // For filter dropdowns

const AdminUserList = () => {
  const dispatch = useDispatch();

  const users = useSelector(selectAdminAllUsers) || [];
  const listStatus = useSelector(selectAdminUsersStatus);
  const listError = useSelector(selectAdminUsersError);
  const pagination = useSelector(selectAdminUsersPagination);

  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    searchTerm: '',
    role: '', // 'STUDENT', 'INSTRUCTOR', 'ADMIN', or ''
    status: '', // 'ACTIVE', 'SUSPENDED', or ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const ITEMS_PER_PAGE = 15; // Or get from pagination.limit if backend controls it

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      searchTerm: filters.searchTerm || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      // sortBy: 'createdAt_desc', // Default sort can be set here or in backend
    };
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    dispatch(fetchAdminUsers(params));

    return () => {
        dispatch(clearAdminUsersError());
    };
  }, [dispatch, currentPage, filters]);

  const handleStatusToggle = (userId, currentDbStatus) => {
    const newStatus = currentDbStatus === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    dispatch(updateAdminUser({ userId, userData: { status: newStatus } }))
        .unwrap()
        .catch(err => console.error("Failed to toggle user status:", err));
  };

  const handleDeleteUser = (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete the user "${userName || 'this user'}"? This action cannot be undone.`)) {
      dispatch(deleteAdminUser(userId))
        .unwrap()
        .catch(err => console.error("Failed to delete user:", err));
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const resetFilters = () => {
    setFilters({ searchTerm: '', role: '', status: '' });
    setCurrentPage(1);
  };


  if (listStatus === 'loading' && currentPage === 1 && users.length === 0) {
    return (
      <div className="admin-page-container admin-centered-container">
        <Spinner label="Loading users..." />
      </div>
    );
  }

  if (listStatus === 'failed' && users.length === 0) {
    return (
      <div className="admin-page-container admin-centered-container admin-error-container">
        <FaExclamationTriangle className="error-icon"/>
        <h2 className="error-title">Error Loading Users</h2>
        <p className="error-message">{typeof listError === 'string' ? listError : JSON.stringify(listError)}</p>
        <Button onClick={() => dispatch(fetchAdminUsers({ page: currentPage, limit: ITEMS_PER_PAGE, ...filters }))} variant="secondary" className="retry-button">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-page-container admin-user-list-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Manage Users</h1>
        <div className="header-actions">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="filter-toggle-btn">
                <FaFilter className="button-icon"/> {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            {/* Link to a future "Add New User" page - admin might create instructors/admins */}
            {/* <Link to="/admin/users/new">
                <Button variant="primary" size="medium">
                    <FaUserPlus className="button-icon" /> Add New User
                </Button>
            </Link> */}
        </div>
      </div>

      {showFilters && (
        <div className="admin-filters-bar">
          <input
            type="text"
            name="searchTerm"
            placeholder="Search by name, email, ID..."
            value={filters.searchTerm}
            onChange={handleFilterChange}
            className="filter-input search-input"
          />
          <select name="role" value={filters.role} onChange={handleFilterChange} className="filter-select">
            <option value="">All Roles</option>
            {Object.values(Role).map(r => (
              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
            <option value="">All Statuses</option>
             {Object.values(UserStatus).map(s => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <Button onClick={resetFilters} variant="secondary-outline" size="small">Clear Filters</Button>
        </div>
      )}

      {(listStatus === 'loading' && users.length > 0) && <div className="list-loading-indicator">Updating list... <Spinner size="inline"/></div>}
      {(listStatus === 'failed' && listError && users.length > 0) && <p className="list-error-inline">Error updating list: {typeof listError === 'string' ? listError : JSON.stringify(listError)}</p>}


      {users.length > 0 ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-id">ID</th>
                <th className="col-avatar">Avatar</th>
                <th className="col-name">Name</th>
                <th className="col-email">Email</th>
                <th className="col-role">Role</th>
                <th className="col-status">Status</th>
                <th className="col-created">Registered</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                user && user.id ? (
                <tr key={user.id}>
                  <td data-label="ID">{user.id}</td>
                  <td data-label="Avatar" className="cell-avatar">
                    <img
                        src={user.avatarUrl || `https://placehold.co/40x40/e2e8f0/94a3b8?text=${user.name ? user.name[0].toUpperCase() : 'U'}`}
                        alt={`${user.name || 'User'}'s avatar`}
                        className="admin-table-avatar"
                    />
                  </td>
                  <td data-label="Name">{user.name || '-'}</td>
                  <td data-label="Email">{user.email || '-'}</td>
                  <td data-label="Role">
                    <span className={`role-badge role-${user.role?.toLowerCase() || 'unknown'}`}>
                      {user.role ? (user.role.charAt(0) + user.role.slice(1).toLowerCase()) : 'Unknown'}
                    </span>
                  </td>
                  <td data-label="Status" className="cell-status">
                    <span className={`status-badge status-${user.status?.toLowerCase() || 'unknown'}`}>
                      {user.status ? (user.status.charAt(0) + user.status.slice(1).toLowerCase()) : 'Unknown'}
                    </span>
                  </td>
                  <td data-label="Registered">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : '-'}
                  </td>
                  <td data-label="Actions" className="cell-actions">
                    <div className="action-buttons">
                      <Button
                        variant="icon" size="small"
                        onClick={() => handleStatusToggle(user.id, user.status)}
                        title={user.status === UserStatus.ACTIVE ? 'Suspend User' : 'Activate User'}
                        className={`status-toggle-btn ${user.status === UserStatus.ACTIVE ? 'active' : 'suspended'}`}
                      >
                        {user.status === UserStatus.ACTIVE ? <FaUserSlash /> : <FaUserCheck />}
                      </Button>
                      <Link to={`/admin/users/edit/${user.id}`} className="action-button-link"> {/* TODO: Create AdminUserEdit page */}
                        <Button variant="icon" size="small" title="Edit User/Role"><FaUserEdit /></Button>
                      </Link>
                      <Button
                        variant="icon" color="danger" size="small"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        title="Delete User" className="delete-btn"
                      > <FaTrashAlt /> </Button>
                    </div>
                  </td>
                </tr>
                ) : null
              ))}
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || listStatus === 'loading'}>Previous</Button>
                <span>Page {currentPage} of {pagination.totalPages} (Total: {pagination.totalUsers})</span>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pagination.totalPages || listStatus === 'loading'}>Next</Button>
            </div>
          )}
        </div>
      ) : (
        listStatus === 'succeeded' && <p className="admin-empty-message">No users found matching your criteria.</p>
      )}
    </div>
  );
};

export default AdminUserList;
