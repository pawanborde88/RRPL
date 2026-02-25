import { Injectable, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BaseStore } from './base-store';

export interface AppState {
    showTemplate: boolean;
    user: any | null;
    permissions: string[];
}

const initialState: AppState = {
    showTemplate: true,
    user: null,
    permissions: [],
};

@Injectable({
    providedIn: 'root',
})
export class AppStore extends BaseStore<AppState> {
    private readonly platformId = inject(PLATFORM_ID);

    // Selectors
    readonly showTemplate = this.select((state) => state.showTemplate);
    readonly user = this.select((state) => state.user);
    readonly permissions = this.select((state) => state.permissions);

    readonly isAuthenticated = computed(() => {
        if (this.user()) return true;
        if (isPlatformBrowser(this.platformId)) {
            return !!sessionStorage.getItem('session_id');
        }
        return false;
    });

    constructor() {
        super(initialState);
    }

    // Actions
    setShowTemplate(show: boolean): void {
        this.patchState({ showTemplate: show });
    }

    setUser(user: any): void {
        this.patchState({ user });
    }

    setPermissions(permissions: string[]): void {
        this.patchState({ permissions });
    }

    hasPermission(code: string): boolean {
        return this.permissions().includes(code);
    }

    reset(): void {
        this.setState(initialState);
    }
}
