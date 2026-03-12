import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResourceTracker } from '@organizoptera/resources';
import type { SchoolNetworkId } from '@organizoptera/types';
import { RecordUsageDto } from './dto/record-usage.dto';

@Injectable()
export class ResourcesService {
  private tracker: ResourceTracker;

  constructor(private readonly prisma: PrismaService) {
    this.tracker = new ResourceTracker();
  }

  async recordUsage(recordDto: RecordUsageDto, networkId: SchoolNetworkId) {
    // Validate network exists
    const network = await this.prisma.schoolNetwork.findUnique({
      where: { id: networkId },
    });

    if (!network) {
      throw new NotFoundException(`School network ${networkId} not found`);
    }

    // Record usage using resource tracker
    return this.tracker.recordUsage(
      networkId,
      recordDto.feature as any,
      recordDto.current,
      recordDto.limit,
    );
  }

  async getUsage(feature: string, networkId: SchoolNetworkId) {
    const usage = this.tracker.getUsage(networkId, feature as any);

    if (!usage) {
      throw new NotFoundException(`No usage recorded for feature ${feature}`);
    }

    return usage;
  }

  async checkAlerts(networkId: SchoolNetworkId) {
    // Validate network exists
    const network = await this.prisma.schoolNetwork.findUnique({
      where: { id: networkId },
    });

    if (!network) {
      throw new NotFoundException(`School network ${networkId} not found`);
    }

    return this.tracker.checkAlerts(networkId);
  }

  async getUsageSummary(networkId: SchoolNetworkId) {
    // Validate network exists
    const network = await this.prisma.schoolNetwork.findUnique({
      where: { id: networkId },
    });

    if (!network) {
      throw new NotFoundException(`School network ${networkId} not found`);
    }

    return this.tracker.getUsageSummary(networkId);
  }

  async canAllocate(feature: string, current: number, additional: number, networkId: SchoolNetworkId) {
    // Get subscription to check limits
    const subscription = await this.prisma.subscription.findUnique({
      where: { networkId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription not found for network ${networkId}`);
    }

    // Create SubscriptionCheckResult format for the tracker
    const subscriptionCheck = {
      isValid: subscription.status === 'ACTIVE' || subscription.status === 'TRIAL',
      subscription: subscription as any,
      status: subscription.status,
      canAccessFeature: () => true,
      getFeatureLimit: (f: string) => {
        const features = subscription.features as any;
        return features[f] ?? 0;
      },
      daysUntilExpiry: Math.ceil(
        (subscription.currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      isInTrial: subscription.status === 'TRIAL',
      isPastDue: subscription.status === 'PAST_DUE',
    };

    return this.tracker.canAllocate(subscriptionCheck, feature as any, current, additional);
  }

  async clearCache(networkId: SchoolNetworkId) {
    this.tracker.clearCache(networkId);
    return { message: 'Cache cleared successfully' };
  }
}
