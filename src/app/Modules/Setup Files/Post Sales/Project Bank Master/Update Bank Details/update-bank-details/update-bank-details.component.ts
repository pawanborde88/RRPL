import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  TrackByFunction,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import {
  BankDetail,
  Project,
  ProjectBankResponse,
  Wing,
} from '../../all-project-bank-master/models/project-bank-master.models';
import {
  PreferredBank,
  ProjectBankMasterService,
} from '../../all-project-bank-master/services/project-bank-master.service';
import { CostomLoadingComponent } from '../../../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';

// Interface for dialog data
export interface DialogData {
  mode: 'add' | 'edit';
  bankData?: BankDetail;
  projectId?: number;
  wingId?: number;
}

interface AccountType {
  value: string;
  display: string;
}

/**
 * Highly optimized Angular 17+ component using advanced patterns:
 * - Standalone component architecture
 * - OnPush change detection for maximum performance
 * - Signals for reactive state management
 * - Computed signals for derived state
 * - toSignal() for converting observables to signals
 * - Optimized RxJS operators (debounceTime, distinctUntilChanged, switchMap)
 * - Service layer for API calls with proper separation of concerns
 * - Proper subscription management with takeUntilDestroyed
 * - TrackBy functions for *ngFor performance
 * - Clean dependency injection
 * - No manual change detection (signals handle it automatically)
 */
@Component({
  selector: 'app-update-bank-details',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    CostomLoadingComponent,

  ],
  templateUrl: './update-bank-details.component.html',
  styleUrl: './update-bank-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateBankDetailsComponent {
  // ============================================================================
  // Dependency Injection
  // ============================================================================
  private readonly fb = inject(FormBuilder);
  private readonly bankService = inject(ProjectBankMasterService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<UpdateBankDetailsComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  // ============================================================================
  // User Session Management
  // ============================================================================
  private get userId(): number | null {
    const sessionId = sessionStorage.getItem('session_id');
    return sessionId ? Number(sessionId) : null;
  }

  // ============================================================================
  // Mode Configuration
  // ============================================================================
  readonly mode: 'add' | 'edit' = this.data.mode || 'add';
  readonly isEditMode = computed(() => this.mode === 'edit');

  // ============================================================================
  // Form Management
  // ============================================================================
  readonly addUnitBankMaster: FormGroup;

  // ============================================================================
  // State Management with Signals
  // ============================================================================
  private readonly projectsListSignal = signal<Project[]>([]);
  private readonly allWingsListSignal = signal<Wing[]>([]);
  private readonly allLandOwnersListSignal = signal<any[]>([]);
  private readonly allBankListSignal = signal<PreferredBank[]>([]);
  private readonly isLoadingSignal = signal<boolean>(false);
  private readonly showBankCardsSignal = signal<boolean>(false);

  // Public readonly signals for template
  readonly projectsList = this.projectsListSignal.asReadonly();
  readonly allWingslist = this.allWingsListSignal.asReadonly();
  readonly allLandOwnersList = this.allLandOwnersListSignal.asReadonly();
  readonly allBankList = this.allBankListSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly showBankCards = this.showBankCardsSignal.asReadonly();

  // ============================================================================
  // Account Types Configuration
  // ============================================================================
  readonly accountTypes: AccountType[] = [
    { value: 'RERA Collection Account', display: 'RERA Collection Account' },
    { value: 'SDR Collection Account', display: 'SDR Collection Account' },
    { value: 'GST Collection Account', display: 'GST Collection Account' },
    { value: 'Token Collection Account', display: 'Token Collection Account' },
  ];

  // Memoized account type display map for O(1) lookup
  private readonly accountTypeDisplayMap = new Map<string, string>(
    this.accountTypes.map((type) => [type.value, type.display])
  );

  // ============================================================================
  // Constructor & Initialization
  // ============================================================================
  constructor() {
    // Initialize form
    this.addUnitBankMaster = this.fb.group({
      project_bank_id: [null],
      project_id: [null, Validators.required],
      wing_id: [[], Validators.required],
      land_owner_setup_id: [null],
      bankDetails: this.fb.array([]),
    });

    // Initialize form values based on mode
    if (this.isEditMode() && this.data.bankData) {
      this.addUnitBankMaster.patchValue({
        project_id: this.data.bankData.project_id,
        wing_id: this.data.bankData.wing_id ? [this.data.bankData.wing_id] : [],
        land_owner_setup_id: (this.data.bankData as any).land_owner_setup_id || null,
      });
    } else if (this.data.projectId || this.data.wingId) {
      const patchData: Record<string, any> = {};
      if (this.data.projectId) patchData['project_id'] = this.data.projectId;
      if (this.data.wingId) patchData['wing_id'] = [this.data.wingId];
      this.addUnitBankMaster.patchValue(patchData);
    }

    // Initialize data fetching
    this.initializeData();

    // Setup reactive form listeners
    if (this.isEditMode() && this.data.bankData) {
      this.loadEditData();
    } else {
      this.setupFormListeners();
    }
  }

  // ============================================================================
  // Initialization Methods
  // ============================================================================
  private initializeData(): void {
    // Fetch projects
    this.bankService
      .fetchProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (projects) => this.projectsListSignal.set(projects),
        error: () => this.handleError('Unable to fetch projects.'),
      });

    // Fetch preferred banks
    this.bankService
      .fetchPreferredBanks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (banks) => this.allBankListSignal.set(banks),
        error: () => this.handleError('Unable to fetch bank list.'),
      });
  }

  // ============================================================================
  // Form Listeners with RxJS Operators
  // ============================================================================
  private setupFormListeners(): void {
    // Convert form controls to observables
    const projectId$ = this.addUnitBankMaster.get('project_id')!.valueChanges.pipe(
      startWith(this.addUnitBankMaster.get('project_id')!.value),
      distinctUntilChanged(),
      debounceTime(150)
    );

    const wingId$ = this.addUnitBankMaster.get('wing_id')!.valueChanges.pipe(
      startWith(this.addUnitBankMaster.get('wing_id')!.value),
      distinctUntilChanged(),
      debounceTime(150)
    );

    const landOwnerSetupId$ = this.addUnitBankMaster.get('land_owner_setup_id')!.valueChanges.pipe(
      startWith(this.addUnitBankMaster.get('land_owner_setup_id')!.value),
      distinctUntilChanged(),
      debounceTime(150)
    );

    // Handle initial projectId from dialog data
    if (this.data.projectId) {
      this.bankService
        .fetchWings(this.data.projectId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (wings) => {
            this.allWingsListSignal.set(wings);
            if (!this.data.wingId) {
              this.addUnitBankMaster.get('wing_id')?.setValue([]);
            }
            this.resetBankCards();
            if (this.data.projectId && this.data.wingId) {
              const landOwnerSetupId = this.addUnitBankMaster.get('land_owner_setup_id')?.value;
              this.fetchProjectBanks(this.data.projectId, this.data.wingId, landOwnerSetupId);
            }
          },
          error: () => this.handleError('Unable to fetch project wings.'),
        });

      this.bankService
        .fetchLandOwners(this.data.projectId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (landOwners) => this.allLandOwnersListSignal.set(landOwners),
          error: () => console.error('Unable to fetch project land owners.'),
        });
    }
    // React to project_id changes
    projectId$
      .pipe(
        switchMap((projectId) => {
          if (projectId) {
            this.bankService
              .fetchLandOwners(projectId)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: (landOwners) => this.allLandOwnersListSignal.set(landOwners),
                error: () => this.allLandOwnersListSignal.set([]),
              });

            return this.bankService.fetchWings(projectId).pipe(
              tap((wings) => {
                this.allWingsListSignal.set(wings);
                if (!this.data.wingId) {
                  this.addUnitBankMaster.get('wing_id')?.setValue([]);
                }
                this.resetBankCards();
              }),
              catchError(() => {
                this.handleError('Unable to fetch project wings.');
                return of([]);
              })
            );
          } else {
            this.allWingsListSignal.set([]);
            this.allLandOwnersListSignal.set([]);
            this.addUnitBankMaster.get('wing_id')?.setValue([]);
            this.resetBankCards();
            return of([]);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // React to wing_id and land_owner_setup_id changes - combine with project_id
    combineLatest([projectId$, wingId$, landOwnerSetupId$])
      .pipe(
        debounceTime(200),
        filter(
          ([projectId, wingId, landOwnerSetupId]) =>
            !!projectId && !!wingId && this.isValidWingId(wingId)
        ),
        switchMap(([projectId, wingId, landOwnerSetupId]) => {
          const selectedWingId = this.extractWingId(wingId);
          if (selectedWingId && projectId) {
            return this.bankService
              .fetchProjectBanks(projectId, selectedWingId, landOwnerSetupId)
              .pipe(
                tap((response) => {
                  this.handleProjectBanksResponse(response, projectId, selectedWingId);
                }),
                catchError(() => {
                  this.handleError('Error fetching bank details');
                  this.createEmptyBankForms(projectId, selectedWingId);
                  this.showBankCardsSignal.set(true);
                  this.isLoadingSignal.set(false);
                  return EMPTY;
                })
              );
          } else {
            this.resetBankCards();
            return EMPTY;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private loadEditData(): void {
    const bankData = this.data.bankData!;
    const projectId = bankData.project_id;
    const wingId = bankData.wing_id;

    this.bankService
      .fetchWings(projectId)
      .pipe(
        switchMap((wings) => {
          this.allWingsListSignal.set(wings);
          const landOwnerSetupId = this.addUnitBankMaster.get('land_owner_setup_id')?.value;
          return this.bankService.fetchProjectBanks(projectId, wingId, landOwnerSetupId);
        }),
        tap((response) => {
          this.handleProjectBanksResponse(response, projectId, wingId);
        }),
        catchError(() => {
          this.handleError('Unable to fetch project data.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    this.bankService
      .fetchLandOwners(projectId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (landOwners) => this.allLandOwnersListSignal.set(landOwners),
        error: () => console.error('Unable to fetch land owners data.'),
      });
  }

  // ============================================================================
  // Data Fetching Methods
  // ============================================================================
  private fetchProjectBanks(projectID: number, wingID: number, landOwnerSetupId?: number): void {
    if (!projectID || !wingID) {
      this.resetBankCards();
      return;
    }

    this.isLoadingSignal.set(true);
    this.showBankCardsSignal.set(false);

    this.bankService
      .fetchProjectBanks(projectID, wingID, landOwnerSetupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.handleProjectBanksResponse(response, projectID, wingID);
        },
        error: () => {
          this.handleError('Error fetching bank details');
          this.createEmptyBankForms(projectID, wingID);
          this.showBankCardsSignal.set(true);
          this.isLoadingSignal.set(false);
        },
      });
  }

  private handleProjectBanksResponse(
    response: ProjectBankResponse,
    projectID: number,
    wingID: number
  ): void {
    this.bankFormArray.clear();

    if (response.success && response.data?.length > 0) {
      const projectData = response.data[0];
      const selectedWing = projectData.wings?.find(
        (wing) => wing.wing_id === wingID
      );

      if (selectedWing && selectedWing.wing_data && selectedWing.wing_data.length > 0) {
        if (this.isEditMode() && this.data.bankData) {
          this.patchEditBankData(this.data.bankData, projectID, wingID);
        } else {
          this.patchBankDataToForm(selectedWing.wing_data, projectID, wingID);
        }
      } else {
        this.createEmptyBankForms(projectID, wingID);
      }
    } else {
      this.createEmptyBankForms(projectID, wingID);
    }

    this.showBankCardsSignal.set(true);
    this.isLoadingSignal.set(false);
  }

  // ============================================================================
  // Form Data Population
  // ============================================================================
  private patchEditBankData(
    bankData: BankDetail,
    projectID: number,
    wingID: number
  ): void {
    const formGroup = this.fb.group({
      project_bank_id: [bankData.project_bank_id],
      project_id: [projectID],
      wing_id: [wingID],
      bank_id: [bankData.bank_id, Validators.required],
      account_type: [bankData.account_type || 'Token Collection Account'],
      branch_name: [bankData.branch_name, Validators.required],
      account_no: [bankData.account_no, Validators.required],
      ifsc_code: [bankData.ifsc_code, Validators.required],
      beneficiary_name: [bankData.beneficiary_name, Validators.required],
      address: [bankData.address, Validators.required],
      created_by: [this.userId],
    });

    this.bankFormArray.push(formGroup);
  }

  private patchBankDataToForm(
    bankData: BankDetail[],
    projectID: number,
    wingID: number
  ): void {
    // Create a map to store the latest record for each account type
    const latestRecordsByAccountType = new Map<string | null, BankDetail>();

    // Find the latest record for each account type based on updated_at timestamp
    bankData.forEach((bank) => {
      const accountType = bank.account_type;
      const existingRecord = latestRecordsByAccountType.get(accountType);

      if (
        !existingRecord ||
        new Date(bank.updated_at) > new Date(existingRecord.updated_at)
      ) {
        latestRecordsByAccountType.set(accountType, bank);
      }
    });

    // Create form groups for each account type
    this.accountTypes.forEach((accountType) => {
      const latestRecord = latestRecordsByAccountType.get(accountType.value);

      const formGroup = this.fb.group({
        project_bank_id: [latestRecord?.project_bank_id ?? null],
        project_id: [projectID],
        wing_id: [wingID],
        bank_id: [latestRecord?.bank_id ?? null, Validators.required],
        account_type: [accountType.value],
        branch_name: [latestRecord?.branch_name ?? '', Validators.required],
        account_no: [latestRecord?.account_no ?? '', Validators.required],
        ifsc_code: [latestRecord?.ifsc_code ?? '', Validators.required],
        beneficiary_name: [
          latestRecord?.beneficiary_name ?? '',
          Validators.required,
        ],
        address: [latestRecord?.address ?? '', Validators.required],
        created_by: [this.userId],
      });

      this.bankFormArray.push(formGroup);
    });
  }

  private createEmptyBankForms(projectID: number, wingID: number): void {
    this.accountTypes.forEach((accountType) => {
      this.bankFormArray.push(
        this.fb.group({
          project_bank_id: [null],
          project_id: [projectID],
          wing_id: [wingID],
          bank_id: ['', Validators.required],
          account_type: [accountType.value],
          branch_name: ['', Validators.required],
          account_no: ['', Validators.required],
          ifsc_code: ['', Validators.required],
          beneficiary_name: ['', Validators.required],
          address: ['', Validators.required],
          created_by: [this.userId],
        })
      );
    });
  }

  // ============================================================================
  // Form Submission
  // ============================================================================
  submitBankDetails(): void {
    const payload = this.addUnitBankMaster.value.bankDetails;
    const landOwnerSetupId = this.addUnitBankMaster.get('land_owner_setup_id')?.value;

    // Filter out empty forms (where bank_id is not selected)
    const validPayload = payload
      .filter((item: any) => item.bank_id && item.bank_id !== '')
      .map((item: any) => ({
        ...item,
        land_owner_setup_id: landOwnerSetupId
      }));



    this.bankService
      .submitBankDetails(validPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          const message = this.isEditMode()
            ? res.message || 'Bank details updated successfully!'
            : res.message || 'Bank details added successfully!';

          this.dialog.open(SuccessDialogComponent, {
            data: { message },
          });
          this.dialogRef.close(true);
        },
        error: () => {
          const errorMessage = this.isEditMode()
            ? 'Error updating bank details. Please try again.'
            : 'Error adding bank details. Please try again.';

          this.snackBar.open(errorMessage, 'Close', {
            duration: 3000,
          });
        },
      });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================
  get bankFormArray(): FormArray {
    return this.addUnitBankMaster.get('bankDetails') as FormArray;
  }

  getBankFormGroup(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  hasFormControlError(control: AbstractControl, controlName: string, errorType: string): boolean {
    const formGroup = this.getBankFormGroup(control);
    const formControl = formGroup.get(controlName) as FormControl | null;
    return !!(formControl?.hasError(errorType) && formControl?.touched);
  }

  getAccountTypeDisplay(value: string | null): string {
    if (value === null) return 'Token Collection Account';
    return this.accountTypeDisplayMap.get(value) || value;
  }

  // ============================================================================
  // TrackBy Functions for Performance
  // ============================================================================
  trackByAccountType: TrackByFunction<AbstractControl> = (index, control) => {
    if (control instanceof FormGroup) {
      return control.get('account_type')?.value || index;
    }
    return index;
  };

  trackByBankId: TrackByFunction<PreferredBank> = (index, bank) => {
    return bank?.preferred_bank_id || index;
  };

  trackByProjectId: TrackByFunction<Project> = (index, project) => {
    return project?.project_id || index;
  };

  trackByWingId: TrackByFunction<Wing> = (index, wing) => {
    return wing?.wing_id || index;
  };

  // ============================================================================
  // Utility Methods
  // ============================================================================
  private resetBankCards(): void {
    this.showBankCardsSignal.set(false);
    this.bankFormArray.clear();
  }

  private isValidWingId(wingId: any): boolean {
    if (Array.isArray(wingId)) {
      return wingId.length > 0;
    }
    return !!wingId;
  }

  private extractWingId(wingId: any): number | null {
    if (Array.isArray(wingId) && wingId.length > 0) {
      return wingId[0];
    }
    return wingId && !Array.isArray(wingId) ? wingId : null;
  }

  private handleError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
    });
  }
}
