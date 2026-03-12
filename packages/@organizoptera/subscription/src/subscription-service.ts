/**
 * @module @organizoptera/subscription/service
 * @description Core subscription management service
 */

import type { SchoolNetworkId } from '@organizoptera/types';
import type {
  Subscription,
  SubscriptionPlan,
  SubscriptionCheckResult,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
  FeatureKey,
  PlanComparison,
  UsageQuotaCheck,
} from './types.js';
import {
  PLAN_LIMITS,
  PLAN_PRICING,
  DEFAULT_TRIAL_DAYS,
  PAYMENT_GRACE_PERIOD_DAYS,
  isUpgrade,
} from './constants.js';

/**
 * SubscriptionService - Core business logic for subscription management
 */
export class SubscriptionService {
  /**
   * Create a new subscription
   */
  createSubscription(dto: CreateSubscriptionDTO): Subscription {
    const now = new Date();
    const startDate = now;

    // Calculate trial end date if trial requested
    const trialEndsAt = dto.startTrial
      ? this.addDays(now, dto.trialDays || DEFAULT_TRIAL_DAYS)
      : null;

    // Calculate billing period end based on cycle
    const periodEnd = this.calculatePeriodEnd(startDate, dto.billingCycle || 'MONTHLY');

    // Get feature limits for the plan
    const features = PLAN_LIMITS[dto.plan];

    const subscription: Subscription = {
      id: this.generateId(),
      networkId: dto.networkId as SchoolNetworkId,
      plan: dto.plan,
      status: dto.startTrial ? 'TRIAL' : 'ACTIVE',
      billingCycle: dto.billingCycle || 'MONTHLY',
      currentPeriodStart: startDate,
      currentPeriodEnd: periodEnd,
      trialEndsAt,
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      features: { ...features },
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    return subscription;
  }

  /**
   * Update an existing subscription
   */
  updateSubscription(
    subscription: Subscription,
    dto: UpdateSubscriptionDTO,
  ): Subscription {
    const updated = { ...subscription, updatedAt: new Date() };

    // Update plan if changed
    if (dto.plan && dto.plan !== subscription.plan) {
      updated.plan = dto.plan;
      updated.features = { ...PLAN_LIMITS[dto.plan] };
    }

    // Update billing cycle if changed
    if (dto.billingCycle && dto.billingCycle !== subscription.billingCycle) {
      updated.billingCycle = dto.billingCycle;
      // Recalculate period end with new cycle
      updated.currentPeriodEnd = this.calculatePeriodEnd(
        subscription.currentPeriodStart,
        dto.billingCycle,
      );
    }

    // Update cancel at period end flag
    if (dto.cancelAtPeriodEnd !== undefined) {
      updated.cancelAtPeriodEnd = dto.cancelAtPeriodEnd;
      if (dto.cancelAtPeriodEnd) {
        updated.cancelledAt = new Date();
      }
    }

    // Merge metadata
    if (dto.metadata) {
      updated.metadata = { ...subscription.metadata, ...dto.metadata };
    }

    return updated;
  }

  /**
   * Cancel a subscription
   */
  cancelSubscription(
    subscription: Subscription,
    immediately: boolean = false,
  ): Subscription {
    const now = new Date();

    if (immediately) {
      return {
        ...subscription,
        status: 'CANCELLED',
        cancelledAt: now,
        cancelAtPeriodEnd: false,
        updatedAt: now,
      };
    } else {
      // Cancel at end of current period
      return {
        ...subscription,
        cancelAtPeriodEnd: true,
        cancelledAt: now,
        updatedAt: now,
      };
    }
  }

  /**
   * Reactivate a cancelled subscription
   */
  reactivateSubscription(subscription: Subscription): Subscription {
    if (subscription.status !== 'CANCELLED' && !subscription.cancelAtPeriodEnd) {
      throw new Error('Only cancelled subscriptions can be reactivated');
    }

    return {
      ...subscription,
      status: 'ACTIVE',
      cancelledAt: null,
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    };
  }

  /**
   * Suspend a subscription (e.g., due to payment failure)
   */
  suspendSubscription(subscription: Subscription): Subscription {
    return {
      ...subscription,
      status: 'SUSPENDED',
      updatedAt: new Date(),
    };
  }

  /**
   * Mark subscription as past due
   */
  markPastDue(subscription: Subscription): Subscription {
    return {
      ...subscription,
      status: 'PAST_DUE',
      updatedAt: new Date(),
    };
  }

  /**
   * Renew a subscription for next billing period
   */
  renewSubscription(subscription: Subscription): Subscription {
    const now = new Date();
    const newPeriodStart = subscription.currentPeriodEnd;
    const newPeriodEnd = this.calculatePeriodEnd(
      newPeriodStart,
      subscription.billingCycle,
    );

    return {
      ...subscription,
      status: 'ACTIVE',
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      trialEndsAt: null, // Trial only applies to first period
      updatedAt: now,
    };
  }

  /**
   * Check if subscription is valid and within limits
   */
  checkSubscription(subscription: Subscription): SubscriptionCheckResult {
    const now = new Date();
    const isExpired = subscription.currentPeriodEnd < now;
    const isInTrial =
      subscription.status === 'TRIAL' &&
      subscription.trialEndsAt !== null &&
      subscription.trialEndsAt > now;
    const isPastDue = subscription.status === 'PAST_DUE';
    const isActive = subscription.status === 'ACTIVE' || isInTrial;

    // Calculate days until expiry
    let daysUntilExpiry: number | null = null;
    if (subscription.currentPeriodEnd) {
      const diff = subscription.currentPeriodEnd.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      isValid: isActive && !isExpired,
      subscription,
      status: subscription.status,
      canAccessFeature: (feature: FeatureKey) => {
        const value = subscription.features[feature];
        return typeof value === 'boolean' ? value : true;
      },
      getFeatureLimit: (feature: FeatureKey) => {
        return subscription.features[feature];
      },
      daysUntilExpiry,
      isInTrial,
      isPastDue,
    };
  }

  /**
   * Compare two plans for upgrade/downgrade
   */
  comparePlans(
    currentPlan: SubscriptionPlan,
    targetPlan: SubscriptionPlan,
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' = 'MONTHLY',
  ): PlanComparison {
    const currentLimits = PLAN_LIMITS[currentPlan];
    const targetLimits = PLAN_LIMITS[targetPlan];
    const currentPrice = PLAN_PRICING[currentPlan][billingCycle];
    const targetPrice = PLAN_PRICING[targetPlan][billingCycle];

    const featureChanges = {
      added: [] as FeatureKey[],
      removed: [] as FeatureKey[],
      increased: [] as Array<{ feature: FeatureKey; from: number; to: number }>,
      decreased: [] as Array<{ feature: FeatureKey; from: number; to: number }>,
    };

    // Compare each feature
    for (const key in targetLimits) {
      const feature = key as FeatureKey;
      const currentValue = currentLimits[feature];
      const targetValue = targetLimits[feature];

      if (typeof currentValue === 'boolean' && typeof targetValue === 'boolean') {
        if (!currentValue && targetValue) {
          featureChanges.added.push(feature);
        } else if (currentValue && !targetValue) {
          featureChanges.removed.push(feature);
        }
      } else if (typeof currentValue === 'number' && typeof targetValue === 'number') {
        if (targetValue > currentValue) {
          featureChanges.increased.push({
            feature,
            from: currentValue,
            to: targetValue,
          });
        } else if (targetValue < currentValue) {
          featureChanges.decreased.push({
            feature,
            from: currentValue,
            to: targetValue,
          });
        }
      }
    }

    return {
      currentPlan,
      targetPlan,
      isUpgrade: isUpgrade(currentPlan, targetPlan),
      priceDifference: targetPrice - currentPrice,
      featureChanges,
    };
  }

  /**
   * Check if usage is within quota limits
   */
  checkQuota(
    subscription: Subscription,
    feature: FeatureKey,
    currentUsage: number,
  ): UsageQuotaCheck {
    const limit = subscription.features[feature];
    const numericLimit = typeof limit === 'number' ? limit : 0;
    const percentageUsed =
      numericLimit > 0 ? (currentUsage / numericLimit) * 100 : 0;

    return {
      isWithinLimit: currentUsage < numericLimit,
      feature,
      current: currentUsage,
      limit: numericLimit,
      percentageUsed,
      canAddMore: (count: number) => currentUsage + count <= numericLimit,
    };
  }

  /**
   * Calculate prorated amount for plan change
   */
  calculateProration(
    subscription: Subscription,
    targetPlan: SubscriptionPlan,
  ): number {
    const now = new Date();
    const remainingDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const currentPrice =
      PLAN_PRICING[subscription.plan][subscription.billingCycle];
    const targetPrice = PLAN_PRICING[targetPlan][subscription.billingCycle];

    // Calculate total days in period
    const totalDays = Math.ceil(
      (subscription.currentPeriodEnd.getTime() -
        subscription.currentPeriodStart.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Prorated credit from current plan
    const credit = (currentPrice / totalDays) * remainingDays;

    // Prorated charge for new plan
    const charge = (targetPrice / totalDays) * remainingDays;

    // Return difference (positive = charge, negative = credit)
    return Math.round(charge - credit);
  }

  /**
   * Get subscription price for a plan and billing cycle
   */
  getPrice(plan: SubscriptionPlan, billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'): number {
    return PLAN_PRICING[plan][billingCycle];
  }

  /**
   * Check if subscription needs renewal (within grace period)
   */
  needsRenewal(subscription: Subscription): boolean {
    const now = new Date();
    const graceEnd = this.addDays(
      subscription.currentPeriodEnd,
      PAYMENT_GRACE_PERIOD_DAYS,
    );
    return now >= subscription.currentPeriodEnd && now <= graceEnd;
  }

  /**
   * Check if trial is ending soon (within 3 days)
   */
  isTrialEndingSoon(subscription: Subscription): boolean {
    if (!subscription.trialEndsAt) return false;
    const now = new Date();
    const threeDaysFromNow = this.addDays(now, 3);
    return subscription.trialEndsAt <= threeDaysFromNow;
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private calculatePeriodEnd(
    startDate: Date,
    cycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
  ): Date {
    const date = new Date(startDate);

    switch (cycle) {
      case 'MONTHLY':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'QUARTERLY':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'ANNUAL':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }

    return date;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
