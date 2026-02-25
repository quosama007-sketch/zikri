/**
 * Error Handling Utilities
 *
 * Functions for converting error codes and messages to user-friendly text.
 * All functions are pure and mobile-ready.
 */

/**
 * Convert Firebase/auth error to friendly user message
 * @param {Error|string} error - Error object or string
 * @param {string} username - Username context (optional, for personalized messages)
 * @returns {string} User-friendly error message
 */
export const getFriendlyErrorMessage = (error, username = "") => {
  if (!error) return "Authentication failed. Please try again.";

  const errorString = error.toString().toLowerCase();

  if (errorString.includes("username") && errorString.includes("exist")) {
    return username
      ? `❌ Username Already Taken\n\nThe username "${username}" is already taken.\n\nPlease choose a different username.`
      : "❌ Username Already Taken\n\nThis username is already taken.\n\nPlease choose a different username.";
  }

  if (
    errorString.includes("user-not-found") ||
    errorString.includes("invalid")
  ) {
    return "❌ Invalid Credentials\n\nUsername or password is incorrect.\n\nPlease check and try again.";
  }

  if (errorString.includes("wrong-password")) {
    return "❌ Incorrect Password\n\nThe password you entered is incorrect.\n\nPlease try again.";
  }

  if (errorString.includes("weak-password")) {
    return "⚠️ Weak Password\n\nPassword must be at least 6 characters long.\n\nPlease choose a stronger password.";
  }

  if (errorString.includes("too-many-requests")) {
    return "⚠️ Too Many Attempts\n\nToo many failed login attempts.\n\nPlease try again in a few minutes.";
  }

  if (errorString.includes("network")) {
    return "📡 Network Error\n\nPlease check your internet connection and try again.";
  }

  // Default friendly message
  return "❌ Authentication Error\n\nSomething went wrong. Please try again.\n\nIf the problem persists, contact support.";
};

/**
 * Get error message for validation failures
 * @param {string} field - Field name that failed validation
 * @param {string} reason - Reason for validation failure
 * @returns {string} User-friendly error message
 */
export const getValidationErrorMessage = (field, reason) => {
  const fieldName = field.charAt(0).toUpperCase() + field.slice(1);

  switch (reason) {
    case "required":
      return `${fieldName} is required`;
    case "too-short":
      return `${fieldName} is too short`;
    case "too-long":
      return `${fieldName} is too long`;
    case "invalid-format":
      return `${fieldName} format is invalid`;
    default:
      return `${fieldName} validation failed`;
  }
};

/**
 * Get error message for network failures
 * @param {Error} error - Network error
 * @returns {string} User-friendly error message
 */
export const getNetworkErrorMessage = (error) => {
  if (!error) return "Network error occurred";

  const errorString = error.toString().toLowerCase();

  if (errorString.includes("timeout")) {
    return "⏱️ Request Timeout\n\nThe request took too long.\n\nPlease try again.";
  }

  if (errorString.includes("offline") || errorString.includes("network")) {
    return "📡 No Internet Connection\n\nPlease check your connection and try again.";
  }

  return "🌐 Network Error\n\nSomething went wrong with the connection.\n\nPlease try again.";
};

/**
 * Get error message for data operations
 * @param {string} operation - Operation that failed ('save', 'load', 'delete')
 * @returns {string} User-friendly error message
 */
export const getDataErrorMessage = (operation) => {
  switch (operation) {
    case "save":
      return "❌ Failed to Save\n\nCouldn't save your progress.\n\nPlease try again.";
    case "load":
      return "❌ Failed to Load\n\nCouldn't load your data.\n\nPlease try again.";
    case "delete":
      return "❌ Failed to Delete\n\nCouldn't delete the data.\n\nPlease try again.";
    default:
      return "❌ Operation Failed\n\nSomething went wrong.\n\nPlease try again.";
  }
};

/**
 * Log error to console with context
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 * @param {Object} additionalInfo - Additional debugging info (optional)
 */
export const logError = (context, error, additionalInfo = {}) => {
  console.error(`[${context}] Error:`, error);
  if (Object.keys(additionalInfo).length > 0) {
    console.error(`[${context}] Additional info:`, additionalInfo);
  }
};

/**
 * Check if error is a network error
 * @param {Error} error - Error to check
 * @returns {boolean} True if network-related error
 */
export const isNetworkError = (error) => {
  if (!error) return false;
  const errorString = error.toString().toLowerCase();
  return (
    errorString.includes("network") ||
    errorString.includes("offline") ||
    errorString.includes("timeout") ||
    errorString.includes("connection")
  );
};

/**
 * Check if error is an authentication error
 * @param {Error} error - Error to check
 * @returns {boolean} True if auth-related error
 */
export const isAuthError = (error) => {
  if (!error) return false;
  const errorString = error.toString().toLowerCase();
  return (
    errorString.includes("auth") ||
    errorString.includes("credential") ||
    errorString.includes("password") ||
    errorString.includes("username")
  );
};
