import { Injectable, inject } from '@angular/core';
import { BaseStore } from '../../../../Core/store/base-store';
import { ChannelPartnerMeetingService, Executive, Project } from '../../../Channel Partner Meetings/all-channel-partner-meeting/channel-partner-meeting.service';
import { Observable, tap, finalize, of, catchError } from 'rxjs';
import { AuthService } from '../../../../Service/auth.service';
import { CommonService } from '../../../../Service/common/common.service';

interface ChannelPartnerState {
  executives: Executive[];
  salesExecutives: any[];
  partners: { id: any, name: string }[];
  projects: Project[];
}

@Injectable()
export class ChannelPartnerStore extends BaseStore<ChannelPartnerState> {
  private readonly service = inject(ChannelPartnerMeetingService);
  private readonly commonService = inject(CommonService);
  private readonly authService = inject(AuthService);


  constructor() {
    super({
      executives: [],
      salesExecutives: [],
      partners: [],
      projects: [],
    });
  }

  readonly executives = this.select((state) => state.executives);
  readonly salesExecutives = this.select((state) => state.salesExecutives);
  readonly partners = this.select((state) => state.partners);
  readonly projects = this.select((state) => state.projects);
  readonly partnerNames = this.select((state) =>
    state.partners.map((p) => p.name).join(', ')
  );

  setPartners(partners: { id: any, name: string }[]): void {
    this.patchState({ partners });
  }

  fetchSourceExecutives(roleIds: number[], projectIds?: number[]): void {
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
      error: (err) => this.setError('Failed to fetch sourcing executives')
    });
  }

  fetchSalesExecutives(projectId: number): void {
    this.setLoading(true);
    this.commonService.fetchSalesExecutives(projectId).pipe(
      tap((res) => {
        const salesExecutives = (res || []).map((item: any) => ({
          ...item,
          user_id: item.user_id,
          user_name: item.user_name,
        }));
        this.patchState({ salesExecutives });
      }),
      finalize(() => this.setLoading(false))
    ).subscribe({
      error: (err) => this.setError('Failed to fetch sales executives')
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

  assignExecutives(salesExecutiveIds: number[], sourceExecutiveIds: number[], projectId: number, createdBy: number): Observable<any> {
    const partnerIds = this.state().partners.map(p => p.id);

    if (!partnerIds.length || (!salesExecutiveIds?.length && !sourceExecutiveIds?.length) || !projectId) {
      return of(null);
    }

    const payload = {
      channel_partner_id: partnerIds,
      sales_executive_id: salesExecutiveIds,
      sourcing_executive_id: sourceExecutiveIds,
      project_id: projectId,
      created_by: createdBy
    };
    
    this.setLoading(true);
    return this.service.assignSourcingExecutive(payload as any).pipe(
      finalize(() => this.setLoading(false)),
      catchError((err) => {
        console.error('Assignment failed:', err);
        this.setError('Assignment failed');
        return of(null);
      })
    );
  }
}
