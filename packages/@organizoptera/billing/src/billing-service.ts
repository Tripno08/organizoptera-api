/**
 * @module @organizoptera/billing/service
 * @description Core billing and invoicing service
 */

import type { SchoolNetworkId } from '@organizoptera/types';
import type {
  Invoice,
  InvoiceLineItem,
  Payment,
  Refund,
  CreateInvoiceDTO,
  RecordPaymentDTO,
  ProcessRefundDTO,
  InvoiceStatus,
  BillingSummary,
  PaymentHistory,
  WebhookPayload,
  WebhookEvent,
} from './types.js';

/**
 * BillingService - Core business logic for billing and invoicing
 */
export class BillingService {
  constructor() {
    // Service initialized
  }

  /**
   * Create a new invoice
   */
  createInvoice(dto: CreateInvoiceDTO): Invoice {
    const now = new Date();

    // Generate invoice number
    const invoiceNumber = this.generateInvoiceNumber();

    // Calculate line items with tax
    const lineItems: InvoiceLineItem[] = dto.lineItems.map((item, index) => {
      const amount = item.quantity * item.unitPrice;
      const taxAmount = Math.round(amount * (item.taxRate || 0) / 100);

      return {
        id: `li_${Date.now()}_${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
        taxRate: item.taxRate || 0,
        taxAmount,
        metadata: null,
      };
    });

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const discountAmount = dto.discountAmount || 0;
    const total = subtotal + taxAmount - discountAmount;

    const invoice: Invoice = {
      id: this.generateId('inv'),
      invoiceNumber,
      networkId: dto.networkId as SchoolNetworkId,
      subscriptionId: dto.subscriptionId,
      status: 'PENDING',
      plan: dto.plan,
      billingCycle: dto.billingCycle,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      amountDue: total,
      amountPaid: 0,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      issueDate: now,
      dueDate: dto.dueDate,
      paidAt: null,
      lineItems,
      paymentMethod: null,
      transactionId: null,
      notes: dto.notes || null,
      metadata: dto.metadata || null,
      createdAt: now,
      updatedAt: now,
    };

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  markInvoicePaid(
    invoice: Invoice,
    paymentMethod: string,
    transactionId: string,
  ): Invoice {
    return {
      ...invoice,
      status: 'PAID',
      amountPaid: invoice.total,
      amountDue: 0,
      paidAt: new Date(),
      paymentMethod: paymentMethod as any,
      transactionId,
      updatedAt: new Date(),
    };
  }

  /**
   * Mark invoice as past due
   */
  markInvoicePastDue(invoice: Invoice): Invoice {
    return {
      ...invoice,
      status: 'PAST_DUE',
      updatedAt: new Date(),
    };
  }

  /**
   * Cancel an invoice
   */
  cancelInvoice(invoice: Invoice): Invoice {
    if (invoice.status === 'PAID') {
      throw new Error('Cannot cancel a paid invoice. Use refund instead.');
    }

    return {
      ...invoice,
      status: 'CANCELLED',
      updatedAt: new Date(),
    };
  }

  /**
   * Record a payment for an invoice
   */
  recordPayment(invoice: Invoice, dto: RecordPaymentDTO): Payment {
    if (invoice.status === 'PAID') {
      throw new Error('Invoice is already paid');
    }

    if (dto.amount > invoice.amountDue) {
      throw new Error('Payment amount exceeds amount due');
    }

    const payment: Payment = {
      id: this.generateId('pay'),
      invoiceId: dto.invoiceId,
      networkId: invoice.networkId,
      status: 'SUCCEEDED',
      amount: dto.amount,
      currency: 'BRL',
      paymentMethod: dto.paymentMethod,
      transactionId: dto.transactionId || null,
      providerResponse: null,
      failureReason: null,
      processedAt: new Date(),
      metadata: dto.metadata || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return payment;
  }

  /**
   * Process a refund for a payment
   */
  processRefund(payment: Payment, dto: ProcessRefundDTO): Refund {
    if (payment.status !== 'SUCCEEDED') {
      throw new Error('Can only refund successful payments');
    }

    if (dto.amount > payment.amount) {
      throw new Error('Refund amount exceeds payment amount');
    }

    const refund: Refund = {
      id: this.generateId('ref'),
      paymentId: dto.paymentId,
      invoiceId: payment.invoiceId,
      networkId: payment.networkId,
      amount: dto.amount,
      reason: dto.reason,
      notes: dto.notes || null,
      transactionId: `refund_${payment.transactionId}`,
      processedAt: new Date(),
      metadata: null,
      createdAt: new Date(),
    };

    return refund;
  }

  /**
   * Apply refund to invoice
   */
  applyRefundToInvoice(invoice: Invoice, refund: Refund): Invoice {
    const newAmountPaid = invoice.amountPaid - refund.amount;
    const newAmountDue = invoice.total - newAmountPaid;

    let newStatus: InvoiceStatus = invoice.status;
    if (newAmountPaid === 0) {
      newStatus = 'REFUNDED';
    } else if (newAmountDue > 0) {
      newStatus = 'PENDING';
    }

    return {
      ...invoice,
      status: newStatus,
      amountPaid: newAmountPaid,
      amountDue: newAmountDue,
      updatedAt: new Date(),
    };
  }

  /**
   * Calculate billing summary for a network
   */
  calculateBillingSummary(
    invoices: Invoice[],
    periodStart: Date,
    periodEnd: Date,
  ): BillingSummary {
    const filteredInvoices = invoices.filter(
      (inv) =>
        inv.issueDate >= periodStart &&
        inv.issueDate <= periodEnd,
    );

    const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = filteredInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalOutstanding = filteredInvoices
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + inv.amountDue, 0);
    const totalRefunded = filteredInvoices
      .filter((inv) => inv.status === 'REFUNDED')
      .reduce((sum, inv) => sum + inv.total, 0);

    const paidInvoiceCount = filteredInvoices.filter(
      (inv) => inv.status === 'PAID',
    ).length;
    const overdueInvoiceCount = filteredInvoices.filter(
      (inv) => inv.status === 'PAST_DUE',
    ).length;

    const averageInvoiceAmount =
      filteredInvoices.length > 0 ? totalInvoiced / filteredInvoices.length : 0;

    // Get networkId from first invoice (all invoices should have same networkId)
    const networkId = filteredInvoices.length > 0
      ? filteredInvoices[0]!.networkId
      : ('' as SchoolNetworkId);

    return {
      networkId,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalRefunded,
      invoiceCount: filteredInvoices.length,
      paidInvoiceCount,
      overdueInvoiceCount,
      averageInvoiceAmount,
      period: {
        start: periodStart,
        end: periodEnd,
      },
    };
  }

  /**
   * Get payment history for a network
   */
  getPaymentHistory(
    payments: Payment[],
    periodStart: Date,
    periodEnd: Date,
  ): PaymentHistory {
    const filteredPayments = payments.filter(
      (pay) =>
        pay.createdAt >= periodStart &&
        pay.createdAt <= periodEnd,
    );

    const totalAmount = filteredPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const successfulCount = filteredPayments.filter(
      (pay) => pay.status === 'SUCCEEDED',
    ).length;
    const failedCount = filteredPayments.filter(
      (pay) => pay.status === 'FAILED',
    ).length;

    return {
      payments: filteredPayments,
      totalAmount,
      successfulCount,
      failedCount,
      period: {
        start: periodStart,
        end: periodEnd,
      },
    };
  }

  /**
   * Check if invoice is overdue
   */
  isInvoiceOverdue(invoice: Invoice): boolean {
    const now = new Date();
    return (
      invoice.status !== 'PAID' &&
      invoice.status !== 'CANCELLED' &&
      invoice.dueDate < now
    );
  }

  /**
   * Calculate late fee for overdue invoice
   */
  calculateLateFee(invoice: Invoice, lateFeeRate: number): number {
    if (!this.isInvoiceOverdue(invoice)) {
      return 0;
    }

    const now = new Date();
    const daysOverdue = Math.ceil(
      (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate late fee as percentage of total per day
    const dailyRate = lateFeeRate / 30; // Assuming monthly rate
    const lateFee = Math.round(invoice.total * (dailyRate / 100) * daysOverdue);

    return lateFee;
  }

  /**
   * Generate proforma invoice (estimate before actual billing)
   */
  generateProformaInvoice(dto: Omit<CreateInvoiceDTO, 'dueDate'>): Invoice {
    const invoice = this.createInvoice({
      ...dto,
      dueDate: new Date(), // Placeholder
    });

    return {
      ...invoice,
      status: 'DRAFT',
      invoiceNumber: `PROFORMA-${invoice.invoiceNumber}`,
    };
  }

  /**
   * Create webhook payload for an event
   */
  createWebhookPayload(
    event: WebhookEvent,
    data: { invoice?: Invoice; payment?: Payment; refund?: Refund },
  ): WebhookPayload {
    return {
      id: this.generateId('wh'),
      event,
      data,
      timestamp: new Date(),
      signature: this.generateWebhookSignature(event, data),
    };
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(
    payload: WebhookPayload,
    expectedSignature: string,
  ): boolean {
    return payload.signature === expectedSignature;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `INV-${year}${month}-${timestamp}${random}`;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateWebhookSignature(
    event: WebhookEvent,
    data: any,
  ): string {
    // Simple signature generation (in production, use HMAC-SHA256)
    const payload = JSON.stringify({ event, data });
    return `sig_${Buffer.from(payload).toString('base64').substring(0, 32)}`;
  }
}
