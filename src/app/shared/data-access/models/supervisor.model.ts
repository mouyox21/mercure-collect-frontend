export type EscalationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
export type AlertSeverity = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface SupervisorKpiDto {
  totalActiveCases: number;
  totalOverdueAmount: number;
  averageRecoveryRate: number;
  pendingEscalations: number;
  brokenPromisesToday: number;
  promisesKeptThisMonth: number;
  newCasesThisWeek: number;
  closedCasesThisWeek: number;
}

export interface AgingBucketDto {
  bucketLabel: string;
  bucketCode: string;
  caseCount: number;
  totalAmount: number;
  percentage: number;
}

export interface AgentPerformanceDto {
  agentId: string;
  agentName: string;
  assignedCases: number;
  actionsToday: number;
  promisesObtained: number;
  collectedAmount: number;
  recoveryRate: number;
  overdueRatio: number;
  status: string;
}

export interface PriorityAlertDto {
  alertId: string;
  alertType: string;
  severity: AlertSeverity;
  message: string;
  relatedEntityId?: string;
  relatedEntityLabel?: string;
  createdAt: string;
}

export interface SupervisorDashboardDto {
  businessDate: string;
  supervisorName: string;
  creditorId: string;
  creditorLabel: string;
  kpis: SupervisorKpiDto;
  portfolioByAging: AgingBucketDto[];
  teamPerformance: AgentPerformanceDto[];
  priorityAlerts: PriorityAlertDto[];
}

export interface EscalationDto {
  escalationId: string;
  caseId: string;
  caseReference: string;
  debtorId: string;
  debtorName: string;
  agentId: string;
  agentName: string;
  reason: string;
  status: EscalationStatus;
  priority: string;
  overdueAmount: number;
  dmnRecommendation?: string;
  dmnRecommendationReason?: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionComment?: string;
}

export interface DecisionMonitoringDto {
  decisionId: string;
  caseId: string;
  caseReference: string;
  decisionType: string;
  decisionDate: string;
  segment: string;
  nextBestAction: string;
  reasonCode: string;
  reasonLabel: string;
  score: number;
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
  agentId?: string;
  agentFeedback?: string;
  agentFeedbackDate?: string;
}
