// server/src/routes/adminTestimonial.routes.js
import express from 'express';
import { body, param, query } from 'express-validator';
import {
  createTestimonial,
  getAllTestimonialsForAdmin,
  getTestimonialByIdForAdmin,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/adminTestimonialController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// All routes in this file are for admins and should be protected
router.use(authMiddleware, adminMiddleware);

// --- Validation Rules ---

const testimonialIdValidation = [
  param('testimonialId').isInt({ gt: 0 }).withMessage('Testimonial ID must be a positive integer.'),
];

const testimonialBodyValidation = [
  body('quote')
    .trim()
    .notEmpty().withMessage('Testimonial quote is required.')
    .isLength({ min: 10, max: 1000 }).withMessage('Quote must be between 10 and 1000 characters.'),
  body('authorName')
    .trim()
    .notEmpty().withMessage('Author name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Author name must be between 2 and 100 characters.'),
  body('authorTitle')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('Author title cannot exceed 100 characters.'),
  body('avatarUrl')
    .optional({ checkFalsy: true })
    .isURL().withMessage('Invalid avatar URL format.'),
  body('isVisible')
    .optional()
    .isBoolean().withMessage('isVisible must be a boolean value (true or false).'),
  // body('courseId') // If linking testimonials to courses
  //   .optional({checkFalsy: true})
  //   .isInt({ gt: 0 }).withMessage('Course ID must be a positive integer if provided.'),
];

const getAllTestimonialsAdminValidation = [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.'),
    query('searchTerm').optional().isString().trim(),
    query('visibility').optional().isIn(['visible', 'hidden', 'all']).withMessage('Invalid visibility filter. Use "visible", "hidden", or "all".'),
    query('sortBy').optional().isString().isIn(['newest', 'oldest', 'author_asc', 'author_desc']),
];


// --- Route Definitions ---

/**
 * @route   POST /api/admin/testimonials
 * @desc    Admin: Create a new testimonial
 * @access  Private (Admin)
 */
router.post('/', testimonialBodyValidation, handleValidationErrors, createTestimonial);

/**
 * @route   GET /api/admin/testimonials
 * @desc    Admin: Get all testimonials (all statuses, with filters and pagination)
 * @access  Private (Admin)
 */
router.get('/', getAllTestimonialsAdminValidation, handleValidationErrors, getAllTestimonialsForAdmin);

/**
 * @route   GET /api/admin/testimonials/:testimonialId
 * @desc    Admin: Get a single testimonial by ID for editing
 * @access  Private (Admin)
 */
router.get('/:testimonialId', testimonialIdValidation, handleValidationErrors, getTestimonialByIdForAdmin);

/**
 * @route   PUT /api/admin/testimonials/:testimonialId
 * @desc    Admin: Update an existing testimonial
 * @access  Private (Admin)
 */
router.put('/:testimonialId', testimonialIdValidation, testimonialBodyValidation, handleValidationErrors, updateTestimonial);

/**
 * @route   DELETE /api/admin/testimonials/:testimonialId
 * @desc    Admin: Delete a testimonial
 * @access  Private (Admin)
 */
router.delete('/:testimonialId', testimonialIdValidation, handleValidationErrors, deleteTestimonial);

export default router;
