import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { DebtorService, DebtorSearchCriteria } from '../shared/data-access/debtor.service';
import { PermissionService } from '../shared/data-access/permission.service';
import { DebtorSearchResultDto } from '../shared/data-access/models/debtor.model';
import {
  DataGridComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ForbiddenStateComponent,
  SkeletonLoaderComponent,
} from '../shared/ui';
import { ColumnDef, GridRow, PageEvent, SortState } from '../shared/ui/data-grid/data-grid.types';
import { ViewState } from '../shared/ui/ui.types';

interface ClientFilters {
  query:       string;
  clientType:  string;
  status:      string;
  riskSegment: string;
  city:        string;
  creditorId:  string;
}

const DEFAULT_FILTERS: ClientFilters = {
  query: '', clientType: '', status: '', riskSegment: '', city: '', creditorId: '',
};

@Component({
  selector: 'mc-clients',
  standalone: true,
  imports: [
    DataGridComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ForbiddenStateComponent,
  ],
  templateUrl: './debtors.component.html',
  styleUrl:    './debtors.component.scss',
})
export class ClientsComponent implements OnInit {
  private readonly router     = inject(Router);
  private readonly debtorSvc  = inject(DebtorService);
  private readonly permSvc    = inject(PermissionService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly searchSubject = new Subject<string>();

  readonly viewState   = signal<ViewState>('loading');
  readonly rows        = signal<GridRow[]>([]);
  readonly totalItems  = signal(0);
  readonly pageIndex   = signal(0);
  readonly pageSize    = signal(20);
  readonly sortState   = signal<SortState>({ column: 'debtorName', dir: 'asc' });
  readonly filtersOpen = signal(false);
  readonly filters     = signal<ClientFilters>({ ...DEFAULT_FILTERS });
  readonly queryInput  = signal('');

  readonly canViewContacts = computed(() => this.permSvc.hasRight('CLIENT_CONTACT_VIEW'));
  readonly duplicateCount  = computed(() => this.rows().filter(r => r['hasDuplicateAlert']).length);

  readonly hasActiveFilters = computed(() => {
    const f = this.filters();
    return !!(f.clientType || f.status || f.riskSegment || f.city || f.creditorId);
  });

  readonly queryHint = computed(() => {
    const q = this.queryInput();
    return q.length > 0 && q.length < 3;
  });

  readonly gridColumns = computed<ColumnDef[]>(() => {
    const can = this.canViewContacts();
    const mask = (v: unknown): string => can ? String(v ?? '') : '••••••';
    return [
      { key: 'debtorName',         label: 'Nom / Raison sociale', sortable: true },
      { key: 'clientTypeLabel',    label: 'Type' },
      { key: 'identifier',         label: 'ICE / CIN' },
      { key: 'city',               label: 'Ville', sortable: true },
      { key: 'mainPhone',          label: 'Téléphone', cellFn: r => mask(r['mainPhone']) },
      { key: 'email',              label: 'E-mail',    cellFn: r => mask(r['email'])     },
      { key: 'riskSegmentLabel',   label: 'Segment' },
      { key: 'riskScore',          label: 'Score', sortable: true, align: 'right' },
      { key: 'creditorLabel',      label: 'Créancier' },
      { key: 'totalOverdueAmount', label: 'Impayé (MAD)', sortable: true, isAmount: true },
      { key: 'activeCasesCount',   label: 'Dossiers', sortable: true, align: 'right' },
      {
        key: 'duplicateAlert',
        label: 'Alerte',
        cellFn: r => r['hasDuplicateAlert'] ? '⚠ Doublon' : '',
      },
    ];
  });

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      filter(q => q.length === 0 || q.length >= 3),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(q => {
      this.filters.update(f => ({ ...f, query: q }));
      this.pageIndex.set(0);
      this.loadData();
    });

    this.loadData();
  }

  loadData(): void {
    this.viewState.set('loading');
    const f = this.filters();
    const s = this.sortState();
    const criteria: DebtorSearchCriteria = {
      query:       f.query       || undefined,
      clientType:  f.clientType  || undefined,
      status:      f.status      || undefined,
      riskSegment: f.riskSegment || undefined,
      city:        f.city        || undefined,
      creditorId:  f.creditorId  || undefined,
      page:        this.pageIndex(),
      size:        this.pageSize(),
      sort:        `${s.column},${s.dir}`,
    };
    this.debtorSvc.search(criteria).subscribe({
      next: dto => {
        this.rows.set(dto.items.map(d => this.toGridRow(d)));
        this.totalItems.set(dto.total);
        this.viewState.set(dto.total === 0 ? 'empty' : 'success');
      },
      error: (err: any) => {
        if (err?.status === 403) { this.viewState.set('forbidden'); return; }
        this.viewState.set('error');
      },
    });
  }

  onQueryInput(value: string): void {
    this.queryInput.set(value);
    this.searchSubject.next(value);
  }

  onSearch(): void {
    this.pageIndex.set(0);
    this.loadData();
  }

  onReset(): void {
    this.queryInput.set('');
    this.searchSubject.next('');
    this.filters.set({ ...DEFAULT_FILTERS });
    this.pageIndex.set(0);
    this.loadData();
  }

  updateFilter<K extends keyof ClientFilters>(key: K, value: string): void {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  onPageChange(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
    this.loadData();
  }

  onSortChange(s: SortState): void {
    this.sortState.set(s);
    this.pageIndex.set(0);
    this.loadData();
  }

  onRowClick(row: GridRow): void {
    this.router.navigate(['/clients', String(row['debtorId'])]);
  }

  private toGridRow(d: DebtorSearchResultDto): GridRow {
    return {
      debtorId:          d.debtorId,
      debtorName:        d.debtorName,
      clientTypeLabel:   this.clientTypeLabel(d.clientType),
      identifier:        d.ice || d.cin || '—',
      city:              d.city,
      mainPhone:         d.mainPhone,
      email:             d.email,
      riskSegmentLabel:  this.riskSegmentLabel(d.riskSegment),
      riskScore:         d.riskScore,
      creditorLabel:     d.creditorLabel,
      totalOverdueAmount: d.totalOverdueAmount,
      outstandingAmount: d.outstandingAmount,
      activeCasesCount:  d.activeCasesCount,
      hasDuplicateAlert: d.hasDuplicateAlert,
      duplicateAlertType: d.duplicateAlertType ?? '',
      status:            d.status,
    };
  }

  protected clientTypeLabel(t: string): string {
    const MAP: Record<string, string> = {
      PARTICULIER: 'Particulier', ENTREPRISE: 'Entreprise', ASSOCIATION: 'Association',
    };
    return MAP[t] ?? t;
  }

  protected riskSegmentLabel(s: string): string {
    const MAP: Record<string, string> = {
      STANDARD: 'Standard', VIP: 'VIP', SENSIBLE: 'Sensible', RISK: 'À risque',
    };
    return MAP[s] ?? s;
  }
}
