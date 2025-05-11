// server/src/utils/apiError.js

/**
 * Custom Error class for API responses.
 * Extends the built-in Error class to include a statusCode,
 * a success flag, and an array for more detailed error messages.
 */
class ApiError extends Error {
  /**
   * Creates an instance of ApiError.
   * @param {number} statusCode - The HTTP status code for this error.
   * @param {string} [message="Something went wrong"] - The primary error message.
   * @param {Array<string|object>} [errors=[]] - An array of specific error details or messages.
   * @param {string} [stack=""] - Optional: Custom stack trace.
   */
  constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
    super(message); // Call the parent Error constructor with the message
    this.statusCode = statusCode;
    this.data = null; // Standardize: no data payload for errors
    this.message = message;
    this.success = false; // Indicates an error response
    this.errors = Array.isArray(errors) ? errors : [errors]; // Ensure errors is always an array

    // Capture stack trace, excluding constructor call from it
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
