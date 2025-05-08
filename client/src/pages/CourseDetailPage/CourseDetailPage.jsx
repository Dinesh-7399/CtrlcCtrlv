// client/src/pages/CourseDetailPage/CourseDetailPage.jsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import './CourseDetailPage.css'; // Use regular CSS
import {
  FaChalkboardTeacher, FaBookOpen, FaPlayCircle, FaArrowLeft,
  FaExclamationTriangle, FaChevronDown, FaChevronUp, FaRupeeSign,
  FaQuestionCircle, FaFileAlt, FaComments, FaInfoCircle, FaListUl,
  FaClock, FaSignal, FaCertificate, FaUserCircle // Icon for instructor link
} from 'react-icons/fa';

// --- Redux Imports ---
import { useSelector } from 'react-redux';
import { selectCourseById } from '../../features/courses/CoursesSlice.js';
import { selectInstructorById } from '../../features/users/UsersSlice.js';
// import Spinner from '../../components/common/Spinner'; // Assuming you have this component (uncomment if used)
// --- End Redux Imports ---

const CourseDetailPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [expandedModules, setExpandedModules] = useState({});
    const [activeTab, setActiveTab] = useState('overview'); // State for active tab

    // --- Get Data ---
    const course = useSelector((state) => selectCourseById(state, courseId));
    // Ensure the selector returns the instructor object WITH an ID
    const instructor = useSelector((state) =>
        selectInstructorById(state, course?.instructorId)
    );
    const { user: loggedInUser } = useAuth();
    // --- End Get Data ---

    // --- Check Enrollment Status ---
    // !! IMPORTANT: Remove the `|| true` default once your context provides real data !!
    const isUserEnrolled = loggedInUser?.enrolledCourses?.includes(courseId) || true;
    // --- End Enrollment Check ---

    const toggleModule = (moduleId) => {
        const key = moduleId || 'module-unknown';
        setExpandedModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGoBack = () => navigate('/courses');
    const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id;

    // --- Render Logic ---
    if (!course) {
        // Simplified error display - adjust as needed
        return (
           <div className="course-detail-error page-container">
               <h1>Course Not Found</h1>
               <p>Sorry, we couldn't find data for course ID "{courseId}".</p>
               <Button onClick={handleGoBack} variant="secondary">
                   <FaArrowLeft className="button-icon"/> Back to Courses
               </Button>
           </div>
       );
    }

    // Main component render
    return (
        <div className="course-detail-container page-container">
            {/* Back Button */}
             <Button onClick={handleGoBack} variant="outline" size="small" className="back-button">
                 <FaArrowLeft className="button-icon"/> Back to Courses
             </Button>

            {/* --- Course Header Section --- */}
            <div className="course-header">
                 <img
                    src={course.thumbnail || 'https://via.placeholder.com/600x340/cccccc/ffffff?text=Course+Image'}
                    alt={`${course.title} thumbnail`}
                    className="course-header-thumbnail"
                    onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/600x340/cccccc/ffffff?text=Image+Error"; }}
                 />
                 <div className="course-header-content">
                     <h1 className="course-title">{course.title}</h1>
                     {course.category && <p className="course-category">{course.category}</p>}

                     {/* --- Instructor Detail with Link --- */}
                     <div className="course-instructor-detail">
                         <FaChalkboardTeacher className="instructor-icon" />
                         <span>Instructor:</span>
                         {instructor && instructor.id ? (
                             // If full instructor data with ID is available, make it a link
                             <Link to={`/instructors/${instructor.id}`} className="instructor-profile-link">
                                 <FaUserCircle className="instructor-link-icon" />
                                 {instructor.name}
                             </Link>
                         ) : (
                            // Fallback if only ID or no data is available
                            <span className="instructor-name-fallback">
                                {course?.instructorId || 'Details unavailable'}
                            </span>
                         )}
                     </div>
                     {/* --- END Instructor Detail --- */}

                     <div className="header-action-button-container">
                         {/* Conditional Action Button (Enroll / Go to Course) */}
                          {isUserEnrolled ? (
                             firstLessonId ? (
                                 <Link to={`/learn/${course.id}/${firstLessonId}`} style={{ textDecoration: 'none' }}>
                                     <Button variant="primary" size="large" className="header-action-button"> <FaPlayCircle/> Go to Course </Button>
                                 </Link>
                             ) : (
                                 <Button variant="primary" size="large" disabled className="header-action-button"> <FaPlayCircle/> Content Unavailable </Button>
                             )
                         ) : (
                             (course.price && course.price > 0) ? (
                                 <Button variant="primary" size="large" className="header-action-button" onClick={() => navigate(`/checkout/${course.id}`)}>
                                     <FaRupeeSign/> Enroll Now {course.price && `- ${course.price.toLocaleString('en-IN')}`}
                                 </Button>
                              ) : (
                                 <Button variant="secondary" size="large" disabled className="header-action-button"> Enrollment Not Available </Button>
                              )
                         )}
                     </div>
                 </div>
            </div>

            {/* --- Tab Navigation --- */}
            <div className="course-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                    aria-selected={activeTab === 'overview'}
                    role="tab"
                >
                    <FaInfoCircle/> Overview
                </button>
                <button
                    className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
                    onClick={() => setActiveTab('content')}
                    aria-selected={activeTab === 'content'}
                    role="tab"
                >
                    <FaListUl/> Course Content
                </button>
                {/* Add more tabs here if needed */}
            </div>

            {/* --- Tab Content --- */}
            <div className="course-tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="tab-pane overview-tab">
                        <section className="course-section">
                            <h2 className="section-title">Description</h2>
                            <p className="course-description-full">{course.description || 'No description available.'}</p>
                        </section>
                        <section className="course-section course-meta-section">
                             <h2 className="section-title">Course Details</h2>
                              <div className="course-meta-grid">
                                  {course.duration && <p><FaClock /> <strong>Duration:</strong> <span>{course.duration}</span></p>}
                                  {course.level && <p><FaSignal /> <strong>Level:</strong> <span>{course.level}</span></p>}
                                  <p><FaCertificate /> <strong>Access:</strong> <span>Lifetime access</span></p>
                                  {/* Add more meta details */}
                              </div>
                        </section>
                    </div>
                )}

                {/* Course Content Tab */}
                {activeTab === 'content' && (
                    <div className="tab-pane content-tab">
                        {/* --- Doubt Resolution Button --- */}
                        {isUserEnrolled && (
                            <div className="doubt-button-container content-tab-doubt-button">
                                <Link to={`/learn/${courseId}/doubts`} style={{ textDecoration: 'none' }}>
                                    <Button variant="secondary" className="doubt-button">
                                        <FaComments className="button-icon" /> Ask a Question / Doubts
                                    </Button>
                                </Link>
                            </div>
                        )}
                         {/* --- End Doubt Button --- */}

                        <div className="modules-list accordion">
                             {course.modules && course.modules.length > 0 ? (
                                 course.modules.map((module, moduleIndex) => {
                                     const moduleIdKey = module.id || `mod-idx-${moduleIndex}`;
                                     const isExpanded = !!expandedModules[moduleIdKey];
                                     const firstLessonIdInModule = module.lessons?.[0]?.id;

                                     return (
                                       <div key={moduleIdKey} className={`module-item ${isExpanded ? 'expanded' : 'collapsed'}`}>
                                           <button
                                               className="module-title-button"
                                               onClick={() => toggleModule(moduleIdKey)}
                                               aria-expanded={isExpanded}
                                               aria-controls={`module-content-${moduleIdKey}`}
                                           >
                                               <div className="module-title-wrapper">
                                                   <h3 className="module-title"> Module {moduleIndex + 1}: {module.title || 'Untitled Module'} </h3>
                                               </div>
                                                {/* Activity Icons */}
                                               {isUserEnrolled && (
                                                   <div className="module-activity-icons">
                                                       {module.moduleDppId && firstLessonIdInModule && (
                                                           <Link to={`/learn/${courseId}/${firstLessonIdInModule}/dpp`} className="module-activity-link dpp-link" title={`Practice for Module ${moduleIndex + 1}`} onClick={(e) => e.stopPropagation()} aria-label={`Practice Problems for ${module.title || `Module ${moduleIndex + 1}`}`} > <FaFileAlt /> </Link>
                                                       )}
                                                       {module.moduleQuizId && firstLessonIdInModule && (
                                                           <Link to={`/learn/${courseId}/${firstLessonIdInModule}/quiz`} className="module-activity-link quiz-link" title={`Quiz for Module ${moduleIndex + 1}`} onClick={(e) => e.stopPropagation()} aria-label={`Quiz for ${module.title || `Module ${moduleIndex + 1}`}`} > <FaQuestionCircle /> </Link>
                                                       )}
                                                   </div>
                                               )}
                                               <span className="module-toggle-icon" aria-hidden="true"> {isExpanded ? <FaChevronUp /> : <FaChevronDown />} </span>
                                           </button>
                                            {/* Expanded Content */}
                                           {isExpanded && (
                                               <div id={`module-content-${moduleIdKey}`} className="module-lessons-content" role="region">
                                                   {module.lessons && module.lessons.length > 0 ? (
                                                       <ul className="lessons-list">
                                                           {module.lessons.map(lesson => (
                                                               <li key={lesson.id} className="lesson-item">
                                                                   {isUserEnrolled ? (
                                                                       <Link to={`/learn/${course.id}/${lesson.id}`} className="lesson-link">
                                                                           <FaPlayCircle className="lesson-icon" />
                                                                           <span className="lesson-title-text">{lesson.title || 'Untitled Lesson'}</span>
                                                                           {lesson.duration && <span className="lesson-duration">({lesson.duration})</span>}
                                                                       </Link>
                                                                   ) : (
                                                                       <span className="lesson-link disabled">
                                                                           <FaPlayCircle className="lesson-icon" />
                                                                           <span className="lesson-title-text">{lesson.title || 'Untitled Lesson'}</span>
                                                                           {lesson.duration && <span className="lesson-duration">({lesson.duration})</span>}
                                                                       </span>
                                                                   )}
                                                               </li>
                                                           ))}
                                                       </ul>
                                                   ) : ( <p className='no-lessons-in-module'>No lessons listed for this module.</p> )}
                                               </div>
                                           )}
                                       </div>
                                   );
                               })
                           ) : ( <p>Course content details are not available yet.</p> )}
                        </div>
                    </div>
                )}
            </div> {/* End Tab Content */}
        </div> // End Container
    );
};

export default CourseDetailPage;