export type ViewState = 'loading' | 'empty' | 'error' | 'forbidden' | 'stale' | 'success';

export type KpiVariant = 'standard' | 'success' | 'warning' | 'critical' | 'amount';

export type StatusValue =
  | 'nouveau'
  | 'en-cours'
  | 'promesse'
  | 'echeancier'
  | 'precontentieux'
  | 'contentieux'
  | 'cloture';

export type CaseVariant = 'standard' | 'critical' | 'broken-promise' | 'legal';

export type ActionType =
  | 'appeler'
  | 'sms'
  | 'email'
  | 'lettre'
  | 'promesse'
  | 'echeancier'
  | 'escalader';

export type TimelineChannel = 'telephone' | 'sms' | 'email' | 'lettre' | 'reunion';
export type TimelineEventType = 'action' | 'promesse' | 'echeancier' | 'note';

export type ModalUsage = 'action' | 'promesse' | 'echeancier' | 'document' | 'escalade';

export interface TimelineEvent {
  readonly id: string;
  readonly date: Date;
  readonly channel: TimelineChannel;
  readonly type: TimelineEventType;
  readonly description: string;
  readonly agent?: string;
  readonly amount?: number;
}

export interface ActionMenuItem {
  readonly type: ActionType;
  readonly label: string;
  readonly icon: string;
  readonly disabled?: boolean;
}

export interface CaseData {
  readonly id: string;
  readonly debtorName: string;
  readonly amount: number;
  readonly daysOverdue: number;
  readonly status: StatusValue;
  readonly lastContact?: Date;
  readonly agent?: string;
}

export interface ModalFormValue {
  readonly motif: string;
  readonly commentaire: string;
  readonly date?: string;
  readonly montant?: number;
  readonly canal?: string;
}

export type ActionModalType =
  | 'PHONE_CALL'
  | 'SMS'
  | 'EMAIL'
  | 'LETTER'
  | 'VISIT'
  | 'RELANCE'
  | 'CONTACT_SEARCH';

export interface CaseContextDto {
  readonly caseId: string;
  readonly caseReference: string;
  readonly debtorName: string;
  readonly overdueAmount: number;
  readonly daysLate: number;
  readonly status: string;
}

export interface ActionSubmitEvent {
  readonly caseId: string;
  readonly actionType: ActionModalType;
  readonly channel: TimelineChannel;
  readonly scheduledDate: string;
  readonly outcome: string;
  readonly contacted: boolean;
  readonly nonPaymentReason?: string;
  readonly commentaire: string;
  readonly durationMinutes?: number;
  readonly createPromise: boolean;
  readonly promiseDate?: string;
  readonly promiseAmount?: number;
  readonly timelineEntry: TimelineEvent;
  readonly promiseTimelineEntry?: TimelineEvent;
}
