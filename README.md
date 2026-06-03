# FarmLink Sales Web App

Static frontend for GitHub Pages with a Google Sheets / Apps Script backend.

## Frontend Hosting On GitHub Pages

1. Create a GitHub repository.
2. Upload everything in this `field-canvasser-prototype` folder.
3. In GitHub, open **Settings > Pages**.
4. Set **Source** to your main branch and root folder.
5. Open the generated GitHub Pages URL.

The live app requires a configured Apps Script backend. IndexedDB browser cache is used only for offline records and pending sync while a logged-in user is disconnected.

## Google Sheets Backend

1. Create a Google Sheet.
2. Open **Extensions > Apps Script**.
3. Paste the contents of `apps-script/Code.gs`.
4. Save the script.
5. Deploy with **Deploy > New deployment > Web app**.
6. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
7. Copy the `/exec` Web App URL.
8. Visit the Web App URL with `?action=setup` once to create tabs and seed default user accounts.
   Example: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=setup`

## Connect The App To Sheets

Edit `config.js` before deploying or pushing to GitHub Pages:

```js
window.FARMLINK_BACKEND_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

After connecting the backend URL, users log in with their own email and password. The app receives their role from the `Users` sheet and hides records outside their scope.

Only Sales Admin users can open the backend status panel in the app. Regular canvassers and area managers do not configure anything in their browsers.

## Offline Sync

- Users must log in online at least once.
- When connected, records are saved to Google Sheets through Apps Script.
- When offline, records are cached in IndexedDB and marked as pending sync.
- When the connection returns, the app automatically pushes pending changes to the live backend.
- The IndexedDB cache is not the database; Google Sheets remains the source of truth.

## Default Test Accounts

Running setup seeds these accounts. The default password is `password`.

- `ada@farmlink.local` - Canvasser
- `tunde@farmlink.local` - Canvasser
- `miriam@farmlink.local` - Area Manager
- `bola@farmlink.local` - Canvasser
- `grace@farmlink.local` - Area Manager
- `admin@farmlink.local` - Sales Admin

Change passwords in Apps Script by running:

```js
setUserPassword("ada@farmlink.local", "new-secure-password");
```

Create or update a user account by running:

```js
upsertUserAccount(
  "u7",
  "New Canvasser",
  "newcanvasser@company.com",
  "temporary-password",
  "Canvasser",
  "New Territory",
  "u3",
  "Active"
);
```

For canvassers, `managerId` should be the area manager's user id. For area managers and sales admins, leave `managerId` blank.

## Database Tabs

The Apps Script backend creates these tabs:

- `Users`
- `AuthTokens`
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
- User passwords are stored as SHA-256 hashes in the `Users` tab, not plain text.
- Backend login tokens expire after 14 days.
- Keep this as a lightweight prototype backend. For production scale, add stronger password rules, reset-password flow, audit approvals, and stricter server-side validation.
