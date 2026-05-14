import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectionStrategy, TrackByFunction, inject, computed, effect, DestroyRef, signal, untracked, ElementRef, ViewChildren, QueryList} from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
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
    date_preset: new FormControl<string | null>(null)
  });

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

  readonly presaleSourceLegend = computed(() => {
    const raw = this.presaleDashboardRaw()?.source || [];
    const total = raw.reduce((acc: number, curr: any) => acc + (curr.lead_count || 0), 0);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6'];
    return raw.map((s: any, i: number) => ({
      name: s.source || 'N/A',
      count: s.lead_count || 0,
      percent: total ? Math.round((s.lead_count / total) * 100) : 0,
      color: colors[i % colors.length]
    })).sort((a: any, b: any) => b.count - a.count).slice(0, 8);
  });

  readonly salesSourceLegend = computed(() => {
    const raw = this.salesReportsRaw()?.source || [];
    const total = raw.reduce((acc: number, curr: any) => acc + (curr.enquiry_count || 0), 0);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#3b82f6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6'];
    return raw.map((s: any, i: number) => ({
      name: s.source || 'N/A',
      count: s.enquiry_count || 0,
      percent: total ? Math.round((s.enquiry_count / total) * 100) : 0,
      color: colors[i % colors.length]
    })).sort((a: any, b: any) => b.count - a.count).slice(0, 8);
  });

  readonly presaleMetrics = computed<DashboardMetric[]>(() => {
    const raw = this.presaleDashboardRaw();
    const sum = raw?.summary;

    if (!sum) return [
      { id: 'total_leads', title: 'Total Leads', value: 0, change: '', trend: 'neutral', icon: 'analytics' },
      { id: 'site_visits', title: 'Site Visits', value: 0, change: '', trend: 'neutral', icon: 'place' }
    ];
    return [
      { id: 'total_leads', title: 'Total Leads', value: sum.total_lead_count ?? 0, change: '+0', trend: 'neutral', icon: 'analytics' },
      { id: 'site_visits', title: 'Site Visits', value: sum.site_visit_count ?? 0, change: '+0', trend: 'neutral', icon: 'place' }
    ];
  });

  readonly salesMetrics = computed<DashboardMetric[]>(() => {
    const raw = this.salesReportsRaw();
    const data = this.salesDashboardDataFromFacade();
    const allProj = this.allProjectSummaryData();

    const enquiries = raw?.total_enquiry_count ?? 0;
    const bookings = allProj?.booking_count ?? 0;
    const convRatio = enquiries > 0 ? Math.round((bookings / enquiries) * 100) : 0;

    return [
      { id: 'total_enquiries', title: 'Total Enquiries', value: enquiries, change: '+0', trend: 'neutral', icon: 'forum' },
      { id: 'site_visits', title: 'Site Visits', value: data?.site_visit_count ?? 0, change: '+0', trend: 'neutral', icon: 'place' },
      { id: 'total_bookings', title: 'Total Bookings', value: bookings, change: '+0', trend: 'neutral', icon: 'shopping_cart' },
      { id: 'conv_ratio', title: 'Conv. Ratio', value: convRatio + '%', change: '+0', trend: 'neutral', icon: 'trending_up' }
    ];
  });

  readonly industryDistribution = computed(() => {
    const data = this.salesDashboardDataFromFacade();
    return this.ensureArray(data?.industry).map((i: any) => ({ name: i.industry, value: i.enquiry_count }));
  });

  readonly tokenDistribution = computed(() => {
    const data = this.salesReportsRaw();
    return this.ensureArray(data?.token_type_count).map((t: any) => ({ name: t.token_type, value: t.token_count }));
  });

  readonly bookingSourceDistribution = computed(() => {
    const data = this.allProjectSummaryData();
    return this.ensureArray(data?.source_wise_booking).map((s: any) => ({ name: s.source_name, value: s.booking_count }));
  });



  private timeUpdateIntervalId: ReturnType<typeof setInterval> | null = null;

  // ============================================
  // PREMIUM ANALYTICS — Smart Insights & Rates
  // ============================================
  readonly lastUpdated = signal<Date>(new Date());
  private readonly filterState = signal<{ projectIds: number[]; preset: string }>({ projectIds: [], preset: '30days' });

  readonly activeFilterChips = computed(() => {
    const state = this.filterState();
    const chips: { label: string; type: string }[] = [];
    if (state.projectIds.length > 0) {
      const names = this.projects()
        .filter(p => state.projectIds.includes(p.project_id))
        .map(p => p.property_name);
      chips.push({ label: names.length === 1 ? names[0] : `${names.length} Projects`, type: 'project' });
    }
    return chips;
  });

  // ============================================
  // INCHARGE-WISE DASHBOARD DATA
  // ============================================
  readonly inchargeTargetData = signal<{ name: string; target: number; achievement: number; achievementPct: number }[]>([
    { name: 'Incharge 1', target: 1000, achievement: 500, achievementPct: 50 },
    { name: 'Incharge 2', target: 2000, achievement: 1000, achievementPct: 50 },
    { name: 'Incharge 3', target: 2000, achievement: 300, achievementPct: 15 },
    { name: 'Incharge 4', target: 1500, achievement: 900, achievementPct: 60 },
    { name: 'Incharge 5', target: 2500, achievement: 2000, achievementPct: 80 }
  ]);

  readonly inchargeBookingData = signal<{ name: string; booking: number; agreement: number; disbursement: number; pendingAgreement: number; pendingDisbursement: number }[]>([
    { name: 'Incharge 1', booking: 3000, agreement: 1000, disbursement: 500, pendingAgreement: 2000, pendingDisbursement: 500 },
    { name: 'Incharge 2', booking: 4000, agreement: 2000, disbursement: 1000, pendingAgreement: 2000, pendingDisbursement: 1000 },
    { name: 'Incharge 3', booking: 4000, agreement: 2000, disbursement: 300, pendingAgreement: 2000, pendingDisbursement: 1700 },
    { name: 'Incharge 4', booking: 5000, agreement: 2500, disbursement: 1500, pendingAgreement: 2000, pendingDisbursement: 500 },
    { name: 'Incharge 5', booking: 6000, agreement: 4000, disbursement: 2000, pendingAgreement: 2000, pendingDisbursement: 1000 }
  ]);

  readonly carpetWiseUnits = signal<{ carpet: string; totalUnits: number; soldUnits: number; unSoldUnits: number; velocityPct: number }[]>([
    { carpet: '800-900 sq.ft', totalUnits: 100, soldUnits: 50, unSoldUnits: 50, velocityPct: 50 },
    { carpet: '900-1000 sq.ft', totalUnits: 200, soldUnits: 50, unSoldUnits: 150, velocityPct: 25 },
    { carpet: '700-800 sq.ft', totalUnits: 500, soldUnits: 100, unSoldUnits: 400, velocityPct: 20 }
  ]);

  readonly inchargeTotalAchievement = computed(() => {
    const data = this.inchargeTargetData();
    const totalTarget = data.reduce((s, d) => s + d.target, 0);
    const totalAchieved = data.reduce((s, d) => s + d.achievement, 0);
    return { totalTarget, totalAchieved, overallPct: totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0 };
  });

  readonly inchargeTotalBooking = computed(() => {
    const data = this.inchargeBookingData();
    return {
      totalBooking: data.reduce((s, d) => s + d.booking, 0),
      totalAgreement: data.reduce((s, d) => s + d.agreement, 0),
      totalDisbursement: data.reduce((s, d) => s + d.disbursement, 0),
      totalPendingAgreement: data.reduce((s, d) => s + d.pendingAgreement, 0),
      totalPendingDisbursement: data.reduce((s, d) => s + d.pendingDisbursement, 0)
    };
  });

  readonly carpetTotals = computed(() => {
    const data = this.carpetWiseUnits();
    return {
      totalUnits: data.reduce((s, d) => s + d.totalUnits, 0),
      soldUnits: data.reduce((s, d) => s + d.soldUnits, 0),
      unSoldUnits: data.reduce((s, d) => s + d.unSoldUnits, 0)
    };
  });

  // ============================================
  // PROJECT SUMMARY DASHBOARD DATA
  // ============================================
  readonly projectSummaryKPIs = signal({
    totalProjectCount: 10,
    totalUnits: 5000,
    soldUnits: 3000,
    availableUnits: 2000,
    holdUnits: 0,
    target: 500,
    achievement: 300,
    conRatioPct: 60,
    ongoingProjects: 10,
    completedProjects: 5,
    upcomingProjects: 3,
    occupancyRate: 60
  });

  readonly unitConfigData = signal<{ config: string; count: number; booked: number; available: number }[]>([
    { config: '2 BHK', count: 2000, booked: 1500, available: 500 },
    { config: '3 BHK', count: 1000, booked: 470, available: 530 },
    { config: '1 BHK', count: 1500, booked: 1000, available: 500 },
    { config: 'Shop',  count: 500,  booked: 30,   available: 470 }
  ]);

  readonly tokenTypeData = signal<{ type: string; count: number; booked: number }[]>([
    { type: 'Gold',     count: 300, booked: 199 },
    { type: 'Platinum', count: 500, booked: 400 },
    { type: 'Silver',   count: 400, booked: 250 },
    { type: 'Diamond',  count: 150, booked: 120 },
    { type: 'VIP',      count: 100, booked: 80 },
    { type: 'Other',    count: 200, booked: 150 }
  ]);

  readonly presalePipelineData = signal({
    totalPresalesVisit: 40000,
    token: 5000,
    booking: 3000,
    agreement: 500,
    disbursement: 100,
    pendingAgreement: 2500,
    pendingDisbursement: 300
  });

  readonly leadSourceData = signal<{ source: string; count: number }[]>([
    { source: 'CP',        count: 400 },
    { source: 'Walkin',    count: 70 },
    { source: 'Digital',   count: 10 },
    { source: 'Hoarding',  count: 5 },
    { source: 'Website',   count: 5 },
    { source: 'Reference', count: 10 },
    { source: 'Radio',     count: 0 }
  ]);

  readonly projectWiseUnits = signal<{ project: string; totalUnits: number; soldUnits: number; availableUnits: number; holdUnits: number }[]>([
    { project: 'Pro 1', totalUnits: 400, soldUnits: 100, availableUnits: 150, holdUnits: 50 },
    { project: 'Pro 2', totalUnits: 200, soldUnits: 20,  availableUnits: 180, holdUnits: 0  },
    { project: 'Pro 3', totalUnits: 100, soldUnits: 1,   availableUnits: 99,  holdUnits: 0  }
  ]);

  readonly bookingCancelledData = signal({ booked: 3500, cancelled: 500 });

  readonly monthlyBookingTrend = signal<{ month: string; bookings: number; visits: number; tokens: number }[]>([
    { month: 'Jan', bookings: 180, visits: 3200, tokens: 620 },
    { month: 'Feb', bookings: 220, visits: 3800, tokens: 740 },
    { month: 'Mar', bookings: 310, visits: 5100, tokens: 930 },
    { month: 'Apr', bookings: 280, visits: 4600, tokens: 850 },
    { month: 'May', bookings: 350, visits: 5800, tokens: 1100 },
    { month: 'Jun', bookings: 420, visits: 6900, tokens: 1280 },
    { month: 'Jul', bookings: 390, visits: 6200, tokens: 1150 },
    { month: 'Aug', bookings: 460, visits: 7400, tokens: 1350 },
    { month: 'Sep', bookings: 510, visits: 8100, tokens: 1480 },
    { month: 'Oct', bookings: 480, visits: 7800, tokens: 1420 },
    { month: 'Nov', bookings: 530, visits: 8600, tokens: 1560 },
    { month: 'Dec', bookings: 580, visits: 9200, tokens: 1700 }
  ]);

  readonly bhkSellThrough = signal<{ config: string; total: number; booked: number; pct: number }[]>([
    { config: '2 BHK', total: 2000, booked: 1500, pct: 75 },
    { config: '3 BHK', total: 1000, booked: 470,  pct: 47 },
    { config: '1 BHK', total: 1500, booked: 1000, pct: 67 },
    { config: 'Shop',  total: 500,  booked: 30,   pct: 6  }
  ]);

  readonly conversionFunnelData = signal<{ stage: string; value: number }[]>([
    { stage: 'Total Enquiries',    value: 40000 },
    { stage: 'Site Visits',        value: 18000 },
    { stage: 'Token',              value: 5000  },
    { stage: 'Booking',            value: 3000  },
    { stage: 'Agreement',          value: 500   },
    { stage: 'Disbursement',       value: 100   }
  ]);

  readonly projectConRatioData = signal<{ project: string; enquiries: number; bookings: number; pct: number }[]>([
    { project: 'Pro 1', enquiries: 1500, bookings: 100, pct: 6.7  },
    { project: 'Pro 2', enquiries: 800,  bookings: 20,  pct: 2.5  },
    { project: 'Pro 3', enquiries: 400,  bookings: 1,   pct: 0.3  }
  ]);

  readonly sourceWiseBookingData = signal<{ source: string; bookings: number; tokens: number; visits: number }[]>([
    { source: 'CP',        bookings: 220, tokens: 310, visits: 1800 },
    { source: 'Walkin',    bookings: 180, tokens: 250, visits: 1200 },
    { source: 'Digital',   bookings: 60,  tokens: 90,  visits: 600  },
    { source: 'Reference', bookings: 50,  tokens: 70,  visits: 400  },
    { source: 'Hoarding',  bookings: 30,  tokens: 45,  visits: 300  },
    { source: 'Website',   bookings: 20,  tokens: 35,  visits: 250  }
  ]);


  readonly enquiryConversionRate = computed(() => {
    const flow = this.enquiryFlowData();
    if (!flow || flow.enquiries === 0) return 0;
    return Math.round((flow.bookings / flow.enquiries) * 1000) / 10;
  });

  readonly inventoryHealth = computed(() => {
    const data = this.allProjectSummaryData();
    if (!data || data.floor_unit_count === 0) return { bookedPct: 0, availablePct: 100, status: 'healthy' as const };
    const bookedPct = Math.round((data.booking_count / data.floor_unit_count) * 1000) / 10;
    const status = bookedPct > 80 ? 'critical' : bookedPct > 50 ? 'warning' : 'healthy';
    return { bookedPct, availablePct: 100 - bookedPct, status };
  });

  readonly topSourceInsight = computed(() => {
    const raw = this.presaleDashboardRaw();
    const sources = raw?.source || [];
    if (!sources.length) return null;
    const top = sources.reduce((a: any, b: any) => (a.lead_count > b.lead_count ? a : b));
    return { name: top.source, count: top.lead_count, pct: Math.round((top.lead_count / sources.reduce((s: number, c: any) => s + c.lead_count, 0)) * 100) };
  });

  readonly digitalROIColor = computed(() => {
    const campaigns = this.digitalCampaigns();
    if (!campaigns.length) return 'neutral';
    const totalLeads = campaigns.reduce((s, c) => s + c.lead_count, 0);
    const totalBookings = campaigns.reduce((s, c) => s + c.booking_count, 0);
    const rate = totalLeads ? (totalBookings / totalLeads) * 100 : 0;
    return rate > 5 ? 'emerald' : rate > 2 ? 'amber' : 'rose';
  });

  private presetLabel(preset: string): string {
    const map: Record<string, string> = {
      '30days': 'Last 30 Days', '1month': 'One Month', '3month': 'Three Months',
      '6month': 'Six Months', '1year': 'One Year'
    };
    return map[preset] || preset;
  }

  refreshDashboard(): void {
    this.lastUpdated.set(new Date());
    this.fetchDashboardData();
  }

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.initializeComponent();
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
  }

  /**
   * Automatically initializes the dashboard with all projects
   * once the projects list is loaded.
   */
  private readonly projectInitEffect = effect(() => {
    const projects = this.projects();
    const currentSelected = this.filterForm.get('project_id')?.value;
    
    if (projects.length > 0 && (!currentSelected || currentSelected.length === 0)) {
      untracked(() => {
        const allProjectIds = projects.map(p => p.project_id);
        this.filterForm.patchValue({ project_id: allProjectIds });
        // The valueChanges subscription in setupFormSubscriptions 
        // will handle calling fetchDashboardData()
      });
    }
  });

  private setupFormSubscriptions(): void {
    this.filterForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectIds) => {
        const pIds = projectIds || [];
        this.filterState.update(s => ({ ...s, projectIds: pIds as number[] }));
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
          this.filterState.update(s => ({ ...s, preset }));
          this.onDatePresetChange(preset);
        }
      });
  }

  private readonly chartsEffect = effect(() => {
    // Watch all relevant data signals
    this.salesDashboardDataFromFacade();
    this.salesReportsRaw();
    this.presaleDashboardRaw();
    this.allProjectSummaryData();

    untracked(() => {
      this.lastUpdated.set(new Date());
      // Small delay to ensure DOM is ready if signals changed during initialization
      setTimeout(() => {
        if (this.chartHosts && this.chartHosts.length > 0) {
          this.updateCharts();
        }
      }, 150);
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
    if (!this.chartHosts) return;
    
    this.chartHosts.forEach(host => {
      const el = host.nativeElement;
      const id = el.getAttribute('data-chart-id');
      if (!id) return;

      // Observe if not already observed
      this.resizeObserver?.observe(el);

      const hasSize = el.clientWidth > 0 && el.clientHeight > 0;
      if (hasSize) {
        this.renderChartInstance(id, el);
      }
    });
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target as HTMLDivElement;
        const fullId = el.getAttribute('data-chart-id');
        if (!fullId) return;

        const hasSize = el.clientWidth > 0 && el.clientHeight > 0;
        if (hasSize) {
          // If the chart isn't initialized yet, render it now that we have size
          this.renderChartInstance(fullId, el);
          // Always trigger a resize to match the new container dimensions
          this.chartInstances.get(fullId)?.resize();
        }
      });
    });

    // Initial observation of all hosts
    this.chartHosts?.forEach(h => this.resizeObserver?.observe(h.nativeElement));
  }

  onTabChange(): void {
    // Small delay to allow Angular/Material to finish the tab transition and render the content
    setTimeout(() => {
      this.initCharts();
      this.updateCharts();
      // Force immediate resize for all instances to ensure they fill the new tab space
      this.chartInstances.forEach(c => c.resize());
    }, 150);
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
      if (sorted.length <= n) return sorted;
      const top = sorted.slice(0, n);
      const rest = sorted.slice(n);
      const restSum = rest.reduce((acc, curr) => acc + (curr.value ?? 0), 0);
      return restSum > 0 ? [...top, { name: 'Others', value: restSum }] : top;
    };

    const commonGrid = { top: 30, left: 10, right: 10, bottom: 25, containLabel: true };
    const premiumAxis = {
      axisLine: { lineStyle: { color: '#e2e8f0', width: 1.5 } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontWeight: 600, fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }
    };
    const premiumTooltip = () => ({
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderWidth: 0,
      padding: 10,
      extraCssText: 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); border-radius: 12px;',
      textStyle: { color: '#1e293b', fontFamily: 'Inter, system-ui, sans-serif' }
    });

    /**
     * PROPLAY PREMIUM PIE STYLE
     * Information on left, Chart on right with connectors
     */
    const premiumPie = (data: any[], title: string) => {
      const filteredData = data.filter(d => d.value > 0);
      if (filteredData.length === 0) return null;

      return {
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => `
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${params.color}"></div>
                <span class="text-slate-500 font-medium">${params.name}</span>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-slate-900 font-black text-lg">${params.value}</span>
                <span class="text-indigo-600 font-bold ml-auto">${params.percent}%</span>
              </div>
            </div>
          `,
          ...premiumTooltip()
        },
        legend: {
          type: 'scroll',
          orient: 'vertical',
          left: 5,
          top: 'middle',
          bottom: 20,
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 12,
          icon: 'circle',
          formatter: (name: string) => {
            const item = data.find(d => d.name === name);
            return `${name}  ${item ? item.value : 0}`;
          },
          textStyle: {
            color: '#334155',
            fontSize: 11,
            fontWeight: 800
          },
          pageButtonPosition: 'end',
          pageIconSize: 10,
          pageTextStyle: { color: '#6366f1' }
        },
        series: [
          {
            name: title,
            type: 'pie',
            radius: ['35%', '60%'],
            center: ['65%', '50%'],
            minAngle: 25,
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'outside',
              alignTo: 'labelLine',
              formatter: '{name|{b}}\n{val|{d}%}',
              rich: {
                name: { fontSize: 9, fontWeight: 800, color: '#64748b', padding: [2, 0] },
                val:  { fontSize: 10, fontWeight: 950, color: '#0f172a' }
              }
            },
            labelLine: {
              show: true,
              length: 15,
              length2: 20,
              lineStyle: { color: '#cbd5e1', width: 2 },
              smooth: true
            },
            emphasis: {
              focus: 'self',
              itemStyle: {
                shadowBlur: 15,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.2)'
              }
            },
            data: filteredData.map((d, i) => ({
              ...d,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: colors[i % colors.length] },
                  { offset: 1, color: colors[i % colors.length] + 'cc' }
                ])
              }
            }))
          }
        ]
      } as echarts.EChartsOption;
    };

    /**
     * PROPLAY PREMIUM BAR STYLE
     */
    const premiumBar = (xAxisData: string[], series: any[], horizontal = false) => {
      return {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...premiumTooltip() },
        grid: commonGrid,
        xAxis: (horizontal ? { type: 'value', splitLine: { lineStyle: { type: 'dashed' } }, ...premiumAxis } : { type: 'category', data: xAxisData, ...premiumAxis }) as any,
        yAxis: (horizontal ? { type: 'category', data: xAxisData, ...premiumAxis } : { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, ...premiumAxis }) as any,
        series: series.map((s, i) => ({
          ...s,
          type: 'bar',
          barWidth: series.length > 1 ? '35%' : '50%',
          itemStyle: {
            borderRadius: horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0],
            color: s.itemStyle?.color || new echarts.graphic.LinearGradient(horizontal ? 0 : 0, horizontal ? 0 : 0, horizontal ? 1 : 0, horizontal ? 0 : 1, [
              { offset: 0, color: colors[i % colors.length] },
              { offset: 1, color: colors[i % colors.length] + 'cc' }
            ]),
            shadowColor: 'rgba(0, 0, 0, 0.05)',
            shadowBlur: 10,
            shadowOffsetY: 4
          },
          label: { show: true, position: horizontal ? 'right' : 'top', fontSize: 11, fontWeight: 900, color: '#475569' },
          emphasis: { focus: 'series' }
        }))
      } as echarts.EChartsOption;
    };

    /**
     * PROPLAY PREMIUM LINE STYLE
     */
    const premiumLine = (xAxisData: string[], series: any[]) => {
      return {
        tooltip: { trigger: 'axis', ...premiumTooltip() },
        grid: commonGrid,
        xAxis: { type: 'category', data: xAxisData, boundaryGap: false, ...premiumAxis } as any,
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, ...premiumAxis } as any,
        series: series.map((s, i) => ({
          ...s,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          showSymbol: true,
          lineStyle: { 
            width: 4, 
            color: colors[i % colors.length],
            shadowColor: colors[i % colors.length] + '44',
            shadowBlur: 10,
            shadowOffsetY: 5
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colors[i % colors.length] + '33' },
              { offset: 1, color: colors[i % colors.length] + '00' }
            ])
          },
          label: {
            show: true,
            position: 'top',
            fontSize: 11,
            fontWeight: 900,
            color: colors[i % colors.length],
            formatter: (params: any) => params.value > 0 ? params.value : ''
          },
          itemStyle: { 
            color: colors[i % colors.length],
            borderWidth: 2,
            borderColor: '#fff'
          },
          emphasis: { 
            focus: 'series',
            scale: true,
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.3)'
            }
          }
        }))
      } as echarts.EChartsOption;
    };

    let options: echarts.EChartsOption | null = null;

    switch (id) {
      case 'enquiryFlow':
      case 'enquiryAnalysis': {
        const stages = [
          { name: 'Enquiries', value: flowData?.enquiries || 0 },
          { name: 'Tokens', value: flowData?.tokens || 0 },
          { name: 'Bookings', value: flowData?.bookings || 0 },
          { name: 'Agreements', value: flowData?.booking_agreements || 0 },
          { name: 'Disbursements', value: flowData?.disbursements || 0 }
        ];
        if (id === 'enquiryAnalysis') {
          const pieBase: any = premiumPie(stages, 'Stage Volume');
          return {
            ...pieBase,
            legend: { ...pieBase.legend, show: false },
            series: [{ ...pieBase.series[0], center: ['50%', '50%'] }]
          } as echarts.EChartsOption;
        }
        return premiumBar(stages.map(s => s.name), [{ name: 'Total', data: stages.map(s => s.value) }]);
      }

      case 'unitDistribution': {
        if (!summaryData?.unit_count) return null;
        const units = summaryData.unit_count;
        const xAxisData = units.map(u => u.unit_type || 'N/A');
        const fmtNum = (v: number) => v >= 10000 ? `${(v/1000).toFixed(1)}K` : v.toLocaleString();
        
        return {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...premiumTooltip() },
          legend: { bottom: 0, icon: 'circle', textStyle: { color: '#64748b', fontWeight: 800, fontSize: 10 } },
          grid: { top: 85, right: 10, bottom: 60, left: 10, containLabel: true },
          xAxis: { 
            type: 'category', data: xAxisData, ...premiumAxis, axisTick: { show: false },
            axisLabel: { ...premiumAxis.axisLabel, interval: 0, rotate: 45, fontSize: 9, fontWeight: 700 } 
          } as any,
          yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }, ...premiumAxis, axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel } } as any,
          series: [
            { 
              name: 'Booked', type: 'bar', stack: 'total', barWidth: '45%',
              data: units.map(u => u.book_unit || 0), 
              itemStyle: { 
                color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#34d399'},{offset:1,color:'#10b981'}])
              },
              label: { show: false }
            },
            { 
              name: 'Available', type: 'bar', stack: 'total', barWidth: '45%',
              // Set label distance per-item to solve staggering without violating types
              data: units.map((u, i) => ({
                value: u.available_unit || 0,
                label: {
                  show: true, position: 'top',
                  distance: i % 2 === 0 ? 10 : 50,
                  formatter: (p: any) => {
                    const d = units[p.dataIndex];
                    if (d.total_unit === 0) return '';
                    return `{sold|${fmtNum(d.book_unit || 0)}} {label|Sold}\n{stock|${fmtNum(d.available_unit || 0)}} {label|Stock}`;
                  }
                }
              })), 
              itemStyle: { 
                borderRadius: [4,4,0,0],
                color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color: '#cbd5e1'},{offset:1,color: '#94a3b8'}])
              },
              label: {
                rich: {
                  sold: { fontSize: 10, fontWeight: 950, color: '#10b981', padding: [2, 3], backgroundColor: '#f0fdf4', borderRadius: 4 },
                  stock: { fontSize: 10, fontWeight: 950, color: '#f59e0b', padding: [2, 3], backgroundColor: '#fffbeb', borderRadius: 4 },
                  label: { fontSize: 8, fontWeight: 700, color: '#64748b', padding: [0, 2] }
                }
              }
            },
            { 
              name: 'Total Units', type: 'line', smooth: true,
              data: units.map(u => u.total_unit || 0), 
              lineStyle: { width: 2, color: '#6366f1', opacity: 0.3 },
              itemStyle: { color: '#6366f1', opacity: 0.5 },
              symbol: 'none'
            }
          ] as any
        };
      }

      case 'presaleSource':
      case 'salesSource': {
        const raw = id === 'presaleSource' ? presaleRaw?.source : salesReportsRaw?.source;
        if (!raw || raw.length === 0) return null;
        const key = id === 'presaleSource' ? 'lead_count' : 'enquiry_count';
        const data = toTopN(raw.map((s: any) => ({ name: s.source || 'N/A', value: s[key] || 0 })), 13);
        return premiumPie(data, 'Lead Sources');
      }

      case 'presaleLeadLevel':
      case 'salesLeadLevel': {
        const levels = id === 'presaleLeadLevel' ? leadLevels : salesLeadLevels;
        if (!levels || levels.length === 0) return null;
        return premiumBar(levels.map(l => l.lead_level), [{ name: 'Count', data: levels.map(l => l.lead_level_count) }], true);
      }

      case 'tokenTypeCount': {
        const ttArr = this.ensureArray(salesReportsRaw?.token_type_count);
        if (ttArr.length === 0) return null;
        return premiumBar(ttArr.map(t => t.token_type), [{ name: 'Tokens', data: ttArr.map(t => t.token_count), itemStyle: { color: '#f59e0b' } }]);
      }

      case 'industry':
      case 'industryDistribution': {
        const data = id === 'industry' 
          ? this.ensureArray(salesData?.industry).map((i: any) => ({ name: i.industry, value: i.enquiry_count }))
          : this.industryDistribution();
        return premiumPie(toTopN(data, 13), 'Industry Distribution');
      }

      case 'tokenDistribution': {
        return premiumPie(toTopN(this.tokenDistribution(), 13), 'Token Distribution');
      }

      case 'bookingSourceDistribution': {
        return premiumPie(toTopN(this.bookingSourceDistribution(), 13), 'Booking Sources');
      }

      case 'campaignPerformance': {
        if (digitalCampaigns.length === 0) return null;
        return {
          ...premiumBar(digitalCampaigns.map(c => c.integration_name), [
            { name: 'Leads', data: digitalCampaigns.map(c => c.lead_count), itemStyle: { color: '#6366f1' } },
            { name: 'Site Visits', data: digitalCampaigns.map(c => c.site_visit_count), itemStyle: { color: '#f59e0b' } },
            { name: 'Bookings', data: digitalCampaigns.map(c => c.booking_count), itemStyle: { color: '#10b981' } }
          ]),
          legend: { bottom: 0, icon: 'circle' }
        } as any;
      }

      case 'ageRange': {
        const ageData = this.ensureArray(salesData?.age_range);
        if (ageData.length === 0) return null;
        return premiumLine(ageData.map(d => d.age_range), [{ name: 'Enquiries', data: ageData.map(d => d.enquiry_count) }]);
      }

      case 'nativePlace': {
        const nData = this.ensureArray(salesData?.native_place);
        if (nData.length === 0) return null;
        const data = toTopN(nData.map((n: any) => ({ name: n.native_place, value: n.enquiry_count })), 13);
        return premiumPie(data, 'Native Place');
      }

      case 'possessionRequired': {
        const pData = this.ensureArray(salesData?.possession_required);
        if (pData.length === 0) return null;
        return premiumLine(pData.map(d => d.possession_req), [{ name: 'Enquiries', data: pData.map(d => d.enquiry_count), itemStyle: { color: '#10b981' } }]);
      }

      case 'bookingStatus': {
        const bsData = (summaryData?.booking_statuses || []).filter(d => (d.unit_count || 0) > 0);
        const data = bsData.map(d => ({ name: d.booking_status, value: d.unit_count, color: d.color_code }));
        return premiumPie(data, 'Booking Status');
      }



      case 'bookingPlan': {
        const bpData = this.ensureArray(salesData?.booking_plan);
        if (bpData.length === 0) return null;
        return premiumBar(bpData.map(d => d.booking), [{ name: 'Enquiries', data: bpData.map(d => d.enquiry_count), itemStyle: { color: '#10b981' } }]);
      }

      case 'buyingPurpose': {
        const buyPData = this.ensureArray(salesData?.buying_purpose).filter(d => d.enquiry_count > 0);
        const data = buyPData.map(d => ({ name: d.buying_purpose, value: d.enquiry_count }));
        return premiumPie(data, 'Buying Purpose');
      }

      case 'salesLeadLevelDonut':
      case 'presaleLeadLevelDonut': {
        const levels = (id === 'presaleLeadLevelDonut' ? leadLevels : salesLeadLevels).filter(l => l.lead_level_count > 0);
        const data = levels.map(l => ({ name: l.lead_level, value: l.lead_level_count }));
        return premiumPie(data, 'Pipeline Distribution');
      }

      case 'sourceWiseBooking': {
        const swbData = summaryData?.source_wise_booking || [];
        if (swbData.length === 0) return null;
        const data = toTopN(swbData.map((s: any) => ({ name: s.source_name || 'N/A', value: s.booking_count || 0 })), 13);
        return premiumPie(data, 'Source Wise Booking');
      }

      case 'preferredLocation': {
        const pLocData = this.ensureArray(salesData?.preferred_location);
        if (pLocData.length === 0) return null;
        const data = toTopN(pLocData.map((p: any) => ({ name: p.preferred_location, value: p.enquiry_count })), 13);
        return premiumPie(data, 'Preferred Location');
      }

      // ─── INCHARGE-WISE CHARTS ────────────────────────────────────
      case 'inchargeTarget': {
        const td = this.inchargeTargetData();
        const fmtNum = (v: number) => v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        return {
          tooltip: {
            trigger: 'axis',
            ...premiumTooltip(),
            formatter: (params: any) => {
              let s = `<div style="font-weight:900;margin-bottom:6px;color:#1e293b">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                s += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
                  <span style="color:#64748b;font-size:11px">${p.seriesName}</span>
                  <span style="font-weight:800;color:#1e293b;margin-left:auto;padding-left:12px">${p.value.toLocaleString()}</span></div>`;
              });
              return s;
            }
          },
          grid: { top: 55, right: 15, bottom: 50, left: 65, containLabel: true },
          legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 10, fontWeight: 800, color: '#64748b' } },
          xAxis: { type: 'category', data: td.map(d => d.name), ...premiumAxis, axisTick: { show: false } } as any,
          yAxis: {
            type: 'value', ...premiumAxis,
            axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel },
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
          } as any,
          series: [
            {
              name: 'Target', type: 'bar', barWidth: '45%', data: td.map(d => d.target),
              itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#8b5cf6' }, { offset: 1, color: '#6366f1' }]) },
              label: { show: true, position: 'top', fontSize: 12, fontWeight: 900, color: '#6366f1', formatter: (p: any) => fmtNum(p.value) }
            },
            {
              name: 'Achievement', type: 'bar', barWidth: '45%', data: td.map(d => d.achievement),
              itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#34d399' }, { offset: 1, color: '#10b981' }]) },
              label: { show: true, position: 'top', fontSize: 12, fontWeight: 900, color: '#10b981', formatter: (p: any) => fmtNum(p.value) }
            }
          ]
        } as echarts.EChartsOption;
      }

      case 'inchargeBooking': {
        const bd = this.inchargeBookingData();
        const fmtNum = (v: number) => v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        const bookingColors: Record<string, { from: string; to: string }> = {
          Booking:    { from: '#818cf8', to: '#6366f1' },
          Agreement:  { from: '#34d399', to: '#10b981' },
          Disbursement: { from: '#fbbf24', to: '#f59e0b' },
          'Pend. Agreement': { from: '#fb7185', to: '#f43f5e' },
          'Pend. Disburse':  { from: '#f97316', to: '#ea580c' }
        };
        const seriesDef = [
          { name: 'Booking', key: 'booking' }, { name: 'Agreement', key: 'agreement' },
          { name: 'Disbursement', key: 'disbursement' }, { name: 'Pend. Agreement', key: 'pendingAgreement' },
          { name: 'Pend. Disburse', key: 'pendingDisbursement' }
        ];
        return {
          tooltip: {
            trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              let s = `<div style="font-weight:900;margin-bottom:6px;color:#1e293b">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                s += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                  <span style="color:#64748b;font-size:10px">${p.seriesName}</span>
                  <span style="font-weight:800;color:#1e293b;margin-left:auto;padding-left:8px">${p.value.toLocaleString()}</span></div>`;
              });
              return s;
            }
          },
          grid: { top: 40, right: 45, bottom: 40, left: 100, containLabel: true },
          legend: { 
            bottom: 0, icon: 'circle', itemWidth: 8, 
            textStyle: { fontSize: 9, fontWeight: 800, color: '#64748b' },
            data: seriesDef.map(s => s.name) // Exclude 'Total'
          },
          yAxis: { type: 'category', data: bd.map(d => d.name), ...premiumAxis, axisTick: { show: false } } as any,
          xAxis: {
            type: 'value', ...premiumAxis,
            axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel },
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
          } as any,
          series: [
            ...seriesDef.map(s => ({
              name: s.name, type: 'bar', stack: 'total', barWidth: '55%',
              data: bd.map((d: any) => d[s.key]),
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                  { offset: 0, color: bookingColors[s.name].from },
                  { offset: 1, color: bookingColors[s.name].to }
                ])
              },
              label: {
                show: true, position: 'inside', fontSize: 10, fontWeight: 900, color: '#fff',
                overflow: 'none',
                formatter: (p: any) => p.value > 0 ? fmtNum(p.value) : ''
              }
            })),
            {
              name: 'Total', type: 'bar', stack: 'total', data: bd.map(() => 0),
              label: {
                show: true, position: 'right', fontSize: 13, fontWeight: 900, color: '#0f172a',
                distance: 10,
                formatter: (p: any) => {
                  const d = bd[p.dataIndex] as any;
                  const total = seriesDef.reduce((acc, s) => acc + (d[s.key] || 0), 0);
                  return total > 0 ? fmtNum(total) : '';
                }
              },
              tooltip: { show: false }
            }
          ]
        } as echarts.EChartsOption;
      }

      case 'carpetVelocity': {
        const cd = this.carpetWiseUnits();
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        return {
          tooltip: {
            trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              let s = `<div style="font-weight:900;margin-bottom:6px;color:#1e293b">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                const suffix = p.seriesName === 'Velocity %' ? '%' : '';
                s += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                  <span style="color:#64748b;font-size:10px">${p.seriesName}</span>
                  <span style="font-weight:800;color:#1e293b;margin-left:auto;padding-left:8px">${p.value}${suffix}</span></div>`;
              });
              return s;
            }
          },
          grid: { top: 35, right: 50, bottom: 45, left: 60, containLabel: true },
          legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 9, fontWeight: 800, color: '#64748b' } },
          xAxis: { type: 'category', data: cd.map(d => d.carpet), ...premiumAxis, axisTick: { show: false } } as any,
          yAxis: {
            type: 'value', name: 'Units', nameTextStyle: { fontSize: 9, color: '#94a3b8' },
            ...premiumAxis, axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel },
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
          } as any,
          series: [
            {
              name: 'Total Units', type: 'bar', data: cd.map(d => d.totalUnits), barWidth: '25%',
              itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#818cf8' }, { offset: 1, color: '#6366f1' }]) },
              label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#6366f1', formatter: (p: any) => fmtNum(p.value) }
            },
            {
              name: 'Sold', type: 'bar', data: cd.map(d => d.soldUnits), barWidth: '25%',
              itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#34d399' }, { offset: 1, color: '#10b981' }]) },
              label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#10b981', formatter: (p: any) => fmtNum(p.value) }
            },
            {
              name: 'Unsold', type: 'bar', data: cd.map(d => d.unSoldUnits), barWidth: '25%',
              itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#fb7185' }, { offset: 1, color: '#f43f5e' }]) },
              label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#f43f5e', formatter: (p: any) => fmtNum(p.value) }
            }
          ]
        } as echarts.EChartsOption;
      }

      case 'inchargeTargetPie': {
        const td2 = this.inchargeTargetData();
        const pieSeries: { name: string; value: number }[] = [];
        td2.forEach(d => {
          pieSeries.push({ name: `${d.name} – Done`, value: d.achievement });
          pieSeries.push({ name: `${d.name} – Gap`, value: Math.max(0, d.target - d.achievement) });
        });
        const fmtNum = (v: number) => v >= 100000 ? `${(v/100000).toFixed(1)}L` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        const pieBase: any = premiumPie(pieSeries, 'Achievement Split');
        return {
          ...pieBase,
          series: [{
            ...pieBase.series[0],
            formatter: (p: any) => p.value > 0 ? `{name|${p.name}}\n{val|${fmtNum(p.value)}}` : '',
            rich: {
              name: { fontSize: 9, fontWeight: 800, color: '#64748b', padding: [2, 0] },
              val:  { fontSize: 11, fontWeight: 900, color: '#1e293b' }
            }
          }]
        } as echarts.EChartsOption;
      }

      // ─── PROJECT SUMMARY CHARTS ─────────────────────────────────
      case 'unitConfig': {
        const uc = this.unitConfigData();
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        return {
          tooltip: {
            trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              let s = `<div style="font-weight:900;margin-bottom:6px;color:#1e293b">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                s += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                  <span style="color:#64748b;font-size:11px">${p.seriesName}</span>
                  <span style="font-weight:800;color:#1e293b;margin-left:auto;padding-left:10px">${p.value.toLocaleString()}</span></div>`;
              });
              return s;
            }
          },
          grid: { top: 35, right: 10, bottom: 45, left: 60, containLabel: true },
          legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 10, fontWeight: 800, color: '#64748b' } },
          xAxis: { type: 'category', data: uc.map(d => d.config), ...premiumAxis, axisTick: { show: false } } as any,
          yAxis: {
            type: 'value', ...premiumAxis,
            axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel },
            splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
          } as any,
          series: [
            {
              name: 'Total Count', type: 'bar', data: uc.map(d => d.count), barWidth: '22%',
              itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#818cf8'},{offset:1,color:'#6366f1'}]) },
              label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#6366f1', formatter: (p: any) => fmtNum(p.value) }
            },
            {
              name: 'Booked', type: 'bar', data: uc.map(d => d.booked), barWidth: '22%',
              itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#34d399'},{offset:1,color:'#10b981'}]) },
              label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#10b981', formatter: (p: any) => fmtNum(p.value) }
            },
            {
              name: 'Available', type: 'bar', data: uc.map(d => d.available), barWidth: '22%',
              itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#fbbf24'},{offset:1,color:'#f59e0b'}]) },
              label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#d97706', formatter: (p: any) => fmtNum(p.value) }
            }
          ]
        } as echarts.EChartsOption;
      }

      case 'tokenType': {
        const tt = this.tokenTypeData();
        const data = tt.map(t => ({ name: t.type, value: t.count }));
        return premiumPie(data, 'Token Type Distribution');
      }

      case 'presalePipeline': {
        const pp = this.presalePipelineData();
        const stages = [
          { name: 'Site Visits', value: pp.totalPresalesVisit },
          { name: 'Token',       value: pp.token },
          { name: 'Booking',     value: pp.booking },
          { name: 'Agreement',   value: pp.agreement },
          { name: 'Disbursement',value: pp.disbursement },
          { name: 'Pend. Agr.',  value: pp.pendingAgreement },
          { name: 'Pend. Disb.', value: pp.pendingDisbursement }
        ];
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        const stageColors = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#06b6d4','#f43f5e','#f97316'];
        return {
          tooltip: {
            trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              const p = params[0];
              return `<div style="font-weight:900;color:#1e293b;margin-bottom:4px">${p.axisValue}</div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                  <span style="color:#64748b;font-size:11px">Count</span>
                  <span style="font-weight:800;color:#1e293b;margin-left:auto;padding-left:10px">${p.value.toLocaleString()}</span></div>`;
            }
          },
          grid: { top: 10, right: 80, bottom: 10, left: 10, containLabel: true },
          xAxis: { type: 'value', ...premiumAxis, axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } } as any,
          yAxis: { type: 'category', data: stages.map(s => s.name), ...premiumAxis, axisTick: { show: false } } as any,
          series: [{
            type: 'bar', data: stages.map((s, i) => ({
              value: s.value,
              itemStyle: { borderRadius: [0,6,6,0], color: new echarts.graphic.LinearGradient(1,0,0,0,[{offset:0,color:stageColors[i]},{offset:1,color:stageColors[i]+'88'}]) }
            })),
            barWidth: '55%',
            label: { show: true, position: 'right', fontSize: 11, fontWeight: 900, color: '#475569', formatter: (p: any) => fmtNum(p.value) }
          }]
        } as echarts.EChartsOption;
      }

      case 'leadSource': {
        const ls = this.leadSourceData().filter(d => d.count > 0);
        const data = ls.map(d => ({ name: d.source, value: d.count }));
        return premiumPie(data, 'Lead Source Distribution');
      }

      case 'projectWise': {
        const pw = this.projectWiseUnits();
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        return {
          tooltip: {
            trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              let s = `<div style="font-weight:900;margin-bottom:6px;color:#1e293b">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                s += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                  <span style="color:#64748b;font-size:11px">${p.seriesName}</span>
                  <span style="font-weight:800;color:#1e293b;margin-left:auto;padding-left:10px">${p.value.toLocaleString()}</span></div>`;
              });
              return s;
            }
          },
          grid: { top: 35, right: 10, bottom: 45, left: 60, containLabel: true },
          legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 10, fontWeight: 800, color: '#64748b' } },
          xAxis: { type: 'category', data: pw.map(d => d.project), ...premiumAxis, axisTick: { show: false } } as any,
          yAxis: { type: 'value', ...premiumAxis, axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } } as any,
          series: [
            { name: 'Total Units', type: 'bar', data: pw.map(d => d.totalUnits), barWidth: '18%', itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#818cf8'},{offset:1,color:'#6366f1'}]) }, label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#6366f1', formatter: (p: any) => fmtNum(p.value) } },
            { name: 'Sold',        type: 'bar', data: pw.map(d => d.soldUnits), barWidth: '18%', itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#34d399'},{offset:1,color:'#10b981'}]) }, label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#10b981', formatter: (p: any) => fmtNum(p.value) } },
            { name: 'Available',   type: 'bar', data: pw.map(d => d.availableUnits), barWidth: '18%', itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#fbbf24'},{offset:1,color:'#f59e0b'}]) }, label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#d97706', formatter: (p: any) => fmtNum(p.value) } },
            { name: 'Hold',        type: 'bar', data: pw.map(d => d.holdUnits), barWidth: '18%', itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#fb7185'},{offset:1,color:'#f43f5e'}]) }, label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#f43f5e', formatter: (p: any) => fmtNum(p.value) } }
          ]
        } as echarts.EChartsOption;
      }

      case 'bookingCancelled': {
        const bc = this.bookingCancelledData();
        const data = [
          { name: 'Booked',    value: bc.booked },
          { name: 'Cancelled', value: bc.cancelled }
        ];
        return premiumPie(data, 'Booking vs Cancelled');
      }

      case 'monthlyBookingTrend': {
        const mbt = this.monthlyBookingTrend();
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        return {
          tooltip: { trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              let s = `<div style="font-weight:900;margin-bottom:6px;color:#1e293b">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                s += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                  <span style="color:#64748b;font-size:11px">${p.seriesName}</span>
                  <span style="font-weight:800;color:#1e293b;margin-left:auto;padding-left:10px">${p.value.toLocaleString()}</span></div>`;
              });
              return s;
            }
          },
          legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 10, fontWeight: 800, color: '#64748b' } },
          grid: { top: 70, right: 20, bottom: 75, left: 55, containLabel: true },
          xAxis: { 
            type: 'category', 
            data: mbt.map(d => d.month), 
            ...premiumAxis, 
            axisTick: { show: false },
            axisLabel: { ...premiumAxis.axisLabel, margin: 35, fontWeight: 800, color: '#475569' }
          } as any,
          yAxis: { type: 'value', ...premiumAxis, axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } } as any,
          series: [
            {
              name: 'Site Visits', type: 'bar', data: mbt.map(d => d.visits), barWidth: '22%',
              itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#818cf8'},{offset:1,color:'#6366f1'}]) },
              label: { 
                show: true, position: 'top', distance: 10,
                backgroundColor: '#f8fafc', borderColor: '#6366f1', borderWidth: 1, borderRadius: 4, padding: [3, 6],
                fontSize: 10, fontWeight: 900, color: '#4338ca', formatter: (p: any) => fmtNum(p.value),
                shadowBlur: 5, shadowColor: 'rgba(0,0,0,0.1)'
              }
            },
            {
              name: 'Tokens', type: 'line', data: mbt.map(d => d.tokens), smooth: true, yAxisIndex: 0,
              lineStyle: { width: 3, color: '#f59e0b', shadowColor: '#f59e0b44', shadowBlur: 10, shadowOffsetY: 4 },
              symbol: 'circle', symbolSize: 8,
              itemStyle: { color: '#f59e0b', borderWidth: 2, borderColor: '#fff' },
              label: { 
                show: true, position: 'top', distance: 15,
                backgroundColor: '#fffbeb', borderColor: '#f59e0b', borderWidth: 1, borderRadius: 4, padding: [2, 4],
                fontSize: 9, fontWeight: 900, color: '#b45309', formatter: (p: any) => fmtNum(p.value),
                shadowBlur: 4, shadowColor: 'rgba(245, 158, 11, 0.2)'
              }
            },
            {
              name: 'Bookings', type: 'line', data: mbt.map(d => d.bookings), smooth: true,
              lineStyle: { width: 3, color: '#10b981', shadowColor: '#10b98144', shadowBlur: 10, shadowOffsetY: 4 },
              symbol: 'circle', symbolSize: 8,
              itemStyle: { color: '#10b981', borderWidth: 2, borderColor: '#fff' },
              label: { 
                show: true, position: 'bottom', distance: 15,
                backgroundColor: '#f0fdf4', borderColor: '#10b981', borderWidth: 1, borderRadius: 4, padding: [2, 4],
                fontSize: 9, fontWeight: 900, color: '#047857', formatter: (p: any) => fmtNum(p.value),
                shadowBlur: 4, shadowColor: 'rgba(16, 185, 129, 0.2)'
              }
            }
          ]
        } as echarts.EChartsOption;
      }

      case 'bhkSellThrough': {
        const bst = this.bhkSellThrough();
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        const segColors = ['#6366f1','#10b981','#f59e0b','#f43f5e'];
        return {
          tooltip: { trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              const d = bst[params[0].dataIndex];
              return `<div style="font-weight:900;color:#1e293b;margin-bottom:6px">${d.config}</div>
                <div style="display:flex;gap:6px;flex-direction:column">
                  <div>Total: <strong>${d.total.toLocaleString()}</strong></div>
                  <div>Booked: <strong style="color:#10b981">${d.booked.toLocaleString()}</strong></div>
                  <div>Sell-Through: <strong style="color:#6366f1">${d.pct}%</strong></div></div>`;
            }
          },
          grid: { top: 20, right: 140, bottom: 20, left: 10, containLabel: true },
          xAxis: { type: 'value', max: 100, ...premiumAxis, axisLabel: { show: false }, splitLine: { show: false } } as any,
          yAxis: { type: 'category', data: bst.map((d: any) => d.config), ...premiumAxis, axisTick: { show: false } } as any,
          series: [
            {
              name: 'Track', type: 'bar', data: bst.map(() => 100), barWidth: '40%', barGap: '-100%',
              itemStyle: { color: '#f1f5f9', borderRadius: 10 },
              silent: true,
              label: {
                show: true, position: 'right', distance: 15,
                formatter: (p: any) => {
                  const d = bst[p.dataIndex];
                  return `{bk|${d.booked}}{sep|/}{tot|${d.total}} {pct|${d.pct}%}`;
                },
                rich: {
                  bk: { fontSize: 13, fontWeight: 950, color: '#0f172a' },
                  sep: { fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: [0, 2] },
                  tot: { fontSize: 11, fontWeight: 800, color: '#64748b' },
                  pct: { fontSize: 14, fontWeight: 950, color: '#1e293b', padding: [0, 0, 0, 10] }
                }
              }
            },
            {
              name: 'Booked', type: 'bar', data: bst.map((d: any, i: number) => ({
                value: d.pct,
                itemStyle: { borderRadius: 10, color: new echarts.graphic.LinearGradient(1,0,0,0,[{offset:0,color:segColors[i]},{offset:1,color:segColors[i]+'99'}]) }
              })), barWidth: '40%'
            }
          ]
        } as echarts.EChartsOption;
      }

      case 'conversionFunnel': {
        const cf = this.conversionFunnelData();
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        const funnelColors = ['#6366f1','#8b5cf6','#f59e0b','#10b981','#06b6d4','#f43f5e'];
        return {
          tooltip: { trigger: 'item', ...premiumTooltip(),
            formatter: (params: any) => {
              const prev = cf[params.dataIndex - 1];
              const dropPct = prev ? Math.round((1 - params.value / prev.value) * 100) : 0;
              return `<div style="font-weight:900;color:#1e293b;margin-bottom:6px">${params.name}</div>
                <div>Count: <strong>${params.value.toLocaleString()}</strong></div>
                ${prev ? `<div style="color:#f43f5e">Drop: ${dropPct}% from ${prev.stage}</div>` : ''}`;
            }
          },
          series: [{
            type: 'funnel',
            left: '10%', width: '50%', top: 20, bottom: 40,
            minSize: '10%', maxSize: '100%',
            sort: 'descending',
            gap: 4,
            label: {
              show: true, position: 'right', fontSize: 10, fontWeight: 900, color: '#1e293b',
              formatter: '{name|{b}}\n{val|{c}}',
              rich: {
                name: { fontSize: 10, fontWeight: 800, color: '#64748b', padding: [4, 0] },
                val:  { fontSize: 14, fontWeight: 950, color: '#0f172a' }
              }
            },
            labelLine: { show: true, length: 30, lineStyle: { width: 1.5, color: '#cbd5e1' } },
            itemStyle: { borderWidth: 0, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.1)' },
            data: cf.map((d, i) => ({
              name: d.stage, value: d.value,
              itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:funnelColors[i]+'cc'},{offset:1,color:funnelColors[i]}]) }
            }))
          }]
        } as echarts.EChartsOption;
      }

      case 'projectConRatio': {
        const pcr = this.projectConRatioData();
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        return {
          tooltip: { trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              const d = pcr.find(x => x.project === params[0].axisValue)!;
              return `<div style="font-weight:900;color:#1e293b;margin-bottom:6px">${d.project}</div>
                <div>Enquiries: <strong>${d.enquiries.toLocaleString()}</strong></div>
                <div>Bookings: <strong style="color:#10b981">${d.bookings.toLocaleString()}</strong></div>
                <div>Con Rate: <strong style="color:#6366f1">${d.pct}%</strong></div>`;
            }
          },
          grid: { top: 30, right: 20, bottom: 35, left: 55, containLabel: true },
          legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 10, fontWeight: 800, color: '#64748b' } },
          xAxis: { type: 'category', data: pcr.map(d => d.project), ...premiumAxis, axisTick: { show: false } } as any,
          yAxis: { type: 'value', ...premiumAxis, axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } } as any,
          series: [
            { name: 'Enquiries', type: 'bar', data: pcr.map(d => d.enquiries), barWidth: '28%', itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#818cf8'},{offset:1,color:'#6366f1'}]) }, label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#6366f1', formatter: (p: any) => fmtNum(p.value) } },
            { name: 'Bookings',  type: 'bar', data: pcr.map(d => d.bookings), barWidth: '28%', itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#34d399'},{offset:1,color:'#10b981'}]) }, label: { show: true, position: 'top', fontSize: 11, fontWeight: 900, color: '#10b981', formatter: (p: any) => fmtNum(p.value) } }
          ]
        } as echarts.EChartsOption;
      }

      case 'sourceWiseActivity': {
        const swb = this.sourceWiseBookingData();
        const fmtNum = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : `${v}`;
        return {
          tooltip: { trigger: 'axis', ...premiumTooltip(),
            formatter: (params: any) => {
              let s = `<div style="font-weight:900;margin-bottom:6px;color:#1e293b">${params[0].axisValue}</div>`;
              params.forEach((p: any) => {
                s += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                  <span style="color:#64748b;font-size:11px">${p.seriesName}</span>
                  <span style="font-weight:800;color:#1e293b;margin-left:auto;padding-left:10px">${p.value.toLocaleString()}</span></div>`;
              });
              return s;
            }
          },
          legend: { bottom: 0, icon: 'circle', itemWidth: 8, textStyle: { fontSize: 10, fontWeight: 800, color: '#64748b' } },
          grid: { top: 40, right: 10, bottom: 45, left: 60, containLabel: true },
          xAxis: { type: 'category', data: swb.map(d => d.source), ...premiumAxis, axisTick: { show: false } } as any,
          yAxis: { type: 'value', ...premiumAxis, axisLabel: { formatter: fmtNum, ...premiumAxis.axisLabel }, splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } } } as any,
          series: [
            { 
              name: 'Site Visits', type: 'bar', data: swb.map(d => d.visits), barWidth: '22%',
              itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#818cf8'},{offset:1,color:'#6366f1'}]) }, 
              label: { show: true, position: 'top', fontSize: 9, fontWeight: 950, color: '#6366f1', formatter: (p: any) => fmtNum(p.value) } 
            },
            { 
              name: 'Tokens', type: 'bar', data: swb.map(d => d.tokens), barWidth: '22%',
              itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#fbbf24'},{offset:1,color:'#f59e0b'}]) }, 
              label: { show: true, position: 'top', fontSize: 9, fontWeight: 950, color: '#d97706', formatter: (p: any) => fmtNum(p.value) } 
            },
            { 
              name: 'Bookings', type: 'bar', data: swb.map(d => d.bookings), barWidth: '22%',
              itemStyle: { borderRadius: [6,6,0,0], color: new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'#34d399'},{offset:1,color:'#10b981'}]) }, 
              label: { show: true, position: 'top', fontSize: 9, fontWeight: 950, color: '#10b981', formatter: (p: any) => fmtNum(p.value) } 
            }
          ]
        } as echarts.EChartsOption;
      }

      default: options = null;
    }

    return options;
  }

  downloadChart(id: string): void {
    const chart = this.chartInstances.get(id);
    if (chart) {
      const url = chart.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      const a = document.createElement('a');
      a.download = `${id}_${new Date().getTime()}.png`;
      a.href = url;
      a.click();
    }
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