import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../../../../Service/common/common.service';
import { catchError, tap, finalize } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface Project {
    project_id: number;
    property_name: string;
}

export interface PresalesState {
    projects: Project[];
    lastMonthTargets: any[];
    isLoading: boolean;
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class PresalesFacade {
    private readonly commonService = inject(CommonService);
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.API_URL;

    // State Signals
    private readonly _projects = signal<Project[]>([]);
    private readonly _lastMonthTargets = signal<any[]>([]);
    private readonly _isLoading = signal<boolean>(false);
    private readonly _error = signal<string | null>(null);

    // Computed Selectors
    readonly projects = computed(() => this._projects());
    readonly lastMonthTargets = computed(() => this._lastMonthTargets());
    readonly isLoading = computed(() => this._isLoading());
    readonly error = computed(() => this._error());

    // Actions
    loadProjects(userId: number): void {
        this._isLoading.set(true);
        this.commonService.fetchUserProjectDropdown(userId)
            .pipe(
                tap(projects => this._projects.set(projects || [])),
                catchError(err => {
                    this._error.set('Failed to load projects');
                    return of([]);
                }),
                finalize(() => this._isLoading.set(false))
            )
            .subscribe();
    }

    loadLastMonthTargets(
        projectId: number,
        userId: number | null = null,
        targetFrom: string | null = null,
        targetTo: string | null = null
    ): void {
        this._isLoading.set(true);
        this.commonService.fetchLastMonthTargets(projectId, userId, targetFrom, targetTo)
            .pipe(
                tap(res => {
                    const data = (res && res.success && Array.isArray(res.data)) ? res.data : [];
                    this._lastMonthTargets.set(data);
                }),
                catchError(err => {
                    console.error('Error fetching targets:', err);
                    this._error.set('Failed to load targets');
                    return of(null);
                }),
                finalize(() => this._isLoading.set(false))
            )
            .subscribe();
    }

    saveTarget(
        endpoint: string,
        payload: any[]
    ): Observable<{ success: boolean; message: string }> {
        this._isLoading.set(true);
        return this.http.post<{ success: boolean; message: string }>(
            `${this.baseUrl}/${endpoint}`,
            payload
        ).pipe(
            finalize(() => this._isLoading.set(false))
        );
    }

    clearTargets(): void {
        this._lastMonthTargets.set([]);
    }
}
