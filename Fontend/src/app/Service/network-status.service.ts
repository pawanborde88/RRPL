import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { interval, Subscription, from } from 'rxjs';
import { mapTo } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  /** Emits true when the app is online and false when offline */
  private _online$ = new BehaviorSubject<boolean>(navigator.onLine);
  onlineStatus$: Observable<boolean> = this._online$.asObservable();

  /** Emits true when connection is considered weak (slow-2g / 2g / 3g or downlink < 1Mbps) */
  private _weakConnection$ = new BehaviorSubject<boolean>(false);
  weakConnection$: Observable<boolean> = this._weakConnection$.asObservable();

  /** Emits true when connection is considered VERY weak (slow-2g or downlink < 0.3 Mbps) */
  private _veryWeakConnection$ = new BehaviorSubject<boolean>(false);
  veryWeakConnection$: Observable<boolean> = this._veryWeakConnection$.asObservable();

  private _speedCheckSub?: Subscription;

  constructor() {
    // Listen for online / offline browser events
    const online$ = fromEvent(window, 'online').pipe(mapTo(true));
    const offline$ = fromEvent(window, 'offline').pipe(mapTo(false));

    merge(online$, offline$).subscribe((isOnline) => this._online$.next(isOnline));

    // Listen for connection quality changes when the Network Information API is available
    // This API is not supported in all browsers, so we guard its usage.
    const nav = navigator as any;
    if (nav && nav.connection) {
      const connection = nav.connection;

      const evaluateConnection = () => {
        const effectiveType: string = connection.effectiveType || '';
        const downlink: number = connection.downlink || 0;
        const isVeryWeak = effectiveType === 'slow-2g' || downlink < 0.3;
        const isWeak = isVeryWeak || ['2g', '3g'].includes(effectiveType) || downlink < 1;

        this._weakConnection$.next(isWeak);
        this._veryWeakConnection$.next(isVeryWeak);
      };

      // Initial evaluation
      evaluateConnection();

      // React to further changes
      connection.addEventListener('change', evaluateConnection);

    } else {
      // Fallback: active latency measurement every 15s when online
      const checkSpeed = () => {
        if (!navigator.onLine) {
          // Mark offline if necessary (the offline/online event will also handle this)
          return;
        }
        const start = performance.now();
        // Use HEAD request to current origin to avoid CORS issues; cache disabled.
        from(fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' })).subscribe({
          next: () => {
            const latency = performance.now() - start;
            const isVeryWeak = latency > 5000; // >5s to respond
            const isWeak = isVeryWeak || latency > 2000; // >2s to respond

            this._weakConnection$.next(isWeak);
            this._veryWeakConnection$.next(isVeryWeak);
          },
          error: () => {
            // If the request fails, treat it as offline or very weak
            this._weakConnection$.next(true);
            this._veryWeakConnection$.next(true);
          }
        });
      };

      // Start periodic check
      this._speedCheckSub = interval(15000).subscribe(checkSpeed);
      // Immediate first check
      checkSpeed();
    }
  }
} 