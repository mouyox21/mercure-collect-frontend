import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ImportService } from '../../shared/data-access/import.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { ImportBatchDto, ImportBatchStatus, ImportType } from '../../shared/data-access/models/import.model';
import { ViewState } from '../../shared/ui/ui.types';
import { ColumnDef, GridRow } from '../../shared/ui/data-grid/data-grid.types';
import {
  DataGridComponent,
  SkeletonLoaderComponent,
  ErrorStateComponent,
  EmptyStateComponent,
  ForbiddenStateComponent,
} from '../../shared/ui';

// ── Filter types ──────────────────────────────────────────────────────────────

type StatusFilter = ImportBatchStatus | 'ALL';
type TypeFilter   = ImportType | 'ALL';

const STATUS_OPTIONS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'ALL',        label: 'Tous' },
  { key: 'COMPLETED',  label: 'Terminés' },
  { key: 'FAILED',     label: 'Échec' },
  { key: 'PROCESSING', label: 'En cours' },
  { key: 'PENDING',    label: 'En attente' },
];

const TYPE_OPTIONS: Array<{ key: TypeFilter; label: string }> = [
  { key: 'ALL', label: 'Tous types' },
  { key: 'ERP', label: 'ERP' },
  { key: 'CSV', label: 'CSV' },
  { key: 'CLS', label: 'CLS' },
];

// ── Display maps ──────────────────────────────────────────────────────────────

const STATUS_GRID_LABELS: Record<ImportBatchStatus, string> = {
  PENDING:    '⏸ En attente',
  PROCESSING: '⟳ En cours',
  COMPLETED:  '✓ Terminé',
  FAILED:     '✕ Échec',
};

const STATUS_BADGE_LABELS: Record<ImportBatchStatus, string> = {
  PENDING:    'En attente',
  PROCESSING: 'En cours',
  COMPLETED:  'Terminé',
  FAILED:     'Échec',
};

// ── Static drawer data (per importType) ───────────────────────────────────────

interface QualityControl { label: string; }
interface FieldMapping   { source: string; target: string; }

const QUALITY_CONTROLS: Record<ImportType, QualityControl[]> = {
  ERP: [
    { label: 'Format XML validé (XSD v2.3)' },
    { label: 'Référence contrat ERP obligatoire' },
    { label: 'ICE débiteur — 15 chiffres exacts' },
    { label: 'Montant impayé strictement positif' },
  ],
  CSV: [
    { label: 'En-tête standard (7 colonnes attendues)' },
    { label: 'Encodage UTF-8 sans BOM' },
    { label: 'Séparateur point-virgule (;)' },
    { label: 'Format date jj/mm/aaaa' },
  ],
  CLS: [
    { label: 'Format DAT propriétaire CLS v4' },
    { label: 'Référence dossier unique obligatoire' },
    { label: 'Contrôle anti-doublon actif' },
    { label: 'Cohérence des balances comptables' },
  ],
};

const FIELD_MAPPINGS: Record<ImportType, FieldMapping[]> = {
  ERP: [
    { source: 'contractRef',   target: 'Référence contrat' },
    { source: 'debtorName',    target: 'Nom débiteur' },
    { source: 'ice',           target: 'ICE (15 chiffres)' },
    { source: 'overdueAmount', target: 'Montant impayé (MAD)' },
    { source: 'dueDate',       target: "Date d'échéance" },
    { source: 'productType',   target: 'Type produit' },
  ],
  CSV: [
    { source: 'debtorName',        target: 'Nom débiteur' },
    { source: 'ice',               target: 'ICE' },
    { source: 'contractReference', target: 'Référence contrat' },
    { source: 'overdueAmount',     target: 'Montant impayé' },
    { source: 'dueDate',           target: 'Date limite' },
  ],
  CLS: [
    { source: 'DOSSIER_ID',  target: 'Référence dossier' },
    { source: 'DEBITEUR',    target: 'Nom débiteur' },
    { source: 'MONTANT_TTC', target: 'Montant TTC (MAD)' },
    { source: 'DATE_ECH',    target: "Date d'échéance" },
    { source: 'STATUT',      target: 'Statut initial' },
  ],
};

// ── DataGrid columns ──────────────────────────────────────────────────────────

const COLUMNS: ColumnDef[] = [
  { key: 'importType',    label: 'Type',          align: 'center', width: '80px' },
  { key: 'fileName',      label: 'Fichier',        width: '240px' },
  { key: 'importedAt',    label: 'Date import',   sortable: true,  width: '140px' },
  { key: 'statusLabel',   label: 'Statut',         align: 'center', width: '130px' },
  { key: 'successRows',   label: 'Acceptées',      align: 'center', width: '100px' },
  { key: 'errorRows',     label: 'Rejetées',       align: 'center', width: '100px' },
  { key: 'creditorLabel', label: 'Créancier',      width: '160px' },
  { key: 'importedBy',    label: 'Déclenché par',  width: '190px' },
];

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'mc-settings-imports',
  standalone: true,
  imports: [DataGridComponent, SkeletonLoaderComponent, ErrorStateComponent, EmptyStateComponent, ForbiddenStateComponent],
  templateUrl: './imports.component.html',
  styleUrl:    './imports.component.scss',
})
export class ParametragesImportsComponent implements OnInit {
  private readonly importSvc = inject(ImportService);
  private readonly permSvc   = inject(PermissionService);

  readonly STATUS_OPTIONS = STATUS_OPTIONS;
  readonly TYPE_OPTIONS   = TYPE_OPTIONS;
  readonly COLUMNS        = COLUMNS;

  // ── State ────────────────────────────────────────────────────────────────────
  readonly allBatches    = signal<ImportBatchDto[]>([]);
  readonly viewState     = signal<ViewState>('loading');
  readonly filterStatus  = signal<StatusFilter>('ALL');
  readonly filterType    = signal<TypeFilter>('ALL');
  readonly cancelConfirm = signal(false);

  // ── Panel ─────────────────────────────────────────────────────────────────────
  readonly panelOpen     = signal(false);
  readonly selectedBatch = signal<ImportBatchDto | null>(null);

  // ── Toast ────────────────────────────────────────────────────────────────────
  readonly toastMsg     = signal('');
  readonly toastVisible = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly filtered = computed<ImportBatchDto[]>(() => {
    const st = this.filterStatus();
    const tp = this.filterType();
    return this.allBatches()
      .filter(b => st === 'ALL' || b.status === st)
      .filter(b => tp === 'ALL' || b.importType === tp)
      .slice()
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  });

  readonly rows = computed<GridRow[]>(() =>
    this.filtered().map(b => ({
      id:            b.batchId,
      importType:    b.importType,
      fileName:      b.fileName,
      importedAt:    this.formatDateTime(b.importedAt),
      statusLabel:   STATUS_GRID_LABELS[b.status] ?? b.status,
      successRows:   b.successRows,
      errorRows:     b.errorRows > 0 ? `⚠ ${b.errorRows}` : '—',
      creditorLabel: b.creditorLabel ?? '—',
      importedBy:    b.importedBy,
    }))
  );

  readonly qualityControls = computed<QualityControl[]>(() =>
    QUALITY_CONTROLS[this.selectedBatch()?.importType ?? 'ERP'] ?? []
  );

  readonly fieldMappings = computed<FieldMapping[]>(() =>
    FIELD_MAPPINGS[this.selectedBatch()?.importType ?? 'ERP'] ?? []
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!this.permSvc.hasRight('SETTINGS_MANAGE')) {
      this.viewState.set('forbidden');
      return;
    }
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.importSvc.getBatches().subscribe({
      next:  data => { this.allBatches.set(data.items); this.viewState.set('success'); },
      error: ()   => this.viewState.set('error'),
    });
  }

  // ── Filters ───────────────────────────────────────────────────────────────────
  setFilterStatus(key: StatusFilter): void { this.filterStatus.set(key); }
  setFilterType(key: TypeFilter): void     { this.filterType.set(key); }

  // ── Panel ─────────────────────────────────────────────────────────────────────
  openDetail(row: GridRow): void {
    const batch = this.allBatches().find(b => b.batchId === row['id']);
    if (!batch) return;
    this.selectedBatch.set(batch);
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.selectedBatch.set(null);
    this.cancelConfirm.set(false);
  }

  // ── Actions (mock) ────────────────────────────────────────────────────────────
  retryBatch(): void {
    const batch = this.selectedBatch();
    if (!batch) return;
    const updated: ImportBatchDto = { ...batch, status: 'PROCESSING' };
    this.allBatches.update(bs => bs.map(b => b.batchId === batch.batchId ? updated : b));
    this.selectedBatch.set(updated);
    this.showToast(`Import « ${batch.fileName} » relancé.`);
  }

  requestCancelBatch(): void { this.cancelConfirm.set(true); }

  cancelBatch(): void {
    const batch = this.selectedBatch();
    if (!batch) return;
    this.cancelConfirm.set(false);
    const updated: ImportBatchDto = { ...batch, status: 'FAILED' };
    this.allBatches.update(bs => bs.map(b => b.batchId === batch.batchId ? updated : b));
    this.selectedBatch.set(updated);
    this.showToast(`Import « ${batch.fileName} » annulé.`);
  }

  downloadReport(): void {
    const batch = this.selectedBatch();
    if (!batch) return;
    this.showToast(`Téléchargement du rapport pour « ${batch.fileName} » (simulation).`);
  }

  exportRejections(): void {
    const batch = this.selectedBatch();
    if (!batch) return;
    this.showToast(`Export de ${batch.errorRows} rejet(s) au format CSV (simulation).`);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  private showToast(msg: string): void {
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 4000);
  }

  statusClass(status: ImportBatchStatus): string {
    const map: Record<ImportBatchStatus, string> = {
      PENDING:    'im__status--pending',
      PROCESSING: 'im__status--processing',
      COMPLETED:  'im__status--completed',
      FAILED:     'im__status--failed',
    };
    return `im__status ${map[status] ?? ''}`;
  }

  statusDisplay(status: ImportBatchStatus): string {
    return STATUS_BADGE_LABELS[status] ?? status;
  }

  typeClass(importType: ImportType): string {
    return `im__type-badge im__type-badge--${importType.toLowerCase()}`;
  }

  successRate(batch: ImportBatchDto): string {
    if (!batch.totalRows) return '—';
    return `${Math.round((batch.successRows / batch.totalRows) * 100)} %`;
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDateTime(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }
}
