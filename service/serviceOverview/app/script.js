(function () {
  'use strict';
  console.log('%cadroit widget build: inline-v8 (formatting + drill-downs)', 'color:#16a34a;font-weight:bold');
  AK.init({ name: 'serviceOverview' });

  /* ---------------------------------------------------------------- CONFIG */
  const CFG = {
    appName: 'adroit',
    pageSize: 1000,
    passAppName: false,
    maxPages: 100,
    concurrency: 4,
    serviceRoles: ['Service Co-ordinator', 'Field Service Engineer'],
    reports: {
      invoices:         'Service_Invoice_Format',
      expenses:         'Expense_of_Engineer_Report',
      expenseLines:     'Subform_Of_Expense_Of_Engineer1_Report',
      callLogs:         'Service_Call_Logs',
      feedback:         'All_Service_Feedback1',
      executive:        'Service_Executive1',
      employees:        'All_Employees',
      serviceReports:   'All_Service_Reports',
      quotations:       'Service_Quotations',
      amcContracts:     'Amc_Contracts_Format',
      vehicle:          'Vehicle_Service_Reports',
      vehicleDraft:     'Vehicle_Service_Reports1',
      vehicleLines:     'Subform_Of_Vehicle_Service_Report_Report',
      calibration:      'Internal_Calibrations',
      calibrationDraft: 'Internal_Calibration_Approval_Process',
      toolsKit:         'Production_Tool_Kit_of_Engineers',
      toolsKitDraft:    'Production_Tool_Kit_of_Engineers1'
    }
  };

  const D = {}; 
  let APP = CFG.appName;

  /* ------------------------------------------------------------- UTILITIES */
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const TODAY = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })();
  const MONTH_START = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);

  const esc = AK.esc;
  const num = v => { if (v === null || v === undefined || v === '') return NaN; return parseFloat(String(v).replace(/,/g, '')); };
  const n0 = v => { const n = num(v); return isNaN(n) ? 0 : n; };
  const round = (x, d) => { const f = Math.pow(10, d || 0); return Math.round(x * f) / f; };
  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);

  /* Human-readable numbers everywhere: 10000 -> "10,000", never "10000". */
  const fmt = AK.dec;          // grouped decimal, e.g. "10,000.5"
  const cnt = AK.int;          // grouped whole number, e.g. "10,000"
  const rupees = AK.money;     // "₹ 10,000.00"
  const pctOf = AK.pct;        // "12.5%"

  function parseDate(v) {
    if (!v) return null;
    const s = String(v).trim();
    const m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
    if (m) {
      const mi = MONTHS.findIndex(x => x.toLowerCase() === m[2].toLowerCase());
      if (mi >= 0) return new Date(+m[3], mi, +m[1]);
    }
    let m2 = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (m2) return new Date(+m2[3], +m2[2] - 1, +m2[1]);
    m2 = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
    if (m2) return new Date(+m2[3], +m2[2] - 1, +m2[1]);
    m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
    const d = new Date(s);
    return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  const inRange = (v, a, b) => { const d = parseDate(v); return !!d && d >= a && d <= b; };
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const fbDate = f => blank(f.Added_Time) ? f.Call_attended_date : f.Added_Time;
  const sameMonthName = (v, name) => lkName(v).trim().toLowerCase() === name.toLowerCase();

  let _expIdx = null;
  function linesOf(rec) {
    if (!_expIdx) {
      _expIdx = {};
      D.expenseLines.forEach(l => { const p = refId(l.Expense_of_Engineer); (_expIdx[p] = _expIdx[p] || []).push(l); });
    }
    return _expIdx[String(rec.ID)] || [];
  }

  const lkId = v => (v && typeof v === 'object') ? String(v.ID == null ? '' : v.ID) : '';
  
  function dispVal(v) {
    if (v === null || v === undefined) return '';
    if (Array.isArray(v)) return v.map(dispVal).filter(Boolean).join(', ');
    if (typeof v === 'object') {
      if (v.display_value != null && v.display_value !== '') return String(v.display_value);
      if (v.first_name != null || v.last_name != null) {
        return [v.prefix, v.first_name, v.last_name, v.suffix].filter(x => x).join(' ').trim();
      }
      if (v.name != null && v.name !== '') return String(v.name);
      if (v.email != null && v.email !== '') return String(v.email);
      return '';
    }
    return String(v);
  }
  
  const lkName = v => dispVal(v);
  const refId = v => (v && typeof v === 'object') ? lkId(v) : String(v == null ? '' : v);
  const nameKey = v => dispVal(v).trim().toLowerCase();
  const blank = v => v === null || v === undefined || v === '' || (typeof v === 'object' && !Array.isArray(v) && !lkId(v) && !dispVal(v));

  // Always compare Zoho IDs as strings (never Number/parseInt: 19-digit IDs lose precision)
  function zohoId(v) {
    if (v === null || v === undefined || v === '') return '';
    if (typeof v === 'object') {
      // lookup object: {ID:"123", display_value:"..."} or {id:"123"}
      return String(v.ID ?? v.id ?? '').trim();
    }
    return String(v).trim();
  }

  // Read the Quotation_Number lookup from an AMC contract, whichever way the API returned it
  function amcQuotationId(a) {
    return zohoId(
      a.Quotation_Number ??
      a['Quotation_Number.ID'] ??
      a.Quotation_Number_ID
    );
  }
  
  // Return the first non-blank value among candidate field names (case-insensitive fallback)
  function pick(rec, names) {
    if (!rec) return '';
    for (const n of names) { if (rec[n] !== undefined && !blank(rec[n])) return rec[n]; }
    const lower = names.map(n => n.toLowerCase());
    for (const k of Object.keys(rec)) {
      if (lower.indexOf(k.toLowerCase()) >= 0 && !blank(rec[k])) return rec[k];
    }
    return '';
  }

  function sameEngineer(fieldVal, emp) {
    const fid = lkId(fieldVal);
    if (fid && emp && String(emp.ID) === fid) return true;
    const fname = nameKey(fieldVal);
    const ename = nameKey(emp && emp.Employee_Name);
    return !!fname && !!ename && fname === ename;
  }

  function isNoRecords(e) {
    try { return /3100|No records found/i.test(typeof e === 'string' ? e : JSON.stringify(e)); } catch (_) { return false; }
  }

  function errMsg(e) {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    try { return (e.message || e.responseText || JSON.stringify(e)).toString().slice(0, 160); } catch (_) { return 'Unknown error'; }
  }

  /* ------------------------------------------------------------ DATA LOAD */
  /**
   * v2 SDK (ZOHO.CREATOR.DATA.getRecords), record_cursor pagination — the
   * same pattern every other adroit dashboard uses. This used to call the
   * legacy v1 ZOHO.CREATOR.API.getAllRecords(); switched over for
   * consistency (v1 is deprecated and was the only holdout).
   *
   * Every report fetch is logged through the kit: report name, params, row
   * count, timing, the first record's field names, and a loud warning when a
   * report comes back empty. Paste copy(AK.reportText()) to share the whole
   * load in one go.
   */
  async function fetchAll(reportName, label) {
    const out = [];
    const started = Date.now();
    let cursor = null, page = 0, lastCfg = null, failure = null, note = null;

    do {
      const cfg = { report_name: reportName, max_records: CFG.pageSize, field_config: 'all' };
      if (cursor) cfg.record_cursor = cursor;
      lastCfg = cfg;
      let resp;
      try {
        resp = await ZOHO.CREATOR.DATA.getRecords(cfg);
      } catch (e) {
        if (isNoRecords(e)) { note = 'Creator reported "no records" (code 3100/9280)'; break; }
        failure = e;
        break;
      }
      const rows = (resp && resp.data) || [];
      out.push.apply(out, rows);
      cursor = (resp && resp.record_cursor) || null;
      page++;
    } while (cursor && page < CFG.maxPages);

    if (cursor && page >= CFG.maxPages) note = 'hit the ' + CFG.maxPages + '-page cap — counts may be low';

    AK.logFetch({
      label: label || reportName,
      report: reportName,
      params: lastCfg,
      rows: out,
      ms: Date.now() - started,
      error: failure,
      note: note
    });

    if (failure) throw failure;
    return out;
  }

  async function pool(tasks, limit) {
    const results = new Array(tasks.length);
    let next = 0;
    async function worker() {
      while (next < tasks.length) {
        const i = next++;
        try { results[i] = { ok: true, value: await tasks[i]() }; }
        catch (e) { results[i] = { ok: false, error: e }; }
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
    return results;
  }

  /* =========================================================================
     DRILL-DOWN COLUMN SETS
     What each modal shows when a count on screen is clicked. Every field
     named here must be on the report (they are listed in the
     "Adroit Dashboard Report Fields" workbook).
     ========================================================================= */

  const COLS = {
    invoice: [
      { label: 'Date', value: 'Date_field', format: 'date' },
      { label: 'Customer', value: 'Customer' },
      { label: 'Call Log', value: 'Service_Call_Log' },
      { label: 'Service Coordinator', value: 'Service_Coordinator' },
      { label: 'Final Total', value: 'Final_Total', format: 'money' }
    ],
    expense: [
      { label: 'Date', value: 'Date_field1234567890', format: 'date' },
      { label: 'Engineer', value: 'Service_Engineer_Name' },
      { label: 'Indirect (Overall)', value: 'Overall_Engineer', format: 'money' }
    ],
    expenseLine: [
      { label: 'Nature of Call', value: 'Nature_of_Calls' },
      { label: 'Direct Expense', value: 'Direct_Expense', format: 'money' },
      { label: 'Parent Expense', value: 'Expense_of_Engineer' }
    ],
    callLog: [
      { label: 'Date', value: 'Date_field', format: 'date' },
      { label: 'Customer', value: 'Customer_Name' },
      { label: 'Engineer', value: 'Service_Engineer_Name' },
      { label: 'Nature', value: 'Nature_Of_Calls' },
      { label: 'Status', value: 'Status' },
      { label: 'Repeat Reason', value: 'Repeat_Call_Reason' }
    ],
    feedback: [
      { label: 'Date', value: 'Call_attended_date', format: 'date' },
      { label: 'Customer', value: 'Company_Name' },
      { label: 'Engineer', value: 'service_engineer_attended_the_call' },
      { label: 'Rating', value: 'Rating', format: 'dec' },
      { label: 'Comments', value: 'Any_additional_comments_or_suggestions_would_be_appreciated1' }
    ],
    executive: [
      { label: 'Date Logged', value: 'Date_Logged', format: 'date' },
      { label: 'Google Rating', value: 'Google_Rating' }
    ],
    serviceReport: [
      { label: 'Attended', value: 'Call_Attended_Date', format: 'date' },
      { label: 'Product', value: 'Product' },
      { label: 'Status', value: 'Status' },
      { label: 'Times Visited', value: 'How_Many_Times_Visited', format: 'int' }
    ],
    quotation: [
      { label: 'Date', value: q => pick(q, ['Date_field', 'Date', 'Quotation_Date', 'Added_Time']), format: 'date' },
      { label: 'Customer', value: q => pick(q, ['Customer_Name', 'Customer']) },
      { label: 'Nature', value: q => pick(q, ['Nature_of_Calls', 'Nature_Of_Calls']) },
      { label: 'Status', value: 'Status' }
    ],
    calibration: [
      { label: 'UUC/E', value: 'UUC_E' },
      { label: 'Rev Date', value: 'Rev_Date', format: 'date' },
      { label: 'Approved By', value: 'Approved_By' }
    ],
    monthDoc: [
      { label: 'Month', value: 'Month_field' },
      { label: 'Status', value: 'Status' }
    ]
  };

  /** Rows captured by the update functions, read back by the drill-downs. */
  const SRC = {};

  function drill(key, title, report, columns, srcKey, subtitle, empty) {
    AK.defineDrill(key, {
      title: title, report: report, columns: columns, subtitle: subtitle, empty: empty,
      rows: () => SRC[srcKey] || []
    });
  }

  /* =========================================================================
     DOM UPDATE LOGIC
     ========================================================================= */

  function updateTiles() {
    const invoiceRows = D.invoices.filter(r => !blank(r.Customer));
    const invoice_amount = sum(invoiceRows, r => n0(r.Final_Total));

    // NOTE: Expense_of_Engineer_Report ("expenses", the parent) currently returns 0 records
    // (confirmed via fields.txt — a clean "no records" response, not a bad report name). That
    // means this loop never runs and warranty/postWarranty/indirect always compute as 0/empty
    // right now, even though Subform_Of_Expense_Of_Engineer1_Report ("expenseLines", the child
    // lines linesOf() joins against) DOES have 134 real records. Either no parent
    // Expense_of_Engineer record has actually been created yet, or "expenses" is pointed at
    // the wrong report — worth checking directly in Zoho rather than guessing here.
    let warranty = 0, postWarranty = 0, indirect = 0;
    const warrantyLines = [], pwLines = [], indirectRows = [];
    D.expenses.filter(r => !blank(r.Service_Engineer_Name)).forEach(rec => {
      linesOf(rec).forEach(line => {
        const nature = lkName(line.Nature_of_Calls);
        if (nature === 'Warranty') { warranty += n0(line.Direct_Expense); warrantyLines.push(line); }
        else if (nature === 'PW') { postWarranty += n0(line.Direct_Expense); pwLines.push(line); }
      });
      indirect += n0(rec.Overall_Engineer);
      indirectRows.push(rec);
    });

    SRC.warranty = warrantyLines;
    SRC.postWarranty = pwLines;
    SRC.indirect = indirectRows;
    SRC.invoices = invoiceRows;

    drill('tile.warranty', 'Warranty Expense', CFG.reports.expenseLines, COLS.expenseLine, 'warranty',
      'Expense subform lines with Nature of Calls = Warranty');
    drill('tile.postWarranty', 'Post Warranty Expense', CFG.reports.expenseLines, COLS.expenseLine, 'postWarranty',
      'Expense subform lines with Nature of Calls = PW');
    drill('tile.indirect', 'Indirect Expenses', CFG.reports.expenses, COLS.expense, 'indirect',
      'Overall_Engineer summed over expense records that name a Service Engineer');
    drill('tile.invoices', 'Invoice Amounts', CFG.reports.invoices, COLS.invoice, 'invoices',
      'Final Total summed over invoices that name a Customer');

    AK.set('val-warranty', rupees(warranty), 'tile.warranty');
    AK.set('val-post-warranty', rupees(postWarranty), 'tile.postWarranty');
    AK.set('val-indirect', rupees(indirect), 'tile.indirect');
    AK.set('val-invoice-tiles', rupees(invoice_amount), 'tile.invoices');
  }

  function updateServiceHealth() {
    const monthCalls = D.callLogs.filter(c => inRange(c.Date_field, MONTH_START, TODAY));
    const openCalls = monthCalls.filter(c => c.Status === 'Open');

    const ageingRows = monthCalls.filter(c => {
      if (c.Status === 'Completed') return false;
      const d = parseDate(blank(c.Added_Time) ? c.Date_field : c.Added_Time);
      return !!d && daysBetween(d, TODAY) > 2;
    });

    const fb = D.feedback.filter(f => !blank(f.Company_Name) && inRange(fbDate(f), MONTH_START, TODAY));
    const negRows = [];
    let sumRating = 0, ratingCount = 0;
    fb.forEach(f => {
      const r = num(f.Rating);
      if (!isNaN(r) && r <= 3) negRows.push(f);
      if (!isNaN(r) && r > 0) { sumRating += r; ratingCount++; }
    });
    const complaint = fb.length > 0 ? negRows.length / fb.length * 100 : 0;
    const avg = ratingCount > 0 ? sumRating / ratingCount : 0;

    const reports = D.executive.filter(r => inRange(r.Date_Logged, MONTH_START, TODAY));
    const googleRows = reports.filter(r => !blank(r.Google_Rating));
    const googlePct = reports.length > 0 ? googleRows.length / reports.length * 100 : 0;

    SRC.openCalls = openCalls;
    SRC.ageing = ageingRows;
    SRC.complaints = negRows;
    SRC.google = googleRows;
    SRC.ratedFeedback = fb.filter(f => { const r = num(f.Rating); return !isNaN(r) && r > 0; });

    const win = AK.date(MONTH_START) + ' to ' + AK.date(TODAY);
    drill('health.open', 'Total Open Calls', CFG.reports.callLogs, COLS.callLog, 'openCalls',
      'Service Call Logs ' + win + ' with Status = Open',
      'No call is sitting in Open status this month.');
    drill('health.ageing', 'Ageing Calls (> 2 days)', CFG.reports.callLogs, COLS.callLog, 'ageing',
      'Non-completed calls ' + win + ' logged more than 2 days ago');
    drill('health.complaints', 'Complaints (rated 3 or below)', CFG.reports.feedback, COLS.feedback, 'complaints',
      'Feedback ' + win + ' rated 3 or lower');
    drill('health.google', 'Google Reviews Collected', CFG.reports.executive, COLS.executive, 'google',
      'Service Executive entries ' + win + ' that have a Google Rating');
    drill('health.rating', 'Rated Feedback', CFG.reports.feedback, COLS.feedback, 'ratedFeedback',
      'Feedback ' + win + ' with a rating above 0');

    AK.set('val-open-calls', cnt(openCalls.length), 'health.open');
    AK.set('val-ageing', cnt(ageingRows.length), 'health.ageing');
    AK.set('val-complaints-pct', pctOf(complaint), 'health.complaints');
    AK.set('val-google-pct', pctOf(googlePct, 0), 'health.google');
    AK.set('val-avg-rating-health', fmt(round(avg, 1)), 'health.rating');
  }

  // NOTE: All_Service_Feedback1 ("feedback") currently returns 0 records (fields.txt: a clean
  // "no records" response, not a bad report name), so the field names this function reads off
  // it — Call_attended_date, Rating, Company_Name, Added_Time,
  // Any_additional_comments_or_suggestions_would_be_appreciated1 — could not be checked against
  // real data. Every OTHER report in this file that has real data uses proper-case field names
  // (e.g. serviceReports' "Call_Attended_Date"), while these are lowercase ("Call_attended_date")
  // — that inconsistency is suspicious but unconfirmed without live feedback rows. Re-run the
  // "Fields" button once a feedback record exists to confirm or correct these.
  function updateCustomerSatisfaction() {
    const year = TODAY.getFullYear();
    const s = {};
    let totalRatings = 0, totalCount = 0;
    let allRated = [];

    MONTHS.forEach((name, idx) => {
      let mt = 0;
      const rows = [];
      D.feedback.forEach(f => {
        const d = parseDate(f.Call_attended_date);
        if (d && d.getMonth() === idx && d.getFullYear() === year) {
          const r = num(f.Rating);
          if (!isNaN(r) && r > 0 && r <= 5) { mt += r; rows.push(f); }
        }
      });
      const mc = rows.length;
      const avg = mc > 0 ? mt / mc : 0;
      if (mc > 0) { totalRatings += mt; totalCount += mc; }
      s[name] = { average: round(avg, 2), count: mc, rows: rows };
      SRC['sat.' + idx] = rows;
      allRated = allRated.concat(rows);
      drill('sat.' + idx, 'Feedback — ' + MONTH_FULL[idx] + ' ' + year, CFG.reports.feedback,
        COLS.feedback, 'sat.' + idx, 'Feedback rated 1-5 in ' + MONTH_FULL[idx] + ' ' + year);
    });
    const overallAvg = totalCount > 0 ? round(totalRatings / totalCount, 2) : 0;

    SRC.satAll = allRated;
    drill('sat.all', 'Customer Satisfaction Reviews', CFG.reports.feedback, COLS.feedback, 'satAll',
      'All feedback rated 1-5 in ' + year);

    AK.set('satisfaction-title', 'Customer Satisfaction (' + cnt(totalCount) + ' reviews)', 'sat.all');
    AK.set('val-satisfaction-score', fmt(overallAvg), 'sat.all');

    const full = Math.floor(overallAvg), half = (overallAvg - full) >= 0.5;
    let stars = '';
    for (let i = 1; i <= 5; i++) stars += (i <= full || (i === full + 1 && half)) ? '★' : '☆';
    document.getElementById('satisfaction-stars').textContent = stars;

    const barsHtml = MONTHS.map((m, idx) => {
      const d = s[m];
      const pct = Math.max(5, d.average / 5 * 100);
      return `<div class="month-col"><div class="month-track"><div class="month-bar" style="height:${pct}%" data-drill="sat.${idx}">
              <div class="month-tip">${fmt(d.average)} (${cnt(d.count)})</div></div></div><div class="month-name">${m}</div></div>`;
    }).join('');
    document.getElementById('month-bars-container').innerHTML = barsHtml;
    AK.autoBind(document.getElementById('month-bars-container'));

    const complaintRows = D.feedback.filter(f =>
      !blank(f.Company_Name) && !blank(f.Call_attended_date) && (blank(f.Rating) ? 0 : n0(f.Rating)) <= 3);
    SRC.complaintList = complaintRows;
    drill('sat.complaints', 'Recent Complaints', CFG.reports.feedback, COLS.feedback, 'complaintList',
      'Feedback rated 3 or lower with a Company Name and a Call attended date');

    const listHtml = complaintRows.map(f => {
      const txt = f.Any_additional_comments_or_suggestions_would_be_appreciated1;
      return `<div class="complaint-item">
      <div class="complaint-date">${esc(AK.date(f.Call_attended_date) || f.Call_attended_date)}</div>
      <div class="complaint-text">${esc(blank(txt) ? 'No feedback provided!' : txt)} - Customer: ${esc(lkName(f.Company_Name))}</div></div>`;
    }).join('') || AK.emptyPanel('No feedback rated 3 or below has been recorded.', 140);

    document.getElementById('complaints-list').innerHTML = listHtml;
  }

  function updateCrossDept() {
    const start = new Date(TODAY); start.setDate(start.getDate() - 30);
    const rows = D.serviceReports.filter(r => inRange(r.Call_Attended_Date, start, TODAY));
    const pendingRows = rows.filter(r => r.Status === 'Pending For Spares');
    const pct = (rows.length !== 0 && pendingRows.length !== 0) ? pendingRows.length / rows.length * 100 : 0;

    SRC.materialDelay = pendingRows;
    drill('cross.material', 'Calls Delayed by Material Unavailability', CFG.reports.serviceReports,
      COLS.serviceReport, 'materialDelay',
      'Service Reports attended ' + AK.date(start) + ' to ' + AK.date(TODAY) + ' with Status = "Pending For Spares"',
      'No service call in the last 30 days is waiting on spares.');

    AK.set('val-material-unavail', cnt(pendingRows.length), 'cross.material');

    const bar = document.getElementById('val-delay-impact-bar');
    bar.style.width = round(pct, 1) + '%';
    bar.textContent = pctOf(pct);
  }

  function updateCostRevenue() {
    const invoiced = sum(D.invoices, r => n0(r.Final_Total));
    // Complaint cost has no source field yet — the Deluge original never set one.
    const complaint_cost = 0;

    const cpct = invoiced > 0 ? round(complaint_cost / invoiced * 100, 1) : 0;
    const ipct = round(100 - cpct, 1);

    SRC.allInvoices = D.invoices;
    drill('cost.invoiced', 'Invoiced Amount', CFG.reports.invoices, COLS.invoice, 'allInvoices',
      'Final Total summed over every invoice in ' + CFG.reports.invoices);

    AK.set('val-invoiced-amount', rupees(invoiced), 'cost.invoiced');
    AK.set('val-complaint-cost', rupees(complaint_cost));
    document.getElementById('val-cost-revenue-pct').textContent = pctOf(cpct);
    document.getElementById('val-legend-complaint').innerHTML =
      `<span class="dot red"></span> Complaint Cost ${pctOf(cpct)}`;
    document.getElementById('val-legend-invoice').innerHTML =
      `<span class="dot green"></span> Invoiced Amount ${pctOf(ipct)}`;

    AK.mountChart('cost-revenue-chart', {
      chart: { type: 'donut', height: 220, fontFamily: 'Poppins, sans-serif' },
      series: [complaint_cost > 0 ? cpct : 0, ipct],
      labels: ['Complaint Cost', 'Invoiced Amount'],
      colors: ['#ef4444', '#10b981'],
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ['#fff'] },
      plotOptions: { pie: { donut: { size: '62%', labels: { show: false } } } },
      tooltip: { y: { formatter: v => v + '%' } }
    });
  }

  /* Engineer Efficiency Index – mirrors Deluge getEngineerEfficiencyIndex()

     Deluge form / field              -> widget report (CFG.reports key)
     Employees                        -> All_Employees                         (employees)
     Service_Call_Log                 -> Service_Call_Logs                     (callLogs)
     Service_Feedback1                -> All_Service_Feedback1                 (feedback)
     Service_Invoice_Follow_up        -> Service_Invoice_Format                (invoices)
     Expense_of_Engineer              -> Expense_of_Engineer_Report            (expenses)
     Expense_of_Engineer.Material_Replaced1 (subform)
                                      -> Subform_Of_Expense_Of_Engineer1_Report (expenseLines)
  */
  function updateEngineers() {
    const roleKeys = CFG.serviceRoles.map(r => r.trim().toLowerCase());

    // Employees[Department_Role.Add_Department in service_role_list]
    const emps = D.employees.filter(e => roleKeys.indexOf(nameKey(e.Department_Role)) >= 0);

    // Direct-expense lines: use the embedded subform (Material_Replaced1) if the API returned it,
    // otherwise fall back to the separate subform report.
    const expenseLinesOf = x => {
      const embedded = x.Material_Replaced1;
      return (Array.isArray(embedded) && embedded.length) ? embedded : linesOf(x);
    };

    console.groupCollapsed('%c[serviceOverview] Engineer Efficiency Index inputs',
      emps.length ? 'color:#2563eb' : 'color:#b45309;font-weight:bold');
    console.log('employees:', D.employees.length, '| matched service roles:', emps.length);
    console.log('callLogs:', D.callLogs.length, '| feedback:', D.feedback.length,
      '| invoices:', D.invoices.length, '| expenses:', D.expenses.length,
      '| expenseLines:', D.expenseLines.length);
    console.log('roles matched against:', CFG.serviceRoles.join(', '));
    if (!emps.length) {
      console.warn('No employee matched a service role, so the table will be empty. ' +
        'Distinct Department_Role values actually present:',
        [...new Set(D.employees.map(e => nameKey(e.Department_Role)))]);
    }
    console.groupEnd();

    const data = emps.map(emp => {
      // 1. Service completed count (current month)
      const myCalls = D.callLogs.filter(c =>
        sameEngineer(c.Service_Engineer_Name, emp) && inRange(c.Date_field, MONTH_START, TODAY));
      const completed = myCalls.filter(c => c.Status === 'Completed').length;

      // 2. Average customer feedback (current month)
      const ratings = D.feedback
        .filter(f => sameEngineer(f.service_engineer_attended_the_call, emp) &&
                     inRange(f.Call_attended_date, MONTH_START, TODAY))
        .map(f => num(f.Rating)).filter(r => !isNaN(r));
      const avgFeedback = ratings.length ? sum(ratings, r => r) / ratings.length : 0;

      // 3. Delay percentage
      const total = myCalls.length;
      const delayed = myCalls.filter(c => c.Status === 'Pending' || c.Status === 'Draft').length;
      const delayPct = total > 0 ? round(delayed / total * 100, 1) : 0;

      // 4. Cost efficiency = revenue / expenses
      const revenue = sum(
        D.invoices.filter(i => sameEngineer(i.Service_Coordinator, emp) && inRange(i.Date_field, MONTH_START, TODAY)),
        i => n0(i.Final_Total));

      let totalExpenses = 0;
      D.expenses
        .filter(x => sameEngineer(x.Service_Engineer_Name, emp) && inRange(x.Date_field1234567890, MONTH_START, TODAY))
        .forEach(x => {
          expenseLinesOf(x).forEach(l => { totalExpenses += n0(l.Direct_Expense); }); // direct
          totalExpenses += n0(x.Overall_Engineer);                                     // indirect
        });
      const costEff = (totalExpenses > 0 && revenue > 0) ? round(revenue / totalExpenses, 2) : 0;

      // 5. Performance score (weighted)
      const plannedCalls = 50;
      let completionRate = 0;
      if (completed > 0) completionRate = Math.min(100, round(completed / plannedCalls * 100, 1));
      const onTime = total > 0 ? 100 - delayPct : 0;
      const feedbackScore = avgFeedback > 0 ? avgFeedback / 5 * 100 : 0;
      const costScore = costEff > 0 ? Math.min(100, costEff / 1.5 * 100) : 0;

      let score = 0;
      if (total > 0 || revenue > 0 || avgFeedback > 0) {
        score = round(completionRate * 0.30 + feedbackScore * 0.20 + onTime * 0.30 + costScore * 0.20, 1);
      }
      return {
        engineer_name: dispVal(emp.Employee_Name) || '(unnamed)',
        service_completed_count: completed,
        avg_customer_feedback: round(avgFeedback, 1),
        delay_percentage: delayPct,
        cost_efficiency: costEff,
        performance_score: score,
        _calls: myCalls,
        _completed: myCalls.filter(c => c.Status === 'Completed')
      };
    });

    const win = AK.date(MONTH_START) + ' to ' + AK.date(TODAY);
    data.forEach((e, i) => {
      SRC['eng.' + i] = e._completed;
      SRC['engAll.' + i] = e._calls;
      drill('eng.' + i, 'Calls Completed — ' + e.engineer_name, CFG.reports.callLogs, COLS.callLog,
        'eng.' + i, win + ', Status = Completed');
      drill('engAll.' + i, 'All Calls — ' + e.engineer_name, CFG.reports.callLogs, COLS.callLog,
        'engAll.' + i, win);
    });

    const rows = data.map((e, i) => `<tr>
      <td data-drill="engAll.${i}">${esc(e.engineer_name)}</td>
      <td data-drill="eng.${i}">${cnt(e.service_completed_count)}</td>
      <td>${fmt(e.avg_customer_feedback)}</td>
      <td>${pctOf(e.delay_percentage)}</td><td>${fmt(e.cost_efficiency)}</td><td>${fmt(e.performance_score)}</td></tr>`).join('')
      || AK.emptyRow(6, 'No engineers found — no employee has a Department_Role matching ' + CFG.serviceRoles.join(' or ') + '.');

    document.getElementById('engineer-table-body').innerHTML = rows;
    AK.autoBind(document.getElementById('engineer-table-body'));
  }

  function updateRisk() {
    const monthName = MONTH_FULL[TODAY.getMonth()];

    const vehiclesByParent = {};
    D.vehicleLines.forEach(l => { if (!blank(l.Vehicle_No1)) { const p = refId(l.Vehicle_Service_Report); vehiclesByParent[p] = (vehiclesByParent[p] || 0) + 1; } });
    
    let vTotal = 0, vSigned = 0;
    D.vehicle.map(r => ({ r: r, approved: true })).concat(D.vehicleDraft.map(r => ({ r: r, approved: false })))
      .filter(x => sameMonthName(x.r.Month_field, monthName))
      .forEach(x => {
        const rc = vehiclesByParent[String(x.r.ID)] || 0;
        vTotal += rc;
        if (x.approved) vSigned += rc;
      });
    const vehiclePct = vTotal > 0 ? Math.round(vSigned / vTotal * 100) : 0;

    const cal = D.calibration.concat(D.calibrationDraft).filter(c => !blank(c.UUC_E) && inRange(c.Rev_Date, MONTH_START, TODAY));
    const calApproved = cal.filter(c => !blank(c.Approved_By));
    const calPct = cal.length > 0 ? Math.round(calApproved.length / cal.length * 100) : 0;

    const toolsApprovedRows = D.toolsKit.filter(t => sameMonthName(t.Month_field, monthName));
    const toolsDraftRows = D.toolsKitDraft.filter(t => sameMonthName(t.Month_field, monthName));
    const toolsTotal = toolsApprovedRows.length + toolsDraftRows.length;
    const toolsPct = toolsTotal > 0 ? Math.round(toolsApprovedRows.length / toolsTotal * 100) : 0;

    const vehicleRows = D.vehicle.concat(D.vehicleDraft).filter(r => sameMonthName(r.Month_field, monthName));

    SRC.calibration = cal;
    SRC.calibrationApproved = calApproved;
    SRC.tools = toolsApprovedRows.concat(toolsDraftRows);
    SRC.toolsApproved = toolsApprovedRows;
    SRC.vehicle = vehicleRows;
    SRC.inspections = SRC.tools.concat(cal, vehicleRows);

    drill('risk.total', 'Total Inspections', CFG.reports.toolsKit, COLS.monthDoc, 'inspections',
      'Tool kit + calibration + vehicle records for ' + monthName);
    drill('risk.calibration', 'Calibration Records', CFG.reports.calibration, COLS.calibration, 'calibration',
      'Internal calibrations with a UUC/E, Rev Date ' + AK.date(MONTH_START) + ' to ' + AK.date(TODAY));
    drill('risk.calibrationApproved', 'Calibrations Approved', CFG.reports.calibration, COLS.calibration,
      'calibrationApproved', 'Of those, the ones that have an Approved By');
    drill('risk.tools', 'Tools Inspections', CFG.reports.toolsKit, COLS.monthDoc, 'toolsApproved',
      'Approved Production Tool Kit records for ' + monthName);
    drill('risk.vehicle', 'Vehicle Register', CFG.reports.vehicle, COLS.monthDoc, 'vehicle',
      'Vehicle service reports for ' + monthName);

    AK.set('val-total-inspections', cnt(toolsTotal + cal.length + vTotal), 'risk.total');
    AK.set('val-calibration-count', cnt(cal.length), 'risk.calibration');
    AK.set('val-vehicle-register', cnt(vSigned), 'risk.vehicle');

    const riskKeys = ['risk.tools', 'risk.calibrationApproved', 'risk.vehicle'];
    AK.mountChart('risk-bars-chart', {
      chart: {
        type: 'bar', height: 220, fontFamily: 'Poppins, sans-serif', toolbar: { show: false },
        events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill(riskKeys[opts.dataPointIndex]) }
      },
      series: [{ name: 'Compliance', data: [toolsPct, calPct, vehiclePct] }],
      xaxis: { categories: ['Tools Inspection', 'Calibration', 'Vehicle Register Signed'] },
      yaxis: { max: 100 },
      colors: AK.categoricalColors(3),
      plotOptions: { bar: { borderRadius: 4, columnWidth: '50%', distributed: true } },
      legend: { show: false },
      dataLabels: { enabled: true, formatter: v => v + '%' },
      grid: { borderColor: '#e5e7eb' }
    });
  }

  function updateCustomerExperience() {
    const rows = D.feedback.filter(f => !blank(f.Company_Name) && [3, 4, 5].indexOf(num(f.Rating)) >= 0);
    const pos = rows.filter(f => num(f.Rating) > 3);
    const idx = rows.length > 0 ? round(pos.length * 100 / rows.length, 1) : 0;

    SRC.cxBase = rows;
    SRC.cxPositive = pos;
    drill('cx.index', 'Satisfaction Index', CFG.reports.feedback, COLS.feedback, 'cxPositive',
      'Feedback rated 4 or 5, as a share of all feedback rated 3-5');

    AK.mountChart('cx-gauge-chart', {
      chart: { type: 'radialBar', height: 180, fontFamily: 'Poppins, sans-serif' },
      series: [idx],
      colors: [AK.chartColors.good],
      plotOptions: {
        radialBar: {
          hollow: { size: '58%' },
          track: { background: '#e5e7eb' },
          dataLabels: {
            name: { show: false },
            value: { fontSize: '20px', fontWeight: 700, color: '#1f2937', formatter: v => v + '%' }
          }
        }
      }
    });
  }

  function updateRepeatIssues() {
    const groups = {};
    D.serviceReports.filter(r => !blank(r.Product) && num(r.How_Many_Times_Visited) > 1).forEach(r => {
      const p = lkName(r.Product);
      if (p) (groups[p] = groups[p] || []).push(r);
    });
    const top = Object.keys(groups)
      .map(p => ({ product: p, count: groups[p].length, rows: groups[p] }))
      .sort((a, b) => b.count - a.count).slice(0, 3);
    const total = sum(top, t => t.count);
    top.forEach((t, i) => {
      t.percentage = total > 0 ? Math.round(t.count * 100 / total) : 0;
      SRC['repeat.' + i] = t.rows;
      drill('repeat.' + i, 'Repeat Service Calls — ' + t.product, CFG.reports.serviceReports,
        COLS.serviceReport, 'repeat.' + i, 'Service Reports for this product with How_Many_Times_Visited > 1');
    });

    const container = document.getElementById('repeat-issues-container');

    if (top.length === 0) {
      container.innerHTML = `
        <div class="section-title">Top Repeat Issues / Products</div>
        <div class="no-data-container"><div class="no-data-icon"><svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
          <h3 class="no-data-title">No Repeat Issues Found</h3>
          <p class="no-data-message">There are currently no products with repeat service calls. This is a good indicator of service quality!</p></div>
        <div><h3 class="pie-title" style="color:#94a3b8;">Repeat Issues Distribution</h3>
          <div class="pie-chart-empty"><div class="pie-chart-na-text">N/A</div></div>
          <div style="text-align:center;margin-top:15px;font-size:13px;color:#94a3b8;">No data available for visualization</div></div>`;
    } else {
      const colors = ['#ef4444', '#f59e0b', '#10b981'];
      const rowsHtml = top.map((p, i) => `<tr><td>${esc(p.product)}</td>` +
        `<td class="count" data-drill="repeat.${i}">${cnt(p.count)}</td><td>${pctOf(p.percentage, 0)}</td></tr>`).join('');

      const legendHtml = top.map((p, i) => `<span data-drill="repeat.${i}"><span class="dot" style="background:${colors[i]};"></span>${esc(p.product)} (${pctOf(p.percentage, 0)})</span>`).join('');

      container.innerHTML = `
        <div class="section-title">Top Repeat Issues / Products</div>
        <table class="repeat-table"><thead><tr><th>Product / Issue</th><th>Repeat Count</th><th>Percentage</th></tr></thead><tbody>${rowsHtml}</tbody></table>
        <h3 class="pie-title">Repeat Issues Distribution</h3>
        <div id="repeat-issues-chart" style="max-width:220px;margin:0 auto"></div>
        <div class="legend">${legendHtml}</div>`;
      AK.autoBind(container);

      AK.mountChart('repeat-issues-chart', {
        chart: {
          type: 'donut', height: 220, fontFamily: 'Poppins, sans-serif',
          events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill('repeat.' + opts.dataPointIndex) }
        },
        series: top.map(p => p.count),
        labels: top.map(p => p.product),
        colors: colors.slice(0, top.length),
        legend: { show: false },
        dataLabels: { enabled: true, formatter: v => v.toFixed(0) + '%' },
        stroke: { width: 2, colors: ['#fff'] },
        tooltip: { y: { formatter: v => AK.int(v) } }
      });
    }
  }

  function updateInvoiceTrend() {
    const natureByCall = {};
    D.callLogs.forEach(c => { if (!blank(c.Nature_Of_Calls)) natureByCall[String(c.ID)] = lkName(c.Nature_Of_Calls); });

    const totals = { 'AMC': 0, 'Installation': 0, 'Warranty': 0, 'Post Warranty': 0 };
    const buckets = { 'AMC': [], 'Installation': [], 'Warranty': [], 'Post Warranty': [] };
    D.invoices.forEach(inv => {
      const nature = natureByCall[refId(inv.Service_Call_Log)];
      if (nature && Object.prototype.hasOwnProperty.call(totals, nature)) {
        totals[nature] += n0(inv.Final_Total);
        buckets[nature].push(inv);
      }
    });

    const trendMap = [
      ['AMC', 'trend.amc'], ['Installation', 'trend.install'],
      ['Warranty', 'trend.warranty'], ['Post Warranty', 'trend.pw']
    ];
    trendMap.forEach(([nature, key]) => {
      SRC[key] = buckets[nature];
      drill(key, 'Invoice Amount Trend — ' + nature, CFG.reports.invoices, COLS.invoice, key,
        'Invoices whose Service Call Log has Nature of Calls = ' + nature);
    });

    AK.mountChart('invoice-trend-chart', {
      chart: {
        type: 'bar', height: 260, fontFamily: 'Poppins, sans-serif', toolbar: { show: false },
        events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill(trendMap[opts.dataPointIndex][1]) }
      },
      series: [{ name: 'Invoice Amount', data: trendMap.map(([nature]) => totals[nature]) }],
      xaxis: { categories: trendMap.map(([nature]) => nature) },
      colors: AK.categoricalColors(4),
      plotOptions: { bar: { borderRadius: 4, columnWidth: '55%', distributed: true } },
      legend: { show: false },
      dataLabels: { enabled: true, formatter: v => rupees(v) },
      tooltip: { y: { formatter: v => rupees(v) } },
      grid: { borderColor: '#e5e7eb' }
    });
  }

  function updatePieAndGauge() {
    const todayCalls = D.callLogs.filter(c => {
      const d = parseDate(c.Date_field);
      return d && d.getTime() === TODAY.getTime() && !!lkName(c.Repeat_Call_Reason);
    });
    const byReason = name => todayCalls.filter(c => lkName(c.Repeat_Call_Reason) === name);
    const kRows = byReason('Lack of Knowledge');
    const pRows = byReason('Parts Unavailability');
    const wRows = byReason('Power Issue');
    const total = todayCalls.length;

    const pc = n => total > 0 ? n * 100 / total : 0;
    const k = round(pc(kRows.length), 1), p = round(pc(pRows.length), 1), w = round(pc(wRows.length), 1);

    SRC['reason.k'] = kRows; SRC['reason.p'] = pRows; SRC['reason.w'] = wRows;
    drill('reason.k', 'Repeat Calls — Lack of Knowledge', CFG.reports.callLogs, COLS.callLog, 'reason.k',
      "Today's calls with Repeat Call Reason = Lack of Knowledge");
    drill('reason.p', 'Repeat Calls — Parts Unavailability', CFG.reports.callLogs, COLS.callLog, 'reason.p',
      "Today's calls with Repeat Call Reason = Parts Unavailability");
    drill('reason.w', 'Repeat Calls — Power Issue', CFG.reports.callLogs, COLS.callLog, 'reason.w',
      "Today's calls with Repeat Call Reason = Power Issue");

    if (total > 0) {
      AK.mountChart('reason-pie-chart', {
        chart: {
          type: 'donut', height: 200, fontFamily: 'Poppins, sans-serif',
          events: { dataPointSelection: (ev, ctx, opts) => AK.openDrill(['reason.k', 'reason.p', 'reason.w'][opts.dataPointIndex]) }
        },
        series: [k, p, w],
        labels: ['Lack of Knowledge', 'Parts Unavailability', 'Power Issue'],
        colors: ['#3b82f6', '#16a34a', '#f59e0b'],
        legend: { show: false },
        dataLabels: { enabled: false },
        stroke: { width: 2, colors: ['#fff'] },
        tooltip: { y: { formatter: v => v + '%' } }
      });
    } else {
      document.getElementById('reason-pie-chart').innerHTML = AK.emptyPanel('No repeat calls today.', 160);
    }
    document.getElementById('val-reason-k').innerHTML = `<span class="dot" style="background:#3b82f6;"></span>Lack of Knowledge: ${pctOf(k)}`;
    document.getElementById('val-reason-p').innerHTML = `<span class="dot" style="background:#16a34a;"></span>Parts Unavailability: ${pctOf(p)}`;
    document.getElementById('val-reason-w').innerHTML = `<span class="dot" style="background:#f59e0b;"></span>Power Issue: ${pctOf(w)}`;
    AK.bindDrill('val-reason-k', 'reason.k');
    AK.bindDrill('val-reason-p', 'reason.p');
    AK.bindDrill('val-reason-w', 'reason.w');

    const rows = D.feedback.filter(f => !blank(f.Company_Name) && !blank(f.Rating));
    let avg = 0, percentage = 0;
    if (rows.length) {
      avg = round(sum(rows, f => n0(f.Rating)) / rows.length, 1);
      percentage = round(avg / 5 * 100, 1);
    }

    SRC.feedbackTrend = rows;
    drill('gauge.feedback', 'Service Feedback Trend', CFG.reports.feedback, COLS.feedback, 'feedbackTrend',
      'All feedback with a Company Name and a Rating');

    AK.set('val-feedback-avg', `Service Feedback Trend (Avg: ${fmt(avg)}/5)`, 'gauge.feedback');
    AK.mountChart('feedback-gauge-chart', {
      chart: { type: 'radialBar', height: 200, fontFamily: 'Poppins, sans-serif' },
      series: [percentage],
      labels: ['Average'],
      colors: [AK.chartColors.blue],
      plotOptions: {
        radialBar: {
          hollow: { size: '58%' }, startAngle: -90, endAngle: 90,
          track: { background: '#e5e7eb' },
          dataLabels: {
            name: { fontSize: '12px', color: '#6b7280', offsetY: -4 },
            value: { fontSize: '22px', fontWeight: 700, color: '#1f2937', offsetY: 4, formatter: v => v + '%' }
          }
        }
      }
    });
  }

  /* AMC Offer vs Closed – mirrors Deluge getAMCOfferVsClosed() */
  function updateAMC() {
    // Service_Quotation[Customer_Name != null && Nature_of_Calls == "AMC" && Date_field in current month]
    const qCustomer = q => pick(q, ['Customer_Name', 'Customer']);
    const qNature   = q => pick(q, ['Nature_of_Calls', 'Nature_Of_Calls']);
    const qDate     = q => pick(q, ['Date_field', 'Date', 'Quotation_Date', 'Added_Time']);

    const stage1 = D.quotations.filter(q => !blank(qCustomer(q)));
    const stage2 = stage1.filter(q => nameKey(qNature(q)).indexOf('amc') >= 0);
    const quotes = stage2.filter(q => inRange(qDate(q), MONTH_START, TODAY));

    // AMC_Contract[Quotation_Number == service_quot.ID]  (no date filter on contracts)
    const convertedIds = new Set(
      D.amcContracts.map(amcQuotationId).filter(Boolean)
    );

    const closedRows  = quotes.filter(q => convertedIds.has(zohoId(q.ID)));
    const pendingRows = quotes.filter(q => !convertedIds.has(zohoId(q.ID)));
    const total = quotes.length;

    const closed_percent  = total > 0 ? round(closedRows.length  * 100 / total, 1) : 0;
    const pending_percent = total > 0 ? round(pendingRows.length * 100 / total, 1) : 0;

    console.groupCollapsed('%c[serviceOverview] AMC Offer vs Closed',
      total ? 'color:#2563eb' : 'color:#b45309;font-weight:bold');
    console.log('quotations loaded    :', D.quotations.length);
    console.log('with a customer      :', stage1.length);
    console.log('nature contains AMC  :', stage2.length);
    console.log('dated in this month  :', quotes.length,
      '(' + AK.date(MONTH_START) + ' to ' + AK.date(TODAY) + ')');
    console.log('AMC quotation IDs    :', quotes.map(q => zohoId(q.ID)));
    console.log('contract quotation IDs:', [...convertedIds]);
    console.log('sample quotation     :', D.quotations[0]);
    console.log('sample AMC contract  :', D.amcContracts[0]);
    if (!total) {
      console.warn('No AMC quotation matched. Check Nature_of_Calls values and the quotation date field ' +
        '(tried Date_field, Date, Quotation_Date, Added_Time).');
    }
    console.groupEnd();

    SRC.amcOffered = quotes;
    SRC.amcClosed = closedRows;
    SRC.amcPending = pendingRows;
    const win = AK.date(MONTH_START) + ' to ' + AK.date(TODAY);
    drill('amc.offered', 'AMC Offers', CFG.reports.quotations, COLS.quotation, 'amcOffered',
      'Service Quotations ' + win + ' with a Customer and Nature of Calls containing AMC');
    drill('amc.closed', 'AMC Offers Closed', CFG.reports.quotations, COLS.quotation, 'amcClosed',
      'Of those, the quotations that have a matching AMC Contract');
    drill('amc.pending', 'AMC Offers Pending', CFG.reports.quotations, COLS.quotation, 'amcPending',
      'Of those, the quotations with no AMC Contract yet');

    const container = document.getElementById('amc-container');
    if (total > 0) {
      container.innerHTML = `
        <div data-drill="amc.offered" style="max-width:220px;margin:0 auto"><div id="amc-donut-chart"></div></div>
        <div class="legend">
          <div class="legend-item" data-drill="amc.closed"><div class="legend-color" style="background:#10b981;"></div>Closed - ${cnt(closedRows.length)} (${pctOf(closed_percent)})</div>
          <div class="legend-item" data-drill="amc.pending"><div class="legend-color" style="background:#3b82f6;"></div>Pending - ${cnt(pendingRows.length)} (${pctOf(pending_percent)})</div>
        </div>`;
      AK.autoBind(container);
      AK.mountChart('amc-donut-chart', {
        chart: { type: 'donut', height: 220, fontFamily: 'Poppins, sans-serif' },
        series: [closedRows.length, pendingRows.length],
        labels: ['Closed', 'Pending'],
        colors: ['#10b981', '#3b82f6'],
        legend: { show: false },
        dataLabels: { enabled: false },
        stroke: { width: 2, colors: ['#fff'] },
        plotOptions: {
          pie: {
            donut: {
              size: '60%',
              labels: { show: true, total: { show: true, label: 'Total', formatter: () => cnt(total) } }
            }
          }
        }
      });
    } else {
      container.innerHTML = AK.emptyPanel(
        'No AMC quotation was raised between ' + win + '. Check Service_Quotations for Nature of Calls = AMC.', 200);
    }
  }

  /* ------------------------------------------------------------------ MAIN */
  // v2 JS API needs no ZOHO.CREATOR.init() call — the SDK is ready to use as
  // soon as the script has loaded, so the actual proof it loaded is that
  // ZOHO.CREATOR.DATA.getRecords exists, not that .init does.
  async function main() {
    try {
      if (typeof ZOHO === 'undefined' || !ZOHO.CREATOR || !ZOHO.CREATOR.DATA ||
        typeof ZOHO.CREATOR.DATA.getRecords !== 'function') {
        throw new Error('Zoho Creator Widget SDK did not load.');
      }

      try {
        const ip = await ZOHO.CREATOR.UTIL.getInitParams();
        if (ip && ip.appLinkName) APP = ip.appLinkName;
      } catch (_) {}

      const keys = Object.keys(CFG.reports);
      const res = await pool(keys.map(k => () => fetchAll(CFG.reports[k], k)), CFG.concurrency);
      const loadErrors = [];

      res.forEach((r, i) => {
        if (r.ok) D[keys[i]] = r.value;
        else { D[keys[i]] = []; loadErrors.push(CFG.reports[keys[i]] + ' – ' + errMsg(r.error)); }
      });

      if (loadErrors.length) {
        document.getElementById('warn-banner-container').innerHTML =
          `<div class="warn-banner"><b>Some reports could not be loaded — the numbers below are incomplete</b><ul>${loadErrors.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>`;
      }

      updateTiles();
      updateServiceHealth();
      updateCustomerSatisfaction();
      updateCrossDept();
      updateCostRevenue();
      updateEngineers();
      updateRisk();
      updateCustomerExperience();
      updateRepeatIssues();
      updateInvoiceTrend();
      updatePieAndGauge();
      updateAMC();

      document.getElementById('loader-wrap').style.display = 'none';
      document.getElementById('dashboard-container').style.display = 'flex';

      AK.autoBind(document);
      AK.report();
      console.log('%c[serviceOverview] ready — click any count to see the records behind it.',
        'color:#15803d;font-weight:bold');

      // One-time field discovery for every report this dashboard reads — paste the console
      // output back to fix any remaining guessed field name in one pass. Safe to delete once
      // every field in CFG.reports is confirmed against real data.
      AK.discoverAllFields(CFG.reports);

    } catch (e) {
      console.error(e);
      document.getElementById('root').innerHTML =
        `<div class="dashboard"><div class="sec-error">Dashboard failed to load: ${esc(errMsg(e))}</div></div>`;
    }
  }

  main();
})();
