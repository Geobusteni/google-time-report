/**
 * CalendarService.gs
 * Handles all Google Calendar API interactions.
 * Fetches events and filters them based on project code criteria.
 */

/**
 * Fetches all calendar events within a date range from ALL user calendars.
 * @param {Date} startDate - The start of the date range
 * @param {Date} endDate - The end of the date range
 * @returns {GoogleAppsScript.Calendar.CalendarEvent[]} Array of calendar events
 */
function fetchCalendarEvents(startDate, endDate) {
  try {
    const allEvents = [];
    const calendars = CalendarApp.getAllCalendars();

    Logger.log(`Found ${calendars.length} calendars`);

    calendars.forEach(calendar => {
      const events = calendar.getEvents(startDate, endDate);
      Logger.log(`Fetched ${events.length} events from calendar "${calendar.getName()}"`);
      allEvents.push(...events);
    });

    Logger.log(`Total events from all calendars: ${allEvents.length}`);

    return allEvents;
  } catch (error) {
    Logger.log('Error fetching calendar events: ' + error.message);
    throw new Error('Failed to fetch calendar events. Please check calendar permissions.');
  }
}

/**
 * Filters events to only include those with titles starting with a project code (#).
 * Also filters out all-day events and zero-duration events.
 * @param {GoogleAppsScript.Calendar.CalendarEvent[]} events - Array of calendar events
 * @returns {GoogleAppsScript.Calendar.CalendarEvent[]} Filtered array of project events
 */
function filterProjectEvents(events) {
  return events.filter(event => {
    const title = event.getTitle();

    // Check if title starts with #
    if (!PROJECT_CODE_REGEX.test(title)) {
      return false;
    }

    // Skip all-day events
    if (event.isAllDayEvent()) {
      Logger.log(`Skipping all-day event: ${title}`);
      return false;
    }

    // Calculate duration and skip zero-duration events
    const startTime = event.getStartTime();
    const endTime = event.getEndTime();
    const durationMs = endTime.getTime() - startTime.getTime();

    if (durationMs <= 0) {
      Logger.log(`Skipping zero-duration event: ${title}`);
      return false;
    }

    return true;
  });
}

/**
 * Extracts the project code from an event title.
 * The project code is the first word after # until the next whitespace.
 * @param {string} title - The event title
 * @returns {string} The extracted project code, or empty string if not found
 */
function extractProjectCode(title) {
  const match = title.match(PROJECT_CODE_REGEX);
  if (match && match[1]) {
    return match[1];
  }
  return '';
}

/**
 * Calculates the duration of an event in hours.
 * @param {GoogleAppsScript.Calendar.CalendarEvent} event - The calendar event
 * @returns {number} Duration in hours (as a decimal)
 */
function calculateEventDuration(event) {
  const startTime = event.getStartTime();
  const endTime = event.getEndTime();
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // Round to 2 decimal places
  return Math.round(durationHours * 100) / 100;
}

/**
 * Gets event details in a normalized format.
 * @param {GoogleAppsScript.Calendar.CalendarEvent} event - The calendar event
 * @returns {Object} Normalized event data
 */
function getEventDetails(event) {
  const title = event.getTitle();
  const projectCode = extractProjectCode(title);
  const startTime = event.getStartTime();
  const endTime = event.getEndTime();
  const duration = calculateEventDuration(event);
  const timezone = getTimezone();

  return {
    title: title,
    code: projectCode,
    date: formatDateOnly(startTime, timezone),
    startTime: formatTimeOnly(startTime, timezone),
    endTime: formatTimeOnly(endTime, timezone),
    hours: duration,
    // Keep original dates for sorting
    startDate: startTime,
    endDate: endTime
  };
}

/**
 * Gets the timezone to use for formatting.
 * Uses the script's timezone setting.
 * @returns {string} Timezone string
 */
function getTimezone() {
  return Session.getScriptTimeZone();
}
