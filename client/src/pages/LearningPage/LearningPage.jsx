// client/src/pages/LearningPage/LearningPage.jsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player/lazy'; // For video display
import Button from '../../components/common/Button'; // Your Button component
import NotesSection from '../../components/common/NotesSection'; // Import the new component
import './LearningPage.css'; // Styles for this page

// --- Redux Imports ---
import { useSelector } from 'react-redux';
// !! Ensure these paths and selectors are correct !!
import {
    selectCourseById,
    selectLessonById,
    selectAllLessonsFlat
} from '../../features/courses/CoursesSlice.js';
// --- End Redux Imports ---

// --- Icon Imports ---
import { FaArrowLeft, FaArrowRight, FaCircle, FaBookOpen, FaExclamationTriangle, FaDownload } from 'react-icons/fa'; // Added Download
// --- End Icon Imports ---


const LearningPage = () => {
    const { courseId, lessonId } = useParams();
    console.log('LEARNING PAGE PARAMS:', { courseId, lessonId }); // Good for debugging
    const navigate = useNavigate();

    // --- Get Data from Redux Store ---
    const course = useSelector((state) => selectCourseById(state, courseId));
    const currentLesson = useSelector((state) => selectLessonById(state, courseId, lessonId));
    const allLessonsFlat = useSelector((state) => selectAllLessonsFlat(state, courseId));
    // --- End Get Data from Redux Store ---

    // --- Calculate Prev/Next Lesson ---
    const currentIndex = React.useMemo(() => {
        if (!allLessonsFlat || allLessonsFlat.length === 0) return -1;
        return allLessonsFlat.findIndex(lesson => lesson.id === lessonId);
    }, [allLessonsFlat, lessonId]);

    const prevLesson = currentIndex > 0 ? allLessonsFlat[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessonsFlat.length - 1 ? allLessonsFlat[currentIndex + 1] : null;
    // --- End Prev/Next Calculation ---

    // --- Navigation Handlers ---
    const handleNavigate = (targetLessonId) => {
        if (targetLessonId && courseId) {
            navigate(`/learn/${courseId}/${targetLessonId}`);
            window.scrollTo(0, 0); // Scroll to top on lesson change
        }
    };

    const handleGoBackToCourse = () => {
        if (courseId) {
            navigate(`/courses/${courseId}`);
        } else {
            navigate('/courses'); // Fallback
        }
    };
    // --- End Navigation Handlers ---

    // --- Render Logic ---
    // Handle Course Not Found
    if (!course) {
         return (
             <div className="learning-status learning-error page-container">
                 <FaExclamationTriangle size={40} style={{ marginBottom: 'var(--spacing-md)' }} />
                 <h1>Course Not Found</h1>
                 <p>Could not find course data for ID "{courseId}".</p>
                 <Button onClick={() => navigate('/courses')} variant="secondary">
                     <FaArrowLeft className="button-icon"/> Back to Courses
                 </Button>
             </div>
         );
    }

    // Handle Lesson Not Found (within the course)
    if (!currentLesson) {
        return (
            <div className="learning-status learning-error page-container">
                <FaExclamationTriangle size={40} style={{ marginBottom: 'var(--spacing-md)' }} />
                <h1>Lesson Not Found</h1>
                <p>Could not find lesson data for ID "{lessonId}" in course "{course.title}".</p>
                <Button onClick={handleGoBackToCourse} variant="secondary">
                    <FaArrowLeft className="button-icon"/> Back to Course Details
                </Button>
            </div>
        );
    }

    const videoUrlFromData = currentLesson.videoUrl;

    // --- Render Learning Page Layout ---
    return (
        <div className="learning-page-container">
            {/* Sidebar for Lesson Navigation */}
            <aside className="learning-sidebar">
                <Link to={`/courses/${courseId}`} className="sidebar-course-title-link">
                    <h3 className="sidebar-course-title">
                        <FaBookOpen className="sidebar-title-icon" />
                        {course.title}
                    </h3>
                </Link>
                <nav className="sidebar-nav">
                     {course.modules && course.modules.length > 0 ? (
                         course.modules.map((module, moduleIndex) => (
                             <div key={module.id || `mod-${moduleIndex}`} className="sidebar-module">
                                 <h4 className="sidebar-module-title">Module {moduleIndex + 1}: {module.title}</h4>
                                 {module.lessons && module.lessons.length > 0 ? (
                                     <ul className="sidebar-lesson-list">
                                         {module.lessons.map(lesson => (
                                             <li key={lesson.id}>
                                                 <Link
                                                     to={`/learn/${courseId}/${lesson.id}`}
                                                     className={`sidebar-lesson-link ${lesson.id === lessonId ? 'active' : ''}`}
                                                 >
                                                     <FaCircle size="0.6em" className="lesson-status-icon" />
                                                     {lesson.title}
                                                 </Link>
                                             </li>
                                         ))}
                                     </ul>
                                 ) : (
                                     <p className='sidebar-no-lessons'>No lessons in module.</p>
                                 )}
                             </div>
                         ))
                     ) : (
                         <p className="sidebar-no-lessons">No modules found for this course.</p>
                     )}
                 </nav>
            </aside>

            {/* Main Content Area */}
            <main className="learning-main-content">
                 {/* Back button specific to main content area */}
                 <Button onClick={handleGoBackToCourse} variant="outline" size="small" className="back-button main-back-button">
                     <FaArrowLeft className="button-icon"/> Course Details
                 </Button>

                <h1 className="lesson-title">{currentLesson.title}</h1>

                {/* Video Player */}
                {videoUrlFromData && videoUrlFromData !== '...' ? ( // Check for valid URL
                    <div className="video-player-wrapper">
                        <ReactPlayer
                            className="react-player"
                            url={videoUrlFromData}
                            width="100%" height="100%" // Responsive player
                            controls={true} // Show player controls
                            pip={true} // Allow picture-in-picture
                            stopOnUnmount={true} // Stop playing when component unmounts
                            config={{
                                // Add any specific player configs here if needed
                                // file: { attributes: { controlsList: 'nodownload' } } // Example: disable download
                            }}
                        />
                    </div>
                ) : (
                    <div className="video-unavailable">Video content is not available for this lesson.</div>
                )}

                {/* Lesson Description */}
                <section className="lesson-content course-section">
                    <h2>About this Lesson</h2>
                    <p>{currentLesson.description || 'No description provided.'}</p>
                </section>

                {/* --- Notes Section --- */}
                {/* The NotesSection component handles fetching/displaying notes */}
                <section className="lesson-notes-section course-section">
                    <h2 className="section-title">
                        <FaDownload className="section-title-icon" /> Lesson Notes & Downloads
                    </h2>
                    <NotesSection courseId={courseId} lessonId={lessonId} />
               </section>
                {/* --- End Notes Section --- */}

                {/* Lesson Navigation Buttons */}
                <div className="lesson-navigation">
                     <Button onClick={() => handleNavigate(prevLesson?.id)} disabled={!prevLesson} variant="outline">
                         <FaArrowLeft className="button-icon" /> Previous Lesson
                     </Button>
                     <Button onClick={() => handleNavigate(nextLesson?.id)} disabled={!nextLesson} variant="primary">
                         Next Lesson <FaArrowRight className="button-icon button-icon-right" />
                     </Button>
                </div>
            </main>
        </div>
    );
};

export default LearningPage;