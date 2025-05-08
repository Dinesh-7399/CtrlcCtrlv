// client/src/pages/ArticleListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // Import useDispatch

// Common Components
import Card from '../../components/common/Card';
import Spinner from '../../components/common/Spinner';
import SkeletonLoader from '../../components/common/SkeletonLoader'; // For loading state
import Button from '../../components/common/Button'; // If you want to use Button component for Load More

// Icons
import {
    FaArrowRight, FaRegClock, FaUserEdit, FaAngleDown,
    FaExclamationTriangle, FaInfoCircle
} from 'react-icons/fa';

// Redux Slice
import {
  selectAllArticles,
  selectArticlesStatus,
  selectArticlesError,
  fetchArticles // Action to fetch articles
} from '../../features/articles/articlesSlice';

// Page specific CSS
import './ArticleListPage.css';

// --- Helper Components (Define or Import from common files) ---

const LoadingErrorPlaceholder = ({ status, error, loadingComponent, errorComponent, children }) => {
     if (status === 'succeeded') {
        return children;
     }
     if (status === 'loading' || status === 'idle') { // Show loading for idle too, as fetch will start
         return loadingComponent;
     }
     if (status === 'failed') {
         console.error("Article List Data loading error:", error);
         return errorComponent;
     }
     return null; // Should not happen with defined statuses
};

const SectionErrorDisplay = ({ message = "Could not load articles." }) => (
    <div className="article-list-status error">
        <FaExclamationTriangle aria-hidden="true" /> {message}
    </div>
);

const EmptyStateDisplay = ({ message = "No articles available yet." }) => (
    <div className="article-list-status empty">
        <FaInfoCircle aria-hidden="true" /> {message}
    </div>
);
// --- End Helper Components ---


// Constants for pagination
const ARTICLES_PER_PAGE = 9; // e.g., for a 3x3 grid
const LOAD_MORE_DELAY = 1000; // 1 second simulated delay

const ArticleListPage = () => {
  const dispatch = useDispatch(); // Hook to dispatch actions

  // Select data and status from Redux store
  const articles = useSelector(selectAllArticles);
  const articlesStatus = useSelector(selectArticlesStatus);
  const articlesError = useSelector(selectArticlesError);

  // Local state for client-side pagination and button loading
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // --- Effect for Initial Data Fetch ---
  useEffect(() => {
    // If articles are not loaded/loading/failed, fetch them
    if (articlesStatus === 'idle') {
      console.log("ArticleListPage: Dispatching fetchArticles...");
      dispatch(fetchArticles());
    }
  }, [articlesStatus, dispatch]); // Depend on status and dispatch

  // Derive the list of articles to display based on visibleCount
  const displayedArticles = React.useMemo(() => {
      return (articles || []).slice(0, visibleCount);
  }, [articles, visibleCount]); // Memoize derived data

  // Handler for the "Load More" button
  const handleLoadMore = () => {
    if (isLoadingMore) return; // Prevent multiple clicks while loading
    setIsLoadingMore(true);
    setTimeout(() => {
      // Increase the number of visible articles
      setVisibleCount(prevCount => prevCount + ARTICLES_PER_PAGE);
      setIsLoadingMore(false); // Reset loading state
    }, LOAD_MORE_DELAY);
  };

  // --- Function to Render the Grid or Empty State ---
  const renderArticleContent = () => {
    // Ensure articles is an array before checking length
    const safeArticles = articles || [];

    if (safeArticles.length === 0) {
       return <EmptyStateDisplay message="No articles found." />;
    }

    return (
      <>
        {/* Articles Grid */}
        <div className="articles-grid">
          {displayedArticles.map(article => (
            // Basic check for essential article data
             (!article || !article._id || !article.slug || !article.title) ? null : (
                <Link to={`/articles/${article.slug}`} key={article._id} className="article-card-link">
                  <Card className="article-card hover-effect">
                    <img
                      src={article.imageUrl || "https://via.placeholder.com/350x200/cccccc/ffffff?text=Article"}
                      alt={`${article.title} preview`}
                      className="article-card-image"
                      onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/350x200/cccccc/ffffff?text=Error"; }}
                      loading="lazy"
                    />
                    <div className="article-card-content">
                      <h2 className="article-card-title">{article.title}</h2>
                      <div className="article-card-meta">
                        {/* Conditionally render meta info */}
                        {article.author && <span><FaUserEdit aria-hidden="true" /> {article.author}</span>}
                        {article.publishDate && (
                            <span>
                                <FaRegClock aria-hidden="true" />
                                {new Date(article.publishDate).toLocaleDateString('en-IN',
                                    { year: 'numeric', month: 'short', day: 'numeric' }
                                )}
                            </span>
                        )}
                      </div>
                      {article.excerpt && <p className="article-card-excerpt">{article.excerpt}</p>}
                      <span className="read-more-link">Read More <FaArrowRight aria-hidden="true" /></span>
                    </div>
                  </Card>
                </Link>
            )
          ))}
        </div>

        {/* --- Load More Button Area --- */}
        {visibleCount < safeArticles.length && (
          <div className="load-more-container">
            <button
              onClick={handleLoadMore}
              className={`load-more-button ${isLoadingMore ? 'loading' : ''}`}
              disabled={isLoadingMore}
              aria-live="polite" // Announce loading state changes
            >
              {isLoadingMore ? (
                <span className="loading-dots" aria-label="Loading more articles">
                  <span></span><span></span><span></span>
                </span>
              ) : (
                <>
                  <span>Load More</span>
                  <FaAngleDown aria-hidden="true" />
                </>
              )}
            </button>
            <p className='article-count-status' aria-live="polite">
              Showing {displayedArticles.length} of {safeArticles.length} articles
            </p>
          </div>
        )}
        {/* --- End Load More Button Area --- */}

        {/* All Loaded Status */}
        {visibleCount >= safeArticles.length && safeArticles.length > 0 && (
            <p className='article-count-status all-loaded'>
              Showing all {safeArticles.length} articles
            </p>
        )}
      </>
    );
  }

  // --- Main Return ---
  return (
    <div className="article-list-container page-container">
      <h1 className="article-list-title">Articles & Insights</h1>
      <LoadingErrorPlaceholder
        status={articlesStatus}
        error={articlesError}
        // Show skeletons during initial load ('idle' or 'loading')
        loadingComponent={
            <div className="articles-grid">
                {[...Array(ARTICLES_PER_PAGE)].map((_, i) => (
                    <SkeletonLoader key={i} type="articleCard" />
                ))}
            </div>
        }
        // Show error message if fetch failed
        errorComponent={
            <SectionErrorDisplay message={`Error: ${articlesError || 'Could not load articles.'}`} />
        }
      >
        {/* Render the actual content (grid or empty message) when succeeded */}
        {renderArticleContent()}
      </LoadingErrorPlaceholder>
    </div>
  );
};

export default ArticleListPage;