/**
 * @module @organizoptera/billing/types
 * @description Type definitions for billing and invoicing
 */

import { z } from 'zod';
import type { SchoolNetworkId } from '@organizoptera/types';
import type { SubscriptionPlan, BillingCycle } from '@organizoptera/subscription';

// ============================================================================
// Enums
// ============================================================================

export type InvoiceStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PAID'
  | 'PAST_DUE'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'VOID';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'PIX'
  | 'BOLETO';

export type RefundReason =
  | 'REQUESTED_BY_CUSTOMER'
  | 'DUPLICATE_CHARGE'
  | 'FRAUDULENT'
  | 'SERVICE_NOT_PROVIDED'
  | 'OTHER';

export type WebhookEvent =
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.refunded'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'payment.refunded';

// ============================================================================
// Invoice Entity
// ============================================================================

/**
 * Invoice - Billing invoice for a subscription period
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  networkId: SchoolNetworkId;
  subscriptionId: string;
  status: InvoiceStatus;
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;

  // Amounts (in cents)
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountDue: number;
  amountPaid: number;

  // Dates
  periodStart: Date;
  periodEnd: Date;
  issueDate: Date;
  dueDate: Date;
  paidAt: Date | null;

  // Line items
  lineItems: InvoiceLineItem[];

  // Payment details
  paymentMethod: PaymentMethod | null;
  transactionId: string | null;

  // Additional info
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * InvoiceLineItem - Individual item on an invoice
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  amount: number; // quantity * unitPrice
  taxRate: number; // percentage (e.g., 10 for 10%)
  taxAmount: number;
  metadata: Record<string, unknown> | null;
}

// ============================================================================
// Payment Entity
// ============================================================================

/**
 * Payment - Payment transaction for an invoice
 */
export interface Payment {
  id: string;
  invoiceId: string;
  networkId: SchoolNetworkId;
  status: PaymentStatus;
  amount: number; // in cents
  currency: string;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  providerResponse: Record<string, unknown> | null;
  failureReason: string | null;
  processedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Refund Entity
// ============================================================================

/**
 * Refund - Refund transaction for a payment
 */
export interface Refund {
  id: string;
  paymentId: string;
  invoiceId: string;
  networkId: SchoolNetworkId;
  amount: number; // in cents
  reason: RefundReason;
  notes: string | null;
  transactionId: string | null;
  processedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * CreateInvoiceDTO - Input for creating a new invoice
 */
export const CreateInvoiceSchema = z.object({
  networkId: z.string(),
  subscriptionId: z.string(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
  periodStart: z.date(),
  periodEnd: z.date(),
  dueDate: z.date(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().min(0).max(100).optional().default(0),
    }),
  ),
  discountAmount: z.number().nonnegative().optional().default(0),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;

/**
 * RecordPaymentDTO - Input for recording a payment
 */
export const RecordPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PIX', 'BOLETO']),
  transactionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type RecordPaymentDTO = z.infer<typeof RecordPaymentSchema>;

/**
 * ProcessRefundDTO - Input for processing a refund
 */
export const ProcessRefundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive(),
  reason: z.enum([
    'REQUESTED_BY_CUSTOMER',
    'DUPLICATE_CHARGE',
    'FRAUDULENT',
    'SERVICE_NOT_PROVIDED',
    'OTHER',
  ]),
  notes: z.string().optional(),
});

export type ProcessRefundDTO = z.infer<typeof ProcessRefundSchema>;

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * WebhookPayload - Webhook notification payload
 */
export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  data: {
    invoice?: Invoice;
    payment?: Payment;
    refund?: Refund;
  };
  timestamp: Date;
  signature: string;
}

/**
 * WebhookResponse - Response to webhook delivery
 */
export interface WebhookResponse {
  success: boolean;
  message?: string;
  timestamp: Date;
}

// ============================================================================
// Billing Summary Types
// ============================================================================

/**
 * BillingSummary - Summary of billing activity for a network
 */
export interface BillingSummary {
  networkId: SchoolNetworkId;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalRefunded: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  averageInvoiceAmount: number;
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * PaymentHistory - Payment history for a network
 */
export interface PaymentHistory {
  payments: Payment[];
  totalAmount: number;
  successfulCount: number;
  failedCount: number;
  period: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// Tax Configuration
// ============================================================================

/**
 * TaxRate - Tax rate configuration
 */
export interface TaxRate {
  id: string;
  name: string;
  rate: number; // percentage
  country: string;
  state: string | null;
  isDefault: boolean;
  active: boolean;
}

// ============================================================================
// Invoice Generation Config
// ============================================================================

/**
 * InvoiceConfig - Configuration for invoice generation
 */
export interface InvoiceConfig {
  companyName: string;
  companyAddress: string;
  companyTaxId: string;
  logoUrl: string | null;
  invoicePrefix: string;
  invoiceNumberStart: number;
  defaultDueDays: number;
  defaultTaxRate: number;
  currency: string;
  locale: string;
}
