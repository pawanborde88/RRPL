import { CommonModule } from '@angular/common';
import { 
  Component, 
  Inject, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

/**
 * Column configuration interface
 */
export interface ColumnConfig {
  key: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  type?: string;
  sticky?: boolean;
  [key: string]: any;
}

/**
 * Dialog data interface
 */
export interface AdvancedFilterDialogData {
  selectedColumnKeys?: string[];
  allColumns?: ColumnConfig[];
  columns?: ColumnConfig[];
  enableSearch?: boolean;
  onSelectionChange?: (keys: string[]) => void;
}

/**
 * Internal column model with guaranteed properties
 */
interface ColumnModel extends ColumnConfig {
  selected: boolean;
  disabled: boolean;
}

/**
 * Highly optimized column selector dialog component
 * 
 * Performance optimizations:
 * - OnPush change detection strategy
 * - Angular Signals for reactive state management
 * - RxJS debouncing for search input
 * - TrackBy functions for list rendering
 * - Computed signals for derived state
 * - Immutable data patterns
 * - Memory leak prevention with proper cleanup
 */
@Component({
  selector: 'app-advanced-filter-dialog',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './advanced-filter-dialog.component.html',
  styleUrl: './advanced-filter-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdvancedFilterDialogComponent implements OnInit, OnDestroy {
  // Signals for reactive state management
  private readonly allColumnsSignal = signal<ColumnModel[]>([]);
  private readonly searchQuerySignal = signal<string>('');
  private readonly selectedKeysSignal = signal<Set<string>>(new Set());
  
  // Computed signals for derived state (automatically memoized)
  readonly filteredColumns = computed(() => {
    const query = this.searchQuerySignal().toLowerCase().trim();
    const columns = this.allColumnsSignal();
    
    if (!query) {
      return columns;
    }
    
    return columns.filter(column => 
      column.label.toLowerCase().includes(query)
    );
  });
  
  readonly selectableColumns = computed(() => 
    this.filteredColumns().filter(column => !column.disabled)
  );
  
  readonly allSelected = computed(() => {
    const selectable = this.selectableColumns();
    if (selectable.length === 0) return false;
    return selectable.every(column => column.selected);
  });
  
  readonly hasPartialSelection = computed(() => {
    const selectable = this.selectableColumns();
    const selectedCount = selectable.filter(c => c.selected).length;
    return selectedCount > 0 && selectedCount < selectable.length;
  });
  
  readonly selectAllLabel = computed(() => 
    this.allSelected() ? 'Deselect All' : 'Select All'
  );
  
  // RxJS Subject for search debouncing
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  
  // Public properties (wrapped for template compatibility)
  searchQuery: string = '';
  enableSearch: boolean = true;
  
  // Cached arrays for template (updated via signals)
  selectableColumnsArray: ColumnModel[] = [];
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AdvancedFilterDialogData,
    private dialogRef: MatDialogRef<AdvancedFilterDialogComponent>,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeData();
    this.setupSearchDebounce();
    this.setupColumnSync();
  }
  
  ngOnInit(): void {
    // Initial render
    this.updateSelectableColumnsArray();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }
  
  /**
   * Initialize component data from dialog input
   */
  private initializeData(): void {
    const data = this.data || {};
    
    // Extract selected keys
    let selectedKeys: string[] = [];
    if (Array.isArray(data.selectedColumnKeys)) {
      selectedKeys = [...data.selectedColumnKeys];
    } else if (Array.isArray(data.columns)) {
      selectedKeys = data.columns
        .filter((col: ColumnConfig) => col.selected)
        .map((col: ColumnConfig) => col.key);
    }
    
    this.selectedKeysSignal.set(new Set(selectedKeys));
    
    // Determine source columns
    const sourceColumns = Array.isArray(data.allColumns)
      ? data.allColumns
      : Array.isArray(data.columns)
      ? data.columns
      : [];
    
    // Transform to ColumnModel with immutable pattern
    const columns: ColumnModel[] = sourceColumns.map((col: ColumnConfig) => ({
      ...col,
      selected: selectedKeys.includes(col.key),
      disabled: this.isColumnDisabled(col)
    }));
    
    this.allColumnsSignal.set(columns);
    this.enableSearch = data.enableSearch !== false;
  }
  
  /**
   * Setup RxJS debouncing for search input (300ms delay)
   */
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.searchQuerySignal.set(query);
      this.updateSelectableColumnsArray();
      this.cdr.markForCheck();
    });
  }
  
  /**
   * Setup effect to sync selectable columns array when signals change
   * Using effect in constructor is safe in Angular 17+
   */
  private setupColumnSync(): void {
    effect(() => {
      // This effect runs when selectableColumns computed signal changes
      const columns = this.selectableColumns();
      this.selectableColumnsArray = [...columns];
      this.cdr.markForCheck();
    });
  }
  
  /**
   * Update cached array for template (called when signals change)
   */
  private updateSelectableColumnsArray(): void {
    this.selectableColumnsArray = [...this.selectableColumns()];
  }
  
  /**
   * Check if a column should be disabled
   */
  private isColumnDisabled(column: ColumnConfig): boolean {
    if (column.disabled !== undefined) {
      return column.disabled;
    }
    return column.key === 'actions' || 
           column.type === 'index' || 
           column.sticky === true ||
           column.key === 'sr_no';
  }
  
  /**
   * TrackBy function for *ngFor optimization
   * Prevents unnecessary DOM re-renders
   */
  trackByColumnKey(_index: number, column: ColumnModel): string {
    return column.key;
  }
  
  /**
   * Handle search input changes with debouncing
   */
  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery = value;
    this.searchSubject.next(value);
  }
  
  /**
   * Toggle select all functionality
   */
  toggleSelectAll(): void {
    const selectable = this.selectableColumns();
    const newState = !this.allSelected();
    
    // Create immutable update
    const updatedColumns = this.allColumnsSignal().map(column => {
      const isSelectable = !column.disabled && 
        selectable.some(sc => sc.key === column.key);
      
      if (isSelectable) {
        return { ...column, selected: newState };
      }
      return column;
    });
    
    this.allColumnsSignal.set(updatedColumns);
    this.updateSelection();
  }
  
  /**
   * Toggle individual column selection
   */
  toggleColumn(column: ColumnModel): void {
    if (column.disabled) {
      return;
    }
    
    // Create immutable update
    const updatedColumns = this.allColumnsSignal().map(col => 
      col.key === column.key 
        ? { ...col, selected: !col.selected }
        : col
    );
    
    this.allColumnsSignal.set(updatedColumns);
    this.updateSelection();
  }
  
  /**
   * Update selection state and emit changes
   * Note: selectableColumnsArray is automatically updated via effect
   */
  private updateSelection(): void {
    const selectedKeys = new Set(
      this.allColumnsSignal()
        .filter(column => column.selected)
        .map(column => column.key)
    );
    
    this.selectedKeysSignal.set(selectedKeys);
    
    // Emit selection change callback
    if (typeof this.data?.onSelectionChange === 'function') {
      const keysArray = Array.from(selectedKeys);
      this.data.onSelectionChange(keysArray);
    }
    
    // Effect will automatically update selectableColumnsArray
    // but we need to trigger change detection
    this.cdr.markForCheck();
  }
  
  /**
   * Apply selection and close dialog
   */
  applySelection(): void {
    const allColumns = this.allColumnsSignal();
    
    // Get disabled column keys (always included)
    const disabledColumnKeys = allColumns
      .filter(col => col.disabled)
      .map(col => col.key);
    
    // Get selected keys
    const selectedKeys = Array.from(this.selectedKeysSignal());
    
    // Combine and deduplicate
    const finalSelection = Array.from(
      new Set([...selectedKeys, ...disabledColumnKeys])
    );
    
    // Validate: Ensure at least one selectable column is selected
    const selectableSelected = selectedKeys.filter(key => {
      const column = allColumns.find(col => col.key === key);
      return column && !column.disabled;
    });
    
    if (selectableSelected.length === 0) {
      // Could show snackbar/alert here
      return;
    }
    
    // Emit callback if provided
    if (typeof this.data?.onSelectionChange === 'function') {
      this.data.onSelectionChange([...finalSelection]);
    }
    
    // Close dialog with result
    this.dialogRef.close(finalSelection);
  }
  
  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close();
  }
  
  /**
   * Getter for template compatibility (returns computed value)
   */
  get allSelectedValue(): boolean {
    return this.allSelected();
  }
  
  /**
   * Getter for template compatibility (returns computed value)
   */
  get hasPartialSelectionValue(): boolean {
    return this.hasPartialSelection();
  }
}
