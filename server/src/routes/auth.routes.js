// server/src/routes/auth.routes.js
import express from 'express';
import { body, param } from 'express-validator';
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  requestPasswordReset,
  resetPassword,
} from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; // Ensure this correctly verifies JWT and attaches req.user
import { handleValidationErrors } from '../middlewares/validationResultHandler.js'; // Ensure this correctly handles validation errors

const router = express.Router();

const registerValidationRules = [
  body('name').trim().notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.'),
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters.'),
  body('role').optional().isIn(['STUDENT', 'INSTRUCTOR', 'ADMIN']).withMessage('Invalid role specified. Default is STUDENT if not provided.'),
];

const loginValidationRules = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

const requestPasswordResetValidationRules = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
];

const resetPasswordValidationRules = [
  param('token').notEmpty().isString().withMessage('Reset token parameter is required in the URL.'),
  body('password').isLength({ min: 6, max: 128 }).withMessage('New password must be between 6 and 128 characters.'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match.');
    }
    return true;
  }),
];

router.post('/register', registerValidationRules, handleValidationErrors, registerUser);
router.post('/login', loginValidationRules, handleValidationErrors, loginUser);
router.get('/me', authMiddleware, getMe); // authMiddleware protects this route
router.post('/logout', authMiddleware, logoutUser); // authMiddleware protects this route
router.post('/request-password-reset', requestPasswordResetValidationRules, handleValidationErrors, requestPasswordReset);
router.post('/reset-password/:token', resetPasswordValidationRules, handleValidationErrors, resetPassword);

export default router;