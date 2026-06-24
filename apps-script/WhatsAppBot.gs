const WHATSAPP_DEFAULT_GRAPH_VERSION = "v23.0";
const WHATSAPP_BOT_PRODUCTS = [
  "TMDK Broiler Super Starter Pellet",
  "TMDK Broiler Starter Pellet",
  "TMDK Broiler Finisher Pellet",
  "TMDK Chick Pellet",
  "TMDK Grower Mash",
  "TMDK Grower Pellet",
  "TMDK Layer 1 Mash",
  "TMDK Layer 1 Pellet"
];

function setupWhatsAppBot(verifyToken, accessToken, phoneNumberId, graphVersion) {
  if (!verifyToken || !accessToken || !phoneNumberId) {
    throw new Error("Provide verifyToken, accessToken, and phoneNumberId");
  }
  PropertiesService.getScriptProperties().setProperties({
    WHATSAPP_VERIFY_TOKEN: String(verifyToken),
    WHATSAPP_ACCESS_TOKEN: String(accessToken),
    WHATSAPP_PHONE_NUMBER_ID: String(phoneNumberId),
    WHATSAPP_GRAPH_VERSION: String(graphVersion || WHATSAPP_DEFAULT_GRAPH_VERSION)
  });
  ensureSheets_();
  return "WhatsApp bot settings saved";
}

function whatsappBotHealthCheck() {
  const props = PropertiesService.getScriptProperties();
  return {
    hasVerifyToken: Boolean(props.getProperty("WHATSAPP_VERIFY_TOKEN")),
    hasAccessToken: Boolean(props.getProperty("WHATSAPP_ACCESS_TOKEN")),
    hasPhoneNumberId: Boolean(props.getProperty("WHATSAPP_PHONE_NUMBER_ID")),
    graphVersion: whatsappGraphVersion_()
  };
}

function isWhatsappVerificationRequest_(e) {
  return Boolean(e && e.parameter && e.parameter["hub.mode"]);
}

function verifyWhatsappWebhook_(e) {
  const params = e.parameter || {};
  const expectedToken = whatsappProp_("WHATSAPP_VERIFY_TOKEN");
  if (params["hub.mode"] === "subscribe" && params["hub.verify_token"] === expectedToken) {
    return ContentService.createTextOutput(params["hub.challenge"] || "");
  }
  return ContentService.createTextOutput("Webhook verification failed");
}

function isWhatsappWebhook_(body) {
  return Boolean(body && body.object === "whatsapp_business_account" && Array.isArray(body.entry));
}

function handleWhatsappWebhook_(body) {
  let processed = 0;
  (body.entry || []).forEach((entry) => {
    (entry.changes || []).forEach((change) => {
      const value = change.value || {};
      (value.messages || []).forEach((message) => {
        processed += 1;
        try {
          handleWhatsappIncomingMessage_(message, value);
        } catch (error) {
          Logger.log("WhatsApp bot error: " + errorMessage_(error));
          const phone = normalizePhoneInput_(message && message.from);
          if (phone) sendWhatsappText_(phone, "Sorry, FarmLink could not process that message. Type MENU and try again.");
        }
      });
    });
  });
  return { ok: true, processed };
}

function handleWhatsappIncomingMessage_(message, webhookValue) {
  const phone = normalizePhoneInput_(message.from);
  const user = whatsappUserForPhone_(phone);
  if (!user) {
    sendWhatsappText_(phone, "This WhatsApp number is not linked to a FarmLink user. Ask Sales Admin to add +" + phone + " to your user account.");
    return;
  }
  if (String(user.status || "Active").toLowerCase() !== "active") {
    sendWhatsappText_(phone, "Your FarmLink account is inactive. Please contact Sales Admin.");
    return;
  }

  const text = whatsappMessageText_(message);
  const session = readBotSession_(phone);

  if (text && /^(cancel|stop|exit)$/i.test(text.trim())) {
    clearBotSession_(phone);
    sendWhatsappText_(phone, "Current action cancelled.\n\n" + whatsappMenuText_(user));
    return;
  }

  if (session && session.flow) {
    continueBotFlow_(phone, user, session, message, text);
    return;
  }

  if (text) {
    routeWhatsappCommand_(phone, user, text.trim());
    return;
  }

  sendWhatsappText_(phone, "I received your message. Type MENU to choose an action.");
}

function routeWhatsappCommand_(phone, user, text) {
  const clean = text.toLowerCase();
  if (/^(menu|help|hi|hello|start)$/i.test(clean)) {
    sendWhatsappText_(phone, whatsappMenuText_(user));
    return;
  }

  const commandFlowMap = {
    "1": "farm",
    "add farm": "farm",
    "farm": "farm",
    "2": "distributor",
    "add distributor": "distributor",
    "distributor": "distributor",
    "3": "visit",
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
  if (mapped && whatsappFlows_()[mapped]) {
    startBotFlow_(phone, user, mapped);
    return;
  }
  if (mapped === "search") {
    startBotFlow_(phone, user, "search");
    return;
  }
  if (mapped === "my followups") {
    sendBotFollowups_(phone, user);
    return;
  }
  if (mapped === "summary") {
    sendBotSummary_(phone, user);
    return;
  }
  if (clean.indexOf("search ") === 0) {
    sendBotSearchResults_(phone, user, text.slice(7).trim());
    return;
  }
  if (/^(void|delete)\s+/i.test(text)) {
    handleBotRecordActionCommand_(phone, user, text);
    return;
  }

  sendWhatsappText_(phone, "I did not understand that command.\n\n" + whatsappMenuText_(user));
}

function whatsappMenuText_(user) {
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
    "You can also type SEARCH name/phone, VOID type id, or CANCEL.",
    "",
    "Current scope: " + scoped.customers.length + " farms, " + scoped.distributors.length + " distributors, " + scoped.visits.length + " visits."
  ].join("\n");
}

function whatsappFlows_() {
  return {
    farm: {
      title: "Add Farm",
      save: saveBotFarm_,
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
        { key: "gps", label: "Share the farm GPS location using WhatsApp location, or type latitude,longitude", required: true, type: "location" }
      ]
    },
    distributor: {
      title: "Add Distributor",
      save: saveBotDistributor_,
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
        { key: "gps", label: "Share the distributor GPS location using WhatsApp location, or type latitude,longitude", required: true, type: "location" }
      ]
    },
    visit: {
      title: "Record Visit",
      save: saveBotVisit_,
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
      save: saveBotFollowup_,
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
      save: saveBotSale_,
      fields: [
        { key: "customerId", label: "Farm/distributor name, phone, or record ID", required: true, type: "account" },
        { key: "visitId", label: "Visit ID, or SKIP", required: false },
        { key: "date", label: "Sale date", required: true, type: "date", defaultValue: "today" },
        { key: "product", label: "Product sold\n" + WHATSAPP_BOT_PRODUCTS.map((item, index) => (index + 1) + ". " + item).join("\n"), required: true, type: "product" },
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
      save: saveBotComplaint_,
      fields: [
        { key: "customerId", label: "Farm/distributor name, phone, or record ID", required: true, type: "account" },
        { key: "date", label: "Complaint date", required: true, type: "date", defaultValue: "today" },
        { key: "category", label: "Complaint category", required: true },
        { key: "product", label: "Product involved\n" + WHATSAPP_BOT_PRODUCTS.map((item, index) => (index + 1) + ". " + item).join("\n"), required: false, type: "product" },
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
      save: runBotSearch_,
      fields: [
        { key: "query", label: "Enter farm/distributor name, phone, town, or record ID", required: true }
      ]
    }
  };
}

function startBotFlow_(phone, user, flowKey) {
  const flow = whatsappFlows_()[flowKey];
  if (!flow) {
    sendWhatsappText_(phone, "That action is not available. Type MENU.");
    return;
  }
  const session = { phone, userId: user.id, flow: flowKey, step: 0, data: "{}", updatedAt: new Date().toISOString() };
  saveBotSession_(session);
  sendWhatsappText_(phone, flow.title + "\n\n" + promptForBotStep_(flow, user, {}, 0));
}

function continueBotFlow_(phone, user, session, message, text) {
  const flow = whatsappFlows_()[session.flow];
  if (!flow) {
    clearBotSession_(phone);
    sendWhatsappText_(phone, "That saved action is no longer available. Type MENU.");
    return;
  }

  const data = botSessionData_(session);
  const fields = botFieldsForFlow_(flow, user, data);
  const step = Number(session.step || 0);
  const field = fields[step];
  if (!field) {
    finishBotFlow_(phone, user, flow, data);
    return;
  }

  const parsed = parseBotField_(field, message, text, user, data);
  if (parsed.pending) {
    session.data = JSON.stringify(parsed.data || data);
    session.updatedAt = new Date().toISOString();
    saveBotSession_(session);
    sendWhatsappText_(phone, parsed.message);
    return;
  }
  if (parsed.error) {
    sendWhatsappText_(phone, parsed.error + "\n\n" + promptForBotStep_(flow, user, data, step));
    return;
  }

  data[field.key] = parsed.value;
  delete data["_choices_" + field.key];
  session.step = step + 1;
  session.data = JSON.stringify(data);
  session.updatedAt = new Date().toISOString();
  saveBotSession_(session);

  if (session.step >= fields.length) {
    finishBotFlow_(phone, user, flow, data);
    return;
  }
  sendWhatsappText_(phone, promptForBotStep_(flow, user, data, session.step));
}

function finishBotFlow_(phone, user, flow, data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let result;
  try {
    result = flow.save(user, data);
  } finally {
    lock.releaseLock();
  }
  clearBotSession_(phone);
  sendWhatsappText_(phone, result.message + "\n\nType MENU for another action.");
}

function botFieldsForFlow_(flow, user, data) {
  return flow.fields.filter((field) => !field.forManagers || !isBotCanvasser_(user));
}

function promptForBotStep_(flow, user, data, step) {
  const fields = botFieldsForFlow_(flow, user, data);
  const field = fields[step];
  const count = "(" + (step + 1) + "/" + fields.length + ")";
  const defaultText = field.defaultValue ? "\nDefault: " + field.defaultValue : "";
  const optionalText = field.required ? "" : "\nReply SKIP if not applicable.";
  if (field.type === "location") {
    return count + " " + field.label + "\nUse WhatsApp attach/location, or type: 7.3775,3.9470";
  }
  if (field.type === "media") {
    const existing = Array.isArray(data[field.key]) ? data[field.key].length : 0;
    return count + " " + field.label + (existing ? "\nAttached so far: " + existing : "");
  }
  return count + " " + field.label + defaultText + optionalText;
}

function parseBotField_(field, message, text, user, data) {
  const cleanText = String(text || "").trim();
  if (!field.required && /^skip$/i.test(cleanText)) return { value: "" };
  if (!cleanText && field.defaultValue && field.defaultValue !== "today" && field.defaultValue !== "now") return { value: field.defaultValue };

  if (field.type === "location") return parseBotLocation_(message, cleanText);
  if (field.type === "media") return parseBotMedia_(field, message, cleanText, data);
  if (field.type === "account") return parseBotAccount_(field, cleanText, user, data);
  if (field.type === "date") return parseBotDate_(field, cleanText);
  if (field.type === "time") return parseBotTime_(field, cleanText);
  if (field.type === "number") return parseBotNumber_(field, cleanText);
  if (field.type === "product") return parseBotProduct_(field, cleanText);

  if (!cleanText && field.required) return { error: "This field is required." };
  return { value: cleanText || "" };
}

function parseBotLocation_(message, text) {
  if (message.location) {
    return {
      value: {
        lat: String(message.location.latitude || ""),
        lng: String(message.location.longitude || ""),
        accuracy: message.location.accuracy ? String(message.location.accuracy) : "WhatsApp",
        address: message.location.address || message.location.name || ""
      }
    };
  }
  const match = String(text || "").match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
  if (!match) return { error: "Please share a WhatsApp location or type latitude,longitude." };
  return { value: { lat: match[1], lng: match[3], accuracy: "Manual", address: "" } };
}

function parseBotMedia_(field, message, text, data) {
  const items = Array.isArray(data[field.key]) ? data[field.key] : [];
  if (/^(done|skip)$/i.test(text || "")) return { value: items };
  const media = message.image || message.video || null;
  if (!media) {
    return {
      pending: true,
      data,
      message: "Send a photo/video evidence file, or type DONE to continue."
    };
  }
  const type = message.image ? "image" : "video";
  const item = downloadWhatsappMedia_(media.id, media.mime_type, type, media.caption || "WhatsApp complaint evidence");
  items.push(item);
  data[field.key] = items;
  return {
    pending: true,
    data,
    message: "Evidence saved (" + items.length + "). Send another photo/video, or type DONE."
  };
}

function parseBotAccount_(field, text, user, data) {
  const choiceKey = "_choices_" + field.key;
  const choices = data[choiceKey] || [];
  const choiceNumber = Number(text);
  if (choices.length && Number.isInteger(choiceNumber) && choiceNumber >= 1 && choiceNumber <= choices.length) {
    return { value: choices[choiceNumber - 1].id };
  }

  const matches = findBotAccounts_(text, user).slice(0, 5);
  if (!matches.length) return { error: "No farm or distributor matched that search." };
  if (matches.length > 1) {
    data[choiceKey] = matches.map((item) => ({ id: item.id }));
    return {
      pending: true,
      data,
      message: "I found multiple matches. Reply with a number:\n" + matches.map((item, index) => (index + 1) + ". " + botAccountName_(item) + " - " + item.phone + " - " + item.town).join("\n")
    };
  }
  return { value: matches[0].id };
}

function parseBotDate_(field, text) {
  if (!text && field.defaultValue === "today") return { value: botToday_() };
  if (/^today$/i.test(text)) return { value: botToday_() };
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

function parseBotTime_(field, text) {
  if (!text && field.defaultValue === "now") return { value: botNowTime_() };
  if (/^now$/i.test(text)) return { value: botNowTime_() };
  if (!text && !field.required) return { value: "" };
  const value = formatTime_(text);
  if (!/^\d{2}:\d{2}$/.test(value)) return { error: "Use HH:MM, e.g. 09:30 or 14:45." };
  return { value };
}

function parseBotNumber_(field, text) {
  if (!text && !field.required) return { value: "" };
  const number = Number(String(text || "").replace(/,/g, ""));
  if (!Number.isFinite(number)) return { error: "Enter a valid number." };
  return { value: number };
}

function parseBotProduct_(field, text) {
  if (!text && !field.required) return { value: "" };
  const index = Number(text);
  if (Number.isInteger(index) && index >= 1 && index <= WHATSAPP_BOT_PRODUCTS.length) {
    return { value: WHATSAPP_BOT_PRODUCTS[index - 1] };
  }
  const match = WHATSAPP_BOT_PRODUCTS.find((product) => product.toLowerCase() === String(text || "").toLowerCase())
    || WHATSAPP_BOT_PRODUCTS.find((product) => product.toLowerCase().indexOf(String(text || "").toLowerCase()) >= 0);
  return match ? { value: match } : { error: "Choose a product number from the list, or type the product name." };
}

function saveBotFarm_(user, data) {
  const ownerId = botOwnerId_(data, user);
  const location = data.gps || {};
  const id = makeBotId_("c");
  const now = new Date().toISOString();
  const row = {
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
    updatedAt: botToday_(),
    voided: "",
    voidedBy: "",
    voidedAt: ""
  };
  appendRecordRow_("Customers", row);
  appendBotAudit_(id, "Created farm via WhatsApp", user);
  return { id, message: "Farm saved.\nID: " + id + "\nName: " + data.farmName };
}

function saveBotDistributor_(user, data) {
  const ownerId = botOwnerId_(data, user);
  const location = data.gps || {};
  const id = makeBotId_("d");
  const now = new Date().toISOString();
  const row = {
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
    updatedAt: botToday_(),
    voided: "",
    voidedBy: "",
    voidedAt: ""
  };
  appendRecordRow_("Distributors", row);
  appendBotAudit_(id, "Created distributor via WhatsApp", user);
  return { id, message: "Distributor saved.\nID: " + id + "\nName: " + data.businessName };
}

function saveBotVisit_(user, data) {
  const location = data.gps || {};
  const id = makeBotId_("v");
  const row = {
    id,
    customerId: data.customerId,
    date: data.date,
    time: data.time,
    gps: botGpsString_(location),
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
    updatedAt: botToday_(),
    voided: "",
    voidedBy: "",
    voidedAt: ""
  };
  appendRecordRow_("Visits", row);
  if (data.nextStep) {
    appendRecordRow_("Followups", {
      id: makeBotId_("f"),
      customerId: data.customerId,
      visitId: id,
      action: data.nextStep,
      responsible: user.name,
      priority: data.interest === "High" ? "High" : "Medium",
      dueDate: data.followupDate || botToday_(),
      status: "Pending",
      completionNotes: "",
      dateCompleted: "",
      voided: "",
      voidedBy: "",
      voidedAt: "",
      createdBy: user.name
    });
  }
  appendBotAudit_(data.customerId, "Recorded visit via WhatsApp", user);
  return { id, message: "Visit saved.\nID: " + id + "\nAccount: " + accountNameForBot_(data.customerId) };
}

function saveBotFollowup_(user, data) {
  const id = makeBotId_("f");
  appendRecordRow_("Followups", {
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
  appendBotAudit_(data.customerId, "Created follow-up via WhatsApp", user);
  return { id, message: "Follow-up saved.\nID: " + id + "\nDue: " + data.dueDate };
}

function saveBotSale_(user, data) {
  const saleId = makeBotId_("s");
  const itemId = makeBotId_("si");
  appendRecordRow_("Sales", {
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
  appendRecordRow_("SaleItems", {
    id: itemId,
    saleId,
    product: data.product,
    category: "Poultry Feed",
    feedType: data.product.replace(/^TMDK\s+/i, ""),
    quantity: data.quantity,
    unit: data.unit,
    unitPrice: data.unitPrice
  });
  appendBotAudit_(data.customerId, "Recorded sale via WhatsApp", user);
  return { id: saleId, message: "Sale saved.\nID: " + saleId + "\nTotal: " + botMoney_(Number(data.quantity || 0) * Number(data.unitPrice || 0)) };
}

function saveBotComplaint_(user, data) {
  const id = makeBotId_("cp");
  const evidence = Array.isArray(data.evidenceItems) ? data.evidenceItems : [];
  appendRecordRow_("Complaints", {
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
  appendBotAudit_(data.customerId, "Created complaint via WhatsApp", user);
  return { id, message: "Complaint saved.\nID: " + id + "\nEvidence files: " + evidence.length };
}

function runBotSearch_(user, data) {
  return { message: botSearchText_(user, data.query) };
}

function sendBotSearchResults_(phone, user, query) {
  if (!query) {
    startBotFlow_(phone, user, "search");
    return;
  }
  sendWhatsappText_(phone, botSearchText_(user, query));
}

function botSearchText_(user, query) {
  const matches = findBotAccounts_(query, user).slice(0, 6);
  if (!matches.length) return "No matching farms or distributors found for: " + query;
  return "Search results for \"" + query + "\":\n\n" + matches.map((account) => botAccountSummary_(user, account)).join("\n\n");
}

function sendBotFollowups_(phone, user) {
  const data = loadScoped_(user);
  const rows = data.followups
    .filter((row) => !isBotVoided_(row) && String(row.status || "").toLowerCase() !== "completed")
    .sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")))
    .slice(0, 10);
  if (!rows.length) {
    sendWhatsappText_(phone, "No pending follow-ups in your current scope.");
    return;
  }
  sendWhatsappText_(phone, "Pending follow-ups:\n\n" + rows.map((row) => [
    accountNameForBot_(row.customerId),
    "ID: " + row.id,
    "Due: " + row.dueDate,
    "Priority: " + row.priority,
    "Action: " + row.action
  ].join("\n")).join("\n\n"));
}

function sendBotSummary_(phone, user) {
  const data = loadScoped_(user);
  const today = botToday_();
  const todaySales = data.sales.filter((sale) => sale.date === today).reduce((sum, sale) => sum + botSaleTotal_(sale), 0);
  const pendingFollowups = data.followups.filter((row) => !isBotVoided_(row) && String(row.status || "").toLowerCase() !== "completed").length;
  const openComplaints = data.complaints.filter((row) => !isBotVoided_(row) && ["open", "under review"].indexOf(String(row.status || "").toLowerCase()) >= 0).length;
  sendWhatsappText_(phone, [
    "FarmLink Summary",
    "Farms: " + data.customers.length,
    "Distributors: " + data.distributors.length,
    "Visits today: " + data.visits.filter((visit) => visit.date === today).length,
    "Sales today: " + botMoney_(todaySales),
    "Pending follow-ups: " + pendingFollowups,
    "Open complaints: " + openComplaints
  ].join("\n"));
}

function handleBotRecordActionCommand_(phone, user, text) {
  const match = text.match(/^(void|delete)\s+(farm|customer|distributor|visit|followup|follow-up|sale|complaint)\s+(.+)$/i);
  if (!match) {
    sendWhatsappText_(phone, "Use: VOID type id\nExample: VOID visit v-123\nSales Admin can also use DELETE type id.");
    return;
  }
  const action = match[1].toLowerCase();
  const type = match[2].toLowerCase().replace("customer", "farm").replace("follow-up", "followup");
  const id = match[3].trim();
  try {
    const message = action === "delete" ? deleteBotRecord_(user, type, id) : voidBotRecord_(user, type, id);
    sendWhatsappText_(phone, message);
  } catch (error) {
    sendWhatsappText_(phone, errorMessage_(error));
  }
}

function voidBotRecord_(user, type, id) {
  const config = botTypeConfig_(type);
  const rows = readTable_(config.sheet);
  const index = rows.findIndex((row) => String(row.id) === id);
  if (index < 0) throw new Error("Record not found");
  if (!botCanAccessRecord_(user, type, rows[index])) throw new Error("You cannot void this record");
  rows[index].voided = "Yes";
  rows[index].voidedBy = user.name;
  rows[index].voidedAt = new Date().toISOString();
  if (type === "followup") rows[index].status = "Cancelled";
  writeTable_(config.sheet, rows);
  appendBotAudit_(config.accountId(rows[index]), "Voided " + type + " via WhatsApp", user);
  return "Record voided.\nType: " + type + "\nID: " + id;
}

function deleteBotRecord_(user, type, id) {
  if (!isSalesAdmin_(user)) throw new Error("Only Sales Admin can permanently delete records");
  const config = botTypeConfig_(type);
  const rows = readTable_(config.sheet);
  const target = rows.find((row) => String(row.id) === id);
  if (!target) throw new Error("Record not found");
  if (!botCanAccessRecord_(user, type, target)) throw new Error("You cannot delete this record");
  if (type === "farm" || type === "distributor") {
    deleteBotAccountCascade_(type, id);
  } else if (type === "sale") {
    writeTable_("Sales", readTable_("Sales").filter((row) => row.id !== id));
    writeTable_("SaleItems", readTable_("SaleItems").filter((row) => row.saleId !== id));
  } else {
    writeTable_(config.sheet, rows.filter((row) => row.id !== id));
  }
  appendBotAudit_(config.accountId(target), "Deleted " + type + " via WhatsApp", user);
  return "Record deleted.\nType: " + type + "\nID: " + id;
}

function deleteBotAccountCascade_(type, id) {
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

function botTypeConfig_(type) {
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

function botCanAccessRecord_(user, type, row) {
  const config = botTypeConfig_(type);
  return botCanAccessAccount_(user, config.accountId(row));
}

function botCanAccessAccount_(user, accountId) {
  const data = loadScoped_(user);
  return data.customers.some((row) => row.id === accountId) || data.distributors.some((row) => row.id === accountId);
}

function findBotAccounts_(query, user) {
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

function botAccountSummary_(user, account) {
  const data = loadScoped_(user);
  const visits = data.visits.filter((row) => row.customerId === account.id);
  const followups = data.followups.filter((row) => row.customerId === account.id && String(row.status || "").toLowerCase() !== "completed");
  const complaints = data.complaints.filter((row) => row.customerId === account.id && ["open", "under review"].indexOf(String(row.status || "").toLowerCase()) >= 0);
  const salesTotal = data.sales.filter((row) => row.customerId === account.id).reduce((sum, sale) => sum + botSaleTotal_(sale), 0);
  return [
    botAccountName_(account) + " (" + account.accountType + ")",
    "ID: " + account.id,
    "Contact: " + (account.contact || "Not captured") + " - " + (account.phone || "No phone"),
    "Location: " + [account.town, account.lga, account.state].filter(Boolean).join(", "),
    "Last visit: " + (visits.sort((a, b) => String(b.date).localeCompare(String(a.date)))[0]?.date || "None"),
    "Pending follow-ups: " + followups.length,
    "Open complaints: " + complaints.length,
    "Sales value: " + botMoney_(salesTotal)
  ].join("\n");
}

function botOwnerId_(data, user) {
  if (isBotCanvasser_(user)) return user.id;
  const owner = resolveBotCanvasser_(data.ownerIdentity, user);
  if (!owner) throw new Error("Assigned canvasser was not found or is outside your role scope");
  return owner.id;
}

function resolveBotCanvasser_(identity, user) {
  const clean = String(identity || "").trim().toLowerCase();
  const users = readTable_("Users");
  const allowedIds = new Set(allowedCanvasserIds_(user, users));
  return users.find((row) => allowedIds.has(row.id) && row.role === "Canvasser" && [
    row.id,
    row.name,
    row.email,
    row.username,
    row.whatsappPhone
  ].some((value) => String(value || "").trim().toLowerCase() === clean));
}

function whatsappUserForPhone_(phone) {
  const clean = normalizePhoneInput_(phone);
  return readTable_("Users").find((user) => clean && normalizePhoneInput_(user.whatsappPhone) === clean);
}

function whatsappMessageText_(message) {
  if (!message) return "";
  if (message.text && message.text.body) return String(message.text.body);
  if (message.button && message.button.text) return String(message.button.text);
  if (message.interactive && message.interactive.button_reply) return String(message.interactive.button_reply.title || message.interactive.button_reply.id || "");
  if (message.interactive && message.interactive.list_reply) return String(message.interactive.list_reply.title || message.interactive.list_reply.id || "");
  if (message.image && message.image.caption) return String(message.image.caption);
  if (message.video && message.video.caption) return String(message.video.caption);
  return "";
}

function readBotSession_(phone) {
  const clean = normalizePhoneInput_(phone);
  return readTable_("BotSessions").find((row) => normalizePhoneInput_(row.phone) === clean);
}

function saveBotSession_(session) {
  const clean = normalizePhoneInput_(session.phone);
  const sessions = readTable_("BotSessions").filter((row) => normalizePhoneInput_(row.phone) !== clean);
  sessions.push({
    phone: clean,
    userId: session.userId,
    flow: session.flow,
    step: session.step,
    data: session.data || "{}",
    updatedAt: session.updatedAt || new Date().toISOString()
  });
  writeTable_("BotSessions", sessions);
}

function clearBotSession_(phone) {
  const clean = normalizePhoneInput_(phone);
  writeTable_("BotSessions", readTable_("BotSessions").filter((row) => normalizePhoneInput_(row.phone) !== clean));
}

function botSessionData_(session) {
  try {
    const parsed = JSON.parse(session.data || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function sendWhatsappText_(to, body) {
  const accessToken = whatsappProp_("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = whatsappProp_("WHATSAPP_PHONE_NUMBER_ID");
  if (!accessToken || !phoneNumberId) {
    Logger.log("WhatsApp is not configured. Message to " + to + ": " + body);
    return null;
  }
  const url = "https://graph.facebook.com/" + whatsappGraphVersion_() + "/" + phoneNumberId + "/messages";
  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + accessToken },
    payload: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizePhoneInput_(to),
      type: "text",
      text: { preview_url: false, body: String(body || "").slice(0, 3900) }
    })
  });
  Logger.log("WhatsApp send response: " + response.getContentText());
  return response;
}

function downloadWhatsappMedia_(mediaId, mimeType, type, caption) {
  const accessToken = whatsappProp_("WHATSAPP_ACCESS_TOKEN");
  if (!accessToken) throw new Error("WhatsApp access token is not configured");
  const metadataUrl = "https://graph.facebook.com/" + whatsappGraphVersion_() + "/" + mediaId;
  const metadataResponse = UrlFetchApp.fetch(metadataUrl, {
    method: "get",
    muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + accessToken }
  });
  const metadata = JSON.parse(metadataResponse.getContentText() || "{}");
  if (!metadata.url) throw new Error("Could not retrieve WhatsApp media");
  const fileResponse = UrlFetchApp.fetch(metadata.url, {
    method: "get",
    muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + accessToken }
  });
  const cleanMimeType = mimeType || metadata.mime_type || fileResponse.getBlob().getContentType() || (type === "video" ? "video/mp4" : "image/jpeg");
  const extension = cleanMimeType.split("/")[1] || (type === "video" ? "mp4" : "jpg");
  const name = safeFileName_((caption || "whatsapp-evidence") + "-" + Utilities.getUuid().slice(0, 8) + "." + extension);
  const file = evidenceFolder_().createFile(fileResponse.getBlob().setName(name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return {
    id: Utilities.getUuid(),
    name,
    type,
    mimeType: cleanMimeType,
    driveFileId: file.getId(),
    url: file.getUrl(),
    addedAt: new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
    source: "whatsapp",
    mediaId
  };
}

function appendRecordRow_(name, row) {
  const sheet = getOrCreateSheet_(name);
  const headers = TABLES[name];
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(headers.map((header) => row[header] == null ? "" : row[header]));
}

function appendBotAudit_(customerId, action, user) {
  appendRecordRow_("AuditLogs", {
    id: makeBotId_("a"),
    customerId,
    action,
    user: user.name,
    date: botToday_()
  });
}

function makeBotId_(prefix) {
  return String(prefix || "id").toLowerCase() + "-" + Utilities.getUuid();
}

function botGpsString_(location) {
  if (!location || !location.lat || !location.lng) return "";
  return location.lat + ", " + location.lng + " (" + (location.accuracy || "WhatsApp") + ")";
}

function accountNameForBot_(id) {
  const customer = readTable_("Customers").find((row) => row.id === id);
  if (customer) return customer.farmName;
  const distributor = readTable_("Distributors").find((row) => row.id === id);
  return distributor ? distributor.businessName : id;
}

function botAccountName_(account) {
  return account.accountName || account.farmName || account.businessName || account.id;
}

function botSaleTotal_(sale) {
  return (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
}

function botMoney_(value) {
  return "NGN " + Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function botToday_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function botNowTime_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm");
}

function isBotCanvasser_(user) {
  return String(user.role || "").toLowerCase() === "canvasser";
}

function isBotVoided_(row) {
  const value = String(row.voided || "").toLowerCase();
  return value === "yes" || value === "true" || value === "voided";
}

function whatsappProp_(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || "";
}

function whatsappGraphVersion_() {
  return whatsappProp_("WHATSAPP_GRAPH_VERSION") || WHATSAPP_DEFAULT_GRAPH_VERSION;
}
