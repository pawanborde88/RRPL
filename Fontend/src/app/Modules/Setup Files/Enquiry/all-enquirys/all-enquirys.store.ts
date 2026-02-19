import { Injectable, computed, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { EnquiryManagementService } from '../services/enquiry-management.service';
import { CommentLogService } from '../../comment-log/comment-log.service';
import { CallStatus, LeadLevel } from '../../comment-log/comment-log.models';
import { environment } from '../../../../../environments/environment';

export interface EnquiryFilters {
    project_id: any[];
    source_id: any;
    project_configuration_id: any[];
    user_id: any[];
    sales_executive_id: number[] | null;
    channel_partner_id: any;
    source_detail_id: any;
    lead_level_id: number | null;
    call_status_id: number | null;
    start_date: any | null;
    end_date: any | null;
    ignore_date_filters: boolean | null;
}

export interface PaginationState {
    offset: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
    search: string;
    filteredCount: number;
}

@Injectable({
    providedIn: 'root'
})
export class AllEnquiryStore {
    // Dependencies
    private readonly enquiryService = inject(EnquiryManagementService);
    private readonly commentLogService = inject(CommentLogService);
    private readonly snackBar = inject(MatSnackBar);
    private readonly datePipe = new DatePipe('en-US');

    // ==================== SESSION DATA ====================
    readonly userId = signal<number>(Number(sessionStorage.getItem('session_id')) || 0);
    readonly roleId = signal<number>(Number(sessionStorage.getItem('role_id')) || 0);
    readonly roleData = signal<string | null>(sessionStorage.getItem('role_id'));
    readonly permissionData = signal<string | null>(sessionStorage.getItem('permission'));

    // ==================== STATE SIGNALS ====================
    readonly loading = signal<boolean>(false);
    readonly showClaimedEnquiries = signal<boolean>(false);
    readonly selectedBookings = signal<any[]>([]);

    // Dropdown Data
    readonly projects = signal<any[]>([]);
    readonly sources = signal<any[]>([]);
    readonly sourceDetails = signal<any[]>([]);
    readonly salesExecutives = signal<any[]>([]);
    readonly preferenceDropdown = signal<any[]>([]);
    readonly channelPartners = signal<any[]>([]);
    readonly leadLevels = signal<LeadLevel[]>([]);
    readonly callStatuses = signal<CallStatus[]>([]);

    // History State Data
    readonly cpTargetLoggedData = signal<any>(null);
    readonly successBookingData = signal<any>(null);

    // Filter State
    readonly filters = signal<EnquiryFilters>({
        project_id: [],
        source_id: null,
        project_configuration_id: [],
        user_id: [],
        sales_executive_id: null,
        channel_partner_id: null,
        source_detail_id: null,
        lead_level_id: null,
        call_status_id: null,
        start_date: null,
        end_date: null,
        ignore_date_filters: false
    });

    // Pagination State
    readonly paginationParams = signal<PaginationState>({
        offset: 0,
        limit: 30, // Default Page Size
        sortBy: 'created_at',
        sortOrder: 'desc',
        search: '',
        filteredCount: 0,
    });

    // ==================== COMPUTED SELECTORS ====================
    readonly isChannelPartnerSource = computed(() => {
        return this.filters().source_id === '3' || this.filters().source_id === 3;
    });

    readonly isNotChannelPartnerSource = computed(() => {
        const sid = this.filters().source_id;
        return sid && sid !== '3' && sid !== 3;
    });

    readonly hasSelectedBookings = computed(() => this.selectedBookings().length > 0);

    readonly isRole7 = computed(() => this.roleId() === 7);

    // Permission Helper
    readonly hasPermission = (permission: string) => computed(() =>
        this.permissionData()?.includes(permission) ?? false
    );

    // Role Helper
    readonly hasOnlyRoles = (allowedRoles: number[]) => computed(() => {
        const roleData = this.roleData();
        if (!roleData) return false;
        const currentRoles = roleData.split(',').map(Number);
        return currentRoles.some((role) => allowedRoles.includes(role));
    });

    // ==================== PAYLOAD COMPUTATION ====================
    readonly agGridPayload = computed(() => {
        const formValues = this.filters();
        const pagination = this.paginationParams();
        const isClaimed = this.showClaimedEnquiries();
        const userId = this.userId();

        let salesExecutiveID: any = null;
        if (this.hasOnlyRoles([7])()) {
            salesExecutiveID = userId ? [userId] : null;
        } else {
            salesExecutiveID = Array.isArray(formValues.sales_executive_id)
                ? formValues.sales_executive_id
                : (formValues.sales_executive_id ? [formValues.sales_executive_id] : null);
        }

        const apiFilters: any = {
            project_id: formValues.project_id?.length ? formValues.project_id : null,
            source_id: formValues.source_id || null,
            project_configuration_id: formValues.project_configuration_id || null,
            user_id: formValues.user_id?.length ? formValues.user_id : userId,
            channel_partner_id: formValues.channel_partner_id || null,
            source_detail_id: formValues.source_detail_id || null,
            lead_level_id: formValues.lead_level_id || null,
            call_status_id: formValues.call_status_id || null,
            sales_executive_id: salesExecutiveID?.length > 0 ? salesExecutiveID : null,
            ignore_date_filters: formValues.ignore_date_filters,
            claim_status: isClaimed ? 1 : 0,
            search: pagination.search,
            project_enq_id: this.cpTargetLoggedData()?.month_project_enq_id || null,
            success_booking_project_id: this.successBookingData()?.project_id || null,
        };

        const channelPartnerID = sessionStorage.getItem('channel_partner_id');
        if (this.hasOnlyRoles([5])()) {
            apiFilters.channel_partner_id = channelPartnerID ? [Number(channelPartnerID)] : null;
            apiFilters.source_id = 3;
        }

        if (this.hasOnlyRoles([6])()) {
            apiFilters.source_id = 3;
        }

        if (!apiFilters.ignore_date_filters) {
            if (formValues.start_date) {
                apiFilters.start_date = this.datePipe.transform(formValues.start_date, 'yyyy-MM-dd');
            }
            if (formValues.end_date) {
                apiFilters.end_date = this.datePipe.transform(formValues.end_date, 'yyyy-MM-dd');
            }
        }

        return {
            offset: pagination.offset,
            limit: pagination.limit,
            sortBy: pagination.sortBy,
            sortOrder: pagination.sortOrder,
            filters: apiFilters
        };
    });

    // ==================== ACTIONS / METHODS ====================

    setHistoryData(cpData: any, bookingData: any) {
        this.cpTargetLoggedData.set(cpData);
        this.successBookingData.set(bookingData);
    }

    loadProjects(userId: number) {
        this.updateLoading(true);
        this.enquiryService.fetchProjects(userId).subscribe({
            next: (res: any) => {
                this.projects.set(res || []);
                this.updateLoading(false);
            },
            error: () => {
                this.showError('Unable to fetch projects.');
                this.updateLoading(false);
            }
        });
    }

    loadSources() {
        this.enquiryService.fetchSources().subscribe({
            next: (res: any) => this.sources.set(res || []),
            error: () => this.showError('Unable to fetch sources.')
        });
    }

    loadSourceDetails(sourceId: any) {
        this.enquiryService.fetchSourceDetails(sourceId).subscribe({
            next: (res: any) => this.sourceDetails.set(res || []),
            error: () => this.showError('Unable to fetch source details.')
        });
    }

    loadSalesExecutives(projectId: any) {
        this.enquiryService.fetchSalesExecutives(projectId).subscribe({
            next: (res: any) => this.salesExecutives.set(res || []),
            error: () => this.showError('Unable to fetch sales executives.')
        });
    }

    loadPreferenceDropdown(projectId: any) {
        this.enquiryService.fetchWebConfig(projectId).subscribe({
            next: (res: any) => this.preferenceDropdown.set(res || []),
            error: () => { }
        });
    }

    loadLeadLevels() {
        this.commentLogService.fetchLeadLevels().subscribe({
            next: (res: any) => this.leadLevels.set(res || []),
            error: () => this.showError('Unable to fetch lead levels.')
        });
    }

    loadCallStatuses(leadLevelId: number) {
        if (!leadLevelId || leadLevelId <= 0) {
            this.callStatuses.set([]);
            return;
        }
        this.commentLogService.fetchCallStatus(leadLevelId).subscribe({
            next: (res: any) => this.callStatuses.set(res || []),
            error: () => this.showError('Unable to fetch call statuses.')
        });
    }

    updateFilter(partialFilter: Partial<EnquiryFilters>) {
        this.filters.update(current => ({ ...current, ...partialFilter }));
    }

    updatePagination(partialPagination: Partial<PaginationState>) {
        this.paginationParams.update(current => ({ ...current, ...partialPagination }));
    }

    setClaimedView(isClaimed: boolean) {
        this.showClaimedEnquiries.set(isClaimed);
        // Reset pagination when switching views
        this.updatePagination({ offset: 0 });
    }

    updateSelectedBookings(bookings: any[]) {
        this.selectedBookings.set(bookings);
    }

    updateLoading(isLoading: boolean) {
        this.loading.set(isLoading);
    }

    private showError(message: string) {
        this.snackBar.open(message, 'Close', { duration: 3000 });
    }
}
