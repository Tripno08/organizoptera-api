/**
 * @module @organizoptera/subscription/constants
 * @description Subscription plans, pricing, and feature limits
 */

import type {
  SubscriptionPlan,
  FeatureLimits,
  BillingCycle,
} from './types.js';

// ============================================================================
// Plan Feature Limits
// ============================================================================

/**
 * FREE Plan - Basic tier for small organizations
 */
export const FREE_PLAN_LIMITS: FeatureLimits = {
  MAX_SCHOOLS: 1,
  MAX_STUDENTS_PER_SCHOOL: 50,
  MAX_TEACHERS_PER_SCHOOL: 5,
  MAX_CLASSROOMS_PER_SCHOOL: 5,
  STORAGE_GB: 1,
  API_RATE_LIMIT_PER_MINUTE: 60,
  ADVANCED_ANALYTICS: false,
  CUSTOM_BRANDING: false,
  PRIORITY_SUPPORT: false,
  SSO_ENABLED: false,
  AUDIT_LOGS: false,
  BACKUP_RETENTION_DAYS: 7,
};

/**
 * STARTER Plan - For growing organizations
 */
export const STARTER_PLAN_LIMITS: FeatureLimits = {
  MAX_SCHOOLS: 3,
  MAX_STUDENTS_PER_SCHOOL: 200,
  MAX_TEACHERS_PER_SCHOOL: 20,
  MAX_CLASSROOMS_PER_SCHOOL: 20,
  STORAGE_GB: 10,
  API_RATE_LIMIT_PER_MINUTE: 300,
  ADVANCED_ANALYTICS: false,
  CUSTOM_BRANDING: false,
  PRIORITY_SUPPORT: false,
  SSO_ENABLED: false,
  AUDIT_LOGS: false,
  BACKUP_RETENTION_DAYS: 30,
};

/**
 * PROFESSIONAL Plan - Full-featured tier
 */
export const PROFESSIONAL_PLAN_LIMITS: FeatureLimits = {
  MAX_SCHOOLS: 10,
  MAX_STUDENTS_PER_SCHOOL: 1000,
  MAX_TEACHERS_PER_SCHOOL: 100,
  MAX_CLASSROOMS_PER_SCHOOL: 100,
  STORAGE_GB: 100,
  API_RATE_LIMIT_PER_MINUTE: 1000,
  ADVANCED_ANALYTICS: true,
  CUSTOM_BRANDING: true,
  PRIORITY_SUPPORT: true,
  SSO_ENABLED: false,
  AUDIT_LOGS: true,
  BACKUP_RETENTION_DAYS: 90,
};

/**
 * ENTERPRISE Plan - Unlimited tier for large organizations
 */
export const ENTERPRISE_PLAN_LIMITS: FeatureLimits = {
  MAX_SCHOOLS: 9999, // Effectively unlimited
  MAX_STUDENTS_PER_SCHOOL: 10000,
  MAX_TEACHERS_PER_SCHOOL: 1000,
  MAX_CLASSROOMS_PER_SCHOOL: 500,
  STORAGE_GB: 1000,
  API_RATE_LIMIT_PER_MINUTE: 10000,
  ADVANCED_ANALYTICS: true,
  CUSTOM_BRANDING: true,
  PRIORITY_SUPPORT: true,
  SSO_ENABLED: true,
  AUDIT_LOGS: true,
  BACKUP_RETENTION_DAYS: 365,
};

/**
 * Map of all plan limits
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, FeatureLimits> = {
  FREE: FREE_PLAN_LIMITS,
  STARTER: STARTER_PLAN_LIMITS,
  PROFESSIONAL: PROFESSIONAL_PLAN_LIMITS,
  ENTERPRISE: ENTERPRISE_PLAN_LIMITS,
};

// ============================================================================
// Plan Pricing (in cents, e.g., $99.00 = 9900)
// ============================================================================

export const PLAN_PRICING: Record<
  SubscriptionPlan,
  Record<BillingCycle, number>
> = {
  FREE: {
    MONTHLY: 0,
    QUARTERLY: 0,
    ANNUAL: 0,
  },
  STARTER: {
    MONTHLY: 9900, // $99/month
    QUARTERLY: 26700, // $89/month ($267/quarter)
    ANNUAL: 95900, // $79.92/month ($959/year) - 20% discount
  },
  PROFESSIONAL: {
    MONTHLY: 29900, // $299/month
    QUARTERLY: 80700, // $269/month ($807/quarter) - 10% discount
    ANNUAL: 287900, // $239.92/month ($2,879/year) - 20% discount
  },
  ENTERPRISE: {
    MONTHLY: 99900, // $999/month
    QUARTERLY: 269700, // $899/month ($2,697/quarter) - 10% discount
    ANNUAL: 959900, // $799.92/month ($9,599/year) - 20% discount
  },
};

// ============================================================================
// Trial Configuration
// ============================================================================

export const DEFAULT_TRIAL_DAYS = 14;
export const MAX_TRIAL_DAYS = 90;
export const MIN_TRIAL_DAYS = 1;

/**
 * Plans that offer trial periods
 */
export const PLANS_WITH_TRIAL: SubscriptionPlan[] = [
  'STARTER',
  'PROFESSIONAL',
  'ENTERPRISE',
];

// ============================================================================
// Feature Descriptions
// ============================================================================

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  MAX_SCHOOLS: 'Maximum number of schools in the network',
  MAX_STUDENTS_PER_SCHOOL: 'Maximum students per individual school',
  MAX_TEACHERS_PER_SCHOOL: 'Maximum teachers per individual school',
  MAX_CLASSROOMS_PER_SCHOOL: 'Maximum classrooms per individual school',
  STORAGE_GB: 'Storage space in gigabytes',
  API_RATE_LIMIT_PER_MINUTE: 'API requests per minute',
  ADVANCED_ANALYTICS: 'Advanced reporting and analytics dashboard',
  CUSTOM_BRANDING: 'Custom logos, colors, and domain',
  PRIORITY_SUPPORT: '24/7 priority customer support',
  SSO_ENABLED: 'Single Sign-On (SSO) integration',
  AUDIT_LOGS: 'Complete audit trail of all actions',
  BACKUP_RETENTION_DAYS: 'Days of backup history retention',
};

// ============================================================================
// Plan Hierarchy (for upgrade/downgrade validation)
// ============================================================================

export const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  FREE: 0,
  STARTER: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
};

/**
 * Check if a plan change is an upgrade
 */
export function isUpgrade(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan,
): boolean {
  return PLAN_HIERARCHY[targetPlan] > PLAN_HIERARCHY[currentPlan];
}

/**
 * Check if a plan change is a downgrade
 */
export function isDowngrade(
  currentPlan: SubscriptionPlan,
  targetPlan: SubscriptionPlan,
): boolean {
  return PLAN_HIERARCHY[targetPlan] < PLAN_HIERARCHY[currentPlan];
}

// ============================================================================
// Billing Cycle Discounts
// ============================================================================

export const BILLING_CYCLE_DISCOUNT: Record<BillingCycle, number> = {
  MONTHLY: 0, // No discount
  QUARTERLY: 10, // 10% discount
  ANNUAL: 20, // 20% discount
};

// ============================================================================
// Grace Period Configuration
// ============================================================================

/**
 * Days of grace period after payment failure before suspension
 */
export const PAYMENT_GRACE_PERIOD_DAYS = 7;

/**
 * Days to retain data after subscription cancellation
 */
export const DATA_RETENTION_AFTER_CANCEL_DAYS = 30;

/**
 * Days before expiry to send renewal reminders
 */
export const RENEWAL_REMINDER_DAYS = [30, 14, 7, 3, 1];
