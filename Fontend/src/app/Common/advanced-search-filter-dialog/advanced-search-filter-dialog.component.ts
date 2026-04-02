import { Component, Inject, OnInit, Input, Output, EventEmitter, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { inject } from '@angular/core';

@Component({
  selector: 'app-advanced-search-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './advanced-search-filter-dialog.component.html',
  styleUrl: './advanced-search-filter-dialog.component.scss'
})
export class AdvancedSearchFilterDialogComponent implements OnInit {
  @Input() filterData: any = {};
  @Output() filterApplied = new EventEmitter<any>();

  filterForm: FormGroup;

  private readonly dialogRef = inject(MatDialogRef<AdvancedSearchFilterDialogComponent>, { optional: true });
  public readonly data = inject(MAT_DIALOG_DATA, { optional: true });

  constructor() {
    // Initialize the form
    this.filterForm = new FormGroup({
      project_id: new FormControl(null),
      wing_id: new FormControl(null),
      floor_id: new FormControl(null),
      booking_status_id: new FormControl(null),
      agreement_status_id: new FormControl(null),
      start_date: new FormControl(null),
      end_date: new FormControl(null),
    });
  }

  ngOnInit(): void {
    // Use either input data or dialog data
    const filterData = this.filterData || this.data || {};

    // Initialize filter options
    this.projects = filterData.projects || [];
    this.wings = filterData.wings || [];
    this.floors = filterData.floors || [];
    this.bookingStatuses = filterData.bookingStatuses || [];
    this.agreementStatuses = filterData.agreementStatuses || [];
  }

  // Filter options
  projects: any[] = [];
  wings: any[] = [];
  floors: any[] = [];
  bookingStatuses: any[] = [];
  agreementStatuses: any[] = [];

  // When project changes, fetch wings
  onProjectChange(projectId: any): void {
    // Reset dependent fields
    this.filterForm.get('wing_id')?.setValue(null);
    this.filterForm.get('floor_id')?.setValue(null);

    // In a real implementation, you would fetch wings for this project
    // For now, we'll just emit this change so the parent component can handle it
    this.emitFilterChange({ project_id: projectId });
  }

  // When wing changes, fetch floors
  onWingChange(wingId: any): void {
    // Reset dependent field
    this.filterForm.get('floor_id')?.setValue(null);

    // Emit this change so the parent component can handle it
    this.emitFilterChange({
      project_id: this.filterForm.get('project_id')?.value,
      wing_id: wingId
    });
  }

  // Apply filters
  applyFilters(): void {
    this.emitFilterChange(this.filterForm.value);
  }

  // Reset filters
  resetFilters(): void {
    this.filterForm.reset();
    this.emitFilterChange({});
  }

  // Emit filter changes
  emitFilterChange(filterData: any): void {
    this.filterApplied.emit(filterData);

    // If used in a dialog, close the dialog with the filter data
    if (this.dialogRef) {
      this.dialogRef.close(filterData);
    }
  }
}
