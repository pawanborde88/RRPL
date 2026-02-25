import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { CommonService } from '../../../../Service/common/common.service';
import { AddSiteVisitComponent } from '../add-site-visit/add-site-visit.component';
import { AllCPBookingListComponent } from '../CP Booking List/all-cpbooking-list/all-cpbooking-list.component';

interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  source_id: FormControl<any>;
  user_id: FormControl<any[] | null>;
  sales_executive_id: FormControl<number[] | null>;
  channel_partner_id: FormControl<any>;
  source_detail_id: FormControl<any>;
  start_date: FormControl<any | null>;
  end_date: FormControl<any | null>;
  project_configuration_id: FormControl<any>;
  ignore_date_filters: FormControl<boolean | null>;
}

interface PaginationParams {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  search: string;
  filters: Record<string, unknown>;
  filteredCount: number;
}

interface Project {
  project_id: number;
  property_name: string;
  [key: string]: unknown;
}

interface ChannelPartner {
  channel_partner_id: number;
  firm_name: string;
  cp_owner?: string;
  full_name?: string;
  [key: string]: unknown;
}

interface PreferenceDropdown {
  [key: string]: unknown;
}

import { MatTabsModule } from '@angular/material/tabs';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AllBillsComponent } from '../../../Channel Partner Meetings/all-bills/all-bills.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-all-site-visite',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    TemplateComponent,
    BreadcrumbComponent,
    AllBillsComponent,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    ConfigurableAgGridDataComponent,
    AllCPBookingListComponent,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule
  ],
  templateUrl: './all-site-visite.component.html',
  styleUrl: './all-site-visite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllSiteVisiteComponent implements OnInit {
  // Dependency Injection using inject()
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Environment
  readonly storageUrl = environment.STORAGE_URL;

  // Session data - computed signals for reactive access
  private readonly roleId = computed(() => Number(sessionStorage.getItem('role_id')) || 0);
  private readonly userId = computed(() => Number(sessionStorage.getItem('session_id')) || 0);

  // ViewChild
  @ViewChild(ConfigurableAgGridDataComponent)
  agGridComponent!: ConfigurableAgGridDataComponent;

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<Project[]>([]);
  readonly allChannelPartnerList = signal<ChannelPartner[]>([]);
  readonly preferenceDropdown = signal<PreferenceDropdown[]>([]);
  readonly selectedBooking = signal<Array<{ project_enq_id: number; project_id: number }>>([]);
  readonly scrollIndex = signal<number>(0);

  // Pagination state
  readonly paginationParams = signal<PaginationParams>({
    offset: 0,
    limit: 30,
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: '',
    filters: {},
    filteredCount: 0,
  });

  // Form
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any[]>([], Validators.required),
    source_id: new FormControl(),
    project_configuration_id: new FormControl(),
    user_id: new FormControl<any[]>([], Validators.required),
    sales_executive_id: new FormControl<number[]>([]),
    channel_partner_id: new FormControl(),
    source_detail_id: new FormControl(),
    start_date: new FormControl(null),
    end_date: new FormControl(null),
    ignore_date_filters: new FormControl(false),
  });

  // Computed signals
  readonly isFilterValid = computed(() => {
    const projectId = this.enquiryFilterForm.get('project_id')?.value;
    return Array.isArray(projectId) && projectId.length > 0;
  });

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.enquiryFilterForm.value;
    const pagination = this.paginationParams();
    const filters = this.buildFilters(formValues);

    return {
      offset: pagination.offset,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      filters,
    };
  });
  // Table columns configuration
  readonly displayedColumns: TableColumn[] = [


    { key: 'project_name', label: 'Project Name' },
    { key: 'enquiry_date', label: 'Date', type: 'mediumDate' },
    { key: 'follow_up_date', label: 'Follow-up Date', type: 'mediumDate' },
    { key: 'full_name', label: 'Client Name' },
    { key: 'mobile_no', label: 'Mobile No', type: 'sensitive' },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
    { key: 'lead_level', label: 'Lead Level' },
    { key: 'project_configuration', label: 'Configuration' },
    { key: 'min_budget', label: 'Min Budget', isAmount: true },
    { key: 'max_budget', label: 'Max Budget', isAmount: true },
    { key: 'remark', label: 'Comment', type: 'truncate' },
    { key: 'follow_up_period', label: 'Follow-up Period' },
    { key: 'is_lead_present', label: 'Re-Enquiry' },
    { key: 'is_imported', label: 'Imported' },
    { key: 'call_status', label: 'Call Status' },
    { key: 'age_range', label: 'Age Range' },
    { key: 'alternate_mob_no', label: 'Secondary Mobile No', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    { key: 'firm_name', label: 'Channel Partner' },
    { key: 'source_description', label: 'Source Description' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;

  ngOnInit(): void {
    // Initialize data fetching
    this.fetchAllProjects();

    // Setup reactive form value changes with optimized RxJS
    this.setupFormReactivity();
  }

  private setupFormReactivity(): void {
    // Project ID changes - fetch preference dropdown
    const projectIdControl = this.enquiryFilterForm.get('project_id');
    if (projectIdControl) {
      projectIdControl.valueChanges
        .pipe(
          distinctUntilChanged((prev, curr) => {
            if (!Array.isArray(prev) || !Array.isArray(curr)) return prev === curr;
            if (prev.length !== curr.length) return false;
            return prev.every((val, idx) => val === curr[idx]);
          }),
          debounceTime(300),
          switchMap((projectId) => {
            if (Array.isArray(projectId) && projectId.length > 0) {
              return this.fetchPreferenceDropdown(projectId).pipe(
                catchError(() => EMPTY)
              );
            }
            this.preferenceDropdown.set([]);
            return EMPTY;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe();
    }
  }

  private buildFilters(formValues: Record<string, unknown>): Record<string, unknown> {
    const filters: Record<string, unknown> = {
      project_id: Array.isArray(formValues['project_id']) && formValues['project_id'].length
        ? formValues['project_id']
        : null,
      source_id: 3,
      project_configuration_id: formValues['project_configuration_id'] || null,
      user_id: Array.isArray(formValues['user_id']) && formValues['user_id'].length
        ? formValues['user_id']
        : this.userId(),
      channel_partner_id: formValues['channel_partner_id'] || null,
      source_detail_id: formValues['source_detail_id'] || null,
      ignore_date_filters: formValues['ignore_date_filters'] || false,
      claim_status: 1,
    };

    if (!filters['ignore_date_filters']) {
      if (formValues['start_date']) {
        filters['start_date'] = this.datePipe.transform(
          formValues['start_date'] as Date,
          'yyyy-MM-dd'
        );
      }
      if (formValues['end_date']) {
        filters['end_date'] = this.datePipe.transform(
          formValues['end_date'] as Date,
          'yyyy-MM-dd'
        );
      }
    }

    return filters;
  }

  onScrollIndexChange(index: number): void {
    const currentIndex = this.scrollIndex();
    // Only fetch more data if the index has changed significantly
    if (index > currentIndex + 15) {
      this.scrollIndex.set(index);
      this.paginationParams.update((params) => ({
        ...params,
        offset: index,
      }));
      this.refreshAgGrid();
    }
  }

  fetchAllEnquiry(): void {
    this.paginationParams.update((params) => ({
      ...params,
      offset: 0,
    }));
    this.scrollIndex.set(0);
    this.refreshAgGrid();
  }

  private refreshAgGrid(): void {
    // Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      if (this.agGridComponent) {
        this.agGridComponent.refreshData();
      }
    });
  }

  isColumnDraggable(column: TableColumn): boolean {
    if (column.draggable === false) return false;
    return column.type !== 'index' && column.key !== 'actions';
  }

  private fetchPreferenceDropdown(projectId: number[]) {
    return this.commonService.fetchWebConfigDropdown(projectId).pipe(
      tap((res) => this.preferenceDropdown.set(res || [])),
      shareReplay({ bufferSize: 1, refCount: true }),
      catchError((error: HttpErrorResponse) => {
        this.handleError('Unable to fetch preference dropdown.', error);
        return EMPTY;
      })
    );
  }

  onPageSizeChange(size: number | string): void {
    const limit = size === 'All'
      ? this.paginationParams().filteredCount
      : (size as number);

    this.paginationParams.update((params) => ({
      ...params,
      limit,
      offset: 0,
    }));

    this.fetchAllEnquiry();
  }

  fetchAllProjects(): void {
    const userId = this.userId();

    if (!this.projectsCache$) {
      this.loading.set(true);

      this.projectsCache$ = this.commonService
        .fetchUserProjectDropdown(userId)
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.handleError('Unable to fetch projects.', error);
            return [];
          }),
          finalize(() => this.loading.set(false)),
          shareReplay(1)
        );
    }

    this.projectsCache$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.projectsList.set(res || []);
        },
      });
  }

  private handleError(message: string, error: HttpErrorResponse): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
    // Log error for debugging in development
    if (!environment.production) {
      console.error(message, error);
    }
  }


  // ==================== ACTION DEFINITIONS ====================
  enquiryActions(): Array<{
    action: string;
    icon: string;
    tooltip: string;
    color: string;
    disabled: (row: Record<string, unknown>) => boolean;
    show: (row?: Record<string, unknown>) => boolean;
  }> {
    return [
      {
        action: 'addSiteVisit',
        icon: 'add_business',
        tooltip: 'Add Site Visit',
        color: 'primary',
        disabled: (row: Record<string, unknown>) => !row?.['sales_executive_id'],
        show: (row?: Record<string, unknown>) => !!row?.['sales_executive_id'],
      },
    ];
  }

  // ==================== HEADER BUTTONS ====================
  headerButtons(): unknown[] {
    return [];
  }

  // ==================== SELECTED BOOKINGS ====================
  selectedBookings(): Array<{ project_enq_id: number; project_id: number }> {
    return this.selectedBooking();
  }

  // ==================== ROW CLASS ====================
  getRowClass(params: { data: Record<string, unknown> }): string | string[] | undefined {
    const row = params.data;
    return row?.['sales_executive_id'] === null ? 'bg-light-yellow' : undefined;
  }

  // ==================== EVENT HANDLERS ====================
  onLeadSelectionChange(checked: boolean, row: Record<string, unknown>): void {
    const selectedData = {
      project_enq_id: row['project_enq_id'] as number,
      project_id: row['project_id'] as number,
    };

    if (checked) {
      this.selectedBooking.update((current) => [...current, selectedData]);
    } else {
      this.selectedBooking.update((current) =>
        current.filter(
          (item) => item.project_enq_id !== selectedData.project_enq_id
        )
      );
    }
  }

  onRowSelected(rows: Array<{ project_enq_id: number; project_id: number }>): void {
    this.selectedBooking.set(rows);
  }

  getLeadActions(action: string, row: Record<string, unknown>): void {
    const actionHandlers: Record<string, () => void> = {
      addSiteVisit: () => this.openAddSiteDialog(row),
    };

    const handler = actionHandlers[action];
    if (handler) {
      handler();
    } else if (!environment.production) {
      console.warn('Unknown action:', action);
    }
  }

  openAddSiteDialog(row: Record<string, unknown>): void {
    const dialogRef = this.dialog.open(AddSiteVisitComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        rowData: row,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(
        catchError(() => EMPTY)
      )
      .subscribe((result) => {
        if (result) {
          this.fetchAllEnquiry();
        }
      });
  }

  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length <= 3) {
      this.allChannelPartnerList.set([]);
      return;
    }

    this.commonService
      .fetchChannelPartnerDropdown(trimmedSearch)
      .pipe(
        map((res: any[]) =>
          res.map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner || '--'})`,
          }))
        ),
        catchError((error: HttpErrorResponse) => {
          this.handleError('Unable to fetch channel partners.', error);
          return EMPTY;
        })
      )
      .subscribe({
        next: (res: any[]) => {
          this.allChannelPartnerList.set(res);
        },
      });
  }
}
