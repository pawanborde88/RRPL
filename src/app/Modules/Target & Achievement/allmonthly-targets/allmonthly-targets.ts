import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { TemplateComponent } from '../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { AuthService } from '../../../Service/auth.service';
import { CommonService } from '../../../Service/common/common.service';
import { FetchFunctionsService } from '../../../Service/fetch-functions.service';
import { AddEditMontlyTargetDialog } from './add-edit-montly-target-dialog/add-edit-montly-target-dialog';
interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
}

@Component({
  selector: 'app-allmonthly-targets',
  standalone: true,
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
  templateUrl: './allmonthly-targets.html',
  styleUrl: './allmonthly-targets.scss',
})
export class AllmonthlyTargets {
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
  selectedfacebookSetupID: any = null;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly dataSource = new MatTableDataSource<any>();
  searchText: string = '';
  pipe = new DatePipe('en-US');
  private readonly authService = inject(AuthService);

  // Form definition
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any[] | null>([], Validators.required),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: any[] | null;
  }>({
    project_id: null,
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


    { key: 'project_name', label: 'Project Name' },
    { key: 'target_from', label: 'Target From', type: 'mediumDate' },
    { key: 'target_to', label: 'Target To', type: 'mediumDate' },

    // Targets
    { key: 'booking_target', label: 'Booking Target' },
    { key: 'agreement_target', label: 'Agreement Target' },
    { key: 'disbursement_target', label: 'Disbursement Target' },

    // Achievements
    { key: 'booking_achievement', label: 'Booking Achievement' },
    { key: 'agreement_achievement', label: 'Agreement Achievement' },
    { key: 'disbursement_achievement', label: 'Disbursement Achievement' },

    // Achievement Percentages
    { key: 'booking_achievement_percentage', label: 'Booking Achievement %' },
    { key: 'agreement_achievement_percentage', label: 'Agreement Achievement %' },
    { key: 'disbursement_achievement_percentage', label: 'Disbursement Achievement %' },

    // Performance / Counts
    { key: 'total_visit_count', label: 'Total Visits' },
    { key: 'site_visit_count', label: 'Site Visits' },
    { key: 'total_bookingcount', label: 'Total Bookings' },
    { key: 'booking_count', label: 'Current Bookings' },
    { key: 'total_done_agreement', label: 'Total Done Agreements' },
    { key: 'total_done_disbursement', label: 'Total Done Disbursements' },
    { key: 'not_done_agreement', label: 'Not Done Agreements' },
    { key: 'not_done_disbursement', label: 'Not Done Disbursements' },

    // Audit Fields
    { key: 'created_by', label: 'Created By ID' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By ID' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ] as const;
  headerButtons = [
    {
      label: ' Add Monthly Target ',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddMonthlyTargetDialog(),
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
        });
      });

    // Initialize with current form values
    const initialValue = this.enquiryFilterForm.value;
    this.formValues.set({
      project_id: initialValue.project_id ?? null,
    });
  }

  applyFilter(searchText: string): void {
    this.searchText = searchText;
    this.refreshAgGridData();
  }

  private buildFilters(formValues: {
    project_id: any[] | null;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id && Array.isArray(formValues.project_id) && formValues.project_id.length > 0
        ? formValues.project_id
        : null,
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

  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  fetchAllMonthlyTargets(): void {
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
  openAddMonthlyTargetDialog(): void {
    const dialogRef = this.dialog.open(AddEditMontlyTargetDialog, {
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

  openEditMonthlyTargetDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddEditMontlyTargetDialog, {
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

  onMonthlyTargetAction(action: string, row: any): void {
    if (action === 'editMonthlyTarget') {
      this.openEditMonthlyTargetDialog(row);
    } else if (action === 'deleteMonthlyTarget') {
      this.deleteMonthlyTarget(row.monthly_project_target_id);
    }
  }

  deleteMonthlyTarget(monthlyProjectTargetId: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Monthly Target?' },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          let requestPayload = {
            monthly_project_target_id: monthlyProjectTargetId,
            updated_by: this.userId,
          };

          this.http
            .post(`${this.baseUrl}/delete_monthely_target`, requestPayload)
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              catchError((err) => {
                this.showSnackBar('Unable to Delete Monthly Target.', 'error');
                return of(null);
              })
            )
            .subscribe({
              next: (data: any) => {
                if (data) {
                  this.showSnackBar('Monthly Target deleted successfully');
                  this.refreshAgGridData();
                }
              },
            });
        }
      });
  }
  readonly bookingActions: readonly any[] = [
    {
      action: 'editMonthlyTarget',
      icon: 'edit_note',
      tooltip: 'Edit',
      color: 'primary',
      disabled: false,
      show: () => this.hasPermission('631'),
    },
    {
      action: 'deleteMonthlyTarget',
      icon: 'delete',
      tooltip: 'Delete',
      color: 'warn',
      disabled: false,
      show: () => this.hasPermission('632'),
    },
  ] as const;
  onselectedMeetingChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedfacebookSetupID = booking;
      console.log('Selected booking:', this.selectedfacebookSetupID);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedfacebookSetupID &&
        this.selectedfacebookSetupID.facebook_setup_id ===
        booking.facebook_setup_id
      ) {
        this.selectedfacebookSetupID = null;
      }
    }
  }
}
