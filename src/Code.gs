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
 * Sets up a daily trigger (menu handler with dialog).
 */
function setupDailyTriggerMenu() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Setup Daily Trigger',
    'Enter hour to run (0-23):',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const hour = parseInt(response.getResponseText()) || 6;
  if (hour < 0 || hour > 23) {
    ui.alert('Error', 'Hour must be between 0 and 23.', ui.ButtonSet.OK);
    return;
  }

  try {
    ScriptApp.newTrigger('triggerDailyReport')
      .timeBased()
      .everyDays(1)
      .atHour(hour)
      .create();

    ui.alert('Success', `Daily trigger created. Report will generate every day at ${hour}:00.`, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Failed to create trigger: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Sets up a weekly trigger (menu handler with dialog).
 */
function setupWeeklyTriggerMenu() {
  const ui = SpreadsheetApp.getUi();

  const dayResponse = ui.prompt(
    'Setup Weekly Trigger',
    'Enter day of week (1=Monday, 2=Tuesday, ... 7=Sunday):',
    ui.ButtonSet.OK_CANCEL
  );

  if (dayResponse.getSelectedButton() !== ui.Button.OK) return;

  const dayNum = parseInt(dayResponse.getResponseText());
  if (dayNum < 1 || dayNum > 7) {
    ui.alert('Error', 'Day must be between 1 (Monday) and 7 (Sunday).', ui.ButtonSet.OK);
    return;
  }

  const hourResponse = ui.prompt(
    'Setup Weekly Trigger',
    'Enter hour to run (0-23):',
    ui.ButtonSet.OK_CANCEL
  );

  if (hourResponse.getSelectedButton() !== ui.Button.OK) return;

  const hour = parseInt(hourResponse.getResponseText()) || 6;
  if (hour < 0 || hour > 23) {
    ui.alert('Error', 'Hour must be between 0 and 23.', ui.ButtonSet.OK);
    return;
  }

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const dayName = days[dayNum - 1];

  try {
    ScriptApp.newTrigger('triggerWeeklyReport')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay[dayName])
      .atHour(hour)
      .create();

    ui.alert('Success', `Weekly trigger created. Report will generate every ${dayName} at ${hour}:00.`, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Failed to create trigger: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Sets up a monthly trigger (menu handler with dialog).
 */
function setupMonthlyTrigger() {
  const ui = SpreadsheetApp.getUi();

  const dayResponse = ui.prompt(
    'Setup Monthly Trigger',
    'Enter day of month to run (1-28):',
    ui.ButtonSet.OK_CANCEL
  );

  if (dayResponse.getSelectedButton() !== ui.Button.OK) return;

  const dayOfMonth = parseInt(dayResponse.getResponseText()) || 1;
  if (dayOfMonth < 1 || dayOfMonth > 28) {
    ui.alert('Error', 'Day must be between 1 and 28 (to work for all months).', ui.ButtonSet.OK);
    return;
  }

  const hourResponse = ui.prompt(
    'Setup Monthly Trigger',
    'Enter hour to run (0-23):',
    ui.ButtonSet.OK_CANCEL
  );

  if (hourResponse.getSelectedButton() !== ui.Button.OK) return;

  const hour = parseInt(hourResponse.getResponseText()) || 0;
  if (hour < 0 || hour > 23) {
    ui.alert('Error', 'Hour must be between 0 and 23.', ui.ButtonSet.OK);
    return;
  }

  try {
    ScriptApp.newTrigger('triggerMonthlyReport')
      .timeBased()
      .onMonthDay(dayOfMonth)
      .atHour(hour)
      .create();

    ui.alert('Success', `Monthly trigger created. Report will generate on day ${dayOfMonth} of each month at ${hour}:00.`, ui.ButtonSet.OK);
  } catch (error) {
    ui.alert('Error', 'Failed to create trigger: ' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Shows current triggers and allows removal.
 */
function removeAllTriggersMenu() {
  const ui = SpreadsheetApp.getUi();
  const triggers = ScriptApp.getProjectTriggers();

  if (triggers.length === 0) {
    ui.alert('Info', 'No triggers are currently set up.', ui.ButtonSet.OK);
    return;
  }

  // Build list of triggers
  let triggerList = 'Current triggers:\n\n';
  triggers.forEach((trigger, i) => {
    const handler = trigger.getHandlerFunction();
    triggerList += `${i + 1}. ${handler}\n`;
  });
  triggerList += '\nDo you want to remove ALL triggers?';

  const response = ui.alert('Remove Triggers', triggerList, ui.ButtonSet.YES_NO);

  if (response === ui.Button.YES) {
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
    ui.alert('Success', `Removed ${triggers.length} trigger(s).`, ui.ButtonSet.OK);
  }
}

/**
 * Handler for daily trigger - generates report for previous day.
 */
function triggerDailyReport() {
  try {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const startDateStr = formatDateForInput(yesterday);
    const endDateStr = formatDateForInput(todayStart);

    // Get all owned calendars
    const calendars = CalendarApp.getAllOwnedCalendars();
    const calendarIds = calendars.map(c => c.getId());

    generateReportForDateRange(startDateStr, endDateStr, calendarIds);
    Logger.log('Daily report generated successfully');
  } catch (error) {
    Logger.log('Daily report failed: ' + error.message);
    console.error(error);
  }
}

/**
 * Handler for weekly trigger - generates report for previous week.
 */
function triggerWeeklyReport() {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

    const startDateStr = formatDateForInput(weekAgo);
    const endDateStr = formatDateForInput(now);

    // Get all owned calendars
    const calendars = CalendarApp.getAllOwnedCalendars();
    const calendarIds = calendars.map(c => c.getId());

    generateReportForDateRange(startDateStr, endDateStr, calendarIds);
    Logger.log('Weekly report generated successfully');
  } catch (error) {
    Logger.log('Weekly report failed: ' + error.message);
    console.error(error);
  }
}

/**
 * Handler for monthly trigger - generates report for previous month.
 */
function triggerMonthlyReport() {
  try {
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const startDateStr = formatDateForInput(prevMonthStart);
    const endDateStr = formatDateForInput(prevMonthEnd);

    // Get all owned calendars
    const calendars = CalendarApp.getAllOwnedCalendars();
    const calendarIds = calendars.map(c => c.getId());

    generateReportForDateRange(startDateStr, endDateStr, calendarIds);
    Logger.log('Monthly report generated successfully');
  } catch (error) {
    Logger.log('Monthly report failed: ' + error.message);
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
