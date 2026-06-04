const OFFLINE_DB_NAME = "farmlink-sales-offline-db";
const OFFLINE_STORE_NAME = "app";
const OFFLINE_STATE_KEY = "state";
const PENDING_SYNC_KEY = "pendingSync";
const SESSION_KEY = "farmlink-sales-session";
const GPS_MAX_ACCURACY_METERS = 400;

const roleProfiles = {
  canvasser: "u1",
  manager: "u3",
  admin: "u5"
};

const lists = {
  categories: ["New", "Existing", "Prospect", "Active", "Dormant"],
  farmTypes: ["Broiler", "Layer", "Breeder", "Turkey", "Duck", "Mixed"],
  stages: ["Starter", "Grower", "Finisher", "Layer", "Point of Lay", "Breeder"],
  visitTypes: ["New Prospect", "Routine Visit", "Follow-up", "Complaint Visit", "Sales Visit", "Technical Support"],
  priorities: ["Low", "Medium", "High"],
  actionStatus: ["Pending", "In Progress", "Completed", "Cancelled"],
  paymentStatus: ["Paid", "Part Payment", "Credit"],
  deliveryStatus: ["Delivered", "Pending", "Partially Delivered"],
  complaintCategories: ["Product Quality", "Delivery Delay", "Wrong Product", "Damaged Bags", "Pricing Issue", "Poor Customer Service", "Short Supply", "Other"],
  complaintStatus: ["Open", "Under Review", "Resolved", "Closed"],
  severity: ["Low", "Medium", "High", "Critical"],
  products: ["Broiler Starter", "Broiler Grower", "Broiler Finisher", "Layer Mash", "Breeder Mash", "Concentrate", "Turkey Grower"]
};

const demoData = {
  currentUser: "Ada Okafor",
  users: [
    { id: "u1", name: "Ada Okafor", email: "ada@farmlink.local", username: "ada", role: "Canvasser", territory: "Ibadan North", managerId: "u3", status: "Active" },
    { id: "u2", name: "Tunde Balogun", email: "tunde@farmlink.local", username: "tunde", role: "Canvasser", territory: "Akinyele", managerId: "u3", status: "Active" },
    { id: "u3", name: "Miriam Yusuf", email: "miriam@farmlink.local", username: "miriam", role: "Area Manager", territory: "Oyo Central", managerId: "", status: "Active" },
    { id: "u4", name: "Bola Nwosu", email: "bola@farmlink.local", username: "bola", role: "Canvasser", territory: "Abeokuta East", managerId: "u6", status: "Active" },
    { id: "u5", name: "Chidi Nnamdi", email: "admin@farmlink.local", username: "admin", role: "Sales Admin", territory: "Back Office", managerId: "", status: "Active" },
    { id: "u6", name: "Grace Bello", email: "grace@farmlink.local", username: "grace", role: "Area Manager", territory: "Ogun Region", managerId: "", status: "Active" }
  ],
  customers: [
    {
      id: "c1",
      farmName: "Sunrise Poultry Farm",
      contact: "Mr. Adebayo Lawal",
      phone: "0803 441 9821",
      altPhone: "0816 201 1174",
      email: "sunrise@example.com",
      address: "Plot 12, Ologuneru Farm Road",
      state: "Oyo",
      lga: "Ibadan North-West",
      town: "Ologuneru",
      category: "Active",
      farmType: "Broiler",
      birdType: "Broiler",
      capacity: 5200,
      stock: 4700,
      pens: 4,
      stage: "Finisher",
      feedConsumption: "95 bags weekly",
      feedBrand: "PrimeGrow",
      frequency: "Weekly",
      supplier: "Local distributor",
      notes: "High buyer potential. Prefers early morning visits.",
      lat: "7.4252",
      lng: "3.8878",
      accuracy: "14m",
      ownerId: "u1",
      createdBy: "Ada Okafor",
      createdAt: "2026-05-03",
      updatedBy: "Ada Okafor",
      updatedAt: "2026-06-01"
    },
    {
      id: "c2",
      farmName: "Green Acre Layers",
      contact: "Mrs. Kemi Ajayi",
      phone: "0812 773 0045",
      altPhone: "0706 552 9001",
      email: "",
      address: "Behind Unity Market",
      state: "Oyo",
      lga: "Akinyele",
      town: "Moniya",
      category: "Existing",
      farmType: "Layer",
      birdType: "Layer",
      capacity: 8300,
      stock: 7900,
      pens: 6,
      stage: "Layer",
      feedConsumption: "130 bags weekly",
      feedBrand: "LayerBest",
      frequency: "Twice weekly",
      supplier: "Competitor direct sales",
      notes: "Wants price stability before switching.",
      lat: "7.5281",
      lng: "3.9146",
      accuracy: "18m",
      ownerId: "u2",
      createdBy: "Tunde Balogun",
      createdAt: "2026-04-19",
      updatedBy: "Ada Okafor",
      updatedAt: "2026-05-29"
    },
    {
      id: "c3",
      farmName: "Olive Crest Farms",
      contact: "Pastor Daniel Eze",
      phone: "0905 650 2241",
      altPhone: "",
      email: "olivecrest@example.com",
      address: "Km 4, Ijaye Road",
      state: "Oyo",
      lga: "Akinyele",
      town: "Ijaye",
      category: "Prospect",
      farmType: "Mixed",
      birdType: "Broiler, Layer",
      capacity: 3700,
      stock: 2800,
      pens: 3,
      stage: "Grower",
      feedConsumption: "70 bags weekly",
      feedBrand: "FarmPlus",
      frequency: "Weekly",
      supplier: "Open market",
      notes: "Requested product sample and technical support.",
      lat: "",
      lng: "",
      accuracy: "",
      ownerId: "u1",
      createdBy: "Ada Okafor",
      createdAt: "2026-05-22",
      updatedBy: "Ada Okafor",
      updatedAt: "2026-05-30"
    },
    {
      id: "c4",
      farmName: "Rockfield Turkey Unit",
      contact: "Engr. Musa Bello",
      phone: "0809 990 3338",
      altPhone: "0813 220 5550",
      email: "",
      address: "Old Quarry Road",
      state: "Oyo",
      lga: "Ido",
      town: "Apete",
      category: "Dormant",
      farmType: "Turkey",
      birdType: "Turkey",
      capacity: 1600,
      stock: 900,
      pens: 2,
      stage: "Grower",
      feedConsumption: "30 bags weekly",
      feedBrand: "NutriMax",
      frequency: "Bi-weekly",
      supplier: "Open market",
      notes: "Complaint from May still under review.",
      lat: "7.4040",
      lng: "3.8292",
      accuracy: "21m",
      ownerId: "u2",
      createdBy: "Tunde Balogun",
      createdAt: "2026-03-11",
      updatedBy: "Ada Okafor",
      updatedAt: "2026-05-21"
    },
    {
      id: "c5",
      farmName: "Cedar Hatch & Feed",
      contact: "Mr. Segun Thomas",
      phone: "0703 108 7781",
      altPhone: "",
      email: "cedar@example.com",
      address: "Adegbayi Estate",
      state: "Oyo",
      lga: "Egbeda",
      town: "Adegbayi",
      category: "New",
      farmType: "Breeder",
      birdType: "Breeder",
      capacity: 2400,
      stock: 2100,
      pens: 3,
      stage: "Breeder",
      feedConsumption: "42 bags weekly",
      feedBrand: "None fixed",
      frequency: "Weekly",
      supplier: "Direct mill purchase",
      notes: "Interested in credit terms after first three orders.",
      lat: "7.4023",
      lng: "3.9855",
      accuracy: "12m",
      ownerId: "u1",
      createdBy: "Ada Okafor",
      createdAt: "2026-06-01",
      updatedBy: "Ada Okafor",
      updatedAt: "2026-06-01"
    },
    {
      id: "c6",
      farmName: "Blue Ridge Poultry",
      contact: "Mrs. Ngozi Umeh",
      phone: "0802 118 4600",
      altPhone: "0814 330 1188",
      email: "",
      address: "Block 8, Quarry Extension",
      state: "Ogun",
      lga: "Abeokuta South",
      town: "Abeokuta",
      category: "Active",
      farmType: "Layer",
      birdType: "Layer",
      capacity: 6100,
      stock: 5600,
      pens: 5,
      stage: "Layer",
      feedConsumption: "100 bags weekly",
      feedBrand: "LayerBest",
      frequency: "Weekly",
      supplier: "Dealer network",
      notes: "Outside Miriam Yusuf's area. Visible to Sales Admin only in this prototype.",
      lat: "7.1608",
      lng: "3.3483",
      accuracy: "16m",
      ownerId: "u4",
      createdBy: "Bola Nwosu",
      createdAt: "2026-05-27",
      updatedBy: "Bola Nwosu",
      updatedAt: "2026-06-01"
    }
  ],
  birdDetails: [
    { id: "b1", customerId: "c1", birdType: "Broiler", breed: "Ross 308", stage: "Finisher", quantity: 2700, pen: "Pen 1", age: "6 weeks", mortality: "2.1%", feed: "Broiler Finisher", notes: "Ready for off-take within 10 days." },
    { id: "b2", customerId: "c1", birdType: "Broiler", breed: "Arbor Acres", stage: "Grower", quantity: 2000, pen: "Pen 2", age: "4 weeks", mortality: "1.4%", feed: "Broiler Grower", notes: "Uniform weight gain." },
    { id: "b3", customerId: "c2", birdType: "Layer", breed: "Isa Brown", stage: "Layer", quantity: 7900, pen: "Layer block A", age: "32 weeks", mortality: "0.8%", feed: "Layer Mash", notes: "Egg production stable." },
    { id: "b4", customerId: "c3", birdType: "Broiler", breed: "", stage: "Starter", quantity: 1200, pen: "Pen A", age: "2 weeks", mortality: "", feed: "FarmPlus Starter", notes: "Asked for starter sample." },
    { id: "b5", customerId: "c6", birdType: "Layer", breed: "Isa Brown", stage: "Layer", quantity: 5600, pen: "Layer block B", age: "28 weeks", mortality: "1.0%", feed: "Layer Mash", notes: "Strong repeat buyer in Ogun territory." }
  ],
  visits: [
    { id: "v1", customerId: "c1", date: "2026-06-02", time: "09:20", gps: "7.4252, 3.8878", type: "Sales Visit", personMet: "Mr. Lawal", purpose: "Confirm reorder", summary: "Discussed finisher feed reorder and delivery timing.", observation: "Birds active, feed stock low.", currentFeed: "PrimeGrow", competitor: "No active competitor visit this week.", interest: "High", nextStep: "Send invoice and book delivery", followupDate: "2026-06-03", notes: "Customer requested early truck dispatch.", createdBy: "Ada Okafor", updatedAt: "2026-06-02" },
    { id: "v2", customerId: "c2", date: "2026-06-01", time: "14:10", gps: "7.5281, 3.9146", type: "Routine Visit", personMet: "Mrs. Ajayi", purpose: "Layer mash pricing", summary: "Shared current price list and discussed credit policy.", observation: "Feed store clean, egg crate demand high.", currentFeed: "LayerBest", competitor: "Competitor offered discount for 100 bags.", interest: "Medium", nextStep: "Manager to approve introductory discount", followupDate: "2026-06-05", notes: "Price is main blocker.", createdBy: "Tunde Balogun", updatedAt: "2026-06-01" },
    { id: "v3", customerId: "c3", date: "2026-05-30", time: "11:00", gps: "Not tagged", type: "New Prospect", personMet: "Pastor Eze", purpose: "Product introduction", summary: "Introduced starter and grower feed line.", observation: "Pens need better ventilation.", currentFeed: "FarmPlus", competitor: "Open market supply only.", interest: "High", nextStep: "Arrange technical support visit", followupDate: "2026-06-04", notes: "Retag location on next visit.", createdBy: "Ada Okafor", updatedAt: "2026-05-30" },
    { id: "v4", customerId: "c4", date: "2026-05-21", time: "16:35", gps: "7.4040, 3.8292", type: "Complaint Visit", personMet: "Engr. Bello", purpose: "Review damaged bags", summary: "Inspected affected bags and batch label.", observation: "Storage area dry, damage likely from delivery handling.", currentFeed: "NutriMax", competitor: "None discussed.", interest: "Low", nextStep: "Escalate batch photos to QA", followupDate: "2026-06-02", notes: "Customer waiting for replacement decision.", createdBy: "Tunde Balogun", updatedAt: "2026-05-21" },
    { id: "v5", customerId: "c6", date: "2026-06-02", time: "10:45", gps: "7.1608, 3.3483", type: "Routine Visit", personMet: "Mrs. Umeh", purpose: "Layer mash reorder", summary: "Confirmed stock level and next delivery volume.", observation: "Birds healthy, feed room needs pallet lift.", currentFeed: "LayerBest", competitor: "Dealer offered smaller discount.", interest: "High", nextStep: "Confirm 30-bag order with dispatch", followupDate: "2026-06-04", notes: "Owned by Bola Nwosu outside current area manager scope.", createdBy: "Bola Nwosu", updatedAt: "2026-06-02" }
  ],
  followups: [
    { id: "f1", customerId: "c1", visitId: "v1", action: "Confirm payment and delivery slot", responsible: "Ada Okafor", priority: "High", dueDate: "2026-06-03", status: "Pending", completionNotes: "", dateCompleted: "" },
    { id: "f2", customerId: "c2", visitId: "v2", action: "Request introductory discount approval", responsible: "Miriam Yusuf", priority: "Medium", dueDate: "2026-06-05", status: "In Progress", completionNotes: "", dateCompleted: "" },
    { id: "f3", customerId: "c3", visitId: "v3", action: "Schedule technical support visit", responsible: "Ada Okafor", priority: "High", dueDate: "2026-06-04", status: "Pending", completionNotes: "", dateCompleted: "" },
    { id: "f4", customerId: "c4", visitId: "v4", action: "Send complaint photos to QA", responsible: "Tunde Balogun", priority: "High", dueDate: "2026-06-01", status: "Pending", completionNotes: "", dateCompleted: "" },
    { id: "f5", customerId: "c6", visitId: "v5", action: "Confirm 30-bag order with dispatch", responsible: "Bola Nwosu", priority: "Medium", dueDate: "2026-06-04", status: "Pending", completionNotes: "", dateCompleted: "" }
  ],
  sales: [
    { id: "s1", customerId: "c1", visitId: "v1", date: "2026-06-02", paymentStatus: "Part Payment", deliveryStatus: "Pending", invoice: "INV-2401", notes: "Deliver tomorrow morning.", createdBy: "Ada Okafor", items: [{ id: "si1", product: "Broiler Finisher", category: "Feed", feedType: "Finisher", quantity: 35, unit: "Bags", unitPrice: 18500 }] },
    { id: "s2", customerId: "c2", visitId: "v2", date: "2026-05-29", paymentStatus: "Paid", deliveryStatus: "Delivered", invoice: "INV-2385", notes: "Repeat order likely next week.", createdBy: "Tunde Balogun", items: [{ id: "si2", product: "Layer Mash", category: "Feed", feedType: "Layer Mash", quantity: 22, unit: "Bags", unitPrice: 17600 }] },
    { id: "s3", customerId: "c5", visitId: "", date: "2026-06-01", paymentStatus: "Credit", deliveryStatus: "Delivered", invoice: "INV-2400", notes: "First purchase after onboarding.", createdBy: "Ada Okafor", items: [{ id: "si3", product: "Breeder Mash", category: "Feed", feedType: "Breeder", quantity: 18, unit: "Bags", unitPrice: 19800 }] },
    { id: "s4", customerId: "c6", visitId: "v5", date: "2026-06-02", paymentStatus: "Paid", deliveryStatus: "Pending", invoice: "INV-2402", notes: "Outside current area manager scope.", createdBy: "Bola Nwosu", items: [{ id: "si4", product: "Layer Mash", category: "Feed", feedType: "Layer Mash", quantity: 30, unit: "Bags", unitPrice: 17700 }] }
  ],
  complaints: [
    { id: "cp1", customerId: "c4", date: "2026-05-21", category: "Damaged Bags", product: "Turkey Grower", batch: "TG-0526-04", quantity: "7 bags", description: "Outer bags torn during delivery.", severity: "High", actionTaken: "Photos taken and batch noted.", assignedTo: "QA Desk", status: "Under Review", resolutionNotes: "", dateResolved: "" },
    { id: "cp2", customerId: "c2", date: "2026-05-28", category: "Pricing Issue", product: "Layer Mash", batch: "", quantity: "", description: "Customer says competitor price is lower.", severity: "Medium", actionTaken: "Escalated to manager for discount review.", assignedTo: "Miriam Yusuf", status: "Open", resolutionNotes: "", dateResolved: "" },
    { id: "cp3", customerId: "c1", date: "2026-05-18", category: "Delivery Delay", product: "Broiler Grower", batch: "", quantity: "20 bags", description: "Truck arrived five hours late.", severity: "Low", actionTaken: "Apology issued and logistics informed.", assignedTo: "Dispatch Lead", status: "Resolved", resolutionNotes: "Dispatch window adjusted for next order.", dateResolved: "2026-05-19" },
    { id: "cp4", customerId: "c6", date: "2026-05-31", category: "Short Supply", product: "Layer Mash", batch: "LM-0526-11", quantity: "2 bags", description: "Customer reported two bags short on delivery note.", severity: "Medium", actionTaken: "Dispatch asked to reconcile trip sheet.", assignedTo: "Sales Admin", status: "Open", resolutionNotes: "", dateResolved: "" }
  ],
  auditLogs: []
};

let state = loadState();
let authSession = loadSession();
let backendSync = {
  loading: false,
  saving: false,
  lastSavedAt: "",
  lastError: "",
  saveTimer: null,
  suppressSave: false
};

let offlineCache = {
  ready: false,
  pending: false
};
let offlineDbPromise = null;
let loadingDepth = 0;

let ui = {
  signedIn: false,
  view: "dashboard",
  role: "canvasser",
  regionFilter: "all",
  canvasserFilter: "all",
  customerFilter: "",
  globalSearch: "",
  sidebarOpen: false
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  els.loginScreen = document.getElementById("loginScreen");
  els.loginForm = document.getElementById("loginForm");
  els.appShell = document.getElementById("appShell");
  els.main = document.getElementById("mainContent");
  els.modalRoot = document.getElementById("modalRoot");
  els.loadingOverlay = document.getElementById("loadingOverlay");
  els.loadingTitle = document.getElementById("loadingTitle");
  els.loadingMessage = document.getElementById("loadingMessage");
  els.toastRoot = document.getElementById("toastRoot");
  els.globalSearch = document.getElementById("globalSearch");

  els.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleLogin(new FormData(els.loginForm));
  });

  document.body.addEventListener("click", handleClick);
  document.body.addEventListener("input", handleInput);
  document.body.addEventListener("change", handleChange);
  els.globalSearch.addEventListener("input", () => {
    ui.globalSearch = els.globalSearch.value.trim().toLowerCase();
    render();
  });
  window.addEventListener("online", () => {
    toast("Connection restored. Syncing pending changes.");
    syncPendingChanges();
  });
  window.addEventListener("offline", () => {
    updateSyncButton();
    toast("Offline mode. New records will sync later.");
  });

  initializeOfflineCache();
  refreshIcons();
});

function loadState() {
  return structuredClone(demoData);
}

function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function saveSession(session) {
  authSession = session;
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
}

function roleKeyForUser(role = "") {
  const normalized = role.toLowerCase();
  if (normalized.includes("admin")) return "admin";
  if (normalized.includes("manager")) return "manager";
  return "canvasser";
}

async function handleLogin(formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) {
    toast("Enter email and password");
    return;
  }

  if (!backendIsConfigured()) {
    toast("Live backend is not configured in config.js");
    backendSync.lastError = "Missing Apps Script URL";
    updateSyncButton();
    return;
  }

  backendSync.loading = true;
  showLoading("Signing in", "Loading your workspace and latest Google Sheets records.");
  updateSyncButton();
  try {
    const payload = await postBackend("login", { email, password });
    if (!payload.ok) throw new Error(payload.error || "Login failed");
    saveSession({ token: payload.token, user: payload.user });
    backendSync.suppressSave = true;
    state = normalizeBackendState(payload.data || {});
    state.currentUser = payload.user.name;
    saveOfflineCache();
    clearPendingSync();
    backendSync.suppressSave = false;
    ui.role = roleKeyForUser(payload.user.role);
    ui.regionFilter = "all";
    ui.canvasserFilter = "all";
    ui.signedIn = true;
    els.loginScreen.classList.add("is-hidden");
    els.appShell.classList.remove("is-hidden");
    toast(`Welcome ${payload.user.name}`);
    render();
  } catch (error) {
    backendSync.lastError = error.message || "Login failed";
    toast("Login failed. Check the account details.");
  } finally {
    backendSync.loading = false;
    hideLoading();
    updateSyncButton();
  }
}

function saveState() {
  saveOfflineCache();
  queueBackendSave();
}

function backendUrl() {
  return (window.FARMLINK_BACKEND_URL || "").trim();
}

function backendIsConfigured() {
  return Boolean(backendUrl());
}

function openOfflineDb() {
  if (offlineDbPromise) return offlineDbPromise;
  if (!window.indexedDB) return Promise.reject(new Error("IndexedDB is unavailable"));

  offlineDbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(OFFLINE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_STORE_NAME)) db.createObjectStore(OFFLINE_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open offline cache"));
  });

  return offlineDbPromise;
}

async function readOfflineValue(key) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(OFFLINE_STORE_NAME, "readonly").objectStore(OFFLINE_STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not read offline cache"));
  });
}

async function writeOfflineValue(key, value) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(OFFLINE_STORE_NAME, "readwrite").objectStore(OFFLINE_STORE_NAME).put(value, key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error("Could not write offline cache"));
  });
}

async function deleteOfflineValue(key) {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(OFFLINE_STORE_NAME, "readwrite").objectStore(OFFLINE_STORE_NAME).delete(key);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error || new Error("Could not clear offline cache"));
  });
}

async function initializeOfflineCache() {
  try {
    const [cachedState, pendingSync] = await Promise.all([
      readOfflineValue(OFFLINE_STATE_KEY),
      readOfflineValue(PENDING_SYNC_KEY)
    ]);
    offlineCache.pending = Boolean(pendingSync);
    offlineCache.ready = true;
    if (backendIsConfigured() && authSession?.user && cachedState) {
      backendSync.suppressSave = true;
      state = normalizeBackendState(cachedState);
      state.currentUser = authSession.user.name;
      backendSync.suppressSave = false;
      ui.role = roleKeyForUser(authSession.user.role);
      ui.regionFilter = "all";
      ui.canvasserFilter = "all";
      ui.signedIn = true;
      els.loginScreen.classList.add("is-hidden");
      els.appShell.classList.remove("is-hidden");
      render();
      if (navigator.onLine === false) toast("Offline session restored");
      else pullBackendState({ silent: true }).then(() => render());
    }
  } catch (error) {
    backendSync.lastError = error.message || "Offline cache unavailable";
  } finally {
    updateSyncButton();
  }
}

function saveOfflineCache() {
  writeOfflineValue(OFFLINE_STATE_KEY, state).catch((error) => {
    backendSync.lastError = error.message || "Offline cache unavailable";
    updateSyncButton();
  });
}

function markPendingSync() {
  offlineCache.pending = true;
  writeOfflineValue(PENDING_SYNC_KEY, { pending: true, updatedAt: new Date().toISOString() }).catch((error) => {
    backendSync.lastError = error.message || "Pending sync queue unavailable";
    updateSyncButton();
  });
}

function clearPendingSync() {
  offlineCache.pending = false;
  deleteOfflineValue(PENDING_SYNC_KEY).catch(() => {});
}

function hasPendingSync() {
  return offlineCache.pending;
}

function canSyncNow() {
  return backendIsConfigured() && Boolean(authSession?.token) && navigator.onLine !== false;
}

function backendStatusText() {
  if (!backendIsConfigured()) return "No backend";
  if (navigator.onLine === false) return hasPendingSync() ? "Offline changes" : "Offline";
  if (backendSync.loading) return "Loading";
  if (backendSync.saving) return "Saving";
  if (backendSync.lastError) return "Sync issue";
  if (hasPendingSync()) return "Pending sync";
  if (backendSync.lastSavedAt) return "Synced";
  return "Sheet ready";
}

function updateSyncButton() {
  const button = document.getElementById("syncButton");
  if (!button) return;
  button.innerHTML = `<i data-lucide="${backendIsConfigured() ? "cloud-check" : "database"}"></i>${backendStatusText()}`;
  refreshIcons();
}

async function pullBackendState(options = {}) {
  if (!backendIsConfigured()) {
    updateSyncButton();
    return false;
  }
  if (!authSession?.token) {
    if (!options.silent) toast("Login required before pulling sheet data");
    updateSyncButton();
    return false;
  }

  backendSync.loading = true;
  backendSync.lastError = "";
  if (!options.silent || options.loadingMessage) showLoading("Loading records", options.loadingMessage || "Pulling the latest Google Sheets data.");
  updateSyncButton();
  try {
    const payload = await postBackend("load", { token: authSession.token });
    if (!payload.ok) throw new Error(payload.error || "Backend load failed");

    if (payload.data && hasBackendRows(payload.data)) {
      backendSync.suppressSave = true;
      state = normalizeBackendState(payload.data);
      state.currentUser = authSession.user.name;
      saveOfflineCache();
      clearPendingSync();
      backendSync.suppressSave = false;
      if (!options.silent) toast("Loaded from Google Sheets");
      return true;
    }

    if (!options.silent) toast("No records are available for this account yet.");
    return false;
  } catch (error) {
    backendSync.lastError = error.message || "Backend load failed";
    if (!options.silent) toast("Could not load Google Sheet. Showing offline cache.");
    return false;
  } finally {
    backendSync.loading = false;
    if (!options.silent || options.loadingMessage) hideLoading();
    updateSyncButton();
  }
}

function hasBackendRows(data) {
  return ["users", "customers", "visits", "followups", "sales", "complaints"].some((key) => Array.isArray(data[key]) && data[key].length);
}

function normalizeBackendState(data) {
  return {
    ...structuredClone(demoData),
    ...data,
    users: data.users || [],
    customers: data.customers || [],
    birdDetails: data.birdDetails || [],
    visits: (data.visits || []).map((visit) => ({ ...visit, time: formatTime(visit.time) })),
    followups: data.followups || [],
    sales: (data.sales || []).map((sale) => ({ ...sale, items: sale.items || [] })),
    complaints: (data.complaints || []).map(normalizeComplaintRecord),
    auditLogs: data.auditLogs || []
  };
}

function stateForBackend() {
  return {
    ...state,
    visits: (state.visits || []).map((visit) => ({ ...visit, time: formatTime(visit.time) })),
    complaints: (state.complaints || []).map(complaintForBackend)
  };
}

function normalizeComplaintRecord(complaint) {
  const evidenceItems = evidenceItemsFromRecord(complaint);
  return {
    ...complaint,
    evidenceItems,
    evidenceName: evidenceItems.map((item) => item.name).filter(Boolean).join(", "),
    evidenceData: JSON.stringify(evidenceItems)
  };
}

function complaintForBackend(complaint) {
  const evidenceItems = evidenceItemsFromRecord(complaint);
  const clean = { ...complaint };
  delete clean.evidenceItems;
  clean.evidenceName = evidenceItems.map((item) => item.name).filter(Boolean).join(", ");
  clean.evidenceData = JSON.stringify(evidenceItems);
  return clean;
}

function queueBackendSave() {
  if (backendSync.suppressSave) return;
  markPendingSync();
  if (!canSyncNow()) {
    updateSyncButton();
    return;
  }
  clearTimeout(backendSync.saveTimer);
  backendSync.saveTimer = setTimeout(() => {
    pushBackendState({ silent: true, loadingMessage: "Saving record to Google Sheets." });
  }, 650);
  updateSyncButton();
}

async function pushBackendState(options = {}) {
  if (!backendIsConfigured()) {
    markPendingSync();
    if (!options.silent) toast("Backend URL is missing from config.js");
    return false;
  }
  if (!authSession?.token) {
    markPendingSync();
    if (!options.silent) toast("Login required before saving to Google Sheets");
    return false;
  }
  if (navigator.onLine === false) {
    markPendingSync();
    if (!options.silent) toast("Offline. Changes will sync when connected.");
    updateSyncButton();
    return false;
  }

  backendSync.saving = true;
  backendSync.lastError = "";
  if (!options.silent || options.loadingMessage) showLoading("Saving", options.loadingMessage || "Saving changes to Google Sheets.");
  updateSyncButton();
  try {
    const payload = await postBackend("saveAll", { token: authSession.token, data: stateForBackend() });
    if (!payload.ok) throw new Error(payload.error || "Backend save failed");
    if (payload.data) {
      backendSync.suppressSave = true;
      state = normalizeBackendState(payload.data);
      state.currentUser = authSession.user.name;
      saveOfflineCache();
      backendSync.suppressSave = false;
    }
    clearPendingSync();
    backendSync.lastSavedAt = formatTime(new Date());
    if (!options.silent) toast("Saved to Google Sheets");
    return true;
  } catch (error) {
    markPendingSync();
    backendSync.lastError = error.message || "Backend save failed";
    if (!options.silent) toast("Could not save to Google Sheets");
    return false;
  } finally {
    backendSync.saving = false;
    if (!options.silent || options.loadingMessage) hideLoading();
    updateSyncButton();
  }
}

async function syncPendingChanges() {
  if (!hasPendingSync() || !canSyncNow() || backendSync.loading || backendSync.saving) {
    updateSyncButton();
    return false;
  }
  return pushBackendState({ silent: true });
}

async function postBackend(action, body = {}) {
  const response = await fetch(backendUrl(), {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...body })
  });
  return response.json();
}

function openBackendSettingsModal() {
  if (!isSalesAdmin()) {
    toast("Backend settings are for Sales Admin only");
    return;
  }
  openModal("Google Sheets Backend", `
    <div class="form-grid">
      <div class="fact full">
        <span>Configured Web App URL</span>
        <strong>${backendUrl() || "Not set in config.js"}</strong>
      </div>
      <div class="fact">
        <span>Current Mode</span>
        <strong>${backendIsConfigured() ? "Live Google Sheets sync" : "Backend not configured"}</strong>
      </div>
      <div class="fact">
        <span>Status</span>
        <strong>${backendSync.lastError || backendStatusText()}</strong>
      </div>
      <div class="fact">
        <span>Offline Queue</span>
        <strong>${hasPendingSync() ? "Pending changes" : "Clear"}</strong>
      </div>
      <div class="fact">
        <span>Last Saved</span>
        <strong>${backendSync.lastSavedAt || "Not yet"}</strong>
      </div>
      <p class="form-note full">The live backend URL is set globally in config.js before deployment. Users only log in; they do not configure a backend in their browser.</p>
    </div>
  `, {
    size: "small",
    footer: `
      <button class="btn" data-action="pull-backend"><i data-lucide="cloud-download"></i>Pull</button>
      <button class="btn" data-action="push-backend"><i data-lucide="cloud-upload"></i>Push</button>
      <button class="btn primary" data-action="close-modal">Done</button>
    `
  });
}

function currentUserProfile() {
  if (authSession?.user) return authSession.user;
  const userId = roleProfiles[ui.role] || roleProfiles.canvasser;
  return state.users.find((user) => user.id === userId) || state.users[0];
}

function currentUserName() {
  return currentUserProfile()?.name || state.currentUser;
}

function currentRoleLabel() {
  return currentUserProfile()?.role || "Canvasser";
}

function isSalesAdmin() {
  return roleKeyForUser(currentRoleLabel()) === "admin";
}

function areaManagers() {
  return state.users.filter((user) => user.role === "Area Manager");
}

function canvassers() {
  return state.users.filter((user) => user.role === "Canvasser");
}

function userIdByName(name) {
  return state.users.find((user) => user.name === name)?.id || "";
}

function userName(id) {
  return state.users.find((user) => user.id === id)?.name || "Unassigned";
}

function customerOwnerId(customer) {
  return customer?.ownerId || userIdByName(customer?.createdBy) || currentUserProfile()?.id || roleProfiles.canvasser;
}

function managerForCanvasser(canvasserId) {
  return state.users.find((user) => user.id === canvasserId)?.managerId || "";
}

function selectedRegionManagerId() {
  if (ui.role === "manager") return currentUserProfile().id;
  if (ui.role === "admin" && ui.regionFilter !== "all") return ui.regionFilter;
  return "";
}

function visibleCanvasserIds() {
  const user = currentUserProfile();
  let ids = [];
  if (ui.role === "admin") {
    ids = canvassers().map((canvasser) => canvasser.id);
  } else if (ui.role === "manager") {
    ids = canvassers().filter((canvasser) => canvasser.managerId === user.id).map((canvasser) => canvasser.id);
  } else {
    ids = [user.id];
  }

  const regionManagerId = selectedRegionManagerId();
  if (regionManagerId) ids = ids.filter((id) => managerForCanvasser(id) === regionManagerId);
  if ((ui.role === "manager" || ui.role === "admin") && ui.canvasserFilter !== "all") {
    ids = ids.filter((id) => id === ui.canvasserFilter);
  }
  return ids;
}

function assignableCanvassers() {
  if (ui.role === "canvasser") return canvassers().filter((canvasser) => canvasser.id === currentUserProfile().id);
  const regionManagerId = selectedRegionManagerId();
  return canvassers().filter((canvasser) => {
    const roleMatch = ui.role === "admin" || canvasser.managerId === currentUserProfile().id;
    const regionMatch = !regionManagerId || canvasser.managerId === regionManagerId;
    return roleMatch && regionMatch;
  });
}

function canAccessCustomer(customer) {
  if (!customer) return false;
  return visibleCanvasserIds().includes(customerOwnerId(customer));
}

function scopedCustomers() {
  return state.customers.filter(canAccessCustomer);
}

function scopedCustomerIds() {
  return new Set(scopedCustomers().map((customer) => customer.id));
}

function scopedVisits() {
  const customerIds = scopedCustomerIds();
  const visibleUsers = new Set(visibleCanvasserIds());
  return state.visits.filter((visit) => customerIds.has(visit.customerId) || visibleUsers.has(userIdByName(visit.createdBy)));
}

function scopedFollowups() {
  const customerIds = scopedCustomerIds();
  return state.followups.filter((followup) => customerIds.has(followup.customerId));
}

function scopedSales() {
  const customerIds = scopedCustomerIds();
  const visibleUsers = new Set(visibleCanvasserIds());
  return state.sales.filter((sale) => customerIds.has(sale.customerId) || visibleUsers.has(userIdByName(sale.createdBy)));
}

function scopedComplaints() {
  const customerIds = scopedCustomerIds();
  return state.complaints.filter((complaint) => customerIds.has(complaint.customerId));
}

function scopedData() {
  return {
    customers: scopedCustomers(),
    visits: scopedVisits(),
    followups: scopedFollowups(),
    sales: scopedSales(),
    complaints: scopedComplaints()
  };
}

function canDeleteBusinessRecords() {
  return isSalesAdmin();
}

function defaultCustomerId() {
  return scopedCustomers()[0]?.id || state.customers[0]?.id || "";
}

function render() {
  syncChrome();
  const views = {
    dashboard: renderDashboard,
    customers: renderCustomers,
    visits: renderVisits,
    followups: renderFollowups,
    sales: renderSales,
    complaints: renderComplaints,
    users: renderUsers,
    reports: renderReports
  };
  if (ui.view === "users" && !isSalesAdmin()) ui.view = "dashboard";
  state.currentUser = currentUserName();
  const accessBar = ui.view === "users" ? "" : renderAccessBar();
  els.main.innerHTML = `${accessBar}${(views[ui.view] || renderDashboard)()}`;
  refreshIcons();
  updateSyncButton();
}

function renderAccessBar() {
  const data = scopedData();
  const user = currentUserProfile();
  const team = assignableCanvassers();
  const teamNames = team.map((canvasser) => canvasser.name).join(", ");
  const selectedRegion = selectedRegionManagerId() ? areaManagers().find((manager) => manager.id === selectedRegionManagerId())?.territory : "All regions";
  const selectedCanvasser = ui.canvasserFilter === "all" ? "All canvassers" : canvassers().find((canvasser) => canvasser.id === ui.canvasserFilter)?.name || "All canvassers";
  const scopeText = ui.role === "admin"
    ? `Can view ${selectedRegion}; filtered to ${selectedCanvasser}.`
    : ui.role === "manager"
      ? ui.canvasserFilter === "all"
        ? `Can view this region's canvassers: ${teamNames || "No canvassers assigned"}.`
        : `Can view this region; filtered to ${selectedCanvasser}.`
      : "Can view only customers and activity assigned to this canvasser.";

  return `
    <section class="access-bar">
      <div class="access-copy">
        <strong>${user.name}</strong>
        <span>${currentRoleLabel()} - ${user.territory}</span>
        <small>${scopeText}</small>
      </div>
      <div class="access-counts">
        <span>${data.customers.length} customers</span>
        <span>${data.visits.length} visits</span>
        <span>${money(data.sales.reduce((sum, sale) => sum + saleTotal(sale), 0))} sales</span>
      </div>
      ${renderScopeFilters()}
      ${isSalesAdmin() ? `<button class="btn subtle access-backend" data-action="open-backend-settings"><i data-lucide="database"></i>${backendStatusText()}</button>` : ""}
    </section>
  `;
}

function renderScopeFilters() {
  if (ui.role === "canvasser") return "";
  const regionOptions = areaManagers().map((manager) => ({
    value: manager.id,
    label: `${manager.territory} - ${manager.name}`
  }));
  const canvasserOptions = assignableCanvassers().map((canvasser) => ({
    value: canvasser.id,
    label: `${canvasser.name} - ${canvasser.territory}`
  }));

  return `
    <div class="scope-filters">
      ${ui.role === "admin" ? `
        <label>
          Region
          ${optionSelect("regionScopeFilter", regionOptions, ui.regionFilter, "All regions", "data-scope-filter")}
        </label>
      ` : ""}
      <label>
        Canvasser
        ${optionSelect("canvasserScopeFilter", canvasserOptions, ui.canvasserFilter, ui.role === "manager" ? "All canvassers in region" : "All canvassers", "data-scope-filter")}
      </label>
    </div>
  `;
}

function syncChrome() {
  document.querySelectorAll(".topbar .role-switch").forEach((switcher) => {
    switcher.classList.add("is-hidden");
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === ui.view);
  });
  document.querySelectorAll(".admin-only").forEach((node) => {
    node.classList.toggle("is-hidden", !isSalesAdmin());
  });
  document.querySelectorAll("[data-role]").forEach((button) => {
    button.classList.toggle("active", button.dataset.role === ui.role);
  });
  document.body.classList.toggle("nav-open", ui.sidebarOpen);
}

function handleClick(event) {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    if (viewButton.dataset.view === "users" && !isSalesAdmin()) {
      toast("User administration is for Sales Admin only");
      return;
    }
    ui.view = viewButton.dataset.view;
    ui.sidebarOpen = false;
    render();
    return;
  }

  const roleButton = event.target.closest("[data-role]");
  if (roleButton) {
    toast("Role is controlled by the logged-in account");
    return;
  }

  if (event.target.closest("#menuButton")) {
    ui.sidebarOpen = !ui.sidebarOpen;
    syncChrome();
    return;
  }

  if (event.target.closest("#logoutButton")) {
    ui.signedIn = false;
    saveSession(null);
    els.appShell.classList.add("is-hidden");
    els.loginScreen.classList.remove("is-hidden");
    return;
  }

  if (event.target.closest("#syncButton")) {
    openBackendSettingsModal();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  event.preventDefault();
  event.stopPropagation();
  runAction(action.dataset.action, action.dataset);
}

function handleInput(event) {
  if (event.target.matches("[data-customer-filter]")) {
    ui.customerFilter = event.target.value.trim().toLowerCase();
    updateCustomerTable();
  }
  if (event.target.matches("[data-autototal]")) {
    updateSaleTotalPreview();
  }
}

function handleChange(event) {
  if (event.target.matches("[data-evidence-input]")) {
    updateEvidencePreview(event.target);
    return;
  }
  if (event.target.matches("[data-scope-filter]")) {
    if (event.target.id === "regionScopeFilter") {
      ui.regionFilter = event.target.value;
      ui.canvasserFilter = "all";
    }
    if (event.target.id === "canvasserScopeFilter") {
      ui.canvasserFilter = event.target.value;
    }
    closeModal();
    render();
    return;
  }
  if (event.target.matches("[data-customer-filter-select]")) {
    updateCustomerTable();
  }
  if (event.target.matches("[data-autototal]")) {
    updateSaleTotalPreview();
  }
}

function runAction(action, data) {
  const id = data.id || "";
  const customerId = data.customer || "";
  const collection = data.collection || "";
  switch (action) {
    case "open-customer":
      openCustomerModal(id);
      break;
    case "new-customer":
      openCustomerModal();
      break;
    case "save-customer":
      saveCustomer();
      break;
    case "open-bird":
      openBirdModal(id, customerId);
      break;
    case "new-bird":
      openBirdModal("", customerId);
      break;
    case "save-bird":
      saveBird();
      break;
    case "delete-bird":
      deleteRecord("birdDetails", id);
      closeModal();
      openCustomerModal(customerId);
      break;
    case "open-visit":
      openVisitModal(id, customerId);
      break;
    case "new-visit":
      openVisitModal("", customerId);
      break;
    case "save-visit":
      saveVisit();
      break;
    case "open-followup":
      openFollowupModal(id, customerId);
      break;
    case "new-followup":
      openFollowupModal("", customerId);
      break;
    case "save-followup":
      saveFollowup();
      break;
    case "open-sale":
      openSaleModal(id, customerId);
      break;
    case "new-sale":
      openSaleModal("", customerId);
      break;
    case "save-sale":
      saveSale();
      break;
    case "delete-sale":
      deleteBusinessRecord("sales", id);
      closeModal();
      render();
      break;
    case "delete-record":
      deleteBusinessRecord(collection, id);
      closeModal();
      render();
      break;
    case "void-record":
      voidBusinessRecord(collection, id);
      closeModal();
      render();
      break;
    case "open-complaint":
      openComplaintModal(id, customerId);
      break;
    case "open-user":
      openUserModal(id);
      break;
    case "new-user":
      openUserModal();
      break;
    case "save-user":
      saveUserAccount();
      break;
    case "toggle-user-status":
      toggleUserStatus(id);
      break;
    case "delete-user":
      deleteUserAccount(id);
      break;
    case "new-complaint":
      openComplaintModal("", customerId);
      break;
    case "save-complaint":
      saveComplaint();
      break;
    case "capture-gps":
      captureGps(data.prefix || "");
      break;
    case "remove-evidence":
      removeEvidencePreview(data.evidenceId || "");
      break;
    case "close-modal":
      closeModal();
      break;
    case "open-backend-settings":
      openBackendSettingsModal();
      break;
    case "pull-backend":
      pullBackendState().then(() => {
        closeModal();
        render();
      });
      break;
    case "push-backend":
      pushBackendState().then(() => {
        closeModal();
        render();
      });
      break;
    case "export-csv":
      exportReportCsv();
      break;
    case "print-report":
      window.print();
      break;
    case "customer-tab":
      switchCustomerTab(data.tab);
      break;
    default:
      toast("Action wired for prototype");
  }
}

function renderDashboard() {
  const data = scopedData();
  const metrics = getMetrics(data);
  const todayVisits = data.visits.filter((visit) => visit.date === today());
  const urgentFollowups = data.followups
    .filter((followup) => followup.status !== "Completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return `
    <section class="dashboard-hero">
      <div>
        <h1>${ui.role === "admin" ? "Back Office Sales Monitor" : ui.role === "manager" ? "Area Team Sales Monitor" : `Today with ${currentUserName()}`}</h1>
        <p>${ui.role === "canvasser" ? "Customer visits, action points, sales, and issue tracking for field work." : "Customers, visits, sales, follow-ups, and complaints inside the current access scope."}</p>
      </div>
    </section>

    <section class="metric-grid">
      ${metric("users", metrics.customers, "Total Customers")}
      ${metric("user-plus", metrics.newThisMonth, "New This Month")}
      ${metric("clipboard-check", metrics.visitsToday, "Visits Today")}
      ${metric("calendar-clock", metrics.pendingFollowups, "Pending Follow-ups")}
      ${metric("receipt", money(metrics.salesToday), "Sales Today")}
      ${metric("message-square-warning", metrics.openComplaints, "Open Complaints")}
    </section>

    <section class="quick-grid">
      <button class="btn primary" data-action="new-customer"><i data-lucide="user-plus"></i>Add Customer</button>
      <button class="btn" data-action="new-visit"><i data-lucide="map-pin"></i>Start Visit</button>
      <button class="btn" data-view="followups"><i data-lucide="calendar-check"></i>Follow-ups</button>
      <button class="btn" data-action="new-sale"><i data-lucide="receipt"></i>Record Sale</button>
      <button class="btn" data-action="new-complaint"><i data-lucide="message-square-warning"></i>Complaint</button>
    </section>

    <section class="content-grid">
      <div class="panel">
        <div class="panel-head">
          <h2>${todayVisits.length ? "Visits Completed Today" : "Upcoming Field Actions"}</h2>
          <button class="btn subtle" data-view="visits"><i data-lucide="arrow-right"></i>Visits</button>
        </div>
        ${todayVisits.length ? compactVisitTable(todayVisits) : compactFollowupTable(urgentFollowups)}
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>High Attention Customers</h2>
          <button class="btn subtle" data-view="customers"><i data-lucide="arrow-right"></i>Customers</button>
        </div>
        <div class="panel-body">
          <div class="chart-list">
            ${data.customers.slice(0, 5).map((customer) => {
              const score = attentionScore(customer);
              return `
                <button class="chart-row table-action wide-row" data-action="open-customer" data-id="${customer.id}">
                  <span class="truncate strong">${customer.farmName}</span>
                  <span class="chart-track">${chartFill(score, "attention")}</span>
                  <span class="muted">${score}%</span>
                </button>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCustomers() {
  const data = scopedData();
  return `
    <section class="page-head">
      <div>
        <h1>Customers</h1>
        <p>Compact customer records with farm details, GPS tags, visits, sales, complaints, and follow-ups.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" data-action="new-customer"><i data-lucide="user-plus"></i>Add Customer</button>
      </div>
    </section>

    <section class="toolbar">
      <input data-customer-filter type="search" placeholder="Name or phone" value="${escapeAttr(ui.customerFilter)}" />
      ${select("locationFilter", unique(data.customers.map((c) => c.town)), "", "All locations", "data-customer-filter-select")}
      ${select("birdFilter", lists.farmTypes, "", "All bird types", "data-customer-filter-select")}
      ${select("statusFilter", lists.categories, "", "All statuses", "data-customer-filter-select")}
      <input data-customer-filter-select id="lastVisitFilter" type="date" title="Last visit after" />
    </section>

    <section class="panel">
      <div id="customerTableSlot">${customerTable(getFilteredCustomers())}</div>
    </section>
  `;
}

function renderVisits() {
  const visits = filterByGlobal(scopedVisits(), (visit) => `${customerName(visit.customerId)} ${visit.type} ${visit.personMet} ${visit.summary}`);
  return `
    <section class="page-head">
      <div>
        <h1>Visits</h1>
        <p>Field notes, GPS visit location, farm observations, next steps, and visit history.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" data-action="new-visit"><i data-lucide="clipboard-plus"></i>Start Visit</button>
      </div>
    </section>
    <section class="panel">${compactVisitTable(visits)}</section>
  `;
}

function renderFollowups() {
  const rows = filterByGlobal(scopedFollowups(), (followup) => `${customerName(followup.customerId)} ${followup.action} ${followup.responsible} ${followup.status}`);
  return `
    <section class="page-head">
      <div>
        <h1>Follow-ups</h1>
        <p>Pending and overdue action points from customer visits.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" data-action="new-followup"><i data-lucide="calendar-plus"></i>Add Follow-up</button>
      </div>
    </section>
    <section class="panel">${compactFollowupTable(rows)}</section>
  `;
}

function renderSales() {
  const rows = filterByGlobal(scopedSales(), (sale) => `${customerName(sale.customerId)} ${sale.invoice} ${sale.paymentStatus} ${sale.items.map((item) => item.product).join(" ")}`);
  return `
    <section class="page-head">
      <div>
        <h1>Sales</h1>
        <p>Product line items, quantity, unit price, total value, payment, delivery, and invoice notes.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" data-action="new-sale"><i data-lucide="receipt"></i>Record Sale</button>
      </div>
    </section>
    <section class="panel">${compactSalesTable(rows)}</section>
  `;
}

function renderComplaints() {
  const rows = filterByGlobal(scopedComplaints(), (complaint) => `${customerName(complaint.customerId)} ${complaint.category} ${complaint.product} ${complaint.status}`);
  return `
    <section class="page-head">
      <div>
        <h1>Complaints</h1>
        <p>Customer complaints, severity, product involved, immediate action, assignment, and resolution notes.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" data-action="new-complaint"><i data-lucide="message-square-plus"></i>Record Complaint</button>
      </div>
    </section>
    <section class="panel">${compactComplaintTable(rows)}</section>
  `;
}

function renderReports() {
  const data = scopedData();
  const byEmployee = groupTotals(data.sales, (sale) => sale.createdBy || "Unassigned");
  const byProduct = {};
  data.sales.forEach((sale) => sale.items.forEach((item) => {
    byProduct[item.product] = (byProduct[item.product] || 0) + item.quantity * item.unitPrice;
  }));
  const visitsByEmployee = countBy(data.visits, (visit) => visit.createdBy || "Unassigned");
  const complaintsByStatus = countBy(data.complaints, (complaint) => complaint.status);

  return `
    <section class="page-head">
      <div>
        <h1>${ui.role === "canvasser" ? "My Reports" : "Management Reports"}</h1>
        <p>Employee, customer, product, location, complaint, sales value, and follow-up summaries.</p>
      </div>
      <div class="page-actions">
        <button class="btn" data-action="export-csv"><i data-lucide="file-spreadsheet"></i>Excel CSV</button>
        <button class="btn" data-action="print-report"><i data-lucide="file-down"></i>PDF</button>
      </div>
    </section>

    <section class="metric-grid">
      ${metric("user-round-check", assignableCanvassers().length, "Canvassers")}
      ${metric("map", unique(data.customers.map((c) => c.town)).length, "Locations")}
      ${metric("banknote", money(totalSales(data.sales)), "Sales Value")}
      ${metric("boxes", totalQuantity(data.sales), "Bags / Units")}
      ${metric("calendar-x", overdueFollowups(data.followups).length, "Overdue")}
      ${metric("shield-alert", data.complaints.filter((c) => c.status !== "Closed" && c.status !== "Resolved").length, "Unresolved")}
    </section>

    <section class="report-grid">
      ${reportPanel("Sales Value by Employee", currencyChart(byEmployee))}
      ${reportPanel("Sales by Product", currencyChart(byProduct))}
      ${reportPanel("Visits by Employee", countChart(visitsByEmployee))}
      ${reportPanel("Complaint Status", countChart(complaintsByStatus))}
      ${reportPanel("Customer Location Map", `<div class="map-preview">${data.customers.length} tagged customers across ${unique(data.customers.map((c) => c.town)).join(", ")}</div>`)}
      ${reportPanel("Follow-up Monitor", compactFollowupTable(data.followups.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5)))}
    </section>
  `;
}

function renderUsers() {
  if (!isSalesAdmin()) return emptyState("shield-alert", "User administration is for Sales Admin only.");
  const users = filterByGlobal(state.users, (user) => `${user.name} ${user.email} ${user.username} ${user.role} ${user.territory} ${user.status}`);
  return `
    <section class="page-head">
      <div>
        <h1>Users & Access</h1>
        <p>Create accounts, assign roles, connect canvassers to managers, and activate or deactivate access.</p>
      </div>
      <div class="page-actions">
        <button class="btn primary" data-action="new-user"><i data-lucide="user-plus"></i>Add User</button>
      </div>
    </section>

    <section class="metric-grid">
      ${metric("users", state.users.length, "Total Users")}
      ${metric("user-check", state.users.filter((user) => user.status !== "Inactive").length, "Active")}
      ${metric("user-x", state.users.filter((user) => user.status === "Inactive").length, "Inactive")}
      ${metric("map-pinned", canvassers().length, "Canvassers")}
      ${metric("shield-check", areaManagers().length, "Area Managers")}
      ${metric("settings", state.users.filter((user) => roleKeyForUser(user.role) === "admin").length, "Sales Admins")}
    </section>

    <section class="panel">${userTable(users)}</section>
  `;
}

function metric(icon, value, label) {
  return `
    <div class="metric-card">
      <span class="metric-icon"><i data-lucide="${icon}"></i></span>
      <div>
        <strong>${value}</strong>
        <span>${label}</span>
      </div>
    </div>
  `;
}

function reportPanel(title, body) {
  return `
    <div class="panel">
      <div class="panel-head"><h2>${title}</h2></div>
      <div class="panel-body">${body}</div>
    </div>
  `;
}

function customerTable(rows) {
  if (!rows.length) return emptyState("users", "No customers match the current filters.");
  return `
    <div class="customer-list">
      ${lineItemHeader(["Customer", "Location / Farm", "Activity"])}
      ${rows.map((customer) => {
        const lastVisit = lastVisitDate(customer.id) || "No visit";
        const openComplaints = state.complaints.filter((complaint) => complaint.customerId === customer.id && !["Closed", "Resolved"].includes(complaint.status)).length;
        const pendingFollowups = state.followups.filter((followup) => followup.customerId === customer.id && followup.status !== "Completed").length;
        return `
          <button type="button" class="customer-row" data-action="open-customer" data-id="${customer.id}" aria-label="Open ${escapeAttr(customer.farmName)}">
            <span class="customer-main">
              <span class="customer-title">
                <strong class="truncate">${customer.farmName}</strong>
                ${recordStatusBadge(customer, statusBadge(customer.category))}
              </span>
              <span class="customer-subline truncate">${customer.contact} - ${customer.phone}</span>
            </span>
            <span class="customer-meta">
              <span class="truncate"><i data-lucide="map-pin"></i>${customer.town || "No town"}, ${customer.state || "No state"} - ${customer.birdType} - ${formatNumber(customer.capacity)} birds</span>
            </span>
            <span class="customer-side">
              <small>Last: ${lastVisit}</small>
              <span class="customer-badges">
                ${pendingFollowups ? `<span class="badge pending">${pendingFollowups} follow-up</span>` : ""}
                ${openComplaints ? `<span class="badge open">${openComplaints} complaint</span>` : ""}
              </span>
            </span>
            <i class="customer-chevron" data-lucide="chevron-right"></i>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function compactVisitTable(rows) {
  if (!rows.length) return emptyState("clipboard-list", "No visit records yet.");
  return `
    <div class="customer-list">
      ${lineItemHeader(["Customer / Visit", "Date / Next Step", "Follow-up"])}
      ${rows.map((visit) => `
        <button type="button" class="customer-row" data-action="open-visit" data-id="${visit.id}" data-customer="${visit.customerId}" aria-label="Open visit for ${escapeAttr(customerName(visit.customerId))}">
          <span class="customer-main">
              <span class="customer-title">
                <strong class="truncate">${customerName(visit.customerId)}</strong>
                ${recordStatusBadge(visit, statusBadge(visit.type))}
            </span>
            <span class="customer-subline truncate">${visit.personMet || "Person not recorded"} - ${visit.summary || visit.purpose || "No summary"}</span>
          </span>
          <span class="customer-meta">
            <span class="truncate"><i data-lucide="calendar-days"></i>${visit.date} ${formatTime(visit.time) || ""} - ${visit.nextStep || "No next action"}</span>
          </span>
          <span class="customer-side">
            <small>Follow-up: ${visit.followupDate || "None"}</small>
            <span class="customer-badges">${followupStatus(visit.followupDate)}</span>
          </span>
          <i class="customer-chevron" data-lucide="chevron-right"></i>
        </button>
      `).join("")}
    </div>
  `;
}

function compactFollowupTable(rows) {
  if (!rows.length) return emptyState("calendar-check", "No action points yet.");
  return `
    <div class="customer-list">
      ${lineItemHeader(["Customer / Action", "Due / Owner", "Status"])}
      ${rows.map((followup) => `
        <button type="button" class="customer-row" data-action="open-followup" data-id="${followup.id}" data-customer="${followup.customerId}" aria-label="Open follow-up for ${escapeAttr(customerName(followup.customerId))}">
          <span class="customer-main">
              <span class="customer-title">
                <strong class="truncate">${customerName(followup.customerId)}</strong>
                ${recordStatusBadge(followup, priorityBadge(followup.priority))}
            </span>
            <span class="customer-subline truncate">${followup.action || "No action point"}</span>
          </span>
          <span class="customer-meta">
            <span class="truncate"><i data-lucide="calendar-clock"></i>Due ${followup.dueDate} - ${followup.responsible || "Unassigned"}</span>
          </span>
          <span class="customer-side">
            <small>${isOverdue(followup) ? "Overdue" : "Status"}</small>
            <span class="customer-badges">${statusBadge(followup.status, isOverdue(followup) ? "overdue" : "")}</span>
          </span>
          <i class="customer-chevron" data-lucide="chevron-right"></i>
        </button>
      `).join("")}
    </div>
  `;
}

function compactSalesTable(rows) {
  if (!rows.length) return emptyState("receipt", "No sales records yet.");
  return `
    <div class="customer-list">
      ${lineItemHeader(["Customer / Items", "Value / Invoice", "Delivery"])}
      ${rows.map((sale) => {
        const products = sale.items.map((item) => item.product).join(", ");
        const quantity = sale.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        return `
          <button type="button" class="customer-row" data-action="open-sale" data-id="${sale.id}" data-customer="${sale.customerId}" aria-label="Open sale for ${escapeAttr(customerName(sale.customerId))}">
            <span class="customer-main">
              <span class="customer-title">
                <strong class="truncate">${customerName(sale.customerId)}</strong>
                ${recordStatusBadge(sale, statusBadge(sale.paymentStatus))}
              </span>
              <span class="customer-subline truncate">${products || "No products"} - ${formatNumber(quantity)} ${quantity === 1 ? "unit" : "units"}</span>
            </span>
            <span class="customer-meta">
              <span class="truncate"><i data-lucide="receipt"></i>${sale.date} - ${money(saleTotal(sale))}${sale.invoice ? ` - ${sale.invoice}` : ""}</span>
            </span>
            <span class="customer-side">
              <small>Delivery</small>
              <span class="customer-badges">${statusBadge(sale.deliveryStatus)}</span>
            </span>
            <i class="customer-chevron" data-lucide="chevron-right"></i>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function compactComplaintTable(rows) {
  if (!rows.length) return emptyState("message-square-warning", "No complaints recorded.");
  return `
    <div class="customer-list">
      ${lineItemHeader(["Customer / Complaint", "Date / Details", "Status"])}
      ${rows.map((complaint) => `
        <button type="button" class="customer-row" data-action="open-complaint" data-id="${complaint.id}" data-customer="${complaint.customerId}" aria-label="Open complaint for ${escapeAttr(customerName(complaint.customerId))}">
          <span class="customer-main">
              <span class="customer-title">
                <strong class="truncate">${customerName(complaint.customerId)}</strong>
              ${recordStatusBadge(complaint, severityBadge(complaint.severity))}
            </span>
            <span class="customer-subline truncate">${complaint.category} - ${complaint.product || "No product"}</span>
          </span>
          <span class="customer-meta">
            <span class="truncate"><i data-lucide="message-square-warning"></i>${complaint.date} - ${complaint.description || "No description"}</span>
          </span>
          <span class="customer-side">
            <small>${complaint.assignedTo || "Unassigned"}</small>
            <span class="customer-badges">
              ${hasEvidence(complaint) ? statusBadge(`${evidenceItemsFromRecord(complaint).length} file${evidenceItemsFromRecord(complaint).length === 1 ? "" : "s"}`, "active") : ""}
              ${statusBadge(complaint.status)}
            </span>
          </span>
          <i class="customer-chevron" data-lucide="chevron-right"></i>
        </button>
      `).join("")}
    </div>
  `;
}

function userTable(rows) {
  if (!rows.length) return emptyState("users", "No users match the current filters.");
  return `
    <div class="customer-list">
      ${lineItemHeader(["User / Account", "Role / Region", "Status"])}
      ${rows.map((user) => `
        <button type="button" class="customer-row" data-action="open-user" data-id="${user.id}" aria-label="Open user ${escapeAttr(user.name)}">
          <span class="customer-main">
            <span class="customer-title">
              <strong class="truncate">${user.name}</strong>
              ${statusBadge(user.role)}
            </span>
            <span class="customer-subline truncate">${user.username || "No username"} - ${user.email || "No email"}</span>
          </span>
          <span class="customer-meta">
            <span class="truncate"><i data-lucide="map-pin"></i>${user.territory || "No region"}${user.managerId ? ` - Manager: ${userName(user.managerId)}` : ""}</span>
          </span>
          <span class="customer-side">
            <small>${user.id === currentUserProfile()?.id ? "Current account" : "Account"}</small>
            <span class="customer-badges">${statusBadge(user.status || "Active")}</span>
          </span>
          <i class="customer-chevron" data-lucide="chevron-right"></i>
        </button>
      `).join("")}
    </div>
  `;
}

function lineItemHeader(labels) {
  return `
    <div class="customer-list-header" aria-hidden="true">
      ${labels.map((label) => `<span>${label}</span>`).join("")}
      <span></span>
    </div>
  `;
}

function isVoided(record) {
  const value = String(record?.voided || "").trim().toLowerCase();
  return value === "yes" || value === "true" || value === "voided";
}

function recordStatusBadge(record, fallback) {
  return isVoided(record) ? statusBadge("Voided", "voided") : fallback;
}

function hasEvidence(record) {
  return evidenceItemsFromRecord(record).length > 0;
}

function evidenceItemsFromRecord(record) {
  if (!record) return [];
  if (Array.isArray(record.evidenceItems)) return record.evidenceItems.filter(Boolean);
  const evidenceData = String(record.evidenceData || "").trim();
  if (!evidenceData) return [];
  try {
    const parsed = JSON.parse(evidenceData);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Fall through for legacy single-file data URL evidence.
  }
  if (evidenceData.startsWith("data:")) {
    const mimeType = evidenceData.match(/^data:([^;]+);base64,/)?.[1] || "image/jpeg";
    return [{
      id: makeEvidenceId(),
      name: record.evidenceName || "Complaint evidence",
      type: mimeType.startsWith("video/") ? "video" : "image",
      mimeType,
      dataUrl: evidenceData,
      addedAt: today()
    }];
  }
  return [];
}

function voidNotice(record) {
  if (!isVoided(record)) return "";
  return `
    <div class="void-notice">
      <strong>Voided record</strong>
      <span>${record.voidedBy || "Unknown user"}${record.voidedAt ? ` on ${record.voidedAt}` : ""}</span>
    </div>
  `;
}

function recordActionButton(collection, id, customerId = "") {
  if (!id) return "";
  const label = collectionLabel(collection);
  if (canDeleteBusinessRecords()) {
    return `<button class="btn danger" data-action="delete-record" data-collection="${collection}" data-id="${id}" data-customer="${customerId}"><i data-lucide="trash-2"></i>Delete ${label}</button>`;
  }
  return `<button class="btn warning" data-action="void-record" data-collection="${collection}" data-id="${id}" data-customer="${customerId}"><i data-lucide="ban"></i>Void ${label}</button>`;
}

function collectionLabel(collection) {
  return ({
    customers: "Customer",
    visits: "Visit",
    followups: "Follow-up",
    sales: "Sale",
    complaints: "Complaint"
  })[collection] || "Record";
}

function openCustomerModal(id = "") {
  const isNew = !id;
  const customer = isNew ? blankCustomer() : state.customers.find((item) => item.id === id);
  if (!customer || (!isNew && !canAccessCustomer(customer))) {
    toast("This record is outside the current access scope");
    return;
  }
  const activeTab = "farm";
  openModal(isNew ? "Add Customer" : customer.farmName, customerModalBody(customer, activeTab), {
    size: "wide",
    footer: `
      ${isNew ? "" : `<button class="btn" data-action="new-visit" data-customer="${customer.id}"><i data-lucide="map-pin"></i>Visit</button>`}
      ${isNew ? "" : `<button class="btn" data-action="new-sale" data-customer="${customer.id}"><i data-lucide="receipt"></i>Sale</button>`}
      ${isNew ? "" : `<button class="btn" data-action="new-complaint" data-customer="${customer.id}"><i data-lucide="message-square-plus"></i>Complaint</button>`}
      ${isNew ? "" : recordActionButton("customers", customer.id, customer.id)}
      <button class="btn" data-action="close-modal">Close</button>
      <button class="btn primary" data-action="save-customer"><i data-lucide="save"></i>Save</button>
    `
  });
}

function customerModalBody(customer, tab) {
  return `
    <div class="modal-tabs" data-customer-tabs="${customer.id}">
      ${["farm", "birds", "visits", "sales", "complaints", "followups", "audit"].map((item) => `
        <button data-action="customer-tab" data-tab="${item}" class="${item === tab ? "active" : ""}">${titleCase(item)}</button>
      `).join("")}
    </div>
    <div id="customerTabContent">
      ${customerTabContent(customer, tab)}
    </div>
  `;
}

function customerTabContent(customer, tab) {
  if (tab === "farm") return customerForm(customer);
  if (tab === "birds") {
    const rows = state.birdDetails.filter((bird) => bird.customerId === customer.id);
    return `
      <div class="section-title">
        <h3>Bird Capacity Line Items</h3>
        <button class="btn primary" data-action="new-bird" data-customer="${customer.id}"><i data-lucide="plus"></i>Add Bird Detail</button>
      </div>
      ${birdTable(rows, customer.id)}
    `;
  }
  if (tab === "visits") {
    return `
      <div class="section-title">
        <h3>Visit History</h3>
        <button class="btn primary" data-action="new-visit" data-customer="${customer.id}"><i data-lucide="clipboard-plus"></i>Start Visit</button>
      </div>
      ${compactVisitTable(state.visits.filter((visit) => visit.customerId === customer.id))}
    `;
  }
  if (tab === "sales") {
    return `
      <div class="section-title">
        <h3>Sales History</h3>
        <button class="btn primary" data-action="new-sale" data-customer="${customer.id}"><i data-lucide="receipt"></i>Add Sale</button>
      </div>
      ${compactSalesTable(state.sales.filter((sale) => sale.customerId === customer.id))}
    `;
  }
  if (tab === "complaints") {
    return `
      <div class="section-title">
        <h3>Complaints</h3>
        <button class="btn primary" data-action="new-complaint" data-customer="${customer.id}"><i data-lucide="message-square-plus"></i>Add Complaint</button>
      </div>
      ${compactComplaintTable(state.complaints.filter((complaint) => complaint.customerId === customer.id))}
    `;
  }
  if (tab === "followups") {
    return `
      <div class="section-title">
        <h3>Follow-up Action Points</h3>
        <button class="btn primary" data-action="new-followup" data-customer="${customer.id}"><i data-lucide="calendar-plus"></i>Add Follow-up</button>
      </div>
      ${compactFollowupTable(state.followups.filter((followup) => followup.customerId === customer.id))}
    `;
  }
  return `
    <div class="mini-grid">
      ${fact("Created By", customer.createdBy || "-")}
      ${fact("Created Date", customer.createdAt || "-")}
      ${fact("Last Edited", `${customer.updatedBy || "-"} / ${customer.updatedAt || "-"}`)}
    </div>
    <div class="section-title"><h3>Recent Audit Logs</h3></div>
    ${auditTable(customer.id)}
  `;
}

function switchCustomerTab(tab) {
  const tabs = document.querySelector("[data-customer-tabs]");
  if (!tabs) return;
  const customerId = tabs.dataset.customerTabs;
  const form = document.getElementById("customerForm");
  let customer = state.customers.find((item) => item.id === customerId) || blankCustomer();
  if (form) {
    customer = { ...customer, ...serializeForm(form) };
  }
  tabs.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  document.getElementById("customerTabContent").innerHTML = customerTabContent(customer, tab);
  refreshIcons();
}

function customerForm(customer) {
  return `
    ${voidNotice(customer)}
    <form id="customerForm" data-id="${customer.id || ""}">
      <div class="mini-grid">
        ${fact("Last Visit", lastVisitDate(customer.id) || "None")}
        ${fact("Total Sales Value", money(customerSalesTotal(customer.id)))}
        ${fact("Open Complaints", state.complaints.filter((c) => c.customerId === customer.id && !["Closed", "Resolved"].includes(c.status)).length)}
      </div>
      <div class="section-title"><h3>Customer Basic Details</h3></div>
      <div class="form-grid">
        ${input("farmName", "Customer / Farm Name", customer.farmName, true)}
        ${input("contact", "Contact Person Name", customer.contact, true)}
        ${input("phone", "Phone Number", customer.phone, true)}
        ${input("altPhone", "Alternative Phone Number", customer.altPhone)}
        ${input("email", "Email Address", customer.email, false, "email")}
        ${input("address", "Farm Address", customer.address, true)}
        ${input("state", "State / Region", customer.state)}
        ${input("lga", "Local Government / District", customer.lga)}
        ${input("town", "Town / Village", customer.town)}
        ${selectField("category", "Customer Category", lists.categories, customer.category)}
        ${canvasserSelectField("ownerId", "Assigned Canvasser", customerOwnerId(customer))}
      </div>
      <div class="section-title"><h3>Location Tagging</h3></div>
      <div class="form-grid three">
        ${input("lat", "Latitude", customer.lat, true)}
        ${input("lng", "Longitude", customer.lng, true)}
        ${input("accuracy", `Location Accuracy (${GPS_MAX_ACCURACY_METERS}m or better)`, customer.accuracy, true)}
        <div class="full field-row">
          <button class="btn warning" data-action="capture-gps" data-prefix=""><i data-lucide="locate-fixed"></i>Capture GPS Location</button>
          <button class="btn" data-action="capture-gps" data-prefix=""><i data-lucide="map-pin"></i>Retag Location</button>
        </div>
        <div class="full map-preview">${customer.lat && customer.lng ? `${customer.lat}, ${customer.lng}` : "Location not tagged"}</div>
      </div>
      <div class="section-title"><h3>Farm Details</h3></div>
      <div class="form-grid">
        ${selectField("farmType", "Farm Type", lists.farmTypes, customer.farmType)}
        ${input("birdType", "Type of Birds", customer.birdType)}
        ${input("capacity", "Current Bird Capacity", customer.capacity, false, "number")}
        ${input("stock", "Current Stock Count", customer.stock, false, "number")}
        ${input("pens", "Number of Pens / Houses", customer.pens, false, "number")}
        ${selectField("stage", "Production Stage", lists.stages, customer.stage)}
        ${input("feedConsumption", "Average Feed Consumption", customer.feedConsumption)}
        ${input("feedBrand", "Current Feed Brand Used", customer.feedBrand)}
        ${input("frequency", "Feed Purchase Frequency", customer.frequency)}
        ${input("supplier", "Main Supplier / Competitor Brand", customer.supplier)}
        ${textarea("notes", "Notes", customer.notes, "full")}
      </div>
    </form>
  `;
}

function birdTable(rows, customerId) {
  if (!rows.length) return emptyState("egg", "No bird capacity line items yet.");
  return `
    <table class="data-table">
      <thead><tr><th>Bird Type</th><th>Stage</th><th>Quantity</th><th>Pen No.</th><th>Feed</th><th>Action</th></tr></thead>
      <tbody>
        ${rows.map((bird) => `
          <tr data-action="open-bird" data-id="${bird.id}" data-customer="${customerId}">
            <td data-label="Bird Type">${bird.birdType}</td>
            <td data-label="Stage">${bird.stage}</td>
            <td data-label="Quantity">${formatNumber(bird.quantity)}</td>
            <td data-label="Pen No.">${bird.pen}</td>
            <td data-label="Feed" class="truncate">${bird.feed}</td>
            <td data-label="Action"><button class="table-action" data-action="open-bird" data-id="${bird.id}" data-customer="${customerId}"><i data-lucide="pencil"></i></button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function openBirdModal(id = "", customerId = "") {
  const bird = id ? state.birdDetails.find((item) => item.id === id) : { id: "", customerId, birdType: "Broiler", breed: "", stage: "Starter", quantity: "", pen: "", age: "", mortality: "", feed: "", notes: "" };
  openModal(id ? "Edit Bird Detail" : "Add Bird Detail", `
    <form id="birdForm" data-id="${bird.id || ""}" data-customer="${bird.customerId || customerId}">
      <div class="form-grid">
        ${selectField("birdType", "Bird Type", lists.farmTypes, bird.birdType)}
        ${input("breed", "Breed", bird.breed)}
        ${selectField("stage", "Production Stage", lists.stages, bird.stage)}
        ${input("quantity", "Quantity", bird.quantity, true, "number")}
        ${input("pen", "Pen / House Number", bird.pen)}
        ${input("age", "Age of Birds", bird.age)}
        ${input("mortality", "Mortality Rate", bird.mortality)}
        ${input("feed", "Feed Currently Used", bird.feed)}
        ${textarea("notes", "Notes", bird.notes, "full")}
      </div>
    </form>
  `, {
    footer: `
      ${id ? `<button class="btn danger" data-action="delete-bird" data-id="${id}" data-customer="${bird.customerId}"><i data-lucide="trash-2"></i>Delete</button>` : ""}
      <button class="btn" data-action="close-modal">Close</button>
      <button class="btn primary" data-action="save-bird"><i data-lucide="save"></i>Save</button>
    `
  });
}

function openVisitModal(id = "", customerId = "") {
  const visit = id ? state.visits.find((item) => item.id === id) : blankVisit(customerId);
  if (!visit || !canAccessCustomer(state.customers.find((customer) => customer.id === visit.customerId))) {
    toast("This visit is outside the current access scope");
    return;
  }
  openModal(id ? "Visit Details" : "Start Customer Visit", `
    ${voidNotice(visit)}
    <form id="visitForm" data-id="${visit.id || ""}">
      <div class="form-grid">
        ${customerSelect("customerId", "Customer Name", visit.customerId)}
        ${input("date", "Visit Date", visit.date, true, "date")}
        ${input("time", "Visit Time", formatTime(visit.time), true, "time")}
        <div class="field-row full">
          ${input("gps", "GPS Location at Visit", visit.gps, true)}
          <button class="btn warning" data-action="capture-gps" data-prefix="visit"><i data-lucide="locate-fixed"></i>GPS</button>
        </div>
        ${selectField("type", "Visit Type", lists.visitTypes, visit.type)}
        ${input("personMet", "Person Met", visit.personMet)}
        ${input("purpose", "Purpose of Visit", visit.purpose)}
        ${input("currentFeed", "Current Feed Used", visit.currentFeed)}
        ${input("competitor", "Competitor Activity", visit.competitor)}
        ${selectField("interest", "Customer Interest Level", ["Low", "Medium", "High"], visit.interest)}
        ${input("nextStep", "Next Step / Recommendation", visit.nextStep)}
        ${input("followupDate", "Next Follow-up Date", visit.followupDate, false, "date")}
        ${textarea("summary", "Discussion Summary", visit.summary, "full")}
        ${textarea("observation", "Farm Observation", visit.observation, "full")}
        ${textarea("notes", "Visit Notes", visit.notes, "full")}
      </div>
    </form>
  `, {
    size: "wide",
    footer: `
      ${id ? recordActionButton("visits", visit.id, visit.customerId) : ""}
      <button class="btn" data-action="new-followup" data-customer="${visit.customerId}"><i data-lucide="calendar-plus"></i>Add Follow-up</button>
      <button class="btn" data-action="new-sale" data-customer="${visit.customerId}"><i data-lucide="receipt"></i>Add Sale</button>
      <button class="btn" data-action="new-complaint" data-customer="${visit.customerId}"><i data-lucide="message-square-plus"></i>Add Complaint</button>
      <button class="btn" data-action="close-modal">Close</button>
      <button class="btn primary" data-action="save-visit"><i data-lucide="save"></i>Save</button>
    `
  });
}

function openFollowupModal(id = "", customerId = "") {
  const followup = id ? state.followups.find((item) => item.id === id) : blankFollowup(customerId);
  if (!followup || !canAccessCustomer(state.customers.find((customer) => customer.id === followup.customerId))) {
    toast("This follow-up is outside the current access scope");
    return;
  }
  openModal(id ? "Follow-up Action Point" : "Add Follow-up", `
    ${voidNotice(followup)}
    <form id="followupForm" data-id="${followup.id || ""}">
      <div class="form-grid">
        ${customerSelect("customerId", "Customer Name", followup.customerId)}
        ${visitSelect("visitId", "Related Visit", followup.visitId, followup.customerId)}
        ${textarea("action", "Action Point", followup.action, "full")}
        ${input("responsible", "Responsible Person", followup.responsible)}
        ${selectField("priority", "Priority", lists.priorities, followup.priority)}
        ${input("dueDate", "Due Date", followup.dueDate, true, "date")}
        ${selectField("status", "Status", lists.actionStatus, followup.status)}
        ${input("dateCompleted", "Date Completed", followup.dateCompleted, false, "date")}
        ${textarea("completionNotes", "Completion Notes", followup.completionNotes, "full")}
      </div>
    </form>
  `, {
    footer: `
      ${id ? recordActionButton("followups", followup.id, followup.customerId) : ""}
      <button class="btn" data-action="close-modal">Close</button>
      <button class="btn primary" data-action="save-followup"><i data-lucide="save"></i>Save</button>
    `
  });
}

function openSaleModal(id = "", customerId = "") {
  const sale = id ? state.sales.find((item) => item.id === id) : blankSale(customerId);
  if (!sale || !canAccessCustomer(state.customers.find((customer) => customer.id === sale.customerId))) {
    toast("This sale is outside the current access scope");
    return;
  }
  const item = sale.items[0] || blankSaleItem();
  openModal(id ? "Sale Details" : "Record Sale", `
    ${voidNotice(sale)}
    <form id="saleForm" data-id="${sale.id || ""}" data-item="${item.id || ""}">
      <div class="form-grid">
        ${customerSelect("customerId", "Customer Name", sale.customerId)}
        ${visitSelect("visitId", "Visit Reference", sale.visitId, sale.customerId, true)}
        ${input("date", "Sale Date", sale.date, true, "date")}
        ${input("invoice", "Invoice / Receipt Number", sale.invoice)}
        ${selectField("paymentStatus", "Payment Status", lists.paymentStatus, sale.paymentStatus)}
        ${selectField("deliveryStatus", "Delivery Status", lists.deliveryStatus, sale.deliveryStatus)}
      </div>
      <div class="section-title"><h3>Sales Line Item</h3></div>
      <div class="form-grid three">
        ${selectField("product", "Product Name", lists.products, item.product)}
        ${input("category", "Product Category", item.category || "Feed")}
        ${selectField("feedType", "Feed Type", ["Starter", "Grower", "Finisher", "Layer Mash", "Broiler Feed", "Concentrate", "Breeder"], item.feedType)}
        ${input("quantity", "Quantity Sold", item.quantity, true, "number", "data-autototal")}
        ${selectField("unit", "Unit of Measurement", ["Bags", "Kg", "Tons"], item.unit)}
        ${input("unitPrice", "Unit Price (₦)", item.unitPrice, true, "number", "data-autototal")}
      </div>
      <div class="section-title"><h3>Total Value</h3></div>
      <div class="mini-grid">
        ${fact("Formula", "Quantity Sold x Unit Price (₦)")}
        ${fact("Calculated Total", `<span id="saleTotalPreview">${money(Number(item.quantity || 0) * Number(item.unitPrice || 0))}</span>`)}
        ${fact("Delivery", sale.deliveryStatus)}
      </div>
      <div class="section-title"><h3>Notes</h3></div>
      ${textarea("notes", "Notes", sale.notes, "full")}
    </form>
  `, {
    size: "wide",
    footer: `
      ${id ? recordActionButton("sales", sale.id, sale.customerId) : ""}
      <button class="btn" data-action="close-modal">Close</button>
      <button class="btn primary" data-action="save-sale"><i data-lucide="save"></i>Save</button>
    `
  });
}

function openComplaintModal(id = "", customerId = "") {
  const complaint = id ? state.complaints.find((item) => item.id === id) : blankComplaint(customerId);
  if (!complaint || !canAccessCustomer(state.customers.find((customer) => customer.id === complaint.customerId))) {
    toast("This complaint is outside the current access scope");
    return;
  }
  openModal(id ? "Complaint Details" : "Record Complaint", `
    ${voidNotice(complaint)}
    <form id="complaintForm" data-id="${complaint.id || ""}">
      <div class="form-grid">
        ${customerSelect("customerId", "Customer Name", complaint.customerId)}
        ${input("date", "Complaint Date", complaint.date, true, "date")}
        ${selectField("category", "Complaint Category", lists.complaintCategories, complaint.category)}
        ${selectField("product", "Product Involved", lists.products, complaint.product)}
        ${input("batch", "Batch Number", complaint.batch)}
        ${input("quantity", "Quantity Affected", complaint.quantity)}
        ${selectField("severity", "Severity", lists.severity, complaint.severity)}
        ${input("assignedTo", "Assigned To", complaint.assignedTo)}
        ${selectField("status", "Status", lists.complaintStatus, complaint.status)}
        ${input("dateResolved", "Date Resolved", complaint.dateResolved, false, "date")}
        ${textarea("description", "Complaint Description", complaint.description, "full")}
        ${textarea("actionTaken", "Immediate Action Taken", complaint.actionTaken, "full")}
        ${textarea("resolutionNotes", "Resolution Notes", complaint.resolutionNotes, "full")}
        ${complaintEvidenceField(complaint)}
      </div>
    </form>
  `, {
    size: "wide",
    footer: `
      ${id ? recordActionButton("complaints", complaint.id, complaint.customerId) : ""}
      <button class="btn" data-action="close-modal">Close</button>
      <button class="btn primary" data-action="save-complaint"><i data-lucide="save"></i>Save</button>
    `
  });
}

function openUserModal(id = "") {
  if (!isSalesAdmin()) {
    toast("User administration is for Sales Admin only");
    return;
  }
  const isNew = !id;
  const user = isNew ? blankUser() : state.users.find((item) => item.id === id);
  if (!user) {
    toast("User account not found");
    return;
  }
  const isCurrentUser = user.id && user.id === currentUserProfile()?.id;
  openModal(isNew ? "Add User" : `${user.name} - Access`, `
    <form id="userForm" data-id="${user.id || ""}">
      <div class="form-grid">
        ${input("name", "Full Name", user.name, true)}
        ${input("username", "Username", user.username, true)}
        ${input("email", "Email Address", user.email, true, "email")}
        ${selectField("role", "Role", ["Canvasser", "Area Manager", "Sales Admin"], user.role)}
        ${input("territory", "Region / Territory", user.territory)}
        ${managerSelectField("managerId", "Assigned Area Manager", user.managerId)}
        ${selectField("status", "Account Status", ["Active", "Inactive"], user.status || "Active")}
        ${input("password", isNew ? "Temporary Password" : "New Password (Optional)", "", isNew, "password", "autocomplete=\"new-password\"")}
        <p class="form-note full">${isNew ? "The new user can sign in with the username or email after the account is saved." : "Leave password empty to keep the current password."}</p>
      </div>
    </form>
  `, {
    size: "wide",
    footer: `
      ${!isNew && !isCurrentUser ? `<button class="btn danger" data-action="delete-user" data-id="${user.id}"><i data-lucide="trash-2"></i>Delete User</button>` : ""}
      ${!isNew && !isCurrentUser ? `<button class="btn ${user.status === "Inactive" ? "warning" : "danger"}" data-action="toggle-user-status" data-id="${user.id}"><i data-lucide="${user.status === "Inactive" ? "user-check" : "user-x"}"></i>${user.status === "Inactive" ? "Activate" : "Deactivate"}</button>` : ""}
      <button class="btn" data-action="close-modal">Close</button>
      <button class="btn primary" data-action="save-user"><i data-lucide="save"></i>Save User</button>
    `
  });
}

function complaintEvidenceField(complaint) {
  const items = evidenceItemsFromRecord(complaint);
  return `
    <div class="evidence-panel full">
      <div class="evidence-preview" id="complaintEvidencePreview">
        ${evidenceGallery(items)}
      </div>
      <label>
        Photo / Video Evidence
        <input name="evidenceFiles" type="file" accept="image/*,video/*" multiple data-evidence-input />
      </label>
      <input type="hidden" name="evidenceRemoved" value="" />
      <div class="evidence-actions">
        <span>${items.length ? `${items.length} evidence file${items.length === 1 ? "" : "s"} attached` : "Photos are compressed; videos are uploaded to Drive when synced"}</span>
      </div>
    </div>
  `;
}

function evidenceGallery(items) {
  if (!items.length) return `<span>No evidence attached</span>`;
  return `
    <div class="evidence-grid">
      ${items.map((item) => evidenceCard(item)).join("")}
    </div>
  `;
}

function evidenceCard(item, isNew = false) {
  const source = evidenceSource(item);
  const isVideo = String(item.type || item.mimeType || "").startsWith("video");
  const media = source && source.startsWith("data:")
    ? isVideo
      ? `<video src="${escapeAttr(source)}" controls muted playsinline></video>`
      : `<img src="${escapeAttr(source)}" alt="${escapeAttr(item.name || "Complaint evidence")}" />`
    : `<div class="evidence-file-icon"><i data-lucide="${isVideo ? "video" : "image"}"></i></div>`;
  const openLink = item.url ? `<a class="btn subtle" href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer"><i data-lucide="external-link"></i>Open</a>` : "";
  const removeButton = isNew ? "" : `<button type="button" class="btn subtle" data-action="remove-evidence" data-evidence-id="${escapeAttr(item.id || "")}"><i data-lucide="x"></i>Remove</button>`;
  return `
    <figure class="evidence-card" data-evidence-card="${escapeAttr(item.id || "")}">
      ${media}
      <figcaption>
        <strong class="truncate">${escapeHtml(item.name || "Evidence file")}</strong>
        <span>${isNew ? "Selected" : isVideo ? "Video" : "Photo"}</span>
        <div class="evidence-card-actions">${openLink}${removeButton}</div>
      </figcaption>
    </figure>
  `;
}

function evidenceSource(item) {
  if (item.dataUrl) return item.dataUrl;
  if (item.driveFileId && String(item.type || item.mimeType || "").startsWith("image")) {
    return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(item.driveFileId)}`;
  }
  return "";
}

function saveCustomer() {
  const form = document.getElementById("customerForm");
  if (!form.reportValidity()) return;
  const values = serializeForm(form);
  const id = form.dataset.id || makeId("c", state.customers);
  const existing = state.customers.find((item) => item.id === id);
  const now = today();
  const record = {
    ...blankCustomer(),
    ...existing,
    ...values,
    id,
    capacity: Number(values.capacity || 0),
    stock: Number(values.stock || 0),
    pens: Number(values.pens || 0),
    ownerId: values.ownerId || existing?.ownerId || currentUserProfile().id,
    createdBy: existing?.createdBy || currentUserName(),
    createdAt: existing?.createdAt || now,
    updatedBy: currentUserName(),
    updatedAt: now
  };
  upsert("customers", record);
  audit(id, existing ? "Edited customer record" : "Created customer record");
  saveState();
  closeModal();
  toast("Customer saved");
  render();
}

function saveBird() {
  const form = document.getElementById("birdForm");
  if (!form.reportValidity()) return;
  const values = serializeForm(form);
  const id = form.dataset.id || makeId("b", state.birdDetails);
  const customerId = form.dataset.customer || values.customerId;
  upsert("birdDetails", { ...values, id, customerId, quantity: Number(values.quantity || 0) });
  audit(customerId, form.dataset.id ? "Edited bird capacity line item" : "Added bird capacity line item");
  saveState();
  closeModal();
  openCustomerModal(customerId);
  toast("Bird detail saved");
}

function saveVisit() {
  const form = document.getElementById("visitForm");
  if (!form.reportValidity()) return;
  const values = serializeForm(form);
  const id = form.dataset.id || makeId("v", state.visits);
  const existing = state.visits.find((item) => item.id === id);
  const record = { ...blankVisit(values.customerId), ...existing, ...values, id, time: formatTime(values.time), createdBy: existing?.createdBy || currentUserName(), updatedAt: today() };
  upsert("visits", record);
  if (!existing && values.nextStep) {
    upsert("followups", {
      ...blankFollowup(values.customerId),
      id: makeId("f", state.followups),
      visitId: id,
      action: values.nextStep,
      dueDate: values.followupDate || today(),
      priority: values.interest === "High" ? "High" : "Medium"
    });
  }
  audit(values.customerId, existing ? "Edited visit record" : "Created visit record");
  saveState();
  closeModal();
  toast("Visit saved");
  render();
}

function saveFollowup() {
  const form = document.getElementById("followupForm");
  if (!form.reportValidity()) return;
  const values = serializeForm(form);
  const id = form.dataset.id || makeId("f", state.followups);
  const existing = state.followups.find((item) => item.id === id);
  upsert("followups", { ...blankFollowup(values.customerId), ...existing, ...values, id });
  audit(values.customerId, existing ? "Edited follow-up" : "Created follow-up");
  saveState();
  closeModal();
  toast("Follow-up saved");
  render();
}

function saveSale() {
  const form = document.getElementById("saleForm");
  if (!form.reportValidity()) return;
  const values = serializeForm(form);
  const id = form.dataset.id || makeId("s", state.sales);
  const existing = state.sales.find((item) => item.id === id);
  const item = {
    id: form.dataset.item || makeId("si", state.sales.flatMap((sale) => sale.items)),
    product: values.product,
    category: values.category,
    feedType: values.feedType,
    quantity: Number(values.quantity || 0),
    unit: values.unit,
    unitPrice: Number(values.unitPrice || 0)
  };
  const record = {
    ...blankSale(values.customerId),
    ...existing,
    id,
    customerId: values.customerId,
    visitId: values.visitId,
    date: values.date,
    paymentStatus: values.paymentStatus,
    deliveryStatus: values.deliveryStatus,
    invoice: values.invoice,
    notes: values.notes,
    createdBy: existing?.createdBy || currentUserName(),
    items: [item]
  };
  upsert("sales", record);
  audit(values.customerId, existing ? "Edited sales value" : "Recorded sale");
  saveState();
  closeModal();
  toast("Sale saved");
  render();
}

async function saveComplaint() {
  const form = document.getElementById("complaintForm");
  if (!form.reportValidity()) return;
  const values = serializeForm(form);
  const id = form.dataset.id || makeId("cp", state.complaints);
  const existing = state.complaints.find((item) => item.id === id);
  showLoading("Preparing complaint", "Processing photo and video evidence.");
  let evidence;
  try {
    evidence = await complaintEvidencePayload(form, existing);
  } finally {
    hideLoading();
  }
  if (!evidence) return;
  delete values.evidenceFiles;
  delete values.evidenceRemoved;
  upsert("complaints", { ...blankComplaint(values.customerId), ...existing, ...values, ...evidence, id });
  audit(values.customerId, existing ? "Edited complaint status/details" : "Recorded complaint");
  saveState();
  closeModal();
  toast("Complaint saved");
  render();
}

async function saveUserAccount() {
  if (!isSalesAdmin()) {
    toast("Only Sales Admin can manage users");
    return;
  }
  const form = document.getElementById("userForm");
  if (!form.reportValidity()) return;

  const values = serializeForm(form);
  const id = form.dataset.id || makeId("u", state.users);
  const user = {
    id,
    name: values.name.trim(),
    username: values.username.trim().toLowerCase(),
    email: values.email.trim().toLowerCase(),
    role: values.role,
    territory: values.territory.trim(),
    managerId: values.role === "Canvasser" ? values.managerId : "",
    status: values.status || "Active"
  };

  if (user.id === currentUserProfile()?.id && (user.status !== "Active" || roleKeyForUser(user.role) !== "admin")) {
    toast("You cannot deactivate or remove Sales Admin access from your own account");
    return;
  }
  if (user.role === "Canvasser" && !user.managerId) {
    toast("Assign the canvasser to an area manager");
    return;
  }
  if (user.role === "Canvasser" && user.managerId === user.id) {
    toast("A canvasser cannot manage their own account");
    return;
  }
  if (user.role !== "Area Manager" && hasAssignedCanvassers(user.id)) {
    toast("Reassign this manager's canvassers before changing the role");
    return;
  }
  if (hasUserIdentityConflict(user)) {
    toast("Another user already has that username or email");
    return;
  }

  await persistUserAccount(user, values.password || "");
}

async function toggleUserStatus(id) {
  if (!isSalesAdmin()) {
    toast("Only Sales Admin can manage users");
    return;
  }
  const user = state.users.find((item) => item.id === id);
  if (!user) {
    toast("User account not found");
    return;
  }
  if (user.id === currentUserProfile()?.id) {
    toast("You cannot deactivate your own account");
    return;
  }
  await persistUserAccount({
    ...user,
    status: user.status === "Inactive" ? "Active" : "Inactive"
  }, "");
}

async function deleteUserAccount(id) {
  if (!isSalesAdmin()) {
    toast("Only Sales Admin can delete users");
    return;
  }
  const user = state.users.find((item) => item.id === id);
  if (!user) {
    toast("User account not found");
    return;
  }
  const blocker = userDeleteBlocker(user);
  if (blocker) {
    toast(blocker);
    return;
  }
  if (!window.confirm(`Permanently delete ${user.name}? This removes the account from the Users sheet.`)) return;
  await persistUserDeletion(id);
}

async function persistUserAccount(user, password) {
  if (!backendIsConfigured() || !authSession?.token) {
    toast("Login to the live backend before managing users");
    return false;
  }
  if (navigator.onLine === false) {
    toast("User account changes require an internet connection");
    return false;
  }
  if (hasPendingSync()) {
    const synced = await pushBackendState({ silent: true });
    if (!synced) {
      toast("Sync pending records before managing users");
      return false;
    }
  }

  backendSync.saving = true;
  backendSync.lastError = "";
  showLoading("Saving user", "Updating the Users sheet and account permissions.");
  updateSyncButton();
  try {
    const token = authSession.token;
    const payload = await postBackend("saveUser", { token, user: { ...user, password } });
    if (!payload.ok) throw new Error(payload.error || "User save failed");
    if (payload.user) {
      saveSession({ token, user: payload.user });
      ui.role = roleKeyForUser(payload.user.role);
    }
    if (payload.data) {
      backendSync.suppressSave = true;
      state = normalizeBackendState(payload.data);
      state.currentUser = payload.user?.name || authSession.user?.name || state.currentUser;
      saveOfflineCache();
      backendSync.suppressSave = false;
    }
    backendSync.lastSavedAt = formatTime(new Date());
    closeModal();
    toast("User account saved");
    render();
    return true;
  } catch (error) {
    backendSync.lastError = error.message || "User save failed";
    toast(error.message || "Could not save user account");
    return false;
  } finally {
    backendSync.saving = false;
    hideLoading();
    updateSyncButton();
  }
}

async function persistUserDeletion(id) {
  if (!backendIsConfigured() || !authSession?.token) {
    toast("Login to the live backend before deleting users");
    return false;
  }
  if (navigator.onLine === false) {
    toast("User deletion requires an internet connection");
    return false;
  }
  if (hasPendingSync()) {
    const synced = await pushBackendState({ silent: true });
    if (!synced) {
      toast("Sync pending records before deleting users");
      return false;
    }
  }

  backendSync.saving = true;
  backendSync.lastError = "";
  showLoading("Deleting user", "Removing the account from the Users sheet.");
  updateSyncButton();
  try {
    const token = authSession.token;
    const payload = await postBackend("deleteUser", { token, userId: id });
    if (!payload.ok) throw new Error(payload.error || "User delete failed");
    if (payload.user) {
      saveSession({ token, user: payload.user });
      ui.role = roleKeyForUser(payload.user.role);
    }
    if (payload.data) {
      backendSync.suppressSave = true;
      state = normalizeBackendState(payload.data);
      state.currentUser = payload.user?.name || authSession.user?.name || state.currentUser;
      saveOfflineCache();
      backendSync.suppressSave = false;
    }
    backendSync.lastSavedAt = formatTime(new Date());
    closeModal();
    toast("User account deleted");
    render();
    return true;
  } catch (error) {
    backendSync.lastError = error.message || "User delete failed";
    toast(error.message || "Could not delete user account");
    return false;
  } finally {
    backendSync.saving = false;
    hideLoading();
    updateSyncButton();
  }
}

function hasUserIdentityConflict(user) {
  const email = user.email.trim().toLowerCase();
  const username = user.username.trim().toLowerCase();
  return state.users.some((item) => item.id !== user.id && (
    String(item.email || "").trim().toLowerCase() === email
    || String(item.username || "").trim().toLowerCase() === username
  ));
}

function hasAssignedCanvassers(managerId) {
  return state.users.some((user) => user.role === "Canvasser" && user.managerId === managerId);
}

function hasAssignedCustomers(userId) {
  return state.customers.some((customer) => customer.ownerId === userId);
}

function userDeleteBlocker(user) {
  if (user.id === currentUserProfile()?.id) return "You cannot delete your own account";
  if (user.role === "Area Manager" && hasAssignedCanvassers(user.id)) return "Reassign this manager's canvassers before deleting the user";
  if (user.role === "Canvasser" && hasAssignedCustomers(user.id)) return "Reassign this canvasser's customers before deleting the user";
  return "";
}

async function complaintEvidencePayload(form, existing) {
  try {
    const removedIds = new Set(String(form.elements.evidenceRemoved?.value || "").split(",").filter(Boolean));
    const existingItems = evidenceItemsFromRecord(existing).filter((item) => !removedIds.has(item.id));
    const files = Array.from(form.elements.evidenceFiles?.files || []);
    const newItems = [];
    for (const file of files) {
      newItems.push(await prepareEvidenceFile(file));
    }
    const items = [...existingItems, ...newItems].slice(0, 8);
    return {
      evidenceItems: items,
      evidenceName: items.map((item) => item.name).filter(Boolean).join(", "),
      evidenceData: JSON.stringify(items)
    };
  } catch (error) {
    toast(error.message || "Could not attach evidence");
    return null;
  }
}

async function prepareEvidenceFile(file) {
  if (file.type.startsWith("image/")) {
    return {
      id: makeEvidenceId(),
      name: file.name,
      type: "image",
      mimeType: "image/jpeg",
      dataUrl: await compressImageFile(file),
      addedAt: today()
    };
  }
  if (file.type.startsWith("video/")) {
    if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is too large. Use a video under 8 MB.`);
    return {
      id: makeEvidenceId(),
      name: file.name,
      type: "video",
      mimeType: file.type || "video/mp4",
      dataUrl: await fileToDataUrl(file),
      addedAt: today()
    };
  }
  throw new Error("Evidence must be an image or video file");
}

function deleteRecord(collection, id) {
  state[collection] = state[collection].filter((item) => item.id !== id);
  saveState();
  toast("Record deleted");
}

function deleteBusinessRecord(collection, id) {
  if (!canDeleteBusinessRecords()) {
    toast("Only Sales Admin can delete records");
    return;
  }
  if (!["customers", "visits", "followups", "sales", "complaints"].includes(collection)) {
    toast("Delete is not available for this record");
    return;
  }

  if (collection === "customers") {
    const relatedSaleIds = new Set(state.sales.filter((sale) => sale.customerId === id).map((sale) => sale.id));
    state.customers = state.customers.filter((item) => item.id !== id);
    state.birdDetails = state.birdDetails.filter((item) => item.customerId !== id);
    state.visits = state.visits.filter((item) => item.customerId !== id);
    state.followups = state.followups.filter((item) => item.customerId !== id);
    state.sales = state.sales.filter((item) => item.customerId !== id);
    state.complaints = state.complaints.filter((item) => item.customerId !== id);
    state.auditLogs = state.auditLogs.filter((item) => item.customerId !== id && !relatedSaleIds.has(item.saleId));
  } else {
    state[collection] = state[collection].filter((item) => item.id !== id);
  }

  saveState();
  toast(`${collectionLabel(collection)} deleted`);
}

function voidBusinessRecord(collection, id) {
  if (canDeleteBusinessRecords()) {
    toast("Sales Admin can delete records instead");
    return;
  }
  if (!["customers", "visits", "followups", "sales", "complaints"].includes(collection)) {
    toast("Void is not available for this record");
    return;
  }

  const record = state[collection].find((item) => item.id === id);
  if (!record) {
    toast("Record not found");
    return;
  }

  record.voided = "Yes";
  record.voidedBy = currentUserName();
  record.voidedAt = today();
  if (collection === "followups") record.status = "Cancelled";
  audit(record.customerId || id, `Voided ${collectionLabel(collection).toLowerCase()} record`);
  saveState();
  toast(`${collectionLabel(collection)} voided`);
}

function openModal(title, body, options = {}) {
  els.modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <article class="modal ${options.size || ""}" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
        <header class="modal-header">
          <h2>${title}</h2>
          <button class="icon-btn" data-action="close-modal" aria-label="Close"><i data-lucide="x"></i></button>
        </header>
        <div class="modal-body">${body}</div>
        <footer class="modal-footer">${options.footer || `<button class="btn primary" data-action="close-modal">Done</button>`}</footer>
      </article>
    </div>
  `;
  refreshIcons();
}

function closeModal() {
  els.modalRoot.innerHTML = "";
}

function updateEvidencePreview(inputNode) {
  const files = Array.from(inputNode.files || []);
  const preview = document.getElementById("complaintEvidencePreview");
  if (!preview || !files.length) return;
  if (preview.dataset.objectUrls) {
    preview.dataset.objectUrls.split("|").filter(Boolean).forEach((url) => URL.revokeObjectURL(url));
  }
  preview.querySelectorAll('[data-evidence-card^="selected-"]').forEach((node) => node.remove());

  const urls = files.map((file) => URL.createObjectURL(file));
  const cards = files.map((file, index) => evidenceCard({
    id: `selected-${index}`,
    name: file.name,
    type: file.type.startsWith("video/") ? "video" : "image",
    mimeType: file.type,
    dataUrl: urls[index]
  }, true)).join("");
  const existingGrid = preview.querySelector(".evidence-grid")?.innerHTML || "";
  preview.innerHTML = `<div class="evidence-grid">${existingGrid}${cards}</div>`;
  preview.dataset.objectUrls = urls.join("|");
  refreshIcons();
}

function removeEvidencePreview(evidenceId = "") {
  const preview = document.getElementById("complaintEvidencePreview");
  const inputNode = document.querySelector('input[name="evidenceFiles"]');
  const removedField = document.querySelector('input[name="evidenceRemoved"]');
  if (evidenceId && removedField) {
    const ids = new Set(String(removedField.value || "").split(",").filter(Boolean));
    ids.add(evidenceId);
    removedField.value = [...ids].join(",");
  }
  const card = evidenceId
    ? [...(preview?.querySelectorAll("[data-evidence-card]") || [])].find((node) => node.dataset.evidenceCard === evidenceId)
    : null;
  if (card) card.remove();
  if (preview && !preview.querySelector(".evidence-card")) {
    preview.innerHTML = "<span>No evidence attached</span>";
  }
  if (!evidenceId && inputNode) inputNode.value = "";
}

async function compressImageFile(file) {
  if (!file.type.startsWith("image/")) throw new Error("Select an image file for evidence");
  const source = await fileToDataUrl(file);
  const image = await loadImage(source);
  const attempts = [
    { max: 720, quality: 0.64 },
    { max: 540, quality: 0.58 },
    { max: 420, quality: 0.52 },
    { max: 320, quality: 0.48 }
  ];

  let result = "";
  for (const attempt of attempts) {
    result = drawCompressedImage(image, attempt.max, attempt.quality);
    if (result.length <= 45000) return result;
  }
  if (result.length > 50000) throw new Error("Photo is too large. Choose a smaller image.");
  return result;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read selected photo"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load selected photo"));
    image.src = src;
  });
}

function drawCompressedImage(image, maxSize, quality) {
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

async function captureGps(prefix) {
  if (!navigator.geolocation) {
    toast("GPS is not available on this device");
    return;
  }

  toast(`Calibrating GPS. Stay still until accuracy reaches ${GPS_MAX_ACCURACY_METERS}m or better.`);
  try {
    const position = await getAccuratePosition(GPS_MAX_ACCURACY_METERS, 25000);
    const { latitude, longitude, accuracy } = position.coords;
    const lat = latitude.toFixed(6);
    const lng = longitude.toFixed(6);
    const accuracyText = `${Math.round(accuracy)}m`;

    if (prefix === "visit") {
      const field = document.querySelector('input[name="gps"]');
      if (field) field.value = `${lat}, ${lng} (${accuracyText} accuracy)`;
    } else {
      setField("lat", lat);
      setField("lng", lng);
      setField("accuracy", accuracyText);
      const preview = document.querySelector(".map-preview");
      if (preview) preview.textContent = `${lat}, ${lng} (${accuracyText})`;
    }
    toast(`GPS captured within ${accuracyText}`);
  } catch (error) {
    toast(error.message || "Could not capture accurate GPS");
  }
}

function getAccuratePosition(maxAccuracyMeters, timeoutMs) {
  return new Promise((resolve, reject) => {
    let bestPosition = null;
    let settled = false;
    let watchId = null;
    let timer = null;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timer) clearTimeout(timer);
      callback(value);
    };
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) bestPosition = position;
        if (position.coords.accuracy <= maxAccuracyMeters) finish(resolve, position);
      },
      (error) => finish(reject, new Error(error.message || "GPS permission or signal failed")),
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
    );
    timer = setTimeout(() => {
      const best = bestPosition?.coords?.accuracy ? Math.round(bestPosition.coords.accuracy) : null;
      const message = best
        ? `Best GPS accuracy was ${best}m. The required accuracy is ${maxAccuracyMeters}m or better. Move to an open area and retry.`
        : "GPS could not get a live fix. Move to an open area and retry.";
      finish(reject, new Error(message));
    }, timeoutMs);
  });
}

function updateCustomerTable() {
  const slot = document.getElementById("customerTableSlot");
  if (slot) {
    slot.innerHTML = customerTable(getFilteredCustomers());
    refreshIcons();
  }
}

function updateSaleTotalPreview() {
  const form = document.getElementById("saleForm");
  const slot = document.getElementById("saleTotalPreview");
  if (!form || !slot) return;
  const quantity = Number(form.elements.quantity?.value || 0);
  const unitPrice = Number(form.elements.unitPrice?.value || 0);
  slot.textContent = money(quantity * unitPrice);
}

function getFilteredCustomers() {
  const location = document.getElementById("locationFilter")?.value || "";
  const bird = document.getElementById("birdFilter")?.value || "";
  const status = document.getElementById("statusFilter")?.value || "";
  const lastVisitAfter = document.getElementById("lastVisitFilter")?.value || "";
  return filterByGlobal(scopedCustomers(), (customer) => `${customer.farmName} ${customer.contact} ${customer.phone} ${customer.town} ${customer.farmType}`)
    .filter((customer) => {
      const text = `${customer.farmName} ${customer.contact} ${customer.phone}`.toLowerCase();
      const local = !ui.customerFilter || text.includes(ui.customerFilter);
      const locationMatch = !location || customer.town === location;
      const birdMatch = !bird || customer.farmType === bird;
      const statusMatch = !status || customer.category === status;
      const last = lastVisitDate(customer.id);
      const lastMatch = !lastVisitAfter || (last && last >= lastVisitAfter);
      return local && locationMatch && birdMatch && statusMatch && lastMatch;
    });
}

function filterByGlobal(items, getText) {
  if (!ui.globalSearch) return items;
  return items.filter((item) => getText(item).toLowerCase().includes(ui.globalSearch));
}

function serializeForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function upsert(collection, record) {
  const index = state[collection].findIndex((item) => item.id === record.id);
  if (index >= 0) state[collection][index] = record;
  else state[collection].unshift(record);
}

function audit(customerId, action) {
  state.auditLogs.unshift({
    id: makeId("a", state.auditLogs),
    customerId,
    action,
    user: currentUserName(),
    date: today()
  });
}

function auditTable(customerId) {
  const rows = state.auditLogs.filter((log) => log.customerId === customerId).slice(0, 8);
  if (!rows.length) return emptyState("history", "No audit activity yet.");
  return `
    <table class="data-table">
      <thead><tr><th>Date</th><th>User</th><th>Action</th></tr></thead>
      <tbody>${rows.map((row) => `<tr><td data-label="Date">${row.date}</td><td data-label="User">${row.user}</td><td data-label="Action">${row.action}</td></tr>`).join("")}</tbody>
    </table>
  `;
}

function exportReportCsv() {
  const customers = scopedCustomers();
  const rows = [
    ["Customer", "Location", "Status", "Capacity", "Total Sales", "Open Complaints", "Pending Follow-ups"],
    ...customers.map((customer) => [
      customer.farmName,
      `${customer.town}, ${customer.state}`,
      customer.category,
      customer.capacity,
      customerSalesTotal(customer.id),
      state.complaints.filter((c) => c.customerId === customer.id && !["Closed", "Resolved"].includes(c.status)).length,
      state.followups.filter((f) => f.customerId === customer.id && f.status !== "Completed").length
    ])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `farmlink-report-${today()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast("CSV report exported");
}

function input(name, labelText, value = "", required = false, type = "text", extra = "") {
  return `
    <label>
      ${labelText}
      <input name="${name}" type="${type}" value="${escapeAttr(value ?? "")}" ${required ? "required" : ""} ${extra || ""} />
    </label>
  `;
}

function textarea(name, labelText, value = "", className = "") {
  return `
    <label class="${className}">
      ${labelText}
      <textarea name="${name}">${escapeHtml(value ?? "")}</textarea>
    </label>
  `;
}

function selectField(name, labelText, options, value = "", extra = "") {
  return `
    <label>
      ${labelText}
      ${select(name, options, value, "", extra)}
    </label>
  `;
}

function select(name, options, value = "", placeholder = "", extra = "") {
  return `
    <select name="${name}" id="${name}" ${extra || ""}>
      ${placeholder ? `<option value="">${placeholder}</option>` : ""}
      ${options.map((option) => `<option value="${escapeAttr(option)}" ${String(option) === String(value) ? "selected" : ""}>${option}</option>`).join("")}
    </select>
  `;
}

function optionSelect(name, options, value = "all", placeholder = "", extra = "") {
  return `
    <select name="${name}" id="${name}" ${extra || ""}>
      ${placeholder ? `<option value="all" ${value === "all" ? "selected" : ""}>${placeholder}</option>` : ""}
      ${options.map((option) => `<option value="${escapeAttr(option.value)}" ${String(option.value) === String(value) ? "selected" : ""}>${option.label}</option>`).join("")}
    </select>
  `;
}

function customerSelect(name, labelText, value = "") {
  const customers = scopedCustomers();
  return `
    <label>
      ${labelText}
      <select name="${name}">
        ${customers.map((customer) => `<option value="${customer.id}" ${customer.id === value ? "selected" : ""}>${customer.farmName}</option>`).join("")}
      </select>
    </label>
  `;
}

function canvasserSelectField(name, labelText, value = "") {
  const users = assignableCanvassers();
  return `
    <label>
      ${labelText}
      <select name="${name}">
        ${users.map((user) => `<option value="${user.id}" ${user.id === value ? "selected" : ""}>${user.name} - ${user.territory}</option>`).join("")}
      </select>
    </label>
  `;
}

function managerSelectField(name, labelText, value = "") {
  const managers = areaManagers();
  return `
    <label>
      ${labelText}
      <select name="${name}">
        <option value="">No manager</option>
        ${managers.map((user) => `<option value="${user.id}" ${user.id === value ? "selected" : ""}>${user.name} - ${user.territory}</option>`).join("")}
      </select>
    </label>
  `;
}

function visitSelect(name, labelText, value = "", customerId = "", optional = false) {
  const options = scopedVisits()
    .filter((visit) => !customerId || visit.customerId === customerId)
    .map((visit) => `${visit.date} - ${visit.type}`);
  const selected = visitLabel(value);
  return `
    <label>
      ${labelText}
      <select name="${name}">
        ${optional ? `<option value="">None</option>` : ""}
        ${options.map((option) => `<option value="${escapeAttr(visitIdFromLabel(option))}" ${option === selected ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </label>
  `;
}

function fact(labelText, value) {
  return `<div class="fact"><span>${labelText}</span><strong>${value}</strong></div>`;
}

function emptyState(icon, text) {
  return `<div class="empty-state"><i data-lucide="${icon}"></i><strong>${text}</strong></div>`;
}

function statusBadge(value, extra = "") {
  const key = String(extra || value).toLowerCase().replace(/\s+/g, "-");
  return `<span class="badge ${key}">${value}</span>`;
}

function priorityBadge(value) {
  return `<span class="priority ${String(value).toLowerCase()}">${value}</span>`;
}

function severityBadge(value) {
  return `<span class="severity ${String(value).toLowerCase()}">${value}</span>`;
}

function money(value) {
  return `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(value) {
  if (value === null || value === undefined || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return timeFromMinutes(value.getHours() * 60 + value.getMinutes());
  if (typeof value === "number" && Number.isFinite(value)) return timeFromSheetSerial(value);

  const text = String(value).trim();
  if (/^-?\d+(\.\d+)?$/.test(text)) return timeFromSheetSerial(Number(text));

  const meridiemMatch = text.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)\b/i);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const meridiem = meridiemMatch[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    return timeFromMinutes(hours * 60 + minutes);
  }

  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\b/);
  if (timeMatch) return timeFromMinutes(Number(timeMatch[1]) * 60 + Number(timeMatch[2]));

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return timeFromMinutes(date.getHours() * 60 + date.getMinutes());

  return text;
}

function timeFromSheetSerial(value) {
  const fraction = ((value % 1) + 1) % 1;
  return timeFromMinutes(Math.round(fraction * 24 * 60));
}

function timeFromMinutes(value) {
  const totalMinutes = ((Math.round(Number(value) || 0) % 1440) + 1440) % 1440;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-NG");
}

function totalSales(sales = scopedSales()) {
  return sales.reduce((sum, sale) => sum + saleTotal(sale), 0);
}

function saleTotal(sale) {
  return sale.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
}

function totalQuantity(sales = scopedSales()) {
  return formatNumber(sales.reduce((sum, sale) => sum + sale.items.reduce((inner, item) => inner + Number(item.quantity || 0), 0), 0));
}

function customerSalesTotal(customerId) {
  return state.sales.filter((sale) => sale.customerId === customerId).reduce((sum, sale) => sum + saleTotal(sale), 0);
}

function getMetrics(data = scopedData()) {
  return {
    customers: data.customers.length,
    newThisMonth: data.customers.filter((customer) => customer.createdAt?.startsWith(today().slice(0, 7))).length,
    visitsToday: data.visits.filter((visit) => visit.date === today()).length,
    pendingFollowups: data.followups.filter((followup) => followup.status !== "Completed").length,
    salesToday: data.sales.filter((sale) => sale.date === today()).reduce((sum, sale) => sum + saleTotal(sale), 0),
    openComplaints: data.complaints.filter((complaint) => ["Open", "Under Review"].includes(complaint.status)).length
  };
}

function customerName(idOrName) {
  return state.customers.find((customer) => customer.id === idOrName)?.farmName || idOrName || "";
}

function customerIdFromName(name) {
  return state.customers.find((customer) => customer.farmName === name)?.id || name;
}

function visitLabel(id) {
  const visit = state.visits.find((item) => item.id === id);
  return visit ? `${visit.date} - ${visit.type}` : "";
}

function visitIdFromLabel(label) {
  return state.visits.find((visit) => `${visit.date} - ${visit.type}` === label)?.id || "";
}

function lastVisitDate(customerId) {
  return state.visits
    .filter((visit) => visit.customerId === customerId)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.date || "";
}

function isOverdue(followup) {
  return followup.status !== "Completed" && followup.dueDate < today();
}

function overdueFollowups(followups = scopedFollowups()) {
  return followups.filter(isOverdue);
}

function followupStatus(date) {
  if (!date) return statusBadge("Pending");
  if (date < today()) return statusBadge("Overdue", "overdue");
  return statusBadge("Scheduled", "active");
}

function attentionScore(customer) {
  let score = 32;
  score += Math.min(30, Math.round((customerSalesTotal(customer.id) / Math.max(totalSales(), 1)) * 100));
  score += state.complaints.some((complaint) => complaint.customerId === customer.id && complaint.status !== "Resolved") ? 18 : 0;
  score += state.followups.some((followup) => followup.customerId === customer.id && followup.status !== "Completed") ? 14 : 0;
  score += customer.category === "Prospect" ? 12 : 0;
  return Math.min(96, score);
}

function groupTotals(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + saleTotal(item);
    return acc;
  }, {});
}

function countBy(items, getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function currencyChart(values) {
  const max = Math.max(...Object.values(values), 1);
  return `<div class="chart-list">${Object.entries(values).map(([label, value]) => chartRow(label, money(value), Math.round((value / max) * 100))).join("")}</div>`;
}

function countChart(values) {
  const max = Math.max(...Object.values(values), 1);
  return `<div class="chart-list">${Object.entries(values).map(([label, value]) => chartRow(label, value, Math.round((value / max) * 100))).join("")}</div>`;
}

function chartRow(label, value, percent) {
  return `
    <div class="chart-row">
      <span class="truncate strong">${label}</span>
      <span class="chart-track">${chartFill(percent)}</span>
      <span class="muted">${value}</span>
    </div>
  `;
}

function chartFill(percent, mode = "progress") {
  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  const tone = mode === "attention" ? attentionBarTone(value) : progressBarTone(value);
  return `<span class="chart-fill ${tone}" style="width:${value}%"></span>`;
}

function progressBarTone(percent) {
  if (percent >= 70) return "high-progress";
  if (percent >= 40) return "medium-progress";
  return "low-progress";
}

function attentionBarTone(percent) {
  if (percent >= 70) return "high-attention";
  if (percent >= 45) return "medium-attention";
  return "low-attention";
}

function blankUser() {
  return {
    id: "",
    name: "",
    email: "",
    username: "",
    role: "Canvasser",
    territory: "",
    managerId: areaManagers()[0]?.id || "",
    status: "Active"
  };
}

function blankCustomer() {
  return {
    id: "",
    farmName: "",
    contact: "",
    phone: "",
    altPhone: "",
    email: "",
    address: "",
    state: "Oyo",
    lga: "",
    town: "",
    category: "New",
    farmType: "Broiler",
    birdType: "Broiler",
    capacity: "",
    stock: "",
    pens: "",
    stage: "Starter",
    feedConsumption: "",
    feedBrand: "",
    frequency: "",
    supplier: "",
    notes: "",
    lat: "",
    lng: "",
    accuracy: "",
    ownerId: assignableCanvassers()[0]?.id || currentUserProfile().id,
    createdBy: "",
    createdAt: "",
    updatedBy: "",
    updatedAt: "",
    voided: "",
    voidedBy: "",
    voidedAt: ""
  };
}

function blankVisit(customerId = "") {
  return {
    id: "",
    customerId: customerId || defaultCustomerId(),
    date: today(),
    time: nowTime(),
    gps: "",
    type: "Routine Visit",
    personMet: "",
    purpose: "",
    summary: "",
    observation: "",
    currentFeed: "",
    competitor: "",
    interest: "Medium",
    nextStep: "",
    followupDate: today(),
    notes: "",
    createdBy: currentUserName(),
    updatedAt: today(),
    voided: "",
    voidedBy: "",
    voidedAt: ""
  };
}

function blankFollowup(customerId = "") {
  return { id: "", customerId: customerId || defaultCustomerId(), visitId: "", action: "", responsible: currentUserName(), priority: "Medium", dueDate: today(), status: "Pending", completionNotes: "", dateCompleted: "", voided: "", voidedBy: "", voidedAt: "" };
}

function blankSale(customerId = "") {
  return { id: "", customerId: customerId || defaultCustomerId(), visitId: "", date: today(), paymentStatus: "Paid", deliveryStatus: "Delivered", invoice: "", notes: "", createdBy: currentUserName(), voided: "", voidedBy: "", voidedAt: "", items: [blankSaleItem()] };
}

function blankSaleItem() {
  return { id: "", product: "Broiler Starter", category: "Feed", feedType: "Starter", quantity: "", unit: "Bags", unitPrice: "" };
}

function blankComplaint(customerId = "") {
  return { id: "", customerId: customerId || defaultCustomerId(), date: today(), category: "Product Quality", product: "Broiler Starter", batch: "", quantity: "", description: "", severity: "Medium", actionTaken: "", assignedTo: currentUserName(), status: "Open", resolutionNotes: "", dateResolved: "", voided: "", voidedBy: "", voidedAt: "", evidenceName: "", evidenceData: "[]", evidenceItems: [] };
}

function makeId(prefix, collection) {
  const numbers = collection
    .map((item) => String(item.id || "").replace(prefix, ""))
    .map((item) => Number(item))
    .filter(Number.isFinite);
  return `${prefix}${Math.max(0, ...numbers) + 1}`;
}

function makeEvidenceId() {
  if (window.crypto?.randomUUID) return `ev-${window.crypto.randomUUID()}`;
  return `ev-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setField(name, value) {
  const field = document.querySelector(`[name="${name}"]`);
  if (field) field.value = value;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function showLoading(title = "Working...", message = "Please wait while FarmLink completes this action.") {
  loadingDepth += 1;
  if (els.loadingTitle) els.loadingTitle.textContent = title;
  if (els.loadingMessage) els.loadingMessage.textContent = message;
  if (els.loadingOverlay) els.loadingOverlay.classList.remove("is-hidden");
}

function hideLoading() {
  loadingDepth = Math.max(0, loadingDepth - 1);
  if (loadingDepth === 0 && els.loadingOverlay) els.loadingOverlay.classList.add("is-hidden");
}

function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  els.toastRoot.appendChild(node);
  setTimeout(() => node.remove(), 2400);
}

document.addEventListener("submit", (event) => {
  event.preventDefault();
});

document.addEventListener("change", (event) => {
  if (event.target.name === "customerId") {
    event.target.value = customerIdFromName(event.target.value);
  }
});
