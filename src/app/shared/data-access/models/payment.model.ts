export type PaymentPromiseStatus = 'ACTIVE' | 'KEPT' | 'BROKEN' | 'CANCELLED';
export type PaymentPlanFrequency = 'MONTHLY' | 'WEEKLY' | 'BIMONTHLY';
export type InstallmentStatus = 'SCHEDULED' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface PaymentPromiseDto {
  promiseId: string;
  caseId: string;
  caseReference: string;
  debtorId: string;
  debtorName: string;
  promiseDate: string;
  promiseAmount: number;
  currency?: string;
  channel?: string;
  status: PaymentPromiseStatus;
  createdByAgentId: string;
  createdByAgentName: string;
  createdAt: string;
  notes?: string;
  relatedActionId?: string;
}

export interface CreatePromiseCommand {
  caseId: string;
  promiseAmount: number;
  promiseDate: string;
  currency: string;
  channel: string;
  notes?: string;
  derogation: boolean;
  derogationReason?: string;
  historicalRegularization: boolean;
}

export interface PaymentInstallmentDto {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidDate?: string;
  paidAmount?: number;
}

export interface PaymentPlanCommand {
  caseId: string;
  totalAmount: number;
  installmentCount: number;
  firstInstallmentDate: string;
  frequency: PaymentPlanFrequency;
  derogation?: boolean;
  derogationReason?: string;
  installments: PaymentInstallmentDto[];
}

export interface PaymentPlanDto {
  caseId: string;
  totalAmount: number;
  installmentCount: number;
  firstInstallmentDate: string;
  frequency: PaymentPlanFrequency;
  derogation: boolean;
  derogationReason?: string;
  installments: PaymentInstallmentDto[];
}
