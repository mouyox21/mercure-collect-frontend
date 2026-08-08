import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppSidebarComponent } from './app-sidebar.component';
import { PermissionService } from '../../shared/data-access/permission.service';
import { MockPermissionService } from '../../shared/data-access/mock/permission-mock.service';
import { ActiveRoleService } from '../../shared/data-access/active-role.service';
import { MockActiveRoleService } from '../../shared/data-access/mock/active-role-mock.service';
import { UserService } from '../../shared/data-access/user.service';
import { MockUserService } from '../../shared/data-access/mock/user-mock.service';
import { UserRole } from '../../shared/data-access/user-role.types';

describe('AppSidebarComponent', () => {
  let fixture: ComponentFixture<AppSidebarComponent>;
  let activeRole: MockActiveRoleService;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useClass: MockPermissionService },
        { provide: ActiveRoleService, useClass: MockActiveRoleService },
        { provide: UserService,       useClass: MockUserService       },
      ],
    }).compileComponents();

    activeRole = TestBed.inject(ActiveRoleService) as MockActiveRoleService;
  });

  function setRole(role: UserRole): void { activeRole.setRole(role); }

  function create(): void {
    fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
  }

  /** All visible nav labels (common nav uses .sidebar__nav-label; contextual panel uses .snp__label). */
  function allLabels(): string[] {
    return [...host().querySelectorAll('.sidebar__nav-label, .snp__label')]
      .map(el => el.textContent?.trim() ?? '');
  }

  it('should display the brand name', () => {
    create();
    expect(host().querySelector('.sidebar__brand-name')?.textContent?.trim()).toBe('MERCURE');
  });

  it('should display the role badge for agent', () => {
    setRole('AGENT');
    create();
    expect(host().querySelector('.sidebar__role-badge')?.textContent?.trim()).toBe('Agent');
  });

  it('should display the role badge for superviseur', () => {
    setRole('SUPERVISOR');
    create();
    expect(host().querySelector('.sidebar__role-badge')?.textContent?.trim()).toBe('Superviseur');
  });

  it('should show Dashboard link when user has DASHBOARD_VIEW', () => {
    setRole('AGENT');
    create();
    expect(allLabels()).toContain('Dashboard');
  });

  it('should not show Rapports-route items for agent (lacks REPORT_VIEW)', () => {
    setRole('AGENT');
    create();
    // Agent has no contextual menu → no Performance / Reporting links to /rapports.
    expect(allLabels()).not.toContain('Performance');
    expect(allLabels()).not.toContain('Reporting');
  });

  it('should show Rapports-route items for manager (has REPORT_VIEW)', () => {
    setRole('MANAGER');
    create();
    const ctxLabels = [...host().querySelectorAll('.sidebar__ctx-nav .snp__label')]
      .map(el => el.textContent?.trim() ?? '');
    expect(ctxLabels).toContain('Performance');
    expect(ctxLabels).toContain('Reporting');
  });

  it('should hide Paramétrage when agent lacks SETTINGS_MANAGE', () => {
    setRole('AGENT');
    create();
    expect(allLabels()).not.toContain('Paramétrage');
  });

  it('should show all nav items when administrateur', () => {
    setRole('ADMIN');
    create();
    const labels = allLabels();
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Dossiers');
    expect(labels).toContain('Clients');
    expect(labels).toContain('Paramétrage');
  });

  it('should display agent initials and name', () => {
    setRole('AGENT');
    create();
    expect(host().querySelector('.sidebar__avatar')?.textContent?.trim()).toBe('MD');
    expect(host().querySelector('.sidebar__agent-name')?.textContent?.trim()).toBe('Marie Dupont');
  });

  it('should display superviseur initials and name', () => {
    setRole('SUPERVISOR');
    create();
    expect(host().querySelector('.sidebar__avatar')?.textContent?.trim()).toBe('JM');
    expect(host().querySelector('.sidebar__agent-name')?.textContent?.trim()).toBe('Jean Martin');
  });

  it('should render a profile button', () => {
    create();
    expect(host().querySelector('.sidebar__profile')).toBeTruthy();
  });
});

// ── Navigation test: single active item in "Administration" block (anomalie #10) ──

@Component({ standalone: true, template: '' })
class DummyRouteComponent {}

describe('AppSidebarComponent — active state (ADMIN, /parametrages/*)', () => {
  let fixture: ComponentFixture<AppSidebarComponent>;
  let activeRole: MockActiveRoleService;
  let router: Router;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  function activeCtxLabels(): string[] {
    return [...host().querySelectorAll('.sidebar__ctx-nav .snp__item--active .snp__label')]
      .map(el => el.textContent?.trim() ?? '');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [
        provideRouter([
          { path: 'parametrages', pathMatch: 'full', redirectTo: 'parametrages/referentiels' },
          { path: 'parametrages/referentiels',       component: DummyRouteComponent },
          { path: 'parametrages/regles-workflows',   component: DummyRouteComponent },
          { path: 'parametrages/imports',            component: DummyRouteComponent },
          { path: 'parametrages/audit',              component: DummyRouteComponent },
        ]),
        { provide: PermissionService, useClass: MockPermissionService },
        { provide: ActiveRoleService, useClass: MockActiveRoleService },
        { provide: UserService,       useClass: MockUserService       },
      ],
    }).compileComponents();

    activeRole = TestBed.inject(ActiveRoleService) as MockActiveRoleService;
    router     = TestBed.inject(Router);
    activeRole.setRole('ADMIN');
    fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
  });

  it('activates only "Référentiels" (not "Paramétrage") on /parametrages/referentiels', async () => {
    await router.navigateByUrl('/parametrages/referentiels');
    fixture.detectChanges();

    const active = activeCtxLabels();
    expect(active).toEqual(['Référentiels']);
    expect(active).not.toContain('Paramétrage');
  });

  it('activates only "Audit" on /parametrages/audit', async () => {
    await router.navigateByUrl('/parametrages/audit');
    fixture.detectChanges();

    const active = activeCtxLabels();
    expect(active).toEqual(['Audit']);
  });
});
