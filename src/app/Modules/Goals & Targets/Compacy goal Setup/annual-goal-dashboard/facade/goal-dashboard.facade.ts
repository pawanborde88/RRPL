import { Injectable, inject, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map, of, catchError } from 'rxjs';
import { GoalDashboardStore } from '../store/goal-dashboard.store';
import { CommonService } from '../../../../../Service/common/common.service';

export interface MonthlyUnit {
  month: string;
  total_units: string;
}

export interface InventoryUnit {
  inventory_type: string;
  total_quantity: string;
}

export interface DashboardSummary {
  project_count: number;
  total_goal: number;
  /** Aggregate units from dashboard summary API (may be number or string from backend). */
  unit_count?: number | string;
  monthly_units: MonthlyUnit[];
  inventory_units: InventoryUnit[];
}

export interface TeamRequest {
  category: string;
  description: string[];
}

export interface GoalMetric {
  target: number;
  achieved: number;
}

export interface QuarterlyUnit {
  quarter: string;
  total_unit: string;
}

export interface SalesManager {
  manager_id: number;
  name: string;
  unit: string;
  team_count: string;
}

export interface AgmGoalDetailed {
  agm_id: number;
  agm_name: string;
  total_unit: string;
  team_count: string;
  sales_manager: SalesManager[];
}

export interface CompanyGoal {
  id: number;
  user_id: number;
  user_name: string;
  manager_name: string;
  project_id: number;
  project_name: string;
  my_goal: string;
  my_contribution: string;
  total_unit: string;
  /** Per-row unit count from API when provided (e.g. fetch_company_goal_main). */
  unit_count?: string | number | null;
  quarterwise_unit: QuarterlyUnit[];
}

export interface GoalsData {
  whatINeed: TeamRequest[] | null;
  agmGoals: AgmGoalDetailed[] | null;
  companyGoalMain: CompanyGoal[] | null;
}

@Injectable()
export class GoalDashboardFacade {
  private readonly store = inject(GoalDashboardStore);
  private readonly commonService = inject(CommonService);

  // Signals for resource parameters
  private readonly projectIdParam = signal<number | null>(null);
  private readonly roleIdParam = signal<number | null>(null);
  private readonly userIdParam = signal<number | null>(Number(sessionStorage.getItem('session_id')) || null);

  // Stability wrapper for rxResource params
  private readonly summaryParams = computed(() => {
    const userId = this.userIdParam();
    const roleId = this.roleIdParam();
    const projectId = this.projectIdParam();
    return userId ? { userId, roleId, projectId } : null;
  });

  private readonly goalsParams = computed(() => {
    const projectId = this.projectIdParam();
    const roleId = this.roleIdParam();
    const userId = this.userIdParam();
    return { projectId, roleId, userId };
  });

  // Expose store state that is still relevant
  readonly loadingStore = this.store.loading;
  readonly projects = this.store.projects;
  readonly roles = this.store.roles;
  readonly selectedProjectId = this.store.selectedProjectId;
  readonly selectedRoleId = this.store.selectedRoleId;

  // rxResource for fetching overall summary
  readonly summaryResource = rxResource<DashboardSummary | null, { userId: number; roleId: number | null; projectId: number | null } | null>({
    params: this.summaryParams,
    stream: (params) => {
      const p = params.params;
      if (!p) return of(null);
      return this.commonService.fetchGoalDashboard(p.userId, p.roleId, p.projectId).pipe(
        map(res => res?.data || null),
        catchError(err => {
          console.error('summaryResource error:', err);
          return of(null);
        })
      );
    }
  });

  // rxResource for fetching grouped goal data
  readonly goalsResource = rxResource<GoalsData | null, { projectId: number | null; roleId: number | null; userId: number | null } | null>({
    params: this.goalsParams,
    stream: (params) => {
      const p = params.params;
      // We still want to load if either projectId or roleId is set, or even just userId
      if (!p || !p.userId) return of(null);

      return forkJoin({
        whatINeed: this.commonService.fetchWhatINeed(p.userId, p.roleId, p.projectId).pipe(map(res => res?.status ? res.data : [])),
        agmGoals: this.commonService.fetchAgmGoal(p.userId, p.roleId, p.projectId).pipe(map(res => res?.status ? res.data : [])),
        companyGoalMain: this.commonService.fetchCompanyGoalMain(p.roleId, p.projectId).pipe(map(res => res?.status ? res.data : []))
      }).pipe(
        map(results => results as GoalsData),
        catchError(err => {
          console.error('goalsResource error:', err);
          return of(null);
        })
      );
    }
  });

  // Combined loading state
  readonly loading = computed(() => this.summaryResource.isLoading() || this.goalsResource.isLoading());

  // Computed views for the component
  readonly dashboardSummary = computed(() => this.summaryResource.value());
  readonly whatINeedData = computed(() => this.goalsResource.value()?.whatINeed);
  readonly agmGoalsData = computed(() => {
    const agms = this.goalsResource.value()?.agmGoals || [];
    return agms.filter(agm => agm.sales_manager && agm.sales_manager.length > 0);
  });
  readonly companyGoalMainData = computed(() => this.goalsResource.value()?.companyGoalMain);

  initialize(): void {
    this.loadProjects();

  }



  loadProjects(): void {
    // Only load if current project list is empty
    if (this.store.projects().length > 0) return;

    const userId = this.userIdParam();
    if (!userId) return;

    this.commonService.fetchUserProjectDropdown(userId).subscribe(projects => {
      this.store.setProjects(projects || []);

      // Auto-select first project if nothing selected
      if (projects && projects.length > 0 && !this.store.selectedProjectId()) {
        this.selectProject(projects[0].project_id);
      }
    });
  }

  selectProject(projectId: number): void {
    // Prevent duplicate selection triggering
    if (this.store.selectedProjectId() === projectId) return;

    this.store.setSelectedProject(projectId);
    // Note: We don't automatically trigger param update here anymore if we want manual "Apply Filter"
    // But for initial load/compatibility, we can keep it or manage in component
  }

  applyFilters(roleId: number | null, projectId: number | null): void {
    this.store.setSelectedRole(roleId);
    this.store.setSelectedProject(projectId);

    // Triggering the resources by updating the signals
    this.roleIdParam.set(roleId);
    this.projectIdParam.set(projectId);
  }

  refreshSummary(): void {
    this.summaryResource.reload();
  }

  fetchFullGoal(goalId: number) {
    return this.commonService.fetchFullGoal(goalId);
  }
}
