// Offline PDF Receipt Generator for EduFee Android App
import { formatCurrency, formatDate } from './utils.js';

export function generateAndDownloadReceiptPDF(school, student, record, batch, monthName) {
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF module is loading. Please try again.');
      return;
    }

    const { jsPDF } = window.jspdf;
    // Standard 80mm POS receipt format (80mm width x 160mm height)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 160]
    });

    const currency = school.currency || '$';
    const balance = Math.max(0, (record.finalAmount || 0) - (record.paidAmount || 0));

    // 1. School Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(school.name || 'Academy', 40, 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate 500
    if (school.tagline) {
      doc.text(school.tagline, 40, 16, { align: 'center' });
    }
    const contactLine = [school.address, school.phone ? `Tel: ${school.phone}` : ''].filter(Boolean).join(' • ');
    if (contactLine) {
      doc.text(contactLine, 40, 20, { align: 'center' });
    }

    // 2. Receipt Badge
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(18, 23, 44, 6, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL FEE RECEIPT', 40, 27.2, { align: 'center' });

    // 3. Metadata Lines
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(6, 32, 74, 32);

    let y = 37;
    const drawRow = (label, val, isBold = false, valColor = [15, 23, 42]) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(label, 8, y);

      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(...valColor);
      doc.text(String(val), 72, y, { align: 'right' });
      y += 5.2;
    };

    drawRow('Receipt No:', record.receiptNo || 'N/A', true);
    drawRow('Payment Date:', formatDate(record.paymentDate));
    drawRow('Student Name:', student.name, true);
    drawRow('Roll / ID:', student.rollNo || '-');
    drawRow('Class / Batch:', batch.name || 'General');
    drawRow('Fee Month:', `${monthName} ${record.year}`, true);

    // 4. Financial Breakdown
    doc.line(6, y, 74, y);
    y += 5;

    drawRow('Monthly Base Fee:', formatCurrency(record.baseAmount || 0, currency));
    if (record.discount > 0) {
      drawRow('Concession / Discount:', `-${formatCurrency(record.discount, currency)}`, false, [16, 185, 129]);
    }
    if (record.fine > 0) {
      drawRow('Late Fine / Penalty:', `+${formatCurrency(record.fine, currency)}`, false, [239, 68, 68]);
    }

    doc.setLineDashPattern([], 0);
    doc.line(6, y - 1, 74, y - 1);

    drawRow('Net Due Amount:', formatCurrency(record.finalAmount || 0, currency), true);
    drawRow('Amount Paid:', formatCurrency(record.paidAmount || 0, currency), true, [16, 185, 129]);
    drawRow('Payment Mode:', record.paymentMode || 'Cash');
    drawRow('Remaining Balance:', formatCurrency(balance, currency), true, balance > 0 ? [239, 68, 68] : [100, 116, 139]);

    // 5. Signatory & Status Stamp
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(6, y, 74, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Authorized Signatory:', 8, y);
    doc.text('Payment Status:', 52, y);

    y += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(school.adminName || 'Accounts Admin', 8, y);

    // Paid stamp badge
    const statusText = record.status || (balance === 0 ? 'PAID' : 'PARTIAL');
    doc.setTextColor(statusText === 'PAID' ? 16 : 245, statusText === 'PAID' ? 185 : 158, statusText === 'PAID' ? 129 : 11);
    doc.text(statusText, 52, y);

    // 6. Footer Note
    y += 9;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Thank you for prompt fee payment!', 40, y, { align: 'center' });
    y += 4;
    doc.text('This is a computer-generated voucher.', 40, y, { align: 'center' });

    // Download PDF directly into phone storage / downloads folder
    const fileName = `Fee-Receipt-${(student.rollNo || 'STD').replace(/[^a-zA-Z0-9_-]/g, '_')}-${monthName}-${record.year}.pdf`;
    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('PDF Generation failed:', error);
    alert('PDF creation failed: ' + error.message);
    return false;
  }
}
