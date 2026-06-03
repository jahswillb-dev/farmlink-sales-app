const SPREADSHEET_ID = "";

const TABLES = {
  Users: ["id", "name", "role", "territory", "managerId"],
  Customers: ["id", "farmName", "contact", "phone", "altPhone", "email", "address", "state", "lga", "town", "category", "farmType", "birdType", "capacity", "stock", "pens", "stage", "feedConsumption", "feedBrand", "frequency", "supplier", "notes", "lat", "lng", "accuracy", "ownerId", "createdBy", "createdAt", "updatedBy", "updatedAt"],
  BirdDetails: ["id", "customerId", "birdType", "breed", "stage", "quantity", "pen", "age", "mortality", "feed", "notes"],
  Visits: ["id", "customerId", "date", "time", "gps", "type", "personMet", "purpose", "summary", "observation", "currentFeed", "competitor", "interest", "nextStep", "followupDate", "notes", "createdBy", "updatedAt"],
  Followups: ["id", "customerId", "visitId", "action", "responsible", "priority", "dueDate", "status", "completionNotes", "dateCompleted"],
  Sales: ["id", "customerId", "visitId", "date", "paymentStatus", "deliveryStatus", "invoice", "notes", "createdBy"],
  SaleItems: ["id", "saleId", "product", "category", "feedType", "quantity", "unit", "unitPrice"],
  Complaints: ["id", "customerId", "date", "category", "product", "batch", "quantity", "description", "severity", "actionTaken", "assignedTo", "status", "resolutionNotes", "dateResolved"],
  AuditLogs: ["id", "customerId", "action", "user", "date"]
};

function doGet(e) {
  const action = (e.parameter.action || "load").toLowerCase();
  try {
    if (action === "setup") {
      ensureSheets_();
      return json_({ ok: true, message: "Sheets ready" });
    }
    if (action === "ping") {
      return json_({ ok: true, message: "FarmLink backend online" });
    }
    return json_({ ok: true, data: loadAll_() });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : "{}");
    if (body.action === "saveAll") {
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        saveAll_(body.data || {});
      } finally {
        lock.releaseLock();
      }
      return json_({ ok: true, savedAt: new Date().toISOString() });
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doOptions() {
  return json_({ ok: true });
}

function loadAll_() {
  ensureSheets_();
  const sales = readTable_("Sales");
  const saleItems = readTable_("SaleItems");
  const itemsBySale = saleItems.reduce((groups, item) => {
    const saleId = item.saleId || "";
    if (!groups[saleId]) groups[saleId] = [];
    delete item.saleId;
    groups[saleId].push(item);
    return groups;
  }, {});

  return {
    currentUser: "Ada Okafor",
    users: readTable_("Users"),
    customers: readTable_("Customers"),
    birdDetails: readTable_("BirdDetails"),
    visits: readTable_("Visits"),
    followups: readTable_("Followups"),
    sales: sales.map((sale) => ({ ...sale, items: itemsBySale[sale.id] || [] })),
    complaints: readTable_("Complaints"),
    auditLogs: readTable_("AuditLogs")
  };
}

function saveAll_(data) {
  ensureSheets_();
  writeTable_("Users", data.users || []);
  writeTable_("Customers", data.customers || []);
  writeTable_("BirdDetails", data.birdDetails || []);
  writeTable_("Visits", data.visits || []);
  writeTable_("Followups", data.followups || []);
  writeTable_("Complaints", data.complaints || []);
  writeTable_("AuditLogs", data.auditLogs || []);

  const sales = data.sales || [];
  writeTable_("Sales", sales.map((sale) => {
    const clone = { ...sale };
    delete clone.items;
    return clone;
  }));
  writeTable_("SaleItems", sales.flatMap((sale) => (sale.items || []).map((item) => ({ ...item, saleId: sale.id }))));
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
    object[header] = cellValue_(row[index]);
    return object;
  }, {});
}

function cellValue_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return value == null ? "" : value;
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
