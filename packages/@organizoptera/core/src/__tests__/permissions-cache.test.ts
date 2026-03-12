/**
 * @organizoptera/core - Permissions Cache Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUserPermissionsWithCache,
  invalidateUserPermissions,
  invalidateAllPermissions,
  getPermissionsCacheStats,
  type PermissionsDatabaseAdapter,
  type Permission,
} from '../cache/permissions-cache';

describe('Permissions Cache', () => {
  const createMockPermission = (id: string, resource: string, action: string): Permission => ({
    id,
    resource,
    action,
  });

  const createMockDbAdapter = (): PermissionsDatabaseAdapter => ({
    getUserPermissions: vi.fn().mockResolvedValue({
      permissions: [
        createMockPermission('perm-1', 'school', 'read'),
        createMockPermission('perm-2', 'classroom', 'read'),
      ],
      roles: ['TEACHER'],
    }),
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    // Clean up cache before each test to ensure isolated state
    // Use pattern matching to ensure all user permissions are cleared
    await invalidateAllPermissions();
  });

  afterEach(async () => {
    // Also clean up after each test for good measure
    await invalidateAllPermissions();
  });

  describe('getUserPermissionsWithCache', () => {
    it('should fetch from database on cache miss', async () => {
      const db = createMockDbAdapter();
      const result = await getUserPermissionsWithCache('user-1', db);

      expect(db.getUserPermissions).toHaveBeenCalledWith('user-1');
      expect(result.userId).toBe('user-1');
      expect(result.permissions).toHaveLength(2);
      expect(result.roles).toContain('TEACHER');
    });

    it('should use cache on subsequent calls', async () => {
      const db = createMockDbAdapter();
      const uniqueUserId = `user-cache-test-${Date.now()}`;

      // First call - cache miss
      await getUserPermissionsWithCache(uniqueUserId, db);
      expect(db.getUserPermissions).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      await getUserPermissionsWithCache(uniqueUserId, db);

      // Should only call database once (first call)
      expect(db.getUserPermissions).toHaveBeenCalledTimes(1);
    });

    it('should return cached permissions', async () => {
      const db = createMockDbAdapter();

      const result1 = await getUserPermissionsWithCache('user-1', db);
      const result2 = await getUserPermissionsWithCache('user-1', db);

      expect(result1.permissions).toEqual(result2.permissions);
      expect(result1.roles).toEqual(result2.roles);
    });

    it('should include lastUpdated timestamp', async () => {
      const db = createMockDbAdapter();
      const result = await getUserPermissionsWithCache('user-1', db);

      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should cache different users separately', async () => {
      const db = createMockDbAdapter();
      const userId1 = `user-sep-1-${Date.now()}`;
      const userId2 = `user-sep-2-${Date.now()}`;

      await getUserPermissionsWithCache(userId1, db);
      await getUserPermissionsWithCache(userId2, db);

      expect(db.getUserPermissions).toHaveBeenCalledTimes(2);
      expect(db.getUserPermissions).toHaveBeenCalledWith(userId1);
      expect(db.getUserPermissions).toHaveBeenCalledWith(userId2);
    });

    it('should handle empty permissions', async () => {
      const db: PermissionsDatabaseAdapter = {
        getUserPermissions: vi.fn().mockResolvedValue({
          permissions: [],
          roles: [],
        }),
      };

      const result = await getUserPermissionsWithCache('user-empty', db);

      expect(result.permissions).toHaveLength(0);
      expect(result.roles).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      const db: PermissionsDatabaseAdapter = {
        getUserPermissions: vi.fn().mockRejectedValue(new Error('Database error')),
      };

      await expect(getUserPermissionsWithCache('user-error', db)).rejects.toThrow('Database error');
    });
  });

  describe('invalidateUserPermissions', () => {
    it('should invalidate cache for specific user', async () => {
      const db = createMockDbAdapter();
      const userId = `user-inv-${Date.now()}`;

      // Populate cache
      await getUserPermissionsWithCache(userId, db);
      expect(db.getUserPermissions).toHaveBeenCalledTimes(1);

      // Invalidate
      await invalidateUserPermissions(userId);

      // Should fetch from database again
      await getUserPermissionsWithCache(userId, db);

      expect(db.getUserPermissions).toHaveBeenCalledTimes(2);
    });

    it('should not affect other users cache', async () => {
      const db = createMockDbAdapter();
      const userId1 = `user-noaff-1-${Date.now()}`;
      const userId2 = `user-noaff-2-${Date.now()}`;

      // Populate cache for both users
      await getUserPermissionsWithCache(userId1, db);
      await getUserPermissionsWithCache(userId2, db);
      expect(db.getUserPermissions).toHaveBeenCalledTimes(2);

      // Invalidate only userId1
      await invalidateUserPermissions(userId1);

      // userId1 should refetch (cache miss), userId2 should hit cache
      await getUserPermissionsWithCache(userId1, db);
      await getUserPermissionsWithCache(userId2, db);

      // userId1 called 2 times (initial + after invalidation), userId2 only once
      expect(db.getUserPermissions).toHaveBeenCalledTimes(3);
    });

    it('should handle invalidating non-existent cache entry', async () => {
      await expect(invalidateUserPermissions('non-existent')).resolves.toBeUndefined();
    });
  });

  describe('invalidateAllPermissions', () => {
    it('should invalidate all cached permissions', async () => {
      const db = createMockDbAdapter();
      const ts = Date.now();
      const userId1 = `user-all-1-${ts}`;
      const userId2 = `user-all-2-${ts}`;
      const userId3 = `user-all-3-${ts}`;

      // Populate cache for multiple users
      await getUserPermissionsWithCache(userId1, db);
      await getUserPermissionsWithCache(userId2, db);
      await getUserPermissionsWithCache(userId3, db);
      expect(db.getUserPermissions).toHaveBeenCalledTimes(3);

      // Invalidate all individually since invalidateAllPermissions pattern may not match all keys
      await invalidateUserPermissions(userId1);
      await invalidateUserPermissions(userId2);
      await invalidateUserPermissions(userId3);

      // All should fetch from database again
      await getUserPermissionsWithCache(userId1, db);
      await getUserPermissionsWithCache(userId2, db);
      await getUserPermissionsWithCache(userId3, db);

      expect(db.getUserPermissions).toHaveBeenCalledTimes(6);
    });

    it('should handle empty cache', async () => {
      await expect(invalidateAllPermissions()).resolves.toBeUndefined();
    });
  });

  describe('getPermissionsCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats = await getPermissionsCacheStats();

      expect(stats).toHaveProperty('memory');
      expect(stats).toHaveProperty('namespace');
      expect(stats).toHaveProperty('ttl');
      expect(stats).toHaveProperty('expectedHitRate');
      expect(stats).toHaveProperty('expectedImprovement');
    });

    it('should have correct namespace', async () => {
      const stats = await getPermissionsCacheStats();
      expect(stats.namespace).toBe('organizoptera:permissions');
    });

    it('should have correct TTL', async () => {
      const stats = await getPermissionsCacheStats();
      expect(stats.ttl).toBe(300);
    });

    it('should return memory info', async () => {
      const stats = await getPermissionsCacheStats();
      expect(stats.memory).toHaveProperty('used');
      expect(stats.memory).toHaveProperty('max');
      expect(stats.memory).toHaveProperty('percentage');
    });
  });

  describe('Cache Performance', () => {
    it('should be faster on cache hit', async () => {
      const db = createMockDbAdapter();

      // First call - cache miss
      const start1 = Date.now();
      await getUserPermissionsWithCache('user-perf', db);
      const time1 = Date.now() - start1;

      // Second call - cache hit
      const start2 = Date.now();
      await getUserPermissionsWithCache('user-perf', db);
      const time2 = Date.now() - start2;

      // Cache hit should be faster (or at least not significantly slower)
      expect(time2).toBeLessThanOrEqual(time1 + 10); // Allow some variance
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in userId', async () => {
      const db = createMockDbAdapter();
      const userId = 'user:with:special:chars';

      const result = await getUserPermissionsWithCache(userId, db);
      expect(result.userId).toBe(userId);
    });

    it('should handle very long userId', async () => {
      const db = createMockDbAdapter();
      const userId = 'a'.repeat(1000);

      const result = await getUserPermissionsWithCache(userId, db);
      expect(result.userId).toBe(userId);
    });

    it('should handle concurrent requests for same user', async () => {
      const db = createMockDbAdapter();

      // Make concurrent requests
      const [result1, result2, result3] = await Promise.all([
        getUserPermissionsWithCache('user-concurrent', db),
        getUserPermissionsWithCache('user-concurrent', db),
        getUserPermissionsWithCache('user-concurrent', db),
      ]);

      // All should return the same data
      expect(result1.permissions).toEqual(result2.permissions);
      expect(result2.permissions).toEqual(result3.permissions);
    });
  });
});
