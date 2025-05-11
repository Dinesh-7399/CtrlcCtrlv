// client/src/pages/LearningPage/LearningPage.jsx
import React, { useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Import Framer Motion
import ReactPlayer from 'react-player/lazy';

import Button from '../../components/common/Button';
import NotesSection from '../../components/common/NotesSection'; // Assuming this component exists
import Spinner from '../../components/common/Spinner';
import './LearningPage.css'; // Import CSS for base styling

import { useSelector, useDispatch } from 'react-redux';
import {
    selectCourseById,
    selectLessonById,     // Selector should take (state, lessonId) and use currentCourse internally
    selectAllLessonsFlat, // Selector should use currentCourse internally
    fetchCourseDetails,
    selectCourseDetailsStatus,
    selectCourseDetailsError,
    // clearCurrentCourse, // Consider if needed on unmount
} from '../../features/courses/CoursesSlice.js';

import { FaArrowLeft, FaArrowRight, FaCircle, FaBookOpen, FaExclamationTriangle, FaDownload, FaVideoSlash } from 'react-icons/fa';

// --- Framer Motion Variants ---
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: "easeInOut" } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const sidebarVariants = {
  hidden: { x: '-100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut", delay: 0.1 } }
};

const mainContentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.3 } }
};

const lessonLinkVariants = {
  hover: { x: 5, color: "var(--color-primary)", transition: { duration: 0.15 } },
  tap: { scale: 0.98 }
};

const contentSectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", staggerChildren: 0.1, delayChildren:0.1 } }
};

const itemVariants = { // For items within a staggered section
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};


const LearningPage = () => {
    const { courseId, lessonId: lessonIdParam } = useParams(); // lessonIdParam to avoid conflict
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Ensure lessonId is treated as a number for comparisons if your IDs are numbers
    const currentLessonId = useMemo(() => parseInt(lessonIdParam, 10), [lessonIdParam]);

    // These selectors should ideally derive from state.courses.currentCourse once it's loaded
    const course = useSelector((state) => selectCourseById(state, courseId));
    // Assuming selectAllLessonsFlat correctly uses currentCourse which is set by fetchCourseDetails(courseId)
    const allLessonsFlat = useSelector(selectAllLessonsFlat);
    // Assuming selectLessonById correctly uses allLessonsFlat (derived from currentCourse) and currentLessonId
    const currentLesson = useSelector((state) => selectLessonById(state, currentLessonId));


    const courseDetailsStatus = useSelector(selectCourseDetailsStatus);
    const courseError = useSelector(selectCourseDetailsError);
    const isLoadingCourse = courseDetailsStatus === 'loading' || (courseDetailsStatus === 'idle' && !course);


    useEffect(() => {
        if (courseId) {
            // Fetch if no course, or if the course ID doesn't match the current one,
            // or if it previously failed to load and we don't have it yet.
            if (!course || String(course.id) !== String(courseId) || (courseDetailsStatus === 'failed' && !course)) {
                dispatch(fetchCourseDetails(courseId));
            }
        }
        // Optional: Cleanup, but be careful if navigating between lessons of the same course
        // return () => { dispatch(clearCurrentCourse()); };
    }, [dispatch, courseId, course, courseDetailsStatus]);


    const currentIndex = useMemo(() => {
        if (!allLessonsFlat || allLessonsFlat.length === 0 || isNaN(currentLessonId)) return -1;
        return allLessonsFlat.findIndex(lesson => lesson.id === currentLessonId);
    }, [allLessonsFlat, currentLessonId]);

    const prevLesson = currentIndex > 0 ? allLessonsFlat[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allLessonsFlat.length - 1 ? allLessonsFlat[currentIndex + 1] : null;

    const handleNavigate = (targetLessonId) => {
        if (targetLessonId && courseId) {
            navigate(`/learn/${courseId}/${targetLessonId}`);
            window.scrollTo(0, 0); // Scroll to top on lesson change
        }
    };
    const handleGoBackToCourse = () => {
        if (course?.slug) navigate(`/courses/${course.slug}`);
        else if (courseId) navigate(`/courses/${courseId}`);
        else navigate('/courses');
    };


    // --- Loading and Error States ---
    if (isLoadingCourse && !course) {
        return (
            <div className="learning-status loading-state page-container">
                <Spinner label="Loading course content..." size="large" />
            </div>
        );
    }
    if (courseError && !course && courseDetailsStatus === 'failed') {
        return (
           <motion.div className="learning-status learning-error page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
               <FaExclamationTriangle size={40} />
               <h1>Error Loading Course</h1>
               <p>{typeof courseError === 'string' ? courseError : "Could not load course data."}</p>
               <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                <Button onClick={() => dispatch(fetchCourseDetails(courseId))} variant="secondary">Retry</Button>
               </motion.div>
               <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap" style={{marginTop: 'var(--spacing-sm)'}}>
                <Button onClick={() => navigate('/courses')} variant="outline">Back to Courses</Button>
               </motion.div>
           </motion.div>
        );
    }
    if (!course && courseDetailsStatus === 'succeeded') {
        return (
           <motion.div className="learning-status learning-error page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
               <FaExclamationTriangle size={40}/>
               <h1>Course Not Found</h1>
               <p>The requested course (ID: "{courseId}") could not be found.</p>
                <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap"><Button onClick={() => navigate('/courses')} variant="secondary"><FaArrowLeft /> Back to Courses</Button></motion.div>
           </motion.div>
        );
    }
    if (!course) { // General fallback if course is still not available
        return <div className="learning-status loading-state page-container"><Spinner label="Initializing..." size="large" /></div>;
    }

    // --- Lesson Specific Loading/Error (after course is loaded) ---
    if (course && !currentLesson && courseDetailsStatus === 'succeeded' && !isLoadingCourse) { // Course loaded, but current lesson not found by ID
         return (
            <motion.div className="learning-status learning-error page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <FaExclamationTriangle size={40} />
                <h1>Lesson Not Found</h1>
                <p>Could not find data for lesson (ID: "{lessonIdParam}") in the course "{course.title}".</p>
                <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap"><Button onClick={handleGoBackToCourse} variant="secondary"><FaArrowLeft /> Course Details</Button></motion.div>
            </motion.div>
        );
    }
    if (course && !currentLesson && isLoadingCourse) { // Still loading the course which contains the lesson
        return <div className="learning-status loading-state page-container"><Spinner label="Loading lesson details..." size="large" /></div>;
    }
     if (course && !currentLesson) { // Final fallback for lesson not found
        return (
            <motion.div className="learning-status learning-error page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <FaExclamationTriangle size={40} />
                <h1>Lesson Unavailable</h1>
                <p>The requested lesson content is currently unavailable.</p>
                <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap"><Button onClick={handleGoBackToCourse} variant="secondary"><FaArrowLeft /> Course Details</Button></motion.div>
            </motion.div>
        );
    }


    const videoUrlFromData = currentLesson?.videoUrl; // Optional chaining for safety

    return (
        <motion.div className="learning-page-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <motion.aside className="learning-sidebar" variants={sidebarVariants} initial="hidden" animate="visible">
                <Link to={`/courses/${course.slug || courseId}`} className="sidebar-course-title-link">
                    <h3 className="sidebar-course-title">
                        <FaBookOpen className="sidebar-title-icon" />
                        {course.title}
                    </h3>
                </Link>
                <motion.nav className="sidebar-nav" variants={staggerContainerVariants}>
                    {(course.modules && course.modules.length > 0) ? (
                        course.modules.map((module, moduleIndex) => (
                            <motion.div key={module.id || `mod-${moduleIndex}`} className="sidebar-module" variants={itemVariants}>
                                <h4 className="sidebar-module-title">Module {moduleIndex + 1}: {module.title || 'Untitled Module'}</h4>
                                {module.lessons && module.lessons.length > 0 ? (
                                    <ul className="sidebar-lesson-list">
                                        {module.lessons.map(lesson => (
                                            <motion.li key={lesson.id} variants={lessonLinkVariants} whileHover="hover" whileTap="tap">
                                                <Link
                                                    to={`/learn/${courseId}/${lesson.id}`}
                                                    className={`sidebar-lesson-link ${lesson.id === currentLessonId ? 'active' : ''}`}
                                                >
                                                    <FaCircle size="0.6em" className="lesson-status-icon" />
                                                    {lesson.title || 'Untitled Lesson'}
                                                </Link>
                                            </motion.li>
                                        ))}
                                    </ul>
                                ) : <p className='sidebar-no-lessons'>No lessons in this module.</p>}
                            </motion.div>
                        ))
                    ) : <p className="sidebar-no-lessons">No modules found.</p>}
                </motion.nav>
            </motion.aside>

            <motion.main className="learning-main-content" variants={mainContentVariants} initial="hidden" animate="visible">
                <motion.div {...buttonHoverTap} className="main-back-button-wrapper">
                    <Button onClick={handleGoBackToCourse} variant="outline" size="small" className="main-back-button">
                        <FaArrowLeft className="button-icon"/> Course Details
                    </Button>
                </motion.div>

                <motion.h1 className="lesson-title" variants={contentSectionVariants}>{currentLesson.title}</motion.h1>

                <AnimatePresence mode="wait">
                {(currentLesson.type === 'VIDEO' || videoUrlFromData) ? (
                    videoUrlFromData && videoUrlFromData !== '...' && videoUrlFromData.trim() !== '' ? (
                        <motion.div key="videoPlayer" className="video-player-wrapper" variants={contentSectionVariants} initial="hidden" animate="visible" exit="hidden">
                            <ReactPlayer
                                className="react-player"
                                url={videoUrlFromData}
                                width="100%" height="100%"
                                controls={true} pip={true} stopOnUnmount={true}
                                config={{ file: { attributes: { controlsList: 'nodownload', onContextMenu: e => e.preventDefault() }}}}
                                onError={(e) => console.warn('ReactPlayer Error:', e)}
                            />
                        </motion.div>
                    ) : (
                        <motion.div key="videoUnavailable" className="video-unavailable" variants={contentSectionVariants} initial="hidden" animate="visible" exit="hidden">
                            <FaVideoSlash /> Video content is being processed or is not available.
                        </motion.div>
                    )
                ) : (
                     currentLesson.contentType !== 'HTML' && currentLesson.content && /* Show if not video and not HTML and has content */
                     <motion.div key="nonVideoText" className="video-unavailable" variants={contentSectionVariants} initial="hidden" animate="visible" exit="hidden">
                        This is a text-based lesson.
                     </motion.div>
                )}
                </AnimatePresence>

                <motion.section className="lesson-content-description course-section" variants={contentSectionVariants}>
                    <h2>About this Lesson</h2>
                    {currentLesson.contentType === 'HTML' ? (
                        <div dangerouslySetInnerHTML={{ __html: currentLesson.content || 'No description provided.' }} />
                    ) : (
                        <p>{currentLesson.content || currentLesson.description || 'No detailed description provided.'}</p>
                    )}
                </motion.section>

                <motion.section className="lesson-notes-section course-section" variants={contentSectionVariants}>
                    <h2 className="section-title">
                        <FaDownload className="section-title-icon" /> Lesson Notes & Resources
                    </h2>
                    <NotesSection courseId={parseInt(courseId)} lessonId={currentLessonId} />
                </motion.section>

                <motion.div className="lesson-navigation" variants={contentSectionVariants}>
                    <motion.div {...buttonHoverTap}>
                    <Button onClick={() => handleNavigate(prevLesson?.id)} disabled={!prevLesson} variant="outline">
                        <FaArrowLeft className="button-icon" /> Previous
                    </Button>
                    </motion.div>
                    <motion.div {...buttonHoverTap}>
                    <Button onClick={() => handleNavigate(nextLesson?.id)} disabled={!nextLesson} variant="primary">
                        Next <FaArrowRight className="button-icon button-icon-right" />
                    </Button>
                    </motion.div>
                </motion.div>
            </motion.main>
        </motion.div>
    );
};

export default LearningPage;