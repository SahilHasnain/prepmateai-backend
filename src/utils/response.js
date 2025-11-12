// Standard response helpers for consistent API responses
// Consistent response format improves client-side error handling and maintainability

// Success response with data
export const success = (data, message = "ok") => ({
  success: true,
  data,
  message,
});

// Failure response with error message
export const failure = (message = "error") => ({
  success: false,
  message,
});
