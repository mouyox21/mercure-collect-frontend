import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LegalCaseService } from '../../shared/data-access/legal-case.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { LegalCaseDto } from '../../shared/data-access/models/legal-case.model';
import { ViewState } from '../../shared/ui/ui.types';
import {
  DataGridComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  SkeletonLoaderComponent,
  StaleDataBannerComponent,
} from '../../shared/ui';
import type { ColumnDef, GridRow } from '../../shared/ui';

@Component({
  selector: 'mc-contentieux',
  standalone: true,
  imports: [
    DataGridComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
    StaleDataBannerComponent,
  ],
  templateUrl: './contentieux.component.html',
  styleUrl: './contentieux.component.scss',
})
export class ContentieuxComponent implements OnInit {
  private readonly legalSvc = inject(LegalCaseService);
  private readonly permSvc  = inject(PermissionService);
  private readonly router   = inject(Router);

  readonly viewState    = signal<ViewState>('loading');
  readonly items        = signal<LegalCaseDto[]>([]);
  readonly dataDate     = signal('');
  readonly selectedCase = signal<LegalCaseDto | null>(null);

  readonly filterStatus  = signal('');
  readonly filterPhase   = signal('');
  readonly filterLawyer  = signal('');

  readonly canManage = computed(() => this.permSvc.hasRight('LEGAL_CASE_MANAGE'));

  readonly filteredItems = computed(() => {
    let list = this.items();
    const status = this.filterStatus();
    const phase  = this.filterPhase();
    const lawyer = this.filterLawyer();
    if (status) list = list.filter(c => c.status === status);
    if (phase)  list = list.filter(c => c.phase  === phase);
    if (lawyer) list = list.filter(c => c.lawyerId === lawyer);
    return list;
  });

  readonly rows = computed<GridRow[]>(() =>
    this.filteredItems().map(c => ({
      legalCaseId:   c.legalCaseId,
      caseReference: c.caseReference,
      debtorName:    c.debtorName,
      phase:         this.phaseLabel(c.phase),
      status:        this.statusLabel(c.status),
      debtAmount:    c.debtAmount,
      legalFees:     c.legalFees ?? 0,
      lawyerName:    c.lawyerName ?? '—',
      courtName:     c.courtName  ?? '—',
      hearingDate:   c.hearingDate ? this.formatDate(c.hearingDate) : '—',
      _raw: c,
    }))
  );

  readonly columns: ColumnDef[] = [
    { key: 'caseReference', label: 'Réf. dossier',       sortable: true },
    { key: 'debtorName',    label: 'Client',              sortable: true },
    { key: 'debtAmount',    label: 'Montant dette',       sortable: true, align: 'right', isAmount: true },
    { key: 'legalFees',     label: 'Frais jur.',          sortable: true, align: 'right', isAmount: true },
    { key: 'phase',         label: 'Phase',               sortable: true },
    { key: 'status',        label: 'Statut juridique',    sortable: true },
    { key: 'lawyerName',    label: 'Avocat',              sortable: true },
    { key: 'courtName',     label: 'Tribunal',            sortable: true },
    { key: 'hearingDate',   label: 'Prochaine audience',  sortable: true },
  ];

  readonly statusOptions = [
    { value: 'IN_PROGRESS',      label: 'En cours'           },
    { value: 'PENDING_JUDGMENT', label: 'Jugement en attente' },
    { value: 'JUDGMENT_OBTAINED', label: 'Jugement obtenu'   },
    { value: 'CLOSED',           label: 'Clôturé'            },
  ];

  readonly phaseOptions = [
    { value: 'INJONCTION',  label: 'Injonction de payer' },
    { value: 'AUDIENCE',    label: 'Audience'            },
    { value: 'JUDGMENT',    label: 'Jugement'            },
    { value: 'EXECUTION',   label: 'Exécution'           },
  ];

  readonly lawyerOptions = computed(() => {
    const seen = new Map<string, string>();
    for (const c of this.items()) {
      if (c.lawyerId && c.lawyerName) seen.set(c.lawyerId, c.lawyerName);
    }
    return Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
  });

  ngOnInit(): void {
    if (!this.permSvc.hasRight('LEGAL_CASE_VIEW')) {
      this.viewState.set('forbidden');
      return;
    }
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.legalSvc.getLegalCases().subscribe({
      next: (page) => {
        this.items.set(page.items);
        this.dataDate.set(new Date().toISOString().slice(0, 10));
        this.viewState.set('success');
      },
      error: (err: any) => {
        if (err?.status === 403) { this.viewState.set('forbidden'); return; }
        this.viewState.set('error');
      },
    });
  }

  onRowClick(row: GridRow): void {
    this.selectedCase.set(row['_raw'] as LegalCaseDto);
  }

  closeDetail(): void {
    this.selectedCase.set(null);
  }

  navigateToDossier(caseId: string): void {
    this.router.navigate(['/dossiers', caseId]);
  }

  protected phaseLabel(p: string): string {
    const MAP: Record<string, string> = {
      INJONCTION: 'Injonction de payer',
      AUDIENCE:   'Audience',
      JUDGMENT:   'Jugement',
      EXECUTION:  'Exécution',
    };
    return MAP[p] ?? p;
  }

  protected statusLabel(s: string): string {
    const MAP: Record<string, string> = {
      IN_PROGRESS:       'En cours',
      PENDING_JUDGMENT:  'Jugement en attente',
      JUDGMENT_OBTAINED: 'Jugement obtenu',
      CLOSED:            'Clôturé',
    };
    return MAP[s] ?? s;
  }

  protected eventTypeIcon(t: string): string {
    const MAP: Record<string, string> = {
      FILING:            '📋',
      HEARING_SCHEDULED: '📅',
      HEARING:           '⚖️',
      JUDGMENT:          '🔨',
      SEIZURE_ORDER:     '🔒',
      SEIZURE_INITIATED: '📌',
    };
    return MAP[t] ?? '📄';
  }

  protected formatAmount(amount: number): string {
    return (
      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(amount) + ' MAD'
    );
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const d = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
