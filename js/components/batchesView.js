// Batches View: Create & Manage School Batches / Classes
import { formatCurrency } from '../utils.js';
import { getIcon } from '../icons.js';

export function renderBatchesView(state, actions) {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const { batches, students, feeRecords, activeMonth, activeYear, school } = state;
  const currency = school.currency || '$';

  container.innerHTML = `
    <div class="section-title-row" style="margin-bottom: 14px;">
      <div>
        <h2 style="font-size: 18px; font-weight: 800; color: var(--text-primary);">School Batches</h2>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
          ${batches.length} Batches • Total Enrolled: ${students.length} Students
        </p>
      </div>
      <button class="toolbar-btn" id="btnAddBatchTop" style="padding: 6px 14px; font-size: 12px;">
        ${getIcon('plus', 16)}
        <span>New Batch</span>
      </button>
    </div>

    ${batches.length === 0 ? `
      <div class="card" style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 40px; margin-bottom: 10px;">🏫</div>
        <h3 style="font-size: 16px; font-weight: 700;">No Batches Created Yet</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 6px 0 16px 0;">
          Create your first batch or grade to start enrolling students.
        </p>
        <button class="toolbar-btn" id="btnAddBatchEmpty" style="margin: 0 auto;">
          ${getIcon('plus', 16)} Add First Batch
        </button>
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${batches.map(batch => {
          const batchStudents = students.filter(s => String(s.batchId) === String(batch.id));
          let bExpected = 0;
          let bCollected = 0;

          batchStudents.forEach(s => {
            const rec = feeRecords.find(r => String(r.studentId) === String(s.id) && Number(r.month) === Number(activeMonth) && Number(r.year) === Number(activeYear));
            const feeDue = rec ? rec.finalAmount : (s.monthlyFee - (s.discount || 0));
            const paid = rec ? rec.paidAmount : 0;
            bExpected += feeDue;
            bCollected += paid;
          });

          const rate = bExpected > 0 ? Math.round((bCollected / bExpected) * 100) : 0;

          return `
            <div class="card" style="border-left: 5px solid ${batch.color || '#4f46e5'};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary);">${batch.name}</h3>
                  <div style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                    <span class="batch-badge">Grade ${batch.grade || '-'} (Sec ${batch.section || 'A'})</span>
                    <span>Teacher: ${batch.incharge || 'Not Assigned'}</span>
                  </div>
                </div>
                <div style="display: flex; gap: 4px;">
                  <button class="header-action-btn btn-edit-batch" data-id="${batch.id}" title="Edit Batch" style="width: 30px; height: 30px;">
                    ${getIcon('edit', 14)}
                  </button>
                  <button class="header-action-btn btn-delete-batch" data-id="${batch.id}" title="Delete Batch" style="width: 30px; height: 30px; color: var(--danger);">
                    ${getIcon('trash', 14)}
                  </button>
                </div>
              </div>

              <!-- Batch Financial & Student Metrics -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: var(--surface-bg); padding: 8px 10px; border-radius: var(--radius-sm); margin: 8px 0; text-align: center;">
                <div>
                  <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Students</div>
                  <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">${batchStudents.length}</div>
                </div>
                <div>
                  <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Standard Fee</div>
                  <div style="font-size: 14px; font-weight: 800; color: var(--text-primary);">${formatCurrency(batch.defaultFee, currency)}/mo</div>
                </div>
                <div>
                  <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Month Rev</div>
                  <div style="font-size: 14px; font-weight: 800; color: var(--success);">${formatCurrency(bCollected, currency)}</div>
                </div>
              </div>

              <!-- Progress bar -->
              <div style="margin: 6px 0 10px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-bottom: 3px;">
                  <span>Monthly Collection Rate</span>
                  <span>${rate}% (${formatCurrency(bCollected, currency)} / ${formatCurrency(bExpected, currency)})</span>
                </div>
                <div style="height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                  <div style="height: 100%; width: ${rate}%; background: ${batch.color || '#4f46e5'};"></div>
                </div>
              </div>

              <!-- Action buttons -->
              <div style="display: flex; gap: 8px;">
                <button class="btn-action primary btn-add-student-to-batch" data-batch-id="${batch.id}">
                  ${getIcon('plus', 14)} Enroll Student
                </button>
                <button class="btn-action receipt-btn btn-view-batch-students" data-batch-id="${batch.id}">
                  ${getIcon('users', 14)} View Students
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  document.getElementById('btnAddBatchTop')?.addEventListener('click', actions.onOpenAddBatch);
  document.getElementById('btnAddBatchEmpty')?.addEventListener('click', actions.onOpenAddBatch);

  container.querySelectorAll('.btn-add-student-to-batch').forEach(btn => {
    btn.addEventListener('click', () => {
      const batchId = btn.getAttribute('data-batch-id');
      actions.onOpenAddStudent(batchId);
    });
  });

  container.querySelectorAll('.btn-view-batch-students').forEach(btn => {
    btn.addEventListener('click', () => {
      const batchId = btn.getAttribute('data-batch-id');
      actions.onFilterStudentsByBatch(batchId);
    });
  });

  container.querySelectorAll('.btn-edit-batch').forEach(btn => {
    btn.addEventListener('click', () => {
      const batchId = btn.getAttribute('data-id');
      actions.onOpenEditBatch(batchId);
    });
  });

  container.querySelectorAll('.btn-delete-batch').forEach(btn => {
    btn.addEventListener('click', () => {
      const batchId = btn.getAttribute('data-id');
      actions.onDeleteBatch(batchId);
    });
  });
}
