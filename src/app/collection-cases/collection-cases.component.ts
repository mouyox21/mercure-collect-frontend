import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CollectionCaseService } from '../shared/data-access/collection-case.service';
import { CollectionCaseSearchCriteria } from '../shared/data-access/models/collection-case.model';
import { PermissionService } from '../shared/data-access/permission.service';
import { ViewState, ModalUsage, ModalFormValue } from '../shared/ui/ui.types';
import { ColumnDef, GridRow, SortState, PageEvent } from '../shared/ui/data-grid/data-grid.types';
import {
  DataGridComponent,
  SkeletonLoaderComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  SuccessToastComponent,
  ModalFormComponent,
} from '../shared/ui';

const LS_VIEWS_KEY = 'mc_dossiers_views_v1';

interface FilterCriteria {
  debtorName: string;
  caseReference: string;
  status: string;
  priority: string;
  phase: string;
  categoryCode: string;
  amountMin: number | null;
  amountMax: number | null;
  daysLateMin: number | null;
  daysLateMax: number | null;
  agentId: string;
}

interface SavedView {
  id: string;
  label: string;
  isBuiltin: boolean;
  filters: FilterCriteria;
}

const EMPTY_FILTERS: FilterCriteria = {
  debtorName: '', caseReference: '', status: '', priority: '',
  phase: '', categoryCode: '', amountMin: null, amountMax: null,
  daysLateMin: null, daysLateMax: null, agentId: '',
};

const BUILTIN_VIEWS: SavedView[] = [
  { id: 'critiques',            label: 'Mes critiques',        isBuiltin: true, filters: { ...EMPTY_FILTERS, priority: 'CRITICAL' } },
  { id: 'promesses-non-tenues', label: 'Promesses non tenues', isBuiltin: true, filters: { ...EMPTY_FILTERS, categoryCode: 'PROMISE_BROKEN' } },
  { id: '90-jours',             label: '90+ jours',            isBuiltin: true, filters: { ...EMPTY_FILTERS, daysLateMin: 90 } },
];

@Component({
  selector: 'mc-collection-cases',
  standalone: true,
  templateUrl: './collection-cases.component.html',
  styleUrl: './collection-cases.component.scss',
  imports: [
    DataGridComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
    SuccessToastComponent,
    ModalFormComponent,
  ],
})
export class CollectionCasesComponent implements OnInit {
  private readonly caseSvc = inject(CollectionCaseService);
  private readonly permSvc = inject(PermissionService);
  private readonly router  = inject(Router);

  // ── ViewState ─────────────────────────────────────────────────────────────
  readonly viewState    = signal<ViewState>('loading');
  readonly errorMessage = signal('Une erreur est survenue.');

  // ── Toast ─────────────────────────────────────────────────────────────────
  readonly showToast = signal(false);
  readonly toastMsg  = signal('');

  // ── Grid data ─────────────────────────────────────────────────────────────
  readonly rows       = signal<GridRow[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex  = signal(0);
  readonly pageSize   = signal(25);
  readonly sortState  = signal<SortState | null>(null);

  // ── Selection ─────────────────────────────────────────────────────────────
  readonly selectedRows = signal<GridRow[]>([]);

  // ── Filters ───────────────────────────────────────────────────────────────
  readonly filtersOpen = signal(true);
  readonly filters     = signal<FilterCriteria>({ ...EMPTY_FILTERS });

  // ── Saved views ───────────────────────────────────────────────────────────
  readonly savedViews   = signal<SavedView[]>([]);
  readonly activeViewId = signal<string | null>(null);
  readonly saveViewOpen = signal(false);
  readonly newViewName  = signal('');

  // ── Modal ─────────────────────────────────────────────────────────────────
  readonly modalOpen  = signal(false);
  readonly modalUsage = signal<ModalUsage>('action');

  // ── Permissions ───────────────────────────────────────────────────────────
  readonly canExport = computed(() => this.permSvc.hasRight('REPORT_EXPORT'));
  readonly canAssign = computed(() => this.permSvc.hasRight('CASE_ASSIGN'));
  readonly canAction = computed(() => this.permSvc.hasRight('ACTION_CREATE'));

  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.debtorName || f.caseReference || f.status || f.priority ||
              f.phase || f.categoryCode || f.amountMin != null || f.amountMax != null ||
              f.daysLateMin != null || f.daysLateMax != null || f.agentId);
  });

  // ── Grid columns ──────────────────────────────────────────────────────────
  readonly gridColumns: ColumnDef[] = [
    { key: 'caseReference',     label: 'Référence',         sortable: true,  width: '130px' },
    { key: 'debtorName',        label: 'Client',             sortable: true },
    { key: 'contractReference', label: 'Contrat',            sortable: false, width: '130px' },
    { key: 'overdueAmount',     label: 'Impayé (MAD)',       sortable: true,  isAmount: true, align: 'right', width: '140px' },
    { key: 'daysLate',          label: 'Retard (j)',         sortable: true,  align: 'right', width: '90px' },
    { key: 'categoryLabel',     label: 'Catégorie',          sortable: true,  width: '170px' },
    { key: 'status',            label: 'Statut',             sortable: false, width: '110px',
      cellFn: (row) => this.statusText(String(row['status'])) },
    { key: 'priority',          label: 'Priorité',           sortable: false, width: '100px',
      cellFn: (row) => this.priorityText(String(row['priority'])) },
    { key: 'nextActionLabel',   label: 'Prochaine action',   sortable: false, width: '210px' },
    { key: 'agentName',         label: 'Agent affecté',      sortable: true,  width: '140px' },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadSavedViews();
    this.loadData();
  }

  private loadSavedViews(): void {
    let userViews: SavedView[] = [];
    try {
      const raw = localStorage.getItem(LS_VIEWS_KEY);
      if (raw) userViews = JSON.parse(raw) as SavedView[];
    } catch { /* ignore corrupt storage */ }
    this.savedViews.set([...BUILTIN_VIEWS, ...userViews]);
  }

  private persistUserViews(): void {
    const userViews = this.savedViews().filter(v => !v.isBuiltin);
    localStorage.setItem(LS_VIEWS_KEY, JSON.stringify(userViews));
  }

  loadData(): void {
    this.viewState.set('loading');
    this.selectedRows.set([]);
    const f = this.filters();
    const s = this.sortState();
    const criteria: CollectionCaseSearchCriteria = {
      page:          this.pageIndex(),
      size:          this.pageSize(),
      sort:          s ? `${s.column},${s.dir}` : undefined,
      debtorName:    f.debtorName    || undefined,
      caseReference: f.caseReference || undefined,
      status:        f.status        || undefined,
      priority:      f.priority      || undefined,
      phase:         f.phase         || undefined,
      categoryCode:  f.categoryCode  || undefined,
      amountMin:     f.amountMin     ?? undefined,
      amountMax:     f.amountMax     ?? undefined,
      daysLateMin:   f.daysLateMin   ?? undefined,
      daysLateMax:   f.daysLateMax   ?? undefined,
      agentId:       f.agentId       || undefined,
    };
    this.caseSvc.getCases(criteria).subscribe({
      next: (page) => {
        this.rows.set(page.items.map(item => ({ id: item.caseId, ...item } as GridRow)));
        this.totalItems.set(page.total);
        this.viewState.set(page.total === 0 ? 'empty' : 'success');
      },
      error: (err: any) => {
        if (err?.status === 403) { this.viewState.set('forbidden'); return; }
        this.errorMessage.set(err?.message ?? 'Erreur lors du chargement des dossiers.');
        this.viewState.set('error');
      },
    });
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  onSearch(): void { this.pageIndex.set(0); this.activeViewId.set(null); this.loadData(); }

  onReset(): void {
    this.filters.set({ ...EMPTY_FILTERS });
    this.sortState.set(null);
    this.pageIndex.set(0);
    this.activeViewId.set(null);
    this.loadData();
  }

  updateFilter<K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  updateFilterNum(key: 'amountMin' | 'amountMax' | 'daysLateMin' | 'daysLateMax', raw: string): void {
    this.filters.update(f => ({ ...f, [key]: raw ? +raw : null }));
  }

  // ── Grid handlers ─────────────────────────────────────────────────────────

  onPageChange(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.loadData();
  }

  onSortChange(s: SortState): void {
    this.sortState.set(s);
    this.pageIndex.set(0);
    this.loadData();
  }

  onSelectionChange(rows: GridRow[]): void { this.selectedRows.set(rows); }

  clearSelection(): void { this.selectedRows.set([]); }

  // ── Saved views ───────────────────────────────────────────────────────────

  applyView(view: SavedView): void {
    this.filters.set({ ...EMPTY_FILTERS, ...view.filters });
    this.sortState.set(null);
    this.pageIndex.set(0);
    this.activeViewId.set(view.id);
    this.loadData();
  }

  openSaveView(): void   { this.newViewName.set(''); this.saveViewOpen.set(true); }
  cancelSaveView(): void { this.saveViewOpen.set(false); }

  confirmSaveView(): void {
    const label = this.newViewName().trim();
    if (!label) return;
    const view: SavedView = {
      id:        `custom-${Date.now()}`,
      label,
      isBuiltin: false,
      filters:   { ...this.filters() },
    };
    this.savedViews.update(v => [...v, view]);
    this.persistUserViews();
    this.saveViewOpen.set(false);
    this.activeViewId.set(view.id);
    this.showSuccess(`Vue "${label}" sauvegardée.`);
  }

  deleteView(id: string, event: Event): void {
    event.stopPropagation();
    this.savedViews.update(v => v.filter(x => x.id !== id));
    this.persistUserViews();
    if (this.activeViewId() === id) this.activeViewId.set(null);
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────

  onExport(): void {
    this.showSuccess(`Export de ${this.selectedRows().length} dossier(s) en cours…`);
  }

  onReassign(): void {
    this.modalUsage.set('escalade');
    this.modalOpen.set(true);
  }

  onSchedule(): void {
    this.modalUsage.set('action');
    this.modalOpen.set(true);
  }

  onSmsCampaign(): void {
    this.showSuccess(`Campagne SMS planifiée pour ${this.selectedRows().length} dossier(s).`);
  }

  onActionSubmitted(_v: ModalFormValue): void {
    this.modalOpen.set(false);
    this.clearSelection();
    this.showSuccess('Action enregistrée avec succès.');
  }

  onRowClick(row: GridRow): void {
    this.router.navigate(['/dossiers', String(row['caseId'])]);
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  protected statusText(s: string): string {
    const MAP: Record<string, string> = { OPEN: 'Ouvert', PENDING: 'En attente', SUSPENDED: 'Suspendu', CLOSED: 'Clôturé' };
    return MAP[s] ?? s;
  }

  protected priorityText(p: string): string {
    const MAP: Record<string, string> = { CRITICAL: 'Critique', HIGH: 'Haute', NORMAL: 'Normal', LOW: 'Faible' };
    return MAP[p] ?? p;
  }

  private showSuccess(msg: string): void {
    this.toastMsg.set(msg);
    this.showToast.set(true);
  }
}
