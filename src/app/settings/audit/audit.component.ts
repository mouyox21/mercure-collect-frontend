import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuditService } from '../../shared/data-access/audit.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { AuditEventDto } from '../../shared/data-access/models/audit.model';
import { ViewState } from '../../shared/ui/ui.types';
import { ColumnDef, GridRow } from '../../shared/ui/data-grid/data-grid.types';
import {
  DataGridComponent,
  SkeletonLoaderComponent,
  ErrorStateComponent,
  EmptyStateComponent,
  ForbiddenStateComponent,
} from '../../shared/ui';

// ── Display maps ──────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  CASE_CREATED:              'Dossier créé',
  CASE_ASSIGNED:             'Réassignation',
  ACTION_PERFORMED:          'Action effectuée',
  PROMISE_CREATED:           'Promesse créée',
  PROMISE_BROKEN:            'Promesse rompue',
  ESCALATION_CREATED:        'Escalade créée',
  ESCALATION_RESOLVED:       'Escalade résolue',
  DMN_DECISION_COMPUTED:     'Décision DMN',
  STATUS_CHANGED:            'Statut modifié',
  IMPORT_COMPLETED:          'Import terminé',
  IMPORT_FAILED:             'Import échoué',
  REFERENCE_VALUE_UPDATED:   'Référentiel modifié',
  DMN_PACKAGE_PUBLISHED:     'Package DMN publié',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  COLLECTION_CASE:  'Dossier',
  PAYMENT_PROMISE:  'Promesse',
  ESCALATION:       'Escalade',
  IMPORT_BATCH:     'Import',
  REFERENCE_VALUE:  'Référentiel',
  DMN_PACKAGE:      'Package DMN',
};

const CREDITOR_LABELS: Record<string, string> = {
  'CRED-001': 'Banque Atlas',
  'CRED-002': 'Crédit Maghrébin',
};

// ── Filter options ────────────────────────────────────────────────────────────

interface SelectOption { key: string; label: string; }

const ENTITY_TYPE_OPTIONS: SelectOption[] = [
  { key: '',                label: 'Toutes entités'   },
  { key: 'COLLECTION_CASE', label: 'Dossier'           },
  { key: 'PAYMENT_PROMISE', label: 'Promesse'          },
  { key: 'ESCALATION',      label: 'Escalade'          },
  { key: 'IMPORT_BATCH',    label: 'Import'            },
  { key: 'REFERENCE_VALUE', label: 'Référentiel'       },
  { key: 'DMN_PACKAGE',     label: 'Package DMN'       },
];

const CREDITOR_OPTIONS: SelectOption[] = [
  { key: '',        label: 'Tous créanciers'   },
  { key: 'CRED-001', label: 'Banque Atlas'     },
  { key: 'CRED-002', label: 'Crédit Maghrébin' },
];

// ── DataGrid columns ──────────────────────────────────────────────────────────

const COLUMNS: ColumnDef[] = [
  { key: 'eventDate',       label: 'Date / Heure',  sortable: true, width: '150px' },
  { key: 'userName',        label: 'Utilisateur',   width: '170px' },
  { key: 'eventTypeLabel',  label: 'Action',        width: '190px' },
  { key: 'entityTypeLabel', label: 'Entité',        width: '130px' },
  { key: 'entityId',        label: 'Identifiant',   width: '120px' },
  { key: 'ipAddress',       label: 'Adresse IP',    width: '130px' },
];

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'mc-settings-audit',
  standalone: true,
  imports: [DataGridComponent, SkeletonLoaderComponent, ErrorStateComponent, EmptyStateComponent, ForbiddenStateComponent],
  templateUrl: './audit.component.html',
  styleUrl:    './audit.component.scss',
})
export class ParametragesAuditComponent implements OnInit {
  private readonly auditSvc  = inject(AuditService);
  private readonly permSvc   = inject(PermissionService);

  readonly ENTITY_TYPE_OPTIONS = ENTITY_TYPE_OPTIONS;
  readonly CREDITOR_OPTIONS    = CREDITOR_OPTIONS;
  readonly COLUMNS             = COLUMNS;

  // ── State ─────────────────────────────────────────────────────────────────
  readonly allEvents  = signal<AuditEventDto[]>([]);
  readonly viewState  = signal<ViewState>('loading');

  // ── Filters ───────────────────────────────────────────────────────────────
  readonly filterDateFrom   = signal('');
  readonly filterDateTo     = signal('');
  readonly filterUserName   = signal('');
  readonly filterEntityType = signal('');
  readonly filterEventType  = signal('');
  readonly filterIp         = signal('');
  readonly filterCreditor   = signal('');

  // ── Panel ─────────────────────────────────────────────────────────────────
  readonly panelOpen     = signal(false);
  readonly selectedEvent = signal<AuditEventDto | null>(null);

  // ── Permission ────────────────────────────────────────────────────────────
  readonly hasFullView = computed(() => this.permSvc.hasRight('AUDIT_VIEW'));

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly filtered = computed<AuditEventDto[]>(() => {
    const df = this.filterDateFrom();
    const dt = this.filterDateTo();
    const un = this.filterUserName().toLowerCase().trim();
    const et = this.filterEntityType();
    const ev = this.filterEventType().toLowerCase().trim();
    const ip = this.filterIp().trim();
    const cr = this.filterCreditor();

    return this.allEvents()
      .filter(e => !df || e.eventDate >= df)
      .filter(e => !dt || e.eventDate.slice(0, 10) <= dt)
      .filter(e => !un || e.userName.toLowerCase().includes(un))
      .filter(e => !et || e.entityType === et)
      .filter(e => !ev ||
        e.eventType.toLowerCase().includes(ev) ||
        (EVENT_TYPE_LABELS[e.eventType] ?? '').toLowerCase().includes(ev))
      .filter(e => !ip || (e.ipAddress ?? '').includes(ip))
      .filter(e => !cr || e.creditorId === cr)
      .slice()
      .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  });

  readonly rows = computed<GridRow[]>(() =>
    this.filtered().map(e => ({
      id:              e.eventId,
      eventDate:       this.formatDateTime(e.eventDate),
      userName:        e.userName,
      eventTypeLabel:  EVENT_TYPE_LABELS[e.eventType] ?? e.eventType,
      entityTypeLabel: ENTITY_TYPE_LABELS[e.entityType] ?? e.entityType,
      entityId:        e.entityId,
      ipAddress:       e.ipAddress ?? '—',
    }))
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    if (!this.permSvc.hasRight('SETTINGS_MANAGE')) {
      this.viewState.set('forbidden');
      return;
    }
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.auditSvc.getEvents().subscribe({
      next:  data => { this.allEvents.set(data.items); this.viewState.set('success'); },
      error: ()   => this.viewState.set('error'),
    });
  }

  // ── Filter setters ────────────────────────────────────────────────────────
  setDateFrom(e: Event):   void { this.filterDateFrom.set((e.target as HTMLInputElement).value); }
  setDateTo(e: Event):     void { this.filterDateTo.set((e.target as HTMLInputElement).value); }
  setUserName(e: Event):   void { this.filterUserName.set((e.target as HTMLInputElement).value); }
  setEntityType(e: Event): void { this.filterEntityType.set((e.target as HTMLSelectElement).value); }
  setEventType(e: Event):  void { this.filterEventType.set((e.target as HTMLInputElement).value); }
  setIp(e: Event):         void { this.filterIp.set((e.target as HTMLInputElement).value); }
  setCreditor(e: Event):   void { this.filterCreditor.set((e.target as HTMLSelectElement).value); }

  resetFilters(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterUserName.set('');
    this.filterEntityType.set('');
    this.filterEventType.set('');
    this.filterIp.set('');
    this.filterCreditor.set('');
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  openDetail(row: GridRow): void {
    const event = this.allEvents().find(e => e.eventId === row['id']);
    if (!event) return;
    this.selectedEvent.set(event);
    this.panelOpen.set(true);
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.selectedEvent.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  eventTypeLabel(et: string): string {
    return EVENT_TYPE_LABELS[et] ?? et;
  }

  entityTypeLabel(et: string): string {
    return ENTITY_TYPE_LABELS[et] ?? et;
  }

  creditorLabel(id?: string): string {
    if (!id) return '—';
    return CREDITOR_LABELS[id] ?? id;
  }

  formatDateTime(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  }

  formatJson(obj: Record<string, unknown>): string {
    return JSON.stringify(obj, null, 2);
  }

  hasFiltersActive(): boolean {
    return !!(
      this.filterDateFrom() || this.filterDateTo() || this.filterUserName() ||
      this.filterEntityType() || this.filterEventType() || this.filterIp() || this.filterCreditor()
    );
  }
}
