// client/src/pages/QuizPage/QuizPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import './QuizPage.css';
import { FaQuestionCircle, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaRedo, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

import { useSelector, useDispatch } from 'react-redux';
import {
    selectLessonById,
    selectQuizForLesson,
    fetchCourseDetails,
    selectCourseDetailsStatus, // Corrected: Was selectCourseDetailsLoadingStatus
    selectCourseDetailsError
} from '../../features/courses/CoursesSlice.js';
import {
    submitQuiz,
    resetQuizState,
    selectQuizSubmissionStatus,
    selectQuizSubmissionError,
    selectQuizResult,
    selectQuizSuccessMessage // Assuming you add this selector to quizSlice for success messages
} from '../../features/quiz/quizSlice';

const QuizPage = () => {
    const { courseId, lessonId, quizId: quizIdFromParams } = useParams(); // Assuming quizId might come from params for specific quiz linking
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const lesson = useSelector((state) => selectLessonById(state, courseId, lessonId));
    // If quizData is directly on lesson, use that. Otherwise, quizIdFromParams might be needed.
    const quizDataFromCourseSlice = useSelector((state) => selectQuizForLesson(state, courseId, lessonId));
    const courseDataStatus = useSelector(selectCourseDetailsStatus); // Corrected usage
    const courseDataError = useSelector(selectCourseDetailsError);
    const isLoadingCourseData = courseDataStatus === 'loading' || courseDataStatus === 'idle'; // Derive boolean

    const submissionStatus = useSelector(selectQuizSubmissionStatus);
    const submissionError = useSelector(selectQuizSubmissionError);
    const quizResult = useSelector(selectQuizResult);
    const successMessage = useSelector(selectQuizSuccessMessage); // Get success message

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const showResults = submissionStatus === 'succeeded' && !!quizResult;

    useEffect(() => {
        if (courseId && (!lesson || !quizDataFromCourseSlice || courseDataStatus === 'idle' || (courseDataStatus === 'failed' && !quizDataFromCourseSlice))) {
            dispatch(fetchCourseDetails(courseId));
        }
    }, [dispatch, courseId, lesson, quizDataFromCourseSlice, courseDataStatus]);

    useEffect(() => {
        dispatch(resetQuizState());
        return () => {
            dispatch(resetQuizState());
        };
    }, [dispatch, courseId, lessonId, quizIdFromParams]); // Reset if quiz context changes

    const handleAnswerSelect = (questionId, selectedOption) => {
        if (showResults || submissionStatus === 'submitting') return;
        setUserAnswers(prev => ({ ...prev, [questionId]: selectedOption }));
    };

    const handleSubmitQuiz = () => {
        if (!quizDataFromCourseSlice?.questions || Object.keys(userAnswers).length === 0 ) { // Allow submission even if not all answered, backend can validate
            alert("Please answer at least one question before submitting or ensure questions are loaded.");
            return;
        }
        // Ensure quizDataFromCourseSlice and its ID are valid
        if (!quizDataFromCourseSlice || !quizDataFromCourseSlice.id) {
            alert("Quiz data is missing. Cannot submit.");
            return;
        }
        dispatch(submitQuiz({
            quizId: quizDataFromCourseSlice.id,
            courseId: parseInt(courseId),
            lessonId: parseInt(lessonId),
            answers: userAnswers
        }));
    };

    const handleRetakeQuiz = () => {
        dispatch(resetQuizState());
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        window.scrollTo(0, 0);
    };

    const handleNextQuestion = () => {
        if (quizDataFromCourseSlice?.questions && currentQuestionIndex < quizDataFromCourseSlice.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => { // Corrected logic for previous
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1); // Decrement for previous
        }
    };

    const handleGoBackToLesson = () => navigate(`/learn/<span class="math-inline">\{courseId\}/</span>{lessonId}`);

    if (isLoadingCourseData && !quizDataFromCourseSlice) {
      return (
          <div className="quiz-status page-container">
              <Spinner label="Loading quiz..." size="large"/>
          </div>
      );
    }

    if (courseDataError && !quizDataFromCourseSlice && courseDataStatus === 'failed') {
        let message = typeof courseDataError === 'string' ? courseDataError : "Error loading course data for quiz.";
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

    if (!lesson && !isLoadingCourseData) {
         return (
             <div className="quiz-status quiz-error page-container">
                 <FaExclamationTriangle size={40} style={{ marginBottom: 'var(--spacing-md)' }} />
                 <h1>Lesson Not Found</h1>
                 <p>The lesson (ID: "{lessonId}") associated with this quiz could not be found.</p>
                 <Button onClick={handleGoBackToLesson} variant="secondary">Back to Learning</Button>
             </div>
         );
     }

    if (!quizDataFromCourseSlice && !isLoadingCourseData && lesson) { // Lesson found, but no quiz data
        return (
             <div className="quiz-status quiz-error page-container">
                 <FaInfoCircle size={40} style={{ marginBottom: 'var(--spacing-md)' }}/>
                 <h1>Quiz Not Available</h1>
                 <p>There is no quiz associated with the lesson "{lesson?.title}".</p>
                 <Button onClick={handleGoBackToLesson} variant="secondary">
                     <FaArrowLeft className="button-icon"/> Back to Lesson
                 </Button>
             </div>
         );
    }
     // This check needs quizDataFromCourseSlice to be defined
    if (!quizDataFromCourseSlice || !quizDataFromCourseSlice.questions || quizDataFromCourseSlice.questions.length === 0 && !showResults) {
        return (
            <div className="quiz-status page-container">
                <FaInfoCircle size={40} style={{ marginBottom: 'var(--spacing-md)' }}/>
                <h1>No Questions</h1>
                <p>This quiz currently has no questions.</p>
                 <Button onClick={handleGoBackToLesson} variant="secondary">
                     <FaArrowLeft className="button-icon"/> Back to Lesson
                 </Button>
            </div>
        );
    }


    const totalQuestions = quizDataFromCourseSlice.questions.length;
    const currentQuestion = quizDataFromCourseSlice.questions[currentQuestionIndex];

    if (!currentQuestion && !showResults && totalQuestions > 0) {
         return (
            <div className="quiz-status quiz-error page-container">
                <FaExclamationTriangle size={40} style={{ marginBottom: 'var(--spacing-md)' }}/>
                <h1>Error</h1>
                <p>Could not load the current question. The quiz might be empty or there was an issue.</p>
                <Button onClick={handleGoBackToLesson} variant="secondary">
                     <FaArrowLeft className="button-icon"/> Back to Lesson
                 </Button>
            </div>
        );
    }


    return (
        <div className="quiz-page-container page-container">
            <Button onClick={handleGoBackToLesson} variant="outline" size="small" className="back-button">
                <FaArrowLeft className="button-icon"/> Back to Lesson
            </Button>

            <h1 className="quiz-page-title">
                <FaQuestionCircle className="title-icon" />
                {quizDataFromCourseSlice.title || `${lesson?.title || 'Lesson'} Quiz`}
            </h1>

            {submissionStatus === 'failed' && submissionError && (
                <p className="form-message error quiz-submission-error">
                    <FaExclamationTriangle /> Submission failed: {typeof submissionError === 'string' ? submissionError : "Please try again."}
                </p>
            )}
            {/* Display success message from Redux */}
             {submissionStatus === 'succeeded' && successMessage && !showResults && (
                 <p className="form-message success" style={{textAlign: 'center', marginTop: 'var(--spacing-sm)'}}>
                     <FaCheckCircle /> {successMessage}
                 </p>
             )}


            {!showResults ? (
                currentQuestion && ( // Ensure currentQuestion is defined
                <div className="quiz-interface">
                        <div className="quiz-progress">
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                        </div>
                        <div className="quiz-question-container card">
                            <h2 className="quiz-question-text">{currentQuestionIndex + 1}. {currentQuestion.question}</h2>
                            <ul className="quiz-options-list">
                                {currentQuestion.options.map((option, index) => {
                                    const questionId = currentQuestion.id || currentQuestion.tempId; // Use tempId if permanent id is not yet assigned
                                    const isSelected = userAnswers[questionId] === option;
                                    return (
                                        <li key={`<span class="math-inline">\{questionId\}\-opt\-</span>{index}`} className="quiz-option-item">
                                            <label className={`quiz-option-label ${isSelected ? 'selected' : ''} ${submissionStatus === 'submitting' ? 'disabled' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name={`question-${questionId}`}
                                                    value={option}
                                                    checked={isSelected}
                                                    onChange={() => handleAnswerSelect(questionId, option)}
                                                    className="quiz-option-radio"
                                                    disabled={submissionStatus === 'submitting'}
                                                />
                                                {option}
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="quiz-navigation">
                            <Button onClick={handlePrevQuestion} disabled={currentQuestionIndex === 0 || submissionStatus === 'submitting'} variant="secondary">
                                Previous
                            </Button>
                            {currentQuestionIndex === totalQuestions - 1 ? (
                                <Button onClick={handleSubmitQuiz} variant="primary" disabled={!userAnswers[currentQuestion.id || currentQuestion.tempId] || submissionStatus === 'submitting'}>
                                    {submissionStatus === 'submitting' ? <Spinner size="small" /> : "Submit Quiz"}
                                </Button>
                            ) : (
                                <Button onClick={handleNextQuestion} disabled={!userAnswers[currentQuestion.id || currentQuestion.tempId] || submissionStatus === 'submitting'} variant="primary">
                                    Next
                                </Button>
                            )}
                        </div>
                </div>
                )
            ) : (
                quizResult && (
                    <div className="quiz-results card">
                        <h2 className="results-title">Quiz Complete!</h2>
                        <p className="results-score">Your Score: {quizResult.score} out of {quizResult.totalQuestions} ({((quizResult.score / quizResult.totalQuestions) * 100).toFixed(0)}%)</p>
                        {/* Display success message from Redux if not shown before results */}
                        {successMessage && (
                             <p className="form-message success" style={{textAlign: 'center', marginTop: 'var(--spacing-sm)'}}>
                                 <FaCheckCircle /> {successMessage}
                             </p>
                         )}
                        <div className="results-summary">
                            <h3 className="summary-heading">Review Your Answers:</h3>
                            {(quizResult.gradedAnswers || quizDataFromCourseSlice.questions).map((q, index) => {
                                // Adapt based on the structure of gradedAnswers from your backend
                                const questionText = quizResult.gradedAnswers ? q.questionText : q.question;
                                const questionActualId = q.id || q.questionId || (quizDataFromCourseSlice.questions[index] ? quizDataFromCourseSlice.questions[index].id : `q-${index}`);
                                const userAnswer = quizResult.gradedAnswers ? q.selectedAnswer : userAnswers[questionActualId];
                                const correctAnswer = quizResult.gradedAnswers ? q.correctAnswer : q.answer; // Assuming 'answer' is the correct field in original quizData
                                const isCorrect = quizResult.gradedAnswers ? q.isCorrect : userAnswer === correctAnswer;

                                return (
                                    <div key={questionActualId} className={`results-question ${isCorrect ? 'correct' : 'incorrect'}`}>
                                        <p><strong>Q{index + 1}:</strong> {questionText}</p>
                                        <p>Your Answer: {userAnswer || <span style={{fontStyle: 'italic', opacity: 0.7}}>Not Answered</span>}
                                          {userAnswer && (isCorrect ?
                                                <FaCheckCircle className="result-icon correct" /> :
                                                <FaTimesCircle className="result-icon incorrect" />
                                          )}
                                        </p>
                                        {!isCorrect && userAnswer && <p className="correct-answer">Correct Answer: {correctAnswer}</p>}
                                    </div>
                                );
                            })}
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
                )
            )}
        </div>
    );
};

export default QuizPage;