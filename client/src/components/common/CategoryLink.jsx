// src/components/categories/CategoryLink.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// --- Import Icons (Import all icons potentially used by categories) ---
import {
    FaLaptopCode, FaServer, FaPalette, FaCode, FaDatabase, FaCloudUploadAlt, FaTag // Add others if needed
} from "react-icons/fa";

// --- Mapping for Category Icons ---
// Maps the string name stored in category.icon to the actual icon component
const categoryIconMap = {
    FaLaptopCode: <FaLaptopCode />,
    FaServer: <FaServer />,
    FaPalette: <FaPalette />,
    FaCode: <FaCode />,
    FaDatabase: <FaDatabase />,
    FaCloudUploadAlt: <FaCloudUploadAlt />,
    // Add other icons you might use here
    Default: <FaTag /> // Fallback icon
};

const CategoryLink = ({ category }) => {
    // Ensure category and necessary fields exist
    if (!category || !category.id || !category.slug || !category.name) {
        console.warn("CategoryLink: Received incomplete category data", category);
        return null; // Don't render if essential data is missing
    }

    // Get the icon component based on the name, use default if not found
    const IconComponent = categoryIconMap[category.icon] || categoryIconMap.Default;

    return (
        <Link
            to={`/courses?category=${category.slug}`}
            key={category.id}
            className="category-item-link" // Matches class used in HomePage.jsx example
            aria-label={`View courses in category: ${category.name}`}
        >
             {/* Matches class used in HomePage.jsx example */}
            <div className="category-item hover-effect">
                 <div className="category-icon" aria-hidden="true">{IconComponent}</div>
                 <h4 className="category-name">{category.name}</h4>
             </div>
         </Link>
    );
};

CategoryLink.propTypes = {
    category: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        slug: PropTypes.string.isRequired,
        icon: PropTypes.string, // Icon name as string
    }).isRequired,
};

export default CategoryLink;