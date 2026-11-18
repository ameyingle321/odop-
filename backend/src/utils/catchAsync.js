/**
 * Wraps an async route/controller handler so that rejected promises
 * are automatically forwarded to Express's central error middleware.
 *
 * Usage:
 *   router.get('/items', catchAsync(async (req, res) => { ... }));
 *
 * Without this wrapper, unhandled async rejections silently hang the request.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
