// Storage Service & Data Persistence for Android App
import {
  INITIAL_SCHOOL,
  INITIAL_BATCHES,
  INITIAL_STUDENTS,
  INITIAL_FEE_RECORDS
} from './data.js';

const KEYS = {
  SCHOOL: 'edufee_android_school_v1',
  BATCHES: 'edufee_android_batches_v1',
  STUDENTS: 'edufee_android_students_v1',
  FEE_RECORDS: 'edufee_android_records_v1'
};

export const storage = {
  getSchool() {
    try {
      const data = localStorage.getItem(KEYS.SCHOOL);
      return data ? JSON.parse(data) : INITIAL_SCHOOL;
    } catch {
      return INITIAL_SCHOOL;
    }
  },

  saveSchool(school) {
    localStorage.setItem(KEYS.SCHOOL, JSON.stringify(school));
  },

  getBatches() {
    try {
      const data = localStorage.getItem(KEYS.BATCHES);
      return data ? JSON.parse(data) : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  },

  saveBatches(batches) {
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(batches));
  },

  getStudents() {
    try {
      const data = localStorage.getItem(KEYS.STUDENTS);
      return data ? JSON.parse(data) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  saveStudents(students) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(students));
  },

  getFeeRecords() {
    try {
      const data = localStorage.getItem(KEYS.FEE_RECORDS);
      return data ? JSON.parse(data) : INITIAL_FEE_RECORDS;
    } catch {
      return INITIAL_FEE_RECORDS;
    }
  },

  saveFeeRecords(records) {
    localStorage.setItem(KEYS.FEE_RECORDS, JSON.stringify(records));
  },

  exportJSON() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      school: this.getSchool(),
      batches: this.getBatches(),
      students: this.getStudents(),
      feeRecords: this.getFeeRecords()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduFee_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed.school) this.saveSchool(parsed.school);
          if (parsed.batches) this.saveBatches(parsed.batches);
          if (parsed.students) this.saveStudents(parsed.students);
          if (parsed.feeRecords) this.saveFeeRecords(parsed.feeRecords);
          resolve(true);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // 1. Export Monthly Fee Register CSV
  exportCSV(month, year) {
    const school = this.getSchool();
    const students = this.getStudents();
    const batches = this.getBatches();
    const records = this.getFeeRecords();

    const batchMap = {};
    batches.forEach(b => batchMap[b.id] = b.name);

    let csv = `"${school.name} - Monthly Fee Ledger"\n`;
    csv += `"Academic Year: ${school.academicYear}","Month: ${month}/${year}"\n\n`;
    csv += `"Roll No","Student Name","Batch/Class","Parent Name","Phone","Monthly Base Fee","Discount","Late Fine","Total Due","Amount Paid","Balance Remaining","Status","Payment Date","Mode","Receipt No","Remarks"\n`;

    students.forEach(student => {
      const record = records.find(r => r.studentId === student.id && r.month === month && r.year === year);
      const baseFee = student.monthlyFee || 0;
      const discount = record ? (record.discount || 0) : (student.discount || 0);
      const fine = record ? (record.fine || 0) : 0;
      const feeDue = record ? record.finalAmount : Math.max(0, baseFee - discount + fine);
      const paid = record ? (record.paidAmount || 0) : 0;
      const balance = Math.max(0, feeDue - paid);
      const status = record ? record.status : 'UNPAID';
      const payDate = record && record.paymentDate ? record.paymentDate : '-';
      const mode = record && record.paymentMode ? record.paymentMode : '-';
      const receiptNo = record && record.receiptNo ? record.receiptNo : '-';
      const remarks = record && record.remarks ? record.remarks.replace(/"/g, '""') : '-';

      csv += `"${student.rollNo}","${student.name}","${batchMap[student.batchId] || '-'}","${student.parentName || '-'}","${student.parentPhone || '-'}","${baseFee}","${discount}","${fine}","${feeDue}","${paid}","${balance}","${status}","${payDate}","${mode}","${receiptNo}","${remarks}"\n`;
    });

    this.downloadFile(csv, `Fee_Ledger_${year}_M${month}.csv`, 'text/csv;charset=utf-8;');
  },

  // 2. Export All Students Directory CSV
  exportStudentsDirectoryCSV() {
    const school = this.getSchool();
    const students = this.getStudents();
    const batches = this.getBatches();

    const batchMap = {};
    batches.forEach(b => batchMap[b.id] = b.name);

    let csv = `"${school.name} - Student Directory"\n\n`;
    csv += `"Roll No","Student Name","Batch/Class","Parent/Guardian","Phone/WhatsApp","Monthly Tuition Fee","Discount/Scholarship","Gender","Admission Date","Status"\n`;

    students.forEach(s => {
      csv += `"${s.rollNo}","${s.name}","${batchMap[s.batchId] || '-'}","${s.parentName || '-'}","${s.parentPhone || '-'}","${s.monthlyFee}","${s.discount || 0}","${s.gender || '-'}","${s.admissionDate || '-'}","${s.status || 'Active'}"\n`;
    });

    this.downloadFile(csv, `Students_Directory_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  },

  // 3. Export Defaulters / Pending Dues CSV
  exportDefaultersCSV(month, year) {
    const school = this.getSchool();
    const students = this.getStudents();
    const batches = this.getBatches();
    const records = this.getFeeRecords();

    const batchMap = {};
    batches.forEach(b => batchMap[b.id] = b.name);

    let csv = `"${school.name} - Fee Defaulters List (${month}/${year})"\n\n`;
    csv += `"Roll No","Student Name","Batch/Class","Parent Name","Parent Phone","Total Due","Amount Paid","Balance Unpaid","Status"\n`;

    students.forEach(student => {
      const record = records.find(r => r.studentId === student.id && r.month === month && r.year === year);
      const baseFee = student.monthlyFee || 0;
      const discount = record ? (record.discount || 0) : (student.discount || 0);
      const fine = record ? (record.fine || 0) : 0;
      const feeDue = record ? record.finalAmount : Math.max(0, baseFee - discount + fine);
      const paid = record ? (record.paidAmount || 0) : 0;
      const balance = Math.max(0, feeDue - paid);

      if (balance > 0) {
        csv += `"${student.rollNo}","${student.name}","${batchMap[student.batchId] || '-'}","${student.parentName || '-'}","${student.parentPhone || '-'}","${feeDue}","${paid}","${balance}","${record ? record.status : 'UNPAID'}"\n`;
      }
    });

    this.downloadFile(csv, `Defaulters_List_${year}_M${month}.csv`, 'text/csv;charset=utf-8;');
  },

  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },

  resetDemo() {
    localStorage.setItem(KEYS.SCHOOL, JSON.stringify(INITIAL_SCHOOL));
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(KEYS.FEE_RECORDS, JSON.stringify(INITIAL_FEE_RECORDS));
  }
};
