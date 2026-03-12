import { describe, it, expect, beforeEach } from 'vitest';
import { CurriculopteraAdapter } from '../curriculoptera-adapter';

describe('CurriculopteraAdapter', () => {
  let adapter: CurriculopteraAdapter;

  beforeEach(() => {
    adapter = new CurriculopteraAdapter();
  });

  describe('searchStandards', () => {
    it('should search objectives by grade', async () => {
      const result = await adapter.searchStandards({ grade: 1, level: 'EF' });

      expect(result.objectives.length).toBeGreaterThan(0);
      expect(result.objectives[0].grade).toBe(1);
      expect(result.objectives[0].level).toBe('EF');
    });

    it('should search objectives by area', async () => {
      const result = await adapter.searchStandards({ area: 'MATEMATICA' });

      expect(result.objectives.length).toBeGreaterThan(0);
      result.objectives.forEach(obj => {
        expect(obj.area).toBe('MATEMATICA');
      });
    });

    it('should search objectives by component', async () => {
      const result = await adapter.searchStandards({ component: 'Matemática' });

      expect(result.objectives.length).toBeGreaterThan(0);
      result.objectives.forEach(obj => {
        expect(obj.component).toContain('Matemática');
      });
    });

    it('should search objectives by search term', async () => {
      const result = await adapter.searchStandards({ searchTerm: 'multiplicação' });

      expect(result.objectives.length).toBeGreaterThan(0);
      expect(result.objectives[0].description).toContain('multiplicação');
    });

    it('should paginate results', async () => {
      const result1 = await adapter.searchStandards({ limit: 2, offset: 0 });
      const result2 = await adapter.searchStandards({ limit: 2, offset: 2 });

      expect(result1.objectives.length).toBeLessThanOrEqual(2);
      expect(result2.objectives.length).toBeLessThanOrEqual(2);
      
      if (result1.objectives.length > 0 && result2.objectives.length > 0) {
        expect(result1.objectives[0].id).not.toBe(result2.objectives[0].id);
      }
    });

    it('should include related competencies', async () => {
      const result = await adapter.searchStandards({ grade: 1 });

      expect(result.competencies.length).toBeGreaterThan(0);
    });

    it('should indicate if there are more results', async () => {
      const result = await adapter.searchStandards({ limit: 1 });

      if (result.total > 1) {
        expect(result.hasMore).toBe(true);
      }
    });
  });

  describe('getObjectivesByGrade', () => {
    it('should get all objectives for grade 1', async () => {
      const objectives = await adapter.getObjectivesByGrade(1, 'EF');

      expect(objectives.length).toBeGreaterThan(0);
      objectives.forEach(obj => {
        expect(obj.grade).toBe(1);
        expect(obj.level).toBe('EF');
      });
    });

    it('should get all objectives for grade 4', async () => {
      const objectives = await adapter.getObjectivesByGrade(4, 'EF');

      expect(objectives.length).toBeGreaterThan(0);
      objectives.forEach(obj => {
        expect(obj.grade).toBe(4);
      });
    });
  });

  describe('getObjectiveByCode', () => {
    it('should get objective by code', async () => {
      const objective = await adapter.getObjectiveByCode('EF01MA01');

      expect(objective).not.toBeNull();
      expect(objective?.code).toBe('EF01MA01');
      expect(objective?.grade).toBe(1);
    });

    it('should return null for non-existent code', async () => {
      const objective = await adapter.getObjectiveByCode('INVALID_CODE');

      expect(objective).toBeNull();
    });
  });

  describe('getCompetenciesByLevel', () => {
    it('should get competencies for EF level', async () => {
      const competencies = await adapter.getCompetenciesByLevel('EF');

      expect(competencies.length).toBeGreaterThan(0);
      competencies.forEach(comp => {
        expect(comp.level).toBe('EF');
      });
    });
  });

  describe('getGradeSummary', () => {
    it('should get summary for grade 1', async () => {
      const summary = await adapter.getGradeSummary(1, 'EF');

      expect(summary.grade).toBe(1);
      expect(summary.level).toBe('EF');
      expect(summary.totalObjectives).toBeGreaterThan(0);
      expect(summary.objectivesByArea).toBeDefined();
      expect(summary.objectivesByComponent).toBeDefined();
    });

    it('should count objectives by area correctly', async () => {
      const summary = await adapter.getGradeSummary(1, 'EF');

      const totalByArea = Object.values(summary.objectivesByArea).reduce((sum, count) => sum + count, 0);
      expect(totalByArea).toBe(summary.totalObjectives);
    });
  });

  describe('mapObjectivesToStudents', () => {
    it('should map objectives to students', async () => {
      const studentIds = ['student-1', 'student-2'];
      const objectiveCodes = ['EF01MA01', 'EF01MA06'];

      const mappings = await adapter.mapObjectivesToStudents(studentIds, objectiveCodes);

      expect(mappings.length).toBe(4); // 2 students × 2 objectives
      expect(mappings[0].studentId).toBe('student-1');
      expect(mappings[0].masteryLevel).toBe(0);
      expect(mappings[0].isActive).toBe(true);
    });

    it('should handle invalid objective codes', async () => {
      const studentIds = ['student-1'];
      const objectiveCodes = ['INVALID'];

      const mappings = await adapter.mapObjectivesToStudents(studentIds, objectiveCodes);

      expect(mappings.length).toBe(0);
    });
  });

  describe('getRecommendedObjectives', () => {
    it('should get recommended objectives for a grade', async () => {
      const objectives = await adapter.getRecommendedObjectives(1, 'EF', 5);

      expect(objectives.length).toBeLessThanOrEqual(5);
      objectives.forEach(obj => {
        expect(obj.grade).toBe(1);
        expect(obj.level).toBe('EF');
      });
    });
  });

  describe('cache', () => {
    it('should cache search results', async () => {
      const adapter = new CurriculopteraAdapter({ enableCache: true });

      // First call
      await adapter.searchStandards({ grade: 1 });

      const stats = adapter.getCacheStats();
      expect(stats.entries).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      const adapter = new CurriculopteraAdapter({ enableCache: true });

      await adapter.searchStandards({ grade: 1 });
      adapter.clearCache();

      const stats = adapter.getCacheStats();
      expect(stats.entries).toBe(0);
    });

    it('should work with cache disabled', async () => {
      const adapter = new CurriculopteraAdapter({ enableCache: false });

      const result = await adapter.searchStandards({ grade: 1 });

      expect(result.objectives.length).toBeGreaterThan(0);

      const stats = adapter.getCacheStats();
      expect(stats.entries).toBe(0);
    });
  });
});
