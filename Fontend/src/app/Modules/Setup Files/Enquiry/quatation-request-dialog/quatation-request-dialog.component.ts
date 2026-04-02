import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef,
  effect,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, filter, distinctUntilChanged } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { AmountDirective } from '../../../../Common/Amount Direcitve/amount.directive';
import { BookingService } from '../../../../Service/booking.service';
import { BookingCalculationsStateService } from '../../Site Visit/Bookings/booking-calculations/services/booking-calculations.state.service';

export interface QuatationRequestDialogData {
  project_enq_ids: number[];
  rowData?: any[];
}

/**
 * Quotation Request Dialog - Same form, calculations and structure as BookingCalculationsComponent.
 * Calculation logic is identical; no changes to calculation part.
 */
@Component({
  selector: 'app-quatation-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    AmountDirective,
  ],
  providers: [BookingCalculationsStateService],
  templateUrl: './quatation-request-dialog.component.html',
  styleUrl: './quatation-request-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuatationRequestDialogComponent  implements OnInit{
  readonly data = inject<QuatationRequestDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<QuatationRequestDialogComponent>);
  private readonly stateService = inject(BookingCalculationsStateService);
  private readonly bookingService = inject(BookingService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /** Project ID from first selected enquiry row */
  private projectId = 0;


  private calculationsDisabled = signal<boolean>(false);
  readonly userId = Number(sessionStorage.getItem('session_id') || '0');

  readonly floorUnitField = this.stateService.floorUnitField;
  readonly allWingslist = this.stateService.wings;
  readonly sourceDetailedList = this.stateService.sourceDetails;
  readonly sourcesList = this.stateService.sources;
  readonly allChannelPartnerList = this.stateService.channelPartners;
  readonly FloorUnitDropdown = this.stateService.floors;
  readonly confiList = this.stateService.unitTypes;
  readonly UnitNo = this.stateService.floorUnits;

  readonly addBookingForm = new FormGroup({
    user_id: new FormControl(this.userId),
    project_id: new FormControl(),
    unit_type: new FormControl('', Validators.required),
    source_detail_id: new FormControl(''),
    source_executive_id: new FormControl(''),
    channel_partner_id: new FormControl(),
    project_enq_id: new FormControl(this.data?.project_enq_ids?.[0] != null ? String(this.data.project_enq_ids[0]) : ''),
    remark: new FormControl(''),
    based_on_id: new FormControl(0),
    wing_id: new FormControl('', Validators.required),
    floor_id: new FormControl(''),
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
    reg_per: new FormControl(7, Validators.required),
    basic_cost: new FormControl(),
    idc: new FormControl(0, Validators.required),
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
    corpus: new FormControl('', Validators.required),
    other: new FormControl('', Validators.required),
    package_total: new FormControl(),
    enter_package: new FormControl(''),
    offer_name: new FormControl(''),
    created_by: new FormControl(this.userId),
    is_parking_charges_added: new FormControl(false),
  });

  constructor() {
    this.projectId = Number(this.data?.rowData?.[0]?.project_id) || 0;

    this.setupFormCalculations();
    this.setupFloorUnitControlEnabling();

    if (this.projectId) {
      this.addBookingForm.patchValue(
        {
          project_id: this.projectId,
          project_enq_id: this.data?.project_enq_ids?.[0] != null ? String(this.data.project_enq_ids[0]) : '',
        },
        { emitEvent: false }
      );
      this.stateService.fetchAllWings(this.projectId);
      this.stateService.fetchSourcesList();
      this.setupFormControlSubscriptions();
   
    } else {
      this.snackBar.open('Unable to resolve project. Please select enquiries from a valid project.', 'Close', {
        duration: 3000,
      });
    }
  }
  ngOnInit(): void {}

  private setupFloorUnitControlEnabling(): void {
    effect(() => {
      const hasFloorUnits = this.stateService.hasFloorUnits();
      const floorUnitControl = this.addBookingForm.get('floor_unit_id');
      if (!floorUnitControl) return;
      if (hasFloorUnits) {
        floorUnitControl.enable({ emitEvent: false });
      } else {
        const wingId = this.addBookingForm.get('wing_id')?.value;
        const floorId = this.addBookingForm.get('floor_id')?.value;
        const unitType = this.addBookingForm.get('unit_type')?.value;
        if (wingId && floorId && unitType) {
          floorUnitControl.disable({ emitEvent: false });
        }
      }
    });
  }

  private setupFormControlSubscriptions(): void {
    if (!this.projectId) return;
    const projectId = this.projectId;

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

    combineLatest([
      this.addBookingForm.get('wing_id')!.valueChanges,
      this.addBookingForm.get('floor_id')!.valueChanges,
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((t): t is [string, string] => !!t[0] && !!t[1]),
        distinctUntilChanged()
      )
      .subscribe(([wingId, floorId]) => {
        this.stateService.fetchUnitTypes(projectId, wingId, floorId);
        this.resetUnitDetails();
        this.enableUnitTypeControls();
      });

    combineLatest([
      this.addBookingForm.get('wing_id')!.valueChanges,
      this.addBookingForm.get('floor_id')!.valueChanges,
      this.addBookingForm.get('unit_type')!.valueChanges,
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((t): t is [string, string, string] => !!t[0] && !!t[1] && !!t[2]),
        distinctUntilChanged()
      )
      .subscribe(([wingId, floorId, unitType]) => {
        this.stateService.fetchFloorUnits(projectId, wingId, floorId, unitType);
      });

  
  }



  onPartnerSearch(
    searchText: string,
    loadInitialData = false,
    initialPartnerId?: any
  ): void {
    const trimmedSearch = String(searchText || '').trim();
    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.stateService.fetchChannelPartners();
      return;
    }
    this.stateService.fetchChannelPartners(
      loadInitialData ? undefined : trimmedSearch,
      loadInitialData ? initialPartnerId || this.addBookingForm.value.channel_partner_id : undefined
    );
  }


  private updateSourceValidators(sourceId: any): void {
    const channelPartnerControl = this.addBookingForm.get('channel_partner_id');
    const sourceDetailControl = this.addBookingForm.get('source_detail_id');
    channelPartnerControl?.clearValidators();
    sourceDetailControl?.clearValidators();
    if (sourceId === 3 || sourceId === '3') {
      channelPartnerControl?.setValidators(Validators.required);
      sourceDetailControl?.setValidators(null);
    } else {
      channelPartnerControl?.setValidators(null);
      sourceDetailControl?.setValidators(Validators.required);
    }
    channelPartnerControl?.updateValueAndValidity();
    sourceDetailControl?.updateValueAndValidity();
  }

  private enableFloorControls(): void {
    const hasFloors = this.stateService.hasFloors();
    this.addBookingForm.get('floor_id')?.[hasFloors ? 'enable' : 'disable']();
    if (!hasFloors) {
      this.addBookingForm.get('unit_type')?.disable();
      this.addBookingForm.get('floor_unit_id')?.disable();
    }
  }

  private enableUnitTypeControls(): void {
    const hasUnitTypes = this.stateService.hasUnitTypes();
    this.addBookingForm.get('unit_type')?.[hasUnitTypes ? 'enable' : 'disable']();
    if (!hasUnitTypes) {
      this.addBookingForm.get('floor_unit_id')?.reset();
    }
  }





  onUniTypeChange(event: any): void {
    const floor_unit_id = event?.value;
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
              gst_per: res.gst_percent || 5,
              reg_per: res.registration_percent ?? 1,
              reg: res.registration || null,
              society_for: res.society_formation_charges || null,
              legal: res.legal_charges || null,
              maintenance: res.maintenance_charges || null,
              floor_rise_rate: res.floor_rise_amount || null,
              corpus: res.corpus_fund || null,
              other: res.other_charges || null,
              unit_id: res.unit_id,
              package_total: res.package_total || null,
              parking_charges: res.parking_charges || null,
            };
            this.addBookingForm.patchValue(patchData, { emitEvent: false });
            this.calculationsDisabled.set(false);
            this.triggerCalculations();
          }
        },
        error: () => {
          this.snackBar.open('Unable to fetch unit details.', 'Close', { duration: 3000 });
        },
      });
  }

  // --- Form calculations (same as BookingCalculationsComponent; no changes to calculation part) ---

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

    taxFields.forEach((field) => {
      this.addBookingForm
        .get(field)
        ?.valueChanges.pipe(
          takeUntilDestroyed(this.destroyRef),
          filter(() => !this.calculationsDisabled())
        )
        .subscribe(() => this.calculateAllTaxes());
    });

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
          const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
          const addToAgreement = this.addBookingForm.get('is_parking_charges_added')?.value === true;
          const baseAgreementCost =
            addToAgreement && parkingCharges > 0 ? agreementCost - parkingCharges : agreementCost;
          const calculatedRate = baseAgreementCost / unitId;
          this.setFormValue('rate', calculatedRate, false);
        }
        this.calculateAllTaxes();
      });

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

    this.addBookingForm
      .get('is_parking_charges_added')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => !this.calculationsDisabled())
      )
      .subscribe(() => {
        this.calculateFloorRiseAmount();
        const rate = this.getFormValueAsNumber('rate');
        const unitId = this.getFormValueAsNumber('unit_id');
        const floorRiseAmount = this.getFormValueAsNumber('floor_rise_amt') || 0;
        if (!unitId || !rate) return;
        const baseAgreementCost = rate * unitId + floorRiseAmount;
        const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
        const isChecked = this.addBookingForm.get('is_parking_charges_added')?.value === true;
        const finalAgreementCost =
          isChecked && parkingCharges > 0 ? baseAgreementCost + parkingCharges : baseAgreementCost;
        this.calculationsDisabled.set(true);
        this.addBookingForm.get('agreement_cost')?.setValue(finalAgreementCost.toFixed(0), { emitEvent: false });
        this.calculationsDisabled.set(false);
        this.calculateAllTaxes();
      });
  }

  private triggerCalculations(): void {
    setTimeout(() => {
      this.calculateFloorRiseAmount();
      this.updateAgreementCost();
      this.calculateAllTaxes();
    }, 0);
  }

  private calculateFloorRiseAmount(): void {
    const unitId = this.getFormValueAsNumber('unit_id') || 0;
    const floorRiseRate = this.getFormValueAsNumber('floor_rise_rate') || 0;
    const floorRiseAmount = unitId > 0 && floorRiseRate > 0 ? floorRiseRate * unitId : 0;
    this.setFormValue('floor_rise_amt', floorRiseAmount);
  }

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

  private updateAgreementCostWithParking(): void {
    const rate = this.getFormValueAsNumber('rate');
    const unitId = this.getFormValueAsNumber('unit_id');
    const floorRiseAmount = this.getFormValueAsNumber('floor_rise_amt') || 0;
    if (!unitId || !rate) return;
    const baseCost = rate * unitId + floorRiseAmount;
    const parkingCharges = this.getFormValueAsNumber('parking_charges') || 0;
    const addToAgreement = this.addBookingForm.get('is_parking_charges_added')?.value === true;
    const finalAgreementCost =
      addToAgreement && parkingCharges > 0 ? baseCost + parkingCharges : baseCost;
    this.addBookingForm.get('agreement_cost')?.setValue(finalAgreementCost.toFixed(0), { emitEvent: false });
  }

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
    const packageTotalWithParking = parkingCharges > 0 ? packageTotal + parkingCharges : 0;
  }

  private calculateGst(agreementCost: number): number {
    const gstPercent = this.getFormValueAsNumber('gst_per') || 0;
    return agreementCost * (gstPercent / 100);
  }

  private calculateStampDuty(agreementCost: number): number {
    const sdPercent = this.getFormValueAsNumber('sd_per') || 0;
    const duty = agreementCost * (sdPercent / 100);
    return Math.ceil(duty / 100) * 100;
  }

  private calculateRegistrationFee(agreementCost: number): number {
    const regPercent = this.getFormValueAsNumber('reg_per') || 0;
    const fee = agreementCost * (regPercent / 100);
    return Math.min(fee, 30000);
  }

  private getFormValueAsNumber(controlName: string): number {
    const v = this.addBookingForm.get(controlName)?.value;
    return v ? parseFloat(v) : 0;
  }

  private setFormValue(controlName: string, value: number, emitEvent = false): void {
    this.addBookingForm.get(controlName)?.setValue(value.toFixed(0), { emitEvent });
  }

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
        parking_charges: null,
        is_parking_charges_added: false,
      },
      { emitEvent: false }
    );
    this.calculationsDisabled.set(false);
    this.triggerCalculations();
  }

  resetForm(): void {
    this.addBookingForm.reset();
    this.stateService.clearState();
  }


  addQuatationRequest(): void {
    if (this.addBookingForm.invalid) {
      this.addBookingForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly.', 'Close', {
        duration: 3000,
      });
      return;
    }
    const payload = this.addBookingForm.value;
    this.bookingService.addQuatationRequest(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.snackBar.open('Quotation request submitted.', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
    });
  }
}
