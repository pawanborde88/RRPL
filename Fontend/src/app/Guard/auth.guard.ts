import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (isPlatformBrowser(this.platformId)) {
      if (sessionStorage.getItem('session_id')) {
        return true;
      } else {
        this.router.navigate(['/login']);
        return false;
      }
    }
    
    // On server, we allow the route to proceed, 
    // or you could implement a different logic if needed.
    return true;
  }
}
