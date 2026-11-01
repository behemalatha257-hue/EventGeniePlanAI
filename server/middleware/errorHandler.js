/**
 * EventGeniePlan AI - Centralized Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV !== 'production';
  const statusCode = err.status || err.statusCode || 500;

  const errorResponse = {
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred processing your request.',
      timestamp: new Date().toISOString()
    }
  };

  if (isDev && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  console.error(`[Error] ${req.method} ${req.url} [${statusCode}]:`, err.message);
  res.status(statusCode).json(errorResponse);
}

module.exports = {
  errorHandler
};
