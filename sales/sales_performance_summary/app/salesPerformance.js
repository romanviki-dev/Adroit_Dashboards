"use strict";

/* ================================================================
   SALES PERFORMANCE SUMMARY DASHBOARD — WIDGET VERSION
   Replaces the Deluge HTML snippet + every thisapp.sales.* custom function.
   All data comes from ZOHO.CREATOR.DATA.getRecords on plain reports (fetched
   once, on load); every filter / sum / percentage runs here in JS.

   FUNCTION MAP (Deluge -> JS) is in section 4. Each JS function carries the
   name of the Deluge function it replaces.

   BUSINESS LOGIC — where this deliberately DIFFERS from the old Deluge
   (the Deluge had defects; these are the corrected rules):
    1. Conversion Rate (Monthly tab) = orders confirmed this month /
       quotations created this month x 100. (Was: all-time quotations MINUS
       all-time orders, printed with a "%".)
    2. "Pending >3 Days" = leads that are Open OR In Progress AND older than
       3 days. (Was: every Open lead regardless of age, because && binds
       tighter than || in the Deluge criteria.)
    3. "Follow-Ups Done" (Today) = follow-up lines dated today that are
       Completed / all follow-up lines dated today. (Was: hardcoded 85%.)
    4. Order Lost Reasons rows show the real quarter label (e.g. "Q3 2026").
    5. Total Quotations / Orders Confirmed tiles = current month AND current
       year. (Was: same month of every year.)
    6. Weekly lead-source buckets match the field's values case/spacing
       insensitively (so "India mart", "Just Dial", "Customer reference
       leads", "Dealers", "OEMS" all land in the right bar). Leads whose
       source is none of the six shown sources (e.g. "Direct Visit") are not
       part of the percentage base, same as before.
    7. Average Delay (Days) = days from a lead to its FIRST quotation, with
       one day of grace (a same/next-day quote counts as 0), averaged over
       leads in status "Quote Created". (Was: direction reversed, so it was
       ~always 0.)
    8. Monthly expenses count Expense_of_Engineer for the WHOLE month to date.
       (Was: only the 1st of the month.)
    9. Customer-satisfaction bars are scaled to the 5-point rating scale.
       (Was: scaled to 10, so bars never passed 50%.)
   10. Weekly change % when last week was 0 = 100% (was inflated, e.g. 3 leads
       vs 0 showed +200%).
   11. Weeks start on Monday (CFG.weekStartsOn) — consistent with the
       Mon-Fri / Mon-Sun windows used elsewhere on the dashboard.
   12. Follow-up delay (Benchmarks) = days from a quotation to the first
       follow-up on/after it for the same customer, averaged.
   13. YoY chart draws the red bar for negative growth (was invisible).
   NOT changed (intent unclear, ported as written): "Follow-Ups Missed"
   (weekly) counts follow-ups with Status "Lost"; Yearly Growth compares the
   year-to-date with the FULL previous year; Lost Orders Reduction compares
   the quarter-to-date with the FULL previous quarter.
   ================================================================ */

/* ----------------------------------------------------------------
   0. CONFIG — VERIFY every report / field name against your app
      (report LINK names, not form names)
   ---------------------------------------------------------------- */
const CFG = {
  reports: {
    leads: "Customer_Calling_follow_up_Format",                 // confirmed — form Customer_Calling_follow_up
    quotation: "Quotation1",                                    // confirmed — form Quotation
    orderConfirmation: "All_Order_Confirmations",               // confirmed — form Order_Confirmation
    paymentTracking: "Payment_Trackings_Format",                // confirmed — form Payment_Tracking
    paymentMade: "Payment_Made_Report",                         // confirmed — form Payment_Made
    quotationFollowUp: "Quotation_Follow_Up_Format",            // confirmed — form Quotation_Follow_Up
    preSiteVisit: "Customer_Pre_Site_Visit_Observation1",       // confirmed — form Customer_Pre_Site_Visit_Observation
    customerFeedback: "All_Customer_Feedback",                  // confirmed — form Customer_Feedback
    customer: "All_Customers",                                  // confirmed — form Customer
    orderLost: "Order_lost_Analysis_Report",                    // confirmed — form Order_lost_Analysis
    dealers: "All_Dealers",                                     // confirmed — form Dealers
    installationCalls: "Installation_Calls_Handling_for_Sales", // confirmed — form Installation_Calls_Handling
    standby: "Standby_Unit_Tracker2_Report",                    // confirmed — form Standby_Unit_Tracker2
    serviceExecutive: "Service_Executive_Format",               // confirmed — form Service_Executive
    serviceReport: "Service_Reports_Format",                    // confirmed — form Service_Report
    engineerExpense: "Expense_of_Engineer_Report",              // confirmed — form Expense_of_Engineer
    purchaseOrder: "All_Purchase_Orders",                       // confirmed — form Purchase_Order
    bom: "BOM_Report",                                          // confirmed — form BOM
    serviceFeedback: "Service_Feedback_Format",                 // confirmed — form Service_Feedback1
    benchmark: "All_Benchmarks",                                // confirmed — form Benchmark
    competitor: "All_Competitor_Analysis"                       // confirmed — form Competitor_Analysis_Form
  },
  // Top-level fields requested per report (field_config: "custom")
  fields: {
    leads: { date: "Lead_Date", status: "Status", source: "Lead_Source", customer: "Customer_Company", items: "Item_Details" },
    quotation: { date: "Date_field", status: "Status", grandTotal: "Grand_Total", customer: "Customer_Company", lead: "Customer_Calling_follow_up" },
    orderConfirmation: { date: "Date_field", quotationNo: "Quotation_No", finalAmount: "Final_Amount", quoteAmount: "Quote_Amount" },
    paymentTracking: { date: "Payment_Date", advance: "Advance_Amount", dueDate: "Due_Date", status: "Follow_upStatus" },
    paymentMade: { date: "Payment_Date", payable: "Payable_Amount" },
    quotationFollowUp: { hasFollowUp: "Has_Follow_up", lines: "Follow_up", followUpDate: "Follow_up_Date", status: "Status", date: "Date_field", customer: "Customer_Company" },
    preSiteVisit: { date: "Visit_Date", status: "Status" },
    customerFeedback: { date: "Date_field", remarks: "Remarks", customer: "Name_of_Customer", rating: "Overall_Performance" },
    customer: { status: "Status" },
    orderLost: { date: "Date_field", type: "Type_Of_Lost", customer: "Customer_Name", quotation: "Quotation" },
    dealers: { date: "Date_field" },
    installationCalls: { date: "Date_field", feedbackStatus: "Feedback_Status" },
    standby: { date: "Outward_Date", cost: "Cost" },
    serviceExecutive: { date: "Date_Logged", totalCost: "Total_Cost" },
    serviceReport: { date: "Call_Attended_Date", spares: "Spare_Replaced" },
    engineerExpense: { date: "Date_field1234567890", overall: "Overall_Direct" },
    purchaseOrder: { items: "Item_Details" },
    bom: { date: "Date_field", items: "Item_Details" },
    serviceFeedback: { date: "Call_attended_date", rating: "Rating" },
    benchmark: {
      salesValue: "Total_sales_value_committed_for_this_period",
      growth: "Expected_growth_percentage_compared_to_last_period",
      orders: "Number_of_customer_orders_planned_to_be_closed_in_this_period",
      hotEnq: "Number_of_hot_enquiries_expected_to_be_generated_in_this_period",
      dealers: "Number_of_new_dealers_or_channel_partners_planned",
      lostOrders: "Maximum_acceptable_number_of_lost_orders_for_this_period",
      followupDelay: "Maximum_acceptable_follow_up_delay_for_quotations_in_days"
    },
    competitor: { name: "Competitor", position: "Market_Position", pricing: "Pricing", strengths: "Key_Strengths", advantage: "Our_Advantage", updated: "Updated_Date" }
  },
  // Field names INSIDE subforms (they come back nested in the parent's field)
  sub: {
    followUpLine: { date: "Follow_up_Execution_Date", status: "Status" },
    leadItem: { name: "Item_Name" },
    spare: { total: "Total_Amount" },
    poItem: { code: "Product_Code", price: "Price" },
    bomItem: { code: "Product_Code", qty: "Quantity" }
  },
  benchmarkId: "302392000001374003", // hardcoded in getBenchmarksAndTargets
  weekStartsOn: 1,                   // 0 = Sunday, 1 = Monday — week boundaries for "this week vs last week"
  // Lead_Source values are matched after lowercasing and stripping spaces/punctuation
  leadSourceGroups: [
    ["IndiaMART", ["indiamart"]],
    ["Justdial", ["justdial"]],
    ["Cold Calls", ["coldcalls", "coldcall"]],
    ["Existing Customer", ["existingcustomer", "existingcustomers"]],
    ["Referral", ["referral", "referrals", "customerreferenceleads", "customerreference", "reference"]],
    ["Dealers/OEMS", ["dealers", "dealer", "oems", "oem", "dealersoems", "dealersoem"]]
  ],
  maxRecords: 1000,
  maxPages: 10
};

CFG.customFields = {};
Object.keys(CFG.fields).forEach((k) => { CFG.customFields[k] = Object.values(CFG.fields[k]).join(","); });

/* ----------------------------------------------------------------
   1. ZOHO CALL THROTTLE (same pattern as the Store widgets)
   ---------------------------------------------------------------- */
const ZOHO_MAX_CONCURRENT = 4;
let _zohoActiveCalls = 0;
const _zohoQueue = [];

function _zohoRunNext() {
  if (_zohoActiveCalls >= ZOHO_MAX_CONCURRENT) return;
  const job = _zohoQueue.shift();
  if (!job) return;
  _zohoActiveCalls++;
  job.fn().then((res) => job.resolve(res)).catch((err) => job.reject(err))
    .finally(() => { _zohoActiveCalls--; _zohoRunNext(); });
  _zohoRunNext();
}
function zohoThrottled(fn) {
  return new Promise((resolve, reject) => { _zohoQueue.push({ fn, resolve, reject }); _zohoRunNext(); });
}
const ZQ = { getRecords: (params) => zohoThrottled(() => ZOHO.CREATOR.DATA.getRecords(params)) };

// HTTP 400 / code 9280 = "no records matched" — not a real error. Any other
// failure (wrong report name, no permission, ...) degrades to "no data" for that
// one report instead of killing the page, AND is recorded so the dashboard can
// show a banner naming the report — otherwise a wrong report name just looks
// like zeros.
const FETCH_FAILURES = {}; // report_name -> short reason
async function safeGetRecords(params, label) {
  const started = Date.now();
  try {
    const res = await ZQ.getRecords(params);
    AK.logFetch({
      label: label, report: params.report_name, params: params,
      rows: (res && res.data) || [], ms: Date.now() - started
    });
    return res || { data: [] };
  } catch (err) {
    const noRecords = AK.isNoRecords(err);
    AK.logFetch({
      label: label, report: params.report_name, params: params, rows: [],
      ms: Date.now() - started,
      error: noRecords ? null : err,
      note: noRecords ? 'Creator reported "no records"' : "fetch failed — this report reads as empty"
    });
    if (noRecords) return { data: [] };
    console.warn(`Sales Dashboard: "${label}" fetch failed, treating as empty.`, err);
    FETCH_FAILURES[params.report_name] = describeFetchError(err);
    return { data: [] };
  }
}

function describeFetchError(err) {
  if (!err) return "unknown error";
  let body = err.responseText;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { /* keep text */ } }
  const msg = (body && (body.message || body.description)) || err.message || (typeof body === "string" ? body : "");
  const code = err.code !== undefined ? err.code : body && body.code;
  return [code !== undefined && code !== null ? "code " + code : "", msg].filter(Boolean).join(": ") || "unknown error";
}

async function fetchAllPages(baseParams, label) {
  let all = [];
  let cursor = null;
  let page = 0;
  do {
    const params = cursor ? { ...baseParams, record_cursor: cursor } : { ...baseParams };
    const res = await safeGetRecords(params, `${label} (page ${page + 1})`);
    all = all.concat(res.data || []);
    cursor = res.record_cursor || null;
    page++;
  } while (cursor && page < CFG.maxPages);
  if (cursor && page >= CFG.maxPages) console.warn(`Sales Dashboard: "${label}" hit the ${CFG.maxPages}-page safety cap — counts may be low.`);
  return all;
}

const fetchReport = (key, label) => fetchAllPages({
  report_name: CFG.reports[key], field_config: "custom", fields: CFG.customFields[key], max_records: CFG.maxRecords
}, label);

/* ----------------------------------------------------------------
   2. DATE / FORMAT HELPERS
   ---------------------------------------------------------------- */
const DAY_MS = 24 * 60 * 60 * 1000;
const MON_LC = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MON_TC = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function stripTime(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }
function subDays(d, n) { const c = new Date(d); c.setDate(c.getDate() - n); return c; }
function daysBetween(d1, d2) { return Math.round((stripTime(d2) - stripTime(d1)) / DAY_MS); }
function isSameDay(d, ref) { return !!d && stripTime(d).getTime() === stripTime(ref).getTime(); }
// Deluge "in this month" = same month AND same year as today
function inThisMonth(d, ref) { return !!d && d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear(); }

// Zoho Creator date strings: "08-09-2026", "29-Jul-2026", either with a time part.
function parseZohoDate(str) {
  if (!str) return null;
  const parts = String(str).split(" ")[0].split("-");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const ddNum = parseInt(dd, 10), yyyyNum = parseInt(yyyy, 10);
  if (isNaN(ddNum) || isNaN(yyyyNum)) return null;
  let monthIndex;
  if (/^\d+$/.test(mm)) monthIndex = parseInt(mm, 10) - 1;
  else {
    const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    monthIndex = MONTHS[mm];
  }
  if (monthIndex === undefined || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  return new Date(yyyyNum, monthIndex, ddNum);
}

function num(v, fallback = 0) { const n = parseFloat(v); return isNaN(n) ? fallback : n; }
function isNil(v) { return v === null || v === undefined || v === ""; }
function round1(x) { return Math.round(x * 10) / 10; }
// Human-readable numbers (10000 -> "10,000"), Indian grouping, via the shared kit.
function fmtNum(v) { return typeof v === "number" && isFinite(v) ? AK.dec(v) : v; }
function lookupName(obj) { if (!obj) return ""; return typeof obj === "object" ? (obj.zc_display_value || "") : String(obj); }
function esc(s) {
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
// Display value: null/undefined/"" -> "—" (a not-yet-ported stub), numbers get grouping, text is escaped
function show(v) { return isNil(v) ? "—" : typeof v === "number" ? fmtNum(v) : esc(v); }
// Zoho-style "21-Sep-2026" (what <%=zoho.currentdate%> printed)
function fmtDelugeDate(d) { return `${String(d.getDate()).padStart(2, "0")}-${MON_TC[d.getMonth()]}-${d.getFullYear()}`; }
// CSS width value: accepts 60, "60" or "60%"
function pct(v) { const s = String(isNil(v) ? 0 : v); return /%$/.test(s) ? s : `${s}%`; }
// Deluge: if(x >= 0, "+" + x, x)
function signed(v) { return isNil(v) ? "—" : num(v) >= 0 ? `+${fmtNum(num(v))}` : fmtNum(num(v)); }
// Benchmarks status mapping (green/orange/else)
function statusSymbol(raw) { return raw === "green" ? "✓" : raw === "orange" ? "⚠" : "✗"; }
function statusColor(raw) { return raw === "green" ? "green" : raw === "orange" ? "yellow" : "red"; }

/* ----------------------------------------------------------------
   3. FETCH — once per load, every report in parallel (throttled to 4)
   ---------------------------------------------------------------- */
async function getLoginUser() {
  try {
    const p = await ZOHO.CREATOR.UTIL.getInitParams();
    return (p && (p.loginUser || p.loginuser)) || "";
  } catch (e) { return ""; }
}

const REPORT_LABELS = {
  leads: "Customer Calling Follow-up", quotation: "Quotation", orderConfirmation: "Order Confirmation",
  paymentTracking: "Payment Tracking", paymentMade: "Payment Made", quotationFollowUp: "Quotation Follow Up",
  preSiteVisit: "Customer Pre Site Visit Observation", customerFeedback: "Customer Feedback", customer: "Customer",
  orderLost: "Order Lost Analysis", dealers: "Dealers", installationCalls: "Installation Calls Handling",
  standby: "Standby Unit Tracker", serviceExecutive: "Service Executive", serviceReport: "Service Report",
  engineerExpense: "Expense of Engineer", purchaseOrder: "Purchase Order", bom: "BOM",
  serviceFeedback: "Service Feedback", benchmark: "Benchmark", competitor: "Competitor Analysis"
};

async function fetchAllDashboardData() {
  const today = new Date();
  const keys = Object.keys(CFG.reports);
  const [loginUser, ...results] = await Promise.all([
    getLoginUser(),
    ...keys.map((k) => fetchReport(k, REPORT_LABELS[k] || k))
  ]);
  const raw = { today, loginUser };
  keys.forEach((k, i) => { raw[k] = results[i]; });

  // Lookup indexes (replace Deluge's  Quotation[ID == x]  /  same-customer matches)
  raw.quotationById = {};
  raw.quotationsByLead = {};
  raw.quotation.forEach((q) => {
    if (q.ID) raw.quotationById[String(q.ID)] = q;
    const leadId = lookupId(q[F.quotation.lead]);
    if (leadId) (raw.quotationsByLead[leadId] = raw.quotationsByLead[leadId] || []).push(q);
  });
  raw.followUpDatesByCustomer = {};
  raw.quotationFollowUp.forEach((r) => {
    const cid = lookupId(r[F.quotationFollowUp.customer]);
    const d = parseZohoDate(r[F.quotationFollowUp.date]);
    if (cid && d) (raw.followUpDatesByCustomer[cid] = raw.followUpDatesByCustomer[cid] || []).push(d);
  });
  return raw;
}

/* ----------------------------------------------------------------
   4. CALCULATIONS — one JS function per Deluge function
   ---------------------------------------------------------------- */
const F = CFG.fields;
const S = CFG.sub;

/* ---------- helpers ---------- */
function lookupId(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "object") return v.ID ? String(v.ID) : null;
  return String(v);
}
// Comparable identity for a subform "Product_Code" whether it's a lookup or plain text
function keyOf(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "object") return v.ID ? String(v.ID) : (v.zc_display_value || null);
  return String(v);
}
const dateOf = (rec, field) => parseZohoDate(rec[field]);
function inRange(d, start, end) { return !!d && d >= start && d <= end; }
function monthStartOf(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthBounds(year, month0) { return [new Date(year, month0, 1), new Date(year, month0 + 1, 0)]; }
function round2(x) { return Math.round(x * 100) / 100; }
// Deluge: today.subDay(dow == 1 ? 6 : dow - 2)  (Monday of this week; JS getDay(): Sun = 0)
function mondayOf(d) { const dow = d.getDay(); return subDays(stripTime(d), dow === 0 ? 6 : dow - 1); }
// Week bucket for this-week-vs-last-week comparisons (see CFG.weekStartsOn)
function weekKey(d) { const c = stripTime(d); c.setDate(c.getDate() - ((c.getDay() - CFG.weekStartsOn + 7) % 7)); return c.getTime(); }
function quarterStartMonth0(d) { return Math.floor(d.getMonth() / 3) * 3; }

// Cr / L / K display used by all the "_display" strings
function moneyDisplay(v) {
  if (v === 0) return "₹0.0";
  const a = Math.abs(v), sign = v < 0 ? "-" : "";
  if (a >= 10000000) return `₹${sign}${round2(a / 10000000)}Cr`;
  if (a >= 100000) return `₹${sign}${round2(a / 100000)}L`;
  if (a >= 1000) return `₹${sign}${round2(a / 1000)}K`;
  return `₹${sign}${round2(a)}`;
}
function unitFor(maxValue) {
  if (maxValue >= 10000000) return { label: "Cr", divisor: 10000000 };
  if (maxValue >= 100000) return { label: "L", divisor: 100000 };
  if (maxValue >= 1000) return { label: "K", divisor: 1000 };
  return { label: "", divisor: 1 };
}
const scaled = (raw, divisor) => (divisor === 1 ? Math.round(raw) : round1(raw / divisor));

// Sales for a date range: unique quotations behind Order_Confirmations (Grand_Total) + standby-unit cost
function salesForRange(raw, start, end) {
  const ids = new Set();
  raw.orderConfirmation.forEach((o) => {
    if (inRange(dateOf(o, F.orderConfirmation.date), start, end)) {
      const id = lookupId(o[F.orderConfirmation.quotationNo]);
      if (id) ids.add(id);
    }
  });
  let total = 0;
  ids.forEach((id) => { const q = raw.quotationById[id]; total += num(q && q[F.quotation.grandTotal]); });
  return total + standbyForRange(raw, start, end);
}
function standbyForRange(raw, start, end) {
  return raw.standby.reduce((s, r) => (inRange(dateOf(r, F.standby.date), start, end) ? s + num(r[F.standby.cost]) : s), 0);
}
function finalAmountForRange(raw, start, end) {
  return raw.orderConfirmation.reduce((s, r) => {
    const amt = r[F.orderConfirmation.finalAmount];
    return !isNil(amt) && inRange(dateOf(r, F.orderConfirmation.date), start, end) ? s + num(amt) : s;
  }, 0);
}
const countInRange = (list, field, start, end, extra) =>
  list.filter((r) => inRange(dateOf(r, field), start, end) && (!extra || extra(r))).length;

/* ----------------------------------------------------------------
   3c. DRILL-DOWN PLUMBING
   `track(key, rows)` stores the records behind a number and returns the
   count, so the metric functions below stay one-liners while every tile
   on screen can still open the exact rows it was built from.
   ---------------------------------------------------------------- */
const SRC = {};
function track(key, rows) { SRC[key] = rows; return rows.length; }
/** Wrap a rendered value so AK.autoBind() makes it clickable. */
function dv(key, value) { return `<span data-drill="${key}">${value}</span>`; }

const COLS = {
  lead: [
    { label: "Lead Date", value: F.leads.date, format: "date" },
    { label: "Customer", value: F.leads.customer },
    { label: "Source", value: F.leads.source },
    { label: "Status", value: F.leads.status }
  ],
  quotation: [
    { label: "Date", value: F.quotation.date, format: "date" },
    { label: "Customer", value: F.quotation.customer },
    { label: "Status", value: F.quotation.status },
    { label: "Grand Total", value: F.quotation.grandTotal, format: "money" }
  ],
  order: [
    { label: "Date", value: F.orderConfirmation.date, format: "date" },
    { label: "Quotation No", value: F.orderConfirmation.quotationNo },
    { label: "Quote Amount", value: F.orderConfirmation.quoteAmount, format: "money" },
    { label: "Final Amount", value: F.orderConfirmation.finalAmount, format: "money" }
  ],
  payment: [
    { label: "Payment Date", value: F.paymentTracking.date, format: "date" },
    { label: "Due Date", value: F.paymentTracking.dueDate, format: "date" },
    { label: "Advance", value: F.paymentTracking.advance, format: "money" },
    { label: "Status", value: F.paymentTracking.status }
  ],
  paymentMade: [
    { label: "Payment Date", value: F.paymentMade.date, format: "date" },
    { label: "Payable", value: F.paymentMade.payable, format: "money" }
  ],
  followUp: [
    { label: "Date", value: F.quotationFollowUp.date, format: "date" },
    { label: "Customer", value: F.quotationFollowUp.customer },
    { label: "Follow-up Date", value: F.quotationFollowUp.followUpDate, format: "date" },
    { label: "Status", value: F.quotationFollowUp.status },
    {
      label: "Lines", format: "int",
      value: (r) => (r[F.quotationFollowUp.lines] || []).length
    }
  ],
  followUpLine: [
    { label: "Executed", value: S.followUpLine.date, format: "date" },
    { label: "Status", value: S.followUpLine.status },
    { label: "Customer", value: (l) => (l._parent ? l._parent[F.quotationFollowUp.customer] : "") }
  ],
  visit: [
    { label: "Visit Date", value: F.preSiteVisit.date, format: "date" },
    { label: "Status", value: F.preSiteVisit.status }
  ],
  customer: [
    { label: "Status", value: F.customer.status }
  ],
  orderLost: [
    { label: "Date", value: F.orderLost.date, format: "date" },
    { label: "Customer", value: F.orderLost.customer },
    { label: "Reason", value: F.orderLost.type },
    { label: "Quotation", value: F.orderLost.quotation }
  ],
  dealer: [
    { label: "Added", value: F.dealers.date, format: "date" }
  ],
  feedback: [
    { label: "Date", value: F.customerFeedback.date, format: "date" },
    { label: "Customer", value: F.customerFeedback.customer },
    { label: "Overall Performance", value: F.customerFeedback.rating, format: "dec" },
    { label: "Remarks", value: F.customerFeedback.remarks }
  ]
};

function drill(key, title, report, columns, subtitle, empty) {
  AK.defineDrill(key, {
    title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
    rows: () => SRC[key] || []
  });
}

/** Every follow-up subform line, flattened, each keeping a link to its parent. */
function followUpLines(raw, predicate) {
  const out = [];
  raw.quotationFollowUp.forEach((p) => {
    (p[F.quotationFollowUp.lines] || []).forEach((line) => {
      if (!predicate || predicate(line, p)) out.push(Object.assign({ _parent: p }, line));
    });
  });
  return out;
}

/* ---------- TODAY ---------- */

// sales.leadsCount()
function leadsCount(raw) {
  return track("leadsCount", raw.leads.filter((r) => isSameDay(dateOf(r, F.leads.date), raw.today)));
}
// sales.quoteCount()
function quoteCount(raw) {
  return track("quoteCount", raw.quotation.filter((r) => isSameDay(dateOf(r, F.quotation.date), raw.today)));
}
// sales.Orders_daily()
function ordersDaily(raw) {
  return track("ordersDaily", raw.orderConfirmation.filter((r) => isSameDay(dateOf(r, F.orderConfirmation.date), raw.today)));
}

// sales.payments_daily()
function paymentsDaily(raw) {
  let total = 0;
  const rows = [];
  raw.paymentTracking.forEach((r) => {
    const amt = num(r[F.paymentTracking.advance]);
    if (isSameDay(dateOf(r, F.paymentTracking.date), raw.today) && amt !== 0) { total += amt; rows.push(r); }
  });
  raw.paymentMade.forEach((r) => {
    const amt = num(r[F.paymentMade.payable]);
    if (isSameDay(dateOf(r, F.paymentMade.date), raw.today) && amt !== 0) { total += amt; rows.push(r); }
  });
  SRC.paymentsDaily = rows;
  return total;
}

// sales.AdminDelay()  — Draft quotations dated before YESTERDAY
function adminDelay(raw) {
  const cutoff = subDays(stripTime(raw.today), 1);
  return track("adminDelay", raw.quotation.filter((r) => {
    const d = dateOf(r, F.quotation.date);
    return d && d < cutoff && r[F.quotation.status] === "Draft";
  }));
}

// sales.quotationWithNoFollowUp()
function quotationWithNoFollowUp(raw) {
  return track("uncontactedQuotes", raw.quotationFollowUp.filter((r) => {
    const v = r[F.quotationFollowUp.hasFollowUp];
    return v === false || v === "false";
  }));
}

// inline: Customer_Pre_Site_Visit_Observation[Visit_Date == today && Status == "Requested"]
function preVisitsToday(raw) {
  return track("preVisits", raw.preSiteVisit.filter((r) =>
    isSameDay(dateOf(r, F.preSiteVisit.date), raw.today) && r[F.preSiteVisit.status] === "Requested"));
}

// Completed follow-up lines (Quotation_Follow_Up.Follow_up subform) on a given date
const completedLinesOn = (raw, day) => {
  let n = 0;
  raw.quotationFollowUp.forEach((r) => (r[F.quotationFollowUp.lines] || []).forEach((line) => {
    if (isSameDay(parseZohoDate(line[S.followUpLine.date]), day) && line[S.followUpLine.status] === "Completed") n++;
  }));
  return n;
};

// sales.followupDonevsPending()
function followupDonevsPending(raw) {
  SRC.followupDone = followUpLines(raw, (line) =>
    isSameDay(parseZohoDate(line[S.followUpLine.date]), raw.today) && line[S.followUpLine.status] === "Completed");
  return completedLinesOn(raw, raw.today);
}

// Follow-Ups Done bar: completed follow-up lines dated today / all follow-up lines dated today
function followupDonePercent(raw) {
  let done = 0, total = 0;
  raw.quotationFollowUp.forEach((r) => (r[F.quotationFollowUp.lines] || []).forEach((line) => {
    if (!isSameDay(parseZohoDate(line[S.followUpLine.date]), raw.today)) return;
    total++;
    if (line[S.followUpLine.status] === "Completed") done++;
  }));
  return { done, total, percent: total ? Math.round((done * 100) / total) : 0 };
}

// sales.missedSchedule()
function missedSchedule(raw) {
  const t = stripTime(raw.today);
  return track("followupPending", raw.quotationFollowUp.filter((r) => {
    const d = dateOf(r, F.quotationFollowUp.followUpDate);
    return d && d < t && r[F.quotationFollowUp.status] === "Pending";
  }));
}

// sales.FollowupPending3days()
function followupPending3days(raw) {
  const cutoff = subDays(stripTime(raw.today), 3);
  return track("qfuPending", raw.quotationFollowUp.filter((r) => {
    const d = dateOf(r, F.quotationFollowUp.followUpDate);
    return d && d < cutoff && r[F.quotationFollowUp.status] === "Pending";
  }));
}

// sales.inactive_customers_daily()
function inactiveCustomersDaily(raw) {
  return track("cusInactive", raw.customer.filter((r) => r[F.customer.status] === "Inactive"));
}

// sales.paymentoverdue()
function paymentOverdue(raw) {
  const cutoff = subDays(stripTime(raw.today), 15);
  return track("overdue", raw.paymentTracking.filter((r) => {
    const d = dateOf(r, F.paymentTracking.dueDate);
    return d && d < cutoff && r[F.paymentTracking.status] !== "Paid";
  }));
}

// sales.PreVisitObservsationAlerts()
function preVisitObservationAlerts(raw) {
  const cutoff = subDays(stripTime(raw.today), 3);
  return track("previs", raw.preSiteVisit.filter((r) => {
    const d = dateOf(r, F.preSiteVisit.date);
    return d && d < cutoff && r[F.preSiteVisit.status] !== "Completed";
  }));
}

// sales.lostOrderAnalysisDaily()
function lostOrderAnalysisDaily(raw) {
  const c = { "Too Far": 0, "Postponed": 0, "Transport": 0, "Service Not Possible": 0, "Price": 0 };
  const buckets = { "Too Far": [], "Postponed": [], "Transport": [], "Service Not Possible": [], "Price": [] };
  raw.orderLost.forEach((r) => {
    if (!isSameDay(dateOf(r, F.orderLost.date), raw.today)) return;
    const t = lookupName(r[F.orderLost.type]);
    if (t in c) { c[t]++; buckets[t].push(r); }
  });
  SRC["lost.price"] = buckets["Price"];
  SRC["lost.transport"] = buckets["Transport"];
  SRC["lost.service"] = buckets["Service Not Possible"];
  SRC["lost.toofar"] = buckets["Too Far"];
  SRC["lost.postponed"] = buckets["Postponed"];
  const total = c["Too Far"] + c["Postponed"] + c["Transport"] + c["Service Not Possible"] + c["Price"];
  if (total === 0) return { total: 0, postponed: 0, toofar: 0, service_not_possible: 0, transport: 0, price: 0 };
  const p = (n) => round2((n * 100) / total);
  const postponed = p(c["Postponed"]), toofar = p(c["Too Far"]), service = p(c["Service Not Possible"]),
    transport = p(c["Transport"]), price = p(c["Price"]);
  const priceEnd = price * 3.6;
  const transportEnd = priceEnd + transport * 3.6;
  const serviceEnd = transportEnd + service * 3.6;
  const toofarEnd = serviceEnd + toofar * 3.6;
  return {
    total, postponed, toofar, service_not_possible: service, transport, price,
    price_end: priceEnd, transport_end: transportEnd, service_end: serviceEnd, toofar_end: toofarEnd
  };
}

// Shared by DayWiseQuoteSent / DayWiseOrder / DayWiseQuoteWOF — Mon..Fri of this week, counts per weekday + total
function dayWiseCounts(list, dateField, extra, today) {
  const start = mondayOf(today), end = addDaysSafe(start, 4);
  const out = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Tot: 0 };
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  list.forEach((r) => {
    const d = dateOf(r, dateField);
    if (!inRange(d, start, end) || (extra && !extra(r))) return;
    const idx = daysBetween(start, d);
    if (idx >= 0 && idx <= 4) out[names[idx]]++;
  });
  out.Tot = out.Mon + out.Tue + out.Wed + out.Thu + out.Fri;
  return out;
}
function addDaysSafe(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

// sales.DayWiseQuoteSent()
function dayWiseQuoteSent(raw) { return dayWiseCounts(raw.quotation, F.quotation.date, (r) => r[F.quotation.status] === "Sent", raw.today); }
// sales.DayWiseOrder()
function dayWiseOrder(raw) { return dayWiseCounts(raw.orderConfirmation, F.orderConfirmation.date, null, raw.today); }
// sales.DayWiseQuoteWOF()  — Status != "Follow-up"
function dayWiseQuoteWOF(raw) { return dayWiseCounts(raw.quotation, F.quotation.date, (r) => r[F.quotation.status] !== "Follow-up", raw.today); }
// sales.DayWiseFollowupDone()
function dayWiseFollowupDone(raw) {
  const start = mondayOf(raw.today);
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const out = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Tot: 0 };
  names.forEach((n, i) => { out[n] = completedLinesOn(raw, addDaysSafe(start, i)); });
  out.Tot = out.Mon + out.Tue + out.Wed + out.Thu + out.Fri;
  return out;
}

/* ---------- WEEKLY ---------- */

// Shared body of WeeklyLeads / QuoteSent / Orders / FollowupMissed / PaymentReceived / PVPending.
// items = [{ d: Date, v: number }]  ->  [ thisWeek, lastWeek, "increase"|"decrease", change ]
// mode "percent": change = |this - last| / last x 100 (100 when last week was 0);  mode "count": change = |this - last|
function weekCompare(items, today, mode) {
  const cKey = weekKey(today), pKey = weekKey(subDays(today, 7));
  let c = 0, p = 0;
  items.forEach(({ d, v }) => { const k = weekKey(d); if (k === cKey) c += v; else if (k === pKey) p += v; });
  if (c === p) return [c, p, "increase", 0];
  const trend = c > p ? "increase" : "decrease";
  const diff = mode === "count" ? Math.abs(c - p) : p === 0 ? 100 : Math.round((Math.abs(c - p) / p) * 100);
  return [c, p, trend, diff];
}
const dated = (list, field, extra, valueFn) => list
  .map((r) => ({ d: dateOf(r, field), r }))
  .filter((x) => x.d && (!extra || extra(x.r)))
  .map((x) => ({ d: x.d, v: valueFn ? valueFn(x.r) : 1 }));

// sales.WeeklyLeads()
function weeklyLeads(raw) { return weekCompare(dated(raw.leads, F.leads.date), raw.today, "percent"); }
// sales.WeeklyQuoteSent()
function weeklyQuoteSent(raw) { return weekCompare(dated(raw.quotation, F.quotation.date, (r) => r[F.quotation.status] === "Sent"), raw.today, "percent"); }
// sales.WeeklyOrders()
function weeklyOrders(raw) { return weekCompare(dated(raw.orderConfirmation, F.orderConfirmation.date), raw.today, "percent"); }
// sales.WeeklyFollowupMissed()  — only follow-ups from the last 21 days, Status "Lost"; change = absolute count
function weeklyFollowupMissed(raw) {
  const start = subDays(stripTime(raw.today), 21), end = stripTime(raw.today);
  const items = dated(raw.quotationFollowUp, F.quotationFollowUp.date, (r) => r[F.quotationFollowUp.status] === "Lost")
    .filter((x) => x.d >= start && x.d <= end);
  return weekCompare(items, raw.today, "count");
}
// sales.WeeklyPaymentReceived()  — Payment_Made only
function weeklyPaymentReceived(raw) {
  return weekCompare(dated(raw.paymentMade, F.paymentMade.date, (r) => !isNil(r[F.paymentMade.payable]), (r) => num(r[F.paymentMade.payable])), raw.today, "percent");
}
// sales.WeeklyPVPending()  — change = absolute count
function weeklyPVPending(raw) {
  return weekCompare(dated(raw.preSiteVisit, F.preSiteVisit.date, (r) => r[F.preSiteVisit.status] === "Requested"), raw.today, "count");
}

// sales.WeeklyLeadSource()  — % of this week's leads (Mon-Sun) per source, over the six sources shown
const normSource = (s) => String(isNil(s) ? "" : s).toLowerCase().replace(/[^a-z0-9]/g, "");
function weeklyLeadSource(raw) {
  const start = mondayOf(raw.today), end = addDaysSafe(start, 6);
  const counts = CFG.leadSourceGroups.map(() => 0);
  raw.leads.forEach((r) => {
    if (!inRange(dateOf(r, F.leads.date), start, end)) return;
    const src = normSource(r[F.leads.source]);
    const idx = CFG.leadSourceGroups.findIndex(([, aliases]) => aliases.indexOf(src) !== -1);
    if (idx !== -1) counts[idx]++;
  });
  const total = counts.reduce((a, b) => a + b, 0);
  return counts.map((n) => (total === 0 ? 0 : round1((n * 100) / total)));
}

// Mon..Sun window used by the Weekly*Cnt functions
const thisWeekRange = (today) => { const s = mondayOf(today); return [s, addDaysSafe(s, 6)]; };

// sales.WeeklyLeadCnt()
function weeklyLeadCnt(raw) { const [s, e] = thisWeekRange(raw.today); return countInRange(raw.leads, F.leads.date, s, e); }
// sales.WeeklySalesQuoteSent()
function weeklySalesQuoteSent(raw) { const [s, e] = thisWeekRange(raw.today); return countInRange(raw.quotation, F.quotation.date, s, e, (r) => r[F.quotation.status] === "Sent"); }
// sales.WeeklyFollowup()   — Status "Confirmed"
function weeklyFollowup(raw) { const [s, e] = thisWeekRange(raw.today); return countInRange(raw.quotationFollowUp, F.quotationFollowUp.date, s, e, (r) => r[F.quotationFollowUp.status] === "Confirmed"); }
// sales.WeeklyOrderConfirmed()
function weeklyOrderConfirmed(raw) { const [s, e] = thisWeekRange(raw.today); return countInRange(raw.orderConfirmation, F.orderConfirmation.date, s, e); }
// sales.WeeklySalesPaymentReceived()  — Payment_Tracking, Follow_upStatus "Paid"
function weeklySalesPaymentReceived(raw) { const [s, e] = thisWeekRange(raw.today); return countInRange(raw.paymentTracking, F.paymentTracking.date, s, e, (r) => r[F.paymentTracking.status] === "Paid"); }

// sales.leadsAwaitingContact()
function leadsAwaitingContact(raw) { return raw.leads.filter((r) => r[F.leads.status] === "Open" || r[F.leads.status] === "In Progress").length; }

// sales.averageDelay()  — lead -> first quotation, one day of grace, leads in status "Quote Created"
function averageDelay(raw) {
  let total = 0, count = 0;
  raw.leads.forEach((lead) => {
    if (lead[F.leads.status] !== "Quote Created") return;
    const leadDate = dateOf(lead, F.leads.date);
    if (!leadDate) return;
    let first = null;
    (raw.quotationsByLead[String(lead.ID)] || []).forEach((q) => {
      const qd = dateOf(q, F.quotation.date);
      if (qd && (first === null || qd < first)) first = qd;
    });
    if (!first) return;
    const delay = daysBetween(leadDate, first);
    if (delay < 0) return; // quotation dated before its lead = bad data, skip
    total += Math.max(0, delay - 1);
    count++;
  });
  return count === 0 ? 0 : round2(total / count);
}

// sales.weeklyNewDealersAddedThisMonth()
function weeklyNewDealersAddedThisMonth(raw) {
  return countInRange(raw.dealers, F.dealers.date, monthStartOf(raw.today), stripTime(raw.today));
}

// sales.WeeklyPreSiteVisitStatus()
function weeklyPreSiteVisitStatus(raw) {
  const cKey = weekKey(raw.today);
  let req = 0, comp = 0;
  raw.preSiteVisit.forEach((r) => {
    const d = dateOf(r, F.preSiteVisit.date);
    if (!d || weekKey(d) !== cKey) return;
    if (r[F.preSiteVisit.status] === "Requested") req++;
    else if (r[F.preSiteVisit.status] === "Completed") comp++;
  });
  const total = req + comp;
  return {
    Requested_Count: req,
    Completed_Count: comp,
    Requested_Percentage: total ? round1((req * 100) / total) : 0,
    Completed_Percentage: total ? round1((comp * 100) / total) : 0
  };
}

// sales.WeeklyCustomerFeedback()
function weeklyCustomerFeedback(raw) {
  const cKey = weekKey(raw.today);
  let total = 0, comp = 0;
  raw.installationCalls.forEach((r) => {
    const d = dateOf(r, F.installationCalls.date);
    if (!d || weekKey(d) !== cKey) return;
    total++;
    if (r[F.installationCalls.feedbackStatus] === "Completed") comp++;
  });
  if (total === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((comp / total) * 100)));
}

// inline: "Pending >3 Days (Detailed)" — Open or In Progress AND older than 3 days
function pendingLeadsOver3Days(raw) {
  const cutoff = subDays(stripTime(raw.today), 3);
  return raw.leads
    .filter((r) => {
      const status = r[F.leads.status];
      const d = dateOf(r, F.leads.date);
      return (status === "Open" || status === "In Progress") && d && d < cutoff;
    })
    .map((r) => {
      const d = dateOf(r, F.leads.date);
      const products = (r[F.leads.items] || []).map((it) => lookupName(it[S.leadItem.name])).filter((n) => n);
      return { customer: lookupName(r[F.leads.customer]), products, age: d ? daysBetween(d, raw.today) : 0 };
    });
}

/* ---------- MONTHLY ---------- */

// sales.monthlyquote()  — this month AND this year
function monthlyQuote(raw) {
  return raw.quotation.filter((r) => inThisMonth(dateOf(r, F.quotation.date), raw.today)).length;
}
// sales.orderconfirmedmonthly()  — this month AND this year
function orderConfirmedMonthly(raw) {
  return raw.orderConfirmation.filter((r) => inThisMonth(dateOf(r, F.orderConfirmation.date), raw.today)).length;
}
// sales.MonthlyFollowUp()
function monthlyFollowUp(raw) {
  return raw.quotationFollowUp.filter((r) => inThisMonth(dateOf(r, F.quotationFollowUp.date), raw.today) && r[F.quotationFollowUp.status] === "Confirmed").length;
}
// sales.MonthlyOrderConfirmed()
function monthlyOrderConfirmed(raw) {
  return raw.orderConfirmation.filter((r) => inThisMonth(dateOf(r, F.orderConfirmation.date), raw.today)).length;
}
// sales.MonthlyPaymentReceived()
function monthlyPaymentReceived(raw) {
  return raw.paymentTracking.filter((r) => inThisMonth(dateOf(r, F.paymentTracking.date), raw.today) && r[F.paymentTracking.status] === "Paid").length;
}
// inline: Customer_Calling_follow_up[Lead_Date in this month]
function monthlyLeadCount(raw) { return raw.leads.filter((r) => inThisMonth(dateOf(r, F.leads.date), raw.today)).length; }
// inline: Quotation[Date_field in this month && Status == "Sent"]
function monthlyQuotesSent(raw) {
  return raw.quotation.filter((r) => inThisMonth(dateOf(r, F.quotation.date), raw.today) && r[F.quotation.status] === "Sent").length;
}
// Conversion rate (%) = orders confirmed this month / quotations created this month
function computeConversionRate(quotesThisMonth, ordersThisMonth) {
  return quotesThisMonth > 0 ? round1((ordersThisMonth * 100) / quotesThisMonth) : 0;
}

// sales.getMonthlyRevenueProfitExpense()  — month to date
function getMonthlyRevenueProfitExpense(raw) {
  const today = stripTime(raw.today), start = monthStartOf(today);
  const revenue = salesForRange(raw, start, today);

  const serviceExec = raw.serviceExecutive.reduce((s, r) => (inRange(dateOf(r, F.serviceExecutive.date), start, today) ? s + num(r[F.serviceExecutive.totalCost]) : s), 0);
  let serviceReport = 0;
  raw.serviceReport.forEach((r) => {
    if (!inRange(dateOf(r, F.serviceReport.date), start, today)) return;
    (r[F.serviceReport.spares] || []).forEach((sp) => { serviceReport += num(sp[S.spare.total]); });
  });
  const engineer = raw.engineerExpense.reduce((s, r) => (inRange(dateOf(r, F.engineerExpense.date), start, today) ? s + num(r[F.engineerExpense.overall]) : s), 0);

  const expense = serviceExec + serviceReport + engineer;
  const profit = revenue - expense;
  return {
    overall_revenue: revenue, overall_expense: expense, overall_profit: profit,
    revenue_display: moneyDisplay(revenue), expense_display: moneyDisplay(expense), profit_display: moneyDisplay(profit)
  };
}

// sales.getLostOrderAndAvgOrderValue()
function getLostOrderAndAvgOrderValue(raw) {
  const today = stripTime(raw.today), start = monthStartOf(today);
  let count = 0, value = 0;
  raw.orderLost.forEach((r) => {
    if (isNil(r[F.orderLost.customer])) return;
    if (!inRange(dateOf(r, F.orderLost.date), start, today)) return;
    count++;
    const q = raw.quotationById[lookupId(r[F.orderLost.quotation])];
    value += num(q && q[F.quotation.grandTotal]);
  });
  const totals = raw.quotation
    .filter((q) => inRange(dateOf(q, F.quotation.date), start, today) && !isNil(q[F.quotation.grandTotal]))
    .map((q) => num(q[F.quotation.grandTotal]));
  const avg = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  return {
    lost_orders_count: count, lost_orders_value: value, avg_order_value: avg,
    lost_orders_value_display: moneyDisplay(value), avg_order_value_display: moneyDisplay(avg)
  };
}

// sales.getSalesVsCostVsProfit()
function getSalesVsCostVsProfit(raw) {
  const year = raw.today.getFullYear(), curMonth = raw.today.getMonth() + 1;

  // Highest purchase-order price per product code
  const priceMap = {};
  raw.purchaseOrder.forEach((po) => (po[F.purchaseOrder.items] || []).forEach((it) => {
    const code = keyOf(it[S.poItem.code]);
    const price = it[S.poItem.price];
    if (code && !isNil(price) && (!(code in priceMap) || num(price) > priceMap[code])) priceMap[code] = num(price);
  }));

  const rawByMonth = {};
  let maxValue = 0;
  for (let m = 1; m <= curMonth; m++) {
    const [start, end] = monthBounds(year, m - 1);
    const sales = salesForRange(raw, start, end);
    let cost = 0;
    raw.bom.forEach((b) => {
      if (!inRange(dateOf(b, F.bom.date), start, end)) return;
      (b[F.bom.items] || []).forEach((it) => {
        const code = keyOf(it[S.bomItem.code]);
        const qty = it[S.bomItem.qty];
        if (code && !isNil(qty) && code in priceMap) cost += num(qty) * priceMap[code];
      });
    });
    const profit = sales - cost;
    maxValue = Math.max(maxValue, sales, cost, profit);
    rawByMonth[MON_LC[m - 1]] = { sales, cost, profit };
  }
  if (maxValue === 0) maxValue = 1;
  const { label, divisor } = unitFor(maxValue);

  const out = {};
  Object.keys(rawByMonth).forEach((k) => {
    const v = rawByMonth[k];
    out[`${k}_sales`] = scaled(v.sales, divisor);   out[`${k}_sales_height`] = Math.round((v.sales / maxValue) * 80);
    out[`${k}_cost`] = scaled(v.cost, divisor);     out[`${k}_cost_height`] = Math.round((v.cost / maxValue) * 80);
    out[`${k}_profit`] = scaled(v.profit, divisor); out[`${k}_profit_height`] = Math.round((v.profit / maxValue) * 80);
  });
  out.current_year = year; out.current_month = curMonth; out.unit_label = label;
  return out;
}

// sales.monthWiseQuotation(m) / sales.monthWiseOrders(m) for m = 1..12 (current year) -> array of 12
function monthWiseCounts(list, field, year) {
  const out = new Array(12).fill(0);
  list.forEach((r) => { const d = dateOf(r, field); if (d && d.getFullYear() === year) out[d.getMonth()]++; });
  return out;
}

// sales.getPreviousYearsMonthlyRevenue()
// NOTE: originally compared the previous TWO COMPLETE years (e.g. 2025 vs 2024),
// deliberately excluding the current, in-progress year. Changed per explicit
// instruction — "current year is 2026 so we have to compare 2025 vs 2026" —
// to compare the current year (partial, through today) against the previous
// full year instead. Future months of the current year simply have no sales
// yet, so they read as 0, which is the correct behaviour for a partial year.
function getPreviousYearsMonthlyRevenue(raw) {
  const cur = raw.today.getFullYear(), prev = cur - 1;
  const rawByYear = {};
  let maxValue = 0;
  [prev, cur].forEach((y) => {
    rawByYear[y] = MON_LC.map((k, i) => {
      const [start, end] = monthBounds(y, i);
      const rev = salesForRange(raw, start, end);
      maxValue = Math.max(maxValue, rev);
      return rev;
    });
  });
  if (maxValue === 0) maxValue = 1;
  const { label, divisor } = unitFor(maxValue);

  const result = {};
  [prev, cur].forEach((y) => {
    const yd = {};
    MON_LC.forEach((k, i) => {
      yd[`${k}_revenue`] = scaled(rawByYear[y][i], divisor);
      yd[`${k}_height`] = Math.round((rawByYear[y][i] / maxValue) * 80);
    });
    result[String(y)] = yd;
  });
  result.current_year = cur; result.previous_year = prev; result.unit_label = label;
  return result;
}

// sales.Yearoveryeardata()
function yearOverYearData(raw) {
  const cur = raw.today.getFullYear(), prev = cur - 1;
  const ends = [[0, 2, 31], [3, 5, 30], [6, 8, 30], [9, 11, 31]]; // [startMonth0, endMonth0, endDay]
  const q = {};
  ends.forEach(([sm, em, ed], i) => {
    const n = i + 1;
    const c = finalAmountForRange(raw, new Date(cur, sm, 1), new Date(cur, em, ed));
    const p = finalAmountForRange(raw, new Date(prev, sm, 1), new Date(prev, em, ed));
    let growth;
    if (p > 0) growth = round1(((c - p) / p) * 100);
    else if (c > 0) growth = 100;
    else growth = 0;
    q[`q${n}_growth`] = growth; q[`q${n}_revenue`] = c; q[`q${n}_prev_revenue`] = p;
  });
  const maxAbs = Math.max(0, ...[1, 2, 3, 4].map((n) => Math.abs(q[`q${n}_growth`])));
  [1, 2, 3, 4].forEach((n) => {
    const a = Math.abs(q[`q${n}_growth`]);
    let h = maxAbs > 0 ? Math.round((a / maxAbs) * 90) : 10;
    if (a > 0 && h < 10) h = 10;
    q[`q${n}_growth_height`] = h;
  });
  let top = 1, topGrowth = q.q1_growth, topRevenue = q.q1_revenue;
  [2, 3, 4].forEach((n) => { if (q[`q${n}_growth`] > topGrowth) { topGrowth = q[`q${n}_growth`]; top = n; topRevenue = q[`q${n}_revenue`]; } });
  q.top_quarter = top; q.top_growth = topGrowth; q.top_revenue = topRevenue; q.curr_year = cur;
  return q;
}

// sales.getMonthlyCustomerRatings()
function getMonthlyCustomerRatings(raw) {
  const year = raw.today.getFullYear();
  const out = {};
  let totalRatings = 0, totalCount = 0;
  MON_TC.forEach((name, i) => {
    let sum = 0, count = 0;
    raw.serviceFeedback.forEach((r) => {
      const d = dateOf(r, F.serviceFeedback.date);
      if (!d || d.getMonth() !== i || d.getFullYear() !== year) return;
      const rating = parseFloat(r[F.serviceFeedback.rating]);
      if (!isNaN(rating) && rating > 0 && rating <= 5) { sum += rating; count++; }
    });
    if (count > 0) { totalRatings += sum; totalCount += count; }
    out[name] = { average: round2(count > 0 ? sum / count : 0), count };
  });
  out.overall_average = round2(totalCount > 0 ? totalRatings / totalCount : 0);
  out.overall_count = totalCount;
  return out;
}

// Follow-up delay (Benchmarks): days from each quotation to the first follow-up on/after it
// for the same customer; averaged over quotations that have one.
function computeFollowupDelay(raw) {
  let total = 0, count = 0;
  raw.quotation.forEach((q) => {
    const qd = dateOf(q, F.quotation.date);
    const cid = lookupId(q[F.quotation.customer]);
    if (!qd || !cid) return;
    let best = null;
    (raw.followUpDatesByCustomer[cid] || []).forEach((fd) => {
      const diff = daysBetween(qd, fd);
      if (diff >= 0 && (best === null || diff < best)) best = diff;
    });
    if (best !== null) { total += best; count++; }
  });
  return count > 0 ? round1(total / count) : 0;
}

// sales.getBenchmarksAndTargets()
function getBenchmarksAndTargets(raw) {
  const today = stripTime(raw.today), monthStart = monthStartOf(today), year = today.getFullYear();
  const B = F.benchmark;
  const rec = raw.benchmark.find((r) => String(r.ID) === CFG.benchmarkId) || {};
  const t = (k) => num(rec[B[k]]);

  const salesTarget = t("salesValue"), growthTarget = t("growth"), orderTarget = t("orders"), hotTarget = t("hotEnq"),
    dealerTarget = t("dealers"), lostTarget = t("lostOrders"), followupTarget = t("followupDelay");
  // green if >= target, orange if >= factor*target, else red
  const rate = (actual, target, factor) => (actual >= target ? "green" : actual >= target * factor ? "orange" : "red");

  // 1. Sales value (this month)
  const salesActual = finalAmountForRange(raw, monthStart, today);
  const salesVariance = salesActual - salesTarget;
  const salesStatus = rate(salesActual, salesTarget, 0.8);

  // 2. Yearly growth (YTD vs full last year)
  const ytd = finalAmountForRange(raw, new Date(year, 0, 1), today);
  const lastYear = finalAmountForRange(raw, new Date(year - 1, 0, 1), new Date(year - 1, 11, 31));
  let growth = 0, growthDisplay = "0%";
  if (lastYear > 0) {
    growth = round1(((ytd - lastYear) / lastYear) * 100);
    growthDisplay = growth >= 0 ? `+${growth}%` : `${growth}%`;
  } else if (ytd > 0) { growth = 100; growthDisplay = "N/A (First Year)"; }
  const growthVariance = round1(growth - growthTarget);
  const growthVarianceDisplay = growthVariance >= 0 ? `+${growthVariance}%` : `${growthVariance}%`;
  let growthStatus = "red";
  if (growthDisplay === "N/A (First Year)") growthStatus = "orange";
  else if (growth >= growthTarget) growthStatus = "green";
  else if (growth >= growthTarget * 0.8) growthStatus = "orange";

  // 3. Orders confirmed (this month)
  const orderActual = countInRange(raw.orderConfirmation, F.orderConfirmation.date, monthStart, today);

  // 4. Hot enquiries (this month)
  const hotActual = countInRange(raw.leads, F.leads.date, monthStart, today, (r) => r[F.leads.source] === "Hot Enquiry");

  // 5. Dealer appointments (this month)
  const dealerActual = countInRange(raw.dealers, F.dealers.date, monthStart, today);

  // 6. Lost orders reduction (this quarter vs last quarter)
  const qStart = new Date(year, quarterStartMonth0(today), 1);
  const lastQStart = new Date(year, quarterStartMonth0(today) - 3, 1);
  const lastQEnd = subDays(qStart, 1);
  const curLost = countInRange(raw.orderLost, F.orderLost.date, qStart, today);
  const lastLost = countInRange(raw.orderLost, F.orderLost.date, lastQStart, lastQEnd);
  let lostReduction = 0, lostDisplay = "0%";
  if (lastLost > 0) { lostReduction = Math.round(((lastLost - curLost) / lastLost) * 100); lostDisplay = `${lostReduction}%`; }
  else if (curLost === 0 && lastLost === 0) { lostReduction = 100; lostDisplay = "N/A (No Lost Orders)"; }

  // 7. Follow-up delay (lower is better)
  const delayActual = computeFollowupDelay(raw);
  const delayStatus = delayActual <= followupTarget ? "green" : delayActual <= followupTarget * 1.2 ? "orange" : "red";

  return {
    sales_value_target: salesTarget, sales_value: salesActual, sales_variance: salesVariance, sales_value_status: salesStatus,
    growth_target: growthTarget, yearly_growth: growth, yearly_growth_display: growthDisplay,
    growth_variance: growthVariance, growth_variance_display: growthVarianceDisplay, yearly_growth_status: growthStatus,
    order_value: orderTarget, order_value_actual: orderActual, order_variance: orderActual - orderTarget, order_status: rate(orderActual, orderTarget, 0.8),
    hot_enq_target: hotTarget, hot_enq_actual: hotActual, hot_enq_variance: hotActual - hotTarget, hot_enq_status: rate(hotActual, hotTarget, 0.8),
    dealer_target: dealerTarget, dealer_appointments: dealerActual, dealer_variance: dealerActual - dealerTarget, dealer_status: rate(dealerActual, dealerTarget, 0.5),
    lost_orders_target: lostTarget, lost_orders_reduction: lostReduction, lost_orders_display: lostDisplay,
    lost_variance: lostReduction - lostTarget, lost_orders_status: rate(lostReduction, lostTarget, 0.8),
    followup_delay_target: followupTarget, followup_delay_actual: delayActual,
    followup_delay_variance: followupTarget - delayActual, followup_delay_status: delayStatus
  };
}

// Label + start of each of the last 4 quarters, newest first (shared by getLastFourQuarters / getOrderLostReasonsByQuarter)
function lastFourQuarterRanges(today) {
  const curQ = Math.floor(today.getMonth() / 3) + 1;
  return [0, 1, 2, 3].map((i) => {
    let qn = curQ - i, yr = today.getFullYear();
    if (qn <= 0) { qn += 4; yr -= 1; }
    const sm = (qn - 1) * 3;
    return { label: `Q${qn} ${yr}`, start: new Date(yr, sm, 1), end: new Date(yr, sm + 3, 0) };
  });
}

// sales.getLastFourQuarters()  — sums Order_Confirmation.Quote_Amount
function getLastFourQuarters(raw) {
  const out = {};
  lastFourQuarterRanges(raw.today).forEach((q) => {
    out[q.label] = raw.orderConfirmation.reduce((s, r) => (inRange(dateOf(r, F.orderConfirmation.date), q.start, q.end) ? s + num(r[F.orderConfirmation.quoteAmount]) : s), 0);
  });
  return out;
}

// sales.getOrderLostReasonsByQuarter()
function getOrderLostReasonsByQuarter(raw) {
  const out = {};
  lastFourQuarterRanges(raw.today).forEach((q) => {
    let price = 0, quality = 0, delivery = 0, other = 0, total = 0;
    raw.orderLost.forEach((r) => {
      if (!inRange(dateOf(r, F.orderLost.date), q.start, q.end)) return;
      total++;
      const t = lookupName(r[F.orderLost.type]);
      if (t === "Price") price++;
      else if (t === "Service Not Possible") quality++;
      else if (t === "Transport") delivery++;
      else other++;
    });
    const pc = (n) => (total > 0 ? Math.round((n * 100) / total) : 0);
    out[q.label] = { price_issues: pc(price), quality_concerns: pc(quality), delivery_time: pc(delivery), other_reasons: pc(other), total_count: total };
  });
  return out;
}

// sales.getCompetitorAnalysisData()  — Updated_Date shown as "MMM dd, yyyy"
function getCompetitorAnalysisData(raw) {
  const C = F.competitor;
  const or = (v) => (isNil(v) ? "—" : v);
  return raw.competitor.map((r) => {
    const d = dateOf(r, C.updated);
    return {
      competitor_name: or(r[C.name]), market_position: or(r[C.position]), pricing: or(r[C.pricing]),
      key_strengths: or(r[C.strengths]), our_advantage: or(r[C.advantage]),
      updated_date: d ? `${MON_TC[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}` : "—"
    };
  });
}

// inline: Customer_Feedback[ID != null] — API order (newest first by default)
function recentFeedbacks(raw) {
  return raw.customerFeedback.map((r) => ({
    date: r[F.customerFeedback.date], remarks: r[F.customerFeedback.remarks],
    customer: lookupName(r[F.customerFeedback.customer]), rating: r[F.customerFeedback.rating]
  }));
}

// Quotations vs Orders bar maths from the snippet (12-month arrays)
function computeQuotesVsOrders(quotes, orders, today) {
  const maxVal = Math.max(0, ...quotes, ...orders);
  const curMonth = today.getMonth() + 1; // Deluge getMonth() is 1-based
  return MON_LC.map((m, i) => ({
    name: MON_TC[i], quotations: quotes[i], orders: orders[i],
    quotHeight: maxVal !== 0 && quotes[i] !== 0 ? (quotes[i] / maxVal) * 100 : 0,
    ordHeight: maxVal !== 0 && orders[i] !== 0 ? (orders[i] / maxVal) * 100 : 0,
    display: curMonth >= i + 1
  }));
}

// sales.calculateBarWidth(value, maxValue, minWidth)
function calculateBarWidth(value, maxValue, minWidth) {
  if (maxValue === 0) return 0;
  const width = (value / maxValue) * 100;
  return width > 0 && width < minWidth ? minWidth : width;
}

// Sales Last 4 Quarters chart rows from the { label: value } map
function computeLastFourQuarters(quarterMap) {
  const entries = Object.keys(quarterMap || {}).map((label) => ({ label, value: num(quarterMap[label]) }));
  const maxValue = Math.max(0, ...entries.map((e) => e.value));
  return entries.slice(0, 4).map((e) => ({ label: e.label, sales: round1(e.value / 1000), width: calculateBarWidth(e.value, maxValue, 10) }));
}

// Order Lost Reasons chart rows: oldest -> newest (map is newest-first)
function computeLostReasons(lostData) {
  const keys = Object.keys(lostData || {});
  if (keys.length < 4) return null;
  return [3, 2, 1, 0].map((i) => {
    const d = lostData[keys[i]] || {};
    return { label: keys[i], price: d.price_issues, quality: d.quality_concerns, delivery: d.delivery_time, other: d.other_reasons };
  });
}

/* ---------- ASSEMBLE ---------- */
/** One drill-down definition per clickable number on the Today tab. */
function defineDrills(raw) {
  const R = CFG.reports;
  const day = AK.date(raw.today);

  drill("leadsCount", "Leads Today", R.leads, COLS.lead, "Leads with Lead Date = " + day);
  drill("quoteCount", "Quotations Today", R.quotation, COLS.quotation, "Quotations dated " + day);
  drill("ordersDaily", "Orders Today", R.orderConfirmation, COLS.order, "Order Confirmations dated " + day);
  drill("paymentsDaily", "Payments Today", R.paymentTracking, COLS.payment,
    "Payment Tracking advances and Payments Made dated " + day + " with a non-zero amount");
  drill("preVisits", "Pre-Visits Today", R.preSiteVisit, COLS.visit,
    "Pre-Site Visit Observations with Visit Date = " + day + " and Status = Requested");
  drill("adminDelay", "Admin Delay", R.quotation, COLS.quotation,
    "Quotations still in Draft that are dated before " + AK.date(subDays(stripTime(raw.today), 1)),
    "No quotation has been left in Draft.");
  drill("uncontactedQuotes", "Uncontacted Quotes", R.quotationFollowUp, COLS.followUp,
    "Quotation Follow-Up records where Has_Follow_up is false",
    "Every quotation has a follow-up recorded against it.");
  drill("followupDone", "Follow-Ups Done Today", R.quotationFollowUp, COLS.followUpLine,
    "Follow_up subform lines executed " + day + " with Status = Completed",
    "No follow-up was completed today.");
  drill("followupPending", "Missed Schedule", R.quotationFollowUp, COLS.followUp,
    "Follow-ups whose Follow-up Date has passed but are still Pending",
    "Nothing is overdue.");
  drill("qfuPending", "Quotations Pending Follow-Up (> 3 days)", R.quotationFollowUp, COLS.followUp,
    "Follow-ups Pending with a Follow-up Date more than 3 days ago",
    "No follow-up has been pending for more than three days.");
  drill("cusInactive", "Inactive Customers", R.customer, COLS.customer,
    "Customers with Status = Inactive");
  drill("overdue", "Payments Overdue", R.paymentTracking, COLS.payment,
    "Payment Tracking rows more than 15 days past their Due Date that are not Paid",
    "No payment is more than 15 days overdue.");
  drill("previs", "Pre-Visit Observation Alerts", R.preSiteVisit, COLS.visit,
    "Pre-Site Visits older than 3 days that are not Completed",
    "Every pre-site visit older than three days is complete.");

  drill("lost.price", "Orders Lost — Price", R.orderLost, COLS.orderLost, "Orders lost " + day + " for Price");
  drill("lost.transport", "Orders Lost — Transport", R.orderLost, COLS.orderLost, "Orders lost " + day + " for Transport");
  drill("lost.service", "Orders Lost — Service Not Possible", R.orderLost, COLS.orderLost, "Orders lost " + day + " for Service Not Possible");
  drill("lost.toofar", "Orders Lost — Too Far", R.orderLost, COLS.orderLost, "Orders lost " + day + " for Too Far");
  drill("lost.postponed", "Orders Lost — Postponed", R.orderLost, COLS.orderLost, "Orders postponed " + day);
}

function computeAll(raw) {
  const year = raw.today.getFullYear();
  defineDrills(raw);
  return {
    today: raw.today,
    loginUser: raw.loginUser,

    // TODAY
    leadsCount: leadsCount(raw),
    quoteCount: quoteCount(raw),
    ordersDaily: ordersDaily(raw),
    paymentsDaily: paymentsDaily(raw),
    preVisits: preVisitsToday(raw),
    adminDelay: adminDelay(raw),
    uncontactedQuotes: quotationWithNoFollowUp(raw),
    followupDone: followupDonevsPending(raw),
    followupPending: missedSchedule(raw),
    followupDonePct: followupDonePercent(raw),
    qfuPending: followupPending3days(raw),
    cusInactive: inactiveCustomersDaily(raw),
    overdue: paymentOverdue(raw),
    previs: preVisitObservationAlerts(raw),
    lostOrder: lostOrderAnalysisDaily(raw),
    dayQuoteSent: dayWiseQuoteSent(raw),
    dayOrders: dayWiseOrder(raw),
    dayQuoteWOF: dayWiseQuoteWOF(raw),
    dayFollowups: dayWiseFollowupDone(raw),

    // WEEKLY
    wLeads: weeklyLeads(raw),
    wQuoteSent: weeklyQuoteSent(raw),
    wOrders: weeklyOrders(raw),
    wFollowupMissed: weeklyFollowupMissed(raw),
    wPayReceived: weeklyPaymentReceived(raw),
    wPVPending: weeklyPVPending(raw),
    leadSource: weeklyLeadSource(raw),
    wLeadCnt: weeklyLeadCnt(raw),
    wQuoteCnt: weeklySalesQuoteSent(raw),
    wFollowupCnt: weeklyFollowup(raw),
    wOrderCnt: weeklyOrderConfirmed(raw),
    wPayCnt: weeklySalesPaymentReceived(raw),
    leadAwaiting: leadsAwaitingContact(raw),
    avgDelay: averageDelay(raw),
    newDealers: weeklyNewDealersAddedThisMonth(raw),
    preVisitStatus: weeklyPreSiteVisitStatus(raw),
    feedbackAfterVisit: weeklyCustomerFeedback(raw),
    pendingLeads: pendingLeadsOver3Days(raw),

    // MONTHLY
    monthlyQuotes: monthlyQuote(raw),
    ordersConfirmed: orderConfirmedMonthly(raw),
    conversionRate: computeConversionRate(monthlyQuote(raw), orderConfirmedMonthly(raw)),
    revProfitExp: getMonthlyRevenueProfitExpense(raw),
    lostAndAvg: getLostOrderAndAvgOrderValue(raw),
    svcp: getSalesVsCostVsProfit(raw),
    quotesVsOrders: computeQuotesVsOrders(
      monthWiseCounts(raw.quotation, F.quotation.date, year),
      monthWiseCounts(raw.orderConfirmation, F.orderConfirmation.date, year), raw.today),
    revTrend: getPreviousYearsMonthlyRevenue(raw),
    yoy: yearOverYearData(raw),
    ratings: getMonthlyCustomerRatings(raw),
    feedbackList: recentFeedbacks(raw),
    bench: getBenchmarksAndTargets(raw),
    mLeadCnt: monthlyLeadCount(raw),
    mQuoteSentCnt: monthlyQuotesSent(raw),
    mFollowupCnt: monthlyFollowUp(raw),
    mOrderCnt: monthlyOrderConfirmed(raw),
    mPayCnt: monthlyPaymentReceived(raw),
    lastFourQuarters: computeLastFourQuarters(getLastFourQuarters(raw)),
    lostReasons: computeLostReasons(getOrderLostReasonsByQuarter(raw)),
    competitors: getCompetitorAnalysisData(raw)
  };
}

/* ----------------------------------------------------------------
   5. RENDER — TODAY
   ---------------------------------------------------------------- */
function dayRow(label, m) {
  return `<tr><td>${label}</td>${["Mon", "Tue", "Wed", "Thu", "Fri", "Tot"].map((k) => `<td>${show(m ? m[k] : null)}</td>`).join("")}</tr>`;
}

function renderToday(d) {
  const lo = d.lostOrder;
  const loPct = (k) => (lo && !isNil(lo[k]) ? esc(lo[k]) : "—");

  return `
<div class="header-bar">Sales Dashboard — Today’s Overview & Alerts</div>
<div class="container">

  <div class="header">
    <div>
      <h1><i class="fa-solid fa-chart-line"></i> Today’s Overview</h1>
      <div class="subnote">Summary of today's activity</div>
    </div>
    <div style="text-align:right; font-size:13px; color:var(--muted);">
      ${esc(d.loginUser)} | Date: ${fmtDelugeDate(d.today)}
    </div>
  </div>

  <div class="kpi-row">
    <div class="tile"><div class="title"><i class="fa-solid fa-user-plus"></i> Leads</div><div class="value">${dv("leadsCount", show(d.leadsCount))}</div></div>
    <div class="tile"><div class="title"><i class="fa-solid fa-file-invoice"></i> Quotations</div><div class="value">${dv("quoteCount", show(d.quoteCount))}</div></div>
    <div class="tile"><div class="title"><i class="fa-solid fa-phone"></i> Follow-Ups</div><div class="value">${dv("followupDone", show(d.followupDone))} / ${dv("followupPending", show(d.followupPending))}</div></div>
    <div class="tile"><div class="title"><i class="fa-solid fa-briefcase"></i> Orders</div><div class="value">${dv("ordersDaily", show(d.ordersDaily))}</div></div>
    <div class="tile"><div class="title"><i class="fa-solid fa-money-bill-wave"></i> Payments</div><div class="value">${dv("paymentsDaily", moneyDisplay(d.paymentsDaily))}</div></div>
    <div class="tile"><div class="title"><i class="fa-solid fa-calendar-check"></i> Pre-Visits</div><div class="value">${dv("preVisits", show(d.preVisits))}</div></div>
  </div>

  <div class="health-row">
    <div class="health-card red" style="border-bottom: 4px solid var(--alert-red);">
      <div class="hc-title">Admin Delay</div>
      <div class="alert-badge">${dv("adminDelay", show(d.adminDelay))}</div>
    </div>
    <div class="health-card blue" style="border-bottom: 4px solid var(--alert-blue);">
      <div class="hc-title">⚠️ Missed Schedule</div>
      <div class="red-indicator">${dv("followupPending", show(d.followupPending))}</div>
    </div>
    <div class="health-card green" style="border-bottom: 4px solid var(--alert-green);">
      <div class="hc-title">⏳ Uncontacted Quotes</div>
      <div class="red-counter">${dv("uncontactedQuotes", show(d.uncontactedQuotes))}</div>
    </div>
  </div>

  <div class="alerts-card">
    <h3>Critical Alerts</h3>
    <div class="alerts-list">
      <div class="alerts-item"><span class="dot red"></span> Quotations pending follow-up - ${dv("qfuPending", show(d.qfuPending))}</div>
      <div class="alerts-item"><span class="dot yellow"></span> Payments overdue - ${dv("overdue", show(d.overdue))}</div>
      <div class="alerts-item"><span class="dot green"></span> Customers inactive - ${dv("cusInactive", show(d.cusInactive))}</div>
      <div class="alerts-item"><span class="dot green"></span> Service delay - ${dv("previs", show(d.previs))}</div>
    </div>
  </div>

  <div class="main-grid">
    <div class="left-col">
      <div class="lost-card">
        <h3>Order Lost Analysis</h3>
        <div class="donut-wrapper">
          <div id="lost-order-donut" style="max-width:240px;margin:0 auto"></div>
          <div class="legend">
            <div class="legend-item" data-drill="lost.price"><div class="legend-color color-price"></div>Price (${loPct("price")}%)</div>
            <div class="legend-item" data-drill="lost.transport"><div class="legend-color color-transport"></div>Transport (${loPct("transport")}%)</div>
            <div class="legend-item" data-drill="lost.service"><div class="legend-color color-service"></div>Service Not Possible (${loPct("service_not_possible")}%)</div>
            <div class="legend-item" data-drill="lost.toofar"><div class="legend-color color-toofar"></div>Too Far (${loPct("toofar")}%)</div>
            <div class="legend-item" data-drill="lost.postponed"><div class="legend-color color-postponed"></div>Postponed (${loPct("postponed")}%)</div>
          </div>
        </div>
      </div>
    </div>
    <div class="right-col">
      <div class="health-card followup-done">
        <div class="hc-title">✅ Follow-Ups Done</div>
        <div class="hc-sub">Target: 90%</div>
        <div class="followup-progress" style="--percent:${d.followupDonePct.percent};">
          <div class="progress-track"><div class="progress-fill"></div></div>
          <div class="percent-row"><span>${d.followupDonePct.percent}%</span><span class="target">Target 90%</span></div>
        </div>
      </div>
    </div>
  </div>

  <div class="table-card">
    <h3>Day-wise Rolling View</h3>
    <table>
      <thead>
        <tr><th>Metric</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${dayRow("Quotations Sent", d.dayQuoteSent)}
        ${dayRow("Follow-Ups", d.dayFollowups)}
        ${dayRow("Orders", d.dayOrders)}
        ${dayRow("Quotations Without Follow-Up", d.dayQuoteWOF)}
      </tbody>
    </table>
  </div>

</div>`;
}

/* ----------------------------------------------------------------
   5b. RENDER — WEEKLY
   ---------------------------------------------------------------- */
// arr = [current, last, "increase"|"decrease", change]
function changeCell(arr, isPercent) {
  if (!arr) return `<td>—</td>`;
  const dir = arr[2], chg = show(arr[3]), s = isPercent ? "%" : "";
  if (dir === "decrease") return `<td style="color:red;">-${chg}${s}</td>`;
  if (dir === "increase" && num(arr[3]) === 0) return `<td>${chg}${s}</td>`;
  if (dir === "increase") return `<td>+${chg}${s}</td>`;
  return `<td></td>`;
}

function weeklyKpiRow(label, arr, prefix, isPercent) {
  return `
        <tr>
          <td>${label}</td>
          <td>${arr ? prefix + show(arr[0]) : "—"}</td>
          <td>${arr ? prefix + show(arr[1]) : "—"}</td>
          ${changeCell(arr, isPercent)}
        </tr>`;
}

function renderWeekly(d) {
  const pv = d.preVisitStatus || {};

  const pendingRows = d.pendingLeads.length === 0
    ? `<tr><td colspan="3" style="text-align:center;">No pending leads</td></tr>`
    : d.pendingLeads.map((p) => `
        <tr>
          <td>${esc(p.customer)}</td>
          <td>${esc(p.products.join(", "))}</td>
          <td>${show(p.age)}</td>
        </tr>`).join("");

  return `
  <div class="dashboard-cnt2">
    <h2>Weekly Tracker & Lead Conversion Overview</h2>

    <div class="section-cnt2">
      <h3><span></span>Weekly KPI Highlights</h3>
      <table class="kpi-table-cnt2">
        <tr>
          <th>Metric</th>
          <th>Current Week</th>
          <th>Last Week</th>
          <th>Change</th>
        </tr>
        ${weeklyKpiRow("New Leads", d.wLeads, "", true)}
        ${weeklyKpiRow("Quotations Sent", d.wQuoteSent, "", true)}
        ${weeklyKpiRow("Orders Confirmed", d.wOrders, "", true)}
        ${weeklyKpiRow("Payments Received (₹)", d.wPayReceived, "₹", true)}
        ${weeklyKpiRow("Follow-Ups Missed", d.wFollowupMissed, "", false)}
        ${weeklyKpiRow("Pre-Visits Pending", d.wPVPending, "", false)}
      </table>
    </div>

    <div class="section-cnt2">
      <div class="row-cnt2" style="align-items: flex-start; justify-content: space-between; gap: 40px;">

        <div class="lead-cnt2-source" style="flex: 1; min-width: 400px;">
          <h3 style="margin-bottom: 20px;"><span></span>Lead Source & Conversion</h3>
          <div id="lead-source-chart"></div>
        </div>

        <div class="funnel-cnt2-wrapper" style="flex: 1; min-width: 400px; display: flex; flex-direction: column; align-items: center;">
          <h3 style="margin-bottom: 20px;"><span></span>Sales</h3>
          <div id="weekly-funnel-chart" style="width:100%"></div>
        </div>
      </div>

      <div class="metrics-cnt2" style="display:flex; gap:15px; margin-top:30px; flex-wrap:wrap;">
        <div class="metric-box"><h4>New Dealers Added This Month</h4><p>${show(d.newDealers)}</p></div>
        <div class="metric-box"><h4>Lead Awaiting Contact</h4><p>${show(d.leadAwaiting)}</p></div>
        <div class="metric-box"><h4>Average Delay (Days)</h4><p>${show(d.avgDelay)}</p></div>
      </div>
    </div>

    <div class="section-cnt2">
      <h3><span></span>Pre-Visit & Service Coordination</h3>

      <div class="row-cnt2" style="align-items:center; margin-top: 20px;">
        <div class="bar-cnt2-chart" style="flex:1; min-width:320px; margin: 0;">
          <h4>Pre-Visit Requests vs Completed</h4>
          <div id="previsit-chart"></div>
        </div>

        <div class="gauge-cnt2-wrapper">
          <div style="font-weight:600;font-size:13px;text-align:center;margin-bottom:6px">Feedback After Visit (%)</div>
          <div id="feedback-visit-gauge"></div>
        </div>
      </div>

      <h4 style="margin-top:30px;">Pending >3 Days (Detailed)</h4>
      <table class="pending-table">
        <tr><th>Customer</th><th>Product</th><th>Age (Days)</th></tr>
        ${pendingRows}
      </table>
    </div>

  </div>`;
}

/* ----------------------------------------------------------------
   5c. RENDER — MONTHLY
   ---------------------------------------------------------------- */
function mountQuotesOrdersChart(months) {
  const el = document.getElementById("quotes-orders-chart");
  if (!el) return;
  const filtered = (months || []).filter((m) => m.display);
  if (!filtered.length) { el.innerHTML = AK.emptyPanel("No quotations/orders data available.", 220); return; }
  AK.mountChart("quotes-orders-chart", {
    chart: { type: "bar", height: 280, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [
      { name: "Quotations", data: filtered.map((m) => num(m.quotations)) },
      { name: "Orders", data: filtered.map((m) => num(m.orders)) }
    ],
    xaxis: { categories: filtered.map((m) => m.name) },
    colors: AK.categoricalColors(2),
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => AK.int(v) } }
  });
}

function mountSalesCostProfitChart(svcp) {
  const el = document.getElementById("svcp-chart");
  if (!el) return;
  const months = svcp ? MON_LC.map((m, i) => ({ key: m, label: MON_TC[i] })).filter((m) => !isNil(svcp[`${m.key}_sales`])) : [];
  if (!months.length) { el.innerHTML = AK.emptyPanel("No monthly sales/cost/profit data available.", 220); return; }
  AK.mountChart("svcp-chart", {
    chart: { type: "bar", height: 280, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [
      { name: "Sales", data: months.map((m) => num(svcp[`${m.key}_sales`])) },
      { name: "Cost", data: months.map((m) => num(svcp[`${m.key}_cost`])) },
      { name: "Profit", data: months.map((m) => num(svcp[`${m.key}_profit`])) }
    ],
    xaxis: { categories: months.map((m) => m.label) },
    colors: AK.categoricalColors(3),
    plotOptions: { bar: { borderRadius: 4, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => AK.money(v) } }
  });
}

function revenueTrendTitle(rt) {
  return rt ? `(${esc(rt.current_year)} vs ${esc(rt.previous_year)})` : "";
}

function mountRevenueTrendChart(rt) {
  const el = document.getElementById("revenue-trend-chart");
  if (!el) return;
  if (!rt) { el.innerHTML = AK.emptyPanel("No revenue trend data available.", 220); return; }
  const cy = rt[String(rt.current_year)] || {};
  const py = rt[String(rt.previous_year)] || {};
  AK.mountChart("revenue-trend-chart", {
    chart: { type: "bar", height: 280, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [
      { name: String(rt.current_year), data: MON_LC.map((m) => num(cy[`${m}_revenue`])) },
      { name: String(rt.previous_year), data: MON_LC.map((m) => num(py[`${m}_revenue`])) }
    ],
    xaxis: { categories: MON_TC },
    colors: AK.categoricalColors(2),
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => AK.int(v) } }
  });
}

function lakhs(v) { return round1(num(v) / 100000); }

function renderYoyBanner(y) {
  const topLabel = y ? `Q${esc(y.top_quarter)} ${esc(y.curr_year)}` : "—";
  const topGrowth = y ? show(y.top_growth) : "—";
  const topRev = y ? `₹${fmtNum(lakhs(y.top_revenue))}L` : "—";
  return `
  <div class="c3-top-banner">
    <div class="c3-top-banner-title">Top Performing Quarter: ${topLabel}</div>
    <div class="c3-top-banner-sub">Growth: +${topGrowth}% YOY &nbsp;|&nbsp; Revenue: ${topRev}</div>
  </div>`;
}

function mountYoyChart(y) {
  const el = document.getElementById("yoy-chart");
  if (!el) return;
  if (!y) { el.innerHTML = AK.emptyPanel("No year-over-year data available.", 220); return; }

  const quarters = [1, 2, 3, 4].map((q) => "Q" + q);
  const growth = [1, 2, 3, 4].map((q) => num(y[`q${q}_growth`]));

  AK.mountChart("yoy-chart", {
    chart: { type: "bar", height: 240, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "YoY Growth", data: growth }],
    xaxis: { categories: quarters },
    plotOptions: {
      bar: {
        borderRadius: 4, columnWidth: "45%",
        colors: {
          ranges: [
            { from: -100000, to: -0.001, color: AK.chartColors.critical },
            { from: 0, to: 0, color: AK.chartColors.critical },
            { from: 0.001, to: 29.999, color: AK.chartColors.warning },
            { from: 30, to: 100000, color: AK.chartColors.good }
          ]
        }
      }
    },
    dataLabels: { enabled: true, formatter: (v) => (v >= 0 ? "+" : "") + fmtNum(v) + "%" },
    tooltip: { y: { formatter: (v) => fmtNum(v) + "%" } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderBenchmarks(b) {
  const g = (k) => (b ? b[k] : null);
  const row = (label, target, actual, variance, rawStatus) => `
    <tr>
      <td>${label}</td>
      <td>${target}</td>
      <td>${actual}</td>
      <td>${variance}</td>
      <td><span class="c3-circle ${statusColor(rawStatus)}">${statusSymbol(rawStatus)}</span></td>
    </tr>`;
  return `
<table class="c3-bench-table">
  <thead>
    <tr>
      <th style="width:28%">Metric</th><th>Target</th><th>Actual</th><th>Variance</th><th style="width:80px">Status</th>
    </tr>
  </thead>
  <tbody>
    ${row("Sales Value (₹)", `₹${show(g("sales_value_target"))}`, `₹${show(g("sales_value"))}`, signed(g("sales_variance")), g("sales_value_status"))}
    ${row("Growth %", `${show(g("growth_target"))}%`, show(g("yearly_growth_display")), show(g("growth_variance_display")), g("yearly_growth_status"))}
    ${row("Orders Confirmed", show(g("order_value")), show(g("order_value_actual")), signed(g("order_variance")), g("order_status"))}
    ${row("Hot Enquiries", show(g("hot_enq_target")), show(g("hot_enq_actual")), signed(g("hot_enq_variance")), g("hot_enq_status"))}
    ${row("Dealer Appointments", `${show(g("dealer_target"))}/month`, show(g("dealer_appointments")), signed(g("dealer_variance")), g("dealer_status"))}
    ${row("Lost Orders Reduction", `${show(g("lost_orders_target"))}%`, show(g("lost_orders_display")),
      isNil(g("lost_variance")) ? "—" : `${signed(g("lost_variance"))}%`, g("lost_orders_status"))}
    ${row("Follow-up Delay", `≤${show(g("followup_delay_target"))} days`, `${show(g("followup_delay_actual"))} days`,
      isNil(g("followup_delay_variance")) ? "—"
        : num(g("followup_delay_variance")) >= 0 ? `-${fmtNum(num(g("followup_delay_variance")))}d` : `+${fmtNum(num(g("followup_delay_variance")) * -1)}d over`,
      g("followup_delay_status"))}
  </tbody>
</table>`;
}

function renderSatisfaction(r, feedbackList) {
  const overall = r ? num(r.overall_average) : 0;
  const fullStars = Math.floor(overall);
  const hasHalf = overall - fullStars >= 0.5;
  const stars = [1, 2, 3, 4, 5].map((i) =>
    i <= fullStars || (i === fullStars + 1 && hasHalf)
      ? `<span class="c3-star">★</span>` : `<span class="c3-star empty">★</span>`).join("");

  const items = feedbackList.map((f) => `
        <div class="c3-feedback-item">
          <div class="c3-feedback-date">${esc(f.date)}</div>
          <div class="c3-feedback-text">${esc(f.remarks)} — ${esc(f.customer)} — Rating: ${esc(f.rating)}</div>
        </div>`).join("");

  return `
  <div class="c3-sat-grid">
    <div>
      <div class="c3-rating-score">${r ? fmtNum(round1(overall)) : "—"}</div>
      <div class="c3-stars">${stars}</div>
      <div class="c3-rating-lbl">Average Customer Rating</div>
      <div id="satisfaction-chart" style="margin-top:20px;"></div>
    </div>
    <div>
      <div style="font-size:14px;font-weight:700;color:#1f2937;margin-bottom:12px;">Recent Feedbacks</div>
      <div class="c3-feedback-list">${items}</div>
    </div>
  </div>`;
}

function mountSatisfactionChart(r) {
  const el = document.getElementById("satisfaction-chart");
  if (!el) return;
  AK.mountChart("satisfaction-chart", {
    chart: { type: "bar", height: 220, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "Avg Rating", data: MON_TC.map((m) => { const md = r && r[m] ? r[m] : null; return md ? num(md.average) : 0; }) }],
    xaxis: { categories: MON_TC },
    yaxis: { max: 5 },
    colors: [AK.chartColors.yellow],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "45%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => fmtNum(v) + " / 5" } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderCompetitors(list) {
  const cell = (v) => (isNil(v) ? "—" : esc(v));
  const rows = list.length > 0
    ? list.map((c) => `
        <tr>
          <td><strong>${cell(c.competitor_name)}</strong></td>
          <td>${cell(c.market_position)}</td>
          <td>${cell(c.pricing)}</td>
          <td>${cell(c.key_strengths)}</td>
          <td>${cell(c.our_advantage)}</td>
          <td>${cell(c.updated_date)}</td>
        </tr>`).join("")
    : `<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:20px;">No competitor data available.</td></tr>`;
  return `
  <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
    <table class="c3-comp-table">
      <thead>
        <tr><th>Competitor</th><th>Market Position</th><th>Pricing</th><th>Key Strengths</th><th>Our Advantage</th><th>Updated</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function renderMonthly(d) {
  const rp = d.revProfitExp || {};
  const la = d.lostAndAvg || {};

  return `
<div class="c3-header">Monthly &amp; Quarterly Business Performance Dashboard</div>

<div class="c3">

<div class="c3-tiles">
  <div class="c3-tile"><div class="c3-tile-label">Total Quotations</div><div class="c3-tile-value">${show(d.monthlyQuotes)}</div></div>
  <div class="c3-tile"><div class="c3-tile-label">Orders Confirmed</div><div class="c3-tile-value">${show(d.ordersConfirmed)}</div></div>
  <div class="c3-tile"><div class="c3-tile-label">Conversion Rate</div><div class="c3-tile-value">${show(d.conversionRate)}%</div></div>
  <div class="c3-tile"><div class="c3-tile-label">Revenue</div><div class="c3-tile-value">${show(rp.revenue_display)}</div></div>
  <div class="c3-tile"><div class="c3-tile-label">Profit</div><div class="c3-tile-value">${show(rp.profit_display)}</div></div>
  <div class="c3-tile"><div class="c3-tile-label">Expenses</div><div class="c3-tile-value">${show(rp.expense_display)}</div></div>
  <div class="c3-tile">
    <div class="c3-tile-label">Lost Orders (Value)</div>
    <div class="c3-tile-value">${show(la.lost_orders_value_display)}</div>
    <div class="c3-tile-sub">${show(la.lost_orders_count)} orders</div>
  </div>
  <div class="c3-tile"><div class="c3-tile-label">Avg Order Value</div><div class="c3-tile-value">${show(la.avg_order_value_display)}</div></div>
</div>

<div class="c3-card">
  <div class="c3-card-title">Sales vs Cost vs Profit (Monthly)</div>
  <div id="svcp-chart"></div>
</div>

<div class="c3-card">
  <div class="c3-card-title">Quotations vs Orders per Month</div>
  <div id="quotes-orders-chart"></div>
</div>

<div class="c3-card">
  <div class="c3-card-title">Monthly Sales Revenue Trend ${revenueTrendTitle(d.revTrend)}</div>
  <div id="revenue-trend-chart"></div>
</div>

<div class="c3-card">
  <div class="c3-card-title">Year-over-Year Growth (%)</div>
  <div id="yoy-chart"></div>
  ${renderYoyBanner(d.yoy)}
</div>

<div class="c3-card">
  <div class="c3-card-title">Monthly Sales Funnel</div>
  <div id="monthly-funnel-chart"></div>
</div>

<div class="c3-two-col">
  <div class="c3-card" style="margin-bottom:0">
    <div class="c3-card-title">Sales Last 4 Quarters</div>
    <div id="last-quarters-chart"></div>
  </div>

  <div class="c3-card" style="margin-bottom:0">
    <div class="c3-card-title">Order Lost Reasons by Quarter</div>
    <div id="lost-reasons-chart"></div>
  </div>
</div>

<div class="c3-card">
  <div class="c3-card-title">Benchmarks &amp; Targets</div>
  ${renderBenchmarks(d.bench)}
</div>

<div class="c3-card">
  <div class="c3-card-title">Customer Satisfaction</div>
  ${renderSatisfaction(d.ratings, d.feedbackList)}
</div>

<div class="c3-card">
  <div class="c3-card-title">Competitor Analysis</div>
  ${renderCompetitors(d.competitors)}
</div>

</div>`;
}

function mountMonthlyFunnelChart(d) {
  const el = document.getElementById("monthly-funnel-chart");
  if (!el) return;
  const stages = [
    ["Lead Counts", d.mLeadCnt], ["Quotations Sent", d.mQuoteSentCnt], ["Follow-Ups Done", d.mFollowupCnt],
    ["Orders Confirmed", d.mOrderCnt], ["Payments Received", d.mPayCnt]
  ];
  AK.mountFunnel("monthly-funnel-chart", stages.map((s) => ({ label: s[0], value: num(s[1]) })));
}

function mountLastFourQuartersChart(list) {
  const el = document.getElementById("last-quarters-chart");
  if (!el) return;
  if (!list || !list.length) { el.innerHTML = AK.emptyPanel("No quarterly sales data available.", 200); return; }
  AK.mountChart("last-quarters-chart", {
    chart: { type: "bar", height: 240, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "Sales (₹K)", data: list.map((q) => num(q.sales)) }],
    xaxis: { categories: list.map((q) => q.label) },
    colors: AK.categoricalColors(list.length),
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%", distributed: true } },
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (v) => "₹" + fmtNum(v) + "K" },
    grid: { borderColor: "#e5e7eb" }
  });
}

function mountLostReasonsChart(rows) {
  const el = document.getElementById("lost-reasons-chart");
  if (!el) return;
  if (!rows || !rows.length) { el.innerHTML = AK.emptyPanel("No order-lost reason data available.", 200); return; }
  const reasonKeys = ["price", "quality", "delivery", "other"];
  const reasonLabels = ["Price", "Quality", "Delivery", "Other"];
  AK.mountChart("lost-reasons-chart", {
    chart: { type: "bar", height: Math.max(200, rows.length * 60), stacked: true, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: reasonKeys.map((k, i) => ({ name: reasonLabels[i], data: rows.map((q) => num(q[k])) })),
    xaxis: { categories: rows.map((q) => q.label) },
    colors: AK.categoricalColors(4),
    plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: "55%" } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => v + "%" } }
  });
}

function mountTodayCharts(d) {
  const el = document.getElementById("lost-order-donut");
  if (!el) return;
  const lo = d.lostOrder;
  if (!lo || num(lo.total) === 0) { el.innerHTML = AK.emptyPanel("No orders were marked lost today.", 200); return; }

  const cats = ["Price", "Transport", "Service Not Possible", "Too Far", "Postponed"];
  const keys = ["price", "transport", "service_not_possible", "toofar", "postponed"];
  const drillKeys = ["lost.price", "lost.transport", "lost.service", "lost.toofar", "lost.postponed"];

  AK.mountChart("lost-order-donut", {
    chart: {
      type: "donut", height: 260, fontFamily: "Poppins, sans-serif",
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill(drillKeys[opts.dataPointIndex]) }
    },
    series: keys.map((k) => num(lo[k])),
    labels: cats,
    colors: AK.categoricalColors(5),
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (v) => v.toFixed(0) + "%" },
    stroke: { width: 2, colors: ["#fff"] },
    tooltip: { y: { formatter: (v) => v + "%" } }
  });
}

function mountLeadSourceChart(ls) {
  const el = document.getElementById("lead-source-chart");
  if (!el) return;
  const cats = ["IndiaMART", "Justdial", "Cold Calls", "Existing Customers", "Referrals", "Dealers / OEM"];
  AK.mountChart("lead-source-chart", {
    chart: { type: "bar", height: 260, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "Share", data: cats.map((c, i) => num(ls ? ls[i] : 0)) }],
    xaxis: { categories: cats, max: 100 },
    colors: AK.categoricalColors(cats.length),
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%", distributed: true } },
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (v) => v + "%" },
    grid: { borderColor: "#e5e7eb" }
  });
}

function mountWeeklyFunnelChart(d) {
  const el = document.getElementById("weekly-funnel-chart");
  if (!el) return;
  const stages = [
    ["Lead Counts", d.wLeadCnt], ["Quotations Sent", d.wQuoteCnt], ["Follow-Ups Done", d.wFollowupCnt],
    ["Orders Confirmed", d.wOrderCnt], ["Payments Received", d.wPayCnt]
  ];
  AK.mountFunnel("weekly-funnel-chart", stages.map((s) => ({ label: s[0], value: num(s[1]) })));
}

function mountPrevisitChart(pv) {
  const el = document.getElementById("previsit-chart");
  if (!el) return;
  AK.mountChart("previsit-chart", {
    chart: { type: "bar", height: 140, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "Count", data: [num(pv.Requested_Count), num(pv.Completed_Count)] }],
    xaxis: { categories: ["Requested", "Completed"] },
    colors: AK.categoricalColors(2),
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "50%", distributed: true } },
    legend: { show: false },
    dataLabels: { enabled: true, formatter: (v) => AK.int(v) },
    grid: { borderColor: "#e5e7eb" }
  });
}

function mountFeedbackGauge(fb) {
  const el = document.getElementById("feedback-visit-gauge");
  if (!el) return;
  AK.mountChart("feedback-visit-gauge", {
    chart: { type: "radialBar", height: 200, fontFamily: "Poppins, sans-serif" },
    series: [Math.max(0, Math.min(100, num(fb)))],
    labels: ["Feedback"],
    colors: [AK.chartColors.blue],
    plotOptions: {
      radialBar: {
        hollow: { size: "58%" }, startAngle: -90, endAngle: 90,
        track: { background: "#e5e7eb" },
        dataLabels: {
          name: { fontSize: "12px", color: "#6b7280", offsetY: -4 },
          value: { fontSize: "22px", fontWeight: 700, color: "#1f2937", offsetY: 4, formatter: (v) => v + "%" }
        }
      }
    }
  });
}

/* ----------------------------------------------------------------
   6. INIT
   ---------------------------------------------------------------- */
// Shown at the top of every tab when a report couldn't be read
function renderFetchBanner() {
  const names = Object.keys(FETCH_FAILURES);
  if (!names.length) return "";
  const keyOf = (rn) => Object.keys(CFG.reports).find((k) => CFG.reports[k] === rn) || "?";
  const items = names.map((rn) => `<li><b>${esc(rn)}</b> (CFG.reports.${esc(keyOf(rn))}) — ${esc(FETCH_FAILURES[rn])}</li>`).join("");
  return `<div class="sales-error" style="margin-bottom:12px;"><i class="fas fa-exclamation-triangle"></i>
    <b>${names.length} report(s) could not be loaded</b> — the numbers that depend on them are incomplete.
    Check the report link name (and that this user can read the report):<ul style="margin:6px 0 0 18px;">${items}</ul></div>`;
}

function renderDashboard(computed) {
  const banner = renderFetchBanner();
  document.getElementById("content1").innerHTML = banner + renderToday(computed);
  document.getElementById("content2").innerHTML = banner + renderWeekly(computed);
  document.getElementById("content3").innerHTML = banner + renderMonthly(computed);

  // Make every number that has a drill-down clickable (chart clicks are wired via events above).
  AK.autoBind(document);

  mountTodayCharts(computed);
  mountLeadSourceChart(computed.leadSource);
  mountWeeklyFunnelChart(computed);
  mountPrevisitChart(computed.preVisitStatus || {});
  mountFeedbackGauge(computed.feedbackAfterVisit);
  mountSalesCostProfitChart(computed.svcp);
  mountQuotesOrdersChart(computed.quotesVsOrders);
  mountRevenueTrendChart(computed.revTrend);
  mountYoyChart(computed.yoy);
  mountMonthlyFunnelChart(computed);
  mountLastFourQuartersChart(computed.lastFourQuarters);
  mountLostReasonsChart(computed.lostReasons);
  mountSatisfactionChart(computed.ratings);
}

function renderError(msg) {
  ["content1", "content2", "content3"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="sales-error"><i class="fas fa-exclamation-triangle"></i> Failed to load dashboard: ${esc(msg)}</div>`;
  });
}

async function initSalesDashboard() {
  try {
    const raw = await fetchAllDashboardData();
    renderDashboard(computeAll(raw));

    AK.report();
    console.log("%c[salesPerformanceSummary] ready — click any count to see the records behind it.",
      "color:#15803d;font-weight:bold");

    // One-time field discovery for every report this dashboard reads — paste the console
    // output back to fix any remaining guessed field name in one pass. Safe to delete once
    // every field in CFG.fields is confirmed against real data.
    AK.discoverAllFields(CFG.reports);
  } catch (err) {
    console.error("Sales Dashboard error:", err);
    renderError(err && err.message ? err.message : "Unknown error");
  }
}

AK.init({ name: "salesPerformanceSummary" });

// Zoho Creator widget bootstrap — V2 JS API needs no init() call
initSalesDashboard();
