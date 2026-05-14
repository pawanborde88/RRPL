import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  input,
  ChangeDetectorRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';


import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { catchError, combineLatest, distinctUntilChanged, EMPTY, filter } from 'rxjs';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';
import { BookingService, AddBookingPaymentPayload, PaymentMode, Bank } from '../../../../../Service/booking.service';
import { BookingCalculationsStateService } from './services/booking-calculations.state.service';
import { effect } from '@angular/core';

/**
 * High-performance Booking Calculations Component
 * 
 * Features:
 * - Standalone component with optimized imports
 * - Signals for reactive state management
 * - OnPush change detection
 * - Optimized RxJS subscriptions with combineLatest and switchMap
 * - Clean dependency injection using inject()
 * - Centralized state management via state service
 * - Production-ready error handling
 */
@Component({
  selector: 'app-booking-calculations',
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
  templateUrl: './booking-calculations.component.html',
  styleUrl: './booking-calculations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingCalculationsComponent {
  // ⚡ Dependency Injection
  private readonly stateService = inject(BookingCalculationsStateService);
  private readonly bookingService = inject(BookingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly datePipe = new DatePipe('en-US');

  // ⚡ Inputs
  readonly BookingData = input<any>();
  readonly isApplicantAdded = input<boolean>(false);
  readonly isPaymentAdded = input<boolean>(false);

  // ⚡ Local state
  private calculationsDisabled = signal<boolean>(false);
  readonly userId = Number(sessionStorage.getItem('session_id') || '0');
  readonly roleId = Number(sessionStorage.getItem('role_id') || '0');

  // ⚡ Expose state service signals
  readonly floorUnitField = this.stateService.floorUnitField;
  readonly allWingslist = this.stateService.wings;
  readonly allprojectsPeoples = this.stateService.allprojectPeoples;
  readonly sourceDetailedList = this.stateService.sourceDetails;
  readonly sourcesList = this.stateService.sources;
  readonly allBasedOns = this.stateService.basedOns;
  readonly allChannelPartnerList = this.stateService.channelPartners;
  readonly bookingInfo = this.stateService.bookingInfo;
  readonly isLoading = this.stateService.isLoading;
  readonly allSalesExecutive = this.stateService.salesExecutives;
  readonly FloorUnitDropdown = this.stateService.floors;
  readonly confiList = this.stateService.unitTypes;
  readonly UnitNo = this.stateService.floorUnits;
  readonly projects = this.stateService.projects;
  readonly allParkingTypeList = this.stateService.parkingTypes;

  // ⚡ Payment signals
  private readonly isSubmittingPayment = signal<boolean>(false);
  readonly hasPaymentBeenAdded = signal<boolean>(false);

  readonly paymentModes = toSignal(
    this.bookingService.fetchPaymentModes().pipe(
      catchError(() => { this.snackBar.open('Failed to load payment modes', 'Close', { duration: 3000 }); return EMPTY; })
    ),
    { initialValue: [] as PaymentMode[] }
  )!;

  readonly banks = toSignal(
    this.bookingService.fetchBanks().pipe(
      catchError(() => { this.snackBar.open('Failed to load banks', 'Close', { duration: 3000 }); return EMPTY; })
    ),
    { initialValue: [] as Bank[] }
  )!;

  readonly isAddPaymentDisabled = computed(() => this.isSubmittingPayment() || this.hasPaymentBeenAdded());
  readonly paymentButtonText = computed(() => this.hasPaymentBeenAdded() ? 'Payment Added' : 'Add Payment');
  readonly paymentButtonIcon = computed(() => this.hasPaymentBeenAdded() ? 'check_circle' : 'payments');
  readonly minPaymentDate = computed(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d; });
  readonly maxPaymentDate = computed(() => new Date());

  // ⚡ Computed values
  readonly canSubmit = computed(() =>
    this.isApplicantAdded() &&
    this.isPaymentAdded() &&
    this.addBookingForm.valid
  );

  readonly stampDucyPercentage = computed(() =>
    this.stateService.agreementPercentage()?.sd_percentage || null
  );

  // ⚡ Milestone Date Constraints
  readonly baseBookingDate = computed(() => {
    const info = this.stateService.bookingInfo();
    if (!info?.booking_date) return null;
    const date = new Date(info.booking_date);
    return isNaN(date.getTime()) ? null : date;
  });

  readonly homeLoanMaxDate = computed(() => this.calculateOffsetDate(this.baseBookingDate(), 5));
  readonly taxPaymentMaxDate = computed(() => this.calculateOffsetDate(this.baseBookingDate(), 15));
  readonly ownContributionMaxDate = computed(() => this.calculateOffsetDate(this.baseBookingDate(), 15));
  readonly agreementMaxDate = computed(() => this.calculateOffsetDate(this.baseBookingDate(), 25));
  readonly disbursementMaxDate = computed(() => this.calculateOffsetDate(this.baseBookingDate(), 45));

  private calculateOffsetDate(base: Date | null, days: number): Date | null {
    if (!base) return null;
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
  }

  // ⚡ Form Group
  readonly addBookingForm = new FormGroup({
    user_id: new FormControl(this.userId),
    project_id: new FormControl(),
    closed_by: new FormControl('', Validators.required),
    unit_type: new FormControl('', Validators.required),
    package_total_with_parking: new FormControl(''),
    source_id: new FormControl('', Validators.required),
    source_detail_id: new FormControl(''),
    source_executive_id: new FormControl(''),
    channel_partner_id: new FormControl(),
    project_enq_id: new FormControl(''),
    remark: new FormControl(''),
    wing_id: new FormControl('', Validators.required),
    floor_id: new FormControl(''),
    parking_type_id: new FormControl(''),

    floor_unit: new FormControl(''),
    unit_type_id: new FormControl(''),
    unit_no: new FormControl(),
    unit_id: new FormControl(),
    carpet: new FormControl(0, Validators.required),
    scheme_per: new FormControl(''),
    source_description: new FormControl(''),
    tax_id: new FormControl(''),
    rate: new FormControl(0, Validators.required),
    floor_rise_rate: new FormControl(''),
    floor_rise_amt: new FormControl('', Validators.required),
    market_value: new FormControl(''),
    parking_charges: new FormControl(''),
    gst_per: new FormControl(5, Validators.required),
    sd_per: new FormControl(7, Validators.required),
    reg_per: new FormControl(1, Validators.required),
    basic_cost: new FormControl(),
    idc: new FormControl(0, Validators.required),
    idc_gst: new FormControl(''),
    agreement_cost: new FormControl(),
    gst: new FormControl(),
    floor_unit_id: new FormControl('', Validators.required),
    stamp_duty: new FormControl(),
    parking_no: new FormControl(''),
    charges: new FormControl(''),
    reg: new FormControl('', Validators.required),
    society_for: new FormControl('', Validators.required),
    legal: new FormControl('', Validators.required),
    maintenance: new FormControl('', Validators.required),
    maintanace_gst: new FormControl(''),
    corpus: new FormControl('', Validators.required),
    clubhouse_amount: new FormControl(''),
    clubhouse_gst: new FormControl(''),
    other: new FormControl('', Validators.required),
    package_total: new FormControl(),
    enter_package: new FormControl(''),
    offer_name: new FormControl(''),
    created_by: new FormControl(''),
    booking_id: new FormControl(''),
    updated_by: new FormControl(this.userId),
    show_scheme: new FormControl(false),
    is_parking_charges_added: new FormControl(false),
    tentative_loan_amount: new FormControl(''),
    home_loan_doc_submission_date: new FormControl<Date | null>(null),
    tax_payment_completion_date: new FormControl<Date | null>(null),
    own_contribution_payment_date: new FormControl<Date | null>(null),
    agreement_completion_date: new FormControl<Date | null>(null),
    disbursement_completion_date: new FormControl<Date | null>(null),
    type_of_payment: new FormControl<string | null>(null, Validators.required),
    home_loan_amount: new FormControl<string | null>(null),

  });

  // ⚡ Payment Form (separate form group for booking payment details)
  readonly addBookingPaymentForm = new FormGroup<{
    booking_date: FormControl<string | null>;
    booking_amount: FormControl<string | null>;
    bank_details: FormControl<string | null>;
    payment_mode_id: FormControl<number | null>;
    cheque_date: FormControl<string | null>;
    cheque_no: FormControl<string | null>;
    bank_name_id: FormControl<number | null>;
    created_by: FormControl<number | null>;
    booking_id: FormControl<number | null>;
    updated_by: FormControl<number | null>;
  }>({
    booking_date: new FormControl(this.getFormattedDate(new Date())),
    booking_amount: new FormControl<string | null>(null, Validators.required),
    bank_details: new FormControl<string | null>(null),
    payment_mode_id: new FormControl<number | null>(null, Validators.required),
    cheque_date: new FormControl(this.getFormattedDate(new Date())),
    cheque_no: new FormControl<string | null>(null, Validators.required),
    bank_name_id: new FormControl<number | null>(null),
    created_by: new FormControl<number | null>(null),
    booking_id: new FormControl<number | null>(null),
    updated_by: new FormControl<number | null>(this.userId),
  });

  constructor() {
    this.setupFormCalculations();
    this.setupReactiveDataFetching();
    this.setupFormControlSubscriptions();
    this.setupSourceValidation();
    this.setupAgreementPercentageSubscription();
    this.setupFloorUnitControlEnabling();
    this.setupDateCalculations();
    this.setupPaymentTypeValidation();
  }

  /**
   * Setup date calculations from booking date
   */
  private setupDateCalculations(): void {
    effect(() => {
      const info = this.stateService.bookingInfo();
      if (info?.booking_date) {
        const bookingDateStr = info.booking_date;
        // Parse the booking date (assumes standard format like YYYY-MM-DD or valid date string)
        const baseDate = new Date(bookingDateStr);
        if (!isNaN(baseDate.getTime())) {
          const addDays = (date: Date, days: number): Date => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
          };

          this.addBookingForm.patchValue({
            home_loan_doc_submission_date: addDays(baseDate, 5),
            tax_payment_completion_date: addDays(baseDate, 15),
            own_contribution_payment_date: addDays(baseDate, 15),
            agreement_completion_date: addDays(baseDate, 25),
            disbursement_completion_date: addDays(baseDate, 45)
          }, { emitEvent: false });
        }
      }
    });
  }

  /**
   * Setup subscription to patch sd_per when agreement percentage changes
   */
  private setupAgreementPercentageSubscription(): void {
    effect(() => {
      const agreementPercentage = this.stateService.agreementPercentage();
      if (agreementPercentage?.sd_percentage !== null && agreementPercentage?.sd_percentage !== undefined) {
        this.addBookingForm.patchValue(
          { sd_per: agreementPercentage.sd_percentage },
          { emitEvent: false }
        );
      }
    });
  }

  /**
   * Setup effect to enable/disable floor_unit_id control based on available floor units
   */
  private setupFloorUnitControlEnabling(): void {
    effect(() => {
      const hasFloorUnits = this.stateService.hasFloorUnits();
      const floorUnitControl = this.addBookingForm.get('floor_unit_id');
      if (floorUnitControl) {
        if (hasFloorUnits) {
          floorUnitControl.enable({ emitEvent: false });
        } else {
          // Only disable if there are no floor units and the control is not already disabled for other reasons
          // Check if wing_id, floor_id, and unit_type are all set before disabling
          const wingId = this.addBookingForm.get('wing_id')?.value;
          const floorId = this.addBookingForm.get('floor_id')?.value;
          const unitType = this.addBookingForm.get('unit_type')?.value;

          // Only disable if all parent selections are made but no units are available
          if (wingId && floorId && unitType) {
            floorUnitControl.disable({ emitEvent: false });
          }
        }
      }
    });
  }

  /**
   * Setup reactive data fetching when BookingData changes
   */
  private setupReactiveDataFetching(): void {
    toObservable(this.BookingData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((data) => !!data?.project_id && !!data?.booking_id)
      )
      .subscribe((data) => {
        this.initializeData(data);
      });

    // Initial load
    const data = this.BookingData();
    if (data?.project_id && data?.booking_id) {
      this.initializeData(data);
    }
  }

  /**
   * Initialize component data
   */
  private initializeData(data: any): void {
    this.stateService.loadInitialData(data.project_id, data.booking_id);
    this.stateService.fetchAgreementPercentage(data.booking_id);
    this.stateService.fetchAssignedProjects(data.project_id);
    this.stateService.fetchSalesExecutives(data.project_id);

    // Patch booking_id into payment form and load existing payment details
    this.addBookingPaymentForm.patchValue({ booking_id: data.booking_id });
    this.loadBookingPaymentDetails(data.booking_id);

    // Fetch booking info and handle enquiry if exists
    this.bookingService
      .fetchSingleBooking(data.booking_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.success && res.data?.project_enq_id) {
            this.fetchSingleEnquiry(res.data.project_enq_id);
          }
        },
      });

    if (data.token_id) {
      this.onTokenChange(data.token_id);
    }

    // Setup form control dependencies
    this.setupFormControlSubscriptions();
  }

  /**
   * Setup optimized form control subscriptions using combineLatest
   */
  private setupFormControlSubscriptions(): void {
    const bookingData = this.BookingData();
    if (!bookingData?.project_id) return;

    const projectId = bookingData.project_id;

    // Wing selection -> Fetch floors
    this.addBookingForm
      .get('wing_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((wingId): wingId is string => !!wingId)
      )
      .subscribe((wingId) => {
        this.stateService.fetchFloors(projectId, wingId);
        this.resetUnitDetails();
        this.enableFloorControls();
      });

    // Floor and Wing -> Fetch unit types
    combineLatest([
      this.addBookingForm.get('wing_id')!.valueChanges,
      this.addBookingForm.get('floor_id')!.valueChanges,
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((tuple): tuple is [string, string] =>
          !!tuple[0] && !!tuple[1]
        ),
        distinctUntilChanged()
      )
      .subscribe(([wingId, floorId]) => {
        this.stateService.fetchUnitTypes(projectId, wingId, floorId);
        this.resetUnitDetails();
        this.enableUnitTypeControls();
      });

    // Unit type, floor, wing -> Fetch floor units
    combineLatest([
      this.addBookingForm.get('wing_id')!.valueChanges,
      this.addBookingForm.get('floor_id')!.valueChanges,
      this.addBookingForm.get('unit_type')!.valueChanges,
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((tuple): tuple is [string, string, string] =>
          !!tuple[0] && !!tuple[1] && !!tuple[2]
        ),
        distinctUntilChanged()
      )
      .subscribe(([wingId, floorId, unitType]) => {
        this.stateService.fetchFloorUnits(projectId, wingId, floorId, unitType);
      });

    // Source selection -> Fetch source details
    this.addBookingForm
      .get('source_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((sourceId): sourceId is string => sourceId !== null && sourceId !== undefined)
      )
      .subscribe((sourceId) => {
        this.stateService.fetchSourceDetails(sourceId);
        this.updateSourceValidators(sourceId);
      });

    // Agreement cost changes -> Re-validate home loan amount
    this.addBookingForm.get('agreement_cost')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged()
    ).subscribe(() => {
      const loanCtrl = this.addBookingForm.get('home_loan_amount');
      loanCtrl?.updateValueAndValidity();
      if (loanCtrl?.invalid) {
        loanCtrl.markAsTouched();
      }
      this.cdr.markForCheck();
    });

    // Payment type selection -> Update validators
    this.addBookingForm
      .get('type_of_payment')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged()
      )
      .subscribe((type) => {
        this.updatePaymentValidators(type);
        const loanCtrl = this.addBookingForm.get('home_loan_amount');
        if (loanCtrl?.invalid) {
          loanCtrl.markAsTouched();
        }
        this.cdr.markForCheck();
      });
  }

  /**
   * Setup initial payment type validation
   */
  private setupPaymentTypeValidation(): void {
    const type = this.addBookingForm.get('type_of_payment')?.value;
    this.updatePaymentValidators(type);
  }

  /**
   * Update payment-related validators based on payment type
   */
  private updatePaymentValidators(type: string | null | undefined): void {
    const loanAmount = this.addBookingForm.get('home_loan_amount');
    const loanDate = this.addBookingForm.get('home_loan_doc_submission_date');
    const taxDate = this.addBookingForm.get('tax_payment_completion_date');
    const ownDate = this.addBookingForm.get('own_contribution_payment_date');
    const agreementDate = this.addBookingForm.get('agreement_completion_date');
    const disbursementDate = this.addBookingForm.get('disbursement_completion_date');

    const milestoneFields = [taxDate, ownDate, agreementDate, disbursementDate];
    const loanFields = [loanAmount, loanDate];

    // Convert type to string for consistent comparison
    const typeValue = type ? String(type) : null;

    if (typeValue === '1') {
      // Home Loan: Only loan fields are required
      loanAmount?.setValidators([Validators.required, this.homeLoanAmountValidator()]);
      loanDate?.setValidators(Validators.required);
      loanFields.forEach(f => {
        f?.updateValueAndValidity();
      });
      milestoneFields.forEach(f => {
        f?.clearValidators();
        f?.updateValueAndValidity();
      });
    } else if (typeValue === '2') {
      // Self Fund: Milestone fields are required, loan fields are not
      loanFields.forEach(f => {
        f?.clearValidators();
        f?.setValue(null);
        f?.updateValueAndValidity();
      });
      milestoneFields.forEach(f => {
        f?.setValidators(Validators.required);
        f?.updateValueAndValidity();
      });
    } else {
      // No selection: Clear all
      loanFields.concat(milestoneFields).forEach(f => {
        f?.clearValidators();
        f?.updateValueAndValidity();
      });
    }

    // Force change detection to update UI (asterisks in labels)
    this.cdr.markForCheck();
  }

  /**
   * Custom validator for Home Loan Amount
   */
  private homeLoanAmountValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;

      const amount = this.parseNumber(control.value);
      const agreementCost = this.parseNumber(this.addBookingForm.get('agreement_cost')?.value);

      if (!agreementCost) return null;

      if (amount > agreementCost) {
        return { amountExceedsAgreement: true };
      }

      const minAllowed = agreementCost * 0.11;
      if (amount < minAllowed) {
        return { minLoanRequired: true };
      }

      return null;
    };
  }

  /**
   * Helper to parse number from string (handling commas)
   */
  private parseNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return value;
    return Number(value.toString().replace(/,/g, ''));
  }

  /**
   * Setup source validation based on source_id
   */
  private setupSourceValidation(): void {
    this.addBookingForm
      .get('source_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((sourceId): sourceId is string => sourceId !== null && sourceId !== undefined)
      )
      .subscribe((sourceId) => {
        this.updateSourceValidators(sourceId);
      });
  }

  /**
   * Update source validators dynamically
   */
  private updateSourceValidators(sourceId: any): void {
    const channelPartnerControl = this.addBookingForm.get('channel_partner_id');
    const sourceDetailControl = this.addBookingForm.get('source_detail_id');

    channelPartnerControl?.clearValidators();
    sourceDetailControl?.clearValidators();

    if (sourceId === 3) {
      channelPartnerControl?.setValidators(Validators.required);
      sourceDetailControl?.setValidators(null);
    } else {
      channelPartnerControl?.setValidators(null);
      sourceDetailControl?.setValidators(Validators.required);
    }

    channelPartnerControl?.updateValueAndValidity();
    sourceDetailControl?.updateValueAndValidity();
  }

  /**
   * Enable/disable floor-related controls
   */
  private enableFloorControls(): void {
    const hasFloors = this.stateService.hasFloors();
    this.addBookingForm.get('floor_id')?.[hasFloors ? 'enable' : 'disable']();
    if (!hasFloors) {
      this.addBookingForm.get('unit_type')?.disable();
      this.addBookingForm.get('floor_unit_id')?.disable();
    }
  }

  /**
   * Enable/disable unit type controls
   */
  private enableUnitTypeControls(): void {
    const hasUnitTypes = this.stateService.hasUnitTypes();
    this.addBookingForm.get('unit_type')?.[hasUnitTypes ? 'enable' : 'disable']();
    if (!hasUnitTypes) {
      this.addBookingForm.get('floor_unit_id')?.reset();
    }
  }

  /**
   * Enable/disable floor unit controls
   */
  private enableFloorUnitControls(): void {
    const hasFloorUnits = this.stateService.hasFloorUnits();
    this.addBookingForm.get('floor_unit_id')?.[hasFloorUnits ? 'enable' : 'disable']();
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
          this.addBookingForm.patchValue(
            {
              source_id: res.data.source_id || '',
              channel_partner_id: res.data.channel_partner_id,
              source_detail_id: res.data.source_detail_id,
              source_description: res.data.source_description,
            },
            { emitEvent: false }
          );

          ['source_id', 'channel_partner_id', 'source_detail_id', 'source_description'].forEach(
            (control) => this.addBookingForm.get(control)?.disable()
          );

          if (res.data.channel_partner_id) {
            this.onPartnerSearch('', true, res.data.channel_partner_id);
          }
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
    loadInitialData = false,
    initialPartnerId?: any
  ): void {
    const trimmedSearch = searchText.trim();

    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.stateService.fetchChannelPartners();
      return;
    }

    this.stateService.fetchChannelPartners(
      loadInitialData ? undefined : trimmedSearch,
      loadInitialData ? initialPartnerId || this.addBookingForm.value.channel_partner_id : undefined
    );
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

            // Handle both direct object and nested data property response formats
            const data = res.data || res;

            // Calculate rate if it's 0 in response but agreement_cost is present
            const unit_id = Number(data.unit_id) || 0;
            const agreement_cost = Number(data.agreement_cost) || 0;
            let rate = Number(data.rate) || 0;

            if (rate === 0 && agreement_cost > 0 && unit_id > 0) {
              rate = agreement_cost / unit_id;
            }

            const patchData = {
              carpet: data.total_carpet_area_sqft || null,
              rate: rate || null,
              market_value: data.market_value || null,
              idc: data.idc || null,
              agreement_cost: data.agreement_cost || null,
              gst: data.gst || null,
              // Use provided GST/Reg percent, or fallback to default 5/1 if missing or 0
              gst_per: data.gst_percent || data.gst_per || 5,
              sd_per: data.stamp_duty_percent || data.sd_per || 7,
              stamp_duty: data.stamp_duty || null,
              reg_per: data.registration_percent || data.reg_per || 1,
              reg: data.registration || null,
              society_for: data.society_formation_charges || null,
              legal: data.legal_charges || null,
              maintenance: data.maintenance_charges || null,
              floor_rise_rate: data.floor_rise_amount || null,
              corpus: data.corpus_fund || null,
              other: data.other_charges || null,
              unit_id: data.unit_id,
              package_total: data.package_total || null,
              package_total_with_parking: data.package_total_with_parking || null,
              parking_charges: data.parking_charges || null,
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

          ['source_id', 'source_detail_id'].forEach(
            (control) => this.addBookingForm.get(control)?.disable()
          );

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

          if (res.channel_partner_id && res.is_highest !== 1) {
            this.onPartnerSearch('', true, res.channel_partner_id);
            if (this.roleId !== 2) {
              this.addBookingForm
                .get('channel_partner_id')
                ?.disable({ emitEvent: false });
            }
          }

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
      'channel_partner_id',
      'source_detail_id',
    ].forEach((control) => this.addBookingForm.get(control)?.disable());

    this.addBookingForm.get('floor_unit_id')?.enable();

    const projectId = this.BookingData()?.project_id;
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
        parking_no: res.parking_no || null,
        charges: res.charges || null,
        gst: res.gst || null,
        gst_per: res.gst_per || null,
        source_id: res.source_id || null,
        source_detail_id: res.source_detail_id || null,
        channel_partner_id: res.channel_partner_id || null,
        source_description: res.source_description || null,
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

    // Cost-related field changes
    costFields.forEach((field) => {
      this.addBookingForm
        .get(field)
        ?.valueChanges.pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(() => !this.calculationsDisabled())
        )
        .subscribe(() => {
          this.calculateFloorRiseAmount();
          this.updateAgreementCost();
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
          // If parking charges are added to agreement cost, subtract them before calculating rate
          const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
          const addToAgreement = this.addBookingForm.get('is_parking_charges_added')?.value === true;
          const baseAgreementCost = addToAgreement && parkingCharges > 0
            ? agreementCost - parkingCharges
            : agreementCost;
          const calculatedRate = baseAgreementCost / unitId;
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
          // Uncheck checkbox when parking charges are cleared
          this.addBookingForm.get('is_parking_charges_added')?.setValue(false, { emitEvent: false });
          this.updateAgreementCostWithParking();
        }
        // When parking_charges > 0, checkbox remains unchecked by default
        // User must manually check it to add parking_charges to agreement_cost
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
        // Calculate base agreement cost (rate * unitId + floorRiseAmount)
        this.calculateFloorRiseAmount();
        const rate = this.getFormValueAsNumber('rate');
        const unitId = this.getFormValueAsNumber('unit_id');
        const floorRiseAmount = this.getFormValueAsNumber('floor_rise_amt') || 0;

        if (!unitId || !rate) return;

        const baseAgreementCost = rate * unitId + floorRiseAmount;
        const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
        const isChecked = this.addBookingForm.get('is_parking_charges_added')?.value === true;

        // Calculate final agreement cost: add parking charges if checkbox is checked
        const finalAgreementCost = isChecked && parkingCharges > 0
          ? baseAgreementCost + parkingCharges
          : baseAgreementCost;

        // Update agreement cost without triggering valueChanges to prevent rate recalculation
        this.calculationsDisabled.set(true);
        this.addBookingForm.get('agreement_cost')?.setValue(finalAgreementCost.toFixed(0), { emitEvent: false });
        this.calculationsDisabled.set(false);

        // Recalculate taxes with the updated agreement cost
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
   * Update agreement cost with parking consideration
   */
  private updateAgreementCostWithParking(): void {
    const rate = this.getFormValueAsNumber('rate');
    const unitId = this.getFormValueAsNumber('unit_id');
    const floorRiseAmount = this.getFormValueAsNumber('floor_rise_amt') || 0;

    if (!unitId || !rate) return;

    const baseCost = rate * unitId + floorRiseAmount;
    const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
    const addToAgreement = this.addBookingForm.get('is_parking_charges_added')?.value === true;

    // Calculate final agreement cost: add parking charges if checkbox is checked
    const finalAgreementCost =
      addToAgreement && parkingCharges > 0 ? baseCost + parkingCharges : baseCost;

    // Update agreement cost without triggering valueChanges to prevent rate recalculation
    const agreementCostControl = this.addBookingForm.get('agreement_cost');
    if (agreementCostControl) {
      agreementCostControl.setValue(finalAgreementCost.toFixed(0), { emitEvent: false });
    }
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
    // Use Math.round(duty) to avoid floating point precision issues that can cause 
    // Math.ceil to jump to the next 100 (e.g., 700000.0000001 becoming 700100)
    return Math.ceil(Math.round(duty) / 100) * 100;
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
        is_parking_charges_added: false,
        tentative_loan_amount: null,
      },
      { emitEvent: false }
    );
    this.calculationsDisabled.set(false);
    this.triggerCalculations();
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.addBookingForm.reset();
    this.stateService.clearState();
  }

  /**
   * Fetch agreement percentage (public method for parent component)
   */
  fetchAllAgreementPercentage(): void {
    const bookingData = this.BookingData();
    if (bookingData?.booking_id) {
      this.stateService.fetchAgreementPercentage(bookingData.booking_id);
    }
  }

  /**
   * Submit booking
   */
  submitBooking(): void {
    const formValue = this.addBookingForm.getRawValue();
    const bookingData = this.BookingData();

    const formatDate = (date: any) => {
      if (!date) return null;
      const d = new Date(date);
      if (isNaN(d.getTime())) return null;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const payload = {
      booking_id: bookingData?.booking_id,
      user_id: this.userId,
      source_id: formValue.source_id,
      closed_by: formValue.closed_by,
      source_detail_id: formValue.source_detail_id,
      source_executive_id: formValue.source_executive_id,
      channel_partner_id: formValue.channel_partner_id,
      floor_unit_id: formValue.floor_unit_id,
      source_description: formValue.source_description,
      remark: formValue.remark,
      wing_id: formValue.wing_id,
      parking_type_id: formValue.parking_type_id,
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
      idc_gst: formValue.idc_gst,
      agreement_cost: formValue.agreement_cost,
      gst: formValue.gst,
      unit_type: formValue.unit_type,
      stamp_duty: formValue.stamp_duty,
      parking_no: formValue.parking_no,
      charges: formValue.charges,
      reg: formValue.reg,
      society_for: formValue.society_for,
      legal: formValue.legal,
      maintenance: formValue.maintenance,
      maintanace_gst: formValue.maintanace_gst,
      corpus: formValue.corpus,
      clubhouse_amount: formValue.clubhouse_amount,
      clubhouse_gst: formValue.clubhouse_gst,
      other: formValue.other,
      package_total: formValue.package_total,
      is_parking_charges_added: formValue.is_parking_charges_added === true ? 1 : 0,
      package_total_with_parking: formValue.package_total_with_parking,
      enter_package: formValue.enter_package,
      offer_name: formValue.offer_name,
      parking_charges: formValue.parking_charges,
      tentative_loan_amount: formValue.tentative_loan_amount,
      home_loan_doc_submission_date: formatDate(formValue.home_loan_doc_submission_date),
      tax_payment_completion_date: formatDate(formValue.tax_payment_completion_date),
      own_contribution_payment_date: formatDate(formValue.own_contribution_payment_date),
      agreement_completion_date: formatDate(formValue.agreement_completion_date),
      disbursement_completion_date: formatDate(formValue.disbursement_completion_date),
      type_of_payment: formValue.type_of_payment,

      home_loan_amount: formValue.home_loan_amount,
      created_by: this.userId,
    };

    this.bookingService
      .updateBooking(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          // Automatically add payment after booking is updated
          this.addPayment();

          this.dialog
            .open(SuccessDialogComponent, {
              data: { message: res.message },
            })
            .afterClosed()
            .subscribe(() => {
              this.router.navigate(['/salesManagement/site-bookings'], {
                state: {
                  data: bookingData?.project_id,
                  extraText: 'BookingSuccess',
                },
              });
            });

          this.addBookingForm.reset();
          this.addBookingPaymentForm.reset();
        },
        error: () => {
          this.snackBar.open('Failed to process booking.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  fetchAssignedProjects(projectId: number | string): void {
    this.stateService.fetchAssignedProjects(projectId);
  }

  /**
   * Add payment for the booking
   */
  addPayment(): void {
    if (this.addBookingPaymentForm.invalid || this.isSubmittingPayment()) return;

    const bookingId = this.BookingData()?.booking_id;
    if (!bookingId) {
      this.snackBar.open('Booking ID is required', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmittingPayment.set(true);
    const fv = this.addBookingPaymentForm.getRawValue();

    const payload: AddBookingPaymentPayload = {
      booking_amount: fv.booking_amount?.toString() || '0',
      payment_mode: fv.payment_mode_id ?? null,
      transaction_no: fv.cheque_no || '',
      transaction_date: fv.cheque_date
        ? this.datePipe.transform(fv.cheque_date, 'yyyy-MM-dd') || null
        : null,
      booking_id: bookingId,
      bank_id: fv.bank_name_id ?? null,
      created_by: this.userId,
      bank_details: fv.bank_details || null,
    };

    this.bookingService
      .addBookingPayment(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success || response.message) {
            this.hasPaymentBeenAdded.set(true);
          }
          this.isSubmittingPayment.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to add payment', 'Close', { duration: 3000 });
          this.isSubmittingPayment.set(false);
        },
      });
  }

  /**
   * Load existing payment details for this booking
   */
  private loadBookingPaymentDetails(bookingId: number): void {
    this.bookingService
      .fetchBookingPaymentDetails(bookingId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.snackBar.open('Failed to load payment details', 'Close', { duration: 3000 });
          return EMPTY;
        })
      )
      .subscribe((payments: any[]) => {
        if (payments && payments.length > 0) {
          const latest = payments.sort((a: any, b: any) => b.payment_deatil_id - a.payment_deatil_id)[0];
          this.addBookingPaymentForm.patchValue({
            booking_amount: latest.booking_amount?.toString() || null,
            payment_mode_id: latest.payment_mode,
            cheque_no: latest.transaction_no,
            cheque_date: latest.transaction_date,
            bank_name_id: latest.bank_id,
            created_by: latest.created_by,
            bank_details: latest.bank_details,
          });
          this.hasPaymentBeenAdded.set(true);
        }
      });
  }

  private getFormattedDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

}
