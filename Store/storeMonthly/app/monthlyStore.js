"use strict";

/* ================================================================
   MONTHLY STORE DASHBOARD — WIDGET VERSION
   Ports ALL Deluge functions to run in JS on raw records:
     - getNonMovingStockTrend
     - monthlyPoStatusDistribution
     - supplierRatingTrend
     - getTileSectionData          (9 KPI tiles)
     - vendorPerformanceTable
   expenseSplitDistribution was an empty stub in the Deluge code
   ("need clarifications") — there's nothing to port, so it's a
   placeholder panel here until it's defined.

   KNOWN ISSUES CARRIED OVER FROM THE ORIGINAL DELUGE CODE
   (ported as-is, not silently "fixed"):
   - PO date field name conflict: monthlyPoStatusDistribution used
     "Date", vendorPerformanceTable used "PO_Date". We use PO_Date
     everywhere — VERIFY this is the correct link name.
   - min_stock_list_update is a raw count (starts at a baseline of 4,
     +1 per under-stocked product touched this month) but the HTML
     displays it with a "%" sign. That mismatch is pre-existing.
   - The Deluge getTileSectionData computed supplier_performance_rating
     twice; the first calculation is fully overwritten before use, so
     only the final (avg-of-supplier-averages) version is ported.
   ================================================================ */

/* ----------------------------------------------------------------
   0. CONFIG — VERIFY these report/field names against your app
   ---------------------------------------------------------------- */
const CFG = {
  reports: {
    product: "All_Product",                              // confirmed
    purchaseOrder: "All_Purchase_Orders",                 // confirmed via fields.txt
    supplierRating: "Supplier_Rating_Report",             // confirmed via fields.txt
    vendors: "All_Vendors",                               // confirmed via fields.txt
    tools: "All_Tools",                                   // still unconfirmed — not in the fields.txt dump, VERIFY
    rejectionReplacement: "Rejection_Replacement_Register_Format" // confirmed (from weekly dashboard)
  },
  fields: {
    product: {
      availableStock: "Available_Stock",
      minStock: "Minimum_Stock_Level",
      price: "Price",
      lastOrderDate: "Last_Order_Date",
      modifiedTime: "Modified_Time",
      isRedTag: "Is_Red_Tag_Material",
      productName: "Product_Name"
    },
    purchaseOrder: {
      date: "PO_Date",              // confirmed via fields.txt — see note above re: Date vs PO_Date conflict
      status: "Status",             // confirmed
      vendorName: "Vendor_Name",    // confirmed — lookup -> .ID, .Vendor_Supplier_Name / .zc_display_value
      expectedDeliveryDate: "Expected_Delivery_Date", // confirmed
      deliveredOn: "Delivered_On"   // confirmed via fields.txt — replaces the broken Purchase_Order_Register report below
    },
    supplierRating: {
      supplierName: "Supplier_Name", // lookup -> .ID, .Vendor_Supplier_Name / .zc_display_value
      totalRating: "Total_Rating",
      date: "Date_field",
      product: "Product"
    },
    vendors: {
      name: "Vendor_Supplier_Name",
      addedTime: "Added_Time",
      status: "Vendor_Status",
      productDetails: "Product_Details" // subform -> .Product_Code (lookup), .Make (lookup)
    },
    tools: {
      givenTo: "Given_To",
      modifiedTime: "Modified_Time",
      status: "Status"
    },
    rejectionReplacement: {
      date: "Date_field",
      status: "Status",
      type: "Type_field"
    }
  },
  maxRecords: 1000
};

CFG.customFields = {
  product: [
    CFG.fields.product.availableStock, CFG.fields.product.minStock, CFG.fields.product.price,
    CFG.fields.product.lastOrderDate, CFG.fields.product.modifiedTime, CFG.fields.product.isRedTag,
    CFG.fields.product.productName
  ].join(","),
  purchaseOrder: [
    CFG.fields.purchaseOrder.date, CFG.fields.purchaseOrder.status,
    CFG.fields.purchaseOrder.vendorName, CFG.fields.purchaseOrder.expectedDeliveryDate,
    CFG.fields.purchaseOrder.deliveredOn
  ].join(","),
  supplierRating: [
    CFG.fields.supplierRating.supplierName, CFG.fields.supplierRating.totalRating,
    CFG.fields.supplierRating.date, CFG.fields.supplierRating.product
  ].join(","),
  vendors: [
    CFG.fields.vendors.name, CFG.fields.vendors.addedTime,
    CFG.fields.vendors.status, CFG.fields.vendors.productDetails
  ].join(","),
  tools: [CFG.fields.tools.givenTo, CFG.fields.tools.modifiedTime, CFG.fields.tools.status].join(","),
  rejectionReplacement: [
    CFG.fields.rejectionReplacement.date, CFG.fields.rejectionReplacement.status, CFG.fields.rejectionReplacement.type
  ].join(",")
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
    console.warn(`Monthly Store Dashboard: "${label}" fetch failed, treating as empty.`, err);
    return { data: [] };
  }
}

async function fetchAllPages(baseParams, label, maxPages = 10) {
  let all = [];
  let cursor = null;
  let page = 0;

  do {
    const params = cursor ? { ...baseParams, record_cursor: cursor } : { ...baseParams };
    const res = await safeGetRecords(params, `${label} (page ${page + 1})`);
    all = all.concat(res.data || []);
    cursor = res.record_cursor || null;
    page++;
  } while (cursor && page < maxPages);

  if (cursor && page >= maxPages) {
    console.warn(`Monthly Store Dashboard: "${label}" hit the ${maxPages}-page safety cap; some older records may be excluded.`);
  }

  return all;
}

async function fetchSimple(reportName, customFieldsKey, label, extraCriteria) {
  const params = {
    report_name: reportName,
    field_config: "custom",
    fields: CFG.customFields[customFieldsKey],
    max_records: CFG.maxRecords
  };
  if (extraCriteria) params.criteria = extraCriteria;
  const res = await safeGetRecords(params, label);
  return res.data || [];
}

/* ----------------------------------------------------------------
   2. DATE HELPERS
   ---------------------------------------------------------------- */
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function stripTime(d) { const c = new Date(d); c.setHours(0, 0, 0, 0); return c; }
function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }
function subDays(d, n) { return addDays(d, -n); }
function addMonths(d, n) { const c = new Date(d); c.setMonth(c.getMonth() + n); return c; }
function subMonths(d, n) { return addMonths(d, -n); }
function startOfMonth(d) { const c = stripTime(d); c.setDate(1); return c; }
function daysBetween(d1, d2) { return Math.round((stripTime(d2) - stripTime(d1)) / DAY_MS); }

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

// Lookup fields come back as {ID, <display field>, zc_display_value}.
function lookupId(obj) { return obj && obj.ID ? obj.ID : null; }
function lookupName(obj, displayField) {
  if (!obj) return null;
  return (displayField && obj[displayField]) || obj.zc_display_value || null;
}

/* ----------------------------------------------------------------
   2b. DRILL-DOWN PLUMBING
   Every count on screen can be clicked to see the records behind it.
   ---------------------------------------------------------------- */
const SRC = {};
const P = CFG.fields;

const COLS = {
  product: [
    { label: "Product", value: P.product.productName },
    { label: "Available Stock", value: P.product.availableStock, format: "dec" },
    { label: "Minimum Stock", value: P.product.minStock, format: "dec" },
    { label: "Price", value: P.product.price, format: "money" },
    { label: "Last Ordered", value: P.product.lastOrderDate, format: "date" },
    { label: "Red Tag", value: P.product.isRedTag }
  ],
  vendor: [
    { label: "Vendor / Supplier", value: P.vendors.name },
    { label: "Status", value: P.vendors.status },
    { label: "Added", value: P.vendors.addedTime, format: "date" },
    {
      label: "Products listed", format: "int",
      value: (v) => (v[P.vendors.productDetails] || []).length
    }
  ],
  purchaseOrder: [
    { label: "PO Date", value: P.purchaseOrder.date, format: "date" },
    { label: "Vendor", value: P.purchaseOrder.vendorName },
    { label: "Status", value: P.purchaseOrder.status },
    { label: "Expected Delivery", value: P.purchaseOrder.expectedDeliveryDate, format: "date" }
  ],
  tools: [
    { label: "Given To", value: P.tools.givenTo },
    { label: "Status", value: P.tools.status },
    { label: "Modified", value: P.tools.modifiedTime, format: "date" }
  ],
  supplierRating: [
    { label: "Date", value: P.supplierRating.date, format: "date" },
    { label: "Supplier", value: P.supplierRating.supplierName },
    { label: "Product", value: P.supplierRating.product },
    { label: "Total Rating", value: P.supplierRating.totalRating, format: "dec" }
  ],
  rejection: [
    { label: "Date", value: P.rejectionReplacement.date, format: "date" },
    { label: "Type", value: P.rejectionReplacement.type },
    { label: "Status", value: P.rejectionReplacement.status }
  ]
};

function drill(key, title, report, columns, srcKey, subtitle, empty) {
  AK.defineDrill(key, {
    title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
    rows: () => SRC[srcKey] || []
  });
}

/* ----------------------------------------------------------------
   3. FETCH — done once per load
   ---------------------------------------------------------------- */
async function fetchAllDashboardData() {
  const today = new Date();

  const [
    products, purchaseOrders,
    supplierRatings, vendors, tools, rejectionReplacement
  ] = await Promise.all([
    fetchAllPages({
      report_name: CFG.reports.product,
      field_config: "custom",
      fields: CFG.customFields.product,
      max_records: CFG.maxRecords,
      criteria: `${CFG.fields.product.availableStock} > 0`
    }, "Product"),
    fetchSimple(CFG.reports.purchaseOrder, "purchaseOrder", "Purchase Order"),
    fetchSimple(CFG.reports.supplierRating, "supplierRating", "Supplier Rating"),
    fetchAllPages({
      report_name: CFG.reports.vendors,
      field_config: "custom",
      fields: CFG.customFields.vendors,
      max_records: CFG.maxRecords
    }, "Vendors"),
    fetchSimple(CFG.reports.tools, "tools", "Tools"),
    fetchSimple(CFG.reports.rejectionReplacement, "rejectionReplacement", "Rejection & Replacement Register")
  ]);

  return { today, products, purchaseOrders, supplierRatings, vendors, tools, rejectionReplacement };
}

/* ----------------------------------------------------------------
   4. CALCULATIONS
   ---------------------------------------------------------------- */

// --- 4a. getNonMovingStockTrend ---
function computeNonMovingStockTrend(products, today) {
  const offsets = [5, 4, 3, 2, 1, 0];
  const trendData = offsets.map((offset) => {
    const monthDate = subMonths(today, offset);
    const monthStart = startOfMonth(monthDate);
    const monthName = MONTH_NAMES[monthDate.getMonth()];
    const monthEnd = subDays(addMonths(monthStart, 1), 1);
    const sixMonthsBefore = subMonths(monthEnd, 6);

    let value = 0;
    const records = [];
    products.forEach((p) => {
      const stock = num(p[CFG.fields.product.availableStock]);
      const lastOrder = parseZohoDate(p[CFG.fields.product.lastOrderDate]);
      const isNonMoving = stock > 0 && (!lastOrder || lastOrder < sixMonthsBefore);
      if (isNonMoving) {
        value += num(p[CFG.fields.product.price]) * stock;
        records.push(p);
      }
    });

    return { month: monthName, value: Math.round(value), count: records.length, _records: records };
  });

  return { trend_data: trendData };
}

// --- 4b. monthlyPoStatusDistribution ---
function computePoStatusWeekly(purchaseOrders, today) {
  const monthStart = startOfMonth(today);
  const monthEnd = subDays(addMonths(monthStart, 1), 1);
  const STATUSES = ["Draft", "Issued", "Received", "Billed", "Closed", "w_approval"];

  const weekly = {};

  purchaseOrders.forEach((po) => {
    const poDate = parseZohoDate(po[CFG.fields.purchaseOrder.date]);
    if (!poDate || poDate < monthStart || poDate > monthEnd) return;

    const daysDiff = daysBetween(monthStart, poDate);
    let weekNumber = Math.floor(daysDiff / 7) + 1;
    if (weekNumber > 5) weekNumber = 5;

    let status = po[CFG.fields.purchaseOrder.status] || "Draft";
    if (status === "Waiting For Approval") status = "w_approval";
    if (!STATUSES.includes(status)) status = "Draft";

    const key = `Week ${weekNumber}`;
    if (!weekly[key]) {
      weekly[key] = {
        Draft: 0, Issued: 0, Received: 0, Billed: 0, Closed: 0, w_approval: 0, Total: 0,
        _records: { Draft: [], Issued: [], Received: [], Billed: [], Closed: [], w_approval: [] }
      };
    }
    weekly[key][status] += 1;
    weekly[key]._records[status].push(po);
    weekly[key].Total += 1;
  });

  const weeklyData = Object.keys(weekly)
    .sort((a, b) => parseInt(a.replace("Week ", ""), 10) - parseInt(b.replace("Week ", ""), 10))
    .map((week) => ({ week_label: week, ...weekly[week] }));

  return { month_start: monthStart, month_end: monthEnd, weekly_data: weeklyData };
}

// --- 4c. supplierRatingTrend ---
function computeSupplierRatingTrend(supplierRatings, today) {
  const monthStart = startOfMonth(today);
  const todayStripped = stripTime(today);

  const filtered = supplierRatings.filter((rec) => {
    const supplier = rec[CFG.fields.supplierRating.supplierName];
    const d = parseZohoDate(rec[CFG.fields.supplierRating.date]);
    return supplier && d && d >= monthStart && d <= todayStripped;
  });

  filtered.sort((a, b) => num(b[CFG.fields.supplierRating.totalRating]) - num(a[CFG.fields.supplierRating.totalRating]));

  return filtered.slice(0, 10).map((rec) => {
    const supplier = rec[CFG.fields.supplierRating.supplierName];
    const name = lookupName(supplier, CFG.fields.vendors.name) || "Unknown Supplier";
    const supplierId = lookupId(supplier);
    // All of this supplier's rating records this month, so the drill-down shows the full picture.
    const records = filtered.filter((r) =>
      (supplierId && lookupId(r[CFG.fields.supplierRating.supplierName]) === supplierId) ||
      lookupName(r[CFG.fields.supplierRating.supplierName], CFG.fields.vendors.name) === name);
    return {
      supplier_name: name,
      supplier_point: num(rec[CFG.fields.supplierRating.totalRating]),
      _records: records
    };
  });
}

// --- 4d. getTileSectionData ---
function computeTileSectionData(raw) {
  const { today, products, vendors, tools, supplierRatings, rejectionReplacement } = raw;
  const monthStart = startOfMonth(today);
  const todayStripped = stripTime(today);

  const newSuppliersThisMonth = vendors.filter((v) => {
    const added = parseZohoDate(v[CFG.fields.vendors.addedTime]);
    return v[CFG.fields.vendors.name] && added && added >= monthStart && added <= todayStripped;
  });
  const newSupplierApprovedRows = newSuppliersThisMonth.filter((v) => v[CFG.fields.vendors.status] === "Approved");
  const newSupplierApproved = newSupplierApprovedRows.length;

  const toolsThisMonth = tools.filter((t) => {
    const mt = parseZohoDate(t[CFG.fields.tools.modifiedTime]);
    return t[CFG.fields.tools.givenTo] && mt && mt >= monthStart && mt <= todayStripped;
  });
  const toolsCompletedRows = toolsThisMonth.filter((t) => t[CFG.fields.tools.status] === "Completed");
  const toolsCompleted = toolsCompletedRows.length;
  const toolsInspectionsDone = toolsThisMonth.length > 0 ? Math.round((toolsCompleted * 100) / toolsThisMonth.length) : 0;

  const productsOrderedThisMonth = products.filter((p) => {
    const lastOrder = parseZohoDate(p[CFG.fields.product.lastOrderDate]);
    return lastOrder && lastOrder >= monthStart && lastOrder <= todayStripped;
  });
  let minStockListUpdate = 4;
  const minStockRows = [];
  productsOrderedThisMonth.forEach((p) => {
    if (num(p[CFG.fields.product.availableStock]) <= num(p[CFG.fields.product.minStock])) {
      minStockListUpdate++;
      minStockRows.push(p);
    }
  });

  const redTagRows = products.filter((p) => {
    const isRedTag = p[CFG.fields.product.isRedTag] === true || p[CFG.fields.product.isRedTag] === "true";
    const mt = parseZohoDate(p[CFG.fields.product.modifiedTime]);
    return isRedTag && mt && mt >= monthStart && mt <= todayStripped;
  });
  const redTagMaterialValue = redTagRows.reduce((sum, p) => sum + num(p[CFG.fields.product.price]), 0);

  const totalNoSuppliers = newSuppliersThisMonth.length;
  const approvedSuppliers = newSupplierApproved;
  const supplierRegistrationPercentage = totalNoSuppliers > 0 ? Math.round((approvedSuppliers * 100) / totalNoSuppliers) : 0;

  const sixMonthsBefore = subMonths(today, 6);
  const nonMovingRows = products.filter((p) => {
    const isRedTag = p[CFG.fields.product.isRedTag] === true || p[CFG.fields.product.isRedTag] === "true";
    const stock = num(p[CFG.fields.product.availableStock]);
    const lastOrder = parseZohoDate(p[CFG.fields.product.lastOrderDate]);
    return isRedTag && stock > 0 && lastOrder && lastOrder <= sixMonthsBefore;
  });
  const nonMovingStock = nonMovingRows.length;

  const existingComboKeys = new Set();
  vendors.forEach((v) => {
    const added = parseZohoDate(v[CFG.fields.vendors.addedTime]);
    if (added && added < monthStart) {
      (v[CFG.fields.vendors.productDetails] || []).forEach((item) => {
        const codeId = lookupId(item.Product_Code);
        const makeId = lookupId(item.Make);
        if (codeId && makeId) existingComboKeys.add(`${codeId}::${makeId}`);
      });
    }
  });
  const alternateSupplierRows = newSuppliersThisMonth.filter((v) => {
    return (v[CFG.fields.vendors.productDetails] || []).some((item) => {
      const codeId = lookupId(item.Product_Code);
      const makeId = lookupId(item.Make);
      return codeId && makeId && existingComboKeys.has(`${codeId}::${makeId}`);
    });
  });
  const alternateSupplierFound = alternateSupplierRows.length;

  const ratingRecordsThisMonth = supplierRatings.filter((rec) => {
    const d = parseZohoDate(rec[CFG.fields.supplierRating.date]);
    return rec[CFG.fields.supplierRating.product] && rec[CFG.fields.supplierRating.supplierName] &&
      d && d >= monthStart && d <= todayStripped;
  });

  const supplierTotals = {};
  const supplierCounts = {};
  ratingRecordsThisMonth.forEach((rec) => {
    const supplier = rec[CFG.fields.supplierRating.supplierName];
    const key = lookupId(supplier) || lookupName(supplier, CFG.fields.vendors.name) || "unknown";
    const rating = num(rec[CFG.fields.supplierRating.totalRating]);
    supplierTotals[key] = (supplierTotals[key] || 0) + rating;
    supplierCounts[key] = (supplierCounts[key] || 0) + 1;
  });

  const supplierKeys = Object.keys(supplierTotals);
  let belowSeventyCount = 0;
  let overallSum = 0;
  const belowSeventyKeys = new Set();
  supplierKeys.forEach((key) => {
    const avg = supplierTotals[key] / supplierCounts[key];
    overallSum += avg;
    if (avg < 70) { belowSeventyCount++; belowSeventyKeys.add(key); }
  });
  const belowSeventyRows = ratingRecordsThisMonth.filter((rec) => {
    const supplier = rec[CFG.fields.supplierRating.supplierName];
    const key = lookupId(supplier) || lookupName(supplier, CFG.fields.vendors.name) || "unknown";
    return belowSeventyKeys.has(key);
  });
  let supplierPerformanceRating = supplierKeys.length > 0 ? Math.round((overallSum / supplierKeys.length) * 10) / 10 : 0;
  if (supplierPerformanceRating > 100) supplierPerformanceRating = 100;

  const pendingReplacementRows = rejectionReplacement.filter((rec) => {
    const d = parseZohoDate(rec[CFG.fields.rejectionReplacement.date]);
    return d && d >= monthStart && d <= todayStripped &&
      rec[CFG.fields.rejectionReplacement.status] === "Pending" &&
      rec[CFG.fields.rejectionReplacement.type] === "Replacement";
  });

  return {
    new_supplier: newSupplierApproved,
    supplier_performance_rating: supplierPerformanceRating,
    tools_inspections_done: toolsInspectionsDone,
    min_stock_list_update: minStockListUpdate,
    red_tag_material_value: redTagMaterialValue,
    total_no_suppliers: totalNoSuppliers,
    approved_suppliers: approvedSuppliers,
    supplier_registration_percentage: supplierRegistrationPercentage,
    non_moving_stock: nonMovingStock,
    alternate_supplier_found: alternateSupplierFound,
    suppliers_below_70: belowSeventyCount,
    total_suppliers_rated: supplierKeys.length,
    pending_replacement: pendingReplacementRows.length,
    src: {
      newSupplier: newSupplierApprovedRows,
      allNewSuppliers: newSuppliersThisMonth,
      supplierRating: ratingRecordsThisMonth,
      toolsAll: toolsThisMonth,
      toolsDone: toolsCompletedRows,
      minStock: minStockRows,
      redTag: redTagRows,
      below70: belowSeventyRows,
      nonMoving: nonMovingRows,
      pendingReplacement: pendingReplacementRows,
      alternateSupplier: alternateSupplierRows
    }
  };
}

// --- 4e. vendorPerformanceTable ---
function computeVendorPerformanceTable(raw) {
  const { today, purchaseOrders, supplierRatings, vendors } = raw;
  const monthStart = startOfMonth(today);
  const todayStripped = stripTime(today);

  const vendorsById = {};
  vendors.forEach((v) => { if (v.ID) vendorsById[v.ID] = v; });

  const issuedPosThisMonth = purchaseOrders.filter((po) => {
    const d = parseZohoDate(po[CFG.fields.purchaseOrder.date]);
    return po[CFG.fields.purchaseOrder.vendorName] && po[CFG.fields.purchaseOrder.status] === "Issued" &&
      d && d >= monthStart && d <= todayStripped;
  });

  const posByVendorId = {};
  issuedPosThisMonth.forEach((po) => {
    const vendorId = lookupId(po[CFG.fields.purchaseOrder.vendorName]);
    if (!vendorId) return;
    if (!posByVendorId[vendorId]) posByVendorId[vendorId] = [];
    posByVendorId[vendorId].push(po);
  });

  const ratingsByVendorId = {};
  supplierRatings.forEach((rec) => {
    const d = parseZohoDate(rec[CFG.fields.supplierRating.date]);
    const vendorId = lookupId(rec[CFG.fields.supplierRating.supplierName]);
    if (!vendorId || !d || d < monthStart || d > todayStripped) return;
    if (!ratingsByVendorId[vendorId]) ratingsByVendorId[vendorId] = [];
    ratingsByVendorId[vendorId].push(rec);
  });

  return Object.keys(posByVendorId).map((vendorId) => {
    const vendorRecord = vendorsById[vendorId];
    if (!vendorRecord) return null;
    const vendorName = vendorRecord[CFG.fields.vendors.name] || "Unknown Vendor";
    const vendorPos = posByVendorId[vendorId];

    let delayCount = 0;
    const delayReasons = [];
    const delayedPos = [];
    vendorPos.forEach((po) => {
      const expected = parseZohoDate(po[CFG.fields.purchaseOrder.expectedDeliveryDate]);
      const received = parseZohoDate(po[CFG.fields.purchaseOrder.deliveredOn]);
      let isDelayed = false;
      let reason = "";

      if (received) {
        if (expected && received > expected) {
          isDelayed = true;
          reason = `Delivered ${daysBetween(expected, received)} days late`;
        }
      } else if (expected && expected < todayStripped) {
        isDelayed = true;
        reason = `Pending delivery, ${daysBetween(expected, todayStripped)} days overdue`;
      }

      if (isDelayed) {
        delayCount++;
        delayedPos.push(po);
        if (delayReasons.length < 2) delayReasons.push(reason);
      }
    });

    const vendorRatings = ratingsByVendorId[vendorId] || [];
    const validRatings = vendorRatings.filter((r) => num(r[CFG.fields.supplierRating.totalRating]) > 0);
    const avgRating = validRatings.length > 0
      ? Math.round(validRatings.reduce((s, r) => s + num(r[CFG.fields.supplierRating.totalRating]), 0) / validRatings.length)
      : 0;

    let remarks;
    if (delayCount === 0) remarks = "Excellent response time";
    else if (delayCount === 1) remarks = "Minor delay due to transport";
    else remarks = `Multiple delays - ${delayReasons.join(", ")}`;

    if (!remarks) {
      if (avgRating >= 90) remarks = "Excellent response time";
      else if (avgRating >= 80) remarks = "Good performance";
      else if (avgRating >= 70) remarks = "Average performance";
      else remarks = "Needs improvement";
    }

    return {
      vendor_name: vendorName,
      total_po: vendorPos.length,
      delays_count: delayCount,
      rating: avgRating,
      remarks,
      _pos: vendorPos,
      _delayed: delayedPos
    };
  }).filter(Boolean);
}

/* ----------------------------------------------------------------
   5. RENDER
   ---------------------------------------------------------------- */
const STATUS_COLORS = { Draft: "#9ca3af", Issued: "#3b82f6", Received: "#10b981", Billed: "#f59e0b", Closed: "#6366f1", w_approval: "#ef4444" };
const STATUS_LABELS = { Draft: "Draft", Issued: "Issued", Received: "Received", Billed: "Billed", Closed: "Closed", w_approval: "Waiting for Approval" };

function renderKpiTiles(tiles) {
  const R = CFG.reports;
  Object.keys(tiles.src).forEach((k) => { SRC[k] = tiles.src[k]; });

  drill("kpi.newSupplier", "New Suppliers Added (Approved)", R.vendors, COLS.vendor, "newSupplier",
    "Vendors added this month whose Vendor_Status is Approved",
    "No new supplier was approved this month.");
  drill("kpi.supplierRating", "Supplier Ratings This Month", R.supplierRating, COLS.supplierRating, "supplierRating",
    "Supplier Rating records this month; the tile is the average of each supplier's average",
    "No supplier was rated this month.");
  drill("kpi.toolsAll", "Tools Inspected This Month", R.tools, COLS.tools, "toolsAll",
    "Tools with a Given To, modified this month; the percentage is the share with Status = Completed");
  drill("kpi.minStock", "Products At or Below Minimum Stock", R.product, COLS.product, "minStock",
    "Products ordered this month whose Available Stock is at or below their Minimum Stock Level");
  drill("kpi.redTag", "Red Tag Material", R.product, COLS.product, "redTag",
    "Products flagged Is_Red_Tag_Material and modified this month; the value is their summed Price",
    "No red tag material was touched this month.");
  drill("kpi.below70", "Ratings From Suppliers Below 70%", R.supplierRating, COLS.supplierRating, "below70",
    "Rating records belonging to suppliers whose monthly average is under 70",
    "Every rated supplier is at 70% or above.");
  drill("kpi.allNewSuppliers", "All New Suppliers This Month", R.vendors, COLS.vendor, "allNewSuppliers",
    "Every vendor added this month, approved or not");
  drill("kpi.nonMoving", "Non-Moving Stock (> 6 months)", R.product, COLS.product, "nonMoving",
    "Red tag products with stock on hand whose Last Order Date is more than six months ago",
    "Nothing has been sitting unsold for more than six months.");
  drill("kpi.pendingReplacement", "Pending Replacements", R.rejectionReplacement, COLS.rejection, "pendingReplacement",
    "Replacement entries this month that are still Pending",
    "No replacement is pending.");
  drill("kpi.alternateSupplier", "Alternate Suppliers Found", R.vendors, COLS.vendor, "alternateSupplier",
    "New suppliers that list a Product Code + Make combination an existing supplier already covers",
    "No new supplier duplicates an existing product/make combination.");

  const cards = [
    {
      icon: "fa-user-plus", cls: "blue", drill: "kpi.newSupplier",
      title: "New Suppliers Added", value: tiles.new_supplier, target: "Target: ≥1 supplier",
      statusIcon: tiles.new_supplier >= 1 ? "fa-check-circle" : "fa-times-circle",
      statusText: tiles.new_supplier >= 1 ? "On Track" : "Below Target"
    },
    {
      icon: "fa-star", cls: "green", drill: "kpi.supplierRating",
      title: "Supplier Performance Rating", value: `${tiles.supplier_performance_rating}%`, target: "Target: ≥80%",
      statusIcon: "fa-trophy", statusText: tiles.supplier_performance_rating >= 80 ? "Excellent" : "Needs Improvement"
    },
    {
      icon: "fa-tools", drill: "kpi.toolsAll", cls: tiles.tools_inspections_done === 100 ? "green" : "teal",
      title: "Tools Inspection Done", value: `${tiles.tools_inspections_done}%`, target: "Target: 100%",
      statusIcon: "fa-check-circle", statusText: tiles.tools_inspections_done === 100 ? "Complete" : "In Progress"
    },
    {
      icon: "fa-clipboard-list", cls: "green", drill: "kpi.minStock",
      title: "Min Stock List Updated", value: tiles.min_stock_list_update, target: "Target: 100%",
      statusIcon: "fa-check-circle", statusText: tiles.min_stock_list_update === 100 ? "Updated" : "Pending"
    },
    {
      icon: "fa-tag", cls: "orange", drill: "kpi.redTag",
      title: "Red Tag Material Value", value: AK.money(tiles.red_tag_material_value), target: "Target: ↓10% MoM",
      statusIcon: "fa-arrow-down", statusText: "Tracking"
    },
    {
      icon: "fa-exclamation-triangle", drill: "kpi.below70", cls: tiles.suppliers_below_70 === 0 ? "green" : "red",
      title: "Suppliers Below 70% Rating", value: `${fmtNum(tiles.suppliers_below_70)} / ${fmtNum(tiles.total_suppliers_rated)}`, target: "Target: 0 suppliers below 70%",
      statusIcon: "fa-exclamation-circle", statusText: tiles.suppliers_below_70 === 0 ? "All Good" : "Action Needed"
    },
    {
      icon: "fa-file-contract", cls: "green", drill: "kpi.allNewSuppliers",
      title: "Supplier Registration", value: `${tiles.supplier_registration_percentage}%`, target: "Target: 100%",
      statusIcon: "fa-check-circle", statusText: tiles.supplier_registration_percentage === 100 ? "Complete" : "Pending"
    },
    {
      icon: "fa-boxes", cls: "orange", drill: "kpi.nonMoving",
      title: "Non-Moving Stock (>6M)", value: `${fmtNum(tiles.non_moving_stock)} items`, target: "Target: Reduce 15% QoQ",
      statusIcon: "fa-chart-line", statusText: "Tracking"
    },
    {
      icon: "fa-exchange-alt", drill: "kpi.pendingReplacement", cls: tiles.pending_replacement === 0 ? "green" : "red",
      title: "Pending Replacements", value: tiles.pending_replacement, target: "Target: 0 pending",
      statusIcon: "fa-clock", statusText: tiles.pending_replacement === 0 ? "All Clear" : "Action Needed"
    },
    {
      icon: "fa-random", cls: "teal", drill: "kpi.alternateSupplier",
      title: "Alternate Supplier Found", value: tiles.alternate_supplier_found, target: "Target: ≥1 supplier",
      statusIcon: "fa-check-circle", statusText: tiles.alternate_supplier_found >= 1 ? "Exceeded" : "Below Target"
    }
  ];

  return cards.map((c) => `
    <div class="kpi-card ${c.cls}">
      <div class="kpi-header">
        <div class="kpi-icon"><i class="fas ${c.icon}"></i></div>
        <div class="kpi-frequency">MONTHLY</div>
      </div>
      <div class="kpi-title">${c.title}</div>
      <div class="kpi-value"${c.drill ? ` data-drill="${c.drill}"` : ""}>${c.value}</div>
      <div class="kpi-target">${c.target}</div>
      <div class="kpi-status"><i class="fas ${c.statusIcon}"></i> ${c.statusText}</div>
    </div>`).join("");
}

function renderVendorTable(vendorRows) {
  if (!vendorRows || vendorRows.length === 0) {
    return AK.emptyPanel(
      "No vendor had a purchase order Issued this month, so there is nothing to score.", 200);
  }

  const ratingClass = (r) => r >= 90 ? "rating-excellent" : r >= 80 ? "rating-good" : r >= 70 ? "rating-average" : "rating-poor";

  const rows = vendorRows.map((v, i) => {
    SRC["vendorPo." + i] = v._pos || [];
    SRC["vendorDelay." + i] = v._delayed || [];
    drill("vendorPo." + i, "Purchase Orders — " + v.vendor_name, CFG.reports.purchaseOrder,
      COLS.purchaseOrder, "vendorPo." + i, "POs Issued to this vendor this month");
    drill("vendorDelay." + i, "Delayed Deliveries — " + v.vendor_name, CFG.reports.purchaseOrder,
      COLS.purchaseOrder, "vendorDelay." + i,
      "POs received after their Expected Delivery Date, or still not received past it",
      "This vendor has delivered everything on time.");
    return `
    <tr>
      <td>${AK.esc(v.vendor_name)}</td>
      <td data-drill="vendorPo.${i}">${fmtNum(v.total_po)}</td>
      <td data-drill="vendorDelay.${i}">${fmtNum(v.delays_count)}</td>
      <td><span class="rating-badge ${ratingClass(v.rating)}">${fmtNum(v.rating)}</span></td>
      <td>${AK.esc(v.remarks)}</td>
    </tr>`;
  }).join("");

  return `<table class="vendor-table">
    <thead>
      <tr>
        <th><i class="fas fa-building"></i> Vendor</th>
        <th><i class="fas fa-file-invoice"></i> PO Count</th>
        <th><i class="fas fa-clock"></i> Delivery Delays</th>
        <th><i class="fas fa-star"></i> Rating</th>
        <th><i class="fas fa-comment"></i> Remarks</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderNonMovingStockTrend(trendData) {
  const el = document.getElementById("nonMovingStock");
  if (!el) return;

  trendData.forEach((m, i) => {
    SRC["nm." + i] = m._records || [];
    drill("nm." + i, "Non-Moving Stock — " + m.month, CFG.reports.product, COLS.product, "nm." + i,
      m.month + ": " + AK.money(m.value) + " across " + fmtNum(m.count) +
      " products with stock on hand and no order in the previous six months",
      "Nothing was non-moving in " + m.month + ".");
  });

  el.innerHTML = '<div id="nonMovingStock-chart"></div>';
  AK.mountChart("nonMovingStock-chart", {
    chart: {
      type: "bar", height: 260, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill("nm." + opts.dataPointIndex) }
    },
    series: [{ name: "Non-Moving Stock Value", data: trendData.map((m) => m.value) }],
    xaxis: { categories: trendData.map((m) => m.month) },
    colors: [AK.chartColors.red],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "50%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => AK.money(v) } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderPoStatusWeekly(weeklyData) {
  const el = document.getElementById("poStatusWeekly");
  if (!el) return;
  if (!weeklyData || weeklyData.length === 0) {
    el.innerHTML = AK.emptyPanel("No purchase order was raised this month.", 260);
    return;
  }

  const statusKeys = Object.keys(STATUS_COLORS);
  weeklyData.forEach((w, wi) => {
    statusKeys.forEach((status) => {
      const key = "po." + wi + "." + status;
      SRC[key] = (w._records && w._records[status]) || [];
      drill(key, "Purchase Orders — " + w.week_label + ", " + STATUS_LABELS[status],
        CFG.reports.purchaseOrder, COLS.purchaseOrder, key,
        w.week_label + " of this month, Status = " + STATUS_LABELS[status]);
    });
  });

  el.innerHTML = '<div id="poStatusWeekly-chart"></div>';
  AK.mountChart("poStatusWeekly-chart", {
    chart: {
      type: "bar", height: Math.max(220, weeklyData.length * 60), stacked: true,
      fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: {
        dataPointSelection: (ev, ctx, opts) =>
          AK.openDrill("po." + opts.dataPointIndex + "." + statusKeys[opts.seriesIndex])
      }
    },
    series: statusKeys.map((status) => ({
      name: STATUS_LABELS[status], data: weeklyData.map((w) => w[status] || 0)
    })),
    xaxis: { categories: weeklyData.map((w) => w.week_label) },
    colors: AK.categoricalColors(statusKeys.length),
    plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: "55%" } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => fmtNum(v) } }
  });
}

function renderSupplierRatingTrend(suppliers) {
  const el = document.getElementById("supplierRating");
  if (!el) return;
  if (!suppliers || suppliers.length === 0) {
    el.innerHTML = AK.emptyPanel("No supplier was rated this month.", 220);
    return;
  }

  suppliers.forEach((s, i) => {
    SRC["sr." + i] = s._records || [];
    drill("sr." + i, "Ratings — " + s.supplier_name, CFG.reports.supplierRating, COLS.supplierRating,
      "sr." + i, "Supplier Rating records for " + s.supplier_name + " this month");
  });

  el.innerHTML = '<div id="supplierRating-chart"></div>';
  AK.mountChart("supplierRating-chart", {
    chart: {
      type: "bar", height: 280, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill("sr." + opts.dataPointIndex) }
    },
    series: [{ name: "Rating", data: suppliers.map((s) => s.supplier_point) }],
    xaxis: { categories: suppliers.map((s) => s.supplier_name) },
    colors: [AK.chartColors.blue],
    plotOptions: { bar: { borderRadius: 4, columnWidth: "45%" } },
    dataLabels: { enabled: true, formatter: (v) => fmtNum(v) },
    tooltip: { y: { formatter: (v) => fmtNum(v) } },
    grid: { borderColor: "#e5e7eb" }
  });
}

function renderExpenseSplitPlaceholder() {
  return `<div class="monthly-empty" style="height:220px;">
    <i class="fas fa-hourglass-half"></i>
    Expense split isn't defined yet — the underlying calculation needs a few
    decisions from you (which expense categories, over what date range)
    before it can be built.
  </div>`;
}

function renderDashboard(computed) {
  document.getElementById("kpiGrid").innerHTML = renderKpiTiles(computed.tiles);
  document.getElementById("vendorTable").innerHTML = renderVendorTable(computed.vendorTable);
  renderNonMovingStockTrend(computed.nonMoving.trend_data);
  renderPoStatusWeekly(computed.poStatus.weekly_data);
  renderSupplierRatingTrend(computed.supplierRatings);
  document.getElementById("expenseSplit").innerHTML = renderExpenseSplitPlaceholder();

  // Make every number that has a drill-down clickable.
  AK.autoBind(document);
}

function renderError(msg) {
  const container = document.querySelector(".monthly-container");
  if (container) {
    container.innerHTML = `<div class="monthly-empty" style="height:200px;"><i class="fas fa-exclamation-triangle"></i> Failed to load dashboard: ${AK.esc(msg)}</div>`;
  }
}

/* ----------------------------------------------------------------
   6. INIT
   ---------------------------------------------------------------- */
async function initMonthlyStoreDashboard() {
  try {
    const raw = await fetchAllDashboardData();

    const nonMoving = computeNonMovingStockTrend(raw.products, raw.today);
    const poStatus = computePoStatusWeekly(raw.purchaseOrders, raw.today);
    const supplierRatings = computeSupplierRatingTrend(raw.supplierRatings, raw.today);
    const tiles = computeTileSectionData(raw);
    const vendorTable = computeVendorPerformanceTable(raw);

    renderDashboard({ nonMoving, poStatus, supplierRatings, tiles, vendorTable });

    AK.report();
    console.log("%c[storeMonthly] ready — click any count to see the records behind it.",
      "color:#15803d;font-weight:bold");

    // One-time field discovery for every report this dashboard reads — paste the console
    // output back to fix any remaining guessed field name in one pass. Safe to delete once
    // every field in CFG.fields is confirmed against real data.
    AK.discoverAllFields(CFG.reports);
  } catch (err) {
    console.error("Monthly Store Dashboard error:", err);
    renderError(err && err.message ? err.message : "Unknown error");
  }
}

AK.init({ name: "storeMonthly" });

// V2 JS API needs no init() call
initMonthlyStoreDashboard();
