import { Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { AddEditSourceTarget } from '../add-edit-source-target/add-edit-source-target';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AuthService } from '../../../../Service/auth.service';
import { CommonService } from '../../../../Service/common/common.service';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';



interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  source_id: FormControl<any | null>;
  from_date: FormControl<Date | null>;
  to_date: FormControl<Date | null>;
}


@Component({
  selector: 'app-all-source-wise-targets',
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-source-wise-targets.html',
  styleUrl: './all-source-wise-targets.scss',
})
export class AllSourceWiseTargets {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Dependency Injection
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);

  // Constants
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  selectedSourceTargetID: any = null;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly sourcesList = signal<any[]>([]);
  readonly dataSource = new MatTableDataSource<any>();
  searchText: string = '';
  pipe = new DatePipe('en-US');
  private readonly authService = inject(AuthService);

  // Form definition
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any[] | null>([]),
    source_id: new FormControl<any | null>(null),
    from_date: new FormControl<Date | null>(null),
    to_date: new FormControl<Date | null>(null),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: any[] | null;
    source_id: any | null;
    from_date: Date | null;
    to_date: Date | null;
  }>({
    project_id: null,
    source_id: null,
    from_date: null,
    to_date: null,
  });
  // Column definitions for AG Grid (readonly constant)
  readonly columnDefinitions: readonly TableColumn[] = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'project_name', label: 'Project' },
    { key: 'source_name', label: 'Source Name' },
    { key: 'target_from', label: 'From', type: 'date' },
    { key: 'target_to', label: 'To', type: 'date' },
    { key: 'site_visit_target', label: 'Site Visit Target' },
    { key: 'lead_target', label: 'Lead Target' },
    { key: 'booking_target', label: 'Booking Target' },
    { key: 'site_visit_count', label: 'Site Visit Count' },
    { key: 'booking_count', label: 'Booking Count' },
    { key: 'created_by', label: 'Created By ID' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by', label: 'Updated By ID' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ] as const;
  headerButtons = [
    {
      label: ' Add Source Wise Target ',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddSourceTargetDialog(),
      show: () => this.hasPermission('630'),
    },
  ];
  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.formValues();
    const filters = this.buildFilters(formValues);

    return {
      offset: 0,
      limit: 100,
      sortBy: 'created_at',
      sortOrder: 'desc',
      search: '',
      filters,
    };
  });

  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchAllSources();
    this.setupFormValueTracking();
  }

  /**
   * Track form value changes and update formValues signal
   * This makes computed signals reactive to form changes
   */
  private setupFormValueTracking(): void {
    // Subscribe to form valueChanges and update signal
    this.enquiryFilterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValue) => {
        this.formValues.set({
          project_id: formValue.project_id ?? null,
          source_id: formValue.source_id ?? null,
          from_date: formValue.from_date ?? null,
          to_date: formValue.to_date ?? null,
        });
      });

    // Initialize with current form values
    const initialValue = this.enquiryFilterForm.value;
    this.formValues.set({
      project_id: initialValue.project_id ?? null,
      source_id: initialValue.source_id ?? null,
      from_date: initialValue.from_date ?? null,
      to_date: initialValue.to_date ?? null,
    });
  }

  applyFilter(searchText: string): void {
    this.searchText = searchText;
    this.refreshAgGridData();
  }

  private buildFilters(formValues: {
    project_id: any[] | null;
    source_id: any | null;
    from_date: Date | null;
    to_date: Date | null;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id && formValues.project_id.length > 0 ? formValues.project_id : null,
      source_id: formValues.source_id ? (Array.isArray(formValues.source_id) ? formValues.source_id : [formValues.source_id]) : null,
      from_date: formValues.from_date ? this.pipe.transform(formValues.from_date, 'yyyy-MM-dd') : null,
      to_date: formValues.to_date ? this.pipe.transform(formValues.to_date, 'yyyy-MM-dd') : null,
    };

    return filters;
  }

  fetchAllProjects(): void {
    this.loading.set(true);
    const userId = this.userId;

    this.commonService
      .fetchUserProjectDropdown(userId)
      .pipe(
        catchError((err) => {
          console.error('Error fetching projects:', err);
          this.showSnackBar('Unable to fetch projects.');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.projectsList.set(res || []);
        },
      });
  }

  fetchAllSources(): void {
    this.commonService
      .fetchSources()
      .pipe(
        catchError((err) => {
          console.error('Error fetching sources:', err);
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.sourcesList.set(res || []);
        },
      });
  }

  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  fetchAllSourceTargets(): void {
    this.refreshAgGridData();
  }

  readonly hasPermission = (permission: string): boolean =>
    this.authService.hasPermission(permission);
  readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
    this.authService.hasOnlyRoles(allowedRoles);
  private showSnackBar(message: string, panelClass: 'error' | 'default' = 'default'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass === 'error' ? ['snackbar-error'] : undefined,
    });
  }
  openAddSourceTargetDialog(): void {
    const dialogRef = this.dialog.open(AddEditSourceTarget, {
      width: '600px',
      panelClass: 'dialog-medium',
      data: {},
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.refreshAgGridData();
        }
      });
  }

  openEditSourceTargetDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddEditSourceTarget, {
      width: '600px',
      data: {
        editData: row, // Pass the row data when editing
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.refreshAgGridData();
        }
      });
  }
  onSourceTargetAction(action: string, row: any): void {
    if (action === 'editSourceTarget') {
      this.openEditSourceTargetDialog(row);
    } else if (action === 'deleteSourceTarget') {
      this.deleteSourceTarget(row.source_target_id);
    }
  }

  deleteSourceTarget(sourceTargetID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Source Target?' },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          const reason = result.reason;

          let requestPayload = {
            source_target_id: sourceTargetID,
            reason: reason,
            created_by: this.userId,
          };

          this.http
            .post(`${this.baseUrl}/delete_source_target`, requestPayload)
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              catchError((err) => {
                this.showSnackBar('Unable to Delete Source Target.', 'error');
                return of(null);
              })
            )
            .subscribe({
              next: (data: any) => {
                if (data) {
                  this.showSnackBar('Source Target deleted successfully');
                  this.refreshAgGridData();
                }
              },
            });
        }
      });
  }
  readonly sourceTargetActions: readonly any[] = [
    {
      action: 'editSourceTarget',
      icon: 'edit_note',
      tooltip: 'Edit',
      color: 'primary',
      disabled: false,
      show: () => this.hasPermission('631'),
    },
    {
      action: 'deleteSourceTarget',
      icon: 'delete',
      tooltip: 'Delete',
      color: 'warn',
      disabled: false,
      show: () => this.hasPermission('632'),
    },
  ] as const;
  onselectedMeetingChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedSourceTargetID = booking;
      console.log('Selected booking:', this.selectedSourceTargetID);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedSourceTargetID &&
        this.selectedSourceTargetID.source_target_id ===
        booking.source_target_id
      ) {
        this.selectedSourceTargetID = null;
      }
    }
  }
}
