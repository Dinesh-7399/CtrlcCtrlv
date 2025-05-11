// server/src/routes/auth.routes.js
import express from 'express';
import { body, param } from 'express-validator'; // Import validation functions
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  requestPasswordReset,
  resetPassword,
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; // To protect /me and /logout
import { handleValidationErrors } from '../middlewares/validationResultHandler.js'; // You'll create this

const router = express.Router();

// --- Validation Rules ---

const registerValidationRules = [
  body('name').trim().notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters.'),
  // Optional: Add role validation if admin can create users with specific roles, otherwise role defaults in controller
  // body('role').optional().isIn(['STUDENT', 'INSTRUCTOR', 'ADMIN']).withMessage('Invalid role specified.'),
];

const loginValidationRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const requestPasswordResetValidationRules = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address.'),
];

const resetPasswordValidationRules = [
  param('token').notEmpty().isString().withMessage('Reset token is required.'), // Assuming token is in URL param
  body('password').isLength({ min: 6, max: 128 }).withMessage('New password must be between 6 and 128 characters.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match.');
    }
    return true;
  }),
];


// --- Route Definitions ---

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidationRules, handleValidationErrors, registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginValidationRules, handleValidationErrors, loginUser);

// @route   GET /api/auth/me
// @desc    Get current logged-in user details
// @access  Private
router.get('/me', authMiddleware, getMe);

// @route   POST /api/auth/logout
// @desc    Log user out
// @access  Private
router.post('/logout', authMiddleware, logoutUser);

// @route   POST /api/auth/request-password-reset
// @desc    Request a password reset link/token
// @access  Public
router.post('/request-password-reset', requestPasswordResetValidationRules, handleValidationErrors, requestPasswordReset);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using a token
// @access  Public
router.post('/reset-password/:token', resetPasswordValidationRules, handleValidationErrors, resetPassword);


export default router;
