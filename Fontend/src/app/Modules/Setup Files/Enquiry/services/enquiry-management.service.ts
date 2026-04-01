import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import {
  catchError,
  retry,
  debounceTime,
  map,
  shareReplay,
  tap,
} from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

/**
 * Source Dropdown Response Interface
 */
export interface SourceDropdownResponse {
  source_id: string | number;
  source: string;
}

/**
 * Source Detail Dropdown Response Interface
 */
export interface SourceDetailDropdownResponse {
  source_detail_id: string | number;
  firm_name: string;
  cp_owner?: string;
  full_name?: string;
}

/**
 * Sales Executive Dropdown Response Interface
 */
export interface SalesExecutiveDropdownResponse {
  user_id: number;
  user_name: string;
  email?: string;
}

/**
 * Channel Partner Dropdown Response Interface
 */
export interface ChannelPartnerDropdownResponse {
  channel_partner_id: string | number;
  firm_name: string;
  cp_owner?: string;
  full_name?: string;
}

/**
 * Project Dropdown Response Interface
 */
export interface ProjectDropdownResponse {
  project_id: string | number;
  property_name: string;
  project_logo?: string | null;
}

/**
 * Web Config Dropdown Response Interface
 */
export interface WebConfigDropdownResponse {
  project_configuration_id: number;
  configuration: string;
  bhk?: string;
  carpet_area?: number;
  price_starts?: number;
  price_ends?: number;
}

/**
 * Project Info Response Interface
 */
export interface ProjectInfoResponse {
  project_id: number;
  min_cost: number;
  max_cost: number;
  city_id: number;
  enq_otp_status?: number;
  [key: string]: any;
}

/**
 * Project QR Details Response Interface
 */
export interface ProjectQRDetailsResponse {
  project_id: string | number;
  property_name: string;
  project_logo?: string | null;
  project_slug: string;
  slug_log?: {
    created_by_name?: string;
    updated_at?: string | Date;
  };
}

/**
 * Dropdown Item Interface
 */
export interface DropdownItem {
  id: number;
  name: string;
  [key: string]: any;
}

/**
 * Payload Interfaces
 */
export interface ProjectIdPayload {
  project_id: string | number | any[];
}

export interface SourceIdPayload {
  source_id: string | number;
}

export interface ChannelPartnerSearchPayload {
  firm_name?: string;
  channel_partner_id?: number | null;
}

export interface CallToEnquiryPayload {
  user_id: number;
  project_enq_id: number;
}

export interface DeleteProjectEnquiryPayload {
  project_enq_id: number;
  reason: string;
  created_by: number;
}

export interface ClaimProjectEnquiryPayload {
  project_enq_id: number;
  sales_executive_id: number;
}

export interface UserProjectDropdownPayload {
  user_id: number | null;
}

export interface ProjectSlugPayload {
  project_slug: string;
}

export interface QRProjectDetailsPayload {
  project_id: string | number;
}

export interface ChangeProjectSlugPayload {
  project_id: string | number;
  created_by: number | null;
}

export interface CityIdPayload {
  city_id: number;
}

export interface LeadLevelIdPayload {
  lead_level_id: number;
}

export interface FetchCPExecutivesPayload {
  channel_partner_id: number[];
  active_status_id: number;
  approve_status_id: number;
  is_dummy: number;
}

export interface FetchSingleLeadPayload {
  project_id: number;
  mobile_no: string;
}

export interface AddProjectEnquiryPayload extends FormData {
  // FormData doesn't have a specific structure
}

/**
 * Enquiry Management Service
 * Centralized service for all enquiry, project, and QR-related API calls
 * Used by AllEnquirysComponent, QRProjectForomComponent, and ExecutiveProjectQRComponent
 */
@Injectable({
  providedIn: 'root',
})
export class EnquiryManagementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;
  private readonly RETRY_ATTEMPTS = 2;

  // Cache for projects list with TTL
  private projectsCache$?: Observable<ProjectDropdownResponse[]>;
  private cacheTimestamp?: number;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ==================== PROJECT METHODS ====================

  /**
   * Fetch user projects with caching
   * Shared method used by multiple components
   */
  fetchUserProjects(
    userId: number | null,
    roleId?: number
  ): Observable<ProjectDropdownResponse[]> {
    const payload: UserProjectDropdownPayload = {
      user_id: roleId === 2 ? null : userId,
    };

    // Return cached observable if still valid
    const now = Date.now();
    if (
      this.projectsCache$ &&
      this.cacheTimestamp &&
      now - this.cacheTimestamp < this.CACHE_TTL
    ) {
      return this.projectsCache$;
    }

    // Create new cached observable
    this.projectsCache$ = this.http
      .post<ProjectDropdownResponse[]>(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        shareReplay({ bufferSize: 1, refCount: true }),
        catchError(this.handleError<ProjectDropdownResponse[]>('fetchUserProjects', []))
      );

    this.cacheTimestamp = Date.now();
    return this.projectsCache$;
  }

  /**
   * Fetch user projects (simplified version for direct userId)
   */
  fetchProjects(userId: number | null): Observable<ProjectDropdownResponse[]> {
    return this.fetchUserProjects(userId);
  }

  /**
   * Fetch project info by slug
   */
  fetchProjectInfo(slug: string): Observable<{ data: ProjectInfoResponse }> {
    const payload: ProjectSlugPayload = { project_slug: slug };
    return this.http
      .post<{ data: ProjectInfoResponse }>(`${this.baseUrl}/fetch_project_info`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<{ data: ProjectInfoResponse }>('fetchProjectInfo'))
      );
  }

  /**
   * Fetch project QR details
   */
  fetchProjectQRDetails(
    projectId: string | number
  ): Observable<ProjectQRDetailsResponse> {
    const payload: QRProjectDetailsPayload = { project_id: projectId };
    return this.http
      .post<ProjectQRDetailsResponse>(
        `${this.baseUrl}/qr_project_details`,
        payload
      )
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<ProjectQRDetailsResponse>('fetchProjectQRDetails'))
      );
  }

  /**
   * Change/regenerate project slug
   */
  changeProjectSlug(
    projectId: string | number,
    userId: number | null
  ): Observable<unknown> {
    const payload: ChangeProjectSlugPayload = {
      project_id: projectId,
      created_by: userId,
    };
    return this.http.post(`${this.baseUrl}/change_project_slug`, payload).pipe(
      retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
      tap(() => {
        // Invalidate cache after successful slug change
        this.invalidateProjectsCache();
      }),
      catchError(this.handleError<unknown>('changeProjectSlug'))
    );
  }

  /**
   * Invalidate projects cache
   */
  invalidateProjectsCache(): void {
    this.projectsCache$ = undefined;
    this.cacheTimestamp = undefined;
  }

  // ==================== DROPDOWN METHODS ====================

  /**
   * Fetch all sources
   */
  fetchSources(): Observable<SourceDropdownResponse[]> {
    return this.http
      .get<SourceDropdownResponse[]>(`${this.baseUrl}/source_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<SourceDropdownResponse[]>('fetchSources', []))
      );
  }

  /**
   * Fetch source details by source ID
   */
  fetchSourceDetails(sourceId: string | number): Observable<SourceDetailDropdownResponse[]> {
    const payload: SourceIdPayload = { source_id: sourceId };

    return this.http
      .post<SourceDetailDropdownResponse[]>(`${this.baseUrl}/source_detail_dropdown`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) =>
          (response || []).map((item) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner || ''})`,
          }))
        ),
        catchError(this.handleError<SourceDetailDropdownResponse[]>('fetchSourceDetails', []))
      );
  }

  /**
   * Fetch sales executives by project ID(s)
   */
  fetchSalesExecutives(projectId: string | number | any[]): Observable<SalesExecutiveDropdownResponse[]> {
    const payload: ProjectIdPayload = { project_id: projectId };

    return this.http
      .post<SalesExecutiveDropdownResponse[]>(
        `${this.baseUrl}/project_sales_executive_dropdown`,
        payload
      )
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<SalesExecutiveDropdownResponse[]>('fetchSalesExecutives', []))
      );
  }

  /**
   * Fetch web config (preferences) by project ID(s)
   */
  fetchWebConfig(projectId: string | number | any[]): Observable<WebConfigDropdownResponse[]> {
    const payload: ProjectIdPayload = { project_id: projectId };

    return this.http
      .post<WebConfigDropdownResponse[]>(`${this.baseUrl}/web_config_dropdown`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<WebConfigDropdownResponse[]>('fetchWebConfig', []))
      );
  }

  /**
   * Search channel partners by firm name (with optional initial load)
   */
  searchChannelPartners(
    searchText: string,
    loadInitialData?: boolean,
    channelPartnerId?: number
  ): Observable<ChannelPartnerDropdownResponse[]> {
    const trimmedSearch = searchText.trim();

    if (!loadInitialData && trimmedSearch.length <= 3) {
      return of([]);
    }

    const payload: ChannelPartnerSearchPayload = loadInitialData
      ? { channel_partner_id: channelPartnerId || null }
      : { firm_name: trimmedSearch, channel_partner_id: null };

    return this.http
      .post<ChannelPartnerDropdownResponse[]>(
        `${this.baseUrl}/channel_partner_dropdown`,
        payload
      )
      .pipe(
        debounceTime(300),
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) =>
          (response || []).map((item) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner || ''})`,
          }))
        ),
        catchError(this.handleError<ChannelPartnerDropdownResponse[]>('searchChannelPartners', []))
      );
  }

  /**
   * Fetch preferred locations
   */
  fetchPreferredLocations(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/preferred_location_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchPreferredLocations', []))
      );
  }

  /**
   * Fetch sub regions by city ID
   */
  fetchSubRegions(cityId: number): Observable<any[]> {
    const payload: CityIdPayload = { city_id: cityId };
    return this.http
      .post<any[]>(`${this.baseUrl}/sub_region_dropdown`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchSubRegions', []))
      );
  }

  /**
   * Fetch age range dropdown
   */
  fetchAgeRange(): Observable<DropdownItem[]> {
    return this.http
      .get<DropdownItem[]>(`${this.baseUrl}/age_range_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<DropdownItem[]>('fetchAgeRange', []))
      );
  }

  /**
   * Fetch CP executives
   */
  fetchCPExecutives(payload: FetchCPExecutivesPayload): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.baseUrl}/fetch_cp_executives`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchCPExecutives', []))
      );
  }

  /**
   * Fetch salutation dropdown
   */
  fetchSalutations(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/salutation_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchSalutations', []))
      );
  }

  /**
   * Fetch native place dropdown
   */
  fetchNativePlaces(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/native_place_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchNativePlaces', []))
      );
  }

  /**
   * Fetch industry dropdown
   */
  fetchIndustries(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/industry_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchIndustries', []))
      );
  }

  /**
   * Fetch possession requirement dropdown
   */
  fetchPossessionRequirements(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/possession_req_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchPossessionRequirements', []))
      );
  }

  /**
   * Fetch buying purpose dropdown
   */
  fetchBuyingPurposes(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/buying_purpose_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchBuyingPurposes', []))
      );
  }

  /**
   * Fetch preferred bank dropdown
   */
  fetchPreferredBanks(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/preferred_bank_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchPreferredBanks', []))
      );
  }

  /**
   * Fetch booking plan dropdown
   */
  fetchBookingPlans(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/booking_plan_dropdown`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchBookingPlans', []))
      );
  }

  /**
   * Fetch lead level dropdown
   */
  fetchLeadLevels(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/fetch_lead_level`)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchLeadLevels', []))
      );
  }

  /**
   * Fetch call status by lead level ID
   */
  fetchCallStatus(leadLevelId: number): Observable<any[]> {
    const payload: LeadLevelIdPayload = { lead_level_id: leadLevelId };
    return this.http
      .post<any[]>(`${this.baseUrl}/call_status_dropdown`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map((response) => response || []),
        catchError(this.handleError<any[]>('fetchCallStatus', []))
      );
  }

  // ==================== ENQUIRY ACTION METHODS ====================

  /**
   * Call to enquiry (map call to IVR)
   */
  callToEnquiry(payload: CallToEnquiryPayload): Observable<unknown> {
    return this.http
      .post<unknown>(`${this.baseUrl}/call_to_enquiry`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<unknown>('callToEnquiry'))
      );
  }

  /**
   * Delete project enquiry
   */
  deleteProjectEnquiry(payload: DeleteProjectEnquiryPayload): Observable<unknown> {
    return this.http
      .post<unknown>(`${this.baseUrl}/delete_project_enq`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<unknown>('deleteProjectEnquiry'))
      );
  }

  /**
   * Claim project enquiry
   */
  claimProjectEnquiry(payload: ClaimProjectEnquiryPayload): Observable<unknown> {
    return this.http
      .post<unknown>(`${this.baseUrl}/claim_project_enquiry`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<unknown>('claimProjectEnquiry'))
      );
  }

  /**
   * Add project enquiry
   */
  addProjectEnquiry(formData: FormData): Observable<{ success: boolean; status?: boolean; message?: string; code?: number }> {
    return this.http
      .post<{ success: boolean; status?: boolean; message?: string; code?: number }>(
        `${this.baseUrl}/add_project_enquiry`,
        formData
      )
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<{ success: boolean; status?: boolean; message?: string; code?: number }>('addProjectEnquiry'))
      );
  }

  /**
   * Edit project enquiry
   */
  editProjectEnquiry(formData: FormData): Observable<{ success: boolean; status?: boolean; message?: string; code?: number }> {
    return this.http
      .post<{ success: boolean; status?: boolean; message?: string; code?: number }>(
        `${this.baseUrl}/edit_project_enquiry`,
        formData
      )
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<{ success: boolean; status?: boolean; message?: string; code?: number }>('editProjectEnquiry'))
      );
  }

  /**
   * Fetch single project enquiry by ID
   */
  fetchSingleProjectEnquiry(projectEnqId: number | string): Observable<any> {
    const payload = { project_enq_id: projectEnqId };
    return this.http
      .post<any>(`${this.baseUrl}/fetch_single_enquiry`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        map(response => response?.data || response),
        catchError(this.handleError<any>('fetchSingleProjectEnquiry'))
      );
  }

  /**
   * Fetch single lead by project ID and mobile number
   */
  fetchSingleLead(payload: FetchSingleLeadPayload): Observable<{ data: any }> {
    return this.http
      .post<{ data: any }>(`${this.baseUrl}/fetch_single_lead`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<{ data: any }>('fetchSingleLead'))
      );
  }

  /**
   * Send OTP to enquiry
   */
  sendOtpToEnquiry(payload: {
    mobile_no: string;
    email_id: string;
    project_id: number;
    first_name: string;
    last_name: string;
  }): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/send_otp_to_enquiry`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<any>('sendOtpToEnquiry'))
      );
  }

  /**
   * Verify enquiry OTP
   */
  verifyEnqOtp(payload: {
    mobile_no: string;
    project_id: number;
    otp: string;
  }): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/verify_enq_otp`, payload)
      .pipe(
        retry({ count: this.RETRY_ATTEMPTS, delay: 1000 }),
        catchError(this.handleError<any>('verifyEnqOtp'))
      );
  }

  /**
   * Centralized error handling
   */
  private handleError<T>(operation: string, result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Return safe default value or throw
      if (result !== undefined) {
        return of(result as T);
      }

      return throwError(
        () => new Error(`${operation} failed: ${error.message || 'Unknown error'}`)
      );
    };
  }
}

