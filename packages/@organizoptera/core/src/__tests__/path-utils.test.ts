/**
 * @organizoptera/core - Path Utils Additional Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildPath,
  parsePath,
  getParentPath,
  getDepth,
  isAncestorOf,
  isDescendantOf,
  areSiblings,
  updatePathForMove,
  updateDescendantPaths,
  isValidPath,
  getCommonAncestorPath,
  getRelativePath,
} from '../hierarchy/path-utils';
import type { HierarchyNode } from '../hierarchy/types';

describe('Path Utils - Extended', () => {
  describe('buildPath edge cases', () => {
    it('should handle parent path without trailing slash', () => {
      expect(buildPath('/root-1', 'child-1')).toBe('/root-1/child-1/');
    });

    it('should handle empty string nodeId', () => {
      expect(buildPath('/root-1/', '')).toBe('/root-1//');
    });

    it('should handle special characters in nodeId', () => {
      expect(buildPath('/root-1/', 'child-with-uuid-123')).toBe('/root-1/child-with-uuid-123/');
    });

    it('should handle UUID-like nodeId', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(buildPath(null, uuid)).toBe(`/${uuid}/`);
    });
  });

  describe('parsePath edge cases', () => {
    it('should handle path with only slashes', () => {
      expect(parsePath('/')).toEqual([]);
    });

    it('should handle path with double slashes', () => {
      expect(parsePath('/a//b/')).toEqual(['a', 'b']);
    });

    it('should handle long paths', () => {
      const result = parsePath('/a/b/c/d/e/f/g/h/');
      expect(result).toHaveLength(8);
      expect(result).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    });
  });

  describe('getParentPath edge cases', () => {
    it('should handle deep nesting', () => {
      expect(getParentPath('/a/b/c/d/e/')).toBe('/a/b/c/d/');
    });

    it('should handle empty path', () => {
      expect(getParentPath('')).toBeNull();
    });

    it('should handle single slash path', () => {
      expect(getParentPath('/')).toBeNull();
    });
  });

  describe('getDepth edge cases', () => {
    it('should return -1 for empty path', () => {
      expect(getDepth('')).toBe(-1);
    });

    it('should handle very deep paths', () => {
      expect(getDepth('/a/b/c/d/e/f/g/')).toBe(6);
    });
  });

  describe('isAncestorOf edge cases', () => {
    it('should handle empty paths', () => {
      // Empty string is prefix of all strings: '/a/'.startsWith('') is true
      // and '' !== '/a/', so isAncestorOf returns true
      expect(isAncestorOf('', '/a/')).toBe(true);
      expect(isAncestorOf('/a/', '')).toBe(false);
    });

    it('should handle deeply nested relationships', () => {
      expect(isAncestorOf('/a/', '/a/b/c/d/e/f/')).toBe(true);
    });

    it('should return false for partial matches', () => {
      expect(isAncestorOf('/a/b/', '/a/bc/')).toBe(false);
    });

    it('should handle paths with similar prefixes', () => {
      expect(isAncestorOf('/root/', '/root-extended/child/')).toBe(false);
    });
  });

  describe('isDescendantOf edge cases', () => {
    it('should be inverse of isAncestorOf', () => {
      expect(isDescendantOf('/a/b/c/', '/a/')).toBe(true);
      expect(isDescendantOf('/a/', '/a/b/')).toBe(false);
    });

    it('should handle empty paths', () => {
      // isDescendantOf(desc, anc) calls isAncestorOf(anc, desc)
      // isDescendantOf('', '/a/') -> isAncestorOf('/a/', '') -> false
      // isDescendantOf('/a/', '') -> isAncestorOf('', '/a/') -> true
      expect(isDescendantOf('', '/a/')).toBe(false);
      expect(isDescendantOf('/a/', '')).toBe(true);
    });
  });

  describe('areSiblings edge cases', () => {
    it('should handle deeply nested siblings', () => {
      expect(areSiblings('/a/b/c/d/', '/a/b/c/e/')).toBe(true);
    });

    it('should return true for same node (same parent)', () => {
      // areSiblings only checks if parents are equal, not if paths are different
      // Both paths have parent /a/, so areSiblings returns true
      expect(areSiblings('/a/b/', '/a/b/')).toBe(true);
    });

    it('should return false for cousins', () => {
      expect(areSiblings('/a/b/c/', '/a/d/e/')).toBe(false);
    });

    it('should handle empty paths', () => {
      expect(areSiblings('', '/a/')).toBe(false);
    });
  });

  describe('updatePathForMove', () => {
    it('should update path when moving to root', () => {
      const newPath = updatePathForMove('/old/child/', null);
      expect(newPath).toBe('/child/');
    });

    it('should update path when moving to new parent', () => {
      const newPath = updatePathForMove('/old/child/', '/new-parent/');
      expect(newPath).toBe('/new-parent/child/');
    });

    it('should update path when moving deeply nested node', () => {
      const newPath = updatePathForMove('/a/b/c/d/target/', '/x/y/');
      expect(newPath).toBe('/x/y/target/');
    });

    it('should throw for invalid path', () => {
      expect(() => updatePathForMove('', '/new/')).toThrow();
    });

    it('should throw for path without node ID', () => {
      expect(() => updatePathForMove('/', '/new/')).toThrow();
    });
  });

  describe('updateDescendantPaths', () => {
    it('should update multiple descendant paths', () => {
      const nodes: HierarchyNode[] = [
        { id: 'child-1', parentId: 'old', path: '/old/child-1/', treeLevel: 1, name: 'Child 1' },
        { id: 'child-2', parentId: 'old', path: '/old/child-2/', treeLevel: 1, name: 'Child 2' },
        { id: 'grandchild', parentId: 'child-1', path: '/old/child-1/grandchild/', treeLevel: 2, name: 'GC' },
      ];

      const pathMap = updateDescendantPaths(nodes, '/old/', '/new/');

      expect(pathMap.get('/old/child-1/')).toBe('/new/child-1/');
      expect(pathMap.get('/old/child-2/')).toBe('/new/child-2/');
      expect(pathMap.get('/old/child-1/grandchild/')).toBe('/new/child-1/grandchild/');
    });

    it('should handle empty nodes array', () => {
      const pathMap = updateDescendantPaths([], '/old/', '/new/');
      expect(pathMap.size).toBe(0);
    });

    it('should handle moving to root', () => {
      const nodes: HierarchyNode[] = [
        { id: 'child', parentId: 'old', path: '/old/child/', treeLevel: 1, name: 'Child' },
      ];

      const pathMap = updateDescendantPaths(nodes, '/old/', '/');
      expect(pathMap.get('/old/child/')).toBe('/child/');
    });
  });

  describe('isValidPath edge cases', () => {
    it('should reject path with only trailing slash', () => {
      expect(isValidPath('a/')).toBe(false);
    });

    it('should reject path with only leading slash', () => {
      expect(isValidPath('/a')).toBe(false);
    });

    it('should accept valid complex path', () => {
      expect(isValidPath('/a1-b2-c3/d4-e5-f6/')).toBe(true);
    });

    it('should accept path with double slashes (parsePath filters empty)', () => {
      // parsePath('/a//b/') uses filter(Boolean) which removes empty strings
      // Result is ['a', 'b'] - no empty IDs, so validation passes
      expect(isValidPath('/a//b/')).toBe(true);
    });

    it('should accept path with UUID segments', () => {
      expect(isValidPath('/550e8400-e29b-41d4-a716-446655440000/')).toBe(true);
    });
  });

  describe('getCommonAncestorPath edge cases', () => {
    it('should return null for empty array', () => {
      expect(getCommonAncestorPath([])).toBeNull();
    });

    it('should return path for single element array', () => {
      expect(getCommonAncestorPath(['/a/b/c/'])).toBe('/a/b/c/');
    });

    it('should find common ancestor for deeply nested paths', () => {
      const paths = ['/a/b/c/d/e/', '/a/b/c/d/f/', '/a/b/c/d/g/'];
      expect(getCommonAncestorPath(paths)).toBe('/a/b/c/d/');
    });

    it('should return null when no common ancestor exists', () => {
      expect(getCommonAncestorPath(['/a/b/', '/c/d/'])).toBeNull();
    });

    it('should handle root-level common ancestor', () => {
      expect(getCommonAncestorPath(['/a/b/', '/a/c/'])).toBe('/a/');
    });
  });

  describe('getRelativePath', () => {
    it('should return relative path', () => {
      expect(getRelativePath('/a/b/', '/a/b/c/d/')).toBe('c/d');
    });

    it('should return null for non-ancestor', () => {
      expect(getRelativePath('/a/b/', '/c/d/')).toBeNull();
    });

    it('should return null for same path', () => {
      expect(getRelativePath('/a/b/', '/a/b/')).toBeNull();
    });

    it('should handle single level difference', () => {
      expect(getRelativePath('/a/', '/a/b/')).toBe('b');
    });

    it('should handle deep relative path', () => {
      expect(getRelativePath('/a/', '/a/b/c/d/e/f/')).toBe('b/c/d/e/f');
    });
  });
});
