import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceTracker } from '../index.js';
import type { SchoolNetworkId } from '@organizoptera/types';
import type { SubscriptionCheckResult } from '@organizoptera/subscription';

describe('ResourceTracker', () => {
  let tracker: ResourceTracker;
  const networkId = 'net_test' as SchoolNetworkId;

  beforeEach(() => {
    tracker = new ResourceTracker();
  });

  describe('recordUsage', () => {
    it('should record resource usage', () => {
      const usage = tracker.recordUsage(networkId, 'MAX_SCHOOLS', 3, 10);

      expect(usage.networkId).toBe(networkId);
      expect(usage.feature).toBe('MAX_SCHOOLS');
      expect(usage.current).toBe(3);
      expect(usage.limit).toBe(10);
      expect(usage.percentageUsed).toBe(30);
    });

    it('should calculate percentage correctly', () => {
      const usage = tracker.recordUsage(networkId, 'MAX_STUDENTS_PER_SCHOOL', 150, 200);
      expect(usage.percentageUsed).toBe(75);
    });

    it('should handle zero limit', () => {
      const usage = tracker.recordUsage(networkId, 'MAX_SCHOOLS', 5, 0);
      expect(usage.percentageUsed).toBe(0);
    });
  });

  describe('getUsage', () => {
    it('should retrieve recorded usage', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 5, 10);
      const usage = tracker.getUsage(networkId, 'MAX_SCHOOLS');

      expect(usage).not.toBeNull();
      expect(usage?.current).toBe(5);
    });

    it('should return null for non-existent usage', () => {
      const usage = tracker.getUsage(networkId, 'MAX_SCHOOLS');
      expect(usage).toBeNull();
    });
  });

  describe('canAllocate', () => {
    it('should allow allocation within limit', () => {
      const mockSubscription: SubscriptionCheckResult = {
        isValid: true,
        subscription: null,
        status: 'ACTIVE',
        canAccessFeature: () => true,
        getFeatureLimit: (feature) => (feature === 'MAX_SCHOOLS' ? 10 : 0),
        daysUntilExpiry: 30,
        isInTrial: false,
        isPastDue: false,
      };

      const canAdd = tracker.canAllocate(mockSubscription, 'MAX_SCHOOLS', 8, 1);
      expect(canAdd).toBe(true);
    });

    it('should deny allocation exceeding limit', () => {
      const mockSubscription: SubscriptionCheckResult = {
        isValid: true,
        subscription: null,
        status: 'ACTIVE',
        canAccessFeature: () => true,
        getFeatureLimit: (feature) => (feature === 'MAX_SCHOOLS' ? 10 : 0),
        daysUntilExpiry: 30,
        isInTrial: false,
        isPastDue: false,
      };

      const canAdd = tracker.canAllocate(mockSubscription, 'MAX_SCHOOLS', 10, 1);
      expect(canAdd).toBe(false);
    });

    it('should allow allocation at exact limit', () => {
      const mockSubscription: SubscriptionCheckResult = {
        isValid: true,
        subscription: null,
        status: 'ACTIVE',
        canAccessFeature: () => true,
        getFeatureLimit: (feature) => (feature === 'MAX_SCHOOLS' ? 10 : 0),
        daysUntilExpiry: 30,
        isInTrial: false,
        isPastDue: false,
      };

      const canAdd = tracker.canAllocate(mockSubscription, 'MAX_SCHOOLS', 9, 1);
      expect(canAdd).toBe(true);
    });

    it('should handle boolean feature limits', () => {
      const mockSubscription: SubscriptionCheckResult = {
        isValid: true,
        subscription: null,
        status: 'ACTIVE',
        canAccessFeature: () => true,
        getFeatureLimit: (feature) => (feature === 'ADVANCED_ANALYTICS' ? true : 0),
        daysUntilExpiry: 30,
        isInTrial: false,
        isPastDue: false,
      };

      const canAdd = tracker.canAllocate(mockSubscription, 'ADVANCED_ANALYTICS', 0, 1);
      expect(canAdd).toBe(false); // Boolean limits return false
    });
  });

  describe('checkAlerts', () => {
    it('should generate INFO alert at 50% usage', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 5, 10);
      const alerts = tracker.checkAlerts(networkId);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('INFO');
      expect(alerts[0].feature).toBe('MAX_SCHOOLS');
    });

    it('should generate WARNING alert at 80% usage', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 8, 10);
      const alerts = tracker.checkAlerts(networkId);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('WARNING');
    });

    it('should generate CRITICAL alert at 95% usage', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 10, 10);
      const alerts = tracker.checkAlerts(networkId);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].severity).toBe('CRITICAL');
    });

    it('should not generate alerts below 50% usage', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 4, 10);
      const alerts = tracker.checkAlerts(networkId);

      expect(alerts.length).toBe(0);
    });

    it('should generate multiple alerts for different resources', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 5, 10);
      tracker.recordUsage(networkId, 'MAX_STUDENTS_PER_SCHOOL', 160, 200);
      const alerts = tracker.checkAlerts(networkId);

      expect(alerts.length).toBe(2);
    });
  });

  describe('getUsageSummary', () => {
    it('should return all usage for a network', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 3, 10);
      tracker.recordUsage(networkId, 'MAX_STUDENTS_PER_SCHOOL', 150, 200);
      tracker.recordUsage(networkId, 'STORAGE_GB', 50, 100);

      const summary = tracker.getUsageSummary(networkId);

      expect(summary.length).toBe(3);
      expect(summary.map((u) => u.feature)).toContain('MAX_SCHOOLS');
      expect(summary.map((u) => u.feature)).toContain('MAX_STUDENTS_PER_SCHOOL');
      expect(summary.map((u) => u.feature)).toContain('STORAGE_GB');
    });

    it('should return empty array for network with no usage', () => {
      const summary = tracker.getUsageSummary(networkId);
      expect(summary).toEqual([]);
    });

    it('should not include other networks', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 3, 10);
      tracker.recordUsage('net_other' as SchoolNetworkId, 'MAX_SCHOOLS', 5, 10);

      const summary = tracker.getUsageSummary(networkId);

      expect(summary.length).toBe(1);
      expect(summary[0].networkId).toBe(networkId);
    });
  });

  describe('clearCache', () => {
    it('should clear usage for specific network', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 3, 10);
      tracker.recordUsage(networkId, 'MAX_STUDENTS_PER_SCHOOL', 150, 200);

      tracker.clearCache(networkId);

      const summary = tracker.getUsageSummary(networkId);
      expect(summary.length).toBe(0);
    });

    it('should not affect other networks', () => {
      const otherNetwork = 'net_other' as SchoolNetworkId;
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 3, 10);
      tracker.recordUsage(otherNetwork, 'MAX_SCHOOLS', 5, 10);

      tracker.clearCache(networkId);

      const summary = tracker.getUsageSummary(otherNetwork);
      expect(summary.length).toBe(1);
    });
  });

  describe('Alert Messages', () => {
    it('should include feature name in alert message', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 9, 10);
      const alerts = tracker.checkAlerts(networkId);

      expect(alerts[0].message).toContain('MAX_SCHOOLS');
    });

    it('should include percentage in alert message', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 8, 10);
      const alerts = tracker.checkAlerts(networkId);

      expect(alerts[0].message).toContain('80');
    });

    it('should include current and limit in alert message', () => {
      tracker.recordUsage(networkId, 'MAX_SCHOOLS', 8, 10);
      const alerts = tracker.checkAlerts(networkId);

      expect(alerts[0].message).toContain('8/10');
    });
  });
});
