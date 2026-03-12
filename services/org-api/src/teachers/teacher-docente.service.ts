/**
 * Teacher DocenTe Service
 *
 * Service for managing teacher psychological profiles (Big Five)
 * and calculating adaptation protocols for metacognitive strategies.
 *
 * @module @organizoptera/org-api/teachers/teacher-docente
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDocenteProfileDto,
  UpdateDocenteProfileDto,
  UpdateBurnoutRiskDto,
  AdaptationProtocol,
  BurnoutRiskLevel,
  type DocenteProfileData,
  type DocenteProfileResponse,
  type ProtocolCalculationResult,
} from './dto/docente-profile.dto';

// =============================================================================
// PROTOCOL CALCULATION THRESHOLDS
// =============================================================================

const T_SCORE_LOW = 40;
const T_SCORE_HIGH = 60;

// =============================================================================
// SERVICE
// =============================================================================

@Injectable()
export class TeacherDocenteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get teacher's DocenTe profile
   */
  async getProfile(teacherId: string): Promise<DocenteProfileResponse> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        metadata: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    const metadata = teacher.metadata as Record<string, unknown> | null;
    const profile = metadata?.docente as DocenteProfileData | undefined;

    return {
      teacherId: teacher.id,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      profile: profile ?? null,
      hasProfile: !!profile,
    };
  }

  /**
   * Create or update DocenTe profile
   */
  async createOrUpdateProfile(
    teacherId: string,
    dto: CreateDocenteProfileDto
  ): Promise<DocenteProfileResponse> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, lastName: true, metadata: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    // Calculate adaptation protocol
    const protocolResult = this.calculateProtocol(dto.domainScores);

    // Build profile data
    const profileData: DocenteProfileData = {
      bigFive: {
        domainScores: dto.domainScores,
        facetScores: dto.facetScores,
        reliability: dto.reliability,
      },
      assessment: {
        method: dto.assessmentMethod,
        assessedAt: dto.assessedAt,
        assessorId: dto.assessorId,
      },
      protocol: {
        selected: protocolResult.protocol,
        confidence: protocolResult.confidence,
        calculatedAt: new Date().toISOString(),
      },
      burnoutRisk: dto.burnoutRisk
        ? {
            level: dto.burnoutRisk.level,
            score: dto.burnoutRisk.score,
            assessedAt: dto.burnoutRisk.assessedAt,
            factors: dto.burnoutRisk.factors,
          }
        : undefined,
      notes: dto.notes,
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    // Merge with existing metadata
    const existingMetadata = (teacher.metadata as Record<string, unknown>) || {};
    const newMetadata = {
      ...existingMetadata,
      docente: profileData,
    };

    // Update teacher
    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { metadata: newMetadata as unknown as Prisma.InputJsonValue },
    });

    return {
      teacherId: teacher.id,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      profile: profileData,
      hasProfile: true,
    };
  }

  /**
   * Update existing profile
   */
  async updateProfile(
    teacherId: string,
    dto: UpdateDocenteProfileDto
  ): Promise<DocenteProfileResponse> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, lastName: true, metadata: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    const metadata = teacher.metadata as Record<string, unknown> | null;
    const existingProfile = metadata?.docente as DocenteProfileData | undefined;

    if (!existingProfile) {
      throw new BadRequestException(
        `Teacher ${teacherId} does not have a DocenTe profile. Use POST to create one.`
      );
    }

    // Merge updates
    const updatedDomainScores = dto.domainScores ?? existingProfile.bigFive.domainScores;

    // Recalculate protocol if domain scores changed
    let protocol = existingProfile.protocol;
    if (dto.domainScores) {
      const protocolResult = this.calculateProtocol(dto.domainScores);
      protocol = {
        selected: protocolResult.protocol,
        confidence: protocolResult.confidence,
        calculatedAt: new Date().toISOString(),
      };
    }

    const updatedProfile: DocenteProfileData = {
      bigFive: {
        domainScores: updatedDomainScores,
        facetScores: dto.facetScores ?? existingProfile.bigFive.facetScores,
        reliability: dto.reliability ?? existingProfile.bigFive.reliability,
      },
      assessment: {
        method: dto.assessmentMethod ?? existingProfile.assessment.method,
        assessedAt: dto.assessedAt ?? existingProfile.assessment.assessedAt,
        assessorId: dto.assessorId ?? existingProfile.assessment.assessorId,
      },
      protocol,
      burnoutRisk: dto.burnoutRisk
        ? {
            level: dto.burnoutRisk.level,
            score: dto.burnoutRisk.score,
            assessedAt: dto.burnoutRisk.assessedAt,
            factors: dto.burnoutRisk.factors,
          }
        : existingProfile.burnoutRisk,
      notes: dto.notes ?? existingProfile.notes,
      version: existingProfile.version + 1,
      updatedAt: new Date().toISOString(),
    };

    // Update metadata
    const newMetadata = {
      ...metadata,
      docente: updatedProfile,
    };

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { metadata: newMetadata as unknown as Prisma.InputJsonValue },
    });

    return {
      teacherId: teacher.id,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      profile: updatedProfile,
      hasProfile: true,
    };
  }

  /**
   * Update burnout risk assessment
   */
  async updateBurnoutRisk(
    teacherId: string,
    dto: UpdateBurnoutRiskDto
  ): Promise<DocenteProfileResponse> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, firstName: true, lastName: true, metadata: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    const metadata = teacher.metadata as Record<string, unknown> | null;
    const existingProfile = metadata?.docente as DocenteProfileData | undefined;

    if (!existingProfile) {
      throw new BadRequestException(
        `Teacher ${teacherId} does not have a DocenTe profile. Create profile first.`
      );
    }

    const updatedProfile: DocenteProfileData = {
      ...existingProfile,
      burnoutRisk: {
        level: dto.level,
        score: dto.score,
        assessedAt: new Date().toISOString(),
        factors: dto.factors,
      },
      version: existingProfile.version + 1,
      updatedAt: new Date().toISOString(),
    };

    const newMetadata = {
      ...metadata,
      docente: updatedProfile,
    };

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { metadata: newMetadata as unknown as Prisma.InputJsonValue },
    });

    return {
      teacherId: teacher.id,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      profile: updatedProfile,
      hasProfile: true,
    };
  }

  /**
   * Get adaptation protocol for teacher
   */
  async getProtocol(teacherId: string): Promise<ProtocolCalculationResult & { teacherId: string }> {
    const { profile } = await this.getProfile(teacherId);

    if (!profile) {
      throw new BadRequestException(
        `Teacher ${teacherId} does not have a DocenTe profile`
      );
    }

    const result = this.calculateProtocol(profile.bigFive.domainScores);

    return {
      teacherId,
      ...result,
    };
  }

  /**
   * Delete DocenTe profile
   */
  async deleteProfile(teacherId: string): Promise<{ message: string }> {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { id: true, metadata: true },
    });

    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    const metadata = teacher.metadata as Record<string, unknown> | null;

    if (!metadata?.docente) {
      throw new BadRequestException(
        `Teacher ${teacherId} does not have a DocenTe profile`
      );
    }

    // Remove docente from metadata
    const { docente: _, ...remainingMetadata } = metadata;

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: { metadata: (Object.keys(remainingMetadata).length > 0 ? remainingMetadata : null) as Prisma.InputJsonValue },
    });

    return { message: 'DocenTe profile deleted successfully' };
  }

  /**
   * List teachers with profiles in a school
   */
  async listProfilesBySchool(schoolId: string): Promise<DocenteProfileResponse[]> {
    const teachers = await this.prisma.teacher.findMany({
      where: { schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        metadata: true,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return teachers.map((teacher: typeof teachers[number]) => {
      const metadata = teacher.metadata as Record<string, unknown> | null;
      const profile = metadata?.docente as DocenteProfileData | undefined;

      return {
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        profile: profile ?? null,
        hasProfile: !!profile,
      };
    });
  }

  /**
   * Get teachers by burnout risk level
   */
  async getTeachersByBurnoutRisk(
    schoolId: string,
    level: BurnoutRiskLevel
  ): Promise<DocenteProfileResponse[]> {
    const teachers = await this.prisma.teacher.findMany({
      where: { schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        metadata: true,
      },
    });

    return teachers
      .filter((teacher: typeof teachers[number]) => {
        const metadata = teacher.metadata as Record<string, unknown> | null;
        const profile = metadata?.docente as DocenteProfileData | undefined;
        return profile?.burnoutRisk?.level === level;
      })
      .map((teacher: typeof teachers[number]) => {
        const metadata = teacher.metadata as Record<string, unknown> | null;
        const profile = metadata?.docente as DocenteProfileData | undefined;

        return {
          teacherId: teacher.id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          profile: profile ?? null,
          hasProfile: !!profile,
        };
      });
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Calculate adaptation protocol based on Big Five scores
   *
   * Protocol selection based on psychological profile patterns:
   * - EXTREME_SEGMENTATION: Low conscientiousness + high neuroticism
   * - MICRO_MILESTONES: Low achievement striving + high vulnerability
   * - DEEP_EXPLORATION: High openness (intellect + imagination)
   * - CONFIDENCE_BUILDING: Low extraversion + low self-efficacy
   * - STRUCTURED_AUTONOMY: Low orderliness + high conscientiousness
   * - CALM_CHALLENGE: High neuroticism + high conscientiousness
   * - SOCIAL_SCAFFOLDING: Low extraversion + high agreeableness
   * - STANDARD: Balanced profile
   */
  private calculateProtocol(
    scores: { openness: number; conscientiousness: number; extraversion: number; agreeableness: number; neuroticism: number }
  ): ProtocolCalculationResult {
    const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = scores;

    const candidates: Array<{ protocol: AdaptationProtocol; score: number; reasons: string[] }> = [];

    // EXTREME_SEGMENTATION: Low self-discipline + high anxiety
    if (conscientiousness < T_SCORE_LOW && neuroticism > T_SCORE_HIGH) {
      candidates.push({
        protocol: AdaptationProtocol.EXTREME_SEGMENTATION,
        score: (T_SCORE_LOW - conscientiousness + neuroticism - T_SCORE_HIGH) / 40,
        reasons: [
          'Baixa autodisciplina identificada',
          'Níveis elevados de ansiedade',
          'Beneficia de tarefas fragmentadas em micro-etapas',
        ],
      });
    }

    // DEEP_EXPLORATION: High intellect + imagination (openness)
    if (openness > T_SCORE_HIGH) {
      candidates.push({
        protocol: AdaptationProtocol.DEEP_EXPLORATION,
        score: (openness - T_SCORE_HIGH) / 20,
        reasons: [
          'Alta curiosidade intelectual',
          'Forte imaginação e criatividade',
          'Beneficia de exploração profunda de tópicos',
        ],
      });
    }

    // CONFIDENCE_BUILDING: Low extraversion + low self-efficacy
    if (extraversion < T_SCORE_LOW && conscientiousness < 50) {
      candidates.push({
        protocol: AdaptationProtocol.CONFIDENCE_BUILDING,
        score: (T_SCORE_LOW - extraversion + 50 - conscientiousness) / 40,
        reasons: [
          'Reservado e introspectivo',
          'Autoeficácia pode ser desenvolvida',
          'Beneficia de evidenciar conquistas progressivas',
        ],
      });
    }

    // CALM_CHALLENGE: High anxiety + high conscientiousness
    if (neuroticism > T_SCORE_HIGH && conscientiousness > T_SCORE_HIGH) {
      candidates.push({
        protocol: AdaptationProtocol.CALM_CHALLENGE,
        score: (neuroticism - T_SCORE_HIGH + conscientiousness - T_SCORE_HIGH) / 40,
        reasons: [
          'Perfeccionista com tendência à ansiedade',
          'Alta responsabilidade mas preocupação excessiva',
          'Beneficia de desafios graduais com suporte emocional',
        ],
      });
    }

    // SOCIAL_SCAFFOLDING: Low extraversion + high agreeableness
    if (extraversion < T_SCORE_LOW && agreeableness > T_SCORE_HIGH) {
      candidates.push({
        protocol: AdaptationProtocol.SOCIAL_SCAFFOLDING,
        score: (T_SCORE_LOW - extraversion + agreeableness - T_SCORE_HIGH) / 40,
        reasons: [
          'Prefere interações estruturadas',
          'Alta empatia e cooperação',
          'Beneficia de scaffolding social progressivo',
        ],
      });
    }

    // STRUCTURED_AUTONOMY: Varied profile needing structure
    if (
      openness > 50 &&
      conscientiousness < 50 &&
      neuroticism > 45 &&
      neuroticism < 55
    ) {
      candidates.push({
        protocol: AdaptationProtocol.STRUCTURED_AUTONOMY,
        score: 0.5,
        reasons: [
          'Criativo mas precisa de estrutura',
          'Beneficia de autonomia dentro de limites claros',
        ],
      });
    }

    // MICRO_MILESTONES: Low achievement-striving pattern
    if (conscientiousness < 45 && neuroticism > 55) {
      candidates.push({
        protocol: AdaptationProtocol.MICRO_MILESTONES,
        score: (45 - conscientiousness + neuroticism - 55) / 30,
        reasons: [
          'Pode ter dificuldade com metas de longo prazo',
          'Beneficia de marcos pequenos e frequentes',
        ],
      });
    }

    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    // If no specific protocol matched, use STANDARD
    if (candidates.length === 0) {
      return {
        protocol: AdaptationProtocol.STANDARD,
        confidence: 0.8,
        reasons: [
          'Perfil equilibrado',
          'Não requer adaptações específicas',
          'Abordagem padrão recomendada',
        ],
        alternativeProtocols: [],
      };
    }

    const selected = candidates[0];
    const alternatives = candidates.slice(1, 4);

    return {
      protocol: selected.protocol,
      confidence: Math.min(selected.score, 1),
      reasons: selected.reasons,
      alternativeProtocols: alternatives.map((c) => ({
        protocol: c.protocol,
        score: Math.min(c.score, 1),
      })),
    };
  }
}
