// Global error handler middleware for Express
// Catches all errors thrown in routes and returns standardized JSON response

export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Determine status code
  const statusCode = err.status || err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
