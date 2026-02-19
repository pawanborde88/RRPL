import { Injectable, computed } from '@angular/core';
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
    // Selectors
    readonly showTemplate = this.select((state) => state.showTemplate);
    readonly user = this.select((state) => state.user);
    readonly permissions = this.select((state) => state.permissions);

    readonly isAuthenticated = computed(() => !!this.user());

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
