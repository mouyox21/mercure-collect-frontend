export interface LegalEventDto {
  eventId: string;
  eventType: string;
  eventLabel: string;
  eventDate: string;
  description?: string;
  performedBy?: string;
  documentId?: string;
}

export interface LegalCaseDto {
  legalCaseId: string;
  caseId: string;
  caseReference: string;
  debtorId: string;
  debtorName: string;
  phase: string;
  status: string;
  lawyerId?: string;
  lawyerName?: string;
  bailiffId?: string;
  bailiffName?: string;
  courtName?: string;
  filingDate?: string;
  hearingDate?: string;
  judgmentDate?: string;
  debtAmount: number;
  legalFees?: number;
  events: LegalEventDto[];
  createdAt: string;
  updatedAt: string;
}
