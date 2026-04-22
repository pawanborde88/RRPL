import { Injectable, signal, computed } from '@angular/core';

export interface GoalDashboardState {
  loading: boolean;
  projects: any[];
  roles: any[];
  selectedProjectId: number | null;
  selectedRoleId: number | null;
  dashboardSummary: any;
  whatINeedData: any;
  agmGoalData: any;
  companyGoalMainData: any;
  error: string | null;
}

@Injectable()
export class GoalDashboardStore {
  // State
  private readonly _state = signal<GoalDashboardState>({
    loading: false,
    projects: [],
    roles: [],
    selectedProjectId: null,
    selectedRoleId: null,
    dashboardSummary: null,
    whatINeedData: null,
    agmGoalData: null,
    companyGoalMainData: null,
    error: null,
  });

  // Selectors
  readonly state = computed(() => this._state());
  readonly loading = computed(() => this._state().loading);
  readonly projects = computed(() => this._state().projects);
  readonly roles = computed(() => this._state().roles);
  readonly selectedProjectId = computed(() => this._state().selectedProjectId);
  readonly selectedRoleId = computed(() => this._state().selectedRoleId);
  readonly dashboardSummary = computed(() => this._state().dashboardSummary);
  readonly whatINeedData = computed(() => this._state().whatINeedData);
  readonly agmGoalData = computed(() => this._state().agmGoalData);
  readonly companyGoalMainData = computed(() => this._state().companyGoalMainData);

  // Updaters
  setLoading(loading: boolean): void {
    this._state.update(s => ({ ...s, loading }));
  }

  setProjects(projects: any[]): void {
    this._state.update(s => ({ ...s, projects }));
  }

  setRoles(roles: any[]): void {
    this._state.update(s => ({ ...s, roles }));
  }

  setSelectedProject(projectId: number | null): void {
    this._state.update(s => ({ ...s, selectedProjectId: projectId }));
  }

  setSelectedRole(roleId: number | null): void {
    this._state.update(s => ({ ...s, selectedRoleId: roleId }));
  }

  setDashboardSummary(data: any): void {
    this._state.update(s => ({ ...s, dashboardSummary: data }));
  }

  setWhatINeedData(data: any): void {
    this._state.update(s => ({ ...s, whatINeedData: data }));
  }

  setAgmGoalData(data: any): void {
    this._state.update(s => ({ ...s, agmGoalData: data }));
  }

  setCompanyGoalMainData(data: any): void {
    this._state.update(s => ({ ...s, companyGoalMainData: data }));
  }

  setError(error: string | null): void {
    this._state.update(s => ({ ...s, error }));
  }
}
