// Monthly Fee Ledger View: The Core Monthly Fee Management System
import { formatCurrency, getWhatsAppReminderUrl } from '../utils.js';
import { MONTHS } from '../data.js';
import { getIcon } from '../icons.js';

export function renderFeeLedgerView(state, actions) {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const {
    students,
    batches,
    school,
    feeRecords,
    activeMonth,
    activeYear,
    feeStatusFilter = 'all',
    feeSearchQuery = '',
    feeBatchFilter = 'all'
  } = state;

  const currency = school.currency || '$';
  const monthObj = MONTHS.find(m => m.index === activeMonth) || { name: 'Month' };

  const batchMap = {};
  batches.forEach(b => batchMap[b.id] = b.name);

  // Compile monthly records for all students
  const studentRows = students.map(student => {
    const record = feeRecords.find(r => r.studentId === student.id && r.month === activeMonth && r.year === activeYear);
    const baseFee = student.monthlyFee || 0;
    const discount = record ? (record.discount || 0) : (student.discount || 0);
    const fine = record ? (record.fine || 0) : 0;
    const finalDue = record ? record.finalAmount : Math.max(0, baseFee - discount + fine);
    const paid = record ? (record.paidAmount || 0) : 0;
    const balance = Math.max(0, finalDue - paid);
    const status = record ? record.status : 'UNPAID';

    return {
      student,
      record,
      baseFee,
      discount,
      fine,
      finalDue,
      paid,
      balance,
      status
    };
  });

  // Calculate stats for filter tabs
  const totalStudents = studentRows.length;
  const paidCount = studentRows.filter(r => r.status === 'PAID').length;
  const partialCount = studentRows.filter(r => r.status === 'PARTIAL').length;
  const unpaidCount = studentRows.filter(r => r.status === 'UNPAID').length;

  const totalExpected = studentRows.reduce((acc, r) => acc + r.finalDue, 0);
  const totalCollected = studentRows.reduce((acc, r) => acc + r.paid, 0);
  const totalPending = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Filter rows
  const filteredRows = studentRows.filter(row => {
    const matchesSearch = row.student.name.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
                          row.student.rollNo.toLowerCase().includes(feeSearchQuery.toLowerCase());

    const matchesStatus = feeStatusFilter === 'all' || row.status === feeStatusFilter;
    const matchesBatch = feeBatchFilter === 'all' || row.student.batchId === feeBatchFilter;

    return matchesSearch && matchesStatus && matchesBatch;
  });

  container.innerHTML = `
    <!-- Month Navigation Card -->
    <div class="month-selector-bar">
      <div class="month-picker-header">
        <button class="month-nav-btn" id="btnLedgerPrevMonth">
          ${getIcon('chevronLeft', 20)}
        </button>
        <div class="current-month-display">
          <div class="current-month-text">${monthObj.name} ${activeYear}</div>
          <span class="current-year-badge">Monthly Fee Ledger</span>
        </div>
        <button class="month-nav-btn" id="btnLedgerNextMonth">
          ${getIcon('chevronRight', 20)}
        </button>
      </div>

      <div class="month-financial-grid">
        <div class="financial-metric">
          <span class="metric-label">Expected</span>
          <span class="metric-val">${formatCurrency(totalExpected, currency)}</span>
        </div>
        <div class="financial-metric">
          <span class="metric-label">Collected</span>
          <span class="metric-val collected">${formatCurrency(totalCollected, currency)}</span>
        </div>
        <div class="financial-metric">
          <span class="metric-label">Remaining</span>
          <span class="metric-val pending">${formatCurrency(totalPending, currency)}</span>
        </div>
      </div>

      <div class="collection-progress-wrap">
        <div class="progress-header">
          <span>Fee Status: ${paidCount} Paid • ${partialCount} Partial • ${unpaidCount} Pending</span>
          <span>${collectionRate}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${collectionRate}%;"></div>
        </div>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="search-filter-box">
      <div style="display: flex; gap: 8px;">
        <div class="search-input-wrapper" style="flex: 1;">
          <span class="search-icon">${getIcon('search', 18)}</span>
          <input type="text" class="search-input" id="feeSearchInput" placeholder="Search student name or roll..." value="${feeSearchQuery}">
        </div>
        <button class="toolbar-btn secondary" id="btnExportCSV" title="Export this month ledger to CSV / Excel" style="padding: 0 14px; border-radius: var(--radius-full); font-size: 12px; height: 42px;">
          ${getIcon('download', 16)} CSV
        </button>
      </div>

      <!-- Status Filter Tabs -->
      <div class="filter-pills-row">
        <button class="filter-pill ${feeStatusFilter === 'all' ? 'active' : ''}" data-status="all">
          All (${totalStudents})
        </button>
        <button class="filter-pill ${feeStatusFilter === 'PAID' ? 'active' : ''}" data-status="PAID">
          Paid (${paidCount})
        </button>
        <button class="filter-pill ${feeStatusFilter === 'PARTIAL' ? 'active' : ''}" data-status="PARTIAL">
          Partial (${partialCount})
        </button>
        <button class="filter-pill ${feeStatusFilter === 'UNPAID' ? 'active' : ''}" data-status="UNPAID">
          Pending (${unpaidCount})
        </button>
      </div>

      <!-- Batch Filter Pills -->
      <div class="filter-pills-row">
        <button class="filter-pill ${feeBatchFilter === 'all' ? 'active' : ''}" data-batch="all">All Classes</button>
        ${batches.map(b => `
          <button class="filter-pill ${feeBatchFilter === b.id ? 'active' : ''}" data-batch="${b.id}">${b.name}</button>
        `).join('')}
      </div>
    </div>

    <!-- Student Monthly Fee List -->
    ${filteredRows.length === 0 ? `
      <div class="card" style="text-align: center; padding: 36px 20px;">
        <div style="font-size: 36px; margin-bottom: 8px;">📋</div>
        <h3 style="font-size: 15px; font-weight: 700;">No Fee Records Found</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 6px 0 12px 0;">
          No students match the selected fee status or filter.
        </p>
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${filteredRows.map(row => {
          const { student, record, finalDue, paid, balance, status } = row;
          const initials = student.name.split(' ').map(n => n[0]).slice(0, 2).join('');
          const batchName = batchMap[student.batchId] || 'Unassigned';

          let statusClass = 'unpaid';
          if (status === 'PAID') statusClass = 'paid';
          if (status === 'PARTIAL') statusClass = 'partial';

          const reminderUrl = getWhatsAppReminderUrl(school, student, balance, monthObj.name, activeYear);

          return `
            <div class="fee-card">
              <div class="fee-card-header">
                <div class="student-meta">
                  <div class="student-avatar">${initials}</div>
                  <div class="student-name-col">
                    <span class="student-title">${student.name}</span>
                    <span class="student-subinfo">
                      <span class="batch-badge">${batchName}</span>
                      <span>Roll: <strong>${student.rollNo}</strong></span>
                    </span>
                  </div>
                </div>
                <div>
                  <span class="status-chip ${statusClass}">${status}</span>
                </div>
              </div>

              <!-- Financial breakdown bar -->
              <div class="fee-card-body">
                <div class="fee-amounts" style="width: 100%; justify-content: space-between;">
                  <div class="amount-group">
                    <span class="amount-label">Fee Due</span>
                    <span class="amount-value">${formatCurrency(finalDue, currency)}</span>
                  </div>
                  <div class="amount-group">
                    <span class="amount-label">Paid</span>
                    <span class="amount-value paid-val">${formatCurrency(paid, currency)}</span>
                  </div>
                  <div class="amount-group">
                    <span class="amount-label">Remaining</span>
                    <span class="amount-value ${balance > 0 ? 'due' : ''}">${formatCurrency(balance, currency)}</span>
                  </div>
                </div>
              </div>

              ${record && record.paymentDate ? `
                <div style="font-size: 11px; color: var(--text-secondary); display: flex; justify-content: space-between; padding: 0 4px;">
                  <span>Paid on: <strong>${record.paymentDate}</strong> via ${record.paymentMode || 'Cash'}</span>
                  <span>Rcpt: <strong>${record.receiptNo || '-'}</strong></span>
                </div>
              ` : ''}

              <!-- Action buttons -->
              <div class="fee-card-actions">
                ${status !== 'PAID' ? `
                  <button class="btn-action primary btn-collect-payment" data-student-id="${student.id}">
                    ${getIcon('dollar', 14)} Collect Fee
                  </button>
                  <button class="btn-action receipt-btn btn-quick-pay" data-student-id="${student.id}" title="Quick 1-tap full payment">
                    ${getIcon('check', 14)} Full Pay
                  </button>
                  <a href="${reminderUrl}" target="_blank" class="btn-action whatsapp-btn" title="Send WhatsApp Fee Reminder">
                    ${getIcon('whatsapp', 18)}
                  </a>
                ` : `
                  <button class="btn-action receipt-btn btn-view-receipt" data-record-id="${record ? record.id : ''}" style="flex: 2;">
                    ${getIcon('printer', 14)} Print Receipt / Voucher
                  </button>
                  <button class="btn-action primary btn-collect-payment" data-student-id="${student.id}" style="flex: 1;" title="Edit payment or add fine">
                    ${getIcon('edit', 14)} Edit
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  // Attach Month switchers
  document.getElementById('btnLedgerPrevMonth')?.addEventListener('click', actions.onPrevMonth);
  document.getElementById('btnLedgerNextMonth')?.addEventListener('click', actions.onNextMonth);

  // Attach search
  document.getElementById('feeSearchInput')?.addEventListener('input', (e) => {
    actions.onSearchFee(e.target.value);
  });

  // Attach CSV export
  document.getElementById('btnExportCSV')?.addEventListener('click', () => {
    actions.onExportCSV();
  });

  // Attach Status filter tabs
  container.querySelectorAll('.filter-pills-row button[data-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      const status = btn.getAttribute('data-status');
      actions.onFilterFeeStatus(status);
    });
  });

  // Attach Batch filter tabs
  container.querySelectorAll('.filter-pills-row button[data-batch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const batchId = btn.getAttribute('data-batch');
      actions.onFilterFeeBatch(batchId);
    });
  });

  // Attach Collect Payment
  container.querySelectorAll('.btn-collect-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.getAttribute('data-student-id');
      actions.onOpenCollectFee(studentId);
    });
  });

  // Attach Quick 1-tap Pay
  container.querySelectorAll('.btn-quick-pay').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.getAttribute('data-student-id');
      actions.onQuickPay(studentId);
    });
  });

  // Attach Receipt
  container.querySelectorAll('.btn-view-receipt').forEach(btn => {
    btn.addEventListener('click', () => {
      const recordId = btn.getAttribute('data-record-id');
      actions.onOpenReceipt(recordId);
    });
  });
}
