import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService as CoreBillingService } from '@organizoptera/billing';
import type { SchoolNetworkId } from '@organizoptera/types';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { ProcessRefundDto } from './dto/process-refund.dto';

@Injectable()
export class BillingService {
  private coreService: CoreBillingService;

  constructor(private readonly prisma: PrismaService) {
    this.coreService = new CoreBillingService();
  }

  private async toCoreInvoice(prismaInvoice: any): Promise<any> {
    // Fetch subscription to get missing fields
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: prismaInvoice.subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return {
      ...prismaInvoice,
      plan: subscription.plan,
      billingCycle: subscription.billingCycle,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      issueDate: prismaInvoice.createdAt,
      notes: null,
      paymentMethod: null,
      transactionId: null,
      lineItems: prismaInvoice.lineItems as any,
      metadata: prismaInvoice.metadata as any,
    };
  }

  async createInvoice(createDto: CreateInvoiceDto, networkId: SchoolNetworkId) {
    // Validate subscription exists and belongs to network
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id: createDto.subscriptionId,
        networkId,
      },
    });

    if (!subscription) {
      throw new ForbiddenException('Subscription not found or access denied');
    }

    // Create invoice using core service
    const invoice = this.coreService.createInvoice({
      networkId: networkId as string, // Cast branded type back to string for core package
      subscriptionId: createDto.subscriptionId,
      plan: subscription.plan,
      billingCycle: subscription.billingCycle,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      discountAmount: createDto.discountAmount ?? 0,
      dueDate: new Date(createDto.dueDate),
      lineItems: createDto.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate ?? 0,
        metadata: item.metadata,
      })),
      metadata: createDto.metadata,
    });

    // Store in database
    return await this.prisma.invoice.create({
      data: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        networkId: invoice.networkId,
        subscriptionId: invoice.subscriptionId,
        status: invoice.status,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        amountDue: invoice.amountDue,
        amountPaid: invoice.amountPaid,
        currency: 'BRL', // Default currency (core package doesn't include currency field)
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt ?? undefined,
        lineItems: invoice.lineItems as any,
        metadata: invoice.metadata as any,
      },
      include: {
        network: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
          },
        },
      },
    });
  }

  async findAllByNetwork(networkId: SchoolNetworkId) {
    return await this.prisma.invoice.findMany({
      where: { networkId },
      include: {
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            status: true,
            paymentDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, networkId: SchoolNetworkId) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        networkId,
      },
      include: {
        network: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            status: true,
            billingCycle: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        refunds: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or access denied');
    }

    return invoice;
  }

  async recordPayment(recordDto: RecordPaymentDto, networkId: SchoolNetworkId) {
    // Validate invoice exists and belongs to network
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: recordDto.invoiceId,
        networkId,
      },
    });

    if (!invoice) {
      throw new ForbiddenException('Invoice not found or access denied');
    }

    // Convert to core service format
    const coreInvoice = await this.toCoreInvoice(invoice);

    // Record payment using core service
    const payment = this.coreService.recordPayment(coreInvoice, {
      invoiceId: coreInvoice.id,
      paymentMethod: recordDto.paymentMethod as any,
      amount: recordDto.amount,
      transactionId: recordDto.transactionId,
      metadata: recordDto.metadata,
    });

    // Store in database
    const createdPayment = await this.prisma.payment.create({
      data: {
        id: payment.id,
        invoiceId: payment.invoiceId,
        networkId,
        transactionId: payment.transactionId ?? undefined,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentDate: payment.processedAt ?? undefined,
        failureReason: payment.failureReason ?? undefined,
        processorData: payment.providerResponse as any,
        metadata: payment.metadata as any,
      },
    });

    // Update invoice status if fully paid
    if (payment.status === 'SUCCEEDED') {
      const updatedInvoice = this.coreService.markInvoicePaid(
        coreInvoice,
        recordDto.paymentMethod,
        recordDto.transactionId ?? 'unknown',
      );
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: updatedInvoice.status,
          amountPaid: updatedInvoice.amountPaid,
          amountDue: updatedInvoice.amountDue,
          paidAt: updatedInvoice.paidAt ?? undefined,
        },
      });
    }

    return createdPayment;
  }

  async processRefund(refundDto: ProcessRefundDto, networkId: SchoolNetworkId) {
    // Validate payment exists and belongs to network
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: refundDto.paymentId,
        networkId,
      },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new ForbiddenException('Payment not found or access denied');
    }

    // Convert to core service format
    const corePayment = {
      id: payment.id,
      invoiceId: payment.invoiceId,
      networkId: payment.networkId as any,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      providerResponse: payment.processorData as any,
      failureReason: payment.failureReason,
      processedAt: payment.paymentDate,
      metadata: payment.metadata as any,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };

    // Process refund using core service
    const refund = this.coreService.processRefund(corePayment, {
      paymentId: payment.id, // Required field
      amount: refundDto.amount,
      reason: (refundDto.reason as any) ?? 'OTHER', // Default to OTHER if not specified
    });

    // Store in database
    const createdRefund = await this.prisma.refund.create({
      data: {
        id: refund.id,
        paymentId: refund.paymentId,
        invoiceId: refund.invoiceId,
        networkId,
        status: 'SUCCEEDED', // Default status (core package doesn't include status)
        amount: refund.amount,
        reason: refund.reason ?? undefined,
        refundDate: refund.processedAt ?? undefined,
        metadata: refund.metadata as any,
      },
    });

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
      },
    });

    // Update invoice if needed
    const invoice = payment.invoice;
    if (invoice) {
      const coreInvoice = await this.toCoreInvoice(invoice);
      const updatedInvoice = this.coreService.applyRefundToInvoice(coreInvoice, refund);
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: updatedInvoice.status,
          amountPaid: updatedInvoice.amountPaid,
          amountDue: updatedInvoice.amountDue,
        },
      });
    }

    return createdRefund;
  }

  async getBillingSummary(networkId: SchoolNetworkId, periodStart: Date, periodEnd: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        networkId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        payments: true,
        refunds: true,
      },
    });

    // Convert to core service format
    const coreInvoices = await Promise.all(invoices.map(inv => this.toCoreInvoice(inv)));

    return this.coreService.calculateBillingSummary(coreInvoices, periodStart, periodEnd);
  }
}
