import { Injectable } from '@angular/core';
import { BaseStore } from '../../../../Core/store/base-store';
import { Role, TreeNode, User } from './user.service';

export interface UserState {
    users: User[];
    roles: Role[];
    assignedUsers: TreeNode[];
}

const initialState: UserState = {
    users: [],
    roles: [],
    assignedUsers: [],
};

@Injectable({
    providedIn: 'root',
})
export class UserStore extends BaseStore<UserState> {
    constructor() {
        super(initialState);
    }

    // Selectors
    readonly users = this.select((state) => state.users);
    readonly roles = this.select((state) => state.roles);
    readonly assignedUsers = this.select((state) => state.assignedUsers);

    // Patch methods
    setUsers(users: User[]): void {
        this.patchState({ users });
    }

    setRoles(roles: Role[]): void {
        this.patchState({ roles });
    }

    setAssignedUsers(assignedUsers: TreeNode[]): void {
        this.patchState({ assignedUsers });
    }

    reset(): void {
        this.setState(initialState);
    }
}
