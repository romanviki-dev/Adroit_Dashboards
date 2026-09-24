"use strict";

/* ================================================================
   ADROIT SERVICE PERFORMANCE SUMMARY — WIDGET VERSION
   ================================================================
   Converted from the React/Vite app (src/App.jsx) to a plain Zoho
   Creator widget, matching the structure of the other adroit
   dashboards: app/widget.html + app/<name>.js + app/styles.css.

   Layout of this file:
     1. CONFIG          report link names + parity switches
     2. DATE HELPERS    (value/number helpers come from AK)
     3. DATA LAYER      sequential, cursor pagination, cached,
                        every fetch logged through AK.logFetch
     4. CALCULATIONS    the 32 former Deluge functions. Each one also
                        returns `src`: the actual records behind each
                        number, which is what the drill-downs show.
     5. DRILL-DOWNS     column sets + one definition per clickable count
     6. RENDER          the original markup / class names, as HTML
     7. MAIN            tabs, lazy per-tab loading

   Exactly ONE Creator request is in flight at a time (no Promise.all).
   ================================================================ */

/* ================================================================
   1. CONFIGURATION
   ================================================================ */

var CONFIG = {
  REPORTS: {
    SERVICE_CALL_LOG: "Service_Call_Logs",
    SERVICE_REPORT: "All_Service_Reports",
    SERVICE_FEEDBACK: "All_Service_Feedback1",
    FIELD_EXECUTIVE: "Field_Executives",
    EMPLOYEES: "All_Employees",
    SERVICE_QUOTATION: "Service_Quotations",
    SERVICE_INVOICE: "Service_Invoice_Follow_up_Un_paid",
    REJECTION_REPLACEMENT: "Rejection_And_Replacement_Register_Report",
    STANDBY_UNIT: "Stand_By_Unit1",
    AMC_CONTRACT: "All_Amc_Contracts",
    PRODUCT: "All_Product",
    EXPENSE_ENGINEER: "Expense_of_Engineer_Report",
    REWORK: "All_Reworks",
    TRAINING_REPORT: "Training_Reports",
    TOOL_KIT: "Production_Tool_Kit_of_Engineers1",
    VEHICLE_SERVICE: "Vehicle_Service_Reports",
    INTERNAL_CALIBRATION: "Internal_Calibrations"
  },

  PAGE_SIZE: 1000,

  // Employees.Department_Role record that identifies service engineers
  // (hard-coded in the original Deluge functions).
  SERVICE_DEPARTMENT_ROLE_ID: "302392000000624113",

  // Deluge's toStartOfWeek(): 1 = Monday, 0 = Sunday.
  WEEK_STARTS_ON: 1,

  // true  = reproduce the Deluge expression literally (parity with the old dashboard)
  // false = use the evidently intended meaning
  PARITY: {
    // customerRegretCases: `ID != null && Rating == "2" || Rating == "1" && Call_attended_date == today`
    // -> Rating 2 is NOT limited to today, only Rating 1 is.
    regretCasesPrecedence: true,
    // expenseBreakdown: the rework total is added INSIDE the per-expense-record
    // loop, so it is multiplied by the number of expense records.
    expenseReworkInsideLoop: true
  },

  DEBUG: true
};

var R = CONFIG.REPORTS;

/* ================================================================
   2. DATE HELPERS
   Value/number helpers (num, text, id, int, money, pct, parseDate)
   all come from the shared kit as AK.*
   ================================================================ */

var MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var MONTH_LONG = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
var DAY_MS = 86400000;

function pad2(n) { return String(n).padStart(2, "0"); }
function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function addYears(d, n) { return new Date(d.getFullYear() + n, d.getMonth(), d.getDate()); }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function startOfYear(d) { return new Date(d.getFullYear(), 0, 1); }
function startOfWeek(d) { return addDays(startOfDay(d), -((d.getDay() - CONFIG.WEEK_STARTS_ON + 7) % 7)); }
function minDate(a, b) { return a < b ? a : b; }
function daysBetween(from, to) { return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS); }

var parseDateTime = AK.parseDate;
function parseDate(v) { var d = parseDateTime(v); return d ? startOfDay(d) : null; }

function sameDay(v, day) { var d = parseDate(v); return d !== null && d.getTime() === day.getTime(); }
function inRange(v, from, to) { var d = parseDate(v); return d !== null && d >= from && d <= to; }
function onOrBefore(v, day) { var d = parseDate(v); return d !== null && d <= day; }
function onOrAfter(v, day) { var d = parseDate(v); return d !== null && d >= day; }

function fmtDate(d) { return d ? pad2(d.getDate()) + "-" + pad2(d.getMonth() + 1) + "-" + d.getFullYear() : ""; }
function fmtDateMon(d) { return d ? pad2(d.getDate()) + "-" + MONTH_SHORT[d.getMonth()] + "-" + d.getFullYear() : ""; }
function fmtDateSpaced(d) { return d ? pad2(d.getDate()) + " " + MONTH_SHORT[d.getMonth()] + " " + d.getFullYear() : ""; }

/* ---- value shorthands over the kit ---- */
var text = AK.text;
var lookupId = AK.id;
var num = AK.num;
var esc = AK.esc;

function isBlank(v) {
  return v === null || v === undefined || v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
}
function hasValue(v) { return !isBlank(v); }

/** Deluge `.toNumber()` on a rating; NaN when it is not numeric. */
function rating(v) {
  var s = text(v).trim();
  if (s === "") return NaN;
  var n = Number(s);
  return isFinite(n) ? n : NaN;
}

function isTrue(v) { return v === true || String(v).toLowerCase() === "true"; }
function asRows(v) { return Array.isArray(v) ? v : []; }
function sum(list, fn) { return list.reduce(function (a, x) { return a + fn(x); }, 0); }
function round(n, places) {
  var p = Math.pow(10, places === undefined ? 1 : places);
  return Math.round((n + Number.EPSILON) * p) / p;
}
function natureOf(rec) { return text(rec.Nature_Of_Calls); }

function countBy(list, keyFn) {
  var map = new Map();
  list.forEach(function (item) {
    var k = keyFn(item);
    map.set(k, (map.get(k) || 0) + 1);
  });
  return map;
}

/** Group records by a key, keeping the records (drill-downs need the rows, not just counts). */
function groupBy(list, keyFn) {
  var map = new Map();
  list.forEach(function (item) {
    var k = keyFn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  });
  return map;
}

/* ================================================================
   3. DATA LAYER
   - one request in flight at any time (single promise chain)
   - sequential record_cursor pagination
   - each dataset fetched once, then cached
   - HTTP 400 = "no records" -> empty dataset
   ================================================================ */

var criteriaDate = fmtDateMon;

/**
 * stage:    which tab first needs the dataset (loaded lazily per tab)
 * criteria: OPTIONAL server-side narrowing for growth-prone reports. The
 *           calculations always re-filter in JS, so if Creator rejects a
 *           criteria string the report is simply re-fetched unfiltered.
 * fields:   the fields this dashboard reads. Audited after every fetch —
 *           anything missing is named in the console. This list is also
 *           what the "required fields" spreadsheet is built from.
 */
var DATASETS = {
  /* ---- today: also shared by weekly / monthly ---- */
  serviceCallLogs: {
    report: R.SERVICE_CALL_LOG,
    label: "Service Call Log",
    stage: "today",
    criteria: function (today) {
      return '(Date_field >= "' + criteriaDate(minDate(startOfYear(today), startOfWeek(today))) + '" || Status == "Pending")';
    },
    fields: ["Date_field", "Status", "Customer_Name", "Service_Engineer_Name",
      "Nature_Of_Calls", "Repeat_Call_Reason", "Service_Call_Log_No"]
  },
  serviceReports: {
    report: R.SERVICE_REPORT,
    label: "Service Report",
    stage: "today",
    criteria: function (today) {
      return '(Call_Attended_Date >= "' + criteriaDate(minDate(startOfWeek(today), startOfMonth(today))) +
        '" || Added_Time >= "' + criteriaDate(startOfMonth(today)) + ' 00:00:00")';
    },
    fields: ["Call_Attended_Date", "Call_Received_Date", "Service_Call_Log",
      "Service_Engineer_Name", "Status", "Product", "Added_Time", "Spare_Replaced"]
  },
  feedbacks: {
    report: R.SERVICE_FEEDBACK,
    label: "Service Feedback",
    stage: "today",
    fields: ["Company_Name", "Rating", "Call_attended_date",
      "Any_additional_comments_or_suggestions_would_be_appreciated1",
      "service_engineer_attended_the_call"]
  },
  fieldExecutives: {
    report: R.FIELD_EXECUTIVE,
    label: "Field Executive",
    stage: "today",
    fields: ["Date_field", "Leave_Break", "Employee_Name", "Did_you_collect_google_rating"]
  },
  employees: {
    report: R.EMPLOYEES,
    label: "Employees",
    stage: "today",
    fields: ["Employee_Name", "Department_Role"]
  },
  quotations: {
    report: R.SERVICE_QUOTATION,
    label: "Service Quotation",
    stage: "today",
    // confirmed via fields.txt — "Quotation_Number" doesn't exist on Service_Quotations,
    // the real field is "Service_Quotation_No" (Quotation_Number IS real, but on the
    // different All_Amc_Contracts report used a few lines below)
    fields: ["Date_field", "Status", "Customer_Name", "Nature_of_Calls", "Service_Quotation_No"]
  },
  invoices: {
    report: R.SERVICE_INVOICE,
    label: "Service Invoice",
    stage: "today",
    fields: ["Date_field", "Customer", "Final_Total", "Spare_Amount", "Service_Amount",
      "Service_Call_Log", "Invoice_Number"]
  },

  /* ---- weekly ---- */
  replacements: {
    report: R.REJECTION_REPLACEMENT,
    label: "Rejection & Replacement",
    stage: "weekly",
    fields: ["Department", "Date_field", "Status", "Defective_Product", "Qty"]
  },
  standbyUnits: {
    report: R.STANDBY_UNIT,
    label: "Stand By Unit",
    stage: "weekly",
    fields: ["StandBy_To", "Outward_Date", "Inward_Date", "Product"]
  },
  amcContracts: {
    report: R.AMC_CONTRACT,
    label: "AMC Contract",
    stage: "weekly",
    fields: ["Quotation_Number", "Customer_Name", "Date_field"]
  },
  products: {
    report: R.PRODUCT,
    label: "Product",
    stage: "weekly",
    criteria: function () { return "Is_Red_Tag_Material == true"; },
    fields: ["Product_Name", "Is_Red_Tag_Material", "Product_Code"]
  },

  /* ---- monthly ---- */
  engineerExpenses: {
    report: R.EXPENSE_ENGINEER,
    label: "Engineer Expense",
    stage: "monthly",
    fields: ["Date_field1234567890", "Service_Engineer_Name", "Overall_Engineer", "Material_Replaced1"]
  },
  reworks: {
    report: R.REWORK,
    label: "Rework",
    stage: "monthly",
    fields: ["Date_field", "Approximate_Cost"]
  },
  trainingReports: {
    report: R.TRAINING_REPORT,
    label: "Training Report",
    stage: "monthly",
    fields: ["Report"]
  },
  toolReports: {
    report: R.TOOL_KIT,
    label: "Tool Kit",
    stage: "monthly",
    fields: ["Month_field", "Status", "Service_Tools_Kit_of_Engineers"]
  },
  vehicleReports: {
    report: R.VEHICLE_SERVICE,
    label: "Vehicle Service",
    stage: "monthly",
    // "Service_Tools_Kit_of_Engineers|Report" contains a literal "|" — not valid in a Zoho
    // field link name, so this is definitely corrupted (likely copy-pasted from toolReports'
    // "Service_Tools_Kit_of_Engineers" above and something appended "|Report" by mistake).
    // Vehicle_Service_Reports currently returns 0 records, so there's no live data to confirm
    // the real field name against — left as-is rather than guessing a replacement.
    fields: ["Month_field", "Status", "Service_Tools_Kit_of_Engineers|Report"]
  },
  calibrationRecords: {
    report: R.INTERNAL_CALIBRATION,
    label: "Internal Calibration",
    stage: "monthly",
    fields: ["UUC_E", "Meter_Type", "Meter_Make", "Meter_S", "Calibration_Type",
      "Rev_Date", "Approved_By", "Tested_By", "Rev_No"]
  }
};

function stageKeys(stage) {
  return Object.keys(DATASETS).filter(function (k) { return DATASETS[k].stage === stage; });
}

// One Creator request at a time, across every dataset and every tab.
var requestChain = Promise.resolve();
var datasetCache = new Map();
// "unknown" -> "ok" | "unsupported": does getRecords accept field_config?
var runtime = { fieldConfig: "unknown" };

function enqueue(task) {
  var result = requestChain.then(task);
  requestChain = result.catch(function () { return undefined; });
  return result;
}

/** All pages of one report, strictly one after another. */
function fetchAllPages(reportName, criteria, useFieldConfig) {
  var records = [];
  var cursor = null;

  function nextPage() {
    var config = { report_name: reportName, max_records: CONFIG.PAGE_SIZE };
    // By default Creator only returns the report's quick-view columns;
    // "all" also brings back fields/subforms that are not on the report grid.
    if (useFieldConfig) config.field_config = "all";
    if (criteria) config.criteria = criteria;
    if (cursor) config.record_cursor = cursor;

    return window.ZOHO.CREATOR.DATA.getRecords(config).then(function (response) {
      var rows = (response && response.data) || [];
      records.push.apply(records, rows);
      cursor = (response && response.record_cursor) || null;

      if (!cursor && rows.length >= CONFIG.PAGE_SIZE) {
        console.warn("[Creator] " + reportName + ": got " + rows.length +
          " records and no record_cursor - the list may be truncated.");
      }
      return cursor ? nextPage() : records;
    });
  }

  return nextPage();
}

/**
 * Creator answers HTTP 400 both for "no records" and for parameters it does
 * not accept, so a failed request is retried with progressively fewer
 * options (criteria, then field_config) before the dataset is called empty.
 */
function fetchWithFallback(def, criteria, meta) {
  var wantFieldConfig = runtime.fieldConfig !== "unsupported";

  return fetchAllPages(def.report, criteria, wantFieldConfig)
    .then(function (records) {
      if (wantFieldConfig) runtime.fieldConfig = "ok";
      return records;
    })
    .catch(function (error) {
      meta.error = error;
      if (!criteria) throw error;
      meta.criteriaRejected = true;
      return fetchAllPages(def.report, "", wantFieldConfig).then(function (records) {
        if (wantFieldConfig) runtime.fieldConfig = "ok";
        meta.error = null;
        return records;
      });
    })
    .catch(function (error) {
      meta.error = error;
      if (!wantFieldConfig || runtime.fieldConfig === "ok") return [];
      return fetchAllPages(def.report, "", false).then(function (records) {
        runtime.fieldConfig = "unsupported";
        meta.fieldConfigRejected = true;
        meta.error = null;
        return records;
      }).catch(function (err2) {
        meta.error = err2;
        return [];
      });
    });
}

/** Warn when a field this dashboard reads never came back on any record. */
function auditFields(key, def, records) {
  if (!records.length || !def.fields) return [];
  var present = new Set();
  records.forEach(function (rec) {
    Object.keys(rec || {}).forEach(function (k) { present.add(k); });
  });
  var missing = def.fields.filter(function (f) {
    return !f.split("|").some(function (name) { return present.has(name); });
  });
  if (missing.length) {
    console.warn("[Creator] " + key + " (" + def.report + "): field(s) NOT returned - " +
      missing.join(", ") + ". Add them to the report's columns (or check the link names). " +
      "Fields that did come back: " + Array.prototype.slice.call(present).join(", "));
  }
  return missing;
}

function requestDataset(key, def, criteria) {
  var started = Date.now();
  var meta = { error: null, criteriaRejected: false, fieldConfigRejected: false };

  return fetchWithFallback(def, criteria, meta).then(function (records) {
    var notes = [];
    if (meta.criteriaRejected) notes.push("criteria rejected -> loaded unfiltered");
    if (meta.fieldConfigRejected) notes.push("field_config rejected");

    var missing = auditFields(key, def, records);
    if (missing.length) notes.push("missing fields: " + missing.join(", "));

    AK.logFetch({
      label: def.label,
      report: def.report,
      params: { criteria: criteria || null, field_config: runtime.fieldConfig === "unsupported" ? "(default)" : "all" },
      rows: records,
      ms: Date.now() - started,
      error: records.length ? null : meta.error,
      note: notes.join("; ") || null
    });

    return records;
  });
}

function loadDataset(key, today) {
  var def = DATASETS[key];
  var criteria = def.criteria ? def.criteria(today) : "";
  var cacheKey = key + "|" + criteria;

  if (!datasetCache.has(cacheKey)) {
    datasetCache.set(cacheKey, enqueue(function () { return requestDataset(key, def, criteria); }));
  }
  return datasetCache.get(cacheKey);
}

/* ================================================================
   4. CALCULATIONS  (the former Deluge functions)
   Each returns its values plus `src`: the records behind each number.
   ================================================================ */

function serviceEngineers(D) {
  return (D.employees || []).filter(function (e) {
    return lookupId(e.Department_Role) === CONFIG.SERVICE_DEPARTMENT_ROLE_ID;
  });
}

/** Bar height in px: scaled, at least 10 when there is a value, 2 when zero. */
function barHeight(value, maxValue, maxBar) {
  var h = round((value * maxBar) / maxValue, 1);
  if (value > 0 && h < 10) h = 10;
  if (h === 0) h = 2;
  return h;
}

/* ---------- TODAY ---------- */

/** serviceOverviewDashboard.tileSectionTodayFunc() */
function calcTodayTiles(D, today) {
  var callLogs = D.serviceCallLogs || [];
  var feedbacks = D.feedbacks || [];
  var isToday = function (v) { return sameDay(v, today); };

  var callsToday = callLogs.filter(function (c) { return isToday(c.Date_field); });

  var leaveList = ["Emergency Leave", "Informed Leave"];
  var execsToday = (D.fieldExecutives || []).filter(function (f) {
    return isToday(f.Date_field) && leaveList.indexOf(text(f.Leave_Break)) < 0;
  });

  // Completed call logs that have a service report attended today (each call log once).
  var completedIds = new Set(callLogs
    .filter(function (c) { return text(c.Status) === "Completed"; })
    .map(function (c) { return String(c.ID); }));
  var reportedIds = new Set();
  var reportedRows = [];
  (D.serviceReports || []).forEach(function (r) {
    if (!isToday(r.Call_Attended_Date)) return;
    var cid = lookupId(r.Service_Call_Log);
    if (cid && completedIds.has(cid) && !reportedIds.has(cid)) {
      reportedIds.add(cid);
      reportedRows.push(r);
    }
  });

  var quotesToday = (D.quotations || []).filter(function (q) {
    return isToday(q.Date_field) && text(q.Status) === "Sent";
  });

  var feedbackToday = feedbacks.filter(function (f) {
    return hasValue(f.Company_Name) && isToday(f.Call_attended_date);
  });

  var twoDaysBefore = addDays(today, -2);
  var pendingOld = callLogs.filter(function (c) {
    return text(c.Status) === "Pending" && onOrBefore(c.Date_field, twoDaysBefore);
  });

  var rated = function (f, value) { return text(f.Rating) === value; };
  var regretRows = feedbacks.filter(function (f) {
    return CONFIG.PARITY.regretCasesPrecedence
      ? rated(f, "2") || (rated(f, "1") && isToday(f.Call_attended_date))
      : (rated(f, "1") || rated(f, "2")) && isToday(f.Call_attended_date);
  });

  // Customers with two or more pending calls logged today.
  var pendingTodayGroups = groupBy(
    callLogs.filter(function (c) { return isToday(c.Date_field) && text(c.Status) === "Pending"; }),
    function (c) { return lookupId(c.Customer_Name); }
  );
  var repeatedCount = 0;
  var repeatedRows = [];
  pendingTodayGroups.forEach(function (rows, customerId) {
    if (customerId && rows.length >= 2) {
      repeatedCount += 1;
      repeatedRows = repeatedRows.concat(rows);
    }
  });

  var invoicesToday = (D.invoices || []).filter(function (i) {
    return isToday(i.Date_field) && hasValue(i.Customer);
  });

  return {
    total_calls_today: callsToday.length,
    executives_act_today: execsToday.length,
    service_reports_submitted_count: reportedRows.length,
    quot_sent_today: quotesToday.length,
    cust_feedback_rec: feedbackToday.length,
    pending_calls: pendingOld.length,
    customer_regret_cases_count: regretRows.length,
    repeated_calls_count: repeatedCount,
    invoices_gen_today: invoicesToday.length,
    total_invoiced_amt_today: round(sum(invoicesToday, function (i) { return num(i.Final_Total); }), 2),
    src: {
      total_calls_today: callsToday,
      executives_act_today: execsToday,
      service_reports_submitted_count: reportedRows,
      quot_sent_today: quotesToday,
      cust_feedback_rec: feedbackToday,
      pending_calls: pendingOld,
      customer_regret_cases_count: regretRows,
      repeated_calls_count: repeatedRows,
      invoices_gen_today: invoicesToday,
      total_invoiced_amt_today: invoicesToday
    }
  };
}

/** serviceOverviewDashboard.executivePerformanceToday() */
function calcExecutivePerformance(D, today) {
  var reports = (D.serviceReports || []).filter(function (r) { return sameDay(r.Call_Attended_Date, today); });

  var rows = serviceEngineers(D).map(function (eng) {
    var mine = reports.filter(function (r) { return lookupId(r.Service_Engineer_Name) === String(eng.ID); });
    var done = mine.filter(function (r) { return text(r.Status) === "Completed"; });
    return {
      Engineer_Name: text(eng.Employee_Name),
      assignedToday: mine.length,
      completedToday: done.length,
      _assigned: mine,
      _completed: done
    };
  });

  var maxValue = 0;
  rows.forEach(function (r) { maxValue = Math.max(maxValue, r.assignedToday, r.completedToday); });
  if (maxValue === 0) maxValue = 1;
  else if (maxValue < 10) maxValue = 10;

  rows.forEach(function (r) {
    r.assignedHeight = barHeight(r.assignedToday, maxValue, 155);
    r.completedHeight = barHeight(r.completedToday, maxValue, 155);
  });
  return rows;
}

/** serviceOverviewDashboard.invoiceAmountTrendToday() */
function calcInvoiceTrend(D, today) {
  var invoicesToday = (D.invoices || []).filter(function (i) { return sameDay(i.Date_field, today); });
  var callLogs = D.serviceCallLogs || [];
  var byId = new Map(callLogs.map(function (c) { return [String(c.ID), c]; }));
  var byNumber = new Map(callLogs.map(function (c) { return [text(c.Service_Call_Log_No), c]; }));

  var buckets = { AMC: [], Installation: [], Repair: [] };
  var amc = 0, installation = 0, repair = 0;

  invoicesToday.forEach(function (inv) {
    var call = byId.get(lookupId(inv.Service_Call_Log)) || byNumber.get(text(inv.Service_Call_Log));
    var nature = call ? natureOf(call) : "";
    var amount = num(inv.Final_Total);
    if (nature === "AMC") { amc += amount; buckets.AMC.push(inv); }
    else if (nature === "Installation") { installation += amount; buckets.Installation.push(inv); }
    else if (nature === "Repair") { repair += amount; buckets.Repair.push(inv); }
  });

  var amounts = {
    amc_amt: round(amc, 2),
    installtion_amt: round(installation, 2),
    repair_amt: round(repair, 2),
    service_amt: round(sum(invoicesToday, function (i) { return num(i.Service_Amount); }), 2),
    spares_amt: round(sum(invoicesToday, function (i) { return num(i.Spare_Amount); }), 2)
  };

  var maxValue = Math.max(0, amounts.amc_amt, amounts.installtion_amt, amounts.repair_amt,
    amounts.service_amt, amounts.spares_amt);
  if (maxValue === 0) maxValue = 1;
  else if (maxValue < 10000) maxValue = 10000;

  amounts.amc_height = barHeight(amounts.amc_amt, maxValue, 180);
  amounts.install_height = barHeight(amounts.installtion_amt, maxValue, 180);
  amounts.repair_height = barHeight(amounts.repair_amt, maxValue, 180);
  amounts.service_height = barHeight(amounts.service_amt, maxValue, 180);
  amounts.spares_height = barHeight(amounts.spares_amt, maxValue, 180);
  amounts.src = {
    amc: buckets.AMC,
    install: buckets.Installation,
    repair: buckets.Repair,
    service: invoicesToday.filter(function (i) { return num(i.Service_Amount) > 0; }),
    spares: invoicesToday.filter(function (i) { return num(i.Spare_Amount) > 0; })
  };
  return amounts;
}

/** serviewOverviewOverallDashboard.repeatCallsReasonBreakdownTodayFunc() */
function calcRepeatReasons(D, today) {
  var withReason = (D.serviceCallLogs || []).filter(function (c) {
    return sameDay(c.Date_field, today) && text(c.Repeat_Call_Reason) !== "";
  });

  var byReason = function (name) {
    return withReason.filter(function (c) { return text(c.Repeat_Call_Reason) === name; });
  };
  var knowledge = byReason("Lack of Knowledge");
  var parts = byReason("Parts Unavailability");
  var power = byReason("Power Issue");
  var total = withReason.length;
  var pc = function (n) { return total > 0 ? (n * 100) / total : 0; };

  return {
    lackOfKnowledge: pc(knowledge.length),
    partsUnavailability: pc(parts.length),
    powerIssue: pc(power.length),
    totalRepeatCalls: total,
    src: { all: withReason, knowledge: knowledge, parts: parts, power: power }
  };
}

/** serviewOverviewOverallDashboard.getServiceFeedbackTrend()  (all-time, as in Deluge) */
function calcFeedbackTrend(D) {
  var records = (D.feedbacks || []).filter(function (f) {
    return hasValue(f.Company_Name) && hasValue(f.Rating);
  });
  if (!records.length) return { average_rating: 0, percentage: 0, total_count: 0, src: { all: [] } };

  var average = sum(records, function (f) { return num(f.Rating); }) / records.length;
  return {
    average_rating: round(average, 1),
    percentage: round((average / 5) * 100, 1),
    total_count: records.length,
    src: { all: records }
  };
}

/* ---------- WEEKLY ---------- */

/** weeklyServiceOverview.getWeeklyGoogleReviewCount() */
function calcGoogleReviewCount(D, today) {
  var from = startOfWeek(today);
  var rows = (D.fieldExecutives || []).filter(function (f) {
    return inRange(f.Date_field, from, today) && hasValue(f.Employee_Name) &&
      text(f.Did_you_collect_google_rating) === "Yes";
  });
  return { count: rows.length, src: rows };
}

/**
 * weeklyServiceOverview.engineerWiseCallAttended()
 * + avgCallsAttendedPerEngineerWeekly()  (bar heights)
 */
function calcEngineerWeekly(D, today) {
  var from = startOfWeek(today);
  var calls = (D.serviceCallLogs || []).filter(function (c) { return inRange(c.Date_field, from, today); });
  var engineers = serviceEngineers(D);

  var totalCalls = 0;
  var perEngineer = engineers.map(function (eng) {
    var mine = calls.filter(function (c) { return lookupId(c.Service_Engineer_Name) === String(eng.ID); });
    var completed = mine.filter(function (c) { return text(c.Status) === "Completed"; });
    var pending = mine.filter(function (c) { return text(c.Status) === "Pending"; });
    totalCalls += mine.length;

    var completedPercent = 0, pendingPercent = 0;
    if (mine.length > 0) {
      completedPercent = round((completed.length * 100) / mine.length, 1);
      pendingPercent = round((pending.length * 100) / mine.length, 1);
    }
    if (completed.length > 0 && completedPercent < 5) completedPercent = 5;
    if (pending.length > 0 && pendingPercent < 5) pendingPercent = 5;

    var totalPercent = completedPercent + pendingPercent;
    if (totalPercent > 100) {
      completedPercent = round((completedPercent * 100) / totalPercent, 1);
      pendingPercent = round((pendingPercent * 100) / totalPercent, 1);
    }

    return {
      engineer_id: eng.ID,
      engineer_name: text(eng.Employee_Name),
      total_calls_this_week: mine.length,
      calls_completed: completed.length,
      calls_pending: pending.length,
      completed_height: completedPercent,
      pending_height: pendingPercent,
      _all: mine, _completed: completed, _pending: pending
    };
  });

  return {
    from_date: from,
    to_date: today,
    per_engineer: perEngineer,
    total_calls: totalCalls,
    num_engineers: engineers.length,
    average_calls_per_engineer_week: engineers.length > 0 ? round(totalCalls / engineers.length, 1) : 0,
    src: { weekCalls: calls, engineers: engineers }
  };
}

/** weeklyServiceOverview.repeatCallPercentageWeekly()  (rolling 7 days, as in Deluge) */
function calcRepeatCallPercentWeekly(D, today) {
  var from = addDays(today, -6);
  var calls = (D.serviceCallLogs || []).filter(function (c) {
    return hasValue(c.Customer_Name) && inRange(c.Date_field, from, today) && text(c.Status) !== "Pending";
  });
  if (calls.length === 0) return { percent: 0, src: [] };

  var repeated = [];
  groupBy(calls, function (c) { return lookupId(c.Customer_Name); }).forEach(function (rows) {
    if (rows.length > 1) repeated = repeated.concat(rows); // every call of a repeating customer counts
  });
  return { percent: round((repeated.length * 100) / calls.length, 1), src: repeated, base: calls };
}

/** weeklyServiceOverview.customerRegretPercentageWeekly() */
function calcCustomerRegretPercentWeekly(D, today) {
  var from = startOfWeek(today);
  var weekly = (D.feedbacks || []).filter(function (f) {
    return hasValue(f.Company_Name) && inRange(f.Call_attended_date, from, today);
  });
  if (weekly.length === 0) return { percent: 0, src: [], base: [] };

  var regret = weekly.filter(function (f) { return ["1", "2", "3"].indexOf(text(f.Rating)) >= 0; });
  return { percent: (regret.length * 100) / weekly.length, src: regret, base: weekly };
}

/** weeklyServiceOverview.amcLeadsGenerated() */
function calcAmcLeads(D, today) {
  var from = startOfWeek(today);
  var rows = (D.serviceCallLogs || []).filter(function (c) {
    return natureOf(c) === "AMC" && inRange(c.Date_field, from, today) && text(c.Status) === "Completed";
  });
  return { count: rows.length, src: rows };
}

/** weeklyServiceOverview.pendingReplacements() */
function calcPendingReplacements(D, today) {
  var from = startOfWeek(today);
  var rows = (D.replacements || []).filter(function (r) {
    return text(r.Department) === "Service" && inRange(r.Date_field, from, today) && text(r.Status) === "Pending";
  });
  return { count: rows.length, src: rows };
}

/** weeklyServiceOverview.standbyUnitPending() */
function calcStandbyPending(D, today) {
  var from = startOfWeek(today);
  var rows = (D.standbyUnits || []).filter(function (s) {
    return hasValue(s.StandBy_To) && inRange(s.Outward_Date, from, today) && isBlank(s.Inward_Date);
  });
  return { count: rows.length, src: rows };
}

/**
 * weeklyServiceOverview.pendingCallAging()
 * Up to four weekly windows inside the current month.
 * Age = whole days between the window end and the day the call was logged.
 */
function calcPendingAging(D, today) {
  var monthStart = startOfMonth(today);
  var pending = (D.serviceCallLogs || []).filter(function (c) { return text(c.Status) === "Pending"; });
  var weeks = [];

  [0, 7, 14, 21].forEach(function (offset) {
    var end = addDays(today, -offset);
    if (offset > 0 && end < monthStart) return;

    var start = startOfWeek(end);
    if (start < monthStart) start = monthStart;

    var d0to2 = [], d3to5 = [], dAbove5 = [];
    pending.filter(function (c) { return inRange(c.Date_field, start, end); })
      .forEach(function (c) {
        var age = Math.abs(daysBetween(end, parseDate(c.Date_field)));
        if (age <= 2) d0to2.push(c);
        else if (age <= 5) d3to5.push(c);
        else dAbove5.push(c);
      });

    weeks.push({
      "0-2_Days": d0to2.length,
      "3-5_Days": d3to5.length,
      above_5_Days: dAbove5.length,
      Total: d0to2.length + d3to5.length + dAbove5.length,
      _d02: d0to2, _d35: d3to5, _d5: dAbove5
    });
  });

  return weeks;
}

/** weeklyServiceOverview.getWeeklyAMCAnalytics() */
function calcAmcAnalytics(D, today) {
  var from = startOfWeek(today);
  var quotations = (D.quotations || []).filter(function (q) {
    return hasValue(q.Customer_Name) && text(q.Nature_of_Calls) === "AMC" && inRange(q.Date_field, from, today);
  });

  var convertedQuotationIds = new Set((D.amcContracts || []).map(function (c) { return lookupId(c.Quotation_Number); }));
  var closedRows = quotations.filter(function (q) { return convertedQuotationIds.has(String(q.ID)); });
  var pendingRows = quotations.filter(function (q) { return !convertedQuotationIds.has(String(q.ID)); });
  var total = quotations.length;

  return {
    week_start: from,
    week_end: today,
    total: total,
    closed: closedRows.length,
    pending: pendingRows.length,
    closed_percent: total > 0 ? round((closedRows.length * 100) / total, 1) : 0,
    pending_percent: total > 0 ? round((pendingRows.length * 100) / total, 1) : 0,
    src: { all: quotations, closed: closedRows, pending: pendingRows }
  };
}

/** weeklyServiceOverview.redTagItemTrendWeeklyFunc()  (current month, 4 buckets) */
function calcRedTagTrend(D, today) {
  var monthStart = startOfMonth(today);
  var monthEnd = endOfMonth(today);
  var redTagNames = new Set((D.products || [])
    .filter(function (p) { return isTrue(p.Is_Red_Tag_Material); })
    .map(function (p) { return text(p.Product_Name); }));

  var buckets = [[], [], [], []];
  (D.serviceReports || []).forEach(function (r) {
    var d = parseDate(r.Call_Attended_Date);
    if (!d || d < monthStart || d > monthEnd) return;
    var name = text(r.Product);
    if (name === "" || !redTagNames.has(name)) return;
    buckets[Math.min(3, Math.floor(daysBetween(monthStart, d) / 7))].push(r);
  });

  var counts = buckets.map(function (b) { return b.length; });
  return {
    week1: counts[0], week2: counts[1], week3: counts[2], week4: counts[3],
    maxValue: Math.max.apply(null, [1].concat(counts)),
    src: buckets
  };
}

/** weeklyServiceOverview.getWeeklySatisfactionData()  (oldest week first, as in Deluge) */
function calcWeeklySatisfaction(D, today) {
  var feedbacks = (D.feedbacks || []).filter(function (f) { return hasValue(f.Company_Name); });
  var weeks = [];

  [1, 2, 3, 4].forEach(function (weekNum) {
    var end = addDays(today, -(weekNum - 1) * 7);
    var start = startOfWeek(end);
    var inWeek = feedbacks.filter(function (f) { return inRange(f.Call_attended_date, start, end); });

    var average = 0;
    if (inWeek.length > 0) average = round(sum(inWeek, function (f) { return num(f.Rating); }) / inWeek.length, 1);

    var barHeightPct = round((average / 5) * 150, 1);
    if (average > 0 && barHeightPct < 10) barHeightPct = 10;

    weeks.push({
      week_number: weekNum,
      week_label: "Week " + weekNum,
      average_rating: average,
      total_feedback: inWeek.length,
      bar_height: barHeightPct,
      _rows: inWeek
    });
  });

  return weeks.reverse();
}

/** serviceOverviewDashboard.getRecentFeedbacks()  (first 5, in report order) */
function calcRecentFeedbacks(D) {
  return (D.feedbacks || [])
    .filter(function (f) { return hasValue(f.Company_Name); })
    .slice(0, 5)
    .map(function (f) {
      var comments = text(f.Any_additional_comments_or_suggestions_would_be_appreciated1);
      var value = rating(f.Rating);
      return {
        id: f.ID,
        created_date: parseDate(f.Call_attended_date),
        customer_name: text(f.Company_Name),
        rating: isFinite(value) ? value : 0,
        comments: comments !== "" ? comments : "No comments"
      };
    });
}

/** weeklyServiceOverview.averageResponseTime()  (hours, returned as text) */
function calcAverageResponseTime(D, today) {
  var from = startOfWeek(today);
  var reports = (D.serviceReports || []).filter(function (r) {
    return hasValue(r.Call_Received_Date) && hasValue(r.Service_Call_Log) &&
      inRange(r.Call_Attended_Date, from, today);
  });
  if (reports.length === 0) return { value: "0", src: [] };

  var hours = 0, valid = 0, used = [];
  reports.forEach(function (r) {
    var received = parseDate(r.Call_Received_Date);
    var attended = parseDate(r.Call_Attended_Date);
    if (!received || !attended) return;
    var taken = (attended - received) / 3600000;
    if (taken >= 0) { hours += taken; valid += 1; used.push(r); }
  });

  return { value: valid > 0 ? String(round(hours / valid, 1)) : "0", src: used };
}

/* ---------- MONTHLY ---------- */

/** monthlyServiceOverview.totalCallLogsTileFunc() */
function calcTotalCallLogs(D, today) {
  var from = startOfMonth(today);
  var monthCalls = (D.serviceCallLogs || []).filter(function (c) { return inRange(c.Date_field, from, today); });
  var pick = function (n) { return monthCalls.filter(function (c) { return natureOf(c) === n; }); };
  var warranty = pick("Warranty"), postWarranty = pick("PW"), amc = pick("AMC");

  // The expense amounts are commented out in the Deluge function (always 0).
  return {
    warranty_count: warranty.length,
    post_warranty: postWarranty.length,
    amc_count: amc.length,
    warranty_amount: 0,
    post_warranty_amount: 0,
    src: { warranty: warranty, postWarranty: postWarranty, amc: amc }
  };
}

function monthExpenses(D, from, to) {
  return (D.engineerExpenses || []).filter(function (e) { return inRange(e.Date_field1234567890, from, to); });
}
function monthReworks(D, from, to) {
  return (D.reworks || []).filter(function (r) { return inRange(r.Date_field, from, to); });
}
function monthReworkCost(D, from, to) {
  return sum(monthReworks(D, from, to), function (r) { return num(r.Approximate_Cost); });
}

/** monthlyServiceOverview.indirectExpense() */
function calcIndirectExpense(D, today) {
  var from = startOfMonth(today);
  var expenses = monthExpenses(D, from, today);
  var engineer = sum(expenses, function (e) {
    return sum(asRows(e.Material_Replaced1), function (row) { return num(row.Engineer_Expenses); });
  });
  return {
    value: round(engineer + monthReworkCost(D, from, today), 2),
    src: expenses.concat(monthReworks(D, from, today))
  };
}

/** monthlyServiceOverview.repeatCallAnalysis() */
function calcRepeatCallAnalysis(D, today) {
  var from = startOfMonth(today);
  var pending = (D.serviceCallLogs || []).filter(function (c) {
    return hasValue(c.Customer_Name) && inRange(c.Date_field, from, today) && text(c.Status) === "Pending";
  });

  var customers = 0, rows = [];
  groupBy(pending, function (c) { return lookupId(c.Customer_Name); }).forEach(function (list) {
    if (list.length > 1) { customers += 1; rows = rows.concat(list); }
  });
  return { repead_calls: customers, src: rows };
}

/** monthlyServiceOverview.stockUnavailabilityDelayCountFunc() */
function calcStockDelays(D, today) {
  var from = startOfMonth(today);
  var rows = (D.serviceReports || []).filter(function (r) {
    return text(r.Status) === "Pending For Spares" && inRange(r.Call_Attended_Date, from, today);
  });
  return { count: rows.length, src: rows };
}

/** monthlyServiceOverview.monthlyTrainingHoursConducted() */
function calcTrainingHours(D, today) {
  var from = startOfMonth(today);
  var total = 0, rows = [];
  (D.trainingReports || []).forEach(function (t) {
    var used = false;
    asRows(t.Report).forEach(function (row) {
      if (inRange(row.Date_field, from, today)) { total += num(row.Total_Hours); used = true; }
    });
    if (used) rows.push(t);
  });
  return { value: round(total, 2), src: rows };
}

/** monthlyServiceOverview.calculateToolVehicleCompliance() */
function calcCompliance(D, today) {
  var monthName = MONTH_LONG[today.getMonth()];

  // Every subform row of a report counts as "required"; all of them are
  // "completed" once the parent report is Approved.
  var tally = function (reports, subformNames) {
    var required = 0, completed = 0, rows = [];
    reports.filter(function (r) { return text(r.Month_field) === monthName; })
      .forEach(function (r) {
        var name = subformNames.filter(function (n) { return asRows(r[n]).length > 0; })[0];
        var sub = name ? asRows(r[name]) : [];
        required += sub.length;
        if (text(r.Status) === "Approved") completed += sub.length;
        rows.push(r);
      });
    return { required: required, completed: completed, rows: rows };
  };

  var tool = tally(D.toolReports || [], ["Service_Tools_Kit_of_Engineers"]);
  // Deluge reads the same subform name for vehicles; "Report" is its own comment's guess.
  var vehicle = tally(D.vehicleReports || [], ["Service_Tools_Kit_of_Engineers", "Report"]);

  var totalRequired = tool.required + vehicle.required;
  var totalCompleted = tool.completed + vehicle.completed;

  return {
    tool_required: tool.required,
    tool_completed: tool.completed,
    vehicle_required: vehicle.required,
    vehicle_completed: vehicle.completed,
    total_required: totalRequired,
    total_completed: totalCompleted,
    compliance_percentage: totalRequired > 0 ? round((totalCompleted / totalRequired) * 100, 2) : 0,
    src: tool.rows.concat(vehicle.rows)
  };
}

/** monthlyServiceOverview.positiveFeedbackFunc()  (all-time, as in Deluge) */
function calcPositiveFeedback(D) {
  var records = (D.feedbacks || []).filter(function (f) { return hasValue(f.Company_Name); });
  if (records.length === 0) {
    return { positive_feedback_percentage: 0, avg_feedback: 0, src: { all: [], positive: [] } };
  }
  var positive = records.filter(function (f) { return rating(f.Rating) >= 4; });
  return {
    positive_feedback_percentage: round((positive.length * 100) / records.length, 1),
    avg_feedback: round(sum(records, function (f) { return num(f.Rating); }) / records.length, 1),
    src: { all: records, positive: positive }
  };
}

/**
 * monthlyServiceOverview.getCompliantCostByCategory()
 * Spare lines by nature of call. Deluge compares the report's Added_Time
 * (date-time) with the date `today`, i.e. midnight; kept as is.
 */
function calcCostByCategory(D, today) {
  var from = startOfMonth(today);
  var buckets = { AMC: [], PW: [], Warranty: [] };

  (D.serviceReports || []).forEach(function (report) {
    var added = parseDateTime(report.Added_Time);
    if (!added || added < from || added > today) return;

    asRows(report.Spare_Replaced).forEach(function (line) {
      if (!inRange(line.Date_field, from, today)) return;
      var nature = text(line.Nature_of_Calls);
      if (buckets[nature]) {
        // Keep the parent report so the drill-down shows a real, openable record.
        buckets[nature].push(Object.assign({ _parent: report }, line));
      }
    });
  });

  var amc = buckets.AMC.length, pw = buckets.PW.length, warranty = buckets.Warranty.length;
  var total = amc + pw + warranty;
  var pc = function (n) { return total > 0 ? (n / total) * 100 : 0; };

  return {
    amc_percentage: pc(amc),
    pw_percentage: pc(pw),
    w_percentage: pc(warranty),
    has_data: total > 0,
    src: buckets
  };
}

/** monthlyServiceOverview.expenseBreakdown() */
function calcExpenseBreakdown(D, today) {
  var from = startOfMonth(today);
  var records = monthExpenses(D, from, today).filter(function (e) { return hasValue(e.Service_Engineer_Name); });
  var reworkRows = monthReworks(D, from, today);
  var rework = sum(reworkRows, function (r) { return num(r.Approximate_Cost); });

  var direct = 0, indirect = 0;
  records.forEach(function (rec) {
    direct += sum(asRows(rec.Material_Replaced1), function (row) { return num(row.Direct_Expense); });
    indirect += num(rec.Overall_Engineer);
    if (CONFIG.PARITY.expenseReworkInsideLoop) indirect += rework;
  });
  if (!CONFIG.PARITY.expenseReworkInsideLoop) indirect += rework;

  var total = direct + indirect;
  return {
    direct_expense: round(direct, 2),
    indirect_expense: round(indirect, 2),
    total_expense: round(total, 2),
    direct_percent: total > 0 ? round((direct * 100) / total, 1) : 0,
    indirect_percent: total > 0 ? round((indirect * 100) / total, 1) : 0,
    src: { expenses: records, reworks: reworkRows }
  };
}

/** monthlyServiceOverview.repeatCallTrendMonthly()  (Jan..current month, year to date) */
function calcRepeatCallTrend(D, today) {
  var yearStart = startOfYear(today);
  var perMonth = [];
  for (var i = 0; i < 12; i++) perMonth.push(new Map());

  (D.serviceCallLogs || [])
    .filter(function (c) {
      return inRange(c.Date_field, yearStart, today) && text(c.Status) !== "Pending" && hasValue(c.Customer_Name);
    })
    .forEach(function (c) {
      var customers = perMonth[parseDate(c.Date_field).getMonth()];
      var cid = lookupId(c.Customer_Name);
      if (!customers.has(cid)) customers.set(cid, []);
      customers.get(cid).push(c);
    });

  return MONTH_SHORT.slice(0, today.getMonth() + 1).map(function (month, i) {
    var rows = [];
    perMonth[i].forEach(function (list) {
      if (list.length > 1) rows = rows.concat(list); // all calls of a repeating customer are repeat calls
    });
    return { month: month, repeat_calls: rows.length, _rows: rows };
  });
}

/** monthlyServiceOverview.customerSatisfactionMonthly() */
function calcSatisfactionMonthly(D, today) {
  var year = today.getFullYear();
  var months = MONTH_SHORT.map(function (name) { return { name: name, total: 0, count: 0, _rows: [] }; });

  (D.feedbacks || []).forEach(function (f) {
    var d = parseDate(f.Call_attended_date);
    if (!d || d.getFullYear() !== year) return;
    var value = rating(f.Rating);
    if (!isFinite(value) || value <= 0 || value > 5) return;
    months[d.getMonth()].total += value;
    months[d.getMonth()].count += 1;
    months[d.getMonth()]._rows.push(f);
  });

  var totalRatings = sum(months, function (m) { return m.total; });
  var totalCount = sum(months, function (m) { return m.count; });
  var allRows = [];
  months.forEach(function (m) { allRows = allRows.concat(m._rows); });

  return {
    months: months.map(function (m) {
      return {
        name: m.name,
        average: m.count > 0 ? round(m.total / m.count, 2) : 0,
        count: m.count,
        _rows: m._rows
      };
    }),
    overall_average: totalCount > 0 ? round(totalRatings / totalCount, 2) : 0,
    overall_count: totalCount,
    src: allRows
  };
}

/** monthlyServiceOverview.recentComplaintsMonthly() */
function calcRecentComplaints(D, today) {
  var from = startOfMonth(today);
  var rows = (D.feedbacks || []).filter(function (f) {
    return onOrAfter(f.Call_attended_date, from) && hasValue(f.Company_Name) && rating(f.Rating) <= 3;
  });
  return {
    list: rows.map(function (f) {
      return {
        customer_name: text(f.Company_Name),
        customer_feedback: text(f.Any_additional_comments_or_suggestions_would_be_appreciated1),
        feedback_date: parseDate(f.Call_attended_date)
      };
    }),
    src: rows
  };
}

/** monthlyServiceOverview.calibrationAndMaintanenceReportTableFunc() */
function calcCalibrationTable(D, today) {
  var currentMonth = today.getMonth();
  var currentYear = today.getFullYear();

  return (D.calibrationRecords || []).map(function (record) {
    var equipment = text(record.UUC_E);
    if (equipment === "") equipment = text(record.Meter_Type) + " - " + text(record.Meter_Make);

    var reportType = text(record.Calibration_Type);
    if (reportType === "") reportType = "Calibration Report";

    var lastService = parseDate(record.Rev_Date);
    var nextService = null, dueThisMonth = false, overdue = false;
    if (lastService) {
      nextService = addYears(lastService, 1);
      dueThisMonth = nextService.getMonth() === currentMonth && nextService.getFullYear() === currentYear;
      overdue = nextService < today;
    }

    var servicePerson = "Not Assigned";
    if (hasValue(record.Approved_By)) servicePerson = text(record.Approved_By);
    else if (hasValue(record.Tested_By)) servicePerson = text(record.Tested_By);

    var status = "Pending", statusColor = "orange";
    if (hasValue(record.Approved_By)) {
      if (dueThisMonth) { status = "Completed"; statusColor = "green"; }
      else { status = "Up to Date"; statusColor = "blue"; }
    } else if (overdue) { status = "Overdue"; statusColor = "red"; }

    return {
      equipment: equipment,
      report_type: reportType,
      last_service_date: lastService ? fmtDateSpaced(lastService) : "N/A",
      next_service_date: nextService ? fmtDateSpaced(nextService) : "N/A",
      is_due_this_month: dueThisMonth,
      is_overdue: overdue,
      service_person: servicePerson,
      status: status,
      status_color: statusColor,
      _record: record
    };
  });
}

/* ---------- view models ---------- */

function computeTodayView(D, today) {
  return {
    tiles: calcTodayTiles(D, today),
    executives: calcExecutivePerformance(D, today),
    invoiceTrend: calcInvoiceTrend(D, today),
    repeatReasons: calcRepeatReasons(D, today),
    feedbackTrend: calcFeedbackTrend(D)
  };
}

function computeWeeklyView(D, today) {
  var satisfaction = calcWeeklySatisfaction(D, today);
  var rated = satisfaction.filter(function (w) { return w.average_rating > 0; });
  var overallAvg = rated.length > 0 ? round(sum(rated, function (w) { return w.average_rating; }) / rated.length, 1) : 0;
  var fullStars = Math.floor(overallAvg);

  return {
    googleReviews: calcGoogleReviewCount(D, today),
    engineer: calcEngineerWeekly(D, today),
    avgResponseTime: calcAverageResponseTime(D, today),
    repeatCallPercent: calcRepeatCallPercentWeekly(D, today),
    regretPercent: calcCustomerRegretPercentWeekly(D, today),
    amcLeads: calcAmcLeads(D, today),
    pendingReplacements: calcPendingReplacements(D, today),
    standbyPending: calcStandbyPending(D, today),
    aging: calcPendingAging(D, today),
    amc: calcAmcAnalytics(D, today),
    redTag: calcRedTagTrend(D, today),
    satisfaction: satisfaction,
    overallAvg: overallAvg,
    fullStars: fullStars,
    hasHalfStar: overallAvg - fullStars >= 0.5,
    recentFeedbacks: calcRecentFeedbacks(D)
  };
}

function computeMonthlyView(D, today) {
  return {
    callLogs: calcTotalCallLogs(D, today),
    indirectExpense: calcIndirectExpense(D, today),
    repeatCalls: calcRepeatCallAnalysis(D, today),
    stockDelays: calcStockDelays(D, today),
    trainingHours: calcTrainingHours(D, today),
    compliance: calcCompliance(D, today),
    positiveFeedback: calcPositiveFeedback(D),
    costByCategory: calcCostByCategory(D, today),
    expense: calcExpenseBreakdown(D, today),
    repeatTrend: calcRepeatCallTrend(D, today),
    satisfaction: calcSatisfactionMonthly(D, today),
    complaints: calcRecentComplaints(D, today),
    calibration: calcCalibrationTable(D, today)
  };
}

/* ================================================================
   5. DRILL-DOWNS
   Column sets per report, then one definition per clickable number.
   `rows` is a function so the modal always reads the data that is
   loaded at the moment it opens.
   ================================================================ */

var COLS = {
  callLog: [
    { label: "Call No", value: "Service_Call_Log_No" },
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Customer", value: "Customer_Name" },
    { label: "Engineer", value: "Service_Engineer_Name" },
    { label: "Nature", value: "Nature_Of_Calls" },
    { label: "Status", value: "Status" },
    { label: "Repeat Reason", value: "Repeat_Call_Reason" }
  ],
  serviceReport: [
    { label: "Call Log", value: "Service_Call_Log" },
    { label: "Attended", value: "Call_Attended_Date", format: "date" },
    { label: "Received", value: "Call_Received_Date", format: "date" },
    { label: "Engineer", value: "Service_Engineer_Name" },
    { label: "Product", value: "Product" },
    { label: "Status", value: "Status" }
  ],
  feedback: [
    { label: "Date", value: "Call_attended_date", format: "date" },
    { label: "Customer", value: "Company_Name" },
    { label: "Engineer", value: "service_engineer_attended_the_call" },
    { label: "Rating", value: "Rating", format: "dec" },
    { label: "Comments", value: "Any_additional_comments_or_suggestions_would_be_appreciated1" }
  ],
  fieldExecutive: [
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Employee", value: "Employee_Name" },
    { label: "Leave / Break", value: "Leave_Break" },
    { label: "Google Rating Collected", value: "Did_you_collect_google_rating" }
  ],
  quotation: [
    { label: "Quotation No", value: "Service_Quotation_No" }, // confirmed via fields.txt — was "Quotation_Number" (wrong)
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Customer", value: "Customer_Name" },
    { label: "Nature", value: "Nature_of_Calls" },
    { label: "Status", value: "Status" }
  ],
  invoice: [
    { label: "Invoice No", value: "Invoice_Number" },
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Customer", value: "Customer" },
    { label: "Call Log", value: "Service_Call_Log" },
    { label: "Service Amt", value: "Service_Amount", format: "money" },
    { label: "Spare Amt", value: "Spare_Amount", format: "money" },
    { label: "Final Total", value: "Final_Total", format: "money" }
  ],
  replacement: [
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Department", value: "Department" },
    { label: "Defective Product", value: "Defective_Product" },
    { label: "Qty", value: "Qty", format: "int" },
    { label: "Status", value: "Status" }
  ],
  standby: [
    { label: "Standby To", value: "StandBy_To" },
    { label: "Product", value: "Product" },
    { label: "Outward", value: "Outward_Date", format: "date" },
    { label: "Inward", value: "Inward_Date", format: "date" }
  ],
  expense: [
    { label: "Date", value: "Date_field1234567890", format: "date" },
    { label: "Engineer", value: "Service_Engineer_Name" },
    { label: "Indirect (Overall)", value: "Overall_Engineer", format: "money" },
    {
      label: "Direct (subform)", format: "money",
      value: function (r) {
        return sum(asRows(r.Material_Replaced1), function (x) { return num(x.Direct_Expense); });
      }
    }
  ],
  rework: [
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Approx. Cost", value: "Approximate_Cost", format: "money" }
  ],
  compliance: [
    { label: "Month", value: "Month_field" },
    { label: "Status", value: "Status" },
    {
      label: "Items", format: "int",
      value: function (r) {
        return asRows(r.Service_Tools_Kit_of_Engineers).length || asRows(r.Report).length;
      }
    }
  ],
  spareLine: [
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Nature", value: "Nature_of_Calls" },
    { label: "Parent Report Status", value: function (r) { return r._parent ? r._parent.Status : ""; } },
    { label: "Product", value: function (r) { return r._parent ? r._parent.Product : ""; } }
  ],
  calibration: [
    { label: "Equipment (UUC/E)", value: "UUC_E" },
    { label: "Meter Type", value: "Meter_Type" },
    { label: "Meter Make", value: "Meter_Make" },
    { label: "Calibration Type", value: "Calibration_Type" },
    { label: "Rev Date", value: "Rev_Date", format: "date" },
    { label: "Rev No", value: "Rev_No" },
    { label: "Tested By", value: "Tested_By" },
    { label: "Approved By", value: "Approved_By" }
  ],
  training: [
    {
      label: "Sessions in month", format: "int",
      value: function (r) { return asRows(r.Report).length; }
    },
    {
      label: "Total hours", format: "dec",
      value: function (r) { return sum(asRows(r.Report), function (x) { return num(x.Total_Hours); }); }
    }
  ],
  product: [
    { label: "Product Code", value: "Product_Code" },
    { label: "Product Name", value: "Product_Name" },
    { label: "Red Tag", value: "Is_Red_Tag_Material" }
  ]
};

/** Live view models, read by the drill-down row functions. */
var VIEW = { today: null, weekly: null, monthly: null };

function drill(key, title, report, columns, rowsFn, subtitle, empty) {
  AK.defineDrill(key, {
    title: title,
    subtitle: subtitle,
    report: report,
    columns: columns,
    rows: rowsFn,
    empty: empty
  });
}

function defineTodayDrills(today) {
  var t = function () { return VIEW.today.tiles.src; };
  var day = fmtDateMon(today);

  drill("today.totalCalls", "Total Calls Logged Today", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return t().total_calls_today; }, "Service Call Log where Date = " + day);

  drill("today.executives", "Service Executives Active Today", R.FIELD_EXECUTIVE, COLS.fieldExecutive,
    function () { return t().executives_act_today; },
    "Field Executive where Date = " + day + " and Leave/Break is not Emergency or Informed Leave");

  drill("today.reports", "Service Reports Submitted", R.SERVICE_REPORT, COLS.serviceReport,
    function () { return t().service_reports_submitted_count; },
    "Service Report attended " + day + " whose Service Call Log is Completed (each call log counted once)");

  drill("today.quotations", "Quotations Sent Today", R.SERVICE_QUOTATION, COLS.quotation,
    function () { return t().quot_sent_today; }, "Service Quotation where Date = " + day + " and Status = Sent");

  drill("today.feedback", "Customer Feedbacks Collected", R.SERVICE_FEEDBACK, COLS.feedback,
    function () { return t().cust_feedback_rec; },
    "Service Feedback where Call attended date = " + day + " and Company Name is filled");

  drill("today.pendingCalls", "Pending Calls > 48 Hrs", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return t().pending_calls; },
    "Service Call Log where Status = Pending and Date is on or before " + fmtDateMon(addDays(today, -2)),
    "No call has been sitting in Pending for more than 48 hours. That is a good result, not missing data.");

  drill("today.regret", "Customer Regret Cases", R.SERVICE_FEEDBACK, COLS.feedback,
    function () { return t().customer_regret_cases_count; },
    CONFIG.PARITY.regretCasesPrecedence
      ? "Service Feedback rated 2 (any date), or rated 1 on " + day + " — matches the original Deluge precedence"
      : "Service Feedback rated 1 or 2 on " + day);

  drill("today.repeatCalls", "Repeat Calls Logged", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return t().repeated_calls_count; },
    "Pending calls logged " + day + " for customers with 2 or more such calls (all their calls shown)");

  drill("today.invoices", "Invoices Generated Today", R.SERVICE_INVOICE, COLS.invoice,
    function () { return t().invoices_gen_today; },
    "Service Invoice where Date = " + day + " and Customer is filled");

  drill("today.invoiceAmount", "Invoice Amounts Today", R.SERVICE_INVOICE, COLS.invoice,
    function () { return t().total_invoiced_amt_today; }, "Final Total summed over today's invoices");

  /* invoice trend columns */
  var inv = function (k) { return function () { return VIEW.today.invoiceTrend.src[k]; }; };
  drill("today.trend.amc", "Invoice Amount Trend — AMC", R.SERVICE_INVOICE, COLS.invoice,
    inv("amc"), "Today's invoices whose Service Call Log has Nature = AMC");
  drill("today.trend.install", "Invoice Amount Trend — Install", R.SERVICE_INVOICE, COLS.invoice,
    inv("install"), "Today's invoices whose Service Call Log has Nature = Installation");
  drill("today.trend.repair", "Invoice Amount Trend — Repair", R.SERVICE_INVOICE, COLS.invoice,
    inv("repair"), "Today's invoices whose Service Call Log has Nature = Repair");
  drill("today.trend.service", "Invoice Amount Trend — Service", R.SERVICE_INVOICE, COLS.invoice,
    inv("service"), "Today's invoices with a Service Amount");
  drill("today.trend.spares", "Invoice Amount Trend — Spares", R.SERVICE_INVOICE, COLS.invoice,
    inv("spares"), "Today's invoices with a Spare Amount");

  /* repeat reasons */
  var rr = function (k) { return function () { return VIEW.today.repeatReasons.src[k]; }; };
  drill("today.reason.all", "Repeat Calls Today", R.SERVICE_CALL_LOG, COLS.callLog,
    rr("all"), "Today's calls that have a Repeat Call Reason");
  drill("today.reason.knowledge", "Repeat Calls — Lack of Knowledge", R.SERVICE_CALL_LOG, COLS.callLog,
    rr("knowledge"), 'Today\'s calls with Repeat Call Reason = "Lack of Knowledge"');
  drill("today.reason.parts", "Repeat Calls — Parts Unavailability", R.SERVICE_CALL_LOG, COLS.callLog,
    rr("parts"), 'Today\'s calls with Repeat Call Reason = "Parts Unavailability"');
  drill("today.reason.power", "Repeat Calls — Power Issue", R.SERVICE_CALL_LOG, COLS.callLog,
    rr("power"), 'Today\'s calls with Repeat Call Reason = "Power Issue"');

  drill("today.feedbackTrend", "Service Feedback Trend", R.SERVICE_FEEDBACK, COLS.feedback,
    function () { return VIEW.today.feedbackTrend.src.all; },
    "All feedback with a Company Name and a Rating (all time, as in the original Deluge)");

  /* per-engineer bars */
  VIEW.today.executives.forEach(function (e, i) {
    drill("today.exec." + i + ".a", "Assigned Today — " + e.Engineer_Name, R.SERVICE_REPORT, COLS.serviceReport,
      function () { return VIEW.today.executives[i]._assigned; },
      "Service Reports attended " + day + " by " + e.Engineer_Name);
    drill("today.exec." + i + ".c", "Closed Today — " + e.Engineer_Name, R.SERVICE_REPORT, COLS.serviceReport,
      function () { return VIEW.today.executives[i]._completed; },
      "Service Reports attended " + day + " by " + e.Engineer_Name + " with Status = Completed");
  });
}

function defineWeeklyDrills(today) {
  var v = VIEW.weekly;
  var from = fmtDateMon(startOfWeek(today));
  var to = fmtDateMon(today);
  var window = from + " to " + to;

  drill("weekly.avgCalls", "Calls Attended This Week", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return VIEW.weekly.engineer.src.weekCalls; },
    "All Service Call Logs " + window + " (the tile divides these by the number of service engineers)");

  drill("weekly.responseTime", "Reports Used for Average Response Time", R.SERVICE_REPORT, COLS.serviceReport,
    function () { return VIEW.weekly.avgResponseTime.src; },
    "Service Reports attended " + window + " with both a Call Received Date and a Service Call Log");

  drill("weekly.repeatPct", "Repeat Calls (rolling 7 days)", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return VIEW.weekly.repeatCallPercent.src; },
    "Non-pending calls " + fmtDateMon(addDays(today, -6)) + " to " + to +
    " belonging to customers with more than one call in that window");

  drill("weekly.regretPct", "Customer Regret Feedback", R.SERVICE_FEEDBACK, COLS.feedback,
    function () { return VIEW.weekly.regretPercent.src; },
    "Feedback " + window + " rated 1, 2 or 3");

  drill("weekly.google", "Google Reviews Collected", R.FIELD_EXECUTIVE, COLS.fieldExecutive,
    function () { return VIEW.weekly.googleReviews.src; },
    'Field Executive entries ' + window + ' with "Did you collect google rating" = Yes');

  drill("weekly.amcLeads", "AMC Leads Generated", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return VIEW.weekly.amcLeads.src; },
    "Service Call Logs " + window + " with Nature = AMC and Status = Completed");

  drill("weekly.replacements", "Pending Replacements", R.REJECTION_REPLACEMENT, COLS.replacement,
    function () { return VIEW.weekly.pendingReplacements.src; },
    "Rejection & Replacement " + window + " where Department = Service and Status = Pending");

  drill("weekly.standby", "Standby Units Pending Collection", R.STANDBY_UNIT, COLS.standby,
    function () { return VIEW.weekly.standbyPending.src; },
    "Stand By Units sent out " + window + " with no Inward Date yet");

  drill("weekly.amc.offered", "AMC Quotations Offered", R.SERVICE_QUOTATION, COLS.quotation,
    function () { return VIEW.weekly.amc.src.all; },
    "Service Quotations " + window + " with Nature = AMC");
  drill("weekly.amc.closed", "AMC Quotations Closed", R.SERVICE_QUOTATION, COLS.quotation,
    function () { return VIEW.weekly.amc.src.closed; },
    "AMC quotations " + window + " that have a matching AMC Contract");
  drill("weekly.amc.pending", "AMC Quotations Pending", R.SERVICE_QUOTATION, COLS.quotation,
    function () { return VIEW.weekly.amc.src.pending; },
    "AMC quotations " + window + " with no AMC Contract yet");

  v.engineer.per_engineer.forEach(function (e, i) {
    drill("weekly.eng." + i + ".t", "Calls This Week — " + e.engineer_name, R.SERVICE_CALL_LOG, COLS.callLog,
      function () { return VIEW.weekly.engineer.per_engineer[i]._all; }, window);
    drill("weekly.eng." + i + ".c", "Completed — " + e.engineer_name, R.SERVICE_CALL_LOG, COLS.callLog,
      function () { return VIEW.weekly.engineer.per_engineer[i]._completed; }, window + ", Status = Completed");
    drill("weekly.eng." + i + ".p", "Pending — " + e.engineer_name, R.SERVICE_CALL_LOG, COLS.callLog,
      function () { return VIEW.weekly.engineer.per_engineer[i]._pending; }, window + ", Status = Pending");
  });

  v.aging.forEach(function (w, i) {
    drill("weekly.age." + i + ".a", "Pending 0-2 Days — Week " + (i + 1), R.SERVICE_CALL_LOG, COLS.callLog,
      function () { return VIEW.weekly.aging[i]._d02; }, "Pending calls aged 0-2 days in this window");
    drill("weekly.age." + i + ".b", "Pending 3-5 Days — Week " + (i + 1), R.SERVICE_CALL_LOG, COLS.callLog,
      function () { return VIEW.weekly.aging[i]._d35; }, "Pending calls aged 3-5 days in this window");
    drill("weekly.age." + i + ".c", "Pending > 5 Days — Week " + (i + 1), R.SERVICE_CALL_LOG, COLS.callLog,
      function () { return VIEW.weekly.aging[i]._d5; }, "Pending calls aged more than 5 days in this window");
  });

  v.satisfaction.forEach(function (w, i) {
    drill("weekly.sat." + i, "Feedback — " + w.week_label, R.SERVICE_FEEDBACK, COLS.feedback,
      function () { return VIEW.weekly.satisfaction[i]._rows; }, "Feedback received in " + w.week_label);
  });

  [0, 1, 2, 3].forEach(function (i) {
    drill("weekly.redtag." + i, "Red Tag Items — Week " + (i + 1), R.SERVICE_REPORT, COLS.serviceReport,
      function () { return VIEW.weekly.redTag.src[i]; },
      "Service Reports in week " + (i + 1) + " of this month whose Product is flagged Is_Red_Tag_Material");
  });
}

function defineMonthlyDrills(today) {
  var v = VIEW.monthly;
  var window = fmtDateMon(startOfMonth(today)) + " to " + fmtDateMon(today);

  drill("monthly.warranty", "Calls Logged — Warranty", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return VIEW.monthly.callLogs.src.warranty; }, window + ", Nature = Warranty");
  drill("monthly.pw", "Calls Logged — Post Warranty", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return VIEW.monthly.callLogs.src.postWarranty; }, window + ", Nature = PW");
  drill("monthly.amc", "Calls Logged — AMC", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return VIEW.monthly.callLogs.src.amc; }, window + ", Nature = AMC");

  drill("monthly.indirect", "Indirect Expenses", R.EXPENSE_ENGINEER, COLS.expense,
    function () { return VIEW.monthly.indirectExpense.src; },
    "Engineer Expenses " + window + " (subform Engineer_Expenses) plus Rework approximate cost");

  drill("monthly.repeatCalls", "Repeat Call Analysis", R.SERVICE_CALL_LOG, COLS.callLog,
    function () { return VIEW.monthly.repeatCalls.src; },
    "Pending calls " + window + " for customers with more than one such call");

  drill("monthly.stockDelays", "Stock Unavailability Delays", R.SERVICE_REPORT, COLS.serviceReport,
    function () { return VIEW.monthly.stockDelays.src; },
    "Service Reports " + window + ' with Status = "Pending For Spares"');

  drill("monthly.training", "Training Hours Conducted", R.TRAINING_REPORT, COLS.training,
    function () { return VIEW.monthly.trainingHours.src; },
    "Training Reports with subform rows dated " + window);

  drill("monthly.compliance", "Tool & Vehicle Inspections", R.TOOL_KIT, COLS.compliance,
    function () { return VIEW.monthly.compliance.src; },
    "Tool Kit and Vehicle Service reports for " + MONTH_LONG[today.getMonth()] +
    " (every subform row counts as required; all count as completed once the report is Approved)");

  drill("monthly.feedbackAll", "Customer Feedback — All", R.SERVICE_FEEDBACK, COLS.feedback,
    function () { return VIEW.monthly.positiveFeedback.src.all; },
    "All feedback with a Company Name (all time, as in the original Deluge)");
  drill("monthly.feedbackPositive", "Customer Feedback — Positive", R.SERVICE_FEEDBACK, COLS.feedback,
    function () { return VIEW.monthly.positiveFeedback.src.positive; }, "Feedback rated 4 or 5");

  drill("monthly.expense.direct", "Direct Expenses", R.EXPENSE_ENGINEER, COLS.expense,
    function () { return VIEW.monthly.expense.src.expenses; },
    "Engineer Expenses " + window + " — Direct_Expense summed across the Material_Replaced1 subform");
  drill("monthly.expense.indirect", "Indirect Expenses", R.EXPENSE_ENGINEER, COLS.expense,
    function () { return VIEW.monthly.expense.src.expenses; },
    "Engineer Expenses " + window + " — Overall_Engineer" +
    (CONFIG.PARITY.expenseReworkInsideLoop ? ", plus rework cost added once per expense record (Deluge parity)" : ", plus rework cost"));

  drill("monthly.cost.warranty", "Complaint Cost — Under Warranty", R.SERVICE_REPORT, COLS.spareLine,
    function () { return VIEW.monthly.costByCategory.src.Warranty; },
    "Spare Replaced lines " + window + " with Nature = Warranty");
  drill("monthly.cost.pw", "Complaint Cost — Post Warranty", R.SERVICE_REPORT, COLS.spareLine,
    function () { return VIEW.monthly.costByCategory.src.PW; },
    "Spare Replaced lines " + window + " with Nature = PW");
  drill("monthly.cost.amc", "Complaint Cost — AMC", R.SERVICE_REPORT, COLS.spareLine,
    function () { return VIEW.monthly.costByCategory.src.AMC; },
    "Spare Replaced lines " + window + " with Nature = AMC");

  v.repeatTrend.forEach(function (m, i) {
    drill("monthly.trend." + i, "Repeat Calls — " + m.month, R.SERVICE_CALL_LOG, COLS.callLog,
      function () { return VIEW.monthly.repeatTrend[i]._rows; },
      "Non-pending calls in " + m.month + " for customers with more than one call that month");
  });

  drill("monthly.satisfaction", "Customer Satisfaction Reviews", R.SERVICE_FEEDBACK, COLS.feedback,
    function () { return VIEW.monthly.satisfaction.src; },
    "Feedback rated 1-5 in " + today.getFullYear());

  v.satisfaction.months.forEach(function (m, i) {
    drill("monthly.sat." + i, "Feedback — " + m.name + " " + today.getFullYear(), R.SERVICE_FEEDBACK, COLS.feedback,
      function () { return VIEW.monthly.satisfaction.months[i]._rows; }, "Ratings 1-5 in " + m.name);
  });

  drill("monthly.complaints", "Recent Complaints", R.SERVICE_FEEDBACK, COLS.feedback,
    function () { return VIEW.monthly.complaints.src; },
    "Feedback on or after " + fmtDateMon(startOfMonth(today)) + " rated 3 or lower");

  drill("monthly.calibration", "Calibration / Maintenance Records", R.INTERNAL_CALIBRATION, COLS.calibration,
    function () { return VIEW.monthly.calibration.map(function (c) { return c._record; }); },
    "All Internal Calibration records");
}

/* ================================================================
   6. RENDER
   The original markup and class names, so styles.css applies unchanged.
   Every count is wrapped with data-drill so AK.autoBind() makes it clickable.
   ================================================================ */

function starText(value) {
  var s = "";
  for (var i = 1; i <= 5; i++) s += i <= value ? "★" : "☆";
  return s;
}

/* ---------- CHART RENDERING (ApexCharts) ----------
   AK.mountChart()/AK.chartColors come from the shared kit so every
   dashboard's charts share one palette and one mount/replace helper. */
var mountChart = AK.mountChart;
var CHART_COLORS = AK.chartColors;

/* ---------- TAB 1: TODAY ---------- */

function renderToday(view, today) {
  var tiles = view.tiles, executives = view.executives, invoiceTrend = view.invoiceTrend;
  var repeatReasons = view.repeatReasons, feedbackTrend = view.feedbackTrend;

  var CIRC = 502.65; // 2 * PI * r (r = 80)
  var noReasons = !repeatReasons.totalRepeatCalls;
  var kPct = noReasons ? 0 : repeatReasons.lackOfKnowledge;
  var pPct = noReasons ? 0 : repeatReasons.partsUnavailability;
  var wPct = noReasons ? 0 : repeatReasons.powerIssue;
  var kLen = (kPct / 100) * CIRC, pLen = (pPct / 100) * CIRC, wLen = (wPct / 100) * CIRC;

  var tileList = [
    ["Total Calls Logged Today", AK.int(tiles.total_calls_today), false, "today.totalCalls"],
    ["Service Executives Active Today", AK.int(tiles.executives_act_today), false, "today.executives"],
    ["Service Reports Submitted", AK.int(tiles.service_reports_submitted_count), false, "today.reports"],
    ["Quotations Sent Today", AK.int(tiles.quot_sent_today), false, "today.quotations"],
    ["Customer Feedbacks Collected", AK.int(tiles.cust_feedback_rec), false, "today.feedback"],
    ["Pending Calls > 48 Hrs", AK.int(tiles.pending_calls), true, "today.pendingCalls"],
    ["Customer Regret Cases", AK.int(tiles.customer_regret_cases_count), true, "today.regret"],
    ["Repeat Calls Logged", AK.int(tiles.repeated_calls_count), false, "today.repeatCalls"],
    ["Invoices Generated Today", AK.int(tiles.invoices_gen_today), false, "today.invoices"],
    ["Invoice Amounts (₹)", AK.money(tiles.total_invoiced_amt_today), false, "today.invoiceAmount"]
  ];

  var invoiceColumns = [
    ["AMC", invoiceTrend.amc_height, invoiceTrend.amc_amt, "today.trend.amc"],
    ["Install", invoiceTrend.install_height, invoiceTrend.installtion_amt, "today.trend.install"],
    ["Repair", invoiceTrend.repair_height, invoiceTrend.repair_amt, "today.trend.repair"],
    ["Service", invoiceTrend.service_height, invoiceTrend.service_amt, "today.trend.service"],
    ["Spares", invoiceTrend.spares_height, invoiceTrend.spares_amt, "today.trend.spares"]
  ];

  var legendRows = [
    ["#3b82f6", "Lack of Knowledge", kPct, "today.reason.knowledge"],
    ["#16a34a", "Parts Unavailability", pPct, "today.reason.parts"],
    ["#f59e0b", "Power Issue", wPct, "today.reason.power"]
  ];

  var html = "";

  html += "<header><h1>TAB 1 — TODAY'S</h1><div class='date'>Date: " + esc(fmtDate(today)) + "</div></header>";
  html += "<main class='container'>";

  /* COUNT TILES */
  html += "<section class='tiles'>" + tileList.map(function (t) {
    return "<div class='tile'><div class='label'>" + esc(t[0]) + "</div>" +
      "<div class='" + (t[2] ? "value red" : "value") + "' data-drill='" + t[3] + "'>" + esc(t[1]) + "</div></div>";
  }).join("") + "</section>";

  html += "<div style='display:flex;flex-direction:column;gap:14px'>";

  /* EXECUTIVE BAR CHART */
  html += "<div class='card'><h3>Service Executive Performance (Today)</h3>" +
    "<div class='legend'><span><span class='dot assigned-dot'></span>Assigned</span>" +
    "<span><span class='dot closed-dot'></span>Closed</span></div>";

  html += executives.length
    ? "<div class='bar-chart-row'>" + executives.map(function (e, i) {
      return "<div class='bar-group'><div class='bars'>" +
        "<div class='bar-container'><div class='bar-number' data-drill='today.exec." + i + ".a'>" +
        AK.int(e.assignedToday) + "</div>" +
        "<div class='bar assigned' style='height:" + e.assignedHeight + "px'></div></div>" +
        "<div class='bar-container'><div class='bar-number' data-drill='today.exec." + i + ".c'>" +
        AK.int(e.completedToday) + "</div>" +
        "<div class='bar closed' style='height:" + e.completedHeight + "px'></div></div>" +
        "</div><div class='exec-label'>" + esc(e.Engineer_Name) + "</div></div>";
    }).join("") + "</div>"
    : AK.emptyPanel("No service engineer has calls attended today. Check that Employees have Department_Role set to the service role.", 200);

  html += "</div>";

  /* INVOICE TREND */
  html += "<div class='card'><h3>Invoice Amount Trend (Today)</h3><div class='invoice-chart'>" +
    invoiceColumns.map(function (c) {
      return "<div class='col'><div class='col-bar' style='--h:" + c[1] + "px'></div>" +
        "<div class='col-label'>" + esc(c[0]) + "</div>" +
        "<div class='col-value' data-drill='" + c[3] + "'>" + esc(AK.money(c[2])) + "</div></div>";
    }).join("") + "</div></div>";

  /* PIE + GAUGE */
  html += "<div style='display:flex;gap:14px;margin:10px;flex-wrap:wrap'>";
  html += "<div class='card' style='flex:1;min-width:280px'><h3>Repeat Calls Reason Breakdown</h3>";

  if (noReasons) {
    html += AK.emptyPanel("No repeat calls have been logged today, so there is nothing to break down yet.", 220);
  } else {
    html += "<div data-drill='today.reason.all'><div id='today-reason-donut'></div></div>";
  }

  html += "<div style='margin-top:10px;display:flex;flex-direction:column;gap:10px;align-items:center'>" +
    legendRows.map(function (l) {
      return "<div style='display:flex;align-items:center;gap:8px'>" +
        "<span style='width:14px;height:14px;border-radius:50%;background:" + l[0] + ";display:inline-block'></span>" +
        "<span style='font-size:14px;color:#555' data-drill='" + l[3] + "'>" +
        esc(l[1]) + ": " + AK.pct(l[2]) + "</span></div>";
    }).join("") + "</div></div>";

  /* GAUGE */
  html += "<div class='card' style='flex:1;min-width:280px;display:flex;flex-direction:column;align-items:center'>" +
    "<h3 style='align-self:flex-start' data-drill='today.feedbackTrend'>Service Feedback Trend (Avg: " +
    AK.dec(feedbackTrend.average_rating) + "/5)</h3>" +
    "<div id='today-feedback-gauge'></div></div>";

  html += "</div></div></main>";
  return html;
}

/** Mounts the ApexCharts pieces of the Today tab. Call after renderToday's HTML is in the DOM. */
function mountTodayCharts(view) {
  var repeatReasons = view.repeatReasons, feedbackTrend = view.feedbackTrend;

  if (repeatReasons.totalRepeatCalls) {
    mountChart("today-reason-donut", {
      chart: { type: "donut", height: 240, fontFamily: "Poppins, sans-serif" },
      series: [repeatReasons.lackOfKnowledge, repeatReasons.partsUnavailability, repeatReasons.powerIssue],
      labels: ["Lack of Knowledge", "Parts Unavailability", "Power Issue"],
      colors: AK.categoricalColors(3),
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ["#fff"] },
      tooltip: { y: { formatter: function (v) { return AK.pct(v); } } },
      plotOptions: {
        pie: {
          donut: {
            size: "62%",
            labels: {
              show: true,
              total: {
                show: true, label: "Total Calls",
                formatter: function () { return AK.int(repeatReasons.totalRepeatCalls); }
              }
            }
          }
        }
      }
    });
  }

  mountChart("today-feedback-gauge", {
    chart: { type: "radialBar", height: 220, fontFamily: "Poppins, sans-serif" },
    series: [Math.round(feedbackTrend.percentage)],
    labels: ["Average"],
    colors: [CHART_COLORS.blue],
    plotOptions: {
      radialBar: {
        hollow: { size: "58%" },
        startAngle: -90, endAngle: 90,
        track: { background: "#e5e7eb" },
        dataLabels: {
          name: { fontSize: "12px", color: "#6b7280", offsetY: -4 },
          value: {
            fontSize: "24px", fontWeight: 700, color: "#1f2937", offsetY: 4,
            formatter: function (v) { return AK.pct(v); }
          }
        }
      }
    }
  });
}

/* ---------- TAB 2: WEEKLY ---------- */

function renderWeekly(view) {
  var engineer = view.engineer, aging = view.aging, amc = view.amc;
  var redTag = view.redTag, satisfaction = view.satisfaction, recentFeedbacks = view.recentFeedbacks;

  var kpis = [
    ["Avg Calls Attended per Engineer", AK.dec(engineer.average_calls_per_engineer_week), "weekly.avgCalls"],
    ["Average Response Time (hrs)", AK.dec(view.avgResponseTime.value), "weekly.responseTime"],
    ["Repeat Call %", AK.pct(view.repeatCallPercent.percent), "weekly.repeatPct"],
    ["Customer Regret %", AK.pct(view.regretPercent.percent, 2), "weekly.regretPct"],
    ["Google Review Collection %", AK.int(view.googleReviews.count) + "%", "weekly.google"],
    ["AMC Leads Generated", AK.int(view.amcLeads.count), "weekly.amcLeads"],
    ["Pending Replacements", AK.int(view.pendingReplacements.count), "weekly.replacements"],
    ["Standby Units Pending Collection", AK.int(view.standbyPending.count), "weekly.standby"]
  ];

  // Red tag bars: max 200px, at least 30px when there is a value.
  var redTagBars = [redTag.week1, redTag.week2, redTag.week3, redTag.week4].map(function (count) {
    var h = redTag.maxValue > 0 ? (count * 200) / redTag.maxValue : 0;
    if (count > 0 && h < 30) h = 30;
    return { count: count, height: h };
  });

  var html = "<div class='weekly-wrap'>";
  html += "<h1 class='weekly-heading-card'>Weekly Performance Dashboard</h1>";

  html += "<div class='weekly-kpi-grid'>" + kpis.map(function (k) {
    return "<div class='weekly-kpi-card'><div class='weekly-kpi-title'>" + esc(k[0]) + "</div>" +
      "<div class='weekly-kpi-value' data-drill='" + k[2] + "'>" + esc(k[1]) + "</div></div>";
  }).join("") + "</div>";

  /* Engineer-wise stacked bars */
  html += "<div class='weekly-chart-card'><div class='weekly-chart-title'>Engineer-wise Call Volume</div>" +
    "<div class='weekly-legend'>" +
    "<div class='weekly-legend-item'><div class='weekly-legend-color completed'></div> Completed</div>" +
    "<div class='weekly-legend-item'><div class='weekly-legend-color pending'></div> Pending</div></div>";

  html += engineer.per_engineer.length
    ? "<div class='weekly-bar-chart'>" + engineer.per_engineer.map(function (e, i) {
      return "<div class='weekly-bar-group'><div class='weekly-bar'>" +
        "<div class='weekly-segment completed' style='height:" + e.completed_height + "%' data-drill='weekly.eng." + i + ".c'>" +
        AK.int(e.calls_completed) + "</div>" +
        "<div class='weekly-segment pending' style='height:" + e.pending_height + "%' data-drill='weekly.eng." + i + ".p'>" +
        AK.int(e.calls_pending) + "</div></div>" +
        "<div class='weekly-value' data-drill='weekly.eng." + i + ".t'>Total: " + AK.int(e.total_calls_this_week) + "</div>" +
        "<div class='weekly-label'>" + esc(e.engineer_name) + "</div></div>";
    }).join("") + "</div>"
    : AK.emptyPanel("No service engineers found. Check that Employees have Department_Role set to the service role.", 220);

  html += "</div>";

  /* Customer satisfaction */
  html += "<div class='weekly-chart-card'><div class='weekly-chart-title'>Customer Satisfaction</div>" +
    "<div class='weekly-satisfaction-grid'>";

  html += "<div class='weekly-rating-section'><div class='weekly-rating-display'>" +
    "<div class='weekly-rating-score'>" + AK.dec(view.overallAvg) + "</div><div class='weekly-stars-container'>";
  for (var n = 1; n <= 5; n++) {
    var filled = n <= view.fullStars || (n === view.fullStars + 1 && view.hasHalfStar);
    html += "<span class='" + (filled ? "weekly-star filled" : "weekly-star empty") + "'>★</span>";
  }
  html += "</div><div class='weekly-rating-label'>Average Customer Rating</div></div>";

  html += "<div class='weekly-trend-title'>Weekly Rating Trend</div><div class='weekly-trend'>";
  html += satisfaction.length
    ? satisfaction.map(function (w, i) {
      return "<div class='weekly-week-bar-group'>" +
        "<div class='weekly-week-bar' data-rating='" + AK.dec(w.average_rating) + "' data-drill='weekly.sat." + i + "' " +
        "style='height:" + w.bar_height + "%;animation-delay:" + (i * 0.2) + "s'></div>" +
        "<div class='weekly-week-label'>" + esc(w.week_label) + "</div></div>";
    }).join("")
    : "<div style='text-align:center;padding:20px;color:#6b7280'>No records found</div>";
  html += "</div></div>";

  html += "<div class='weekly-feedback-section'><h3 class='weekly-feedback-title'>Recent Feedbacks</h3>" +
    "<div class='weekly-complaints-list'>";
  html += recentFeedbacks.length
    ? recentFeedbacks.map(function (f) {
      var cls = f.rating >= 4 ? "positive" : f.rating <= 2 ? "negative" : "neutral";
      return "<div class='weekly-feedback-item " + cls + "'>" +
        "<div class='weekly-feedback-date'>" + esc(fmtDateMon(f.created_date)) + "</div>" +
        "<div class='weekly-feedback-text'>" + esc(f.comments) + " – Customer: " + esc(f.customer_name) + "</div>" +
        "<div class='weekly-feedback-rating'>" + starText(f.rating) +
        " <span class='weekly-rating-number'>" + AK.dec(f.rating) + "</span></div></div>";
    }).join("")
    : "<div style='text-align:center;padding:20px;color:#6b7280'>No records found</div>";
  html += "</div></div></div></div>";

  /* Pending call ageing */
  html += "<div class='weekly-chart-card'><div class='weekly-chart-title'>Pending Call Ageing</div>" +
    "<div class='weekly-legend'>" +
    "<div class='weekly-legend-item'><div class='weekly-legend-color' style='background:#3b82f6'></div> 0-2 Days</div>" +
    "<div class='weekly-legend-item'><div class='weekly-legend-color' style='background:#10b981'></div> 3-5 Days</div>" +
    "<div class='weekly-legend-item'><div class='weekly-legend-color' style='background:#f59e0b'></div> &gt;5 Days</div></div>";

  html += aging.length
    ? "<div class='weekly-bar-chart'>" + aging.map(function (pc, i) {
      var d02 = pc["0-2_Days"], d35 = pc["3-5_Days"], d5 = pc.above_5_Days;
      var total = d02 + d35 + d5;
      var share = function (x) { return (total > 0 ? (x * 100) / total : 0) || 2; };
      return "<div class='weekly-bar-group'><div class='weekly-bar'>" +
        "<div class='weekly-segment' style='height:" + share(d02) + "%;background:#3b82f6' data-drill='weekly.age." + i + ".a'>" + AK.int(d02) + "</div>" +
        "<div class='weekly-segment' style='height:" + share(d35) + "%;background:#10b981' data-drill='weekly.age." + i + ".b'>" + AK.int(d35) + "</div>" +
        "<div class='weekly-segment' style='height:" + share(d5) + "%;background:#f59e0b' data-drill='weekly.age." + i + ".c'>" + AK.int(d5) + "</div></div>" +
        "<div class='weekly-value'>Total: " + AK.int(total) + "</div>" +
        "<div class='weekly-label'>Week " + (i + 1) + "</div></div>";
    }).join("") + "</div>"
    : AK.emptyPanel("No pending calls in this month's weekly windows.", 220);

  html += "</div>";

  /* AMC donut */
  html += "<div class='weekly-chart-card' style='text-align:center'>" +
    "<div class='weekly-chart-title'>AMC Offer vs Closed – Conversion Chart</div>";
  if (amc.total > 0) {
    html += "<div data-drill='weekly.amc.offered' style='max-width:240px;margin:10px auto'>" +
      "<div id='weekly-amc-donut'></div></div>" +
      "<div class='weekly-legend' style='justify-content:center;display:flex;gap:20px;margin-top:15px'>" +
      "<div class='weekly-legend-item' style='display:flex;align-items:center;gap:6px'>" +
      "<div class='weekly-legend-color' style='width:15px;height:15px;background:#10b981'></div>" +
      "<span data-drill='weekly.amc.closed'>Closed - " + AK.int(amc.closed) + " (" + AK.pct(amc.closed_percent) + ")</span></div>" +
      "<div class='weekly-legend-item' style='display:flex;align-items:center;gap:6px'>" +
      "<div class='weekly-legend-color' style='width:15px;height:15px;background:#3b82f6'></div>" +
      "<span data-drill='weekly.amc.pending'>Pending - " + AK.int(amc.pending) + " (" + AK.pct(amc.pending_percent) + ")</span></div></div>";
  } else {
    html += AK.emptyPanel("No AMC quotations were raised this week.", 220);
  }
  html += "</div>";

  /* Red tag */
  html += "<div class='weekly-chart-card'><div class='weekly-chart-title'>Red Tag Item Trend (Service Dept)</div>" +
    "<div class='weekly-legend'><div class='weekly-legend-item'>" +
    "<div class='weekly-legend-color' style='background:#ef4444'></div> Red Tag Items</div></div>" +
    "<div class='weekly-bar-chart' style='height:200px;gap:20px;border-left:2px solid #444;border-bottom:2px solid #444;" +
    "padding-bottom:10px;justify-content:space-around'>" +
    redTagBars.map(function (b, i) {
      return "<div class='weekly-bar-group'><div class='weekly-bar' style='height:" + b.height + "px'>" +
        "<span class='weekly-segment' style='color:#fff;font-size:12px;font-weight:600' data-drill='weekly.redtag." + i + "'>" +
        AK.int(b.count) + "</span></div><div class='weekly-label'>Week " + (i + 1) + "</div></div>";
    }).join("") + "</div></div>";

  html += "</div>";
  return html;
}

/** Mounts the ApexCharts pieces of the Weekly tab. Call after renderWeekly's HTML is in the DOM. */
function mountWeeklyCharts(view) {
  var amc = view.amc;
  if (amc.total > 0) {
    mountChart("weekly-amc-donut", {
      chart: { type: "donut", height: 220, fontFamily: "Poppins, sans-serif" },
      series: [amc.closed, amc.pending],
      labels: ["Closed", "Pending"],
      colors: AK.categoricalColors(2),
      legend: { show: false },
      dataLabels: { enabled: true, formatter: function (v) { return v.toFixed(0) + "%"; } },
      stroke: { width: 2, colors: ["#fff"] },
      tooltip: { y: { formatter: function (v) { return AK.int(v); } } },
      plotOptions: {
        pie: {
          donut: {
            size: "60%",
            labels: {
              show: true,
              total: { show: true, label: "Total", formatter: function () { return AK.int(amc.total); } }
            }
          }
        }
      }
    });
  }
}

/* ---------- TAB 3: MONTHLY ---------- */

var BADGE_COLORS = {
  green: "background-color:#d4edda;color:#155724",
  orange: "background-color:#fff3cd;color:#856404",
  red: "background-color:#f8d7da;color:#721c24",
  blue: "background-color:#d1ecf1;color:#0c5460"
};
var BADGE_BASE = "display:inline-block;padding:5px 12px;border-radius:12px;font-size:12px;font-weight:600;";


function renderMonthly(view, today) {
  var callLogs = view.callLogs, expense = view.expense, costByCategory = view.costByCategory;
  var positiveFeedback = view.positiveFeedback, satisfaction = view.satisfaction;
  var complaints = view.complaints.list, calibration = view.calibration;

  var overallAvg = satisfaction.overall_average;
  var fullStars = Math.floor(overallAvg);
  var hasHalf = overallAvg - fullStars >= 0.5;
  var starDisplay = "";
  for (var i = 1; i <= 5; i++) {
    starDisplay += (i <= fullStars || (i === fullStars + 1 && hasHalf)) ? "★" : "☆";
  }

  var costBars = [
    ["Under Warranty", costByCategory.w_percentage, "", "monthly.cost.warranty"],
    ["Post Warranty", costByCategory.pw_percentage, " post3", "monthly.cost.pw"],
    ["AMC", costByCategory.amc_percentage, " amc3", "monthly.cost.amc"]
  ];

  var html = "<div class='dashboard-container3'><div class='page-title3'>Monthly Insights</div>";

  /* TOP SECTION */
  html += "<div class='top-section3'>";
  html += "<div class='cards3'><h3>Total Calls Logged (Month)</h3><div class='tiles3'>" +
    "<div class='tile3'><div class='label3'>Warranty</div>" +
    "<div class='value3' data-drill='monthly.warranty'>" + AK.int(callLogs.warranty_count) + "</div></div>" +
    "<div class='tile3'><div class='label3'>Post Warranty</div>" +
    "<div class='value3' data-drill='monthly.pw'>" + AK.int(callLogs.post_warranty) + "</div></div>" +
    "<div class='tile3'><div class='label3'>AMC</div>" +
    "<div class='value3' data-drill='monthly.amc'>" + AK.int(callLogs.amc_count) + "</div></div></div></div>";

  html += "<div class='cards3'><h3>Expenses for Complaints</h3><div class='tiles3'>" +
    "<div class='tile3'><div class='label3'>Warranty Expense</div>" +
    "<div class='value3'>" + AK.money(callLogs.warranty_amount) + "</div></div>" +
    "<div class='tile3'><div class='label3'>Post Warranty</div>" +
    "<div class='value3'>" + AK.money(callLogs.post_warranty_amount) + "</div></div></div></div>";
  html += "</div>";

  /* SERVICE INSIGHTS */
  html += "<div class='cards3'><h3>Service Insights</h3><div class='service-grid3'>" +
    "<div class='tile3'><div class='label3'>Indirect Expenses</div>" +
    "<div class='value3' data-drill='monthly.indirect'>" + AK.money(view.indirectExpense.value) + "</div></div>" +
    "<div class='tile3'><div class='label3'>Repeat Call Analysis</div>" +
    "<div class='value3' data-drill='monthly.repeatCalls'>" + AK.int(view.repeatCalls.repead_calls) + " calls</div></div>" +
    "<div class='tile3'><div class='label3'>Stock Unavailability Delays</div>" +
    "<div class='value3' data-drill='monthly.stockDelays'>" + AK.int(view.stockDelays.count) + " cases</div></div>" +
    "<div class='tile3'><div class='label3'>Training Hours Conducted</div>" +
    "<div class='value3' data-drill='monthly.training'>" + AK.dec(view.trainingHours.value) + " hrs</div></div>" +
    "<div class='tile3'><div class='label3'>Tool &amp; Vehicle Inspections Completed</div>" +
    "<div class='value3' data-drill='monthly.compliance'>" + AK.pct(view.compliance.compliance_percentage, 2) + "</div></div>" +
    "<div class='tile3'><div class='label3'>Customer Feedback Summary</div>" +
    "<div class='value3' data-drill='monthly.feedbackPositive'>" + AK.dec(positiveFeedback.avg_feedback) +
    " ⭐ | " + AK.pct(positiveFeedback.positive_feedback_percentage) + " Positive</div></div></div></div>";

  /* PIE + BAR */
  html += "<div class='flex-chart-container3'>";
  html += "<div class='card3 pie-chart-container3'><h3>Expense Breakdown</h3>";
  if ((expense.direct_percent + expense.indirect_percent) > 0) {
    html += "<div id='monthly-expense-pie' style='max-width:220px;margin:10px auto'></div>" +
      "<div class='legend3'>" +
      "<span data-drill='monthly.expense.direct'><span class='dot3 direct-dot3'></span>Direct - " +
      AK.money(expense.direct_expense) + " (" + AK.pct(expense.direct_percent) + ")</span>" +
      "<span data-drill='monthly.expense.indirect'><span class='dot3 indirect-dot3'></span>Indirect - " +
      AK.money(expense.indirect_expense) + " (" + AK.pct(expense.indirect_percent) + ")</span></div>";
  } else {
    html += AK.emptyPanel("No expense entries recorded this month.", 200);
  }
  html += "</div>";

  if (costByCategory.has_data) {
    html += "<div class='card3 bar-chart-container3'><h3>Complaint Cost by Category</h3>" +
      costBars.map(function (b) {
        return "<div class='bar3'><div class='bar-label3'>" + esc(b[0]) + "</div>" +
          "<div class='bar-inner3'><div class='bar-fill3" + b[2] + "' style='--bar-width:" + b[1] + "%'>" +
          "<div class='bar-value3' data-drill='" + b[3] + "'>" + AK.pct(b[1]) + "</div></div></div></div>";
      }).join("") + "</div>";
  } else {
    html += "<div class='card3 bar-chart-container3'><h3>Complaint Cost by Category</h3>" +
      AK.emptyPanel("No Spare Replaced lines were logged this month, so there is no complaint cost to split by category.", 220) +
      "</div>";
  }
  html += "</div>";

  /* TREND + GAUGE */
  html += "<div class='chart-gauge-wrapper3'>";
  html += "<div class='card3'><h3>Repeat Call Trend – Month-over-Month</h3>";
  html += view.repeatTrend.length
    ? "<div id='monthly-trend-line'></div>"
    : AK.emptyPanel("No repeat-call history yet for this trend.", 220);
  html += "<div class='legend3'><div class='legend-item3'>" +
    "<div class='legend-color3' style='background:#3b82f6'></div><span>Repeat Calls</span></div></div></div>";

  html += "<div class='gauge-wrapper3' style='display:flex;flex-direction:column;align-items:center'>" +
    "<div style='font-weight:600;font-size:14px;margin-bottom:6px' data-drill='monthly.feedbackAll'>% Positive Feedback</div>" +
    "<div id='monthly-feedback-gauge'></div></div>";
  html += "</div>";

  /* CUSTOMER SATISFACTION */
  html += "<div class='benchmarks-section3 animate-in3'><div class='section-header3'>" +
    "<div class='section-title3'>Customer Satisfaction (<span data-drill='monthly.satisfaction'>" +
    AK.int(satisfaction.overall_count) + " reviews</span>)</div></div>" +
    "<div class='satisfaction-grid3'><div>" +
    "<div class='rating-display3'><div class='rating-score3'>" + AK.dec(overallAvg) + "</div>" +
    "<div class='rating-stars3'>" + starDisplay + "</div>" +
    "<div class='rating-label3'>Average Customer Rating</div></div>" +
    "<div class='bar-chart3' style='height:180px;margin-top:20px'>" +
    satisfaction.months.map(function (m, idx) {
      var heightPercent = 0;
      if (m.average > 0) {
        heightPercent = (m.average / 5.0) * 100;
        if (heightPercent < 5) heightPercent = 5;
      }
      var style = m.count > 0
        ? "height:" + heightPercent + "%;background:linear-gradient(180deg,#fbbf24 0%,#f59e0b 100%)"
        : "height:5%;background:#e5e7eb";
      return "<div class='bar-group3'><div class='bars3'>" +
        "<div class='bar3' style='" + style + "' data-drill='monthly.sat." + idx + "' " +
        "title='" + esc(m.name + ": " + AK.dec(m.average) + " avg over " + AK.int(m.count) + " reviews") + "'></div></div>" +
        "<div class='bar-label3'>" + esc(m.name) + "</div></div>";
    }).join("") + "</div></div>";

  html += "<div><h3 style='font-size:16px;font-weight:600;margin-bottom:15px;color:#1f2937'>Recent Complaints</h3>" +
    "<div class='complaints-list3'>";
  html += complaints.length
    ? complaints.map(function (c) {
      return "<div class='complaint-item3'><div class='complaint-date3'>" + esc(fmtDate(c.feedback_date)) + "</div>" +
        "<div class='complaint-text3'>" + esc(c.customer_feedback || "(no comment)") +
        " - Customer: " + esc(c.customer_name) + "</div></div>";
    }).join("")
    : AK.emptyPanel("No feedback rated 3 or below was received this month.", 160);
  html += "</div></div></div></div>";

  /* CALIBRATION TABLE */
  html += "<div class='card3'><h3>Calibration / Maintenance Reports " +
    "<span style='font-weight:400;font-size:13px;color:#6b7280' data-drill='monthly.calibration'>(" +
    AK.int(calibration.length) + " records)</span></h3>" +
    "<table class='table3' style='width:100%;border-collapse:collapse;font-size:14px'><thead><tr>" +
    "<th>Equipment</th><th>Report Type</th><th>Last Service Date</th><th>Next Service Date</th>" +
    "<th>Service Person</th><th>Status</th></tr></thead><tbody>";
  html += calibration.length
    ? calibration.map(function (r) {
      var rowStyle = r.is_due_this_month ? " style='background-color:#fffacd'"
        : r.is_overdue ? " style='background-color:#ffe6e6'" : "";
      return "<tr" + rowStyle + "><td>" + esc(r.equipment) + "</td><td>" + esc(r.report_type) + "</td>" +
        "<td>" + esc(r.last_service_date) + "</td><td>" + esc(r.next_service_date) + "</td>" +
        "<td>" + esc(r.service_person) + "</td><td style='text-align:center'>" +
        "<span style='" + BADGE_BASE + BADGE_COLORS[r.status_color] + "'>" + esc(r.status) + "</span></td></tr>";
    }).join("")
    : AK.emptyRow(6, "No calibration records found in " + R.INTERNAL_CALIBRATION + ".");
  html += "</tbody></table></div>";

  html += "</div>";
  return html;
}

/** Mounts the ApexCharts pieces of the Monthly tab. Call after renderMonthly's HTML is in the DOM. */
function mountMonthlyCharts(view) {
  var expense = view.expense, positiveFeedback = view.positiveFeedback, trend = view.repeatTrend;

  if ((expense.direct_percent + expense.indirect_percent) > 0) {
    mountChart("monthly-expense-pie", {
      chart: { type: "pie", height: 220, fontFamily: "Poppins, sans-serif" },
      series: [expense.direct_percent, expense.indirect_percent],
      labels: ["Direct", "Indirect"],
      colors: AK.categoricalColors(2),
      legend: { show: false },
      dataLabels: { enabled: true, formatter: function (v) { return v.toFixed(0) + "%"; } },
      tooltip: { y: { formatter: function (v) { return v.toFixed(1) + "%"; } } }
    });
  }

  if (trend.length) {
    mountChart("monthly-trend-line", {
      chart: {
        type: "line", height: 260, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
        events: {
          markerClick: function (ev, ctx, opts) { AK.openDrill("monthly.trend." + opts.dataPointIndex); },
          dataPointSelection: function (ev, ctx, opts) { AK.openDrill("monthly.trend." + opts.dataPointIndex); }
        }
      },
      series: [{ name: "Repeat Calls", data: trend.map(function (t) { return t.repeat_calls; }) }],
      xaxis: { categories: trend.map(function (t) { return t.month; }) },
      colors: [CHART_COLORS.blue],
      stroke: { curve: "smooth", width: 3 },
      markers: { size: 6, hover: { size: 8 } },
      dataLabels: { enabled: false },
      tooltip: { y: { formatter: function (v) { return AK.int(v) + " repeat calls"; } } },
      grid: { borderColor: "#e5e7eb" }
    });
  }

  mountChart("monthly-feedback-gauge", {
    chart: { type: "radialBar", height: 220, fontFamily: "Poppins, sans-serif" },
    series: [Math.round(positiveFeedback.positive_feedback_percentage)],
    labels: ["Feedback"],
    colors: [CHART_COLORS.blue],
    plotOptions: {
      radialBar: {
        hollow: { size: "58%" },
        startAngle: -90, endAngle: 90,
        track: { background: "#e5e7eb" },
        dataLabels: {
          name: { fontSize: "12px", color: "#6b7280", offsetY: -4 },
          value: {
            fontSize: "24px", fontWeight: 700, color: "#1f2937", offsetY: 4,
            formatter: function (v) { return AK.dec(v); }
          }
        }
      }
    }
  });
}

/* ================================================================
   7. MAIN — tabs and lazy per-tab loading
   ================================================================ */

(function main() {
  AK.init({ name: "servicePerformanceSummary" });

  var today = startOfDay(new Date());
  var D = {};
  var started = {};
  var loadErrors = [];

  var PANE = { today: "content1", weekly: "content2", monthly: "content3" };

  function paneHtml(stage, html) {
    var el = document.getElementById(PANE[stage]);
    if (!el) return;
    el.innerHTML = html;
    AK.autoBind(el);
  }

  function loading(stage, label) {
    paneHtml(stage, "<div class='widget-status'><div class='widget-spinner'></div>Loading " + esc(label) + " data&hellip;</div>");
  }

  function fatal(message) {
    document.getElementById("notice-container").innerHTML =
      "<div class='widget-status widget-error'>" + esc(message) + "</div>";
  }

  function showLoadWarnings() {
    if (!loadErrors.length) return;
    document.getElementById("notice-container").innerHTML =
      "<div class='warn-banner'><b>Some reports could not be loaded — the numbers below are incomplete</b><ul>" +
      loadErrors.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") +
      "</ul></div>";
  }

  /** Loads one tab's datasets, one request after another. */
  function startStage(stage) {
    if (started[stage]) return Promise.resolve();
    started[stage] = true;

    var keys = stageKeys(stage);
    var chain = Promise.resolve();

    keys.forEach(function (key) {
      chain = chain.then(function () {
        return loadDataset(key, today).then(function (records) {
          D[key] = records;
        }).catch(function (err) {
          D[key] = [];
          loadErrors.push(DATASETS[key].report + " – " + AK.describeError(err));
          console.error("[servicePerformanceSummary] dataset '" + key + "' failed:", err);
        });
      });
    });

    return chain.then(function () {
      showLoadWarnings();
      renderStage(stage);
    });
  }

  function renderStage(stage) {
    try {
      if (stage === "today") {
        VIEW.today = computeTodayView(D, today);
        defineTodayDrills(today);
        paneHtml("today", renderToday(VIEW.today, today));
        mountTodayCharts(VIEW.today);
      } else if (stage === "weekly") {
        VIEW.weekly = computeWeeklyView(D, today);
        defineWeeklyDrills(today);
        paneHtml("weekly", renderWeekly(VIEW.weekly));
        mountWeeklyCharts(VIEW.weekly);
      } else {
        VIEW.monthly = computeMonthlyView(D, today);
        defineMonthlyDrills(today);
        paneHtml("monthly", renderMonthly(VIEW.monthly, today));
        mountMonthlyCharts(VIEW.monthly);
      }
      if (CONFIG.DEBUG) summarize(stage);
    } catch (err) {
      console.error("[servicePerformanceSummary] render '" + stage + "' failed:", err);
      paneHtml(stage, "<div class='widget-status widget-error'>Could not render this tab: " +
        esc(AK.describeError(err)) + "<br><span style='font-size:12px;color:#6b7280'>" +
        "Full details are in the browser console.</span></div>");
    }
  }

  /**
   * Prints every headline value with its on-screen label, so the widget can be
   * checked value-by-value against the old dashboard.
   */
  function summarize(stage) {
    var rows = [];
    var add = function (label, value) { rows.push({ label: label, value: String(value) }); };
    var v;

    if (stage === "today") {
      v = VIEW.today;
      var t = v.tiles;
      add("Total Calls Logged Today", AK.int(t.total_calls_today));
      add("Service Executives Active Today", AK.int(t.executives_act_today));
      add("Service Reports Submitted", AK.int(t.service_reports_submitted_count));
      add("Quotations Sent Today", AK.int(t.quot_sent_today));
      add("Customer Feedbacks Collected", AK.int(t.cust_feedback_rec));
      add("Pending Calls > 48 Hrs", AK.int(t.pending_calls));
      add("Customer Regret Cases", AK.int(t.customer_regret_cases_count));
      add("Repeat Calls Logged", AK.int(t.repeated_calls_count));
      add("Invoices Generated Today", AK.int(t.invoices_gen_today));
      add("Invoice Amounts", AK.money(t.total_invoiced_amt_today));
      v.executives.forEach(function (e) {
        add("Executive " + e.Engineer_Name + ": assigned / closed", e.assignedToday + " / " + e.completedToday);
      });
      add("Invoice Trend: AMC", AK.money(v.invoiceTrend.amc_amt));
      add("Invoice Trend: Install", AK.money(v.invoiceTrend.installtion_amt));
      add("Invoice Trend: Repair", AK.money(v.invoiceTrend.repair_amt));
      add("Invoice Trend: Service", AK.money(v.invoiceTrend.service_amt));
      add("Invoice Trend: Spares", AK.money(v.invoiceTrend.spares_amt));
      add("Repeat Calls Reason: total", AK.int(v.repeatReasons.totalRepeatCalls));
      add("Feedback Trend: average", AK.dec(v.feedbackTrend.average_rating));
      add("Feedback Trend: percent", AK.pct(v.feedbackTrend.percentage));
    }

    if (stage === "weekly") {
      v = VIEW.weekly;
      add("Avg Calls Attended per Engineer", AK.dec(v.engineer.average_calls_per_engineer_week));
      add("Average Response Time (hrs)", v.avgResponseTime.value);
      add("Repeat Call %", AK.pct(v.repeatCallPercent.percent));
      add("Customer Regret %", AK.pct(v.regretPercent.percent, 2));
      add("Google Review Collection", AK.int(v.googleReviews.count));
      add("AMC Leads Generated", AK.int(v.amcLeads.count));
      add("Pending Replacements", AK.int(v.pendingReplacements.count));
      add("Standby Units Pending", AK.int(v.standbyPending.count));
      v.engineer.per_engineer.forEach(function (e) {
        add("Engineer " + e.engineer_name + ": total / completed / pending",
          e.total_calls_this_week + " / " + e.calls_completed + " / " + e.calls_pending);
      });
      add("Customer Satisfaction: average", AK.dec(v.overallAvg));
      v.aging.forEach(function (w, i) {
        add("Ageing Week " + (i + 1) + ": 0-2 / 3-5 / >5", w["0-2_Days"] + " / " + w["3-5_Days"] + " / " + w.above_5_Days);
      });
      add("AMC offered / closed", v.amc.total + " / " + v.amc.closed);
      add("Red Tag W1-W4", [v.redTag.week1, v.redTag.week2, v.redTag.week3, v.redTag.week4].join(" / "));
    }

    if (stage === "monthly") {
      v = VIEW.monthly;
      add("Calls: Warranty / PW / AMC",
        v.callLogs.warranty_count + " / " + v.callLogs.post_warranty + " / " + v.callLogs.amc_count);
      add("Indirect Expenses", AK.money(v.indirectExpense.value));
      add("Repeat Call Analysis", AK.int(v.repeatCalls.repead_calls));
      add("Stock Unavailability Delays", AK.int(v.stockDelays.count));
      add("Training Hours", AK.dec(v.trainingHours.value));
      add("Tool & Vehicle Compliance", AK.pct(v.compliance.compliance_percentage, 2));
      add("Feedback average / % positive",
        AK.dec(v.positiveFeedback.avg_feedback) + " / " + AK.pct(v.positiveFeedback.positive_feedback_percentage));
      add("Expense Direct", AK.money(v.expense.direct_expense) + " (" + AK.pct(v.expense.direct_percent) + ")");
      add("Expense Indirect", AK.money(v.expense.indirect_expense) + " (" + AK.pct(v.expense.indirect_percent) + ")");
      add("Complaint cost W / PW / AMC",
        AK.pct(v.costByCategory.w_percentage) + " / " + AK.pct(v.costByCategory.pw_percentage) +
        " / " + AK.pct(v.costByCategory.amc_percentage));
      v.repeatTrend.forEach(function (m) { add("Repeat Call Trend " + m.month, AK.int(m.repeat_calls)); });
      add("Satisfaction average / reviews",
        AK.dec(v.satisfaction.overall_average) + " / " + AK.int(v.satisfaction.overall_count));
      add("Recent Complaints rows", AK.int(v.complaints.list.length));
      add("Calibration rows", AK.int(v.calibration.length));
    }

    console.log("%c[servicePerformanceSummary] " + stage + " values — compare these against the Deluge dashboard",
      "color:#2563eb;font-weight:bold");
    console.table(rows);
  }

  /* ---- tabs ---- */
  function wireTabs() {
    var map = { tab1: "today", tab2: "weekly", tab3: "monthly" };
    Object.keys(map).forEach(function (inputId) {
      var el = document.getElementById(inputId);
      if (!el) return;
      el.addEventListener("change", function () {
        if (!el.checked) return;
        var stage = map[inputId];
        if (started[stage]) return;
        loading(stage, stage);
        startStage(stage);
      });
    });
  }

  /* ---- boot ---- */
  if (!window.ZOHO || !window.ZOHO.CREATOR || !window.ZOHO.CREATOR.DATA ||
    typeof window.ZOHO.CREATOR.DATA.getRecords !== "function") {
    fatal("Zoho Creator Widget SDK is not available. The widget must run inside Creator " +
      "(or be served over https with the SDK script reachable).");
    return;
  }

  wireTabs();

  // v2 JS API needs no ZOHO.CREATOR.init() call.
  Promise.resolve()
    .then(function () {
      loading("today", "today's");
      return startStage("today");
    })
    .then(function () {
      console.log("%c[servicePerformanceSummary] today tab ready. " +
        "Click any count to see the records behind it.", "color:#15803d;font-weight:bold");
      AK.report();

      // One-time field discovery for every report across all three tabs (not just the
      // ones the Today tab has loaded) — paste the console output back to fix any
      // remaining guessed field name in one pass. Safe to delete once every field in
      // CONFIG.REPORTS / the per-dataset `fields` lists is confirmed against real data.
      AK.discoverAllFields(CONFIG.REPORTS);
    })
    .catch(function (err) {
      console.error("[servicePerformanceSummary] fatal:", err);
      fatal("Dashboard failed to load: " + AK.describeError(err));
    });
})();
