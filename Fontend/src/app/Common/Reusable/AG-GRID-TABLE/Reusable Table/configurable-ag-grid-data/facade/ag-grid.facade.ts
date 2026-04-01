import { Injectable, inject, computed, NgZone } from '@angular/core';
import { GridReadyEvent, IGetRowsParams, IDatasource, GridApi } from 'ag-grid-community';
import { finalize, tap } from 'rxjs/operators';
import { AgGridStore } from '../store/ag-grid.store';
import { AgGridDataService } from '../services/ag-grid-data.service';
import { TableRowData } from '../../../../reusable-table/reusable-table.component';

/**
 * Facade pattern for AG-Grid operations.
 * Acts as the bridge between the Component (UI) and the Store (State) + Service (Data).
 */
@Injectable()
export class AgGridFacade<T extends TableRowData = TableRowData> {
  private readonly store = inject(AgGridStore<T>);
  private readonly dataService = inject(AgGridDataService);
  private readonly ngZone = inject(NgZone);

  // Read-only Signals from Store
  readonly gridApi = this.store.gridApi;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly totalRowCount = this.store.totalRowCount;
  readonly allLoadedData = this.store.allLoadedData;
  readonly pinnedBottomRowData = this.store.pinnedBottomRowData;
  readonly searchText = this.store.searchText;
  readonly basePayload = this.store.basePayload;
  readonly activeOverlay = this.store.activeOverlay;
  readonly selectedItems = this.store.selectedItems;
  readonly isSyncingSelection = this.store.isSyncingSelection;
  readonly selectedIds = this.store.selectedIds;
  readonly isSelectAll = this.store.isSelectAll;
  readonly isBulkOperation = this.store.isBulkOperation;
  readonly loadedPages = this.store.loadedPages;
  readonly fetchingPages = this.store.fetchingPages;
  readonly hasInitiatedLoad = this.store.hasInitiatedLoad;

  // Computed Signals
  readonly hasData = this.store.hasData;
  readonly isEmpty = this.store.isEmpty;
  readonly isGridReady = this.store.isGridReady;

  initializeGrid(event: GridReadyEvent): void {
    this.store.setGridApi(event.api);
  }

  /**
   * Fetches specific page data for Client-Side Row Model.
   * Deduplicates requests and avoids redundant loads.
   */
  loadPage(
    pageIndex: number,
    pageSize: number,
    endpoint: string,
    method: 'GET' | 'POST',
    idProperty: string,
    onSuccess?: () => void
  ): void {
    if (this.store.state().loadedPages.has(pageIndex)) {
      onSuccess?.();
      return;
    }

    if (this.store.state().fetchingPages.has(pageIndex)) {
      return;
    }

    const offset = pageIndex * pageSize;
    this.store.addFetchingPage(pageIndex);

    this.loadClientData(
      endpoint,
      method,
      idProperty,
      pageSize,
      () => {
        this.store.addLoadedPage(pageIndex);
        onSuccess?.();
      },
      { offset, limit: pageSize },
      () => {
        this.store.removeFetchingPage(pageIndex);
      }
    );
  }

  loadClientData(
    endpoint: string,
    method: 'GET' | 'POST',
    idProperty: string,
    limit: number,
    onDataLoaded?: (rowData: T[]) => void,
    overridePayload?: Record<string, unknown>,
    onFinalize?: () => void
  ): void {
    const basePayload = this.store.basePayload();
    const existingFilters = (basePayload['filters'] as any) || {};

    const payload = {
      ...basePayload,
      search: basePayload['search'] || this.store.searchText() || '',
      filters: Object.keys(existingFilters).length > 0 ? existingFilters : undefined,
      ...overridePayload
    };

    if (this.store.state().loadedPages.size === 0) {
      this.store.setLoading(true);
    }
    this.store.setError(null);

    this.dataService.fetchData(endpoint, method, payload)
      .pipe(
        finalize(() => {
          this.store.setLoading(false);
          onFinalize?.();
        })
      )
      .subscribe({
        next: (response) => {
          this.ngZone.runOutsideAngular(() => {
            const offset = (overridePayload?.['offset'] as number) || 0;
            const rowData = this.handleDataSuccess(response, idProperty, offset);
            if (onDataLoaded) {
              this.ngZone.run(() => onDataLoaded(rowData));
            }
          });
        },
        error: (error: any) => {
          this.store.setError(error?.message || 'Data loading failed');
          console.error('AgGridFacade: Data loading failed', error);
        }
      });
  }

  setLoading(loading: boolean): void {
    this.store.setLoading(loading);
  }

  setBasePayload(payload: Record<string, unknown>): void {
    this.store.setBasePayload(payload);
  }

  setActiveOverlay(overlay: string | undefined): void {
    this.store.setActiveOverlay(overlay);
  }

  setHasInitiatedLoad(value: boolean): void {
    this.store.setHasInitiatedLoad(value);
  }

  setPinnedBottomRowData(data: Record<string, unknown>[]): void {
    this.store.setPinnedBottomRowData(data);
  }

  refreshData(): void {
    this.store.resetDataState();
    const api = this.store.gridApi();
    if (api) {
      api.setGridOption('pinnedBottomRowData', []);
    }
  }

  updateSearchText(text: string): void {
    this.store.setSearchText(text);
    this.refreshData();
  }

  clearSearch(): void {
    this.updateSearchText('');
  }

  /**
   * Saves the current column state (order, width, visibility, sort) to localStorage.
   */
  saveColumnState(storageKey: string): void {
    const api = this.store.gridApi();
    if (!api || !storageKey) return;

    const state = {
      columnState: api.getColumnState(),
      filterModel: api.getFilterModel(),
    };

    localStorage.setItem(`ag-grid-state-${storageKey}`, JSON.stringify(state));
  }

  /**
   * Loads and applies the column state from localStorage.
   */
  loadColumnState(storageKey: string): void {
    const api = this.store.gridApi();
    if (!api || !storageKey) return;

    const savedState = localStorage.getItem(`ag-grid-state-${storageKey}`);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        if (parsedState.columnState) {
          api.applyColumnState({
            state: parsedState.columnState,
            applyOrder: true,
          });
        }
        if (parsedState.filterModel) {
          api.setFilterModel(parsedState.filterModel);
        }
      } catch (e) {
        console.warn('Failed to parse saved grid state', e);
      }
    }
  }

  updateSelectionState(selectedRows: T[], idProperty: string): void {
    const ids = new Set(selectedRows.map(r => String(r[idProperty as keyof T])));
    this.store.updateSelection(selectedRows, ids);
  }

  setSelectedItems(items: T[]): void {
    this.store.setSelectedItems(items);
    this.store.setIsSelectAll(false);
  }

  selectAll(idProperty: string = 'id'): void {
    const api = this.store.gridApi();
    if (!api) return;

    this.store.setIsBulkOperation(true);
    try {
      api.selectAll();
      this.store.setIsSelectAll(true);
    } finally {
      setTimeout(() => {
        this.store.setIsBulkOperation(false);
        this.updateSelectionState(api.getSelectedRows(), idProperty);
      }, 50);
    }
  }

  deselectAll(): void {
    const api = this.store.gridApi();
    if (!api) return;

    this.store.setIsBulkOperation(true);
    try {
      api.deselectAll();
      this.store.resetSelection();
    } finally {
      setTimeout(() => {
        this.store.setIsBulkOperation(false);
      }, 50);
    }
  }

  cleanup(): void {
    const basePayload = this.store.basePayload();
    const endpoint = basePayload['endpoint'] as string | undefined;
    if (endpoint) {
      this.dataService.clearCache(endpoint);
    }
    this.store.resetAll();
  }

  private handleDataSuccess(
    response: unknown,
    idProperty: string,
    mergeOffset: number = 0
  ): T[] {
    const res = response as any;
    let rowData: T[] = res?.rowData || res?.data || res?.rows || res?.result || [];

    // Filter out invalid items
    rowData = rowData.filter(item => item != null);

    const totalCount = res?.totalCount || res?.total || rowData.length;

    if (totalCount >= 0) {
      this.store.setTotalRowCount(totalCount);
    }

    let currentData = [...this.store.allLoadedData()];
    const requiredLength = Math.max(currentData.length, mergeOffset + rowData.length);

    // Ensure array has correct length with placeholders
    if (currentData.length < requiredLength) {
      const newArray = new Array(requiredLength);
      for (let i = 0; i < currentData.length; i++) newArray[i] = currentData[i];
      for (let i = currentData.length; i < requiredLength; i++) {
        newArray[i] = {
          [idProperty]: `placeholder-${i}`,
          __facade_row_id: `facade-placeholder-${i}`,
          __isPlaceholder: true
        } as unknown as T;
      }
      currentData = newArray;
    }

    // Merge new data and inject unique internal IDs
    for (let i = 0; i < rowData.length; i++) {
      const row = { ...rowData[i] };
      // Inject unique stable ID based on absolute offset to prevent collision
      const absoluteIndex = mergeOffset + i;
      (row as any).__facade_row_id = `facade-row-${absoluteIndex}`;
      currentData[absoluteIndex] = row;
    }

    const total = this.store.totalRowCount();
    if (total > currentData.length) {
      const newArray = new Array(total);
      for (let i = 0; i < currentData.length; i++) newArray[i] = currentData[i];
      for (let i = currentData.length; i < total; i++) {
        newArray[i] = {
          [idProperty]: `placeholder-${i}`,
          __facade_row_id: `facade-placeholder-${i}`,
          __isPlaceholder: true
        } as unknown as T;
      }
      currentData = newArray;
    }

    this.store.updateLoadedData(currentData);
    return rowData;
  }
}
