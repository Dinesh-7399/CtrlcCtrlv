// src/components/learning/CourseSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBookOpen, FaPlayCircle, FaFileAlt, FaClipboardCheck, FaQuestionCircle,
    FaAngleDown, FaCheckCircle, FaCircle // Icons for lesson types/status
} from 'react-icons/fa';

// Helper to get lesson icon based on type (customize as needed)
const getLessonIcon = (type) => {
    switch (type?.toLowerCase()) {
        case 'video': return <FaPlayCircle />;
        case 'text': case 'article': return <FaFileAlt />;
        case 'quiz': return <FaQuestionCircle />;
        case 'dpp': return <FaClipboardCheck />; // Example
        default: return <FaPlayCircle />; // Default icon
    }
};

const CourseSidebar = ({ courseId, courseTitle, modules, currentLessonId, closeNav }) => {
    // --- Accordion State ---
    const findDefaultOpenModule = () => {
        if (!modules || modules.length === 0) return null;
        const moduleContainingCurrentLesson = modules.find(m => m.lessons?.some(l => l.id === currentLessonId));
        return moduleContainingCurrentLesson?.id || modules[0]?.id || null;
    };
    const [openModuleId, setOpenModuleId] = useState(findDefaultOpenModule());

    // Update open module if currentLessonId changes
    useEffect(() => {
        setOpenModuleId(findDefaultOpenModule());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLessonId, modules]);

    // --- NavLink Active Class ---
    const getLessonLinkClass = ({ isActive }) => {
        return isActive ? 'sidebar-lesson-link active' : 'sidebar-lesson-link';
    };

    // --- Animation Variants for Lesson List ---
    const listVariants = {
        hidden: { height: 0, opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
        visible: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: 'easeInOut', staggerChildren: 0.03 } }, // Add stagger
        exit: { height: 0, opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
    };
     const itemVariants = { // For staggering list items
        hidden: { opacity: 0, y: -5 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0 }
     };


    return (
        <>
            {/* Sidebar Header (Title + Optional Close Button) */}
            <div className="learning-sidebar-header">
                 <Link to={`/courses/${courseId}`} className="sidebar-course-title-link" onClick={closeNav}>
                    <h2 className="sidebar-course-title">
                        <FaBookOpen className="sidebar-title-icon"/>
                        <span className="sidebar-course-title-text">{courseTitle || 'Course'}</span>
                    </h2>
                </Link>
                 {/* Close button is rendered via parent but could be passed as prop */}
                 {/* <button className="sidebar-close-btn" onClick={closeNav} aria-label="Close menu"><FaTimes /></button> */}
            </div>

            {/* Navigation with Accordion */}
            <nav className="sidebar-nav">
                {(modules || []).map((module, index) => {
                    const isOpen = module.id === openModuleId;
                    return (
                        <div key={module.id || `mod-${index}`} className={`sidebar-module ${isOpen ? 'is-open' : ''}`}>
                            {/* Module Toggle Button */}
                            <button
                                className="sidebar-module-title-button"
                                onClick={() => setOpenModuleId(isOpen ? null : module.id)}
                                aria-expanded={isOpen}
                                aria-controls={`module-content-${module.id}`}
                            >
                                <span className="module-title-text">
                                    Module {index + 1}: {module.title || 'Untitled Module'}
                                </span>
                                <FaAngleDown className="module-toggle-icon" />
                            </button>

                            {/* Animated Lesson List */}
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.ul
                                        className="sidebar-lesson-list"
                                        id={`module-content-${module.id}`}
                                        key="lesson-list-content" // Ensure key is stable but unique if needed
                                        variants={listVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden" // Use hidden variant for exit
                                        style={{ overflow: 'hidden' }} // Important for height animation
                                    >
                                        {(module.lessons && module.lessons.length > 0) ? module.lessons.map(lesson => {
                                            // Placeholder for completion status - replace with real logic later
                                            const isCompleted = false; // Example: replace with check from user progress state
                                            return (
                                                <motion.li key={lesson.id} variants={itemVariants}>
                                                    <NavLink
                                                        to={`/learn/${courseId}/${lesson.id}`}
                                                        className={getLessonLinkClass}
                                                        onClick={closeNav} // Close drawer on click (only has effect if passed)
                                                        title={lesson.title || 'Untitled Lesson'}
                                                    >
                                                         <span className="lesson-icon-wrapper">
                                                             {isCompleted ?
                                                                <FaCheckCircle className="lesson-status-icon completed" /> :
                                                                getLessonIcon(lesson.type) // Icon based on type
                                                             }
                                                         </span>
                                                         <span className="lesson-title-text">{lesson.title || 'Untitled Lesson'}</span>
                                                         {/* Optional: Show duration */}
                                                         {/* {lesson.duration && <span className="lesson-duration">{lesson.duration}</span>} */}
                                                    </NavLink>
                                                </motion.li>
                                            );
                                        }) : <motion.li className="sidebar-no-lessons" variants={itemVariants}>No lessons in this module.</motion.li>}
                                    </motion.ul>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
                 {(!modules || modules.length === 0) && (
                     <p className="sidebar-no-lessons">No modules found for this course.</p>
                 )}
            </nav>
        </>
    );
};

CourseSidebar.propTypes = {
    courseId: PropTypes.string.isRequired,
    courseTitle: PropTypes.string,
    modules: PropTypes.array,
    currentLessonId: PropTypes.string,
    closeNav: PropTypes.func.isRequired,
};

export default CourseSidebar; // Export for use in LearningPage