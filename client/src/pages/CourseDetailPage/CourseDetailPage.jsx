// client/src/pages/CourseDetailPage/CourseDetailPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { motion, AnimatePresence } from 'framer-motion'; // Import Framer Motion
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import './CourseDetailPage.css'; // Your page-specific styles
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

// --- Framer Motion Variants ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const buttonHoverTap = {
  hover: { scale: 1.03, y: -1, transition: { duration: 0.1 } },
  tap: { scale: 0.97 }
};

const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: "easeOut", delay: 0.1 } },
  exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }
};

const tabContentVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: "easeInOut" } }
};


// StarRating Component (from your JSX)
const StarRating = ({ rating, totalStars = 5, reviewCount }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = totalStars - fullStars - halfStar;
    return (
        <div className="star-rating" title={`${rating.toFixed(1)} out of ${totalStars} stars`}>
            {[...Array(fullStars)].map((_, i) => <FaStar key={`full-${i}`} />)}
            {halfStar === 1 && <FaStarHalfAlt key="half" />}
            {[...Array(emptyStars)].map((_, i) => <FaRegStar key={`empty-${i}`} />)}
            {typeof rating === 'number' && <span className="rating-value">({rating.toFixed(1)})</span>}
            {typeof reviewCount === 'number' && <span className="review-count-text">({reviewCount} ratings)</span>}
        </div>
    );
};


const CourseDetailPage = () => {
    const { identifier } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const location = useLocation(); // For redirecting after login

    const { user: loggedInUser, loading: authLoading } = useAuth();

    const course = useSelector((state) => selectCourseById(state, identifier));
    const courseDetailsStatus = useSelector(selectCourseDetailsStatus);
    const courseDetailsError = useSelector(selectCourseDetailsError);

    // Memoize isUserEnrolled selector with course.id
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

    useEffect(() => {
        if (identifier) {
            if (!course || (String(course.id) !== String(identifier) && course.slug !== identifier) || courseDetailsStatus === 'failed') {
                dispatch(fetchCourseDetails(identifier));
            }
            if (course && course.id && (reviewsData.status === 'idle' || reviewsData.courseId !== course.id)) {
                dispatch(fetchCourseReviews({ courseId: course.id, params: { page: 1, limit: 5 } }));
            }
        }
        return () => {
            // dispatch(clearCurrentCourse()); // Clearing on unmount might be too aggressive if navigating within course
        };
    }, [dispatch, identifier, course, courseDetailsStatus, reviewsData.status, reviewsData.courseId]);


    // Clear course details if identifier changes significantly (e.g. navigating from one course to another directly)
    useEffect(() => {
      return () => {
        dispatch(clearCurrentCourse());
      }
    }, [dispatch, identifier])


    const toggleModule = (moduleId) => {
        const key = moduleId || `module-unknown-${Math.random()}`;
        setExpandedModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleGoBack = () => navigate(-1); // Go back to previous page

    const handleEnroll = () => {
        if (!loggedInUser) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }
        if (course && course.id) {
            dispatch(enrollInCourse(course.id));
        }
    };
    
    const handleSubmitReview = (e) => {
        e.preventDefault();
        if (myRating > 0 && course?.id) {
            dispatch(submitCourseReview({ courseId: course.id, reviewData: { rating: myRating, comment: myComment } }))
                .unwrap()
                .then(() => {
                    setShowReviewModal(false); setMyRating(0); setMyComment('');
                    dispatch(clearSubmissionStatus({ type: 'review' })); // Clear status after success
                })
                .catch(() => { /* Error is handled by selector, modal stays open */ });
        }
    };

    const firstLessonId = course?.modules?.[0]?.lessons?.[0]?.id;

    if (authLoading || (courseDetailsStatus === 'loading' && !course) || (courseDetailsStatus === 'idle' && !course)) {
        return (
            <div className="course-detail-status loading-state page-container">
                <Spinner label="Loading course details..." size="large" />
            </div>
        );
    }

    if (courseDetailsStatus === 'failed' && !course) { // Show error only if course couldn't be loaded at all
        return (
           <motion.div className="course-detail-error page-container" variants={pageVariants} initial="initial" animate="in" exit="out">
               <FaExclamationTriangle size={40} />
               <h1>Error Loading Course</h1>
               <p>{courseDetailsError}</p>
               <motion.div {...buttonHoverTap}><Button onClick={handleGoBack} variant="secondary"><FaArrowLeft /> Back</Button></motion.div>
           </motion.div>
        );
    }
    
    if (!course) { // Fallback if course is still null after loading attempts (e.g. not found by selector)
        return (
           <motion.div className="course-detail-error page-container" variants={pageVariants} initial="initial" animate="in" exit="out">
               <h1>Course Not Found</h1>
               <p>Sorry, the course you are looking for (identifier: {identifier}) could not be found.</p>
               <motion.div {...buttonHoverTap}><Button onClick={handleGoBack} variant="secondary"><FaArrowLeft /> Back</Button></motion.div>
           </motion.div>
        );
    }

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
                    <motion.p className="course-short-description" variants={itemVariants}>{course.shortDescription || course.description?.substring(0,150) + '...'}</motion.p>
                    
                    <motion.div className="course-rating-instructor" variants={staggerContainerVariants} initial="hidden" animate="visible">
                        {course.averageRating > 0 && <motion.div variants={itemVariants}><StarRating rating={course.averageRating} reviewCount={course.reviewCount} /></motion.div>}
                        <motion.span variants={itemVariants}>{course.enrollmentCount || 0} students</motion.span>
                    </motion.div>

                    {course.instructor && (
                        <motion.div className="course-instructor-detail" variants={itemVariants}>
                            <img src={course.instructor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}&background=random`} alt={course.instructor.name} className="instructor-avatar-small"/>
                            Created by <Link to={`/instructors/${course.instructor.id}`} className="instructor-profile-link">{course.instructor.name}</Link>
                        </motion.div>
                    )}
                    <motion.div className="course-meta-brief" variants={itemVariants}>
                        {course.language && <span><FaComments /> {course.language}</span>}
                        {course.updatedAt && <span>Last updated {new Date(course.updatedAt).toLocaleDateString()}</span>}
                    </motion.div>

                    <motion.div className="header-action-button-container" variants={itemVariants}>
                        {isUserEnrolled ? (
                            <Link to={firstLessonId ? `/learn/${course.id}/${firstLessonId}` : `/courses/${course.slug || course.id}`} style={{ textDecoration: 'none' }}>
                                <motion.div {...buttonHoverTap}>
                                <Button variant="primary" size="large" className="header-action-button" disabled={!firstLessonId && !isUserEnrolled /* allow view if enrolled but no lessons yet */ }> 
                                    <FaPlayCircle/> Go to Course 
                                </Button>
                                </motion.div>
                            </Link>
                        ) : (
                            <motion.div {...buttonHoverTap}>
                            <Button variant="primary" size="large" className="header-action-button" onClick={handleEnroll}
                                disabled={enrollmentStatus === 'loading' || typeof course.price !== 'number'}>
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
                        key={activeTab} // Key ensures re-render and animation on tab change
                        className="course-tab-content"
                        variants={tabContentVariants}
                        initial="initial" animate="animate" exit="exit"
                    >
                        {activeTab === 'overview' && (
                            <div className="tab-pane overview-tab">
                                <motion.section className="course-section" variants={itemVariants}>
                                    <h2 className="section-title">What you'll learn</h2>
                                    <ul className="learning-objectives">
                                        {course.learningObjectives?.map((obj, i) => <motion.li key={i} variants={itemVariants}>{obj}</motion.li>) || <motion.li variants={itemVariants}>Key concepts of this course.</motion.li>}
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
                                        <motion.p variants={itemVariants}><FaClock /> <strong>Approx. Duration:</strong> <span>{course.estimatedDuration || 'Self-paced'}</span></motion.p>
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
                                                    whileHover={{backgroundColor: "var(--color-secondary-creamy)"}} transition={{duration:0.2}}>
                                                    <span>Module {moduleIndex + 1}: {module.title}</span>
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
                                                                    <span className="lesson-title-text">{lesson.title}</span>
                                                                    {lesson.videoDuration && <span className="lesson-duration">({Math.floor(lesson.videoDuration / 60)}m {lesson.videoDuration % 60}s)</span>}
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
                                    <motion.img src={course.instructor.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor.name)}&background=random`} alt={course.instructor.name} className="instructor-avatar-large"
                                        initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} transition={{delay:0.1}}/>
                                    <div>
                                        <h3>{course.instructor.name}</h3>
                                        <p className="instructor-headline">{course.instructor.headline}</p>
                                    </div>
                                </div>
                                <div className="instructor-bio" dangerouslySetInnerHTML={{ __html: course.instructor.bio || '<p>No biography available for this instructor.</p>'}} />
                            </motion.div>
                        )}

                        {activeTab === 'reviews' && (
                            <motion.div className="tab-pane reviews-tab" variants={staggerContainerVariants}>
                                <h2 className="section-title">Student Feedback</h2>
                                <div className="reviews-summary">
                                    {course.averageRating > 0 ? (
                                        <>
                                            <motion.div className="overall-rating-display" variants={itemVariants}>{course.averageRating.toFixed(1)}</motion.div>
                                            <motion.div variants={itemVariants}><StarRating rating={course.averageRating} /></motion.div>
                                            <motion.p variants={itemVariants}>Based on {course.reviewCount} ratings</motion.p>
                                        </>
                                    ): <motion.p variants={itemVariants}>No ratings yet.</motion.p>}
                                </div>
                                {isUserEnrolled && !loggedInUser?.reviews?.some(r => r.courseId === course.id) && ( // Basic check
                                    <motion.div {...buttonHoverTap} className="write-review-button-wrapper">
                                      <Button onClick={() => setShowReviewModal(true)} variant="primary" >Write a Review</Button>
                                    </motion.div>
                                )}

                                <AnimatePresence mode="wait">
                                {reviewsData.status === 'loading' && <motion.div key="revload" {...statusMessageVariants}><Spinner label="Loading reviews..." /></motion.div>}
                                {reviewsData.error && <motion.p key="reverror" className="error-message form-message" {...statusMessageVariants}><FaExclamationTriangle /> {reviewsData.error}</motion.p>}
                                </AnimatePresence>
                                
                                {reviewsData.status === 'succeeded' && reviewsData.reviews.length > 0 && (
                                    <motion.div className="reviews-list" variants={staggerContainerVariants}>
                                        {reviewsData.reviews.map(review => (
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
                                        {/* TODO: Add pagination for reviews if reviewsData.totalPages > 1 */}
                                    </motion.div>
                                )}
                                {reviewsData.status === 'succeeded' && reviewsData.reviews.length === 0 && <motion.p {...itemVariants}>No reviews yet for this course.</motion.p>}
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