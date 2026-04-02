import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, catchError, map } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface City {
  city_id: number;
  city_name: string;
  sub_region_count?: number;
  updated_by_name?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface Subregion {
  sub_region_id: number;
  sub_region: string;
  city_id: number;
  created_by_name?: string;
  created_at?: string;
  updated_by_name?: string;
  updated_at?: string;
}

export interface LeadLevel {
  lead_level_id: number;
  lead_level: string;
  created_by_name?: string;
  created_at?: string;
  updated_by_name?: string;
  updated_at?: string;
}

export interface CallStatus {
  call_status_id: number;
  call_status: string;
  lead_level_id: number;
  active_status?: string;
  created_by_name?: string;
  created_at?: string;
  updated_by_name?: string;
  updated_at?: string;
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
}

/**
 * Service for managing city/subregion and lead level/call status data
 * Uses modern Angular patterns with proper error handling and caching
 */
@Injectable({ providedIn: 'root' })
export class CitySubregionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  // Cache for cities and lead levels (shareReplay for multicasting)
  private citiesCache$?: Observable<City[]>;
  private leadLevelsCache$?: Observable<LeadLevel[]>;

  /**
   * Fetches all cities with caching
   */
  fetchCities(): Observable<City[]> {
    if (!this.citiesCache$) {
      this.citiesCache$ = this.http.get<City[]>(`${this.baseUrl}/fetch_cities`).pipe(
        map(res => res || []),
        catchError(error => {
          console.error('Error fetching cities:', error);
          return of([]);
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.citiesCache$;
  }

  /**
   * Clears cities cache (useful after mutations)
   */
  clearCitiesCache(): void {
    this.citiesCache$ = undefined;
  }

  /**
   * Fetches subregions for a specific city
   */
  fetchSubregions(cityId: number): Observable<Subregion[]> {
    return this.http.post<Subregion[]>(`${this.baseUrl}/fetch_sub_region`, { city_id: cityId }).pipe(
      map(res => res || []),
      catchError(error => {
        console.error('Error fetching subregions:', error);
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Fetches all lead levels with caching
   */
  fetchLeadLevels(): Observable<LeadLevel[]> {
    if (!this.leadLevelsCache$) {
      this.leadLevelsCache$ = this.http.get<LeadLevel[]>(`${this.baseUrl}/fetch_lead_level`).pipe(
        map(res => res || []),
        catchError(error => {
          console.error('Error fetching lead levels:', error);
          return of([]);
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.leadLevelsCache$;
  }

  /**
   * Clears lead levels cache (useful after mutations)
   */
  clearLeadLevelsCache(): void {
    this.leadLevelsCache$ = undefined;
  }

  /**
   * Fetches call statuses for a specific lead level
   */
  fetchCallStatuses(leadLevelId: number): Observable<CallStatus[]> {
    return this.http.post<CallStatus[]>(`${this.baseUrl}/fetch_call_status`, { lead_level_id: leadLevelId }).pipe(
      map(res => res || []),
      catchError(error => {
        console.error('Error fetching call statuses:', error);
        return of([]);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  /**
   * Deletes a city
   */
  deleteCity(cityId: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(`${this.baseUrl}/delete_city`, { city_id: cityId }).pipe(
      catchError(error => {
        console.error('Error deleting city:', error);
        throw error;
      })
    );
  }

  /**
   * Deletes a subregion
   */
  deleteSubregion(subregionId: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(`${this.baseUrl}/delete_sub_region`, { sub_region_id: subregionId }).pipe(
      catchError(error => {
        console.error('Error deleting subregion:', error);
        throw error;
      })
    );
  }

  /**
   * Deletes a lead level
   */
  deleteLeadLevel(leadLevelId: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(`${this.baseUrl}/delete_lead_level`, { lead_level_id: leadLevelId }).pipe(
      catchError(error => {
        console.error('Error deleting lead level:', error);
        throw error;
      })
    );
  }

  /**
   * Deletes a call status
   */
  deleteCallStatus(callStatusId: number): Observable<DeleteResponse> {
    return this.http.post<DeleteResponse>(`${this.baseUrl}/delete_call_status`, { call_status_id: callStatusId }).pipe(
      catchError(error => {
        console.error('Error deleting call status:', error);
        throw error;
      })
    );
  }
}






















