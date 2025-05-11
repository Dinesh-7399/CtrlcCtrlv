// client/src/pages/admin/AdminCourseList/AdminCourseList.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import {
  fetchAdminCoursesList, // Corrected: From adminCoursesSlice
  updateAdminCourse,     // Corrected: From adminCoursesSlice
  deleteAdminCourse,     // Corrected: From adminCoursesSlice
  selectAdminCoursesList, // Corrected: From adminCoursesSlice
  selectAdminCoursesListStatus, // Corrected: From adminCoursesSlice
  selectAdminCoursesListError,  // Corrected: From adminCoursesSlice
  selectAdminCoursesPagination // Corrected: From adminCoursesSlice
} from '../../../features/admin/adminCoursesSlice.js'; // Corrected path
import { FaEdit, FaTrashAlt, FaToggleOn, FaToggleOff, FaPlus, FaExclamationTriangle, FaFilter } from 'react-icons/fa';
import './AdminCourseList.css';
// Assuming ContentStatus is an enum. If not defined elsewhere, define it or import.
// For example:
const ContentStatus = {
    PUBLISHED: 'PUBLISHED',
    DRAFT: 'DRAFT',
    ARCHIVED: 'ARCHIVED'
};


const AdminCourseList = () => {
  const dispatch = useDispatch();

  const courses = useSelector(selectAdminCoursesList) || [];
  const coursesStatus = useSelector(selectAdminCoursesListStatus);
  const coursesError = useSelector(selectAdminCoursesListError);
  const paginationFromState = useSelector(selectAdminCoursesPagination) || { currentPage: 1, totalPages: 1, totalCourses: 0 };


  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    categoryId: '',
    instructorId: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      searchTerm: filters.searchTerm || undefined,
      status: filters.status || undefined,
      categoryId: filters.categoryId || undefined,
      instructorId: filters.instructorId || undefined,
    };
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    dispatch(fetchAdminCoursesList(params)); // Use correct thunk
  }, [dispatch, currentPage, filters]);

  const handlePublishToggle = (courseId, currentBackendStatus) => {
    const newStatus = currentBackendStatus === ContentStatus.PUBLISHED ? ContentStatus.DRAFT : ContentStatus.PUBLISHED;
    dispatch(updateAdminCourse({ courseId, courseData: { status: newStatus } })) // Use correct thunk & payload
        .unwrap()
        .catch(err => console.error("Failed to toggle publish status:", err));
  };

  const handleDeleteCourse = (courseId, courseTitle) => {
    if (window.confirm(`Are you sure you want to delete the course "${courseTitle || 'Untitled Course'}"? This action cannot be undone.`)) {
      dispatch(deleteAdminCourse(courseId)) // Use correct thunk
        .unwrap()
        .catch(err => console.error("Failed to delete course:", err));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (paginationFromState.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const resetFilters = () => {
    setFilters({ searchTerm: '', status: '', categoryId: '', instructorId: '' });
    setCurrentPage(1);
  };


  if (coursesStatus === 'loading' && currentPage === 1 && courses.length === 0) {
    return (
      <div className="admin-page-container admin-centered-container">
        <Spinner label="Loading courses..." />
      </div>
    );
  }

  if (coursesStatus === 'failed' && courses.length === 0) {
    return (
      <div className="admin-page-container admin-centered-container admin-error-container">
        <FaExclamationTriangle className="error-icon" />
        <h2 className="error-title">Error Loading Courses</h2>
        <p className="error-message">{coursesError || 'An unknown error occurred.'}</p>
        <Button onClick={() => dispatch(fetchAdminCoursesList({ page: currentPage, limit: ITEMS_PER_PAGE, ...filters }))} variant="secondary" className="retry-button">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-page-container admin-course-list-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Manage Courses</h1>
        <div className="header-actions">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="filter-toggle-btn">
                <FaFilter className="button-icon"/> {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            <Link to="/admin/courses/new">
                <Button variant="primary" size="medium">
                <FaPlus className="button-icon" /> Add New Course
                </Button>
            </Link>
        </div>
      </div>

      {showFilters && (
        <div className="admin-filters-bar">
          <input
            type="text"
            name="searchTerm"
            placeholder="Search by title, slug..."
            value={filters.searchTerm}
            onChange={handleFilterChange}
            className="filter-input search-input"
          />
          <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
            <option value="">All Statuses</option>
            {Object.values(ContentStatus).map(s => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <Button onClick={resetFilters} variant="secondary-outline" size="small">Clear Filters</Button>
        </div>
      )}

      {(coursesStatus === 'loading' && courses.length > 0) && <div className="list-loading-indicator">Updating list... <Spinner size="inline"/></div>}
      {(coursesStatus === 'failed' && coursesError && courses.length > 0) && <p className="list-error-inline">Error updating list: {coursesError}</p>}


      {courses.length > 0 ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-thumbnail">Thumb</th>
                <th className="col-title">Title & Slug</th>
                <th className="col-instructor">Instructor</th>
                <th className="col-category">Category</th>
                <th className="col-price">Price</th>
                <th className="col-enrollments">Enroll.</th>
                <th className="col-status">Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                course && course.id ? (
                <tr key={course.id}>
                  <td data-label="Thumb" className="cell-thumbnail">
                    <div className="thumbnail-wrapper">
                      <img
                        src={course.thumbnailUrl || `https://placehold.co/80x45/e2e8f0/94a3b8?text=${course.title ? course.title[0] : 'C'}`}
                        alt={`${course.title || 'Course'} thumbnail`}
                        className="admin-table-thumbnail"
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/80x45/e2e8f0/94a3b8?text=Err`; }}
                      />
                    </div>
                  </td>
                  <td data-label="Title" className="cell-title">
                    <Link to={`/admin/courses/edit/${course.id}`} className="table-link">
                        {course.title || '-'}
                    </Link>
                    <span className="slug-display">Slug: {course.slug || '-'}</span>
                  </td>
                  <td data-label="Instructor">{course.instructor?.name || 'N/A'}</td>
                  <td data-label="Category">{course.category?.name || 'N/A'}</td>
                  <td data-label="Price">
                    {(course.price && course.price > 0)
                      ? `₹${course.price.toLocaleString('en-IN')}`
                      : 'Free'
                    }
                  </td>
                   <td data-label="Enrollments" className="cell-enrollments">{course.enrollmentCount || 0}</td>
                  <td data-label="Status" className="cell-status">
                    <span className={`status-badge status-${course.status?.toLowerCase() || 'unknown'}`}>
                      {course.status ? (course.status.charAt(0) + course.status.slice(1).toLowerCase()) : 'Unknown'}
                    </span>
                  </td>
                  <td data-label="Actions" className="cell-actions">
                    <div className="action-buttons">
                      <Button
                        variant="icon"
                        className={`status-toggle-btn ${course.status === ContentStatus.PUBLISHED ? 'published' : 'draft'}`}
                        onClick={() => handlePublishToggle(course.id, course.status)}
                        title={course.status === ContentStatus.PUBLISHED ? 'Set to Draft' : 'Set to Published'}
                        disabled={coursesStatus === 'loading'}
                      >
                        {course.status === ContentStatus.PUBLISHED ? <FaToggleOn /> : <FaToggleOff />}
                      </Button>
                      <Link to={`/admin/courses/edit/${course.id}`} className="action-button-link">
                        <Button variant="icon" size="small" title="Edit Course" disabled={coursesStatus === 'loading'}><FaEdit /></Button>
                      </Link>
                      <Button
                        variant="icon" color="danger" size="small"
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        title="Delete Course" className="delete-btn"
                        disabled={coursesStatus === 'loading'}
                      > <FaTrashAlt /> </Button>
                    </div>
                  </td>
                </tr>
                ) : null
              ))}
            </tbody>
          </table>
          {paginationFromState.totalPages > 1 && (
            <div className="admin-pagination">
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || coursesStatus === 'loading'}>Previous</Button>
                <span>Page {currentPage} of {paginationFromState.totalPages} (Total: {paginationFromState.totalCourses})</span>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= paginationFromState.totalPages || coursesStatus === 'loading'}>Next</Button>
            </div>
          )}
        </div>
      ) : (
        coursesStatus === 'succeeded' && <p className="admin-empty-message">No courses found. <Link to="/admin/courses/new">Add your first course!</Link></p>
      )}
    </div>
  );
};

export default AdminCourseList;