// Defaulters & Overdue Tracker Component
import { formatCurrency, getWhatsAppReminderUrl } from '../utils.js';
import { MONTHS } from '../data.js';
import { getIcon } from '../icons.js';

export function renderDefaultersView(state, actions) {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const { students, batches, school, feeRecords, activeMonth, activeYear } = state;
  const currency = school.currency || '$';
  const monthObj = MONTHS.find(m => m.index === activeMonth) || { name: 'Month' };

  const batchMap = {};
  batches.forEach(b => batchMap[b.id] = b.name);

  // Find all students with pending fees in active month
  const defaulters = [];
  let totalOverdue = 0;

  students.forEach(student => {
    const record = feeRecords.find(r => r.studentId === student.id && r.month === activeMonth && r.year === activeYear);
    const baseFee = student.monthlyFee || 0;
    const discount = record ? (record.discount || 0) : (student.discount || 0);
    const fine = record ? (record.fine || 0) : 0;
    const finalDue = record ? record.finalAmount : Math.max(0, baseFee - discount + fine);
    const paid = record ? (record.paidAmount || 0) : 0;
    const balance = Math.max(0, finalDue - paid);

    if (balance > 0) {
      totalOverdue += balance;
      defaulters.push({
        student,
        record,
        finalDue,
        paid,
        balance,
        status: record ? record.status : 'UNPAID'
      });
    }
  });

  // Sort by highest balance due
  defaulters.sort((a, b) => b.balance - a.balance);

  container.innerHTML = `
    <!-- Defaulters Header Alert Banner -->
    <div class="card" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); color: #ffffff; border: none; padding: 18px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${getIcon('defaulters', 22)}
            <span style="font-size: 17px; font-weight: 800;">Fee Defaulters Alert</span>
          </div>
          <p style="font-size: 12px; color: rgba(255, 255, 255, 0.85); margin-top: 4px;">
            ${monthObj.name} ${activeYear} • Students with unpaid balance
          </p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 900;">${formatCurrency(totalOverdue, currency)}</div>
          <div style="font-size: 11px; background: rgba(0, 0, 0, 0.2); padding: 2px 8px; border-radius: var(--radius-full); margin-top: 2px;">
            ${defaulters.length} Students Pending
          </div>
        </div>
      </div>
    </div>

    ${defaulters.length === 0 ? `
      <div class="card" style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
        <h3 style="font-size: 16px; font-weight: 700; color: var(--success-text);">All Fees Collected!</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 6px 0;">
          No pending fees for ${monthObj.name} ${activeYear}. Great job!
        </p>
      </div>
    ` : `
      <div style="margin-bottom: 12px; font-size: 13px; font-weight: 700; color: var(--text-secondary);">
        Send one-tap WhatsApp reminders to parents:
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${defaulters.map(d => {
          const { student, finalDue, paid, balance, status } = d;
          const initials = student.name.split(' ').map(n => n[0]).slice(0, 2).join('');
          const batchName = batchMap[student.batchId] || 'Unassigned';
          const reminderUrl = getWhatsAppReminderUrl(school, student, balance, monthObj.name, activeYear);

          return `
            <div class="fee-card" style="border-left: 4px solid var(--danger);">
              <div class="fee-card-header">
                <div class="student-meta">
                  <div class="student-avatar" style="background: #fee2e2; color: #b91c1c;">${initials}</div>
                  <div class="student-name-col">
                    <span class="student-title">${student.name}</span>
                    <span class="student-subinfo">
                      <span class="batch-badge">${batchName}</span>
                      <span>Roll: <strong>${student.rollNo}</strong></span>
                    </span>
                  </div>
                </div>
                <span class="status-chip ${status === 'PARTIAL' ? 'partial' : 'unpaid'}">
                  ${status === 'PARTIAL' ? 'Partial Due' : 'Unpaid'}
                </span>
              </div>

              <!-- Parent Info & Amount Due -->
              <div class="fee-card-body">
                <div>
                  <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Parent & Contact</div>
                  <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
                    ${student.parentName || 'Parent'} • ${student.parentPhone || 'No Phone'}
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 10px; color: var(--danger); font-weight: 700; text-transform: uppercase;">Amount Due</div>
                  <div style="font-size: 16px; font-weight: 900; color: var(--danger);">${formatCurrency(balance, currency)}</div>
                  ${paid > 0 ? `<div style="font-size: 10px; color: var(--success); font-weight: 600;">(Paid: ${formatCurrency(paid, currency)})</div>` : ''}
                </div>
              </div>

              <!-- Action buttons -->
              <div class="fee-card-actions">
                <a href="${reminderUrl}" target="_blank" class="btn-action primary" style="background: #25d366;" title="Send WhatsApp message to parent">
                  ${getIcon('whatsapp', 16)} WhatsApp Reminder
                </a>
                <button class="btn-action receipt-btn btn-collect-from-defaulters" data-student-id="${student.id}">
                  ${getIcon('dollar', 14)} Collect Now
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  container.querySelectorAll('.btn-collect-from-defaulters').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.getAttribute('data-student-id');
      actions.onOpenCollectFee(studentId);
    });
  });
}
