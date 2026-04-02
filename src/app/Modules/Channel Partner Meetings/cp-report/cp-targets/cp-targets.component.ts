import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TableColumn, HeaderButton } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AddCPreportComponent } from '../../add-cpreport/add-cpreport.component';
import { AllCPDialogDataComponent } from '../all-cpdialog-data/all-cpdialog-data.component';
import { CommonService } from '../../../../Service/common/common.service';
import { finalize } from 'rxjs';
interface ActionItem {
  action: string;
  icon: string;
  tooltip: string;
  color: string;
  disabled: boolean;
}

interface PaginationConfig {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-cp-targets',
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
  templateUrl: './cp-targets.component.html',
  styleUrl: './cp-targets.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpTargetsComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly storageUrl = environment.STORAGE_URL;
  private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly DEFAULT_PAGE_SIZE = 30;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly allSourcingManagerDropdown = signal<any[]>([]);
  readonly allDirectorDropdown = signal<any[]>([]);
  readonly paginationConfig = signal<PaginationConfig>({
    offset: 0,
    limit: this.DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Computed signals for user data
  private readonly userId = computed(() => {
    return Number(sessionStorage.getItem('session_id')) || 0;
  });

  private readonly roleId = computed(() => {
    return Number(sessionStorage.getItem('role_id')) || 0;
  });

  // Form definition
  readonly channelPartnerMeetingForm: FormGroup = new FormGroup({
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
    director_id: new FormControl<[] | null>([]),
    project_id: new FormControl<[] | null>([], [Validators.required]),
    sourcing_manger_id: new FormControl<[] | null>([]),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    start_date: Date | null;
    end_date: Date | null;
    director_id: any[] | null;
    project_id: any[] | null;
    sourcing_manger_id: any[] | null;
  }>({
    start_date: null,
    end_date: null,
    director_id: null,
    project_id: null,
    sourcing_manger_id: null,
  });

  // Column definitions for AG Grid (readonly constant)
  readonly columnDefinitions: readonly TableColumn[] = [
    { key: 'sourcing_manager', label: 'Sourcing SM' },
    { key: 'cluster_name', label: 'Cluster Heads' },
    { key: 'property_name', label: 'Projects' },
    { key: 'director_name', label: 'Director' },
    {
      key: 'till_date_visit',
      label: 'Till Date Visit',
      clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'site_visit'),
    },
    {
      key: 'till_date_unique_cp',
      label: 'Till Date Unique CPs',
      clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'unique_cp'),
    },
    { key: 'unique_cp_target', label: 'Unique CP Target' },
    { key: 'cp_visit_achievement', label: 'CP Visit Achievement' },
    { key: 'cp_retention_achievement', label: 'CP Retention Achievement' },
    { key: 'retention_target', label: 'Retention Target' },
    { key: 'cp_visit_target', label: 'CP Visit Target' },
    { key: 'cp_booking_target', label: 'CP Booking Target' },
    { key: 'booking_count', label: 'Booking Target' },
    {
      key: 'total_token_count',
      label: 'Token Count',
      clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'token'),
    },
    { key: 'month_token_count', label: 'Month Token Count' },
    { key: 'target_from', label: 'Target From', type: 'date' },
    { key: 'target_to', label: 'Target To', type: 'date' },
  ] as const;

  // Actions for AG Grid (readonly constant)
  readonly channelPartnerActions: readonly any[] = [
    {
      action: 'editCPTargetReport',
      icon: 'edit_note',
      tooltip: 'Edit Target Report',
      color: 'primary',
      disabled: false,
    },
  ] as const;

  // Header buttons for AG Grid (readonly constant)
  readonly headerButtons: readonly HeaderButton[] = [
    {
      label: 'Add Target',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddCPReportDialog(),
      show: () => true,
    },
  ] as const;

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

  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchAllSourcingManagers();
    this.fetchAllDirectors();
    this.setupFormValueTracking();
  }

  /**
   * Track form value changes and update formValues signal
   * This makes computed signals reactive to form changes
   */
  private setupFormValueTracking(): void {
    // Subscribe to form valueChanges and update signal
    this.channelPartnerMeetingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValue: Partial<{
        start_date: Date | null;
        end_date: Date | null;
        director_id: any[] | null;
        project_id: any[] | null;
        sourcing_manger_id: any[] | null;
      }>) => {
        this.formValues.set({
          start_date: formValue.start_date ?? null,
          end_date: formValue.end_date ?? null,
          director_id: formValue.director_id ?? null,
          project_id: formValue.project_id ?? null,
          sourcing_manger_id: formValue.sourcing_manger_id ?? null,
        });
      });

    // Initialize with current form values
    const initialValue = this.channelPartnerMeetingForm.value;
    this.formValues.set({
      start_date: initialValue.start_date ?? null,
      end_date: initialValue.end_date ?? null,
      director_id: initialValue.director_id ?? null,
      project_id: initialValue.project_id ?? null,
      sourcing_manger_id: initialValue.sourcing_manger_id ?? null,
    });
  }

  onBookingAction(action: string, row: any): void {
    if (action === 'editCPTargetReport') {
      this.openAddCPReportDialog(row);
    }
  }

  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  private buildFilters(formValues: {
    start_date: Date | null;
    end_date: Date | null;
    director_id: any[] | null;
    project_id: any[] | null;
    sourcing_manger_id: any[] | null;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id && Array.isArray(formValues.project_id) && formValues.project_id.length > 0
        ? formValues.project_id
        : null,
      director_id: formValues.director_id && Array.isArray(formValues.director_id) && formValues.director_id.length > 0
        ? formValues.director_id
        : null,
      sourcing_manger_id: formValues.sourcing_manger_id && Array.isArray(formValues.sourcing_manger_id) && formValues.sourcing_manger_id.length > 0
        ? formValues.sourcing_manger_id
        : null,
    };

    // Add date filters
    if (formValues.start_date) {
      filters['start_date'] = this.formatDate(formValues.start_date);
    }
    if (formValues.end_date) {
      filters['end_date'] = this.formatDate(formValues.end_date);
    }

    return filters;
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    return this.datePipe.transform(date, this.DATE_FORMAT);
  }
  openCPCountDialog(row: any, type: 'site_visit' | 'token' | 'booking' | 'unique_cp'): void {
    const formValue = this.channelPartnerMeetingForm.value;

    // Determine API endpoint based on type
    let apiEndpoint = '';
    switch (type) {
      case 'site_visit':
        apiEndpoint = 'fetch_project_enquiries';
        break;
      case 'token':
        apiEndpoint = 'fetch_tokens';
        break;
      case 'booking':
        apiEndpoint = 'fetch_booking';
        break;
      case 'unique_cp':
        apiEndpoint = 'fetch_cp_site_visit_report';
        break;
    }

    // Build payload with all filters
    // Use channel_partner_id from formValue if available, otherwise use from row
    const channelPartnerId = formValue.channel_partner_id?.length
      ? formValue.channel_partner_id
      : (row.channel_partner_id || null);

    let payload: any = {};

    // Build different payload structure based on type
    if (type === 'token') {
      // For fetch_tokens: Only project_id, channel_partner_id, and source_id (NO dates)
      payload = {
        project_id: [row.project_id],
        channel_partner_id: channelPartnerId,
        start_date: this.datePipe.transform(formValue.start_date, 'yyyy-MM-dd'),
        end_date: this.datePipe.transform(formValue.end_date, 'yyyy-MM-dd'),
        source_id: 3,
      };
    } else if (type === 'booking') {
      // For fetch_booking: Include dates, project_id, channel_partner_id, and source_id
      payload = {
        project_id: [row.project_id],
        start_date: this.datePipe.transform(formValue.start_date, 'yyyy-MM-dd'),
        end_date: this.datePipe.transform(formValue.end_date, 'yyyy-MM-dd'),
        source_id: 3,
        channel_partner_id: channelPartnerId,
      };
    } else if (type === 'unique_cp') {
      // For fetch_cp_site_visit_report: Only project_id
      payload = {
        project_id: [row.project_id],
      };
    } else {
      // For site_visit and other types: Include all fields
      payload = {
        project_id: [row.project_id],
        source_id: 3,
        count: row.till_date_visit,
        start_date: this.datePipe.transform(formValue.start_date, 'yyyy-MM-dd'),
        end_date: this.datePipe.transform(formValue.end_date, 'yyyy-MM-dd'),
        channel_partner_id: channelPartnerId,
      };
    }

    this.dialog.open(AllCPDialogDataComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        rowData: row,
        apiEndpoint: apiEndpoint,
        payload: payload,
        type: type
      },
    });
  }
  fetchAllProjects(): void {
    this.loading.set(true);

    this.commonService
      .fetchUserProjectDropdown(this.userId())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any[]) => {
          this.projectsList.set(res || []);
        },
        error: (err: unknown) => {
          console.error('Error fetching projects:', err);
          this.showSnackBar('Unable to fetch projects.');
        },
      });
  }

  private fetchAllSourcingManagers(): void {
    this.commonService
      .fetchSourcingManagerDropdown([18])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (managers: any[]) => {
          this.allSourcingManagerDropdown.set(managers || []);
        },
        error: (err: unknown) => {
          console.error('Error fetching sourcing managers:', err);
          this.showSnackBar('Unable to fetch sourcing managers.');
        },
      });
  }

  openAddCPReportDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddCPreportComponent, {
      width: '600px',
      data: { row },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchCPTargetReport();
      }
    });
  }
  private fetchAllDirectors(): void {
    this.commonService
      .fetchDirectorDropdown([8])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (directors: any[]) => {
          this.allDirectorDropdown.set(directors || []);
        },
        error: (err: unknown) => {
          console.error('Error fetching directors:', err);
          this.showSnackBar('Unable to fetch directors.');
        },
      });
  }

  fetchCPTargetReport(): void {
    // Refresh AG Grid data - payload is computed and will update automatically
    this.refreshAgGridData();
  }

  private showSnackBar(message: string, panelClass: 'error' | 'default' = 'default'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass === 'error' ? ['snackbar-error'] : undefined,
    });
  }

}
