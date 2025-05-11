// client/src/pages/ArticleDetailPage/ArticleDetailPage.jsx
import React, { useRef, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Button from '../../components/common/Button';
import './ArticleDetailPage.css';
import { FaArrowLeft, FaRegClock, FaUserEdit, FaExclamationTriangle, FaTags, FaFolderOpen } from 'react-icons/fa';
import Spinner from '../../components/common/Spinner';

import {
  fetchArticleBySlug,
  selectCurrentArticleDetails,
  selectArticleDetailsStatus,
  selectArticleDetailsError,
  clearCurrentArticle,
} from '../../features/articles/articlesSlice.js';

import renderMathInElement from 'katex/dist/contrib/auto-render';
// IMPORTANT: Ensure KaTeX CSS is imported globally (e.g., in your main.jsx or App.jsx)
// import 'katex/dist/katex.min.css';

const katexOptions = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true },
  ],
  throwOnError: false,
};

const ArticleDetailPage = () => {
  const { articleSlug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // articleDataWrapper will be an object like: { article: { id: ..., title: ..., content: "..." } }
  // OR null if no article is loaded yet or if an error occurred.
  const articleDataWrapper = useSelector(selectCurrentArticleDetails);
  const articleStatus = useSelector(selectArticleDetailsStatus);
  const error = useSelector(selectArticleDetailsError);

  const contentRef = useRef(null);

  // --- CRITICAL LOG 5: See what the selector returns from Redux ---
  console.log('ArticleDetailPage: articleDataWrapper from selector (should be { article: {...} } or null):', JSON.stringify(articleDataWrapper, null, 2));
  console.log('ArticleDetailPage: articleStatus from selector:', articleStatus);


  // Extract the actual article object from the wrapper
  // This is the main fix: access articleDataWrapper.article
  const actualArticle = articleDataWrapper ? articleDataWrapper.article : null;

  // --- CRITICAL LOG 6: See the extracted 'actualArticle' object ---
  // This should be the object containing { id, title, content, ... } or null.
  console.log('ArticleDetailPage: Extracted actualArticle object:', JSON.stringify(actualArticle, null, 2));


  useEffect(() => {
    if (articleSlug) {
      dispatch(fetchArticleBySlug(articleSlug));
    }
    return () => {
      dispatch(clearCurrentArticle());
    };
  }, [dispatch, articleSlug]);

  useEffect(() => {
    // Use 'actualArticle' here
    if (contentRef.current && actualArticle?.content) {
      try {
        renderMathInElement(contentRef.current, katexOptions);
      } catch (e) {
        console.error("KaTeX auto-render error:", e);
      }
    }
  }, [actualArticle?.content]); // Dependency on the content of the extracted article

  const handleGoBack = () => {
    navigate('/articles');
  };

  if (articleStatus === 'loading' || articleStatus === 'idle') {
    return (
      <div className="article-detail-status loading-state page-container">
        <Spinner label="Loading article..." size="large" />
      </div>
    );
  }

  if (articleStatus === 'failed') {
    return (
      <div className="article-detail-status article-error page-container">
        <FaExclamationTriangle className="error-icon" />
        <p className="error-title">Error Loading Article</p>
        <p className="error-message">
          {typeof error === 'string' ? error : error?.message || 'Could not fetch the article.'}
        </p>
        <Button onClick={handleGoBack} variant="secondary" className="back-button-error">
          <FaArrowLeft className="button-icon" /> Back to Articles
        </Button>
      </div>
    );
  }

  // Use 'actualArticle' for "not found" check
  if (articleStatus === 'succeeded' && !actualArticle) {
    // This means the API call was successful, Redux state was updated,
    // but the 'article' object within the wrapper was null or missing.
    // This could happen if the backend successfully responds but indicates "not found"
    // in a way that results in articleDataWrapper.article being null.
    return (
      <div className="article-detail-status article-not-found page-container">
        <FaExclamationTriangle className="error-icon" />
        <p className="error-title">Article Not Found</p>
        <p className="error-message">
          The article with slug "{articleSlug}" could not be found or the data structure is unexpected.
        </p>
        <Button onClick={handleGoBack} variant="secondary" className="back-button-error">
          <FaArrowLeft className="button-icon" /> Back to Articles
        </Button>
      </div>
    );
  }

  // Fallback if 'actualArticle' is still not available after all checks
  if (!actualArticle) {
    return (
      <div className="article-detail-status loading-state page-container">
        <Spinner label="Preparing article data..." size="large" />
      </div>
    );
  }

  // Destructure from 'actualArticle'
  const {
    title,
    content, // This 'content' should now be correctly sourced
    thumbnailUrl,
    category,
    author: authorObject, // Renamed to avoid conflict if 'author' is used as a prop name
    authorId: directAuthorIdFromArticle, // If author ID is directly on article object
    authorName: directAuthorNameFromArticle, // If author name is directly on article object
    publishedAt,
    readTime,
    tags
  } = actualArticle;

  // --- CRITICAL LOG 7: See the 'content' that will be used for rendering ---
  console.log('ArticleDetailPage: Destructured content for rendering:', content);


  // Consolidate author details extraction using 'authorObject' from 'actualArticle'
  const authorName = authorObject?.name || directAuthorNameFromArticle || 'Unknown Author';
  const authorId = authorObject?.id || directAuthorIdFromArticle;
  const authorAvatarUrl = authorObject?.profile?.avatarUrl || authorObject?.avatarUrl;
  const authorProfileLinkPath = authorId ? `/profile/${authorId}` : null;

  return (
    <div className="article-detail-container page-container">
      <Button onClick={handleGoBack} variant="outline" size="small" className="back-button">
        <FaArrowLeft className="button-icon" /> Back to Articles List
      </Button>

      <article className="article-content-main">
        <header className="article-header">
          {category?.name && category?.slug && (
            <RouterLink to={`/articles/category/${category.slug}`} className="article-category-link">
              <FaFolderOpen /> {category.name}
            </RouterLink>
          )}
          <h1 className="article-detail-title">{title}</h1>
          <div className="article-detail-meta">
            {(authorObject || directAuthorIdFromArticle) && (
              <span className="meta-item author-meta">
                {authorProfileLinkPath ? (
                  <RouterLink to={authorProfileLinkPath} className="author-profile-link has-avatar">
                    {authorAvatarUrl ? (
                      <img src={authorAvatarUrl} alt={`${authorName}'s avatar`} className="author-avatar-meta" />
                    ) : (
                      <FaUserEdit className="author-icon-meta" />
                    )}
                    <span className="author-name-meta">{authorName}</span>
                  </RouterLink>
                ) : (
                  <>
                    {authorAvatarUrl ? (
                      <img src={authorAvatarUrl} alt={`${authorName}'s avatar`} className="author-avatar-meta" />
                    ) : (
                      <FaUserEdit className="author-icon-meta" />
                    )}
                    <span className="author-name-meta">{authorName}</span>
                  </>
                )}
              </span>
            )}

            {publishedAt && (
              <span className="meta-item date-meta">
                <FaRegClock /> Published on {new Date(publishedAt).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
            {readTime && (
              <span className="meta-item read-time"> ({readTime} min read)</span>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div className="article-tags-meta">
              <FaTags className="tags-icon" />
              {tags.map(tag => (
                <RouterLink
                  key={typeof tag === 'string' ? tag : tag.id || tag.name}
                  to={`/articles/tag/${(typeof tag === 'string' ? tag : tag.name).toLowerCase().replace(/\s+/g, '-')}`}
                  className="tag-link"
                >
                  {typeof tag === 'string' ? tag : tag.name}
                </RouterLink>
              ))}
            </div>
          )}
        </header>

        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={`${title} banner`}
            className="article-detail-banner"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            loading="lazy"
          />
        )}

        {/* This conditional rendering should now work correctly with the extracted 'content' */}
        {content ? (
          <div
            ref={contentRef}
            className="article-body prose-styles"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="article-body-missing">Article content is not available.</p>
        )}
      </article>
    </div>
  );
};

export default ArticleDetailPage;