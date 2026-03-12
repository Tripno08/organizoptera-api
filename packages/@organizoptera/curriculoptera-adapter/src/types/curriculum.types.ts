/**
 * BNCC Curriculum Types
 * Based on Base Nacional Comum Curricular (BNCC) standards
 */

/**
 * Education levels in Brazilian system
 */
export type EducationLevel = 'EI' | 'EF' | 'EM';

/**
 * BNCC Curriculum Area
 */
export type CurriculumArea =
  | 'LINGUAGENS' // Languages (Portuguese, Arts, Physical Education)
  | 'MATEMATICA' // Mathematics
  | 'CIENCIAS_NATUREZA' // Natural Sciences
  | 'CIENCIAS_HUMANAS' // Human Sciences (History, Geography)
  | 'ENSINO_RELIGIOSO'; // Religious Education

/**
 * BNCC Competency
 */
export interface BNCCCompetency {
  id: string;
  code: string; // e.g., "CG01", "CE02"
  title: string;
  description: string;
  level: EducationLevel;
  area?: CurriculumArea;
}

/**
 * BNCC Learning Objective (Habilidade)
 */
export interface BNCCObjective {
  id: string;
  code: string; // e.g., "EF01MA01", "EF02LP04"
  description: string;
  grade: number; // 1-9 for EF, 10-12 for EM
  level: EducationLevel;
  area: CurriculumArea;
  component: string; // Subject name (Matemática, Português, etc.)
  thematicUnit?: string; // Unidade temática
  knowledgeObject?: string; // Objeto de conhecimento
  competencies: string[]; // Related competency codes
}

/**
 * Curriculum Standard Search Filters
 */
export interface CurriculumSearchFilters {
  level?: EducationLevel;
  grade?: number;
  area?: CurriculumArea;
  component?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Curriculum Standard Result
 */
export interface CurriculumSearchResult {
  objectives: BNCCObjective[];
  competencies: BNCCCompetency[];
  total: number;
  hasMore: boolean;
}

/**
 * Student-Objective Mapping
 */
export interface StudentObjectiveMapping {
  studentId: string;
  objectiveId: string;
  objectiveCode: string;
  masteryLevel: number; // 0-100
  lastAssessment?: Date;
  assessmentCount: number;
  isActive: boolean;
}

/**
 * Grade Curriculum Summary
 */
export interface GradeCurriculumSummary {
  grade: number;
  level: EducationLevel;
  totalObjectives: number;
  objectivesByArea: Record<CurriculumArea, number>;
  objectivesByComponent: Record<string, number>;
}
