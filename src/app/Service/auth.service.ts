import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly roleId = signal<number>(0);
  readonly userId = signal<number>(0);
  readonly roleData = signal<string>('');
  readonly permissionData = signal<string>('');

  constructor() {
    this.loadUserSession();
  }

  private loadUserSession(): void {
    if (typeof sessionStorage !== 'undefined') {
      this.roleId.set(Number(sessionStorage.getItem('role_id')) || 0);
      this.userId.set(Number(sessionStorage.getItem('session_id')) || 0);
      this.roleData.set(sessionStorage.getItem('role_id') || '');
      this.permissionData.set(sessionStorage.getItem('permission') || '');
    }
  }

  hasPermission(permission: string): boolean {
    return this.permissionData().includes(permission);
  }

  hasOnlyRoles(allowedRoles: number[]): boolean {
    const userRoles = this.roleData()
      .split(',')
      .map((role) => Number(role.trim()))
      .filter((role) => !isNaN(role));
    return userRoles.some((role) => allowedRoles.includes(role));
  }

}
