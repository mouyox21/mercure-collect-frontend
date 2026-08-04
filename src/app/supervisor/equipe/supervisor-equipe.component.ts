import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupervisorService } from '../../shared/data-access/supervisor.service';
import { AgentPerformanceDto } from '../../shared/data-access/models/supervisor.model';
import { ViewState } from '../../shared/ui/ui.types';
import { ColumnDef, GridRow } from '../../shared/ui/data-grid/data-grid.types';
import {
  DataGridComponent,
  SkeletonLoaderComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
} from '../../shared/ui';

type Period = '7j' | '30j' | '90j' | 'Tout';

interface AgentRow extends AgentPerformanceDto {
  readonly portfolio: string;
}

// Simulated portfolio assignment — rotates by agent index until a real
// portfolio field is added to the API model.
const PORTFOLIO_NAMES = ['Portefeuille A', 'Portefeuille B', 'Portefeuille C'] as const;

@Component({
  selector: 'mc-superviseur-equipe',
  standalone: true,
  imports: [
    DataGridComponent,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
  ],
  templateUrl: './supervisor-equipe.component.html',
  styleUrl: './supervisor-equipe.component.scss',
})
export class SuperviseurEquipeComponent implements OnInit {
  private readonly supervisorSvc = inject(SupervisorService);
  private readonly router        = inject(Router);

  protected readonly PERIODS: readonly Period[]         = ['7j', '30j', '90j', 'Tout'];
  protected readonly PORTFOLIO_NAMES = PORTFOLIO_NAMES;

  readonly viewState   = signal<ViewState>('loading');
  private readonly allAgents = signal<AgentRow[]>([]);
  readonly period    = signal<Period>('30j');
  readonly portfolio = signal<string>('all');
  readonly selected  = signal<AgentRow | null>(null);

  readonly portfolioOptions = computed(() =>
    [...new Set(this.allAgents().map(a => a.portfolio))].sort()
  );

  readonly filtered = computed(() => {
    const agents = this.allAgents();
    const pf     = this.portfolio();
    return pf === 'all' ? agents : agents.filter(a => a.portfolio === pf);
  });

  readonly totalAgents  = computed(() => this.allAgents().length);
  readonly activeAgents = computed(() =>
    this.allAgents().filter(a => a.status !== 'ON_LEAVE').length
  );

  protected readonly COLUMNS: ColumnDef[] = [
    { key: 'agent',     label: 'Agent',        sortable: true },
    { key: 'portfolio', label: 'Portefeuille',  sortable: true },
    { key: 'charge',    label: 'Charge',        sortable: true, align: 'right' },
    { key: 'promesses', label: 'Promesses',     sortable: true, align: 'right' },
    { key: 'recouvre',  label: 'Recouvré',      sortable: true, align: 'right', isAmount: true },
    { key: 'sla',       label: 'SLA',           sortable: true, align: 'right',
      cellFn: (row) => `${row['sla']} %` },
  ];

  readonly gridRows = computed((): GridRow[] =>
    this.filtered().map(a => ({
      id:        a.agentId,
      agent:     a.agentName,
      portfolio: a.portfolio,
      charge:    a.assignedCases,
      promesses: a.promisesObtained,
      recouvre:  a.collectedAmount,
      sla:       a.recoveryRate,
      _agent:    a,
    }))
  );

  ngOnInit(): void { this.load(); }

  load(): void {
    this.viewState.set('loading');
    this.supervisorSvc.getDashboard().subscribe({
      next: (dto) => {
        this.allAgents.set(
          dto.teamPerformance.map((a, i) => ({
            ...a,
            portfolio: PORTFOLIO_NAMES[i % PORTFOLIO_NAMES.length],
          }))
        );
        this.viewState.set('success');
      },
      error: (err: { status?: number }) => {
        this.viewState.set(err?.status === 403 ? 'forbidden' : 'error');
      },
    });
  }

  openDrawer(row: GridRow): void {
    this.selected.set(row['_agent'] as AgentRow);
  }

  closeDrawer(): void { this.selected.set(null); }

  navigateToDossiers(agentId: string): void {
    this.router.navigate(['/dossiers'], { queryParams: { agent: agentId } });
  }

  protected formatAmountM(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M MAD';
    if (n >= 1_000)     return Math.round(n / 1_000) + ' k MAD';
    return new Intl.NumberFormat('fr-FR').format(n) + ' MAD';
  }

  protected initials(name: string): string {
    return name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
  }
}
