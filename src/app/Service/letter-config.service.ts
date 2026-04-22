import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LetterType {
  letter_type_id: number;
  letter_type: string;
}

export interface Project {
  project_id: number;
  property_name: string;
}

export interface Wing {
  wing_id: number;
  wing_name: string;
}

export interface PreferredBank {
  preferred_bank_id: number;
  preferred_bank: string;
}

export interface LetterConfig {
  letter_config_id: number;
  letter_type_id: number;
  wing_id: number;
  effective_date: string;
  project_id: number;
  land_owner_setup_id: number | null;
  bank_id: number | null;
  html_content: string | null;
  html_file: string | null;
  word_file: string | null;
  updated_by: number | null;
  created_by: number | null;
}

export interface LetterConfigResponse {
  status: boolean;
  message: string;
  data: LetterConfig[];
}

@Injectable({
  providedIn: 'root'
})
export class LetterConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  fetchProjects(userId: number | null): Observable<Project[]> {
    return this.http.post<Project[]>(`${this.baseUrl}/user_project_dropdown`, { user_id: userId });
  }

  fetchWings(projectId: number): Observable<Wing[]> {
    return this.http.post<Wing[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectId });
  }

  fetchLetterTypes(): Observable<{ data: LetterType[] }> {
    return this.http.get<{ data: LetterType[] }>(`${this.baseUrl}/letter_type_dropdown`);
  }

  fetchPreferredBanks(): Observable<PreferredBank[]> {
    return this.http.get<PreferredBank[]>(`${this.baseUrl}/preferred_bank_dropdown`);
  }

  fetchLetterConfig(letterConfigId: number): Observable<LetterConfigResponse> {
    return this.http.post<LetterConfigResponse>(`${this.baseUrl}/fetch_letter_config`, {
      letter_config_id: letterConfigId
    });
  }

  addLetterConfig(formData: FormData): Observable<{ status: boolean; message: string }> {
    return this.http.post<{ status: boolean; message: string }>(`${this.baseUrl}/add_letter_config`, formData);
  }

  editLetterConfig(formData: FormData): Observable<{ status: boolean; message: string }> {
    return this.http.post<{ status: boolean; message: string }>(`${this.baseUrl}/edit_letter_config`, formData);
  }
}




























