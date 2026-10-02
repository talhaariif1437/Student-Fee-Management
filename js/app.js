// EduFee Main Application Coordinator & State Store
import { storage } from './storage.js';
import { showToast, generateReceiptNo } from './utils.js';
import { renderHeader } from './components/header.js';
import { renderBottomNav } from './components/bottomNav.js';
import { renderFAB } from './components/fab.js';
import { renderDashboardView } from './components/dashboardView.js';
import { renderBatchesView } from './components/batchesView.js';
import { renderStudentsView } from './components/studentsView.js';
import { renderFeeLedgerView } from './components/feeLedgerView.js';
import { renderDefaultersView } from './components/defaultersView.js';
import { renderSettingsView } from './components/settingsView.js';
import {
  openCollectFeeModal,
  openReceiptModal,
  openAddStudentModal,
  openAddBatchModal,
  openEditSchoolModal,
  openStudentLedgerModal,
  openQuickPayModal
} from './components/modals.js';

class App {
  constructor() {
    this.state = {
      school: storage.getSchool(),
      batches: storage.getBatches(),
      students: storage.getStudents(),
      feeRecords: storage.getFeeRecords(),
      currentTab: 'dashboard',
      activeMonth: 10, // October (Current Academic Term)
      activeYear: 2026,
      studentSearchQuery: '',
      studentBatchFilter: 'all',
      feeStatusFilter: 'all',
      feeSearchQuery: '',
      feeBatchFilter: 'all',
      isPhoneFrameMode: true
    };

    this.init();
  }

  init() {
    this.setupClock();
    this.setupFrameToggle();
    this.render();
  }

  setupClock() {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const clockEl = document.getElementById('statusClock');
      if (clockEl) clockEl.innerText = `${hours}:${minutes}`;
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  setupFrameToggle() {
    const btnToggle = document.getElementById('btnToggleFrame');
    const toggleLabel = document.getElementById('toggleFrameLabel');
    const btnInstall = document.getElementById('btnInstallApp');

    btnToggle?.addEventListener('click', () => {
      this.state.isPhoneFrameMode = !this.state.isPhoneFrameMode;
      if (this.state.isPhoneFrameMode) {
        document.body.classList.remove('fullscreen-mode');
        document.body.classList.add('phone-frame-mode');
        if (toggleLabel) toggleLabel.innerText = 'Full Screen View';
      } else {
        document.body.classList.remove('phone-frame-mode');
        document.body.classList.add('fullscreen-mode');
        if (toggleLabel) toggleLabel.innerText = 'Phone Frame View';
      }
    });

    btnInstall?.addEventListener('click', () => {
      this.state.currentTab = 'settings';
      this.render();
      showToast('See Android installation steps in Settings below');
    });
  }

  getDefaultersCount() {
    const { students, feeRecords, activeMonth, activeYear } = this.state;
    let count = 0;
    students.forEach(student => {
      const record = feeRecords.find(r => String(r.studentId) === String(student.id) && Number(r.month) === Number(activeMonth) && Number(r.year) === Number(activeYear));
      const baseFee = student.monthlyFee || 0;
      const discount = record ? (record.discount || 0) : (student.discount || 0);
      const fine = record ? (record.fine || 0) : 0;
      const finalDue = record ? record.finalAmount : Math.max(0, baseFee - discount + fine);
      const paid = record ? (record.paidAmount || 0) : 0;
      if (finalDue - paid > 0) count++;
    });
    return count;
  }

  render() {
    // 1. Render Top Header
    renderHeader(this.state, () => {
      this.state.currentTab = 'settings';
      this.render();
    });

    // 2. Render Active View
    const actions = this.getActions();

    switch (this.state.currentTab) {
      case 'dashboard':
        renderDashboardView(this.state, actions);
        break;
      case 'batches':
        renderBatchesView(this.state, actions);
        break;
      case 'students':
        renderStudentsView(this.state, actions);
        break;
      case 'ledger':
        renderFeeLedgerView(this.state, actions);
        break;
      case 'defaulters':
        renderDefaultersView(this.state, actions);
        break;
      case 'settings':
        renderSettingsView(this.state, actions);
        break;
      default:
        renderDashboardView(this.state, actions);
    }

    // 3. Render FAB
    renderFAB((action) => {
      if (action === 'add-student') {
        openAddStudentModal(this.state, null, null, (newStudent) => {
          this.state.students.push(newStudent);
          storage.saveStudents(this.state.students);
          showToast(`Student ${newStudent.name} enrolled successfully!`);
          this.render();
        });
      } else if (action === 'add-batch') {
        openAddBatchModal(this.state, null, (newBatch) => {
          this.state.batches.push(newBatch);
          storage.saveBatches(this.state.batches);
          showToast(`Batch "${newBatch.name}" created!`);
          this.render();
        });
      } else if (action === 'collect-fee') {
        if (this.state.students.length === 0) {
          showToast('Please add students first');
          return;
        }
        openCollectFeeModal(this.state, this.state.students[0].id, (record) => {
          this.saveFeeRecord(record);
        });
      }
    });

    // 4. Render Android Bottom Nav
    renderBottomNav(this.state.currentTab, this.getDefaultersCount(), (tabId) => {
      this.state.currentTab = tabId;
      this.render();
      const content = document.getElementById('mainContent');
      if (content) content.scrollTop = 0;
    });
  }

  saveFeeRecord(record) {
    const existingIndex = this.state.feeRecords.findIndex(r => r.id === record.id || (r.studentId === record.studentId && r.month === record.month && r.year === record.year));
    if (existingIndex >= 0) {
      this.state.feeRecords[existingIndex] = record;
    } else {
      this.state.feeRecords.push(record);
    }
    storage.saveFeeRecords(this.state.feeRecords);
    showToast(`Payment of ${this.state.school.currency}${record.paidAmount} recorded!`);
    this.render();

    // Auto prompt printable receipt
    setTimeout(() => {
      openReceiptModal(this.state, record.id);
    }, 300);
  }

  getActions() {
    return {
      onNavigate: (tabId) => {
        this.state.currentTab = tabId;
        this.render();
      },

      onPrevMonth: () => {
        if (this.state.activeMonth === 1) {
          this.state.activeMonth = 12;
          this.state.activeYear -= 1;
        } else {
          this.state.activeMonth -= 1;
        }
        this.render();
      },

      onNextMonth: () => {
        if (this.state.activeMonth === 12) {
          this.state.activeMonth = 1;
          this.state.activeYear += 1;
        } else {
          this.state.activeMonth += 1;
        }
        this.render();
      },

      onOpenAddStudent: (batchId = null) => {
        openAddStudentModal(this.state, batchId, null, (studentData) => {
          this.state.students.push(studentData);
          storage.saveStudents(this.state.students);
          showToast(`Student ${studentData.name} enrolled!`);
          this.render();
        });
      },

      onOpenEditStudent: (studentId) => {
        openAddStudentModal(this.state, null, studentId, (studentData) => {
          const index = this.state.students.findIndex(s => s.id === studentId);
          if (index >= 0) {
            this.state.students[index] = studentData;
            storage.saveStudents(this.state.students);
            showToast(`Student ${studentData.name} updated!`);
            this.render();
          }
        });
      },

      onDeleteStudent: (studentId) => {
        const student = this.state.students.find(s => s.id === studentId);
        if (!student) return;
        if (confirm(`Are you sure you want to remove student "${student.name}"?`)) {
          this.state.students = this.state.students.filter(s => s.id !== studentId);
          storage.saveStudents(this.state.students);
          showToast(`Student ${student.name} removed`);
          this.render();
        }
      },

      onSearchStudents: (query) => {
        this.state.studentSearchQuery = query;
        this.render();
      },

      onFilterStudents: (batchId) => {
        this.state.studentBatchFilter = batchId;
        this.render();
      },

      onFilterStudentsByBatch: (batchId) => {
        this.state.studentBatchFilter = batchId;
        this.state.currentTab = 'students';
        this.render();
      },

      onOpenAddBatch: () => {
        openAddBatchModal(this.state, null, (batchData) => {
          this.state.batches.push(batchData);
          storage.saveBatches(this.state.batches);
          showToast(`Batch "${batchData.name}" created!`);
          this.render();
        });
      },

      onOpenEditBatch: (batchId) => {
        openAddBatchModal(this.state, batchId, (batchData) => {
          const index = this.state.batches.findIndex(b => b.id === batchId);
          if (index >= 0) {
            this.state.batches[index] = batchData;
            storage.saveBatches(this.state.batches);
            showToast(`Batch "${batchData.name}" updated!`);
            this.render();
          }
        });
      },

      onDeleteBatch: (batchId) => {
        const batch = this.state.batches.find(b => b.id === batchId);
        if (!batch) return;
        const assignedStudents = this.state.students.filter(s => s.batchId === batchId).length;
        if (assignedStudents > 0) {
          alert(`Cannot delete batch: ${assignedStudents} students are currently enrolled in it.`);
          return;
        }
        if (confirm(`Delete batch "${batch.name}"?`)) {
          this.state.batches = this.state.batches.filter(b => b.id !== batchId);
          storage.saveBatches(this.state.batches);
          showToast(`Batch "${batch.name}" deleted`);
          this.render();
        }
      },

      onOpenCollectFee: (studentId, targetMonth = null, targetYear = null) => {
        openCollectFeeModal(this.state, studentId, (record) => {
          this.saveFeeRecord(record);
        }, targetMonth, targetYear);
      },

      onQuickPay: (studentId) => {
        openQuickPayModal(this.state, studentId, (record) => {
          this.saveFeeRecord(record);
        });
      },

      onOpenReceipt: (recordId) => {
        openReceiptModal(this.state, recordId);
      },

      onViewStudentLedger: (studentId, targetYear = null) => {
        openStudentLedgerModal(
          this.state,
          studentId,
          (stdId, m, y) => {
            openCollectFeeModal(this.state, stdId, (record) => {
              this.saveFeeRecord(record);
            }, m, y);
          },
          (recordId) => {
            openReceiptModal(this.state, recordId);
          },
          targetYear
        );
      },

      onSearchFee: (query) => {
        this.state.feeSearchQuery = query;
        this.render();
      },

      onFilterFeeStatus: (status) => {
        this.state.feeStatusFilter = status;
        this.render();
      },

      onFilterFeeBatch: (batchId) => {
        this.state.feeBatchFilter = batchId;
        this.render();
      },

      onExportCSV: () => {
        storage.exportCSV(this.state.activeMonth, this.state.activeYear);
        showToast('Monthly Fee Ledger CSV downloaded!');
      },

      onExportMonthlyCSV: () => {
        storage.exportCSV(this.state.activeMonth, this.state.activeYear);
        showToast('Monthly Fee Ledger CSV downloaded!');
      },

      onExportStudentsCSV: () => {
        storage.exportStudentsDirectoryCSV();
        showToast('Students Directory CSV downloaded!');
      },

      onExportDefaultersCSV: () => {
        storage.exportDefaultersCSV(this.state.activeMonth, this.state.activeYear);
        showToast('Defaulters List CSV downloaded!');
      },

      onOpenEditSchool: () => {
        openEditSchoolModal(this.state, (updatedSchool) => {
          this.state.school = updatedSchool;
          storage.saveSchool(updatedSchool);
          showToast('School profile updated!');
          this.render();
        });
      },

      onExportJSON: () => {
        storage.exportJSON();
        showToast('Full school data backup exported!');
      },

      onImportJSON: async (file) => {
        try {
          await storage.importJSON(file);
          this.state.school = storage.getSchool();
          this.state.batches = storage.getBatches();
          this.state.students = storage.getStudents();
          this.state.feeRecords = storage.getFeeRecords();
          showToast('Backup restored successfully!');
          this.render();
        } catch {
          showToast('Failed to import backup file');
        }
      },

      onResetData: () => {
        if (confirm('Are you sure you want to reset all data back to original demo values?')) {
          storage.resetDemo();
          this.state.school = storage.getSchool();
          this.state.batches = storage.getBatches();
          this.state.students = storage.getStudents();
          this.state.feeRecords = storage.getFeeRecords();
          showToast('Data reset to default demo!');
          this.render();
        }
      }
    };
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
