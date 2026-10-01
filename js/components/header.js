// Top Mobile App Header Component
import { getIcon } from '../icons.js';

export function renderHeader(state, onOpenSettings) {
  const container = document.getElementById('mobileAppHeader');
  if (!container) return;

  const school = state.school;

  container.innerHTML = `
    <div class="header-top">
      <div class="header-school-info">
        <div class="school-logo-bubble">${school.logoEmoji || '🏫'}</div>
        <div>
          <div class="school-name">${school.name}</div>
          <div class="school-academic-year">
            ${getIcon('calendar', 12)}
            <span>Session: ${school.academicYear || '2026-2027'}</span>
          </div>
        </div>
      </div>
      <button class="header-action-btn" id="btnHeaderSettings" title="School Settings">
        ${getIcon('settings', 18)}
      </button>
    </div>
  `;

  document.getElementById('btnHeaderSettings')?.addEventListener('click', onOpenSettings);
}
