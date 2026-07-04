const STORAGE_KEY = "habitTaskTradingTracker.v2";

const defaultState = {
  settings: {
    sheetUrl: ""
  },
  habits: [],
  tasks: [],
  trades: []
};

const state = loadState();
const statusToast = document.getElementById("statusToast");

const settingsForm = document.getElementById("settingsForm");
const habitForm = document.getElementById("habitForm");
const taskForm = document.getElementById("taskForm");
const tradeForm = document.getElementById("tradeForm");
const syncPendingButton = document.getElementById("syncPendingButton");
const habitSelectedDateInput = document.getElementById("habitSelectedDate");
const tradeDateInput = document.getElementById("tradeDate");
const tradeMonthFilterInput = document.getElementById("tradeMonthFilter");
const habitGraphToggle = document.getElementById("habitGraphToggle");
const tradeGraphToggle = document.getElementById("tradeGraphToggle");
const habitTableBody = document.getElementById("habitTableBody");
const navSettingsToggle = document.getElementById("navSettingsToggle");
const navSettingsPanel = document.getElementById("navSettingsPanel");

const uiState = {
  activeTab: "habitTab",
  habitSelectedDate: getToday(),
  tradeMonth: getCurrentMonth()
};

document.getElementById("sheetUrl").value = state.settings.sheetUrl;
habitSelectedDateInput.value = uiState.habitSelectedDate;
tradeDateInput.value = getToday();
tradeMonthFilterInput.value = uiState.tradeMonth;

settingsForm.addEventListener("submit", handleSettingsSave);
habitForm.addEventListener("submit", handleHabitSubmit);
taskForm.addEventListener("submit", handleTaskSubmit);
tradeForm.addEventListener("submit", handleTradeSubmit);
syncPendingButton.addEventListener("click", syncPendingEntries);
habitSelectedDateInput.addEventListener("change", handleHabitDateChange);
tradeMonthFilterInput.addEventListener("change", handleTradeMonthChange);
habitGraphToggle.addEventListener("change", renderHabits);
tradeGraphToggle.addEventListener("change", renderTrades);
navSettingsToggle.addEventListener("click", toggleNavSettingsPanel);

document.addEventListener("click", (event) => {
  if (!navSettingsPanel.classList.contains("hidden") && !event.target.closest(".nav-settings-wrap")) {
    closeNavSettingsPanel();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNavSettingsPanel();
  }
});

document.querySelectorAll("[data-tab-target]").forEach((button) => {
  button.addEventListener("click", () => {
    uiState.activeTab = button.dataset.tabTarget;
    renderTabs();
  });
});

habitTableBody.addEventListener("change", handleHabitGridChange);
habitTableBody.addEventListener("click", handleHabitGridClick);
document.getElementById("taskTableBody").addEventListener("change", handleTaskCompletionChange);

render();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("habitTaskTradingTracker.v1");
    if (!raw) {
      return structuredClone(defaultState);
    }

    const parsed = JSON.parse(raw);
    return {
      settings: {
        ...defaultState.settings,
        ...(parsed.settings || {})
      },
      habits: Array.isArray(parsed.habits) ? parsed.habits.map(normalizeHabit) : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTask) : [],
      trades: Array.isArray(parsed.trades) ? parsed.trades.map(normalizeTrade) : []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeHabit(entry) {
  const completions = typeof entry.completions === "object" && entry.completions !== null
    ? entry.completions
    : (entry.date ? { [entry.date]: Boolean(entry.completed) } : {});

  return {
    id: entry.id || makeId(),
    name: entry.name || entry.title || "",
    startTime: entry.startTime || "",
    endTime: entry.endTime || "",
    completions,
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function normalizeTask(entry) {
  return {
    id: entry.id || makeId(),
    title: entry.title || "",
    completionTime: entry.completionTime || entry.dueDate || "",
    notes: entry.notes || "",
    completed: entry.completed === true || entry.status === "Done",
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function normalizeTrade(entry) {
  const target = Number(entry.target ?? 0);
  const actualPnl = Number(entry.actualPnl ?? entry.pnl ?? 0);
  return {
    id: entry.id || makeId(),
    date: entry.date || getToday(),
    target,
    actualPnl,
    achievedPercent: calculateAchievedPercent(target, actualPnl),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function calculateAchievedPercent(target, actualPnl) {
  if (!Number(target)) {
    return 0;
  }

  return (Number(actualPnl) / Number(target)) * 100;
}

function handleSettingsSave(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.settings.sheetUrl = String(formData.get("sheetUrl") || "").trim();
  persist();
  showStatus("Google Sheets connection saved locally.");
}

function handleHabitDateChange(event) {
  uiState.habitSelectedDate = event.currentTarget.value || getToday();
  renderHabits();
  renderStats();
}

function handleTradeMonthChange(event) {
  uiState.tradeMonth = event.currentTarget.value || getCurrentMonth();
  renderTrades();
  renderStats();
}

async function handleHabitSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const entry = {
    id: makeId(),
    name: String(formData.get("name") || "").trim(),
    startTime: String(formData.get("startTime") || ""),
    endTime: String(formData.get("endTime") || ""),
    completions: {},
    deleted: false,
    createdAt: new Date().toISOString(),
    syncStatus: "pending"
  };

  state.habits.unshift(entry);
  persist();
  renderHabits();
  renderStats();
  event.currentTarget.reset();
  await tryImmediateSync("habit", entry);
}

async function handleHabitGridChange(event) {
  const target = event.target;
  if (!target.matches("[data-habit-toggle]")) {
    return;
  }

  const habitId = target.dataset.habitToggle;
  const habit = state.habits.find((entry) => entry.id === habitId && !entry.deleted);
  if (!habit) {
    return;
  }

  habit.completions[uiState.habitSelectedDate] = target.checked;
  habit.syncStatus = "pending";
  persist();
  renderHabits();
  renderStats();
  await tryImmediateSync("habit", habit);
}

async function handleHabitGridClick(event) {
  const button = event.target.closest("[data-habit-delete]");
  if (!button) {
    return;
  }

  const habitId = button.dataset.habitDelete;
  const habit = state.habits.find((entry) => entry.id === habitId && !entry.deleted);
  if (!habit) {
    return;
  }

  habit.deleted = true;
  habit.syncStatus = "pending";
  persist();
  renderHabits();
  renderStats();
  await tryImmediateSync("habit", habit);
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const entry = {
    id: makeId(),
    title: String(formData.get("title") || "").trim(),
    completionTime: String(formData.get("completionTime") || ""),
    notes: String(formData.get("notes") || "").trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    syncStatus: "pending"
  };

  state.tasks.unshift(entry);
  persist();
  renderTasks();
  renderStats();
  event.currentTarget.reset();
  await tryImmediateSync("task", entry);
}

async function handleTradeSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const target = Number(formData.get("target") || 0);
  const actualPnl = Number(formData.get("actualPnl") || 0);
  const entry = {
    id: makeId(),
    date: String(formData.get("date") || getToday()),
    target,
    actualPnl,
    achievedPercent: calculateAchievedPercent(target, actualPnl),
    createdAt: new Date().toISOString(),
    syncStatus: "pending"
  };

  state.trades.unshift(entry);
  persist();
  renderTrades();
  renderStats();
  event.currentTarget.reset();
  tradeDateInput.value = getToday();
  await tryImmediateSync("trade", entry);
}

async function handleTaskCompletionChange(event) {
  const target = event.target;
  if (!target.matches("[data-task-complete]")) {
    return;
  }

  const taskId = target.dataset.taskComplete;
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) {
    return;
  }

  task.completed = true;
  task.syncStatus = "pending";
  persist();
  renderTasks();
  renderStats();
  await tryImmediateSync("task", task);
}

async function tryImmediateSync(type, entry) {
  if (!state.settings.sheetUrl) {
    showStatus("Saved locally. Add your Google Apps Script URL to sync with Google Sheets.");
    return;
  }

  const didSync = await pushEntry(type, entry);
  showStatus(didSync ? "Saved and synced to Google Sheets." : "Saved locally. Sync failed, entry is still pending.");
}

async function syncPendingEntries() {
  if (!state.settings.sheetUrl) {
    showStatus("Add your Google Apps Script URL before syncing.");
    return;
  }

  const pending = [
    ...state.habits.filter((entry) => entry.syncStatus !== "synced").map((entry) => ({ type: "habit", entry })),
    ...state.tasks.filter((entry) => entry.syncStatus !== "synced").map((entry) => ({ type: "task", entry })),
    ...state.trades.filter((entry) => entry.syncStatus !== "synced").map((entry) => ({ type: "trade", entry }))
  ];

  if (!pending.length) {
    showStatus("Nothing to sync.");
    return;
  }

  let syncedCount = 0;
  for (const item of pending) {
    const success = await pushEntry(item.type, item.entry);
    if (success) {
      syncedCount += 1;
    }
  }

  showStatus(`${syncedCount} of ${pending.length} pending entr${pending.length === 1 ? "y" : "ies"} synced.`);
}

async function pushEntry(type, entry) {
  try {
    const response = await fetch(state.settings.sheetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        type,
        payload: entry
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    updateSyncStatus(type, entry.id, "synced");
    return true;
  } catch {
    updateSyncStatus(type, entry.id, "failed");
    return false;
  }
}

function updateSyncStatus(type, id, syncStatus) {
  const collection = getCollection(type);
  const target = collection.find((entry) => entry.id === id);
  if (!target) {
    return;
  }

  target.syncStatus = syncStatus;
  persist();
  render();
}

function getCollection(type) {
  if (type === "habit") {
    return state.habits;
  }
  if (type === "task") {
    return state.tasks;
  }
  return state.trades;
}

function render() {
  renderTabs();
  renderStats();
  renderHabits();
  renderTasks();
  renderTrades();
}

function renderTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tabTarget === uiState.activeTab);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === uiState.activeTab);
  });
}

function renderStats() {
  const today = getToday();
  const currentMonthTrades = state.trades.filter((entry) => entry.date.startsWith(getCurrentMonth()));
  const habitsCompleted = getVisibleHabitsForDate(today).filter((entry) => isHabitCompletedOnDate(entry, today)).length;
  const openTasks = state.tasks.filter((entry) => !entry.completed).length;
  const dailyPnl = state.trades
    .filter((entry) => entry.date === today)
    .reduce((sum, entry) => sum + Number(entry.actualPnl || 0), 0);
  const monthTarget = currentMonthTrades.reduce((sum, entry) => sum + Number(entry.target || 0), 0);
  const monthActual = currentMonthTrades.reduce((sum, entry) => sum + Number(entry.actualPnl || 0), 0);
  const monthPercent = calculateAchievedPercent(monthTarget, monthActual);

  document.getElementById("habitsCompletedStat").textContent = String(habitsCompleted);
  document.getElementById("openTasksStat").textContent = String(openTasks);
  document.getElementById("dailyPnlStat").textContent = formatNumber(dailyPnl);
  document.getElementById("monthlyPercentStat").textContent = formatPercent(monthPercent);
}

function renderHabits() {
  const selectedDate = uiState.habitSelectedDate;
  const selectedEntries = getVisibleHabitsForDate(selectedDate);

  habitTableBody.innerHTML = selectedEntries.length
    ? selectedEntries.map((entry) => `
      <tr>
        <td>${escapeHtml(entry.name)}</td>
        <td>${escapeHtml(formatTime(entry.startTime))}</td>
        <td>${escapeHtml(formatTime(entry.endTime))}</td>
        <td>
          <div class="habit-toggle-cell">
            <label class="switch">
              <input type="checkbox" data-habit-toggle="${escapeHtml(entry.id)}" ${isHabitCompletedOnDate(entry, selectedDate) ? "checked" : ""}>
              <span class="switch-slider"></span>
            </label>
            <span>${isHabitCompletedOnDate(entry, selectedDate) ? "Completed" : "Pending"}</span>
          </div>
        </td>
        <td>
          <button class="icon-button" type="button" data-habit-delete="${escapeHtml(entry.id)}" aria-label="Delete habit" title="Delete habit">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9Z" fill="currentColor"></path>
            </svg>
          </button>
        </td>
        <td>${makeHabitSyncIcon(entry.syncStatus)}</td>
      </tr>
    `).join("")
    : makeEmptyRow("No habits available for this date.", 6);

  const completedCount = selectedEntries.filter((entry) => isHabitCompletedOnDate(entry, selectedDate)).length;
  const pendingCount = selectedEntries.length - completedCount;
  const completionPercent = selectedEntries.length ? (completedCount / selectedEntries.length) * 100 : 0;

  document.getElementById("habitGraphSummary").textContent = `${completedCount} completed, ${pendingCount} pending, ${formatPercent(completionPercent)} completion.`;
  document.getElementById("habitCompletedBar").style.width = `${completionPercent}%`;
  document.getElementById("habitPendingBar").style.width = `${selectedEntries.length ? 100 - completionPercent : 0}%`;
  document.getElementById("habitGraphPanel").classList.toggle("hidden", !habitGraphToggle.checked);
}

function renderTasks() {
  const body = document.getElementById("taskTableBody");
  body.innerHTML = state.tasks.length
    ? state.tasks.map((entry) => `
      <tr>
        <td>${escapeHtml(entry.title)}</td>
        <td>${escapeHtml(formatDateTime(entry.completionTime))}</td>
        <td>${escapeHtml(entry.notes || "-")}</td>
        <td>
          <label class="task-complete-cell">
            <input
              class="task-complete-radio"
              type="radio"
              name="task-complete-${escapeHtml(entry.id)}"
              data-task-complete="${escapeHtml(entry.id)}"
              ${entry.completed ? "checked" : ""}
              ${entry.completed ? "disabled" : ""}
            >
            <span>${entry.completed ? "Completed" : "Mark completed"}</span>
          </label>
        </td>
        <td>${makeSyncPill(entry.syncStatus)}</td>
      </tr>
    `).join("")
    : makeEmptyRow("No tasks saved yet.", 5);
}

function renderTrades() {
  const selectedMonth = uiState.tradeMonth;
  const monthEntries = state.trades
    .filter((entry) => entry.date.startsWith(selectedMonth))
    .sort((left, right) => right.date.localeCompare(left.date));

  const mainBody = document.getElementById("tradeTableBody");
  const monthlyBody = document.getElementById("monthlyReportBody");

  const tableRows = monthEntries.length
    ? monthEntries.map((entry) => `
      <tr>
        <td>${escapeHtml(entry.date)}</td>
        <td>${formatNumber(entry.target)}</td>
        <td>${formatNumber(entry.actualPnl)}</td>
        <td>${formatPercent(entry.achievedPercent)}</td>
        <td>${makeSyncPill(entry.syncStatus)}</td>
      </tr>
    `).join("")
    : makeEmptyRow("No trading entries for this month.", 5);

  mainBody.innerHTML = tableRows;
  monthlyBody.innerHTML = monthEntries.length
    ? monthEntries.map((entry) => `
      <tr>
        <td>${escapeHtml(entry.date)}</td>
        <td>${formatNumber(entry.target)}</td>
        <td>${formatNumber(entry.actualPnl)}</td>
        <td>${formatPercent(entry.achievedPercent)}</td>
      </tr>
    `).join("")
    : makeEmptyRow("No monthly report available.", 4);

  const monthlyTarget = monthEntries.reduce((sum, entry) => sum + Number(entry.target || 0), 0);
  const monthlyActual = monthEntries.reduce((sum, entry) => sum + Number(entry.actualPnl || 0), 0);
  const monthlyAchieved = calculateAchievedPercent(monthlyTarget, monthlyActual);

  document.getElementById("monthlyTargetStat").textContent = formatNumber(monthlyTarget);
  document.getElementById("monthlyActualStat").textContent = formatNumber(monthlyActual);
  document.getElementById("monthlyAchievedStat").textContent = formatPercent(monthlyAchieved);
  document.getElementById("tradeMonthSummary").textContent = `${monthEntries.length} trading day${monthEntries.length === 1 ? "" : "s"} in ${selectedMonth}.`;
  document.getElementById("tradeGraphPanel").classList.toggle("hidden", !tradeGraphToggle.checked);
  renderTradeGraph(monthEntries);
}

function renderTradeGraph(entries) {
  const graphContainer = document.getElementById("tradeGraphBars");
  if (!entries.length) {
    graphContainer.innerHTML = "<p class=\"muted\">No graph data for this month.</p>";
    return;
  }

  const maxValue = Math.max(...entries.map((entry) => Math.max(Math.abs(Number(entry.actualPnl || 0)), Number(entry.target || 0), 1)));

  graphContainer.innerHTML = entries.map((entry) => {
    const actualValue = Number(entry.actualPnl || 0);
    const width = `${Math.max((Math.abs(actualValue) / maxValue) * 100, 4)}%`;
    const fillClass = actualValue >= 0 ? "positive-fill" : "negative-fill";
    return `
      <article class="graph-bar-card">
        <div class="graph-topline">
          <strong>${escapeHtml(entry.date)}</strong>
          <span>${formatNumber(actualValue)} / ${formatNumber(entry.target)}</span>
        </div>
        <div class="bar-track"><div class="bar-fill ${fillClass}" style="width:${width}"></div></div>
        <span class="muted">Earned ${formatPercent(entry.achievedPercent)}</span>
      </article>
    `;
  }).join("");
}

function makeEmptyRow(message, colspan) {
  return `<tr><td colspan="${colspan}">${escapeHtml(message)}</td></tr>`;
}

function makePill(label, className) {
  return `<span class="pill ${className}">${escapeHtml(label)}</span>`;
}

function makeSyncPill(syncStatus) {
  const normalized = syncStatus || "pending";
  if (normalized === "synced") {
    return makePill("Synced", "pill-synced");
  }
  if (normalized === "failed") {
    return makePill("Retry needed", "pill-failed");
  }
  return makePill("Pending", "pill-pending");
}

function makeHabitSyncIcon(syncStatus) {
  const normalized = syncStatus || "pending";

  if (normalized === "synced") {
    return `
      <span class="sync-icon sync-synced" title="Synced" aria-label="Synced">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="m9.2 16.2-3.4-3.4 1.4-1.4 2 2 6-6 1.4 1.4-7.4 7.4Z" fill="currentColor"></path>
        </svg>
      </span>
    `;
  }

  if (normalized === "failed") {
    return `
      <span class="sync-icon sync-failed" title="Sync failed" aria-label="Sync failed">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z" fill="currentColor"></path>
        </svg>
      </span>
    `;
  }

  return `
    <span class="sync-icon sync-pending" title="Pending sync" aria-label="Pending sync">
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M12 1a11 11 0 1 0 11 11h-2a9 9 0 1 1-9-9V1Zm1 5h-2v7l6 3 1-1.7-5-2.5V6Z" fill="currentColor"></path>
      </svg>
    </span>
  `;
}

function getVisibleHabitsForDate(date) {
  return state.habits.filter((entry) => !entry.deleted && getHabitStartDate(entry) <= date);
}

function getHabitStartDate(entry) {
  return (entry.createdAt || getToday()).slice(0, 10);
}

function isHabitCompletedOnDate(entry, date) {
  return Boolean(entry.completions && entry.completions[date]);
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${formatNumber(value)}%`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

let toastTimer;

function showStatus(message) {
  statusToast.textContent = message;
  statusToast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    statusToast.classList.remove("visible");
  }, 2600);
}

function toggleNavSettingsPanel() {
  const willShow = navSettingsPanel.classList.contains("hidden");
  navSettingsPanel.classList.toggle("hidden", !willShow);
  navSettingsToggle.setAttribute("aria-expanded", String(willShow));
}

function closeNavSettingsPanel() {
  navSettingsPanel.classList.add("hidden");
  navSettingsToggle.setAttribute("aria-expanded", "false");
}

function formatTime(value) {
  if (!value) {
    return "-";
  }

  const [hours, minutes] = String(value).split(":");
  if (hours === undefined || minutes === undefined) {
    return value;
  }

  const parsed = new Date();
  parsed.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit"
  }).format(parsed);
}