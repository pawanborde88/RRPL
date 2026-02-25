import { Injectable, computed, inject } from '@angular/core';
import { SignalStore } from '../../../Core/store/signal-store';
import { CommonService } from '../../../Service/common/common.service';
import { tap, catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

export interface DigitalLeadsState {
    leads: any[];
    isLoading: boolean;
    projects: any[];
    filters: any;
    error: string | null;
}

const initialState: DigitalLeadsState = {
    leads: [],
    isLoading: false,
    projects: [],
    filters: {},
    error: null,
};

@Injectable({
    providedIn: 'root'
})
export class DigitalLeadsStore extends SignalStore<DigitalLeadsState> {
    private commonService = inject(CommonService);

    readonly leads = this.select(state => state.leads);
    readonly isLoading = this.select(state => state.isLoading);
    readonly projects = this.select(state => state.projects);
    readonly filters = this.select(state => state.filters);

    // Computed state
    readonly hasLeads = computed(() => this.leads().length > 0);

    constructor() {
        super(initialState);
    }

    loadProjects(userId: number) {
        this.setState({ isLoading: true, error: null });

        this.commonService.fetchUserProjectDropdown(userId).pipe(
            tap((projects: any) => {
                this.setState({ projects, isLoading: false });
            }),
            catchError(error => {
                this.setState({ error: 'Failed to load projects', isLoading: false });
                // Handle error specifically if needed
                return of([]);
            })
        ).subscribe();
    }

    updateFilters(filters: any) {
        this.setState({ filters });
    }

    setLoading(isLoading: boolean) {
        this.setState({ isLoading });
    }
}
