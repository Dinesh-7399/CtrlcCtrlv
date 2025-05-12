// server/src/middlewares/enrollmentCheckMiddleware.js
import prisma from '../config/db.js';
import ApiError from '../utils/apiError.js';

/**
 * Middleware to check if the authenticated user is enrolled in a specific course.
 * Assumes authMiddleware has already run and req.user is populated.
 * Expects courseId to be present in req.params.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
export const enrollmentCheckMiddleware = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id; // CORRECTED: Was req.user?.userId

    if (!userId) {
      return next(new ApiError(401, 'Authentication required. User not identified.'));
    }

    if (!courseId) {
      return next(new ApiError(400, 'Course ID is missing in request parameters.'));
    }

    const numericCourseId = parseInt(courseId, 10);
    if (isNaN(numericCourseId)) {
        return next(new ApiError(400, 'Invalid Course ID format.'));
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: numericCourseId,
        },
      },
    });

    if (!enrollment) {
      return next(
        new ApiError(
          403, // Forbidden
          'Access denied. You are not enrolled in this course.'
        )
      );
    }
    next();

  } catch (error) {
    console.error('Error in enrollmentCheckMiddleware:', error);
    next(new ApiError(500, 'Failed to verify course enrollment.', [error.message]));
  }
};