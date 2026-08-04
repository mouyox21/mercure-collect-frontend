export type ImportBatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ImportType = 'ERP' | 'CLS' | 'CSV';

export interface ImportErrorDto {
  rowNumber: number;
  fieldName?: string;
  errorCode: string;
  errorMessage: string;
  rawValue?: string;
}

export interface ImportBatchDto {
  batchId: string;
  importType: ImportType;
  fileName: string;
  status: ImportBatchStatus;
  totalRows: number;
  successRows: number;
  errorRows: number;
  importedAt: string;
  importedBy: string;
  creditorId?: string;
  creditorLabel?: string;
  errorSummary?: string;
  errors?: ImportErrorDto[];
}
