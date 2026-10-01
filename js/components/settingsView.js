// Settings View: School Profile Setup, CSV Data Exports, Backups & APK/Offline Mobile Guide
import { getIcon } from '../icons.js';

export function renderSettingsView(state, actions) {
  const container = document.getElementById('mainContent');
  if (!container) return;

  const school = state.school;

  container.innerHTML = `
    <div class="section-title-row" style="margin-bottom: 14px;">
      <div>
        <h2 style="font-size: 18px; font-weight: 800; color: var(--text-primary);">School Profile & Settings</h2>
        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
          Configure school identity, export CSV reports, and manage offline data
        </p>
      </div>
    </div>

    <!-- 1. School Profile Card -->
    <div class="card">
      <div class="section-title-row">
        <span class="section-title">
          ${getIcon('school', 18)}
          <span>School Information</span>
        </span>
        <button class="section-action" id="btnEditSchoolInfo">Edit Info</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--surface-border); padding-bottom: 6px;">
          <span style="color: var(--text-secondary);">School Name:</span>
          <strong>${school.name}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--surface-border); padding-bottom: 6px;">
          <span style="color: var(--text-secondary);">Principal / Admin:</span>
          <strong>${school.adminName || 'Admin'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--surface-border); padding-bottom: 6px;">
          <span style="color: var(--text-secondary);">Academic Session:</span>
          <strong>${school.academicYear}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--surface-border); padding-bottom: 6px;">
          <span style="color: var(--text-secondary);">Currency Symbol:</span>
          <strong style="color: var(--primary); font-size: 15px;">${school.currency || '$'}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--surface-border); padding-bottom: 6px;">
          <span style="color: var(--text-secondary);">Monthly Due Day:</span>
          <strong>${school.feeDueDay || '10'}th of every month</strong>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--surface-border); padding-bottom: 6px;">
          <span style="color: var(--text-secondary);">School Phone:</span>
          <strong>${school.phone || '-'}</strong>
        </div>
        <div style="margin-top: 4px;">
          <span style="color: var(--text-secondary); font-size: 11px;">Bank / Account Payment Info:</span>
          <div style="background: var(--surface-bg); padding: 8px 10px; border-radius: var(--radius-xs); font-size: 12px; margin-top: 4px; font-family: monospace;">
            ${school.bankDetails || 'Not specified'}
          </div>
        </div>
      </div>
    </div>

    <!-- 2. CSV Data Export Hub -->
    <div class="card" style="border-left: 4px solid var(--success);">
      <div class="section-title-row">
        <span class="section-title">
          ${getIcon('download', 18)}
          <span>CSV Spreadsheet Reports (Excel)</span>
        </span>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px;">
        Download clean CSV spreadsheets directly into your phone or PC Downloads folder anytime:
      </p>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="btn-action primary" id="btnExportMonthlyCSV" style="background: var(--success); text-align: left; padding: 10px 14px;">
          ${getIcon('download', 16)} Export Monthly Fee Ledger (${state.activeMonth}/${state.activeYear})
        </button>

        <button class="btn-action receipt-btn" id="btnExportStudentsCSV" style="text-align: left; padding: 10px 14px;">
          ${getIcon('users', 16)} Export All Students Master Directory (CSV)
        </button>

        <button class="btn-action receipt-btn" id="btnExportDefaultersCSV" style="text-align: left; padding: 10px 14px; color: var(--danger);">
          ${getIcon('defaulters', 16)} Export Defaulters / Pending Dues List (CSV)
        </button>
      </div>
    </div>

    <!-- 3. Offline Data Backup & Restore -->
    <div class="card">
      <div class="section-title-row">
        <span class="section-title">
          ${getIcon('ledger', 18)}
          <span>Full Database Backup (JSON)</span>
        </span>
      </div>
      <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
        Save a complete backup copy of your entire school records to keep safe offline or transfer to another phone.
      </p>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <button class="btn-action primary" id="btnExportJSON">
          ${getIcon('download', 16)} Export Full Database Backup (JSON)
        </button>

        <label class="btn-action receipt-btn" style="cursor: pointer; text-align: center;">
          ${getIcon('upload', 16)} Restore Full Database from Backup
          <input type="file" id="fileImportJSON" accept=".json" style="display: none;">
        </label>

        <button class="btn-action receipt-btn" id="btnResetData" style="color: var(--danger); border-color: #fecaca; margin-top: 4px;">
          ${getIcon('refresh', 16)} Reset to Default Demo Data
        </button>
      </div>
    </div>

    <!-- 4. Offline Phone Installation & APK Guide -->
    <div class="card" style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.1);">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 20px;">🤖</span>
        <h3 style="font-size: 15px; font-weight: 800;">100% Offline Android App Installation</h3>
      </div>
      <p style="font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 10px;">
        How to install as a native offline app on your phone:
      </p>
      <ol style="font-size: 12px; color: #e2e8f0; padding-left: 20px; line-height: 1.6;">
        <li>Open Chrome on your Android phone and visit this app via Wi-Fi.</li>
        <li>Tap Chrome's <strong>3 dots (⋮)</strong> menu at the top right.</li>
        <li>Tap <strong>"Install App"</strong> or <strong>"Add to Home Screen"</strong>.</li>
        <li>Android creates an official <strong>WebAPK</strong> on your phone.</li>
        <li><strong>Done!</strong> Now turn OFF Wi-Fi or put phone in Airplane mode—the app works <strong>100% offline</strong>, stores all data on your phone, and exports CSV directly to your phone's storage!</li>
      </ol>
    </div>
  `;

  document.getElementById('btnEditSchoolInfo')?.addEventListener('click', actions.onOpenEditSchool);
  document.getElementById('btnExportMonthlyCSV')?.addEventListener('click', actions.onExportMonthlyCSV);
  document.getElementById('btnExportStudentsCSV')?.addEventListener('click', actions.onExportStudentsCSV);
  document.getElementById('btnExportDefaultersCSV')?.addEventListener('click', actions.onExportDefaultersCSV);
  document.getElementById('btnExportJSON')?.addEventListener('click', actions.onExportJSON);
  document.getElementById('btnResetData')?.addEventListener('click', actions.onResetData);

  const importInput = document.getElementById('fileImportJSON');
  importInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      actions.onImportJSON(e.target.files[0]);
    }
  });
}
