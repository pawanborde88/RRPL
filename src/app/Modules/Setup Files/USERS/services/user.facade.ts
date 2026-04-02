import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserService, User } from './user.service';
import { UserStore } from './user.store';

@Injectable({
    providedIn: 'root',
})
export class UserFacade {
    private readonly service = inject(UserService);
    private readonly store = inject(UserStore);

    // Exposed Signals
    readonly users = this.store.users;
    readonly roles = this.store.roles;
    readonly assignedUsers = this.store.assignedUsers;
    readonly loading = this.store.loading;
    readonly error = this.store.error;

    /**
     * Load users by role ID
     */
    async loadUsers(roleId: number | null, transform?: (record: any) => User): Promise<void> {
        this.store.setLoading(true);
        this.store.setError(null);

        try {
            const users = await firstValueFrom(this.service.fetchUsers(roleId));
            const transformedUsers = transform
                ? users.map(transform)
                : users.map((user: any) => ({ ...user, selected: false }));
            this.store.setUsers(transformedUsers);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load users';
            this.store.setError(message);
            this.store.setUsers([]);
        } finally {
            this.store.setLoading(false);
        }
    }

    /**
     * Load roles
     */
    async loadRoles(): Promise<void> {
        this.store.setLoading(true);
        this.store.setError(null);

        try {
            const roles = await firstValueFrom(this.service.fetchRoles());
            this.store.setRoles(roles);
        } catch (error) {
            this.store.setError(error instanceof Error ? error.message : 'Failed to load roles');
            this.store.setRoles([]);
        } finally {
            this.store.setLoading(false);
        }
    }

    /**
     * Load assigned users
     */
    async loadAssignedUsers(): Promise<void> {
        this.store.setLoading(true);
        this.store.setError(null);

        try {
            const response = await firstValueFrom(this.service.fetchAssignedUsers());
            if (response?.success && response.data) {
                this.store.setAssignedUsers(response.data);
            } else {
                this.store.setAssignedUsers([]);
            }
        } catch (error) {
            this.store.setError(error instanceof Error ? error.message : 'Failed to load assigned users');
            this.store.setAssignedUsers([]);
        } finally {
            this.store.setLoading(false);
        }
    }

    /**
     * Reset store state
     */
    reset(): void {
        this.store.reset();
    }
}
