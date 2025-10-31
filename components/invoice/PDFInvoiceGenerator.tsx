'use client';

import { jsPDF } from 'jspdf';
import { SalesEntry, Product, HolderAccount } from '@/types';

interface PDFInvoiceGeneratorProps {
  salesEntry: SalesEntry;
  product: Product;
  customer: HolderAccount;
  invoiceNumber: string;
}

export class PDFInvoiceGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageWidth: number = 210; // A4 width in mm
  private pageHeight: number = 297; // A4 height in mm
  private margin: number = 15;

  constructor() {
    this.doc = new jsPDF();
    this.setupFonts();
  }

  private setupFonts() {
    // Add custom fonts if needed
    this.doc.setFont('helvetica');
  }

  private addText(text: string, x: number, y: number, options: any = {}) {
    this.doc.setFontSize(options.fontSize || 10);
    this.doc.setTextColor(options.color || '#000000');
    this.doc.text(text, x, y);
  }

  private addLine(x1: number, y1: number, x2: number, y2: number, color: string = '#000000') {
    this.doc.setDrawColor(color);
    this.doc.line(x1, y1, x2, y2);
  }

  private addDottedLine(x1: number, y1: number, x2: number, y2: number) {
    this.doc.setLineDashPattern([2, 2], 0);
    this.addLine(x1, y1, x2, y2);
    this.doc.setLineDashPattern([], 0); // Reset line dash
  }

  private addRect(x: number, y: number, width: number, height: number, fillColor?: string) {
    if (fillColor) {
      this.doc.setFillColor(fillColor);
      this.doc.rect(x, y, width, height, 'F');
    } else {
      this.doc.rect(x, y, width, height);
    }
  }

  private formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  generateInvoice(data: PDFInvoiceGeneratorProps): void {
    const { salesEntry, product, customer, invoiceNumber } = data;
    
    // Reset position
    this.currentY = 20;

    // Header with logo and company name
    this.addHeader();
    
    // Invoice title
    this.addInvoiceTitle();
    
    // Company information
    this.addCompanyInfo();
    
    // Invoice details
    this.addInvoiceDetails(invoiceNumber, salesEntry, customer);
    
    // Bill to section
    this.addBillToSection(customer);
    
    // Invoice part note
    this.addInvoicePartNote();
    
    // Service description table
    this.addServiceTable(product, salesEntry);
    
    // Summary of charges
    this.addSummaryOfCharges(salesEntry);
    
    // Thank you message
    this.addThankYouMessage();
    
    // Payment instructions
    this.addPaymentInstructions();
  }

  private addHeader(): void {
    // Logo area (simplified - just text for now)
    this.addText('SNM', this.margin, this.currentY, { fontSize: 16, color: '#8B4513' });
    this.addText('&', this.margin + 15, this.currentY, { fontSize: 16, color: '#DAA520' });
    this.addText('analytics', this.margin + 25, this.currentY, { fontSize: 16, color: '#8B4513' });
    
    this.currentY += 10;
  }

  private addInvoiceTitle(): void {
    // INVOICE title on the right
    this.addText('INVOICE', this.pageWidth - this.margin - 20, this.currentY, { 
      fontSize: 18, 
      color: '#8B4513' 
    });
    this.currentY += 15;
  }

  private addCompanyInfo(): void {
    // SNM ANALYTICS header
    this.addRect(this.margin, this.currentY, 80, 8, '#DAA520');
    this.addText('SNM ANALYTICS', this.margin + 2, this.currentY + 6, { 
      fontSize: 10, 
      color: '#FFFFFF' 
    });
    
    this.currentY += 12;
    
    // Company details with dotted lines
    const companyDetails = [
      'B316/7 Kaneshie loop, Accra',
      'Accra',
      '(+233) 30 394 3567',
      'snmanalyticsgh@gmail.com'
    ];
    
    companyDetails.forEach((detail, index) => {
      this.addText(detail, this.margin, this.currentY);
      this.addDottedLine(this.margin, this.currentY + 3, this.margin + 80, this.currentY + 3);
      this.currentY += 6;
    });
    
    this.currentY += 5;
  }

  private addInvoiceDetails(invoiceNumber: string, salesEntry: SalesEntry, customer: HolderAccount): void {
    const startX = this.pageWidth - this.margin - 60;
    const startY = this.currentY;
    
    // Invoice details table
    const details = [
      { label: 'INVOICE NO.', value: invoiceNumber },
      { label: 'DATE', value: this.formatDate(salesEntry.date) },
      { label: 'CLIENT ID', value: customer.code },
      { label: 'ORDER NO.', value: salesEntry.salesCode },
      { label: 'TERMS', value: 'Due Upon Receipt' }
    ];
    
    details.forEach((detail, index) => {
      const y = startY + (index * 8);
      
      // Header background
      this.addRect(startX, y, 60, 6, '#DAA520');
      this.addText(detail.label, startX + 2, y + 4, { fontSize: 8, color: '#FFFFFF' });
      
      // Value
      this.addText(detail.value, startX + 2, y + 10, { fontSize: 8 });
    });
    
    this.currentY = startY + (details.length * 8) + 10;
  }

  private addBillToSection(customer: HolderAccount): void {
    // BILL TO header
    this.addRect(this.margin, this.currentY, 80, 8, '#DAA520');
    this.addText('BILL TO:', this.margin + 2, this.currentY + 6, { 
      fontSize: 10, 
      color: '#FFFFFF' 
    });
    
    this.currentY += 12;
    
    // Customer details with dotted lines
    const customerDetails = [
      customer.name,
      'Weston VP Energy Limited', // This would come from customer data
      'Dworwulu, Accra',
      'westonenergi@outlook.com',
      '024 270 4492'
    ];
    
    customerDetails.forEach((detail, index) => {
      this.addText(detail, this.margin, this.currentY);
      this.addDottedLine(this.margin, this.currentY + 3, this.margin + 80, this.currentY + 3);
      this.currentY += 6;
    });
    
    this.currentY += 10;
  }

  private addInvoicePartNote(): void {
    // Invoice part note on the right
    this.addText('30.0% Invoice Part', this.pageWidth - this.margin - 40, this.currentY, { 
      fontSize: 10 
    });
    this.currentY += 15;
  }

  private addServiceTable(product: Product, salesEntry: SalesEntry): void {
    // Table header
    this.addRect(this.margin, this.currentY, this.pageWidth - (2 * this.margin), 8, '#DAA520');
    
    // Header text
    this.addText('No.', this.margin + 2, this.currentY + 6, { fontSize: 10, color: '#FFFFFF' });
    this.addText('DESCRIPTION', this.margin + 15, this.currentY + 6, { fontSize: 10, color: '#FFFFFF' });
    this.addText('FEE (GHS)', this.pageWidth - this.margin - 25, this.currentY + 6, { fontSize: 10, color: '#FFFFFF' });
    
    this.currentY += 12;
    
    // Service row
    this.addText('1', this.margin + 2, this.currentY + 6, { fontSize: 10 });
    this.addText('Financial Model Build & Valuation', this.margin + 15, this.currentY + 6, { fontSize: 10 });
    this.addText(this.formatAmount(salesEntry.salesValue), this.pageWidth - this.margin - 25, this.currentY + 6, { fontSize: 10 });
    
    this.currentY += 15;
  }

  private addSummaryOfCharges(salesEntry: SalesEntry): void {
    const startX = this.pageWidth - this.margin - 60;
    const startY = this.currentY;
    
    // Summary background
    this.addRect(startX, startY, 60, 25, '#F5F5DC');
    
    // Sub Total
    this.addText('Sub Total:', startX + 2, startY + 8, { fontSize: 10 });
    this.addText(this.formatAmount(salesEntry.salesValue), startX + 35, startY + 8, { fontSize: 10 });
    
    // Discount
    const discountRate = 6.4;
    const discountAmount = salesEntry.salesValue * (discountRate / 100);
    this.addText(`Discount: @ ${discountRate}%`, startX + 2, startY + 16, { fontSize: 10 });
    this.addText(this.formatAmount(discountAmount), startX + 35, startY + 16, { fontSize: 10 });
    
    // Total
    const total = salesEntry.salesValue - discountAmount;
    this.addText('Total (GHC):', startX + 2, startY + 24, { fontSize: 12, color: '#8B4513' });
    this.addText(this.formatAmount(total), startX + 35, startY + 24, { fontSize: 12, color: '#8B4513' });
    
    this.currentY = startY + 30;
  }

  private addThankYouMessage(): void {
    this.addText('Thank you for your business!', this.margin, this.currentY, { 
      fontSize: 12, 
      color: '#8B4513' 
    });
    this.currentY += 15;
  }

  private addPaymentInstructions(): void {
    this.addText('Payment Instructions', this.margin, this.currentY, { 
      fontSize: 12, 
      color: '#8B4513' 
    });
    this.currentY += 8;
    
    this.addText('Bank: Access Bank [1019000000955]; Momo: VF Cash [050 605 8699]', 
      this.margin, this.currentY, { fontSize: 10 });
  }

  download(filename?: string): void {
    const defaultFilename = `Invoice-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(filename || defaultFilename);
  }

  getBlob(): Blob {
    return this.doc.output('blob');
  }
}

// React hook for easy usage
export function usePDFInvoice() {
  const generateInvoice = (data: PDFInvoiceGeneratorProps) => {
    const generator = new PDFInvoiceGenerator();
    generator.generateInvoice(data);
    return generator;
  };

  return { generateInvoice };
}
