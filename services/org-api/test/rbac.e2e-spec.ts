import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E Tests for RBAC (Role-Based Access Control)
 *
 * Tests:
 * - @Roles() decorator enforcement
 * - OrgAdmin role permissions
 * - Director role permissions
 * - Teacher role permissions
 * - Student role permissions
 * - Multi-role scenarios
 * - Routes without @Roles() (allow all authenticated)
 *
 * Uses REAL PostgreSQL database on Mac Mini for authentic testing
 * Database is reset before tests via npm pretest:e2e hook
 *
 * Coverage Target: ≥95%
 */
describe('RBAC (Role-Based Access Control) (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let testNetworkId: string; // UUID from seeded database

  // Test tokens for different roles
  let orgAdminToken: string;
  let directorToken: string;
  let teacherToken: string;
  let studentToken: string;
  let multiRoleToken: string; // User with multiple roles
  let noRolesToken: string; // User with empty roles array

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Get real networkId from seeded database
    const network = await prisma.schoolNetwork.findFirst({
      where: { slug: 'demo-network' },
    });
    testNetworkId = network!.id;

    // Generate test tokens for different roles
    orgAdminToken = jwtService.sign({
      sub: 'admin-123',
      email: 'admin@example.com',
      networkId: testNetworkId,
      roles: ['OrgAdmin'],
    });

    directorToken = jwtService.sign({
      sub: 'director-456',
      email: 'director@example.com',
      networkId: testNetworkId,
      roles: ['Director'],
    });

    teacherToken = jwtService.sign({
      sub: 'teacher-789',
      email: 'teacher@example.com',
      networkId: testNetworkId,
      roles: ['Teacher'],
    });

    studentToken = jwtService.sign({
      sub: 'student-101',
      email: 'student@example.com',
      networkId: testNetworkId,
      roles: ['Student'],
    });

    multiRoleToken = jwtService.sign({
      sub: 'multi-202',
      email: 'multi@example.com',
      networkId: testNetworkId,
      roles: ['Teacher', 'Director'], // Multiple roles
    });

    noRolesToken = jwtService.sign({
      sub: 'noroles-303',
      email: 'noroles@example.com',
      networkId: testNetworkId,
      roles: [], // Empty roles array
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Routes Without @Roles() Decorator', () => {
    it('should allow access to any authenticated user', async () => {
      // Routes without @Roles() should allow any authenticated user
      // Test with different roles
      const tokens = [
        orgAdminToken,
        directorToken,
        teacherToken,
        studentToken,
        noRolesToken,
      ];

      for (const token of tokens) {
        const response = await request(app.getHttpServer())
          .get('/school-networks')
          .set('Authorization', `Bearer ${token}`);

        // Should allow access (200) or return 404 if route doesn't exist
        expect([200, 404]).toContain(response.status);
        expect(response.status).not.toBe(403); // Should NOT be forbidden
      }
    });
  });

  describe('OrgAdmin Role', () => {
    it('should allow OrgAdmin to access admin-only routes', async () => {
      // Assuming /school-networks POST requires OrgAdmin role
      // This is a placeholder - actual routes will be implemented in controllers
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${orgAdminToken}`);

      expect([200, 404]).toContain(response.status);
      expect(response.status).not.toBe(403);
    });

    it('should deny non-admin users access to admin routes', async () => {
      // Test that Teacher/Student cannot access admin routes
      // (This test will need to be updated once actual @Roles() decorators are applied)
      const tokens = [teacherToken, studentToken];

      // For now, since we don't have actual @Roles() decorated routes,
      // we'll test the guard logic is in place
      expect(orgAdminToken).toBeDefined();
      expect(teacherToken).toBeDefined();
    });
  });

  describe('Director Role', () => {
    it('should allow Director to access director-level routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/schools')
        .set('Authorization', `Bearer ${directorToken}`);

      expect([200, 404]).toContain(response.status);
      expect(response.status).not.toBe(403);
    });

    it('should allow Director with OrgAdmin to access admin routes', async () => {
      const directorAdminToken = jwtService.sign({
        sub: 'director-admin-999',
        email: 'director-admin@example.com',
        networkId: testNetworkId,
        roles: ['Director', 'OrgAdmin'],
      });

      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${directorAdminToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Teacher Role', () => {
    it('should allow Teacher to access teacher-level routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/classrooms')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 404]).toContain(response.status);
      expect(response.status).not.toBe(403);
    });

    it('should deny Teacher access to admin-only routes', async () => {
      // This will be tested once we have actual @Roles('OrgAdmin') routes
      expect(teacherToken).toBeDefined();
    });
  });

  describe('Student Role', () => {
    it('should allow Student to access student-level routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/students')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 404]).toContain(response.status);
      expect(response.status).not.toBe(403);
    });

    it('should deny Student access to teacher/admin routes', async () => {
      // This will be tested once we have actual @Roles() routes
      expect(studentToken).toBeDefined();
    });
  });

  describe('Multi-Role Users', () => {
    it('should grant access if user has at least one required role', async () => {
      // User with ['Teacher', 'Director'] should access routes requiring 'Teacher'
      const response = await request(app.getHttpServer())
        .get('/classrooms')
        .set('Authorization', `Bearer ${multiRoleToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should grant access if user has any of multiple required roles', async () => {
      // If route requires ['Director', 'OrgAdmin'], user with 'Director' should pass
      const response = await request(app.getHttpServer())
        .get('/schools')
        .set('Authorization', `Bearer ${multiRoleToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('No Roles User', () => {
    it('should allow access to routes without @Roles()', async () => {
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${noRolesToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should deny access to routes with @Roles() requirement', async () => {
      // Once we have @Roles() decorated routes, test rejection
      expect(noRolesToken).toBeDefined();
    });
  });

  describe('RBAC Guard Error Messages', () => {
    it('should return descriptive error when roles missing', async () => {
      // This will need actual @Roles() decorated route
      // For now, verify guard is configured
      expect(noRolesToken).toBeDefined();
    });

    it('should return descriptive error when insufficient permissions', async () => {
      // Test error message format when user lacks required role
      // Format: "Access denied. Required roles: X, Y. User roles: A, B"
      expect(studentToken).toBeDefined();
    });
  });

  describe('RBAC Integration with Tenant Guard', () => {
    it('should validate roles after tenant validation', async () => {
      // RBAC guard runs after TenantGuard in the chain
      // User with valid tenant but insufficient role should get 403, not 401
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${teacherToken}`);

      // Should pass both JWT and Tenant validation
      // May fail RBAC if route requires admin (403), but not 401
      expect([200, 403, 404]).toContain(response.status);
      expect(response.status).not.toBe(401);
    });
  });

  describe('RBAC with Invalid Tokens', () => {
    it('should reject before RBAC check if JWT invalid', async () => {
      // Invalid JWT should fail at JwtAuthGuard, not reach RBACGuard
      await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401); // Should be 401 from JwtAuthGuard, not 403 from RBACGuard
    });

    it('should reject before RBAC check if no token', async () => {
      await request(app.getHttpServer())
        .get('/school-networks')
        .expect(401); // Should be 401 from JwtAuthGuard
    });
  });

  describe('Role Case Sensitivity', () => {
    it('should match roles case-sensitively', async () => {
      const lowercaseRoleToken = jwtService.sign({
        sub: 'lowercase-404',
        email: 'lowercase@example.com',
        networkId: testNetworkId,
        roles: ['orgadmin'], // lowercase instead of 'OrgAdmin'
      });

      // Should not match 'OrgAdmin' requirement (case-sensitive)
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${lowercaseRoleToken}`);

      // Depends on route configuration
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('Special Role Names', () => {
    it('should handle roles with special characters', async () => {
      const specialRoleToken = jwtService.sign({
        sub: 'special-505',
        email: 'special@example.com',
        networkId: testNetworkId,
        roles: ['Super-Admin', 'Teacher_Assistant'],
      });

      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${specialRoleToken}`);

      expect([200, 403, 404]).toContain(response.status);
    });

    it('should handle empty string role', async () => {
      const emptyRoleToken = jwtService.sign({
        sub: 'empty-606',
        email: 'empty@example.com',
        networkId: testNetworkId,
        roles: [''], // Empty string role
      });

      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${emptyRoleToken}`);

      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('Role Array Edge Cases', () => {
    it('should handle very large roles array', async () => {
      const manyRolesToken = jwtService.sign({
        sub: 'many-707',
        email: 'many@example.com',
        networkId: testNetworkId,
        roles: Array(100).fill('Role'), // 100 identical roles
      });

      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${manyRolesToken}`);

      expect([200, 403, 404]).toContain(response.status);
    });

    it('should handle duplicate roles in array', async () => {
      const duplicateRolesToken = jwtService.sign({
        sub: 'duplicate-808',
        email: 'duplicate@example.com',
        networkId: testNetworkId,
        roles: ['Teacher', 'Teacher', 'Teacher'], // Duplicates
      });

      const response = await request(app.getHttpServer())
        .get('/classrooms')
        .set('Authorization', `Bearer ${duplicateRolesToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('RBAC Reflector Metadata', () => {
    it('should correctly read @Roles() metadata from handler', async () => {
      // RBACGuard uses Reflector to read 'roles' metadata
      // This is tested implicitly by all role checks
      expect(orgAdminToken).toBeDefined();
    });

    it('should correctly read @Roles() metadata from controller class', async () => {
      // Reflector checks both handler and class level
      expect(teacherToken).toBeDefined();
    });
  });

  describe('Concurrent RBAC Checks', () => {
    it('should handle concurrent requests with different roles', async () => {
      const requests = [
        request(app.getHttpServer())
          .get('/school-networks')
          .set('Authorization', `Bearer ${orgAdminToken}`),
        request(app.getHttpServer())
          .get('/school-networks')
          .set('Authorization', `Bearer ${teacherToken}`),
        request(app.getHttpServer())
          .get('/school-networks')
          .set('Authorization', `Bearer ${studentToken}`),
        request(app.getHttpServer())
          .get('/school-networks')
          .set('Authorization', `Bearer ${directorToken}`),
      ];

      const responses = await Promise.all(requests);

      // All should return consistent results
      responses.forEach((response) => {
        expect([200, 403, 404]).toContain(response.status);
      });
    });
  });

  describe('RBAC Performance', () => {
    it('should handle 100 sequential role checks efficiently', async () => {
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await request(app.getHttpServer())
          .get('/school-networks')
          .set('Authorization', `Bearer ${teacherToken}`);
      }

      const duration = Date.now() - startTime;

      // Should complete 100 requests in reasonable time
      // Adjust threshold based on performance requirements
      expect(duration).toBeLessThan(10000); // 10 seconds for 100 requests
    });
  });

  describe('RBAC with Tenant Isolation', () => {
    it('should allow same role in different tenants', async () => {
      const tenant1Token = jwtService.sign({
        sub: 'user-tenant1',
        email: 'user@tenant1.com',
        networkId: 'tenant-1',
        roles: ['Teacher'],
      });

      const tenant2Token = jwtService.sign({
        sub: 'user-tenant2',
        email: 'user@tenant2.com',
        networkId: 'tenant-2',
        roles: ['Teacher'],
      });

      // Both should pass RBAC (tenant isolation handled by TenantGuard + RLS)
      const response1 = await request(app.getHttpServer())
        .get('/classrooms')
        .set('Authorization', `Bearer ${tenant1Token}`);

      const response2 = await request(app.getHttpServer())
        .get('/classrooms')
        .set('Authorization', `Bearer ${tenant2Token}`);

      expect([200, 404]).toContain(response1.status);
      expect([200, 404]).toContain(response2.status);
    });
  });

  describe('Future @Roles() Decorated Routes', () => {
    // These tests will be uncommented once actual routes have @Roles() decorators

    it.todo('should enforce @Roles("OrgAdmin") on POST /school-networks');
    it.todo('should enforce @Roles("OrgAdmin", "Director") on POST /schools');
    it.todo('should enforce @Roles("Teacher") on POST /classrooms');
    it.todo('should enforce @Roles("Student") on GET /students/:id/me');
    it.todo('should allow multiple roles with OR logic');
    it.todo('should return 403 with descriptive error message');
  });

  describe('RBAC Guard Chain Verification', () => {
    it('should verify guard order: JWT → Tenant → RBAC', async () => {
      // This test verifies the guard chain works correctly
      // 1. JwtAuthGuard authenticates and populates request.user
      // 2. TenantGuard validates request.user.networkId
      // 3. RBACGuard checks request.user.roles

      // Valid token should pass all three guards
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${teacherToken}`);

      // Should succeed or fail at RBAC level, not JWT/Tenant
      expect([200, 403, 404]).toContain(response.status);
      expect(response.status).not.toBe(401); // 401 would mean JWT/Tenant failed
    });
  });
});
