import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, of, map, EMPTY } from 'rxjs';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent, TableColumn } from '../../../Common/Reusable/reusable-table/reusable-table.component';
import { ConfigurableAgGridDataComponent } from '../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { CommonService } from '../../../Service/common/common.service';
import { AddCPreportComponent } from '../add-cpreport/add-cpreport.component';
import { AllCPDialogDataComponent } from './all-cpdialog-data/all-cpdialog-data.component';

interface CPReportFilterForm {
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
  director_id: FormControl<any[] | null>;
  project_id: FormControl<any[] | null>;
  source_manger_id: FormControl<any[] | null>;
  channel_partner_id: FormControl<any[] | null>;
}

interface ChannelPartner {
  channel_partner_id: number;
  firm_name: string;
  cp_owner?: string;
  full_name?: string;
  [key: string]: unknown;
}

interface PaginationConfig {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ActionItem {
  action: string;
  icon: string;
  tooltip: string;
  color: string;
  disabled: boolean;
}

interface HeaderButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}
@Component({
  selector: 'app-cp-report',
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
    ReusableTableComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './cp-report.component.html',
  styleUrl: './cp-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpReportComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');
  private readonly commonService = inject(CommonService);

  // Constants
  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly DEFAULT_PAGE_SIZE = 30;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly allChannelPartnerList = signal<ChannelPartner[]>([]);
  readonly allSourcingManagerDropdown = signal<any[]>([]);
  readonly allDirectorDropdown = signal<any[]>([]);
  readonly paginationConfig = signal<PaginationConfig>({
    offset: 0,
    limit: this.DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Form definition
  readonly channelPartnerMeetingForm: FormGroup<CPReportFilterForm> = new FormGroup({
    start_date: new FormControl<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    end_date: new FormControl<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
    director_id: new FormControl<any[] | null>([]),
    project_id: new FormControl<any[] | null>([]),
    source_manger_id: new FormControl<any[] | null>([]),
    channel_partner_id: new FormControl<any[] | null>([]),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    start_date: Date | null;
    end_date: Date | null;
    director_id: any[] | null;
    project_id: any[] | null;
    source_manger_id: any[] | null;
    channel_partner_id: any[] | null;
  }>({
    start_date: null,
    end_date: null,
    director_id: null,
    project_id: null,
    source_manger_id: null,
    channel_partner_id: null,
  });

  // Column definitions for AG Grid (readonly constant)
  readonly channelPartnerMeetingColumns: readonly TableColumn[] = [
    { key: 'property_name', label: 'Projects' },
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
    {
      key: 'cp_retention_achievement', label: 'Retention', clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'retention'),
    },
    {
      key: 'cp_visit_achievement',
      label: 'Visit',
      clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'site_visit'),
    },
    {
      key: 'booking_count',
      label: 'Booking Count',
      clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'booking'),
    },
    {
      key: 'total_token_count',
      label: 'Token Count',
      clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'token'),
    },
  ] as const;

  // Actions for AG Grid (readonly constant)
  readonly channelPartnerActions: readonly any[] = [] as const;

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

  private readonly roleId = computed(() => {
    return Number(sessionStorage.getItem('role_id')) || 0;
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
        source_manger_id: any[] | null;
        channel_partner_id: any[] | null;
      }>) => {
        this.formValues.set({
          start_date: formValue.start_date ?? null,
          end_date: formValue.end_date ?? null,
          director_id: formValue.director_id ?? null,
          project_id: formValue.project_id ?? null,
          source_manger_id: formValue.source_manger_id ?? null,
          channel_partner_id: formValue.channel_partner_id ?? null,
        });
      });

    // Initialize with current form values
    const initialValue = this.channelPartnerMeetingForm.value;
    this.formValues.set({
      start_date: initialValue.start_date ?? null,
      end_date: initialValue.end_date ?? null,
      director_id: initialValue.director_id ?? null,
      project_id: initialValue.project_id ?? null,
      source_manger_id: initialValue.source_manger_id ?? null,
      channel_partner_id: initialValue.channel_partner_id ?? null,
    });
  }
  openCPCountDialog(row: any, type: 'site_visit' | 'token' | 'booking' | 'unique_cp' | 'retention'): void {
    const formValue = this.channelPartnerMeetingForm.value;

    // Determine API endpoint based on type
    let apiEndpoint = '';
    switch (type) {
      case 'site_visit':
        apiEndpoint = 'fetch_project_enquiries';
        break;
      case 'token':
        apiEndpoint = 'fetch_all_token';
        break;
      case 'booking':
        apiEndpoint = 'fetch_all_bookings';
        break;
      case 'unique_cp':
        apiEndpoint = 'fetch_all_cp_site_visit_report';
        break;
      case 'retention':
        apiEndpoint = 'fetch_all_cp_site_visit_report';
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
      width: '950px',
      maxHeight: '100vh',

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

  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length <= 3) {
      this.allChannelPartnerList.set([]);
      return;
    }

    this.commonService
      .fetchChannelPartnerDropdown(trimmedSearch)
      .pipe(
        map((res: Array<{ channel_partner_id: number; firm_name: string; cp_owner?: string }>) =>
          res.map((item: { channel_partner_id: number; firm_name: string; cp_owner?: string }) => ({
            ...item,
            full_name: `${item.firm_name} -(${item.cp_owner || '--'})`,
          }))
        ),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching channel partners:', error);
          this.showSnackBar('Unable to fetch channel partners.', 'error');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: ChannelPartner[]) => {
          this.allChannelPartnerList.set(res);
        },
      });
  }

  private fetchAllSourcingManagers(): void {
    this.commonService
      .fetchSourcingManagerDropdown([18])
      .pipe(
        catchError(() => {
          this.showSnackBar('Unable to fetch sourcing managers.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (managers: any[]) => {
          this.allSourcingManagerDropdown.set(managers || []);
        },
        error: (err: unknown) => {
          console.error('Error fetching sourcing managers:', err);
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

  openAllCPDialog(row: any): void {
    this.dialog.open(AllCPDialogDataComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { rowData: row },
    });
  }
  private fetchAllDirectors(): void {
    this.commonService
      .fetchDirectorDropdown([8])
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (directors: any[]) => {
          this.allDirectorDropdown.set(directors || []);
        },
        error: (err: unknown) => {
          console.error('Error fetching directors:', err);
        },
      });
  }

  fetchCPTargetReport(): void {
    const projectId = this.channelPartnerMeetingForm.get('project_id')?.value;
    if (!projectId || !Array.isArray(projectId) || projectId.length === 0) {
      this.showSnackBar('Please select at least one project to filter reports.', 'error');
      return;
    }

    // Refresh AG Grid data - payload is computed and will update automatically
    this.refreshAgGridData();
  }

  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  private buildFilters(formValues: {
    start_date: Date | null;
    end_date: Date | null;
    director_id: any[] | null;
    project_id: any[] | null;
    source_manger_id: any[] | null;
    channel_partner_id: any[] | null;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id && Array.isArray(formValues.project_id) && formValues.project_id.length > 0
        ? formValues.project_id
        : null,
      channel_partner_id: formValues.channel_partner_id && Array.isArray(formValues.channel_partner_id) && formValues.channel_partner_id.length > 0
        ? formValues.channel_partner_id
        : null,
      director_id: formValues.director_id && Array.isArray(formValues.director_id) && formValues.director_id.length > 0
        ? formValues.director_id
        : null,
      source_manger_id: formValues.source_manger_id && Array.isArray(formValues.source_manger_id) && formValues.source_manger_id.length > 0
        ? formValues.source_manger_id
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

  private showSnackBar(message: string, panelClass: 'error' | 'default' = 'default'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass === 'error' ? ['snackbar-error'] : undefined,
    });
  }
}
