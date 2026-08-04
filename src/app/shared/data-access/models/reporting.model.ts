export type ReportingPeriod = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER';
export type KpiVariant = 'standard' | 'success' | 'warning' | 'critical';

export interface ReportingFilterDto {
  creditorId?: string;
  agentId?: string;
  teamId?: string;
  dateFrom?: string;
  dateTo?: string;
  period?: ReportingPeriod;
  reportType?: string;
}

export interface KpiResponse {
  kpiCode: string;
  kpiLabel: string;
  value: number;
  previousValue?: number;
  unit: string;
  trend?: number;
  variant: KpiVariant;
}
