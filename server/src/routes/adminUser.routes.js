// server/src/routes/adminUser.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
// Import enums directly
import { Role, UserStatus } from '@prisma/client'; // <<< CORRECT: Direct import
import {
  getAllUsersForAdmin,
  getUserByIdForAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  // You may need to add createUserByAdmin if that's a feature
} from '../controllers/adminUserController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

router.use(authMiddleware(), adminMiddleware); // Ensures only authenticated admins can access these routes

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
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      // Use the directly imported Role enum
      if (!Role || typeof Role !== 'object') {
        console.error("VALIDATOR RUNTIME CHECK: Role enum (direct import) is NOT available.");
        throw new Error('Server configuration error: Role validation unavailable.');
      }
      if (!Object.values(Role).includes(value)) {
        throw new Error(`Invalid role. Must be one of: ${Object.values(Role).join(', ')}`);
      }
      return true;
    }),
  body('status')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      // Use the directly imported UserStatus enum
      if (!UserStatus || typeof UserStatus !== 'object') {
        console.error("VALIDATOR RUNTIME CHECK: UserStatus enum (direct import) is NOT available.");
        throw new Error('Server configuration error: UserStatus validation unavailable.');
      }
      if (!Object.values(UserStatus).includes(value)) {
        throw new Error(`Invalid status. Must be one of: ${Object.values(UserStatus).join(', ')}`);
      }
      return true;
    }),
  body('profileData').optional().isObject().withMessage('Profile data must be an object.'),
  body('profileData.bio').optional({ checkFalsy: true }).isString().trim().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters.'),
  body('profileData.website').optional({ checkFalsy: true }).isURL().withMessage('Invalid website URL.'),
  body('profileData.avatarUrl').optional({ checkFalsy: true }).isURL().withMessage('Invalid avatar URL.'),
  body('profileData.headline').optional({ checkFalsy: true }).isString().trim().isLength({ max: 150 }).withMessage('Headline cannot exceed 150 characters.'),
];

const getAllUsersAdminValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.').toInt(),
    query('role').optional().toUpperCase().custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        if (!Role) throw new Error('Server Error: Role enum not available.');
        if (!Object.values(Role).includes(value)) throw new Error('Invalid role filter.');
        return true;
    }),
    query('status').optional().toUpperCase().custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        if (!UserStatus) throw new Error('Server Error: UserStatus enum not available.');
        if (!Object.values(UserStatus).includes(value)) throw new Error('Invalid status filter.');
        return true;
    }),
    query('searchTerm').optional().isString().trim(),
    query('sortBy').optional().isString().isIn(['createdAt_desc', 'createdAt_asc', 'name_asc', 'name_desc', 'email_asc', 'email_desc', 'role_asc', 'role_desc'])
        .withMessage('Invalid sort option.'),
];

// --- Route Definitions ---
router.get('/', getAllUsersAdminValidation, handleValidationErrors, getAllUsersForAdmin);
router.get('/:userId', userIdValidation, handleValidationErrors, getUserByIdForAdmin);
router.put('/:userId', userIdValidation, updateUserValidationRules, handleValidationErrors, updateUserByAdmin);
router.delete('/:userId', userIdValidation, handleValidationErrors, deleteUserByAdmin);
// Consider adding a POST route for creating users if admins can do that, e.g.:
// router.post('/', createUserValidationRules, handleValidationErrors, createUserByAdmin);


export default router;