import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService as CoreSubscriptionService } from '@organizoptera/subscription';
import type { SchoolNetworkId } from '@organizoptera/types';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionService {
  private coreService: CoreSubscriptionService;

  constructor(private readonly prisma: PrismaService) {
    this.coreService = new CoreSubscriptionService();
  }

  /**
   * Convert Prisma Subscription to core Subscription format
   * Handles field name differences and type mismatches
   */
  private toCoreSubscription(prismaSubscription: any): any {
    return {
      id: prismaSubscription.id,
      networkId: prismaSubscription.networkId,
      plan: prismaSubscription.plan,
      status: prismaSubscription.status,
      billingCycle: prismaSubscription.billingCycle,
      currentPeriodStart: prismaSubscription.currentPeriodStart,
      currentPeriodEnd: prismaSubscription.currentPeriodEnd,
      trialEndsAt: prismaSubscription.trialEndsAt,
      // Map American spelling to British for core package
      cancelledAt: prismaSubscription.canceledAt,
      // Convert cancelAt DateTime to cancelAtPeriodEnd boolean
      cancelAtPeriodEnd: !!prismaSubscription.cancelAt,
      features: prismaSubscription.features as any,
      metadata: prismaSubscription.metadata as any,
      createdAt: prismaSubscription.createdAt,
      updatedAt: prismaSubscription.updatedAt,
    };
  }

  async create(createDto: CreateSubscriptionDto, networkId: SchoolNetworkId) {
    // Validate network exists
    const network = await this.prisma.schoolNetwork.findUnique({
      where: { id: networkId },
    });

    if (!network) {
      throw new NotFoundException(`School network ${networkId} not found`);
    }

    // Check if subscription already exists
    const existing = await this.prisma.subscription.findUnique({
      where: { networkId },
    });

    if (existing) {
      throw new ConflictException(`Subscription already exists for network ${networkId}`);
    }

    // Create subscription using core service
    const subscription = this.coreService.createSubscription({
      networkId,
      plan: createDto.plan as any,
      billingCycle: createDto.billingCycle as any,
      startTrial: true,
      trialDays: createDto.trialDays ?? 0, // Default to 0 if undefined
    });

    // Store in database (map core fields back to Prisma schema)
    return await this.prisma.subscription.create({
      data: {
        id: subscription.id,
        networkId: subscription.networkId,
        plan: subscription.plan,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        // Map core cancelAtPeriodEnd back to Prisma cancelAt
        cancelAt: subscription.cancelAtPeriodEnd ? subscription.currentPeriodEnd : null,
        // Map British spelling back to American for Prisma
        canceledAt: subscription.cancelledAt ?? null,
        features: subscription.features as any,
        // Use metadata from DTO if provided, otherwise use core default
        metadata: (createDto.metadata ?? subscription.metadata) as unknown as any,
      },
      include: {
        network: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });
  }

  async findOne(networkId: SchoolNetworkId) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { networkId },
      include: {
        network: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            amountDue: true,
            dueDate: true,
            paidAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription not found for network ${networkId}`);
    }

    return subscription;
  }

  async update(networkId: SchoolNetworkId, updateDto: UpdateSubscriptionDto) {
    const existing = await this.prisma.subscription.findUnique({
      where: { networkId },
    });

    if (!existing) {
      throw new NotFoundException(`Subscription not found for network ${networkId}`);
    }

    // Convert Prisma model to core service format
    const coreSubscription = this.toCoreSubscription(existing);

    // Update using core service
    const updated = this.coreService.updateSubscription(coreSubscription, {
      plan: updateDto.plan as any,
      billingCycle: updateDto.billingCycle as any,
      metadata: updateDto.metadata,
    });

    // Store in database
    return await this.prisma.subscription.update({
      where: { networkId },
      data: {
        plan: updated.plan,
        status: updated.status,
        billingCycle: updated.billingCycle,
        currentPeriodStart: updated.currentPeriodStart,
        currentPeriodEnd: updated.currentPeriodEnd,
        features: updated.features as any,
        metadata: updated.metadata as unknown as any,
      },
      include: {
        network: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async cancel(networkId: SchoolNetworkId, immediately: boolean = false) {
    const existing = await this.prisma.subscription.findUnique({
      where: { networkId },
    });

    if (!existing) {
      throw new NotFoundException(`Subscription not found for network ${networkId}`);
    }

    // Cancel using core service
    const coreSubscription = this.toCoreSubscription(existing);
    const cancelled = this.coreService.cancelSubscription(coreSubscription, immediately);

    // Store in database (map core fields back to Prisma)
    return await this.prisma.subscription.update({
      where: { networkId },
      data: {
        status: cancelled.status,
        // Map core cancelAtPeriodEnd back to Prisma cancelAt
        cancelAt: cancelled.cancelAtPeriodEnd ? cancelled.currentPeriodEnd : null,
        // Map British spelling back to American
        canceledAt: cancelled.cancelledAt ?? null,
      },
      include: {
        network: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async checkQuota(networkId: SchoolNetworkId, feature: string, currentUsage: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { networkId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription not found for network ${networkId}`);
    }

    const coreSubscription = this.toCoreSubscription(subscription);

    return this.coreService.checkQuota(coreSubscription, feature as any, currentUsage);
  }

  async calculateProration(networkId: SchoolNetworkId, targetPlan: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { networkId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription not found for network ${networkId}`);
    }

    const coreSubscription = this.toCoreSubscription(subscription);

    return this.coreService.calculateProration(coreSubscription, targetPlan as any);
  }
}
