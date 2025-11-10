// Utility to format consistent API responses
export const formatResponse = (success, data, message) => ({
  success,
  data,
  message,
});

// Convenience helpers
export const success = (data, message = "Success") =>
  formatResponse(true, data, message);

export const error = (message, statusCode = 500) => ({
  success: false,
  message,
  statusCode,
});
