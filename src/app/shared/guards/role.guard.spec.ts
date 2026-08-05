import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { roleGuard } from './role.guard';
import { PermissionService } from '../data-access/permission.service';
import { PermissionCode } from '../data-access/permission.types';

function makeRoute(requiredRight: PermissionCode): ActivatedRouteSnapshot {
  return { data: { requiredRight } } as unknown as ActivatedRouteSnapshot;
}

function makePermSvc(rights: PermissionCode[]) {
  const set = new Set<PermissionCode>(rights);
  return { hasRight: (code: PermissionCode) => set.has(code) };
}

const REDIRECT_TREE = {} as UrlTree;

function runGuard(rights: PermissionCode[], requiredRight: PermissionCode): boolean | UrlTree {
  TestBed.configureTestingModule({
    providers: [
      { provide: PermissionService, useValue: makePermSvc(rights) },
      { provide: Router, useValue: { createUrlTree: () => REDIRECT_TREE } },
    ],
  });
  return TestBed.runInInjectionContext(() =>
    roleGuard(makeRoute(requiredRight), {} as any)
  ) as boolean | UrlTree;
}

describe('roleGuard', () => {

  afterEach(() => TestBed.resetTestingModule());

  // ── /rapports : REPORT_VIEW ────────────────────────────────────────────────

  describe('/rapports gate (REPORT_VIEW)', () => {
    it('should return true when user has REPORT_VIEW', () => {
      expect(runGuard(['REPORT_VIEW'], 'REPORT_VIEW')).toBe(true);
    });

    it('should return true when user has both REPORT_VIEW and REPORT_EXPORT', () => {
      expect(runGuard(['REPORT_VIEW', 'REPORT_EXPORT'], 'REPORT_VIEW')).toBe(true);
    });

    it('should return UrlTree (redirect) when user has no REPORT_VIEW', () => {
      expect(runGuard([], 'REPORT_VIEW')).toBe(REDIRECT_TREE);
    });

    it('should return UrlTree when user has only REPORT_EXPORT but not REPORT_VIEW', () => {
      // Edge case: REPORT_EXPORT alone does not grant route access.
      expect(runGuard(['REPORT_EXPORT'], 'REPORT_VIEW')).toBe(REDIRECT_TREE);
    });
  });

  // ── REPORT_VIEW alone → export buttons inactive ───────────────────────────

  describe('REPORT_VIEW only — export capability', () => {
    it('REPORT_VIEW alone does not grant REPORT_EXPORT', () => {
      const permSvc = makePermSvc(['REPORT_VIEW']);
      expect(permSvc.hasRight('REPORT_VIEW')).toBe(true);
      expect(permSvc.hasRight('REPORT_EXPORT')).toBe(false);
    });
  });

  // ── Other routes : smoke tests ─────────────────────────────────────────────

  it('should allow route when no requiredRight is configured', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PermissionService, useValue: makePermSvc([]) },
        { provide: Router, useValue: { createUrlTree: () => REDIRECT_TREE } },
      ],
    });
    const route = { data: {} } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => roleGuard(route, {} as any));
    expect(result).toBe(true);
  });

  it('should redirect when required right is absent', () => {
    expect(runGuard([], 'SETTINGS_MANAGE')).toBe(REDIRECT_TREE);
  });

  it('should allow when required right is present', () => {
    expect(runGuard(['SETTINGS_MANAGE'], 'SETTINGS_MANAGE')).toBe(true);
  });
});
