// server/src/routes/payment.routes.js
import express from 'express';
import { body } from 'express-validator';
import {
  createPaymentOrder,
  verifyPaymentAndEnroll,
  handleRazorpayWebhook,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { handleValidationErrors } from '../middlewares/validationResultHandler.js';

const router = express.Router();

// --- Validation Rules ---

const createOrderValidation = [
  body('courseId')
    .notEmpty().withMessage('Course ID is required.')
    .isInt({ gt: 0 }).withMessage('Course ID must be a positive integer.'),
];

const verifyPaymentValidation = [
  body('razorpay_order_id').notEmpty().isString().withMessage('Razorpay Order ID is required.'),
  body('razorpay_payment_id').notEmpty().isString().withMessage('Razorpay Payment ID is required.'),
  body('razorpay_signature').notEmpty().isString().withMessage('Razorpay Signature is required.'),
  body('courseId') // Include courseId for context during verification
    .notEmpty().withMessage('Course ID is required for payment verification.')
    .isInt({ gt: 0 }).withMessage('Course ID must be a positive integer.'),
];

// --- Route Definitions ---

/**
 * @route   POST /api/payment/create-order
 * @desc    Create a Razorpay order for a course
 * @access  Private (Authenticated Users)
 */
router.post(
  '/create-order',
  authMiddleware,
  createOrderValidation,
  handleValidationErrors,
  createPaymentOrder
);

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay payment and enroll user
 * @access  Private (Authenticated Users)
 */
router.post(
  '/verify',
  authMiddleware,
  verifyPaymentValidation,
  handleValidationErrors,
  verifyPaymentAndEnroll
);

/**
 * @route   POST /api/payment/webhook/razorpay
 * @desc    Handle Razorpay Webhooks (e.g., payment.failed, order.paid)
 * @access  Public (Secured by webhook signature verification within the controller)
 */
router.post(
  '/webhook/razorpay',
  // No authMiddleware here, as Razorpay calls this directly.
  // Signature verification is handled inside the controller.
  // No body validation here as Razorpay sends a specific payload structure.
  handleRazorpayWebhook
);

export default router;
