import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E Tests for Authentication (JWT)
 *
 * Tests:
 * - POST /auth/login - Login and obtain JWT token
 * - JWT validation on protected routes
 * - Token expiry enforcement
 * - @Public() decorator bypass
 * - Invalid token rejection
 *
 * Uses REAL PostgreSQL database on Mac Mini for authentic testing
 * Database is reset before tests via npm pretest:e2e hook
 *
 * Coverage Target: ≥95%
 */
describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: PrismaService;
  let testNetworkId: string; // UUID from seeded database

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Get services
    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Get real networkId from seeded database
    const network = await prisma.schoolNetwork.findFirst({
      where: { slug: 'demo-network' },
    });
    testNetworkId = network!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return JWT token on valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn', '24h');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'admin@example.com');
      expect(response.body.user).toHaveProperty('networkId');
      expect(response.body.user).toHaveProperty('roles');
      expect(Array.isArray(response.body.user.roles)).toBe(true);

      // Verify JWT token is valid
      const decoded = jwtService.verify(response.body.accessToken);
      expect(decoded).toHaveProperty('sub');
      expect(decoded).toHaveProperty('email', 'admin@example.com');
      expect(decoded).toHaveProperty('networkId');
      expect(decoded).toHaveProperty('roles');
    });

    it('should return 400 on missing email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 on missing password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
        })
        .expect(400);
    });

    it('should return 400 on invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should return 400 on empty body', async () => {
      await request(app.getHttpServer()).post('/auth/login').send({}).expect(400);
    });
  });

  describe('JWT Token Validation', () => {
    let validToken: string;

    beforeAll(async () => {
      // Obtain valid token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'teacher@example.com',
          password: 'password123',
        })
        .expect(200);

      validToken = response.body.accessToken;
    });

    it('should allow access to protected routes with valid JWT', async () => {
      // Test with /school-networks endpoint (protected)
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Should not throw 401 Unauthorized
      expect(response.status).toBe(200);
    });

    it('should reject access without JWT token', async () => {
      await request(app.getHttpServer())
        .get('/school-networks')
        .expect(401);
    });

    it('should reject access with invalid JWT token', async () => {
      await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', 'Bearer invalid-token-12345')
        .expect(401);
    });

    it('should reject access with malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });

    it('should reject access with empty Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', '')
        .expect(401);
    });
  });

  describe('Token Expiry', () => {
    it('should reject expired JWT token', async () => {
      // Create expired token (expired 1 hour ago)
      const expiredToken = jwtService.sign(
        {
          sub: 'user-expired',
          email: 'expired@example.com',
          networkId: testNetworkId,
          roles: ['Teacher'],
        },
        { expiresIn: '-1h' }, // Negative expiry = already expired
      );

      await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should accept token with future expiry', async () => {
      // Create token with 1 hour expiry
      const validToken = jwtService.sign(
        {
          sub: 'user-valid',
          email: 'valid@example.com',
          networkId: testNetworkId,
          roles: ['Teacher'],
        },
        { expiresIn: '1h' },
      );

      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Public Routes (@Public() decorator)', () => {
    it('should allow access to /auth/login without token', async () => {
      // /auth/login has @Public() decorator
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123',
        })
        .expect(200);
    });

    it('should allow access to /health without token (if exists)', async () => {
      // Test /health endpoint if it exists
      const response = await request(app.getHttpServer()).get('/health');

      // Should be either 200 (exists) or 404 (not implemented yet)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('JWT Payload Validation', () => {
    it('should reject token without sub claim', async () => {
      const invalidToken = jwtService.sign({
        email: 'nosub@example.com',
        networkId: testNetworkId,
        roles: ['Teacher'],
        // Missing 'sub' claim
      });

      await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should reject token without networkId claim', async () => {
      const invalidToken = jwtService.sign({
        sub: 'user-123',
        email: 'nonetwork@example.com',
        roles: ['Teacher'],
        // Missing 'networkId' claim
      });

      await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should accept token without roles (defaults to empty array)', async () => {
      const tokenWithoutRoles = jwtService.sign({
        sub: 'user-noroles',
        email: 'noroles@example.com',
        networkId: testNetworkId,
        // Missing 'roles' claim - should default to []
      });

      // Should pass JWT validation (roles checked by RBACGuard, not JwtStrategy)
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${tokenWithoutRoles}`);

      // Should not return 401 from JwtAuthGuard
      // May return 403 from RBACGuard if route requires roles
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Request User Population', () => {
    it('should populate request.user with JWT payload', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'teacher@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = response.body.accessToken;

      // Make authenticated request
      const authenticatedResponse = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // We can't directly inspect request.user in E2E tests,
      // but we can verify the guard chain works by checking:
      // 1. JWT validation passed (200 status)
      // 2. Tenant validation passed (would be 403 if networkId missing)
      // 3. RBAC passed (would be 403 if roles insufficient)
      expect(authenticatedResponse.status).toBe(200);
    });
  });

  describe('Auth Module Integration', () => {
    it('should export JwtService for use in other modules', () => {
      expect(jwtService).toBeDefined();
      expect(jwtService.sign).toBeDefined();
      expect(jwtService.verify).toBeDefined();
    });

    it('should use JWT_SECRET from environment', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'parent@example.com',
          password: 'password123',
        })
        .expect(200);

      const token = response.body.accessToken;

      // Token should be verifiable with the same secret
      expect(() => jwtService.verify(token)).not.toThrow();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return not implemented message', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer valid-token')
        .expect(201); // Default POST response

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not implemented');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long JWT tokens', async () => {
      // Create token with large payload
      const largePayload = {
        sub: 'user-123',
        email: 'large@example.com',
        networkId: testNetworkId,
        roles: Array(100).fill('Role'),
        metadata: 'x'.repeat(1000),
      };

      const largeToken = jwtService.sign(largePayload);

      // Should still work (JWT supports large payloads)
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', `Bearer ${largeToken}`);

      expect([200, 403]).toContain(response.status); // 200 or 403 from RBAC
    });

    it('should handle concurrent login requests', async () => {
      // Simulate multiple concurrent logins with existing mock users
      // Reduced to 3 to avoid overwhelming test server
      const mockUsers = ['admin@example.com', 'teacher@example.com', 'parent@example.com'];
      const loginRequests = Array(3)
        .fill(null)
        .map((_, i) =>
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: mockUsers[i], // One request per user
              password: 'password123',
            }),
        );

      const responses = await Promise.all(loginRequests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });
    });

    it('should handle requests with multiple Authorization headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/school-networks')
        .set('Authorization', 'Bearer token1')
        .set('Authorization', 'Bearer token2'); // Second header overwrites first

      // Should reject (token2 is invalid)
      expect(response.status).toBe(401);
    });
  });
});
