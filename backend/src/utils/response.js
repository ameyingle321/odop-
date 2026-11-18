/**
 * Standardised API response helpers.
 *
 * Every API response follows the documented convention:
 *   Success: { success: true,  data: {} }
 *   Error:   { success: false, message: '', errors?: {} }
 *
 * See: Development Rules §17 — API Response Format
 */

/**
 * Send a success response.
 * @param {import('express').Response} res
 * @param {object|null} data - Payload to return.
 * @param {number} statusCode - HTTP status code (defaults to 200).
 * @param {string} [message] - Optional success message.
 */
export function sendSuccess(res, data = null, statusCode = 200, message = undefined) {
  const body = { success: true };
  if (message) body.message = message;
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message - User-facing error message.
 * @param {number} statusCode - HTTP status code (defaults to 500).
 * @param {object} [errors] - Optional field-level validation errors.
 */
export function sendError(res, message, statusCode = 500, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}
