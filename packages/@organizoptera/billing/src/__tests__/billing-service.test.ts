/**
 * @module @organizoptera/billing/__tests__
 * @description Comprehensive tests for BillingService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BillingService } from '../billing-service.js';
import type {
  Invoice,
  Payment,
  Refund,
  CreateInvoiceDTO,
  RecordPaymentDTO,
  ProcessRefundDTO,
} from '../types.js';

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(() => {
    service = new BillingService();
  });

  describe('createInvoice', () => {
    it('should create invoice with correct totals', () => {
      const dto: CreateInvoiceDTO = {
        networkId: 'net_123',
        subscriptionId: 'sub_456',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        dueDate: new Date('2026-02-10'),
        lineItems: [
          {
            description: 'Professional Plan',
            quantity: 1,
            unitPrice: 29900,
            taxRate: 10,
          },
        ],
      };

      const invoice = service.createInvoice(dto);

      expect(invoice.subtotal).toBe(29900);
      expect(invoice.taxAmount).toBe(2990); // 10% of 29900
      expect(invoice.total).toBe(32890); // 29900 + 2990
      expect(invoice.amountDue).toBe(32890);
      expect(invoice.amountPaid).toBe(0);
      expect(invoice.status).toBe('PENDING');
    });

    it('should apply discount correctly', () => {
      const dto: CreateInvoiceDTO = {
        networkId: 'net_123',
        subscriptionId: 'sub_456',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
        dueDate: new Date('2026-02-10'),
        lineItems: [
          {
            description: 'Starter Plan',
            quantity: 1,
            unitPrice: 9900,
          },
        ],
        discountAmount: 1000, // $10 discount
      };

      const invoice = service.createInvoice(dto);

      expect(invoice.subtotal).toBe(9900);
      expect(invoice.discountAmount).toBe(1000);
      expect(invoice.total).toBe(8900); // 9900 - 1000
    });

    it('should handle multiple line items', () => {
      const dto: CreateInvoiceDTO = {
        networkId: 'net_multi',
        subscriptionId: 'sub_multi',
        plan: 'ENTERPRISE',
        billingCycle: 'ANNUAL',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-12-31'),
        dueDate: new Date('2026-02-01'),
        lineItems: [
          {
            description: 'Enterprise Plan',
            quantity: 1,
            unitPrice: 99900,
            taxRate: 10,
          },
          {
            description: 'Additional Storage',
            quantity: 5,
            unitPrice: 1000,
            taxRate: 10,
          },
        ],
      };

      const invoice = service.createInvoice(dto);

      expect(invoice.lineItems.length).toBe(2);
      expect(invoice.subtotal).toBe(104900); // 99900 + (5 * 1000)
      expect(invoice.taxAmount).toBe(10490); // 10% of 104900
      expect(invoice.total).toBe(115390);
    });

    it('should generate unique invoice number', () => {
      const dto: CreateInvoiceDTO = {
        networkId: 'net_num',
        subscriptionId: 'sub_num',
        plan: 'FREE',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 0,
          },
        ],
      };

      const invoice1 = service.createInvoice(dto);
      const invoice2 = service.createInvoice(dto);

      expect(invoice1.invoiceNumber).not.toBe(invoice2.invoiceNumber);
      expect(invoice1.invoiceNumber).toMatch(/^INV-\d{6}-\d{6}[A-Z0-9]{3}$/);
    });
  });

  describe('markInvoicePaid', () => {
    let invoice: Invoice;

    beforeEach(() => {
      invoice = service.createInvoice({
        networkId: 'net_paid',
        subscriptionId: 'sub_paid',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 29900,
          },
        ],
      });
    });

    it('should mark invoice as paid', () => {
      const paid = service.markInvoicePaid(invoice, 'CREDIT_CARD', 'txn_123');

      expect(paid.status).toBe('PAID');
      expect(paid.amountPaid).toBe(paid.total);
      expect(paid.amountDue).toBe(0);
      expect(paid.paidAt).not.toBeNull();
      expect(paid.paymentMethod).toBe('CREDIT_CARD');
      expect(paid.transactionId).toBe('txn_123');
    });
  });

  describe('markInvoicePastDue', () => {
    it('should mark invoice as past due', () => {
      const invoice = service.createInvoice({
        networkId: 'net_pastdue',
        subscriptionId: 'sub_pastdue',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 9900,
          },
        ],
      });

      const pastDue = service.markInvoicePastDue(invoice);

      expect(pastDue.status).toBe('PAST_DUE');
    });
  });

  describe('cancelInvoice', () => {
    it('should cancel pending invoice', () => {
      const invoice = service.createInvoice({
        networkId: 'net_cancel',
        subscriptionId: 'sub_cancel',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 9900,
          },
        ],
      });

      const cancelled = service.cancelInvoice(invoice);

      expect(cancelled.status).toBe('CANCELLED');
    });

    it('should throw error when cancelling paid invoice', () => {
      const invoice = service.createInvoice({
        networkId: 'net_cancel_paid',
        subscriptionId: 'sub_cancel_paid',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 9900,
          },
        ],
      });

      const paidInvoice = service.markInvoicePaid(invoice, 'PIX', 'txn_456');

      expect(() => service.cancelInvoice(paidInvoice)).toThrow('Cannot cancel a paid invoice');
    });
  });

  describe('recordPayment', () => {
    let invoice: Invoice;

    beforeEach(() => {
      invoice = service.createInvoice({
        networkId: 'net_payment',
        subscriptionId: 'sub_payment',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 29900,
          },
        ],
      });
    });

    it('should record payment successfully', () => {
      const dto: RecordPaymentDTO = {
        invoiceId: invoice.id,
        amount: invoice.total,
        paymentMethod: 'CREDIT_CARD',
        transactionId: 'txn_789',
      };

      const payment = service.recordPayment(invoice, dto);

      expect(payment.status).toBe('SUCCEEDED');
      expect(payment.amount).toBe(invoice.total);
      expect(payment.invoiceId).toBe(invoice.id);
      expect(payment.paymentMethod).toBe('CREDIT_CARD');
      expect(payment.transactionId).toBe('txn_789');
    });

    it('should throw error for already paid invoice', () => {
      const paidInvoice = service.markInvoicePaid(invoice, 'PIX', 'txn_abc');

      const dto: RecordPaymentDTO = {
        invoiceId: paidInvoice.id,
        amount: paidInvoice.total,
        paymentMethod: 'CREDIT_CARD',
      };

      expect(() => service.recordPayment(paidInvoice, dto)).toThrow('Invoice is already paid');
    });

    it('should throw error when payment exceeds amount due', () => {
      const dto: RecordPaymentDTO = {
        invoiceId: invoice.id,
        amount: invoice.total + 1000, // More than due
        paymentMethod: 'CREDIT_CARD',
      };

      expect(() => service.recordPayment(invoice, dto)).toThrow(
        'Payment amount exceeds amount due'
      );
    });
  });

  describe('processRefund', () => {
    let payment: Payment;

    beforeEach(() => {
      const invoice = service.createInvoice({
        networkId: 'net_refund',
        subscriptionId: 'sub_refund',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 29900,
          },
        ],
      });

      payment = service.recordPayment(invoice, {
        invoiceId: invoice.id,
        amount: invoice.total,
        paymentMethod: 'CREDIT_CARD',
        transactionId: 'txn_refund',
      });
    });

    it('should process full refund', () => {
      const dto: ProcessRefundDTO = {
        paymentId: payment.id,
        amount: payment.amount,
        reason: 'REQUESTED_BY_CUSTOMER',
        notes: 'Customer requested refund',
      };

      const refund = service.processRefund(payment, dto);

      expect(refund.amount).toBe(payment.amount);
      expect(refund.paymentId).toBe(payment.id);
      expect(refund.reason).toBe('REQUESTED_BY_CUSTOMER');
      expect(refund.notes).toBe('Customer requested refund');
    });

    it('should process partial refund', () => {
      const dto: ProcessRefundDTO = {
        paymentId: payment.id,
        amount: Math.floor(payment.amount / 2),
        reason: 'SERVICE_NOT_PROVIDED',
      };

      const refund = service.processRefund(payment, dto);

      expect(refund.amount).toBe(Math.floor(payment.amount / 2));
    });

    it('should throw error for non-successful payment', () => {
      const failedPayment: Payment = {
        ...payment,
        status: 'FAILED',
      };

      const dto: ProcessRefundDTO = {
        paymentId: failedPayment.id,
        amount: 1000,
        reason: 'OTHER',
      };

      expect(() => service.processRefund(failedPayment, dto)).toThrow(
        'Can only refund successful payments'
      );
    });

    it('should throw error when refund exceeds payment amount', () => {
      const dto: ProcessRefundDTO = {
        paymentId: payment.id,
        amount: payment.amount + 1000,
        reason: 'DUPLICATE_CHARGE',
      };

      expect(() => service.processRefund(payment, dto)).toThrow(
        'Refund amount exceeds payment amount'
      );
    });
  });

  describe('applyRefundToInvoice', () => {
    it('should apply full refund and mark invoice as refunded', () => {
      const invoice = service.createInvoice({
        networkId: 'net_refund_inv',
        subscriptionId: 'sub_refund_inv',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 9900,
          },
        ],
      });

      const paidInvoice = service.markInvoicePaid(invoice, 'PIX', 'txn_xyz');

      const payment = service.recordPayment(invoice, {
        invoiceId: invoice.id,
        amount: invoice.total,
        paymentMethod: 'PIX',
        transactionId: 'txn_xyz',
      });

      const refund = service.processRefund(payment, {
        paymentId: payment.id,
        amount: payment.amount,
        reason: 'REQUESTED_BY_CUSTOMER',
      });

      const refundedInvoice = service.applyRefundToInvoice(paidInvoice, refund);

      expect(refundedInvoice.status).toBe('REFUNDED');
      expect(refundedInvoice.amountPaid).toBe(0);
      expect(refundedInvoice.amountDue).toBe(refundedInvoice.total);
    });

    it('should apply partial refund and mark invoice as pending', () => {
      const invoice = service.createInvoice({
        networkId: 'net_partial',
        subscriptionId: 'sub_partial',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [
          {
            description: 'Test',
            quantity: 1,
            unitPrice: 29900,
          },
        ],
      });

      const paidInvoice = service.markInvoicePaid(invoice, 'CREDIT_CARD', 'txn_partial');

      const payment = service.recordPayment(invoice, {
        invoiceId: invoice.id,
        amount: invoice.total,
        paymentMethod: 'CREDIT_CARD',
        transactionId: 'txn_partial',
      });

      const refund = service.processRefund(payment, {
        paymentId: payment.id,
        amount: Math.floor(payment.amount / 2), // 50% refund
        reason: 'SERVICE_NOT_PROVIDED',
      });

      const partialRefundedInvoice = service.applyRefundToInvoice(paidInvoice, refund);

      expect(partialRefundedInvoice.status).toBe('PENDING');
      expect(partialRefundedInvoice.amountPaid).toBe(Math.floor(invoice.total / 2));
      expect(partialRefundedInvoice.amountDue).toBeGreaterThan(0);
    });
  });

  describe('calculateBillingSummary', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should calculate correct billing summary', () => {
      const periodStart = new Date('2026-01-01');
      const periodEnd = new Date('2026-01-31');

      const invoices: Invoice[] = [
        service.createInvoice({
          networkId: 'net_summary',
          subscriptionId: 'sub_1',
          plan: 'STARTER',
          billingCycle: 'MONTHLY',
          periodStart,
          periodEnd,
          dueDate: new Date('2026-02-10'),
          lineItems: [{ description: 'Plan', quantity: 1, unitPrice: 9900 }],
        }),
        service.createInvoice({
          networkId: 'net_summary',
          subscriptionId: 'sub_2',
          plan: 'PROFESSIONAL',
          billingCycle: 'MONTHLY',
          periodStart,
          periodEnd,
          dueDate: new Date('2026-02-10'),
          lineItems: [{ description: 'Plan', quantity: 1, unitPrice: 29900 }],
        }),
      ];

      // Mark one as paid
      invoices[0] = service.markInvoicePaid(invoices[0], 'PIX', 'txn_summary1');

      const summary = service.calculateBillingSummary(invoices, periodStart, periodEnd);

      expect(summary.invoiceCount).toBe(2);
      expect(summary.paidInvoiceCount).toBe(1);
      expect(summary.totalInvoiced).toBe(39800); // 9900 + 29900
      expect(summary.totalPaid).toBe(9900);
      expect(summary.totalOutstanding).toBe(29900);
    });
  });

  describe('getPaymentHistory', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return filtered payment history', () => {
      const periodStart = new Date('2026-01-01');
      const periodEnd = new Date('2026-01-31');

      const invoice = service.createInvoice({
        networkId: 'net_history',
        subscriptionId: 'sub_history',
        plan: 'ENTERPRISE',
        billingCycle: 'MONTHLY',
        periodStart,
        periodEnd,
        dueDate: new Date('2026-02-10'),
        lineItems: [{ description: 'Plan', quantity: 1, unitPrice: 99900 }],
      });

      const payment1 = service.recordPayment(invoice, {
        invoiceId: invoice.id,
        amount: 50000,
        paymentMethod: 'CREDIT_CARD',
      });

      const payment2 = service.recordPayment(invoice, {
        invoiceId: invoice.id,
        amount: 49900,
        paymentMethod: 'PIX',
      });

      const history = service.getPaymentHistory([payment1, payment2], periodStart, periodEnd);

      expect(history.payments.length).toBe(2);
      expect(history.totalAmount).toBe(99900);
      expect(history.successfulCount).toBe(2);
      expect(history.failedCount).toBe(0);
    });
  });

  describe('isInvoiceOverdue', () => {
    it('should detect overdue invoice', () => {
      const invoice = service.createInvoice({
        networkId: 'net_overdue',
        subscriptionId: 'sub_overdue',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        lineItems: [{ description: 'Test', quantity: 1, unitPrice: 9900 }],
      });

      expect(service.isInvoiceOverdue(invoice)).toBe(true);
    });

    it('should not detect paid invoice as overdue', () => {
      const invoice = service.createInvoice({
        networkId: 'net_not_overdue',
        subscriptionId: 'sub_not_overdue',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(Date.now() - 86400000),
        lineItems: [{ description: 'Test', quantity: 1, unitPrice: 9900 }],
      });

      const paidInvoice = service.markInvoicePaid(invoice, 'PIX', 'txn_paid');

      expect(service.isInvoiceOverdue(paidInvoice)).toBe(false);
    });
  });

  describe('calculateLateFee', () => {
    it('should calculate late fee for overdue invoice', () => {
      const invoice = service.createInvoice({
        networkId: 'net_latefee',
        subscriptionId: 'sub_latefee',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(Date.now() - 10 * 86400000), // 10 days ago
        lineItems: [{ description: 'Test', quantity: 1, unitPrice: 29900 }],
      });

      const lateFee = service.calculateLateFee(invoice, 2); // 2% per month

      expect(lateFee).toBeGreaterThan(0);
    });

    it('should return zero for non-overdue invoice', () => {
      const invoice = service.createInvoice({
        networkId: 'net_no_latefee',
        subscriptionId: 'sub_no_latefee',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(Date.now() + 86400000), // Tomorrow
        lineItems: [{ description: 'Test', quantity: 1, unitPrice: 9900 }],
      });

      const lateFee = service.calculateLateFee(invoice, 2);

      expect(lateFee).toBe(0);
    });
  });

  describe('generateProformaInvoice', () => {
    it('should generate proforma invoice with DRAFT status', () => {
      const dto: Omit<CreateInvoiceDTO, 'dueDate'> = {
        networkId: 'net_proforma',
        subscriptionId: 'sub_proforma',
        plan: 'ENTERPRISE',
        billingCycle: 'ANNUAL',
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-12-31'),
        lineItems: [{ description: 'Test', quantity: 1, unitPrice: 99900 }],
      };

      const proforma = service.generateProformaInvoice(dto);

      expect(proforma.status).toBe('DRAFT');
      expect(proforma.invoiceNumber).toContain('PROFORMA');
    });
  });

  describe('createWebhookPayload', () => {
    it('should create webhook payload with signature', () => {
      const invoice = service.createInvoice({
        networkId: 'net_webhook',
        subscriptionId: 'sub_webhook',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(),
        lineItems: [{ description: 'Test', quantity: 1, unitPrice: 9900 }],
      });

      const webhook = service.createWebhookPayload('invoice.created', {
        invoice,
      });

      expect(webhook.event).toBe('invoice.created');
      expect(webhook.data.invoice).toBeDefined();
      expect(webhook.signature).toMatch(/^sig_/);
    });
  });
});
