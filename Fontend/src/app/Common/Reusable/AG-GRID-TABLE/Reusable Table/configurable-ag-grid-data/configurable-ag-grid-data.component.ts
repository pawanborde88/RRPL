import {
  Component,
  ViewChild,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  untracked,
  input,
  output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  Injector,
  runInInjectionContext,
  NgZone
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';


import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AgGridColumnService } from './services/ag-grid-column.service';
import { AgGridPinnedRowService } from './services/ag-grid-pinned-row.service';
import { AgGridExportService } from './services/ag-grid-export.service';
import { AgGridStore } from './store/ag-grid.store';
import { AgGridFacade } from './facade/ag-grid.facade';
import {
  ColDef,
  GridReadyEvent,
  RowModelType,
  Theme,
  RowSelectionOptions,
  themeQuartz,
  AllCommunityModule,
  AutoSizeStrategy,
  RowClassParams,
  PaginationNumberFormatterParams,
  AutoGroupColumnDef,
  ModuleRegistry,
  PaginationChangedEvent
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

import { environment } from '../../../../../../environments/environment';
import {
  TableColumn,
  TableRowData,
  ActionButton,
  HeaderButton,
  ActionEvent
} from '../../../reusable-table/reusable-table.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { ActionCellRendererComponent } from './cell-renderers/action-cell-renderer.component';
import { SensitiveCellRendererComponent } from './cell-renderers/sensitive-cell-renderer.component';
import { PhotoCellRendererComponent } from './cell-renderers/photo-cell-renderer.component';
import { HeaderCheckboxComponent } from './cell-renderers/header-checkbox.component';
import { AuthService } from '../../../../../Service/auth.service';



@Component({
  selector: 'app-configurable-ag-grid-data',
  standalone: true,
  imports: [
    AgGridAngular,
    CommonModule,
    AngularMaterialModule,
    OverlayModule,
    ActionCellRendererComponent,
    SensitiveCellRendererComponent,
    PhotoCellRendererComponent,
    HeaderCheckboxComponent,
  ],

  providers: [AgGridStore, AgGridFacade],
  templateUrl: './configurable-ag-grid-data.component.html',
  styleUrl: './configurable-ag-grid-data.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigurableAgGridDataComponent<T extends TableRowData = TableRowData> implements OnDestroy {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef<HTMLInputElement>;

  // Input signals
  readonly columns = input<readonly TableColumn<T>[] | TableColumn<T>[]>([]);
  readonly apiEndpoint = input<string>('');
  readonly apiMethod = input<'GET' | 'POST'>('POST');
  readonly apiPayload = input<Record<string, any>>({});
  readonly loading = input<boolean>(false);
  readonly rowHeight = input<number>(30);
  readonly headerHeight = input<number>(30);
  readonly cacheBlockSize = input<number>(100);
  readonly maxBlocksInCache = input<number>(10); // Deprecated for ClientSide, but kept for interface compat if needed
  readonly infiniteInitialRowCount = input<number>(1000);
  readonly actions = input<readonly ActionButton<T>[] | ActionButton<T>[]>([]);
  readonly headerButtons = input<readonly HeaderButton[] | HeaderButton[]>([]);
  readonly showCheckbox = input<boolean>(false);
  readonly idProperty = input<string>('id');
  readonly selectedItems = input<T[]>([]);
  readonly autoLoad = input<boolean>(false);
  readonly getRowClass = input<((params: RowClassParams<T>) => string | string[] | undefined) | undefined>(undefined);
  readonly customTheme = input<Partial<Parameters<typeof themeQuartz.withParams>[0]> | undefined>(undefined);
  readonly paginationPageSize = input<number>(100);
  readonly paginationPageSizeSelector = input<number[] | boolean>([30, 50, 100, 200, 500, 1000]);

  // Re-added deprecated or missing inputs for template compatibility
  readonly animateRows = input<boolean>(true);
  readonly maxConcurrentDatasourceRequests = input<number>(2);
  readonly floatingFiltersHeight = input<number>(25);
  readonly autoGroupColumnDef = input<ColDef | undefined>(undefined);
  readonly selectionColumnDef = input<ColDef | undefined>(undefined);
  readonly getRowId = input<((params: any) => string) | undefined>(undefined);
  readonly getRowStyle = input<((params: any) => any) | undefined>(undefined);
  readonly enableCellTextSelection = input<boolean>(true);
  readonly context = input<any>(undefined);

  // Advanced Community Features
  readonly rowDrag = input<boolean>(false);
  readonly tooltipShowDelay = input<number>(500);
  readonly enableAdvancedFilter = input<boolean>(true);
  readonly wrapText = input<boolean>(false);
  readonly autoHeight = input<boolean>(false);
  readonly skipHeaderOnAutoSize = input<boolean>(false);
  readonly tooltipHideDelay = input<number>(5000);
  readonly tooltipTriggerField = input<string | null>(null);



  // Output signals
  readonly actionClick = output<ActionEvent<T>>();
  readonly rowSelected = output<T[]>();
  readonly gridReady = output<GridReadyEvent>();
  readonly checkboxChange = output<{ checked: boolean; row: T }>();

  // Dependencies
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly columnService = inject(AgGridColumnService);
  private readonly exportService = inject(AgGridExportService);
  private readonly authService = inject(AuthService);
  public readonly facade = inject(AgGridFacade<T>);
  private readonly store = inject(AgGridStore<T>);

  readonly roleId = Number(sessionStorage.getItem('role_id')) || 0;
  readonly storageUrl = environment.STORAGE_URL;

  readonly hasPermission = (permission: string): boolean =>
    this.authService.hasPermission(permission);

  readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
    this.authService.hasOnlyRoles(allowedRoles);

  // Permission logic for Export
  private readonly exportPermissionIds = [
    '403', '422', '424', '425', '426', '427', '428', '429', '430', '395',
    '408', '421', '414', '390', '463', '464', '479', '492', '500', '515',
    '480', '494', '495', '496', '497', '498', '499', '493', '534', '537',
    '543', '506', '513', '514', '509', '510', '511', '559', '560', '561',
    '562', '563', '564', '565', '566', '567', '568', '569', '570', '571',
    '572', '573', '574', '575', '576', '577', '578', '579', '580', '581',
    '661', '658', '659', '660', '642', '644', '655', '656', '654', '653',
    '646', '638', '640', '639', '657'
  ];

  readonly canExport = computed(() =>
    this.facade.hasData() && this.exportPermissionIds.some(id => this.hasPermission(id))
  );

  // Expose facade state
  readonly isLoading = computed(() => this.facade.loading() || this.loading());
  readonly rowData = this.facade.allLoadedData; // Bind this to [rowData]
  readonly pinnedBottomRowData = this.facade.pinnedBottomRowData;
  readonly activeOverlay = this.facade.activeOverlay;

  // Computed signals
  readonly visibleHeaderButtons = computed(() => {
    const buttons = Array.isArray(this.headerButtons()) ? this.headerButtons() : [...this.headerButtons()];
    return buttons.filter(btn => !btn.show || btn.show());
  });

  readonly columnsHash = computed(() => {
    const cols = Array.isArray(this.columns()) ? this.columns() : [...this.columns()];
    const actionCount = (this.actions() || []).length;
    return `${cols.map(c => `${c.key}:${c.type || ''}:${c.label || ''}`).join('|')}:${actionCount}`;
  });

  readonly columnDefs = computed(() => {
    const hash = this.columnsHash();
    if (this.lastColumnsHash === hash && this.cachedColumnDefs) {
      return this.cachedColumnDefs;
    }

    const defs = this.buildColumnDefs();
    this.cachedColumnDefs = defs;
    this.lastColumnsHash = hash;
    return defs;
  });

  readonly rowSelection = computed<RowSelectionOptions | 'single' | 'multiple' | undefined>(() => {
    return this.showCheckbox() ? { mode: 'multiRow' } : undefined;
  });

  readonly suppressRowClickSelection = computed(() => this.showCheckbox());

  readonly theme = computed<Theme>(() => {
    const baseThemeParams = {
      borderColor: '#D9DED9',
      wrapperBorder: false,
      headerRowBorder: false,
      rowBorder: { style: 'solid', width: 1 },
      columnBorder: { style: 'solid' },
    };
    const themeParams = this.customTheme()
      ? { ...baseThemeParams, ...this.customTheme() }
      : baseThemeParams;
    return themeQuartz.withParams(themeParams);
  });

  readonly effectiveCacheBlockSize = computed(() => this.cacheBlockSize());

  readonly effectiveGetRowClass = computed(() => {
    return this.getRowClass();
  });




  // Grid state
  private cachedColumnDefs: ColDef[] | null = null;
  private lastColumnsHash = '';
  private rafScheduled = false;
  private pendingUpdates: (() => void)[] = [];

  private wasBulk = false;
  private lastPageSize = 0;
  private autoSizeTimeout: any;



  // AG Grid configuration
  readonly rowModelType = signal<RowModelType>('clientSide');
  readonly rowBuffer = 20;
  readonly autoSizeStrategy: AutoSizeStrategy = {
    type: 'fitCellContents',
    defaultMaxWidth: 300,
    defaultMinWidth: 80,
    skipHeader: false,
  };

  readonly domLayout: 'normal' | 'autoHeight' | 'print' = 'normal';

  readonly defaultColDef = computed<ColDef>(() => ({
    minWidth: 100,
    maxWidth: 500,
    sortable: true,
    cellClass: 'rag-blue-cell',
    filter: this.enableAdvancedFilter(),
    floatingFilter: this.enableAdvancedFilter(),
    sortingOrder: ['asc', 'desc', null],
    resizable: true,
    suppressHeaderMenuButton: true,
    enableCellChangeFlash: true,
    wrapText: this.wrapText(),
    autoHeight: this.autoHeight(),

  }));







  readonly paginationNumberFormatter = (params: PaginationNumberFormatterParams): string => {
    return '[' + params.value.toLocaleString() + ']';
  };

  constructor() {
    this.setupEffects();
  }

  private setupEffects(): void {
    runInInjectionContext(this.injector, () => {
      // Effect: Update columns when columns signal changes
      effect(() => {
        const hash = this.columnsHash();
        const api = this.facade.gridApi();
        untracked(() => {
          if (hash !== this.lastColumnsHash && api) {
            this.scheduleUpdate(() => this.updateGridColumns());
          }
        });
      });

      // Effect: Sync selection when selectedItems changes
      effect(() => {
        const selectedItems = this.selectedItems();
        const api = this.facade.gridApi();

        untracked(() => {
          const isSyncing = this.facade.isSyncingSelection();
          if (this.showCheckbox() && api && !isSyncing) {
            this.scheduleUpdate(() => this.syncSelectionWithGrid());
          }
        });
      });

      // Effect: Update base payload when apiPayload changes
      effect(() => {
        const payload = this.apiPayload();
        untracked(() => {
          const basePayload = { ...payload };
          delete basePayload['limit'];
          delete basePayload['offset'];
          this.store.setBasePayload(basePayload);
        });
      });

      // Effect: Monitor Bulk Operation to emit changes when done
      effect(() => {
        const isBulk = this.facade.isBulkOperation();
        untracked(() => {
          if (!isBulk && this.wasBulk) {
            const api = this.facade.gridApi();
            if (api) {
              const selected = api.getSelectedRows() as T[];
              this.rowSelected.emit(selected);
              this.cdr.markForCheck();
            }
          }
          this.wasBulk = isBulk;
        });
      });
    });
  }
  private scheduleUpdate(updateFn: () => void): void {
    if (!this.isBrowser) {
      updateFn();
      return;
    }

    this.pendingUpdates.push(updateFn);
    if (!this.rafScheduled) {
      this.rafScheduled = true;
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => {
          this.rafScheduled = false;
          const updates = [...this.pendingUpdates];
          this.pendingUpdates = [];
          this.ngZone.run(() => updates.forEach(fn => fn()));
        });
      });
    }
  }

  private buildColumnDefs(): ColDef[] {
    let columnsArray = Array.isArray(this.columns()) ? this.columns() : [...this.columns()];

    // Filter out checkbox-related columns
    columnsArray = columnsArray.filter(col => {
      const colAny = col as any;
      return col.key !== 'checkbox' &&
        col.key !== '__checkbox__' &&
        col.type !== 'checkbox' &&
        !colAny.checkboxSelection &&
        !colAny.headerCheckboxSelection &&
        colAny.headerComponent?.name !== 'HeaderCheckboxComponent';
    });

    const actions = Array.isArray(this.actions()) ? this.actions() : [...this.actions()];

    // Optimized check for visible actions
    const hasVisibleActions = actions.length > 0 && actions.some(btn => {
      if (typeof btn.show === 'boolean') return btn.show;
      if (typeof btn.show === 'function' && btn.show.length === 0) return (btn.show as () => boolean)();
      return true;
    });

    // Remove Action column if no buttons are visible
    if (!hasVisibleActions) {
      columnsArray = columnsArray.filter(col => col.type !== 'actions');
    }

    const hasSerialNoColumn = columnsArray.some(col => col.type === 'index');
    const finalColumns: ColDef[] = [];

    if (!hasSerialNoColumn) {
      finalColumns.push({
        headerName: 'S.No',
        colId: 'serialNo',
        valueGetter: 'node.rowIndex + 1',
        width: 70,
        minWidth: 70,
        maxWidth: 70,
        pinned: 'left',
        sortable: false,
        filter: false,
        suppressHeaderMenuButton: true,
        resizable: false,
        cellStyle: { justifyContent: 'center', display: 'flex' }, // ensuring center alignment across themes
        headerClass: 'ag-center-aligned-header'
      });
    }



    const onActionClick = (event: { action: string; row: T }) => {
      this.actionClick.emit({ action: event.action, row: event.row });
    };

    for (const col of columnsArray) {
      const colDef = this.columnService.createColumnDef(col, actions, onActionClick, this.showCheckbox());
      finalColumns.push(colDef as ColDef);
    }

    return finalColumns;
  }

  private updateGridColumns(): void {
    const api = this.facade.gridApi();
    if (!api) return;
    api.setGridOption('columnDefs', this.columnDefs());
  }

  onGridReady(params: GridReadyEvent): void {
    this.facade.initializeGrid(params);
    const basePayload = { ...this.apiPayload() };
    delete basePayload['limit'];
    delete basePayload['offset'];
    this.store.setBasePayload(basePayload);

    this.configureOverlay();

    // Auto-size listener
    params.api.addEventListener('modelUpdated', () => {
      // Debounce to prevent performance issues
      if (this.autoSizeTimeout) {
        clearTimeout(this.autoSizeTimeout);
      }
      this.autoSizeTimeout = setTimeout(() => {
        if (this.facade.allLoadedData().length > 0) {
          this.autoSizeColumns();
        }
      }, 300);
    });

    // Ensure we clean up columns once data is rendered
    params.api.addEventListener('firstDataRendered', () => {
      this.autoSizeColumns();
    });

    if (this.showCheckbox() && this.selectedItems().length > 0) {
      this.syncSelectionWithGrid();
    }

    if (this.autoLoad()) {
      this.onPaginationChanged(); // trigger first load
    } else {
      this.checkAndShowOverlay();
    }

    this.lastPageSize = params.api.paginationGetPageSize();
    this.gridReady.emit(params);
    this.cdr.markForCheck();
  }

  onPaginationChanged(event?: PaginationChangedEvent) {
    const api = this.facade.gridApi();
    if (!api) return;

    if (api.paginationIsLastPageFound()) {
      // If we know the total rows, and we are at the end, do nothing?
    }

    const currentPage = api.paginationGetCurrentPage();
    const pageSize = api.paginationGetPageSize();

    // Check if page size changed
    if (this.lastPageSize !== pageSize) {
      this.lastPageSize = pageSize;
      // Invalidate cache because page boundaries shifted
      this.store.resetLoadedPages();
    }

    // Load this page
    this.facade.loadPage(
      currentPage,
      pageSize,
      this.apiEndpoint(),
      this.apiMethod(),
      this.idProperty(),
      () => {
        this.scheduleUpdate(() => {
          this.checkAndShowOverlay();
          this.updatePinnedBottomRow();
          // Auto-sizing is handled by modelUpdated listener
        });
      }
    );
  }


  private configureOverlay(): void {
    const api = this.facade.gridApi();
    if (!api) return;
    api.setGridOption('noRowsOverlayComponentParams', {
      noRowsMessageFunc: () => 'No data to display'
    });
  }



  private checkAndShowOverlay(): void {
    const api = this.facade.gridApi();
    if (!api) return;

    const hasData = this.facade.hasData();
    if (!hasData) {
      api.showNoRowsOverlay();
      this.store.setActiveOverlay('agNoRowsOverlay');
    } else {
      api.hideOverlay();
      this.store.setActiveOverlay(undefined);
    }
  }

  private autoSizeColumns(): void {
    const api = this.facade.gridApi();
    if (!api) return;
    const allColIds = api.getColumns()?.map(c => c.getColId()) || [];
    api.autoSizeColumns(allColIds, this.skipHeaderOnAutoSize());
  }

  private syncSelectionWithGrid(): void {
    const api = this.facade.gridApi();
    if (!api || !this.showCheckbox() || this.facade.isSyncingSelection()) return;

    this.store.setIsSyncingSelection(true);

    try {
      const selectedItems = this.selectedItems();
      const selectedIds = new Set<string>();
      const idProp = this.idProperty();

      for (const item of selectedItems) {
        const id = item[idProp];
        if (id != null) selectedIds.add(String(id));
      }

      if (selectedIds.size === 0) {
        api.deselectAll();
        return;
      }

      api.forEachNode((node) => {
        if (node.data) {
          const nodeId = node.data[idProp];
          if (nodeId != null) {
            const shouldSelect = selectedIds.has(String(nodeId));
            if (node.isSelected() !== shouldSelect) {
              node.setSelected(shouldSelect, false);
            }
          }
        }
      });
    } finally {
      this.store.setIsSyncingSelection(false);
    }
  }

  onFilterChanged(): void {
    // When filters change, we need to recalculate the pinned row
    // to reflect the sums of the currently visible (filtered) data.
    this.scheduleUpdate(() => this.updatePinnedBottomRow());
  }

  onSelectionChanged(): void {
    const api = this.facade.gridApi();
    if (!this.showCheckbox() || !api || this.facade.isSyncingSelection() || this.facade.isBulkOperation()) return;

    const selectedRows = api.getSelectedRows() as T[];
    this.scheduleUpdate(() => {
      this.facade.setSelectedItems(selectedRows);
      this.rowSelected.emit(selectedRows);
      this.cdr.markForCheck();
    });
  }

  loadData(): void {
    this.store.resetLoadedPages();
    this.onPaginationChanged();
  }


  refreshData(): void {
    this.facade.refreshData();
    this.loadData();
  }



  onSearchEnter(): void {
    if (!this.searchInputRef?.nativeElement) return;
    const searchValue = this.searchInputRef.nativeElement.value || '';
    this.facade.updateSearchText(searchValue);
    this.store.resetLoadedPages();
    this.onPaginationChanged();
  }

  clearSearch(): void {
    this.facade.clearSearch();
    if (this.searchInputRef?.nativeElement) {
      this.searchInputRef.nativeElement.value = '';
    }
    this.store.resetLoadedPages();
    this.onPaginationChanged();
  }

  private readonly pinnedRowService = inject(AgGridPinnedRowService);

  private updatePinnedBottomRow(): void {
    const api = this.facade.gridApi();
    if (!api) return;

    // Use the service to calculate pinned rows
    // It handles filtering, sums, and memoization internally
    const pinnedData = this.pinnedRowService.calculatePinnedRowData<T>(
      api,
      this.columns(),
      this.facade.allLoadedData(),
      this.facade.totalRowCount(),
      this.columnsHash()
    );

    this.facade.setPinnedBottomRowData(pinnedData.data);
  }

  exportData(): void {
    const api = this.facade.gridApi();
    if (!api) return;

    const payload = {
      ...this.facade.basePayload(),
      filters: {
        ...(this.facade.basePayload()?.['filters'] as Record<string, any> || {}),
        ...api.getFilterModel()
      },
      search: this.facade.searchText() || '',
      is_export: true
    };

    this.facade.setLoading(true);

    // Filter columns: exclude sensitive data if roleId is not 2
    const exportColumns = this.columns().filter(col =>
      col.type !== 'sensitive' || this.roleId === 2
    );

    this.exportService.exportFromServer({
      endpoint: this.apiEndpoint(),
      method: this.apiMethod(),
      payload,
      columns: [...exportColumns]
    }).subscribe({
      next: async (res) => {
        if (!res.body) {
          this.facade.setLoading(false);
          return;
        }

        try {
          // Use determineFileType which checks headers first
          const fileInfo = await this.exportService.determineFileType(res);

          if (fileInfo.type === 'json') {
            const jsonData = await this.exportService.parseJsonFromBlob(res.body);
            let dataRows: any[] = [];

            if (Array.isArray(jsonData)) {
              dataRows = jsonData;
            } else if (jsonData && Array.isArray(jsonData.data)) {
              dataRows = jsonData.data;
            } else if (jsonData && Array.isArray(jsonData.results)) {
              dataRows = jsonData.results;
            } else {
              // Fallback: try to find the first array property
              const arrayProp = Object.values(jsonData).find(val => Array.isArray(val));
              if (arrayProp) {
                dataRows = arrayProp as any[];
              }
            }

            if (dataRows && dataRows.length > 0) {
              this.exportService.exportJsonToExcel(dataRows, exportColumns);
            } else {
              console.warn('Export returned no data rows to process');
            }
          } else {
            const contentDisposition = res.headers.get('content-disposition');
            const filename = this.exportService.extractFilename(contentDisposition, fileInfo.extension);
            this.exportService.downloadBlob(res.body, filename);
          }
        } catch (error) {
          console.error('Export processing error', error);
        } finally {
          this.facade.setLoading(false);
        }
      },
      error: (err) => {
        console.error('Export failed', err);
        this.facade.setLoading(false);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup handled by destroyRef and Store
  }
}