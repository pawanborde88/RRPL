import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { catchError, distinctUntilChanged, finalize, of, shareReplay, switchMap, tap } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { CommonService } from '../../../../../../Service/common/common.service';
import { ColumnDynamicColorService } from '../../../../../../Service/Column-Colors/column-dynamic-color.service';

interface EnquiryFilterForm {
  project_id: FormControl<number | null>;
  wing_id: FormControl<number | null>;
  sales_executive_id: FormControl<number | null>;
  target_from: FormControl<Date | null>;
  target_to: FormControl<Date | null>;
}

interface PaginationConfig {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-all-insentive-bonus-master-list',
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
  templateUrl: './all-insentive-bonus-master-list.component.html',
  styleUrl: './all-insentive-bonus-master-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllInsentiveBonusMasterListComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly DEFAULT_PAGE_SIZE = 30;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly allWingslist = signal<Array<{ wing_id: number; wing_name: string }>>([]);
  readonly allSalesExecutive = signal<Array<{ user_id: number; user_name: string }>>([]);
  readonly paginationConfig = signal<PaginationConfig>({
    offset: 0,
    limit: this.DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: number | null;
    wing_id: number | null;
    sales_executive_id: number | null;
    target_from: Date | null;
    target_to: Date | null;
  }>({
    project_id: null,
    wing_id: null,
    sales_executive_id: null,
    target_from: null,
    target_to: null,
  });

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;
  private readonly columnDynamicColorService = inject(ColumnDynamicColorService);

  // Form definition
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null),
    sales_executive_id: new FormControl<number | null>(null),
    target_from: new FormControl<Date | null>(this.getFirstDayOfCurrentMonth(), Validators.required),
    target_to: new FormControl<Date | null>(this.getLastDayOfCurrentMonth(), Validators.required),
  });

  // Helper methods
  private getFirstDayOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getLastDayOfCurrentMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  // Column definitions for AG Grid (readonly constant)
  readonly columnDefinitions: readonly TableColumn[] = [
    { key: 'project_name', label: 'Project Name' },
    { key: 'enquiry_date', label: 'Enquiry Date', type: 'mediumDate' },
    { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },
    { key: 'wing', label: 'Wing' },
    { key: 'floor_unit', label: 'Unit No' },
    { key: 'unit_type', label: 'Unit Type' },
    { key: 'applicant_name', label: 'Applicant Name' },
    {
      key: 'agreement_status',
      label: 'Agreement Status',
      applyChequeStatusColor: true,
      cellStyle: ({ data }) => data ? this.columnDynamicColorService.getAgreementStatusStyle(data.agreement_status) : undefined,
    }, { key: 'agreement_date', label: 'Agreement Date', type: 'mediumDate' },

    {
      key: 'disbursement_status',
      label: 'Disbursement',
      applyChequeStatusColor: true,
      cellStyle: ({ data }) => data ? this.columnDynamicColorService.getDisbursementStatusStyle(data.disbursement_status) : undefined,
    },
    { key: 'receipt_date', label: 'Disbursement Date', type: 'mediumDate' },
    { key: 'sales_executive_name', label: 'Sales Executive' },
    { key: 'booking_target', label: 'Booking Target' },
    { key: 'booking_count', label: 'Booking Count' },
    { key: 'booking_percentage', label: 'Achievement %' },
    { key: 'slab_percentage', label: 'Slab %' },
    { key: 'slab_commission_amount', label: 'Slab Commission' },
    { key: 'role_incentive_percentage', label: 'Role Incentive %' },
    { key: 'sales_executive_commission', label: 'SE Commission' },
    { key: 'total_incentive', label: 'Total Incentive' }
  ] as const;

  // Actions for AG Grid (readonly constant)
  readonly bookingActions: readonly any[] = [] as const;

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.formValues();
    const filters = this.buildFilters(formValues);
    const pagination = this.paginationConfig();

    return {
      offset: pagination.offset,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      search: '',
      filters,
    };
  });

  // Computed signal for filter validation
  readonly isFilterValid = computed(() => {
    const filters = this.formValues();
    return !!(filters.project_id && filters.target_from && filters.target_to);
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
    this.setupProjectWingListener();
    this.setupProjectSalesExecutiveListener();
    this.setupFormValueTracking();
  }

  /**
   * Track form value changes and update formValues signal
   */
  private setupFormValueTracking(): void {
    this.enquiryFilterForm.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) =>
          JSON.stringify(prev) === JSON.stringify(curr)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((formValue) => {
        this.formValues.set({
          project_id: formValue.project_id ?? null,
          wing_id: formValue.wing_id ?? null,
          sales_executive_id: formValue.sales_executive_id ?? null,
          target_from: formValue.target_from ?? null,
          target_to: formValue.target_to ?? null,
        });
      });

    // Initialize with current form values
    const initialValue = this.enquiryFilterForm.value;
    this.formValues.set({
      project_id: initialValue.project_id ?? null,
      wing_id: initialValue.wing_id ?? null,
      sales_executive_id: initialValue.sales_executive_id ?? null,
      target_from: initialValue.target_from ?? null,
      target_to: initialValue.target_to ?? null,
    });
  }

  /**
   * Setup reactive listener to fetch wings when project_id changes
   */
  private setupProjectWingListener(): void {
    this.enquiryFilterForm.get('project_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        switchMap((projectId) => {
          if (projectId) {
            this.loading.set(true);
            return this.commonService.fetchWingDropdown(projectId).pipe(
              catchError((error) => {
                console.error('Error fetching wings:', error);
                this.showSnackBar('Unable to fetch project wings.', 'error');
                return of([]);
              }),
              finalize(() => this.loading.set(false)),
              shareReplay(1),
              tap((wings) => {
                this.allWingslist.set(wings || []);
                // Reset wing_id when project changes
                this.enquiryFilterForm.get('wing_id')?.reset();
              })
            );
          } else {
            this.allWingslist.set([]);
            this.enquiryFilterForm.get('wing_id')?.reset();
            return of([]);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Setup reactive listener to fetch sales executives when project_id changes
   */
  private setupProjectSalesExecutiveListener(): void {
    this.enquiryFilterForm.get('project_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        switchMap((projectId) => {
          if (projectId) {
            this.loading.set(true);
            return this.commonService.fetchSalesExecutives(projectId).pipe(
              catchError((error) => {
                console.error('Error fetching sales executives:', error);
                this.showSnackBar('Unable to fetch sales executives.', 'error');
                return of([]);
              }),
              finalize(() => this.loading.set(false)),
              shareReplay(1),
              tap((salesExecutives) => {
                this.allSalesExecutive.set(salesExecutives || []);
                // Reset sales_executive_id when project changes
                this.enquiryFilterForm.get('sales_executive_id')?.reset();
              })
            );
          } else {
            this.allSalesExecutive.set([]);
            this.enquiryFilterForm.get('sales_executive_id')?.reset();
            return of([]);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
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
   * Apply filters and refresh AG Grid data
   */
  fetchAllDiscardLeadReports(): void {
    if (!this.isFilterValid()) {
      this.showSnackBar('Please fill all required fields.', 'error');
      return;
    }

    // Refresh AG Grid data - payload is computed and will update automatically
    this.refreshAgGridData();
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
    wing_id: number | null;
    sales_executive_id: number | null;
    target_from: Date | null;
    target_to: Date | null;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id,
    };

    if (formValues.wing_id) {
      filters['wing_id'] = formValues.wing_id;
    }

    if (formValues.sales_executive_id) {
      filters['sales_executive_id'] = formValues.sales_executive_id;
    }

    if (formValues.target_from) {
      filters['target_from'] = this.formatDate(formValues.target_from);
    }

    if (formValues.target_to) {
      filters['target_to'] = this.formatDate(formValues.target_to);
    }

    return filters;
  }

  /**
   * Format date for API
   */
  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    return this.datePipe.transform(date, this.DATE_FORMAT);
  }

  /**
   * Track by function for wings list
   */
  trackByWingId(_index: number, wing: { wing_id: number; wing_name: string }): number {
    return wing.wing_id;
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
