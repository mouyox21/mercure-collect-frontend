import {
  Component,
  computed,
  ElementRef,
  HostListener,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  ColumnDef,
  GridRow,
  GroupDef,
  PageEvent,
  RenderedGroup,
  SortState,
} from './data-grid.types';

@Component({
  selector: 'mc-data-grid',
  standalone: true,
  imports: [],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss',
})
export class DataGridComponent implements OnInit {
  readonly rows        = input.required<GridRow[]>();
  readonly columns     = input.required<ColumnDef[]>();
  readonly pageIndex   = input<number>(0);
  readonly pageSize    = input<number>(25);
  readonly totalItems  = input<number>(0);
  readonly sortState   = input<SortState | null>(null);
  readonly groupBy     = input<string | null>(null);
  readonly groupDefs   = input<GroupDef[]>([]);
  readonly amountField = input<string | undefined>(undefined);
  readonly loading     = input<boolean>(false);

  readonly rowClickable    = input<boolean>(false);

  readonly pageChange      = output<PageEvent>();
  readonly sortChange      = output<SortState>();
  readonly selectionChange = output<GridRow[]>();
  readonly rowClick        = output<GridRow>();

  protected readonly visibleColumns  = signal<Set<string>>(new Set());
  protected readonly selectedIds     = signal<Set<string>>(new Set());
  protected readonly collapsedGroups = signal<Set<string>>(new Set());
  protected readonly globalFilter    = signal('');
  protected readonly showColumnMenu  = signal(false);

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.visibleColumns.set(
      new Set(this.columns().filter(c => c.visible !== false).map(c => c.key))
    );
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (this.showColumnMenu() && !this.el.nativeElement.contains(event.target as Node)) {
      this.showColumnMenu.set(false);
    }
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    this.showColumnMenu.set(false);
  }

  protected onRowKeydown(event: KeyboardEvent, row: GridRow): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.rowClick.emit(row);
    }
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  protected readonly activeColumns = computed<ColumnDef[]>(() =>
    this.columns().filter(c => this.visibleColumns().has(c.key))
  );

  protected readonly filteredRows = computed<GridRow[]>(() => {
    const filter = this.globalFilter().toLowerCase().trim();
    if (!filter) return this.rows();
    const cols = this.activeColumns();
    return this.rows().filter(row =>
      cols.some(col => this.getCellValue(row, col).toLowerCase().includes(filter))
    );
  });

  protected readonly renderedGroups = computed<RenderedGroup[]>(() => {
    const groupBy    = this.groupBy();
    const rows       = this.filteredRows();
    const groupDefs  = this.groupDefs();
    const amtField   = this.amountField();
    const collapsed  = this.collapsedGroups();

    if (!groupBy) {
      return [{
        key: '__default__',
        label: '',
        count: rows.length,
        totalAmount: amtField ? this.sumAmount(rows, amtField) : undefined,
        rows,
        collapsed: false,
      }];
    }

    const buckets = new Map<string, GridRow[]>();
    for (const row of rows) {
      const key = String(row[groupBy] ?? '__other__');
      const bucket = buckets.get(key) ?? [];
      bucket.push(row);
      buckets.set(key, bucket);
    }

    const result: RenderedGroup[] = [];
    const covered = new Set<string>();

    for (const def of groupDefs) {
      const groupRows = buckets.get(def.key) ?? [];
      covered.add(def.key);
      if (groupRows.length === 0) continue;
      result.push({
        key: def.key,
        label: def.label,
        count: groupRows.length,
        totalAmount: amtField ? this.sumAmount(groupRows, amtField) : undefined,
        rows: groupRows,
        collapsed: collapsed.has(def.key),
      });
    }

    for (const [key, groupRows] of buckets) {
      if (covered.has(key)) continue;
      result.push({
        key,
        label: key,
        count: groupRows.length,
        totalAmount: amtField ? this.sumAmount(groupRows, amtField) : undefined,
        rows: groupRows,
        collapsed: collapsed.has(key),
      });
    }

    return result;
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize()))
  );

  protected readonly pageNumbers = computed<number[]>(() => {
    const total   = this.totalPages();
    const current = this.pageIndex();
    const start   = Math.max(0, Math.min(current - 2, total - 5));
    const end     = Math.min(total - 1, start + 4);
    const pages: number[] = [];
    for (let i = Math.max(0, start); i <= end; i++) pages.push(i);
    return pages;
  });

  protected readonly allVisibleSelected = computed<boolean>(() => {
    const ids  = this.selectedIds();
    const rows = this.rows();
    return rows.length > 0 && rows.every(r => ids.has(String(r['id'])));
  });

  protected readonly selectedCount = computed(() => this.selectedIds().size);

  protected readonly noResults = computed<boolean>(() =>
    !this.loading() && this.filteredRows().length === 0
  );

  protected readonly paginationInfo = computed<string>(() => {
    const total = this.totalItems();
    if (total === 0) return '0 résultat';
    const start = this.pageIndex() * this.pageSize() + 1;
    const end   = Math.min((this.pageIndex() + 1) * this.pageSize(), total);
    return `${start}–${end} sur ${total}`;
  });

  protected readonly grandTotalAmount = computed<number | undefined>(() => {
    const f = this.amountField();
    return f ? this.sumAmount(this.filteredRows(), f) : undefined;
  });

  protected readonly colspanFull = computed(() => this.activeColumns().length + 1);

  // ── Sorting ───────────────────────────────────────────────────────────────

  protected onSort(key: string): void {
    const current = this.sortState();
    const dir: SortState['dir'] =
      current?.column === key && current.dir === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ column: key, dir });
  }

  protected sortIcon(key: string): string {
    const s = this.sortState();
    if (!s || s.column !== key) return '↕';
    return s.dir === 'asc' ? '↑' : '↓';
  }

  protected isSorted(key: string): boolean {
    return this.sortState()?.column === key;
  }

  protected sortAriaLabel(col: ColumnDef): string {
    const s = this.sortState();
    if (!s || s.column !== col.key) return `Trier par ${col.label} croissant`;
    return s.dir === 'asc'
      ? `Trier par ${col.label} décroissant`
      : `Trier par ${col.label} croissant`;
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  protected goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.pageChange.emit({ pageIndex: page, pageSize: this.pageSize() });
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  protected toggleSelectAll(): void {
    if (this.allVisibleSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.rows().map(r => String(r['id']))));
    }
    this.emitSelection();
  }

  protected toggleRow(row: GridRow): void {
    const id = String(row['id']);
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    this.emitSelection();
  }

  protected isSelected(row: GridRow): boolean {
    return this.selectedIds().has(String(row['id']));
  }

  private emitSelection(): void {
    const ids = this.selectedIds();
    this.selectionChange.emit(this.rows().filter(r => ids.has(String(r['id']))));
  }

  // ── Groups ────────────────────────────────────────────────────────────────

  protected toggleGroup(key: string): void {
    this.collapsedGroups.update(set => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // ── Columns ───────────────────────────────────────────────────────────────

  protected toggleColumn(key: string): void {
    this.visibleColumns.update(set => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected isColumnVisible(key: string): boolean {
    return this.visibleColumns().has(key);
  }

  // ── Cell helpers ──────────────────────────────────────────────────────────

  protected getCellValue(row: GridRow, col: ColumnDef): string {
    if (col.cellFn) return col.cellFn(row);
    const val = row[col.key];
    if (val === null || val === undefined) return '—';
    if (col.isAmount && typeof val === 'number') return this.formatCurrency(val);
    if (val instanceof Date) {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
      }).format(val);
    }
    return String(val);
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  protected trackRow(index: number, row: GridRow): string {
    return String(row['id'] ?? index);
  }

  private sumAmount(rows: GridRow[], field: string): number {
    return rows.reduce((acc, row) => {
      const val = row[field];
      return acc + (typeof val === 'number' ? val : 0);
    }, 0);
  }
}
