const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "habitTaskTradingTracker.v7";
const THEME_STORAGE_KEY = "lifetracker.theme";

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (error) {
    // Ignore storage read errors and fall back to system preference.
  }
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

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
  shoulders: {
    label: "Shoulders",
    groups: {
      "Front Delts": ["Overhead Barbell Press", "Seated Dumbbell Press", "Arnold Press", "Front Raise"],
      "Side Delts": ["Lateral Raise", "Cable Lateral Raise", "Upright Row", "Machine Lateral Raise"],
      "Rear Delts": ["Reverse Pec Deck", "Face Pull", "Bent-Over Reverse Fly", "Rear Delt Cable Fly"],
      Traps: ["Barbell Shrug", "Dumbbell Shrug", "Rack Pull", "Farmer's Carry"]
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
  { name: "Bhatura", serving: "100g", baseGrams: 100, protein: 8, carbs: 45, fat: 14, calories: 330 },
  { name: "Whey Protein Powder", serving: "1 Scoop (30g)", baseGrams: 30, protein: 24, carbs: 2, fat: 1.5, calories: 120 },
  { name: "Rolled Oats (Dry)", serving: "100g", baseGrams: 100, protein: 13, carbs: 67, fat: 7, calories: 389 },
  { name: "Peanut Butter", serving: "100g", baseGrams: 100, protein: 25, carbs: 20, fat: 50, calories: 588 },
  { name: "Almonds", serving: "100g", baseGrams: 100, protein: 21, carbs: 22, fat: 49, calories: 579 },
  { name: "Walnuts", serving: "100g", baseGrams: 100, protein: 15, carbs: 14, fat: 65, calories: 654 },
  { name: "Roasted Peanuts", serving: "100g", baseGrams: 100, protein: 26, carbs: 16, fat: 49, calories: 567 },
  { name: "Toned Milk", serving: "100 ml", baseGrams: 100, protein: 3.3, carbs: 5, fat: 3, calories: 58 },
  { name: "Greek Yogurt", serving: "100g", baseGrams: 100, protein: 10, carbs: 4, fat: 0.4, calories: 59 },
  { name: "Plain Curd (Dahi)", serving: "100g", baseGrams: 100, protein: 3.5, carbs: 4.7, fat: 4, calories: 61 },
  { name: "Low-fat Paneer", serving: "100g", baseGrams: 100, protein: 20, carbs: 4, fat: 8, calories: 160 },
  { name: "Banana", serving: "100g", baseGrams: 100, protein: 1.1, carbs: 23, fat: 0.3, calories: 89 },
  { name: "Apple", serving: "100g", baseGrams: 100, protein: 0.3, carbs: 14, fat: 0.2, calories: 52 },
  { name: "Brown Rice (Cooked)", serving: "100g", baseGrams: 100, protein: 2.6, carbs: 23, fat: 0.9, calories: 111 },
  { name: "Sweet Potato (Boiled)", serving: "100g", baseGrams: 100, protein: 1.6, carbs: 20, fat: 0.1, calories: 86 },
  { name: "Broccoli", serving: "100g", baseGrams: 100, protein: 2.8, carbs: 7, fat: 0.4, calories: 34 },
  { name: "Spinach (Palak)", serving: "100g", baseGrams: 100, protein: 2.9, carbs: 3.6, fat: 0.4, calories: 23 },
  { name: "Quinoa (Cooked)", serving: "100g", baseGrams: 100, protein: 4.4, carbs: 21, fat: 1.9, calories: 120 },
  { name: "Chia Seeds", serving: "100g", baseGrams: 100, protein: 17, carbs: 42, fat: 31, calories: 486 },
  { name: "Flax Seeds", serving: "100g", baseGrams: 100, protein: 18, carbs: 29, fat: 42, calories: 534 },
  { name: "Besan (Gram Flour)", serving: "100g", baseGrams: 100, protein: 22, carbs: 58, fat: 6, calories: 387 },
  { name: "Moong Dal (Dry)", serving: "100g", baseGrams: 100, protein: 24, carbs: 59, fat: 1.2, calories: 347 },
  { name: "Masoor Dal (Dry)", serving: "100g", baseGrams: 100, protein: 25, carbs: 60, fat: 1, calories: 352 },
  { name: "Whole Wheat Bread", serving: "1 Slice", baseGrams: null, protein: 3, carbs: 12, fat: 1, calories: 75 },
  { name: "Chicken Thigh (Cooked)", serving: "100g", baseGrams: 100, protein: 26, carbs: 0, fat: 11, calories: 209 },
  { name: "Mutton/Lamb (Cooked)", serving: "100g", baseGrams: 100, protein: 25, carbs: 0, fat: 21, calories: 294 },
  { name: "Prawns (Cooked)", serving: "100g", baseGrams: 100, protein: 24, carbs: 0, fat: 0.3, calories: 99 },
  { name: "Tuna (Canned in Water)", serving: "100g", baseGrams: 100, protein: 26, carbs: 0, fat: 1, calories: 116 },
  { name: "Salmon (Cooked)", serving: "100g", baseGrams: 100, protein: 25, carbs: 0, fat: 13, calories: 208 },
  { name: "Palak Paneer", serving: "100g", baseGrams: 100, protein: 8, carbs: 6, fat: 13, calories: 180 },
  { name: "Butter Chicken", serving: "100g", baseGrams: 100, protein: 12, carbs: 6, fat: 14, calories: 220 },
  { name: "Dal Makhani", serving: "100g", baseGrams: 100, protein: 6, carbs: 15, fat: 9, calories: 160 },
  { name: "Aloo Gobi", serving: "100g", baseGrams: 100, protein: 3, carbs: 12, fat: 6, calories: 110 },
  { name: "Bhindi Masala", serving: "100g", baseGrams: 100, protein: 2, carbs: 8, fat: 7, calories: 105 },
  { name: "Baingan Bharta", serving: "100g", baseGrams: 100, protein: 2, carbs: 8, fat: 6, calories: 95 },
  { name: "Vegetable Khichdi", serving: "100g", baseGrams: 100, protein: 4, carbs: 18, fat: 3, calories: 120 },
  { name: "Rasam", serving: "100g", baseGrams: 100, protein: 1.5, carbs: 6, fat: 1.5, calories: 45 },
  { name: "Buttermilk (Chaas)", serving: "100 ml", baseGrams: 100, protein: 1.5, carbs: 4, fat: 1, calories: 30 },
  { name: "Medu Vada", serving: "100g", baseGrams: 100, protein: 5, carbs: 25, fat: 13, calories: 250 },
  { name: "Puri", serving: "100g", baseGrams: 100, protein: 6, carbs: 40, fat: 18, calories: 360 },
  { name: "Dhokla", serving: "100g", baseGrams: 100, protein: 6, carbs: 22, fat: 5, calories: 160 },
  { name: "Bajra Roti", serving: "100g", baseGrams: 100, protein: 11, carbs: 67, fat: 5, calories: 350 },
  { name: "Jowar Roti", serving: "100g", baseGrams: 100, protein: 10, carbs: 72, fat: 3, calories: 349 },
  { name: "Ragi (Finger Millet)", serving: "100g", baseGrams: 100, protein: 7, carbs: 72, fat: 1.3, calories: 328 }
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
  { value: 0, label: "S" }
];

const REPORT_MODULES = [
  { key: "habit", label: "Habit" },
  { key: "task", label: "Task" },
  { key: "trading", label: "Trading" },
  { key: "portfolio", label: "Portfolio" },
  { key: "stocks", label: "Stocks" },
  { key: "workout", label: "Workout" },
  { key: "diet", label: "Diet" }
];

const PLAN_DAYS = [
  { key: "Mon", label: "Monday" },
  { key: "Tue", label: "Tuesday" },
  { key: "Wed", label: "Wednesday" },
  { key: "Thu", label: "Thursday" },
  { key: "Fri", label: "Friday" },
  { key: "Sat", label: "Saturday" },
  { key: "Sun", label: "Sunday" }
];

const PLAN_MEALS = ["Breakfast", "Mid-Morning", "Lunch", "Snack", "Dinner"];

const DEFAULT_DIET_PLAN = [];

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
  dietTargets: [],
  customWorkouts: [],
  customFoods: [],
  dietPlan: DEFAULT_DIET_PLAN
};

function App() {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("home");
  const [statusMessage, setStatusMessage] = useState("");
  const [theme, setTheme] = useState(loadTheme);
  const activeUserEmail = String(state.settings.activeUserEmail || "").trim().toLowerCase();

  const [habitDate, setHabitDate] = useState(getToday());
  const [habitMonth, setHabitMonth] = useState(getCurrentMonth());
  const [taskSortDir, setTaskSortDir] = useState("asc");
  const [portfolioMonth, setPortfolioMonth] = useState(getCurrentMonth());
  const [portfolioGraphRange, setPortfolioGraphRange] = useState("monthly");
  const [portfolioGraphYear, setPortfolioGraphYear] = useState(String(new Date().getFullYear()));
  const [portfolioGraphMonth, setPortfolioGraphMonth] = useState(getCurrentMonth());

  const [reportFrom, setReportFrom] = useState(getCurrentMonth() + "-01");
  const [reportTo, setReportTo] = useState(getToday());
  const [reportModules, setReportModules] = useState({ habit: true, task: true, trading: false, portfolio: false, stocks: false, workout: false, diet: false });

  const [showSettings, setShowSettings] = useState(false);
  const settingsWrapRef = useRef(null);
  const [showHabitAdd, setShowHabitAdd] = useState(false);
  const [showTaskAdd, setShowTaskAdd] = useState(false);
  const [showTradeAdd, setShowTradeAdd] = useState(false);
  const [showPortfolioAdd, setShowPortfolioAdd] = useState(false);
  const [showStockAdd, setShowStockAdd] = useState(false);

  const [showHabitGraph, setShowHabitGraph] = useState(false);
  const [showTaskGraph, setShowTaskGraph] = useState(false);
  const [showTradeGraph, setShowTradeGraph] = useState(false);
  const [showTradeCalendar, setShowTradeCalendar] = useState(false);
  const [tradeMonth, setTradeMonth] = useState(getToday().slice(0, 7));
  const [selectedTradeDay, setSelectedTradeDay] = useState("");
  const [showPortfolioGraph, setShowPortfolioGraph] = useState(false);
  const [showStockGraph, setShowStockGraph] = useState(false);
  const [showWorkoutGraph, setShowWorkoutGraph] = useState(false);
  const [showDietGraph, setShowDietGraph] = useState(false);
  const [showDietTargetForm, setShowDietTargetForm] = useState(false);
  const [showDietPlan, setShowDietPlan] = useState(false);
  const [dietPlanForm, setDietPlanForm] = useState({ day: "Mon", meal: "Breakfast", time: "08:00", foodName: DIET_FOODS[0] ? DIET_FOODS[0].name : "", inputMode: "serving", quantity: "1", prep: "" });

  const [workoutLibraryData, setWorkoutLibraryData] = useState(WORKOUT_LIBRARY);
  const [dietFoodOptions, setDietFoodOptions] = useState(DIET_FOODS);

  const mergedWorkoutLibrary = useMemo(() => mergeCustomWorkouts(workoutLibraryData, state.customWorkouts), [workoutLibraryData, state.customWorkouts]);
  const mergedFoodOptions = useMemo(() => mergeCustomFoods(dietFoodOptions, state.customFoods), [dietFoodOptions, state.customFoods]);

  const [showWorkoutAdd, setShowWorkoutAdd] = useState(false);
  const [showFoodAdd, setShowFoodAdd] = useState(false);
  const [workoutCustomForm, setWorkoutCustomForm] = useState({ bodyPart: "chest", group: "", exercise: "" });
  const [foodCustomForm, setFoodCustomForm] = useState({ name: "", mode: "serving", serving: "", baseGrams: "", protein: "", carbs: "", fat: "", calories: "", caloriesTouched: false });

  const [habitForm, setHabitForm] = useState({ name: "", startTime: "", endTime: "", repeatDays: [] });
  const [taskForm, setTaskForm] = useState({ title: "", completionTime: "", notes: "" });
  const [noteModalTask, setNoteModalTask] = useState(null);
  const [tradeForm, setTradeForm] = useState({ date: getToday(), target: "" });
  const [stockForm, setStockForm] = useState({ stockName: "", category: "", buyAmount: "", buyDate: getToday(), quantity: "" });
  const [workoutDate, setWorkoutDate] = useState(getToday());
  const [workoutMuscle, setWorkoutMuscle] = useState("chest");
  const [workoutExerciseKey, setWorkoutExerciseKey] = useState("");
  const [dietDate, setDietDate] = useState(getToday());
  const [dietFoodName, setDietFoodName] = useState(DIET_FOODS[0] ? DIET_FOODS[0].name : "");
  const [dietInputMode, setDietInputMode] = useState("serving");
  const [dietServingQty, setDietServingQty] = useState("1");
  const [dietWeightQty, setDietWeightQty] = useState("");
  const [dietTargetCaloriesInput, setDietTargetCaloriesInput] = useState("");
  const [dietTargetProteinInput, setDietTargetProteinInput] = useState("");
  const [dietTargetCarbsInput, setDietTargetCarbsInput] = useState("");
  const [dietTargetFatInput, setDietTargetFatInput] = useState("");

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
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      // Ignore storage write errors; theme still applies for this session.
    }
  }, [theme]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }
    const timer = window.setTimeout(() => setStatusMessage(""), 2600);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    if (!showSettings) {
      return undefined;
    }
    function handlePointerDown(event) {
      if (settingsWrapRef.current && !settingsWrapRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSettings]);

  useEffect(() => {
    setPortfolioGraphMonth(portfolioMonth || getCurrentMonth());
  }, [portfolioMonth]);

  useEffect(() => {
    const activeFoodNames = mergedFoodOptions.map((item) => item.name);
    if (!dietFoodName || !activeFoodNames.includes(dietFoodName)) {
      setDietFoodName(mergedFoodOptions[0] ? mergedFoodOptions[0].name : "");
    }
  }, [mergedFoodOptions, dietFoodName]);

  useEffect(() => {
    const keys = Object.keys(mergedWorkoutLibrary);
    if (!keys.length) {
      return;
    }
    if (!keys.includes(workoutMuscle)) {
      setWorkoutMuscle(keys[0]);
    }
  }, [mergedWorkoutLibrary, workoutMuscle]);

  useEffect(() => {
    setDietTargetCaloriesInput(dietTargetEntry ? String(dietTargetEntry.targetCalories || "") : "");
    setDietTargetProteinInput(dietTargetEntry ? String(dietTargetEntry.targetProtein || "") : "");
    setDietTargetCarbsInput(dietTargetEntry ? String(dietTargetEntry.targetCarbs || "") : "");
    setDietTargetFatInput(dietTargetEntry ? String(dietTargetEntry.targetFat || "") : "");
  }, [dietTargetEntry, dietDate]);

  useEffect(() => {
    if (!showDietTargetForm) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      const input = document.getElementById("diet-target-calories-input");
      if (input) {
        input.focus();
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [showDietTargetForm]);

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
          setWorkoutLibraryData(mergeWorkoutCatalogs(WORKOUT_LIBRARY, remoteWorkout));
        }
        if (remoteDiet.length) {
          setDietFoodOptions(mergeCustomFoods(DIET_FOODS, remoteDiet));
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

  const visibleHabits = useMemo(() => sortHabitsForDate(state.habits.filter((habit) => !habit.deleted && belongsToActiveUser(habit) && getHabitStartDate(habit) <= habitDate && habitRepeatsOnDate(habit, habitDate)), habitDate), [state.habits, habitDate, activeUserEmail]);
  const filteredTasks = useMemo(() => {
    const today = getToday();
    const tasks = state.tasks.filter((task) => {
      if (task.deleted || !belongsToActiveUser(task)) {
        return false;
      }
      // Pending tasks always stay; completed tasks stay only on the day they were completed, then disappear.
      if (task.completed) {
        const completedDay = String(task.completedAt || "").slice(0, 10);
        return completedDay === today;
      }
      return true;
    });
    return sortTasksByCompletion(tasks, taskSortDir);
  }, [state.tasks, activeUserEmail, taskSortDir]);

  const dailyTradesAsc = useMemo(() => state.trades.filter((trade) => !trade.deleted && belongsToActiveUser(trade)).sort((a, b) => a.date.localeCompare(b.date)), [state.trades, activeUserEmail]);
  const dailyTradesDesc = useMemo(() => [...dailyTradesAsc].sort((a, b) => b.date.localeCompare(a.date)), [dailyTradesAsc]);
  const monthTradesDesc = useMemo(() => dailyTradesDesc.filter((trade) => String(trade.date || "").slice(0, 7) === tradeMonth), [dailyTradesDesc, tradeMonth]);

  const portfolioEntriesDesc = useMemo(() => state.portfolios.filter((entry) => !entry.deleted && belongsToActiveUser(entry)).sort((a, b) => b.month.localeCompare(a.month)), [state.portfolios, activeUserEmail]);
  const currentPortfolio = useMemo(() => portfolioEntriesDesc.find((entry) => entry.month === portfolioMonth) || null, [portfolioEntriesDesc, portfolioMonth]);
  const currentPortfolioSummary = useMemo(() => summarizePortfolioItems(currentPortfolio ? currentPortfolio.items : []), [currentPortfolio]);

  const stocksDesc = useMemo(() => state.stocks.filter((stock) => !stock.deleted && belongsToActiveUser(stock)).sort((a, b) => (b.buyDate || "").localeCompare(a.buyDate || "")), [state.stocks, activeUserEmail]);
  const workoutOptions = useMemo(() => getWorkoutOptions(mergedWorkoutLibrary, workoutMuscle), [mergedWorkoutLibrary, workoutMuscle]);
  const workoutEntries = useMemo(() => state.workouts.filter((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.date === workoutDate).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")), [state.workouts, workoutDate, activeUserEmail]);
  const dietEntries = useMemo(() => state.diets.filter((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.date === dietDate).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")), [state.diets, dietDate, activeUserEmail]);

  const dietPlanGrid = useMemo(() => {
    const map = {};
    (Array.isArray(state.dietPlan) ? state.dietPlan : []).forEach((item) => {
      const key = `${item.day}::${item.meal}`;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    });
    Object.values(map).forEach((list) => list.sort((a, b) => String(a.time || "").localeCompare(String(b.time || ""))));
    return map;
  }, [state.dietPlan]);
  const dietPlanTotals = useMemo(() => {
    const plan = Array.isArray(state.dietPlan) ? state.dietPlan : [];
    const empty = () => ({ protein: 0, carbs: 0, fat: 0, calories: 0 });
    const target = empty();
    const eaten = empty();
    plan.forEach((item) => {
      const macros = computePlanMacros(item, mergedFoodOptions);
      target.protein += macros.protein;
      target.carbs += macros.carbs;
      target.fat += macros.fat;
      target.calories += macros.calories;
      if (item.eaten) {
        eaten.protein += macros.protein;
        eaten.carbs += macros.carbs;
        eaten.fat += macros.fat;
        eaten.calories += macros.calories;
      }
    });
    return { target, eaten };
  }, [state.dietPlan, mergedFoodOptions]);
  const todayDayKey = getTodayDayKey();
  const todayDayLabel = (PLAN_DAYS.find((d) => d.key === todayDayKey) || {}).label || todayDayKey;
  const todayPlanItems = useMemo(() => {
    const plan = Array.isArray(state.dietPlan) ? state.dietPlan : [];
    return plan
      .filter((item) => item.day === todayDayKey)
      .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
  }, [state.dietPlan, todayDayKey]);
  const dietTodayTotals = useMemo(() => {
    const empty = () => ({ protein: 0, carbs: 0, fat: 0, calories: 0 });
    const target = empty();
    const eaten = empty();
    todayPlanItems.forEach((item) => {
      const macros = computePlanMacros(item, mergedFoodOptions);
      target.protein += macros.protein;
      target.carbs += macros.carbs;
      target.fat += macros.fat;
      target.calories += macros.calories;
      if (item.eaten) {
        eaten.protein += macros.protein;
        eaten.carbs += macros.carbs;
        eaten.fat += macros.fat;
        eaten.calories += macros.calories;
      }
    });
    return { target, eaten };
  }, [todayPlanItems, mergedFoodOptions]);
  const dietTargetEntry = useMemo(() => state.dietTargets.find((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.date === dietDate) || null, [state.dietTargets, dietDate, activeUserEmail]);

  const graphScopeValue = portfolioGraphRange === "monthly" ? portfolioGraphMonth : `${portfolioGraphYear}-01`;
  const portfolioYears = useMemo(() => {
    const years = state.portfolios
      .filter((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.month)
      .map((entry) => String(entry.month).slice(0, 4));
    return [...new Set([String(new Date().getFullYear()), ...years])].sort((a, b) => b.localeCompare(a));
  }, [state.portfolios, activeUserEmail]);

  const tradeCalendar = useMemo(() => {
    const byDate = {};
    dailyTradesAsc.forEach((trade) => {
      byDate[trade.date] = trade;
    });

    const [yearPart, monthPart] = String(tradeMonth || getToday().slice(0, 7)).split("-");
    const year = Number(yearPart);
    const month = Number(monthPart);
    const totalDays = getDaysInMonth(tradeMonth);
    const leadingBlanks = year && month ? new Date(year, month - 1, 1).getDay() : 0;

    const cells = [];
    for (let index = 0; index < leadingBlanks; index += 1) {
      cells.push({ blank: true, key: `blank-${index}` });
    }

    let monthTotal = 0;
    for (let day = 1; day <= totalDays; day += 1) {
      const dateKey = `${tradeMonth}-${String(day).padStart(2, "0")}`;
      const trade = byDate[dateKey];
      const hasValue = trade && trade.achieved !== undefined && trade.achieved !== null && trade.achieved !== "";
      const achieved = hasValue ? Number(trade.achieved || 0) : null;
      if (hasValue) {
        monthTotal += achieved;
      }

      cells.push({
        blank: false,
        key: dateKey,
        day,
        hasValue,
        achieved
      });
    }

    return { cells, monthTotal };
  }, [dailyTradesAsc, tradeMonth]);

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

  const workoutVolumeByMuscle = useMemo(() => {
    const totals = new Map();
    workoutEntries.forEach((entry) => {
      const key = entry.bodyPartLabel || "Other";
      const volume = Number(entry.weight || 0) * Number(entry.reps || 0);
      if (volume <= 0) return;
      totals.set(key, (totals.get(key) || 0) + volume);
    });
    return [...totals.entries()].map(([label, value], index) => ({ label, value, color: PIE_COLORS[index % PIE_COLORS.length] })).sort((a, b) => b.value - a.value);
  }, [workoutEntries]);

  const dietDayTotals = dietTodayTotals.eaten;
  const dietTargetCalories = Number(dietTodayTotals.target.calories || 0);
  const dietTargetProtein = Number(dietTodayTotals.target.protein || 0);
  const dietTargetCarbs = Number(dietTodayTotals.target.carbs || 0);
  const dietTargetFat = Number(dietTodayTotals.target.fat || 0);
  const dietConsumedCalories = Number(dietDayTotals.calories || 0);

  const dietDayChart = useMemo(() => {
    const width = 560;
    const height = 240;
    const leftPad = 48;
    const rightPad = 16;
    const topPad = 24;
    const bottomPad = 52;
    const plotH = height - topPad - bottomPad;
    const plotW = width - leftPad - rightPad;
    const groupW = plotW / 4;
    const barW = Math.floor(groupW * 0.3);
    const barGap = Math.floor(groupW * 0.06);
    const barOffset = (groupW - barW * 2 - barGap) / 2;

    const groups = [
      { label: "Calories", target: dietTargetCalories, consumed: dietConsumedCalories },
      { label: "Protein (g)", target: dietTargetProtein, consumed: dietDayTotals.protein },
      { label: "Carbs (g)", target: dietTargetCarbs, consumed: dietDayTotals.carbs },
      { label: "Fat (g)", target: dietTargetFat, consumed: dietDayTotals.fat }
    ];

    return { width, height, leftPad, rightPad, topPad, bottomPad, plotH, groupW, barW, barGap, barOffset, groups };
  }, [dietTargetCalories, dietConsumedCalories, dietTargetProtein, dietTargetCarbs, dietTargetFat, dietDayTotals]);

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

    let targetRunning = 0;
    let achievedRunning = 0;
    const targetValues = dailyTradesAsc.map((trade) => (targetRunning += Number(trade.target || 0)));
    const achievedValues = dailyTradesAsc.map((trade) => (achievedRunning += Number(trade.achieved || 0)));
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

    const targetPoints = targetValues.map((value, index) => `${toX(index)},${toY(value)}`).join(" ");
    const achievedPoints = achievedValues.map((value, index) => `${toX(index)},${toY(value)}`).join(" ");

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

  function openDietTargetForm() {
    setShowDietTargetForm(true);
  }

  function closeDietTargetForm() {
    setShowDietTargetForm(false);
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
      bodyPartLabel: mergedWorkoutLibrary[workoutMuscle] ? mergedWorkoutLibrary[workoutMuscle].label : workoutMuscle,
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

  function addCustomWorkout(event) {
    event.preventDefault();
    const bodyPart = normalizeCategoryText(workoutCustomForm.bodyPart);
    const exercise = String(workoutCustomForm.exercise || "").trim();
    if (!bodyPart || !exercise) {
      setStatusMessage("Select a muscle group and enter a workout name.");
      return;
    }

    const bodyPartLabel = mergedWorkoutLibrary[bodyPart] ? mergedWorkoutLibrary[bodyPart].label : capitalize(bodyPart);
    const group = String(workoutCustomForm.group || "").trim() || "Custom";
    const newEntry = { id: makeId(), bodyPart, bodyPartLabel, group, exercise };

    setState((prev) => {
      const exists = (prev.customWorkouts || []).some(
        (item) => item.bodyPart === bodyPart && item.group === group && item.exercise === exercise
      );
      if (exists) {
        return prev;
      }
      return { ...prev, customWorkouts: [...(prev.customWorkouts || []), newEntry] };
    });

    setWorkoutMuscle(bodyPart);
    setWorkoutExerciseKey(`${group}::${exercise}`);
    setWorkoutCustomForm((prev) => ({ ...prev, exercise: "" }));
    setShowWorkoutAdd(false);
    setStatusMessage(`Added workout: ${exercise}`);
  }

  function updateFoodField(field, value) {
    setFoodCustomForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "mode" && value === "weight" && (next.baseGrams === "" || next.baseGrams === null)) {
        next.baseGrams = "100";
      }
      if (field === "calories") {
        next.caloriesTouched = String(value).trim() !== "";
      }
      if ((field === "protein" || field === "carbs" || field === "fat") && !next.caloriesTouched) {
        const auto = computeAutoCalories(next.protein, next.carbs, next.fat);
        next.calories = auto ? String(auto) : "";
      }
      return next;
    });
  }

  function addCustomFood(event) {
    event.preventDefault();
    const name = String(foodCustomForm.name || "").trim();
    if (!name) {
      setStatusMessage("Enter a food name.");
      return;
    }

    const isWeight = foodCustomForm.mode === "weight";
    const baseGrams = isWeight ? Number(foodCustomForm.baseGrams || 100) || 100 : null;
    const serving = isWeight
      ? `${baseGrams}g`
      : (String(foodCustomForm.serving || "").trim() || "1 serving");

    const protein = Number(foodCustomForm.protein || 0);
    const carbs = Number(foodCustomForm.carbs || 0);
    const fat = Number(foodCustomForm.fat || 0);
    const calories = foodCustomForm.caloriesTouched && String(foodCustomForm.calories).trim() !== ""
      ? Number(foodCustomForm.calories || 0)
      : computeAutoCalories(protein, carbs, fat);

    const newFood = { id: makeId(), name, serving, baseGrams, protein, carbs, fat, calories };

    setState((prev) => ({
      ...prev,
      customFoods: [...(prev.customFoods || []).filter((item) => item.name !== name), newFood]
    }));

    setDietFoodName(name);
    setDietInputMode(isWeight ? "weight" : "serving");
    setFoodCustomForm({ name: "", mode: "serving", serving: "", baseGrams: "", protein: "", carbs: "", fat: "", calories: "", caloriesTouched: false });
    setShowFoodAdd(false);
    setStatusMessage(`Added food: ${name}`);
  }

  async function updateWorkoutEntry(entryId, field, value, sync) {
    let updated = null;
    setState((prev) => ({
      ...prev,
      workouts: prev.workouts.map((entry) => {
        if (entry.id !== entryId) {
          return entry;
        }
        let next;
        if (field === "weight" || field === "reps") {
          next = {
            ...entry,
            [field]: value === "" ? null : Number(value),
            syncStatus: "pending"
          };
        } else {
          next = {
            ...entry,
            [field]: value,
            syncStatus: "pending"
          };
        }
        updated = next;
        return next;
      })
    }));
    if (sync && updated) {
      await tryImmediateSync("workout", updated);
    }
  }

  async function saveWorkoutEntry(entryId) {
    const entry = state.workouts.find((item) => item.id === entryId);
    if (!entry) {
      return;
    }
    await tryImmediateSync("workout", entry);
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
    const food = mergedFoodOptions.find((item) => item.name === dietFoodName);
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

  function addPlanSlot(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    const foodName = String(dietPlanForm.foodName || "").trim();
    if (!foodName) {
      setStatusMessage("Pick a food for the plan.");
      return;
    }
    const matchedFood = mergedFoodOptions.find((food) => food.name.toLowerCase() === foodName.toLowerCase());
    if (!matchedFood) {
      setStatusMessage(`"${foodName}" is not in the food list. Pick one from the dropdown or add it with the + button.`);
      return;
    }
    const quantity = Number(dietPlanForm.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setStatusMessage("Enter a valid quantity.");
      return;
    }
    const day = PLAN_DAYS.some((d) => d.key === dietPlanForm.day) ? dietPlanForm.day : "Mon";
    const meal = PLAN_MEALS.includes(dietPlanForm.meal) ? dietPlanForm.meal : PLAN_MEALS[0];
    const macros = computePlanMacros(
      { foodName: matchedFood.name, inputMode: dietPlanForm.inputMode === "weight" ? "weight" : "serving", quantity },
      mergedFoodOptions
    );
    const slot = {
      id: makeId(),
      day,
      meal,
      time: String(dietPlanForm.time || "").trim(),
      foodName: matchedFood.name,
      inputMode: dietPlanForm.inputMode === "weight" ? "weight" : "serving",
      quantity,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      calories: macros.calories,
      prep: String(dietPlanForm.prep || "").trim(),
      eaten: false
    };
    setState((prev) => {
      const plan = Array.isArray(prev.dietPlan) ? prev.dietPlan : [];
      return { ...prev, dietPlan: [...plan, slot] };
    });
    setDietPlanForm((prev) => ({ ...prev, prep: "" }));
    setStatusMessage(`Added ${matchedFood.name} to ${meal} on ${day}.`);
  }

  function openPlanCell(day, meal) {
    setDietPlanForm((prev) => ({ ...prev, day, meal }));
    const input = document.getElementById("diet-plan-food-input");
    if (input) {
      input.focus();
    }
  }

  function updatePlanSyncStatus(slotId, syncStatus) {
    setState((prev) => ({
      ...prev,
      dietPlan: (Array.isArray(prev.dietPlan) ? prev.dietPlan : []).map((slot) =>
        slot.id === slotId ? { ...slot, syncStatus } : slot
      )
    }));
  }

  async function togglePlanEaten(slotId) {
    const plan = Array.isArray(state.dietPlan) ? state.dietPlan : [];
    const current = plan.find((slot) => slot.id === slotId);
    if (!current) {
      return;
    }
    const nowEaten = !current.eaten;

    setState((prev) => ({
      ...prev,
      dietPlan: (Array.isArray(prev.dietPlan) ? prev.dietPlan : []).map((slot) =>
        slot.id === slotId
          ? { ...slot, eaten: nowEaten, syncStatus: nowEaten ? "pending" : "" }
          : slot
      )
    }));

    if (!nowEaten) {
      return;
    }

    const macros = computePlanMacros(current, mergedFoodOptions);
    const url = getSheetUrlForType(state.settings, "diet");
    if (!url) {
      updatePlanSyncStatus(slotId, "failed");
      setStatusMessage("Marked eaten. Add the Workout + Diet sheet URL in Settings to sync.");
      return;
    }

    const payload = {
      id: current.id,
      date: getToday(),
      day: current.day,
      meal: current.meal,
      time: current.time,
      foodName: current.foodName,
      serving: planServingLabel(current),
      inputMode: current.inputMode,
      quantity: current.quantity,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      calories: macros.calories,
      ownerEmail: activeUserEmail,
      deleted: false,
      createdAt: new Date().toISOString()
    };

    const result = await pushEntry("diet", payload, url);
    updatePlanSyncStatus(slotId, result.ok ? "synced" : "failed");
    setStatusMessage(result.ok ? "Marked eaten and synced." : `Marked eaten. Sync failed. ${result.error || ""}`.trim());
  }

  function removePlanSlot(slotId) {
    setState((prev) => ({
      ...prev,
      dietPlan: (Array.isArray(prev.dietPlan) ? prev.dietPlan : []).filter((slot) => slot.id !== slotId)
    }));
  }

  async function saveDietTarget() {
    const targetCalories = Number(dietTargetCaloriesInput || 0);
    const targetProtein = Number(dietTargetProteinInput || 0);
    const targetCarbs = Number(dietTargetCarbsInput || 0);
    const targetFat = Number(dietTargetFatInput || 0);
    if (!Number.isFinite(targetCalories) || targetCalories < 0) {
      setStatusMessage("Enter valid target calories.");
      return;
    }

    const existing = state.dietTargets.find((entry) => !entry.deleted && belongsToActiveUser(entry) && entry.date === dietDate);
    if (existing) {
      const updated = {
        ...existing,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFat,
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
      targetProtein,
      targetCarbs,
      targetFat,
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

  function toggleHabitRepeatDay(dayValue) {
    setHabitForm((prev) => {
      const days = Array.isArray(prev.repeatDays) ? prev.repeatDays : [];
      const next = days.includes(dayValue) ? days.filter((d) => d !== dayValue) : [...days, dayValue];
      return { ...prev, repeatDays: next };
    });
  }

  async function submitHabit(event) {
    event.preventDefault();

    const entry = {
      id: makeId(),
      name: String(habitForm.name || ""),
      startTime: String(habitForm.startTime || ""),
      endTime: String(habitForm.endTime || ""),
      repeatDays: Array.isArray(habitForm.repeatDays) ? [...habitForm.repeatDays].sort((a, b) => a - b) : [],
      ownerEmail: activeUserEmail,
      completions: {},
      deleted: false,
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };

    setState((prev) => ({ ...prev, habits: [entry, ...prev.habits] }));
    setHabitForm({ name: "", startTime: "", endTime: "", repeatDays: [] });
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

    const result = await pushEntry("portfolio", entry, url);
    updateSyncStatus("portfolio", entry.id, result.ok ? "synced" : "failed");
    setStatusMessage(result.ok ? "Portfolio synced." : `Portfolio sync failed. ${result.error || ""}`.trim());
  }

  function toggleReportModule(key) {
    setReportModules((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function buildReportSections() {
    const from = reportFrom;
    const to = reportTo;
    const inRange = (dateValue) => {
      const d = String(dateValue || "").slice(0, 10);
      if (!d) {
        return false;
      }
      return (!from || d >= from) && (!to || d <= to);
    };
    const fromMonth = String(from || "").slice(0, 7);
    const toMonth = String(to || "").slice(0, 7);
    const inMonthRange = (monthValue) => {
      const m = String(monthValue || "").slice(0, 7);
      if (!m) {
        return false;
      }
      return (!fromMonth || m >= fromMonth) && (!toMonth || m <= toMonth);
    };

    const sections = [];

    if (reportModules.habit) {
      const rows = [];
      state.habits.filter((h) => !h.deleted && belongsToActiveUser(h)).forEach((habit) => {
        const completions = habit.completions || {};
        Object.keys(completions).forEach((dateKey) => {
          if (inRange(dateKey)) {
            rows.push([dateKey, habit.name || "", completions[dateKey] ? "Yes" : "No"]);
          }
        });
      });
      rows.sort((a, b) => a[0].localeCompare(b[0]));
      sections.push({ key: "habit", title: "Habits", headers: ["Date", "Habit", "Achieved"], rows });
    }

    if (reportModules.task) {
      const rows = state.tasks
        .filter((t) => !t.deleted && belongsToActiveUser(t) && inRange(t.completionTime || t.createdAt))
        .sort((a, b) => String(a.completionTime || a.createdAt).localeCompare(String(b.completionTime || b.createdAt)))
        .map((t) => [formatDateTime(t.completionTime) || "-", t.title || "", t.notes || "", t.completed ? "Yes" : "No", formatDateTime(t.completedAt) || "-"]);
      sections.push({ key: "task", title: "Tasks", headers: ["Completion Time", "Task", "Notes", "Completed", "Completed At"], rows });
    }

    if (reportModules.trading) {
      const rows = state.trades
        .filter((t) => !t.deleted && belongsToActiveUser(t) && inRange(t.date))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((t) => [t.date || "", formatNumber(t.target), formatNumber(t.achieved), formatNumber(t.achievedPercent)]);
      sections.push({ key: "trading", title: "Trading", headers: ["Date", "Target", "Achieved", "Achieved %"], rows });
    }

    if (reportModules.portfolio) {
      const rows = state.portfolios
        .filter((p) => !p.deleted && belongsToActiveUser(p) && inMonthRange(p.month))
        .sort((a, b) => String(a.month).localeCompare(String(b.month)))
        .map((p) => {
          const summary = summarizePortfolioItems(p.items);
          return [formatMonthLabel(p.month), formatNumber(summary.income), formatNumber(summary.investment), formatNumber(summary.spent), formatNumber(summary.remaining)];
        });
      sections.push({ key: "portfolio", title: "Portfolio", headers: ["Month", "Income", "Investment", "Spent", "Remaining"], rows });
    }

    if (reportModules.stocks) {
      const rows = state.stocks
        .filter((s) => !s.deleted && belongsToActiveUser(s) && inRange(s.buyDate))
        .sort((a, b) => String(a.buyDate).localeCompare(String(b.buyDate)))
        .map((s) => [s.stockName || "", s.category || "", formatNumber(s.buyAmount), s.buyDate || "", formatNumber(s.quantity), formatNumber(Number(s.buyAmount || 0) * Number(s.quantity || 0))]);
      sections.push({ key: "stocks", title: "Stocks", headers: ["Stock", "Category", "Buy Amount", "Buy Date", "Quantity", "Invested"], rows });
    }

    if (reportModules.workout) {
      const rows = state.workouts
        .filter((w) => !w.deleted && belongsToActiveUser(w) && inRange(w.date))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((w) => [w.date || "", w.bodyPartLabel || w.bodyPart || "", w.subgroup || "", w.exercise || "", w.weight ?? "", w.unit || "", w.reps ?? ""]);
      sections.push({ key: "workout", title: "Workouts", headers: ["Date", "Body Part", "Subgroup", "Exercise", "Weight", "Unit", "Reps"], rows });
    }

    if (reportModules.diet) {
      const rows = state.diets
        .filter((d) => !d.deleted && belongsToActiveUser(d) && inRange(d.date))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((d) => [d.date || "", d.foodName || "", d.serving || "", formatNumber(d.protein), formatNumber(d.carbs), formatNumber(d.fat), formatNumber(d.calories)]);
      sections.push({ key: "diet", title: "Diet", headers: ["Date", "Food", "Serving", "Protein", "Carbs", "Fat", "Calories"], rows });
    }

    return sections;
  }

  function exportReportExcel() {
    const sections = buildReportSections();
    if (!sections.length) {
      setStatusMessage("Select at least one page to export.");
      return;
    }

    const usedNames = new Set();
    const uniqueSheetName = (rawTitle) => {
      let base = String(rawTitle || "Sheet").replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Sheet";
      let name = base;
      let counter = 2;
      while (usedNames.has(name.toLowerCase())) {
        const suffix = ` ${counter}`;
        name = base.slice(0, 31 - suffix.length) + suffix;
        counter += 1;
      }
      usedNames.add(name.toLowerCase());
      return name;
    };

    const buildCell = (value) => `<Cell><Data ss:Type="String">${escapeHtml(String(value === null || value === undefined ? "" : value))}</Data></Cell>`;
    const buildRow = (cells) => `<Row>${cells.map(buildCell).join("")}</Row>`;

    const worksheets = sections.map((section) => {
      const sheetName = uniqueSheetName(section.title);
      const rowsXml = [];
      rowsXml.push(buildRow([section.title]));
      rowsXml.push(buildRow([`Range: ${reportFrom} to ${reportTo}`]));
      rowsXml.push(buildRow([""]));
      rowsXml.push(buildRow(section.headers));
      if (section.rows.length) {
        section.rows.forEach((row) => rowsXml.push(buildRow(row)));
      } else {
        rowsXml.push(buildRow(["No data in this range."]));
      }
      return `<Worksheet ss:Name="${escapeHtml(sheetName)}"><Table>${rowsXml.join("")}</Table></Worksheet>`;
    }).join("");

    const xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n` +
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"` +
      ` xmlns:o="urn:schemas-microsoft-com:office:office"` +
      ` xmlns:x="urn:schemas-microsoft-com:office:excel"` +
      ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"` +
      ` xmlns:html="http://www.w3.org/TR/REC-html40">${worksheets}</Workbook>`;

    downloadFile(`lifetracker-report-${reportFrom}_to_${reportTo}.xls`, "application/vnd.ms-excel", xml);
    setStatusMessage("Report exported as Excel with a separate sheet per section.");
  }

  function exportReportPdf() {
    const sections = buildReportSections();
    if (!sections.length) {
      setStatusMessage("Select at least one page to export.");
      return;
    }

    const tablesHtml = sections.map((section, index) => {
      const head = section.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
      const body = section.rows.length
        ? section.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${section.headers.length}">No data in this range.</td></tr>`;
      return `<section class="report-page${index === 0 ? " first-page" : ""}">` +
        `<h1>LifeTracker report</h1><p class="report-meta">Range: ${escapeHtml(reportFrom)} to ${escapeHtml(reportTo)}</p>` +
        `<h2>${escapeHtml(section.title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></section>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>LifeTracker report</title>` +
      `<style>body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#111}h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin-top:14px}` +
      `table{border-collapse:collapse;width:100%;margin-top:8px}th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left}` +
      `th{background:#f0f0f5}.report-meta{color:#555;font-size:12px;margin-bottom:12px}` +
      `.report-page{page-break-after:always;break-after:page}.report-page:last-child{page-break-after:auto;break-after:auto}` +
      `</style></head><body>${tablesHtml}` +
      `<script>window.onload=function(){window.print();};<\/script></body></html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setStatusMessage("Allow pop-ups to export the PDF report.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setStatusMessage("Report opened with a separate page per section. Use the print dialog to save as PDF.");
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
    let lastError = "";
    for (const item of pending) {
      const url = getSheetUrlForType(state.settings, item.type);
      if (!url) {
        continue;
      }
      const result = await pushEntry(item.type, item.entry, url);
      updateSyncStatus(item.type, item.entry.id, result.ok ? "synced" : "failed");
      if (result.ok) {
        syncedCount += 1;
      } else if (result.error) {
        lastError = result.error;
      }
    }

    const summary = `${syncedCount} of ${pending.length} synced.`;
    setStatusMessage(lastError ? `${summary} ${lastError}` : summary);
  }

  async function tryImmediateSync(type, entry) {
    const url = getSheetUrlForType(state.settings, type);
    if (!url) {
      updateSyncStatus(type, entry.id, "failed");
      setStatusMessage("Saved locally. Add the correct sheet URL in Settings to sync.");
      return;
    }

    const result = await pushEntry(type, entry, url);
    updateSyncStatus(type, entry.id, result.ok ? "synced" : "failed");
    setStatusMessage(result.ok ? "Saved and synced." : `Saved locally. Sync failed. ${result.error || ""}`.trim());
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
            <button
              className="header-theme-btn"
              type="button"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <div className="header-settings-wrap" ref={settingsWrapRef}>
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
                  <button className="icon-save-button" type="submit" title="Save settings" aria-label="Save settings"><SaveIcon /></button>
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
              <button type="button" className="home-app-tile" onClick={() => setActiveTab("reports")}>
                <span className="home-app-icon"><ReportsIcon /></span>
                <strong>Reports</strong>
              </button>
            </div>
          </section>
        )}

        {activeTab === "reports" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Reports</h2>
            </div>

            <div className="toolbar-grid toolbar-grid-two">
              <label>
                From date
                <input type="date" value={reportFrom} max={reportTo} onChange={(event) => setReportFrom(event.target.value)} />
              </label>
              <label>
                To date
                <input type="date" value={reportTo} min={reportFrom} onChange={(event) => setReportTo(event.target.value)} />
              </label>
            </div>

            <div className="report-modules">
              <span className="report-modules-label">Pages to include</span>
              <div className="report-module-row" role="group" aria-label="Report pages">
                {REPORT_MODULES.map((module) => {
                  const selected = Boolean(reportModules[module.key]);
                  return (
                    <button
                      key={module.key}
                      type="button"
                      className={`report-module-btn${selected ? " is-selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => toggleReportModule(module.key)}
                    >{module.label}</button>
                  );
                })}
              </div>
            </div>

            <div className="report-actions">
              <button className="button" type="button" onClick={exportReportExcel}><DownloadIcon /> Download Excel</button>
              <button className="button button-secondary" type="button" onClick={exportReportPdf}><DownloadIcon /> Download PDF</button>
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

            {showHabitGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <div>
                    <h3>Habit monthly horizontal bar graph</h3>
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

            <StatStrip
              leftLabel="Completed"
              leftValue={habitCompletedCount}
              midLabel="Pending"
              midValue={habitPendingCount}
              rightLabel="Completion rate"
              rightValue={formatPercent(habitCompletedPercent)}
            />

            {showHabitAdd && (
              <Modal title="Add habit" onClose={() => setShowHabitAdd(false)}>
              <form className="inline-add-form" onSubmit={submitHabit}>
                <div className="field-grid three-up">
                  <label>Habit name<input value={habitForm.name} onChange={(event) => setHabitForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
                  <label>
                    Start time
                    <input type="time" value={habitForm.startTime} onChange={(event) => setHabitForm((prev) => ({ ...prev, startTime: event.target.value }))} />
                  </label>
                  <label>
                    End time
                    <input type="time" value={habitForm.endTime} onChange={(event) => setHabitForm((prev) => ({ ...prev, endTime: event.target.value }))} />
                  </label>
                </div>
                <div className="repeat-day-field">
                  <span className="repeat-day-label">Repeat on</span>
                  <div className="repeat-day-row" role="group" aria-label="Repeat days">
                    {WEEKDAY_OPTIONS.map((day) => {
                      const selected = (habitForm.repeatDays || []).includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          className={`repeat-day-btn${selected ? " is-selected" : ""}`}
                          aria-pressed={selected}
                          title={selected ? "Selected" : "Not selected"}
                          onClick={() => toggleHabitRepeatDay(day.value)}
                        >{day.label}</button>
                      );
                    })}
                  </div>
                  <p className="muted repeat-day-hint">Leave all unselected to show every day.</p>
                </div>
                <div className="panel-actions">
                  <button className="icon-save-button" type="submit" title="Save habit" aria-label="Save habit"><SaveIcon /></button>
                </div>
              </form>
              </Modal>
            )}

            <div className="toolbar-grid">
              <div className="date-nav">
                <button className="icon-button" type="button" aria-label="Previous day" title="Previous day" onClick={() => setHabitDate((prev) => shiftDate(prev, -1))}>‹</button>
                <input className="date-nav-input" type="date" value={habitDate} onChange={(event) => setHabitDate(event.target.value || getToday())} />
                <button className="icon-button" type="button" aria-label="Next day" title="Next day" onClick={() => setHabitDate((prev) => shiftDate(prev, 1))}>›</button>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Start</th>
                    <th>End</th>
                    <th className="icon-col">Achieved</th>
                    <th className="row-action-head" aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibleHabits.length ? visibleHabits.map((habit) => {
                    const completed = isHabitCompletedOnDate(habit, habitDate);
                    return (
                      <SelectableRow key={habit.id} className={completed ? "completed-row" : ""} title="Hold to select for delete" deleteLabel="Delete habit" onDelete={() => deleteHabit(habit.id)}>
                        <td>{habit.name || "-"}</td>
                        <td>{formatTime(habit.startTime)}</td>
                        <td>{formatTime(habit.endTime)}</td>
                        <td className="icon-col">
                          <StatusRadio
                            checked={completed}
                            status={habit.syncStatus}
                            title={completed ? "Achieved — click to undo" : "Mark achieved"}
                            onToggle={() => toggleHabitCompletion(habit.id, !completed)}
                          />
                        </td>
                      </SelectableRow>
                    );
                  }) : <tr><td colSpan="5">No habits available for this date.</td></tr>}
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

            <StatStrip leftLabel="Completed" leftValue={taskCompletedCount} midLabel="Pending" midValue={taskPendingCount} rightLabel="Completion rate" rightValue={formatPercent(taskCompletedPercent)} />

            {showTaskAdd && (
              <Modal title="Add task" onClose={() => setShowTaskAdd(false)}>
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
                  <button className="icon-save-button" type="submit" title="Save task" aria-label="Save task"><SaveIcon /></button>
                </div>
              </form>
              </Modal>
            )}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>
                      <button
                        type="button"
                        className="sort-header-button"
                        title={`Sort by completion time (${taskSortDir === "asc" ? "oldest first" : "newest first"})`}
                        onClick={() => setTaskSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
                      >
                        Completion time <span className="sort-arrow">{taskSortDir === "asc" ? "▲" : "▼"}</span>
                      </button>
                    </th>
                    <th>Notes</th>
                    <th className="icon-col">Completed</th>
                    <th className="row-action-head" aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length ? filteredTasks.map((task) => (
                    <SelectableRow key={task.id} className={task.completed ? "completed-row" : ""} title="Hold to select for delete" deleteLabel="Delete task" onDelete={() => deleteTask(task.id)}>
                      <td>{task.title || "-"}</td>
                      <td>{formatDateTime(task.completionTime)}</td>
                      <td>
                        {task.notes
                          ? <button className="icon-button" type="button" aria-label="View note" title="View note" onClick={() => setNoteModalTask(task)}><NotesIcon /></button>
                          : <span className="muted">-</span>}
                      </td>
                      <td className="icon-col">
                        <StatusRadio
                          checked={task.completed}
                          status={task.syncStatus}
                          title={task.completed ? "Completed — click to undo" : "Mark completed"}
                          onToggle={() => toggleTaskCompletion(task.id, !task.completed)}
                        />
                      </td>
                    </SelectableRow>
                  )) : <tr><td colSpan="5">No tasks found.</td></tr>}
                </tbody>
              </table>
            </div>

            {noteModalTask && (
              <Modal title={noteModalTask.title || "Task note"} subtitle="Task note details" onClose={() => setNoteModalTask(null)}>
                <p className="note-modal-body">{noteModalTask.notes}</p>
              </Modal>
            )}
          </section>
        )}

        {activeTab === "trading" && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Trading tracker</h2>
              <div className="panel-actions">
                <button className="graph-icon-button" type="button" title="Toggle calendar" onClick={() => setShowTradeCalendar((prev) => !prev)}><CalendarIcon /></button>
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowTradeGraph((prev) => !prev)}><GraphIcon /></button>
                <button className="icon-add-button" type="button" title="Add daily target" onClick={() => setShowTradeAdd((prev) => !prev)}><PlusIcon /></button>
              </div>
            </div>

            {showTradeAdd && (
              <Modal title="Add daily target" onClose={() => setShowTradeAdd(false)}>
              <form className="inline-add-form" onSubmit={saveTarget}>
                <div className="field-grid two-up">
                  <label>
                    Date
                    <input type="date" value={tradeForm.date} onChange={(event) => setTradeForm((prev) => ({ ...prev, date: event.target.value }))} />
                  </label>
                  <label>Daily target<input type="number" step="0.01" value={tradeForm.target} onChange={(event) => setTradeForm((prev) => ({ ...prev, target: event.target.value }))} /></label>
                </div>
                <div className="panel-actions">
                  <button className="icon-save-button" type="submit" title="Save daily target" aria-label="Save daily target"><SaveIcon /></button>
                </div>
              </form>
              </Modal>
            )}

            {showTradeCalendar && (
              <section className="graph-panel">
                <div className="graph-header">
                 
                  <input type="month" value={tradeMonth} onChange={(event) => setTradeMonth(event.target.value || getToday().slice(0, 7))} />
                </div>
                <div className="trade-calendar">
                  <div className="trade-calendar-weekdays">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                      <span key={label} className="trade-calendar-weekday">{label}</span>
                    ))}
                  </div>
                  <div className="trade-calendar-grid">
                    {tradeCalendar.cells.map((cell) => {
                      if (cell.blank) {
                        return <div key={cell.key} className="trade-calendar-cell is-blank" />;
                      }

                      const stateClass = !cell.hasValue
                        ? "is-empty"
                        : cell.achieved > 0
                          ? "is-profit"
                          : cell.achieved < 0
                            ? "is-loss"
                            : "is-flat";

                      const isSelected = cell.hasValue && selectedTradeDay === cell.key;
                      const amountLabel = cell.achieved > 0 ? `Profit ${formatNumber(cell.achieved)}` : cell.achieved < 0 ? `Loss ${formatNumber(cell.achieved)}` : formatNumber(cell.achieved);

                      return (
                        <button
                          key={cell.key}
                          type="button"
                          className={`trade-calendar-cell ${stateClass} ${isSelected ? "is-selected" : ""}`}
                          title={cell.hasValue ? amountLabel : ""}
                          disabled={!cell.hasValue}
                          onClick={() => setSelectedTradeDay((prev) => (prev === cell.key ? "" : cell.key))}
                        >
                          <span className="trade-calendar-day">{cell.day}</span>
                          {cell.hasValue && (
                            <span className="trade-calendar-tooltip">{amountLabel}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="trade-calendar-footer">
                    <span className={`trade-calendar-total ${tradeCalendar.monthTotal > 0 ? "is-profit" : tradeCalendar.monthTotal < 0 ? "is-loss" : ""}`}>
                      Month total: {formatNumber(tradeCalendar.monthTotal)}
                    </span>
                    <div className="line-legend">
                      <span><i className="legend-dot legend-target"></i>Profit</span>
                      <span><i className="legend-dot legend-achieved"></i>Loss</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {showTradeGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <h3>Cumulative PnL graph</h3>
                  <p className="muted">X axis: day | Y axis: running total (progressive sum)</p>
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

                <BarChart
                  title="Daily achieved P&L"
                  
                  data={dailyTradesAsc.map((trade) => ({
                    label: trade.date.slice(5),
                    value: Number(trade.achieved || 0),
                    color: Number(trade.achieved || 0) < 0 ? "var(--danger)" : "var(--ok)"
                  }))}
                  emptyMessage="No achieved P&L recorded yet."
                />
              </section>
            )}

            <div className="table-wrap">
              <div className="month-nav">
                <button className="icon-button" type="button" aria-label="Previous month" title="Previous month" onClick={() => setTradeMonth((prev) => shiftMonth(prev, -1))}>‹</button>
                <span className="month-nav-label">{formatMonthLabel(tradeMonth)}</span>
                <button className="icon-button" type="button" aria-label="Next month" title="Next month" onClick={() => setTradeMonth((prev) => shiftMonth(prev, 1))}>›</button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Target</th>
                    <th>Achieved</th>
                    <th className="icon-col">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {monthTradesDesc.length ? monthTradesDesc.map((trade) => {
                    const draftValue = tradeAchievedDrafts[trade.id];
                    const value = draftValue !== undefined ? draftValue : trade.achieved;
                    return (
                      <SwipeRow key={trade.id} onDelete={() => deleteTrade(trade.id)}>
                        <td>{formatShortDate(trade.date)}</td>
                        <td>{formatNumber(trade.target)}</td>
                        <td><input type="number" step="0.01" value={value ?? ""} onChange={(event) => setTradeAchievedDrafts((prev) => ({ ...prev, [trade.id]: event.target.value }))} onBlur={() => saveAchieved(trade.id)} /></td>
                        <td>{makeSyncIcon(trade.syncStatus)}</td>
                      </SwipeRow>
                    );
                  }) : <tr><td colSpan="4">No daily target rows for {formatMonthLabel(tradeMonth)}.</td></tr>}
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
                <button className="icon-add-button" type="button" title="Open selected month details" aria-label="Open selected month details" onClick={() => openPortfolioEditor()}><PiggyBankIcon /></button>
              </div>
            </div>

            {showPortfolioGraph && (
              <section className="graph-panel">
                <div className="graph-header portfolio-graph-header">
                  <div>
                    <h3>Portfolio pie charts</h3>
                    
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

                <BarChart
                  title="Category totals"
                  subtitle={getPortfolioRangeLabel(portfolioGraphRange, graphScopeValue)}
                  data={portfolioCategoryPieData}
                  emptyMessage="No category totals available for this range."
                />
              </section>
            )}

            <div className="toolbar-grid toolbar-grid-two">
              <label>
                Month
                <input type="month" value={portfolioMonth} onChange={(event) => setPortfolioMonth(event.target.value || getCurrentMonth())} />
              </label>
              <div className="portfolio-toolbar-actions">
                <button className="icon-save-button" type="button" title="Sync selected month" disabled={!currentPortfolio} onClick={() => currentPortfolio && syncPortfolio(currentPortfolio.id)}><SyncIcon /></button>
                <button className="icon-button" type="button" title="Delete selected month" disabled={!currentPortfolio} onClick={() => currentPortfolio && deletePortfolio(currentPortfolio.id)}><TrashIcon /></button>
              </div>
            </div>

            <div className="summary-grid report-grid compact-row">
              <article className="summary-card"><span>Income</span><strong>{formatNumber(currentPortfolioSummary.income)}</strong></article>
              <article className="summary-card"><span>Investment</span><strong>{formatNumber(currentPortfolioSummary.investment)}</strong></article>
              <article className="summary-card"><span>Spent</span><strong>{formatNumber(currentPortfolioSummary.spent)}</strong></article>
              {Object.keys(currentPortfolioSummary.byCategory)
                .filter((category) => !["income", "investment", "spent"].includes(category))
                .map((category) => (
                  <article className="summary-card" key={category}><span>{capitalize(category)}</span><strong>{formatNumber(currentPortfolioSummary.byCategory[category])}</strong></article>
                ))}
              <article className="summary-card"><span>Remaining</span><strong>{formatNumber(currentPortfolioSummary.remaining)}</strong></article>
            </div>

            {showPortfolioAdd && (
              <Modal title={`Portfolio details for ${formatMonthLabel(portfolioMonth)}`} subtitle="All fields are optional. You can save empty values too." onClose={closePortfolioEditor}>
              <form className="inline-add-form" onSubmit={savePortfolio}>
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
                        <th className="icon-col">
                          <button className="icon-add-button" type="button" aria-label="Add row" title="Add row" onClick={addPortfolioFormRow}><PlusIcon /></button>
                        </th>
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

                <button className="icon-save-button" type="submit" title="Save portfolio month" aria-label="Save portfolio month"><SaveIcon /></button>
              </form>
              </Modal>
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
                    <th className="icon-col">Edit</th>
                    <th className="icon-col">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioEntriesDesc.length ? portfolioEntriesDesc.map((entry) => {
                    const summary = summarizePortfolioItems(entry.items);
                    return (
                      <SwipeRow key={entry.id} onDelete={() => deletePortfolio(entry.id)} className={entry.month === portfolioMonth ? "selected-row" : ""}>
                        <td>{formatMonthLabel(entry.month)}</td>
                        <td>{formatNumber(summary.income)}</td>
                        <td>{formatNumber(summary.investment)}</td>
                        <td>{formatNumber(summary.spent)}</td>
                        <td>{formatNumber(summary.remaining)}</td>
                        <td>
                          <div className="row-action-group">
                            <button className="icon-button" type="button" aria-label="Edit month" title="Edit month" onClick={() => openPortfolioEditor(entry.month)}><EditIcon /></button>
                          </div>
                        </td>
                        <td>{makeSyncIcon(entry.syncStatus)}</td>
                      </SwipeRow>
                    );
                  }) : <tr><td colSpan="7">No portfolio months saved yet.</td></tr>}
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
                <button className="icon-add-button" type="button" title="Add stock" onClick={() => setShowStockAdd((prev) => !prev)}><PlusIcon /></button>
              </div>
            </div>

            {showStockGraph && (
              <section className="graph-panel">
                <PieChart
                  title="Stock allocation pie chart"
                  totalLabel="Allocation by stock based on buy amount × quantity"
                  data={stockAllocation}
                  emptyMessage="No stock allocation data yet."
                />
              </section>
            )}

            {showStockAdd && (
              <Modal title="Add stock" onClose={() => setShowStockAdd(false)}>
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
                  <button className="icon-save-button" type="submit" title="Save stock" aria-label="Save stock"><SaveIcon /></button>
                </div>
              </form>
              </Modal>
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
                    <th className="icon-col">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {stocksDesc.length ? stocksDesc.map((stock) => {
                    const invested = Number(stock.buyAmount || 0) * Number(stock.quantity || 0);
                    return (
                      <SwipeRow key={stock.id} title="Swipe to delete" onDelete={() => deleteStock(stock.id)}>
                        <td>{stock.stockName || "-"}</td>
                        <td>{stock.category || "-"}</td>
                        <td>{formatNumber(stock.buyAmount)}</td>
                        <td>{stock.buyDate || "-"}</td>
                        <td>{formatNumber(stock.quantity)}</td>
                        <td>{formatNumber(invested)}</td>
                        <td>{makeSyncIcon(stock.syncStatus)}</td>
                      </SwipeRow>
                    );
                  }) : <tr><td colSpan="7">No stocks saved yet.</td></tr>}
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
              <div className="panel-actions">
                <button className="icon-add-button" type="button" title="Add workout exercise" onClick={() => setShowWorkoutAdd(true)}><PlusIcon /></button>
              </div>
            </div>

            {showWorkoutAdd && (
              <Modal title="Add workout exercise" subtitle="Pick a muscle group and add a workout. It will appear in the exercise dropdown." onClose={() => setShowWorkoutAdd(false)}>
                <form className="inline-add-form" onSubmit={addCustomWorkout}>
                  <div className="field-grid three-up">
                    <label>
                      Muscle group
                      <select value={workoutCustomForm.bodyPart} onChange={(event) => setWorkoutCustomForm((prev) => ({ ...prev, bodyPart: event.target.value }))}>
                        {Object.keys(mergedWorkoutLibrary).map((key) => <option key={key} value={key}>{mergedWorkoutLibrary[key].label}</option>)}
                      </select>
                    </label>
                    <label>Subgroup (optional)<input value={workoutCustomForm.group} onChange={(event) => setWorkoutCustomForm((prev) => ({ ...prev, group: event.target.value }))} placeholder="e.g. Upper Chest" /></label>
                    <label>Workout name<input value={workoutCustomForm.exercise} onChange={(event) => setWorkoutCustomForm((prev) => ({ ...prev, exercise: event.target.value }))} placeholder="e.g. Incline Cable Fly" /></label>
                  </div>
                  <div className="panel-actions">
                    <button className="icon-save-button" type="submit" title="Save workout" aria-label="Save workout"><SaveIcon /></button>
                  </div>
                </form>
              </Modal>
            )}

            <div className="field-grid three-up compact-row">
              <label>
                Workout date
                <input type="date" value={workoutDate} onChange={(event) => setWorkoutDate(event.target.value || getToday())} />
              </label>
              <label>
                Muscle group
                <select value={workoutMuscle} onChange={(event) => setWorkoutMuscle(event.target.value)}>
                  {Object.keys(mergedWorkoutLibrary).map((key) => <option key={key} value={key}>{mergedWorkoutLibrary[key].label}</option>)}
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
                    <th className="icon-col">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {workoutEntries.length ? workoutEntries.map((entry) => (
                    <SwipeRow key={entry.id} onDelete={() => deleteWorkoutEntry(entry.id)}>
                      <td>{entry.bodyPartLabel}</td>
                      <td>{entry.subgroup} - {entry.exercise}</td>
                      <td><input type="number" step="0.1" value={entry.weight ?? ""} onChange={(event) => updateWorkoutEntry(entry.id, "weight", event.target.value)} onBlur={() => saveWorkoutEntry(entry.id)} /></td>
                      <td>
                        <select value={entry.unit || "kg"} onChange={(event) => updateWorkoutEntry(entry.id, "unit", event.target.value, true)}>
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </td>
                      <td><input type="number" step="1" value={entry.reps ?? ""} onChange={(event) => updateWorkoutEntry(entry.id, "reps", event.target.value)} onBlur={() => saveWorkoutEntry(entry.id)} /></td>
                      <td>{makeSyncIcon(entry.syncStatus)}</td>
                    </SwipeRow>
                  )) : <tr><td colSpan="6">No workouts added for this date.</td></tr>}
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
                <button className="graph-icon-button" type="button" title="Weekly diet plan" onClick={() => setShowDietPlan(true)}><MealPlanIcon /></button>
                <button className="graph-icon-button" type="button" title="Toggle graph" onClick={() => setShowDietGraph((prev) => !prev)}><GraphIcon /></button>
                <button className="icon-add-button" type="button" title="Add food to list" onClick={() => setShowFoodAdd(true)}><PlusIcon /></button>
              </div>
            </div>

            {showDietGraph && (
              <section className="graph-panel">
                <div className="graph-header">
                  <h3>Today's diet ({todayDayLabel})</h3>
                  <p className="muted">Blue = today's planned target · Red = eaten so far. Auto-calculated from the weekly plan.</p>
                </div>
                <div className="line-chart-wrap">
                  <svg viewBox={`0 0 ${dietDayChart.width} ${dietDayChart.height}`} className="line-chart" role="img" aria-label="Diet macros target versus consumed chart">
                    <line x1={dietDayChart.leftPad} y1={dietDayChart.height - dietDayChart.bottomPad} x2={dietDayChart.width - dietDayChart.rightPad} y2={dietDayChart.height - dietDayChart.bottomPad} className="line-grid" />
                    {dietDayChart.groups.map((group, i) => {
                      const maxVal = Math.max(1, group.target, group.consumed) * 1.1;
                      const baseY = dietDayChart.height - dietDayChart.bottomPad;
                      const targetH = Math.max(0, (group.target / maxVal) * dietDayChart.plotH);
                      const consumedH = Math.max(0, (group.consumed / maxVal) * dietDayChart.plotH);
                      const groupX = dietDayChart.leftPad + i * dietDayChart.groupW;
                      const targetX = groupX + dietDayChart.barOffset;
                      const consumedX = targetX + dietDayChart.barW + dietDayChart.barGap;
                      const centerX = groupX + dietDayChart.groupW / 2;
                      return (
                        <g key={group.label}>
                          <rect x={targetX} y={baseY - targetH} width={dietDayChart.barW} height={targetH} fill="#2563eb" rx="2" />
                          <rect x={consumedX} y={baseY - consumedH} width={dietDayChart.barW} height={consumedH} fill="#ef4444" rx="2" />
                          <text x={centerX} y={baseY + 16} textAnchor="middle" className="line-x-label">{group.label}</text>
                          {group.target > 0 && <text x={targetX + dietDayChart.barW / 2} y={Math.max(dietDayChart.topPad + 10, baseY - targetH - 4)} textAnchor="middle" className="line-y-label">{Math.round(group.target)}</text>}
                          {group.consumed > 0 && <text x={consumedX + dietDayChart.barW / 2} y={Math.max(dietDayChart.topPad + 10, baseY - consumedH - 4)} textAnchor="middle" className="line-y-label">{Math.round(group.consumed)}</text>}
                        </g>
                      );
                    })}
                  </svg>
                  <div className="line-legend">
                    <span><i className="legend-dot" style={{background:"#2563eb"}}></i>Target (blue)</span>
                    <span><i className="legend-dot legend-achieved"></i>Consumed (red)</span>
                  </div>
                </div>

                <BarChart
                  title="Eaten macros"
                  subtitle="Protein, carbs and fat from meals marked eaten (grams)"
                  data={[
                    { label: "Protein", value: dietDayTotals.protein, color: "var(--accent-1)" },
                    { label: "Carbs", value: dietDayTotals.carbs, color: "var(--accent-2)" },
                    { label: "Fat", value: dietDayTotals.fat, color: "var(--accent-3)" }
                  ]}
                  emptyMessage="No meals marked eaten yet."
                />
              </section>
            )}

            <div className="summary-grid report-grid compact-row">
              <article className="summary-card"><span>Protein (g)</span><strong>{formatNumber(dietDayTotals.protein)} / {formatNumber(dietTargetProtein)}</strong><small className="muted">eaten / target</small></article>
              <article className="summary-card"><span>Carbs (g)</span><strong>{formatNumber(dietDayTotals.carbs)} / {formatNumber(dietTargetCarbs)}</strong><small className="muted">eaten / target</small></article>
              <article className="summary-card"><span>Fat (g)</span><strong>{formatNumber(dietDayTotals.fat)} / {formatNumber(dietTargetFat)}</strong><small className="muted">eaten / target</small></article>
              <article className="summary-card stock-total-card"><span>Calories</span><strong>{formatNumber(dietDayTotals.calories)} / {formatNumber(dietTargetCalories)}</strong><small className="muted">eaten / target</small></article>
            </div>

            {showFoodAdd && (
              <Modal title="Add food" subtitle="Pick how it's measured, enter macros, and calories are auto-calculated." onClose={() => setShowFoodAdd(false)}>
                <form className="inline-add-form" onSubmit={addCustomFood}>
                  <div className="field-grid three-up">
                    <label>Food name<input value={foodCustomForm.name} onChange={(event) => updateFoodField("name", event.target.value)} placeholder="e.g. Grilled Paneer" /></label>
                    <label>
                      Measurement mode
                      <select value={foodCustomForm.mode} onChange={(event) => updateFoodField("mode", event.target.value)}>
                        <option value="serving">Per serving</option>
                        <option value="weight">Per weight (grams)</option>
                      </select>
                    </label>
                    {foodCustomForm.mode === "weight" ? (
                      <label>Base weight (g)<input type="number" step="1" value={foodCustomForm.baseGrams} onChange={(event) => updateFoodField("baseGrams", event.target.value)} placeholder="e.g. 100" /></label>
                    ) : (
                      <label>Serving label<input value={foodCustomForm.serving} onChange={(event) => updateFoodField("serving", event.target.value)} placeholder="e.g. 1 bowl / 1 piece" /></label>
                    )}
                  </div>
                  <div className="field-grid four-up">
                    <label>Protein (g)<input type="number" step="0.1" value={foodCustomForm.protein} onChange={(event) => updateFoodField("protein", event.target.value)} placeholder="g" /></label>
                    <label>Carbs (g)<input type="number" step="0.1" value={foodCustomForm.carbs} onChange={(event) => updateFoodField("carbs", event.target.value)} placeholder="g" /></label>
                    <label>Fat (g)<input type="number" step="0.1" value={foodCustomForm.fat} onChange={(event) => updateFoodField("fat", event.target.value)} placeholder="g" /></label>
                    <label>Calories (auto)<input type="number" step="1" value={foodCustomForm.calories} onChange={(event) => updateFoodField("calories", event.target.value)} placeholder="kcal" /></label>
                  </div>
                  <p className="muted">
                    Final per {foodCustomForm.mode === "weight" ? `${foodCustomForm.baseGrams || 100}g` : (foodCustomForm.serving || "1 serving")}:
                    {" "}{foodCustomForm.calories !== "" ? foodCustomForm.calories : computeAutoCalories(foodCustomForm.protein, foodCustomForm.carbs, foodCustomForm.fat)} kcal
                    {" "}(P {Number(foodCustomForm.protein || 0)}g · C {Number(foodCustomForm.carbs || 0)}g · F {Number(foodCustomForm.fat || 0)}g)
                  </p>
                  <div className="panel-actions">
                    <button className="icon-save-button" type="submit" title="Save food" aria-label="Save food"><SaveIcon /></button>
                  </div>
                </form>
              </Modal>
            )}

            {showDietPlan && (
              <Modal
                title="Weekly diet plan"
                subtitle="Build your weekly meals. Tap a meal to mark it eaten (turns green) — only eaten meals count as consumed, and the whole plan is your target."
                onClose={() => setShowDietPlan(false)}
              >
                <form className="inline-add-form diet-plan-form" onSubmit={addPlanSlot}>
                  <div className="field-grid three-up">
                    <label>
                      Day
                      <select value={dietPlanForm.day} onChange={(event) => setDietPlanForm((prev) => ({ ...prev, day: event.target.value }))}>
                        {PLAN_DAYS.map((d) => <option key={d.key} value={d.key}>{d.label}</option>)}
                      </select>
                    </label>
                    <label>
                      Meal block
                      <select value={dietPlanForm.meal} onChange={(event) => setDietPlanForm((prev) => ({ ...prev, meal: event.target.value }))}>
                        {PLAN_MEALS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </label>
                    <label>
                      Time
                      <input type="time" value={dietPlanForm.time} onChange={(event) => setDietPlanForm((prev) => ({ ...prev, time: event.target.value }))} />
                    </label>
                  </div>
                  <div className="field-grid three-up">
                    <label>
                      Food
                      <select
                        id="diet-plan-food-input"
                        value={dietPlanForm.foodName}
                        onChange={(event) => setDietPlanForm((prev) => ({ ...prev, foodName: event.target.value }))}
                      >
                        {mergedFoodOptions.map((food) => <option key={food.name} value={food.name}>{food.name} ({food.serving})</option>)}
                      </select>
                    </label>
                    <label>
                      Measured by
                      <select value={dietPlanForm.inputMode} onChange={(event) => setDietPlanForm((prev) => ({ ...prev, inputMode: event.target.value, quantity: event.target.value === "weight" ? "100" : "1" }))}>
                        <option value="serving">Servings</option>
                        <option value="weight">Weight (g)</option>
                      </select>
                    </label>
                    <label>
                      {dietPlanForm.inputMode === "weight" ? "Weight (g)" : "Servings"}
                      <input type="number" step="0.1" value={dietPlanForm.quantity} onChange={(event) => setDietPlanForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder={dietPlanForm.inputMode === "weight" ? "g" : "servings"} />
                    </label>
                  </div>
                  <div className="field-grid">
                    <label>
                      Prep notes
                      <input value={dietPlanForm.prep} onChange={(event) => setDietPlanForm((prev) => ({ ...prev, prep: event.target.value }))} placeholder="How to prepare (optional)" />
                    </label>
                  </div>
                  <div className="panel-actions">
                    <button className="icon-add-button" type="submit" title="Add meal to plan" aria-label="Add meal to plan"><PlusIcon /></button>
                  </div>
                </form>

                <div className="diet-plan-totals">
                  <article className="diet-plan-total-card"><span>Eaten / Target kcal</span><strong>{formatNumber(dietPlanTotals.eaten.calories)} / {formatNumber(dietPlanTotals.target.calories)}</strong></article>
                  <article className="diet-plan-total-card"><span>Protein (g)</span><strong>{formatNumber(dietPlanTotals.eaten.protein)} / {formatNumber(dietPlanTotals.target.protein)}</strong></article>
                  <article className="diet-plan-total-card"><span>Carbs (g)</span><strong>{formatNumber(dietPlanTotals.eaten.carbs)} / {formatNumber(dietPlanTotals.target.carbs)}</strong></article>
                  <article className="diet-plan-total-card"><span>Fat (g)</span><strong>{formatNumber(dietPlanTotals.eaten.fat)} / {formatNumber(dietPlanTotals.target.fat)}</strong></article>
                </div>

                <div className="table-wrap diet-plan-wrap">
                  <table className="diet-plan-table">
                    <thead>
                      <tr>
                        <th className="diet-plan-corner">Day \ Meal</th>
                        {PLAN_MEALS.map((meal) => (
                          <th key={meal} className="diet-plan-meal-head">{meal}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PLAN_DAYS.map((d) => (
                        <tr key={d.key}>
                          <th scope="row" className="diet-plan-day">
                            <span className="diet-plan-day-name">{d.label}</span>
                          </th>
                          {PLAN_MEALS.map((meal) => {
                            const items = dietPlanGrid[`${d.key}::${meal}`] || [];
                            return (
                              <td key={meal} className="diet-plan-block">
                                {items.map((item) => (
                                  <div
                                    key={item.id}
                                    className={`diet-plan-item${item.eaten ? " is-eaten" : ""}`}
                                    role="button"
                                    tabIndex={0}
                                    title={item.eaten ? "Eaten — tap to undo" : "Tap to mark eaten"}
                                    onClick={() => togglePlanEaten(item.id)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        togglePlanEaten(item.id);
                                      }
                                    }}
                                  >
                                    <div className="diet-plan-item-top">
                                      <span className="diet-plan-item-line">
                                        {item.eaten ? <span className="diet-plan-item-check"><CheckIcon /></span> : null}
                                        {item.time ? <span className="diet-plan-item-time">{formatPlanTime(item.time)}</span> : null}
                                        {item.time ? <span className="diet-plan-item-sep"> · </span> : null}
                                        <span className="diet-plan-item-food">{item.foodName}</span>
                                        <span className="diet-plan-item-serving"> - {planServingLabel(item)}</span>
                                      </span>
                                      <button type="button" className="diet-plan-remove" title="Remove meal" aria-label="Remove meal" onClick={(event) => { event.stopPropagation(); removePlanSlot(item.id); }}>×</button>
                                    </div>
                                    {item.prep ? <div className="diet-plan-item-prep">{item.prep}</div> : null}
                                  </div>
                                ))}
                                <button type="button" className="diet-plan-add-cell" title={`Add to ${meal} on ${d.label}`} aria-label={`Add to ${meal} on ${d.label}`} onClick={() => openPlanCell(d.key, meal)}>+ Add</button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Modal>
            )}

            <div className="diet-today-heading">
              <h3>Today's meals — {todayDayLabel}</h3>
              <p className="muted">Select the button to mark a meal eaten. It counts toward today's totals and syncs to your sheet — the button turns green once synced.</p>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Food</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fat</th>
                    <th>Calories</th>
                    <th className="icon-col">Eaten</th>
                  </tr>
                </thead>
                <tbody>
                  {todayPlanItems.length ? todayPlanItems.map((item) => {
                    const macros = computePlanMacros(item, mergedFoodOptions);
                    const synced = item.eaten && item.syncStatus === "synced";
                    const radioTitle = !item.eaten
                      ? "Mark eaten"
                      : synced
                        ? "Eaten & synced — click to undo"
                        : item.syncStatus === "failed"
                          ? "Eaten (sync failed) — click to undo"
                          : "Eaten (syncing…) — click to undo";
                    return (
                      <tr
                        key={item.id}
                        className={`diet-today-row${item.eaten ? " is-eaten" : ""}${synced ? " is-synced" : ""}`}
                      >
                        <td>{item.time ? formatPlanTime(item.time) : "-"}</td>
                        <td>{item.foodName} <small className="muted">({planServingLabel(item)})</small></td>
                        <td>{formatNumber(macros.protein)}</td>
                        <td>{formatNumber(macros.carbs)}</td>
                        <td>{formatNumber(macros.fat)}</td>
                        <td>{formatNumber(macros.calories)}</td>
                        <td className="icon-col">
                          <StatusRadio
                            checked={item.eaten}
                            status={item.syncStatus}
                            title={radioTitle}
                            onToggle={() => togglePlanEaten(item.id)}
                          />
                        </td>
                      </tr>
                    );
                  }) : <tr><td colSpan="7">No meals planned for {todayDayLabel}. Open the weekly plan to add some.</td></tr>}
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
      dietTargets: Array.isArray(parsed.dietTargets) ? parsed.dietTargets.map(normalizeDietTarget) : [],
      customWorkouts: Array.isArray(parsed.customWorkouts) ? parsed.customWorkouts.map(normalizeCustomWorkout).filter(Boolean) : [],
      customFoods: Array.isArray(parsed.customFoods) ? parsed.customFoods.map(normalizeCustomFood).filter(Boolean) : [],
      dietPlan: Array.isArray(parsed.dietPlan) ? parsed.dietPlan.map(normalizeDietPlanSlot).filter(Boolean) : structuredClone(DEFAULT_DIET_PLAN)
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
    repeatDays: Array.isArray(entry.repeatDays) ? entry.repeatDays.map(Number).filter((n) => n >= 0 && n <= 6) : [],
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
    targetProtein: Number(entry.targetProtein || 0),
    targetCarbs: Number(entry.targetCarbs || 0),
    targetFat: Number(entry.targetFat || 0),
    ownerEmail: String(entry.ownerEmail || "").trim().toLowerCase(),
    deleted: Boolean(entry.deleted),
    createdAt: entry.createdAt || new Date().toISOString(),
    syncStatus: entry.syncStatus || "pending"
  };
}

function normalizeCustomWorkout(entry) {
  if (!entry) {
    return null;
  }
  const exercise = String(entry.exercise || "").trim();
  const bodyPart = normalizeCategoryText(entry.bodyPart || "");
  if (!exercise || !bodyPart) {
    return null;
  }
  return {
    id: entry.id || makeId(),
    bodyPart,
    bodyPartLabel: String(entry.bodyPartLabel || capitalize(bodyPart)),
    group: String(entry.group || "").trim() || "Custom",
    exercise
  };
}

function normalizeCustomFood(entry) {
  if (!entry) {
    return null;
  }
  const name = String(entry.name || "").trim();
  if (!name) {
    return null;
  }
  return {
    id: entry.id || makeId(),
    name,
    serving: String(entry.serving || "").trim() || "1 serving",
    baseGrams: entry.baseGrams === null || entry.baseGrams === undefined || entry.baseGrams === "" ? null : Number(entry.baseGrams),
    protein: Number(entry.protein || 0),
    carbs: Number(entry.carbs || 0),
    fat: Number(entry.fat || 0),
    calories: Number(entry.calories || 0)
  };
}

function normalizeDietPlanSlot(entry) {
  if (!entry) {
    return null;
  }
  const foodName = String(entry.foodName || "").trim();
  if (!foodName) {
    return null;
  }
  if (!entry.day && !entry.meal) {
    return null;
  }
  const day = PLAN_DAYS.some((d) => d.key === entry.day) ? entry.day : "Mon";
  const meal = PLAN_MEALS.includes(entry.meal) ? entry.meal : PLAN_MEALS[0];
  const quantity = Number(entry.quantity);
  const num = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };
  return {
    id: entry.id || makeId(),
    day,
    meal,
    time: String(entry.time || "").trim(),
    foodName,
    inputMode: entry.inputMode === "weight" ? "weight" : "serving",
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    protein: num(entry.protein),
    carbs: num(entry.carbs),
    fat: num(entry.fat),
    calories: num(entry.calories),
    prep: String(entry.prep || "").trim(),
    eaten: Boolean(entry.eaten),
    syncStatus: entry.eaten ? (entry.syncStatus || "") : ""
  };
}

function computeAutoCalories(protein, carbs, fat) {
  const total = Number(protein || 0) * 4 + Number(carbs || 0) * 4 + Number(fat || 0) * 9;
  return Math.round(total);
}

function mergeCustomWorkouts(library, customWorkouts) {
  const merged = {};
  Object.keys(library || {}).forEach((partKey) => {
    const part = library[partKey] || {};
    const groups = {};
    Object.keys(part.groups || {}).forEach((groupName) => {
      groups[groupName] = [...(part.groups[groupName] || [])];
    });
    merged[partKey] = { label: part.label || capitalize(partKey), groups };
  });

  (customWorkouts || []).forEach((item) => {
    if (!item || !item.bodyPart || !item.exercise) {
      return;
    }
    if (!merged[item.bodyPart]) {
      merged[item.bodyPart] = { label: item.bodyPartLabel || capitalize(item.bodyPart), groups: {} };
    }
    const group = item.group || "Custom";
    if (!merged[item.bodyPart].groups[group]) {
      merged[item.bodyPart].groups[group] = [];
    }
    if (!merged[item.bodyPart].groups[group].includes(item.exercise)) {
      merged[item.bodyPart].groups[group].push(item.exercise);
    }
  });

  return merged;
}

function mergeCustomFoods(foodOptions, customFoods) {
  const names = new Set((foodOptions || []).map((item) => item.name));
  const extras = (customFoods || []).filter((item) => item && item.name && !names.has(item.name));
  return [...(foodOptions || []), ...extras];
}

function mergeWorkoutCatalogs(base, extra) {
  const merged = {};
  const copyInto = (source) => {
    Object.keys(source || {}).forEach((partKey) => {
      const part = source[partKey] || {};
      if (!merged[partKey]) {
        merged[partKey] = { label: part.label || capitalize(partKey), groups: {} };
      }
      Object.keys(part.groups || {}).forEach((groupName) => {
        if (!merged[partKey].groups[groupName]) {
          merged[partKey].groups[groupName] = [];
        }
        (part.groups[groupName] || []).forEach((exercise) => {
          if (!merged[partKey].groups[groupName].includes(exercise)) {
            merged[partKey].groups[groupName].push(exercise);
          }
        });
      });
    });
  };
  copyInto(base);
  copyInto(extra);
  return merged;
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

function habitRepeatsOnDate(entry, date) {
  const days = Array.isArray(entry.repeatDays) ? entry.repeatDays : [];
  if (!days.length) {
    return true;
  }
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return true;
  }
  return days.includes(parsed.getDay());
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

function sortTasksByCompletion(tasks, direction = "asc") {
  const factor = direction === "desc" ? -1 : 1;
  return [...tasks].sort((left, right) => {
    if (left.completed !== right.completed) {
      return left.completed ? 1 : -1;
    }
    return factor * (left.completionTime || left.createdAt || "").localeCompare(right.completionTime || right.createdAt || "");
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
  const summary = { income: 0, investment: 0, spent: 0, remaining: 0, other: 0, byCategory: {} };
  (items || []).forEach((item) => {
    const category = normalizePortfolioCategory(item.category);
    const amount = Number(item.amount || 0);
    summary.byCategory[category] = (summary.byCategory[category] || 0) + amount;
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

    if (!response.ok) {
      console.error(`Sync failed for ${type}: HTTP ${response.status} ${response.statusText} from ${url}`);
      return { ok: false, error: `HTTP ${response.status} ${response.statusText}` };
    }

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (body && body.ok === false) {
      console.error(`Sync rejected for ${type}: ${body.error} from ${url}`);
      return { ok: false, error: body.error || "Sheet script returned an error." };
    }

    return { ok: true, error: null };
  } catch (error) {
    console.error(`Sync request threw for ${type} at ${url}:`, error);
    return {
      ok: false,
      error: "Network/CORS error. Check the web app URL and that its access is set to \"Anyone\"."
    };
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

function formatShortDate(value) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(parsed);
}

function shiftMonth(monthValue, delta) {
  const [yearPart, monthPart] = String(monthValue || "").split("-");
  const year = Number(yearPart);
  const month = Number(monthPart);
  if (!year || !month) {
    return monthValue;
  }
  const parsed = new Date(year, month - 1 + delta, 1);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function shiftDate(dateValue, delta) {
  const base = String(dateValue || "").slice(0, 10);
  const parsed = new Date(`${base}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }
  parsed.setDate(parsed.getDate() + delta);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekDays(dateValue) {
  const base = new Date(`${String(dateValue || "").slice(0, 10)}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    return [];
  }
  const diffToMonday = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - diffToMonday);
  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    days.push(`${year}-${month}-${day}`);
  }
  return days;
}

function weekdayLabel(dateValue) {
  const parsed = new Date(`${String(dateValue || "").slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(parsed);
}

function formatPlanTime(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return text;
  }
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = hour >= 12 ? "pm" : "am";
  hour = hour % 12;
  if (hour === 0) {
    hour = 12;
  }
  return minute === 0 ? `${hour} ${period}` : `${hour}:${match[2]} ${period}`;
}

function planServingLabel(item) {
  const qty = Number(item.quantity) || 0;
  return item.inputMode === "weight" ? `${qty}g` : `${qty}`;
}

function getTodayDayKey() {
  const map = { 0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };
  return map[new Date().getDay()] || "Mon";
}

function computePlanMacros(item, foodOptions) {
  const empty = { protein: 0, carbs: 0, fat: 0, calories: 0 };
  if (!item) {
    return empty;
  }
  const stored = {
    protein: Number(item.protein),
    carbs: Number(item.carbs),
    fat: Number(item.fat),
    calories: Number(item.calories)
  };
  const hasStored = [stored.protein, stored.carbs, stored.fat, stored.calories]
    .some((value) => Number.isFinite(value) && value > 0);
  if (hasStored) {
    return {
      protein: Number.isFinite(stored.protein) ? stored.protein : 0,
      carbs: Number.isFinite(stored.carbs) ? stored.carbs : 0,
      fat: Number.isFinite(stored.fat) ? stored.fat : 0,
      calories: Number.isFinite(stored.calories) ? stored.calories : 0
    };
  }
  const food = (foodOptions || []).find((option) => option.name === item.foodName);
  if (!food) {
    return empty;
  }
  const qty = Number(item.quantity) || 0;
  if (qty <= 0) {
    return empty;
  }
  const multiplier = item.inputMode === "weight"
    ? (food.baseGrams ? qty / food.baseGrams : qty / 100)
    : qty;
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    return empty;
  }
  return {
    protein: Number(food.protein || 0) * multiplier,
    carbs: Number(food.carbs || 0) * multiplier,
    fat: Number(food.fat || 0) * multiplier,
    calories: Number(food.calories || 0) * multiplier
  };
}

function csvEscapeRow(values) {
  return values.map((value) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }).join(",");
}

function escapeHtml(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadFile(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function capitalize(value) {
  const text = String(value || "");
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function makeSyncIcon(status) {
  const state = status === "synced" ? "synced" : status === "failed" ? "failed" : "pending";
  const icon = state === "synced" ? <CheckIcon /> : state === "failed" ? <WarningIcon /> : <ClockIcon />;
  const title = state === "synced" ? "Synced to sheet" : state === "failed" ? "Sync failed" : "Pending sync";
  return <span className={`sync-icon sync-${state}`} title={title} aria-label={title}>{icon}</span>;
}

function StatusRadio({ checked, status, onToggle, title, ariaLabel }) {
  const synced = checked && status === "synced";
  const failed = checked && status === "failed";
  return (
    <button
      type="button"
      className={`status-radio${checked ? " checked" : ""}${synced ? " synced" : ""}${failed ? " failed" : ""}`}
      role="radio"
      aria-checked={checked}
      title={title}
      aria-label={ariaLabel || title}
      onClick={onToggle}
    >
      <span className="status-radio-dot" />
    </button>
  );
}

function SelectableRow({ children, onDelete, className, title, deleteLabel }) {
  const rowRef = useRef(null);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) {
      return undefined;
    }

    const LONG_PRESS_MS = 450;
    const MOVE_CANCEL = 10;
    const local = { timer: null, startX: 0, startY: 0 };

    function isInteractive(target) {
      return Boolean(target && target.closest && target.closest("input, select, button, textarea, a"));
    }

    function clearTimer() {
      if (local.timer) {
        clearTimeout(local.timer);
        local.timer = null;
      }
    }

    function begin(clientX, clientY, target) {
      if (isInteractive(target)) {
        return;
      }
      local.startX = clientX;
      local.startY = clientY;
      clearTimer();
      local.timer = setTimeout(() => {
        setSelected(true);
        if (navigator && typeof navigator.vibrate === "function") {
          navigator.vibrate(20);
        }
      }, LONG_PRESS_MS);
    }

    function move(clientX, clientY) {
      if (!local.timer) {
        return;
      }
      if (Math.abs(clientX - local.startX) > MOVE_CANCEL || Math.abs(clientY - local.startY) > MOVE_CANCEL) {
        clearTimer();
      }
    }

    function onTouchStart(event) {
      const touch = event.touches[0];
      if (touch) {
        begin(touch.clientX, touch.clientY, event.target);
      }
    }
    function onTouchMove(event) {
      const touch = event.touches[0];
      if (touch) {
        move(touch.clientX, touch.clientY);
      }
    }
    function onMouseDown(event) {
      if (event.button !== 0) {
        return;
      }
      begin(event.clientX, event.clientY, event.target);
    }
    function onMouseMove(event) {
      move(event.clientX, event.clientY);
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", clearTimer);
    el.addEventListener("touchcancel", clearTimer);
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseup", clearTimer);
    el.addEventListener("mouseleave", clearTimer);

    return () => {
      clearTimer();
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", clearTimer);
      el.removeEventListener("touchcancel", clearTimer);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseup", clearTimer);
      el.removeEventListener("mouseleave", clearTimer);
    };
  }, []);

  return (
    <tr
      ref={rowRef}
      className={`selectable-row${selected ? " is-selected-row" : ""}${className ? " " + className : ""}`}
      title={selected ? "" : (title || "Hold to select")}
    >
      {children}
      <td className="row-action-cell">
        {selected ? (
          <span className="row-action-inner">
            <button
              type="button"
              className="row-delete-btn"
              title={deleteLabel || "Delete"}
              aria-label={deleteLabel || "Delete"}
              onClick={() => { setSelected(false); if (typeof onDelete === "function") { onDelete(); } }}
            >
              <TrashIcon />
            </button>
            <button
              type="button"
              className="row-cancel-btn"
              title="Cancel"
              aria-label="Cancel selection"
              onClick={() => setSelected(false)}
            >
              <CloseIcon />
            </button>
          </span>
        ) : null}
      </td>
    </tr>
  );
}

function SwipeRow({ children, onDelete, onTap, className, title }) {
  const rowRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) {
      return undefined;
    }

    const THRESHOLD = 80;
    const state = { active: false, startX: 0, startY: 0, dx: 0, horizontal: false, moved: false };

    function isInteractive(target) {
      return Boolean(target && target.closest && target.closest("input, select, button, textarea, a"));
    }

    function start(clientX, clientY, target) {
      if (isInteractive(target)) {
        state.active = false;
        return;
      }
      state.active = true;
      state.startX = clientX;
      state.startY = clientY;
      state.dx = 0;
      state.horizontal = false;
      state.moved = false;
    }

    function drag(clientX, clientY, event) {
      if (!state.active) {
        return;
      }
      const dx = clientX - state.startX;
      const dy = clientY - state.startY;
      if (!state.horizontal) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
          // Vertical intent wins: let the page/table scroll and abandon the swipe.
          state.active = false;
          state.dx = 0;
          setSwiping(false);
          setOffset(0);
          return;
        }
        if (Math.abs(dx) > 6) {
          state.horizontal = true;
          setSwiping(true);
        }
      }
      if (state.horizontal) {
        state.moved = true;
        state.dx = dx;
        // Prevent the parent table's horizontal scroll from stealing the gesture.
        if (event.cancelable) {
          event.preventDefault();
        }
        setOffset(dx);
      }
    }

    function finish(target) {
      if (!state.active) {
        return;
      }
      state.active = false;
      const finalOffset = state.dx;
      state.dx = 0;
      setSwiping(false);
      setOffset(0);
      if (Math.abs(finalOffset) > THRESHOLD && typeof onDelete === "function") {
        onDelete();
        return;
      }
      if (!state.moved && typeof onTap === "function" && !isInteractive(target)) {
        onTap();
      }
    }

    function onTouchStart(event) {
      const touch = event.touches[0];
      if (touch) {
        start(touch.clientX, touch.clientY, event.target);
      }
    }
    function onTouchMove(event) {
      const touch = event.touches[0];
      if (touch) {
        drag(touch.clientX, touch.clientY, event);
      }
    }
    function onTouchEnd(event) {
      finish(event.target);
    }

    function onMouseMove(event) {
      drag(event.clientX, event.clientY, event);
    }
    function onMouseUp(event) {
      finish(event.target);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    function onMouseDown(event) {
      if (event.button !== 0) {
        return;
      }
      start(event.clientX, event.clientY, event.target);
      if (state.active) {
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    el.addEventListener("mousedown", onMouseDown);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onDelete, onTap]);

  const style = offset
    ? { transform: `translateX(${offset}px)`, opacity: Math.max(1 - Math.abs(offset) / 320, 0.25) }
    : undefined;

  return (
    <tr
      ref={rowRef}
      className={`swipe-row${swiping ? " is-swiping" : ""}${onTap ? " clickable-row" : ""}${className ? " " + className : ""}`}
      style={style}
      title={title}
    >
      {children}
    </tr>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="app-modal-overlay" role="presentation" onClick={onClose}>
      <section className="app-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="app-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="muted">{subtitle}</p> : null}
          </div>
          <button className="close-icon-button" type="button" aria-label="Close" onClick={onClose}><CloseIcon /></button>
        </div>
        <div className="app-modal-body">{children}</div>
      </section>
    </div>
  );
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

function BarChart({ title, subtitle, data, emptyMessage, valueFormatter }) {
  const format = typeof valueFormatter === "function" ? valueFormatter : formatNumber;
  const values = data.map((item) => Number(item.value || 0));
  const hasData = data.length > 0 && values.some((value) => value !== 0);

  if (!hasData) {
    return (
      <article className="bar-chart-card">
        <div className="graph-header compact-row"><div><h3>{title}</h3>{subtitle ? <p className="muted">{subtitle}</p> : null}</div></div>
        <p className="muted">{emptyMessage}</p>
      </article>
    );
  }

  const maxValue = Math.max(...values.map((value) => Math.abs(value)), 1);

  return (
    <article className="bar-chart-card">
      <div className="graph-header compact-row"><div><h3>{title}</h3>{subtitle ? <p className="muted">{subtitle}</p> : null}</div></div>
      <div className="bar-chart-plot">
        {data.map((item, index) => {
          const value = Number(item.value || 0);
          const heightPercent = (Math.abs(value) / maxValue) * 100;
          const accent = item.color || "var(--accent-1)";
          return (
            <div key={`${item.label}-${index}`} className="bar-chart-col" title={`${item.label}: ${format(value)}`}>
              <span className="bar-chart-value">{format(value)}</span>
              <div className="bar-chart-bar-wrap">
                <span
                  className={`bar-chart-bar${value < 0 ? " is-negative" : ""}`}
                  style={{ height: `${Math.max(heightPercent, 2)}%`, "--bar-color": accent }}
                ></span>
              </div>
              <span className="bar-chart-label">{item.label}</span>
            </div>
          );
        })}
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

function MoonIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" fill="currentColor" /></svg>;
}

function SunIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-13h.01M12 20v.01M4 12H3.99M20 12h.01M6.34 6.34l-.01-.01M17.66 17.66l.01.01M6.34 17.66l-.01.01M17.66 6.34l.01-.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>;
}

function GraphIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 3h2v18H3V3Zm16 6h2v12h-2V9ZM11 13h2v8h-2v-8Zm-4-4h2v12H7V9Zm8-6h2v18h-2V3Z" fill="currentColor" /></svg>;
}

function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm-1 6v12h12V8H6Zm2 3h3v3H8v-3Z" fill="currentColor" /></svg>;
}

function TargetIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm0 4a5 5 0 1 0 5 5h-2a3 3 0 1 1-3-3V7Zm0 4a1 1 0 1 0 1 1 1 1 0 0 0-1-1Z" fill="currentColor" /></svg>;
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
  return <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4Zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3Zm3-10H5V5h10v4Z" fill="currentColor" /></svg>;
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

function NotesIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4 4h16v2H4V4Zm0 5h16v2H4V9Zm0 5h11v2H4v-2Zm0 5h11v2H4v-2Z" fill="currentColor" /></svg>;
}

function PiggyBankIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M19.5 9.5c-.2 0-.4 0-.6.05A6.99 6.99 0 0 0 12 5c-3.87 0-7 2.91-7 6.5 0 1.9.88 3.6 2.26 4.79V19a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1v-.55c.4.05.82.05 1.24.05.42 0 .83 0 1.24-.05V19a1 1 0 0 0 1 1H16a1 1 0 0 0 1-1v-1.55c.5-.42.93-.92 1.26-1.45h.74a1.5 1.5 0 0 0 1.5-1.5v-2.5A1.5 1.5 0 0 0 19.5 9.5ZM15 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM8 9.5h4v1.5H8V9.5Z" fill="currentColor" /></svg>;
}

function ReportsIcon() {
  return <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12h2v6H8v-6Zm4-2h2v8h-2v-8Zm4 4h2v4h-2v-4Z" fill="currentColor" /></svg>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L12 13.17V3h0Zm-7 15h14v2H5v-2Z" fill="currentColor" /></svg>;
}

function MealPlanIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M8 2a1 1 0 0 0-1 1v1H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H9V3a1 1 0 0 0-1-1Zm10 6v11H6V8h12ZM8 10h4v2H8v-2Zm0 4h4v2H8v-2Zm6-4h2v2h-2v-2Zm0 4h2v2h-2v-2Z" fill="currentColor" /></svg>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
