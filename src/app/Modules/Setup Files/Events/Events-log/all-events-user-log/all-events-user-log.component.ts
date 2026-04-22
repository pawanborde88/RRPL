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
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { ResetUserPasswordComponent } from '../../../USERS/add-user/Reset Password/reset-user-password/reset-user-password.component';

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
  @ViewChild('notRegUserGrid') notRegUserGrid!: ConfigurableAgGridDataComponent;

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
  readonly loadedTabs = signal<Set<number>>(new Set());

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

  // Computed signal for selected event's type ID
  readonly selectedEventTypeId = computed(() => {
    const eventId = this.selectedEventId();
    if (!eventId) return null;
    const event = this.allEvents().find(e => e.event_id === eventId);
    return event ? event.event_type_id : null;
  });

  // Column definitions for AG Grid (Dynamic based on event type)
  readonly columnDefinitions = computed<TableColumn[]>(() => {
    const eventTypeId = this.selectedEventTypeId();

    if (eventTypeId === 2) {
      return [
        {
          key: 'actions',
          label: 'Actions',
          type: 'actions',
          sticky: true,
          disabled: false,
        },
        {
          key: 'name',
          label: 'Owner Name',
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
          key: 'cp_status',
          label: 'CP Status',
        },
        {
          key: 'cp_type',
          label: 'CP Type',
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
          key: 'no_of_guest',
          label: 'No. of Guests'
          , isAmount: true
        },
        {
          key: 'created_at',
          label: 'Registration Date',
          type: 'date',
        },
      ];
    }

    if (eventTypeId === 3) {
      return [
        {
          key: 'actions',
          label: 'Actions',
          type: 'actions',
          sticky: true,
          disabled: false,
        },
        {
          key: 'project_name',
          label: 'Project Name',
        },
        {
          key: 'name',
          label: 'Employee Name',
        },
        {
          key: 'mobile',
          label: 'Phone Number',
          type: 'sensitive',
        },
        {
          key: 'email',
          label: 'Email',
          type: 'sensitive',
        },
        {
          key: 'role_name',
          label: 'Role',
        },
        {
          key: 'manager_name',
          label: 'Reporting Manager',
        },
        {
          key: 'created_at',
          label: 'Created Date & Time',
          type: 'date',
        },
      ];
    }

    // Default column definitions
    return [
      {
        key: 'actions',
        label: 'Actions',
        type: 'actions',
        sticky: true,
        disabled: false,
      },
      {
        key: 'project_name',
        label: 'Project Name',
      },
      {
        key: 'name',
        label: 'Customer Name',
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
        key: 'token_type',
        label: 'Token Type',
      },
      {
        key: 'token_id',
        label: 'Token ID',
      },
      {
        key: 'token_no',
        label: 'Token No',
      },
      {
        key: 'sales_executive_name',
        label: 'Sales Executive',
      },
      {
        key: 'no_of_guest',
        label: 'No. of Guests'
        , isAmount: true
      },

      {
        key: 'wing_name',
        label: 'Wing',
      },
      {
        key: 'floor_unit',
        label: 'Unit',
      },

      {
        key: 'created_at',
        label: 'Registration Date',
        type: 'date',
      },

    ];
  });

  // Column definitions for Attendance Tab (Dynamic based on event type)
  readonly attendanceColumnDefinitions = computed<TableColumn[]>(() => {
    const eventTypeId = this.selectedEventTypeId();

    if (eventTypeId === 2) {
      return [
        {
          key: 'actions',
          label: 'Actions',
          type: 'actions',
          sticky: true,
          disabled: false,
        },
        {
          key: 'name',
          label: 'Owner Name',
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
          key: 'cp_status',
          label: 'CP Status',
        },
        {
          key: 'cp_type',
          label: 'CP Type',
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
          key: 'no_of_guest',
          label: 'No. of Guests'
          , isAmount: true
        },
        {
          key: 'attendance_date',
          label: 'Attendance Date',
          type: 'date',
        },
      ];
    }

    if (eventTypeId === 3) {
      return [
        {
          key: 'actions',
          label: 'Actions',
          type: 'actions',
          sticky: true,
          disabled: false,
        },
        {
          key: 'project_name',
          label: 'Project Name',
        },
        {
          key: 'name',
          label: 'Employee Name',
        },
        {
          key: 'mobile',
          label: 'Phone Number',
          type: 'sensitive',
        },
        {
          key: 'email',
          label: 'Email',
          type: 'sensitive',
        },
        {
          key: 'role_name',
          label: 'Role',
        },
        {
          key: 'manager_name',
          label: 'Reporting Manager',
        },
        {
          key: 'created_at',
          label: 'Created Date & Time',
          type: 'date',
        },
        {
          key: 'attendance_date',
          label: 'Attendance Date',
          type: 'date',
        },
      ];
    }

    // Default column definitions for Attendance
    return [
      {
        key: 'actions',
        label: 'Actions',
        type: 'actions',
        sticky: true,
        disabled: false,
      },
      {
        key: 'event_title',
        label: 'Event Title',
      },
      {
        key: 'project_name',
        label: 'Project Name',
      },
      {
        key: 'name',
        label: 'Customer Name',
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
        key: 'booking_amount',
        label: 'Booking Amount',
        isAmount: true
      },
      {
        key: 'token_type',
        label: 'Token Type',
      },
      {
        key: 'token_id',
        label: 'Token ID',
      },
      {
        key: 'token_no',
        label: 'Token No',
      },
      {
        key: 'booking_status',
        label: 'Booking Status',
      },
      {
        key: 'sales_executive_name',
        label: 'Sales Executive',
      },
      {
        key: 'no_of_guest',
        label: 'No. of Guests'
        , isAmount: true
      },

      {
        key: 'wing_name',
        label: 'Wing',
      },
      {
        key: 'floor_unit',
        label: 'Unit',
      },

      {
        key: 'created_at',
        label: 'Registration Date',
        type: 'date',
      },

      {
        key: 'attendance_date',
        label: 'Attendance Date',
        type: 'date',
      },

    ];
  });
  readonly notRegColumnDefinitions = computed<TableColumn[]>(() => {
    const eventTypeId = this.selectedEventTypeId();

    if (eventTypeId === 3) {
      return [
        {
          key: 'actions',
          label: 'Actions',
          type: 'actions',
          sticky: true,
          disabled: false,
        },
        {
          key: 'project_name',
          label: 'Project Name',
        },
        {
          key: 'name',
          label: 'Employee Name',
        },
        {
          key: 'mobile',
          label: 'Phone Number',
          type: 'sensitive',
        },
        {
          key: 'email',
          label: 'Email',
          type: 'sensitive',
        },
        {
          key: 'role_name',
          label: 'Role',
        },
        {
          key: 'reporting_manager_name',
          label: 'Reporting Manager',
        },
        {
          key: 'created_at',
          label: 'Created Date & Time',
          type: 'date',
        },
      ];
    }

    return [
      {
        key: 'actions',
        label: 'Actions',
        type: 'actions',
        sticky: true,
        disabled: false,
      },
      {
        key: 'project_name',
        label: 'Project Name',
      },
      {
        key: 'name',
        label: 'Customer Name',
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
        key: 'token_type',
        label: 'Token Type',
      },
      {
        key: 'token_id',
        label: 'Token ID',
      },
      {
        key: 'token_no',
        label: 'Token No',
      },

      {
        key: 'sales_executive_name',
        label: 'Sales Executive',
      },


      {
        key: 'wing_name',
        label: 'Wing',
      },
      {
        key: 'floor_unit',
        label: 'Unit',
      },
    ];
  });

  readonly bookingActions: readonly any[] = [


    {
      action: 'resetPassword',
      icon: 'lock',
      tooltip: 'Reset Password',
      color: 'primary',
      disabled: false,
    },

  ] as const;
  onBookingAction(action: string, row: any): void {
    switch (action) {
      case 'resetPassword':
        this.resetPassword(row);
        break;
    }
  }
  resetPassword(row: any): void {
    const dialogRef = this.dialog.open(ResetUserPasswordComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { userId: [row], for: 'visitor' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }
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


  // Computed signal for Not Reg. Customers AG Grid payload
  readonly notRegAgGridPayload = computed(() => {
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

    // Reset loaded tabs tracking
    this.loadedTabs.set(new Set([this.selectedTabIndex()]));

    // Refresh current grid only after a small delay to ensure signal propagation
    setTimeout(() => {
      this.refreshCurrentTabGrid();
    }, 100);

    this.showSnackBar('Filters applied successfully.', 'default');
  }

  /**
   * Clear all filters
   */
  navigateToAllEvents(): void {
    this.router.navigate(['/events/all-events']);
  }
  clearFilters(): void {
    this.eventFilterForm.reset();
    this.selectedEventId.set(null);
    this.selectedProjectId.set(null);
    this.loadedTabs.set(new Set());

    this.showSnackBar('Filters cleared.', 'default');
  }

  /**
   * Handle tab change event
   */
  onTabChange(event: MatTabChangeEvent): void {
    const newIndex = event.index;
    this.selectedTabIndex.set(newIndex);

    // Only refresh if not already loaded for current filters
    if (!this.loadedTabs().has(newIndex)) {
      setTimeout(() => {
        this.refreshCurrentTabGrid();
        this.loadedTabs.update(tabs => {
          const newTabs = new Set(tabs);
          newTabs.add(newIndex);
          return newTabs;
        });
      }, 100);
    }
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

    if (this.notRegUserGrid) {
      this.notRegUserGrid.refreshData();
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
    } else if (currentTab === 2 && this.notRegUserGrid) {
      this.notRegUserGrid.refreshData();
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