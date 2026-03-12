/**
 * DocenTe DPS Events
 *
 * Event types for DocenTe profile changes following DPS Protocol.
 * These events enable cross-module communication for teacher profile updates.
 *
 * Consumers:
 * - Evolvoptera: Adjusts recommendations based on burnout risk
 * - Coleoptera: Updates metacognitive strategy recommendations
 * - Neurophila: Analytics and reporting
 *
 * @module @organizoptera/org-api/teachers/events/docente-events
 */

import {
  type AdaptationProtocol,
  type BurnoutRiskLevel,
  type DocenteProfileData,
} from '../dto/docente-profile.dto';

// =============================================================================
// BASE EVENT TYPE
// =============================================================================

/**
 * Base event structure following DPS Protocol
 */
export interface DPSBaseEvent {
  /** Event type identifier */
  type: string;

  /** Event unique ID */
  eventId: string;

  /** Correlation ID for tracing */
  correlationId?: string;

  /** Source module */
  source: 'organizoptera';

  /** Event timestamp */
  timestamp: Date;

  /** Schema version */
  version: string;
}

// =============================================================================
// DOCENTE PROFILE EVENTS
// =============================================================================

/**
 * Emitted when a teacher's DocenTe profile is created
 */
export interface DocenteProfileCreatedEvent extends DPSBaseEvent {
  type: 'organizoptera.teacher.docente_profile.created';
  payload: {
    teacherId: string;
    schoolId: string;
    profile: DocenteProfileData;
    protocol: AdaptationProtocol;
  };
}

/**
 * Emitted when a teacher's DocenTe profile is updated
 */
export interface DocenteProfileUpdatedEvent extends DPSBaseEvent {
  type: 'organizoptera.teacher.docente_profile.updated';
  payload: {
    teacherId: string;
    schoolId: string;
    profile: DocenteProfileData;
    changes: Array<{
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }>;
    previousProtocol?: AdaptationProtocol;
    newProtocol: AdaptationProtocol;
    protocolChanged: boolean;
  };
}

/**
 * Emitted when a teacher's DocenTe profile is deleted
 */
export interface DocenteProfileDeletedEvent extends DPSBaseEvent {
  type: 'organizoptera.teacher.docente_profile.deleted';
  payload: {
    teacherId: string;
    schoolId: string;
    lastProfile: DocenteProfileData;
  };
}

// =============================================================================
// BURNOUT RISK EVENTS
// =============================================================================

/**
 * Emitted when burnout risk level changes
 * Critical event for Evolvoptera to adjust recommendations
 */
export interface BurnoutRiskUpdatedEvent extends DPSBaseEvent {
  type: 'organizoptera.teacher.burnout_risk.updated';
  payload: {
    teacherId: string;
    schoolId: string;
    previousLevel?: BurnoutRiskLevel;
    newLevel: BurnoutRiskLevel;
    previousScore?: number;
    newScore: number;
    factors?: string[];
    requiresImmediate: boolean;
  };
}

/**
 * Emitted when burnout risk reaches ALTO or CRÍTICO
 * Triggers alerts and immediate adjustments
 */
export interface BurnoutAlertEvent extends DPSBaseEvent {
  type: 'organizoptera.teacher.burnout_risk.alert';
  payload: {
    teacherId: string;
    schoolId: string;
    level: 'ALTO' | 'CRÍTICO';
    score: number;
    factors: string[];
    recommendedActions: string[];
    alertSentTo: string[];
  };
}

// =============================================================================
// PROTOCOL EVENTS
// =============================================================================

/**
 * Emitted when adaptation protocol is recalculated
 */
export interface ProtocolCalculatedEvent extends DPSBaseEvent {
  type: 'organizoptera.teacher.protocol.calculated';
  payload: {
    teacherId: string;
    protocol: AdaptationProtocol;
    confidence: number;
    reasons: string[];
    alternativeProtocols: Array<{
      protocol: AdaptationProtocol;
      score: number;
    }>;
    domainScores: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
  };
}

// =============================================================================
// EVENT UNION TYPE
// =============================================================================

/**
 * Union of all DocenTe events
 */
export type DocenteEvent =
  | DocenteProfileCreatedEvent
  | DocenteProfileUpdatedEvent
  | DocenteProfileDeletedEvent
  | BurnoutRiskUpdatedEvent
  | BurnoutAlertEvent
  | ProtocolCalculatedEvent;

// =============================================================================
// EVENT FACTORY
// =============================================================================

/**
 * Factory for creating DocenTe events
 */
export class DocenteEventFactory {
  private static generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  static createProfileCreatedEvent(
    teacherId: string,
    schoolId: string,
    profile: DocenteProfileData,
    correlationId?: string
  ): DocenteProfileCreatedEvent {
    return {
      type: 'organizoptera.teacher.docente_profile.created',
      eventId: this.generateEventId(),
      correlationId,
      source: 'organizoptera',
      timestamp: new Date(),
      version: '1.0.0',
      payload: {
        teacherId,
        schoolId,
        profile,
        protocol: profile.protocol.selected,
      },
    };
  }

  static createProfileUpdatedEvent(
    teacherId: string,
    schoolId: string,
    profile: DocenteProfileData,
    changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>,
    previousProtocol?: AdaptationProtocol,
    correlationId?: string
  ): DocenteProfileUpdatedEvent {
    return {
      type: 'organizoptera.teacher.docente_profile.updated',
      eventId: this.generateEventId(),
      correlationId,
      source: 'organizoptera',
      timestamp: new Date(),
      version: '1.0.0',
      payload: {
        teacherId,
        schoolId,
        profile,
        changes,
        previousProtocol,
        newProtocol: profile.protocol.selected,
        protocolChanged: previousProtocol !== profile.protocol.selected,
      },
    };
  }

  static createBurnoutRiskUpdatedEvent(
    teacherId: string,
    schoolId: string,
    newLevel: BurnoutRiskLevel,
    newScore: number,
    previousLevel?: BurnoutRiskLevel,
    previousScore?: number,
    factors?: string[],
    correlationId?: string
  ): BurnoutRiskUpdatedEvent {
    const requiresImmediate = newLevel === 'ALTO' || newLevel === 'CRÍTICO';

    return {
      type: 'organizoptera.teacher.burnout_risk.updated',
      eventId: this.generateEventId(),
      correlationId,
      source: 'organizoptera',
      timestamp: new Date(),
      version: '1.0.0',
      payload: {
        teacherId,
        schoolId,
        previousLevel,
        newLevel,
        previousScore,
        newScore,
        factors,
        requiresImmediate,
      },
    };
  }

  static createBurnoutAlertEvent(
    teacherId: string,
    schoolId: string,
    level: 'ALTO' | 'CRÍTICO',
    score: number,
    factors: string[],
    alertSentTo: string[],
    correlationId?: string
  ): BurnoutAlertEvent {
    const recommendedActions = this.getRecommendedActions(level);

    return {
      type: 'organizoptera.teacher.burnout_risk.alert',
      eventId: this.generateEventId(),
      correlationId,
      source: 'organizoptera',
      timestamp: new Date(),
      version: '1.0.0',
      payload: {
        teacherId,
        schoolId,
        level,
        score,
        factors,
        recommendedActions,
        alertSentTo,
      },
    };
  }

  private static getRecommendedActions(level: 'ALTO' | 'CRÍTICO'): string[] {
    if (level === 'CRÍTICO') {
      return [
        'Encaminhar para apoio psicológico imediato',
        'Revisar carga de trabalho urgentemente',
        'Considerar licença para recuperação',
        'Notificar coordenação pedagógica',
        'Reduzir atividades complexas no Evolvoptera',
      ];
    }

    return [
      'Agendar conversa com coordenação',
      'Revisar distribuição de turmas',
      'Oferecer suporte pedagógico adicional',
      'Reduzir atividades por sessão no Evolvoptera',
      'Ativar lembretes de pausa',
    ];
  }
}

// =============================================================================
// EVENT HANDLERS INTERFACE
// =============================================================================

/**
 * Interface for modules that consume DocenTe events
 */
export interface DocenteEventHandler {
  handleProfileCreated?(event: DocenteProfileCreatedEvent): Promise<void>;
  handleProfileUpdated?(event: DocenteProfileUpdatedEvent): Promise<void>;
  handleProfileDeleted?(event: DocenteProfileDeletedEvent): Promise<void>;
  handleBurnoutRiskUpdated?(event: BurnoutRiskUpdatedEvent): Promise<void>;
  handleBurnoutAlert?(event: BurnoutAlertEvent): Promise<void>;
  handleProtocolCalculated?(event: ProtocolCalculatedEvent): Promise<void>;
}
