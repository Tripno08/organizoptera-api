/**
 * DocenTe Profile DTO
 *
 * DTOs for managing teacher psychological profiles (Big Five)
 * and adaptation protocols for metacognitive strategy recommendations.
 *
 * @module @organizoptera/org-api/teachers/dto/docente-profile
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Big Five personality domains
 */
export enum BigFiveDomain {
  OPENNESS = 'openness',
  CONSCIENTIOUSNESS = 'conscientiousness',
  EXTRAVERSION = 'extraversion',
  AGREEABLENESS = 'agreeableness',
  NEUROTICISM = 'neuroticism',
}

/**
 * Adaptation protocols for metacognitive strategies
 * Based on psychological profile patterns
 */
export enum AdaptationProtocol {
  EXTREME_SEGMENTATION = 'EXTREME_SEGMENTATION',
  MICRO_MILESTONES = 'MICRO_MILESTONES',
  DEEP_EXPLORATION = 'DEEP_EXPLORATION',
  CONFIDENCE_BUILDING = 'CONFIDENCE_BUILDING',
  STRUCTURED_AUTONOMY = 'STRUCTURED_AUTONOMY',
  CALM_CHALLENGE = 'CALM_CHALLENGE',
  SOCIAL_SCAFFOLDING = 'SOCIAL_SCAFFOLDING',
  STANDARD = 'STANDARD',
}

/**
 * Burnout risk levels (from DocenTe assessment)
 */
export enum BurnoutRiskLevel {
  BAIXO = 'BAIXO',
  MODERADO = 'MODERADO',
  ALTO = 'ALTO',
  CRITICO = 'CRÍTICO',
}

/**
 * Assessment methods
 */
export enum AssessmentMethod {
  IPIP_NEO_120 = 'IPIP-NEO-120',
  IPIP_NEO_60 = 'IPIP-NEO-60',
  BFI_44 = 'BFI-44',
  BFI_10 = 'BFI-10',
  TIPI = 'TIPI',
  CUSTOM = 'CUSTOM',
}

// =============================================================================
// NESTED DTOs
// =============================================================================

/**
 * Big Five domain scores (T-scores: 20-80)
 */
export class BigFiveDomainScoresDto {
  @IsNumber()
  @Min(20)
  @Max(80)
  openness: number;

  @IsNumber()
  @Min(20)
  @Max(80)
  conscientiousness: number;

  @IsNumber()
  @Min(20)
  @Max(80)
  extraversion: number;

  @IsNumber()
  @Min(20)
  @Max(80)
  agreeableness: number;

  @IsNumber()
  @Min(20)
  @Max(80)
  neuroticism: number;
}

/**
 * Burnout risk assessment
 */
export class BurnoutRiskDto {
  @IsEnum(BurnoutRiskLevel)
  level: BurnoutRiskLevel;

  @IsNumber()
  @Min(0)
  @Max(1)
  score: number;

  @IsDateString()
  assessedAt: string;

  @IsOptional()
  @IsString({ each: true })
  factors?: string[];
}

// =============================================================================
// MAIN DTOs
// =============================================================================

/**
 * Create DocenTe profile DTO
 */
export class CreateDocenteProfileDto {
  @ValidateNested()
  @Type(() => BigFiveDomainScoresDto)
  domainScores: BigFiveDomainScoresDto;

  @IsOptional()
  @IsObject()
  facetScores?: Record<string, number>;

  @IsEnum(AssessmentMethod)
  assessmentMethod: AssessmentMethod;

  @IsDateString()
  assessedAt: string;

  @IsOptional()
  @IsString()
  assessorId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  reliability?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => BurnoutRiskDto)
  burnoutRisk?: BurnoutRiskDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Update DocenTe profile DTO
 */
export class UpdateDocenteProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => BigFiveDomainScoresDto)
  domainScores?: BigFiveDomainScoresDto;

  @IsOptional()
  @IsObject()
  facetScores?: Record<string, number>;

  @IsOptional()
  @IsEnum(AssessmentMethod)
  assessmentMethod?: AssessmentMethod;

  @IsOptional()
  @IsDateString()
  assessedAt?: string;

  @IsOptional()
  @IsString()
  assessorId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  reliability?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => BurnoutRiskDto)
  burnoutRisk?: BurnoutRiskDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Update burnout risk DTO
 */
export class UpdateBurnoutRiskDto {
  @IsEnum(BurnoutRiskLevel)
  level: BurnoutRiskLevel;

  @IsNumber()
  @Min(0)
  @Max(1)
  score: number;

  @IsOptional()
  @IsString({ each: true })
  factors?: string[];
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * DocenTe profile stored in Teacher.metadata
 */
export interface DocenteProfileData {
  bigFive: {
    domainScores: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    facetScores?: Record<string, number>;
    reliability?: number;
  };
  assessment: {
    method: AssessmentMethod;
    assessedAt: string;
    assessorId?: string;
  };
  protocol: {
    selected: AdaptationProtocol;
    confidence: number;
    calculatedAt: string;
  };
  burnoutRisk?: {
    level: BurnoutRiskLevel;
    score: number;
    assessedAt: string;
    factors?: string[];
  };
  notes?: string;
  version: number;
  updatedAt: string;
}

/**
 * DocenTe profile response
 */
export interface DocenteProfileResponse {
  teacherId: string;
  teacherName: string;
  profile: DocenteProfileData | null;
  hasProfile: boolean;
}

/**
 * Protocol calculation result
 */
export interface ProtocolCalculationResult {
  protocol: AdaptationProtocol;
  confidence: number;
  reasons: string[];
  alternativeProtocols: Array<{
    protocol: AdaptationProtocol;
    score: number;
  }>;
}
