"use strict";

/* ================================================================
   PRODUCTION DASHBOARD — WIDGET VERSION
   ================================================================
   Converted from the Zoho Creator HTML/Deluge snippet
   (app/widget.html + delugefunctions.txt) to a plain JS widget,
   matching the structure of the other adroit dashboards.

   >>> READ THIS BEFORE GOING LIVE <<<
   Of the custom functions in delugefunctions.txt, only EIGHT are
   actually wired into the page output (one of them — getKPITableData() —
   existed with real logic in the Deluge source but the original
   widget.html never called it anywhere; it's wired in here for real).
   The rest of the original template (roughly two thirds of the panels)
   was 100% hardcoded demo numbers typed directly into the Deluge block —
   no custom function, no report read, nothing to port. Those panels are
   kept on screen with their titles, but show an explicit "not connected"
   message instead of fabricated numbers, cross-referenced against the
   Production_Dashboard.docx spec in dashboard_docs/ where it names the
   exact fields still missing. Search this file for NOT_CONNECTED for the
   complete list, and see the companion workbook
   (Adroit_Dashboard_Report_Fields.xlsx, Production sheet) for details.

   Real, data-backed panels (ported from delugefunctions.txt):
     - Today's & Weekly Overview (order      getKPITableData() — added this
       delays, rework, man-hours)            round; never wired in the original
     - Production Performance Overview (weekly/monthly/yearly planned
       vs actual)                          getPlannedVsActualProduction*()
     - On-Time Delivery Trend               getOnTimeDeliveryTrend()
     - Order Commitment & Delay Status      getOrderCommitmentDelayStatus_ThisWeek()
     - Rework / Rejection tiles             getQualityComplaintsAndRework()
     - Rework Trend (weekly/monthly/yearly) reworkTrendWeekly/Monthly/Yearly()
     - Maintenance table + compliance %     getMaintenanceData()
     - Top 5 Red-Tag Items                  topFiveRedTagItemsByValue()
     - KPI Performance Trend (On-Time %,    calcMonthlyOnTimeTrend() — added this round; the
       last 3 months)                       doc's other 2 lines (BOM Accuracy %, Rework %) are
                                             still blocked, no data source exists for either yet

   Known issues carried over from the Deluge source, or fixed where
   the fix is unambiguous (flagged either way, never silent):
     1. getQualityComplaintsAndRework() computes week_start but then
        filters both counts to Date_field >= today && <= today — i.e.
        TODAY only, not this week as the unused variable suggests.
        Ported literally; tiles are labelled "(Today)" to say so.
     2. topFiveRedTagItemsByValue()'s loop condition `count <= 5`
        actually returns SIX records (indices 0..5). Since the panel
        is titled "Top 5", this is fixed here to a genuine top 5 —
        CFG.PARITY.redTagTopSix reproduces the original off-by-one if
        you need to match old screenshots.
     3. topFiveRedTagItemsByValue()'s aging calculation was
        curr_date.daysBetween(Last_Order_Date), which for a past date
        returns a NEGATIVE number in Deluge (arguments reversed) — so
        every item fell through to the final "else" and showed
        priority "Low" regardless of real age. Fixed here to
        daysBetween(Last_Order_Date, today), a positive age in days;
        CFG.PARITY.reverseRedTagAging reproduces the bug if needed.
     4. getMaintenanceData()'s is_completed check is `Due_Date != null`
        — literally "does this record have a due date filled in", not
        an actual completion flag. Ported exactly as written; flagged
        in the Excel workbook as worth confirming with whoever owns
        the Preventive_Maintenance form.
     5. reworkTrend*()'s denominator (total production) does NOT
        filter by Status, unlike the planned/actual functions, which
        exclude Draft / require Completed. Ported exactly as written.

   All report link names below are GUESSES built from the Deluge form
   names, following this app's "All_<Form>" convention seen elsewhere
   — NONE of them could be confirmed from working code the way the
   other dashboards' reports could. Every one is marked // VERIFY.
   Open the console: every fetch prints its report name, its row
   count, and the field names that actually came back.
   ================================================================ */

/* ----------------------------------------------------------------
   0. CONFIG
   ---------------------------------------------------------------- */
const CFG = {
  reports: {
    // BROKEN — confirmed via a live fields.txt dump, not a guess: this exact name returned
    // "code 2930: Error Occurred." Every other confirmed report in this app follows an
    // "All_<Form>" naming convention; this one is "Add_<Form>", which looks like a Deluge
    // add-form link name rather than a report link name. "All_Work_Order_SERVO" is a
    // plausible alternate given that pattern, but it is NOT verified — click the "Fields"
    // button on the dashboard and try it before trusting it.
    workOrder: "Detailed_Work_Order_SERVO_Stabilizer",
    orderConfirmation: "All_Order_Confirmations",  // confirmed — used by salesExecutiveCommandView / sales_performance_summary, and via this dashboard's own fields.txt
    // VALID report name (fields.txt got a clean response, not an error) but it returned ZERO
    // records — either Production genuinely has no rework logged, or this is the wrong report:
    // the Store dashboards read the same-sounding "Rework" form from "All_Rework_Registers"
    // (which DOES have records) instead of "All_Reworks". Worth confirming with whoever owns
    // the Production app whether Production rework is really a separate, currently-empty log,
    // or whether this should point at All_Rework_Registers too.
    rework: "All_Reworks",
    // These two names were changed after the last fields.txt scan (which tested the singular
    // "All_Rejection_Module" / "All_Preventive_Maintenance" and got "code 2894: No report
    // named ... found" for both). That scan is now stale for these two — it did not test the
    // plural names currently configured here. Click "Fields" on the dashboard and rescan to
    // confirm whether these plural names actually resolve.
    rejection: "All_Rejection_Modules",
    preventiveMaintenance: "All_Preventive_Maintenances",
    product: "All_Product"                          // confirmed — used by every Store dashboard, and via this dashboard's own fields.txt
  },

  fields: {
    workOrder: {
      date: "Date_field",       // VERIFY
      status: "Status",         // VERIFY — compared against "Draft" and "Completed"
      manHours: "Man_Hours"     // VERIFY — powers the new Today's & Weekly Overview panel (Man-Hours Logged tiles)
    },
    orderConfirmation: {
      // All 7 confirmed via this dashboard's own fields.txt dump.
      // Deluge's own misspelling — the field is "Commited_Delivery_Date", not "Committed".
      committedDate: "Commited_Delivery_Date",
      actualDate: "Actual_Delivery_Date",
      date: "Date_field",                      // used by the on-time trend, a DIFFERENT date than committedDate
      orderNo: "Order_Confirmation_ID",
      customer: "Customer_Name",               // lookup; Deluge reads .Customer_Name off it
      product: "Product_Details",              // lookup; Deluge reads .Product_Name off it
      remarks: "Remarks"
    },
    rework: {
      date: "Date_field" // VERIFY
    },
    rejection: {
      date: "Date_field" // VERIFY
    },
    preventiveMaintenance: {
      maintenanceDate: "Preventive_Maintenance_Date", // VERIFY
      frequency: "Frequency",                          // VERIFY — values: Monthly / 3 Months / 6 Months / Annually
      dueDate: "Due_Date",                              // VERIFY
      type: "Type_of_Maintenance"                       // VERIFY — matched by .contains(), see calcMaintenance()
    },
    product: {
      name: "Product_Name",         // confirmed
      price: "Price",                // confirmed
      isRedTag: "Is_Red_Tag_Material", // confirmed
      lastOrderDate: "Last_Order_Date" // confirmed
    }
  },

  // Panels the original template hardcoded with no backing Deluge function
  // at all. Nothing here was invented — every value is a literal from the
  // source (e.g. `planned_today = 45;`, `bom_accuracy = 97;`).
  NOT_CONNECTED: [
    "Complaint Types Breakdown (pie was permanently 0/0/0 in the original too)",
    "Material, BOM & Inventory Control tiles",
    "Material Shortage Impact (weekly/monthly/yearly)",
    "This Month Products & Indirect Expenses table",
    "Inventory & Material tiles",
    "Improvement, Training & Risk Management table",
    "Improvements Implemented vs Cost Savings chart",
    "Individual KPI & Team Evaluation table"
    // "KPI Performance Trend (On-Time Delivery, last 3 months)" was moved OUT of this list —
    // it's now real, computed from All_Order_Confirmations. See calcMonthlyOnTimeTrend().
    // The doc's other two requested lines (BOM Accuracy %, Rework %) are still blocked.
  ],

  PARITY: {
    // true = reproduce the Deluge bug exactly; false (default) = the evidently intended, fixed behaviour
    redTagTopSix: false,
    reverseRedTagAging: false
  },

  maxRecords: 1000,
  maxPages: 10,
  DEBUG: true
};

CFG.customFields = {
  workOrder: [CFG.fields.workOrder.date, CFG.fields.workOrder.status, CFG.fields.workOrder.manHours].join(","),
  orderConfirmation: [
    CFG.fields.orderConfirmation.committedDate, CFG.fields.orderConfirmation.actualDate,
    CFG.fields.orderConfirmation.date, CFG.fields.orderConfirmation.orderNo,
    CFG.fields.orderConfirmation.customer, CFG.fields.orderConfirmation.product,
    CFG.fields.orderConfirmation.remarks
  ].join(","),
  rework: [CFG.fields.rework.date].join(","),
  rejection: [CFG.fields.rejection.date].join(","),
  preventiveMaintenance: [
    CFG.fields.preventiveMaintenance.maintenanceDate, CFG.fields.preventiveMaintenance.frequency,
    CFG.fields.preventiveMaintenance.dueDate, CFG.fields.preventiveMaintenance.type
  ].join(","),
  product: [
    CFG.fields.product.name, CFG.fields.product.price,
    CFG.fields.product.isRedTag, CFG.fields.product.lastOrderDate
  ].join(",")
};

/* ----------------------------------------------------------------
   1. ZOHO CALL THROTTLE + LOGGED FETCH
   ---------------------------------------------------------------- */
const ZOHO_MAX_CONCURRENT = 4;
let _active = 0;
const _queue = [];
function _next() {
  if (_active >= ZOHO_MAX_CONCURRENT) return;
  const job = _queue.shift();
  if (!job) return;
  _active++;
  job.fn().then(job.resolve).catch(job.reject).finally(() => { _active--; _next(); });
  _next();
}
function throttled(fn) {
  return new Promise((resolve, reject) => { _queue.push({ fn, resolve, reject }); _next(); });
}

const FETCH_FAILURES = {};

async function fetchReport(key, label) {
  const base = {
    report_name: CFG.reports[key],
    field_config: "custom",
    fields: CFG.customFields[key],
    max_records: CFG.maxRecords
  };

  const started = Date.now();
  let all = [], cursor = null, page = 0, failure = null, note = null;

  do {
    const params = cursor ? Object.assign({}, base, { record_cursor: cursor }) : Object.assign({}, base);
    let res;
    try {
      res = await throttled(() => ZOHO.CREATOR.DATA.getRecords(params));
    } catch (err) {
      if (AK.isNoRecords(err)) { note = 'Creator reported "no records"'; break; }
      failure = err;
      FETCH_FAILURES[base.report_name] = AK.describeError(err);
      break;
    }
    all = all.concat((res && res.data) || []);
    cursor = (res && res.record_cursor) || null;
    page++;
  } while (cursor && page < CFG.maxPages);

  if (cursor && page >= CFG.maxPages) note = "hit the " + CFG.maxPages + "-page cap — counts may be low";

  AK.logFetch({
    label: label, report: base.report_name, params: base, rows: all,
    ms: Date.now() - started, error: failure, note: note
  });
  return all;
}

/* ----------------------------------------------------------------
   2. HELPERS
   ---------------------------------------------------------------- */
const num = AK.num;
const text = AK.text;
const esc = AK.esc;
const cnt = AK.int;
const rupees = AK.money;
const pctOf = AK.pct;
function sum(list, fn) { return list.reduce((s, x) => s + fn(x), 0); }

const NOW = new Date();
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86400000;

function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, d.getDate()); }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
// Monday start of week — matches servicePerformanceSummary / sales_performance_summary
// and standard Indian business convention (work week Mon-Sat, Sunday is the day off).
function startOfWeek(d) { return addDays(d, -((d.getDay() + 6) % 7)); }
function daysBetween(a, b) { return Math.round((b - a) / DAY_MS); }
function inRange(v, from, to) {
  const d = AK.parseDate(v);
  return !!d && d >= from && d <= to;
}
function rows(v) { return Array.isArray(v) ? v : []; }
function round(n, places) {
  const p = Math.pow(10, places === undefined ? 0 : places);
  return Math.round((n + Number.EPSILON) * p) / p;
}

/* ----------------------------------------------------------------
   3. STATE, COLUMNS, DRILL HELPER
   ---------------------------------------------------------------- */
const D = {};
const SRC = {};
const F = CFG.fields;

const COLS = {
  workOrder: [
    { label: "Date", value: F.workOrder.date, format: "date" },
    { label: "Status", value: F.workOrder.status },
    { label: "Man Hours", value: F.workOrder.manHours, format: "dec" }
  ],
  order: [
    { label: "Order No", value: F.orderConfirmation.orderNo },
    { label: "Customer", value: (r) => text(r[F.orderConfirmation.customer]) },
    { label: "Product", value: (r) => text(r[F.orderConfirmation.product]) },
    { label: "Committed", value: F.orderConfirmation.committedDate, format: "date" },
    { label: "Actual Dispatch", value: F.orderConfirmation.actualDate, format: "date" },
    { label: "Remarks", value: F.orderConfirmation.remarks }
  ],
  rework: [
    { label: "Date", value: F.rework.date, format: "date" }
  ],
  rejection: [
    { label: "Date", value: F.rejection.date, format: "date" }
  ],
  maintenance: [
    { label: "Maintenance Date", value: F.preventiveMaintenance.maintenanceDate, format: "date" },
    { label: "Frequency", value: F.preventiveMaintenance.frequency },
    { label: "Due Date", value: F.preventiveMaintenance.dueDate, format: "date" },
    { label: "Type", value: F.preventiveMaintenance.type }
  ],
  product: [
    { label: "Product", value: F.product.name },
    { label: "Price", value: F.product.price, format: "money" },
    { label: "Last Order Date", value: F.product.lastOrderDate, format: "date" }
  ]
};

function drill(key, title, report, columns, srcKey, subtitle, empty) {
  AK.defineDrill(key, {
    title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
    rows: () => SRC[srcKey] || []
  });
}

/* ----------------------------------------------------------------
   4. CALCULATIONS  (ported from delugefunctions.txt)
   ---------------------------------------------------------------- */

/** Add_Work_Order_SERVO records in [from, to], split into planned (not Draft) and actual (Completed). */
function workOrdersInRange(from, to) {
  const inWindow = D.workOrder.filter((w) => inRange(w[F.workOrder.date], from, to));
  const planned = inWindow.filter((w) => text(w[F.workOrder.status]) !== "Draft");
  const actual = inWindow.filter((w) => text(w[F.workOrder.status]) === "Completed");
  return { planned, actual };
}

/**
 * getPlannedVsActualProductionWeekly/Monthly/Yearly() — shared shape.
 * periods: array of { label, start, end }. Heights scaled to 85% of the
 * global max across every bucket (matches height_scale = 0.85 in Deluge).
 */
function calcPlannedVsActual(periods) {
  let globalMax = 0;
  const buckets = periods.map((p) => {
    const { planned, actual } = workOrdersInRange(p.start, p.end);
    globalMax = Math.max(globalMax, planned.length, actual.length);
    return { label: p.label, planned: planned, actual: actual };
  });

  const HEIGHT_SCALE = 0.85;
  return buckets.map((b) => ({
    label: b.label,
    planned_count: b.planned.length,
    actual_count: b.actual.length,
    planned_height: globalMax > 0 ? round((b.planned.length * 100 * HEIGHT_SCALE) / globalMax, 2) : 0,
    actual_height: globalMax > 0 ? round((b.actual.length * 100 * HEIGHT_SCALE) / globalMax, 2) : 0,
    _planned: b.planned,
    _actual: b.actual
  }));
}

/** Weekly = up to 4 weeks of the current month, stopping at a future week. */
function calcProductionWeekly() {
  const monthStart = startOfMonth(TODAY);
  const monthEnd = endOfMonth(TODAY);
  const periods = [];
  for (let w = 0; w < 4; w++) {
    const start = addDays(monthStart, w * 7);
    if (start > TODAY) break;
    let end = addDays(start, 6);
    if (end > monthEnd) end = monthEnd;
    if (end > TODAY) end = TODAY;
    periods.push({ label: "Week " + (w + 1), start, end });
  }
  return calcPlannedVsActual(periods);
}

/** Monthly = Jan..current month of the current year. */
function calcProductionMonthly() {
  const year = TODAY.getFullYear();
  const periods = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1);
    if (start > TODAY) break;
    let end = endOfMonth(start);
    if (end > TODAY) end = TODAY;
    periods.push({ label: MONTH_NAMES[m], start, end });
  }
  return calcPlannedVsActual(periods);
}

/** Yearly = the last 5 years including the current one. */
function calcProductionYearly() {
  const year = TODAY.getFullYear();
  const periods = [];
  for (let y = year - 4; y <= year; y++) {
    const start = new Date(y, 0, 1);
    let end = new Date(y, 11, 31);
    if (y === year) end = TODAY;
    periods.push({ label: String(y), start, end });
  }
  return calcPlannedVsActual(periods);
}

/**
 * getOnTimeDeliveryTrend() — up to 5 weeks of the current month.
 * Filtered by Date_field (order date), NOT by the committed delivery date —
 * that's a different filter used by the delay-status table below.
 */
function calcDeliveryTrend() {
  const monthStart = startOfMonth(TODAY);
  const monthEnd = endOfMonth(TODAY);
  const weeks = [];

  for (let w = 0; w < 5; w++) {
    const start = addDays(monthStart, w * 7);
    if (start > monthEnd) break;
    let end = addDays(start, 6);
    if (end > monthEnd) end = monthEnd;
    if (end > TODAY) end = TODAY;

    const orders = D.orderConfirmation.filter((o) => inRange(o[F.orderConfirmation.date], start, end));
    const ontime = orders.filter((o) => {
      const actual = AK.parseDate(o[F.orderConfirmation.actualDate]);
      const committed = AK.parseDate(o[F.orderConfirmation.committedDate]);
      return actual && committed && actual <= committed;
    });
    const pct = orders.length > 0 ? round((ontime.length * 100) / orders.length, 2) : 0;

    weeks.push({
      week: "Week " + (w + 1),
      week_start: AK.date(start), week_end: AK.date(end),
      total_orders: orders.length, ontime_count: ontime.length, ontime_percentage: pct,
      _orders: orders, _ontime: ontime
    });
  }

  // Scale: always include 95 (target) so the target line is visible.
  let scaleMax = Math.max(0, ...weeks.map((w) => w.ontime_percentage));
  if (scaleMax < 95) scaleMax = 95;
  if (scaleMax === 0) scaleMax = 10;

  weeks.forEach((w) => {
    let barH = round((w.ontime_percentage * 80) / scaleMax, 2);
    if (barH < 8 && w.ontime_percentage > 0) barH = 8;
    w.bar_height = barH;
  });

  let targetBarH = round((95 * 80) / scaleMax, 2);
  if (targetBarH > 88) targetBarH = 88;

  return {
    weeks,
    scaleMax,
    targetBarH,
    yTicks: [0.2, 0.4, 0.6, 0.8, 1].map((f) => round(scaleMax * f, 0))
  };
}

/** getOrderCommitmentDelayStatus_ThisWeek() */
function calcOrderDelayStatus() {
  const weekStart = startOfWeek(TODAY);
  const orders = D.orderConfirmation
    .filter((o) => inRange(o[F.orderConfirmation.committedDate], weekStart, TODAY))
    .slice()
    .sort((a, b) => {
      const da = AK.parseDate(a[F.orderConfirmation.committedDate]);
      const db = AK.parseDate(b[F.orderConfirmation.committedDate]);
      return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
    });

  const table = orders.map((rec) => {
    const committed = AK.parseDate(rec[F.orderConfirmation.committedDate]);
    const actual = AK.parseDate(rec[F.orderConfirmation.actualDate]);
    let delayDays = 0, status;

    if (actual) {
      if (actual <= committed) { delayDays = 0; status = "On Time"; }
      else { delayDays = daysBetween(committed, actual); status = "Delayed"; }
    } else if (TODAY > committed) {
      delayDays = daysBetween(committed, TODAY);
      status = "Critical";
    } else {
      delayDays = 0;
      status = "Pending";
    }

    const colors = {
      "On Time": { badge: "status-green", delay: "#28a745" },
      "Delayed": { badge: "status-yellow", delay: "#e0a800" },
      "Critical": { badge: "status-red", delay: "#dc3545" },
      "Pending": { badge: "status-yellow", delay: "#888" }
    }[status];

    return {
      order_no: text(rec[F.orderConfirmation.orderNo]) || ("#" + rec.ID),
      customer: text(rec[F.orderConfirmation.customer]),
      product: text(rec[F.orderConfirmation.product]),
      committed_date: AK.date(committed),
      actual_dispatch: actual ? AK.date(actual) : "-",
      delay: delayDays,
      reason: text(rec[F.orderConfirmation.remarks]) || "-",
      status: status,
      status_color: colors.badge,
      delay_color: colors.delay,
      _record: rec
    };
  });

  const by = (s) => table.filter((r) => r.status === s);
  return {
    table,
    total: table.length,
    ontime: by("On Time"), delayed: by("Delayed"), critical: by("Critical"), pending: by("Pending"),
    weekWindow: AK.date(weekStart) + " to " + AK.date(TODAY)
  };
}

/**
 * getKPITableData() — this function existed in delugefunctions.txt with
 * real logic (order delays, rework, man-hours), but the original
 * widget.html never actually called it anywhere; every other field it
 * computed ("nill" placeholders for planned/actual production,
 * delivery-collection, stock shortages, complaints, BOM accuracy,
 * indirect expense) had no real source and is skipped here too. Only the
 * three metrics that were genuinely computed are ported: order delays,
 * rework cases, and man-hours logged — each for today and for the
 * rolling week. Added per the doc's "Today's & Weekly overview Panel".
 */
function calcTodayWeeklyOverview() {
  const weekStart = startOfWeek(TODAY);

  // order_delays_*_count — Order_Confirmation rows committed in the period
  // with no Actual_Delivery_Date yet.
  const delaysIn = (from, to) => D.orderConfirmation.filter((o) => {
    if (!inRange(o[F.orderConfirmation.committedDate], from, to)) return false;
    return AK.isNil(o[F.orderConfirmation.actualDate]);
  });
  const delaysToday = delaysIn(TODAY, TODAY);
  const delaysWeek = delaysIn(weekStart, TODAY);

  // reworks_*_count — same Rework report as the Quality tiles, different windows.
  const reworkIn = (from, to) => D.rework.filter((r) => inRange(r[F.rework.date], from, to));
  const reworkToday = reworkIn(TODAY, TODAY);
  const reworkWeek = reworkIn(weekStart, TODAY);

  // man_hours_* — Add_Work_Order_SERVO.Man_Hours summed over work orders in the period.
  const hoursIn = (from, to) => {
    const rows = D.workOrder.filter((w) => inRange(w[F.workOrder.date], from, to) && !AK.isNil(w[F.workOrder.manHours]));
    return { rows, total: sum(rows, (w) => num(w[F.workOrder.manHours])) };
  };
  const hoursToday = hoursIn(TODAY, TODAY);
  const hoursWeek = hoursIn(weekStart, TODAY);

  return {
    delaysToday, delaysWeek, reworkToday, reworkWeek, hoursToday, hoursWeek,
    weekWindow: AK.date(weekStart) + " to " + AK.date(TODAY)
  };
}

/**
 * getQualityComplaintsAndRework() — literally filters to TODAY on both
 * sides (Date_field >= today && Date_field <= today), despite an unused
 * week_start variable in the original. Ported exactly.
 */
function calcQualityToday() {
  const rework = D.rework.filter((r) => {
    const d = AK.parseDate(r[F.rework.date]);
    return d && d.getTime() === TODAY.getTime();
  });
  const rejection = D.rejection.filter((r) => {
    const d = AK.parseDate(r[F.rejection.date]);
    return d && d.getTime() === TODAY.getTime();
  });
  return { rework, rejection };
}

/** reworkTrendWeekly/Monthly/Yearly() — shared shape. Denominator has no Status filter. */
function calcReworkTrend(periods) {
  const items = periods.map((p) => {
    const reworkRows = D.rework.filter((r) => inRange(r[F.rework.date], p.start, p.end));
    const totalProd = D.workOrder.filter((w) => inRange(w[F.workOrder.date], p.start, p.end));
    const pct = totalProd.length > 0 ? round((reworkRows.length * 100) / totalProd.length, 1) : 0;
    return {
      label: p.label,
      count: reworkRows.length,
      percentage: pct,
      status: pct < 3 ? "within" : "above",
      _rework: reworkRows,
      _totalProd: totalProd
    };
  });

  let scaleMax = Math.max(0, ...items.map((i) => i.count));
  if (scaleMax === 0) scaleMax = 1;

  items.forEach((i) => {
    let h = round((i.count * 80) / scaleMax, 2);
    if (h < 5 && i.count > 0) h = 5;
    i.bar_height = h;
  });

  return { items, scaleMax, yTicks: [0.25, 0.5, 0.75, 1].map((f) => round(scaleMax * f, 0)) };
}

function calcReworkWeekly() {
  const monthStart = startOfMonth(TODAY);
  const monthEnd = endOfMonth(TODAY);
  const periods = [];
  for (let w = 0; w < 5; w++) {
    const start = addDays(monthStart, w * 7);
    if (start > monthEnd) break;
    let end = addDays(start, 6);
    if (end > monthEnd) end = monthEnd;
    periods.push({ label: "Week " + (w + 1), start, end });
  }
  return calcReworkTrend(periods);
}
function calcReworkMonthly() {
  const year = TODAY.getFullYear();
  const periods = [];
  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1);
    if (start > TODAY) break;
    periods.push({ label: MONTH_NAMES[m], start, end: endOfMonth(start) });
  }
  return calcReworkTrend(periods);
}
function calcReworkYearly() {
  const year = TODAY.getFullYear();
  const periods = [];
  for (let y = year - 4; y <= year; y++) {
    periods.push({ label: String(y), start: new Date(y, 0, 1), end: new Date(y, 11, 31) });
  }
  return calcReworkTrend(periods);
}

/** getMaintenanceData() */
function calcMaintenance() {
  const records = D.preventiveMaintenance.filter((r) => !AK.isNil(r[F.preventiveMaintenance.maintenanceDate]));

  const freqCount = (freq) => ({ "Monthly": 12, "3 Months": 4, "6 Months": 2, "Annually": 1 }[freq] || 0);

  const buckets = {
    machine: { planned: 0, completed: 0, records: [] },
    vehicle: { planned: 0, completed: 0, records: [] },
    calibration: { planned: 0, completed: 0, records: [] }
  };
  let totalPlanned = 0, totalCompleted = 0;

  records.forEach((rec) => {
    const fc = freqCount(text(rec[F.preventiveMaintenance.frequency]));
    const isCompleted = AK.isNil(rec[F.preventiveMaintenance.dueDate]) ? 0 : 1;
    const type = text(rec[F.preventiveMaintenance.type]);

    let bucket = null;
    if (type.indexOf("Maintenance") >= 0) bucket = buckets.machine;
    else if (type.indexOf("Servicing And Oil Check") >= 0) bucket = buckets.vehicle;
    else if (type.indexOf("Calibration") >= 0) bucket = buckets.calibration;

    if (bucket) {
      bucket.planned += fc;
      bucket.completed += isCompleted;
      bucket.records.push(rec);
    }
    totalPlanned += fc;
    totalCompleted += isCompleted;
  });

  const compliancePct = totalPlanned > 0 ? round((totalCompleted * 100) / totalPlanned, 0) : 0;

  return {
    machine: buckets.machine, vehicle: buckets.vehicle, calibration: buckets.calibration,
    total_planned: totalPlanned, total_completed: totalCompleted, compliance_pct: compliancePct,
    _all: records
  };
}

/**
 * topFiveRedTagItemsByValue() — see the file-header notes for the two bugs
 * fixed here (off-by-one count, reversed aging direction). Set
 * CFG.PARITY.redTagTopSix / reverseRedTagAging to true to reproduce the
 * original behaviour exactly.
 */
function calcTopRedTag() {
  const lastMonth = addMonths(TODAY, -1);
  const candidates = D.product
    .filter((p) => (p[F.product.isRedTag] === true || p[F.product.isRedTag] === "true") &&
      inRange(p[F.product.lastOrderDate], new Date(1970, 0, 1), lastMonth))
    .slice()
    .sort((a, b) => num(b[F.product.price]) - num(a[F.product.price]));

  const take = CFG.PARITY.redTagTopSix ? 6 : 5;
  const top = candidates.slice(0, take);

  return top.map((p) => {
    const lastOrder = AK.parseDate(p[F.product.lastOrderDate]);
    const agingDays = CFG.PARITY.reverseRedTagAging
      ? daysBetween(TODAY, lastOrder)         // reproduces the original (usually negative)
      : (lastOrder ? daysBetween(lastOrder, TODAY) : 0);

    let priority;
    if (agingDays > 100) priority = "Critical";
    else if (agingDays > 70) priority = "High";
    else if (agingDays > 50) priority = "Medium";
    else priority = "Low";

    return {
      item_name: text(p[F.product.name]),
      value: num(p[F.product.price]),
      aging_days: agingDays,
      priority: priority,
      _record: p
    };
  });
}

/* ----------------------------------------------------------------
   5. RENDER
   ---------------------------------------------------------------- */

function notConnectedPanel(items) {
  const list = (Array.isArray(items) ? items : [items]).map((t) => "<li>" + esc(t) + "</li>").join("");
  return "<div style='padding:24px;background:#fafbfc;border:1px dashed #d1d5db;border-radius:8px;color:#6b7280;font-size:13px;line-height:1.6'>" +
    "<div style='font-weight:600;color:#374151;margin-bottom:8px'><i class='fas fa-plug' style='margin-right:6px;color:#9ca3af'></i>Not connected to data</div>" +
    "<div style='margin-bottom:8px'>This panel had no Deluge function behind it in the original template — every number was a literal typed into the page (e.g. <code>bom_accuracy = 97;</code>). Nothing has been invented here to fill it in.</div>" +
    "<ul style='margin:0 0 8px 18px;padding:0'>" + list + "</ul>" +
    "<div>See the &ldquo;To Verify&rdquo; sheet of Adroit_Dashboard_Report_Fields.xlsx (Production dashboard) for what source and calculation each one would need.</div>" +
    "</div>";
}

function renderBarChart(containerId, buckets, drillPrefix, report, cols, subtitleFn) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!buckets.length) {
    el.innerHTML = AK.emptyPanel("No work orders found in this period.", 260);
    return;
  }

  buckets.forEach((b, i) => {
    const pKey = drillPrefix + ".p." + i, aKey = drillPrefix + ".a." + i;
    SRC[pKey] = b._planned; SRC[aKey] = b._actual;
    drill(pKey, "Planned Work Orders — " + b.label, report, cols, pKey, subtitleFn(b, "planned"),
      "No work order (other than Draft) falls in this period.");
    drill(aKey, "Completed Work Orders — " + b.label, report, cols, aKey, subtitleFn(b, "actual"),
      "No work order was completed in this period.");
  });

  AK.mountChart(containerId, {
    chart: {
      type: "bar", height: 300, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: {
        dataPointSelection: (ev, ctx, opts) =>
          AK.openDrill(drillPrefix + "." + (opts.seriesIndex === 0 ? "p" : "a") + "." + opts.dataPointIndex)
      }
    },
    series: [
      { name: "Planned", data: buckets.map((b) => num(b.planned_count)) },
      { name: "Actual", data: buckets.map((b) => num(b.actual_count)) }
    ],
    xaxis: { categories: buckets.map((b) => b.label) },
    colors: AK.categoricalColors(2),
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => AK.int(v) } }
  });
}

function renderDeliveryTrend(trend) {
  const el = document.getElementById("delivery-chart");
  if (!el) return;
  const R = CFG.reports.orderConfirmation;

  if (!trend.weeks.length) {
    el.innerHTML = AK.emptyPanel("No orders dated this month yet.", 260);
    return;
  }

  trend.weeks.forEach((w, i) => {
    const key = "delivery." + i;
    SRC[key] = w._orders;
    drill(key, "Orders — " + w.week, R, COLS.order, key,
      w.week + " (" + w.week_start + " – " + w.week_end + "), by order Date_field",
      "No order was dated in this week.");
  });

  AK.mountChart("delivery-chart", {
    chart: {
      type: "bar", height: 300, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill("delivery." + opts.dataPointIndex) }
    },
    series: [{ name: "On-Time %", data: trend.weeks.map((w) => num(w.ontime_percentage)) }],
    xaxis: { categories: trend.weeks.map((w) => w.week) },
    yaxis: { max: 100 },
    plotOptions: {
      bar: {
        borderRadius: 4, columnWidth: "50%",
        colors: {
          ranges: [
            { from: 0, to: 79.999, color: AK.chartColors.critical },
            { from: 80, to: 94.999, color: AK.chartColors.warning },
            { from: 95, to: 100, color: AK.chartColors.good }
          ]
        }
      }
    },
    annotations: {
      yaxis: [{
        y: 95, borderColor: "#6b7280", strokeDashArray: 4,
        label: { text: "Target 95%", style: { color: "#374151", background: "#f3f4f6" } }
      }]
    },
    dataLabels: { enabled: true, formatter: (v) => v.toFixed(0) + "%" },
    tooltip: {
      y: {
        formatter: (v, opts) => {
          const w = trend.weeks[opts.dataPointIndex];
          return v + "% (" + AK.int(w.ontime_count) + " of " + AK.int(w.total_orders) + " orders)";
        }
      }
    },
    grid: { borderColor: "#e5e7eb" }
  });
}

/**
 * KPI Performance Trend — On-Time Delivery, last 3 months (including the
 * current, partial month). Computed from All_Order_Confirmations the exact
 * same way calcDeliveryTrend() above computes the weekly version — this was
 * flagged as a genuine quick follow-up rather than a missing-data problem.
 * The spec doc also wants BOM Accuracy % and Rework % as second/third lines
 * on this chart; those stay unconnected since neither has a data source
 * anywhere in this app yet (see the Production Not-Connected sheet).
 */
function calcMonthlyOnTimeTrend() {
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const monthDate = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
    const start = startOfMonth(monthDate);
    let end = endOfMonth(monthDate);
    if (end > TODAY) end = TODAY;

    const orders = D.orderConfirmation.filter((o) => inRange(o[F.orderConfirmation.date], start, end));
    const ontime = orders.filter((o) => {
      const actual = AK.parseDate(o[F.orderConfirmation.actualDate]);
      const committed = AK.parseDate(o[F.orderConfirmation.committedDate]);
      return actual && committed && actual <= committed;
    });
    const pct = orders.length > 0 ? round((ontime.length * 100) / orders.length, 2) : 0;

    months.push({
      label: MONTH_NAMES[monthDate.getMonth()] + " " + monthDate.getFullYear(),
      month_start: AK.date(start), month_end: AK.date(end),
      total_orders: orders.length, ontime_count: ontime.length, ontime_percentage: pct,
      _orders: orders
    });
  }
  return { months };
}

function renderKpiTrend(trend) {
  const container = document.getElementById("kpi-trend-container");
  if (!container) return;
  const R = CFG.reports.orderConfirmation;

  if (!trend.months.some((m) => m.total_orders > 0)) {
    container.innerHTML = AK.emptyPanel("No orders dated in the last 3 months yet.", 260);
    return;
  }

  container.innerHTML =
    "<div id='kpi-trend-chart'></div>" +
    "<div style='padding:10px 4px 0;font-size:12px;color:#6b7280'>" +
    "The spec doc also wants BOM Accuracy % and Rework % as lines on this chart — both stay " +
    "not connected until a data source exists for them (see the Production Not-Connected sheet)." +
    "</div>";

  trend.months.forEach((m, i) => {
    const key = "kpiTrend." + i;
    SRC[key] = m._orders;
    drill(key, "Orders — " + m.label, R, COLS.order, key,
      m.label + " (" + m.month_start + " – " + m.month_end + "), by order Date_field",
      "No order was dated in " + m.label + ".");
  });

  AK.mountChart("kpi-trend-chart", {
    chart: {
      type: "line", height: 280, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill("kpiTrend." + opts.dataPointIndex) }
    },
    series: [{ name: "On-Time Delivery %", data: trend.months.map((m) => m.ontime_percentage) }],
    xaxis: { categories: trend.months.map((m) => m.label) },
    yaxis: { max: 100, min: 0 },
    colors: [AK.chartColors.blue],
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 6, hover: { size: 8 } },
    annotations: {
      yaxis: [{
        y: 95, borderColor: "#6b7280", strokeDashArray: 4,
        label: { text: "Target 95%", style: { color: "#374151", background: "#f3f4f6" } }
      }]
    },
    dataLabels: { enabled: true, formatter: (v) => v.toFixed(0) + "%" },
    tooltip: {
      y: {
        formatter: (v, opts) => {
          const m = trend.months[opts.dataPointIndex];
          return v + "% (" + AK.int(m.ontime_count) + " of " + AK.int(m.total_orders) + " orders)";
        }
      }
    },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderOrderDelayStatus(d) {
  const R = CFG.reports.orderConfirmation;

  SRC["ord.ontime"] = d.ontime.map((r) => r._record);
  SRC["ord.delayed"] = d.delayed.map((r) => r._record);
  SRC["ord.critical"] = d.critical.map((r) => r._record);
  SRC["ord.pending"] = d.pending.map((r) => r._record);
  SRC["ord.all"] = d.table.map((r) => r._record);

  drill("ord.total", "Orders This Week", R, COLS.order, "ord.all", "Committed " + d.weekWindow);
  drill("ord.ontime", "On-Time Orders", R, COLS.order, "ord.ontime", "Committed " + d.weekWindow + ", delivered on or before commitment",
    "No order in this window was delivered on time.");
  drill("ord.delayed", "Delayed Orders", R, COLS.order, "ord.delayed", "Delivered, but after the committed date",
    "No delivered order missed its committed date.");
  drill("ord.critical", "Critical Orders", R, COLS.order, "ord.critical", "Not yet delivered, past the committed date",
    "Nothing in this window is overdue.");
  drill("ord.pending", "Pending Orders", R, COLS.order, "ord.pending", "Not yet delivered, committed date not yet reached",
    "Every order in this window has either been delivered or is already overdue.");

  AK.set("ord-total", cnt(d.total), "ord.total");
  AK.set("ord-ontime", cnt(d.ontime.length), "ord.ontime");
  AK.set("ord-delayed", cnt(d.delayed.length), "ord.delayed");
  AK.set("ord-critical", cnt(d.critical.length), "ord.critical");
  AK.set("ord-pending", cnt(d.pending.length), "ord.pending");

  const tbody = document.getElementById("order-delay-tbody");
  if (tbody) {
    tbody.innerHTML = d.table.length
      ? d.table.map((o, i) => {
        const rowBg = i % 2 === 1 ? "#f9f9fb" : "#ffffff";
        const delayCell = o.delay === 0
          ? "<span style='color:#28a745;font-weight:600'>&mdash;</span>"
          : "<span style='color:white;background:" + o.delay_color + ";font-weight:700;padding:3px 10px;border-radius:12px;font-size:12px;white-space:nowrap'>+" + cnt(o.delay) + " days</span>";
        const icon = { "On Time": "fa-check-circle", "Pending": "fa-clock", "Delayed": "fa-exclamation-circle" }[o.status] || "fa-times-circle";
        return "<tr style='background:" + rowBg + "'>" +
          "<td style='padding:12px;font-size:13px;border-bottom:1px solid #eee;white-space:nowrap'><strong style='color:#667eea'>" + esc(o.order_no) + "</strong></td>" +
          "<td style='padding:12px;font-size:13px;border-bottom:1px solid #eee;white-space:nowrap'>" + esc(o.customer) + "</td>" +
          "<td style='padding:12px;font-size:13px;border-bottom:1px solid #eee'>" + esc(o.product) + "</td>" +
          "<td style='padding:12px;font-size:13px;border-bottom:1px solid #eee;white-space:nowrap'>" + esc(o.committed_date) + "</td>" +
          "<td style='padding:12px;font-size:13px;border-bottom:1px solid #eee;white-space:nowrap'>" + esc(o.actual_dispatch) + "</td>" +
          "<td style='padding:12px;font-size:13px;border-bottom:1px solid #eee;text-align:center'>" + delayCell + "</td>" +
          "<td style='padding:12px;font-size:13px;border-bottom:1px solid #eee;color:#555'>" + esc(o.reason) + "</td>" +
          "<td style='padding:12px;font-size:13px;border-bottom:1px solid #eee;text-align:center'><span class='status-badge " + o.status_color + "'><i class='fas " + icon + "'></i> " + esc(o.status) + "</span></td></tr>";
      }).join("")
      : "<tr><td colspan='8' style='padding:40px;text-align:center;color:#999;font-size:14px'><i class='fas fa-inbox' style='font-size:32px;display:block;margin-bottom:10px;color:#ccc'></i>No orders found for this week</td></tr>";
    AK.autoBind(tbody);
  }

  AK.set("order-footer",
    "Showing " + cnt(d.total) + " order(s) committed " + d.weekWindow + " · scroll horizontally if columns are cut off");
}

function renderTodayWeeklyOverview(o) {
  const R = { workOrder: CFG.reports.workOrder, order: CFG.reports.orderConfirmation, rework: CFG.reports.rework };

  SRC.tw_delaysToday = o.delaysToday;
  SRC.tw_delaysWeek = o.delaysWeek;
  SRC.tw_reworkToday = o.reworkToday;
  SRC.tw_reworkWeek = o.reworkWeek;
  SRC.tw_hoursToday = o.hoursToday.rows;
  SRC.tw_hoursWeek = o.hoursWeek.rows;

  drill("tw.delaysToday", "Order Delays — Today", R.order, COLS.order, "tw_delaysToday",
    "Orders committed today with no Actual Delivery Date yet", "Nothing committed today is undelivered.");
  drill("tw.delaysWeek", "Order Delays — This Week", R.order, COLS.order, "tw_delaysWeek",
    "Orders committed " + o.weekWindow + " with no Actual Delivery Date yet", "Nothing committed this week is undelivered.");
  drill("tw.reworkToday", "Rework Cases — Today", R.rework, COLS.rework, "tw_reworkToday",
    "Rework dated today", "No rework was logged today.");
  drill("tw.reworkWeek", "Rework Cases — This Week", R.rework, COLS.rework, "tw_reworkWeek",
    "Rework dated " + o.weekWindow, "No rework was logged this week.");
  drill("tw.hoursToday", "Man-Hours Logged — Today", R.workOrder, COLS.workOrder, "tw_hoursToday",
    "Work orders dated today with Man_Hours filled in", "No work order logged man-hours today.");
  drill("tw.hoursWeek", "Man-Hours Logged — This Week", R.workOrder, COLS.workOrder, "tw_hoursWeek",
    "Work orders dated " + o.weekWindow + " with Man_Hours filled in", "No work order logged man-hours this week.");

  const tile = (title, value, drillKey, target) =>
    "<div class='tile'><div class='tile-title'>" + esc(title) + "</div>" +
    "<div class='tile-value' data-drill='" + drillKey + "'>" + value + "</div>" +
    "<div class='tile-target'>" + esc(target) + "</div></div>";

  const el = document.getElementById("today-weekly-tiles");
  if (!el) return;
  el.innerHTML =
    tile("Order Delays (Today)", cnt(o.delaysToday.length), "tw.delaysToday", "Committed today, not yet delivered") +
    tile("Order Delays (This Week)", cnt(o.delaysWeek.length), "tw.delaysWeek", o.weekWindow) +
    tile("Rework Cases (Today)", cnt(o.reworkToday.length), "tw.reworkToday", "Target: ≤ 3%") +
    tile("Rework Cases (This Week)", cnt(o.reworkWeek.length), "tw.reworkWeek", o.weekWindow) +
    tile("Man-Hours Logged (Today)", cnt(o.hoursToday.total), "tw.hoursToday", "Across " + cnt(o.hoursToday.rows.length) + " work order(s)") +
    tile("Man-Hours Logged (This Week)", cnt(o.hoursWeek.total), "tw.hoursWeek", o.weekWindow);

  AK.autoBind(el);
}

function renderQualityToday(q) {
  SRC.reworkToday = q.rework;
  SRC.rejectionToday = q.rejection;
  drill("quality.rework", "Rework Cases (Today)", CFG.reports.rework, COLS.rework, "reworkToday",
    "Rework dated today", "No rework was logged today.");
  drill("quality.rejection", "Rejection Cases (Today)", CFG.reports.rejection, COLS.rejection, "rejectionToday",
    "Rejections dated today", "Nothing was rejected today.");

  AK.set("val-rework-count", cnt(q.rework.length), "quality.rework");
  AK.set("val-rejection-count", cnt(q.rejection.length), "quality.rejection");
}

function renderReworkTrend(prefix, trend, periodLabel) {
  const el = document.getElementById(prefix + "-chart");
  if (!el) return;

  if (!trend.items.length) {
    el.innerHTML = AK.emptyPanel("No " + periodLabel + " data yet.", 240);
    return;
  }

  trend.items.forEach((it, i) => {
    const key = prefix + "." + i;
    SRC[key] = it._rework;
    drill(key, "Rework — " + it.label, CFG.reports.rework, COLS.rework, key,
      it.label + ": " + cnt(it.count) + " rework of " + cnt(it._totalProd.length) + " work orders (" + pctOf(it.percentage) + ")",
      "No rework was logged in " + it.label + ".");
  });

  AK.mountChart(prefix + "-chart", {
    chart: {
      type: "bar", height: 280, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill(prefix + "." + opts.dataPointIndex) }
    },
    series: [{ name: "Rework %", data: trend.items.map((it) => num(it.percentage)) }],
    xaxis: { categories: trend.items.map((it) => it.label) },
    plotOptions: {
      bar: {
        borderRadius: 4, columnWidth: "50%",
        colors: {
          ranges: [
            { from: 0, to: 2.999, color: AK.chartColors.good },
            { from: 3, to: 100000, color: AK.chartColors.warning }
          ]
        }
      }
    },
    annotations: {
      yaxis: [{
        y: 3, borderColor: "#6b7280", strokeDashArray: 4,
        label: { text: "Target < 3%", style: { color: "#374151", background: "#f3f4f6" } }
      }]
    },
    dataLabels: { enabled: true, formatter: (v) => v.toFixed(1) + "%" },
    tooltip: {
      y: {
        formatter: (v, opts) => {
          const it = trend.items[opts.dataPointIndex];
          return v.toFixed(1) + "% (" + AK.int(it.count) + " of " + AK.int(it._totalProd.length) + " work orders)";
        }
      }
    },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderMaintenance(m) {
  const R = CFG.reports.preventiveMaintenance;
  SRC["maint.machine"] = m.machine.records;
  SRC["maint.vehicle"] = m.vehicle.records;
  SRC["maint.calibration"] = m.calibration.records;

  drill("maint.machine", "Machine Maintenance Records", R, COLS.maintenance, "maint.machine",
    'Type_of_Maintenance contains "Maintenance"', "No machine maintenance record found.");
  drill("maint.vehicle", "Vehicle Service Records", R, COLS.maintenance, "maint.vehicle",
    'Type_of_Maintenance contains "Servicing And Oil Check"', "No vehicle service record found.");
  drill("maint.calibration", "Calibration Records", R, COLS.maintenance, "maint.calibration",
    'Type_of_Maintenance contains "Calibration"', "No calibration record found.");

  const row = (label, freq, bucket, key) => {
    const target = bucket.planned > 0 ? bucket.planned : 1;
    const good = bucket.completed === bucket.planned && bucket.planned > 0;
    return "<tr><td>" + esc(label) + "</td><td>" + esc(freq) + "</td>" +
      "<td data-drill='" + key + "'>" + cnt(bucket.completed) + "/" + cnt(bucket.planned) + "</td><td>-</td>" +
      "<td><div class='progress-container' style='--current:" + bucket.completed + ";--target:" + target + "'>" +
      "<div class='progress-bar" + (good ? " good" : "") + "'></div></div></td></tr>";
  };

  const tbody = document.getElementById("maintenance-tbody");
  if (tbody) {
    tbody.innerHTML =
      row("Machine Maintenance", "3 months", m.machine, "maint.machine") +
      row("Vehicle Service", "2 months", m.vehicle, "maint.vehicle") +
      row("Calibration", "Monthly", m.calibration, "maint.calibration");
    AK.autoBind(tbody);
  }

  AK.set("maint-planned-label", cnt(m.total_planned) + " activities");
  AK.set("maint-completed-label", cnt(m.total_completed) + " completed (" + pctOf(m.compliance_pct, 0) + ")");
  const fill = document.getElementById("maint-compliance-fill");
  if (fill) {
    const pct = m.compliance_pct > 100 ? 100 : m.compliance_pct;
    fill.style.width = pct + "%";
    fill.textContent = pctOf(m.compliance_pct, 0);
    fill.className = "h-bar-fill " + (m.compliance_pct >= 100 ? "h-bar-low" : m.compliance_pct >= 60 ? "h-bar-medium" : "h-bar-high");
  }
}

function renderRedTag(items) {
  const R = CFG.reports.product;
  const tbody = document.getElementById("redtag-tbody");
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center;color:#999;padding:20px'>No red-tag items found</td></tr>";
    return;
  }

  const badge = (p) => ({
    "Critical": { cls: "status-red", icon: "fa-exclamation-triangle" },
    "High": { cls: "status-red", icon: "fa-exclamation-circle" },
    "Medium": { cls: "status-yellow", icon: "fa-exclamation-circle" },
    "Low": { cls: "status-green", icon: "fa-check" }
  }[p]);

  tbody.innerHTML = items.map((item, i) => {
    const key = "redtag." + i;
    SRC[key] = [item._record];
    drill(key, "Red-Tag Item — " + item.item_name, R, COLS.product, key,
      "Is_Red_Tag_Material = true, last ordered " + AK.date(item._record[F.product.lastOrderDate]));
    const b = badge(item.priority);
    return "<tr data-drill='" + key + "'><td>" + esc(item.item_name) + "</td><td>" + rupees(item.value) + "</td>" +
      "<td>" + cnt(item.aging_days) + " days</td>" +
      "<td><span class='status-badge " + b.cls + "'><i class='fas " + b.icon + "'></i> " + esc(item.priority) + "</span></td></tr>";
  }).join("");

  AK.autoBind(tbody);
}

/* ----------------------------------------------------------------
   6. MAIN
   ---------------------------------------------------------------- */
async function main() {
  AK.init({ name: "productionOverview" });

  const el = (id) => document.getElementById(id);
  el("prod-date").textContent = AK.date(TODAY);

  // v2 JS API needs no ZOHO.CREATOR.init() call.

  try {
    const keys = Object.keys(CFG.reports);
    const labels = {
      workOrder: "Work Order (SERVO)", orderConfirmation: "Order Confirmation",
      rework: "Rework", rejection: "Rejection Module",
      preventiveMaintenance: "Preventive Maintenance", product: "Product"
    };
    const results = await Promise.all(keys.map((k) => fetchReport(k, labels[k])));
    keys.forEach((k, i) => { D[k] = results[i]; });

    const failed = Object.keys(FETCH_FAILURES);
    if (failed.length) {
      el("notice-container").innerHTML =
        "<div class='warn-banner' style='background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:8px;padding:12px 16px;margin:12px 0;font-size:13px;color:#92400e'>" +
        "<b>Some reports could not be loaded — the numbers below are incomplete</b><ul style='margin:6px 0 0 18px'>" +
        failed.map((r) => "<li>" + esc(r) + ": " + esc(FETCH_FAILURES[r]) + "</li>").join("") + "</ul></div>";
    }

    // ---- real, data-backed panels ----
    renderTodayWeeklyOverview(calcTodayWeeklyOverview());
    renderBarChart("prod-weekly-chart", calcProductionWeekly(), "prod.w", CFG.reports.workOrder, COLS.workOrder,
      (b, kind) => b.label + " of this month, " + (kind === "planned" ? "Status ≠ Draft" : "Status = Completed"));
    renderBarChart("prod-monthly-chart", calcProductionMonthly(), "prod.m", CFG.reports.workOrder, COLS.workOrder,
      (b, kind) => b.label + " " + TODAY.getFullYear() + ", " + (kind === "planned" ? "Status ≠ Draft" : "Status = Completed"));
    renderBarChart("prod-yearly-chart", calcProductionYearly(), "prod.y", CFG.reports.workOrder, COLS.workOrder,
      (b, kind) => b.label + ", " + (kind === "planned" ? "Status ≠ Draft" : "Status = Completed"));

    renderDeliveryTrend(calcDeliveryTrend());
    renderOrderDelayStatus(calcOrderDelayStatus());
    renderQualityToday(calcQualityToday());
    renderReworkTrend("rework-weekly", calcReworkWeekly(), "weekly");
    renderReworkTrend("rework-monthly", calcReworkMonthly(), "monthly");
    renderReworkTrend("rework-yearly", calcReworkYearly(), "yearly");
    renderMaintenance(calcMaintenance());
    renderRedTag(calcTopRedTag());
    renderKpiTrend(calcMonthlyOnTimeTrend());

    // ---- panels with no Deluge function behind them at all ----
    // Messages below are cross-checked against dashboard_docs/Production_Dashboard.docx.
    // Its own "Changes required in field" section confirms several of these need a
    // NEW field added to the Zoho app — they are not just unconfirmed link names,
    // the field genuinely does not exist yet.
    el("complaint-breakdown-container").innerHTML = notConnectedPanel(
      "Per the spec doc: “customer complaint due to production like wiring loose connection, Quality check” " +
      "is listed under Changes Required — confirmed as a field that still needs to be added, not just an unconfirmed " +
      "link name. Needs a complaint log with a date and a type (Wiring Loose / Finish Issue / Other, per the doc's own " +
      "category names).");
    el("material-bom-container").innerHTML = notConnectedPanel([
      "Production Stops (Parts) — the doc lists “if there any production stop or production delay due to non-" +
      "availability of item” under Changes Required. Needs a stoppage-event log.",
      "Inventory Holding Value — the doc's target is < ₹5L (its alert threshold is inconsistently written as " +
      "“red if >₹50k” elsewhere in the same doc — worth confirming which figure is right). Needs a stock valuation report.",
      "Red-Tag Items (count) — could reuse All_Product like the Top 5 table below, but no count tile was ever wired",
      "Parts Awaiting from Store — needs a material-request/backorder report"
    ]);
    el("material-shortage-container").innerHTML = notConnectedPanel(
      "A function named getMaterialShortageImpackWeekly() exists in delugefunctions.txt, but it actually computes " +
      "planned work-order counts per week (identical to the Production Performance panel above) — it does not " +
      "compute material shortages, and the page never called it. Reusing it here would just duplicate that panel " +
      "under a misleading title. The spec doc calls for a “Material Shortage Trend – Line chart” but " +
      "doesn't name a source either — needs someone to define what a material-shortage event actually is.");
    el("products-expense-container").innerHTML = notConnectedPanel(
      "The doc gives the exact columns wanted: Order No, Product, Man-Hours, Labour Cost, Transport, Cutting, Powder " +
      "Coating, Other Outsource, Total Indirect Cost, % of Order Value. Man-Hours is now real (see Today's & Weekly " +
      "Overview above) — but the doc's own Changes Required section confirms the per-order cost breakdown " +
      "(“indirect expense like transportation... a single cutting charges and powder coating charges we take the " +
      "product and get it done from our fabricator”) is a NEW requirement with no field yet.");
    el("inventory-material-container").innerHTML = notConnectedPanel([
      "Holding Days — doc target: < 30 days (red if > 65)",
      "Inventory Value — needs the same stock valuation source as the Material/BOM panel above",
      "Material Shortages — doc target: 0 orders affected (alert if > 0) — same open question as the Material Shortage panel above"
    ]);
    el("improvement-training-container").innerHTML = notConnectedPanel([
      "Kaizen / Six Sigma Activities — target ≥ 2/month. Doc's Changes Required: “Six sigma and Kaizen " +
      "include as field as well KPI for individual” — confirmed as not yet a field.",
      "Design Improvements — target ≥ 1/month, no source",
      "Internal / External Training + Training Expenses — doc's Changes Required: “Internal and external " +
      "training for production people given or not and expenses for the same” — confirmed as not yet a field.",
      "Risk Items Updated — doc asks for a Risk Matrix (High/Medium/Low heat map) — “Risk Matrix if " +
      "required” in Changes Required, so even the doc treats this as optional/undecided."
    ]);
    el("improvement-savings-container").innerHTML = notConnectedPanel(
      "Needs the same Kaizen/Improvements log as the panel above, with a cost-saving amount per entry, to chart " +
      "“Improvements Implemented vs Cost Savings” as the doc names it.");
    el("individual-kpi-container").innerHTML = notConnectedPanel([
      "The doc's Changes Required section is explicit: “individual performance report submitted for each " +
      "production people by the head (KPI as well as should be added in the field)” — this whole table needs " +
      "a new per-person tracking form, not just a report read.",
      "Two rows already have a real source elsewhere on this dashboard and just need pulling into a per-KPI table: " +
      "Rework % (see Rework Trend) and Preventive Maintenance Compliance % (see Maintenance Compliance panel).",
      "The rest — % Orders Delivered on Time, % Designs Released on Time, BOM Accuracy, Stoppages due to Missing " +
      "Parts, Manhour Variance, Indirect Expense Control, Red Tag Reduction, Submission Timeliness, Accuracy of " +
      "Reports — each need their own source; targets are in the doc's KPI table if you want to wire them up next."
    ]);

    AK.autoBind(document);
    AK.report();

    console.groupCollapsed("%c[productionOverview] panels with no data source (left as 'Not connected')", "color:#b45309;font-weight:bold");
    CFG.NOT_CONNECTED.forEach((p) => console.log("•", p));
    console.groupEnd();

    console.log("%c[productionOverview] ready — click any count to see the records behind it.",
      "color:#15803d;font-weight:bold");

    // One-time field discovery for every report this dashboard reads — paste the console
    // output back to fix any remaining guessed field name in one pass. Safe to delete once
    // every field in CFG.fields is confirmed against real data.
    AK.discoverAllFields(CFG.reports);
  } catch (err) {
    console.error("[productionOverview] fatal:", err);
    el("notice-container").innerHTML =
      "<div class='widget-status' style='padding:40px 20px;text-align:center;color:#b91c1c'>Dashboard failed to load: " +
      esc(AK.describeError(err)) + "<br><span style='font-size:12px;color:#6b7280'>Full details are in the browser console.</span></div>";
  }
}

document.addEventListener("DOMContentLoaded", main);

// Several charts live inside collapsed <details> sections. ApexCharts measures
// its container's width at mount time, and a closed <details> renders at 0
// width — so a chart mounted while collapsed can come out squashed. Firing a
// resize event when a section opens makes ApexCharts re-measure and redraw.
document.addEventListener("toggle", function (ev) {
  if (ev.target && ev.target.tagName === "DETAILS" && ev.target.open) {
    window.dispatchEvent(new Event("resize"));
  }
}, true);
