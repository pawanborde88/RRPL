import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  selector: 'app-lead-transfer-report',
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
  templateUrl: './lead-transfer-report.component.html',
  styleUrl: './lead-transfer-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadTransferReportComponent implements OnInit {
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
  readonly allTelecallerlist = signal<any[]>([]);
  readonly paginationConfig = signal<PaginationConfig>({
    offset: 0,
    limit: this.DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Reactive Form
  readonly leadForm = new FormGroup({
    project_id: new FormControl<number[]>([], Validators.required),
    transfer_to: new FormControl<number[]>([]),
    transfer_from: new FormControl<number[]>([]),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: number[] | null;
    transfer_to: number[] | null;
    transfer_from: number[] | null;
  }>({
    project_id: null,
    transfer_to: null,
    transfer_from: null,
  });

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;
  private telecallerCache$?: ReturnType<typeof this.commonService.fetchTelecallerDropdown>;

  // Column definitions for AG Grid (readonly constant)
  readonly columnDefinitions: readonly TableColumn[] = [
    {
      key: 'project_lead_id',
      label: 'Lead ID',
    },
    {
      key: 'project_name',
      label: 'Project Name',
    },
    {
      key: 'customer_name',
      label: 'Client Name',
    },
    {
      key: 'remark',
      label: 'Comment',
    },
    {
      key: 'transfer_from_name',
      label: 'Transfer From',
    },
    {
      key: 'transfer_to_name',
      label: 'Transfer To',
    },
    {
      key: 'created_by_name',
      label: 'Transfer By',
    },
    {
      key: 'created_at',
      label: 'Transfer Date',
      type: 'short_date',
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

  // Computed signal for filter validation
  readonly isFilterValid = computed(() => {
    const filters = this.formValues();
    return !!filters.project_id && filters.project_id.length > 0;
  });

  // Computed signals for permission checks
  private readonly userId = computed(() => {
    return Number(sessionStorage.getItem('session_id')) || 0;
  });

  readonly roleId = computed(() => {
    return Number(sessionStorage.getItem('role_id')) || 0;
  });

  private readonly roleData = computed(() => {
    return sessionStorage.getItem('role_id');
  });

  ngOnInit(): void {
    this.fetchAllProjects();

    // Watch for project changes to fetch telecallers
    this.leadForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectIds) => {
        if (projectIds && projectIds.length > 0) {
          this.fetchalltelecallerList(projectIds);
        } else {
          this.allTelecallerlist.set([]);
        }
      });

    // Watch for form changes to keep formValues signal in sync for apiPayload
    this.leadForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValue) => {
        this.formValues.set({
          project_id: formValue.project_id && formValue.project_id.length > 0 ? formValue.project_id : null,
          transfer_to: formValue.transfer_to && formValue.transfer_to.length > 0 ? formValue.transfer_to : null,
          transfer_from: formValue.transfer_from && formValue.transfer_from.length > 0 ? formValue.transfer_from : null,
        });
      });
  }

  /**
   * Apply filters and refresh grid data
   */
  applyFilters(): void {
    if (!this.leadForm.valid) {
      this.showSnackBar('Please select at least one project.', 'error');
      return;
    }

    // Refresh AG Grid data asynchronously to allow Angular's change detection
    // to propagate the updated agGridPayload to the child component first.
    setTimeout(() => {
      this.refreshAgGridData();
    }, 0);
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
   * Check if user has only specific roles
   */
  private hasOnlyRoles(allowedRoles: number[]): boolean {
    const roleData = this.roleData();
    if (!roleData) return false;
    const currentRoles = roleData.split(',').map(Number);
    return currentRoles.some((role) => allowedRoles.includes(role));
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
  fetchalltelecallerList(projectIds: number[]): void {
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
   * Refresh AG Grid data
   */
  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  /**
   * Build filters object for API payload
   */
  private buildFilters(formValues: {
    project_id: number[] | null;
    transfer_to: number[] | null;
    transfer_from: number[] | null;
  }): Record<string, any> {
    const filters: Record<string, any> = {};

    // Project ID filter
    if (formValues.project_id && formValues.project_id.length > 0) {
      filters['project_id'] = Array.isArray(formValues.project_id)
        ? formValues.project_id.map(id => Number(id))
        : [Number(formValues.project_id)];
    }

    // Transfer to filter - handle role-based logic
    const transferToValue = this.getTelecallerIdValue(formValues);
    if (transferToValue) {
      filters['transfer_to'] = transferToValue;
    } else if (formValues.transfer_to && formValues.transfer_to.length > 0) {
      filters['transfer_to'] = Array.isArray(formValues.transfer_to)
        ? formValues.transfer_to.map(id => Number(id))
        : [Number(formValues.transfer_to)];
    }

    // Transfer from filter
    if (formValues.transfer_from && formValues.transfer_from.length > 0) {
      filters['transfer_from'] = Array.isArray(formValues.transfer_from)
        ? formValues.transfer_from.map(id => Number(id))
        : [Number(formValues.transfer_from)];
    }

    return filters;
  }

  /**
   * Get telecaller ID value based on role
   */
  private getTelecallerIdValue(formValues: {
    project_id: number[] | null;
    transfer_to: number[] | null;
    transfer_from: number[] | null;
  }): number[] | null {
    const userId = this.userId();

    // If user has role 13 (telecaller), they can only see their own leads
    if (this.hasOnlyRoles([13])) {
      return userId ? [userId] : null;
    }

    // Default case: return transfer_to from form if specified
    if (formValues.transfer_to?.length) {
      return Array.isArray(formValues.transfer_to)
        ? formValues.transfer_to.map(id => Number(id))
        : [Number(formValues.transfer_to)];
    }

    return null;
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
