/**
 * Clinical Permissions Tests
 *
 * Tests for PSICOLOGO role, clinical data access, and RLS policies.
 *
 * @module @organizoptera/org-api/rbac/__tests__/clinical-permissions
 */

import { describe, it, expect } from 'vitest';
import {
  ClinicalResource,
  ClinicalAction,
  CLINICAL_PERMISSIONS,
  CLINICAL_ROLE_PERMISSIONS,
  hasClinicalPermission,
  getClinicalPermissionsForRole,
  getClinicalPermissionsBySensitivity,
  getClinicalPermissionsForResource,
  requiresCredentialCheck,
  requiresConsentCheck,
  requiresClinicalAuditLog,
  getClinicalAuditRetention,
  isValidCRPFormat,
  extractCRPRegion,
  generateClinicalRLSSetupSQL,
} from '../clinical-permissions';

describe('Clinical Permissions', () => {
  describe('ClinicalResource enum', () => {
    it('should have all required clinical resources', () => {
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
    it('should have all required clinical actions', () => {
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
    it('should have permissions defined for all resources', () => {
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

    it('should mark sensitive permissions correctly', () => {
      const criticalPermissions = CLINICAL_PERMISSIONS.filter(
        (p) => p.sensitivityLevel === 'critical'
      );

      // VIEW_FULL, VIEW_SENSITIVE for assessments, DELETE, EXPORT, MANAGE_TREATMENT, etc.
      expect(criticalPermissions.length).toBeGreaterThan(0);

      // All critical permissions should require audit
      for (const permission of criticalPermissions) {
        expect(permission.auditRequired).toBe(true);
      }
    });

    it('should require credential check for clinical data access', () => {
      const credentialRequired = CLINICAL_PERMISSIONS.filter(
        (p) => p.requiresCredentialCheck
      );

      // Actions like VIEW_SENSITIVE, VIEW_FULL, CREATE, MANAGE_TREATMENT should require credentials
      expect(credentialRequired.length).toBeGreaterThan(0);
    });

    it('should require consent check for sensitive data access', () => {
      const consentRequired = CLINICAL_PERMISSIONS.filter(
        (p) => p.requiresConsentCheck
      );

      // Actions like VIEW_SENSITIVE, CREATE, EXPORT should require consent
      expect(consentRequired.length).toBeGreaterThan(0);
    });
  });

  describe('CLINICAL_ROLE_PERMISSIONS', () => {
    it('should define PSICOLOGO role', () => {
      const psicologoRole = CLINICAL_ROLE_PERMISSIONS.find(
        (r) => r.role === 'PSICOLOGO'
      );

      expect(psicologoRole).toBeDefined();
      expect(psicologoRole!.permissions.length).toBeGreaterThan(0);
    });

    it('should define PSICOLOGO_SUPERVISOR role', () => {
      const supervisorRole = CLINICAL_ROLE_PERMISSIONS.find(
        (r) => r.role === 'PSICOLOGO_SUPERVISOR'
      );

      expect(supervisorRole).toBeDefined();
      expect(supervisorRole!.permissions.length).toBeGreaterThan(0);

      // Supervisor should have SUPERVISE permission
      const hasSupervise = supervisorRole!.permissions.some(
        (p) => p.action === ClinicalAction.SUPERVISE
      );
      expect(hasSupervise).toBe(true);
    });

    it('should give PSICOLOGO access to assigned cases only', () => {
      const psicologoRole = CLINICAL_ROLE_PERMISSIONS.find(
        (r) => r.role === 'PSICOLOGO'
      );

      const caseViewPermission = psicologoRole!.permissions.find(
        (p) =>
          p.resource === ClinicalResource.CLINICAL_CASE &&
          p.action === ClinicalAction.VIEW
      );

      expect(caseViewPermission).toBeDefined();
      expect(caseViewPermission!.scope).toBe('assigned');
    });

    it('should give PSICOLOGO_SUPERVISOR access to org-level cases', () => {
      const supervisorRole = CLINICAL_ROLE_PERMISSIONS.find(
        (r) => r.role === 'PSICOLOGO_SUPERVISOR'
      );

      const caseViewPermission = supervisorRole!.permissions.find(
        (p) =>
          p.resource === ClinicalResource.CLINICAL_CASE &&
          p.action === ClinicalAction.VIEW
      );

      expect(caseViewPermission).toBeDefined();
      expect(caseViewPermission!.scope).toBe('org');
    });

    it('should not give STUDENT clinical access', () => {
      const studentRole = CLINICAL_ROLE_PERMISSIONS.find(
        (r) => r.role === 'STUDENT'
      );

      expect(studentRole).toBeDefined();
      expect(studentRole!.permissions).toHaveLength(0);
    });

    it('should give TEACHER ability to create referrals', () => {
      const teacherRole = CLINICAL_ROLE_PERMISSIONS.find(
        (r) => r.role === 'TEACHER'
      );

      const referralCreate = teacherRole!.permissions.find(
        (p) =>
          p.resource === ClinicalResource.CLINICAL_REFERRAL &&
          p.action === ClinicalAction.CREATE
      );

      expect(referralCreate).toBeDefined();
      expect(referralCreate!.scope).toBe('own');
    });

    it('should give PARENT limited access to their child case', () => {
      const parentRole = CLINICAL_ROLE_PERMISSIONS.find(
        (r) => r.role === 'PARENT'
      );

      expect(parentRole).toBeDefined();

      // Parent can view case
      const caseView = parentRole!.permissions.find(
        (p) =>
          p.resource === ClinicalResource.CLINICAL_CASE &&
          p.action === ClinicalAction.VIEW
      );
      expect(caseView).toBeDefined();
      expect(caseView!.scope).toBe('own');

      // Parent can export their child's data (LGPD Art. 18)
      const exportPermission = parentRole!.permissions.find(
        (p) =>
          p.resource === ClinicalResource.CLINICAL_EXPORT &&
          p.action === ClinicalAction.EXPORT
      );
      expect(exportPermission).toBeDefined();
    });

    it('should not give DIRECTOR access to sensitive clinical data', () => {
      const directorRole = CLINICAL_ROLE_PERMISSIONS.find(
        (r) => r.role === 'DIRECTOR'
      );

      const hasSensitiveAccess = directorRole!.permissions.some(
        (p) => p.action === ClinicalAction.VIEW_SENSITIVE
      );

      expect(hasSensitiveAccess).toBe(false);
    });
  });

  describe('hasClinicalPermission', () => {
    it('should return true for PSICOLOGO viewing assigned cases', () => {
      expect(
        hasClinicalPermission(
          'PSICOLOGO',
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.VIEW,
          'assigned'
        )
      ).toBe(true);
    });

    it('should return false for PSICOLOGO viewing org-level cases', () => {
      expect(
        hasClinicalPermission(
          'PSICOLOGO',
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.VIEW,
          'org'
        )
      ).toBe(false);
    });

    it('should return true for PSICOLOGO_SUPERVISOR viewing org-level cases', () => {
      expect(
        hasClinicalPermission(
          'PSICOLOGO_SUPERVISOR',
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.VIEW,
          'org'
        )
      ).toBe(true);
    });

    it('should return false for STUDENT for any clinical permission', () => {
      expect(
        hasClinicalPermission(
          'STUDENT',
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.VIEW,
          'own'
        )
      ).toBe(false);
    });

    it('should return false for unknown role', () => {
      expect(
        hasClinicalPermission(
          'UNKNOWN_ROLE',
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.VIEW,
          'own'
        )
      ).toBe(false);
    });
  });

  describe('getClinicalPermissionsForRole', () => {
    it('should return permissions for PSICOLOGO', () => {
      const permissions = getClinicalPermissionsForRole('PSICOLOGO');
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown role', () => {
      const permissions = getClinicalPermissionsForRole('UNKNOWN_ROLE');
      expect(permissions).toEqual([]);
    });
  });

  describe('getClinicalPermissionsBySensitivity', () => {
    it('should return critical permissions', () => {
      const criticalPerms = getClinicalPermissionsBySensitivity('critical');
      expect(criticalPerms.length).toBeGreaterThan(0);

      for (const perm of criticalPerms) {
        expect(perm.sensitivityLevel).toBe('critical');
      }
    });

    it('should return low sensitivity permissions', () => {
      const lowPerms = getClinicalPermissionsBySensitivity('low');
      expect(lowPerms.length).toBeGreaterThan(0);

      for (const perm of lowPerms) {
        expect(perm.sensitivityLevel).toBe('low');
      }
    });
  });

  describe('getClinicalPermissionsForResource', () => {
    it('should return permissions for CLINICAL_CASE', () => {
      const casePerms = getClinicalPermissionsForResource(
        ClinicalResource.CLINICAL_CASE
      );

      expect(casePerms.length).toBeGreaterThan(0);

      for (const perm of casePerms) {
        expect(perm.resource).toBe(ClinicalResource.CLINICAL_CASE);
      }
    });
  });

  describe('requiresCredentialCheck', () => {
    it('should return true for VIEW_SENSITIVE on assessments', () => {
      expect(
        requiresCredentialCheck(
          ClinicalResource.CLINICAL_ASSESSMENT,
          ClinicalAction.VIEW_SENSITIVE
        )
      ).toBe(true);
    });

    it('should return true for MANAGE_TREATMENT', () => {
      expect(
        requiresCredentialCheck(
          ClinicalResource.CLINICAL_INTERVENTION,
          ClinicalAction.MANAGE_TREATMENT
        )
      ).toBe(true);
    });

    it('should return false for VIEW on config', () => {
      expect(
        requiresCredentialCheck(
          ClinicalResource.CLINICAL_CONFIG,
          ClinicalAction.VIEW
        )
      ).toBe(false);
    });
  });

  describe('requiresConsentCheck', () => {
    it('should return true for CREATE on cases', () => {
      expect(
        requiresConsentCheck(
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.CREATE
        )
      ).toBe(true);
    });

    it('should return true for EXPORT', () => {
      expect(
        requiresConsentCheck(
          ClinicalResource.CLINICAL_EXPORT,
          ClinicalAction.EXPORT
        )
      ).toBe(true);
    });
  });

  describe('Audit requirements', () => {
    it('should require audit for all sensitive actions', () => {
      expect(
        requiresClinicalAuditLog(
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.VIEW_SENSITIVE
        )
      ).toBe(true);

      expect(
        requiresClinicalAuditLog(
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.CREATE
        )
      ).toBe(true);

      expect(
        requiresClinicalAuditLog(
          ClinicalResource.CLINICAL_CRISIS,
          ClinicalAction.MANAGE_CRISIS
        )
      ).toBe(true);
    });

    it('should have 5-year minimum retention for most actions', () => {
      expect(
        getClinicalAuditRetention(
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.CREATE
        )
      ).toBe(5);
    });

    it('should have 20-year retention for crisis and delete actions', () => {
      expect(
        getClinicalAuditRetention(
          ClinicalResource.CLINICAL_CRISIS,
          ClinicalAction.MANAGE_CRISIS
        )
      ).toBe(20);

      expect(
        getClinicalAuditRetention(
          ClinicalResource.CLINICAL_CASE,
          ClinicalAction.DELETE
        )
      ).toBe(20);
    });
  });

  describe('CRP Credential Validation', () => {
    describe('isValidCRPFormat', () => {
      it('should accept valid CRP formats', () => {
        expect(isValidCRPFormat('06/123456')).toBe(true); // São Paulo
        expect(isValidCRPFormat('01/999999')).toBe(true); // Amazonas
        expect(isValidCRPFormat('24/000001')).toBe(true); // Mato Grosso do Sul
      });

      it('should reject invalid CRP formats', () => {
        expect(isValidCRPFormat('6/123456')).toBe(false); // Missing leading zero
        expect(isValidCRPFormat('06123456')).toBe(false); // Missing slash
        expect(isValidCRPFormat('00/123456')).toBe(false); // Invalid region (00)
        expect(isValidCRPFormat('25/123456')).toBe(false); // Invalid region (25+)
        expect(isValidCRPFormat('06/12345')).toBe(false); // Only 5 digits
        expect(isValidCRPFormat('06/1234567')).toBe(false); // 7 digits
        expect(isValidCRPFormat('')).toBe(false); // Empty string
        expect(isValidCRPFormat('abc/defghi')).toBe(false); // Non-numeric
      });
    });

    describe('extractCRPRegion', () => {
      it('should extract region from valid CRP', () => {
        expect(extractCRPRegion('06/123456')).toBe('06');
        expect(extractCRPRegion('01/999999')).toBe('01');
        expect(extractCRPRegion('24/000001')).toBe('24');
      });

      it('should return null for invalid format', () => {
        expect(extractCRPRegion('invalid')).toBeNull();
        expect(extractCRPRegion('')).toBeNull();
      });
    });
  });

  describe('RLS Policy Generation', () => {
    it('should generate valid SQL for RLS setup', () => {
      const sql = generateClinicalRLSSetupSQL();

      // Check that SQL contains required statements
      expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
      expect(sql).toContain('CREATE POLICY clinical_case_isolation');
      expect(sql).toContain('CREATE POLICY clinical_assessment_isolation');
      expect(sql).toContain('CREATE POLICY clinical_session_isolation');
      expect(sql).toContain('CREATE POLICY clinical_crisis_isolation');
      expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    });

    it('should include role checks in RLS policies', () => {
      const sql = generateClinicalRLSSetupSQL();

      expect(sql).toContain("'PSICOLOGO'");
      expect(sql).toContain("'PSICOLOGO_SUPERVISOR'");
      expect(sql).toContain("'SUPER_ADMIN'");
      expect(sql).toContain("'DIRECTOR'");
      expect(sql).toContain("'COORDINATOR'");
      expect(sql).toContain("'PARENT'");
    });

    it('should include tenant isolation in RLS policies', () => {
      const sql = generateClinicalRLSSetupSQL();

      expect(sql).toContain("current_setting('app.org_id'");
      expect(sql).toContain("current_setting('app.user_id'");
      expect(sql).toContain("current_setting('app.role'");
    });
  });
});
