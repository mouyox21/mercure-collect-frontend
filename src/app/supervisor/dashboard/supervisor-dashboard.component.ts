import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SupervisorService } from '../../shared/data-access/supervisor.service';
import { EscalationService } from '../../shared/data-access/escalation.service';
import { ActiveRoleService } from '../../shared/data-access/active-role.service';
import {
  SupervisorDashboardDto,
  AgingBucketDto,
  EscalationDto,
  AlertSeverity,
} from '../../shared/data-access/models/supervisor.model';
import { ViewState } from '../../shared/ui/ui.types';
import {
  KpiCardComponent,
  SkeletonLoaderComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  SuccessToastComponent,
} from '../../shared/ui';

@Component({
  selector: 'mc-supervisor-dashboard',
  standalone: true,
  imports: [
    KpiCardComponent,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
    SuccessToastComponent,
    RouterLink,
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.scss',
})
export class SuperviseurDashboardComponent implements OnInit {
  private readonly supervisorSvc = inject(SupervisorService);
  private readonly escalationSvc = inject(EscalationService);
  private readonly router        = inject(Router);
  private readonly activeRole    = inject(ActiveRoleService);

  readonly viewState          = signal<ViewState>('loading');
  readonly dashboard          = signal<SupervisorDashboardDto | null>(null);
  readonly pendingEscalations = signal<EscalationDto[]>([]);
  readonly showToast          = signal(false);
  readonly toastMsg           = signal('');
  readonly decidingId         = signal<string | null>(null);

  readonly pageTitle      = computed(() =>
    this.activeRole.currentRole() === 'SUPERVISOR' ? 'Vue superviseur' : 'Vue manager'
  );

  readonly kpis           = computed(() => this.dashboard()?.kpis ?? null);
  readonly aging          = computed(() => this.dashboard()?.portfolioByAging ?? []);
  readonly team           = computed(() => this.dashboard()?.teamPerformance ?? []);
  readonly alerts         = computed(() => this.dashboard()?.priorityAlerts ?? []);
  readonly supervisorName = computed(() => this.dashboard()?.supervisorName ?? '');
  readonly businessDate   = computed(() => {
    const d = this.dashboard()?.businessDate;
    return d ? this.formatDate(d) : '';
  });

  readonly totalCollected = computed(() =>
    this.dashboard()?.teamPerformance.reduce((s, a) => s + a.collectedAmount, 0) ?? 0
  );

  readonly agingMaxAmount = computed(() => {
    const buckets = this.aging();
    if (!buckets.length) return 1;
    return Math.max(...buckets.map(b => b.totalAmount));
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.supervisorSvc.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.escalationSvc.getEscalations('PENDING').subscribe({
          next: (page) => this.pendingEscalations.set(page.items),
          error: () => {},
        });
        this.viewState.set('success');
      },
      error: (err: any) => {
        if (err?.status === 403) { this.viewState.set('forbidden'); return; }
        this.viewState.set('error');
      },
    });
  }

  onValidateEscalation(esc: EscalationDto): void {
    if (this.decidingId() === esc.escalationId) return;
    this.decidingId.set(esc.escalationId);
    this.escalationSvc.decide({
      escalationId: esc.escalationId,
      decision: 'APPROVED',
      comment: 'Validé depuis le tableau de bord superviseur.',
    }).subscribe({
      next: () => {
        this.pendingEscalations.update(list => list.filter(e => e.escalationId !== esc.escalationId));
        this.decidingId.set(null);
        this.showSuccess(`Escalade ${esc.caseReference} validée.`);
      },
      error: () => this.decidingId.set(null),
    });
  }

  onDernierAppel(esc: EscalationDto): void {
    if (this.decidingId() === esc.escalationId) return;
    this.decidingId.set(esc.escalationId);
    this.escalationSvc.decide({
      escalationId: esc.escalationId,
      decision: 'REJECTED',
      comment: 'Dernier appel demandé avant décision finale.',
    }).subscribe({
      next: () => {
        this.pendingEscalations.update(list => list.filter(e => e.escalationId !== esc.escalationId));
        this.decidingId.set(null);
        this.showSuccess(`Dernier appel demandé — ${esc.caseReference}.`);
      },
      error: () => this.decidingId.set(null),
    });
  }

  navigateToDossier(caseId: string): void {
    this.router.navigate(['/dossiers', caseId]);
  }

  protected formatAmount(n: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' MAD';
  }

  protected formatAmountM(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.', ',') + ' M MAD';
    if (n >= 1_000)     return Math.round(n / 1_000) + ' k MAD';
    return this.formatAmount(n);
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  protected alertIcon(type: string): string {
    const MAP: Record<string, string> = {
      ESCALATION_PENDING:   '⚠️',
      BROKEN_PROMISE_SPIKE: '💔',
      AGENT_PERFORMANCE:    '📉',
      LEGAL_HEARING:        '⚖️',
      OVERDUE_SPIKE:        '📈',
    };
    return MAP[type] ?? '🔔';
  }

  protected isCritical(s: AlertSeverity): boolean { return s === 'CRITICAL'; }
  protected isWarning(s: AlertSeverity): boolean  { return s === 'WARNING'; }

  protected agingBarPct(bucket: AgingBucketDto): number {
    const max = this.agingMaxAmount();
    return max > 0 ? Math.round((bucket.totalAmount / max) * 100) : 0;
  }

  protected dmnLabel(rec: string | undefined): string {
    if (!rec) return '—';
    const MAP: Record<string, string> = {
      PRE_LEGAL:          'Pré-contentieux',
      FORMAL_NOTICE:      'Mise en demeure',
      URGENT_CALL:        'Appel urgent',
      URGENT_FIELD_VISIT: 'Visite terrain',
      CONTINUE_AMIABLE:   'Continuer amiable',
    };
    return MAP[rec] ?? rec;
  }

  private showSuccess(msg: string): void {
    this.toastMsg.set(msg);
    this.showToast.set(true);
  }
}
