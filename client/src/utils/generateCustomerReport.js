import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateCustomerReport = (customer, loans) => {
  const doc = new jsPDF('portrait');
  
  // Set font
  doc.setFont('helvetica');

  // Title
  doc.setFontSize(22);
  doc.setTextColor(59, 130, 246); // Primary blue
  doc.text('HAJI GUL CLOTH - CUSTOMER LEDGER', 105, 20, { align: 'center' });

  // Meta Information (Customer Detail)
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Profile', 14, 32);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text(`Name: ${customer.name}`, 14, 38);
  doc.text(`Phone: ${customer.phone}`, 14, 44);
  doc.text(`Address: ${customer.address || 'N/A'}`, 14, 50);
  doc.text(`Customer Since: ${new Date(customer.createdDate).toLocaleDateString()}`, 14, 56);
  
  doc.text(`Report Generated On: ${new Date().toLocaleString()}`, 130, 38);

  let currentY = 66;

  // ==== TABLE 1: Purchase History ====
  if (customer.sales && customer.sales.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Purchase History', 14, currentY);

    const salesBody = customer.sales.map(sale => [
      `#${sale.id}`,
      sale.item?.name || 'Unknown',
      sale.quantitySold.toString(),
      sale.totalSalesAmount.toLocaleString(),
      sale.isLoan ? 'Loan' : 'Paid',
      new Date(sale.saleDate).toLocaleDateString()
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Sale ID', 'Item', 'Qty', 'Amount (Rs)', 'Payment', 'Date']],
      body: salesBody,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'Loan') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    currentY = doc.lastAutoTable.finalY + 14;
  }

  // ==== TABLE 2: Loan History ====
  if (loans && loans.length > 0) {
    // Check if we need to add a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan History (Udhaar)', 14, currentY);

    const loansBody = loans.map(loan => [
      `#${loan.id}`,
      loan.totalAmount.toLocaleString(),
      loan.amountPaid.toLocaleString(),
      loan.remainingBalance.toLocaleString(),
      loan.status,
      new Date(loan.loanDate).toLocaleDateString(),
      `${loan.payments?.length || 0}`
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Loan ID', 'Total (Rs)', 'Paid (Rs)', 'Remaining (Rs)', 'Status', 'Date', 'Payments']],
      body: loansBody,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }, // Red header for loans
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right', textColor: [22, 163, 74] }, // Green for paid
        3: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }, // Red for remaining
        6: { halign: 'center' }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          if (data.cell.raw === 'Cleared') {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    currentY = doc.lastAutoTable.finalY + 14;
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('This is an exclusively generated customer profile report.', 105, currentY, { align: 'center' });

  // Save the PDF
  doc.save(`Ledger_${customer.name.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
