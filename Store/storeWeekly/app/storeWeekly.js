"use strict";

/* ================================================================
   STORE WEEKLY DASHBOARD — WIDGET VERSION
   All calculations that used to live in the Deluge custom functions
   (storeWeekly.dailyMaterialFlow, indirectExpenseBreakdown,
   itemsIssuedVsReturned, rejectedItemsDaily, weeklyKPI) now happen
   here in JS, on the raw records pulled straight from the reports.
   Only 4 Zoho Creator calls are made, once, on load.
   ================================================================ */

/* ----------------------------------------------------------------
   0. CONFIG — adjust these report/field names to match your app
   ---------------------------------------------------------------- */
const CFG = {
  reports: {
    materialRequisition: "All_Material_Requisitions1", // report on Material_Requisition1 form
    product: "All_Product",                             // report on Product form
    rework: "All_Rework_Registers",                      // report on Rework_Register form
    rejection: "Rejection_Replacement_Register_Format"    // report on Rejection_And_Replacement_Register form
  },
  fields: {
    matReq: {
      date: "Date_field",
      modifiedTime: "Modified_Time",
      issuedBy: "Issued_by1",
      department: "Department",
      subform: "Item_Details",
      qty: "Quantity",
      returnedQty: "Returned_Item_Qty",
      prevReturnedQty: "Previous_Returned_Qty"
    },
    product: {
      availableStock: "Available_Stock",
      minStock: "Minimum_Stock_Level",
      modifiedTime: "Modified_Time",
      redTagDate: "Red_Tagged_Date",
      isRedTag: "Is_Red_Tag_Material",
      price: "Price"
    },
    rework: {
      date: "Date_field",
      totalExpense: "Total_Expence"
    },
    rejection: {
      date: "Date_field",
      department: "Department",
      defectiveProduct: "Defective_Product",
      qty: "Qty",
      status: "Status"
    }
  },
  maxRecords: 1000
};

// Explicit field list per report (field_config: "custom"). This guarantees
// fields that exist on the form but aren't part of a report's detail/quick
// view layout — e.g. Modified_Time, Red_Tagged_Date — still come back.
// field_config: "all" silently drops any such field with no error, which is
// why stock-out / red-tag numbers were showing as 0.
CFG.customFields = {
  materialRequisition: [
    CFG.fields.matReq.date,
    CFG.fields.matReq.modifiedTime,
    CFG.fields.matReq.issuedBy,
    CFG.fields.matReq.department,
    CFG.fields.matReq.subform
  ].join(","),
  product: [
    CFG.fields.product.availableStock,
    CFG.fields.product.minStock,
    CFG.fields.product.modifiedTime,
    CFG.fields.product.redTagDate,
    CFG.fields.product.isRedTag,
    CFG.fields.product.price
  ].join(","),
  rework: [
    CFG.fields.rework.date,
    CFG.fields.rework.totalExpense
  ].join(","),
  rejection: [
    CFG.fields.rejection.date,
    CFG.fields.rejection.department,
    CFG.fields.rejection.defectiveProduct,
    CFG.fields.rejection.qty,
    CFG.fields.rejection.status
  ].join(",")
};

/* ----------------------------------------------------------------
   1. ZOHO CALL THROTTLE (same pattern as page_script.js)
   ---------------------------------------------------------------- */
const ZOHO_MAX_CONCURRENT = 4;
let _zohoActiveCalls = 0;
const _zohoQueue = [];

function _zohoRunNext() {
  if (_zohoActiveCalls >= ZOHO_MAX_CONCURRENT) return;
  const job = _zohoQueue.shift();
  if (!job) return;
  _zohoActiveCalls++;
  job.fn()
    .then((res) => job.resolve(res))
    .catch((err) => job.reject(err))
    .finally(() => {
      _zohoActiveCalls--;
      _zohoRunNext();
    });
  _zohoRunNext();
}

function zohoThrottled(fn) {
  return new Promise((resolve, reject) => {
    _zohoQueue.push({ fn, resolve, reject });
    _zohoRunNext();
  });
}

const ZQ = {
  getRecords: (params) => zohoThrottled(() => ZOHO.CREATOR.DATA.getRecords(params))
};

// Zoho returns an HTTP 400 with code 9280 when a query legitimately matches
// zero records (e.g. no rework entries this week). That's not a real error —
// treat it as "no data" instead of blowing up the whole dashboard. Any other
// failure is logged and also degrades to "no data" for that one report so a
// single bad report doesn't take the other three down with it.
async function safeGetRecords(params, label) {
  const started = Date.now();
  try {
    const res = await ZQ.getRecords(params);
    const data = res && res.data ? res.data : [];
    AK.logFetch({ label: label, report: params.report_name, params: params, rows: data, ms: Date.now() - started });
    return data;
  } catch (err) {
    const noRecords = AK.isNoRecords(err);
    AK.logFetch({
      label: label, report: params.report_name, params: params, rows: [],
      ms: Date.now() - started,
      error: noRecords ? null : err,
      note: noRecords ? 'Creator reported "no records"' : "fetch failed — this report reads as empty"
    });
    if (noRecords) return [];
    console.warn(`Store Weekly Dashboard: "${label}" fetch failed, treating as empty.`, err);
    return [];
  }
}

/* ----------------------------------------------------------------
   2. DATE HELPERS (mirror Deluge's date functions)
   ---------------------------------------------------------------- */
const DAY_MS = 24 * 60 * 60 * 1000;

function stripTime(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function subDays(d, n) {
  return addDays(d, -n);
}

function subWeeks(d, n) {
  return subDays(d, n * 7);
}

// Deluge's toStartOfWeek() = start of week on Sunday
function startOfWeekSunday(d) {
  const c = stripTime(d);
  c.setDate(c.getDate() - c.getDay());
  return c;
}

// Monday of the current week = Sunday start + 1 day (used by several functions)
function startOfWeekMonday(d) {
  return addDays(startOfWeekSunday(d), 1);
}

// Deluge's daysBetween(date1, date2) -> whole days from date1 to date2
function daysBetween(d1, d2) {
  return Math.round((stripTime(d2) - stripTime(d1)) / DAY_MS);
}

// Parse Zoho Creator date/datetime strings. Handles both:
//   - numeric:      "08-09-2026" or "08-09-2026 03:45:45 PM"  (DD-MM-YYYY)
//   - abbreviated:  "29-Jul-2026" or "29-Jul-2026 03:45:45 PM" (DD-MMM-YYYY)
function parseZohoDate(str) {
  if (!str) return null;
  const datePart = String(str).split(" ")[0];
  const parts = datePart.split("-");
  if (parts.length !== 3) return null;

  const [dd, mm, yyyy] = parts;
  const ddNum = parseInt(dd, 10);
  const yyyyNum = parseInt(yyyy, 10);
  if (isNaN(ddNum) || isNaN(yyyyNum)) return null;

  let monthIndex;
  if (/^\d+$/.test(mm)) {
    // numeric month, e.g. "09" -> September (index 8)
    monthIndex = parseInt(mm, 10) - 1;
  } else {
    const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    monthIndex = MONTHS[mm];
  }
  if (monthIndex === undefined || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;

  return new Date(yyyyNum, monthIndex, ddNum);
}

function num(v, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

// Human-readable numbers (10000 -> "10,000"), Indian grouping, via the shared kit.
// Strings that are already formatted pass through unchanged.
function fmtNum(v) {
  return typeof v === "number" && isFinite(v) ? AK.dec(v) : v;
}

/* ----------------------------------------------------------------
   2b. DRILL-DOWN PLUMBING
   Every count on screen can be clicked to see the records behind it.
   ---------------------------------------------------------------- */
const SRC = {};

const COLS = {
  matReq: [
    { label: "Date", value: CFG.fields.matReq.date, format: "date" },
    { label: "Department", value: CFG.fields.matReq.department },
    { label: "Issued By", value: CFG.fields.matReq.issuedBy },
    { label: "Modified", value: CFG.fields.matReq.modifiedTime, format: "date" },
    {
      label: "Qty issued", format: "dec",
      value: (r) => (r[CFG.fields.matReq.subform] || [])
        .reduce((s, l) => s + num(l[CFG.fields.matReq.qty]), 0)
    },
    {
      label: "Qty returned", format: "dec",
      value: (r) => (r[CFG.fields.matReq.subform] || [])
        .reduce((s, l) => s + num(l[CFG.fields.matReq.returnedQty]), 0)
    }
  ],
  rejection: [
    { label: "Date", value: CFG.fields.rejection.date, format: "date" },
    { label: "Department", value: CFG.fields.rejection.department },
    { label: "Defective Product", value: CFG.fields.rejection.defectiveProduct },
    { label: "Qty", value: CFG.fields.rejection.qty, format: "dec" },
    { label: "Status", value: CFG.fields.rejection.status }
  ],
  product: [
    { label: "Available Stock", value: CFG.fields.product.availableStock, format: "dec" },
    { label: "Minimum Stock", value: CFG.fields.product.minStock, format: "dec" },
    { label: "Price", value: CFG.fields.product.price, format: "money" },
    { label: "Red Tagged", value: CFG.fields.product.redTagDate, format: "date" },
    { label: "Modified", value: CFG.fields.product.modifiedTime, format: "date" }
  ],
  rework: [
    { label: "Date", value: CFG.fields.rework.date, format: "date" },
    { label: "Total Expense", value: CFG.fields.rework.totalExpense, format: "money" }
  ]
};

function drill(key, title, report, columns, srcKey, subtitle, empty) {
  AK.defineDrill(key, {
    title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
    rows: () => SRC[srcKey] || []
  });
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// index 0..6 = Mon..Sun (matches Deluge day_names map keyed "0".."6")
const DAY_LABELS_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ----------------------------------------------------------------
   3. FETCH — 4 calls total, done once
   ---------------------------------------------------------------- */
// NOTE ON CRITERIA: Zoho requires date/date-time literals in a criteria
// string to match your app's configured date format exactly (which varies
// per app — dd-MMM-yyyy, MM/dd/yyyy, dd/MM/yyyy, etc.) or the API returns a
// 400. Rather than guess that format, we fetch the most recent max_records
// (1000) from each report with NO date criteria (reports are sorted by
// added time, newest first, by default) and do every date-range filter in
// JS below, on the actual parsed field values. If any of these reports
// regularly gets more than 1000 new/modified records within the lookback
// windows used below, raise CFG.maxRecords or add pagination via
// record_cursor.
async function fetchAllDashboardData() {
  const today = new Date();
  const monday = startOfWeekMonday(today);           // used by flow / rejection / issued-vs-returned
  const rollingWeekStart = subDays(stripTime(today), 6); // used by weeklyKPI (rolling 7 days)
  const twoWeeksAgo = subWeeks(stripTime(today), 2);

  const [materialRequisitions, products, reworkRecords, rejectionRecords] = await Promise.all([
    safeGetRecords({
      report_name: CFG.reports.materialRequisition,
      field_config: "custom",
      fields: CFG.customFields.materialRequisition,
      max_records: CFG.maxRecords
    }, "Material Requisition"),
    safeGetRecords({
      report_name: CFG.reports.product,
      field_config: "custom",
      fields: CFG.customFields.product,
      max_records: CFG.maxRecords
    }, "Product"),
    safeGetRecords({
      report_name: CFG.reports.rework,
      field_config: "custom",
      fields: CFG.customFields.rework,
      max_records: CFG.maxRecords
    }, "Rework Register"),
    safeGetRecords({
      report_name: CFG.reports.rejection,
      field_config: "custom",
      fields: CFG.customFields.rejection,
      max_records: CFG.maxRecords
    }, "Rejection & Replacement Register")
  ]);

  return {
    today,
    monday,
    rollingWeekStart,
    twoWeeksAgo,
    materialRequisitions,
    products,
    reworkRecords,
    rejectionRecords
  };
}

/* ----------------------------------------------------------------
   4. CALCULATIONS (replace the 5 Deluge functions)
   ---------------------------------------------------------------- */

// --- 4a. dailyMaterialFlow ---
function computeDailyMaterialFlow(materialRequisitions, products, monday, today) {
  const MAX_HEIGHT = 200;
  const MIN_HEIGHT = 15;

  const dailyIssued = [0, 0, 0, 0, 0, 0, 0];
  const dailyReturned = [0, 0, 0, 0, 0, 0, 0];
  const dailyRecords = [[], [], [], [], [], [], []];

  materialRequisitions.forEach((req) => {
    const reqDate = parseZohoDate(req[CFG.fields.matReq.date]);
    if (!reqDate) return;
    if (reqDate < monday || reqDate > stripTime(today)) return;
    const dayIndex = daysBetween(monday, reqDate);
    if (dayIndex < 0 || dayIndex > 6) return;

    dailyRecords[dayIndex].push(req);
    const items = req[CFG.fields.matReq.subform] || [];
    items.forEach((item) => {
      dailyIssued[dayIndex] += num(item[CFG.fields.matReq.qty]);
      dailyReturned[dayIndex] += num(item[CFG.fields.matReq.returnedQty]);
    });
  });

  const stockOutRows = products.filter((p) => {
    const stock = num(p[CFG.fields.product.availableStock]);
    const minLevel = num(p[CFG.fields.product.minStock]);
    const modTime = parseZohoDate(p[CFG.fields.product.modifiedTime]);
    return stock < minLevel && modTime && modTime >= monday && modTime <= stripTime(today);
  });
  const stockOutCount = stockOutRows.length;

  let maxFlow = Math.max(...dailyIssued, ...dailyReturned, stockOutCount, 10);

  const daysSinceMonday = daysBetween(monday, stripTime(today));
  const days = [];

  const heightOf = (val) => {
    if (val <= 0) return MIN_HEIGHT;
    const h = MIN_HEIGHT + Math.round((val * (MAX_HEIGHT - MIN_HEIGHT)) / maxFlow);
    return Math.min(h, MAX_HEIGHT);
  };

  for (let i = 0; i <= Math.min(daysSinceMonday, 6); i++) {
    days.push({
      day_label: DAY_LABELS_MON_FIRST[i],
      material: dailyIssued[i],
      returned: dailyReturned[i],
      stockout: stockOutCount,
      material_height: heightOf(dailyIssued[i]),
      returned_height: heightOf(dailyReturned[i]),
      stockout_height: heightOf(stockOutCount),
      _records: dailyRecords[i]
    });
  }

  return { days, stockOutRows };
}

// --- 4b. indirectExpenseBreakdown ---
function computeIndirectExpenseBreakdown(reworkRecords, today) {
  const MAX_COLUMN_HEIGHT = 220;

  function reworkBetween(start, end) {
    const rows = reworkRecords.filter((r) => {
      const d = parseZohoDate(r[CFG.fields.rework.date]);
      return d && d >= start && d <= end;
    });
    return { rows, total: rows.reduce((s, r) => s + num(r[CFG.fields.rework.totalExpense]), 0) };
  }

  // Monday-start, same as the material flow / rejection / issued-vs-returned panels below —
  // this used to be Sunday-start here only, so "Week 1" meant a different 7 days depending
  // which chart on the page you looked at.
  const w1Start = startOfWeekMonday(today);
  const w1End = stripTime(today);
  const w1 = reworkBetween(w1Start, w1End);
  const raw = [{ label: "Week 1", rework: w1.total, rows: w1.rows }];

  let prevEnd = subDays(w1Start, 1);
  [2, 3, 4].forEach((weekNo) => {
    const weekEnd = prevEnd;
    const weekStart = startOfWeekMonday(weekEnd);
    const w = reworkBetween(weekStart, weekEnd);
    raw.push({ label: `Week ${weekNo}`, rework: w.total, rows: w.rows });
    prevEnd = subDays(weekStart, 1);
  });

  const maxTotal = Math.max(...raw.map((r) => r.rework), 0);

  const weeks = raw.map((r) => {
    const columnHeight = maxTotal > 0 ? Math.min(Math.round((r.rework * MAX_COLUMN_HEIGHT) / maxTotal), MAX_COLUMN_HEIGHT) : 0;
    return {
      week_label: r.label,
      height_percent: columnHeight,
      fabrication_height: 0,
      rework_height: 100,
      transit_height: 0,
      forgot_height: 0,
      fabrication_display: "N/A",
      rework_display: `${fmtNum(Math.round(r.rework / 1000))}K`,
      transit_display: "N/A",
      forgot_display: "N/A",
      _records: r.rows,
      _total: r.rework
    };
  });

  return { weeks };
}

// --- 4c. itemsIssuedVsReturned ---
function computeItemsIssuedVsReturned(materialRequisitions, monday, today) {
  const techMap = {};

  materialRequisitions.forEach((req) => {
    const d = parseZohoDate(req[CFG.fields.matReq.date]);
    const mt = parseZohoDate(req[CFG.fields.matReq.modifiedTime]);
    const inWindow = (d && d >= monday && d <= stripTime(today)) || (mt && mt >= monday && mt <= stripTime(today));
    if (!inWindow) return;

    const techName = req[CFG.fields.matReq.issuedBy];
    if (!techName) return;

    if (!techMap[techName]) techMap[techName] = { issued: 0, returned: 0, records: [] };
    techMap[techName].records.push(req);
    const items = req[CFG.fields.matReq.subform] || [];
    items.forEach((item) => {
      techMap[techName].issued += num(item[CFG.fields.matReq.qty]);
      techMap[techName].returned += num(item[CFG.fields.matReq.returnedQty]) + num(item[CFG.fields.matReq.prevReturnedQty]);
    });
  });

  const technicians = Object.keys(techMap).map((name) => ({ name, ...techMap[name] }));
  const maxValue = Math.max(0, ...technicians.map((t) => t.issued), ...technicians.map((t) => t.returned));

  technicians.forEach((t) => {
    let issuedWidth = maxValue > 0 ? Math.round((t.issued * 100) / maxValue) : 0;
    let returnedWidth = maxValue > 0 ? Math.round((t.returned * 100) / maxValue) : 0;
    if (t.issued > 0 && issuedWidth < 5) issuedWidth = 5;
    if (t.returned > 0 && returnedWidth < 5) returnedWidth = 5;
    t.issued_width = issuedWidth;
    t.returned_width = returnedWidth;
  });

  return { technicians, max_value: maxValue };
}

// --- 4d. rejectedItemsDaily ---
function computeRejectedItemsDaily(rejectionRecords, monday, today) {
  const MAX_HEIGHT = 160;
  const dailyCounts = [0, 0, 0, 0, 0, 0, 0];
  const dailyRecords = [[], [], [], [], [], [], []];

  rejectionRecords.forEach((rec) => {
    const d = parseZohoDate(rec[CFG.fields.rejection.date]);
    if (!d || d < monday || d > stripTime(today)) return;
    const dayIndex = daysBetween(monday, d);
    if (dayIndex < 0 || dayIndex > 6) return;
    dailyCounts[dayIndex] += num(rec[CFG.fields.rejection.qty], 1);
    dailyRecords[dayIndex].push(rec);
  });

  const maxCount = Math.max(1, ...dailyCounts);
  const daysSinceMonday = daysBetween(monday, stripTime(today));

  let lastDataDay = daysSinceMonday;
  dailyCounts.forEach((val, idx) => {
    if (val > 0 && idx > lastDataDay) lastDataDay = idx;
  });

  const days = [];
  for (let i = 0; i <= Math.min(lastDataDay, 6); i++) {
    const rejectedVal = dailyCounts[i];
    const rejectedHeight = Math.min(Math.round((rejectedVal * MAX_HEIGHT) / maxCount), MAX_HEIGHT);
    days.push({
      day_label: DAY_LABELS_MON_FIRST[i],
      rejected: rejectedVal,
      rejected_height: rejectedHeight,
      _records: dailyRecords[i]
    });
  }

  return { days };
}

// --- 4e. weeklyKPI ---
function computeWeeklyKPI(rejectionRecords, materialRequisitions, products, rollingWeekStart, twoWeeksAgo, today) {
  const todayStripped = stripTime(today);

  const rejectedProductionRows = rejectionRecords.filter((r) => {
    const d = parseZohoDate(r[CFG.fields.rejection.date]);
    return r[CFG.fields.rejection.department] === "Production" &&
      r[CFG.fields.rejection.defectiveProduct] &&
      d && d >= rollingWeekStart && d <= todayStripped;
  });

  const rejectedServiceRows = rejectionRecords.filter((r) => {
    const d = parseZohoDate(r[CFG.fields.rejection.date]);
    return r[CFG.fields.rejection.department] === "Service" &&
      r[CFG.fields.rejection.defectiveProduct] &&
      d && d >= rollingWeekStart && d <= todayStripped;
  });

  const rejectedRows = rejectedProductionRows.concat(rejectedServiceRows);

  const replacementRows = rejectionRecords.filter((r) => {
    const d = parseZohoDate(r[CFG.fields.rejection.date]);
    return r[CFG.fields.rejection.defectiveProduct] &&
      d && d <= twoWeeksAgo &&
      r[CFG.fields.rejection.status] === "Pending";
  });

  const sentRows = [];
  let itemsSentToService = 0;
  materialRequisitions.forEach((req) => {
    const d = parseZohoDate(req[CFG.fields.matReq.date]);
    if (req[CFG.fields.matReq.department] === "Service" && d && d >= rollingWeekStart && d <= todayStripped) {
      sentRows.push(req);
      (req[CFG.fields.matReq.subform] || []).forEach((item) => {
        itemsSentToService += num(item[CFG.fields.matReq.qty]);
      });
    }
  });

  const returnedRows = [];
  let itemsReturnedFromService = 0;
  materialRequisitions.forEach((req) => {
    const mt = parseZohoDate(req[CFG.fields.matReq.modifiedTime]);
    if (req[CFG.fields.matReq.department] === "Service" && mt && mt >= rollingWeekStart && mt <= todayStripped) {
      returnedRows.push(req);
      (req[CFG.fields.matReq.subform] || []).forEach((item) => {
        itemsReturnedFromService += num(item[CFG.fields.matReq.returnedQty]);
      });
    }
  });

  const redTagRows = [];
  let redTagValue = 0;
  products.forEach((p) => {
    const rtDate = parseZohoDate(p[CFG.fields.product.redTagDate]);
    const isRedTag = p[CFG.fields.product.isRedTag] === true || p[CFG.fields.product.isRedTag] === "true";
    if (isRedTag && rtDate && rtDate >= rollingWeekStart && rtDate <= todayStripped) {
      redTagRows.push(p);
      redTagValue += num(p[CFG.fields.product.price]);
    }
  });

  return {
    production_stops_unavailability: 0, // not tracked in the system yet, per original function
    rejected_items: rejectedRows.length,
    replacement_items_not_received: replacementRows.length,
    items_sent_to_service: itemsSentToService,
    items_returned_from_service: itemsReturnedFromService,
    red_tag_mat_created_this_week: redTagValue,
    fabrication_and_transit_cost: 0,
    src: {
      rejected: rejectedRows,
      replacement: replacementRows,
      sent: sentRows,
      returned: returnedRows,
      redTag: redTagRows
    }
  };
}

/* ----------------------------------------------------------------
   5. RENDER
   ---------------------------------------------------------------- */
function indicatorFor(metric, value) {
  switch (metric) {
    case "prod_stops":
      if (value === 0) return { cls: "green", icon: "fa-check-circle" };
      if (value <= 2) return { cls: "orange", icon: "fa-exclamation-triangle" };
      return { cls: "red", icon: "fa-times-circle" };
    case "rejected":
      return value < 5 ? { cls: "green", icon: "fa-check-circle" } : { cls: "orange", icon: "fa-exclamation-triangle" };
    case "replacement":
      if (value === 0) return { cls: "green", icon: "fa-check-circle" };
      if (value <= 2) return { cls: "orange", icon: "fa-exclamation-triangle" };
      return { cls: "red", icon: "fa-times-circle" };
    default:
      return { cls: "blue", icon: "fa-info-circle" };
  }
}

function renderKPITable(kpi) {
  const R = CFG.reports;

  SRC["kpi.rejected"] = kpi.src.rejected;
  SRC["kpi.replacement"] = kpi.src.replacement;
  SRC["kpi.sent"] = kpi.src.sent;
  SRC["kpi.returned"] = kpi.src.returned;
  SRC["kpi.redTag"] = kpi.src.redTag;

  drill("kpi.rejected", "Rejected Items (Production + Service)", R.rejection, COLS.rejection, "kpi.rejected",
    "Rejection & Replacement entries in the rolling 7 days for Production or Service with a Defective Product",
    "Nothing was rejected in the last 7 days.");
  drill("kpi.replacement", "Replacements Not Received (> 2 weeks)", R.rejection, COLS.rejection, "kpi.replacement",
    "Entries older than two weeks that are still Pending",
    "Every replacement older than two weeks has been received.");
  drill("kpi.sent", "Items Given to Service", R.materialRequisition, COLS.matReq, "kpi.sent",
    "Material Requisitions for Service dated in the rolling 7 days");
  drill("kpi.returned", "Items Returned from Service", R.materialRequisition, COLS.matReq, "kpi.returned",
    "Service requisitions modified in the rolling 7 days (the number is the summed Returned_Item_Qty)");
  drill("kpi.redTag", "Red Tag Material Created", R.product, COLS.product, "kpi.redTag",
    "Products flagged Is_Red_Tag_Material with a Red Tagged Date in the rolling 7 days (the value is their summed Price)",
    "No red tag material was created this week.");

  const rows = [
    { label: "Production stops due to material unavailability", icon: "fa-industry", target: "0", value: kpi.production_stops_unavailability, metric: "prod_stops" },
    { label: "Rejected Items (Prod + Service)", icon: "fa-ban", target: "<5", value: kpi.rejected_items, metric: "rejected", drill: "kpi.rejected" },
    { label: "Replacement items not received >2 weeks", icon: "fa-truck-loading", target: "0", value: kpi.replacement_items_not_received, metric: "replacement", drill: "kpi.replacement" },
    { label: "Items given to service (Total)", icon: "fa-tools", target: "—", value: kpi.items_sent_to_service, metric: "info", indicatorCls: "blue", indicatorIcon: "fa-arrow-up", drill: "kpi.sent" },
    { label: "Items returned from service", icon: "fa-undo-alt", target: "—", value: kpi.items_returned_from_service, metric: "info", indicatorCls: "green", indicatorIcon: "fa-arrow-down", drill: "kpi.returned" },
    { label: "Red tag material created this week", icon: "fa-flag", target: "—", value: `\u20B9${fmtNum(kpi.red_tag_mat_created_this_week)}`, metric: "info", indicatorCls: "purple", indicatorIcon: "fa-tag", raw: kpi.red_tag_mat_created_this_week, drill: "kpi.redTag" }
  ];

  return rows.map((row) => {
    const ind = row.metric === "info"
      ? { cls: row.indicatorCls, icon: row.indicatorIcon }
      : indicatorFor(row.metric, row.raw !== undefined ? row.raw : row.value);
    const attr = row.drill ? ` data-drill="${row.drill}"` : "";
    return `
      <tr>
        <td><i class="fas ${row.icon}" style="margin-right:8px;color:#6b7280;"></i>${row.label}</td>
        <td>${row.target}</td>
        <td${attr}>${fmtNum(row.value)}</td>
        <td><span class="weekly-indicator ${ind.cls}"><i class="fas ${ind.icon}"></i></span></td>
      </tr>`;
  }).join("");
}

function renderIssuedVsReturned(technicians) {
  const el = document.getElementById("issuedVsReturned");
  if (!el) return;
  if (!technicians || technicians.length === 0) {
    el.innerHTML = AK.emptyPanel("No material was issued or returned by any technician this week.", 200);
    return;
  }

  technicians.forEach((tech, i) => {
    SRC["tech." + i] = tech.records;
    drill("tech." + i, "Material Requisitions — " + tech.name, CFG.reports.materialRequisition,
      COLS.matReq, "tech." + i, "This week's requisitions issued by " + tech.name);
  });

  el.innerHTML = '<div id="issuedVsReturned-chart"></div>';
  AK.mountChart("issuedVsReturned-chart", {
    chart: {
      type: "bar", height: Math.max(220, technicians.length * 70), fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill("tech." + opts.dataPointIndex) }
    },
    series: [
      { name: "Issued", data: technicians.map((t) => t.issued) },
      { name: "Returned", data: technicians.map((t) => t.returned) }
    ],
    xaxis: { categories: technicians.map((t) => t.name) },
    colors: AK.categoricalColors(2),
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => fmtNum(v) } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderExpenseBreakdown(weeks) {
  const el = document.getElementById("expenseBreakdown");
  if (!el) return;

  weeks.forEach((w, i) => {
    SRC["rework." + i] = w._records;
    drill("rework." + i, "Rework — " + w.week_label, CFG.reports.rework, COLS.rework, "rework." + i,
      w.week_label + " total: " + AK.money(w._total),
      "No rework was logged in " + w.week_label + ".");
  });

  el.innerHTML = '<div id="expenseBreakdown-chart"></div>';
  AK.mountChart("expenseBreakdown-chart", {
    chart: {
      type: "bar", height: 260, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill("rework." + opts.dataPointIndex) }
    },
    series: [{ name: "Rework Cost", data: weeks.map((w) => w._total) }],
    xaxis: { categories: weeks.map((w) => w.week_label) },
    colors: [AK.chartColors.blue],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
    dataLabels: { enabled: true, formatter: (v) => AK.money(v) },
    tooltip: { y: { formatter: (v) => AK.money(v) } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderRejectedItems(days) {
  const el = document.getElementById("rejectedItems");
  if (!el) return;
  const hasData = days.some((d) => d.rejected > 0);
  if (!hasData) {
    el.innerHTML = AK.emptyPanel("No item was rejected on any day this week.", 280);
    return;
  }

  days.forEach((day, i) => {
    SRC["rej." + i] = day._records;
    drill("rej." + i, "Rejected Items — " + day.day_label, CFG.reports.rejection, COLS.rejection,
      "rej." + i, "Rejection & Replacement entries dated " + day.day_label + " this week");
  });

  el.innerHTML = '<div id="rejectedItems-chart"></div>';
  AK.mountChart("rejectedItems-chart", {
    chart: {
      type: "line", height: 320, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: {
        dataPointSelection: (ev, ctx, opts) => AK.openDrill("rej." + opts.dataPointIndex),
        markerClick: (ev, ctx, opts) => AK.openDrill("rej." + opts.dataPointIndex)
      }
    },
    series: [{ name: "Rejected Items", data: days.map((d) => d.rejected) }],
    xaxis: { categories: days.map((d) => d.day_label) },
    colors: [AK.chartColors.red],
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 6, hover: { size: 8 } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => fmtNum(v) } }
  });
}

function renderMaterialFlow(days, stockOutRows) {
  const el = document.getElementById("materialFlow");
  if (!el) return;

  SRC.stockOut = stockOutRows || [];
  drill("flow.stockOut", "Stock Out Alerts", CFG.reports.product, COLS.product, "stockOut",
    "Products whose Available Stock is below their Minimum Stock Level and were modified this week",
    "No product fell below its minimum stock level this week.");

  days.forEach((d, i) => {
    SRC["flow." + i] = d._records;
    drill("flow." + i, "Material Requisitions — " + d.day_label, CFG.reports.materialRequisition,
      COLS.matReq, "flow." + i,
      d.day_label + ": " + fmtNum(d.material) + " issued, " + fmtNum(d.returned) + " returned",
      "No material moved on " + d.day_label + ".");
  });

  el.innerHTML = '<div id="materialFlow-chart"></div>';
  AK.mountChart("materialFlow-chart", {
    chart: {
      type: "bar", height: 320, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: {
        dataPointSelection: (ev, ctx, opts) =>
          AK.openDrill(opts.seriesIndex === 2 ? "flow.stockOut" : "flow." + opts.dataPointIndex)
      }
    },
    series: [
      { name: "Material Issued", data: days.map((d) => d.material) },
      { name: "Material Returned", data: days.map((d) => d.returned) },
      { name: "Stock Out Alerts (current)", data: days.map((d) => d.stockout) }
    ],
    xaxis: { categories: days.map((d) => d.day_label) },
    colors: AK.categoricalColors(3),
    plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => fmtNum(v) } }
  });
}

function renderDashboard(computed) {
  document.getElementById("kpiTableBody").innerHTML = renderKPITable(computed.kpi);
  renderIssuedVsReturned(computed.issuedVsReturned.technicians);
  renderExpenseBreakdown(computed.expense.weeks);
  renderRejectedItems(computed.rejected.days);
  renderMaterialFlow(computed.flow.days, computed.flow.stockOutRows);

  // Make every number that has a drill-down clickable (chart clicks are wired directly via events above).
  AK.autoBind(document);
}

function renderError(msg) {
  const container = document.querySelector(".weekly-container");
  if (container) {
    container.innerHTML = `<div class="weekly-empty" style="height:200px;"><i class="fas fa-exclamation-triangle"></i> Failed to load dashboard: ${AK.esc(msg)}</div>`;
  }
}

/* ----------------------------------------------------------------
   6. INIT
   ---------------------------------------------------------------- */
async function initStoreWeeklyDashboard() {
  try {
    const raw = await fetchAllDashboardData();

    const flow = computeDailyMaterialFlow(raw.materialRequisitions, raw.products, raw.monday, raw.today);
    const expense = computeIndirectExpenseBreakdown(raw.reworkRecords, raw.today);
    const issuedVsReturned = computeItemsIssuedVsReturned(raw.materialRequisitions, raw.monday, raw.today);
    const rejected = computeRejectedItemsDaily(raw.rejectionRecords, raw.monday, raw.today);
    const kpi = computeWeeklyKPI(raw.rejectionRecords, raw.materialRequisitions, raw.products, raw.rollingWeekStart, raw.twoWeeksAgo, raw.today);

    renderDashboard({ flow, expense, issuedVsReturned, rejected, kpi });

    AK.report();
    console.log("%c[storeWeekly] ready — click any count to see the records behind it.",
      "color:#15803d;font-weight:bold");

    // One-time field discovery for every report this dashboard reads — paste the console
    // output back to fix any remaining guessed field name in one pass. Safe to delete once
    // every field in CFG.fields is confirmed against real data.
    AK.discoverAllFields(CFG.reports);
  } catch (err) {
    console.error("Store Weekly Dashboard error:", err);
    renderError(err && err.message ? err.message : "Unknown error");
  }
}

AK.init({ name: "storeWeekly" });

// Zoho Creator widget bootstrap — V2 JS API needs no init() call
initStoreWeeklyDashboard();
