/**
 * NETFIX AI — Shared HTTP response helpers
 *
 * Every controller currently repeats the same
 * `res.status(...).json({ success, error: { code, message } })` shape.
 * These helpers standardize it so the response contract lives in one place.
 */

/** Standard success envelope: { success: true, data } */
export function sendSuccess(res, data, statusCode = 200, extra = {}) {
  return res.status(statusCode).json({ success: true, ...extra, data });
}

/** Standard error envelope: { success: false, error: { code, message } } */
export function sendError(res, statusCode, code, message, extra = {}) {
  return res.status(statusCode).json({ success: false, ...extra, error: { code, message } });
}

/**
 * Error carrying an HTTP status + machine-readable code,
 * for controllers that use an asyncHandler wrapper.
 */
export class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Express-compatible async route wrapper: forwards thrown errors
 * (including ApiError) to the global error handler instead of
 * requiring try/catch in every handler.
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}