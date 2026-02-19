import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges, OnDestroy } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../template/template.component';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-column-wise-filter',
  standalone: true,
  imports: [    CommonModule,
      RouterModule,
      TemplateComponent,
      BreadcrumbComponent,
      AngularMaterialModule,
      FormsModule,
      ReactiveFormsModule,],
  templateUrl: './columnwise-filter.component.html',
  styleUrl: './columnwise-filter.component.scss'
})
export class ColumnwiseFilterComponent implements OnDestroy {
  @Input() placeholder: string = 'Filter...';
  @Input() value: string = '';
  @Input() debounceTime: number = 300;
  @Output() valueChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<void>();
  
  private filterDebounce$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor() {
    // Set up debounced filtering
    this.filterDebounce$.pipe(
      debounceTime(this.debounceTime),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.emitFilterChange();
    });
  }
  onSpaceKey(event: KeyboardEvent): void {
    // Allow space to be entered normally
    event.stopPropagation();
  }

  onInputChange(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.filterDebounce$.next(); // Trigger debounced filter
  }

  onEnterKey(): void {
    // Immediately apply filter when Enter is pressed
    this.emitFilterChange();
  }

  clearFilter(): void {
    this.value = '';
    this.valueChange.emit('');
    this.emitFilterChange(); // Apply immediately when clearing
  }

  private emitFilterChange(): void {
    this.filterChange.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}