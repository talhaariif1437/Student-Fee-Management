// Students View: Search, Filter, Add & Manage Students
import { formatCurrency } from '../utils.js';
import { getIcon } from '../icons.js';

export function renderStudentsView(state, actions) {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const { students, batches, school, studentSearchQuery = '', studentBatchFilter = 'all' } = state;
  const currency = school.currency || '$';

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          student.rollNo.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                          (student.parentPhone && student.parentPhone.includes(studentSearchQuery));

    const matchesBatch = studentBatchFilter === 'all' || student.batchId === studentBatchFilter;
    return matchesSearch && matchesBatch;
  });

  const batchMap = {};
  batches.forEach(b => batchMap[b.id] = b.name);

  container.innerHTML = `
    <!-- Top Action Row -->
    <div class="section-title-row">
      <div>
        <h2 style="font-size: 18px; font-weight: 800; color: var(--text-primary);">Student Directory</h2>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
          Showing ${filteredStudents.length} of ${students.length} students
        </p>
      </div>
      <button class="toolbar-btn" id="btnAddStudentTop" style="padding: 6px 14px; font-size: 12px;">
        ${getIcon('plus', 16)}
        <span>New Student</span>
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="search-filter-box">
      <div class="search-input-wrapper">
        <span class="search-icon">${getIcon('search', 18)}</span>
        <input type="text" class="search-input" id="studentSearchInput" placeholder="Search by name, roll no, or phone..." value="${studentSearchQuery}">
      </div>

      <!-- Batch Filter Pills -->
      <div class="filter-pills-row">
        <button class="filter-pill ${studentBatchFilter === 'all' ? 'active' : ''}" data-batch="all">All Batches</button>
        ${batches.map(b => `
          <button class="filter-pill ${studentBatchFilter === b.id ? 'active' : ''}" data-batch="${b.id}">${b.name}</button>
        `).join('')}
      </div>
    </div>

    <!-- Student Cards List -->
    ${filteredStudents.length === 0 ? `
      <div class="card" style="text-align: center; padding: 36px 20px;">
        <div style="font-size: 38px; margin-bottom: 8px;">🎓</div>
        <h3 style="font-size: 15px; font-weight: 700;">No Students Found</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 6px 0 14px 0;">
          No student matches your search or selected batch.
        </p>
        <button class="toolbar-btn" id="btnResetStudentSearch" style="margin: 0 auto;">Reset Filter</button>
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${filteredStudents.map(student => {
          const initials = student.name.split(' ').map(n => n[0]).slice(0, 2).join('');
          const batchName = batchMap[student.batchId] || 'Unassigned';
          const cleanPhone = (student.parentPhone || '').replace(/[^0-9]/g, '');

          return `
            <div class="fee-card">
              <div class="fee-card-header">
                <div class="student-meta">
                  <div class="student-avatar">${initials}</div>
                  <div class="student-name-col">
                    <span class="student-title">${student.name}</span>
                    <span class="student-subinfo">
                      <span class="batch-badge">${batchName}</span>
                      <span>• Roll: <strong>${student.rollNo}</strong></span>
                    </span>
                  </div>
                </div>
                <div style="display: flex; gap: 4px;">
                  <button class="header-action-btn btn-edit-student" data-id="${student.id}" title="Edit Student" style="width: 30px; height: 30px;">
                    ${getIcon('edit', 14)}
                  </button>
                  <button class="header-action-btn btn-delete-student" data-id="${student.id}" title="Delete Student" style="width: 30px; height: 30px; color: var(--danger);">
                    ${getIcon('trash', 14)}
                  </button>
                </div>
              </div>

              <!-- Student Info Details -->
              <div class="fee-card-body">
                <div class="fee-amounts">
                  <div class="amount-group">
                    <span class="amount-label">Parent / Phone</span>
                    <span style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin-top: 2px;">
                      ${student.parentName || 'Parent'} (${student.parentPhone || 'No phone'})
                    </span>
                  </div>
                  <div class="amount-group">
                    <span class="amount-label">Monthly Fee</span>
                    <span class="amount-value" style="color: var(--primary);">
                      ${formatCurrency(student.monthlyFee, currency)}
                      ${student.discount > 0 ? `<span style="font-size: 10px; color: var(--success); font-weight: 700;">(-${student.discount} disc)</span>` : ''}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="fee-card-actions">
                <button class="btn-action primary btn-student-ledger" data-id="${student.id}">
                  ${getIcon('ledger', 14)} Full Fee Ledger
                </button>
                <button class="btn-action receipt-btn btn-collect-for-student" data-id="${student.id}">
                  ${getIcon('dollar', 14)} Collect Fee
                </button>
                ${cleanPhone ? `
                  <a href="https://wa.me/${cleanPhone}" target="_blank" class="btn-action whatsapp-btn" title="Chat with Parent on WhatsApp">
                    ${getIcon('whatsapp', 18)}
                  </a>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;

  // Attach search listeners
  const searchInput = document.getElementById('studentSearchInput');
  searchInput?.addEventListener('input', (e) => {
    actions.onSearchStudents(e.target.value);
  });

  // Attach batch filter listeners
  container.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const batchId = btn.getAttribute('data-batch');
      actions.onFilterStudents(batchId);
    });
  });

  document.getElementById('btnAddStudentTop')?.addEventListener('click', () => actions.onOpenAddStudent());
  document.getElementById('btnResetStudentSearch')?.addEventListener('click', () => {
    actions.onSearchStudents('');
    actions.onFilterStudents('all');
  });

  container.querySelectorAll('.btn-student-ledger').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.getAttribute('data-id');
      actions.onViewStudentLedger(studentId);
    });
  });

  container.querySelectorAll('.btn-collect-for-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.getAttribute('data-id');
      actions.onOpenCollectFee(studentId);
    });
  });

  container.querySelectorAll('.btn-edit-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.getAttribute('data-id');
      actions.onOpenEditStudent(studentId);
    });
  });

  container.querySelectorAll('.btn-delete-student').forEach(btn => {
    btn.addEventListener('click', () => {
      const studentId = btn.getAttribute('data-id');
      actions.onDeleteStudent(studentId);
    });
  });
}
