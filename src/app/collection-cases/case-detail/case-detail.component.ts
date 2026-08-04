import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionCaseService } from '../../shared/data-access/collection-case.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { CollectionCaseDetailDto } from '../../shared/data-access/models/collection-case.model';
import {
  ActionModalType,
  ActionSubmitEvent,
  CaseContextDto,
  TimelineEvent,
  ViewState,
} from '../../shared/ui/ui.types';
import {
  ActionModalComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  PromiseListComponent,
  SkeletonLoaderComponent,
  SuccessToastComponent,
  TimelineComponent,
} from '../../shared/ui';

type TabId =
  | 'synthese'
  | 'dette'
  | 'actions'
  | 'interactions'
  | 'promesses'
  | 'echeancier'
  | 'documents'
  | 'contentieux'
  | 'historique';

const NBA_TO_ACTION_TYPE: Record<string, ActionModalType> = {
  PHONE_CALL:     'PHONE_CALL',
  SMS:            'SMS',
  EMAIL:          'EMAIL',
  LETTER:         'LETTER',
  VISIT:          'VISIT',
  RELANCE:        'RELANCE',
  CONTACT_SEARCH: 'CONTACT_SEARCH',
};

@Component({
  selector: 'mc-case-detail',
  standalone: true,
  imports: [
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
    ActionModalComponent,
    PromiseListComponent,
    TimelineComponent,
    SuccessToastComponent,
  ],
  templateUrl: './case-detail.component.html',
  styleUrl: './case-detail.component.scss',
})
export class CaseDetailComponent implements OnInit {
  private readonly route   = inject(ActivatedRoute);
  private readonly router  = inject(Router);
  private readonly caseSvc = inject(CollectionCaseService);
  private readonly permSvc = inject(PermissionService);

  private readonly caseId = signal('');

  readonly viewState       = signal<ViewState>('loading');
  readonly caseDetail      = signal<CollectionCaseDetailDto | null>(null);
  readonly activeTab       = signal<TabId>('synthese');
  readonly actionModalOpen = signal(false);
  readonly preselectedType = signal<ActionModalType | null>(null);
  readonly timeline        = signal<TimelineEvent[]>([]);
  readonly showToast       = signal(false);
  readonly toastMsg        = signal('');
  readonly closureBlocked  = signal(false);

  readonly canAction      = computed(() => this.permSvc.hasRight('ACTION_CREATE'));
  readonly canPromise     = computed(() => this.permSvc.hasRight('PROMISE_CREATE'));
  readonly canPaymentPlan = computed(() => this.permSvc.hasRight('PAYMENT_PLAN_CREATE'));
  readonly canClose       = computed(() => this.permSvc.hasRight('CASE_UPDATE'));
  readonly canEscalate    = computed(() => this.permSvc.hasRight('ESCALATION_CREATE'));
  readonly isSupervisor   = computed(() => this.permSvc.currentProfile() !== 'agent');

  readonly caseContext = computed<CaseContextDto | null>(() => {
    const d = this.caseDetail();
    if (!d) return null;
    return {
      caseId:        d.caseId,
      caseReference: d.caseReference,
      debtorName:    d.debtorName,
      overdueAmount: d.overdueAmount,
      daysLate:      d.daysLate,
      status:        d.status,
    };
  });

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'synthese',      label: 'Synthèse'      },
    { id: 'dette',         label: 'Dette'         },
    { id: 'actions',       label: 'Actions'       },
    { id: 'interactions',  label: 'Interactions'  },
    { id: 'promesses',     label: 'Promesses'     },
    { id: 'echeancier',    label: 'Échéancier'    },
    { id: 'documents',     label: 'Documents'     },
    { id: 'contentieux',   label: 'Contentieux'   },
    { id: 'historique',    label: 'Historique'    },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('caseId') ?? '';
    this.caseId.set(id);
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.caseSvc.getCaseDetail(this.caseId()).subscribe({
      next: (detail) => {
        this.caseDetail.set(detail);
        this.viewState.set('success');
      },
      error: (err: any) => {
        if (err?.status === 403) { this.viewState.set('forbidden'); return; }
        this.viewState.set('error');
      },
    });
  }

  onTreatAction(): void {
    const nba = this.caseDetail()?.dmnDecision?.nextBestAction;
    this.preselectedType.set(NBA_TO_ACTION_TYPE[nba ?? ''] ?? null);
    this.activeTab.set('actions');
    this.actionModalOpen.set(true);
  }

  onActionSubmitted(event: ActionSubmitEvent): void {
    this.actionModalOpen.set(false);
    // Prepend to timeline immediately — CA-CAS-03: no page reload needed
    this.timeline.update(list => [event.timelineEntry, ...list]);
    if (event.promiseTimelineEntry) {
      this.timeline.update(list => [event.promiseTimelineEntry!, ...list]);
    }
    this.caseSvc.performAction({
      caseId:          event.caseId,
      actionType:      event.actionType,
      channel:         event.channel,
      scheduledDate:   event.scheduledDate,
      report:          event.commentaire,
      outcome:         event.outcome,
      durationMinutes: event.durationMinutes,
      createPromise:   event.createPromise,
      promiseDate:     event.promiseDate,
      promiseAmount:   event.promiseAmount,
    }).subscribe();
    this.showSuccess('Action enregistrée avec succès.');
  }

  onEscalate(): void {
    this.activeTab.set('contentieux');
    this.showSuccess('Escalade initiée — dossier transmis au superviseur.');
  }

  navigateToSchedule(): void {
    this.router.navigate(['/dossiers', this.caseDetail()!.caseId, 'echeanciers']);
  }

  onCloseCase(): void {
    const d = this.caseDetail();
    if (!d) return;
    if ((d.hasActivePromise || d.hasActivePaymentPlan) && !this.isSupervisor()) {
      this.closureBlocked.set(true);
      return;
    }
    this.closureBlocked.set(false);
    this.showSuccess('Dossier clôturé avec succès.');
  }

  goBack(): void {
    this.router.navigate(['/dossiers']);
  }

  private showSuccess(msg: string): void {
    this.toastMsg.set(msg);
    this.showToast.set(true);
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  protected statusLabel(s: string): string {
    const MAP: Record<string, string> = {
      OPEN: 'Ouvert', PENDING: 'En attente', SUSPENDED: 'Suspendu', CLOSED: 'Clôturé',
    };
    return MAP[s] ?? s;
  }

  protected statusModifier(s: string): string {
    const MAP: Record<string, string> = {
      OPEN: 'open', PENDING: 'pending', SUSPENDED: 'suspended', CLOSED: 'closed',
    };
    return MAP[s] ?? 'open';
  }

  protected priorityLabel(p: string): string {
    const MAP: Record<string, string> = {
      CRITICAL: 'Critique', HIGH: 'Haute', NORMAL: 'Normal', LOW: 'Faible',
    };
    return MAP[p] ?? p;
  }

  protected priorityModifier(p: string): string {
    return p.toLowerCase();
  }

  protected phaseLabel(ph: string): string {
    const MAP: Record<string, string> = {
      AMIABLE: 'Amiable', PRE_LEGAL: 'Pré-contentieux', LEGAL: 'Contentieux',
    };
    return MAP[ph] ?? ph;
  }

  protected nbaLabel(nba: string): string {
    const MAP: Record<string, string> = {
      PHONE_CALL:     'Appel téléphonique',
      SMS:            'SMS',
      EMAIL:          'E-mail',
      LETTER:         'Courrier',
      VISIT:          'Visite sur site',
      RELANCE:        'Relance',
      CONTACT_SEARCH: 'Recherche contact',
    };
    return MAP[nba] ?? nba;
  }

  protected segmentLabel(s: string): string {
    const MAP: Record<string, string> = {
      STANDARD: 'Standard', VIP: 'VIP', SENSIBLE: 'Sensible', RISK: 'À risque',
    };
    return MAP[s] ?? s;
  }

  protected formatAmount(amount: number, currency = 'MAD'): string {
    return (
      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(amount) +
      ' ' + currency
    );
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  protected debtStatusLabel(s: string): string {
    const MAP: Record<string, string> = {
      OVERDUE: 'Impayé', LEGAL: 'Contentieux', PAID: 'Payé', NEGOTIATED: 'Négocié',
    };
    return MAP[s] ?? s;
  }

  protected debtStatusModifier(s: string): string {
    return (s ?? '').toLowerCase();
  }

  protected channelIcon(ch: string): string {
    const MAP: Record<string, string> = {
      PHONE: '📞', EMAIL: '📧', LETTER: '✉️', SMS: '💬', VISIT: '🏢',
    };
    return MAP[ch] ?? '📋';
  }

  protected docTypeLabel(t: string): string {
    const MAP: Record<string, string> = {
      CONTRAT: 'Contrat', MISE_EN_DEMEURE: 'Mise en demeure', JUGEMENT: 'Jugement',
      GARANTIE: 'Garantie', COURRIER: 'Courrier', AUTRE: 'Autre',
    };
    return MAP[t] ?? t;
  }

  protected installmentStatusLabel(s: string): string {
    const MAP: Record<string, string> = {
      SCHEDULED: 'Planifié', PAID: 'Payé', LATE: 'En retard',
    };
    return MAP[s] ?? s;
  }

  protected installmentStatusModifier(s: string): string {
    return (s ?? '').toLowerCase();
  }

  protected legalPhaseLabel(p: string): string {
    const MAP: Record<string, string> = {
      INJONCTION: 'Injonction de payer', AUDIENCE: 'Audience', EXECUTION: 'Exécution',
    };
    return MAP[p] ?? p;
  }

  protected legalEventLabel(t: string): string {
    const MAP: Record<string, string> = {
      FILING: 'Dépôt', HEARING_SCHEDULED: 'Audience fixée',
      SEIZURE_ORDER: 'Ordonnance de saisie', JUDGMENT: 'Jugement rendu',
    };
    return MAP[t] ?? t;
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  protected formatDateTime(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
