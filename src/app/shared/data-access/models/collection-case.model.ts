export interface CollectionCaseSearchCriteria {
  creditorId?: string;
  agentId?: string;
  debtorName?: string;
  caseReference?: string;
  status?: string;
  priority?: string;
  phase?: string;
  categoryCode?: string;
  amountMin?: number;
  amountMax?: number;
  daysLateMin?: number;
  daysLateMax?: number;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  size: number;
  sort?: string;
}

export interface CollectionCaseListItem {
  caseId: string;
  caseReference: string;
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorLabel: string;
  overdueAmount: number;
  totalDebtAmount: number;
  daysLate: number;
  status: string;
  priority: string;
  phase: string;
  categoryCode: string;
  categoryLabel: string;
  agentId: string;
  agentName: string;
  contractReference: string;
  lastActionDate: string;
  lastActionLabel: string;
  nextActionLabel?: string;
}

export interface DmnDecisionDto {
  segment: string;
  nextBestAction: string;
  nextBestActionReason: string;
  score: number;
  computedAt: string;
}

export interface CollectionCaseDetailDto {
  caseId: string;
  caseReference: string;
  debtorId: string;
  debtorName: string;
  creditorId: string;
  creditorLabel: string;
  phase: string;
  status: string;
  priority: string;
  categoryCode: string;
  categoryLabel: string;
  overdueAmount: number;
  totalDebtAmount: number;
  daysLate: number;
  openDate: string;
  lastActionDate: string;
  agentId: string;
  agentName: string;
  contractReference: string;
  dmnDecision: DmnDecisionDto;
  hasActivePromise: boolean;
  hasActivePaymentPlan: boolean;
  nextActionDate?: string;
  nextActionLabel?: string;
  debts?: CaseDebtDto[];
  interactions?: CaseInteractionDto[];
  documents?: CaseDocumentDto[];
  paymentPlan?: CasePaymentPlan;
  legalInfo?: CaseLegalInfoDto;
  history?: CaseHistoryEntryDto[];
}

export interface CaseInteractionDto {
  interactionId: string;
  channel: string;
  actionLabel: string;
  interactionDate: string;
  agentName: string;
  outcome: string;
  hasPromise: boolean;
  promiseAmount?: number;
  promiseDate?: string;
}

export interface CaseDocumentDto {
  documentId: string;
  documentType: string;
  documentLabel: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
  mimeType: string;
}

export interface CaseDebtDto {
  debtId: string;
  contractReference: string;
  amount: number;
  dueDate: string;
  daysLate: number;
  status: string;
}

export interface CasePlanInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: string;
  paidDate?: string;
  paidAmount?: number;
}

export interface CasePaymentPlan {
  totalAmount: number;
  installmentCount: number;
  frequency: string;
  firstInstallmentDate: string;
  derogation?: boolean;
  derogationReason?: string;
  installments: CasePlanInstallment[];
}

export interface CaseLegalEventDto {
  eventId: string;
  eventType: string;
  eventLabel: string;
  eventDate: string;
  description: string;
  performedBy: string;
  documentId?: string;
}

export interface CaseLegalInfoDto {
  legalPhase: string;
  status: string;
  lawyerName: string;
  courtName: string;
  filingDate: string;
  hearingDate?: string;
  debtAmount: number;
  legalFees: number;
  events: CaseLegalEventDto[];
}

export interface CaseHistoryEntryDto {
  entryId: string;
  entryDate: string;
  actor: string;
  action: string;
  details?: string;
}

export interface CollectionActionCommand {
  caseId: string;
  actionType: string;
  channel: string;
  scheduledDate: string;
  report?: string;
  outcome?: string;
  durationMinutes?: number;
  createPromise?: boolean;
  promiseDate?: string;
  promiseAmount?: number;
}
