/**
 * Model interfaces for server-side infinite scroll pagination
 */

export interface InfiniteScrollTableRequest {
  readonly page: number;
  readonly limit: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
  readonly filters?: Record<string, unknown>;
  readonly searchTerm?: string;
}

export interface InfiniteScrollTableResponse<T = any> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore?: boolean;
}

export interface InfiniteScrollTableConfig {
  readonly endpoint: string;
  readonly method?: 'GET' | 'POST';
  readonly params?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly pageSize?: number; // Default: 100
  readonly loadThreshold?: number; // Default: 0.8 (80% scrolled)
}














































