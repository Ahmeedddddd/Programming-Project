const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const pdfService = {
  async generateInvoice(invoiceData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const filename = `factuur_${invoiceData.factuurId}.pdf`;
        const filepath = path.join(__dirname, '../../temp', filename);

        doc.pipe(fs.createWriteStream(filepath));

        // Header
        doc.fontSize(20).text('CareerLaunch Factuur', 50, 50);
        doc.fontSize(12).text(`Factuur #${invoiceData.factuurId}`, 50, 80);
        doc.text(`Datum: ${invoiceData.datum}`, 50, 100);

        // Bedrijf info
        doc.text(`Bedrijf: ${invoiceData.bedrijfNaam}`, 50, 140);
        doc.text(`Email: ${invoiceData.email}`, 50, 160);

        // Services
        doc.text('Services:', 50, 200);
        doc.text('- CareerLaunch deelname', 70, 220);
        doc.text('- Netwerkevenement toegang', 70, 240);

        // Total
        doc.fontSize(14).text('Totaal: €500.00', 50, 280);

        doc.end();

        doc.on('end', () => {
          resolve(filepath);
        });

      } catch (error) {
        reject(error);
      }
    });
  },

  async generateStudentReport() {
    // Generate student overview report
    // Implementation here...
  }
};

module.exports = pdfService;