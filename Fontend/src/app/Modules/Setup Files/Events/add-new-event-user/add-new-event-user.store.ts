import { signal, computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { catchError, firstValueFrom, of } from 'rxjs';

// ============ INTERFACE DEFINITIONS ============
export interface EventDetails {
    event_id: number;
    event_title: string;
    event_description: string;
    event_date: string;
    event_venue: string;
    event_image?: string;
    event_type_id?: number;
    event_start_time?: string;
    event_end_time?: string;
    [key: string]: any;
}

export interface UserData {
    name: string;
    email: string;
    mobile: string;
    firm_name: string;
    rera_no: string;
    token_id?: number | null;
    token_type?: string;
    is_highest?: number;
    wing_name?: string | null;
    floor_unit?: string | null;
    unit_type?: string | null;
}

export interface EventRegistrationState {
    eventDetails: EventDetails | null;
    userData: UserData | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class EventRegistrationStore {
    private http = inject(HttpClient);
    private baseUrl = environment.API_URL;

    // ============ STATE SIGNALS ============
    private state = signal<EventRegistrationState>({
        eventDetails: null,
        userData: null,
        isLoading: false,
        isSubmitting: false,
        error: null
    });

    // ============ SELECTOR SIGNALS ============
    readonly eventDetails = computed(() => this.state().eventDetails);
    readonly userData = computed(() => this.state().userData);
    readonly isLoading = computed(() => this.state().isLoading);
    readonly isSubmitting = computed(() => this.state().isSubmitting);
    readonly error = computed(() => this.state().error);

    // ============ ACTIONS ============
    async fetchEventDetails(eventId: number, slug?: string): Promise<void> {
        this.updateState({ isLoading: true, error: null });

        try {
            // 1. Fetch main event info
            const eventResponse = await firstValueFrom(
                this.http.post<any>(`${this.baseUrl}/fetch_single_events`, { event_id: eventId })
            );

            let eventData = eventResponse?.data;
            if (Array.isArray(eventData)) eventData = eventData[0];

            if (!eventData?.event_id) {
                throw new Error(eventResponse?.message || 'Event details not found');
            }

            this.updateState({ eventDetails: eventData });

            // 2. Fetch user data if slug exists
            if (slug) {
                await this.fetchUserDataBySlug(eventId, slug);
            }
        } catch (err: any) {
            this.updateState({ error: err.message || 'Failed to load event' });
        } finally {
            this.updateState({ isLoading: false });
        }
    }

    private async fetchUserDataBySlug(eventId: number, slug: string): Promise<void> {
        try {
            const response = await firstValueFrom(
                this.http.post<any>(`${this.baseUrl}/fetch_token_by_slug`, { event_id: eventId, slug })
            );

            let data = response?.data || response;
            if (Array.isArray(data)) data = data[0];

            if (data) {
                this.updateState({
                    userData: {
                        name: data.name || '',
                        email: data.email_id || data.email || '',
                        mobile: data.mob_no?.toString() || data.mobile?.toString() || '',
                        firm_name: data.firm_name || '',
                        rera_no: data.rera_no || '',
                        token_id: data.token_id || null,
                        token_type: data.token_type || '',
                        is_highest: data.is_highest || 0,
                        wing_name: data.wing_name || null,
                        floor_unit: data.floor_unit || null
                    }
                });
            }
        } catch (err) {
            console.error('Error fetching user data by slug:', err);
        }
    }

    async submitRegistration(payload: any): Promise<any> {
        this.updateState({ isSubmitting: true, error: null });

        try {
            const response = await firstValueFrom(
                this.http.post<any>(`${this.baseUrl}/add_event_user`, payload)
            );
            return response;
        } catch (err: any) {
            this.updateState({ error: err.message || 'Registration failed' });
            throw err;
        } finally {
            this.updateState({ isSubmitting: false });
        }
    }

    clearError(): void {
        this.updateState({ error: null });
    }

    reset(): void {
        this.state.set({
            eventDetails: null,
            userData: null,
            isLoading: false,
            isSubmitting: false,
            error: null
        });
    }

    // ============ HELPERS ============
    private updateState(partialState: Partial<EventRegistrationState>): void {
        this.state.update(s => ({ ...s, ...partialState }));
    }
}
