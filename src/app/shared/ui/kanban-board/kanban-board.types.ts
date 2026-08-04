import { CaseData } from '../ui.types';
import { GridRow } from '../data-grid/data-grid.types';

export interface KanbanCard {
  readonly row: GridRow;
  readonly caseData: CaseData;
}

export interface KanbanColumn {
  readonly key: string;
  readonly label: string;
  readonly cards: KanbanCard[];
  readonly collapsed: boolean;
  readonly totalAmount: number | undefined;
}

export interface RowMovedEvent {
  readonly row: GridRow;
  readonly fromGroup: string;
  readonly toGroup: string;
}
