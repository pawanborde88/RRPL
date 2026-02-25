import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AutoLogoutService } from '../services/auto-logout.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // skip login API call from interceptor
  if (req.url.includes('/login')) {
    return next(req);
  }

  const router = inject(Router);
  const token = sessionStorage.getItem('auth_token');
  const authRequest = token
    ? req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
    : req;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const autoLogoutService = inject(AutoLogoutService);
        autoLogoutService.executeLogout('Your session has expired or a login was detected from another device. For your security, please log in again.');
      }
      return throwError(() => error);
    })
  );
};
