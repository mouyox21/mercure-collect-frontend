export type DmnPackageStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type DmnTestResult = 'PASS' | 'FAIL';

export interface ReferenceValueDto {
  id: string;
  code: string;
  label: string;
  description?: string;
  domain: string;
  active: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DmnPackageDto {
  packageId: string;
  packageCode: string;
  packageLabel: string;
  decisionType: string;
  version: string;
  status: DmnPackageStatus;
  description?: string;
  testsPassed?: number;
  testsTotal?: number;
  publishedAt?: string;
  publishedBy?: string;
  createdAt: string;
}

export interface DmnTestCaseDto {
  testId: string;
  packageId: string;
  testLabel: string;
  inputPayload: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  lastRunResult?: DmnTestResult;
  lastRunAt?: string;
  lastRunDiff?: Record<string, unknown>;
}
