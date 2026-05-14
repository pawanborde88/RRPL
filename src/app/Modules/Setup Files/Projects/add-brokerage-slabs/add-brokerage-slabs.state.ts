import { Injectable, inject, signal, computed } from '@angular/core';
import { CommonService } from '../../../../Service/common/common.service';
import { forkJoin, tap, catchError, of } from 'rxjs';

export interface BrokerageSlabState {
  projects: any[];
  wings: any[];
  cpTypes: any[];
  brokerageValueUnits: any[];
  brokerageUnits: any[];
  preferences: any[];
  loading: boolean;
}

@Injectable()
export class BrokerageSlabStore {
  private readonly commonService = inject(CommonService);

  // State signals
  private readonly _projects = signal<any[]>([]);
  private readonly _wings = signal<any[]>([]);
  private readonly _cpTypes = signal<any[]>([]);
  private readonly _brokerageValueUnits = signal<any[]>([]);
  private readonly _brokerageUnits = signal<any[]>([]);
  private readonly _preferences = signal<any[]>([]);
  private readonly _loading = signal<boolean>(false);

  // Selectors
  readonly projects = computed(() => this._projects());
  readonly wings = computed(() => this._wings());
  readonly cpTypes = computed(() => this._cpTypes());
  readonly brokerageValueUnits = computed(() => this._brokerageValueUnits());
  readonly brokerageUnits = computed(() => this._brokerageUnits());
  readonly preferences = computed(() => this._preferences());
  readonly loading = computed(() => this._loading());

  /**
   * Load base data that doesn't depend on a specific project
   */
  loadBaseData(userId: number) {
    this._loading.set(true);
    forkJoin({
      projects: this.commonService.fetchUserProjectDropdown(userId),
      cpTypes: this.commonService.fetchCpTypes(),
      brokerageValueUnits: this.commonService.fetchBrokerageValueUnits(),
      brokerageUnits: this.commonService.fetchBrokerageUnits(),
    }).pipe(
      tap(() => this._loading.set(false)),
      catchError(() => {
        this._loading.set(false);
        return of({ projects: [], cpTypes: [], brokerageValueUnits: [], brokerageUnits: [] });
      })
    ).subscribe(data => {
      this._projects.set(data.projects);
      this._cpTypes.set(data.cpTypes);
      this._brokerageValueUnits.set(data.brokerageValueUnits);
      this._brokerageUnits.set(data.brokerageUnits);
    });
  }

  /**
   * Load data specific to one or more projects
   */
  loadProjectData(projectId: any) {
    if (!projectId) return;
    const projectIds = Array.isArray(projectId) ? projectId : [projectId];
    
    this._loading.set(true);
    forkJoin({
      wings: this.commonService.fetchWingDropdown(projectId),
      preferences: this.commonService.fetchWebConfigDropdown(projectIds),
    }).pipe(
      tap(() => this._loading.set(false)),
      catchError(() => {
        this._loading.set(false);
        return of({ wings: [], preferences: [] });
      })
    ).subscribe(data => {
      this._wings.set(data.wings);
      this._preferences.set(data.preferences);
    });
  }
}
