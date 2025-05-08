// client/src/components/common/SkeletonLoader.jsx
import React from 'react';
import PropTypes from 'prop-types'; // Optional: For prop type validation
import './SkeletonLoader.css'; // Import the CSS for styling

const SkeletonLoader = ({ type = 'textLine', count = 1, className = '' }) => {

    // Base classes for all skeleton elements
    const baseClass = 'skeleton';

    // --- Define different skeleton structures based on 'type' ---

    const renderTextLines = (numLines) => (
        Array.from({ length: numLines }).map((_, index) => (
            <div key={index} className={`${baseClass} skeleton-text`} style={{ width: index === numLines - 1 ? '70%' : '100%' }}></div>
            // Last line is often shorter
        ))
    );

    const renderCourseCard = () => (
        <div className={`skeleton-container skeleton-course-card ${className}`}>
            <div className={`${baseClass} skeleton-thumbnail`}></div>
            <div className={`${baseClass} skeleton-title`}></div>
            <div className={`${baseClass} skeleton-text short`}></div>
        </div>
    );

    const renderArticlePreview = () => (
        <div className={`skeleton-container skeleton-article-preview ${className}`}>
            <div className={`${baseClass} skeleton-title medium`}></div>
            {renderTextLines(3)}
            <div className={`${baseClass} skeleton-text short link`}></div>
        </div>
    );

    const renderListItem = () => (
         <div className={`skeleton-container skeleton-list-item ${className}`}>
             <div className={`${baseClass} skeleton-avatar`}></div>
             <div className="skeleton-list-item-content">
                 <div className={`${baseClass} skeleton-title short`}></div>
                 <div className={`${baseClass} skeleton-text`}></div>
             </div>
         </div>
    );

    // --- Select the structure to render ---

    let content;
    switch (type) {
        case 'courseCard':
            content = renderCourseCard();
            break;
        case 'articlePreview':
            content = renderArticlePreview();
            break;
         case 'listItem':
            content = renderListItem();
            break;
        case 'avatar':
             content = <div className={`${baseClass} skeleton-avatar ${className}`}></div>;
             break;
        case 'title':
             content = <div className={`${baseClass} skeleton-title ${className}`}></div>;
             break;
        case 'textLine':
        default:
            // Render multiple lines if count > 1
            content = (
                <div className={`skeleton-container ${className}`}>
                    {renderTextLines(count)}
                </div>
            );
            break;
    }

    return content;
};

// Optional: Add PropTypes for better development experience
SkeletonLoader.propTypes = {
    type: PropTypes.oneOf([
        'textLine',
        'courseCard',
        'articlePreview',
        'listItem',
        'avatar',
        'title'
        // Add more types as needed
    ]),
    count: PropTypes.number, // Primarily for 'textLine' type
    className: PropTypes.string,
};

export default SkeletonLoader;