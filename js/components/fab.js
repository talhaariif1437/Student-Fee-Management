// Floating Action Button (FAB) with Speed Dial Actions
import { getIcon } from '../icons.js';

export function renderFAB(onAction) {
  const container = document.getElementById('fabContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="speed-dial-menu" id="speedDialMenu">
      <button class="speed-dial-item" data-action="add-student">
        <span class="speed-dial-label">Add New Student</span>
        <div class="speed-dial-btn">${getIcon('users', 18)}</div>
      </button>
      <button class="speed-dial-item" data-action="add-batch">
        <span class="speed-dial-label">Create New Batch</span>
        <div class="speed-dial-btn">${getIcon('school', 18)}</div>
      </button>
      <button class="speed-dial-item" data-action="collect-fee">
        <span class="speed-dial-label">Record Fee Payment</span>
        <div class="speed-dial-btn">${getIcon('dollar', 18)}</div>
      </button>
    </div>
    <button class="main-fab" id="mainFabBtn" title="Quick Actions">
      ${getIcon('plus', 24)}
    </button>
  `;

  const mainFab = document.getElementById('mainFabBtn');
  const speedDial = document.getElementById('speedDialMenu');

  let isOpen = false;

  const toggleDial = () => {
    isOpen = !isOpen;
    if (isOpen) {
      mainFab.classList.add('open');
      speedDial.classList.add('open');
    } else {
      mainFab.classList.remove('open');
      speedDial.classList.remove('open');
    }
  };

  mainFab.addEventListener('click', toggleDial);

  speedDial.querySelectorAll('.speed-dial-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      toggleDial();
      onAction(action);
    });
  });
}
