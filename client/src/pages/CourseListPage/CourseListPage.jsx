// client/src/pages/CourseListPage/CourseListPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Import Framer Motion

// Assuming these are your existing, styled components
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Spinner from '../../components/common/Spinner';

import './CourseListPage.css'; // Import CSS for base styling
import { FaChalkboardTeacher, FaSearch, FaAngleDown, FaTag, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCourses,
  selectAllCourses,
  selectCoursesStatus,
  selectCoursesError,
  selectCoursesPagination,
  selectAvailableCategoriesForFilter,
} from '../../features/courses/CoursesSlice.js';

import {
    fetchAdminUsers,
    selectAdminUsersList,
    selectAdminUsersStatus,
    selectAdminUsersError
} from '../../features/admin/adminUsersSlice.js';

const COURSES_PER_PAGE = 9;
const LOAD_MORE_DELAY = 300; // Slightly reduced for quicker feel

// --- Framer Motion Variants ---
const pageContainerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.2, ease: "easeOut" } }
};

const controlsVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.3, ease: "easeOut" } }
};

const courseGridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Stagger delay for each card
      delayChildren: 0.2,    // Delay before starting stagger (after controls appear)
    },
  },
};

const courseCardMotionProps = {
  variants: {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  },
  layout: true, // Animate layout changes smoothly
  whileHover: { y: -5, scale: 1.02, boxShadow: "var(--box-shadow-md)" }, // Uses CSS var
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 300, damping: 15 }, // For hover/tap
};

const buttonMotionProps = {
  whileHover: { scale: 1.03, y: -1, transition: { duration: 0.15 } },
  whileTap: { scale: 0.97 },
};

const statusMessageVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto', transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeInOut" } }
};


const CourseListPage = () => {
    const dispatch = useDispatch();
    const [searchParams, setSearchParams] = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [activeCategorySlug, setActiveCategorySlug] = useState(searchParams.get('category') || 'all');
    
    const [visibleCount, setVisibleCount] = useState(COURSES_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const coursesFromRedux = useSelector(selectAllCourses);
    const coursesStatus = useSelector(selectCoursesStatus);
    const coursesError = useSelector(selectCoursesError);
    const { totalCourses: totalCoursesFromAPI } = useSelector(selectCoursesPagination);
    const availableCategories = useSelector(selectAvailableCategoriesForFilter); 

    const allUsersFromAdminSlice = useSelector(selectAdminUsersList);
    const usersFetchStatus = useSelector(selectAdminUsersStatus);
    const usersFetchError = useSelector(selectAdminUsersError);

    const initialFetchDone = React.useRef(false);

    useEffect(() => {
        const currentParams = {};
        if (searchTerm) currentParams.search = searchTerm;
        if (activeCategorySlug && activeCategorySlug !== 'all') currentParams.category = activeCategorySlug;
        setSearchParams(currentParams, { replace: true });

        const fetchParams = {
            limit: 50, // Fetch a larger batch
            searchTerm: searchTerm || undefined,
            category: activeCategorySlug === 'all' ? undefined : activeCategorySlug,
        };
        dispatch(fetchCourses(fetchParams)).then(() => {
            initialFetchDone.current = true;
        });

        if (usersFetchStatus === 'idle' || (usersFetchStatus === 'failed' && (!allUsersFromAdminSlice || allUsersFromAdminSlice.length === 0))) {
            dispatch(fetchAdminUsers({ limit: 1000 }));
        }
    }, [dispatch, searchTerm, activeCategorySlug, setSearchParams]); // Removed usersFetchStatus to avoid loop if user fetch fails repeatedly

    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setVisibleCount(COURSES_PER_PAGE); // Reset visible count for new search
        // Fetch is handled by useEffect due to searchTerm change
    };
    const handleCategoryFilter = (categorySlug) => {
        setActiveCategorySlug(categorySlug);
        setVisibleCount(COURSES_PER_PAGE); // Reset for new category
        // Fetch is handled by useEffect due to activeCategorySlug change
    };
    const handleLoadMore = () => {
        if (isLoadingMore || visibleCount >= coursesFromRedux.length) return;
        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prevCount => Math.min(prevCount + COURSES_PER_PAGE, coursesFromRedux.length));
            setIsLoadingMore(false);
        }, LOAD_MORE_DELAY);
    };

    const findInstructorName = useCallback((instructorDataFromCourse, instructorIdFromCourse) => {
        if (instructorDataFromCourse && instructorDataFromCourse.name) {
            return instructorDataFromCourse.name;
        }
        if (instructorIdFromCourse && allUsersFromAdminSlice && allUsersFromAdminSlice.length > 0) {
            const idToFind = typeof instructorIdFromCourse === 'string' ? parseInt(instructorIdFromCourse, 10) : instructorIdFromCourse;
            const instructor = allUsersFromAdminSlice.find(user => user.id === idToFind);
            if (instructor) return instructor.name;
        }
        // Avoid showing 'Loading...' if main courses are loaded, just show N/A or default
        // if (usersFetchStatus === 'loading' && initialFetchDone.current) return 'Checking instructor...';
        return 'Instructor N/A';
    }, [allUsersFromAdminSlice]); // Removed usersFetchStatus to prevent re-renders just for this loading state
    
    const displayedCourses = useMemo(() => {
        return coursesFromRedux.slice(0, visibleCount);
    }, [coursesFromRedux, visibleCount]);

    const getCategoryDisplayName = useCallback((slug) => {
        if (!slug || slug === 'all') return 'All Courses';
        const category = availableCategories.find(cat => cat.slug === slug);
        return category ? `${category.name} Courses` : `${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')} Courses`;
    }, [availableCategories]);

    // --- Render Logic ---
    const renderContent = () => {
        if (coursesStatus === 'loading' && coursesFromRedux.length === 0 && !initialFetchDone.current) {
            return (
                <motion.div key="initial-loading" className="page-container course-list-page section-loading" {...statusMessageVariants}>
                    <Spinner label="Loading courses..." size="large" />
                </motion.div>
            );
        }

        return (
            <>
                <motion.div className="category-filters" variants={controlsVariants}>
                    <motion.div {...buttonMotionProps}>
                        <Button
                            variant={activeCategorySlug === 'all' ? 'primary' : 'outline'}
                            className={`category-filter-btn ${activeCategorySlug === 'all' ? 'active' : ''}`}
                            onClick={() => handleCategoryFilter('all')}
                        >
                            <FaTag /> All
                        </Button>
                    </motion.div>
                    {availableCategories.map(category => (
                        <motion.div key={category.slug || category.id} {...buttonMotionProps}>
                            <Button
                                variant={activeCategorySlug === category.slug ? 'primary' : 'outline'}
                                className={`category-filter-btn ${activeCategorySlug === category.slug ? 'active' : ''}`}
                                onClick={() => handleCategoryFilter(category.slug)}
                            >
                                {category.name}
                            </Button>
                        </motion.div>
                    ))}
                </motion.div>

                <AnimatePresence mode="wait">
                    {coursesStatus === 'loading' && coursesFromRedux.length > 0 && initialFetchDone.current && (
                        <motion.div key="inline-loader" className="inline-loader" {...statusMessageVariants} style={{ textAlign: 'center', padding: '1rem' }}>
                            <Spinner label="Updating courses..." />
                        </motion.div>
                    )}
                    {coursesStatus === 'failed' && (
                        <motion.div key="section-error" className="section-error" {...statusMessageVariants}>
                            <FaExclamationTriangle /> 
                            {coursesError}
                            <motion.div {...buttonMotionProps} className="retry-button-wrapper">
                                <Button 
                                    onClick={() => dispatch(fetchCourses({
                                        searchTerm: searchTerm || undefined,
                                        category: activeCategorySlug === 'all' ? undefined : activeCategorySlug,
                                        limit: 50 
                                    }))} 
                                    variant="secondary-outline" size="small"
                                >
                                    Retry
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {usersFetchStatus === 'loading' && initialFetchDone.current && coursesStatus !== 'loading' && (
                     <p className="instructor-data-status">Loading instructor data...</p>
                )}
                {usersFetchStatus === 'failed' && (
                     <p className="instructor-data-status error">
                         <FaExclamationTriangle />
                         Note: Could not load complete instructor details. ({usersFetchError})
                     </p>
                )}

                <motion.div className="item-container courses-grid" variants={courseGridVariants} initial="hidden" animate="visible">
                    <AnimatePresence> {/* For animating items out if list changes, though current setup re-renders */}
                        {coursesStatus === 'succeeded' && displayedCourses.length > 0 ? (
                            displayedCourses.map(course => (
                                <motion.div
                                    key={course.id}
                                    className="item course-motion-wrapper"
                                    {...courseCardMotionProps} // Applies variants, layout, whileHover, whileTap
                                >
                                    <Link to={`/courses/${course.slug || course.id}`} className="course-card-link">
                                        {/* Using Card component that accepts className */}
                                        <Card className="course-list-card">
                                            <img
                                                src={course.thumbnailUrl || `https://via.placeholder.com/350x180/cccccc/ffffff?text=${encodeURIComponent(course.title||'Course')}`}
                                                alt={`${course.title || 'Course'} thumbnail`}
                                                className="course-card-thumbnail"
                                                loading="lazy"
                                                onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/350x180/E1E1E1/909090?text=No+Image"; }}
                                            />
                                            <div className="course-list-card-content">
                                                <h3 className="course-list-card-title">{course.title || 'Untitled Course'}</h3>
                                                <p className="course-instructor">
                                                    <FaChalkboardTeacher className="instructor-icon" />
                                                    {findInstructorName(course.instructor, course.instructorId)}
                                                </p>
                                                <p className="course-description">
                                                    {course.excerpt || course.description || 'No description available.'}
                                                </p>
                                            </div>
                                        </Card>
                                    </Link>
                                </motion.div>
                            ))
                        ) : null}
                    </AnimatePresence>
                </motion.div>

                <AnimatePresence>
                {coursesStatus === 'succeeded' && displayedCourses.length === 0 && !coursesError && initialFetchDone.current && (
                    <motion.div 
                        key="no-results"
                        className="no-results-message" 
                        {...statusMessageVariants}
                    >
                        <FaInfoCircle />
                        {searchTerm || (activeCategorySlug && activeCategorySlug !== 'all') 
                            ? "No courses found matching your criteria. Try adjusting your search or filters." 
                            : "No courses are currently available in this category. Please check back later!"}
                    </motion.div>
                )}
                </AnimatePresence>

                {coursesStatus === 'succeeded' && coursesFromRedux.length > 0 && coursesFromRedux.length > visibleCount && (
                    <motion.div className="load-more-container" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}}>
                        <motion.div {...buttonMotionProps}>
                            <Button
                                variant="secondary"
                                className="load-more-button"
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                            >
                                {isLoadingMore ? <Spinner size="small" /> : <> Load More Courses <FaAngleDown /> </>}
                            </Button>
                        </motion.div>
                        <p className='item-count-status'>
                            Showing {displayedCourses.length} of {coursesFromRedux.length}
                            {totalCoursesFromAPI > coursesFromRedux.length ? ` (filtered from ${totalCoursesFromAPI} total)` : ''}
                        </p>
                    </motion.div>
                )}
            </>
        );
    }


    return (
        <motion.div 
            className="page-container course-list-page"
            key={activeCategorySlug + searchTerm} // Re-trigger page animation on filter change
            variants={pageContainerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <motion.h1 className="course-list-title" variants={headerVariants}>
                {getCategoryDisplayName(activeCategorySlug)}
            </motion.h1>

            <motion.form className="search-form" onSubmit={handleSearchSubmit} variants={controlsVariants}>
                <Input 
                    id="course-search" type="search" 
                    placeholder={`Search in ${activeCategorySlug === 'all' ? 'all courses' : getCategoryDisplayName(activeCategorySlug).replace(' Courses', '')}...`} 
                    value={searchTerm} 
                    onChange={handleSearchChange} 
                    className="search-input" 
                />
                <motion.div {...buttonMotionProps}>
                    <Button type="submit" variant="primary" className="search-button">
                        <FaSearch className="button-icon" /> Search
                    </Button>
                </motion.div>
            </motion.form>

            {/* Render category filters and course list */}
            {renderContent()}
            
        </motion.div>
    );
};

export default CourseListPage;