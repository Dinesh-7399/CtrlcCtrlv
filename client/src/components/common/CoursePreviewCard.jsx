// client/src/components/common/CoursePreviewCard.jsx
// OR client/src/components/courses/CoursePreviewCard.jsx (Adjust path as needed)

import React from 'react';
import PropTypes from 'prop-types'; // Good practice for defining expected props
import { Link } from 'react-router-dom';
import Card from './Card'; // Assuming Card is in the same 'common' folder, adjust path if needed
import { FaChalkboardTeacher } from "react-icons/fa"; // Make sure to import used icons
import image from '../../assets/images/generic-broken-image.png'; // Adjust path as needed
// Define the component as a function that accepts props
const CoursePreviewCard = (props) => {
    // Destructure the course object from props
    const { course } = props;

    // Add a basic check for essential course data
    if (!course || !course.id || !course.title) {
        console.warn("CoursePreviewCard received incomplete/invalid course data:", course);
        return null; // Render nothing if essential data is missing
    }

    // This logic is now correctly inside the function
    const instructorName = course?.instructorName || 'Expert Instructor'; // Use fallback

    // This return statement is now correctly inside the function
    return (
        <Link to={`/courses/${course.id}`} className="course-card-link">
            <Card className="course-list-card hover-effect">
                <img
                    src={course.thumbnail || ""}
                    alt={`${course.title} thumbnail`}
                    className="course-card-thumbnail"
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src=""; }}
                />
                <div className="course-list-card-content">
                    <h3 className="course-list-card-title">{course.title}</h3>
                    <p className="course-instructor">
                        <FaChalkboardTeacher className="instructor-icon" aria-hidden="true"/>
                        {instructorName}
                    </p>
                </div>
            </Card>
        </Link>
    );
}; // <-- Make sure the function closing brace is present

// Define PropTypes for the component (good practice)
CoursePreviewCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    thumbnail: PropTypes.string,
    instructorName: PropTypes.string // Optional instructor name from data
    // Add other expected course properties here if needed
  }).isRequired // Mark the course prop itself as required
};

// Export the component so it can be imported elsewhere
export default CoursePreviewCard;