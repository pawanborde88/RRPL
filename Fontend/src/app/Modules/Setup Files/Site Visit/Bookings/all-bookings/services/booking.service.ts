import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, catchError } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { 
  BookingInfo, 
  Project, 
  Wing, 
  Floor, 
  BookingFilterPayload,
  ApiResponse 
} from '../all-bookings.component';

/**
 * Service responsible for all booking-related API calls
 * Follows Single Responsibility Principle
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  // Cache for dropdown data (shareReplay for multicasting)
  private projectsCache$?: Observable<Project[]>;
  private readonly wingsCache = new Map<string, Observable<Wing[]>>();
  private readonly floorsCache = new Map<string, Observable<Floor[]>>();

  /**
   * Fetches all bookings based on filter payload
   */
  fetchBookings(payload: BookingFilterPayload): Observable<BookingInfo[]> {
    return this.http.post<BookingInfo[]>(`${this.baseUrl}/fetch_booking`, payload).pipe(
      catchError((error) => {
        console.error('Error fetching bookings:', error);
        return of([]);
      })
    );
  }

  /**
   * Fetches projects dropdown with caching
   */
  fetchProjects(userId?: number | null): Observable<Project[]> {
    if (!this.projectsCache$) {
      const payload = { user_id: userId ?? null };
      this.projectsCache$ = this.http.post<Project[]>(
        `${this.baseUrl}/user_project_dropdown`, 
        payload
      ).pipe(
        shareReplay(1),
        catchError((error) => {
          console.error('Error fetching projects:', error);
          this.projectsCache$ = undefined;
          return of([]);
        })
      );
    }
    return this.projectsCache$;
  }

  /**
   * Fetches wings dropdown with caching
   */
  fetchWings(projectId: number | number[]): Observable<Wing[]> {
    const key = Array.isArray(projectId) ? projectId.join(',') : String(projectId);
    
    if (!this.wingsCache.has(key)) {
      const projectIds = Array.isArray(projectId) ? projectId : [projectId];
      const cache$ = this.http.post<Wing[]>(
        `${this.baseUrl}/wing_dropdown`, 
        { project_id: projectIds.length === 1 ? projectIds[0] : projectIds }
      ).pipe(
        shareReplay(1),
        catchError((error) => {
          console.error('Error fetching wings:', error);
          this.wingsCache.delete(key);
          return of([]);
        })
      );
      this.wingsCache.set(key, cache$);
    }
    
    return this.wingsCache.get(key)!;
  }

  /**
   * Fetches floors dropdown with caching
   */
  fetchFloors(projectId: number | number[], wingId: number): Observable<Floor[]> {
    const key = `${Array.isArray(projectId) ? projectId.join(',') : projectId}_${wingId}`;
    
    if (!this.floorsCache.has(key)) {
      const projectIds = Array.isArray(projectId) ? projectId : [projectId];
      const cache$ = this.http.post<Floor[]>(
        `${this.baseUrl}/fetch_floor_dropdown`,
        {
          project_id: projectIds.length === 1 ? projectIds[0] : projectIds,
          wing_id: wingId
        }
      ).pipe(
        shareReplay(1),
        catchError((error) => {
          console.error('Error fetching floors:', error);
          this.floorsCache.delete(key);
          return of([]);
        })
      );
      this.floorsCache.set(key, cache$);
    }
    
    return this.floorsCache.get(key)!;
  }

  /**
   * Cancels a booking
   */
  cancelBooking(bookingId: number, updatedBy: number, cancelRemark: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/cancel_booking`, {
      booking_id: bookingId,
      updated_by: updatedBy,
      cancel_remark: cancelRemark
    }).pipe(
      catchError((error) => {
        console.error('Error cancelling booking:', error);
        return of({ success: false, message: 'Failed to cancel booking' } as ApiResponse<unknown>);
      })
    );
  }

  /**
   * Deletes a booking
   */
  deleteBooking(bookingId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/delete_booking`, {
      booking_id: bookingId
    }).pipe(
      catchError((error) => {
        console.error('Error deleting booking:', error);
        return of({ success: false, message: 'Failed to delete booking' } as ApiResponse<unknown>);
      })
    );
  }

  /**
   * Clears caches (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.projectsCache$ = undefined;
    this.wingsCache.clear();
    this.floorsCache.clear();
  }
}



































