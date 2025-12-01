/**
 * SheetService.gs
 * Handles all Google Sheets operations.
 * Creates spreadsheets, writes report data, and formats sheets.
 */

/**
 * Gets or creates a monthly spreadsheet for the specified month.
 * Always creates a new spreadsheet (simpler, no Drive search needed).
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet} The spreadsheet
 */
function getOrCreateMonthlySpreadsheet(year, month) {
  const spreadsheetName = generateSpreadsheetName(year, month);

  // Create new spreadsheet
  Logger.log(`Creating spreadsheet: ${spreadsheetName}`);
  const spreadsheet = SpreadsheetApp.create(spreadsheetName);

  return spreadsheet;
}

/**
 * Generates the spreadsheet name for a given month.
 * Format: "Time Report – YYYY-MM"
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {string} The spreadsheet name
 */
function generateSpreadsheetName(year, month) {
  const monthStr = String(month + 1).padStart(2, '0');
  return `${SPREADSHEET_NAME_PREFIX} – ${year}-${monthStr}`;
}

/**
 * Writes report data to the spreadsheet.
 * Creates Report and Totals sheets, clears existing data, and writes new data.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - The target spreadsheet
 * @param {Object[]} reportData - Array of report row objects
 * @param {Array[]} totalsData - 2D array for totals sheet
 */
function writeReportToSheet(spreadsheet, reportData, totalsData) {
  // Create or get the Report sheet
  const reportSheet = getOrCreateSheet(spreadsheet, REPORT_SHEET_NAME);

  // Create or get the Totals sheet
  const totalsSheet = getOrCreateSheet(spreadsheet, TOTALS_SHEET_NAME);

  // Clear both sheets
  reportSheet.clear();
  totalsSheet.clear();

  // Write Report sheet
  writeReportSheet(reportSheet, reportData);

  // Write Totals sheet
  writeTotalsSheet(totalsSheet, totalsData);

  // Delete default Sheet1 if it exists and is empty
  deleteDefaultSheetIfEmpty(spreadsheet);

  Logger.log('Report written to spreadsheet successfully');
}

/**
 * Gets an existing sheet or creates a new one.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - The spreadsheet
 * @param {string} sheetName - The name of the sheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} The sheet
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    Logger.log(`Created new sheet: ${sheetName}`);
  }

  return sheet;
}

/**
 * Writes data to the Report sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Report sheet
 * @param {Object[]} reportData - Array of report row objects
 */
function writeReportSheet(sheet, reportData) {
  // Define headers
  const headers = ['Date', 'Code', 'Title', 'Start', 'End', 'Hours'];

  // Convert report data to 2D array
  const dataRows = reportData.map(row => [
    row.date,
    row.code,
    row.title,
    row.startTime,
    row.endTime,
    row.hours
  ]);

  // Combine headers and data
  const allData = [headers, ...dataRows];

  // Write data to sheet
  if (allData.length > 0) {
    const range = sheet.getRange(1, 1, allData.length, headers.length);
    range.setValues(allData);
  }

  // Format the sheet
  formatReportSheet(sheet, reportData.length);
}

/**
 * Formats the Report sheet with headers, column widths, and styling.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Report sheet
 * @param {number} dataRowCount - Number of data rows (excluding header)
 */
function formatReportSheet(sheet, dataRowCount) {
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, 6);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');

  // Set column widths
  sheet.setColumnWidth(1, 100); // Date
  sheet.setColumnWidth(2, 120); // Code
  sheet.setColumnWidth(3, 300); // Title
  sheet.setColumnWidth(4, 80);  // Start
  sheet.setColumnWidth(5, 80);  // End
  sheet.setColumnWidth(6, 80);  // Hours

  // Format Hours column as number with 2 decimal places
  if (dataRowCount > 0) {
    const hoursRange = sheet.getRange(2, 6, dataRowCount, 1);
    hoursRange.setNumberFormat('0.00');
  }

  // Add alternating row colors for data rows
  if (dataRowCount > 0) {
    for (let i = 0; i < dataRowCount; i++) {
      const rowRange = sheet.getRange(i + 2, 1, 1, 6);
      if (i % 2 === 0) {
        rowRange.setBackground('#f8f9fa');
      }
    }
  }

  // Freeze header row
  sheet.setFrozenRows(1);

  // Auto-resize columns to fit content
  sheet.autoResizeColumns(1, 6);
}

/**
 * Writes data to the Totals sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Totals sheet
 * @param {Array[]} totalsData - 2D array with totals data
 */
function writeTotalsSheet(sheet, totalsData) {
  if (totalsData.length > 0) {
    const range = sheet.getRange(1, 1, totalsData.length, 2);
    range.setValues(totalsData);
  }

  // Format the sheet
  formatTotalsSheet(sheet, totalsData.length);
}

/**
 * Formats the Totals sheet with headers and styling.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Totals sheet
 * @param {number} rowCount - Total number of rows including header
 */
function formatTotalsSheet(sheet, rowCount) {
  if (rowCount === 0) return;

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, 2);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');

  // Set column widths
  sheet.setColumnWidth(1, 150); // Code
  sheet.setColumnWidth(2, 100); // Total Hours

  // Format Hours column as number with 2 decimal places
  if (rowCount > 1) {
    const hoursRange = sheet.getRange(2, 2, rowCount - 1, 1);
    hoursRange.setNumberFormat('0.00');
  }

  // Format grand total row (last row) with bold
  if (rowCount > 2) {
    const grandTotalRange = sheet.getRange(rowCount, 1, 1, 2);
    grandTotalRange.setFontWeight('bold');
    grandTotalRange.setBackground('#e8eaed');
  }

  // Freeze header row
  sheet.setFrozenRows(1);

  // Auto-resize columns
  sheet.autoResizeColumns(1, 2);
}

/**
 * Deletes the default "Sheet1" if it exists and is empty.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet - The spreadsheet
 */
function deleteDefaultSheetIfEmpty(spreadsheet) {
  const defaultSheet = spreadsheet.getSheetByName('Sheet1');

  if (defaultSheet) {
    // Check if sheet is empty (only has default 1 row and 1 column with no data)
    const dataRange = defaultSheet.getDataRange();
    const values = dataRange.getValues();

    const isEmpty = values.length === 1 &&
                    values[0].length === 1 &&
                    values[0][0] === '';

    if (isEmpty) {
      // Make sure we have other sheets before deleting
      if (spreadsheet.getSheets().length > 1) {
        spreadsheet.deleteSheet(defaultSheet);
        Logger.log('Deleted empty default Sheet1');
      }
    }
  }
}
