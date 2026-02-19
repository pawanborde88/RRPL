import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PresaleDashboardResponse {
  success: boolean;
  source: {
    source: string;
    source_id: number | null;
    lead_count: number;
    followup_count: number;
  }[];
  lead_level: {
    lead_level: string;
    lead_level_id: number;
    lead_level_count: number;
  }[];
  summary: {
    total_lead_count: number;
    unassigned_count: number;
    site_visit_count: number;
    token_count: number;
    booking_count: number;
  };
  is_import: { [key: string]: number };
}

export interface DigitalReportResponse {
  success: boolean;
  data: {
    integration_name: string;
    form_id: string;
    duplicate_leads: number;
    lead_count: number;
    site_visit_count: number;
    booking_count: number;
  }[];
}

export interface SalesReportsResponse {
  success: boolean;
  source: {
    source: string;
    source_id: number | null;
    enquiry_count: number;
    followup_count: number;
  }[];
  lead_level: {
    lead_level: string;
    lead_level_id: number | string;
    lead_level_count: number;
  }[];
  total_enquiry_count: number;
  unassigned_count: number;
  token_count: number;
  token_type_count: any[];
  booking_count: number;
}

export interface EnquiryFlowResponse {
  success: boolean;
  data: {
    enquiries: number;
    tokens: number;
    bookings: number;
    booking_agreements: number;
    disbursements: number;
  };
}

export interface AllProjectSummaryResponse {
  project_count: number;
  floor_unit_count: number;
  booking_count: number;
  unit_count: {
    unit_type: string;
    total_unit: number;
    book_unit: number;
    available_unit: number;
  }[];
  booking_statuses: {
    booking_status_id: number;
    booking_status: string;
    color_code: string;
    unit_count: number;
  }[];
}

export interface SalesDashboardResponse {
  success: boolean;
  data: {
    industry?: any[];
    age_range?: any[];
    native_place?: any[];
    possession_required?: any[];
    buying_purpose?: any[];
    booking_plan?: any[];
    preferred_location?: any[];
    [key: string]: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MainDashboardService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  constructor() { }

  /**
   * Fetch user projects dropdown
   * @param userId
   * @returns Observable of projects array
   */
  fetchUserProjectDropdown(userId: number | null = null): Observable<any[]> {
    const payload = {
      user_id: userId,
    };

    return this.http
      .post<any[]>(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching user project dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch presale dashboard data
   * @param payload - Object containing project_id (number or array), start_date, end_date, telecaller_id
   * @returns Observable of presale dashboard data
   */
  fetchPresaleDashboard(payload: {
    project_id: number | number[];
    start_date: string;
    end_date: string;
    telecaller_id?: number[];
    sales_executive_id?: number[];
  }): Observable<PresaleDashboardResponse | null> {
    return this.http
      .post<PresaleDashboardResponse>(`${this.baseUrl}/presale_dashboard`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching presale dashboard:', error);
          return of(null);
        })
      );
  }

  /**
   * Fetch digital report data
   * @param payload - Object containing project_id (number or array)
   * @returns Observable of digital report data
   */
  fetchDigitalReport(payload: {
    project_id: number | number[];
    start_date?: string;
    end_date?: string;
    telecaller_id?: number[];
    sales_executive_id?: number[];
  }): Observable<DigitalReportResponse | null> {
    return this.http
      .post<DigitalReportResponse>(`${this.baseUrl}/digital_report`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching digital report:', error);
          return of(null);
        })
      );
  }

  /**
   * Fetch sales reports data
   * @param payload - Object containing project_id (number or array), start_date, end_date
   * @returns Observable of sales reports data
   */
  fetchSalesReports(payload: {
    project_id: number | number[];
    start_date: string;
    end_date: string;
    telecaller_id?: number[];
    sales_executive_id?: number[];
  }): Observable<SalesReportsResponse | null> {
    return this.http
      .post<SalesReportsResponse>(`${this.baseUrl}/sales_reports`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching sales reports:', error);
          return of(null);
        })
      );
  }

  /**
   * Fetch enquiry flow data
   * @param payload - Object containing project_id array, start_date, end_date
   * @returns Observable of enquiry flow data
   */
  fetchEnquiryFlow(payload: {
    project_id: number[];
    start_date: string;
    end_date: string;
    telecaller_id?: number[];
    sales_executive_id?: number[];
  }): Observable<EnquiryFlowResponse | null> {
    return this.http
      .post<EnquiryFlowResponse>(`${this.baseUrl}/enquiry_flow`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching enquiry flow:', error);
          return of(null);
        })
      );
  }

  /**
   * Fetch all project summary data
   * @param projectId - Optional project ID or array of project IDs
   * @returns Observable of all project summary data
   */
  fetchAllProjectSummary(payload: {
    project_id?: number | number[];
    start_date?: string;
    end_date?: string;
    telecaller_id?: number[];
    sales_executive_id?: number[];
  }): Observable<AllProjectSummaryResponse | null> {

    return this.http
      .post<AllProjectSummaryResponse>(
        `${this.baseUrl}/all_project_summary`,
        payload   // 👈 send payload directly
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching all project summary:', error);
          return of(null);
        })
      );
  }

  /**
   * Fetch telecaller dropdown for projects
   * @param projectIds - Array of project IDs
   * @returns Observable of telecallers array
   */
  fetchTelecallerDropdown(projectIds: number[]): Observable<Array<{ user_id: number; first_name: string; last_name: string; full_name?: string }>> {
    const payload = {
      project_id: projectIds,
    };

    return this.http
      .post<Array<{ user_id: number; first_name: string; last_name: string }>>(
        `${this.baseUrl}/telecaller_dropdown`,
        payload
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching telecaller dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch sales executives dropdown for projects
   * @param projectId - Project ID (number, number array, or string)
   * @returns Observable of sales executives array
   */
  fetchSalesExecutives(projectId: number | number[] | string): Observable<Array<{ user_id: number; user_name: string }>> {
    // Ensure project_id is always passed as array for project_sales_executive_dropdown API
    const projectIdArray = Array.isArray(projectId)
      ? projectId
      : [projectId];

    const payload = {
      project_id: projectIdArray,
    };

    return this.http
      .post<Array<{ user_id: number; user_name: string }>>(
        `${this.baseUrl}/project_sales_executive_dropdown`,
        payload
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching sales executives dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch site visit report data
   * @param payload - Filter payload
   * @returns Observable of site visit report data
   */
  fetchSiteVisitReport(payload: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/site_visit_report`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching site visit report:', error);
          return of({ success: false, data: [] });
        })
      );
  }

  /**
   * Fetch project enquiries list
   * @param payload - Filter payload
   * @returns Observable of project enquiries
   */
  fetchProjectEnquiries(payload: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/fetch_project_enquiries`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching project enquiries:', error);
          return of({ success: false, data: [] });
        })
      );
  }

  /**
   * Fetch sales dashboard data
   * @param payload - Object containing project_id, start_date, end_date
   * @returns Observable of sales dashboard data
   */
  fetchSalesDashboard(payload: {
    project_id: number | number[];
    start_date: string;
    end_date: string;
  }): Observable<SalesDashboardResponse | null> {
    return this.http
      .post<SalesDashboardResponse>(`${this.baseUrl}/sales_dashboard`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching sales dashboard:', error);
          return of(null);
        })
      );
  }
}
