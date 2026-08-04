import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SettingsService } from '../../shared/data-access/settings.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { DmnPackageDto, DmnPackageStatus, DmnTestCaseDto } from '../../shared/data-access/models/settings.model';
import { ViewState } from '../../shared/ui/ui.types';
import { ColumnDef, GridRow } from '../../shared/ui/data-grid/data-grid.types';
import {
  DataGridComponent,
  SkeletonLoaderComponent,
  ErrorStateComponent,
  EmptyStateComponent,
  ForbiddenStateComponent,
} from '../../shared/ui';

// ── Nav + workflow types ──────────────────────────────────────────────────────

interface NavEntry { key: string; label: string; icon: string; }

interface WfStep { label: string; sublabel?: string; type: 'start' | 'process' | 'decision' | 'end'; }

interface WorkflowBranch { condition: string; steps: WfStep[]; }

interface WorkflowDef extends NavEntry {
  description: string;
  mainFlow: WfStep[];
  branches?: WorkflowBranch[];
}

const DECISION_TYPES: NavEntry[] = [
  { key: 'ALL',              label: 'Tous les packages',       icon: '📦' },
  { key: 'SEGMENTATION',     label: 'Segmentation & Scoring',  icon: '🎯' },
  { key: 'NEXT_BEST_ACTION', label: 'Prochaine action (NBA)',  icon: '⚡' },
  { key: 'ESCALATION',       label: "Règles d'escalade",       icon: '🔺' },
];

const WORKFLOW_DEFS: WorkflowDef[] = [
  {
    key: 'DOSSIER_LIFECYCLE',
    label: 'Cycle de vie dossier',
    icon: '🗂️',
    description: "Traitement complet d'un dossier de recouvrement, de la création à la clôture ou au transfert en contentieux.",
    mainFlow: [
      { label: 'Création dossier', type: 'start' },
      { label: 'Segmentation IA',  type: 'process', sublabel: 'SEGMENTATION' },
      { label: 'Calcul NBA',       type: 'process', sublabel: 'NEXT_BEST_ACTION' },
      { label: 'Phase amiable',    type: 'process' },
      { label: 'Résolu ?',         type: 'decision' },
    ],
    branches: [
      { condition: 'Oui',
        steps: [{ label: 'Dossier clôturé', type: 'end' }] },
      { condition: 'Non',
        steps: [
          { label: 'Escalade superviseur', type: 'process' },
          { label: 'Pré-contentieux',      type: 'end' },
        ] },
    ],
  },
  {
    key: 'ESCALATION_FLOW',
    label: "Flux d'escalade",
    icon: '🔺',
    description: 'Déclenchement et traitement des escalades vers le superviseur suite aux règles DMN.',
    mainFlow: [
      { label: 'Dossier à risque',        type: 'start' },
      { label: 'Règle escalade DMN',       type: 'process', sublabel: 'ESCALATION' },
      { label: 'Notification superviseur', type: 'process' },
      { label: 'Décision ?',              type: 'decision' },
    ],
    branches: [
      { condition: 'Approuvé',
        steps: [
          { label: 'Action superviseur', type: 'process' },
          { label: 'Résolu', type: 'end' },
        ] },
      { condition: 'Refusé',
        steps: [{ label: 'Retour agent', type: 'end' }] },
      { condition: 'Réaffecté',
        steps: [{ label: 'Nouveau responsable', type: 'end' }] },
    ],
  },
  {
    key: 'PAYMENT_VALIDATION',
    label: 'Validation échéancier',
    icon: '📅',
    description: 'Circuit de validation des plans de paiement selon les seuils définis dans les règles DMN.',
    mainFlow: [
      { label: 'Demande échéancier', type: 'start' },
      { label: 'Calcul seuils DMN', type: 'process' },
      { label: 'Montant / durée ?', type: 'decision' },
    ],
    branches: [
      { condition: 'Sous seuil',
        steps: [
          { label: 'Validation auto',   type: 'process' },
          { label: 'Échéancier actif',  type: 'end' },
        ] },
      { condition: 'Au-dessus seuil',
        steps: [
          { label: 'Validation superviseur', type: 'process' },
          { label: 'Approuvé / Refusé',      type: 'decision' },
        ] },
    ],
  },
  {
    key: 'LEGAL_PROCESS',
    label: 'Processus contentieux',
    icon: '⚖️',
    description: "Traitement des dossiers transférés en phase contentieuse jusqu'au jugement ou règlement.",
    mainFlow: [
      { label: 'Phase pré-légale', type: 'start' },
      { label: 'Mise en demeure',  type: 'process' },
      { label: 'Réponse client ?', type: 'decision' },
    ],
    branches: [
      { condition: 'Règlement',
        steps: [{ label: 'Dossier clôturé', type: 'end' }] },
      { condition: 'Sans réponse',
        steps: [
          { label: 'Saisie juridique', type: 'process' },
          { label: 'Jugement',         type: 'process' },
          { label: 'Exécution',        type: 'end' },
        ] },
    ],
  },
];

const WORKFLOW_KEYS = WORKFLOW_DEFS.map(w => w.key);

// ── DataGrid columns ──────────────────────────────────────────────────────────

const COLUMNS: ColumnDef[] = [
  { key: 'packageCode',  label: 'Code package',  sortable: true, width: '180px' },
  { key: 'version',      label: 'Version',       align: 'center', width: '90px' },
  { key: 'decisionType', label: 'Type décision', width: '190px' },
  { key: 'statusLabel',  label: 'Statut',        align: 'center', width: '120px' },
  { key: 'testsLabel',   label: 'Tests',         align: 'center', width: '80px' },
  { key: 'publishedAt',  label: 'Activé le',     width: '120px' },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT:    '◌ Brouillon',
  ACTIVE:   '● Actif',
  ARCHIVED: '○ Archivé',
};

const DECISION_LABELS: Record<string, string> = {
  SEGMENTATION:     'Segmentation',
  NEXT_BEST_ACTION: 'Prochaine action',
  ESCALATION:       'Escalade',
};

function sortByVersionDesc(a: DmnPackageDto, b: DmnPackageDto): number {
  return b.version.localeCompare(a.version, undefined, { numeric: true });
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'mc-settings-regles-workflows',
  standalone: true,
  imports: [DataGridComponent, SkeletonLoaderComponent, ErrorStateComponent, EmptyStateComponent, ForbiddenStateComponent],
  templateUrl: './regles-workflows.component.html',
  styleUrl:    './regles-workflows.component.scss',
})
export class ParametragesReglesWorkflowsComponent implements OnInit {
  private readonly settingsSvc = inject(SettingsService);
  private readonly permSvc     = inject(PermissionService);

  readonly DECISION_TYPES = DECISION_TYPES;
  readonly WORKFLOW_DEFS  = WORKFLOW_DEFS;
  readonly COLUMNS        = COLUMNS;

  // ── State ───────────────────────────────────────────────────────────────────
  readonly activeTab   = signal('ALL');
  readonly allPackages = signal<DmnPackageDto[]>([]);
  readonly viewState   = signal<ViewState>('loading');

  // ── Detail panel ────────────────────────────────────────────────────────────
  readonly panelOpen      = signal(false);
  readonly selectedPkg    = signal<DmnPackageDto | null>(null);
  readonly testCases      = signal<DmnTestCaseDto[]>([]);
  readonly testViewState  = signal<ViewState>('loading');
  readonly runningTests   = signal(false);
  readonly expandedTestId = signal<string | null>(null);

  // ── Toast ────────────────────────────────────────────────────────────────────
  readonly toastMsg     = signal('');
  readonly toastVisible = signal(false);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Computed ────────────────────────────────────────────────────────────────
  readonly isWorkflowTab = computed(() => WORKFLOW_KEYS.includes(this.activeTab()));

  readonly activeWorkflow = computed(
    () => WORKFLOW_DEFS.find(w => w.key === this.activeTab()) ?? null
  );

  readonly activeTabLabel = computed(
    () =>
      [...DECISION_TYPES, ...WORKFLOW_DEFS].find(e => e.key === this.activeTab())?.label ??
      this.activeTab()
  );

  readonly filtered = computed<DmnPackageDto[]>(() => {
    const t = this.activeTab();
    const all = this.allPackages();
    return (t === 'ALL' ? all : all.filter(p => p.decisionType === t))
      .slice()
      .sort(sortByVersionDesc);
  });

  readonly rows = computed<GridRow[]>(() =>
    this.filtered().map(p => ({
      id:           p.packageId,
      packageCode:  p.packageCode,
      version:      `v${p.version}`,
      decisionType: DECISION_LABELS[p.decisionType] ?? p.decisionType,
      statusLabel:  STATUS_LABELS[p.status] ?? p.status,
      testsLabel:   p.testsTotal != null ? `${p.testsPassed ?? 0}/${p.testsTotal}` : '—',
      publishedAt:  p.publishedAt
        ? new Date(p.publishedAt).toLocaleDateString('fr-FR')
        : '—',
    }))
  );

  readonly canActivate = computed(() => {
    const pkg = this.selectedPkg();
    const tcs = this.testCases();
    if (!pkg || pkg.status !== 'DRAFT') return false;
    if (!pkg.testsTotal || pkg.testsTotal === 0) return false;
    return tcs.length > 0 && tcs.every(tc => tc.lastRunResult === 'PASS');
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!this.permSvc.hasRight('SETTINGS_MANAGE')) {
      this.viewState.set('forbidden');
      return;
    }
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.settingsSvc.getDmnPackages().subscribe({
      next: data => {
        this.allPackages.set(data.items);
        this.viewState.set('success');
      },
      error: () => this.viewState.set('error'),
    });
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  setActiveTab(key: string): void {
    this.activeTab.set(key);
    this.panelOpen.set(false);
    this.selectedPkg.set(null);
  }

  countByType(key: string): number {
    if (key === 'ALL') return this.allPackages().length;
    return this.allPackages().filter(p => p.decisionType === key).length;
  }

  // ── Detail panel ─────────────────────────────────────────────────────────────
  openDetail(row: GridRow): void {
    const pkg = this.allPackages().find(p => p.packageId === row['id']);
    if (!pkg) return;
    this.selectedPkg.set(pkg);
    this.panelOpen.set(true);
    this.expandedTestId.set(null);
    this.testViewState.set('loading');
    this.testCases.set([]);
    this.settingsSvc.getDmnTestCases(pkg.packageId).subscribe({
      next: tcs => {
        this.testCases.set(tcs);
        this.testViewState.set('success');
      },
      error: () => this.testViewState.set('error'),
    });
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.selectedPkg.set(null);
  }

  toggleTest(testId: string): void {
    this.expandedTestId.update(id => id === testId ? null : testId);
  }

  // ── Test run (mock) ──────────────────────────────────────────────────────────
  runTests(): void {
    if (this.runningTests()) return;
    this.runningTests.set(true);
    setTimeout(() => {
      const total = this.testCases().length;
      this.testCases.update(tcs =>
        tcs.map(tc => ({
          ...tc,
          lastRunResult: 'PASS' as const,
          lastRunAt:     new Date().toISOString(),
          lastRunDiff:   {},
        }))
      );
      const pkg = this.selectedPkg();
      if (pkg) {
        const updated: DmnPackageDto = { ...pkg, testsPassed: total, testsTotal: total };
        this.allPackages.update(pkgs =>
          pkgs.map(p => p.packageId === pkg.packageId ? updated : p)
        );
        this.selectedPkg.set(updated);
      }
      this.runningTests.set(false);
      this.showToast(`${total} test(s) exécuté(s) — tous passent.`);
    }, 1800);
  }

  // ── Activation ───────────────────────────────────────────────────────────────
  activatePackage(): void {
    const pkg = this.selectedPkg();
    if (!pkg) return;
    const now = new Date().toISOString();
    this.allPackages.update(pkgs =>
      pkgs.map(p => {
        if (p.packageId === pkg.packageId) {
          return { ...p, status: 'ACTIVE' as DmnPackageStatus, publishedAt: now, publishedBy: 'Admin Système' };
        }
        if (p.decisionType === pkg.decisionType && p.status === 'ACTIVE') {
          return { ...p, status: 'ARCHIVED' as DmnPackageStatus };
        }
        return p;
      })
    );
    this.selectedPkg.update(p =>
      p ? { ...p, status: 'ACTIVE' as DmnPackageStatus, publishedAt: now } : p
    );
    this.showToast(`"${pkg.packageLabel}" v${pkg.version} activé. Version précédente archivée.`);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  private showToast(msg: string): void {
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastVisible.set(false), 4000);
  }

  nodeClass(type: string): string {
    return `rw__node rw__node--${type}`;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT:    'rw__status--draft',
      ACTIVE:   'rw__status--active',
      ARCHIVED: 'rw__status--archived',
    };
    return `rw__status ${map[status] ?? ''}`;
  }

  testBadgeClass(result?: string): string {
    if (result === 'PASS') return 'rw__test-badge rw__test-badge--pass';
    if (result === 'FAIL') return 'rw__test-badge rw__test-badge--fail';
    return 'rw__test-badge rw__test-badge--unknown';
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDateTime(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }

  jsonStr(obj: unknown): string {
    return JSON.stringify(obj, null, 2);
  }
}
