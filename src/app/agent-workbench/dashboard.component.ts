import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AgentWorkbenchDto, AgentWorkbenchService } from '../shared/data-access/agent-workbench.service';
import { CollectionCaseService } from '../shared/data-access/collection-case.service';
import { PermissionService } from '../shared/data-access/permission.service';
import { CollectionCaseDetailDto } from '../shared/data-access/models/collection-case.model';
import {
  ViewState, ModalUsage, ModalFormValue,
  CaseData, StatusValue,
  ActionModalType, ActionSubmitEvent, CaseContextDto,
  TimelineEvent,
} from '../shared/ui/ui.types';
import { ColumnDef, GroupDef, GridRow, SortState } from '../shared/ui/data-grid/data-grid.types';
import {
  KpiCardComponent,
  DataGridComponent,
  KanbanBoardComponent,
  SkeletonLoaderComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  StaleDataBannerComponent,
  SuccessToastComponent,
  ModalFormComponent,
  ActionModalComponent,
  TimelineComponent,
} from '../shared/ui';

type ActiveView = 'groupe' | 'liste' | 'kanban';

@Component({
  selector: 'mc-dashboard',
  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [
    KpiCardComponent,
    DataGridComponent,
    KanbanBoardComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
    StaleDataBannerComponent,
    SuccessToastComponent,
    ModalFormComponent,
    ActionModalComponent,
    TimelineComponent,
  ],
})
export class DashboardComponent implements OnInit {
  private readonly workbenchSvc = inject(AgentWorkbenchService);
  private readonly caseSvc      = inject(CollectionCaseService);
  private readonly permSvc      = inject(PermissionService);

  // ── ViewState ─────────────────────────────────────────────────────────────
  readonly viewState    = signal<ViewState>('loading');
  readonly errorMessage = signal('Une erreur est survenue.');
  readonly isStale      = signal(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  readonly showToast = signal(false);
  readonly toastMsg  = signal('');

  // ── Data ──────────────────────────────────────────────────────────────────
  readonly workbench       = signal<AgentWorkbenchDto | null>(null);
  readonly selectedCaseId  = signal<string | null>(null);
  readonly caseDetail      = signal<CollectionCaseDetailDto | null>(null);
  readonly caseDetailState = signal<ViewState>('loading');

  // ── UI ────────────────────────────────────────────────────────────────────
  readonly activeView = signal<ActiveView>('groupe');
  readonly drawerOpen = signal(false);

  // ── Simple modal (promesse / echeancier / escalade) ───────────────────────
  readonly modalOpen  = signal(false);
  readonly modalUsage = signal<ModalUsage>('promesse');

  // ── Action modal (nouvelles actions de recouvrement) ─────────────────────
  readonly actionModalOpen       = signal(false);
  readonly preselectedActionType = signal<ActionModalType | null>(null);
  readonly caseTimeline          = signal<TimelineEvent[]>([]);

  // ── Filters ───────────────────────────────────────────────────────────────
  readonly filterText     = signal('');
  readonly filterStatus   = signal('');
  readonly filterCategory = signal('');
  readonly filterDaysMin  = signal<number | null>(null);
  readonly sortState      = signal<SortState | null>(null);

  // ── Grid columns ──────────────────────────────────────────────────────────
  readonly gridColumns: ColumnDef[] = [
    { key: 'caseReference',     label: 'Référence',       sortable: true,  width: '130px' },
    { key: 'customerName',      label: 'Client',           sortable: true },
    { key: 'contractReference', label: 'Contrat',          sortable: false, width: '130px' },
    { key: 'overdueAmount',     label: 'Impayé (MAD)',     sortable: true,  isAmount: true, align: 'right', width: '130px' },
    { key: 'daysLate',          label: 'Retard (j)',       sortable: true,  align: 'right', width: '90px' },
    { key: 'categoryAgeDays',   label: 'Âge cat. (j)',     sortable: true,  align: 'right', width: '100px' },
    { key: 'status',            label: 'Statut',           sortable: false, width: '110px',
      cellFn: (row) => this.statusText(String(row['status'])) },
    { key: 'priority',          label: 'Priorité',         sortable: false, width: '100px',
      cellFn: (row) => this.priorityText(String(row['priority'])) },
    { key: 'lastActionLabel',   label: 'Dernière action',  sortable: false },
    { key: 'mainPhone',         label: 'Téléphone',        sortable: false, width: '130px',
      cellFn: (row) => this.permSvc.hasRight('CLIENT_CONTACT_VIEW')
        ? (String(row['mainPhone'] ?? '') || '—')
        : '•••' },
  ];

  // ── Computed ──────────────────────────────────────────────────────────────

  private readonly sortedCats = computed(() => {
    const data = this.workbench();
    if (!data) return [];
    return [...data.categories].sort((a, b) => b.oldestAgeDays - a.oldestAgeDays);
  });

  readonly header = computed(() => this.workbench()?.header ?? null);

  readonly gridGroupDefs = computed<GroupDef[]>(() =>
    this.sortedCats().map(c => ({ key: c.categoryCode, label: c.categoryLabel }))
  );

  readonly availableCategories = computed(() =>
    this.sortedCats().map(c => ({ code: c.categoryCode, label: c.categoryLabel }))
  );

  private readonly allRows = computed<GridRow[]>(() => {
    const rows: GridRow[] = [];
    for (const cat of this.sortedCats()) {
      for (const c of [...cat.cases].sort((a, b) => b.overdueAmount - a.overdueAmount)) {
        rows.push({
          id:                c.caseId,
          caseId:            c.caseId,
          caseReference:     c.caseReference,
          customerName:      c.customerName,
          contractReference: c.contractReference,
          overdueAmount:     c.overdueAmount,
          daysLate:          c.daysLate,
          categoryAgeDays:   c.categoryAgeDays,
          lastActionLabel:   c.lastActionLabel,
          mainPhone:         c.mainPhone,
          status:            c.status,
          priority:          c.priority,
          categoryCode:      cat.categoryCode,
          categoryLabel:     cat.categoryLabel,
        });
      }
    }
    return rows;
  });

  readonly filteredRows = computed<GridRow[]>(() => {
    let rows = this.allRows();
    const text    = this.filterText().toLowerCase().trim();
    const status  = this.filterStatus();
    const cat     = this.filterCategory();
    const daysMin = this.filterDaysMin();
    const sort    = this.sortState();

    if (text)   rows = rows.filter(r =>
      String(r['customerName']).toLowerCase().includes(text) ||
      String(r['caseReference']).toLowerCase().includes(text) ||
      String(r['contractReference']).toLowerCase().includes(text)
    );
    if (status) rows = rows.filter(r => r['status'] === status);
    if (cat)    rows = rows.filter(r => r['categoryCode'] === cat);
    if (daysMin !== null) rows = rows.filter(r => Number(r['daysLate']) >= daysMin);

    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = a[sort.column];
        const bv = b[sort.column];
        if (av === bv) return 0;
        const cmp = av! < bv! ? -1 : 1;
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  });

  readonly selectedRow = computed(() =>
    this.allRows().find(r => r['caseId'] === this.selectedCaseId()) ?? null
  );

  // Builds CaseContextDto for the action modal from available case data
  readonly actionCaseContext = computed<CaseContextDto | null>(() => {
    const detail = this.caseDetail();
    const row    = this.selectedRow();
    if (detail) {
      return {
        caseId:        detail.caseId,
        caseReference: detail.caseReference,
        debtorName:    detail.debtorName,
        overdueAmount: detail.overdueAmount,
        daysLate:      detail.daysLate,
        status:        detail.status,
      };
    }
    if (row) {
      return {
        caseId:        String(row['caseId']),
        caseReference: String(row['caseReference']),
        debtorName:    String(row['customerName']),
        overdueAmount: Number(row['overdueAmount']),
        daysLate:      Number(row['daysLate']),
        status:        String(row['status']),
      };
    }
    return null;
  });

  // CA-AGT-02: rowToCase callback for KanbanBoard
  readonly rowToCaseData = (row: GridRow): CaseData => ({
    id:          String(row['caseId']),
    debtorName:  String(row['customerName']),
    amount:      Number(row['overdueAmount']),
    daysOverdue: Number(row['daysLate']),
    status:      this.toStatusValue(String(row['status'])),
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.viewState.set('loading');
    this.isStale.set(false);
    this.workbenchSvc.getWorkbench().subscribe({
      next: (data) => {
        this.workbench.set(data);
        const total = data.categories.reduce((s, c) => s + c.caseCount, 0);
        this.viewState.set(total === 0 ? 'empty' : 'success');
      },
      error: (err) => {
        this.errorMessage.set(err?.message ?? 'Erreur lors du chargement des données.');
        this.viewState.set('error');
      },
    });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  onSortChange(s: SortState): void { this.sortState.set(s); }

  // CA-AGT-02: selecting a row opens the quick-action drawer
  onSelectionChange(rows: GridRow[]): void {
    if (rows.length > 0) {
      this.openDrawer(String(rows[rows.length - 1]['caseId']));
    } else {
      this.closeDrawer();
    }
  }

  // CA-AGT-02: kanban card click also opens the drawer
  onCardSelected(c: CaseData): void { this.openDrawer(c.id); }

  openDrawer(caseId: string): void {
    this.selectedCaseId.set(caseId);
    this.drawerOpen.set(true);
    this.caseDetail.set(null);
    this.caseDetailState.set('loading');
    this.caseTimeline.set([]); // reset session timeline on new case
    this.caseSvc.getCaseDetail(caseId).subscribe({
      next:  (d) => { this.caseDetail.set(d); this.caseDetailState.set('success'); },
      error: ()  => { this.caseDetailState.set('error'); },
    });
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selectedCaseId.set(null);
    this.caseDetail.set(null);
    this.caseTimeline.set([]);
  }

  // CA-AGT-03: simple modal for promesse / echeancier / escalade
  openModal(usage: ModalUsage): void {
    this.modalUsage.set(usage);
    this.modalOpen.set(true);
  }

  onModalSubmitted(_v: ModalFormValue): void {
    this.modalOpen.set(false);
    this.showSuccess('Enregistré avec succès.');
    this.isStale.set(true);
  }

  // CA-ACT-01 / CA-ACT-02: rich action modal
  openActionModal(type: ActionModalType): void {
    this.preselectedActionType.set(type);
    this.actionModalOpen.set(true);
  }

  onActionModalSubmitted(event: ActionSubmitEvent): void {
    this.actionModalOpen.set(false);

    // CA-ACT-02: add timeline entries (promise first if present, then action)
    const entries: TimelineEvent[] = [event.timelineEntry];
    if (event.promiseTimelineEntry) entries.unshift(event.promiseTimelineEntry);
    this.caseTimeline.update(current => [...entries, ...current]);

    const msg = event.createPromise
      ? `Action enregistrée + promesse de ${
          new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(event.promiseAmount ?? 0)
        } MAD créée.`
      : 'Action enregistrée avec succès.';
    this.showSuccess(msg);
    this.isStale.set(true);
  }

  // CA-AGT-05: refresh
  onRefresh(): void { this.loadData(); }

  onExport(): void { this.showSuccess('Export en cours de préparation…'); }

  // ── Template helpers ──────────────────────────────────────────────────────

  protected statusText(s: string): string {
    const MAP: Record<string, string> = {
      OPEN: 'Ouvert', PENDING: 'En attente', SUSPENDED: 'Suspendu', CLOSED: 'Clôturé',
    };
    return MAP[s] ?? s;
  }

  protected priorityText(p: string): string {
    const MAP: Record<string, string> = {
      CRITICAL: 'Critique', HIGH: 'Haute', NORMAL: 'Normal', LOW: 'Faible',
    };
    return MAP[p] ?? p;
  }

  protected priorityClass(p: string): string {
    return p.toLowerCase();
  }

  protected formatCurrency(n: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(n);
  }

  private toStatusValue(s: string): StatusValue {
    const MAP: Record<string, StatusValue> = {
      OPEN: 'en-cours', PENDING: 'promesse', SUSPENDED: 'cloture', CLOSED: 'cloture',
    };
    return MAP[s] ?? 'en-cours';
  }

  private showSuccess(msg: string): void {
    this.toastMsg.set(msg);
    this.showToast.set(true);
  }
}
