import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { catchError, of, finalize, shareReplay } from 'rxjs';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { CommonService } from '../../../../../Service/common/common.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../../../environments/environment';
import { AuthService } from '../../../../../Service/auth.service';

interface PaginationConfig {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AttendanceData {
  user_id: number;
  name: string;
  email: string;
  mobile: string;
  check_in_time: string;
  check_out_time: string;
  attendance_duration: string;
  status: 'Present' | 'Absent' | 'Late';
  notes?: string;
}

@Component({
  selector: 'app-all-events-user-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    ReactiveFormsModule,
    FormsModule,
    ConfigurableAgGridDataComponent,
    AutocompleteReusableComponent
  ],
  templateUrl: './all-events-user-log.component.html',
  styleUrl: './all-events-user-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllEventsUserLogComponent implements OnInit {
  @ViewChild('usersGrid') usersGrid!: ConfigurableAgGridDataComponent;
  @ViewChild('attendanceGrid') attendanceGrid!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly datePipe = new DatePipe('en-US');
  private readonly authService = inject(AuthService);

  baseUrl: string = environment.API_URL;
  accountId: number = Number(sessionStorage.getItem('account_id')) || 0;
  router = inject(Router);
  // Constants
  readonly DATE_FORMAT = 'yyyy-MM-dd';
  readonly DEFAULT_PAGE_SIZE = 30;
  readonly showProjectFilter = false; // Set to true if needed

  // State signals
  readonly loading = signal<boolean>(false);
  readonly allEvents = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);
  readonly selectedTabIndex = signal<number>(0);
  readonly selectedEventId = signal<number | null>(null);
  readonly selectedProjectId = signal<number | null>(null);

  // Pagination configs for different tabs
  readonly usersPaginationConfig = signal<PaginationConfig>({
    offset: 0,
    limit: this.DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  readonly attendancePaginationConfig = signal<PaginationConfig>({
    offset: 0,
    limit: this.DEFAULT_PAGE_SIZE,
    sortBy: 'check_in_time',
    sortOrder: 'desc',
  });

  // Reactive Form for the template
  eventFilterForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) { }

  // Column definitions for AG Grid (readonly constant)
  readonly columnDefinitions: readonly TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'mobile',
      label: 'Mobile',
      type: 'sensitive',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'sensitive',
    },
    {
      key: 'rera_no',
      label: 'RERA Number',
    },
    {
      key: 'firm_name',
      label: 'Firm Name',
    },
    {
      key: 'created_at',
      label: 'Registration Date',
      type: 'date',
    },

  ] as const;

  // Column definitions for Attendance Tab
  readonly attendanceColumnDefinitions: readonly TableColumn[] = [
    {
      key: 'event_title',
      label: 'Event Title',
    },
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'in_time',
      label: 'In Time',
      type: 'date',
    },

    {
      key: 'mobile',
      label: 'Mobile',
      type: 'sensitive',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'sensitive',
    },
    {
      key: 'rera_no',
      label: 'RERA Number',
    },
    {
      key: 'firm_name',
      label: 'Firm Name',
    },
    {
      key: 'attendance_date',
      label: 'Attendance Date',
      type: 'date',
    },

  ] as const;

  // Computed signal for Users AG Grid payload
  readonly agGridPayload = computed(() => {
    const eventId = this.selectedEventId();
    const projectId = this.selectedProjectId();

    return {
      filters: {
        event_id: eventId,
        project_id: projectId
      }
    };
  });

  // Computed signal for Attendance AG Grid payload
  readonly attendanceAgGridPayload = computed(() => {
    const eventId = this.selectedEventId();
    const projectId = this.selectedProjectId();

    return {
      filters: {
        event_id: eventId,
        project_id: projectId
      }
    };
  });

  // Computed signal for filter validation
  readonly isFilterValid = computed(() => {
    return !!this.selectedEventId();
  });

  // Computed signals for permission checks
  private readonly userId = computed(() => {
    return Number(sessionStorage.getItem('session_id')) || 0;
  });

  private readonly roleData = computed(() => {
    return sessionStorage.getItem('role_id');
  });

  ngOnInit(): void {
    this.initializeForm();
    this.fetchEvents();
    this.handleRouteParams();
  }

  private handleRouteParams(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const eventId = params['event_id'];
      if (eventId) {
        const id = Number(eventId);
        this.selectedEventId.set(id);
        this.eventFilterForm.patchValue({ event_id: id });
        // Grids will refresh via calculated signals and template calls
      }
    });
  }

  private initializeForm(): void {
    this.eventFilterForm = this.fb.group({
      event_id: [null, Validators.required],
      project_id: [null]
    });

    // No auto-update on value changes to prevent multiple API calls
    // Signals are updated in applyFilters()
  }

  fetchEvents(): void {
    this.loading.set(true);

    const payload: any = {};
    if (this.accountId) {
      payload.account_id = this.accountId;
    }

    this.http.post(`${this.baseUrl}/fetch_event`, payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          let events: any[] = [];

          if (Array.isArray(res?.data)) {
            events = res.data;
          } else if (Array.isArray(res)) {
            events = res;
          } else if (res?.data) {
            events = [res.data];
          } else if (res) {
            events = [res];
          }

          this.allEvents.set(events.filter(Boolean));

        },
        error: (error) => {
          console.error('Error fetching events:', error);
          this.showSnackBar('Unable to fetch events.', 'error');
        }
      });
  }


  /**
   * Apply filters to both tabs
   */
  applyFilters(): void {
    if (this.eventFilterForm.invalid) {
      this.showSnackBar('Please select an event first.', 'error');
      return;
    }

    const formValues = this.eventFilterForm.value;
    this.selectedEventId.set(formValues.event_id);
    this.selectedProjectId.set(formValues.project_id);

    // Refresh both grids
    this.refreshAllGrids();

    this.showSnackBar('Filters applied successfully.', 'default');
  }
  readonly headerButtons = [
    {
      label: 'Create Event',
      icon: 'receipt_long',
      color: 'primary',// Changed from true to false to enable navigation
      action: () => this.router.navigate(['/events/all-events']),
      show: () => this.hasPermission('623'),
    },
  ];
  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.eventFilterForm.reset();
    this.selectedEventId.set(null);
    this.selectedProjectId.set(null);

    this.showSnackBar('Filters cleared.', 'default');
  }

  /**
   * Handle tab change event
   */
  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex.set(event.index);

    // Refresh the grid for the selected tab
    setTimeout(() => {
      this.refreshCurrentTabGrid();
    }, 100);
  }

  /**
   * Refresh all grids
   */
  refreshAllGrids(): void {
    if (this.usersGrid) {
      this.usersGrid.refreshData();
    }

    if (this.attendanceGrid) {
      this.attendanceGrid.refreshData();
    }
  }

  /**
   * Refresh grid for current tab
   */
  refreshCurrentTabGrid(): void {
    const currentTab = this.selectedTabIndex();

    if (currentTab === 0 && this.usersGrid) {
      this.usersGrid.refreshData();
    } else if (currentTab === 1 && this.attendanceGrid) {
      this.attendanceGrid.refreshData();
    }
  }

  /**
   * Show snackbar notification
   */
  private showSnackBar(message: string, panelClass: 'error' | 'success' | 'default' = 'default'): void {
    const panelClasses = {
      error: ['snackbar-error'],
      success: ['snackbar-success'],
      default: []
    };

    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClasses[panelClass],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  readonly hasPermission = (permission: string): boolean =>
    this.authService.hasPermission(permission);

  readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
    this.authService.hasOnlyRoles(allowedRoles);
}