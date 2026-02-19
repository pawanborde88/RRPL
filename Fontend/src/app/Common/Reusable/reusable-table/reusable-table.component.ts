import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
  ChangeDetectionStrategy,
  NgZone,
  HostListener,
  ElementRef,
  OnChanges,
  SimpleChanges,
  signal,
  computed,
  effect,
  input,
  output,
  inject,
  PLATFORM_ID,
  Injector,
  DestroyRef
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { ActionColumnComponent } from '../../action-column/action-column.component';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../template/template.component';
import { SelectionModel } from '@angular/cdk/collections';
import { IndianCurrencyPipe } from '../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { ResizableColumnDirective } from '../../directives/resizable-column.directive';
import { environment } from '../../../../environments/environment';
import { CostomLoadingComponent } from '../coustom Loader/costom-loading/costom-loading.component';
import { ColumnResizeDirective } from '../Column Resize/column-resize.directive';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ScrollingModule, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { AdvancedFilterDialogComponent } from '../Column selector Dialog/advanced-filter-dialog/advanced-filter-dialog.component';
import { ViewMobEmailLogComponent } from '../../../Modules/view Logs/view-mob-email-log/view-mob-email-log.component';
import { ViewInfoMobEmailComponent } from '../../View Mobile Email/view-info-mob-email/view-info-mob-email.component';
import * as XLSX from 'xlsx';
import { PaginationComponent } from '../../pagination/pagination.component';
import { CustomPaginationComponent } from '../custom-pagination/custom-pagination.component';
import { AuthService } from '../../../Service/auth.service';
import { ColumnwiseFilterComponent } from '../columnwise-filter/columnwise-filter.component';
import {
  Subject,
  Observable,
  BehaviorSubject,
  fromEvent,
  EMPTY,
  timer,
  of,
  defer,
  merge
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  throttleTime,
  filter,
  auditTime,
  switchMap,
  exhaustMap,
  catchError,
  finalize,
  tap,
  retry,
  take,
  takeUntil
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReceiptPreviewDialogComponent } from '../../../Modules/Setup Files/Post Sales/Recovery/receipt-preview-dialog/receipt-preview-dialog.component';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { TablePerformanceService } from './table-performance.service';
import {
  ColorConditionPipe,
  WarningConditionPipe,
  ShouldShowButtonPipe,
  IsButtonDisabledPipe,
  RowClassMemoPipe,
  SerialNumberPipe,
  CellValuePipe,
  ButtonColorPipe,
  ButtonIconPipe,
  ButtonLabelPipe,
  ButtonTooltipPipe
} from './reusable-table.pure-pipes';

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
  readonly columnType?: 'agNumberColumnFilter' | 'agDateColumnFilter' | 'agTextColumnFilter' | false; // Explicit filter type for AG Grid
  readonly sticky?: boolean;
  readonly disabled?: boolean;
  readonly isAmount?: boolean;
  readonly showAverage?: boolean;

  readonly isDate?: boolean;
  readonly dateFormat?: string;
  readonly isPhone?: boolean;
  readonly isEmail?: boolean;
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
  readonly sortable?: boolean;
  readonly filter?: boolean;
  readonly resizable?: boolean;
  readonly children?: readonly TableColumn<T>[];
  readonly headerClass?: string;
  readonly cellClass?: string;
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
  readonly iconType?: 'svg' | 'material' | 'fontawesome';
  readonly tooltip?: string | ((row: T) => string);
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

@Component({
  selector: 'app-reusable-custom-table',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    IndianCurrencyPipe,
    ActionColumnComponent,
    PaginationComponent,
    ResizableColumnDirective,
    CostomLoadingComponent,
    ColumnResizeDirective,
    DragDropModule,
    CustomPaginationComponent,
    ColumnwiseFilterComponent,
    ScrollingModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    // Pure pipes for performance
    ColorConditionPipe,
    WarningConditionPipe,
    ShouldShowButtonPipe,
    IsButtonDisabledPipe,
    RowClassMemoPipe,
    SerialNumberPipe,
    CellValuePipe,
    ButtonColorPipe,
    ButtonIconPipe,
    ButtonLabelPipe,
    ButtonTooltipPipe
  ],
  providers: [TablePerformanceService],
  templateUrl: './reusable-table.component.html',
  styleUrl: './reusable-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': '"table"',
    '[attr.aria-label]': '"Data table"',
    '[attr.aria-rowcount]': 'filteredTotalCount()',
    '[attr.aria-colcount]': 'activeColumns().length',
    '[class.reusable-table-container]': 'true'
  }
})
export class ReusableTableComponent<T extends TableRowData = TableRowData> implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  // ==================== REACTIVE STATE (IMMUTABLE SIGNALS) ====================
  readonly allDataSignal = signal<readonly T[]>([]);
  private readonly originalDataSignal = signal<readonly T[]>([]);
  private readonly filteredCacheSignal = signal<readonly T[]>([]);
  private readonly filtersDirtySignal = signal<boolean>(true);
  readonly globalSearchTermSignal = signal<string>('');
  private readonly columnFiltersSignal = signal<Readonly<Record<string, string>>>({});
  private readonly currentPageSignal = signal<number>(0);
  readonly loadedItemCountSignal = signal<number>(0);
  readonly isLoadingMoreSignal = signal<boolean>(false);
  private readonly visibleRangeSignal = signal<Readonly<{ start: number; end: number }>>({ start: 0, end: 0 });
  private readonly editingRowSignal = signal<T | null>(null);
  private readonly editingFieldSignal = signal<string>('');
  private readonly editValueSignal = signal<unknown>('');

  // Computed signals for derived state
  readonly filteredTotalCount = computed(() => this.filteredCacheSignal().length);
  readonly hasActiveFilters = computed(() => {
    const filters = this.columnFiltersSignal();
    const searchTerm = this.globalSearchTermSignal();
    return Object.values(filters).some(v => v?.trim()) || !!searchTerm;
  });
  readonly canLoadMore = computed(() =>
    !this.isLoadingMoreSignal() &&
    this.loadedItemCountSignal() < this.filteredCacheSignal().length
  );

  // ✨ Additional computed signals for better performance
  readonly isEmpty = computed(() => this.filteredCacheSignal().length === 0);
  readonly isNotEmpty = computed(() => this.filteredCacheSignal().length > 0);
  readonly totalPages = computed(() => Math.ceil(this.filteredCacheSignal().length / this.pageSize));
  readonly hasMultiplePages = computed(() => this.totalPages() > 1);
  readonly dataLoadingState = computed(() => ({
    loading: this.loading,
    loadingMore: this.isLoadingMoreSignal(),
    hasData: this.isNotEmpty(),
    canLoadMore: this.canLoadMore()
  }));

  // ==================== IMMUTABLE STATE & PERFORMANCE ====================
  // ✨ Removed destroy$ - using takeUntilDestroyed() instead for automatic cleanup
  private readonly filterSubject = new Subject<string>();
  private readonly dataSubject = new BehaviorSubject<readonly T[]>([]);
  private readonly prefetchCancel$ = new Subject<void>();
  private readonly scrollSubject = new Subject<number>();
  private readonly resizeSubject = new Subject<void>();

  // Performance monitoring
  private readonly performanceMetrics = signal<PerformanceMetrics>({
    renderTime: 0,
    dataLoadTime: 0,
    scrollFPS: 60,
    memoryUsage: 0,
    domNodes: 0
  });

  private readonly performanceBudget: PerformanceBudget = {
    maxRenderTime: 16, // 60fps target
    maxDataLoadTime: 1000,
    minScrollFPS: 30,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxDomNodes: 10000
  };

  // Server-side pagination support
  private readonly serverPaginationConfigSignal = signal<TableDataFetchConfig | null>(null);
  private readonly currentCursor = signal<string | null>(null);
  private readonly hasMoreData = signal<boolean>(false);
  private readonly isFetchingData = signal<boolean>(false);
  private readonly prefetchBuffer = signal<number>(20);

  // Legacy properties for backward compatibility (typed)
  indianCurrencyPipe!: IndianCurrencyPipe;
  roleId!: number;
  pipe!: DatePipe;

  // Test hooks (exposed for testing)
  readonly testHooks: TableTestHooks<T> = {
    getData: () => this.allDataSignal(),
    getFilteredData: () => this.filteredCacheSignal(),
    getVisibleRange: () => this.visibleRangeSignal(),
    getPerformanceMetrics: () => this.performanceMetrics(),
    triggerLoadMore: () => this.loadMoreItems(),
    resetFilters: () => this.resetAllFilters(),
    getSelectedItems: () => this.selectedItems as readonly T[],
    getCurrentPage: () => this.currentPageSignal(),
    getPageSize: () => this.pageSize
  };

  /**
   * Additional test hooks for e2e testing
   */
  readonly e2eHooks = {
    getVirtualScrollViewport: () => this.virtualScroll,
    getEstimatedItemSize: () => this.estimatedItemSize(),
    getItemSizeCache: () => new Map(this.itemSizeCache),
    getPerformanceBudget: () => ({ ...this.performanceBudget }),
    isScrolling: () => this.isScrolling(),
    getScrollPosition: () => {
      if (!this.virtualScroll) return null;
      const element = this.virtualScroll.elementRef.nativeElement;
      return {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight
      };
    },
    triggerResize: () => this.resizeSubject.next(),
    cancelPrefetch: () => this.prefetchCancel$.next()
  };





  // Optimized Virtual scrolling properties
  // Default to true since cdk-virtual-scroll-viewport is always rendered in template
  @Input() virtualScrolling: boolean = true;
  @Input() itemSize: number = 48;
  @Input() bufferSize: number = 15;
  @ViewChild(CdkVirtualScrollViewport) virtualScroll!: CdkVirtualScrollViewport;
  @Output() scrollIndexChange = new EventEmitter<number>();

  // Track visible range for virtual scrolling (using signal)
  get visibleRange() { return this.visibleRangeSignal(); }
  set visibleRange(value) { this.visibleRangeSignal.set(value); }

  // ==================== VIRTUAL SCROLL STATE ====================
  readonly virtualData = signal<T[]>([]); // Make mutable for mat-table compatibility
  private readonly offset = signal<number>(0);
  private readonly virtualScrollHeightSignal = signal<string>('100%');

  // ==================== COLUMN VIRTUALIZATION ====================
  // Only render visible columns in viewport for better performance with many columns
  private readonly columnScrollLeft = signal<number>(0);
  private readonly columnViewportWidth = signal<number>(0);
  private readonly visibleColumnRange = signal<Readonly<{ start: number; end: number }>>({ start: 0, end: 0 });

  // Computed signal for visible columns based on scroll position
  readonly virtualizedColumns = computed<readonly TableColumn<T>[]>(() => {
    const columns = this.activeColumns();
    const range = this.visibleColumnRange();

    // If no column virtualization needed (few columns), return all
    if (columns.length <= 20) {
      return columns;
    }

    // Return visible columns plus buffer
    const buffer = 3; // Render 3 extra columns on each side
    const start = Math.max(0, range.start - buffer);
    const end = Math.min(columns.length, range.end + buffer);

    return columns.slice(start, end);
  });

  // Computed signal for visible column keys
  readonly virtualizedColumnKeys = computed<readonly string[]>(() => {
    return this.virtualizedColumns().map(col => col.key);
  });

  // Legacy getter/setter for virtualScrollHeight
  get virtualScrollHeight(): string {
    return this.virtualScrollHeightSignal();
  }
  set virtualScrollHeight(value: string) {
    this.virtualScrollHeightSignal.set(value);
  }

  // Performance optimization flags
  private readonly isScrolling = signal<boolean>(false);
  private scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  private rafId: number | null = null;

  // Estimated item sizing for better virtual scroll performance
  private readonly estimatedItemSize = signal<number>(48);
  private readonly itemSizeCache = new Map<number, number>();

  // Optimized computed signals for virtual scroll configuration
  // Enhanced with dynamic sizing and performance-based buffering
  readonly optimizedItemSize = computed(() => {
    const estimated = this.estimatedItemSize();
    const inputSize = this.itemSize;
    // Use estimated size if available and close to input, otherwise use input
    // Clamp to reasonable bounds (24px - 120px) for stability
    const size = estimated > 0 && Math.abs(estimated - inputSize) < 10 ? estimated : inputSize;
    return Math.max(24, Math.min(120, size));
  });

  readonly optimizedMinBufferPx = computed(() => {
    const itemSize = this.optimizedItemSize();
    const bufferSize = this.bufferSize;
    const dataSize = this.filteredCacheSignal().length;

    // Calculate buffer based on viewport height for better performance
    // Adaptive buffer size based on dataset size and device performance
    const viewportHeight = isPlatformBrowser(this.platformId) ? window.innerHeight : 800;
    const itemsPerViewport = Math.ceil(viewportHeight / itemSize);

    // Dynamic buffer sizing:
    // - Small datasets (< 500): 1.5x viewport for smooth scrolling
    // - Medium datasets (500-5000): 1.2x viewport for balance
    // - Large datasets (> 5000): 1.0x viewport + base buffer for performance
    let multiplier = 1.2;
    if (dataSize < 500) {
      multiplier = 1.5;
    } else if (dataSize > 5000) {
      multiplier = 1.0;
    }

    const minBufferItems = Math.max(
      bufferSize,
      Math.ceil(itemsPerViewport * multiplier)
    );

    return minBufferItems * itemSize;
  });

  readonly optimizedMaxBufferPx = computed(() => {
    const itemSize = this.optimizedItemSize();
    const bufferSize = this.bufferSize;
    const dataSize = this.filteredCacheSignal().length;
    const columnCount = this.activeColumns().length;

    // Max buffer should be 3-4 viewport heights for smooth scrolling
    // Optimized: Adaptive buffer based on data size, column count, and performance
    const viewportHeight = isPlatformBrowser(this.platformId) ? window.innerHeight : 800;
    const itemsPerViewport = Math.ceil(viewportHeight / itemSize);

    // Adjust multiplier based on complexity:
    // - More columns = smaller buffer (each row is heavier)
    // - More rows = smaller buffer (memory constraints)
    let multiplier = 3.0;
    if (dataSize > 10000) {
      multiplier = 2.0; // Large datasets: prioritize memory
    } else if (dataSize > 5000) {
      multiplier = 2.5;
    }

    // Reduce buffer if many columns (each cell adds DOM overhead)
    if (columnCount > 15) {
      multiplier *= 0.85;
    }

    const maxBufferItems = Math.max(
      bufferSize * 2,
      Math.ceil(itemsPerViewport * multiplier)
    );

    // Cap max buffer to prevent excessive memory usage
    // Reduced cap for large datasets: 30KB instead of 50KB
    const maxBufferCap = dataSize > 10000 ? 30000 : 50000;
    return Math.min(maxBufferItems * itemSize, maxBufferCap);
  });

  /**
   * Updates estimated item size based on actual rendered items
   * Uses DOM measurements for accurate sizing and better virtual scroll performance
   * Optimized with requestIdleCallback for non-blocking updates
   * Throttled to avoid excessive measurements
   */
  private lastSizeUpdate = 0;
  private readonly SIZE_UPDATE_THROTTLE = 500; // Update at most once per 500ms

  private updateEstimatedItemSize(): void {
    if (!this.virtualScroll || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const now = performance.now();
    if (now - this.lastSizeUpdate < this.SIZE_UPDATE_THROTTLE) {
      return; // Throttle updates
    }

    this.lastSizeUpdate = now;

    this.ngZone.runOutsideAngular(() => {
      const measureSize = () => {
        const viewportElement = this.virtualScroll.elementRef.nativeElement;
        const renderedItems = viewportElement.querySelectorAll('tr[mat-row]');

        if (renderedItems.length > 0) {
          let totalHeight = 0;
          let measuredCount = 0;

          // Sample first 5 items for faster measurement (reduced from 10)
          const sampleSize = Math.min(5, renderedItems.length);
          for (let i = 0; i < sampleSize; i++) {
            const height = (renderedItems[i] as HTMLElement).offsetHeight;
            if (height > 0) {
              totalHeight += height;
              measuredCount++;
            }
          }

          if (measuredCount > 0) {
            const averageHeight = totalHeight / measuredCount;
            const currentEstimate = this.estimatedItemSize();

            // Only update if difference is significant (reduced threshold from 2px to 5px)
            if (averageHeight > 0 && Math.abs(averageHeight - currentEstimate) > 5) {
              this.estimatedItemSize.set(Math.round(averageHeight));
              this.itemSize = Math.round(averageHeight);

              // Update viewport with new item size in next frame (debounced)
              this.ngZone.run(() => {
                if (this.virtualScroll) {
                  this.virtualScroll.checkViewportSize();
                }
              });
            }
          }
        }
      };

      // Use requestIdleCallback for non-blocking measurement
      if ('requestIdleCallback' in window) {
        requestIdleCallback(measureSize, { timeout: 200 });
      } else {
        setTimeout(measureSize, 0);
      }
    });
  }

  // ==================== COLUMN MANAGEMENT ====================
  private readonly visibleColumnsSignal = signal<readonly TableColumn<T>[]>([]);
  @Input() maxVisibleColumns: number = 0;
  @Input() priorityColumns: readonly string[] = [];

  // Signal for displayed columns to make it reactive (strictly typed)
  readonly displayedColumnsSignal = signal<readonly TableColumn<T>[]>([]);

  // Legacy getter for visibleColumns
  get visibleColumns(): readonly TableColumn<T>[] {
    return this.visibleColumnsSignal();
  }

  // Computed active columns with better memoization (strictly typed)
  readonly activeColumns = computed<readonly TableColumn<T>[]>(() => {
    const columns = this.displayedColumnsSignal();
    if (!columns || columns.length === 0) {
      return (this.displayedColumns || []) as readonly TableColumn[];
    }

    if (this.virtualScrolling && this.maxVisibleColumns > 0 && columns.length > this.maxVisibleColumns) {
      const visible = this.visibleColumnsSignal();
      return visible.length > 0 ? visible : columns;
    }

    return columns;
  });

  readonly activeColumnKeys = computed<readonly string[]>(() => {
    const columns = this.activeColumns();
    return columns.map((col) => col.key);
  });

  // Lazy loading properties
  @Input() initialLoadCount: number = 20;
  @Input() loadMoreCount: number = 10;
  @Input() loadThreshold: number = 0.8;

  get loadedItemCount() { return this.loadedItemCountSignal(); }
  set loadedItemCount(value) { this.loadedItemCountSignal.set(value); }

  get isLoadingMore() { return this.isLoadingMoreSignal(); }
  set isLoadingMore(value) { this.isLoadingMoreSignal.set(value); }

  // Pagination properties
  @Input() pageSize: number = 30;

  get currentPage() { return this.currentPageSignal(); }
  set currentPage(value) { this.currentPageSignal.set(value); }

  // Memoization cache with WeakMap for better memory management
  private readonly totalsCache = new Map<string, number>();
  private readonly averagesCache = new Map<string, number>();
  private readonly rowClassCache = new WeakMap<any, any>();
  private readonly routerLinkCache = new WeakMap<any, any[] | null>();
  private readonly serialNumberCache = new WeakMap<any, number>();
  private readonly filterCacheKey = signal<string>('');

  // ==================== MEMOIZED TEMPLATE BINDINGS ====================
  // Cache for row-level computed values to avoid recalculating in template
  private readonly rowMemoCache = new WeakMap<T, {
    routerLink: any[] | null;
    rowClass: Readonly<Record<string, boolean | string>>;
    hasBgLightYellow: boolean;
    rowClassWithHover: Readonly<Record<string, boolean | string>>;
  }>();

  // Memoized actions array (only recompute when actions change)
  private readonly actionsArraySignal = signal<readonly (ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>)[]>([]);

  // Computed signal for actions array - uses signal for reactivity
  // Returns mutable array for template compatibility
  readonly memoizedActionsArray = computed(() => {
    return [...this.actionsArraySignal()];
  });

  // Optimized computed signal for filtered data with memoization
  // Uses cache key to avoid unnecessary recomputation
  private readonly filteredDataCache = new Map<string, readonly T[]>();
  private readonly lastFilterKey = signal<string>('');

  readonly filteredData = computed(() => {
    const original = this.originalDataSignal();
    const filters = this.columnFiltersSignal();
    const searchTerm = this.globalSearchTermSignal().toLowerCase().trim();
    const columns = this.displayedColumnsSignal();

    // Create cache key for memoization (optimized: use faster key generation)
    const filterKey = Object.keys(filters).sort().map(k => `${k}:${filters[k]}`).join('|');
    const cacheKey = `${original.length}-${filterKey}-${searchTerm}`;

    // Check if filters haven't changed (fast path)
    const lastKey = this.lastFilterKey();
    if (cacheKey === lastKey && this.filteredDataCache.has(cacheKey)) {
      return this.filteredDataCache.get(cacheKey)!;
    }

    const hasColumnFilters = Object.values(filters).some(v => v?.trim());

    // Early return if no filters (immutable reference)
    if (!hasColumnFilters && !searchTerm) {
      this.lastFilterKey.set(cacheKey);
      this.filteredDataCache.set(cacheKey, original);
      return original;
    }

    // Use slice for efficient immutable copy (faster than spread for large arrays)
    let filtered: readonly T[] = original;

    // Apply column filters first (more specific, faster to reject)
    if (hasColumnFilters && columns.length > 0) {
      // Pre-normalize filters for better performance
      const normalizedFilters = new Map<string, string>();
      const columnKeys = new Set(columns.map(c => c.key));

      Object.entries(filters).forEach(([key, value]) => {
        if (value?.trim() && columnKeys.has(key)) {
          normalizedFilters.set(key, value.toLowerCase());
        }
      });

      // Use for loop for better performance than filter + forEach
      const filteredArray: T[] = [];
      const originalLength = original.length;

      // Pre-allocate array size estimate for better performance
      filteredArray.length = Math.min(originalLength, originalLength * 0.8);
      let writeIndex = 0;

      for (let i = 0; i < originalLength; i++) {
        const item = original[i];
        let matches = true;

        for (const [key, filterValue] of normalizedFilters) {
          const itemValue = item[key];
          // Optimized: avoid string conversion if possible
          if (itemValue == null) {
            matches = false;
            break;
          }

          const itemValueStr = typeof itemValue === 'string'
            ? itemValue.toLowerCase()
            : String(itemValue).toLowerCase();

          if (!itemValueStr.includes(filterValue)) {
            matches = false;
            break; // Early exit on first mismatch
          }
        }

        if (matches) {
          filteredArray[writeIndex++] = item;
        }
      }

      // Trim array to actual size
      filteredArray.length = writeIndex;
      filtered = filteredArray;
    }

    // Apply global search with optimized column lookup
    if (searchTerm && filtered.length > 0 && columns.length > 0) {
      const searchFiltered: T[] = [];
      const columnKeys = columns.map(col => col.key);
      const filteredLength = filtered.length;

      // Pre-allocate array
      searchFiltered.length = Math.min(filteredLength, filteredLength * 0.8);
      let writeIndex = 0;

      for (let i = 0; i < filteredLength; i++) {
        const item = filtered[i];
        let matches = false;

        // Check each column for match (optimized: check most common columns first)
        for (const key of columnKeys) {
          const value = item[key];
          if (value != null) {
            const valueStr = typeof value === 'string'
              ? value.toLowerCase()
              : String(value).toLowerCase();

            if (valueStr.includes(searchTerm)) {
              matches = true;
              break; // Early exit on first match
            }
          }
        }

        if (matches) {
          searchFiltered[writeIndex++] = item;
        }
      }

      // Trim array to actual size
      searchFiltered.length = writeIndex;
      filtered = searchFiltered;
    }

    // Cache result and limit cache size to prevent memory issues
    if (this.filteredDataCache.size > 10) {
      const firstKey = this.filteredDataCache.keys().next().value;
      if (firstKey !== undefined) {
        this.filteredDataCache.delete(firstKey);
      }
    }

    this.lastFilterKey.set(cacheKey);
    this.filteredDataCache.set(cacheKey, filtered);

    return filtered;
  });

  // Legacy filteredTotalCount getter
  get filteredTotalCountValue(): number {
    return this.filteredTotalCount();
  }

  @Input() set dataSource(data: MatTableDataSource<T>) {
    this._dataSource = data;
    const newData = (data.data || []) as readonly T[];

    // STEP 1: Clear all data first before applying new data
    // This ensures table is empty before new data arrives from API
    this.clearTableData();

    // STEP 2: Force immediate table refresh with empty data to show cleared state
    this.cdr.detectChanges();

    // STEP 3: Now apply the new data after clearing
    // Update signals atomically - batch updates for better performance
    this.ngZone.runOutsideAngular(() => {
      this.allDataSignal.set(newData);
      this.originalDataSignal.set([...newData]);
      this.filteredCacheSignal.set([...newData]);
      this.filtersDirtySignal.set(true);
      this.filterCacheKey.set(JSON.stringify(newData.slice(0, 10))); // Cache key for invalidation
    });

    // Legacy property for backward compatibility
    this.allData = newData;
    this._originalData = [...newData];
    this.filteredCache = [...newData];
    this.filtersDirty = true;

    // Apply new data to dataSource
    this._dataSource.data = newData as T[];

    if (this.virtualScrolling) {
      this.loadedItemCountSignal.set(0);
      this.loadedItemCount = 0;
    }

    this.dataSubject.next(newData);
    this.resetCaches();

    if (this.virtualScrolling) {
      this.updateVisibleColumns();
    } else {
      this.visibleColumnsSignal.set(this.displayedColumns ? [...this.displayedColumns] : []);
    }

    if (this.virtualScrolling) {
      if (this.initialLoadCount < 20) {
        this.initialLoadCount = 20;
      }

      this.loadMoreCount = this.pageSize;
      const initialCount = Math.min(this.initialLoadCount, newData.length);
      this.loadedItemCountSignal.set(initialCount);
      this.loadedItemCount = initialCount;

      this.updateVirtualData();
      this.updateVirtualScrollHeight();

      if (this.virtualScroll) {
        this.ngZone.runOutsideAngular(() => {
          setTimeout(() => {
            this.ngZone.run(() => {
              this.virtualScroll.checkViewportSize();
            });
          }, 100);
        });
      }
    } else {
      this.updateDisplayData();
    }

    if (this.paginator && !this.virtualScrolling) {
      this._dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this._dataSource.sort = this.sort;
    }

    this.cdr.markForCheck();
  }

  get dataSource(): MatTableDataSource<T> {
    return this._dataSource;
  }

  // ==================== INPUTS & OUTPUTS (STRICTLY TYPED) ====================
  private _dataSource: MatTableDataSource<T> = new MatTableDataSource<T>();
  @Input() rowClass: (row: T) => Readonly<Record<string, boolean | string>> = () => ({});
  // Accept flexible action button types for backward compatibility
  @Input() set actions(value: readonly (ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown> | undefined | null)[]) {
    // Filter out null/undefined values and store
    this._actions = (value || []).filter((action): action is ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown> =>
      action !== null && action !== undefined
    ) as readonly (ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>)[];

    // Update memoized signal
    this.actionsArraySignal.set([...this._actions]);
  }
  get actions(): readonly (ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>)[] {
    return this._actions;
  }
  private _actions: readonly (ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>)[] = [];
  @Input() showCheckbox: boolean = false;
  @Input() showFooter: boolean = false;
  @Input() routerLinkBase: readonly unknown[] | null = null;
  @Input() showFooterPercentage: boolean = false;
  readonly storageUrl: string = environment.STORAGE_URL;
  @Input() loading: boolean = true;
  @Output() readonly reload = new EventEmitter<void>();
  @Output() readonly footerAction = new EventEmitter<Readonly<Record<string, unknown>>>();
  @Output() readonly actionClick = new EventEmitter<ActionEvent<T>>();
  @Output() readonly checkboxChange = new EventEmitter<{ checked: boolean; row: T }>();
  @Output() readonly columnReordered = new EventEmitter<readonly string[]>();
  @Input() headerButtons: readonly (ActionButton<T> | HeaderButton)[] = [];
  @Input() showExportButton: boolean = true;
  @Input() showPaginator: boolean = true;
  @Input() maxVirtualHeight: string = '70vh';

  // Server-side pagination inputs
  @Input() serverPaginationConfig: TableDataFetchConfig | null = null;
  @Input() enableServerPagination: boolean = false;
  @Input() enablePrefetch: boolean = true;
  @Input() paginationOffset: number = 0;

  // Performance budget input
  @Input() customPerformanceBudget: Partial<PerformanceBudget> | null = null;

  // Signal for all columns (including hidden ones)
  private readonly allColumnsSignal = signal<readonly TableColumn<T>[]>([]);

  private _displayedColumns: TableColumn<T>[] = [];
  // Accept flexible column types for backward compatibility
  @Input() set displayedColumns(value: TableColumn<T>[] | readonly TableColumn<T>[] | readonly (TableColumn<T> | Partial<TableColumn<T>> | Record<string, unknown> | undefined | null)[]) {
    // Filter out null/undefined values and normalize columns to TableColumn format
    const validColumns = (value || []).filter((col): col is TableColumn<T> | Partial<TableColumn<T>> | Record<string, unknown> =>
      col !== null && col !== undefined
    );

    const columns = validColumns.map(col => {
      // If it's already a proper TableColumn, use it as-is
      if (col && typeof col === 'object' && 'key' in col && 'label' in col) {
        return col as TableColumn<T>;
      }
      // Otherwise, try to cast it (for backward compatibility)
      return col as unknown as TableColumn<T>;
    }) as TableColumn<T>[];

    this._displayedColumns = [...columns];
    this.displayedColumnsSignal.set([...columns]);
    this.allColumnsSignal.set([...columns]);
  }
  get displayedColumns(): TableColumn<T>[] {
    return [...this._displayedColumns];
  }
  // Legacy property with signal backing
  get columnFilters(): { [key: string]: string } {
    return this.columnFiltersSignal();
  }

  set columnFilters(value: { [key: string]: string }) {
    this.columnFiltersSignal.set(value);
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Fullscreen mode
  isFullscreen: boolean = false;

  @Input() enableFullscreen: boolean = true; // Allow disabling fullscreen feature
  @Output() fullscreenChange = new EventEmitter<boolean>();
  @Output() globalSearchChange = new EventEmitter<string>();

  // ==================== TYPED INJECTIONS ====================
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly injector = inject(Injector);
  private readonly performanceService = inject(TablePerformanceService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

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
    this.exportPermissionIds.some(id => this.hasPermission(id))
  );

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  constructor() {
    // ✨ Optimized debounced filter with takeUntilDestroyed for automatic cleanup
    // Using switchMap to cancel previous filter operations and shareReplay for efficiency
    this.filterSubject.pipe(
      debounceTime(150), // Reduced from 300ms for faster response
      distinctUntilChanged(), // Skip duplicate filter triggers
      switchMap(() => {
        return this.ngZone.runOutsideAngular(() => {
          return new Observable<void>(observer => {
            this.applyGlobalFilterInternal();
            observer.next();
            observer.complete();
          });
        });
      }),
      shareReplay(1), // Share result across multiple subscribers
      takeUntilDestroyed() // ✨ Auto cleanup on component destroy
    ).subscribe();

    // Merge custom performance budget if provided (moved from ngOnInit)
    if (this.customPerformanceBudget) {
      this.performanceService.updateBudget(this.customPerformanceBudget);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['displayedColumns'] && this.displayedColumns) {
      this.allColumnsSignal.set([...this.displayedColumns]);
      this.displayedColumnsSignal.set([...this.displayedColumns]);

      if (this.virtualScrolling) {
        this.updateVisibleColumns();
      } else {
        this.visibleColumnsSignal.set([...this.displayedColumns]);
      }
    }

    if (changes['virtualScrolling'] && !changes['virtualScrolling'].firstChange) {
      if (this.virtualScrolling) {
        this.updateVisibleColumns();
        this.resetVirtualScroll();
      } else {
        this.visibleColumnsSignal.set([...this.displayedColumns]);
      }
    }
  }

  ngOnInit(): void {
    // Initialize typed properties
    this.indianCurrencyPipe = new IndianCurrencyPipe();
    this.roleId = Number(sessionStorage.getItem('role_id')) || 0;
    this.pipe = new DatePipe('en-US');

    // Merge custom performance budget if provided
    if (this.customPerformanceBudget) {
      Object.assign(this.performanceBudget, this.customPerformanceBudget);
    }

    this.dataSource.filterPredicate = this.createFilter();

    // Initialize column filters
    this.initializeColumnFilters();

    const columns = this.displayedColumns ? [...this.displayedColumns] : [];
    this.allColumnsSignal.set(columns);
    this.displayedColumnsSignal.set(columns);
    this.visibleColumnsSignal.set(columns);
    this.currentPageSignal.set(0);

    // Initialize actions signal
    this.actionsArraySignal.set([...this.actions]);

    // Initialize server pagination config
    if (this.serverPaginationConfig) {
      this.serverPaginationConfigSignal.set(this.serverPaginationConfig);
    }

    // Initialize visible columns for virtual scrolling
    if (this.virtualScrolling) {
      this.updateVisibleColumns();
      // Initialize column visibility for virtualization
      this.visibleColumnRange.set({ start: 0, end: this.displayedColumns.length });
    }

    // Removed duplicate filter subscription - handled in constructor above
    // Filter is now optimized with switchMap and shareReplay for better performance

    // ✨ Optimized data change listener with shareReplay and takeUntilDestroyed
    this.dataSubject.pipe(
      distinctUntilChanged((prev, curr) => prev.length === curr.length &&
        prev.length > 0 && curr.length > 0 && prev[0] === curr[0]),
      shareReplay(1),
      takeUntilDestroyed(this.destroyRef) // ✨ Auto cleanup
    ).subscribe(data => {
      this.allData = data;
      this.allDataSignal.set(data);
      if (this.virtualScrolling) {
        this.filteredCache = [...data];
        this.filteredCacheSignal.set([...data]);
        this.filtersDirtySignal.set(true);
        this.filtersDirty = true;
        this.updateVirtualData(true);
      } else {
        this.updateDisplayData();
      }
    });


    // Ensure initial load count is set
    if (this.virtualScrolling && this.initialLoadCount < 20) {
      this.initialLoadCount = 20; // Force minimum of 20 records for initial load
    }

    // Set up window resize handler for virtual scrolling
    if (this.virtualScrolling) {
      // Calculate initial height
      this.updateVirtualScrollHeight();

      // Force recalculation after a short delay to ensure DOM is ready
      setTimeout(() => {
        this.updateVirtualScrollHeight();
      }, 200);
    }

    // ✨ Optimized window resize handler with debouncing and takeUntilDestroyed
    if (this.virtualScrolling && isPlatformBrowser(this.platformId)) {
      this.resizeSubject.pipe(
        debounceTime(200), // Increased debounce for resize to reduce recalculations
        throttleTime(100, undefined, { leading: false, trailing: true }), // Only trailing to avoid layout thrashing
        shareReplay(1),
        switchMap(() => {
          return this.ngZone.runOutsideAngular(() => {
            return new Observable<void>(observer => {
              this.updateVirtualScrollHeight();
              requestAnimationFrame(() => {
                this.ngZone.run(() => {
                  observer.next();
                  observer.complete();
                });
              });
            });
          });
        }),
        takeUntilDestroyed(this.destroyRef) // ✨ Auto cleanup
      ).subscribe();

      // Subscribe to actual resize events
      fromEvent(window, 'resize')
        .pipe(
          takeUntilDestroyed(this.destroyRef) // ✨ Auto cleanup
        )
        .subscribe(() => this.resizeSubject.next());
    }

    // ✨ Set up keyboard listeners for fullscreen mode with takeUntilDestroyed
    if (this.enableFullscreen && isPlatformBrowser(this.platformId)) {
      const escHandler = this.handleEscKey.bind(this);
      fromEvent<KeyboardEvent>(document, 'keydown')
        .pipe(
          filter(event => event.key === 'Escape' && this.isFullscreen),
          takeUntilDestroyed(this.destroyRef) // ✨ Auto cleanup
        )
        .subscribe(event => escHandler(event));
    }

    // Initialize performance monitoring
    if (isPlatformBrowser(this.platformId)) {
      this.initializePerformanceMonitoring();
    }
  }

  // ==================== SERVER-SIDE PAGINATION METHODS ====================

  /**
   * Fetches data from server with cursor-based pagination
   * Uses switchMap to cancel previous requests and exhaustMap to prevent concurrent fetches
   */
  private fetchServerData(params: ServerPaginationRequest): Observable<ServerPaginationResponse<T>> {
    if (!this.http || !this.serverPaginationConfigSignal()) {
      return EMPTY;
    }

    const config = this.serverPaginationConfigSignal()!;
    const startTime = performance.now();
    this.isFetchingData.set(true);

    const requestParams = this.buildServerRequestParams(params, config);
    const request = config.method === 'GET'
      ? this.http.get<ServerPaginationResponse<T>>(config.endpoint, { params: requestParams })
      : this.http.post<ServerPaginationResponse<T>>(config.endpoint, params, { headers: config.headers });

    return request.pipe(
      retry(config.retryAttempts || 3),
      tap((response) => {
        const loadTime = performance.now() - startTime;
        this.updatePerformanceMetric('dataLoadTime', loadTime);
        this.hasMoreData.set(response.hasMore);
        this.currentCursor.set(response.nextCursor || null);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Server pagination error:', error);
        this.snackBar.open('Failed to load data', 'Close', { duration: 3000 });
        return EMPTY;
      }),
      finalize(() => {
        this.isFetchingData.set(false);
      })
    );
  }

  /**
   * Prefetches next page of data when approaching end of current data
   * Uses exhaustMap to prevent concurrent prefetch requests and switchMap to cancel previous ones
   * Implements viewport-aware prefetching with buffered windows
   */
  private prefetchNextPage(): void {
    if (!this.enablePrefetch || !this.hasMoreData() || this.isFetchingData()) {
      return;
    }

    const visibleRange = this.visibleRangeSignal();
    const loadedCount = this.loadedItemCountSignal();
    const prefetchThreshold = loadedCount - this.prefetchBuffer();

    // Viewport-aware prefetching: only prefetch when user is approaching the buffer threshold
    if (visibleRange.end >= prefetchThreshold) {
      const request: ServerPaginationRequest = {
        cursor: this.currentCursor(),
        limit: this.pageSize,
        sortBy: this.sort?.active || undefined,
        sortOrder: (this.sort?.direction as 'asc' | 'desc') || undefined,
        filters: this.buildFiltersForServer(),
        searchTerm: this.globalSearchTermSignal()
      };

      // Use exhaustMap to prevent concurrent prefetches, switchMap would cancel previous
      // but we want to complete previous prefetches, so exhaustMap is better here
      this.fetchServerData(request)
        .pipe(
          exhaustMap((response) => {
            return this.ngZone.runOutsideAngular(() => {
              return new Observable<void>(observer => {
                // Use requestIdleCallback for non-blocking prefetch
                if (isPlatformBrowser(this.platformId) && 'requestIdleCallback' in window) {
                  requestIdleCallback(() => {
                    const currentData = this.allDataSignal();
                    const newData = Object.freeze([...currentData, ...response.data]) as readonly T[];
                    this.allDataSignal.set(newData);

                    this.ngZone.run(() => {
                      this.updateVirtualData();
                      observer.next();
                      observer.complete();
                    });
                  }, { timeout: 100 });
                } else {
                  requestAnimationFrame(() => {
                    const currentData = this.allDataSignal();
                    const newData = Object.freeze([...currentData, ...response.data]) as readonly T[];
                    this.allDataSignal.set(newData);

                    this.ngZone.run(() => {
                      this.updateVirtualData();
                      observer.next();
                      observer.complete();
                    });
                  });
                }
              });
            });
          }),
          catchError((error: HttpErrorResponse) => {
            // Silently fail prefetch - don't show error to user
            console.warn('Prefetch failed:', error);
            return EMPTY;
          }),
          takeUntil(this.prefetchCancel$),
          takeUntilDestroyed(this.destroyRef) // ✨ Auto cleanup
        )
        .subscribe();
    }
  }

  private buildServerRequestParams(
    params: ServerPaginationRequest,
    config: TableDataFetchConfig
  ): HttpParams {
    let httpParams = new HttpParams();

    if (config.enableCursorPagination && params.cursor) {
      httpParams = httpParams.set('cursor', params.cursor);
    } else if (params.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    httpParams = httpParams.set('limit', params.limit.toString());

    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
      httpParams = httpParams.set('sortOrder', params.sortOrder || 'asc');
    }

    if (params.searchTerm) {
      httpParams = httpParams.set('search', params.searchTerm);
    }

    return httpParams;
  }

  private buildFiltersForServer(): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    const columnFilters = this.columnFiltersSignal();

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value?.trim()) {
        filters[key] = value;
      }
    });

    return filters;
  }

  // ==================== PERFORMANCE MONITORING ====================

  private initializePerformanceMonitoring(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Monitor scroll FPS
    let lastFrameTime = performance.now();
    let frameCount = 0;

    const measureScrollFPS = () => {
      if (this.isScrolling()) {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - lastFrameTime;

        if (elapsed >= 1000) {
          const fps = Math.round((frameCount * 1000) / elapsed);
          this.updatePerformanceMetric('scrollFPS', fps);
          frameCount = 0;
          lastFrameTime = currentTime;

          // Check performance budget
          this.checkPerformanceBudget();
        }
      } else {
        frameCount = 0;
        lastFrameTime = performance.now();
      }

      if (isPlatformBrowser(this.platformId)) {
        requestAnimationFrame(measureScrollFPS);
      }
    };

    requestAnimationFrame(measureScrollFPS);

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const measureMemory = () => {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        this.updatePerformanceMetric('memoryUsage', memory.usedJSHeapSize);
        this.checkPerformanceBudget();
      };

      timer(0, 5000)
        .pipe(takeUntilDestroyed(this.destroyRef)) // ✨ Auto cleanup
        .subscribe(() => measureMemory());
    }

    // Monitor DOM nodes periodically
    timer(0, 10000)
      .pipe(takeUntilDestroyed(this.destroyRef)) // ✨ Auto cleanup
      .subscribe(() => this.measureDomNodes());
  }

  private updatePerformanceMetric<K extends keyof PerformanceMetrics>(
    key: K,
    value: PerformanceMetrics[K]
  ): void {
    this.performanceMetrics.update(metrics => ({
      ...metrics,
      [key]: value
    }));
  }

  private checkPerformanceBudget(): void {
    const metrics = this.performanceMetrics();
    const budget = this.performanceBudget;
    const violations: string[] = [];

    if (metrics.scrollFPS < budget.minScrollFPS) {
      violations.push(`Scroll FPS ${metrics.scrollFPS} < ${budget.minScrollFPS}`);
    }

    if (metrics.dataLoadTime > budget.maxDataLoadTime) {
      violations.push(`Data load time ${metrics.dataLoadTime}ms > ${budget.maxDataLoadTime}ms`);
    }

    if (budget.maxMemoryUsage && metrics.memoryUsage && metrics.memoryUsage > budget.maxMemoryUsage) {
      violations.push(`Memory usage ${metrics.memoryUsage} > ${budget.maxMemoryUsage}`);
    }

    if (budget.maxDomNodes && metrics.domNodes && metrics.domNodes > budget.maxDomNodes) {
      violations.push(`DOM nodes ${metrics.domNodes} > ${budget.maxDomNodes}`);
    }

    if (violations.length > 0) {
      console.warn(`Performance budget exceeded:\n${violations.join('\n')}`);

      // Emit performance warning event for monitoring
      if (isPlatformBrowser(this.platformId)) {
        // Could emit to analytics service here
        this.performanceMetrics.update(m => ({
          ...m,
          // Mark as violated
        }));
      }
    }
  }

  /**
   * Measures DOM node count for performance monitoring
   */
  private measureDomNodes(): void {
    if (!isPlatformBrowser(this.platformId) || !this.virtualScroll) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      requestIdleCallback(() => {
        try {
          const viewportElement = this.virtualScroll.elementRef.nativeElement;
          const nodeCount = viewportElement.querySelectorAll('*').length;
          this.updatePerformanceMetric('domNodes', nodeCount);
        } catch (e) {
          // Silently fail DOM measurement
        }
      }, { timeout: 1000 });
    });
  }

  // ==================== FILTER RESET METHOD ====================

  private resetAllFilters(): void {
    this.globalSearchTermSignal.set('');
    this.columnFiltersSignal.set({});
    this.filtersDirtySignal.set(true);
    this.resetCaches();
    this.cdr.markForCheck();
  }

  // Initialize column filters for all displayed columns
  private initializeColumnFilters() {
    const filters: { [key: string]: string } = {};
    if (this.displayedColumns) {
      this.displayedColumns.forEach(column => {
        filters[column.key] = '';
      });
    }
    this.columnFiltersSignal.set(filters);
    this.columnFilters = filters;
  }

  // Update individual column filter value
  updateColumnFilter(columnKey: string, value: string): void {
    const currentFilters = { ...this.columnFiltersSignal() };
    if (value === '' || value == null) {
      delete currentFilters[columnKey];
    } else {
      currentFilters[columnKey] = value;
    }
    this.columnFiltersSignal.set(currentFilters);
    this.columnFilters = currentFilters;
  }

  private readonly roleData = sessionStorage.getItem('role_id');
  hasOnlyRoles(allowedRoles: number[]): boolean {
    if (!this.roleData) {
      return false;
    }
    const userRoles = this.roleData
      .split(',')
      .map((role) => Number(role.trim()))
      .filter((role) => !isNaN(role));

    // Return true if user has at least one of the allowed roles
    return userRoles.some((role) => allowedRoles.includes(role));
  }



  updateVisibleColumns() {
    if (!this.displayedColumns || this.displayedColumns.length === 0) {
      this.visibleColumnsSignal.set([]);
      return;
    }

    const baseColumns = [...this.displayedColumns];

    if (!this.virtualScrolling || this.maxVisibleColumns <= 0 || baseColumns.length <= this.maxVisibleColumns) {
      this.visibleColumnsSignal.set(baseColumns);
      this.cdr.markForCheck();
      return;
    }

    // First, include all priority columns
    const priorityColumnsObjects = baseColumns.filter(col =>
      this.priorityColumns.includes(col.key) ||
      col.key === 'actions' || // Always include actions column
      col.sticky === true || // Always include sticky columns
      col.type === 'index'   // Always include index column
    );

    // Calculate how many non-priority columns we can show
    const remainingSlots = Math.max(this.maxVisibleColumns - priorityColumnsObjects.length, 0);

    if (remainingSlots === 0) {
      // If priority columns exceed max, just show priority columns up to max
      this.visibleColumnsSignal.set(priorityColumnsObjects.slice(0, this.maxVisibleColumns));
    } else {
      // Get non-priority columns
      const nonPriorityColumns = baseColumns.filter(col =>
        !this.priorityColumns.includes(col.key) &&
        col.key !== 'actions' &&
        col.sticky !== true &&
        col.type !== 'index'
      );

      // Take only the number of non-priority columns that will fit
      const selectedNonPriorityColumns = nonPriorityColumns.slice(0, remainingSlots);

      // Combine priority and selected non-priority columns
      const combinedColumns = [...priorityColumnsObjects, ...selectedNonPriorityColumns];

      // Sort columns to maintain the original order
      combinedColumns.sort((a, b) => {
        return baseColumns.findIndex(col => col.key === a.key) -
          baseColumns.findIndex(col => col.key === b.key);
      });

      this.visibleColumnsSignal.set(combinedColumns);
    }

    this.cdr.markForCheck();
  }

  /**
   * Gets the keys of visible columns for the template
   */
  getVisibleColumnKeys(): string[] {
    return [...this.activeColumnKeys()];
  }

  // Update virtual scroll height based on data
  updateVirtualScrollHeight() {
    // Calculate the viewport height - adjust based on surrounding elements
    const viewportHeight = window.innerHeight;

    // Estimate header/footer/other UI elements height (adjust these values based on your layout)
    const headerHeight = 80; // App header/navbar
    const tableControlsHeight = 60; // Search and action buttons
    const statusBarHeight = 30; // Bottom status bar/pagination
    const otherElementsHeight = 30; // Margins, padding, etc.

    // Calculate available height for the table
    let availableHeight = viewportHeight - (headerHeight + tableControlsHeight + statusBarHeight + otherElementsHeight);

    // If in fullscreen mode, use almost the entire viewport
    if (this.isFullscreen) {
      availableHeight = viewportHeight - (tableControlsHeight + statusBarHeight);
    }

    // Ensure minimum height while respecting available space
    const minHeight = 400;
    const calculatedHeight = Math.max(availableHeight, minHeight);

    // Set the height
    this.virtualScrollHeight = `${calculatedHeight}px`;


    // Force viewport check on next tick
    setTimeout(() => {
      if (this.virtualScroll) {
        this.virtualScroll.checkViewportSize();
        this.cdr.markForCheck();
      }
    }, 100);
  }

  // Convert maxVirtualHeight to pixels - simplified version
  private getMaxHeightInPixels(): number {
    // Return calculated height based on viewport
    return window.innerHeight * 0.7;
  }

  // Optimized TrackBy functions with enhanced caching
  private readonly trackByCache = new WeakMap<T, string | number>();
  private readonly trackByColumnCache = new WeakMap<TableColumn<T>, string>();
  private readonly rowIdCache = new Map<string | number, T>();

  /**
   * Enhanced trackBy function with better caching and ID resolution
   * Uses WeakMap for automatic garbage collection and Map for reverse lookup
   */
  trackByFn = (index: number, item: T): string | number => {
    // Handle null/undefined
    if (!item) return index;

    // Use cached ID if available (fast path)
    try {
      if (this.trackByCache.has(item)) {
        return this.trackByCache.get(item)!;
      }
    } catch (e) {
      // Fallback if WeakMap operation fails
    }

    // Resolve ID from item with multiple fallback strategies
    let id: string | number;
    if (item.id !== undefined && item.id !== null) {
      id = item.id as string | number;
    } else if (item[this.idProperty] !== undefined && item[this.idProperty] !== null) {
      id = item[this.idProperty] as string | number;
    } else {
      // Generate stable ID based on object reference for items without explicit ID
      id = `row-${index}-${Object.keys(item).length}`;
    }

    // Cache it for future lookups
    try {
      if (typeof item === 'object' && item !== null) {
        this.trackByCache.set(item, id);
        // Also cache reverse lookup for quick item retrieval
        this.rowIdCache.set(id, item);
      }
    } catch (e) {
      // Ignore caching errors
    }

    return id;
  }

  /**
   * Optimized trackBy for columns with caching
   */
  trackByColumn = (index: number, column: TableColumn<T>): string => {
    if (!column) return `col-${index}`;

    // Use cached key if available
    try {
      if (this.trackByColumnCache.has(column)) {
        return this.trackByColumnCache.get(column)!;
      }
    } catch (e) {
      // Fallback if WeakMap operation fails
    }

    const key: string = column.key ?? column.label ?? `col-${index}`;

    // Cache it
    try {
      this.trackByColumnCache.set(column, key);
    } catch (e) {
      // Ignore caching errors
    }

    return key;
  }

  /**
   * Optimized trackBy for rows - delegates to trackByFn
   */
  trackByRow = (index: number, row: T): string | number => {
    return this.trackByFn(index, row);
  };

  trackByButton = (index: number, button: ActionButton<T> | HeaderButton): string | number => {
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };

    if (isHeaderButton(button)) {
      return button.label || `btn-${index}`;
    }
    const actionBtn = button as ActionButton<T>;
    return actionBtn.label || `btn-${index}`;
  };


  // In your component class
  handleCellClick(column: TableColumn<T>, row: T): void {
    if (column.clickable) {
      // First check if there's a custom onClick handler
      if (column.onClick && typeof column.onClick === 'function') {
        // Execute the onClick function with the row data
        column.onClick(row);
      }

      // Then check for route navigation
      if (column.route) {
        const route = column.route(row);
        const queryParams = column.queryParams ? column.queryParams(row) : undefined;
        const state = column.state ? column.state(row) : undefined;

        if (route) {
          this.router.navigate([...route], {
            queryParams,
            state
          });
        }
      }
    }
  }

  getSerialNumber(index: number): number {
    if (this.virtualScrolling) {
      // For virtual scrolling, use the visible range start + index
      return this.visibleRange.start + index + 1;
    } else if (this.showPaginator) {
      // When using mat-paginator (child pagination)
      return this.currentPage * this.pageSize + index + 1;
    } else {
      // When using parent pagination
      return this.paginationOffset + index + 1;
    }
  }

  ngAfterViewInit() {
    if (!this.virtualScrolling) {
      this.dataSource.paginator = this.paginator;
    }
    this.dataSource.sort = this.sort;

    if (this.virtualScrolling && this.virtualScroll) {
      // Force initial data load if not already loaded
      if (this.loadedItemCount < this.initialLoadCount) {
        this.loadedItemCount = Math.min(this.initialLoadCount, this.allData.length);
        this.updateVirtualData();
      }

      // Consolidated and optimized scroll tracking with better RxJS operators
      // Combines scrolledIndexChange and renderedRangeStream for maximum efficiency
      const scrollIndex$ = this.virtualScroll.scrolledIndexChange.pipe(
        filter((index): index is number => index !== null && index !== undefined),
        shareReplay(1)
      );

      const renderedRange$ = this.virtualScroll.renderedRangeStream.pipe(
        shareReplay(1)
      );

      // Optimized scroll handling with combined streams
      scrollIndex$.pipe(
        auditTime(16), // ~60fps - aligns with browser repaint cycles
        distinctUntilChanged(),
        switchMap((index: number) => {
          return this.ngZone.runOutsideAngular(() => {
            return new Observable<void>(observer => {
              // Use requestIdleCallback for non-blocking scroll handling
              const handleScroll = () => {
                const loadedCount = this.loadedItemCountSignal();
                const filteredCache = this.filteredCacheSignal();
                const allDataLength = filteredCache.length;
                const isLoading = this.isLoadingMoreSignal();

                // Calculate dynamic thresholds based on buffer size and viewport
                const bufferItems = Math.max(this.bufferSize, 10);
                const loadThreshold = Math.max(0, loadedCount - bufferItems);
                const prefetchThreshold = Math.max(0, loadedCount - this.prefetchBuffer());

                // Smart prefetching: only load when approaching threshold
                if (index >= loadThreshold && !isLoading && loadedCount < allDataLength) {
                  this.loadMoreItems();
                }

                // Prefetch next page if enabled and within threshold
                if (this.enablePrefetch && index >= prefetchThreshold && !isLoading && loadedCount < allDataLength) {
                  this.prefetchNextPage();
                }

                // Emit scroll index change
                this.scrollIndexChange.emit(index);

                this.ngZone.run(() => {
                  observer.next();
                  observer.complete();
                  this.cdr.markForCheck();
                });
              };

              // Optimized scroll handling with frame-based scheduling
              if (isPlatformBrowser(this.platformId) && 'requestIdleCallback' in window) {
                requestIdleCallback(handleScroll, { timeout: 16 });
              } else {
                // Use requestAnimationFrame for smoother 60fps scrolling
                requestAnimationFrame(() => {
                  requestAnimationFrame(handleScroll); // Double RAF for better timing
                });
              }
            });
          });
        }),
        takeUntilDestroyed(this.destroyRef) // ✨ Auto cleanup
      ).subscribe();

      // Subscribe to actual scroll events for immediate updates
      scrollIndex$.pipe(
        takeUntilDestroyed(this.destroyRef) // ✨ Auto cleanup
      ).subscribe((index: number) => {
        this.scrollSubject.next(index);
      });

      // Enhanced rendered range tracking with optimized debouncing
      renderedRange$.pipe(
        auditTime(16), // Match frame rate (60fps) for smoother updates
        distinctUntilChanged((prev: { start: number; end: number }, curr: { start: number; end: number }) =>
          prev.start === curr.start && prev.end === curr.end
        ),
        shareReplay(1), // Share range updates across subscribers
        switchMap((range: { start: number; end: number }) => {
          return this.ngZone.runOutsideAngular(() => {
            return new Observable<typeof range>(observer => {
              // Use requestIdleCallback for non-blocking range updates
              const updateRange = () => {
                this.ngZone.run(() => {
                  this.visibleRangeSignal.set(range);
                  this.visibleRange = range;

                  // Update item size estimation based on visible range
                  if (range.end - range.start > 0) {
                    this.updateEstimatedItemSize();
                  }

                  // Update column virtualization based on horizontal scroll
                  this.updateColumnVisibility();

                  observer.next(range);
                  observer.complete();
                  this.cdr.markForCheck();
                });
              };

              // Optimized range update with frame-based scheduling
              if (isPlatformBrowser(this.platformId) && 'requestIdleCallback' in window) {
                requestIdleCallback(updateRange, { timeout: 50 });
              } else {
                // Batch range updates for better performance
                requestAnimationFrame(() => {
                  requestAnimationFrame(updateRange);
                });
              }
            });
          });
        }),
        takeUntilDestroyed(this.destroyRef) // ✨ Auto cleanup
      ).subscribe();

      // Force a check for initial rendering and scroll to top
      setTimeout(() => {
        if (this.virtualScroll) {
          this.virtualScroll.checkViewportSize();
          this.virtualScroll.scrollToIndex(0);

          // Enhanced scroll listener with passive option for better performance
          // Consolidated with scrolledIndexChange stream above - removed duplicate logic
          // This is now handled by the optimized scrollIndex$ stream
        }
      }, 100);
    }

    // ✨ Listen for sort changes with takeUntilDestroyed
    if (this.sort) {
      this.sort.sortChange
        .pipe(takeUntilDestroyed(this.destroyRef)) // ✨ Auto cleanup
        .subscribe(() => {
          this.resetCaches();
          if (this.virtualScrolling) {
            this.invalidateVirtualCache();
            this.updateVirtualData();
          }
          this.cdr.markForCheck();
        });
    }
  }

  ngOnDestroy() {
    // ✨ Simplified ngOnDestroy - subscriptions auto-cleanup via takeUntilDestroyed()

    // Cancel any pending RAF
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Clear any pending scroll timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    // ✨ No need to manually unsubscribe - takeUntilDestroyed() handles it automatically

    // If component is destroyed while in fullscreen mode, restore UI elements
    if (this.isFullscreen) {
      // Restore navbar and sidebar
      const navbar = document.querySelector('app-navbar') as HTMLElement;
      const sidebar = document.querySelector('app-sidebar') as HTMLElement;
      const footer = document.querySelector('app-footer') as HTMLElement;

      if (navbar) navbar.style.display = '';
      if (sidebar) sidebar.style.display = '';
      if (footer) footer.style.display = '';

      // Restore body state
      document.body.style.overflow = '';
      document.body.classList.remove('table-fullscreen-active');
    }

    // Clear all caches
    this.resetCaches();

    // Clear computed maps
    this.totalsComputed.clear();
    this.averagesComputed.clear();
  }

  /**
   * Clears all table data - called before loading new data from API
   * Ensures table is empty before new data arrives
   */
  private clearTableData(): void {
    // Clear dataSource
    this._dataSource.data = [];

    // Clear all signals
    this.allDataSignal.set([]);
    this.originalDataSignal.set([]);
    this.filteredCacheSignal.set([]);
    this.virtualData.set([]);

    // Clear legacy properties
    this.allData = [];
    this._originalData = [];
    this.filteredCache = [];

    // Reset virtual scrolling state
    if (this.virtualScrolling) {
      this.loadedItemCountSignal.set(0);
      this.loadedItemCount = 0;
    }
  }

  // Reset memoization caches
  /**
   * Resets all caches for better memory management
   * Called when data changes significantly
   */
  private resetCaches(): void {
    this.totalsCache.clear();
    this.averagesCache.clear();
    this.totalsComputed.clear();
    this.averagesComputed.clear();
    this.filteredDataCache.clear();
    // Note: WeakMaps (trackByCache, rowClassCache, routerLinkCache, trackByColumnCache, rowMemoCache, colorConditionCache) auto-garbage collect
    // No need to manually clear them - they will be garbage collected when objects are no longer referenced
  }

  /**
   * Updates column visibility based on horizontal scroll position
   * Only renders visible columns for better performance with many columns
   */
  private updateColumnVisibility(): void {
    if (!isPlatformBrowser(this.platformId) || !this.virtualScroll) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const viewportElement = this.virtualScroll.elementRef.nativeElement;
      const scrollLeft = viewportElement.scrollLeft || 0;
      const viewportWidth = viewportElement.clientWidth || 0;

      // Only update if scroll position changed significantly (avoid micro-updates)
      const currentScrollLeft = this.columnScrollLeft();
      if (Math.abs(scrollLeft - currentScrollLeft) < 50 && viewportWidth === this.columnViewportWidth()) {
        return; // Skip if change is too small
      }

      this.columnScrollLeft.set(scrollLeft);
      this.columnViewportWidth.set(viewportWidth);

      // Calculate which columns are visible
      const columns = this.activeColumns();
      if (columns.length <= 20) {
        // Don't virtualize if few columns
        this.visibleColumnRange.set({ start: 0, end: columns.length });
        return;
      }

      // Estimate column widths (default to 150px if not specified)
      let currentLeft = 0;
      let startIndex = 0;
      let endIndex = columns.length;

      // Find start index
      for (let i = 0; i < columns.length; i++) {
        const colWidth = columns[i].minWidth || 150;
        if (currentLeft + colWidth >= scrollLeft) {
          startIndex = Math.max(0, i - 1);
          break;
        }
        currentLeft += colWidth;
      }

      // Find end index
      currentLeft = 0;
      for (let i = 0; i < columns.length; i++) {
        const colWidth = columns[i].minWidth || 150;
        currentLeft += colWidth;
        if (currentLeft >= scrollLeft + viewportWidth) {
          endIndex = Math.min(columns.length, i + 2);
          break;
        }
      }

      this.visibleColumnRange.set({ start: startIndex, end: endIndex });
    });
  }

  getColumnKeys(): string[] {
    return [...this.activeColumnKeys()];
  }

  shouldShowButton(button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown>): boolean {
    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };

    if (isHeaderButton(button)) {
      // HeaderButton: show is a function with no params
      return button.show ? button.show() : true;
    }

    // Handle ActionButton or flexible object
    const actionBtn = button as ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>;

    // If show is not provided, default to true (backward compatibility)
    if (!('show' in actionBtn) || actionBtn.show === undefined) {
      return true;
    }

    // Handle show as function
    if (typeof actionBtn.show === 'function') {
      // Check if function takes no parameters (() => boolean) or one parameter ((row) => boolean)
      try {
        // Try calling with empty object first
        const result = (actionBtn.show as ((row?: Record<string, unknown>) => boolean))({} as Record<string, unknown>);
        return result;
      } catch {
        // If that fails, try calling with no parameters
        try {
          return (actionBtn.show as (() => boolean))();
        } catch {
          return true; // Default to showing if function call fails
        }
      }
    }

    // Handle show as boolean
    return !!actionBtn.show;
  }

  // Helper methods for template compatibility
  getButtonColor(button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown>): string {
    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };

    if (isHeaderButton(button)) {
      // HeaderButton: color is always a string
      return button.color || 'primary';
    }

    // Handle ActionButton or flexible object
    const actionBtn = button as ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>;

    // Get color, defaulting to 'primary' if not provided
    if ('color' in actionBtn && actionBtn.color) {
      return String(actionBtn.color);
    }

    return 'primary'; // Default color
  }

  isButtonDisabled(button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown>): boolean {
    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };

    if (isHeaderButton(button)) {
      // HeaderButton: disabled is a function with no params
      return button.disabled ? button.disabled() : false;
    }

    // Handle ActionButton or flexible object
    const actionBtn = button as ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>;

    if (!('disabled' in actionBtn) || actionBtn.disabled === undefined) {
      return false;
    }

    if (typeof actionBtn.disabled === 'function') {
      try {
        // Try calling with empty object first (for row-based functions)
        return (actionBtn.disabled as ((row?: Record<string, unknown>) => boolean))({} as Record<string, unknown>);
      } catch {
        // If that fails, try calling with no parameters
        try {
          return (actionBtn.disabled as (() => boolean))();
        } catch {
          return false; // Default to enabled if function call fails
        }
      }
    }

    return !!actionBtn.disabled;
  }

  handleButtonAction(button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown>): void {
    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };

    if (isHeaderButton(button)) {
      // HeaderButton: action is a function
      button.action();
      return;
    }

    // ActionButton has action as a string - this is handled by the action-column component
    // This method is mainly for header buttons
  }

  getButtonLabel(button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown>): string {
    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };

    if (isHeaderButton(button)) {
      // HeaderButton always has label
      return button.label || '';
    }

    // Handle ActionButton or flexible object
    const actionBtn = button as ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>;

    // Try label first
    if ('label' in actionBtn && actionBtn.label && typeof actionBtn.label === 'string') {
      return actionBtn.label;
    }

    // Fallback to tooltip
    if ('tooltip' in actionBtn && actionBtn.tooltip && typeof actionBtn.tooltip === 'string') {
      return actionBtn.tooltip;
    }

    return '';
  }

  getButtonTooltip(button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown>): string | undefined {
    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };

    const btn = isHeaderButton(button) ? button : (button as ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>);

    if ('tooltip' in btn && btn.tooltip && typeof btn.tooltip === 'string') {
      return btn.tooltip;
    }

    // Fallback to label if no tooltip
    if ('label' in btn && btn.label && typeof btn.label === 'string') {
      return btn.label;
    }

    return undefined;
  }

  getButtonIcon(button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown>): string {
    // Both types have icon as required string
    if ('icon' in button && typeof button.icon === 'string') {
      return button.icon;
    }
    return '';
  }

  // Helper to safely call colorCondition with strict typing
  // Memoized for better performance
  private readonly colorConditionCache = new WeakMap<T, Map<string, ColorConditionResult | null>>();

  getColorConditionResult(column: TableColumn<T>, element: T): ColorConditionResult | null {
    if (!column.colorCondition) {
      return null;
    }

    // Check cache first
    if (this.colorConditionCache.has(element)) {
      const columnCache = this.colorConditionCache.get(element)!;
      if (columnCache.has(column.key)) {
        return columnCache.get(column.key)!;
      }
    }

    try {
      const result = column.colorCondition(element);

      // Cache the result
      if (!this.colorConditionCache.has(element)) {
        this.colorConditionCache.set(element, new Map());
      }
      this.colorConditionCache.get(element)!.set(column.key, result);

      return result;
    } catch {
      return null;
    }
  }

  // Helper to convert readonly actions array to mutable array for action-column component
  // Optimized: Use memoized signal instead of creating new array each time
  getActionsArray(): (ActionButton<T> | Partial<ActionButton<T>> | Record<string, unknown>)[] {
    return [...this.memoizedActionsArray()];
  }


  openColumnSelector(event: MouseEvent) {
    event.stopPropagation();

    // Callback that applies changes in real-time as user toggles columns (optional preview)
    const onSelectionChange = (selectedKeys: string[]) => {
      // This is called in real-time for preview, but we'll apply on dialog close
      // Keeping for backward compatibility if needed
    };

    // Open the dialog and pass columns + callback
    const dialogRef = this.dialog.open(AdvancedFilterDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        columns: this.allColumnsSignal().map(col => ({
          key: col.key,
          label: col.label,
          type: col.type,
          sticky: col.sticky,
          selected: this.displayedColumns.some(d => d.key === col.key),
          disabled: col.key === 'actions' || col.type === 'index' || col.sticky === true
        })),
        selectedColumnKeys: [...this.displayedColumns.map(col => col.key)],
        onSelectionChange
      }
    });

    // Handle dialog close - apply the final selection
    dialogRef.afterClosed().subscribe((result: string[] | undefined) => {
      if (result && Array.isArray(result)) {
        // Apply the final selection
        if (this.virtualScrolling) {
          // For virtual scrolling, update displayedColumns directly
          // Ensure mandatory columns remain
          const mandatoryColumns = this.allColumnsSignal().filter((col: TableColumn<T>) =>
            col.key === 'actions' || col.type === 'index' || col.sticky === true
          ).map(col => col.key);

          // Combine selected columns with mandatory columns
          const allSelectedKeys = [...new Set([...result, ...mandatoryColumns])];

          // Maintain original column order from allColumns
          const orderedColumns = this.allColumnsSignal().filter((col: TableColumn<T>) =>
            allSelectedKeys.includes(col.key)
          );

          // Update displayedColumns with ordered columns
          this.displayedColumns = [...orderedColumns];

          // Update priorityColumns to match selected columns (for maxVisibleColumns logic)
          this.priorityColumns = result.filter(key => !mandatoryColumns.includes(key));

          // Recalculate visible columns
          this.updateVisibleColumns();

          // Refresh virtual scroll viewport
          if (this.virtualScroll) {
            // Force viewport to recalculate after column changes
            // Use ngZone to ensure it runs in Angular zone
            this.ngZone.run(() => {
              setTimeout(() => {
                // Update virtual data first to reflect column changes
                this.updateVirtualData(true);
                // Then check viewport size
                this.virtualScroll.checkViewportSize();
                this.cdr.markForCheck();
              }, 0);
            });
          } else {
            this.cdr.markForCheck();
          }
        } else {
          // For regular tables we rebuild displayedColumns array
          let selectedColumns = this.allColumnsSignal().filter((col: TableColumn<T>) => result.includes(col.key));

          // Ensure mandatory columns remain (should already be in result, but double-check)
          const mandatoryColumns = this.allColumnsSignal().filter((col: TableColumn<T>) =>
            col.key === 'actions' || col.type === 'index' || col.sticky === true
          );
          mandatoryColumns.forEach(col => {
            if (!selectedColumns.some(sc => sc.key === col.key)) {
              selectedColumns.push(col);
            }
          });

          // Maintain original column order
          const orderedColumns = this.allColumnsSignal().filter((col: TableColumn<T>) =>
            selectedColumns.some(sc => sc.key === col.key)
          );

          this.displayedColumns = orderedColumns;
          this.updateTableColumns();
          this.displayedColumnsSignal.set([...this.displayedColumns]);
          this.cdr.markForCheck();
        }
      }
    });
  }

  // Computed signal for totals - automatically updates when data/filters change
  private readonly totalsComputed = new Map<string, () => number>();

  getTotal(key: string): number {
    // Create computed signal for this total if it doesn't exist
    if (!this.totalsComputed.has(key)) {
      this.totalsComputed.set(key, computed(() => {
        const sourceData = this.virtualScrolling
          ? this.filteredCacheSignal()
          : (this.virtualScrolling ? this.filteredData() : this.dataSource.data);

        if (!sourceData || sourceData.length === 0) {
          return 0;
        }

        // Optimized: use for loop instead of reduce for better performance
        let total = 0;
        for (let i = 0; i < sourceData.length; i++) {
          const value = sourceData[i][key];
          total += (typeof value === 'number' ? value : Number(value) || 0);
        }

        return total;
      }));
    }

    return this.totalsComputed.get(key)!();
  }

  // Computed signal for averages - automatically updates when data/filters change
  private readonly averagesComputed = new Map<string, () => number>();

  getAverage(key: string): number {
    // Create computed signal for this average if it doesn't exist
    if (!this.averagesComputed.has(key)) {
      this.averagesComputed.set(key, computed(() => {
        const sourceData = this.virtualScrolling
          ? this.filteredCacheSignal()
          : (this.virtualScrolling ? this.filteredData() : this.dataSource.data);

        if (!sourceData || sourceData.length === 0) {
          return 0;
        }

        // Optimized: use for loop for better performance
        let sum = 0;
        for (let i = 0; i < sourceData.length; i++) {
          const value = sourceData[i][key];
          sum += (typeof value === 'number' ? value : Number(value) || 0);
        }

        return sourceData.length > 0 ? sum / sourceData.length : 0;
      }));
    }

    return this.averagesComputed.get(key)!();
  }

  getRouterLink(row: T): any[] | null {
    if (!this.routerLinkBase) return null;

    // Use memoized cache for better performance
    if (this.rowMemoCache.has(row)) {
      const cached = this.rowMemoCache.get(row)!;
      return cached.routerLink ? [...cached.routerLink] : null;
    }

    const link = this.routerLinkBase.map((segment) => {
      if (
        typeof segment === 'string' &&
        segment.startsWith('[') &&
        segment.endsWith(']')
      ) {
        const prop = segment.slice(1, -1);
        return row[prop] || segment;
      }
      return segment;
    });

    // Store in both caches for compatibility
    this.routerLinkCache.set(row, link);
    if (!this.rowMemoCache.has(row)) {
      this.rowMemoCache.set(row, {
        routerLink: link,
        rowClass: this.getRowClass(row),
        hasBgLightYellow: false, // Will be computed below
        rowClassWithHover: {}
      });
    } else {
      const cached = this.rowMemoCache.get(row)!;
      this.rowMemoCache.set(row, { ...cached, routerLink: link });
    }

    return link;
  }

  getRowClass(row: T): Readonly<Record<string, boolean | string>> {
    if (!row || !this.rowClass) {
      return {};
    }

    // Use memoized cache for better performance
    if (this.rowMemoCache.has(row)) {
      const cached = this.rowMemoCache.get(row)!;
      return cached.rowClass;
    }

    // Fallback to old cache
    if (this.rowClassCache.has(row)) {
      const classObj = this.rowClassCache.get(row);
      // Also store in memoized cache
      if (!this.rowMemoCache.has(row)) {
        this.rowMemoCache.set(row, {
          routerLink: this.getRouterLink(row),
          rowClass: classObj,
          hasBgLightYellow: false,
          rowClassWithHover: {}
        });
      }
      return classObj;
    }

    if (typeof this.rowClass === 'function') {
      try {
        const result = this.rowClass(row);
        const classObj = result || {};
        this.rowClassCache.set(row, classObj);

        // Store in memoized cache
        if (!this.rowMemoCache.has(row)) {
          this.rowMemoCache.set(row, {
            routerLink: this.getRouterLink(row),
            rowClass: classObj,
            hasBgLightYellow: false,
            rowClassWithHover: {}
          });
        } else {
          const cached = this.rowMemoCache.get(row)!;
          this.rowMemoCache.set(row, { ...cached, rowClass: classObj });
        }

        return classObj;
      } catch (error) {
        console.warn('Error calling rowClass function:', error);
        return {};
      }
    }

    return {};
  }

  hasBgLightYellow(row: T): boolean {
    // Use memoized cache
    if (this.rowMemoCache.has(row)) {
      const cached = this.rowMemoCache.get(row)!;
      if (cached.hasBgLightYellow !== undefined) {
        return cached.hasBgLightYellow;
      }
    }

    const rowClass = this.getRowClass(row);
    if (!rowClass || typeof rowClass !== 'object') {
      return false;
    }
    // Check if any background class is present (Bootstrap or custom)
    const backgroundClasses = Object.keys(rowClass).filter(key =>
      rowClass[key] === true && (
        key.startsWith('bg-') ||
        key.includes('background') ||
        key === 'bg-light-yellow'
      )
    );
    const hasYellow = backgroundClasses.length > 0;

    // Cache the result
    if (this.rowMemoCache.has(row)) {
      const cached = this.rowMemoCache.get(row)!;
      this.rowMemoCache.set(row, { ...cached, hasBgLightYellow: hasYellow });
    } else {
      this.rowMemoCache.set(row, {
        routerLink: this.getRouterLink(row),
        rowClass,
        hasBgLightYellow: hasYellow,
        rowClassWithHover: {}
      });
    }

    return hasYellow;
  }

  getRowClassWithHover(row: T): Readonly<Record<string, boolean | string>> {
    // Use memoized cache
    if (this.rowMemoCache.has(row)) {
      const cached = this.rowMemoCache.get(row)!;
      if (Object.keys(cached.rowClassWithHover).length > 0) {
        return cached.rowClassWithHover;
      }
    }

    const rowClass = this.getRowClass(row);
    const hasYellow = this.hasBgLightYellow(row);

    // Convert bg-light-yellow to Tailwind class with !important prefix
    const tailwindRowClass: Record<string, boolean | string> = {};
    if (rowClass && typeof rowClass === 'object') {
      Object.keys(rowClass).forEach(key => {
        if (rowClass[key] === true) {
          if (key === 'bg-light-yellow') {
            tailwindRowClass['!bg-yellow-100'] = true;
            tailwindRowClass['hover:!bg-yellow-200'] = true; // Darker yellow on hover
          } else {
            tailwindRowClass[key] = true;
          }
        }
      });
    }

    // If row has bg-light-yellow, don't add hover class
    // Otherwise, add the hover class
    const result = !hasYellow
      ? { ...tailwindRowClass, 'hover:!bg-blue-50/60': true }
      : tailwindRowClass;

    // Cache the result
    if (this.rowMemoCache.has(row)) {
      const cached = this.rowMemoCache.get(row)!;
      this.rowMemoCache.set(row, { ...cached, rowClassWithHover: result });
    } else {
      this.rowMemoCache.set(row, {
        routerLink: this.getRouterLink(row),
        rowClass,
        hasBgLightYellow: hasYellow,
        rowClassWithHover: result
      });
    }

    return result;
  }

  getRowStyle(row: T): { [key: string]: string } {
    if (!row) {
      return {};
    }

    const hasYellow = this.hasBgLightYellow(row);

    if (hasYellow) {
      return {
        'background-color': '#fef9c3' // Tailwind yellow-100
      };
    }

    return {};
  }

  openSensitiveDataDialog(title: string, value: string, rowData: T): void {
    this.dialog.open(ViewInfoMobEmailComponent, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: true,  // Prevent accidental closing
      autoFocus: false,    // Avoid autofocus for better security
      data: {
        title: `${title} `,
        value: value,
        rowId: rowData.id,  // Optional: pass row ID for tracking
        call_masking_ids: (rowData as any).call_masking_ids
      },
    });
  }

  drop(event: CdkDragDrop<TableColumn<T>[]>) {
    // Check if the drop is within the same list and position changed
    if (
      event.previousContainer === event.container &&
      event.previousIndex !== event.currentIndex
    ) {
      // Clone the array to trigger change detection
      const newDisplayedColumns = [...this.displayedColumns];

      // Move the item in the array
      moveItemInArray(
        newDisplayedColumns,
        event.previousIndex,
        event.currentIndex
      );

      // Update the displayedColumns reference
      this.displayedColumns = newDisplayedColumns;

      // Emit the new order
      this.columnReordered.emit([...this.displayedColumns.map((col) => col.key)]);

      // Force table to re-render columns
      this.updateTableColumns();
    }
  }

  private updateTableColumns() {
    // This forces the table to re-render the columns
    const currentData = this.dataSource.data;
    this.dataSource.data = [];
    setTimeout(() => {
      this.dataSource.data = currentData;
      this.cdr.markForCheck();
    });
  }

  applyFilter() {
    const filters = this.columnFiltersSignal();
    const search = this.globalSearchTermSignal();

    if (!this.virtualScrolling) {
      const allFiltersEmpty = Object.values(filters).every(val => !val) && !search;

      if (allFiltersEmpty) {
        const originalData = this.originalDataSignal();
        this.allDataSignal.set([...originalData]);
        this.allData = [...originalData];
      } else {
        let filteredData = [...this.originalDataSignal()];

        // Apply column-wise filters
        const hasColumnFilters = Object.values(filters).some(val => val);
        if (hasColumnFilters) {
          filteredData = filteredData.filter(item => {
            for (const column of this.displayedColumns) {
              const filterValue = filters[column.key];
              if (filterValue) {
                const columnValue = (item[column.key] ?? '').toString().toLowerCase();
                if (!columnValue.includes(filterValue.toLowerCase())) {
                  return false;
                }
              }
            }
            return true;
          });
        }

        // Apply global search
        if (search) {
          const lowerSearch = search.toLowerCase();
          filteredData = filteredData.filter(item =>
            this.displayedColumns.some(col => {
              const value = item[col.key];
              return value !== null && value !== undefined &&
                value.toString().toLowerCase().includes(lowerSearch);
            })
          );
        }

        this.allDataSignal.set(filteredData);
        this.allData = filteredData;
      }

      this.currentPageSignal.set(0);
      this.currentPage = 0;
      this.updateDisplayData();

      if (this.paginator) {
        this.paginator.firstPage();
      }

      this.resetCaches();
      this.cdr.markForCheck();
    } else {
      const allFiltersEmpty = Object.values(filters).every(val => !val) && !search;

      if (allFiltersEmpty) {
        this.resetVirtualScroll();
      } else {
        this.invalidateVirtualCache(true);
        this.updateVirtualData(true);
        if (this.virtualScroll) {
          this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
              this.ngZone.run(() => {
                this.virtualScroll.scrollToIndex(0);
                this.virtualScroll.checkViewportSize();
              });
            });
          });
        }
      }
    }

    this.resetCaches();
    this.cdr.markForCheck();
  }
  /**
   * Unified filter predicate that supports **both**:
   * 1. Column-wise filters (JSON string with keys)
   * 2. Global search string (plain text)
   */
  createFilter(): (data: any, filter: string) => boolean {
    return (data, filter) => {
      // Attempt to parse JSON – if it succeeds and returns an object, treat as column filters
      let columnFilters: any = null;
      try {
        const parsed = JSON.parse(filter);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          columnFilters = parsed;
        }
      } catch {
        // Not JSON → treat as global search
      }

      // 1️⃣ Column-wise filter path
      if (columnFilters) {
        let matches = true;
        this.displayedColumns.forEach((column) => {
          if (columnFilters[column.key]?.trim()) {
            const columnValue = data[column.key]?.toString().toLowerCase() || '';
            const filterValue = columnFilters[column.key].toLowerCase();

            // If the user included spaces, do an exact includes, otherwise split words
            const searchParts: string[] = filterValue.includes(' ')
              ? [filterValue]
              : (filterValue.split(/\s+/).filter(Boolean) as string[]);

            matches = matches && searchParts.every((part) => columnValue.includes(part));
          }
        });
        return matches;
      }

      // 2️⃣ Global search path
      const searchTerm = (filter || '').toString().trim().toLowerCase();
      if (!searchTerm) {
        return true; // No search term → include all
      }

      return this.displayedColumns.some((col) => {
        const value = data[col.key];
        return value !== null && value !== undefined && value.toString().toLowerCase().includes(searchTerm);
      });
    };
  }

  // Legacy property with signal backing
  get globalSearchTerm(): string {
    return this.globalSearchTermSignal();
  }

  set globalSearchTerm(value: string) {
    this.globalSearchTermSignal.set(value);
  }

  applyGlobalFilter() {
    const searchTerm = this.globalSearchTermSignal();

    if (searchTerm.trim() === '' && this.dataSource.filter !== '') {
      this.clearGlobalSearch();
      return;
    }

    this.globalSearchChange.emit(searchTerm);
    this.filterSubject.next(searchTerm);
  }

  onColumnFilterChange(columnKey: string): void {
    // Mark filters as dirty to trigger recomputation
    this.filtersDirtySignal.set(true);
    this.filtersDirty = true;

    if (this.virtualScrolling) {
      // Invalidate cache and update virtual data
      this.invalidateVirtualCache(true);
      this.updateVirtualData(true);

      // Scroll to top when filter changes
      if (this.virtualScroll) {
        this.ngZone.runOutsideAngular(() => {
          this.virtualScroll.scrollToIndex(0);
        });
      }
    } else {
      // For non-virtual scrolling, apply filters and update display
      const originalData = this.originalDataSignal();
      let filteredData = this.applyColumnFiltersToData([...originalData]);

      // Apply global search if present
      const searchTerm = this.globalSearchTermSignal().trim();
      if (searchTerm) {
        filteredData = this.applyGlobalSearchToData(filteredData);
      }

      // Create mutable copy for allData and dataSource
      const mutableFilteredData = [...filteredData];
      this.allData = mutableFilteredData;
      this.allDataSignal.set(filteredData);
      this._dataSource.data = mutableFilteredData;

      // Reset to first page
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
      this.currentPageSignal.set(0);
      this.currentPage = 0;

      this.updateDisplayData();
    }

    this.cdr.markForCheck();
  }

  private applyGlobalFilterInternal() {
    if (!this.dataSource) return;

    const originalData = this.originalDataSignal();
    this.allData = [...originalData];
    this.allDataSignal.set([...originalData]);
    this._dataSource.data = this.allData;

    const trimmedSearch = this.globalSearchTermSignal().trim();

    if (this.virtualScrolling) {
      if (trimmedSearch) {
        this.invalidateVirtualCache(true);
        this.updateVirtualData(true);
        if (this.virtualScroll) {
          this.ngZone.runOutsideAngular(() => {
            this.virtualScroll.scrollToIndex(0);
          });
        }
      } else {
        this.resetVirtualScroll();
      }
    } else if (trimmedSearch) {
      this.dataSource.filter = trimmedSearch.toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
      this.currentPageSignal.set(0);
      this.currentPage = 0;

      if (this.pageSize === -1) {
        this._dataSource.data = this.dataSource.filteredData;
      }
    } else {
      this.updateDisplayData();
    }

    this.resetCaches();
    this.cdr.markForCheck();
  }

  displayData: T[] = []; // Data to display (paginated)

  private updateDisplayData() {
    if (this.allData && this.allData.length > 0) {
      if (this.pageSize === -1) {
        // If "All" is selected, show all data
        this.displayData = [...this.allData];
        this._dataSource.data = [...this.allData];
      } else if (this.pageSize > 0) {
        // Apply pagination
        const startIndex = this.currentPage * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.displayData = this.allData.slice(startIndex, endIndex);
        this._dataSource.data = this.displayData;
      } else {
        // Default case - show all data
        this.displayData = [...this.allData];
        this._dataSource.data = [...this.allData];
      }
    } else {
      this.displayData = [];
      this._dataSource.data = [];
    }
    this.cdr.markForCheck();
  }

  onPageChange(event: any) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;

    if (this.virtualScrolling) {
      // For virtual scrolling, update the page size and reset the scroll
      this.changeVirtualPageSize(this.pageSize);
      this.scrollToTop();
    } else {
      // For regular table, update the display data
      if (!this.globalSearchTerm.trim()) {
        this.updateDisplayData();
      }
    }

    // Reset caches when page changes
    this.resetCaches();
    this.cdr.markForCheck();
  }

  clearGlobalSearch() {
    this.globalSearchTermSignal.set('');
    this.globalSearchTerm = '';

    this.globalSearchChange.emit('');
    this.dataSource.filter = '';

    const originalData = this.originalDataSignal();
    this.allData = [...originalData];
    this.allDataSignal.set([...originalData]);
    this._dataSource.data = [...this.allData];

    if (this.virtualScrolling) {
      this.resetVirtualScroll();
    } else {
      this.currentPageSignal.set(0);
      this.currentPage = 0;
      this.updateDisplayData();

      if (this.paginator) {
        this.paginator.firstPage();
      }
    }

    this.resetCaches();
    this.cdr.markForCheck();
  }

  exportToExcel() {
    // Check if there's data to export
    const dataToCheck = this.allDataSignal() || this.dataSource?.data || [];
    if (!dataToCheck || dataToCheck.length === 0) {
      this.snackBar.open('No data available to export', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      return;
    }

    // Use ngZone.runOutsideAngular for better performance during export
    this.ngZone.runOutsideAngular(() => {
      try {
        // Prepare the data for export
        const exportData = this.prepareExportData();

        if (!exportData || exportData.length === 0) {
          this.ngZone.run(() => {
            this.snackBar.open('No data available to export', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          });
          return;
        }

        // Get column headers from active columns
        const columns = this.activeColumns();
        const headers = columns
          .filter(col => {
            // Basic exclusion
            if (col.key === 'actions' || col.type === 'actions' || col.type === 'index') {
              return false;
            }
            // Role-based sensitive data exclusion
            if (col.type === 'sensitive' && this.roleId !== 2) {
              return false;
            }
            // Traditional exclusions
            if (col.type === 'photo' || col.type === 'attachment' || col.type === 'file') {
              return false;
            }
            return true;
          })
          .map(col => col.label);

        // Create worksheet with proper headers
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData, { header: headers });

        // Set column widths for better readability
        const colWidths = this.calculateColumnWidths(exportData, columns);
        ws['!cols'] = colWidths;

        // Create workbook
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        const sheetName = 'Data Export';
        XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Excel sheet name max 31 chars

        // Generate descriptive file name
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
        const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
        const fileName = `data_export_${dateStr}_${timeStr}.xlsx`;

        // Save to file
        XLSX.writeFileXLSX(wb, fileName);

        // Show success message
        this.ngZone.run(() => {
          this.snackBar.open(`Data exported successfully: ${fileName}`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        });
      } catch (error) {
        console.error('Error exporting to Excel:', error);
        this.ngZone.run(() => {
          this.snackBar.open('Error exporting data. Please try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        });
      }
    });
  }

  private calculateColumnWidths(data: Record<string, unknown>[], columns: readonly TableColumn<T>[]): Array<{ wch: number }> {
    const widths: Array<{ wch: number }> = [];
    const exportColumns = columns.filter(col => col.key !== 'actions' && col.type !== 'actions' && col.type !== 'index');

    exportColumns.forEach((column, index) => {
      let maxWidth = column.label.length; // Start with header length

      // Check data values for this column
      data.forEach(row => {
        const value = this.getNestedValue(row, column.label);
        if (value !== null && value !== undefined) {
          const strValue = String(value);
          maxWidth = Math.max(maxWidth, strValue.length);
        }
      });

      // Set reasonable min/max bounds
      const finalWidth = Math.min(Math.max(maxWidth + 2, 10), 50);
      widths[index] = { wch: finalWidth };
    });

    return widths;
  }

  private getNestedValue(obj: Record<string, unknown>, key: string): unknown {
    // Handle nested keys like "user.name" or direct keys
    if (key.includes('.')) {
      const keys = key.split('.');
      let value: unknown = obj;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = (value as Record<string, unknown>)[k];
        } else {
          return null;
        }
      }
      return value;
    }
    return obj[key];
  }

  private prepareExportData(): Record<string, unknown>[] {
    // Get the filtered data if search is active, otherwise all data
    const searchTerm = this.globalSearchTermSignal();
    const allData = this.allDataSignal() || [];

    let dataToExport: T[];
    if (searchTerm && searchTerm.trim() && this.dataSource?.filteredData?.length > 0) {
      dataToExport = [...this.dataSource.filteredData];
    } else {
      dataToExport = allData.length > 0 ? [...allData] : (this.dataSource?.data ? [...this.dataSource.data] : []);
    }

    if (!dataToExport || dataToExport.length === 0) {
      return [];
    }

    // Initialize pipes if not available
    if (!this.indianCurrencyPipe) {
      this.indianCurrencyPipe = new IndianCurrencyPipe();
    }
    if (!this.pipe) {
      this.pipe = new DatePipe('en-US');
    }

    // Get active columns (visible columns)
    const columns = this.activeColumns();

    // Map the data to include only the displayed columns with proper headers
    return dataToExport.map((row): Record<string, unknown> => {
      const exportRow: Record<string, unknown> = {};

      columns.forEach((column) => {
        // Skip action columns and index columns
        if (column.key === 'actions' || column.type === 'actions' || column.type === 'index') {
          return;
        }

        // Role-based sensitive data exclusion
        if (column.type === 'sensitive' && this.roleId !== 2) {
          return;
        }

        // Skip photo, attachment, file columns (they don't export well)
        if (column.type === 'photo' || column.type === 'attachment' || column.type === 'file') {
          return;
        }

        // Use the column label as the header
        const header = column.label || column.key;

        // Get the value - handle nested properties
        let value: unknown = this.getNestedPropertyValue(row, column.key);

        // Format the value based on column type and properties
        value = this.formatExportValue(value, column);

        exportRow[header] = value;
      });

      return exportRow;
    });
  }

  private getNestedPropertyValue(obj: T, path: string): unknown {
    if (!obj || !path) return null;

    // Handle nested paths like "user.name" or "address.city"
    if (path.includes('.')) {
      const keys = path.split('.');
      let value: unknown = obj;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = (value as Record<string, unknown>)[key];
        } else {
          return null;
        }
      }
      return value;
    }

    // Direct property access
    return (obj as Record<string, unknown>)[path];
  }

  private formatExportValue(value: unknown, column: TableColumn<T>): unknown {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return column.emptyValueDisplay || '-';
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : (column.emptyValueDisplay || '-');
    }

    // Handle objects
    if (typeof value === 'object' && !(value instanceof Date)) {
      try {
        return JSON.stringify(value);
      } catch {
        return String(value);
      }
    }

    // Handle dates
    if (column.isDate || column.type === 'date' || column.type === 'short_date') {
      if (value instanceof Date || typeof value === 'string' || typeof value === 'number') {
        const format = column.dateFormat || (column.type === 'short_date' ? 'dd-MMM-yy' : 'medium');
        return this.pipe.transform(value, format) || String(value);
      }
    }

    // Handle amounts
    if (column.isAmount && (typeof value === 'string' || typeof value === 'number')) {
      try {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          return this.indianCurrencyPipe.transform(numValue, false);
        }
      } catch {
        // Fall through to return original value
      }
    }

    // Handle percentages
    if (column.isPercentage) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        return `${numValue}%`;
      }
    }

    // Handle truncate - get full value
    if (column.type === 'truncate' && value) {
      return String(value);
    }

    // Handle phone numbers
    if (column.isPhone && value) {
      return String(value);
    }

    // Handle email
    if (column.isEmail && value) {
      return String(value);
    }

    // Handle boolean
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    // Handle numbers - ensure proper formatting
    if (typeof value === 'number') {
      // If it's a whole number, don't show decimals
      if (Number.isInteger(value)) {
        return value;
      }
      // Otherwise, format with appropriate decimal places
      return parseFloat(value.toFixed(2));
    }

    // Default: convert to string
    return String(value);
  }

  @Input() idProperty: keyof T = 'id' as keyof T;
  @Input() selectedItems: T[] = [];
  @Output() selectedItemsChange = new EventEmitter<T[]>();

  get idPropertyString(): string {
    return this.idProperty as string;
  }

  isAllItemsSelected(): boolean {
    if (!this.dataSource?.data?.length) return false;
    return this.dataSource.data.every((item) =>
      this.selectedItems.some(
        (selected) => selected[this.idProperty] === item[this.idProperty]
      )
    );
  }

  isSomeSelected(): boolean {
    if (!this.dataSource?.data?.length) return false;
    const hasSelected = this.dataSource.data.some((item) =>
      this.selectedItems.some(
        (selected) => selected[this.idProperty] === item[this.idProperty]
      )
    );
    return hasSelected && !this.isAllItemsSelected();
  }

  toggleAllSelection(checked: boolean): void {
    if (checked) {
      const newSelections = this.dataSource.data.filter(
        (item: T) =>
          !this.selectedItems.some(
            (selected: T) => selected[this.idProperty] === item[this.idProperty]
          )
      );
      this.selectedItems = [...this.selectedItems, ...newSelections];
    } else {
      this.selectedItems = [];
    }
    this.selectedItemsChange.emit(this.selectedItems);
    this.cdr.markForCheck();
  }

  handleCheckboxChange(event: { checked: boolean; row: T }): void {
    if (event.checked) {
      this.selectedItems = [...this.selectedItems, event.row];
    } else {
      this.selectedItems = this.selectedItems.filter(
        (item) => item[this.idProperty] !== event.row[this.idProperty]
      );
    }
    this.selectedItemsChange.emit(this.selectedItems);
    this.cdr.markForCheck();
  }

  handleActionClick(event: { action: string; row: T }): void {
    this.actionClick.emit(event);
  }

  // ==================== OPTIMIZED VIRTUAL SCROLL DATA MANAGEMENT ====================

  /**
   * Optimized virtual data updates with smart chunking and immutable patterns
   * Uses requestIdleCallback for non-blocking updates and efficient data slicing
   */
  updateVirtualData(forceViewportSync: boolean = false): void {
    if (!this.virtualScrolling) {
      return;
    }

    const renderStartTime = performance.now();
    const filteredCache = this.filteredCacheSignal();
    const filtersDirty = this.filtersDirtySignal();

    // Recompute cache only if dirty (immutable pattern)
    if (!filteredCache.length || filtersDirty) {
      this.recomputeVirtualCache();
      this.filtersDirtySignal.set(false);
    }

    const totalAvailable = this.filteredCacheSignal().length;
    let loadedCount = this.loadedItemCountSignal();

    // Smart initial load calculation based on viewport and buffer
    if (!loadedCount || loadedCount <= 0) {
      const viewportHeight = isPlatformBrowser(this.platformId) ? window.innerHeight : 800;
      const itemsPerViewport = Math.ceil(viewportHeight / this.optimizedItemSize());
      const smartInitialLoad = Math.max(
        this.initialLoadCount,
        itemsPerViewport * 2 + this.bufferSize * 2 // Load 2 viewports + buffer
      );
      loadedCount = Math.min(smartInitialLoad, totalAvailable);
    } else if (loadedCount > totalAvailable) {
      loadedCount = totalAvailable;
    }

    // Efficient immutable data slice - only create new array if needed
    const currentVirtualData = this.virtualData();
    const needsUpdate = currentVirtualData.length !== loadedCount ||
      currentVirtualData.length === 0 ||
      !currentVirtualData[0] ||
      currentVirtualData[0] !== filteredCache[0];

    if (needsUpdate && totalAvailable > 0) {
      // Use slice for efficient immutable copy (faster than spread for large arrays)
      const loadedData = filteredCache.slice(0, loadedCount);

      // Batch signal updates outside Angular zone for better performance
      this.ngZone.runOutsideAngular(() => {
        this.loadedItemCountSignal.set(loadedCount);
        // MatTableDataSource needs mutable array, but we keep signals immutable
        this.virtualData.set([...loadedData]);
        this._dataSource.data = loadedData;
      });
    }

    // Viewport-aware prefetching (non-blocking)
    if (this.enableServerPagination && this.enablePrefetch && !this.isFetchingData()) {
      if (isPlatformBrowser(this.platformId) && 'requestIdleCallback' in window) {
        requestIdleCallback(() => this.prefetchNextPage(), { timeout: 100 });
      } else {
        setTimeout(() => this.prefetchNextPage(), 0);
      }
    }

    // Update estimated item size asynchronously
    if (forceViewportSync && this.virtualScroll) {
      if (isPlatformBrowser(this.platformId) && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.updateEstimatedItemSize();
          if (this.virtualScroll) {
            this.virtualScroll.checkViewportSize();
          }
        }, { timeout: 100 });
      } else {
        setTimeout(() => {
          this.updateEstimatedItemSize();
          if (this.virtualScroll) {
            this.virtualScroll.checkViewportSize();
          }
        }, 100);
      }
    }

    // Performance monitoring
    const renderTime = performance.now() - renderStartTime;
    this.updatePerformanceMetric('renderTime', renderTime);

    if (renderTime > this.performanceBudget.maxRenderTime) {
      console.warn(`Render time ${renderTime.toFixed(2)}ms exceeds budget ${this.performanceBudget.maxRenderTime}ms`);
    }

    // Mark for check (minimal change detection)
    this.cdr.markForCheck();
  }

  private invalidateVirtualCache(resetLoadedCount: boolean = false): void {
    this.filtersDirtySignal.set(true);
    this.filtersDirty = true;
    if (resetLoadedCount) {
      this.loadedItemCountSignal.set(0);
      this.loadedItemCount = 0;
    }
  }

  private recomputeVirtualCache(): void {
    // Immutable data processing pipeline
    let workingData = Object.freeze([...this.originalDataSignal()]);

    workingData = Object.freeze(this.applyColumnFiltersToData([...workingData]));
    workingData = Object.freeze(this.applyGlobalSearchToData([...workingData]));
    workingData = Object.freeze(this.applySortToData([...workingData]));

    // Batch immutable updates
    this.filteredCacheSignal.set(workingData);
    this.allDataSignal.set(workingData);
  }

  private applyColumnFiltersToData(
    data: readonly T[]
  ): readonly T[] {
    const filters = this.columnFiltersSignal();
    const hasColumnFilters = Object.values(filters).some(val => val?.trim());
    if (!hasColumnFilters) {
      return data;
    }

    const normalizedFilters = new Map<string, string>();
    Object.entries(filters).forEach(([key, value]) => {
      if (value?.trim()) {
        normalizedFilters.set(key, value.toLowerCase());
      }
    });

    return data.filter(item => {
      for (const [key, filterValue] of normalizedFilters) {
        const columnValue = String(item[key] || '').toLowerCase();
        if (!columnValue.includes(filterValue)) {
          return false;
        }
      }
      return true;
    });
  }

  private applyGlobalSearchToData(
    data: readonly T[]
  ): readonly T[] {
    const searchTerm = (this.globalSearchTermSignal() || '').toString().toLowerCase().trim();
    if (!searchTerm) {
      return data;
    }

    const columns = this.displayedColumnsSignal();
    return data.filter(item =>
      columns.some(col => {
        const value = item[col.key];
        return value !== null && value !== undefined &&
          String(value).toLowerCase().includes(searchTerm);
      })
    );
  }

  private applySortToData(
    data: readonly T[]
  ): readonly T[] {
    if (!this.sort || !this.sort.active || !this.sort.direction) {
      return data;
    }

    const sortedData = [...data].sort((a, b) => {
      const isAsc = this.sort!.direction === 'asc';
      const valueA = a[this.sort!.active];
      const valueB = b[this.sort!.active];

      if (valueA === null || valueA === undefined) return isAsc ? -1 : 1;
      if (valueB === null || valueB === undefined) return isAsc ? 1 : -1;

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return isAsc ? valueA - valueB : valueB - valueA;
      }

      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      return isAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return sortedData;
  }
  // Legacy property for backward compatibility
  get _originalData(): T[] {
    return [...this.originalDataSignal()];
  }

  set _originalData(value: T[] | readonly T[]) {
    this.originalDataSignal.set([...value]);
  }

  // Legacy properties with signal backing
  get allData(): T[] {
    return [...this.allDataSignal()];
  }

  set allData(value: T[] | readonly T[]) {
    this.allDataSignal.set([...value]);
  }

  get filteredCache(): T[] {
    return [...this.filteredCacheSignal()];
  }

  set filteredCache(value: T[] | readonly T[]) {
    this.filteredCacheSignal.set([...value]);
  }

  get filtersDirty(): boolean {
    return this.filtersDirtySignal();
  }

  set filtersDirty(value: boolean) {
    this.filtersDirtySignal.set(value);
  }

  // Reset to initial load state
  resetVirtualScroll(): void {
    if (!this.virtualScrolling) {
      return;
    }

    const originalData = this.originalDataSignal();
    this.allData = [...originalData];
    this.allDataSignal.set([...originalData]);
    this.filteredCache = [...originalData];
    this.filteredCacheSignal.set([...originalData]);
    this.loadedItemCountSignal.set(0);
    this.loadedItemCount = 0;
    this.filtersDirtySignal.set(true);
    this.filtersDirty = true;

    this.updateVirtualData(true);

    if (this.virtualScroll) {
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => {
          this.ngZone.run(() => {
            this.virtualScroll.scrollToIndex(0);
            this.virtualScroll.checkViewportSize();
          });
        }, 0);
      });
    }

    this.cdr.markForCheck();
  }

  // Check if we should load more items based on current scroll position
  private shouldLoadMore(range: { start: number, end: number }): boolean {
    const isLoading = this.isLoadingMoreSignal();
    const loadedCount = this.loadedItemCountSignal();
    const allDataLength = this.allDataSignal().length;

    if (isLoading || loadedCount >= allDataLength) {
      return false;
    }

    const endThreshold = loadedCount - 3;
    return range.end >= endThreshold;
  }

  // ==================== OPTIMIZED LOAD MORE WITH CANCELLABLE STREAMS ====================

  /**
   * Loads more items with viewport-aware buffering and cancellable prefetch
   * Uses exhaustMap to prevent concurrent load operations
   */
  loadMoreItems(): void {
    const isLoading = this.isLoadingMoreSignal();
    const loadedCount = this.loadedItemCountSignal();
    const filteredCache = this.filteredCacheSignal();

    if (isLoading || loadedCount >= filteredCache.length) {
      return;
    }

    // Server-side pagination path
    if (this.enableServerPagination && this.serverPaginationConfigSignal()) {
      this.loadMoreFromServer();
      return;
    }

    // Client-side pagination path
    this.isLoadingMoreSignal.set(true);

    // Use requestIdleCallback for non-blocking loading
    if (isPlatformBrowser(this.platformId) && 'requestIdleCallback' in window) {
      requestIdleCallback(() => this.performLoadMore(), { timeout: 50 });
    } else if (isPlatformBrowser(this.platformId)) {
      requestAnimationFrame(() => this.performLoadMore());
    } else {
      this.performLoadMore();
    }
  }

  private loadMoreFromServer(): void {
    if (this.isFetchingData() || !this.hasMoreData()) {
      return;
    }

    const request: ServerPaginationRequest = {
      cursor: this.currentCursor(),
      limit: this.pageSize,
      sortBy: this.sort?.active || undefined,
      sortOrder: (this.sort?.direction as 'asc' | 'desc') || undefined,
      filters: this.buildFiltersForServer(),
      searchTerm: this.globalSearchTermSignal()
    };

    // Use exhaustMap to prevent concurrent requests and switchMap to cancel previous ones
    this.fetchServerData(request)
      .pipe(
        exhaustMap((response) => {
          return this.ngZone.runOutsideAngular(() => {
            return new Observable<void>(observer => {
              requestAnimationFrame(() => {
                const currentData = this.allDataSignal();
                const newData = Object.freeze([...currentData, ...response.data]) as readonly T[];
                this.allDataSignal.set(newData);
                this.loadedItemCountSignal.set(newData.length);

                this.ngZone.run(() => {
                  this.updateVirtualData();
                  observer.next();
                  observer.complete();
                });
              });
            });
          });
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Error loading more data:', error);
          this.snackBar.open('Failed to load more data', 'Close', { duration: 3000 });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef), // ✨ Auto cleanup
        takeUntil(this.prefetchCancel$)
      )
      .subscribe();
  }

  /**
   * Optimized load more with smart chunking based on viewport and buffer size
   * Uses dynamic batch sizing for better performance
   */
  private performLoadMore(): void {
    this.ngZone.run(() => {
      const loadedCount = this.loadedItemCountSignal();
      const filteredCache = this.filteredCacheSignal();

      // Smart batch sizing: load enough to fill viewport + buffer
      const viewportHeight = isPlatformBrowser(this.platformId) ? window.innerHeight : 800;
      const itemsPerViewport = Math.ceil(viewportHeight / this.optimizedItemSize());
      const smartBatchSize = Math.max(
        this.loadMoreCount,
        itemsPerViewport + this.bufferSize // Load viewport + buffer
      );

      // Cap batch size to prevent memory issues
      const batchSize = Math.min(smartBatchSize, 100);
      const newCount = Math.min(loadedCount + batchSize, filteredCache.length);

      if (newCount > loadedCount) {
        this.loadedItemCountSignal.set(newCount);
        this.updateVirtualData();
      }

      this.isLoadingMoreSignal.set(false);
      this.cdr.markForCheck();
    });
  }

  // Scroll to a specific index
  scrollToIndex(index: number): void {
    if (this.virtualScrolling && this.virtualScroll) {
      this.virtualScroll.scrollToIndex(index, 'smooth');
    }
  }

  // Scroll to top
  scrollToTop(): void {
    if (this.virtualScrolling && this.virtualScroll) {
      this.virtualScroll.scrollToIndex(0, 'smooth');
    }
  }

  // Scroll to bottom
  scrollToBottom(): void {
    if (this.virtualScrolling && this.virtualScroll && this.virtualData.length > 0) {
      this.virtualScroll.scrollToIndex(this.virtualData.length - 1, 'smooth');
    }
  }

  // Change page size for virtual scrolling
  changeVirtualPageSize(newPageSize: number): void {
    if (newPageSize !== this.pageSize) {
      this.pageSize = newPageSize;
      // No need to reload data, just use the new page size for future loads
      this.cdr.markForCheck();
    }
  }

  // Handle scroll index changes
  onScrollIndexChange(index: number): void {
    this.scrollIndexChange.emit(index + this.bufferSize);

    const loadedCount = this.loadedItemCountSignal();
    const filteredCache = this.filteredCacheSignal();
    const isLoading = this.isLoadingMoreSignal();

    if (index + this.bufferSize >= loadedCount - 1) {
      if (!isLoading && loadedCount < filteredCache.length) {
        this.loadMoreItems();
      }
    }
  }

  // Handle horizontal scroll for column virtualization
  handleHorizontalScroll(event: Event): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Throttle horizontal scroll updates
    this.ngZone.runOutsideAngular(() => {
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      this.scrollTimeout = setTimeout(() => {
        this.updateColumnVisibility();
      }, 16); // ~60fps
    });
  }

  // Method to handle window resize events
  @HostListener('window:resize')
  onResize(): void {
    if (this.virtualScrolling) {
      this.updateVirtualScrollHeight();
    }
  }

  /**
   * Toggle fullscreen mode for the table
   */
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;

    // Update the UI
    const navbar = document.querySelector('app-navbar') as HTMLElement;
    const sidebar = document.querySelector('app-sidebar') as HTMLElement;
    const footer = document.querySelector('app-footer') as HTMLElement;

    if (this.isFullscreen) {
      // Hide navbar and sidebar
      if (navbar) {
        navbar.style.display = 'none';
      }

      if (sidebar) {
        sidebar.style.display = 'none';
      }

      if (footer) {
        footer.style.display = 'none';
      }

      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      document.body.classList.add('table-fullscreen-active');

      // Focus on the table container for keyboard navigation
      this.elementRef.nativeElement.focus();

      // Listen for ESC key to exit fullscreen
      document.addEventListener('keydown', this.handleEscKey.bind(this));
    } else {
      // Restore navbar and sidebar
      if (navbar) {
        navbar.style.display = '';
      }

      if (sidebar) {
        sidebar.style.display = '';
      }
      if (footer) {
        footer.style.display = '';
      }

      // Restore body scrolling
      document.body.style.overflow = '';
      document.body.classList.remove('table-fullscreen-active');

      // Remove ESC key listener
      document.removeEventListener('keydown', this.handleEscKey.bind(this));
    }

    // Recalculate virtual scroll height after toggling fullscreen
    if (this.virtualScrolling) {
      // Wait for DOM updates to complete
      setTimeout(() => {
        this.updateVirtualScrollHeight();

        // Force viewport check
        if (this.virtualScroll) {
          this.virtualScroll.checkViewportSize();
        }
      }, 100);
    }

    // Emit fullscreen state change
    this.fullscreenChange.emit(this.isFullscreen);
  }

  /**
   * Handle ESC key to exit fullscreen mode
   */
  @HostListener('document:keydown.escape')
  exitFullscreen(): void {
    if (this.isFullscreen) {
      this.toggleFullscreen();
    }
  }

  /**
   * Handle ESC key press for document event listener
   */
  private handleEscKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isFullscreen) {
      this.toggleFullscreen();
    }
  }

  // Window resize handler
  onWindowResize() {
    if (this.virtualScrolling) {
      this.updateVirtualScrollHeight();
    }
  }

  // Check if there are any active column filters
  hasColumnFilters(): boolean {
    const filters = this.columnFiltersSignal();
    return Object.values(filters).some(val => val && val.trim() !== '');
  }
  openReceiptDialog(receiptData: string | number | null | undefined): void {
    if (receiptData) {
      const fileUrl = `${this.storageUrl}/${receiptData}`;

      this.dialog.open(ReceiptPreviewDialogComponent, {
        width: '80%',
        maxWidth: '900px',
        data: {
          title: 'Receipt Details',
          fileUrl: fileUrl,
        },
      });
    } else {
      this.snackBar.open('Receipt attachment not found', 'Close', {
        duration: 3000,
      });
    }
  }

  @Output() readonly editEvent = new EventEmitter<EditEvent<T>>();

  // Legacy properties with signal backing
  get editingRow(): T | null { return this.editingRowSignal(); }
  set editingRow(value: T | null) { this.editingRowSignal.set(value); }

  get editingField(): string { return this.editingFieldSignal(); }
  set editingField(value: string) { this.editingFieldSignal.set(value); }

  get editValue(): unknown { return this.editValueSignal(); }
  set editValue(value: unknown) { this.editValueSignal.set(value); }

  startEditing(row: T, field: string, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.editingRowSignal.set(row);
    this.editingFieldSignal.set(field);
    this.editValueSignal.set(row[field]);
    this.editingRow = row;
    this.editingField = field;
    this.editValue = row[field];

    this.editEvent.emit({
      action: 'edit',
      row: row,
      field: field
    });

    this.cdr.markForCheck();
  }

  cancelEditing(): void {
    this.editingRowSignal.set(null);
    this.editingFieldSignal.set('');
    this.editValueSignal.set('');
    this.editingRow = null;
    this.editingField = '';
    this.editValue = '';
    this.cdr.markForCheck();
  }

  saveEditing(): void {
    const editingRow = this.editingRowSignal();
    const editingField = this.editingFieldSignal();
    const editValue = this.editValueSignal();

    if (!editingRow || !editingField) return;

    const editEvent: EditEvent<T> = {
      action: 'save',
      row: editingRow,
      field: editingField,
      value: editValue
    };

    this.editEvent.emit(editEvent);
    // Update the row data - use type assertion since we know the field exists
    (editingRow as Record<string, unknown>)[editingField] = editValue;
    this.cancelEditing();
    this.cdr.markForCheck();
  }

  onEditInputChange(event: Event, field: string): void {
    const target = event.target as HTMLInputElement;
    this.editValueSignal.set(target.value);
    this.editValue = target.value;
  }

  // ==================== TEXT HIGHLIGHTING METHODS ====================

  /**
   * Check if a column should be highlighted based on active search term
   */
  shouldHighlightColumn(columnKey: string): boolean {
    const searchTerm = this.globalSearchTermSignal().trim();
    if (!searchTerm) {
      return false;
    }

    // Check if column has a filter value
    const columnFilter = this.columnFiltersSignal()[columnKey];
    return !!columnFilter?.trim() || !!searchTerm;
  }

  /**
   * Get search term for a specific column (prioritizes column filter over global search)
   */
  getSearchTermForColumn(columnKey: string): string {
    const columnFilter = this.columnFiltersSignal()[columnKey];
    if (columnFilter?.trim()) {
      return columnFilter.trim();
    }
    return this.globalSearchTermSignal().trim();
  }

  /**
   * Highlight text with search term
   */
  highlightText(value: unknown, searchTerm: string): string {
    if (!value || !searchTerm) {
      return String(value || '');
    }

    const text = String(value);
    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-0.5 rounded">$1</mark>');
  }

  /**
   * Highlight date text with search term
   */
  highlightDateText(value: unknown, format: string, searchTerm: string): string {
    if (!value || !searchTerm) {
      if (!value) return '';
      const dateValue = value as string | number | Date | null | undefined;
      return this.pipe.transform(dateValue, format) || String(value);
    }

    const dateValue = value as string | number | Date | null | undefined;
    const formattedDate = this.pipe.transform(dateValue, format) || String(value);
    return this.highlightText(formattedDate, searchTerm);
  }

  /**
   * Highlight truncated text with search term
   */
  highlightTruncateText(value: unknown, maxLength: number, searchTerm: string): string {
    if (!value || !searchTerm) {
      const text = String(value || '');
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    const text = String(value);
    const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    return this.highlightText(truncated, searchTerm);
  }

  /**
   * Highlight amount text with search term
   */
  highlightAmountText(value: unknown, searchTerm: string): string {
    if (!value || !searchTerm) {
      if (!value) return '';
      const amountValue = value as string | number | null | undefined;
      return this.indianCurrencyPipe.transform(amountValue, false) || String(value);
    }

    const amountValue = value as string | number | null | undefined;
    const formattedAmount = this.indianCurrencyPipe.transform(amountValue, false) || String(value);
    return this.highlightText(formattedAmount, searchTerm);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ==================== ROW SELECTION METHODS ====================

  /**
   * Check if a row is selected
   */
  isRowSelected(element: T): boolean {
    if (!this.selectedItems || this.selectedItems.length === 0) {
      return false;
    }

    const idProperty = this.idProperty;
    const elementId = element[idProperty];

    return this.selectedItems.some(item => item[idProperty] === elementId);
  }

  // ==================== ACTION METHODS ====================

  /**
   * Get visible actions for a specific row
   */
  getVisibleActionsForRow(element: T): ActionButton<T>[] {
    if (!this.actions || this.actions.length === 0) {
      return [];
    }

    return this.actions.filter(action => {
      if (!action) return false;

      // Check if action should be shown
      if (action.show === false) return false;
      if (typeof action.show === 'function') {
        try {
          return action.show(element);
        } catch (error) {
          console.warn('Error evaluating action.show:', error);
          return true; // Default to showing if evaluation fails
        }
      }

      return true;
    }) as ActionButton<T>[];
  }

  /**
   * Check if an action is disabled for a specific row
   */
  getActionTooltipForRow(action: ActionButton<T>, element: T): string {
    if (typeof action.tooltip === 'function') {
      try {
        return action.tooltip(element);
      } catch (error) {
        console.warn('Error evaluating action.tooltip:', error);
        return action.label || action.action;
      }
    }
    return action.tooltip || action.label || action.action;
  }

  isActionDisabledForRow(action: ActionButton<T>, element: T): boolean {
    if (action.disabled === true) {
      return true;
    }

    if (typeof action.disabled === 'function') {
      try {
        return action.disabled(element);
      } catch (error) {
        console.warn('Error evaluating action.disabled:', error);
        return false; // Default to enabled if evaluation fails
      }
    }

    return false;
  }

  /**
   * Trigger action for a specific row
   */
  triggerActionForRow(action: string, element: T, event: Event): void {
    event.stopPropagation();
    this.handleActionClick({ action, row: element });
  }

  // ==================== INFINITE SCROLL PROPERTIES ====================

  @Input() enableInfiniteScroll: boolean = false;

  /**
   * Signal for infinite scroll loading state
   */
  infiniteScrollIsLoadingSignal(): boolean {
    return this.isLoadingMoreSignal();
  }

  /**
   * Signal for infinite scroll total count
   */
  infiniteScrollTotalCount(): number {
    if (this.enableServerPagination && this.serverPaginationConfigSignal()) {
      // For server-side pagination, return the total from server
      return this.filteredTotalCount();
    }
    return this.filteredTotalCount();
  }
}