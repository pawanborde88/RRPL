import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Project {
  project_id: number;
  property_name: string;
}

export interface ChannelPartner {
  channel_partner_id: number;
  firm_name: string;
  cp_owner?: string;
  full_name?: string;
}

export interface Executive {
  user_id: number;
  first_name: string;
  last_name: string;
  user_phone?: string;
  full_name?: string;
}

export interface MeetingPayload {
  project_id?: number[] | null;
  channel_partner_id?: number[] | null;
  cp_executive_id?: number[] | null;
  sales_executive_id?: number[] | null;
  source_executive_id?: number[] | null;
  start_date?: string | null;
  end_date?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ChannelPartnerMeetingService {
  private readonly baseUrl = environment.API_URL;

  constructor(private http: HttpClient) { }

  /**
   * Fetch all projects for dropdown
   */
  fetchProjects(userId: number | null): Observable<Project[]> {
    return this.http
      .post<Project[]>(`${this.baseUrl}/user_project_dropdown`, {
        user_id: userId,
      })
      .pipe(
        map((res) => res || []),
        shareReplay(1) // Cache the result
      );
  }

  /**
   * Search channel partners by firm name
   */
  searchChannelPartners(firmName: string): Observable<ChannelPartner[]> {
    if (!firmName || firmName.trim().length <= 3) {
      return new Observable((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    return this.http
      .post<ChannelPartner[]>(`${this.baseUrl}/channel_partner_dropdown`, {
        firm_name: firmName.trim(),
      })
      .pipe(
        map((res) =>
          (res || []).map((item) => ({
            ...item,
            full_name: `${item.firm_name} -(${item.cp_owner || '--'})`,
          }))
        )
      );
  }

  /**
   * Fetch CP executives by channel partner IDs
   */
  fetchCPExecutives(channelPartnerIDs: number[]): Observable<Executive[]> {
    if (!channelPartnerIDs || channelPartnerIDs.length === 0) {
      return new Observable((observer) => {
        observer.next([]);
        observer.complete();
      });
    }

    return this.http
      .post<Executive[]>(`${this.baseUrl}/fetch_cp_executives`, {
        channel_partner_id: channelPartnerIDs,
        role_id: 6,
      })
      .pipe(
        map((res) =>
          (res || []).map((item) => ({
            ...item,
            full_name: `${item.first_name} ${item.last_name} --(${item.user_phone || '--'})`,
          }))
        )
      );
  }

  /**
   * Fetch sales executives by role ID
   */
  fetchSalesExecutives(roleIds: number[]): Observable<Executive[]> {
    return this.http
      .post<Executive[]>(`${this.baseUrl}/sales_executive_dropdown`, {
        role_id: roleIds,
      })
      .pipe(
        map((res) =>
          (res || []).map((item) => ({
            ...item,
            full_name: `${item.first_name} ${item.last_name}`.trim(),
          }))
        ),
        shareReplay(1) // Cache the result
      );
  }

  fetchMeetings(payload: MeetingPayload | any): Observable<any> {
    return this.http.post(`${this.baseUrl}/fetch_meetings`, payload);
  }


  fetchRouteUrl(payload: MeetingPayload | any): Observable<{ route_url: string }> {
    return this.http.post<{ route_url: string }>(
      `${this.baseUrl}/fetch_all_meetings`,
      payload
    );
  }

  /**
   * Assign sourcing executive to channel partners
   */
  assignSourcingExecutive(payload: { channel_partner_id: number[], sourcing_executive_id: number[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/assigned_sourcing_executive`, payload);
  }
}

