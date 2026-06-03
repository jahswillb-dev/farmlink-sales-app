const SPREADSHEET_ID = "";
const DEFAULT_PASSWORD = "password";
const TOKEN_TTL_DAYS = 14;

const TABLES = {
  Users: ["id", "name", "email", "passwordHash", "role", "territory", "managerId", "status", "username"],
  AuthTokens: ["token", "userId", "createdAt", "expiresAt"],
  Customers: ["id", "farmName", "contact", "phone", "altPhone", "email", "address", "state", "lga", "town", "category", "farmType", "birdType", "capacity", "stock", "pens", "stage", "feedConsumption", "feedBrand", "frequency", "supplier", "notes", "lat", "lng", "accuracy", "ownerId", "createdBy", "createdAt", "updatedBy", "updatedAt"],
  BirdDetails: ["id", "customerId", "birdType", "breed", "stage", "quantity", "pen", "age", "mortality", "feed", "notes"],
  Visits: ["id", "customerId", "date", "time", "gps", "type", "personMet", "purpose", "summary", "observation", "currentFeed", "competitor", "interest", "nextStep", "followupDate", "notes", "createdBy", "updatedAt"],
  Followups: ["id", "customerId", "visitId", "action", "responsible", "priority", "dueDate", "status", "completionNotes", "dateCompleted"],
  Sales: ["id", "customerId", "visitId", "date", "paymentStatus", "deliveryStatus", "invoice", "notes", "createdBy"],
  SaleItems: ["id", "saleId", "product", "category", "feedType", "quantity", "unit", "unitPrice"],
  Complaints: ["id", "customerId", "date", "category", "product", "batch", "quantity", "description", "severity", "actionTaken", "assignedTo", "status", "resolutionNotes", "dateResolved"],
  AuditLogs: ["id", "customerId", "action", "user", "date"]
};

const DEFAULT_USERS = [
  { id: "u1", name: "Ada Okafor", email: "ada@farmlink.local", username: "ada", role: "Canvasser", territory: "Ibadan North", managerId: "u3", status: "Active" },
  { id: "u2", name: "Tunde Balogun", email: "tunde@farmlink.local", username: "tunde", role: "Canvasser", territory: "Akinyele", managerId: "u3", status: "Active" },
  { id: "u3", name: "Miriam Yusuf", email: "miriam@farmlink.local", username: "miriam", role: "Area Manager", territory: "Oyo Central", managerId: "", status: "Active" },
  { id: "u4", name: "Bola Nwosu", email: "bola@farmlink.local", username: "bola", role: "Canvasser", territory: "Abeokuta East", managerId: "u6", status: "Active" },
  { id: "u5", name: "Chidi Nnamdi", email: "admin@farmlink.local", username: "admin", role: "Sales Admin", territory: "Back Office", managerId: "", status: "Active" },
  { id: "u6", name: "Grace Bello", email: "grace@farmlink.local", username: "grace", role: "Area Manager", territory: "Ogun Region", managerId: "", status: "Active" }
];

function doGet(e) {
  const action = (e.parameter.action || "ping").toLowerCase();
  try {
    if (action === "setup") {
      ensureSheets_();
      seedUsersIfEmpty_();
      backfillUsernames_();
      return json_({ ok: true, message: "Sheets ready. Default password is: " + DEFAULT_PASSWORD });
    }
    return json_({ ok: true, message: "FarmLink backend online" });
  } catch (error) {
    return json_({ ok: false, error: errorMessage_(error) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : "{}");
    ensureSheets_();

    if (body.action === "login") {
      return json_(login_(body.email, body.password));
    }

    const user = requireUser_(body.token);
    if (body.action === "load") {
      return json_({ ok: true, user: sanitizeUser_(user), data: loadScoped_(user) });
    }
    if (body.action === "saveAll") {
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        saveScoped_(body.data || {}, user);
      } finally {
        lock.releaseLock();
      }
      return json_({ ok: true, savedAt: new Date().toISOString(), data: loadScoped_(user) });
    }
    if (body.action === "logout") {
      removeToken_(body.token);
      return json_({ ok: true });
    }

    return json_({ ok: false, error: "Unknown action" });
  } catch (error) {
    return json_({ ok: false, error: errorMessage_(error) });
  }
}

function doOptions() {
  return json_({ ok: true });
}

function login_(email, password) {
  seedUsersIfEmpty_();
  backfillUsernames_();
  const identity = String(email || "").trim().toLowerCase();
  const user = readTable_("Users").find((row) => userMatchesIdentity_(row, identity));
  if (!user || String(user.status || "Active").toLowerCase() !== "active") {
    throw new Error("Invalid username/email or inactive account");
  }
  if (!user.passwordHash || user.passwordHash !== hashPassword_(password)) {
    throw new Error("Invalid username/email or password");
  }

  const token = createToken_(user.id);
  return {
    ok: true,
    token,
    user: sanitizeUser_(user),
    data: loadScoped_(user)
  };
}

function loadScoped_(user) {
  const all = loadAllRaw_();
  const users = all.users;
  const allowedCanvasserIds = allowedCanvasserIds_(user, users);
  const allowedCustomerIds = new Set(all.customers.filter((customer) => allowedCanvasserIds.includes(customer.ownerId)).map((customer) => customer.id));
  const allowedSaleIds = new Set(all.sales.filter((sale) => allowedCustomerIds.has(sale.customerId)).map((sale) => sale.id));

  return {
    currentUser: user.name,
    users: scopedUsers_(user, users).map(sanitizeUser_),
    customers: all.customers.filter((customer) => allowedCustomerIds.has(customer.id)),
    birdDetails: all.birdDetails.filter((row) => allowedCustomerIds.has(row.customerId)),
    visits: all.visits.filter((row) => allowedCustomerIds.has(row.customerId)),
    followups: all.followups.filter((row) => allowedCustomerIds.has(row.customerId)),
    sales: all.sales
      .filter((row) => allowedCustomerIds.has(row.customerId))
      .map((sale) => ({ ...sale, items: all.saleItems.filter((item) => item.saleId === sale.id).map(stripSaleId_) })),
    complaints: all.complaints.filter((row) => allowedCustomerIds.has(row.customerId)),
    auditLogs: all.auditLogs.filter((row) => allowedCustomerIds.has(row.customerId))
  };
}

function saveScoped_(data, user) {
  const all = loadAllRaw_();
  const users = all.users;
  const allowedCanvasserIds = allowedCanvasserIds_(user, users);
  const canAccessCustomer = (customer) => allowedCanvasserIds.includes(customer.ownerId);

  const incomingCustomers = data.customers || [];
  const incomingCustomerIds = new Set(incomingCustomers.filter(canAccessCustomer).map((customer) => customer.id));
  const existingAccessibleCustomerIds = new Set(all.customers.filter(canAccessCustomer).map((customer) => customer.id));
  const allowedCustomerIds = new Set([...incomingCustomerIds, ...existingAccessibleCustomerIds]);

  const customers = mergeScopedRows_(all.customers, incomingCustomers, canAccessCustomer);
  const birdDetails = mergeScopedRows_(all.birdDetails, data.birdDetails || [], (row) => allowedCustomerIds.has(row.customerId));
  const visits = mergeScopedRows_(all.visits, data.visits || [], (row) => allowedCustomerIds.has(row.customerId));
  const followups = mergeScopedRows_(all.followups, data.followups || [], (row) => allowedCustomerIds.has(row.customerId));
  const complaints = mergeScopedRows_(all.complaints, data.complaints || [], (row) => allowedCustomerIds.has(row.customerId));
  const auditLogs = mergeScopedRows_(all.auditLogs, data.auditLogs || [], (row) => allowedCustomerIds.has(row.customerId));

  const incomingSales = data.sales || [];
  const sales = mergeScopedRows_(all.sales, incomingSales.map(stripItems_), (sale) => allowedCustomerIds.has(sale.customerId));
  const accessibleSaleIds = new Set(sales.filter((sale) => allowedCustomerIds.has(sale.customerId)).map((sale) => sale.id));
  const incomingSaleItems = incomingSales.flatMap((sale) => (sale.items || []).map((item) => ({ ...item, saleId: sale.id })));
  const saleItems = mergeScopedRows_(all.saleItems, incomingSaleItems, (item) => accessibleSaleIds.has(item.saleId));

  writeTable_("Customers", customers);
  writeTable_("BirdDetails", birdDetails);
  writeTable_("Visits", visits);
  writeTable_("Followups", followups);
  writeTable_("Sales", sales);
  writeTable_("SaleItems", saleItems);
  writeTable_("Complaints", complaints);
  writeTable_("AuditLogs", auditLogs);
}

function loadAllRaw_() {
  ensureSheets_();
  return {
    users: readTable_("Users"),
    customers: readTable_("Customers"),
    birdDetails: readTable_("BirdDetails"),
    visits: readTable_("Visits"),
    followups: readTable_("Followups"),
    sales: readTable_("Sales"),
    saleItems: readTable_("SaleItems"),
    complaints: readTable_("Complaints"),
    auditLogs: readTable_("AuditLogs")
  };
}

function allowedCanvasserIds_(user, users) {
  const role = String(user.role || "").toLowerCase();
  if (role.includes("admin")) {
    return users.filter((row) => row.role === "Canvasser").map((row) => row.id);
  }
  if (role.includes("manager")) {
    return users.filter((row) => row.role === "Canvasser" && row.managerId === user.id).map((row) => row.id);
  }
  return [user.id];
}

function scopedUsers_(user, users) {
  const role = String(user.role || "").toLowerCase();
  if (role.includes("admin")) return users;
  if (role.includes("manager")) {
    return users.filter((row) => row.id === user.id || row.managerId === user.id);
  }
  return users.filter((row) => row.id === user.id || row.id === user.managerId);
}

function mergeScopedRows_(existingRows, incomingRows, canWrite) {
  const incomingById = incomingRows.reduce((map, row) => {
    if (row.id && canWrite(row)) map[row.id] = row;
    return map;
  }, {});
  const nextRows = existingRows
    .filter((row) => !canWrite(row))
    .concat(Object.values(incomingById));
  return nextRows;
}

function stripItems_(sale) {
  const clone = { ...sale };
  delete clone.items;
  return clone;
}

function stripSaleId_(item) {
  const clone = { ...item };
  delete clone.saleId;
  return clone;
}

function sanitizeUser_(user) {
  const clone = { ...user };
  delete clone.passwordHash;
  return clone;
}

function userMatchesIdentity_(user, identity) {
  return String(user.email || "").trim().toLowerCase() === identity
    || String(user.username || "").trim().toLowerCase() === identity;
}

function requireUser_(token) {
  const cleanToken = String(token || "").trim();
  if (!cleanToken) throw new Error("Missing login token");
  const now = new Date();
  const tokenRow = readTable_("AuthTokens").find((row) => row.token === cleanToken && new Date(row.expiresAt) > now);
  if (!tokenRow) throw new Error("Login expired");
  const user = readTable_("Users").find((row) => row.id === tokenRow.userId);
  if (!user || String(user.status || "Active").toLowerCase() !== "active") throw new Error("User account unavailable");
  return user;
}

function createToken_(userId) {
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, "");
  const now = new Date();
  const expires = new Date(now.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const tokens = readTable_("AuthTokens").filter((row) => row.userId !== userId && new Date(row.expiresAt) > now);
  tokens.push({ token, userId, createdAt: now.toISOString(), expiresAt: expires.toISOString() });
  writeTable_("AuthTokens", tokens);
  return token;
}

function removeToken_(token) {
  writeTable_("AuthTokens", readTable_("AuthTokens").filter((row) => row.token !== token));
}

function seedUsersIfEmpty_() {
  ensureSheets_();
  if (readTable_("Users").length) return;
  writeTable_("Users", DEFAULT_USERS.map((user) => ({ ...user, passwordHash: hashPassword_(DEFAULT_PASSWORD) })));
}

function backfillUsernames_() {
  const users = readTable_("Users");
  let changed = false;
  users.forEach((user) => {
    if (!user.username) {
      user.username = usernameFromEmail_(user.email);
      changed = true;
    }
  });
  if (changed) writeTable_("Users", users);
}

function setUserPassword(email, newPassword) {
  ensureSheets_();
  const identity = String(email || "").trim().toLowerCase();
  const users = readTable_("Users");
  const index = users.findIndex((user) => userMatchesIdentity_(user, identity));
  if (index < 0) throw new Error("User not found: " + email);
  users[index].passwordHash = hashPassword_(newPassword);
  writeTable_("Users", users);
}

function upsertUserAccount(id, name, email, password, role, territory, managerId, status, username) {
  ensureSheets_();
  const users = readTable_("Users");
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanUsername = String(username || usernameFromEmail_(email)).trim().toLowerCase();
  const index = users.findIndex((user) =>
    user.id === id
    || String(user.email || "").trim().toLowerCase() === cleanEmail
    || String(user.username || "").trim().toLowerCase() === cleanUsername
  );
  const row = {
    id,
    name,
    email,
    passwordHash: password ? hashPassword_(password) : (index >= 0 ? users[index].passwordHash : ""),
    role,
    territory,
    managerId: managerId || "",
    status: status || "Active",
    username: cleanUsername
  };
  if (index >= 0) users[index] = row;
  else users.push(row);
  writeTable_("Users", users);
}

function usernameFromEmail_(email) {
  return String(email || "").split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase();
}

function hashPassword_(password) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password || ""), Utilities.Charset.UTF_8);
  return bytes.map((byte) => {
    const value = byte < 0 ? byte + 256 : byte;
    return ("0" + value.toString(16)).slice(-2);
  }).join("");
}

function ensureSheets_() {
  Object.keys(TABLES).forEach((name) => {
    const sheet = getOrCreateSheet_(name);
    const headers = TABLES[name];
    const existingHeaders = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    if (existingHeaders.join("|") !== headers.join("|")) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
}

function readTable_(name) {
  const sheet = getOrCreateSheet_(name);
  const headers = TABLES[name];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .map((row) => rowToObject_(headers, row))
    .filter((row) => Object.values(row).some((value) => value !== ""));
}

function writeTable_(name, rows) {
  const sheet = getOrCreateSheet_(name);
  const headers = TABLES[name];
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  if (!rows.length) return;
  const values = rows.map((row) => headers.map((header) => row[header] == null ? "" : row[header]));
  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
}

function rowToObject_(headers, row) {
  return headers.reduce((object, header, index) => {
    object[header] = cellValue_(row[index], header);
    return object;
  }, {});
}

function cellValue_(value, header) {
  if (value instanceof Date) {
    if (header === "time") return Utilities.formatDate(value, Session.getScriptTimeZone(), "HH:mm");
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  if (header === "time") return formatTime_(value);
  return value == null ? "" : value;
}

function formatTime_(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number" && isFinite(value)) return timeFromSheetSerial_(value);

  const text = String(value == null ? "" : value).trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return timeFromSheetSerial_(Number(text));

  const meridiemMatch = text.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)\b/i);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const meridiem = meridiemMatch[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return timeFromMinutes_(hours * 60 + minutes);
  }

  const match = text.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
  if (match) return timeFromMinutes_(Number(match[1]) * 60 + Number(match[2]));

  return text;
}

function timeFromSheetSerial_(value) {
  const fraction = ((value % 1) + 1) % 1;
  return timeFromMinutes_(Math.round(fraction * 24 * 60));
}

function timeFromMinutes_(value) {
  const totalMinutes = ((Math.round(Number(value) || 0) % 1440) + 1440) % 1440;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2);
}

function getOrCreateSheet_(name) {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("No spreadsheet found. Bind this script to a Google Sheet or set SPREADSHEET_ID.");
  }
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorMessage_(error) {
  return String(error && error.message ? error.message : error);
}
