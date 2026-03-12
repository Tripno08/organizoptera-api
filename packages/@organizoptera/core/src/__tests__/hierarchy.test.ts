/**
 * @organizoptera/core - Hierarchy Tests
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
  updateDescendantPaths,
  isValidPath,
  getCommonAncestorPath,
} from '../hierarchy/path-utils';
import { buildTree, flattenTree, findNodeById } from '../hierarchy/tree-utils';
import type { HierarchyNode } from '../hierarchy/types';

describe('Path Utils', () => {
  describe('buildPath', () => {
    it('should build root path', () => {
      expect(buildPath(null, 'root-1')).toBe('/root-1/');
    });

    it('should build child path', () => {
      expect(buildPath('/root-1/', 'child-1')).toBe('/root-1/child-1/');
    });

    it('should build deeply nested path', () => {
      expect(buildPath('/root-1/child-1/child-2/', 'deep-1')).toBe('/root-1/child-1/child-2/deep-1/');
    });
  });

  describe('parsePath', () => {
    it('should parse root path', () => {
      expect(parsePath('/root-1/')).toEqual(['root-1']);
    });

    it('should parse nested path', () => {
      expect(parsePath('/root-1/child-1/child-2/')).toEqual(['root-1', 'child-1', 'child-2']);
    });

    it('should handle empty path', () => {
      expect(parsePath('')).toEqual([]);
    });
  });

  describe('getParentPath', () => {
    it('should return null for root', () => {
      expect(getParentPath('/root-1/')).toBeNull();
    });

    it('should return parent path for nested', () => {
      expect(getParentPath('/root-1/child-1/')).toBe('/root-1/');
    });

    it('should return parent for deeply nested', () => {
      expect(getParentPath('/a/b/c/')).toBe('/a/b/');
    });
  });

  describe('getDepth', () => {
    it('should return 0 for root', () => {
      expect(getDepth('/root-1/')).toBe(0);
    });

    it('should return 1 for direct child', () => {
      expect(getDepth('/root-1/child-1/')).toBe(1);
    });

    it('should return 2 for grandchild', () => {
      expect(getDepth('/root-1/child-1/child-2/')).toBe(2);
    });
  });

  describe('isAncestorOf', () => {
    it('should return true for direct parent', () => {
      expect(isAncestorOf('/root-1/', '/root-1/child-1/')).toBe(true);
    });

    it('should return true for grandparent', () => {
      expect(isAncestorOf('/root-1/', '/root-1/child-1/grandchild-1/')).toBe(true);
    });

    it('should return false for non-ancestor', () => {
      expect(isAncestorOf('/root-1/child-1/', '/root-1/')).toBe(false);
    });

    it('should return false for same path', () => {
      expect(isAncestorOf('/root-1/', '/root-1/')).toBe(false);
    });
  });

  describe('isDescendantOf', () => {
    it('should return true for direct child', () => {
      expect(isDescendantOf('/root-1/child-1/', '/root-1/')).toBe(true);
    });

    it('should return false for non-descendant', () => {
      expect(isDescendantOf('/root-1/', '/root-1/child-1/')).toBe(false);
    });
  });

  describe('areSiblings', () => {
    it('should return true for siblings', () => {
      expect(areSiblings('/root-1/child-1/', '/root-1/child-2/')).toBe(true);
    });

    it('should return false for non-siblings', () => {
      expect(areSiblings('/root-1/child-1/', '/root-2/child-1/')).toBe(false);
    });

    it('should return false for root nodes', () => {
      expect(areSiblings('/root-1/', '/root-2/')).toBe(false);
    });
  });

  describe('isValidPath', () => {
    it('should validate correct path', () => {
      expect(isValidPath('/a/b/c/')).toBe(true);
    });

    it('should reject path without leading slash', () => {
      expect(isValidPath('a/b/c/')).toBe(false);
    });

    it('should reject path without trailing slash', () => {
      expect(isValidPath('/a/b/c')).toBe(false);
    });
  });

  describe('getCommonAncestorPath', () => {
    it('should find common ancestor', () => {
      expect(getCommonAncestorPath(['/a/b/c/', '/a/b/d/'])).toBe('/a/b/');
    });

    it('should return null for no common ancestor', () => {
      expect(getCommonAncestorPath(['/a/', '/b/'])).toBeNull();
    });
  });

  describe('updateDescendantPaths', () => {
    it('should update paths for move', () => {
      const nodes: HierarchyNode[] = [
        { id: 'child-1', parentId: 'old-parent', path: '/old-parent/child-1/', treeLevel: 1, name: 'Child 1' },
        { id: 'grandchild-1', parentId: 'child-1', path: '/old-parent/child-1/grandchild-1/', treeLevel: 2, name: 'Grandchild 1' },
      ];

      const pathMap = updateDescendantPaths(nodes, '/old-parent/', '/new-parent/');

      expect(pathMap.get('/old-parent/child-1/')).toBe('/new-parent/child-1/');
      expect(pathMap.get('/old-parent/child-1/grandchild-1/')).toBe('/new-parent/child-1/grandchild-1/');
    });
  });
});

describe('Tree Utils', () => {
  const sampleNodes: HierarchyNode[] = [
    { id: 'root-1', parentId: null, path: '/root-1/', treeLevel: 0, name: 'Root 1' },
    { id: 'child-1', parentId: 'root-1', path: '/root-1/child-1/', treeLevel: 1, name: 'Child 1' },
    { id: 'child-2', parentId: 'root-1', path: '/root-1/child-2/', treeLevel: 1, name: 'Child 2' },
    { id: 'grandchild-1', parentId: 'child-1', path: '/root-1/child-1/grandchild-1/', treeLevel: 2, name: 'Grandchild 1' },
  ];

  describe('buildTree', () => {
    it('should build tree structure', () => {
      const tree = buildTree(sampleNodes);
      expect(tree).toHaveLength(1);
      expect(tree[0]?.id).toBe('root-1');
      expect(tree[0]?.children).toHaveLength(2);
    });
  });

  describe('flattenTree', () => {
    it('should flatten tree back to array', () => {
      const tree = buildTree(sampleNodes);
      const flat = flattenTree(tree);
      expect(flat).toHaveLength(4);
    });
  });

  describe('findNodeById', () => {
    it('should find node in tree', () => {
      const tree = buildTree(sampleNodes);
      const node = findNodeById(tree, 'grandchild-1');
      expect(node).not.toBeNull();
      expect(node?.id).toBe('grandchild-1');
    });

    it('should return null for non-existent node', () => {
      const tree = buildTree(sampleNodes);
      const node = findNodeById(tree, 'non-existent');
      expect(node).toBeNull();
    });
  });
});
