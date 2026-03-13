import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export const downloadApprovalPDF = async (approval) => {
  try {
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'A4'
    });
    
    // Title
    pdf.setFontSize(22);
    pdf.setTextColor(59, 130, 246); // Blue
    pdf.text('VISITOR PRE-APPROVAL', 20, 30);
    
    // Line separator
    pdf.setDrawColor(229, 231, 235);
    pdf.line(20, 35, 190, 35);
    
    // Details
    pdf.setTextColor(55, 65, 81);
    pdf.setFontSize(12);
    pdf.text(`Visitor Name: ${approval.visitorName}`, 20, 50);
    pdf.text(`Phone: ${approval.phone}`, 20, 60);
    pdf.text(`Purpose: ${approval.purpose}`, 20, 70);
    
    pdf.text(`Date of Visit: ${approval.dateOfVisit}`, 120, 50);
    pdf.text(`Time Window: ${approval.startTime || approval.fromTime} - ${approval.endTime || approval.toTime}`, 120, 60);
    
    // Box for Approval Code
    pdf.setDrawColor(59, 130, 246);
    pdf.setFillColor(239, 246, 255);
    pdf.roundedRect(20, 85, 170, 25, 3, 3, 'FD');
    pdf.setFontSize(14);
    pdf.setTextColor(30, 64, 175);
    pdf.text(`Secured Approval Code: ${approval.approvalCode}`, 30, 102);
    
    // Generate QR Code as image
    const qrImage = await QRCode.toDataURL(approval.approvalCode, {
      width: 250,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
    
    // Add QR Code to PDF
    pdf.addImage(qrImage, 'PNG', 65, 125, 80, 80);
    
    // Footer
    pdf.setTextColor(156, 163, 175);
    pdf.setFontSize(10);
    pdf.text('Please display this QR code or approval code to the main gate security.', 105, 230, { align: 'center' });
    pdf.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 105, 240, { align: 'center' });
    
    // Download
    pdf.save(`Visitor-Approval-${approval.approvalCode}.pdf`);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
