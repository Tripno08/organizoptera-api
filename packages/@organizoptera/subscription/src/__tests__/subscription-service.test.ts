/**
 * @module @organizoptera/subscription/__tests__
 * @description Comprehensive tests for SubscriptionService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SubscriptionService } from '../subscription-service.js';
import type {
  Subscription,
  CreateSubscriptionDTO,
  UpdateSubscriptionDTO,
} from '../types.js';
import {
  PLAN_LIMITS,
  PLAN_PRICING,
  DEFAULT_TRIAL_DAYS,
} from '../constants.js';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  beforeEach(() => {
    service = new SubscriptionService();
  });

  describe('createSubscription', () => {
    it('should create subscription without trial', () => {
      const dto: CreateSubscriptionDTO = {
        networkId: 'net_123',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        startTrial: false,
      };

      const subscription = service.createSubscription(dto);

      expect(subscription.networkId).toBe('net_123');
      expect(subscription.plan).toBe('PROFESSIONAL');
      expect(subscription.status).toBe('ACTIVE');
      expect(subscription.trialEndsAt).toBeNull();
      expect(subscription.billingCycle).toBe('MONTHLY');
      expect(subscription.features).toEqual(PLAN_LIMITS.PROFESSIONAL);
    });

    it('should create subscription with trial', () => {
      const dto: CreateSubscriptionDTO = {
        networkId: 'net_456',
        plan: 'STARTER',
        billingCycle: 'ANNUAL',
        startTrial: true,
        trialDays: 14,
      };

      const subscription = service.createSubscription(dto);

      expect(subscription.status).toBe('TRIAL');
      expect(subscription.trialEndsAt).not.toBeNull();

      if (subscription.trialEndsAt) {
        const daysDiff = Math.ceil(
          (subscription.trialEndsAt.getTime() - subscription.createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBe(14);
      }
    });

    it('should use default trial days if not specified', () => {
      const dto: CreateSubscriptionDTO = {
        networkId: 'net_789',
        plan: 'ENTERPRISE',
        startTrial: true,
      };

      const subscription = service.createSubscription(dto);

      if (subscription.trialEndsAt) {
        const daysDiff = Math.ceil(
          (subscription.trialEndsAt.getTime() - subscription.createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        expect(daysDiff).toBe(DEFAULT_TRIAL_DAYS);
      }
    });

    it('should use default MONTHLY billing cycle', () => {
      const dto: CreateSubscriptionDTO = {
        networkId: 'net_abc',
        plan: 'FREE',
      };

      const subscription = service.createSubscription(dto);

      expect(subscription.billingCycle).toBe('MONTHLY');
    });

    it('should set correct period end for MONTHLY cycle', () => {
      const dto: CreateSubscriptionDTO = {
        networkId: 'net_def',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
      };

      const subscription = service.createSubscription(dto);
      const monthsDiff =
        subscription.currentPeriodEnd.getMonth() -
        subscription.currentPeriodStart.getMonth();

      expect(monthsDiff).toBe(1);
    });

    it('should set correct period end for ANNUAL cycle', () => {
      const dto: CreateSubscriptionDTO = {
        networkId: 'net_ghi',
        plan: 'PROFESSIONAL',
        billingCycle: 'ANNUAL',
      };

      const subscription = service.createSubscription(dto);
      const yearsDiff =
        subscription.currentPeriodEnd.getFullYear() -
        subscription.currentPeriodStart.getFullYear();

      expect(yearsDiff).toBe(1);
    });
  });

  describe('updateSubscription', () => {
    let subscription: Subscription;

    beforeEach(() => {
      subscription = service.createSubscription({
        networkId: 'net_update',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
      });
    });

    it('should update plan and features', () => {
      const dto: UpdateSubscriptionDTO = {
        plan: 'PROFESSIONAL',
      };

      const updated = service.updateSubscription(subscription, dto);

      expect(updated.plan).toBe('PROFESSIONAL');
      expect(updated.features).toEqual(PLAN_LIMITS.PROFESSIONAL);
    });

    it('should update billing cycle and recalculate period end', () => {
      const dto: UpdateSubscriptionDTO = {
        billingCycle: 'ANNUAL',
      };

      const updated = service.updateSubscription(subscription, dto);

      expect(updated.billingCycle).toBe('ANNUAL');
      const yearsDiff =
        updated.currentPeriodEnd.getFullYear() -
        updated.currentPeriodStart.getFullYear();
      expect(yearsDiff).toBe(1);
    });

    it('should set cancelAtPeriodEnd flag', () => {
      const dto: UpdateSubscriptionDTO = {
        cancelAtPeriodEnd: true,
      };

      const updated = service.updateSubscription(subscription, dto);

      expect(updated.cancelAtPeriodEnd).toBe(true);
      expect(updated.cancelledAt).not.toBeNull();
    });

    it('should merge metadata', () => {
      const dto: UpdateSubscriptionDTO = {
        metadata: { customField: 'value123' },
      };

      const updated = service.updateSubscription(subscription, dto);

      expect(updated.metadata).toHaveProperty('customField', 'value123');
    });
  });

  describe('cancelSubscription', () => {
    let subscription: Subscription;

    beforeEach(() => {
      subscription = service.createSubscription({
        networkId: 'net_cancel',
        plan: 'PROFESSIONAL',
      });
    });

    it('should cancel immediately', () => {
      const cancelled = service.cancelSubscription(subscription, true);

      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.cancelledAt).not.toBeNull();
      expect(cancelled.cancelAtPeriodEnd).toBe(false);
    });

    it('should cancel at period end', () => {
      const cancelled = service.cancelSubscription(subscription, false);

      expect(cancelled.status).toBe('ACTIVE'); // Still active until period ends
      expect(cancelled.cancelAtPeriodEnd).toBe(true);
      expect(cancelled.cancelledAt).not.toBeNull();
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate cancelled subscription', () => {
      const subscription = service.createSubscription({
        networkId: 'net_reactivate',
        plan: 'STARTER',
      });

      const cancelled = service.cancelSubscription(subscription, true);
      const reactivated = service.reactivateSubscription(cancelled);

      expect(reactivated.status).toBe('ACTIVE');
      expect(reactivated.cancelledAt).toBeNull();
      expect(reactivated.cancelAtPeriodEnd).toBe(false);
    });

    it('should throw error if not cancelled', () => {
      const subscription = service.createSubscription({
        networkId: 'net_active',
        plan: 'STARTER',
      });

      expect(() => service.reactivateSubscription(subscription)).toThrow(
        'Only cancelled subscriptions can be reactivated',
      );
    });
  });

  describe('suspendSubscription', () => {
    it('should suspend active subscription', () => {
      const subscription = service.createSubscription({
        networkId: 'net_suspend',
        plan: 'PROFESSIONAL',
      });

      const suspended = service.suspendSubscription(subscription);

      expect(suspended.status).toBe('SUSPENDED');
    });
  });

  describe('markPastDue', () => {
    it('should mark subscription as past due', () => {
      const subscription = service.createSubscription({
        networkId: 'net_pastdue',
        plan: 'ENTERPRISE',
      });

      const pastDue = service.markPastDue(subscription);

      expect(pastDue.status).toBe('PAST_DUE');
    });
  });

  describe('renewSubscription', () => {
    it('should renew subscription for next period', () => {
      const subscription = service.createSubscription({
        networkId: 'net_renew',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
        startTrial: true,
      });

      const renewed = service.renewSubscription(subscription);

      expect(renewed.status).toBe('ACTIVE');
      expect(renewed.trialEndsAt).toBeNull(); // Trial removed on renewal
      expect(renewed.currentPeriodStart.getTime()).toBe(
        subscription.currentPeriodEnd.getTime(),
      );
    });
  });

  describe('checkSubscription', () => {
    it('should return valid check for active subscription', () => {
      const subscription = service.createSubscription({
        networkId: 'net_check',
        plan: 'PROFESSIONAL',
      });

      const check = service.checkSubscription(subscription);

      expect(check.isValid).toBe(true);
      expect(check.status).toBe('ACTIVE');
      expect(check.isInTrial).toBe(false);
      expect(check.isPastDue).toBe(false);
    });

    it('should detect trial subscriptions', () => {
      const subscription = service.createSubscription({
        networkId: 'net_trial',
        plan: 'STARTER',
        startTrial: true,
      });

      const check = service.checkSubscription(subscription);

      expect(check.isInTrial).toBe(true);
    });

    it('should provide feature access check', () => {
      const subscription = service.createSubscription({
        networkId: 'net_feature',
        plan: 'ENTERPRISE',
      });

      const check = service.checkSubscription(subscription);

      expect(check.canAccessFeature('ADVANCED_ANALYTICS')).toBe(true);
      expect(check.canAccessFeature('SSO_ENABLED')).toBe(true);
    });

    it('should provide feature limit getter', () => {
      const subscription = service.createSubscription({
        networkId: 'net_limit',
        plan: 'PROFESSIONAL',
      });

      const check = service.checkSubscription(subscription);

      expect(check.getFeatureLimit('MAX_SCHOOLS')).toBe(10);
      expect(check.getFeatureLimit('STORAGE_GB')).toBe(100);
    });

    it('should calculate days until expiry', () => {
      const subscription = service.createSubscription({
        networkId: 'net_expiry',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
      });

      const check = service.checkSubscription(subscription);

      expect(check.daysUntilExpiry).toBeGreaterThan(0);
      expect(check.daysUntilExpiry).toBeLessThanOrEqual(31);
    });
  });

  describe('comparePlans', () => {
    it('should detect upgrade', () => {
      const comparison = service.comparePlans('STARTER', 'PROFESSIONAL');

      expect(comparison.isUpgrade).toBe(true);
      expect(comparison.priceDifference).toBeGreaterThan(0);
      expect(comparison.featureChanges.added.length).toBeGreaterThan(0);
    });

    it('should detect downgrade', () => {
      const comparison = service.comparePlans('ENTERPRISE', 'PROFESSIONAL');

      expect(comparison.isUpgrade).toBe(false);
      expect(comparison.priceDifference).toBeLessThan(0);
    });

    it('should calculate correct price difference', () => {
      const comparison = service.comparePlans('FREE', 'STARTER', 'MONTHLY');
      const expectedDiff =
        PLAN_PRICING.STARTER.MONTHLY - PLAN_PRICING.FREE.MONTHLY;

      expect(comparison.priceDifference).toBe(expectedDiff);
    });

    it('should identify increased limits', () => {
      const comparison = service.comparePlans('FREE', 'STARTER');

      expect(comparison.featureChanges.increased.length).toBeGreaterThan(0);

      const schoolsIncrease = comparison.featureChanges.increased.find(
        (change) => change.feature === 'MAX_SCHOOLS',
      );
      expect(schoolsIncrease).toBeDefined();
      expect(schoolsIncrease?.from).toBe(1);
      expect(schoolsIncrease?.to).toBe(3);
    });

    it('should identify added features', () => {
      const comparison = service.comparePlans('STARTER', 'PROFESSIONAL');

      expect(comparison.featureChanges.added).toContain('ADVANCED_ANALYTICS');
      expect(comparison.featureChanges.added).toContain('CUSTOM_BRANDING');
    });
  });

  describe('checkQuota', () => {
    let subscription: Subscription;

    beforeEach(() => {
      subscription = service.createSubscription({
        networkId: 'net_quota',
        plan: 'STARTER',
      });
    });

    it('should check if usage is within limit', () => {
      const check = service.checkQuota(subscription, 'MAX_SCHOOLS', 2);

      expect(check.isWithinLimit).toBe(true);
      expect(check.current).toBe(2);
      expect(check.limit).toBe(3);
    });

    it('should detect when limit is exceeded', () => {
      const check = service.checkQuota(subscription, 'MAX_SCHOOLS', 5);

      expect(check.isWithinLimit).toBe(false);
      expect(check.current).toBe(5);
      expect(check.limit).toBe(3);
    });

    it('should calculate percentage used', () => {
      const check = service.checkQuota(subscription, 'MAX_SCHOOLS', 2);

      expect(check.percentageUsed).toBeCloseTo(66.67, 1);
    });

    it('should provide canAddMore helper', () => {
      const check = service.checkQuota(subscription, 'MAX_SCHOOLS', 2);

      expect(check.canAddMore(1)).toBe(true); // 2 + 1 = 3 (at limit)
      expect(check.canAddMore(2)).toBe(false); // 2 + 2 = 4 (exceeds)
    });
  });

  describe('calculateProration', () => {
    it('should calculate prorated charge for upgrade mid-cycle', () => {
      const subscription = service.createSubscription({
        networkId: 'net_prorate',
        plan: 'STARTER',
        billingCycle: 'MONTHLY',
      });

      const prorated = service.calculateProration(subscription, 'PROFESSIONAL');

      // Should be positive (charge) for upgrade
      expect(prorated).toBeGreaterThan(0);
    });

    it('should calculate prorated credit for downgrade mid-cycle', () => {
      const subscription = service.createSubscription({
        networkId: 'net_prorate_down',
        plan: 'PROFESSIONAL',
        billingCycle: 'MONTHLY',
      });

      const prorated = service.calculateProration(subscription, 'STARTER');

      // Should be negative (credit) for downgrade
      expect(prorated).toBeLessThan(0);
    });
  });

  describe('getPrice', () => {
    it('should return correct price for plan and cycle', () => {
      const monthlyPrice = service.getPrice('PROFESSIONAL', 'MONTHLY');
      expect(monthlyPrice).toBe(PLAN_PRICING.PROFESSIONAL.MONTHLY);

      const annualPrice = service.getPrice('PROFESSIONAL', 'ANNUAL');
      expect(annualPrice).toBe(PLAN_PRICING.PROFESSIONAL.ANNUAL);
    });
  });

  describe('needsRenewal', () => {
    it('should return true for expired subscription within grace period', () => {
      const subscription = service.createSubscription({
        networkId: 'net_grace',
        plan: 'STARTER',
      });

      // Manually set period end to yesterday
      subscription.currentPeriodEnd = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const needs = service.needsRenewal(subscription);
      expect(needs).toBe(true);
    });

    it('should return false for active subscription', () => {
      const subscription = service.createSubscription({
        networkId: 'net_active_renewal',
        plan: 'PROFESSIONAL',
      });

      const needs = service.needsRenewal(subscription);
      expect(needs).toBe(false);
    });
  });

  describe('isTrialEndingSoon', () => {
    it('should return true for trial ending within 3 days', () => {
      const subscription = service.createSubscription({
        networkId: 'net_trial_ending',
        plan: 'STARTER',
        startTrial: true,
        trialDays: 2, // 2 days trial
      });

      const isEnding = service.isTrialEndingSoon(subscription);
      expect(isEnding).toBe(true);
    });

    it('should return false for trial with more than 3 days left', () => {
      const subscription = service.createSubscription({
        networkId: 'net_trial_far',
        plan: 'PROFESSIONAL',
        startTrial: true,
        trialDays: 14,
      });

      const isEnding = service.isTrialEndingSoon(subscription);
      expect(isEnding).toBe(false);
    });

    it('should return false for non-trial subscription', () => {
      const subscription = service.createSubscription({
        networkId: 'net_no_trial',
        plan: 'ENTERPRISE',
        startTrial: false,
      });

      const isEnding = service.isTrialEndingSoon(subscription);
      expect(isEnding).toBe(false);
    });
  });
});
