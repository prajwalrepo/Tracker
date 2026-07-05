const { useEffect, useMemo, useState } = React;

const STORAGE_KEY = "habitTaskTradingTracker.v6";

const PORTFOLIO_PRESET_ROWS = [
  { label: "Salary", category: "income" },
  { label: "Other income", category: "income" },
  { label: "RD", category: "investment" },
  { label: "FD", category: "investment" },
  { label: "Insurance", category: "spent" },
  { label: "Spent", category: "spent" },
  { label: "Lending money", category: "spent" },
  { label: "Loan", category: "income" },
  { label: "EMI", category: "spent" }
];

const BASE_PORTFOLIO_CATEGORIES = ["income", "investment", "spent"];

const PIE_COLORS = ["#15a34a", "#f59e0b", "#ef4444", "#7c3aed", "#0891b2", "#db2777", "#2563eb", "#65a30d", "#8b5cf6", "#f97316"];

const defaultState = {
  settings: {
    sheetUrl: "",
    portfolioCategories: [],
    googleClientId: "",
    activeUserEmail: "",
    activeUserName: ""
  },
  habits: [],
  tasks: [],
  trades: [],
  portfolios: [],
  stocks: []
};

function App() {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("habit");
  const [statusMessage, setStatusMessage] = useState("");
  const activeUserEmail = String(state.settings.activeUserEmail || "").trim().toLowerCase();

  const [habitDate, setHabitDate] = useState(getToday());
  const [habitMonth, setHabitMonth] = useState(getCurrentMonth());
  const [taskFilterDate, setTaskFilterDate] = useState("");
  const [portfolioMonth, setPortfolioMonth] = useState(getCurrentMonth());
  const [portfolioGraphRange, setPortfolioGraphRange] = useState("monthly");
  const [portfolioGraphYear, setPortfolioGraphYear] = useState(String(new Date().getFullYear()));
  const [portfolioGraphMonth, setPortfolioGraphMonth] = useState(getCurrentMonth());

  const [showSettings, setShowSettings] = useState(false);
  const [showHabitAdd, setShowHabitAdd] = useState(false);
  const [showTaskAdd, setShowTaskAdd] = useState(false);
  const [showTradeAdd, setShowTradeAdd] = useState(false);
  const [showPortfolioAdd, setShowPortfolioAdd] = useState(false);
  const [showStockAdd, setShowStockAdd] = useState(false);

  const [showHabitGraph, setShowHabitGraph] = useState(false);
  const [showTaskGraph, setShowTaskGraph] = useState(false);
  const [showTradeGraph, setShowTradeGraph] = useState(false);
  const [showPortfolioGraph, setShowPortfolioGraph] = useState(false);
  const [showStockGraph, setShowStockGraph] = useState(false);

  const [habitForm, setHabitForm] = useState({ name: "", startTime: "", endTime: "" });
  const [taskForm, setTaskForm] = useState({ title: "", completionTime: "", notes: "" });
  const [tradeForm, setTradeForm] = useState({ date: getToday(), target: "" });
  const [stockForm, setStockForm] = useState({ stockName: "", category: "", buyAmount: "", buyDate: getToday(), quantity: "" });

  const [portfolioFormItems, setPortfolioFormItems] = useState(createDefaultPortfolioFormItems);
  const [newPortfolioCategory, setNewPortfolioCategory] = useState("");
  const [tradeAchievedDrafts, setTradeAchievedDrafts] = useState({});

  const portfolioCategories = useMemo(() => {
    const fromSettings = Array.isArray(state.settings.portfolioCategories) ? state.settings.portfolioCategories : [];
    const fromData = state.portfolios
      .filter((entry) => !activeUserEmail || String(entry.ownerEmail || "").trim().toLowerCase() === activeUserEmail)
      .flatMap((entry) => entry.items.map((item) => item.category))
      .filter(Boolean);
    const merged = [...BASE_PORTFOLIO_CATEGORIES, ...fromSettings, ...fromData.map(normalizeCategoryText)];
    return [...new Set(merged.filter(Boolean))];
  }, [state.settings.portfolioCategories, state.portfolios, activeUserEmail]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timer = window.setTimeout(() => setStatusMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    setPortfolioGraphMonth(portfolioMonth || getCurrentMonth());
  }, [portfolioMonth]);

  useEffect(() => {
    const googleClientId = String(state.settings.googleClientId || "").trim();
    const mountNode = document.getElementById("googleSignInButton");

    if (!googleClientId) {
      if (mountNode) {
        mountNode.innerHTML = "";
      }
      return;
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          const profile = parseGoogleJwtProfile(response && response.credential);
          if (!profile.email) {
            setStatusMessage("Google login failed. Could not read account email.");
            return;
          }

          setState((prev) => ({
            ...prev,
            settings: {
              ...prev.settings,
              activeUserEmail: profile.email,
              activeUserName: profile.name || ""
            }
          }));
          setStatusMessage(`Signed in as ${profile.email}`);
        }
      });

      if (mountNode) {
        mountNode.innerHTML = "";
        window.google.accounts.id.renderButton(mountNode, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "pill"
        });
      }
    } catch (error) {
      setStatusMessage("Google sign-in setup failed.");
    }
  }, [state.settings.googleClientId]);

  const belongsToActiveUser = (entry) => {
    if (!activeUserEmail) {
      return true;
    }
    return String(entry && entry.ownerEmail ? entry.ownerEmail : "").trim().toLowerCase() === activeUserEmail;
  };

  const visibleHabits = useMemo(() => sortHabitsForDate(state.habits.filter((habit) => !habit.deleted && belongsToActiveUser(habit) && getHabitStartDate(habit) <= habitDate), habitDate), [state.habits, habitDate, activeUserEmail]);
  const filteredTasks = useMemo(() => {
    const tasks = state.tasks.filter((task) => !task.deleted && belongsToActiveUser(task));
    const list = taskFilterDate ? tasks.filter((task) => String(task.completionTime || "").startsWith(taskFilterDate)) : tasks;
    return sortTasksByCompletion(list);
  }, [state.tasks, taskFilterDate, activeUserEmail]);

  const dailyTradesAsc = useMemo(() => state.trades.filter((trade) => !trade.deleted && belongsToActiveUser(trade)).sort((a, b) => a.date.localeCompare(b.date)), [state.trades, activeUserEmail]);
  const dailyTradesDesc = useMemo(() => [...dailyTradesAsc].sort((a, b) => b.date.localeCompare(a.date)), [dailyTradesAsc]);

  const portfolioEntriesDesc = useMemo(() => state.portfolios.filter((entry) => !entry.deleted && belongsToActiveUser(entry)).sort((a, b) => b.month.localeCompare(a.month)), [state.portfolios, activeUserEmail]);
  const currentPortfolio = useMemo(() => portfolioEntriesDesc.find((entry) => entry.month === portfolioMonth) || null, [portfolioEntriesDesc, portfolioMonth]);
  const currentPortfolioSummary = useMemo(() => summarizePortfolioItems(currentPortfolio ? currentPortfolio.items : []), [currentPortfolio]);

  const stocksDesc = useMemo(() => state.stocks.filter((stock) => !stock.deleted && belongsToActiveUser(stock)).sort((a, b) => (b.buyDate || "").localeCompare(a.buyDate || "")), [state.stocks, activeUserEmail]);

  const graphScopeValue = portfolioGraphRange === "monthly" ? portfolioGraphMonth : `${portfolioGraphYear}-01`;
  const portfolioYears = useMemo(() => {
    const years = state.portfolios
      .filter((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.month)
      .map((entry) => String(entry.month).slice(0, 4));
    return [...new Set([String(new Date().getFullYear()), ...years])].sort((a, b) => b.localeCompare(a));
  }, [state.portfolios, activeUserEmail]);

  const habitCompletedCount = visibleHabits.filter((habit) => isHabitCompletedOnDate(habit, habitDate)).length;
  const habitPendingCount = visibleHabits.length - habitCompletedCount;
  const habitCompletedPercent = visibleHabits.length ? (habitCompletedCount / visibleHabits.length) * 100 : 0;

  const taskCompletedCount = filteredTasks.filter((task) => task.completed).length;
  const taskPendingCount = filteredTasks.length - taskCompletedCount;
  const taskCompletedPercent = filteredTasks.length ? (taskCompletedCount / filteredTasks.length) * 100 : 0;
  const taskAddedCount = filteredTasks.length;
  const taskOnTimeCount = filteredTasks.filter((task) => isTaskOnTime(task)).length;
  const taskDelayedCount = filteredTasks.filter((task) => isTaskDelayed(task)).length;

  const portfolioItemPieData = useMemo(() => buildPortfolioItemPieData(state.portfolios.filter((entry) => belongsToActiveUser(entry)), portfolioGraphRange, graphScopeValue), [state.portfolios, portfolioGraphRange, graphScopeValue, activeUserEmail]);
  const portfolioCategoryPieData = useMemo(() => buildPortfolioCategoryPieData(state.portfolios.filter((entry) => belongsToActiveUser(entry)), portfolioGraphRange, graphScopeValue), [state.portfolios, portfolioGraphRange, graphScopeValue, activeUserEmail]);

  const stockAllocation = useMemo(() => {
    const totals = new Map();
    stocksDesc.forEach((stock) => {
      const key = stock.stockName || "Unnamed";
      const value = Number(stock.buyAmount || 0) * Number(stock.quantity || 0);
      totals.set(key, (totals.get(key) || 0) + value);
    });
    return [...totals.entries()].map(([label, value], index) => ({ label, value, color: PIE_COLORS[index % PIE_COLORS.length] })).sort((a, b) => b.value - a.value);
  }, [stocksDesc]);

  const stockTotalInvested = useMemo(() => stockAllocation.reduce((sum, item) => sum + item.value, 0), [stockAllocation]);

  const tradeChart = useMemo(() => {
    if (!dailyTradesAsc.length) {
      return null;
    }
    const width = 760;
    const height = 260;
    const leftPad = 52;
    const rightPad = 16;
    const topPad = 16;
    const bottomPad = 44;
    const spanX = Math.max(width - leftPad - rightPad, 1);
    const spanY = Math.max(height - topPad - bottomPad, 1);

    const targetValues = dailyTradesAsc.map((trade) => Number(trade.target || 0));
    const achievedValues = dailyTradesAsc.map((trade) => Number(trade.achieved || 0));
    const allValues = [...targetValues, ...achievedValues];
    let minY = Math.min(0, ...allValues);
    let maxY = Math.max(1, ...allValues);
    if (minY === maxY) {
      maxY += 1;
    }

    const toX = (index) => {
      if (dailyTradesAsc.length === 1) {
        return leftPad + spanX / 2;
      }
      return leftPad + (index / (dailyTradesAsc.length - 1)) * spanX;
    };

    const toY = (value) => topPad + ((maxY - value) / (maxY - minY)) * spanY;
    const targetPoints = dailyTradesAsc.map((trade, index) => `${toX(index)},${toY(Number(trade.target || 0))}`).join(" ");
    const achievedPoints = dailyTradesAsc.map((trade, index) => `${toX(index)},${toY(Number(trade.achieved || 0))}`).join(" ");

    return { width, height, leftPad, rightPad, bottomPad, targetPoints, achievedPoints, yTicks: [maxY, (maxY + minY) / 2, minY], toX, toY };
  }, [dailyTradesAsc]);

  function updateSettingsField(field, value) {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  }

  function openPickerFromButton(event) {
    const wrapper = event.currentTarget.closest(".input-with-icon");
    const input = wrapper ? wrapper.querySelector("input, select") : null;
    if (!input) {
      return;
    }
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
    }
  }

  function openPortfolioEditor(monthValue = portfolioMonth) {
    const existing = state.portfolios.find((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.month === monthValue);
    setPortfolioMonth(monthValue);
    setPortfolioFormItems(existing ? mapPortfolioItemsToForm(existing.items) : createDefaultPortfolioFormItems());
    setShowPortfolioAdd(true);
  }

  function signOutGoogleAccount() {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        activeUserEmail: "",
        activeUserName: ""
      }
    }));
    setStatusMessage("Signed out.");
  }

  function closePortfolioEditor() {
    setPortfolioFormItems(createDefaultPortfolioFormItems());
    setShowPortfolioAdd(false);
  }

  function updatePortfolioFormItem(itemId, field, value) {
    setPortfolioFormItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  }

  function addPortfolioFormRow() {
    setPortfolioFormItems((prev) => [...prev, createPortfolioFormRow(portfolioCategories[0] || "spent")]);
  }

  function removePortfolioFormRow(itemId) {
    setPortfolioFormItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== itemId)));
  }

  function addPortfolioCategory() {
    const category = normalizeCategoryText(newPortfolioCategory);
    if (!category) {
      return;
    }

    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        portfolioCategories: [...new Set([...(prev.settings.portfolioCategories || []), category])]
      }
    }));

    setNewPortfolioCategory("");
    setStatusMessage(`Category ${category} added.`);
  }

  async function submitHabit(event) {
    event.preventDefault();

    const entry = {
      id: makeId(),
      name: String(habitForm.name || ""),
      startTime: String(habitForm.startTime || ""),
      endTime: String(habitForm.endTime || ""),
      ownerEmail: activeUserEmail,
      completions: {},
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({ ...prev, habits: [entry, ...prev.habits] }));
    setHabitForm({ name: "", startTime: "", endTime: "" });
    setShowHabitAdd(false);
    await tryImmediateSync("habit", entry);
  }

  async function toggleHabitCompletion(habitId, checked) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }
        updated = {
          ...habit,
          completions: {
            ...(habit.completions || {}),
            [habitDate]: checked
          },
          syncStatus: "pending"
        };
        return updated;
      })
    }));
    if (updated) {
      await tryImmediateSync("habit", updated);
    }
  }

  async function deleteHabit(habitId) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }
        updated = { ...habit, deleted: true, syncStatus: "pending" };
        return updated;
      })
    }));
    if (updated) {
      await tryImmediateSync("habit", updated);
    }
  }

  async function submitTask(event) {
    event.preventDefault();

    const entry = {
      id: makeId(),
      title: String(taskForm.title || ""),
      completionTime: String(taskForm.completionTime || ""),
      notes: String(taskForm.notes || ""),
      ownerEmail: activeUserEmail,
      completed: false,
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({ ...prev, tasks: [entry, ...prev.tasks] }));
    setTaskForm({ title: "", completionTime: "", notes: "" });
    setShowTaskAdd(false);
    await tryImmediateSync("task", entry);
  }

  async function toggleTaskCompletion(taskId, checked) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }
        updated = {
          ...task,
          completed: checked,
          completedAt: checked ? new Date().toISOString() : "",
          syncStatus: "pending"
        };
        return updated;
      })
    }));
    if (updated) {
      await tryImmediateSync("task", updated);
    }
  }

  async function deleteTask(taskId) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }
        updated = { ...task, deleted: true, syncStatus: "pending" };
        return updated;
      })
    }));
    if (updated) {
      await tryImmediateSync("task", updated);
    }
  }

  function editTrade(trade) {
    setTradeForm({ date: trade.date || getToday(), target: String(trade.target ?? "") });
    setShowTradeAdd(true);
  }

  async function deleteTrade(tradeId) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      trades: prev.trades.map((trade) => {
        if (trade.id !== tradeId) {
          return trade;
        }
        updated = { ...trade, deleted: true, syncStatus: "pending" };
        return updated;
      })
    }));
    if (updated) {
      await tryImmediateSync("trade", updated);
    }
  }

  async function saveTarget(event) {
    event.preventDefault();
    const date = tradeForm.date || getToday();
    const target = Number(tradeForm.target || 0);

    const existing = state.trades.find((trade) => !trade.deleted && belongsToActiveUser(trade) && trade.date === date);
    if (existing) {
      const updated = { ...existing, date, target, achievedPercent: calculateAchievedPercent(target, existing.achieved || 0), syncStatus: "pending" };
      setState((prev) => ({ ...prev, trades: prev.trades.map((trade) => (trade.id === existing.id ? updated : trade)) }));
      await tryImmediateSync("trade", updated);
      setShowTradeAdd(false);
      return;
    }

    const entry = {
      id: makeId(),
      date,
      target,
      achieved: 0,
      achievedPercent: 0,
      ownerEmail: activeUserEmail,
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({ ...prev, trades: [entry, ...prev.trades] }));
    setTradeForm({ date: getToday(), target: "" });
    setShowTradeAdd(false);
    await tryImmediateSync("trade", entry);
  }

  async function saveAchieved(tradeId) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      trades: prev.trades.map((trade) => {
        if (trade.id !== tradeId) {
          return trade;
        }
        const achieved = Number(tradeAchievedDrafts[tradeId] ?? trade.achieved ?? 0);
        updated = { ...trade, achieved, achievedPercent: calculateAchievedPercent(trade.target, achieved), syncStatus: "pending" };
        return updated;
      })
    }));
    if (updated) {
      await tryImmediateSync("trade", updated);
    }
  }

  async function savePortfolio(event) {
    event.preventDefault();

    const cleanedItems = portfolioFormItems.map((item) => ({
      id: item.id || makeId(),
      label: String(item.label || ""),
      category: normalizePortfolioCategory(item.category),
      amount: item.amount === "" ? null : Number(item.amount || 0)
    }));

    const existing = state.portfolios.find((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.month === portfolioMonth);
    const nextEntry = {
      id: existing ? existing.id : makeId(),
      month: portfolioMonth,
      items: cleanedItems,
      ownerEmail: activeUserEmail,
      deleted: false,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({
      ...prev,
      portfolios: existing ? prev.portfolios.map((entry) => (entry.id === existing.id ? nextEntry : entry)) : [nextEntry, ...prev.portfolios]
    }));

    await tryImmediateSync("portfolio", nextEntry);
    closePortfolioEditor();
  }

  async function deletePortfolio(portfolioId) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      portfolios: prev.portfolios.map((entry) => {
        if (entry.id !== portfolioId) {
          return entry;
        }
        updated = { ...entry, deleted: true, syncStatus: "pending" };
        return updated;
      })
    }));

    if (updated) {
      await tryImmediateSync("portfolio", updated);
      if (updated.month === portfolioMonth) {
        closePortfolioEditor();
      }
    }
  }

  async function syncPortfolio(portfolioId) {
    const entry = state.portfolios.find((item) => item.id === portfolioId);
    if (!entry) {
      return;
    }

    if (!state.settings.sheetUrl) {
      setStatusMessage("Add your Google Apps Script URL before syncing.");
      return;
    }

    const success = await pushEntry("portfolio", entry, state.settings.sheetUrl);
    updateSyncStatus("portfolio", entry.id, success ? "synced" : "failed");
    setStatusMessage(success ? "Portfolio synced." : "Portfolio sync failed.");
  }

  async function saveStock(event) {
    event.preventDefault();
    const entry = {
      id: makeId(),
      stockName: String(stockForm.stockName || ""),
      category: String(stockForm.category || ""),
      buyAmount: stockForm.buyAmount === "" ? null : Number(stockForm.buyAmount || 0),
      buyDate: String(stockForm.buyDate || getToday()),
      quantity: stockForm.quantity === "" ? null : Number(stockForm.quantity || 0),
      ownerEmail: activeUserEmail,
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({ ...prev, stocks: [entry, ...prev.stocks] }));
    setStockForm({ stockName: "", category: "", buyAmount: "", buyDate: getToday(), quantity: "" });
    setShowStockAdd(false);
    await tryImmediateSync("stock", entry);
  }

  async function deleteStock(stockId) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      stocks: prev.stocks.map((stock) => {
        if (stock.id !== stockId) {
          return stock;
        }

        updated = { ...stock, deleted: true, syncStatus: "pending" };
        return updated;
      })
    }));

    if (updated) {
      await tryImmediateSync("stock", updated);
    }
  }

  async function syncPendingEntries() {
    if (!state.settings.sheetUrl) {
      setStatusMessage("Add your Google Apps Script URL before syncing.");
      return;
    }

    const pending = [
      ...state.habits.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "habit", entry })),
      ...state.tasks.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "task", entry })),
      ...state.trades.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "trade", entry })),
      ...state.portfolios.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "portfolio", entry })),
      ...state.stocks.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "stock", entry }))
    ];

    if (!pending.length) {
      setStatusMessage("Nothing to sync.");
      return;
    }

    let syncedCount = 0;
    for (const item of pending) {
      const success = await pushEntry(item.type, item.entry, state.settings.sheetUrl);
      updateSyncStatus(item.type, item.entry.id, success ? "synced" : "failed");
      if (success) {
        syncedCount += 1;
      }
    }

    setStatusMessage(`${syncedCount} of ${pending.length} synced.`);
  }

  async function tryImmediateSync(type, entry) {
    if (!state.settings.sheetUrl) {
      setStatusMessage("Saved locally. Add Google Apps Script URL for sync.");
      return;
    }

    const success = await pushEntry(type, entry, state.settings.sheetUrl);
    updateSyncStatus(type, entry.id, success ? "synced" : "failed");
    setStatusMessage(success ? "Saved and synced." : "Saved locally. Sync failed.");
  }

  function updateSyncStatus(type, id, syncStatus) {
    const key = getStateKeyForType(type);
    setState((prev) => ({
      ...prev,
      [key]: prev[key].map((entry) => (entry.id === id ? { ...entry, syncStatus } : entry))
    }));
  }

  const habitMonthDays = getDaysInMonth(habitMonth);
  const habitMonthHabits = state.habits.filter((habit) => !habit.deleted && belongsToActiveUser(habit));

  return (
    <div className="app-shell">
      <nav className="top-nav" aria-label="Main navigation">
        <div className="tab-scroll-wrap">
          <div className="tab-strip" aria-label="Tracker tabs">
            <button className={`tab-button ${activeTab === "habit" ? "is-active" : ""}`} type="button" onClick={() => setActiveTab("habit")}>
              <span className="tab-icon" title="Habit"><HabitTabIcon /></span>
              <span className="tab-text">Habit</span>
            </button>
            <button className={`tab-button ${activeTab === "task" ? "is-active" : ""}`} type="button" onClick={() => setActiveTab("task")}>
              <span className="tab-icon" title="Task"><TaskTabIcon /></span>
              <span className="tab-text">Task</span>
            </button>
            <button className={`tab-button ${activeTab === "trading" ? "is-active" : ""}`} type="button" onClick={() => setActiveTab("trading")}>
              <span className="tab-icon" title="Trading"><TradingTabIcon /></span>
              <span className="tab-text">Trading</span>
            </button>
            <button className={`tab-button ${activeTab === "portfolio" ? "is-active" : ""}`} type="button" onClick={() => setActiveTab("portfolio")}>
              <span className="tab-icon" title="Portfolio"><PortfolioTabIcon /></span>
              <span className="tab-text">Portfolio</span>
            </button>
            <button className={`tab-button ${activeTab === "stocks" ? "is-active" : ""}`} type="button" onClick={() => setActiveTab("stocks")}>
              <span className="tab-icon" title="Stocks"><StocksTabIcon /></span>
              <span className="tab-text">Stocks</span>
            </button>
          </div>
        </div>

        <div className="nav-settings-wrap">
          <button className="settings-icon-button tab-settings-button" type="button" aria-expanded={showSettings} aria-controls="navSettingsPanel" aria-label="Open sync settings" onClick={() => setShowSettings((prev) => !prev)}>
            <SettingsIcon />
          </button>

          <section id="navSettingsPanel" className={`nav-settings-panel ${showSettings ? "" : "hidden"}`}>
            <div className="settings-panel-header">
              <p className="muted">Sync and account settings</p>
              <button className="close-icon-button" type="button" aria-label="Close settings" onClick={() => setShowSettings(false)}>
                <CloseIcon />
              </button>
            </div>

            <form className="settings-form" onSubmit={(event) => { event.preventDefault(); setShowSettings(false); setStatusMessage("Settings saved."); }}>
              <label>
                Google Apps Script Web App URL
                <input type="url" value={state.settings.sheetUrl} onChange={(event) => updateSettingsField("sheetUrl", event.target.value.trim())} placeholder="https://script.google.com/macros/s/.../exec" />
              </label>
              <label>
                Google account email
                <input
                  type="email"
                  value={state.settings.activeUserEmail}
                  onChange={(event) => updateSettingsField("activeUserEmail", event.target.value.toLowerCase())}
                  placeholder="youremail@gmail.com"
                />
              </label>
              <p className="muted settings-help">Account-specific filtering works with just email. Signed-in account: {state.settings.activeUserEmail || "Not selected"}</p>

              <label>
                Google OAuth Web Client ID (optional)
                <input value={state.settings.googleClientId} onChange={(event) => updateSettingsField("googleClientId", event.target.value.trim())} placeholder="Optional: paste OAuth client ID for one-click login" />
              </label>
              {state.settings.googleClientId ? <div id="googleSignInButton"></div> : null}
              {state.settings.activeUserEmail ? <button className="button button-secondary" type="button" onClick={signOutGoogleAccount}>Sign out</button> : null}
              <button className="button" type="submit">Save settings</button>
              <button className="button button-secondary" type="button" onClick={syncPendingEntries}>Sync pending entries</button>
            </form>
          </section>
        </div>
      </nav>

      <main className="page-content">
        {activeTab === "habit" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Habit tracker</h2>
              <div className="panel-actions">
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowHabitGraph((prev) => !prev)}><GraphIcon /></button>
                <button className="icon-add-button" type="button" title="Add habit" onClick={() => setShowHabitAdd((prev) => !prev)}><PlusIcon /></button>
              </div>
            </div>

            <StatStrip
              leftLabel="Completed"
              leftValue={habitCompletedCount}
              midLabel="Pending"
              midValue={habitPendingCount}
              rightLabel="Completion rate"
              rightValue={formatPercent(habitCompletedPercent)}
            />

            {showHabitAdd && (
              <form className="inline-add-form" onSubmit={submitHabit}>
                <div className="field-grid three-up">
                  <label>Habit name<input value={habitForm.name} onChange={(event) => setHabitForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
                  <label>
                    Start time
                    <div className="input-with-icon">
                      <input type="time" value={habitForm.startTime} onChange={(event) => setHabitForm((prev) => ({ ...prev, startTime: event.target.value }))} />
                      <button className="input-icon-button" type="button" aria-label="Open time picker" onClick={(event) => openPickerFromButton(event)}><ClockIcon /></button>
                    </div>
                  </label>
                  <label>
                    End time
                    <div className="input-with-icon">
                      <input type="time" value={habitForm.endTime} onChange={(event) => setHabitForm((prev) => ({ ...prev, endTime: event.target.value }))} />
                      <button className="input-icon-button" type="button" aria-label="Open time picker" onClick={(event) => openPickerFromButton(event)}><ClockIcon /></button>
                    </div>
                  </label>
                </div>
                <div className="panel-actions">
                  <button className="button" type="submit">Save habit</button>
                  <button className="button button-secondary" type="button" onClick={() => setShowHabitAdd(false)}>Close</button>
                </div>
              </form>
            )}

            {showHabitGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <div>
                    <h3>Habit monthly horizontal bar graph</h3>
                    <p className="muted">Bar width shows completion rate in the selected month</p>
                  </div>
                  <label className="month-picker">
                    Month
                    <input type="month" value={habitMonth} onChange={(event) => setHabitMonth(event.target.value || getCurrentMonth())} />
                  </label>
                </div>
                <div className="habit-horizontal-list">
                  {habitMonthHabits.length ? habitMonthHabits.map((habit) => {
                    const completionDays = getHabitCompletionDaysForMonth(habit, habitMonth);
                    const completionPercent = habitMonthDays ? (completionDays.length / habitMonthDays) * 100 : 0;
                    return (
                      <article key={`${habit.id}-${habitMonth}`} className="habit-horizontal-card">
                        <div className="habit-horizontal-header"><strong>{habit.name || "(No name)"}</strong><span className="muted">{completionDays.length}/{habitMonthDays} days ({formatPercent(completionPercent)})</span></div>
                        <div className="habit-horizontal-track" aria-label={`Habit completion bar for ${habitMonth}`}>
                          <span className="habit-horizontal-fill" style={{ width: `${Math.min(Math.max(completionPercent, 0), 100)}%` }}></span>
                        </div>
                      </article>
                    );
                  }) : <p className="muted">No habits saved yet.</p>}
                </div>
              </section>
            )}

            <div className="toolbar-grid">
              <label>
                Selected date
                <input type="date" value={habitDate} onChange={(event) => setHabitDate(event.target.value || getToday())} />
              </label>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start</th>
                    <th>End</th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleHabits.length ? visibleHabits.map((habit) => {
                    const completed = isHabitCompletedOnDate(habit, habitDate);
                    return (
                      <tr key={habit.id} className={completed ? "completed-row" : ""}>
                        <td>{habit.name || "-"}</td>
                        <td>{formatTime(habit.startTime)}</td>
                        <td>{formatTime(habit.endTime)}</td>
                        <td>
                          <label className="switch">
                            <input type="checkbox" checked={completed} onChange={(event) => toggleHabitCompletion(habit.id, event.target.checked)} />
                            <span className="switch-slider"></span>
                          </label>
                        </td>
                        <td>{makeSyncIcon(habit.syncStatus)}</td>
                        <td><button className="icon-button" type="button" aria-label="Delete habit" title="Delete habit" onClick={() => deleteHabit(habit.id)}><TrashIcon /></button></td>
                      </tr>
                    );
                  }) : <tr><td colSpan="6">No habits available for this date.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "task" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Task tracker</h2>
              <div className="panel-actions">
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowTaskGraph((prev) => !prev)}><GraphIcon /></button>
                <button className="icon-add-button" type="button" title="Add task" onClick={() => setShowTaskAdd((prev) => !prev)}><PlusIcon /></button>
              </div>
            </div>

            <StatStrip leftLabel="Completed" leftValue={taskCompletedCount} midLabel="Pending" midValue={taskPendingCount} rightLabel="Completion rate" rightValue={formatPercent(taskCompletedPercent)} />

            {showTaskAdd && (
              <form className="inline-add-form" onSubmit={submitTask}>
                <div className="field-grid three-up">
                  <label>Task name<input value={taskForm.title} onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
                  <label>
                    Completion time
                    <input type="datetime-local" value={taskForm.completionTime} onChange={(event) => setTaskForm((prev) => ({ ...prev, completionTime: event.target.value }))} />
                  </label>
                  <label>Notes<input value={taskForm.notes} onChange={(event) => setTaskForm((prev) => ({ ...prev, notes: event.target.value }))} /></label>
                </div>
                <div className="panel-actions">
                  <button className="button" type="submit">Save task</button>
                  <button className="button button-secondary" type="button" onClick={() => setShowTaskAdd(false)}>Close</button>
                </div>
              </form>
            )}

            {showTaskGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <h3>Task activity graph</h3>
                  <p className="muted">Tasks added, completed on time, and delayed completions</p>
                </div>
                <div className="mini-graph task-metric-bars">
                  <div>
                    <span>Tasks added</span>
                    <div className="bar-track"><div className="bar-fill positive-fill" style={{ width: `${taskAddedCount ? 100 : 0}%` }}></div></div>
                    <small>{taskAddedCount}</small>
                  </div>
                  <div>
                    <span>Completed on time</span>
                    <div className="bar-track"><div className="bar-fill positive-fill" style={{ width: `${taskAddedCount ? (taskOnTimeCount / taskAddedCount) * 100 : 0}%` }}></div></div>
                    <small>{taskOnTimeCount}</small>
                  </div>
                  <div>
                    <span>Delayed completion</span>
                    <div className="bar-track"><div className="bar-fill negative-fill" style={{ width: `${taskAddedCount ? (taskDelayedCount / taskAddedCount) * 100 : 0}%` }}></div></div>
                    <small>{taskDelayedCount}</small>
                  </div>
                </div>
              </section>
            )}

            <div className="toolbar-grid">
              <label>
                Completion date filter
                <input type="date" value={taskFilterDate} onChange={(event) => setTaskFilterDate(event.target.value)} />
              </label>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Completion time</th>
                    <th>Notes</th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length ? filteredTasks.map((task) => (
                    <tr key={task.id} className={task.completed ? "completed-row" : ""}>
                      <td>{task.title || "-"}</td>
                      <td>{formatDateTime(task.completionTime)}</td>
                      <td>{task.notes || "-"}</td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={task.completed} onChange={(event) => toggleTaskCompletion(task.id, event.target.checked)} />
                          <span className="switch-slider"></span>
                        </label>
                      </td>
                      <td>{makeSyncIcon(task.syncStatus)}</td>
                      <td><button className="icon-button" type="button" aria-label="Delete task" title="Delete task" onClick={() => deleteTask(task.id)}><TrashIcon /></button></td>
                    </tr>
                  )) : <tr><td colSpan="6">No tasks found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "trading" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Trading tracker</h2>
              <div className="panel-actions">
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowTradeGraph((prev) => !prev)}><GraphIcon /></button>
                <button className="icon-add-button" type="button" title="Add daily target" onClick={() => setShowTradeAdd((prev) => !prev)}><PlusIcon /></button>
              </div>
            </div>

            {showTradeAdd && (
              <form className="inline-add-form" onSubmit={saveTarget}>
                <div className="field-grid two-up">
                  <label>
                    Date
                    <input type="date" value={tradeForm.date} onChange={(event) => setTradeForm((prev) => ({ ...prev, date: event.target.value }))} />
                  </label>
                  <label>Daily target<input type="number" step="0.01" value={tradeForm.target} onChange={(event) => setTradeForm((prev) => ({ ...prev, target: event.target.value }))} /></label>
                </div>
                <div className="panel-actions">
                  <button className="button" type="submit">Save daily target</button>
                  <button className="button button-secondary" type="button" onClick={() => setShowTradeAdd(false)}>Close</button>
                </div>
              </form>
            )}

            {showTradeGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <h3>Daily PnL graph</h3>
                  <p className="muted">X axis: day | Y axis: amount</p>
                </div>
                {tradeChart ? (
                  <div className="line-chart-wrap">
                    <svg viewBox={`0 0 ${tradeChart.width} ${tradeChart.height}`} className="line-chart" role="img" aria-label="Daily target and achieved trend chart">
                      {tradeChart.yTicks.map((tick, index) => {
                        const y = tradeChart.toY(tick);
                        return (
                          <g key={`tick-${index}`}>
                            <line x1={tradeChart.leftPad} y1={y} x2={tradeChart.width - tradeChart.rightPad} y2={y} className="line-grid" />
                            <text x={8} y={y + 4} className="line-y-label">{formatNumber(tick)}</text>
                          </g>
                        );
                      })}

                      {dailyTradesAsc.map((trade, index) => {
                        const x = tradeChart.toX(index);
                        return <text key={trade.id} x={x} y={tradeChart.height - 14} textAnchor="middle" className="line-x-label">{trade.date.slice(5)}</text>;
                      })}

                      <polyline points={tradeChart.targetPoints} className="line-target" />
                      <polyline points={tradeChart.achievedPoints} className="line-achieved" />
                    </svg>

                    <div className="line-legend">
                      <span><i className="legend-dot legend-target"></i>Target (green)</span>
                      <span><i className="legend-dot legend-achieved"></i>Achieved (red)</span>
                    </div>
                  </div>
                ) : <p className="muted">No graph data available.</p>}
              </section>
            )}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Target</th>
                    <th>Achieved</th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {dailyTradesDesc.length ? dailyTradesDesc.map((trade) => {
                    const draftValue = tradeAchievedDrafts[trade.id];
                    const value = draftValue !== undefined ? draftValue : trade.achieved;
                    return (
                      <tr key={trade.id}>
                        <td>{trade.date}</td>
                        <td>{formatNumber(trade.target)}</td>
                        <td><input type="number" step="0.01" value={value ?? ""} onChange={(event) => setTradeAchievedDrafts((prev) => ({ ...prev, [trade.id]: event.target.value }))} /></td>
                        <td><button className="icon-save-button" type="button" title="Save achieved" aria-label="Save achieved" onClick={() => saveAchieved(trade.id)}><SaveIcon /></button></td>
                        <td>
                          <div className="row-action-group">
                            <button className="icon-button" type="button" aria-label="Edit target" title="Edit target" onClick={() => editTrade(trade)}><EditIcon /></button>
                            <button className="icon-button" type="button" aria-label="Delete target" title="Delete target" onClick={() => deleteTrade(trade.id)}><TrashIcon /></button>
                          </div>
                        </td>
                        <td>{makeSyncIcon(trade.syncStatus)}</td>
                      </tr>
                    );
                  }) : <tr><td colSpan="6">No daily target rows yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "portfolio" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Portfolio tracker</h2>
              <div className="panel-actions">
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowPortfolioGraph((prev) => !prev)}><GraphIcon /></button>
              </div>
            </div>

            <div className="toolbar-grid toolbar-grid-two">
              <label>
                Month
                <input type="month" value={portfolioMonth} onChange={(event) => setPortfolioMonth(event.target.value || getCurrentMonth())} />
              </label>
              <div className="portfolio-toolbar-actions">
                <button className="button button-secondary" type="button" title="Open selected month" onClick={() => openPortfolioEditor()}>Open selected month</button>
                <button className="icon-save-button" type="button" title="Sync selected month" disabled={!currentPortfolio} onClick={() => currentPortfolio && syncPortfolio(currentPortfolio.id)}><SyncIcon /></button>
                <button className="icon-button" type="button" title="Delete selected month" disabled={!currentPortfolio} onClick={() => currentPortfolio && deletePortfolio(currentPortfolio.id)}><TrashIcon /></button>
              </div>
            </div>

            <div className="summary-grid report-grid compact-row">
              <article className="summary-card"><span>Income</span><strong>{formatNumber(currentPortfolioSummary.income)}</strong></article>
              <article className="summary-card"><span>Investment</span><strong>{formatNumber(currentPortfolioSummary.investment)}</strong></article>
              <article className="summary-card"><span>Spent</span><strong>{formatNumber(currentPortfolioSummary.spent)}</strong></article>
            </div>
            <div className="summary-grid report-grid compact-row">
              <article className="summary-card"><span>Remaining</span><strong>{formatNumber(currentPortfolioSummary.remaining)}</strong></article>
              <article className="summary-card"><span>Categories</span><strong>{portfolioCategories.length}</strong></article>
              <article className="summary-card"><span>Active account</span><strong>{state.settings.activeUserEmail || "All local entries"}</strong></article>
            </div>

            {showPortfolioAdd && (
              <form className="inline-add-form" onSubmit={savePortfolio}>
                <div className="portfolio-form-header">
                  <div>
                    <strong>Portfolio details for {formatMonthLabel(portfolioMonth)}</strong>
                    <p className="muted">All fields are optional. You can save empty values too.</p>
                  </div>
                  <div className="portfolio-toolbar-actions">
                    <button className="button button-secondary" type="button" onClick={addPortfolioFormRow}>Add row</button>
                    <button className="button button-secondary" type="button" onClick={closePortfolioEditor}>Close</button>
                  </div>
                </div>

                <div className="field-grid three-up">
                  <label>New category<input value={newPortfolioCategory} onChange={(event) => setNewPortfolioCategory(event.target.value)} placeholder="Example: savings" /></label>
                  <div className="panel-actions"><button className="button button-secondary" type="button" onClick={addPortfolioCategory}>Add category</button></div>
                  <div className="muted">Current categories: {portfolioCategories.join(", ")}</div>
                </div>

                <div className="table-wrap portfolio-form-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th className="icon-col"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioFormItems.map((item) => (
                        <tr key={item.id}>
                          <td><input value={item.label} onChange={(event) => updatePortfolioFormItem(item.id, "label", event.target.value)} placeholder="Entry name" /></td>
                          <td>
                            <select value={item.category} onChange={(event) => updatePortfolioFormItem(item.id, "category", event.target.value)}>
                              {portfolioCategories.map((category) => <option key={category} value={category}>{capitalize(category)}</option>)}
                            </select>
                          </td>
                          <td><input type="number" step="0.01" value={item.amount} onChange={(event) => updatePortfolioFormItem(item.id, "amount", event.target.value)} placeholder="0.00" /></td>
                          <td><button className="icon-button" type="button" aria-label="Remove row" title="Remove row" onClick={() => removePortfolioFormRow(item.id)}><TrashIcon /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button className="button" type="submit">Save portfolio month</button>
              </form>
            )}

            {showPortfolioGraph && (
              <section className="graph-panel">
                <div className="graph-header portfolio-graph-header">
                  <div>
                    <h3>Portfolio pie charts</h3>
                    <p className="muted">Switch between monthly, yearly, and all saved records.</p>
                  </div>
                  <div className="portfolio-graph-controls">
                    <label className="month-picker">
                      Graph range
                      <select value={portfolioGraphRange} onChange={(event) => setPortfolioGraphRange(event.target.value)}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="all">All</option>
                      </select>
                    </label>

                    {portfolioGraphRange === "yearly" ? (
                      <label className="month-picker">
                        Year
                        <select value={portfolioGraphYear} onChange={(event) => setPortfolioGraphYear(event.target.value)}>
                          {portfolioYears.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                      </label>
                    ) : null}

                    {portfolioGraphRange === "monthly" ? (
                      <label className="month-picker">
                        Month (current year)
                        <input
                          type="month"
                          value={portfolioGraphMonth}
                          min={`${new Date().getFullYear()}-01`}
                          max={`${new Date().getFullYear()}-12`}
                          onChange={(event) => setPortfolioGraphMonth(event.target.value || getCurrentMonth())}
                        />
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className="portfolio-chart-grid">
                  <PieChart title="Breakdown by entry" totalLabel={getPortfolioRangeLabel(portfolioGraphRange, graphScopeValue)} data={portfolioItemPieData} emptyMessage="No portfolio values available for this range." />
                  <PieChart title="Income vs investment vs spent vs remaining" totalLabel={getPortfolioRangeLabel(portfolioGraphRange, graphScopeValue)} data={portfolioCategoryPieData} emptyMessage="No category totals available for this range." />
                </div>
              </section>
            )}

            <div className="table-wrap compact-row">
              <table>
                <thead>
                  <tr>
                    <th>Entry</th>
                    <th>Category</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPortfolio ? currentPortfolio.items.map((item) => <tr key={item.id}><td>{item.label || "-"}</td><td>{capitalize(item.category)}</td><td>{formatNumber(item.amount)}</td></tr>) : <tr><td colSpan="3">No portfolio saved for the selected month.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Income</th>
                    <th>Investment</th>
                    <th>Spent</th>
                    <th>Remaining</th>
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioEntriesDesc.length ? portfolioEntriesDesc.map((entry) => {
                    const summary = summarizePortfolioItems(entry.items);
                    return (
                      <tr key={entry.id} className={entry.month === portfolioMonth ? "selected-row" : ""}>
                        <td>{formatMonthLabel(entry.month)}</td>
                        <td>{formatNumber(summary.income)}</td>
                        <td>{formatNumber(summary.investment)}</td>
                        <td>{formatNumber(summary.spent)}</td>
                        <td>{formatNumber(summary.remaining)}</td>
                        <td>
                          <div className="row-action-group row-action-group-wrap">
                            <button className="icon-save-button" type="button" title="Sync month" onClick={() => syncPortfolio(entry.id)}><SyncIcon /></button>
                            <button className="icon-button" type="button" title="Edit month" onClick={() => openPortfolioEditor(entry.month)}><EditIcon /></button>
                            <button className="icon-button" type="button" title="Delete month" onClick={() => deletePortfolio(entry.id)}><TrashIcon /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan="6">No portfolio months saved yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "stocks" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Stocks tracker</h2>
              <div className="panel-actions">
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowStockGraph((prev) => !prev)}><GraphIcon /></button>
                <button className="icon-save-button" type="button" title="Sync all stocks" onClick={syncPendingEntries}><SyncIcon /></button>
                <button className="icon-add-button" type="button" title="Add stock" onClick={() => setShowStockAdd((prev) => !prev)}><PlusIcon /></button>
              </div>
            </div>

            {showStockAdd && (
              <form className="inline-add-form" onSubmit={saveStock}>
                <div className="field-grid three-up">
                  <label>Stock name<input value={stockForm.stockName} onChange={(event) => setStockForm((prev) => ({ ...prev, stockName: event.target.value }))} /></label>
                  <label>Category<input value={stockForm.category} onChange={(event) => setStockForm((prev) => ({ ...prev, category: event.target.value }))} /></label>
                  <label>Buy amount<input type="number" step="0.01" value={stockForm.buyAmount} onChange={(event) => setStockForm((prev) => ({ ...prev, buyAmount: event.target.value }))} /></label>
                </div>
                <div className="field-grid two-up">
                  <label>
                    Buy date
                    <input type="date" value={stockForm.buyDate} onChange={(event) => setStockForm((prev) => ({ ...prev, buyDate: event.target.value }))} />
                  </label>
                  <label>Quantity<input type="number" step="0.01" value={stockForm.quantity} onChange={(event) => setStockForm((prev) => ({ ...prev, quantity: event.target.value }))} /></label>
                </div>
                <div className="panel-actions">
                  <button className="button" type="submit">Save stock</button>
                  <button className="button button-secondary" type="button" onClick={() => setShowStockAdd(false)}>Close</button>
                </div>
              </form>
            )}

            {showStockGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <h3>Stock allocation bar graph</h3>
                  <p className="muted">Allocation by stock based on buy amount × quantity</p>
                </div>
                {stockAllocation.length ? (
                  <div className="stock-bars">
                    {stockAllocation.map((item) => {
                      const width = stockTotalInvested ? (item.value / stockTotalInvested) * 100 : 0;
                      return (
                        <article key={item.label} className="stock-bar-item">
                          <div className="stock-bar-head"><strong>{item.label}</strong><small>{formatNumber(item.value)}</small></div>
                          <div className="stock-bar-track"><span className="stock-bar-fill" style={{ width: `${width}%`, background: item.color }}></span></div>
                        </article>
                      );
                    })}
                  </div>
                ) : <p className="muted">No stock allocation data yet.</p>}
              </section>
            )}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Category</th>
                    <th>Buy amount</th>
                    <th>Buy date</th>
                    <th>Quantity</th>
                    <th>Invested</th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {stocksDesc.length ? stocksDesc.map((stock) => {
                    const invested = Number(stock.buyAmount || 0) * Number(stock.quantity || 0);
                    return (
                      <tr key={stock.id}>
                        <td>{stock.stockName || "-"}</td>
                        <td>{stock.category || "-"}</td>
                        <td>{formatNumber(stock.buyAmount)}</td>
                        <td>{stock.buyDate || "-"}</td>
                        <td>{formatNumber(stock.quantity)}</td>
                        <td>{formatNumber(invested)}</td>
                        <td>{makeSyncIcon(stock.syncStatus)}</td>
                        <td><button className="icon-button" type="button" title="Delete stock" onClick={() => deleteStock(stock.id)}><TrashIcon /></button></td>
                      </tr>
                    );
                  }) : <tr><td colSpan="8">No stocks saved yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="summary-grid report-grid compact-row">
              <article className="summary-card stock-total-card"><span>Total amount invested</span><strong>{formatNumber(stockTotalInvested)}</strong></article>
            </div>
          </section>
        )}
      </main>

      <div className={`status-toast ${statusMessage ? "visible" : ""}`} aria-live="polite">{statusMessage}</div>
    </div>
  );
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || localStorage.getItem("habitTaskTradingTracker.v5")
      || localStorage.getItem("habitTaskTradingTracker.v4")
      || localStorage.getItem("habitTaskTradingTracker.v3")
      || localStorage.getItem("habitTaskTradingTracker.v2")
      || localStorage.getItem("habitTaskTradingTracker.v1");

    if (!raw) {
      return structuredClone(defaultState);
    }

    const parsed = JSON.parse(raw);
    return {
      settings: {
        ...defaultState.settings,
        ...(parsed.settings || {}),
        googleClientId: String((parsed.settings && parsed.settings.googleClientId) || ""),
        activeUserEmail: String((parsed.settings && parsed.settings.activeUserEmail) || "").trim().toLowerCase(),
        activeUserName: String((parsed.settings && parsed.settings.activeUserName) || ""),
        portfolioCategories: Array.isArray(parsed.settings && parsed.settings.portfolioCategories) ? parsed.settings.portfolioCategories.map(normalizeCategoryText).filter(Boolean) : []
      },
      habits: Array.isArray(parsed.habits) ? parsed.habits.map(normalizeHabit) : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTask) : [],
      trades: Array.isArray(parsed.trades) ? parsed.trades.map(normalizeTrade) : [],
      portfolios: Array.isArray(parsed.portfolios) ? parsed.portfolios.map(normalizePortfolio) : [],
      stocks: Array.isArray(parsed.stocks) ? parsed.stocks.map(normalizeStock) : []
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
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
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
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
    completed: entry.completed === true || entry.status === "Done",
    completedAt: entry.completedAt || "",
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function normalizeTrade(entry) {
  const target = Number(entry.target ?? 0);
  const achieved = Number(entry.achieved ?? entry.actualPnl ?? entry.pnl ?? 0);
  return {
    id: entry.id || makeId(),
    date: entry.date || getToday(),
    target,
    achieved,
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
    achievedPercent: calculateAchievedPercent(target, achieved),
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function normalizePortfolio(entry) {
  return {
    id: entry.id || makeId(),
    month: normalizeMonthValue(entry.month || getCurrentMonth()),
    items: Array.isArray(entry.items) ? entry.items.map(normalizePortfolioItem) : [],
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function normalizePortfolioItem(item) {
  return {
    id: item.id || makeId(),
    label: String(item.label || item.name || ""),
    category: normalizePortfolioCategory(item.category),
    amount: item.amount === null || item.amount === "" || item.amount === undefined ? null : Number(item.amount || 0)
  };
}

function normalizeStock(entry) {
  return {
    id: entry.id || makeId(),
    stockName: String(entry.stockName || ""),
    category: String(entry.category || ""),
    buyAmount: entry.buyAmount === null || entry.buyAmount === "" || entry.buyAmount === undefined ? null : Number(entry.buyAmount || 0),
    buyDate: String(entry.buyDate || getToday()),
    quantity: entry.quantity === null || entry.quantity === "" || entry.quantity === undefined ? null : Number(entry.quantity || 0),
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function createDefaultPortfolioFormItems() {
  return PORTFOLIO_PRESET_ROWS.map((item) => ({
    id: makeId(),
    label: item.label,
    category: item.category,
    amount: ""
  }));
}

function createPortfolioFormRow(category) {
  return {
    id: makeId(),
    label: "",
    category: category || "spent",
    amount: ""
  };
}

function mapPortfolioItemsToForm(items) {
  return items.map((item) => ({
    id: item.id || makeId(),
    label: item.label || "",
    category: normalizePortfolioCategory(item.category),
    amount: item.amount === null ? "" : String(item.amount ?? "")
  }));
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

function getHabitStartDate(entry) {
  return (entry.createdAt || getToday()).slice(0, 10);
}

function isHabitCompletedOnDate(entry, date) {
  return Boolean(entry.completions && entry.completions[date]);
}

function sortHabitsForDate(habits, date) {
  return [...habits].sort((left, right) => {
    const leftCompleted = isHabitCompletedOnDate(left, date);
    const rightCompleted = isHabitCompletedOnDate(right, date);
    if (leftCompleted !== rightCompleted) {
      return leftCompleted ? 1 : -1;
    }
    return (left.name || "").localeCompare(right.name || "");
  });
}

function sortTasksByCompletion(tasks) {
  return [...tasks].sort((left, right) => {
    if (left.completed !== right.completed) {
      return left.completed ? 1 : -1;
    }
    return (left.completionTime || left.createdAt || "").localeCompare(right.completionTime || right.createdAt || "");
  });
}

function calculateAchievedPercent(target, achieved) {
  if (!Number(target)) {
    return 0;
  }
  return (Number(achieved) / Number(target)) * 100;
}

function getDaysInMonth(monthValue) {
  const [yearPart, monthPart] = String(monthValue || getCurrentMonth()).split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!year || !month) {
    return 30;
  }
  return new Date(year, month, 0).getDate();
}

function getHabitCompletionDaysForMonth(habit, monthValue) {
  const monthPrefix = String(monthValue || getCurrentMonth());
  return Object.keys(habit.completions || {})
    .filter((dateKey) => dateKey.startsWith(monthPrefix) && habit.completions[dateKey])
    .map((dateKey) => Number(dateKey.slice(8, 10)));
}

function isTaskOnTime(task) {
  if (!task.completed) {
    return false;
  }
  if (!task.completionTime || !task.completedAt) {
    return true;
  }
  return new Date(task.completedAt).getTime() <= new Date(task.completionTime).getTime();
}

function isTaskDelayed(task) {
  if (!task.completed || !task.completionTime || !task.completedAt) {
    return false;
  }
  return new Date(task.completedAt).getTime() > new Date(task.completionTime).getTime();
}

function normalizeCategoryText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePortfolioCategory(category) {
  const normalized = normalizeCategoryText(category);
  return normalized || "spent";
}

function normalizeMonthValue(value) {
  return String(value || getCurrentMonth()).slice(0, 7);
}

function parseGoogleJwtProfile(token) {
  try {
    if (!token) {
      return { email: "", name: "" };
    }
    const parts = String(token).split(".");
    if (parts.length < 2) {
      return { email: "", name: "" };
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = decodeURIComponent(atob(base64).split("").map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`).join(""));
    const parsed = JSON.parse(decoded);
    return {
      email: String(parsed.email || "").trim().toLowerCase(),
      name: String(parsed.name || parsed.given_name || "")
    };
  } catch {
    return { email: "", name: "" };
  }
}

function summarizePortfolioItems(items) {
  const summary = { income: 0, investment: 0, spent: 0, remaining: 0, other: 0 };
  (items || []).forEach((item) => {
    const category = normalizePortfolioCategory(item.category);
    const amount = Number(item.amount || 0);
    if (category === "income") {
      summary.income += amount;
    } else if (category === "investment") {
      summary.investment += amount;
    } else if (category === "spent") {
      summary.spent += amount;
    } else {
      summary.other += amount;
    }
  });
  summary.remaining = Math.max(summary.income - summary.investment - summary.spent - summary.other, 0);
  return summary;
}

function getPortfolioRecordsForRange(portfolios, range, monthValue) {
  const activeEntries = portfolios.filter((entry) => !entry.deleted);
  if (range === "all") {
    return activeEntries;
  }
  if (range === "yearly") {
    const yearPrefix = normalizeMonthValue(monthValue).slice(0, 4);
    return activeEntries.filter((entry) => entry.month.startsWith(yearPrefix));
  }
  return activeEntries.filter((entry) => entry.month === normalizeMonthValue(monthValue));
}

function buildPortfolioItemPieData(portfolios, range, monthValue) {
  const totalsByLabel = new Map();
  getPortfolioRecordsForRange(portfolios, range, monthValue).forEach((record) => {
    record.items.forEach((item) => {
      const label = item.label || "Untitled";
      totalsByLabel.set(label, (totalsByLabel.get(label) || 0) + Number(item.amount || 0));
    });
  });

  return [...totalsByLabel.entries()]
    .map(([label, value], index) => ({ label, value, color: PIE_COLORS[index % PIE_COLORS.length] }))
    .filter((item) => item.value > 0)
    .sort((left, right) => right.value - left.value);
}

function buildPortfolioCategoryPieData(portfolios, range, monthValue) {
  const combined = getPortfolioRecordsForRange(portfolios, range, monthValue).reduce((accumulator, record) => {
    const summary = summarizePortfolioItems(record.items);
    accumulator.income += summary.income;
    accumulator.investment += summary.investment;
    accumulator.spent += summary.spent;
    accumulator.remaining += summary.remaining;
    accumulator.other += summary.other;
    return accumulator;
  }, { income: 0, investment: 0, spent: 0, remaining: 0, other: 0 });

  return [
    { label: "Income", value: combined.income, color: "#16a34a" },
    { label: "Investment", value: combined.investment, color: "#2563eb" },
    { label: "Spent", value: combined.spent, color: "#ef4444" },
    { label: "Other", value: combined.other, color: "#7c3aed" },
    { label: "Remaining", value: combined.remaining, color: "#f59e0b" }
  ].filter((item) => item.value > 0);
}

function getPortfolioRangeLabel(range, monthValue) {
  if (range === "all") {
    return "All records";
  }
  if (range === "yearly") {
    return `${normalizeMonthValue(monthValue).slice(0, 4)} total`;
  }
  return formatMonthLabel(monthValue);
}

async function pushEntry(type, entry, url) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({ type, payload: entry })
    });
    return response.ok;
  } catch {
    return false;
  }
}

function getStateKeyForType(type) {
  if (type === "habit") return "habits";
  if (type === "task") return "tasks";
  if (type === "trade") return "trades";
  if (type === "stock") return "stocks";
  return "portfolios";
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
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
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
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
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(parsed);
}

function formatMonthLabel(value) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(`${value}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(parsed);
}

function capitalize(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function makeSyncIcon(syncStatus) {
  const normalized = syncStatus || "pending";
  if (normalized === "synced") {
    return <span className="sync-icon sync-synced" title="Synced"><CheckIcon /></span>;
  }
  if (normalized === "failed") {
    return <span className="sync-icon sync-failed" title="Sync failed"><WarningIcon /></span>;
  }
  return <span className="sync-icon sync-pending" title="Pending sync"><ClockIcon /></span>;
}

function StatStrip({ leftLabel, leftValue, midLabel, midValue, rightLabel, rightValue }) {
  return (
    <article className="stat-strip">
      <div><span>{leftLabel}</span><strong>{leftValue}</strong></div>
      <div><span>{midLabel}</span><strong>{midValue}</strong></div>
      <div><span>{rightLabel}</span><strong>{rightValue}</strong></div>
    </article>
  );
}

function PieChart({ title, totalLabel, data, emptyMessage }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (!data.length || total <= 0) {
    return (
      <article className="pie-chart-card">
        <div className="graph-header compact-row"><div><h3>{title}</h3><p className="muted">{totalLabel}</p></div></div>
        <p className="muted">{emptyMessage}</p>
      </article>
    );
  }

  let cursor = 0;
  const segments = data.map((item) => {
    const start = cursor;
    const sweep = (Number(item.value || 0) / total) * 360;
    cursor += sweep;
    return `${item.color} ${start}deg ${cursor}deg`;
  }).join(", ");

  return (
    <article className="pie-chart-card">
      <div className="graph-header compact-row"><div><h3>{title}</h3><p className="muted">{totalLabel}</p></div></div>
      <div className="pie-chart-layout">
        <div className="pie-chart-circle" style={{ background: `conic-gradient(${segments})` }}>
          <span><strong>{formatNumber(total)}</strong><small>Total</small></span>
        </div>
        <div className="pie-chart-legend">
          {data.map((item) => {
            const percent = (Number(item.value || 0) / total) * 100;
            return (
              <div key={item.label} className="pie-chart-legend-item">
                <span className="pie-color-chip" style={{ backgroundColor: item.color }}></span>
                <div><strong>{item.label}</strong><small>{formatNumber(item.value)} • {formatPercent(percent)}</small></div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function SettingsIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19.14 12.94a7.94 7.94 0 0 0 .05-.94 7.94 7.94 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7.28 7.28 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.94 7.94 0 0 0-.05.94 7.94 7.94 0 0 0 .05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.38 1.05.7 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.24 1.13-.56 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" fill="currentColor" /></svg>;
}

function GraphIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3h2v18H3V3Zm16 6h2v12h-2V9ZM11 13h2v8h-2v-8Zm-4-4h2v12H7V9Zm8-6h2v18h-2V3Z" fill="currentColor" /></svg>;
}

function HabitTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10Zm-1-6 7-7-1.41-1.41L11 13.17l-2.59-2.58L7 12l4 4Z" fill="currentColor" /></svg>;
}

function TaskTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 3h-3.18C15.4 1.84 14.3 1 13 1h-2c-1.3 0-2.4.84-2.82 2H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-7 0h0ZM7 8h10v2H7V8Zm0 4h10v2H7v-2Zm0 4h7v2H7v-2Z" fill="currentColor" /></svg>;
}

function TradingTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 17h2.59l4.7-4.71 3 3L21 7.59 19.59 6l-6.3 6.29-3-3L4 15.59V13H2v6h6v-2H3Z" fill="currentColor" /></svg>;
}

function PortfolioTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2ZM10 4h4v2h-4V4Zm10 6H4v8h16v-8Z" fill="currentColor" /></svg>;
}

function StocksTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 20h16v2H2V2h2v18Zm2-4 3-3 3 2 6-6 2 2-8 8-3-2-2 2-1-1Z" fill="currentColor" /></svg>;
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.3 6.29-6.3Z" fill="currentColor" /></svg>;
}

function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1Zm1 12.6V6h-2v8.7l6 3.3 1-1.7Z" fill="currentColor" /></svg>;
}

function PlusIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2Z" fill="currentColor" /></svg>;
}

function SaveIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17 3H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2V7l-4-4ZM7 7h8v4H7V7Z" fill="currentColor" /></svg>;
}

function SyncIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 6V3L8 7l4 4V8c2.2 0 4 1.8 4 4a4 4 0 0 1-7.46 2H6.26A6 6 0 0 0 12 18a6 6 0 0 0 0-12Z" fill="currentColor" /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9Z" fill="currentColor"></path></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="m9.2 16.2-3.4-3.4 1.4-1.4 2 2 6-6 1.4 1.4-7.4 7.4Z" fill="currentColor"></path></svg>;
}

function WarningIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z" fill="currentColor"></path></svg>;
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25Zm17.71-10.46a1 1 0 0 0 0-1.41l-2.08-2.08a1 1 0 0 0-1.41 0l-1.63 1.63 3.75 3.75 1.37-1.89Z" fill="currentColor" /></svg>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
