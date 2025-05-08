// server/src/routes/adminUser.routes.js

import { Router } from 'express';
import { param, body, query } from 'express-validator';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js'; // Adjust the import path as needed
import {
    adminGetAllUsers,
    adminGetUserById,
    adminUpdateUser,
    adminDeleteUser,
    // adminCreateUser // Optional: Add later if needed
} from '../controllers/adminUserController.js'; // Create this controller next

const router = Router();

// --- Validation Rules ---
const userIdParamValidation = [
    param('userId').isInt({ gt: 0 }).withMessage('User ID must be a positive integer.')
];

const userUpdateValidation = [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email').optional().isEmail().withMessage('Invalid email format.').normalizeEmail(),
    body('role').optional().isIn(['STUDENT', 'INSTRUCTOR', 'ADMIN']).withMessage('Invalid role specified.'),
    body('status').optional().isIn(['ACTIVE', 'SUSPENDED']).withMessage('Invalid status specified.'),
    // Cannot update password via this route - requires separate password change flow
];

// --- Admin User Routes (ALL require Admin access) ---

// GET /api/admin/users - List all users with pagination/filtering
router.get('/', requireAuth, requireAdmin, adminGetAllUsers);

// GET /api/admin/users/:userId - Get details for a specific user
router.get('/:userId', requireAuth, requireAdmin, userIdParamValidation, adminGetUserById);

// PUT /api/admin/users/:userId - Update user details (name, email, role, status)
router.put('/:userId', requireAuth, requireAdmin, userIdParamValidation, userUpdateValidation, adminUpdateUser);

// DELETE /api/admin/users/:userId - Delete a user
router.delete('/:userId', requireAuth, requireAdmin, userIdParamValidation, adminDeleteUser);

// Optional: POST /api/admin/users - Create a new user (less common, usually self-registration)
// router.post('/', requireAuth, requireAdmin, /* Add create validation */, adminCreateUser);

export default router;