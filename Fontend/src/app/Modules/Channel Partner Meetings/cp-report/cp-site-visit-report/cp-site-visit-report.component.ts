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
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent, TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AddCPreportComponent } from '../../add-cpreport/add-cpreport.component';
import { AllCPDialogDataComponent } from '../all-cpdialog-data/all-cpdialog-data.component';
import { catchError, finalize, of, map, EMPTY } from 'rxjs';
interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
  channel_partner_id: FormControl<any | null>;
  ignore_date_filters: FormControl<boolean | null>;
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
@Component({
  selector: 'app-cp-site-visit-report',
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
  templateUrl: './cp-site-visit-report.component.html',
  styleUrl: './cp-site-visit-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CpSiteVisitReportComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');
  readonly allChannelPartnerList = signal<ChannelPartner[]>([]);

  // Constants
  private readonly baseUrl = environment.API_URL;
  private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly LEAD_LEVEL_ID = 13;
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

  // Form definition
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any[] | null>([], Validators.required),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
    channel_partner_id: new FormControl<any | null>(null),
    ignore_date_filters: new FormControl<boolean>(false),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: any[] | null;
    start_date: Date | null;
    end_date: Date | null;
    channel_partner_id: any | null;
    ignore_date_filters: boolean;
  }>({
    project_id: null,
    start_date: null,
    end_date: null,
    channel_partner_id: null,
    ignore_date_filters: false,
  });

  // Column definitions for AG Grid (readonly constant)
  readonly columnDefinitions: readonly TableColumn[] = [
    { key: 'project_names', label: 'Project Name' },


    { key: 'firm_name', label: 'Firm Name' },
    
    {
      key: 'site_visit_count',
      label: 'CP Visit ',
      clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'site_visit'),
      
    },
   
   
    { key: 'token_count', label: 'Token Count'  , clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'token'), },
    {
      key: 'booking_count',
      label: 'CP Booking ',
      clickable: true,
      onClick: (row: any) => this.openCPCountDialog(row, 'booking'),
     
    },
  
   
    { key: 'firm_address', label: 'Firm Address' },
    { key: 'firm_phone', label: 'Firm Phone' },
    { key: 'firm_email', label: 'Firm Email', },

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValue: Partial<{
        project_id: any[] | null;
        start_date: Date | null;
        end_date: Date | null;
        channel_partner_id: any | null;
        ignore_date_filters: boolean | null;
      }>) => {
        this.formValues.set({
          project_id: formValue.project_id ?? null,
          start_date: formValue.start_date ?? null,
          end_date: formValue.end_date ?? null,
          channel_partner_id: formValue.channel_partner_id ?? null,
          ignore_date_filters: formValue.ignore_date_filters ?? false,
        });
      });

    // Initialize with current form values
    const initialValue = this.enquiryFilterForm.value;
    this.formValues.set({
      project_id: initialValue.project_id ?? null,
      start_date: initialValue.start_date ?? null,
      end_date: initialValue.end_date ?? null,
      channel_partner_id: initialValue.channel_partner_id ?? null,
      ignore_date_filters: initialValue.ignore_date_filters ?? false,
    });
  }
  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length <= 3) {
      this.allChannelPartnerList.set([]);
      return;
    }

    this.http
      .post<Array<{ channel_partner_id: number; firm_name: string; cp_owner?: string }>>(
        `${this.baseUrl}/channel_partner_dropdown`,
        { firm_name: trimmedSearch }
      )
      .pipe(
        map((res: Array<{ channel_partner_id: number; firm_name: string; cp_owner?: string }>) =>
          res.map((item: { channel_partner_id: number; firm_name: string; cp_owner?: string }) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner || '--'})`,
          }))
        ),
        catchError((error: HttpErrorResponse) => {
          console.error('Error fetching channel partners:', error);
          this.showSnackBar('Unable to fetch channel partners.', 'error');
          return EMPTY;
        })
      )
      .subscribe({
        next: (res) => {
          this.allChannelPartnerList.set(res);
        },
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
    const projectId = this.enquiryFilterForm.get('project_id')?.value;
    if (!projectId || !Array.isArray(projectId) || projectId.length === 0) {
      this.showSnackBar('Please select at least one project to filter leads.', 'error');
      return;
    }

    // Refresh AG Grid data - payload is computed and will update automatically
    this.refreshAgGridData();
  }
  openCPCountDialog(row: any, type: 'site_visit' | 'token' | 'booking'): void {
    const formValue = this.enquiryFilterForm.value;
    
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
    }
    
    // Build payload with all filters
    // Use channel_partner_id from row
    const channelPartnerId = row.channel_partner_id || null;
    
    let payload: any = {};
    
    // Build different payload structure based on type
    if (type === 'token') {
      // For fetch_tokens: Only project_id, channel_partner_id, and source_id (NO dates)
      payload = {
        project_id: formValue.project_id?.length ? formValue.project_id : null,
        channel_partner_id: channelPartnerId,
        source_id: 3,
      };
    } else if (type === 'booking') {
      // For fetch_booking: Include dates, project_id, channel_partner_id, and source_id
      payload = {
        project_id: formValue.project_id?.length ? formValue.project_id : null,
        start_date: this.datePipe.transform(formValue.start_date, 'yyyy-MM-dd'),
        end_date: this.datePipe.transform(formValue.end_date, 'yyyy-MM-dd'),
        source_id: 3,
        channel_partner_id: channelPartnerId,
      };
    } else {
      // For site_visit and other types: Include all fields
      payload = {
        project_id: formValue.project_id?.length ? formValue.project_id : null,
        source_id: 3,
        start_date: this.datePipe.transform(formValue.start_date, 'yyyy-MM-dd'),
        end_date: this.datePipe.transform(formValue.end_date, 'yyyy-MM-dd'),
        channel_partner_id: channelPartnerId,
      };
    }
    
    this.dialog.open(AllCPDialogDataComponent, {
      width: '950px',
      maxHeight: '90vh',
      data: { 
        rowData: row,
        apiEndpoint: apiEndpoint,
        payload: payload,
        type: type
      },
    });
  }
  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  private buildFilters(formValues: {
    project_id: any[] | null;
    start_date: Date | null;
    end_date: Date | null;
    channel_partner_id: any | null;
    ignore_date_filters: boolean;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id && Array.isArray(formValues.project_id) && formValues.project_id.length > 0
        ? formValues.project_id
        : null,
      channel_partner_id: formValues.channel_partner_id || null,
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
    this.loading.set(true);
    const payload = {
      user_id: this.hasPermission(2) ? null : this.userId(),
    };

    this.http
      .post<any[]>(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(
        catchError((err) => {
          console.error('Error fetching projects:', err);
          this.showSnackBar('Unable to fetch projects.');
          return of([]);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any[]) => {
          this.projectsList.set(res || []);
        },
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