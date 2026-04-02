import { Injectable, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, EMPTY, Subject } from 'rxjs';
import { shareReplay, retry, catchError, takeUntil, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';

export interface AgGridDataSourceParams {
  startRow: number;
  endRow: number;
  filterModel?: unknown;
  sortModel?: unknown;
}

export interface AgGridDataSourceResult {
  rowData: unknown[];
  rowCount?: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class AgGridDataService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly baseUrl = environment.API_URL;
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly cancelRequest$ = new Subject<void>();

  fetchData(
    endpoint: string,
    method: 'GET' | 'POST',
    payload: Record<string, unknown>,
    retryCount: number = 2
  ): Observable<unknown> {
    const request = method === 'GET'
      ? this.http.get<unknown>(`${this.baseUrl}/${endpoint}`, { params: payload as Record<string, string> })
      : this.http.post<unknown>(`${this.baseUrl}/${endpoint}`, payload);

    return request.pipe(
      retry({ count: retryCount, delay: 1000 }),
      catchError((error: HttpErrorResponse) => {
        console.error('Data fetch error:', error);
        throw error;
      }),
      takeUntil(this.cancelRequest$),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  clearCache(endpoint?: string): void {
    // Cache functionality removed to prevent loading state issues
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.cancelRequest$.next();
  }

  /**
   * Cleanup - called on service destruction
   * Note: Using DestroyRef for automatic cleanup instead of ngOnDestroy
   */
  constructor() {
    // Setup automatic cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cancelAllRequests();
    });
  }
}















