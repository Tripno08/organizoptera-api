/**
 * @module @organizoptera/subscription
 * @description Subscription management for Organizoptera multi-tenant platform
 *
 * Features:
 * - Subscription lifecycle management (create, update, cancel, renew)
 * - Plan comparison and upgrades/downgrades
 * - Feature limits and quota tracking
 * - Trial period management
 * - Prorated billing calculations
 * - Subscription validation and status checks
 *
 * @example
 * ```typescript
 * import { SubscriptionService, PLAN_LIMITS } from '@organizoptera/subscription';
 *
 * const service = new SubscriptionService();
 *
 * // Create subscription with trial
 * const subscription = service.createSubscription({
 *   networkId: 'net_123',
 *   plan: 'PROFESSIONAL',
 *   billingCycle: 'ANNUAL',
 *   startTrial: true,
 *   trialDays: 14,
 * });
 *
 * // Check subscription status
 * const check = service.checkSubscription(subscription);
 * if (check.isValid) {
 *   console.log('Subscription is active');
 *   console.log('Max schools:', check.getFeatureLimit('MAX_SCHOOLS'));
 * }
 *
 * // Compare plans
 * const comparison = service.comparePlans('STARTER', 'PROFESSIONAL');
 * console.log('Price difference:', comparison.priceDifference);
 * console.log('Added features:', comparison.featureChanges.added);
 * ```
 */

export * from './types.js';
export * from './constants.js';
export * from './subscription-service.js';
