import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, RouterModule, AngularMaterialModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
 @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() pageSizeOptions: (number | string)[] = [10, 20, 30, 'All'];
  @Input() totalItems: number = 0;
  @Input() filteredCount: number = 0;
  @Input() showPageSize: boolean = true;
  @Input() loadingState: boolean = false;

  @Input() set pageSize(value: number | string) {
    if (value && this._pageSize !== value) {
      this._pageSize = value;
      this.updatePageNumbers();
    }
  }
  get pageSize(): number | string {
    return this._pageSize || this.pageSizeOptions[0];
  }
  private _pageSize!: number | string;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number | string>();

  pages: (number | string)[] = [];

  ngOnInit() {
    this.updatePageNumbers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totalItems'] || changes['currentPage'] || changes['filteredCount']) {
      this.updatePageNumbers();
    }
  }

  updatePageNumbers() {
    const effectivePageSize = this.pageSize === 'All' ? this.filteredCount : +this.pageSize;
    this.totalPages = effectivePageSize === 0 ? 1 : Math.max(1, Math.ceil(this.totalItems / effectivePageSize));
    
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (this.currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push('...');
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push('...');
        pages.push(this.currentPage - 1);
        pages.push(this.currentPage);
        pages.push(this.currentPage + 1);
        pages.push('...');
        pages.push(this.totalPages);
      }
    }

    this.pages = pages;
  }

  onPageChange(page: number | string) {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }

 onPageSizeChange(newSize: number | string) {
  if (newSize && newSize !== this._pageSize) {
    this._pageSize = newSize;
    this.currentPage = 1;
    this.pageSizeChange.emit(newSize);
    this.pageChange.emit(1);
    this.updatePageNumbers(); // Ensure UI updates
  }
}
  get startItem(): number {
    if (this.pageSize === 'All') return 1;
    return (this.currentPage - 1) * +this.pageSize + 1;
  }

  get endItem(): number {
    if (this.pageSize === 'All') return this.filteredCount;
    return Math.min(this.currentPage * +this.pageSize, this.filteredCount);
  }

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }
}
