const { useEffect, useMemo, useState } = React;

const STORAGE_KEY = "habitTaskTradingTracker.v7";

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
const SHEET_CELL_LIMIT = 10000000;

const WORKOUT_LIBRARY = {
  chest: {
    label: "Chest",
    groups: {
      "Upper Chest": ["Incline Barbell Bench Press", "Incline Dumbbell Press", "Incline Dumbbell Fly", "Low-to-High Cable Fly"],
      "Middle Chest": ["Flat Barbell Bench Press", "Flat Dumbbell Press", "Pec Deck Fly", "Machine Chest Press"],
      "Lower Chest": ["Decline Bench Press", "Decline Dumbbell Press", "Chest Dips (Forward Leaning)", "High-to-Low Cable Fly"]
    }
  },
  back: {
    label: "Back",
    groups: {
      "Width (Lats)": ["Pull-Ups", "Lat Pulldown", "Close-Grip Lat Pulldown", "Straight Arm Pulldown"],
      Thickness: ["Barbell Bent-Over Row", "T-Bar Row", "Seated Cable Row", "One-Arm Dumbbell Row", "Chest-Supported Row"],
      "Lower Back": ["Deadlift", "Romanian Deadlift", "Back Extensions", "Good Mornings"]
    }
  },
  legs: {
    label: "Legs",
    groups: {
      Quadriceps: ["Barbell Squat", "Front Squat", "Leg Press", "Walking Lunges", "Bulgarian Split Squat", "Leg Extensions"],
      Hamstrings: ["Romanian Deadlift", "Lying Leg Curl", "Seated Leg Curl", "Good Mornings"],
      Glutes: ["Hip Thrust", "Glute Bridge", "Bulgarian Split Squat", "Cable Kickbacks"],
      Calves: ["Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise", "Donkey Calf Raise"]
    }
  },
  biceps: {
    label: "Biceps",
    groups: {
      "Long Head": ["Incline Dumbbell Curl", "Alternating Dumbbell Curl", "Drag Curl"],
      "Short Head": ["Preacher Curl", "EZ-Bar Curl", "Concentration Curl"],
      "Overall Biceps": ["Barbell Curl", "Hammer Curl", "Cable Curl", "Chin-Ups"]
    }
  },
  triceps: {
    label: "Triceps",
    groups: {
      "Long Head": ["Overhead Dumbbell Extension", "Overhead Cable Extension", "Skull Crushers"],
      "Lateral Head": ["Cable Pushdown", "Straight Bar Pushdown", "Close-Grip Bench Press"],
      "Medial Head": ["Reverse Grip Pushdown", "Diamond Push-Ups", "Dips"]
    }
  },
  forearms: {
    label: "Forearms",
    groups: {
      "Forearm Flexors": ["Wrist Curl", "Cable Wrist Curl"],
      "Forearm Extensors": ["Reverse Wrist Curl", "Reverse Cable Curl"],
      "Grip Strength": ["Farmer's Walk", "Dead Hangs", "Plate Pinches", "Wrist Roller"],
      Brachioradialis: ["Hammer Curl", "Reverse Barbell Curl", "Rope Hammer Curl"]
    }
  },
  core: {
    label: "Core",
    groups: {
      "Upper Abs": ["Crunches", "Machine Crunch", "Cable Crunch"],
      "Lower Abs": ["Hanging Leg Raises", "Reverse Crunches", "Lying Leg Raises"],
      Obliques: ["Russian Twists", "Cable Woodchoppers", "Side Plank"],
      "Entire Core": ["Plank", "Ab Wheel Rollout", "Mountain Climbers", "Dead Bug"]
    }
  }
};

const DIET_FOODS = [
  { name: "Whole Egg", serving: "1 Egg (50g)", baseGrams: 50, protein: 6.3, carbs: 0.4, fat: 5.3, calories: 72 },
  { name: "Egg White", serving: "1 Egg White", baseGrams: null, protein: 3.6, carbs: 0.2, fat: 0.1, calories: 17 },
  { name: "Boiled Egg", serving: "100g", baseGrams: 100, protein: 13, carbs: 1.1, fat: 11, calories: 155 },
  { name: "Moong Sprouts", serving: "100g", baseGrams: 100, protein: 3, carbs: 6, fat: 0.2, calories: 30 },
  { name: "Chana Sprouts", serving: "100g", baseGrams: 100, protein: 9, carbs: 27, fat: 2.5, calories: 164 },
  { name: "Mixed Sprouts", serving: "100g", baseGrams: 100, protein: 7, carbs: 15, fat: 1, calories: 90 },
  { name: "Soybean Sprouts", serving: "100g", baseGrams: 100, protein: 13, carbs: 9, fat: 6, calories: 140 },
  { name: "Idli", serving: "100g", baseGrams: 100, protein: 4, carbs: 28, fat: 0.4, calories: 146 },
  { name: "Plain Dosa", serving: "100g", baseGrams: 100, protein: 5, carbs: 26, fat: 4, calories: 168 },
  { name: "Masala Dosa", serving: "100g", baseGrams: 100, protein: 4.5, carbs: 31, fat: 6, calories: 200 },
  { name: "Rava Dosa", serving: "100g", baseGrams: 100, protein: 5, carbs: 30, fat: 7, calories: 220 },
  { name: "Uttapam", serving: "100g", baseGrams: 100, protein: 5, carbs: 28, fat: 3, calories: 170 },
  { name: "Upma", serving: "100g", baseGrams: 100, protein: 4, carbs: 21, fat: 7, calories: 160 },
  { name: "Poha", serving: "100g", baseGrams: 100, protein: 2.5, carbs: 24, fat: 4, calories: 130 },
  { name: "Pongal", serving: "100g", baseGrams: 100, protein: 5, carbs: 23, fat: 8, calories: 190 },
  { name: "Chapati/Roti", serving: "1 Medium", baseGrams: null, protein: 3, carbs: 18, fat: 1, calories: 95 },
  { name: "Whole Wheat Roti", serving: "100g", baseGrams: 100, protein: 9, carbs: 49, fat: 3, calories: 265 },
  { name: "Paratha", serving: "100g", baseGrams: 100, protein: 6, carbs: 36, fat: 10, calories: 280 },
  { name: "Aloo Paratha", serving: "100g", baseGrams: 100, protein: 5, carbs: 33, fat: 10, calories: 260 },
  { name: "Plain Rice (Cooked)", serving: "100g", baseGrams: 100, protein: 2.7, carbs: 28, fat: 0.3, calories: 130 },
  { name: "Lemon Rice", serving: "100g", baseGrams: 100, protein: 3, carbs: 28, fat: 5, calories: 180 },
  { name: "Curd Rice", serving: "100g", baseGrams: 100, protein: 3.5, carbs: 20, fat: 3, calories: 125 },
  { name: "Vegetable Pulao", serving: "100g", baseGrams: 100, protein: 3.5, carbs: 30, fat: 4, calories: 170 },
  { name: "Veg Biryani", serving: "100g", baseGrams: 100, protein: 4, carbs: 28, fat: 7, calories: 200 },
  { name: "Chicken Biryani", serving: "100g", baseGrams: 100, protein: 10, carbs: 28, fat: 8, calories: 220 },
  { name: "Sambar", serving: "100g", baseGrams: 100, protein: 3, carbs: 8, fat: 2, calories: 60 },
  { name: "Dal Tadka", serving: "100g", baseGrams: 100, protein: 7, carbs: 15, fat: 4, calories: 130 },
  { name: "Rajma", serving: "100g", baseGrams: 100, protein: 8.5, carbs: 23, fat: 0.8, calories: 127 },
  { name: "Chole", serving: "100g", baseGrams: 100, protein: 9, carbs: 27, fat: 3, calories: 165 },
  { name: "Paneer", serving: "100g", baseGrams: 100, protein: 18, carbs: 4, fat: 20, calories: 265 },
  { name: "Paneer Bhurji", serving: "100g", baseGrams: 100, protein: 16, carbs: 5, fat: 18, calories: 240 },
  { name: "Tofu", serving: "100g", baseGrams: 100, protein: 8, carbs: 2, fat: 4, calories: 76 },
  { name: "Soy Chunks (Boiled)", serving: "100g", baseGrams: 100, protein: 16, carbs: 9, fat: 1, calories: 115 },
  { name: "Chicken Breast (Cooked)", serving: "100g", baseGrams: 100, protein: 31, carbs: 0, fat: 3.6, calories: 165 },
  { name: "Chicken Curry", serving: "100g", baseGrams: 100, protein: 18, carbs: 4, fat: 10, calories: 190 },
  { name: "Fish Curry", serving: "100g", baseGrams: 100, protein: 20, carbs: 4, fat: 8, calories: 180 },
  { name: "Naan", serving: "100g", baseGrams: 100, protein: 9, carbs: 50, fat: 5, calories: 310 },
  { name: "Bhatura", serving: "100g", baseGrams: 100, protein: 8, carbs: 45, fat: 14, calories: 330 }
];

const defaultState = {
  settings: {
    habitsTasksSheetUrl: "",
    financeSheetUrl: "",
    healthSheetUrl: "",
    portfolioCategories: [],
    googleClientId: "",
    activeUserEmail: "",
    activeUserName: ""
  },
  habits: [],
  tasks: [],
  trades: [],
  portfolios: [],
  stocks: [],
  workouts: [],
  diets: [],
  dietTargets: []
};

function App() {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("home");
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
  const [showDietGraph, setShowDietGraph] = useState(true);

  const [workoutLibraryData, setWorkoutLibraryData] = useState(WORKOUT_LIBRARY);
  const [dietFoodOptions, setDietFoodOptions] = useState(DIET_FOODS);

  const [habitForm, setHabitForm] = useState({ name: "", startTime: "", endTime: "" });
  const [taskForm, setTaskForm] = useState({ title: "", completionTime: "", notes: "" });
  const [tradeForm, setTradeForm] = useState({ date: getToday(), target: "" });
  const [stockForm, setStockForm] = useState({ stockName: "", category: "", buyAmount: "", buyDate: getToday(), quantity: "" });
  const [workoutDate, setWorkoutDate] = useState(getToday());
  const [workoutMuscle, setWorkoutMuscle] = useState("chest");
  const [workoutExerciseKey, setWorkoutExerciseKey] = useState("");
  const [dietDate, setDietDate] = useState(getToday());
  const [dietFoodName, setDietFoodName] = useState(DIET_FOODS[0] ? DIET_FOODS[0].name : "");
  const [dietInputMode, setDietInputMode] = useState("serving");
  const [dietServingQty, setDietServingQty] = useState("1");
  const [dietWeightQty, setDietWeightQty] = useState("100");
  const [dietTargetCaloriesInput, setDietTargetCaloriesInput] = useState("");

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
    const activeFoodNames = dietFoodOptions.map((item) => item.name);
    if (!dietFoodName || !activeFoodNames.includes(dietFoodName)) {
      setDietFoodName(dietFoodOptions[0] ? dietFoodOptions[0].name : "");
    }
  }, [dietFoodOptions, dietFoodName]);

  useEffect(() => {
    const keys = Object.keys(workoutLibraryData);
    if (!keys.length) {
      return;
    }
    if (!keys.includes(workoutMuscle)) {
      setWorkoutMuscle(keys[0]);
    }
  }, [workoutLibraryData, workoutMuscle]);

  useEffect(() => {
    setDietTargetCaloriesInput(dietTargetEntry ? String(dietTargetEntry.targetCalories || "") : "");
  }, [dietTargetEntry, dietDate]);

  useEffect(() => {
    const url = String(state.settings.healthSheetUrl || "").trim();
    if (!url) {
      setWorkoutLibraryData(WORKOUT_LIBRARY);
      setDietFoodOptions(DIET_FOODS);
      return;
    }

    let cancelled = false;

    fetch(buildCatalogUrl(url), {
      method: "GET",
      headers: { Accept: "application/json" }
    })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled || !data || data.ok !== true) {
          return;
        }

        const remoteWorkout = normalizeWorkoutCatalog(data.workoutCatalog);
        const remoteDiet = normalizeDietCatalog(data.dietCatalog);

        if (Object.keys(remoteWorkout).length) {
          setWorkoutLibraryData(remoteWorkout);
        }
        if (remoteDiet.length) {
          setDietFoodOptions(remoteDiet);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatusMessage("Using local workout/diet lists. Health sheet catalog fetch failed.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [state.settings.healthSheetUrl]);

  useEffect(() => {
    if (!workoutOptions.length) {
      setWorkoutExerciseKey("");
      return;
    }
    if (!workoutExerciseKey || !workoutOptions.some((item) => item.key === workoutExerciseKey)) {
      setWorkoutExerciseKey(workoutOptions[0].key);
    }
  }, [workoutOptions, workoutExerciseKey]);

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
  const workoutOptions = useMemo(() => getWorkoutOptions(workoutLibraryData, workoutMuscle), [workoutLibraryData, workoutMuscle]);
  const workoutEntries = useMemo(() => state.workouts.filter((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.date === workoutDate).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")), [state.workouts, workoutDate, activeUserEmail]);
  const dietEntries = useMemo(() => state.diets.filter((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.date === dietDate).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")), [state.diets, dietDate, activeUserEmail]);
  const dietTargetEntry = useMemo(() => state.dietTargets.find((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.date === dietDate) || null, [state.dietTargets, dietDate, activeUserEmail]);

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
  const dietDayTotals = useMemo(() => dietEntries.reduce((sum, item) => ({
    protein: sum.protein + Number(item.protein || 0),
    carbs: sum.carbs + Number(item.carbs || 0),
    fat: sum.fat + Number(item.fat || 0),
    calories: sum.calories + Number(item.calories || 0)
  }), { protein: 0, carbs: 0, fat: 0, calories: 0 }), [dietEntries]);
  const dietTargetCalories = dietTargetEntry ? Number(dietTargetEntry.targetCalories || 0) : 0;
  const dietConsumedCalories = Number(dietDayTotals.calories || 0);

  const dietDayChart = useMemo(() => {
    const maxY = Math.max(1, dietTargetCalories, dietConsumedCalories) * 1.1;
    const width = 520;
    const height = 220;
    const leftPad = 52;
    const rightPad = 18;
    const topPad = 16;
    const bottomPad = 48;
    const plotH = height - topPad - bottomPad;
    const barW = 110;
    const xTarget = 150;
    const xConsumed = 300;
    const toY = (value) => topPad + ((maxY - Math.max(0, Number(value || 0))) / maxY) * plotH;
    return { width, height, leftPad, rightPad, bottomPad, barW, xTarget, xConsumed, toY, maxY };
  }, [dietTargetCalories, dietConsumedCalories]);

  const settingsCapacitySnapshot = useMemo(() => {
    const rows = {
      habits: state.habits.length,
      tasks: state.tasks.length,
      trades: state.trades.length,
      portfolios: state.portfolios.length,
      stocks: state.stocks.length,
      workouts: state.workouts.length,
      diets: state.diets.length,
      dietTargets: state.dietTargets.length
    };

    const columns = {
      habits: 8,
      tasks: 9,
      trades: 8,
      portfolios: 10,
      stocks: 10,
      workouts: 11,
      diets: 14,
      dietTargets: 6
    };

    const estimatedUsedCells =
      (rows.habits + 1) * columns.habits +
      (rows.tasks + 1) * columns.tasks +
      (rows.trades + 1) * columns.trades +
      (rows.portfolios + 1) * columns.portfolios +
      (rows.stocks + 1) * columns.stocks +
      (rows.workouts + 1) * columns.workouts +
      (rows.diets + 1) * columns.diets +
      (rows.dietTargets + 1) * columns.dietTargets;

    const usagePercent = Math.min((estimatedUsedCells / SHEET_CELL_LIMIT) * 100, 100);

    return {
      rows,
      estimatedUsedCells,
      remainingCells: Math.max(SHEET_CELL_LIMIT - estimatedUsedCells, 0),
      usagePercent,
      maxRowsSingleSheet: {
        habits: Math.floor(SHEET_CELL_LIMIT / columns.habits),
        tasks: Math.floor(SHEET_CELL_LIMIT / columns.tasks),
        trades: Math.floor(SHEET_CELL_LIMIT / columns.trades),
        portfolios: Math.floor(SHEET_CELL_LIMIT / columns.portfolios),
        stocks: Math.floor(SHEET_CELL_LIMIT / columns.stocks),
        workouts: Math.floor(SHEET_CELL_LIMIT / columns.workouts),
        diets: Math.floor(SHEET_CELL_LIMIT / columns.diets),
        dietTargets: Math.floor(SHEET_CELL_LIMIT / columns.dietTargets)
      }
    };
  }, [state.habits.length, state.tasks.length, state.trades.length, state.portfolios.length, state.stocks.length, state.workouts.length, state.diets.length, state.dietTargets.length]);

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

  async function addWorkoutToToday() {
    if (!workoutExerciseKey) {
      setStatusMessage("Select a workout exercise first.");
      return;
    }

    const selected = workoutOptions.find((item) => item.key === workoutExerciseKey);
    if (!selected) {
      setStatusMessage("Selected workout not found.");
      return;
    }

    const entry = {
      id: makeId(),
      date: workoutDate,
      bodyPart: workoutMuscle,
      bodyPartLabel: workoutLibraryData[workoutMuscle] ? workoutLibraryData[workoutMuscle].label : workoutMuscle,
      subgroup: selected.group,
      exercise: selected.exercise,
      weight: null,
      unit: "kg",
      reps: null,
      ownerEmail: activeUserEmail,
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({ ...prev, workouts: [entry, ...prev.workouts] }));
    await tryImmediateSync("workout", entry);
  }

  async function updateWorkoutEntry(entryId, field, value) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      workouts: prev.workouts.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }
        if (field === "weight" || field === "reps") {
          updated = {
            ...entry,
            [field]: value === "" ? null : Number(value),
            syncStatus: "pending"
          };
          return updated;
        }
        updated = {
          ...entry,
          [field]: value,
          syncStatus: "pending"
        };
        return updated;
      })
    }));

    if (updated) {
      await tryImmediateSync("workout", updated);
    }
  }

  async function deleteWorkoutEntry(entryId) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      workouts: prev.workouts.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }
        updated = { ...entry, deleted: true, syncStatus: "pending" };
        return updated;
      })
    }));

    if (updated) {
      await tryImmediateSync("workout", updated);
    }
  }

  async function addDietEntry() {
    const food = dietFoodOptions.find((item) => item.name === dietFoodName);
    if (!food) {
      setStatusMessage("Select a food item.");
      return;
    }

    const servingQty = Number(dietServingQty || 0);
    const weightQty = Number(dietWeightQty || 0);
    const multiplier = dietInputMode === "weight"
      ? (food.baseGrams ? weightQty / food.baseGrams : weightQty / 100)
      : servingQty;

    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      setStatusMessage("Enter valid quantity or weight.");
      return;
    }

    const entry = {
      id: makeId(),
      date: dietDate,
      foodName: food.name,
      serving: food.serving,
      inputMode: dietInputMode,
      quantity: dietInputMode === "weight" ? weightQty : servingQty,
      quantityUnit: dietInputMode === "weight" ? "g" : "serving",
      protein: food.protein * multiplier,
      carbs: food.carbs * multiplier,
      fat: food.fat * multiplier,
      calories: food.calories * multiplier,
      ownerEmail: activeUserEmail,
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({ ...prev, diets: [entry, ...prev.diets] }));
    await tryImmediateSync("diet", entry);
  }

  async function deleteDietEntry(entryId) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      diets: prev.diets.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }
        updated = { ...entry, deleted: true, syncStatus: "pending" };
        return updated;
      })
    }));

    if (updated) {
      await tryImmediateSync("diet", updated);
    }
  }

  async function saveDietTarget() {
    const targetCalories = Number(dietTargetCaloriesInput || 0);
    if (!Number.isFinite(targetCalories) || targetCalories < 0) {
      setStatusMessage("Enter valid target calories.");
      return;
    }

    const existing = state.dietTargets.find((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.date === dietDate);
    if (existing) {
      const updated = {
        ...existing,
        targetCalories,
        syncStatus: "pending"
      };
      setState((prev) => ({ ...prev, dietTargets: prev.dietTargets.map((item) => (item.id === existing.id ? updated : item)) }));
      await tryImmediateSync("dietTarget", updated);
      return;
    }

    const entry = {
      id: makeId(),
      date: dietDate,
      targetCalories,
      ownerEmail: activeUserEmail,
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({ ...prev, dietTargets: [entry, ...prev.dietTargets] }));
    await tryImmediateSync("dietTarget", entry);
  }

  async function deleteDietTarget() {
    if (!dietTargetEntry) {
      return;
    }

    const updated = { ...dietTargetEntry, deleted: true, syncStatus: "pending" };
    setState((prev) => ({ ...prev, dietTargets: prev.dietTargets.map((item) => (item.id === dietTargetEntry.id ? updated : item)) }));
    setDietTargetCaloriesInput("");
    await tryImmediateSync("dietTarget", updated);
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

    const url = getSheetUrlForType(state.settings, "portfolio");
    if (!url) {
      setStatusMessage("Add finance sheet URL before syncing portfolio.");
      return;
    }

    const success = await pushEntry("portfolio", entry, url);
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
    const pending = [
      ...state.habits.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "habit", entry })),
      ...state.tasks.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "task", entry })),
      ...state.trades.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "trade", entry })),
      ...state.portfolios.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "portfolio", entry })),
      ...state.stocks.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "stock", entry })),
      ...state.workouts.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "workout", entry })),
      ...state.diets.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "diet", entry })),
      ...state.dietTargets.filter((entry) => belongsToActiveUser(entry) && entry.syncStatus !== "synced").map((entry) => ({ type: "dietTarget", entry }))
    ];

    if (!pending.length) {
      setStatusMessage("Nothing to sync.");
      return;
    }

    let syncedCount = 0;
    for (const item of pending) {
      const url = getSheetUrlForType(state.settings, item.type);
      if (!url) {
        continue;
      }
      const success = await pushEntry(item.type, item.entry, url);
      updateSyncStatus(item.type, item.entry.id, success ? "synced" : "failed");
      if (success) {
        syncedCount += 1;
      }
    }

    setStatusMessage(`${syncedCount} of ${pending.length} synced.`);
  }

  async function tryImmediateSync(type, entry) {
    const url = getSheetUrlForType(state.settings, type);
    if (!url) {
      setStatusMessage("Saved locally. Add the correct sheet URL in Settings for this module.");
      return;
    }

    const success = await pushEntry(type, entry, url);
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
      <header className="app-header" role="banner">
        <div className="app-header-inner">
          <div className="app-brand">
            <span className="app-brand-icon"><AppLogoIcon /></span>
            <span className="app-brand-name">LifeTracker</span>
          </div>
          <div className="header-actions">
            {state.settings.activeUserEmail ? (
              <span className="app-user-chip" title={state.settings.activeUserEmail}>
                <UserIcon />
                <span>{state.settings.activeUserEmail.split("@")[0]}</span>
              </span>
            ) : null}
            <div className="header-settings-wrap">
              <button className="header-settings-btn" title="Settings" type="button" aria-expanded={showSettings} aria-controls="headerSettingsPanel" aria-label="Settings" onClick={() => setShowSettings((prev) => !prev)}>
                <SettingsIcon />
              </button>
              <section id="headerSettingsPanel" className={`bottom-settings-panel${showSettings ? "" : " hidden"}`}>
                <div className="settings-panel-header">
                  <p className="muted">Sync &amp; account settings</p>
                  <button className="close-icon-button" type="button" aria-label="Close settings" onClick={() => setShowSettings(false)}>
                    <CloseIcon />
                  </button>
                </div>
                <form className="settings-form" onSubmit={(event) => { event.preventDefault(); setShowSettings(false); setStatusMessage("Settings saved."); }}>
                  <label>
                    Habits + Tasks sheet URL
                    <input type="url" value={state.settings.habitsTasksSheetUrl} onChange={(event) => updateSettingsField("habitsTasksSheetUrl", event.target.value.trim())} placeholder="https://script.google.com/macros/s/.../exec" />
                  </label>
                  <label>
                    Stocks + Trades + Portfolio sheet URL
                    <input type="url" value={state.settings.financeSheetUrl} onChange={(event) => updateSettingsField("financeSheetUrl", event.target.value.trim())} placeholder="https://script.google.com/macros/s/.../exec" />
                  </label>
                  <label>
                    Workout + Diet sheet URL
                    <input type="url" value={state.settings.healthSheetUrl} onChange={(event) => updateSettingsField("healthSheetUrl", event.target.value.trim())} placeholder="https://script.google.com/macros/s/.../exec" />
                  </label>
                  <label>
                    Google account email
                    <input type="email" value={state.settings.activeUserEmail} onChange={(event) => updateSettingsField("activeUserEmail", event.target.value.toLowerCase())} placeholder="youremail@gmail.com" />
                  </label>
                  <p className="muted settings-help">Signed-in: {state.settings.activeUserEmail || "Not selected"}</p>
                  <section className="settings-usage-card" aria-label="Capacity and usage details">
                    <strong>Capacity and usage</strong>
                    <p className="muted">Cells used: {formatInteger(settingsCapacitySnapshot.estimatedUsedCells)} / {formatInteger(SHEET_CELL_LIMIT)} ({formatPercent(settingsCapacitySnapshot.usagePercent)})</p>
                    <p className="muted">Remaining: {formatInteger(settingsCapacitySnapshot.remainingCells)}</p>
                    <p className="muted">Rows: Habits {formatInteger(settingsCapacitySnapshot.rows.habits)}, Tasks {formatInteger(settingsCapacitySnapshot.rows.tasks)}, Trades {formatInteger(settingsCapacitySnapshot.rows.trades)}, Portfolio {formatInteger(settingsCapacitySnapshot.rows.portfolios)}, Stocks {formatInteger(settingsCapacitySnapshot.rows.stocks)}, Workouts {formatInteger(settingsCapacitySnapshot.rows.workouts)}, Diets {formatInteger(settingsCapacitySnapshot.rows.diets)}, Diet Targets {formatInteger(settingsCapacitySnapshot.rows.dietTargets)}</p>
                  </section>
                  <label>
                    Google OAuth Client ID (optional)
                    <input value={state.settings.googleClientId} onChange={(event) => updateSettingsField("googleClientId", event.target.value.trim())} placeholder="Optional: paste OAuth client ID for one-click login" />
                  </label>
                  {state.settings.googleClientId ? <div id="googleSignInButton"></div> : null}
                  {state.settings.activeUserEmail ? <button className="button button-secondary" type="button" onClick={signOutGoogleAccount}>Sign out</button> : null}
                  <button className="button" type="submit">Save settings</button>
                  <button className="button button-secondary" type="button" onClick={syncPendingEntries}>Sync pending entries</button>
                </form>
              </section>
            </div>
          </div>
        </div>
      </header>

      <main className="page-content">
        {activeTab !== "home" && (
          <div className="page-back-wrap">
            <button className="button button-secondary back-home-button" type="button" onClick={() => setActiveTab("home")}>
              <BackIcon />
              Back to Home
            </button>
          </div>
        )}

        {activeTab === "home" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Home</h2>
            </div>
            <p className="muted compact-row">Tap an app card to open that page.</p>
            <div className="home-app-grid">
              <button type="button" className="home-app-tile" onClick={() => setActiveTab("habit")}>
                <span className="home-app-icon"><HabitTabIcon /></span>
                <strong>Habit</strong>
              </button>
              <button type="button" className="home-app-tile" onClick={() => setActiveTab("task")}>
                <span className="home-app-icon"><TaskTabIcon /></span>
                <strong>Task</strong>
              </button>
              <button type="button" className="home-app-tile" onClick={() => setActiveTab("trading")}>
                <span className="home-app-icon"><TradingTabIcon /></span>
                <strong>Trading</strong>
              </button>
              <button type="button" className="home-app-tile" onClick={() => setActiveTab("portfolio")}>
                <span className="home-app-icon"><PortfolioTabIcon /></span>
                <strong>Portfolio</strong>
              </button>
              <button type="button" className="home-app-tile" onClick={() => setActiveTab("stocks")}>
                <span className="home-app-icon"><StocksTabIcon /></span>
                <strong>Stocks</strong>
              </button>
              <button type="button" className="home-app-tile" onClick={() => setActiveTab("workout")}>
                <span className="home-app-icon"><WorkoutTabIcon /></span>
                <strong>Workout</strong>
              </button>
              <button type="button" className="home-app-tile" onClick={() => setActiveTab("diet")}>
                <span className="home-app-icon"><DietTabIcon /></span>
                <strong>Diet</strong>
              </button>
              <button type="button" className="home-app-tile" onClick={() => setShowSettings(true)}>
                <span className="home-app-icon"><SettingsIcon /></span>
                <strong>Settings</strong>
              </button>
            </div>
          </section>
        )}

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
                <button className="icon-add-button" type="button" title="Add monthly portfolio details" onClick={() => openPortfolioEditor()}><PlusIcon /></button>
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
              <article className="summary-card"><span>Remaining</span><strong>{formatNumber(currentPortfolioSummary.remaining)}</strong></article>
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

        {activeTab === "workout" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Workout planner</h2>
            </div>

            <div className="field-grid three-up compact-row">
              <label>
                Workout date
                <input type="date" value={workoutDate} onChange={(event) => setWorkoutDate(event.target.value || getToday())} />
              </label>
              <label>
                Muscle group
                <select value={workoutMuscle} onChange={(event) => setWorkoutMuscle(event.target.value)}>
                  {Object.keys(workoutLibraryData).map((key) => <option key={key} value={key}>{workoutLibraryData[key].label}</option>)}
                </select>
              </label>
              <label>
                Exercise
                <select value={workoutExerciseKey} onChange={(event) => setWorkoutExerciseKey(event.target.value)}>
                  {workoutOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <div className="panel-actions compact-row">
              <button className="button" type="button" onClick={addWorkoutToToday}>Add to today workout</button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Muscle</th>
                    <th>Workout</th>
                    <th>Weight</th>
                    <th>Unit</th>
                    <th>Reps</th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {workoutEntries.length ? workoutEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.bodyPartLabel}</td>
                      <td>{entry.subgroup} - {entry.exercise}</td>
                      <td><input type="number" step="0.1" value={entry.weight ?? ""} onChange={(event) => updateWorkoutEntry(entry.id, "weight", event.target.value)} /></td>
                      <td>
                        <select value={entry.unit || "kg"} onChange={(event) => updateWorkoutEntry(entry.id, "unit", event.target.value)}>
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </td>
                      <td><input type="number" step="1" value={entry.reps ?? ""} onChange={(event) => updateWorkoutEntry(entry.id, "reps", event.target.value)} /></td>
                      <td>{makeSyncIcon(entry.syncStatus)}</td>
                      <td><button className="icon-button" type="button" title="Delete workout" onClick={() => deleteWorkoutEntry(entry.id)}><TrashIcon /></button></td>
                    </tr>
                  )) : <tr><td colSpan="7">No workouts added for this date.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "diet" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Diet calculator</h2>
              <div className="panel-actions">
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowDietGraph((prev) => !prev)}><GraphIcon /></button>
              </div>
            </div>

            <div className="summary-grid report-grid compact-row">
              <article className="summary-card"><span>Protein (g)</span><strong>{formatNumber(dietDayTotals.protein)}</strong></article>
              <article className="summary-card"><span>Carbs (g)</span><strong>{formatNumber(dietDayTotals.carbs)}</strong></article>
              <article className="summary-card"><span>Fat (g)</span><strong>{formatNumber(dietDayTotals.fat)}</strong></article>
              <article className="summary-card stock-total-card"><span>Calories</span><strong>{formatNumber(dietDayTotals.calories)}</strong></article>
            </div>

            <div className="field-grid three-up compact-row">
              <label>
                Diet date
                <input type="date" value={dietDate} onChange={(event) => setDietDate(event.target.value || getToday())} />
              </label>
              <label>
                Target calories
                <input type="number" step="1" value={dietTargetCaloriesInput} onChange={(event) => setDietTargetCaloriesInput(event.target.value)} placeholder="Set daily target" />
              </label>
              <div className="panel-actions diet-target-actions">
                <button className="button" type="button" onClick={saveDietTarget}>Save target</button>
                <button className="button button-secondary" type="button" onClick={deleteDietTarget} disabled={!dietTargetEntry}>Delete target</button>
              </div>
            </div>

            {showDietGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <h3>Diet target vs consumed</h3>
                  <p className="muted">Target is manual. Consumed is from today's food entries.</p>
                </div>
                <div className="line-chart-wrap">
                  <svg viewBox={`0 0 ${dietDayChart.width} ${dietDayChart.height}`} className="line-chart" role="img" aria-label="Diet target versus consumed calories chart">
                    <line x1={dietDayChart.leftPad} y1={dietDayChart.height - dietDayChart.bottomPad} x2={dietDayChart.width - dietDayChart.rightPad} y2={dietDayChart.height - dietDayChart.bottomPad} className="line-grid" />
                    <rect x={dietDayChart.xTarget} y={dietDayChart.toY(dietTargetCalories)} width={dietDayChart.barW} height={(dietDayChart.height - dietDayChart.bottomPad) - dietDayChart.toY(dietTargetCalories)} className="diet-target-bar" />
                    <rect x={dietDayChart.xConsumed} y={dietDayChart.toY(dietConsumedCalories)} width={dietDayChart.barW} height={(dietDayChart.height - dietDayChart.bottomPad) - dietDayChart.toY(dietConsumedCalories)} className="diet-consumed-bar" />
                    <text x={dietDayChart.xTarget + (dietDayChart.barW / 2)} y={dietDayChart.height - 16} textAnchor="middle" className="line-x-label">Target</text>
                    <text x={dietDayChart.xConsumed + (dietDayChart.barW / 2)} y={dietDayChart.height - 16} textAnchor="middle" className="line-x-label">Consumed</text>
                    <text x={dietDayChart.xTarget + (dietDayChart.barW / 2)} y={dietDayChart.toY(dietTargetCalories) - 6} textAnchor="middle" className="line-y-label">{formatNumber(dietTargetCalories)}</text>
                    <text x={dietDayChart.xConsumed + (dietDayChart.barW / 2)} y={dietDayChart.toY(dietConsumedCalories) - 6} textAnchor="middle" className="line-y-label">{formatNumber(dietConsumedCalories)}</text>
                  </svg>
                </div>
              </section>
            )}

            <div className="field-grid three-up compact-row">
              <label>
                Food
                <select value={dietFoodName} onChange={(event) => setDietFoodName(event.target.value)}>
                  {dietFoodOptions.map((food) => <option key={food.name} value={food.name}>{food.name} ({food.serving})</option>)}
                </select>
              </label>
              <label>
                Input mode
                <select value={dietInputMode} onChange={(event) => setDietInputMode(event.target.value)}>
                  <option value="serving">Quantity (servings)</option>
                  <option value="weight">Weight (grams)</option>
                </select>
              </label>
            </div>

            <div className="field-grid two-up compact-row">
              <label>
                Quantity (servings)
                <input type="number" step="0.1" value={dietServingQty} disabled={dietInputMode !== "serving"} onChange={(event) => setDietServingQty(event.target.value)} />
              </label>
              <label>
                Weight (g)
                <input type="number" step="1" value={dietWeightQty} disabled={dietInputMode !== "weight"} onChange={(event) => setDietWeightQty(event.target.value)} />
              </label>
            </div>

            <div className="panel-actions compact-row">
              <button className="button" type="button" onClick={addDietEntry}>Add food</button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Food</th>
                    <th>Input</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fat</th>
                    <th>Calories</th>
                    <th className="icon-col"></th>
                    <th className="icon-col"></th>
                  </tr>
                </thead>
                <tbody>
                  {dietEntries.length ? dietEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.foodName}</td>
                      <td>{formatNumber(entry.quantity)} {entry.quantityUnit}</td>
                      <td>{formatNumber(entry.protein)}</td>
                      <td>{formatNumber(entry.carbs)}</td>
                      <td>{formatNumber(entry.fat)}</td>
                      <td>{formatNumber(entry.calories)}</td>
                      <td>{makeSyncIcon(entry.syncStatus)}</td>
                      <td><button className="icon-button" type="button" title="Delete food" onClick={() => deleteDietEntry(entry.id)}><TrashIcon /></button></td>
                    </tr>
                  )) : <tr><td colSpan="8">No food added for this date.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer" role="contentinfo">
        <span className="app-footer-logo"><AppLogoIcon /></span>
        <span className="app-footer-name">LifeTracker</span>
        <span className="app-footer-tagline">Your personal habit, task &amp; finance companion</span>
      </footer>

      <div className={`status-toast ${statusMessage ? "visible" : ""}`} aria-live="polite">{statusMessage}</div>
    </div>
  );
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
      || localStorage.getItem("habitTaskTradingTracker.v6")
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
        habitsTasksSheetUrl: String((parsed.settings && (parsed.settings.habitsTasksSheetUrl || parsed.settings.sheetUrl)) || "").trim(),
        financeSheetUrl: String((parsed.settings && parsed.settings.financeSheetUrl) || "").trim(),
        healthSheetUrl: String((parsed.settings && parsed.settings.healthSheetUrl) || "").trim(),
        googleClientId: String((parsed.settings && parsed.settings.googleClientId) || ""),
        activeUserEmail: String((parsed.settings && parsed.settings.activeUserEmail) || "").trim().toLowerCase(),
        activeUserName: String((parsed.settings && parsed.settings.activeUserName) || ""),
        portfolioCategories: Array.isArray(parsed.settings && parsed.settings.portfolioCategories) ? parsed.settings.portfolioCategories.map(normalizeCategoryText).filter(Boolean) : []
      },
      habits: Array.isArray(parsed.habits) ? parsed.habits.map(normalizeHabit) : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks.map(normalizeTask) : [],
      trades: Array.isArray(parsed.trades) ? parsed.trades.map(normalizeTrade) : [],
      portfolios: Array.isArray(parsed.portfolios) ? parsed.portfolios.map(normalizePortfolio) : [],
      stocks: Array.isArray(parsed.stocks) ? parsed.stocks.map(normalizeStock) : [],
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts.map(normalizeWorkout) : [],
      diets: Array.isArray(parsed.diets) ? parsed.diets.map(normalizeDiet) : [],
      dietTargets: Array.isArray(parsed.dietTargets) ? parsed.dietTargets.map(normalizeDietTarget) : []
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

function normalizeWorkout(entry) {
  return {
    id: entry.id || makeId(),
    date: String(entry.date || getToday()),
    bodyPart: String(entry.bodyPart || "chest"),
    bodyPartLabel: String(entry.bodyPartLabel || (WORKOUT_LIBRARY[entry.bodyPart] ? WORKOUT_LIBRARY[entry.bodyPart].label : entry.bodyPart || "Chest")),
    subgroup: String(entry.subgroup || ""),
    exercise: String(entry.exercise || ""),
    weight: entry.weight === null || entry.weight === "" || entry.weight === undefined ? null : Number(entry.weight || 0),
    unit: String(entry.unit || "kg"),
    reps: entry.reps === null || entry.reps === "" || entry.reps === undefined ? null : Number(entry.reps || 0),
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function normalizeDiet(entry) {
  return {
    id: entry.id || makeId(),
    date: String(entry.date || getToday()),
    foodName: String(entry.foodName || ""),
    serving: String(entry.serving || ""),
    inputMode: String(entry.inputMode || "serving"),
    quantity: Number(entry.quantity || 0),
    quantityUnit: String(entry.quantityUnit || "serving"),
    protein: Number(entry.protein || 0),
    carbs: Number(entry.carbs || 0),
    fat: Number(entry.fat || 0),
    calories: Number(entry.calories || 0),
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function normalizeDietTarget(entry) {
  return {
    id: entry.id || makeId(),
    date: String(entry.date || getToday()),
    targetCalories: Number(entry.targetCalories || 0),
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function getWorkoutOptions(workoutLibrary, bodyPart) {
  const bucket = workoutLibrary[bodyPart];
  if (!bucket || !bucket.groups) {
    return [];
  }

  return Object.keys(bucket.groups).flatMap((group) => bucket.groups[group].map((exercise) => ({
    key: `${group}::${exercise}`,
    group,
    exercise,
    label: `${group} - ${exercise}`
  })));
}

function normalizeWorkoutCatalog(rawCatalog) {
  const catalog = {};
  const source = rawCatalog && typeof rawCatalog === "object" ? rawCatalog : {};
  Object.keys(source).forEach((partKey) => {
    const part = source[partKey] || {};
    const groups = part.groups && typeof part.groups === "object" ? part.groups : {};
    const normalizedGroups = {};
    Object.keys(groups).forEach((groupName) => {
      const exercises = Array.isArray(groups[groupName]) ? groups[groupName].map((item) => String(item || "").trim()).filter(Boolean) : [];
      if (exercises.length) {
        normalizedGroups[String(groupName || "").trim()] = exercises;
      }
    });

    if (Object.keys(normalizedGroups).length) {
      const key = normalizeCategoryText(partKey);
      catalog[key] = {
        label: String(part.label || capitalize(partKey)),
        groups: normalizedGroups
      };
    }
  });
  return catalog;
}

function normalizeDietCatalog(rawFoods) {
  if (!Array.isArray(rawFoods)) {
    return [];
  }

  return rawFoods
    .map((item) => ({
      name: String(item.name || "").trim(),
      serving: String(item.serving || "").trim(),
      baseGrams: item.baseGrams === null || item.baseGrams === undefined || item.baseGrams === "" ? null : Number(item.baseGrams),
      protein: Number(item.protein || 0),
      carbs: Number(item.carbs || 0),
      fat: Number(item.fat || 0),
      calories: Number(item.calories || 0)
    }))
    .filter((item) => item.name && item.serving);
}

function buildCatalogUrl(url) {
  const separator = String(url).includes("?") ? "&" : "?";
  return `${url}${separator}catalog=1`;
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

function getSheetUrlForType(settings, type) {
  if (type === "habit" || type === "task") {
    return String(settings.habitsTasksSheetUrl || "").trim();
  }
  if (type === "trade" || type === "portfolio" || type === "stock") {
    return String(settings.financeSheetUrl || "").trim();
  }
  if (type === "workout" || type === "diet" || type === "dietTarget") {
    return String(settings.healthSheetUrl || "").trim();
  }
  return "";
}

function getStateKeyForType(type) {
  if (type === "habit") return "habits";
  if (type === "task") return "tasks";
  if (type === "trade") return "trades";
  if (type === "workout") return "workouts";
  if (type === "diet") return "diets";
  if (type === "dietTarget") return "dietTargets";
  if (type === "stock") return "stocks";
  return "portfolios";
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));
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

function AppLogoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" focusable="false" fill="none">
      <circle cx="16" cy="16" r="14" fill="url(#alg)" />
      <defs>
        <linearGradient id="alg" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <polyline points="8,22 11,15 14,19 17,11 20,16 23,10" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function UserIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4Z" fill="currentColor" /></svg>;
}

function SettingsIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19.14 12.94a7.94 7.94 0 0 0 .05-.94 7.94 7.94 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54a7.28 7.28 0 0 0-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.94 7.94 0 0 0-.05.94 7.94 7.94 0 0 0 .05.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.38 1.05.7 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.58-.24 1.13-.56 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" fill="currentColor" /></svg>;
}

function GraphIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3h2v18H3V3Zm16 6h2v12h-2V9ZM11 13h2v8h-2v-8Zm-4-4h2v12H7V9Zm8-6h2v18h-2V3Z" fill="currentColor" /></svg>;
}

function HomeTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 3 10v11h6v-7h6v7h6V10l-9-7Z" fill="currentColor" /></svg>;
}

function HabitTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 4h10V6H7v1Zm2 4h6v2H9v-2Zm0 4h4v2H9v-2Z" fill="currentColor" /><path d="M11.5 8.5 13 10l3-3 1.2 1.2L13 12.4 10.8 10.2l.7-.7Z" fill="currentColor" opacity="0.9" /></svg>;
}

function TaskTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1.5 4.5 1.4-1.4L11 8.2l4.1-4.1 1.4 1.4L11 11ZM7 13h10v2H7v-2Zm0 4h7v2H7v-2Z" fill="currentColor" /></svg>;
}

function TradingTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 18h16v2H4v-2Zm2-4 3-3 2.5 2.5L18 9.5 19.5 11l-8 8-2.5-2.5L6 17l-2-3 2-4Z" fill="currentColor" /><path d="M7 7h4V5H7V3H5v6h2V7Zm10 0h2V3h-2V7Z" fill="currentColor" opacity="0.85" /></svg>;
}

function PortfolioTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 6h16v12H4V6Zm2 2v8h12V8H6Zm2 1h4v2H8V9Zm0 3h7v2H8v-2Z" fill="currentColor" /><path d="M9 4h6l1 2H8l1-2Z" fill="currentColor" opacity="0.85" /></svg>;
}

function StocksTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 20h16v2H4v-2Zm2-3V9h3v8H6Zm5-5V5h3v12h-3v-5Zm5 2v-7h3v7h-3Z" fill="currentColor" /><path d="M7 14l3-3 3 2 5-5 1.5 1.5-6.5 6.5-3-2-2 2L7 14Z" fill="currentColor" opacity="0.9" /></svg>;
}

function WorkoutTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 10h4v4H2v-4Zm16 0h4v4h-4v-4ZM7 8h10v8H7V8Zm1-3h2v2H8V5Zm6 0h2v2h-2V5Zm-6 12h2v2H8v-2Zm6 0h2v2h-2v-2Z" fill="currentColor" /></svg>;
}

function DietTabIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3c2 0 4 1.8 4 4 0 2.1-1.9 4-4 4S3 9.1 3 7c0-2.2 2-4 4-4Zm10 0 4 4-9 9-4 1 1-4 9-9Z" fill="currentColor" /><path d="M3 19h18v2H3v-2Z" fill="currentColor" opacity="0.9" /></svg>;
}

function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.3 6.29-6.3Z" fill="currentColor" /></svg>;
}

function BackIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 11H7.83l4.88-4.88L11.29 4.7 4 12l7.29 7.29 1.42-1.42L7.83 13H20v-2Z" fill="currentColor" /></svg>;
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
