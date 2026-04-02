import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InfiniteScrollTableRequest, InfiniteScrollTableResponse } from './infinite-scroll-table.model';
import { InfiniteScrollTableService } from './infinite-scroll-table.service';
import { environment } from '../../../../environments/environment';

/**
 * Example service implementation showing how to use InfiniteScrollTableService
 * Replace this with your actual API service
 */
@Injectable({
  providedIn: 'root'
})
export class ExampleInfiniteScrollService {
  private baseUrl = environment.API_URL;

  constructor(
    private http: HttpClient,
    private infiniteScrollService: InfiniteScrollTableService
  ) {}

  /**
   * Example: Fetch data with page + limit pagination
   * Your API should accept:
   *   - page: number (1-based or 0-based, adjust accordingly)
   *   - limit: number
   *   - sortBy?: string
   *   - sortOrder?: 'asc' | 'desc'
   *   - search?: string
   *   - filter[key]?: string (for column filters)
   * 
   * And return:
   *   {
   *     data: T[],
   *     total: number,
   *     page?: number,
   *     limit?: number,
   *     hasMore?: boolean
   *   }
   */
  fetchDataExample<T = any>(
    endpoint: string,
    request: InfiniteScrollTableRequest
  ): Observable<InfiniteScrollTableResponse<T>> {
    // Option 1: Use the InfiniteScrollTableService (recommended)
    const config = {
      endpoint: `${this.baseUrl}${endpoint}`,
      method: 'GET' as const,
      params: {
        // Add any additional params like account_id, session_id, etc.
        account_id: sessionStorage.getItem('account_id'),
        session_id: sessionStorage.getItem('session_id')
      },
      headers: {
        'Content-Type': 'application/json'
      },
      pageSize: 100, // Default chunk size
      loadThreshold: 0.8 // Load when 80% scrolled
    };

    return this.infiniteScrollService.fetchDataChunk<T>(config, request);
  }

  /**
   * Option 2: Direct API call example (if you need custom logic)
   */
  fetchDataDirect<T = any>(
    endpoint: string,
    request: InfiniteScrollTableRequest
  ): Observable<InfiniteScrollTableResponse<T>> {
    const params: any = {
      page: request.page,
      limit: request.limit
    };

    if (request.sortBy) {
      params.sortBy = request.sortBy;
      params.sortOrder = request.sortOrder || 'asc';
    }

    if (request.searchTerm) {
      params.search = request.searchTerm;
    }

    // Add filters
    if (request.filters) {
      Object.entries(request.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params[`filter[${key}]`] = value;
        }
      });
    }

    return this.http.get<any>(`${this.baseUrl}${endpoint}`, { params })
      .pipe(
        map(response => ({
          data: response.data || response.items || [],
          total: response.total || response.totalCount || 0,
          page: response.page !== undefined ? response.page : request.page,
          limit: response.limit !== undefined ? response.limit : request.limit,
          hasMore: response.hasMore !== undefined 
            ? response.hasMore 
            : ((response.page || request.page) * (response.limit || request.limit)) < (response.total || 0)
        }))
      );
  }
}

/**
 * USAGE EXAMPLE in Component:
 * 
 * ```typescript
 * export class MyComponent {
 *   infiniteScrollConfig: InfiniteScrollTableConfig = {
 *     endpoint: '/api/my-endpoint',
 *     method: 'GET',
 *     params: {
 *       account_id: sessionStorage.getItem('account_id')
 *     },
 *     pageSize: 100,
 *     loadThreshold: 0.8
 *   };
 * 
 *   columns: TableColumn[] = [
 *     { key: 'id', label: 'ID' },
 *     { key: 'name', label: 'Name' },
 *     { key: 'actions', label: 'Actions', type: 'actions' }
 *   ];
 * }
 * ```
 * 
 * ```html
 * <app-reusable-custom-table
 *   [displayedColumns]="columns"
 *   [enableInfiniteScroll]="true"
 *   [infiniteScrollConfig]="infiniteScrollConfig"
 *   [infiniteScrollPageSize]="100"
 *   [infiniteScrollLoadThreshold]="0.8"
 *   [virtualScrolling]="true"
 *   [changeDetection]="ChangeDetectionStrategy.OnPush">
 * </app-reusable-custom-table>
 * ```
 */














































