import { inject, Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { UserService, Role, TreeNode, User } from './user.service';

export interface UserFormState {
  roles: Role[];
  assignedUsers: TreeNode[];
  loading: boolean;
  error: string | null;
}

export interface UsersListState {
  users: User[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  private readonly userService = inject(UserService);

  // State signals
  private readonly _roles = signal<Role[]>([]);
  private readonly _assignedUsers = signal<TreeNode[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly roles = this._roles.asReadonly();
  readonly assignedUsers = this._assignedUsers.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly hasRoles = computed(() => this._roles().length > 0);
  readonly hasAssignedUsers = computed(() => this._assignedUsers().length > 0);
  readonly state = computed<UserFormState>(() => ({
    roles: this._roles(),
    assignedUsers: this._assignedUsers(),
    loading: this._loading(),
    error: this._error(),
  }));

  /**
   * Load roles
   */
  async loadRoles(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const roles = await firstValueFrom(this.userService.fetchRoles());
      this._roles.set(roles);
    } catch (error) {
      this._error.set(
        error instanceof Error ? error.message : 'Failed to load roles'
      );
      this._roles.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Load assigned users
   */
  async loadAssignedUsers(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.userService.fetchAssignedUsers()
      );
      if (response?.success && response.data) {
        this._assignedUsers.set(response.data);
      } else {
        this._assignedUsers.set([]);
      }
    } catch (error) {
      this._error.set(
        error instanceof Error
          ? error.message
          : 'Failed to load assigned users'
      );
      this._assignedUsers.set([]);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    this._roles.set([]);
    this._assignedUsers.set([]);
    this._loading.set(false);
    this._error.set(null);
  }

  // ============================================================================
  // USERS LIST STATE
  // ============================================================================

  private readonly _users = signal<User[]>([]);
  private readonly _usersLoading = signal<boolean>(false);
  private readonly _usersError = signal<string | null>(null);

  readonly users = this._users.asReadonly();
  readonly usersLoading = this._usersLoading.asReadonly();
  readonly usersError = this._usersError.asReadonly();

  readonly hasUsers = computed(() => this._users().length > 0);
  readonly usersState = computed<UsersListState>(() => ({
    users: this._users(),
    loading: this._usersLoading(),
    error: this._usersError(),
  }));

  /**
   * Load users by role ID
   */
  async loadUsers(roleId: number | null, transform?: (record: any) => User): Promise<void> {
    this._usersLoading.set(true);
    this._usersError.set(null);

    try {
      const users = await firstValueFrom(this.userService.fetchUsers(roleId));
      const transformedUsers = transform
        ? users.map(transform)
        : users.map((user: any) => ({ ...user, selected: false }));
      this._users.set(transformedUsers);
    } catch (error) {
      this._usersError.set(
        error instanceof Error ? error.message : 'Failed to load users'
      );
      this._users.set([]);
    } finally {
      this._usersLoading.set(false);
    }
  }

  /**
   * Set users directly (for external updates)
   */
  setUsers(users: User[]): void {
    this._users.set(users);
  }

  /**
   * Clear users
   */
  clearUsers(): void {
    this._users.set([]);
    this._usersError.set(null);
  }

  /**
   * Reset users state
   */
  resetUsers(): void {
    this._users.set([]);
    this._usersLoading.set(false);
    this._usersError.set(null);
  }
}

