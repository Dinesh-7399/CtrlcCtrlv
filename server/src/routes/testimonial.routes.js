// server/src/routes/testimonial.routes.js
import express from 'express';
import { query } from 'express-validator'; // For optional pagination query params
import {
  getAllVisibleTestimonials,
  // getTestimonialById, // If you need a public route for a single testimonial
} from '../controllers/testimonialController.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// --- Validation Rules (Optional for public GET all) ---

const getAllTestimonialsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
  // Add other query param validations if needed (e.g., sortBy)
];


// --- Route Definitions ---

/**
 * @route   GET /api/testimonials
 * @desc    Get all visible testimonials (with optional pagination)
 * @access  Public
 */
router.get(
  '/',
  getAllTestimonialsValidation, // Apply validation if query params are used
  handleValidationErrors,       // Handle any validation errors
  getAllVisibleTestimonials
);

// Example: If you wanted a public route to get a single testimonial by ID (less common)
// import { param } from 'express-validator';
// const testimonialIdValidation = [param('testimonialId').isInt({ gt: 0 })];
// router.get('/:testimonialId', testimonialIdValidation, handleValidationErrors, getTestimonialById);

export default router;
