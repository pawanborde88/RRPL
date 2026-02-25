import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  TrackByFunction,
  inject,
  computed,
  effect,
  DestroyRef,
  signal,
  untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { TemplateComponent } from '../template/template.component';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions, AgChartTheme } from 'ag-charts-community';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PriceFormatPipe } from '../../Pipes/price-format.pipe';
import { PriceShortPipe } from '../../Pipes/price-short.pipe';
import { StatusColorPipe } from '../../Pipes/status-color.pipe';
import { GreetingPipe } from '../../Pipes/greeting.pipe';
import { AutocompleteReusableComponent } from '../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { AngularMaterialModule } from '../../../angular-material.module';
import { DashboardFacade } from './facade/dashboard.facade';
import { DashboardStore } from './store/dashboard.store';
import { CostomLoadingComponent } from '../Reusable/coustom Loader/costom-loading/costom-loading.component';

interface HeaderMetric {
  id: string;
  title: string;
  description: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  baseline: string;
  icon: string;
}

interface ProjectSummary {
  project_count: number;
  floor_unit_count: number;
  booking_count: number;
  total_value?: number;
  enquiry_count?: number;
  unit_count: any[];
  booking_statuses: any[];
}

/**
 * Main Dashboard Component - Production-Grade Angular 17+ Implementation
 * 
 * Features:
 * - Signal-based reactive state management via Store/Facade pattern
 * - OnPush change detection for optimal performance
 * - Optimized RxJS with toSignal/takeUntilDestroyed
 * - Clean dependency injection with inject()
 * - Separated concerns (Store, Facade, Service)
 * - Memory-efficient cleanup with DestroyRef
 * - Type-safe computed signals
 */
@Component({
  selector: 'app-main-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TemplateComponent,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    PriceFormatPipe,
    PriceShortPipe,
    GreetingPipe,
    AutocompleteReusableComponent,
    DatePipe,
    CostomLoadingComponent,
    AgCharts
  ],
  providers: [DashboardStore, DashboardFacade],
  templateUrl: './main-dashboard-page.component.html',
  styleUrl: './main-dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideInOut', [
      state('in', style({ height: '*', opacity: 1, transform: 'translateY(0)' })),
      state('out', style({ height: '0px', opacity: 0, transform: 'translateY(-20px)' })),
      transition('out => in', [animate('200ms ease-out')]),
      transition('in => out', [animate('150ms ease-in')]),
    ]),
  ]
})
export class MainDashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  // ============================================
  // DEPENDENCY INJECTION
  // ============================================
  private readonly facade = inject(DashboardFacade);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================
  // STATE - Exposed from Facade
  // ============================================
  readonly loading = this.facade.loading;
  readonly currentDate = this.facade.currentDate;
  readonly userFullName = this.facade.userFullName;
  readonly selectedProjectId = this.facade.selectedProjectId;
  readonly projects = this.facade.projects;
  readonly telecallers = this.facade.telecallers;
  readonly salesExecutives = this.facade.salesExecutives;
  readonly salesReportsData = this.facade.salesReportsData;
  readonly enquiryFlowData = this.facade.enquiryFlowData;
  readonly allProjectSummaryData = this.facade.allProjectSummaryData;

  // Expected by template
  readonly startDate = signal<Date | null>(this.facade.startDate());
  readonly endDate = signal<Date | null>(this.facade.endDate());
  readonly salesMetrics = this.facade.salesHeaderMetrics;
  readonly siteVisitMetrics = this.facade.headerMetrics;
  readonly digitalCampaigns = this.facade.digitalCampaigns;

  // ============================================
  // FORM STATE
  // ============================================
  readonly filterForm = new FormGroup({
    project_id: new FormControl<number[]>([]),
    telecaller_id: new FormControl<number[]>([]),
    sales_executive_id: new FormControl<number[]>([]),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null)
  });

  // ============================================
  // AG CHART OPTIONS
  // ============================================
  readonly enquiryAnalysisOptions = signal<AgChartOptions | undefined>(undefined);
  readonly unitDistributionOptions = signal<AgChartOptions | undefined>(undefined);
  readonly presaleSourceOptions = signal<AgChartOptions | undefined>(undefined);
  readonly salesSourceOptions = signal<AgChartOptions | undefined>(undefined);
  readonly presaleLeadLevelOptions = signal<AgChartOptions | undefined>(undefined);
  readonly salesLeadLevelOptions = signal<AgChartOptions | undefined>(undefined);
  readonly bookingStatusOptions = signal<AgChartOptions | undefined>(undefined);
  readonly industryOptions = signal<AgChartOptions | undefined>(undefined);
  readonly ageRangeOptions = signal<AgChartOptions | undefined>(undefined);
  readonly bookingPlanOptions = signal<AgChartOptions | undefined>(undefined);
  readonly buyingPurposeOptions = signal<AgChartOptions | undefined>(undefined);
  readonly nativePlaceOptions = signal<AgChartOptions | undefined>(undefined);
  readonly possessionRequiredOptions = signal<AgChartOptions | undefined>(undefined);
  readonly preferredLocationOptions = signal<AgChartOptions | undefined>(undefined);
  readonly campaignPerformanceOptions = signal<AgChartOptions | undefined>(undefined);

  // ============================================
  // UI STATE
  // ============================================
  readonly statusPeriod = signal<string>('Last year');
  readonly revenuePeriod = signal<string>('Last year');

  // No longer using Canvas refs for AG Charts

  // ============================================
  // COMPUTED PROPERTIES
  // ============================================
  readonly greetingName = computed(() => {
    const name = this.userFullName();
    if (!name) return 'Team';
    const [first] = name.split(' ');
    return first || 'Team';
  });

  readonly greetingText = computed(() => {
    const hour = this.currentDate().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  });

  readonly headerMetrics = computed(() => this.buildHeaderMetrics());

  readonly propertiesManaged = computed(() => {
    const summaryData = this.allProjectSummaryData() as ProjectSummary | null;
    return summaryData?.floor_unit_count || summaryData?.project_count || 0;
  });

  readonly assetValue = computed(() => {
    const summaryData = this.allProjectSummaryData() as ProjectSummary | null;
    return summaryData?.total_value || 0;
  });

  readonly propertiesSold = computed(() => {
    const summaryData = this.allProjectSummaryData() as ProjectSummary | null;
    return summaryData?.booking_count || 0;
  });

  readonly newClients = computed(() => {
    const enquiryData = this.enquiryFlowData();
    return enquiryData?.enquiries || 0;
  });

  readonly totalEnquiries = computed(() => {
    const flow = this.enquiryFlowData();
    return flow ? flow.enquiries : 0;
  });

  readonly statusChartLegend = computed(() => {
    const flow = this.enquiryFlowData();
    if (!flow) return [];
    return [
      { label: 'Enquiries', value: flow.enquiries, color: '#3b82f6' },
      { label: 'Tokens', value: flow.tokens, color: '#8b5cf6' },
      { label: 'Bookings', value: flow.bookings, color: '#10b981' },
      { label: 'Agreements', value: flow.booking_agreements, color: '#f59e0b' },
      { label: 'Disbursement', value: flow.disbursements, color: '#ec4899' }
    ];
  });

  readonly totalPresaleLeads = computed(() =>
    this.facade.leadLevels().reduce((acc, curr) => acc + curr.lead_level_count, 0)
  );

  readonly presaleLeadLevelLegend = computed(() => {
    const levels = this.facade.leadLevels();
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return levels.map((l, i) => ({ label: l.lead_level, value: l.lead_level_count, color: colors[i % colors.length] }));
  });

  readonly totalSalesLeads = computed(() =>
    this.facade.salesLeadLevels().reduce((acc, curr) => acc + curr.lead_level_count, 0)
  );

  readonly salesLeadLevelLegend = computed(() => {
    const levels = this.facade.salesLeadLevels();
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return levels.map((l, i) => ({ label: l.lead_level, value: l.lead_level_count, color: colors[i % colors.length] }));
  });

  readonly polarAreaChartLegend = computed(() => {
    const sources = this.facade.sourceData();
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return sources.slice(0, 5).map((s, i) => ({
      label: s.source,
      value: s.presale_leads + s.sales_enquiries,
      color: colors[i % colors.length]
    }));
  });

  // ============================================
  // TRACK BY FUNCTIONS
  // ============================================
  readonly trackByMetricId: TrackByFunction<HeaderMetric> = (_, metric) => metric.id;

  // ============================================
  // ENTERPRISE CHART THEME
  // ============================================
  private readonly ENTERPRISE_THEME: any = {
    baseTheme: 'ag-default',
    palette: {
      fills: [
        '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9',
        '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
        '#4f46e5', '#059669', '#d97706', '#db2777', '#0284c7'
      ],
      strokes: ['#ffffff']
    },
    overrides: {
      common: {
        background: { fill: 'transparent' },
        padding: { top: 20, right: 30, bottom: 20, left: 30 },
        legend: {
          spacing: 24,
          item: {
            label: { fontSize: 13, fontWeight: '700', color: '#475569' },
            marker: { size: 10, strokeWidth: 2, stroke: '#fff' }
          }
        },
        tooltip: { delay: 0, range: 'nearest' }
      },
      bar: {
        series: {
          strokeWidth: 0,
          cornerRadius: 8,
          label: { enabled: false },
          highlightStyle: { item: { fillOpacity: 0.85 } }
        },
        axes: {
          category: {
            line: { width: 1, color: '#e2e8f0' },
            tick: { width: 1, color: '#cbd5e1' },
            gridLine: { enabled: false },
            label: { fontSize: 11, fontWeight: '600', color: '#64748b', padding: 8, avoidCollisions: true }
          },
          number: {
            gridLine: { style: [{ stroke: '#f1f5f9', lineDash: [6, 4] }] },
            line: { width: 0 },
            tick: { width: 0 },
            label: { fontSize: 11, fontWeight: '600', color: '#94a3b8' }
          }
        }
      },
      line: {
        series: {
          strokeWidth: 2.5,
          marker: { size: 5, strokeWidth: 2, stroke: '#fff' },
          highlightStyle: { item: { fillOpacity: 0.9, strokeWidth: 2 } }
        }
      },
      donut: {
        series: {
          strokeWidth: 0,
          calloutLabel: { enabled: false },
          sectorLabel: { enabled: false }
        }
      },
      pie: {
        series: {
          strokeWidth: 0,
          calloutLabel: { enabled: false },
          sectorLabel: { enabled: false }
        }
      }
    }
  };

  // ============================================
  // PRIVATE STATE
  // ============================================
  private timeUpdateIntervalId: ReturnType<typeof setInterval> | null = null;

  // ============================================
  // MEMOIZED CLASS GETTERS
  // ============================================
  private readonly metricClassesCache = new Map<string, string>();

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormSubscriptions();
  }

  ngAfterViewInit(): void {
    // AG Charts initialize themselves via [options]
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  private initializeComponent(): void {
    this.facade.initializeUser();

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.filterForm.patchValue({
      start_date: thirtyDaysAgo,
      end_date: today
    });

    // Load projects
    this.facade.loadProjects();

    // Setup time update interval
    this.timeUpdateIntervalId = setInterval(() => {
      this.facade.updateCurrentDate();
    }, 60000);

    // Auto-select first project after projects load
    setTimeout(() => {
      const projects = this.projects();
      if (projects.length > 0 && !this.selectedProjectId()) {
        const firstProjectId = projects[0].project_id;
        this.filterForm.patchValue({ project_id: [firstProjectId] });
      }
    }, 500);
  }

  private setupFormSubscriptions(): void {
    // Project selection change
    this.filterForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectIds) => {
        this.onProjectChange(projectIds || null);
        if (projectIds && projectIds.length > 0) {
          this.facade.loadTelecallers(projectIds);
          this.facade.loadSalesExecutives(projectIds);
        } else {
          this.filterForm.patchValue({
            telecaller_id: [],
            sales_executive_id: []
          }, { emitEvent: false });
        }
      });

    // Date range changes
    this.filterForm.get('start_date')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onDateRangeChange());

    this.filterForm.get('end_date')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onDateRangeChange());
  }

  private readonly chartsEffect = effect(() => {
    const salesData = this.salesReportsData();
    const enquiryData = this.enquiryFlowData();
    const summaryData = this.allProjectSummaryData();

    // Only update if we have data
    if (salesData || enquiryData || summaryData) {
      untracked(() => {
        this.updateAgChartOptions();
      });
    }
  });

  // ============================================
  // EVENT HANDLERS
  // ============================================
  onProjectChange(projectIds: number[] | null): void {
    const pIds = projectIds || [];

    // Update store
    this.facade.setSelectedProject(pIds);

    // Sync form state if called from component-defined event (like selectedIdChange)
    if (this.filterForm.get('project_id')?.value !== pIds) {
      this.filterForm.patchValue({ project_id: pIds }, { emitEvent: false });
    }

    const startDate = this.filterForm.get('start_date')?.value;
    const endDate = this.filterForm.get('end_date')?.value;

    if (pIds.length > 0 && startDate && endDate) {
      this.fetchDashboardData();
    }
  }

  onDateRangeChange(): void {
    const projectIds = this.filterForm.get('project_id')?.value;
    const startDate = this.filterForm.get('start_date')?.value;
    const endDate = this.filterForm.get('end_date')?.value;

    // Sync signals and facade for other UI elements
    if (startDate) this.startDate.set(startDate);
    if (endDate) this.endDate.set(endDate);
    if (startDate && endDate) {
      this.facade.setDates(startDate, endDate);
    }

    if (projectIds && projectIds.length > 0 && startDate && endDate) {
      this.fetchDashboardData();
    }
  }

  fetchDashboardData(): void {
    const projectIdsValue = this.filterForm.get('project_id')?.value;
    const startDateValue = this.filterForm.get('start_date')?.value;
    const endDateValue = this.filterForm.get('end_date')?.value;

    let projectIds: number[] = Array.isArray(projectIdsValue) ? projectIdsValue : (projectIdsValue ? [projectIdsValue] : []);

    if (projectIds.length === 0 || !startDateValue || !endDateValue) {
      return;
    }

    const startDate = this.formatDate(startDateValue);
    const endDate = this.formatDate(endDateValue);
    const telecallerIds = this.filterForm.get('telecaller_id')?.value || [];
    const salesExecutiveIds = this.filterForm.get('sales_executive_id')?.value || [];

    if (startDate && endDate) {
      this.facade.fetchDashboardData({
        projectIds,
        startDate,
        endDate,
        telecallerIds: telecallerIds.length > 0 ? telecallerIds : undefined,
        salesExecutiveIds: salesExecutiveIds.length > 0 ? salesExecutiveIds : undefined
      });
    }
  }

  onStatusPeriodChange(period: string): void {
    this.statusPeriod.set(period);
    // this.fetchDashboardData(); // Don't refetch on period change if it's just a local UI filter, 
    // but if it's an API param, keep it. Assuming it's for display consistency now.
  }

  onRevenuePeriodChange(period: string): void {
    this.revenuePeriod.set(period);
    this.fetchDashboardData();
  }

  onExportDashboard(): void {
    console.info('Dashboard export triggered');
  }

  onHeaderMetricAction(metricId: string): void {
    console.info(`Header metric action triggered for ${metricId}`);
  }

  onDateChange(): void {
    const start = this.startDate();
    const end = this.endDate();
    if (start && end) {
      this.facade.setDates(start, end);
    }
  }

  getMetricTheme(icon: string): any {
    const themeMap: Record<string, any> = {
      'analytics': { bg: '#f5f3ff', text: '#6d28d9', icon: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.1)' },
      'apartment': { bg: '#eff6ff', text: '#1d4ed8', icon: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.1)' },
      'handshake': { bg: '#ecfdf5', text: '#047857', icon: '#10b981', shadow: 'rgba(16, 185, 129, 0.1)' },
      'pending_actions': { bg: '#fff7ed', text: '#c2410c', icon: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.1)' },
      'forum': { bg: '#f0f9ff', text: '#0369a1', icon: '#0ea5e9', shadow: 'rgba(14, 165, 233, 0.1)' },
      'task_alt': { bg: '#f0fdf4', text: '#15803d', icon: '#22c55e', shadow: 'rgba(34, 197, 94, 0.1)' },
      'payments': { bg: '#fdf4ff', text: '#a21caf', icon: '#d946ef', shadow: 'rgba(217, 70, 239, 0.1)' },
      'person_search': { bg: '#fef2f2', text: '#b91c1c', icon: '#ef4444', shadow: 'rgba(239, 68, 68, 0.1)' }
    };
    return themeMap[icon] || { bg: '#f8fafc', text: '#475569', icon: '#64748b', shadow: 'rgba(100, 116, 139, 0.1)' };
  }


  trackByCampaign(_: number, item: any): any {
    return item.integration_id || item.id;
  }

  // ============================================
  // CHART MANAGEMENT
  // ============================================
  private updateAgChartOptions(): void {
    const flowData = this.enquiryFlowData();
    const summaryData = this.allProjectSummaryData();
    const salesData = this.salesReportsData();
    const sourceData = this.facade.sourceData();
    const leadLevels = this.facade.leadLevels();
    const salesLeadLevels = this.facade.salesLeadLevels();
    const bookingStatuses = this.facade.bookingStatuses();

    // ─── 1. Enquiry Analysis (Donut) ────────────────────────────────────
    if (flowData) {
      this.enquiryAnalysisOptions.set({
        theme: this.ENTERPRISE_THEME,
        autoSize: true,
        data: [
          { label: 'Enquiries', value: flowData.enquiries },
          { label: 'Tokens', value: flowData.tokens },
          { label: 'Bookings', value: flowData.bookings },
          { label: 'Agreements', value: flowData.booking_agreements },
          { label: 'Disbursement', value: flowData.disbursements }
        ],
        series: [{
          type: 'donut',
          angleKey: 'value',
          legendItemKey: 'label',
          innerRadiusRatio: 0.65,
          strokeWidth: 2,
          stroke: '#fff',
          fills: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'],
          calloutLabelKey: 'label',
          calloutLabel: {
            enabled: true,
            fontSize: 12,
            fontWeight: '600',
            color: '#475569',
            minAngle: 0
          },
          calloutLine: {
            length: 15,
            strokeWidth: 2
          },
          innerLabels: [
            {
              text: this.totalEnquiries().toString(),
              fontSize: 28,
              fontWeight: '800',
              color: '#1e293b'
            },
            {
              text: 'TOTAL',
              fontSize: 10,
              fontWeight: '700',
              color: '#94a3b8',
              margin: 4
            }
          ],
          tooltip: {
            renderer: (params: any) => ({
              title: params.datum.label,
              content: `Count: <b>${params.datum.value}</b>`
            })
          }
        }] as any,
        background: { fill: 'transparent' },
        padding: { top: 40, right: 80, bottom: 40, left: 80 },
        legend: { enabled: false }
      } as any);
    }

    // ─── 2. Unit Distribution (Bar + Line Combo) ─────────────────────────
    const unitCount = summaryData?.unit_count || [];
    if (unitCount.length > 0) {
      this.unitDistributionOptions.set({
        theme: this.ENTERPRISE_THEME,
        autoSize: true,
        data: unitCount,
        series: [
          {
            type: 'area', xKey: 'unit_type', yKey: 'total_unit', yName: 'Capacity',
            fill: '#f1f5f9', fillOpacity: 0.5, stroke: '#e2e8f0', strokeWidth: 1,
            marker: { enabled: false },
            tooltip: { renderer: (p: any) => ({ title: 'Total Units', content: p.datum.total_unit }) }
          },
          {
            type: 'bar', xKey: 'unit_type', yKey: 'book_unit', yName: 'Booked',
            stacked: true, fill: '#6366f1', strokeWidth: 0, cornerRadius: 0,
            tooltip: { renderer: (p: any) => ({ title: 'Booked', content: p.datum.book_unit }) }
          },
          {
            type: 'bar', xKey: 'unit_type', yKey: 'available_unit', yName: 'Available',
            stacked: true, fill: '#10b981', strokeWidth: 0, cornerRadius: 7,
            tooltip: { renderer: (p: any) => ({ title: 'Available', content: p.datum.available_unit }) }
          },
          {
            type: 'line', xKey: 'unit_type', yKey: 'total_unit', yName: 'Trend',
            stroke: '#f59e0b', strokeWidth: 3,
            marker: { enabled: true, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2, size: 7 },
            tooltip: { renderer: (p: any) => ({ title: 'Total Trend', content: p.datum.total_unit }) }
          }
        ] as any,
        axes: [
          {
            type: 'category', position: 'bottom',
            label: { fontSize: 11, fontWeight: '600', color: '#94a3b8', padding: 6 },
            line: { width: 0 }, tick: { width: 0 }, gridLine: { enabled: false }
          },
          {
            type: 'number', position: 'left',
            title: { text: 'Units', fontSize: 10, fontWeight: '600', color: '#cbd5e1' },
            label: { fontSize: 10, color: '#cbd5e1' },
            gridLine: { style: [{ stroke: '#f1f5f9', lineDash: [4, 4] }] },
            line: { width: 0 }, tick: { width: 0 }
          }
        ] as any,
        background: { fill: 'transparent' },
        padding: { top: 12, right: 8, bottom: 8, left: 0 },
        legend: {
          position: 'bottom',
          spacing: 20,
          item: { label: { fontSize: 11, fontWeight: '600', color: '#64748b' } }
        }
      } as any);
    }

    // ─── 3. Presale Lead Levels (Horizontal Stage Bar) ──────────────────
    if (leadLevels.length > 0) {
      this.presaleLeadLevelOptions.set(
        this.createAttrChartOptions(
          leadLevels,
          'lead_level', 'lead_level_count', '#6366f1', true
        )
      );
    }

    // ─── 4. Sales Lead Levels (Horizontal Stage Bar) ────────────────────
    if (salesLeadLevels.length > 0) {
      this.salesLeadLevelOptions.set(
        this.createAttrChartOptions(
          salesLeadLevels,
          'lead_level', 'lead_level_count', '#10b981', true
        )
      );
    }

    // ─── 5. Presale & Sales Sources (Bar + Line) ─────────────────────────
    if (sourceData.length > 0) {
      const presaleSorted = [...sourceData]
        .filter(s => s.presale_leads > 0)
        .sort((a, b) => b.presale_leads - a.presale_leads);

      this.presaleSourceOptions.set({
        theme: this.ENTERPRISE_THEME,
        autoSize: true,
        data: presaleSorted,
        series: [
          { type: 'bar', xKey: 'source', yKey: 'presale_leads', yName: 'Leads', stacked: true, fill: '#6366f1', strokeWidth: 0, cornerRadius: 0 },
          { type: 'bar', xKey: 'source', yKey: 'presale_followups', yName: 'Follow-ups', stacked: true, fill: '#10b981', strokeWidth: 0, cornerRadius: 8 }
        ] as any,
        axes: [
          {
            type: 'category', position: 'bottom',
            label: { fontSize: 10, fontWeight: '600', color: '#64748b', avoidCollisions: true, rotation: presaleSorted.length > 5 ? 45 : 0 },
            line: { width: 1, color: '#e2e8f0' }, tick: { width: 0 }, gridLine: { enabled: false }
          },
          {
            type: 'number', position: 'left',
            label: { fontSize: 10, color: '#94a3b8' },
            gridLine: { style: [{ stroke: '#f1f5f9', lineDash: [6, 4] }] },
            line: { width: 0 }, tick: { width: 0 }
          }
        ] as any,
        background: { fill: 'transparent' },
        padding: { top: 10, right: 30, bottom: 2, left: 10 },
        legend: {
          position: 'top',
          spacing: 20,
          item: { label: { fontSize: 13, fontWeight: '600', color: '#64748b' } }
        }
      } as any);

      const salesSorted = [...sourceData]
        .filter(s => s.sales_enquiries > 0)
        .sort((a, b) => b.sales_enquiries - a.sales_enquiries);

      this.salesSourceOptions.set({
        theme: this.ENTERPRISE_THEME,
        autoSize: true,
        data: salesSorted,
        series: [
          { type: 'bar', xKey: 'source', yKey: 'sales_enquiries', yName: 'Enquiries', fill: '#6366f1', strokeWidth: 0, cornerRadius: 8 },
          {
            type: 'line', xKey: 'source', yKey: 'sales_followups', yName: 'Follow-ups',
            stroke: '#10b981', strokeWidth: 3,
            marker: { enabled: true, fill: '#10b981', stroke: '#fff', strokeWidth: 2, size: 7 }
          }
        ] as any,
        axes: [
          {
            type: 'category', position: 'bottom',
            label: { fontSize: 10, fontWeight: '600', color: '#64748b', avoidCollisions: true, rotation: salesSorted.length > 5 ? 45 : 0 },
            line: { width: 1, color: '#e2e8f0' }, tick: { width: 0 }, gridLine: { enabled: false }
          },
          {
            type: 'number', position: 'left',
            title: { text: 'Count', fontSize: 11, color: '#94a3b8' },
            label: { fontSize: 10, color: '#94a3b8' },
            gridLine: { style: [{ stroke: '#f1f5f9', lineDash: [6, 4] }] },
            line: { width: 0 }, tick: { width: 0 }
          }
        ] as any,
        background: { fill: 'transparent' },
        padding: { top: 10, right: 30, bottom: 2, left: 10 },
        legend: {
          position: 'top',
          spacing: 20,
          item: { label: { fontSize: 13, fontWeight: '600', color: '#64748b' } }
        }
      } as any);
    }

    // ─── 6. Booking Status (Donut) ────────────────────────────────────────
    if (bookingStatuses.length > 0) {
      this.bookingStatusOptions.set({
        theme: this.ENTERPRISE_THEME,
        autoSize: true,
        data: bookingStatuses,
        series: [{
          type: 'donut',
          angleKey: 'unit_count',
          legendItemKey: 'booking_status',
          innerRadiusRatio: 0.65,
          strokeWidth: 3,
          stroke: '#fff',
          tooltip: {
            renderer: (p: any) => ({ title: p.datum.booking_status, content: `Units: <b>${p.datum.unit_count}</b>` })
          }
        }] as any,
        background: { fill: 'transparent' },
        padding: { top: 4, right: 4, bottom: 4, left: 4 },
        legend: {
          enabled: true,
          position: 'bottom',
          spacing: 12,
          item: { label: { fontSize: 10, fontWeight: '600', color: '#64748b' } }
        }
      } as any);
    }

    // ─── 7. Demographics ─────────────────────────────────────────────────
    if (salesData) {
      // Helper: filter zero-count, sort desc
      const allSorted = (arr: any[], countKey: string) =>
        (arr || [])
          .filter(i => (i[countKey] ?? 0) > 0)
          .sort((a, b) => (b[countKey] ?? 0) - (a[countKey] ?? 0));

      // Industry — horizontal bar (long labels)
      this.industryOptions.set(
        this.createAttrChartOptions(
          allSorted(salesData.industry, 'enquiry_count'),
          'industry', 'enquiry_count', '#f59e0b', true
        )
      );

      // Age Range — vertical bar (short labels)
      this.ageRangeOptions.set(
        this.createAttrChartOptions(
          allSorted(salesData.age_range, 'enquiry_count'),
          'age_range', 'enquiry_count', '#8b5cf6'
        )
      );

      // Booking Plan — horizontal bar (consistent with other intent metrics)
      this.bookingPlanOptions.set(
        this.createAttrChartOptions(
          salesData.booking_plan || [],
          'booking', 'enquiry_count', '#10b981', true
        )
      );

      // Buying Purpose — horizontal bar
      this.buyingPurposeOptions.set(
        this.createAttrChartOptions(
          salesData.buying_purpose || [],
          'buying_purpose', 'enquiry_count', '#ec4899', true
        )
      );

      // Native Place — horizontal bar (state names are long)
      this.nativePlaceOptions.set(
        this.createAttrChartOptions(
          allSorted(salesData.native_place, 'enquiry_count'),
          'native_place', 'enquiry_count', '#0ea5e9', true
        )
      );

      // Possession Required — vertical bar (short labels)
      this.possessionRequiredOptions.set(
        this.createAttrChartOptions(
          salesData.possession_required || [],
          'possession_req', 'enquiry_count', '#14b8a6'
        )
      );

      // Preferred Location — horizontal bar (location names are long)
      this.preferredLocationOptions.set(
        this.createAttrChartOptions(
          allSorted(salesData.preferred_location, 'enquiry_count'),
          'preferred_location', 'enquiry_count', '#6366f1', true
        )
      );
    }

    // ─── 8. Campaign Performance Chart (Grouped Bar) ─────────────────────
    const campaigns = this.digitalCampaigns();
    if (campaigns && campaigns.length > 0) {
      this.campaignPerformanceOptions.set({
        theme: this.ENTERPRISE_THEME,
        autoSize: true,
        data: campaigns,
        series: [
          { type: 'bar', xKey: 'integration_name', yKey: 'lead_count', yName: 'Leads', stacked: true, fill: '#6366f1', strokeWidth: 0, cornerRadius: 0 },
          { type: 'bar', xKey: 'integration_name', yKey: 'site_visit_count', yName: 'Site Visits', stacked: true, fill: '#f59e0b', strokeWidth: 0, cornerRadius: 0 },
          { type: 'bar', xKey: 'integration_name', yKey: 'booking_count', yName: 'Bookings', stacked: true, fill: '#10b981', strokeWidth: 0, cornerRadius: 10 }
        ] as any,
        axes: [
          {
            type: 'category', position: 'bottom',
            label: { fontSize: 10, fontWeight: '600', color: '#64748b', avoidCollisions: true, rotation: campaigns.length > 5 ? 45 : 0 },
            line: { width: 1, color: '#e2e8f0' }, tick: { width: 0 }, gridLine: { enabled: false }
          },
          {
            type: 'number', position: 'left',
            label: { fontSize: 10, color: '#94a3b8' },
            gridLine: { style: [{ stroke: '#f1f5f9', lineDash: [6, 4] }] },
            line: { width: 0 }, tick: { width: 0 }
          }
        ] as any,
        background: { fill: 'transparent' },
        padding: { top: 16, right: 30, bottom: 2, left: 10 },
        legend: {
          position: 'top',
          spacing: 20,
          item: { label: { fontSize: 13, fontWeight: '600', color: '#64748b' } }
        }
      } as any);
    }
  }

  // Creates bar chart options. Pass `horizontal=true` for long category labels (e.g. industry, location).
  private createAttrChartOptions(
    data: any[],
    xKey: string,
    yKey: string,
    color: string,
    horizontal = false
  ): AgChartOptions {
    const chartData = (data || []).filter(item => (item[yKey] ?? 0) > 0);

    const categoryAxis: any = {
      type: 'category',
      position: horizontal ? 'left' : 'bottom',
      label: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748b',
        ...(horizontal ? {} : { avoidCollisions: true })
      },
      line: { width: 0 },
      tick: { width: 0 },
      gridLine: { enabled: false }
    };

    const numberAxis: any = {
      type: 'number',
      position: horizontal ? 'bottom' : 'left',
      label: { fontSize: 9, color: '#cbd5e1' },
      gridLine: { style: [{ stroke: '#f1f5f9', lineDash: [4, 4] }] },
      line: { width: 0 },
      tick: { width: 0 }
    };

    return {
      theme: this.ENTERPRISE_THEME,
      autoSize: true,
      data: chartData,
      series: [{
        type: 'bar',
        direction: horizontal ? 'horizontal' : 'vertical',
        xKey: xKey,
        yKey: yKey,
        fill: color,
        strokeWidth: 0,
        cornerRadius: 6,
        tooltip: {
          renderer: (p: any) => ({
            title: String(p.datum[xKey]),
            content: `Count: <b>${p.datum[yKey]}</b>`
          })
        }
      }] as any,
      axes: [categoryAxis, numberAxis] as any,
      background: { fill: 'transparent' },
      padding: horizontal
        ? { top: 10, right: 20, bottom: 10, left: 10 }
        : { top: 10, right: 10, bottom: 10, left: 0 },
      legend: { enabled: false }
    } as any;
  }


  private formatDate(date: Date | null): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      default: return 'trending_flat';
    }
  }

  private formatCurrency(value: number): string {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
  }

  private buildHeaderMetrics(): HeaderMetric[] {
    const summary = this.allProjectSummaryData() as ProjectSummary | null;
    if (!summary) return [];

    return [
      {
        id: 'sales',
        title: 'Total Sales',
        description: 'Properties sold this month',
        value: this.formatCurrency(summary.total_value || 0),
        change: '+12.5%',
        trend: 'up',
        baseline: 'vs last month',
        icon: 'payments'
      },
      {
        id: 'units',
        title: 'Units Sold',
        description: 'Total units booked',
        value: (summary.booking_count || 0).toString(),
        change: '+5.2%',
        trend: 'up',
        baseline: 'vs last month',
        icon: 'apartment'
      },
      {
        id: 'enquiries',
        title: 'Active Enquiries',
        description: 'Leads in pipeline',
        value: (summary.enquiry_count || 0).toString(),
        change: '-2.4%',
        trend: 'down',
        baseline: 'vs last month',
        icon: 'forum'
      },
      {
        id: 'visits',
        title: 'Site Visits',
        description: 'Completed visits',
        value: '142',
        change: '+18.2%',
        trend: 'up',
        baseline: 'vs last month',
        icon: 'directions_car'
      }
    ];
  }

  private cleanup(): void {
    if (this.timeUpdateIntervalId) {
      clearInterval(this.timeUpdateIntervalId);
      this.timeUpdateIntervalId = null;
    }
  }
}