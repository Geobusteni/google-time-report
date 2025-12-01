# Deployment Guide

This guide explains how to deploy the Google Time Report Generator for personal Google accounts (@gmail.com).

## Prerequisites

- A personal Google account (works with @gmail.com)
- Google Calendar with events to report on
- Google Sheets access

## Step-by-Step Installation

### Step 1: Create a New Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click **Blank** to create a new spreadsheet
3. Give it a name (e.g., "Time Report Controller")

### Step 2: Open the Script Editor

1. In your new spreadsheet, go to **Extensions** menu
2. Click **Apps Script**
3. This opens the Apps Script editor in a new tab

### Step 3: Add the Script Files

Delete any existing code in the default `Code.gs` file, then:

#### 3a. Code.gs
1. Replace the contents of `Code.gs` with the code from `src/Code.gs`

#### 3b. CalendarService.gs
1. Click the **+** button next to "Files"
2. Select **Script**
3. Name it `CalendarService` (the .gs extension is added automatically)
4. Paste the code from `src/CalendarService.gs`

#### 3c. SheetService.gs
1. Click the **+** button next to "Files"
2. Select **Script**
3. Name it `SheetService`
4. Paste the code from `src/SheetService.gs`

#### 3d. ReportGenerator.gs
1. Click the **+** button next to "Files"
2. Select **Script**
3. Name it `ReportGenerator`
4. Paste the code from `src/ReportGenerator.gs`

#### 3e. Utils.gs
1. Click the **+** button next to "Files"
2. Select **Script**
3. Name it `Utils`
4. Paste the code from `src/Utils.gs`

#### 3f. Sidebar.html
1. Click the **+** button next to "Files"
2. Select **HTML**
3. Name it `Sidebar` (the .html extension is added automatically)
4. Paste the code from `src/Sidebar.html`

### Step 4: Update the Manifest

1. Click the **Project Settings** gear icon (left sidebar)
2. Check the box **Show "appsscript.json" manifest file in editor**
3. Go back to the **Editor** (</> icon)
4. Click on `appsscript.json` in the file list
5. Replace its contents with:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.scriptapp"
  ]
}
```

**Important**: Change `"America/New_York"` to your local timezone if needed. Common timezones:
- `"America/Los_Angeles"` - Pacific Time
- `"America/Chicago"` - Central Time
- `"Europe/London"` - UK Time
- `"Europe/Paris"` - Central European Time
- `"Asia/Tokyo"` - Japan Time

### Step 5: Save All Files

1. Press **Ctrl+S** (or Cmd+S on Mac) to save
2. Or click the floppy disk icon

### Step 6: Authorize the Script

1. Close the Apps Script editor tab
2. Go back to your spreadsheet
3. **Refresh the page** (F5 or Ctrl+R)
4. Wait a few seconds for the custom menu to appear
5. Click **Time Reporting** in the menu bar
6. Click **Generate Monthly Report**

You'll see an authorization dialog:

1. Click **Continue**
2. Choose your Google account
3. Click **Advanced** (at the bottom left)
4. Click **Go to [Your Project Name] (unsafe)**
5. Click **Allow**

**Note**: The "unsafe" warning appears because this is a personal script, not verified by Google. This is normal for personal scripts.

### Step 7: Generate Your First Report

1. After authorization, click **Time Reporting** → **Generate Monthly Report**
2. The sidebar will open
3. Select a year and month
4. Click **Generate Time Report**
5. When complete, click the link to open your report

## Setting Up Automatic Triggers

### Monthly Automatic Reports

To automatically generate a report on the 1st of each month:

1. Click **Time Reporting** → **Setup Monthly Trigger**
2. Confirm the success message

### Daily or Weekly Reports

Use the menu options:
- **Time Reporting** → **Setup Daily Trigger** (runs at 6:00 AM)
- **Time Reporting** → **Setup Weekly Trigger** (runs Monday at 6:00 AM)

### Remove All Triggers

To stop automatic reports:
1. Click **Time Reporting** → **Remove All Triggers**

## Configuration Options

### Changing the Timezone

1. Open Apps Script (Extensions → Apps Script)
2. Edit `appsscript.json`
3. Change the `timeZone` value
4. Save and refresh your spreadsheet

### Custom Trigger Times

To customize when triggers run, edit `Code.gs`:

```javascript
// For daily trigger at 9 AM instead of 6 AM:
setupDailyTrigger(9);

// For weekly trigger on Friday at 5 PM:
setupWeeklyTrigger('FRIDAY', 17);
```

### Using a Specific Calendar

By default, the script uses your primary calendar. To use a different calendar:

1. Open `CalendarService.gs`
2. Find the `fetchCalendarEvents` function
3. Change:
   ```javascript
   const calendar = CalendarApp.getDefaultCalendar();
   ```
   To:
   ```javascript
   const calendar = CalendarApp.getCalendarById('your-calendar-id@group.calendar.google.com');
   ```

## Troubleshooting

### "Time Reporting" menu doesn't appear
- Refresh the spreadsheet page
- Wait 10-15 seconds after refresh
- Check for JavaScript errors in browser console

### "Authorization required" error
- Click the menu item again
- Complete the authorization flow
- If stuck, go to Apps Script and run any function manually

### No events found
- Verify your calendar has events starting with `#`
- Check the date range selected
- All-day events are ignored

### Wrong timezone
- Update `appsscript.json` with your correct timezone
- Save and refresh the spreadsheet

### Script errors
1. Go to Extensions → Apps Script
2. Click **Executions** in the left sidebar
3. Review any failed executions for error details

## Updating the Script

To update to a new version:

1. Open Apps Script (Extensions → Apps Script)
2. Replace the contents of each file with the new version
3. Save all files
4. Refresh your spreadsheet

## Security Notes

- The script only reads your calendar (no modifications)
- The script creates spreadsheets in your Google Drive
- No data is sent to external servers
- All processing happens within Google's infrastructure
