/**
 * @module @organizoptera/billing
 * @description Billing and invoicing management for Organizoptera
 *
 * Features:
 * - Invoice generation and management
 * - Payment processing and recording
 * - Refund processing
 * - Billing summaries and reporting
 * - Webhook notifications
 * - Late fee calculations
 * - Proforma invoice generation
 *
 * @example
 * ```typescript
 * import { BillingService } from '@organizoptera/billing';
 *
 * const service = new BillingService();
 *
 * // Create an invoice
 * const invoice = service.createInvoice({
 *   networkId: 'net_123',
 *   subscriptionId: 'sub_456',
 *   plan: 'PROFESSIONAL',
 *   billingCycle: 'MONTHLY',
 *   periodStart: new Date('2026-01-01'),
 *   periodEnd: new Date('2026-01-31'),
 *   dueDate: new Date('2026-02-10'),
 *   lineItems: [
 *     {
 *       description: 'Professional Plan - Monthly',
 *       quantity: 1,
 *       unitPrice: 29900,
 *       taxRate: 10,
 *     },
 *   ],
 * });
 *
 * // Record a payment
 * const payment = service.recordPayment(invoice, {
 *   invoiceId: invoice.id,
 *   amount: invoice.total,
 *   paymentMethod: 'CREDIT_CARD',
 *   transactionId: 'txn_789',
 * });
 *
 * // Mark invoice as paid
 * const paidInvoice = service.markInvoicePaid(
 *   invoice,
 *   'CREDIT_CARD',
 *   'txn_789',
 * );
 * ```
 */

export * from './types.js';
export * from './billing-service.js';
