const TELEGRAM_BOT_PRODUCTS = [
  "TMDK Broiler Super Starter Pellet",
  "TMDK Broiler Starter Pellet",
  "TMDK Broiler Finisher Pellet",
  "TMDK Chick Pellet",
  "TMDK Grower Mash",
  "TMDK Grower Pellet",
  "TMDK Layer 1 Mash",
  "TMDK Layer 1 Pellet"
];

function setupTelegramBot(botToken, webAppUrl, secret) {
  if (!botToken || !webAppUrl) throw new Error("Provide botToken and the Apps Script /exec webAppUrl");
  const cleanSecret = String(secret || Utilities.getUuid()).replace(/[^a-zA-Z0-9_-]/g, "");
  PropertiesService.getScriptProperties().setProperties({
    TELEGRAM_BOT_TOKEN: String(botToken),
    TELEGRAM_WEBHOOK_SECRET: cleanSecret
  });
  ensureSheets_();

  const separator = String(webAppUrl).indexOf("?") >= 0 ? "&" : "?";
  const webhookUrl = String(webAppUrl) + separator + "telegramSecret=" + encodeURIComponent(cleanSecret);
  const response = telegramApi_("setWebhook", {
    url: webhookUrl,
    allowed_updates: ["message"]
  });
  telegramApi_("setMyCommands", {
    commands: [
      { command: "start", description: "Start and show Telegram ID" },
      { command: "menu", description: "Show FarmLink menu" },
      { command: "id", description: "Show Telegram Chat ID" },
      { command: "cancel", description: "Cancel current form" }
    ]
  });
  return response;
}

function telegramBotHealthCheck() {
  const props = PropertiesService.getScriptProperties();
  return {
    hasBotToken: Boolean(props.getProperty("TELEGRAM_BOT_TOKEN")),
    hasWebhookSecret: Boolean(props.getProperty("TELEGRAM_WEBHOOK_SECRET"))
  };
}

function isTelegramWebhook_(body, e) {
  return Boolean(body && body.update_id !== undefined && (body.message || body.edited_message));
}

function handleTelegramWebhook_(body, e) {
  if (!telegramSecretIsValid_(e)) return { ok: false, error: "Invalid Telegram webhook secret" };
  const message = body.message || body.edited_message;
  if (!message || !message.chat) return { ok: true, ignored: true };

  const chatId = String(message.chat.id);
  const text = telegramMessageText_(message);

  if (/^\/?id$/i.test(text)) {
    sendTelegramText_(chatId, telegramIdentityText_(message));
    return { ok: true };
  }

  const user = telegramUserForMessage_(message);
  if (!user) {
    sendTelegramText_(chatId, "This Telegram account is not linked to a FarmLink user yet.\n\n" + telegramIdentityText_(message) + "\n\nAsk Sales Admin to add this Chat ID to your FarmLink user account.");
    return { ok: true };
  }
  if (String(user.status || "Active").toLowerCase() !== "active") {
    sendTelegramText_(chatId, "Your FarmLink account is inactive. Please contact Sales Admin.");
    return { ok: true };
  }

  const session = readTelegramSession_(chatId);
  if (/^\/?(cancel|stop|exit)$/i.test(text)) {
    clearTelegramSession_(chatId);
    sendTelegramText_(chatId, "Current action cancelled.\n\n" + telegramMenuText_(user));
    return { ok: true };
  }

  if (session && session.flow) {
    continueTelegramFlow_(chatId, user, session, message, text);
    return { ok: true };
  }

  routeTelegramCommand_(chatId, user, text, message);
  return { ok: true };
}

function routeTelegramCommand_(chatId, user, text, message) {
  const clean = String(text || "").trim().toLowerCase();
  if (!clean || /^\/?(start|menu|help)$/i.test(clean)) {
    sendTelegramText_(chatId, telegramMenuText_(user));
    return;
  }

  const commandFlowMap = {
    "1": "farm",
    "/addfarm": "farm",
    "add farm": "farm",
    "farm": "farm",
    "2": "distributor",
    "/adddistributor": "distributor",
    "add distributor": "distributor",
    "distributor": "distributor",
    "3": "visit",
    "/visit": "visit",
    "record visit": "visit",
    "visit": "visit",
    "4": "followup",
    "follow-up": "followup",
    "followup": "followup",
    "5": "sale",
    "record sale": "sale",
    "sale": "sale",
    "6": "complaint",
    "add complaint": "complaint",
    "complaint": "complaint",
    "7": "search",
    "search": "search",
    "8": "my followups",
    "my follow-ups": "my followups",
    "followups": "my followups",
    "9": "summary",
    "report": "summary",
    "reports": "summary",
    "summary": "summary"
  };

  const mapped = commandFlowMap[clean];
  if (mapped && telegramFlows_()[mapped]) {
    startTelegramFlow_(chatId, user, mapped);
    return;
  }
  if (mapped === "my followups") {
    sendTelegramFollowups_(chatId, user);
    return;
  }
  if (mapped === "summary") {
    sendTelegramSummary_(chatId, user);
    return;
  }
  if (clean.indexOf("search ") === 0) {
    sendTelegramSearchResults_(chatId, user, text.slice(7).trim());
    return;
  }
  if (/^(void|delete)\s+/i.test(text)) {
    handleTelegramRecordActionCommand_(chatId, user, text);
    return;
  }

  sendTelegramText_(chatId, "I did not understand that command.\n\n" + telegramMenuText_(user));
}

function telegramMenuText_(user) {
  const scoped = loadScoped_(user);
  return [
    "FarmLink Canvasser Console",
    "User: " + user.name + " (" + user.role + ")",
    "",
    "Reply with a number:",
    "1. Add Farm",
    "2. Add Distributor",
    "3. Record Visit",
    "4. Add Follow-up",
    "5. Record Sale",
    "6. Add Complaint",
    "7. Search Records",
    "8. My Follow-ups",
    "9. Summary",
    "",
    "You can also type SEARCH name/phone, VOID type id, DELETE type id, or /cancel.",
    "",
    "Scope: " + scoped.customers.length + " farms, " + scoped.distributors.length + " distributors, " + scoped.visits.length + " visits."
  ].join("\n");
}

function telegramFlows_() {
  return {
    farm: {
      title: "Add Farm",
      save: saveTelegramFarm_,
      fields: [
        { key: "ownerIdentity", label: "Assigned canvasser username, email, or name", required: true, forManagers: true },
        { key: "farmName", label: "Farm name", required: true },
        { key: "contact", label: "Contact person", required: true },
        { key: "phone", label: "Phone number", required: true },
        { key: "altPhone", label: "Alternative phone", required: false },
        { key: "email", label: "Email address", required: false },
        { key: "address", label: "Address", required: true },
        { key: "state", label: "State", required: true, defaultValue: "Oyo" },
        { key: "lga", label: "LGA", required: true },
        { key: "town", label: "Town / City", required: true },
        { key: "category", label: "Category: New, Existing, Prospect, Active, Dormant", required: true, defaultValue: "New" },
        { key: "farmType", label: "Farm type: Broiler, Layer, Breeder, Turkey, Duck, Mixed", required: true, defaultValue: "Broiler" },
        { key: "birdType", label: "Bird type", required: true, defaultValue: "Broiler" },
        { key: "capacity", label: "Capacity / total birds", required: true, type: "number" },
        { key: "stock", label: "Current stock / birds", required: false, type: "number" },
        { key: "pens", label: "Number of pens", required: false, type: "number" },
        { key: "stage", label: "Production stage", required: false, defaultValue: "Starter" },
        { key: "feedConsumption", label: "Feed consumption per day", required: false },
        { key: "feedBrand", label: "Current feed brand", required: false },
        { key: "frequency", label: "Purchase frequency", required: false },
        { key: "supplier", label: "Current supplier / competitor", required: false },
        { key: "notes", label: "Notes", required: false },
        { key: "gps", label: "Share the farm GPS location using Telegram location, or type latitude,longitude", required: true, type: "location" }
      ]
    },
    distributor: {
      title: "Add Distributor",
      save: saveTelegramDistributor_,
      fields: [
        { key: "ownerIdentity", label: "Assigned canvasser username, email, or name", required: true, forManagers: true },
        { key: "businessName", label: "Distributor business name", required: true },
        { key: "contact", label: "Contact person", required: true },
        { key: "phone", label: "Phone number", required: true },
        { key: "altPhone", label: "Alternative phone", required: false },
        { key: "email", label: "Email address", required: false },
        { key: "address", label: "Address", required: true },
        { key: "state", label: "State", required: true, defaultValue: "Oyo" },
        { key: "lga", label: "LGA", required: true },
        { key: "town", label: "Town / City", required: true },
        { key: "category", label: "Category: Prospect, Active, Dormant, Suspended", required: true, defaultValue: "Prospect" },
        { key: "distributorType", label: "Distributor type", required: true, defaultValue: "Retail Distributor" },
        { key: "coverageArea", label: "Coverage area", required: false },
        { key: "monthlyVolume", label: "Monthly feed volume", required: false },
        { key: "brandsCarried", label: "Brands currently carried", required: false },
        { key: "warehouseCapacity", label: "Warehouse capacity", required: false },
        { key: "deliveryFleet", label: "Delivery fleet", required: false },
        { key: "paymentTerms", label: "Payment terms", required: false, defaultValue: "Transfer" },
        { key: "notes", label: "Notes", required: false },
        { key: "gps", label: "Share the distributor GPS location using Telegram location, or type latitude,longitude", required: true, type: "location" }
      ]
    },
    visit: {
      title: "Record Visit",
      save: saveTelegramVisit_,
      fields: [
        { key: "customerId", label: "Farm/distributor name, phone, or record ID", required: true, type: "account" },
        { key: "date", label: "Visit date", required: true, type: "date", defaultValue: "today" },
        { key: "time", label: "Visit time", required: true, type: "time", defaultValue: "now" },
        { key: "gps", label: "Share GPS location for the visit, or type latitude,longitude", required: true, type: "location" },
        { key: "type", label: "Visit type", required: true, defaultValue: "Routine Visit" },
        { key: "personMet", label: "Person met", required: false },
        { key: "purpose", label: "Purpose of visit", required: false },
        { key: "summary", label: "Discussion summary", required: true },
        { key: "observation", label: "Farm/distributor observation", required: false },
        { key: "currentFeed", label: "Current feed used", required: false },
        { key: "competitor", label: "Competitor activity", required: false },
        { key: "interest", label: "Interest level: Low, Medium, High", required: false, defaultValue: "Medium" },
        { key: "nextStep", label: "Next step / recommendation", required: false },
        { key: "followupDate", label: "Follow-up date", required: false, type: "date" },
        { key: "notes", label: "Visit notes", required: false }
      ]
    },
    followup: {
      title: "Add Follow-up",
      save: saveTelegramFollowup_,
      fields: [
        { key: "customerId", label: "Farm/distributor name, phone, or record ID", required: true, type: "account" },
        { key: "visitId", label: "Visit ID, or SKIP", required: false },
        { key: "action", label: "Action point", required: true },
        { key: "responsible", label: "Responsible person", required: false },
        { key: "priority", label: "Priority: Low, Medium, High", required: true, defaultValue: "Medium" },
        { key: "dueDate", label: "Due date", required: true, type: "date" },
        { key: "status", label: "Status: Pending, In Progress, Completed, Cancelled", required: true, defaultValue: "Pending" },
        { key: "completionNotes", label: "Completion notes", required: false },
        { key: "dateCompleted", label: "Date completed, or SKIP", required: false, type: "date" }
      ]
    },
    sale: {
      title: "Record Sale",
      save: saveTelegramSale_,
      fields: [
        { key: "customerId", label: "Farm/distributor name, phone, or record ID", required: true, type: "account" },
        { key: "visitId", label: "Visit ID, or SKIP", required: false },
        { key: "date", label: "Sale date", required: true, type: "date", defaultValue: "today" },
        { key: "product", label: "Product sold\n" + TELEGRAM_BOT_PRODUCTS.map((item, index) => (index + 1) + ". " + item).join("\n"), required: true, type: "product" },
        { key: "quantity", label: "Quantity sold", required: true, type: "number" },
        { key: "unit", label: "Unit", required: true, defaultValue: "bags" },
        { key: "unitPrice", label: "Unit price in Naira", required: true, type: "number" },
        { key: "paymentStatus", label: "Payment status: Paid, Part Payment, Credit", required: true, defaultValue: "Paid" },
        { key: "deliveryStatus", label: "Delivery status: Delivered, Pending, Partially Delivered, Scheduled", required: true, defaultValue: "Pending" },
        { key: "invoice", label: "Invoice / receipt number", required: false },
        { key: "notes", label: "Sale notes", required: false }
      ]
    },
    complaint: {
      title: "Add Complaint",
      save: saveTelegramComplaint_,
      fields: [
        { key: "customerId", label: "Farm/distributor name, phone, or record ID", required: true, type: "account" },
        { key: "date", label: "Complaint date", required: true, type: "date", defaultValue: "today" },
        { key: "category", label: "Complaint category", required: true },
        { key: "product", label: "Product involved\n" + TELEGRAM_BOT_PRODUCTS.map((item, index) => (index + 1) + ". " + item).join("\n"), required: false, type: "product" },
        { key: "batch", label: "Batch number", required: false },
        { key: "quantity", label: "Quantity affected", required: false },
        { key: "description", label: "Complaint description", required: true },
        { key: "severity", label: "Severity: Low, Medium, High, Critical", required: true, defaultValue: "Medium" },
        { key: "actionTaken", label: "Immediate action taken", required: false },
        { key: "assignedTo", label: "Assigned to", required: false },
        { key: "status", label: "Status: Open, Under Review, Resolved, Closed", required: true, defaultValue: "Open" },
        { key: "resolutionNotes", label: "Resolution notes", required: false },
        { key: "dateResolved", label: "Date resolved, or SKIP", required: false, type: "date" },
        { key: "evidenceItems", label: "Send photo/video evidence one at a time. Type DONE when finished, or SKIP if none.", required: false, type: "media" }
      ]
    },
    search: {
      title: "Search Records",
      save: runTelegramSearch_,
      fields: [
        { key: "query", label: "Enter farm/distributor name, phone, town, or record ID", required: true }
      ]
    }
  };
}

function startTelegramFlow_(chatId, user, flowKey) {
  const flow = telegramFlows_()[flowKey];
  if (!flow) {
    sendTelegramText_(chatId, "That action is not available. Type /menu.");
    return;
  }
  saveTelegramSession_({ chatId, userId: user.id, flow: flowKey, step: 0, data: "{}", updatedAt: new Date().toISOString() });
  sendTelegramText_(chatId, flow.title + "\n\n" + promptForTelegramStep_(flow, user, {}, 0));
}

function continueTelegramFlow_(chatId, user, session, message, text) {
  const flow = telegramFlows_()[session.flow];
  if (!flow) {
    clearTelegramSession_(chatId);
    sendTelegramText_(chatId, "That saved action is no longer available. Type /menu.");
    return;
  }

  const data = telegramSessionData_(session);
  const fields = telegramFieldsForFlow_(flow, user);
  const step = Number(session.step || 0);
  const field = fields[step];
  if (!field) {
    finishTelegramFlow_(chatId, user, flow, data);
    return;
  }

  const parsed = parseTelegramField_(field, message, text, user, data);
  if (parsed.pending) {
    session.data = JSON.stringify(parsed.data || data);
    session.updatedAt = new Date().toISOString();
    saveTelegramSession_(session);
    sendTelegramText_(chatId, parsed.message);
    return;
  }
  if (parsed.error) {
    sendTelegramText_(chatId, parsed.error + "\n\n" + promptForTelegramStep_(flow, user, data, step));
    return;
  }

  data[field.key] = parsed.value;
  delete data["_choices_" + field.key];
  session.step = step + 1;
  session.data = JSON.stringify(data);
  session.updatedAt = new Date().toISOString();
  saveTelegramSession_(session);

  if (session.step >= fields.length) {
    finishTelegramFlow_(chatId, user, flow, data);
    return;
  }
  sendTelegramText_(chatId, promptForTelegramStep_(flow, user, data, session.step));
}

function finishTelegramFlow_(chatId, user, flow, data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let result;
  try {
    result = flow.save(user, data);
  } finally {
    lock.releaseLock();
  }
  clearTelegramSession_(chatId);
  sendTelegramText_(chatId, result.message + "\n\nType /menu for another action.");
}

function telegramFieldsForFlow_(flow, user) {
  return flow.fields.filter((field) => !field.forManagers || !telegramIsCanvasser_(user));
}

function promptForTelegramStep_(flow, user, data, step) {
  const fields = telegramFieldsForFlow_(flow, user);
  const field = fields[step];
  const count = "(" + (step + 1) + "/" + fields.length + ")";
  const defaultText = field.defaultValue ? "\nDefault: " + field.defaultValue : "";
  const optionalText = field.required ? "" : "\nReply SKIP if not applicable.";
  if (field.type === "location") {
    return count + " " + field.label + "\nUse Telegram attachment > Location, or type: 7.3775,3.9470";
  }
  if (field.type === "media") {
    const existing = Array.isArray(data[field.key]) ? data[field.key].length : 0;
    return count + " " + field.label + (existing ? "\nAttached so far: " + existing : "");
  }
  return count + " " + field.label + defaultText + optionalText;
}

function parseTelegramField_(field, message, text, user, data) {
  const cleanText = String(text || "").trim();
  if (!field.required && /^skip$/i.test(cleanText)) return { value: "" };
  if (!cleanText && field.defaultValue && field.defaultValue !== "today" && field.defaultValue !== "now") return { value: field.defaultValue };

  if (field.type === "location") return parseTelegramLocation_(message, cleanText);
  if (field.type === "media") return parseTelegramMedia_(field, message, cleanText, data);
  if (field.type === "account") return parseTelegramAccount_(field, cleanText, user, data);
  if (field.type === "date") return parseTelegramDate_(field, cleanText);
  if (field.type === "time") return parseTelegramTime_(field, cleanText);
  if (field.type === "number") return parseTelegramNumber_(field, cleanText);
  if (field.type === "product") return parseTelegramProduct_(field, cleanText);

  if (!cleanText && field.required) return { error: "This field is required." };
  return { value: cleanText || "" };
}

function parseTelegramLocation_(message, text) {
  if (message.location) {
    return {
      value: {
        lat: String(message.location.latitude || ""),
        lng: String(message.location.longitude || ""),
        accuracy: message.location.horizontal_accuracy ? String(message.location.horizontal_accuracy) : "Telegram",
        address: ""
      }
    };
  }
  const match = String(text || "").match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
  if (!match) return { error: "Please share a Telegram location or type latitude,longitude." };
  return { value: { lat: match[1], lng: match[3], accuracy: "Manual", address: "" } };
}

function parseTelegramMedia_(field, message, text, data) {
  const items = Array.isArray(data[field.key]) ? data[field.key] : [];
  if (/^(done|skip)$/i.test(text || "")) return { value: items };
  const mediaInfo = telegramMediaInfo_(message);
  if (!mediaInfo) {
    return { pending: true, data, message: "Send a photo/video evidence file, or type DONE to continue." };
  }
  const item = downloadTelegramMedia_(mediaInfo.fileId, mediaInfo.mimeType, mediaInfo.type, mediaInfo.name);
  items.push(item);
  data[field.key] = items;
  return { pending: true, data, message: "Evidence saved (" + items.length + "). Send another photo/video, or type DONE." };
}

function parseTelegramAccount_(field, text, user, data) {
  const choiceKey = "_choices_" + field.key;
  const choices = data[choiceKey] || [];
  const choiceNumber = Number(text);
  if (choices.length && Number.isInteger(choiceNumber) && choiceNumber >= 1 && choiceNumber <= choices.length) {
    return { value: choices[choiceNumber - 1].id };
  }

  const matches = findTelegramAccounts_(text, user).slice(0, 5);
  if (!matches.length) return { error: "No farm or distributor matched that search." };
  if (matches.length > 1) {
    data[choiceKey] = matches.map((item) => ({ id: item.id }));
    return {
      pending: true,
      data,
      message: "I found multiple matches. Reply with a number:\n" + matches.map((item, index) => (index + 1) + ". " + telegramAccountName_(item) + " - " + item.phone + " - " + item.town).join("\n")
    };
  }
  return { value: matches[0].id };
}

function parseTelegramDate_(field, text) {
  if (!text && field.defaultValue === "today") return { value: telegramToday_() };
  if (/^today$/i.test(text)) return { value: telegramToday_() };
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (/^tomorrow$/i.test(text)) return { value: Utilities.formatDate(tomorrow, Session.getScriptTimeZone(), "yyyy-MM-dd") };
  if (!text && !field.required) return { value: "" };
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return { value: text };
  const dmy = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? "20" + dmy[3] : dmy[3];
    return { value: year + "-" + String(dmy[2]).padStart(2, "0") + "-" + String(dmy[1]).padStart(2, "0") };
  }
  return { error: "Use YYYY-MM-DD, DD/MM/YYYY, TODAY, or TOMORROW." };
}

function parseTelegramTime_(field, text) {
  if (!text && field.defaultValue === "now") return { value: telegramNowTime_() };
  if (/^now$/i.test(text)) return { value: telegramNowTime_() };
  if (!text && !field.required) return { value: "" };
  const value = formatTime_(text);
  if (!/^\d{2}:\d{2}$/.test(value)) return { error: "Use HH:MM, e.g. 09:30 or 14:45." };
  return { value };
}

function parseTelegramNumber_(field, text) {
  if (!text && !field.required) return { value: "" };
  const number = Number(String(text || "").replace(/,/g, ""));
  if (!Number.isFinite(number)) return { error: "Enter a valid number." };
  return { value: number };
}

function parseTelegramProduct_(field, text) {
  if (!text && !field.required) return { value: "" };
  const index = Number(text);
  if (Number.isInteger(index) && index >= 1 && index <= TELEGRAM_BOT_PRODUCTS.length) {
    return { value: TELEGRAM_BOT_PRODUCTS[index - 1] };
  }
  const match = TELEGRAM_BOT_PRODUCTS.find((product) => product.toLowerCase() === String(text || "").toLowerCase())
    || TELEGRAM_BOT_PRODUCTS.find((product) => product.toLowerCase().indexOf(String(text || "").toLowerCase()) >= 0);
  return match ? { value: match } : { error: "Choose a product number from the list, or type the product name." };
}

function saveTelegramFarm_(user, data) {
  const ownerId = telegramOwnerId_(data, user);
  const location = data.gps || {};
  const id = telegramMakeId_("c");
  const now = new Date().toISOString();
  appendTelegramRecordRow_("Customers", {
    id,
    farmName: data.farmName,
    contact: data.contact,
    phone: data.phone,
    altPhone: data.altPhone,
    email: data.email,
    address: data.address,
    state: data.state,
    lga: data.lga,
    town: data.town,
    category: data.category,
    farmType: data.farmType,
    birdType: data.birdType,
    capacity: data.capacity,
    stock: data.stock,
    pens: data.pens,
    stage: data.stage,
    feedConsumption: data.feedConsumption,
    feedBrand: data.feedBrand,
    frequency: data.frequency,
    supplier: data.supplier,
    notes: data.notes,
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy,
    ownerId,
    createdBy: user.name,
    createdAt: now,
    updatedBy: user.name,
    updatedAt: telegramToday_(),
    voided: "",
    voidedBy: "",
    voidedAt: ""
  });
  appendTelegramAudit_(id, "Created farm via Telegram", user);
  return { id, message: "Farm saved.\nID: " + id + "\nName: " + data.farmName };
}

function saveTelegramDistributor_(user, data) {
  const ownerId = telegramOwnerId_(data, user);
  const location = data.gps || {};
  const id = telegramMakeId_("d");
  const now = new Date().toISOString();
  appendTelegramRecordRow_("Distributors", {
    id,
    businessName: data.businessName,
    contact: data.contact,
    phone: data.phone,
    altPhone: data.altPhone,
    email: data.email,
    address: data.address,
    state: data.state,
    lga: data.lga,
    town: data.town,
    category: data.category,
    distributorType: data.distributorType,
    coverageArea: data.coverageArea,
    monthlyVolume: data.monthlyVolume,
    brandsCarried: data.brandsCarried,
    warehouseCapacity: data.warehouseCapacity,
    deliveryFleet: data.deliveryFleet,
    paymentTerms: data.paymentTerms,
    notes: data.notes,
    lat: location.lat,
    lng: location.lng,
    accuracy: location.accuracy,
    ownerId,
    createdBy: user.name,
    createdAt: now,
    updatedBy: user.name,
    updatedAt: telegramToday_(),
    voided: "",
    voidedBy: "",
    voidedAt: ""
  });
  appendTelegramAudit_(id, "Created distributor via Telegram", user);
  return { id, message: "Distributor saved.\nID: " + id + "\nName: " + data.businessName };
}

function saveTelegramVisit_(user, data) {
  const location = data.gps || {};
  const id = telegramMakeId_("v");
  appendTelegramRecordRow_("Visits", {
    id,
    customerId: data.customerId,
    date: data.date,
    time: data.time,
    gps: telegramGpsString_(location),
    type: data.type,
    personMet: data.personMet,
    purpose: data.purpose,
    summary: data.summary,
    observation: data.observation,
    currentFeed: data.currentFeed,
    competitor: data.competitor,
    interest: data.interest,
    nextStep: data.nextStep,
    followupDate: data.followupDate,
    notes: data.notes,
    createdBy: user.name,
    updatedAt: telegramToday_(),
    voided: "",
    voidedBy: "",
    voidedAt: ""
  });
  if (data.nextStep) {
    appendTelegramRecordRow_("Followups", {
      id: telegramMakeId_("f"),
      customerId: data.customerId,
      visitId: id,
      action: data.nextStep,
      responsible: user.name,
      priority: data.interest === "High" ? "High" : "Medium",
      dueDate: data.followupDate || telegramToday_(),
      status: "Pending",
      completionNotes: "",
      dateCompleted: "",
      voided: "",
      voidedBy: "",
      voidedAt: "",
      createdBy: user.name
    });
  }
  appendTelegramAudit_(data.customerId, "Recorded visit via Telegram", user);
  return { id, message: "Visit saved.\nID: " + id + "\nAccount: " + telegramAccountNameForId_(data.customerId) };
}

function saveTelegramFollowup_(user, data) {
  const id = telegramMakeId_("f");
  appendTelegramRecordRow_("Followups", {
    id,
    customerId: data.customerId,
    visitId: data.visitId,
    action: data.action,
    responsible: data.responsible || user.name,
    priority: data.priority,
    dueDate: data.dueDate,
    status: data.status,
    completionNotes: data.completionNotes,
    dateCompleted: data.dateCompleted,
    voided: "",
    voidedBy: "",
    voidedAt: "",
    createdBy: user.name
  });
  appendTelegramAudit_(data.customerId, "Created follow-up via Telegram", user);
  return { id, message: "Follow-up saved.\nID: " + id + "\nDue: " + data.dueDate };
}

function saveTelegramSale_(user, data) {
  const saleId = telegramMakeId_("s");
  const itemId = telegramMakeId_("si");
  appendTelegramRecordRow_("Sales", {
    id: saleId,
    customerId: data.customerId,
    visitId: data.visitId,
    date: data.date,
    paymentStatus: data.paymentStatus,
    deliveryStatus: data.deliveryStatus,
    invoice: data.invoice,
    notes: data.notes,
    createdBy: user.name,
    voided: "",
    voidedBy: "",
    voidedAt: ""
  });
  appendTelegramRecordRow_("SaleItems", {
    id: itemId,
    saleId,
    product: data.product,
    category: "Poultry Feed",
    feedType: data.product.replace(/^TMDK\s+/i, ""),
    quantity: data.quantity,
    unit: data.unit,
    unitPrice: data.unitPrice
  });
  appendTelegramAudit_(data.customerId, "Recorded sale via Telegram", user);
  return { id: saleId, message: "Sale saved.\nID: " + saleId + "\nTotal: " + telegramMoney_(Number(data.quantity || 0) * Number(data.unitPrice || 0)) };
}

function saveTelegramComplaint_(user, data) {
  const id = telegramMakeId_("cp");
  const evidence = Array.isArray(data.evidenceItems) ? data.evidenceItems : [];
  appendTelegramRecordRow_("Complaints", {
    id,
    customerId: data.customerId,
    date: data.date,
    category: data.category,
    product: data.product,
    batch: data.batch,
    quantity: data.quantity,
    description: data.description,
    severity: data.severity,
    actionTaken: data.actionTaken,
    assignedTo: data.assignedTo || user.name,
    status: data.status,
    resolutionNotes: data.resolutionNotes,
    dateResolved: data.dateResolved,
    voided: "",
    voidedBy: "",
    voidedAt: "",
    evidenceName: evidence.map((item) => item.name).join(", "),
    evidenceData: JSON.stringify(evidence),
    createdBy: user.name
  });
  appendTelegramAudit_(data.customerId, "Created complaint via Telegram", user);
  return { id, message: "Complaint saved.\nID: " + id + "\nEvidence files: " + evidence.length };
}

function runTelegramSearch_(user, data) {
  return { message: telegramSearchText_(user, data.query) };
}

function sendTelegramSearchResults_(chatId, user, query) {
  if (!query) {
    startTelegramFlow_(chatId, user, "search");
    return;
  }
  sendTelegramText_(chatId, telegramSearchText_(user, query));
}

function telegramSearchText_(user, query) {
  const matches = findTelegramAccounts_(query, user).slice(0, 6);
  if (!matches.length) return "No matching farms or distributors found for: " + query;
  return "Search results for \"" + query + "\":\n\n" + matches.map((account) => telegramAccountSummary_(user, account)).join("\n\n");
}

function sendTelegramFollowups_(chatId, user) {
  const data = loadScoped_(user);
  const rows = data.followups
    .filter((row) => !telegramIsVoided_(row) && String(row.status || "").toLowerCase() !== "completed")
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")))
    .slice(0, 10);
  if (!rows.length) {
    sendTelegramText_(chatId, "No pending follow-ups in your current scope.");
    return;
  }
  sendTelegramText_(chatId, "Pending follow-ups:\n\n" + rows.map((row) => [
    telegramAccountNameForId_(row.customerId),
    "ID: " + row.id,
    "Due: " + row.dueDate,
    "Priority: " + row.priority,
    "Action: " + row.action
  ].join("\n")).join("\n\n"));
}

function sendTelegramSummary_(chatId, user) {
  const data = loadScoped_(user);
  const today = telegramToday_();
  const todaySales = data.sales.filter((sale) => sale.date === today).reduce((sum, sale) => sum + telegramSaleTotal_(sale), 0);
  const pendingFollowups = data.followups.filter((row) => !telegramIsVoided_(row) && String(row.status || "").toLowerCase() !== "completed").length;
  const openComplaints = data.complaints.filter((row) => !telegramIsVoided_(row) && ["open", "under review"].indexOf(String(row.status || "").toLowerCase()) >= 0).length;
  sendTelegramText_(chatId, [
    "FarmLink Summary",
    "Farms: " + data.customers.length,
    "Distributors: " + data.distributors.length,
    "Visits today: " + data.visits.filter((visit) => visit.date === today).length,
    "Sales today: " + telegramMoney_(todaySales),
    "Pending follow-ups: " + pendingFollowups,
    "Open complaints: " + openComplaints
  ].join("\n"));
}

function handleTelegramRecordActionCommand_(chatId, user, text) {
  const match = text.match(/^(void|delete)\s+(farm|customer|distributor|visit|followup|follow-up|sale|complaint)\s+(.+)$/i);
  if (!match) {
    sendTelegramText_(chatId, "Use: VOID type id\nExample: VOID visit v-123\nSales Admin can also use DELETE type id.");
    return;
  }
  const action = match[1].toLowerCase();
  const type = match[2].toLowerCase().replace("customer", "farm").replace("follow-up", "followup");
  const id = match[3].trim();
  try {
    const message = action === "delete" ? deleteTelegramRecord_(user, type, id) : voidTelegramRecord_(user, type, id);
    sendTelegramText_(chatId, message);
  } catch (error) {
    sendTelegramText_(chatId, errorMessage_(error));
  }
}

function voidTelegramRecord_(user, type, id) {
  const config = telegramTypeConfig_(type);
  const rows = readTable_(config.sheet);
  const index = rows.findIndex((row) => String(row.id) === id);
  if (index < 0) throw new Error("Record not found");
  if (!telegramCanAccessRecord_(user, type, rows[index])) throw new Error("You cannot void this record");
  rows[index].voided = "Yes";
  rows[index].voidedBy = user.name;
  rows[index].voidedAt = new Date().toISOString();
  if (type === "followup") rows[index].status = "Cancelled";
  writeTable_(config.sheet, rows);
  appendTelegramAudit_(config.accountId(rows[index]), "Voided " + type + " via Telegram", user);
  return "Record voided.\nType: " + type + "\nID: " + id;
}

function deleteTelegramRecord_(user, type, id) {
  if (!isSalesAdmin_(user)) throw new Error("Only Sales Admin can permanently delete records");
  const config = telegramTypeConfig_(type);
  const rows = readTable_(config.sheet);
  const target = rows.find((row) => String(row.id) === id);
  if (!target) throw new Error("Record not found");
  if (!telegramCanAccessRecord_(user, type, target)) throw new Error("You cannot delete this record");
  if (type === "farm" || type === "distributor") {
    deleteTelegramAccountCascade_(type, id);
  } else if (type === "sale") {
    writeTable_("Sales", readTable_("Sales").filter((row) => row.id !== id));
    writeTable_("SaleItems", readTable_("SaleItems").filter((row) => row.saleId !== id));
  } else {
    writeTable_(config.sheet, rows.filter((row) => row.id !== id));
  }
  appendTelegramAudit_(config.accountId(target), "Deleted " + type + " via Telegram", user);
  return "Record deleted.\nType: " + type + "\nID: " + id;
}

function deleteTelegramAccountCascade_(type, id) {
  const saleIds = readTable_("Sales").filter((row) => row.customerId === id).map((row) => row.id);
  const saleIdSet = new Set(saleIds);
  if (type === "farm") {
    writeTable_("Customers", readTable_("Customers").filter((row) => row.id !== id));
    writeTable_("BirdDetails", readTable_("BirdDetails").filter((row) => row.customerId !== id));
  } else {
    writeTable_("Distributors", readTable_("Distributors").filter((row) => row.id !== id));
  }
  writeTable_("Visits", readTable_("Visits").filter((row) => row.customerId !== id));
  writeTable_("Followups", readTable_("Followups").filter((row) => row.customerId !== id));
  writeTable_("Complaints", readTable_("Complaints").filter((row) => row.customerId !== id));
  writeTable_("Sales", readTable_("Sales").filter((row) => row.customerId !== id));
  writeTable_("SaleItems", readTable_("SaleItems").filter((row) => !saleIdSet.has(row.saleId)));
  writeTable_("AuditLogs", readTable_("AuditLogs").filter((row) => row.customerId !== id));
}

function telegramTypeConfig_(type) {
  const configs = {
    farm: { sheet: "Customers", accountId: (row) => row.id },
    distributor: { sheet: "Distributors", accountId: (row) => row.id },
    visit: { sheet: "Visits", accountId: (row) => row.customerId },
    followup: { sheet: "Followups", accountId: (row) => row.customerId },
    sale: { sheet: "Sales", accountId: (row) => row.customerId },
    complaint: { sheet: "Complaints", accountId: (row) => row.customerId }
  };
  if (!configs[type]) throw new Error("Unknown record type");
  return configs[type];
}

function telegramCanAccessRecord_(user, type, row) {
  const config = telegramTypeConfig_(type);
  return telegramCanAccessAccount_(user, config.accountId(row));
}

function telegramCanAccessAccount_(user, accountId) {
  const data = loadScoped_(user);
  return data.customers.some((row) => row.id === accountId) || data.distributors.some((row) => row.id === accountId);
}

function findTelegramAccounts_(query, user) {
  const clean = String(query || "").trim().toLowerCase();
  if (!clean) return [];
  const data = loadScoped_(user);
  const accounts = data.customers
    .map((row) => ({ ...row, accountType: "Farm", accountName: row.farmName }))
    .concat(data.distributors.map((row) => ({ ...row, accountType: "Distributor", accountName: row.businessName })));
  const normalizedQueryPhone = normalizePhoneInput_(clean);
  const exact = accounts.filter((row) =>
    String(row.id || "").toLowerCase() === clean
    || String(row.accountName || "").toLowerCase() === clean
    || (normalizedQueryPhone && normalizePhoneInput_(row.phone) === normalizedQueryPhone)
  );
  if (exact.length) return exact;
  return accounts.filter((row) => [
    row.accountName,
    row.contact,
    row.phone,
    row.altPhone,
    row.town,
    row.lga,
    row.state,
    row.id
  ].join(" ").toLowerCase().indexOf(clean) >= 0);
}

function telegramAccountSummary_(user, account) {
  const data = loadScoped_(user);
  const visits = data.visits.filter((row) => row.customerId === account.id);
  const followups = data.followups.filter((row) => row.customerId === account.id && String(row.status || "").toLowerCase() !== "completed");
  const complaints = data.complaints.filter((row) => row.customerId === account.id && ["open", "under review"].indexOf(String(row.status || "").toLowerCase()) >= 0);
  const salesTotal = data.sales.filter((row) => row.customerId === account.id).reduce((sum, sale) => sum + telegramSaleTotal_(sale), 0);
  return [
    telegramAccountName_(account) + " (" + account.accountType + ")",
    "ID: " + account.id,
    "Contact: " + (account.contact || "Not captured") + " - " + (account.phone || "No phone"),
    "Location: " + [account.town, account.lga, account.state].filter(Boolean).join(", "),
    "Last visit: " + (visits.sort((a, b) => String(b.date).localeCompare(String(a.date)))[0]?.date || "None"),
    "Pending follow-ups: " + followups.length,
    "Open complaints: " + complaints.length,
    "Sales value: " + telegramMoney_(salesTotal)
  ].join("\n");
}

function telegramOwnerId_(data, user) {
  if (telegramIsCanvasser_(user)) return user.id;
  const owner = resolveTelegramCanvasser_(data.ownerIdentity, user);
  if (!owner) throw new Error("Assigned canvasser was not found or is outside your role scope");
  return owner.id;
}

function resolveTelegramCanvasser_(identity, user) {
  const clean = String(identity || "").trim().toLowerCase();
  const users = readTable_("Users");
  const allowedIds = new Set(allowedCanvasserIds_(user, users));
  return users.find((row) => allowedIds.has(row.id) && row.role === "Canvasser" && [
    row.id,
    row.name,
    row.email,
    row.username,
    row.whatsappPhone,
    row.telegramChatId,
    row.telegramUsername
  ].some((value) => String(value || "").trim().toLowerCase().replace(/^@+/, "") === clean.replace(/^@+/, "")));
}

function telegramUserForMessage_(message) {
  const chatId = String(message.chat.id || "");
  const username = normalizeTelegramUsername_(message.from && message.from.username);
  const users = readTable_("Users");
  return users.find((user) => normalizeTelegramChatId_(user.telegramChatId) === chatId)
    || users.find((user) => username && normalizeTelegramUsername_(user.telegramUsername) === username);
}

function telegramMessageText_(message) {
  return String(message.text || message.caption || "").trim();
}

function telegramIdentityText_(message) {
  const username = message.from && message.from.username ? "@" + message.from.username : "No username";
  return [
    "Telegram Chat ID: " + message.chat.id,
    "Telegram Username: " + username
  ].join("\n");
}

function readTelegramSession_(chatId) {
  const clean = String(chatId || "").trim();
  return readTable_("TelegramSessions").find((row) => String(row.chatId || "").trim() === clean);
}

function saveTelegramSession_(session) {
  const clean = String(session.chatId || "").trim();
  const sessions = readTable_("TelegramSessions").filter((row) => String(row.chatId || "").trim() !== clean);
  sessions.push({
    chatId: clean,
    userId: session.userId,
    flow: session.flow,
    step: session.step,
    data: session.data || "{}",
    updatedAt: session.updatedAt || new Date().toISOString()
  });
  writeTable_("TelegramSessions", sessions);
}

function clearTelegramSession_(chatId) {
  const clean = String(chatId || "").trim();
  writeTable_("TelegramSessions", readTable_("TelegramSessions").filter((row) => String(row.chatId || "").trim() !== clean));
}

function telegramSessionData_(session) {
  try {
    const parsed = JSON.parse(session.data || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function telegramMediaInfo_(message) {
  if (message.photo && message.photo.length) {
    const photo = message.photo[message.photo.length - 1];
    return { fileId: photo.file_id, mimeType: "image/jpeg", type: "image", name: "telegram-photo.jpg" };
  }
  if (message.video) {
    return {
      fileId: message.video.file_id,
      mimeType: message.video.mime_type || "video/mp4",
      type: "video",
      name: message.video.file_name || "telegram-video.mp4"
    };
  }
  if (message.document && String(message.document.mime_type || "").match(/^(image|video)\//)) {
    return {
      fileId: message.document.file_id,
      mimeType: message.document.mime_type,
      type: message.document.mime_type.indexOf("video/") === 0 ? "video" : "image",
      name: message.document.file_name || "telegram-evidence"
    };
  }
  return null;
}

function downloadTelegramMedia_(fileId, mimeType, type, name) {
  const fileResponse = telegramApi_("getFile", { file_id: fileId });
  if (!fileResponse.ok || !fileResponse.result || !fileResponse.result.file_path) throw new Error("Could not retrieve Telegram media");
  const token = telegramBotToken_();
  const url = "https://api.telegram.org/file/bot" + token + "/" + fileResponse.result.file_path;
  const blob = UrlFetchApp.fetch(url, { method: "get", muteHttpExceptions: true }).getBlob();
  const safeName = safeFileName_((name || "telegram-evidence") + "-" + Utilities.getUuid().slice(0, 8));
  const file = evidenceFolder_().createFile(blob.setName(safeName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    id: Utilities.getUuid(),
    name: safeName,
    type,
    mimeType: mimeType || blob.getContentType(),
    driveFileId: file.getId(),
    url: file.getUrl(),
    addedAt: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
    source: "telegram",
    fileId
  };
}

function sendTelegramText_(chatId, text) {
  return telegramApi_("sendMessage", {
    chat_id: String(chatId),
    text: String(text || "").slice(0, 4096),
    disable_web_page_preview: true
  });
}

function telegramApi_(method, payload) {
  const token = telegramBotToken_();
  if (!token) throw new Error("Telegram bot token is not configured");
  const response = UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/" + method, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify(payload || {})
  });
  const text = response.getContentText();
  try {
    return JSON.parse(text || "{}");
  } catch (error) {
    return { ok: false, raw: text };
  }
}

function appendTelegramRecordRow_(name, row) {
  const sheet = getOrCreateSheet_(name);
  const headers = TABLES[name];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(headers.map((header) => row[header] == null ? "" : row[header]));
}

function appendTelegramAudit_(customerId, action, user) {
  appendTelegramRecordRow_("AuditLogs", {
    id: telegramMakeId_("a"),
    customerId,
    action,
    user: user.name,
    date: telegramToday_()
  });
}

function telegramMakeId_(prefix) {
  return String(prefix || "id").toLowerCase() + "-" + Utilities.getUuid();
}

function telegramGpsString_(location) {
  if (!location || !location.lat || !location.lng) return "";
  return location.lat + ", " + location.lng + " (" + (location.accuracy || "Telegram") + ")";
}

function telegramAccountNameForId_(id) {
  const customer = readTable_("Customers").find((row) => row.id === id);
  if (customer) return customer.farmName;
  const distributor = readTable_("Distributors").find((row) => row.id === id);
  return distributor ? distributor.businessName : id;
}

function telegramAccountName_(account) {
  return account.accountName || account.farmName || account.businessName || account.id;
}

function telegramSaleTotal_(sale) {
  return (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
}

function telegramMoney_(value) {
  return "NGN " + Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function telegramToday_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function telegramNowTime_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm");
}

function telegramIsCanvasser_(user) {
  return String(user.role || "").toLowerCase() === "canvasser";
}

function telegramIsVoided_(row) {
  const value = String(row.voided || "").toLowerCase();
  return value === "yes" || value === "true" || value === "voided";
}

function telegramSecretIsValid_(e) {
  const expected = PropertiesService.getScriptProperties().getProperty("TELEGRAM_WEBHOOK_SECRET") || "";
  if (!expected) return true;
  return String((e && e.parameter && e.parameter.telegramSecret) || "") === expected;
}

function telegramBotToken_() {
  return PropertiesService.getScriptProperties().getProperty("TELEGRAM_BOT_TOKEN") || "";
}
