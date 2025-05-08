// server/src/middleware/errorHandler.js

/**
 * Express error handling middleware.
 * Must have 4 arguments: err, req, res, next.
 */
export const errorHandler = (err, req, res, next) => {
  console.error("ERROR STACK:", err.stack); // Log the full error stack trace for debugging

  // Determine status code: use error's status code if available, otherwise default to 500
  const statusCode = err.statusCode || 500;

  // Determine message: use error's message or a generic one
  const message = err.message || "Internal Server Error";

  // Send JSON response
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    // Optionally include stack trace in development only
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

// Optional: You might create custom Error classes later
// export class ApiError extends Error {
//   constructor(statusCode, message) {
//     super(message);
//     this.statusCode = statusCode;
//     Error.captureStackTrace(this, this.constructor);
//   }
// }