import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DigitalLeadService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.API_URL;

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
     * Create Digital Lead Web Setup
     * @param payload - { project_id, description, created_by }
     * @returns Observable of API response
     */
    createLeadWebSetup(payload: {
        project_id: number;
        description: string;
        created_by: number;
    }): Observable<{ success: boolean; message: string }> {
        return this.http
            .post<{ success: boolean; message: string }>(`${this.baseUrl}/create_lead_web_setup`, payload)
            .pipe(
                catchError((error) => {
                    console.error('Error creating Lead Web Setup:', error);
                    throw error;
                })
            );
    }
}
