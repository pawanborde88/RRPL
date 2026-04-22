import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, retry, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

export interface Role {
  role_id: number;
  role: string;
  [key: string]: unknown;
}

export interface TreeNode {
  id: number;
  name: string;
  children: TreeNode[];
}

export interface UserProfile {
  user_id?: number;
  role_id?: number[];
  first_name?: string;
  last_name?: string;
  user_email?: string;
  user_phone?: string;
  dob?: string;
  gender?: number;
  address?: string;
  caller_id?: string;
  manager_id?: number;
  profile_image?: string;
  [key: string]: unknown;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface User {
  user_id: number;
  full_name: string;
  user_email?: string;
  user_phone?: string;
  role?: string;
  active_status?: string;
  active_status_id?: number;
  email_confirm?: number;
  created_at?: string | Date;
  profile_image?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  private readonly RETRY_ATTEMPTS = 2;
  private readonly CACHE_SIZE = 1;

  /**
   * Fetch all roles for dropdown
   */
  fetchRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/roles_dropdown`).pipe(
      retry(this.RETRY_ATTEMPTS),
      shareReplay(this.CACHE_SIZE),
      catchError(() => {
        throw new Error('Unable to fetch roles');
      })
    );
  }

  /**
   * Fetch assigned users tree structure
   */
  fetchAssignedUsers(): Observable<{ success: boolean; data: TreeNode[] }> {
    return this.http
      .get<{ success: boolean; data: TreeNode[] }>(`${this.baseUrl}/fetch_assinged_user`)
      .pipe(
        retry(this.RETRY_ATTEMPTS),
        shareReplay(this.CACHE_SIZE),
        catchError(() => {
          throw new Error('Error fetching assigned users');
        })
      );
  }

  /**
   * Fetch single user profile
   */
  fetchUserProfile(userId: string): Observable<UserProfile> {
    return this.http
      .post<UserProfile>(`${this.baseUrl}/fetch_user_profile`, { user_id: userId })
      .pipe(
        retry(this.RETRY_ATTEMPTS),
        catchError(() => {
          throw new Error('Error fetching user profile');
        })
      );
  }

  /**
   * Add new user
   */
  addUser(formData: FormData): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/add_user`, formData).pipe(
      catchError(() => {
        throw new Error('Failed to add user');
      })
    );
  }

  /**
   * Update user profile
   */
  updateUser(formData: FormData): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.baseUrl}/edit_user_profile`, formData).pipe(
      catchError(() => {
        throw new Error('Failed to update user');
      })
    );
  }

  /**
   * Fetch users by role ID
   */
  fetchUsers(roleId: number | null): Observable<User[]> {
    return this.http
      .post<User[]>(`${this.baseUrl}/fetch_users`, { role_id: roleId })
      .pipe(
        retry(this.RETRY_ATTEMPTS),
        catchError(() => {
          throw new Error('Unable to fetch users');
        })
      );
  }

  /**
   * Resend emails to users
   */
  resendEmails(userIds: number[]): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.baseUrl}/resend_emails`, {
        user_id: userIds,
      })
      .pipe(
        retry(this.RETRY_ATTEMPTS),
        catchError(() => {
          throw new Error('Unable to resend emails');
        })
      );
  }

  /**
   * Delete CP Executive
   */
  deleteCPExecutive(userId: number): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/delete_cp_executive`, { user_id: userId })
      .pipe(
        retry(this.RETRY_ATTEMPTS),
        catchError(() => {
          throw new Error('Unable to delete CP Executive');
        })
      );
  }

  /**
   * Delete CP Owner
   */
  deleteCPOwner(userId: number): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/delete_cp_owner`, { user_id: userId })
      .pipe(
        retry(this.RETRY_ATTEMPTS),
        catchError(() => {
          throw new Error('Unable to delete CP Owner');
        })
      );
  }

  /**
   * Send registration emails/invitations to users for a specific event
   */
  sendUsersRegEmail(eventId: number, userIds: number[]): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/send_users_reg_email`, {
        event_id: eventId,
        user_id: userIds,
      })
      .pipe(
        retry(this.RETRY_ATTEMPTS),
        catchError(() => {
          throw new Error('Unable to send invitations');
        })
      );
  }
}

