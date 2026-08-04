export type PermissionCode =
  | 'DASHBOARD_VIEW'
  | 'CASE_VIEW'
  | 'CASE_UPDATE'
  | 'CASE_ASSIGN'
  | 'CLIENT_VIEW'
  | 'CLIENT_CONTACT_VIEW'
  | 'CLIENT_FINANCIAL_VIEW'
  | 'ACTION_CREATE'
  | 'PROMISE_CREATE'
  | 'PAYMENT_PLAN_CREATE'
  | 'PAYMENT_PLAN_APPROVE'
  | 'LEGAL_CASE_VIEW'
  | 'LEGAL_CASE_MANAGE'
  | 'ESCALATION_CREATE'
  | 'REPORT_EXPORT'
  | 'SETTINGS_MANAGE'
  | 'AUDIT_VIEW';

export type RoleProfile = 'agent' | 'superviseur' | 'administrateur';

export const ALL_PERMISSIONS: readonly PermissionCode[] = [
  'DASHBOARD_VIEW',
  'CASE_VIEW',
  'CASE_UPDATE',
  'CASE_ASSIGN',
  'CLIENT_VIEW',
  'CLIENT_CONTACT_VIEW',
  'CLIENT_FINANCIAL_VIEW',
  'ACTION_CREATE',
  'PROMISE_CREATE',
  'PAYMENT_PLAN_CREATE',
  'PAYMENT_PLAN_APPROVE',
  'LEGAL_CASE_VIEW',
  'LEGAL_CASE_MANAGE',
  'ESCALATION_CREATE',
  'REPORT_EXPORT',
  'SETTINGS_MANAGE',
  'AUDIT_VIEW',
];

export const ROLE_PERMISSIONS: Record<RoleProfile, ReadonlySet<PermissionCode>> = {
  agent: new Set<PermissionCode>([
    'DASHBOARD_VIEW',
    'CASE_VIEW',
    'CASE_UPDATE',
    'CLIENT_VIEW',
    'CLIENT_CONTACT_VIEW',
    'ACTION_CREATE',
    'PROMISE_CREATE',
    'PAYMENT_PLAN_CREATE',
  ]),
  superviseur: new Set<PermissionCode>([
    'DASHBOARD_VIEW',
    'CASE_VIEW',
    'CASE_UPDATE',
    'CASE_ASSIGN',
    'CLIENT_VIEW',
    'CLIENT_CONTACT_VIEW',
    'CLIENT_FINANCIAL_VIEW',
    'ACTION_CREATE',
    'PROMISE_CREATE',
    'PAYMENT_PLAN_CREATE',
    'PAYMENT_PLAN_APPROVE',
    'LEGAL_CASE_VIEW',
    'ESCALATION_CREATE',
    'REPORT_EXPORT',
  ]),
  administrateur: new Set<PermissionCode>(ALL_PERMISSIONS as PermissionCode[]),
};
