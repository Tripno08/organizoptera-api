/**
 * @module @organizoptera/core/hierarchy/tree-utils
 * @description Utilities for tree operations on organization hierarchy
 */

import type {
  HierarchyNode,
  HierarchyTree,
  HierarchyValidation,
  HierarchyValidationError,
  AncestryResult,
  DescendantsResult,
  HierarchyQueryOptions,
} from './types.js';
import { parsePath, getDepth, isValidPath, isAncestorOf } from './path-utils.js';

/**
 * Build a tree structure from flat list of nodes
 */
export function buildTree(nodes: HierarchyNode[]): HierarchyTree[] {
  const nodeMap = new Map<string, HierarchyTree>();
  const roots: HierarchyTree[] = [];

  // First pass: create tree nodes
  for (const node of nodes) {
    nodeMap.set(node.id, { ...node, children: [] });
  }

  // Second pass: link children to parents
  for (const node of nodes) {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)!;
      parent.children.push(treeNode);
    } else if (!node.parentId) {
      roots.push(treeNode);
    }
  }

  // Sort children by name at each level
  const sortChildren = (node: HierarchyTree) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortChildren);
  };
  roots.forEach(sortChildren);

  return roots;
}

/**
 * Flatten a tree structure to list of nodes
 */
export function flattenTree(trees: HierarchyTree[]): HierarchyNode[] {
  const result: HierarchyNode[] = [];

  function traverse(node: HierarchyTree) {
    const { children, ...nodeWithoutChildren } = node;
    result.push(nodeWithoutChildren);
    for (const child of children) {
      traverse(child);
    }
  }

  for (const tree of trees) {
    traverse(tree);
  }

  return result;
}

/**
 * Find a node in the tree by ID
 */
export function findNodeById(trees: HierarchyTree[], id: string): HierarchyTree | null {
  for (const tree of trees) {
    if (tree.id === id) return tree;
    const found = findNodeById(tree.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Get all ancestors of a node (parent, grandparent, etc.)
 */
export function getAncestors(nodes: HierarchyNode[], nodeId: string): AncestryResult {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const node = nodeMap.get(nodeId);

  if (!node) {
    return { ancestors: [], path: '', depth: 0 };
  }

  const ancestors: HierarchyNode[] = [];
  let current = node;

  while (current.parentId) {
    const parent = nodeMap.get(current.parentId);
    if (!parent) break;
    ancestors.unshift(parent); // Add to beginning (root first)
    current = parent;
  }

  return {
    ancestors,
    path: node.path,
    depth: ancestors.length,
  };
}

/**
 * Get all descendants of a node
 */
export function getDescendants(
  nodes: HierarchyNode[],
  nodeId: string,
  options?: HierarchyQueryOptions
): DescendantsResult {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) {
    return { descendants: [], totalCount: 0, byLevel: new Map() };
  }

  const maxDepth = options?.maxDepth ?? Infinity;
  const allowedTypes = options?.types ? new Set(options.types) : null;
  const nodeLevel = node.level;

  const descendants = nodes.filter((n) => {
    // Must be descendant (path contains node's path)
    if (!isAncestorOf(node.path, n.path)) return false;

    // Check max depth
    if (n.level - nodeLevel > maxDepth) return false;

    // Check allowed types
    if (allowedTypes && !allowedTypes.has(n.type)) return false;

    return true;
  });

  // Group by level
  const byLevel = new Map<number, HierarchyNode[]>();
  for (const desc of descendants) {
    const level = desc.level;
    if (!byLevel.has(level)) {
      byLevel.set(level, []);
    }
    byLevel.get(level)!.push(desc);
  }

  return {
    descendants,
    totalCount: descendants.length,
    byLevel,
  };
}

/**
 * Get siblings of a node (same parent)
 */
export function getSiblings(nodes: HierarchyNode[], nodeId: string): HierarchyNode[] {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return [];

  return nodes.filter((n) => n.id !== nodeId && n.parentId === node.parentId);
}

/**
 * Validate hierarchy integrity
 */
export function validateHierarchy(nodes: HierarchyNode[]): HierarchyValidation {
  const errors: HierarchyValidationError[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const node of nodes) {
    // Check for invalid path format
    if (!isValidPath(node.path)) {
      errors.push({
        nodeId: node.id,
        type: 'PATH_MISMATCH',
        message: `Invalid path format: ${node.path}`,
      });
      continue;
    }

    // Check for path/level mismatch
    const pathDepth = getDepth(node.path);
    if (pathDepth !== node.level) {
      errors.push({
        nodeId: node.id,
        type: 'PATH_MISMATCH',
        message: `Level ${node.level} doesn't match path depth ${pathDepth}`,
      });
    }

    // Check for orphan nodes (parent not found)
    if (node.parentId && !nodeMap.has(node.parentId)) {
      errors.push({
        nodeId: node.id,
        type: 'ORPHAN_NODE',
        message: `Parent ${node.parentId} not found`,
      });
    }

    // Check for invalid level progression
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      if (parent && node.level !== parent.level + 1) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_LEVEL',
          message: `Level ${node.level} should be parent level + 1 (${parent.level + 1})`,
        });
      }
    }

    // Check for circular references using path
    const pathIds = parsePath(node.path);
    const uniqueIds = new Set(pathIds);
    if (uniqueIds.size !== pathIds.length) {
      errors.push({
        nodeId: node.id,
        type: 'CIRCULAR_REFERENCE',
        message: 'Path contains duplicate IDs (circular reference)',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Count nodes by type
 */
export function countByType(nodes: HierarchyNode[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of nodes) {
    counts[node.type] = (counts[node.type] || 0) + 1;
  }
  return counts;
}

/**
 * Get maximum depth of the hierarchy
 */
export function getMaxDepth(nodes: HierarchyNode[]): number {
  return Math.max(0, ...nodes.map((n) => n.level));
}

/**
 * Check if moving a node would create a circular reference
 */
export function wouldCreateCircularReference(
  nodes: HierarchyNode[],
  nodeId: string,
  newParentId: string
): boolean {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return false;

  // Cannot move to self
  if (nodeId === newParentId) return true;

  // Cannot move to one of its descendants
  const descendants = getDescendants(nodes, nodeId);
  return descendants.descendants.some((d) => d.id === newParentId);
}
