import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Strategies grouped by department (`fetch_all_strategy`). */
export interface StrategyDepartmentGroup {
  department_name: string;
  strategies: Array<{ strategy_id: number; strategy_name: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  constructor() { }

  /**
   * Fetch last month targets for a project
   * @param projectId - Project ID
   * @returns Observable of last month targets
   */
  fetchLastMonthTargets(projectId: number, userId: number | null = null, targetFrom: string | null = null, targetTo: string | null = null): Observable<any> {
    const payload: any = {
      project_id: projectId,
    };

    if (userId) {
      payload.user_id = userId;
    }

    if (targetFrom) {
      payload.target_from = targetFrom;
    }

    if (targetTo) {
      payload.target_to = targetTo;
    }

    return this.http
      .post<any>(`${this.baseUrl}/last_month_targets`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching last month targets:', error);
          return of(null);
        })
      );
  }

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
   * Fetch wings dropdown for a project
   * @param projectId - Project ID or array of Project IDs
   * @returns Observable of wings array
   */
  fetchWingDropdown(projectId: number | number[]): Observable<Array<{ wing_id: number; wing_name: string }>> {
    const projectIds = Array.isArray(projectId) ? projectId : [projectId];
    const payload = {
      project_id: projectIds.length === 1 ? projectIds[0] : projectIds,
    };

    return this.http
      .post<Array<{ wing_id: number; wing_name: string }>>(
        `${this.baseUrl}/wing_dropdown`,
        payload
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching wing dropdown:', error);
          return of([]);
        })
      );
  }


  /**
   * Fetch floors dropdown for a project and wing
   * @param projectId - Project ID or array of Project IDs
   * @param wingId - Wing ID
   * @returns Observable of floors array
   */
  fetchFloorDropdown(projectId: number | number[], wingId: number): Observable<Array<{ floor_id: number; floor_name: string }>> {
    const projectIds = Array.isArray(projectId) ? projectId : [projectId];
    const payload = {
      project_id: projectIds.length === 1 ? projectIds[0] : projectIds,
      wing_id: wingId,
    };

    return this.http
      .post<Array<{ floor_id: number; floor_name: string }>>(
        `${this.baseUrl}/fetch_floor_dropdown`,
        payload
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching floor dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch web configuration dropdown (preference dropdown)
   * @param projectId - Array of project IDs
   * @returns Observable of preference dropdown array
   */
  fetchWebConfigDropdown(projectId: number[]): Observable<any[]> {
    const payload = {
      project_id: projectId,
    };

    return this.http
      .post<any[]>(`${this.baseUrl}/web_config_dropdown`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching web config dropdown:', error);
          return of([]);
        })
      );
  }
  /**
   * Fetch sales executives dropdown for a project
   * @param projectId - Project ID (string, number, or array)
   * @returns Observable of sales executives array
   */
  fetchSalesExecutives(projectId: string | number | any[]): Observable<Array<{ user_id: number; user_name: string }>> {
    const payload = {
      project_id: projectId,
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
   * Fetch channel partner dropdown
   * @param firmName - Firm name search text
   * @returns Observable of channel partners array
   */
  fetchChannelPartnerDropdown(firmName: string): Observable<Array<{ channel_partner_id: number; firm_name: string; cp_owner?: string }>> {
    const payload = {
      firm_name: firmName,
    };

    return this.http
      .post<Array<{ channel_partner_id: number; firm_name: string; cp_owner?: string }>>(
        `${this.baseUrl}/channel_partner_dropdown`,
        payload
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching channel partner dropdown:', error);
          return of([]);
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
   * Fetch lead levels
   * @returns Observable of lead levels array
   */
  fetchLeadLevels(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/fetch_lead_level`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching lead levels:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch enquiry status dropdown
   * @returns Observable of enquiry statuses array
   */
  fetchEnquiryStatusDropdown(): Observable<Array<{ enquiry_status_id: number; enquiry_status: string }>> {
    return this.http
      .get<Array<{ enquiry_status_id: number; enquiry_status: string }>>(
        `${this.baseUrl}/enq_status_dropdown`
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching enquiry status dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch sources dropdown
   * @returns Observable of sources array
   */
  fetchSources(): Observable<Array<{ source_id: number; source: string }>> {
    return this.http
      .get<Array<{ source_id: number; source: string }>>(
        `${this.baseUrl}/source_dropdown`
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching sources dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch source details dropdown
   * @param sourceId - Source ID
   * @returns Observable of source details array
   */
  fetchSourceDetails(sourceId: number | string): Observable<Array<{ source_detail_id: number; source_detail: string }>> {
    const payload = {
      source_id: sourceId,
    };

    return this.http
      .post<Array<{ source_detail_id: number; source_detail: string }>>(
        `${this.baseUrl}/source_detail_dropdown`,
        payload
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching source details dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch booking status dropdown
   * @returns Observable of booking statuses array
   */
  fetchBookingStatus(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/fetch_booking_status`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching booking status:', error);
          return of({ data: [] });
        })
      );
  }
  fetchParkingStatus(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/fetch_parking_status`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching booking status:', error);
          return of({ data: [] });
        })
      );
  }

  /**
   * Delete floor units
   * @param floorUnitIds - Array of floor unit IDs to delete
   * @returns Observable of delete response
   */
  deleteFloorUnit(floorUnitIds: number[]): Observable<any> {
    const payload = {
      floor_unit_id: floorUnitIds,
    };

    return this.http
      .post<any>(`${this.baseUrl}/delete_floor_unit`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error deleting floor units:', error);
          throw error;
        })
      );
  }

  /**
   * Delete lead
   * @param payload - Object containing project_lead_id, reason, and created_by
   * @returns Observable of delete response
   */
  deleteLead(payload: {
    project_lead_id: number;
    reason: string;
    created_by: number;
  }): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/delete_lead`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error deleting lead:', error);
          throw error;
        })
      );
  }

  /**
   * Fetch roles dropdown
   * @returns Observable of roles array
   */
  fetchRolesDropdown(): Observable<Array<{ role_id: number; role: string }>> {
    return this.http
      .get<Array<{ role_id: number; role: string }>>(
        `${this.baseUrl}/roles_dropdown`
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching roles dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch users based on role and/or project
   * @param payload - Object containing role_id, project_id, or user_id
   * @returns Observable of users array
   */
  fetchUsers(payload: { role_id?: number | number[]; project_id?: number; user_id?: number | number[] }): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.baseUrl}/fetch_users`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching users:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch all projects dropdown
   * @returns Observable of projects array
   */
  fetchProjectsDropdown(): Observable<Array<{ project_id: number; property_name: string }>> {
    return this.http
      .get<Array<{ project_id: number; property_name: string }>>(`${this.baseUrl}/project_dropdown`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching projects dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Add Facebook setup
   * @param payload - Facebook setup data
   * @returns Observable of API response
   */
  addFacebookSetup(payload: {
    project_id: number;
    form_id: string;
    integration_name?: string;
    created_by: number;
    updated_by: number;
  }): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(`${this.baseUrl}/add_facebook_setup`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error adding Facebook setup:', error);
          throw error;
        })
      );
  }

  /**
   * Edit Facebook setup
   * @param payload - Facebook setup data including facebook_setup_id
   * @returns Observable of API response
   */
  editFacebookSetup(payload: {
    facebook_setup_id: number;
    project_id: number;
    form_id: string;
    integration_name?: string;
    updated_by: number;
  }): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(`${this.baseUrl}/edit_facebook_setup`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error editing Facebook setup:', error);
          throw error;
        })
      );
  }

  /**
   * Fetch sourcing managers dropdown
   * @param roleIds - Array of role IDs (default: [18])
   * @returns Observable of sourcing managers array
   */
  fetchSourcingManagerDropdown(roleIds: number[] = [18]): Observable<any[]> {
    const payload = {
      role_id: roleIds,
    };

    return this.http
      .post<any[]>(`${this.baseUrl}/sourcing_manger_dropdown`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching sourcing managers dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch directors dropdown
   * @param roleIds - Array of role IDs (default: [8])
   * @returns Observable of directors array
   */
  fetchDirectorDropdown(roleIds: number[] = [8]): Observable<any[]> {
    const payload = {
      role_id: roleIds,
    };

    return this.http
      .post<any[]>(`${this.baseUrl}/director_dropdown`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching directors dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch cluster heads dropdown
   * @param roleIds - Array of role IDs (default: [20])
   * @returns Observable of cluster heads array
   */
  fetchClusterHeadDropdown(roleIds: number[] = [20]): Observable<any[]> {
    const payload = {
      role_id: roleIds,
    };

    return this.http
      .post<any[]>(`${this.baseUrl}/cluster_head_dropdown`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching cluster heads dropdown:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch inventory chart data
   * @param projectId - Project ID
   * @param wingId - Wing ID (optional)
   * @returns Observable of inventory data
   */
  fetchInventoryChart(projectId: number, wingId: number | null): Observable<{ data: any[] }> {
    const payload = {
      project_id: projectId,
      wing_id: wingId,
    };

    return this.http
      .post<{ data: any[] }>(`${this.baseUrl}/fetch_inventory_chart`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching inventory chart:', error);
          return of({ data: [] });
        })
      );
  }

  fetchParkingInventoryChart(projectId: number, wingId: number | null): Observable<{ data: any[] }> {
    const payload = {
      project_id: projectId,
      wing_id: wingId,
    };

    return this.http
      .post<{ data: any[] }>(`${this.baseUrl}/fetch_parking_chart`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching inventory chart:', error);
          return of({ data: [] });
        })
      );
  }

  fetch_parkings(payload: { parking_plan_id: number[] }): Observable<{ data: any[] }> {
    return this.http
      .post<{ data: any[] }>(`${this.baseUrl}/fetch_parkings`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching parking details:', error);
          return of({ data: [] });
        })
      );
  }

  /**
   * Fetch bookings based on filter payload
   * @param payload - Booking filter payload
   * @returns Observable of bookings array
   */
  fetchBookings(payload: Record<string, any>): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.baseUrl}/fetch_booking`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching bookings:', error);
          return of([]);
        })
      );
  }

  /**
   * Cancel a booking
   * @param bookingId - Booking ID
   * @param updatedBy - User ID who is updating
   * @param cancelRemark - Cancellation remark
   * @returns Observable of API response
   */
  cancelBooking(bookingId: number, updatedBy: number, cancelRemark: string): Observable<{ success: boolean; message?: string }> {
    return this.http
      .post<{ success: boolean; message?: string }>(`${this.baseUrl}/cancel_booking`, {
        booking_id: bookingId,
        updated_by: updatedBy,
        cancel_remark: cancelRemark
      })
      .pipe(
        catchError((error) => {
          console.error('Error cancelling booking:', error);
          return of({ success: false, message: 'Failed to cancel booking' });
        })
      );
  }

  /**
   * Delete a booking
   * @param bookingId - Booking ID
   * @returns Observable of API response
   */
  deleteBooking(bookingId: number): Observable<{ success: boolean; message?: string }> {
    return this.http
      .post<{ success: boolean; message?: string }>(`${this.baseUrl}/delete_booking`, {
        booking_id: bookingId
      })
      .pipe(
        catchError((error) => {
          console.error('Error deleting booking:', error);
          return of({ success: false, message: 'Failed to delete booking' });
        })
      );
  }

  /**
   * Fetch enquiry summary report
   * @param payload - Filter payload containing project_id, sales_executive_id, lead_level_id, call_status_id, from_date, to_date
   * @returns Observable of API response with enquiry summary data
   */
  fetchEnquirySummaryReport(payload: {
    project_id?: number[] | null;
    sales_executive_id?: number[] | null;
    lead_level_id?: number | null;
    call_status_id?: number | null;
    from_date?: string | null;
    to_date?: string | null;
  }): Observable<{ success: boolean; data?: any[]; message?: string }> {
    return this.http
      .post<{ success: boolean; data?: any[]; message?: string }>(`${this.baseUrl}/fetch_summery_report`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching enquiry summary report:', error);
          return of({ success: false, message: 'Failed to fetch enquiry summary report' });
        })
      );
  }

  /**
   * Fetch project enquiry logs (transfer report)
   * @param payload - Filter payload containing project_id, transfer_to, transfer_from
   * @returns Observable of API response with enquiry log data
   */
  fetchProjectEnquiryLogs(payload: {
    project_id?: number[] | null;
    transfer_to?: number[] | null;
    transfer_from?: number[] | null;
  }): Observable<{ success?: boolean; data?: any[]; message?: string }> {
    return this.http
      .post<{ success?: boolean; data?: any[]; message?: string }>(`${this.baseUrl}/fetch_project_enquiry_logs`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching project enquiry logs:', error);
          return of({ success: false, message: 'Failed to fetch project enquiry logs' });
        })
      );
  }

  /**
   * Fetch project banks for a specific project and wing
   * @param projectId - Project ID
   * @param wingId - Wing ID
   * @returns Observable of API response with project bank data
   */
  fetchProjectBanks(projectId: number | null, wingId: number | null): Observable<{ success: boolean; data?: any[]; message?: string }> {
    return this.http
      .post<{ success: boolean; data?: any[]; message?: string }>(`${this.baseUrl}/fetch_project_banks`, {
        project_id: projectId,
        wing_id: wingId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching project banks:', error);
          return of({ success: false, message: 'Failed to fetch project banks' });
        })
      );
  }

  /**
   * Delete project bank
   * @param projectBankId - Project Bank ID
   * @returns Observable of API response
   */
  deleteProjectBank(projectBankId: number): Observable<{ success: boolean; message?: string }> {
    return this.http
      .post<{ success: boolean; message?: string }>(`${this.baseUrl}/delete_project_bank`, {
        project_bank_id: projectBankId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error deleting project bank:', error);
          return of({ success: false, message: 'Failed to delete project bank' });
        })
      );
  }

  /**
   * Fetch letter config for a project
   * @param projectId - Project ID
   * @returns Observable of API response with letter config data
   */
  fetchLetterConfig(projectId: number): Observable<{ success?: boolean; data?: any[]; message?: string }> {
    return this.http
      .post<{ success?: boolean; data?: any[]; message?: string }>(`${this.baseUrl}/fetch_letter_config`, {
        project_id: projectId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching letter config:', error);
          return of({ success: false, message: 'Failed to fetch letter config' });
        })
      );
  }

  /**
   * Delete letter config
   * @param letterConfigId - Letter Config ID
   * @returns Observable of API response
   */
  deleteLetterConfig(letterConfigId: number): Observable<{ success: boolean; message?: string }> {
    return this.http
      .post<{ success: boolean; message?: string }>(`${this.baseUrl}/delete_letter_config`, {
        letter_config_id: letterConfigId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error deleting letter config:', error);
          return of({ success: false, message: 'Failed to delete letter config' });
        })
      );
  }

  /**
   * Fetch unit banker data
   * @param projectId - Project ID
   * @param wingId - Wing ID
   * @returns Observable of unit banker data array
   */
  fetchUnitBanker(projectId: number | null, wingId: number | null): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.baseUrl}/fetch_unit_banker`, {
        project_id: projectId,
        wing_id: wingId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching unit banker:', error);
          return of([]);
        })
      );
  }

  /**
   * Delete unit banker
   * @param payload - Object containing unit_banker_id, reason, and created_by
   * @returns Observable of API response
   */
  deleteUnitBanker(payload: {
    unit_banker_id: number;
    reason: string;
    created_by: number;
  }): Observable<{ success: boolean; message?: string }> {
    return this.http
      .post<{ success: boolean; message?: string }>(`${this.baseUrl}/delete_unit_banker`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error deleting unit banker:', error);
          return of({ success: false, message: 'Failed to delete unit banker' });
        })
      );
  }

  /**
   * Upload file with FormData
   * @param endpoint - API endpoint (without base URL)
   * @param formData - FormData containing file and other fields
   * @returns Observable of API response
   */
  uploadFile(endpoint: string, formData: FormData): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/${endpoint}`, formData)
      .pipe(
        catchError((error) => {
          console.error('Error uploading file:', error);
          throw error;
        })
      );
  }

  /**
   * Fetch all projects details
   * @param userId - User ID
   * @returns Observable of projects array
   */
  fetchProjects(userId: number): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.baseUrl}/fetch_projects`, { user_id: userId })
      .pipe(
        catchError((error) => {
          console.error('Error fetching projects:', error);
          return of([]);
        })
      );
  }

  /**
   * Delete project
   * @param payload - Object containing project_id, reason, and created_by
   * @returns Observable of delete response
   */
  deleteProject(payload: { project_id: number; reason: string; created_by: number }): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/delete_project_details`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error deleting project:', error);
          throw error;
        })
      );
  }

  /**
   * Fetch cities dropdown
   * @returns Observable of cities array
   */
  fetchCities(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/city_dropdown`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching cities:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch project status dropdown
   * @returns Observable of project status array
   */
  fetchProjectStatus(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/project_status_dropdown`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching project status:', error);
          return of([]);
        })
      );
  }

  /**
   * Fetch subregions dropdown
   * @param cityId - City ID
   * @returns Observable of subregions array
   */
  fetchSubregions(cityId: number): Observable<any[]> {
    return this.http
      .post<any[]>(`${this.baseUrl}/sub_region_dropdown`, { city_id: cityId })
      .pipe(
        catchError((error) => {
          console.error('Error fetching subregions:', error);
          return of([]);
        })
      );
  }
  fetchConfigurations(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.baseUrl}/fetch_configurations`)
      .pipe(
        catchError((error) => {
          console.error('Error fetching configurations:', error);
          return of([]);
        })
      );
  }
  /**
   * Add project details
   * @param formData - FormData containing project details
   * @returns Observable of API response
   */
  addProjectDetails(formData: FormData): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/add_project_details`, formData)
      .pipe(
        catchError((error) => {
          console.error('Error adding project:', error);
          throw error;
        })
      );
  }
  /**
   * Allot parking to a unit
   * @param payload - Allotment details (parking_ids, floor_unit_id, etc.)
   */
  allotParking(payload: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/allot_parking_to_unit`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error allotting parking:', error);
          throw error;
        })
      );
  }
  /**
   * Add a full goal (Goal setting form submission)
   * @param payload - The goal data payload
   * @returns Observable of API response
   */
  addFullGoal(payload: any): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/add_full_goal`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error adding full goal:', error);
          throw error;
        })
      );
  }

  /**
   * Compute contribution % from project and annual goal (units).
   */
  checkContributionPercentage(payload: {
    project_id: number;
    my_goal: number;
  }): Observable<{ status: boolean; percentage?: number | string }> {
    return this.http
      .post<{ status: boolean; percentage?: number | string }>(
        `${this.baseUrl}/check_contribution_percentage`,
        payload
      )
      .pipe(
        catchError((error) => {
          console.error('Error checking contribution percentage:', error);
          return of({ status: false as boolean });
        })
      );
  }

  /**
   * Fetch goal dashboard summary
   * @param userId - User ID
   * @param roleId - Role ID
   * @param projectId - Project ID
   * @returns Observable of goal dashboard data
   */
  fetchGoalDashboard(userId: number | null, roleId: number | null = null, projectId: number | null = null): Observable<any> {
    const payload: any = { user_id: userId };
    if (roleId) payload.role_id = roleId;
    if (projectId) payload.project_id = projectId;
    
    return this.http
      .post<any>(`${this.baseUrl}/goal_dashboard`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching goal dashboard:', error);
          return of(null);
        })
      );
  }

  /**
   * Fetch what I need (goal details)
   * @param userId - User ID
   * @param roleId - Role ID
   * @param projectId - Project ID
   * @returns Observable of data
   */
  fetchWhatINeed(userId: number | null = null, roleId: number | null = null, projectId: number | null = null): Observable<any> {
    const payload: any = { user_id: userId };
    if (roleId) payload.role_id = roleId;
    if (projectId) payload.project_id = projectId;

    return this.http
      .post<any>(`${this.baseUrl}/fetch_what_i_need`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching what I need:', error);
          return of(null);
        })
      );
  }

  /**
   * Fetch AGM goal
   * @param userId - User ID
   * @param roleId - Role ID
   * @param projectId - Project ID
   * @returns Observable of data
   */
  fetchAgmGoal(userId: number | null = null, roleId: number | null = null, projectId: number | null = null): Observable<any> {
    const payload: any = { user_id: userId };
    if (roleId) payload.role_id = roleId;
    if (projectId) payload.project_id = projectId;

    return this.http
      .post<any>(`${this.baseUrl}/fetch_agm_goal`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching AGM goal:', error);
          return of(null);
        })
      );
  }
  /**
   * All strategies grouped by department (same payload as `fetch_all_strategy`).
   */
  fetchAllStrategysGrouped(): Observable<StrategyDepartmentGroup[]> {
    return this.http
      .get<{
        status?: boolean;
        data?: Array<{
          department_name: string;
          strategies?: Array<{ strategy_id: number; strategy_name: string }>;
        }>;
      }>(`${this.baseUrl}/fetch_all_strategy`)
      .pipe(
        map((res) => {
          const rows = res?.data;
          if (!Array.isArray(rows)) return [];
          return rows
            .map((dept) => ({
              department_name: (dept.department_name ?? '').trim() || '—',
              strategies: (dept.strategies ?? []).map((s) => ({
                strategy_id: s.strategy_id,
                strategy_name: (s.strategy_name ?? '').trim(),
              })),
            }))
            .filter((d) => d.strategies.length > 0);
        }),
        catchError((error) => {
          console.error('Error fetching strategies:', error);
          return of([]);
        })
      );
  }

  /**
   * Flat list derived from grouped strategies (exports, Excel, etc.).
   */
  fetchAllStrategys(): Observable<
    Array<{ strategy_id: number; strategy_name: string; department_name: string; label: string }>
  > {
    return this.fetchAllStrategysGrouped().pipe(
      map((groups) => {
        const out: Array<{
          strategy_id: number;
          strategy_name: string;
          department_name: string;
          label: string;
        }> = [];
        for (const dept of groups) {
          const dname = dept.department_name;
          for (const s of dept.strategies) {
            out.push({
              strategy_id: s.strategy_id,
              strategy_name: s.strategy_name,
              department_name: dname,
              label: dname && dname !== '—' ? `${s.strategy_name} · ${dname}` : s.strategy_name,
            });
          }
        }
        return out;
      })
    );
  }

  /**
   * Fetch main company goal
   * @param roleId - Role ID
   * @param projectId - Project ID
   * @returns Observable of data
   */
  fetchCompanyGoalMain(roleId: number | null = null, projectId: number | null = null): Observable<any> {
    const payload: any = {};
    if (roleId) payload.role_id = roleId;
    if (projectId) payload.project_id = projectId;

    return this.http
      .post<any>(`${this.baseUrl}/fetch_company_goal_main`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error fetching company goal main:', error);
          return of(null);
        })
      );
  }
}
