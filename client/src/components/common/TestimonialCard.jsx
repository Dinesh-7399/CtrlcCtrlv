// src/components/testimonials/TestimonialCard.jsx
import React from 'react';
import PropTypes from 'prop-types';

// --- Import Icons ---
import { FaQuoteLeft } from "react-icons/fa";

const TestimonialCard = ({ testimonial }) => {
    // Ensure testimonial and necessary fields exist
     if (!testimonial || !testimonial.id || !testimonial.quote || !testimonial.author) {
        console.warn("TestimonialCard: Received incomplete testimonial data", testimonial);
        return null; // Don't render if essential data is missing
    }

    const authorTitle = testimonial.title || 'Student'; // Fallback title

    return (
        // Class matches the one used in HomePage.jsx loop example
        <div className="testimonial-card-loop-item">
            <FaQuoteLeft className="testimonial-quote-icon" aria-hidden="true" />
            <blockquote className="testimonial-quote">{testimonial.quote}</blockquote>
            <cite className="testimonial-author">
                - {testimonial.author}, <span>{authorTitle}</span>
            </cite>
        </div>
    );
};

TestimonialCard.propTypes = {
     testimonial: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        quote: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        title: PropTypes.string, // Optional title/position
    }).isRequired,
};

export default TestimonialCard;