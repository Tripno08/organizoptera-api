/**
 * @organizoptera/org-api - Teacher DocenTe Service Tests
 *
 * Tests for teacher psychological profile management and adaptation protocol calculation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeacherDocenteService } from '../teacher-docente.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AdaptationProtocol, AssessmentMethod, BurnoutRiskLevel } from '../dto/docente-profile.dto';

describe('TeacherDocenteService', () => {
  // Mock PrismaService
  const mockPrisma = {
    teacher: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };

  let service: TeacherDocenteService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TeacherDocenteService(mockPrisma as any);
  });

  describe('getProfile', () => {
    it('should return profile when teacher has one', async () => {
      const mockProfile = {
        bigFive: {
          domainScores: { openness: 55, conscientiousness: 60, extraversion: 45, agreeableness: 50, neuroticism: 40 },
          facetScores: {},
          reliability: 0.85,
        },
        assessment: {
          method: 'IPIP-NEO-120',
          assessedAt: '2024-01-15',
          assessorId: 'assessor-1',
        },
        protocol: {
          selected: AdaptationProtocol.STANDARD,
          confidence: 0.8,
          calculatedAt: '2024-01-15',
        },
        version: 1,
        updatedAt: '2024-01-15',
      };

      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: mockProfile },
      });

      const result = await service.getProfile('teacher-1');

      expect(result.teacherId).toBe('teacher-1');
      expect(result.teacherName).toBe('Maria Silva');
      expect(result.hasProfile).toBe(true);
      expect(result.profile).toEqual(mockProfile);
    });

    it('should return null profile when teacher has none', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'João',
        lastName: 'Santos',
        metadata: null,
      });

      const result = await service.getProfile('teacher-1');

      expect(result.teacherId).toBe('teacher-1');
      expect(result.hasProfile).toBe(false);
      expect(result.profile).toBeNull();
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.getProfile('non-existent')).rejects.toThrow('Teacher with ID non-existent not found');
    });

    it('should handle metadata without docente key', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Ana',
        lastName: 'Costa',
        metadata: { someOtherData: true },
      });

      const result = await service.getProfile('teacher-1');

      expect(result.hasProfile).toBe(false);
      expect(result.profile).toBeNull();
    });
  });

  describe('createOrUpdateProfile', () => {
    const createDto = {
      domainScores: {
        openness: 55,
        conscientiousness: 60,
        extraversion: 45,
        agreeableness: 50,
        neuroticism: 40,
      },
      facetScores: {},
      reliability: 0.85,
      assessmentMethod: AssessmentMethod.IPIP_NEO_120,
      assessedAt: '2024-01-15',
      assessorId: 'assessor-1',
    };

    it('should create a new profile successfully', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.createOrUpdateProfile('teacher-1', createDto);

      expect(result.teacherId).toBe('teacher-1');
      expect(result.hasProfile).toBe(true);
      expect(result.profile?.bigFive.domainScores).toEqual(createDto.domainScores);
      expect(mockPrisma.teacher.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.createOrUpdateProfile('non-existent', createDto)).rejects.toThrow(NotFoundException);
    });

    it('should calculate protocol based on domain scores', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.createOrUpdateProfile('teacher-1', createDto);

      expect(result.profile?.protocol.selected).toBeDefined();
      expect(result.profile?.protocol.confidence).toBeGreaterThan(0);
    });

    it('should merge with existing metadata', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { existingKey: 'existingValue' },
      });
      mockPrisma.teacher.update.mockImplementation((args: any) => {
        expect(args.data.metadata.existingKey).toBe('existingValue');
        expect(args.data.metadata.docente).toBeDefined();
        return Promise.resolve({});
      });

      await service.createOrUpdateProfile('teacher-1', createDto);
    });

    it('should include burnout risk when provided', async () => {
      const dtoWithBurnout = {
        ...createDto,
        burnoutRisk: {
          level: BurnoutRiskLevel.MODERADO,
          score: 55,
          assessedAt: '2024-01-15',
          factors: ['workload', 'isolation'],
        },
      };

      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.createOrUpdateProfile('teacher-1', dtoWithBurnout);

      expect(result.profile?.burnoutRisk?.level).toBe(BurnoutRiskLevel.MODERADO);
      expect(result.profile?.burnoutRisk?.factors).toContain('workload');
    });

    it('should include notes when provided', async () => {
      const dtoWithNotes = {
        ...createDto,
        notes: 'Initial assessment notes',
      };

      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.createOrUpdateProfile('teacher-1', dtoWithNotes);

      expect(result.profile?.notes).toBe('Initial assessment notes');
    });

    it('should set version to 1 for new profile', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.createOrUpdateProfile('teacher-1', createDto);

      expect(result.profile?.version).toBe(1);
    });
  });

  describe('updateProfile', () => {
    const existingProfile = {
      bigFive: {
        domainScores: { openness: 55, conscientiousness: 60, extraversion: 45, agreeableness: 50, neuroticism: 40 },
        facetScores: {},
        reliability: 0.85,
      },
      assessment: {
        method: 'IPIP-NEO-120',
        assessedAt: '2024-01-15',
        assessorId: 'assessor-1',
      },
      protocol: {
        selected: AdaptationProtocol.STANDARD,
        confidence: 0.8,
        calculatedAt: '2024-01-15',
      },
      version: 1,
      updatedAt: '2024-01-15',
    };

    it('should update existing profile', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: existingProfile },
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const updateDto = { notes: 'Updated notes' };
      const result = await service.updateProfile('teacher-1', updateDto);

      expect(result.profile?.notes).toBe('Updated notes');
      expect(result.profile?.version).toBe(2);
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.updateProfile('non-existent', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no profile exists', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });

      await expect(service.updateProfile('teacher-1', {})).rejects.toThrow(BadRequestException);
      await expect(service.updateProfile('teacher-1', {})).rejects.toThrow(
        'Teacher teacher-1 does not have a DocenTe profile. Use POST to create one.'
      );
    });

    it('should recalculate protocol when domain scores updated', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: existingProfile },
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const updateDto = {
        domainScores: { openness: 70, conscientiousness: 35, extraversion: 30, agreeableness: 70, neuroticism: 65 },
      };
      const result = await service.updateProfile('teacher-1', updateDto);

      // Protocol should be recalculated based on new scores
      expect(result.profile?.protocol.calculatedAt).not.toBe(existingProfile.protocol.calculatedAt);
    });

    it('should preserve existing values when not updated', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: existingProfile },
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.updateProfile('teacher-1', { notes: 'New notes' });

      expect(result.profile?.bigFive.reliability).toBe(0.85);
      expect(result.profile?.assessment.method).toBe('IPIP-NEO-120');
    });

    it('should increment version on update', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: { ...existingProfile, version: 5 } },
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.updateProfile('teacher-1', {});

      expect(result.profile?.version).toBe(6);
    });
  });

  describe('updateBurnoutRisk', () => {
    const existingProfile = {
      bigFive: {
        domainScores: { openness: 55, conscientiousness: 60, extraversion: 45, agreeableness: 50, neuroticism: 40 },
        facetScores: {},
        reliability: 0.85,
      },
      assessment: { method: 'IPIP-NEO-120', assessedAt: '2024-01-15', assessorId: 'assessor-1' },
      protocol: { selected: AdaptationProtocol.STANDARD, confidence: 0.8, calculatedAt: '2024-01-15' },
      version: 1,
      updatedAt: '2024-01-15',
    };

    const burnoutDto = {
      level: BurnoutRiskLevel.ALTO,
      score: 75,
      factors: ['workload', 'isolation', 'lack_of_support'],
    };

    it('should update burnout risk successfully', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: existingProfile },
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.updateBurnoutRisk('teacher-1', burnoutDto);

      expect(result.profile?.burnoutRisk?.level).toBe(BurnoutRiskLevel.ALTO);
      expect(result.profile?.burnoutRisk?.score).toBe(75);
      expect(result.profile?.burnoutRisk?.factors).toHaveLength(3);
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.updateBurnoutRisk('non-existent', burnoutDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no profile exists', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });

      await expect(service.updateBurnoutRisk('teacher-1', burnoutDto)).rejects.toThrow(BadRequestException);
      await expect(service.updateBurnoutRisk('teacher-1', burnoutDto)).rejects.toThrow(
        'Teacher teacher-1 does not have a DocenTe profile. Create profile first.'
      );
    });

    it('should set assessedAt to current time', async () => {
      const beforeTest = new Date().toISOString();
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: existingProfile },
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.updateBurnoutRisk('teacher-1', burnoutDto);

      expect(result.profile?.burnoutRisk?.assessedAt).toBeDefined();
      expect(new Date(result.profile!.burnoutRisk!.assessedAt).getTime()).toBeGreaterThanOrEqual(new Date(beforeTest).getTime());
    });

    it('should increment version on burnout update', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: existingProfile },
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const result = await service.updateBurnoutRisk('teacher-1', burnoutDto);

      expect(result.profile?.version).toBe(2);
    });
  });

  describe('getProtocol', () => {
    const existingProfile = {
      bigFive: {
        domainScores: { openness: 55, conscientiousness: 60, extraversion: 45, agreeableness: 50, neuroticism: 40 },
        facetScores: {},
        reliability: 0.85,
      },
      assessment: { method: 'IPIP-NEO-120', assessedAt: '2024-01-15', assessorId: 'assessor-1' },
      protocol: { selected: AdaptationProtocol.STANDARD, confidence: 0.8, calculatedAt: '2024-01-15' },
      version: 1,
      updatedAt: '2024-01-15',
    };

    it('should return protocol calculation', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: existingProfile },
      });

      const result = await service.getProtocol('teacher-1');

      expect(result.teacherId).toBe('teacher-1');
      expect(result.protocol).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.reasons).toBeDefined();
    });

    it('should throw BadRequestException when no profile exists', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });

      await expect(service.getProtocol('teacher-1')).rejects.toThrow(BadRequestException);
      await expect(service.getProtocol('teacher-1')).rejects.toThrow(
        'Teacher teacher-1 does not have a DocenTe profile'
      );
    });
  });

  describe('deleteProfile', () => {
    const existingProfile = {
      bigFive: { domainScores: {}, facetScores: {}, reliability: 0 },
      assessment: { method: '', assessedAt: '', assessorId: '' },
      protocol: { selected: '', confidence: 0, calculatedAt: '' },
      version: 1,
      updatedAt: '',
    };

    it('should delete profile successfully', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        metadata: { docente: existingProfile, otherData: 'preserved' },
      });
      mockPrisma.teacher.update.mockImplementation((args: any) => {
        expect(args.data.metadata.docente).toBeUndefined();
        expect(args.data.metadata.otherData).toBe('preserved');
        return Promise.resolve({});
      });

      const result = await service.deleteProfile('teacher-1');

      expect(result.message).toBe('DocenTe profile deleted successfully');
    });

    it('should throw NotFoundException when teacher not found', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue(null);

      await expect(service.deleteProfile('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when no profile exists', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        metadata: null,
      });

      await expect(service.deleteProfile('teacher-1')).rejects.toThrow(BadRequestException);
      await expect(service.deleteProfile('teacher-1')).rejects.toThrow(
        'Teacher teacher-1 does not have a DocenTe profile'
      );
    });

    it('should set metadata to null when docente is only key', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        metadata: { docente: existingProfile },
      });
      mockPrisma.teacher.update.mockImplementation((args: any) => {
        expect(args.data.metadata).toBeNull();
        return Promise.resolve({});
      });

      await service.deleteProfile('teacher-1');
    });
  });

  describe('listProfilesBySchool', () => {
    it('should return profiles for all teachers in school', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([
        {
          id: 'teacher-1',
          firstName: 'Maria',
          lastName: 'Silva',
          metadata: { docente: { version: 1 } },
        },
        {
          id: 'teacher-2',
          firstName: 'João',
          lastName: 'Santos',
          metadata: null,
        },
      ]);

      const result = await service.listProfilesBySchool('school-1');

      expect(result).toHaveLength(2);
      expect(result[0].hasProfile).toBe(true);
      expect(result[1].hasProfile).toBe(false);
    });

    it('should query with correct schoolId filter', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);

      await service.listProfilesBySchool('school-1');

      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: 'school-1' },
        })
      );
    });

    it('should order by lastName, firstName', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);

      await service.listProfilesBySchool('school-1');

      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        })
      );
    });

    it('should return empty array when no teachers', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([]);

      const result = await service.listProfilesBySchool('school-1');

      expect(result).toEqual([]);
    });
  });

  describe('getTeachersByBurnoutRisk', () => {
    it('should return teachers with specified burnout risk level', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([
        {
          id: 'teacher-1',
          firstName: 'Maria',
          lastName: 'Silva',
          metadata: { docente: { burnoutRisk: { level: 'ALTO' } } },
        },
        {
          id: 'teacher-2',
          firstName: 'João',
          lastName: 'Santos',
          metadata: { docente: { burnoutRisk: { level: 'BAIXO' } } },
        },
        {
          id: 'teacher-3',
          firstName: 'Ana',
          lastName: 'Costa',
          metadata: { docente: { burnoutRisk: { level: 'ALTO' } } },
        },
      ]);

      const result = await service.getTeachersByBurnoutRisk('school-1', BurnoutRiskLevel.ALTO);

      expect(result).toHaveLength(2);
      expect(result.every((t: any) => t.profile?.burnoutRisk?.level === 'ALTO')).toBe(true);
    });

    it('should filter out teachers without profiles', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([
        {
          id: 'teacher-1',
          firstName: 'Maria',
          lastName: 'Silva',
          metadata: null,
        },
      ]);

      const result = await service.getTeachersByBurnoutRisk('school-1', BurnoutRiskLevel.ALTO);

      expect(result).toHaveLength(0);
    });

    it('should filter out teachers without burnout risk', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([
        {
          id: 'teacher-1',
          firstName: 'Maria',
          lastName: 'Silva',
          metadata: { docente: { version: 1 } }, // No burnoutRisk
        },
      ]);

      const result = await service.getTeachersByBurnoutRisk('school-1', BurnoutRiskLevel.ALTO);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when no matches', async () => {
      mockPrisma.teacher.findMany.mockResolvedValue([
        {
          id: 'teacher-1',
          firstName: 'Maria',
          lastName: 'Silva',
          metadata: { docente: { burnoutRisk: { level: 'BAIXO' } } },
        },
      ]);

      const result = await service.getTeachersByBurnoutRisk('school-1', BurnoutRiskLevel.ALTO);

      expect(result).toEqual([]);
    });
  });

  describe('Protocol Calculation', () => {
    // These tests verify the private calculateProtocol method indirectly
    // by checking protocol selection in createOrUpdateProfile

    it('should select MICRO_MILESTONES for low conscientiousness + high neuroticism pattern', async () => {
      // Note: When both EXTREME_SEGMENTATION and MICRO_MILESTONES conditions are met,
      // MICRO_MILESTONES has a higher score due to its smaller denominator (30 vs 40)
      // and wider threshold ranges (C<45, N>55 vs C<40, N>60).
      // This is intentional - MICRO_MILESTONES is a gentler intervention.
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const dto = {
        domainScores: {
          openness: 50,
          conscientiousness: 35, // Low - triggers both protocols
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 65, // High - triggers both protocols
        },
        facetScores: {},
        reliability: 0.85,
        assessmentMethod: AssessmentMethod.IPIP_NEO_120,
        assessedAt: '2024-01-15',
        assessorId: 'assessor-1',
      };

      const result = await service.createOrUpdateProfile('teacher-1', dto);

      // MICRO_MILESTONES is selected because it scores higher than EXTREME_SEGMENTATION
      // when both are eligible (lower denominator = higher score).
      // With C=35, N=65:
      // - EXTREME_SEGMENTATION: (40-35 + 65-60)/40 = 0.25
      // - MICRO_MILESTONES: (45-35 + 65-55)/30 = 0.67
      expect(result.profile?.protocol.selected).toBe(AdaptationProtocol.MICRO_MILESTONES);
    });

    it('should select DEEP_EXPLORATION for high openness', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const dto = {
        domainScores: {
          openness: 70, // High (>60)
          conscientiousness: 50,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 50,
        },
        facetScores: {},
        reliability: 0.85,
        assessmentMethod: AssessmentMethod.IPIP_NEO_120,
        assessedAt: '2024-01-15',
        assessorId: 'assessor-1',
      };

      const result = await service.createOrUpdateProfile('teacher-1', dto);

      expect(result.profile?.protocol.selected).toBe(AdaptationProtocol.DEEP_EXPLORATION);
    });

    it('should select CONFIDENCE_BUILDING for low extraversion + moderate conscientiousness', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const dto = {
        domainScores: {
          openness: 50,
          conscientiousness: 45, // <50
          extraversion: 35, // Low (<40)
          agreeableness: 50,
          neuroticism: 50,
        },
        facetScores: {},
        reliability: 0.85,
        assessmentMethod: AssessmentMethod.IPIP_NEO_120,
        assessedAt: '2024-01-15',
        assessorId: 'assessor-1',
      };

      const result = await service.createOrUpdateProfile('teacher-1', dto);

      expect(result.profile?.protocol.selected).toBe(AdaptationProtocol.CONFIDENCE_BUILDING);
    });

    it('should select CALM_CHALLENGE for high neuroticism + high conscientiousness', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const dto = {
        domainScores: {
          openness: 50,
          conscientiousness: 65, // High (>60)
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 65, // High (>60)
        },
        facetScores: {},
        reliability: 0.85,
        assessmentMethod: AssessmentMethod.IPIP_NEO_120,
        assessedAt: '2024-01-15',
        assessorId: 'assessor-1',
      };

      const result = await service.createOrUpdateProfile('teacher-1', dto);

      expect(result.profile?.protocol.selected).toBe(AdaptationProtocol.CALM_CHALLENGE);
    });

    it('should select SOCIAL_SCAFFOLDING for low extraversion + high agreeableness', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const dto = {
        domainScores: {
          openness: 50,
          conscientiousness: 50,
          extraversion: 35, // Low (<40)
          agreeableness: 65, // High (>60)
          neuroticism: 50,
        },
        facetScores: {},
        reliability: 0.85,
        assessmentMethod: AssessmentMethod.IPIP_NEO_120,
        assessedAt: '2024-01-15',
        assessorId: 'assessor-1',
      };

      const result = await service.createOrUpdateProfile('teacher-1', dto);

      expect(result.profile?.protocol.selected).toBe(AdaptationProtocol.SOCIAL_SCAFFOLDING);
    });

    it('should select STANDARD for balanced profile', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: null,
      });
      mockPrisma.teacher.update.mockResolvedValue({});

      const dto = {
        domainScores: {
          openness: 50,
          conscientiousness: 55,
          extraversion: 50,
          agreeableness: 50,
          neuroticism: 45,
        },
        facetScores: {},
        reliability: 0.85,
        assessmentMethod: AssessmentMethod.IPIP_NEO_120,
        assessedAt: '2024-01-15',
        assessorId: 'assessor-1',
      };

      const result = await service.createOrUpdateProfile('teacher-1', dto);

      expect(result.profile?.protocol.selected).toBe(AdaptationProtocol.STANDARD);
      expect(result.profile?.protocol.confidence).toBe(0.8);
    });

    it('should include alternative protocols when multiple match', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: {
          bigFive: {
            domainScores: { openness: 70, conscientiousness: 35, extraversion: 35, agreeableness: 65, neuroticism: 65 },
            facetScores: {},
            reliability: 0.85,
          },
          assessment: { method: 'IPIP', assessedAt: '', assessorId: '' },
          protocol: { selected: '', confidence: 0, calculatedAt: '' },
          version: 1,
          updatedAt: '',
        }},
      });

      const result = await service.getProtocol('teacher-1');

      expect(result.alternativeProtocols).toBeDefined();
      expect(result.alternativeProtocols!.length).toBeGreaterThan(0);
    });

    it('should return reasons for protocol selection', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValue({
        id: 'teacher-1',
        firstName: 'Maria',
        lastName: 'Silva',
        metadata: { docente: {
          bigFive: {
            domainScores: { openness: 70, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50 },
            facetScores: {},
            reliability: 0.85,
          },
          assessment: { method: 'IPIP', assessedAt: '', assessorId: '' },
          protocol: { selected: '', confidence: 0, calculatedAt: '' },
          version: 1,
          updatedAt: '',
        }},
      });

      const result = await service.getProtocol('teacher-1');

      expect(result.reasons).toBeDefined();
      expect(result.reasons.length).toBeGreaterThan(0);
    });
  });
});
