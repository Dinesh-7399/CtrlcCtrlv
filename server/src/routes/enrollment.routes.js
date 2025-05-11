// server/src/routes/enrollment.routes.js
import express from 'express';
import { body } from 'express-validator';
import {
  createEnrollment,
  getMyEnrolledCourses,
} from '../controllers/enrollmentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// All routes in this file are for authenticated users
router.use(authMiddleware);

// --- Validation Rules ---

const createEnrollmentValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required.')
    .isInt({ gt: 0 }).withMessage('Course ID must be a positive integer.'),
];

// --- Route Definitions ---

/**
 * @route   POST /api/enrollments
 * @desc    Enroll the current user in a course
 * @access  Private (Authenticated Users)
 * @body    { courseId: number }
 */
router.post(
  '/',
  createEnrollmentValidation,
  handleValidationErrors,
  createEnrollment
);

/**
 * @route   GET /api/enrollments/my-courses
 * @desc    Get all courses the current user is enrolled in
 * @access  Private (Authenticated Users)
 */
router.get(
  '/my-courses',
  // No specific validation needed for this GET request beyond auth
  getMyEnrolledCourses
);

// Future:
// GET /api/enrollments/:enrollmentId - Get details of a specific enrollment (if needed)
// DELETE /api/enrollments/:enrollmentId - Unenroll from a course (if allowed by policy)

export default router;
