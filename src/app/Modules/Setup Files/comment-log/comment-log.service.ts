import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  CommentLog,
  LeadLevel,
  CallStatus,
  CommentFormData,
  ApiResponse,
} from './comment-log.models';

/**
 * Service for managing comment logs with caching and state management
 * Uses RxJS for reactive data flow and implements caching strategies
 */
@Injectable({
  providedIn: 'root',
})
export class CommentLogService {
  private readonly baseUrl = environment.API_URL;
  
  // State management with BehaviorSubjects for reactive updates
  private readonly commentsSubject = new BehaviorSubject<CommentLog[]>([]);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  
  // Public observables for components
  public readonly comments$ = this.commentsSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  
  // Cache for dropdown data to avoid redundant API calls
  private leadLevelsCache$?: Observable<LeadLevel[]>;
  private callStatusCache = new Map<number, Observable<CallStatus[]>>();

  constructor(private readonly http: HttpClient) {}

  /**
   * Fetch comment logs with optimized caching
   */
  fetchComments(
    apiEndpoint: string,
    payload: { [key: string]: any }
  ): Observable<CommentLog[]> {
    this.loadingSubject.next(true);
    
    return this.http.post<CommentLog[]>(`${this.baseUrl}/${apiEndpoint}`, payload).pipe(
      tap((comments) => {
        this.commentsSubject.next(comments);
        this.loadingSubject.next(false);
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch lead levels with caching to prevent redundant API calls
   * Uses shareReplay to cache the result
   */
  fetchLeadLevels(): Observable<LeadLevel[]> {
    if (!this.leadLevelsCache$) {
      this.leadLevelsCache$ = this.http
        .get<LeadLevel[]>(`${this.baseUrl}/fetch_lead_level`)
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError((error) => {
            // Clear cache on error
            this.leadLevelsCache$ = undefined;
            return throwError(() => error);
          })
        );
    }
    return this.leadLevelsCache$;
  }

  /**
   * Fetch call status with per-leadLevel caching
   * Implements Map-based caching strategy
   */
  fetchCallStatus(leadLevelId: number): Observable<CallStatus[]> {
    if (!this.callStatusCache.has(leadLevelId)) {
      const callStatus$ = this.http
        .post<CallStatus[]>(`${this.baseUrl}/call_status_dropdown`, {
          lead_level_id: leadLevelId,
        })
        .pipe(
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError((error) => {
            // Remove from cache on error
            this.callStatusCache.delete(leadLevelId);
            return throwError(() => error);
          })
        );
      
      this.callStatusCache.set(leadLevelId, callStatus$);
    }
    
    return this.callStatusCache.get(leadLevelId)!;
  }

  /**
   * Submit comment with optimistic UI update
   */
  submitComment(
    apiUrl: string,
    formData: CommentFormData
  ): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/${apiUrl}`, formData)
      .pipe(
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Delete comment with optimistic UI update
   */
  deleteComment(
    apiEndpoint: string,
    payload: { [key: string]: number }
  ): Observable<ApiResponse> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/${apiEndpoint}`, payload)
      .pipe(
        catchError((error) => throwError(() => error))
      );
  }

  /**
   * Clear cache when needed (e.g., on logout)
   */
  clearCache(): void {
    this.leadLevelsCache$ = undefined;
    this.callStatusCache.clear();
  }

  /**
   * Reset state
   */
  resetState(): void {
    this.commentsSubject.next([]);
    this.loadingSubject.next(false);
  }
}





















































