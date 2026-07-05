function doGet() {
  return jsonResponse({
    ok: true,
    message: "Habit tracker sheet endpoint is running."
  });
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
