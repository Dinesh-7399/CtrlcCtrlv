// server/src/routes/auth.routes.js

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
// Import BOTH controller functions now
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';

const router = Router();

// --- Validation Rules ---
const registerValidationRules = [
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.').trim(),
  body('name').optional({ checkFalsy: true }).isString().withMessage('Name must be a string.').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
];

const loginValidationRules = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.') // Just check if it's not empty for login
    .trim()
];

// --- Routes ---

// POST /api/auth/register
router.post('/register', registerValidationRules, registerUser);

// POST /api/auth/login  <-- NEW ROUTE
router.post('/login', loginValidationRules, loginUser);

router.post('/logout', logoutUser);
export default router;