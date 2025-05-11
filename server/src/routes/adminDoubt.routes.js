// server/src/routes/adminDoubt.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllDoubtsForAdmin,
  getDoubtByIdForAdmin,
  updateDoubtStatusByAdmin,
  assignInstructorToDoubtByAdmin,
  deleteDoubtMessageByAdmin,
  deleteDoubtThreadByAdmin,
} from '../controllers/adminDoubtController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';
import { DoubtStatus } from '@prisma/client'; // Import enums for validation

const router = express.Router();

// All routes in this file are for admins and should be protected
router.use(authMiddleware, adminMiddleware);

// --- Validation Rules ---

const doubtIdValidation = [
  param('doubtId').isInt({ gt: 0 }).withMessage('Doubt ID must be a positive integer.'),
];

const messageIdValidation = [
  param('messageId').isInt({ gt: 0 }).withMessage('Message ID must be a positive integer.'),
];

const updateStatusValidation = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required.')
    .isIn(Object.values(DoubtStatus))
    .withMessage(`Invalid status. Must be one of: ${Object.values(DoubtStatus).join(', ')}`),
];

const assignInstructorValidation = [
  // instructorId can be a number or explicitly null/empty to unassign
  body('instructorId')
    .custom((value) => {
      if (value === null || value === '' || (typeof value === 'number' && value > 0)) {
        return true;
      }
      if (typeof value === 'string' && parseInt(value, 10) > 0) return true; // Allow string number
      if (value !== undefined && value !== null && value !== '') { // only error if a value is present and invalid
        throw new Error('Instructor ID must be a positive integer, null, or an empty string to unassign.');
      }
      return true; // If undefined, it's okay (controller handles no change)
    })
    .toInt() // Convert to integer if it's a numeric string
    .optional({ checkFalsy: true }), // Allows null or empty string to pass if provided
];


const getAllDoubtsAdminValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('courseId').optional().isInt({ gt: 0 }).withMessage('Course ID filter must be a positive integer.'),
    query('lessonId').optional().isInt({ gt: 0 }).withMessage('Lesson ID filter must be a positive integer.'),
    query('userId').optional().isInt({ gt: 0 }).withMessage('User ID filter must be a positive integer.'),
    query('assignedInstructorId').optional()
        .custom(value => value.toLowerCase() === 'unassigned' || /^\d+$/.test(value))
        .withMessage('Assigned Instructor ID must be a positive integer or "unassigned".'),
    query('status').optional().isIn(Object.values(DoubtStatus)).withMessage('Invalid status filter.'),
    query('searchTerm').optional().isString().trim(),
    query('sortBy').optional().isString().isIn(['newest', 'oldest', 'lastUpdated']),
];


// --- Route Definitions ---

/**
 * @route   GET /api/admin/doubts
 * @desc    Admin: Get all doubts (with filtering and pagination)
 * @access  Private (Admin)
 */
router.get('/', getAllDoubtsAdminValidation, handleValidationErrors, getAllDoubtsForAdmin);

/**
 * @route   GET /api/admin/doubts/:doubtId
 * @desc    Admin: Get a single doubt by ID, including its messages
 * @access  Private (Admin)
 */
router.get('/:doubtId', doubtIdValidation, handleValidationErrors, getDoubtByIdForAdmin);

/**
 * @route   PUT /api/admin/doubts/:doubtId/status
 * @desc    Admin: Update the status of a doubt
 * @access  Private (Admin)
 */
router.put('/:doubtId/status', doubtIdValidation, updateStatusValidation, handleValidationErrors, updateDoubtStatusByAdmin);

/**
 * @route   PUT /api/admin/doubts/:doubtId/assign
 * @desc    Admin: Assign an instructor to a doubt (or unassign if instructorId is null/empty)
 * @access  Private (Admin)
 */
router.put('/:doubtId/assign', doubtIdValidation, assignInstructorValidation, handleValidationErrors, assignInstructorToDoubtByAdmin);

/**
 * @route   DELETE /api/admin/doubts/:doubtId/messages/:messageId
 * @desc    Admin: Delete a specific message from a doubt thread
 * @access  Private (Admin)
 */
router.delete('/:doubtId/messages/:messageId', doubtIdValidation, messageIdValidation, handleValidationErrors, deleteDoubtMessageByAdmin);

/**
 * @route   DELETE /api/admin/doubts/:doubtId
 * @desc    Admin: Delete an entire doubt thread
 * @access  Private (Admin)
 */
router.delete('/:doubtId', doubtIdValidation, handleValidationErrors, deleteDoubtThreadByAdmin);

export default router;
