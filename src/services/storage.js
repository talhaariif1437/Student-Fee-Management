import {
  INITIAL_SCHOOL,
  INITIAL_BATCHES,
  INITIAL_STUDENTS,
  INITIAL_FEE_RECORDS
} from '../data/initialData';

const STORAGE_KEYS = {
  SCHOOL: 'edufee_school_profile_v1',
  BATCHES: 'edufee_batches_v1',
  STUDENTS: 'edufee_students_v1',
  FEE_RECORDS: 'edufee_fee_records_v1'
};

export const storage = {
  getSchool: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHOOL);
      return data ? JSON.parse(data) : INITIAL_SCHOOL;
    } catch (e) {
      console.error('Error loading school:', e);
      return INITIAL_SCHOOL;
    }
  },

  saveSchool: (school) => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(school));
  },

  getBatches: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return data ? JSON.parse(data) : INITIAL_BATCHES;
    } catch (e) {
      console.error('Error loading batches:', e);
      return INITIAL_BATCHES;
    }
  },

  saveBatches: (batches) => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  },

  getStudents: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : INITIAL_STUDENTS;
    } catch (e) {
      console.error('Error loading students:', e);
      return INITIAL_STUDENTS;
    }
  },

  saveStudents: (students) => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getFeeRecords: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEE_RECORDS);
      return data ? JSON.parse(data) : INITIAL_FEE_RECORDS;
    } catch (e) {
      console.error('Error loading fee records:', e);
      return INITIAL_FEE_RECORDS;
    }
  },

  saveFeeRecords: (records) => {
    localStorage.setItem(STORAGE_KEYS.FEE_RECORDS, JSON.stringify(records));
  },

  exportBackupJSON: () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      school: storage.getSchool(),
      batches: storage.getBatches(),
      students: storage.getStudents(),
      feeRecords: storage.getFeeRecords()
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJSON: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.school) storage.saveSchool(parsed.school);
      if (parsed.batches) storage.saveBatches(parsed.batches);
      if (parsed.students) storage.saveStudents(parsed.students);
      if (parsed.feeRecords) storage.saveFeeRecords(parsed.feeRecords);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  resetAllData: () => {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(INITIAL_SCHOOL));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(INITIAL_BATCHES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.FEE_RECORDS, JSON.stringify(INITIAL_FEE_RECORDS));
  }
};
