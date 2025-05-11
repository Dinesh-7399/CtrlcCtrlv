// client/src/pages/HomePage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// --- Import Common Components ---
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import AnimatedNumber from '../../components/common/AnimatedNumber';
import Spinner from '../../components/common/Spinner';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import CoursePreviewCard from '../../components/common/CoursePreviewCard.jsx';
import ArticlePreview from '../../components/common/ArticlePreview.jsx';
import CategoryLink from '../../components/common/CategoryLink';
import TestimonialCard from '../../components/common/TestimonialCard';

// --- Import Icons ---
import {
  FaLaptopCode, FaUsers, FaCheckCircle, FaArrowRight, FaUserPlus,
  FaChalkboardTeacher, FaQuoteLeft, FaTag, FaChartBar, FaSearch,
  FaNewspaper, FaServer, FaPalette, FaCode, FaDatabase, FaCloudUploadAlt,
  FaExclamationTriangle, FaInfoCircle
} from "react-icons/fa";

// --- Import Redux Selectors & Actions ---
import {
    selectAllCourses , selectCoursesStatus, selectCoursesError, fetchCourses
} from '../../features/courses/CoursesSlice.js';
import {
    selectAllArticles, selectArticlesStatus, selectArticlesError, fetchArticles
} from '../../features/articles/articlesSlice.js';
import {
    selectAllTestimonials, selectTestimonialsStatus, selectTestimonialsError, fetchVisibleTestimonials
} from '../../features/testimonials/testimonialsSlice.js';
import {
    selectAllCategories, // Assuming this selector is correctly named in your slice
    selectCategoriesStatus,
    selectCategoriesError,
    fetchAllCategories as fetchCategories // Correctly import and alias fetchAllCategories
} from '../../features/categories/categoriesSlice.js';
import {
    fetchPublicStats,
    selectPlatformStats,
    selectPlatformStatsStatus
    // selectPlatformStatsError // Can be used if specific error display is needed for stats
} from '../../features/platform/platformSlice.js'; // Assuming you created this slice

import './HomePage.css';

// --- Constants ---
const NUM_FEATURED_ITEMS = 3;
const STATS_ANIMATION_DURATION = 1500;

// --- Helper Components Definitions ---
const LoadingErrorPlaceholder = ({ status, error, loadingComponent, errorComponent, children }) => {
     if (status === 'succeeded') return children;
     if (status === 'loading' || status === 'idle') return loadingComponent;
     if (status === 'failed') { console.error("Data loading error in section:", error); return errorComponent; }
     return null;
};
const SectionLoadingSpinner = () => <div className="section-loading"><Spinner /></div>;
const SectionErrorDisplay = ({ message = "Could not load data." }) => (
    <div className="section-error"><FaExclamationTriangle aria-hidden="true" /> {message}</div>
);
const EmptyStateDisplay = ({ message }) => (
    <div className="section-empty"><FaInfoCircle aria-hidden="true" /> {message}</div>
);
// --- End Helper Components ---

const HomePage = () => {
    const dispatch = useDispatch();

    // --- Get Data & Status From Redux Store ---
    const courses = useSelector(selectAllCourses);
    const coursesStatus = useSelector(selectCoursesStatus);
    const coursesError = useSelector(selectCoursesError);

    const articles = useSelector(selectAllArticles);
    const articlesStatus = useSelector(selectArticlesStatus);
    const articlesError = useSelector(selectArticlesError);

    const testimonials = useSelector(selectAllTestimonials);
    const testimonialsStatus = useSelector(selectTestimonialsStatus);
    const testimonialsError = useSelector(selectTestimonialsError);

    const categories = useSelector(selectAllCategories); // Make sure this selector name is correct in categoriesSlice.js
    const categoriesStatus = useSelector(selectCategoriesStatus);
    const categoriesError = useSelector(selectCategoriesError);

    const platformStats = useSelector(selectPlatformStats);
    const platformStatsStatus = useSelector(selectPlatformStatsStatus);

    // --- Trigger Data Fetching ---
    useEffect(() => {
        if (coursesStatus === 'idle') dispatch(fetchCourses({ limit: NUM_FEATURED_ITEMS, featured: true })); // Example: add a featured param
        if (articlesStatus === 'idle') dispatch(fetchArticles({ limit: NUM_FEATURED_ITEMS, sortBy: 'publishedAt_desc' }));
        if (categoriesStatus === 'idle') dispatch(fetchCategories({ limit: 6 })); // Dispatch corrected thunk name
        if (testimonialsStatus === 'idle') dispatch(fetchVisibleTestimonials({ limit: 10 }));
        if (platformStatsStatus === 'idle') dispatch(fetchPublicStats());
    }, [dispatch, coursesStatus, articlesStatus, categoriesStatus, testimonialsStatus, platformStatsStatus]);

    // --- Process Data for Display ---
    const featuredCourses = coursesStatus === 'succeeded' ? (courses || []).slice(0, NUM_FEATURED_ITEMS) : [];
    const featuredArticles = articlesStatus === 'succeeded' ? (articles || []).slice(0, NUM_FEATURED_ITEMS) : [];
    const displayCategories = categoriesStatus === 'succeeded' ? (categories || []) : [];
    const displayTestimonials = testimonialsStatus === 'succeeded' ? (testimonials || []) : [];

    // --- Use dynamic stats from Redux store ---
    const totalCourseCount = platformStatsStatus === 'succeeded' && platformStats.totalCourses !== undefined ? platformStats.totalCourses : (coursesStatus === 'succeeded' ? (courses || []).length : 0);
    const totalUserCount = platformStatsStatus === 'succeeded' && platformStats.totalUsers !== undefined ? platformStats.totalUsers : 0;
    const totalInstructorCount = platformStatsStatus === 'succeeded' && platformStats.totalInstructors !== undefined ? platformStats.totalInstructors : 0;
    const totalCategoryCount = platformStatsStatus === 'succeeded' && platformStats.totalCategories !== undefined ? platformStats.totalCategories : (categoriesStatus === 'succeeded' ? (categories || []).length : 0);

    return (
        <div className="homepage-container page-container">
            <section className="hero-section">
                 <div className="hero-content">
                     <h1 className="hero-headline">Unlock Your Potential with LMS Platform</h1>
                     <p className="hero-subheadline">Access high-quality courses taught by industry experts. Learn at your own pace, anytime, anywhere.</p>
                     <div className="hero-cta-buttons">
                         <Link to="/courses"><Button variant="primary" size="large">Browse Courses <FaArrowRight className="button-icon-right" /></Button></Link>
                         <Link to="/register"><Button variant="outline" size="large">Sign Up Now</Button></Link>
                     </div>
                 </div>
                 <div className="hero-image-placeholder">
                     <img src="https://tse3.mm.bing.net/th?id=OIG3.Mw97g.1U7jaW5gcMc6r_&pid=ImgGn" alt="Online learning platform illustration"/>
                 </div>
            </section>

             <section className="features-section" id="features">
                 <h2 className="section-heading">Why Choose Us?</h2>
                 <div className="features-grid">
                     <div className="feature-item"><FaLaptopCode className="feature-icon" /> <h3 className="feature-title">Expert-Led Courses</h3> <p className="feature-description">Learn from industry professionals with real-world experience.</p> </div>
                     <div className="feature-item"><FaUsers className="feature-icon" /> <h3 className="feature-title">Flexible Learning</h3> <p className="feature-description">Access courses on your schedule, from any device.</p> </div>
                     <div className="feature-item"><FaCheckCircle className="feature-icon" /> <h3 className="feature-title">Track Your Progress</h3> <p className="feature-description">Interactive quizzes and progress tracking to keep you motivated.</p> </div>
                 </div>
             </section>

             <section className="how-it-works-section">
                 <h2 className="section-heading">Start Learning in 3 Easy Steps</h2>
                 <div className="how-it-works-steps">
                     <div className="step-item"><div className="step-icon-wrapper"><FaUserPlus /></div> <h3 className="step-title">1. Sign Up</h3> <p className="step-description">Create your free account in seconds.</p> </div>
                     <div className="step-item"><div className="step-icon-wrapper"><FaSearch /></div> <h3 className="step-title">2. Choose Course</h3> <p className="step-description">Browse our catalog and enroll in courses.</p> </div>
                     <div className="step-item"><div className="step-icon-wrapper"><FaLaptopCode /></div> <h3 className="step-title">3. Start Learning</h3> <p className="step-description">Learn online, complete quizzes, and track progress.</p> </div>
                 </div>
             </section>

            <section className="categories-section">
                <h2 className="section-heading">Explore Popular Categories</h2>
                <LoadingErrorPlaceholder
                    status={categoriesStatus} // Use the status from categoriesSlice
                    error={categoriesError}
                    loadingComponent={
                        <div className="categories-grid">
                            {[...Array(6)].map((_, i) => <SkeletonLoader key={i} type="listItem" />)}
                        </div>
                    }
                    errorComponent={<SectionErrorDisplay message="Could not load categories." />}
                >
                    {displayCategories.length > 0 ? (
                        <div className="categories-grid">
                            {displayCategories.map((category) => (
                                <CategoryLink category={category} key={category.id || category.name} /> // Ensure key is unique
                            ))}
                        </div>
                    ) : (
                        <EmptyStateDisplay message="No categories found." />
                    )}
                </LoadingErrorPlaceholder>
            </section>

            <section className="featured-courses-section">
                <h2 className="section-heading">Featured Courses</h2>
                 <LoadingErrorPlaceholder
                    status={coursesStatus} // Use status from coursesSlice
                    error={coursesError}
                    loadingComponent={
                        <div className="courses-grid">
                            {[...Array(NUM_FEATURED_ITEMS)].map((_, i) => <SkeletonLoader key={i} type="courseCard" />)}
                        </div>
                    }
                    errorComponent={<SectionErrorDisplay message="Could not load featured courses." />}
                >
                    {featuredCourses.length > 0 ? (
                        <div className="courses-grid">
                            {featuredCourses.map((course) => (
                               <CoursePreviewCard course={course} key={course.id} />
                            ))}
                        </div>
                     ) : (
                        <EmptyStateDisplay message="No featured courses available yet." />
                    )}
               </LoadingErrorPlaceholder>
                { (coursesStatus === 'succeeded' && (courses && courses.length > NUM_FEATURED_ITEMS)) && (
                 <div className="view-all-courses-link">
                    <Link to="/courses"><Button variant="secondary">View All Courses</Button></Link>
                </div>
               )}
            </section>

             <section className="free-articles-section">
                 <FaNewspaper className="section-icon" />
                 <h2 className="section-heading">Free Premium Tech Articles</h2>
                 <p className="section-subheading">Stay updated with the latest trends, tutorials, and insights.</p>
                <LoadingErrorPlaceholder
                    status={articlesStatus} // Use status from articlesSlice
                    error={articlesError}
                    loadingComponent={
                         <div className="articles-preview-grid">
                             {[...Array(NUM_FEATURED_ITEMS)].map((_, i) => <SkeletonLoader key={i} type="articlePreview" />)}
                         </div>
                    }
                    errorComponent={<SectionErrorDisplay message="Could not load articles." />}
                >
                    {featuredArticles.length > 0 ? (
                        <div className="articles-preview-grid">
                            {featuredArticles.map((article) => (
                                <ArticlePreview article={article} key={article._id || article.id} /> // Ensure key is unique
                             ))}
                        </div>
                     ) : (
                         <EmptyStateDisplay message="No articles available at the moment." />
                    )}
                </LoadingErrorPlaceholder>
                 {(articlesStatus === 'succeeded' && (articles && articles.length > NUM_FEATURED_ITEMS)) && (
                     <div className="view-all-articles-link">
                         <Link to="/articles"><Button variant="secondary">Explore All Articles</Button></Link>
                     </div>
                 )}
             </section>

            <section className="stats-section">
                 <div className="stats-grid">
                     <div className="stat-item">
                         <FaLaptopCode className="stat-icon" />
                         <AnimatedNumber targetValue={totalCourseCount} duration={STATS_ANIMATION_DURATION} />
                         <span className="stat-label">Courses</span>
                     </div>
                     <div className="stat-item">
                         <FaUsers className="stat-icon" />
                         <AnimatedNumber targetValue={totalUserCount} duration={STATS_ANIMATION_DURATION} />
                         <span className="stat-label">Students</span>
                     </div>
                     <div className="stat-item">
                         <FaChalkboardTeacher className="stat-icon" />
                         <AnimatedNumber targetValue={totalInstructorCount} duration={STATS_ANIMATION_DURATION} />
                         <span className="stat-label">Instructors</span>
                     </div>
                     <div className="stat-item">
                          <FaTag className="stat-icon" />
                         <AnimatedNumber targetValue={totalCategoryCount} duration={STATS_ANIMATION_DURATION} />
                         <span className="stat-label">Categories</span>
                     </div>
                 </div>
             </section>

            <section className="testimonials-section">
                <h2 className="section-heading">What Our Students Say</h2>
                 <LoadingErrorPlaceholder
                    status={testimonialsStatus} // Use status from testimonialsSlice
                    error={testimonialsError}
                    loadingComponent={<SectionLoadingSpinner />}
                    errorComponent={<SectionErrorDisplay message="Could not load testimonials." />}
                >
                    {displayTestimonials.length > 0 ? (
                        <div className="testimonials-loop-container">
                             <div className="testimonials-loop-track">
                                 {/* Duplicate for looping animation */}
                                 {[...displayTestimonials, ...displayTestimonials].map((testimonial, index) => (
                                     <TestimonialCard testimonial={testimonial} key={`${testimonial.id || index}-${index}`} /> // Ensure key is unique
                                 ))}
                             </div>
                         </div>
                     ) : (
                         <EmptyStateDisplay message="No testimonials yet. Be the first to share your experience!" />
                     )}
                </LoadingErrorPlaceholder>
            </section>

            <section className="final-cta-section">
                <h2 className="section-heading">Ready to Start Learning?</h2>
                <p>Join thousands of learners and take the next step.</p>
                <Link to="/register"><Button variant="primary" size="large">Get Started Today</Button></Link>
            </section>
        </div>
    );
};

export default HomePage;