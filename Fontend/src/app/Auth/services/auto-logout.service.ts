import { inject, Injectable, NgZone, OnDestroy, effect } from '@angular/core';
import { AuthFacade } from '../auth.facade';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class AutoLogoutService implements OnDestroy {
    private readonly authFacade = inject(AuthFacade);
    private readonly ngZone = inject(NgZone);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly snackBar = inject(MatSnackBar);

    // 10 Seconds in milliseconds (for testing)
    // private readonly INACTIVITY_TIMEOUT = 10 * 1000;
    private readonly INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hour
    private timeoutId: any;

    // Throttle writing to localStorage for activity tracking across tabs
    private lastActivityWrite = 0;

    // Channel for cross-tab communication
    private readonly authChannel = new BroadcastChannel('auth_channel');

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            this.initListener();
            this.initCrossTabListener();

            // Reactively start or stop the inactivity timer based on login status
            effect(() => {
                const isAuth = this.authFacade.isAuthenticated();
                if (isAuth) {
                    // Start the timer immediately when they log in
                    this.ngZone.runOutsideAngular(() => {
                        this.resetTimer();
                    });
                } else {
                    // Clear the timer completely when they log out
                    if (this.timeoutId) {
                        clearTimeout(this.timeoutId);
                        this.timeoutId = null;
                        localStorage.removeItem('last_activity');
                    }
                }
            });
        }
    }

    // SCENARIO 1: No activity 15 min -> Auto logout
    private initListener() {
        this.ngZone.runOutsideAngular(() => {
            const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

            events.forEach((event) => {
                window.addEventListener(event, () => this.resetTimer(), { passive: true });
            });

            this.resetTimer();
        });
    }

    private resetTimer() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Only track inactivity if the user is currently authenticated.
        // We use untracked here implicitly because this is mostly called from DOM events.
        if (this.authFacade.isAuthenticated()) {

            const now = Date.now();
            if (isPlatformBrowser(this.platformId) && now - this.lastActivityWrite > 1000) {
                // Throttle the localStorage writes to max once per second
                localStorage.setItem('last_activity', now.toString());
                this.lastActivityWrite = now;
            }

            // Set new timer
            this.timeoutId = setTimeout(() => {
                this.ngZone.run(() => {
                    if (this.authFacade.isAuthenticated()) {
                        const lastActivityStr = localStorage.getItem('last_activity');
                        const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : 0;
                        const currentTime = Date.now();

                        // Check if another tab has updated the last_activity recently
                        // using a slight threshold (1000ms) to avoid precise race conditions
                        if (currentTime - lastActivity >= this.INACTIVITY_TIMEOUT - 1000) {
                            this.executeLogout('Session expired due to inactivity');
                        } else {
                            // If active in another tab, just restart the local timer
                            this.resetTimer();
                        }
                    }
                });
            }, this.INACTIVITY_TIMEOUT);
        }
    }

    // SCENARIO 4: Logout in one tab -> All tabs logout
    private initCrossTabListener() {
        this.authChannel.onmessage = (event) => {
            if (event.data === 'LOGOUT_TRIGGERED') {
                this.ngZone.run(() => {
                    this.authFacade.logout(); // No broadcast to prevent infinite loop
                });
            }
        };
    }

    // Broadcasts logout to other tabs and performs local logout
    public executeLogout(reason?: string) {
        this.authChannel.postMessage('LOGOUT_TRIGGERED');
        if (reason) {
            this.snackBar.open(reason, 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar']
            });
        }
        this.authFacade.logout();
    }

    ngOnDestroy() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.authChannel.close();
    }
}
