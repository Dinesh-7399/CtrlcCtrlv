// server/src/routes/adminUser.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllUsersForAdmin,
  getUserByIdForAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
} from '../controllers/adminUserController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';
import { Role, UserStatus } from '@prisma/client'; // Import enums for validation

const router = express.Router();

// All routes in this file are for admins and should be protected
router.use(authMiddleware, adminMiddleware);

// --- Validation Rules ---

const userIdValidation = [
  param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer.'),
];

const updateUserValidationRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty if provided.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email')
    .optional()
    .isEmail().normalizeEmail().withMessage('Please provide a valid email address if updating.'),
  body('role')
    .optional()
    .isIn(Object.values(Role))
    .withMessage(`Invalid role. Must be one of: ${Object.values(Role).join(', ')}`),
  body('status')
    .optional()
    .isIn(Object.values(UserStatus))
    .withMessage(`Invalid status. Must be one of: ${Object.values(UserStatus).join(', ')}`),
  // profileData is an object, specific fields within it can be validated if needed,
  // but for now, we'll just check if it's an object if provided.
  body('profileData')
    .optional()
    .isObject().withMessage('Profile data must be an object.'),
  body('profileData.bio').optional({checkFalsy: true}).isString().trim().isLength({max: 1000}).withMessage('Bio cannot exceed 1000 characters.'),
  body('profileData.avatarUrl').optional({checkFalsy: true}).isURL().withMessage('Invalid avatar URL.'),
  body('profileData.headline').optional({checkFalsy: true}).isString().trim().isLength({max: 150}).withMessage('Headline cannot exceed 150 characters.'),
  body('profileData.websiteUrl').optional({checkFalsy: true}).isURL().withMessage('Invalid website URL.'),
  body('profileData.socialLinks').optional().isObject().withMessage('Social links must be an object.'),
  body('profileData.experience').optional().isArray().withMessage('Experience must be an array.'),
  body('profileData.education').optional().isArray().withMessage('Education must be an array.'),
  body('profileData.projects').optional().isArray().withMessage('Projects must be an array.'),
];

const getAllUsersAdminValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('role').optional().isIn(Object.values(Role)).withMessage('Invalid role filter.'),
    query('status').optional().isIn(Object.values(UserStatus)).withMessage('Invalid status filter.'),
    query('searchTerm').optional().isString().trim(),
    query('sortBy').optional().isString().isIn(['createdAt_desc', 'createdAt_asc', 'name_asc', 'name_desc', 'email_asc', 'email_desc', 'role_asc', 'role_desc']),
];


// --- Route Definitions ---

/**
 * @route   GET /api/admin/users
 * @desc    Admin: Get all users (with filters and pagination)
 * @access  Private (Admin)
 */
router.get('/', getAllUsersAdminValidation, handleValidationErrors, getAllUsersForAdmin);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Admin: Get a single user by ID
 * @access  Private (Admin)
 */
router.get('/:userId', userIdValidation, handleValidationErrors, getUserByIdForAdmin);

/**
 * @route   PUT /api/admin/users/:userId
 * @desc    Admin: Update a user's details (role, status, name, email, profile)
 * @access  Private (Admin)
 */
router.put('/:userId', userIdValidation, updateUserValidationRules, handleValidationErrors, updateUserByAdmin);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Admin: Delete a user
 * @access  Private (Admin)
 */
router.delete('/:userId', userIdValidation, handleValidationErrors, deleteUserByAdmin);

export default router;
