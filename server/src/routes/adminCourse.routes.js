// server/src/routes/adminCourse.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createCourse,
  getAllCoursesForAdmin,
  getCourseByIdForAdmin,
  updateCourse,
  deleteCourse,
} from '../controllers/adminCourseController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';
import { Prisma } from '@prisma/client'; // Import Prisma namespace

// --- DEBUGGING PRISMA IMPORT AT MODULE LOAD ---
// These logs will execute ONCE when your server starts and this file is loaded.
console.log("\n--- adminCourse.routes.js LOADED BY SERVER ---");
console.log("1. Type of 'Prisma' imported from '@prisma/client':", typeof Prisma);
if (typeof Prisma === 'object' && Prisma !== null) {
    console.log("2. Prisma.Difficulty available at module load:", Prisma.Difficulty ? 'Yes, Object' : 'No/Undefined', "- Value:", Prisma.Difficulty);
    console.log("3. Prisma.LessonType available at module load:", Prisma.LessonType ? 'Yes, Object' : 'No/Undefined', "- Value:", Prisma.LessonType);
    console.log("4. Prisma.ContentStatus available at module load:", Prisma.ContentStatus ? 'Yes, Object' : 'No/Undefined', "- Value:", Prisma.ContentStatus);
} else {
    console.log("2. 'Prisma' object itself is not available or not an object at module load.");
}
console.log("-------------------------------------------\n");


const router = express.Router();

router.use(authMiddleware(), adminMiddleware);

// --- Validation Rules ---
const courseIdValidation = [
  param('courseId').isInt({ gt: 0 }).withMessage('Course ID must be a positive integer.'),
];

const baseCourseBodyValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Course title is required.')
    .isLength({ min: 5, max: 200 }).withMessage('Course title must be between 5 and 200 characters.'),
  body('description')
    .trim()
    .notEmpty().withMessage('Course description is required.')
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters.'),
  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number.')
    .toFloat(),
  body('categoryId')
    .optional({ checkFalsy: true })
    .isInt({ gt: 0 }).withMessage('Category ID must be a positive integer if provided.')
    .toInt(),
  body('difficulty')
    .optional()
    .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        // This check happens during request validation
        if (!Prisma.Difficulty || typeof Prisma.Difficulty !== 'object') {
            console.error("VALIDATOR RUNTIME CHECK: Prisma.Difficulty enum is not available during validation execution.");
            throw new Error('Server configuration error: Difficulty levels unavailable for validation.');
        }
        const validDifficulties = Object.values(Prisma.Difficulty);
        if (!validDifficulties.includes(value)) {
            throw new Error(`Invalid difficulty level. Must be one of: ${validDifficulties.join(', ')}`);
        }
        return true;
    }),
  body('language')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Language must be between 2 and 50 characters.'),
  body('status')
    .optional()
    .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        if (!Prisma.ContentStatus || typeof Prisma.ContentStatus !== 'object') {
            console.error("VALIDATOR RUNTIME CHECK: Prisma.ContentStatus enum is not available during validation execution.");
            throw new Error('Server configuration error: Content statuses unavailable for validation.');
        }
        const validStatuses = Object.values(Prisma.ContentStatus);
        if (!validStatuses.includes(value)) {
            throw new Error(`Invalid course status. Must be one of: ${validStatuses.join(', ')}`);
        }
        return true;
    }),
  body('thumbnailUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid thumbnail URL format.'),
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean value (true or false).')
    .toBoolean(),
  body('slug')
    .optional({ checkFalsy: true })
    .isString().trim().isSlug().withMessage('Slug can only contain lowercase letters, numbers, and hyphens.')
    .isLength({ min: 3, max: 200 }).withMessage('Slug must be between 3 and 200 characters.'),
  
  body('modules').optional().isArray().withMessage('Modules must be an array.'),
  body('modules.*.title').if(body('modules').exists({checkNull: true})).trim().notEmpty().withMessage('Each module must have a title.'),
  body('modules.*.order').if(body('modules').exists({checkNull: true})).isInt({ min: 0 }).withMessage('Each module order must be a non-negative integer.').toInt(),
  body('modules.*.lessons').if(body('modules').exists({checkNull: true})).optional().isArray().withMessage('Module lessons must be an array.'),

  body('modules.*.lessons.*.title').if(body('modules.*.lessons').exists({checkNull: true})).trim().notEmpty().withMessage('Each lesson must have a title.'),
  body('modules.*.lessons.*.order').if(body('modules.*.lessons').exists({checkNull: true})).isInt({ min: 0 }).withMessage('Each lesson order must be a non-negative integer.').toInt(),
  body('modules.*.lessons.*.type').if(body('modules.*.lessons').exists({checkNull: true})).optional().custom((value) => {
    if (value === undefined || value === null || value === '') return true;
    if (!Prisma.LessonType || typeof Prisma.LessonType !== 'object') {
      console.error("VALIDATOR RUNTIME CHECK: Prisma.LessonType enum is not available for nested lesson validation.");
      throw new Error('Server configuration error: Lesson types unavailable for validation.');
    }
    const validTypes = Object.values(Prisma.LessonType);
    if (!validTypes.includes(value)) {
      throw new Error(`Invalid lesson type for nested lesson. Must be one of: ${validTypes.join(', ')}`);
    }
    return true;
  }),
  body('modules.*.lessons.*.content').if(body('modules.*.lessons').exists({checkNull: true})).optional({ checkFalsy: true }).isString().trim(),
  body('modules.*.lessons.*.videoUrl').if(body('modules.*.lessons').exists({checkNull: true})).optional({ checkFalsy: true }).isURL().withMessage('Invalid video URL format for a lesson.'),
  body('modules.*.lessons.*.videoDuration').if(body('modules.*.lessons').exists({checkNull: true})).optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Lesson video duration must be a non-negative integer.').toInt(),
  body('modules.*.lessons.*.isFreePreview').if(body('modules.*.lessons').exists({checkNull: true})).optional().isBoolean().withMessage('Lesson isFreePreview must be a boolean.').toBoolean(),
  body('modules.*.lessons.*.slug').if(body('modules.*.lessons').exists({checkNull: true})).optional({checkFalsy: true}).isSlug().withMessage('Lesson slug must be a valid slug format if provided.'),
];

const createCourseValidationRules = [
  ...baseCourseBodyValidation,
  body('instructorId')
    .notEmpty().withMessage('Instructor ID is required.')
    .isInt({ gt: 0 }).withMessage('Instructor ID must be a positive integer.')
    .toInt(),
];

const updateCourseValidationRules = [
  ...baseCourseBodyValidation,
  body('instructorId')
    .optional()
    .isInt({ gt: 0 }).withMessage('Instructor ID must be a positive integer if provided.')
    .toInt(),
];

const getAllCoursesAdminQueryValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.').toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.').toInt(),
    query('status').optional().toUpperCase().custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        if (!Prisma.ContentStatus || typeof Prisma.ContentStatus !== 'object') {
            console.error("VALIDATOR RUNTIME CHECK: Prisma.ContentStatus enum is not available for query validation.");
            throw new Error('Server configuration error: Content statuses unavailable for query validation.');
        }
        const validStatuses = Object.values(Prisma.ContentStatus);
        if (!validStatuses.includes(value)) {
            throw new Error(`Invalid status filter. Must be one of: ${validStatuses.join(', ')}`);
        }
        return true;
    }),
    query('categoryId').optional().isInt({ gt: 0 }).withMessage('Category ID filter must be a positive integer.').toInt(),
    query('instructorId').optional().isInt({ gt: 0 }).withMessage('Instructor ID filter must be a positive integer.').toInt(),
    query('searchTerm').optional().isString().trim(),
    query('sortBy').optional().isString().isIn(['createdAt_desc', 'createdAt_asc', 'title_asc', 'title_desc', 'price_asc', 'price_desc', 'updatedAt_desc'])
      .withMessage('Invalid sort option. Valid options are: createdAt_desc, createdAt_asc, title_asc, title_desc, price_asc, price_desc, updatedAt_desc'),
];


// --- Route Definitions ---

router.post('/', ...createCourseValidationRules, handleValidationErrors, createCourse);
router.get('/', ...getAllCoursesAdminQueryValidation, handleValidationErrors, getAllCoursesForAdmin);
router.get('/:courseId', ...courseIdValidation, handleValidationErrors, getCourseByIdForAdmin);
router.put('/:courseId', ...courseIdValidation, ...updateCourseValidationRules, handleValidationErrors, updateCourse);
router.delete('/:courseId', ...courseIdValidation, handleValidationErrors, deleteCourse);

export default router;
