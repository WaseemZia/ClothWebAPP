import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (sale) => {
  const doc = new jsPDF();

  // Set font
  doc.setFont('helvetica');

  // Add Shop Logo/Title
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // Primary blue color
  doc.text('HAJI GUL CLOTH', 105, 20, { align: 'center' });

  // Add Shop Contact
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Zildar Market, Near Rescue Office kamar Mushani Mianwali', 105, 28, { align: 'center' });
  doc.text('Phone: 03029849354 | WhatsApp: 03475222807', 105, 34, { align: 'center' });

  // Horizontal Line
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // Invoice Details
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE / RECEIPT', 14, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Left Column
  const invoiceId = `INV-${sale.id.toString().padStart(6, '0')}`;
  doc.text(`Invoice No: ${invoiceId}`, 14, 60);
  doc.text(`Date: ${new Date(sale.saleDate).toLocaleDateString()}`, 14, 66);

  // Right Column
  const customerName = sale.customer ? sale.customer.name : 'Walk-in Customer';
  const customerPhone = sale.customer ? sale.customer.phone : '-';
  doc.text(`Customer: ${customerName}`, 120, 60);
  doc.text(`Phone: ${customerPhone}`, 120, 66);

  // Table Data
  const itemName = sale.item ? sale.item.name : 'Unknown Cloth';
  // Determine Type/Gender display if needed
  // const qtyType = sale.item?.suiteType === 'Stitched' ? 'Pieces' : 'Meters/Suits';

  autoTable(doc, {
    startY: 76,
    head: [[
      { content: 'Description', styles: { halign: 'left' } },
      { content: 'Qty', styles: { halign: 'center' } },
      { content: 'Rate (Rs)', styles: { halign: 'right' } },
      { content: 'Total (Rs)', styles: { halign: 'right' } }
    ]],
    body: [
      [
        `${itemName}`,
        `${sale.quantitySold}`,
        `${sale.soldRate.toLocaleString()}`,
        `${sale.totalSalesAmount.toLocaleString()}`
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Financial Summary
  doc.setFontSize(11);
  doc.text('Summary:', 130, finalY);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount:', 130, finalY + 8);
  doc.text(`Rs ${sale.totalSalesAmount.toLocaleString()}`, 196, finalY + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Amount Paid:', 130, finalY + 16);
  doc.text(`Rs ${sale.amountPaid.toLocaleString()}`, 196, finalY + 16, { align: 'right' });

  if (sale.isLoan) {
    doc.setTextColor(220, 38, 38); // Danger Red
    doc.setFont('helvetica', 'bold');
    doc.text('Remaining Balance:', 130, finalY + 24);
    doc.text(`Rs ${sale.loanAmount.toLocaleString()}`, 196, finalY + 24, { align: 'right' });
  } else {
    doc.setTextColor(22, 163, 74); // Success Green
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', 130, finalY + 24);
    doc.text('PAID', 196, finalY + 24, { align: 'right' });
  }

  // Footer Message
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for shopping with Haji Gul Cloth!', 105, finalY + 45, { align: 'center' });
  doc.text('No return or exchange without receipt.', 105, finalY + 52, { align: 'center' });

  // Save PDF
  doc.save(`${invoiceId}_${customerName.replace(/\\s+/g, '_')}.pdf`);
};
