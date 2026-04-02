import { Injectable, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private readonly STORAGE_KEY = 'sidebarState';
  
  // Use signal for reactive state management
  private readonly sidebarStateSignal = signal<boolean>(this.getInitialState());
  
  // Expose as readonly signal
  readonly sidebarState = this.sidebarStateSignal.asReadonly();
  
  // Observable for RxJS compatibility
  readonly sidebarState$ = toObservable(this.sidebarState);

  constructor() {
    // Listen to storage changes from other tabs/windows
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
  }

  private getInitialState(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored !== 'false';
    } catch (error) {
      console.warn('Failed to read sidebar state from localStorage:', error);
      return true; // Default to open
    }
  }

  private handleStorageChange(event: StorageEvent): void {
    if (event.key === this.STORAGE_KEY) {
      const newState = event.newValue !== 'false';
      this.sidebarStateSignal.set(newState);
    }
  }

  getSidebarState(): boolean {
    return this.sidebarStateSignal();
  }

  toggleSidebarState(): void {
    const newState = !this.sidebarStateSignal();
    this.setSidebarState(newState);
  }

  setSidebarState(state: boolean): void {
    this.sidebarStateSignal.set(state);
    try {
      localStorage.setItem(this.STORAGE_KEY, String(state));
    } catch (error) {
      console.warn('Failed to save sidebar state to localStorage:', error);
    }
  }
}
