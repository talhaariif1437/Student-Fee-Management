// Android Material 3 Bottom Navigation Bar Component
import { getIcon } from '../icons.js';

export function renderBottomNav(currentTab, defaultersCount, onTabSelect) {
  const container = document.getElementById('bottomNav');
  if (!container) return;

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: 'dashboard' },
    { id: 'batches', label: 'Batches', icon: 'school' },
    { id: 'students', label: 'Students', icon: 'users' },
    { id: 'ledger', label: 'Fee Ledger', icon: 'ledger' },
    { id: 'defaulters', label: 'Defaulters', icon: 'defaulters', badge: defaultersCount }
  ];

  container.innerHTML = tabs.map(tab => {
    const isActive = tab.id === currentTab ? 'active' : '';
    const badgeHtml = tab.badge > 0 ? `<span class="nav-badge">${tab.badge}</span>` : '';

    return `
      <button class="nav-item ${isActive}" data-tab="${tab.id}">
        <div class="nav-pill">
          <div class="nav-icon">
            ${getIcon(tab.icon, 20)}
          </div>
        </div>
        <span class="nav-label">${tab.label}</span>
        ${badgeHtml}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      onTabSelect(tabId);
    });
  });
}
