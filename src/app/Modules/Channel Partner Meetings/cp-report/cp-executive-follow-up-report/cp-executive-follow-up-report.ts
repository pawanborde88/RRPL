import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { finalize, map, catchError, EMPTY, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { CommonService } from '../../../../Service/common/common.service';
import { AllCPDialogDataComponent } from '../all-cpdialog-data/all-cpdialog-data.component';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
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
  selector: 'app-cp-executive-follow-up-report',
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
  templateUrl: './cp-executive-follow-up-report.html',
  styleUrl: './cp-executive-follow-up-report.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class CpExecutiveFollowUpReport {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Dependency Injection
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

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
    { key: 'firm_name', label: 'Firm Name' },
    { key: 'message', label: 'Follow-up Message' },
    { key: 'followup_date', label: 'Follow-up Date', type: 'mediumDate' },
    { key: 'rera', label: 'RERA Number' },
    { key: 'created_by_name', label: 'Follow Up By' },
    { key: 'created_at', label: 'Follow Up On', type: 'date' },


  ];

  // Actions for AG Grid (readonly constant)
  readonly channelPartnerActions: readonly any[] = [] as const;

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.formValues();
    const filters: any = {};
    if (formValues.project_id) filters.project_id = formValues.project_id;
    if (formValues.channel_partner_id) filters.channel_partner_id = formValues.channel_partner_id;
    if (formValues.start_date) filters.start_date = this.formatDate(formValues.start_date);
    if (formValues.end_date) filters.end_date = this.formatDate(formValues.end_date);
    return {
      filters: filters
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



  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }
  fetchAllProjectDemands(): void {
    if (this.channelPartnerMeetingForm.valid) {
      this.agGridComponent?.refreshData();
    } else {
      this.showSnackBar('Please select Project and Channel Partner.');
    }
  }
  fetchCPTargetReport(): void {
    // Refresh AG Grid data - payload is computed and will update automatically
    this.refreshAgGridData();
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
