import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Mock PrismaService for E2E tests
 *
 * Provides a minimal implementation that doesn't require a database connection
 * Allows testing of authentication and authorization logic without DB
 */
export class MockPrismaService {
  // Mock database connection methods
  async $connect() {
    return Promise.resolve();
  }

  async $disconnect() {
    return Promise.resolve();
  }

  // Mock query methods (return empty results)
  async $queryRaw(...args: any[]) {
    return Promise.resolve([]);
  }

  async $executeRaw(...args: any[]) {
    return Promise.resolve(0);
  }

  // Mock the $use middleware (does nothing in tests)
  // Returns void to match Prisma's $use signature
  $use = (middleware: any): void => {
    // No-op in tests - middleware is not executed
    return undefined as void;
  };

  // Mock entity methods (can be extended as needed)
  schoolNetwork = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => data.data,
    update: async (data: any) => data.data,
    delete: async () => ({}),
  };

  school = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => data.data,
    update: async (data: any) => data.data,
    delete: async () => ({}),
  };

  grade = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => data.data,
    update: async (data: any) => data.data,
    delete: async () => ({}),
  };

  classroom = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => data.data,
    update: async (data: any) => data.data,
    delete: async () => ({}),
  };

  student = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => data.data,
    update: async (data: any) => data.data,
    delete: async () => ({}),
  };

  teacher = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => data.data,
    update: async (data: any) => data.data,
    delete: async () => ({}),
  };

  // Mock user entity for authentication
  user = {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => data.data,
    update: async (data: any) => data.data,
    delete: async () => ({}),
  };
}

/**
 * Factory function to create mock PrismaService provider
 * Usage in test:
 *
 * ```typescript
 * const moduleFixture = await Test.createTestingModule({
 *   imports: [AppModule],
 * })
 * .overrideProvider(PrismaService)
 * .useValue(createMockPrismaService())
 * .compile();
 * ```
 */
export function createMockPrismaService(): MockPrismaService {
  return new MockPrismaService();
}
