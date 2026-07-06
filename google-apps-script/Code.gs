function doGet(e) {
  try {
    var spreadsheet = getTargetSpreadsheet_();
    ensureAllSheets_(spreadsheet);

    var request = (typeof e !== "undefined" && e && e.parameter) ? e.parameter : {};
    if (String(request.catalog || "") === "1") {
      return jsonResponse({
        ok: true,
        workoutCatalog: readWorkoutCatalog_(spreadsheet),
        dietCatalog: readDietCatalog_(spreadsheet)
      });
    }

    return jsonResponse({
      ok: true,
      message: "LifeTracker sheet endpoint is running."
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message || String(error)
    });
  }
}

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents || "{}");
    var type = String(request.type || "").toLowerCase().trim();
    var payload = request.payload || {};
    var spreadsheet = getTargetSpreadsheet_();

    // Always ensure required tabs exist so portfolio/stock sheets are created automatically.
    ensureAllSheets_(spreadsheet);

    if (type === "habit") {
      upsertHabit(spreadsheet, payload);
    } else if (type === "task") {
      upsertTask(spreadsheet, payload);
    } else if (type === "trade") {
      upsertTrade(spreadsheet, payload);
    } else if (type === "portfolio") {
      upsertPortfolio(spreadsheet, payload);
    } else if (type === "stock") {
      upsertStock(spreadsheet, payload);
    } else if (type === "workout") {
      upsertWorkout(spreadsheet, payload);
    } else if (type === "diet") {
      upsertDiet(spreadsheet, payload);
    } else if (type === "diettarget") {
      upsertDietTarget(spreadsheet, payload);
    } else {
      throw new Error("Unsupported entry type.");
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message || String(error)
    });
  }
}

function getTargetSpreadsheet_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  var spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  throw new Error("Spreadsheet not found. Bind this script to a sheet or set Script Property SPREADSHEET_ID.");
}

function ensureAllSheets_(spreadsheet) {
  ensureSheet(spreadsheet, "Habits", ["ID", "Owner Email", "Habit", "Start Time", "End Time", "Completions", "Deleted", "Created At"]);
  ensureSheet(spreadsheet, "Tasks", ["ID", "Owner Email", "Task", "Completion Time", "Notes", "Completed", "Completed At", "Deleted", "Created At"]);
  ensureSheet(spreadsheet, "Trades", ["ID", "Owner Email", "Date", "Target PnL", "Achieved PnL", "Achieved Percent", "Deleted", "Created At"]);
  ensureSheet(spreadsheet, "Portfolio", ["ID", "Owner Email", "Month", "Items JSON", "Income", "Investment", "Spent", "Remaining", "Deleted", "Created At"]);
  ensureSheet(spreadsheet, "Stocks", ["ID", "Owner Email", "Stock Name", "Category", "Buy Amount", "Buy Date", "Quantity", "Invested Amount", "Deleted", "Created At"]);
  ensureSheet(spreadsheet, "Workouts", ["ID", "Owner Email", "Date", "Body Part", "Subgroup", "Exercise", "Weight", "Unit", "Reps", "Deleted", "Created At"]);
  ensureSheet(spreadsheet, "Diets", ["ID", "Owner Email", "Date", "Food Name", "Serving", "Input Mode", "Quantity", "Quantity Unit", "Protein", "Carbs", "Fat", "Calories", "Deleted", "Created At"]);
  ensureSheet(spreadsheet, "DietTargets", ["ID", "Owner Email", "Date", "Target Calories", "Deleted", "Created At"]);
  ensureWorkoutCatalogSheet_(spreadsheet);
  ensureDietCatalogSheet_(spreadsheet);
}

function upsertHabit(spreadsheet, payload) {
  var sheet = ensureSheet(spreadsheet, "Habits", ["ID", "Owner Email", "Habit", "Start Time", "End Time", "Completions", "Deleted", "Created At"]);
  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.ownerEmail || "",
    payload.name || "",
    payload.startTime || "",
    payload.endTime || "",
    JSON.stringify(payload.completions || {}),
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function upsertTask(spreadsheet, payload) {
  var sheet = ensureSheet(spreadsheet, "Tasks", ["ID", "Owner Email", "Task", "Completion Time", "Notes", "Completed", "Completed At", "Deleted", "Created At"]);
  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.ownerEmail || "",
    payload.title || "",
    payload.completionTime || "",
    payload.notes || "",
    payload.completed ? "Yes" : "No",
    payload.completedAt || "",
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function upsertTrade(spreadsheet, payload) {
  var achievedValue = payload.achieved;
  if (achievedValue === undefined || achievedValue === null || achievedValue === "") {
    achievedValue = payload.actualPnl;
  }

  var sheet = ensureSheet(spreadsheet, "Trades", ["ID", "Owner Email", "Date", "Target PnL", "Achieved PnL", "Achieved Percent", "Deleted", "Created At"]);
  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.ownerEmail || "",
    payload.date || "",
    payload.target || 0,
    achievedValue || 0,
    payload.achievedPercent || 0,
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function upsertPortfolio(spreadsheet, payload) {
  var items = Array.isArray(payload.items) ? payload.items : [];
  var summary = summarizePortfolioItems(items);
  var sheet = ensureSheet(
    spreadsheet,
    "Portfolio",
    ["ID", "Owner Email", "Month", "Items JSON", "Income", "Investment", "Spent", "Remaining", "Deleted", "Created At"]
  );

  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.ownerEmail || "",
    payload.month || "",
    JSON.stringify(items),
    summary.income,
    summary.investment,
    summary.spent,
    summary.remaining,
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function upsertStock(spreadsheet, payload) {
  var sheet = ensureSheet(
    spreadsheet,
    "Stocks",
    ["ID", "Owner Email", "Stock Name", "Category", "Buy Amount", "Buy Date", "Quantity", "Invested Amount", "Deleted", "Created At"]
  );

  var buyAmount = payload.buyAmount;
  if (buyAmount === undefined || buyAmount === null || buyAmount === "") {
    buyAmount = 0;
  }

  var quantity = payload.quantity;
  if (quantity === undefined || quantity === null || quantity === "") {
    quantity = 0;
  }

  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.ownerEmail || "",
    payload.stockName || "",
    payload.category || "",
    buyAmount,
    payload.buyDate || "",
    quantity,
    Number(buyAmount) * Number(quantity),
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function upsertWorkout(spreadsheet, payload) {
  var sheet = ensureSheet(
    spreadsheet,
    "Workouts",
    ["ID", "Owner Email", "Date", "Body Part", "Subgroup", "Exercise", "Weight", "Unit", "Reps", "Deleted", "Created At"]
  );

  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.ownerEmail || "",
    payload.date || "",
    payload.bodyPartLabel || payload.bodyPart || "",
    payload.subgroup || "",
    payload.exercise || "",
    payload.weight === null || payload.weight === undefined || payload.weight === "" ? "" : Number(payload.weight),
    payload.unit || "kg",
    payload.reps === null || payload.reps === undefined || payload.reps === "" ? "" : Number(payload.reps),
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function upsertDiet(spreadsheet, payload) {
  var sheet = ensureSheet(
    spreadsheet,
    "Diets",
    ["ID", "Owner Email", "Date", "Food Name", "Serving", "Input Mode", "Quantity", "Quantity Unit", "Protein", "Carbs", "Fat", "Calories", "Deleted", "Created At"]
  );

  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.ownerEmail || "",
    payload.date || "",
    payload.foodName || "",
    payload.serving || "",
    payload.inputMode || "serving",
    payload.quantity || 0,
    payload.quantityUnit || "serving",
    payload.protein || 0,
    payload.carbs || 0,
    payload.fat || 0,
    payload.calories || 0,
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function upsertDietTarget(spreadsheet, payload) {
  var sheet = ensureSheet(
    spreadsheet,
    "DietTargets",
    ["ID", "Owner Email", "Date", "Target Calories", "Deleted", "Created At"]
  );

  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.ownerEmail || "",
    payload.date || "",
    Number(payload.targetCalories || 0),
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function ensureWorkoutCatalogSheet_(spreadsheet) {
  var sheet = ensureSheet(
    spreadsheet,
    "WorkoutCatalog",
    ["Chest", "Back", "Legs", "Biceps", "Triceps", "Forearms", "Core"]
  );

  if (sheet.getLastRow() > 1) {
    return sheet;
  }

  var maxRows = 8;
  var values = [];
  for (var rowIndex = 0; rowIndex < maxRows; rowIndex += 1) {
    values.push(["", "", "", "", "", "", ""]);
  }

  values[0][0] = "Upper Chest - Incline Barbell Bench Press";
  values[1][0] = "Upper Chest - Incline Dumbbell Press";
  values[2][1] = "Width (Lats) - Pull-Ups";
  values[3][2] = "Quadriceps - Barbell Squat";
  values[4][3] = "Overall Biceps - Barbell Curl";
  values[5][4] = "Long Head - Skull Crushers";
  values[6][5] = "Grip Strength - Farmer's Walk";
  values[7][6] = "Entire Core - Plank";

  sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
  return sheet;
}

function ensureDietCatalogSheet_(spreadsheet) {
  var headers = ["Food Item", "Serving", "Base Grams", "Protein", "Carbs", "Fat", "Calories"];
  var sheet = ensureSheet(spreadsheet, "DietCatalog", headers);

  if (sheet.getLastRow() > 1) {
    return sheet;
  }

  sheet.appendRow(["Whole Egg", "1 Egg (50g)", 50, 6.3, 0.4, 5.3, 72]);
  sheet.appendRow(["Egg White", "1 Egg White", "", 3.6, 0.2, 0.1, 17]);
  sheet.appendRow(["Boiled Egg", "100g", 100, 13, 1.1, 11, 155]);
  sheet.appendRow(["Chicken Breast (Cooked)", "100g", 100, 31, 0, 3.6, 165]);
  return sheet;
}

function readWorkoutCatalog_(spreadsheet) {
  var sheet = ensureWorkoutCatalogSheet_(spreadsheet);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return {};
  }

  var headers = data[0];
  var catalog = {};
  for (var col = 0; col < headers.length; col += 1) {
    var header = String(headers[col] || "").trim();
    if (!header) {
      continue;
    }

    var partKey = normalizeKey_(header);
    if (!catalog[partKey]) {
      catalog[partKey] = {
        label: header,
        groups: {}
      };
    }

    for (var row = 1; row < data.length; row += 1) {
      var raw = String(data[row][col] || "").trim();
      if (!raw) {
        continue;
      }

      var parsed = splitWorkoutLabel_(raw);
      if (!catalog[partKey].groups[parsed.group]) {
        catalog[partKey].groups[parsed.group] = [];
      }
      catalog[partKey].groups[parsed.group].push(parsed.exercise);
    }
  }

  return catalog;
}

function readDietCatalog_(spreadsheet) {
  var sheet = ensureDietCatalogSheet_(spreadsheet);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return [];
  }

  var records = [];
  for (var row = 1; row < data.length; row += 1) {
    var name = String(data[row][0] || "").trim();
    var serving = String(data[row][1] || "").trim();
    if (!name || !serving) {
      continue;
    }

    records.push({
      name: name,
      serving: serving,
      baseGrams: data[row][2] === "" ? null : Number(data[row][2]),
      protein: Number(data[row][3] || 0),
      carbs: Number(data[row][4] || 0),
      fat: Number(data[row][5] || 0),
      calories: Number(data[row][6] || 0)
    });
  }

  return records;
}

function splitWorkoutLabel_(text) {
  var chunks = String(text || "").split("-");
  if (chunks.length < 2) {
    return {
      group: "General",
      exercise: text
    };
  }

  var group = String(chunks[0] || "").trim();
  var exercise = String(chunks.slice(1).join("-") || "").trim();
  return {
    group: group || "General",
    exercise: exercise || text
  };
}

function normalizeKey_(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function summarizePortfolioItems(items) {
  var summary = {
    income: 0,
    investment: 0,
    spent: 0,
    remaining: 0
  };

  items.forEach(function (item) {
    var category = item.category;
    var amount = Number(item.amount || 0);

    if (category === "income") {
      summary.income += amount;
    } else if (category === "investment") {
      summary.investment += amount;
    } else {
      summary.spent += amount;
    }
  });

  summary.remaining = Math.max(summary.income - summary.investment - summary.spent, 0);
  return summary;
}

function ensureSheet(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function upsertById(sheet, id, values) {
  if (!id) {
    sheet.appendRow(values);
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    sheet.appendRow(values);
    return;
  }

  var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var index = 0; index < idValues.length; index += 1) {
    if (idValues[index][0] === id) {
      sheet.getRange(index + 2, 1, 1, values.length).setValues([values]);
      return;
    }
  }

  sheet.appendRow(values);
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
