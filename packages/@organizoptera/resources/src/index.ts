/**
 * @module @organizoptera/resources
 * @description Resource quota tracking and usage monitoring
 *
 * Features:
 * - Track resource usage against subscription limits
 * - Monitor quota consumption in real-time
 * - Alert when approaching limits
 * - Historical usage reporting
 * - Resource allocation recommendations
 *
 * @example
 * ```typescript
 * import { ResourceTracker } from '@organizoptera/resources';
 * import { SubscriptionService } from '@organizoptera/subscription';
 *
 * const tracker = new ResourceTracker();
 * const subscriptionService = new SubscriptionService();
 *
 * // Check if can add more schools
 * const subscription = subscriptionService.checkSubscription(mySubscription);
 * const canAdd = tracker.canAllocate(
 *   subscription,
 *   'MAX_SCHOOLS',
 *   currentSchools,
 *   1
 * );
 *
 * if (canAdd) {
 *   // Add new school
 *   tracker.recordUsage('net_123', 'MAX_SCHOOLS', currentSchools + 1);
 * }
 * ```
 */

import type { SchoolNetworkId } from '@organizoptera/types';
import type {
  Subscription,
  FeatureKey,
  SubscriptionCheckResult,
} from '@organizoptera/subscription';

/**
 * ResourceUsage - Current resource consumption
 */
export interface ResourceUsage {
  networkId: SchoolNetworkId;
  feature: FeatureKey;
  current: number;
  limit: number;
  percentageUsed: number;
  timestamp: Date;
}

/**
 * UsageAlert - Alert when approaching limits
 */
export interface UsageAlert {
  id: string;
  networkId: SchoolNetworkId;
  feature: FeatureKey;
  threshold: number; // percentage
  current: number;
  limit: number;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  createdAt: Date;
}

/**
 * ResourceTracker - Service for tracking resource usage
 */
export class ResourceTracker {
  private usageCache: Map<string, ResourceUsage> = new Map();
  private alertThresholds = {
    INFO: 50,
    WARNING: 80,
    CRITICAL: 95,
  };

  /**
   * Record current usage for a resource
   */
  recordUsage(
    networkId: SchoolNetworkId,
    feature: FeatureKey,
    current: number,
    limit: number,
  ): ResourceUsage {
    const key = `${networkId}:${feature}`;
    const usage: ResourceUsage = {
      networkId,
      feature,
      current,
      limit,
      percentageUsed: limit > 0 ? (current / limit) * 100 : 0,
      timestamp: new Date(),
    };

    this.usageCache.set(key, usage);
    return usage;
  }

  /**
   * Get current usage for a resource
   */
  getUsage(networkId: SchoolNetworkId, feature: FeatureKey): ResourceUsage | null {
    const key = `${networkId}:${feature}`;
    return this.usageCache.get(key) || null;
  }

  /**
   * Check if can allocate more resources
   */
  canAllocate(
    subscription: SubscriptionCheckResult,
    feature: FeatureKey,
    current: number,
    additional: number,
  ): boolean {
    const limit = subscription.getFeatureLimit(feature);
    if (typeof limit !== 'number') return false;
    return current + additional <= limit;
  }

  /**
   * Check all resources and generate alerts
   */
  checkAlerts(networkId: SchoolNetworkId): UsageAlert[] {
    const alerts: UsageAlert[] = [];
    const networkUsage = Array.from(this.usageCache.entries())
      .filter(([key]) => key.startsWith(`${networkId}:`))
      .map(([, usage]) => usage);

    for (const usage of networkUsage) {
      const severity = this.getSeverity(usage.percentageUsed);
      if (severity) {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          networkId: usage.networkId,
          feature: usage.feature,
          threshold: this.alertThresholds[severity],
          current: usage.current,
          limit: usage.limit,
          message: this.getAlertMessage(usage, severity),
          severity,
          createdAt: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Get usage summary for all features
   */
  getUsageSummary(networkId: SchoolNetworkId): ResourceUsage[] {
    return Array.from(this.usageCache.entries())
      .filter(([key]) => key.startsWith(`${networkId}:`))
      .map(([, usage]) => usage);
  }

  /**
   * Clear usage cache for a network
   */
  clearCache(networkId: SchoolNetworkId): void {
    const keys = Array.from(this.usageCache.keys()).filter((key) =>
      key.startsWith(`${networkId}:`),
    );
    keys.forEach((key) => this.usageCache.delete(key));
  }

  private getSeverity(percentage: number): 'INFO' | 'WARNING' | 'CRITICAL' | null {
    if (percentage >= this.alertThresholds.CRITICAL) return 'CRITICAL';
    if (percentage >= this.alertThresholds.WARNING) return 'WARNING';
    if (percentage >= this.alertThresholds.INFO) return 'INFO';
    return null;
  }

  private getAlertMessage(usage: ResourceUsage, severity: string): string {
    return `${severity}: ${usage.feature} usage at ${usage.percentageUsed.toFixed(1)}% (${usage.current}/${usage.limit})`;
  }
}

export type { Subscription, FeatureKey, SubscriptionCheckResult };
