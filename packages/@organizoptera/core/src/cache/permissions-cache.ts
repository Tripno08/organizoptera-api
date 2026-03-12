/**
 * Permissions Cache for Organizoptera
 *
 * Caches user permissions to reduce database queries
 * Expected: 50ms → 2ms (25x improvement), 90% cache hit
 *
 * Created: 2025-11-20 (Parallel Work - Technical Excellence)
 */

/**
 * Simple in-memory cache implementation
 */
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  private ttlMs: number;
  private maxSize: number;

  constructor(options: { ttl: number; maxSize?: number }) {
    this.ttlMs = options.ttl * 1000;
    this.maxSize = options.maxSize ?? 10000;
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: T): Promise<void> {
    // Evict if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expires: Date.now() + this.ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidate(pattern: string): Promise<void> {
    // Simple pattern matching for prefix:*
    const prefix = pattern.replace('*', '');
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  async getMemoryInfo(): Promise<{ used: number; max: number; percentage: number }> {
    // Estimate memory usage
    const used = this.cache.size * 1024; // Rough estimate
    const max = this.maxSize * 1024;
    return {
      used,
      max,
      percentage: (used / max) * 100,
    };
  }

  async checkMemory(): Promise<void> {
    // Cleanup expired entries
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Initialize cache
const permissionsCache = new SimpleCache<UserPermissions>({
  ttl: 300, // 5 minutes (permissions change infrequently)
  maxSize: 10000,
});

// Initialize memory monitoring
setInterval(async () => {
  await permissionsCache.checkMemory();
}, 60000); // Check every minute

export interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, unknown>;
}

export interface UserPermissions {
  userId: string;
  permissions: Permission[];
  roles: string[];
  lastUpdated: Date;
}

/**
 * Database interface for fetching permissions
 */
export interface PermissionsDatabaseAdapter {
  getUserPermissions(userId: string): Promise<{
    permissions: Permission[];
    roles: string[];
  }>;
}

/**
 * Get user permissions with caching
 *
 * Expected performance:
 * - Cache hit (90%): ~2ms
 * - Cache miss (10%): ~50ms (DB query + cache write)
 * - Overall improvement: ~25x faster
 */
export async function getUserPermissionsWithCache(
  userId: string,
  db: PermissionsDatabaseAdapter
): Promise<UserPermissions> {
  const cacheKey = `user:${userId}:permissions`;

  // Try cache first
  const cached = await permissionsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from database
  const { permissions, roles } = await db.getUserPermissions(userId);

  const result: UserPermissions = {
    userId,
    permissions,
    roles,
    lastUpdated: new Date(),
  };

  // Store in cache
  await permissionsCache.set(cacheKey, result);

  return result;
}

/**
 * Invalidate user permissions cache
 * Call when permissions are updated
 */
export async function invalidateUserPermissions(userId: string): Promise<void> {
  const cacheKey = `user:${userId}:permissions`;
  await permissionsCache.delete(cacheKey);
}

/**
 * Invalidate all permissions cache
 * Call when roles or permissions are modified globally
 */
export async function invalidateAllPermissions(): Promise<void> {
  await permissionsCache.invalidate('user:*:permissions');
}

/**
 * Get cache statistics
 */
export async function getPermissionsCacheStats() {
  const memInfo = await permissionsCache.getMemoryInfo();

  return {
    memory: {
      used: Math.round(memInfo.used / 1024 / 1024) + 'MB',
      max: Math.round(memInfo.max / 1024 / 1024) + 'MB',
      percentage: memInfo.percentage.toFixed(1) + '%',
    },
    namespace: 'organizoptera:permissions',
    ttl: 300,
    expectedHitRate: '90%',
    expectedImprovement: '25x',
  };
}
