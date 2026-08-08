import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SuperviseurEquipeComponent } from './supervisor-equipe.component';
import { SupervisorService } from '../../shared/data-access/supervisor.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { MockPermissionService } from '../../shared/data-access/mock/permission-mock.service';
import { ActiveRoleService } from '../../shared/data-access/active-role.service';
import { MockActiveRoleService } from '../../shared/data-access/mock/active-role-mock.service';
import { AppSidebarComponent } from '../../shell/app-sidebar/app-sidebar.component';
import { AgentPerformanceDto, SupervisorDashboardDto } from '../../shared/data-access/models/supervisor.model';

// ── Mock data ────────────────────────────────────────────────────────────────

function makeAgent(i: number): AgentPerformanceDto {
  return {
    agentId:          `AGT-00${i}`,
    agentName:        `Agent Numéro${i}`,
    assignedCases:    50 + i * 10,
    actionsToday:     5 + i,
    promisesObtained: 3 + i,
    collectedAmount:  100_000 + i * 20_000,
    recoveryRate:     55 + i * 10,
    overdueRatio:     10 + i,
    status:           i === 3 ? 'ON_LEAVE' : 'ACTIVE',
  };
}

const MOCK_AGENTS = [makeAgent(1), makeAgent(2), makeAgent(3)];

const MOCK_DASHBOARD: SupervisorDashboardDto = {
  businessDate:    '2026-08-03',
  supervisorName:  'Jean Martin',
  creditorId:      'CR001',
  creditorLabel:   'Créancier Test',
  teamPerformance: MOCK_AGENTS,
  kpis: {
    totalActiveCases: 150, totalOverdueAmount: 500_000,
    averageRecoveryRate: 65, pendingEscalations: 3,
    brokenPromisesToday: 2, promisesKeptThisMonth: 45,
    newCasesThisWeek: 12, closedCasesThisWeek: 8,
  },
  portfolioByAging: [],
  priorityAlerts:  [],
};

class MockSupervisorService extends SupervisorService {
  getDashboard() { return of(MOCK_DASHBOARD); }
}

class ErrorSupervisorService extends SupervisorService {
  getDashboard() { return throwError(() => ({ status: 500 })); }
}

class ForbiddenSupervisorService extends SupervisorService {
  getDashboard() { return throwError(() => ({ status: 403 })); }
}

// ── SuperviseurEquipeComponent ───────────────────────────────────────────────

describe('SuperviseurEquipeComponent', () => {
  let fixture: ComponentFixture<SuperviseurEquipeComponent>;
  let component: SuperviseurEquipeComponent;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  function setup(svcClass = MockSupervisorService): void {
    TestBed.configureTestingModule({
      imports: [SuperviseurEquipeComponent],
      providers: [
        provideRouter([]),
        { provide: SupervisorService, useClass: svcClass },
      ],
    }).compileComponents();
    fixture   = TestBed.createComponent(SuperviseurEquipeComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => TestBed.resetTestingModule());

  // ── View states ────────────────────────────────────────────────────────────

  it('should show loading state before data arrives', fakeAsync(() => {
    setup();
    fixture.detectChanges();
    expect(host().querySelector('mc-skeleton-loader')).toBeTruthy();
    tick(500);
  }));

  it('should show page title after successful load', fakeAsync(() => {
    setup();
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
    expect(host().querySelector('.equipe__page-title')?.textContent?.trim()).toBe('Équipe');
  }));

  it('should show error state on 500', fakeAsync(() => {
    setup(ErrorSupervisorService);
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
    expect(host().querySelector('mc-error-state')).toBeTruthy();
  }));

  it('should show forbidden state on 403', fakeAsync(() => {
    setup(ForbiddenSupervisorService);
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
    expect(host().querySelector('mc-forbidden-state')).toBeTruthy();
  }));

  // ── DataGrid rendering ─────────────────────────────────────────────────────

  it('should render the DataGrid in success state', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    expect(host().querySelector('mc-data-grid')).toBeTruthy();
  }));

  it('should display correct agent count in subtitle', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const sub = host().querySelector('.equipe__page-sub')?.textContent ?? '';
    expect(sub).toContain('3 agent');
  }));

  it('should count active agents (excludes ON_LEAVE)', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const sub = host().querySelector('.equipe__page-sub')?.textContent ?? '';
    // Agent 3 has status ON_LEAVE → 2 actifs
    expect(sub).toContain('2 actif');
  }));

  // ── Portfolio filter ───────────────────────────────────────────────────────

  it('should populate portfolio select options', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const select = host().querySelector<HTMLSelectElement>('.equipe__portfolio-select');
    // "Tous les portefeuilles" + at least one portfolio
    expect(select!.options.length).toBeGreaterThan(1);
  }));

  it('should filter rows when portfolio is changed', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    // 3 agents → 3 portfolios A/B/C (one per agent)
    // Filtering to "Portefeuille A" shows 1 agent
    component.portfolio.set('Portefeuille A');
    fixture.detectChanges();
    expect(component.filtered().length).toBe(1);
  }));

  it('should show all rows when portfolio is "all"', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    component.portfolio.set('Portefeuille A');
    component.portfolio.set('all');
    fixture.detectChanges();
    expect(component.filtered().length).toBe(3);
  }));

  // ── Period filter (state only — API not connected) ─────────────────────────

  it('should start with period "30j"', () => {
    setup();
    fixture.detectChanges();
    expect(component.period()).toBe('30j');
  });

  it('should update period signal on pill click', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const pills = host().querySelectorAll<HTMLButtonElement>('.equipe__period-btn');
    // Pills: 7j / 30j / 90j / Tout — click "Tout" (index 3)
    pills[3].click();
    fixture.detectChanges();
    expect(component.period()).toBe('Tout');
  }));

  // ── Drawer ─────────────────────────────────────────────────────────────────

  it('should not show drawer initially', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    expect(host().querySelector('.equipe__drawer')).toBeNull();
  }));

  it('should open drawer on row click via openDrawer()', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    const row = component.gridRows()[0];
    component.openDrawer(row);
    fixture.detectChanges();
    expect(host().querySelector('.equipe__drawer')).toBeTruthy();
  }));

  it('should show agent name in drawer', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    component.openDrawer(component.gridRows()[0]);
    fixture.detectChanges();
    const name = host().querySelector('.equipe__drawer-name')?.textContent?.trim() ?? '';
    expect(name).toBe('Agent Numéro1');
  }));

  it('should show correct KPI values in drawer', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    component.openDrawer(component.gridRows()[0]); // Agent 1
    fixture.detectChanges();
    const values = [...host().querySelectorAll('.equipe__drawer-kpi-value')]
      .map(el => el.textContent?.trim());
    expect(values).toContain('60');  // assignedCases = 50 + 1*10
    expect(values).toContain('6');   // actionsToday  = 5 + 1
    expect(values).toContain('4');   // promisesObtained = 3 + 1
  }));

  it('should close drawer on close button click', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    component.openDrawer(component.gridRows()[0]);
    fixture.detectChanges();
    const closeBtn = host().querySelector<HTMLButtonElement>('.equipe__drawer-close');
    closeBtn!.click();
    fixture.detectChanges();
    expect(host().querySelector('.equipe__drawer')).toBeNull();
  }));

  it('should show "Absent" badge for ON_LEAVE agent', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    // Agent 3 (index 2) has status ON_LEAVE
    component.openDrawer(component.gridRows()[2]);
    fixture.detectChanges();
    expect(host().querySelector('.equipe__badge--absent')).toBeTruthy();
  }));

  it('should show "Actif" badge for active agent', fakeAsync(() => {
    setup();
    fixture.detectChanges(); tick(500); fixture.detectChanges();
    component.openDrawer(component.gridRows()[0]);
    fixture.detectChanges();
    expect(host().querySelector('.equipe__badge--actif')).toBeTruthy();
  }));
});

// ── Navigation test: Sidebar → Équipe (rôle SUPERVISOR) ─────────────────────

describe('Navigation — Sidebar "Équipe" (rôle SUPERVISOR)', () => {
  let fixture: ComponentFixture<AppSidebarComponent>;
  let activeRole: MockActiveRoleService;
  let permissions: MockPermissionService;

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [
        provideRouter([]),
        { provide: ActiveRoleService, useClass: MockActiveRoleService },
        { provide: PermissionService, useClass: MockPermissionService },
      ],
    }).compileComponents();

    activeRole  = TestBed.inject(ActiveRoleService) as MockActiveRoleService;
    permissions = TestBed.inject(PermissionService) as MockPermissionService;
  });

  afterEach(() => TestBed.resetTestingModule());

  it('should display "Équipe" link in contextual menu for SUPERVISOR', () => {
    activeRole.setRole('SUPERVISOR');   // syncs permissions to 'superviseur' profile
    fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const labels = [...host().querySelectorAll('.sidebar__ctx-nav .snp__label')]
      .map(el => el.textContent?.trim());
    expect(labels).toContain('Équipe');
  });

  it('should link "Équipe" to /superviseur/equipe', () => {
    activeRole.setRole('SUPERVISOR');
    fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const links = [...host().querySelectorAll<HTMLAnchorElement>('.sidebar__ctx-nav .snp__item')];
    const equipeLink = links.find(a => a.textContent?.includes('Équipe'));
    expect(equipeLink).toBeTruthy();
    expect(equipeLink!.getAttribute('href')).toBe('/superviseur/equipe');
  });

  it('should not display AGENT contextual block for SUPERVISOR', () => {
    activeRole.setRole('SUPERVISOR');
    fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
    // AGENT has empty contextual menu, SUPERVISOR has its own block
    const sectionTitle = host().querySelector('.sidebar__section-title')?.textContent?.trim();
    expect(sectionTitle).toBe('Espace Superviseur');
  });

  it('should not show "Équipe" link for AGENT role', () => {
    activeRole.setRole('AGENT');
    fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();

    const labels = [...host().querySelectorAll('.sidebar__ctx-nav .snp__label')]
      .map(el => el.textContent?.trim());
    expect(labels).not.toContain('Équipe');
  });
});
