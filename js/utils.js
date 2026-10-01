// Utility functions for formatting, WhatsApp link generation, toasts and receipts
export function formatCurrency(amount, currency = '$') {
  const num = Number(amount) || 0;
  return `${currency}${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  container.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3200);
}

export function generateReceiptNo(year, month) {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RCP-${year}-${String(month).padStart(2, '0')}-${randomSuffix}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// Generate WhatsApp Direct link for Fee Payment Receipt
export function getWhatsAppReceiptUrl(school, student, record, monthName) {
  const cleanPhone = (student.parentPhone || '').replace(/[^0-9]/g, '');
  const currency = school.currency || '$';
  const balance = (record.finalAmount || 0) - (record.paidAmount || 0);

  const text = `*OFFICIAL FEE RECEIPT - ${school.name}*
━━━━━━━━━━━━━━━━━━
🎓 *Student:* ${student.name}
🔢 *Roll No:* ${student.rollNo}
📅 *Month:* ${monthName} ${record.year}
🧾 *Receipt #:* ${record.receiptNo || 'N/A'}
💰 *Amount Paid:* ${currency}${record.paidAmount}
💳 *Payment Mode:* ${record.paymentMode || 'Cash'}
📆 *Payment Date:* ${record.paymentDate || 'Today'}
⚖️ *Remaining Balance:* ${currency}${balance}
━━━━━━━━━━━━━━━━━━
Thank you for your prompt payment!
${school.tagline || ''}
📞 ${school.phone || ''}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

// Generate WhatsApp Direct link for Fee Due Reminder
export function getWhatsAppReminderUrl(school, student, dueAmount, monthName, year) {
  const cleanPhone = (student.parentPhone || '').replace(/[^0-9]/g, '');
  const currency = school.currency || '$';

  const text = `*FEE PAYMENT REMINDER - ${school.name}*
━━━━━━━━━━━━━━━━━━
Dear Parent of *${student.name}* (Roll: ${student.rollNo}),

This is a gentle reminder that the monthly tuition fee for *${monthName} ${year}* is pending.

💰 *Pending Amount Due:* ${currency}${dueAmount}
📅 *Due By:* ${school.feeDueDay || '10'}th of this month

*Bank / Payment Details:*
${school.bankDetails || 'Please visit the school finance desk'}

If you have already paid, please share the payment confirmation with us.
Thank you!
Admin Desk: ${school.phone || ''}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
