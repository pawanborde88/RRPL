import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, concatMap, retry, retryWhen, shareReplay, map } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment';
import {
  Project,
  Wing,
  ProjectBankResponse,
  BankDetail,
  ProjectBankData,
  WingData,
} from '../models/project-bank-master.models';

export interface PreferredBank {
  preferred_bank_id: number;
  preferred_bank: string;
  [key: string]: any;
}

/**
 * Unified service for Project Bank Master API operations
 * Handles all HTTP calls with retry logic, caching, and error handling
 * Combines functionality from both ProjectBankMasterService and ProjectBankDetailsService
 */
@Injectable({ providedIn: 'root' })
export class ProjectBankMasterService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  // Cache for projects per user (for user-specific projects)
  private readonly projectsCache = new Map<number | null, Observable<Project[]>>();

  // Cache for all projects (for general project dropdown)
  private projectsCache$?: Observable<Project[]>;

  // Cache for wings per project
  private readonly wingsCache = new Map<number, Observable<Wing[]>>();

  // Cache for land owners per project
  private readonly landOwnersCache = new Map<number, Observable<any[]>>();

  // Cache for preferred banks (shared across instances)
  private banksCache$?: Observable<PreferredBank[]>;

  // ============================================================================
  // Project Methods
  // ============================================================================

  /**
   * Fetch projects for a user with caching and retry logic
   * Used by all-project-bank-master component
   */
  fetchProjects(userId: number | null): Observable<Project[]>;
  /**
   * Fetch all projects with caching
   * Used by update-bank-details component
   */
  fetchProjects(): Observable<Project[]>;
  fetchProjects(userId?: number | null): Observable<Project[]> {
    // If userId is provided, use user-specific endpoint
    if (userId !== undefined && userId !== null) {
      if (!this.projectsCache.has(userId)) {
        const projects$ = this.http
          .post<Project[]>(`${this.baseUrl}/user_project_dropdown`, { user_id: userId })
          .pipe(
            retryWhen((errors) =>
              errors.pipe(
                concatMap((error, index) => {
                  if (index < 2) {
                    return timer(1000 * (index + 1)); // Exponential backoff: 1s, 2s
                  }
                  return throwError(() => error);
                })
              )
            ),
            catchError((error) => {
              console.error('Error fetching projects:', error);
              return throwError(() => new Error('Unable to fetch projects'));
            }),
            shareReplay({ bufferSize: 1, refCount: true })
          );

        this.projectsCache.set(userId, projects$);
      }
      return this.projectsCache.get(userId)!;
    }

    // Otherwise, use general project dropdown endpoint
    if (!this.projectsCache$) {
      this.projectsCache$ = this.http
        .get<Project[]>(`${this.baseUrl}/project_dropdown`)
        .pipe(
          retry({ count: 2, delay: 1000 }),
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError((error) => {
            console.error('Error fetching projects:', error);
            return of([]);
          })
        );
    }
    return this.projectsCache$;
  }

  // ============================================================================
  // Wing Methods
  // ============================================================================

  /**
   * Fetch wings for a project with caching and retry logic
   */
  fetchWings(projectId: number): Observable<Wing[]> {
    if (!this.wingsCache.has(projectId)) {
      const wings$ = this.http
        .post<Wing[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectId })
        .pipe(
          retryWhen((errors) =>
            errors.pipe(
              concatMap((error, index) => {
                if (index < 2) {
                  return timer(1000 * (index + 1)); // Exponential backoff: 1s, 2s
                }
                return throwError(() => error);
              })
            )
          ),
          catchError((error) => {
            console.error(`Error fetching wings for project ${projectId}:`, error);
            return throwError(() => new Error('No wings available for selection'));
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );

      this.wingsCache.set(projectId, wings$);
    }

    return this.wingsCache.get(projectId)!;
  }
  fetchLandOwners(projectId: number): Observable<any[]> {
    if (!this.landOwnersCache.has(projectId)) {
      const landOwners$ = this.http
        .post<any>(`${this.baseUrl}/fetch_land_owners`, { project_id: projectId })
        .pipe(
          map(res => res && res.data ? res.data : []),
          retryWhen((errors) =>
            errors.pipe(
              concatMap((error, index) => {
                if (index < 2) {
                  return timer(1000 * (index + 1)); // Exponential backoff: 1s, 2s
                }
                return throwError(() => error);
              })
            )
          ),
          catchError((error) => {
            console.error(`Error fetching land owners for project ${projectId}:`, error);
            return throwError(() => new Error('No land owners available for selection'));
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );

      this.landOwnersCache.set(projectId, landOwners$);
    }

    return this.landOwnersCache.get(projectId)!;
  }

  // ============================================================================
  // Preferred Bank Methods
  // ============================================================================

  /**
   * Fetch preferred banks with caching
   */
  fetchPreferredBanks(): Observable<PreferredBank[]> {
    if (!this.banksCache$) {
      this.banksCache$ = this.http
        .get<PreferredBank[]>(`${this.baseUrl}/fetch_preferred_bank`)
        .pipe(
          retry({ count: 2, delay: 1000 }),
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError((error) => {
            console.error('Error fetching preferred banks:', error);
            return of([]);
          })
        );
    }
    return this.banksCache$;
  }

  // ============================================================================
  // Project Bank Methods
  // ============================================================================

  /**
   * Fetch project banks for a specific project and wing
   */
  fetchProjectBanks(
    projectId: number | null,
    wingId: number | null,
    landOwnerSetupId?: number | null
  ): Observable<ProjectBankResponse> {
    const payload: any = {
      project_id: projectId,
      wing_id: wingId,
    };
    if (landOwnerSetupId !== undefined && landOwnerSetupId !== null) {
      payload.land_owner_setup_id = landOwnerSetupId;
    }

    return this.http
      .post<ProjectBankResponse>(`${this.baseUrl}/fetch_project_banks`, payload)
      .pipe(
        retryWhen((errors) =>
          errors.pipe(
            concatMap((error, index) => {
              if (index < 2) {
                return timer(1000 * (index + 1)); // Exponential backoff: 1s, 2s
              }
              return throwError(() => error);
            })
          )
        ),
        catchError((error) => {
          console.error(
            `Error fetching project banks for project ${projectId}, wing ${wingId}:`,
            error
          );
          return throwError(() => new Error('Unable to fetch project banks'));
        })
      );
  }

  /**
   * Submit bank details (add or update)
   */
  submitBankDetails(payload: any[]): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/add_project_bank_master`, payload)
      .pipe(
        retry({ count: 1, delay: 1000 }),
        catchError((error) => {
          console.error('Error submitting bank details:', error);
          throw error;
        })
      );
  }

  /**
   * Delete project bank
   */
  deleteProjectBank(projectBankId: number): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/delete_project_bank`, {
        project_bank_id: projectBankId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error deleting project bank:', error);
          return throwError(() => new Error('Unable to delete bank data'));
        })
      );
  }

  // ============================================================================
  // Cache Management Methods
  // ============================================================================

  /**
   * Clear cache for a specific user (useful when user changes)
   */
  clearProjectsCache(userId: number | null): void {
    this.projectsCache.delete(userId);
  }

  /**
   * Clear wings cache for a specific project
   */
  clearWingsCache(projectId: number): void {
    this.wingsCache.delete(projectId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.projectsCache.clear();
    this.wingsCache.clear();
    this.landOwnersCache.clear();
    this.projectsCache$ = undefined;
    this.banksCache$ = undefined;
  }

  /**
   * Clear caches (alias for backward compatibility)
   */
  clearCache(): void {
    this.clearAllCaches();
  }
}

// Re-export interfaces for backward compatibility
export type {
  Project,
  Wing,
  BankDetail,
  ProjectBankData,
  WingData,
  ProjectBankResponse,
};
