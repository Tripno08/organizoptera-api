/**
 * Clinical (Psychologist Portal) RBAC Permissions
 *
 * Defines permissions for clinical module resources:
 * - clinical_case: Clinical cases for students referred to psychologist
 * - clinical_assessment: Big Five, IPIP-NEO, HiTOP assessments
 * - clinical_referral: Referral from teacher to psychologist
 * - clinical_intervention: Treatment plans and interventions
 * - clinical_export: Clinical data export (LGPD Art. 18)
 *
 * LGPD Art. 11 - Tratamento de dados sensíveis (saúde)
 * CFP Resolution 001/2009 - Registro documental do psicólogo
 *
 * @module @organizoptera/org-api/rbac/clinical-permissions
 */

// =============================================================================
// CLINICAL RESOURCE TYPES
// =============================================================================

/**
 * Clinical-specific permission resources
 */
export enum ClinicalResource {
  /** Clinical case (student referred to psychologist) */
  CLINICAL_CASE = 'clinical_case',

  /** Clinical assessments (Big Five, IPIP-NEO, HiTOP) */
  CLINICAL_ASSESSMENT = 'clinical_assessment',

  /** Referral from teacher/coordinator to psychologist */
  CLINICAL_REFERRAL = 'clinical_referral',

  /** Treatment plans and interventions */
  CLINICAL_INTERVENTION = 'clinical_intervention',

  /** Session notes and progress records */
  CLINICAL_SESSION = 'clinical_session',

  /** Clinical data export (LGPD compliance) */
  CLINICAL_EXPORT = 'clinical_export',

  /** Crisis intervention records */
  CLINICAL_CRISIS = 'clinical_crisis',

  /** Clinical module configuration */
  CLINICAL_CONFIG = 'clinical_config',
}

/**
 * Clinical-specific permission actions
 */
export enum ClinicalAction {
  /** View basic case info (status, dates) */
  VIEW = 'view',

  /** View sensitive clinical data (assessment results, notes) */
  VIEW_SENSITIVE = 'view_sensitive',

  /** View full clinical record (all data including crisis) */
  VIEW_FULL = 'view_full',

  /** Create new cases/assessments/referrals */
  CREATE = 'create',

  /** Update existing records */
  UPDATE = 'update',

  /** Close/archive cases */
  CLOSE = 'close',

  /** Delete records (soft delete, requires audit) */
  DELETE = 'delete',

  /** Export clinical data (LGPD Art. 18) */
  EXPORT = 'export',

  /** Accept/decline referrals */
  MANAGE_REFERRALS = 'manage_referrals',

  /** Manage treatment plans */
  MANAGE_TREATMENT = 'manage_treatment',

  /** Document session notes */
  DOCUMENT_SESSION = 'document_session',

  /** Flag/manage crisis situations */
  MANAGE_CRISIS = 'manage_crisis',

  /** Configure clinical settings */
  CONFIGURE = 'configure',

  /** View anonymized clinical analytics */
  VIEW_ANALYTICS = 'view_analytics',

  /** Supervise other psychologists' work */
  SUPERVISE = 'supervise',
}

// =============================================================================
// PERMISSION DEFINITIONS
// =============================================================================

export interface ClinicalPermission {
  resource: ClinicalResource;
  action: ClinicalAction;
  description: string;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresCredentialCheck: boolean;
  requiresConsentCheck: boolean;
  auditRequired: boolean;
}

/**
 * All Clinical permissions
 */
export const CLINICAL_PERMISSIONS: ClinicalPermission[] = [
  // clinical_case permissions
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.VIEW,
    description: 'View basic case info (status, dates, assigned psychologist)',
    sensitivityLevel: 'medium',
    requiresCredentialCheck: false,
    requiresConsentCheck: false,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.VIEW_SENSITIVE,
    description: 'View sensitive case data (assessment results, preliminary diagnosis)',
    sensitivityLevel: 'high',
    requiresCredentialCheck: true,
    requiresConsentCheck: true,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.VIEW_FULL,
    description: 'View full clinical record (all data including crisis history)',
    sensitivityLevel: 'critical',
    requiresCredentialCheck: true,
    requiresConsentCheck: true,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.CREATE,
    description: 'Create new clinical case',
    sensitivityLevel: 'high',
    requiresCredentialCheck: true,
    requiresConsentCheck: true,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.UPDATE,
    description: 'Update clinical case',
    sensitivityLevel: 'high',
    requiresCredentialCheck: true,
    requiresConsentCheck: false,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.CLOSE,
    description: 'Close/archive clinical case',
    sensitivityLevel: 'high',
    requiresCredentialCheck: true,
    requiresConsentCheck: false,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.DELETE,
    description: 'Delete clinical case (soft delete, CFP 5-year retention)',
    sensitivityLevel: 'critical',
    requiresCredentialCheck: true,
    requiresConsentCheck: false,
    auditRequired: true,
  },

  // clinical_assessment permissions
  {
    resource: ClinicalResource.CLINICAL_ASSESSMENT,
    action: ClinicalAction.VIEW,
    description: 'View assessment metadata (type, date, status)',
    sensitivityLevel: 'medium',
    requiresCredentialCheck: false,
    requiresConsentCheck: false,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_ASSESSMENT,
    action: ClinicalAction.VIEW_SENSITIVE,
    description: 'View assessment results (Big Five scores, IPIP-NEO, HiTOP)',
    sensitivityLevel: 'critical',
    requiresCredentialCheck: true,
    requiresConsentCheck: true,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_ASSESSMENT,
    action: ClinicalAction.CREATE,
    description: 'Administer new assessment',
    sensitivityLevel: 'high',
    requiresCredentialCheck: true,
    requiresConsentCheck: true,
    auditRequired: true,
  },

  // clinical_referral permissions
  {
    resource: ClinicalResource.CLINICAL_REFERRAL,
    action: ClinicalAction.VIEW,
    description: 'View referral requests',
    sensitivityLevel: 'medium',
    requiresCredentialCheck: false,
    requiresConsentCheck: false,
    auditRequired: false,
  },
  {
    resource: ClinicalResource.CLINICAL_REFERRAL,
    action: ClinicalAction.CREATE,
    description: 'Create referral to psychologist',
    sensitivityLevel: 'medium',
    requiresCredentialCheck: false,
    requiresConsentCheck: true,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_REFERRAL,
    action: ClinicalAction.MANAGE_REFERRALS,
    description: 'Accept/decline/assign referrals',
    sensitivityLevel: 'high',
    requiresCredentialCheck: true,
    requiresConsentCheck: false,
    auditRequired: true,
  },

  // clinical_intervention permissions
  {
    resource: ClinicalResource.CLINICAL_INTERVENTION,
    action: ClinicalAction.VIEW,
    description: 'View treatment plan summary',
    sensitivityLevel: 'high',
    requiresCredentialCheck: false,
    requiresConsentCheck: true,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_INTERVENTION,
    action: ClinicalAction.MANAGE_TREATMENT,
    description: 'Create/update treatment plans',
    sensitivityLevel: 'critical',
    requiresCredentialCheck: true,
    requiresConsentCheck: true,
    auditRequired: true,
  },

  // clinical_session permissions
  {
    resource: ClinicalResource.CLINICAL_SESSION,
    action: ClinicalAction.VIEW,
    description: 'View session schedule',
    sensitivityLevel: 'low',
    requiresCredentialCheck: false,
    requiresConsentCheck: false,
    auditRequired: false,
  },
  {
    resource: ClinicalResource.CLINICAL_SESSION,
    action: ClinicalAction.DOCUMENT_SESSION,
    description: 'Document session notes and progress',
    sensitivityLevel: 'critical',
    requiresCredentialCheck: true,
    requiresConsentCheck: false,
    auditRequired: true,
  },

  // clinical_export permissions
  {
    resource: ClinicalResource.CLINICAL_EXPORT,
    action: ClinicalAction.EXPORT,
    description: 'Export clinical data (LGPD Art. 18 - Data Portability)',
    sensitivityLevel: 'critical',
    requiresCredentialCheck: true,
    requiresConsentCheck: true,
    auditRequired: true,
  },

  // clinical_crisis permissions
  {
    resource: ClinicalResource.CLINICAL_CRISIS,
    action: ClinicalAction.VIEW,
    description: 'View crisis flags and alerts',
    sensitivityLevel: 'high',
    requiresCredentialCheck: true,
    requiresConsentCheck: false,
    auditRequired: true,
  },
  {
    resource: ClinicalResource.CLINICAL_CRISIS,
    action: ClinicalAction.MANAGE_CRISIS,
    description: 'Flag/manage crisis situations',
    sensitivityLevel: 'critical',
    requiresCredentialCheck: true,
    requiresConsentCheck: false,
    auditRequired: true,
  },

  // clinical_config permissions
  {
    resource: ClinicalResource.CLINICAL_CONFIG,
    action: ClinicalAction.VIEW,
    description: 'View clinical module configuration',
    sensitivityLevel: 'low',
    requiresCredentialCheck: false,
    requiresConsentCheck: false,
    auditRequired: false,
  },
  {
    resource: ClinicalResource.CLINICAL_CONFIG,
    action: ClinicalAction.CONFIGURE,
    description: 'Configure clinical settings for organization',
    sensitivityLevel: 'high',
    requiresCredentialCheck: false,
    requiresConsentCheck: false,
    auditRequired: true,
  },

  // Analytics permissions
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.VIEW_ANALYTICS,
    description: 'View anonymized clinical analytics',
    sensitivityLevel: 'medium',
    requiresCredentialCheck: false,
    requiresConsentCheck: false,
    auditRequired: false,
  },

  // Supervision permissions
  {
    resource: ClinicalResource.CLINICAL_CASE,
    action: ClinicalAction.SUPERVISE,
    description: 'Supervise other psychologists work (case review)',
    sensitivityLevel: 'critical',
    requiresCredentialCheck: true,
    requiresConsentCheck: false,
    auditRequired: true,
  },
];

// =============================================================================
// ROLE-BASED PERMISSION ASSIGNMENTS
// =============================================================================

export interface ClinicalRolePermissions {
  role: string;
  permissions: Array<{
    resource: ClinicalResource;
    action: ClinicalAction;
    scope: 'own' | 'assigned' | 'school' | 'org' | 'all';
  }>;
}

/**
 * Default Clinical permissions per system role
 *
 * IMPORTANT: PSICOLOGO is a new role specific to clinical module
 */
export const CLINICAL_ROLE_PERMISSIONS: ClinicalRolePermissions[] = [
  // SUPER_ADMIN - Full access (for system maintenance)
  {
    role: 'SUPER_ADMIN',
    permissions: [
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_SENSITIVE, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_FULL, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.VIEW, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.VIEW_SENSITIVE, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.VIEW, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_INTERVENTION, action: ClinicalAction.VIEW, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_SESSION, action: ClinicalAction.VIEW, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_CRISIS, action: ClinicalAction.VIEW, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.VIEW, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.CONFIGURE, scope: 'all' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_ANALYTICS, scope: 'all' },
      // Note: SUPER_ADMIN cannot CREATE/UPDATE/DELETE clinical records - only PSICOLOGO can
    ],
  },

  // PSICOLOGO - Primary role for psychologists (NEW ROLE)
  {
    role: 'PSICOLOGO',
    permissions: [
      // Case management - assigned cases only by default
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_SENSITIVE, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_FULL, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.CREATE, scope: 'school' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.UPDATE, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.CLOSE, scope: 'assigned' },

      // Assessment - full access for assigned cases
      { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.VIEW, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.VIEW_SENSITIVE, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.CREATE, scope: 'assigned' },

      // Referrals - can manage incoming referrals
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.VIEW, scope: 'school' },
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.MANAGE_REFERRALS, scope: 'school' },

      // Intervention/Treatment
      { resource: ClinicalResource.CLINICAL_INTERVENTION, action: ClinicalAction.VIEW, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_INTERVENTION, action: ClinicalAction.MANAGE_TREATMENT, scope: 'assigned' },

      // Session documentation
      { resource: ClinicalResource.CLINICAL_SESSION, action: ClinicalAction.VIEW, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_SESSION, action: ClinicalAction.DOCUMENT_SESSION, scope: 'assigned' },

      // Crisis management
      { resource: ClinicalResource.CLINICAL_CRISIS, action: ClinicalAction.VIEW, scope: 'assigned' },
      { resource: ClinicalResource.CLINICAL_CRISIS, action: ClinicalAction.MANAGE_CRISIS, scope: 'assigned' },

      // Export (with patient consent)
      { resource: ClinicalResource.CLINICAL_EXPORT, action: ClinicalAction.EXPORT, scope: 'assigned' },

      // Analytics (anonymized)
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_ANALYTICS, scope: 'school' },

      // Config (view only)
      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.VIEW, scope: 'school' },
    ],
  },

  // PSICOLOGO_SUPERVISOR - Supervising psychologist (can supervise others)
  {
    role: 'PSICOLOGO_SUPERVISOR',
    permissions: [
      // All PSICOLOGO permissions plus...
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_SENSITIVE, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_FULL, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.CREATE, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.UPDATE, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.CLOSE, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.SUPERVISE, scope: 'org' },

      { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.VIEW, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.VIEW_SENSITIVE, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.CREATE, scope: 'org' },

      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.VIEW, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.MANAGE_REFERRALS, scope: 'org' },

      { resource: ClinicalResource.CLINICAL_INTERVENTION, action: ClinicalAction.VIEW, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_INTERVENTION, action: ClinicalAction.MANAGE_TREATMENT, scope: 'org' },

      { resource: ClinicalResource.CLINICAL_SESSION, action: ClinicalAction.VIEW, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_SESSION, action: ClinicalAction.DOCUMENT_SESSION, scope: 'org' },

      { resource: ClinicalResource.CLINICAL_CRISIS, action: ClinicalAction.VIEW, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CRISIS, action: ClinicalAction.MANAGE_CRISIS, scope: 'org' },

      { resource: ClinicalResource.CLINICAL_EXPORT, action: ClinicalAction.EXPORT, scope: 'org' },

      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_ANALYTICS, scope: 'org' },

      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.VIEW, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.CONFIGURE, scope: 'org' },
    ],
  },

  // DIRECTOR - School director (can view referrals and anonymized analytics)
  {
    role: 'DIRECTOR',
    permissions: [
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW, scope: 'school' },
      // Note: DIRECTOR cannot see sensitive clinical data - only basic case status
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.VIEW, scope: 'school' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_ANALYTICS, scope: 'school' },
      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.VIEW, scope: 'school' },
    ],
  },

  // COORDINATOR - Pedagogical coordinator (can create referrals)
  {
    role: 'COORDINATOR',
    permissions: [
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW, scope: 'school' },
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.VIEW, scope: 'school' },
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.CREATE, scope: 'school' },
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_ANALYTICS, scope: 'school' },
    ],
  },

  // TEACHER - Can create referrals for their students
  {
    role: 'TEACHER',
    permissions: [
      // Teacher can see their own referrals
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.VIEW, scope: 'own' },
      { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.CREATE, scope: 'own' },
      // Teacher can see basic status of referred students (not clinical data)
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW, scope: 'own' },
    ],
  },

  // PARENT/GUARDIAN - Can view their child's case summary (with consent)
  {
    role: 'PARENT',
    permissions: [
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW, scope: 'own' },
      { resource: ClinicalResource.CLINICAL_INTERVENTION, action: ClinicalAction.VIEW, scope: 'own' },
      { resource: ClinicalResource.CLINICAL_SESSION, action: ClinicalAction.VIEW, scope: 'own' },
      // Parent can request export of their child's data (LGPD Art. 18)
      { resource: ClinicalResource.CLINICAL_EXPORT, action: ClinicalAction.EXPORT, scope: 'own' },
    ],
  },

  // STUDENT - No clinical access (minor protection)
  {
    role: 'STUDENT',
    permissions: [],
  },

  // ANALYST - Anonymized analytics only
  {
    role: 'ANALYST',
    permissions: [
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_ANALYTICS, scope: 'org' },
    ],
  },

  // ORG_ADMIN - Can configure but not access clinical data
  {
    role: 'ORG_ADMIN',
    permissions: [
      { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_ANALYTICS, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.VIEW, scope: 'org' },
      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.CONFIGURE, scope: 'org' },
    ],
  },

  // SUPPORT - No clinical data access
  {
    role: 'SUPPORT',
    permissions: [
      { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.VIEW, scope: 'org' },
    ],
  },

  // GUEST - No clinical access
  {
    role: 'GUEST',
    permissions: [],
  },
];

// =============================================================================
// CREDENTIAL VERIFICATION
// =============================================================================

/**
 * CRP (Conselho Regional de Psicologia) credential verification
 */
export interface CRPCredential {
  crpNumber: string; // Format: XX/XXXXXX (region/number)
  crpRegion: string; // 01-24 (states)
  status: 'active' | 'suspended' | 'inactive' | 'pending_verification';
  verifiedAt?: Date;
  expiresAt?: Date;
  specializations?: string[];
}

/**
 * Validate CRP number format
 */
export function isValidCRPFormat(crpNumber: string): boolean {
  // Format: XX/XXXXXX (2-digit region / 6-digit number)
  const crpRegex = /^(0[1-9]|1[0-9]|2[0-4])\/\d{6}$/;
  return crpRegex.test(crpNumber);
}

/**
 * Extract region from CRP number
 */
export function extractCRPRegion(crpNumber: string): string | null {
  const match = crpNumber.match(/^(\d{2})\//);
  return match ? match[1] : null;
}

// =============================================================================
// PERMISSION CHECK HELPERS
// =============================================================================

/**
 * Check if a role has a specific Clinical permission
 */
export function hasClinicalPermission(
  role: string,
  resource: ClinicalResource,
  action: ClinicalAction,
  scope: 'own' | 'assigned' | 'school' | 'org' | 'all'
): boolean {
  const rolePermissions = CLINICAL_ROLE_PERMISSIONS.find((rp) => rp.role === role);

  if (!rolePermissions) {
    return false;
  }

  // Scope hierarchy: own < assigned < school < org < all
  const scopeHierarchy = ['own', 'assigned', 'school', 'org', 'all'];
  const requestedScopeIndex = scopeHierarchy.indexOf(scope);

  return rolePermissions.permissions.some((p) => {
    if (p.resource !== resource || p.action !== action) {
      return false;
    }

    const permissionScopeIndex = scopeHierarchy.indexOf(p.scope);
    return permissionScopeIndex >= requestedScopeIndex;
  });
}

/**
 * Get all Clinical permissions for a role
 */
export function getClinicalPermissionsForRole(role: string): ClinicalRolePermissions['permissions'] {
  const rolePermissions = CLINICAL_ROLE_PERMISSIONS.find((rp) => rp.role === role);
  return rolePermissions?.permissions || [];
}

/**
 * Get permissions by sensitivity level
 */
export function getClinicalPermissionsBySensitivity(
  level: ClinicalPermission['sensitivityLevel']
): ClinicalPermission[] {
  return CLINICAL_PERMISSIONS.filter((p) => p.sensitivityLevel === level);
}

/**
 * Get all permissions for a resource
 */
export function getClinicalPermissionsForResource(resource: ClinicalResource): ClinicalPermission[] {
  return CLINICAL_PERMISSIONS.filter((p) => p.resource === resource);
}

/**
 * Check if an action requires credential verification (CRP check)
 */
export function requiresCredentialCheck(resource: ClinicalResource, action: ClinicalAction): boolean {
  const permission = CLINICAL_PERMISSIONS.find(
    (p) => p.resource === resource && p.action === action
  );
  return permission?.requiresCredentialCheck ?? false;
}

/**
 * Check if an action requires consent verification
 */
export function requiresConsentCheck(resource: ClinicalResource, action: ClinicalAction): boolean {
  const permission = CLINICAL_PERMISSIONS.find(
    (p) => p.resource === resource && p.action === action
  );
  return permission?.requiresConsentCheck ?? false;
}

// =============================================================================
// PERMISSION GUARD DECORATOR METADATA
// =============================================================================

/**
 * Metadata key for Clinical permissions in NestJS decorators
 */
export const CLINICAL_PERMISSIONS_KEY = 'clinical_permissions';

/**
 * Permission requirement for guards
 */
export interface ClinicalPermissionRequirement {
  resource: ClinicalResource;
  action: ClinicalAction;
  scopeField?: string; // Field in request for scope check
  checkCredentials?: boolean;
  checkConsent?: boolean;
}

// =============================================================================
// AUDIT LOG REQUIREMENTS
// =============================================================================

/**
 * Actions that require audit logging (all clinical actions by default)
 */
export const CLINICAL_AUDIT_ACTIONS: Array<{
  resource: ClinicalResource;
  action: ClinicalAction;
  retentionYears: number;
}> = [
  // All case actions - 5 year retention (CFP minimum)
  { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_SENSITIVE, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.VIEW_FULL, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.CREATE, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.UPDATE, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.CLOSE, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.DELETE, retentionYears: 20 },

  // Assessment actions
  { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.VIEW_SENSITIVE, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_ASSESSMENT, action: ClinicalAction.CREATE, retentionYears: 5 },

  // Referral actions
  { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.CREATE, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_REFERRAL, action: ClinicalAction.MANAGE_REFERRALS, retentionYears: 5 },

  // Treatment actions
  { resource: ClinicalResource.CLINICAL_INTERVENTION, action: ClinicalAction.MANAGE_TREATMENT, retentionYears: 5 },

  // Session documentation
  { resource: ClinicalResource.CLINICAL_SESSION, action: ClinicalAction.DOCUMENT_SESSION, retentionYears: 5 },

  // Crisis actions - 20 year retention
  { resource: ClinicalResource.CLINICAL_CRISIS, action: ClinicalAction.VIEW, retentionYears: 5 },
  { resource: ClinicalResource.CLINICAL_CRISIS, action: ClinicalAction.MANAGE_CRISIS, retentionYears: 20 },

  // Export actions
  { resource: ClinicalResource.CLINICAL_EXPORT, action: ClinicalAction.EXPORT, retentionYears: 5 },

  // Supervision
  { resource: ClinicalResource.CLINICAL_CASE, action: ClinicalAction.SUPERVISE, retentionYears: 5 },

  // Config changes
  { resource: ClinicalResource.CLINICAL_CONFIG, action: ClinicalAction.CONFIGURE, retentionYears: 5 },
];

/**
 * Check if an action requires audit logging
 */
export function requiresClinicalAuditLog(resource: ClinicalResource, action: ClinicalAction): boolean {
  return CLINICAL_AUDIT_ACTIONS.some((a) => a.resource === resource && a.action === action);
}

/**
 * Get retention period for an audit action
 */
export function getClinicalAuditRetention(resource: ClinicalResource, action: ClinicalAction): number {
  const auditAction = CLINICAL_AUDIT_ACTIONS.find(
    (a) => a.resource === resource && a.action === action
  );
  return auditAction?.retentionYears ?? 5; // Default 5 years (CFP minimum)
}

// =============================================================================
// ROW-LEVEL SECURITY (RLS) POLICIES
// =============================================================================

/**
 * PostgreSQL RLS policy definitions for clinical data
 */
export const CLINICAL_RLS_POLICIES = {
  /**
   * Clinical case isolation policy
   * - PSICOLOGO: Can see assigned cases
   * - PSICOLOGO_SUPERVISOR: Can see all cases in org
   * - DIRECTOR/COORDINATOR: Can see case metadata only
   * - PARENT: Can see their child's case only
   */
  clinical_case: `
    CREATE POLICY clinical_case_isolation ON clinical_cases
    USING (
      -- Super admin bypass (for maintenance only)
      (current_setting('app.role', true) = 'SUPER_ADMIN')
      OR
      -- Psychologist: assigned cases only
      (current_setting('app.role', true) = 'PSICOLOGO'
       AND assigned_psychologist_id = current_setting('app.user_id', true)::uuid)
      OR
      -- Supervisor: all cases in org
      (current_setting('app.role', true) = 'PSICOLOGO_SUPERVISOR'
       AND org_id = current_setting('app.org_id', true)::uuid)
      OR
      -- Director/Coordinator: cases in their school (metadata only - separate view)
      (current_setting('app.role', true) IN ('DIRECTOR', 'COORDINATOR')
       AND school_id = current_setting('app.school_id', true)::uuid)
      OR
      -- Parent: their child's case only
      (current_setting('app.role', true) = 'PARENT'
       AND patient_id IN (
         SELECT student_id FROM guardian_relationships
         WHERE guardian_id = current_setting('app.user_id', true)::uuid
       ))
    );
  `,

  /**
   * Clinical assessment isolation policy
   * - Only PSICOLOGO roles can see assessment results
   */
  clinical_assessment: `
    CREATE POLICY clinical_assessment_isolation ON clinical_assessments
    USING (
      (current_setting('app.role', true) = 'SUPER_ADMIN')
      OR
      (current_setting('app.role', true) IN ('PSICOLOGO', 'PSICOLOGO_SUPERVISOR')
       AND case_id IN (
         SELECT id FROM clinical_cases
         WHERE assigned_psychologist_id = current_setting('app.user_id', true)::uuid
            OR (current_setting('app.role', true) = 'PSICOLOGO_SUPERVISOR'
                AND org_id = current_setting('app.org_id', true)::uuid)
       ))
    );
  `,

  /**
   * Clinical session notes isolation policy
   * - Only the treating psychologist and supervisor can see notes
   */
  clinical_session: `
    CREATE POLICY clinical_session_isolation ON clinical_sessions
    USING (
      (current_setting('app.role', true) = 'SUPER_ADMIN')
      OR
      (current_setting('app.role', true) IN ('PSICOLOGO', 'PSICOLOGO_SUPERVISOR')
       AND psychologist_id = current_setting('app.user_id', true)::uuid)
      OR
      (current_setting('app.role', true) = 'PSICOLOGO_SUPERVISOR'
       AND org_id = current_setting('app.org_id', true)::uuid)
    );
  `,

  /**
   * Clinical crisis isolation policy
   * - Only psychologist roles can see crisis data
   */
  clinical_crisis: `
    CREATE POLICY clinical_crisis_isolation ON clinical_crisis_records
    USING (
      (current_setting('app.role', true) = 'SUPER_ADMIN')
      OR
      (current_setting('app.role', true) IN ('PSICOLOGO', 'PSICOLOGO_SUPERVISOR')
       AND case_id IN (
         SELECT id FROM clinical_cases
         WHERE assigned_psychologist_id = current_setting('app.user_id', true)::uuid
            OR (current_setting('app.role', true) = 'PSICOLOGO_SUPERVISOR'
                AND org_id = current_setting('app.org_id', true)::uuid)
       ))
    );
  `,
};

/**
 * SQL to setup clinical RLS policies
 */
export function generateClinicalRLSSetupSQL(): string {
  return `
-- Enable RLS on clinical tables
ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_crisis_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_interventions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS clinical_case_isolation ON clinical_cases;
DROP POLICY IF EXISTS clinical_assessment_isolation ON clinical_assessments;
DROP POLICY IF EXISTS clinical_session_isolation ON clinical_sessions;
DROP POLICY IF EXISTS clinical_crisis_isolation ON clinical_crisis_records;

-- Create new policies
${CLINICAL_RLS_POLICIES.clinical_case}
${CLINICAL_RLS_POLICIES.clinical_assessment}
${CLINICAL_RLS_POLICIES.clinical_session}
${CLINICAL_RLS_POLICIES.clinical_crisis}

-- Force RLS for all users including table owners
ALTER TABLE clinical_cases FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_assessments FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE clinical_crisis_records FORCE ROW LEVEL SECURITY;
  `.trim();
}
