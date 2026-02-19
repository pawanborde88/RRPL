import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, distinctUntilChanged, Observable, of, retry, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { CommonService } from '../../../../../Service/common/common.service';
import { CommentLogService } from '../../../comment-log/comment-log.service';
import { CallStatus, LeadLevel } from '../../../comment-log/comment-log.models';
import { environment } from '../../../../../../environments/environment';
import { SelectOption } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ChannelPartner, EnquiryStatus, LeadData, PaginationState, Source, SourceDetail, Telecaller } from './claimed-leads.models';

const RETRY_ATTEMPTS = 2;
const CACHE_SIZE = 1;
const GRID_REFRESH_DEBOUNCE_MS = 600;

@Injectable({
    providedIn: 'root'
})
export class ClaimedLeadsFacade {
    private readonly http = inject(HttpClient);
    private readonly commonService = inject(CommonService);
    private readonly commentLogService = inject(CommentLogService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly destroyRef = inject(DestroyRef);

    private readonly baseUrl = environment.API_URL;

    // Session data
    readonly roleId = computed(() => Number(sessionStorage.getItem('role_id')) || 0);
    readonly userId = computed(() => Number(sessionStorage.getItem('session_id')) || 0);
    readonly permissionData = computed(() => sessionStorage.getItem('permission') || '');

    // State Signals
    readonly loading = signal<boolean>(false);
    readonly isFiltered = signal<boolean>(false);
    readonly isPanelExpanded = signal<boolean>(true);
    readonly selectedBookings = signal<LeadData[]>([]);
    readonly scrollIndex = signal<number>(0);
    readonly assignedStatus = signal<number>(0);

    // Dropdown Signals
    readonly projectsList = signal<SelectOption[]>([]);
    readonly statusDropdown = signal<EnquiryStatus[]>([]);
    readonly allTelecallerlist = signal<Telecaller[]>([]);
    readonly leadLevels = signal<LeadLevel[]>([]);
    readonly callStatus = signal<CallStatus[]>([]);
    readonly sourcesList = signal<Source[]>([]);
    readonly sourceDetailedList = signal<SourceDetail[]>([]);
    readonly allChannelPartnerList = signal<ChannelPartner[]>([]);

    // Pagination
    readonly paginationParams = signal<PaginationState>({
        offset: 0,
        limit: 100,
        sortBy: 'created_at',
        sortOrder: 'desc',
        search: '',
        filters: {},
        filteredCount: 0,
    });

    // Computed
    readonly pageTitle = computed(() => this.assignedStatus() === 1 ? 'All Claimed Project Lead' : 'All Unclaimed Project Lead');
    readonly hasSelectedBookings = computed(() => this.selectedBookings().length > 0);
    readonly onRowSelected = signal<LeadData[]>([]);
    readonly globalSearchTerm = signal<string>('');

    // Grid Refresh Subject
    readonly refreshGridSubject = new Subject<number>();

    // Private Cache
    private projectsCache$?: Observable<SelectOption[]>;

    constructor() { }

    // Permission Helpers
    hasPermission(permission: string): boolean {
        return this.permissionData().includes(permission);
    }

    hasOnlyRoles(allowedRoles: number[]): boolean {
        const roleData = sessionStorage.getItem('role_id');
        if (!roleData) return false;
        const currentRoles = roleData.split(',').map(Number);
        return currentRoles.some((role) => allowedRoles.includes(role));
    }

    // Data Fetching Methods
    fetchAllTalecallerList(projectIds: number[]): void {
        if (!projectIds || projectIds.length === 0) {
            this.allTelecallerlist.set([]);
            return;
        }

        this.commonService.fetchTelecallerDropdown(projectIds).pipe(
            retry(RETRY_ATTEMPTS),
            catchError(() => {
                this.snackBar.open('Unable to fetch telecallers.', 'Close', { duration: 3000 });
                return of([]);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((res) => {
            const telecallers: Telecaller[] = res.map((item) => ({
                ...item,
                full_name: `${item.first_name} ${item.last_name}`,
            }));
            this.allTelecallerlist.set(telecallers);
        });
    }

    fetchAllSources(): void {
        this.loading.set(true);
        this.commonService.fetchSources().pipe(
            retry(RETRY_ATTEMPTS),
            catchError(() => {
                this.snackBar.open('Unable to fetch sources.', 'Close', { duration: 3000 });
                return of([]);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((res) => {
            this.sourcesList.set(res || []);
            this.loading.set(false);
        });
    }

    fetchAllProjects(): void {
        const userId = this.userId();
        if (!this.projectsCache$) {
            this.projectsCache$ = this.commonService.fetchUserProjectDropdown(userId).pipe(
                retry(RETRY_ATTEMPTS),
                shareReplay({ bufferSize: CACHE_SIZE, refCount: true }),
                catchError(() => {
                    this.snackBar.open('Unable to fetch projects.', 'Close', { duration: 3000 });
                    return of<SelectOption[]>([]);
                })
            );
        }

        this.projectsCache$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
            if (res) this.projectsList.set(res);
        });
    }

    fetchallLeadLevels(): void {
        this.commentLogService.fetchLeadLevels().pipe(
            retry(RETRY_ATTEMPTS),
            catchError(() => {
                this.snackBar.open('Unable to fetch lead levels.', 'Close', { duration: 3000 });
                return of([]);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((res) => {
            this.leadLevels.set(res);
        });
    }

    fetchSourceDetails(sourceId: number): void {
        this.commonService.fetchSourceDetails(sourceId).pipe(
            retry(RETRY_ATTEMPTS),
            catchError(() => {
                this.snackBar.open('Unable to fetch source details.', 'Close', { duration: 3000 });
                return of([]);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((sourceDetails) => {
            this.sourceDetailedList.set(sourceDetails);
        });
    }

    fetchChannelPartners(firmName: string): void {
        this.commonService.fetchChannelPartnerDropdown(firmName).pipe(
            retry(RETRY_ATTEMPTS),
            catchError(() => {
                this.snackBar.open('Unable to fetch channel partners.', 'Close', { duration: 3000 });
                return of([]);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((channelPartners) => {
            const partnersWithFullName = channelPartners.map((item) => ({
                ...item,
                full_name: item.cp_owner ? `${item.firm_name} --(${item.cp_owner})` : item.firm_name,
            }));
            this.allChannelPartnerList.set(partnersWithFullName);
        });
    }

    fetchCallStatus(leadLevelId: number): void {
        this.commentLogService.fetchCallStatus(leadLevelId).pipe(
            retry(RETRY_ATTEMPTS),
            catchError(() => {
                this.snackBar.open('Unable to fetch call statuses.', 'Close', { duration: 3000 });
                return of([]);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((res) => {
            this.callStatus.set(res);
        });
    }

    // Actions
    deleteProjectLead(leadID: number, reason: string): Observable<any> {
        const requestPayload = {
            project_lead_id: leadID,
            reason: reason,
            created_by: this.userId(),
        };
        return this.http.post(`${this.baseUrl}/delete_lead`, requestPayload).pipe(
            retry(RETRY_ATTEMPTS),
            tap(() => {
                this.snackBar.open('Lead deleted successfully', 'Close', { duration: 3000 });
                this.refreshGridSubject.next(Date.now());
            }),
            catchError(() => {
                this.snackBar.open('Unable to Delete lead.', 'Close', { duration: 3000 });
                return of(null);
            })
        );
    }

    callLead(project_lead_id: number): Observable<any> {
        const payload = {
            user_id: this.userId(),
            project_lead_id,
        };

        return this.http.post<unknown>(`${this.baseUrl}/call_to_leads`, payload).pipe(
            retry(RETRY_ATTEMPTS),
            tap(() => {
                this.snackBar.open('Lead called successfully!', 'Close', { duration: 3000 });
            }),
            catchError(() => {
                this.snackBar.open('Call not mapped to any IVR please contact admin', 'Close', { duration: 3000 });
                return of(null);
            })
        );
    }

    // State Updates
    setAssignedStatus(status: number): void {
        this.assignedStatus.set(status);
        this.refreshGridSubject.next(Date.now());
    }

    setSearchTerm(term: string): void {
        this.globalSearchTerm.set(term);
        this.paginationParams.update(params => ({ ...params, offset: 0, search: term }));
        this.refreshGridSubject.next(Date.now());
    }

    updateSelectedBookings(rows: LeadData[]): void {
        this.selectedBookings.set(rows);
        this.onRowSelected.set(rows);
    }

    togglePanel(): void {
        this.isPanelExpanded.update(expanded => !expanded);
    }
}
