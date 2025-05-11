// client/src/pages/DashboardPage/DashboardPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Assuming you have this for loggedInUser
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import './DashboardPage.css';

// --- Import Icons ---
import { FaLayerGroup, FaPlayCircle, FaSearch, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { IoFlash, IoPersonCircleOutline } from 'react-icons/io5';

// --- Redux Imports ---
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchMyEnrolledCourses,
  selectUserEnrolledCourses,   // CORRECTED: Changed from selectEnrolledCourses
  selectEnrolledCoursesStatus, // CORRECTED: Use this for loading status
  selectEnrolledCoursesError
} from '../../features/courses/CoursesSlice.js'; // Ensure path is correct
// --- End Redux Imports ---

const DashboardPage = () => {
  const dispatch = useDispatch();
  // loggedInUser comes from AuthContext, authLoading for its initial load
  const { user: loggedInUser, loading: authLoading } = useAuth();

  // --- Redux State for Enrolled Courses ---
  const enrolledCoursesData = useSelector(selectUserEnrolledCourses) || []; // Default to empty array
  const enrolledCoursesStatus = useSelector(selectEnrolledCoursesStatus); // 'idle' | 'loading' | 'succeeded' | 'failed'
  const enrolledCoursesError = useSelector(selectEnrolledCoursesError);
  // --- End Redux State ---

  // --- Effect to Fetch Enrolled Courses ---
  useEffect(() => {
    // Fetch enrolled courses only if the user is logged in and data hasn't been fetched/isn't currently loading
    if (loggedInUser && enrolledCoursesStatus === 'idle') { // Fetch if idle
      dispatch(fetchMyEnrolledCourses());
    }
    // Optional: If you want to re-fetch on loggedInUser change (e.g., after logout/login)
    // and courses were previously fetched but might be stale.
    // else if (loggedInUser && enrolledCoursesStatus === 'succeeded' && enrolledCoursesData.length === 0 && !enrolledCoursesError) {
    // This condition might be too aggressive or lead to multiple fetches if not careful.
    // Usually, fetching once on 'idle' after login is sufficient, or based on specific actions.
    // }
  }, [dispatch, loggedInUser, enrolledCoursesStatus]); // Dependency array updated
  // --- End Effect ---

  const userName = loggedInUser?.name || 'Learner'; // Default to 'Learner'

  // --- Render Logic ---
  if (authLoading) { // Waiting for AuthContext to determine user state
    return (
      <div className='dashboard-container page-container dashboard-status'>
        <Spinner label="Initializing dashboard..." size="large" />
      </div>
    );
  }

  if (!loggedInUser) {
    // This case should ideally be handled by a PrivateRoute redirecting to login if DashboardPage is protected.
    // If reached, it means AuthContext confirmed no user.
    return (
      <div className='dashboard-container page-container dashboard-status'>
        <p>Please log in to view your dashboard.</p>
        <Link to="/login"><Button variant="primary">Login</Button></Link>
      </div>
    );
  }

  // At this point, loggedInUser exists. Now check enrolled courses status.
  const isLoadingDisplay = enrolledCoursesStatus === 'loading' && enrolledCoursesData.length === 0;
  const showCourses = enrolledCoursesStatus === 'succeeded' && enrolledCoursesData.length > 0;
  const showNoCoursesMessage = enrolledCoursesStatus === 'succeeded' && enrolledCoursesData.length === 0;
  const showError = enrolledCoursesStatus === 'failed' && enrolledCoursesError;


  return (
    <div className='dashboard-container page-container'>
      <h1 className='dashboard-welcome'>
        Welcome back, {userName}!
      </h1>
      <p className='dashboard-subtitle'>Let's continue learning.</p>

      <section className="dashboard-section">
        <h2 className="section-title">
          <FaLayerGroup className="section-title-icon" />
          My Courses
        </h2>
        {isLoadingDisplay && (
          <div className="dashboard-status"><Spinner label="Loading your courses..." /></div>
        )}
        {showError && (
          <div className="dashboard-status error-message">
            <FaExclamationTriangle />
            <p>Could not load your courses: {typeof enrolledCoursesError === 'string' ? enrolledCoursesError : 'An error occurred.'}</p>
            <Button onClick={() => dispatch(fetchMyEnrolledCourses())} variant="secondary-outline" size="small">Retry</Button>
          </div>
        )}
        {showCourses && (
          <div className="item-container courses-grid my-courses-grid">
            {enrolledCoursesData.map(enrollment => { // Iterate over enrollment data which contains course details
              const course = enrollment.course; // The actual course object
              if (!course) return null; // Should not happen if data is clean

              // Backend provides 'firstLessonId' directly in the 'course' object of 'enrolledCoursesData'
              const firstLessonId = course.firstLessonId;
              const linkTo = firstLessonId
                ? `/learn/${course.id}/${firstLessonId}`
                : `/courses/${course.slug || course.id}`; // Fallback to course.id if slug is missing

              return (
                <div key={course.id} className="item course-motion-wrapper">
                  <Link to={linkTo} className="course-card-link">
                    <Card className="course-card course-list-card dashboard-course-card">
                      <img
                        src={course.thumbnailUrl || "https://via.placeholder.com/300x170/cccccc/ffffff?text=Course"}
                        alt={`${course.title || 'Course'} thumbnail`}
                        className="course-card-thumbnail"
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/300x170/cccccc/ffffff?text=Image+Error"; }}
                      />
                      <div className="course-card-content">
                        <h3 className="course-list-card-title">{course.title || 'Untitled Course'}</h3>
                        {/* Progress bar can be added here if you have progress data */}
                        <span className='dashboard-card-action'>
                          {firstLessonId ? "Continue Learning" : "View Course Details"}
                          <FaPlayCircle style={{ marginLeft: '8px', verticalAlign: 'middle' }}/>
                        </span>
                      </div>
                    </Card>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
        {showNoCoursesMessage && !showError && ( // Ensure error isn't also trying to show
          <div className="no-courses-message">
            <FaInfoCircle className="no-courses-icon" />
            <p>You are not enrolled in any courses yet.</p>
            <Link to="/courses">
              <Button variant="primary">
                <FaSearch className="button-icon" />
                Browse Courses
              </Button>
            </Link>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h2 className="section-title">
          <IoFlash className="section-title-icon" />
          Quick Actions
        </h2>
        <div className="quick-actions-container">
          <Link to="/courses">
            <Button variant="outline">
              <FaSearch className="button-icon" />
              Browse All Courses
            </Button>
          </Link>
          <Link to={`/profile/${loggedInUser.id}`}> {/* Or your dedicated profile/settings route */}
            <Button variant="outline">
              <IoPersonCircleOutline className="button-icon" />
              View Profile / Settings
            </Button>
          </Link>
          {/* Add other relevant quick actions */}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;