const SPREADSHEET_ID = "";
const DEFAULT_PASSWORD = "password";
const TOKEN_TTL_DAYS = 14;
const EVIDENCE_FOLDER_NAME = "FarmLink Complaint Evidence";

const TABLES = {
  Users: ["id", "name", "email", "passwordHash", "role", "territory", "managerId", "status", "username"],
  AuthTokens: ["token", "userId", "createdAt", "expiresAt"],
  Customers: ["id", "farmName", "contact", "phone", "altPhone", "email", "address", "state", "lga", "town", "category", "farmType", "birdType", "capacity", "stock", "pens", "stage", "feedConsumption", "feedBrand", "frequency", "supplier", "notes", "lat", "lng", "accuracy", "ownerId", "createdBy", "createdAt", "updatedBy", "updatedAt", "voided", "voidedBy", "voidedAt"],
  BirdDetails: ["id", "customerId", "birdType", "breed", "stage", "quantity", "pen", "age", "mortality", "feed", "notes"],
  Visits: ["id", "customerId", "date", "time", "gps", "type", "personMet", "purpose", "summary", "observation", "currentFeed", "competitor", "interest", "nextStep", "followupDate", "notes", "createdBy", "updatedAt", "voided", "voidedBy", "voidedAt"],
  Followups: ["id", "customerId", "visitId", "action", "responsible", "priority", "dueDate", "status", "completionNotes", "dateCompleted", "voided", "voidedBy", "voidedAt"],
  Sales: ["id", "customerId", "visitId", "date", "paymentStatus", "deliveryStatus", "invoice", "notes", "createdBy", "voided", "voidedBy", "voidedAt"],
  SaleItems: ["id", "saleId", "product", "category", "feedType", "quantity", "unit", "unitPrice"],
  Complaints: ["id", "customerId", "date", "category", "product", "batch", "quantity", "description", "severity", "actionTaken", "assignedTo", "status", "resolutionNotes", "dateResolved", "voided", "voidedBy", "voidedAt", "evidenceName", "evidenceData"],
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
    if (body.action === "saveUser") {
      if (!isSalesAdmin_(user)) throw new Error("Only Sales Admin can manage users");
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      let savedUser;
      try {
        savedUser = saveUser_(body.user || {}, user);
      } finally {
        lock.releaseLock();
      }
      const freshUser = requireUser_(body.token);
      return json_({ ok: true, user: sanitizeUser_(freshUser), savedUser: sanitizeUser_(savedUser), data: loadScoped_(freshUser) });
    }
    if (body.action === "deleteUser") {
      if (!isSalesAdmin_(user)) throw new Error("Only Sales Admin can delete users");
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      let deletedUser;
      try {
        deletedUser = deleteUser_(body.userId, user);
      } finally {
        lock.releaseLock();
      }
      const freshUser = requireUser_(body.token);
      return json_({ ok: true, user: sanitizeUser_(freshUser), deletedUserId: deletedUser.id, data: loadScoped_(freshUser) });
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
  const canDeleteRows = isSalesAdmin_(user);
  const allowedCanvasserIds = allowedCanvasserIds_(user, users);
  const canAccessCustomer = (customer) => allowedCanvasserIds.includes(customer.ownerId);

  const incomingCustomers = data.customers || [];
  const incomingCustomerIds = new Set(incomingCustomers.filter(canAccessCustomer).map((customer) => customer.id));
  const existingAccessibleCustomerIds = new Set(all.customers.filter(canAccessCustomer).map((customer) => customer.id));
  const allowedCustomerIds = new Set([...incomingCustomerIds, ...existingAccessibleCustomerIds]);

  const customers = mergeScopedRows_(all.customers, incomingCustomers, canAccessCustomer, canDeleteRows);
  const birdDetails = mergeScopedRows_(all.birdDetails, data.birdDetails || [], (row) => allowedCustomerIds.has(row.customerId), canDeleteRows);
  const visits = mergeScopedRows_(all.visits, data.visits || [], (row) => allowedCustomerIds.has(row.customerId), canDeleteRows);
  const followups = mergeScopedRows_(all.followups, data.followups || [], (row) => allowedCustomerIds.has(row.customerId), canDeleteRows);
  const incomingComplaints = (data.complaints || []).map(processComplaintEvidence_);
  const complaints = mergeScopedRows_(all.complaints, incomingComplaints, (row) => allowedCustomerIds.has(row.customerId), canDeleteRows);
  const auditLogs = mergeScopedRows_(all.auditLogs, data.auditLogs || [], (row) => allowedCustomerIds.has(row.customerId), canDeleteRows);

  const incomingSales = data.sales || [];
  const sales = mergeScopedRows_(all.sales, incomingSales.map(stripItems_), (sale) => allowedCustomerIds.has(sale.customerId), canDeleteRows);
  const writableSaleIds = new Set([
    ...all.sales.filter((sale) => allowedCustomerIds.has(sale.customerId)).map((sale) => sale.id),
    ...incomingSales.filter((sale) => allowedCustomerIds.has(sale.customerId)).map((sale) => sale.id)
  ]);
  const incomingSaleItems = incomingSales.flatMap((sale) => (sale.items || []).map((item) => ({ ...item, saleId: sale.id })));
  const saleItems = mergeScopedRows_(all.saleItems, incomingSaleItems, (item) => writableSaleIds.has(item.saleId), canDeleteRows);

  writeTable_("Customers", customers);
  writeTable_("BirdDetails", birdDetails);
  writeTable_("Visits", visits);
  writeTable_("Followups", followups);
  writeTable_("Sales", sales);
  writeTable_("SaleItems", saleItems);
  writeTable_("Complaints", complaints);
  writeTable_("AuditLogs", auditLogs);
}

function saveUser_(data, actor) {
  const users = readTable_("Users");
  const id = String(data.id || "").trim() || nextUserId_(users);
  const existingIndex = users.findIndex((user) => user.id === id);
  const existing = existingIndex >= 0 ? users[existingIndex] : null;
  const name = String(data.name || "").trim();
  const cleanEmail = String(data.email || "").trim().toLowerCase();
  const cleanUsername = String(data.username || usernameFromEmail_(cleanEmail)).trim().toLowerCase();
  const role = String(data.role || "").trim();
  const status = String(data.status || "Active").trim() === "Inactive" ? "Inactive" : "Active";
  const territory = String(data.territory || "").trim();
  const managerId = role === "Canvasser" ? String(data.managerId || "").trim() : "";
  const password = String(data.password || "");

  if (!name) throw new Error("User name is required");
  if (!cleanEmail) throw new Error("User email is required");
  if (!cleanUsername) throw new Error("Username is required");
  if (["Canvasser", "Area Manager", "Sales Admin"].indexOf(role) < 0) throw new Error("Invalid user role");
  if (role === "Canvasser" && !managerId) throw new Error("Assign the canvasser to an area manager");
  if (role === "Canvasser" && managerId === id) throw new Error("A canvasser cannot manage their own account");
  if (role !== "Area Manager" && users.some((user) => user.role === "Canvasser" && user.managerId === id)) {
    throw new Error("Reassign this manager's canvassers before changing the role");
  }
  if (managerId && !users.some((user) => user.id === managerId && user.role === "Area Manager")) throw new Error("Selected area manager was not found");
  if (id === actor.id && (status !== "Active" || role !== "Sales Admin")) throw new Error("You cannot deactivate or remove Sales Admin access from your own account");

  const duplicate = users.find((user) => user.id !== id && (
    String(user.email || "").trim().toLowerCase() === cleanEmail
    || String(user.username || "").trim().toLowerCase() === cleanUsername
  ));
  if (duplicate) throw new Error("Another user already has that username or email");
  if (!password && !existing) throw new Error("Temporary password is required for new users");

  const row = {
    id,
    name,
    email: cleanEmail,
    passwordHash: password ? hashPassword_(password) : existing.passwordHash,
    role,
    territory,
    managerId,
    status,
    username: cleanUsername
  };
  if (existingIndex >= 0) users[existingIndex] = row;
  else users.push(row);
  writeTable_("Users", users);
  return row;
}

function deleteUser_(userId, actor) {
  const id = String(userId || "").trim();
  if (!id) throw new Error("Missing user id");
  if (id === actor.id) throw new Error("You cannot delete your own account");

  const users = readTable_("Users");
  const target = users.find((user) => user.id === id);
  if (!target) throw new Error("User account not found");
  if (target.role === "Area Manager" && users.some((user) => user.role === "Canvasser" && user.managerId === id)) {
    throw new Error("Reassign this manager's canvassers before deleting the user");
  }
  if (target.role === "Canvasser" && readTable_("Customers").some((customer) => customer.ownerId === id)) {
    throw new Error("Reassign this canvasser's customers before deleting the user");
  }

  writeTable_("Users", users.filter((user) => user.id !== id));
  writeTable_("AuthTokens", readTable_("AuthTokens").filter((token) => token.userId !== id));
  return target;
}

function nextUserId_(users) {
  const max = users.reduce((value, user) => {
    const match = String(user.id || "").match(/^u(\d+)$/i);
    return match ? Math.max(value, Number(match[1])) : value;
  }, 0);
  return "u" + (max + 1);
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

function isSalesAdmin_(user) {
  return String(user.role || "").toLowerCase().includes("admin");
}

function scopedUsers_(user, users) {
  const role = String(user.role || "").toLowerCase();
  if (role.includes("admin")) return users;
  if (role.includes("manager")) {
    return users.filter((row) => row.id === user.id || row.managerId === user.id);
  }
  return users.filter((row) => row.id === user.id || row.id === user.managerId);
}

function mergeScopedRows_(existingRows, incomingRows, canWrite, canDelete) {
  const incomingById = incomingRows.reduce((map, row) => {
    if (row.id && canWrite(row)) map[row.id] = row;
    return map;
  }, {});
  const nextRows = existingRows
    .filter((row) => !canWrite(row) || (!canDelete && !incomingById[row.id]))
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

function processComplaintEvidence_(complaint) {
  const items = parseEvidenceItems_(complaint.evidenceData, complaint.evidenceName)
    .map((item) => materializeEvidenceItem_(item))
    .slice(0, 8);
  return {
    ...complaint,
    evidenceName: items.map((item) => item.name).filter(Boolean).join(", "),
    evidenceData: JSON.stringify(items)
  };
}

function parseEvidenceItems_(evidenceData, evidenceName) {
  if (!evidenceData) return [];
  const text = String(evidenceData || "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // Fall through for legacy single-file evidence data URLs.
  }
  if (text.indexOf("data:") === 0) {
    const mimeType = text.match(/^data:([^;]+);base64,/)?.[1] || "image/jpeg";
    return [{
      id: Utilities.getUuid(),
      name: evidenceName || "Complaint evidence",
      type: mimeType.indexOf("video/") === 0 ? "video" : "image",
      mimeType,
      dataUrl: text,
      addedAt: new Date().toISOString()
    }];
  }
  return [];
}

function materializeEvidenceItem_(item) {
  const clean = sanitizeEvidenceItem_(item);
  if (!clean.dataUrl) return clean;

  const match = String(clean.dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return clean;

  const mimeType = match[1];
  if (mimeType.indexOf("image/") !== 0 && mimeType.indexOf("video/") !== 0) {
    throw new Error("Evidence must be an image or video file");
  }

  const bytes = Utilities.base64Decode(match[2]);
  const fileName = safeFileName_(clean.name || "complaint-evidence");
  const file = evidenceFolder_().createFile(Utilities.newBlob(bytes, mimeType, fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  delete clean.dataUrl;
  clean.mimeType = mimeType;
  clean.driveFileId = file.getId();
  clean.url = file.getUrl();
  clean.uploadedAt = new Date().toISOString();
  return clean;
}

function sanitizeEvidenceItem_(item) {
  const mimeType = String(item.mimeType || "").trim();
  return {
    id: item.id || Utilities.getUuid(),
    name: String(item.name || "Complaint evidence").slice(0, 120),
    type: item.type || (mimeType.indexOf("video/") === 0 ? "video" : "image"),
    mimeType,
    url: item.url || "",
    driveFileId: item.driveFileId || "",
    dataUrl: item.dataUrl || "",
    addedAt: item.addedAt || "",
    uploadedAt: item.uploadedAt || ""
  };
}

function evidenceFolder_() {
  const folders = DriveApp.getFoldersByName(EVIDENCE_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(EVIDENCE_FOLDER_NAME);
}

function safeFileName_(name) {
  return String(name || "complaint-evidence").replace(/[\\/:*?"<>|]/g, "-").slice(0, 120);
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
