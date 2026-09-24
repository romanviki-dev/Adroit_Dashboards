"use strict";

/* ================================================================
   ADROIT WIDGET KIT  —  shared runtime for every adroit dashboard
   ================================================================
   Drop this file into a dashboard's app/ folder and load it BEFORE
   the dashboard script:

     <script src="adroitWidgetKit.js"></script>
     <script src="yourDashboard.js"></script>

   It provides three things every dashboard needs:

   1. NUMBER FORMATTING      AK.int(10000) -> "10,000"   (Indian grouping)
   2. DRILL-DOWN MODAL       click a count -> table of the actual records,
                             or a clear "No records found" panel
   3. FETCH DIAGNOSTICS      one console line per report fetch, plus
                             AK.report() / copy(AK.reportText()) to paste
                             the whole picture back for debugging

   This file has no dependencies and never throws into the host page.
   ================================================================ */

window.AdroitKit = (function () {

  /* ==============================================================
     0. SETUP
     ============================================================== */

  var DASHBOARD = "dashboard";          // set via AK.init({ name: ... })
  var LOCALE = "en-IN";
  var CURRENCY = "₹";              // rupee sign

  var fetchLog = [];                    // every report fetch, in order
  var drills = {};                      // key -> drill definition
  var fieldLog = [];                    // every discoverFields() result, in order
  var lastReportsMap = null;            // last map passed to discoverAllFields(), for the "Rescan" button

  /* ==============================================================
     1. VALUE HELPERS
     ============================================================== */

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function isNil(v) {
    return v === null || v === undefined || v === "";
  }

  /** Numeric value of anything Creator hands back ("1,234.50", 12, null...). */
  function num(v, fallback) {
    if (v === null || v === undefined || v === "") return fallback === undefined ? 0 : fallback;
    if (typeof v === "number") return isFinite(v) ? v : (fallback === undefined ? 0 : fallback);
    var n = parseFloat(String(v).replace(/,/g, "").trim());
    return isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
  }

  /**
   * Readable text for any Creator field value.
   * Lookups arrive as { ID, display_value } or { ID, zc_display_value },
   * name fields as { first_name, last_name }, multi-selects as arrays.
   */
  function text(v) {
    if (v === null || v === undefined) return "";
    if (Array.isArray(v)) return v.map(text).filter(Boolean).join(", ");
    if (typeof v === "object") {
      if (!isNil(v.display_value)) return String(v.display_value);
      if (!isNil(v.zc_display_value)) return String(v.zc_display_value);
      if (!isNil(v.first_name) || !isNil(v.last_name)) {
        return [v.prefix, v.first_name, v.last_name, v.suffix].filter(Boolean).join(" ").trim();
      }
      if (!isNil(v.name)) return String(v.name);
      if (!isNil(v.email)) return String(v.email);
      if (!isNil(v.ID)) return String(v.ID);
      return "";
    }
    return String(v);
  }

  /** Record ID of a lookup, always as a string (19-digit IDs lose precision as Numbers). */
  function id(v) {
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "object") {
      var raw = v.ID !== undefined ? v.ID : v.id;
      return raw === undefined || raw === null ? "" : String(raw).trim();
    }
    return String(v).trim();
  }

  /* ==============================================================
     2. NUMBER FORMATTING
     The whole point: 10000 renders as "10,000", never "10000".
     ============================================================== */

  /** Whole number with thousands separators: 10000 -> "10,000" */
  function int(v) {
    var n = num(v);
    return Math.round(n).toLocaleString(LOCALE, { maximumFractionDigits: 0 });
  }

  /** Number with separators, trimming pointless decimals: 10000.5 -> "10,000.5" */
  function dec(v, places) {
    var n = num(v);
    var d = places === undefined ? 2 : places;
    return n.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: d });
  }

  /** Money: 10000 -> "₹ 10,000.00" */
  function money(v, places) {
    var n = num(v);
    var d = places === undefined ? 2 : places;
    return CURRENCY + " " + n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /** Money without paise, for tiles: 10000 -> "₹ 10,000" */
  function money0(v) {
    return CURRENCY + " " + Math.round(num(v)).toLocaleString(LOCALE, { maximumFractionDigits: 0 });
  }

  /** Percentage: 12.345 -> "12.3%" */
  function pct(v, places) {
    var d = places === undefined ? 1 : places;
    return dec(num(v), d) + "%";
  }

  /** Short form for cramped axes: 1250000 -> "12.5L", 10000 -> "10.0K" */
  function compact(v) {
    var n = num(v);
    var sign = n < 0 ? "-" : "";
    var a = Math.abs(n);
    if (a >= 10000000) return sign + (a / 10000000).toFixed(1) + "Cr";
    if (a >= 100000) return sign + (a / 100000).toFixed(1) + "L";
    if (a >= 1000) return sign + (a / 1000).toFixed(1) + "K";
    return sign + dec(a, 0);
  }

  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /** Date -> "22-Sep-2026". Accepts a Date, a Creator date string, or null. */
  function date(v) {
    var d = v instanceof Date ? v : parseDate(v);
    if (!d) return "";
    return String(d.getDate()).padStart(2, "0") + "-" + MON[d.getMonth()] + "-" + d.getFullYear();
  }

  /**
   * Creator hands dates back as text in the app's format. Parsed explicitly
   * because new Date(string) is implementation-defined for these shapes.
   * Handles dd-MMM-yyyy, dd-MM-yyyy, dd/MM/yyyy and yyyy-MM-dd, with or
   * without a trailing time.
   */
  function parseDate(v) {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

    var s = String(v).trim();
    var time = "(?:[ T,]+(\\d{1,2}):(\\d{2})(?::(\\d{2}))?)?";
    var m, y, mo, d;

    if ((m = s.match(new RegExp("^(\\d{4})[-/.](\\d{1,2})[-/.](\\d{1,2})" + time)))) {
      y = +m[1]; mo = +m[2] - 1; d = +m[3];
    } else if ((m = s.match(new RegExp("^(\\d{1,2})[-/. ]([A-Za-z]{3,9})[-/. ,]+(\\d{2,4})" + time)))) {
      mo = MON.findIndex(function (n) { return n.toLowerCase() === m[2].slice(0, 3).toLowerCase(); });
      if (mo < 0) return null;
      d = +m[1]; y = +m[3];
    } else if ((m = s.match(new RegExp("^(\\d{1,2})[-/.](\\d{1,2})[-/.](\\d{2,4})" + time)))) {
      d = +m[1]; mo = +m[2] - 1; y = +m[3];
    } else {
      return null;
    }

    if (y < 100) y += 2000;
    if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
    return new Date(y, mo, d, +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  }

  /* ==============================================================
     3. FETCH DIAGNOSTICS
     Every report fetch logs one line. Paste AK.reportText() when a
     number looks wrong and the whole data-load picture comes with it.
     ============================================================== */

  /**
   * Record one report fetch.
   * @param {object} e
   *   label   friendly name shown on screen ("Service Call Log")
   *   report  the Creator report link name actually requested
   *   params  the params object passed to getRecords (fields, criteria...)
   *   rows    the records that came back
   *   ms      elapsed milliseconds
   *   error   error object/string, if the fetch failed
   *   note    anything worth knowing ("criteria rejected, refetched unfiltered")
   */
  function logFetch(e) {
    var rows = e.rows || [];
    var requested = (e.params && e.params.fields) ? String(e.params.fields).split(",").map(function (s) { return s.trim(); }).filter(Boolean) : [];
    var returned = rows.length ? Object.keys(rows[0] || {}) : [];
    // A requested field is "missing" if the report never returned it on any
    // row — some fields are legitimately blank on record 1 but present on
    // others, so check every row's keys, not just the first.
    var returnedAnywhere = {};
    if (requested.length && rows.length) {
      rows.forEach(function (r) { Object.keys(r || {}).forEach(function (k) { returnedAnywhere[k] = true; }); });
    }
    var missing = requested.length && rows.length
      ? requested.filter(function (f) { return !returnedAnywhere[f]; })
      : [];

    var entry = {
      dashboard: DASHBOARD,
      label: e.label || e.report || "(unnamed)",
      report: e.report || "",
      count: rows.length,
      ms: e.ms === undefined ? null : Math.round(e.ms),
      criteria: (e.params && e.params.criteria) || null,
      fields: (e.params && e.params.fields) || (e.params && e.params.field_config) || null,
      missingFields: missing,
      error: e.error ? describeError(e.error) : null,
      note: e.note || null,
      at: new Date().toISOString()
    };
    fetchLog.push(entry);

    var tag = entry.error ? "FAILED" : rows.length ? "ok" : "EMPTY";
    var colour = entry.error ? "color:#b91c1c;font-weight:bold"
      : missing.length ? "color:#b45309;font-weight:bold"
        : rows.length ? "color:#15803d"
          : "color:#b45309;font-weight:bold";

    console.groupCollapsed(
      "%c[" + DASHBOARD + "] " + entry.label + " -> " + entry.count + " records (" + tag +
      (missing.length ? ", " + missing.length + " FIELD" + (missing.length > 1 ? "S" : "") + " MISSING" : "") + ")",
      colour
    );
    console.log("report   :", entry.report);
    if (entry.fields) console.log("fields   :", entry.fields);
    if (entry.criteria) console.log("criteria :", entry.criteria);
    console.log("count    :", entry.count, entry.ms !== null ? "in " + entry.ms + " ms" : "");
    if (entry.note) console.log("note     :", entry.note);
    if (entry.error) console.log("%cerror    : " + entry.error, "color:#b91c1c");
    if (rows.length) {
      console.log("first record (field names you can use):", rows[0]);
      console.log("fields returned:", returned.join(", "));
      if (missing.length) {
        console.log("%cMISSING (requested but never returned): " + missing.join(", "),
          "color:#b91c1c;font-weight:bold");
        console.log("%cThese link names are wrong, or the fields don't exist on " + entry.report +
          ". Run AK.discoverFields('" + entry.report + "') to see every real field this report has.",
          "color:#b45309");
      }
    } else if (!entry.error) {
      console.log("%cNo records matched. If you expected rows, check: report link name, " +
        "the report's filter, the criteria above, and that the fields exist on the report.",
        "color:#b45309");
    }
    console.groupEnd();

    return rows;
  }

  /**
   * Ad-hoc diagnostic, callable directly from the console for ANY report on
   * ANY dashboard: AK.discoverFields("Sales_Order_Entry_SRS_Report")
   * Fetches a page of real records with field_config: "all" (bypassing
   * whatever field list the dashboard normally requests) and prints every
   * field name the report actually has. Use this whenever a requested
   * field comes back missing, instead of guessing a replacement name.
   * max_records must be one of Creator's fixed page sizes — 200, 500 or
   * 1000 — anything else is rejected with code 9250.
   */
  function discoverFields(reportName, label) {
    if (!window.ZOHO || !window.ZOHO.CREATOR || !window.ZOHO.CREATOR.DATA ||
      typeof window.ZOHO.CREATOR.DATA.getRecords !== "function") {
      console.warn("[" + DASHBOARD + "] discoverFields: Zoho Creator SDK is not available yet.");
      return Promise.resolve([]);
    }
    return window.ZOHO.CREATOR.DATA.getRecords({ report_name: reportName, field_config: "all", max_records: 1000 })
      .then(function (res) {
        var rows = (res && res.data) || [];
        var fields = [];
        var sample = null;

        console.groupCollapsed("%c[" + DASHBOARD + "] discoverFields(" + reportName + ") -> " +
          rows.length + " sample record(s)", "color:#2563eb;font-weight:bold");
        if (!rows.length) {
          console.log("%cNo records at all on this report — can't discover fields from an empty report. " +
            "Check the report link name, or add a test record.", "color:#b45309");
        } else {
          // Union keys across every row, not just the first — a field that's
          // blank on record 1 can still be present (and non-empty) on record 50.
          var seen = {};
          rows.forEach(function (r) { Object.keys(r || {}).forEach(function (k) { seen[k] = true; }); });
          fields = Object.keys(seen);
          sample = rows[0];
          console.log((label || reportName) + " has " + fields.length + " field(s), seen across " +
            rows.length + " record(s):");
          console.log(fields.join(", "));
          console.log("First sample record:", sample);
        }
        console.groupEnd();

        // Recorded here (not just printed) so AK.fieldsText() can hand back
        // every field name AND every sample value as plain text in one go —
        // no expanding "▶ Object" previews in the console by hand.
        recordFieldLog({ dashboard: DASHBOARD, label: label || reportName, report: reportName, count: rows.length, fields: fields, sample: sample });

        return fields;
      })
      .catch(function (err) {
        console.error("[" + DASHBOARD + "] discoverFields(" + reportName + ") failed:", err);
        recordFieldLog({ dashboard: DASHBOARD, label: label || reportName, report: reportName, count: 0, fields: [], sample: null, error: describeError(err) });
        return [];
      });
  }

  /** Replace-by-report (not push) so re-running discoverFields/Rescan doesn't duplicate entries. */
  function recordFieldLog(entry) {
    var idx = -1;
    for (var i = 0; i < fieldLog.length; i++) { if (fieldLog[i].report === entry.report) { idx = i; break; } }
    if (idx >= 0) fieldLog[idx] = entry; else fieldLog.push(entry);
  }

  /**
   * Runs discoverFields() for EVERY report a dashboard uses, one after
   * another, so a single console paste reveals the real field list for
   * every report at once instead of one at a time.
   *
   * @param {object} reportsMap  the dashboard's own CFG.reports (or
   *   equivalent) object: { key: "Report_Link_Name", ... }. Any plain
   *   object of string values works.
   *
   * Call this once, after the dashboard's normal load/render, e.g.:
   *   AK.discoverAllFields(CFG.reports);
   * It fetches each report a SECOND time (bounded to 1000 records, no
   * pagination) purely for this diagnostic — safe to delete once every
   * field in CFG has been confirmed against real data.
   */
  function discoverAllFields(reportsMap) {
    lastReportsMap = reportsMap;
    var keys = Object.keys(reportsMap || {});
    if (!keys.length) return Promise.resolve();
    console.log("%c[" + DASHBOARD + "] discovering real fields for " + keys.length +
      " report(s) — paste this whole block back to fix every guessed field name in one pass.",
      "color:#2563eb;font-weight:bold");
    var chain = Promise.resolve();
    keys.forEach(function (k) {
      chain = chain.then(function () { return discoverFields(reportsMap[k], k + " -> " + reportsMap[k]); });
    });
    return chain.then(function () {
      console.log("%c[" + DASHBOARD + "] field discovery complete for all " + keys.length + " report(s).",
        "color:#15803d;font-weight:bold");
    });
  }

  /**
   * Plain-text dump of every discoverFields() result so far — field lists
   * AND sample records, fully spelled out as text. Nothing left to expand:
   *   copy(AK.fieldsText())
   * pastes the whole thing straight to the clipboard, ready to hand back.
   */
  function fieldsText() {
    if (!fieldLog.length) {
      return "(no discoverFields() calls have completed yet — wait for the dashboard to finish loading, " +
        "or run AK.discoverAllFields(CFG.reports) / AK.discoverFields(\"Report_Name\") first)";
    }
    return fieldLog.map(function (f) {
      var lines = [
        "=== " + f.label + " (" + f.report + ") ===",
        f.error ? "ERROR: " + f.error : f.count + " record(s) sampled, " + f.fields.length + " field(s):"
      ];
      if (!f.error) {
        lines.push(f.fields.join(", "));
        if (f.sample) {
          lines.push("");
          lines.push("Sample record:");
          try { lines.push(JSON.stringify(f.sample, null, 2)); }
          catch (e) { lines.push(String(f.sample)); }
        }
      }
      return lines.join("\n");
    }).join("\n\n");
  }

  function describeError(err) {
    if (!err) return "unknown error";
    if (typeof err === "string") return err;
    var body = err.responseText;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (x) { /* keep text */ } }
    var msg = (body && (body.message || body.description)) || err.message ||
      (typeof body === "string" ? body : "");
    var code = err.code !== undefined ? err.code : (body && body.code);
    return [code !== undefined && code !== null ? "code " + code : "", msg]
      .filter(Boolean).join(": ") || "unknown error";
  }

  /** Creator answers HTTP 400 / code 9280 / 9220 / 3100 for "nothing matched". Not a real error. */
  function isNoRecords(err) {
    if (!err) return false;
    var code = err.code;
    if (code === undefined && typeof err.responseText === "string") {
      try { code = JSON.parse(err.responseText).code; } catch (x) { code = undefined; }
    }
    if (code === 9280 || code === 3100 || code === 9220) return true;
    try {
      return /\b(9280|3100|9220)\b|no records (found|exist)/i.test(
        typeof err === "string" ? err : JSON.stringify(err)
      );
    } catch (x) { return false; }
  }

  /** console.table of every fetch this session. */
  function report() {
    console.log("%c[" + DASHBOARD + "] data load summary", "font-weight:bold;font-size:13px");
    console.table(fetchLog.map(function (f) {
      return { label: f.label, report: f.report, records: f.count, ms: f.ms, error: f.error || "", note: f.note || "" };
    }));
    var empty = fetchLog.filter(function (f) { return !f.count && !f.error; });
    var failed = fetchLog.filter(function (f) { return f.error; });
    if (failed.length) console.warn("Reports that FAILED:", failed.map(function (f) { return f.report; }).join(", "));
    if (empty.length) console.warn("Reports that returned NO RECORDS:", empty.map(function (f) { return f.report; }).join(", "));
    return fetchLog;
  }

  /** Tab-separated text of the whole load — copy(AK.reportText()) then paste. */
  function reportText() {
    var head = "dashboard\tlabel\treport\trecords\tms\terror\tnote";
    var body = fetchLog.map(function (f) {
      return [f.dashboard, f.label, f.report, f.count, f.ms, f.error || "", f.note || ""].join("\t");
    });
    return [head].concat(body).join("\n");
  }

  /* ==============================================================
     4. DRILL-DOWN MODAL
     ============================================================== */

  var STYLE_ID = "adroit-kit-styles";
  var CSS = [
    ".ak-clickable{cursor:pointer;position:relative;transition:color .15s ease}",
    ".ak-clickable:hover{color:#2563eb;text-decoration:underline dotted 2px;text-underline-offset:4px}",
    ".ak-clickable::after{content:'\\2197';font-size:.6em;opacity:0;margin-left:3px;vertical-align:super;transition:opacity .15s ease}",
    ".ak-clickable:hover::after{opacity:.7}",

    ".ak-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:99998;display:flex;align-items:center;",
    "justify-content:center;padding:24px;font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",

    ".ak-modal{background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.3);width:100%;max-width:1100px;",
    "max-height:88vh;display:flex;flex-direction:column;overflow:hidden;animation:ak-pop .18s ease-out}",
    "@keyframes ak-pop{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}",

    ".ak-head{display:flex;align-items:flex-start;gap:16px;padding:18px 22px;border-bottom:1px solid #e5e7eb;background:#f8fafc}",
    ".ak-title{font-size:16px;font-weight:600;color:#0f172a;margin:0 0 2px}",
    ".ak-sub{font-size:12px;color:#64748b}",
    ".ak-head-actions{margin-left:auto;display:flex;gap:8px;align-items:center;flex-shrink:0}",
    ".ak-btn{border:1px solid #d1d5db;background:#fff;border-radius:7px;padding:7px 12px;font-size:12px;",
    "font-weight:500;color:#374151;cursor:pointer;font-family:inherit}",
    ".ak-btn:hover{background:#f1f5f9;border-color:#94a3b8}",
    ".ak-close{border:none;background:transparent;font-size:22px;line-height:1;color:#64748b;cursor:pointer;padding:0 4px}",
    ".ak-close:hover{color:#0f172a}",

    ".ak-tools{padding:12px 22px;border-bottom:1px solid #eef2f7;display:flex;gap:10px;align-items:center}",
    ".ak-search{flex:1;border:1px solid #d1d5db;border-radius:7px;padding:8px 12px;font-size:13px;font-family:inherit;outline:none}",
    ".ak-search:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}",
    ".ak-shown{font-size:12px;color:#64748b;white-space:nowrap}",

    ".ak-body{overflow:auto;flex:1;padding:0}",
    ".ak-table{width:100%;border-collapse:collapse;font-size:13px}",
    ".ak-table th{position:sticky;top:0;background:#f1f5f9;text-align:left;padding:10px 14px;font-weight:600;",
    "color:#334155;border-bottom:1px solid #e2e8f0;white-space:nowrap;z-index:1;cursor:pointer;user-select:none}",
    ".ak-table th:hover{background:#e2e8f0}",
    ".ak-table th .ak-sort{opacity:.35;margin-left:5px;font-size:10px}",
    ".ak-table th.ak-asc .ak-sort,.ak-table th.ak-desc .ak-sort{opacity:1;color:#2563eb}",
    ".ak-table td{padding:9px 14px;border-bottom:1px solid #f1f5f9;color:#0f172a;vertical-align:top}",
    ".ak-table tbody tr:nth-child(even){background:#fcfdfe}",
    ".ak-table tbody tr:hover{background:#eff6ff}",
    ".ak-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}",
    ".ak-idx{color:#94a3b8;text-align:right;width:46px;font-variant-numeric:tabular-nums}",

    ".ak-empty{padding:56px 24px;text-align:center;color:#64748b}",
    ".ak-empty-icon{font-size:40px;line-height:1;margin-bottom:14px;opacity:.35}",
    ".ak-empty-title{font-size:16px;font-weight:600;color:#334155;margin-bottom:6px}",
    ".ak-empty-msg{font-size:13px;max-width:460px;margin:0 auto;line-height:1.6}",
    ".ak-empty-hint{margin-top:16px;font-size:11px;color:#94a3b8}",

    ".ak-foot{padding:10px 22px;border-top:1px solid #eef2f7;font-size:11px;color:#94a3b8;background:#f8fafc}",
    "@media(max-width:640px){.ak-overlay{padding:0}.ak-modal{max-height:100vh;border-radius:0}}",

    ".ak-debug-btn{position:fixed;top:14px;right:14px;z-index:99990;background:#0f172a;color:#fff;border:none;",
    "border-radius:999px;padding:8px 14px 8px 12px;font-size:12px;font-weight:600;cursor:pointer;display:flex;",
    "align-items:center;gap:6px;box-shadow:0 4px 14px rgba(15,23,42,.25);font-family:'Poppins',-apple-system,",
    "BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;opacity:.85;transition:opacity .15s ease,transform .15s ease}",
    ".ak-debug-btn:hover{opacity:1;transform:translateY(-1px)}",
    ".ak-debug-btn .ak-debug-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0}",
    "@media(max-width:640px){.ak-debug-btn{top:auto;bottom:14px;right:14px}}",

    ".ak-field-report{border-bottom:1px solid #eef2f7;padding:14px 22px}",
    ".ak-field-report:last-child{border-bottom:none}",
    ".ak-field-report-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:8px}",
    ".ak-field-report-title{font-size:13px;font-weight:600;color:#0f172a}",
    ".ak-field-report-meta{font-size:11px;color:#94a3b8}",
    ".ak-field-report-error{font-size:12px;color:#b91c1c;background:#fef2f2;border-radius:6px;padding:8px 10px;margin-top:4px}",
    ".ak-chips{display:flex;flex-wrap:wrap;gap:6px}",
    ".ak-chip{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:3px 8px;font-size:11.5px;",
    "color:#334155;cursor:pointer;font-family:'SFMono-Regular',Consolas,monospace}",
    ".ak-chip:hover{background:#dbeafe;border-color:#93c5fd;color:#1d4ed8}",
    ".ak-field-sample{margin-top:10px}",
    ".ak-field-sample summary{cursor:pointer;font-size:11.5px;color:#2563eb;font-weight:500}",
    ".ak-field-sample pre{margin:8px 0 0;background:#0f172a;color:#e2e8f0;padding:12px;border-radius:8px;",
    "font-size:11px;overflow:auto;max-height:220px;line-height:1.5;white-space:pre-wrap;word-break:break-word}",

    ".ak-funnel-wrap{display:flex;align-items:stretch;gap:18px;width:100%;",
    "font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    ".ak-funnel{display:flex;flex-direction:column;flex:0 0 42%;min-width:90px}",
    ".ak-funnel-row{position:relative;width:100%;flex-shrink:0}",
    ".ak-funnel-seg{position:absolute;inset:0;transition:filter .15s ease}",
    ".ak-funnel-legend{display:flex;flex-direction:column;flex:1;min-width:0}",
    ".ak-funnel-legend-row{display:flex;align-items:center;gap:8px;flex-shrink:0;border-bottom:1px solid #f1f5f9}",
    ".ak-funnel-legend-row:last-child{border-bottom:none}",
    ".ak-funnel-row-click{cursor:pointer}",
    ".ak-funnel-row-click:hover .ak-funnel-seg{filter:brightness(1.08)}",
    ".ak-funnel-row-click.ak-funnel-legend-row:hover{background:#f8fafc}",
    ".ak-funnel-legend-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}",
    ".ak-funnel-legend-label{font-size:12.5px;color:#475569;flex:1;min-width:0;overflow:hidden;",
    "text-overflow:ellipsis;white-space:nowrap}",
    ".ak-funnel-legend-value{font-size:13.5px;font-weight:700;color:#0f172a;white-space:nowrap}",

    ".ak-gauge{position:relative;width:100%;display:flex;flex-direction:column;align-items:center;",
    "font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    ".ak-gauge-svg{max-width:220px}",
    ".ak-gauge-label{font-size:11.5px;color:#94a3b8;margin-top:2px;text-align:center}"
  ].join("");

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /**
   * Describe what happens when a number on screen is clicked.
   *
   * @param {string} key    any id you choose, e.g. "today.pendingCalls"
   * @param {object} def
   *   title     modal heading
   *   subtitle  optional line under the heading (the filter in words)
   *   columns   [{ label, value, align }] — `value` is a field name or fn(record)
   *   rows      array, or a function returning the array (called on open, so
   *             it always reflects the data loaded at that moment)
   *   report    the report the rows came from (shown in the footer)
   *   empty     custom "no records" message
   */
  function defineDrill(key, def) {
    drills[key] = def;
    return key;
  }

  /** Make an element open a drill-down on click. Accepts an id or an element. */
  function bindDrill(target, key) {
    var el = typeof target === "string" ? document.getElementById(target) : target;
    if (!el) {
      console.warn("[" + DASHBOARD + "] bindDrill: no element for", target, "(drill '" + key + "' not attached)");
      return null;
    }
    if (!drills[key]) {
      console.warn("[" + DASHBOARD + "] bindDrill: no drill defined for key '" + key + "'");
      return null;
    }
    el.classList.add("ak-clickable");
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.title = "Click to see the records behind this number";
    el.addEventListener("click", function (ev) { ev.preventDefault(); openDrill(key); });
    el.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); openDrill(key); }
    });
    return el;
  }

  /** Bind every element carrying data-drill="<key>". Call after rendering. */
  function autoBind(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-drill]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.dataset.akBound === "1") continue;
      n.dataset.akBound = "1";
      bindDrill(n, n.getAttribute("data-drill"));
    }
    return nodes.length;
  }

  function cellValue(record, col) {
    var raw = typeof col.value === "function" ? col.value(record) : record[col.value];
    if (col.format === "money") return money(raw);
    if (col.format === "int") return int(raw);
    if (col.format === "dec") return dec(raw);
    if (col.format === "pct") return pct(raw);
    if (col.format === "date") return date(raw);
    return text(raw);
  }

  function openDrill(key) {
    var def = drills[key];
    if (!def) { console.warn("[" + DASHBOARD + "] openDrill: unknown drill '" + key + "'"); return; }

    var rows;
    try {
      rows = typeof def.rows === "function" ? def.rows() : def.rows;
    } catch (err) {
      console.error("[" + DASHBOARD + "] drill '" + key + "' failed to build its rows:", err);
      rows = [];
    }
    rows = Array.isArray(rows) ? rows : [];

    var columns = def.columns || [];
    if (!columns.length && rows.length) {
      // No columns declared: show whatever the record has, so something useful appears.
      columns = Object.keys(rows[0]).slice(0, 8).map(function (k) { return { label: k, value: k }; });
    }

    console.groupCollapsed("%c[" + DASHBOARD + "] drill-down: " + (def.title || key) +
      " -> " + rows.length + " records", rows.length ? "color:#2563eb" : "color:#b45309;font-weight:bold");
    console.log("drill key :", key);
    if (def.report) console.log("report    :", def.report);
    if (def.subtitle) console.log("filter    :", def.subtitle);
    console.log("records   :", rows.length);
    if (rows.length) console.table(rows.slice(0, 50).map(function (r) {
      var o = {};
      columns.forEach(function (c) { o[c.label] = cellValue(r, c); });
      return o;
    }));
    else console.log("%cNo records matched this metric.", "color:#b45309");
    console.log("raw records:", rows);
    console.groupEnd();

    render(def, key, rows, columns);
  }

  function render(def, key, rows, columns) {
    ensureStyles();
    closeDrill();

    var overlay = document.createElement("div");
    overlay.className = "ak-overlay";
    overlay.id = "ak-overlay";

    var modal = document.createElement("div");
    modal.className = "ak-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    /* ---- header ---- */
    var head = document.createElement("div");
    head.className = "ak-head";
    head.innerHTML =
      '<div><p class="ak-title">' + esc(def.title || key) + "</p>" +
      (def.subtitle ? '<div class="ak-sub">' + esc(def.subtitle) + "</div>" : "") +
      "</div>" +
      '<div class="ak-head-actions">' +
      (rows.length ? '<button class="ak-btn" id="ak-csv">Download CSV</button>' : "") +
      '<button class="ak-close" id="ak-x" aria-label="Close">&times;</button>' +
      "</div>";
    modal.appendChild(head);

    /* ---- empty state ---- */
    if (!rows.length) {
      var empty = document.createElement("div");
      empty.className = "ak-empty";
      empty.innerHTML =
        '<div class="ak-empty-icon">&#128203;</div>' +
        '<div class="ak-empty-title">No records found</div>' +
        '<div class="ak-empty-msg">' +
        esc(def.empty || "Nothing matched this metric for the selected period, so the count is genuinely zero.") +
        "</div>" +
        '<div class="ak-empty-hint">' +
        (def.report ? "Report: " + esc(def.report) + " &middot; " : "") +
        "Open the console for the exact filter and the raw fetch result." +
        "</div>";
      modal.appendChild(empty);
      finish(overlay, modal, def, key, rows, columns);
      return;
    }

    /* ---- tools ---- */
    var tools = document.createElement("div");
    tools.className = "ak-tools";
    tools.innerHTML =
      '<input class="ak-search" id="ak-q" type="search" placeholder="Search these records…" autocomplete="off">' +
      '<span class="ak-shown" id="ak-shown"></span>';
    modal.appendChild(tools);

    /* ---- table ---- */
    var body = document.createElement("div");
    body.className = "ak-body";
    var table = document.createElement("table");
    table.className = "ak-table";
    table.innerHTML =
      "<thead><tr><th class='ak-idx'>#</th>" +
      columns.map(function (c, i) {
        return '<th data-col="' + i + '"' + (c.align === "right" ? ' class="ak-num"' : "") + ">" +
          esc(c.label) + '<span class="ak-sort">&#9650;&#9660;</span></th>';
      }).join("") +
      "</tr></thead><tbody></tbody>";
    body.appendChild(table);
    modal.appendChild(body);

    /* ---- footer ---- */
    var foot = document.createElement("div");
    foot.className = "ak-foot";
    foot.textContent = (def.report ? "Source report: " + def.report + "  ·  " : "") +
      rows.length + " record" + (rows.length === 1 ? "" : "s") +
      "  ·  full records logged to the browser console";
    modal.appendChild(foot);

    /* ---- behaviour ---- */
    var view = rows.slice();
    var sortCol = -1, sortDir = 1;

    function paint() {
      var q = (document.getElementById("ak-q").value || "").trim().toLowerCase();
      var list = view;
      if (q) {
        list = view.filter(function (r) {
          return columns.some(function (c) { return cellValue(r, c).toLowerCase().indexOf(q) >= 0; });
        });
      }
      table.tBodies[0].innerHTML = list.length
        ? list.map(function (r, i) {
          return "<tr><td class='ak-idx'>" + (i + 1) + "</td>" +
            columns.map(function (c) {
              var right = c.align === "right" || c.format === "money" || c.format === "int" ||
                c.format === "dec" || c.format === "pct";
              return "<td" + (right ? " class='ak-num'" : "") + ">" + esc(cellValue(r, c)) + "</td>";
            }).join("") + "</tr>";
        }).join("")
        : "<tr><td colspan='" + (columns.length + 1) + "' style='padding:32px;text-align:center;color:#94a3b8'>" +
        "No record matches &ldquo;" + esc(q) + "&rdquo;</td></tr>";

      document.getElementById("ak-shown").textContent =
        list.length === rows.length
          ? int(rows.length) + " records"
          : int(list.length) + " of " + int(rows.length) + " records";
    }

    table.tHead.addEventListener("click", function (ev) {
      var th = ev.target.closest("th[data-col]");
      if (!th) return;
      var i = +th.getAttribute("data-col");
      sortDir = sortCol === i ? -sortDir : 1;
      sortCol = i;
      var col = columns[i];
      var numeric = col.format === "money" || col.format === "int" || col.format === "dec" || col.format === "pct";
      view.sort(function (a, b) {
        var av, bv;
        if (numeric) {
          av = num(typeof col.value === "function" ? col.value(a) : a[col.value]);
          bv = num(typeof col.value === "function" ? col.value(b) : b[col.value]);
        } else if (col.format === "date") {
          av = parseDate(typeof col.value === "function" ? col.value(a) : a[col.value]);
          bv = parseDate(typeof col.value === "function" ? col.value(b) : b[col.value]);
          av = av ? av.getTime() : -Infinity;
          bv = bv ? bv.getTime() : -Infinity;
        } else {
          av = cellValue(a, col).toLowerCase();
          bv = cellValue(b, col).toLowerCase();
        }
        return av < bv ? -sortDir : av > bv ? sortDir : 0;
      });
      Array.prototype.forEach.call(table.tHead.querySelectorAll("th"), function (h) {
        h.classList.remove("ak-asc", "ak-desc");
      });
      th.classList.add(sortDir === 1 ? "ak-asc" : "ak-desc");
      paint();
    });

    finish(overlay, modal, def, key, rows, columns, paint);
  }

  function finish(overlay, modal, def, key, rows, columns, paint) {
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    if (paint) {
      document.getElementById("ak-q").addEventListener("input", paint);
      paint();
      setTimeout(function () { var q = document.getElementById("ak-q"); if (q) q.focus(); }, 40);
    }

    var x = document.getElementById("ak-x");
    if (x) x.addEventListener("click", closeDrill);

    var csv = document.getElementById("ak-csv");
    if (csv) csv.addEventListener("click", function () { downloadCsv(def, key, rows, columns); });

    overlay.addEventListener("click", function (ev) { if (ev.target === overlay) closeDrill(); });
    document.addEventListener("keydown", escClose);
  }

  function escClose(ev) { if (ev.key === "Escape") closeDrill(); }

  function closeDrill() {
    var el = document.getElementById("ak-overlay");
    if (el) el.remove();
    document.removeEventListener("keydown", escClose);
  }

  function downloadCsv(def, key, rows, columns) {
    var q = function (s) { return '"' + String(s === null || s === undefined ? "" : s).replace(/"/g, '""') + '"'; };
    var lines = [columns.map(function (c) { return q(c.label); }).join(",")];
    rows.forEach(function (r) {
      lines.push(columns.map(function (c) {
        var raw = typeof c.value === "function" ? c.value(r) : r[c.value];
        // Export the underlying value, not the grouped display string, so Excel sees numbers.
        if (c.format === "money" || c.format === "int" || c.format === "dec" || c.format === "pct") return q(num(raw));
        return q(text(raw));
      }).join(","));
    });
    var name = (def.title || key).replace(/[^\w\d]+/g, "_").replace(/^_+|_+$/g, "") || "records";
    var blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + "_" + date(new Date()) + ".csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  /* ==============================================================
     4b. FIELDS DEBUG BUTTON  —  top-right button on every dashboard.
     Click it to see, in-page, exactly which reports/fields this
     dashboard is currently getting back from Creator. No console
     needed, so it works even though Creator widgets run inside an
     iframe (the DevTools console defaults to the "top" frame, where
     AK doesn't exist — this button runs inside the widget itself).
     ============================================================== */

  function copyText(str) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(str).then(function () { resolve(true); }, function () { resolve(fallbackCopyText(str)); });
      } else {
        resolve(fallbackCopyText(str));
      }
    });
  }

  function fallbackCopyText(str) {
    try {
      var ta = document.createElement("textarea");
      ta.value = str;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      ta.style.top = "0";
      ta.style.left = "0";
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }

  function flashButton(btn, label) {
    if (!btn) return;
    var original = btn.textContent;
    btn.textContent = label;
    btn.disabled = true;
    setTimeout(function () { btn.textContent = original; btn.disabled = false; }, 1200);
  }

  function renderFieldsPanelBody() {
    var qEl = document.getElementById("ak-fq");
    var q = qEl ? qEl.value.trim().toLowerCase() : "";
    var body = document.getElementById("ak-fields-body");
    if (!body) return;

    if (!fieldLog.length) {
      body.innerHTML =
        '<div class="ak-empty">' +
        '<div class="ak-empty-icon">&#128269;</div>' +
        '<div class="ak-empty-title">No fields scanned yet</div>' +
        '<div class="ak-empty-msg">This dashboard has not finished field discovery yet' +
        (lastReportsMap ? " — wait for it to load, or scan now." : ".") + '</div>' +
        (lastReportsMap ? '<button class="ak-btn" id="ak-fields-scan" style="margin-top:14px">Scan reports now</button>' : '') +
        '</div>';
      var scanBtn = document.getElementById("ak-fields-scan");
      if (scanBtn) scanBtn.addEventListener("click", function () {
        scanBtn.textContent = "Scanning…"; scanBtn.disabled = true;
        discoverAllFields(lastReportsMap).then(renderFieldsPanelBody);
      });
      return;
    }

    var list = fieldLog;
    if (q) {
      list = fieldLog.filter(function (f) {
        return (f.label + " " + f.report + " " + f.fields.join(" ")).toLowerCase().indexOf(q) >= 0;
      });
    }

    if (!list.length) {
      body.innerHTML = '<div class="ak-empty"><div class="ak-empty-title">No match</div>' +
        '<div class="ak-empty-msg">No report or field matches &ldquo;' + esc(q) + '&rdquo;.</div></div>';
      return;
    }

    body.innerHTML = list.map(function (f) {
      var head = '<div class="ak-field-report-head">' +
        '<span class="ak-field-report-title">' + esc(f.label) + '</span>' +
        '<span class="ak-field-report-meta">' + esc(f.report) + ' &middot; ' +
        (f.error ? "failed" : f.count + " record(s) sampled &middot; " + f.fields.length + " field(s)") +
        '</span></div>';
      if (f.error) {
        return '<div class="ak-field-report">' + head +
          '<div class="ak-field-report-error">' + esc(f.error) + '</div></div>';
      }
      var chips = f.fields.map(function (fld) {
        return '<span class="ak-chip" data-copy="' + esc(fld) + '" title="Click to copy this field name">' + esc(fld) + '</span>';
      }).join("");
      var sample = f.sample
        ? '<details class="ak-field-sample"><summary>Sample record</summary><pre>' +
        esc(JSON.stringify(f.sample, null, 2)) + '</pre></details>'
        : "";
      return '<div class="ak-field-report">' + head + '<div class="ak-chips">' + chips + '</div>' + sample + '</div>';
    }).join("");

    Array.prototype.forEach.call(body.querySelectorAll(".ak-chip"), function (chip) {
      chip.addEventListener("click", function () {
        copyText(chip.getAttribute("data-copy")).then(function (ok) {
          var original = chip.textContent;
          chip.textContent = ok ? "Copied!" : "Copy failed";
          setTimeout(function () { chip.textContent = original; }, 900);
        });
      });
    });
  }

  function fieldsEscClose(ev) { if (ev.key === "Escape") closeFieldsPanel(); }

  function closeFieldsPanel() {
    var el = document.getElementById("ak-fields-overlay");
    if (el) el.remove();
    document.removeEventListener("keydown", fieldsEscClose);
  }

  function openFieldsPanel() {
    ensureStyles();
    closeFieldsPanel();

    var overlay = document.createElement("div");
    overlay.className = "ak-overlay";
    overlay.id = "ak-fields-overlay";

    var modal = document.createElement("div");
    modal.className = "ak-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML =
      '<div class="ak-head">' +
      '<div><p class="ak-title">Fields &amp; sample data — ' + esc(DASHBOARD) + '</p>' +
      '<div class="ak-sub">Every report this dashboard reads, and the real field names Creator returned for it.</div></div>' +
      '<div class="ak-head-actions">' +
      '<button class="ak-btn" id="ak-fields-copy">Copy all as text</button>' +
      (lastReportsMap ? '<button class="ak-btn" id="ak-fields-rescan">Rescan</button>' : '') +
      '<button class="ak-close" id="ak-fields-x" aria-label="Close">&times;</button>' +
      '</div></div>' +
      '<div class="ak-tools"><input class="ak-search" id="ak-fq" type="search" ' +
      'placeholder="Search reports or field names…" autocomplete="off"></div>' +
      '<div class="ak-body" id="ak-fields-body"></div>' +
      '<div class="ak-foot">Click any field name to copy just that field &middot; this reflects what Creator ' +
      'returned on the current page load</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    renderFieldsPanelBody();

    document.getElementById("ak-fq").addEventListener("input", renderFieldsPanelBody);
    document.getElementById("ak-fields-x").addEventListener("click", closeFieldsPanel);
    overlay.addEventListener("click", function (ev) { if (ev.target === overlay) closeFieldsPanel(); });
    document.addEventListener("keydown", fieldsEscClose);

    var copyBtn = document.getElementById("ak-fields-copy");
    copyBtn.addEventListener("click", function () {
      copyText(fieldsText()).then(function (ok) { flashButton(copyBtn, ok ? "Copied!" : "Copy failed"); });
    });

    var rescanBtn = document.getElementById("ak-fields-rescan");
    if (rescanBtn) rescanBtn.addEventListener("click", function () {
      rescanBtn.textContent = "Scanning…"; rescanBtn.disabled = true;
      discoverAllFields(lastReportsMap).then(function () {
        rescanBtn.textContent = "Rescan"; rescanBtn.disabled = false;
        renderFieldsPanelBody();
      });
    });
  }

  /** Idempotent — creates the fixed top-right "Fields" button once per page. */
  function mountDebugButton() {
    if (document.getElementById("ak-debug-btn")) return null;
    ensureStyles();
    var btn = document.createElement("button");
    btn.id = "ak-debug-btn";
    btn.className = "ak-debug-btn";
    btn.type = "button";
    btn.title = "Show every field this dashboard is reading from Creator";
    btn.innerHTML = '<span class="ak-debug-dot"></span>Fields';
    btn.addEventListener("click", openFieldsPanel);
    document.body.appendChild(btn);
    return btn;
  }

  /* ==============================================================
     4c. APEXCHARTS HELPER
     One place to mount/replace an ApexCharts instance, and one shared,
     colorblind-validated palette so every dashboard's charts use the
     same colors. Requires apexcharts.min.js to be loaded in widget.html
     BEFORE this file's dashboard script runs its render/mount calls.
     ============================================================== */

  var CHART_INSTANCES = {};

  // Fixed categorical order — validated for CVD-safety adjacent and
  // (first 3 slots) all-pairs. Never reorder or cycle; a 9th series folds
  // into "Other" instead of generating a new hue.
  var CHART_ORDER = ["blue", "orange", "aqua", "yellow", "magenta", "green", "violet", "red"];
  var CHART_PALETTE = {
    blue: "#2a78d6", orange: "#eb6834", aqua: "#1baf7a", yellow: "#eda100",
    magenta: "#e87ba4", green: "#008300", violet: "#4a3aa7", red: "#e34948",
    // status colors — reserved for real state (good/warning/serious/critical), never a generic series
    good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b"
  };

  /** First N colors of the fixed categorical order, e.g. AK.categoricalColors(3). */
  function categoricalColors(n) {
    return CHART_ORDER.slice(0, n).map(function (k) { return CHART_PALETTE[k]; });
  }

  /**
   * Create (or replace) an ApexCharts instance in a container.
   * Safe to call repeatedly on the same containerId — the previous
   * instance is destroyed first, so re-rendering a tab never leaves
   * stale/duplicate charts behind.
   */
  function mountChart(containerId, options) {
    if (typeof ApexCharts === "undefined") {
      console.warn("[" + DASHBOARD + "] mountChart('" + containerId + "'): ApexCharts is not loaded " +
        "— add <script src=\"https://cdn.jsdelivr.net/npm/apexcharts@3.45.2/dist/apexcharts.min.js\"></script> to widget.html.");
      return null;
    }
    var el = document.getElementById(containerId);
    if (!el) { console.warn("[" + DASHBOARD + "] mountChart: no element #" + containerId); return null; }
    if (CHART_INSTANCES[containerId]) {
      try { CHART_INSTANCES[containerId].destroy(); } catch (e) { /* already gone */ }
    }
    var chart = new ApexCharts(el, options);
    CHART_INSTANCES[containerId] = chart;
    chart.render();
    return chart;
  }

  // Ordinal ramp (one hue, dark -> light) for progressions like funnel stages,
  // where color encodes ORDER/magnitude, not separate categories — per the
  // palette's rule that ordinal marks use a single-hue ramp, never the
  // categorical order. Only steps >=250 are used (the ordinal floor — lighter
  // steps don't clear contrast).
  var ORDINAL_BLUE = ["#0d366b", "#104281", "#184f95", "#1c5cab", "#256abf",
    "#2a78d6", "#3987e5", "#5598e7", "#6da7ec", "#86b6ef"];

  /** N evenly-spaced shades of the ordinal ramp, darkest first. */
  function ordinalColors(n) {
    if (n <= 1) return [ORDINAL_BLUE[0]];
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push(ORDINAL_BLUE[Math.round((i * (ORDINAL_BLUE.length - 1)) / (n - 1))]);
    }
    return out;
  }

  /**
   * A real funnel shape — continuously narrowing trapezoid segments, stacked
   * top to bottom, each one's width driven by its value relative to the
   * largest stage. ApexCharts has no native funnel series type, and the
   * previous approach (a stacked horizontal bar with an invisible "padding"
   * series) rendered the padding segment with a visible default color
   * instead of hiding it, so bars came out as flat, wrongly-sized blocks
   * instead of a taper. This builds the shape directly with CSS clip-path
   * polygons instead, which is exact and needs no charting library at all.
   *
   * @param {string} containerId
   * @param {Array}  stages  [{ label, value, drillKey? }, ...], in funnel order
   */
  function mountFunnel(containerId, stages) {
    var el = document.getElementById(containerId);
    if (!el) { console.warn("[" + DASHBOARD + "] mountFunnel: no element #" + containerId); return null; }
    ensureStyles();

    if (!stages || !stages.length) {
      el.innerHTML = emptyPanel("No funnel stages to show.");
      return null;
    }

    var values = stages.map(function (s) { return num(s.value); });
    var maxValue = Math.max.apply(null, values.concat([1]));
    // Small floor so a genuinely 0-value stage still renders as a visible
    // sliver instead of vanishing — kept low (not the old 22%) because
    // labels no longer have to fit INSIDE the shape (see below), so a
    // narrow true-to-value taper reads correctly without crowding text.
    var MIN_PCT = 6, MAX_PCT = 100;
    var widths = values.map(function (v) {
      return MIN_PCT + (MAX_PCT - MIN_PCT) * (v / maxValue);
    });
    var colors = ordinalColors(stages.length);
    var rowHeight = stages.length > 5 ? 46 : 58;

    // Labels live in their own full-width column next to the shape, never
    // inside a trapezoid — a narrow (near-zero) segment used to force its
    // "Label: value" text to overflow into the row above/below it, which is
    // what made the funnel look broken. Text in a separate column can never
    // collide with the taper, no matter how thin a segment gets.
    var shapeRows = stages.map(function (s, i) {
      var topW = widths[i];
      var botW = i < widths.length - 1 ? widths[i + 1] : widths[i];
      var clip = "polygon(" +
        "calc(50% - " + topW / 2 + "%) 0%, calc(50% + " + topW / 2 + "%) 0%, " +
        "calc(50% + " + botW / 2 + "%) 100%, calc(50% - " + botW / 2 + "%) 100%)";
      return "<div class='ak-funnel-row' style='height:" + rowHeight + "px'>" +
        "<div class='ak-funnel-seg' style='clip-path:" + clip + ";background:" + colors[i] + "'></div></div>";
    }).join("");

    var legendRows = stages.map(function (s, i) {
      var clickable = !!s.drillKey;
      return "<div class='ak-funnel-legend-row" + (clickable ? " ak-funnel-row-click" : "") + "' " +
        (clickable ? "data-ak-funnel-drill='" + esc(s.drillKey) + "' role='button' tabindex='0'" : "") +
        " style='height:" + rowHeight + "px'>" +
        "<span class='ak-funnel-legend-dot' style='background:" + colors[i] + "'></span>" +
        "<span class='ak-funnel-legend-label'>" + esc(s.label) + "</span>" +
        "<span class='ak-funnel-legend-value'>" + int(values[i]) + "</span>" +
        "</div>";
    }).join("");

    el.innerHTML =
      "<div class='ak-funnel-wrap'>" +
      "<div class='ak-funnel' style='height:" + (rowHeight * stages.length) + "px'>" + shapeRows + "</div>" +
      "<div class='ak-funnel-legend' style='height:" + (rowHeight * stages.length) + "px'>" + legendRows + "</div>" +
      "</div>";

    if (stages.some(function (s) { return !!s.drillKey; })) {
      Array.prototype.forEach.call(el.querySelectorAll("[data-ak-funnel-drill]"), function (row) {
        var go = function () { openDrill(row.getAttribute("data-ak-funnel-drill")); };
        row.addEventListener("click", go);
        row.addEventListener("keydown", function (ev) {
          if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); }
        });
      });
    }

    return { destroy: function () { el.innerHTML = ""; } };
  }

  /**
   * Semi-circle gauge with a needle pointer, drawn entirely as SVG. The
   * ApexCharts build this app loads (3.45.2, checked directly against its
   * source) has no needle/radialBar-needle feature — that only exists in
   * much newer ApexCharts releases, and jumping this app's pinned CDN
   * version that far forward risks silently breaking every other chart on
   * every dashboard with no way to test it live first. A hand-drawn SVG arc
   * + needle needs no charting library at all and its geometry is exact by
   * construction (plain trigonometry), so there's nothing to verify against
   * an unfamiliar library version.
   *
   * @param {string} containerId
   * @param {number} percent  0-100
   * @param {object} [opts]
   *   color      arc + needle-tip color (default categorical blue)
   *   label      small caption under the value, e.g. "Quote Accuracy"
   *   valueText  override the big center number (default: percent + "%")
   *   dark       true for a dark card background — flips track/text/needle
   *              colors to stay legible instead of near-invisible dark-on-dark
   */
  function mountGauge(containerId, percent, opts) {
    var el = document.getElementById(containerId);
    if (!el) { console.warn("[" + DASHBOARD + "] mountGauge: no element #" + containerId); return null; }
    opts = opts || {};
    ensureStyles();

    var pct = Math.max(0, Math.min(100, num(percent)));
    var color = opts.color || CHART_PALETTE.blue;
    var trackColor = opts.dark ? "#334155" : "#e5e7eb";
    var needleColor = opts.dark ? "#f1f5f9" : "#1e293b";
    var textColor = opts.dark ? "#ffffff" : "#0f172a";

    // Semi-circle, radius 90, centered at (100,100), spanning the top half.
    var R = 90, CX = 100, CY = 100;
    var TOTAL_LEN = Math.PI * R; // arc length of a half-circle
    var progressLen = (pct / 100) * TOTAL_LEN;

    // Needle angle: pct=0 -> pointing left (180°), pct=100 -> pointing right (0°).
    var theta = Math.PI - (pct / 100) * Math.PI;
    var needleR = R * 0.74;
    var tipX = CX + needleR * Math.cos(theta);
    var tipY = CY - needleR * Math.sin(theta);

    var svg =
      "<svg viewBox='0 0 200 112' class='ak-gauge-svg' style='width:100%;height:auto'>" +
      "<path d='M 10 100 A " + R + " " + R + " 0 0 1 190 100' fill='none' stroke='" + trackColor + "' stroke-width='16' stroke-linecap='round'/>" +
      "<path d='M 10 100 A " + R + " " + R + " 0 0 1 190 100' fill='none' stroke='" + color + "' stroke-width='16' " +
      "stroke-linecap='round' stroke-dasharray='" + progressLen + " " + TOTAL_LEN + "'/>" +
      "<line x1='" + CX + "' y1='" + CY + "' x2='" + tipX.toFixed(2) + "' y2='" + tipY.toFixed(2) + "' " +
      "stroke='" + needleColor + "' stroke-width='4' stroke-linecap='round'/>" +
      "<circle cx='" + CX + "' cy='" + CY + "' r='7' fill='" + needleColor + "'/>" +
      "<text x='" + CX + "' y='86' text-anchor='middle' font-family='Poppins,sans-serif' font-weight='700' " +
      "font-size='24' fill='" + textColor + "'>" + esc(opts.valueText || int(pct) + "%") + "</text>" +
      "</svg>";

    el.innerHTML = "<div class='ak-gauge'>" + svg +
      (opts.label ? "<div class='ak-gauge-label' style='color:" + (opts.dark ? "#94a3b8" : "#64748b") + "'>" +
        esc(opts.label) + "</div>" : "") + "</div>";

    return { destroy: function () { el.innerHTML = ""; } };
  }

  /* ==============================================================
     5. SMALL DOM HELPERS
     ============================================================== */

  /** Write a value into an element by id, and optionally wire its drill-down. */
  function set(elId, value, drillKey) {
    var el = document.getElementById(elId);
    if (!el) { console.warn("[" + DASHBOARD + "] set(): no element #" + elId); return null; }
    el.textContent = value;
    if (drillKey && drills[drillKey] && el.dataset.akBound !== "1") {
      el.dataset.akBound = "1";
      bindDrill(el, drillKey);
    }
    return el;
  }

  /** Standard inline "no records" row for a table body. */
  function emptyRow(colspan, message) {
    return "<tr><td colspan='" + colspan + "' style='padding:28px;text-align:center;color:#94a3b8;font-size:13px'>" +
      esc(message || "No records found") + "</td></tr>";
  }

  /** Standard "no records" panel for a chart/card area. */
  function emptyPanel(message, height) {
    return "<div style='display:flex;flex-direction:column;align-items:center;justify-content:center;" +
      "min-height:" + (height || 180) + "px;color:#94a3b8;text-align:center;padding:24px'>" +
      "<div style='font-size:34px;opacity:.35;line-height:1;margin-bottom:10px'>&#128202;</div>" +
      "<div style='font-size:14px;font-weight:600;color:#64748b;margin-bottom:4px'>No records found</div>" +
      "<div style='font-size:12px;max-width:340px;line-height:1.5'>" +
      esc(message || "There is no data for this period yet.") + "</div></div>";
  }

  /* ==============================================================
     6. PUBLIC API
     ============================================================== */

  var API = {
    init: function (opts) {
      opts = opts || {};
      if (opts.name) DASHBOARD = opts.name;
      if (opts.locale) LOCALE = opts.locale;
      if (opts.currency) CURRENCY = opts.currency;
      ensureStyles();
      mountDebugButton();
      console.log("%cAdroit Widget Kit ready — " + DASHBOARD,
        "color:#2563eb;font-weight:bold");
      console.log("%cDebug helpers: click the 'Fields' button (top-right of the dashboard) to see live fields " +
        "in-page  |  AK.report()  |  copy(AK.reportText())  |  copy(AK.fieldsText())  |  AK.drills()",
        "color:#64748b");
      return API;
    },

    // formatting
    int: int, dec: dec, money: money, money0: money0, pct: pct, compact: compact,
    date: date, parseDate: parseDate, num: num, text: text, id: id, esc: esc, isNil: isNil,

    // diagnostics
    logFetch: logFetch, isNoRecords: isNoRecords, describeError: describeError,
    report: report, reportText: reportText, discoverFields: discoverFields, discoverAllFields: discoverAllFields,
    fieldsText: fieldsText, fields: function () { return fieldLog.slice(); },
    fetchLog: function () { return fetchLog.slice(); },
    mountDebugButton: mountDebugButton, showFields: openFieldsPanel, hideFields: closeFieldsPanel,

    // charts
    mountChart: mountChart, chartColors: CHART_PALETTE, categoricalColors: categoricalColors,
    mountFunnel: mountFunnel, ordinalColors: ordinalColors, mountGauge: mountGauge,

    // drill-down
    defineDrill: defineDrill, bindDrill: bindDrill, autoBind: autoBind,
    openDrill: openDrill, closeDrill: closeDrill,
    drills: function () { return Object.keys(drills); },

    // dom
    set: set, emptyRow: emptyRow, emptyPanel: emptyPanel
  };

  return API;
})();

// Short alias used throughout the dashboards.
window.AK = window.AdroitKit;
