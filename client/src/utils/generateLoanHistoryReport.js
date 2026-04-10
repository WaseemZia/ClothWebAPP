import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateLoanHistoryReport = (loan) => {
  const doc = new jsPDF('portrait');

  // Set font
  doc.setFont('helvetica');

  // Title
  doc.setFontSize(22);
  doc.setTextColor(59, 130, 246);
  doc.text('HAJI GUL CLOTH - LOAN STATEMENT', 105, 20, { align: 'center' });

  // Loan Details
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Information', 14, 32);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`Customer: ${loan.customer?.name || 'Walk-in'}`, 14, 38);
  doc.text(`Phone: ${loan.customer?.phone || 'N/A'}`, 14, 44);
  doc.text(`Loan Date: ${new Date(loan.loanDate).toLocaleDateString()}`, 14, 50);
  
  doc.text(`Total Loan: Rs ${loan.totalAmount.toLocaleString()}`, 120, 38);
  doc.text(`Amount Paid: Rs ${loan.amountPaid.toLocaleString()}`, 120, 44);
  
  doc.setFont('helvetica', 'bold');
  if (loan.remainingBalance > 0) {
    doc.setTextColor(220, 38, 38); // Red
  } else {
    doc.setTextColor(22, 163, 74); // Green
  }
  doc.text(`Remaining Balance: Rs ${loan.remainingBalance.toLocaleString()}`, 120, 50);

  // Table
  let currentY = 60;
  if (loan.payments && loan.payments.length > 0) {
    const tableBody = loan.payments.map((p, i) => [
      i + 1,
      new Date(p.paymentDate).toLocaleString(),
      p.amount.toLocaleString(),
      p.notes || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [[
        { content: '#', styles: { halign: 'center' } },
        { content: 'Date & Time', styles: { halign: 'left' } },
        { content: 'Amount Paid (Rs)', styles: { halign: 'right' } },
        { content: 'Notes', styles: { halign: 'left' } }
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        2: { halign: 'right', textColor: [22, 163, 74], fontStyle: 'bold' } // green
      }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('No payment history recorded yet.', 105, currentY + 10, { align: 'center' });
    currentY += 20;
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('This statement shows partially paid Udhaar / Loans against specific purchases.', 105, currentY, { align: 'center' });

  // Save the PDF
  doc.save(`Loan_Statement_#${loan.id}_${(loan.customer?.name || 'Unknown').replace(/\\s+/g, '_')}.pdf`);
};
