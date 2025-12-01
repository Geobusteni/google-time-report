/**
 * Google Time Report Generator
 * Main entry point for the container-bound Apps Script
 *
 * This script reads Google Calendar events, filters those starting with project codes,
 * computes hours, and generates structured reports in Google Sheets.
 *
 * Works with personal Google accounts (@gmail.com) - no Workspace required.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const PROJECT_CODE_REGEX = /^#(\S+)/;
const REPORT_SHEET_NAME = 'Report';
const TOTALS_SHEET_NAME = 'Totals';
const SPREADSHEET_NAME_PREFIX = 'Time Report';

// ============================================================================
// MENU AND UI SETUP
// ============================================================================

/**
 * Creates the add-on menu when a spreadsheet is opened.
 * This is a simple trigger that runs automatically.
 * @param {Object} e - The onOpen event object
 */
function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Time Reporting')
    .addItem('Generate Monthly Report', 'showSidebar')
    .addSeparator()
    .addItem('Generate Current Month', 'generateCurrentMonthReport')
    .addSeparator()
    .addItem('Setup Monthly Trigger', 'setupMonthlyTrigger')
    .addItem('Setup Daily Trigger', 'setupDailyTriggerMenu')
    .addItem('Setup Weekly Trigger', 'setupWeeklyTriggerMenu')
    .addItem('Remove All Triggers', 'removeAllTriggersMenu')
    .addToUi();
}

/**
 * Shows the sidebar UI for generating reports.
 */
function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Time Report Generator')
    .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

// ============================================================================
// MAIN REPORT GENERATION FUNCTIONS
// ============================================================================

/**
 * Generates report for the current month.
 * Called from menu or sidebar.
 * @returns {Object} Result object with success status, message, and spreadsheet URL
 */
function generateCurrentMonthReport() {
  const now = new Date();
  return generateReportForMonth(now.getFullYear(), now.getMonth());
}

/**
 * Generates report for a specific month.
 * This is the main entry point for report generation.
 * @param {number} year - The year (e.g., 2024)
 * @param {number} month - The month (0-11, where 0 = January)
 * @returns {Object} Result object with success status, message, and spreadsheet URL
 */
function generateReportForMonth(year, month) {
  try {
    Logger.log(`Starting report generation for ${year}-${month + 1}`);

    // Get date range for the month
    const { startDate, endDate } = getMonthDateRange(year, month);
    Logger.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch and filter calendar events
    const events = fetchCalendarEvents(startDate, endDate);
    Logger.log(`Found ${events.length} total events`);

    const filteredEvents = filterProjectEvents(events);
    Logger.log(`Found ${filteredEvents.length} project events (starting with #)`);

    if (filteredEvents.length === 0) {
      return {
        success: true,
        message: `No project events found for ${formatMonthYear(year, month)}. Events must start with # followed by a project code.`,
        spreadsheetUrl: null,
        eventCount: 0
      };
    }

    // Process events into report data
    const reportData = processEventsToReportData(filteredEvents);
    Logger.log(`Processed ${reportData.length} report rows`);

    // Calculate totals
    const totalsData = calculateTotals(reportData);
    Logger.log(`Calculated totals for ${totalsData.length - 1} projects`);

    // Create or get spreadsheet and write data
    const spreadsheet = getOrCreateMonthlySpreadsheet(year, month);
    writeReportToSheet(spreadsheet, reportData, totalsData);

    const message = `Report generated successfully! ${reportData.length} events processed for ${formatMonthYear(year, month)}.`;
    Logger.log(message);

    return {
      success: true,
      message: message,
      spreadsheetUrl: spreadsheet.getUrl(),
      eventCount: reportData.length
    };

  } catch (error) {
    const errorMessage = `Error generating report: ${error.message}`;
    Logger.log(errorMessage);
    console.error(error);

    return {
      success: false,
      message: errorMessage,
      spreadsheetUrl: null,
      eventCount: 0
    };
  }
}

/**
 * Generates report for a custom date range (called from sidebar).
 * @param {number} year - The year
 * @param {number} month - The month (1-12, human-readable format from UI)
 * @returns {Object} Result object
 */
function generateReportFromSidebar(year, month) {
  // Convert from 1-indexed (UI) to 0-indexed (JavaScript)
  return generateReportForMonth(parseInt(year), parseInt(month) - 1);
}

// ============================================================================
// TRIGGER MANAGEMENT
// ============================================================================

/**
 * Sets up a monthly trigger to run on the 1st of each month at 00:05.
 * @returns {Object} Result object with success status and message
 */
function setupMonthlyTrigger() {
  try {
    // Remove existing monthly triggers first
    removeTriggersForFunction('generateMonthlyReportTrigger');

    // Create new monthly trigger
    ScriptApp.newTrigger('generateMonthlyReportTrigger')
      .timeBased()
      .onMonthDay(1)
      .atHour(0)
      .nearMinute(5)
      .create();

    const message = 'Monthly trigger created. Report will generate on the 1st of each month at 00:05.';
    Logger.log(message);

    SpreadsheetApp.getUi().alert('Success', message, SpreadsheetApp.getUi().ButtonSet.OK);

    return { success: true, message: message };
  } catch (error) {
    const message = 'Failed to create trigger: ' + error.message;
    Logger.log(message);
    SpreadsheetApp.getUi().alert('Error', message, SpreadsheetApp.getUi().ButtonSet.OK);
    return { success: false, message: message };
  }
}

/**
 * Sets up a daily trigger (menu handler).
 */
function setupDailyTriggerMenu() {
  const result = setupDailyTrigger(6);
  SpreadsheetApp.getUi().alert(
    result.success ? 'Success' : 'Error',
    result.message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Sets up a daily trigger at a specified hour.
 * @param {number} hour - The hour to run (0-23)
 * @returns {Object} Result object with success status and message
 */
function setupDailyTrigger(hour = 6) {
  try {
    removeTriggersForFunction('generateMonthlyReportTrigger');

    ScriptApp.newTrigger('generateMonthlyReportTrigger')
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .create();

    return {
      success: true,
      message: `Daily trigger created. Report will generate every day at ${hour}:00.`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create daily trigger: ' + error.message
    };
  }
}

/**
 * Sets up a weekly trigger (menu handler).
 */
function setupWeeklyTriggerMenu() {
  const result = setupWeeklyTrigger('MONDAY', 6);
  SpreadsheetApp.getUi().alert(
    result.success ? 'Success' : 'Error',
    result.message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Sets up a weekly trigger on a specified day.
 * @param {string} dayOfWeek - The day of week (MONDAY, TUESDAY, etc.)
 * @param {number} hour - The hour to run (0-23)
 * @returns {Object} Result object with success status and message
 */
function setupWeeklyTrigger(dayOfWeek = 'MONDAY', hour = 6) {
  try {
    removeTriggersForFunction('generateMonthlyReportTrigger');

    const weekDay = ScriptApp.WeekDay[dayOfWeek];

    ScriptApp.newTrigger('generateMonthlyReportTrigger')
      .timeBased()
      .onWeekDay(weekDay)
      .atHour(hour)
      .create();

    return {
      success: true,
      message: `Weekly trigger created. Report will generate every ${dayOfWeek} at ${hour}:00.`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create weekly trigger: ' + error.message
    };
  }
}

/**
 * Removes all project triggers (menu handler).
 */
function removeAllTriggersMenu() {
  const result = removeAllTriggers();
  SpreadsheetApp.getUi().alert(
    result.success ? 'Success' : 'Error',
    result.message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Removes all project triggers.
 * @returns {Object} Result object with success status and message
 */
function removeAllTriggers() {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let count = 0;

    triggers.forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
      count++;
    });

    return {
      success: true,
      message: `Removed ${count} trigger(s).`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to remove triggers: ' + error.message
    };
  }
}

/**
 * Removes triggers for a specific function.
 * @param {string} functionName - The function name to remove triggers for
 */
function removeTriggersForFunction(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/**
 * Handler function for scheduled triggers.
 * Generates report for the previous month when run on the 1st,
 * otherwise generates for the current month.
 */
function generateMonthlyReportTrigger() {
  try {
    const now = new Date();
    const isFirstOfMonth = now.getDate() === 1;

    // If running on the 1st, generate report for previous month
    // Otherwise, generate for current month
    if (isFirstOfMonth) {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      generateReportForMonth(prevMonth.getFullYear(), prevMonth.getMonth());
    } else {
      generateCurrentMonthReport();
    }

    Logger.log('Scheduled report generation completed successfully');
  } catch (error) {
    Logger.log('Scheduled report generation failed: ' + error.message);
    console.error(error);
  }
}

// ============================================================================
// UTILITY FUNCTIONS FOR SIDEBAR
// ============================================================================

/**
 * Gets the default date range for the sidebar (current month).
 * @returns {Object} Object with startDate and endDate as YYYY-MM-DD strings
 */
function getDefaultDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // First day of current month
  const firstDay = new Date(year, month, 1);
  // Last day of current month
  const lastDay = new Date(year, month + 1, 0);

  return {
    startDate: formatDateForInput(firstDay),
    endDate: formatDateForInput(lastDay)
  };
}

/**
 * Formats a date as YYYY-MM-DD for HTML date input.
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generates report for a custom date range (called from sidebar).
 * @param {string} startDateStr - Start date as YYYY-MM-DD
 * @param {string} endDateStr - End date as YYYY-MM-DD
 * @param {string[]} calendarIds - Array of calendar IDs to include
 * @returns {Object} Result object
 */
function generateReportForDateRange(startDateStr, endDateStr, calendarIds) {
  try {
    Logger.log(`Starting report generation for ${startDateStr} to ${endDateStr}`);
    Logger.log(`Selected ${calendarIds.length} calendars`);

    // Parse date strings
    const startDate = parseInputDate(startDateStr);
    const endDate = parseInputDate(endDateStr);

    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    // Cap end date to now if it's in the future
    const now = new Date();
    if (endDate > now) {
      endDate.setTime(now.getTime());
      Logger.log(`End date capped to now: ${endDate.toISOString()}`);
    }

    Logger.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Fetch and filter calendar events
    const events = fetchCalendarEvents(startDate, endDate, calendarIds);
    Logger.log(`Found ${events.length} total events`);

    const filteredEvents = filterProjectEvents(events);
    Logger.log(`Found ${filteredEvents.length} project events (starting with #)`);

    if (filteredEvents.length === 0) {
      return {
        success: true,
        message: `No project events found for ${startDateStr} to ${endDateStr}. Events must start with # followed by a project code.`,
        spreadsheetUrl: null,
        eventCount: 0
      };
    }

    // Process events into report data
    const reportData = processEventsToReportData(filteredEvents);
    Logger.log(`Processed ${reportData.length} report rows`);

    // Calculate totals
    const totalsData = calculateTotals(reportData);
    Logger.log(`Calculated totals for ${totalsData.length - 1} projects`);

    // Create spreadsheet with date range in name
    const spreadsheet = createDateRangeSpreadsheet(startDateStr, endDateStr);
    writeReportToSheet(spreadsheet, reportData, totalsData);

    // Force write to complete
    SpreadsheetApp.flush();

    const url = spreadsheet.getUrl();
    const message = `Report generated successfully! ${reportData.length} events processed for ${startDateStr} to ${endDateStr}.`;
    Logger.log(message);
    Logger.log(`Spreadsheet URL: ${url}`);

    return {
      success: true,
      message: message,
      spreadsheetUrl: url,
      eventCount: reportData.length
    };

  } catch (error) {
    const errorMessage = `Error generating report: ${error.message}`;
    Logger.log(errorMessage);
    console.error(error);

    return {
      success: false,
      message: errorMessage,
      spreadsheetUrl: null,
      eventCount: 0
    };
  }
}

/**
 * Parses a YYYY-MM-DD date string into a Date object.
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Parsed date
 */
function parseInputDate(dateStr) {
  const parts = dateStr.split('-');
  return new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2]),
    0, 0, 0, 0
  );
}

/**
 * Creates a spreadsheet for a custom date range.
 * @param {string} startDateStr - Start date as YYYY-MM-DD
 * @param {string} endDateStr - End date as YYYY-MM-DD
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The spreadsheet
 */
function createDateRangeSpreadsheet(startDateStr, endDateStr) {
  const spreadsheetName = `${SPREADSHEET_NAME_PREFIX} – ${startDateStr} to ${endDateStr}`;
  Logger.log(`Creating spreadsheet: ${spreadsheetName}`);
  return SpreadsheetApp.create(spreadsheetName);
}
