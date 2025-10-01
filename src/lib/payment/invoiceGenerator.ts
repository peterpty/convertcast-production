'use client';

import jsPDF from 'jspdf';
import { PaymentSession, PaymentOffer } from './paymentEngine';
import { ViewerProfile } from '../ai/scoringEngine';

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  paymentSession: PaymentSession;
  customer: {
    name: string;
    email: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    };
  };
  company: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    email: string;
    phone: string;
    website: string;
    taxId?: string;
  };
  lineItems: LineItem[];
  summary: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
  };
  paymentDetails: {
    method: string;
    transactionId: string;
    paymentDate: Date;
    status: 'paid' | 'pending' | 'failed';
  };
  terms?: string;
  notes?: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxable: boolean;
}

export interface TaxConfiguration {
  rate: number;
  description: string;
  region: string;
  applicableCountries: string[];
}

export class InvoiceGenerator {
  private taxConfigurations: TaxConfiguration[] = [
    {
      rate: 0.0875, // 8.75%
      description: 'Sales Tax',
      region: 'US-NY',
      applicableCountries: ['US']
    },
    {
      rate: 0.20, // 20%
      description: 'VAT',
      region: 'EU',
      applicableCountries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT']
    },
    {
      rate: 0.20, // 20%
      description: 'VAT',
      region: 'GB',
      applicableCountries: ['GB']
    },
    {
      rate: 0.10, // 10%
      description: 'GST',
      region: 'AU',
      applicableCountries: ['AU']
    }
  ];

  private companyInfo = {
    name: 'ConvertCast LLC',
    address: {
      line1: '123 Streaming Avenue',
      line2: 'Suite 100',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States'
    },
    email: 'billing@convertcast.com',
    phone: '+1 (555) 123-4567',
    website: 'https://convertcast.com',
    taxId: '12-3456789'
  };

  /**
   * Generate invoice data from payment session
   */
  generateInvoiceData(
    session: PaymentSession,
    viewer: ViewerProfile,
    customerAddress?: InvoiceData['customer']['address']
  ): InvoiceData {
    const invoiceNumber = this.generateInvoiceNumber();
    const issueDate = new Date();
    const dueDate = new Date(); // Immediate for digital products

    // Calculate tax if applicable
    const taxConfig = this.getTaxConfiguration(customerAddress?.country || 'US');
    const subtotal = session.finalPrice;
    const taxAmount = taxConfig ? subtotal * taxConfig.rate : 0;
    const discountAmount = session.originalPrice - session.finalPrice;
    const total = subtotal + taxAmount;

    // Create line items
    const lineItems: LineItem[] = [
      {
        description: session.offer.name,
        quantity: 1,
        unitPrice: session.finalPrice,
        total: session.finalPrice,
        taxable: true
      }
    ];

    // Add discount as separate line item if applicable
    if (discountAmount > 0) {
      lineItems.push({
        description: `Discount (${session.offer.discountPercentage}%)`,
        quantity: 1,
        unitPrice: -discountAmount,
        total: -discountAmount,
        taxable: false
      });
    }

    const invoiceData: InvoiceData = {
      invoiceNumber,
      issueDate,
      dueDate,
      paymentSession: session,
      customer: {
        name: viewer.name,
        email: viewer.email,
        address: customerAddress
      },
      company: this.companyInfo,
      lineItems,
      summary: {
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        currency: session.currency
      },
      paymentDetails: {
        method: session.paymentMethod === 'stripe' ? 'Credit Card' : 'PayPal',
        transactionId: session.stripePaymentIntentId || session.paypalOrderId || session.id,
        paymentDate: session.completedAt || new Date(),
        status: session.status === 'completed' ? 'paid' : 'pending'
      },
      terms: 'Digital products are delivered immediately upon payment confirmation.',
      notes: 'Thank you for your purchase! Access details have been sent to your email.'
    };

    return invoiceData;
  }

  /**
   * Generate PDF invoice
   */
  async generatePDFInvoice(invoiceData: InvoiceData): Promise<Uint8Array> {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

    // Colors
    const primaryColor = '#8B5CF6'; // Purple
    const darkGray = '#374151';
    const lightGray = '#6B7280';

    // Add company logo/header
    pdf.setFillColor(139, 92, 246); // Purple
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Company name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text(invoiceData.company.name, margin, 25);

    // Invoice title and number
    pdf.setFontSize(16);
    pdf.text('INVOICE', pageWidth - margin - 30, 15);
    pdf.setFontSize(12);
    pdf.text(invoiceData.invoiceNumber, pageWidth - margin - 30, 25);

    // Reset text color for body
    pdf.setTextColor(55, 65, 81);

    // Company information
    let yPos = 55;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const companyLines = [
      invoiceData.company.address.line1,
      invoiceData.company.address.line2,
      `${invoiceData.company.address.city}, ${invoiceData.company.address.state} ${invoiceData.company.address.postalCode}`,
      invoiceData.company.address.country,
      '',
      `Email: ${invoiceData.company.email}`,
      `Phone: ${invoiceData.company.phone}`,
      `Website: ${invoiceData.company.website}`
    ].filter(Boolean);

    companyLines.forEach(line => {
      if (line) {
        pdf.text(line, margin, yPos);
        yPos += 5;
      }
    });

    // Customer information
    yPos = 55;
    const customerX = pageWidth - margin - 60;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Bill To:', customerX, yPos);
    yPos += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceData.customer.name, customerX, yPos);
    yPos += 5;
    pdf.text(invoiceData.customer.email, customerX, yPos);
    yPos += 5;

    if (invoiceData.customer.address) {
      const addr = invoiceData.customer.address;
      const addressLines = [
        addr.line1,
        addr.line2,
        `${addr.city}, ${addr.state || ''} ${addr.postalCode}`,
        addr.country
      ].filter(Boolean);

      addressLines.forEach(line => {
        if (line) {
          pdf.text(line, customerX, yPos);
          yPos += 5;
        }
      });
    }

    // Invoice details
    yPos = Math.max(yPos, 120);
    const detailsY = yPos;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Invoice Date:', margin, detailsY);
    pdf.text('Due Date:', margin, detailsY + 8);
    pdf.text('Payment Method:', margin, detailsY + 16);
    pdf.text('Transaction ID:', margin, detailsY + 24);
    pdf.text('Status:', margin, detailsY + 32);

    pdf.setFont('helvetica', 'normal');
    pdf.text(invoiceData.issueDate.toLocaleDateString(), margin + 35, detailsY);
    pdf.text(invoiceData.dueDate.toLocaleDateString(), margin + 35, detailsY + 8);
    pdf.text(invoiceData.paymentDetails.method, margin + 35, detailsY + 16);
    pdf.text(invoiceData.paymentDetails.transactionId, margin + 35, detailsY + 24);

    // Status with color
    if (invoiceData.paymentDetails.status === 'paid') {
      pdf.setTextColor(34, 197, 94); // Green
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAID', margin + 35, detailsY + 32);
    } else {
      pdf.setTextColor(239, 68, 68); // Red
      pdf.setFont('helvetica', 'bold');
      pdf.text('PENDING', margin + 35, detailsY + 32);
    }

    pdf.setTextColor(55, 65, 81); // Reset to dark gray

    // Line items table
    yPos = detailsY + 50;

    // Table header
    pdf.setFillColor(243, 244, 246); // Light gray
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Description', margin + 2, yPos + 7);
    pdf.text('Qty', margin + 80, yPos + 7);
    pdf.text('Unit Price', margin + 100, yPos + 7);
    pdf.text('Total', margin + 130, yPos + 7);

    yPos += 15;

    // Line items
    pdf.setFont('helvetica', 'normal');
    invoiceData.lineItems.forEach((item, index) => {
      const rowColor = index % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
      pdf.setFillColor(rowColor[0], rowColor[1], rowColor[2]);
      pdf.rect(margin, yPos - 3, pageWidth - 2 * margin, 10, 'F');

      pdf.text(item.description, margin + 2, yPos + 4);
      pdf.text(item.quantity.toString(), margin + 80, yPos + 4);
      pdf.text(this.formatCurrency(item.unitPrice, invoiceData.summary.currency), margin + 100, yPos + 4);
      pdf.text(this.formatCurrency(item.total, invoiceData.summary.currency), margin + 130, yPos + 4);

      yPos += 12;
    });

    // Summary section
    yPos += 10;
    const summaryX = pageWidth - margin - 60;

    // Subtotal
    pdf.text('Subtotal:', summaryX, yPos);
    pdf.text(this.formatCurrency(invoiceData.summary.subtotal, invoiceData.summary.currency), summaryX + 30, yPos);
    yPos += 8;

    // Tax
    if (invoiceData.summary.tax > 0) {
      const taxConfig = this.getTaxConfiguration(invoiceData.customer.address?.country || 'US');
      const taxLabel = taxConfig?.description || 'Tax';
      pdf.text(`${taxLabel}:`, summaryX, yPos);
      pdf.text(this.formatCurrency(invoiceData.summary.tax, invoiceData.summary.currency), summaryX + 30, yPos);
      yPos += 8;
    }

    // Total
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Total:', summaryX, yPos);
    pdf.text(this.formatCurrency(invoiceData.summary.total, invoiceData.summary.currency), summaryX + 30, yPos);

    // Footer
    yPos = pageHeight - 40;

    if (invoiceData.terms) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Terms & Conditions:', margin, yPos);
      yPos += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const termsLines = pdf.splitTextToSize(invoiceData.terms, pageWidth - 2 * margin);
      pdf.text(termsLines, margin, yPos);
      yPos += termsLines.length * 4 + 5;
    }

    if (invoiceData.notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Notes:', margin, yPos);
      yPos += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const notesLines = pdf.splitTextToSize(invoiceData.notes, pageWidth - 2 * margin);
      pdf.text(notesLines, margin, yPos);
    }

    // Return PDF as Uint8Array
    return pdf.output('arraybuffer') as unknown as Uint8Array;
  }

  /**
   * Generate and download invoice
   */
  async generateAndDownloadInvoice(
    session: PaymentSession,
    viewer: ViewerProfile,
    customerAddress?: InvoiceData['customer']['address']
  ): Promise<void> {
    const invoiceData = this.generateInvoiceData(session, viewer, customerAddress);
    const pdfBytes = await this.generatePDFInvoice(invoiceData);

    // Create download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceData.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Send invoice via email (placeholder for API call)
   */
  async sendInvoiceEmail(
    session: PaymentSession,
    viewer: ViewerProfile,
    customerAddress?: InvoiceData['customer']['address']
  ): Promise<{ success: boolean; emailId?: string; error?: string }> {
    const invoiceData = this.generateInvoiceData(session, viewer, customerAddress);
    const pdfBytes = await this.generatePDFInvoice(invoiceData);

    // Convert to base64 for email attachment
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));

    try {
      // In a real implementation, this would call your email service
      const response = await fetch('/api/email/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: viewer.email,
          subject: `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.company.name}`,
          invoiceData,
          pdfAttachment: base64Pdf
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invoice email');
      }

      const result = await response.json();
      return { success: true, emailId: result.emailId };
    } catch (error) {
      console.error('Invoice email send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get tax configuration for country
   */
  private getTaxConfiguration(countryCode: string): TaxConfiguration | null {
    return this.taxConfigurations.find(config =>
      config.applicableCountries.includes(countryCode)
    ) || null;
  }

  /**
   * Generate unique invoice number
   */
  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `INV-${year}${month}${day}-${random}`;
  }

  /**
   * Format currency amount
   */
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

// Export singleton instance
export const invoiceGenerator = new InvoiceGenerator();