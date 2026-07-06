# LifeTracker

This is a single-page, mobile-friendly tracker with a home screen that works like a phone app launcher.

It includes:

- Daily habits
- Tasks
- Trading P&amp;L entries
- Portfolio and stocks
- Workout planner (muscle group -> exercise -> today's workout list with weight and reps)
- Diet calculator (food item + serving/weight based macro calculation)

The page stores data in the browser with `localStorage` and can sync entries to Google Sheets through Google Apps Script web apps.

## Files

- `index.html`: main page
- `styles.css`: responsive styling
- `app.js`: older vanilla JS version
- `app-react.jsx`: current React app logic and UI
- `google-apps-script/Code.gs`: Apps Script endpoint for Google Sheets

## How to run

For local tracking only, open `index.html` in a browser.

For Google Sheets sync, serve the folder from a small local web server instead of opening it directly as a `file://` page. In VS Code, a simple static server or Live Server works well.

## Google Sheets setup (3 web app URLs)

Use 3 Google Sheets and deploy Apps Script as web app for each:

1. Habits + Tasks sheet URL
2. Stocks + Trades + Portfolio sheet URL
3. Workout + Diet sheet URL

In each sheet:

1. Open `Extensions -> Apps Script`.
2. Paste `google-apps-script/Code.gs`.
3. Deploy as web app (`Execute as: Me`, `Access: Anyone with link`).
4. Copy the web app URL and paste it in app Settings under the matching URL field.

The health sheet endpoint also provides catalog data for dropdowns:

- `WorkoutCatalog` tab: body parts in columns, workouts in rows (`Group - Exercise` format)
- `DietCatalog` tab: food rows with serving + macros

When you add or update rows in these catalog tabs, the app loads them automatically from the health sheet URL.

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
- `Portfolio`
- `Stocks`
- `Workouts`
- `Diets`
- `DietTargets`
- `WorkoutCatalog`
- `DietCatalog`

## Notes

- If the sheet connection is missing or a sync fails, entries remain saved locally with a pending or failed sync state.
- The UI is designed to work on desktop and mobile screens.
- Workout and diet data now sync to the health sheet when the health URL is configured.