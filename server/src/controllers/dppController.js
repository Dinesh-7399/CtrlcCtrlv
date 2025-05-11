// server/src/controllers/dppController.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { validationResult } from 'express-validator';

/**
 * @desc    Get DPP details for a specific lesson
 * @route   GET /api/courses/:courseId/lessons/:lessonId/dpp
 * @access  Private (Enrolled Users via enrollmentCheckMiddleware)
 */
export const getDppForLesson = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const numericLessonId = parseInt(lessonId, 10);

    if (isNaN(numericLessonId)) {
      return next(new ApiError(400, 'Invalid Lesson ID format.'));
    }

    // The enrollmentCheckMiddleware has already confirmed user enrollment in the course.
    // We fetch the DPP associated with this lesson.
    // Your Prisma schema has DPP uniquely linked to Lesson.
    const dpp = await prisma.dPP.findUnique({
      where: {
        lessonId: numericLessonId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        content: true, // Additional rich content for the DPP problem
        dueDate: true,
        lesson: { // Include lesson title for context
          select: {
            id: true,
            title: true,
          }
        },
        // Check if the current user has already submitted for this DPP
        submissions: {
          where: {
            userId: req.user.userId, // From authMiddleware
          },
          select: {
            id: true,
            submittedAt: true,
            fileUrl: true,
            originalFileName: true,
            grade: true,
            feedback: true,
          },
          orderBy: {
            submittedAt: 'desc' // Get the latest submission if multiple are allowed (though typically one)
          }
        }
      },
    });

    if (!dpp) {
      return next(new ApiError(404, 'DPP not found for this lesson.'));
    }

    // Simplify submission data, assuming one latest submission is most relevant for display
    const latestSubmission = dpp.submissions.length > 0 ? dpp.submissions[0] : null;

    const responseData = {
        ...dpp,
        submissions: undefined, // Remove the array of submissions
        submission: latestSubmission // Add the single latest submission object
    };


    return res
      .status(200)
      .json(new ApiResponse(200, { dpp: responseData }, 'DPP details fetched successfully.'));

  } catch (error) {
    console.error(`Error fetching DPP for lesson ID '${req.params.lessonId}':`, error);
    if (error.code === 'P2025') { // Prisma: Record to query not found
        return next(new ApiError(404, 'DPP not found for this lesson.'));
    }
    next(new ApiError(500, 'Failed to fetch DPP details.', [error.message]));
  }
};

/**
 * @desc    Submit a solution for a DPP
 * @route   POST /api/courses/:courseId/lessons/:lessonId/dpp/:dppId/submit
 * @access  Private (Enrolled Users)
 */
export const submitDppSolution = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array().map(e => e.msg)));
  }

  const { dppId } = req.params; // dppId is directly from params now
  const numericDppId = parseInt(dppId, 10);
  const userId = req.user.userId; // From authMiddleware

  // fileUrl and originalFileName are expected to be in the request body.
  // This assumes the file was already uploaded by a separate /api/upload endpoint,
  // and the client is now sending the URL of the uploaded file.
  const { fileUrl, originalFileName, submittedContent } = req.body;

  if (isNaN(numericDppId)) {
    return next(new ApiError(400, 'Invalid DPP ID format.'));
  }

  if (!fileUrl && !submittedContent) {
    return next(new ApiError(400, 'Either a file upload or text content is required for submission.'));
  }
  if (fileUrl && !originalFileName) {
    return next(new ApiError(400, 'Original file name is required when a file URL is provided.'));
  }


  try {
    // 1. Verify DPP exists
    const dpp = await prisma.dPP.findUnique({
      where: { id: numericDppId },
    });

    if (!dpp) {
      return next(new ApiError(404, 'DPP not found.'));
    }

    // 2. (Optional) Check for existing submissions if re-submissions are not allowed or limited
    // For this example, we'll allow overriding a previous submission by creating a new one,
    // or you could update an existing one if your logic requires it.
    // A simpler approach is to just create a new one each time and let instructor see history.
    // Or, enforce one submission:
    const existingSubmission = await prisma.dPPSubmission.findFirst({
        where: {
            userId: userId,
            dppId: numericDppId,
        }
    });

    if (existingSubmission) {
        // Option 1: Disallow re-submission
        // return next(new ApiError(409, 'You have already submitted a solution for this DPP.'));
        // Option 2: Update existing submission (more complex if you track versions)
        // For now, let's assume we overwrite or that the frontend handles this by not allowing re-submit if one exists.
        // If allowing multiple, the `getDppForLesson` would show the latest.
        // For simplicity, let's assume a new submission replaces the old one conceptually,
        // or the UI prevents re-submission if one exists and isn't graded/past due.
        // Here, we'll just create a new one. If you want to limit to one, add a unique constraint
        // on (userId, dppId) in your schema and handle the P2002 Prisma error.
    }


    // 3. Create the DPP submission record
    const newSubmission = await prisma.dPPSubmission.create({
      data: {
        userId,
        dppId: numericDppId,
        submittedContent, // For text-based answers
        fileUrl,            // URL from the file upload service
        originalFileName,   // Original name of the uploaded file
        submittedAt: new Date(),
      },
      select: { // Select fields to return
        id: true,
        submittedAt: true,
        fileUrl: true,
        originalFileName: true,
        submittedContent: true,
        dpp: { select: { title: true } },
        user: { select: { name: true } }
      }
    });

    // TODO: Notify instructor (if applicable) about the new submission.

    return res
      .status(201)
      .json(new ApiResponse(201, { submission: newSubmission }, 'DPP solution submitted successfully.'));

  } catch (error) {
    console.error(`Error submitting DPP solution for DPP ID '${dppId}':`, error);
    // Handle specific Prisma errors, e.g., if DPP not found due to foreign key constraint
    if (error.code === 'P2003') { // Foreign key constraint failed
        return next(new ApiError(404, 'Associated DPP or User not found.'));
    }
    next(new ApiError(500, 'Failed to submit DPP solution.', [error.message]));
  }
};
