// src/components/QnA/QuestionListItem.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaCheckCircle, FaRegCommentAlt, FaThumbsUp, FaEye } from 'react-icons/fa';
import './QuestionListItem.css'; // We'll create this CSS file

// Helper function for relative time
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + " year" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + " month" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + " day" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
  return Math.floor(seconds) + " second" + (seconds === 1 ? "" : "s") + " ago";
};


const QuestionListItem = ({ question }) => {
  const {
    id,
    title,
    tags,
    asker,
    answerCount,
    voteCount,
    viewCount,
    createdAt,
    hasAcceptedAnswer,
  } = question;

  return (
    <div className={`qna-list-item ${hasAcceptedAnswer ? 'has-accepted' : ''}`}>
      <div className="qna-item-stats">
        <div className="qna-stat">
          <span className="qna-stat-count">{voteCount}</span>
          <span className="qna-stat-label">Votes</span>
        </div>
        <div className={`qna-stat ${answerCount > 0 ? 'has-answers' : ''} ${hasAcceptedAnswer ? 'accepted-answer-indicator' : ''}`}>
          <span className="qna-stat-count">
             {hasAcceptedAnswer && <FaCheckCircle className="accepted-icon" title="Accepted Answer"/>}
             {answerCount}
          </span>
          <span className="qna-stat-label">Answers</span>
        </div>
        <div className="qna-stat">
          <span className="qna-stat-count">{viewCount}</span>
          <span className="qna-stat-label">Views</span>
        </div>
      </div>
      <div className="qna-item-summary">
        <h3 className="qna-item-title">
          {/* Make this link to the detail page later */}
          <Link to={`/qna/${id}`} className="qna-item-link">{title}</Link>
        </h3>
        <div className="qna-item-tags">
          {tags.map(tag => (
            // Make tags clickable links later for filtering
            <span key={tag} className="qna-tag">{tag}</span>
          ))}
        </div>
        <div className="qna-item-meta">
          Asked by <span className="qna-asker">{asker}</span> {timeAgo(createdAt)}
        </div>
      </div>
    </div>
  );
};

// Prop validation
QuestionListItem.propTypes = {
  question: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string).isRequired,
    asker: PropTypes.string.isRequired,
    answerCount: PropTypes.number.isRequired,
    voteCount: PropTypes.number.isRequired,
    viewCount: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired,
    hasAcceptedAnswer: PropTypes.bool.isRequired,
  }).isRequired,
};

export default QuestionListItem;