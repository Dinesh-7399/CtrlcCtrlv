// src/pages/admin/AdminCourseList.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect
import { useSelector, useDispatch } from 'react-redux'; // Added useDispatch
import { Link } from 'react-router-dom';

// Common Components
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner'; // For loading state
// import Card from '../../../components/common/Card'; // Card not typically needed for table row

// Redux Actions & Selectors
import {
    selectAllCourses,
    selectCoursesStatus, // Import status selector
    selectCoursesError,  // Import error selector (optional but good)
    fetchCourses,        // Import fetch action
    updateCourse,        // Import update action
    deleteCourse         // Import delete action
} from '../../../features/courses/CoursesSlice.js';

// Icons
import { FaEdit, FaTrashAlt, FaToggleOn, FaToggleOff, FaPlus, FaExclamationTriangle } from 'react-icons/fa';

// Component Specific CSS
import './AdminCourseList.css';

const AdminCourseList = () => {
  const dispatch = useDispatch();

  // Get data and status from Redux
  const courses = useSelector(selectAllCourses) || []; // Ensure it's an array
  const coursesStatus = useSelector(selectCoursesStatus);
  const coursesError = useSelector(selectCoursesError); // Get error state

  // --- Effect to Fetch Data on Mount if Idle ---
  useEffect(() => {
    if (coursesStatus === 'idle') {
        console.log("AdminCourseList: Dispatching fetchCourses...");
        dispatch(fetchCourses());
    }
  }, [coursesStatus, dispatch]); // Dependencies

  // --- Action Handlers ---
  const handlePublishToggle = (courseId, currentStatus) => {
    // Determine the new status
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    console.log(`Dispatching updateCourse: id=${courseId}, changes={ status: ${newStatus} }`);
    // Dispatch the update action
    dispatch(updateCourse({ id: courseId, changes: { status: newStatus } }));
  };

  const handleDeleteCourse = (courseId, courseTitle) => {
    // Confirmation dialog
    if (window.confirm(`Are you sure you want to delete the course "${courseTitle || 'Untitled Course'}"? This action cannot be undone.`)) {
      console.log(`Dispatching deleteCourse: id=${courseId}`);
      // Dispatch the delete action
      dispatch(deleteCourse(courseId));
    }
  };
  // --- End Action Handlers ---


  // --- Render Logic ---

  // 1. Loading State
  if (coursesStatus === 'loading') {
      return (
          <div className="admin-page-container admin-loading-container">
              <Spinner label="Loading courses..." />
          </div>
      );
  }

  // 2. Error State
  if (coursesStatus === 'failed') {
      return (
          <div className="admin-page-container admin-error-container">
               <FaExclamationTriangle size={30} style={{ marginBottom: '1rem', color: 'var(--color-error)' }}/>
              <h2>Error Loading Courses</h2>
              <p>{coursesError || 'An unknown error occurred.'}</p>
              {/* Optional: Add a retry button */}
              <Button onClick={() => dispatch(fetchCourses())} variant="secondary" style={{marginTop: '1rem'}}>
                  Retry
              </Button>
          </div>
      );
  }

  // 3. Success State (or Idle after initial attempt - show empty/table)
  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Manage Courses</h1>
        {/* Link to create a new course page */}
        <Link to="/admin/courses/new">
          <Button variant="primary" size="medium">
            <FaPlus className="button-icon" aria-hidden="true" /> Add New Course
          </Button>
        </Link>
      </div>

      {/* Content: Table or Empty Message */}
      {courses.length > 0 ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Title</th>
                <th>Category</th>
                <th>Price (INR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                // Basic check for course ID before rendering row
                course && course.id ? (
                  <tr key={course.id}>
                    {/* Thumbnail Cell */}
                    <td>
                      <img
                        src={course.thumbnail || 'https://via.placeholder.com/80x45/cccccc/ffffff?text=No+Img'}
                        alt={`${course.title || 'Course'} thumbnail`}
                        className="admin-table-thumbnail"
                        // Hide image container on error instead of image itself for better layout stability
                        onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                      />
                    </td>
                    {/* Other Data Cells */}
                    <td data-label="Title">{course.title || '-'}</td>
                    <td data-label="Category">{course.category || '-'}</td>
                    <td data-label="Price">
                      {(course.price && course.price > 0)
                        ? `₹${course.price.toLocaleString('en-IN')}` // Format price
                        : 'Free'
                      }
                    </td>
                    {/* Status Cell */}
                    <td data-label="Status">
                      {/* Display status badge */}
                      <span className={`status-badge status-${course.status || 'draft'}`}>
                        {(course.status === 'published') ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    {/* Actions Cell */}
                    <td data-label="Actions">
                      <div className="action-buttons">
                        {/* Publish/Unpublish Toggle */}
                        <Button
                          variant="icon"
                          className={`status-toggle-btn ${course.status === 'published' ? 'published' : 'draft'}`}
                          onClick={() => handlePublishToggle(course.id, course.status)}
                          title={course.status === 'published' ? 'Click to Unpublish' : 'Click to Publish'}
                          aria-label={course.status === 'published' ? `Unpublish ${course.title}` : `Publish ${course.title}`}
                        >
                          {course.status === 'published' ? <FaToggleOn /> : <FaToggleOff />}
                        </Button>

                        {/* Edit Link/Button */}
                        <Link to={`/admin/courses/edit/${course.id}`} className="action-button-link">
                            <Button variant="icon" size="small" title="Edit Course" aria-label={`Edit ${course.title}`}>
                              <FaEdit />
                            </Button>
                          </Link>

                        {/* Delete Button */}
                        <Button
                          variant="icon"
                          color="danger" // Assuming Button component can handle this for styling
                          size="small"
                          onClick={() => handleDeleteCourse(course.id, course.title)}
                          title="Delete Course"
                          aria-label={`Delete ${course.title}`}
                          className="delete-btn" // Keep class if needed
                        >
                          <FaTrashAlt />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : null // Don't render row if course or course.id is missing
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Message shown only when fetch succeeded but no courses exist
        coursesStatus === 'succeeded' && <p className="admin-empty-message">No courses found. Add your first course!</p>
      )}
    </div>
  );
};

export default AdminCourseList;