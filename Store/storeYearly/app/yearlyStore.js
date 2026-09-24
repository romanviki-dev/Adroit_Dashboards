"use strict";

/* ================================================================
   YEARLY STORE DASHBOARD — WIDGET VERSION
   Ports ALL Deluge functions to run in JS on raw records:
     - getAnnualPerformanceSummary   (3-year trend table)
     - getCostSavingsBreakdown       (4 savings metrics + total)
     - getMaterialLeadTimeTrend      (18-month quarterly trend)
     - getMaterialTypeMovementRatio  (donut chart)
     - getSupplierOnboardingAndRating (4-year dual bar chart)
     - getTileSectionData            (8 KPI tiles)
     - getYearlyIndirectExpense      (monthly bar chart, current year)
     - getYearOverYearComparison     (prev vs current year cards)
   formatCurrency / formatTrendPercent / getStatusBadge / were Deluge
   helpers — ported below as plain JS helper functions.

   KNOWN ISSUES CARRIED OVER FROM THE ORIGINAL DELUGE CODE
   (ported as-is — flagged here, not silently changed):
   1. TWO DIFFERENT "scrap value" DEFINITIONS depending on function:
      - getAnnualPerformanceSummary sums Buyback_Cost from a separate
        "Scrap" report's Product_Details subform.
      - getCostSavingsBreakdown / getTileSectionData sum
        Defective_Product.Price off the Rejection & Replacement
        Register instead. These can produce different numbers for
        what both call "scrap value" — kept distinct here.
   2. getSecondSupplierSavings(fromDate, toDate) NEVER USES its date
      params in the original Deluge — it's a global, all-time figure
      every time. So in getAnnualPerformanceSummary, year 1/2/3 all
      get the identical second-supplier-savings number. Ported as-is
      (computed once, reused).
   3. getAnnualPerformanceSummary's YEAR 3 non-moving-stock filter has
      a missing-parenthesis bug: due to operator precedence it reads
      as (stock>0 AND stale) OR (no Last_Order_Date at all) — so any
      product with no Last_Order_Date counts as non-moving regardless
      of stock, for year 3 only. Ported exactly.
   4. The HTML hardcodes "Risk Mitigations Implemented" and "Total
      Indirect Expense" tiles to "N/A" even though the Deluge function
      computes real values for both. Values are computed here too but
      the tile display matches the HTML's "N/A".
   5. getSupplierOnboardingAndRating filters year 1 by
      Vendor_Status == "Approved" but NOT years 2–4 (all vendors
      added in range, any status). Ported exactly, per year.
   ================================================================ */

/* ----------------------------------------------------------------
   0. CONFIG — VERIFY these report/field names against your app
   ---------------------------------------------------------------- */
const CFG = {
  reports: {
    product: "All_Product",                              // confirmed
    reworkRegister: "All_Rework_Registers",                // confirmed
    supplierRating: "Supplier_Rating_Report",              // confirmed via fields.txt
    purchaseOrder: "All_Purchase_Orders",                  // confirmed via fields.txt
    vendors: "All_Vendors",                                // confirmed via fields.txt
    // RESOLVED — both real report names confirmed directly by the client (app builder URLs/labels),
    // replacing the earlier broken guesses ("All_Scrap" / "All_Service_Executive", both code 2894
    // "report not found"). Field names inside CFG.fields.scrap / .serviceExecutive below are still
    // unverified against real data — no fields.txt dump exists yet for either report.
    scrap: "All_Scraps",
    rejectionReplacement: "Rejection_Replacement_Register_Format", // confirmed
    materialRequisition: "All_Material_Requisitions1",     // confirmed
    serviceExecutive: "Service_Executive_Format"
  },
  fields: {
    product: {
      availableStock: "Available_Stock", price: "Price", lastOrderDate: "Last_Order_Date",
      isRedTag: "Is_Red_Tag_Material", productName: "Product_Name", productType: "Product_Type",
      productCode: "Product_Code"
    },
    reworkRegister: { date: "Date_field", totalExpense: "Total_Expence" },
    supplierRating: { date: "Date_field", totalRating: "Total_Rating", supplierName: "Supplier_Name" },
    // deliveredOn replaces the old Purchase_Order_Register-based lead-time/delay lookup — that
    // report errors with code 2930 ("Error Occurred") and doesn't exist. All_Purchase_Orders
    // already carries the same information directly on the PO record.
    purchaseOrder: { date: "PO_Date", deliveredOn: "Delivered_On", poNumber: "PO_Number" },
    vendors: { addedTime: "Added_Time", status: "Vendor_Status", productDetails: "Product_Details" },
    scrap: { date: "Date_field", productDetails: "Product_Details" },
    rejectionReplacement: { date: "Date_field", defectiveProduct: "Defective_Product" },
    materialRequisition: { date: "Date_field", status: "Status", itemDetails: "Item_Details" },
    serviceExecutive: { status: "Status", riskMatrix: "Risk_matrix", modifiedTime: "Modified_Time" }
  },
  maxRecords: 1000
};

CFG.customFields = {
  product: [CFG.fields.product.availableStock, CFG.fields.product.price, CFG.fields.product.lastOrderDate,
    CFG.fields.product.isRedTag, CFG.fields.product.productName, CFG.fields.product.productType,
    CFG.fields.product.productCode].join(","),
  reworkRegister: [CFG.fields.reworkRegister.date, CFG.fields.reworkRegister.totalExpense].join(","),
  supplierRating: [CFG.fields.supplierRating.date, CFG.fields.supplierRating.totalRating, CFG.fields.supplierRating.supplierName].join(","),
  purchaseOrder: [CFG.fields.purchaseOrder.date, CFG.fields.purchaseOrder.deliveredOn, CFG.fields.purchaseOrder.poNumber].join(","),
  vendors: [CFG.fields.vendors.addedTime, CFG.fields.vendors.status, CFG.fields.vendors.productDetails].join(","),
  scrap: [CFG.fields.scrap.date, CFG.fields.scrap.productDetails].join(","),
  rejectionReplacement: [CFG.fields.rejectionReplacement.date, CFG.fields.rejectionReplacement.defectiveProduct].join(","),
  materialRequisition: [CFG.fields.materialRequisition.date, CFG.fields.materialRequisition.status, CFG.fields.materialRequisition.itemDetails].join(","),
  serviceExecutive: [CFG.fields.serviceExecutive.status, CFG.fields.serviceExecutive.riskMatrix, CFG.fields.serviceExecutive.modifiedTime].join(",")
};

/* ----------------------------------------------------------------
   1. ZOHO CALL THROTTLE
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
    console.warn(`Yearly Store Dashboard: "${label}" fetch failed, treating as empty.`, err);
    return { data: [] };
  }
}

async function fetchAllPages(baseParams, label, maxPages = 10) {
  let all = []; let cursor = null; let page = 0;
  do {
    const params = cursor ? { ...baseParams, record_cursor: cursor } : { ...baseParams };
    const res = await safeGetRecords(params, `${label} (page ${page + 1})`);
    all = all.concat(res.data || []);
    cursor = res.record_cursor || null;
    page++;
  } while (cursor && page < maxPages);
  if (cursor && page >= maxPages) console.warn(`Yearly Store Dashboard: "${label}" hit the ${maxPages}-page safety cap.`);
  return all;
}

async function fetchSimple(reportName, customFieldsKey, label) {
  const res = await safeGetRecords({
    report_name: reportName, field_config: "custom", fields: CFG.customFields[customFieldsKey], max_records: CFG.maxRecords
  }, label);
  return res.data || [];
}

/* ----------------------------------------------------------------
   2. DATE HELPERS
   ---------------------------------------------------------------- */
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function stripTime(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }
function addMonths(d, n) { const c = new Date(d); c.setMonth(c.getMonth() + n); return c; }
function subMonths(d, n) { return addMonths(d, -n); }
function subDays(d, n) { const c = new Date(d); c.setDate(c.getDate() - n); return c; }
function daysBetween(d1, d2) { return Math.round((stripTime(d2) - stripTime(d1)) / DAY_MS); }
function yearStart(y) { return new Date(y, 0, 1); }
function yearEnd(y) { return new Date(y, 11, 31); }

function parseZohoDate(str) {
  if (!str) return null;
  const datePart = String(str).split(" ")[0];
  const parts = datePart.split("-");
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
// Adds thousands separators for display (10000 -> 10,000). Non-numbers pass through unchanged.
// Uses Indian grouping (1,00,000) to match the ₹ / Lakh formatting; switch "en-IN" to "en-US" for 100,000.
// Human-readable numbers (10000 -> "10,000"), Indian grouping, via the shared kit.
function fmtNum(v) { return typeof v === "number" && isFinite(v) ? AK.dec(v) : v; }
function lookupId(obj) { return obj && obj.ID ? obj.ID : null; }
function lookupName(obj, displayField) { if (!obj) return null; return (displayField && obj[displayField]) || obj.zc_display_value || null; }

/* ----------------------------------------------------------------
   2b. DRILL-DOWN PLUMBING
   Every count on screen can be clicked to see the records behind it.
   ---------------------------------------------------------------- */
const SRC = {};
const Y = CFG.fields;

const COLS = {
  product: [
    { label: "Code", value: Y.product.productCode },
    { label: "Product", value: Y.product.productName },
    { label: "Type", value: Y.product.productType },
    { label: "Available Stock", value: Y.product.availableStock, format: "dec" },
    { label: "Price", value: Y.product.price, format: "money" },
    {
      label: "Stock value", format: "money",
      value: (p) => num(p[Y.product.price]) * num(p[Y.product.availableStock])
    },
    { label: "Last Ordered", value: Y.product.lastOrderDate, format: "date" }
  ],
  vendor: [
    { label: "Vendor / Supplier", value: "Vendor_Supplier_Name" },
    { label: "Status", value: Y.vendors.status },
    { label: "Added", value: Y.vendors.addedTime, format: "date" },
    {
      label: "Products listed", format: "int",
      value: (v) => (v[Y.vendors.productDetails] || []).length
    }
  ],
  supplierRating: [
    { label: "Date", value: Y.supplierRating.date, format: "date" },
    { label: "Supplier", value: Y.supplierRating.supplierName },
    { label: "Total Rating", value: Y.supplierRating.totalRating, format: "dec" }
  ],
  rework: [
    { label: "Date", value: Y.reworkRegister.date, format: "date" },
    { label: "Total Expense", value: Y.reworkRegister.totalExpense, format: "money" }
  ],
  rejection: [
    { label: "Date", value: Y.rejectionReplacement.date, format: "date" },
    { label: "Defective Product", value: Y.rejectionReplacement.defectiveProduct }
  ],
  poRegister: [
    { label: "PO", value: Y.purchaseOrder.poNumber },
    { label: "Received", value: Y.purchaseOrder.deliveredOn, format: "date" }
  ]
};

function drill(key, title, report, columns, srcKey, subtitle, empty) {
  AK.defineDrill(key, {
    title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
    rows: () => SRC[srcKey] || []
  });
}

/* Row-returning twins of the aggregate helpers, so a drill-down shows exactly
   the records that produced the number on screen. */
// Mirrors nonMovingStockValue() exactly, including its year-3 precedence quirk.
function nonMovingRows(products, cutoffDate, asOfDate, includeNullAsNonMoving) {
  return products.filter((p) => {
    const stock = num(p[Y.product.availableStock]);
    const lastOrder = parseZohoDate(p[Y.product.lastOrderDate]);
    return includeNullAsNonMoving
      ? (stock > 0 && lastOrder && lastOrder < cutoffDate) || !lastOrder
      : stock > 0 && lastOrder && lastOrder < cutoffDate;
  });
}
function reworkRows(reworkRecords, start, end) {
  return reworkRecords.filter((r) => {
    const d = parseZohoDate(r[Y.reworkRegister.date]);
    return d && d >= start && d <= end;
  });
}
function supplierRatingRows(supplierRatings, start, end) {
  return supplierRatings.filter((r) => {
    const d = parseZohoDate(r[Y.supplierRating.date]);
    return d && d >= start && d <= end && num(r[Y.supplierRating.totalRating]) > 0;
  });
}
function newSupplierRows(vendors, start, end, approvedOnly) {
  return vendors.filter((v) => {
    const added = parseZohoDate(v[Y.vendors.addedTime]);
    if (!added || added < start || added > end) return false;
    return approvedOnly ? v[Y.vendors.status] === "Approved" : true;
  });
}
function rejectionRows(rejectionReplacement, start, end) {
  return rejectionReplacement.filter((r) => {
    const d = parseZohoDate(r[Y.rejectionReplacement.date]);
    return d && d >= start && d <= end && r[Y.rejectionReplacement.defectiveProduct];
  });
}
function poRegisterRows(purchaseOrders, start, end) {
  return purchaseOrders.filter((po) => {
    const d = parseZohoDate(po[Y.purchaseOrder.deliveredOn]);
    return d && d >= start && d <= end;
  });
}

// Deluge's formatCurrency
function formatCurrency(value) {
  if (value >= 100000) return `₹${fmtNum(Math.round((value / 100000) * 10) / 10)}L`;
  if (value >= 1000) return `₹${fmtNum(Math.round((value / 1000) * 10) / 10)}K`;
  if (value > 0) return `₹${fmtNum(Math.round(value))}`;
  return "₹0";
}
// Same as formatCurrency but without the ₹ (used by getCostSavingsBreakdown)
function formatValueNoSymbol(value) {
  if (value >= 100000) return `${fmtNum(Math.round((value / 100000) * 10) / 10)}L`;
  if (value >= 1000) return `${fmtNum(Math.round((value / 1000) * 10) / 10)}K`;
  if (value > 0) return `${fmtNum(Math.round(value))}`;
  return "0";
}
// Deluge's formatTrendPercent
function formatTrendPercent(change, isLowerBetter) {
  if (change > 0) return isLowerBetter ? `↓ ${change}%` : `↑ ${change}%`;
  if (change < 0) return isLowerBetter ? `↑ ${-change}%` : `↓ ${-change}%`;
  return "0%";
}
// Deluge's getStatusBadge
function getStatusBadge(change, isLowerBetter) {
  const absChange = Math.abs(change);
  const isPositive = change > 0; // same branch either way in the original, for both isLowerBetter true/false
  if (isPositive) {
    if (absChange >= 20) return "excellent";
    if (absChange >= 10) return "good";
    return "average";
  }
  return absChange >= 10 ? "poor" : "average";
}

/* ----------------------------------------------------------------
   3. FETCH — done once per load
   ---------------------------------------------------------------- */
async function fetchAllDashboardData() {
  const today = new Date();

  const [
    products, reworkRecords, supplierRatings, purchaseOrders,
    vendors, scrapRecords, rejectionReplacement, materialRequisitions, serviceExecutives
  ] = await Promise.all([
    fetchAllPages({ report_name: CFG.reports.product, field_config: "custom", fields: CFG.customFields.product,
      max_records: CFG.maxRecords, criteria: `${CFG.fields.product.availableStock} > 0` }, "Product"),
    fetchSimple(CFG.reports.reworkRegister, "reworkRegister", "Rework Register"),
    fetchSimple(CFG.reports.supplierRating, "supplierRating", "Supplier Rating"),
    fetchSimple(CFG.reports.purchaseOrder, "purchaseOrder", "Purchase Order"),
    fetchAllPages({ report_name: CFG.reports.vendors, field_config: "custom", fields: CFG.customFields.vendors,
      max_records: CFG.maxRecords }, "Vendors"),
    fetchSimple(CFG.reports.scrap, "scrap", "Scrap"),
    fetchSimple(CFG.reports.rejectionReplacement, "rejectionReplacement", "Rejection & Replacement Register"),
    fetchAllPages({ report_name: CFG.reports.materialRequisition, field_config: "custom", fields: CFG.customFields.materialRequisition,
      max_records: CFG.maxRecords, criteria: `${CFG.fields.materialRequisition.status} == "Approved"` }, "Material Requisition"),
    fetchSimple(CFG.reports.serviceExecutive, "serviceExecutive", "Service Executive")
  ]);

  const purchaseOrdersById = {};
  purchaseOrders.forEach((po) => { if (po.ID) purchaseOrdersById[po.ID] = po; });

  const productsById = {};
  const productsByCode = {};
  products.forEach((p) => {
    if (p.ID) productsById[p.ID] = p;
    const code = p[CFG.fields.product.productCode];
    if (code) productsByCode[code] = p;
  });

  return {
    today, products, reworkRecords, supplierRatings, purchaseOrders,
    vendors, scrapRecords, rejectionReplacement, materialRequisitions, serviceExecutives,
    purchaseOrdersById, productsById, productsByCode
  };
}

/* ----------------------------------------------------------------
   4. SHARED CALCULATIONS (reused across multiple ported functions)
   ---------------------------------------------------------------- */

// Non-moving stock value as of a given "as-of" date, with an optional cutoff
// override. includeNullAsNonMoving replicates the year-3 operator-precedence
// bug in getAnnualPerformanceSummary — see note #3 at the top of this file.
function nonMovingStockValue(products, cutoffDate, asOfDate, includeNullAsNonMoving) {
  let value = 0;
  products.forEach((p) => {
    const stock = num(p[CFG.fields.product.availableStock]);
    const lastOrder = parseZohoDate(p[CFG.fields.product.lastOrderDate]);
    const isNonMoving = includeNullAsNonMoving
      ? (stock > 0 && lastOrder && lastOrder < cutoffDate) || !lastOrder
      : stock > 0 && lastOrder && lastOrder < cutoffDate;
    if (isNonMoving) value += num(p[CFG.fields.product.price]) * stock;
  });
  return value;
}

function reworkSum(reworkRecords, start, end) {
  return reworkRecords.reduce((sum, r) => {
    const d = parseZohoDate(r[CFG.fields.reworkRegister.date]);
    return d && d >= start && d <= end ? sum + num(r[CFG.fields.reworkRegister.totalExpense]) : sum;
  }, 0);
}

function avgSupplierRating(supplierRatings, start, end) {
  let total = 0, count = 0;
  supplierRatings.forEach((r) => {
    const d = parseZohoDate(r[CFG.fields.supplierRating.date]);
    const rating = num(r[CFG.fields.supplierRating.totalRating]);
    if (d && d >= start && d <= end && rating > 0) { total += rating; count++; }
  });
  return count > 0 ? total / count : 0;
}

function avgLeadTime(purchaseOrders, start, end) {
  let totalDays = 0, count = 0;
  purchaseOrders.forEach((po) => {
    const received = parseZohoDate(po[CFG.fields.purchaseOrder.deliveredOn]);
    if (!received || received < start || received > end) return;
    const poDate = parseZohoDate(po[CFG.fields.purchaseOrder.date]);
    if (!poDate) return;
    const leadDays = daysBetween(poDate, received);
    if (leadDays >= 0) { totalDays += leadDays; count++; }
  });
  return count > 0 ? totalDays / count : 0;
}

// Scrap value per getAnnualPerformanceSummary: Scrap report's Product_Details.Buyback_Cost
function scrapValueFromScrapReport(scrapRecords, start, end) {
  let total = 0;
  scrapRecords.forEach((rec) => {
    const d = parseZohoDate(rec[CFG.fields.scrap.date]);
    if (!d || d < start || d > end) return;
    (rec[CFG.fields.scrap.productDetails] || []).forEach((item) => { total += num(item.Buyback_Cost); });
  });
  return total;
}

// Scrap/"scrap value realized" per getCostSavingsBreakdown / getTileSectionData:
// Rejection & Replacement Register's Defective_Product.Price, joined via productsById
// since the lookup fetch may not carry Price directly.
function scrapValueFromRejectionRegister(rejectionReplacement, productsById, start, end) {
  let total = 0;
  rejectionReplacement.forEach((rec) => {
    const d = parseZohoDate(rec[CFG.fields.rejectionReplacement.date]);
    if (!d || d < start || d > end) return;
    const defective = rec[CFG.fields.rejectionReplacement.defectiveProduct];
    const defId = lookupId(defective);
    const product = defId && productsById[defId];
    if (product) total += num(product[CFG.fields.product.price]);
    else if (defective) total += num(defective.Price); // in case Price does come through on the lookup
  });
  return total;
}

function newSupplierCount(vendors, start, end, approvedOnly) {
  return vendors.filter((v) => {
    const added = parseZohoDate(v[CFG.fields.vendors.addedTime]);
    if (!added || added < start || added > end) return false;
    return approvedOnly ? v[CFG.fields.vendors.status] === "Approved" : true;
  }).length;
}

// getSecondSupplierSavings — global, ignores date range (see note #2 at top).
// Computed once and reused everywhere it's needed.
function computeSecondSupplierSavingsGlobal(vendors) {
  const priceMap = {};
  vendors.forEach((v) => {
    (v[CFG.fields.vendors.productDetails] || []).forEach((pd) => {
      const name = lookupName(pd.Product_Name, null) || pd.Product_Name;
      const make = lookupName(pd.Make, null) || pd.Make;
      const price = num(pd.Original_Price);
      if (name && make && price > 0) {
        const key = `${name}|${make}`;
        if (!priceMap[key]) priceMap[key] = [];
        priceMap[key].push(price);
      }
    });
  });

  let savedCost = 0, totalCost = 0;
  Object.values(priceMap).forEach((prices) => {
    if (prices.length > 1) {
      const minP = Math.min(...prices), maxP = Math.max(...prices);
      if (maxP > 0 && minP < maxP) { savedCost += maxP - minP; totalCost += maxP; }
    }
  });
  return { savedCost, totalCost };
}

/* ----------------------------------------------------------------
   5. THE 8 PORTED FUNCTIONS
   ---------------------------------------------------------------- */

// --- 5a. getAnnualPerformanceSummary ---
function computeAnnualPerformanceSummary(raw) {
  const { today, products, reworkRecords, supplierRatings, purchaseOrders,
    scrapRecords, vendors } = raw;
  const currentYear = today.getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];
  const { savedCost: globalSecondSupplierSavings } = computeSecondSupplierSavingsGlobal(vendors);

  const yearData = years.map((y, idx) => {
    const isCurrentYear = idx === 2;
    const start = yearStart(y);
    const end = isCurrentYear ? today : yearEnd(y);
    const sixMonthsBeforeEnd = subMonths(end, 6);

    // Year 3 (current) replicates the missing-parenthesis bug — see note #3.
    const nonMoving = nonMovingStockValue(products, sixMonthsBeforeEnd, end, isCurrentYear);
    const indirect = reworkSum(reworkRecords, start, end);
    const avgRating = Math.round(avgSupplierRating(supplierRatings, start, end));
    const leadTime = Math.round(avgLeadTime(purchaseOrders, start, end));
    const scrap = scrapValueFromScrapReport(scrapRecords, start, end);
    const newSuppliers = newSupplierCount(vendors, start, end, false);
    const costSavings = globalSecondSupplierSavings + scrap;

    return { year: y, nonMoving, indirect, avgRating, leadTime, scrap, newSuppliers, costSavings };
  });

  const [y1, , y3] = yearData;
  const trend = (from, to, isLowerBetter) => {
    if (from <= 0) return { trend: "N/A", status: "average" };
    const change = Math.round(((from - to) * 100 / from) * 10) / 10;
    // Rating/suppliers/savings trends are computed as (to - from) in the
    // original (higher-is-better), non-moving/indirect/lead-time as (from-to).
    return { change };
  };

  const nonMovingChange = y1.nonMoving > 0 ? Math.round(((y1.nonMoving - y3.nonMoving) * 100 / y1.nonMoving) * 10) / 10 : null;
  const indirectChange = y1.indirect > 0 ? Math.round(((y1.indirect - y3.indirect) * 100 / y1.indirect) * 10) / 10 : null;
  const ratingChange = y1.avgRating > 0 ? Math.round(((y3.avgRating - y1.avgRating) * 100 / y1.avgRating) * 10) / 10 : null;
  const leadChange = y1.leadTime > 0 ? Math.round(((y1.leadTime - y3.leadTime) * 100 / y1.leadTime) * 10) / 10 : null;
  const scrapChange = y1.scrap > 0 ? Math.round(((y3.scrap - y1.scrap) * 100 / y1.scrap) * 10) / 10 : null;
  const suppliersChange = y1.newSuppliers > 0 ? Math.round((y3.newSuppliers - y1.newSuppliers) * 100 / y1.newSuppliers) : null;
  const savingsChange = y1.costSavings > 0 ? Math.round(((y3.costSavings - y1.costSavings) * 100 / y1.costSavings) * 10) / 10 : null;

  const trendRow = (change, isLowerBetter) => change === null
    ? { trend: "N/A", status: "average" }
    : { trend: formatTrendPercent(change, isLowerBetter), status: getStatusBadge(change, isLowerBetter) };

  return {
    years: yearData,
    trends: {
      nonMoving: trendRow(nonMovingChange, true),
      indirect: trendRow(indirectChange, true),
      rating: trendRow(ratingChange, false),
      leadTime: trendRow(leadChange, true),
      scrap: trendRow(scrapChange, false),
      suppliers: trendRow(suppliersChange, false),
      savings: trendRow(savingsChange, false)
    }
  };
}

// --- 5b. getCostSavingsBreakdown ---
function computeCostSavingsBreakdown(raw) {
  const { today, vendors, rejectionReplacement, productsById, reworkRecords, products } = raw;
  const currentYear = today.getFullYear();
  const yStart = yearStart(currentYear);
  const prevYear = currentYear - 1;
  const prevStart = yearStart(prevYear), prevEnd = yearEnd(prevYear);

  const { savedCost, totalCost } = computeSecondSupplierSavingsGlobal(vendors);
  const secondSupplierPercent = totalCost > 0 ? Math.round((savedCost * 100 / totalCost) * 10) / 10 : 0;

  const scrapCurrent = scrapValueFromRejectionRegister(rejectionReplacement, productsById, yStart, today);
  const scrapPrev = scrapValueFromRejectionRegister(rejectionReplacement, productsById, prevStart, prevEnd);
  const daysIntoYear = daysBetween(yStart, today);

  let scrapValueChange;
  if (scrapPrev > 0 && scrapCurrent > 0) {
    const pct = Math.round((scrapCurrent - scrapPrev) * 100 / scrapPrev);
    scrapValueChange = pct > 0 ? `+${pct}` : pct < 0 ? `${pct}` : "0";
  } else if (scrapCurrent > 0 && scrapPrev === 0) {
    scrapValueChange = "+100";
  } else if (scrapCurrent === 0 && scrapPrev > 0) {
    scrapValueChange = daysIntoYear < 90 ? "Pending" : "-100";
  } else {
    scrapValueChange = "No data";
  }

  const sixMonthsAgo = subMonths(today, 6);
  const currentNonMoving = nonMovingStockValue(products, sixMonthsAgo, today, false);
  const prevYearSixMonths = subMonths(prevEnd, 6);
  const prevNonMoving = nonMovingStockValue(products, prevYearSixMonths, prevEnd, false);

  let nonMovingReductionAmount = 0, nonMovingPercent = 0;
  if (prevNonMoving > currentNonMoving && prevNonMoving > 0) {
    nonMovingReductionAmount = prevNonMoving - currentNonMoving;
    nonMovingPercent = Math.round((nonMovingReductionAmount * 100 / prevNonMoving) * 10) / 10;
  }

  const indirectCurrent = reworkSum(reworkRecords, yStart, today);
  const indirectPrev = reworkSum(reworkRecords, prevStart, prevEnd);
  let indirectReductionAmount = 0, indirectPercent = 0;
  if (indirectPrev > indirectCurrent && indirectPrev > 0) {
    indirectReductionAmount = indirectPrev - indirectCurrent;
    indirectPercent = Math.round(indirectReductionAmount * 100 / indirectPrev);
  }

  const totalSavings = savedCost + scrapCurrent + nonMovingReductionAmount + indirectReductionAmount;

  return {
    second_supplier_savings: formatValueNoSymbol(savedCost),
    second_supplier_percent: secondSupplierPercent,
    scrap_value_realized: formatValueNoSymbol(scrapCurrent),
    scrap_value_change: scrapValueChange,
    non_moving_stock_reduction: formatValueNoSymbol(nonMovingReductionAmount),
    non_moving_stock_percent: nonMovingPercent,
    indirect_expense_reduction: formatValueNoSymbol(indirectReductionAmount),
    indirect_expense_percent: indirectPercent,
    total_annual_savings: formatValueNoSymbol(totalSavings)
  };
}

// --- 5c. getMaterialLeadTimeTrend ---
function computeMaterialLeadTimeTrend(raw) {
  const { today, purchaseOrders } = raw;
  const startDate = subMonths(today, 18);
  const quarterMap = {};

  purchaseOrders.forEach((po) => {
    const received = parseZohoDate(po[CFG.fields.purchaseOrder.deliveredOn]);
    if (!received || received < startDate) return;
    const poDate = parseZohoDate(po[CFG.fields.purchaseOrder.date]);
    if (!poDate) return;

    const leadDays = daysBetween(poDate, received);
    if (leadDays < 0) return;

    const year = received.getFullYear();
    const month = received.getMonth() + 1; // Deluge getMonth() is 1-indexed
    let quarter = "Q4";
    if (month <= 3) quarter = "Q1"; else if (month <= 6) quarter = "Q2"; else if (month <= 9) quarter = "Q3";
    const qKey = `${quarter}'${String(year).slice(-2)}`;

    if (!quarterMap[qKey]) quarterMap[qKey] = { total: 0, count: 0 };
    quarterMap[qKey].total += leadDays;
    quarterMap[qKey].count += 1;
  });

  const qKeys = Object.keys(quarterMap).sort();
  let maxLeadTime = 0;
  const labels = [], values = [];
  qKeys.forEach((q) => {
    const avg = Math.round(quarterMap[q].total / quarterMap[q].count);
    labels.push(q); values.push(avg);
    if (avg > maxLeadTime) maxLeadTime = avg;
  });
  const heights = values.map((v) => maxLeadTime > 0 ? Math.round((v * 100) / maxLeadTime) : 0);

  return { labels, values, heights, max: maxLeadTime };
}

// --- 5d. getMaterialTypeMovementRatio ---
function computeMaterialTypeMovementRatio(raw) {
  const { today, materialRequisitions, productsByCode } = raw;
  const startDate = new Date(today.getFullYear(), 0, 1);

  let rawMaterialTotal = 0, tradingTotal = 0, redTagTotal = 0;

  materialRequisitions.forEach((req) => {
    const d = parseZohoDate(req[CFG.fields.materialRequisition.date]);
    if (!d || d < startDate || d > today) return;
    if (req[CFG.fields.materialRequisition.status] !== "Approved") return;

    (req[CFG.fields.materialRequisition.itemDetails] || []).forEach((item) => {
      const lineTotal = num(item.Line_Total);
      if (lineTotal <= 0) return;

      const productRef = item.Product_Code;
      if (!productRef) { rawMaterialTotal += lineTotal; return; }

      const code = productRef.Product_Code || lookupName(productRef, null);
      const product = code ? productsByCode[code] : null;
      if (!product) { rawMaterialTotal += lineTotal; return; }

      const isRedTag = product[CFG.fields.product.isRedTag] === true || product[CFG.fields.product.isRedTag] === "true";
      if (isRedTag) { redTagTotal += lineTotal; return; }

      const name = (product[CFG.fields.product.productName] || "").toLowerCase();
      const type = (product[CFG.fields.product.productType] || "").toLowerCase();

      if (name) {
        if (["raw materials", "manufacturing units", "finished goods"].includes(name)) rawMaterialTotal += lineTotal;
        else if (["service", "tools", "stand by"].includes(name)) tradingTotal += lineTotal;
        else rawMaterialTotal += lineTotal;
      } else if (type) {
        if (type.includes("raw") || type.includes("material") || type.includes("manufacturing")) rawMaterialTotal += lineTotal;
        else if (type.includes("trading") || type.includes("service") || type.includes("tool")) tradingTotal += lineTotal;
        else rawMaterialTotal += lineTotal;
      } else {
        rawMaterialTotal += lineTotal;
      }
    });
  });

  const grandTotal = rawMaterialTotal + tradingTotal + redTagTotal;
  if (grandTotal <= 0) {
    return { unit: "₹", raw_material_value: 0, raw_material_percent: 0, trading_value: 0, trading_percent: 0,
      red_tag_value: 0, red_tag_percent: 0, total: 0, raw_degrees: 0, trading_start: 0, trading_degrees: 0, red_tag_start: 0 };
  }

  const rawPercent = Math.round(rawMaterialTotal * 100 / grandTotal);
  const tradingPercent = Math.round(tradingTotal * 100 / grandTotal);
  const redTagPercent = Math.round(redTagTotal * 100 / grandTotal);

  let unit = "₹", divider = 1;
  if (grandTotal >= 100000) { unit = "L"; divider = 100000; }
  else if (grandTotal >= 1000) { unit = "K"; divider = 1000; }

  const rawDegrees = Math.round(rawPercent * 360 / 100);
  const tradingStart = rawDegrees;
  const tradingDegrees = tradingStart + Math.round(tradingPercent * 360 / 100);
  const redTagStart = tradingDegrees;

  return {
    unit,
    raw_material_value: Math.round((rawMaterialTotal / divider) * 10) / 10, raw_material_percent: rawPercent,
    trading_value: Math.round((tradingTotal / divider) * 10) / 10, trading_percent: tradingPercent,
    red_tag_value: Math.round((redTagTotal / divider) * 10) / 10, red_tag_percent: redTagPercent,
    total: Math.round((grandTotal / divider) * 10) / 10,
    raw_degrees: rawDegrees, trading_start: tradingStart, trading_degrees: tradingDegrees, red_tag_start: redTagStart
  };
}

// --- 5e. getSupplierOnboardingAndRating ---
function computeSupplierOnboardingAndRating(raw) {
  const { today, vendors, supplierRatings } = raw;
  const currentYear = today.getFullYear();
  // Filter inconsistency ported exactly — see note #5 at top: only year 1 is Approved-only.
  const yearConfigs = [
    { y: currentYear - 3, approvedOnly: true },
    { y: currentYear - 2, approvedOnly: false },
    { y: currentYear - 1, approvedOnly: false },
    { y: currentYear, approvedOnly: false }
  ];

  const counts = [], ratings = [];
  let maxCount = 0;
  yearConfigs.forEach(({ y, approvedOnly }) => {
    const start = yearStart(y), end = yearEnd(y);
    const count = newSupplierCount(vendors, start, end, approvedOnly);
    counts.push(count);
    if (count > maxCount) maxCount = count;
    ratings.push(Math.round(avgSupplierRating(supplierRatings, start, end)));
  });

  const countHeights = counts.map((c) => maxCount > 0 ? Math.round(c * 100 / maxCount) : 0);
  const ratingHeights = ratings.map((r) => Math.round(r * 100 / 100));

  return {
    years: yearConfigs.map((c) => c.y),
    supplier_counts: counts, supplier_ratings: ratings,
    supplier_count_heights: countHeights, supplier_rating_heights: ratingHeights, max_count: maxCount
  };
}

// --- 5f. getTileSectionData ---
function computeTileSectionData(raw) {
  const { today, products, vendors, rejectionReplacement, productsById, reworkRecords,
    purchaseOrders, serviceExecutives, supplierRatings } = raw;
  const currentYear = today.getFullYear();
  const yStart = yearStart(currentYear);
  const prevYear = currentYear - 1;
  const prevStart = yearStart(prevYear), prevEnd = yearEnd(prevYear);

  const sixMonthsAgo = subMonths(today, 6);
  const currentNonMoving = nonMovingStockValue(products, sixMonthsAgo, today, false);
  const prevYearSixMonths = subMonths(prevEnd, 6);
  const prevNonMoving = nonMovingStockValue(products, prevYearSixMonths, prevEnd, false);
  const redNonMovingStocks = prevNonMoving > 0 ? Math.round(((prevNonMoving - currentNonMoving) * 100 / prevNonMoving) * 10) / 10 : 0;

  const { savedCost, totalCost } = computeSecondSupplierSavingsGlobal(vendors);
  const costSavedSecSupplier = totalCost > 0 ? Math.round((savedCost * 100 / totalCost) * 10) / 10 : 0;

  const currentAvgRating = avgSupplierRating(supplierRatings, yStart, today);
  const prevAvgRating = avgSupplierRating(supplierRatings, prevStart, prevEnd);
  const imprSupplierRating = (prevAvgRating > 0 && currentAvgRating > 0)
    ? Math.round(((currentAvgRating - prevAvgRating) * 100 / prevAvgRating) * 10) / 10 : 0;

  // Computed but displayed as "N/A" in the HTML — see note #4 at top.
  const riskMgmtImp = serviceExecutives.filter((s) => {
    const mt = parseZohoDate(s[CFG.fields.serviceExecutive.modifiedTime]);
    return s[CFG.fields.serviceExecutive.status] === "Completed" && s[CFG.fields.serviceExecutive.riskMatrix] &&
      mt && mt >= yStart && mt <= today;
  }).length;
  const totalIndirectExp = reworkSum(reworkRecords, yStart, today);

  const scrapValRlz = scrapValueFromRejectionRegister(rejectionReplacement, productsById, yStart, today);
  const avgMatLeadTime = Math.round(avgLeadTime(purchaseOrders, yStart, today));
  const newSuppOnboarded = newSupplierCount(vendors, yStart, today, true);

  return {
    red_non_moving_stocks: redNonMovingStocks,
    cost_saved_sec_supplier: costSavedSecSupplier,
    impr_in_supplier_rating: imprSupplierRating,
    risk_mgmt_imp: riskMgmtImp,
    total_indirect_exp: totalIndirectExp,
    scrap_val_rlz: scrapValRlz,
    avg_mat_lead_time: avgMatLeadTime,
    new_supp_onboarded: newSuppOnboarded,
    src: {
      nonMoving: nonMovingRows(products, sixMonthsAgo, today, false),
      vendorsAll: vendors,
      ratings: supplierRatingRows(supplierRatings, yStart, today),
      rework: reworkRows(reworkRecords, yStart, today),
      scrap: rejectionRows(rejectionReplacement, yStart, today),
      leadTime: poRegisterRows(purchaseOrders, yStart, today),
      newSuppliers: newSupplierRows(vendors, yStart, today, true)
    }
  };
}

// --- 5g. getYearlyIndirectExpense ---
function computeYearlyIndirectExpense(raw) {
  const { today, reworkRecords } = raw;
  const currYear = today.getFullYear();
  const currMonth = today.getMonth() + 1;
  let maxExpense = 30.0;

  const monthsRaw = [];
  for (let m = 1; m <= currMonth; m++) {
    const monthStart = new Date(currYear, m - 1, 1);
    const monthEnd = m === 12 ? new Date(currYear, 11, 31) : subDays(new Date(currYear, m, 1), 1);
    const rework = reworkSum(reworkRecords, monthStart, monthEnd);
    monthsRaw.push({
      month: MONTH_NAMES[m - 1],
      rework: Math.round((rework / 100000) * 10) / 10,
      _records: reworkRows(reworkRecords, monthStart, monthEnd),
      _total: rework
    });
  }

  const maxRework = Math.max(...monthsRaw.map((r) => r.rework), 0);
  if (maxRework > maxExpense) maxExpense = maxRework;

  const monthsData = monthsRaw.map((r) => ({
    month: r.month, fabrication: 0, rework: r.rework, transit: 0, total: r.rework,
    fab_height: 0, rew_height: Math.round((r.rework / maxExpense) * 100 * 10) / 10, tra_height: 0,
    _records: r._records, _total: r._total
  }));

  return { months: monthsData, max_expense: maxExpense };
}

// --- 5h. getYearOverYearComparison ---
function computeYearOverYearComparison(raw) {
  const { today, products, reworkRecords, supplierRatings, purchaseOrders } = raw;
  const currentYear = today.getFullYear();
  const yStart = yearStart(currentYear);
  const prevYear = currentYear - 1;
  const prevStart = yearStart(prevYear), prevEnd = yearEnd(prevYear);

  const prevYearSixMonths = subMonths(prevEnd, 6);
  const prevNonMovingValue = nonMovingStockValue(products, prevYearSixMonths, prevEnd, false);
  const sixMonthsAgo = subMonths(today, 6);
  const currentNonMovingValue = nonMovingStockValue(products, sixMonthsAgo, today, false);

  let nonMovingChangeText = "";
  if (prevNonMovingValue > 0) {
    const change = Math.round(((prevNonMovingValue - currentNonMovingValue) * 100 / prevNonMovingValue) * 10) / 10;
    nonMovingChangeText = change > 0 ? `↓ ${change}%` : change < 0 ? `↑ ${-change}%` : "0%";
  }

  const prevIndirectExpense = reworkSum(reworkRecords, prevStart, prevEnd);
  const currentIndirectExpense = reworkSum(reworkRecords, yStart, today);
  let indirectChangeText = "";
  if (prevIndirectExpense > 0) {
    const change = Math.round((prevIndirectExpense - currentIndirectExpense) * 100 / prevIndirectExpense);
    indirectChangeText = change > 0 ? `↓ ${change}%` : change < 0 ? `↑ ${-change}%` : "0%";
  }

  const prevAvgRating = Math.round(avgSupplierRating(supplierRatings, prevStart, prevEnd));
  const currentAvgRating = Math.round(avgSupplierRating(supplierRatings, yStart, today));
  let ratingChangeText = "";
  if (prevAvgRating > 0) {
    const change = Math.round((currentAvgRating - prevAvgRating) * 100 / prevAvgRating);
    ratingChangeText = change > 0 ? `↑ ${change}%` : change < 0 ? `↓ ${-change}%` : "0%";
  }

  const prevAvgLeadTime = Math.round(avgLeadTime(purchaseOrders, prevStart, prevEnd));
  const currentAvgLeadTime = Math.round(avgLeadTime(purchaseOrders, yStart, today));
  let leadTimeChangeText = "";
  if (prevAvgLeadTime > 0) {
    const change = Math.round((prevAvgLeadTime - currentAvgLeadTime) * 100 / prevAvgLeadTime);
    leadTimeChangeText = change > 0 ? `↓ ${change}%` : change < 0 ? `↑ ${-change}%` : "0%";
  }

  return {
    prev_year: prevYear, prev_non_moving_stock: formatCurrency(prevNonMovingValue), prev_indirect_exp: formatCurrency(prevIndirectExpense),
    prev_supplier_rating: `${prevAvgRating}%`, prev_lead_time: `${prevAvgLeadTime} Days`,
    curr_year: currentYear, curr_non_moving_stock: formatCurrency(currentNonMovingValue), curr_indirect_exp: formatCurrency(currentIndirectExpense),
    curr_supplier_rating: `${currentAvgRating}%`, curr_lead_time: `${currentAvgLeadTime} Days`,
    non_moving_change: nonMovingChangeText, indirect_change: indirectChangeText,
    rating_change: ratingChangeText, lead_time_change: leadTimeChangeText
  };
}

/* ----------------------------------------------------------------
   6. RENDER
   ---------------------------------------------------------------- */
function renderKpiTiles(t) {
  const R = CFG.reports;
  Object.keys(t.src).forEach((k) => { SRC[k] = t.src[k]; });

  drill("y.nonMoving", "Non-Moving Stock", R.product, COLS.product, "nonMoving",
    "Products with stock on hand whose Last Order Date is more than six months ago; the tile compares this year's value with last year's",
    "Nothing is sitting unsold beyond six months.");
  drill("y.vendors", "All Vendors", R.vendors, COLS.vendor, "vendorsAll",
    "Every vendor; the tile compares the cheapest and dearest price for each Product Code + Make combination that more than one vendor supplies");
  drill("y.ratings", "Supplier Ratings This Year", R.supplierRating, COLS.supplierRating, "ratings",
    "Supplier Rating records dated this year with a rating above 0",
    "No supplier has been rated this year.");
  drill("y.rework", "Rework This Year", R.reworkRegister, COLS.rework, "rework",
    "Rework Register records dated this year",
    "No rework has been logged this year.");
  drill("y.scrap", "Scrap / Rejections", R.rejectionReplacement, COLS.rejection, "scrap",
    "Rejection & Replacement entries this year with a Defective Product (valued at the product's Price)",
    "Nothing has been scrapped this year.");
  drill("y.leadTime", "Purchase Orders Received", R.purchaseOrder, COLS.poRegister, "leadTime",
    "Purchase Orders received (Delivered_On) this year; the lead time is the days from PO date to Delivered_On");
  drill("y.newSuppliers", "New Suppliers Onboarded", R.vendors, COLS.vendor, "newSuppliers",
    "Vendors added this year with Vendor_Status = Approved",
    "No new supplier was approved this year.");

  const cards = [
    { icon: "fa-boxes", cls: "blue", title: "% Reduction in Non-Moving Stock", value: AK.pct(t.red_non_moving_stocks), target: "(Prev Yr − Current) / Prev Yr", drill: "y.nonMoving" },
    { icon: "fa-piggy-bank", cls: "green", title: "% Cost Saved via Second Suppliers", value: AK.pct(t.cost_saved_sec_supplier), target: "Saved Cost / Total Cost", drill: "y.vendors" },
    { icon: "fa-star", cls: "teal", title: "% Improvement in Supplier Ratings", value: AK.pct(t.impr_in_supplier_rating), target: "YOY Avg Rating", drill: "y.ratings" },
    { icon: "fa-shield-alt", cls: "purple", title: "Risk Mitigations Implemented", value: "N/A", target: "Completed Initiatives" },
    { icon: "fa-rupee-sign", cls: "orange", title: "Total Indirect Expense", value: "N/A", target: "Fab + Rework + Transit", drill: "y.rework" },
    { icon: "fa-recycle", cls: "green", title: "Scrap Value Realized", value: formatCurrency(t.scrap_val_rlz), target: "Buy-back & Rejections", drill: "y.scrap" },
    { icon: "fa-clock", cls: "blue", title: "Avg Material Lead Time", value: `${fmtNum(t.avg_mat_lead_time)} Days`, target: "PO → Receipt", drill: "y.leadTime" },
    { icon: "fa-user-plus", cls: "purple", title: "New Suppliers Onboarded", value: fmtNum(t.new_supp_onboarded), target: "Approved Vendors", drill: "y.newSuppliers" }
  ];
  return cards.map((c) => `
    <div class="kpi-card ${c.cls}">
      <div class="kpi-header"><div class="kpi-icon"><i class="fas ${c.icon}"></i></div><div class="kpi-frequency">YEARLY</div></div>
      <div class="kpi-title">${c.title}</div>
      <div class="kpi-value"${c.drill ? ` data-drill="${c.drill}"` : ""}>${c.value}</div>
      <div class="kpi-target">${c.target}</div>
    </div>`).join("");
}

function renderYearlyIndirectExpense(data) {
  const el = document.getElementById("yearlyIndirectExpense");
  if (!el) return;

  data.months.forEach((m, i) => {
    SRC["yre." + i] = m._records || [];
    drill("yre." + i, "Rework — " + m.month, CFG.reports.reworkRegister, COLS.rework, "yre." + i,
      m.month + ": " + AK.money(m._total || 0) + " of rework expense",
      "No rework was logged in " + m.month + ".");
  });

  el.innerHTML = '<div id="yearlyIndirectExpense-chart"></div>';
  AK.mountChart("yearlyIndirectExpense-chart", {
    chart: {
      type: "bar", height: 260, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill("yre." + opts.dataPointIndex) }
    },
    series: [{ name: "Rework Expense (₹ Lakhs)", data: data.months.map((m) => m.rework) }],
    xaxis: { categories: data.months.map((m) => m.month) },
    colors: [AK.chartColors.orange],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => "₹" + fmtNum(v) + "L" } },
    grid: { borderColor: "#e5e7eb" }
  });
}

/* Two small-multiple charts instead of one merged chart — supplier count and
   average rating are different units (count vs %), and forcing both onto one
   axis (the previous design) makes the smaller series unreadable. */
function renderSupplierOnboarding(data) {
  const el = document.getElementById("supplierOnboarding");
  if (!el) return;

  el.innerHTML =
    '<div style="display:flex;gap:16px;flex-wrap:wrap">' +
    '<div style="flex:1;min-width:220px"><div style="font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px">New Suppliers Onboarded</div><div id="supplierOnboarding-count-chart"></div></div>' +
    '<div style="flex:1;min-width:220px"><div style="font-size:12px;font-weight:600;color:#6b7280;margin-bottom:6px">Average Supplier Rating</div><div id="supplierOnboarding-rating-chart"></div></div>' +
    '</div>';

  AK.mountChart("supplierOnboarding-count-chart", {
    chart: { type: "bar", height: 220, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "New Suppliers", data: data.supplier_counts }],
    xaxis: { categories: data.years },
    colors: [AK.chartColors.blue],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => fmtNum(v) + " supplier(s)" } },
    grid: { borderColor: "#e5e7eb" }
  });

  AK.mountChart("supplierOnboarding-rating-chart", {
    chart: { type: "bar", height: 220, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "Avg Rating", data: data.supplier_ratings }],
    xaxis: { categories: data.years },
    colors: [AK.chartColors.orange],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => v + "%" } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderLeadTimeTrend(data) {
  const el = document.getElementById("leadTimeTrend");
  if (!el) return;
  if (!data.labels || data.labels.length === 0) {
    el.innerHTML = AK.emptyPanel("No lead time data in the last 18 months.", 220);
    return;
  }

  el.innerHTML = '<div id="leadTimeTrend-chart"></div>';
  AK.mountChart("leadTimeTrend-chart", {
    chart: { type: "line", height: 260, fontFamily: "Poppins, sans-serif", toolbar: { show: false } },
    series: [{ name: "Avg Lead Time (days)", data: data.values }],
    xaxis: { categories: data.labels },
    colors: [AK.chartColors.violet],
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 5, hover: { size: 7 } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => fmtNum(v) + " days" } }
  });
}

function renderMaterialTypeDonut(data) {
  const el = document.getElementById("materialRatio");
  if (!el) return;
  if (data.total <= 0) {
    el.innerHTML = AK.emptyPanel("No approved material requisitions this year.", 220);
    return;
  }

  el.innerHTML = '<div id="materialRatio-chart"></div>';
  AK.mountChart("materialRatio-chart", {
    chart: { type: "donut", height: 260, fontFamily: "Poppins, sans-serif" },
    series: [data.raw_material_value, data.trading_value, data.red_tag_value],
    labels: ["Raw Material", "Trading/Service", "Red Tag"],
    colors: AK.categoricalColors(3),
    legend: { position: "bottom" },
    dataLabels: { enabled: true, formatter: (v) => v.toFixed(0) + "%" },
    stroke: { width: 2, colors: ["#fff"] },
    tooltip: { y: { formatter: (v) => data.unit + fmtNum(v) } },
    plotOptions: {
      pie: {
        donut: {
          size: "62%",
          labels: {
            show: true,
            total: { show: true, label: "Total Material", formatter: () => data.unit + fmtNum(data.total) }
          }
        }
      }
    }
  });
}

function renderCostSavings(data) {
  const items = [
    { icon: "fa-users", title: "Second Supplier Savings", value: `₹${data.second_supplier_savings}`, sub: `${data.second_supplier_percent}% of comparable spend` },
    { icon: "fa-recycle", title: "Scrap Value Realized", value: `₹${data.scrap_value_realized}`, sub: `Change vs last year: ${data.scrap_value_change}${/^[+-]?\d+$/.test(data.scrap_value_change) ? "%" : ""}` },
    { icon: "fa-boxes", title: "Non-Moving Stock Reduction", value: `₹${data.non_moving_stock_reduction}`, sub: `${data.non_moving_stock_percent}% reduction vs last year` },
    { icon: "fa-wrench", title: "Indirect Expense Reduction", value: `₹${data.indirect_expense_reduction}`, sub: `${data.indirect_expense_percent}% reduction vs last year` }
  ];
  const rows = items.map((it) => `
    <div class="savings-item">
      <div class="savings-icon"><i class="fas ${it.icon}"></i></div>
      <div class="savings-content"><div class="savings-title">${it.title}</div><div class="savings-sub">${it.sub}</div></div>
      <div class="savings-value">${it.value}</div>
    </div>`).join("");
  return `<div class="savings-list">${rows}</div>
    <div class="savings-total"><i class="fas fa-hand-holding-usd"></i> Total Annual Savings: <strong>₹${data.total_annual_savings}</strong></div>`;
}

function renderYoyComparison(data) {
  const card = (year, values) => `
    <div class="comparison-card">
      <div class="comparison-year">${year}</div>
      <div class="comparison-metrics">
        <div class="comparison-metric"><span>Non-Moving Stock</span><strong>${values.nonMoving}</strong></div>
        <div class="comparison-metric"><span>Indirect Expense</span><strong>${values.indirect}</strong></div>
        <div class="comparison-metric"><span>Supplier Rating</span><strong>${values.rating}</strong></div>
        <div class="comparison-metric"><span>Lead Time</span><strong>${values.leadTime}</strong></div>
      </div>
    </div>`;
  return `<div class="comparison-container">
    ${card(data.prev_year, { nonMoving: data.prev_non_moving_stock, indirect: data.prev_indirect_exp, rating: data.prev_supplier_rating, leadTime: data.prev_lead_time })}
    ${card(data.curr_year, { nonMoving: data.curr_non_moving_stock, indirect: data.curr_indirect_exp, rating: data.curr_supplier_rating, leadTime: data.curr_lead_time })}
  </div>
  <div class="comparison-changes">
    <div class="change-chip">Non-Moving Stock: ${data.non_moving_change || "—"}</div>
    <div class="change-chip">Indirect Expense: ${data.indirect_change || "—"}</div>
    <div class="change-chip">Supplier Rating: ${data.rating_change || "—"}</div>
    <div class="change-chip">Lead Time: ${data.lead_time_change || "—"}</div>
  </div>`;
}

function renderAnnualSummary(data) {
  const rows = [
    { label: "Non-Moving Stock", key: "nonMoving", format: formatCurrency, trendKey: "nonMoving" },
    { label: "Indirect Expense", key: "indirect", format: formatCurrency, trendKey: "indirect" },
    { label: "Avg Supplier Rating", key: "avgRating", format: (v) => `${v}%`, trendKey: "rating" },
    { label: "Avg Lead Time", key: "leadTime", format: (v) => `${v} Days`, trendKey: "leadTime" },
    { label: "Scrap Value", key: "scrap", format: formatCurrency, trendKey: "scrap" },
    { label: "New Suppliers", key: "newSuppliers", format: fmtNum, trendKey: "suppliers" },
    { label: "Cost Savings", key: "costSavings", format: formatCurrency, trendKey: "savings" }
  ];

  const [y1, y2, y3] = data.years;
  const bodyRows = rows.map((r) => `
    <tr>
      <td>${r.label}</td>
      <td>${r.format(y1[r.key])}</td>
      <td>${r.format(y2[r.key])}</td>
      <td>${r.format(y3[r.key])}</td>
      <td><span class="trend-badge ${data.trends[r.trendKey].status}">${data.trends[r.trendKey].trend}</span></td>
    </tr>`).join("");

  return `<table class="summary-table">
    <thead><tr><th><i class="fas fa-list"></i> Metric</th><th>${y1.year}</th><th>${y2.year}</th><th>${y3.year}</th><th>Trend</th></tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>`;
}

function renderDashboard(computed) {
  document.getElementById("kpiGrid").innerHTML = renderKpiTiles(computed.tiles);
  renderYearlyIndirectExpense(computed.yearlyIndirect);
  renderSupplierOnboarding(computed.onboarding);
  renderLeadTimeTrend(computed.leadTime);
  renderMaterialTypeDonut(computed.materialRatio);
  document.getElementById("costSavings").innerHTML = renderCostSavings(computed.costSavings);
  document.getElementById("yoyComparison").innerHTML = renderYoyComparison(computed.yoy);
  document.getElementById("annualSummary").innerHTML = renderAnnualSummary(computed.annualSummary);

  // Make every number that has a drill-down clickable.
  AK.autoBind(document);
}

function renderError(msg) {
  const container = document.querySelector(".yearly-container");
  if (container) container.innerHTML = `<div class="monthly-empty" style="height:200px;"><i class="fas fa-exclamation-triangle"></i> Failed to load dashboard: ${AK.esc(msg)}</div>`;
}

/* ----------------------------------------------------------------
   7. INIT
   ---------------------------------------------------------------- */
async function initYearlyStoreDashboard() {
  try {
    const raw = await fetchAllDashboardData();

    const tiles = computeTileSectionData(raw);
    const yearlyIndirect = computeYearlyIndirectExpense(raw);
    const onboarding = computeSupplierOnboardingAndRating(raw);
    const leadTime = computeMaterialLeadTimeTrend(raw);
    const materialRatio = computeMaterialTypeMovementRatio(raw);
    const costSavings = computeCostSavingsBreakdown(raw);
    const yoy = computeYearOverYearComparison(raw);
    const annualSummary = computeAnnualPerformanceSummary(raw);

    renderDashboard({ tiles, yearlyIndirect, onboarding, leadTime, materialRatio, costSavings, yoy, annualSummary });

    AK.report();
    console.log("%c[storeYearly] ready — click any count to see the records behind it.",
      "color:#15803d;font-weight:bold");

    // One-time field discovery for every report this dashboard reads — paste the console
    // output back to fix any remaining guessed field name in one pass. Safe to delete once
    // every field in CFG.fields is confirmed against real data.
    AK.discoverAllFields(CFG.reports);
  } catch (err) {
    console.error("Yearly Store Dashboard error:", err);
    renderError(err && err.message ? err.message : "Unknown error");
  }
}

AK.init({ name: "storeYearly" });

// V2 JS API needs no init() call
initYearlyStoreDashboard();
