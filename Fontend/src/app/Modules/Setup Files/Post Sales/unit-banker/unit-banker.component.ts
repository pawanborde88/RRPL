import { CommonModule, DatePipe } from '@angular/common';
import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ViewChild, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  DestroyRef,
  signal,
  computed,
  effect,
  inject
} from '@angular/core';
import { 
  FormControl, 
  FormGroup, 
  FormsModule, 
  ReactiveFormsModule, 
  Validators,
  AbstractControl
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../Common/action-column/action-column.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { ReciptBankMasterSComponent } from '../Project Bank Master/Receipt Bank Master List/recipt-bank-master-s/recipt-bank-master-s.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  finalize,
  tap,
  EMPTY
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UnitBankerService, Project, Wing, Unit, BankerType, LoanStatus, PreferredBank, BookingData, ApiResponse } from './unit-banker.service';
import { AmountDirective } from '../../../../Common/Amount Direcitve/amount.directive';

@Component({
  selector: 'app-unit-banker',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AmountDirective,
    ActionColumnComponent,
    AutocompleteReusableComponent,
    ReciptBankMasterSComponent
  ],
  templateUrl: './unit-banker.component.html',
  styleUrl: './unit-banker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitBankerComponent implements OnInit, OnDestroy {
  // Dependency injection using inject()
  private readonly unitBankerService = inject(UnitBankerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<UnitBankerComponent>, { optional: true });
  private readonly datePipe = new DatePipe('en-US');
  private readonly userId = Number(sessionStorage.getItem('session_id') || '0');
  private readonly dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  
  // Edit mode flag
  private unitBankerId: number | null = null;
  isEditMode = signal(false);
  private pendingUnitBankerData: any = null;
  unitBankerDisplayData = signal<any>(null);

  // Signals for reactive state management
  selectedTabIndex = signal(0);
  loading = signal(false);
  selectedFile = signal<File | null>(null);
  
  // State signals
  projectsList = signal<Project[]>([]);
  allWingslist = signal<Wing[]>([]);
  allUnitNoList = signal<Unit[]>([]);
  allLoanStatusList = signal<LoanStatus[]>([]);
  allBankerTypeList = signal<BankerType[]>([]);
  preferredBankDropdown = signal<PreferredBank[]>([]);

  // Computed signals for derived state
  readonly isFormValid = computed(() => this.addUnitBankerForm.valid);
  readonly isLoading = computed(() => this.loading());

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  /**
   * TrackBy functions for optimized *ngFor rendering
   */
  trackByProjectId = (_index: number, item: Project): number => item.project_id;
  trackByWingId = (_index: number, item: Wing): number => item.wing_id;
  trackByUnitId = (_index: number, item: Unit): number => item.floor_unit_id;
  trackByBankerTypeId = (_index: number, item: BankerType): number => item.banker_type_id;
  trackByLoanStatusId = (_index: number, item: LoanStatus): number => item.loan_status_id;
  trackByPreferredBankId = (_index: number, item: PreferredBank): number => item.preferred_bank_id;

  addUnitBankerForm = new FormGroup({
    project_id: new FormControl<number | null>(this.userId, Validators.required),
    wing_id: new FormControl<number | string | null>('', Validators.required),
    unit_id: new FormControl<Unit | number | null>(null),
    sanction_amount: new FormControl<number | null>(null, Validators.required),
    agreement_amt: new FormControl<number | null>(null),
    own_contribution_pack: new FormControl<number | null>(null),
    own_contribution_agr: new FormControl<number | null>(null),
    package_total_amount: new FormControl<number | null>(null),
    funding_amount: new FormControl<number | null>(null, Validators.required),
    banker_type_id: new FormControl<number | string | null>('', Validators.required),
    bank_id: new FormControl<number | string | null>('', Validators.required),
    branch_name: new FormControl<string | null>(null, Validators.required),
    bank_login_date: new FormControl<Date | null>(null),
    floor_unit_id: new FormControl<number | null>(null),
    parking_charges: new FormControl<number | null>(null),
    other_charges: new FormControl<number | null>(null),
    maintenance_charges: new FormControl<number | null>(null),
    legal_charges: new FormControl<number | null>(null),
    registration_amt: new FormControl<number | null>(null),
    gst_amt: new FormControl<number | null>(null),
    stamp_duty: new FormControl<number | null>(null),
    society_formation_charges: new FormControl<number | null>(null),
    sanction_date: new FormControl<Date | null>(null, Validators.required),
    loan_status_id: new FormControl<number | string | null>('', Validators.required),
    banker_name: new FormControl<string>(''),
    banker_email: new FormControl<string>(''),
    banker_mobile_no: new FormControl<string>(''),
    rate_of_interest: new FormControl<number | null>(null),
    loan_no: new FormControl<string>(''),
    sanction_letter: new FormControl<File | null>(null),
    remark: new FormControl<string>(''),
    created_by: new FormControl<number>(this.userId),
  });

  constructor() {
    // Setup reactive form subscriptions with takeUntilDestroyed
    this.setupFormSubscriptions();
  }

  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchStaticDropdowns();
    
    // Check if dialog data exists (edit mode)
    if (this.dialogData?.unit_banker_id) {
      this.unitBankerId = this.dialogData.unit_banker_id;
      if (this.unitBankerId !== null) {
        this.fetchUnitBankerDetails(this.unitBankerId);
      }
    }
  }
  
  ngOnDestroy(): void {
    // takeUntilDestroyed handles cleanup automatically
  }

  /**
   * Setup reactive form subscriptions with debouncing and optimization
   */
  private setupFormSubscriptions(): void {
    // Project ID changes with debouncing
    this.addUnitBankerForm
      .get('project_id')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(projectId => {
          if (projectId) {
            this.fetchAllWings(projectId);
            return EMPTY;
          }
          return EMPTY;
        }),
        takeUntilDestroyed()
      )
      .subscribe();

    // Wing ID changes with debouncing and switchMap to cancel previous requests
    this.addUnitBankerForm
      .get('wing_id')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(wingId => {
          const projectId = this.addUnitBankerForm.get('project_id')?.value;
          if (wingId && projectId) {
            this.fetchTokenFloorUnitDropdown(projectId, wingId);
          }
          return EMPTY;
        }),
        takeUntilDestroyed()
      )
      .subscribe();

    // Auto-calculate contributions with debouncing
    this.autoCalculateContributions();
  }

  /**
   * Fetch static dropdowns that don't depend on form values
   */
  private fetchStaticDropdowns(): void {
    this.unitBankerService.fetchBankerTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: BankerType[]) => {
          this.allBankerTypeList.set(data);
          this.cdr.markForCheck();
        }
      });

    this.unitBankerService.fetchLoanStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: LoanStatus[]) => {
          this.allLoanStatusList.set(data);
          this.cdr.markForCheck();
        }
      });

    this.unitBankerService.fetchPreferredBanks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: PreferredBank[]) => {
          this.preferredBankDropdown.set(data);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Automatically calculates contribution amounts with debouncing
   */
  private autoCalculateContributions(): void {
    this.addUnitBankerForm.valueChanges.pipe(
      debounceTime(100), // Debounce to avoid excessive calculations
      distinctUntilChanged((prev, curr) => 
        prev.funding_amount === curr.funding_amount &&
        prev.package_total_amount === curr.package_total_amount &&
        prev.agreement_amt === curr.agreement_amt
      ),
      takeUntilDestroyed()
    ).subscribe((form: any) => {
      const sanction = form.funding_amount || 0;
      const packageTotal = form.package_total_amount || 0;
      const agreement = form.agreement_amt || 0;

      this.addUnitBankerForm.patchValue(
        {
          own_contribution_pack: packageTotal - sanction,
          own_contribution_agr: agreement - sanction,
        },
        { emitEvent: false }
      );
    });
  }

  onTabChange(event: any): void {
    this.selectedTabIndex.set(event.index);
  }

  handleTableAction(event: { row: any; action: string }): void {
    if (event.action === 'delete') {
      this.deleteProject(event.row);
    }
  }

  deleteProject(Id: any): void {
    // Implementation for delete
  }

  /**
   * Handles file selection for sanction letter upload
   */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  /**
   * Submits the form data to create a new unit banker record
   */
  onSubmit(): void {
    if (this.addUnitBankerForm.invalid) {
      this.markFormGroupTouched(this.addUnitBankerForm);
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }
    
    const formData = this.buildFormData();
    this.loading.set(true);
    
    this.unitBankerService.submitUnitBanker(formData)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: ApiResponse<any>) => {
          if (res.success) {
            if (res.code === 201) {
              this.snackBar.open(res.message || 'Record updated successfully', 'Close', { duration: 3000 });
            } else {
              this.addUnitBankerForm.reset();
              this.dialog.open(SuccessDialogComponent, {
                data: { message: res.message || 'Record added successfully' },
              });
            }
            this.dialogRef?.close(true);
          }
        }
      });
  }

  /**
   * Builds FormData from form controls
   */
  private buildFormData(): FormData {
    const formData = new FormData();
    
    // Add unit_banker_id if in edit mode
    if (this.unitBankerId) {
      formData.append('unit_banker_id', this.unitBankerId.toString());
    }
    
    Object.keys(this.addUnitBankerForm.controls).forEach(key => {
      const control = this.addUnitBankerForm.get(key);
      const value = control?.value;

      if (key === 'sanction_letter') {
        return; // Skip file field, handled separately
      }

      if (key === 'unit_id' && value) {
        const unitId = typeof value === 'object' && 'floor_unit_id' in value 
          ? value.floor_unit_id 
          : value;
        formData.append('unit_id', unitId.toString());
        return;
      }

      if (key === 'sanction_date' || key === 'bank_login_date') {
        const formattedDate = value ? this.datePipe.transform(value, 'yyyy-MM-dd') : '';
        formData.append(key, formattedDate || '');
      } else {
        formData.append(key, value !== null && value !== undefined ? value.toString() : '');
      }
    });

    const file = this.selectedFile();
    if (file) {
      formData.append('sanction_letter', file);
    }

    return formData;
  }

  /**
   * Marks all form controls as touched for validation display
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  /**
   * Fetches all projects for the dropdown
   */
  fetchAllProjects(): void {
    this.unitBankerService.fetchProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: Project[]) => {
          this.projectsList.set(res);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Fetches units for the selected project and wing
   */
  fetchTokenFloorUnitDropdown(projectId: number | string, wingId: number | string): void {
    this.loading.set(true);
    
    this.unitBankerService.fetchUnits(projectId, wingId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: { data: any[] }) => {
          const units = res.data.map((item: any) => ({
            ...item,
            full_name: `${item.floor_unit} - ${item.applicant_name}`
          }));
          this.allUnitNoList.set(units);
          this.cdr.markForCheck();
          
          // If in edit mode and we have pending data, populate the form now
          if (this.isEditMode() && this.pendingUnitBankerData) {
            this.applyPendingUnitBankerData();
          }
        }
      });
  }

  /**
   * Fetches wings for the selected project
   */
  fetchAllWings(projectId: number): void {
    this.unitBankerService.fetchWings(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: Wing[]) => {
          this.allWingslist.set(res);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Handles unit selection and populates form with booking data
   */
  onUniTypeChange(selectedUnit: Unit): void {
    if (!selectedUnit?.booking_id) return;
  
    this.loading.set(true);
    
    this.unitBankerService.fetchBookingData(selectedUnit.booking_id)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: ApiResponse<BookingData>) => {
          if (res.success && res.data) {
            this.populateFormFromBookingData(res.data, selectedUnit);
          }
        }
      });
  }

  /**
   * Populates form with booking data
   */
  private populateFormFromBookingData(bookingData: BookingData, selectedUnit: Unit): void {
    this.addUnitBankerForm.patchValue({
      agreement_amt: bookingData.agreement_cost,
      package_total_amount: bookingData.package_total,
      sanction_amount: bookingData.sanction_amt,
      funding_amount: bookingData.funding_amt,
      gst_amt: bookingData.gst,
      stamp_duty: bookingData.stamp_duty,
      registration_amt: bookingData.reg,
      society_formation_charges: bookingData.society_for,
      legal_charges: bookingData.legal,
      maintenance_charges: bookingData.maintenance,
      parking_charges: bookingData.parking_charges,
      other_charges: bookingData.other,
      sanction_date: bookingData.sanction_letter_date ? new Date(bookingData.sanction_letter_date) : null,
      loan_status_id: bookingData.loan_status,
      banker_type_id: bookingData.banker_type,
      floor_unit_id: selectedUnit.floor_unit_id,
    });
  }

  /**
   * Fetches unit banker details for editing
   */
  private fetchUnitBankerDetails(unitBankerId: number): void {
    this.loading.set(true);
    
    this.unitBankerService.fetchUnitBankerDetails(unitBankerId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any[]) => {
          if (response) {
            const data = response[0];
            this.populateFormFromUnitBankerData(data);
          } else {
            this.snackBar.open('No data found', 'Close', { duration: 3000 });
          }
        },
        error: () => {
          this.snackBar.open('Unable to fetch unit banker details', 'Close', { duration: 3000 });
        }
      });
  }

  /**
   * Populates form with unit banker data
   */
  private populateFormFromUnitBankerData(data: any): void {
    this.isEditMode.set(true);
    this.unitBankerDisplayData.set(data);
    this.pendingUnitBankerData = data;
    
    // First, set project and wing to trigger dropdown loading
    const projectId = data.project_id;
    const wingId = data.wing_id;
    const unitId = data.unit_id;
    
    // Fetch wings first
    if (projectId) {
      this.unitBankerService.fetchWings(projectId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res: Wing[]) => {
            this.allWingslist.set(res);
            this.cdr.markForCheck();
            
            // After wings are loaded, set wing_id and fetch units
            this.addUnitBankerForm.patchValue({
              project_id: projectId,
              wing_id: wingId,
              unit_id: unitId
            }, { emitEvent: false });
            
            if (wingId) {
              this.fetchTokenFloorUnitDropdown(projectId, wingId);
            }
          }
        });
    }
  }

  /**
   * Applies pending unit banker data after units are loaded
   */
  private applyPendingUnitBankerData(): void {
    if (!this.pendingUnitBankerData) return;
    
    const data = this.pendingUnitBankerData;
    
    // Find the unit in the loaded units list
    const unitObj: Unit | undefined = this.allUnitNoList().find(
      unit => unit.floor_unit_id === data.unit_id
    ) || {
      floor_unit_id: data.unit_id,
      floor_unit: data.floor_unit,
      applicant_name: data.applicant_name,
      booking_id: data.booking_id,
      full_name: `${data.floor_unit} - ${data.applicant_name}`
    };

    this.addUnitBankerForm.patchValue({
      unit_id: unitObj,
      sanction_amount: data.sanction_amount && data.sanction_amount.toString() !== 'undefined' ? data.sanction_amount : null,
      agreement_amt: data.agreement_cost,
      own_contribution_pack: data.own_contribution_pack,
      own_contribution_agr: data.own_contribution_agr,
      package_total_amount: data.package_total,
      funding_amount: data.funding_amount,
      banker_type_id: data.banker_type_id,
      bank_id: data.bank_id,
      branch_name: data.branch_name,
      bank_login_date: data.bank_login_date && data.bank_login_date !== '0000-00-00' ? new Date(data.bank_login_date) : null,
      parking_charges: data.parking_charges || 0,
      other_charges: data.other_charges || 0,
      maintenance_charges: data.maintenance,
      legal_charges: data.legal,
      registration_amt: data.reg,
      gst_amt: data.gst,
      stamp_duty: data.stamp_duty,
      society_formation_charges: data.society_for || 0,
      sanction_date: data.sanction_date && data.sanction_date !== '0000-00-00' ? new Date(data.sanction_date) : null,
      loan_status_id: data.loan_status_id,
      banker_name: data.banker_name,
      banker_email: data.banker_email,
      banker_mobile_no: data.banker_mobile_no,
      rate_of_interest: data.rate_of_interest,
      loan_no: data.loan_no,
      remark: data.remark,
      floor_unit_id: data.unit_id
    }, { emitEvent: false });
    
    this.pendingUnitBankerData = null;
    this.cdr.markForCheck();
  }
}
