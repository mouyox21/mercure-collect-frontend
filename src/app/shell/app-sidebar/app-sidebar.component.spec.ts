import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppSidebarComponent } from './app-sidebar.component';
import { PermissionService } from '../../shared/data-access/permission.service';
import { MockPermissionService } from '../../shared/data-access/mock/permission-mock.service';
import { UserService } from '../../shared/data-access/user.service';
import { MockUserService } from '../../shared/data-access/mock/user-mock.service';

describe('AppSidebarComponent', () => {
  let fixture: ComponentFixture<AppSidebarComponent>;
  let permissions: MockPermissionService;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [
        provideRouter([]),
        { provide: PermissionService, useClass: MockPermissionService },
        { provide: UserService,       useClass: MockUserService       },
      ],
    }).compileComponents();

    permissions = TestBed.inject(PermissionService) as MockPermissionService;
  });

  function create(): void {
    fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
  }

  it('should display the brand name', () => {
    create();
    expect(host().querySelector('.sidebar__brand-name')?.textContent?.trim()).toBe('MERCURE');
  });

  it('should display the role badge for agent', () => {
    permissions.setProfile('agent');
    create();
    expect(host().querySelector('.sidebar__role-badge')?.textContent?.trim()).toBe('agent');
  });

  it('should display the role badge for superviseur', () => {
    permissions.setProfile('superviseur');
    create();
    expect(host().querySelector('.sidebar__role-badge')?.textContent?.trim()).toBe('superviseur');
  });

  it('should show Dashboard link when user has DASHBOARD_VIEW', () => {
    permissions.setProfile('agent');
    create();
    const labels = [...host().querySelectorAll('.sidebar__label')].map(el => el.textContent?.trim());
    expect(labels).toContain('Dashboard');
  });

  it('should hide Rapports link when agent lacks REPORT_EXPORT', () => {
    permissions.setProfile('agent');
    create();
    const labels = [...host().querySelectorAll('.sidebar__label')].map(el => el.textContent?.trim());
    expect(labels).not.toContain('Rapports');
  });

  it('should show Rapports link when superviseur has REPORT_EXPORT', () => {
    permissions.setProfile('superviseur');
    create();
    const labels = [...host().querySelectorAll('.sidebar__label')].map(el => el.textContent?.trim());
    expect(labels).toContain('Rapports');
  });

  it('should hide Paramétrages when agent lacks SETTINGS_MANAGE', () => {
    permissions.setProfile('agent');
    create();
    const labels = [...host().querySelectorAll('.sidebar__label')].map(el => el.textContent?.trim());
    expect(labels).not.toContain('Paramétrages');
  });

  it('should show all nav items when administrateur', () => {
    permissions.setProfile('administrateur');
    create();
    const labels = [...host().querySelectorAll('.sidebar__label')].map(el => el.textContent?.trim());
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Dossiers');
    expect(labels).toContain('Clients');
    expect(labels).toContain('Rapports');
    expect(labels).toContain('Paramétrages');
  });

  it('should display agent initials and name', () => {
    permissions.setProfile('agent');
    create();
    expect(host().querySelector('.sidebar__avatar')?.textContent?.trim()).toBe('MD');
    expect(host().querySelector('.sidebar__agent-name')?.textContent?.trim()).toBe('Marie Dupont');
  });

  it('should display superviseur initials and name', () => {
    permissions.setProfile('superviseur');
    create();
    expect(host().querySelector('.sidebar__avatar')?.textContent?.trim()).toBe('JM');
    expect(host().querySelector('.sidebar__agent-name')?.textContent?.trim()).toBe('Jean Martin');
  });

  it('should render a profile button', () => {
    create();
    expect(host().querySelector('.sidebar__profile')).toBeTruthy();
  });
});
