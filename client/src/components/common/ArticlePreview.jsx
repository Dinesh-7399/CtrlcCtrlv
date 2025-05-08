// src/components/articles/ArticlePreview.jsx (or adjust path)

import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa"; // Keep this import

// Define the component as a function accepting props
const ArticlePreview = (props) => {
    // Destructure the article object from props
    const { article } = props;

    // Add basic validation for required article properties
    // Adjust required fields (_id vs id, excerpt/content) based on your actual data
    if (!article || !article.title || !article.slug || (!article.excerpt && !article.content) || (!article._id && !article.id) ) {
         console.warn("ArticlePreview received incomplete/invalid article data:", article);
         return null; // Don't render if essential data is missing
    }

    // This return statement is now correctly inside the function
    return (
        // Use article._id or article.id for the key in the parent map, but don't need it here necessarily
        <div className="article-preview-item">
            <h4 className="article-preview-title">{article.title}</h4>
            <p className="article-preview-excerpt">
                {/* Use excerpt or fallback to content substring */}
                {article.excerpt || `${article.content?.substring(0, 100)}...`}
            </p>
            <Link to={`/articles/${article.slug}`} className="article-preview-link hover-effect">
                Read Article <FaArrowRight aria-hidden="true" />
            </Link>
        </div>
    );
}; // <-- Make sure the function closing brace is present

// Define PropTypes (adjust based on whether you use _id or id)
ArticlePreview.propTypes = {
    article: PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // If using MongoDB style ID
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Or if using simple ID
        title: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        excerpt: PropTypes.string,
        content: PropTypes.string // Required if excerpt might be missing
    }).isRequired,
};

// Export the component
export default ArticlePreview;