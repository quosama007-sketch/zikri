/**
 * Validation Utilities
 *
 * Input validation functions for user authentication and data entry.
 * All functions are pure and mobile-ready (no React dependencies).
 */

/**
 * Validation result object structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the input is valid
 * @property {string} [error] - Error message if invalid
 */

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {ValidationResult} Validation result with error message if invalid
 */
export const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return {
      isValid: false,
      error: "Please enter username and password",
    };
  }

  if (username.trim().length < 3) {
    return {
      isValid: false,
      error:
        "⚠️ Username Too Short\n\nUsername must be at least 3 characters long.",
    };
  }

  return { isValid: true };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {boolean} isSignUp - Whether this is a signup (stricter validation)
 * @returns {ValidationResult} Validation result with error message if invalid
 */
export const validatePassword = (password, isSignUp = false) => {
  if (!password || password.length === 0) {
    return {
      isValid: false,
      error: "Please enter username and password",
    };
  }

  if (isSignUp && password.length < 6) {
    return {
      isValid: false,
      error:
        "⚠️ Password Too Short\n\nPassword must be at least 6 characters long.",
    };
  }

  return { isValid: true };
};

/**
 * Validate username and password together
 * @param {string} username - Username to validate
 * @param {string} password - Password to validate
 * @param {boolean} isSignUp - Whether this is a signup
 * @returns {ValidationResult} Combined validation result
 */
export const validateCredentials = (username, password, isSignUp = false) => {
  // Check username first
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    return usernameValidation;
  }

  // Check password
  const passwordValidation = validatePassword(password, isSignUp);
  if (!passwordValidation.isValid) {
    return passwordValidation;
  }

  return { isValid: true };
};

/**
 * Validate email format (for future use)
 * @param {string} email - Email to validate
 * @returns {ValidationResult} Validation result
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      error: "Email is required",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "Please enter a valid email address",
    };
  }

  return { isValid: true };
};

/**
 * Validate number is within range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {ValidationResult} Validation result
 */
export const validateNumberRange = (value, min, max) => {
  if (typeof value !== "number" || isNaN(value)) {
    return {
      isValid: false,
      error: `Value must be a number`,
    };
  }

  if (value < min || value > max) {
    return {
      isValid: false,
      error: `Value must be between ${min} and ${max}`,
    };
  }

  return { isValid: true };
};

/**
 * Sanitize username (remove extra spaces, etc.)
 * @param {string} username - Username to sanitize
 * @returns {string} Sanitized username
 */
export const sanitizeUsername = (username) => {
  if (!username) return "";
  return username.trim();
};

/**
 * Check if username is available (length check only, Firebase check elsewhere)
 * @param {string} username - Username to check
 * @returns {boolean} True if username meets minimum requirements
 */
export const isUsernameValid = (username) => {
  return username && username.trim().length >= 3;
};
