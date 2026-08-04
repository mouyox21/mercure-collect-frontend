import { TestBed, ComponentFixture } from '@angular/core/testing';
import { KanbanBoardComponent } from './kanban-board.component';
import { GridRow, GroupDef } from '../data-grid/data-grid.types';
import { CaseData } from '../ui.types';
import { RowMovedEvent } from './kanban-board.types';

const ROWS: GridRow[] = [
  { id: '1', name: 'Alice',   amount: 1500, status: 'nouveau',  group: 'A', daysOverdue: 10 },
  { id: '2', name: 'Bob',     amount: 2000, status: 'en-cours', group: 'A', daysOverdue: 20 },
  { id: '3', name: 'Charlie', amount:  500, status: 'promesse', group: 'B', daysOverdue:  5 },
];

const GROUP_DEFS: GroupDef[] = [
  { key: 'A', label: 'Groupe A' },
  { key: 'B', label: 'Groupe B' },
];

function rowToCase(row: GridRow): CaseData {
  return {
    id: String(row['id']),
    debtorName: String(row['name']),
    amount: Number(row['amount']),
    daysOverdue: Number(row['daysOverdue']),
    status: row['status'] as CaseData['status'],
  };
}

describe('KanbanBoardComponent', () => {
  let fixture: ComponentFixture<KanbanBoardComponent>;

  function createComponent(overrides: {
    rows?: GridRow[];
    groupBy?: string | null;
    groupDefs?: GroupDef[];
    amountField?: string;
    dragDropEnabled?: boolean;
  } = {}): void {
    fixture = TestBed.createComponent(KanbanBoardComponent);
    fixture.componentRef.setInput('rows',      overrides.rows   ?? ROWS);
    fixture.componentRef.setInput('rowToCase', rowToCase);
    if ('groupBy'         in overrides) fixture.componentRef.setInput('groupBy',         overrides.groupBy);
    if ('groupDefs'       in overrides) fixture.componentRef.setInput('groupDefs',       overrides.groupDefs);
    if ('amountField'     in overrides) fixture.componentRef.setInput('amountField',     overrides.amountField);
    if ('dragDropEnabled' in overrides) fixture.componentRef.setInput('dragDropEnabled', overrides.dragDropEnabled);
    fixture.detectChanges();
  }

  function host(): HTMLElement { return fixture.nativeElement as HTMLElement; }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KanbanBoardComponent],
    }).compileComponents();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('should render one column per groupDef', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    expect(host().querySelectorAll('.kanban__column').length).toBe(2);
  });

  it('should render a single default column when groupBy is null', () => {
    createComponent({ groupBy: null });
    expect(host().querySelectorAll('.kanban__column').length).toBe(1);
  });

  it('should render correct number of cards per column', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    const cols = host().querySelectorAll('.kanban__column');
    expect(cols[0].querySelectorAll('.case-card').length).toBe(2);
    expect(cols[1].querySelectorAll('.case-card').length).toBe(1);
  });

  it('should display correct column labels', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    const labels = host().querySelectorAll('.kanban__col-label');
    expect(labels[0].textContent?.trim()).toBe('Groupe A');
    expect(labels[1].textContent?.trim()).toBe('Groupe B');
  });

  it('should display correct card count per column', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    const counts = host().querySelectorAll('.kanban__col-count');
    expect(counts[0].textContent?.trim()).toBe('2');
    expect(counts[1].textContent?.trim()).toBe('1');
  });

  // ── Amounts ────────────────────────────────────────────────────────────────

  it('should show column total when amountField is provided', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, amountField: 'amount' });
    const totals = host().querySelectorAll('.kanban__col-total');
    expect(totals.length).toBe(2);
    // Group A: 1500 + 2000 = 3500
    expect(totals[0].textContent).toContain('3');
  });

  it('should not show column totals when amountField is not provided', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    expect(host().querySelectorAll('.kanban__col-total').length).toBe(0);
  });

  // ── Collapse / expand ──────────────────────────────────────────────────────

  it('should collapse column cards when header button clicked', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    const totalBefore = host().querySelectorAll('.case-card').length;

    (host().querySelector('.kanban__col-btn') as HTMLButtonElement)?.click();
    fixture.detectChanges();

    const totalAfter = host().querySelectorAll('.case-card').length;
    expect(totalAfter).toBe(totalBefore - 2); // Group A had 2 cards
  });

  it('should expand collapsed column on second click', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    const btn = host().querySelector<HTMLButtonElement>('.kanban__col-btn');
    btn?.click(); fixture.detectChanges();
    btn?.click(); fixture.detectChanges();
    expect(host().querySelectorAll('.case-card').length).toBe(ROWS.length);
  });

  it('should apply collapsed modifier to chevron when column is collapsed', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    (host().querySelector('.kanban__col-btn') as HTMLButtonElement)?.click();
    fixture.detectChanges();
    expect(host().querySelector('.kanban__col-chevron--collapsed')).toBeTruthy();
  });

  // ── Empty state ────────────────────────────────────────────────────────────

  it('should show empty state when a column has no cards', () => {
    createComponent({
      rows: [{ id: '1', name: 'Alice', amount: 1500, status: 'nouveau', group: 'A', daysOverdue: 10 }],
      groupBy: 'group',
      groupDefs: GROUP_DEFS,
    });
    const empties = host().querySelectorAll('.kanban__empty');
    expect(empties.length).toBe(1); // Group B has no cards
  });

  // ── Card events ────────────────────────────────────────────────────────────

  it('should emit cardSelected when a case card is clicked', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    let selected: CaseData | undefined;
    fixture.componentInstance.cardSelected.subscribe((d: CaseData) => (selected = d));

    (host().querySelector<HTMLElement>('[role="button"]'))?.click();

    expect(selected).toBeDefined();
    expect(selected?.id).toBe('1');
  });

  // ── Drag & drop ────────────────────────────────────────────────────────────

  it('should not set draggable attribute when dragDropEnabled is false', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: false });
    host().querySelectorAll('.kanban__card-wrap').forEach(w => {
      expect(w.getAttribute('draggable')).toBeNull();
    });
  });

  it('should set draggable="true" on card wrappers when dragDropEnabled is true', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const wraps = host().querySelectorAll('.kanban__card-wrap');
    expect(wraps.length).toBeGreaterThan(0);
    wraps.forEach(w => expect(w.getAttribute('draggable')).toBe('true'));
  });

  it('should emit rowMoved when a card is dropped on a different column', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    const comp = fixture.componentInstance as any;
    comp.dragRow.set(ROWS[0]);
    comp.dragSourceKey.set('A');

    const fakeEvent = { preventDefault: () => {} } as unknown as DragEvent;
    comp.onDrop(fakeEvent, 'B');

    expect(moved?.fromGroup).toBe('A');
    expect(moved?.toGroup).toBe('B');
    expect(moved?.row).toBe(ROWS[0]);
  });

  it('should not emit rowMoved when dropped on the same column', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    const comp = fixture.componentInstance as any;
    comp.dragRow.set(ROWS[0]);
    comp.dragSourceKey.set('A');

    const fakeEvent = { preventDefault: () => {} } as unknown as DragEvent;
    comp.onDrop(fakeEvent, 'A'); // same column

    expect(moved).toBeUndefined();
  });

  it('should not emit rowMoved when dragDropEnabled is false', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: false });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    const comp = fixture.componentInstance as any;
    comp.dragRow.set(ROWS[0]);
    comp.dragSourceKey.set('A');

    const fakeEvent = { preventDefault: () => {} } as unknown as DragEvent;
    comp.onDrop(fakeEvent, 'B');

    expect(moved).toBeUndefined();
  });
});
