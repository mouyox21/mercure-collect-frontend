export interface HeaderAgentWorkbenchDto {
  businessDate: string;
  agentName: string;
  creditorId: string;
  creditorLabel: string;
  totalAssignedCases: number;
  totalCasesToProcess: number;
  portfolioOverdueAmount: number;
}

export interface AgentCaseItemDto {
  caseId: string;
  caseReference: string;
  customerName: string;
  contractReference: string;
  overdueAmount: number;
  daysLate: number;
  categoryAgeDays: number;
  lastActionLabel: string;
  mainPhone: string;
  status: string;
  priority: string;
}

export interface ActionCategoryDto {
  categoryCode: string;
  categoryLabel: string;
  caseCount: number;
  totalAmount: number;
  oldestAgeDays: number;
  cases: AgentCaseItemDto[];
}
