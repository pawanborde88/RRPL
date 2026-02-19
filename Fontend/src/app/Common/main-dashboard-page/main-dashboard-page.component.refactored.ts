import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
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
import { Chart, registerables } from 'chart.js';
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
import { ChartService } from './services/chart.service';
import { DashboardStore } from './store/dashboard.store';

Chart.register(...registerables);

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
    StatusColorPipe,
    GreetingPipe,
    AutocompleteReusableComponent,
    DatePipe
  ],
  providers: [DashboardStore, DashboardFacade, ChartService],
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
  private readonly chartService = inject(ChartService);
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
  // UI STATE
  // ============================================
  readonly statusPeriod = signal<string>('Last year');
  readonly revenuePeriod = signal<string>('Last year');
  
  // ============================================
  // VIEW CHILD REFERENCES
  // ============================================
  @ViewChild('kpiChart1', { static: false }) kpiChart1Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('kpiChart2', { static: false }) kpiChart2Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('kpiChart3', { static: false }) kpiChart3Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('kpiChart4', { static: false }) kpiChart4Ref!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart', { static: false }) statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart', { static: false }) revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priceByTypeChart', { static: false }) priceByTypeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('comboChart', { static: false }) comboChartRef!: ElementRef<HTMLCanvasElement>;
  
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
    const summaryData = this.allProjectSummaryData();
    return summaryData?.floor_unit_count || summaryData?.project_count || 0;
  });
  
  readonly assetValue = computed(() => {
    const summaryData = this.allProjectSummaryData();
    return summaryData?.total_value || 0;
  });
  
  readonly propertiesSold = computed(() => {
    const summaryData = this.allProjectSummaryData();
    return summaryData?.booking_count || 0;
  });
  
  readonly newClients = computed(() => {
    const enquiryData = this.enquiryFlowData();
    return enquiryData?.data?.enquiries || enquiryData?.enquiries || 0;
  });
  
  // ============================================
  // TRACK BY FUNCTIONS
  // ============================================
  readonly trackByMetricId: TrackByFunction<HeaderMetric> = (_, metric) => metric.id;
  
  // ============================================
  // PRIVATE STATE
  // ============================================
  private timeUpdateIntervalId: ReturnType<typeof setInterval> | null = null;
  private chartInitializationTimeout: ReturnType<typeof setTimeout> | null = null;
  
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
    this.setupEffects();
  }
  
  ngAfterViewInit(): void {
    this.chartInitializationTimeout = setTimeout(() => {
      this.initializeCharts();
    }, 0);
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
  
  private setupEffects(): void {
    // Effect to update charts when data changes
    effect(() => {
      const salesData = this.salesReportsData();
      const enquiryData = this.enquiryFlowData();
      const summaryData = this.allProjectSummaryData();
      
      // Only update if we have data and charts are initialized
      if (salesData || enquiryData || summaryData) {
        untracked(() => {
          setTimeout(() => this.updateChartsWithAPIData(), 100);
        });
      }
    });
  }
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  onProjectChange(projectIds: number[] | null): void {
    this.facade.setSelectedProject(projectIds);
    
    const startDate = this.filterForm.get('start_date')?.value;
    const endDate = this.filterForm.get('end_date')?.value;
    
    if (projectIds && projectIds.length > 0 && startDate && endDate) {
      this.fetchDashboardData();
    }
  }
  
  onDateRangeChange(): void {
    const projectIds = this.filterForm.get('project_id')?.value;
    const startDate = this.filterForm.get('start_date')?.value;
    const endDate = this.filterForm.get('end_date')?.value;
    
    if (projectIds && projectIds.length > 0 && startDate && endDate) {
      this.fetchDashboardData();
    }
  }
  
  fetchDashboardData(): void {
    const projectIdsValue = this.filterForm.get('project_id')?.value;
    const startDateValue = this.filterForm.get('start_date')?.value;
    const endDateValue = this.filterForm.get('end_date')?.value;
    
    let projectIds: number[] = [];
    if (Array.isArray(projectIdsValue)) {
      projectIds = projectIdsValue;
    } else if (projectIdsValue !== null && projectIdsValue !== undefined) {
      projectIds = [projectIdsValue];
    }
    
    if (projectIds.length === 0 || !startDateValue || !endDateValue) {
      return;
    }
    
    const startDate = this.formatDate(startDateValue);
    const endDate = this.formatDate(endDateValue);
    const telecallerIds = this.filterForm.get('telecaller_id')?.value || [];
    const salesExecutiveIds = this.filterForm.get('sales_executive_id')?.value || [];
    
    this.facade.fetchDashboardData({
      projectIds,
      startDate,
      endDate,
      telecallerIds: telecallerIds.length > 0 ? telecallerIds : undefined,
      salesExecutiveIds: salesExecutiveIds.length > 0 ? salesExecutiveIds : undefined
    });
  }
  
  onStatusPeriodChange(period: string): void {
    this.statusPeriod.set(period);
    this.fetchDashboardData();
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
  
  // ============================================
  // CHART MANAGEMENT
  // ============================================
  private initializeCharts(): void {
    this.chartService.applyTheme();
    requestAnimationFrame(() => {
      this.createKPICharts();
      this.createStatusChart();
      this.createRevenueChart();
      this.createPriceByTypeChart();
      this.createComboChart();
    });
  }
  
  private updateChartsWithAPIData(): void {
    // Update status chart (Lead Level)
    const statusData = this.getStatusChartDataFromAPI();
    if (statusData && statusData.data && statusData.data.length > 0) {
      this.chartService.updateChart('statusChart', (chart) => {
        chart.data.labels = statusData.labels;
        chart.data.datasets[0].data = statusData.data;
        chart.data.datasets[0].backgroundColor = statusData.colors;
      });
    } else if (this.statusChartRef?.nativeElement && !this.chartService.getChart('statusChart')) {
      this.createStatusChart();
    }
    
    // Update revenue chart (Source Distribution)
    const revenueData = this.getRevenueChartDataFromAPI();
    if (revenueData && revenueData.labels && revenueData.labels.length > 0) {
      this.chartService.updateChart('revenueChart', (chart) => {
        chart.data.labels = revenueData.labels;
        chart.data.datasets[0].data = revenueData.enquiryData;
        if (chart.data.datasets.length > 1) {
          chart.data.datasets[1].data = revenueData.followupData;
        }
      });
    } else if (this.revenueChartRef?.nativeElement && !this.chartService.getChart('revenueChart')) {
      this.createRevenueChart();
    }
    
    // Update other charts
    this.updateOtherCharts();
    
    // Update combo chart
    const enquiryData = this.enquiryFlowData();
    if (enquiryData?.data) {
      const flowData = enquiryData.data;
      const data = [
        flowData.enquiries || 0,
        flowData.tokens || 0,
        flowData.bookings || 0,
        flowData.booking_agreements || 0,
        flowData.disbursements || 0
      ];
      this.chartService.updateChart('comboChart', (chart) => {
        chart.data.datasets[0].data = data;
      });
    } else if (this.comboChartRef?.nativeElement && !this.chartService.getChart('comboChart')) {
      this.createComboChart();
    }
  }
  
  private createKPICharts(): void {
    // KPI Chart 1 - Booking percentage
    this.chartService.createChart('kpiChart1', this.kpiChart1Ref, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [85, 15],
          backgroundColor: ['#4f46e5', '#f1f5f9'],
          borderWidth: 0,
          spacing: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: { duration: 2000, easing: 'easeOutQuart' }
      }
    });
    
    // KPI Chart 2 - Bookings trend
    this.chartService.createChart('kpiChart2', this.kpiChart2Ref, {
      type: 'bar',
      data: {
        labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        datasets: [{
          data: [35, 59, 80, 81, 56, 55, 40],
          backgroundColor: '#3b82f6',
          borderRadius: 4,
          barThickness: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true }
        }
      }
    });
    
    // KPI Chart 3 - Enquiry flow
    const enquiryData = this.enquiryFlowData();
    const flowData = enquiryData?.data || {};
    const flowChartData = [
      flowData.enquiries || 0,
      flowData.tokens || 0,
      flowData.bookings || 0,
      flowData.booking_agreements || 0,
      flowData.disbursements || 0
    ];
    
    this.chartService.createChart('kpiChart3', this.kpiChart3Ref, {
      type: 'line',
      data: {
        labels: ['E', 'T', 'B', 'A', 'D'],
        datasets: [{
          data: flowChartData.length > 0 ? flowChartData : [0, 0, 0, 0, 0],
          borderColor: '#10b981',
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.4,
          fill: true,
          backgroundColor: 'rgba(16, 185, 129, 0.1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true }
        }
      }
    });
    
    // KPI Chart 4 - Asset value trend
    this.chartService.createChart('kpiChart4', this.kpiChart4Ref, {
      type: 'bar',
      data: {
        labels: ['1', '2', '3', '4', '5'],
        datasets: [{
          data: [28, 48, 40, 19, 86],
          backgroundColor: '#f59e0b',
          borderRadius: 4,
          barThickness: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true }
        }
      }
    });
  }
  
  private createStatusChart(): void {
    const statusData = this.getStatusChartDataFromAPI();
    const labels = statusData?.labels || [];
    const data = statusData?.data || [];
    const colors = statusData?.colors || ['#6366f1', '#f43f5e', '#ec4899', '#10b981', '#f59e0b'];
    
    this.chartService.createChart('statusChart', this.statusChartRef, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 25,
              usePointStyle: true,
              font: { size: 12, weight: '600' }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const total = data.reduce((a: number, b: number) => a + b, 0);
                if (total === 0) return ` ${context.label}: 0`;
                const percent = ((context.parsed / total) * 100).toFixed(1);
                return ` ${context.label}: ${context.parsed} (${percent}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  private createRevenueChart(): void {
    const revenueData = this.getRevenueChartDataFromAPI();
    const labels = revenueData?.labels || [];
    const enquiryData = revenueData?.enquiryData || [];
    const followupData = revenueData?.followupData || [];
    
    const canvas = this.revenueChartRef?.nativeElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const enquiryGradient = ctx.createLinearGradient(0, 0, 0, 400);
    enquiryGradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
    enquiryGradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
    
    const followupGradient = ctx.createLinearGradient(0, 0, 0, 400);
    followupGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
    followupGradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
    
    this.chartService.createChart('revenueChart', this.revenueChartRef, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [
          {
            label: 'Enquiry Count',
            data: enquiryData.length > 0 ? enquiryData : [0],
            backgroundColor: enquiryGradient,
            borderColor: '#4f46e5',
            borderWidth: 1,
            borderRadius: 8,
            barThickness: 15
          },
          {
            label: 'Followup Count',
            data: followupData.length > 0 ? followupData : [0],
            backgroundColor: followupGradient,
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 8,
            barThickness: 15
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 10,
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(226, 232, 240, 0.5)',
              drawTicks: false
            },
            ticks: { padding: 10 }
          }
        }
      }
    });
  }
  
  private createPriceByTypeChart(): void {
    const summaryData = this.allProjectSummaryData();
    const unitCount = summaryData?.unit_count || [];
    const labels = unitCount.length > 0 ? unitCount.map((item: any) => item.unit_type || 'Unknown') : ['No Data'];
    const bookedData = unitCount.length > 0 ? unitCount.map((item: any) => item.book_unit || 0) : [0];
    const availableData = unitCount.length > 0 ? unitCount.map((item: any) => item.available_unit || 0) : [0];
    
    this.chartService.createChart('priceByTypeChart', this.priceByTypeChartRef, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Booked Units',
            data: bookedData,
            backgroundColor: '#6366f1',
            borderRadius: 8,
            barThickness: 30
          },
          {
            label: 'Available Units',
            data: availableData,
            backgroundColor: '#10b981',
            borderRadius: 8,
            barThickness: 30
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (context: any) => ` ${context.dataset.label}: ${context.parsed.x}`
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              color: 'rgba(226, 232, 240, 0.5)',
              drawTicks: false
            }
          },
          y: {
            grid: { display: false },
            ticks: { font: { weight: '600' } }
          }
        }
      }
    });
  }
  
  private createComboChart(): void {
    const enquiryData = this.enquiryFlowData();
    const flowData = enquiryData?.data || {};
    
    const labels = ['Enquiries', 'Tokens', 'Bookings', 'Agreements', 'Disbursements'];
    const data = [
      flowData.enquiries || 0,
      flowData.tokens || 0,
      flowData.bookings || 0,
      flowData.booking_agreements || 0,
      flowData.disbursements || 0
    ];
    
    this.chartService.createChart('comboChart', this.comboChartRef, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Enquiry Flow',
          type: 'bar',
          data: data,
          backgroundColor: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'],
          borderRadius: 8,
          barThickness: 30
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(226, 232, 240, 0.5)' }
          }
        }
      }
    });
  }
  
  private updateOtherCharts(): void {
    const summaryData = this.allProjectSummaryData();
    const enquiryData = this.enquiryFlowData();
    
    // Update KPI chart 1 (Booking percentage)
    if (summaryData) {
      const totalUnits = summaryData.floor_unit_count || 0;
      const bookedUnits = summaryData.booking_count || 0;
      const bookingPercentage = totalUnits > 0 ? Math.round((bookedUnits / totalUnits) * 100) : 0;
      
      this.chartService.updateChart('kpiChart1', (chart) => {
        chart.data.datasets[0].data = [bookingPercentage, 100 - bookingPercentage];
      });
    }
    
    // Update KPI chart 3 (Enquiry flow trend)
    if (enquiryData?.data) {
      const flowData = [
        enquiryData.data.enquiries || 0,
        enquiryData.data.tokens || 0,
        enquiryData.data.bookings || 0,
        enquiryData.data.booking_agreements || 0,
        enquiryData.data.disbursements || 0
      ];
      
      this.chartService.updateChart('kpiChart3', (chart) => {
        chart.data.datasets[0].data = flowData;
      });
    }
    
    // Update price by type chart
    if (summaryData?.unit_count && Array.isArray(summaryData.unit_count)) {
      const labels = summaryData.unit_count.map((item: any) => item.unit_type || 'Unknown');
      const bookedData = summaryData.unit_count.map((item: any) => item.book_unit || 0);
      const availableData = summaryData.unit_count.map((item: any) => item.available_unit || 0);
      
      this.chartService.updateChart('priceByTypeChart', (chart) => {
        chart.data.labels = labels;
        if (chart.data.datasets.length >= 2) {
          chart.data.datasets[0].data = bookedData;
          chart.data.datasets[1].data = availableData;
        } else {
          chart.data.datasets[0].data = bookedData;
        }
      });
    }
  }
  
  // ============================================
  // DATA TRANSFORMERS
  // ============================================
  private getStatusChartDataFromAPI(): { labels: string[]; data: number[]; colors: string[] } | null {
    const salesData = this.salesReportsData();
    
    if (salesData?.lead_level && Array.isArray(salesData.lead_level)) {
      const leadLevels = salesData.lead_level.filter((item: any) => item.lead_level_count > 0);
      const labels = leadLevels.map((item: any) => item.lead_level || 'Unknown');
      const data = leadLevels.map((item: any) => item.lead_level_count || 0);
      const colors = [
        '#6366f1', '#f43f5e', '#ec4899', '#10b981', '#f59e0b', 
        '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16', '#f97316'
      ];
      return { labels, data, colors: colors.slice(0, labels.length) };
    }
    
    return null;
  }
  
  private getRevenueChartDataFromAPI(): { labels: string[]; enquiryData: number[]; followupData: number[] } | null {
    const salesData = this.salesReportsData();
    
    if (salesData?.source && Array.isArray(salesData.source)) {
      const sources = salesData.source.filter((item: any) => item.enquiry_count > 0 || item.followup_count > 0);
      const labels = sources.map((item: any) => item.source || 'Unknown');
      const enquiryData = sources.map((item: any) => item.enquiry_count || 0);
      const followupData = sources.map((item: any) => item.followup_count || 0);
      return { labels, enquiryData, followupData };
    }
    
    return null;
  }
  
  private buildHeaderMetrics(): HeaderMetric[] {
    const salesData = this.salesReportsData();
    const enquiryData = this.enquiryFlowData();
    const summaryData = this.allProjectSummaryData();
    
    const totalEnquiries = salesData?.total_enquiry_count || 0;
    const totalBookings = enquiryData?.data?.bookings || summaryData?.booking_count || 0;
    const totalTokens = enquiryData?.data?.tokens || salesData?.token_count || 0;
    const unassignedCount = salesData?.unassigned_count || 0;
    
    return [
      {
        id: 'total-enquiries',
        title: 'Total Enquiries',
        description: 'Total enquiries received',
        value: totalEnquiries.toLocaleString('en-IN'),
        change: '+0%',
        trend: 'neutral' as const,
        baseline: 'Current period',
        icon: 'inbox'
      },
      {
        id: 'total-bookings',
        title: 'Total Bookings',
        description: 'Total bookings completed',
        value: totalBookings.toLocaleString('en-IN'),
        change: '+0%',
        trend: 'neutral' as const,
        baseline: 'Current period',
        icon: 'check_circle'
      },
      {
        id: 'total-tokens',
        title: 'Tokens',
        description: 'Total tokens issued',
        value: totalTokens.toLocaleString('en-IN'),
        change: '+0%',
        trend: 'neutral' as const,
        baseline: 'Current period',
        icon: 'confirmation_number'
      },
      {
        id: 'unassigned',
        title: 'Unassigned',
        description: 'Unassigned enquiries',
        value: unassignedCount.toLocaleString('en-IN'),
        change: '+0%',
        trend: 'neutral' as const,
        baseline: 'Current period',
        icon: 'person_off'
      }
    ];
  }
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  private formatDate(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  getMetricAccentBarClasses(trend: HeaderMetric['trend']): string {
    const cacheKey = `accent-${trend}`;
    if (this.metricClassesCache.has(cacheKey)) {
      return this.metricClassesCache.get(cacheKey)!;
    }
    
    let classes: string;
    switch (trend) {
      case 'up':
        classes = 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-transparent';
        break;
      case 'down':
        classes = 'bg-gradient-to-r from-rose-400 via-rose-300 to-transparent';
        break;
      default:
        classes = 'bg-gradient-to-r from-slate-300 via-slate-200 to-transparent';
    }
    
    this.metricClassesCache.set(cacheKey, classes);
    return classes;
  }
  
  getMetricIconClasses(trend: HeaderMetric['trend']): string {
    const cacheKey = `icon-${trend}`;
    if (this.metricClassesCache.has(cacheKey)) {
      return this.metricClassesCache.get(cacheKey)!;
    }
    
    let classes: string;
    switch (trend) {
      case 'up':
        classes = 'bg-gradient-to-br from-emerald-50 via-white to-white text-emerald-600 ring-emerald-100';
        break;
      case 'down':
        classes = 'bg-gradient-to-br from-rose-50 via-white to-white text-rose-600 ring-rose-100';
        break;
      default:
        classes = 'bg-gradient-to-br from-slate-50 via-white to-white text-slate-600 ring-slate-100';
    }
    
    this.metricClassesCache.set(cacheKey, classes);
    return classes;
  }
  
  getTrendDotClasses(trend: HeaderMetric['trend']): string {
    const cacheKey = `dot-${trend}`;
    if (this.metricClassesCache.has(cacheKey)) {
      return this.metricClassesCache.get(cacheKey)!;
    }
    
    let classes: string;
    switch (trend) {
      case 'up':
        classes = 'bg-emerald-500';
        break;
      case 'down':
        classes = 'bg-rose-500';
        break;
      default:
        classes = 'bg-slate-400';
    }
    
    this.metricClassesCache.set(cacheKey, classes);
    return classes;
  }
  
  getTrendBadgeClasses(trend: HeaderMetric['trend']): string {
    const cacheKey = `badge-${trend}`;
    if (this.metricClassesCache.has(cacheKey)) {
      return this.metricClassesCache.get(cacheKey)!;
    }
    
    const baseClasses = 'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold';
    let classes: string;
    switch (trend) {
      case 'up':
        classes = `${baseClasses} bg-emerald-50 text-emerald-600`;
        break;
      case 'down':
        classes = `${baseClasses} bg-rose-50 text-rose-600`;
        break;
      default:
        classes = `${baseClasses} bg-slate-100 text-slate-600`;
    }
    
    this.metricClassesCache.set(cacheKey, classes);
    return classes;
  }
  
  getTrendIcon(trend: HeaderMetric['trend']): string {
    if (trend === 'up') return 'arrow_upward';
    if (trend === 'down') return 'arrow_downward';
    return 'trending_flat';
  }
  
  // ============================================
  // CLEANUP
  // ============================================
  private cleanup(): void {
    if (this.timeUpdateIntervalId !== null) {
      clearInterval(this.timeUpdateIntervalId);
    }
    
    if (this.chartInitializationTimeout !== null) {
      clearTimeout(this.chartInitializationTimeout);
    }
    
    this.chartService.destroyAll();
  }
}
