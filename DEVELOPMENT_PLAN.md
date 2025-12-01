# Development Plan: Google Time Report Generator

**Status**: Code Review Complete
**Date**: 2025-12-01

---

## Executive Summary

After thorough code review, the project is **FUNCTIONALLY COMPLETE**. All files specified in the project specification exist with full implementations. However, there is **one critical bug** that must be fixed before deployment.

---

## Code Review Findings

### What Exists (Complete)

| File | Status | Notes |
|------|--------|-------|
| `src/Code.gs` | COMPLETE | Menu, triggers, entry points |
| `src/CalendarService.gs` | COMPLETE | Event fetching, filtering, extraction |
| `src/SheetService.gs` | COMPLETE | Sheet creation, writing, formatting |
| `src/ReportGenerator.gs` | COMPLETE | Data processing, sorting, totals |
| `src/Utils.gs` | COMPLETE | Date utilities, formatting helpers |
| `src/Sidebar.html` | COMPLETE | Full UI with Google styling |
| `src/appsscript.json` | BUG | Missing required OAuth scope |
| `docs/DEPLOYMENT.md` | COMPLETE | Full deployment instructions |
| `README.md` | COMPLETE | Project documentation |

### Critical Bug Found

**File**: `src/appsscript.json`
**Issue**: Missing OAuth scope for Google Drive

The `SheetService.gs` file uses `DriveApp.getFilesByName()` in the `getOrCreateMonthlySpreadsheet()` function (line 18), but the manifest does not include the required Drive scope.

**Current scopes**:
```json
"oauthScopes": [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/script.container.ui"
]
```

**Required addition**:
```
"https://www.googleapis.com/auth/drive.file"
```

---

## Development Plan

Since the code is complete, this is a **bug fix and validation plan** rather than a new development plan.

---

## TRACK A (Developer 1): Bug Fix and Backend Validation

**Estimated Time**: 2-3 hours

### Task A1: Fix OAuth Scope Bug

**File**: `/root/gits/google-time-report/src/appsscript.json`

**Action**: Add the missing Drive scope

**Change**:
```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/drive.file"
  ]
}
```

**Acceptance Criteria**:
- [ ] The `drive.file` scope is added to `appsscript.json`
- [ ] Scope uses `drive.file` (minimal permissions) not `drive` (full access)

---

### Task A2: Validate Calendar Event Processing

**Files to Review**:
- `/root/gits/google-time-report/src/CalendarService.gs`
- `/root/gits/google-time-report/src/ReportGenerator.gs`

**Action**: Manual code review and testing

**Validation Checklist**:
- [ ] `PROJECT_CODE_REGEX` correctly matches `#CODE` format
- [ ] All-day events are filtered out
- [ ] Zero-duration events are filtered out
- [ ] Duration calculation is correct: `(endTime - startTime) / (1000 * 60 * 60)`
- [ ] Sorting works: Code -> Date -> Start time
- [ ] Totals calculation sums hours correctly
- [ ] Grand total row is added

**Test Cases to Execute** (in Google Apps Script):
1. Create test events with format `#TEST123 Meeting`
2. Run `generateCurrentMonthReport()` from Script Editor
3. Verify Report sheet has correct columns: Date, Code, Title, Start, End, Hours
4. Verify Totals sheet has correct totals

**Acceptance Criteria**:
- [ ] Report generates without errors
- [ ] All test events appear in report
- [ ] Hours are calculated correctly
- [ ] Totals match manual calculation

---

### Task A3: Validate Error Handling

**File**: `/root/gits/google-time-report/src/Code.gs`

**Action**: Test error scenarios

**Test Cases**:
1. Run report for month with no `#` events
2. Test with empty calendar
3. Test trigger creation and deletion

**Acceptance Criteria**:
- [ ] Empty calendar returns friendly message (not error)
- [ ] No events returns friendly message with guidance
- [ ] Triggers can be created and removed via menu

---

## TRACK B (Developer 2): UI and Integration Validation

**Estimated Time**: 2-3 hours

### Task B1: Validate Sidebar Functionality

**File**: `/root/gits/google-time-report/src/Sidebar.html`

**Action**: Manual UI testing

**Test Steps**:
1. Deploy script to a test Google Sheet
2. Refresh sheet and verify "Time Reporting" menu appears
3. Click "Generate Monthly Report" and verify sidebar opens
4. Verify year dropdown populates (current year +/- 2)
5. Verify month dropdown defaults to current month
6. Click "Generate Time Report" and verify:
   - Loading spinner appears
   - Success/error message displays
   - Link to spreadsheet works

**Acceptance Criteria**:
- [ ] Menu appears after spreadsheet refresh
- [ ] Sidebar opens correctly
- [ ] Year dropdown has correct range
- [ ] Month defaults to current month
- [ ] Loading state works
- [ ] Success message includes link to spreadsheet
- [ ] Error messages are user-friendly

---

### Task B2: Validate Sheet Output Format

**Files**:
- `/root/gits/google-time-report/src/SheetService.gs`

**Action**: Verify spreadsheet formatting

**Check**:
1. Spreadsheet named correctly: `Time Report - YYYY-MM`
2. Report sheet has:
   - Headers: Date, Code, Title, Start, End, Hours
   - Header row is blue with white text
   - Hours formatted to 2 decimal places
   - Alternating row colors
   - Frozen header row
3. Totals sheet has:
   - Headers: Code, Total Hours
   - Blue header row
   - Grand Total row at bottom (bold, gray background)
   - Frozen header row
4. Default "Sheet1" is deleted if empty

**Acceptance Criteria**:
- [ ] Spreadsheet name follows convention
- [ ] Report sheet formatting matches spec
- [ ] Totals sheet formatting matches spec
- [ ] Sheet1 is removed

---

### Task B3: Validate Trigger Setup

**File**: `/root/gits/google-time-report/src/Code.gs`

**Action**: Test all trigger menu items

**Test Steps**:
1. Click "Setup Monthly Trigger" - verify confirmation message
2. Click "Setup Daily Trigger" - verify confirmation message
3. Click "Setup Weekly Trigger" - verify confirmation message
4. Click "Remove All Triggers" - verify confirmation message
5. Go to Apps Script > Triggers to verify triggers exist/removed

**Acceptance Criteria**:
- [ ] Each trigger type can be created
- [ ] Confirmation dialogs appear
- [ ] Triggers appear in Apps Script dashboard
- [ ] Remove All Triggers clears all triggers

---

### Task B4: Update Deployment Documentation (if needed)

**File**: `/root/gits/google-time-report/docs/DEPLOYMENT.md`

**Action**: After completing validation, update deployment guide if any changes were made

**Potential Updates**:
- Add note about re-authorizing after scope change
- Document any issues discovered during testing

**Acceptance Criteria**:
- [ ] Documentation reflects actual deployment steps
- [ ] Any scope changes are documented

---

## Parallel Execution Plan

```
Time    Track A (Backend)              Track B (UI/Integration)
-----   --------------------------     --------------------------
0:00    A1: Fix OAuth scope            B1: Validate sidebar UI
0:30    A2: Validate event processing  B2: Validate sheet formatting
1:30    A3: Test error handling        B3: Test triggers
2:00    --                             B4: Update docs if needed
2:30    DONE                           DONE
```

---

## Definition of Done

The project is ready for deployment when:

1. [ ] OAuth scope bug is fixed in `appsscript.json`
2. [ ] All Track A validation tests pass
3. [ ] All Track B validation tests pass
4. [ ] Script successfully generates a report with test data
5. [ ] Documentation is accurate

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DriveApp scope missing | CONFIRMED | HIGH | Task A1 fixes this |
| Timezone edge cases | LOW | MEDIUM | Uses `Session.getScriptTimeZone()` correctly |
| Multi-day event handling | MEDIUM | LOW | Current code handles this via start/end times |

---

## Notes for Developers

1. **Test Environment**: Create a dedicated Google Sheet for testing. Do not test in production.

2. **Authorization**: After fixing the OAuth scope, users will need to re-authorize the script.

3. **Minimal Changes**: The code is complete. Do NOT add features. Only fix the scope bug and validate existing functionality.

4. **Test Data**: Create calendar events like:
   - `#TEST1 Morning standup` (30 min)
   - `#TEST1 Afternoon review` (1 hour)
   - `#TEST2 Client call` (2 hours)

   This tests multiple events per code and multiple codes.

5. **Do Not**:
   - Add new features
   - Refactor working code
   - Change coding style
   - Add dependencies
