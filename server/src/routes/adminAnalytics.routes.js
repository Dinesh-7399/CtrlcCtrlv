// server/src/routes/adminAnalytics.routes.js
import express from 'express';
import { query } from 'express-validator'; // For validating query parameters if needed

import {
  getPlatformStats,
  getUserRegistrationTrends,
  getEnrollmentOverview,
  // Import other analytics controller functions as you create them
} from '../controllers/adminAnalyticsController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// All routes in this file are for admins and should be protected
router.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/admin/analytics/stats
 * @desc    Get key platform statistics for the admin dashboard
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  // Optional: Add validation for any query parameters (e.g., date ranges)
  // [
  //   query('startDate').optional().isISO8601().toDate().withMessage('Invalid start date format.'),
  //   query('endDate').optional().isISO8601().toDate().withMessage('Invalid end date format.'),
  // ],
  // handleValidationErrors, // Uncomment if validation rules are added
  getPlatformStats
);

/**
 * @route   GET /api/admin/analytics/user-trends
 * @desc    Get data for user registration trends
 * @access  Private (Admin)
 */
router.get(
  '/user-trends',
  // Optional: Validation for query params like 'period=monthly&last=12'
  getUserRegistrationTrends
);

/**
 * @route   GET /api/admin/analytics/enrollment-overview
 * @desc    Get data for course enrollment overview (e.g., by category)
 * @access  Private (Admin)
 */
router.get(
  '/enrollment-overview',
  // Optional: Validation for query params
  getEnrollmentOverview
);

// Add more routes for other analytics data as needed
// Example:
// router.get('/revenue-trends', getRevenueTrendsController);
// router.get('/top-courses', getTopCoursesController);

export default router;
