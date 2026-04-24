import { Injectable, inject } from '@angular/core';
import { BaseStore } from '../../../../Core/store/base-store';
import { ChannelPartnerMeetingService, Executive, Project } from '../../../Channel Partner Meetings/all-channel-partner-meeting/channel-partner-meeting.service';
import { Observable, tap, finalize, of, catchError } from 'rxjs';
import { AuthService } from '../../../../Service/auth.service';

interface ChannelPartnerState {
  executives: Executive[];
  partners: { id: any, name: string }[];
  projects: Project[];
}

@Injectable()
export class ChannelPartnerStore extends BaseStore<ChannelPartnerState> {
  private readonly service = inject(ChannelPartnerMeetingService);
  private readonly authService = inject(AuthService);


  constructor() {
    super({
      executives: [],
      partners: [],
      projects: [],
    });
  }

  readonly executives = this.select((state) => state.executives);
  readonly partners = this.select((state) => state.partners);
  readonly projects = this.select((state) => state.projects);
  readonly partnerNames = this.select((state) =>
    state.partners.map((p) => p.name).join(', ')
  );

  setPartners(partners: { id: any, name: string }[]): void {
    this.patchState({ partners });
  }

  fetchSalesExecutives(roleIds: number[], projectIds?: number[]): void {
    this.setLoading(true);
    this.service.fetchSalesExecutives(roleIds, projectIds).pipe(
      tap((res) => {
        const executives = (res || []).map((item) => ({
          ...item,
          full_name: `${item.first_name} ${item.last_name}`.trim(),
        }));
        this.patchState({ executives });
      }),
      finalize(() => this.setLoading(false))
    ).subscribe({
      error: (err) => this.setError('Failed to fetch executives')
    });
  }


  fetchProjects(): void {
    this.setLoading(true);
    this.service.fetchProjects(this.authService.userId()).pipe(
      tap((projects) => this.patchState({ projects })),
      catchError((error) => {
        console.error('Error fetching projects:', error);
        this.setError('Failed to fetch projects');
        return of([]);
      }),
      finalize(() => this.setLoading(false))
    ).subscribe();
  }

  assignExecutives(sourcingExecutiveIds: number[], projectId: number, createdBy: number): Observable<any> {
    const partnerIds = this.state().partners.map(p => p.id);

    if (!partnerIds.length || !sourcingExecutiveIds?.length || !projectId) {
      return of(null);
    }

    const payload = {
      channel_partner_id: partnerIds,
      sourcing_executive_id: sourcingExecutiveIds,
      project_id: projectId,
      created_by: createdBy
    };
    
    this.setLoading(true);
    return this.service.assignSourcingExecutive(payload).pipe(
      finalize(() => this.setLoading(false)),
      catchError((err) => {
        console.error('Assignment failed:', err);
        this.setError('Assignment failed');
        return of(null);
      })
    );
  }
}
