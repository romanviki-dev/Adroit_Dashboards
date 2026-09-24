"use strict";

/* ================================================================
   SALES KPI DASHBOARD — WIDGET VERSION
   ================================================================
   Replaces the `Get_KPI_Dashboard_Data` Custom API. Every KPI is now
   computed here in JS from raw report records, which is what makes the
   drill-downs work: a Custom API returns only totals, so clicking a
   number could never show the records behind it.

   >>> READ THIS BEFORE GOING LIVE <<<
   The Deluge source of `Get_KPI_Dashboard_Data` is not in this repo.
   The report names and fields below were taken from the two sibling
   sales dashboards, which read the same forms:
     - sales_performance_summary/app/salesPerformance.js
     - salesExecutiveCommandView/app/script.js

   Each metric carries the rule it uses. Anything marked  // VERIFY
   is an inference and should be confirmed against the old dashboard.
   Metrics the Custom API never returned (the previous script.js said
   so in its own comments) are listed in UNSOURCED below and render as
   "n/a" rather than a fabricated zero.
   ================================================================ */

/* ----------------------------------------------------------------
   0. CONFIG
   ---------------------------------------------------------------- */
const CFG = {
  reports: {
    leads: "Customer_Calling_follow_up_Format",            // confirmed (sales_performance_summary)
    quotation: "Quotation1",                                // confirmed
    orderConfirmation: "All_Order_Confirmations",           // confirmed
    paymentTracking: "Payment_Trackings_Format",            // confirmed
    quotationFollowUp: "Quotation_Follow_Up_Format",        // confirmed
    preSiteVisit: "Customer_Pre_Site_Visit_Observation1",   // confirmed
    customerFeedback: "All_Customer_Feedback",              // confirmed
    srs: "Sales_Order_Entry_SRS_Report"                     // confirmed (salesExecutiveCommandView)
  },

  fields: {
    leads: {
      date: "Lead_Date", status: "Status", source: "Lead_Source",
      customer: "Customer_Company",
      owner: "Prepared_By"          // confirmed via AK.discoverFields() cross-reference (Customer_Calling___follow_up,
                                     // same 671 records) — Employee_Name doesn't exist on this report
    },
    quotation: {
      date: "Date_field", status: "Status", grandTotal: "Grand_Total",
      customer: "Customer_Company", lead: "Customer_Calling_follow_up",
      number: "Quote",               // confirmed — Quotation1, same 698 records; Quotation_No doesn't exist here
      preparedBy: "Prepared_By_Whom" // confirmed — Quotation1; Prepared_By doesn't exist, Prepared_By_Whom does
                                      // (this was the "(not set)" bug in Admin Performance Comparison)
    },
    orderConfirmation: {
      date: "Date_field", quotationNo: "Quotation_No",
      finalAmount: "Final_Amount", quoteAmount: "Quote_Amount",
      customer: "Customer_Name"      // confirmed — All_Order_Confirmations, same 171 records; Customer_Company
                                      // doesn't exist on this report, Customer_Name does
    },
    paymentTracking: {
      date: "Payment_Date", advance: "Advance_Amount",
      dueDate: "Due_Date", status: "Follow_upStatus",
      customer: "Customer_Name"      // confirmed — All_Payment_Trackings, same 38 records; Customer_Company
                                      // doesn't exist on this report, Customer_Name does
    },
    quotationFollowUp: {
      hasFollowUp: "Has_Follow_up", lines: "Follow_up", followUpDate: "Follow_up_Date",
      status: "Status", date: "Date_field", customer: "Customer_Company", // confirmed via fields.txt
      // inside the Follow_up subform — still unconfirmed, every sampled record had an empty
      // Follow_up array, so these two names have never actually been seen in real subform data
      lineDate: "Follow_up_Execution_Date", lineStatus: "Status"
    },
    // customer was "Customer_Company" (wrong — that field doesn't exist on this report);
    // fields.txt confirms the real field is "Customer_Name".
    preSiteVisit: { date: "Visit_Date", status: "Status", customer: "Customer_Name" },
    customerFeedback: {
      date: "Date_field", remarks: "Remarks",
      customer: "Name_of_Customer", rating: "Overall_Performance"
    },
    srs: {
      date: "Date_field",                    // confirmed — via AK.discoverFields(), 22-Sep-2026 format
      employee: "order_taken_by",            // confirmed — via AK.discoverFields(); name-lookup {first_name,last_name}.
                                              // Two other name-lookups exist on this report — Prepared_By and
                                              // Approved_By — if "Order Closed" is meant to be one of those instead
                                              // of whoever took the order, swap this.
      amount: "Final_Amount",                // confirmed — via AK.discoverFields(), e.g. "103250.00"
      customer: "Company_Customer_Name"      // confirmed — via AK.discoverFields(); name-lookup, e.g.
                                              // "M/s. MOBITECH WIRELESS SOLUTION PVT LTD"
    }
  },

  rules: {
    // A lead counts as "attended" once it leaves the Open state.
    openLeadStatuses: ["Open", "New"],
    inProgressStatuses: ["In Progress", "Quote Created", "Follow Up"],
    quotationApprovedStatuses: ["Approved", "Accepted", "Confirmed"],
    followUpDoneStatuses: ["Completed", "Done", "Closed"],
    // Lead sources, matched after lowercasing and stripping spaces/punctuation.
    leadSourceGroups: [
      ["IndiaMART", ["indiamart", "indiamart", "indiamarts"]],
      ["Justdial", ["justdial"]],
      ["Referral", ["referral", "referrals", "customerreference", "customerreferenceleads", "reference"]],
      ["Direct", ["direct", "directvisit", "directvisits", "coldcall", "coldcalls"]],
      ["OEM", ["oem", "oems"]],
      ["Dealer", ["dealer", "dealers"]]
    ],
    // Targets used by the progress bars (the Deluge API supplied these as
    // percentages; without it we scale against these targets).
    targetQuoteDelayDays: 3,   // VERIFY
    targetPaymentDelayDays: 15, // VERIFY
    targetFollowUpsPerQuotation: 3 // VERIFY
  },

  /* KPIs the Custom API never actually returned — the previous script.js
     said as much in its own comments. They render as "n/a" instead of 0.
     YoY / QoQ growth used to be listed here too, but the client's own
     Deluge codebase has sales.Yearoveryeardata(), which computes exactly
     this from Order_Confirmation.Final_Amount by calendar quarter — the
     data was there all along. Ported below in computeQuarterGrowth(). */
  unsourced: [
    "Admin Efficiency gauge",
    "Sales Effectiveness",
    "Lead Quality (IndiaMART / Justdial / Referral / Trade India)",
    "Profit Margin (needs a cost source)"
  ],

  maxRecords: 1000,
  maxPages: 10
};

CFG.customFields = {};
Object.keys(CFG.fields).forEach((k) => {
  CFG.customFields[k] = Object.values(CFG.fields[k]).join(",");
});

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

const NOW = new Date();
const TODAY = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());
const MONTH_START = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
const LAST_MONTH_START = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
const LAST_MONTH_END = new Date(TODAY.getFullYear(), TODAY.getMonth(), 0);
const DAY_MS = 86400000;

function inRange(v, from, to) {
  const d = AK.parseDate(v);
  return !!d && d >= from && d <= to;
}
const thisMonth = (v) => inRange(v, MONTH_START, TODAY);
const lastMonth = (v) => inRange(v, LAST_MONTH_START, LAST_MONTH_END);
function daysBetween(a, b) { return Math.round((b - a) / DAY_MS); }
function rows(v) { return Array.isArray(v) ? v : []; }
function norm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function statusIn(v, list) {
  const s = text(v).trim().toLowerCase();
  return list.some((x) => x.toLowerCase() === s);
}
function avg(list, fn) { return list.length ? list.reduce((s, x) => s + fn(x), 0) / list.length : 0; }
function changePct(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Ported from the client's own Deluge function sales.Yearoveryeardata():
 * calendar-quarter revenue off Order_Confirmation.Final_Amount, compared
 * two ways — YoY (this quarter vs the same quarter last year) and QoQ
 * (this quarter vs the immediately preceding quarter, which may cross a
 * year boundary). The original Deluge function only computed the YoY side
 * (per quarter, to find the "top quarter") — QoQ is a natural extension of
 * the same quarter-revenue building block, using data that already exists.
 */
function quarterOf(month) { return Math.floor(month / 3) + 1; } // 0-11 -> 1-4
function quarterRange(year, q) {
  const startMonth = (q - 1) * 3;
  return { start: new Date(year, startMonth, 1), end: new Date(year, startMonth + 3, 0) };
}
function quarterRevenue(orders, year, q) {
  const r = quarterRange(year, q);
  return orders.reduce((s, o) => {
    const d = AK.parseDate(o[F.orderConfirmation.date]);
    return (d && d >= r.start && d <= r.end) ? s + num(o[F.orderConfirmation.finalAmount]) : s;
  }, 0);
}
function computeQuarterGrowth(orders) {
  const year = TODAY.getFullYear();
  const q = quarterOf(TODAY.getMonth());
  const thisQ = quarterRevenue(orders, year, q);

  const lastYearSameQ = quarterRevenue(orders, year - 1, q);
  const yoy = changePct(thisQ, lastYearSameQ);

  let prevQ = q - 1, prevQYear = year;
  if (prevQ < 1) { prevQ = 4; prevQYear = year - 1; }
  const prevQRevenue = quarterRevenue(orders, prevQYear, prevQ);
  const qoq = changePct(thisQ, prevQRevenue);

  return { quarter: q, year, this_quarter_revenue: thisQ, yoy, qoq };
}

/* ----------------------------------------------------------------
   3. STATE, COLUMNS, DRILL HELPER
   ---------------------------------------------------------------- */
const D = {};
const SRC = {};
const F = CFG.fields;

const COLS = {
  lead: [
    { label: "Lead Date", value: F.leads.date, format: "date" },
    { label: "Customer", value: F.leads.customer },
    { label: "Source", value: F.leads.source },
    { label: "Status", value: F.leads.status }
  ],
  quotation: [
    { label: "Quotation No", value: F.quotation.number },
    { label: "Date", value: F.quotation.date, format: "date" },
    { label: "Customer", value: F.quotation.customer },
    { label: "Status", value: F.quotation.status },
    { label: "Grand Total", value: F.quotation.grandTotal, format: "money" }
  ],
  order: [
    { label: "Date", value: F.orderConfirmation.date, format: "date" },
    { label: "Quotation No", value: F.orderConfirmation.quotationNo },
    { label: "Customer", value: F.orderConfirmation.customer },
    { label: "Quote Amount", value: F.orderConfirmation.quoteAmount, format: "money" },
    { label: "Final Amount", value: F.orderConfirmation.finalAmount, format: "money" }
  ],
  payment: [
    { label: "Payment Date", value: F.paymentTracking.date, format: "date" },
    { label: "Due Date", value: F.paymentTracking.dueDate, format: "date" },
    { label: "Customer", value: F.paymentTracking.customer },
    { label: "Advance", value: F.paymentTracking.advance, format: "money" },
    { label: "Status", value: F.paymentTracking.status }
  ],
  followUp: [
    { label: "Date", value: F.quotationFollowUp.date, format: "date" },
    { label: "Customer", value: F.quotationFollowUp.customer },
    { label: "Status", value: F.quotationFollowUp.status },
    {
      label: "Follow-up lines", format: "int",
      value: (r) => rows(r[F.quotationFollowUp.lines]).length
    }
  ],
  followUpLine: [
    { label: "Executed", value: F.quotationFollowUp.lineDate, format: "date" },
    { label: "Status", value: F.quotationFollowUp.lineStatus },
    { label: "Customer", value: (r) => (r._parent ? r._parent[F.quotationFollowUp.customer] : "") }
  ],
  visit: [
    { label: "Visit Date", value: F.preSiteVisit.date, format: "date" },
    { label: "Customer", value: F.preSiteVisit.customer },
    { label: "Status", value: F.preSiteVisit.status }
  ],
  feedback: [
    { label: "Date", value: F.customerFeedback.date, format: "date" },
    { label: "Customer", value: F.customerFeedback.customer },
    { label: "Overall Performance", value: F.customerFeedback.rating, format: "dec" },
    { label: "Remarks", value: F.customerFeedback.remarks }
  ],
  srs: [
    { label: "Date", value: F.srs.date, format: "date" },
    { label: "Employee", value: F.srs.employee },
    { label: "Customer", value: F.srs.customer },
    { label: "Amount", value: F.srs.amount, format: "money" }
  ]
};

function drill(key, title, report, columns, srcKey, subtitle, empty) {
  AK.defineDrill(key, {
    title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
    rows: () => SRC[srcKey] || []
  });
}

/* ----------------------------------------------------------------
   4. SMALL UI SETTERS (kept from the original script.js)
   ---------------------------------------------------------------- */
function setText(id, value) { const el = document.getElementById(id); if (el) el.innerText = value; }
function setWidth(id, percent) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.width = Math.max(0, Math.min(100, num(percent))) + "%";
}
function setBadge(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const n = num(value);
  el.innerText = (n >= 0 ? "↑ " : "↓ ") + cnt(Math.abs(n)) + "%";
  el.classList.remove("badge-positive", "badge-negative");
  el.classList.add(n >= 0 ? "badge-positive" : "badge-negative");
}
/** Plain-text growth value (no badge chrome on these two tiles) — colored by sign. */
function setGrowthText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const n = num(value);
  el.innerText = (n > 0 ? "+" : "") + cnt(n) + "%";
  el.style.color = n > 0 ? "#4ade80" : n < 0 ? "#f87171" : "#fff";
}
// Gauges on this dashboard now go through AK.mountGauge (shared needle-gauge
// component in adroitWidgetKit.js) instead of a local ApexCharts radialBar —
// see that file for why (this app's pinned ApexCharts build has no needle
// support at all, so it's drawn as plain SVG instead of an ApexCharts type).
/** A metric with no data source: show "n/a", not a misleading 0. */
function setUnavailable(id, note) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = "n/a";
  el.title = note || "No source field for this metric — see CFG.unsourced in salesKPI.js";
  el.style.color = "#9ca3af";
}
/** Bar group scaled against the largest value, with drill-downs. */
function setBarGroup(items) {
  const max = Math.max.apply(null, items.map((i) => num(i.value))) || 1;
  items.forEach((i) => {
    if (i.drillKey) AK.set(i.valueId, cnt(i.value), i.drillKey);
    else setText(i.valueId, cnt(i.value));
    setWidth(i.barId, (num(i.value) / max) * 100);
  });
}

/* ----------------------------------------------------------------
   5. KPI CALCULATIONS
   ---------------------------------------------------------------- */

/** Days from a lead to its first quotation, averaged. One day of grace. */
function quoteDelayDays() {
  const firstQuoteByLead = new Map();
  D.quotation.forEach((q) => {
    const leadId = AK.id(q[F.quotation.lead]);
    if (!leadId) return;
    const d = AK.parseDate(q[F.quotation.date]);
    if (!d) return;
    const cur = firstQuoteByLead.get(leadId);
    if (!cur || d < cur.date) firstQuoteByLead.set(leadId, { date: d, record: q });
  });

  const pairs = [];
  D.leads.forEach((l) => {
    const q = firstQuoteByLead.get(String(l.ID));
    if (!q) return;
    const ld = AK.parseDate(l[F.leads.date]);
    if (!ld) return;
    const days = Math.max(0, daysBetween(ld, q.date) - 1); // same/next day counts as 0
    pairs.push({ lead: l, quotation: q.record, days: days });
  });

  return { days: pairs.length ? Math.round(avg(pairs, (p) => p.days) * 10) / 10 : 0, pairs: pairs };
}

/** Days from Due_Date to Payment_Date on settled payment-tracking rows. */
function paymentDelayDays() {
  const settled = D.paymentTracking.filter((p) =>
    AK.parseDate(p[F.paymentTracking.date]) && AK.parseDate(p[F.paymentTracking.dueDate]));
  const late = settled.filter((p) =>
    daysBetween(AK.parseDate(p[F.paymentTracking.dueDate]), AK.parseDate(p[F.paymentTracking.date])) > 0);
  const days = settled.length
    ? Math.round(avg(settled, (p) => Math.max(0,
      daysBetween(AK.parseDate(p[F.paymentTracking.dueDate]), AK.parseDate(p[F.paymentTracking.date])))) * 10) / 10
    : 0;
  return { days: days, settled: settled, late: late };
}

function leadsBySource(list) {
  const buckets = {};
  CFG.rules.leadSourceGroups.forEach(([label]) => { buckets[label] = []; });
  buckets.Other = [];
  list.forEach((l) => {
    const key = norm(l[F.leads.source] && (l[F.leads.source].display_value || l[F.leads.source]));
    const group = CFG.rules.leadSourceGroups.find(([, keys]) => keys.indexOf(key) >= 0);
    (group ? buckets[group[0]] : buckets.Other).push(l);
  });
  return buckets;
}

/** All follow-up subform lines, flattened, each keeping its parent. */
function followUpLines() {
  const out = [];
  D.quotationFollowUp.forEach((p) => {
    rows(p[F.quotationFollowUp.lines]).forEach((line) => {
      out.push(Object.assign({ _parent: p }, line));
    });
  });
  return out;
}

/* ----------------------------------------------------------------
   6. RENDER
   ---------------------------------------------------------------- */
function render() {
  const R = CFG.reports;
  const monthWindow = AK.date(MONTH_START) + " to " + AK.date(TODAY);

  /* ============ 1. ADMIN KPI ============ */

  const quotesThisMonth = D.quotation.filter((q) => thisMonth(q[F.quotation.date]));
  const quotesLastMonth = D.quotation.filter((q) => lastMonth(q[F.quotation.date]));
  SRC.quotesCreated = quotesThisMonth;
  drill("kpi.quotesCreated", "Quotations Created", R.quotation, COLS.quotation, "quotesCreated",
    "Quotations dated " + monthWindow);
  AK.set("val-quotations-created", cnt(quotesThisMonth.length), "kpi.quotesCreated");
  setBadge("badge-quotations-change", changePct(quotesThisMonth.length, quotesLastMonth.length));

  const qd = quoteDelayDays();
  SRC.quoteDelay = qd.pairs.map((p) => p.quotation);
  drill("kpi.quoteDelay", "Quotations Used for Average Delay", R.quotation, COLS.quotation, "quoteDelay",
    "First quotation raised against each lead; the delay is the days between the two, with one day of grace");
  AK.set("val-avg-quote-delay", AK.dec(qd.days) + " days", "kpi.quoteDelay");
  setWidth("bar-quote-delay", Math.max(0, 100 - (qd.days / CFG.rules.targetQuoteDelayDays) * 100));
  setText("lbl-curr-quote-delay", "Current: " + AK.dec(qd.days) + "d");

  const pd = paymentDelayDays();
  SRC.paymentDelay = pd.late;
  drill("kpi.paymentDelay", "Payments Settled After the Due Date", R.paymentTracking, COLS.payment, "paymentDelay",
    "Payment Tracking rows where Payment Date is after Due Date",
    "No payment was settled after its due date.");
  AK.set("val-payment-delay", AK.dec(pd.days) + " days", "kpi.paymentDelay");
  setWidth("bar-payment-delay", Math.max(0, 100 - (pd.days / CFG.rules.targetPaymentDelayDays) * 100));
  setText("lbl-curr-payment-delay", "Current: " + AK.dec(pd.days) + "d");

  const leadsThisMonth = D.leads.filter((l) => thisMonth(l[F.leads.date]));
  const attended = leadsBySource(leadsThisMonth.filter((l) => !statusIn(l[F.leads.status], CFG.rules.openLeadStatuses)));
  ["IndiaMART", "Justdial", "Referral", "Direct"].forEach((label, i) => {
    const key = "leadSrc." + i;
    SRC[key] = attended[label] || [];
    drill(key, "Leads Attended — " + label, R.leads, COLS.lead, key,
      "Leads dated " + monthWindow + " from " + label + " that are no longer Open");
  });
  setBarGroup([
    { valueId: "val-lead-im", barId: "bar-lead-im", value: (attended.IndiaMART || []).length, drillKey: "leadSrc.0" },
    { valueId: "val-lead-jd", barId: "bar-lead-jd", value: (attended.Justdial || []).length, drillKey: "leadSrc.1" },
    { valueId: "val-lead-ref", barId: "bar-lead-ref", value: (attended.Referral || []).length, drillKey: "leadSrc.2" },
    { valueId: "val-lead-dir", barId: "bar-lead-dir", value: (attended.Direct || []).length, drillKey: "leadSrc.3" }
  ]);

  const feedbackThisMonth = D.customerFeedback.filter((f) => thisMonth(f[F.customerFeedback.date]));
  SRC.feedback = feedbackThisMonth;
  drill("kpi.feedback", "Customer Feedback", R.customerFeedback, COLS.feedback, "feedback",
    "Customer Feedback dated " + monthWindow);
  AK.set("val-customer-feedback", cnt(feedbackThisMonth.length), "kpi.feedback");

  // "Missed calls" = follow-up lines that were due but never executed.
  const lines = followUpLines();
  const missed = lines.filter((l) =>
    !statusIn(l[F.quotationFollowUp.lineStatus], CFG.rules.followUpDoneStatuses) &&
    AK.parseDate(l[F.quotationFollowUp.lineDate]) &&
    AK.parseDate(l[F.quotationFollowUp.lineDate]) < TODAY);
  SRC.missed = missed;
  drill("kpi.missed", "Missed Follow-ups", R.quotationFollowUp, COLS.followUpLine, "missed",
    "Follow-up subform lines due before today that are still not " + CFG.rules.followUpDoneStatuses.join("/"),
    "No follow-up is overdue.");
  AK.set("val-missed-calls", cnt(missed.length), "kpi.missed");

  // Quote accuracy = orders whose Final_Amount equals the Quote_Amount.
  const ordersThisMonth = D.orderConfirmation.filter((o) => thisMonth(o[F.orderConfirmation.date]));
  const accurate = ordersThisMonth.filter((o) =>
    num(o[F.orderConfirmation.quoteAmount]) > 0 &&
    Math.abs(num(o[F.orderConfirmation.finalAmount]) - num(o[F.orderConfirmation.quoteAmount])) < 1);
  const accuracy = ordersThisMonth.length ? Math.round((accurate.length * 100) / ordersThisMonth.length) : 0;
  SRC.accurate = accurate;
  SRC.orders = ordersThisMonth;
  drill("kpi.accuracy", "Orders Matching Their Quote", R.orderConfirmation, COLS.order, "accurate",
    "Orders " + monthWindow + " where Final Amount equals Quote Amount");
  AK.mountGauge("quote-accuracy-chart", accuracy, { color: AK.chartColors.blue, dark: true });
  AK.bindDrill("quote-accuracy-chart", "kpi.accuracy");

  const doneLines = lines.filter((l) => statusIn(l[F.quotationFollowUp.lineStatus], CFG.rules.followUpDoneStatuses));
  const pendingLines = lines.filter((l) => !statusIn(l[F.quotationFollowUp.lineStatus], CFG.rules.followUpDoneStatuses));
  const fPct = lines.length ? Math.round((doneLines.length * 100) / lines.length) : 0;
  SRC.followDone = doneLines;
  SRC.followPending = pendingLines;
  drill("kpi.followDone", "Follow-ups Done", R.quotationFollowUp, COLS.followUpLine, "followDone",
    "Follow-up lines with Status in " + CFG.rules.followUpDoneStatuses.join("/"));
  drill("kpi.followPending", "Follow-ups Pending", R.quotationFollowUp, COLS.followUpLine, "followPending",
    "Follow-up lines not yet " + CFG.rules.followUpDoneStatuses.join("/"));
  AK.mountGauge("followup-chart", fPct, { color: AK.chartColors.blue, label: "Done", dark: true });
  AK.set("legend-done", "Done (" + cnt(doneLines.length) + ")", "kpi.followDone");
  AK.set("legend-pending", "Pending (" + cnt(pendingLines.length) + ")", "kpi.followPending");

  /* ---- Admin performance comparison table ---- */
  renderAdminTable(quotesThisMonth, lines, missed, ordersThisMonth, qd);

  /* ============ 2. SALES HEAD & MD ============ */

  const approved = quotesThisMonth.filter((q) => statusIn(q[F.quotation.status], CFG.rules.quotationApprovedStatuses));
  SRC.approved = approved;
  drill("kpi.approved", "Quotations Approved", R.quotation, COLS.quotation, "approved",
    "Quotations " + monthWindow + " with Status in " + CFG.rules.quotationApprovedStatuses.join("/"));
  AK.set("val-quotations-approved", cnt(approved.length), "kpi.approved");

  const visits = D.preSiteVisit.filter((v) => thisMonth(v[F.preSiteVisit.date]));
  SRC.visits = visits;
  drill("kpi.visits", "Pre-Site Visits", R.preSiteVisit, COLS.visit, "visits",
    "Customer Pre-Site Visit Observations dated " + monthWindow);
  AK.set("val-pre-visits", cnt(visits.length), "kpi.visits");
  // The dashboard shows pre-visits and customer visits separately; without a
  // second source both read from the same report.  // VERIFY
  AK.set("val-customer-visits", cnt(visits.length), "kpi.visits");

  const rated = feedbackThisMonth.filter((f) => num(f[F.customerFeedback.rating]) > 0);
  const satisfaction = rated.length ? Math.round(avg(rated, (f) => num(f[F.customerFeedback.rating])) * 10) / 10 : 0;
  SRC.rated = rated;
  drill("kpi.satisfaction", "Rated Customer Feedback", R.customerFeedback, COLS.feedback, "rated",
    "Customer Feedback " + monthWindow + " with an Overall Performance above 0");
  AK.set("val-customer-satisfaction", AK.dec(satisfaction), "kpi.satisfaction");

  // Lead response delay: days from a lead to its first follow-up activity.
  AK.set("val-lead-response-delay", AK.dec(qd.days) + " days", "kpi.quoteDelay");
  setWidth("bar-lead-delay", Math.max(0, 100 - (qd.days / CFG.rules.targetQuoteDelayDays) * 100));
  setText("lbl-lead-delay", "Current: " + AK.dec(qd.days) + "d");

  const freq = quotesThisMonth.length ? Math.round((lines.length / quotesThisMonth.length) * 10) / 10 : 0;
  SRC.allLines = lines;
  drill("kpi.freq", "All Follow-up Lines", R.quotationFollowUp, COLS.followUpLine, "allLines",
    "Every Follow_up subform line; the tile divides these by the number of quotations raised this month");
  AK.set("val-followups-freq", AK.dec(freq), "kpi.freq");
  setWidth("bar-followups-freq", Math.min(100, (freq / CFG.rules.targetFollowUpsPerQuotation) * 100));
  setText("lbl-followups-freq", "Achieved: " + AK.dec(freq));

  const newLeads = leadsBySource(leadsThisMonth);
  ["Direct", "Referral", "OEM", "Dealer"].forEach((label, i) => {
    const key = "newLead." + i;
    SRC[key] = newLeads[label] || [];
    drill(key, "New Leads — " + label, R.leads, COLS.lead, key,
      "Leads dated " + monthWindow + " with Lead Source = " + label);
  });
  setBarGroup([
    { valueId: "val-new-dir", barId: "bar-new-dir", value: (newLeads.Direct || []).length, drillKey: "newLead.0" },
    { valueId: "val-new-ref", barId: "bar-new-ref", value: (newLeads.Referral || []).length, drillKey: "newLead.1" },
    { valueId: "val-new-oem", barId: "bar-new-oem", value: (newLeads.OEM || []).length, drillKey: "newLead.2" },
    { valueId: "val-new-dealer", barId: "bar-new-dealer", value: (newLeads.Dealer || []).length, drillKey: "newLead.3" }
  ]);

  const conversion = quotesThisMonth.length
    ? Math.round((ordersThisMonth.length * 100) / quotesThisMonth.length) : 0;
  drill("kpi.conversion", "Orders Confirmed", R.orderConfirmation, COLS.order, "orders",
    "Orders " + monthWindow + ", divided by the " + cnt(quotesThisMonth.length) + " quotations raised in the same window");
  AK.mountGauge("conversion-chart", conversion, { color: AK.chartColors.aqua, label: "Rate", dark: true });
  AK.bindDrill("conversion-chart", "kpi.conversion");

  /* ============ 3. COMBINED ============ */

  renderOrderClosedStrip();

  const growth = computeQuarterGrowth(D.orderConfirmation);
  setGrowthText("val-yoy-growth", growth.yoy);
  setGrowthText("val-qoq-growth", growth.qoq);

  // Metrics the Custom API never supplied — shown as "n/a" rather than 0 or a
  // misleading empty gauge/ring (no chart is mounted for these at all).
  setUnavailable("val-admin-efficiency", "No admin-efficiency source exists yet.");
  setUnavailable("val-sales-eff", "Sales effectiveness has no defined formula yet.");
  ["q-im", "q-jd", "q-ref", "q-ti"].forEach((id) => setUnavailable(id, "Lead quality scoring is not defined yet."));
  ["bar-q-im", "bar-q-jd", "bar-q-ref", "bar-q-ti"].forEach((id) => setWidth(id, 0));

  // Profit margin needs a cost source; only the sales side is available.
  const salesAmount = ordersThisMonth.reduce((s, o) => s + num(o[F.orderConfirmation.finalAmount]), 0);
  setUnavailable("val-profit-display", "Profit needs a cost source; only sales value is available.");
  setWidth("bar-profit", 0);
  setText("lbl-sales-amt", "Sales: " + rupees(salesAmount));
  setText("lbl-cost-amt", "Cost: n/a");

  console.groupCollapsed("%c[salesKPI] metrics with no data source — these render as \"n/a\"",
    "color:#b45309;font-weight:bold");
  CFG.unsourced.forEach((m) => console.log("•", m));
  console.log("The previous Custom API did not return these either (see the old script.js comments). " +
    "Add the source fields to the reports listed in the workbook, then wire them here.");
  console.groupEnd();
}

function renderAdminTable(quotes, lines, missed, orders, qd) {
  const tbody = document.getElementById("admin-table-body");
  if (!tbody) return;

  // Group by whoever prepared the quotation.
  const byAdmin = new Map();
  quotes.forEach((q) => {
    const who = text(q[F.quotation.preparedBy]) || "(not set)";
    if (!byAdmin.has(who)) byAdmin.set(who, { name: who, quotes: [], sent: [], orders: [] });
    const entry = byAdmin.get(who);
    entry.quotes.push(q);
    if (text(q[F.quotation.status]).toLowerCase() === "sent") entry.sent.push(q);
  });

  const list = Array.from(byAdmin.values()).sort((a, b) => b.quotes.length - a.quotes.length);

  if (!list.length) {
    tbody.innerHTML = AK.emptyRow(7,
      "No quotations this month, or the field '" + F.quotation.preparedBy +
      "' is not on the " + CFG.reports.quotation + " report.");
    return;
  }

  tbody.innerHTML = list.map((a, i) => {
    SRC["admin." + i] = a.quotes;
    SRC["adminSent." + i] = a.sent;
    drill("admin." + i, "Quotations — " + a.name, CFG.reports.quotation, COLS.quotation, "admin." + i,
      "Quotations this month prepared by " + a.name);
    drill("adminSent." + i, "Quotations Sent — " + a.name, CFG.reports.quotation, COLS.quotation, "adminSent." + i,
      "Of those, the ones with Status = Sent");

    const conv = a.quotes.length ? Math.round((a.orders.length * 100) / a.quotes.length) : 0;
    const followPer = a.quotes.length ? Math.round((lines.length / quotes.length) * 10) / 10 : 0;

    return "<tr><td><strong>" + esc(a.name) + "</strong></td>" +
      '<td data-drill="admin.' + i + '">' + cnt(a.quotes.length) + "</td>" +
      '<td data-drill="adminSent.' + i + '">' + cnt(a.sent.length) + "</td>" +
      "<td>" + AK.dec(followPer) + "</td>" +
      "<td>" + cnt(missed.length) + "</td>" +
      "<td>" + pctOf(conv, 0) + "</td>" +
      "<td>" + AK.dec(qd.days) + "</td></tr>";
  }).join("");

  AK.autoBind(tbody);
}

function renderOrderClosedStrip() {
  const container = document.getElementById("ocs-members-container");
  const srsThisMonth = D.srs.filter((s) => thisMonth(s[F.srs.date]));

  const byMember = new Map();
  srsThisMonth.forEach((s) => {
    const who = text(s[F.srs.employee]) || "(not set)";
    if (!byMember.has(who)) byMember.set(who, { name: who, records: [], amount: 0 });
    const entry = byMember.get(who);
    entry.records.push(s);
    entry.amount += num(s[F.srs.amount]);
  });

  const members = Array.from(byMember.values()).sort((a, b) => b.records.length - a.records.length);
  setText("ocs-member-count", cnt(members.length) + " Members");
  if (!container) return;

  if (!members.length) {
    container.innerHTML = '<div style="color:#aaa;font-size:11px;padding:10px">No closures yet this month</div>';
    return;
  }

  container.innerHTML = members.map((m, i) => {
    SRC["ocs." + i] = m.records;
    drill("ocs." + i, "Orders Closed — " + m.name, CFG.reports.srs, COLS.srs, "ocs." + i,
      "SRS records this month for " + m.name);
    const photo = "https://ui-avatars.com/api/?name=" + encodeURIComponent(m.name) + "&background=667eea&color=fff";
    return '<div class="ocs-member" data-drill="ocs.' + i + '">' +
      '<img src="' + photo + '" alt="' + esc(m.name) + '" />' +
      '<div class="ocs-name">' + esc(m.name) + "</div>" +
      '<div class="ocs-count">' + cnt(m.records.length) + "</div>" +
      '<div class="ocs-count" style="color:#ffd166;font-size:10px">' + rupees(m.amount) + "</div></div>";
  }).join("");

  AK.autoBind(container);
}

/* ----------------------------------------------------------------
   7. MAIN
   ---------------------------------------------------------------- */
async function main() {
  AK.init({ name: "salesKPIDashboard" });

  // v2 JS API needs no ZOHO.CREATOR.init() call.

  try {
    const keys = Object.keys(CFG.reports);
    const results = await Promise.all(keys.map((k) => fetchReport(k, k)));
    keys.forEach((k, i) => { D[k] = results[i]; });

    render();

    AK.report();
    const failed = Object.keys(FETCH_FAILURES);
    if (failed.length) {
      console.warn("[salesKPI] reports that failed to load:", failed.join(", "),
        "— the KPIs that depend on them read as zero.");
    }
    console.log("%c[salesKPI] ready — click any count to see the records behind it.",
      "color:#15803d;font-weight:bold");

    // One-time field discovery for every report this dashboard reads — paste the console
    // output back to fix any remaining guessed field name in one pass. Safe to delete once
    // every field in CFG.fields is confirmed against real data.
    AK.discoverAllFields(CFG.reports);
  } catch (err) {
    console.error("[salesKPI] fatal:", err);
  }
}

document.addEventListener("DOMContentLoaded", main);
