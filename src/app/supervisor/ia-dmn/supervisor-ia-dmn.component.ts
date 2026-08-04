import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecisionMonitoringService } from '../../shared/data-access/decision-monitoring.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { DecisionMonitoringDto } from '../../shared/data-access/models/supervisor.model';
import { HasRightDirective } from '../../shared/data-access/has-right.directive';
import { ViewState } from '../../shared/ui/ui.types';
import {
  SkeletonLoaderComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  SuccessToastComponent,
  KpiCardComponent,
} from '../../shared/ui';

type PeriodFilter = '7D' | '30D' | '90D' | 'ALL';
type FeedbackType = 'ACCEPTEE' | 'REJETEE' | 'EXECUTEE';

@Component({
  selector: 'mc-supervisor-ia-dmn',
  standalone: true,
  imports: [
    RouterLink,
    HasRightDirective,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
    SuccessToastComponent,
    KpiCardComponent,
  ],
  templateUrl: './supervisor-ia-dmn.component.html',
  styleUrl: './supervisor-ia-dmn.component.scss',
})
export class SuperviseurIaDmnComponent implements OnInit {
  private readonly decisionSvc = inject(DecisionMonitoringService);
  private readonly permSvc     = inject(PermissionService);
  private readonly router      = inject(Router);

  readonly PERIODS: Array<{ key: PeriodFilter; label: string }> = [
    { key: '7D',  label: '7 jours'  },
    { key: '30D', label: '30 jours' },
    { key: '90D', label: '90 jours' },
    { key: 'ALL', label: 'Tout'     },
  ];

  readonly viewState      = signal<ViewState>('loading');
  readonly decisions      = signal<DecisionMonitoringDto[]>([]);
  readonly period         = signal<PeriodFilter>('30D');
  readonly selected       = signal<DecisionMonitoringDto | null>(null);
  readonly feedbackType   = signal<FeedbackType | null>(null);
  readonly feedbackResult = signal('');
  readonly feedbackError  = signal(false);
  readonly submitting     = signal(false);
  readonly showToast      = signal(false);
  readonly toastMsg       = signal('');

  readonly filtered = computed(() => {
    const all = this.decisions();
    const p = this.period();
    if (p === 'ALL') return all;
    const cutoff = new Date();
    const days = p === '7D' ? 7 : p === '30D' ? 30 : 90;
    cutoff.setDate(cutoff.getDate() - days);
    return all.filter(d => new Date(d.decisionDate) >= cutoff);
  });

  readonly totalDecisions  = computed(() => this.filtered().length);
  readonly withFeedback    = computed(() => this.filtered().filter(d => !!d.agentFeedback).length);
  readonly acceptedCount   = computed(() =>
    this.filtered().filter(d => !!d.agentFeedback && d.agentFeedback.startsWith('Accord')).length
  );
  readonly tauxExecution   = computed(() => {
    const t = this.totalDecisions();
    return t ? Math.round((this.withFeedback() / t) * 100) : 0;
  });
  readonly tauxAcceptation = computed(() => {
    const fb = this.withFeedback();
    return fb ? Math.round((this.acceptedCount() / fb) * 100) : 0;
  });
  readonly scoreMoyen      = computed(() => {
    const items = this.filtered();
    if (!items.length) return 0;
    return Math.round(items.reduce((s, d) => s + d.score, 0) / items.length);
  });

  ngOnInit(): void {
    if (!this.permSvc.hasRight('CASE_ASSIGN')) {
      this.viewState.set('forbidden');
      return;
    }
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.selected.set(null);
    this.decisionSvc.getDecisions().subscribe({
      next: page => {
        this.decisions.set(page.items);
        this.viewState.set('success');
      },
      error: () => this.viewState.set('error'),
    });
  }

  selectRow(d: DecisionMonitoringDto): void {
    if (this.selected()?.decisionId === d.decisionId) {
      this.selected.set(null);
    } else {
      this.selected.set(d);
      this.feedbackType.set(null);
      this.feedbackResult.set('');
      this.feedbackError.set(false);
    }
  }

  closeDetail(): void { this.selected.set(null); }

  setFeedbackResult(v: string): void { this.feedbackResult.set(v); }

  onSubmitFeedback(): void {
    if (!this.feedbackType()) { this.feedbackError.set(true); return; }
    const d = this.selected();
    if (!d || this.submitting()) return;
    this.feedbackError.set(false);
    this.submitting.set(true);

    const LABELS: Record<FeedbackType, string> = {
      ACCEPTEE: 'Accord',
      REJETEE:  'Désaccord',
      EXECUTEE: 'Exécutée',
    };
    const ft = this.feedbackType()!;
    const text = LABELS[ft] + (this.feedbackResult().trim() ? ' – ' + this.feedbackResult().trim() : '');

    this.decisionSvc.submitFeedback(d.decisionId, text).subscribe({
      next: updated => {
        this.decisions.update(list =>
          list.map(x => x.decisionId === updated.decisionId ? updated : x)
        );
        this.selected.set(updated);
        this.submitting.set(false);
        this.toastMsg.set(`Feedback enregistré pour ${d.caseReference}.`);
        this.showToast.set(true);
      },
      error: () => this.submitting.set(false),
    });
  }

  navigateToDossier(caseId: string): void {
    this.router.navigate(['/dossiers', caseId]);
  }

  protected feedbackBadge(d: DecisionMonitoringDto): 'accord' | 'desaccord' | 'executee' | null {
    if (!d.agentFeedback) return null;
    if (d.agentFeedback.startsWith('Accord')) return 'accord';
    if (d.agentFeedback.startsWith('Désaccord')) return 'desaccord';
    return 'executee';
  }

  protected actionLabel(action: string): string {
    const MAP: Record<string, string> = {
      REMINDER_LETTER:       'Courrier de rappel',
      PHONE_CALL_INTENSIVE:  'Appel intensif',
      FORMAL_NOTICE:         'Mise en demeure',
      ESCALATION_PRE_LEGAL:  'Pré-contentieux',
      FORMAL_NOTICE_AR:      'Mise en demeure AR',
      OUTBOUND_CALL:         'Appel sortant',
    };
    return MAP[action] ?? action;
  }

  protected segmentLabel(segment: string): string {
    const MAP: Record<string, string> = {
      STANDARD:       'Standard',
      HIGH_RISK:      'Haut risque',
      BROKEN_PROMISE: 'Promesse rompue',
      CRITICAL:       'Critique',
      PRE_LEGAL:      'Pré-contentieux',
    };
    return MAP[segment] ?? segment;
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected formatJson(obj: Record<string, unknown>): string {
    return JSON.stringify(obj, null, 2);
  }
}
