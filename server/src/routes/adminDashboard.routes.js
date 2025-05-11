// server/src/routes/adminDashboard.routes.js
import express from 'express';
// import { query } from 'express-validator'; // For validating query parameters if you add date filters etc.

import {
  getDashboardOverviewStats,
  // Import other dashboard-specific controller functions if you create them
} from '../controllers/adminDashboardController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// All routes in this file are for admins and should be protected
router.use(authMiddleware, adminMiddleware);

/**
 * @route   GET /api/admin/dashboard/stats  (or just /api/admin/dashboard/ if this is the primary route)
 * @desc    Get overview statistics for the admin dashboard
 * @access  Private (Admin)
 */
router.get(
  '/stats', // Or use '/' if this router is mounted at /api/admin/dashboard
  // Optional: Add validation for any query parameters like date ranges
  // [
  //   query('period').optional().isIn(['7d', '30d', '90d', 'year']).withMessage('Invalid period specified.'),
  // ],
  // handleValidationErrors, // Uncomment if validation rules are added
  getDashboardOverviewStats
);

// You could add more specific dashboard-related routes here if needed, for example:
// router.get('/recent-activity', getRecentActivityController);
// router.get('/pending-approvals', getPendingApprovalsController);

export default router;
