import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay, catchError, of, map } from 'rxjs';
import { environment } from '../../../../../../../../environments/environment';

export interface Project {
  project_id: number;
  property_name: string;
}

export interface Wing {
  wing_id: number;
  wing_name: string;
}

export interface Floor {
  floor_id: number;
  floor_name: string;
}

export interface ProjectConfiguration {
  configuration_id: number;
  configuration_name: string;
}

export interface PaginationParams {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface FilterPayload {
  project_id?: number;
  wing_id?: number;
  floor_id?: number;
  booking_status_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface AgreementPayload extends PaginationParams {
  filters: FilterPayload;
}

@Injectable({ providedIn: 'root' })
export class PendingAgreementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  // Cache for dropdown data with shareReplay for multicasting
  private projectsCache$?: Observable<Project[]>;
  private readonly wingsCache = new Map<number, Observable<Wing[]>>();
  private readonly floorsCache = new Map<string, Observable<Floor[]>>();

  /**
   * Fetches projects dropdown with caching
   */
  fetchProjects(userId: number): Observable<Project[]> {
    if (!this.projectsCache$) {
      this.projectsCache$ = this.http
        .post<Project[]>(`${this.baseUrl}/user_project_dropdown`, { user_id: userId })
        .pipe(
          shareReplay(1),
          catchError((error) => {
            console.error('Error fetching projects:', error);
            return of([]);
          })
        );
    }
    return this.projectsCache$;
  }

  /**
   * Fetches wings for a project with caching
   */
  fetchWings(projectId: number): Observable<Wing[]> {
    const cacheKey = projectId;
    if (!this.wingsCache.has(cacheKey)) {
      const wings$ = this.http
        .post<Wing[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectId })
        .pipe(
          shareReplay(1),
          catchError((error) => {
            console.error('Error fetching wings:', error);
            return of([]);
          })
        );
      this.wingsCache.set(cacheKey, wings$);
    }
    return this.wingsCache.get(cacheKey)!;
  }

  /**
   * Fetches floors for a project and wing with caching
   */
  fetchFloors(projectId: number, wingId: number): Observable<Floor[]> {
    const cacheKey = `${projectId}-${wingId}`;
    if (!this.floorsCache.has(cacheKey)) {
      const floors$ = this.http
        .post<Floor[]>(`${this.baseUrl}/fetch_floor_dropdown`, {
          project_id: projectId,
          wing_id: wingId,
        })
        .pipe(
          shareReplay(1),
          catchError((error) => {
            console.error('Error fetching floors:', error);
            return of([]);
          })
        );
      this.floorsCache.set(cacheKey, floors$);
    }
    return this.floorsCache.get(cacheKey)!;
  }

  /**
   * Fetches unit types for project, wing, and floor
   */
  fetchUnitTypes(projectId: number, wingId: number, floorId: number): Observable<ProjectConfiguration[]> {
    return this.http
      .post<{ data: ProjectConfiguration[] }>(`${this.baseUrl}/fetch_unit_type`, {
        project_id: projectId,
        wing_id: wingId,
        floor_id: floorId,
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching unit types:', error);
          return of([]);
        })
      );
  }

  /**
   * Sends email to customer
   */
  sendEmailToCustomer(bookingId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/send_email_to_customer`, {
      booking_id: bookingId,
    });
  }

  /**
   * Invalidates caches (useful for refresh scenarios)
   */
  invalidateCaches(): void {
    this.projectsCache$ = undefined;
    this.wingsCache.clear();
    this.floorsCache.clear();
  }
}

