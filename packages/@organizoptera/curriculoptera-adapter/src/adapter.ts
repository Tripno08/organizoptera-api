/**
 * Curriculoptera Adapter Service
 *
 * Provides integration between Organizoptera students and Curriculoptera skill tracking.
 * Implements DPS Level 5: Curriculum Provider Protocol
 */

import type { GradeLevel, SubjectCode } from './types';
import type {
  SkillProgress,
  MicroSkillProgress,
  ClassSkillSummary,
  SchoolSkillDashboard,
  StudentCurriculumReport,
  SkillAlignment,
} from './types';

// Use generic type for Prisma Client to avoid dependency on specific Curriculoptera types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CurriculopteraPrisma = any;

export interface CurriculopteraAdapterConfig {
  curriculopteraPrisma: CurriculopteraPrisma;
  cacheEnabled?: boolean;
  cacheTTL?: number; // seconds
}

/**
 * Adapter for querying student skill progress from Curriculoptera
 */
export class CurriculopteraAdapter {
  private curriculoptera: CurriculopteraPrisma;
  private cacheEnabled: boolean;
  private cacheTTL: number;
  private cache: Map<string, { data: any; expires: number }>;

  constructor(config: CurriculopteraAdapterConfig) {
    this.curriculoptera = config.curriculopteraPrisma;
    this.cacheEnabled = config.cacheEnabled ?? true;
    this.cacheTTL = config.cacheTTL ?? 300; // 5 minutes default
    this.cache = new Map();
  }

  /**
   * Get skill progress for a student
   */
  async getStudentSkillProgress(studentId: string): Promise<SkillProgress[]> {
    const cacheKey = `skill-progress:${studentId}`;
    const cached = this.getFromCache<SkillProgress[]>(cacheKey);
    if (cached) return cached;

    const progress = await this.curriculoptera.studentSkillProgress.findMany({
      where: { studentId },
      include: {
        skill: {
          select: {
            code: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result: SkillProgress[] = progress.map((p) => ({
      id: p.id,
      studentId: p.studentId,
      tenantId: p.tenantId,
      skillId: p.skillId,
      skillCode: p.skill.code,
      proficiencyLevel: p.proficiencyLevel as any,
      lastPracticed: p.lastPracticed,
      practiceCount: p.practiceCount,
      mastered: p.mastered,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get microskill progress for a student
   */
  async getStudentMicroSkillProgress(studentId: string): Promise<MicroSkillProgress[]> {
    const cacheKey = `microskill-progress:${studentId}`;
    const cached = this.getFromCache<MicroSkillProgress[]>(cacheKey);
    if (cached) return cached;

    const progress = await this.curriculoptera.studentMicroSkillProgress.findMany({
      where: { studentId },
      include: {
        microSkill: {
          select: {
            code: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result: MicroSkillProgress[] = progress.map((p) => ({
      id: p.id,
      studentId: p.studentId,
      tenantId: p.tenantId,
      microSkillId: p.microSkillId,
      microSkillCode: p.microSkill.code,
      masteryLevel: p.masteryLevel,
      attempts: p.attempts,
      successRate: p.successRate,
      lastPracticed: p.lastPracticed,
      nextReviewDate: p.nextReviewDate,
      easeFactor: p.easeFactor,
      interval: p.interval,
      totalTimeSeconds: p.totalTimeSeconds,
      avgSessionSeconds: p.avgSessionSeconds,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get classroom-level skill summary
   */
  async getClassroomSkillSummary(classroomId: string): Promise<ClassSkillSummary> {
    // This requires joining with Organizoptera's Enrollment table
    // For now, we'll implement a simplified version that takes studentIds
    throw new Error('Not implemented - requires Organizoptera Enrollment data');
  }

  /**
   * Get school-level skill dashboard
   */
  async getSchoolSkillDashboard(schoolId: string, networkId: string): Promise<SchoolSkillDashboard> {
    const cacheKey = `school-dashboard:${schoolId}`;
    const cached = this.getFromCache<SchoolSkillDashboard>(cacheKey);
    if (cached) return cached;

    // Get all skill progress for this tenant (network)
    const allProgress = await this.curriculoptera.studentSkillProgress.findMany({
      where: { tenantId: networkId },
      include: {
        skill: {
          include: {
            subject: true,
            gradeLevel: true,
          },
        },
      },
    });

    // Calculate metrics
    const uniqueStudents = new Set(allProgress.map((p) => p.studentId)).size;
    const uniqueSkills = new Set(allProgress.map((p) => p.skillId)).size;

    // Group by grade level
    const gradeProgress = new Map<string, { count: number; totalProf: number; skills: Set<string> }>();
    allProgress.forEach((p) => {
      const grade = p.skill.gradeLevel.code;
      if (!gradeProgress.has(grade)) {
        gradeProgress.set(grade, { count: 0, totalProf: 0, skills: new Set() });
      }
      const stats = gradeProgress.get(grade)!;
      stats.count++;
      stats.totalProf += this.proficiencyToNumber(p.proficiencyLevel);
      stats.skills.add(p.skillId);
    });

    // Group by subject
    const subjectPerformance = new Map<string, { count: number; totalProf: number; students: Set<string> }>();
    allProgress.forEach((p) => {
      const subjectCode = p.skill.subject.code;
      if (!subjectPerformance.has(subjectCode)) {
        subjectPerformance.set(subjectCode, { count: 0, totalProf: 0, students: new Set() });
      }
      const stats = subjectPerformance.get(subjectCode)!;
      stats.count++;
      stats.totalProf += this.proficiencyToNumber(p.proficiencyLevel);
      stats.students.add(p.studentId);
    });

    const result: SchoolSkillDashboard = {
      schoolId,
      schoolName: '', // To be filled by Organizoptera
      networkId,
      totalStudents: uniqueStudents,
      totalClassrooms: 0, // To be filled by Organizoptera
      skillsTracked: uniqueSkills,
      gradeProgress: Array.from(gradeProgress.entries()).map(([grade, stats]) => ({
        gradeLevel: grade as GradeLevel,
        studentCount: uniqueStudents, // Simplified
        skillsTracked: stats.skills.size,
        averageProficiency: stats.count > 0 ? stats.totalProf / stats.count : 0,
      })),
      subjectPerformance: Array.from(subjectPerformance.entries()).map(([code, stats]) => ({
        subjectCode: code as SubjectCode,
        subjectName: code, // To be mapped
        skillsTracked: stats.count,
        averageProficiency: stats.count > 0 ? stats.totalProf / stats.count : 0,
        studentsCovered: stats.students.size,
      })),
      trends: {
        weeklyProgress: 0, // To be calculated with historical data
        studentsImproving: 0,
        studentsNeedingSupport: 0,
      },
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * Get comprehensive curriculum report for a student
   */
  async getStudentCurriculumReport(studentId: string, gradeLevel: GradeLevel): Promise<StudentCurriculumReport> {
    const skillProgress = await this.getStudentSkillProgress(studentId);

    // Get all skills for this grade level
    const gradeSkills = await this.curriculoptera.skill.findMany({
      where: {
        gradeLevel: {
          code: gradeLevel,
        },
      },
      include: {
        subject: true,
      },
    });

    const totalSkillsForGrade = gradeSkills.length;
    const skillsStarted = skillProgress.length;
    const skillsMastered = skillProgress.filter((p) => p.mastered).length;

    // Calculate overall proficiency
    const totalProf = skillProgress.reduce((sum, p) => sum + this.proficiencyToNumber(p.proficiencyLevel), 0);
    const overallProficiency = skillProgress.length > 0 ? totalProf / skillProgress.length : 0;

    // Group by subject
    const subjectMap = new Map<string, any>();
    gradeSkills.forEach((skill) => {
      const code = skill.subject.code;
      if (!subjectMap.has(code)) {
        subjectMap.set(code, {
          subjectCode: code,
          subjectName: skill.subject.name,
          totalSkills: 0,
          skillsStarted: 0,
          skillsMastered: 0,
          totalProf: 0,
        });
      }
      const stats = subjectMap.get(code)!;
      stats.totalSkills++;

      const progress = skillProgress.find((p) => p.skillId === skill.id);
      if (progress) {
        stats.skillsStarted++;
        if (progress.mastered) stats.skillsMastered++;
        stats.totalProf += this.proficiencyToNumber(progress.proficiencyLevel);
      }
    });

    return {
      studentId,
      studentName: '', // To be filled by Organizoptera
      gradeLevel,
      schoolId: '', // To be filled
      totalSkillsForGrade,
      skillsStarted,
      skillsMastered,
      overallProficiency,
      subjects: Array.from(subjectMap.values()).map((s) => ({
        ...s,
        proficiency: s.skillsStarted > 0 ? s.totalProf / s.skillsStarted : 0,
      })),
      recentSkills: skillProgress
        .filter((p) => p.lastPracticed)
        .sort((a, b) => (b.lastPracticed?.getTime() || 0) - (a.lastPracticed?.getTime() || 0))
        .slice(0, 10)
        .map((p) => ({
          skillCode: p.skillCode,
          description: '', // To be filled
          proficiencyLevel: p.proficiencyLevel,
          lastPracticed: p.lastPracticed!,
        })),
      recommendedSkills: [], // To be implemented with prerequisite analysis
    };
  }

  /**
   * Get skill alignment for content
   */
  async getContentSkillAlignment(contentId: string, contentType: string): Promise<SkillAlignment> {
    const mappings = await this.curriculoptera.contentSkillMapping.findMany({
      where: {
        contentId,
        contentType,
      },
      include: {
        skill: {
          include: {
            subject: true,
            gradeLevel: true,
          },
        },
      },
    });

    return {
      contentId,
      contentType: contentType as any,
      alignedSkills: mappings.map((m) => ({
        skillCode: m.skill.code,
        skillDescription: m.skill.description,
        gradeLevel: m.skill.gradeLevel.code as GradeLevel,
        subjectCode: m.skill.subject.code as SubjectCode,
      })),
      coveragePercentage: mappings.length > 0 ? 100 : 0, // Simplified
    };
  }

  /**
   * Clear cache for a specific key or all cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Private helpers

  private proficiencyToNumber(level: string): number {
    const map: Record<string, number> = {
      not_started: 0,
      developing: 25,
      proficient: 50,
      advanced: 75,
      mastered: 100,
    };
    return map[level] || 0;
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.cacheEnabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any): void {
    if (!this.cacheEnabled) return;

    this.cache.set(key, {
      data,
      expires: Date.now() + this.cacheTTL * 1000,
    });
  }
}
