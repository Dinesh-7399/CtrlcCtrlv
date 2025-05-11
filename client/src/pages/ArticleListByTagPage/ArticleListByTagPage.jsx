// client/src/pages/YourTagListPage/ArticleListByTagPage.jsx

import React, { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence

// ** 1. IMPORTANT: MAKE SURE THIS CSS FILE IS IMPORTED AND THE PATH IS CORRECT **
import './ArticleListByTagPage.css'; // Assuming CSS is in the same folder

// ** 2. IMPORTANT: Adjust this import path to correctly point to your articlesSlice.js **
import {
  fetchArticles,
  resetArticlesList,
  selectAllArticles,
  selectArticlesStatus,
  selectArticlesError,
  selectArticlesPagination,
} from '../../features/articles/articlesSlice.js'; // Example path, please verify

// ** 3. IMPORTANT: Adjust import paths for these common components **
import Spinner from '../../components/common/Spinner';
import { FaTag, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

// --- Motion Variants ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5
};

const cardListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Stagger effect for cards
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
};


const ArticleCardItem = ({ article }) => {
  return (
    // Each card item will animate in based on cardItemVariants from the parent
    <motion.div variants={cardItemVariants}>
      <RouterLink to={`/articles/${article.slug}`} className="article-card-link">
        <motion.div
          className="article-card"
          whileHover={{
            y: -5,
            scale: 1.02,
            boxShadow: "var(--box-shadow-md)" // Use CSS variable for shadow
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {article.thumbnailUrl && (
            <motion.img // Animate image too if desired
              src={article.thumbnailUrl}
              alt={article.title}
              className="article-card-image"
              loading="lazy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          <div className="article-card-content">
            <motion.h3
              className="article-card-title"
            // layout // can cause issues with grid, use with caution
            >
              {article.title}
            </motion.h3>
            <motion.p
              className="article-card-excerpt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {article.excerpt || 'No excerpt available.'}
            </motion.p>
          </div>
        </motion.div>
      </RouterLink>
    </motion.div>
  );
};

const ArticleListGrid = ({ articles }) => {
  if (!articles || articles.length === 0) {
    return null;
  }
  return (
    <motion.div
      className="articles-grid"
      variants={cardListVariants}
      initial="hidden"
      animate="visible" // Animate when articles are present
    >
      {articles.map(article => (
        <ArticleCardItem key={article.id} article={article} />
      ))}
    </motion.div>
  );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) {
    return null;
  }
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <motion.nav
      className="pagination-controls"
      aria-label="Page navigation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <ul>
        {currentPage > 1 && (
          <motion.li variants={buttonVariants} whileHover="hover" whileTap="tap">
            <button onClick={() => onPageChange(currentPage - 1)} className="pagination-button">
              Previous
            </button>
          </motion.li>
        )}
        {pageNumbers.map(number => (
          <motion.li key={number} variants={buttonVariants} whileHover="hover" whileTap="tap">
            <button
              onClick={() => onPageChange(number)}
              className={`pagination-button ${number === currentPage ? "active-page" : ""}`}
              disabled={number === currentPage}
            >
              {number}
            </button>
          </motion.li>
        ))}
        {currentPage < totalPages && (
          <motion.li variants={buttonVariants} whileHover="hover" whileTap="tap">
            <button onClick={() => onPageChange(currentPage + 1)} className="pagination-button">
              Next
            </button>
          </motion.li>
        )}
      </ul>
    </motion.nav>
  );
};


const ArticleListByTagPage = () => {
  const dispatch = useDispatch();
  const { tagSlug } = useParams();

  const articles = useSelector(selectAllArticles);
  const status = useSelector(selectArticlesStatus);
  const error = useSelector(selectArticlesError);
  const pagination = useSelector(selectArticlesPagination);

  const loadArticlesForCurrentTag = useCallback((page = 1) => {
    if (tagSlug) {
      dispatch(fetchArticles({ tag: tagSlug, page }));
    }
  }, [dispatch, tagSlug]);

  useEffect(() => {
    if (tagSlug) {
      dispatch(resetArticlesList({
        newFilters: {
          tag: tagSlug,
          categorySlug: null,
          searchTerm: null,
        }
      }));
      loadArticlesForCurrentTag(1);
    }
  }, [dispatch, tagSlug, loadArticlesForCurrentTag]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage) {
      loadArticlesForCurrentTag(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  let contentToDisplay;

  // Using AnimatePresence to animate status changes
  if (status === 'loading' && articles.length === 0) {
    contentToDisplay = (
      <motion.div key="loading" className="article-list-status loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Spinner label={`Loading articles tagged "${tagSlug}"...`} size="large" />
      </motion.div>
    );
  } else if (status === 'failed') {
    contentToDisplay = (
      <motion.div key="error" className="article-list-status error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <FaExclamationCircle className="status-icon" />
        <p className="status-title">Error Loading Articles</p>
        <p className="status-message">{typeof error === 'string' ? error : error?.message || 'An unknown error occurred.'}</p>
        <motion.button variants={buttonVariants} whileHover="hover" whileTap="tap" onClick={() => loadArticlesForCurrentTag(1)} className="status-retry-button">
          Try Again
        </motion.button>
      </motion.div>
    );
  } else if (status === 'succeeded' && articles.length === 0) {
    contentToDisplay = (
      <motion.div key="empty" className="article-list-status empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <FaInfoCircle className="status-icon" />
        <p className="status-title">No Articles Found</p>
        <p className="status-message">No articles found for the tag "{tagSlug}".</p>
      </motion.div>
    );
  } else if (articles.length > 0) {
    contentToDisplay = (
      // Key added for AnimatePresence if the entire block should animate out
      <motion.div key="articles-list-content" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { delayChildren: 0.3 } } }}>
        <ArticleListGrid articles={articles} />
        <PaginationControls
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
        {status === 'loading' && (
          <motion.div className="article-list-status subsequent-load" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Spinner label="Loading more..." />
          </motion.div>
        )}
      </motion.div>
    );
  } else {
    contentToDisplay = ( // Fallback, e.g. for initial 'idle' state
      <div className="article-list-status">
        <p>Preparing to load articles for "{tagSlug}"...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="article-list-by-tag-container"
      key={tagSlug} // Add key here to re-trigger animation on tagSlug change
      variants={pageVariants}
      initial="initial"
      animate="in"
      exit="out"
      transition={pageTransition}
    >
      <motion.header
        className="article-list-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h1 className="article-list-main-title">
          <FaTag className="title-icon" />
          Articles tagged with: <span className="tag-highlight">{tagSlug}</span>
        </h1>
      </motion.header>
      <motion.main
        className="article-list-main-content"
      >
        <AnimatePresence mode="wait"> {/* mode="wait" ensures exit animations complete before enter */}
          {contentToDisplay}
        </AnimatePresence>
      </motion.main>
    </motion.div>
  );
};

export default ArticleListByTagPage;