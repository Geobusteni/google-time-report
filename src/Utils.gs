/**
 * Utils.gs
 * Utility functions for date formatting, timezone handling, and other helpers.
 */

/**
 * Gets the date range for a specific month.
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {Object} Object with startDate and endDate
 */
function getMonthDateRange(year, month) {
  // First day of the month at 00:00:00
  const startDate = new Date(year, month, 1, 0, 0, 0, 0);

  // Last day of the month at 23:59:59.999
  // Using day 0 of next month gives us the last day of current month
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Formats a date as YYYY-MM-DD.
 * @param {Date} date - The date to format
 * @param {string} timezone - The timezone to use
 * @returns {string} Formatted date string
 */
function formatDateOnly(date, timezone) {
  return Utilities.formatDate(date, timezone, 'yyyy-MM-dd');
}

/**
 * Formats a time as HH:mm.
 * @param {Date} date - The date/time to format
 * @param {string} timezone - The timezone to use
 * @returns {string} Formatted time string
 */
function formatTimeOnly(date, timezone) {
  return Utilities.formatDate(date, timezone, 'HH:mm');
}

/**
 * Formats a month and year for display (e.g., "January 2024").
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {string} Formatted month and year
 */
function formatMonthYear(year, month) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[month]} ${year}`;
}

/**
 * Formats a duration in hours as a human-readable string.
 * @param {number} hours - The number of hours
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (h === 0) {
    return `${m}m`;
  } else if (m === 0) {
    return `${h}h`;
  } else {
    return `${h}h ${m}m`;
  }
}

/**
 * Parses a date string in YYYY-MM-DD format.
 * @param {string} dateStr - The date string to parse
 * @returns {Date} Parsed date object
 */
function parseDateString(dateStr) {
  const parts = dateStr.split('-');
  return new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2])
  );
}

/**
 * Gets the month name from a month number.
 * @param {number} month - The month (0-11 or 1-12)
 * @param {boolean} zeroIndexed - Whether the month is 0-indexed (default: true)
 * @returns {string} The month name
 */
function getMonthName(month, zeroIndexed = true) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const index = zeroIndexed ? month : month - 1;
  return monthNames[index];
}

/**
 * Validates that a year is within a reasonable range.
 * @param {number} year - The year to validate
 * @returns {boolean} True if valid
 */
function isValidYear(year) {
  const currentYear = new Date().getFullYear();
  return year >= 2000 && year <= currentYear + 5;
}

/**
 * Validates that a month is within range (1-12 for UI, 0-11 for internal).
 * @param {number} month - The month to validate
 * @param {boolean} oneIndexed - Whether the month is 1-indexed (default: true)
 * @returns {boolean} True if valid
 */
function isValidMonth(month, oneIndexed = true) {
  if (oneIndexed) {
    return month >= 1 && month <= 12;
  }
  return month >= 0 && month <= 11;
}

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} value - The value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded value
 */
function roundToDecimals(value, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Checks if a string is empty or only whitespace.
 * @param {string} str - The string to check
 * @returns {boolean} True if empty or whitespace only
 */
function isEmptyString(str) {
  return !str || str.trim().length === 0;
}

/**
 * Safely gets a property from an object with a default value.
 * @param {Object} obj - The object
 * @param {string} property - The property name
 * @param {*} defaultValue - The default value if property doesn't exist
 * @returns {*} The property value or default
 */
function getProperty(obj, property, defaultValue = null) {
  if (obj && obj.hasOwnProperty(property)) {
    return obj[property];
  }
  return defaultValue;
}

/**
 * Creates an array of month objects for dropdown menus.
 * @returns {Object[]} Array of month objects with value and label
 */
function getMonthOptions() {
  const months = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  for (let i = 0; i < 12; i++) {
    months.push({
      value: i + 1, // 1-indexed for UI
      label: monthNames[i]
    });
  }

  return months;
}

/**
 * Logs a message with a timestamp.
 * @param {string} message - The message to log
 * @param {string} level - The log level (INFO, WARN, ERROR)
 */
function logWithTimestamp(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  Logger.log(`[${timestamp}] [${level}] ${message}`);
}
