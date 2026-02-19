import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  signal,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  map,
  catchError,
  EMPTY,
  Subject
} from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { BookingInfo } from '../../../../../Service/booking.service';
import { ColumnDynamicColorService } from '../../../../../Service/Column-Colors/column-dynamic-color.service';
import { CommonService } from '../../../../../Service/common/common.service';

// ==================== TYPE DEFINITIONS ====================
interface Project {
  project_id: number;
  property_name: string;
}

interface Wing {
  wing_id: number;
  wing_name: string;
}

interface SalesExecutive {
  user_id: number;
  user_name: string;
}

interface ChannelPartner {
  channel_partner_id: number;
  firm_name: string;
  cp_owner?: string;
  full_name?: string;
}

interface MISReportFilterForm {
  project_id: FormControl<number | null>;
  wing_id: FormControl<number | null>;
  floor_unit_id: FormControl<number | null>;
  sales_executive_id: FormControl<number[] | null>;
  channel_partner_id: FormControl<number | null>;
  booking_status_id: FormControl<number[] | null>;
  agreement_status_id: FormControl<number[] | null>;
  disbursement_status_id: FormControl<number[] | null>;
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
}

interface AgGridPayload {
  filters?: {
    project_id?: number;
    wing_id?: number;
    floor_unit_id?: number;
    sales_executive_id?: number[];
    channel_partner_id?: number;
    booking_status_id?: number[];
    agreement_status_id?: number[];
    disbursement_status_id?: number[];
    start_date?: string;
    end_date?: string;
  };
}

interface MISReportColumn {
  key: string;
  label: string;
  type?: string;
  sticky?: boolean;
  disabled?: boolean;
  isAmount?: boolean;
  showAverage?: boolean;
  applyChequeStatusColor?: boolean;
  cellStyle?: (params: any) => any;
}

@Component({
  selector: 'app-mis-report',
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
  templateUrl: './mis-report.component.html',
  styleUrl: './mis-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisReportComponent implements OnInit {
  // ==================== DEPENDENCY INJECTION ====================
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly columnDynamicColorService = inject(ColumnDynamicColorService);
  private readonly destroyRef = inject(DestroyRef);
  private datePipe: DatePipe = new DatePipe('en-US');
  // ==================== CONSTANTS ====================
  readonly baseUrl = environment.API_URL;
  readonly roleId = Number(sessionStorage.getItem('role_id')) || 0;
  readonly userId = Number(sessionStorage.getItem('session_id')) || 0;
  private readonly SEARCH_DEBOUNCE_TIME = 400;
  private readonly MIN_SEARCH_LENGTH = 3;

  // ==================== SIGNALS FOR REACTIVE STATE ====================
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<Project[]>([]);
  readonly allSalesExecutive = signal<SalesExecutive[]>([]);
  readonly allWingslist = signal<Wing[]>([]);
  readonly allChannelPartnerList = signal<ChannelPartner[]>([]);
  readonly selectedProjectId = signal<number | null>(null);

  // Computed properties
  readonly hasSelectedProject = computed(() => this.selectedProjectId() !== null);
  readonly hasWings = computed(() => this.allWingslist().length > 0);
  readonly hasSalesExecutives = computed(() => this.allSalesExecutive().length > 0);

  // ==================== VIEW CHILD ====================
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // ==================== FORM ====================
  readonly misReportFilterForm: FormGroup<MISReportFilterForm> = new FormGroup({
    project_id: new FormControl<number | null>(null),
    wing_id: new FormControl<number | null>(null),
    floor_unit_id: new FormControl<number | null>(null),
    sales_executive_id: new FormControl<number[]>([]),
    channel_partner_id: new FormControl<number | null>(null),
    booking_status_id: new FormControl<number[]>([]),
    agreement_status_id: new FormControl<number[]>([]),
    disbursement_status_id: new FormControl<number[]>([]),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
  });

  // ==================== SEARCH SUBJECT FOR DEBOUNCING ====================
  private readonly partnerSearchSubject = new Subject<string>();

  // ==================== TABLE COLUMNS CONFIGURATION ====================
  get displayedColumns(): readonly MISReportColumn[] {
    return [
      { key: 'project_name', label: 'Project Name' },
      { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },
      { key: 'applicant_name', label: 'Client Name' },
      { key: 'wing_name', label: 'Wing' },
      { key: 'floor_unit', label: 'Unit No' },
      { key: 'unit_type', label: 'Unit Type' },
      { key: 'ownership', label: 'Ownership' },
      { key: 'landowner_name', label: 'Landowner Name' },
      { key: 'applicant_mobile', label: 'Mobile No', type: 'sensitive' },
      { key: 'applicant_email', label: 'Email', type: 'sensitive' },
      { key: 'sales_executive', label: 'Executive' },
      { key: 'basic_cost', label: 'Basic Cost', isAmount: true },
      { key: 'agreement_cost', label: 'Agreement Cost', isAmount: true },
      { key: 'bank_name', label: 'Bank Name' },
      { key: 'banker_type_name', label: 'Banker Type' },
      { key: 'banker_name', label: 'Banker Name' },
      { key: 'loan_status_name', label: 'Loan Status' },
      { key: 'sanction_amount', label: 'Sanction Amount', isAmount: true },
      { key: 'funding_amount', label: 'Funding Amount', isAmount: true },
      { key: 'total_ocr', label: 'Total OCR Require', isAmount: true },
      { key: 'till_date_due_percentage', label: 'Stage %' },
      { key: 'as_per_stage_ocr_req', label: 'As Per Stage OCR Required', isAmount: true },
      { key: 'ocr_received', label: 'OCR received', isAmount: true },
      { key: 'ocr_pending_as_per_stage', label: 'OCR Pending as per stage', isAmount: true },
      { key: 'total_ocr_pending', label: 'Total OCR Pending', isAmount: true },
      { key: 'sdr_amount', label: 'SDR Amount', isAmount: true },
      { key: 'sdr_received', label: 'SDR Received', isAmount: true },
      { key: 'sdr_pending', label: 'SDR Pending', isAmount: true },
      { key: 'gst_per', label: 'Received GST %', isAmount: true },
      { key: 'gst_total', label: 'GST Amount', isAmount: true },
      { key: 'gst_received', label: 'GST Received', isAmount: true },
      { key: 'balance_gst', label: 'GST Pending', isAmount: true },
      { key: 'as_per_stage_gst', label: 'As Per Stage GST', isAmount: true },
      { key: 'till_date_gst_pending', label: 'Till Date GST Pending', isAmount: true },
      {
        key: 'agreement_status', label: 'Agreement Status',
        applyChequeStatusColor: true,
        cellStyle: ({ data }: { data: BookingInfo }) => {
          return this.columnDynamicColorService.getMISAgreementStatusStyle(data?.['agreement_status_id'] as number | undefined);
        }
      },

      { key: 'agreement_date', label: 'Agreement Date', type: 'mediumDate' },
      { key: 'day_taken_from_agreement', label: 'Agreement TAT' },
      { key: 'agr_copy_received', label: 'Agr. Copy Received' },
      {
        key: 'tds_req', label: 'TDS Require',
        applyChequeStatusColor: true,
        cellStyle: ({ data }: { data: BookingInfo }) => {
          return this.columnDynamicColorService.getTDSRequirementStyle(data?.['tds_req']);
        }
      },
      { key: 'tds_amount', label: 'TDS Received', isAmount: true },
      {
        key: 'disbursement_status',
        label: 'Disbursement Status',
        applyChequeStatusColor: true,
        cellStyle: ({ data }: { data: BookingInfo }) => {
          return this.columnDynamicColorService.getMISDisbursementStatusStyle(data?.['disbursement_status_id'] as number | undefined);
        }
      },
      { key: 'disbursement_date', label: 'Disbursement Date', type: 'mediumDate' },
      { key: 'disbursement_amount', label: 'Disbursement Amount', isAmount: true },
      { key: 'disbursement_tat_from_booking', label: 'Disbursement TAT From Booking', isAmount: true },
      { key: 'disbursement_tat_from_agreement', label: 'Disbursement TAT From Agreement', isAmount: true },
      { key: 'received_amount', label: 'Total Received (Installment)', isAmount: true },
      { key: 'received_per', label: 'Received Amount in %' },
      { key: 'remark', label: 'Comment', type: 'truncate' },
    ] as const;
  }

  readonly columnKeys: readonly string[] = this.displayedColumns.map((col) => col.key);

  // ==================== LIFECYCLE HOOKS ====================
  ngOnInit(): void {
    this.setupFormListeners();
    this.setupPartnerSearch();
    this.fetchAllProjects();
  }

  // ==================== FORM LISTENERS SETUP ====================
  private setupFormListeners(): void {
    // Project ID changes with debouncing and proper cleanup
    this.misReportFilterForm.get('project_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((projectId) => {
        this.handleProjectChange(projectId);
      });

    // Wing ID changes
    this.misReportFilterForm.get('wing_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        filter((wingId) => !wingId),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.misReportFilterForm.patchValue({ floor_unit_id: null }, { emitEvent: false });
      });
  }

  // ==================== PARTNER SEARCH SETUP ====================
  private setupPartnerSearch(): void {
    this.partnerSearchSubject
      .pipe(
        debounceTime(this.SEARCH_DEBOUNCE_TIME),
        distinctUntilChanged(),
        filter((searchText) => {
          const trimmed = searchText.trim();
          if (trimmed.length < this.MIN_SEARCH_LENGTH) {
            this.allChannelPartnerList.set([]);
            this.cdr.markForCheck();
            return false;
          }
          return true;
        }),
        switchMap((searchText) => this.fetchChannelPartners(searchText.trim())),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (partners) => {
          this.allChannelPartnerList.set(partners);
          this.cdr.markForCheck();
        },
        error: () => {
          this.showError('Unable to fetch channel partners.');
        }
      });
  }

  // ==================== PROJECT CHANGE HANDLER ====================
  private handleProjectChange(projectId: number | null): void {
    this.selectedProjectId.set(projectId);

    // Reset dependent fields
    this.allWingslist.set([]);
    this.allSalesExecutive.set([]);

    this.misReportFilterForm.patchValue({
      wing_id: null,
      floor_unit_id: null,
      sales_executive_id: [],
    }, { emitEvent: false });

    this.cdr.markForCheck();

    // Fetch dependent data if project is selected
    if (projectId) {
      this.fetchAllWings(projectId);
      this.fetchAllSalesExecutive(projectId);
    }
  }

  // ==================== PUBLIC METHODS ====================
  onProjectChange(projectId: number): void {
    if (projectId !== null && projectId !== undefined) {
      this.misReportFilterForm.patchValue({ project_id: projectId });
    }
  }

  onPartnerSearch(searchText: string): void {
    this.partnerSearchSubject.next(searchText);
  }

  fetchMISReport(): void {
    const projectId = this.misReportFilterForm.get('project_id')?.value;

    if (!projectId) {
      this.showError('Please select a project first.');
      return;
    }

    // Fetch dependent dropdowns if not already loaded
    if (this.allWingslist().length === 0) {
      this.fetchAllWings(projectId);
    }

    if (this.allSalesExecutive().length === 0) {
      this.fetchAllSalesExecutive(projectId);
    }

    // Refresh ag-grid data
    requestAnimationFrame(() => {
      if (this.agGridComponent) {
        this.agGridComponent.refreshData();
      }
    });
  }

  getAgGridPayload(): AgGridPayload {
    const formValues = this.misReportFilterForm.value;
    const filters: AgGridPayload['filters'] = {};

    // Helper to add value to filters if not null/undefined
    const addToFiltersIfDefined = <T>(key: keyof NonNullable<AgGridPayload['filters']>, value: T | null | undefined): void => {
      if (value !== null && value !== undefined) {
        filters[key] = value as any;
      }
    };

    // Helper to add array to filters if not empty
    const addArrayToFiltersIfNotEmpty = (key: keyof NonNullable<AgGridPayload['filters']>, value: unknown[] | null | undefined): void => {
      if (Array.isArray(value) && value.length > 0) {
        filters[key] = value as any;
      }
    };

    // Add all form fields including project_id to filters object
    addToFiltersIfDefined('project_id', formValues.project_id);
    addToFiltersIfDefined('wing_id', formValues.wing_id);
    addToFiltersIfDefined('floor_unit_id', formValues.floor_unit_id);
    addToFiltersIfDefined('channel_partner_id', formValues.channel_partner_id);

    addArrayToFiltersIfNotEmpty('sales_executive_id', formValues.sales_executive_id);
    addArrayToFiltersIfNotEmpty('booking_status_id', formValues.booking_status_id);
    addArrayToFiltersIfNotEmpty('agreement_status_id', formValues.agreement_status_id);
    addArrayToFiltersIfNotEmpty('disbursement_status_id', formValues.disbursement_status_id);

    // Add formatted dates to filters
    if (formValues.start_date) {
      filters.start_date = this.datePipe.transform(formValues.start_date, 'yyyy-MM-dd') || undefined;
    }

    if (formValues.end_date) {
      filters.end_date = this.datePipe.transform(formValues.end_date, 'yyyy-MM-dd') || undefined;
    }

    // Build payload with all fields inside filters object
    const payload: AgGridPayload = {
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    };

    return payload;
  }

  // ==================== DATA FETCHING METHODS ====================
  private fetchAllProjects(): void {
    this.loading.set(true);
    this.cdr.markForCheck();

    this.commonService.fetchUserProjectDropdown(this.userId)
      .pipe(
        catchError((error) => {
          console.error('Error fetching projects:', error);
          this.showError('Unable to fetch projects.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projects) => {
          this.projectsList.set(projects || []);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  private fetchAllWings(projectId: number): void {
    this.commonService.fetchWingDropdown(projectId)
      .pipe(
        catchError((error) => {
          console.error('Error fetching wings:', error);
          this.showError('Unable to fetch wings.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (wings) => {
          this.allWingslist.set(wings || []);
          this.cdr.markForCheck();
        }
      });
  }

  private fetchAllSalesExecutive(projectId: number): void {
    this.commonService.fetchSalesExecutives(projectId)
      .pipe(
        catchError((error) => {
          console.error('Error fetching sales executives:', error);
          this.showError('Unable to fetch sales executives.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (executives) => {
          this.allSalesExecutive.set(executives || []);
          this.cdr.markForCheck();
        }
      });
  }

  private fetchChannelPartners(searchText: string) {
    return this.commonService.fetchChannelPartnerDropdown(searchText)
      .pipe(
        map((partners) => {
          return (partners || []).map((item) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner || ''})`,
          }));
        }),
        catchError(() => {
          this.showError('Unable to fetch channel partners.');
          return EMPTY;
        })
      );
  }

  // ==================== HELPER METHODS ====================
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
    });
  }
}
