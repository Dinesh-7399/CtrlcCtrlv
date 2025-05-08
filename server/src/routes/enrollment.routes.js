// server/src/routes/enrollment.routes.js

import { Router } from 'express';
import { param } from 'express-validator';
import { requireAuth } from '../middlewares/auth.middleware.js'; // Adjust the import path as needed
import { enrollInCourse , getMyEnrollments } from '../controllers/enrollmentController.js'; // We'll create this

const router = Router();

const courseIdParamValidation = [
    param('courseId')
        .isInt({ gt: 0 }).withMessage('Course ID must be a positive integer.')
        .toInt()
];

// POST /api/enrollments/course/:courseId - Enroll logged-in user in a course
router.post(
    '/course/:courseId',
    requireAuth,
    courseIdParamValidation,
    enrollInCourse
);

// Optional: GET /api/enrollments/my-courses (Alternative to /api/users/me/enrollments if you prefer a dedicated router)
// For now, we'll keep using the one in user.routes.js, but you could move it here.
router.get('/my-courses', requireAuth, getMyEnrollments);


export default router;