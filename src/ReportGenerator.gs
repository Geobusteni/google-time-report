/**
 * ReportGenerator.gs
 * Core report generation logic.
 * Processes events, groups data, and calculates totals.
 */

/**
 * Processes calendar events into report data format.
 * Extracts relevant information and sorts by code, date, and start time.
 * @param {GoogleAppsScript.Calendar.CalendarEvent[]} events - Array of filtered calendar events
 * @returns {Object[]} Array of report row objects
 */
function processEventsToReportData(events) {
  // Convert events to report data format
  const reportData = events.map(event => getEventDetails(event));

  // Sort by Code, then Date, then Start time
  reportData.sort((a, b) => {
    // First, sort by code
    const codeCompare = a.code.localeCompare(b.code);
    if (codeCompare !== 0) return codeCompare;

    // Then by date
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;

    // Finally by start time
    return a.startTime.localeCompare(b.startTime);
  });

  return reportData;
}

/**
 * Calculates totals by project code.
 * Returns a 2D array suitable for writing to a sheet.
 * @param {Object[]} reportData - Array of report row objects
 * @returns {Array[]} 2D array with headers, project totals, and grand total
 */
function calculateTotals(reportData) {
  // Group hours by project code
  const totalsMap = new Map();

  reportData.forEach(row => {
    const currentTotal = totalsMap.get(row.code) || 0;
    totalsMap.set(row.code, currentTotal + row.hours);
  });

  // Convert to sorted array
  const sortedCodes = Array.from(totalsMap.keys()).sort();

  // Build the totals data array
  const totalsData = [['Code', 'Total Hours']];

  let grandTotal = 0;

  sortedCodes.forEach(code => {
    const hours = totalsMap.get(code);
    // Round to 2 decimal places
    const roundedHours = Math.round(hours * 100) / 100;
    totalsData.push([code, roundedHours]);
    grandTotal += hours;
  });

  // Add grand total row
  const roundedGrandTotal = Math.round(grandTotal * 100) / 100;
  totalsData.push(['GRAND TOTAL', roundedGrandTotal]);

  return totalsData;
}

/**
 * Groups report data by project code.
 * Useful for detailed analysis or alternative report formats.
 * @param {Object[]} reportData - Array of report row objects
 * @returns {Map<string, Object[]>} Map of project code to array of events
 */
function groupByProjectCode(reportData) {
  const grouped = new Map();

  reportData.forEach(row => {
    if (!grouped.has(row.code)) {
      grouped.set(row.code, []);
    }
    grouped.get(row.code).push(row);
  });

  return grouped;
}

/**
 * Groups report data by date.
 * Useful for daily summaries or alternative report formats.
 * @param {Object[]} reportData - Array of report row objects
 * @returns {Map<string, Object[]>} Map of date to array of events
 */
function groupByDate(reportData) {
  const grouped = new Map();

  reportData.forEach(row => {
    if (!grouped.has(row.date)) {
      grouped.set(row.date, []);
    }
    grouped.get(row.date).push(row);
  });

  return grouped;
}

/**
 * Calculates daily totals for each project.
 * Returns a summary of hours per project per day.
 * @param {Object[]} reportData - Array of report row objects
 * @returns {Object[]} Array of daily summary objects
 */
function calculateDailyTotals(reportData) {
  const dailyMap = new Map();

  reportData.forEach(row => {
    const key = `${row.date}|${row.code}`;

    if (!dailyMap.has(key)) {
      dailyMap.set(key, {
        date: row.date,
        code: row.code,
        hours: 0,
        eventCount: 0
      });
    }

    const summary = dailyMap.get(key);
    summary.hours += row.hours;
    summary.eventCount += 1;
  });

  // Convert to array and sort
  const dailyTotals = Array.from(dailyMap.values());

  dailyTotals.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.code.localeCompare(b.code);
  });

  // Round hours
  dailyTotals.forEach(summary => {
    summary.hours = Math.round(summary.hours * 100) / 100;
  });

  return dailyTotals;
}

/**
 * Generates a summary report with statistics.
 * @param {Object[]} reportData - Array of report row objects
 * @returns {Object} Summary statistics
 */
function generateSummaryStatistics(reportData) {
  if (reportData.length === 0) {
    return {
      totalEvents: 0,
      totalHours: 0,
      uniqueProjects: 0,
      uniqueDays: 0,
      averageHoursPerEvent: 0,
      averageHoursPerDay: 0
    };
  }

  const uniqueProjects = new Set(reportData.map(r => r.code));
  const uniqueDays = new Set(reportData.map(r => r.date));
  const totalHours = reportData.reduce((sum, r) => sum + r.hours, 0);

  return {
    totalEvents: reportData.length,
    totalHours: Math.round(totalHours * 100) / 100,
    uniqueProjects: uniqueProjects.size,
    uniqueDays: uniqueDays.size,
    averageHoursPerEvent: Math.round((totalHours / reportData.length) * 100) / 100,
    averageHoursPerDay: Math.round((totalHours / uniqueDays.size) * 100) / 100
  };
}
