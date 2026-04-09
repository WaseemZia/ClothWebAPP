import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSalesReport = (salesList, totalAmount) => {
  const doc = new jsPDF('landscape'); // Landscape is better for wide tables
  
  // Set font
  doc.setFont('helvetica');

  // Title
  doc.setFontSize(22);
  doc.setTextColor(59, 130, 246); // Primary blue
  doc.text('HAJI GUL CLOTH - SALES REPORT', 14, 20);

  // Meta Information
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  doc.text(`Total Records: ${salesList.length}`, 14, 34);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74); // Green for money
  doc.text(`Total Revenue in Report: Rs ${totalAmount.toLocaleString()}`, 14, 40);

  // Prepare table data
  const tableBody = salesList.map(sale => {
    const customer = sale.customer ? sale.customer.name : 'Walk-in';
    const item = sale.item ? `${sale.item.name} (${sale.item.genderCategory})` : 'Unknown';
    const payment = sale.isLoan ? `Loan: Rs ${sale.loanAmount.toLocaleString()}` : 'Paid';
    const date = new Date(sale.saleDate).toLocaleDateString();

    return [
      `#${sale.id}`,
      customer,
      item,
      sale.quantitySold.toString(),
      sale.soldRate.toLocaleString(),
      sale.totalSalesAmount.toLocaleString(),
      payment,
      date
    ];
  });

  // Render Table
  autoTable(doc, {
    startY: 48,
    head: [[
      { content: 'ID', styles: { halign: 'left' } },
      { content: 'Customer', styles: { halign: 'left' } },
      { content: 'Item', styles: { halign: 'left' } },
      { content: 'Qty', styles: { halign: 'center' } },
      { content: 'Rate (Rs)', styles: { halign: 'right' } },
      { content: 'Total (Rs)', styles: { halign: 'right' } },
      { content: 'Payment', styles: { halign: 'left' } },
      { content: 'Date', styles: { halign: 'left' } }
    ]],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] } // Make total green
    },
    didParseCell: function (data) {
      // Highlight loans in red in the Payment column
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw.includes('Loan')) {
          data.cell.styles.textColor = [220, 38, 38]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'italic');
  doc.text('This is an automatically generated system report.', 14, finalY);

  // Save the PDF
  doc.save(`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
