import { Component, HostListener, computed, input, output, signal } from '@angular/core';
import { CaseCardComponent } from '../case-card/case-card.component';
import { CaseData } from '../ui.types';
import { GridRow, GroupDef } from '../data-grid/data-grid.types';
import { KanbanCard, KanbanColumn, RowMovedEvent } from './kanban-board.types';

@Component({
  selector: 'mc-kanban-board',
  standalone: true,
  imports: [CaseCardComponent],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss',
})
export class KanbanBoardComponent {
  readonly rows            = input.required<GridRow[]>();
  readonly groupBy         = input<string | null>(null);
  readonly groupDefs       = input<GroupDef[]>([]);
  readonly amountField     = input<string | undefined>(undefined);
  readonly rowToCase       = input.required<(row: GridRow) => CaseData>();
  readonly dragDropEnabled = input<boolean>(false);

  readonly cardSelected = output<CaseData>();
  readonly rowMoved     = output<RowMovedEvent>();

  // Mouse DnD state
  protected readonly collapsedColumns = signal<Set<string>>(new Set());
  protected readonly dragRow          = signal<GridRow | null>(null);
  protected readonly dragSourceKey    = signal<string | null>(null);
  protected readonly dragOverKey      = signal<string | null>(null);

  // Keyboard DnD state
  protected readonly keyboardMoveCard      = signal<KanbanCard | null>(null);
  protected readonly keyboardMoveSourceKey = signal<string | null>(null);
  protected readonly keyboardMoveTargetKey = signal<string | null>(null);
  protected readonly liveMessage           = signal<string>('');

  protected readonly columns = computed<KanbanColumn[]>(() => {
    const rows        = this.rows();
    const groupBy     = this.groupBy();
    const groupDefs   = this.groupDefs();
    const amountField = this.amountField();
    const collapsed   = this.collapsedColumns();
    const toCase      = this.rowToCase();

    const makeCards = (rs: GridRow[]): KanbanCard[] =>
      rs.map(r => ({ row: r, caseData: toCase(r) }));

    if (!groupBy) {
      return [{
        key: '__default__',
        label: 'Dossiers',
        cards: makeCards(rows),
        collapsed: collapsed.has('__default__'),
        totalAmount: amountField ? this.sumAmount(rows, amountField) : undefined,
      }];
    }

    const buckets = new Map<string, GridRow[]>();
    for (const def of groupDefs) buckets.set(def.key, []);
    for (const row of rows) {
      const key = String(row[groupBy] ?? '');
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(row);
    }

    const result: KanbanColumn[] = [];
    for (const def of groupDefs) {
      const colRows = buckets.get(def.key) ?? [];
      result.push({
        key: def.key,
        label: def.label,
        cards: makeCards(colRows),
        collapsed: collapsed.has(def.key),
        totalAmount: amountField ? this.sumAmount(colRows, amountField) : undefined,
      });
    }
    for (const [key, colRows] of buckets) {
      if (groupDefs.some(d => d.key === key)) continue;
      if (colRows.length === 0) continue;
      result.push({
        key,
        label: key,
        cards: makeCards(colRows),
        collapsed: collapsed.has(key),
        totalAmount: amountField ? this.sumAmount(colRows, amountField) : undefined,
      });
    }
    return result;
  });

  // ── Column collapse ─────────────────────────────────────────────────────────

  protected toggleColumn(key: string): void {
    this.collapsedColumns.update(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  // ── Mouse DnD ───────────────────────────────────────────────────────────────

  protected onDragStart(event: DragEvent, row: GridRow, groupKey: string): void {
    if (!this.dragDropEnabled()) return;
    this.dragRow.set(row);
    this.dragSourceKey.set(groupKey);
    event.dataTransfer?.setData('text/plain', String(row['id'] ?? ''));
  }

  protected onDragOver(event: DragEvent, groupKey: string): void {
    if (!this.dragDropEnabled()) return;
    event.preventDefault();
    this.dragOverKey.set(groupKey);
  }

  protected onDragLeave(groupKey: string): void {
    if (this.dragOverKey() === groupKey) this.dragOverKey.set(null);
  }

  protected onDrop(event: DragEvent, groupKey: string): void {
    if (!this.dragDropEnabled()) return;
    event.preventDefault();
    const row  = this.dragRow();
    const from = this.dragSourceKey();
    if (row && from && from !== groupKey) {
      this.rowMoved.emit({ row, fromGroup: from, toGroup: groupKey });
    }
    this.dragRow.set(null);
    this.dragSourceKey.set(null);
    this.dragOverKey.set(null);
  }

  protected onDragEnd(): void {
    this.dragRow.set(null);
    this.dragSourceKey.set(null);
    this.dragOverKey.set(null);
  }

  // ── Keyboard DnD ────────────────────────────────────────────────────────────

  /**
   * Escape anywhere in the board cancels an in-progress keyboard move.
   * Handled at host level so the user need not Tab back to the grabbed card.
   */
  @HostListener('keydown.escape')
  protected onKeyboardMoveEscape(): void {
    const card = this.keyboardMoveCard();
    if (!card) return;
    const srcLabel = this.getColumnLabel(this.keyboardMoveSourceKey()!);
    this.liveMessage.set(
      `Déplacement annulé. ${card.caseData.debtorName} reste dans ${srcLabel}.`
    );
    this.clearKeyboardMove();
  }

  protected onCardKeydown(event: KeyboardEvent, card: KanbanCard, colKey: string): void {
    if (!this.dragDropEnabled()) return;

    const isThisMoving  = this.keyboardMoveCard()?.row === card.row;
    const anyMoving     = this.keyboardMoveCard() !== null;

    switch (event.key) {
      case ' ':
        event.preventDefault();
        if (isThisMoving) {
          this.confirmKeyboardMove(card);
        } else if (!anyMoving) {
          this.startKeyboardMove(card, colKey);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (isThisMoving) {
          this.confirmKeyboardMove(card);
        } else if (!anyMoving) {
          // Open card detail (equivalent to mouse click) when not in move mode
          this.cardSelected.emit(card.caseData);
        }
        break;

      case 'ArrowLeft':
        if (isThisMoving) {
          event.preventDefault();
          this.shiftKeyboardTarget(card, -1);
        }
        break;

      case 'ArrowRight':
        if (isThisMoving) {
          event.preventDefault();
          this.shiftKeyboardTarget(card, 1);
        }
        break;
    }
  }

  // ── Keyboard DnD helpers ────────────────────────────────────────────────────

  private startKeyboardMove(card: KanbanCard, colKey: string): void {
    this.keyboardMoveCard.set(card);
    this.keyboardMoveSourceKey.set(colKey);
    this.keyboardMoveTargetKey.set(colKey);
    const label = this.getColumnLabel(colKey);
    this.liveMessage.set(
      `Mode déplacement activé pour ${card.caseData.debtorName}. ` +
      `Colonne : ${label}. ` +
      `Utilisez les flèches gauche/droite pour changer de colonne, ` +
      `Entrée ou Espace pour déposer, Échap pour annuler.`
    );
  }

  private confirmKeyboardMove(card: KanbanCard): void {
    const from = this.keyboardMoveSourceKey()!;
    const to   = this.keyboardMoveTargetKey()!;
    if (from !== to) {
      this.rowMoved.emit({ row: card.row, fromGroup: from, toGroup: to });
      this.liveMessage.set(
        `${card.caseData.debtorName} déplacé vers ${this.getColumnLabel(to)}.`
      );
    } else {
      this.liveMessage.set(`Déplacement annulé — dossier déjà dans cette colonne.`);
    }
    this.clearKeyboardMove();
  }

  private shiftKeyboardTarget(card: KanbanCard, direction: -1 | 1): void {
    const cols       = this.columns();
    const currentKey = this.keyboardMoveTargetKey()!;
    const currentIdx = cols.findIndex(c => c.key === currentKey);
    const nextIdx    = currentIdx + direction;
    if (nextIdx >= 0 && nextIdx < cols.length) {
      const nextCol = cols[nextIdx];
      this.keyboardMoveTargetKey.set(nextCol.key);
      this.liveMessage.set(`${card.caseData.debtorName} — ${nextCol.label}.`);
    }
  }

  private getColumnLabel(key: string): string {
    return this.columns().find(c => c.key === key)?.label ?? key;
  }

  private clearKeyboardMove(): void {
    this.keyboardMoveCard.set(null);
    this.keyboardMoveSourceKey.set(null);
    this.keyboardMoveTargetKey.set(null);
  }

  // ── ARIA helpers ────────────────────────────────────────────────────────────

  protected isCardMoving(card: KanbanCard): boolean {
    return this.keyboardMoveCard()?.row === card.row;
  }

  protected isKeyboardTarget(colKey: string): boolean {
    return this.keyboardMoveCard() !== null && this.keyboardMoveTargetKey() === colKey;
  }

  protected cardAriaLabel(card: KanbanCard): string {
    const c      = card.caseData;
    const amount = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c.amount);
    const days   = `${c.daysOverdue} jour${c.daysOverdue > 1 ? 's' : ''} de retard`;
    const base   = `Dossier ${c.debtorName}, ${amount}, ${days}, statut ${c.status}`;
    if (this.isCardMoving(card)) {
      const targetLabel = this.getColumnLabel(this.keyboardMoveTargetKey()!);
      return `${base} — en cours de déplacement vers ${targetLabel}`;
    }
    return base;
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  protected trackCard(index: number, card: KanbanCard): string {
    return String(card.row['id'] ?? index);
  }

  protected formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  private sumAmount(rows: GridRow[], field: string): number {
    return rows.reduce((acc, row) => {
      const val = row[field];
      return acc + (typeof val === 'number' ? val : 0);
    }, 0);
  }
}
