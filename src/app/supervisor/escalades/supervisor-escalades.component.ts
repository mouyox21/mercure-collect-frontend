import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EscalationService } from '../../shared/data-access/escalation.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { EscalationDto } from '../../shared/data-access/models/supervisor.model';
import { ViewState } from '../../shared/ui/ui.types';
import {
  SkeletonLoaderComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  SuccessToastComponent,
} from '../../shared/ui';

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
type DecideAction = 'APPROVE' | 'REJECT' | 'COMPLEMENT' | 'REASSIGN';

const PRIORITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
const STATUS_ORDER: Record<string, number>   = { PENDING: 0, ESCALATED: 1, APPROVED: 2, REJECTED: 3 };

@Component({
  selector: 'mc-supervisor-escalades',
  standalone: true,
  imports: [RouterLink, SkeletonLoaderComponent, ErrorStateComponent, ForbiddenStateComponent, SuccessToastComponent],
  templateUrl: './supervisor-escalades.component.html',
  styleUrl: './supervisor-escalades.component.scss',
})
export class SuperviseurEscaladesComponent implements OnInit {
  private readonly escalationSvc = inject(EscalationService);
  private readonly permSvc       = inject(PermissionService);
  private readonly router        = inject(Router);

  readonly viewState    = signal<ViewState>('loading');
  readonly escalations  = signal<EscalationDto[]>([]);
  readonly filterStatus = signal<FilterStatus>('ALL');
  readonly selected     = signal<EscalationDto | null>(null);
  readonly motif        = signal('');
  readonly motifError   = signal(false);
  readonly deciding     = signal(false);
  readonly showToast    = signal(false);
  readonly toastMsg     = signal('');

  readonly filtered = computed(() => {
    const s = this.filterStatus();
    const all = this.escalations();
    return s === 'ALL' ? all : all.filter(e => e.status === s);
  });

  readonly sorted = computed(() =>
    [...this.filtered()].sort((a, b) => {
      const sd = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (sd !== 0) return sd;
      const pd = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      if (pd !== 0) return pd;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
  );

  readonly countPending   = computed(() => this.escalations().filter(e => e.status === 'PENDING').length);
  readonly countApproved  = computed(() => this.escalations().filter(e => e.status === 'APPROVED').length);
  readonly countRejected  = computed(() => this.escalations().filter(e => e.status === 'REJECTED').length);
  readonly countEscalated = computed(() => this.escalations().filter(e => e.status === 'ESCALATED').length);

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
    this.escalationSvc.getEscalations().subscribe({
      next: page => {
        this.escalations.set(page.items);
        this.viewState.set('success');
      },
      error: () => this.viewState.set('error'),
    });
  }

  selectRow(esc: EscalationDto): void {
    if (this.selected()?.escalationId === esc.escalationId) {
      this.selected.set(null);
    } else {
      this.selected.set(esc);
      this.motif.set('');
      this.motifError.set(false);
    }
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  setMotif(value: string): void {
    this.motif.set(value);
    if (value.trim()) this.motifError.set(false);
  }

  onDecide(action: DecideAction): void {
    if (!this.motif().trim()) { this.motifError.set(true); return; }
    const esc = this.selected();
    if (!esc || this.deciding()) return;
    this.motifError.set(false);
    this.deciding.set(true);

    const decision = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const prefix   = action === 'COMPLEMENT' ? '↩ Complément demandé : '
                   : action === 'REASSIGN'   ? '↪ Réaffectation : '
                   : '';
    const TOASTS: Record<DecideAction, string> = {
      APPROVE:    `Escalade ${esc.caseReference} approuvée.`,
      REJECT:     `Escalade ${esc.caseReference} refusée.`,
      COMPLEMENT: `Complément d'information demandé — ${esc.caseReference}.`,
      REASSIGN:   `Réaffectation enregistrée — ${esc.caseReference}.`,
    };

    this.escalationSvc.decide({
      escalationId: esc.escalationId,
      decision,
      comment: prefix + this.motif(),
    }).subscribe({
      next: updated => {
        this.escalations.update(list =>
          list.map(e => e.escalationId === updated.escalationId ? updated : e)
        );
        this.selected.set(null);
        this.deciding.set(false);
        this.toastMsg.set(TOASTS[action]);
        this.showToast.set(true);
      },
      error: () => this.deciding.set(false),
    });
  }

  navigateToDossier(caseId: string): void {
    this.router.navigate(['/dossiers', caseId]);
  }

  protected priorityLabel(p: string): string {
    return ({ CRITICAL: 'Critique', HIGH: 'Élevée', NORMAL: 'Normale' } as Record<string, string>)[p] ?? p;
  }

  protected statusLabel(s: string): string {
    return ({
      PENDING: 'En attente', APPROVED: 'Approuvée',
      REJECTED: 'Rejetée',  ESCALATED: 'Escaladée',
    } as Record<string, string>)[s] ?? s;
  }

  protected dmnLabel(code: string | undefined): string {
    if (!code) return '—';
    const MAP: Record<string, string> = {
      PRE_LEGAL:          'Pré-contentieux',
      FORMAL_NOTICE:      'Mise en demeure',
      URGENT_CALL:        'Appel urgent',
      URGENT_FIELD_VISIT: 'Visite terrain urgente',
      CONTINUE_AMIABLE:   'Continuer amiable',
    };
    return MAP[code] ?? code;
  }

  protected formatAmount(n: number): string {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' MAD';
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
