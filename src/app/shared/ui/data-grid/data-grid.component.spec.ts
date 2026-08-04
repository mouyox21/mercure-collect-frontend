import { TestBed, ComponentFixture } from '@angular/core/testing';
import { DataGridComponent } from './data-grid.component';
import { ColumnDef, GridRow, GroupDef, PageEvent, SortState } from './data-grid.types';

const COLUMNS: ColumnDef[] = [
  { key: 'name',   label: 'Nom',     sortable: true },
  { key: 'amount', label: 'Montant', sortable: true, isAmount: true, align: 'right' },
  { key: 'status', label: 'Statut' },
];

const ROWS: GridRow[] = [
  { id: '1', name: 'Alice',   amount: 1500, status: 'nouveau',  group: 'A' },
  { id: '2', name: 'Bob',     amount: 2000, status: 'en-cours', group: 'A' },
  { id: '3', name: 'Charlie', amount:  500, status: 'promesse', group: 'B' },
];

const GROUP_DEFS: GroupDef[] = [
  { key: 'A', label: 'Groupe A' },
  { key: 'B', label: 'Groupe B' },
];

describe('DataGridComponent', () => {
  let fixture: ComponentFixture<DataGridComponent>;

  function createComponent(overrides: {
    rows?: GridRow[];
    columns?: ColumnDef[];
    pageIndex?: number;
    pageSize?: number;
    totalItems?: number;
    sortState?: SortState | null;
    groupBy?: string | null;
    groupDefs?: GroupDef[];
    amountField?: string;
    loading?: boolean;
  } = {}): void {
    fixture = TestBed.createComponent(DataGridComponent);
    fixture.componentRef.setInput('rows',       overrides.rows      ?? ROWS);
    fixture.componentRef.setInput('columns',    overrides.columns   ?? COLUMNS);
    fixture.componentRef.setInput('pageIndex',  overrides.pageIndex ?? 0);
    fixture.componentRef.setInput('pageSize',   overrides.pageSize  ?? 25);
    fixture.componentRef.setInput('totalItems', overrides.totalItems ?? ROWS.length);
    if ('sortState'   in overrides) fixture.componentRef.setInput('sortState',   overrides.sortState);
    if ('groupBy'     in overrides) fixture.componentRef.setInput('groupBy',     overrides.groupBy);
    if ('groupDefs'   in overrides) fixture.componentRef.setInput('groupDefs',   overrides.groupDefs);
    if ('amountField' in overrides) fixture.componentRef.setInput('amountField', overrides.amountField);
    if ('loading'     in overrides) fixture.componentRef.setInput('loading',     overrides.loading);
    fixture.detectChanges();
  }

  function host(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataGridComponent],
    }).compileComponents();
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  it('should render the table', () => {
    createComponent();
    expect(host().querySelector('table')).toBeTruthy();
  });

  it('should render a row for each data row', () => {
    createComponent();
    const rows = host().querySelectorAll('.grid__row:not(.grid__row--skeleton)');
    expect(rows.length).toBe(ROWS.length);
  });

  // ── Sorting ────────────────────────────────────────────────────────────────

  describe('sorting', () => {
    it('should emit sortChange ascending on first click', () => {
      createComponent({ sortState: null });
      let emitted: SortState | undefined;
      fixture.componentInstance.sortChange.subscribe((s: SortState) => (emitted = s));

      (host().querySelector('.grid__sort-btn') as HTMLButtonElement)?.click();

      expect(emitted).toEqual({ column: 'name', dir: 'asc' });
    });

    it('should emit sortChange descending when column already sorted asc', () => {
      createComponent({ sortState: { column: 'name', dir: 'asc' } });
      let emitted: SortState | undefined;
      fixture.componentInstance.sortChange.subscribe((s: SortState) => (emitted = s));

      (host().querySelector('.grid__sort-btn') as HTMLButtonElement)?.click();

      expect(emitted).toEqual({ column: 'name', dir: 'desc' });
    });

    it('should reset to asc when sorting a different column', () => {
      createComponent({ sortState: { column: 'name', dir: 'desc' } });
      let emitted: SortState | undefined;
      fixture.componentInstance.sortChange.subscribe((s: SortState) => (emitted = s));

      const btns = host().querySelectorAll<HTMLButtonElement>('.grid__sort-btn');
      btns[1]?.click(); // click 'amount'

      expect(emitted).toEqual({ column: 'amount', dir: 'asc' });
    });

    it('should mark active column header with sorted class', () => {
      createComponent({ sortState: { column: 'name', dir: 'asc' } });
      const sortedTh = host().querySelector('.grid__th--sorted');
      expect(sortedTh).toBeTruthy();
    });

    it('should show ↑ icon for asc sort', () => {
      createComponent({ sortState: { column: 'name', dir: 'asc' } });
      const icon = host().querySelector('.grid__sort-icon--active');
      expect(icon?.textContent?.trim()).toBe('↑');
    });

    it('should show ↓ icon for desc sort', () => {
      createComponent({ sortState: { column: 'amount', dir: 'desc' } });
      const icon = host().querySelector('.grid__sort-icon--active');
      expect(icon?.textContent?.trim()).toBe('↓');
    });
  });

  // ── Pagination ─────────────────────────────────────────────────────────────

  describe('pagination', () => {
    it('should emit pageChange with next index on › click', () => {
      createComponent({ pageIndex: 0, pageSize: 2, totalItems: 10 });
      let emitted: PageEvent | undefined;
      fixture.componentInstance.pageChange.subscribe((p: PageEvent) => (emitted = p));

      (host().querySelector('[aria-label="Page suivante"]') as HTMLButtonElement)?.click();

      expect(emitted).toEqual({ pageIndex: 1, pageSize: 2 });
    });

    it('should emit pageChange with prev index on ‹ click', () => {
      createComponent({ pageIndex: 2, pageSize: 2, totalItems: 10 });
      let emitted: PageEvent | undefined;
      fixture.componentInstance.pageChange.subscribe((p: PageEvent) => (emitted = p));

      (host().querySelector('[aria-label="Page précédente"]') as HTMLButtonElement)?.click();

      expect(emitted).toEqual({ pageIndex: 1, pageSize: 2 });
    });

    it('should disable ‹ button on first page', () => {
      createComponent({ pageIndex: 0, totalItems: 10 });
      const btn = host().querySelector<HTMLButtonElement>('[aria-label="Page précédente"]');
      expect(btn?.disabled).toBe(true);
    });

    it('should disable › button on last page', () => {
      createComponent({ pageIndex: 4, pageSize: 2, totalItems: 10 });
      const btn = host().querySelector<HTMLButtonElement>('[aria-label="Page suivante"]');
      expect(btn?.disabled).toBe(true);
    });

    it('should show correct pagination info', () => {
      createComponent({ pageIndex: 1, pageSize: 2, totalItems: 10 });
      const info = host().querySelector('.grid__pagination-info');
      expect(info?.textContent?.trim()).toBe('3–4 sur 10');
    });

    it('should emit correct page when a page number button is clicked', () => {
      createComponent({ pageIndex: 0, pageSize: 1, totalItems: 5 });
      let emitted: PageEvent | undefined;
      fixture.componentInstance.pageChange.subscribe((p: PageEvent) => (emitted = p));

      const pageBtns = host().querySelectorAll<HTMLButtonElement>('.grid__page-btn');
      // buttons: ‹, 1, 2, 3, 4, 5, › — click page 3 (index 2)
      pageBtns[3]?.click();

      expect(emitted?.pageIndex).toBe(2);
    });
  });

  // ── Grouping ───────────────────────────────────────────────────────────────

  describe('grouping', () => {
    it('should render group header rows when groupBy is set', () => {
      createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
      const headers = host().querySelectorAll('.grid__group-row');
      expect(headers.length).toBe(2);
    });

    it('should show group label in header', () => {
      createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
      const labels = host().querySelectorAll('.grid__group-label');
      expect(labels[0]?.textContent?.trim()).toBe('Groupe A');
      expect(labels[1]?.textContent?.trim()).toBe('Groupe B');
    });

    it('should show correct row count per group', () => {
      createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
      const counts = host().querySelectorAll('.grid__group-count');
      expect(counts[0]?.textContent).toContain('2');
      expect(counts[1]?.textContent).toContain('1');
    });

    it('should collapse group rows when group header is clicked', () => {
      createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
      const rowsBefore = host().querySelectorAll('.grid__row').length;

      (host().querySelector('.grid__group-btn') as HTMLButtonElement)?.click();
      fixture.detectChanges();

      const rowsAfter = host().querySelectorAll('.grid__row').length;
      expect(rowsAfter).toBe(rowsBefore - 2); // group A has 2 rows
    });

    it('should expand collapsed group on second click', () => {
      createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
      const btn = host().querySelector<HTMLButtonElement>('.grid__group-btn');
      btn?.click(); fixture.detectChanges();
      btn?.click(); fixture.detectChanges();
      const rows = host().querySelectorAll('.grid__row').length;
      expect(rows).toBe(ROWS.length);
    });

    it('should show group total amount when amountField is provided', () => {
      createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, amountField: 'amount' });
      const totals = host().querySelectorAll('.grid__group-total');
      // Group A: 1500 + 2000 = 3500
      expect(totals[0]?.textContent).toContain('3');
      expect(totals.length).toBe(2);
    });

    it('should not render group headers when groupBy is null', () => {
      createComponent({ groupBy: null });
      const headers = host().querySelectorAll('.grid__group-row');
      expect(headers.length).toBe(0);
    });

    it('should show grand total in tfoot when amountField is set', () => {
      createComponent({ amountField: 'amount' });
      const grand = host().querySelector('.grid__grand-value');
      expect(grand).toBeTruthy();
      // 1500 + 2000 + 500 = 4000
      expect(grand?.textContent).toContain('4');
    });
  });

  // ── Selection ──────────────────────────────────────────────────────────────

  describe('selection', () => {
    it('should emit selectionChange with the toggled row', () => {
      createComponent();
      let selected: GridRow[] = [];
      fixture.componentInstance.selectionChange.subscribe((s: GridRow[]) => (selected = s));

      const checkboxes = host().querySelectorAll<HTMLInputElement>('.grid__td--check input');
      checkboxes[0]?.click();

      expect(selected.length).toBe(1);
      expect(selected[0]['id']).toBe('1');
    });

    it('should select all rows when header checkbox is clicked', () => {
      createComponent();
      let selected: GridRow[] = [];
      fixture.componentInstance.selectionChange.subscribe((s: GridRow[]) => (selected = s));

      (host().querySelector('.grid__th--check input') as HTMLInputElement)?.click();

      expect(selected.length).toBe(ROWS.length);
    });

    it('should deselect all when header checkbox clicked again after selecting all', () => {
      createComponent();
      let selected: GridRow[] = [];
      fixture.componentInstance.selectionChange.subscribe((s: GridRow[]) => (selected = s));

      const headerCb = host().querySelector<HTMLInputElement>('.grid__th--check input');
      headerCb?.click(); // select all
      headerCb?.click(); // deselect all

      expect(selected.length).toBe(0);
    });

    it('should apply selected row class when row is selected', () => {
      createComponent();
      (host().querySelectorAll<HTMLInputElement>('.grid__td--check input')[0])?.click();
      fixture.detectChanges();
      const selectedRows = host().querySelectorAll('.grid__row--selected');
      expect(selectedRows.length).toBe(1);
    });
  });

  // ── Column visibility ──────────────────────────────────────────────────────

  describe('column visibility', () => {
    it('should open column menu on button click', () => {
      createComponent();
      (host().querySelector('.grid__col-btn') as HTMLButtonElement)?.click();
      fixture.detectChanges();
      expect(host().querySelector('.grid__col-menu')).toBeTruthy();
    });

    it('should hide a column after unchecking it in column menu', () => {
      createComponent();
      (host().querySelector('.grid__col-btn') as HTMLButtonElement)?.click();
      fixture.detectChanges();

      const cbx = host().querySelectorAll<HTMLInputElement>('.grid__col-item input');
      cbx[0]?.click(); // hide 'name'
      fixture.detectChanges();

      const ths = host().querySelectorAll('.grid__th:not(.grid__th--check)');
      expect(ths.length).toBe(COLUMNS.length - 1);
    });
  });

  // ── Filter ─────────────────────────────────────────────────────────────────

  describe('global filter', () => {
    it('should show only matching rows after filter input', () => {
      createComponent();
      const input = host().querySelector<HTMLInputElement>('.grid__search');
      if (input) {
        input.value = 'alice';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      }
      const rows = host().querySelectorAll('.grid__row:not(.grid__row--skeleton)');
      expect(rows.length).toBe(1);
    });

    it('should show empty state when filter matches nothing', () => {
      createComponent();
      const input = host().querySelector<HTMLInputElement>('.grid__search');
      if (input) {
        input.value = 'zzznomatch';
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      }
      expect(host().querySelector('.grid__empty')).toBeTruthy();
    });
  });

  // ── Loading ────────────────────────────────────────────────────────────────

  it('should show skeleton rows when loading is true', () => {
    createComponent({ loading: true });
    expect(host().querySelectorAll('.grid__row--skeleton').length).toBeGreaterThan(0);
    expect(host().querySelectorAll('.grid__row:not(.grid__row--skeleton)').length).toBe(0);
  });
});
