/**
 * Validation middleware factory.
 *
 * Creates an Express middleware that validates `req.body`, `req.query`,
 * or `req.params` against a Joi schema.
 *
 * On failure the middleware returns a 422 response with field-level errors
 * following the project's documented error format:
 *   { success: false, message: "Validation failed.", errors: { ... } }
 *
 * Usage:
 *   import { validate } from '../middleware/validation.middleware.js';
 *   import { createProductSchema } from '../validators/product.validator.js';
 *
 *   router.post('/products', validate(createProductSchema), controller);
 *   router.get('/products', validate(querySchema, 'query'), controller);
 */

import { HTTP } from '../constants/index.js';

/**
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against.
 * @param {'body'|'query'|'params'} source - Request property to validate.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,     // Collect ALL errors, not just the first
      stripUnknown: true,    // Remove fields not in the schema
      errors: {
        wrap: { label: false }, // Don't wrap field names in quotes
      },
    });

    if (error) {
      // Transform Joi details into a { fieldName: message } map
      const errors = {};
      for (const detail of error.details) {
        const key = detail.path.join('.') || detail.context?.key || 'unknown';
        errors[key] = detail.message;
      }

      return res.status(HTTP.UNPROCESSABLE).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    // Replace the raw input with the validated/sanitised value
    req[source] = value;
    next();
  };
}
