import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  inject,
  signal,
  computed,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ResizableColumnDirective } from '../../../../../Common/directives/resizable-column.directive';
import { PaginationComponent } from '../../../../../Common/pagination/pagination.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { environment } from '../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../../../../Service/common/common.service';
import {
  firstValueFrom,
  Subject,
  debounceTime,
  distinctUntilChanged,
  shareReplay,
  catchError,
  of,
  Observable,
} from 'rxjs';
import {
  switchMap,
  filter,
  retry,
  tap,
} from 'rxjs/operators';
import { CommentLogComponent } from '../../../comment-log/comment-log.component';
import { CommentLogService } from '../../../comment-log/comment-log.service';
import { LeadLevel, CallStatus } from '../../../comment-log/comment-log.models';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { CostomLoadingComponent } from '../../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { FollowupsCardViewComponent } from '../../../../../Common/Reusable/followups-card-view/followups-card-view.component';
import { ViewInfoMobEmailComponent } from '../../../../../Common/View Mobile Email/view-info-mob-email/view-info-mob-email.component';
import { ConfirmationDialogComponent } from '../../../../../Common/Reusable/ConfirmDialog/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-lead-follow-ups',
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
    ActionColumnComponent,
    ResizableColumnDirective,
    AutocompleteReusableComponent,
    DragDropModule,
    ScrollingModule,
    PaginationComponent,
    ReusableTableComponent,
    CostomLoadingComponent,
    FollowupsCardViewComponent,
  ],
  templateUrl: './project-lead-follow-ups.component.html',
  styleUrl: './project-lead-follow-ups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectLeadFollowUpsComponent implements OnInit {
  // ====== Injected services ======
  private readonly http = inject(HttpClient);
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');
  private readonly commentLogService = inject(CommentLogService);
  private readonly platformId = inject(PLATFORM_ID);

  // ====== Constants ======
  private readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly RETRY_ATTEMPTS = 2;

  // Session data - computed signals for reactive access
  readonly roleId = computed(() => Number(sessionStorage.getItem('role_id')) || 0);
  readonly userId = computed(() => Number(sessionStorage.getItem('session_id')) || 0);
  readonly roleData = computed(() => sessionStorage.getItem('role_id') || '');

  // ====== Signals for reactive state management ======
  readonly mode = signal<'project' | 'enquiry'>('project');
  readonly loading = signal(false);
  readonly selectedTabIndex = signal(0);
  readonly searchText = signal('');
  readonly isPanelExpanded = signal(true);
  readonly panelOpenState = signal(false);

  // Data signals
  readonly projectsList = signal<any[]>([]);
  readonly allLeadLevels = signal<any[]>([]);
  readonly allTelecallerlist = signal<any[]>([]);
  readonly allSalesExecutive = signal<any[]>([]);
  readonly pendingData = signal<any[]>([]);
  readonly todayData = signal<any[]>([]);
  readonly upcomingData = signal<any[]>([]);
  readonly pendingCount = signal(0);
  readonly todayCount = signal(0);
  readonly upcomingCount = signal(0);

  // Observable properties for dropdowns (like comment-log component)
  leadLevels$: Observable<LeadLevel[]> = of([]);
  callStatus$: Observable<CallStatus[]> = of([]);

  // Computed signals for derived values
  readonly isProjectMode = computed(() => this.mode() === 'project');
  readonly isEnquiryMode = computed(() => this.mode() === 'enquiry');

  readonly currentTabLabel = computed(() => {
    const index = this.selectedTabIndex();
    const isEnquiry = this.isEnquiryMode();
    switch (index) {
      case 0:
        return isEnquiry ? 'Pending Enquiries' : 'Pending Follow-ups';
      case 1:
        return isEnquiry ? "Today's Enquiries" : "Today's Follow-ups";
      case 2:
      default:
        return isEnquiry ? 'Upcoming Enquiries' : 'Upcoming Follow-ups';
    }
  });

  // Optimized filtered data with memoization
  readonly filteredPendingData = computed(() => {
    const data = this.pendingData();
    const searchTerm = this.searchText().trim().toLowerCase();
    if (!searchTerm) return data;
    return this.filterListMemoized(data, searchTerm);
  });

  readonly filteredTodayData = computed(() => {
    const data = this.todayData();
    const searchTerm = this.searchText().trim().toLowerCase();
    if (!searchTerm) return data;
    return this.filterListMemoized(data, searchTerm);
  });

  readonly filteredUpcomingData = computed(() => {
    const data = this.upcomingData();
    const searchTerm = this.searchText().trim().toLowerCase();
    if (!searchTerm) return data;
    return this.filterListMemoized(data, searchTerm);
  });

  // ====== Virtual Scroll Optimization ======
  readonly itemSize = 80; // Base item size in pixels (card height) - reduced for compact cards
  readonly bufferSize = 5; // Base buffer size in items

  // Computed signals for virtual scroll threshold buffers
  readonly optimizedMinBufferPx = computed(() => {
    const itemSize = this.itemSize;
    const bufferSize = this.bufferSize;
    const currentData = this.getCurrentTabData();
    const dataSize = currentData.length;

    // Calculate buffer based on viewport height for better performance
    // Adaptive buffer size based on dataset size and device performance
    const viewportHeight = isPlatformBrowser(this.platformId) ? window.innerHeight : 800;
    const itemsPerViewport = Math.ceil(viewportHeight / itemSize);

    // Dynamic buffer sizing:
    // - Small datasets (< 500): 1.5x viewport for smooth scrolling
    // - Medium datasets (500-5000): 1.2x viewport for balance
    // - Large datasets (> 5000): 1.0x viewport + base buffer for performance
    let multiplier = 1.2;
    if (dataSize < 500) {
      multiplier = 1.5;
    } else if (dataSize > 5000) {
      multiplier = 1.0;
    }

    const minBufferItems = Math.max(
      bufferSize,
      Math.ceil(itemsPerViewport * multiplier)
    );

    return minBufferItems * itemSize;
  });

  readonly optimizedMaxBufferPx = computed(() => {
    const itemSize = this.itemSize;
    const bufferSize = this.bufferSize;
    const currentData = this.getCurrentTabData();
    const dataSize = currentData.length;

    // Max buffer should be 3-4 viewport heights for smooth scrolling
    // Optimized: Adaptive buffer based on data size and performance
    const viewportHeight = isPlatformBrowser(this.platformId) ? window.innerHeight : 800;
    const itemsPerViewport = Math.ceil(viewportHeight / itemSize);

    // Adjust multiplier based on complexity:
    // - More rows = smaller buffer (memory constraints)
    let multiplier = 3.0;
    if (dataSize > 10000) {
      multiplier = 2.0; // Large datasets: prioritize memory
    } else if (dataSize > 5000) {
      multiplier = 2.5;
    }

    const maxBufferItems = Math.max(
      bufferSize * 2,
      Math.ceil(itemsPerViewport * multiplier)
    );

    // Cap max buffer to prevent excessive memory usage
    // Reduced cap for large datasets: 30KB instead of 50KB
    const maxBufferCap = dataSize > 10000 ? 30000 : 50000;
    return Math.min(maxBufferItems * itemSize, maxBufferCap);
  });

  // Helper method to get current tab data
  private getCurrentTabData(): any[] {
    const tabIndex = this.selectedTabIndex();
    switch (tabIndex) {
      case 0:
        return this.filteredPendingData();
      case 1:
        return this.filteredTodayData();
      case 2:
        return this.filteredUpcomingData();
      default:
        return [];
    }
  }

  // ====== Form and UI ======
  readonly columnsControl = new FormControl<string[]>([]);
  readonly leadForm = new FormGroup({
    project_id: new FormControl([], Validators.required),
    lead_level_id: new FormControl<number | null>(null),
    call_status_id: new FormControl<number | null>(null),
    telecaller_id: new FormControl([]),
    sales_executive_id: new FormControl([]),
    ignore_date_filters: new FormControl(false),
    start_date: new FormControl(),
    end_date: new FormControl(),
  });

  // ====== Column definitions ======
  readonly columnDefinitions = [
    { key: 'actions', label: '', type: 'actions', sticky: true, disabled: false },
    { key: 'sr_no', label: 'Sr.no', type: 'index' },
    { key: 'follow_up_date', label: 'Follow-up Date', type: 'short_date' },
    { key: 'follow_up_time', label: 'Follow-up Time' },
    { key: 'customer_name', label: 'Client Name' },
    { key: 'mob_no', label: 'Mobile No', type: 'sensitive' },
    { key: 'email', label: 'Email ID', type: 'sensitive' },
    { key: 'project_config', label: 'Configuration' },
    { key: 'lead_level', label: 'Status' },
    { key: 'remark', label: 'Comment', type: 'truncate' },
    { key: 'comment', label: 'Comment', type: 'truncate' },
    { key: 'sales_executive_name', label: 'Executive' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'enquiry_status', label: 'Enquiry Status' },
    { key: 'source', label: 'Source' },
    { key: 'source_description', label: 'Source Description' },
    { key: 'firm_name', label: 'Channel Partner ' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'telecaller_name', label: 'Telecaller' },
  ] as const;

  readonly displayedColumns = this.columnDefinitions.map((col) => col.key);
  readonly selectedColumns = signal<string[]>([]);
  readonly loadedTabs = signal<Set<number>>(new Set());

  // ====== RxJS Subjects for reactive streams ======
  private readonly searchSubject = new Subject<string>();

  // ====== Memoization cache for filtering ======
  private filterCache = new Map<string, any[]>();
  private readonly CACHE_SIZE = 100;

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;

  readonly tabLabels = [
    'Pending Appointments',
    "Today's Appointments",
    'Upcoming Appointments',
  ] as const;

  constructor() {
    // Initialize mode from route data
    const routeType = this.route.snapshot.data['followUpType'];
    this.mode.set(routeType === 'enquiry' ? 'enquiry' : 'project');

    // Setup debounced search with RxJS
    this.setupSearchDebounce();

    // Setup reactive form listeners
    this.setupFormListeners();

    // Setup column management
    this.setupColumns();
  }

  ngOnInit(): void {
    // Load initial data in parallel
    this.fetchAllProjects();
    this.fetchallLeadLevels();

    // Initialize lead levels observable from service (like comment-log component)
    this.leadLevels$ = this.commentLogService.fetchLeadLevels().pipe(
      catchError((error) => {
        this.snackBar.open('Unable to fetch lead levels.', 'Close', { duration: 3000 });
        return of([]);
      })
    );

    // Setup lead level listener for call status (like comment-log component)
    this.setupLeadLevelListener();
  }


  // ====== Setup Methods ======
  private setupColumns(): void {
    const initialColumns = this.columnDefinitions.map((col) => col.key);
    this.selectedColumns.set(initialColumns);
    this.columnsControl.setValue(initialColumns);

    this.columnsControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedKeys) => {
        this.selectedColumns.set(selectedKeys || []);
      });
  }

  private setupSearchDebounce(): void {
    // Debounce search input for performance
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((searchTerm) => {
        this.searchText.set(searchTerm);
      });
  }

  private setupFormListeners(): void {
    // Ignore date filters listener
    this.leadForm
      .get('ignore_date_filters')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checked) => {
        if (checked) {
          this.leadForm.get('start_date')?.reset();
          this.leadForm.get('end_date')?.reset();
        }
      });

    // Project selection listener
    this.leadForm
      .get('project_id')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectID: any[] | null) => {
        if (!projectID?.length) {
          // Reset lists when project is cleared
          this.allTelecallerlist.set([]);
          this.allSalesExecutive.set([]);
          this.leadForm.get('telecaller_id')?.reset();
          this.leadForm.get('sales_executive_id')?.reset();
          return;
        }

        // Fetch related dropdowns based on mode
        if (this.isProjectMode()) {
          this.fetchAllTalecallerList(projectID);
        } else if (this.isEnquiryMode()) {
          this.fetchAllSalesExecutive(projectID);
        }

        // Re-load lead levels after project selection
        this.fetchallLeadLevels();
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
              this.snackBar.open('Unable to fetch call statuses.', 'Close', { duration: 3000 });
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

  // ====== Optimized Filtering with Memoization ======
  private filterListMemoized(list: any[], searchTerm: string): any[] {
    // Create cache key
    const cacheKey = `${list.length}-${searchTerm}`;

    // Check cache
    if (this.filterCache.has(cacheKey)) {
      return this.filterCache.get(cacheKey)!;
    }

    // Perform filtering
    const filtered = (list || []).filter((item) => {
      const valuesToSearch = [
        item.customer_name,
        item.project_name,
        item.project_config,
        item.lead_level,
        item.remark,
        item.comment,
        item.telecaller_name,
        item.sales_executive_name,
        item.enquiry_status,
        item.source,
        item.source_description,
        item.firm_name,
        item.mob_no,
        item.email,
      ]
        .filter((v) => v !== null && v !== undefined)
        .map((v) => String(v).toLowerCase());

      return valuesToSearch.some((v) => v.includes(searchTerm));
    });

    // Cache result (with size limit)
    if (this.filterCache.size >= this.CACHE_SIZE) {
      const firstKey = this.filterCache.keys().next().value;
      if (firstKey !== undefined) {
        this.filterCache.delete(firstKey);
      }
    }
    this.filterCache.set(cacheKey, filtered);

    return filtered;
  }

  // ====== UI Helpers ======
  togglePanel(): void {
    this.isPanelExpanded.update((value) => !value);
  }

  onSearchInput(value: string | null | undefined): void {
    this.searchSubject.next(value || '');
  }

  // ====== TrackBy Functions (Optimized for Virtual Scrolling) ======
  trackByFollowup = (index: number, item: any): number | string => {
    if (this.isEnquiryMode()) {
      return item?.enquiry_follow_up_id ?? item?.enquiry_id ?? index;
    }
    return item?.lead_follow_up_id ?? item?.project_lead_id ?? index;
  };

  // ====== Tab Management ======
  onTabChange(event: any): void {
    this.changeTab(event.index);
  }

  changeTab(index: number): void {
    const currentIndex = this.selectedTabIndex();
    if (currentIndex === index) return;

    // Respect disabling logic
    const pending = this.pendingCount();
    const today = this.todayCount();
    if (index === 1 && pending > 0) return;
    if (index === 2 && (pending > 0 || today > 0)) return;

    this.selectedTabIndex.set(index);
    this.loadTabData();
  }

  // ====== Data Fetching (Optimized with RxJS) ======
  fetchEnquiriesFollowUps(): void {
    const projectIds = this.leadForm.get('project_id')?.value;
    if (!projectIds?.length) {
      this.snackBar.open('Please select at least one project', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Reset loaded tabs when filters change
    this.loadedTabs.set(new Set());
    this.loadTabData();
  }

  private async loadTabData(): Promise<void> {
    const projectIds = this.leadForm.get('project_id')?.value;
    if (!projectIds?.length) return;

    const currentTab = this.selectedTabIndex();
    const loadedTabsSet = this.loadedTabs();

    // Skip if already loaded (optional optimization)
    // if (loadedTabsSet.has(currentTab)) return;

    this.loading.set(true);
    const formValues = this.leadForm.value;

    // Status mapping: Project-lead API expects 0,1,2; Enquiry API expects 1,2,3
    const statusId = this.isEnquiryMode()
      ? currentTab + 1
      : currentTab;

    try {
      const response = await this.fetchFollowUps(formValues, statusId);
      const data = response.data || [];
      const counts = response.counts || { pending: 0, today: 0, upcoming: 0 };

      // Update all counts atomically
      this.pendingCount.set(counts.pending || 0);
      this.todayCount.set(counts.today || 0);
      this.upcomingCount.set(counts.upcoming || 0);

      // Update the appropriate data source based on selected tab
      switch (currentTab) {
        case 0:
          this.pendingData.set(data);
          break;
        case 1:
          this.todayData.set(data);
          break;
        case 2:
          this.upcomingData.set(data);
          break;
      }

      // Mark tab as loaded
      const updatedSet = new Set(loadedTabsSet);
      updatedSet.add(currentTab);
      this.loadedTabs.set(updatedSet);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      this.snackBar.open('Error fetching follow-ups', 'Close', {
        duration: 3000,
      });
    } finally {
      this.loading.set(false);
    }
  }
  // ====== Role Management ======
  hasOnlyRoles(allowedRoles: number[]): boolean {
    const roleData = this.roleData();
    if (!roleData) return false;

    const userRoles = roleData
      .split(',')
      .map((role: string) => Number(role.trim()))
      .filter((role: number) => !isNaN(role));

    return userRoles.some((role: number) => allowedRoles.includes(role));
  }

  // ====== API Calls (Optimized) ======
  private fetchFollowUps(formValues: any, statusId: number): Promise<any> {
    const isEnquiry = this.isEnquiryMode();

    if (isEnquiry) {
      return this.fetchEnquiryFollowUps(formValues, statusId);
    } else {
      return this.fetchProjectLeadFollowUps(formValues, statusId);
    }
  }

  private fetchEnquiryFollowUps(formValues: any, statusId: number): Promise<any> {
    const payload: any = {
      project_id: formValues.project_id?.length ? formValues.project_id : null,
      lead_level_id: formValues.lead_level_id ? formValues.lead_level_id : null,
      call_status_id: formValues.call_status_id ? formValues.call_status_id : null,
      sales_executive_id: formValues.sales_executive_id?.length ? formValues.sales_executive_id : null,
      created_by: this.userId(),
      status_id: statusId,
      start_date: formValues.start_date,
      end_date: formValues.end_date,
      ignore_date_filters: formValues.ignore_date_filters,
    };

    this.formatDatePayload(payload, formValues);

    return firstValueFrom(
      this.http.post(`${this.baseUrl}/fetch_all_follow_up`, payload).pipe(
        catchError((error) => {
          console.error('Error fetching enquiry follow-ups:', error);
          return of({ data: [], counts: { pending: 0, today: 0, upcoming: 0 } });
        })
      )
    ).then((response: any) => ({
      data: response.data || [],
      counts: response.counts || { pending: 0, today: 0, upcoming: 0 },
    }));
  }

  private fetchProjectLeadFollowUps(formValues: any, statusId: number): Promise<any> {
    let telecallerIdValue: number[] | null = null;
    if (this.hasOnlyRoles([7, 13])) {
      telecallerIdValue = this.userId() ? [this.userId()] : null;
    } else if (formValues.telecaller_id?.length) {
      telecallerIdValue = Array.isArray(formValues.telecaller_id)
        ? formValues.telecaller_id.map((id: any) => Number(id))
        : [Number(formValues.telecaller_id)];
    }

    const payload: any = {
      project_id: formValues.project_id?.length ? formValues.project_id : null,
      lead_level_id: formValues.lead_level_id ? formValues.lead_level_id : null,
      call_status_id: formValues.call_status_id ? formValues.call_status_id : null,
      telecaller_id: telecallerIdValue,
      created_by: this.userId(),
      status_id: statusId.toString(),
      start_date: formValues.start_date,
      end_date: formValues.end_date,
      ignore_date_filters: formValues.ignore_date_filters,
    };

    this.formatDatePayload(payload, formValues);

    return firstValueFrom(
      this.http.post(`${this.baseUrl}/leads_all_follow_up`, payload).pipe(
        catchError((error) => {
          console.error('Error fetching project lead follow-ups:', error);
          return of({ data: [], counts: { pending: 0, today: 0, upcoming: 0 } });
        })
      )
    ).then((response: any) => ({
      data: response.data || [],
      counts: response.counts || { pending: 0, today: 0, upcoming: 0 },
    }));
  }

  private formatDatePayload(payload: any, formValues: any): void {
    if (!payload.ignore_date_filters) {
      if (formValues.start_date) {
        payload.start_date = this.datePipe.transform(formValues.start_date, 'yyyy-MM-dd');
      }
      if (formValues.end_date) {
        payload.end_date = this.datePipe.transform(formValues.end_date, 'yyyy-MM-dd');
      }
    }
  }



  readonly bookingActions = [
    {
      action: 'addComment',
      icon: 'add_comment',
      tooltip: 'Follow Up',
      color: 'primary',
      show: (row: any) => (this.isEnquiryMode() ? row?.telecaller_id !== null : true),
    },
  ] as const;

  onBookingAction(action: string, row: any): void {
    if (action === 'addComment') {
      this.openAddCommentDialog(row);
    }
  }

  sendWhatsApp(): void { }
  sendEmail(): void { }

  // ====== API Fetch Methods (Optimized with shareReplay and error handling) ======
  fetchallLeadLevels(): void {
    this.commonService
      .fetchLeadLevels()
      .pipe(
        shareReplay(1), // Cache the response
        catchError((err) => {
          console.error('Error fetching lead levels:', err);
          this.snackBar.open('Unable to fetch lead levels.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: any) => {
        this.allLeadLevels.set(res || []);
      });
  }

  fetchAllProjects(): void {
    const userId = this.userId();

    if (!this.projectsCache$) {
      this.loading.set(true);

      this.projectsCache$ = this.commonService
        .fetchUserProjectDropdown(userId)
        .pipe(
          shareReplay(1), // Cache the response
          catchError((err) => {
            console.error('Error fetching projects:', err);
            this.snackBar.open('Unable to fetch projects.', 'Close', {
              duration: 3000,
            });
            return of([]);
          })
        );
    }

    this.projectsCache$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => {
        this.projectsList.set(res || []);
        this.loading.set(false);
      });
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
      .subscribe((res: any) => {
        const telecallers = (res || []).map((item: any) => ({
          ...item,
          full_name: `${item.first_name} ${item.last_name}`,
        }));
        this.allTelecallerlist.set(telecallers);
      });
  }

  fetchAllSalesExecutive(projectID: any): void {
    this.http
      .post(`${this.baseUrl}/project_sales_executive_dropdown`, {
        project_id: projectID,
      })
      .pipe(
        catchError((err) => {
          console.error('Error fetching sales executives:', err);
          this.snackBar.open('Unable to fetch sales executives.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: any) => {
        this.allSalesExecutive.set(res || []);
      });
  }

  // ====== Dialog Management ======
  openAddCommentDialog(data: any): void {
    const isEnquiry = this.isEnquiryMode();
    const dialogConfig = isEnquiry
      ? {
        title: `Add Comment to ${data?.project_name || ''} - ${data?.customer_name || ''}`,
        payload: 'enquiry_id',
        request: data?.enquiry_id,
        apiUrl: 'add_comment',
        successMessage: 'Follow-up Added Successfully...',
        rowData: data,
        for: 'Enquiries',
      }
      : {
        title: `Add Comment to ${data?.project_name || ''} - ${data?.customer_name || ''}`,
        payload: 'project_lead_id',
        request: data?.project_lead_id,
        apiUrl: 'add_lead_follow_up',
        successMessage: 'Follow-up Added Successfully...',
        rowData: data,
        for: 'lead-followUp',
      };

    const dialogRef = this.dialog.open(CommentLogComponent, {
      minWidth: isEnquiry ? '40vw' : '60vw',
      maxWidth: '50vw',
      maxHeight: '100vh',
      data: dialogConfig,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: boolean) => {
        if (result) {
          this.fetchEnquiriesFollowUps(); // Refresh the list if data was modified
        }
      });
  }

  // ====== View Sensitive Data Dialog ======
  openViewInfoDialog(title: string, value: string, call_masking_id?: number | string): void {
    if (!value) return;

    this.dialog.open(ViewInfoMobEmailComponent, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: true,
      autoFocus: false,
      data: {
        title,
        value,
        call_masking_id: call_masking_id || 0,
      },
    });
  }

  // ====== Call Methods ======
  callEnquiry(projectEnqID: number): void {
    if (!projectEnqID) {
      this.snackBar.open('Enquiry ID is missing', 'Close', {
        duration: 3000,
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: '25vw',
      data: { project_enq_id: projectEnqID },
    });

    dialogRef.afterClosed()
      .pipe(
        filter((result): result is boolean => result === true),
        switchMap(() => {
          const payload = {
            user_id: this.userId(),
            project_enq_id: projectEnqID,
          };

          return this.http.post<unknown>(`${this.baseUrl}/call_to_enquiry`, payload).pipe(
            retry(this.RETRY_ATTEMPTS),
            tap(() => {
              this.snackBar.open('Lead called successfully!', 'Close', {
                duration: 3000,
              });
            }),
            catchError(() => {
              this.snackBar.open('Call not mapped to any IVR please contact admin', 'Close', {
                duration: 3000,
              });
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  callLead(project_lead_id: number): void {
    if (!project_lead_id) {
      this.snackBar.open('Lead ID is missing', 'Close', {
        duration: 3000,
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: '25vw',
      data: { project_lead_id },
    });

    dialogRef.afterClosed()
      .pipe(
        filter((result): result is boolean => result === true),
        switchMap(() => {
          const payload = {
            user_id: this.userId(),
            project_lead_id,
          };

          return this.http.post<unknown>(`${this.baseUrl}/call_to_leads`, payload).pipe(
            retry(this.RETRY_ATTEMPTS),
            tap(() => {
              this.snackBar.open('Lead called successfully!', 'Close', {
                duration: 3000,
              });
            }),
            catchError(() => {
              this.snackBar.open('Call not mapped to any IVR please contact admin', 'Close', {
                duration: 3000,
              });
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
