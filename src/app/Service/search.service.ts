import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // Use signal for reactive state management
  private readonly searchSignal = signal<string>('');
  
  // Expose as readonly signal
  readonly search = this.searchSignal.asReadonly();
  
  // Observable for RxJS compatibility
  readonly search$ = toObservable(this.search);

  updateSearch(searchTerm: string): void {
    this.searchSignal.set(searchTerm);
  }

  clearSearch(): void {
    this.searchSignal.set('');
  }
}
