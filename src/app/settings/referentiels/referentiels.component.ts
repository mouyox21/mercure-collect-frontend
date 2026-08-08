import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SettingsService } from '../../shared/data-access/settings.service';
import { PermissionService } from '../../shared/data-access/permission.service';
import { ReferenceValueDto } from '../../shared/data-access/models/settings.model';
import { ViewState } from '../../shared/ui/ui.types';
import { ColumnDef, GridRow } from '../../shared/ui/data-grid/data-grid.types';
import {
  DataGridComponent,
  SkeletonLoaderComponent,
  ErrorStateComponent,
  EmptyStateComponent,
  ForbiddenStateComponent,
  SuccessToastComponent,
  SideNavPanelComponent,
  SideNavItem,
} from '../../shared/ui';
import { IconName } from '../../shared/data-access/icon-registry';

interface DomainEntry {
  key: string;
  label: string;
  icon: IconName;
}

const DOMAINS: DomainEntry[] = [
  { key: 'CREDITOR',        label: 'Créanciers',          icon: 'building-library' },
  { key: 'ACTION_CATEGORY', label: "Catégories d'action", icon: 'tag' },
  { key: 'CASE_STATUS',     label: 'Statuts dossier',     icon: 'flag' },
  { key: 'PRIORITY',        label: 'Priorités',           icon: 'bolt' },
  { key: 'PHASE',           label: 'Phases',              icon: 'arrow-path' },
  { key: 'CHANNEL',         label: 'Canaux',              icon: 'signal' },
];

const COLUMNS: ColumnDef[] = [
  { key: 'code',        label: 'Code',        sortable: true, width: '160px' },
  { key: 'label',       label: 'Libellé',     sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'activeLabel', label: 'Actif',       align: 'center', width: '90px' },
  { key: 'sortOrder',   label: 'Ordre',       align: 'right',  width: '70px' },
];

@Component({
  selector: 'mc-settings-referentiels',
  standalone: true,
  imports: [
    DataGridComponent,
    SkeletonLoaderComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ForbiddenStateComponent,
    SuccessToastComponent,
    SideNavPanelComponent,
  ],
  templateUrl: './referentiels.component.html',
  styleUrl: './referentiels.component.scss',
})
export class ParametragesReferentielsComponent implements OnInit {
  private readonly settingsSvc = inject(SettingsService);
  private readonly permSvc     = inject(PermissionService);

  readonly COLUMNS = COLUMNS;

  // State
  readonly activeDomain = signal('CREDITOR');
  readonly allItems     = signal<ReferenceValueDto[]>([]);
  readonly viewState    = signal<ViewState>('loading');

  // Toast
  readonly showToast = signal(false);
  readonly toastMsg  = signal('');

  // Deactivation confirmation
  readonly pendingDeactivate = signal(false);

  // Drawer
  readonly drawerOpen = signal(false);
  readonly editItem   = signal<ReferenceValueDto | null>(null);

  // Form signals
  readonly fCode        = signal('');
  readonly fLabel       = signal('');
  readonly fDescription = signal('');
  readonly fActive      = signal(true);
  readonly fSortOrder   = signal('');
  readonly formError    = signal('');
  readonly formTouched  = signal(false);

  readonly isEditing = computed(() => this.editItem() !== null);

  readonly isDeactivating = computed(() =>
    this.isEditing() && !this.fActive() && (this.editItem()?.active ?? false)
  );

  readonly activeDomainLabel = computed(
    () => DOMAINS.find(d => d.key === this.activeDomain())?.label ?? this.activeDomain()
  );

  /** Domain nav items with a live count badge — mirrors "Tous les packages · N" in Règles & Workflows. */
  readonly navItems = computed<SideNavItem[]>(() => {
    const all = this.allItems();
    return DOMAINS.map(d => ({
      key:   d.key,
      label: d.label,
      icon:  d.icon,
      badge: all.filter(r => r.domain === d.key).length,
    }));
  });

  readonly filtered = computed<ReferenceValueDto[]>(() =>
    this.allItems()
      .filter(r => r.domain === this.activeDomain())
      .slice()
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
  );

  readonly rows = computed<GridRow[]>(() =>
    this.filtered().map(r => ({
      id:          r.id,
      code:        r.code,
      label:       r.label,
      description: r.description ?? '—',
      activeLabel: r.active ? '✓ Actif' : '✗ Inactif',
      sortOrder:   r.sortOrder ?? '—',
    }))
  );

  ngOnInit(): void {
    if (!this.permSvc.hasRight('SETTINGS_MANAGE')) {
      this.viewState.set('forbidden');
      return;
    }
    this.load();
  }

  load(): void {
    this.viewState.set('loading');
    this.settingsSvc.getReferenceValues().subscribe({
      next: page => {
        this.allItems.set(page.items);
        this.viewState.set('success');
      },
      error: () => this.viewState.set('error'),
    });
  }

  selectDomain(key: string): void {
    this.activeDomain.set(key);
    this.drawerOpen.set(false);
  }

  openCreate(): void {
    this.editItem.set(null);
    this.fCode.set('');
    this.fLabel.set('');
    this.fDescription.set('');
    this.fActive.set(true);
    this.fSortOrder.set('');
    this.formError.set('');
    this.formTouched.set(false);
    this.drawerOpen.set(true);
  }

  openEdit(row: GridRow): void {
    const item = this.filtered().find(r => r.id === row['id']);
    if (!item) return;
    this.editItem.set(item);
    this.fCode.set(item.code);
    this.fLabel.set(item.label);
    this.fDescription.set(item.description ?? '');
    this.fActive.set(item.active);
    this.fSortOrder.set(item.sortOrder != null ? String(item.sortOrder) : '');
    this.formError.set('');
    this.formTouched.set(false);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.pendingDeactivate.set(false);
  }

  saveForm(): void {
    this.formTouched.set(true);
    const label = this.fLabel().trim();
    if (!label) {
      this.formError.set('Le libellé est requis.');
      return;
    }

    if (this.isDeactivating() && !this.pendingDeactivate()) {
      this.pendingDeactivate.set(true);
      return;
    }

    const sortOrderRaw = this.fSortOrder().trim();
    const sortOrder = sortOrderRaw ? parseInt(sortOrderRaw, 10) : undefined;

    if (this.isEditing()) {
      const orig = this.editItem()!;
      const updated: ReferenceValueDto = {
        ...orig,
        label,
        description: this.fDescription().trim() || undefined,
        active:      this.fActive(),
        sortOrder,
        updatedAt:   new Date().toISOString(),
      };
      this.allItems.update(items => items.map(r => r.id === orig.id ? updated : r));
    } else {
      const code = this.fCode().trim().toUpperCase();
      if (!code) {
        this.formError.set('Le code est requis.');
        return;
      }
      const duplicate = this.allItems().some(
        r => r.code === code && r.domain === this.activeDomain()
      );
      if (duplicate) {
        this.formError.set('Ce code existe déjà dans ce domaine.');
        return;
      }
      const newItem: ReferenceValueDto = {
        id:          `RV-${this.activeDomain().slice(0, 3)}-${Date.now()}`,
        code,
        label,
        description: this.fDescription().trim() || undefined,
        domain:      this.activeDomain(),
        active:      this.fActive(),
        sortOrder,
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      };
      this.allItems.update(items => [...items, newItem]);
    }

    this.drawerOpen.set(false);
    this.pendingDeactivate.set(false);
    this.toastMsg.set(`Valeur ${this.isEditing() ? 'modifiée' : 'créée'} avec succès.`);
    this.showToast.set(true);
  }

  toggleActive(row: GridRow): void {
    const item = this.allItems().find(r => r.id === row['id']);
    if (!item) return;
    const toggled: ReferenceValueDto = {
      ...item,
      active:    !item.active,
      updatedAt: new Date().toISOString(),
    };
    this.allItems.update(items => items.map(r => r.id === item.id ? toggled : r));
  }
}
