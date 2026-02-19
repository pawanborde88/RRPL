import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
  untracked
} from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RouterModule } from '@angular/router';
import { TemplateComponent } from '../template/template.component';
import { AutocompleteReusableComponent } from '../autocomplete-reusable-component/autocomplete-reusable-component.component';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTabsModule } from '@angular/material/tabs';
import { MatNativeDateModule } from '@angular/material/core';

import { PriceFormatPipe } from '../../Pipes/price-format.pipe';
import { PriceShortPipe } from '../../Pipes/price-short.pipe';
import { StatusColorPipe } from '../../Pipes/status-color.pipe';
import { GreetingPipe } from '../../Pipes/greeting.pipe';

import { DashboardFacade } from './facade/dashboard.facade';
import { DashboardStore } from './store/dashboard.store';
import { ChartService } from './services/chart.service';
import { HeaderMetric, Property } from './models/dashboard.models';
import { CostomLoadingComponent } from '../Reusable/coustom Loader/costom-loading/costom-loading.component';

@Component({
  selector: 'app-main-dashboard-page',
  standalone: true,
  providers: [DashboardStore, DashboardFacade, ChartService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TemplateComponent,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    PriceFormatPipe,
    PriceShortPipe,
    StatusColorPipe,
    GreetingPipe,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    AutocompleteReusableComponent,
    CostomLoadingComponent,
  ],
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
  readonly facade = inject(DashboardFacade);
  private readonly chartService = inject(ChartService);

  // UI State
  readonly propertyFilter = signal<string>('All');
  readonly propertySearch = signal<string>('');
  readonly statusPeriod = signal<string>('Last year');
  readonly revenuePeriod = signal<string>('Last year');
  private readonly chartsInitialized = signal(false);

  // Facade Signal Shortcuts
  readonly loading = this.facade.loading;
  readonly greetingName = this.facade.greetingName;
  readonly greetingText = this.facade.greetingText;
  readonly currentDate = this.facade.currentDate;
  readonly headerMetrics = this.facade.headerMetrics;
  readonly projectsList = this.facade.projects;
  readonly digitalCampaigns = this.facade.digitalCampaigns;

  // Local Writable Signals for DatePicker
  readonly startDate = signal<Date | null>(this.facade.startDate());
  readonly endDate = signal<Date | null>(this.facade.endDate());

  // Chart Legend Signals (Derived from Store)
  readonly salesMetrics = this.facade.salesHeaderMetrics;

  readonly totalEnquiries = computed(() => {
    const flow = this.facade.enquiryFlow();
    return flow ? flow.enquiries : 0;
  });

  readonly statusChartLegend = computed(() => {
    const flow = this.facade.enquiryFlow();
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

  readonly totalSalesLeads = computed(() =>
    this.facade.salesLeadLevels().reduce((acc, curr) => acc + curr.lead_level_count, 0)
  );

  readonly presaleLeadLevelLegend = computed(() => {
    const levels = this.facade.leadLevels();
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return levels.map((l, i) => ({ label: l.lead_level, value: l.lead_level_count, color: colors[i % colors.length] }));
  });

  readonly salesLeadLevelLegend = computed(() => {
    const levels = this.facade.salesLeadLevels();
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return levels.map((l, i) => ({ label: l.lead_level, value: l.lead_level_count, color: colors[i % colors.length] }));
  });

  readonly totalBookingStatusUnits = computed(() =>
    this.facade.bookingStatuses().reduce((acc, curr) => acc + curr.unit_count, 0)
  );

  readonly polarAreaChartLegend = computed(() => {
    const statuses = this.facade.bookingStatuses();
    const getColor = (status: string) => {
      const s = status.toLowerCase();
      if (s.includes('booked')) return '#10b981';
      if (s.includes('hold')) return '#9ca3af';
      if (s.includes('token')) return '#8b5cf6';
      if (s.includes('unsanctioned')) return '#1e293b';
      if (s.includes('developer')) return '#3b82f6';
      if (s.includes('mahada')) return '#facc15';
      if (s.includes('land owner') || s.includes('agreement')) return '#f97316';
      return '#6366f1';
    };
    return statuses.map(s => ({ label: s.booking_status, value: s.unit_count, color: getColor(s.booking_status) }));
  });

  // ViewChild references - DASHBOARD TAB
  @ViewChild('statusChartDash') statusChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('presaleSourceChartDash') presaleSourceChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesSourceChartDash') salesSourceChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('presaleLeadLevelChartDash') presaleLeadLevelChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesLeadLevelChartDash') salesLeadLevelChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priceByTypeChartDash') priceByTypeChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('industryChartDash') industryChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ageRangeChartDash') ageRangeChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingStatusChartDash') bookingStatusChartDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingPlanDash') bookingPlanDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('buyingPurposeDash') buyingPurposeDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nativePlaceDash') nativePlaceDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('possessionRequiredDash') possessionRequiredDashRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('preferredLocationDash') preferredLocationDashRef!: ElementRef<HTMLCanvasElement>;

  // ViewChild references - SITE VISIT TAB
  @ViewChild('statusChartSV') statusChartSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesSourceChartSV') salesSourceChartSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('salesLeadLevelChartSV') salesLeadLevelChartSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priceByTypeChartSV') priceByTypeChartSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('industryChartSV') industryChartSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ageRangeChartSV') ageRangeChartSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingStatusChartSV') bookingStatusChartSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingPlanSV') bookingPlanSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('buyingPurposeSV') buyingPurposeSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nativePlaceSV') nativePlaceSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('possessionRequiredSV') possessionRequiredSVRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('preferredLocationSV') preferredLocationSVRef!: ElementRef<HTMLCanvasElement>;

  // ViewChild references - LEAD TAB
  @ViewChild('statusChartLead') statusChartLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('presaleSourceChartLead') presaleSourceChartLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('presaleLeadLevelChartLead') presaleLeadLevelChartLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priceByTypeChartLead') priceByTypeChartLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('industryChartLead') industryChartLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ageRangeChartLead') ageRangeChartLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingStatusChartLead') bookingStatusChartLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingPlanLead') bookingPlanLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('buyingPurposeLead') buyingPurposeLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nativePlaceLead') nativePlaceLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('possessionRequiredLead') possessionRequiredLeadRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('preferredLocationLead') preferredLocationLeadRef!: ElementRef<HTMLCanvasElement>;

  // ViewChild references - CRM TAB
  @ViewChild('statusChartCRM') statusChartCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priceByTypeChartCRM') priceByTypeChartCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('industryChartCRM') industryChartCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ageRangeChartCRM') ageRangeChartCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingStatusChartCRM') bookingStatusChartCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingPlanCRM') bookingPlanCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('buyingPurposeCRM') buyingPurposeCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nativePlaceCRM') nativePlaceCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('possessionRequiredCRM') possessionRequiredCRMRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('preferredLocationCRM') preferredLocationCRMRef!: ElementRef<HTMLCanvasElement>;



  // Static options
  readonly statusPeriodOptions = ['Last year', 'This year', 'Last month'] as const;
  readonly propertyFilterOptions = ['All', 'For Sale', 'Pending', 'Sold', 'Rent'] as const;

  // Reactive filtered properties
  readonly filteredProperties = computed(() => {
    const searchTerm = this.propertySearch().toLowerCase();
    const filter = this.propertyFilter().toLowerCase();
    const properties = this.facade.recentProperties();

    return properties.filter(p => {
      const matchesSearch = !searchTerm || p.title.toLowerCase().includes(searchTerm) || p.location.toLowerCase().includes(searchTerm);
      const matchesFilter = filter === 'all' || p.status.toLowerCase().includes(filter);
      return matchesSearch && matchesFilter;
    });
  });

  constructor() {
    this.setupChartEffects();

    // Auto-select first project default
    effect(() => {
      const projects = this.projectsList();
      const selected = this.facade.selectedProjectIds();

      if (projects.length > 0 && selected.length === 0) {
        untracked(() => {
          this.onProjectChange(projects[0].project_id);
        });
      }
    });
  }

  ngOnInit(): void {
    this.facade.initialize();

    // Initial data fetch if projects exist
    if (this.facade.selectedProjectIds().length > 0) {
      this.facade.fetchDashboardData();
    }
  }

  private setupChartEffects(): void {
    // Effect for Status Chart (Enquiry Flow)
    effect(() => {
      if (!this.chartsInitialized()) return;
      const flow = this.facade.enquiryFlow();
      if (!flow) return;

      const updates = ['Dash', 'SV', 'Lead', 'CRM'];
      updates.forEach(suffix => {
        this.chartService.updateChart('status' + suffix, (chart) => {
          this.updateStatusChartData(chart, flow);
        });
      });
    }, { allowSignalWrites: true });

    // Effect for Presale Sources
    effect(() => {
      if (!this.chartsInitialized()) return;
      const sources = this.facade.sourceData();
      if (sources.length === 0) return;

      const sorted = [...sources].sort((a, b) => b.presale_leads - a.presale_leads).slice(0, 10);
      ['Dash', 'Lead'].forEach(suffix => {
        this.chartService.updateChart('presaleSource' + suffix, (chart) => {
          chart.data.labels = sorted.map(s => s.source);
          chart.data.datasets[0].data = sorted.map(s => s.presale_leads);
          chart.data.datasets[1].data = sorted.map(s => s.presale_followups);
        });
      });
    }, { allowSignalWrites: true });

    // Effect for Sales Sources
    effect(() => {
      if (!this.chartsInitialized()) return;
      const sources = this.facade.sourceData();
      if (sources.length === 0) return;

      const sorted = [...sources].sort((a, b) => b.sales_enquiries - a.sales_enquiries).slice(0, 10);
      ['Dash', 'SV'].forEach(suffix => {
        this.chartService.updateChart('salesSource' + suffix, (chart) => {
          chart.data.labels = sorted.map(s => s.source);
          chart.data.datasets[0].data = sorted.map(s => s.sales_enquiries);
          chart.data.datasets[1].data = sorted.map(s => s.sales_followups);
        });
      });
    }, { allowSignalWrites: true });

    // Effect for Presale Lead Levels
    effect(() => {
      if (!this.chartsInitialized()) return;
      const levels = this.facade.leadLevels();
      if (levels.length === 0) return;

      ['Dash', 'Lead'].forEach(suffix => {
        this.chartService.updateChart('presaleLeadLevel' + suffix, (chart) => {
          chart.data.labels = levels.map(l => l.lead_level);
          chart.data.datasets[0].data = levels.map(l => l.lead_level_count);
        });
      });
    }, { allowSignalWrites: true });

    // Effect for Sales Lead Levels
    effect(() => {
      if (!this.chartsInitialized()) return;
      const levels = this.facade.salesLeadLevels();
      if (levels.length === 0) return;

      ['Dash', 'SV'].forEach(suffix => {
        this.chartService.updateChart('salesLeadLevel' + suffix, (chart) => {
          chart.data.labels = levels.map(l => l.lead_level);
          chart.data.datasets[0].data = levels.map(l => l.lead_level_count);
        });
      });
    }, { allowSignalWrites: true });

    // Effect for Digital Channels
    effect(() => {
      if (!this.chartsInitialized()) return;
      const campaigns = this.facade.digitalCampaigns();
      if (campaigns.length === 0) return;

      this.chartService.updateChart('isImport', (chart) => {
        const manual = campaigns.reduce((acc: number, curr: any) => acc + (curr.duplicate_leads || 0), 0);
        const imported = campaigns.reduce((acc: number, curr: any) => acc + (curr.lead_count || 0), 0);
        chart.data.labels = ['Manual', 'Digital'];
        chart.data.datasets[0].data = [manual, imported];
      });
    }, { allowSignalWrites: true });

    // Unit Distribution Chart
    effect(() => {
      if (!this.chartsInitialized()) return;
      const inventory = this.facade.inventoryData();
      if (inventory.length === 0) return;

      const updates = ['Dash', 'SV', 'Lead', 'CRM'];
      updates.forEach(suffix => {
        this.chartService.updateChart('priceByType' + suffix, (chart) => {
          const valid = inventory.filter(u => u.unit_type).slice(0, 8);
          chart.data.labels = valid.map(u => u.unit_type);
          chart.data.datasets[0].data = valid.map(u => u.total_unit);
          chart.data.datasets[1].data = valid.map(u => u.book_unit);
          chart.data.datasets[2].data = valid.map(u => u.available_unit);
        });
      });
    }, { allowSignalWrites: true });

    // Industry Distribution Chart
    effect(() => {
      if (!this.chartsInitialized()) return;
      const data = this.facade.salesDashboardData();
      const industry = data?.industry || [];
      if (industry.length === 0) return;

      const updates = ['Dash', 'SV', 'Lead', 'CRM'];
      updates.forEach(suffix => {
        this.chartService.updateChart('industry' + suffix, (chart) => {
          chart.data.labels = industry.map((i: any) => i.industry || i.name || 'Unknown');
          chart.data.datasets[0].data = industry.map((i: any) =>
            i.industry_count || i.count || i.total || i.value || i.enquiry_count || 0
          );
        });
      });
    }, { allowSignalWrites: true });

    // Age Range Chart
    effect(() => {
      if (!this.chartsInitialized()) return;
      const data = this.facade.salesDashboardData();
      const ageRange = data?.age_range || [];
      if (ageRange.length === 0) return;

      const updates = ['Dash', 'SV', 'Lead', 'CRM'];
      updates.forEach(suffix => {
        this.chartService.updateChart('ageRange' + suffix, (chart) => {
          chart.data.labels = ageRange.map((a: any) => a.age_range || a.range || 'Unknown');
          chart.data.datasets[0].data = ageRange.map((a: any) =>
            a.age_range_count || a.count || a.total || a.value || a.enquiry_count || 0
          );
        });
      });
    }, { allowSignalWrites: true });

    // Booking Status
    effect(() => {
      if (!this.chartsInitialized()) return;
      const statuses = this.facade.bookingStatuses();
      if (statuses.length === 0) return;

      const updates = ['Dash', 'SV', 'Lead', 'CRM'];
      updates.forEach(suffix => {
        this.chartService.updateChart('bookingStatus' + suffix, (chart) => {
          chart.data.labels = statuses.map(s => s.booking_status);
          chart.data.datasets[0].data = statuses.map(s => s.unit_count);
        });
      });
    }, { allowSignalWrites: true });

    // Demographic Charts (5 New Charts)
    const demographicData = computed(() => {
      const data = this.facade.salesDashboardData();
      return {
        bookingPlan: data?.booking_plan || [],
        buyingPurpose: data?.buying_purpose || [],
        nativePlace: data?.native_place || [],
        possession: data?.possession_required || [],
        preferred: data?.preferred_location || []
      };
    });

    effect(() => {
      if (!this.chartsInitialized()) return;
      const data = demographicData();
      const updates = ['Dash', 'SV', 'Lead', 'CRM'];

      updates.forEach(suffix => {
        if (data.bookingPlan.length > 0) {
          this.chartService.updateChart('bookingPlan' + suffix, (chart) => {
            chart.data.labels = data.bookingPlan.map((b: any) => b.booking || 'Unknown');
            chart.data.datasets[0].data = data.bookingPlan.map((b: any) => b.enquiry_count || 0);
          });
        }
        if (data.buyingPurpose.length > 0) {
          this.chartService.updateChart('buyingPurpose' + suffix, (chart) => {
            chart.data.labels = data.buyingPurpose.map((b: any) => b.buying_purpose || 'Unknown');
            chart.data.datasets[0].data = data.buyingPurpose.map((b: any) => b.enquiry_count || 0);
          });
        }
        if (data.nativePlace.length > 0) {
          const topPlaces = [...data.nativePlace].sort((a: any, b: any) => b.enquiry_count - a.enquiry_count).slice(0, 10);
          this.chartService.updateChart('nativePlace' + suffix, (chart) => {
            chart.data.labels = topPlaces.map((n: any) => n.native_place || 'Unknown');
            chart.data.datasets[0].data = topPlaces.map((n: any) => n.enquiry_count || 0);
          });
        }
        if (data.possession.length > 0) {
          this.chartService.updateChart('possessionRequired' + suffix, (chart) => {
            chart.data.labels = data.possession.map((p: any) => p.possession_req || 'Unknown');
            chart.data.datasets[0].data = data.possession.map((p: any) => p.enquiry_count || 0);
          });
        }
        if (data.preferred.length > 0) {
          const topLocs = [...data.preferred].sort((a: any, b: any) => b.enquiry_count - a.enquiry_count).slice(0, 10);
          this.chartService.updateChart('preferredLocation' + suffix, (chart) => {
            chart.data.labels = topLocs.map((l: any) => l.preferred_location || 'Unknown');
            chart.data.datasets[0].data = topLocs.map((l: any) => l.enquiry_count || 0);
          });
        }
      });
    }, { allowSignalWrites: true });
  }

  private updateStatusChartData(chart: any, flow: any): void {
    chart.data.datasets[0].data = [flow.enquiries, flow.tokens, flow.bookings, flow.booking_agreements, flow.disbursements];
    chart.data.labels = ['Enquiries', 'Tokens', 'Bookings', 'Agreements', 'Disbursement'];
    const ctx = chart.ctx;
    if (ctx) {
      const g1 = this.createGradient(ctx, '#3b82f6', '#2563eb');
      const g2 = this.createGradient(ctx, '#8b5cf6', '#7c3aed');
      const g3 = this.createGradient(ctx, '#10b981', '#059669');
      const g4 = this.createGradient(ctx, '#f59e0b', '#d97706');
      const g5 = this.createGradient(ctx, '#ec4899', '#db2777');
      chart.data.datasets[0].backgroundColor = [g1, g2, g3, g4, g5];
    }
  }

  onDateChange(): void {
    const start = this.startDate();
    const end = this.endDate();
    if (start && end) {
      this.facade.setDates(start, end);
    }
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.chartService.destroyAll();
  }

  private initializeCharts(): void {
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = '#64748b';
    Chart.defaults.scale.grid.color = 'rgba(241, 245, 249, 0.6)';
    Chart.defaults.scale.grid.tickLength = 0;
    Chart.defaults.elements.bar.borderWidth = 0;
    Chart.defaults.elements.bar.borderRadius = 6;

    const updates = ['Dash', 'SV', 'Lead', 'CRM'];

    updates.forEach(suffix => {
      const statusRef = (this as any)[`statusChart${suffix}Ref`];
      if (statusRef) {
        this.chartService.createChart('status' + suffix, statusRef, {
          type: 'doughnut',
          data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, borderRadius: 20, spacing: 3, hoverOffset: 15 }] },
          options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false } } } as any
        });
      }

      if (['Dash', 'Lead'].includes(suffix)) {
        const preRef = (this as any)[`presaleSourceChart${suffix}Ref`];
        if (preRef) {
          this.chartService.createChart('presaleSource' + suffix, preRef, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Leads', data: [], backgroundColor: '#10b981', borderRadius: 8 }, { label: 'Follow-ups', data: [], backgroundColor: '#f59e0b', borderRadius: 8 }] },
            options: { responsive: true, maintainAspectRatio: false } as any
          });
        }
        const preLvlRef = (this as any)[`presaleLeadLevelChart${suffix}Ref`];
        if (preLvlRef) {
          this.chartService.createChart('presaleLeadLevel' + suffix, preLvlRef, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'], borderWidth: 0, borderRadius: 15 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '82%', plugins: { legend: { display: false } } } as any
          });
        }
      }

      if (['Dash', 'SV'].includes(suffix)) {
        const salesRef = (this as any)[`salesSourceChart${suffix}Ref`];
        if (salesRef) {
          this.chartService.createChart('salesSource' + suffix, salesRef, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Enquiries', data: [], backgroundColor: '#6366f1', borderRadius: 8 }, { label: 'Follow-ups', data: [], backgroundColor: '#a5b4fc', borderRadius: 8 }] },
            options: { responsive: true, maintainAspectRatio: false } as any
          });
        }
        const salesLvlRef = (this as any)[`salesLeadLevelChart${suffix}Ref`];
        if (salesLvlRef) {
          this.chartService.createChart('salesLeadLevel' + suffix, salesLvlRef, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'], borderWidth: 0, borderRadius: 15 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '82%', plugins: { legend: { display: false } } } as any
          });
        }
      }

      const indRef = (this as any)[`industryChart${suffix}Ref`];
      if (indRef) {
        this.chartService.createChart('industry' + suffix, indRef, {
          type: 'bar',
          data: { labels: [], datasets: [{ label: 'Industry', data: [], backgroundColor: '#818cf8', borderRadius: 6 }] },
          options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } as any
        });
      }

      const ageRef = (this as any)[`ageRangeChart${suffix}Ref`];
      if (ageRef) {
        this.chartService.createChart('ageRange' + suffix, ageRef, {
          type: 'bar',
          data: { labels: [], datasets: [{ label: 'Age Range', data: [], backgroundColor: '#fbbf24', borderRadius: 6 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } as any
        });
      }

      const bookRef = (this as any)[`bookingStatusChart${suffix}Ref`];
      if (bookRef) {
        this.chartService.createChart('bookingStatus' + suffix, bookRef, {
          type: 'line',
          data: { labels: [], datasets: [{ label: 'Units', data: [], borderColor: '#14b8a6', borderWidth: 3, tension: 0.45, fill: true }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } as any
        });
      }

      const priceRef = (this as any)[`priceByTypeChart${suffix}Ref`];
      if (priceRef) {
        this.chartService.createChart('priceByType' + suffix, priceRef, {
          type: 'bar',
          data: { labels: [], datasets: [{ label: 'Total', data: [], backgroundColor: '#e2e8f0' }, { label: 'Booked', data: [], backgroundColor: '#10b981' }, { label: 'Available', data: [], backgroundColor: '#3b82f6' }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 12, usePointStyle: true, padding: 15 } } },
            scales: { x: { grid: { display: false } }, y: { border: { dash: [4, 4] } } }
          } as any
        });
      }

      this.createDemographicCharts(suffix,
        (this as any)[`bookingPlan${suffix}Ref`],
        (this as any)[`buyingPurpose${suffix}Ref`],
        (this as any)[`nativePlace${suffix}Ref`],
        (this as any)[`possessionRequired${suffix}Ref`],
        (this as any)[`preferredLocation${suffix}Ref`]
      );
    });

    this.chartsInitialized.set(true);
  }

  private createDemographicCharts(
    suffix: string,
    bookingPlanRef: ElementRef<HTMLCanvasElement>,
    buyingPurposeRef: ElementRef<HTMLCanvasElement>,
    nativePlaceRef: ElementRef<HTMLCanvasElement>,
    possessionRequiredRef: ElementRef<HTMLCanvasElement>,
    preferredLocationRef: ElementRef<HTMLCanvasElement>
  ): void {
    if (!bookingPlanRef || !buyingPurposeRef || !nativePlaceRef || !possessionRequiredRef || !preferredLocationRef) return;

    this.chartService.createChart('bookingPlan' + suffix, bookingPlanRef, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Enquiries', data: [], backgroundColor: '#6366f1', borderRadius: 8, barThickness: 20 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(241, 245, 249, 0.5)' } } }
      } as any
    });

    this.chartService.createChart('buyingPurpose' + suffix, buyingPurposeRef, {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: ['#3b82f6', '#10b981'], borderWidth: 0, borderRadius: 8 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, padding: 10 } } }
      } as any
    });

    this.chartService.createChart('nativePlace' + suffix, nativePlaceRef, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Enquiries', data: [], backgroundColor: '#f59e0b', borderRadius: 4, barThickness: 12 }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
      } as any
    });

    this.chartService.createChart('possessionRequired' + suffix, possessionRequiredRef, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Enquiries', data: [], backgroundColor: '#10b981', borderRadius: 8, barThickness: 20 }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
      } as any
    });

    this.chartService.createChart('preferredLocation' + suffix, preferredLocationRef, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Enquiries', data: [], backgroundColor: '#ec4899', borderRadius: 4, barThickness: 12 }] },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
      } as any
    });

  }

  onProjectChange(projectId: any): void {
    const ids = Array.isArray(projectId) ? projectId : [projectId];
    this.facade.setSelectedProjects(ids.map(Number));
  }

  onPropertySearchChange(value: string): void {
    this.propertySearch.set(value);
  }

  onPropertyFilterChange(value: string): void {
    this.propertyFilter.set(value);
  }

  onExportDashboard(): void {
    console.info('Exporting dashboard...');
  }

  trackById(_: number, item: any): any {
    return item.id || item;
  }

  trackByMetricId(_: number, item: any): any {
    return item.id;
  }

  trackByCampaign(_: number, item: any): any {
    return item.integration_id || item.id;
  }

  getTrendIcon(trend: HeaderMetric['trend']): string {
    if (trend === 'up') return 'north_east';
    if (trend === 'down') return 'south_east';
    return 'trending_flat';
  }

  getMetricTheme(icon: string): any {
    const themeMap: Record<string, any> = {
      'analytics': { bg: '#f5f3ff', text: '#6d28d9', icon: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.1)' }, // Total Leads (Purple)
      'apartment': { bg: '#eff6ff', text: '#1d4ed8', icon: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.1)' }, // Site Visits (Blue)
      'handshake': { bg: '#ecfdf5', text: '#047857', icon: '#10b981', shadow: 'rgba(16, 185, 129, 0.1)' }, // Bookings (Green)
      'pending_actions': { bg: '#fff7ed', text: '#c2410c', icon: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.1)' }, // Pending (Orange)
      'forum': { bg: '#f0f9ff', text: '#0369a1', icon: '#0ea5e9', shadow: 'rgba(14, 165, 233, 0.1)' }, // Enquiries (Sky)
      'task_alt': { bg: '#f0fdf4', text: '#15803d', icon: '#22c55e', shadow: 'rgba(34, 197, 94, 0.1)' }, // Sales Bookings (Green)
      'payments': { bg: '#fdf4ff', text: '#a21caf', icon: '#d946ef', shadow: 'rgba(217, 70, 239, 0.1)' }, // Tokens (Fuchsia)
      'person_search': { bg: '#fef2f2', text: '#b91c1c', icon: '#ef4444', shadow: 'rgba(239, 68, 68, 0.1)' } // Unassigned (Red)
    };
    return themeMap[icon] || { bg: '#f8fafc', text: '#475569', icon: '#64748b', shadow: 'rgba(100, 116, 139, 0.1)' };
  }


  private createGradient(ctx: CanvasRenderingContext2D, colorStart: string, colorEnd: string) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  }
}