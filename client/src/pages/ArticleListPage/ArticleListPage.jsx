// client/src/pages/ArticleListPage/ArticleListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Common Components
import Card from '../../components/common/Card';
import SkeletonLoader from '../../components/common/SkeletonLoader';
// Icons
import {
    FaArrowRight, FaRegClock, FaUserEdit, FaAngleDown,
    FaExclamationTriangle, FaInfoCircle, FaTags // Added FaTags
} from 'react-icons/fa';

// Redux Slice
import {
  selectAllArticles,
  selectArticlesStatus,
  selectArticlesError,
  selectArticlesPagination, // Assuming you might use this for server-side pagination info
  fetchArticles,
  resetArticlesList // To clear list on component unmount or new filter
} from '../../features/articles/articlesSlice'; // Ensure this path is correct

// Page specific CSS
import './ArticleListPage.css';

// --- Helper Components ---
const LoadingErrorPlaceholder = ({ status, error, loadingComponent, errorComponent, children }) => {
    if (status === 'succeeded') {
        return children;
    }
    if (status === 'loading' || status === 'idle') {
        return loadingComponent;
    }
    if (status === 'failed') {
        console.error("Article List Data loading error:", error);
        return errorComponent;
    }
    return null;
};

const SectionErrorDisplay = ({ message = "Could not load articles." }) => (
    <div className="article-list-status error">
        <FaExclamationTriangle aria-hidden="true" className="status-icon" /> {message}
    </div>
);

const EmptyStateDisplay = ({ message = "No articles available yet." }) => (
    <div className="article-list-status empty">
        <FaInfoCircle aria-hidden="true" className="status-icon" /> {message}
    </div>
);
// --- End Helper Components ---

const ARTICLES_PER_PAGE_CLIENT = 9; // For client-side "load more"
const LOAD_MORE_DELAY = 500;

const ArticleListPage = () => {
  const dispatch = useDispatch();

  const allFetchedArticles = useSelector(selectAllArticles);
  const articlesStatus = useSelector(selectArticlesStatus);
  const articlesError = useSelector(selectArticlesError);
  const paginationInfo = useSelector(selectArticlesPagination); // Get pagination info

  // Local state for client-side pagination if not handling all via server
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_PAGE_CLIENT);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    // Fetch initial batch of articles if status is idle
    // If you implement server-side pagination for the initial load, pass page & limit
    if (articlesStatus === 'idle') {
      console.log("ArticleListPage: Dispatching fetchArticles (initial)...");
      dispatch(fetchArticles({ page: 1, limit: paginationInfo.limit || ARTICLES_PER_PAGE_CLIENT }));
    }

    // Optional: Clear articles when component unmounts if desired
    // return () => {
    //   dispatch(resetArticlesList());
    // };
  }, [articlesStatus, dispatch, paginationInfo.limit]);

  const displayedArticles = useMemo(() => {
    // If using client-side "load more" on an already fetched larger list
    // return Array.isArray(allFetchedArticles) ? allFetchedArticles.slice(0, visibleCount) : [];
    // If allFetchedArticles is already the paginated list from server, just use it
    return Array.isArray(allFetchedArticles) ? allFetchedArticles : [];
  }, [allFetchedArticles/*, visibleCount*/]); // Remove visibleCount if server paginates

  const handleLoadMore = () => {
    if (isLoadingMore || articlesStatus === 'loading') return;
    // For client-side load more (if allFetchedArticles contains more than displayed)
    // This assumes `WorkspaceArticles` initially fetches a larger set or all articles
    if (visibleCount < (allFetchedArticles?.length || 0)) {
        setIsLoadingMore(true);
        setTimeout(() => {
          setVisibleCount(prevCount => prevCount + ARTICLES_PER_PAGE_CLIENT);
          setIsLoadingMore(false);
        }, LOAD_MORE_DELAY);
    }
    // For server-side "load more" (fetching the next page)
    else if (paginationInfo.currentPage < paginationInfo.totalPages) {
        setIsLoadingMore(true); // Could also use articlesStatus === 'loading'
        dispatch(fetchArticles({
            page: paginationInfo.currentPage + 1,
            limit: paginationInfo.limit || ARTICLES_PER_PAGE_CLIENT
        })).finally(() => setIsLoadingMore(false));
    }
  };

  const renderArticleContent = () => {
    if (!Array.isArray(allFetchedArticles) || allFetchedArticles.length === 0) {
        // If status is succeeded but no articles, it means empty state.
        // If status is loading/idle, the LoadingErrorPlaceholder handles it.
        if (articlesStatus === 'succeeded') {
            return <EmptyStateDisplay message="No articles published yet. Stay tuned!" />;
        }
        return null; // Loading/error handled by placeholder
    }

    // Use `displayedArticles` if client-side slicing, or `allFetchedArticles` if server paginates fully
    const articlesToRender = displayedArticles; // Or just `allFetchedArticles`

    return (
      <>
        <div className="articles-grid">
          {articlesToRender.map(article => {
            const articleId = article.id || article._id; // Prefer 'id' from Prisma
            const articleSlug = article.slug;
            const articleTitle = article.title;

            if (!articleId || !articleSlug || !articleTitle) {
              console.warn("ArticleListPage: Skipping article with missing essential data:", article);
              return null;
            }

            const imageUrl = article.thumbnailUrl || `https://via.placeholder.com/350x200/e0e0e0/777777?text=${encodeURIComponent(articleTitle)}`;
            const authorName = article.author?.name || "Editorial Team"; // Fallback author
            const publicationDate = article.publishedAt || article.createdAt; // Prefer publishedAt

            return (
              <Link to={`/articles/${articleSlug}`} key={articleId} className="article-card-link">
                <Card className="article-card hover-effect">
                  <img
                    src={imageUrl}
                    alt={`${articleTitle} preview`}
                    className="article-card-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://via.placeholder.com/350x200/cccccc/999999?text=Image+Error`;
                    }}
                    loading="lazy"
                  />
                  <div className="article-card-content">
                    <h3 className="article-card-title">{articleTitle}</h3> {/* Changed to h3 for better semantics if page title is h1 */}
                    <div className="article-card-meta">
                      {authorName && (
                        <span className="meta-item">
                          <FaUserEdit aria-hidden="true" /> {authorName}
                        </span>
                      )}
                      {publicationDate && (
                        <span className="meta-item">
                          <FaRegClock aria-hidden="true" />
                          {new Date(publicationDate).toLocaleDateString('en-IN', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                    {article.excerpt && <p className="article-card-excerpt">{article.excerpt}</p>}
                     {/* Optional: Display a few tags on the card */}
                    {article.tags && article.tags.length > 0 && (
                        <div className="article-card-tags-preview">
                            <FaTags className="tags-preview-icon" />
                            {article.tags.slice(0, 2).map(tag => ( // Show first 2-3 tags
                                <span key={tag} className="article-card-tag-preview">{tag}</span>
                            ))}
                            {article.tags.length > 2 && <span className="article-card-tag-preview more">...</span>}
                        </div>
                    )}
                    <span className="read-more-link">
                      Read More <FaArrowRight aria-hidden="true" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Load More Button Area - Logic depends on client vs server pagination */}
        {articlesStatus !== 'loading' && paginationInfo.currentPage < paginationInfo.totalPages && allFetchedArticles.length > 0 && (
          <div className="load-more-container">
            <button
              onClick={handleLoadMore}
              className={`load-more-button ${isLoadingMore ? 'loading' : ''}`}
              disabled={isLoadingMore}
              aria-live="polite"
            >
              {isLoadingMore ? (
                <span className="loading-dots" aria-label="Loading more articles">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              ) : (
                <>
                  <span>Load More Articles</span>
                  <FaAngleDown aria-hidden="true" />
                </>
              )}
            </button>
            <p className='article-count-status' aria-live="polite">
              Showing {allFetchedArticles.length} of {paginationInfo.totalArticles} articles
            </p>
          </div>
        )}

        {articlesStatus === 'succeeded' && paginationInfo.currentPage >= paginationInfo.totalPages && allFetchedArticles.length > 0 && (
            <p className='article-count-status all-loaded'>
              Showing all {paginationInfo.totalArticles} articles
            </p>
        )}
      </>
    );
  };

  return (
    <div className="article-list-container page-container">
      <header className="article-list-header">
        <h1 className="article-list-main-title">Articles & Insights</h1>
        <p className="article-list-subtitle">
          Explore our latest posts, tutorials, and updates from the team.
        </p>
      </header>
      <LoadingErrorPlaceholder
        status={articlesStatus}
        error={articlesError}
        loadingComponent={
          <div className="articles-grid">
            {[...Array(ARTICLES_PER_PAGE_CLIENT)].map((_, i) => (
              <SkeletonLoader key={i} type="articleCard" />
            ))}
          </div>
        }
        errorComponent={
          <SectionErrorDisplay message={`Error: ${articlesError || 'Could not retrieve articles at this time.'}`} />
        }
      >
        {renderArticleContent()}
      </LoadingErrorPlaceholder>
    </div>
  );
};

export default ArticleListPage;