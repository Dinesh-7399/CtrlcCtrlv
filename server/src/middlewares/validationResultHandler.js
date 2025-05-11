// server/src/middlewares/validationResultHandler.js
import { validationResult } from 'express-validator';
import ApiError from '../utils/apiError.js'; // Your custom ApiError class

/**
 * Middleware to handle validation errors from express-validator.
 * If validation errors exist, it constructs an ApiError and passes it to the next error handler.
 * Otherwise, it calls next() to proceed to the next middleware/controller.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req); // Get validation results from the request

  if (!errors.isEmpty()) {
    // If there are errors, map them to a more structured format
    const extractedErrors = errors.array().map(err => ({
      field: err.param || err.path || 'unknown_field', // 'param' for older versions, 'path' for newer
      message: err.msg,
      value: err.value, // Optionally include the value that failed validation
    }));

    // Create an instance of your custom ApiError
    // The global errorHandler will then format this into a JSON response
    const apiError = new ApiError(
      400, // Bad Request
      'Validation failed. Please check your input.',
      extractedErrors // Pass the array of specific field errors
    );
    return next(apiError); // Pass the error to the global error handler
  }

  // No validation errors, proceed to the next middleware or route handler
  next();
};
