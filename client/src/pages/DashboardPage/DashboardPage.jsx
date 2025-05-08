// client/src/pages/DashboardPage/DashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Assuming this provides logged-in user object with 'id'
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './DashboardPage.css'; // Ensure this CSS file exists

// --- Import Icons ---
import { FaLayerGroup, FaPlay, FaPlayCircle, FaSearch, FaInfoCircle } from 'react-icons/fa';
import { IoFlash, IoPersonCircleOutline } from 'react-icons/io5';

// --- Redux Imports ---
import { useSelector } from 'react-redux';
// !! Ensure these paths and selectors are correct for your project !!
import { selectAllCourses } from '../../features/courses/CoursesSlice.js';
import { selectUserById } from '../../features/users/UsersSlice.js';
// --- End Redux Imports ---

const DashboardPage = () => {
  // Get logged-in user info from AuthContext
  // EXPECTATION: loggedInUser contains at least { id: 'user-123' } for your test user
  const { user: loggedInUser } = useAuth();

  // Get the logged-in user's full details from Redux users slice using the ID from AuthContext
  // EXPECTATION: currentUserDetails will contain { id: 'user-123', ..., enrolledCourses: ["course1", "course3"] }
  const currentUserDetails = useSelector((state) =>
    loggedInUser ? selectUserById(state, loggedInUser.id) : null
  );

  // Get all available courses from the courses slice
  const allCourses = useSelector(selectAllCourses) || []; // Default to empty array

  // Filter courses based on user's enrollment data from Redux state
  const enrolledCourses = React.useMemo(() => {
    // Check if we have the necessary data loaded
    if (!currentUserDetails || !currentUserDetails.enrolledCourses || !allCourses) {
      console.log("Dashboard: Waiting for user details, enrollments, or courses...");
      return [];
    }
    // Filter using the enrolledCourses array from the user's data
    console.log(`Dashboard: Found ${currentUserDetails.enrolledCourses.length} enrolled course IDs for user ${currentUserDetails.id}`);
    return allCourses.filter(course =>
      currentUserDetails.enrolledCourses.includes(course.id) // Use course.id
    );
  }, [currentUserDetails, allCourses]);

  // Use the user's name from AuthContext or details, fallback to 'User'
  const userName = loggedInUser?.name || currentUserDetails?.name || 'User';

  console.log(`Dashboard: Displaying ${enrolledCourses.length} enrolled courses.`);

  return (
    <div className='dashboard-container page-container'> {/* Added page-container */}
      {/* Welcome message */}
      <h1 className='dashboard-welcome'>
        Welcome back, {userName}!
      </h1>
      <p className='dashboard-subtitle'>Let's continue learning.</p>

      {/* --- My Courses Section --- */}
      <section className="dashboard-section">
        <h2 className="section-title">
          <FaLayerGroup className="section-title-icon" />
          My Courses
        </h2>
        {/* Check if the filtered enrolledCourses array has courses */}
        {enrolledCourses.length > 0 ? (
          // Use the item-container grid or courses-grid
          <div className="item-container courses-grid my-courses-grid"> {/* Added my-courses-grid */}
            {/* Map through the filtered enrolled courses */}
            {enrolledCourses.map(course => {
                // Determine link based on first lesson existence
                const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id;
                const linkTo = firstLessonId
                    ? `/learn/${course.id}/${firstLessonId}`
                    : `/courses/${course.id}`; // Fallback to detail page

                return (
                  <div key={course.id} className="item course-motion-wrapper"> {/* Added item class */}
                    <Link to={linkTo} className="course-card-link">
                        <Card className="course-card course-list-card dashboard-course-card"> {/* Combine classes */}
                            <img
                                src={course.thumbnail}
                                alt={`${course.title} thumbnail`}
                                className="course-card-thumbnail"
                                loading="lazy"
                                onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/300x170/cccccc/ffffff?text=Image+Error"; }}
                            />
                            <div className="course-card-content">
                                <h3 className="course-list-card-title">{course.title}</h3>
                                {/* Action text at bottom */}
                                <span className='dashboard-card-action'>
                                    {firstLessonId ? "Continue Learning" : "View Course"}
                                </span>
                            </div>
                        </Card>
                    </Link>
                  </div>
              );
            })}
          </div>
        ) : (
          // Message shown if no courses are enrolled
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

      {/* --- Quick Actions Section --- */}
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
            <Link to="/settings">
                 <Button variant="outline">
                    <IoPersonCircleOutline className="button-icon" />
                     View Profile / Settings
                </Button>
            </Link>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;