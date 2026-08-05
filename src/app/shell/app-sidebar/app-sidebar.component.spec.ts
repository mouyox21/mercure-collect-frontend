import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

  /** All visible nav labels (common + contextual). */
  function allLabels(): string[] {
    return [...host().querySelectorAll('.sidebar__label, .sidebar__ctx-label')]
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
    const ctxLabels = [...host().querySelectorAll('.sidebar__ctx-label')]
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
