import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  effect,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';





import { combineLatest, filter, distinctUntilChanged, take, merge, map, startWith } from 'rxjs';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';
import { BookingCalculationsStateService } from '../booking-calculations/services/booking-calculations.state.service';
import { BookingService } from '../../../../../Service/booking.service';

/**
 * High-performance Edit Booking Page Component
 * 
 * Features:
 * - Standalone component with optimized imports
 * - Signals for reactive state management
 * - OnPush change detection
 * - Optimized RxJS subscriptions with combineLatest
 * - Clean dependency injection using inject()
 * - Centralized state management via state service
 * - Production-ready error handling
 */
@Component({
  selector: 'app-edit-booking-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    AutocompleteReusableComponent,



    AmountDirective,
  ],
  providers: [BookingCalculationsStateService],
  templateUrl: './edit-booking-page.component.html',
  styleUrl: './edit-booking-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditBookingPageComponent {
  // ⚡ Dependency Injection
  private readonly bookingService = inject(BookingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  public readonly dialogRef = inject(MatDialogRef<EditBookingPageComponent>);
  public readonly data = inject(MAT_DIALOG_DATA);
  private readonly stateService = inject(BookingCalculationsStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // ⚡ User context (immutable after initialization)
  readonly userId = Number(sessionStorage.getItem('session_id') || '0');
  readonly roleId = Number(sessionStorage.getItem('role_id') || '0');

  // ⚡ Local state
  private readonly calculationsDisabled = signal<boolean>(false);
  private readonly bookingId = signal<string | null>(null);
  private readonly bookingData = signal<any>(null);
  private readonly roleBasedLogicApplied = signal<boolean>(false);
  private isPatchingFromBooking = false;

  // ⚡ Date constraints
  readonly minDate: Date | null = null; // Allow past dates for editing existing bookings
  readonly maxDate = computed(() => {
    if (this.roleId === 2) return null; // No max date constraint for admin
    const date = new Date();
    date.setDate(date.getDate() + 30); // Allow dates up to 30 days in the future
    return date;
  });

  // ⚡ Expose state service signals
  readonly floorUnitField = this.stateService.floorUnitField;
  readonly sourcesList = this.stateService.sources;

  // ⚡ Computed property for source fields disabled state
  readonly isSourceFieldsDisabled = computed(() => this.roleId !== 2);
  readonly confiList = this.stateService.unitTypes;
  readonly allChannelPartnerList = this.stateService.channelPartners;
  readonly bookingInfo = this.stateService.bookingInfo;
  readonly allWingslist = this.stateService.wings;
  readonly FloorUnitDropdown = this.stateService.floors;
  readonly UnitNo = this.stateService.floorUnits;
  readonly sourceDetailedList = this.stateService.sourceDetails;
  readonly isLoading = this.stateService.isLoading;
  readonly allSalesExecutive = this.stateService.salesExecutives;
  readonly allTokenType = this.stateService.tokenTypes;
  readonly allTokenNolist = this.stateService.tokens;
  readonly allBookingDropdown = this.stateService.bookingFroms;
  readonly allParkingTypeList = this.stateService.parkingTypes;
  readonly projectsList = this.stateService.projects;

  // ⚡ Computed values
  readonly isBookingDateEnabled = computed(() => this.roleId === 2);

  // ⚡ Form Group
  readonly addBookingForm = new FormGroup({
    user_id: new FormControl(this.userId),
    project_id: new FormControl(''),
    token_type_id: new FormControl(''),
    sales_executive_id: new FormControl('', Validators.required),
    floor_unit_id: new FormControl('', Validators.required),
    booking_date: new FormControl('', Validators.required),
    project_enq_id: new FormControl(),
    booking_from_id: new FormControl(),
    token_id: new FormControl(''),
    package_total_with_parking: new FormControl(''),
    unit_type: new FormControl('', Validators.required),
    booking_amount: new FormControl(''),
    source_id: new FormControl('', Validators.required),
    source_detail_id: new FormControl(),
    source_executive_id: new FormControl(''),
    channel_partner_id: new FormControl(),
    remark: new FormControl(''),
    wing_id: new FormControl('', Validators.required),
    floor_id: new FormControl(''),
    floor_unit: new FormControl(''),
    unit_type_id: new FormControl(),
    unit_no: new FormControl(),
    unit_id: new FormControl(),
    carpet: new FormControl(0, Validators.required),
    applicant_name: new FormControl(),
    scheme_per: new FormControl(''),
    source_description: new FormControl(''),
    tax_id: new FormControl(''),
    rate: new FormControl(''),
    floor_rise_rate: new FormControl(''),
    floor_rise_amt: new FormControl('', Validators.required),
    market_value: new FormControl(''),
    parking_charges: new FormControl(''),
    gst_per: new FormControl(5, Validators.required),
    sd_per: new FormControl(7, Validators.required),
    reg_per: new FormControl(1, Validators.required),
    basic_cost: new FormControl(),
    idc: new FormControl(0, Validators.required),
    agreement_cost: new FormControl(''),
    gst: new FormControl(),
    stamp_duty: new FormControl(),
    parking_type_id: new FormControl(''),
    parking_no: new FormControl(''),
    charges: new FormControl(''),
    reg: new FormControl('', Validators.required),
    society_for: new FormControl('', Validators.required),
    legal: new FormControl('', Validators.required),
    maintenance: new FormControl('', Validators.required),
    corpus: new FormControl('', Validators.required),
    other: new FormControl('', Validators.required),
    package_total: new FormControl(),
    enter_package: new FormControl(''),
    offer_name: new FormControl(''),
    created_by: new FormControl(''),
    booking_id: new FormControl(''),
    updated_by: new FormControl(this.userId),
    show_scheme: new FormControl(false),
    is_parking_charges_added: new FormControl(false),
  });

  // ⚡ Reactive form validation state - tracks both status and value changes for better reactivity
  private readonly formValid = toSignal(
    merge(
      this.addBookingForm.statusChanges,
      this.addBookingForm.valueChanges
    ).pipe(
      map(() => this.addBookingForm.valid),
      distinctUntilChanged(),

    ),

  );

  // ⚡ Computed signal for submit button state
  readonly canSubmit = computed(() => this.formValid() ?? false);

  constructor() {
    this.setupFormCalculations();
    this.initializeComponent();
    this.setupReactiveControlStates();
  }

  /**
   * Initialize reactive states for form controls based on signals
   */
  private setupReactiveControlStates(): void {
    const { hasFloors, hasUnitTypes, hasFloorUnits } = this.stateService;

    // Reactively manage dropdown enabled/disabled states based on data availability
    effect(() => {
      const floorControl = this.addBookingForm.get('floor_id');
      if (floorControl) {
        hasFloors() ? floorControl.enable({ emitEvent: false }) : floorControl.disable({ emitEvent: false });
      }

      const unitTypeControl = this.addBookingForm.get('unit_type');
      if (unitTypeControl) {
        hasUnitTypes() ? unitTypeControl.enable({ emitEvent: false }) : unitTypeControl.disable({ emitEvent: false });
      }

      const floorUnitControl = this.addBookingForm.get('floor_unit_id');
      if (floorUnitControl) {
        hasFloorUnits() ? floorUnitControl.enable({ emitEvent: false }) : floorUnitControl.disable({ emitEvent: false });
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Initialize component data
   */
  private initializeComponent(): void {
    const rowData = this.data?.rowData;
    if (!rowData?.booking_id) return;

    this.bookingId.set(rowData.booking_id);
    this.bookingData.set(rowData);

    // Initialize role-based field state
    this.handleSourceFieldsBasedOnRole();

    // Load initial data
    this.loadInitialData(rowData);
  }

  /**
   * Load initial data for editing
   */
  private loadInitialData(rowData: any): void {
    const projectId = rowData.project_id;
    const bookingId = rowData.booking_id;

    // Load all dropdowns in parallel
    this.stateService.fetchAllWings(projectId);
    this.stateService.fetchSourcesList();
    this.stateService.fetchBookingFroms();
    this.stateService.fetchTokenTypes(projectId);
    this.stateService.fetchParkingTypes(projectId);
    this.stateService.fetchSalesExecutives(projectId);
    this.stateService.fetchProjects(this.userId);

    // Load token list if token_type_id exists
    if (rowData.token_type_id) {
      this.stateService.fetchTokens(projectId, rowData.token_type_id);
    }

    // Fetch booking details
    this.fetchSingleBooking(bookingId);

    // Disable fields that shouldn't be editable
    this.disableReadOnlyFields();

    // Setup reactive form control subscriptions
    this.setupFormControlSubscriptions();
  }

  /**
   * Disable read-only fields
   */
  private disableReadOnlyFields(): void {
    this.addBookingForm.get('project_id')?.disable();
    this.addBookingForm.get('token_id')?.disable();
    this.addBookingForm.get('project_enq_id')?.disable();
    this.addBookingForm.get('booking_from_id')?.disable();
    this.addBookingForm.get('applicant_name')?.disable();
    this.addBookingForm.get('token_type_id')?.disable();

    // Disable sales_executive_id for non-admin roles
    if (this.roleId !== 2) {
      this.addBookingForm.get('sales_executive_id')?.disable();
    }

    // Handle booking_date field based on role
    if (!this.isBookingDateEnabled()) {
      this.addBookingForm.get('booking_date')?.disable();
    }

    // Disable calculation fields that should be read-only (matching BookingCalculationsComponent)
    // Note: Required fields (carpet, floor_rise_amt, reg) are readonly in HTML but NOT disabled
    // so they can still be validated
    this.addBookingForm.get('basic_cost')?.disable();
    this.addBookingForm.get('gst')?.disable();
    this.addBookingForm.get('stamp_duty')?.disable();
    this.addBookingForm.get('package_total')?.disable();
    this.addBookingForm.get('package_total_with_parking')?.disable();
    this.addBookingForm.get('unit_id')?.disable();
  }

  /**
   * Setup optimized form control subscriptions using combineLatest
   */
  private setupFormControlSubscriptions(): void {
    const bookingData = this.bookingData();
    if (!bookingData?.project_id) return;

    const projectId = bookingData.project_id;
    const initialWingId = this.addBookingForm.get('wing_id')?.value;

    // Wing selection -> Fetch floors
    this.addBookingForm
      .get('wing_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((wingId): wingId is string => !!wingId)
      )
      .subscribe((wingID) => {
        if (wingID !== initialWingId) {
          this.stateService.setFloorUnitField(true);
          // Emit event true allows dependent subscriptions to react (clearing themselves)
          this.addBookingForm.patchValue({
            floor_id: null,
            unit_type: null,
            floor_unit_id: null,
            unit_type_id: null
          });
        }
        this.stateService.fetchFloors(projectId, wingID);
        this.resetUnitDetails();
      });

    // Floor selection -> Fetch unit types
    this.addBookingForm
      .get('floor_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((floorId): floorId is string => !!floorId)
      )
      .subscribe((floorId) => {
        const wingId = this.addBookingForm.get('wing_id')?.value;
        if (!wingId) return;

        // Reset unit type and unit no when floor changes
        this.addBookingForm.patchValue({
          unit_type: null,
          floor_unit_id: null,
          unit_type_id: null
        });

        this.stateService.fetchUnitTypes(projectId, wingId, floorId);
        this.resetUnitDetails();
      });

    // Unit Type selection -> Fetch floor units
    this.addBookingForm
      .get('unit_type')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((unitType): unitType is string => !!unitType)
      )
      .subscribe((unitType) => {
        const wingId = this.addBookingForm.get('wing_id')?.value;
        const floorId = this.addBookingForm.get('floor_id')?.value;

        if (!wingId || !floorId) return;

        // Reset floor unit when unit type changes
        this.addBookingForm.patchValue({
          floor_unit_id: null
        });

        this.stateService.setFloorUnitField(true);
        this.stateService.fetchFloorUnits(projectId, wingId, floorId, unitType);
      });

    // Unit type cleared -> Reset to input field
    this.addBookingForm
      .get('unit_type')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((unitType) => !unitType)
      )
      .subscribe(() => {
        this.stateService.setFloorUnitField(true);
        this.addBookingForm.get('floor_unit_id')?.setValue(null);
      });

    // Source selection -> Fetch source details
    this.addBookingForm
      .get('source_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((sourceId): sourceId is string => sourceId !== null && sourceId !== undefined)
      )
      .subscribe((sourceID) => {
        this.stateService.fetchSourceDetails(sourceID);
      });
  }

  /**
   * Update source validators dynamically
   */
  private updateSourceValidators(sourceId: any): void {
    const sourceControl = this.addBookingForm.get('source_id');
    const sourceDetailControl = this.addBookingForm.get('source_detail_id');
    const channelPartnerControl = this.addBookingForm.get('channel_partner_id');

    // Bail out if controls are disabled (read-only mode)
    if (sourceControl?.disabled && sourceDetailControl?.disabled && channelPartnerControl?.disabled) {
      return;
    }

    // Only apply source-specific validators if role is not 2 (admin)
    if (this.roleId === 2) {
      return;
    }

    // Clear existing validators
    channelPartnerControl?.clearValidators();
    sourceDetailControl?.clearValidators();

    const hasSourceSelection = sourceId !== null && sourceId !== undefined && sourceId !== '';
    if (!hasSourceSelection) {
      channelPartnerControl?.updateValueAndValidity();
      sourceDetailControl?.updateValueAndValidity();
      return;
    }

    const isChannelPartnerSource = String(sourceId) === '3';

    if (isChannelPartnerSource) {
      channelPartnerControl?.setValidators([Validators.required]);
    } else {
      sourceDetailControl?.setValidators([Validators.required]);
    }

    channelPartnerControl?.updateValueAndValidity();
    sourceDetailControl?.updateValueAndValidity();
  }

  /**
   * Handle unit type change and fetch floor unit details
   */
  onUniTypeChange(event: any): void {
    const floor_unit_id = event.value;
    if (!floor_unit_id) return;

    this.bookingService
      .fetchSingleFloorUnit(floor_unit_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.calculationsDisabled.set(true);

            const patchData = {
              carpet: res.total_carpet_area_sqft || null,
              rate: res.rate || null,
              market_value: res.market_value || null,
              idc: res.idc || null,
              stamp_duty: res.stamp_duty || null,
              gst_per: res.gst_percent || null,
              reg_per: res.registration_percent || null,
              reg: res.registration || null,
              society_for: res.society_formation_charges || null,
              legal: res.legal_charges || null,
              maintenance: res.maintenance_charges || null,
              floor_rise_rate: res.floor_rise_amount || null,
              corpus: res.corpus_fund || null,
              other: res.other_charges || null,
              unit_id: res.unit_id,
              package_total: res.package_total || null,
              package_total_with_parking: res.package_total_with_parking || null,
              parking_charges: res.parking_charges || null,
            };
            this.addBookingForm.patchValue(patchData, { emitEvent: false });
            this.calculationsDisabled.set(false);
            this.triggerCalculations();
          }
        },
        error: () => {
          this.snackBar.open('Unable to fetch unit details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  /**
   * Fetch single booking and populate form
   */
  private fetchSingleBooking(bookingID: any): void {
    this.bookingService
      .fetchSingleBooking(bookingID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.stateService.setFloorUnitField(true);
            const bookingData = res.data;

            // Patch form values with all booking data from response
            // Ensure floor_unit_id and source fields are correctly typed (number) for mat-select binding
            const patchFloorUnitId = (bookingData.floor_unit_id != null && bookingData.floor_unit_id !== '')
              ? Number(bookingData.floor_unit_id) : null;

            // Convert source fields to proper types - remove all conditions, always patch
            const patchSourceId = (bookingData.source_id != null && bookingData.source_id !== '')
              ? Number(bookingData.source_id) : null;
            const patchSourceDetailId = (bookingData.source_detail_id != null && bookingData.source_detail_id !== '')
              ? Number(bookingData.source_detail_id) : null;
            const patchChannelPartnerId = (bookingData.channel_partner_id != null && bookingData.channel_partner_id !== '')
              ? Number(bookingData.channel_partner_id) : null;

            // Set flag to prevent enquiry from overwriting booking data
            this.isPatchingFromBooking = true;

            // Temporarily enable source fields to ensure patching works correctly
            const sourceControl = this.addBookingForm.get('source_id');
            const sourceDetailControl = this.addBookingForm.get('source_detail_id');
            const channelPartnerControl = this.addBookingForm.get('channel_partner_id');

            sourceControl?.enable({ emitEvent: false });
            sourceDetailControl?.enable({ emitEvent: false });
            channelPartnerControl?.enable({ emitEvent: false });

            // Patch all form values including source fields
            this.addBookingForm.patchValue({
              user_id: bookingData.user_id ?? this.userId,
              booking_id: bookingData.booking_id ?? null,
              project_id: bookingData.project_id ?? null,
              booking_date: bookingData.booking_date ?? null,
              sales_executive_id: bookingData.sales_executive_id ?? null,
              booking_from_id: bookingData.booking_from_id ?? null,
              token_type_id: bookingData.token_type_id ?? null,
              token_id: bookingData.token_id ?? null,
              project_enq_id: bookingData.project_enq_id ?? null,
              floor_unit_id: patchFloorUnitId as unknown as string,
              source_id: patchSourceId as unknown as string,
              source_detail_id: patchSourceDetailId,
              source_executive_id: bookingData.source_executive_id ?? null,
              channel_partner_id: patchChannelPartnerId,
              source_description: bookingData.source_description ?? null,
              package_total_with_parking: bookingData.package_total_with_parking ?? null,
              remark: bookingData.remark ?? null,
              wing_id: bookingData.wing_id ?? null,
              floor_id: bookingData.floor_id ?? null,
              unit_type_id: bookingData.unit_type_id ?? null,
              unit_no: bookingData.unit_no ?? null,
              unit_id: bookingData.unit_id ?? null,
              carpet: bookingData.carpet ?? null,
              scheme_per: bookingData.scheme_per ?? null,
              tax_id: bookingData.tax_id ?? null,
              rate: bookingData.rate ?? null,
              floor_rise_rate: bookingData.floor_rise_rate ?? null,
              floor_rise_amt: bookingData.floor_rise_amt ?? null,
              market_value: bookingData.market_value ?? null,
              gst_per: bookingData.gst_per ?? null,
              sd_per: bookingData.sd_per ?? null,
              reg_per: bookingData.reg_per ?? null,
              basic_cost: bookingData.basic_cost ?? null,
              idc: bookingData.idc ?? null,
              agreement_cost: bookingData.agreement_cost ?? null,
              gst: bookingData.gst ?? null,
              stamp_duty: bookingData.stamp_duty ?? null,
              parking_type_id: bookingData.parking_type_id ?? null,
              parking_no: bookingData.parking_no ?? null,
              charges: bookingData.charges ?? null,
              reg: bookingData.reg ?? null,
              society_for: bookingData.society_for ?? null,
              legal: bookingData.legal ?? null,
              maintenance: bookingData.maintenance ?? null,
              corpus: bookingData.corpus ?? null,
              other: bookingData.other ?? null,
              package_total: bookingData.package_total ?? null,
              is_parking_charges_added: bookingData.is_parking_charges_added === 1 || bookingData.is_parking_charges_added === true,
              enter_package: bookingData.enter_package ?? null,
              offer_name: bookingData.offer_name ?? null,
              created_by: bookingData.created_by ?? null,
              updated_by: this.userId,
              unit_type: bookingData.unit_type ?? null,
              parking_charges: bookingData.parking_charges ?? null,
              booking_amount: bookingData.booking_amount ?? null,
              floor_unit: bookingData.floor_unit ?? null,
              applicant_name: bookingData.applicant_name ?? null,
            }, { emitEvent: false });

            // Load source details if source_id exists
            if (patchSourceId !== null) {
              this.stateService.fetchSourceDetails(patchSourceId);
            }

            // Load channel partner if exists
            if (patchChannelPartnerId !== null) {
              this.onPartnerSearch('', true, patchChannelPartnerId);
            }

            // When source_id is null (e.g. Token booking), fetch token to get source_id and patch
            if ((bookingData.source_id == null || bookingData.source_id === '') && bookingData.token_id) {
              const tokenId = Number(bookingData.token_id);
              if (!isNaN(tokenId)) {
                this.bookingService
                  .fetchSingleToken(tokenId)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                    next: (tokenRes: any) => {
                      if (tokenRes?.source_id != null) {
                        const tokenSourceId = Number(tokenRes.source_id);
                        this.stateService.fetchSourceDetails(tokenSourceId);
                        this.addBookingForm.patchValue({
                          source_id: tokenSourceId as unknown as string,
                          source_detail_id: tokenRes.source_detail_id != null ? Number(tokenRes.source_detail_id) : null,
                          channel_partner_id: tokenRes.channel_partner_id != null ? Number(tokenRes.channel_partner_id) : null,
                        }, { emitEvent: false });
                        if (tokenRes.channel_partner_id) {
                          this.onPartnerSearch('', true, Number(tokenRes.channel_partner_id));
                        }
                      }
                    },
                  });
              }
            }

            // Load floor/unit data if wing is selected
            if (bookingData.wing_id) {
              this.stateService.fetchFloors(bookingData.project_id, bookingData.wing_id);
              if (bookingData.floor_id) {
                this.stateService.fetchUnitTypes(bookingData.project_id, bookingData.wing_id, bookingData.floor_id);
              }
              // Load floor units so floor_unit_id dropdown is populated and can display the patched value
              if (bookingData.floor_id && bookingData.unit_type) {
                this.stateService.fetchFloorUnits(
                  bookingData.project_id,
                  bookingData.wing_id,
                  bookingData.floor_id,
                  bookingData.unit_type
                );
              }
            }

            // Load enquiry if exists
            if (bookingData.project_enq_id) {
              this.fetchSingleEnquiry(bookingData.project_enq_id);
            }
            this.triggerCalculations();

            // Re-enable calculations

            // Re-apply role-based field state after data is loaded
            this.handleSourceFieldsBasedOnRole();

            // Reset flag after patching is complete
            setTimeout(() => {
              this.isPatchingFromBooking = false;
            }, 100);
          }
        },
        error: () => {
          this.snackBar.open('Unable to fetch booking details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  /**
   * Load source details with proper timing
   */
  private loadSourceDetails(sourceId: any, sourceDetailId: any): void {
    if (!sourceDetailId) {
      if (sourceId) {
        this.stateService.fetchSourceDetails(sourceId);
      }
      return;
    }

    // Check if source details are already loaded
    const currentSourceDetails = this.sourceDetailedList();
    const sourceDetailExists = currentSourceDetails?.some(
      (detail: any) => detail.source_detail_id === sourceDetailId
    );

    if (sourceDetailExists) {
      this.addBookingForm.patchValue({
        source_detail_id: sourceDetailId
      }, { emitEvent: false });
    } else {
      this.stateService.fetchSourceDetails(sourceId);

      // Wait for source details to load
      this.stateService.sourceDetails$
        .pipe(
          filter((sourceDetails) =>
            sourceDetails?.some((detail: any) => detail.source_detail_id === sourceDetailId)
          ),
          take(1),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(() => {
          this.addBookingForm.patchValue({
            source_detail_id: sourceDetailId
          }, { emitEvent: false });
        });
    }
  }

  /**
   * Fetch single enquiry and populate form
   */
  fetchSingleEnquiry(enquiryID: any): void {
    this.bookingService
      .fetchSingleEnquiry(enquiryID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.triggerCalculations();

          // Skip patching source fields if we're currently patching from booking data
          // This prevents overwriting values that were already patched from booking
          if (this.isPatchingFromBooking) {
            // Only patch source_description if it's not already set
            const currentSourceDescription = this.addBookingForm.get('source_description')?.value;
            if (!currentSourceDescription && res.source_description) {
              this.addBookingForm.patchValue({
                source_description: res.source_description,
              }, { emitEvent: false });
            }
            this.handleSourceFieldsBasedOnRole();
            return;
          }

          // Only patch source fields from enquiry if they're not already set from booking data
          const currentSourceId = this.addBookingForm.get('source_id')?.value;
          const currentSourceDetailId = this.addBookingForm.get('source_detail_id')?.value;
          const currentChannelPartnerId = this.addBookingForm.get('channel_partner_id')?.value;

          const patchData: any = {
            source_description: res.source_description || null,
          };

          // Only patch source fields if they're not already set
          if (!currentSourceId && res.source_id) {
            patchData.source_id = res.source_id;
          }
          if (!currentSourceDetailId && res.source_detail_id) {
            patchData.source_detail_id = res.source_detail_id;
          }
          if (!currentChannelPartnerId && res.channel_partner_id) {
            patchData.channel_partner_id = res.channel_partner_id;
          }

          this.addBookingForm.patchValue(patchData, { emitEvent: false });

          // Only load channel partner if it wasn't already set and enquiry has it
          if (!currentChannelPartnerId && res.channel_partner_id) {
            this.onPartnerSearch('', true, res.channel_partner_id);
          }

          this.handleSourceFieldsBasedOnRole();
        },
        error: () => {
          this.snackBar.open('Unable to fetch enquiry details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  /**
   * Search channel partners with debouncing
   */
  onPartnerSearch(
    searchText: string,
    loadInitialData: boolean = false,
    initialPartnerId?: any
  ): void {
    const trimmedSearch = searchText.trim();

    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.stateService.fetchChannelPartners();
      return;
    }

    const channelPartnerId = loadInitialData
      ? (initialPartnerId || this.addBookingForm.value.channel_partner_id)
      : undefined;

    this.stateService.fetchChannelPartners(
      loadInitialData ? undefined : trimmedSearch,
      channelPartnerId
    );
  }

  /**
   * Handle token change and populate form
   */
  onTokenChange(tokenID: any): void {
    if (!tokenID) return;

    this.bookingService
      .fetchSingleToken(tokenID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.stateService.setFloorUnitField(true);
          this.stateService.fetchSourceDetails(res.source_id);

          this.addBookingForm.patchValue(
            {
              source_id: res.source_id || null,
              wing_id: res.wing_id || null,
              floor_id: res.floor_id || null,
              unit_type_id: res.unit_type_id || null,
              unit_type: res.unit_type || null,
              floor_unit: res.floor_unit || null,
              floor_unit_id: res.floor_unit_id || null,
              channel_partner_id: res.channel_partner_id || null,
              source_detail_id: res.source_detail_id || null,
            },
            { emitEvent: false }
          );

          this.handleSourceFieldsBasedOnRole();

          if (res.is_highest === 1) {
            this.handleHighestToken(res);
          }
        },
        error: () => {
          this.snackBar.open('Unable to fetch token details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  /**
   * Handle highest token scenario
   */
  private handleHighestToken(res: any): void {
    this.stateService.setFloorUnitField(false);

    [
      'source_id',
      'wing_id',
      'floor_id',
      'unit_type_id',
      'unit_type',
      'floor_unit',
      'floor_unit_id',
    ].forEach((control) => this.addBookingForm.get(control)?.disable());

    this.addBookingForm.get('floor_unit_id')?.enable();

    const projectId = this.bookingData()?.project_id;
    if (res.wing_id && projectId) {
      this.stateService.fetchFloors(projectId, res.wing_id);

      if (res.floor_id) {
        this.stateService.fetchUnitTypes(projectId, res.wing_id, res.floor_id);

        if (res.unit_type) {
          this.stateService.fetchFloorUnits(projectId, res.wing_id, res.floor_id, res.unit_type);
        }
      }
    }

    if (res.channel_partner_id) {
      this.onPartnerSearch('', true, res.channel_partner_id);
    }

    this.calculationsDisabled.set(true);
    this.addBookingForm.patchValue(
      {
        wing_id: res.wing_id || null,
        floor_id: res.floor_id || null,
        floor_unit_id: res.floor_unit_id || null,
        unit_type_id: res.unit_type_id || null,
        unit_type: res.unit_type || null,
        floor_unit: res.floor_unit || null,
        parking_type_id: res.parking_type_id || null,
        parking_no: res.parking_no || null,
        charges: res.charges || null,
        gst: res.gst || null,
        gst_per: res.gst_per || null,
        source_id: res.source_id || null,
        source_detail_id: res.source_detail_id || null,
        source_description: res.source_description || null,
        channel_partner_id: res.channel_partner_id || null,
        remark: res.comment || null,
      },
      { emitEvent: false }
    );
    this.calculationsDisabled.set(false);

    if (res.floor_unit_id) {
      setTimeout(() => {
        this.onUniTypeChange({ value: res.floor_unit_id });
      }, 100);
    }
  }

  /**
   * Setup form calculation listeners
   */
  private setupFormCalculations(): void {
    const costFields = ['rate', 'unit_id', 'floor_rise_rate'];
    const taxFields = [
      'agreement_cost',
      'gst_per',
      'sd_per',
      'reg_per',
      'charges',
      'idc',
      'floor_rise_rate',
      'floor_rise_amt',
      'market_value',
      'parking_charges',
    ];

    // Package total with parking -> Update booking amount
    this.addBookingForm
      .get('package_total_with_parking')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => !this.calculationsDisabled())
      )
      .subscribe(() => {
        this.updateBookingAmount();
      });

    // Cost-related field changes
    costFields.forEach((field) => {
      this.addBookingForm
        .get(field)
        ?.valueChanges.pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(() => !this.calculationsDisabled())
        )
        .subscribe(() => {
          this.updateAgreementCost();
          this.calculateFloorRiseAmount();
          this.calculateAllTaxes();
        });
    });

    // Tax-related field changes
    taxFields.forEach((field) => {
      this.addBookingForm
        .get(field)
        ?.valueChanges.pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(() => !this.calculationsDisabled())
        )
        .subscribe(() => {
          this.calculateAllTaxes();
        });
    });

    // Agreement cost changes
    this.addBookingForm
      .get('agreement_cost')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => !this.calculationsDisabled())
      )
      .subscribe(() => {
        const agreementCost = this.getFormValueAsNumber('agreement_cost');
        const unitId = this.getFormValueAsNumber('unit_id');
        if (unitId > 0) {
          const calculatedRate = agreementCost / unitId;
          this.setFormValue('rate', calculatedRate, false);
        }
        this.calculateAllTaxes();
      });

    // Parking charges changes
    this.addBookingForm
      .get('parking_charges')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => !this.calculationsDisabled())
      )
      .subscribe(() => {
        const parkingCharges = this.getFormValueAsNumber('parking_charges');
        if (parkingCharges <= 0) {
          this.addBookingForm.get('is_parking_charges_added')?.setValue(false, { emitEvent: false });
          this.updateAgreementCostWithParking();
        }
        this.calculateAllTaxes();
      });

    // Add to agreement cost checkbox changes
    this.addBookingForm
      .get('is_parking_charges_added')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => !this.calculationsDisabled())
      )
      .subscribe(() => {
        this.updateAgreementCostWithParking();
        this.calculateAllTaxes();
      });
  }

  /**
   * Trigger calculations after form updates
   */
  private triggerCalculations(): void {
    setTimeout(() => {
      this.calculateFloorRiseAmount();
      this.updateAgreementCost();
      this.calculateAllTaxes();
    }, 0);
  }

  /**
   * Calculate floor rise amount
   */
  private calculateFloorRiseAmount(): void {
    const unitId = this.getFormValueAsNumber('unit_id') || 0;
    const floorRiseRate = this.getFormValueAsNumber('floor_rise_rate') || 0;

    const floorRiseAmount = unitId > 0 && floorRiseRate > 0 ? floorRiseRate * unitId : 0;
    this.setFormValue('floor_rise_amt', floorRiseAmount);
  }

  /**
   * Update agreement cost
   */
  private updateAgreementCost(): void {
    const rate = this.getFormValueAsNumber('rate');
    const unitId = this.getFormValueAsNumber('unit_id');
    const floorRiseAmount = this.getFormValueAsNumber('floor_rise_amt') || 0;

    if (!unitId) return;

    const baseCost = rate * unitId + floorRiseAmount;
    const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
    const addToAgreement = this.addBookingForm.get('is_parking_charges_added')?.value === true;

    const finalAgreementCost =
      addToAgreement && parkingCharges > 0 ? baseCost + parkingCharges : baseCost;

    this.setFormValue('agreement_cost', finalAgreementCost);
  }

  /**
   * Calculate all taxes
   */
  private calculateAllTaxes(): void {
    const agreementCost = this.getFormValueAsNumber('agreement_cost');
    if (isNaN(agreementCost) || agreementCost <= 0) return;

    const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
    const gst = this.calculateGst(agreementCost);
    const stampDuty = this.calculateStampDuty(agreementCost);
    const reg = this.calculateRegistrationFee(agreementCost);
    const basicCost = agreementCost - (this.getFormValueAsNumber('idc') || 0);

    this.setFormValue('gst', gst);
    this.setFormValue('stamp_duty', stampDuty);
    this.setFormValue('reg', reg);
    this.setFormValue('basic_cost', basicCost);

    const packageTotal = agreementCost + gst + stampDuty + reg;
    this.setFormValue('package_total', packageTotal);

    const packageTotalWithParking =
      parkingCharges > 0 ? packageTotal + parkingCharges : 0;
    this.setFormValue('package_total_with_parking', packageTotalWithParking);
  }

  /**
   * Calculate GST
   */
  private calculateGst(agreementCost: number): number {
    const gstPercent = this.getFormValueAsNumber('gst_per') || 0;
    return agreementCost * (gstPercent / 100);
  }

  /**
   * Calculate stamp duty
   */
  private calculateStampDuty(agreementCost: number): number {
    const sdPercent = this.getFormValueAsNumber('sd_per') || 0;
    const duty = agreementCost * (sdPercent / 100);
    return Math.ceil(duty / 100) * 100;
  }

  /**
   * Calculate registration fee
   */
  private calculateRegistrationFee(agreementCost: number): number {
    const regPercent = this.getFormValueAsNumber('reg_per') || 0;
    const fee = agreementCost * (regPercent / 100);
    return Math.min(fee, 30000);
  }

  /**
   * Update agreement cost with parking consideration
   */
  private updateAgreementCostWithParking(): void {
    const rate = this.getFormValueAsNumber('rate');
    const unitId = this.getFormValueAsNumber('unit_id');
    const floorRiseAmount = this.getFormValueAsNumber('floor_rise_amt') || 0;

    if (!unitId) return;

    const baseCost = rate * unitId + floorRiseAmount;
    const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
    const addToAgreement = this.addBookingForm.get('is_parking_charges_added')?.value === true;

    const finalAgreementCost =
      addToAgreement && parkingCharges > 0 ? baseCost + parkingCharges : baseCost;

    this.setFormValue('agreement_cost', finalAgreementCost, false);
  }

  /**
   * Update booking amount
   */
  private updateBookingAmount(): void {
    const packageTotalWithParking = this.getFormValueAsNumber('package_total_with_parking');
    if (packageTotalWithParking > 0) {
      this.setFormValue('booking_amount', packageTotalWithParking);
    }
  }

  /**
   * Get form value as number
   */
  private getFormValueAsNumber(controlName: string): number {
    const value = this.addBookingForm.get(controlName)?.value;
    return value ? parseFloat(value) : 0;
  }

  /**
   * Set form value
   */
  private setFormValue(
    controlName: string,
    value: number,
    emitEvent = false
  ): void {
    this.addBookingForm
      .get(controlName)
      ?.setValue(value.toFixed(0), { emitEvent });
  }

  /**
   * Reset unit details
   */
  private resetUnitDetails(): void {
    this.calculationsDisabled.set(true);
    this.addBookingForm.patchValue(
      {
        carpet: null,
        rate: null,
        market_value: null,
        idc: null,
        agreement_cost: null,
        stamp_duty: null,
        gst_per: null,
        reg_per: null,
        reg: null,
        society_for: null,
        legal: null,
        maintenance: null,
        corpus: null,
        other: null,
        unit_id: null,
        package_total: null,
        package_total_with_parking: null,
        parking_charges: null,
      },
      { emitEvent: false }
    );
    this.calculationsDisabled.set(false);
    this.triggerCalculations();
  }

  /**
   * Handle source fields based on role
   */
  private handleSourceFieldsBasedOnRole(): void {
    const sourceControl = this.addBookingForm.get('source_id');
    const sourceDetailControl = this.addBookingForm.get('source_detail_id');
    const channelPartnerControl = this.addBookingForm.get('channel_partner_id');

    if (this.roleId === 2) {
      // For role 2 (admin), enable all source fields
      sourceControl?.enable({ emitEvent: false });
      sourceDetailControl?.enable({ emitEvent: false });
      channelPartnerControl?.enable({ emitEvent: false });

      sourceControl?.clearValidators();
      sourceDetailControl?.clearValidators();
      channelPartnerControl?.clearValidators();
    } else {
      // For other roles, disable all source fields
      sourceControl?.disable({ emitEvent: false });
      sourceDetailControl?.disable({ emitEvent: false });
      channelPartnerControl?.disable({ emitEvent: false });

      sourceControl?.clearValidators();
      sourceDetailControl?.clearValidators();
      channelPartnerControl?.clearValidators();
    }

    sourceControl?.updateValueAndValidity({ emitEvent: false });
    sourceDetailControl?.updateValueAndValidity({ emitEvent: false });
    channelPartnerControl?.updateValueAndValidity({ emitEvent: false });

    this.addBookingForm.updateValueAndValidity({ emitEvent: false });
    this.roleBasedLogicApplied.set(true);
  }

  /**
   * Check if form is valid for submission
   */


  /**
   * Submit form
   */
  submitForm(): void {
    const formValue = this.addBookingForm.getRawValue();
    const bookingData = this.bookingData();

    const payload = {
      booking_id: bookingData.booking_id,
      user_id: this.userId,
      project_id: bookingData.project_id,
      source_id: formValue.source_id,
      booking_from_id: formValue.booking_from_id,
      sales_executive_id: formValue.sales_executive_id,
      token_type_id: formValue.token_type_id,
      source_detail_id: formValue.source_detail_id,
      source_executive_id: formValue.source_executive_id,
      channel_partner_id: formValue.channel_partner_id,
      floor_unit_id: formValue.floor_unit_id || this.bookingInfo()?.floor_unit_id,
      source_description: formValue.source_description,
      remark: formValue.remark,
      wing_id: formValue.wing_id,
      floor_id: formValue.floor_id,
      unit_type_id: formValue.unit_type_id,
      unit_id: formValue.unit_id,
      carpet: formValue.carpet,
      scheme_per: formValue.scheme_per,
      tax_id: formValue.tax_id,
      rate: formValue.rate,
      floor_rise_rate: formValue.floor_rise_rate,
      floor_rise_amt: formValue.floor_rise_amt,
      market_value: formValue.market_value,
      gst_per: formValue.gst_per,
      sd_per: formValue.sd_per,
      reg_per: formValue.reg_per,
      basic_cost: formValue.basic_cost,
      idc: formValue.idc,
      agreement_cost: formValue.agreement_cost,
      gst: formValue.gst,
      unit_type: formValue.unit_type,
      stamp_duty: formValue.stamp_duty,
      parking_type_id: formValue.parking_type_id,
      parking_no: formValue.parking_no,
      charges: formValue.charges,
      reg: formValue.reg,
      society_for: formValue.society_for,
      legal: formValue.legal,
      maintenance: formValue.maintenance,
      corpus: formValue.corpus,
      other: formValue.other,
      package_total: formValue.package_total,
      package_total_with_parking: formValue.package_total_with_parking,
      enter_package: formValue.enter_package,
      offer_name: formValue.offer_name,
      parking_charges: formValue.parking_charges,
      updated_by: this.userId,
      booking_date: formValue.booking_date
        ? this.datePipe.transform(formValue.booking_date as unknown as string | number | Date, 'yyyy-MM-dd')
        : null,
    };

    this.bookingService
      .editBooking(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.dialog
            .open(SuccessDialogComponent, {
              data: { message: res.message },
            })
            .afterClosed()
            .subscribe(() => {
              this.dialogRef.close(true);
            });
          this.addBookingForm.reset();
        },
        error: () => {
          this.snackBar.open('Failed to process booking.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
}
