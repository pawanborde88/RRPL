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
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { CommentLogComponent } from '../../../comment-log/comment-log.component';
import { CommentLogService } from '../../../comment-log/comment-log.service';
import { LeadLevel, CallStatus } from '../../../comment-log/comment-log.models';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, distinctUntilChanged, filter, finalize, shareReplay } from 'rxjs/operators';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { CommonService } from '../../../../../Service/common/common.service';

@Component({
  selector: 'app-followupreport',
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
  templateUrl: './followupreport.component.html',
  styleUrl: './followupreport.component.scss',
})
export class FollowupreportComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly commentLogService = inject(CommentLogService);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly DATE_FORMAT = 'yyyy-MM-dd';

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly allTelecallerlist = signal<any[]>([]);
  
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

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;
  private telecallerCache$?: ReturnType<typeof this.commonService.fetchTelecallerDropdown>;

  leadForm = new FormGroup({
    project_id: new FormControl<number[]>([], Validators.required),
    telecaller_id: new FormControl<number[]>([]),
    from_date: new FormControl<Date | null>(null),
    to_date: new FormControl<Date | null>(null),
    lead_level_id: new FormControl<number | null>(null),
    call_status_id: new FormControl<number | null>(null),
    ignore_date_filters: new FormControl(false),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: number[] | null;
    telecaller_id: number[] | null;
    from_date: Date | null;
    to_date: Date | null;
    lead_level_id: number | null;
    call_status_id: number | null;
    ignore_date_filters: boolean;
  }>({
    project_id: null,
    telecaller_id: null,
    from_date: null,
    to_date: null,
    lead_level_id: null,
    call_status_id: null,
    ignore_date_filters: false,
  });

  readonly columnDefinitions: readonly TableColumn[] = [
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    
    { key: 'project_lead_id', label: 'Lead No' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'customer_name', label: 'Client Name' },
    {
      key: 'latest_follow_up_date',
      label: 'Follow-up Date',
      type: 'mediumDate',
    },
    { key: 'created_by_name', label: 'TeleCaller' },
    { key: 'latest_follow_up_period', label: 'Updated Time' },
    { key: 'call_status', label: 'Updated Status' },
    { key: 'latest_remark', label: 'Updated Remark', type: 'truncate' },
    { key: 'current_lead_level', label: 'Updated Lead Type' },
    { key: 'call_done_count', label: 'Call Done Count' },
  ] as const;

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.formValues();
    const filters = this.buildFilters(formValues);

    return {
      filters,
    };
  });

  // Computed signal for filter validation
  readonly isFilterValid = computed(() => {
    const filters = this.formValues();
    return !!filters.project_id && filters.project_id.length > 0;
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
    
    // Watch for project changes to fetch telecallers
    this.leadForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectIds) => {
        if (projectIds && projectIds.length > 0) {
          this.fetchAllTalecallerList(projectIds);
        } else {
          this.allTelecallerlist.set([]);
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
      telecaller_id: formValue.telecaller_id || null,
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
    telecaller_id: number[] | null;
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

    // Telecaller ID filter
    if (formValues.telecaller_id && formValues.telecaller_id.length > 0) {
      filters['telecaller_id'] = formValues.telecaller_id;
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
          catchError((error) => {
            console.error('Error fetching projects:', error);
            this.showSnackBar('Unable to fetch projects.');
            return of([]);
          }),
          finalize(() => this.loading.set(false)),
          shareReplay(1)
        );
    }

    this.projectsCache$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => {
          this.projectsList.set(projects || []);
        }
      });
  }

  /**
   * Fetch telecaller list using CommonService
   */
  fetchAllTalecallerList(projectIds: number[]): void {
    if (!projectIds || projectIds.length === 0) {
      this.allTelecallerlist.set([]);
      return;
    }

    this.loading.set(true);

    this.commonService
      .fetchTelecallerDropdown(projectIds)
      .pipe(
        catchError((error) => {
          console.error('Error fetching telecallers:', error);
          this.showSnackBar('Unable to fetch telecaller details.');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (telecallers) => {
          const telecallersWithFullName = telecallers.map((item: any) => ({
            ...item,
            full_name: `${item.first_name} ${item.last_name}`,
          }));
          this.allTelecallerlist.set(telecallersWithFullName);
        }
      });
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
      minWidth: '60vw',
      maxWidth: '50vw',
      maxHeight: '100vh',
      data: {
        title: `Add FollowUp`,
        payload: 'project_lead_id',
        request: data?.project_lead_id,
        apiUrl: 'add_lead_follow_up',
        successMessage: 'Follow-up Added Successfully...',
        rowData: data,
        for: 'lead-followUp',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.refreshAgGridData(); // Refresh the grid if data was modified
      }
    });
  }
}
