import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../../../../Service/common/common.service';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { CommentLogComponent } from '../../../comment-log/comment-log.component';
import { CommentLogService } from '../../../comment-log/comment-log.service';
import { LeadLevel, CallStatus } from '../../../comment-log/comment-log.models';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, distinctUntilChanged, filter } from 'rxjs/operators';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';

@Component({
  selector: 'app-enquiry-report',
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
  templateUrl: './enquiry-report.component.html',
  styleUrl: './enquiry-report.component.scss',
})
export class EnquiryReportComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly commonService = inject(CommonService);
  private readonly commentLogService = inject(CommentLogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly DATE_FORMAT = 'yyyy-MM-dd';

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly allSalesExecutive = signal<any[]>([]);

  // Computed signals for permission checks
  private readonly userId = computed(() => {
    return Number(sessionStorage.getItem('session_id')) || 0;
  });

  readonly roleId = computed(() => {
    return Number(sessionStorage.getItem('role_id')) || 0;
  });

  // Observable properties for dropdowns (like comment-log component)
  leadLevels$: Observable<LeadLevel[]> = of([]);
  callStatus$: Observable<CallStatus[]> = of([]);

  leadForm = new FormGroup({
    project_id: new FormControl<number[]>([], Validators.required),
    sales_executive_id: new FormControl<number[]>([]),
    from_date: new FormControl<Date | null>(null),
    to_date: new FormControl<Date | null>(null),
    lead_level_id: new FormControl<number | null>(null),
    call_status_id: new FormControl<number | null>(null),
    ignore_date_filters: new FormControl(false),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: number[] | null;
    sales_executive_id: number[] | null;
    from_date: Date | null;
    to_date: Date | null;
    lead_level_id: number | null;
    call_status_id: number | null;
    ignore_date_filters: boolean;
  }>({
    project_id: null,
    sales_executive_id: null,
    from_date: null,
    to_date: null,
    lead_level_id: null,
    call_status_id: null,
    ignore_date_filters: false,
  });

  readonly columnDefinitions: readonly TableColumn[] = [
    {
      key: 'actions',
      label: 'Action',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'enquiry_id',
      label: 'Enquiry No',
      type: 'number',
    },
    {
      key: 'enquiry_date',
      label: 'Enquiry Date',
      type: 'mediumDate',
    },
    {
      key: 'project_name',
      label: 'Project Name'
    },
    {
      key: 'customer_name',
      label: 'Client Name'
    },
    {
      key: 'created_by_name',
      label: 'Follow Up By'
    },
    {
      key: 'call_status',
      label: 'Current Status'
    },
    {
      key: 'latest_follow_up_date',
      label: 'Current Date',
      type: 'mediumDate',
    },
    {
      key: 'previous_remark',
      label: 'Previous Remark',
      type: 'truncate'
    },
    {
      key: 'latest_remark',
      label: 'Current Remark',
      type: 'truncate'
    },
    {
      key: 'call_done_count',
      label: 'Call Done Count',
      type: 'number'
    },
    {
      key: 'latest_follow_up_period',
      label: 'Current Period'
    }
  ] as const;

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

    // Initialize lead levels observable from service (like comment-log component)
    this.leadLevels$ = this.commentLogService.fetchLeadLevels().pipe(
      catchError((error) => {
        this.showSnackBar('Unable to fetch lead levels.');
        return of([]);
      })
    );

    // Setup lead level listener for call status (like comment-log component)
    this.setupLeadLevelListener();

    // Watch for project changes to fetch sales executives
    this.leadForm.get('project_id')?.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => {
          // Compare arrays by their sorted string representation to avoid duplicate calls
          const prevStr = Array.isArray(prev) ? [...prev].sort().join(',') : '';
          const currStr = Array.isArray(curr) ? [...curr].sort().join(',') : '';
          return prevStr === currStr;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((projectIds) => {
        if (projectIds && projectIds.length > 0) {
          this.fetchAllSalesExecutive(projectIds);
        } else {
          this.allSalesExecutive.set([]);
        }
      });

    // Watch for form changes to update formValues signal
    this.leadForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateFormValues();
      });
  }

  private setupLeadLevelListener(): void {
    this.leadForm
      .get('lead_level_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((value: any): value is number => {
          return typeof value === 'number' && value > 0;
        }),
        switchMap((leadLevelId: number) => {
          // Get call status for the selected lead level
          return this.commentLogService.fetchCallStatus(leadLevelId).pipe(
            catchError((error) => {
              this.showSnackBar('Unable to fetch call statuses.');
              return of([]);
            })
          );
        })
      )
      .subscribe((callStatuses: CallStatus[]) => {
        this.callStatus$ = of(callStatuses);
      });

    // Reset call status when lead level is cleared
    this.leadForm
      .get('lead_level_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((value: any) => !value || value === null || value === 0)
      )
      .subscribe(() => {
        this.callStatus$ = of([]);
        this.leadForm.get('call_status_id')?.reset();
      });
  }

  // TrackBy functions for dropdowns (like comment-log component)
  trackByLeadLevelId(index: number, level: LeadLevel): number {
    return level.lead_level_id;
  }

  trackByCallStatusId(index: number, status: CallStatus): number {
    return status.call_status_id;
  }

  /**
   * Update formValues signal from form
   */
  private updateFormValues(): void {
    const formValue = this.leadForm.value;
    this.formValues.set({
      project_id: formValue.project_id || null,
      sales_executive_id: formValue.sales_executive_id || null,
      from_date: formValue.from_date || null,
      to_date: formValue.to_date || null,
      lead_level_id: formValue.lead_level_id || null,
      call_status_id: formValue.call_status_id || null,
      ignore_date_filters: formValue.ignore_date_filters || false,
    });
  }

  /**
   * Build filters object for API payload
   */
  private buildFilters(formValues: {
    project_id: number[] | null;
    sales_executive_id: number[] | null;
    from_date: Date | null;
    to_date: Date | null;
    lead_level_id: number | null;
    call_status_id: number | null;
    ignore_date_filters: boolean;
  }): Record<string, any> {
    const filters: Record<string, any> = {};

    // Project ID filter
    if (formValues.project_id && formValues.project_id.length > 0) {
      filters['project_id'] = formValues.project_id;
    }

    // Sales Executive ID filter
    const salesExecutiveId = this.getTelecallerIdValue(formValues);
    if (salesExecutiveId && salesExecutiveId.length > 0) {
      filters['sales_executive_id'] = salesExecutiveId;
    }

    // Lead Level filter
    if (formValues.lead_level_id) {
      filters['lead_level_id'] = formValues.lead_level_id;
    }

    // Call Status filter
    if (formValues.call_status_id) {
      filters['call_status_id'] = formValues.call_status_id;
    }

    // Date filters (if not ignored)
    if (!formValues.ignore_date_filters) {
      if (formValues.from_date) {
        filters['from_date'] = this.datePipe.transform(formValues.from_date, this.DATE_FORMAT);
      }
      if (formValues.to_date) {
        filters['to_date'] = this.datePipe.transform(formValues.to_date, this.DATE_FORMAT);
      }
    }

    return filters;
  }

  fetchAllSalesExecutive(projectIds: number[]): void {
    if (!projectIds || projectIds.length === 0) {
      this.allSalesExecutive.set([]);
      return;
    }

    this.loading.set(true);

    this.commonService
      .fetchSalesExecutives(projectIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.allSalesExecutive.set(res || []);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error(err);
          this.loading.set(false);
          this.showSnackBar('Unable to fetch sales executives.');
        },
      });
  }

  fetchAllProjects(): void {
    this.loading.set(true);

    this.commonService
      .fetchUserProjectDropdown(this.userId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.projectsList.set(res || []);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error(err);
          this.loading.set(false);
          this.showSnackBar('Unable to fetch projects.');
        },
      });
  }
  private hasOnlyRoles(allowedRoles: number[]): boolean {
    const roleData = sessionStorage.getItem('role_id');
    if (!roleData) return false;
    const currentRoles = roleData.split(',').map(Number);

    // Check if user has any of the allowed roles
    return currentRoles.some((role) => allowedRoles.includes(role));
  }

  private getTelecallerIdValue(formValues: {
    sales_executive_id: number[] | null;
  }): number[] | null {
    const userId = this.userId();

    // If user has role 7, they can only see their own leads
    if (this.hasOnlyRoles([7])) {
      return userId ? [userId] : null;
    }

    // Default case: return sales_executive_id from form if specified
    if (formValues.sales_executive_id?.length) {
      return Array.isArray(formValues.sales_executive_id)
        ? formValues.sales_executive_id.map((id: any) => Number(id))
        : [Number(formValues.sales_executive_id)];
    }

    return null;
  }

  /**
   * Apply filters and refresh grid data
   */
  fetchAllProjectLeads(): void {
    // Update form values signal
    this.updateFormValues();

    // Refresh AG Grid data
    this.agGridComponent?.refreshData();
  }

  /**
   * Refresh AG Grid data
   */
  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  /**
   * Show snackbar message
   */
  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
    });
  }

  // Actions for AG Grid (readonly constant)
  readonly bookingActions: readonly any[] = [
    {
      action: 'addComment',
      icon: 'add_comment',
      tooltip: 'Follow Up',
      color: 'primary',
      show: (row: any) => row?.telecaller_id !== null,
    },
  ] as const;

  onBookingAction(action: string, row: any): void {
    if (action === 'addComment') {
      this.openAddCommentDialog(row);
    }
  }

  openAddCommentDialog(data: any): void {
    const dialogRef = this.dialog.open(CommentLogComponent, {
      minWidth: '40vw',
      maxWidth: '50vw',
      maxHeight: '100vh',
      data: {
        title: `Add Comment to ${data?.project_name || 'Project'}`,
        payload: 'enquiry_id',
        request: data?.enquiry_id,
        apiUrl: 'add_comment',
        successMessage: 'Follow-up Added Successfully...',
        rowData: data,
        for: 'Enquiries',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.refreshAgGridData(); // Refresh the grid if data was modified
      }
    });
  }
}
