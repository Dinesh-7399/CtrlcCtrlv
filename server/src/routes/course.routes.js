// server/src/routes/course.routes.js
import express from 'express';
import { param, query } from 'express-validator';
import {
  getAllPublishedCourses,
  getCourseBySlugOrId,
} from '../controllers/courseController.js';
import { getLessonDetails } from '../controllers/lessonController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// --- Validation Rules ---
// (Validation arrays are kept as they were, assuming they are correct)
const getAllCoursesQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.').toInt(),
  query('category').optional().isString().trim().isSlug().withMessage('Category slug contains invalid characters.'),
  query('searchTerm').optional().isString().trim(),
  query('difficulty').optional().toUpperCase().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (!Prisma.Difficulty || typeof Prisma.Difficulty !== 'object') {
        console.error("DEBUG: Prisma.Difficulty enum is not available (course.routes.js getAllCoursesQueryValidation)");
        throw new Error('Server configuration error: Difficulty levels unavailable.');
    }
    const validDifficulties = Object.values(Prisma.Difficulty);
    if (!validDifficulties.includes(value)) throw new Error(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`);
    return true;
  }),
  query('language').optional().isString().trim(),
  query('sortBy').optional().isString().trim().isIn(['newest', 'price_asc', 'price_desc', 'title_asc', 'rating_desc'])
    .withMessage('Invalid sort option.'),
];

const getCourseByIdentifierValidation = [
  param('identifier')
    .notEmpty().withMessage('Course slug or ID is required.')
    .isString()
    .custom((value) => {
      const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
      const isNumericId = /^\d+$/.test(value) && parseInt(value, 10) > 0;
      if (isSlug || isNumericId) return true;
      throw new Error('Identifier must be a valid slug or a positive numeric ID.');
    }),
];

const getLessonAccessValidation = [
  param('courseIdentifier').isString().notEmpty().withMessage('Course identifier is required.'),
  param('lessonIdentifier').isString().notEmpty().withMessage('Lesson identifier is required.'),
];

// --- Route Definitions ---

console.log("--- DEBUGGING Route: GET / ---");
console.log("1. typeof getAllCoursesQueryValidation (is array):", Array.isArray(getAllCoursesQueryValidation));
if(Array.isArray(getAllCoursesQueryValidation)) {
  getAllCoursesQueryValidation.forEach((v, i) => console.log(`   - typeof getAllCoursesQueryValidation[${i}]:`, typeof v));
}
console.log("2. typeof handleValidationErrors:", typeof handleValidationErrors);
console.log("3. typeof getAllPublishedCourses:", typeof getAllPublishedCourses);
router.get(
  '/',
  ...getAllCoursesQueryValidation,
  handleValidationErrors,
  getAllPublishedCourses
);
console.log("--- FINISHED DEBUGGING Route: GET / ---");


console.log("\n--- DEBUGGING Route: GET /:identifier ---");
const route_identifier_arg1_auth = authMiddleware(true);
console.log("1. typeof authMiddleware(true):", typeof route_identifier_arg1_auth);

const route_identifier_arg2_validation = getCourseByIdentifierValidation;
console.log("2. typeof getCourseByIdentifierValidation (is array):", Array.isArray(route_identifier_arg2_validation));
if(Array.isArray(route_identifier_arg2_validation)) {
  route_identifier_arg2_validation.forEach((v, i) => console.log(`   - typeof getCourseByIdentifierValidation[${i}]:`, typeof v));
}

const route_identifier_arg3_handleErrors = handleValidationErrors;
console.log("3. typeof handleValidationErrors:", typeof route_identifier_arg3_handleErrors);

const route_identifier_arg4_controller = getCourseBySlugOrId;
console.log("4. typeof getCourseBySlugOrId:", typeof route_identifier_arg4_controller);

router.get(
  '/:identifier',
  route_identifier_arg1_auth,
  ...(Array.isArray(route_identifier_arg2_validation) ? route_identifier_arg2_validation : []), // Spread only if it's an array
  route_identifier_arg3_handleErrors,
  route_identifier_arg4_controller
);
console.log("--- FINISHED DEBUGGING Route: GET /:identifier ---");


console.log("\n--- DEBUGGING Route: GET /:courseIdentifier/lessons/:lessonIdentifier ---");
const route_lesson_arg1_auth = authMiddleware(true);
console.log("1. typeof authMiddleware(true) for lesson route:", typeof route_lesson_arg1_auth);

const route_lesson_arg2_validation = getLessonAccessValidation;
console.log("2. typeof getLessonAccessValidation (is array):", Array.isArray(route_lesson_arg2_validation));
if(Array.isArray(route_lesson_arg2_validation)) {
  route_lesson_arg2_validation.forEach((v, i) => console.log(`   - typeof getLessonAccessValidation[${i}]:`, typeof v));
}
const route_lesson_arg3_handleErrors = handleValidationErrors;
console.log("3. typeof handleValidationErrors for lesson route:", typeof route_lesson_arg3_handleErrors);

const route_lesson_arg4_controller = getLessonDetails;
console.log("4. typeof getLessonDetails:", typeof route_lesson_arg4_controller);

router.get(
  '/:courseIdentifier/lessons/:lessonIdentifier',
  route_lesson_arg1_auth,
  ...(Array.isArray(route_lesson_arg2_validation) ? route_lesson_arg2_validation : []), // Spread only if it's an array
  route_lesson_arg3_handleErrors,
  route_lesson_arg4_controller
);
console.log("--- FINISHED DEBUGGING Route: GET /:courseIdentifier/lessons/:lessonIdentifier ---");

export default router;
