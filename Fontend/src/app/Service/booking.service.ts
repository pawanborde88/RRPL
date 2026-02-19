import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay, catchError, of, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Applicant {
  applicant_id?: number | null;
  booking_id?: number | null;
  salutation_id?: number | null;
  salution_id?: number | null;
  first_name: string;
  middle_name?: string;
  last_name: string;
  occupation_id?: number | null;
  alternate_mobile_no?: string;
  whatsapp_no?: string;
  pan_no?: string;
  aadhar_no?: string;
  dob?: string | Date | null;
  anniversary_date?: string | Date | null;
  current_address?: string;
  permanent_address?: string;
  mobile_no: string;
  email: string;
  occupation_string?: string;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  updated_by_name?: string;
  [key: string]: unknown;
}

export interface BookingInfo {
  booking_id?: number;
  project_id?: number;
  project_name?: string;
  booking_date?: string;
  applicant_name?: string;
  booking_from?: string;
  token_type?: string;
  sales_executive?: string;
  project_enq_id?: number;
  token_id?: number;
  token_type_id?: number;
  sales_executive_id?: number;
  user_id?: number;
  booking_from_id?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  status?: boolean;
  data?: T;
  message?: string;
  booking_id?: number;
}

export interface Project {
  project_id: number;
  property_name: string;
  [key: string]: unknown;
}

export interface TokenType {
  token_type_id: number;
  token_type: string;
  [key: string]: unknown;
}

export interface TokenItem {
  token_id: number;
  full_name: string;
  mob_no?: string;
  mobile_no?: string;
  displayText?: string;
  [key: string]: unknown;
}

export interface EnquiryItem {
  project_enq_id: number;
  full_name: string;
  mobile_no: string;
  displayText?: string;
  [key: string]: unknown;
}

export interface SalesExecutive {
  user_id: number;
  user_name: string;
  [key: string]: unknown;
}

export interface BookingFrom {
  booking_from_id: number;
  booking_from: string;
  [key: string]: unknown;
}

export interface CreateBookingPayload {
  project_id: number | string;
  sales_executive_id: number | string;
  booking_date: string;
  booking_from_id: number | string;
  created_by: number;
  token_type_id?: number | string;
  token_id?: number | string;
  project_enq_id?: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly baseUrl = environment.API_URL;

  // ⚡ Performance: Cache static dropdowns with shareReplay
  private bookingFromDropdownCache$?: Observable<BookingFrom[]>;
  private projectsCache: Map<string, Observable<Project[]>> = new Map();

  constructor(private http: HttpClient) { }

  fetchSingleBooking(bookingId: number): Observable<ApiResponse<BookingInfo>> {
    return this.http.post<ApiResponse<BookingInfo>>(
      `${this.baseUrl}/fetch_single_booking`,
      { booking_id: bookingId }
    ).pipe(
      catchError(() => of({ success: false, message: 'Failed to fetch booking' } as ApiResponse<BookingInfo>))
    );
  }

  fetchBookingApplicants(bookingId: number): Observable<Applicant[]> {
    return this.http.post<Applicant[]>(
      `${this.baseUrl}/fetch_booking_applicant`,
      { booking_id: bookingId }
    ).pipe(
      catchError(() => of([]))
    );
  }

  fetchSingleToken(tokenId: number): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/fetch_single_token`, { token_id: tokenId });
  }

  addBookingApplicant(data: unknown): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.baseUrl}/add_booking_applicant`,
      data
    );
  }

  fetchAllOccupations(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/fetch_all_occupation`).pipe(
      catchError(() => of([]))
    );
  }

  fetchAllSalutations(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.baseUrl}/fetch_all_salutation`).pipe(
      catchError(() => of([]))
    );
  }

  // ⚡ Optimized methods for add-bookings component
  fetchProjects(userId: number | null): Observable<Project[]> {
    const cacheKey = userId?.toString() || 'null';

    if (!this.projectsCache.has(cacheKey)) {
      const request$ = this.http.post<Project[]>(
        `${this.baseUrl}/user_project_dropdown`,
        { user_id: userId }
      ).pipe(
        shareReplay(1),
        catchError(() => of([]))
      );
      this.projectsCache.set(cacheKey, request$);
    }

    return this.projectsCache.get(cacheKey)!;
  }

  fetchBookingFromDropdown(): Observable<BookingFrom[]> {
    if (!this.bookingFromDropdownCache$) {
      this.bookingFromDropdownCache$ = this.http.get<BookingFrom[]>(
        `${this.baseUrl}/booking_from_dropdown`
      ).pipe(
        shareReplay(1),
        catchError(() => of([]))
      );
    }
    return this.bookingFromDropdownCache$;
  }

  fetchSalesExecutives(projectId: number | string): Observable<SalesExecutive[]> {
    return this.http.post<SalesExecutive[]>(
      `${this.baseUrl}/project_sales_executive_dropdown`,
      { project_id: projectId }
    ).pipe(
      catchError(() => of([]))
    );
  }

  fetchEnquiries(projectId: number | string): Observable<EnquiryItem[]> {
    return this.http.post<EnquiryItem[]>(
      `${this.baseUrl}/fetch_project_enquiries_dropdown`,
      { project_id: projectId }
    ).pipe(
      map((items) => items.map((item) => ({
        ...item,
        displayText: `${item.full_name} (${item.mobile_no})`
      }))),
      catchError(() => of([]))
    );
  }

  fetchTokenTypes(projectId: number | string): Observable<TokenType[]> {
    return this.http.post<TokenType[]>(
      `${this.baseUrl}/token_type_dropdown`,
      { project_id: projectId }
    ).pipe(
      catchError(() => of([]))
    );
  }

  fetchTokens(projectId: number | string, tokenTypeId: number | string | null): Observable<TokenItem[]> {
    return this.http.post<TokenItem[]>(
      `${this.baseUrl}/fetch_token_dropdown`,
      {
        project_id: projectId,
        token_type_id: tokenTypeId ?? null,
      }
    ).pipe(
      map((items) => items.map((item) => ({
        ...item,
        displayText: `${item.full_name} - ${item.mob_no || item.mobile_no || ''}`
      }))),
      catchError(() => of([]))
    );
  }

  createBooking(payload: CreateBookingPayload): Observable<ApiResponse<BookingInfo>> {
    return this.http.post<ApiResponse<BookingInfo>>(
      `${this.baseUrl}/add_floor_unit_booking`,
      payload
    ).pipe(
      catchError(() => of({ success: false, message: 'Failed to create booking' } as ApiResponse<BookingInfo>))
    );
  }

  // ⚡ Extended methods for edit-booking-page component
  fetchSources(): Observable<Array<{ source_id: number; source: string }>> {
    return this.http.get<Array<{ source_id: number; source: string }>>(
      `${this.baseUrl}/source_dropdown`
    ).pipe(
      shareReplay(1),
      catchError(() => of([]))
    );
  }

  fetchBasedOns(): Observable<Array<{ based_on_id: number; based_on: string }>> {
    return this.http.get<Array<{ based_on_id: number; based_on: string }>>(
      `${this.baseUrl}/based_on_dropdown`
    ).pipe(
      shareReplay(1),
      catchError(() => of([]))
    );
  }

  fetchSourceDetails(sourceId: number | string): Observable<Array<{ source_detail_id: number; source_detail: string }>> {
    return this.http.post<Array<{ source_detail_id: number; source_detail: string }>>(
      `${this.baseUrl}/source_detail_dropdown`,
      { source_id: sourceId }
    ).pipe(
      catchError(() => of([]))
    );
  }

  fetchChannelPartners(searchText?: string, channelPartnerId?: number): Observable<Array<{ channel_partner_id: number; firm_name: string; cp_owner: string; full_name?: string }>> {
    const payload: any = {};
    if (channelPartnerId) {
      payload.channel_partner_id = channelPartnerId;
    } else if (searchText && searchText.trim().length > 3) {
      payload.firm_name = searchText.trim();
      payload.channel_partner_id = null;
    } else if (!channelPartnerId) {
      return of([]);
    }

    return this.http.post<Array<{ channel_partner_id: number; firm_name: string; cp_owner: string }>>(
      `${this.baseUrl}/channel_partner_dropdown`,
      payload
    ).pipe(
      map((items) => items.map((item) => ({
        ...item,
        full_name: `${item.firm_name} --(${item.cp_owner})`
      }))),
      catchError(() => of([]))
    );
  }

  fetchWings(projectId: number | string): Observable<Array<{ wing_id: number; wing_name: string }>> {
    return this.http.post<Array<{ wing_id: number; wing_name: string }>>(
      `${this.baseUrl}/wing_dropdown`,
      { project_id: projectId }
    ).pipe(
      catchError(() => of([]))
    );
  }

  fetchFloors(projectId: number | string, wingId: number | string): Observable<Array<{ floor_id: number; floor_name: string }>> {
    return this.http.post<Array<{ floor_id: number; floor_name: string }>>(
      `${this.baseUrl}/fetch_floor_dropdown`,
      { project_id: projectId, wing_id: wingId }
    ).pipe(
      catchError(() => of([]))
    );
  }

  fetchUnitTypes(projectId: number | string, wingId: number | string, floorId: number | string): Observable<{ data: Array<{ unit_type: string }> }> {
    return this.http.post<{ data: Array<{ unit_type: string }> }>(
      `${this.baseUrl}/fetch_unit_type`,
      { project_id: projectId, wing_id: wingId, floor_id: floorId }
    ).pipe(
      catchError(() => of({ data: [] }))
    );
  }

  fetchTokenFloorUnits(
    projectId: number | string,
    wingId: number | string,
    floorId: number | string,
    unitType: string
  ): Observable<Array<{ floor_unit_id: number; floor_unit: string }>> {
    return this.http.post<Array<{ floor_unit_id: number; floor_unit: string }>>(
      `${this.baseUrl}/token_floor_unit_dropdown`,
      { project_id: projectId, wing_id: wingId, floor_id: floorId, unit_type: unitType }
    ).pipe(
      catchError(() => of([]))
    );
  }

  fetchSingleFloorUnit(floorUnitId: number | string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/fetch_single_floor_unit`,
      { floor_unit_id: floorUnitId }
    ).pipe(
      catchError(() => of(null))
    );
  } 
  fetchSingleQualtionData(floorUnitId: number | string, projectId?: number | string): Observable<any> {
    const body: { floor_unit_id: number | string; project_id?: number | string } = { floor_unit_id: floorUnitId };
    if (projectId != null && projectId !== '') {
      body.project_id = projectId;
    }
    return this.http.post(
      `${this.baseUrl}/fetch_quatation`,
      body
    ).pipe(
      catchError(() => of(null))
    );
  }

  fetchSingleEnquiry(enquiryId: number | string): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/fetch_single_enquiry`,
      { project_enq_id: enquiryId }
    ).pipe(
      catchError(() => of(null))
    );
  }

  fetchParkingTypes(projectId: number | string): Observable<{ data: Array<{ parking_type_id: number; parking_type: string }> }> {
    return this.http.post<{ data: Array<{ parking_type_id: number; parking_type: string }> }>(
      `${this.baseUrl}/parking_type_dropdown`,
      { project_id: projectId }
    ).pipe(
      catchError(() => of({ data: [] }))
    );
  }

  updateBooking(payload: any): Observable<ApiResponse<BookingInfo>> {
    return this.http.post<ApiResponse<BookingInfo>>(
      `${this.baseUrl}/update_booking`,
      payload
    ).pipe(
      catchError(() => of({ success: false, message: 'Failed to update booking' } as ApiResponse<BookingInfo>))
    );
  } 
  editBooking(payload: any): Observable<ApiResponse<BookingInfo>> {
    return this.http.post<ApiResponse<BookingInfo>>(
      `${this.baseUrl}/edit_booking`,
      payload
    ).pipe(
      catchError(() => of({ success: false, message: 'Failed to update booking' } as ApiResponse<BookingInfo>))
    );
  }

  // Methods for update-customer-info component
  fetchApplicantsByUnit(unitId: number | string): Observable<Applicant[]> {
    return this.http.post<Applicant[]>(
      `${this.baseUrl}/fetch_booking_applicant`,
      { floor_unit_id: unitId }
    ).pipe(
      catchError(() => of([]))
    );
  }

  updateApplicants(payload: Partial<Applicant>[]): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.baseUrl}/update_applicant`,
      payload
    ).pipe(
      catchError(() => of({ success: false, message: 'Failed to update applicants' } as ApiResponse<unknown>))
    );
  }

  deleteApplicant(applicantId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(
      `${this.baseUrl}/delete_booking_applicant`,
      { applicant_id: applicantId }
    ).pipe(
      catchError(() => of({ success: false, message: 'Failed to delete applicant' } as ApiResponse<unknown>))
    );
  }

  fetchBookingUnits(projectId: number | string, wingId: number | string): Observable<Array<{ floor_unit_id: number; floor_unit: string; booking_id: number; applicant_name: string; full_name: string }>> {
    return this.http.post<{ data: Array<{ floor_unit_id: number; floor_unit: string; booking_id: number; applicant_name: string }> }>(
      `${this.baseUrl}/booking_unit_dropdown`,
      { project_id: projectId, wing_id: wingId }
    ).pipe(
      map((res) => (res.data || []).map((item) => ({
        ...item,
        full_name: `${item.floor_unit} - ${item.applicant_name}`
      }))),
      catchError(() => of([]))
    );
  }

  fetchOccupations(): Observable<Array<{ occupation_id: number; occupation: string }>> {
    return this.http.get<Array<{ occupation_id: number; occupation: string }>>(
      `${this.baseUrl}/occupation_dropdown`
    ).pipe(
      shareReplay(1),
      catchError(() => of([]))
    );
  }

  fetchSalutations(): Observable<Array<{ salution_id: number; salution: string }>> {
    return this.http.get<Array<{ salution_id: number; salution: string }>>(
      `${this.baseUrl}/salutation_dropdown`
    ).pipe(
      shareReplay(1),
      catchError(() => of([]))
    );
  }

  // ⚡ Payment-related methods
  fetchBookingPaymentDetails(bookingId: number): Observable<BookingPaymentDetail[]> {
    return this.http.post<BookingPaymentDetail[]>(
      `${this.baseUrl}/fetch_booking_payment_details`,
      { booking_id: bookingId }
    ).pipe(
      catchError(() => of([]))
    );
  }

  addBookingPayment(payload: AddBookingPaymentPayload): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.baseUrl}/add_payment`,
      payload
    ).pipe(
      catchError(() => of({ success: false, message: 'Failed to add payment' } as ApiResponse<{ message: string }>))
    );
  }

  // ⚡ Payment dropdown methods (cached for performance)
  private paymentModesCache$?: Observable<PaymentMode[]>;
  private banksCache$?: Observable<Bank[]>;

  fetchPaymentModes(): Observable<PaymentMode[]> {
    if (!this.paymentModesCache$) {
      this.paymentModesCache$ = this.http.get<PaymentMode[]>(
        `${this.baseUrl}/payment_mode_dropdown`
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError(() => of([]))
      );
    }
    return this.paymentModesCache$;
  }
  addQuatationRequest(payload: any): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/add_quatation`,
      payload
    ).pipe(
      catchError(() => of(null))
    );
  }
  fetchBanks(): Observable<Bank[]> {
    if (!this.banksCache$) {
      this.banksCache$ = this.http.get<Bank[]>(
        `${this.baseUrl}/preferred_bank_dropdown`
      ).pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError(() => of([]))
      );
    }
    return this.banksCache$;
  }

  fetchAgreementPercentage(bookingId: number): Observable<ApiResponse<{ sd_percentage: number }>> {
    return this.http.post<ApiResponse<{ sd_percentage: number }>>(
      `${this.baseUrl}/fetch_agreement_percentage`,
      { booking_id: bookingId }
    ).pipe(
      catchError(() => of({ success: false, message: 'Failed to fetch agreement percentage' } as ApiResponse<{ sd_percentage: number }>))
    );
  }
}

// Payment-related interfaces
export interface BookingPaymentDetail {
  payment_deatil_id: number;
  booking_amount: string | number;
  payment_mode: number;
  transaction_no: string;
  transaction_date: string;
  bank_id: number | null;
  created_by: number;
  bank_details: string | null;
}

export interface AddBookingPaymentPayload {
  booking_amount: string;
  payment_mode: number | null;
  transaction_no: string;
  transaction_date: string | null;
  booking_id: number | undefined;
  bank_id: number | null;
  created_by: number;
  bank_details: string | null;
}

export interface PaymentMode {
  payment_mode_id: number;
  payment_mode: string;
}

export interface Bank {
  preferred_bank_id: number;
  preferred_bank: string;
}
