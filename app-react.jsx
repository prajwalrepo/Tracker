const { useEffect, useMemo, useState } = React;

const STORAGE_KEY = "habitTaskTradingTracker.v4";

const defaultState = {
  settings: {
    sheetUrl: ""
  },
  habits: [],
  tasks: [],
  trades: []
};

function App() {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("habit");
  const [habitDate, setHabitDate] = useState(getToday());
  const [habitMonth, setHabitMonth] = useState(getToday().slice(0, 7));
  const [taskFilterDate, setTaskFilterDate] = useState("");

  const [showHabitGraph, setShowHabitGraph] = useState(false);
  const [showTaskGraph, setShowTaskGraph] = useState(false);
  const [showTradeGraph, setShowTradeGraph] = useState(false);
  const [showHabitAdd, setShowHabitAdd] = useState(false);
  const [showTaskAdd, setShowTaskAdd] = useState(false);
  const [showTradeAdd, setShowTradeAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [habitForm, setHabitForm] = useState({
    name: "",
    startTime: "",
    endTime: ""
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    completionTime: "",
    notes: ""
  });

  const [tradeForm, setTradeForm] = useState({
    date: getToday(),
    target: ""
  });

  const [tradeAchievedDrafts, setTradeAchievedDrafts] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timer = window.setTimeout(() => setStatusMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const visibleHabits = useMemo(() => {
    return state.habits.filter((habit) => !habit.deleted && getHabitStartDate(habit) <= habitDate);
  }, [state.habits, habitDate]);

  const filteredTasks = useMemo(() => {
    const activeTasks = state.tasks.filter((task) => !task.deleted);
    if (!taskFilterDate) {
      return activeTasks;
    }

    return activeTasks.filter((task) => String(task.completionTime || "").startsWith(taskFilterDate));
  }, [state.tasks, taskFilterDate]);

  const dailyTradesAsc = useMemo(() => {
    return state.trades
      .filter((trade) => !trade.deleted)
      .sort((left, right) => left.date.localeCompare(right.date));
  }, [state.trades]);

  const dailyTradesDesc = useMemo(() => {
    return [...dailyTradesAsc].sort((left, right) => right.date.localeCompare(left.date));
  }, [dailyTradesAsc]);

  const habitCompletedCount = visibleHabits.filter((habit) => isHabitCompletedOnDate(habit, habitDate)).length;
  const habitPendingCount = visibleHabits.length - habitCompletedCount;
  const habitCompletedPercent = visibleHabits.length ? (habitCompletedCount / visibleHabits.length) * 100 : 0;
  const habitMonthDays = getDaysInMonth(habitMonth);
  const habitMonthHabits = useMemo(() => state.habits.filter((habit) => !habit.deleted), [state.habits]);

  const taskCompletedCount = filteredTasks.filter((task) => task.completed).length;
  const taskPendingCount = filteredTasks.length - taskCompletedCount;
  const taskCompletedPercent = filteredTasks.length ? (taskCompletedCount / filteredTasks.length) * 100 : 0;
  const taskAddedCount = filteredTasks.length;
  const taskOnTimeCount = filteredTasks.filter((task) => isTaskOnTime(task)).length;
  const taskDelayedCount = filteredTasks.filter((task) => isTaskDelayed(task)).length;

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

    const yTicks = [maxY, (maxY + minY) / 2, minY];

    return {
      width,
      height,
      leftPad,
      rightPad,
      bottomPad,
      targetPoints,
      achievedPoints,
      yTicks,
      toX,
      toY
    };
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
    const input = wrapper ? wrapper.querySelector("input") : null;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
    }
  }


  async function submitHabit(event) {
    event.preventDefault();
    const name = habitForm.name.trim();
    if (!name || !habitForm.startTime || !habitForm.endTime) {
      setStatusMessage("Please enter habit name, start time, and end time.");
      return;
    }

    const entry = {
      id: makeId(),
      name,
      startTime: habitForm.startTime,
      endTime: habitForm.endTime,
      completions: {},
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({
      ...prev,
      habits: [entry, ...prev.habits]
    }));

    setHabitForm({ name: "", startTime: "", endTime: "" });
    await tryImmediateSync("habit", entry);
  }

  async function toggleHabitCompletion(habitId, checked) {
    let updated = null;

    setState((prev) => {
      const nextHabits = prev.habits.map((habit) => {
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
      });

      return {
        ...prev,
        habits: nextHabits
      };
    });

    if (updated) {
      await tryImmediateSync("habit", updated);
    }
  }

  async function deleteHabit(habitId) {
    let updated = null;

    setState((prev) => {
      const nextHabits = prev.habits.map((habit) => {
        if (habit.id !== habitId) {
          return habit;
        }

        updated = {
          ...habit,
          deleted: true,
          syncStatus: "pending"
        };

        return updated;
      });

      return {
        ...prev,
        habits: nextHabits
      };
    });

    if (updated) {
      await tryImmediateSync("habit", updated);
    }
  }

  async function submitTask(event) {
    event.preventDefault();
    const title = taskForm.title.trim();
    if (!title) {
      setStatusMessage("Please enter task name.");
      return;
    }

    const entry = {
      id: makeId(),
      title,
      completionTime: taskForm.completionTime,
      notes: taskForm.notes.trim(),
      completed: false,
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({
      ...prev,
      tasks: [entry, ...prev.tasks]
    }));

    setTaskForm({ title: "", completionTime: "", notes: "" });
    await tryImmediateSync("task", entry);
  }

  async function toggleTaskCompletion(taskId, checked) {
    let updated = null;

    setState((prev) => {
      const nextTasks = prev.tasks.map((task) => {
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
      });

      return {
        ...prev,
        tasks: nextTasks
      };
    });

    if (updated) {
      await tryImmediateSync("task", updated);
    }
  }

  async function deleteTask(taskId) {
    let updated = null;

    setState((prev) => {
      const nextTasks = prev.tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        updated = {
          ...task,
          deleted: true,
          syncStatus: "pending"
        };

        return updated;
      });

      return {
        ...prev,
        tasks: nextTasks
      };
    });

    if (updated) {
      await tryImmediateSync("task", updated);
    }
  }

  function editTrade(trade) {
    setTradeForm({
      date: trade.date,
      target: String(trade.target ?? "")
    });
    setShowTradeAdd(true);
    setStatusMessage("Edit the target and save again.");
  }

  async function deleteTrade(tradeId) {
    let updated = null;

    setState((prev) => {
      const nextTrades = prev.trades.map((trade) => {
        if (trade.id !== tradeId) {
          return trade;
        }

        updated = {
          ...trade,
          deleted: true,
          syncStatus: "pending"
        };

        return updated;
      });

      return {
        ...prev,
        trades: nextTrades
      };
    });

    if (updated) {
      await tryImmediateSync("trade", updated);
    }
  }

  async function saveTarget(event) {
    event.preventDefault();
    const target = Number(tradeForm.target || 0);
    if (!tradeForm.date || !Number.isFinite(target)) {
      setStatusMessage("Please enter valid date and target.");
      return;
    }

    const existing = state.trades.find((trade) => !trade.deleted && trade.date === tradeForm.date);
    if (existing) {
      const updated = {
        ...existing,
        target,
        achievedPercent: calculateAchievedPercent(target, existing.achieved || 0),
        syncStatus: "pending"
      };

      setState((prev) => ({
        ...prev,
        trades: prev.trades.map((trade) => (trade.id === existing.id ? updated : trade))
      }));

      await tryImmediateSync("trade", updated);
      setStatusMessage("Target updated for selected date.");
      return;
    }

    const entry = {
      id: makeId(),
      date: tradeForm.date,
      target,
      achieved: 0,
      achievedPercent: 0,
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({
      ...prev,
      trades: [entry, ...prev.trades]
    }));

    setTradeForm((prev) => ({ ...prev, target: "" }));
    await tryImmediateSync("trade", entry);
  }

  async function saveAchieved(tradeId) {
    let updated = null;

    setState((prev) => {
      const nextTrades = prev.trades.map((trade) => {
        if (trade.id !== tradeId) {
          return trade;
        }

        const achieved = Number(tradeAchievedDrafts[tradeId] ?? trade.achieved ?? 0);
        updated = {
          ...trade,
          achieved,
          achievedPercent: calculateAchievedPercent(trade.target, achieved),
          syncStatus: "pending"
        };

        return updated;
      });

      return {
        ...prev,
        trades: nextTrades
      };
    });

    if (updated) {
      await tryImmediateSync("trade", updated);
    }
  }

  async function syncPendingEntries() {
    if (!state.settings.sheetUrl) {
      setStatusMessage("Add your Google Apps Script URL before syncing.");
      return;
    }

    const pending = [
      ...state.habits.filter((entry) => entry.syncStatus !== "synced").map((entry) => ({ type: "habit", entry })),
      ...state.tasks.filter((entry) => entry.syncStatus !== "synced").map((entry) => ({ type: "task", entry })),
      ...state.trades.filter((entry) => entry.syncStatus !== "synced").map((entry) => ({ type: "trade", entry }))
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

    setStatusMessage(`${syncedCount} of ${pending.length} pending entr${pending.length === 1 ? "y" : "ies"} synced.`);
  }

  async function tryImmediateSync(type, entry) {
    if (!state.settings.sheetUrl) {
      setStatusMessage("Saved locally. Add Google Apps Script URL for sync.");
      return;
    }

    const success = await pushEntry(type, entry, state.settings.sheetUrl);
    updateSyncStatus(type, entry.id, success ? "synced" : "failed");
    setStatusMessage(success ? "Saved and synced to Google Sheets." : "Saved locally. Sync failed.");
  }

  function updateSyncStatus(type, id, syncStatus) {
    const key = type === "habit" ? "habits" : type === "task" ? "tasks" : "trades";
    setState((prev) => ({
      ...prev,
      [key]: prev[key].map((entry) => {
        if (entry.id !== id) {
          return entry;
        }
        return {
          ...entry,
          syncStatus
        };
      })
    }));
  }

  return (
    <div className="app-shell">
      <nav className="top-nav" aria-label="Main navigation">
        <div className="tab-strip" aria-label="Tracker tabs">
          <button className={`tab-button ${activeTab === "habit" ? "is-active" : ""}`} type="button" onClick={() => setActiveTab("habit")}>Habit</button>
          <button className={`tab-button ${activeTab === "task" ? "is-active" : ""}`} type="button" onClick={() => setActiveTab("task")}>Task</button>
          <button className={`tab-button ${activeTab === "trading" ? "is-active" : ""}`} type="button" onClick={() => setActiveTab("trading")}>Trading</button>

          <div className="nav-settings-wrap tab-strip-settings-end">
            <button
              className="settings-icon-button tab-settings-button"
              type="button"
              aria-expanded={showSettings}
              aria-controls="navSettingsPanel"
              aria-label="Open sync settings"
              onClick={() => setShowSettings((prev) => !prev)}
            >
              <SettingsIcon />
            </button>

            <section id="navSettingsPanel" className={`nav-settings-panel ${showSettings ? "" : "hidden"}`}>
              <div className="settings-panel-header">
                <p className="muted">Google Sheets sync settings</p>
                <button className="close-icon-button" type="button" aria-label="Close settings" onClick={() => setShowSettings(false)}>
                  <CloseIcon />
                </button>
              </div>

              <form
                className="settings-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  setStatusMessage("Google Apps Script URL saved.");
                  setShowSettings(false);
                }}
              >
                <label>
                  Google Apps Script Web App URL
                  <input
                    type="url"
                    value={state.settings.sheetUrl}
                    onChange={(event) => updateSettingsField("sheetUrl", event.target.value.trim())}
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                </label>

                <p className="muted settings-help">Use the Apps Script Web App URL, not the spreadsheet link.</p>
                <button className="button" type="submit">Save connection</button>
                <button className="button button-secondary" type="button" onClick={syncPendingEntries}>Sync pending entries</button>
              </form>
            </section>
          </div>
        </div>
      </nav>

      <main className="page-content">
        {activeTab === "habit" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Habit tracker</h2>
              <div className="panel-actions">
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowHabitGraph((prev) => !prev)}>
                  <GraphIcon />
                </button>
                <button className="icon-add-button" type="button" title="Add habit" onClick={() => setShowHabitAdd((prev) => !prev)}>
                  <PlusIcon />
                </button>
              </div>
            </div>

            {showHabitAdd && (
              <form className="inline-add-form" onSubmit={submitHabit}>
                <div className="field-grid three-up">
                  <label>
                    Habit name
                    <input value={habitForm.name} onChange={(event) => setHabitForm((prev) => ({ ...prev, name: event.target.value }))} required />
                  </label>
                  <label>
                    Start time
                    <div className="input-with-icon">
                      <input
                        type="time"
                        value={habitForm.startTime}
                        onChange={(event) => setHabitForm((prev) => ({ ...prev, startTime: event.target.value }))}
                        required
                      />
                      <button className="input-icon-button" type="button" aria-label="Open time picker" onClick={(event) => openPickerFromButton(event)}>
                        <ClockIcon />
                      </button>
                    </div>
                  </label>
                  <label>
                    End time
                    <div className="input-with-icon">
                      <input
                        type="time"
                        value={habitForm.endTime}
                        onChange={(event) => setHabitForm((prev) => ({ ...prev, endTime: event.target.value }))}
                        required
                      />
                      <button className="input-icon-button" type="button" aria-label="Open time picker" onClick={(event) => openPickerFromButton(event)}>
                        <ClockIcon />
                      </button>
                    </div>
                  </label>
                </div>

                <button className="button" type="submit">Save habit</button>
              </form>
            )}

            {showHabitGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <div>
                    <h3>Habit monthly battery graph</h3>
                    <p className="muted">Fill shows completed days in the selected month</p>
                  </div>
                  <label className="month-picker">
                    Month
                    <div className="input-with-icon input-with-icon-tight">
                      <input type="month" value={habitMonth} onChange={(event) => setHabitMonth(event.target.value || getToday().slice(0, 7))} />
                      <button className="input-icon-button" type="button" aria-label="Open month picker" onClick={(event) => openPickerFromButton(event)}>
                        <CalendarIcon />
                      </button>
                    </div>
                  </label>
                </div>
                <div className="habit-battery-list">
                  {habitMonthHabits.length ? habitMonthHabits.map((habit) => {
                    const completionDays = getHabitCompletionDaysForMonth(habit, habitMonth);
                    const completedCount = completionDays.length;

                    return (
                      <article key={`${habit.id}-${habitMonth}`} className="habit-battery-card">
                        <div className="habit-battery-header">
                          <strong>{habit.name}</strong>
                          <span className="muted">{completedCount}/{habitMonthDays} days</span>
                        </div>
                        <div className="habit-battery-track" aria-label={`${habit.name} completion battery for ${habitMonth}`}>
                          {Array.from({ length: habitMonthDays }, (_, index) => {
                            const day = index + 1;
                            const dateKey = `${habitMonth}-${String(day).padStart(2, "0")}`;
                            const completed = Boolean(habit.completions && habit.completions[dateKey]);

                            return (
                              <span
                                key={dateKey}
                                className={`habit-battery-segment ${completed ? "is-filled" : "is-empty"}`}
                                title={`${dateKey}: ${completed ? "completed" : "pending"}`}
                              >
                                {day}
                              </span>
                            );
                          })}
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
                <div className="input-with-icon">
                  <input type="date" value={habitDate} onChange={(event) => setHabitDate(event.target.value || getToday())} />
                  <button className="input-icon-button" type="button" aria-label="Open date picker" onClick={(event) => openPickerFromButton(event)}>
                    <CalendarIcon />
                  </button>
                </div>
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
                  {visibleHabits.length ? visibleHabits.map((habit) => (
                    <tr key={habit.id}>
                      <td>{habit.name}</td>
                      <td>{formatTime(habit.startTime)}</td>
                      <td>{formatTime(habit.endTime)}</td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={isHabitCompletedOnDate(habit, habitDate)}
                            onChange={(event) => toggleHabitCompletion(habit.id, event.target.checked)}
                          />
                          <span className="switch-slider"></span>
                        </label>
                      </td>
                      <td>{makeSyncIcon(habit.syncStatus)}</td>
                      <td>
                        <button className="icon-button" type="button" aria-label="Delete habit" title="Delete habit" onClick={() => deleteHabit(habit.id)}>
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6">No habits available for this date.</td></tr>
                  )}
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
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowTaskGraph((prev) => !prev)}>
                  <GraphIcon />
                </button>
                <button className="icon-add-button" type="button" title="Add task" onClick={() => setShowTaskAdd((prev) => !prev)}>
                  <PlusIcon />
                </button>
              </div>
            </div>

            {showTaskAdd && (
              <form className="inline-add-form" onSubmit={submitTask}>
                <div className="field-grid three-up">
                  <label>
                    Task name
                    <input value={taskForm.title} onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))} required />
                  </label>
                  <label>
                    Completion time
                    <div className="input-with-icon">
                      <input
                        type="datetime-local"
                        value={taskForm.completionTime}
                        onChange={(event) => setTaskForm((prev) => ({ ...prev, completionTime: event.target.value }))}
                      />
                      <button className="input-icon-button" type="button" aria-label="Open date and time picker" onClick={(event) => openPickerFromButton(event)}>
                        <CalendarIcon />
                      </button>
                    </div>
                  </label>
                  <label>
                    Notes
                    <input value={taskForm.notes} onChange={(event) => setTaskForm((prev) => ({ ...prev, notes: event.target.value }))} />
                  </label>
                </div>

                <button className="button" type="submit">Save task</button>
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
                <div className="input-with-icon">
                  <input type="date" value={taskFilterDate} onChange={(event) => setTaskFilterDate(event.target.value)} />
                  <button className="input-icon-button" type="button" aria-label="Open date picker" onClick={(event) => openPickerFromButton(event)}>
                    <CalendarIcon />
                  </button>
                </div>
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
                    <tr key={task.id}>
                      <td>{task.title}</td>
                      <td>{formatDateTime(task.completionTime)}</td>
                      <td>{task.notes || "-"}</td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={task.completed} onChange={(event) => toggleTaskCompletion(task.id, event.target.checked)} />
                          <span className="switch-slider"></span>
                        </label>
                      </td>
                      <td>{makeSyncIcon(task.syncStatus)}</td>
                      <td>
                        <button className="icon-button" type="button" aria-label="Delete task" title="Delete task" onClick={() => deleteTask(task.id)}>
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6">No tasks found.</td></tr>
                  )}
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
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowTradeGraph((prev) => !prev)}>
                  <GraphIcon />
                </button>
                <button className="icon-add-button" type="button" title="Add daily target" onClick={() => setShowTradeAdd((prev) => !prev)}>
                  <PlusIcon />
                </button>
              </div>
            </div>

            {showTradeAdd && (
              <form className="inline-add-form" onSubmit={saveTarget}>
                <div className="field-grid two-up">
                  <label>
                    Date
                    <div className="input-with-icon">
                      <input type="date" value={tradeForm.date} onChange={(event) => setTradeForm((prev) => ({ ...prev, date: event.target.value }))} required />
                      <button className="input-icon-button" type="button" aria-label="Open date picker" onClick={(event) => openPickerFromButton(event)}>
                        <CalendarIcon />
                      </button>
                    </div>
                  </label>
                  <label>
                    Daily target
                    <input type="number" step="0.01" value={tradeForm.target} onChange={(event) => setTradeForm((prev) => ({ ...prev, target: event.target.value }))} required />
                  </label>
                </div>

                <button className="button" type="submit">Save daily target</button>
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
                        return (
                          <text key={trade.id} x={x} y={tradeChart.height - 14} textAnchor="middle" className="line-x-label">
                            {trade.date.slice(5)}
                          </text>
                        );
                      })}

                      <polyline points={tradeChart.targetPoints} className="line-target" />
                      <polyline points={tradeChart.achievedPoints} className="line-achieved" />
                    </svg>

                    <div className="line-legend">
                      <span><i className="legend-dot legend-target"></i>Target (green)</span>
                      <span><i className="legend-dot legend-achieved"></i>Achieved (red)</span>
                    </div>
                  </div>
                ) : (
                  <p className="muted">No graph data available.</p>
                )}
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
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={value ?? ""}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              setTradeAchievedDrafts((prev) => ({ ...prev, [trade.id]: nextValue }));
                            }}
                          />
                        </td>
                        <td>
                          <button className="icon-save-button" type="button" title="Save achieved" aria-label="Save achieved" onClick={() => saveAchieved(trade.id)}>
                            <SaveIcon />
                          </button>
                        </td>
                        <td>
                          <div className="row-action-group">
                            <button className="icon-button" type="button" aria-label="Edit target" title="Edit target" onClick={() => editTrade(trade)}>
                              <EditIcon />
                            </button>
                            <button className="icon-button" type="button" aria-label="Delete target" title="Delete target" onClick={() => deleteTrade(trade.id)}>
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                        <td>{makeSyncIcon(trade.syncStatus)}</td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="6">No daily target rows yet.</td></tr>
                  )}
                </tbody>
              </table>
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
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("habitTaskTradingTracker.v3") || localStorage.getItem("habitTaskTradingTracker.v2") || localStorage.getItem("habitTaskTradingTracker.v1");
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
    achievedPercent: calculateAchievedPercent(target, achieved),
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
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

function calculateAchievedPercent(target, achieved) {
  if (!Number(target)) {
    return 0;
  }

  return (Number(achieved) / Number(target)) * 100;
}

function getDaysInMonth(monthValue) {
  const [yearPart, monthPart] = String(monthValue || getToday().slice(0, 7)).split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);

  if (!year || !month) {
    return 30;
  }

  return new Date(year, month, 0).getDate();
}

function getHabitCompletionDaysForMonth(habit, monthValue) {
  const monthPrefix = String(monthValue || getToday().slice(0, 7));
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
  if (!task.completed) {
    return false;
  }

  if (!task.completionTime || !task.completedAt) {
    return false;
  }

  return new Date(task.completedAt).getTime() > new Date(task.completionTime).getTime();
}

async function pushEntry(type, entry, url) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        type,
        payload: entry
      })
    });

    return response.ok;
  } catch {
    return false;
  }
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

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19.14 12.94a7.94 7.94 0 0 0 .05-.94 7.94 7.94 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7.28 7.28 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.94 7.94 0 0 0-.05.94 7.94 7.94 0 0 0 .05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.38 1.05.7 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.24 1.13-.56 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" fill="currentColor" />
    </svg>
  );
}

function GraphIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 3h2v18H3V3Zm16 6h2v12h-2V9ZM11 13h2v8h-2v-8Zm-4-4h2v12H7V9Zm8-6h2v18h-2V3Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.3 6.29-6.3Z" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1Zm1 12.6V6h-2v8.7l6 3.3 1-1.7Z" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm13 8H4v10h16V10ZM4 8h16V6H4v2Z" fill="currentColor" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6v-2Z" fill="currentColor" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M17 3H5a2 2 0 0 0-2 2v14l4-4h12a2 2 0 0 0 2-2V7l-4-4ZM7 7h8v4H7V7Z" fill="currentColor" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9Z" fill="currentColor"></path>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="m9.2 16.2-3.4-3.4 1.4-1.4 2 2 6-6 1.4 1.4-7.4 7.4Z" fill="currentColor"></path>
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z" fill="currentColor"></path>
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path d="M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25Zm17.71-10.46a1 1 0 0 0 0-1.41l-2.08-2.08a1 1 0 0 0-1.41 0l-1.63 1.63 3.75 3.75 1.37-1.89Z" fill="currentColor" />
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
