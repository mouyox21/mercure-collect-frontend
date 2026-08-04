export interface DebtorSearchResultDto {
  debtorId: string;
  debtorName: string;
  clientType: string;
  ice: string;
  cin: string;
  mainPhone: string;
  email: string;
  city: string;
  creditorId: string;
  creditorLabel: string;
  riskSegment: string;
  riskScore: number;
  outstandingAmount: number;
  activeCasesCount: number;
  totalOverdueAmount: number;
  hasDuplicateAlert: boolean;
  duplicateAlertType?: string;
  status: string;
}

export interface DebtorKpiDto {
  activeCasesCount: number;
  totalDebtAmount: number;
  totalOverdueAmount: number;
  averageDaysLate: number;
  brokenPromisesCount: number;
  riskScore: number;
}

export interface NextActionDto {
  actionType: string;
  actionLabel: string;
  scheduledDate: string;
  agentId: string;
  agentName: string;
}

export interface ContractSummaryDto {
  contractId: string;
  contractReference: string;
  productType: string;
  creditorId: string;
  creditorLabel: string;
  originalAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  startDate: string;
  status: string;
}

export interface DebtSummaryDto {
  debtId: string;
  contractReference: string;
  creditorLabel: string;
  amount: number;
  dueDate: string;
  daysLate: number;
  status: string;
}

export interface InteractionSummaryDto {
  interactionId: string;
  channel: string;
  actionType: string;
  actionLabel: string;
  interactionDate: string;
  agentId: string;
  agentName: string;
  outcome?: string;
  hasPromise: boolean;
}

export interface DocumentSummaryDto {
  documentId: string;
  documentType: string;
  documentLabel: string;
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
  mimeType: string;
}

export interface GuaranteeSummaryDto {
  guaranteeId: string;
  guaranteeType: string;
  description: string;
  estimatedValue?: number;
  registrationDate?: string;
  status: string;
}

export interface DebtorDetailDto {
  debtorId: string;
  debtorName: string;
  ice: string;
  cin: string;
  legalForm: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  mainPhone: string;
  email: string;
  contactPersonName: string;
  segment: string;
  clientType: string;
  status: string;
  riskSegment: string;
  pdScore?: number;
  lgdScore?: number;
  kpi: DebtorKpiDto;
  nextAction?: NextActionDto;
  contracts: ContractSummaryDto[];
  debts: DebtSummaryDto[];
  interactions: InteractionSummaryDto[];
  documents: DocumentSummaryDto[];
  guarantees: GuaranteeSummaryDto[];
}
