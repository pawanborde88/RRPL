import { CommonModule } from '@angular/common';
import { 
  ChangeDetectionStrategy, 
  Component, 
  computed, 
  DestroyRef,
  effect,
  EventEmitter, 
  inject,
  input, 
  model,
  Output, 
  signal,
  Signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { AngularMaterialModule } from '../../../../angular-material.module';

// Custom interface for pagination events with offset
export interface CustomPageEvent extends PageEvent {
  offset: number;
}

// Type for navigation directions
type NavigationDirection = 'first' | 'prev' | 'next' | 'last';

// Interface for computed pagination state
interface PaginationState {
  totalPages: number;
  displayText: string;
  isFirstPage: boolean;
  isLastPage: boolean;
  isAllSelected: boolean;
  canNavigate: boolean;
}

@Component({
  selector: 'app-custom-pagination',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
  ],
  templateUrl: './custom-pagination.component.html',
  styleUrl: './custom-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.pagination-disabled]': 'paginationState().totalPages <= 1',
    '[attr.aria-label]': '"Pagination controls"'
  }
})
export class CustomPaginationComponent {
  // Modern Angular signals for reactive state management
  readonly pageSize = model<number>(10);
  readonly currentPage = model<number>(0);
  readonly totalItems = input<number>(0);
  readonly pageSizeOptions = input<number[]>([10, 15, 20]);
  readonly showAllOption = input<boolean>(true);
  
  @Output() readonly pageChange = new EventEmitter<CustomPageEvent>();

  // Inject DestroyRef for automatic cleanup (Angular 16+)
  private readonly destroyRef = inject(DestroyRef);

  // Computed values for optimal performance - cached and only recalculated when dependencies change
  protected readonly totalPages = computed(() => {
    const size = this.pageSize();
    const total = this.totalItems();
    
    if (size === -1) return 1;
    return size > 0 ? Math.ceil(total / size) : 1;
  });

  protected readonly displayText = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    const current = this.currentPage();

    if (total === 0) return '0 of 0';
    if (size === -1) return `All ${total} items`;
    
    const start = current * size + 1;
    const end = Math.min((current + 1) * size, total);
    return `${start} - ${end} of ${total}`;
  });

  protected readonly isFirstPage = computed(() => this.currentPage() === 0);
  
  protected readonly isLastPage = computed(() => 
    this.currentPage() >= this.totalPages() - 1 || this.pageSize() === -1
  );

  protected readonly isAllSelected = computed(() => this.pageSize() === -1);

  // Consolidated pagination state for template optimization
  protected readonly paginationState = computed<PaginationState>(() => ({
    totalPages: this.totalPages(),
    displayText: this.displayText(),
    isFirstPage: this.isFirstPage(),
    isLastPage: this.isLastPage(),
    isAllSelected: this.isAllSelected(),
    canNavigate: this.pageSize() !== -1
  }));

  // Merged page size options with 'All' option
  protected readonly mergedPageSizeOptions = computed(() => {
    const options = [...this.pageSizeOptions()];
    if (this.showAllOption()) {
      options.push(-1);
    }
    return options;
  });

  constructor() {
    // Effect to emit page change events when relevant state changes
    effect(() => {
      const size = this.pageSize();
      const current = this.currentPage();
      const total = this.totalItems();
      
      // Validate current page is within bounds
      if (current >= this.totalPages() && this.totalPages() > 0) {
        this.currentPage.set(this.totalPages() - 1);
        return;
      }

      this.emitPageEvent();
    }, { allowSignalWrites: true });
  }

  /**
   * Handles page size changes with optimized state updates
   * @param newSize - The new page size selected
   */
  protected onPageSizeChange(newSize: number | string): void {
    const size = Number(newSize);
    
    // Validate page size
    if (isNaN(size) || (size < 1 && size !== -1)) {
      console.warn('Invalid page size:', newSize);
      return;
    }

    // Use single batch update for better performance
    this.pageSize.set(size);
    this.currentPage.set(0); // Reset to first page
  }

  /**
   * Handles page navigation with bounds checking
   * @param direction - Navigation direction
   */
  protected onPageChange(direction: NavigationDirection): void {
    // Skip navigation if "All" is selected
    if (this.isAllSelected()) return;
    
    const current = this.currentPage();
    const totalPages = this.totalPages();
    
    let newPage = current;
    
    switch (direction) {
      case 'first':
        newPage = 0;
        break;
      case 'prev':
        newPage = Math.max(0, current - 1);
        break;
      case 'next':
        newPage = Math.min(totalPages - 1, current + 1);
        break;
      case 'last':
        newPage = totalPages - 1;
        break;
    }
    
    // Only update if page actually changed
    if (newPage !== current) {
      this.currentPage.set(newPage);
    }
  }

  /**
   * Track by function for ngFor optimization
   */
  protected trackByOption = (_index: number, option: number): number => option;

  /**
   * Emits pagination event with current state
   */
  private emitPageEvent(): void {
    const size = this.pageSize();
    const current = this.currentPage();
    const total = this.totalItems();
    const offset = size === -1 ? 0 : current * size;

    const event: CustomPageEvent = {
      pageIndex: current,
      pageSize: size,
      length: total,
      offset: offset,
      previousPageIndex: current
    };

    this.pageChange.emit(event);
  }

  /**
   * Format option display text
   */
  protected getOptionText(option: number): string {
    return option === -1 ? 'All' : option.toString();
  }
}
