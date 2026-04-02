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
  untracked,
  ElementRef,
  ViewChildren,
  QueryList
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { TemplateComponent } from '../template/template.component';
import * as echarts from 'echarts';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { PriceFormatPipe } from '../../Pipes/price-format.pipe';
import { PriceShortPipe } from '../../Pipes/price-short.pipe';
import { GreetingPipe } from '../../Pipes/greeting.pipe';
import { AutocompleteReusableComponent } from '../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { AngularMaterialModule } from '../../../angular-material.module';
import { DashboardFacade } from './facade/dashboard.facade';
import { DashboardStore } from './store/dashboard.store';
import { CostomLoadingComponent } from '../Reusable/coustom Loader/costom-loading/costom-loading.component';

// ECharts components are imported automatically via * as echarts

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
  source_wise_booking: any[];
}

interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
}

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
    CostomLoadingComponent
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
  readonly enquiryFlowData = this.facade.enquiryFlowData;
  readonly allProjectSummaryData = this.facade.allProjectSummaryData;
  readonly presaleDashboardRaw = this.facade.presaleDashboardRaw;
  readonly salesReportsRaw = this.facade.salesReportsRaw;
  readonly digitalCampaigns = this.facade.digitalCampaigns;

  readonly startDate = signal<Date | null>(this.facade.startDate());
  readonly endDate = signal<Date | null>(this.facade.endDate());

  // ============================================
  // FORM STATE
  // ============================================
  readonly filterForm = new FormGroup({
    project_id: new FormControl<number[]>([]),
    telecaller_id: new FormControl<number[]>([]),
    sales_executive_id: new FormControl<number[]>([]),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
    date_preset: new FormControl<string>('30days')
  });

  // ============================================
  // CHART.JS INSTANCES
  // ============================================
  // ============================================
  // ECHARTS INSTANCES
  // ============================================
  @ViewChildren('chartHost') chartHosts!: QueryList<ElementRef<HTMLDivElement>>;
  private chartInstances = new Map<string, echarts.ECharts>();
  private resizeObserver?: ResizeObserver;

  // ============================================
  // UI STATE
  // ============================================
  readonly statusPeriod = signal<string>('Last year');
  readonly revenuePeriod = signal<string>('Last year');

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

  readonly presaleLeadLevels = this.facade.leadLevels;
  readonly salesLeadLevels = this.facade.salesLeadLevels;
  readonly sourceData = this.facade.sourceData;
  readonly bookingStatuses = this.facade.bookingStatuses;
  readonly salesDashboardDataFromFacade = this.facade.salesDashboardData;
  readonly hasTokenData = computed(() => (this.salesReportsRaw()?.token_type_count?.length ?? 0) > 0);

  readonly headerMetrics = computed(() => this.buildHeaderMetrics());

  readonly totalPresaleLeads = computed(() =>
    this.facade.leadLevels().reduce((acc, curr) => acc + curr.lead_level_count, 0)
  );

  readonly totalSalesLeads = computed(() =>
    this.facade.salesLeadLevels().reduce((acc, curr) => acc + curr.lead_level_count, 0)
  );

  readonly presaleLeadLevelLegend = computed(() => {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
    return this.presaleLeadLevels().map((level, index) => ({
      label: level.lead_level,
      value: level.lead_level_count,
      color: colors[index % colors.length]
    }));
  });

  readonly salesLeadLevelLegend = computed(() => {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
    return this.salesLeadLevels().map((level, index) => ({
      label: level.lead_level,
      value: level.lead_level_count,
      color: colors[index % colors.length]
    }));
  });

  readonly bookingStatusLegend = computed(() => {
    const data = this.allProjectSummaryData();
    return (data?.booking_statuses || []).map(s => ({
      label: s.booking_status,
      value: s.unit_count,
      color: s.color_code
    }));
  });

  readonly presaleMetrics = computed<DashboardMetric[]>(() => {
    const raw = this.presaleDashboardRaw();
    const sum = raw?.summary;

    if (!sum) return [
      { id: 'total_leads', title: 'Total Leads', value: 0, change: '', trend: 'neutral', icon: 'analytics' },
      { id: 'site_visits', title: 'Site Visits', value: 0, change: '', trend: 'neutral', icon: 'place' },
      { id: 'unassigned', title: 'Unassigned', value: 0, change: '', trend: 'neutral', icon: 'pending_actions' },
      { id: 'tokens', title: 'Tokens', value: 0, change: '', trend: 'neutral', icon: 'confirmation_number' },
      { id: 'bookings', title: 'Bookings', value: 0, change: '', trend: 'neutral', icon: 'apartment' }
    ];
    return [
      { id: 'total_leads', title: 'Total Leads', value: sum.total_lead_count ?? 0, change: '+0', trend: 'neutral', icon: 'analytics' },
      { id: 'site_visits', title: 'Site Visits', value: sum.site_visit_count ?? 0, change: '+0', trend: 'neutral', icon: 'place' },
      { id: 'unassigned', title: 'Unassigned', value: sum.unassigned_count ?? 0, change: '+0', trend: 'neutral', icon: 'pending_actions' },
      { id: 'tokens', title: 'Tokens', value: sum.token_count ?? 0, change: '+0', trend: 'neutral', icon: 'confirmation_number' },
      { id: 'bookings', title: 'Bookings', value: sum.booking_count ?? 0, change: '+0', trend: 'neutral', icon: 'apartment' }
    ];
  });

  readonly salesMetrics = computed<DashboardMetric[]>(() => {
    const raw = this.salesReportsRaw();
    const data = this.salesDashboardDataFromFacade();

    if (!raw && !data) return [
      { id: 'total_enquiries', title: 'Total Enquiries', value: 0, change: '', trend: 'neutral', icon: 'forum' },
      { id: 'site_visits', title: 'Site Visits', value: 0, change: '', trend: 'neutral', icon: 'place' },
      { id: 'unassigned', title: 'Unassigned', value: 0, change: '', trend: 'neutral', icon: 'pending_actions' },
      { id: 'tokens', title: 'Tokens', value: 0, change: '', trend: 'neutral', icon: 'confirmation_number' },
      { id: 'bookings', title: 'Bookings', value: 0, change: '', trend: 'neutral', icon: 'apartment' }
    ];
    return [
      { id: 'total_enquiries', title: 'Total Enquiries', value: raw?.total_enquiry_count ?? 0, change: '+0', trend: 'neutral', icon: 'forum' },
      { id: 'site_visits', title: 'Site Visits', value: data?.site_visit_count ?? 0, change: '+0', trend: 'neutral', icon: 'place' },
      { id: 'unassigned', title: 'Unassigned', value: raw?.unassigned_count ?? 0, change: '+0', trend: 'neutral', icon: 'pending_actions' },
      { id: 'tokens', title: 'Tokens', value: raw?.token_count ?? 0, change: '+0', trend: 'neutral', icon: 'confirmation_number' },
      { id: 'bookings', title: 'Bookings', value: raw?.booking_count ?? 0, change: '+0', trend: 'neutral', icon: 'apartment' }
    ];
  });

  private timeUpdateIntervalId: ReturnType<typeof setInterval> | null = null;

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit(): void {
    this.initializeComponent();
    this.setupFormSubscriptions();
  }

  ngAfterViewInit(): void {
    this.setupResizeObserver();
    this.setupCharts();
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.resizeObserver?.disconnect();
    this.chartInstances.forEach(chart => chart.dispose());
    this.chartInstances.clear();
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  private initializeComponent(): void {
    this.facade.initializeUser();

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.filterForm.patchValue({ start_date: thirtyDaysAgo, end_date: today });

    this.facade.loadProjects();

    this.timeUpdateIntervalId = setInterval(() => {
      this.facade.updateCurrentDate();
    }, 60000);

    setTimeout(() => {
      const projects = this.projects();
      if (projects.length > 0 && !this.selectedProjectId()) {
        const defaultProjectId = projects[0].project_id;
        this.filterForm.patchValue({ project_id: [defaultProjectId] });
        // The valueChanges subscription will trigger fetchDashboardData.
      }
    }, 500);
  }

  private setupFormSubscriptions(): void {
    this.filterForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectIds) => {
        const pIds = projectIds || [];
        this.onProjectChange(pIds);
        if (pIds.length > 0) {
          this.facade.loadTelecallers(pIds);
          this.facade.loadSalesExecutives(pIds);
        }
      });

    this.filterForm.get('start_date')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onDateRangeChange());

    this.filterForm.get('end_date')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onDateRangeChange());

    this.filterForm.get('date_preset')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((preset) => {
        if (preset) {
          this.onDatePresetChange(preset);
        }
      });
  }

  private readonly chartsEffect = effect(() => {
    this.salesDashboardDataFromFacade();
    this.salesReportsRaw();
    this.presaleDashboardRaw();
    this.allProjectSummaryData();

    untracked(() => {
      setTimeout(() => this.updateCharts(), 100);
    });
  });

  // ============================================
  // EVENT HANDLERS
  // ============================================
  onProjectChange(projectIds: number[]): void {
    // If autocomplete emits null/empty, keep array empty
    const pIds = projectIds || [];

    this.filterForm.patchValue(
      {
        telecaller_id: [],
        sales_executive_id: []
      },
      { emitEvent: false }
    );

    this.facade.setSelectedProject(pIds);
    this.fetchDashboardData();
  }

  onDateRangeChange(): void {
    const start = this.filterForm.get('start_date')?.value;
    const end = this.filterForm.get('end_date')?.value;
    if (start) this.startDate.set(start);
    if (end) this.endDate.set(end);
    if (start && end) {
      this.facade.setDates(start, end);
      this.fetchDashboardData();
    }
  }

  onDatePresetChange(preset: string): void {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case '1month':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3month':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6month':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case '30days':
      default:
        start.setDate(end.getDate() - 30);
        break;
    }

    this.filterForm.patchValue({
      start_date: start,
      end_date: end
    }, { emitEvent: true });
  }

  fetchDashboardData(): void {
    const projectIdsValue = this.filterForm.get('project_id')?.value || [];
    const startDateValue = this.filterForm.get('start_date')?.value;
    const endDateValue = this.filterForm.get('end_date')?.value;

    if (projectIdsValue.length === 0 || !startDateValue || !endDateValue) return;

    this.facade.fetchDashboardData({
      projectIds: projectIdsValue,
      startDate: this.formatDate(startDateValue)!,
      endDate: this.formatDate(endDateValue)!,
      telecallerIds: this.filterForm.get('telecaller_id')?.value || undefined,
      salesExecutiveIds: this.filterForm.get('sales_executive_id')?.value || undefined
    });
  }

  onStatusPeriodChange(period: string): void {
    this.statusPeriod.set(period);
  }

  onRevenuePeriodChange(period: string): void {
    this.revenuePeriod.set(period);
    this.fetchDashboardData();
  }

  onExportDashboard(): void { console.info('Export triggered'); }
  onHeaderMetricAction(id: string): void { console.info('Metric action', id); }

  trackByMetricId(_index: number, metric: { id: string }): string {
    return metric.id;
  }

  trackByCampaign(_index: number, campaign: any): any {
    return campaign?.campaign_id ?? campaign?.id ?? _index;
  }

  getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
    if (trend === 'up') return 'trending_up';
    if (trend === 'down') return 'trending_down';
    return 'trending_flat';
  }

  getMetricTheme(icon: string): any {
    const themeMap: Record<string, any> = {
      'analytics': { bg: '#f5f3ff', text: '#6d28d9', icon: '#8b5cf6' },
      'business': { bg: '#f0f9ff', text: '#0369a1', icon: '#0ea5e9' },
      'apartment': { bg: '#eff6ff', text: '#1d4ed8', icon: '#3b82f6' },
      'handshake': { bg: '#ecfdf5', text: '#047857', icon: '#10b981' },
      'pending_actions': { bg: '#fff7ed', text: '#c2410c', icon: '#f59e0b' },
      'directions_car': { bg: '#fef3c7', text: '#b45309', icon: '#f59e0b' },
      'payments': { bg: '#f0fdfa', text: '#0f766e', icon: '#14b8a6' },
      'forum': { bg: '#fdf4ff', text: '#a21caf', icon: '#d946ef' },
      'confirmation_number': { bg: '#fffbeb', text: '#b45309', icon: '#f59e0b' },
      'place': { bg: '#fdf2f8', text: '#be185d', icon: '#db2777' }
    };
    return themeMap[icon] || { bg: '#f8fafc', text: '#475569', icon: '#64748b' };
  }

  // ============================================
  // CHART.JS INTEGRATION
  // ============================================
  private setupCharts(): void {
    this.chartHosts.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.initCharts());
    this.initCharts();
  }

  private initCharts(): void {
    this.chartHosts.forEach(host => {
      const el = host.nativeElement;
      const id = el.getAttribute('data-chart-id');
      if (!id) return;

      const hasSize = el.clientWidth > 0 && el.clientHeight > 0;
      if (hasSize) {
        this.renderChartInstance(id, el);
      }
    });
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.chartInstances.forEach(c => c.resize());
    });
    this.chartHosts.forEach(h => this.resizeObserver?.observe(h.nativeElement));
  }

  onTabChange(): void {
    setTimeout(() => {
      this.initCharts();
      this.updateCharts();
    }, 250);
  }

  private updateCharts(): void {
    this.chartHosts.forEach(host => {
      const el = host.nativeElement;
      const fullId = el.getAttribute('data-chart-id');
      if (!fullId) return;

      const hasSize = el.clientWidth > 0 && el.clientHeight > 0;
      if (hasSize) {
        this.renderChartInstance(fullId, el);
      }
    });
  }

  private renderChartInstance(fullId: string, el: HTMLDivElement): void {
    const baseId = fullId.split('_')[0];
    const options = this.getEChartsOptions(baseId);

    let chart = this.chartInstances.get(fullId);
    if (!chart) {
      chart = echarts.init(el);
      this.chartInstances.set(fullId, chart);
    }

    if (options) {
      chart.setOption(options, true);
    }
  }

  private ensureArray(data: any): any[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object') return Object.values(data);
    return [];
  }

  private getEChartsOptions(id: string): echarts.EChartsOption | null {
    const flowData = this.enquiryFlowData();
    const summaryData = this.allProjectSummaryData();
    const salesData = this.salesDashboardDataFromFacade();
    const presaleRaw = this.presaleDashboardRaw();
    const salesReportsRaw = this.salesReportsRaw();
    const leadLevels = this.ensureArray(this.presaleLeadLevels());
    const salesLeadLevels = this.ensureArray(this.salesLeadLevels());
    const digitalCampaigns = this.ensureArray(this.digitalCampaigns());

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6'];

    const toTopN = (items: Array<{ name: string; value: number;[key: string]: any; }>, n: number) => {
      const sorted = [...items].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      const top = sorted.slice(0, n);
      const rest = sorted.slice(n);
      const restSum = rest.reduce((acc, curr) => acc + (curr.value ?? 0), 0);
      return restSum > 0 ? [...top, { name: 'Others', value: restSum }] : top;
    };

    const demographicsMap: any = {
      industry: { data: this.ensureArray(salesData?.industry), key: 'industry', val: 'enquiry_count' },
      ageRange: { data: this.ensureArray(salesData?.age_range), key: 'age_range', val: 'enquiry_count' },
      bookingPlan: { data: this.ensureArray(salesData?.booking_plan), key: 'booking', val: 'enquiry_count' },
      buyingPurpose: { data: this.ensureArray(salesData?.buying_purpose), key: 'buying_purpose', val: 'enquiry_count' },
      possessionRequired: { data: this.ensureArray(salesData?.possession_required), key: 'possession_req', val: 'enquiry_count' },
      preferredLocation: { data: this.ensureArray(salesData?.preferred_location), key: 'preferred_location', val: 'enquiry_count' },
      nativePlace: { data: this.ensureArray(salesData?.native_place), key: 'native_place', val: 'enquiry_count' }
    };

    const commonGrid = { top: 40, left: '3%', right: '4%', bottom: '15%', containLabel: true };

    let options: echarts.EChartsOption | null = null;
    switch (id) {
      case 'enquiryAnalysis': {
        if (!flowData) return null;
        const stages = [
          { name: 'Enquiries', value: flowData.enquiries },
          { name: 'Tokens', value: flowData.tokens },
          { name: 'Bookings', value: flowData.bookings },
          { name: 'Agreements', value: flowData.booking_agreements },
          { name: 'Disbursements', value: flowData.disbursements }
        ];

        options = {
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
          },
          grid: commonGrid,
          xAxis: {
            type: 'category',
            data: stages.map(s => s.name),
            axisLine: { lineStyle: { color: '#e2e8f0' } },
            axisLabel: { color: '#64748b', fontWeight: 600 }
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
            axisLabel: { color: '#64748b' }
          },
          series: [{
            name: 'Total',
            type: 'bar',
            barWidth: '40%',
            data: stages.map((s, i) => ({
              value: s.value,
              itemStyle: {
                borderRadius: [6, 6, 0, 0],
                // Subtle gradient for premium look
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: colors[i % colors.length] },
                  { offset: 1, color: colors[i % colors.length] + 'dd' }
                ])
              }
            })),
            label: {
              show: true,
              position: 'top',
              color: '#475569',
              fontWeight: 700,
              fontSize: 11
            }
          }]
        };
        break;
      }

      case 'unitDistribution': {
        if (!summaryData?.unit_count) return null;
        const units = summaryData.unit_count;
        const totals = units.map(u => (u.total_unit || 0) as number).sort((a, b) => a - b);
        const maxVal = totals[totals.length - 1] || 0;

        options = {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          legend: { bottom: 0, textStyle: { color: '#64748b' } },
          grid: commonGrid,
          xAxis: { type: 'category', data: units.map(u => (u.unit_type || 'N/A')) as any[], axisLine: { lineStyle: { color: '#e2e8f0' } } },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed' } }
          },
          series: [
            { name: 'Booked', type: 'bar', stack: 'total', data: units.map(u => (u.book_unit || 0)) as any[], itemStyle: { color: '#10b981' } },
            { name: 'Available', type: 'bar', stack: 'total', data: units.map(u => (u.available_unit || 0)) as any[], itemStyle: { color: '#cbd5e1' } },
            { name: 'Total', type: 'line', data: units.map(u => (u.total_unit || 0)) as any[], lineStyle: { type: 'dashed' }, itemStyle: { color: '#6366f1' } }
          ]
        } as any;
        break;
      }

      case 'presaleSource':
      case 'salesSource': {
        const raw = id === 'presaleSource' ? presaleRaw?.source : salesReportsRaw?.source;
        if (!raw || raw.length === 0) return null;
        const key = id === 'presaleSource' ? 'lead_count' : 'enquiry_count';
        const data = toTopN(raw.map((s: any) => ({ name: s.source || 'N/A', value: s[key] || 0 })), 8);

        options = {
          tooltip: { trigger: 'item' },
          legend: { orient: 'vertical', right: 0, top: 'middle', textStyle: { fontSize: 10 } },
          series: [{
            type: 'pie',
            radius: ['40%', '75%'],
            center: ['40%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: data.map((d, i) => ({
              name: d.name || 'N/A',
              value: (d.value as any) || 0,
              itemStyle: { color: colors[i % colors.length] }
            })) as any[]
          }]
        } as any;
        break;
      }

      case 'presaleLeadLevel':
      case 'salesLeadLevel': {
        const levels = id === 'presaleLeadLevel' ? leadLevels : salesLeadLevels;
        if (!levels || levels.length === 0) return null;

        options = {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { top: 20, left: 10, right: 40, bottom: 10, containLabel: true },
          xAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
          yAxis: { type: 'category', data: levels.map(l => l.lead_level) },
          series: [{
            type: 'bar',
            data: levels.map((l, i) => ({ value: l.lead_level_count, itemStyle: { color: colors[i % colors.length], borderRadius: [0, 4, 4, 0] } })),
            label: { show: true, position: 'right' }
          }]
        };
        break;
      }

      case 'tokenTypeCount': {
        const ttArr = this.ensureArray(salesReportsRaw?.token_type_count);
        if (ttArr.length === 0) return null;
        options = {
          tooltip: { trigger: 'axis' },
          grid: commonGrid,
          xAxis: { type: 'category', data: ttArr.map(t => t.token_type) },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: ttArr.map(t => t.token_count), itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } }]
        };
        break;
      }

      case 'industry': {
        const indRaw = this.ensureArray(salesData?.industry);
        if (indRaw.length === 0) return null;
        const data = toTopN(indRaw.map((i: any) => ({ name: i.industry, value: i.enquiry_count })), 6);
        options = {
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie',
            radius: '70%',
            data: data.map((d, i) => ({ ...d, itemStyle: { color: colors[i % colors.length] } })),
            label: { show: true, formatter: '{b}\n{d}%' }
          }]
        };
        break;
      }

      case 'campaignPerformance': {
        if (digitalCampaigns.length === 0) return null;
        options = {
          tooltip: { trigger: 'axis' },
          legend: { bottom: 0 },
          grid: commonGrid,
          xAxis: { type: 'category', data: digitalCampaigns.map(c => c.integration_name) },
          yAxis: [
            { type: 'value', name: 'Leads' },
            { type: 'value', name: 'SV/Bookings', position: 'right' }
          ],
          series: [
            { name: 'Leads', type: 'bar', data: digitalCampaigns.map(c => c.lead_count), itemStyle: { color: '#6366f1' } },
            { name: 'Site Visits', type: 'bar', data: digitalCampaigns.map(c => c.site_visit_count), itemStyle: { color: '#f59e0b' } },
            { name: 'Bookings', type: 'bar', data: digitalCampaigns.map(c => c.booking_count), itemStyle: { color: '#10b981' } }
          ]
        };
        break;
      }

      case 'ageRange': {
        const ageData = this.ensureArray(salesData?.age_range);
        if (ageData.length === 0) return null;
        options = {
          tooltip: { trigger: 'axis' },
          grid: commonGrid,
          xAxis: { type: 'category', data: ageData.map(d => d.age_range) },
          yAxis: { type: 'value' },
          series: [{
            type: 'line',
            smooth: true,
            data: ageData.map(d => d.enquiry_count),
            lineStyle: { width: 3, color: '#6366f1' },
            areaStyle: { color: 'rgba(99, 102, 241, 0.1)' },
            itemStyle: { color: '#6366f1' }
          }]
        };
        break;
      }

      case 'nativePlace': {
        const nData = this.ensureArray(salesData?.native_place);
        if (nData.length === 0) return null;
        const data = toTopN(nData.map((n: any) => ({ name: n.native_place, value: n.enquiry_count })), 8);
        options = {
          tooltip: { trigger: 'axis' },
          grid: commonGrid,
          xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { rotate: 30 } },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: data.map(d => d.value), itemStyle: { color: '#0ea5e9', borderRadius: [4, 4, 0, 0] } }]
        };
        break;
      }

      case 'possessionRequired': {
        const pData = this.ensureArray(salesData?.possession_required);
        if (pData.length === 0) return null;
        options = {
          tooltip: { trigger: 'axis' },
          grid: commonGrid,
          xAxis: { type: 'category', data: pData.map(d => d.possession_req) },
          yAxis: { type: 'value' },
          series: [{
            type: 'line',
            data: pData.map(d => d.enquiry_count),
            lineStyle: { color: '#10b981', width: 3 },
            itemStyle: { color: '#10b981' }
          }]
        };
        break;
      }

      case 'preferredLocation': {
        const plData = this.ensureArray(salesData?.preferred_location);
        if (plData.length === 0) return null;
        const data = toTopN(plData.map((p: any) => ({ name: p.preferred_location, value: p.enquiry_count })), 8);
        options = {
          grid: commonGrid,
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { rotate: 30 } },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: data.map(d => d.value), itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] } }]
        };
        break;
      }

      case 'bookingStatus': {
        const bsData = summaryData?.booking_statuses || [];
        if (bsData.length === 0) return null;
        options = {
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
              return `<div class="flex flex-col gap-1 px-1 py-0.5">
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${params.color}"></div>
                  <span class="text-slate-500 font-medium">${params.name}</span>
                </div>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-slate-900 font-black text-lg">${params.value}</span>
                  <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Units</span>
                  <span class="text-indigo-600 font-bold ml-auto">${params.percent}%</span>
                </div>
              </div>`;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 0,
            padding: 8,
            extraCssText: 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border-radius: 12px;'
          },
          series: [{
            type: 'pie',
            radius: ['20%', '90%'],
            center: ['50%', '50%'],
            roseType: 'area',
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'outside',
              formatter: '{b}\n{d}%',
              fontSize: 10,
              color: '#64748b',
              fontWeight: 600
            },
            labelLine: { show: true, length: 15, length2: 15, lineStyle: { color: '#e2e8f0' } },
            data: bsData.map(d => ({
              name: d.booking_status,
              value: (d.unit_count || 0) === 0 ? 0.5 : d.unit_count,
              itemStyle: { color: d.color_code?.trim() || '#cbd5e1' }
            }))
          }]
        };
        break;
      }

      case 'bookingPlan': {
        const bpData = this.ensureArray(salesData?.booking_plan);
        if (bpData.length === 0) return null;
        options = {
          grid: commonGrid,
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: bpData.map(d => d.booking) },
          yAxis: { type: 'value' },
          series: [{ type: 'bar', data: bpData.map(d => d.enquiry_count), itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] } }]
        };
        break;
      }

      case 'buyingPurpose': {
        const buyPData = this.ensureArray(salesData?.buying_purpose);
        if (buyPData.length === 0) return null;
        options = {
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie',
            radius: '70%',
            data: buyPData.map((d, i) => ({ name: d.buying_purpose, value: d.enquiry_count, itemStyle: { color: i === 0 ? '#f43f5e' : '#8b5cf6' } })),
            label: { show: true, formatter: '{b}: {c}' }
          }]
        };
        break;
      }

      case 'salesLeadLevelDonut':
      case 'presaleLeadLevelDonut': {
        const levels = id === 'presaleLeadLevelDonut' ? leadLevels : salesLeadLevels;
        if (levels.length === 0) return null;
        options = {
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie',
            radius: ['50%', '85%'],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: levels.map((l, i) => ({
              name: l.lead_level,
              value: (l.lead_level_count as any) || 0,
              itemStyle: { color: colors[i % colors.length] }
            })) as any[]
          }]
        } as any;
        break;
      }

      case 'sourceWiseBooking': {
        const swbData = summaryData?.source_wise_booking || [];
        if (swbData.length === 0) return null;
        const data = toTopN(swbData.map((s: any) => ({ name: s.source_name || 'N/A', value: s.booking_count || 0 })), 8);

        options = {
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => {
              return `<div class="flex flex-col gap-1 px-1 py-0.5">
                <div class="flex items-center gap-2">
                  <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${params.color}"></div>
                  <span class="text-slate-500 font-medium">${params.name}</span>
                </div>
                <div class="flex items-baseline gap-1.5">
                  <span class="text-slate-900 font-black text-lg">${params.value}</span>
                  <span class="text-slate-400 text-xs font-bold uppercase tracking-wider">Bookings</span>
                  <span class="text-indigo-600 font-bold ml-auto">${params.percent}%</span>
                </div>
              </div>`;
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderWidth: 0,
            padding: 8,
            extraCssText: 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border-radius: 12px;'
          },
          series: [{
            type: 'pie',
            radius: '70%',
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'outside',
              formatter: '{b}\n{d}%',
              fontSize: 10,
              color: '#64748b',
              fontWeight: 600
            },
            labelLine: { show: true, length: 15, length2: 15, lineStyle: { color: '#e2e8f0' } },
            data: data.map((d, i) => ({
              name: d.name,
              value: d.value,
              itemStyle: { color: colors[i % colors.length] }
            }))
          }]
        };
        break;
      }

      default: options = null;
    }

    if (options) {
      options.toolbox = {
        feature: {
          saveAsImage: {
            show: true,
            title: 'Download',
            iconStyle: {
              borderColor: '#6366f1'
            }
          }
        },
        right: 15,
        top: 0
      };
    }
    return options;
  }


  private formatDate(date: Date | null): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    return [d.getFullYear(), ('' + (d.getMonth() + 1)).padStart(2, '0'), ('' + d.getDate()).padStart(2, '0')].join('-');
  }

  private buildHeaderMetrics(): HeaderMetric[] {
    const summary = this.allProjectSummaryData() as ProjectSummary | null;
    if (!summary) return [];
    const totalInventory = summary.floor_unit_count || 0;
    const booked = summary.booking_count || 0;
    const available = totalInventory - booked;

    return [
      { id: 'projects', title: 'Total Projects', description: 'Active', value: (summary.project_count || 0).toString(), change: '+0', trend: 'neutral', baseline: '', icon: 'business' },
      { id: 'total_inventory', title: 'Total Inventory', description: 'Total units', value: totalInventory.toString(), change: '+0', trend: 'neutral', baseline: '', icon: 'apartment' },
      { id: 'booked_units', title: 'Booked Units', description: 'Sold', value: booked.toString(), change: '+0', trend: 'neutral', baseline: '', icon: 'handshake' },
      { id: 'available_units', title: 'Available Units', description: 'Unsold', value: available.toString(), change: '+0', trend: 'neutral', baseline: '', icon: 'pending_actions' }
    ];
  }

  private formatCurrency(v: number): string {
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(2)} L`;
    return `₹${v.toLocaleString('en-IN')}`;
  }

  private cleanup(): void {
    if (this.timeUpdateIntervalId) { clearInterval(this.timeUpdateIntervalId); this.timeUpdateIntervalId = null; }
  }
}