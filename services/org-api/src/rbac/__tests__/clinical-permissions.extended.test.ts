/**
 * @organizoptera/org-api - Clinical Permissions Extended Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ClinicalResource,
  ClinicalAction,
  CLINICAL_PERMISSIONS,
  CLINICAL_ROLE_PERMISSIONS,
  isValidCRPFormat,
  extractCRPRegion,
  hasClinicalPermission,
  getClinicalPermissionsForRole,
  getClinicalPermissionsBySensitivity,
  getClinicalPermissionsForResource,
  requiresCredentialCheck,
  requiresConsentCheck,
  requiresClinicalAuditLog,
  getClinicalAuditRetention,
  generateClinicalRLSSetupSQL,
  CLINICAL_PERMISSIONS_KEY,
  CLINICAL_AUDIT_ACTIONS,
} from '../clinical-permissions';

describe('Clinical Permissions', () => {
  describe('ClinicalResource enum', () => {
    it('should have all clinical resources defined', () => {
      expect(ClinicalResource.CLINICAL_CASE).toBe('clinical_case');
      expect(ClinicalResource.CLINICAL_ASSESSMENT).toBe('clinical_assessment');
      expect(ClinicalResource.CLINICAL_REFERRAL).toBe('clinical_referral');
      expect(ClinicalResource.CLINICAL_INTERVENTION).toBe('clinical_intervention');
      expect(ClinicalResource.CLINICAL_SESSION).toBe('clinical_session');
      expect(ClinicalResource.CLINICAL_EXPORT).toBe('clinical_export');
      expect(ClinicalResource.CLINICAL_CRISIS).toBe('clinical_crisis');
      expect(ClinicalResource.CLINICAL_CONFIG).toBe('clinical_config');
    });
  });

  describe('ClinicalAction enum', () => {
    it('should have all clinical actions defined', () => {
      expect(ClinicalAction.VIEW).toBe('view');
      expect(ClinicalAction.VIEW_SENSITIVE).toBe('view_sensitive');
      expect(ClinicalAction.VIEW_FULL).toBe('view_full');
      expect(ClinicalAction.CREATE).toBe('create');
      expect(ClinicalAction.UPDATE).toBe('update');
      expect(ClinicalAction.CLOSE).toBe('close');
      expect(ClinicalAction.DELETE).toBe('delete');
      expect(ClinicalAction.EXPORT).toBe('export');
      expect(ClinicalAction.MANAGE_REFERRALS).toBe('manage_referrals');
      expect(ClinicalAction.MANAGE_TREATMENT).toBe('manage_treatment');
      expect(ClinicalAction.DOCUMENT_SESSION).toBe('document_session');
      expect(ClinicalAction.MANAGE_CRISIS).toBe('manage_crisis');
      expect(ClinicalAction.CONFIGURE).toBe('configure');
      expect(ClinicalAction.VIEW_ANALYTICS).toBe('view_analytics');
      expect(ClinicalAction.SUPERVISE).toBe('supervise');
    });
  });

  describe('CLINICAL_PERMISSIONS', () => {
    it('should have permissions for all resources', () => {
      const resources = new Set(CLINICAL_PERMISSIONS.map((p) => p.resource));
      expect(resources.has(ClinicalResource.CLINICAL_CASE)).toBe(true);
      expect(resources.has(ClinicalResource.CLINICAL_ASSESSMENT)).toBe(true);
      expect(resources.has(ClinicalResource.CLINICAL_REFERRAL)).toBe(true);
      expect(resources.has(ClinicalResource.CLINICAL_INTERVENTION)).toBe(true);
      expect(resources.has(ClinicalResource.CLINICAL_SESSION)).toBe(true);
      expect(resources.has(ClinicalResource.CLINICAL_EXPORT)).toBe(true);
      expect(resources.has(ClinicalResource.CLINICAL_CRISIS)).toBe(true);
      expect(resources.has(ClinicalResource.CLINICAL_CONFIG)).toBe(true);
    });

    it('should have correct sensitivity levels', () => {
      const levels = new Set(CLINICAL_PERMISSIONS.map((p) => p.sensitivityLevel));
      expect(levels.has('low')).toBe(true);
      expect(levels.has('medium')).toBe(true);
      expect(levels.has('high')).toBe(true);
      expect(levels.has('critical')).toBe(true);
    });

    it('should have critical sensitivity for sensitive operations', () => {
      const deletePerm = CLINICAL_PERMISSIONS.find(
        (p) => p.resource === ClinicalResource.CLINICAL_CASE && p.action === ClinicalAction.DELETE
      );
      expect(deletePerm?.sensitivityLevel).toBe('critical');

      const viewSensitive = CLINICAL_PERMISSIONS.find(
        (p) => p.resource === ClinicalResource.CLINICAL_ASSESSMENT && p.action === ClinicalAction.VIEW_SENSITIVE
      );
      expect(viewSensitive?.sensitivityLevel).toBe('critical');
    });

    it('should require credential check for sensitive operations', () => {
      const createCase = CLINICAL_PERMISSIONS.find(
        (p) => p.resource === ClinicalResource.CLINICAL_CASE && p.action === ClinicalAction.CREATE
      );
      expect(createCase?.requiresCredentialCheck).toBe(true);
    });

    it('should require consent check for data access operations', () => {
      const viewSensitive = CLINICAL_PERMISSIONS.find(
        (p) => p.resource === ClinicalResource.CLINICAL_CASE && p.action === ClinicalAction.VIEW_SENSITIVE
      );
      expect(viewSensitive?.requiresConsentCheck).toBe(true);
    });

    it('should require audit for most operations', () => {
      const auditRequired = CLINICAL_PERMISSIONS.filter((p) => p.auditRequired);
      expect(auditRequired.length).toBeGreaterThan(15);
    });
  });

  describe('CLINICAL_ROLE_PERMISSIONS', () => {
    it('should have permissions for all major roles', () => {
      const roles = CLINICAL_ROLE_PERMISSIONS.map((rp) => rp.role);
      expect(roles).toContain('SUPER_ADMIN');
      expect(roles).toContain('PSICOLOGO');
      expect(roles).toContain('PSICOLOGO_SUPERVISOR');
      expect(roles).toContain('DIRECTOR');
      expect(roles).toContain('COORDINATOR');
      expect(roles).toContain('TEACHER');
      expect(roles).toContain('PARENT');
      expect(roles).toContain('STUDENT');
      expect(roles).toContain('ANALYST');
      expect(roles).toContain('ORG_ADMIN');
      expect(roles).toContain('SUPPORT');
      expect(roles).toContain('GUEST');
    });

    it('should give STUDENT no clinical permissions', () => {
      const studentPerms = CLINICAL_ROLE_PERMISSIONS.find((rp) => rp.role === 'STUDENT');
      expect(studentPerms?.permissions).toHaveLength(0);
    });

    it('should give GUEST no clinical permissions', () => {
      const guestPerms = CLINICAL_ROLE_PERMISSIONS.find((rp) => rp.role === 'GUEST');
      expect(guestPerms?.permissions).toHaveLength(0);
    });

    it('should give PSICOLOGO full case management for assigned cases', () => {
      const psicologoPerms = CLINICAL_ROLE_PERMISSIONS.find((rp) => rp.role === 'PSICOLOGO');
      expect(psicologoPerms?.permissions.some(
        (p) => p.resource === ClinicalResource.CLINICAL_CASE && p.action === ClinicalAction.CREATE
      )).toBe(true);
      expect(psicologoPerms?.permissions.some(
        (p) => p.resource === ClinicalResource.CLINICAL_CASE && p.action === ClinicalAction.UPDATE
      )).toBe(true);
    });

    it('should give PSICOLOGO_SUPERVISOR supervision permissions', () => {
      const supervisorPerms = CLINICAL_ROLE_PERMISSIONS.find((rp) => rp.role === 'PSICOLOGO_SUPERVISOR');
      expect(supervisorPerms?.permissions.some(
        (p) => p.action === ClinicalAction.SUPERVISE
      )).toBe(true);
    });

    it('should give TEACHER only referral permissions', () => {
      const teacherPerms = CLINICAL_ROLE_PERMISSIONS.find((rp) => rp.role === 'TEACHER');
      expect(teacherPerms?.permissions.every(
        (p) => p.resource === ClinicalResource.CLINICAL_REFERRAL ||
               p.resource === ClinicalResource.CLINICAL_CASE
      )).toBe(true);
    });

    it('should give PARENT export permission for LGPD compliance', () => {
      const parentPerms = CLINICAL_ROLE_PERMISSIONS.find((rp) => rp.role === 'PARENT');
      expect(parentPerms?.permissions.some(
        (p) => p.resource === ClinicalResource.CLINICAL_EXPORT && p.action === ClinicalAction.EXPORT
      )).toBe(true);
    });
  });

  describe('isValidCRPFormat', () => {
    it('should validate correct CRP format', () => {
      expect(isValidCRPFormat('01/123456')).toBe(true);
      expect(isValidCRPFormat('24/999999')).toBe(true);
      expect(isValidCRPFormat('06/000001')).toBe(true);
    });

    it('should reject invalid CRP format', () => {
      expect(isValidCRPFormat('123456')).toBe(false);
      expect(isValidCRPFormat('1/123456')).toBe(false);
      expect(isValidCRPFormat('01-123456')).toBe(false);
      expect(isValidCRPFormat('01/12345')).toBe(false);
      expect(isValidCRPFormat('01/1234567')).toBe(false);
      expect(isValidCRPFormat('25/123456')).toBe(false);
      expect(isValidCRPFormat('00/123456')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(isValidCRPFormat('')).toBe(false);
    });
  });

  describe('extractCRPRegion', () => {
    it('should extract region from valid CRP', () => {
      expect(extractCRPRegion('01/123456')).toBe('01');
      expect(extractCRPRegion('24/999999')).toBe('24');
      expect(extractCRPRegion('06/000001')).toBe('06');
    });

    it('should return null for invalid CRP', () => {
      expect(extractCRPRegion('123456')).toBeNull();
      expect(extractCRPRegion('')).toBeNull();
    });
  });

  describe('hasClinicalPermission', () => {
    it('should return true for valid permission', () => {
      expect(hasClinicalPermission(
        'PSICOLOGO',
        ClinicalResource.CLINICAL_CASE,
        ClinicalAction.CREATE,
        'school'
      )).toBe(true);
    });

    it('should return false for non-existent role', () => {
      expect(hasClinicalPermission(
        'NON_EXISTENT',
        ClinicalResource.CLINICAL_CASE,
        ClinicalAction.CREATE,
        'school'
      )).toBe(false);
    });

    it('should return false for insufficient scope', () => {
      expect(hasClinicalPermission(
        'TEACHER',
        ClinicalResource.CLINICAL_CASE,
        ClinicalAction.VIEW,
        'all'
      )).toBe(false);
    });

    it('should return true for higher scope permission', () => {
      expect(hasClinicalPermission(
        'PSICOLOGO_SUPERVISOR',
        ClinicalResource.CLINICAL_CASE,
        ClinicalAction.VIEW,
        'school'
      )).toBe(true);
    });
  });

  describe('getClinicalPermissionsForRole', () => {
    it('should return permissions for valid role', () => {
      const perms = getClinicalPermissionsForRole('PSICOLOGO');
      expect(perms.length).toBeGreaterThan(10);
    });

    it('should return empty array for non-existent role', () => {
      const perms = getClinicalPermissionsForRole('NON_EXISTENT');
      expect(perms).toHaveLength(0);
    });

    it('should return empty array for STUDENT', () => {
      const perms = getClinicalPermissionsForRole('STUDENT');
      expect(perms).toHaveLength(0);
    });
  });

  describe('getClinicalPermissionsBySensitivity', () => {
    it('should filter by low sensitivity', () => {
      const perms = getClinicalPermissionsBySensitivity('low');
      expect(perms.every((p) => p.sensitivityLevel === 'low')).toBe(true);
    });

    it('should filter by critical sensitivity', () => {
      const perms = getClinicalPermissionsBySensitivity('critical');
      expect(perms.every((p) => p.sensitivityLevel === 'critical')).toBe(true);
      expect(perms.length).toBeGreaterThan(0);
    });
  });

  describe('getClinicalPermissionsForResource', () => {
    it('should return permissions for clinical_case', () => {
      const perms = getClinicalPermissionsForResource(ClinicalResource.CLINICAL_CASE);
      expect(perms.every((p) => p.resource === ClinicalResource.CLINICAL_CASE)).toBe(true);
      expect(perms.length).toBeGreaterThan(5);
    });

    it('should return permissions for clinical_export', () => {
      const perms = getClinicalPermissionsForResource(ClinicalResource.CLINICAL_EXPORT);
      expect(perms).toHaveLength(1);
      expect(perms[0]?.action).toBe(ClinicalAction.EXPORT);
    });
  });

  describe('requiresCredentialCheck', () => {
    it('should return true for sensitive clinical operations', () => {
      expect(requiresCredentialCheck(ClinicalResource.CLINICAL_CASE, ClinicalAction.CREATE)).toBe(true);
      expect(requiresCredentialCheck(ClinicalResource.CLINICAL_ASSESSMENT, ClinicalAction.VIEW_SENSITIVE)).toBe(true);
    });

    it('should return false for basic view operations', () => {
      expect(requiresCredentialCheck(ClinicalResource.CLINICAL_REFERRAL, ClinicalAction.VIEW)).toBe(false);
    });

    it('should return false for non-existent permission', () => {
      expect(requiresCredentialCheck(ClinicalResource.CLINICAL_CASE, 'non_existent' as any)).toBe(false);
    });
  });

  describe('requiresConsentCheck', () => {
    it('should return true for sensitive data access', () => {
      expect(requiresConsentCheck(ClinicalResource.CLINICAL_CASE, ClinicalAction.VIEW_SENSITIVE)).toBe(true);
      expect(requiresConsentCheck(ClinicalResource.CLINICAL_EXPORT, ClinicalAction.EXPORT)).toBe(true);
    });

    it('should return false for admin operations', () => {
      expect(requiresConsentCheck(ClinicalResource.CLINICAL_CONFIG, ClinicalAction.CONFIGURE)).toBe(false);
    });
  });

  describe('requiresClinicalAuditLog', () => {
    it('should return true for audit-required operations', () => {
      expect(requiresClinicalAuditLog(ClinicalResource.CLINICAL_CASE, ClinicalAction.CREATE)).toBe(true);
      expect(requiresClinicalAuditLog(ClinicalResource.CLINICAL_CASE, ClinicalAction.DELETE)).toBe(true);
    });

    it('should return false for non-audit operations', () => {
      expect(requiresClinicalAuditLog(ClinicalResource.CLINICAL_CONFIG, ClinicalAction.VIEW)).toBe(false);
    });
  });

  describe('getClinicalAuditRetention', () => {
    it('should return 5 years for standard operations', () => {
      expect(getClinicalAuditRetention(ClinicalResource.CLINICAL_CASE, ClinicalAction.CREATE)).toBe(5);
      expect(getClinicalAuditRetention(ClinicalResource.CLINICAL_ASSESSMENT, ClinicalAction.VIEW_SENSITIVE)).toBe(5);
    });

    it('should return 20 years for critical operations', () => {
      expect(getClinicalAuditRetention(ClinicalResource.CLINICAL_CASE, ClinicalAction.DELETE)).toBe(20);
      expect(getClinicalAuditRetention(ClinicalResource.CLINICAL_CRISIS, ClinicalAction.MANAGE_CRISIS)).toBe(20);
    });

    it('should return default 5 years for non-existent action', () => {
      expect(getClinicalAuditRetention(ClinicalResource.CLINICAL_CASE, 'non_existent' as any)).toBe(5);
    });
  });

  describe('CLINICAL_AUDIT_ACTIONS', () => {
    it('should have retention periods defined', () => {
      expect(CLINICAL_AUDIT_ACTIONS.every((a) => a.retentionYears > 0)).toBe(true);
    });

    it('should cover critical case operations', () => {
      expect(CLINICAL_AUDIT_ACTIONS.some(
        (a) => a.resource === ClinicalResource.CLINICAL_CASE && a.action === ClinicalAction.CREATE
      )).toBe(true);
      expect(CLINICAL_AUDIT_ACTIONS.some(
        (a) => a.resource === ClinicalResource.CLINICAL_CASE && a.action === ClinicalAction.DELETE
      )).toBe(true);
    });
  });

  describe('CLINICAL_PERMISSIONS_KEY', () => {
    it('should have correct value for NestJS decorators', () => {
      expect(CLINICAL_PERMISSIONS_KEY).toBe('clinical_permissions');
    });
  });

  describe('generateClinicalRLSSetupSQL', () => {
    it('should generate valid SQL', () => {
      const sql = generateClinicalRLSSetupSQL();

      expect(sql).toContain('ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('ALTER TABLE clinical_assessments ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE POLICY clinical_case_isolation');
      expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    });

    it('should include super admin bypass', () => {
      const sql = generateClinicalRLSSetupSQL();
      expect(sql).toContain("current_setting('app.role', true) = 'SUPER_ADMIN'");
    });

    it('should include psychologist isolation', () => {
      const sql = generateClinicalRLSSetupSQL();
      expect(sql).toContain('PSICOLOGO');
      expect(sql).toContain('assigned_psychologist_id');
    });

    it('should include parent access for their children', () => {
      const sql = generateClinicalRLSSetupSQL();
      expect(sql).toContain('PARENT');
      expect(sql).toContain('guardian_relationships');
    });
  });
});
