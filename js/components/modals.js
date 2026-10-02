// Modals & Bottom Sheets: Collect Payment, Add Student, Add Batch, School Profile, and Receipts
import { formatCurrency, generateReceiptNo, getWhatsAppReceiptUrl, formatDate } from '../utils.js';
import { MONTHS } from '../data.js';
import { getIcon } from '../icons.js';
import { generateAndDownloadReceiptPDF } from '../pdfService.js';

export function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    const sheet = document.getElementById('modalSheet');
    if (sheet) sheet.innerHTML = '';
  }
}

// 1. Collect Fee Payment Bottom Sheet Modal
export function openCollectFeeModal(state, studentId, onSave, targetMonth = null, targetYear = null) {
  const overlay = document.getElementById('modalOverlay');
  const sheet = document.getElementById('modalSheet');
  if (!overlay || !sheet) return;

  const { students, batches, school, feeRecords } = state;
  const payMonthNum = targetMonth !== null ? Number(targetMonth) : state.activeMonth;
  const payYearNum = targetYear !== null ? Number(targetYear) : state.activeYear;

  const currency = school.currency || '$';
  const student = students.find(s => String(s.id).trim() === String(studentId).trim());
  if (!student) {
    alert('Student record not found');
    return;
  }

  const batch = batches.find(b => String(b.id) === String(student.batchId)) || { name: 'General' };
  const existingRecord = feeRecords.find(r => String(r.studentId) === String(student.id) && Number(r.month) === payMonthNum && Number(r.year) === payYearNum);

  const baseFee = student.monthlyFee || 0;
  const initDiscount = existingRecord ? (existingRecord.discount || 0) : (student.discount || 0);
  const initFine = existingRecord ? (existingRecord.fine || 0) : 0;
  const initFinalDue = existingRecord ? existingRecord.finalAmount : Math.max(0, baseFee - initDiscount + initFine);
  const initPaid = existingRecord ? (existingRecord.paidAmount || 0) : initFinalDue;
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultReceipt = existingRecord && existingRecord.receiptNo ? existingRecord.receiptNo : generateReceiptNo(payYearNum, payMonthNum);

  sheet.innerHTML = `
    <div class="modal-drag-handle"></div>
    <div class="modal-title-row">
      <div class="modal-title">Collect Fee Payment</div>
      <button class="modal-close-btn" id="btnModalClose">${getIcon('close', 18)}</button>
    </div>

    <!-- Student details banner -->
    <div style="background: var(--surface-bg); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 14px; border: 1px solid var(--surface-border);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 800; font-size: 15px;">${student.name}</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
            Roll: <strong>${student.rollNo}</strong> • ${batch.name}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Standard Fee</div>
          <div style="font-weight: 800; font-size: 14px; color: var(--primary);">${formatCurrency(baseFee, currency)}</div>
        </div>
      </div>
    </div>

    <form id="feePaymentForm">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Month</label>
          <select class="form-select" id="payMonth">
            ${MONTHS.map(m => `
              <option value="${m.index}" ${m.index === payMonthNum ? 'selected' : ''}>${m.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Year</label>
          <input type="number" class="form-input" id="payYear" value="${payYearNum}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Discount / Concession</label>
          <input type="number" class="form-input" id="payDiscount" value="${initDiscount}" min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Late Fine (if any)</label>
          <input type="number" class="form-input" id="payFine" value="${initFine}" min="0">
        </div>
      </div>

      <div class="form-group" style="background: #f8fafc; padding: 10px; border-radius: var(--radius-sm); border: 1px dashed #cbd5e1;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700;">
          <span>Net Fee Due:</span>
          <span id="displayNetDue" style="color: var(--text-primary); font-size: 15px;">${formatCurrency(initFinalDue, currency)}</span>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Amount Paying Now</label>
          <input type="number" class="form-input" id="payAmount" value="${initPaid}" min="0" required style="font-size: 16px; font-weight: 800; color: var(--success-text);">
        </div>
        <div class="form-group">
          <label class="form-label">Payment Date</label>
          <input type="date" class="form-input" id="payDate" value="${existingRecord && existingRecord.paymentDate ? existingRecord.paymentDate : todayStr}" required>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Payment Method</label>
          <select class="form-select" id="payMode">
            <option value="Cash" ${existingRecord && existingRecord.paymentMode === 'Cash' ? 'selected' : ''}>Cash</option>
            <option value="Online Banking" ${existingRecord && existingRecord.paymentMode === 'Online Banking' ? 'selected' : ''}>Online Banking / Transfer</option>
            <option value="Mobile Wallet (EasyPaisa/JazzCash)" ${existingRecord && existingRecord.paymentMode?.includes('Wallet') ? 'selected' : ''}>Mobile Wallet (EasyPaisa/JazzCash)</option>
            <option value="Card / POS" ${existingRecord && existingRecord.paymentMode === 'Card / POS' ? 'selected' : ''}>Credit / Debit Card</option>
            <option value="Cheque" ${existingRecord && existingRecord.paymentMode === 'Cheque' ? 'selected' : ''}>Cheque</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Receipt Number</label>
          <input type="text" class="form-input" id="payReceiptNo" value="${defaultReceipt}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Remarks / Note</label>
        <input type="text" class="form-input" id="payRemarks" placeholder="e.g. Paid in full at school office" value="${existingRecord ? (existingRecord.remarks || '') : ''}">
      </div>

      <button type="submit" class="btn-submit">
        ${getIcon('check', 18)} Record & Confirm Payment
      </button>
    </form>
  `;

  overlay.classList.remove('hidden');

  // Real-time Net Due calculation
  const discountInput = document.getElementById('payDiscount');
  const fineInput = document.getElementById('payFine');
  const displayNetDue = document.getElementById('displayNetDue');

  const recalculate = () => {
    const disc = Number(discountInput?.value) || 0;
    const fine = Number(fineInput?.value) || 0;
    const net = Math.max(0, baseFee - disc + fine);
    if (displayNetDue) displayNetDue.innerText = formatCurrency(net, currency);
  };

  discountInput?.addEventListener('input', recalculate);
  fineInput?.addEventListener('input', recalculate);

  document.getElementById('btnModalClose')?.addEventListener('click', closeModal);

  document.getElementById('feePaymentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const month = Number(document.getElementById('payMonth').value);
    const year = Number(document.getElementById('payYear').value);
    const discount = Number(document.getElementById('payDiscount').value) || 0;
    const fine = Number(document.getElementById('payFine').value) || 0;
    const finalAmount = Math.max(0, baseFee - discount + fine);
    const paidAmount = Number(document.getElementById('payAmount').value) || 0;
    const paymentDate = document.getElementById('payDate').value;
    const paymentMode = document.getElementById('payMode').value;
    const receiptNo = document.getElementById('payReceiptNo').value.trim() || generateReceiptNo(year, month);
    const remarks = document.getElementById('payRemarks').value.trim();

    let status = 'UNPAID';
    if (paidAmount >= finalAmount && finalAmount > 0) {
      status = 'PAID';
    } else if (paidAmount > 0) {
      status = 'PARTIAL';
    }

    const record = {
      id: existingRecord ? existingRecord.id : `fee-${student.id}-${year}-${month}`,
      studentId: student.id,
      month,
      year,
      baseAmount: baseFee,
      discount,
      fine,
      finalAmount,
      paidAmount,
      status,
      paymentDate,
      paymentMode,
      receiptNo,
      remarks
    };

    closeModal();
    onSave(record);
  });
}

// 1.1 Confirm Full Quick Payment Modal (1-Tap Settle)
export function openQuickPayModal(state, studentId, onSave) {
  const overlay = document.getElementById('modalOverlay');
  const sheet = document.getElementById('modalSheet');
  if (!overlay || !sheet) return;

  const { students, batches, school, feeRecords, activeMonth, activeYear } = state;
  const currency = school.currency || '$';
  const student = students.find(s => String(s.id).trim() === String(studentId).trim());
  if (!student) {
    alert('Student record not found');
    return;
  }

  const batch = batches.find(b => String(b.id) === String(student.batchId)) || { name: 'General' };
  const existingRecord = feeRecords.find(r => String(r.studentId) === String(student.id) && Number(r.month) === activeMonth && Number(r.year) === activeYear);

  const monthObj = MONTHS.find(m => m.index === activeMonth) || { name: 'Month' };
  const baseFee = student.monthlyFee || 0;
  const discount = existingRecord ? (existingRecord.discount || 0) : (student.discount || 0);
  const fine = existingRecord ? (existingRecord.fine || 0) : 0;
  const finalDue = existingRecord ? existingRecord.finalAmount : Math.max(0, baseFee - discount + fine);
  const alreadyPaid = existingRecord ? (existingRecord.paidAmount || 0) : 0;
  const amountToPay = Math.max(0, finalDue - alreadyPaid);

  sheet.innerHTML = `
    <div class="modal-drag-handle"></div>
    <div class="modal-title-row">
      <div class="modal-title">Confirm Full Payment</div>
      <button class="modal-close-btn" id="btnModalClose">${getIcon('close', 18)}</button>
    </div>

    <div style="background: var(--surface-bg); padding: 14px; border-radius: var(--radius-sm); margin-bottom: 16px; border: 1px solid var(--surface-border);">
      <div style="font-weight: 800; font-size: 16px; color: var(--text-primary);">${student.name}</div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-top: 3px;">
        Roll: <strong>${student.rollNo}</strong> • Class: <strong>${batch.name}</strong>
      </div>
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; color: var(--text-secondary);">Fee Month:</span>
        <strong style="font-size: 14px; color: var(--primary);">${monthObj.name} ${activeYear}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
        <span style="font-size: 13px; color: var(--text-secondary);">Full Amount Due:</span>
        <strong style="font-size: 20px; color: var(--success);">${formatCurrency(amountToPay, currency)}</strong>
      </div>
    </div>

    <form id="quickPayForm">
      <div class="form-group">
        <label class="form-label">Payment Mode</label>
        <select class="form-select" id="quickPayMode">
          <option value="Cash">Cash</option>
          <option value="Online Banking">Online Banking / Bank Transfer</option>
          <option value="Mobile Wallet (EasyPaisa/JazzCash)">EasyPaisa / JazzCash</option>
          <option value="Card">Card</option>
        </select>
      </div>

      <div style="display: flex; gap: 10px; margin-top: 18px;">
        <button type="button" class="btn-action receipt-btn" id="btnCancelQuickPay" style="flex: 1; padding: 12px;">
          Cancel
        </button>
        <button type="submit" class="btn-action primary" style="flex: 2; padding: 12px; background: var(--success); font-size: 14px;">
          ${getIcon('check', 18)} Mark as Paid (${formatCurrency(amountToPay, currency)})
        </button>
      </div>
    </form>
  `;

  overlay.classList.remove('hidden');
  document.getElementById('btnModalClose')?.addEventListener('click', closeModal);
  document.getElementById('btnCancelQuickPay')?.addEventListener('click', closeModal);

  document.getElementById('quickPayForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const mode = document.getElementById('quickPayMode').value;
    const record = {
      id: existingRecord ? existingRecord.id : `fee-${student.id}-${activeYear}-${activeMonth}`,
      studentId: student.id,
      month: activeMonth,
      year: activeYear,
      baseAmount: baseFee,
      discount,
      fine,
      finalAmount: finalDue,
      paidAmount: finalDue,
      status: 'PAID',
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: mode,
      receiptNo: existingRecord?.receiptNo || generateReceiptNo(activeYear, activeMonth),
      remarks: 'Full quick cash settlement'
    };
    closeModal();
    onSave(record);
  });
}

// 2. Printable Fee Receipt Modal with Instant WhatsApp Share
export function openReceiptModal(state, recordId) {
  const overlay = document.getElementById('modalOverlay');
  const sheet = document.getElementById('modalSheet');
  if (!overlay || !sheet) return;

  const { students, batches, school, feeRecords } = state;
  const currency = school.currency || '$';
  const record = feeRecords.find(r => String(r.id).trim() === String(recordId).trim());
  if (!record) {
    alert('Receipt record not found');
    return;
  }

  const student = students.find(s => String(s.id).trim() === String(record.studentId).trim()) || { name: 'Student', rollNo: 'N/A' };
  const batch = batches.find(b => String(b.id) === String(student.batchId)) || { name: 'General' };
  const monthObj = MONTHS.find(m => m.index === record.month) || { name: 'Month' };
  const balance = Math.max(0, (record.finalAmount || 0) - (record.paidAmount || 0));
  const whatsappUrl = getWhatsAppReceiptUrl(school, student, record, monthObj.name);

  sheet.innerHTML = `
    <div class="modal-drag-handle"></div>
    <div class="modal-title-row">
      <div class="modal-title">Fee Receipt Voucher</div>
      <button class="modal-close-btn" id="btnModalClose">${getIcon('close', 18)}</button>
    </div>

    <!-- Official Printable Paper Slip -->
    <div class="receipt-paper" id="printableReceipt">
      <div class="receipt-header">
        <div class="receipt-school-name">${school.name}</div>
        <div class="receipt-school-sub">${school.tagline || ''}</div>
        <div class="receipt-school-sub">${school.address || ''} • Tel: ${school.phone || ''}</div>
        <div class="receipt-badge">FEE RECEIPT (STUDENT COPY)</div>
      </div>

      <div class="receipt-grid">
        <div class="receipt-line">
          <span>Receipt No:</span>
          <strong>${record.receiptNo || 'N/A'}</strong>
        </div>
        <div class="receipt-line">
          <span>Date:</span>
          <strong>${formatDate(record.paymentDate)}</strong>
        </div>
        <div class="receipt-line">
          <span>Student Name:</span>
          <strong>${student.name}</strong>
        </div>
        <div class="receipt-line">
          <span>Roll No:</span>
          <strong>${student.rollNo}</strong>
        </div>
        <div class="receipt-line">
          <span>Batch / Class:</span>
          <strong>${batch.name}</strong>
        </div>
        <div class="receipt-line">
          <span>Fee Month:</span>
          <strong>${monthObj.name} ${record.year}</strong>
        </div>
      </div>

      <div class="receipt-grid">
        <div class="receipt-line">
          <span>Tuition Fee:</span>
          <span>${formatCurrency(record.baseAmount, currency)}</span>
        </div>
        ${record.discount > 0 ? `
          <div class="receipt-line" style="color: var(--success-text);">
            <span>Concession/Discount:</span>
            <span>-${formatCurrency(record.discount, currency)}</span>
          </div>
        ` : ''}
        ${record.fine > 0 ? `
          <div class="receipt-line" style="color: var(--danger);">
            <span>Late Fine:</span>
            <span>+${formatCurrency(record.fine, currency)}</span>
          </div>
        ` : ''}
        <div class="receipt-line bold" style="border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 4px;">
          <span>Net Amount Due:</span>
          <span>${formatCurrency(record.finalAmount, currency)}</span>
        </div>
        <div class="receipt-line bold" style="color: var(--success); font-size: 15px;">
          <span>Amount Paid:</span>
          <span>${formatCurrency(record.paidAmount, currency)}</span>
        </div>
        <div class="receipt-line">
          <span>Payment Mode:</span>
          <span>${record.paymentMode || 'Cash'}</span>
        </div>
        <div class="receipt-line" style="color: ${balance > 0 ? 'var(--danger)' : 'var(--text-secondary)'}; font-weight: 700;">
          <span>Remaining Balance:</span>
          <span>${formatCurrency(balance, currency)}</span>
        </div>
      </div>

      <div class="receipt-stamp">
        <div>
          <div style="font-size: 10px; color: #64748b;">Authorized Signatory:</div>
          <div style="font-weight: 700; margin-top: 2px;">${school.adminName || 'Accounts Admin'}</div>
        </div>
        <div class="stamp-box">
          PAID
        </div>
      </div>
    </div>

    <!-- Actions: PDF Download, WhatsApp and Print -->
    <div class="receipt-actions" style="display: flex; flex-direction: column; gap: 8px; margin-top: 14px;">
      <button class="btn-action primary" id="btnDownloadPDF" style="background: var(--primary); padding: 12px; font-size: 13px;">
        ${getIcon('download', 18)} Save / Download PDF Receipt
      </button>
      <div style="display: flex; gap: 8px;">
        <a href="${whatsappUrl}" target="_blank" class="btn-action" style="flex: 1; background: #25d366; color: #ffffff; text-decoration: none; padding: 10px;">
          ${getIcon('whatsapp', 18)} WhatsApp
        </a>
        <button class="btn-action receipt-btn" id="btnPrintReceipt" style="flex: 1; padding: 10px;">
          ${getIcon('printer', 18)} Print Slip
        </button>
      </div>
    </div>
  `;

  overlay.classList.remove('hidden');

  document.getElementById('btnModalClose')?.addEventListener('click', closeModal);

  // PDF Generator Button
  document.getElementById('btnDownloadPDF')?.addEventListener('click', () => {
    generateAndDownloadReceiptPDF(school, student, record, batch, monthObj.name);
  });

  // Print Button with PDF Fallback
  document.getElementById('btnPrintReceipt')?.addEventListener('click', () => {
    try {
      if (typeof window.print === 'function') {
        window.print();
      } else {
        generateAndDownloadReceiptPDF(school, student, record, batch, monthObj.name);
      }
    } catch {
      generateAndDownloadReceiptPDF(school, student, record, batch, monthObj.name);
    }
  });
}

// 3. Add or Edit Student Modal
export function openAddStudentModal(state, defaultBatchId, editStudentId, onSave) {
  const overlay = document.getElementById('modalOverlay');
  const sheet = document.getElementById('modalSheet');
  if (!overlay || !sheet) return;

  const { batches, students } = state;
  const editStudent = editStudentId ? students.find(s => s.id === editStudentId) : null;
  const isEditing = !!editStudent;

  sheet.innerHTML = `
    <div class="modal-drag-handle"></div>
    <div class="modal-title-row">
      <div class="modal-title">${isEditing ? 'Edit Student' : 'Enroll New Student'}</div>
      <button class="modal-close-btn" id="btnModalClose">${getIcon('close', 18)}</button>
    </div>

    <form id="studentForm">
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input type="text" class="form-input" id="stdName" required placeholder="e.g. Liam Anderson" value="${editStudent ? editStudent.name : ''}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Roll / Admission No *</label>
          <input type="text" class="form-input" id="stdRoll" required placeholder="e.g. 2026-042" value="${editStudent ? editStudent.rollNo : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Assign Batch *</label>
          <select class="form-select" id="stdBatch" required>
            ${batches.map(b => `
              <option value="${b.id}" ${(editStudent ? editStudent.batchId === b.id : defaultBatchId === b.id) ? 'selected' : ''}>
                ${b.name} (${formatCurrency(b.defaultFee, state.school.currency)}/mo)
              </option>
            `).join('')}
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Parent / Guardian Name</label>
          <input type="text" class="form-input" id="stdParentName" placeholder="Father or Mother" value="${editStudent ? (editStudent.parentName || '') : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Parent WhatsApp / Phone</label>
          <input type="tel" class="form-input" id="stdPhone" placeholder="+1234567890" value="${editStudent ? (editStudent.parentPhone || '') : ''}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Monthly Tuition Fee</label>
          <input type="number" class="form-input" id="stdFee" required placeholder="e.g. 150" value="${editStudent ? editStudent.monthlyFee : (batches[0] ? batches[0].defaultFee : 150)}">
        </div>
        <div class="form-group">
          <label class="form-label">Scholarship / Discount</label>
          <input type="number" class="form-input" id="stdDiscount" placeholder="0" value="${editStudent ? (editStudent.discount || 0) : 0}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select class="form-select" id="stdGender">
            <option value="Male" ${editStudent && editStudent.gender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Female" ${editStudent && editStudent.gender === 'Female' ? 'selected' : ''}>Female</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Admission Date</label>
          <input type="date" class="form-input" id="stdDate" value="${editStudent ? editStudent.admissionDate : new Date().toISOString().slice(0, 10)}">
        </div>
      </div>

      <button type="submit" class="btn-submit">
        ${getIcon('check', 18)} ${isEditing ? 'Save Changes' : 'Enroll Student'}
      </button>
    </form>
  `;

  overlay.classList.remove('hidden');

  // Auto-fill monthly fee when batch changes (if creating new student)
  if (!isEditing) {
    document.getElementById('stdBatch')?.addEventListener('change', (e) => {
      const selectedBatch = batches.find(b => b.id === e.target.value);
      if (selectedBatch) {
        document.getElementById('stdFee').value = selectedBatch.defaultFee;
      }
    });
  }

  document.getElementById('btnModalClose')?.addEventListener('click', closeModal);

  document.getElementById('studentForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const studentData = {
      id: editStudent ? editStudent.id : `std-${Date.now()}`,
      name: document.getElementById('stdName').value.trim(),
      rollNo: document.getElementById('stdRoll').value.trim(),
      batchId: document.getElementById('stdBatch').value,
      parentName: document.getElementById('stdParentName').value.trim(),
      parentPhone: document.getElementById('stdPhone').value.trim(),
      monthlyFee: Number(document.getElementById('stdFee').value) || 0,
      discount: Number(document.getElementById('stdDiscount').value) || 0,
      gender: document.getElementById('stdGender').value,
      admissionDate: document.getElementById('stdDate').value,
      status: 'active'
    };

    onSave(studentData, isEditing);
    closeModal();
  });
}

// 4. Add or Edit Batch Modal
export function openAddBatchModal(state, editBatchId, onSave) {
  const overlay = document.getElementById('modalOverlay');
  const sheet = document.getElementById('modalSheet');
  if (!overlay || !sheet) return;

  const { batches, school } = state;
  const editBatch = editBatchId ? batches.find(b => b.id === editBatchId) : null;
  const isEditing = !!editBatch;

  const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  sheet.innerHTML = `
    <div class="modal-drag-handle"></div>
    <div class="modal-title-row">
      <div class="modal-title">${isEditing ? 'Edit Batch' : 'Create New Batch / Class'}</div>
      <button class="modal-close-btn" id="btnModalClose">${getIcon('close', 18)}</button>
    </div>

    <form id="batchForm">
      <div class="form-group">
        <label class="form-label">Batch / Class Name *</label>
        <input type="text" class="form-input" id="batchName" required placeholder="e.g. Grade 10 - Blue / Pre-Engineering" value="${editBatch ? editBatch.name : ''}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Grade / Level *</label>
          <input type="text" class="form-input" id="batchGrade" required placeholder="e.g. 10 or Matric" value="${editBatch ? editBatch.grade : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Section</label>
          <input type="text" class="form-input" id="batchSection" placeholder="e.g. A or Morning" value="${editBatch ? editBatch.section : ''}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Teacher / In-Charge</label>
          <input type="text" class="form-input" id="batchTeacher" placeholder="e.g. Mr. Robert" value="${editBatch ? editBatch.incharge : ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Default Monthly Fee (${school.currency || '$'}) *</label>
          <input type="number" class="form-input" id="batchFee" required placeholder="e.g. 150" value="${editBatch ? editBatch.defaultFee : 150}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Academic Session</label>
        <input type="text" class="form-input" id="batchSession" value="${editBatch ? editBatch.session : (school.academicYear || '2026-2027')}">
      </div>

      <div class="form-group">
        <label class="form-label">Batch Color Accent</label>
        <div style="display: flex; gap: 10px;">
          ${colors.map(c => `
            <label style="cursor: pointer;">
              <input type="radio" name="batchColor" value="${c}" ${(editBatch ? editBatch.color === c : c === '#4f46e5') ? 'checked' : ''} style="display: none;">
              <span class="color-dot" style="display: inline-block; width: 28px; height: 28px; border-radius: 50%; background: ${c}; border: 3px solid #ffffff; box-shadow: 0 0 0 1px #cbd5e1;"></span>
            </label>
          `).join('')}
        </div>
      </div>

      <button type="submit" class="btn-submit">
        ${getIcon('check', 18)} ${isEditing ? 'Update Batch' : 'Create Batch'}
      </button>
    </form>
  `;

  overlay.classList.remove('hidden');

  document.getElementById('btnModalClose')?.addEventListener('click', closeModal);

  document.getElementById('batchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedColor = document.querySelector('input[name="batchColor"]:checked')?.value || '#4f46e5';

    const batchData = {
      id: editBatch ? editBatch.id : `batch-${Date.now()}`,
      name: document.getElementById('batchName').value.trim(),
      grade: document.getElementById('batchGrade').value.trim(),
      section: document.getElementById('batchSection').value.trim() || 'A',
      incharge: document.getElementById('batchTeacher').value.trim(),
      defaultFee: Number(document.getElementById('batchFee').value) || 0,
      session: document.getElementById('batchSession').value.trim(),
      color: selectedColor
    };

    onSave(batchData, isEditing);
    closeModal();
  });
}

// 5. Edit School Profile Modal
export function openEditSchoolModal(state, onSave) {
  const overlay = document.getElementById('modalOverlay');
  const sheet = document.getElementById('modalSheet');
  if (!overlay || !sheet) return;

  const school = state.school;

  sheet.innerHTML = `
    <div class="modal-drag-handle"></div>
    <div class="modal-title-row">
      <div class="modal-title">School Profile Setup</div>
      <button class="modal-close-btn" id="btnModalClose">${getIcon('close', 18)}</button>
    </div>

    <form id="schoolForm">
      <div class="form-group">
        <label class="form-label">School / Institute Name *</label>
        <input type="text" class="form-input" id="schName" required value="${school.name}">
      </div>

      <div class="form-group">
        <label class="form-label">Motto / Tagline</label>
        <input type="text" class="form-input" id="schTagline" value="${school.tagline || ''}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Principal / Admin Name</label>
          <input type="text" class="form-input" id="schAdmin" value="${school.adminName || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Currency Symbol *</label>
          <input type="text" class="form-input" id="schCurrency" required placeholder="$ or PKR or ₹" value="${school.currency || '$'}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Monthly Fee Due Day (1-28)</label>
          <input type="number" class="form-input" id="schDueDay" min="1" max="28" value="${school.feeDueDay || 10}">
        </div>
        <div class="form-group">
          <label class="form-label">Academic Session</label>
          <input type="text" class="form-input" id="schYear" value="${school.academicYear || '2026-2027'}">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Phone / WhatsApp</label>
          <input type="tel" class="form-input" id="schPhone" value="${school.phone || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Email</label>
          <input type="email" class="form-input" id="schEmail" value="${school.email || ''}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Campus Address</label>
        <input type="text" class="form-input" id="schAddress" value="${school.address || ''}">
      </div>

      <div class="form-group">
        <label class="form-label">Bank / Account Details (Included in Receipts & Reminders)</label>
        <input type="text" class="form-input" id="schBank" placeholder="Bank Name | Account Number | Routing" value="${school.bankDetails || ''}">
      </div>

      <button type="submit" class="btn-submit">
        ${getIcon('check', 18)} Save School Profile
      </button>
    </form>
  `;

  overlay.classList.remove('hidden');
  document.getElementById('btnModalClose')?.addEventListener('click', closeModal);

  document.getElementById('schoolForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
      ...school,
      name: document.getElementById('schName').value.trim(),
      tagline: document.getElementById('schTagline').value.trim(),
      adminName: document.getElementById('schAdmin').value.trim(),
      currency: document.getElementById('schCurrency').value.trim(),
      feeDueDay: Number(document.getElementById('schDueDay').value) || 10,
      academicYear: document.getElementById('schYear').value.trim(),
      phone: document.getElementById('schPhone').value.trim(),
      email: document.getElementById('schEmail').value.trim(),
      address: document.getElementById('schAddress').value.trim(),
      bankDetails: document.getElementById('schBank').value.trim()
    };

    onSave(updated);
    closeModal();
  });
}

// 6. Comprehensive Student Annual Fee Record Card / Academic Ledger
export function openStudentLedgerModal(state, studentId, onCollectFee, onOpenReceipt, initialYear = null) {
  const overlay = document.getElementById('modalOverlay');
  const sheet = document.getElementById('modalSheet');
  if (!overlay || !sheet) return;

  const { students, batches, school, feeRecords } = state;
  const currency = school.currency || '$';
  const student = students.find(s => String(s.id).trim() === String(studentId).trim());
  if (!student) {
    alert('Student record not found');
    return;
  }

  let selectedYear = initialYear ? Number(initialYear) : (state.activeYear || new Date().getFullYear());
  const batch = batches.find(b => String(b.id) === String(student.batchId)) || { name: 'General' };

  const renderLedger = () => {
    // 12-month metrics calculation
    let totalYearDue = 0;
    let totalYearPaid = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    const monthlyBreakdown = MONTHS.map(m => {
      const record = feeRecords.find(r => String(r.studentId) === String(student.id) && Number(r.month) === m.index && Number(r.year) === selectedYear);
      const baseFee = student.monthlyFee || 0;
      const discount = record ? (record.discount || 0) : (student.discount || 0);
      const fine = record ? (record.fine || 0) : 0;
      const finalDue = record ? record.finalAmount : Math.max(0, baseFee - discount + fine);
      const paid = record ? (record.paidAmount || 0) : 0;
      const balance = Math.max(0, finalDue - paid);
      const status = record ? record.status : 'UNPAID';

      totalYearDue += finalDue;
      totalYearPaid += paid;

      if (status === 'PAID') paidCount++;
      else if (status === 'PARTIAL') partialCount++;
      else unpaidCount++;

      return {
        month: m,
        record,
        finalDue,
        paid,
        balance,
        status
      };
    });

    const totalOutstanding = Math.max(0, totalYearDue - totalYearPaid);

    sheet.innerHTML = `
      <div class="modal-drag-handle"></div>
      <div class="modal-title-row">
        <div>
          <div class="modal-title" style="font-size: 17px;">Annual Fee Record Card</div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 1px;">Month-by-month payment tracking</div>
        </div>
        <button class="modal-close-btn" id="btnModalClose">${getIcon('close', 18)}</button>
      </div>

      <!-- Student Banner -->
      <div style="background: var(--surface-bg); padding: 12px 14px; border-radius: var(--radius-sm); margin-bottom: 12px; border: 1px solid var(--surface-border);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 16px; font-weight: 800; color: var(--text-primary);">${student.name}</div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Roll: <strong>${student.rollNo}</strong> • Class: <strong>${batch.name}</strong>
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
              Parent: ${student.parentName || 'Parent'} (${student.parentPhone || 'No Phone'})
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Standard Fee</div>
            <div style="font-weight: 800; font-size: 14px; color: var(--primary);">${formatCurrency(student.monthlyFee || 0, currency)}/mo</div>
          </div>
        </div>
      </div>

      <!-- Year Selector Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 12px;">
        <button class="month-nav-btn" id="btnPrevLedgerYear" title="Previous Year" style="width: 32px; height: 32px; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); background: var(--surface-bg); cursor: pointer; display: flex; align-items: center; justify-content: center;">
          ${getIcon('chevronLeft', 18)}
        </button>
        <div style="font-weight: 800; font-size: 15px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
          ${getIcon('calendar', 16)} Session / Year: ${selectedYear}
        </div>
        <button class="month-nav-btn" id="btnNextLedgerYear" title="Next Year" style="width: 32px; height: 32px; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); background: var(--surface-bg); cursor: pointer; display: flex; align-items: center; justify-content: center;">
          ${getIcon('chevronRight', 18)}
        </button>
      </div>

      <!-- Annual Summary Card -->
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); color: #ffffff; padding: 12px 14px; border-radius: var(--radius-sm); margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; opacity: 0.85; text-transform: uppercase; font-weight: 700;">Year ${selectedYear} Summary</div>
            <div style="font-size: 17px; font-weight: 900; margin-top: 2px;">${paidCount} of 12 Months Paid</div>
            <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">
              ${unpaidCount > 0 ? `⚠️ ${unpaidCount} Months Missing / Unpaid` : '🎉 All 12 Months Fully Settled'}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; opacity: 0.85; text-transform: uppercase; font-weight: 700;">Total Overdue</div>
            <div style="font-size: 18px; font-weight: 900; color: ${totalOutstanding > 0 ? '#fca5a5' : '#86efac'};">
              ${formatCurrency(totalOutstanding, currency)}
            </div>
            <div style="font-size: 10px; opacity: 0.85;">Paid: ${formatCurrency(totalYearPaid, currency)}</div>
          </div>
        </div>
      </div>

      <!-- 12-Month Month-by-Month Record List -->
      <div style="display: flex; flex-direction: column; gap: 8px; max-height: 48vh; overflow-y: auto; padding-right: 2px;">
        ${monthlyBreakdown.map(item => {
          const { month, record, finalDue, paid, balance, status } = item;
          let badgeBg = '#fef2f2';
          let badgeColor = '#991b1b';
          let badgeBorder = '#fecaca';
          let statusText = 'MISSING / UNPAID';

          if (status === 'PAID') {
            badgeBg = '#ecfdf5';
            badgeColor = '#065f46';
            badgeBorder = '#a7f3d0';
            statusText = 'PAID';
          } else if (status === 'PARTIAL') {
            badgeBg = '#fffbeb';
            badgeColor = '#92400e';
            badgeBorder = '#fde68a';
            statusText = 'PARTIAL';
          }

          return `
            <div style="border: 1px solid ${status === 'PAID' ? '#e2e8f0' : '#fecaca'}; border-left: 4px solid ${status === 'PAID' ? '#10b981' : (status === 'PARTIAL' ? '#f59e0b' : '#ef4444')}; border-radius: var(--radius-sm); padding: 10px 12px; background: #ffffff;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div style="font-weight: 800; font-size: 13px; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                    <span>${month.name} ${selectedYear}</span>
                    <span style="font-size: 10px; padding: 2px 7px; border-radius: 999px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-weight: 800;">
                      ${statusText}
                    </span>
                  </div>
                  <div style="font-size: 11px; color: var(--text-secondary); margin-top: 3px;">
                    Fee Due: <strong>${formatCurrency(finalDue, currency)}</strong>
                    ${paid > 0 ? ` • Paid: <strong style="color: var(--success);">${formatCurrency(paid, currency)}</strong>` : ''}
                    ${balance > 0 ? ` • Remaining: <strong style="color: var(--danger);">${formatCurrency(balance, currency)}</strong>` : ''}
                  </div>
                  ${record && record.paymentDate ? `
                    <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                      Paid on: ${record.paymentDate} (${record.paymentMode || 'Cash'}) • Rcpt: ${record.receiptNo || '-'}
                    </div>
                  ` : ''}
                </div>

                <!-- Month Action Button -->
                <div style="margin-left: 8px;">
                  ${status === 'PAID' ? `
                    <button class="btn-action receipt-btn btn-history-voucher" data-record-id="${record.id}" style="padding: 5px 10px; font-size: 11px; white-space: nowrap;">
                      ${getIcon('printer', 13)} Voucher
                    </button>
                  ` : `
                    <button class="btn-action primary btn-history-collect" data-month="${month.index}" data-year="${selectedYear}" style="padding: 5px 10px; font-size: 11px; white-space: nowrap; background: ${status === 'PARTIAL' ? '#f59e0b' : 'var(--primary)'};">
                      ${getIcon('dollar', 13)} Pay Month
                    </button>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    overlay.classList.remove('hidden');

    document.getElementById('btnModalClose')?.addEventListener('click', closeModal);

    // Year Switchers
    document.getElementById('btnPrevLedgerYear')?.addEventListener('click', () => {
      selectedYear--;
      renderLedger();
    });
    document.getElementById('btnNextLedgerYear')?.addEventListener('click', () => {
      selectedYear++;
      renderLedger();
    });

    // Pay specific month button
    sheet.querySelectorAll('.btn-history-collect').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = Number(btn.getAttribute('data-month'));
        const y = Number(btn.getAttribute('data-year'));
        closeModal();
        if (typeof onCollectFee === 'function') {
          onCollectFee(student.id, m, y);
        }
      });
    });

    // View voucher button
    sheet.querySelectorAll('.btn-history-voucher').forEach(btn => {
      btn.addEventListener('click', () => {
        const rId = btn.getAttribute('data-record-id');
        closeModal();
        if (typeof onOpenReceipt === 'function') {
          onOpenReceipt(rId);
        }
      });
    });
  };

  renderLedger();
}
