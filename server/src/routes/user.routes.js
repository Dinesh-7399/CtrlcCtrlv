// server/src/routes/user.routes.js
import express from 'express';
import { param, body } from 'express-validator';
import {
  getUserPublicProfile,
  updateMyProfile,
  // Admin user management controllers are in adminUser.routes.js
} from '../controllers/userController.js'; // Ensure this path is correct
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// --- Validation Rules ---

const userIdParamValidation = [
  param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer.'),
];

// Validation for updating the current user's own profile
const updateMyProfileValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Name cannot be empty if provided.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  // Email is typically not changed here, or if so, requires verification. Handled by auth or admin.

  // Profile specific fields (from UserProfile model)
  body('profileData.bio') // Accessing nested fields
    .optional({ checkFalsy: true })
    .isString().withMessage('Bio must be a string.')
    .trim()
    .isLength({ max: 2000 }).withMessage('Bio cannot exceed 2000 characters.'),
  body('profileData.avatarUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid avatar URL format.'),
  body('profileData.headline')
    .optional({ checkFalsy: true })
    .isString().trim()
    .isLength({ max: 150 }).withMessage('Headline cannot exceed 150 characters.'),
  body('profileData.websiteUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid website URL format.'),
  body('profileData.socialLinks') // Expects an object like { linkedin: "...", github: "..." }
    .optional()
    .isObject().withMessage('Social links must be an object.')
    .custom((value, { req }) => {
        if (value) { // Check if socialLinks object itself exists
            for (const key in value) {
                if (value[key] !== null && value[key] !== '' && (typeof value[key] !== 'string' || !value[key].startsWith('http'))) {
                    throw new Error(`Social link for '${key}' must be a valid URL, an empty string, or null.`);
                }
            }
        }
        return true;
    }),
  body('profileData.experience').optional().isArray().withMessage('Experience must be an array.'),
  body('profileData.education').optional().isArray().withMessage('Education must be an array.'),
  body('profileData.projects').optional().isArray().withMessage('Projects must be an array.'),
  // If profileData itself is optional, wrap all profileData checks:
  body('profileData').optional().isObject().withMessage('Profile data, if provided, must be an object.'),
];


// --- Route Definitions ---

/**
 * @route   GET /api/users/:userId/profile
 * @desc    Get a user's public profile (e.g., for instructors)
 * @access  Public
 */
router.get(
  '/:userId/profile',
  userIdParamValidation,
  handleValidationErrors,
  getUserPublicProfile
);

/**
 * @route   PUT /api/users/me/profile
 * @desc    Update the current authenticated user's profile information
 * @access  Private (Authenticated Users)
 * @body    { name?: string, profileData?: { bio?, avatarUrl?, headline?, websiteUrl?, socialLinks?, experience?, education?, projects? } }
 */
router.put(
  '/me/profile', // Using '/me/profile' to clearly distinguish from admin updates
  authMiddleware,
  updateMyProfileValidation,
  handleValidationErrors,
  updateMyProfile
);

// Note:
// - GET /api/auth/me (in auth.routes.js) fetches basic current user details.
// - PUT /api/users/me/password would typically be in auth.routes.js (or a dedicated password.routes.js).
// - Admin routes for managing ANY user are in adminUser.routes.js.

export default router;
