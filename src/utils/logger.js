// Centralized logging utility

// Get formatted timestamp
const getTimestamp = () => new Date().toISOString();

// Log informational messages with timestamp
export const logInfo = (message) => {
  console.log(`[INFO] ${getTimestamp()} - ${message}`);
};

// Log error messages with timestamp and optional stack trace
export const logError = (message, error = null) => {
  console.error(`[ERROR] ${getTimestamp()} - ${message}`);
  
  // Print stack trace if error object provided
  if (error?.stack) {
    console.error('Stack:', error.stack);
  }
};
