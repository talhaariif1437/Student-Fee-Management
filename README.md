# 🎓 EduFee - School & Student Fee Manager

A modern, responsive, and offline-capable **School, Batch, Student & Monthly Fee Management Application** designed with an **Android Material Design 3** mobile-first interface.

🌐 **Live Demo:** [https://talhaariif1437.github.io/Student-Fee-Management/](https://talhaariif1437.github.io/Student-Fee-Management/)

---

## ✨ Features

- **📱 Simulated Android Chassis & Desktop Full-Screen View:** Toggle between an interactive Android smartphone chassis preview and full-screen web mode.
- **📊 Financial Analytics Dashboard:** Real-time metrics for Expected Fees, Total Collected, Outstanding Dues, and Collection Rate % with class-wise performance bars.
- **📚 Batch & Class Management:** Organize students into classes and sections with dedicated incharge teachers and default monthly fees.
- **👥 Student Directory:** Student records with roll numbers, contact information, admission dates, and quick-action WhatsApp / call shortcuts.
- **📑 Monthly Fee Register:**
  - Status tracking (`PAID`, `PARTIAL`, `UNPAID`).
  - 1-tap Cash Quick Pay.
  - Custom discounts, scholarships, and late fines.
  - Payment modes: Cash, Online, and Bank Transfer.
- **⚠️ Defaulters & WhatsApp Reminders:** Automated identification of overdue fees with **1-tap pre-filled WhatsApp payment reminders** sent directly to parents.
- **🧾 Instant Receipts & Invoicing:** Official digital receipt with printable PDF layout and direct WhatsApp receipt dispatch.
- **💾 Offline PWA & Data Portability:**
  - Installs as a Progressive Web App on Android, iOS, and Desktop.
  - Offline asset caching via Service Worker.
  - Full school data backup and restore via JSON.
  - Export monthly registers, student directories, and defaulters lists to CSV (Excel).

---

## 🚀 Getting Started

### Option 1: Live Web App
Open [https://talhaariif1437.github.io/Student-Fee-Management/](https://talhaariif1437.github.io/Student-Fee-Management/) directly in your mobile or desktop browser.

### Option 2: Run Locally (Zero Dependencies)
Run the lightweight built-in HTTP server:

```bash
# Double-click start.bat or run:
node server.js
```
The server will output:
- **Local PC:** `http://localhost:5173`
- **On Android Phone (Same Wi-Fi):** `http://<your-ip>:5173`

---

## 🛠️ Tech Stack
- **Frontend:** Pure ES6+ JavaScript (ES Modules), HTML5, Vanilla CSS3 (Android Material 3 Design System).
- **Icons:** Inline SVG Icon Library.
- **Storage:** LocalStorage with JSON backup/restore.
- **PWA:** Service Worker + Web App Manifest.
- **Deployment:** GitHub Pages via GitHub Actions.