import { Injectable, Logger } from '@nestjs/common';
import { Document, DocumentType } from './entities/document.entity';
import * as PDFDocument from 'pdfkit';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate PDF for a document
   * @param document - The document to generate PDF for
   * @returns Buffer containing the PDF
   */
  async generateDocumentPdf(document: Document): Promise<Buffer> {
    this.logger.log(`Generating PDF for document ${document.id} of type ${document.type}`);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: document.title,
        Author: document.assignedDoctor?.user?.first_name || 'DentalFlow',
        Subject: document.type,
        Keywords: 'dental, medical, document',
        Creator: 'DentalFlow System',
        Producer: 'DentalFlow PDF Generator'
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Generate content based on document type
    await this.generateContent(doc, document);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        this.logger.log(`PDF generated successfully for document ${document.id}`);
        resolve(pdfBuffer);
      });

      doc.on('error', (error) => {
        this.logger.error(`Error generating PDF for document ${document.id}:`, error);
        reject(error);
      });
    });
  }

  /**
   * Generate content based on document type
   * @param doc - PDF document instance
   * @param document - Document entity
   */
  private async generateContent(doc: PDFKit.PDFDocument, document: Document): Promise<void> {
    // Header
    this.generateHeader(doc, document);

    // Content based on type
    switch (document.type) {
      case DocumentType.PRESCRIPTION:
        this.generatePrescriptionContent(doc, document);
        break;
      case DocumentType.MEDICAL_NOTE:
        this.generateMedicalNoteContent(doc, document);
        break;
      case DocumentType.INVOICE:
        this.generateInvoiceContent(doc, document);
        break;
      case DocumentType.CERTIFICATE:
        this.generateCertificateContent(doc, document);
        break;
      case DocumentType.XRAY_REPORT:
        this.generateXrayReportContent(doc, document);
        break;
      case DocumentType.TREATMENT_PLAN:
        this.generateTreatmentPlanContent(doc, document);
        break;
      case DocumentType.CONSENT_FORM:
        this.generateConsentFormContent(doc, document);
        break;
      default:
        this.generateGenericContent(doc, document);
    }

    // Footer
    this.generateFooter(doc, document);
  }

  /**
   * Generate document header
   */
  private generateHeader(doc: PDFKit.PDFDocument, document: Document): void {
    // Clinic logo/name
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(document.tenant?.name || 'DentalFlow Clinic', { align: 'center' });

    doc.moveDown(0.5);

    // Document title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(document.title, { align: 'center' });

    doc.moveDown(1);

    // Patient and doctor info
    doc.fontSize(12)
       .font('Helvetica');

    const patientInfo = `Patient: ${document.patient?.fullName || 'Unknown'}`;
    const doctorInfo = document.assignedDoctor 
      ? `Doctor: ${document.assignedDoctor.user?.first_name} ${document.assignedDoctor.user?.last_name}`
      : `Created by: ${document.createdBy?.first_name} ${document.createdBy?.last_name}`;
    const dateInfo = `Date: ${document.createdAt.toLocaleDateString()}`;

    doc.text(patientInfo);
    doc.text(doctorInfo);
    doc.text(dateInfo);

    doc.moveDown(1);
  }

  /**
   * Generate prescription content
   */
  private generatePrescriptionContent(doc: PDFKit.PDFDocument, document: Document): void {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('PRESCRIPTION', { align: 'center' });

    doc.moveDown(1);

    const data = document.data;
    
    if (data.diagnosis) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Diagnosis:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.diagnosis);
      doc.moveDown(0.5);
    }

    if (data.treatment) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Treatment:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.treatment);
      doc.moveDown(0.5);
    }

    if (data.medications && Array.isArray(data.medications)) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Medications:');
      
      data.medications.forEach((med: string) => {
        doc.fontSize(12)
           .font('Helvetica')
           .text(`• ${med}`);
      });
      doc.moveDown(0.5);
    }

    if (data.notes) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Notes:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.notes);
    }
  }

  /**
   * Generate medical note content
   */
  private generateMedicalNoteContent(doc: PDFKit.PDFDocument, document: Document): void {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('MEDICAL NOTE', { align: 'center' });

    doc.moveDown(1);

    const data = document.data;
    
    if (data.symptoms) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Symptoms:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.symptoms);
      doc.moveDown(0.5);
    }

    if (data.examination) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Examination:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.examination);
      doc.moveDown(0.5);
    }

    if (data.recommendations) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Recommendations:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.recommendations);
    }
  }

  /**
   * Generate invoice content
   */
  private generateInvoiceContent(doc: PDFKit.PDFDocument, document: Document): void {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('INVOICE', { align: 'center' });

    doc.moveDown(1);

    const data = document.data;
    
    if (data.services && Array.isArray(data.services)) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Services:');
      
      let total = 0;
      data.services.forEach((service: any) => {
        const amount = service.amount || 0;
        total += amount;
        doc.fontSize(12)
           .font('Helvetica')
           .text(`${service.name}: $${amount.toFixed(2)}`);
      });

      doc.moveDown(0.5);
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(`Total: $${total.toFixed(2)}`);
    }
  }

  /**
   * Generate certificate content
   */
  private generateCertificateContent(doc: PDFKit.PDFDocument, document: Document): void {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('MEDICAL CERTIFICATE', { align: 'center' });

    doc.moveDown(2);

    const data = document.data;
    
    doc.fontSize(14)
       .font('Helvetica')
       .text(`This is to certify that ${document.patient?.fullName} has been examined on ${document.createdAt.toLocaleDateString()} and is found to be ${data.condition || 'in good health'}.`);

    doc.moveDown(1);

    if (data.recommendations) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Recommendations:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.recommendations);
    }
  }

  /**
   * Generate X-ray report content
   */
  private generateXrayReportContent(doc: PDFKit.PDFDocument, document: Document): void {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('X-RAY REPORT', { align: 'center' });

    doc.moveDown(1);

    const data = document.data;
    
    if (data.findings) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Findings:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.findings);
      doc.moveDown(0.5);
    }

    if (data.impression) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Impression:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.impression);
    }
  }

  /**
   * Generate treatment plan content
   */
  private generateTreatmentPlanContent(doc: PDFKit.PDFDocument, document: Document): void {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('TREATMENT PLAN', { align: 'center' });

    doc.moveDown(1);

    const data = document.data;
    
    if (data.problems) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Problems Identified:');
      doc.fontSize(12)
         .font('Helvetica')
         .text(data.problems);
      doc.moveDown(0.5);
    }

    if (data.treatments && Array.isArray(data.treatments)) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Proposed Treatments:');
      
      data.treatments.forEach((treatment: any, index: number) => {
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${treatment.name}`);
        doc.fontSize(10)
           .font('Helvetica')
           .text(`   ${treatment.description}`);
        doc.moveDown(0.2);
      });
    }
  }

  /**
   * Generate consent form content
   */
  private generateConsentFormContent(doc: PDFKit.PDFDocument, document: Document): void {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('CONSENT FORM', { align: 'center' });

    doc.moveDown(1);

    const data = document.data;
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`I, ${document.patient?.fullName}, hereby consent to the following treatment: ${data.treatment || 'as described by my dentist'}.`);

    doc.moveDown(1);

    doc.fontSize(12)
       .font('Helvetica')
       .text('I understand the risks and benefits associated with this treatment and have had the opportunity to ask questions.');

    doc.moveDown(2);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Patient Signature: _________________ Date: ${document.createdAt.toLocaleDateString()}`);

    doc.moveDown(1);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`Doctor Signature: _________________ Date: ${document.createdAt.toLocaleDateString()}`);
  }

  /**
   * Generate generic content for unknown document types
   */
  private generateGenericContent(doc: PDFKit.PDFDocument, document: Document): void {
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(document.type.toUpperCase().replace('_', ' '), { align: 'center' });

    doc.moveDown(1);

    const data = document.data;
    
    // Display all data as key-value pairs
    Object.entries(data).forEach(([key, value]) => {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text(`${key.charAt(0).toUpperCase() + key.slice(1)}:`);
      doc.fontSize(12)
         .font('Helvetica')
         .text(Array.isArray(value) ? value.join(', ') : String(value));
      doc.moveDown(0.5);
    });
  }

  /**
   * Generate document footer
   */
  private generateFooter(doc: PDFKit.PDFDocument, document: Document): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      
      doc.fontSize(10)
         .font('Helvetica')
         .text(
           `Generated on ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
           pageWidth - 200,
           pageHeight - 50,
           { width: 200, align: 'right' }
         );
    }
  }
} 