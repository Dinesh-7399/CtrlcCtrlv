// src/pages/QnAPage/QnAPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Assuming you'll link items later
import Button from '../../components/common/Button';
import QuestionListItem from '../../components/QnA/QuestionListItem'; // We'll create this next
import './QnAPage.css';
import { FaPlus, FaFilter, FaSortAmountDown } from 'react-icons/fa';

// --- Dummy Data ---
const dummyQuestions = [
  {
    id: 'q1',
    title: 'How does Quantum Entanglement work with respect to Bell\'s Theorem?',
    tags: ['quantum-physics', 'entanglement', 'bells-theorem'],
    asker: 'PhysicsFan123',
    answerCount: 3,
    voteCount: 15,
    viewCount: 120,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
    hasAcceptedAnswer: true,
  },
  {
    id: 'q2',
    title: 'Best way to implement asynchronous operations in React using hooks?',
    tags: ['react', 'javascript', 'async', 'hooks'],
    asker: 'ReactDev',
    answerCount: 5,
    voteCount: 25,
    viewCount: 250,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    hasAcceptedAnswer: false,
  },
  {
    id: 'q3',
    title: 'Understanding the significance of the p-value in statistical hypothesis testing',
    tags: ['statistics', 'hypothesis-testing', 'p-value'],
    asker: 'StatsStudent',
    answerCount: 1,
    voteCount: 8,
    viewCount: 95,
    createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(), // 12 hours ago
    hasAcceptedAnswer: false,
  },
  // Add more dummy questions as needed
];
// --- End Dummy Data ---


const QnAPage = () => {
  const [questions, setQuestions] = useState(dummyQuestions);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, votes, unanswered
  const [filterTags, setFilterTags] = useState([]); // ['react', 'quantum-physics']

  // Basic filtering logic (can be expanded)
  const filteredQuestions = questions
    .filter(q =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(q =>
      filterTags.length === 0 || filterTags.every(ft => q.tags.includes(ft))
    )
    .sort((a, b) => {
      if (sortBy === 'votes') {
        return b.voteCount - a.voteCount;
      }
      // Add logic for 'unanswered' if needed
      // Default to newest
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const handleAskQuestion = () => {
    // Navigate to the Ask Question page (implement routing later)
    console.log("Navigate to Ask Question page");
  };

  return (
    <div className="qna-page page-container">
      <div className="qna-header">
        <h1>Questions & Answers</h1>
        <Button onClick={handleAskQuestion} variant="primary">
          <FaPlus /> Ask Question
        </Button>
      </div>

      <div className="qna-controls">
        {/* Basic Search Input */}
        <input
          type="search"
          placeholder="Search questions or tags..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="qna-search-input"
        />
        {/* Add Filter/Sort Dropdowns later */}
        <div className="qna-filter-sort">
             <Button variant="outline" size="small"><FaFilter /> Filter</Button>
             <Button variant="outline" size="small"><FaSortAmountDown /> Sort By: {sortBy}</Button>
             {/* Implement dropdowns for actual filtering/sorting */}
        </div>
      </div>

      <div className="qna-list">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map(question => (
            <QuestionListItem key={question.id} question={question} />
          ))
        ) : (
          <p className="qna-no-results">No questions found matching your criteria.</p>
        )}
      </div>

      {/* Add Pagination later if needed */}
    </div>
  );
};

export default QnAPage;