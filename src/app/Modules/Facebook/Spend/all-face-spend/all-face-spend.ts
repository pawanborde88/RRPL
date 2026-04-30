import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
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
import { AddEditFaceBookSpend } from '../add-edit-face-book-spend/add-edit-face-book-spend';
interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  source_id: FormControl<any[] | null>;
}
@Component({
  selector: 'app-all-face-spend',
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
  templateUrl: './all-face-spend.html',
  styleUrl: './all-face-spend.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllFaceSpend implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

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
  readonly sourcesList = signal<any[]>([]);
  readonly dataSource = new MatTableDataSource<any>();
  searchText: string = '';
  pipe = new DatePipe('en-US');
  private readonly authService = inject(AuthService);

  // Form definition
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any[] | null>([], Validators.required),
    source_id: new FormControl<any[] | null>([], null),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: any[] | null;
    source_id: any[] | null;
  }>({
    project_id: null,
    source_id: null,
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
    { key: 'source_name', label: 'Source Name' },
    { key: 'source_detail_name', label: 'Source Detail Name' },

    { key: 'start_date', label: 'Start Date', type: 'date' },
    { key: 'end_date', label: 'End Date', type: 'date' },

    { key: 'spend_amount', label: 'Spend Amount', isAmount: true },
    { key: 'remaning_amount', label: 'Remaining Amount', isAmount: true },
    { key: 'quantity', label: 'Quantity', isAmount: true },

    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },

    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ] as const;
  headerButtons = [
    {
      label: ' Add Facebook Spend ',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openaddFacebookDialog(),
      show: () => this.hasPermission('630'),
    },
  ];
  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.formValues();
    const filters = this.buildFilters(formValues);

    return {

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
        });
      });

    // Initialize with current form values
    const initialValue = this.enquiryFilterForm.value;
    this.formValues.set({
      project_id: initialValue.project_id ?? null,
      source_id: initialValue.source_id ?? null,
    });
  }

  applyFilter(searchText: string): void {
    this.searchText = searchText;
    this.refreshAgGridData();
  }

  private buildFilters(formValues: {
    project_id: any[] | null;
    source_id: any[] | null;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id && Array.isArray(formValues.project_id) && formValues.project_id.length > 0
        ? formValues.project_id
        : null,
      source_id: formValues.source_id && Array.isArray(formValues.source_id) && formValues.source_id.length > 0
        ? formValues.source_id
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

  fetchAllFaceBookList(): void {
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
  openaddFacebookDialog(): void {
    const dialogRef = this.dialog.open(AddEditFaceBookSpend, {
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

  openAddBookingBillDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddEditFaceBookSpend, {
      width: '600px',
      data: {
        bookingID: this.selectedfacebookSetupID, // Pass bookingID as part of the data
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
  onBookingAction(action: string, row: any): void {
    if (action === 'editChannelPartnerBooking') {
      this.openAddBookingBillDialog(row);
    } else if (action === 'deleteFacebookID') {
      this.deleteFaceBookID(row.spend_id);
    }
  }

  deleteFaceBookID(spend_id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Spend?' },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          const reason = result.reason; // Get the reason from the dialog response

          let requestPayload = {
            spend_id: spend_id,
            reason: reason, // Set the reason from the dialog
            created_by: this.userId, // Set created_by value here
          };

          this.http
            .post(`${this.baseUrl}/delete_spend`, requestPayload)
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              catchError((err) => {
                this.showSnackBar('Unable to Delete Facebook.', 'error');
                return of(null);
              })
            )
            .subscribe({
              next: (data: any) => {
                if (data) {
                  this.showSnackBar('Facebook deleted successfully');
                  this.refreshAgGridData(); // Refresh the AG Grid data
                }
              },
            });
        }
      });
  }
  readonly bookingActions: readonly any[] = [
    {
      action: 'editChannelPartnerBooking', // Must match what you check in onBookingAction
      icon: 'edit_note', // Material icon name
      tooltip: 'Edit', // Tooltip text
      color: 'primary', // Optional button color
      disabled: false, // Optional disabled state
      show: () => this.hasPermission('631'),

    },
    {
      action: 'deleteFacebookID', // Must match what you check in onBookingAction
      icon: 'delete', // Material icon name
      tooltip: 'Delete ', // Tooltip text
      color: 'warn', // Optional button color
      disabled: false, // Optional disabled state
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
