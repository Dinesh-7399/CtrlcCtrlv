// server/src/controllers/quizController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get quiz details (questions and options) for a specific lesson
 * @route   GET /api/lessons/:lessonId/quiz (or /api/courses/:courseId/lessons/:lessonId/quiz)
 * @access  Private (Enrolled Users - via authMiddleware & enrollmentCheckMiddleware)
 */
export const getQuizForLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const numericLessonId = parseInt(lessonId, 10);

    if (isNaN(numericLessonId)) {
      return next(new ApiError(400, 'Invalid Lesson ID format.'));
    }

    // enrollmentCheckMiddleware should have verified user's enrollment in the course for this lesson.

    const quiz = await prisma.quiz.findUnique({
      where: {
        lessonId: numericLessonId,
      },
      select: {
        id: true,
        title: true,
        lessonId: true,
        passingScore: true,
        questions: {
          orderBy: {
            // Add an 'order' field to Question model if specific question order is needed
            // For now, let's assume order by ID or creation time is acceptable
            id: 'asc',
          },
          select: {
            id: true,
            text: true,
            type: true, // e.g., 'MULTIPLE_CHOICE'
            options: true, // Frontend will parse this JSON
            // IMPORTANT: DO NOT send correctAnswer to the client when fetching questions
          },
        },
        // Check if the current user has already submitted this quiz
        submissions: {
            where: {
                userId: req.user.userId, // from authMiddleware
            },
            select: {
                id: true,
                submittedAt: true,
                score: true,
                passed: true,
                answers: true, // To show previous answers if re-displaying results
            },
            orderBy: {
                submittedAt: 'desc' // Get the latest submission
            },
            take: 1 // Only the most recent submission
        }
      },
    });

    if (!quiz) {
      return next(new ApiError(404, 'Quiz not found for this lesson.'));
    }
    
    // Prepare the response
    const latestSubmission = quiz.submissions.length > 0 ? quiz.submissions[0] : null;
    const responseData = {
        ...quiz,
        questions: quiz.questions.map(q => ({ ...q, options: q.options || [] })), // Ensure options is an array
        submission: latestSubmission, // Add the user's latest submission if it exists
        submissions: undefined, // Remove the submissions array from the main quiz object
    };


    return res
      .status(200)
      .json(new ApiResponse(200, { quiz: responseData }, 'Quiz details fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching quiz for lesson ID '${req.params.lessonId}':`, error);
    if (error.code === 'P2025') { // Prisma: Record to query not found
        return next(new ApiError(404, 'Quiz not found for this lesson.'));
    }
    next(new ApiError(500, 'Failed to fetch quiz details.', [error.message]));
  }
};

/**
 * @desc    Submit answers for a quiz and get the score
 * @route   POST /api/quizzes/:quizId/submit
 * @access  Private (Enrolled Users)
 * @body    { answers: { questionId1: "selectedOption", questionId2: "selectedOption" } }
 */
export const submitQuizAnswers = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { quizId } = req.params;
  const numericQuizId = parseInt(quizId, 10);
  const userId = req.user.userId; // From authMiddleware
  const { answers: userAnswers } = req.body; // userAnswers is an object: { questionId: answer }

  if (isNaN(numericQuizId)) {
    return next(new ApiError(400, 'Invalid Quiz ID format.'));
  }

  if (!userAnswers || typeof userAnswers !== 'object' || Object.keys(userAnswers).length === 0) {
    return next(new ApiError(400, 'No answers provided or invalid format.'));
  }

  try {
    // 1. Fetch the quiz with its questions and correct answers
    const quizWithCorrectAnswers = await prisma.quiz.findUnique({
      where: { id: numericQuizId },
      include: {
        questions: {
          select: {
            id: true,
            correctAnswer: true, // Fetch correct answers for scoring
            // type: true, // If scoring logic depends on question type
          },
        },
        lesson: { // To verify enrollment via course
            select: { module: { select: { courseId: true } } }
        }
      },
    });

    if (!quizWithCorrectAnswers) {
      return next(new ApiError(404, `Quiz with ID ${numericQuizId} not found.`));
    }

    // 1.5 Verify enrollment (if not handled by a generic enrollment middleware for the quiz itself)
    // This assumes the quiz is part of a lesson which is part of a course.
    const courseIdForQuiz = quizWithCorrectAnswers.lesson?.module?.courseId;
    if (courseIdForQuiz) {
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId: courseIdForQuiz } }
        });
        if (!enrollment) {
            return next(new ApiError(403, 'You are not enrolled in the course for this quiz.'));
        }
    } else {
        // If quiz is not tied to a course (e.g. platform-wide quiz), this check might be skipped or different.
        console.warn(`Quiz ${numericQuizId} is not associated with a course. Skipping enrollment check for submission.`);
    }


    // 2. (Optional) Check if user has already submitted and if re-submissions are allowed
    const existingSubmission = await prisma.quizSubmission.findFirst({
        where: { userId, quizId: numericQuizId },
        orderBy: { submittedAt: 'desc' }
    });

    if (existingSubmission /* && !ALLOW_RETAKES */) {
        // For now, let's assume we allow re-takes, or the frontend controls this.
        // If not allowing retakes, you could return an error or the previous result.
        // return next(new ApiError(409, 'You have already submitted this quiz.'));
        console.log(`User ${userId} is re-submitting quiz ${numericQuizId}. Previous submission ID: ${existingSubmission.id}`);
    }

    // 3. Calculate score
    let score = 0;
    let detailedResults = []; // To store per-question correctness

    quizWithCorrectAnswers.questions.forEach(question => {
      const userAnswer = userAnswers[question.id.toString()]; // Ensure questionId from userAnswers is string if keys are strings
      const isCorrect = userAnswer === question.correctAnswer; // Basic equality check. For JSON answers, deep equality might be needed.
      
      if (isCorrect) {
        score++;
      }
      detailedResults.push({
        questionId: question.id,
        userAnswer: userAnswer || null,
        correctAnswer: question.correctAnswer,
        isCorrect,
      });
    });

    const totalQuestions = quizWithCorrectAnswers.questions.length;
    const percentageScore = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
    const passed = quizWithCorrectAnswers.passingScore ? percentageScore >= quizWithCorrectAnswers.passingScore : null;

    // 4. Store the submission
    const newSubmission = await prisma.quizSubmission.create({
      data: {
        userId,
        quizId: numericQuizId,
        answers: userAnswers, // Store the user's answers object
        score: parseFloat(percentageScore.toFixed(2)), // Store as percentage
        passed,
        submittedAt: new Date(),
      },
    });

    // 5. Update UserProgress for the lesson associated with this quiz if passed
    if (passed && quizWithCorrectAnswers.lessonId) {
        await prisma.userProgress.upsert({
            where: { userId_lessonId: { userId, lessonId: quizWithCorrectAnswers.lessonId } },
            update: { completed: true, completedAt: new Date() },
            create: { userId, lessonId: quizWithCorrectAnswers.lessonId, completed: true, completedAt: new Date() }
        });
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          submissionId: newSubmission.id,
          score: newSubmission.score,
          totalQuestions,
          correctAnswers: score,
          passed,
          detailedResults, // Send back detailed results for review
        },
        'Quiz submitted successfully. Results calculated.'
      )
    );

  } catch (error) {
    console.error(`Error submitting quiz ID '${quizId}':`, error);
    if (error.code === 'P2003') {
        return next(new ApiError(404, 'Invalid quiz or user ID for submission.'));
    }
    next(new ApiError(500, 'Failed to submit quiz.', [error.message]));
  }
};
