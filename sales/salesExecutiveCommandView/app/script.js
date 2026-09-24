/* ============================================================
   Executive Command View — Widget JS

   Migrated from the Deluge HTML snippet. Every thisapp.executiveDashboard.*
   and thisapp.sales.* function used by the original page has been
   reimplemented client-side against the same underlying forms, using
   ZOHO.CREATOR.DATA.getRecords with record_cursor pagination.

   ------------------------------------------------------------
   CONFIRM THESE REPORT LINK NAMES BEFORE RUNNING.
   Deluge addresses FORMS (e.g. Sales_Order_Entry_SRS); the JS API
   addresses REPORTS. The names below are the conventional Creator
   report names for those forms, but they are a guess on my part —
   check them against Reports in your app builder and correct any
   that differ. Every wrong name shows up as a 3100/invalid-report
   error in the console naming the exact report.
   ------------------------------------------------------------ */
const REPORT = {
  ORDER_CONFIRMATION:  "All_Order_Confirmations",
  SRS:                  "Sales_Order_Entry_SRS_Report",
  PAYMENT_TRACKING:     "All_Payment_Trackings",
  PAYMENT_MADE:         "Payment_Made_Report",
  QUOTATION:            "Quotation1",
  QUOTATION_FOLLOW_UP:  "Quotation_Follow_Up_Report",
  CALLING_FOLLOW_UP:    "Customer_Calling___follow_up",
  ORDER_LOST:           "Order_lost_Analysis_Report",
  SERVICE_FEEDBACK:     "All_Service_Feedback1",
  CUSTOMER_ADDRESS:     "Customer_Addresses",
  CUSTOMER:             "All_Customers",
  ABC_CONFIG:           "Abc_Customer_Classifications"
};

// Record ID of the single ABC threshold config row (from the Deluge page).
const ABC_CONFIG_ID = "302392000001792002";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CITY_NORMALIZATION = {
  "Combatore": "Coimbatore",
  "Tirupur": "Tiruppur",
  "tiruvannamalai": "Tiruvannamalai"
};

const DEBUG = true;

/* ============================================================
   DRILL-DOWN PLUMBING
   Every count on screen can be clicked to see the records behind it.
   ============================================================ */
const SRC = {};

const COLS = {
  order: [
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Quotation No", value: "Quotation_No" },
    { label: "Customer", value: "Customer_Name" }, // confirmed via fields.txt — Customer_Company doesn't exist on this report
    { label: "Final Amount", value: "Final_Amount", format: "money" }
  ],
  srs: [
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Customer", value: "Company_Customer_Name" }, // confirmed via fields.txt — was "Customer_Name" (wrong)
    { label: "Status", value: "Status" },
    { label: "Value", value: "Final_Amount", format: "money" } // confirmed via fields.txt — was "Total_Amount" (doesn't exist)
  ],
  paymentMade: [
    { label: "Payment Date", value: "Payment_Date", format: "date" },
    { label: "Payable", value: "Payable_Amount", format: "money" },
    { label: "Balance", value: "Balance_Amount", format: "money" }
  ],
  paymentTracking: [
    { label: "Payment Date", value: "Payment_Date", format: "date" },
    { label: "Customer", value: "Customer_Name" }, // confirmed via fields.txt — Customer_Company doesn't exist on this report
    { label: "Advance", value: "Advance_Amount", format: "money" },
    { label: "Status", value: "Follow_upStatus" }
  ],
  lead: [
    { label: "Lead Date", value: "Lead_Date", format: "date" },
    { label: "Customer", value: "Customer_Company" },
    { label: "Source", value: "Lead_Source" },
    { label: "Status", value: "Status" }
  ],
  quotation: [
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Customer", value: "Customer_Company" },
    { label: "Status", value: "Status" },
    { label: "Grand Total", value: "Grand_Total", format: "money" }
  ],
  orderLost: [
    { label: "Date", value: "Date_field", format: "date" },
    { label: "Customer", value: "Customer_Name" },
    { label: "Quotation", value: "Quotation" },
    { label: "Reason", value: "Type_Of_Lost" }
  ],
  customer: [
    { label: "Customer", value: "Customer_Company" },
    { label: "Code", value: "Customer_Code" },
    { label: "Status", value: "Status" }
  ],
  abcCustomer: [
    { label: "Customer", value: "Customer_Company" },
    { label: "Code", value: "Customer_Code" },
    { label: "Revenue", value: "Revenue", format: "money" }
  ]
};

function drill(key, title, report, columns, srcKey, subtitle, empty) {
  AK.defineDrill(key, {
    title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
    rows: function () { return SRC[srcKey] || []; }
  });
}


/* ============================================================
   DATA ACCESS
   ============================================================ */

// Pulls every record from a report, following the V2 record cursor
// until Creator stops returning one. No artificial page cap — this
// is the fix for the previous version, which silently truncated
// every report to its first 200 records.
function getAllRecords(reportName, criteria) {
  return new Promise(function (resolve, reject) {
    if (!reportName) {
      console.error("getAllRecords called with an undefined report name. " +
        "Check the REPORT map at the top of script.js.");
      resolve([]);
      return;
    }

    const all = [];
    const PAGE_SIZE = 1000; // Creator's max per-request page size
    const MAX_RETRIES = 5;
    const fetchStarted = Date.now();

    // Codes that mean "this report legitimately has nothing to return" —
    // treat as an empty set, not a failure. 3100 is "no records found";
    // 9220 is Creator's "No records exist in this report" variant.
    function isEmptyReportError(err) {
      const text = (err && err.responseText) ? String(err.responseText) : "";
      const code = err && (err.code || (function () {
        try { return JSON.parse(text).code; } catch (e) { return null; }
      })());
      return code === 3100 || code === 9220 ||
        text.indexOf("3100") > -1 || text.indexOf("9220") > -1;
    }

    // Code 2955 / HTTP 429 = Creator's per-second concurrency limit.
    // Back off and retry instead of treating it as a hard failure.
    function isRateLimitError(err) {
      const text = (err && err.responseText) ? String(err.responseText) : "";
      const code = err && (err.code || (function () {
        try { return JSON.parse(text).code; } catch (e) { return null; }
      })());
      return err && (err.status === 429 || code === 2955);
    }

    function fetchPage(cursor, retryCount) {
      const config = {
        report_name: reportName,
        field_config: "all",
        max_records: PAGE_SIZE
      };
      if (criteria) config.criteria = criteria;
      if (cursor) config.record_cursor = cursor;

      ZOHO.CREATOR.DATA.getRecords(config).then(function (resp) {
        const batch = (resp && resp.data) || [];
        for (let i = 0; i < batch.length; i++) all.push(batch[i]);

        // Keep following the cursor until Creator stops sending one —
        // that's the actual signal that every record has been fetched.
        if (!resp.record_cursor) {
          AK.logFetch({
            label: reportName, report: reportName, params: config,
            rows: all, ms: Date.now() - fetchStarted
          });
          resolve(all);
          return;
        }
        fetchPage(resp.record_cursor, 0);
      }).catch(function (err) {
        if (isEmptyReportError(err)) {
          AK.logFetch({
            label: reportName, report: reportName, params: config, rows: all,
            ms: Date.now() - fetchStarted, note: 'Creator reported "no records"'
          });
          resolve(all);
          return;
        }

        if (isRateLimitError(err)) {
          if (retryCount >= MAX_RETRIES) {
            console.error("getRecords still rate-limited after retries for report:", reportName, err);
            AK.logFetch({
              label: reportName, report: reportName, params: config, rows: all,
              ms: Date.now() - fetchStarted, error: err,
              note: "rate limited after " + MAX_RETRIES + " retries"
            });
            reject(err);
            return;
          }
          // Exponential backoff with jitter: ~600ms, 1.2s, 2.4s, 4.8s, 9.6s
          const delay = 600 * Math.pow(2, retryCount) + Math.random() * 300;
          console.warn("Rate limited on report:", reportName, "- retrying in", Math.round(delay), "ms");
          setTimeout(function () { fetchPage(cursor, retryCount + 1); }, delay);
          return;
        }

        console.error("getRecords failed for report:", reportName, err);
        AK.logFetch({
          label: reportName, report: reportName, params: config, rows: all,
          ms: Date.now() - fetchStarted, error: err
        });
        reject(err);
      });
    }

    fetchPage(null, 0);
  });
}

// Runs a list of zero-arg promise-returning functions with at most
// `limit` in flight at once, so we never fire all 12 report fetches
// simultaneously and trip Creator's per-second concurrency cap.
function runWithConcurrency(taskFns, limit) {
  return new Promise(function (resolve, reject) {
    const results = new Array(taskFns.length);
    let nextIndex = 0;
    let inFlight = 0;
    let settled = false;

    function runNext() {
      if (settled) return;
      if (nextIndex >= taskFns.length) {
        if (inFlight === 0) { settled = true; resolve(results); }
        return;
      }
      const i = nextIndex++;
      inFlight++;
      taskFns[i]().then(function (val) {
        results[i] = val;
        inFlight--;
        runNext();
      }).catch(function (err) {
        if (!settled) { settled = true; reject(err); }
      });
      // Stagger kickoff slightly even within the concurrency window,
      // rather than firing `limit` requests in the exact same tick.
      if (inFlight < limit) runNext();
    }

    for (let k = 0; k < limit; k++) runNext();
  });
}



/* ============================================================
   VALUE HELPERS
   Creator returns lookups as objects or ID strings, and currency
   as formatted strings like "1,25,000.00" — parseFloat on that
   returns 1, which silently destroys every total.
   ============================================================ */

function num(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return val;
  const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function lookupId(val) {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "object") return String(val.ID || "");
  return String(val);
}

function lookupDisplay(val) {
  if (val === null || val === undefined || val === "") return "";
  if (typeof val === "object") {
    return val.zc_display_value || val.Customer_Name || val.display_value || "";
  }
  return String(val);
}

// BUG FIXED: this only ever matched "dd-MMM-yyyy" (alphabetic month, e.g.
// "22-Sep-2026"). The live data in this app actually comes back as
// "dd-MM-yyyy" numeric (e.g. "22-09-2026" — confirmed directly off real
// Order_Confirmation / SRS records: Date_field, Quotation_Date,
// Commited_Delivery_Date all use this numeric form). The old regex never
// matched it, fell through to `new Date("22-09-2026")`, which V8 treats as
// invalid (22 isn't a valid month) — so getYear()/getMonth() returned null
// for every record, and every date-filtered chart/table on this dashboard
// (Monthly Sales Revenue, Conversion/Lost Trend, YoY, Customer Growth,
// Regional Sales, Top Lost Orders, Alerts — 19 call sites) silently read as
// empty. Delegating to the kit's AK.parseDate, which already handles both
// dd-MM-yyyy and dd-MMM-yyyy (and yyyy-MM-dd, with or without a time part)
// the same way every other adroit dashboard does.
function parseDate(val) {
  return AK.parseDate(val);
}

function getYear(val) { const d = parseDate(val); return d ? d.getFullYear() : null; }
function getMonth(val) { const d = parseDate(val); return d ? d.getMonth() + 1 : null; } // 1-12

function round(n, places) {
  const f = Math.pow(10, places || 0);
  return Math.round(n * f) / f;
}

// Descending sort by a numeric key — matches the Deluge insertion-sort output.
function sortDesc(list, key) {
  return list.slice().sort(function (a, b) { return num(b[key]) - num(a[key]); });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ============================================================
   ENTRY POINT
   Fetches every report once, then derives all sections from the
   in-memory data. The original page hit the server per function;
   one shared fetch is far cheaper from the browser.
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  AK.init({ name: "salesExecutiveCommandView" });
  loadDashboard();
});

// Max simultaneous getRecords calls in flight. Zoho Creator's widget API
// enforces a per-second concurrency cap (you'll see HTTP 429 / code 2955
// if you exceed it) — 3 is a safe default. Lower this further if you still
// see 429s after the retry/backoff in getAllRecords kicks in.
const REPORT_FETCH_CONCURRENCY = 3;

function loadDashboard() {
  runWithConcurrency([
    function () { return getAllRecords(REPORT.ORDER_CONFIRMATION, null); },
    function () { return getAllRecords(REPORT.SRS, null); },
    function () { return getAllRecords(REPORT.PAYMENT_TRACKING, null); },
    function () { return getAllRecords(REPORT.PAYMENT_MADE, null); },
    function () { return getAllRecords(REPORT.QUOTATION, null); },
    function () { return getAllRecords(REPORT.QUOTATION_FOLLOW_UP, null); },
    function () { return getAllRecords(REPORT.CALLING_FOLLOW_UP, null); },
    function () { return getAllRecords(REPORT.ORDER_LOST, null); },
    function () { return getAllRecords(REPORT.SERVICE_FEEDBACK, null); },
    function () { return getAllRecords(REPORT.CUSTOMER_ADDRESS, null); },
    function () { return getAllRecords(REPORT.CUSTOMER, null); },
    function () { return getAllRecords(REPORT.ABC_CONFIG, null); }
  ], REPORT_FETCH_CONCURRENCY).then(function (r) {
    const db = {
      orderConfirmation: r[0],
      srs:               r[1],
      paymentTracking:   r[2],
      paymentMade:       r[3],
      quotation:         r[4],
      quotationFollowUp: r[5],
      callingFollowUp:   r[6],
      orderLost:         r[7],
      serviceFeedback:   r[8],
      customerAddress:   r[9],
      customer:          r[10],
      abcConfig:         r[11]
    };

    if (DEBUG) {
      console.groupCollapsed("%c[salesExecutiveCommandView] datasets loaded", "color:#2563eb;font-weight:bold");
      Object.keys(db).forEach(function (k) {
        const rows = db[k];
        console.log(
          "%c" + k.padEnd(20) + AK.int(rows.length).padStart(6) + " records",
          rows.length ? "color:#15803d" : "color:#b45309;font-weight:bold",
          rows[0] ? Object.keys(rows[0]) : "(EMPTY — check the report link name and this user's access)"
        );
      });
      console.groupEnd();
    }

    // Datasets the drill-downs read directly.
    SRC.orders = db.orderConfirmation;
    SRC.payments = db.paymentTracking;
    SRC.quotations = db.quotation;
    SRC.orderLost = db.orderLost;
    SRC.customers = db.customer;
    drill("db.orders", "All Order Confirmations", REPORT.ORDER_CONFIRMATION, COLS.order, "orders");
    drill("db.payments", "All Payment Trackings", REPORT.PAYMENT_TRACKING, COLS.paymentTracking, "payments");
    drill("db.quotations", "All Quotations", REPORT.QUOTATION, COLS.quotation, "quotations");
    drill("db.orderLost", "All Lost Orders", REPORT.ORDER_LOST, COLS.orderLost, "orderLost");
    drill("db.customers", "All Customers", REPORT.CUSTOMER, COLS.customer, "customers");

    renderKpiRow(db);
    renderRegionalSales(regionalSalesTopRegions(db));
    renderTopCustomersBySales(customerGrowthFunc(db).srs_collection);
    renderTopLostOrders(topLostOrders(db));
    renderMonthlyRevenue(calcMonthlyRevenue(db));
    renderConversionLostTrend(calcConversionAndLostTrend(db));
    renderTopCustomersByPayment(topCustomersByPayment(db));
    renderTopProducts(topProducts(db));
    renderAlerts(getAlertsSummary(db));
    renderOrdersVsPayments(db);
    renderFunnel(db);
    renderYoyGrowth(db);
    renderAbcChart(abcClassification(db));
    initCardReveal();

    AK.autoBind(document);
    AK.report();
    console.log("%c[salesExecutiveCommandView] ready — click any count to see the records behind it.",
      "color:#15803d;font-weight:bold");

    // One-time field discovery for every report this dashboard reads — paste the console
    // output back to fix any remaining guessed field name in one pass. Safe to delete once
    // every field this file reads off REPORT is confirmed against real data.
    AK.discoverAllFields(REPORT);

    // Tell the loader overlay (in widget.html) the real render is done.
    // It still waits for the minimum 5s before revealing, so short loads
    // don't feel like a flash — but it won't reveal an unfinished dashboard.
    if (typeof window.markDashboardReady === "function") window.markDashboardReady();
  }).catch(function (err) {
    console.error("Dashboard load failed:", err);
    const el = document.getElementById("globalError");
    if (el) {
      el.style.display = "block";
      el.textContent =
        "Unable to load dashboard data. Check the report link names in REPORT at the top of script.js " +
        "against your app's Reports list — the console names the report that failed.";
    }
    // Reveal the (error-state) dashboard rather than leaving the loader
    // spinning forever if the load genuinely failed.
    if (typeof window.markDashboardReady === "function") window.markDashboardReady();
  });
}

/* ============================================================
   executiveDashboard.tileFunc()
   Returns overall_conversion and lost_orders %.
   ============================================================ */
function tileFunc(db) {
  const totalLeads = db.callingFollowUp.length;

  const totalOrders = db.srs.filter(function (o) {
    return o.Status === "Confirmed";
  }).length;

  let overallConversion = 0;
  if (totalLeads > 0) overallConversion = Math.round(totalOrders * 100.0 / totalLeads);
  if (overallConversion > 100) overallConversion = 100;
  if (overallConversion <= 0) overallConversion = 0;

  const totalSrs = db.srs.length;
  const cancelled = db.srs.filter(function (o) { return o.Status === "Cancel"; }).length;
  let lostPct = 0;
  if (totalSrs > 0) lostPct = round(cancelled * 100.0 / totalSrs, 1);

  return { overall_conversion: overallConversion, lost_orders: lostPct };
}

/* ============================================================
   sales.Yearoveryeardata()
   Quarterly revenue vs prior year; returns the top-growth quarter.
   ============================================================ */
function yearOverYearData(db) {
  const currYear = new Date().getFullYear();
  const prevYear = currYear - 1;

  const quarters = {
    1: [1, 3], 2: [4, 6], 3: [7, 9], 4: [10, 12]
  };

  function revenueForRange(year, startM, endM) {
    let sum = 0;
    db.orderConfirmation.forEach(function (o) {
      const y = getYear(o.Date_field), m = getMonth(o.Date_field);
      if (y === year && m >= startM && m <= endM) sum += num(o.Final_Amount);
    });
    return sum;
  }

  let topQuarter = 1, topGrowth = null, topRevenue = 0;

  [1, 2, 3, 4].forEach(function (q) {
    const range = quarters[q];
    const curr = revenueForRange(currYear, range[0], range[1]);
    const prev = revenueForRange(prevYear, range[0], range[1]);

    let growth;
    if (prev > 0) growth = round((curr - prev) / prev * 100, 1);
    else if (curr > 0) growth = 100;
    else growth = 0;

    if (topGrowth === null || growth > topGrowth) {
      topGrowth = growth;
      topQuarter = q;
      topRevenue = curr;
    }
  });

  return {
    top_quarter: topQuarter,
    top_growth: topGrowth,
    top_revenue: topRevenue,
    curr_year: currYear,
    top_quarter_label: "Q" + topQuarter + " " + currYear
  };
}

/* ============================================================
   executiveDashboard.customerGrowthFunc()
   New vs repeat customer counts + per-customer SRS totals.
   ============================================================ */
function customerGrowthFunc(db) {
  const byCustomer = {};

  db.srs.forEach(function (rec) {
    const id = lookupId(rec.Company_Customer_Name);
    if (!id) return;
    if (!byCustomer[id]) {
      byCustomer[id] = {
        customer_name: lookupDisplay(rec.Company_Customer_Name),
        count: 0,
        srs_value: 0
      };
    }
    // Deluge counts and sums only non-cancelled orders.
    if (rec.Status !== "Cancel") {
      byCustomer[id].count += 1;
      byCustomer[id].srs_value += num(rec.Final_Amount);
    }
  });

  let newCustomers = 0, oldCustomers = 0;
  const coll = [];

  Object.keys(byCustomer).forEach(function (id) {
    const c = byCustomer[id];
    if (c.count > 1) oldCustomers++;
    else if (c.count === 1) newCustomers++;
    coll.push({
      customer_name: c.customer_name,
      count: c.count,
      srs_value: round(c.srs_value, 2)
    });
  });

  return {
    new_customers: newCustomers,
    old_customers: oldCustomers,
    srs_collection: sortDesc(coll, "srs_value")
  };
}

/* ============================================================
   executiveDashboard.regionalSalesTopRegions()
   SRS billing address -> Customer_Address -> district_city, summed.
   ============================================================ */
function regionalSalesTopRegions(db) {
  // Index addresses by record ID so we can resolve the SRS lookup.
  const addrById = {};
  db.customerAddress.forEach(function (a) {
    const city = (a.Address && (a.Address.district_city || a.Address.District_City)) || "";
    addrById[String(a.ID)] = city;
  });

  const cityTotals = {};

  db.srs.forEach(function (rec) {
    if (rec.Status === "Cancel") return;

    const addrId = lookupId(rec.Billing_Address);
    let city = addrById[addrId] || "";
    city = String(city).trim();
    if (!city) return;

    if (CITY_NORMALIZATION[city]) city = CITY_NORMALIZATION[city];

    cityTotals[city] = (cityTotals[city] || 0) + num(rec.Final_Amount);
  });

  const list = Object.keys(cityTotals).map(function (city) {
    return { city: city, value: round(cityTotals[city], 1) };
  });

  return sortDesc(list, "value");
}

/* ============================================================
   executiveDashboard.topLostOrders()
   Lost-order records joined to their quotation for quote no + value.
   ============================================================ */
function topLostOrders(db) {
  const quoteById = {};
  db.quotation.forEach(function (q) { quoteById[String(q.ID)] = q; });

  const coll = [];
  db.orderLost.forEach(function (lost) {
    if (!lost.Customer_Name) return;
    const q = quoteById[lookupId(lost.Quotation)];
    if (!q) return;
    if (q.Quote === null || q.Quote === undefined || q.Quote === "") return;
    if (q.Grand_Total === null || q.Grand_Total === undefined || q.Grand_Total === "") return;

    coll.push({ quotation_number: q.Quote, value: num(q.Grand_Total) });
  });

  return sortDesc(coll, "value");
}

/* ============================================================
   executiveDashboard.calcMonthlyRevenue()
   Payment_Tracking.Advance_Amount + Payment_Made.Payable_Amount,
   bucketed by Payment_Date month, current year up to this month.
   ============================================================ */
function calcMonthlyRevenue(db) {
  const currYear = new Date().getFullYear();
  const currMonth = new Date().getMonth() + 1;
  const list = [];

  for (let m = 1; m <= currMonth; m++) {
    let total = 0;

    db.paymentTracking.forEach(function (rec) {
      if (getYear(rec.Payment_Date) === currYear && getMonth(rec.Payment_Date) === m) {
        total += num(rec.Advance_Amount);
      }
    });

    db.paymentMade.forEach(function (rec) {
      if (getYear(rec.Payment_Date) === currYear && getMonth(rec.Payment_Date) === m) {
        total += num(rec.Payable_Amount);
      }
    });

    list.push({ month: MONTH_NAMES[m - 1], revenue: round(total, 2) });
  }

  return list;
}

/* ============================================================
   executiveDashboard.calcConversionAndLostTrend()
   Per month: quotations, how many converted to an SRS, lost count.
   ============================================================ */
function calcConversionAndLostTrend(db) {
  const currYear = new Date().getFullYear();
  const currMonth = new Date().getMonth() + 1;

  // Quotation IDs that have at least one non-cancelled SRS against them.
  const convertedQuoteIds = {};
  db.srs.forEach(function (o) {
    if (o.Status === "Cancel") return;
    const qid = lookupId(o.Quotation_No);
    if (qid) convertedQuoteIds[qid] = true;
  });

  const conversionTrend = [];
  const lostTrend = [];

  for (let m = 1; m <= currMonth; m++) {
    let totalQuotes = 0, converted = 0;

    db.quotation.forEach(function (q) {
      if (getYear(q.Date_field) === currYear && getMonth(q.Date_field) === m) {
        totalQuotes++;
        if (convertedQuoteIds[String(q.ID)]) converted++;
      }
    });

    let lostCount = 0;
    db.orderLost.forEach(function (l) {
      if (getYear(l.Date_field) === currYear && getMonth(l.Date_field) === m) lostCount++;
    });

    let convRate = 0, lostRate = 0;
    if (totalQuotes > 0) {
      convRate = round(converted / totalQuotes * 100, 2);
      lostRate = round(lostCount / totalQuotes * 100, 2);
    }

    const name = MONTH_NAMES[m - 1];
    conversionTrend.push({ month: name, rate: convRate, count: converted, total: totalQuotes });
    lostTrend.push({ month: name, rate: lostRate, count: lostCount, total: totalQuotes });
  }

  return { conversion_trend: conversionTrend, lost_trend: lostTrend };
}

/* ============================================================
   executiveDashboard.topCustomersByPayment()
   Paid = sum(Final_Amount) - sum(Balance_Amount) per customer.
   ============================================================ */
function topCustomersByPayment(db) {
  const byCustomer = {};

  db.paymentTracking.forEach(function (rec) {
    const id = lookupId(rec.Customer_Name);
    if (!id) return;
    if (!byCustomer[id]) {
      byCustomer[id] = {
        customer_name: lookupDisplay(rec.Customer_Name),
        final: 0,
        balance: 0
      };
    }
    byCustomer[id].final += num(rec.Final_Amount);
    byCustomer[id].balance += num(rec.Balance_Amount);
  });

  const list = Object.keys(byCustomer).map(function (id) {
    const c = byCustomer[id];
    return {
      customer_id: id,
      customer_name: c.customer_name,
      total_payment: round(c.final - c.balance, 2)
    };
  });

  return sortDesc(list, "total_payment").slice(0, 5);
}

/* ============================================================
   Top Products (inline in the original page)
   Order_Confirmation.Product_Details.Product_Name x Quantity.
   ============================================================ */
function topProducts(db) {
  const totals = {};

  db.orderConfirmation.forEach(function (o) {
    if (!o.Product_Details) return;
    const name = lookupDisplay(o.Product_Details) ||
                 (o.Product_Details && o.Product_Details.Product_Name) || "";
    if (!name) return;
    totals[name] = (totals[name] || 0) + num(o.Quantity);
  });

  const list = Object.keys(totals).map(function (name) {
    return { product_name: name, total_quantity: totals[name] };
  });

  return sortDesc(list, "total_quantity").slice(0, 5);
}

/* ============================================================
   executiveDashboard.getAlertsSummary()
   ============================================================ */
function getAlertsSummary(db) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(monthStart.getTime() - 86400000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);

  function sumOrdersBetween(from, to) {
    let s = 0;
    db.orderConfirmation.forEach(function (o) {
      const d = parseDate(o.Date_field);
      if (d && d >= from && d <= to) s += num(o.Final_Amount);
    });
    return s;
  }

  // 1. Revenue target — this month vs last month
  const thisMonthRevenue = sumOrdersBetween(monthStart, now);
  const lastMonthRevenue = sumOrdersBetween(lastMonthStart, lastMonthEnd);

  let revenueStatus = "warning";
  let revenueMsg = "No revenue data available for this month.";
  if (lastMonthRevenue > 0) {
    const pct = Math.round(thisMonthRevenue / lastMonthRevenue * 100);
    if (pct >= 100) {
      revenueStatus = "success";
      revenueMsg = "Monthly goal achieved at 100% compared to last month - Great work!";
    } else if (pct >= 80) {
      revenueStatus = "warning";
      revenueMsg = "Revenue at " + pct + "% of last month. Push to close more orders!";
    } else {
      revenueStatus = "danger";
      revenueMsg = "Revenue at only " + pct + "% of last month. Immediate action needed!";
    }
  } else if (thisMonthRevenue > 0) {
    revenueStatus = "success";
    revenueMsg = "First month revenue recorded: ₹" + thisMonthRevenue;
  }

  // 2. Payment pending
  const pending = db.paymentTracking.filter(function (p) {
    return p.Follow_upStatus === "Un Paid" || p.Follow_upStatus === "Partial";
  }).length;

  let paymentStatus = "success";
  let paymentMsg = "All payments are up to date.";
  if (pending > 50) {
    paymentStatus = "danger";
    paymentMsg = pending + " orders awaiting payment confirmation. Urgent follow-up needed!";
  } else if (pending > 10) {
    paymentStatus = "warning";
    paymentMsg = pending + " orders awaiting payment confirmation.";
  } else if (pending > 0) {
    paymentStatus = "info";
    paymentMsg = pending + " orders pending payment — on track.";
  }

  // 3. Overdue payments
  const overdue = db.paymentTracking.filter(function (p) {
    const due = parseDate(p.Due_Date);
    return p.Follow_upStatus === "Un Paid" && due && due < now;
  }).length;

  let overdueStatus = "success";
  let overdueMsg = "No overdue payments.";
  if (overdue > 0) {
    overdueStatus = "danger";
    overdueMsg = overdue + " payments are overdue (past due date). Immediate collection required!";
  }

  // 4. Follow-up delay
  const staleQuotes = db.quotation.filter(function (q) {
    const d = parseDate(q.Date_field);
    return d && d <= threeDaysAgo && d >= monthStart;
  }).length;

  const followedUp = db.quotationFollowUp.filter(function (f) {
    const d = parseDate(f.Date_field);
    return d && d >= monthStart;
  }).length;

  let delayStatus = "success";
  let delayMsg = "All quotations have been followed up promptly.";
  if (staleQuotes > followedUp) {
    const uncontacted = staleQuotes - followedUp;
    if (uncontacted > 10) {
      delayStatus = "danger";
      delayMsg = uncontacted + " quotations have no follow-up beyond 3 days. Action required!";
    } else if (uncontacted > 0) {
      delayStatus = "warning";
      delayMsg = uncontacted + " quotations pending follow-up for more than 3 days.";
    }
  }

  // 5. Lost orders this month
  const lostThisMonth = db.orderLost.filter(function (l) {
    const d = parseDate(l.Date_field);
    return d && d >= monthStart && d <= now;
  }).length;

  let lostStatus = "success";
  let lostMsg = "No lost orders this month. Excellent!";
  if (lostThisMonth > 10) {
    lostStatus = "danger";
    lostMsg = lostThisMonth + " orders lost this month. Review pricing and follow-up strategy.";
  } else if (lostThisMonth > 3) {
    lostStatus = "warning";
    lostMsg = lostThisMonth + " orders lost this month. Monitor closely.";
  } else if (lostThisMonth > 0) {
    lostStatus = "info";
    lostMsg = lostThisMonth + " order(s) lost this month — within acceptable range.";
  }

  // 6. Customer satisfaction
  let ratingSum = 0, ratingCount = 0;
  db.serviceFeedback.forEach(function (f) {
    const d = parseDate(f.Call_attended_date);
    if (d && d >= monthStart && f.Rating !== null && f.Rating !== undefined && f.Rating !== "") {
      ratingSum += num(f.Rating);
      ratingCount++;
    }
  });
  const avgRating = ratingCount > 0 ? round(ratingSum / ratingCount, 1) : 0;

  let satStatus = "success";
  let satMsg = "No feedback received this month yet.";
  if (avgRating > 0) {
    if (avgRating >= 4.5) {
      satStatus = "success";
      satMsg = "Customer satisfaction rating: " + avgRating + "/5.0 — Excellent!";
    } else if (avgRating >= 3.5) {
      satStatus = "warning";
      satMsg = "Customer satisfaction rating: " + avgRating + "/5.0 — Room for improvement.";
    } else {
      satStatus = "danger";
      satMsg = "Customer satisfaction rating: " + avgRating + "/5.0 — Critical attention needed!";
    }
  }

  return {
    revenue_status: revenueStatus, revenue_msg: revenueMsg,
    payment_status: paymentStatus, payment_msg: paymentMsg,
    overdue_status: overdueStatus, overdue_msg: overdueMsg,
    delay_status: delayStatus, delay_msg: delayMsg,
    lost_status: lostStatus, lost_msg: lostMsg,
    sat_status: satStatus, sat_msg: satMsg
  };
}

/* ============================================================
   ABC Customer Revenue Analysis (inline in the original page)
   ============================================================ */
function abcClassification(db) {
  // Thresholds live on one config record.
  let cfg = db.abcConfig.filter(function (c) { return String(c.ID) === ABC_CONFIG_ID; })[0];
  if (!cfg) cfg = db.abcConfig[0] || {};

  const thresholdA = num(cfg.Customer_A) || 1000000;
  const thresholdBStart = num(cfg.Customer_B_St_Amount) || 500000;
  const thresholdBEnd = num(cfg.Customer_B_End_Amount) || 1000000;
  const thresholdC = num(cfg.Customer_C) || 500000;

  // Customer record lookup — used both for the drill-through links and the
  // in-widget drill-down modal's customer list.
  const customerById = {};
  db.customer.forEach(function (c) { customerById[String(c.ID)] = c; });

  // Revenue per customer from Payment_Tracking.
  const revenueById = {};
  let totalRevenue = 0;

  db.paymentTracking.forEach(function (rec) {
    const id = lookupId(rec.Customer_Name);
    if (!id) return;
    const amt = num(rec.Payment_Amount);
    revenueById[id] = (revenueById[id] || 0) + amt;
    totalRevenue += amt;
  });

  let aAmt = 0, bAmt = 0, cAmt = 0;
  const aRows = [], bRows = [], cRows = [];

  Object.keys(revenueById).forEach(function (id) {
    const rev = revenueById[id];
    const cust = customerById[id];
    const code = cust ? cust.Customer_Code : "";
    // Synthetic row for the drill-down modal: real customer identity + the
    // revenue that put them in this category (not a raw report record, so
    // the modal's columns read it back as plain fields, not lookups).
    const row = {
      Customer_Company: cust ? cust.Customer_Company : ("(customer #" + id + ")"),
      Customer_Code: code,
      Revenue: rev
    };

    if (rev >= thresholdA) { aAmt += rev; aRows.push(row); }
    else if (rev >= thresholdBStart && rev <= thresholdBEnd) { bAmt += rev; bRows.push(row); }
    else if (rev <= thresholdC) { cAmt += rev; cRows.push(row); }
  });

  const byRevDesc = function (a, b) { return b.Revenue - a.Revenue; };
  aRows.sort(byRevDesc); bRows.sort(byRevDesc); cRows.sort(byRevDesc);

  const pct = function (amt) {
    return totalRevenue > 0 ? round(amt / totalRevenue * 100, 2) : 0;
  };

  SRC.abcCatA = aRows;
  SRC.abcCatB = bRows;
  SRC.abcCatC = cRows;

  drill("abc.catA", "Category A Customers", REPORT.CUSTOMER, COLS.abcCustomer, "abcCatA",
    "Customers whose total Payment_Tracking revenue is ₹" + thresholdA + " and above",
    "No customer's revenue reaches the Category A threshold.");
  drill("abc.catB", "Category B Customers", REPORT.CUSTOMER, COLS.abcCustomer, "abcCatB",
    "Customers whose total Payment_Tracking revenue is between ₹" + thresholdBStart + " and ₹" + thresholdBEnd,
    "No customer's revenue falls in the Category B range.");
  drill("abc.catC", "Category C Customers", REPORT.CUSTOMER, COLS.abcCustomer, "abcCatC",
    "Customers whose total Payment_Tracking revenue is below ₹" + thresholdC,
    "No customer's revenue falls under the Category C threshold.");

  return {
    catA_amount: round(aAmt, 2), catB_amount: round(bAmt, 2), catC_amount: round(cAmt, 2),
    catA_count: aRows.length, catB_count: bRows.length, catC_count: cRows.length,
    catA_pct: pct(aAmt), catB_pct: pct(bAmt), catC_pct: pct(cAmt),
    threshold_a: thresholdA,
    threshold_b_start: thresholdBStart,
    threshold_b_end: thresholdBEnd,
    threshold_c: thresholdC
  };
}

/* ============================================================
   ANIMATION HELPERS
   Cards below the fold fade/slide in as they're scrolled to.
   Bars, the ABC chart, and YOY bars grow from 0 once their data
   is in the DOM, instead of snapping straight to their final size.
   ============================================================ */

// Reveals .card elements as they enter the viewport. Cards already
// on-screen at load (e.g. the KPI tiles' siblings) get marked visible
// immediately rather than waiting on a scroll event that may never fire.
function initCardReveal() {
  const cards = document.querySelectorAll(".card");
  if (!("IntersectionObserver" in window)) {
    cards.forEach(function (c) { c.classList.add("is-visible"); });
    return;
  }
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  cards.forEach(function (c) { observer.observe(c); });
}

// Each KPI tile gets one accent color and one glyph — its visual identity.
const KPI_META = [
  { accent: "#10b981", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },      // Total Revenue
  { accent: "#f59e0b", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },                                                       // Conversion Rate
  { accent: "#0ea5e9", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>' },                                     // Outstanding Payments
  { accent: "#f43f5e", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>' },                                                // Lost Orders %
  { accent: "#8b5cf6", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' }, // Customer Growth
  { accent: "#14b8a6", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>' } // Top Performing Quarter
];

// Animates a KPI value's numeric portion counting up from 0 to its target,
// preserving any non-numeric prefix/suffix (₹, %, "L", " / " pairs, etc.)
// exactly as formatted by the caller.
function animateKpiValue(el, text) {
  const match = String(text).match(/^([^\d\-]*)(-?[\d.]+)(.*)$/);
  if (!match) { el.textContent = text; return; }

  const prefix = match[1], target = parseFloat(match[2]), suffix = match[3];
  const decimals = (match[2].split(".")[1] || "").length;
  if (isNaN(target)) { el.textContent = text; return; }

  const duration = 900;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const current = target * eased;
    el.textContent = prefix + current.toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + target.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(tick);
}

/* ============================================================
   RENDERERS
   ============================================================ */

function renderKpiRow(db) {
  const tiles = tileFunc(db);
  const growth = customerGrowthFunc(db);
  const yoy = yearOverYearData(db);

  // Outstanding payments: sum of positive Balance_Amount on Payment_Made.
  let outstanding = 0;
  const outstandingRows = [];
  db.paymentMade.forEach(function (p) {
    const bal = num(p.Balance_Amount);
    if (bal > 0) { outstanding += bal; outstandingRows.push(p); }
  });

  // NOTE: sales.getOverallRevenueForExecCommandOverview() was not supplied,
  // so total revenue is derived here as the sum of all Order_Confirmation
  // Final_Amount, rendered in lakhs to match the original "₹xxL" display.
  // Replace this block once you send that function's logic.
  let totalRevenue = 0;
  db.orderConfirmation.forEach(function (o) { totalRevenue += num(o.Final_Amount); });
  const revenueDisplay = "₹" + AK.dec(round(totalRevenue / 100000, 1)) + "L";

  SRC.revenue = db.orderConfirmation;
  SRC.leads = db.callingFollowUp;
  SRC.outstanding = outstandingRows;
  SRC.lostOrders = db.srs.filter(function (o) { return o.Status === "Cancel"; });
  SRC.confirmed = db.srs.filter(function (o) { return o.Status === "Confirmed"; });

  drill("kpi.revenue", "Total Revenue", REPORT.ORDER_CONFIRMATION, COLS.order, "revenue",
    "Final Amount summed over every Order Confirmation — " + AK.money(totalRevenue));
  drill("kpi.conversion", "Confirmed Orders", REPORT.SRS, COLS.srs, "confirmed",
    "SRS records with Status = Confirmed, divided by " + AK.int(db.callingFollowUp.length) + " leads");
  drill("kpi.outstanding", "Outstanding Payments", REPORT.PAYMENT_MADE, COLS.paymentMade, "outstanding",
    "Payments Made rows with a positive Balance Amount",
    "Nothing is outstanding.");
  drill("kpi.lost", "Lost Orders", REPORT.SRS, COLS.srs, "lostOrders",
    "SRS records with Status = Cancel",
    "No order has been cancelled.");
  drill("kpi.leads", "All Leads", REPORT.CALLING_FOLLOW_UP, COLS.lead, "leads",
    "Every Customer Calling / Follow-up record");

  const rows = [
    ["Total Revenue (₹)", revenueDisplay, "kpi.revenue"],
    ["Conversion Rate (%)", AK.pct(tiles.overall_conversion, 0), "kpi.conversion"],
    ["Outstanding Payments (₹)", AK.money(outstanding), "kpi.outstanding"],
    ["Lost Orders %", AK.pct(tiles.lost_orders), "kpi.lost"],
    ["Customer Growth (New vs Repeat)", AK.int(growth.new_customers) + " / " + AK.int(growth.old_customers), "kpi.leads"],
    ["Top Performing Quarter", yoy.top_quarter_label, null]
  ];

  const kpiRow = document.getElementById("kpiRow");
  kpiRow.innerHTML = rows.map(function (t, i) {
    const meta = KPI_META[i] || KPI_META[0];
    return '<div class="kpi-tile" style="--tile-accent:' + meta.accent + '; animation-delay:' + (i * 70) + 'ms;">' +
      '<div class="kpi-icon">' + meta.icon + '</div>' +
      '<div class="kpi-title">' + escapeHtml(t[0]) + '</div>' +
      '<div class="kpi-value"' + (t[2] ? ' data-drill="' + t[2] + '"' : "") +
      ' data-final="' + escapeHtml(t[1]) + '"></div></div>';
  }).join("");

  kpiRow.querySelectorAll(".kpi-value").forEach(function (el) {
    animateKpiValue(el, el.getAttribute("data-final"));
  });
  AK.autoBind(kpiRow);
}

function renderRegionalSales(list) {
  let rows = "<tr><th>Region</th><th>Value</th></tr>";
  const top = (list || []).slice(0, 5);
  if (!top.length) {
    rows += AK.emptyRow(2, "No regional sales found — check that Customer Addresses carry a city.");
  } else {
    top.forEach(function (r) {
      rows += "<tr><td>" + escapeHtml(r.city) + "</td><td>" + AK.money(r.value) + "</td></tr>";
    });
  }
  document.getElementById("regionalSalesTable").innerHTML = rows;
}

function renderTopCustomersBySales(list) {
  let rows = "<tr><th>Customer</th><th>Sales Value</th></tr>";
  const top = (list || []).slice(0, 10);
  if (!top.length) {
    rows += AK.emptyRow(2, "No customer has sales recorded against them yet.");
  } else {
    top.forEach(function (c) {
      rows += "<tr><td><span class='customerName'>" + escapeHtml(c.customer_name) +
        "</span></td><td>" + AK.money(num(c.srs_value)) + "</td></tr>";
    });
  }
  document.getElementById("topCustomersTable").innerHTML = rows;
}

function renderTopLostOrders(list) {
  let rows = "<tr><th>Order (Quote)</th><th>Value</th></tr>";
  const top = (list || []).slice(0, 5);
  if (!top.length) {
    rows += AK.emptyRow(2, "No lost orders recorded.");
  } else {
    top.forEach(function (o) {
      rows += "<tr><td>" + escapeHtml(o.quotation_number) + "</td><td>" + AK.money(o.value) + "</td></tr>";
    });
  }
  document.getElementById("lostOrdersTable").innerHTML = rows;
}

function renderMonthlyRevenue(monthlyRevenue) {
  const container = document.getElementById("monthlyBarChart");
  if (!monthlyRevenue || !monthlyRevenue.length) { container.innerHTML = ""; return; }

  AK.mountChart("monthlyBarChart", {
    chart: { type: "bar", height: 280, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "Revenue", data: monthlyRevenue.map(function (m) { return m.revenue; }) }],
    xaxis: { categories: monthlyRevenue.map(function (m) { return m.month === "Sep" ? "Sept" : m.month; }) },
    colors: [AK.chartColors.blue],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "55%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: function (v) { return "₹" + AK.int(v); } } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderConversionLostTrend(trend) {
  const container = document.getElementById("lineChartContainer");
  if (!trend || !trend.conversion_trend || !trend.conversion_trend.length) {
    container.innerHTML = ""; return;
  }

  const lost = trend.lost_trend || [];
  const months = trend.conversion_trend.map(function (p) { return p.month; });
  const convData = trend.conversion_trend.map(function (p) { return p.rate || 0; });
  const lostData = trend.conversion_trend.map(function (p, i) { return lost[i] ? (lost[i].rate || 0) : 0; });

  AK.mountChart("lineChartContainer", {
    chart: { type: "line", height: 260, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [
      { name: "Conversion Rate", data: convData },
      { name: "Lost Rate", data: lostData }
    ],
    xaxis: { categories: months },
    yaxis: { labels: { formatter: function (v) { return v + "%"; } } },
    colors: [AK.chartColors.good, AK.chartColors.critical],
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 5, hover: { size: 7 } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: function (v) { return v + "%"; } } }
  });
}

function renderTopCustomersByPayment(list) {
  const el = document.getElementById("topCustomersPaymentList");
  if (!list || !list.length) {
    el.innerHTML = AK.emptyPanel("No payments have been recorded against any customer.", 140);
    return;
  }
  el.innerHTML = list.map(function (c, i) {
    return '<div class="list-item" style="animation-delay:' + (i * 55) + 'ms;"><span class="item-name">' + escapeHtml(c.customer_name) +
      '</span><span class="item-value">' + AK.money(c.total_payment) + '</span></div>';
  }).join("");
}

function renderTopProducts(list) {
  const el = document.getElementById("topProductsList");
  if (!list || !list.length) {
    el.innerHTML = AK.emptyPanel("No product quantities found in the order item subforms.", 140);
    return;
  }
  const items = list.slice(0, 5);
  while (items.length < 5) items.push({ product_name: "", total_quantity: 0 });
  el.innerHTML = items.map(function (p, i) {
    return '<div class="list-item" style="animation-delay:' + (i * 55) + 'ms;"><span class="item-name">' + escapeHtml(p.product_name) +
      '</span><span class="item-value">' + (p.product_name ? AK.dec(p.total_quantity) + ' units' : '') + '</span></div>';
  }).join("");
}

function renderAlerts(a) {
  const rows = [
    ["Revenue Target", a.revenue_status, a.revenue_msg],
    ["Payment Pending", a.payment_status, a.payment_msg],
    ["Overdue Payments", a.overdue_status, a.overdue_msg],
    ["Follow-up Delay", a.delay_status, a.delay_msg],
    ["Lost Orders", a.lost_status, a.lost_msg],
    ["Customer Satisfaction", a.sat_status, a.sat_msg]
  ];
  document.getElementById("alertsList").innerHTML = rows.map(function (r, i) {
    return '<div class="alert alert-' + escapeHtml(r[1]) + '" style="animation-delay:' + (i * 60) + 'ms;">' +
      '<strong>' + escapeHtml(r[0]) + ':</strong> ' + escapeHtml(r[2] || "") +
      '</div>';
  }).join("");
}

function renderOrdersVsPayments(db) {
  const totalOrders = db.orderConfirmation.length;
  const totalPayments = db.paymentTracking.length;
  const total = totalOrders + totalPayments;

  let ordPer = 0, payPer = 0;
  if (total > 0) {
    ordPer = Math.round(totalOrders / total * 100);
    payPer = Math.round(totalPayments / total * 100);
  }

  document.getElementById("ordersPie").innerHTML = '<div id="ordersPie-chart" style="width:100%;height:100%"></div>';
  AK.mountChart("ordersPie-chart", {
    chart: { type: "donut", height: 250, fontFamily: "Poppins, sans-serif" },
    series: [totalOrders, totalPayments],
    labels: ["Orders", "Payments"],
    colors: AK.categoricalColors(2),
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 2, colors: ["#fff"] },
    plotOptions: { pie: { donut: { size: "60%", labels: { show: false } } } },
    tooltip: { y: { formatter: function (v) { return AK.int(v); } } }
  });

  document.getElementById("opTotal").textContent = AK.int(total);
  AK.set("opOrdersLegend", "Orders: " + AK.pct(ordPer, 0) + " (" + AK.int(totalOrders) + ")", "db.orders");
  AK.set("opPaymentsLegend", "Payments: " + AK.pct(payPer, 0) + " (" + AK.int(totalPayments) + ")", "db.payments");
}

function renderFunnel(db) {
  const stages = [
    ["Leads", db.callingFollowUp.length],
    ["Quotations Sent", db.quotation.filter(function (q) { return q.Status === "Sent"; }).length],
    ["Follow-Ups Done", db.callingFollowUp.filter(function (c) { return c.Status === "Closed"; }).length],
    ["Orders Confirmed", db.orderConfirmation.length],
    ["Payments Received", db.paymentMade.length]
  ];

  document.getElementById("funnelLegend").innerHTML = stages.map(function (s) {
    return '<div class="funnel-legend-item"><div class="funnel-legend-text"><div class="funnel-legend-title">' +
      escapeHtml(s[0]) + '</div><div class="funnel-legend-value">Count: ' + s[1] + '</div></div></div>';
  }).join("");

  AK.mountFunnel("funnelStages", stages.map(function (s) { return { label: s[0], value: s[1] }; }));
}

function renderYoyGrowth(db) {
  // NOTE: sales.yearlyRevenueForOverallDashboard(year) was not supplied,
  // so yearly revenue is derived here from Order_Confirmation.Final_Amount.
  // Replace this helper once you send that function's logic.
  function revenueForYear(year) {
    let s = 0;
    db.orderConfirmation.forEach(function (o) {
      if (getYear(o.Date_field) === year) s += num(o.Final_Amount);
    });
    return round(s, 2);
  }

  const currYear = new Date().getFullYear();
  const yearData = [];
  for (let i = 0; i < 5; i++) {
    const y = currYear - i;
    yearData.push({ year: y, amount: revenueForYear(y) });
  }

  // ApexCharts auto-scales its own axis, so this no longer needs the fixed
  // ₹1,080,000 ceiling the original static page hardcoded (which clipped
  // any year that actually earned more than that).
  AK.mountChart("yoyBars", {
    chart: { type: "bar", height: 260, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "Revenue", data: yearData.map(function (d) { return d.amount; }) }],
    xaxis: { categories: yearData.map(function (d) { return String(d.year); }) },
    colors: [AK.chartColors.blue],
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "55%" } },
    dataLabels: { enabled: true, formatter: function (v) { return "₹" + AK.int(v); } },
    tooltip: { y: { formatter: function (v) { return AK.money(v); } } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderAbcChart(abc) {
  const cats = ["Category A", "Category B", "Category C"];
  const amounts = [abc.catA_amount, abc.catB_amount, abc.catC_amount];
  const counts = [abc.catA_count, abc.catB_count, abc.catC_count];
  const drillKeys = ["abc.catA", "abc.catB", "abc.catC"];

  AK.mountChart("abcChart", {
    chart: {
      type: "bar", height: 300, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: function (ev, ctx, opts) { AK.openDrill(drillKeys[opts.dataPointIndex]); } }
    },
    series: [{ name: "Revenue", data: amounts }],
    xaxis: { categories: cats.map(function (c, i) { return c + " (" + AK.int(counts[i]) + " customers)"; }) },
    colors: AK.categoricalColors(3),
    plotOptions: { bar: { borderRadius: 4, columnWidth: "45%", distributed: true } },
    legend: { show: false },
    dataLabels: { enabled: true, formatter: function (v) { return AK.money(v); } },
    tooltip: { y: { formatter: function (v) { return AK.money(v); } } },
    grid: { borderColor: "#e5e7eb" }
  });

  document.getElementById("abcDescription").innerHTML =
    "<strong>A:</strong> " + AK.money(abc.threshold_a) + " and above (" + AK.pct(abc.catA_pct) + " revenue) | " +
    "<strong>B:</strong> " + AK.money(abc.threshold_b_start) + " - " + AK.money(abc.threshold_b_end) + " (" + AK.pct(abc.catB_pct) + " revenue) | " +
    "<strong>C:</strong> Below " + AK.money(abc.threshold_c) + " (" + AK.pct(abc.catC_pct) + " revenue)";
}