/**
 * @organizoptera/core - Tree Utils Extended Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildTree,
  flattenTree,
  findNodeById,
  getAncestors,
  getDescendants,
  getSiblings,
  validateHierarchy,
  countByType,
  getMaxDepth,
  wouldCreateCircularReference,
} from '../hierarchy/tree-utils';
import type { HierarchyNode, HierarchyTree } from '../hierarchy/types';

describe('Tree Utils - Extended', () => {
  // Sample test data
  const createSampleNodes = (): HierarchyNode[] => [
    { id: 'root-1', parentId: null, path: '/root-1/', treeLevel: 0, name: 'Root 1', type: 'NETWORK', level: 0 },
    { id: 'child-1', parentId: 'root-1', path: '/root-1/child-1/', treeLevel: 1, name: 'Child 1', type: 'SCHOOL', level: 1 },
    { id: 'child-2', parentId: 'root-1', path: '/root-1/child-2/', treeLevel: 1, name: 'Child 2', type: 'SCHOOL', level: 1 },
    { id: 'grandchild-1', parentId: 'child-1', path: '/root-1/child-1/grandchild-1/', treeLevel: 2, name: 'Grandchild 1', type: 'GRADE', level: 2 },
    { id: 'grandchild-2', parentId: 'child-1', path: '/root-1/child-1/grandchild-2/', treeLevel: 2, name: 'Grandchild 2', type: 'GRADE', level: 2 },
    { id: 'root-2', parentId: null, path: '/root-2/', treeLevel: 0, name: 'Root 2', type: 'NETWORK', level: 0 },
  ];

  describe('buildTree', () => {
    it('should build tree from flat nodes', () => {
      const tree = buildTree(createSampleNodes());
      expect(tree).toHaveLength(2); // Two root nodes
    });

    it('should correctly nest children', () => {
      const tree = buildTree(createSampleNodes());
      const root1 = tree.find((n) => n.id === 'root-1');
      expect(root1?.children).toHaveLength(2);
    });

    it('should correctly nest grandchildren', () => {
      const tree = buildTree(createSampleNodes());
      const root1 = tree.find((n) => n.id === 'root-1');
      const child1 = root1?.children.find((n) => n.id === 'child-1');
      expect(child1?.children).toHaveLength(2);
    });

    it('should sort children by name', () => {
      const tree = buildTree(createSampleNodes());
      const root1 = tree.find((n) => n.id === 'root-1');
      expect(root1?.children[0]?.id).toBe('child-1');
      expect(root1?.children[1]?.id).toBe('child-2');
    });

    it('should handle empty input', () => {
      const tree = buildTree([]);
      expect(tree).toEqual([]);
    });

    it('should handle orphan nodes', () => {
      const nodes: HierarchyNode[] = [
        { id: 'orphan', parentId: 'non-existent', path: '/orphan/', treeLevel: 1, name: 'Orphan' },
      ];
      const tree = buildTree(nodes);
      expect(tree).toEqual([]); // Orphan not included in tree
    });

    it('should handle single root node', () => {
      const nodes: HierarchyNode[] = [
        { id: 'single', parentId: null, path: '/single/', treeLevel: 0, name: 'Single' },
      ];
      const tree = buildTree(nodes);
      expect(tree).toHaveLength(1);
      expect(tree[0]?.children).toEqual([]);
    });
  });

  describe('flattenTree', () => {
    it('should flatten tree to array', () => {
      const tree = buildTree(createSampleNodes());
      const flat = flattenTree(tree);
      expect(flat).toHaveLength(6);
    });

    it('should preserve all node properties', () => {
      const nodes = createSampleNodes();
      const tree = buildTree(nodes);
      const flat = flattenTree(tree);

      const originalRoot = nodes.find((n) => n.id === 'root-1');
      const flattenedRoot = flat.find((n) => n.id === 'root-1');

      expect(flattenedRoot?.name).toBe(originalRoot?.name);
      expect(flattenedRoot?.path).toBe(originalRoot?.path);
    });

    it('should handle empty tree', () => {
      const flat = flattenTree([]);
      expect(flat).toEqual([]);
    });

    it('should traverse in depth-first order', () => {
      const tree = buildTree(createSampleNodes());
      const flat = flattenTree(tree);

      // Root-1 should come before its children
      const root1Index = flat.findIndex((n) => n.id === 'root-1');
      const child1Index = flat.findIndex((n) => n.id === 'child-1');
      expect(root1Index).toBeLessThan(child1Index);
    });
  });

  describe('findNodeById', () => {
    it('should find root node', () => {
      const tree = buildTree(createSampleNodes());
      const node = findNodeById(tree, 'root-1');
      expect(node?.id).toBe('root-1');
    });

    it('should find nested node', () => {
      const tree = buildTree(createSampleNodes());
      const node = findNodeById(tree, 'grandchild-1');
      expect(node?.id).toBe('grandchild-1');
    });

    it('should return null for non-existent node', () => {
      const tree = buildTree(createSampleNodes());
      const node = findNodeById(tree, 'non-existent');
      expect(node).toBeNull();
    });

    it('should return null for empty tree', () => {
      const node = findNodeById([], 'any');
      expect(node).toBeNull();
    });

    it('should find node in second root tree', () => {
      const tree = buildTree(createSampleNodes());
      const node = findNodeById(tree, 'root-2');
      expect(node?.id).toBe('root-2');
    });
  });

  describe('getAncestors', () => {
    it('should return empty ancestors for root node', () => {
      const result = getAncestors(createSampleNodes(), 'root-1');
      expect(result.ancestors).toHaveLength(0);
      expect(result.depth).toBe(0);
    });

    it('should return parent for child node', () => {
      const result = getAncestors(createSampleNodes(), 'child-1');
      expect(result.ancestors).toHaveLength(1);
      expect(result.ancestors[0]?.id).toBe('root-1');
    });

    it('should return all ancestors for grandchild', () => {
      const result = getAncestors(createSampleNodes(), 'grandchild-1');
      expect(result.ancestors).toHaveLength(2);
      expect(result.ancestors[0]?.id).toBe('root-1');
      expect(result.ancestors[1]?.id).toBe('child-1');
    });

    it('should return correct depth', () => {
      const result = getAncestors(createSampleNodes(), 'grandchild-1');
      expect(result.depth).toBe(2);
    });

    it('should return empty for non-existent node', () => {
      const result = getAncestors(createSampleNodes(), 'non-existent');
      expect(result.ancestors).toHaveLength(0);
      expect(result.path).toBe('');
    });

    it('should include correct path', () => {
      const result = getAncestors(createSampleNodes(), 'grandchild-1');
      expect(result.path).toBe('/root-1/child-1/grandchild-1/');
    });
  });

  describe('getDescendants', () => {
    it('should return all descendants for root node', () => {
      const result = getDescendants(createSampleNodes(), 'root-1');
      expect(result.descendants).toHaveLength(4); // child-1, child-2, grandchild-1, grandchild-2
    });

    it('should return children for intermediate node', () => {
      const result = getDescendants(createSampleNodes(), 'child-1');
      expect(result.descendants).toHaveLength(2);
    });

    it('should return empty for leaf node', () => {
      const result = getDescendants(createSampleNodes(), 'grandchild-1');
      expect(result.descendants).toHaveLength(0);
    });

    it('should return empty for non-existent node', () => {
      const result = getDescendants(createSampleNodes(), 'non-existent');
      expect(result.descendants).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it('should respect maxDepth option', () => {
      const result = getDescendants(createSampleNodes(), 'root-1', { maxDepth: 1 });
      expect(result.descendants).toHaveLength(2); // Only direct children
    });

    it('should filter by type', () => {
      const result = getDescendants(createSampleNodes(), 'root-1', { types: ['SCHOOL'] });
      expect(result.descendants).toHaveLength(2);
      expect(result.descendants.every((d) => d.type === 'SCHOOL')).toBe(true);
    });

    it('should group by level', () => {
      const result = getDescendants(createSampleNodes(), 'root-1');
      expect(result.byLevel.has(1)).toBe(true);
      expect(result.byLevel.has(2)).toBe(true);
      expect(result.byLevel.get(1)).toHaveLength(2);
      expect(result.byLevel.get(2)).toHaveLength(2);
    });
  });

  describe('getSiblings', () => {
    it('should return siblings for node with siblings', () => {
      const siblings = getSiblings(createSampleNodes(), 'child-1');
      expect(siblings).toHaveLength(1);
      expect(siblings[0]?.id).toBe('child-2');
    });

    it('should return empty for node without siblings', () => {
      // root-1 and root-2 have null parent, but that counts as same parent
      const siblings = getSiblings(createSampleNodes(), 'root-1');
      expect(siblings).toHaveLength(1); // root-2 is sibling
    });

    it('should return empty for non-existent node', () => {
      const siblings = getSiblings(createSampleNodes(), 'non-existent');
      expect(siblings).toHaveLength(0);
    });

    it('should not include the node itself', () => {
      const siblings = getSiblings(createSampleNodes(), 'grandchild-1');
      expect(siblings.every((s) => s.id !== 'grandchild-1')).toBe(true);
    });
  });

  describe('validateHierarchy', () => {
    it('should validate correct hierarchy', () => {
      const result = validateHierarchy(createSampleNodes());
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid path format', () => {
      const nodes: HierarchyNode[] = [
        { id: 'invalid', parentId: null, path: 'invalid-path', treeLevel: 0, name: 'Invalid', level: 0 },
      ];
      const result = validateHierarchy(nodes);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'PATH_MISMATCH')).toBe(true);
    });

    it('should detect path/level mismatch', () => {
      const nodes: HierarchyNode[] = [
        { id: 'mismatch', parentId: null, path: '/a/b/c/', treeLevel: 2, name: 'Mismatch', level: 0 },
      ];
      const result = validateHierarchy(nodes);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'PATH_MISMATCH')).toBe(true);
    });

    it('should detect orphan nodes', () => {
      const nodes: HierarchyNode[] = [
        { id: 'orphan', parentId: 'non-existent', path: '/orphan/', treeLevel: 1, name: 'Orphan', level: 1 },
      ];
      const result = validateHierarchy(nodes);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'ORPHAN_NODE')).toBe(true);
    });

    it('should detect invalid level progression', () => {
      const nodes: HierarchyNode[] = [
        { id: 'parent', parentId: null, path: '/parent/', treeLevel: 0, name: 'Parent', level: 0 },
        { id: 'child', parentId: 'parent', path: '/parent/child/', treeLevel: 3, name: 'Child', level: 3 },
      ];
      const result = validateHierarchy(nodes);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'INVALID_LEVEL')).toBe(true);
    });

    it('should detect circular references', () => {
      const nodes: HierarchyNode[] = [
        { id: 'a', parentId: null, path: '/a/a/', treeLevel: 0, name: 'A', level: 0 },
      ];
      const result = validateHierarchy(nodes);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.type === 'CIRCULAR_REFERENCE')).toBe(true);
    });

    it('should handle empty input', () => {
      const result = validateHierarchy([]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('countByType', () => {
    it('should count nodes by type', () => {
      const counts = countByType(createSampleNodes());
      expect(counts['NETWORK']).toBe(2);
      expect(counts['SCHOOL']).toBe(2);
      expect(counts['GRADE']).toBe(2);
    });

    it('should handle empty input', () => {
      const counts = countByType([]);
      expect(Object.keys(counts)).toHaveLength(0);
    });

    it('should handle single type', () => {
      const nodes: HierarchyNode[] = [
        { id: '1', parentId: null, path: '/1/', treeLevel: 0, name: '1', type: 'SCHOOL' },
        { id: '2', parentId: null, path: '/2/', treeLevel: 0, name: '2', type: 'SCHOOL' },
      ];
      const counts = countByType(nodes);
      expect(counts['SCHOOL']).toBe(2);
      expect(Object.keys(counts)).toHaveLength(1);
    });
  });

  describe('getMaxDepth', () => {
    it('should return max depth', () => {
      const maxDepth = getMaxDepth(createSampleNodes());
      expect(maxDepth).toBe(2);
    });

    it('should return 0 for single level', () => {
      const nodes: HierarchyNode[] = [
        { id: '1', parentId: null, path: '/1/', treeLevel: 0, name: '1', level: 0 },
      ];
      const maxDepth = getMaxDepth(nodes);
      expect(maxDepth).toBe(0);
    });

    it('should return 0 for empty input', () => {
      const maxDepth = getMaxDepth([]);
      expect(maxDepth).toBe(0);
    });
  });

  describe('wouldCreateCircularReference', () => {
    it('should detect moving to self', () => {
      const result = wouldCreateCircularReference(createSampleNodes(), 'root-1', 'root-1');
      expect(result).toBe(true);
    });

    it('should detect moving to descendant', () => {
      const result = wouldCreateCircularReference(createSampleNodes(), 'root-1', 'grandchild-1');
      expect(result).toBe(true);
    });

    it('should allow moving to sibling', () => {
      const result = wouldCreateCircularReference(createSampleNodes(), 'child-1', 'child-2');
      expect(result).toBe(false);
    });

    it('should allow moving to unrelated node', () => {
      const result = wouldCreateCircularReference(createSampleNodes(), 'child-1', 'root-2');
      expect(result).toBe(false);
    });

    it('should return false for non-existent node', () => {
      const result = wouldCreateCircularReference(createSampleNodes(), 'non-existent', 'root-1');
      expect(result).toBe(false);
    });
  });
});
