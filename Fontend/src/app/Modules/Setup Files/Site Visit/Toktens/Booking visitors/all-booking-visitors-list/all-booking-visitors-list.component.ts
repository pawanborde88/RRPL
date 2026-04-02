import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import { ConfirmDialogComponent } from '../../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../../../Service/fetch-functions.service';
import { CancelTokenDialogComponent } from '../../cancel-token-dialog/cancel-token-dialog.component';
import { RefundTokenPaymentComponent } from '../../refund-token-payment/refund-token-payment.component';
import { AddBookingVisitorDialogComponent } from '../add-booking-visitor-dialog/add-booking-visitor-dialog.component';
import { ConfigurableAgGridDataComponent } from '../../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { CommonService } from '../../../../../../Service/common/common.service';
import { catchError, of, finalize, shareReplay } from 'rxjs';
import { ResetUserPasswordComponent } from '../../../../USERS/add-user/Reset Password/reset-user-password/reset-user-password.component';

interface PaginationConfig {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-all-booking-visitors-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent
  ],
  templateUrl: './all-booking-visitors-list.component.html',
  styleUrl: './all-booking-visitors-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class AllBookingVisitorsListComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');
  private readonly baseUrl = environment.API_URL;

  // Constants
  private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly DEFAULT_PAGE_SIZE = 30;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly paginationConfig = signal<PaginationConfig>({
    offset: 0,
    limit: this.DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: number | null;
  }>({
    project_id: null,
  });

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;

  // Column definitions for AG Grid (readonly constant)
  readonly columnDefinitions: readonly TableColumn[] = [
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'date_of_visit', label: 'Date of Visit', type: 'mediumDate' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_unit', label: 'Unit No' },
    { key: 'applicant_name', label: 'Client Name' },
    { key: 'user_name', label: 'User Name' },
    { key: 'mob_no', label: 'Mobile Number', type: 'sensitive' },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
    { key: 'no_visitor', label: 'No. of Visitors', isAmount: true },
    { key: 'token_type', label: 'Token Type' },
    { key: 'token_no', label: 'Token No' },
    {
      key: 'is_booked',
      label: 'Booking Status',
      colorCondition: (element: any) =>
        element.is_booked === "Not Booked" ? 'red' : 'green',
    },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'created_by_name', label: 'Created By' },
  ] as const;

  // Actions for AG Grid (readonly constant)
  readonly bookingActions: readonly any[] = [
    {
      action: 'editBooking',
      icon: 'edit_note',
      tooltip: 'Edit Visit',
      color: 'primary',
      disabled: false,
    },
    {
      action: 'deleteBooking',
      icon: 'delete',
      tooltip: 'Delete Visit',
      color: 'warn',
      disabled: false,
    },

    {
      action: 'resetPassword',
      icon: 'lock',
      tooltip: 'Reset Password',
      color: 'primary',
      disabled: false,
    },

  ] as const;

  // Header buttons
  readonly headerButtons: readonly any[] = [
    {
      label: 'Add Visitor',
      icon: 'add',
      color: 'primary',
      action: () => this.addBooking(),
    },

  ] as const;

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};

    if (values.project_id != null) filters.project_id = values.project_id, filters.booking_status_id = 0;

    return { filters };
  });

  // Computed signal for filter validation
  readonly isFilterValid = computed(() => {
    const filters = this.formValues();
    return !!filters.project_id;
  });

  // Computed signals for permission checks
  private readonly userId = computed(() => {
    return Number(sessionStorage.getItem('session_id')) || 0;
  });

  private readonly roleData = computed(() => {
    return sessionStorage.getItem('role_id');
  });

  ngOnInit(): void {
    this.fetchAllProjects();
  }

  onProjectChange(projectId: number): void {
    if (projectId !== null && projectId !== undefined) {
      this.formValues.set({ project_id: projectId });
    } else {
      this.formValues.set({ project_id: null });
    }
    // Refresh AG Grid data
    setTimeout(() => {
      this.refreshAgGridData();
    }, 100);
  }

  /**
   * Handle booking action clicks from AG Grid
   */
  onBookingAction(action: string, row: any): void {
    switch (action) {
      case 'editBooking':
        this.editBooking(row);
        break;
      case 'resetPassword':
        this.resetPassword(row);
        break;
      case 'deleteBooking':
        this.deleteBooking(row);
        break;
    }
  }

  /**
   * Open dialog to add a new booking visitor
   */
  addBooking(): void {
    const dialogRef = this.dialog.open(AddBookingVisitorDialogComponent, {
      width: '600px',
      data: { row: null },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshAgGridData();
      }
    });
  }

  /**
   * Open dialog to edit an existing booking visitor
   */
  editBooking(row: any): void {
    const dialogRef = this.dialog.open(AddBookingVisitorDialogComponent, {
      width: '600px',
      data: { row: row },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshAgGridData();
      }
    });
  }

  /**
   * Reset password for a booking visitor
   */
  resetPassword(row: any): void {
    const dialogRef = this.dialog.open(ResetUserPasswordComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { userId: [row], for: 'visitor' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.refreshAgGridData();
      }
    });
  }

  /**
   * Delete booking visitor with confirmation
   */
  deleteBooking(row: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px',
      data: { message: 'Are you sure you want to delete Booking?' },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const requestPayload = {
          token_visitor_id: row.token_visitor_id,
        };

        this.http
          .post(`${this.baseUrl}/delete_visitor`, requestPayload)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            catchError((error: any) => {
              console.error('Error deleting booking:', error);
              this.showSnackBar('Unable to delete booking visitor.', 'error');
              return of(null);
            })
          )
          .subscribe({
            next: (data: any) => {
              if (data) {
                this.showSnackBar('Booking visitor deleted successfully', 'default');
                this.refreshAgGridData();
              }
            },
          });
      }
    });
  }

  /**
   * Check if user has permission
   */
  private hasPermission(...permissions: number[]): boolean {
    const roles = this.roleData();
    if (!roles) return false;
    return permissions.some((permission) => roles.includes(permission.toString()));
  }

  /**
   * Fetch all projects using CommonService with caching
   */
  fetchAllProjects(): void {
    const userId = this.userId();

    if (!this.projectsCache$) {
      this.loading.set(true);

      this.projectsCache$ = this.commonService
        .fetchUserProjectDropdown(userId)
        .pipe(
          catchError((error: any) => {
            console.error('Error fetching projects:', error);
            this.showSnackBar('Unable to fetch projects.', 'error');
            return of([]);
          }),
          finalize(() => this.loading.set(false)),
          shareReplay(1)
        );
    }

    this.projectsCache$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects: any[]) => {
          this.projectsList.set(projects || []);
        }
      });
  }

  /**
   * Refresh AG Grid data
   */
  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  /**
   * Build filters object for API payload
   */
  private buildFilters(formValues: {
    project_id: number | null;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: [formValues.project_id],
    };

    return filters;
  }

  /**
   * Show snackbar notification
   */
  private showSnackBar(message: string, panelClass: 'error' | 'default' = 'default'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass === 'error' ? ['snackbar-error'] : undefined,
    });
  }
}
