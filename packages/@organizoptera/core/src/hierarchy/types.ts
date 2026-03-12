/**
 * @module @organizoptera/core/hierarchy/types
 * @description Types for organization hierarchy operations
 */

/**
 * Organization types in the hierarchy (5 levels)
 */
export type OrganizationType =
  | 'GOVERNMENT' // Level 0 - Top level (MEC, Secretarias)
  | 'STATE' // Level 1 - State level
  | 'DISTRICT' // Level 2 - Municipal/district level
  | 'SCHOOL' // Level 3 - Individual school
  | 'DEPARTMENT'; // Level 4 - Department within school

/**
 * Hierarchy node for tree operations
 */
export interface HierarchyNode {
  id: string;
  parentId: string | null;
  type: OrganizationType;
  path: string; // Denormalized path: /id1/id2/id3/
  level: number; // 0-4
  name: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tree structure for hierarchy operations
 */
export interface HierarchyTree extends HierarchyNode {
  children: HierarchyTree[];
}

/**
 * Move operation result
 */
export interface MoveResult {
  success: boolean;
  movedNode: HierarchyNode;
  affectedPaths: number; // Count of updated paths
  errors?: string[];
}

/**
 * Hierarchy validation result
 */
export interface HierarchyValidation {
  valid: boolean;
  errors: HierarchyValidationError[];
}

export interface HierarchyValidationError {
  nodeId: string;
  type: 'CIRCULAR_REFERENCE' | 'INVALID_LEVEL' | 'ORPHAN_NODE' | 'PATH_MISMATCH';
  message: string;
}

/**
 * Hierarchy query options
 */
export interface HierarchyQueryOptions {
  /** Include inactive/archived nodes */
  includeInactive?: boolean;
  /** Maximum depth to traverse */
  maxDepth?: number;
  /** Filter by organization types */
  types?: OrganizationType[];
}

/**
 * Ancestry result
 */
export interface AncestryResult {
  ancestors: HierarchyNode[];
  path: string;
  depth: number;
}

/**
 * Descendants result with pagination
 */
export interface DescendantsResult {
  descendants: HierarchyNode[];
  totalCount: number;
  byLevel: Map<number, HierarchyNode[]>;
}
