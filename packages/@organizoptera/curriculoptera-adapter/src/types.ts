/**
 * Types for Curriculoptera integration with Organizoptera students
 *
 * This adapter connects:
 * - Organizoptera students (720 students across grades 1-9 EF)
 * - Curriculoptera skill tracking (1,407 BNCC skills + 6,867 microskills)
 */

// Local type definitions (matching Curriculoptera types)
export type GradeLevel = '1ef' | '2ef' | '3ef' | '4ef' | '5ef' | '6ef' | '7ef' | '8ef' | '9ef';
export type SubjectCode = 'matematica' | 'lingua_portuguesa' | 'ciencias' | 'historia' | 'geografia' | 'artes' | 'educacao_fisica' | 'lingua_inglesa' | 'ensino_religioso' | 'computacao';

/**
 * Student skill progress tracking
 * Matches Curriculoptera's StudentSkillProgress table
 */
export interface SkillProgress {
  id: string;
  studentId: string; // From Organizoptera Student.id
  tenantId: string; // From Organizoptera School.networkId
  skillId: string; // Curriculoptera Skill.id
  skillCode: string; // BNCC code (e.g., "EF01MA01")

  // Progress metrics
  proficiencyLevel: 'not_started' | 'developing' | 'proficient' | 'advanced' | 'mastered';
  lastPracticed: Date | null;
  practiceCount: number;
  mastered: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Student microskill progress tracking
 * Matches Curriculoptera's StudentMicroSkillProgress table
 */
export interface MicroSkillProgress {
  id: string;
  studentId: string;
  tenantId: string;
  microSkillId: string;
  microSkillCode: string; // e.g., "EF01MA01.1"

  // Mastery metrics
  masteryLevel: number; // 0.0-1.0
  attempts: number;
  successRate: number; // 0.0-1.0

  // Spaced repetition
  lastPracticed: Date | null;
  nextReviewDate: Date | null;
  easeFactor: number; // SM-2 algorithm
  interval: number; // Days until next review

  // Time tracking
  totalTimeSeconds: number;
  avgSessionSeconds: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Classroom-level skill summary
 */
export interface ClassSkillSummary {
  classroomId: string;
  classroomName: string;
  gradeLevel: GradeLevel;
  totalStudents: number;

  // Skill coverage
  skillsTracked: number;
  skillsMastered: number;
  averageProficiency: number; // 0-100

  // Subject breakdown
  subjectProgress: Array<{
    subjectCode: SubjectCode;
    subjectName: string;
    skillsTracked: number;
    skillsMastered: number;
    averageProficiency: number;
  }>;

  // Top performing skills
  topSkills: Array<{
    skillCode: string;
    skillDescription: string;
    masteredBy: number; // Number of students
    averageProficiency: number;
  }>;

  // Skills needing attention
  strugglingSkills: Array<{
    skillCode: string;
    skillDescription: string;
    avgProficiency: number;
    studentsStruggling: number;
  }>;
}

/**
 * School-level skill dashboard
 */
export interface SchoolSkillDashboard {
  schoolId: string;
  schoolName: string;
  networkId: string;

  // Overall metrics
  totalStudents: number;
  totalClassrooms: number;
  skillsTracked: number;

  // Grade-level breakdown
  gradeProgress: Array<{
    gradeLevel: GradeLevel;
    studentCount: number;
    skillsTracked: number;
    averageProficiency: number;
  }>;

  // Subject performance
  subjectPerformance: Array<{
    subjectCode: SubjectCode;
    subjectName: string;
    skillsTracked: number;
    averageProficiency: number;
    studentsCovered: number;
  }>;

  // Trends
  trends: {
    weeklyProgress: number; // % change in average proficiency
    studentsImproving: number; // Count of students showing improvement
    studentsNeedingSupport: number; // Count below proficiency threshold
  };
}

/**
 * Student curriculum report
 */
export interface StudentCurriculumReport {
  studentId: string;
  studentName: string;
  gradeLevel: GradeLevel;
  schoolId: string;

  // Overall progress
  totalSkillsForGrade: number;
  skillsStarted: number;
  skillsMastered: number;
  overallProficiency: number; // 0-100

  // Subject breakdown
  subjects: Array<{
    subjectCode: SubjectCode;
    subjectName: string;
    totalSkills: number;
    skillsStarted: number;
    skillsMastered: number;
    proficiency: number;
  }>;

  // Recent activity
  recentSkills: Array<{
    skillCode: string;
    description: string;
    proficiencyLevel: string;
    lastPracticed: Date;
  }>;

  // Recommendations
  recommendedSkills: Array<{
    skillCode: string;
    description: string;
    reason: string; // e.g., "prerequisite for next level", "low proficiency"
  }>;
}

/**
 * Skill alignment for content
 */
export interface SkillAlignment {
  contentId: string;
  contentType: 'activity' | 'assessment' | 'resource' | 'lesson';
  alignedSkills: Array<{
    skillCode: string;
    skillDescription: string;
    gradeLevel: GradeLevel;
    subjectCode: SubjectCode;
  }>;
  coveragePercentage: number; // 0-100
}
