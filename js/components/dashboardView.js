// Dashboard View Component: School Financial Overview & Analytics
import { formatCurrency } from '../utils.js';
import { MONTHS } from '../data.js';
import { getIcon } from '../icons.js';

export function renderDashboardView(state, actions) {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const { school, batches, students, feeRecords, activeMonth, activeYear } = state;
  const currency = school.currency || '$';
  const monthObj = MONTHS.find(m => m.index === activeMonth) || { name: 'Month' };

  // Calculate monthly stats
  let totalExpected = 0;
  let totalCollected = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  students.forEach(student => {
    const record = feeRecords.find(r => r.studentId === student.id && r.month === activeMonth && r.year === activeYear);
    const baseFee = student.monthlyFee || 0;
    const discount = record ? (record.discount || 0) : (student.discount || 0);
    const feeDue = record ? record.finalAmount : Math.max(0, baseFee - discount);
    const paid = record ? (record.paidAmount || 0) : 0;

    totalExpected += feeDue;
    totalCollected += paid;

    if (!record || record.status === 'UNPAID') {
      unpaidCount++;
    } else if (record.status === 'PAID') {
      paidCount++;
    } else if (record.status === 'PARTIAL') {
      partialCount++;
    }
  });

  const totalOutstanding = Math.max(0, totalExpected - totalCollected);
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Batch breakdown stats
  const batchStats = batches.map(batch => {
    const batchStudents = students.filter(s => s.batchId === batch.id);
    let bExpected = 0;
    let bCollected = 0;
    batchStudents.forEach(s => {
      const rec = feeRecords.find(r => r.studentId === s.id && r.month === activeMonth && r.year === activeYear);
      const feeDue = rec ? rec.finalAmount : (s.monthlyFee - (s.discount || 0));
      const paid = rec ? rec.paidAmount : 0;
      bExpected += feeDue;
      bCollected += paid;
    });
    const rate = bExpected > 0 ? Math.round((bCollected / bExpected) * 100) : 0;
    return { ...batch, studentCount: batchStudents.length, expected: bExpected, collected: bCollected, rate };
  });

  // Recent payments
  const recentPayments = [...feeRecords]
    .filter(r => r.paidAmount > 0 && r.paymentDate)
    .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    .slice(0, 4);

  container.innerHTML = `
    <!-- Month Selector & KPI Card -->
    <div class="month-selector-bar">
      <div class="month-picker-header">
        <button class="month-nav-btn" id="btnPrevMonth" title="Previous Month">
          ${getIcon('chevronLeft', 20)}
        </button>
        <div class="current-month-display">
          <div class="current-month-text">${monthObj.name}</div>
          <span class="current-year-badge">${activeYear} • Due Day: ${school.feeDueDay || '10'}th</span>
        </div>
        <button class="month-nav-btn" id="btnNextMonth" title="Next Month">
          ${getIcon('chevronRight', 20)}
        </button>
      </div>

      <!-- 3 Key Financial Metrics -->
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
          <span class="metric-label">Pending</span>
          <span class="metric-val pending">${formatCurrency(totalOutstanding, currency)}</span>
        </div>
      </div>

      <!-- Collection Progress -->
      <div class="collection-progress-wrap">
        <div class="progress-header">
          <span>Fee Collection Rate</span>
          <span>${collectionRate}% (${paidCount} Paid / ${students.length} Total)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${collectionRate}%;"></div>
        </div>
      </div>
    </div>

    <!-- Quick Action / Status Pills -->
    <div class="card" style="padding: 12px 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; gap: 8px;">
          <span class="status-chip paid">${paidCount} Paid</span>
          <span class="status-chip partial">${partialCount} Partial</span>
          <span class="status-chip unpaid">${unpaidCount} Pending</span>
        </div>
        <button class="section-action" id="btnGoLedger">Manage Fees →</button>
      </div>
    </div>

    <!-- Batch Performance Snapshot -->
    <div class="card">
      <div class="section-title-row">
        <span class="section-title">
          ${getIcon('school', 18)}
          <span>Batches Collection Rate</span>
        </span>
        <button class="section-action" id="btnGoBatches">All Batches</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${batchStats.map(b => `
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 4px;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: ${b.color || '#4f46e5'}"></span>
                <span>${b.name}</span>
                <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">(${b.studentCount} students)</span>
              </span>
              <span>${formatCurrency(b.collected, currency)} / ${formatCurrency(b.expected, currency)} (${b.rate}%)</span>
            </div>
            <div style="height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden;">
              <div style="height: 100%; width: ${b.rate}%; background: ${b.color || '#4f46e5'}; border-radius: 99px;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Recent Payment Collections -->
    <div class="card">
      <div class="section-title-row">
        <span class="section-title">
          ${getIcon('receipt', 18)}
          <span>Recent Collections</span>
        </span>
      </div>
      ${recentPayments.length === 0 ? `
        <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px;">
          No fee payments recorded yet. Click '+' to record a fee!
        </div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${recentPayments.map(p => {
            const student = students.find(s => s.id === p.studentId) || { name: 'Student', rollNo: 'N/A' };
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: var(--surface-bg); border-radius: var(--radius-sm);">
                <div>
                  <div style="font-size: 13px; font-weight: 700;">${student.name}</div>
                  <div style="font-size: 11px; color: var(--text-secondary);">
                    Roll: ${student.rollNo} • ${p.paymentMode || 'Cash'} • ${p.receiptNo || 'Receipt'}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 13px; font-weight: 800; color: var(--success);">${formatCurrency(p.paidAmount, currency)}</div>
                  <button class="btn-view-receipt" data-record-id="${p.id}" style="font-size: 11px; color: var(--primary); background: none; border: none; font-weight: 700; cursor: pointer;">
                    View Slip
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  // Attach event handlers
  document.getElementById('btnPrevMonth')?.addEventListener('click', actions.onPrevMonth);
  document.getElementById('btnNextMonth')?.addEventListener('click', actions.onNextMonth);
  document.getElementById('btnGoLedger')?.addEventListener('click', () => actions.onNavigate('ledger'));
  document.getElementById('btnGoBatches')?.addEventListener('click', () => actions.onNavigate('batches'));

  container.querySelectorAll('.btn-view-receipt').forEach(btn => {
    btn.addEventListener('click', () => {
      const recId = btn.getAttribute('data-record-id');
      actions.onOpenReceipt(recId);
    });
  });
}
