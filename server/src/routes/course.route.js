// server/src/routes/course.routes.js

import { Router } from 'express';
import { param, validationResult } from 'express-validator'; // For URL param validation
import {
    getAllPublishedCourses,
    getCourseByIdOrSlug
} from '../controllers/courseController.js'; // We will create these functions

const router = Router();

// Validation for the course identifier (can be numeric ID or string slug)
const courseIdOrSlugValidation = [
    param('idOrSlug').notEmpty().withMessage('Course identifier cannot be empty.')
];

// --- Course Routes ---

// GET /api/courses - List all PUBLISHED courses
router.get('/', getAllPublishedCourses);

// GET /api/courses/:idOrSlug - Get details for a single PUBLISHED course
router.get(
    '/:idOrSlug',
    courseIdOrSlugValidation, // Validate the parameter
    getCourseByIdOrSlug
);

export default router;