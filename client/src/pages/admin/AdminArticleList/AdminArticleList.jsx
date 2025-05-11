// client/src/pages/admin/AdminArticleList/AdminArticleList.jsx
import React, { useEffect, useState } from 'react'; // Added useState for local UI state like pagination
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';

import {
  fetchAdminArticlesList,
  updateAdminArticle, // Used for status toggle
  deleteAdminArticle,
  selectAdminArticlesList,
  selectAdminArticlesListStatus,
  selectAdminArticlesListError,
  selectAdminArticlesListPagination,
  clearAdminArticleListError, // To clear errors manually if needed
} from '../../../features/admin/adminArticlesSlice.js'; // Adjust path

import { FaEdit, FaTrashAlt, FaToggleOn, FaToggleOff, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import './AdminArticleList.css'; // Your custom CSS file

const AdminArticleList = () => {
  const dispatch = useDispatch();

  const articles = useSelector(selectAdminArticlesList) || [];
  const listStatus = useSelector(selectAdminArticlesListStatus);
  const listError = useSelector(selectAdminArticlesListError);
  const pagination = useSelector(selectAdminArticlesListPagination);

  // Local state for filters and current page (can be synced with URL params too)
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
      searchTerm: '',
      status: '', // 'DRAFT', 'PUBLISHED', 'ARCHIVED', or '' for all
      // Add other filters like categoryId, authorId if needed
  });

  const ARTICLES_PER_PAGE = 10; // Or get from pagination.limit if backend controls it

  useEffect(() => {
    // Fetch articles when component mounts or when currentPage/filters change
    const params = {
        page: currentPage,
        limit: ARTICLES_PER_PAGE,
        ...filters, // Spread active filters
    };
    // Remove empty filter values
    Object.keys(params).forEach(key => (params[key] === '' || params[key] === null || params[key] === undefined) && delete params[key]);

    dispatch(fetchAdminArticlesList(params));

    // Clear any previous errors when re-fetching or changing filters
    return () => {
        dispatch(clearAdminArticleListError());
    };
  }, [dispatch, currentPage, filters]);

  const handlePublishToggle = (articleId, currentDbStatus) => {
    // Determine the new status based on the backend's enum values
    const newStatus = currentDbStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    dispatch(updateAdminArticle({ articleId, articleData: { status: newStatus } }))
      .unwrap()
      .catch(err => console.error("Failed to toggle publish status:", err)); // Error already handled in slice
  };

  const handleDeleteArticle = (articleId, articleTitle) => {
    if (window.confirm(`Are you sure you want to delete the article "${articleTitle || 'Untitled Article'}"?`)) {
      dispatch(deleteAdminArticle(articleId))
        .unwrap()
        .catch(err => console.error("Failed to delete article:", err)); // Error already handled in slice
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
        setCurrentPage(newPage);
    }
  };


  if (listStatus === 'loading' && articles.length === 0) { // Show full page loader only on initial load
    return (
      <div className="admin-page-container admin-centered-container">
        <Spinner label="Loading articles..." />
      </div>
    );
  }

  if (listStatus === 'failed' && articles.length === 0) { // Show full page error only if no data at all
    return (
      <div className="admin-page-container admin-centered-container admin-error-container">
        <FaExclamationTriangle size={30} className="error-icon"/>
        <h2 className="error-title">Error Loading Articles</h2>
        <p className="error-message">{typeof listError === 'string' ? listError : JSON.stringify(listError)}</p>
        <Button onClick={() => dispatch(fetchAdminArticlesList({ page: currentPage, limit: ARTICLES_PER_PAGE, ...filters }))} variant="secondary" className="retry-button">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="admin-page-container admin-article-list-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Manage Articles</h1>
        <Link to="/admin/articles/new">
          <Button variant="primary" size="medium">
            <FaPlus className="button-icon" aria-hidden="true" /> Add New Article
          </Button>
        </Link>
      </div>

      {/* TODO: Add Filter UI elements here */}
      <div className="admin-filters-bar">
        <input
            type="text"
            name="searchTerm"
            placeholder="Search articles..."
            value={filters.searchTerm}
            onChange={handleFilterChange}
            className="filter-input"
        />
        <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-select">
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
        </select>
        {/* Add more filters for category, author if needed */}
      </div>
      {listStatus === 'loading' && <div className="table-loading-overlay"><Spinner size="small" label="Updating list..."/></div>}
      {listStatus === 'failed' && listError && articles.length > 0 && (
          <p className="admin-form-error list-error-inline">
            Error updating list: {typeof listError === 'string' ? listError : JSON.stringify(listError)}
          </p>
      )}


      {articles.length > 0 ? (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="col-thumbnail">Image</th>
                <th className="col-title">Title</th>
                <th className="col-author">Author</th>
                <th className="col-category">Category</th>
                <th className="col-date">Published</th>
                <th className="col-status">Status</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                article && article.id ? (
                <tr key={article.id}>
                  <td data-label="Image" className="cell-thumbnail">
                    <div className="thumbnail-wrapper">
                      <img
                        src={article.thumbnailUrl || `https://placehold.co/80x45/e2e8f0/94a3b8?text=${article.title ? article.title[0] : 'A'}`}
                        alt={`${article.title || 'Article'} thumbnail`}
                        className="admin-table-thumbnail"
                        onError={(e) => { e.currentTarget.src = `https://placehold.co/80x45/e2e8f0/94a3b8?text=Error`; }}
                      />
                    </div>
                  </td>
                  <td data-label="Title" className="cell-title">
                    <Link to={`/admin/articles/edit/${article.id}`} className="table-link">
                        {article.title || '-'}
                    </Link>
                    <span className="slug-display">Slug: {article.slug || '-'}</span>
                  </td>
                  <td data-label="Author">{article.author?.name || 'N/A'}</td>
                  <td data-label="Category">{article.category?.name || 'N/A'}</td>
                  <td data-label="Published Date">
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                      : article.status === 'PUBLISHED' ? 'Pending Date' : '-'
                    }
                  </td>
                  <td data-label="Status" className="cell-status">
                    <span className={`status-badge status-${article.status?.toLowerCase() || 'unknown'}`}>
                      {article.status || 'Unknown'}
                    </span>
                  </td>
                  <td data-label="Actions" className="cell-actions">
                    <div className="action-buttons">
                      <Button
                        variant="icon"
                        className={`status-toggle-btn ${article.status === 'PUBLISHED' ? 'published' : 'draft'}`}
                        onClick={() => handlePublishToggle(article.id, article.status)}
                        title={article.status === 'PUBLISHED' ? 'Click to Unpublish (Set to Draft)' : 'Click to Publish'}
                        aria-label={article.status === 'PUBLISHED' ? `Unpublish ${article.title}` : `Publish ${article.title}`}
                      >
                        {article.status === 'PUBLISHED' ? <FaToggleOn /> : <FaToggleOff />}
                      </Button>
                      <Link to={`/admin/articles/edit/${article.id}`} className="action-button-link">
                        <Button variant="icon" size="small" title="Edit Article" aria-label={`Edit ${article.title}`}>
                          <FaEdit />
                        </Button>
                      </Link>
                      <Button
                        variant="icon"
                        color="danger"
                        size="small"
                        onClick={() => handleDeleteArticle(article.id, article.title)}
                        title="Delete Article"
                        aria-label={`Delete ${article.title}`}
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
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
                <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1}>Previous</Button>
                <span>Page {currentPage} of {pagination.totalPages} (Total: {pagination.totalArticles})</span>
                <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pagination.totalPages}>Next</Button>
            </div>
          )}
        </div>
      ) : (
        listStatus === 'succeeded' && <p className="admin-empty-message">No articles found. <Link to="/admin/articles/new">Add your first article!</Link></p>
      )}
    </div>
  );
};

export default AdminArticleList;
