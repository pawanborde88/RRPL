import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TeamService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.API_URL;

    fetchTeams(accountId: number): Observable<any[]> {
        return this.http.post<any[]>(`${this.baseUrl}/fetch_team_details`, { account_id: accountId });
    }

    deleteTeam(teamId: number): Observable<any> {
        return this.http.post(`${this.baseUrl}/delete_team`, { team_id: teamId });
    }
}
