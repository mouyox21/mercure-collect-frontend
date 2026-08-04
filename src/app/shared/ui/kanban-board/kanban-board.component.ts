import { Component, computed, input, output, signal } from '@angular/core';
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

  protected readonly collapsedColumns = signal<Set<string>>(new Set());
  protected readonly dragRow          = signal<GridRow | null>(null);
  protected readonly dragSourceKey    = signal<string | null>(null);
  protected readonly dragOverKey      = signal<string | null>(null);

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

  protected toggleColumn(key: string): void {
    this.collapsedColumns.update(s => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

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
