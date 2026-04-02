import { Injectable, inject } from '@angular/core';
import { BaseStore } from '../../../../Core/store/base-store';
import { ChannelPartnerMeetingService, Executive, Project } from '../../../Channel Partner Meetings/all-channel-partner-meeting/channel-partner-meeting.service';
import { tap, finalize, catchError, of } from 'rxjs';
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

  fetchSalesExecutives(roleIds: number[]): void {
    this.setLoading(true);
    this.service.fetchSalesExecutives(roleIds).pipe(
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

  assignExecutives(sourcingExecutiveIds: number[], projectIds: number[], createdBy: number): void {
    const partnerIds = this.state().partners.map(p => p.id);

    if (!partnerIds.length || !sourcingExecutiveIds?.length) {
      return;
    }

    const payload = {
      channel_partner_id: partnerIds,
      sourcing_executive_id: sourcingExecutiveIds,
      project_id: projectIds,
      created_by: createdBy
    };

    this.setLoading(true);
    this.service.assignSourcingExecutive(payload).pipe(
      finalize(() => this.setLoading(false))
    ).subscribe({
      next: () => {
        // Success handling
      },
      error: (err) => {
        console.error('Assignment failed:', err);
        this.setError('Assignment failed');
      }
    });
  }
}
