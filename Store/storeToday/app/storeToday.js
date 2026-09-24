"use strict";

/* ================================================================
   STORE — TODAY'S SNAPSHOT — WIDGET VERSION
   ================================================================
   Replaces the `todayStoreWidget` Custom API. Everything is now
   computed here in JS from raw report records, which is what makes
   the drill-downs possible: a Custom API returns only totals, so
   clicking a count could never show the records behind it.

   >>> READ THIS BEFORE GOING LIVE <<<
   The Deluge source of `todayStoreWidget` is not in this repo, so the
   report names, field names and a few business rules below were
   derived from the sibling Store dashboards (storeWeekly, storeMonthly,
   storeYearly) and from the tile labels in widget.html.

   Everything marked  // VERIFY  is an inference. Open the browser
   console: every fetch prints its report, its field list, its row
   count and the field names that actually came back, so each one can
   be confirmed or corrected in minutes. The companion workbook
   "Adroit_Dashboard_Report_Fields.xlsx" lists the same items.
   ================================================================ */

/* ----------------------------------------------------------------
   0. CONFIG
   ---------------------------------------------------------------- */
const CFG = {
  reports: {
    materialRequisition: "All_Material_Requisitions1",              // confirmed (storeWeekly, storeYearly)
    product: "All_Product",                                          // confirmed (all Store dashboards)
    purchaseOrder: "All_Purchase_Orders",                            // confirmed (storeMonthly, storeYearly)
    rejection: "Rejection_Replacement_Register_Format"               // confirmed (storeWeekly)
  },

  fields: {
    materialRequisition: {
      date: "Date_field",                  // confirmed
      addedTime: "Added_Time",             // VERIFY — needed for the hour-by-hour chart
      modifiedTime: "Modified_Time",       // confirmed
      issuedBy: "Issued_by1",              // confirmed
      department: "Department",            // confirmed
      status: "Status",                    // confirmed (storeYearly)
      subform: "Item_Details",             // confirmed
      // inside Item_Details
      qty: "Quantity",                     // confirmed
      returnedQty: "Returned_Item_Qty",    // confirmed
      prevReturnedQty: "Previous_Returned_Qty", // confirmed
      product: "Product_Code"              // VERIFY — the item line's link to Product
    },
    product: {
      name: "Product_Name",                // confirmed
      code: "Product_Code",                // confirmed (storeYearly) — shown as "SKU"
      availableStock: "Available_Stock",   // confirmed
      minStock: "Minimum_Stock_Level",     // confirmed
      price: "Price",                      // confirmed
      isRedTag: "Is_Red_Tag_Material",     // confirmed
      redTagDate: "Red_Tagged_Date",       // confirmed (storeWeekly)
      modifiedTime: "Modified_Time"        // confirmed
    },
    purchaseOrder: {
      date: "PO_Date",                     // confirmed (storeMonthly/storeYearly; note the Date vs PO_Date conflict flagged there)
      addedTime: "Added_Time",             // VERIFY — used for the "Date & Time" column
      status: "Status",                    // confirmed
      poNo: "PO_Number",                   // confirmed via fields.txt — was "PO_No" (wrong), report field is "PO_Number"
      vendorName: "Vendor_Name",           // confirmed
      // VERIFY — the PO amount field. The first of these that exists is used.
      amountCandidates: ["Total_Amount", "Grand_Total", "PO_Amount", "Net_Amount", "Final_Amount", "Total"],
      // "User" is the confirmed real field name (from the Purchase Order form itself, in the Zoho
      // app builder — a lookup to the raising employee). It does NOT currently come back from the
      // All_Purchase_Orders report's field list even with field_config: "all" — the report's own
      // column config excludes it, which is a Zoho-side setting, not something this code can fix.
      // Fix in Zoho: Reports > All_Purchase_Orders > add "User" to the report's visible/exposed
      // fields. The moment that's done, this resolves automatically — no further code change needed.
      // The other candidates are kept as a fallback in case a differently-named field is used instead.
      employeeCandidates: ["User", "Prepared_By", "Raised_By", "Employee_Name", "Added_User", "Created_By"]
    },
    rejection: {
      date: "Date_field",                  // confirmed
      department: "Department",            // confirmed
      defectiveProduct: "Defective_Product", // confirmed
      qty: "Qty",                          // confirmed
      status: "Status"                     // confirmed
    }
  },

  /* Business rules that were NOT recoverable from the repo.
     Each one is applied exactly as written here and logged to the console. */
  rules: {
    // VERIFY — "Items Issued to Service" / "Items Returned from Service":
    // material requisitions whose Department is one of these.
    serviceDepartments: ["Service"],
    // VERIFY — "Production Stops (Material Shortage)": today's requisitions
    // for these departments whose Status is one of shortageStatuses.
    productionDepartments: ["Production"],
    shortageStatuses: ["Shortage", "Material Shortage", "Stock Not Available", "Pending"],
    // PO funnel stages, in order.
    poStages: ["Draft", "Issued", "Received", "Billed", "Closed"]
  },

  maxRecords: 1000,
  maxPages: 10
};

CFG.customFields = {
  materialRequisition: [
    CFG.fields.materialRequisition.date, CFG.fields.materialRequisition.addedTime,
    CFG.fields.materialRequisition.modifiedTime, CFG.fields.materialRequisition.issuedBy,
    CFG.fields.materialRequisition.department, CFG.fields.materialRequisition.status,
    CFG.fields.materialRequisition.subform
  ].join(","),
  product: [
    CFG.fields.product.name, CFG.fields.product.code, CFG.fields.product.availableStock,
    CFG.fields.product.minStock, CFG.fields.product.price, CFG.fields.product.isRedTag,
    CFG.fields.product.redTagDate, CFG.fields.product.modifiedTime
  ].join(","),
  purchaseOrder: [
    CFG.fields.purchaseOrder.date, CFG.fields.purchaseOrder.addedTime,
    CFG.fields.purchaseOrder.status, CFG.fields.purchaseOrder.poNo,
    CFG.fields.purchaseOrder.vendorName
  ].concat(CFG.fields.purchaseOrder.amountCandidates)
    .concat(CFG.fields.purchaseOrder.employeeCandidates).join(","),
  rejection: [
    CFG.fields.rejection.date, CFG.fields.rejection.department,
    CFG.fields.rejection.defectiveProduct, CFG.fields.rejection.qty, CFG.fields.rejection.status
  ].join(",")
};

/* ----------------------------------------------------------------
   1. ZOHO CALL THROTTLE (same pattern as the other Store widgets)
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

const FETCH_FAILURES = {};

/** All pages of one report, with a console diagnostic for the whole fetch. */
async function fetchReport(key, label) {
  const base = {
    report_name: CFG.reports[key],
    field_config: "custom",
    fields: CFG.customFields[key],
    max_records: CFG.maxRecords
  };

  const started = Date.now();
  let all = [];
  let cursor = null;
  let page = 0;
  let failure = null;
  let note = null;

  do {
    const params = cursor ? Object.assign({}, base, { record_cursor: cursor }) : Object.assign({}, base);
    let res;
    try {
      res = await ZQ.getRecords(params);
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

const TODAY = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();

function isToday(v) {
  const d = AK.parseDate(v);
  return !!d && d.getFullYear() === TODAY.getFullYear() && d.getMonth() === TODAY.getMonth() && d.getDate() === TODAY.getDate();
}
function hourOf(v) {
  const d = AK.parseDate(v);
  return d ? d.getHours() : null;
}
function rows(v) { return Array.isArray(v) ? v : []; }
function isTrue(v) { return v === true || String(v).toLowerCase() === "true"; }

/** First of several candidate field names that the record actually carries. */
function pickField(record, candidates) {
  for (const name of candidates) {
    if (record && record[name] !== undefined && record[name] !== null && record[name] !== "") return record[name];
  }
  return "";
}
/** Which of the candidate names is present across the dataset (for the console note). */
function resolveField(list, candidates) {
  for (const name of candidates) {
    if (list.some((r) => r && r[name] !== undefined)) return name;
  }
  return null;
}

/* ----------------------------------------------------------------
   3. STATE + DRILL-DOWN COLUMNS
   ---------------------------------------------------------------- */
const D = {};
const SRC = {};

const COLS = {
  matReq: [
    { label: "Date", value: CFG.fields.materialRequisition.date, format: "date" },
    { label: "Department", value: CFG.fields.materialRequisition.department },
    { label: "Issued By", value: CFG.fields.materialRequisition.issuedBy },
    { label: "Status", value: CFG.fields.materialRequisition.status },
    {
      label: "Item lines", format: "int",
      value: (r) => rows(r[CFG.fields.materialRequisition.subform]).length
    },
    {
      label: "Qty issued", format: "dec",
      value: (r) => rows(r[CFG.fields.materialRequisition.subform])
        .reduce((s, l) => s + num(l[CFG.fields.materialRequisition.qty]), 0)
    },
    {
      label: "Qty returned", format: "dec",
      value: (r) => rows(r[CFG.fields.materialRequisition.subform])
        .reduce((s, l) => s + num(l[CFG.fields.materialRequisition.returnedQty]), 0)
    }
  ],
  product: [
    { label: "SKU", value: CFG.fields.product.code },
    { label: "Product", value: CFG.fields.product.name },
    { label: "Available Stock", value: CFG.fields.product.availableStock, format: "dec" },
    { label: "Minimum Stock", value: CFG.fields.product.minStock, format: "dec" },
    { label: "Price", value: CFG.fields.product.price, format: "money" },
    { label: "Red Tagged", value: CFG.fields.product.redTagDate, format: "date" }
  ],
  purchaseOrder: [
    { label: "PO Number", value: (r) => pickField(r, [CFG.fields.purchaseOrder.poNo]) },
    { label: "PO Date", value: CFG.fields.purchaseOrder.date, format: "date" },
    { label: "Vendor", value: CFG.fields.purchaseOrder.vendorName },
    { label: "Raised By", value: (r) => pickField(r, CFG.fields.purchaseOrder.employeeCandidates) },
    { label: "Status", value: CFG.fields.purchaseOrder.status },
    {
      label: "Amount", format: "money",
      value: (r) => num(pickField(r, CFG.fields.purchaseOrder.amountCandidates))
    }
  ],
  rejection: [
    { label: "Date", value: CFG.fields.rejection.date, format: "date" },
    { label: "Department", value: CFG.fields.rejection.department },
    { label: "Defective Product", value: CFG.fields.rejection.defectiveProduct },
    { label: "Qty", value: CFG.fields.rejection.qty, format: "dec" },
    { label: "Status", value: CFG.fields.rejection.status }
  ]
};

function drill(key, title, report, columns, srcKey, subtitle, empty) {
  AK.defineDrill(key, {
    title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
    rows: () => SRC[srcKey] || []
  });
}

/* ----------------------------------------------------------------
   4. CALCULATIONS
   ---------------------------------------------------------------- */
const F = CFG.fields;

function todayRequisitions() {
  return D.materialRequisition.filter((r) => isToday(r[F.materialRequisition.date]));
}

function inDept(r, list) {
  const dept = text(r[F.materialRequisition.department]).trim().toLowerCase();
  return list.some((d) => d.trim().toLowerCase() === dept);
}

function computeTiles() {
  const todays = todayRequisitions();

  const serviceIssued = todays.filter((r) => inDept(r, CFG.rules.serviceDepartments));
  const serviceReturned = serviceIssued.filter((r) =>
    rows(r[F.materialRequisition.subform]).some((l) => num(l[F.materialRequisition.returnedQty]) > 0));

  const productionStops = todays.filter((r) =>
    inDept(r, CFG.rules.productionDepartments) &&
    CFG.rules.shortageStatuses.some((s) => s.toLowerCase() === text(r[F.materialRequisition.status]).trim().toLowerCase()));

  const rejected = D.rejection.filter((r) => isToday(r[F.rejection.date]));

  const lowStock = D.product.filter((p) => {
    const avail = num(p[F.product.availableStock]);
    const min = num(p[F.product.minStock]);
    return min > 0 && avail < min;
  });

  const redTag = D.product.filter((p) =>
    isTrue(p[F.product.isRedTag]) && isToday(p[F.product.redTagDate]));

  const posToday = D.purchaseOrder.filter((p) => isToday(p[F.purchaseOrder.date]));
  const byStatus = (name) => posToday.filter((p) =>
    text(p[F.purchaseOrder.status]).trim().toLowerCase() === name.toLowerCase());
  const poBilled = byStatus("Billed");
  const poReceived = byStatus("Received");
  const amountOf = (p) => num(pickField(p, F.purchaseOrder.amountCandidates));
  const sumAmt = (list) => list.reduce((s, p) => s + amountOf(p), 0);

  return {
    materialTransactions: todays,
    productionStops: productionStops,
    serviceIssued: serviceIssued,
    serviceReturned: serviceReturned,
    rejected: rejected,
    lowStock: lowStock,
    redTag: redTag,
    poTotal: posToday,
    poBilled: poBilled,
    poReceived: poReceived,
    poTotalAmount: sumAmt(posToday),
    poBilledAmount: sumAmt(poBilled),
    poReceivedAmount: sumAmt(poReceived)
  };
}

/** PO funnel: every PO raised today, grouped by stage. */
function computeFunnel(t) {
  const out = {};
  CFG.rules.poStages.forEach((stage) => {
    out[stage] = t.poTotal.filter((p) =>
      text(p[F.purchaseOrder.status]).trim().toLowerCase() === stage.toLowerCase());
  });
  return out;
}

/**
 * Hour-by-hour chart. Material flow = requisitions created in that hour;
 * production stops = shortage requisitions created in that hour. Both are
 * expressed as a percentage of the busiest hour, which is what the SVG expects.
 */
function computeHourly(t) {
  const flow = new Array(24).fill(0).map(() => []);
  const stops = new Array(24).fill(0).map(() => []);

  t.materialTransactions.forEach((r) => {
    const h = hourOf(r[F.materialRequisition.addedTime]) ?? hourOf(r[F.materialRequisition.modifiedTime]);
    if (h !== null && h >= 0 && h < 24) flow[h].push(r);
  });
  t.productionStops.forEach((r) => {
    const h = hourOf(r[F.materialRequisition.addedTime]) ?? hourOf(r[F.materialRequisition.modifiedTime]);
    if (h !== null && h >= 0 && h < 24) stops[h].push(r);
  });

  const peak = Math.max(1, ...flow.map((x) => x.length), ...stops.map((x) => x.length));
  return {
    flow: flow,
    stops: stops,
    flowPct: flow.map((x) => (x.length * 100) / peak),
    stopsPct: stops.map((x) => (x.length * 100) / peak),
    peak: peak
  };
}

/** Service flow, technician-wise: issued vs returned quantity per "Issued by". */
function computeTechnicians(t) {
  const map = new Map();
  t.serviceIssued.forEach((r) => {
    const who = text(r[F.materialRequisition.issuedBy]) || "(not set)";
    if (!map.has(who)) map.set(who, { technician: who, issued: 0, returned: 0, records: [] });
    const entry = map.get(who);
    rows(r[F.materialRequisition.subform]).forEach((l) => {
      entry.issued += num(l[F.materialRequisition.qty]);
      entry.returned += num(l[F.materialRequisition.returnedQty]);
    });
    entry.records.push(r);
  });

  const list = Array.from(map.values()).sort((a, b) => b.issued - a.issued);
  const peak = Math.max(1, ...list.map((x) => Math.max(x.issued, x.returned)));
  list.forEach((x) => {
    x.issued_height = Math.round((x.issued / peak) * 150) || (x.issued > 0 ? 6 : 0);
    x.returned_height = Math.round((x.returned / peak) * 150) || (x.returned > 0 ? 6 : 0);
  });
  return list;
}

/* ----------------------------------------------------------------
   5. RENDER
   ---------------------------------------------------------------- */

function renderTiles(t) {
  SRC.materialTransactions = t.materialTransactions;
  SRC.productionStops = t.productionStops;
  SRC.serviceIssued = t.serviceIssued;
  SRC.serviceReturned = t.serviceReturned;
  SRC.rejected = t.rejected;
  SRC.lowStock = t.lowStock;
  SRC.redTag = t.redTag;
  SRC.poTotal = t.poTotal;
  SRC.poBilled = t.poBilled;
  SRC.poReceived = t.poReceived;

  const day = AK.date(TODAY);
  const MR = CFG.reports.materialRequisition;

  drill("tile.material", "Material Transactions Today", MR, COLS.matReq, "materialTransactions",
    "Material Requisitions dated " + day);
  drill("tile.stops", "Production Stops (Material Shortage)", MR, COLS.matReq, "productionStops",
    "Requisitions dated " + day + " for " + CFG.rules.productionDepartments.join("/") +
    " with Status in: " + CFG.rules.shortageStatuses.join(", "),
    "No production stop was recorded today. Note: the shortage statuses used here are an inference — " +
    "see CFG.rules.shortageStatuses in storeToday.js.");
  drill("tile.issued", "Items Issued to Service", MR, COLS.matReq, "serviceIssued",
    "Requisitions dated " + day + " for department " + CFG.rules.serviceDepartments.join("/"));
  drill("tile.returned", "Items Returned from Service", MR, COLS.matReq, "serviceReturned",
    "Of those, requisitions with a Returned_Item_Qty greater than zero");
  drill("tile.rejected", "Rejected Items Received", CFG.reports.rejection, COLS.rejection, "rejected",
    "Rejection & Replacement entries dated " + day);
  drill("tile.lowStock", "Low Stock Alerts", CFG.reports.product, COLS.product, "lowStock",
    "Products where Available_Stock is below Minimum_Stock_Level",
    "Every product is at or above its minimum stock level.");
  drill("tile.redTag", "Red Tag Materials Added", CFG.reports.product, COLS.product, "redTag",
    "Products flagged Is_Red_Tag_Material with Red_Tagged_Date = " + day);
  drill("tile.poTotal", "Purchase Orders — Total", CFG.reports.purchaseOrder, COLS.purchaseOrder, "poTotal",
    "Purchase Orders with PO_Date = " + day);
  drill("tile.poBilled", "Purchase Orders — Billed", CFG.reports.purchaseOrder, COLS.purchaseOrder, "poBilled",
    "Today's Purchase Orders with Status = Billed");
  drill("tile.poReceived", "Purchase Orders — Received", CFG.reports.purchaseOrder, COLS.purchaseOrder, "poReceived",
    "Today's Purchase Orders with Status = Received");

  const tile = (title, value, key, sub, btn) =>
    '<article class="tile"><div class="title">' + esc(title) + "</div>" +
    '<div class="value" data-drill="' + key + '">' + esc(value) + "</div>" +
    (sub ? '<div class="sub-value" data-drill="' + key + '">' + esc(sub) + "</div>" : "") +
    (btn ? '<label for="' + btn + '" class="btn">View Report</label>' : "") +
    "</article>";

  document.getElementById("tilesContainer").innerHTML =
    tile("Total Material Transactions Today", cnt(t.materialTransactions.length), "tile.material") +
    tile("Production Stops (Material Shortage)", cnt(t.productionStops.length), "tile.stops") +
    tile("Items Issued to Service", cnt(t.serviceIssued.length), "tile.issued") +
    tile("Items Returned from Service", cnt(t.serviceReturned.length), "tile.returned") +
    tile("Rejected Items Received", cnt(t.rejected.length), "tile.rejected") +
    tile("Low Stock Alerts (SKU below min)", cnt(t.lowStock.length), "tile.lowStock", null, "lowstock-toggle") +
    tile("Red Tag Materials Added", cnt(t.redTag.length), "tile.redTag") +
    tile("Purchase Orders – Total", cnt(t.poTotal.length), "tile.poTotal", rupees(t.poTotalAmount), "po-toggle") +
    tile("Purchase Orders – Billed", cnt(t.poBilled.length), "tile.poBilled", rupees(t.poBilledAmount), "po-toggle2") +
    tile("Purchase Orders – Received", cnt(t.poReceived.length), "tile.poReceived", rupees(t.poReceivedAmount), "po-toggle3");

  AK.autoBind(document.getElementById("tilesContainer"));
}

function renderSidePanels(t) {
  const lowStockBody = document.getElementById("lowStockTableBody");
  if (lowStockBody) {
    lowStockBody.innerHTML = t.lowStock.length
      ? t.lowStock.map((p) =>
        "<tr><td>" + esc(text(p[F.product.code])) + "</td><td>" + esc(text(p[F.product.name])) + "</td>" +
        "<td>" + AK.dec(p[F.product.availableStock]) + "</td>" +
        "<td>" + AK.dec(p[F.product.minStock]) + "</td></tr>").join("")
      : AK.emptyRow(4, "No low stock alerts — every product is at or above its minimum level.");
  }

  const poRows = (list) => list.length
    ? list.map((p) =>
      "<tr><td>" + esc(text(pickField(p, [F.purchaseOrder.poNo]))) + "</td>" +
      "<td>" + esc(text(pickField(p, F.purchaseOrder.employeeCandidates))) + "</td>" +
      "<td>" + esc(AK.date(pickField(p, [F.purchaseOrder.addedTime, F.purchaseOrder.date]))) + "</td></tr>").join("")
    : AK.emptyRow(3, "No records found for today.");

  const set = (id, list) => { const el = document.getElementById(id); if (el) el.innerHTML = poRows(list); };
  set("poTotalTableBody", t.poTotal);
  set("poBilledTableBody", t.poBilled);
  set("poReceivedTableBody", t.poReceived);
}

/** Hour-by-hour line chart. Plots raw counts (not %-of-peak) so a small
 *  number of stops is never visually flattened against a busier flow hour. */
function renderChart(hourly) {
  for (let idx = 0; idx < 24; idx++) {
    SRC["hour.flow." + idx] = hourly.flow[idx];
    SRC["hour.stop." + idx] = hourly.stops[idx];
    drill("hour.flow." + idx, "Material Flow — " + idx + ":00", CFG.reports.materialRequisition,
      COLS.matReq, "hour.flow." + idx, "Requisitions created between " + idx + ":00 and " + (idx + 1) + ":00 today");
    drill("hour.stop." + idx, "Production Stops — " + idx + ":00", CFG.reports.materialRequisition,
      COLS.matReq, "hour.stop." + idx, "Shortage requisitions created between " + idx + ":00 and " + (idx + 1) + ":00 today");
  }

  AK.mountChart("hourly-flow-chart", {
    chart: {
      type: "line", height: 340, fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: {
        dataPointSelection: (ev, ctx, opts) =>
          AK.openDrill((opts.seriesIndex === 0 ? "hour.flow." : "hour.stop.") + opts.dataPointIndex),
        markerClick: (ev, ctx, opts) =>
          AK.openDrill((opts.seriesIndex === 0 ? "hour.flow." : "hour.stop.") + opts.dataPointIndex)
      }
    },
    series: [
      { name: "Material Flow", data: hourly.flow.map((x) => x.length) },
      { name: "Production Stops", data: hourly.stops.map((x) => x.length) }
    ],
    xaxis: { categories: Array.from({ length: 24 }, (_, i) => i + "h") },
    colors: AK.categoricalColors(2),
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 5, hover: { size: 7 } },
    dataLabels: { enabled: false },
    legend: { position: "top" },
    grid: { borderColor: "#e5e7eb" },
    tooltip: { y: { formatter: (v) => AK.int(v) + " record(s)" } }
  });
}

function renderFunnel(funnel) {
  const stages = CFG.rules.poStages;
  const funnelStages = stages.map((stage) => {
    const list = funnel[stage] || [];
    const key = "funnel." + stage;
    SRC[key] = list;
    drill(key, "Purchase Orders — " + stage, CFG.reports.purchaseOrder, COLS.purchaseOrder, key,
      "Today's Purchase Orders with Status = " + stage);
    return { label: stage, value: list.length, drillKey: key };
  });

  AK.mountFunnel("po-funnel-chart", funnelStages);
}

function renderTechnicians(list) {
  const container = document.getElementById("tech-flow-chart");
  if (!container) return;

  if (!list.length) {
    container.innerHTML = AK.emptyPanel(
      "No material was issued to " + CFG.rules.serviceDepartments.join("/") + " today.", 200);
    return;
  }

  list.forEach((tech, i) => {
    SRC["tech." + i] = tech.records;
    drill("tech." + i, "Service Flow — " + tech.technician, CFG.reports.materialRequisition,
      COLS.matReq, "tech." + i, "Today's service requisitions issued by " + tech.technician);
  });

  AK.mountChart("tech-flow-chart", {
    chart: {
      type: "bar", height: Math.max(220, list.length * 70), fontFamily: "Poppins, sans-serif", toolbar: { show: false },
      events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill("tech." + opts.dataPointIndex) }
    },
    series: [
      { name: "Issued", data: list.map((t) => t.issued) },
      { name: "Returned", data: list.map((t) => t.returned) }
    ],
    xaxis: { categories: list.map((t) => t.technician) },
    colors: AK.categoricalColors(2),
    plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "60%" } },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => AK.dec(v) } },
    grid: { borderColor: "#e5e7eb" }
  });
}

/* ----------------------------------------------------------------
   6. MAIN
   ---------------------------------------------------------------- */
async function main() {
  AK.init({ name: "storeToday" });

  const loadingEl = document.getElementById("loading-text");

  // v2 JS API needs no ZOHO.CREATOR.init() call.

  try {
    const [matReq, product, purchaseOrder, rejection] = await Promise.all([
      fetchReport("materialRequisition", "Material Requisition"),
      fetchReport("product", "Product"),
      fetchReport("purchaseOrder", "Purchase Order"),
      fetchReport("rejection", "Rejection & Replacement")
    ]);
    D.materialRequisition = matReq;
    D.product = product;
    D.purchaseOrder = purchaseOrder;
    D.rejection = rejection;

    // Tell the user which of the guessed PO field names actually exist.
    console.groupCollapsed("%c[storeToday] inferred field resolution — confirm these",
      "color:#b45309;font-weight:bold");
    console.log("PO amount field   :", resolveField(purchaseOrder, F.purchaseOrder.amountCandidates) ||
      "NONE of " + F.purchaseOrder.amountCandidates.join(", ") + " — PO amounts will show as " + rupees(0));
    console.log("PO employee field :", resolveField(purchaseOrder, F.purchaseOrder.employeeCandidates) ||
      "NONE of " + F.purchaseOrder.employeeCandidates.join(", ") + " — the Employee column will be blank. " +
      "The real field is \"User\" on the Purchase Order form; add it to Reports > All_Purchase_Orders' " +
      "visible fields in the Zoho app builder to fix this (a report config change, not a code issue).");
    console.log("PO number field   :", resolveField(purchaseOrder, [F.purchaseOrder.poNo]) ||
      "'" + F.purchaseOrder.poNo + "' not returned — the PO Number column will be blank");
    console.log("MR hour source    :", resolveField(matReq, [F.materialRequisition.addedTime, F.materialRequisition.modifiedTime]) ||
      "neither Added_Time nor Modified_Time — the hourly chart will be flat");
    console.log("Distinct MR departments:", [...new Set(matReq.map((r) => text(r[F.materialRequisition.department])))]);
    console.log("Distinct MR statuses   :", [...new Set(matReq.map((r) => text(r[F.materialRequisition.status])))]);
    console.log("Distinct PO statuses   :", [...new Set(purchaseOrder.map((r) => text(r[F.purchaseOrder.status])))]);
    console.groupEnd();

    const t = computeTiles();
    renderTiles(t);
    renderSidePanels(t);
    renderChart(computeHourly(t));
    renderFunnel(computeFunnel(t));
    renderTechnicians(computeTechnicians(t));

    if (loadingEl) {
      const failed = Object.keys(FETCH_FAILURES);
      loadingEl.innerHTML = failed.length
        ? '<span style="color:#b91c1c">(' + failed.length + " report(s) failed to load — see console)</span>"
        : "";
    }

    AK.report();
    console.log("%c[storeToday] ready — click any count to see the records behind it.",
      "color:#15803d;font-weight:bold");

    // One-time field discovery for every report this dashboard reads — paste the console
    // output back to fix any remaining guessed field name in one pass. Safe to delete once
    // every field in CFG.fields is confirmed against real data.
    AK.discoverAllFields(CFG.reports);
  } catch (err) {
    console.error("[storeToday] fatal:", err);
    if (loadingEl) loadingEl.innerText = "(Failed to load data — see console)";
  }
}

document.addEventListener("DOMContentLoaded", main);
