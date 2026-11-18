import { HTTP } from '../constants/index.js';

/**
 * Custom application error with HTTP status code.
 * Throw this from services/controllers and the central error middleware
 * will convert it into a consistent API response.
 */
class AppError extends Error {
  /**
   * @param {string} message - User-facing error message.
   * @param {number} statusCode - HTTP status code (defaults to 500).
   * @param {object} [errors] - Optional field-level validation errors.
   */
  constructor(message, statusCode = HTTP.INTERNAL_SERVER_ERROR, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
