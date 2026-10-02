// Offline Receipt Image Generator & Gallery Saver Service
import { formatCurrency, formatDate, getWhatsAppReceiptUrl, showToast } from './utils.js';

/**
 * Creates an ultra-sharp high-resolution canvas of the fee receipt slip
 */
export function generateReceiptCanvas(school, student, record, batch, monthName) {
  const canvas = document.createElement('canvas');
  const width = 760;
  const height = 980;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const currency = school.currency || '$';
  const balance = Math.max(0, (record.finalAmount || 0) - (record.paidAmount || 0));
  const isPaid = balance === 0 && (record.paidAmount || 0) > 0;

  // 1. White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle Outer Card Border with Rounded Corners
  const pad = 24;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const radius = 16;

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#ffffff';
  
  ctx.beginPath();
  ctx.roundRect(pad, pad, cardW, cardH, radius);
  ctx.stroke();

  // Helper for drawing text
  const centerX = width / 2;
  let y = pad + 40;

  // 3. School Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(school.name || 'School Fee Manager', centerX, y);

  y += 24;
  ctx.fillStyle = '#64748b';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(school.tagline || 'Excellence in Knowledge, Character & Leadership', centerX, y);

  y += 20;
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const contactText = [school.address, school.phone ? `Tel: ${school.phone}` : ''].filter(Boolean).join(' • ');
  ctx.fillText(contactText || 'Official Academic Fee Receipt', centerX, y);

  // 4. Dark Badge Capsule: "FEE RECEIPT (STUDENT COPY)"
  y += 24;
  const badgeText = 'FEE RECEIPT (STUDENT COPY)';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const badgeMetrics = ctx.measureText(badgeText);
  const badgeW = badgeMetrics.width + 24;
  const badgeH = 24;
  const badgeX = centerX - badgeW / 2;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(badgeX, y, badgeW, badgeH, 6);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, centerX, y + 16);

  // Helper function for dashed lines
  const drawDashedLine = (lineY) => {
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.moveTo(pad + 20, lineY);
    ctx.lineTo(width - pad - 20, lineY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Helper function for 2-column key-value rows
  const drawRow = (label, val, rowY, valColor = '#0f172a', isBold = true, fontSize = 13) => {
    ctx.font = `500 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(label, pad + 24, rowY);

    ctx.font = `${isBold ? 'bold' : '500'} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = valColor;
    ctx.textAlign = 'right';
    ctx.fillText(val, width - pad - 24, rowY);
  };

  // 5. Divider
  y += badgeH + 20;
  drawDashedLine(y);

  // 6. Metadata Block
  y += 26;
  drawRow('Receipt No:', record.receiptNo || `RCP-${record.id}`, y, '#0f172a', true, 13);
  y += 26;
  drawRow('Date:', formatDate(record.paymentDate), y, '#0f172a', false, 13);
  y += 26;
  drawRow('Student Name:', student.name, y, '#0f172a', true, 14);
  y += 26;
  drawRow('Roll No:', student.rollNo, y, '#0f172a', true, 13);
  y += 26;
  drawRow('Batch / Class:', batch.name || 'General', y, '#0f172a', false, 13);
  y += 26;
  drawRow('Fee Month:', `${monthName} ${record.year}`, y, '#4f46e5', true, 13);

  // 7. Divider
  y += 18;
  drawDashedLine(y);

  // 8. Financial Breakdown Block
  y += 26;
  drawRow('Tuition Fee:', formatCurrency(record.baseAmount || student.monthlyFee || 0, currency), y, '#0f172a', false, 13);

  if ((record.discount || 0) > 0) {
    y += 24;
    drawRow('Scholarship / Disc:', `-${formatCurrency(record.discount, currency)}`, y, '#059669', false, 13);
  }

  if ((record.fine || 0) > 0) {
    y += 24;
    drawRow('Late Fine / Fee:', `+${formatCurrency(record.fine, currency)}`, y, '#dc2626', false, 13);
  }

  y += 26;
  drawRow('Net Amount Due:', formatCurrency(record.finalAmount, currency), y, '#0f172a', true, 15);

  y += 30;
  drawRow('Amount Paid:', formatCurrency(record.paidAmount, currency), y, '#059669', true, 19);

  y += 26;
  drawRow('Payment Mode:', record.paymentMode || 'Cash', y, '#0f172a', false, 13);

  y += 26;
  drawRow('Remaining Balance:', formatCurrency(balance, currency), y, balance > 0 ? '#dc2626' : '#0f172a', true, 14);

  // 9. Divider
  y += 20;
  drawDashedLine(y);

  // 10. Footer / Signatory & Stamp
  y += 36;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Authorized Signatory:', pad + 24, y);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(school.adminName || 'Accounts Admin', pad + 24, y + 20);

  // Official Stamp Box (Right Side)
  const stampX = width - pad - 120;
  const stampY = y - 10;
  const stampW = 96;
  const stampH = 38;

  ctx.save();
  ctx.translate(stampX + stampW / 2, stampY + stampH / 2);
  ctx.rotate(-5 * Math.PI / 180);

  const stampColor = isPaid ? '#059669' : (balance > 0 && record.paidAmount > 0 ? '#d97706' : '#dc2626');
  const stampText = isPaid ? 'PAID' : (balance > 0 && record.paidAmount > 0 ? 'PARTIAL' : 'DUE');

  ctx.strokeStyle = stampColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-stampW / 2, -stampH / 2, stampW, stampH, 8);
  ctx.stroke();

  ctx.fillStyle = stampColor;
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(stampText, 0, 5);
  ctx.restore();

  // 11. Bottom watermark
  y += 56;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${school.name || 'EduFee'} • Generated via EduFee App`, centerX, height - pad - 14);

  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png')
  };
}

/**
 * Saves the fee receipt picture directly to Android phone Gallery (Pictures/EduFee)
 * or triggers instant download on desktop browsers
 */
export async function saveReceiptImageToGallery(school, student, record, batch, monthName) {
  const result = generateReceiptCanvas(school, student, record, batch, monthName);
  if (!result) {
    showToast('Failed to generate receipt image');
    return false;
  }

  const { dataUrl } = result;
  const receiptNumber = (record.receiptNo || `RCP-${record.month}-${student.rollNo}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Fee-Receipt-${receiptNumber}.png`;

  // 1. Check for native Android GallerySaver plugin
  const GallerySaver = window.Capacitor?.Plugins?.GallerySaver;
  if (GallerySaver && typeof GallerySaver.saveImageToGallery === 'function') {
    try {
      showToast('Saving receipt picture to Gallery...');
      const response = await GallerySaver.saveImageToGallery({
        base64: dataUrl,
        fileName: fileName
      });
      showToast('✓ Fee Slip saved to Gallery (Pictures/EduFee)!');
      return true;
    } catch (err) {
      console.warn('Native GallerySaver error, falling back to download:', err);
    }
  }

  // 2. Web / Browser fallback: trigger instant file download
  try {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('✓ Receipt image downloaded to device!');
    return true;
  } catch (err) {
    console.error('Download error:', err);
    // 3. Fallback: open in new tab
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${dataUrl}" alt="Fee Receipt" style="max-width: 100%;">`);
    }
    showToast('Receipt picture generated');
    return true;
  }
}

/**
 * Shares the fee receipt picture directly via Android native share or Web Share API
 */
export async function shareReceiptImage(school, student, record, batch, monthName) {
  const result = generateReceiptCanvas(school, student, record, batch, monthName);
  if (!result) {
    showToast('Failed to generate receipt image');
    return;
  }

  const { dataUrl } = result;
  const receiptNumber = (record.receiptNo || `RCP-${record.month}-${student.rollNo}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Fee-Receipt-${receiptNumber}.png`;
  const shareTitle = `Fee Receipt - ${student.name} (${monthName} ${record.year})`;

  // 1. Check for native Android shareImage plugin
  const GallerySaver = window.Capacitor?.Plugins?.GallerySaver;
  if (GallerySaver && typeof GallerySaver.shareImage === 'function') {
    try {
      await GallerySaver.shareImage({
        base64: dataUrl,
        fileName: fileName,
        title: shareTitle
      });
      return;
    } catch (err) {
      console.warn('Native shareImage error, falling back:', err);
    }
  }

  // 2. Try Web Share API with File
  if (navigator.canShare) {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: `Fee Receipt for ${student.name}`
        });
        return;
      }
    } catch (e) {
      console.warn('Web Share API error:', e);
    }
  }

  // 3. Fallback to WhatsApp chat message
  const waUrl = getWhatsAppReceiptUrl(school, student, record, batch, monthName);
  window.open(waUrl, '_blank');
}
