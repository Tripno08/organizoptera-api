/**
 * @module @organizoptera/subscription/types
 * @description Type definitions for subscription management
 */

import { z } from 'zod';
import type { SchoolNetworkId } from '@organizoptera/types';

// ============================================================================
// Enums
// ============================================================================

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

export type SubscriptionPlan =
  | 'FREE'
  | 'STARTER'
  | 'PROFESSIONAL'
  | 'ENTERPRISE';

export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export type FeatureKey =
  | 'MAX_SCHOOLS'
  | 'MAX_STUDENTS_PER_SCHOOL'
  | 'MAX_TEACHERS_PER_SCHOOL'
  | 'MAX_CLASSROOMS_PER_SCHOOL'
  | 'STORAGE_GB'
  | 'API_RATE_LIMIT_PER_MINUTE'
  | 'ADVANCED_ANALYTICS'
  | 'CUSTOM_BRANDING'
  | 'PRIORITY_SUPPORT'
  | 'SSO_ENABLED'
  | 'AUDIT_LOGS'
  | 'BACKUP_RETENTION_DAYS';

// ============================================================================
// Subscription Entity
// ============================================================================

/**
 * Subscription - Network subscription configuration
 */
export interface Subscription {
  id: string;
  networkId: SchoolNetworkId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEndsAt: Date | null;
  cancelledAt: Date | null;
  cancelAtPeriodEnd: boolean;
  features: Record<FeatureKey, number | boolean>;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Feature Limits Configuration
// ============================================================================

export interface FeatureLimits {
  MAX_SCHOOLS: number;
  MAX_STUDENTS_PER_SCHOOL: number;
  MAX_TEACHERS_PER_SCHOOL: number;
  MAX_CLASSROOMS_PER_SCHOOL: number;
  STORAGE_GB: number;
  API_RATE_LIMIT_PER_MINUTE: number;
  ADVANCED_ANALYTICS: boolean;
  CUSTOM_BRANDING: boolean;
  PRIORITY_SUPPORT: boolean;
  SSO_ENABLED: boolean;
  AUDIT_LOGS: boolean;
  BACKUP_RETENTION_DAYS: number;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * CreateSubscriptionDTO - Input for creating a new subscription
 */
export const CreateSubscriptionSchema = z.object({
  networkId: z.string(),
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional().default('MONTHLY'),
  startTrial: z.boolean().optional().default(false),
  trialDays: z.number().min(1).max(90).optional().default(14),
});

export type CreateSubscriptionDTO = z.infer<typeof CreateSubscriptionSchema>;

/**
 * UpdateSubscriptionDTO - Input for updating a subscription
 */
export const UpdateSubscriptionSchema = z.object({
  plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type UpdateSubscriptionDTO = z.infer<typeof UpdateSubscriptionSchema>;

/**
 * SubscriptionCheckDTO - Result of subscription validation
 */
export interface SubscriptionCheckResult {
  isValid: boolean;
  subscription: Subscription | null;
  status: SubscriptionStatus;
  canAccessFeature: (feature: FeatureKey) => boolean;
  getFeatureLimit: (feature: FeatureKey) => number | boolean;
  daysUntilExpiry: number | null;
  isInTrial: boolean;
  isPastDue: boolean;
}

/**
 * PlanComparisonDTO - Compare plans for upgrade/downgrade
 */
export interface PlanComparison {
  currentPlan: SubscriptionPlan;
  targetPlan: SubscriptionPlan;
  isUpgrade: boolean;
  priceDifference: number;
  featureChanges: {
    added: FeatureKey[];
    removed: FeatureKey[];
    increased: Array<{ feature: FeatureKey; from: number; to: number }>;
    decreased: Array<{ feature: FeatureKey; from: number; to: number }>;
  };
}

// ============================================================================
// Usage Tracking
// ============================================================================

/**
 * CurrentUsage - Track current usage against limits
 */
export interface CurrentUsage {
  networkId: SchoolNetworkId;
  schools: number;
  students: number;
  teachers: number;
  classrooms: number;
  storageGB: number;
  apiCallsThisMinute: number;
  lastUpdated: Date;
}

/**
 * UsageQuotaCheck - Result of quota validation
 */
export interface UsageQuotaCheck {
  isWithinLimit: boolean;
  feature: FeatureKey;
  current: number;
  limit: number;
  percentageUsed: number;
  canAddMore: (count: number) => boolean;
}

// ============================================================================
// Events
// ============================================================================

export type SubscriptionEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.renewed'
  | 'subscription.trial_ending'
  | 'subscription.trial_ended'
  | 'subscription.payment_failed'
  | 'subscription.suspended'
  | 'subscription.reactivated'
  | 'subscription.plan_changed'
  | 'subscription.quota_exceeded';

export interface SubscriptionEvent {
  type: SubscriptionEventType;
  networkId: SchoolNetworkId;
  subscription: Subscription;
  previousData?: Partial<Subscription>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
