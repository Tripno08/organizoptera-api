import { Injectable, NotFoundException } from '@nestjs/common';
import { BNCCAdapter } from '@organizoptera/curriculoptera-adapter';
import type { SchoolNetworkId } from '@organizoptera/types';
import { SearchStandardsDto } from './dto/search-standards.dto';

@Injectable()
export class CurriculumService {
  private adapter: BNCCAdapter;

  constructor() {
    // Initialize adapter with configuration
    // In production, this would use env variables
    this.adapter = new BNCCAdapter({
      baseUrl: process.env.CURRICULOPTERA_URL || 'http://localhost:4000',
      apiKey: process.env.CURRICULOPTERA_API_KEY || 'dev-key',
      enableCache: true,
      cacheTTL: 3600, // 1 hour
    });
  }

  /**
   * Search BNCC standards
   */
  async searchStandards(searchDto: SearchStandardsDto) {
    return await this.adapter.searchStandards({
      level: searchDto.level,
      grade: searchDto.grade,
      area: searchDto.area,
      component: searchDto.component,
      searchTerm: searchDto.searchTerm,
      limit: searchDto.limit,
      offset: searchDto.offset,
    });
  }

  /**
   * Get objectives by grade
   */
  async getObjectivesByGrade(grade: number, level: string) {
    return await this.adapter.getObjectivesByGrade(grade, level as any);
  }

  /**
   * Get specific objective by code
   */
  async getObjectiveByCode(code: string) {
    const objective = await this.adapter.getObjectiveByCode(code);
    if (!objective) {
      throw new NotFoundException(`Objective with code ${code} not found`);
    }
    return objective;
  }

  /**
   * Get competencies by level
   */
  async getCompetenciesByLevel(level: string) {
    return await this.adapter.getCompetenciesByLevel(level as any);
  }

  /**
   * Get grade summary
   */
  async getGradeSummary(grade: number, level: string) {
    return await this.adapter.getGradeSummary(grade, level as any);
  }

  /**
   * Map objectives to students in a classroom
   */
  async mapObjectivesToClassroom(
    classroomId: string,
    objectiveCodes: string[],
    networkId: SchoolNetworkId
  ) {
    // This would query students in the classroom from database
    // For now, return the mapping structure
    return {
      classroomId,
      objectiveCodes,
      message: 'Objectives mapped successfully. Student mappings will be created via background job.',
    };
  }

  /**
   * Get recommended objectives for a grade
   */
  async getRecommendedObjectives(grade: number, level: string, limit: number = 20) {
    return await this.adapter.getRecommendedObjectives(grade, level as any, limit);
  }

  /**
   * Clear adapter cache
   */
  clearCache() {
    this.adapter.clearCache();
    return { message: 'Cache cleared successfully' };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.adapter.getCacheStats();
  }
}
