import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HasRightDirective } from './has-right.directive';
import { PermissionService } from './permission.service';
import { MockPermissionService } from './mock/permission-mock.service';
import { RoleProfile, PermissionCode } from './permission.types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function createTestBed(profile: RoleProfile = 'agent'): MockPermissionService {
  const mock = new MockPermissionService();
  mock.setProfile(profile);

  TestBed.configureTestingModule({
    imports: [HasRightDirective],
    providers: [{ provide: PermissionService, useValue: mock }],
  });

  return mock;
}

// ── MockPermissionService ──────────────────────────────────────────────────────

describe('MockPermissionService', () => {
  it('should default to agent profile', () => {
    const svc = new MockPermissionService();
    expect(svc.currentProfile()).toBe('agent');
  });

  it('should grant DASHBOARD_VIEW to agent', () => {
    const svc = new MockPermissionService();
    expect(svc.hasRight('DASHBOARD_VIEW')).toBe(true);
  });

  it('should deny SETTINGS_MANAGE to agent', () => {
    const svc = new MockPermissionService();
    expect(svc.hasRight('SETTINGS_MANAGE')).toBe(false);
  });

  it('should grant SETTINGS_MANAGE to administrateur', () => {
    const svc = new MockPermissionService();
    svc.setProfile('administrateur');
    expect(svc.hasRight('SETTINGS_MANAGE')).toBe(true);
  });

  it('should deny PAYMENT_PLAN_APPROVE to agent but grant to superviseur', () => {
    const svc = new MockPermissionService();
    expect(svc.hasRight('PAYMENT_PLAN_APPROVE')).toBe(false);
    svc.setProfile('superviseur');
    expect(svc.hasRight('PAYMENT_PLAN_APPROVE')).toBe(true);
  });

  it('should deny LEGAL_CASE_MANAGE to superviseur but grant to administrateur', () => {
    const svc = new MockPermissionService();
    svc.setProfile('superviseur');
    expect(svc.hasRight('LEGAL_CASE_MANAGE')).toBe(false);
    svc.setProfile('administrateur');
    expect(svc.hasRight('LEGAL_CASE_MANAGE')).toBe(true);
  });

  it('should update currentProfile signal on setProfile', () => {
    const svc = new MockPermissionService();
    svc.setProfile('superviseur');
    expect(svc.currentProfile()).toBe('superviseur');
  });
});

// ── HasRightDirective ─────────────────────────────────────────────────────────

@Component({
  standalone: true,
  imports: [HasRightDirective],
  template: `<div *appHasRight="right" class="protected">Visible</div>`,
})
class TestHostComponent {
  right: PermissionCode = 'CASE_UPDATE';
}

describe('HasRightDirective', () => {
  it('should render protected content when user has the right', () => {
    const mock = createTestBed('agent'); // agent has CASE_UPDATE
    void mock;

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.protected')).toBeTruthy();
  });

  it('should not render protected content when user lacks the right', () => {
    const mock = createTestBed('agent');
    void mock;

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.right = 'SETTINGS_MANAGE'; // agent cannot manage settings
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.protected')).toBeNull();
  });

  it('should show content after profile is upgraded to one with the right', async () => {
    const mock = createTestBed('agent');

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.right = 'REPORT_EXPORT'; // agent lacks this
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.protected')).toBeNull();

    mock.setProfile('superviseur'); // superviseur has REPORT_EXPORT
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.protected')).toBeTruthy();
  });

  it('should hide content after profile is downgraded', async () => {
    const mock = createTestBed('superviseur');

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.right = 'REPORT_EXPORT';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.protected')).toBeTruthy();

    mock.setProfile('agent'); // agent lacks REPORT_EXPORT
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.protected')).toBeNull();
  });
});
