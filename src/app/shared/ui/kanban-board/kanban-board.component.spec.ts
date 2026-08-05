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

/** Simulate a keydown event forwarded to the component's onCardKeydown handler. */
function fakeKeydown(key: string): KeyboardEvent {
  return { key, preventDefault: () => {} } as unknown as KeyboardEvent;
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
  function comp(): any         { return fixture.componentInstance as any; }

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

  // ── ARIA structure ─────────────────────────────────────────────────────────

  it('should set role="group" on each column', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    const cols = host().querySelectorAll('.kanban__column');
    cols.forEach(col => expect(col.getAttribute('role')).toBe('group'));
  });

  it('should set role="list" on cards container', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    const lists = host().querySelectorAll('.kanban__cards');
    lists.forEach(list => expect(list.getAttribute('role')).toBe('list'));
  });

  it('should set role="listitem" on each card wrapper', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS });
    const wraps = host().querySelectorAll('.kanban__card-wrap');
    wraps.forEach(w => expect(w.getAttribute('role')).toBe('listitem'));
  });

  it('should include aria-live region for DnD announcements', () => {
    createComponent();
    const live = host().querySelector('[aria-live="polite"]');
    expect(live).toBeTruthy();
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

    comp().dragRow.set(ROWS[0]);
    comp().dragSourceKey.set('A');

    const fakeEvent = { preventDefault: () => {} } as unknown as DragEvent;
    comp().onDrop(fakeEvent, 'B');

    expect(moved?.fromGroup).toBe('A');
    expect(moved?.toGroup).toBe('B');
    expect(moved?.row).toBe(ROWS[0]);
  });

  it('should not emit rowMoved when dropped on the same column', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    comp().dragRow.set(ROWS[0]);
    comp().dragSourceKey.set('A');

    const fakeEvent = { preventDefault: () => {} } as unknown as DragEvent;
    comp().onDrop(fakeEvent, 'A'); // same column

    expect(moved).toBeUndefined();
  });

  it('should not emit rowMoved when dragDropEnabled is false', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: false });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    comp().dragRow.set(ROWS[0]);
    comp().dragSourceKey.set('A');

    const fakeEvent = { preventDefault: () => {} } as unknown as DragEvent;
    comp().onDrop(fakeEvent, 'B');

    expect(moved).toBeUndefined();
  });

  // ── Keyboard accessibility — focus ─────────────────────────────────────────

  it('card wrappers should be focusable (tabindex="0") when dragDropEnabled is true', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    host().querySelectorAll('.kanban__card-wrap').forEach(w => {
      expect(w.getAttribute('tabindex')).toBe('0');
    });
  });

  it('card wrappers should have no tabindex when dragDropEnabled is false', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: false });
    host().querySelectorAll('.kanban__card-wrap').forEach(w => {
      expect(w.getAttribute('tabindex')).toBeNull();
    });
  });

  it('inner CaseCard article should have tabindex="-1" when dragDropEnabled is true', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    host().querySelectorAll<HTMLElement>('mc-case-card article').forEach(el => {
      expect(el.getAttribute('tabindex')).toBe('-1');
    });
  });

  it('inner CaseCard article should have tabindex="0" when dragDropEnabled is false', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: false });
    host().querySelectorAll<HTMLElement>('mc-case-card article').forEach(el => {
      expect(el.getAttribute('tabindex')).toBe('0');
    });
  });

  it('card wrapper should carry aria-label when dragDropEnabled is true', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const wraps = host().querySelectorAll('.kanban__card-wrap');
    expect(wraps.length).toBeGreaterThan(0);
    wraps.forEach(w => expect(w.getAttribute('aria-label')).toBeTruthy());
  });

  // ── Keyboard accessibility — move mode ────────────────────────────────────

  it('Space activates move mode for the focused card', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const card = comp().columns()[0].cards[0];

    comp().onCardKeydown(fakeKeydown(' '), card, 'A');
    fixture.detectChanges();

    expect(comp().keyboardMoveCard()?.row).toBe(card.row);
    expect(comp().keyboardMoveSourceKey()).toBe('A');
    expect(comp().keyboardMoveTargetKey()).toBe('A');
    expect(comp().liveMessage()).toContain('Mode déplacement activé');
  });

  it('Space does nothing when dragDropEnabled is false', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: false });
    const card = comp().columns()[0].cards[0];

    comp().onCardKeydown(fakeKeydown(' '), card, 'A');

    expect(comp().keyboardMoveCard()).toBeNull();
  });

  it('Enter when not in move mode emits cardSelected', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let selected: CaseData | undefined;
    fixture.componentInstance.cardSelected.subscribe((d: CaseData) => (selected = d));

    const card = comp().columns()[0].cards[0];
    comp().onCardKeydown(fakeKeydown('Enter'), card, 'A');

    expect(selected).toBeDefined();
    expect(selected?.debtorName).toBe('Alice');
  });

  it('ArrowRight moves target to next column during move mode', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const card = comp().columns()[0].cards[0];

    comp().onCardKeydown(fakeKeydown(' '), card, 'A');    // start move from A
    comp().onCardKeydown(fakeKeydown('ArrowRight'), card, 'A');
    fixture.detectChanges();

    expect(comp().keyboardMoveTargetKey()).toBe('B');
    expect(comp().liveMessage()).toContain('Groupe B');
  });

  it('ArrowLeft moves target to previous column during move mode', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const cardB = comp().columns()[1].cards[0]; // Charlie in B

    comp().onCardKeydown(fakeKeydown(' '), cardB, 'B');   // start move from B
    comp().onCardKeydown(fakeKeydown('ArrowLeft'), cardB, 'B');
    fixture.detectChanges();

    expect(comp().keyboardMoveTargetKey()).toBe('A');
    expect(comp().liveMessage()).toContain('Groupe A');
  });

  it('ArrowRight does nothing at the last column', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const cardB = comp().columns()[1].cards[0];

    comp().onCardKeydown(fakeKeydown(' '), cardB, 'B');
    comp().onCardKeydown(fakeKeydown('ArrowRight'), cardB, 'B'); // already at last column
    fixture.detectChanges();

    expect(comp().keyboardMoveTargetKey()).toBe('B'); // unchanged
  });

  it('Enter in move mode emits rowMoved and clears state', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    const card = comp().columns()[0].cards[0];
    comp().onCardKeydown(fakeKeydown(' '), card, 'A');        // start move
    comp().onCardKeydown(fakeKeydown('ArrowRight'), card, 'A'); // move to B
    comp().onCardKeydown(fakeKeydown('Enter'), card, 'A');    // confirm
    fixture.detectChanges();

    expect(moved?.fromGroup).toBe('A');
    expect(moved?.toGroup).toBe('B');
    expect(moved?.row).toBe(card.row);
    expect(comp().keyboardMoveCard()).toBeNull();
    expect(comp().liveMessage()).toContain('déplacé vers');
  });

  it('Space in move mode also confirms move', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    const card = comp().columns()[0].cards[0];
    comp().onCardKeydown(fakeKeydown(' '), card, 'A');
    comp().onCardKeydown(fakeKeydown('ArrowRight'), card, 'A');
    comp().onCardKeydown(fakeKeydown(' '), card, 'A');         // confirm with Space

    expect(moved?.fromGroup).toBe('A');
    expect(moved?.toGroup).toBe('B');
  });

  it('Enter/confirm on same column does not emit rowMoved', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    const card = comp().columns()[0].cards[0];
    comp().onCardKeydown(fakeKeydown(' '), card, 'A'); // start
    comp().onCardKeydown(fakeKeydown('Enter'), card, 'A'); // confirm without moving

    expect(moved).toBeUndefined();
    expect(comp().keyboardMoveCard()).toBeNull();
  });

  it('Escape (via HostListener) cancels move mode without emitting rowMoved', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    const card = comp().columns()[0].cards[0];
    comp().onCardKeydown(fakeKeydown(' '), card, 'A');
    comp().onCardKeydown(fakeKeydown('ArrowRight'), card, 'A');

    // Simulate Escape via HostListener
    comp().onKeyboardMoveEscape();
    fixture.detectChanges();

    expect(moved).toBeUndefined();
    expect(comp().keyboardMoveCard()).toBeNull();
    expect(comp().liveMessage()).toContain('annulé');
  });

  it('Escape does nothing when no move is active', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    let moved: RowMovedEvent | undefined;
    fixture.componentInstance.rowMoved.subscribe((e: RowMovedEvent) => (moved = e));

    comp().onKeyboardMoveEscape(); // no active move

    expect(moved).toBeUndefined();
    expect(comp().keyboardMoveCard()).toBeNull();
  });

  it('cardAriaLabel includes move-mode context when card is being moved', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const card = comp().columns()[0].cards[0];

    comp().onCardKeydown(fakeKeydown(' '), card, 'A');
    comp().onCardKeydown(fakeKeydown('ArrowRight'), card, 'A');
    fixture.detectChanges();

    const label: string = comp().cardAriaLabel(card);
    expect(label).toContain('en cours de déplacement vers');
    expect(label).toContain('Groupe B');
  });

  it('isKeyboardTarget returns true only for the target column', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const card = comp().columns()[0].cards[0];

    comp().onCardKeydown(fakeKeydown(' '), card, 'A');
    comp().onCardKeydown(fakeKeydown('ArrowRight'), card, 'A');
    fixture.detectChanges();

    expect(comp().isKeyboardTarget('A')).toBe(false);
    expect(comp().isKeyboardTarget('B')).toBe(true);
  });

  it('keyboard target column gets --keyboard-target CSS class', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const card = comp().columns()[0].cards[0];

    comp().onCardKeydown(fakeKeydown(' '), card, 'A');
    comp().onCardKeydown(fakeKeydown('ArrowRight'), card, 'A');
    fixture.detectChanges();

    const cols = host().querySelectorAll('.kanban__column');
    expect(cols[0].classList.contains('kanban__column--keyboard-target')).toBe(false);
    expect(cols[1].classList.contains('kanban__column--keyboard-target')).toBe(true);
  });

  it('moving card gets --moving CSS class', () => {
    createComponent({ groupBy: 'group', groupDefs: GROUP_DEFS, dragDropEnabled: true });
    const card = comp().columns()[0].cards[0];

    comp().onCardKeydown(fakeKeydown(' '), card, 'A');
    fixture.detectChanges();

    const wraps = host().querySelectorAll('.kanban__card-wrap');
    expect(wraps[0].classList.contains('kanban__card-wrap--moving')).toBe(true);
    expect(wraps[1].classList.contains('kanban__card-wrap--moving')).toBe(false);
  });
});
