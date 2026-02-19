import { Injectable, computed, signal } from '@angular/core';
import { GridApi } from 'ag-grid-community';
import { TableRowData } from '../../../../reusable-table/reusable-table.component';
import { BaseStore } from '../../../../../../Core/store/base-store';

export interface AgGridState<T> {
  gridApi: GridApi | null;
  loading: boolean;
  error: string | null;
  totalRowCount: number;
  allLoadedData: T[];
  pinnedBottomRowData: Record<string, unknown>[];
  searchText: string;
  basePayload: Record<string, unknown>;
  activeOverlay: string | undefined;
  selectedItems: T[];
  selectedIds: Set<string | number>;
  isSyncingSelection: boolean;
  isSelectAll: boolean;
  isBulkOperation: boolean;
  loadedPages: Set<number>;
  fetchingPages: Set<number>;
}

const initialAgGridState: AgGridState<any> = {
  gridApi: null,
  loading: false,
  error: null,
  totalRowCount: 0,
  allLoadedData: [],
  pinnedBottomRowData: [],
  searchText: '',
  basePayload: {},
  activeOverlay: undefined,
  selectedItems: [],
  selectedIds: new Set(),
  isSyncingSelection: false,
  isSelectAll: false,
  isBulkOperation: false,
  loadedPages: new Set(),
  fetchingPages: new Set(),
};

@Injectable()
export class AgGridStore<T extends TableRowData = TableRowData> extends BaseStore<AgGridState<T>> {
  // Readonly Signals from BaseStore
  readonly gridApi = this.select(state => state.gridApi);
  override readonly loading = this.select(state => state.loading);
  override readonly error = this.select(state => state.error);
  readonly totalRowCount = this.select(state => state.totalRowCount);
  readonly allLoadedData = this.select(state => state.allLoadedData);
  readonly pinnedBottomRowData = this.select(state => state.pinnedBottomRowData);
  readonly searchText = this.select(state => state.searchText);
  readonly basePayload = this.select(state => state.basePayload);
  readonly activeOverlay = this.select(state => state.activeOverlay);
  readonly selectedItems = this.select(state => state.selectedItems);
  readonly selectedIds = this.select(state => state.selectedIds);
  readonly isSyncingSelection = this.select(state => state.isSyncingSelection);
  readonly isSelectAll = this.select(state => state.isSelectAll);
  readonly isBulkOperation = this.select(state => state.isBulkOperation);
  readonly loadedPages = this.select(state => state.loadedPages);
  readonly fetchingPages = this.select(state => state.fetchingPages);

  // Computed Derived State
  readonly hasData = computed(() =>
    this.totalRowCount() > 0 || this.allLoadedData().length > 0
  );

  readonly isEmpty = computed(() =>
    !this.hasData() && !this.loading()
  );

  readonly isGridReady = computed(() => !!this.gridApi());

  constructor() {
    super(initialAgGridState);
  }

  // === Actions ===

  setGridApi(api: GridApi | null): void {
    this.patchState({ gridApi: api });
  }

  override setLoading(loading: boolean): void {
    this.patchState({ loading });
  }

  override setError(error: string | null): void {
    this.patchState({ error });
  }

  setTotalRowCount(count: number): void {
    this.patchState({ totalRowCount: count });
  }

  updateLoadedData(data: T[]): void {
    this.patchState({ allLoadedData: data });
  }

  setPinnedBottomRowData(data: Record<string, unknown>[]): void {
    this.patchState({ pinnedBottomRowData: data });
  }

  setSearchText(text: string): void {
    this.patchState({ searchText: text });
  }

  setBasePayload(payload: Record<string, unknown>): void {
    this.patchState({ basePayload: payload });
  }

  setActiveOverlay(overlay: string | undefined): void {
    this.patchState({ activeOverlay: overlay });
  }

  setSelectedItems(items: T[]): void {
    this.patchState({ selectedItems: items });
  }

  setIsSyncingSelection(syncing: boolean): void {
    this.patchState({ isSyncingSelection: syncing });
  }

  setIsSelectAll(isAll: boolean): void {
    this.patchState({ isSelectAll: isAll });
  }

  setIsBulkOperation(isBulk: boolean): void {
    this.patchState({ isBulkOperation: isBulk });
  }

  updateSelection(items: T[], ids: Set<string | number>): void {
    this.patchState({ selectedItems: items, selectedIds: ids });
  }

  addLoadedPage(pageIndex: number): void {
    const newPages = new Set(this.state().loadedPages);
    newPages.add(pageIndex);
    this.patchState({ loadedPages: newPages });
  }

  resetLoadedPages(): void {
    this.patchState({ loadedPages: new Set() });
  }

  resetDataState(): void {
    this.patchState({
      totalRowCount: 0,
      allLoadedData: [],
      pinnedBottomRowData: [],
      error: null,
      loading: false,
      loadedPages: new Set(),
      fetchingPages: new Set(),
    });
  }

  resetAll(): void {
    this.setState(initialAgGridState);
  }

  resetSelection(): void {
    this.patchState({
      selectedItems: [],
      selectedIds: new Set(),
      isSelectAll: false,
      isSyncingSelection: false,
    });
  }

  addFetchingPage(pageIndex: number): void {
    const newPages = new Set(this.state().fetchingPages);
    newPages.add(pageIndex);
    this.patchState({ fetchingPages: newPages });
  }

  removeFetchingPage(pageIndex: number): void {
    const newPages = new Set(this.state().fetchingPages);
    newPages.delete(pageIndex);
    this.patchState({ fetchingPages: newPages });
  }

  resetFetchingPages(): void {
    this.patchState({ fetchingPages: new Set() });
  }
}

