import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import {
  catchError,
  distinctUntilChanged,
  EMPTY,
  filter,
  finalize,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';
import {
  EnquiryManagementService,
  ProjectDropdownResponse,
  SourceDropdownResponse,
  SourceDetailDropdownResponse,
  ChannelPartnerDropdownResponse,
  SalesExecutiveDropdownResponse,
  WebConfigDropdownResponse,
} from '../../../Enquiry/services/enquiry-management.service';

interface TokenType {
  token_type_id: number;
  token_type: string;
  amount: number;
  is_highest: number;
}

interface Wing {
  wing_id: number;
  wing_name: string;
}

interface Floor {
  floor_id: number;
  floor_name: string;
}

interface UnitType {
  unit_type: string;
}

interface FloorUnit {
  floor_unit_id: number;
  floor_unit: string;
}

interface Salutation {
  salution_id: number;
  salution: string;
}

interface PaymentMode {
  payment_mode_id: number;
  payment_mode: string;
}

// Extended interfaces for mapped data
interface SourceWithName extends SourceDropdownResponse {
  source: string;
}

interface SourceDetailWithName extends SourceDetailDropdownResponse {
  source_detail: string;
}

interface WebConfigWithFeet extends WebConfigDropdownResponse {
  feet?: string;
}

@Component({
  selector: 'app-add-tokens',
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
  templateUrl: './add-tokens.component.html',
  styleUrl: './add-tokens.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTokensComponent {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly platformId = inject(PLATFORM_ID);
  public readonly dialogData = inject<any>(MAT_DIALOG_DATA, { optional: true });
  private readonly dialogRef = inject(MatDialogRef<AddTokensComponent>, {
    optional: true,
  });
  public readonly isDialog = !!this.dialogData;

  readonly roleId = isPlatformBrowser(this.platformId) ? Number(sessionStorage.getItem('role_id')) : 0;

  private readonly destroyRef = inject(DestroyRef);
  private readonly enquiryService = inject(EnquiryManagementService);
  private readonly baseUrl = environment.API_URL;
  private readonly pipe = new DatePipe('en-US');
  tokenTypeId = signal<number | null>(null);
  tokenID = signal<any>(null);
  elementData = signal<any>(null);
  loading = signal<boolean>(false);
  userId = signal<number>(isPlatformBrowser(this.platformId) ? Number(sessionStorage.getItem('user_id')) : 0);
  tokenPaymentId = signal<number | null>(null);

  projectsList = signal<ProjectDropdownResponse[]>([]);
  salutationDropdown = signal<Salutation[]>([]);
  sourcesList = signal<SourceWithName[]>([]);
  sourceDetailedList = signal<SourceDetailWithName[]>([]);
  allSalesExecutive = signal<SalesExecutiveDropdownResponse[]>([]);
  allPaymentMode = signal<PaymentMode[]>([]);
  allWingslist = signal<Wing[]>([]);
  FloorUnitDropdown = signal<Floor[]>([]);
  confiList = signal<UnitType[]>([]);
  UnitNo = signal<FloorUnit[]>([]);
  allTokenType = signal<TokenType[]>([]);
  preferenceDropdown = signal<WebConfigWithFeet[]>([]);
  allChannelPartnerList = signal<any[]>([]);

  addTokenForm: FormGroup = new FormGroup({
    token_id: new FormControl(''),
    project_id: new FormControl('', [Validators.required]),
    project_enq_id: new FormControl(''),
    user_id: new FormControl(''),
    first_name: new FormControl('', [Validators.required]),
    middle_name: new FormControl(''),
    last_name: new FormControl('', [Validators.required]),
    email_id: new FormControl('', [Validators.required, Validators.email]),
    mob_no: new FormControl('', [
      Validators.required,
      Validators.pattern('^[0-9]{10}$'),
    ]),
    token_date: new FormControl(new Date(), [Validators.required]),
    token_type_id: new FormControl('', [Validators.required]),
    wing_id: new FormControl(''),
    floor_id: new FormControl(''),
    unit_type: new FormControl(''),
    floor_unit_id: new FormControl(''),
    salution_id: new FormControl('', [Validators.required]),
    project_configuration_id: new FormControl([], [Validators.required]),
    token_amount: new FormControl('', [Validators.required, Validators.min(1)]),
    source_id: new FormControl('', [Validators.required]),
    source_detail_id: new FormControl(''),
    channel_partner_id: new FormControl(''),
    source_description: new FormControl(''),
    comment: new FormControl('', [Validators.required]),
    is_agreed: new FormControl(false),
    sales_executive_id: new FormControl('', [Validators.required]),
  });

  isHighestTokenSelected = computed(() => {
    const selectedTypeId = this.tokenTypeId();
    const selectedType = this.allTokenType().find(
      (t) => t.token_type_id == selectedTypeId
    );
    return selectedType?.is_highest === 1;
  });

  constructor() {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    if (this.dialogData) {
      const { token_id, data } = this.dialogData;
      this.tokenID.set(token_id);
      if (data) {
        this.elementData.set(data);
        this.patchFormValues(data);
      }
    } else {
      // Get route params
      this.route.paramMap
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((params) => {
          const tokenId = params.get('token_id');
          this.tokenID.set(tokenId);
        });

      // Get state data
      const stateData = history.state.data;
      if (stateData) {
        this.elementData.set(stateData);
        this.patchFormValues(stateData);
      }
    }

    this.setupFormValueChanges();
    this.fetchInitialData();
    this.onPartnerSearch('', true);

    if (this.tokenID()) {
      this.fetchSingleToken();
    } else if (this.elementData()) {
      this.fetchSingleEnquiry(this.elementData());
    } else {
      this.handleRoleBasedSalesExecutive();
      this.disableRoleBasedFields();
    }
  }

  isSourceFieldsDisabled(): boolean {
    return this.roleId !== 2 && !!this.tokenID();
  }

  private fetchSingleEnquiry(stateData: any): void {
    this.loading.set(true);
    this.enquiryService
      .fetchSingleProjectEnquiry(stateData.project_enq_id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.snackBar.open('Error fetching data, please try later', 'Close', {
            duration: 3000,
          });
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.patchFormValues(res);
            if (res.channel_partner_id) {
              this.onPartnerSearch('', true, res.channel_partner_id);
            }
            if (res.source_id && String(res.source_id) !== '3') {
              this.fetchSourceDetails(res.source_id);
            }
          }
        },
      });
  }

  private patchFormValues(res: any): void {
    this.addTokenForm.patchValue(
      {
        user_id: res.user_id,
        project_id: res.project_id,
        project_enq_id: res.project_enq_id,
        first_name: res.first_name,
        middle_name: res.middle_name,
        last_name: res.last_name,
        email_id: res.email_id,
        mob_no: res.mobile_no || res.mob_no,
        source_detail_id: res.source_detail_id,
        source_description: res.source_description,
        salution_id: res.salution_id || res.salutation_id,
        project_configuration_id: Array.isArray(res.project_configuration_id)
          ? res.project_configuration_id
          : res.project_configuration_id
            ? [res.project_configuration_id]
            : [],
        sales_executive_id:
          this.roleId === 7 ? this.userId() : res.sales_executive_id,
        comment: res.remark || res.comment,
        source_id: res.source_id,
        channel_partner_id: res.channel_partner_id,
        token_date: res.token_date ? new Date(res.token_date) : new Date(),
        token_type_id: res.token_type_id,
        wing_id: res.wing_id,
        floor_id: res.floor_id,
        unit_type: res.unit_type,
        floor_unit_id: res.floor_unit_id,
        token_amount: res.token_amount,
      },
      { emitEvent: false }
    );

    if (res.token_type_id) {
      this.tokenTypeId.set(res.token_type_id);
    }

    this.updateSourceValidators(res.source_id);

    if (res.project_id) {
      this.fetchAllWings(res.project_id);
      this.fetchAllSalesExecutive(res.project_id);
      this.fetchPreferenceDropdown(res.project_id);
      this.setupTokenTypeHandler(res.project_id);
    }
    this.handleRoleBasedSalesExecutive();
    this.disableRoleBasedFields();
  }

  private fetchInitialData(): void {
    this.fetchAllProjects();
    this.fetchSalutationDropdown();
    this.fetchSourceDropdown();
    this.fetchPaymentModeDropdown();
  }

  private setupFormValueChanges(): void {
    // Project changes
    this.addTokenForm
      .get('project_id')
      ?.valueChanges.pipe(
        filter(Boolean),
        distinctUntilChanged(),
        switchMap((projectID) => {
          this.setupTokenTypeHandler(projectID);
          this.fetchAllWings(projectID);
          this.fetchPreferenceDropdown(projectID);
          this.fetchAllSalesExecutive(projectID);
          this.resetDependentFields();
          return of(projectID);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Wing changes
    this.addTokenForm
      .get('wing_id')
      ?.valueChanges.pipe(
        filter(Boolean),
        distinctUntilChanged(),
        switchMap((wingID) => {
          const projectID = this.addTokenForm.get('project_id')?.value;
          if (projectID && wingID) {
            this.fetchallProjectFloors(projectID, wingID);
            this.addTokenForm.get('floor_id')?.reset();
            this.addTokenForm.get('unit_type')?.reset();
            this.addTokenForm.get('floor_unit_id')?.reset();
          }
          return of(wingID);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Floor changes
    this.addTokenForm
      .get('floor_id')
      ?.valueChanges.pipe(
        filter(Boolean),
        distinctUntilChanged(),
        switchMap((floorId) => {
          const projectID = this.addTokenForm.get('project_id')?.value;
          const wingID = this.addTokenForm.get('wing_id')?.value;

          if (projectID && wingID && floorId) {
            this.fetchProjectUnitType(projectID, wingID, floorId);
            this.addTokenForm.get('unit_type')?.reset();
            this.addTokenForm.get('floor_unit_id')?.reset();
          }
          return of(floorId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Unit type changes
    this.addTokenForm
      .get('unit_type')
      ?.valueChanges.pipe(
        filter(Boolean),
        distinctUntilChanged(),
        switchMap((unitType) => {
          const projectID = this.addTokenForm.get('project_id')?.value;
          const wingID = this.addTokenForm.get('wing_id')?.value;
          const floorID = this.addTokenForm.get('floor_id')?.value;

          if (projectID && wingID && floorID && unitType) {
            this.fetchTokenFloorUnitDropdown(
              projectID,
              wingID,
              floorID,
              unitType
            );
            this.addTokenForm.get('floor_unit_id')?.reset();
          }
          return of(unitType);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Source ID changes -> update validators
    this.addTokenForm
      .get('source_id')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sourceID) => {
        this.updateSourceValidators(sourceID);
        if (sourceID && String(sourceID) !== '3') {
          this.fetchSourceDetails(sourceID);
        } else {
          this.sourceDetailedList.set([]);
        }
      });
  }

  private resetDependentFields(): void {
    this.addTokenForm.get('wing_id')?.reset();
    this.addTokenForm.get('floor_id')?.reset();
    this.addTokenForm.get('unit_type')?.reset();
    this.addTokenForm.get('floor_unit_id')?.reset();
  }

  private fetchAllProjects(): void {
    this.loading.set(true);
    this.enquiryService
      .fetchUserProjects(this.userId(), this.roleId)
      .pipe(
        tap((projects) => {
          this.projectsList.set(projects);
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error(err);
          this.loading.set(false);
          this.snackBar.open('Unable to fetch projects.', 'Close', {
            duration: 3000,
          });
          this.cdr.markForCheck();
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchTokenFloorUnitDropdown(
    projectID: any,
    wingID: any,
    floorID: any,
    unitType: any
  ): void {
    this.http
      .post<FloorUnit[]>(`${this.baseUrl}/token_floor_unit_dropdown`, {
        project_id: projectID,
        wing_id: wingID,
        floor_id: floorID,
        unit_type: unitType,
      })
      .pipe(
        tap((res) => {
          this.UnitNo.set(res);
          this.cdr.markForCheck();
        }),
        catchError(() => {
          this.snackBar.open('Unable to fetch floor units.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchSalutationDropdown(): void {
    this.enquiryService
      .fetchSalutations()
      .pipe(
        tap((response) => {
          this.salutationDropdown.set(response);
          this.cdr.markForCheck();
        }),
        catchError((error) => {
          console.error('Error fetching salutationDropdown:', error);
          this.snackBar.open(
            'Unable to fetch salutation dropdown data.',
            'Close',
            { duration: 3000 }
          );
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchAllSalesExecutive(projectID: any): void {
    this.enquiryService
      .fetchSalesExecutives(projectID)
      .pipe(
        tap((res) => {
          this.allSalesExecutive.set(res);
          this.handleRoleBasedSalesExecutive();
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error(err);
          this.snackBar.open('Unable to fetch sales executives.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchPaymentModeDropdown(): void {
    this.http
      .get<PaymentMode[]>(`${this.baseUrl}/payment_mode_dropdown`)
      .pipe(
        tap((response) => {
          this.allPaymentMode.set(response);
          this.cdr.markForCheck();
        }),
        catchError((error) => {
          console.error('Error fetching paymentModeDropdown:', error);
          this.snackBar.open(
            'Unable to fetch payment mode dropdown data.',
            'Close',
            { duration: 3000 }
          );
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchSourceDropdown(): void {
    this.enquiryService
      .fetchSources()
      .pipe(
        tap((response) => {
          this.sourcesList.set(response);
          this.cdr.markForCheck();
        }),
        catchError((error) => {
          console.error('Error fetching sourceDropdown:', error);
          this.snackBar.open('Unable to fetch source dropdown data.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchSourceDetails(sourceId: any): void {
    if (!sourceId) {
      this.sourceDetailedList.set([]);
      return;
    }

    this.enquiryService
      .fetchSourceDetails(sourceId)
      .pipe(
        map((res: any[]) =>
          res.map((item) => ({
            ...item,
            source_detail: item.source_detail || item.firm_name || '',
          }))
        ),
        tap((res) => {
          this.sourceDetailedList.set(res);
          this.cdr.markForCheck();
        }),
        catchError((error) => {
          console.error('Error fetching source details:', error);
          this.snackBar.open('Unable to fetch source details.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchallProjectFloors(projectID: any, wingID: any): void {
    this.http
      .post<Floor[]>(`${this.baseUrl}/fetch_floor_dropdown`, {
        project_id: projectID,
        wing_id: wingID,
      })
      .pipe(
        tap((res) => {
          this.FloorUnitDropdown.set(res);
          this.cdr.markForCheck();
        }),
        catchError(() => {
          this.snackBar.open('Unable to fetch floors.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchProjectUnitType(
    projectID: any,
    wingId: any,
    floorId: any
  ): void {
    const payload = {
      project_id: projectID,
      wing_id: wingId,
      floor_id: floorId,
    };

    this.http
      .post<{ data: UnitType[] }>(`${this.baseUrl}/fetch_unit_type`, payload)
      .pipe(
        tap((res) => {
          this.confiList.set(res.data || []);
          this.cdr.markForCheck();
        }),
        catchError(() => of({ data: [] })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private fetchAllWings(projectID: any): void {
    this.http
      .post<Wing[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectID })
      .pipe(
        tap((res) => {
          this.allWingslist.set(res);
          this.cdr.markForCheck();
        }),
        catchError(() => {
          this.snackBar.open('Unable to fetch project details.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private setupTokenTypeHandler(projectID: any): void {
    if (!projectID) return;

    this.http
      .post<TokenType[]>(`${this.baseUrl}/token_type_dropdown`, {
        project_id: projectID,
      })
      .pipe(
        tap((tokenTypes) => {
          this.allTokenType.set(tokenTypes);

          // Set up listener for token type changes
          this.addTokenForm
            .get('token_type_id')
            ?.valueChanges.pipe(
              distinctUntilChanged(),
              filter(Boolean),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((selectedId) => {
              const selectedType = tokenTypes.find(
                (t) => t.token_type_id == selectedId
              );
              if (selectedType) {
                this.tokenTypeId.set(Number(selectedId));
                this.addTokenForm.patchValue(
                  {
                    token_amount: String(selectedType.amount),
                  },
                  { emitEvent: false }
                );
                this.updateFormValidations(selectedType.is_highest === 1);
              }
            });

          // If editing and token type is already set, update amount immediately
          const currentTokenTypeId =
            this.addTokenForm.get('token_type_id')?.value;
          if (currentTokenTypeId) {
            const existingType = tokenTypes.find(
              (t) => t.token_type_id == currentTokenTypeId
            );
            if (existingType) {
              this.tokenTypeId.set(Number(currentTokenTypeId));
              this.addTokenForm.patchValue(
                {
                  token_amount: String(existingType.amount),
                },
                { emitEvent: false }
              );
              this.updateFormValidations(existingType.is_highest === 1);
            }
          }
          this.cdr.markForCheck();
        }),
        catchError((error) => {
          console.error('Error fetching token types:', error);
          this.snackBar.open('Failed to load token types', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private updateFormValidations(isHighest: boolean): void {
    const wingIdControl = this.addTokenForm.get('wing_id');
    const floorIdControl = this.addTokenForm.get('floor_id');
    const unitTypeControl = this.addTokenForm.get('unit_type');
    const floorUnitIdControl = this.addTokenForm.get('floor_unit_id');
    const configControl = this.addTokenForm.get('project_configuration_id');

    if (isHighest) {
      wingIdControl?.setValidators(Validators.required);
      floorIdControl?.setValidators(Validators.required);
      unitTypeControl?.setValidators(Validators.required);
      floorUnitIdControl?.setValidators(Validators.required);
      configControl?.clearValidators();
    } else {
      wingIdControl?.clearValidators();
      floorIdControl?.clearValidators();
      unitTypeControl?.clearValidators();
      floorUnitIdControl?.clearValidators();
      configControl?.setValidators(Validators.required);

      // Reset values if not highest
      wingIdControl?.reset();
      floorIdControl?.reset();
      unitTypeControl?.reset();
      floorUnitIdControl?.reset();
    }

    wingIdControl?.updateValueAndValidity();
    floorIdControl?.updateValueAndValidity();
    unitTypeControl?.updateValueAndValidity();
    floorUnitIdControl?.updateValueAndValidity();
    configControl?.updateValueAndValidity();

    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.addTokenForm.invalid) {
      this.markFormGroupTouched(this.addTokenForm);
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (this.roleId === 7) {
      this.addTokenForm.get('sales_executive_id')?.patchValue(this.userId());
    }

    const formData = {
      ...this.addTokenForm.getRawValue(),
      user_id: Number(sessionStorage.getItem('session_id')),
      is_agreed: this.addTokenForm.getRawValue().is_agreed ? 1 : 0,
      token_date: this.pipe.transform(
        this.addTokenForm.get('token_date')?.value,
        'yyyy-MM-dd'
      ),
    };

    const apiUrl = this.tokenID()
      ? `${this.baseUrl}/edit_token`
      : `${this.baseUrl}/add_token`;

    this.loading.set(true);
    this.http
      .post<{ message: string; token_id: number }>(apiUrl, formData)
      .pipe(
        tap((res) => {
          this.snackBar.open(res.message, 'Close', { duration: 3000 });
          if (this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.tokenPaymentId.set(res.token_id);
          }
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        catchError((error) => {
          console.error('Error:', error);
          this.snackBar.open(
            error.error?.message || 'Something went wrong. Please try again.',
            'Close',
            { duration: 3000 }
          );
          this.loading.set(false);
          this.cdr.markForCheck();
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // ==================== Source Logic Helpers ====================

  private updateSourceValidators(sourceID: any): void {
    const channelPartnerControl = this.addTokenForm.get('channel_partner_id');
    const sourceDetailControl = this.addTokenForm.get('source_detail_id');
    const isChannelPartner = String(sourceID) === '3';

    if (isChannelPartner) {
      channelPartnerControl?.setValidators(Validators.required);
      sourceDetailControl?.clearValidators();
    } else {
      sourceDetailControl?.setValidators(Validators.required);
      channelPartnerControl?.clearValidators();
    }

    channelPartnerControl?.updateValueAndValidity({ emitEvent: false });
    sourceDetailControl?.updateValueAndValidity({ emitEvent: false });
  }

  onPartnerSearch(
    searchText: string,
    loadInitialData?: boolean,
    channelPartnerId?: any
  ): void {
    const trimmedSearch = searchText.trim();

    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.allChannelPartnerList.set([]);
      return;
    }

    const idToUse = channelPartnerId !== undefined
      ? channelPartnerId
      : this.addTokenForm.value.channel_partner_id;

    this.enquiryService
      .searchChannelPartners(trimmedSearch, loadInitialData, idToUse)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const mappedList = res.map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner || ''})`,
          }));
          this.allChannelPartnerList.set(mappedList);
        },
        error: () => {
          this.snackBar.open('Unable to fetch partners.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  private fetchPreferenceDropdown(projectID: any): void {
    this.enquiryService
      .fetchWebConfig(projectID)
      .pipe(
        map((res): WebConfigWithFeet[] =>
          res.map((item) => ({
            ...item,
            feet: (item as any).feet || '',
          }))
        ),
        tap((res) => {
          this.preferenceDropdown.set(res);
          this.cdr.markForCheck();
        }),
        catchError(() => of<WebConfigWithFeet[]>([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }



  private handleRoleBasedSalesExecutive(): void {
    if (this.roleId === 7) {
      this.addTokenForm.get('sales_executive_id')?.patchValue(this.userId());
      this.addTokenForm.get('sales_executive_id')?.disable();
    }
  }

  private disableRoleBasedFields(): void {
    if (this.roleId !== 2) {
      [
        'token_date',
        'source_id',
        'source_detail_id',
        'channel_partner_id',
        'mob_no',
        'project_configuration_id',
        'email_id',
        'source_description',
      ].forEach((field) => this.addTokenForm.get(field)?.disable());
    }
  }

  private fetchSingleToken(): void {
    const tokenId = this.tokenID();
    if (!tokenId) return;

    this.loading.set(true);
    this.http
      .post<any>(`${this.baseUrl}/fetch_single_token`, { token_id: tokenId })
      .pipe(
        switchMap((res) => {
          if (!res) return of(null);

          const salesExecutiveId =
            this.roleId === 7 ? this.userId() : res.sales_executive_id ?? '';

          const projectConfigurationId = Array.isArray(
            res.project_configuration_id
          )
            ? res.project_configuration_id
            : res.project_configuration_id
              ? [res.project_configuration_id]
              : [];

          const projectId = res.project_id;

          if (res.channel_partner_id) {
            this.onPartnerSearch('', true, res.channel_partner_id);
          }
          if (res.source_id && String(res.source_id) !== '3') {
            this.fetchSourceDetails(res.source_id);
          }
          this.updateSourceValidators(res.source_id);

          // First, ensure token types are loaded
          if (projectId && res.token_type_id) {
            return this.http
              .post<TokenType[]>(`${this.baseUrl}/token_type_dropdown`, {
                project_id: projectId,
              })
              .pipe(
                switchMap((tokenTypes) => {
                  this.allTokenType.set(tokenTypes);

                  const selectedType = tokenTypes.find(
                    (t) => t.token_type_id === res.token_type_id
                  );
                  const isHighest = selectedType?.is_highest === 1;

                  this.updateFormValidations(isHighest);

                  // If is_highest, load dependent dropdowns first, then patch form
                  if (isHighest && projectId) {
                    return this.loadDependentDropdownsForEdit(
                      projectId,
                      res.wing_id,
                      res.floor_id,
                      res.unit_type,
                      res.floor_unit_id
                    ).pipe(
                      tap(() => {
                        // Patch form values after dropdowns are loaded
                        this.addTokenForm.patchValue({
                          user_id: res.user_id ?? this.userId(),
                          token_id: res.token_id ?? '',
                          ...Object.fromEntries(
                            Object.entries(res).map(([key, value]) => [key, value ?? ''])
                          ),
                          project_configuration_id: projectConfigurationId,
                          sales_executive_id: salesExecutiveId,
                          is_agreed: res.is_agreed ?? false,
                        }, { emitEvent: false });
                      })
                    );
                  } else {
                    // Patch form values for non-highest token
                    this.addTokenForm.patchValue({
                      user_id: res.user_id ?? this.userId(),
                      token_id: res.token_id ?? '',
                      ...Object.fromEntries(
                        Object.entries(res).map(([key, value]) => [key, value ?? ''])
                      ),
                      project_configuration_id: projectConfigurationId,
                      sales_executive_id: salesExecutiveId,
                      is_agreed: res.is_agreed ?? false,
                    }, { emitEvent: false });
                    return of(null);
                  }
                })
              );
          } else {
            // Patch form without token type dependency
            this.addTokenForm.patchValue({
              user_id: res.user_id ?? this.userId(),
              token_id: res.token_id ?? '',
              ...Object.fromEntries(
                Object.entries(res).map(([key, value]) => [key, value ?? ''])
              ),
              project_configuration_id: projectConfigurationId,
              sales_executive_id: salesExecutiveId,
              is_agreed: res.is_agreed ?? false,
            }, { emitEvent: false });
            return of(null);
          }
        }),
        tap(() => {
          this.handleRoleBasedSalesExecutive();
          this.disableRoleBasedFields();
          this.loading.set(false);
          this.cdr.markForCheck();
        }),
        catchError(() => {
          this.snackBar.open(
            'Error occurred while fetching data, please try later',
            'Close',
            { duration: 3000 }
          );
          this.loading.set(false);
          this.cdr.markForCheck();
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private loadDependentDropdownsForEdit(
    projectId: any,
    wingId: any,
    floorId: any,
    unitType: any,
    floorUnitId: any
  ): any {
    // Load wings first
    return this.http
      .post<Wing[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectId })
      .pipe(
        switchMap((wings) => {
          this.allWingslist.set(wings);
          this.cdr.markForCheck();

          if (wingId) {
            // Load floors for the wing
            return this.http
              .post<Floor[]>(`${this.baseUrl}/fetch_floor_dropdown`, {
                project_id: projectId,
                wing_id: wingId,
              })
              .pipe(
                switchMap((floors) => {
                  this.FloorUnitDropdown.set(floors);
                  this.cdr.markForCheck();

                  if (floorId) {
                    // Load unit types for the floor
                    return this.http
                      .post<{ data: UnitType[] }>(
                        `${this.baseUrl}/fetch_unit_type`,
                        {
                          project_id: projectId,
                          wing_id: wingId,
                          floor_id: floorId,
                        }
                      )
                      .pipe(
                        switchMap((unitTypesRes) => {
                          this.confiList.set(unitTypesRes.data || []);
                          this.cdr.markForCheck();

                          if (unitType) {
                            // Load floor units for the unit type
                            return this.http
                              .post<FloorUnit[]>(
                                `${this.baseUrl}/token_floor_unit_dropdown`,
                                {
                                  project_id: projectId,
                                  wing_id: wingId,
                                  floor_id: floorId,
                                  unit_type: unitType,
                                }
                              )
                              .pipe(
                                tap((units) => {
                                  this.UnitNo.set(units);
                                  this.cdr.markForCheck();
                                })
                              );
                          }
                          return of(null);
                        })
                      );
                  }
                  return of(null);
                })
              );
          }
          return of(null);
        }),
        catchError(() => {
          console.error('Error loading dependent dropdowns');
          return of(null);
        })
      );
  }
}
