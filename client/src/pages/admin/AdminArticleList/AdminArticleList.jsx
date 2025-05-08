// src/pages/admin/AdminArticleList/AdminArticleList.jsx
import React, { useEffect } from 'react'; // Added useEffect
import { useSelector, useDispatch } from 'react-redux'; // Added useDispatch
import { Link } from 'react-router-dom';

// Common Components
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';

// Redux Actions & Selectors
import {
    selectAllArticles,
    selectArticlesStatus, // Import status selector
    selectArticlesError,  // Import error selector
    fetchArticles,        // Import fetch action
    articleUpdated,       // Import update action (for status toggle)
    removeArticle         // Import delete action
} from '../../../features/articles/articlesSlice.js';

// Icons
import { FaEdit, FaTrashAlt, FaToggleOn, FaToggleOff, FaPlus, FaExclamationTriangle } from 'react-icons/fa';

// CSS
import './AdminArticleList.css'; // Ensure styles exist

const AdminArticleList = () => {
    const dispatch = useDispatch();

    // Get data and status from Redux store
    const articles = useSelector(selectAllArticles) || []; // Ensure it's an array
    const articlesStatus = useSelector(selectArticlesStatus);
    const articlesError = useSelector(selectArticlesError);

    // --- Effect to Fetch Data on Mount if Idle ---
    useEffect(() => {
        if (articlesStatus === 'idle') {
            console.log("AdminArticleList: Dispatching fetchArticles...");
            dispatch(fetchArticles());
        }
    }, [articlesStatus, dispatch]);

    // --- Action Handlers ---
    const handlePublishToggle = (articleId, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        console.log(`Dispatching articleUpdated: _id=${articleId}, changes={ status: ${newStatus} }`);
        // Dispatch the actual update action
        dispatch(articleUpdated({ _id: articleId, changes: { status: newStatus } }));
    };

    const handleDeleteArticle = (articleId, articleTitle) => {
         if (window.confirm(`Are you sure you want to delete the article "${articleTitle || 'Untitled Article'}"?`)) {
            console.log(`Dispatching deleteArticle: _id=${articleId}`);
            // Dispatch the actual delete action
            dispatch(removeArticle(articleId));
        }
    };
    // --- End Action Handlers ---

    // --- Render Logic ---

    // 1. Loading State
    if (articlesStatus === 'loading') {
        return (
            <div className="admin-page-container admin-centered-container">
                <Spinner label="Loading articles..." />
            </div>
        );
    }

    // 2. Error State
    if (articlesStatus === 'failed') {
        return (
            <div className="admin-page-container admin-centered-container admin-error-container">
                 <FaExclamationTriangle size={30} className="error-icon"/>
                 <h2 className="error-title">Error Loading Articles</h2>
                 <p className="error-message">{articlesError || 'An unknown error occurred.'}</p>
                 <Button onClick={() => dispatch(fetchArticles())} variant="secondary" className="retry-button">
                    Retry
                 </Button>
            </div>
        );
    }

    // 3. Success State (Table or Empty Message)
    return (
        <div className="admin-page-container">
            {/* Header */}
            <div className="admin-page-header">
                <h1 className="admin-page-title">Manage Articles</h1>
                <Link to="/admin/articles/new"> {/* Ensure this route exists */}
                    <Button variant="primary" size="medium">
                        <FaPlus className="button-icon" aria-hidden="true" /> Add New Article
                    </Button>
                </Link>
            </div>

            {/* Content: Table or Empty Message */}
            {articles.length > 0 ? (
                <div className="admin-table-container">
                    {/* Reuse admin-table styles from AdminCourseList.css or define specific ones */}
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th className="col-thumbnail">Image</th>
                                <th className="col-title">Title</th>
                                <th className="col-slug">Slug</th>
                                <th className="col-author">Author</th>
                                <th className="col-date">Published Date</th>
                                <th className="col-status">Status</th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {articles.map((article) => (
                                article && article._id ? ( // Render row only if valid article
                                <tr key={article._id}>
                                    {/* Thumbnail */}
                                    <td data-label="Image" className="cell-thumbnail">
                                        <div className="thumbnail-wrapper">
                                            <img
                                                // Use article.imageUrl, ensure it exists in your data
                                                src={article.imageUrl || 'https://via.placeholder.com/80x45/cccccc/ffffff?text=N/A'}
                                                alt={`${article.title || 'Article'} thumbnail`}
                                                className="admin-table-thumbnail"
                                                onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                                             />
                                         </div>
                                    </td>
                                    {/* Text Content */}
                                    <td data-label="Title">{article.title || '-'}</td>
                                    <td data-label="Slug">{article.slug || '-'}</td>
                                    <td data-label="Author">{article.author || '-'}</td>
                                    <td data-label="Published Date">
                                        {article.publishDate
                                            ? new Date(article.publishDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                                            : '-'
                                        }
                                    </td>
                                    {/* Status */}
                                    <td data-label="Status" className="cell-status">
                                        <span className={`status-badge status-${article.status || 'draft'}`}>
                                            {(article.status === 'published') ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td data-label="Actions" className="cell-actions">
                                        <div className="action-buttons">
                                            {/* Publish/Unpublish Toggle */}
                                            <Button
                                                variant="icon"
                                                className={`status-toggle-btn ${article.status === 'published' ? 'published' : 'draft'}`}
                                                onClick={() => handlePublishToggle(article._id, article.status)}
                                                title={article.status === 'published' ? 'Click to Unpublish' : 'Click to Publish'}
                                                aria-label={article.status === 'published' ? `Unpublish ${article.title || 'article'}` : `Publish ${article.title || 'article'}`}
                                            >
                                                {article.status === 'published' ? <FaToggleOn /> : <FaToggleOff />}
                                            </Button>
                                            {/* Edit Link/Button */}
                                            <Link to={`/admin/articles/edit/${article._id}`} className="action-button-link">
                                                <Button variant="icon" size="small" title="Edit Article" aria-label={`Edit ${article.title || 'article'}`}>
                                                    <FaEdit />
                                                </Button>
                                            </Link>
                                            {/* Delete Button */}
                                            <Button
                                                variant="icon"
                                                color="danger"
                                                size="small"
                                                onClick={() => handleDeleteArticle(article._id, article.title)}
                                                title="Delete Article"
                                                aria-label={`Delete ${article.title || 'article'}`}
                                                className="delete-btn"
                                            >
                                                <FaTrashAlt />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                                ) : null
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                 // Show empty message only if fetch succeeded and length is 0
                articlesStatus === 'succeeded' && <p className="admin-empty-message">No articles found. Add your first article!</p>
            )}
        </div>
    );
};

export default AdminArticleList;