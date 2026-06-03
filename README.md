# FarmLink Sales Web App

Static frontend for GitHub Pages with a Google Sheets / Apps Script backend.

## Frontend Hosting On GitHub Pages

1. Create a GitHub repository.
2. Upload everything in this `field-canvasser-prototype` folder.
3. In GitHub, open **Settings > Pages**.
4. Set **Source** to your main branch and root folder.
5. Open the generated GitHub Pages URL.

The app still works without a backend using local browser storage.

## Google Sheets Backend

1. Create a Google Sheet.
2. Open **Extensions > Apps Script**.
3. Paste the contents of `apps-script/Code.gs`.
4. Save the script.
5. Run `doGet` once or visit the web app with `?action=setup` after deployment to create the sheet tabs.
6. Deploy with **Deploy > New deployment > Web app**.
7. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
8. Copy the `/exec` Web App URL.

## Connect The App To Sheets

Option A: edit `config.js`:

```js
window.FARMLINK_BACKEND_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

Option B: in the app, click the sync status button in the top header, paste the Apps Script Web App URL, and save.

Use **Push** in the backend modal to seed the Google Sheet with the current demo data. Use **Pull** to reload from the Google Sheet.

## Database Tabs

The Apps Script backend creates these tabs:

- `Users`
- `Customers`
- `BirdDetails`
- `Visits`
- `Followups`
- `Sales`
- `SaleItems`
- `Complaints`
- `AuditLogs`

Sales are split into `Sales` and `SaleItems` so multiple product line items can be stored cleanly.

## Notes

- Use the deployed `/exec` URL, not the Apps Script `/dev` URL, for GitHub Pages.
- The app sends simple text POST requests to avoid browser preflight issues.
- Keep this as a lightweight prototype backend. For production scale, add authentication, server-side authorization, validation, and per-record update APIs.
