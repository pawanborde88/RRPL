import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { InfiniteScrollTableRequest, InfiniteScrollTableResponse, InfiniteScrollTableConfig } from './infinite-scroll-table.model';

/**
 * Service for handling server-side infinite scroll pagination
 * API must support page + limit parameters and return { data, total }
 */
@Injectable({
  providedIn: 'root'
})
export class InfiniteScrollTableService {
  constructor(private http: HttpClient) {}

  /**
   * Fetches a chunk of data from the server
   * @param config Configuration for the API call
   * @param request Request parameters (page, limit, filters, etc.)
   * @returns Observable with response containing data and total count
   */
  fetchDataChunk<T = any>(
    config: InfiniteScrollTableConfig,
    request: InfiniteScrollTableRequest
  ): Observable<InfiniteScrollTableResponse<T>> {
    const params = this.buildRequestParams(request, config);
    const headers = this.buildHeaders(config);

    if (config.method === 'POST') {
      return this.http.post<InfiniteScrollTableResponse<T>>(
        config.endpoint,
        { ...request, ...config.params },
        { headers, params }
      ).pipe(
        map(response => this.normalizeResponse<T>(response, request)),
        catchError(error => {
          console.error('Error fetching data chunk:', error);
          throw error;
        })
      );
    } else {
      // GET request
      return this.http.get<InfiniteScrollTableResponse<T>>(
        config.endpoint,
        { headers, params }
      ).pipe(
        map(response => this.normalizeResponse<T>(response, request)),
        catchError(error => {
          console.error('Error fetching data chunk:', error);
          throw error;
        })
      );
    }
  }

  /**
   * Builds HTTP params for GET requests
   */
  private buildRequestParams(
    request: InfiniteScrollTableRequest,
    config: InfiniteScrollTableConfig
  ): HttpParams {
    let params = new HttpParams()
      .set('page', request.page.toString())
      .set('limit', request.limit.toString());

    if (request.sortBy) {
      params = params.set('sortBy', request.sortBy);
      if (request.sortOrder) {
        params = params.set('sortOrder', request.sortOrder);
      }
    }

    if (request.searchTerm) {
      params = params.set('search', request.searchTerm);
    }

    // Add custom params from config
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          params = params.set(key, String(value));
        }
      });
    }

    // Add filters
    if (request.filters) {
      Object.entries(request.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(`filter[${key}]`, String(value));
        }
      });
    }

    return params;
  }

  /**
   * Builds HTTP headers
   */
  private buildHeaders(config: InfiniteScrollTableConfig): HttpHeaders {
    let headers = new HttpHeaders();
    
    if (config.headers) {
      Object.entries(config.headers).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Normalizes API response to ensure consistent format
   */
  private normalizeResponse<T>(
    response: any,
    request: InfiniteScrollTableRequest
  ): InfiniteScrollTableResponse<T> {
    // Handle different response formats
    const data = response.data || response.items || response.results || [];
    const total = response.total || response.totalCount || response.count || 0;
    const page = response.page !== undefined ? response.page : request.page;
    const limit = response.limit !== undefined ? response.limit : request.limit;
    
    // Calculate hasMore
    const hasMore = response.hasMore !== undefined 
      ? response.hasMore 
      : (page * limit) < total;

    return {
      data: Array.isArray(data) ? data : [],
      total,
      page,
      limit,
      hasMore
    };
  }
}

