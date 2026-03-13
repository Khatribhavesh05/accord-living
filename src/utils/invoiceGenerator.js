/**
 * Invoice Generator — Pure JS, no external dependencies.
 * Opens a formatted HTML invoice in a new window for print/save.
 */

export const downloadInvoice = (bill, residentName, flatNumber, societyName = 'CIVIORA') => {
    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Invoice — ${bill.billMonth}/${bill.billYear}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1f2937; background: #fff; }
        .invoice-container { max-width: 700px; margin: 0 auto; }
        .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
        .brand { font-size: 28px; font-weight: 800; color: #3b82f6; letter-spacing: 2px; }
        .brand-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .invoice-label { font-size: 24px; font-weight: 700; color: #374151; text-align: right; }
        .invoice-id { font-size: 12px; color: #6b7280; text-align: right; margin-top: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
        .info-section h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; }
        .info-section p { font-size: 14px; color: #374151; line-height: 1.6; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th { background: #f3f4f6; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
        .items-table td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .items-table .amount { text-align: right; font-weight: 600; font-family: monospace; font-size: 15px; }
        .total-row { background: #eff6ff; }
        .total-row td { font-weight: 700; font-size: 16px; color: #1e40af; border-bottom: none; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
        @media print { body { padding: 20px; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div>
                <div class="brand">${societyName}</div>
                <div class="brand-sub">Society Management Platform</div>
            </div>
            <div>
                <div class="invoice-label">INVOICE</div>
                <div class="invoice-id">#${(bill.id || '').substring(0, 8).toUpperCase()}</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-section">
                <h4>Billed To</h4>
                <p><strong>${residentName || 'Resident'}</strong></p>
                <p>Flat: ${flatNumber || 'N/A'}</p>
            </div>
            <div class="info-section">
                <h4>Bill Details</h4>
                <p>Period: ${bill.billMonth}/${bill.billYear}</p>
                <p>Due Date: ${bill.dueDate || 'N/A'}</p>
                <p>Status: <span class="status-badge ${bill.paymentStatus === 'Paid' ? 'status-paid' : 'status-pending'}">${bill.paymentStatus || 'Pending'}</span></p>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align:right">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${bill.description || 'Monthly Maintenance Charges'}</td>
                    <td class="amount">₹${(bill.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr class="total-row">
                    <td>Total Due</td>
                    <td class="amount">₹${(bill.totalAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <p>This is a computer-generated invoice from ${societyName}.</p>
            <p style="margin-top:4px">Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>

        <div class="no-print" style="text-align:center;margin-top:30px">
            <button onclick="window.print()" style="padding:10px 24px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">
                🖨️ Print / Save as PDF
            </button>
        </div>
    </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
    } else {
        alert('Please allow pop-ups to download the invoice.');
    }
};
