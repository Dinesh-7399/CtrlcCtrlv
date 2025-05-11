// src/pages/QnAPage/QnAPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Link not used directly, QuestionListItem handles links
import { motion, AnimatePresence } from 'framer-motion'; // Import Framer Motion

// Assuming Button, QuestionListItem, Spinner, Input are your existing components
import Button from '../../components/common/Button';
import QuestionListItem from '../../components/QnA/QuestionListItem';
import Spinner from '../../components/common/Spinner';
import Input from '../../components/common/Input';

import './QnAPage.css'; // Import CSS for base styling

import { FaPlus, FaFilter, FaSortAmountDown, FaExclamationTriangle, FaSearch } from 'react-icons/fa';

import { useSelector, useDispatch } from 'react-redux';
import {
  fetchQuestions,
  selectAllQnAQuestions,
  selectQnAStatus,
  selectQnAError,
  selectQnAPagination,
  clearQnAState // Assuming you want to keep this for potential use
} from '../../features/qna/qnaSlice';

const ITEMS_PER_PAGE = 10;

// --- Framer Motion Variants ---
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  out: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } }
};

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07, // Stagger delay for each question item
    },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const buttonHoverTap = {
  hover: { scale: 1.05, transition: { duration: 0.15 } },
  tap: { scale: 0.95 },
};

const QnAPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const questions = useSelector(selectAllQnAQuestions);
  const qnaStatus = useSelector(selectQnAStatus);
  const qnaError = useSelector(selectQnAError);
  const pagination = useSelector(selectQnAPagination);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'newest');
  const [activeTags, setActiveTags] = useState(() => searchParams.getAll('tag') || []);
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));

  useEffect(() => {
    const paramsToFetch = {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      ...(searchTerm && { searchTerm }),
      ...(sortBy && { sortBy }),
      ...(activeTags.length > 0 && { tags: activeTags.join(',') }),
    };
    dispatch(fetchQuestions(paramsToFetch));

    const newSearchParams = new URLSearchParams();
    if (searchTerm) newSearchParams.set('search', searchTerm);
    if (sortBy && sortBy !== 'newest') newSearchParams.set('sort', sortBy);
    activeTags.forEach(tag => newSearchParams.append('tag', tag));
    if (currentPage > 1) newSearchParams.set('page', currentPage.toString());
    setSearchParams(newSearchParams, { replace: true });
  }, [dispatch, searchTerm, sortBy, activeTags, currentPage, setSearchParams]);

  useEffect(() => {
    // Optional: Clear state on unmount if needed, or based on specific navigation
    // return () => { dispatch(clearQnAState()); };
  }, [dispatch]);

  const handleAskQuestion = () => navigate('/qna/ask');
  const handleSearchSubmit = (e) => { e.preventDefault(); setCurrentPage(1); };
  const handleSortChange = (e) => { setSortBy(e.target.value); setCurrentPage(1); };
  const toggleTagFilter = (tagToToggle) => {
    setActiveTags(prevTags =>
      prevTags.includes(tagToToggle)
        ? prevTags.filter(t => t !== tagToToggle)
        : [...prevTags, tagToToggle]
    );
    setCurrentPage(1);
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== currentPage && qnaStatus !== 'loading') {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const allAvailableTags = ['react', 'javascript', 'redux', 'css', 'node', 'python', 'express']; // Example tags

  let contentDisplay;
  if (qnaStatus === 'loading' && questions.length === 0) {
    contentDisplay = <motion.div key="loading" className="qna-status-section loading" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Spinner label="Loading questions..." size="large" /></motion.div>;
  } else if (qnaStatus === 'failed') {
    contentDisplay = <motion.div key="error" className="qna-status-section error-message" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <FaExclamationTriangle className="status-icon" />
      <p className="status-title">Error Loading Questions</p>
      <p className="status-message">{qnaError || "Failed to load questions. Please try again."}</p>
      <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
        <Button onClick={() => dispatch(fetchQuestions({ page: currentPage, limit: ITEMS_PER_PAGE, searchTerm, sortBy, tags: activeTags.join(',') }))} variant="outline" className="retry-button">Retry</Button>
      </motion.div>
    </motion.div>;
  } else if (qnaStatus === 'succeeded' && questions.length === 0) {
    contentDisplay = <motion.div key="empty" className="qna-status-section empty" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <FaInfoCircle className="status-icon" />
      <p className="status-title">No Questions Found</p>
      <p className="status-message">No questions found matching your criteria.</p>
    </motion.div>;
  } else if (questions.length > 0) {
    contentDisplay = (
      <motion.div key="list" initial="hidden" animate="visible" variants={{hidden:{opacity:0}, visible:{opacity:1}}}>
        <motion.div className="qna-list" variants={listContainerVariants} initial="hidden" animate="visible">
          {questions.map(question => (
            // QuestionListItem itself can have internal motion, or be wrapped like this
            <motion.div key={question.id} variants={listItemVariants}>
              <QuestionListItem question={question} />
            </motion.div>
          ))}
        </motion.div>
        {pagination.totalPages > 1 && (
          <motion.div className="qna-pagination" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}}>
            <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
              <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || qnaStatus === 'loading'}>Previous</Button>
            </motion.div>
            <span>Page {currentPage} of {pagination.totalPages} (Total: {pagination.totalQuestions})</span>
            <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
              <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= pagination.totalPages || qnaStatus === 'loading'}>Next</Button>
            </motion.div>
          </motion.div>
        )}
        {qnaStatus === 'loading' && questions.length > 0 && (
          <div className="qna-status-section subsequent-loading"><Spinner label="Updating questions..." /></div>
        )}
      </motion.div>
    );
  } else {
    contentDisplay = <div className="qna-status-section"><p>Initializing Q&A...</p></div>; // Initial idle state
  }

  return (
    <motion.div className="qna-page page-container" variants={pageVariants} initial="initial" animate="in" exit="out">
      <motion.div className="qna-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <h1>Questions & Answers</h1>
        <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
          <Button onClick={handleAskQuestion} variant="primary" className="ask-question-btn">
            <FaPlus /> Ask Question
          </Button>
        </motion.div>
      </motion.div>

      <motion.div className="qna-controls" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <form onSubmit={handleSearchSubmit} className="qna-search-form">
          <Input
            id="qna-search" type="search" placeholder="Search questions..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="qna-search-input"
          />
          <motion.div variants={buttonHoverTap} whileHover="hover" whileTap="tap">
            <Button type="submit" variant="secondary" className="search-action-btn"><FaSearch/> Search</Button>
          </motion.div>
        </form>
        <div className="qna-filter-sort">
            <div className="filter-group">
                <label htmlFor="sort-by" className="filter-label"><FaSortAmountDown /> Sort By:</label>
                <select id="sort-by" value={sortBy} onChange={handleSortChange} className="filter-select">
                    <option value="newest">Newest</option><option value="votes">Most Votes</option><option value="unanswered">Unanswered</option>
                </select>
            </div>
            <div className="filter-group">
                <label className="filter-label"><FaFilter /> Tags:</label>
                <div className="tags-filter-list">
                    {allAvailableTags.map(tag => (
                        <motion.div key={tag} variants={buttonHoverTap} whileHover="hover" whileTap="tap" className="tag-button-wrapper">
                             <Button
                                variant={activeTags.includes(tag) ? 'primary' : 'outline'}
                                size="small"
                                onClick={() => toggleTagFilter(tag)}
                                className="tag-filter-button"
                            >
                                {tag}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
      </motion.div>
      <AnimatePresence mode="wait">
        {contentDisplay}
      </AnimatePresence>
    </motion.div>
  );
};

export default QnAPage;