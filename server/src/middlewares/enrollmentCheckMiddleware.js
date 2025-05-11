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
    const userId = req.user?.userId; // From authMiddleware

    if (!userId) {
      // This should ideally be caught by authMiddleware, but as a safeguard:
      return next(new ApiError(401, 'Authentication required. User not identified.'));
    }

    if (!courseId) {
      return next(new ApiError(400, 'Course ID is missing in request parameters.'));
    }

    // Convert courseId to integer if it's coming as a string from params
    const numericCourseId = parseInt(courseId, 10);
    if (isNaN(numericCourseId)) {
        return next(new ApiError(400, 'Invalid Course ID format.'));
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        // Prisma's unique constraint name is @@unique([userId, courseId])
        // So, the field name for the compound unique index is userId_courseId
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

    // User is enrolled, proceed to the next handler
    // Optionally, attach enrollment details to req if needed by subsequent handlers
    // req.enrollment = enrollment;
    next();

  } catch (error) {
    console.error('Error in enrollmentCheckMiddleware:', error);
    next(new ApiError(500, 'Failed to verify course enrollment.', [error.message]));
  }
};
