# Google Time Report Generator

A Google Apps Script that automatically generates monthly time reports from Google Calendar events, filtering by project codes.

## Features

- Reads events from Google Calendar
- Filters events starting with project codes (e.g., `#193IQTIG Meeting`)
- Computes duration in hours for each event
- Groups events by project code and date
- Creates formatted Google Sheets reports with:
  - **Report** sheet: Detailed list of all events
  - **Totals** sheet: Aggregated hours per project
- Automatic monthly report generation via triggers
- Sidebar UI for easy month selection
- Works with personal Google accounts (@gmail.com)

## How It Works

1. Create calendar events with titles starting with `#` followed by a project code:
   - `#193IQTIG Daily Standup`
   - `#204KLMUX Code Review`
   - `#ABC123 Client Meeting`

2. Run the report generator for a specific month

3. Get a spreadsheet with:
   - Every event listed with Date, Code, Title, Start, End, Hours
   - Totals per project code
   - Grand total of all hours

## Quick Start

1. Create a new Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Copy the script files from the `src/` folder
4. Save and refresh the spreadsheet
5. Click **Time Reporting** → **Generate Monthly Report**
6. Authorize the script when prompted

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## Project Structure

```
src/
├── appsscript.json       # Manifest with OAuth scopes
├── Code.gs               # Main entry point, menus, triggers
├── CalendarService.gs    # Calendar API integration
├── SheetService.gs       # Spreadsheet creation and formatting
├── ReportGenerator.gs    # Data processing and calculations
├── Utils.gs              # Date/time utilities
└── Sidebar.html          # User interface
```

## Event Naming Convention

Events must follow this format:
```
#<PROJECT_CODE> <Description>
```

Examples:
- `#PROJ1 Team Meeting`
- `#CLIENT-ABC Sprint Review`
- `#12345 Development Work`

The project code is extracted as all characters between `#` and the first space.

## Report Output

### Report Sheet
| Date | Code | Title | Start | End | Hours |
|------|------|-------|-------|-----|-------|
| 2024-11-01 | ABC123 | ABC123 Client Call | 09:00 | 10:30 | 1.50 |
| 2024-11-01 | XYZ789 | XYZ789 Development | 14:00 | 17:00 | 3.00 |

### Totals Sheet
| Code | Total Hours |
|------|-------------|
| ABC123 | 15.50 |
| XYZ789 | 42.00 |
| GRAND TOTAL | 57.50 |

## Automation

Set up automatic report generation:

- **Monthly**: Runs on the 1st of each month at 00:05
- **Weekly**: Runs every Monday at 6:00 AM
- **Daily**: Runs every day at 6:00 AM

Use the **Time Reporting** menu to configure triggers.

## Requirements

- Personal Google account (@gmail.com) or Google Workspace
- Google Calendar access
- Google Sheets access

## Ignored Events

The script ignores:
- All-day events
- Zero-duration events
- Events not starting with `#`

## Timezone

The script uses your Google Apps Script project timezone. Update `appsscript.json` to change it:

```json
{
  "timeZone": "America/New_York"
}
```

## License

MIT License - feel free to use and modify for your needs.
