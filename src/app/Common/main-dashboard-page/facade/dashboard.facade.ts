import { Injectable, inject, computed } from '@angular/core';
import { forkJoin, catchError, of, take } from 'rxjs';
import { MainDashboardService } from '../../../Service/common/Dashboard/main-dashboard.service';
import { DashboardStore } from '../store/dashboard.store';
import {
  MergedSource,
  PresaleSource,
  SalesSource,
  EnquiryFlowData,
  HeaderMetric,
  DashboardParams
} from '../models/dashboard.models';

/**
 * Dashboard Facade
 * Business logic layer that orchestrates data fetching and state updates
 */
@Injectable()
export class DashboardFacade {
  private readonly store = inject(DashboardStore);
  private readonly dashboardService = inject(MainDashboardService);

  // Expose store state
  readonly loading = this.store.loading;
  readonly currentDate = this.store.currentDate;
  readonly userFullName = this.store.userFullName;
  readonly startDate = this.store.startDate;
  readonly endDate = this.store.endDate;

  readonly projects = this.store.projects;
  readonly telecallers = this.store.telecallers;
  readonly salesExecutives = this.store.salesExecutives;

  readonly headerMetrics = this.store.headerMetrics;
  readonly salesHeaderMetrics = this.store.salesHeaderMetrics;
  readonly sourceData = this.store.sourceData;
  readonly leadLevels = this.store.leadLevels;
  readonly salesLeadLevels = this.store.salesLeadLevels;
  readonly inventoryData = this.store.inventoryData;
  readonly bookingStatuses = this.store.bookingStatuses;
  readonly enquiryFlow = this.store.enquiryFlow;
  readonly salesDashboardData = this.store.salesDashboardData;
  readonly digitalCampaigns = this.store.digitalCampaigns;
  readonly recentProperties = this.store.recentProperties;
  readonly selectedProjectId = computed(() => this.store.state().selectedProjectId);
  readonly selectedProjectIds = this.store.selectedProjectIds;
  readonly state = this.store.state;
  readonly greetingName = this.store.greetingName;
  readonly greetingText = this.store.greetingText;

  // Additional data selectors used by refactored component
  readonly salesReportsData = computed(() => this.store.state().salesDashboardData);
  readonly enquiryFlowData = this.store.enquiryFlow;
  readonly presaleDashboardRaw = this.store.presaleDashboardRaw;
  readonly allProjectSummaryRaw = this.store.allProjectSummaryRaw;
  readonly salesReportsRaw = this.store.salesReportsRaw;

  readonly allProjectSummaryData = computed(() => {
    const raw = this.store.allProjectSummaryRaw();
    const inventory = this.store.inventoryData();
    const bookingStatuses = this.store.bookingStatuses();
    return {
      project_count: raw?.project_count ?? this.store.projects().length,
      floor_unit_count: raw?.floor_unit_count ?? inventory.reduce((acc, curr) => acc + (curr.total_unit || 0), 0),
      booking_count: raw?.booking_count ?? bookingStatuses.reduce((acc, curr) => acc + (curr.unit_count || 0), 0),
      unit_count: inventory,
      booking_statuses: bookingStatuses,
      source_wise_booking: raw?.source_wise_booking || []
    };
  });

  initialize(): void {
    const userName = sessionStorage.getItem('user_full_name') || '';
    this.store.setUserFullName(userName);
    this.loadProjects();
  }

  initializeUser(): void {
    this.initialize();
  }

  updateCurrentDate(): void {
    this.store.updateMetrics({ currentDate: new Date() });
  }

  loadProjects(): void {
    const userId = Number(sessionStorage.getItem('session_id')) || null;
    this.dashboardService.fetchUserProjectDropdown(userId).subscribe(projects => {
      this.store.setProjects(projects || []);
    });
  }

  loadTelecallers(projectIds: number[]): void {
    this.dashboardService.fetchTelecallerDropdown(projectIds).subscribe(telecallers => {
      this.store.setTelecallers(telecallers || []);
    });
  }

  loadSalesExecutives(projectIds: number[]): void {
    this.dashboardService.fetchSalesExecutives(projectIds).subscribe(executives => {
      this.store.setSalesExecutives(executives || []);
    });
  }

  fetchDashboardData(params?: {
    projectIds: number[];
    startDate: string;
    endDate: string;
    telecallerIds?: number[];
    salesExecutiveIds?: number[];
  }): void {
    let project_id: number[];
    let start_date: string;
    let end_date: string;
    let telecaller_id: number[] | undefined;
    let sales_executive_id: number[] | undefined;

    if (params) {
      project_id = params.projectIds;
      start_date = params.startDate;
      end_date = params.endDate;
      telecaller_id = params.telecallerIds;
      sales_executive_id = params.salesExecutiveIds;
    } else {
      const pIds = this.store.state().selectedProjectIds;
      const start = this.store.startDate();
      const end = this.store.endDate();
      if (!start || !end || pIds.length === 0) return;
      project_id = pIds;
      start_date = this.formatDate(start);
      end_date = this.formatDate(end);
    }

    const payload: DashboardParams = {
      project_id: Array.isArray(project_id) ? project_id : [project_id],
      start_date,
      end_date,
      telecaller_id,
      sales_executive_id
    };

    // Keep store in sync with the exact project selection used for this fetch
    // (prevents stale project ids from being sent in subsequent calls)
    this.store.setSelectedProject(payload.project_id[0] ?? null, payload.project_id);

    this.store.setLoading(true);

    const calls = {
      presale: this.dashboardService.fetchPresaleDashboard({
        ...payload,
        start_date: start_date,
        end_date: end_date
      }),
      projectSummary: this.dashboardService.fetchAllProjectSummary({
        project_id: payload.project_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        telecaller_id: payload.telecaller_id,
        sales_executive_id: payload.sales_executive_id
      }),
      digitalReport: this.dashboardService.fetchDigitalReport({
        project_id: payload.project_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        telecaller_id: payload.telecaller_id,
        sales_executive_id: payload.sales_executive_id
      }),
      enquiryFlow: this.dashboardService.fetchEnquiryFlow({
        project_id: payload.project_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        telecaller_id: payload.telecaller_id,
        sales_executive_id: payload.sales_executive_id
      }),
      salesReports: this.dashboardService.fetchSalesReports(payload),
      salesDashboard: this.dashboardService.fetchSalesDashboard({
        project_id: payload.project_id,
        start_date: payload.start_date,
        end_date: payload.end_date
      })
    };

    forkJoin(calls).pipe(take(1)).subscribe({
      next: (results) => {
        this.mapAndStoreData(results);
        this.store.setLoading(false);
      },
      error: () => this.store.setLoading(false)
    });
  }

  private mapAndStoreData(results: any): void {
    const updates: any = {};

    // Map Presale
    if (results.presale?.success && results.presale.summary) {
      const s = results.presale.summary;
      updates.headerMetrics = [
        { id: '1', title: 'Total Leads', description: 'Generated in period', value: s.total_lead_count.toString(), change: '+0%', trend: 'neutral', baseline: 'vs previous', icon: 'analytics' },
        { id: '2', title: 'Site Visits', description: 'Visits concluded', value: (s.site_visit_count || 0).toString(), change: '+0%', trend: 'neutral', baseline: 'vs previous', icon: 'apartment' },
        { id: '3', title: 'Bookings', description: 'Confirmed deals', value: (s.booking_count || 0).toString(), change: '+0%', trend: 'up', baseline: 'vs previous', icon: 'handshake' },
        { id: '4', title: 'Pending', description: 'Unassigned leads', value: (s.unassigned_count || 0).toString(), change: '', trend: 'neutral', baseline: '', icon: 'pending_actions' }
      ];
      updates.leadLevels = results.presale.lead_level || [];
    }

    // Map Sales Reports
    if (results.salesReports?.success) {
      const data = results.salesReports;
      updates.salesHeaderMetrics = [
        { id: 's1', title: 'Total Enquiries', description: 'Sales enquiries in period', value: (data.total_enquiry_count || 0).toString(), change: '', trend: 'neutral', baseline: '', icon: 'forum' },
        { id: 's2', title: 'Sales Bookings', description: 'Confirmed sales', value: (data.booking_count || 0).toString(), change: '', trend: 'up', baseline: '', icon: 'task_alt' },
        { id: 's3', title: 'Tokens', description: 'Token collections', value: (data.token_count || 0).toString(), change: '', trend: 'neutral', baseline: '', icon: 'payments' },
        { id: 's4', title: 'Unassigned', description: 'New enquiries pending', value: (data.unassigned_count || 0).toString(), change: '', trend: 'neutral', baseline: '', icon: 'person_search' }
      ];
      updates.salesLeadLevels = data.lead_level || [];
    }

    // Merge Sources
    updates.sourceData = this.mergeSources(results.presale?.source || [], results.salesReports?.source || []);

    // Other updates
    updates.digitalCampaigns = results.digitalReport?.data || [];
    updates.inventoryData = results.projectSummary?.unit_count || [];
    updates.bookingStatuses = results.projectSummary?.booking_statuses || [];
    updates.enquiryFlow = results.enquiryFlow?.data || null;
    updates.salesDashboardData = results.salesDashboard?.data || null;
    updates.presaleDashboardRaw = results.presale || null;
    updates.allProjectSummaryRaw = results.projectSummary || null;
    updates.salesReportsRaw = results.salesReports || null;

    this.store.updateMetrics(updates);
  }

  private mergeSources(presale: PresaleSource[], sales: SalesSource[]): MergedSource[] {
    const sourceMap = new Map<string, MergedSource>();

    presale.forEach(s => {
      const key = s.source || 'Unknown';
      sourceMap.set(key, { source: key, presale_leads: s.lead_count || 0, presale_followups: s.followup_count || 0, sales_enquiries: 0, sales_followups: 0 });
    });

    sales.forEach(s => {
      const key = s.source || 'Unknown';
      const entry = sourceMap.get(key) || { source: key, presale_leads: 0, presale_followups: 0, sales_enquiries: 0, sales_followups: 0 };
      entry.sales_enquiries += s.enquiry_count || 0;
      entry.sales_followups += s.followup_count || 0;
      sourceMap.set(key, entry);
    });

    return Array.from(sourceMap.values());
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  setDates(start: Date | null, end: Date | null): void {
    this.store.setDates(start, end);
    this.fetchDashboardData();
  }

  setSelectedProjects(projectIds: number[]): void {
    const first = projectIds && projectIds.length > 0 ? projectIds[0] : null;
    this.store.setSelectedProject(first, projectIds || []);
  }

  setSelectedProject(projectIds: number[]): void {
    this.setSelectedProjects(projectIds);
  }

}

