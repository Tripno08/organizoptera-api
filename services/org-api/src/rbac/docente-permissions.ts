/**
 * DocenTe RBAC Permissions
 *
 * Defines permissions for DocenTe module resources:
 * - docente_profile: Teacher Big Five and burnout profiles
 * - docente_assessment: Teacher wellbeing assessments
 * - docente_analytics: Aggregated DocenTe analytics
 * - docente_intervention: Burnout intervention management
 *
 * @module @organizoptera/org-api/rbac/docente-permissions
 */

// =============================================================================
// DOCENTE RESOURCE TYPES
// =============================================================================

/**
 * DocenTe-specific permission resources
 */
export enum DocenteResource {
  /** Individual teacher DocenTe profile (Big Five, burnout level) */
  DOCENTE_PROFILE = 'docente_profile',

  /** Teacher wellbeing/burnout assessments */
  DOCENTE_ASSESSMENT = 'docente_assessment',

  /** Aggregated DocenTe analytics (org/school level) */
  DOCENTE_ANALYTICS = 'docente_analytics',

  /** Burnout interventions and action plans */
  DOCENTE_INTERVENTION = 'docente_intervention',

  /** DocenTe configuration per organization */
  DOCENTE_CONFIG = 'docente_config',
}

/**
 * DocenTe-specific permission actions
 */
export enum DocenteAction {
  /** View basic profile info */
  VIEW = 'view',

  /** View sensitive data (burnout scores, Big Five) */
  VIEW_SENSITIVE = 'view_sensitive',

  /** Create assessments/profiles */
  CREATE = 'create',

  /** Update profiles */
  UPDATE = 'update',

  /** Delete profiles (soft delete) */
  DELETE = 'delete',

  /** Export DocenTe data */
  EXPORT = 'export',

  /** Manage interventions */
  MANAGE_INTERVENTIONS = 'manage_interventions',

  /** Configure DocenTe settings */
  CONFIGURE = 'configure',

  /** View anonymized analytics */
  VIEW_ANALYTICS = 'view_analytics',

  /** View identified analytics (with teacher names) */
  VIEW_ANALYTICS_IDENTIFIED = 'view_analytics_identified',
}

// =============================================================================
// PERMISSION DEFINITIONS
// =============================================================================

export interface DocentePermission {
  resource: DocenteResource;
  action: DocenteAction;
  description: string;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * All DocenTe permissions
 */
export const DOCENTE_PERMISSIONS: DocentePermission[] = [
  // docente_profile permissions
  {
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.VIEW,
    description: 'View own DocenTe profile (basic info)',
    sensitivityLevel: 'low',
  },
  {
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.VIEW_SENSITIVE,
    description: 'View sensitive DocenTe data (burnout scores, Big Five)',
    sensitivityLevel: 'high',
  },
  {
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.CREATE,
    description: 'Create DocenTe profile for teacher',
    sensitivityLevel: 'medium',
  },
  {
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.UPDATE,
    description: 'Update DocenTe profile',
    sensitivityLevel: 'medium',
  },
  {
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.DELETE,
    description: 'Delete DocenTe profile (soft delete)',
    sensitivityLevel: 'high',
  },
  {
    resource: DocenteResource.DOCENTE_PROFILE,
    action: DocenteAction.EXPORT,
    description: 'Export DocenTe profile data',
    sensitivityLevel: 'critical',
  },

  // docente_assessment permissions
  {
    resource: DocenteResource.DOCENTE_ASSESSMENT,
    action: DocenteAction.VIEW,
    description: 'View own assessment results',
    sensitivityLevel: 'low',
  },
  {
    resource: DocenteResource.DOCENTE_ASSESSMENT,
    action: DocenteAction.VIEW_SENSITIVE,
    description: 'View other teachers assessment results',
    sensitivityLevel: 'high',
  },
  {
    resource: DocenteResource.DOCENTE_ASSESSMENT,
    action: DocenteAction.CREATE,
    description: 'Submit new assessment',
    sensitivityLevel: 'medium',
  },

  // docente_analytics permissions
  {
    resource: DocenteResource.DOCENTE_ANALYTICS,
    action: DocenteAction.VIEW_ANALYTICS,
    description: 'View anonymized DocenTe analytics',
    sensitivityLevel: 'medium',
  },
  {
    resource: DocenteResource.DOCENTE_ANALYTICS,
    action: DocenteAction.VIEW_ANALYTICS_IDENTIFIED,
    description: 'View identified DocenTe analytics (with teacher names)',
    sensitivityLevel: 'critical',
  },
  {
    resource: DocenteResource.DOCENTE_ANALYTICS,
    action: DocenteAction.EXPORT,
    description: 'Export DocenTe analytics data',
    sensitivityLevel: 'critical',
  },

  // docente_intervention permissions
  {
    resource: DocenteResource.DOCENTE_INTERVENTION,
    action: DocenteAction.VIEW,
    description: 'View intervention recommendations',
    sensitivityLevel: 'medium',
  },
  {
    resource: DocenteResource.DOCENTE_INTERVENTION,
    action: DocenteAction.MANAGE_INTERVENTIONS,
    description: 'Manage burnout interventions and action plans',
    sensitivityLevel: 'high',
  },

  // docente_config permissions
  {
    resource: DocenteResource.DOCENTE_CONFIG,
    action: DocenteAction.VIEW,
    description: 'View DocenTe configuration',
    sensitivityLevel: 'low',
  },
  {
    resource: DocenteResource.DOCENTE_CONFIG,
    action: DocenteAction.CONFIGURE,
    description: 'Configure DocenTe settings for organization',
    sensitivityLevel: 'high',
  },
];

// =============================================================================
// ROLE-BASED PERMISSION ASSIGNMENTS
// =============================================================================

export interface DocenteRolePermissions {
  role: string;
  permissions: Array<{
    resource: DocenteResource;
    action: DocenteAction;
    scope: 'own' | 'org' | 'subtree' | 'all';
  }>;
}

/**
 * Default DocenTe permissions per system role
 */
export const DOCENTE_ROLE_PERMISSIONS: DocenteRolePermissions[] = [
  // SUPER_ADMIN - Full access
  {
    role: 'SUPER_ADMIN',
    permissions: [
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW, scope: 'all' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW_SENSITIVE, scope: 'all' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.CREATE, scope: 'all' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.UPDATE, scope: 'all' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.DELETE, scope: 'all' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.EXPORT, scope: 'all' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW, scope: 'all' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW_SENSITIVE, scope: 'all' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.CREATE, scope: 'all' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS, scope: 'all' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS_IDENTIFIED, scope: 'all' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.EXPORT, scope: 'all' },
      { resource: DocenteResource.DOCENTE_INTERVENTION, action: DocenteAction.VIEW, scope: 'all' },
      { resource: DocenteResource.DOCENTE_INTERVENTION, action: DocenteAction.MANAGE_INTERVENTIONS, scope: 'all' },
      { resource: DocenteResource.DOCENTE_CONFIG, action: DocenteAction.VIEW, scope: 'all' },
      { resource: DocenteResource.DOCENTE_CONFIG, action: DocenteAction.CONFIGURE, scope: 'all' },
    ],
  },

  // ORG_ADMIN - Organization-level admin
  {
    role: 'ORG_ADMIN',
    permissions: [
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW, scope: 'org' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW_SENSITIVE, scope: 'org' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.CREATE, scope: 'org' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.UPDATE, scope: 'org' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.DELETE, scope: 'org' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW, scope: 'org' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW_SENSITIVE, scope: 'org' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS, scope: 'org' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS_IDENTIFIED, scope: 'org' },
      { resource: DocenteResource.DOCENTE_INTERVENTION, action: DocenteAction.VIEW, scope: 'org' },
      { resource: DocenteResource.DOCENTE_INTERVENTION, action: DocenteAction.MANAGE_INTERVENTIONS, scope: 'org' },
      { resource: DocenteResource.DOCENTE_CONFIG, action: DocenteAction.VIEW, scope: 'org' },
      { resource: DocenteResource.DOCENTE_CONFIG, action: DocenteAction.CONFIGURE, scope: 'org' },
    ],
  },

  // DIRECTOR - School director
  {
    role: 'DIRECTOR',
    permissions: [
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW_SENSITIVE, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.CREATE, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.UPDATE, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW_SENSITIVE, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS_IDENTIFIED, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_INTERVENTION, action: DocenteAction.VIEW, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_INTERVENTION, action: DocenteAction.MANAGE_INTERVENTIONS, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_CONFIG, action: DocenteAction.VIEW, scope: 'subtree' },
    ],
  },

  // COORDINATOR - Pedagogical coordinator
  {
    role: 'COORDINATOR',
    permissions: [
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW_SENSITIVE, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW_SENSITIVE, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS, scope: 'subtree' },
      // Coordinator sees only anonymized analytics by default
      { resource: DocenteResource.DOCENTE_INTERVENTION, action: DocenteAction.VIEW, scope: 'subtree' },
      { resource: DocenteResource.DOCENTE_CONFIG, action: DocenteAction.VIEW, scope: 'subtree' },
    ],
  },

  // TEACHER - Own profile only
  {
    role: 'TEACHER',
    permissions: [
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW, scope: 'own' },
      // Teacher can see their own Big Five and burnout
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW_SENSITIVE, scope: 'own' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW, scope: 'own' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.CREATE, scope: 'own' },
    ],
  },

  // ANALYST - Anonymized analytics only
  {
    role: 'ANALYST',
    permissions: [
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS, scope: 'org' },
      { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.EXPORT, scope: 'org' },
    ],
  },

  // SUPPORT - View profiles for support
  {
    role: 'SUPPORT',
    permissions: [
      { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW, scope: 'org' },
      { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW, scope: 'org' },
      { resource: DocenteResource.DOCENTE_CONFIG, action: DocenteAction.VIEW, scope: 'org' },
    ],
  },

  // GUEST - No DocenTe access by default
  {
    role: 'GUEST',
    permissions: [],
  },

  // STUDENT - No DocenTe access
  {
    role: 'STUDENT',
    permissions: [],
  },

  // PARENT - No DocenTe access
  {
    role: 'PARENT',
    permissions: [],
  },
];

// =============================================================================
// PERMISSION CHECK HELPERS
// =============================================================================

/**
 * Check if a role has a specific DocenTe permission
 */
export function hasDocentePermission(
  role: string,
  resource: DocenteResource,
  action: DocenteAction,
  scope: 'own' | 'org' | 'subtree' | 'all'
): boolean {
  const rolePermissions = DOCENTE_ROLE_PERMISSIONS.find((rp) => rp.role === role);

  if (!rolePermissions) {
    return false;
  }

  return rolePermissions.permissions.some(
    (p) =>
      p.resource === resource &&
      p.action === action &&
      (p.scope === scope || p.scope === 'all' || (scope === 'own' && ['org', 'subtree', 'all'].includes(p.scope)))
  );
}

/**
 * Get all DocenTe permissions for a role
 */
export function getDocentePermissionsForRole(role: string): DocenteRolePermissions['permissions'] {
  const rolePermissions = DOCENTE_ROLE_PERMISSIONS.find((rp) => rp.role === role);
  return rolePermissions?.permissions || [];
}

/**
 * Get permissions by sensitivity level
 */
export function getPermissionsBySensitivity(level: DocentePermission['sensitivityLevel']): DocentePermission[] {
  return DOCENTE_PERMISSIONS.filter((p) => p.sensitivityLevel === level);
}

/**
 * Get all permissions for a resource
 */
export function getPermissionsForResource(resource: DocenteResource): DocentePermission[] {
  return DOCENTE_PERMISSIONS.filter((p) => p.resource === resource);
}

// =============================================================================
// PERMISSION GUARD DECORATOR METADATA
// =============================================================================

/**
 * Metadata key for DocenTe permissions in NestJS decorators
 */
export const DOCENTE_PERMISSIONS_KEY = 'docente_permissions';

/**
 * Permission requirement for guards
 */
export interface DocentePermissionRequirement {
  resource: DocenteResource;
  action: DocenteAction;
  scopeField?: string; // Field in request to use for scope check (e.g., 'params.teacherId')
}

// =============================================================================
// AUDIT LOG REQUIREMENTS
// =============================================================================

/**
 * Actions that require audit logging
 */
export const DOCENTE_AUDIT_ACTIONS: Array<{
  resource: DocenteResource;
  action: DocenteAction;
}> = [
  { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.VIEW_SENSITIVE },
  { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.CREATE },
  { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.UPDATE },
  { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.DELETE },
  { resource: DocenteResource.DOCENTE_PROFILE, action: DocenteAction.EXPORT },
  { resource: DocenteResource.DOCENTE_ASSESSMENT, action: DocenteAction.VIEW_SENSITIVE },
  { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.VIEW_ANALYTICS_IDENTIFIED },
  { resource: DocenteResource.DOCENTE_ANALYTICS, action: DocenteAction.EXPORT },
  { resource: DocenteResource.DOCENTE_INTERVENTION, action: DocenteAction.MANAGE_INTERVENTIONS },
  { resource: DocenteResource.DOCENTE_CONFIG, action: DocenteAction.CONFIGURE },
];

/**
 * Check if an action requires audit logging
 */
export function requiresAuditLog(resource: DocenteResource, action: DocenteAction): boolean {
  return DOCENTE_AUDIT_ACTIONS.some((a) => a.resource === resource && a.action === action);
}
