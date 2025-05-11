// server/src/middlewares/errorHandler.js
import ApiError from '../utils/apiError.js'; // Your custom ApiError class
import ApiResponse from '../utils/apiResponse.js'; // To ensure consistent error response structure

/**
 * Global error handling middleware.
 * This middleware should be registered LAST in your Express app, after all routes.
 *
 * @param {Error | ApiError} err - The error object. Can be a standard Error or an instance of ApiError.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
export const errorHandler = (err, req, res, next) => {
  // If headers have already been sent to the client, delegate to the default Express error handler.
  if (res.headersSent) {
    return next(err);
  }

  // Log the error for debugging purposes
  // In production, you might use a more sophisticated logger like Winston or Pino
  console.error("-------------------- ERROR LOG START --------------------");
  console.error(`Timestamp: ${new Date().toISOString()}`);
  console.error(`Route: ${req.method} ${req.originalUrl}`);
  // Avoid logging sensitive request body in production without sanitization
  if (process.env.NODE_ENV === 'development' && req.body && Object.keys(req.body).length > 0) {
    try {
      // Attempt to stringify, but catch errors if body is not simple JSON (e.g., file uploads)
      const bodyLog = JSON.stringify(req.body, null, 2);
      // console.error('Request Body:', bodyLog.substring(0, 1000)); // Log first 1KB
    } catch (e) {
      // console.error('Request Body: [Could not stringify - possibly binary data]');
    }
  }
  console.error(`Error Name: ${err.name}`);
  console.error(`Error Message: ${err.message}`);
  if (err instanceof ApiError && err.errors && err.errors.length > 0) {
    console.error('Detailed Errors:', JSON.stringify(err.errors, null, 2));
  }
  // Log stack trace only in development for security reasons
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error('Stack Trace:', err.stack);
  }
  console.error("--------------------- ERROR LOG END ---------------------");

  let statusCode = 500;
  let responseMessage = 'An unexpected internal server error occurred.';
  let responseErrors = [responseMessage];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    responseMessage = err.message;
    responseErrors = err.errors.length > 0 ? err.errors : [err.message];
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    // Handle JWT specific errors more gracefully if not already caught by ApiError
    statusCode = 401; // Unauthorized
    responseMessage = err.message || 'Invalid or expired token.';
    responseErrors = [responseMessage];
  } else if (err.name === 'ValidationError') { // Example for a generic validation error not wrapped in ApiError
    statusCode = 400;
    responseMessage = err.message || 'Validation Error';
    // If err.errors exists and is an array (common in some validation libraries)
    responseErrors = Array.isArray(err.errors) ? err.errors.map(e => e.msg || e.message || e) : [responseMessage];
  }
  // Add more specific error type checks here if needed (e.g., PrismaClientKnownRequestError)

  // Use ApiResponse structure for consistency, but with success: false
  const errorResponsePayload = {
    success: false,
    message: responseMessage,
    errors: responseErrors,
  };

  // Include stack trace in the response only during development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponsePayload.stack = err.stack;
  }

  res.status(statusCode).json(errorResponsePayload);
};
