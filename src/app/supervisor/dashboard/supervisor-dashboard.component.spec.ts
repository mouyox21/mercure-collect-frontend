import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SuperviseurDashboardComponent } from './supervisor-dashboard.component';
import { SupervisorService } from '../../shared/data-access/supervisor.service';
import { EscalationService } from '../../shared/data-access/escalation.service';
import { ActiveRoleService } from '../../shared/data-access/active-role.service';
import { MockActiveRoleService } from '../../shared/data-access/mock/active-role-mock.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { MockPermissionService } from '../../shared/data-access/mock/permission-mock.service';
import {
  SupervisorDashboardDto,
  EscalationDto,
} from '../../shared/data-access/models/supervisor.model';
import { EscalationPageDto } from '../../shared/data-access/escalation.service';

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_DASHBOARD: SupervisorDashboardDto = {
  businessDate:    '2026-08-03',
  supervisorName:  'Jean Martin',
  creditorId:      'CR001',
  creditorLabel:   'Créancier Test',
  teamPerformance: [],
  kpis: {
    totalActiveCases: 150, totalOverdueAmount: 500_000,
    averageRecoveryRate: 65, pendingEscalations: 3,
    brokenPromisesToday: 2, promisesKeptThisMonth: 45,
    newCasesThisWeek: 12, closedCasesThisWeek: 8,
  },
  portfolioByAging: [],
  priorityAlerts:  [],
};

const EMPTY_PAGE: EscalationPageDto = { items: [] };

class MockSupervisorService extends SupervisorService {
  getDashboard() { return of(MOCK_DASHBOARD); }
}

class ErrorSupervisorService extends SupervisorService {
  getDashboard() { return throwError(() => ({ status: 500 })); }
}

class ForbiddenSupervisorService extends SupervisorService {
  getDashboard() { return throwError(() => ({ status: 403 })); }
}

class MockEscalationService extends EscalationService {
  getEscalations() { return of(EMPTY_PAGE); }
  decide(_: any)   { return of(undefined as any); }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SuperviseurDashboardComponent', () => {
  let fixture: ComponentFixture<SuperviseurDashboardComponent>;
  let activeRole: MockActiveRoleService;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  function setup(
    svcClass: typeof SupervisorService = MockSupervisorService,
    role: 'SUPERVISOR' | 'MANAGER' = 'SUPERVISOR',
  ): void {
    TestBed.configureTestingModule({
      imports: [SuperviseurDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: SupervisorService,  useClass: svcClass              },
        { provide: EscalationService,  useClass: MockEscalationService },
        { provide: ActiveRoleService,  useClass: MockActiveRoleService },
        { provide: PermissionService,  useClass: MockPermissionService },
      ],
    }).compileComponents();

    activeRole = TestBed.inject(ActiveRoleService) as MockActiveRoleService;
    activeRole.setRole(role);

    fixture = TestBed.createComponent(SuperviseurDashboardComponent);
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── View states ────────────────────────────────────────────────────────────

  it('should show loading skeleton before data arrives', fakeAsync(() => {
    setup();
    fixture.detectChanges();
    expect(host().querySelector('mc-skeleton-loader')).toBeTruthy();
    tick(500);
  }));

  it('should show error state on 500', fakeAsync(() => {
    setup(ErrorSupervisorService);
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    expect(host().querySelector('mc-error-state')).toBeTruthy();
  }));

  it('should show forbidden state on 403', fakeAsync(() => {
    setup(ForbiddenSupervisorService);
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    expect(host().querySelector('mc-forbidden-state')).toBeTruthy();
  }));

  // ── Dynamic title ──────────────────────────────────────────────────────────

  it('should show "Vue superviseur" for SUPERVISOR role', fakeAsync(() => {
    setup(MockSupervisorService, 'SUPERVISOR');
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const title = host().querySelector('.sdash__page-title')?.textContent?.trim();
    expect(title).toBe('Vue superviseur');
  }));

  it('should show "Vue manager" for MANAGER role', fakeAsync(() => {
    setup(MockSupervisorService, 'MANAGER');
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const title = host().querySelector('.sdash__page-title')?.textContent?.trim();
    expect(title).toBe('Vue manager');
  }));

  it('should update title reactively when role changes', fakeAsync(() => {
    setup(MockSupervisorService, 'SUPERVISOR');
    fixture.detectChanges(); tick(500); fixture.detectChanges();

    expect(host().querySelector('.sdash__page-title')?.textContent?.trim()).toBe('Vue superviseur');

    activeRole.setRole('MANAGER');
    fixture.detectChanges();

    expect(host().querySelector('.sdash__page-title')?.textContent?.trim()).toBe('Vue manager');
  }));

  // ── KPI bar ────────────────────────────────────────────────────────────────

  it('should render 5 KPI cards in success state', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const cards = host().querySelectorAll('mc-kpi-card');
    expect(cards.length).toBe(5);
  }));

  // ── Header context ─────────────────────────────────────────────────────────

  it('should show supervisor name and business date in subtitle', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const sub = host().querySelector('.sdash__page-sub')?.textContent ?? '';
    expect(sub).toContain('Jean Martin');
    expect(sub).toContain('2026');
  }));
});
