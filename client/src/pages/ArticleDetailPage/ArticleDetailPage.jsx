// client/src/pages/ArticleDetailPage.jsx
// Add useRef and useEffect
import React, { useRef, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom'; // Renamed Link to avoid conflict
import { useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import './ArticleDetailPage.css';
import { FaArrowLeft, FaRegClock, FaUserEdit, FaExclamationTriangle } from 'react-icons/fa'; // Added error icon
import Spinner from '../../components/common/Spinner';

// --- Import selectors from the articles slice ---
// !! Ensure path/filename/casing is correct !!
import {
  selectArticleBySlug, // Assuming you select by slug
  selectArticlesStatus,
  // selectArticleById, // Use this instead if selecting by ID
  // getArticlesError,
} from '../../features/articles/articlesSlice';

// --- NEW: KaTeX Imports ---
import katex from 'katex'; // Core KaTeX library (might not be directly used, but good practice)
import renderMathInElement from 'katex/dist/contrib/auto-render'; // Auto-render extension
// IMPORTANT: Ensure KaTeX CSS is imported ONCE globally, e.g., in index.js or App.jsx
// import 'katex/dist/katex.min.css';
// --- End KaTeX Imports ---


const ArticleDetailPage = () => {
  const { articleSlug } = useParams(); // Get slug from URL
  const navigate = useNavigate();

  // --- Get data and status directly from Redux ---
  // Select article by slug (ensure this selector works with your entities state if changed)
  const article = useSelector((state) => selectArticleBySlug(state, articleSlug));
  const articlesStatus = useSelector(selectArticlesStatus);
  // const articlesError = useSelector(getArticlesError); // Optional

  // --- NEW: Ref for the content container ---
  const contentRef = useRef(null);
  // --- End Ref ---


  // --- NEW: Effect to render math after content loads/changes ---
  useEffect(() => {
    // Check if the ref is attached to an element and we have article content
    if (contentRef.current && article?.content) {
      try {
        // Scan the contentRef element and render math based on delimiters
        renderMathInElement(contentRef.current, {
          delimiters: [
              { left: '$$', right: '$$', display: true },  // For display math $$...$$
              { left: '$', right: '$', display: false },   // For inline math $...$
              // Optional common LaTeX delimiters (require escaping backslashes in JS strings)
              // { left: '\\(', right: '\\)', display: false },
              // { left: '\\[', right: '\\]', display: true }
          ],
          // Prevent errors from stopping the entire page render
          throwOnError: false
        });
      } catch (error) {
          console.error("KaTeX auto-render error:", error);
      }
    }
    // Dependency array: Re-run this effect if the article content changes
  }, [article?.content]);
  // --- End Effect ---


  // Handler to go back to the article list
  const handleGoBack = () => {
    navigate('/articles');
  };

  // --- Render loading state based on Redux status ---
  if (articlesStatus === 'loading') {
    return (
      <div className="article-detail-status loading-state">
        <Spinner label="Loading article..." />
      </div>
    );
  }

  // --- Render error/not found state ---
  if (!article && (articlesStatus === 'idle' || articlesStatus === 'succeeded')) {
     return (
       <div className="article-detail-status article-error">
         <FaExclamationTriangle size={30} style={{ marginBottom: 'var(--spacing-sm)' }} />
         <p>Article not found.</p>
         <p>The requested article with slug "{articleSlug}" could not be found.</p>
         <Button onClick={handleGoBack} variant="secondary" className="back-button-error">
             <FaArrowLeft className="button-icon"/> Back to Articles
         </Button>
       </div>
     );
   }

  // Render not found if article is somehow null after loading
  if (!article) {
      return <div className="article-detail-status">Could not load article data.</div>;
  }

  // --- Render the main article content ---
  return (
    <div className="article-detail-container page-container"> {/* Added page-container */}
      {/* Back Button */}
      <Button onClick={handleGoBack} variant="outline" size="small" className="back-button">
        <FaArrowLeft className="button-icon"/> Back to Articles
      </Button>

      <article className="article-content-main">
        {/* Article Title */}
        <h1 className="article-detail-title">{article.title}</h1>

        {/* Article Metadata */}
        <div className="article-detail-meta">
          <span><FaUserEdit /> By {article.author}</span>
          <span>
            <FaRegClock /> Published on {new Date(article.publishDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          {article.readTime && (
             <span className="read-time"> ({article.readTime} min read)</span>
          )}
        </div>

        {/* Optional Banner Image */}
        {article.imageUrl && (
          <img
            src={article.imageUrl}
            alt={`${article.title} banner`}
            className="article-detail-banner"
            onError={(e) => { e.target.onerror = null; e.target.style.display='none'; }}
            loading="lazy"
          />
        )}

        {/* Article Body Content */}
        {article.content ? (
           <div
             ref={contentRef} // <-- Attach the ref here
             className="article-body"
             // Render the raw HTML from your Tiptap editor/data source
             dangerouslySetInnerHTML={{ __html: article.content }}
           />
         ) : (
           <p className="article-body-missing">Article content is not available.</p>
         )}
      </article>

       {/* Optional: Add related articles or comments section later */}

    </div>
  );
};

export default ArticleDetailPage;