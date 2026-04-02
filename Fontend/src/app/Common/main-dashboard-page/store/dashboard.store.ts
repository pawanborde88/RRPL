import { Injectable, signal, computed } from '@angular/core';
import {
  HeaderMetric,
  LeadLevel,
  MergedSource,
  DigitalIntegration,
  UnitCount,
  BookingStatus,
  EnquiryFlowData,
  MarketStats,
  Property,
  Agent,
  MarketInsight,
  ScheduledViewing,
  ClientInquiry
} from '../models/dashboard.models';

/**
 * Dashboard State Store
 * Centralized signal-based state management for dashboard data
 */
export interface DashboardState {
  // UI State
  loading: boolean;
  currentDate: Date;
  userFullName: string;
  error: string | null;

  // Filter State
  selectedProjectId: number | null;
  selectedProjectIds: number[];
  startDate: Date | null;
  endDate: Date | null;

  // Dropdown Data
  projects: any[];
  telecallers: any[];
  salesExecutives: any[];

  // Metrics & Data
  headerMetrics: HeaderMetric[];
  salesHeaderMetrics: HeaderMetric[];
  leadLevels: LeadLevel[];
  salesLeadLevels: LeadLevel[];
  sourceData: MergedSource[];
  digitalCampaigns: DigitalIntegration[];
  inventoryData: UnitCount[];
  bookingStatuses: BookingStatus[];
  enquiryFlow: EnquiryFlowData | null;
  salesDashboardData: any | null;

  // Raw API responses for full dashboard coverage
  presaleDashboardRaw: any | null;
  allProjectSummaryRaw: any | null;
  salesReportsRaw: any | null;

  // Mock/Static Data
  topAgents: Agent[];
  marketInsights: MarketInsight[];
  scheduledViewings: ScheduledViewing[];
  clientInquiries: ClientInquiry[];
  recentProperties: Property[];
}

const initialState: DashboardState = {
  loading: false,
  currentDate: new Date(),
  userFullName: '',
  selectedProjectId: null,
  selectedProjectIds: [],
  startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
  endDate: new Date(),
  projects: [],
  telecallers: [],
  salesExecutives: [],
  headerMetrics: [],
  salesHeaderMetrics: [],
  leadLevels: [],
  salesLeadLevels: [],
  sourceData: [],
  digitalCampaigns: [],
  inventoryData: [],
  bookingStatuses: [],
  enquiryFlow: null,
  salesDashboardData: null,
  presaleDashboardRaw: null,
  allProjectSummaryRaw: null,
  salesReportsRaw: null,
  topAgents: [],
  marketInsights: [],
  scheduledViewings: [],
  clientInquiries: [],
  recentProperties: [],
  error: null,
};

@Injectable()
export class DashboardStore {
  // State signals
  private readonly _state = signal<DashboardState>(initialState);

  // Public readonly state
  readonly state = this._state.asReadonly();

  // Selectors
  readonly loading = computed(() => this._state().loading);
  readonly currentDate = computed(() => this._state().currentDate);
  readonly userFullName = computed(() => this._state().userFullName);
  readonly error = computed(() => this._state().error);
  readonly startDate = computed(() => this._state().startDate);
  readonly endDate = computed(() => this._state().endDate);

  readonly headerMetrics = computed(() => this._state().headerMetrics);
  readonly salesHeaderMetrics = computed(() => this._state().salesHeaderMetrics);
  readonly sourceData = computed(() => this._state().sourceData);
  readonly leadLevels = computed(() => this._state().leadLevels);
  readonly salesLeadLevels = computed(() => this._state().salesLeadLevels);
  readonly inventoryData = computed(() => this._state().inventoryData);
  readonly bookingStatuses = computed(() => this._state().bookingStatuses);
  readonly enquiryFlow = computed(() => this._state().enquiryFlow);
  readonly salesDashboardData = computed(() => this._state().salesDashboardData);
  readonly presaleDashboardRaw = computed(() => this._state().presaleDashboardRaw);
  readonly allProjectSummaryRaw = computed(() => this._state().allProjectSummaryRaw);
  readonly salesReportsRaw = computed(() => this._state().salesReportsRaw);
  readonly digitalCampaigns = computed(() => this._state().digitalCampaigns);

  readonly projects = computed(() => this._state().projects);
  readonly selectedProjectIds = computed(() => this._state().selectedProjectIds);
  readonly telecallers = computed(() => this._state().telecallers);
  readonly salesExecutives = computed(() => this._state().salesExecutives);
  readonly recentProperties = computed(() => this._state().recentProperties);

  // Derived state
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

  // Actions
  setLoading(loading: boolean): void {
    this._state.update(state => ({ ...state, loading, error: loading ? null : state.error }));
  }

  setError(error: string | null): void {
    this._state.update(state => ({ ...state, error, loading: false }));
  }

  setDates(start: Date | null, end: Date | null): void {
    this._state.update(state => ({ ...state, startDate: start, endDate: end }));
  }

  setUserFullName(name: string): void {
    this._state.update(state => ({ ...state, userFullName: name }));
  }

  setProjects(projects: any[]): void {
    this._state.update(state => ({ ...state, projects }));
  }

  setTelecallers(telecallers: any[]): void {
    this._state.update(state => ({ ...state, telecallers }));
  }

  setSalesExecutives(salesExecutives: any[]): void {
    this._state.update(state => ({ ...state, salesExecutives }));
  }

  setSelectedProject(projectId: number | null, projectIds: number[]): void {
    this._state.update(state => ({
      ...state,
      selectedProjectId: projectId,
      selectedProjectIds: projectIds
    }));
  }

  updateMetrics(data: Partial<DashboardState>): void {
    this._state.update(state => ({ ...state, ...data }));
  }

  reset(): void {
    this._state.set(initialState);
  }
}

