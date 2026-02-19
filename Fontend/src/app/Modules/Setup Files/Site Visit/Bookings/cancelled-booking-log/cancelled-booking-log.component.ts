import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { catchError, finalize, of, shareReplay } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { CommonService } from '../../../../../Service/common/common.service';


interface PaginationConfig {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-cancelled-booking-log',
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
  templateUrl: './cancelled-booking-log.component.html',
  styleUrl: './cancelled-booking-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CancelledBookingLogComponent implements OnInit {
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
    { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'wing' },
    { key: 'floor_unit', label: 'Unit No' },
    { key: 'unit_type', label: 'Unit Type' },
    { key: 'applicant_name', label: 'Client Name' },
    { key: 'cancel_remark', label: 'Cancel Remark' },
    { key: 'booking_from', label: 'Booking From' },
    { key: 'project_enq_id', label: 'Enquiry No' },
    { key: 'sales_executive', label: 'Executive' },

    { key: 'source', label: 'Source' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'firm_name', label: 'Channel Partner' },
    {
      key: 'source_description',
      label: 'Source Description',
      type: 'truncate',
    },

    { key: 'updated_by_name', label: 'Cancelled By' },
    { key: 'updated_at', label: 'Cancelled At', type: 'date' },
  ] as const;

  // Actions for AG Grid (readonly constant)
  readonly bookingActions: readonly any[] = [] as const;

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

  /**
   * Handle project selection change
   */
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
      project_id: formValues.project_id,
      booking_status_id: 0,
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
