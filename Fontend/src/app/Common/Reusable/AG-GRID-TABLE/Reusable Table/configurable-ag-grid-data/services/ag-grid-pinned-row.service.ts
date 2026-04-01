import { Injectable } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { TableColumn, TableRowData } from '../../../../reusable-table/reusable-table.component';

export interface PinnedRowData {
  data: Record<string, unknown>[];
  hash: string;
}

/**
 * Service for calculating and managing pinned bottom row data
 * Handles sum calculations for amount columns with memoization
 */
@Injectable({ providedIn: 'root' })
export class AgGridPinnedRowService {
  private readonly cache = new Map<string, PinnedRowData>();

  /**
   * Calculate pinned bottom row data with sums for amount columns
   */
  calculatePinnedRowData<T extends TableRowData>(
    gridApi: GridApi,
    columns: readonly TableColumn<T>[],
    allLoadedData: T[],
    totalRowCount: number,
    columnsHash: string,
    apiEndpoint?: string
  ): PinnedRowData {
    const filterModel = gridApi.getFilterModel();
    const hasActiveFilters = filterModel && Object.keys(filterModel).length > 0;

    // Get rows to calculate from
    const allRows = this.getRowsForCalculation<T>(gridApi, allLoadedData, hasActiveFilters);

    if (allRows.length === 0) {
      return { data: [], hash: '' };
    }

    // Calculate totals
    const totalsRow = this.calculateTotals(allRows, columns, totalRowCount);
    const pinnedData: PinnedRowData = {
      data: [totalsRow],
      hash: `${allRows.length}:${totalRowCount}:${columnsHash}`
    };

    return pinnedData;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get rows for calculation (filtered or all)
   */
  private getRowsForCalculation<T extends TableRowData>(
    gridApi: GridApi,
    allLoadedData: T[],
    hasActiveFilters: boolean
  ): T[] {
    if (hasActiveFilters) {
      // When filters are active, use currently visible nodes
      const filteredRows: T[] = [];
      gridApi.forEachNodeAfterFilter((node) => {
        if (node.data && !node.rowPinned) {
          filteredRows.push(node.data as T);
        }
      });
      return filteredRows;
    }

    // When no filters, use all loaded data
    if (allLoadedData.length > 0) {
      return [...allLoadedData];
    }

    // Fallback: get all nodes from grid
    const allRows: T[] = [];
    gridApi.forEachNode((node) => {
      if (node.data && !node.rowPinned) {
        allRows.push(node.data as T);
      }
    });
    return allRows;
  }

  /**
   * Calculate totals for all amount columns
   */
  private calculateTotals<T extends TableRowData>(
    allRows: T[],
    columns: readonly TableColumn<T>[],
    totalCount: number
  ): Record<string, unknown> {
    const totalsRow: Record<string, unknown> = {};
    const amountColumns: string[] = [];
    let actionsColumnKey: string | undefined;
    let indexColumnKey: string | undefined;

    // Pre-process columns
    for (const col of columns) {
      if (col.type === 'index' || col.key === 'serialNo') {
        indexColumnKey = col.key;
        totalsRow[col.key] = '';
        continue;
      }
      if (col.type === 'actions') {
        actionsColumnKey = col.key;
        continue;
      }
      if (col.isAmount) {
        amountColumns.push(col.key);
      }
    }

    // Calculate sums for amount columns
    if (amountColumns.length > 0) {
      const sums = new Map<string, number>();
      amountColumns.forEach(key => sums.set(key, 0));

      for (const row of allRows) {
        if (!row) continue; // Skip placeholder rows
        for (const key of amountColumns) {
          const rawValue = row[key];
          const numValue = this.parseNumericValue(rawValue);
          if (numValue !== null) {
            const currentSum = sums.get(key) ?? 0;
            sums.set(key, currentSum + numValue);
          }
        }
      }

      amountColumns.forEach(key => {
        totalsRow[key] = sums.get(key) ?? 0;
      });
    }

    // Set total count metadata (hidden from display in serialNo column)
    totalsRow['totalCount'] = totalCount;
    totalsRow['count'] = totalCount;

    // Ensure metadata fields exist without overwriting the label
    if (!totalsRow['checkbox']) totalsRow['checkbox'] = '';

    return totalsRow;
  }

  /**
   * Parse numeric value from formatted string or number
   */
  private parseNumericValue(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }

    const strValue = String(value).trim();
    if (strValue === '' || strValue === '-') {
      return null;
    }

    // Optimize for simple numeric strings
    if (/^-?\d+(\.\d+)?$/.test(strValue)) {
      const numValue = parseFloat(strValue);
      return isNaN(numValue) ? null : numValue;
    }

    // For formatted strings, clean and parse
    const cleanedValue = strValue
      .replace(/[₹$€£¥₨₩₦₽₪₫₭₮₯₰₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿]/g, '')
      .replace(/,/g, '')
      .replace(/\s+/g, '')
      .replace(/[^\d.-]/g, '');

    const numValue = parseFloat(cleanedValue);
    return isNaN(numValue) ? null : numValue;
  }
}
