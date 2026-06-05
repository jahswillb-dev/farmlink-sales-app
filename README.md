# FarmLink Canvasser Console

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

After connecting the backend URL, users log in with their own username or email and password. The app receives their role from the `Users` sheet and hides records outside their scope.

Only Sales Admin users can open the backend status panel and Users page in the app. Regular canvassers and area managers do not configure anything in their browsers.

## User Administration

- Sales Admin users can create and edit users from the in-app `Users` page.
- Sales Admin users can assign `Canvasser`, `Area Manager`, and `Sales Admin` roles.
- Canvasser accounts must be assigned to an Area Manager.
- Sales Admin users can activate and deactivate user accounts.
- Sales Admin users can permanently delete user accounts from the `Users` sheet.
- New passwords and password resets are sent to Apps Script and stored as SHA-256 hashes in the `Users` sheet.
- A Sales Admin cannot deactivate or remove Sales Admin access from their own account.
- A user cannot be deleted while they still own customers/distributors or manage assigned canvassers.

## Delete And Void Rules

- Sales Admin users can permanently delete customers, distributors, visits, follow-ups, sales, and complaints.
- Canvassers and Area Managers can only void those records.
- Voided records remain in Google Sheets with `voided`, `voidedBy`, and `voidedAt` metadata.
- After updating Apps Script, open the `/exec?action=setup` URL once so the new void columns are added to existing sheets.

## Complaint Evidence

- Complaints can include multiple photo and video evidence files.
- Photos are compressed before saving; videos must be under 8 MB each.
- Apps Script uploads evidence files to Google Drive in the `FarmLink Complaint Evidence` folder.
- The `Complaints` sheet stores `evidenceName` and `evidenceData` metadata with Drive links.

## GPS Accuracy

- GPS capture uses high-accuracy browser location with live calibration.
- The app only accepts readings with reported accuracy of 400 meters or better.
- If the device cannot reach 400m accuracy, move to an open area and retry.

## Offline Sync

- Users must log in online at least once.
- When connected, records are saved to Google Sheets through Apps Script.
- When offline, records are cached in IndexedDB and marked as pending sync.
- When the connection returns, the app automatically pushes pending changes to the live backend.
- The IndexedDB cache is not the database; Google Sheets remains the source of truth.

## Default Test Accounts

Running setup seeds these accounts. The default password is `password`.

- `ada` or `ada@farmlink.local` - Canvasser
- `tunde` or `tunde@farmlink.local` - Canvasser
- `miriam` or `miriam@farmlink.local` - Area Manager
- `bola` or `bola@farmlink.local` - Canvasser
- `grace` or `grace@farmlink.local` - Area Manager
- `admin` or `admin@farmlink.local` - Sales Admin

Change passwords in Apps Script by running:

```js
setUserPassword("ada@farmlink.local", "new-secure-password");
```

You can use either username or email in `setUserPassword`.

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
  "Active",
  "newcanvasser"
);
```

For canvassers, `managerId` should be the area manager's user id. For area managers and sales admins, leave `managerId` blank.

## Database Tabs

The Apps Script backend creates these tabs:

- `Users`
- `AuthTokens`
- `Customers`
- `Distributors`
- `BirdDetails`
- `Visits`
- `Followups`
- `Sales`
- `SaleItems`
- `Complaints`
- `AuditLogs`

Customers and distributors are stored in separate master tabs. Shared activity tabs still use the `customerId` column as the linked account id, so a visit, follow-up, sale, complaint, or audit row can point to either a customer id (`c...`) or distributor id (`d...`).

Sales are split into `Sales` and `SaleItems` so multiple product line items can be stored cleanly.

The `Users` sheet stores `username` as the last column so existing sheets can be upgraded without shifting password or role columns.

## Notes

- Use the deployed `/exec` URL, not the Apps Script `/dev` URL, for GitHub Pages.
- The app sends simple text POST requests to avoid browser preflight issues.
- User passwords are stored as SHA-256 hashes in the `Users` tab, not plain text.
- Backend login tokens expire after 14 days.
- Keep this as a lightweight prototype backend. For production scale, add stronger password rules, reset-password flow, audit approvals, and stricter server-side validation.
