import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../environments/environment';
import { AppStore } from '../Core/store/app.store';
import { catchError, finalize, EMPTY, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export interface UserSessionData {
    user_id: string;
    account_id: string;
    role_id: string;
    user_email: string;
    username: string;
    first_name: string;
    last_name: string;
    account_display_name: string;
    profile_image: string;
    permissions: string;
    account_logo: string;
    product_display_name: string;
    partner_code: string;
    email: string;
    channel_partner_id: string;
    role_name: string;
    two_factor_enabled?: boolean;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    auth_token?: string;
    data?: UserSessionData;
    requiresOtp?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthFacade {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    private readonly appStore = inject(AppStore);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly baseUrl = environment.API_URL;

    // State Signals
    readonly isLoading = signal(false);
    readonly isLoadingOtp = signal(false);
    readonly showOtpForm = signal(false);
    readonly userEmail = signal('');

    // Selectors from AppStore
    readonly user = this.appStore.user;
    readonly isAuthenticated = this.appStore.isAuthenticated;

    login(credentials: any) {
        this.isLoading.set(true);
        return this.http.post<LoginResponse>(`${this.baseUrl}/login`, credentials).pipe(
            tap((res) => {
                if (res.success) {
                    this.userEmail.set(credentials.email);
                    this.showOtpForm.set(true);
                    this.showSuccess(res.message || 'OTP sent to email');
                } else {
                    this.showError(res.message || 'Login failed');
                }
            }),
            catchError((error) => {
                this.handleError(error);
                return EMPTY;
            }),
            finalize(() => this.isLoading.set(false))
        );
    }

    verifyOtp(email: string, otp: string) {
        if (this.isLoadingOtp()) return EMPTY;
        this.isLoadingOtp.set(true);
        return this.http.post<LoginResponse>(`${this.baseUrl}/verify_otp`, { email, otp }).pipe(
            tap((res) => {
                if (res.success) {
                    if (res.auth_token && isPlatformBrowser(this.platformId)) {
                        sessionStorage.setItem('auth_token', res.auth_token);
                    }
                    if (res.data) {
                        this.saveSessionData(res.data);
                        this.appStore.setUser(res.data);
                        if (res.data.permissions && typeof res.data.permissions === 'string') {
                            this.appStore.setPermissions(res.data.permissions.split(','));
                        }
                    }
                    this.showOtpForm.set(false);
                    this.showSuccess('Login successful');
                } else {
                    this.showError(res.message || 'Invalid OTP');
                }
            }),
            catchError((error) => {
                this.handleError(error);
                return EMPTY;
            }),
            finalize(() => this.isLoadingOtp.set(false))
        );
    }

    logout() {
        this.dialog.closeAll();
        if (isPlatformBrowser(this.platformId)) {
            sessionStorage.clear();
            localStorage.removeItem('rememberedUsername');
        }
        this.appStore.reset();
        this.router.navigate(['/login']);
    }

    private saveSessionData(data: UserSessionData) {
        if (!isPlatformBrowser(this.platformId)) return;
        const sessionItems: Record<string, string> = {
            session_id: data.user_id,
            account_id: data.account_id,
            role_id: data.role_id,
            user_email: data.user_email,
            username: data.username,
            user_full_name: `${data.first_name} ${data.last_name}`,
            account_display_name: data.account_display_name,
            profile_image: data.profile_image,
            permission: data.permissions,
            logo: data.account_logo,
            product_display_name: data.product_display_name,
            partner_id: data.partner_code,
            email: data.email,
            channel_partner_id: data.channel_partner_id,
            role_name: data.role_name,
            login_time: Date.now().toString(),
            two_factor_enabled: String(data.two_factor_enabled ?? false),
        };
        Object.entries(sessionItems).forEach(([key, value]) => sessionStorage.setItem(key, value));
    }

    private showSuccess(message: string) {
        this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
    }

    private showError(message: string) {
        this.snackBar.open(message, 'Close', { duration: 3000, panelClass: ['error-snackbar'] });
    }

    private handleError(error: HttpErrorResponse) {
        let message = 'An error occurred. Please try again.';
        if (error.status === 429) message = 'Too many attempts. Try again later.';
        else if (error.error?.message) message = error.error.message;
        this.showError(message);
    }
}
