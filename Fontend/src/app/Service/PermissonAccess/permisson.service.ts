import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppStore } from '../../Core/store/app.store';

@Injectable({
  providedIn: 'root'
})
export class PermissonService {
  private readonly http = inject(HttpClient);
  private readonly appStore = inject(AppStore);

  private readonly isLoaded = signal(false);
  private readonly baseUrl = environment.API_URL;

  loadOnce(): Observable<void> {
    if (this.isLoaded()) {
      return of(void 0);
    }

    const roleId = Number(sessionStorage.getItem('role_id'));
    if (!roleId) return of(void 0);

    return this.http
      .post<any[]>(`${this.baseUrl}/api/fetch_users_permissions`, { role_id: [roleId] })
      .pipe(
        tap(res => {
          const permissions = res.map((p: number) => String(p));
          this.appStore.setPermissions(permissions);
          this.isLoaded.set(true);
        }),
        map(() => void 0)
      );
  }

  hasPermission(code: string): boolean {
    return this.appStore.hasPermission(code);
  }

  reset(): void {
    this.isLoaded.set(false);
    this.appStore.setPermissions([]);
  }
}
