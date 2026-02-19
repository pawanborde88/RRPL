import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { distinctUntilChanged, catchError, of, shareReplay } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ResizableColumnDirective } from '../../../../../Common/directives/resizable-column.directive';
import { PaginationComponent } from '../../../../../Common/pagination/pagination.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { CommonService } from '../../../../../Service/common/common.service';
import { CommentLogComponent } from '../../../comment-log/comment-log.component';
import { AllCallRecordingsComponent } from '../../../../../Dialogs/all-call-recordings/all-call-recordings.component';
interface BookingAction {
  action: string;
  icon: string;
  tooltip: string;
  color?: string;
  disabled?: boolean;
  show: boolean;
}
@Component({
  selector: 'app-allclient-call-logs',
  standalone: true,
  imports: [
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    ActionColumnComponent,
    ResizableColumnDirective, // Add the component here
    AutocompleteReusableComponent,

    DragDropModule,

    PaginationComponent,
    ConfigurableAgGridDataComponent,
    // Add the pipe here
  ],
  templateUrl: './allclient-call-logs.component.html',
  styleUrl: './allclient-call-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class AllclientCallLogsComponent {
  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  // Session data - computed signals for reactive access
  readonly roleId = computed(() => Number(sessionStorage.getItem('role_id')) || 0);
  readonly userId = computed(() => Number(sessionStorage.getItem('session_id')) || 0);
  readonly roleData = computed(() => sessionStorage.getItem('role_id') || '');

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly statusDropdown = signal<any[]>([]);
  readonly allTelecallerlist = signal<any[]>([]);
  readonly allLeadLevels = signal<any[]>([]);
  readonly scrollIndex = signal<number>(0);
  readonly globalSearchTerm = signal<string>('');
  readonly isPanelExpanded = signal<boolean>(true);
  readonly selectedColumns = signal<string[]>([]);

  // Pagination state
  readonly paginationParams = signal<{
    offset: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search: string;
    filters: Record<string, any>;
    filteredCount: number;
  }>({
    offset: 0,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: '',
    filters: {},
    filteredCount: 0,
  });

  // ViewChild
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Form
  readonly columnsControl = new FormControl<string[]>([]);
  // Column definitions
  readonly columnDefinitions = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'id', label: 'ID' },
    { key: 'customer_name', label: 'Customer Name' },
    {
      key: 'start_stamp',
      label: 'Start Time',
      type: 'dateTime'  // or 'mediumDateTime' depending on your needs
    },
    {
      key: 'answer_stamp',
      label: 'Answer Time',
      type: 'dateTime'
    },
    {
      key: 'end_stamp',
      label: 'End Time',
      type: 'dateTime'
    },
    { key: 'direction', label: 'Direction' },
    { key: 'call_status', label: 'Call Status' },

    { key: 'hangup_cause', label: 'Hangup Cause' },
    { key: 'duration', label: 'Duration (seconds)', type: 'number' },
    { key: 'billsec', label: 'Billing Seconds', type: 'number' },
    { key: 'outbound_sec', label: 'Outbound Seconds', type: 'number' },
    { key: 'digits_dialed', label: 'Digits Dialed' },
    { key: 'answered_agent', label: 'Answered Agent ID' },
    { key: 'answered_agent_name', label: 'Agent Name' },
    { key: 'answered_agent_number', label: 'Agent Number', type: 'sensitive' },
    { key: 'agent_ring_time', label: 'Agent Ring Time', type: 'number' },
    { key: 'agent_transfer_ring_time', label: 'Transfer Ring Time', type: 'number' },
    { key: 'customer_ring_time', label: 'Customer Ring Time', type: 'number' },
    { key: 'call_connected', label: 'Call Connected', type: 'boolean' },

    { key: 'call_flow', label: 'Call Flow' },
    { key: 'broadcast_lead_fields', label: 'Broadcast Fields' },

    { key: 'recording_name', label: 'Recording Name' },
    { key: 'aws_call_recording_identifier', label: 'AWS Recording ID' },
    { key: 'campaign_name', label: 'Campaign Name' },
    { key: 'campaign_id', label: 'Campaign ID' },
    { key: 'reason_key', label: 'Disconnect Reason' },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'dateTime'
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      type: 'dateTime'
    },

  ] as const;

  readonly displayedColumns = this.columnDefinitions.map((col) => col.key);

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;
  ngOnInit(): void {
    this.fetchallLeadLevels();
    this.fetchAllEnquiryStatus();
    this.fetchAllProjects();

    // Set initial selected columns
    const initialColumns = this.columnDefinitions.map((col) => col.key);
    this.selectedColumns.set(initialColumns);
    this.columnsControl.setValue(initialColumns);

    this.columnsControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedKeys) => {
        this.selectedColumns.set(selectedKeys || []);
      });

    // Project ID listener
    this.leadForm.get('project_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((projectID) => {
        if (projectID && Array.isArray(projectID) && projectID.length > 0) {
          this.fetchAllTalecallerList(projectID);
        } else {
          this.allTelecallerlist.set([]);
        }
      });
  }
  leadForm = new FormGroup({
    project_id: new FormControl([], Validators.required),
    lead_level_id: new FormControl([]),
    status_id: new FormControl([]),
    telecaller_id: new FormControl([]),
    start_date: new FormControl(null),
    end_date: new FormControl(null),
    start_followup_date: new FormControl(null),
    end_followup_date: new FormControl(null),
    ignore_date_filters: new FormControl(false), // Add this new control
  });

  readonly panelOpenState = signal(false);

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.leadForm.value;
    const telecallerIdValue = this.getTelecallerIdValue(formValues);
    const filters = this.buildFiltersObject(formValues, telecallerIdValue);
    const paginationState = this.paginationParams();

    return {
      offset: paginationState.offset,
      limit: paginationState.limit,
      sortBy: paginationState.sortBy,
      sortOrder: paginationState.sortOrder,
      filters: {
        ...filters,
        search: this.globalSearchTerm(),
        assigned_status: 1,
      }
    };
  });
  fetchallLeadLevels(): void {
    this.commonService
      .fetchLeadLevels()
      .pipe(
        catchError((err: any) => {
          console.error(err);
          this.snackBar.open('Unable to fetch lead levels.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.allLeadLevels.set(res);
          }
        }
      });
  }

  fetchAllEnquiryStatus(): void {
    this.commonService
      .fetchEnquiryStatusDropdown()
      .pipe(
        catchError((err: any) => {
          console.error(err);
          this.snackBar.open('Unable to fetch enquiry status.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.statusDropdown.set(res);
          }
        }
      });
  }

  private hasFiltersApplied(formValues: any): boolean {
    return !!(
      (formValues.project_id ?? []).length ||
      (formValues.lead_level_id ?? []).length ||
      (formValues.status_id ?? []).length ||
      (formValues.telecaller_id ?? []).length ||
      formValues.start_date ||
      formValues.end_date ||
      formValues.start_followup_date ||
      formValues.end_followup_date
    );
  }
  hasOnlyRoles(allowedRoles: number[]): boolean {
    const roleData = this.roleData();
    if (!roleData) return false;
    const currentRoles = roleData.split(',').map(Number);

    // Check if all user roles are within the allowed roles
    return currentRoles.every((role) => allowedRoles.includes(role));
  }

  private getTelecallerIdValue(formValues: any): number[] | null {
    if (this.hasOnlyRoles([14, 13])) {
      return this.userId() ? [this.userId()] : null;
    }

    if (formValues.telecaller_id?.length) {
      return Array.isArray(formValues.telecaller_id)
        ? formValues.telecaller_id.map((id: any) => Number(id))
        : [Number(formValues.telecaller_id)];
    }

    return null;
  }
  private formatDate(date: any): string | null {
    return date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;
  }

  onScrollIndexChange(index: number): void {
    const currentIndex = this.scrollIndex();

    // Only fetch more data if the index has changed significantly
    if (index > currentIndex + 15) {
      this.scrollIndex.set(index);

      this.paginationParams.update(params => ({
        ...params,
        offset: index
      }));

      this.fetchAllProjectLeads();
    }
  }

  private buildFiltersObject(formValues: any, telecallerIdValue: number[] | null): any {
    return {
      project_id: formValues.project_id?.length ? formValues.project_id : null,
      lead_level_id: 13,
      status_id: formValues.status_id?.length ? formValues.status_id : null,
      telecaller_id: telecallerIdValue,
      start_date: this.formatDate(formValues.start_date),
      end_date: this.formatDate(formValues.end_date),
      start_followup_date: this.formatDate(formValues.start_followup_date),
      end_followup_date: this.formatDate(formValues.end_followup_date),
      user_id: this.userId()
    };
  }

  applyFilters(): void {
    // Reset pagination when applying filters
    this.paginationParams.update(params => ({
      ...params,
      offset: 0
    }));
    this.scrollIndex.set(0);

    // Refresh the AG Grid with new filters
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }

  fetchAllProjectLeads(): void {
    // Refresh the AG Grid with current filters
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }

  readonly bookingActions: BookingAction[] = [
    {
      action: 'allClientRecording',
      icon: 'mic',
      tooltip: 'Call Recording',
      color: 'primary',
      show: true,
      disabled: false,
    },

  ];

  onBookingAction(action: string, row: any): void {
    if (action === 'allClientRecording') {
      this.openDialogWithRecordingUrl(row);
    }
  }



  onSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.globalSearchTerm.set(searchValue);
    this.paginationParams.update(params => ({
      ...params,
      search: searchValue,
      offset: 0
    }));
    this.fetchAllProjectLeads();
  }

  onPageChange(page: number): void {
    this.paginationParams.update(params => ({
      ...params,
      offset: (page - 1) * params.limit
    }));
    this.fetchAllProjectLeads();
  }

  onPageSizeChange(size: number | string): void {
    const paginationState = this.paginationParams();
    const newLimit = size === 'All'
      ? paginationState.filteredCount
      : (size as number);

    this.paginationParams.update(params => ({
      ...params,
      limit: newLimit,
      offset: 0
    }));
    this.fetchAllProjectLeads();
  }



  fetchAllTalecallerList(projectId: any): void {
    if (!Array.isArray(projectId) || projectId.length === 0) {
      this.allTelecallerlist.set([]);
      return;
    }

    this.commonService
      .fetchTelecallerDropdown(projectId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch telecallers.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          const telecallers = (res || []).map((item: any) => ({
            ...item,
            full_name: `${item.first_name} ${item.last_name}`,
          }));
          this.allTelecallerlist.set(telecallers);
        }
      });
  }



  fetchAllProjects(): void {
    const userId = this.userId();

    if (!this.projectsCache$) {
      this.loading.set(true);

      this.projectsCache$ = this.commonService
        .fetchUserProjectDropdown(userId)
        .pipe(
          shareReplay(1),
          catchError((err: any) => {
            console.error(err);
            this.snackBar.open('Unable to fetch projects.', 'Close', {
              duration: 3000,
            });
            return of([]);
          })
        );
    }

    this.projectsCache$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.projectsList.set(res);
          }
          this.loading.set(false);
        }
      });
  }



  openDialogWithRecordingUrl(recordingUrl: any) {
    const dialogRef = this.dialog.open(AllCallRecordingsComponent, {
      minWidth: '40vw',
      maxWidth: '40vw', // Note: maxWidth is smaller than minWidth - consider fixing this
      maxHeight: '100vh',
      data: {
        title: 'Call Recording',
        recordingUrl: recordingUrl.recording_url
      }
    });
  }


}
