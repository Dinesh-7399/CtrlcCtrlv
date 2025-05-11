// server/src/utils/apiResponse.js

/**
 * Standardized API Response class for successful operations.
 */
class ApiResponse {
  /**
   * Creates an instance of ApiResponse.
   * @param {number} statusCode - The HTTP status code (e.g., 200, 201).
   * @param {any} data - The data payload to be sent in the response.
   * @param {string} [message="Success"] - A descriptive success message.
   */
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    // Determine success based on statusCode. Typically, 2xx codes are success.
    this.success = statusCode >= 200 && statusCode < 300;
  }
}

export default ApiResponse;
