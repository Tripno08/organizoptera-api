/**
 * @module @organizoptera/core/hierarchy/path-utils
 * @description Utilities for hierarchical path manipulation
 *
 * Path format: /id1/id2/id3/ (leading and trailing slashes)
 * - Root nodes have path: /root-id/
 * - Children append their ID: /parent-id/child-id/
 */

import type { HierarchyNode } from './types.js';

const PATH_SEPARATOR = '/';

/**
 * Build path from parent path and node ID
 *
 * @example
 * buildPath('/parent-id/', 'child-id') // Returns '/parent-id/child-id/'
 * buildPath(null, 'root-id') // Returns '/root-id/'
 */
export function buildPath(parentPath: string | null, nodeId: string): string {
  if (!parentPath) {
    return `${PATH_SEPARATOR}${nodeId}${PATH_SEPARATOR}`;
  }
  // Ensure parent path ends with separator
  const normalizedParent = parentPath.endsWith(PATH_SEPARATOR)
    ? parentPath
    : `${parentPath}${PATH_SEPARATOR}`;
  return `${normalizedParent}${nodeId}${PATH_SEPARATOR}`;
}

/**
 * Parse path into array of node IDs
 *
 * @example
 * parsePath('/a/b/c/') // Returns ['a', 'b', 'c']
 */
export function parsePath(path: string): string[] {
  return path.split(PATH_SEPARATOR).filter(Boolean);
}

/**
 * Get parent path from a path
 *
 * @example
 * getParentPath('/a/b/c/') // Returns '/a/b/'
 * getParentPath('/a/') // Returns null (root node)
 */
export function getParentPath(path: string): string | null {
  const ids = parsePath(path);
  if (ids.length <= 1) {
    return null; // Root node has no parent
  }
  ids.pop(); // Remove last element
  return `${PATH_SEPARATOR}${ids.join(PATH_SEPARATOR)}${PATH_SEPARATOR}`;
}

/**
 * Get depth (level) from path
 *
 * @example
 * getDepth('/a/') // Returns 0
 * getDepth('/a/b/') // Returns 1
 * getDepth('/a/b/c/') // Returns 2
 */
export function getDepth(path: string): number {
  return parsePath(path).length - 1;
}

/**
 * Check if path is ancestor of another path
 *
 * @example
 * isAncestorOf('/a/', '/a/b/c/') // Returns true
 * isAncestorOf('/a/b/', '/a/c/') // Returns false
 */
export function isAncestorOf(ancestorPath: string, descendantPath: string): boolean {
  return descendantPath.startsWith(ancestorPath) && descendantPath !== ancestorPath;
}

/**
 * Check if path is descendant of another path
 */
export function isDescendantOf(descendantPath: string, ancestorPath: string): boolean {
  return isAncestorOf(ancestorPath, descendantPath);
}

/**
 * Check if paths are siblings (same parent)
 */
export function areSiblings(path1: string, path2: string): boolean {
  const parent1 = getParentPath(path1);
  const parent2 = getParentPath(path2);
  return parent1 !== null && parent1 === parent2;
}

/**
 * Update path when moving a node to a new parent
 *
 * @returns New path after move
 */
export function updatePathForMove(oldPath: string, newParentPath: string | null): string {
  const nodeId = parsePath(oldPath).pop();
  if (!nodeId) {
    throw new Error('Invalid path: cannot extract node ID');
  }
  return buildPath(newParentPath, nodeId);
}

/**
 * Update all descendant paths when a subtree is moved
 *
 * @returns Map of old paths to new paths
 */
export function updateDescendantPaths(
  descendants: HierarchyNode[],
  oldParentPath: string,
  newParentPath: string
): Map<string, string> {
  const pathMap = new Map<string, string>();

  for (const node of descendants) {
    const oldPath = node.path;
    // Replace the old parent prefix with new parent prefix
    const relativePath = oldPath.slice(oldParentPath.length);
    const newPath = `${newParentPath}${relativePath}`;
    pathMap.set(oldPath, newPath);
  }

  return pathMap;
}

/**
 * Validate path format
 */
export function isValidPath(path: string): boolean {
  // Must start and end with separator
  if (!path.startsWith(PATH_SEPARATOR) || !path.endsWith(PATH_SEPARATOR)) {
    return false;
  }

  // Must have at least one ID
  const ids = parsePath(path);
  if (ids.length === 0) {
    return false;
  }

  // IDs cannot be empty strings
  if (ids.some((id) => id.length === 0)) {
    return false;
  }

  return true;
}

/**
 * Get common ancestor path of multiple paths
 */
export function getCommonAncestorPath(paths: string[]): string | null {
  if (paths.length === 0) return null;
  if (paths.length === 1) return paths[0]!;

  const parsed = paths.map(parsePath);
  const minLength = Math.min(...parsed.map((p) => p.length));

  const commonIds: string[] = [];
  for (let i = 0; i < minLength; i++) {
    const id = parsed[0]![i];
    if (parsed.every((p) => p[i] === id)) {
      commonIds.push(id!);
    } else {
      break;
    }
  }

  if (commonIds.length === 0) return null;
  return `${PATH_SEPARATOR}${commonIds.join(PATH_SEPARATOR)}${PATH_SEPARATOR}`;
}

/**
 * Get relative path from ancestor to descendant
 *
 * @example
 * getRelativePath('/a/b/', '/a/b/c/d/') // Returns 'c/d'
 */
export function getRelativePath(ancestorPath: string, descendantPath: string): string | null {
  if (!isAncestorOf(ancestorPath, descendantPath)) {
    return null;
  }
  return descendantPath.slice(ancestorPath.length, -1); // Remove trailing slash
}
