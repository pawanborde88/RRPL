import { Injectable, signal, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { BookingService } from '../../../../../../Service/booking.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, shareReplay } from 'rxjs';
import { of } from 'rxjs';

/**
 * State interface for booking calculations
 */
export interface BookingCalculationsState {
  wings: Array<{ wing_id: number; wing_name: string }>;
  floors: Array<{ floor_id: number; floor_name: string }>;
  unitTypes: Array<{ unit_type: string }>;
  floorUnits: Array<{ floor_unit_id: number; floor_unit: string }>;
  sources: Array<{ source_id: number; source: string }>;
  sourceDetails: Array<{ source_detail_id: number; source_detail: string }>;
  channelPartners: Array<{ channel_partner_id: number; firm_name: string; cp_owner: string; full_name?: string }>;
  basedOns: Array<{ based_on_id: number; based_on: string }>;
  parkingTypes: Array<{ parking_type_id: number; parking_type: string }>;
  bookingInfo: any | null;
  agreementPercentage: { sd_percentage: number } | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * High-performance state service for booking calculations
 * Uses signals for reactive state management following Angular 17+ best practices
 */
@Injectable()
export class BookingCalculationsStateService {
  private readonly bookingService = inject(BookingService);
  private readonly snackBar = inject(MatSnackBar);

  // Private state signals
  private readonly _wings = signal<Array<{ wing_id: number; wing_name: string }>>([]);
  private readonly _allprojectPeoples = signal<Array<{ user_id: number; user_name: string }>>([]);
  private readonly _floors = signal<Array<{ floor_id: number; floor_name: string }>>([]);
  private readonly _unitTypes = signal<Array<{ unit_type: string }>>([]);
  private readonly _floorUnits = signal<Array<{ floor_unit_id: number; floor_unit: string }>>([]);
  private readonly _sources = signal<Array<{ source_id: number; source: string }>>([]);
  private readonly _sourceDetails = signal<Array<{ source_detail_id: number; source_detail: string }>>([]);
  private readonly _channelPartners = signal<Array<{ channel_partner_id: number; firm_name: string; cp_owner: string; full_name?: string }>>([]);
  private readonly _basedOns = signal<Array<{ based_on_id: number; based_on: string }>>([]);
  private readonly _parkingTypes = signal<Array<{ parking_type_id: number; parking_type: string }>>([]);
  private readonly _bookingInfo = signal<any | null>(null);
  private readonly _agreementPercentage = signal<{ sd_percentage: number } | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _floorUnitField = signal<boolean>(true);
  private readonly _salesExecutives = signal<Array<{ user_id: number; user_name: string }>>([]);
  private readonly _tokenTypes = signal<Array<{ token_type_id: number; token_type: string }>>([]);
  private readonly _tokens = signal<Array<{ token_id: number; full_name: string; mob_no?: string; mobile_no?: string }>>([]);
  private readonly _bookingFroms = signal<Array<{ booking_from_id: number; booking_from: string }>>([]);
  private readonly _projects = signal<Array<{ project_id: number; project_name: string }>>([]);

  // Public readonly signals
  readonly wings = this._wings.asReadonly();
  readonly allprojectPeoples = this._allprojectPeoples.asReadonly();
  readonly floors = this._floors.asReadonly();
  readonly unitTypes = this._unitTypes.asReadonly();
  readonly floorUnits = this._floorUnits.asReadonly();
  readonly sources = this._sources.asReadonly();
  readonly sourceDetails = this._sourceDetails.asReadonly();
  readonly channelPartners = this._channelPartners.asReadonly();
  readonly basedOns = this._basedOns.asReadonly();
  readonly parkingTypes = this._parkingTypes.asReadonly();
  readonly bookingInfo = this._bookingInfo.asReadonly();
  readonly agreementPercentage = this._agreementPercentage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly floorUnitField = this._floorUnitField.asReadonly();
  readonly salesExecutives = this._salesExecutives.asReadonly();
  readonly tokenTypes = this._tokenTypes.asReadonly();
  readonly tokens = this._tokens.asReadonly();
  readonly bookingFroms = this._bookingFroms.asReadonly();
  readonly projects = this._projects.asReadonly();

  // Computed signals
  readonly hasWings = computed(() => this._wings().length > 0);
  readonly hasFloors = computed(() => this._floors().length > 0);
  readonly hasUnitTypes = computed(() => this._unitTypes().length > 0);
  readonly hasFloorUnits = computed(() => this._floorUnits().length > 0);
  readonly hasSourceDetails = computed(() => this._sourceDetails().length > 0);
  readonly hasChannelPartners = computed(() => this._channelPartners().length > 0);
  readonly hasSalesExecutives = computed(() => this._salesExecutives().length > 0);
  readonly hasTokenTypes = computed(() => this._tokenTypes().length > 0);
  readonly hasTokens = computed(() => this._tokens().length > 0);

  // Observable streams for RxJS compatibility
  readonly wings$ = toObservable(this.wings);
  readonly projects$ = toObservable(this.projects);
  readonly floors$ = toObservable(this.floors);
  readonly unitTypes$ = toObservable(this.unitTypes);
  readonly floorUnits$ = toObservable(this.floorUnits);
  readonly sources$ = toObservable(this.sources);
  readonly sourceDetails$ = toObservable(this.sourceDetails);
  readonly channelPartners$ = toObservable(this.channelPartners);
  readonly basedOns$ = toObservable(this.basedOns);
  readonly isLoading$ = toObservable(this.isLoading);

  // Cached observables for performance
  private sourcesCache$ = this.bookingService.fetchSources().pipe(
    shareReplay(1),
    catchError(() => of([]))
  );

  private basedOnsCache$ = this.bookingService.fetchBasedOns().pipe(
    shareReplay(1),
    catchError(() => of([]))
  );

  /**
   * Load initial data for booking calculations
   */
  loadInitialData(projectId: number, bookingId: number): void {
    this._isLoading.set(true);
    this._error.set(null);

    // Load booking info and related data in parallel
    this.fetchSingleBooking(bookingId);
    this.fetchAllWings(projectId);
    this.fetchSourcesList();
  }

  /**
   * Fetch single booking details
   */
  fetchSingleBooking(bookingId: number): void {
    this._isLoading.set(true);
    this.bookingService.fetchSingleBooking(bookingId)
      .pipe(
        finalize(() => this._isLoading.set(false)),
        catchError((err) => {
          this._error.set('Unable to fetch booking details.');
          this.snackBar.open('Unable to fetch booking details.', 'Close', { duration: 3000 });
          return of({ success: false, data: null });
        })
      )
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this._bookingInfo.set(res.data);
          }
        }
      });
  }

  /**
   * Get booking info for enquiry fetching
   */
  getBookingInfo(): any | null {
    return this._bookingInfo();
  }

  /**
   * Fetch all wings for a project
   */
  fetchAllWings(projectId: number | string): void {
    this.bookingService.fetchWings(projectId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch project details.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (wings: Array<{ wing_id: number; wing_name: string }>) => {
          this._wings.set(wings);
        }
      });
  }

  fetchAssignedProjects(projectId: number | string): void {
    this.bookingService.fetchAssignedProjects(projectId)
      .pipe(
        catchError((error) => {
          console.error('Error fetching assigned projects:', error);
          this.snackBar.open('Unable to fetch assigned projects.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (response) => {
          if (response.length && 'user_id' in response[0]) {
            // ✅ It's user array
            this._allprojectPeoples.set(response as { user_id: number; user_name: string }[]);
          } else {
            // ❌ It's project array (ignore or handle separately)
            console.warn('Received project list instead of users:', response);
            this._allprojectPeoples.set([]);
          }
        }
      });
  }

  /**
   * Fetch floors for a project and wing
   */
  fetchFloors(projectId: number | string, wingId: number | string): void {
    this.bookingService.fetchFloors(projectId, wingId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch floors.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (floors: Array<{ floor_id: number; floor_name: string }>) => {
          this._floors.set(floors);
        }
      });
  }

  /**
   * Fetch unit types for a project, wing, and floor
   */
  fetchUnitTypes(projectId: number | string, wingId: number | string, floorId: number | string): void {
    this.bookingService.fetchUnitTypes(projectId, wingId, floorId)
      .pipe(
        catchError(() => of({ data: [] }))
      )
      .subscribe({
        next: (res: any) => {
          this._unitTypes.set(res.data || []);
        }
      });
  }

  /**
   * Fetch floor units for a project, wing, floor, and unit type
   */
  fetchFloorUnits(
    projectId: number | string,
    wingId: number | string,
    floorId: number | string,
    unitType: string
  ): void {
    this.bookingService.fetchTokenFloorUnits(projectId, wingId, floorId, unitType)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch floor units.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (units: Array<{ floor_unit_id: number; floor_unit: string }>) => {
          this._floorUnits.set(units);
        }
      });
  }

  /**
   * Fetch sources list (cached)
   */
  fetchSourcesList(): void {
    this.sourcesCache$.subscribe({
      next: (sources: Array<{ source_id: number; source: string }>) => {
        this._sources.set(sources);
      }
    });
  }

  /**
   * Fetch source details
   */
  fetchSourceDetails(sourceId: number | string): void {
    this.bookingService.fetchSourceDetails(sourceId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch source details.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (details: Array<{ source_detail_id: number; source_detail: string }>) => {
          this._sourceDetails.set(details);
        }
      });
  }

  /**
   * Fetch channel partners with search
   */
  fetchChannelPartners(searchText?: string, channelPartnerId?: number): void {
    this.bookingService.fetchChannelPartners(searchText, channelPartnerId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch partners.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (partners: Array<{ channel_partner_id: number; firm_name: string; cp_owner: string; full_name?: string }>) => {
          this._channelPartners.set(partners);
        }
      });
  }


  /**
   * Fetch agreement percentage
   */
  fetchAgreementPercentage(bookingId: number): void {
    this.bookingService.fetchAgreementPercentage(bookingId)
      .pipe(
        catchError(() => of({ success: false, sd_percentage: 0 }))
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this._agreementPercentage.set({ sd_percentage: response.sd_percentage });
          }
        }
      });
  }

  /**
   * Reset dependent dropdowns when parent selection changes
   */
  resetFloors(): void {
    this._floors.set([]);
  }

  resetUnitTypes(): void {
    this._unitTypes.set([]);
  }

  resetFloorUnits(): void {
    this._floorUnits.set([]);
  }

  /**
   * Set floor unit field visibility
   */
  setFloorUnitField(visible: boolean): void {
    this._floorUnitField.set(visible);
  }

  /**
   * Fetch sales executives for a project
   */
  fetchSalesExecutives(projectId: number | string): void {
    this.bookingService.fetchSalesExecutives(projectId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch sales executives.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (executives: Array<{ user_id: number; user_name: string }>) => {
          this._salesExecutives.set(executives);
        }
      });
  }

  /**
   * Fetch token types for a project
   */
  fetchTokenTypes(projectId: number | string): void {
    this.bookingService.fetchTokenTypes(projectId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch token types.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (types: Array<{ token_type_id: number; token_type: string }>) => {
          this._tokenTypes.set(types);
        }
      });
  }

  /**
   * Fetch tokens for a project and token type
   */
  fetchTokens(projectId: number | string, tokenTypeId: number | string): void {
    this.bookingService.fetchTokens(projectId, tokenTypeId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch tokens.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (tokens: Array<{ token_id: number; full_name: string; mob_no?: string; mobile_no?: string }>) => {
          this._tokens.set(tokens);
        }
      });
  }

  /**
   * Fetch booking from dropdown
   */
  fetchBookingFroms(): void {
    this.bookingService.fetchBookingFromDropdown()
      .pipe(
        catchError(() => of([]))
      )
      .subscribe({
        next: (froms: Array<{ booking_from_id: number; booking_from: string }>) => {
          this._bookingFroms.set(froms);
        }
      });
  }

  /**
   * Fetch projects for a user
   */
  fetchProjects(userId: number): void {
    this.bookingService.fetchProjects(userId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch projects.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe({
        next: (projects: Array<{ project_id: number; project_name: string }>) => {
          this._projects.set(projects);
        }
      });
  }

  /**
   * Fetch parking types for a project
   */
  fetchParkingTypes(projectId: number | string): void {
    this.bookingService.fetchParkingTypes(projectId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch parking types.', 'Close', { duration: 3000 });
          return of({ data: [] });
        })
      )
      .subscribe({
        next: (res: any) => {
          this._parkingTypes.set(res.data || []);
        }
      });
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this._wings.set([]);
    this._floors.set([]);
    this._unitTypes.set([]);
    this._floorUnits.set([]);
    this._sourceDetails.set([]);
    this._channelPartners.set([]);
    this._bookingInfo.set(null);
    this._agreementPercentage.set(null);
    this._error.set(null);
    this._salesExecutives.set([]);
    this._tokenTypes.set([]);
    this._tokens.set([]);
    this._bookingFroms.set([]);
    this._projects.set([]);
    this._parkingTypes.set([]);
  }
}
