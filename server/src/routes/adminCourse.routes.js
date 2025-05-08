// server/src/routes/adminCourse.routes.js

import { Router } from 'express';
import { param, body, validationResult } from 'express-validator';
import { requireAuth, requireAdmin, requireAdminOrInstructorOwner } from '../middlewares/auth.middleware.js'; // Adjust the import path as needed
import {
    adminGetAllCourses,
    adminGetCourseById,
    adminCreateCourse,
    adminUpdateCourse,
    adminDeleteCourse
} from '../controllers/adminCourseController.js';

const router = Router();

// --- Validation Rules ---
const courseIdParamValidation = [
    param('courseId').isInt({ gt: 0 }).withMessage('Course ID must be a positive integer.')
];

const courseBodyValidation = [
    // ... (keep existing validation rules for POST/PUT) ...
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('description').trim().notEmpty().withMessage('Description is required.'),
    // ... other rules ...
];

// --- NEW: Validation for Delete Confirmation ---
const deleteConfirmationValidation = [
    body('confirmationPassword').notEmpty().withMessage('Password confirmation is required to delete.')
];

// --- Admin Course Routes ---

// GET /api/admin/courses - List ALL courses
router.get('/', requireAuth, requireAdmin, adminGetAllCourses);

// POST /api/admin/courses - Create a new course
router.post('/', requireAuth, requireAdmin, courseBodyValidation, adminCreateCourse);

// GET /api/admin/courses/:courseId - Get specific course details
router.get('/:courseId', requireAuth, requireAdminOrInstructorOwner, courseIdParamValidation, adminGetCourseById);

// PUT /api/admin/courses/:courseId - Update a course
router.put('/:courseId', requireAuth, requireAdminOrInstructorOwner, courseIdParamValidation, courseBodyValidation, adminUpdateCourse);

// DELETE /api/admin/courses/:courseId - Delete a course (with password confirmation)
router.delete(
    '/:courseId',
    requireAuth,                  // Must be logged in
    requireAdmin,                 // Must be an admin
    courseIdParamValidation,      // Validate URL param
    deleteConfirmationValidation, // <-- ADD validation for confirmation password
    adminDeleteCourse             // Controller function
);


export default router;