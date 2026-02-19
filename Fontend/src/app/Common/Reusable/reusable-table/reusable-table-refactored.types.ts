// ==================== STRICT TYPE DEFINITIONS ====================

/** Generic type for table row data - ensures type safety while maintaining flexibility */
export type TableRowData = Record<string, unknown> & {
  readonly id?: string | number;
  readonly [key: string]: unknown;
};

export type TableColumnType = 'photo' | 'sensitive' | 'attachment' | 'file' | 'date' | 'short_date' | 'truncate' | 'index' | 'actions' | string;
export type ColumnAlign = 'left' | 'center' | 'right';
export type EditType = 'text' | 'number' | 'select' | 'date';
export type ColorConditionResult = 'green' | 'red' | string;
export type ActionColor = 'primary' | 'accent' | 'warn';
export type EditAction = 'edit' | 'cancel' | 'save';

export interface TableColumn<T extends TableRowData = TableRowData> {
  readonly key: string;
  readonly label: string;
  readonly type?: TableColumnType;
  readonly sticky?: boolean;
  readonly disabled?: boolean;
  readonly isAmount?: boolean;
  readonly isDate?: boolean;
  readonly dateFormat?: string;
  readonly isPhone?: boolean;
  readonly isEmail?: boolean;
  applyChequeStatusColor?: boolean;
  readonly isPercentage?: boolean;
  readonly emptyValueDisplay?: string;
  readonly suffix?: string;
  readonly prefix?: string;
  readonly width?: string;
  readonly align?: ColumnAlign;
  readonly clickable?: boolean;
  readonly route?: (row: T) => readonly unknown[];
  readonly queryParams?: (row: T) => Readonly<Record<string, unknown>>;
  readonly editable?: boolean;
  readonly editType?: EditType | string;
  readonly editOptions?: readonly unknown[];
  readonly tooltip?: string;
  readonly alignCenter?: boolean;
  readonly alignRight?: boolean;
  readonly highlight?: boolean;
  readonly warningCondition?: (row: T) => boolean;
  readonly colorCondition?: (row: T) => ColorConditionResult;
  readonly minWidth?: number;
  readonly draggable?: boolean;
  readonly default?: string;
  readonly nullImage?: string;
  readonly onClick?: (row: T) => void;
  readonly state?: (row: T) => Readonly<Record<string, unknown>>;
  cellStyle?: (params: any) => any;
  readonly sortable?: boolean;
  readonly filter?: boolean;
  readonly resizable?: boolean;
}

export interface EditEvent<T extends TableRowData = TableRowData> {
  readonly action: EditAction;
  readonly row: T;
  readonly field?: string;
  readonly value?: unknown;
}

// Flexible ActionButton interface with strict typing
export interface ActionButton<T extends TableRowData = TableRowData> {
  readonly icon: string;
  readonly tooltip?: string;
  readonly action: string;
  readonly show?: boolean | ((row: T) => boolean) | (() => boolean);
  readonly color?: ActionColor | string;
  readonly disabled?: boolean | ((row: T) => boolean) | (() => boolean);
  readonly label?: string;
}

// HeaderButton type for header action buttons (different from row ActionButton)
export interface HeaderButton {
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly disabled?: () => boolean;
  readonly action: () => void;
  readonly show?: () => boolean;
  readonly tooltip?: string; // Optional for backward compatibility
}

export interface ActionEvent<T extends TableRowData = TableRowData> {
  readonly action: string;
  readonly row: T;
}

// ==================== SERVER-SIDE PAGINATION INTERFACES ====================

export interface CursorPaginationParams {
  readonly cursor?: string | null;
  readonly limit: number;
  readonly direction?: 'forward' | 'backward';
}

export interface ServerPaginationRequest {
  readonly offset?: number;
  readonly limit: number;
  readonly cursor?: string | null;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly filters?: Record<string, unknown>;
  readonly searchTerm?: string;
}

export interface ServerPaginationResponse<T extends TableRowData = TableRowData> {
  readonly data: readonly T[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly nextCursor?: string | null;
  readonly previousCursor?: string | null;
}

export interface TableDataFetchConfig {
  readonly endpoint: string;
  readonly method?: 'GET' | 'POST';
  readonly params?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly enableCursorPagination?: boolean;
  readonly prefetchBuffer?: number;
  readonly retryAttempts?: number;
  readonly retryDelay?: number;
}

// ==================== PERFORMANCE MONITORING INTERFACES ====================

export interface PerformanceMetrics {
  readonly renderTime: number;
  readonly dataLoadTime: number;
  readonly scrollFPS: number;
  readonly memoryUsage?: number;
  readonly domNodes?: number;
}

export interface PerformanceBudget {
  readonly maxRenderTime: number;
  readonly maxDataLoadTime: number;
  readonly minScrollFPS: number;
  readonly maxMemoryUsage?: number;
  readonly maxDomNodes?: number;
}

// ==================== TEST HOOKS INTERFACE ====================

export interface TableTestHooks<T extends TableRowData = TableRowData> {
  readonly getData: () => readonly T[];
  readonly getFilteredData: () => readonly T[];
  readonly getVisibleRange: () => Readonly<{ start: number; end: number }>;
  readonly getPerformanceMetrics: () => Readonly<PerformanceMetrics>;
  readonly triggerLoadMore: () => void;
  readonly resetFilters: () => void;
  readonly getSelectedItems: () => readonly T[];
  readonly getCurrentPage: () => number;
  readonly getPageSize: () => number;
}
