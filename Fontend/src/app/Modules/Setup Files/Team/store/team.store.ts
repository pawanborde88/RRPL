import { Injectable, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamService } from '../services/team.service';
import { tap, finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TeamStore {
    // Dependencies
    private readonly teamService = inject(TeamService);
    private readonly snackBar = inject(MatSnackBar);

    // State
    readonly teams = signal<any[]>([]);
    readonly loading = signal<boolean>(false);
    readonly userId = signal<number>(Number(sessionStorage.getItem('session_id')) || 0);
    readonly roleId = signal<number>(Number(sessionStorage.getItem('role_id')) || 0);

    // Computed
    readonly teamCount = computed(() => this.teams().length);

    // Actions
    loadTeams() {
        this.loading.set(true);
        this.teamService.fetchTeams(this.userId()).pipe(
            tap((res) => this.teams.set(res || [])),
            catchError((err) => {
                console.error(err);
                this.snackBar.open('Unable to fetch team details.', 'Close', { duration: 3000 });
                return of([]);
            }),
            finalize(() => this.loading.set(false))
        ).subscribe();
    }

    deleteTeam(teamId: number) {
        return this.teamService.deleteTeam(teamId).pipe(
            tap(() => {
                this.snackBar.open('Team deleted successfully', 'Close', { duration: 3000 });
                this.loadTeams(); // Refresh list
            }),
            catchError((err) => {
                console.error(err);
                this.snackBar.open('Unable to Delete Team.', 'Close', { duration: 3000 });
                return of(null);
            })
        );
    }
}
