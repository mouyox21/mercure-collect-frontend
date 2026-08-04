export type SortDir = 'asc' | 'desc';

export interface SortState {
  readonly column: string;
  readonly dir: SortDir;
}

export interface PageEvent {
  readonly pageIndex: number;
  readonly pageSize: number;
}

export type GridRow = Record<string, unknown>;

export interface ColumnDef {
  readonly key: string;
  readonly label: string;
  readonly sortable?: boolean;
  readonly visible?: boolean;
  readonly align?: 'left' | 'center' | 'right';
  readonly isAmount?: boolean;
  readonly width?: string;
  readonly cellFn?: (row: GridRow) => string;
}

export interface GroupDef {
  readonly key: string;
  readonly label: string;
}

export interface RenderedGroup {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly totalAmount: number | undefined;
  readonly rows: GridRow[];
  readonly collapsed: boolean;
}
