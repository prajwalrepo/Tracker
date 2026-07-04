# Habit, Task, and Trading Tracker

This is a single-page, mobile-friendly tracker for:

- Daily habits
- Tasks
- Trading P&amp;L entries

The page stores data in the browser with `localStorage` and can sync entries to Google Sheets by calling a Google Apps Script web app.

## Files

- `index.html`: main page
- `styles.css`: responsive styling
- `app.js`: browser logic, local storage, and sync
- `google-apps-script/Code.gs`: Apps Script endpoint for Google Sheets

## How to run

For local tracking only, open `index.html` in a browser.

For Google Sheets sync, serve the folder from a small local web server instead of opening it directly as a `file://` page. In VS Code, a simple static server or Live Server works well.

## Google Sheets setup

1. Create a new Google Sheet.
2. Open `Extensions -> Apps Script`.
3. Paste the content from `google-apps-script/Code.gs` into the script editor.
4. Save the project.
5. Deploy it as a Web App:
   - Execute as: `Me`
   - Who has access: `Anyone` or `Anyone with the link`
6. Copy the deployed Web App URL from the deployment screen.
7. Paste that URL into the `Google Apps Script Web App URL` field in the page.
8. Click `Save connection`.
9. Add entries and use `Sync pending entries`.

### How to get the URL

The app does not use the normal Google Sheet link. It needs the Apps Script Web App URL:

1. Open the sheet in Google Sheets.
2. Go to `Extensions -> Apps Script`.
3. In Apps Script, click `Deploy -> New deployment`.
4. Choose `Web app`.
5. Set access to `Anyone` or `Anyone with the link`.
6. Deploy and copy the `Web app URL`.
7. Use that URL in the app settings.

## Sheet tabs created automatically

The script will create these tabs if they do not exist:

- `Habits`
- `Tasks`
- `Trades`

## Notes

- If the sheet connection is missing or a sync fails, entries remain saved locally with a pending or failed sync state.
- The UI is designed to work on desktop and mobile screens.