import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { catchError, distinctUntilChanged, of, shareReplay } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { CommonService } from '../../../../../Service/common/common.service';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
interface EnquiryFilterForm {
  project_id: FormControl<any | null>;
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
  ignore_date_filters: FormControl<boolean | null>;
}

interface PaginationConfig {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}
@Component({
  selector: 'app-pre-sales-report',
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
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './pre-sales-report.component.html',
  styleUrl: './pre-sales-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreSalesReportComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly DEFAULT_PAGE_SIZE = 30;

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly paginationConfig = signal<PaginationConfig>({
    offset: 0,
    limit: this.DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Form definition
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any | null>(null, Validators.required),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
    ignore_date_filters: new FormControl<boolean>(false),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: any[] | null;
    start_date: Date | null;
    end_date: Date | null;
    ignore_date_filters: boolean;
  }>({
    project_id: null,
    start_date: null,
    end_date: null,
    ignore_date_filters: false,
  });

  // Column definitions for AG Grid (readonly constant)
  readonly columnDefinitions: readonly TableColumn[] = [
    { key: 'enquiry_date', label: 'Enquiry Date', type: 'mediumDate' },
    { key: 'date', label: 'Lead Date', type: 'mediumDate' },
    { key: 'project_lead_id', label: 'Lead ID' },

    { key: 'project_names', label: 'Project Name' },
    { key: 'customer_name', label: 'Client Name' },
    { key: 'sales_executive_name', label: 'Sales Executive' },
    { key: 'enquiry_source', label: 'Enquiry Source' },

    { key: 'telecaller_names', label: 'Telecaller' },
    { key: 'is_booked', label: 'Booked' },
    { key: 'follow_up_date', label: 'Follow-up Date', type: 'mediumDate' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'mobile_no', label: 'Phone', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
  ] as const;

  // Actions for AG Grid (readonly constant)
  readonly bookingActions: readonly any[] = [] as const;

  // Computed signal for filter validation

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
      search: '', // Search is handled by AG Grid component internally
      filters,
    };
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
    this.setupFormValueTracking();
  }

  /**
   * Track form value changes and update formValues signal
   * This makes computed signals reactive to form changes
   */
  private setupFormValueTracking(): void {
    // Subscribe to form valueChanges and update signal
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
          start_date: formValue.start_date ?? null,
          end_date: formValue.end_date ?? null,
          ignore_date_filters: formValue.ignore_date_filters ?? false,
        });
      });

    // Initialize with current form values
    const initialValue = this.enquiryFilterForm.value;
    this.formValues.set({
      project_id: initialValue.project_id ?? null,
      start_date: initialValue.start_date ?? null,
      end_date: initialValue.end_date ?? null,
      ignore_date_filters: initialValue.ignore_date_filters ?? false,
    });
  }

  // ==================== PERMISSION METHODS ====================
  private hasPermission(...permissions: number[]): boolean {
    const roles = this.roleData();
    if (!roles) return false;
    return permissions.some((permission) => roles.includes(permission.toString()));
  }

  // ==================== DATA FETCHING ====================
  fetchAllDiscardLeadReports(): void {


    // Refresh AG Grid data - payload is computed and will update automatically
    this.refreshAgGridData();
  }

  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  private buildFilters(formValues: {
    project_id: any[] | null;
    start_date: Date | null;
    end_date: Date | null;
    ignore_date_filters: boolean;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id && Array.isArray(formValues.project_id) && formValues.project_id.length > 0
        ? formValues.project_id
        : null,
      enquiry_status: 1,
      ignore_date_filters: formValues.ignore_date_filters || false,
    };

    // Add date filters if not ignored
    if (!filters['ignore_date_filters']) {
      if (formValues.start_date) {
        filters['start_date'] = this.formatDate(formValues.start_date);
      }
      if (formValues.end_date) {
        filters['end_date'] = this.formatDate(formValues.end_date);
      }
    }

    return filters;
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    return this.datePipe.transform(date, this.DATE_FORMAT);
  }

  fetchAllProjects(): void {
    const userId = this.userId();

    if (!this.projectsCache$) {
      this.loading.set(true);

      this.projectsCache$ = this.commonService
        .fetchUserProjectDropdown(userId)
        .pipe(
          catchError((err) => {
            console.error('Error fetching projects:', err);
            this.showSnackBar('Unable to fetch projects.');
            return of([]);
          }),
          shareReplay(1)
        );
    }

    this.projectsCache$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.projectsList.set(res || []);
          this.loading.set(false);
        }
      });
  }

  // ==================== HELPER METHODS ====================
  private showSnackBar(message: string, panelClass: 'error' | 'default' = 'default'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass === 'error' ? ['snackbar-error'] : undefined,
    });
  }
}
