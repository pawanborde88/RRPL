import { Injectable, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GridApi, ColDef, ColGroupDef, ITooltipParams, SuppressKeyboardEventParams } from 'ag-grid-community';
import { TableColumn, TableRowData, ActionButton } from '../../../../reusable-table/reusable-table.component';
import { ActionCellRendererComponent } from '../cell-renderers/action-cell-renderer.component';
import { SensitiveCellRendererComponent } from '../cell-renderers/sensitive-cell-renderer.component';
import { PhotoCellRendererComponent } from '../cell-renderers/photo-cell-renderer.component';
import { ClickableCellRendererComponent } from '../cell-renderers/clickable-cell-renderer.component';

/**
 * Service for AG-Grid column configuration
 * Provides memoized column definitions, formatters, and renderers
 * Optimized for Angular 17+ with proper dependency injection
 */
/** Matches reusable-table `truncate` pipe limit (see reusable-table.component.html). */
const TRUNCATE_DISPLAY_LENGTH = 35;

@Injectable({ providedIn: 'root' })
export class AgGridColumnService {
  private datePipe: DatePipe = new DatePipe('en-US');
  // Memoized formatters (singleton instances)
  private readonly amountFormatter = new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Caches for performance using WeakMap for automatic garbage collection
  private readonly filterTypeCache = new WeakMap<TableColumn<any>, string | boolean>();
  private readonly filterParamsCache = new WeakMap<TableColumn<any>, any>();
  private readonly valueFormatterCache = new WeakMap<TableColumn<any>, (params: any) => string>();

  /**
   * Determine the appropriate filter type for a column
   */
  getFilterType<T extends TableRowData>(col: TableColumn<T>): string | boolean {
    if (this.filterTypeCache.has(col)) {
      return this.filterTypeCache.get(col)!;
    }

    const filterType = this.calculateFilterType(col);
    this.filterTypeCache.set(col, filterType);
    return filterType;
  }

  private calculateFilterType<T extends TableRowData>(col: TableColumn<T>): string | boolean {
    if (col.type === 'actions' || col.type === 'index' || col.key === 'serialNo') {
      return false;
    }

    if (col.type === 'date' || col.type === 'short_date' || col.type === 'mediumDate' || col.isDate) {
      return 'agDateColumnFilter';
    }

    return this.isNumericField(col) ? 'agNumberColumnFilter' : 'agTextColumnFilter';
  }

  private isNumericField<T extends TableRowData>(col: TableColumn<T>): boolean {
    const keyLower = col.key.toLowerCase();
    return keyLower.includes('id') ||
      keyLower.includes('count') ||
      keyLower.includes('number') ||
      keyLower.includes('num') ||
      keyLower.includes('amount') ||
      keyLower.includes('price') ||
      keyLower.includes('cost') ||
      keyLower.includes('rate') ||
      !!col.isAmount ||
      !!col.showAverage ||
      !!col.isPercentage ||
      col.editType === 'number';
  }

  /**
   * Get filter parameters for a column
   */
  getFilterParams<T extends TableRowData>(col: TableColumn<T>): Record<string, unknown> | undefined {
    if (this.filterParamsCache.has(col)) {
      return this.filterParamsCache.get(col);
    }

    const isNumeric = this.isNumericField(col);
    const isDate = col.type === 'date' || col.type === 'short_date' || col.type === 'mediumDate' || !!col.isDate;
    const params: Record<string, unknown> = {};

    if (isDate) {
      params['buttons'] = ['apply', 'reset'];
      params['suppressAndOrCondition'] = true;
      params['comparator'] = (filterLocalDateAtMidnight: Date, cellValue: any) => {
        if (cellValue == null) return -1;

        let cellDate: Date;
        if (cellValue instanceof Date) {
          cellDate = cellValue;
        } else {
          // Handle string dates (ISO or similar)
          cellDate = new Date(cellValue);
        }

        if (isNaN(cellDate.getTime())) {
          return -1; // invalid date is smaller
        }

        // Compare dates (ignoring time)
        const cellDateOnly = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
        const filterDateOnly = new Date(filterLocalDateAtMidnight.getFullYear(), filterLocalDateAtMidnight.getMonth(), filterLocalDateAtMidnight.getDate());

        if (cellDateOnly.getTime() === filterDateOnly.getTime()) {
          return 0;
        }
        if (cellDateOnly < filterDateOnly) {
          return -1;
        }
        if (cellDateOnly > filterDateOnly) {
          return 1;
        }
        return 0;
      };
    } else if (isNumeric) {
      params['debounceMs'] = 300;
      params['defaultOption'] = 'equals';
      params['suppressAndOrCondition'] = true;
      params['filterOptions'] = ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual', 'inRange'];
      params['numberParser'] = (text: string | null) => {
        return text == null ? null : parseFloat(text.replace(/,/g, ''));
      };
    } else {
      // Text filter configuration
      params['debounceMs'] = 300;
      params['defaultOption'] = 'contains';
      params['caseSensitive'] = false;
      params['suppressAndOrCondition'] = true;
      params['filterOptions'] = ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'];
      params['applyButton'] = false;
      params['clearButton'] = true;
      params['inRangeInclusive'] = false;
    }

    const result = Object.keys(params).length > 0 ? params : undefined;
    this.filterParamsCache.set(col, result);
    return result;
  }

  /**
   * Get value formatter for a column
   */
  getValueFormatter<T extends TableRowData>(col: TableColumn<T>): ((params: { value: unknown }) => string) | undefined {
    if (this.valueFormatterCache.has(col)) {
      return this.valueFormatterCache.get(col);
    }

    let formatter: ((params: { value: unknown }) => string) | undefined;

    if (col.isAmount) {
      formatter = (params: { value: unknown }) => {
        if (typeof params.value === 'string' && params.value.toLowerCase().startsWith('total')) {
          return params.value;
        }
        const value = (params.value as number) || 0;
        return this.amountFormatter.format(value);
      };
    } else if (col.type === 'mediumDate') {
      formatter = (params: { value: unknown }) => this.formatMediumDateValue(params.value);
    } else if (col.type === 'date' || col.type === 'short_date' || col.isDate) {
      formatter = (params: { value: unknown }) => this.formatDateValue(params.value);
    } else if (col.type === 'truncate') {
      formatter = (params: { value: unknown }) => this.formatTruncateDisplay(params.value);
    }

    if (formatter) {
      this.valueFormatterCache.set(col, formatter);
    }

    return formatter;
  }

  private formatDateValue(value: unknown): string {
    if (!value || value === null || value === undefined) {
      return '';
    }

    try {
      let date: Date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
      } else {
        return String(value);
      }

      if (isNaN(date.getTime())) {
        return String(value);
      }

      const formatted = this.datePipe.transform(date, 'medium');
      return formatted || '';
    } catch {
      return String(value);
    }
  }

  private formatTruncateDisplay(value: unknown): string {
    if (value == null || value === '') {
      return '';
    }
    const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return s.length > TRUNCATE_DISPLAY_LENGTH
      ? s.substring(0, TRUNCATE_DISPLAY_LENGTH) + '...'
      : s;
  }

  private truncateTooltipFullText(value: unknown): string {
    if (value == null || value === '') {
      return '';
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  private formatMediumDateValue(value: unknown): string {
    if (!value || value === null || value === undefined) {
      return '';
    }

    try {
      let date: Date;
      if (value instanceof Date) {
        date = value;
      } else if (typeof value === 'string' || typeof value === 'number') {
        date = new Date(value);
      } else {
        return String(value);
      }

      if (isNaN(date.getTime())) {
        return String(value);
      }

      // Format as "02 Dec 2026" (dd MMM yyyy)
      const formatted = this.datePipe.transform(date, 'dd MMM yyyy');
      return formatted || '';
    } catch {
      return String(value);
    }
  }

  /**
   * Format amount value
   */
  formatAmount(value: number): string {
    return this.amountFormatter.format(value);
  }

  /**
   * Get cell renderer component for a column
   */
  getCellRenderer<T extends TableRowData>(col: TableColumn<T>): any {
    if (col.type === 'actions') {
      return ActionCellRendererComponent;
    } else if (col.type === 'photo') {
      return PhotoCellRendererComponent;
    } else if (col.type === 'sensitive') {
      return SensitiveCellRendererComponent;
    } else if (col.clickable === true) {
      return ClickableCellRendererComponent;
    }
    return undefined;
  }

  /**
   * Get cell style for a column
   */
  getCellStyle<T extends TableRowData>(col: TableColumn<T>): Record<string, string> | ((params: unknown) => Record<string, string>) | undefined {
    // If column has a custom cellStyle function, use it directly
    const customStyle = (col as { cellStyle?: (params: unknown) => Record<string, string> }).cellStyle;
    if (customStyle && typeof customStyle === 'function') {
      return customStyle;
    }

    // Otherwise, build style object
    if (col.isAmount) {
      return { fontWeight: 'bold' };
    }

    return undefined;
  }

  /**
   * Create column definition from table column
   */
  createColumnDef<T extends TableRowData>(
    col: TableColumn<T>,
    actions: readonly ActionButton<T>[] | ActionButton<T>[] = [],
    onActionClick?: (event: { action: string; row: T }) => void,
    allowCheckbox: boolean = false,
    roleId: number = 0
  ): ColDef | ColGroupDef {
    // Role-based visibility check
    if (col.onlyRoles && col.onlyRoles.length > 0) {
      if (!col.onlyRoles.includes(roleId)) {
        return { hide: true } as ColDef; // Hide column if role doesn't match
      }
    }
    // Handle Column Groups
    if (col.children && col.children.length > 0) {
      return {
        headerName: col.label,
        headerClass: `ag-header-group-center ${col.headerClass || ''}`.trim(), // Append custom class
        children: col.children.map(child => this.createColumnDef(child, actions, onActionClick, allowCheckbox, roleId)),
        groupId: col.key, // Optional: useful for API manipulation
      } as ColGroupDef;
    }

    // Handle Single Columns
    const filterType = this.getFilterType(col);
    const filterParams = this.getFilterParams(col);
    const cellRenderer = this.getCellRenderer(col);
    const baseCellStyle = this.getCellStyle(col);
    const valueFormatter = this.getValueFormatter(col);

    const colDef: ColDef = {
      field: col.key,
      headerName: col.label,
      minWidth: col.minWidth || 100,
      maxWidth: 500,
      pinned: (col.type === 'actions' || col.sticky) ? 'left' : undefined,
      cellRenderer: cellRenderer,
      cellRendererParams: this.getCellRendererParams(col, actions, onActionClick),
      cellStyle: this.applyAlignment(baseCellStyle, col),
      valueFormatter: valueFormatter,
      filter: filterType,
      filterParams: filterParams,
      floatingFilterComponentParams: filterType !== false ? { debounceMs: 700 } : undefined,
      sortable: col.type !== 'actions' && col.type !== 'index',
      checkboxSelection: allowCheckbox && col.key === '__checkbox__',
      headerCheckboxSelection: allowCheckbox && col.key === '__checkbox__',
      cellClass: col.cellClass, // Apply custom cell class
      headerClass: col.headerClass // Apply custom header class
    };

    // Strict type handling for Amount and Date columns to ensure Filters and Sorting work correctly
    if (col.isAmount || ['amount', 'price', 'cost', 'rate'].some(k => col.key.toLowerCase().includes(k))) {
      colDef.valueGetter = (params) => {
        const val = this.getDeepValue(params.data, col.key);
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          if (val.startsWith('Total')) return val;
          // Remove commas and process
          const cleaned = val.replace(/,/g, '');
          const num = Number(cleaned);
          return isNaN(num) ? null : num;
        }
        return null;
      };
    } else if (col.type === 'date' || col.type === 'mediumDate' || col.isDate) {
      colDef.valueGetter = (params) => {
        const val = this.getDeepValue(params.data, col.key);
        if (!val) return null;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };
    }

    // Fixed width for sensitive columns
    if (col.type === 'sensitive') {
      colDef.width = 100;
      colDef.minWidth = 100;
      colDef.maxWidth = 100;
      colDef.resizable = false;
    }

    // Adjusted width for photo columns
    if (col.type === 'photo') {
      colDef.width = 90;
      colDef.minWidth = 90;
      colDef.maxWidth = 90;
      colDef.autoHeight = false; // Prevent row expansion based on image size
    }

    // Lock position for action columns
    if (col.type === 'actions') {
      colDef.lockPosition = true;
    }

    // Explicit `type: 'index'` columns (e.g. S.No after Actions): row number from grid, not row data
    if (col.type === 'index') {
      colDef.field = undefined;
      colDef.colId = col.key || 'serialNo';
      colDef.valueGetter = (params: any) =>
        params.node?.rowPinned || params.data?.['__isPlaceholder'] ? '' : (params.node?.rowIndex ?? 0) + 1;
      colDef.width = 70;
      colDef.minWidth = 70;
      colDef.maxWidth = 70;
      colDef.pinned = 'left';
      colDef.resizable = false;
      colDef.suppressHeaderMenuButton = true;
      colDef.cellStyle = { justifyContent: 'center', display: 'flex' };
      colDef.headerClass = `${colDef.headerClass || ''} ag-center-aligned-header`.trim();
    }

    // Truncate: short cell text + full value via AG Grid tooltip (TooltipModule registered on the grid)
    if (col.type === 'truncate') {
      colDef.tooltipValueGetter = (params: ITooltipParams<T, unknown>) => {
        const full = this.truncateTooltipFullText(params.value);
        return full.length > TRUNCATE_DISPLAY_LENGTH ? full : '';
      };
      const baseCellStyleForTruncate = colDef.cellStyle;
      colDef.cellStyle = (params) => {
        const base =
          typeof baseCellStyleForTruncate === 'function'
            ? (baseCellStyleForTruncate as (p: unknown) => Record<string, string>)(params)
            : baseCellStyleForTruncate || {};
        return {
          ...base,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        };
      };
    }

    // Apply alignment classes
    const alignmentClasses: string[] = [];
    if (col.headerClass) {
      alignmentClasses.push(col.headerClass);
    }

    if (col.alignRight || col.isAmount || col.showAverage) {
      alignmentClasses.push('ag-right-aligned-header');
    } else if (col.alignCenter) {
      alignmentClasses.push('ag-center-aligned-header');
    }

    if (alignmentClasses.length > 0) {
      colDef.headerClass = alignmentClasses.join(' ');
    }

    return colDef;
  }

  private getCellRendererParams<T extends TableRowData>(
    col: TableColumn<T>,
    actions: readonly ActionButton<T>[] | ActionButton<T>[],
    onActionClick?: (event: { action: string; row: T }) => void
  ): Record<string, unknown> | undefined {
    if (col.type === 'photo' || col.type === 'sensitive') {
      return { column: col };
    }
    if (col.type === 'actions') {
      return { actions, onActionClick };
    }
    if (col.clickable === true) {
      return { column: col };
    }
    return undefined;
  }

  private applyAlignment<T extends TableRowData>(
    cellStyle: Record<string, string> | ((params: unknown) => Record<string, string>) | undefined,
    col: TableColumn<T>
  ): Record<string, string> | ((params: unknown) => Record<string, string>) | undefined {
    const alignment = col.alignRight || col.isAmount || col.showAverage
      ? 'right'
      : col.alignCenter
        ? 'center'
        : undefined;

    if (!alignment) {
      return cellStyle;
    }

    if (typeof cellStyle === 'function') {
      return (params: unknown) => {
        const style = cellStyle(params);
        return { ...style, textAlign: alignment };
      };
    }

    return { ...(cellStyle || {}), textAlign: alignment };
  }

  private getDeepValue(data: any, path: string): any {
    if (!data || !path) return null;
    if (path.indexOf('.') === -1) return data[path];
    return path.split('.').reduce((o, key) => (o && o[key] != null) ? o[key] : null, data);
  }
}


