/**
 * @organizoptera/curriculoptera-adapter
 *
 * Integration adapter for Curriculoptera (BNCC curriculum) skill tracking
 * with Organizoptera student management.
 *
 * Provides:
 * - Student skill progress tracking
 * - Microskill mastery tracking
 * - Classroom and school-level curriculum analytics
 * - Content-skill alignment
 * - BNCC curriculum standards access
 *
 * @module @organizoptera/curriculoptera-adapter
 */

// Skill tracking adapter (for Organizoptera student progress)
export { CurriculopteraAdapter } from './adapter';
export type { CurriculopteraAdapterConfig } from './adapter';

// BNCC curriculum adapter (for curriculum standards and objectives)
export { CurriculopteraAdapter as BNCCAdapter } from './curriculoptera-adapter';
export type { CurriculopteraConfig as BNCCAdapterConfig } from './curriculoptera-adapter';

export type {
  SkillProgress,
  MicroSkillProgress,
  ClassSkillSummary,
  SchoolSkillDashboard,
  StudentCurriculumReport,
  SkillAlignment,
} from './types';
