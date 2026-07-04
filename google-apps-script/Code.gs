function doGet() {
  return jsonResponse({
    ok: true,
    message: "Habit tracker sheet endpoint is running."
  });
}

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents || "{}");
    var type = request.type;
    var payload = request.payload || {};
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    if (type === "habit") {
      upsertHabit(spreadsheet, payload);
    } else if (type === "task") {
      upsertTask(spreadsheet, payload);
    } else if (type === "trade") {
      upsertTrade(spreadsheet, payload);
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

function upsertHabit(spreadsheet, payload) {
  var sheet = ensureSheet(spreadsheet, "Habits", ["ID", "Habit", "Start Time", "End Time", "Completions", "Deleted", "Created At"]);
  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.name || "",
    payload.startTime || "",
    payload.endTime || "",
    JSON.stringify(payload.completions || {}),
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
}

function upsertTask(spreadsheet, payload) {
  var sheet = ensureSheet(spreadsheet, "Tasks", ["ID", "Task", "Completion Time", "Notes", "Completed", "Completed At", "Deleted", "Created At"]);
  upsertById(sheet, payload.id, [
    payload.id || "",
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

  var sheet = ensureSheet(spreadsheet, "Trades", ["ID", "Date", "Target PnL", "Achieved PnL", "Achieved Percent", "Deleted", "Created At"]);
  upsertById(sheet, payload.id, [
    payload.id || "",
    payload.date || "",
    payload.target || 0,
    achievedValue || 0,
    payload.achievedPercent || 0,
    payload.deleted ? "Yes" : "No",
    payload.createdAt || ""
  ]);
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
