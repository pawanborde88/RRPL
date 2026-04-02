import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ResizableColumnDirective } from '../../../../../Common/directives/resizable-column.directive';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { CostomLoadingComponent } from '../../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { environment } from '../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../../../../Service/common/common.service';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  forkJoin,
  map,
  of,
  retry,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

// Type definitions
interface Telecaller {
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface SalesExecutive {
  user_id: number;
  user_name: string;
}

interface Project {
  project_id: number;
  property_name: string;
}

interface SourceData {
  source: string;
  enquiry_count?: number;
  lead_count?: number;
  followup_count: number;
}

interface LeadLevel {
  lead_level: string;
  lead_level_count: number;
}

interface EnquiryResponse {
  success: boolean;
  source: SourceData[];
  lead_level: LeadLevel[];
  total_enquiry_count: number;
  unassigned_count?: number;
}

interface LeadResponse {
  success: boolean;
  source: SourceData[];
  lead_level: LeadLevel[];
  total_lead_count: number;
  unassigned_count?: number;
}

// Chart configuration constants
const CHART_COLORS = [
  '#0d4678', // Indigo 600
  '#06B6D4', // Cyan 500
  '#10B981', // Emerald 500
  '#F59E0B', // Amber 500
  '#EF4444', // Red 500
  '#0d4678', // Violet 500
  '#EC4899', // Pink 500
  '#F97316', // Orange 500
] as const;

const CHART_OPTIONS_BASE: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#0f172a',
      bodyColor: '#475569',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
      displayColors: true,
      titleFont: { size: 12, weight: '600', family: "'Plus Jakarta Sans', sans-serif" },
      bodyFont: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }
    }
  }
};

const CHART_OPTIONS_SCALED: any = {
  ...CHART_OPTIONS_BASE,
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(226, 232, 240, 0.4)', drawBorder: false },
      ticks: {
        color: '#64748b',
        font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
        maxTicksLimit: 6
      }
    },
    x: {
      grid: { display: false },
      ticks: {
        color: '#64748b',
        font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
        maxRotation: 45,
        minRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12
      }
    }
  }
};

const CHART_OPTIONS_DOUGHNUT: any = {
  ...CHART_OPTIONS_BASE,
  cutout: '70%',
  plugins: {
    ...CHART_OPTIONS_BASE.plugins,
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: { size: 10, family: "'Plus Jakarta Sans', sans-serif" },
        color: '#64748b'
      }
    }
  }
};

@Component({
  selector: 'app-talecaller-salesexecutive-count',
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
    ResizableColumnDirective,
    AutocompleteReusableComponent,
    ReusableTableComponent,
    CostomLoadingComponent,
  ],
  templateUrl: './talecaller-salesexecutive-count.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TalecallerSalesexecutiveCountComponent implements OnInit {
  // Dependency Injection
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly commonService = inject(CommonService);
  private datePipe: DatePipe = new DatePipe('en-US');
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  readonly roleId = Number(sessionStorage.getItem('role_id')) || null;
  private readonly baseUrl = environment.API_URL;
  protected readonly Object = Object;

  // Chart references
  @ViewChild('leadLevelChartCanvas', { static: false }) private leadLevelChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('enquiryLeadLevelChartCanvas', { static: false }) private enquiryLeadLevelChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('leadSourceChartCanvas', { static: false }) private leadSourceChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('enquirySourceChartCanvas', { static: false }) private enquirySourceChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('teamReportChartCanvas', { static: false }) private teamReportChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('enquiryTeamCountChartCanvas', { static: false }) private enquiryTeamCountChartCanvas!: ElementRef<HTMLCanvasElement>;

  private leadLevelChart: Chart | null = null;
  private enquiryLeadLevelChart: Chart | null = null;
  private leadSourceChart: Chart | null = null;
  private enquirySourceChart: Chart | null = null;
  private teamReportChart: Chart | null = null;
  private enquiryTeamCountChart: Chart | null = null;

  // Reactive state using signals
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly projectsList = signal<Project[]>([]);
  readonly allSalesExecutive = signal<SalesExecutive[]>([]);
  readonly allTelecallerlist = signal<Telecaller[]>([]);
  readonly enquiryData = signal<EnquiryResponse | null>(null);
  readonly leadData = signal<LeadResponse | null>(null);
  readonly teamReportData = signal<any[]>([]);
  readonly enquiryTeamCountData = signal<any[]>([]);

  // Signal to track count_type_id (including disabled controls)
  private readonly countTypeIdSignal = signal<number | null>(null);

  // Form
  readonly leadForm = new FormGroup({
    project_id: new FormControl<number | null>(null),
    status_id: new FormControl<number[]>([]),
    telecaller_id: new FormControl<any[]>([]),
    count_type_id: new FormControl<number | null>(null),
    sales_executive_id: new FormControl<any[]>([]),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
  });

  // Reactive form values using toSignal
  // Use getRawValue() to include disabled controls
  private readonly formValue$ = this.leadForm.valueChanges.pipe(
    startWith(this.leadForm.getRawValue()),
    map(() => this.leadForm.getRawValue()),
    takeUntilDestroyed(this.destroyRef)
  );

  readonly formValues = toSignal(
    this.formValue$.pipe(
      map(value => ({
        project_id: value.project_id ?? null,
        count_type_id: value.count_type_id ?? null,
        telecaller_id: (value.telecaller_id as number[]) || [],
        sales_executive_id: (value.sales_executive_id as number[]) || [],
      }))
    ),
    { initialValue: { project_id: null, count_type_id: null, telecaller_id: [], sales_executive_id: [] } }
  );

  // Computed signals for derived values
  // Use signal for count_type_id to handle disabled controls
  readonly countTypeId = computed(() => {
    const signalValue = this.countTypeIdSignal();
    const controlValue = this.leadForm.get('count_type_id')?.value;
    return signalValue ?? controlValue ?? null;
  });
  readonly projectId = computed(() => {
    const formValue = this.formValues()?.project_id;
    const controlValue = this.leadForm.get('project_id')?.value;
    return formValue ?? controlValue ?? null;
  });
  readonly isTelecallerMode = computed(() => this.countTypeId() === 1);
  readonly isSalesExecutiveMode = computed(() => this.countTypeId() === 2);
  readonly hasProjectSelected = computed(() => !!this.projectId());
  readonly hasTelecallerSelected = computed(() => {
    const ids = this.formValues()?.telecaller_id;
    return Array.isArray(ids) && ids.length > 0;
  });
  readonly hasSalesExecutiveSelected = computed(() => {
    const ids = this.formValues()?.sales_executive_id;
    return Array.isArray(ids) && ids.length > 0;
  });

  readonly isFormValid = computed(() => {
    const projectId = this.projectId();
    const countTypeId = this.countTypeId();

    // Both project and count_type must be selected
    if (!projectId || !countTypeId) return false;

    return true;
  });

  readonly showEnquiryData = computed(() =>
    !this.loading() && !!this.enquiryData() && this.isSalesExecutiveMode()
  );

  readonly showLeadData = computed(() =>
    !this.loading() && !!this.leadData() && this.isTelecallerMode()
  );

  readonly showNoData = computed(() =>
    !this.loading() &&
    !this.enquiryData() &&
    !this.leadData() &&
    (this.isTelecallerMode() || this.isSalesExecutiveMode())
  );

  // Computed totals
  readonly totalCount = computed(() => {
    const enquiry = this.enquiryData();
    const lead = this.leadData();
    return enquiry?.total_enquiry_count ?? lead?.total_lead_count ?? 0;
  });

  readonly enquirySourceTotal = computed(() => {
    const sources = this.enquiryData()?.source;
    if (!sources?.length) return { newCount: 0, followupCount: 0 };
    return {
      newCount: sources.reduce((sum: number, item: SourceData) => sum + (item.enquiry_count || 0), 0),
      followupCount: sources.reduce((sum: number, item: SourceData) => sum + (item.followup_count || 0), 0)
    };
  });

  readonly leadSourceTotal = computed(() => {
    const sources = this.leadData()?.source;
    if (!sources?.length) return { newCount: 0, followupCount: 0 };
    return {
      newCount: sources.reduce((sum: number, item: SourceData) => sum + (item.lead_count || 0), 0),
      followupCount: sources.reduce((sum: number, item: SourceData) => sum + (item.followup_count || 0), 0)
    };
  });

  readonly enquiryLeadLevelTotal = computed(() => {
    const levels = this.enquiryData()?.lead_level;
    if (!levels?.length) return 0;
    return levels.reduce((sum: number, item: any) => sum + (item.level_count || item.lead_level_count || 0), 0);
  });

  readonly leadLeadLevelTotal = computed(() => {
    const levels = this.leadData()?.lead_level;
    if (!levels?.length) return 0;
    return levels.reduce((sum: number, item: any) => sum + (item.level_count || item.lead_level_count || 0), 0);
  });
  readonly enquiryPendingCount = computed(() => {
    return this.enquiryData()?.unassigned_count ?? 0;
  });
  readonly leadPendingCount = computed(() => {
    return this.leadData()?.unassigned_count ?? 0;
  });

  readonly teamReportTotals = computed(() => {
    const data = this.teamReportData();
    if (!data?.length) return {};
    const keys = Object.keys(data[0]);
    const totals: Record<string, number> = {};
    keys.forEach(key => {
      if (key.toLowerCase().includes('count')) {
        totals[key] = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
      }
    });
    return totals;
  });

  readonly enquiryTeamCountTotals = computed(() => {
    const data = this.enquiryTeamCountData();
    if (!data?.length) return {};
    const keys = Object.keys(data[0]);
    const totals: Record<string, number> = {};
    keys.forEach(key => {
      if (key.toLowerCase().includes('count')) {
        totals[key] = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
      }
    });
    return totals;
  });

  constructor() {
    // Auto-patch and disable count_type_id based on roleId
    const countTypeControl = this.leadForm.get('count_type_id');
    if (countTypeControl) {
      if (this.roleId === 7) {
        // Sales Executive - set to 2
        countTypeControl.patchValue(2, { emitEvent: false });
        countTypeControl.disable({ emitEvent: false });
        this.countTypeIdSignal.set(2);
      } else if (this.roleId === 13) {
        // Telecaller - set to 1
        countTypeControl.patchValue(1, { emitEvent: false });
        countTypeControl.disable({ emitEvent: false });
        this.countTypeIdSignal.set(1);
      }
    }

    // Initialize signal with current value
    const currentCountTypeId = countTypeControl?.value ?? null;
    if (currentCountTypeId !== null) {
      this.countTypeIdSignal.set(currentCountTypeId);
    }

    // Listen to count_type_id changes (including when enabled)
    this.leadForm.get('count_type_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.countTypeIdSignal.set(value ?? null);
      });

    this.initRoleBasedFormEffect();
    this.initChartRenderEffect();
    this.initCleanup();
  }

  /* ============================================================================
   * Role-based form restriction
   * ========================================================================== */
  private initRoleBasedFormEffect(): void {
    effect(() => {
      // Auto-patch and disable count_type_id based on roleId
      const countTypeControl = this.leadForm.get('count_type_id');
      if (countTypeControl && !countTypeControl.disabled) {
        if (this.roleId === 7) {
          // Sales Executive - set to 2
          countTypeControl.patchValue(2, { emitEvent: false });
          countTypeControl.disable({ emitEvent: false });
          this.countTypeIdSignal.set(2);
        } else if (this.roleId === 13) {
          // Telecaller - set to 1
          countTypeControl.patchValue(1, { emitEvent: false });
          countTypeControl.disable({ emitEvent: false });
          this.countTypeIdSignal.set(1);
        }
      }

      const countTypeId = this.countTypeId();

      if (!countTypeId) return;

      const roleConfig: Record<number, { control: string; countType: number }> = {
        13: { control: 'telecaller_id', countType: 1 }, // Telecaller
        7: { control: 'sales_executive_id', countType: 2 } // Sales Executive
      };

      const config = roleConfig[this.roleId as number];
      if (!config || config.countType !== countTypeId) return;

      this.patchAndDisableControl(config.control);
    });
  }

  private patchAndDisableControl(controlName: string): void {
    const control = this.leadForm.get(controlName);

    if (!control || control.disabled) return;

    control.patchValue([this.userId], { emitEvent: false });
    control.disable({ emitEvent: false });
  }

  /* ============================================================================
   * Chart rendering effect
   * ========================================================================== */
  private initChartRenderEffect(): void {
    effect(() => {
      if (this.loading()) return;

      const leadData = this.leadData();
      const enquiryData = this.enquiryData();

      if (leadData?.success) {
        this.renderLeadCharts();
        return;
      }

      if (enquiryData?.success) {
        this.renderEnquiryCharts();
      }
    });
  }

  private renderLeadCharts(): void {
    this.destroyEnquiryCharts();

    requestAnimationFrame(() => {
      this.renderLeadLevelChart();
      this.renderLeadSourceChart();
      this.renderTeamReportChart();
      this.renderEnquiryTeamCountChart();
    });
  }

  private renderEnquiryCharts(): void {
    this.destroyLeadCharts();

    requestAnimationFrame(() => {
      this.renderEnquiryLeadLevelChart();
      this.renderEnquirySourceChart();
      this.renderEnquiryTeamCountChart();
    });
  }

  /* ============================================================================
   * Cleanup
   * ========================================================================== */
  private initCleanup(): void {
    this.destroyRef.onDestroy(() => {
      this.destroyLeadCharts();
      this.destroyEnquiryCharts();
    });
  }

  ngOnInit(): void {
    this.setDefaultDates();
    this.setupOptimizedFormListeners();
    this.fetchAllProjects();
  }

  private setDefaultDates(): void {
    const today = new Date();
    this.leadForm.patchValue({
      start_date: today,
      end_date: today
    }, { emitEvent: false });
  }

  /**
   * Optimized form listeners with debouncing and distinctUntilChanged
   * Uses switchMap to cancel previous requests
   */
  private setupOptimizedFormListeners(): void {
    this.leadForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) =>
          prev.project_id === curr.project_id &&
          prev.count_type_id === curr.count_type_id
        ),
        switchMap(() => {
          const projectId = this.leadForm.get('project_id')?.value;
          const countTypeId = this.leadForm.get('count_type_id')?.value;

          if (!projectId || !countTypeId) {
            this.clearDropdowns();
            return EMPTY;
          }

          const projectIdNum = Number(projectId);
          const countTypeIdNum = Number(countTypeId);

          if (countTypeIdNum === 1) {
            this.leadForm.patchValue({ sales_executive_id: [] }, { emitEvent: false });
            this.allSalesExecutive.set([]);
            return this.fetchTelecallersWithCache(projectIdNum).pipe(
              map((res) => {
                const telecallers: Telecaller[] = res.map((item) => ({
                  ...item,
                  full_name: `${item.first_name} ${item.last_name}`,
                }));
                this.allTelecallerlist.set(telecallers);
                return null;
              })
            );
          } else if (countTypeIdNum === 2) {
            this.leadForm.patchValue({ telecaller_id: [] }, { emitEvent: false });
            this.allTelecallerlist.set([]);
            return this.fetchSalesExecutivesWithCache(projectIdNum).pipe(
              map((res) => {
                this.allSalesExecutive.set(res);
                return null;
              })
            );
          }

          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private clearDropdowns(): void {
    this.allTelecallerlist.set([]);
    this.allSalesExecutive.set([]);
    this.leadForm.patchValue({
      telecaller_id: [],
      sales_executive_id: []
    }, { emitEvent: false });
  }

  /**
   * Fetch projects with optimized error handling and caching using CommonService
   */
  private fetchAllProjects(): void {
    const userId = this.roleId === 2 ? null : this.userId;

    this.commonService.fetchUserProjectDropdown(userId)
      .pipe(
        retry({ count: 2, delay: 1000 }),
        catchError((err) => {
          console.error('Error fetching projects:', err);
          this.error.set('Unable to fetch projects.');
          this.snackBar.open('Unable to fetch projects.', 'Close', { duration: 3000 });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.length) {
            this.projectsList.set(res);
            this.error.set(null);
          }
        }
      });
  }

  /**
   * Fetch telecallers with caching and optimized error handling using CommonService
   */
  private fetchTelecallersWithCache(projectId: number) {
    if (!projectId) {
      this.allTelecallerlist.set([]);
      return of([]);
    }

    return this.commonService
      .fetchTelecallerDropdown([projectId])
      .pipe(
        retry({ count: 2, delay: 500 }),
        catchError((err) => {
          console.error('Error fetching telecallers:', err);
          this.snackBar.open('Unable to fetch telecallers.', 'Close', { duration: 3000 });
          this.allTelecallerlist.set([]);
          return of([]);
        }),
        shareReplay(1)
      );
  }

  /**
   * Fetch sales executives with caching and optimized error handling
   */
  private fetchSalesExecutivesWithCache(projectId: number) {
    if (!projectId) {
      this.allSalesExecutive.set([]);
      return of([]);
    }

    return this.commonService.fetchSalesExecutives(projectId)
      .pipe(
        retry({ count: 2, delay: 500 }),
        catchError((err) => {
          console.error('Error fetching sales executives:', err);
          this.snackBar.open('Unable to fetch sales executives.', 'Close', { duration: 3000 });
          this.allSalesExecutive.set([]);
          return of([]);
        }),
        shareReplay(1)
      );
  }

  /**
   * Fetch count data with optimized error handling and validation
   */
  fetchTalecallerSalesexecutiveCount(): void {
    const countTypeId = Number(this.countTypeId());
    const projectId = Number(this.projectId());
    const startDate = this.leadForm.get('start_date')?.value ?? null;
    const endDate = this.leadForm.get('end_date')?.value ?? null;

    if (!countTypeId || !projectId || !startDate || !endDate) {
      this.snackBar.open('Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const payload = this.buildPayload(countTypeId, projectId, startDate, endDate);

    if (countTypeId === 1) {
      const leadCount$ = this.http.post<LeadResponse>(`${this.baseUrl}/fetch_daily_lead_count`, payload);
      const teamReport$ = this.http.post<any>(`${this.baseUrl}/fetch_daily_team_report`, payload);
      const enquiryTeamCount$ = this.http.post<any>(`${this.baseUrl}/fetch_daily_enquiry_team_count`, payload);

      forkJoin({
        leadData: leadCount$,
        teamReport: teamReport$,
        enquiryTeamCount: enquiryTeamCount$
      }).pipe(
        retry({ count: 2, delay: 1000 }),
        catchError((error) => {
          console.error('Error fetching Telecaller data:', error);
          this.error.set('Unable to fetch common report data.');
          this.snackBar.open('Unable to fetch data.', 'Close', { duration: 3000 });
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (res) => {
          if (res) {
            this.leadData.set(res.leadData);
            this.teamReportData.set(res.teamReport?.data || res.teamReport || []);
            this.enquiryTeamCountData.set(res.enquiryTeamCount?.data || res.enquiryTeamCount || []);
            this.enquiryData.set(null);
            this.error.set(null);
          }
        }
      });
    } else {
      const enquirySummary$ = this.http.post<EnquiryResponse>(`${this.baseUrl}/fetch_daily_enquiry_count`, payload);
      const enquiryTeamCount$ = this.http.post<any>(`${this.baseUrl}/fetch_daily_enquiry_team_count`, payload);

      forkJoin({
        enquiryData: enquirySummary$,
        enquiryTeamCount: enquiryTeamCount$
      }).pipe(
        retry({ count: 2, delay: 1000 }),
        catchError((error) => {
          console.error('Error fetching Enquiry data:', error);
          this.error.set('Unable to fetch enquiry data.');
          this.snackBar.open('Unable to fetch data.', 'Close', { duration: 3000 });
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: (res) => {
          if (res) {
            this.enquiryData.set(res.enquiryData);
            this.enquiryTeamCountData.set(res.enquiryTeamCount?.data || res.enquiryTeamCount || []);
            this.leadData.set(null);
            this.teamReportData.set([]);
            this.error.set(null);
          } else {
            this.snackBar.open('No data found for the selected filters.', 'Close', { duration: 3000 });
            this.leadData.set(null);
            this.enquiryData.set(null);
            this.teamReportData.set([]);
            this.enquiryTeamCountData.set([]);
          }
        }
      });
    }
  }

  /**
   * Reusable chart rendering method
   */
  private renderChart(
    canvas: ElementRef<HTMLCanvasElement> | null,
    canvasId: string,
    labels: string[],
    data: number[],
    label: string,
    type: any = 'line',
    colorIndex: number = 0
  ): Chart | null {
    const canvasElement = canvas?.nativeElement || (document.getElementById(canvasId) as HTMLCanvasElement);
    if (!canvasElement) return null;

    const ctx = canvasElement.getContext('2d');
    if (!ctx) return null;

    if (data.length === 0) return null;

    let chartData: any = { labels, datasets: [] };
    let chartOptions: any;

    if (type === 'doughnut' || type === 'pie') {
      chartOptions = CHART_OPTIONS_DOUGHNUT;
      chartData.datasets = [{
        label,
        data,
        backgroundColor: CHART_COLORS,
        borderWidth: 0,
        hoverOffset: 4
      }];
    } else {
      chartOptions = CHART_OPTIONS_SCALED;

      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      const baseColor = CHART_COLORS[colorIndex % CHART_COLORS.length];
      gradient.addColorStop(0, `${baseColor}40`);
      gradient.addColorStop(1, `${baseColor}00`);

      chartData.datasets = [{
        label,
        data,
        backgroundColor: type === 'bar' ? baseColor : gradient,
        borderColor: baseColor,
        borderWidth: 2,
        borderRadius: type === 'bar' ? 4 : 0,
        fill: type === 'line',
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: baseColor,
        pointBorderWidth: 2,
        pointRadius: type === 'line' ? 4 : 0,
      }];
    }

    return new Chart(ctx, { type, data: chartData, options: chartOptions });
  }

  /**
   * Render lead level doughnut chart
   */
  private renderLeadLevelChart(): void {
    this.destroyLeadLevelChart();
    const leadData = this.leadData();
    if (!leadData?.lead_level?.length) return;

    const labels = leadData.lead_level.map(item => item.lead_level || 'Unknown');
    const data = leadData.lead_level.map(item => item.lead_level_count || 0);

    this.leadLevelChart = this.renderChart(
      this.leadLevelChartCanvas,
      'leadLevelChartCanvas',
      labels,
      data,
      'Lead Level Count',
      'doughnut'
    );
  }

  /**
   * Render enquiry lead level doughnut chart
   */
  private renderEnquiryLeadLevelChart(): void {
    this.destroyEnquiryLeadLevelChart();
    const enquiryData = this.enquiryData();
    if (!enquiryData?.lead_level?.length) return;

    const labels = enquiryData.lead_level.map(item => item.lead_level || 'Unknown');
    const data = enquiryData.lead_level.map(item => item.lead_level_count || 0);

    this.enquiryLeadLevelChart = this.renderChart(
      this.enquiryLeadLevelChartCanvas,
      'enquiryLeadLevelChartCanvas',
      labels,
      data,
      'Lead Level Count',
      'doughnut'
    );
  }

  /**
   * Render lead source doughnut chart
   */
  private renderLeadSourceChart(): void {
    this.destroyLeadSourceChart();
    const leadData = this.leadData();
    if (!leadData?.source?.length) return;

    const labels = leadData.source.map(item => item.source || 'Unknown');
    const data = leadData.source.map(item => item.lead_count || 0);

    this.leadSourceChart = this.renderChart(
      this.leadSourceChartCanvas,
      'leadSourceChartCanvas',
      labels,
      data,
      'Lead Source Count',
      'bar',
      1 // Cyan
    );
  }

  /**
   * Render enquiry source doughnut chart
   */
  private renderEnquirySourceChart(): void {
    this.destroyEnquirySourceChart();
    const enquiryData = this.enquiryData();
    if (!enquiryData?.source?.length) return;

    const labels = enquiryData.source.map(item => item.source || 'Unknown');
    const data = enquiryData.source.map(item => item.enquiry_count || 0);

    this.enquirySourceChart = this.renderChart(
      this.enquirySourceChartCanvas,
      'enquirySourceChartCanvas',
      labels,
      data,
      'Enquiry Source Count',
      'bar',
      1 // Cyan
    );
  }

  /**
   * Render team report chart
   */
  private renderTeamReportChart(): void {
    this.destroyTeamReportChart();
    const data = this.teamReportData();
    if (!data?.length) return;

    const keys = Object.keys(data[0]);
    const nameKey = keys.find(k => k.toLowerCase().includes('name')) || keys[0];
    const countKey = keys.find(k => k.toLowerCase().includes('lead_count')) ||
      keys.find(k => k.toLowerCase().includes('count')) ||
      keys[1];

    const labels = data.map(item => item[nameKey] || 'Unknown');
    const leadCounts = data.map(item => Number(item[countKey]) || 0);

    this.teamReportChart = this.renderChart(
      this.teamReportChartCanvas,
      'teamReportChartCanvas',
      labels,
      leadCounts,
      (countKey.replace('_', ' ') || 'Lead Count'),
      'bar',
      2 // Emerald
    );
  }

  /**
   * Render enquiry team count chart
   */
  private renderEnquiryTeamCountChart(): void {
    this.destroyEnquiryTeamCountChart();
    const data = this.enquiryTeamCountData();
    if (!data?.length) return;

    const keys = Object.keys(data[0]);
    const nameKey = keys.find(k => k.toLowerCase().includes('name')) || keys[0];
    const countKey = keys.find(k => k.toLowerCase().includes('enquiry_count')) ||
      keys.find(k => k.toLowerCase().includes('count')) ||
      keys[1];

    const labels = data.map(item => item[nameKey] || 'Unknown');
    const enquiryCounts = data.map(item => Number(item[countKey]) || 0);

    this.enquiryTeamCountChart = this.renderChart(
      this.enquiryTeamCountChartCanvas,
      'enquiryTeamCountChartCanvas',
      labels,
      enquiryCounts,
      (countKey.replace('_', ' ') || 'Enquiry Count'),
      'bar',
      3 // Blue
    );
  }

  /**
   * Chart destruction methods
   */
  private destroyLeadLevelChart(): void {
    if (this.leadLevelChart) {
      this.leadLevelChart.destroy();
      this.leadLevelChart = null;
    }
  }

  private destroyEnquiryLeadLevelChart(): void {
    if (this.enquiryLeadLevelChart) {
      this.enquiryLeadLevelChart.destroy();
      this.enquiryLeadLevelChart = null;
    }
  }

  private destroyLeadSourceChart(): void {
    if (this.leadSourceChart) {
      this.leadSourceChart.destroy();
      this.leadSourceChart = null;
    }
  }

  private destroyEnquirySourceChart(): void {
    if (this.enquirySourceChart) {
      this.enquirySourceChart.destroy();
      this.enquirySourceChart = null;
    }
  }

  private destroyTeamReportChart(): void {
    if (this.teamReportChart) {
      this.teamReportChart.destroy();
      this.teamReportChart = null;
    }
  }

  private destroyEnquiryTeamCountChart(): void {
    if (this.enquiryTeamCountChart) {
      this.enquiryTeamCountChart.destroy();
      this.enquiryTeamCountChart = null;
    }
  }

  private destroyLeadCharts(): void {
    this.destroyLeadLevelChart();
    this.destroyLeadSourceChart();
    this.destroyTeamReportChart();
    this.destroyEnquiryTeamCountChart();
  }

  private destroyEnquiryCharts(): void {
    this.destroyEnquiryLeadLevelChart();
    this.destroyEnquirySourceChart();
  }

  /**
   * Build payload with optimized date formatting
   */
  private buildPayload(
    countTypeId: number,
    projectId: number,
    startDate: Date | null,
    endDate: Date | null
  ): Record<string, any> {
    const payload: Record<string, any> = { project_id: projectId };
    const today = new Date();

    const formatDate = (date: Date | null, format: string) =>
      this.datePipe.transform(date || today, format) ||
      this.datePipe.transform(today, format)!;

    if (countTypeId === 1) {
      const telecallerIds = this.leadForm.get('telecaller_id')?.value;
      if (Array.isArray(telecallerIds) && telecallerIds.length > 0) {
        payload['telecaller_id'] = telecallerIds;
      }
      payload['start_date'] = formatDate(startDate, 'yyyy-MM-dd 00:00:00');
      payload['end_date'] = formatDate(endDate, 'yyyy-MM-dd 23:59:59');
    } else if (countTypeId === 2) {
      const salesExecutiveIds = this.leadForm.get('sales_executive_id')?.value;
      if (Array.isArray(salesExecutiveIds) && salesExecutiveIds.length > 0) {
        payload['sales_executive_id'] = salesExecutiveIds;
      }
      payload['start_date'] = formatDate(startDate, 'yyyy-MM-dd');
      payload['end_date'] = formatDate(endDate, 'yyyy-MM-dd');
    }

    return payload;
  }

  /**
   * TrackBy functions for optimized *ngFor rendering
   */
  trackByProjectId(_index: number, item: Project): number {
    return item.project_id;
  }

  trackByUserId(_index: number, item: Telecaller | SalesExecutive): number {
    return item.user_id;
  }

  trackBySource(_index: number, item: SourceData): string {
    return item.source;
  }

  trackByLeadLevel(_index: number, item: LeadLevel): string {
    return item.lead_level;
  }
}
