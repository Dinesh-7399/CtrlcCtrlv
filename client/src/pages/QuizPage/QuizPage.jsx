// client/src/pages/QuizPage/QuizPage.jsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import './QuizPage.css'; // Make sure you have the corresponding CSS file
import { FaQuestionCircle, FaArrowLeft, FaSpinner, FaCheckCircle, FaTimesCircle, FaRedo, FaExclamationTriangle } from 'react-icons/fa';

// --- Redux Imports ---
import { useSelector } from 'react-redux';
// *** Verify these filenames/paths match your actual slice files (likely lowercase) ***
import { selectLessonById, selectQuizForLesson } from '../../features/courses/CoursesSlice.js';
// --- End Redux Imports ---

const QuizPage = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();

    // --- Get Data from Redux ---
    const lesson = useSelector((state) => selectLessonById(state, courseId, lessonId));
    // Assumes selectQuizForLesson selector exists in coursesSlice and works based on convention or updated data
    const quizData = useSelector((state) => selectQuizForLesson(state, courseId, lessonId));
    // --- End Get Data from Redux ---

    // --- Quiz State ---
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // { questionId: selectedOption }
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    // --- Event Handlers ---
    const handleAnswerSelect = (questionId, selectedOption) => {
        if (showResults) return; // Don't allow changes after submitting
        setUserAnswers(prev => ({ ...prev, [questionId]: selectedOption }));
    };

    const handleSubmitQuiz = () => {
        if (!quizData?.questions) return; // Safety check
        let calculatedScore = 0;
        quizData.questions.forEach(q => {
            // Ensure comparison handles potential undefined answers gracefully
            if (userAnswers[q.id] && userAnswers[q.id] === q.answer) {
                calculatedScore++;
            }
        });
        setScore(calculatedScore);
        setShowResults(true);
        window.scrollTo(0, 0); // Scroll to top to show results
    };

    const handleRetakeQuiz = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setScore(0);
        setShowResults(false);
        window.scrollTo(0, 0);
    };

    const handleNextQuestion = () => {
        // Check if quizData and questions array exist before proceeding
        if (quizData?.questions && currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleGoBackToLesson = () => {
        // Navigate back to the specific lesson page
        navigate(`/learn/${courseId}/${lessonId}`);
    };
    // --- End Event Handlers ---

    // --- Render Logic ---

    // Handle case where necessary data isn't found in Redux
    if (!lesson || !quizData) {
        const message = !lesson
            ? `Lesson context (ID: "${lessonId}") could not be loaded.`
            : `Quiz data for Lesson ID "${lessonId}" in Course "${courseId}" not found. Check Redux state, selector logic, or JSON structure/naming.`;
        return (
            <div className="quiz-status quiz-error page-container">
                <FaExclamationTriangle size={40} style={{ marginBottom: 'var(--spacing-md)' }}/>
                <h1>Quiz Data Error</h1>
                <p>{message}</p>
                <Button onClick={handleGoBackToLesson} variant="secondary">
                    <FaArrowLeft className="button-icon"/> Back to Lesson
                </Button>
            </div>
        );
    }

    // Data is likely available, get current question details
    const totalQuestions = quizData.questions.length;
    const currentQuestion = quizData.questions[currentQuestionIndex];

    // Handle edge case if index is somehow invalid (shouldn't happen with checks)
    if (!currentQuestion && !showResults) {
         return <div className="quiz-status">Error loading current question.</div>;
    }

    return (
        <div className="quiz-page-container page-container">
            <Button onClick={handleGoBackToLesson} variant="outline" size="small" className="back-button">
                <FaArrowLeft className="button-icon"/> Back to Lesson
            </Button>

            <h1 className="quiz-page-title">
                <FaQuestionCircle className="title-icon" />
                {quizData.title || `${lesson.title} Quiz`}
            </h1>

            {!showResults ? (
                /* --- Quiz Interface --- */
                <div className="quiz-interface">
                    <div className="quiz-progress">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                    </div>
                     <div className="quiz-question-container card">
                         <h2 className="quiz-question-text">{currentQuestionIndex + 1}. {currentQuestion.question}</h2>
                         <ul className="quiz-options-list">
                             {currentQuestion.options.map((option, index) => {
                                 const questionId = currentQuestion.id;
                                 const isSelected = userAnswers[questionId] === option;
                                 return (
                                     <li key={`${questionId}-opt-${index}`} className="quiz-option-item">
                                         <label className={`quiz-option-label ${isSelected ? 'selected' : ''}`}>
                                             <input
                                                 type="radio"
                                                 name={`question-${questionId}`}
                                                 value={option}
                                                 checked={isSelected}
                                                 onChange={() => handleAnswerSelect(questionId, option)}
                                                 className="quiz-option-radio"
                                             />
                                             {option}
                                         </label>
                                     </li>
                                 );
                             })}
                         </ul>
                     </div>

                    {/* Quiz Navigation */}
                    <div className="quiz-navigation">
                        <Button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0} variant="secondary">
                            Previous
                        </Button>
                        {currentQuestionIndex === totalQuestions - 1 ? (
                            // Disable Submit until the current question is answered
                            <Button onClick={handleSubmitQuiz} variant="primary" disabled={!userAnswers[currentQuestion.id]}>
                                Submit Quiz
                            </Button>
                        ) : (
                            // Disable Next until the current question is answered
                            <Button onClick={handleNextQuestion} disabled={!userAnswers[currentQuestion.id]} variant="primary">
                                Next
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                /* --- Quiz Results --- */
                <div className="quiz-results card">
                    <h2 className="results-title">Quiz Complete!</h2>
                    <p className="results-score">Your Score: {score} out of {totalQuestions} ({((score / totalQuestions) * 100).toFixed(0)}%)</p>
                    <div className="results-summary">
                        <h3 className="summary-heading">Review Your Answers:</h3>
                        {quizData.questions.map((q, index) => (
                            <div key={q.id} className={`results-question ${userAnswers[q.id] === q.answer ? 'correct' : 'incorrect'}`}>
                                <p><strong>Q{index + 1}:</strong> {q.question}</p>
                                <p>Your Answer: {userAnswers[q.id] || <span style={{fontStyle: 'italic', opacity: 0.7}}>Not Answered</span>}
                                  {/* Only show check/cross if answered */}
                                  {userAnswers[q.id] && (
                                      userAnswers[q.id] === q.answer ?
                                        <FaCheckCircle className="result-icon correct" /> :
                                        <FaTimesCircle className="result-icon incorrect" />
                                  )}
                                </p>
                                {/* Show correct answer only if answered incorrectly */}
                                {userAnswers[q.id] && userAnswers[q.id] !== q.answer && <p className="correct-answer">Correct Answer: {q.answer}</p>}
                            </div>
                        ))}
                    </div>
                    <div className="results-actions">
                        <Button onClick={handleRetakeQuiz} variant="secondary">
                           <FaRedo className="button-icon"/> Retake Quiz
                        </Button>
                        <Button onClick={handleGoBackToLesson} variant="primary">
                            Back to Lesson
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizPage;