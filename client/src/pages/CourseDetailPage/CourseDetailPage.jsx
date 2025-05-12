// src/pages/CourseDetailPage/CourseDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import './CourseDetailPage.css';
import {
  FaChalkboardTeacher, FaBookOpen, FaPlayCircle, FaArrowLeft,
  FaExclamationTriangle, FaChevronDown, FaChevronUp, FaRupeeSign,
  FaQuestionCircle, FaFileAlt, FaComments, FaInfoCircle, FaListUl,
  FaClock, FaSignal, FaCertificate, FaUserCircle, FaStar, FaRegStar, FaStarHalfAlt
} from 'react-icons/fa';

import { useSelector, useDispatch } from 'react-redux';
import {
    selectCourseById, fetchCourseDetails, selectCourseDetailsStatus,
    selectCourseDetailsError, clearCurrentCourse, enrollInCourse,
    selectEnrollmentStatus, selectEnrollmentSubmissionError, selectIsUserEnrolledInCourse,
    fetchCourseReviews, selectReviewsForCurrentCourse, submitCourseReview,
    selectReviewSubmissionStatus, selectReviewSubmissionError, clearSubmissionStatus,
} from '../../features/courses/CoursesSlice.js';

// --- Framer Motion Variants (keep as they are) ---
const pageVariants = { initial: { opacity: 0, y: 20 }, in: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } }, exit: { opacity: 0, y: -20, transition: { duration: 0.3 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
const staggerContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
const buttonHoverTap = { hover: { scale: 1.03, y: -1, transition: { duration: 0.1 } }, tap: { scale: 0.97 } };
const modalBackdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.2 } }, exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } } };
const modalContentVariants = { hidden: { opacity: 0, scale: 0.9, y: -20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: "easeOut", delay: 0.1 } }, exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } } };
const tabContentVariants = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } }, exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeInOut" } } };

const StarRating = ({ rating, totalStars = 5, reviewCount }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = totalStars - fullStars - halfStar;
    return (
        <div className="star-rating" title={`${rating ? rating.toFixed(1) : '0'} out of ${totalStars} stars`}>
            {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
            {halfStar === 1 && <FaStarHalfAlt key="half" />}
            {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} />)}
            {typeof rating === 'number' && <span className="rating-value">({rating.toFixed(1)})</span>}
            {typeof reviewCount === 'number' && <span className="review-count-text">({reviewCount} ratings)</span>}
        </div>
    );
};

const CourseDetailPage = () => {
    const { courseId: identifier } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation(); // For redirecting after login for enrollment

    const { user: loggedInUser, loading: authLoading } = useAuth();

    console.log('[CourseDetailPage] Mounted/Render. Identifier from useParams:', identifier);

    const course = useSelector((state) => selectCourseById(state, identifier));
    const courseDetailsStatus = useSelector(selectCourseDetailsStatus);
    const courseDetailsError = useSelector(selectCourseDetailsError);

    // Pass course.id to selectIsUserEnrolledInCourse
    const isUserEnrolled = useSelector(state => selectIsUserEnrolledInCourse(state, course?.id));
    const enrollmentStatus = useSelector(selectEnrollmentStatus);
    const enrollmentError = useSelector(selectEnrollmentSubmissionError);

    const reviewsData = useSelector(selectReviewsForCurrentCourse);
    const reviewSubmissionStatus = useSelector(selectReviewSubmissionStatus);
    const reviewSubmissionError = useSelector(selectReviewSubmissionError);

    const [expandedModules, setExpandedModules] = useState({});
    const [activeTab, setActiveTab] = useState('overview');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState('');

    console.log(`[CourseDetailPage] Render Cycle. Identifier: ${identifier}, AuthLoading: ${authLoading}, CourseDetailsStatus: ${courseDetailsStatus}, Course in Redux: ${course ? `ID: ${course.id}` : 'null'}`);

    useEffect(() => {
        if (identifier) {
            console.log(`[CourseDetailPage Effect Triggered] Identifier: ${identifier}, Current CourseDetailsStatus: ${courseDetailsStatus}`);
            const currentCourseInStateMatchesIdentifier = course && (String(course.id) === String(identifier) || (course.slug && course.slug === identifier));

            const shouldFetchCourse =
                courseDetailsStatus === 'idle' || // Initial load for this component instance (or after clearing)
                courseDetailsStatus === 'failed' || // Previous attempt failed, allow retry
                !currentCourseInStateMatchesIdentifier; // No course, or a different course is in `currentCourse` state

            if (shouldFetchCourse) {
                console.log(`[CourseDetailPage Effect] Dispatching fetchCourseDetails for: ${identifier}. Reason - Idle: ${courseDetailsStatus === 'idle'}, Failed: ${courseDetailsStatus === 'failed'}, Mismatch/NoCourse: ${!currentCourseInStateMatchesIdentifier}`);
                dispatch(fetchCourseDetails(identifier));
            } else {
                console.log('[CourseDetailPage Effect] Skipping fetchCourseDetails. Conditions met or data already fresh.');
            }

            // Fetch reviews if course is successfully loaded and reviews are not loaded or are for a different course
            if (courseDetailsStatus === 'succeeded' && course && course.id) {
                if (reviewsData.status === 'idle' || String(reviewsData.courseId) !== String(course.id) || reviewsData.status === 'failed') { // also retry reviews if failed
                    console.log(`[CourseDetailPage Effect] Dispatching fetchCourseReviews for course ID: ${course.id}. ReviewStatus: ${reviewsData.status}, ReviewCourseId: ${reviewsData.courseId}`);
                    dispatch(fetchCourseReviews({ courseId: course.id, params: { page: 1, limit: 5 } }));
                }
            }
        } else {
            console.warn('[CourseDetailPage Effect] Identifier is undefined. Cannot fetch course details.');
            // If identifier becomes undefined, clear any existing course data to avoid showing stale info
            if (course || courseDetailsStatus !== 'idle') {
                dispatch(clearCurrentCourse());
            }
        }
        // Cleanup to clear current course when component unmounts or identifier changes
        // This helps if user navigates from one course detail page to another.
        return () => {
            // console.log('[CourseDetailPage] Cleanup effect for identifier:', identifier);
            // dispatch(clearCurrentCourse()); // Re-evaluate if this is too aggressive or just right.
        };
    }, [dispatch, identifier, courseDetailsStatus, course]); // Added `course` back to ensure effect re-evaluates if the selected course changes
                                                            // due to external factors (though shouldFetch logic handles most cases).

    const toggleModule = (moduleId) => setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    const handleGoBack = () => navigate(-1);
    const handleEnroll = () => {
        if (!loggedInUser) {
            navigate('/login', { state: { from: location } }); // Redirect to login, then back
            return;
        }
        if (course && course.id && !isUserEnrolled && enrollmentStatus !== 'loading') {
             console.log(`[CourseDetailPage] Enrolling in course: ${course.id}`);
            dispatch(enrollInCourse(course.id)); // Pass course.id directly
        }
    };
    const handleSubmitReview = (e) => {
        e.preventDefault();
        if (course && course.id && myRating > 0 && reviewSubmissionStatus !== 'loading') {
            console.log(`[CourseDetailPage] Submitting review for course: ${course.id}`);
            dispatch(submitCourseReview({ courseId: course.id, rating: myRating, comment: myComment }))
                .unwrap()
                .then(() => {
                    setShowReviewModal(false); setMyRating(0); setMyComment('');
                    // Re-fetch reviews is handled by the thunk now
                })
                .catch(err => console.error("Failed to submit review from component:", err));
        }
    };

    const firstLessonId = course?.modules?.find(m => m.lessons?.length > 0)?.lessons[0]?.id;

    // --- Refined Loading Logic ---
    // 1. If auth is loading, always show main spinner.
    // 2. If auth is done, and we have an identifier:
    //    a. If courseDetailsStatus is 'loading', show spinner.
    //    b. If courseDetailsStatus is 'idle' (meaning fetch hasn't started or was cleared), show spinner because useEffect will trigger fetch.
    //    c. If `course` is null even after status is 'succeeded' (should not happen if API is fine), it's a data issue.
    let isLoadingPage;
    if (authLoading) {
        isLoadingPage = true;
        console.log("[CourseDetailPage] Determining isLoadingPage: authLoading is true.");
    } else if (!identifier) {
        isLoadingPage = false; // No identifier, probably show "Not Found" or error after this block
        console.log("[CourseDetailPage] Determining isLoadingPage: No identifier, not loading auth.");
    } else {
        const currentCourseInStateMatchesIdentifier = course && (String(course.id) === String(identifier) || (course.slug && course.slug === identifier));
        if (courseDetailsStatus === 'loading') {
            isLoadingPage = true;
            console.log("[CourseDetailPage] Determining isLoadingPage: authDone, identifier exists, courseDetailsStatus is 'loading'.");
        } else if (courseDetailsStatus === 'idle' && !currentCourseInStateMatchesIdentifier) {
            isLoadingPage = true; // Will trigger fetch
            console.log("[CourseDetailPage] Determining isLoadingPage: authDone, identifier exists, courseDetailsStatus is 'idle' AND no matching course in state (will fetch).");
        } else {
            isLoadingPage = false;
            console.log("[CourseDetailPage] Determining isLoadingPage: authDone, identifier exists, courseDetailsStatus is not 'loading' or 'idle' for a non-matching course.");
        }
    }
    console.log(`[CourseDetailPage] Final isLoadingPage evaluation: ${isLoadingPage}`);


    if (isLoadingPage) {
        return (
            <div className="course-detail-status loading-state page-container">
                <Spinner label={authLoading ? "Authenticating..." : "Loading course details..."} size="large" />
            </div>
        );
    }

    // Handle case where no identifier was provided after auth is done
    if (!identifier && !authLoading) {
        return (
           <motion.div className="course-detail-error page-container" variants={pageVariants} initial="initial" animate="in" exit="out">
               <FaExclamationTriangle size={40}/>
               <h1>Invalid Course Request</h1>
               <p>No course identifier was provided in the URL.</p>
                <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap"><Button onClick={handleGoBack} variant="secondary"><FaArrowLeft /> Back</Button></motion.div>
           </motion.div>
        );
    }

    // Error state: If fetching failed specifically for course details
    if (courseDetailsStatus === 'failed' && !course) { // Only show major error if course object is still missing
        console.error("[CourseDetailPage] Status: failed, and no usable course data. Error:", courseDetailsError);
        return (
           <motion.div className="course-detail-error page-container" variants={pageVariants} initial="initial" animate="in" exit="out">
               <FaExclamationTriangle size={40} />
               <h1>Error Loading Course</h1>
               <p>{typeof courseDetailsError === 'string' ? courseDetailsError : "Could not retrieve course details. Please try again."}</p>
               <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
                   <Button onClick={() => {
                       console.log("[CourseDetailPage] Retry button clicked. Dispatching fetchCourseDetails for:", identifier);
                       dispatch(fetchCourseDetails(identifier));
                   }} variant="secondary">
                       <FaArrowLeft /> Retry
                   </Button>
               </motion.div>
           </motion.div>
        );
    }
    
    // "Not Found" state: If fetching succeeded but the course object is null
    if (!course && courseDetailsStatus === 'succeeded') {
        console.warn(`[CourseDetailPage] Course not found after successful fetch for identifier: ${identifier}`);
        return (
           <motion.div className="course-detail-error page-container" variants={pageVariants} initial="initial" animate="in" exit="out">
               <FaExclamationTriangle size={40}/>
               <h1>Course Not Found</h1>
               <p>Sorry, the course identified by "{identifier}" could not be found or is not currently available.</p>
                <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap"><Button onClick={handleGoBack} variant="secondary"><FaArrowLeft /> Back to Courses</Button></motion.div>
           </motion.div>
        );
    }
    
    // If, after all checks, course is still null (should be rare if identifier is present and logic is correct)
    if (!course) {
        console.error(`[CourseDetailPage] CRITICAL FALLBACK: Course is null. Identifier: ${identifier}, AuthLoading: ${authLoading}, Status: ${courseDetailsStatus}`);
        // This might happen if identifier exists, auth is done, status is idle, but useEffect hasn't dispatched yet or selector is problematic.
        // Or if status is 'succeeded' but payload was empty (handled above).
        // If spinner showed and then this appears, it's a logic flaw.
        return (
            <div className="course-detail-status loading-state page-container">
                <Spinner label="Initializing course..." size="large" />
                {/* Or show a "Course not available message" */}
            </div>
        );
    }

    // --- If course is loaded, render its details ---
    return (
        <motion.div className="course-detail-container page-container" variants={pageVariants} initial="initial" animate="in" exit="out">
            <motion.div {...buttonHoverTap} className="back-button-wrapper">
                <Button onClick={handleGoBack} variant="outline" size="small" className="back-button">
                    <FaArrowLeft className="button-icon"/> Back
                </Button>
            </motion.div>

            <motion.header className="course-header" initial={{opacity:0, y: -20}} animate={{opacity:1, y:0}} transition={{delay:0.1, duration:0.4}}>
                 <motion.img
                    src={course.thumbnailUrl || `https://via.placeholder.com/700x390/cccccc/ffffff?text=${encodeURIComponent(course.title)}`}
                    alt={`${course.title} thumbnail`}
                    className="course-header-thumbnail"
                    initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.2, duration:0.5}}
                 />
                 <div className="course-header-content">
                    <motion.h1 className="course-title" variants={itemVariants}>{course.title}</motion.h1>
                    {course.category && (
                        <motion.div variants={itemVariants}>
                            <Link to={`/courses?category=${course.category.slug}`} className="course-category-link">
                                {course.category.name}
                            </Link>
                        </motion.div>
                    )}
                    <motion.p className="course-short-description" variants={itemVariants}>{course.excerpt || course.description?.substring(0,150) + (course.description?.length > 150 ? '...' : '')}</motion.p>
                    
                    <motion.div className="course-rating-instructor" variants={staggerContainerVariants} initial="hidden" animate="visible">
                        {course.averageRating != null && course.averageRating > 0 && <motion.div variants={itemVariants}><StarRating rating={course.averageRating} reviewCount={course.reviewCount} /></motion.div>}
                        <motion.span variants={itemVariants}>{course.enrollmentCount || 0} students</motion.span>
                    </motion.div>

                    {course.instructor && (
                        <motion.div className="course-instructor-detail" variants={itemVariants}>
                            <img src={course.instructor.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}&background=random`} alt={course.instructor.name} className="instructor-avatar-small"/>
                            Created by <Link to={`/instructors/${course.instructor.id}`} className="instructor-profile-link">{course.instructor.name}</Link>
                        </motion.div>
                    )}
                    <motion.div className="course-meta-brief" variants={itemVariants}>
                        {course.language && <span><FaComments /> {course.language}</span>}
                        {course.updatedAt && <span>Last updated {new Date(course.updatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>}
                    </motion.div>

                    <motion.div className="header-action-button-container" variants={itemVariants}>
                        {isUserEnrolled ? (
                            <Link to={firstLessonId ? `/learn/${course.id}/${firstLessonId}` : `/courses/${course.slug || course.id}`} style={{ textDecoration: 'none' }}>
                                <motion.div {...buttonHoverTap}>
                                <Button variant="primary" size="large" className="header-action-button" disabled={!firstLessonId && isUserEnrolled && course.modules?.length > 0}> 
                                    <FaPlayCircle/> {firstLessonId ? 'Continue Learning' : (course.modules?.length > 0 ? 'Start Course' : 'View Course (No Lessons Yet)')}
                                </Button>
                                </motion.div>
                            </Link>
                        ) : (
                            <motion.div {...buttonHoverTap}>
                            <Button variant="primary" size="large" className="header-action-button" onClick={handleEnroll}
                                disabled={enrollmentStatus === 'loading' || typeof course.price !== 'number' || (course.price > 0 && (!loggedInUser || authLoading))}>
                                {enrollmentStatus === 'loading' ? <Spinner size="small" /> : 
                                (course.price > 0 ? <><FaRupeeSign/> Enroll for {course.price.toLocaleString('en-IN')}</> : 'Enroll for Free')}
                            </Button>
                            </motion.div>
                        )}
                    </motion.div>
                    {enrollmentStatus === 'failed' && <motion.p className="error-message form-message" {...itemVariants}>{enrollmentError}</motion.p>}
                 </div>
            </motion.header>

             <div className="course-main-content">
                <motion.div className="course-tabs-container" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3, duration:0.4}}>
                    <div className="course-tabs">
                        {['overview', 'content', 'instructor', 'reviews'].map(tabName => (
                            <motion.button
                                key={tabName}
                                className={`tab-button ${activeTab === tabName ? 'active' : ''}`}
                                onClick={() => setActiveTab(tabName)}
                                aria-selected={activeTab === tabName} role="tab"
                                variants={buttonHoverTap} whileHover="hover" whileTap="tap"
                            >
                                {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
                                {activeTab === tabName && <motion.div className="active-tab-indicator" layoutId="activeTabIndicator" />}
                            </motion.button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        className="course-tab-content"
                        variants={tabContentVariants}
                        initial="initial" animate="animate" exit="exit"
                    >
                        {activeTab === 'overview' && (
                            <div className="tab-pane overview-tab">
                                <motion.section className="course-section" variants={itemVariants}>
                                    <h2 className="section-title">What you'll learn</h2>
                                    <ul className="learning-objectives">
                                        {course.learningObjectives?.length > 0 ? 
                                            course.learningObjectives.map((obj, i) => <motion.li key={i} variants={itemVariants}>{obj}</motion.li>) :
                                            <motion.li variants={itemVariants}>Key concepts of this course will be detailed here.</motion.li>}
                                    </ul>
                                </motion.section>
                                <motion.section className="course-section" variants={itemVariants}>
                                    <h2 className="section-title">Description</h2>
                                    <div className="course-description-full" dangerouslySetInnerHTML={{ __html: course.description || '<p>No detailed description available.</p>' }} />
                                </motion.section>
                                <motion.section className="course-section course-meta-section" variants={staggerContainerVariants}>
                                    <h2 className="section-title">Course Details</h2>
                                    <div className="course-meta-grid">
                                        {course.difficulty && <motion.p variants={itemVariants}><FaSignal /> <strong>Level:</strong> <span>{course.difficulty.replace('_', ' ')}</span></motion.p>}
                                        <motion.p variants={itemVariants}><FaBookOpen /> <strong>Modules:</strong> <span>{course.modules?.length || 0}</span></motion.p>
                                        <motion.p variants={itemVariants}><FaListUl /> <strong>Lessons:</strong> <span>{course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0}</span></motion.p>
                                        <motion.p variants={itemVariants}><FaCertificate /> <strong>Access:</strong> <span>Lifetime</span></motion.p>
                                    </div>
                                </motion.section>
                            </div>
                        )}
                        {activeTab === 'content' && (
                            <div className="tab-pane content-tab">
                                <h2 className="section-title">Course Content</h2>
                                <motion.div className="modules-list accordion" variants={staggerContainerVariants}>
                                    {(course.modules && course.modules.length > 0) ? (
                                        course.modules.map((module, moduleIndex) => {
                                            const moduleIdKey = module.id || `mod-idx-${moduleIndex}`;
                                            const isExpanded = !!expandedModules[moduleIdKey];
                                            return (
                                            <motion.div key={moduleIdKey} className={`module-item ${isExpanded ? 'expanded' : ''}`} variants={itemVariants}>
                                                <motion.button className="module-title-button" onClick={() => toggleModule(moduleIdKey)} aria-expanded={isExpanded}
                                                    whileHover={{backgroundColor: "var(--color-background-offset)"}} transition={{duration:0.2}}>
                                                    <span>Module {module.order != null ? module.order + 1 : moduleIndex + 1}: {module.title || 'Untitled Module'}</span>
                                                    <motion.span className="module-toggle-icon" animate={{ rotate: isExpanded ? 0 : -90 }}>{isExpanded ? <FaChevronUp /> : <FaChevronDown />}</motion.span>
                                                </motion.button>
                                                <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div className="module-lessons-content"
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    >
                                                        {(module.lessons && module.lessons.length > 0) ? (
                                                            <ul className="lessons-list">
                                                                {module.lessons.map(lesson => (
                                                                <motion.li key={lesson.id} className="lesson-item" variants={itemVariants} whileHover={{x:5}} transition={{type:'spring', stiffness:400}}>
                                                                    <FaPlayCircle className="lesson-icon" style={{ color: lesson.isFreePreview || isUserEnrolled ? 'var(--color-primary)' : 'var(--color-text-secondary)'}} />
                                                                    <span className="lesson-title-text">{lesson.title || 'Untitled Lesson'}</span>
                                                                    {lesson.videoDuration != null && <span className="lesson-duration">({Math.floor(lesson.videoDuration / 60)}m {lesson.videoDuration % 60}s)</span>}
                                                                    {(lesson.isFreePreview && !isUserEnrolled) && <Link to={`/learn/${course.id}/${lesson.id}?preview=true`} className="preview-link">(Preview)</Link>}
                                                                    {isUserEnrolled && <Link to={`/learn/${course.id}/${lesson.id}`} className="learn-link">Start</Link>}
                                                                </motion.li>
                                                                ))}
                                                            </ul>
                                                        ) : <p className="no-lessons-in-module">No lessons in this module.</p>}
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>
                                            </motion.div>
                                            );
                                        })
                                    ) : <p>Course content will be available soon.</p>}
                                </motion.div>
                            </div>
                        )}

                        {activeTab === 'instructor' && course.instructor && (
                             <motion.div className="tab-pane instructor-tab" variants={itemVariants}>
                                <h2 className="section-title">About The Instructor</h2>
                                <div className="instructor-profile-brief">
                                    <motion.img src={course.instructor.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}&background=random`} alt={course.instructor.name} className="instructor-avatar-large"
                                        initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay:0.1}}/>
                                    <div>
                                        <h3>{course.instructor.name}</h3>
                                        <p className="instructor-headline">{course.instructor.profile?.headline}</p>
                                    </div>
                                </div>
                                <div className="instructor-bio" dangerouslySetInnerHTML={{ __html: course.instructor.profile?.bio || '<p>No biography available for this instructor.</p>'}} />
                            </motion.div>
                        )}

                         {activeTab === 'reviews' && (
                            <motion.div className="tab-pane reviews-tab" variants={staggerContainerVariants}>
                                <h2 className="section-title">Student Feedback</h2>
                                <div className="reviews-summary">
                                    {course.averageRating != null && course.averageRating > 0 ? (
                                        <>
                                            <motion.div className="overall-rating-display" variants={itemVariants}>{course.averageRating.toFixed(1)}</motion.div>
                                            <motion.div variants={itemVariants}><StarRating rating={course.averageRating} reviewCount={course.reviewCount} /></motion.div>
                                            <motion.p variants={itemVariants}>Based on {course.reviewCount} ratings</motion.p>
                                        </>
                                    ): <motion.p variants={itemVariants}>No ratings yet for this course.</motion.p>}
                                </div>
                                {/* Review submission button logic */}
                                {isUserEnrolled && loggedInUser && !reviewsData.items.some(r => r.userId === loggedInUser.id && String(r.courseId) === String(course.id)) && (
                                    <motion.div {...buttonHoverTap} className="write-review-button-wrapper">
                                      <Button onClick={() => setShowReviewModal(true)} variant="primary" >Write a Review</Button>
                                    </motion.div>
                                )}

                                <AnimatePresence mode="wait">
                                {reviewsData.status === 'loading' && <motion.div key="revload" className="loading-section"><Spinner label="Loading reviews..." /></motion.div>}
                                {/* Display error from reviewsData.error (which is populated if fetchCourseReviews fails) */}
                                {reviewsData.status === 'failed' && reviewsData.error && <motion.p key="reverror" className="error-message form-message"><FaExclamationTriangle /> {reviewsData.error}</motion.p>}
                                </AnimatePresence>
                                
                                {reviewsData.status === 'succeeded' && reviewsData.items.length > 0 && (
                                    <motion.div className="reviews-list" variants={staggerContainerVariants}>
                                        {reviewsData.items.map(review => (
                                        <motion.div key={review.id || review.userId} className="review-item" variants={itemVariants}>
                                            <div className="review-author">
                                                <img src={review.user?.profile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.name || 'U')}&background=random`} alt={review.user?.name}/>
                                                <span>{review.user?.name || 'Anonymous User'}</span>
                                            </div>
                                            <StarRating rating={review.rating} />
                                            <p className="review-comment">{review.comment}</p>
                                            <small className="review-date">{new Date(review.createdAt).toLocaleDateString()}</small>
                                        </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                                {reviewsData.status === 'succeeded' && reviewsData.items.length === 0 && <motion.p {...itemVariants}>No reviews yet for this course.</motion.p>}
                            </motion.div>
                        )}
                    </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            <AnimatePresence>
            {showReviewModal && (
                <motion.div className="modal-backdrop" variants={modalBackdropVariants} initial="hidden" animate="visible" exit="exit" onClick={() => {setShowReviewModal(false); dispatch(clearSubmissionStatus({type: 'review'}))}}>
                    <motion.div className="modal-content review-modal" variants={modalContentVariants} onClick={e => e.stopPropagation()}>
                        <h3>Write a Review for {course.title}</h3>
                        <form onSubmit={handleSubmitReview} className="review-form">
                            <div className="form-group rating-group">
                                <label>Your Rating:</label>
                                <div className="star-input-container">
                                    {[1,2,3,4,5].map(star => (
                                        <motion.div key={star} whileHover={{scale:1.2}} whileTap={{scale:0.9}}>
                                        <FaStar 
                                            onClick={() => setMyRating(star)} 
                                            className={`rating-star ${star <= myRating ? 'selected' : ''}`}
                                        />
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="reviewComment">Your Comment (Optional):</label>
                                <textarea 
                                    id="reviewComment"
                                    value={myComment} 
                                    onChange={e => setMyComment(e.target.value)}
                                    placeholder="Share your thoughts about the course..."
                                    rows="5"
                                    className="form-textarea"
                                />
                            </div>
                            {reviewSubmissionStatus === 'failed' && <p className="error-message form-error">{reviewSubmissionError}</p>}
                            <div className="modal-actions">
                                <motion.div {...buttonHoverTap}>
                                <Button type="button" variant="outline" onClick={() => {setShowReviewModal(false); dispatch(clearSubmissionStatus({type: 'review'}))}}>Cancel</Button>
                                </motion.div>
                                <motion.div {...buttonHoverTap}>
                                <Button type="submit" variant="primary" disabled={reviewSubmissionStatus === 'loading' || myRating === 0}>
                                    {reviewSubmissionStatus === 'loading' ? <Spinner size="small"/> : 'Submit Review'}
                                </Button>
                                </motion.div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};

export default CourseDetailPage;