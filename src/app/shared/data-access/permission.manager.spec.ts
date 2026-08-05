import { MockPermissionService } from './mock/permission-mock.service';

describe('MANAGER profile — permission boundary', () => {
  let svc: MockPermissionService;

  beforeEach(() => {
    svc = new MockPermissionService();
    svc.setProfile('manager');
  });

  // ── Rights that MUST be present ────────────────────────────────────────────

  describe('granted rights', () => {
    it('should have DASHBOARD_VIEW (common nav)',        () => expect(svc.hasRight('DASHBOARD_VIEW')).toBe(true));
    it('should have CASE_VIEW (common nav + dossiers)', () => expect(svc.hasRight('CASE_VIEW')).toBe(true));
    it('should have CASE_ASSIGN (/superviseur/* guard + Décisions menu)', () => expect(svc.hasRight('CASE_ASSIGN')).toBe(true));
    it('should have CLIENT_VIEW (common nav)',           () => expect(svc.hasRight('CLIENT_VIEW')).toBe(true));
    it('should have CLIENT_FINANCIAL_VIEW (vue consolidée)', () => expect(svc.hasRight('CLIENT_FINANCIAL_VIEW')).toBe(true));
    it('should have PAYMENT_PLAN_APPROVE (validation niveau management)', () => expect(svc.hasRight('PAYMENT_PLAN_APPROVE')).toBe(true));
    it('should have ESCALATION_CREATE (/superviseur/escalades — Décisions)', () => expect(svc.hasRight('ESCALATION_CREATE')).toBe(true));
    it('should have REPORT_VIEW (/rapports guard + Performance/Reporting menu)', () => expect(svc.hasRight('REPORT_VIEW')).toBe(true));
    it('should have REPORT_EXPORT (export PDF/Excel/CSV)',                        () => expect(svc.hasRight('REPORT_EXPORT')).toBe(true));
  });

  // ── Rights that MUST be absent ─────────────────────────────────────────────

  describe('denied rights — admin boundary', () => {
    it('should NOT have SETTINGS_MANAGE (réservé ADMIN)',  () => expect(svc.hasRight('SETTINGS_MANAGE')).toBe(false));
    it('should NOT have AUDIT_VIEW (réservé ADMIN)',       () => expect(svc.hasRight('AUDIT_VIEW')).toBe(false));
  });

  describe('denied rights — opérationnel agent/superviseur', () => {
    it('should NOT have CLIENT_CONTACT_VIEW (pas de contact direct client)', () => expect(svc.hasRight('CLIENT_CONTACT_VIEW')).toBe(false));
    it('should NOT have ACTION_CREATE (pas de saisie action individuelle)',   () => expect(svc.hasRight('ACTION_CREATE')).toBe(false));
    it('should NOT have PROMISE_CREATE (pas de création promesse)',           () => expect(svc.hasRight('PROMISE_CREATE')).toBe(false));
    it('should NOT have PAYMENT_PLAN_CREATE (crée pas — approuve seulement)', () => expect(svc.hasRight('PAYMENT_PLAN_CREATE')).toBe(false));
    it('should NOT have CASE_UPDATE (pas d\'édition opérationnelle)',         () => expect(svc.hasRight('CASE_UPDATE')).toBe(false));
  });

  describe('denied rights — contentieux (hors menu MANAGER)', () => {
    it('should NOT have LEGAL_CASE_VIEW',   () => expect(svc.hasRight('LEGAL_CASE_VIEW')).toBe(false));
    it('should NOT have LEGAL_CASE_MANAGE', () => expect(svc.hasRight('LEGAL_CASE_MANAGE')).toBe(false));
  });

  // ── currentProfile signal ──────────────────────────────────────────────────

  it('should report currentProfile as "manager"', () => {
    expect(svc.currentProfile()).toBe('manager');
  });
});
