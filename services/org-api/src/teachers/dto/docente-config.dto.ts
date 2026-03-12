/**
 * DocenTe Organization Configuration DTOs
 *
 * Configuration options for DocenTe module at the organization level.
 * Allows schools/networks to customize DocenTe behavior.
 *
 * @module @organizoptera/org-api/teachers/dto/docente-config
 */

import { IsBoolean, IsNumber, IsString, IsEnum, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AdaptationProtocol } from './docente-profile.dto';

// =============================================================================
// ASSESSMENT CONFIGURATION
// =============================================================================

/**
 * Assessment frequency options
 */
export enum AssessmentFrequency {
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMESTERLY = 'SEMESTERLY',
}

/**
 * Big Five assessment method
 */
export enum BigFiveAssessmentMethod {
  /** IPIP-NEO 120 items (full) */
  IPIP_NEO_120 = 'IPIP_NEO_120',
  /** IPIP-NEO 60 items (short) */
  IPIP_NEO_60 = 'IPIP_NEO_60',
  /** BFI-2 60 items */
  BFI2_60 = 'BFI2_60',
  /** BFI-10 (ultra-short) */
  BFI_10 = 'BFI_10',
  /** Custom organization assessment */
  CUSTOM = 'CUSTOM',
}

/**
 * Assessment configuration
 */
export class AssessmentConfig {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;

  @IsEnum(AssessmentFrequency)
  @IsOptional()
  burnoutAssessmentFrequency?: AssessmentFrequency = AssessmentFrequency.MONTHLY;

  @IsEnum(BigFiveAssessmentMethod)
  @IsOptional()
  bigFiveMethod?: BigFiveAssessmentMethod = BigFiveAssessmentMethod.IPIP_NEO_60;

  @IsBoolean()
  @IsOptional()
  bigFiveRequired?: boolean = false;

  @IsBoolean()
  @IsOptional()
  allowSelfAssessment?: boolean = true;

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  assessmentReminderDays?: number = 30;
}

// =============================================================================
// ALERT CONFIGURATION
// =============================================================================

/**
 * Alert configuration for burnout notifications
 */
export class AlertConfig {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  notifyDirector?: boolean = true;

  @IsBoolean()
  @IsOptional()
  notifyCoordinator?: boolean = true;

  @IsBoolean()
  @IsOptional()
  notifyHR?: boolean = false;

  @IsBoolean()
  @IsOptional()
  notifyTeacher?: boolean = true;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  additionalEmails?: string[] = [];

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  altoThreshold?: number = 0.6;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  criticoThreshold?: number = 0.8;
}

// =============================================================================
// PROTOCOL CONFIGURATION
// =============================================================================

/**
 * Protocol assignment configuration
 */
export class ProtocolConfig {
  @IsBoolean()
  @IsOptional()
  autoAssign?: boolean = true;

  @IsEnum(AdaptationProtocol)
  @IsOptional()
  defaultProtocol?: AdaptationProtocol = AdaptationProtocol.STANDARD;

  @IsArray()
  @IsEnum(AdaptationProtocol, { each: true })
  @IsOptional()
  allowedProtocols?: AdaptationProtocol[] = Object.values(AdaptationProtocol);

  @IsBoolean()
  @IsOptional()
  allowTeacherOverride?: boolean = false;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  minConfidenceForAutoAssign?: number = 0.7;

  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  reassessmentIntervalDays?: number = 90;
}

// =============================================================================
// PRIVACY CONFIGURATION
// =============================================================================

/**
 * Privacy and data sharing configuration
 */
export class PrivacyConfig {
  @IsBoolean()
  @IsOptional()
  anonymizeAnalytics?: boolean = true;

  @IsBoolean()
  @IsOptional()
  shareWithNetwork?: boolean = false;

  @IsBoolean()
  @IsOptional()
  allowDataExport?: boolean = true;

  @IsNumber()
  @Min(30)
  @Max(3650)
  @IsOptional()
  dataRetentionDays?: number = 730;

  @IsBoolean()
  @IsOptional()
  requireConsentForBigFive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  showBurnoutToTeacher?: boolean = true;

  @IsBoolean()
  @IsOptional()
  showBigFiveToTeacher?: boolean = true;
}

// =============================================================================
// EVOLVOPTERA INTEGRATION CONFIG
// =============================================================================

/**
 * Configuration for Evolvoptera adaptive engine integration
 */
export class EvolvopteraIntegrationConfig {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;

  @IsBoolean()
  @IsOptional()
  adjustDifficultyByBurnout?: boolean = true;

  @IsBoolean()
  @IsOptional()
  adjustSessionLengthByBurnout?: boolean = true;

  @IsBoolean()
  @IsOptional()
  suggestBreaksByBurnout?: boolean = true;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  maxDifficultyWhenCritico?: number = 0.3;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  maxDifficultyWhenAlto?: number = 0.5;
}

// =============================================================================
// MAIN CONFIGURATION DTO
// =============================================================================

/**
 * Complete DocenTe configuration for an organization
 */
export class DocenteOrgConfig {
  @IsString()
  organizationId: string;

  @IsBoolean()
  @IsOptional()
  moduleEnabled?: boolean = true;

  @ValidateNested()
  @Type(() => AssessmentConfig)
  @IsOptional()
  assessment?: AssessmentConfig = new AssessmentConfig();

  @ValidateNested()
  @Type(() => AlertConfig)
  @IsOptional()
  alerts?: AlertConfig = new AlertConfig();

  @ValidateNested()
  @Type(() => ProtocolConfig)
  @IsOptional()
  protocol?: ProtocolConfig = new ProtocolConfig();

  @ValidateNested()
  @Type(() => PrivacyConfig)
  @IsOptional()
  privacy?: PrivacyConfig = new PrivacyConfig();

  @ValidateNested()
  @Type(() => EvolvopteraIntegrationConfig)
  @IsOptional()
  evolvopteraIntegration?: EvolvopteraIntegrationConfig = new EvolvopteraIntegrationConfig();

  @IsString()
  @IsOptional()
  customWelcomeMessage?: string;

  @IsString()
  @IsOptional()
  supportEmail?: string;

  @IsString()
  @IsOptional()
  supportPhone?: string;
}

/**
 * DTO for creating/updating DocenTe organization config
 */
export class UpdateDocenteOrgConfigDto {
  @IsBoolean()
  @IsOptional()
  moduleEnabled?: boolean;

  @ValidateNested()
  @Type(() => AssessmentConfig)
  @IsOptional()
  assessment?: Partial<AssessmentConfig>;

  @ValidateNested()
  @Type(() => AlertConfig)
  @IsOptional()
  alerts?: Partial<AlertConfig>;

  @ValidateNested()
  @Type(() => ProtocolConfig)
  @IsOptional()
  protocol?: Partial<ProtocolConfig>;

  @ValidateNested()
  @Type(() => PrivacyConfig)
  @IsOptional()
  privacy?: Partial<PrivacyConfig>;

  @ValidateNested()
  @Type(() => EvolvopteraIntegrationConfig)
  @IsOptional()
  evolvopteraIntegration?: Partial<EvolvopteraIntegrationConfig>;

  @IsString()
  @IsOptional()
  customWelcomeMessage?: string;

  @IsString()
  @IsOptional()
  supportEmail?: string;

  @IsString()
  @IsOptional()
  supportPhone?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Response for DocenTe configuration
 */
export interface DocenteOrgConfigResponse {
  success: boolean;
  data: DocenteOrgConfig;
  meta: {
    organizationId: string;
    lastUpdated: Date;
    updatedBy?: string;
  };
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

/**
 * Get default DocenTe configuration for a new organization
 */
export function getDefaultDocenteConfig(organizationId: string): DocenteOrgConfig {
  return {
    organizationId,
    moduleEnabled: true,
    assessment: {
      enabled: true,
      burnoutAssessmentFrequency: AssessmentFrequency.MONTHLY,
      bigFiveMethod: BigFiveAssessmentMethod.IPIP_NEO_60,
      bigFiveRequired: false,
      allowSelfAssessment: true,
      assessmentReminderDays: 30,
    },
    alerts: {
      enabled: true,
      notifyDirector: true,
      notifyCoordinator: true,
      notifyHR: false,
      notifyTeacher: true,
      additionalEmails: [],
      altoThreshold: 0.6,
      criticoThreshold: 0.8,
    },
    protocol: {
      autoAssign: true,
      defaultProtocol: AdaptationProtocol.STANDARD,
      allowedProtocols: Object.values(AdaptationProtocol),
      allowTeacherOverride: false,
      minConfidenceForAutoAssign: 0.7,
      reassessmentIntervalDays: 90,
    },
    privacy: {
      anonymizeAnalytics: true,
      shareWithNetwork: false,
      allowDataExport: true,
      dataRetentionDays: 730,
      requireConsentForBigFive: true,
      showBurnoutToTeacher: true,
      showBigFiveToTeacher: true,
    },
    evolvopteraIntegration: {
      enabled: true,
      adjustDifficultyByBurnout: true,
      adjustSessionLengthByBurnout: true,
      suggestBreaksByBurnout: true,
      maxDifficultyWhenCritico: 0.3,
      maxDifficultyWhenAlto: 0.5,
    },
  };
}

/**
 * Merge partial config with defaults
 */
export function mergeWithDefaults(
  organizationId: string,
  partial: Partial<UpdateDocenteOrgConfigDto>
): DocenteOrgConfig {
  const defaults = getDefaultDocenteConfig(organizationId);

  return {
    ...defaults,
    ...partial,
    assessment: {
      ...defaults.assessment,
      ...partial.assessment,
    },
    alerts: {
      ...defaults.alerts,
      ...partial.alerts,
    },
    protocol: {
      ...defaults.protocol,
      ...partial.protocol,
    },
    privacy: {
      ...defaults.privacy,
      ...partial.privacy,
    },
    evolvopteraIntegration: {
      ...defaults.evolvopteraIntegration,
      ...partial.evolvopteraIntegration,
    },
  };
}
