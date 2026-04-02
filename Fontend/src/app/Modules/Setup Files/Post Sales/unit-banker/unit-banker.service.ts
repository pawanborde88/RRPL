import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Observable, throwError, shareReplay, catchError, finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';

export interface Project {
  project_id: number;
  property_name: string;
  [key: string]: any;
}

export interface Wing {
  wing_id: number;
  wing_name: string;
  [key: string]: any;
}

export interface Unit {
  floor_unit_id: number;
  floor_unit: string;
  applicant_name: string;
  booking_id: number;
  full_name: string;
  [key: string]: any;
}

export interface BankerType {
  banker_type_id: number;
  banker_type: string;
  [key: string]: any;
}

export interface LoanStatus {
  loan_status_id: number;
  loan_staus: string;
  [key: string]: any;
}

export interface PreferredBank {
  preferred_bank_id: number;
  preferred_bank: string;
  [key: string]: any;
}

export interface BookingData {
  agreement_cost: number;
  package_total: number;
  sanction_amt: number;
  funding_amt: number;
  gst: number;
  stamp_duty: number;
  reg: number;
  society_for: number;
  legal: number;
  maintenance: number;
  parking_charges: number;
  other: number;
  sanction_letter_date: string | null;
  loan_status: number | string;
  banker_type: number | string;
  [key: string]: any;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: number;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class UnitBankerService {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly baseUrl = environment.API_URL;
  private readonly roleId = Number(sessionStorage.getItem('role_id') || '0');
  private readonly userId = Number(sessionStorage.getItem('session_id') || '0');

  // Cache for static dropdowns using shareReplay
  private projectsCache$?: Observable<Project[]>;
  private bankerTypesCache$?: Observable<BankerType[]>;
  private loanStatusCache$?: Observable<LoanStatus[]>;
  private preferredBanksCache$?: Observable<PreferredBank[]>;

  /**
   * Fetches all projects with caching
   */
  fetchProjects(): Observable<Project[]> {
    if (!this.projectsCache$) {
      const payload = {
        user_id:  this.userId
      };

      this.projectsCache$ = this.http.post<Project[]>(`${this.baseUrl}/user_project_dropdown`, payload)
        .pipe(
          shareReplay(1),
          catchError(this.handleError<Project[]>('Unable to fetch projects.'))
        );
    }
    return this.projectsCache$;
  }

  /**
   * Fetches wings for a project
   */
  fetchWings(projectId: number): Observable<Wing[]> {
    return this.http.post<Wing[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectId })
      .pipe(
        catchError(this.handleError<Wing[]>('No wings available for selection'))
      );
  }

  /**
   * Fetches units for project and wing
   */
  fetchUnits(projectId: number | string, wingId: number | string): Observable<{ data: any[] }> {
    return this.http.post<{ data: any[] }>(`${this.baseUrl}/booking_unit_dropdown`, {
      project_id: projectId,
      wing_id: wingId
    }).pipe(
      catchError(this.handleError<{ data: any[] }>('Unable to fetch units.'))
    );
  }

  /**
   * Fetches loan status with caching
   */
  fetchLoanStatus(): Observable<LoanStatus[]> {
    if (!this.loanStatusCache$) {
      this.loanStatusCache$ = this.http.get<LoanStatus[]>(`${this.baseUrl}/loan_status_dropdown`)
        .pipe(
          shareReplay(1),
          catchError(this.handleError<LoanStatus[]>('Unable to fetch loan status options.'))
        );
    }
    return this.loanStatusCache$;
  }

  /**
   * Fetches banker types with caching
   */
  fetchBankerTypes(): Observable<BankerType[]> {
    if (!this.bankerTypesCache$) {
      this.bankerTypesCache$ = this.http.get<BankerType[]>(`${this.baseUrl}/banker_type_dropdown`)
        .pipe(
          shareReplay(1),
          catchError(this.handleError<BankerType[]>('Unable to fetch banker types.'))
        );
    }
    return this.bankerTypesCache$;
  }

  /**
   * Fetches preferred banks with caching
   */
  fetchPreferredBanks(): Observable<PreferredBank[]> {
    if (!this.preferredBanksCache$) {
      this.preferredBanksCache$ = this.http.get<PreferredBank[]>(`${this.baseUrl}/preferred_bank_dropdown`)
        .pipe(
          shareReplay(1),
          catchError(this.handleError<PreferredBank[]>('Unable to fetch bank options.'))
        );
    }
    return this.preferredBanksCache$;
  }

  /**
   * Fetches booking data for a unit
   */
  fetchBookingData(bookingId: number): Observable<ApiResponse<BookingData>> {
    return this.http.post<ApiResponse<BookingData>>(`${this.baseUrl}/fetch_single_booking`, { booking_id: bookingId })
      .pipe(
        catchError(this.handleError<ApiResponse<BookingData>>('Unable to fetch booking details.'))
      );
  }

  /**
   * Fetches unit banker details by ID
   */
  fetchUnitBankerDetails(unitBankerId: number | string): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/fetch_unit_banker`, { unit_banker_id: unitBankerId })
      .pipe(
        catchError(this.handleError<any[]>('Unable to fetch unit banker details.'))
      );
  }

  /**
   * Submits unit banker form
   */
  submitUnitBanker(formData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/add_unit_bankers`, formData)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.dialog.open(SuccessDialogComponent, {
            data: { message: error.error?.message || 'Something went wrong' },
          });
          return throwError(() => error);
        })
      );
  }

  /**
   * Centralized error handler
   */
  private handleError<T>(message: string) {
    return (error: HttpErrorResponse): Observable<T> => {
      this.snackBar.open(message, 'Close', { duration: 3000 });
      return throwError(() => error);
    };
  }

  /**
   * Clears caches (useful for refresh scenarios)
   */
  clearCache(): void {
    this.projectsCache$ = undefined;
    this.bankerTypesCache$ = undefined;
    this.loanStatusCache$ = undefined;
    this.preferredBanksCache$ = undefined;
  }
}

