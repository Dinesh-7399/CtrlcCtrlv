import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './CourseListPage.css'; // Ensure CSS for buttons/layout exists
import { FaChalkboardTeacher, FaSearch, FaAngleDown, FaTag } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion'; // Ensure framer-motion is installed
import Spinner from '../../components/common/Spinner';

// --- Redux Imports ---
import { useSelector } from 'react-redux';
// !! Adjust paths and ensure selectors exist !!
import { selectAllCourses } from '../../features/courses/CoursesSlice.js';
import { selectAllUsers } from '../../features/users/usersSlice.js';
// No category slice needed as we derive from courses
// --- End Redux Imports ---

// --- Constants for Pagination ---
const COURSES_PER_PAGE = 9;
const LOAD_MORE_DELAY = 1000;
// --- End Constants ---

// --- Helper Function to Generate Slugs ---
const slugify = (text = '') => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
// --- End Helper Function ---

const CourseListPage = () => {
    // --- Redux Data ---
    const allCoursesFromRedux = useSelector(selectAllCourses) || [];
    const allUsersFromRedux = useSelector(selectAllUsers) || [];
    // --- End Redux Data ---

    // --- State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [visibleCount, setVisibleCount] = useState(COURSES_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeCategorySlug, setActiveCategorySlug] = useState(searchParams.get('category') || 'all');
    // --- End State ---

    // --- Derive Unique Categories ---
    const availableCategories = useMemo(() => {
        if (!allCoursesFromRedux) return [];
        // Ensure category exists and is a string before mapping
        const categoryNames = new Set(
            allCoursesFromRedux
                .map(course => course.category)
                .filter(category => typeof category === 'string' && category.trim() !== '')
        );
        return Array.from(categoryNames).map(name => ({
            name: name,
            slug: slugify(name)
        })).sort((a, b) => a.name.localeCompare(b.name)); // Sort categories alphabetically
    }, [allCoursesFromRedux]);
    // --- End Derive Categories ---

    // --- Effect to Sync State with URL ---
    useEffect(() => {
        setActiveCategorySlug(searchParams.get('category') || 'all');
    }, [searchParams]);
    // --- End Sync Effect ---

    // --- Effect for Filtering Courses ---
    useEffect(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
        const currentCategorySlug = activeCategorySlug === 'all' ? null : activeCategorySlug;
        let results = allCoursesFromRedux;

        // Filter by category slug
        if (currentCategorySlug) {
            results = results.filter(course => course.category && slugify(course.category) === currentCategorySlug);
        }

        // Filter by search term
        if (lowerCaseSearchTerm) {
             results = results.filter(course => {
                 const instructorName = findInstructorName(course.instructorId).toLowerCase();
                 // Check optional fields safely
                 const titleMatch = course.title?.toLowerCase().includes(lowerCaseSearchTerm);
                 const descMatch = course.description?.toLowerCase().includes(lowerCaseSearchTerm);
                 const categoryMatch = course.category?.toLowerCase().includes(lowerCaseSearchTerm);
                 const instructorMatch = instructorName.includes(lowerCaseSearchTerm);
                 return titleMatch || descMatch || categoryMatch || instructorMatch;
             });
        }

        setFilteredCourses(results);
        setVisibleCount(COURSES_PER_PAGE); // Reset pagination

    }, [searchTerm, allCoursesFromRedux, activeCategorySlug, allUsersFromRedux]); // Added allUsersFromRedux dependency
    // --- End Filtering Effect ---


    // --- Helper Functions ---
    const findInstructorName = (instructorId) => {
        const instructor = allUsersFromRedux.find(user => user.id === instructorId);
        return instructor ? instructor.name : 'Unknown Instructor';
     };

    const handleLoadMore = () => {
        if (isLoadingMore) return;
        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prevCount => prevCount + COURSES_PER_PAGE);
            setIsLoadingMore(false);
        }, LOAD_MORE_DELAY);
    };

    const handleSearchChange = (e) => { setSearchTerm(e.target.value); };
    const handleSearchSubmit = (e) => { e.preventDefault(); };

    const handleCategoryFilter = (categorySlug) => {
         const currentParams = Object.fromEntries([...searchParams]);
         if (categorySlug === 'all') {
            delete currentParams.category;
         } else {
            currentParams.category = categorySlug;
         }
         setSearchParams(currentParams, { replace: true }); // Use replace to avoid excessive history entries
    };
    // --- End Helper Functions ---

    // Derive displayed courses
    const displayedCourses = filteredCourses.slice(0, visibleCount);

    // Get display name for title
    const getCategoryDisplayName = (slug) => {
        if (!slug || slug === 'all') return 'All Courses';
        const category = availableCategories.find(cat => cat.slug === slug);
        return category ? `${category.name} Courses` : `${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')} Courses`;
    };

    return (
        <div className="page-container course-list-page">
             <h1 className="course-list-title">
                 {getCategoryDisplayName(activeCategorySlug)}
            </h1>

            {/* Search Form */}
            <form className="search-form" onSubmit={handleSearchSubmit}>
                 <Input id="course-search" type="search" placeholder={`Search within ${getCategoryDisplayName(activeCategorySlug)}...`} value={searchTerm} onChange={handleSearchChange} className="search-input" />
                <Button type="submit" variant="primary" className="search-button"> <FaSearch className="button-icon" /> Search </Button>
            </form>

            {/* Category Filter Buttons */}
            <div className="category-filters">
                 <Button
                    variant="outline"
                    className={`category-filter-btn ${activeCategorySlug === 'all' ? 'active' : ''}`}
                    onClick={() => handleCategoryFilter('all')}
                 >
                    <FaTag /> All
                 </Button>
                 {availableCategories.map(category => (
                    <Button
                        key={category.slug}
                        variant="outline"
                        className={`category-filter-btn ${activeCategorySlug === category.slug ? 'active' : ''}`}
                        onClick={() => handleCategoryFilter(category.slug)}
                    >
                        {category.name}
                    </Button>
                 ))}
            </div>

            {/* Display Courses Grid */}
            <div className="item-container courses-grid">
                 {/* Added mode="popLayout" for smoother transitions */}
                <AnimatePresence mode="popLayout">
                    {displayedCourses.length > 0 ? (
                        displayedCourses.map(course => (
                            <motion.div
                                key={course.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="item course-motion-wrapper"
                            >
                                <Link to={`/courses/${course.id}`} className="course-card-link">
                                    <Card className="course-list-card">
                                         <img
                                            src={course.thumbnail}
                                            alt={`${course.title} thumbnail`}
                                            className="course-card-thumbnail"
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/300x170/cccccc/ffffff?text=Image+Error"; }}
                                        />
                                        <div className="course-list-card-content">
                                            <h3 className="course-list-card-title">{course.title || 'Untitled Course'}</h3>
                                            <p className="course-instructor">
                                                <FaChalkboardTeacher className="instructor-icon" />
                                                {findInstructorName(course.instructorId)}
                                            </p>
                                            <p className="course-description">
                                                {/* Ensure description is a string */}
                                                {typeof course.description === 'string' ? course.description : ''}
                                            </p>
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))
                    ) : ( null )}
                </AnimatePresence>
            </div>

             {/* "No results" Message */}
             {filteredCourses.length === 0 && allCoursesFromRedux.length > 0 && (
                 <motion.p className="no-results-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     No courses found matching your criteria.
                </motion.p>
             )}
             {filteredCourses.length === 0 && allCoursesFromRedux.length === 0 && (
                  <motion.p className="no-results-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     There are currently no courses available.
                </motion.p>
             )}

            {/* Load More Button Area */}
            {filteredCourses.length > visibleCount && (
                 <div className="load-more-container">
                    <Button
                        variant="secondary"
                        className="load-more-button"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                    >
                         {isLoadingMore ? (
                            <> <Spinner size="small" label="Loading..." /> </>
                         ) : (
                             <> <span>Load More Courses</span> <FaAngleDown /> </>
                         )}
                     </Button>
                     <p className='item-count-status'>
                        Showing {displayedCourses.length} of {filteredCourses.length} courses
                    </p>
                 </div>
             )}
             {/* End Load More Button Area */}

        </div>
    );
};

export default CourseListPage;