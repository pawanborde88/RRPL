import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { environment } from '../../../../../../environments/environment';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  forkJoin,
  of,
  map,
  shareReplay,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { EnquiryManagementService } from '../../../Enquiry/services/enquiry-management.service';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { IndianCurrencyFormatPipe } from '../../../../../Pipes/currency/indian-currency-format.pipe';

// ==================== TYPE DEFINITIONS ====================

interface Project {
  project_id: number;
  min_cost: number;
  max_cost: number;
  city_id: number;
  project_name?: string;
  property_name?: string;
  project_logo?: string | null;
  [key: string]: unknown;
}

interface DropdownItem {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface SalutationItem {
  salution_id: number;
  salution: string;
  [key: string]: unknown;
}

interface ProjectConfigurationItem {
  project_configuration_id: number;
  configuration?: string;
  bhk?: string;
  carpet_area?: string;
  feet?: string;
  [key: string]: unknown;
}

interface AgeRangeItem {
  age_range_id: number;
  age_range: string;
  [key: string]: unknown;
}

interface IndustryItem {
  industry_id: number;
  industry: string;
  [key: string]: unknown;
}

interface PossessionReqItem {
  possession_req_id: number;
  possession_req: string;
  [key: string]: unknown;
}

interface BookingPlanItem {
  booking_plan_id: number;
  booking: string;
  [key: string]: unknown;
}

interface BuyingPurposeItem {
  buying_purpose_id: number;
  buying_purpose: string;
  [key: string]: unknown;
}

interface SourceItem {
  source_id: number;
  source: string;
  [key: string]: unknown;
}

interface SourceDetailItem {
  source_detail_id: number;
  source_detail: string;
  [key: string]: unknown;
}

interface CallStatusItem {
  call_status_id: number;
  call_status: string;
  [key: string]: unknown;
}

interface SubRegionItem {
  sub_region_id: number;
  sub_region: string;
  [key: string]: unknown;
}

interface PreferredLocationItem {
  preferred_location_id: number;
  preferred_location: string;
  [key: string]: unknown;
}

interface NativePlaceItem {
  native_place_id: number;
  native_place: string;
  [key: string]: unknown;
}

interface PreferredBankItem {
  preferred_bank_id: number;
  preferred_bank: string;
  [key: string]: unknown;
}


interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
  status?: boolean;
}

interface CPExecutive {
  user_id: number | string;
  first_name: string;
  last_name: string;
  user_phone: string;
  full_name: string;
  [key: string]: unknown;
}

interface ChannelPartner {
  channel_partner_id: number;
  full_name?: string;
  rera?: string;
  [key: string]: unknown;
}

// ==================== COMPONENT ====================

@Component({
  selector: 'app-qrproject-forom',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    AutocompleteReusableComponent,
    IndianCurrencyFormatPipe,
    DatePipe,
  ],
  templateUrl: './qrproject-forom.component.html',
  styleUrl: './qrproject-forom.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class QRProjectForomComponent {
  // ==================== INJECTED DEPENDENCIES ====================
  private readonly enquiryService = inject(EnquiryManagementService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private datePipe: DatePipe = new DatePipe('en-US'); private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // ==================== CONSTANTS ====================
  readonly storageUrl = environment.STORAGE_URL;
  readonly roleId = isPlatformBrowser(this.platformId) ? Number(sessionStorage.getItem('role_id')) || 0 : 0;
  readonly userId = isPlatformBrowser(this.platformId) ? Number(sessionStorage.getItem('session_id')) || 0 : 0;

  // ==================== SIGNALS ====================
  readonly slug = signal<string>('');
  readonly errorMessage = signal<string | null>(null);
  readonly loading = signal<boolean>(false);
  readonly showAlternateMobile = signal<boolean>(false);
  readonly showSourceFields = signal<boolean>(false);
  readonly isEnquirySubmitted = signal<boolean>(false);
  readonly leadID = signal<number>(0);
  readonly isPatching = signal<boolean>(false);

  // Project data
  readonly projectData = signal<Project | null>(null);

  // Slider step
  readonly currentStep = 1000;

  // Dropdown data signals
  readonly allSubregions = signal<SubRegionItem[]>([]);
  readonly preferredLocationDropdown = signal<PreferredLocationItem[]>([]);
  readonly confiList = signal<ProjectConfigurationItem[]>([]);
  readonly sourcesList = signal<SourceItem[]>([]);
  readonly ageRangeDropdown = signal<AgeRangeItem[]>([]);
  readonly allChannelPartnerList = signal<ChannelPartner[]>([]);
  readonly allCPExeuctiveList = signal<CPExecutive[]>([]);
  readonly sourceDetailedList = signal<SourceDetailItem[]>([]);
  readonly salutationDropdown = signal<SalutationItem[]>([]);
  readonly nativePlaceDropdown = signal<NativePlaceItem[]>([]);
  readonly industryDropdown = signal<IndustryItem[]>([]);
  readonly possessionReqDropdown = signal<PossessionReqItem[]>([]);
  readonly buyingPurposeDropdown = signal<BuyingPurposeItem[]>([]);
  readonly preferredBankDropdown = signal<PreferredBankItem[]>([]);
  readonly allBookingPlans = signal<BookingPlanItem[]>([]);
  readonly allCallStatus = signal<CallStatusItem[]>([]);

  // ==================== FORM ====================
  readonly addEnquiryform = new FormGroup({
    min_cost: new FormControl<number | null>(null),
    max_cost: new FormControl<number | null>(null),
    min_budget: new FormControl<number | null>(null, Validators.required),
    max_budget: new FormControl<number | null>(null, Validators.required),
    project_id: new FormControl<string | number>('', Validators.required),
    user_id: new FormControl<number>(this.userId),
    first_name: new FormControl<string>('', Validators.required),
    date: new FormControl<string>(
      this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',

    ),
    middle_name: new FormControl<string>(''),
    last_name: new FormControl<string>('', Validators.required),
    mobile_no: new FormControl<string>('', [
      Validators.required,
      Validators.pattern(/^(?:\d{10}|\d{12})$/),
    ]),
    email_id: new FormControl<string>('', [
      Validators.required,
      Validators.email,
      Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/),
    ]),
    telecaller_name_string: new FormControl<string>(''),
    alternate_mob_no: new FormControl<string>('', [
      Validators.pattern(/^(?:$|\d{10}|\d{12})$/),
    ]),
    whatsapp_no: new FormControl<string>('', [
      Validators.pattern(/^(?:$|\d{10}|\d{12})$/),
    ]),
    salution_id: new FormControl<string | number>('', Validators.required),
    channel_partner_id: new FormControl<string | number>(''),
    age_range_id: new FormControl<string | number>(' ', Validators.required),
    current_living_place_id: new FormControl<string | number>(
      '',
      Validators.required
    ),
    native_place_id: new FormControl<string | number>('', Validators.required),
    industry_id: new FormControl<string | number>('', Validators.required),
    company_name: new FormControl<string>(''),
    possession_req_id: new FormControl<string | number>(
      '',
      Validators.required
    ),
    buying_purpose_id: new FormControl<string | number>('', Validators.required),
    booking_plan_within_id: new FormControl<string | number>(
      '',
      Validators.required
    ),
    project_configuration_id: new FormControl<number[]>(
      [],
      Validators.required
    ),
    project_lead_id: new FormControl<string | number>(''),
    preferred_location_id: new FormControl<string | number>(
      '',
    ),
    job_location: new FormControl<string>(''),
    rera_no: new FormControl<string>(''),
    source_id: new FormControl<string | number>('', Validators.required),
    source_detail_id: new FormControl<string | number>(''),
    source_executive_id: new FormControl<string | number | null>(null),
    source_description: new FormControl<string>(''),
  });

  // Budget Signals
  readonly minBudgetSignal = toSignal(
    this.addEnquiryform.controls.min_budget.valueChanges,
    { initialValue: 0 }
  );
  readonly maxBudgetSignal = toSignal(
    this.addEnquiryform.controls.max_budget.valueChanges,
    { initialValue: 0 }
  );

  // ==================== COMPUTED SIGNALS ====================
  readonly minBudget = computed(() => {
    const formValue = this.minBudgetSignal();
    const projectMin = this.projectData()?.min_cost;
    return formValue || projectMin || 0;
  });

  readonly maxBudget = computed(() => {
    const formValue = this.maxBudgetSignal();
    const projectMax = this.projectData()?.max_cost;
    return formValue || projectMax || 0;
  });

  // Signal to track source_id for reactive computed signals
  private readonly sourceIdSignal = signal<number | null>(null);

  readonly isChannelPartnerSource = computed(() => {
    const sourceId = this.sourceIdSignal();
    return sourceId !== null && sourceId === 3;
  });

  readonly isSourceDetailRequired = computed(() => {
    const sourceId = this.sourceIdSignal();
    return sourceId !== null && sourceId !== 3;
  });




  // ==================== CONSTRUCTOR & INITIALIZATION ====================
  constructor() {
    this.initializeComponent();
    this.setupFormValueChanges();
  }

  private initializeComponent(): void {
    this.route.paramMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params: { get: (key: string) => string | null }) => {
          const slug = params.get('slug') || '';
          this.slug.set(slug);
          return slug ? of(slug) : of(null);
        }),
        filter((slug): slug is string => !!slug)
      )
      .subscribe(() => {
        this.loadInitialData();
      });

  }

  private loadInitialData(): void {
    this.fetchSingleProject();
    this.fetchAllDropdowns();
  }

  private fetchAllDropdowns(): void {
    forkJoin({
      sources: this.enquiryService.fetchSources().pipe(
        map((res: any[]) => res.map(item => ({ source_id: item.source_id, source: item.source }))),
        catchError(() => this.handleError<SourceItem>('Unable to fetch source details.')),
        shareReplay(1)
      ),
      ageRanges: this.enquiryService.fetchAgeRange().pipe(
        map((res: any[]) => res.map(item => ({ age_range_id: item.age_range_id, age_range: item.age_range }))),
        catchError(() => this.handleError<AgeRangeItem>('Unable to fetch age ranges.')),
        shareReplay(1)
      ),
      preferredLocations: this.enquiryService.fetchPreferredLocations().pipe(
        map((res: any[]) => res.map(item => ({ preferred_location_id: item.preferred_location_id, preferred_location: item.preferred_location }))),
        catchError(() =>
          this.handleError<PreferredLocationItem>('Failed to fetch preferred location data.')
        ),
        shareReplay(1)
      ),
      salutations: this.enquiryService.fetchSalutations().pipe(
        map((res: any[]) => res.map(item => ({ salution_id: item.salution_id, salution: item.salution }))),
        catchError(() => this.handleError<SalutationItem>('Failed to fetch salutation data.')),
        shareReplay(1)
      ),
      nativePlaces: this.enquiryService.fetchNativePlaces().pipe(
        map((res: any[]) => res.map(item => ({ native_place_id: item.native_place_id, native_place: item.native_place }))),
        catchError(() => this.handleError<NativePlaceItem>('Failed to fetch native place data.')),
        shareReplay(1)
      ),
      industries: this.enquiryService.fetchIndustries().pipe(
        map((res: any[]) => res.map(item => ({ industry_id: item.industry_id, industry: item.industry }))),
        catchError(() => this.handleError<IndustryItem>('Failed to fetch industry data.')),
        shareReplay(1)
      ),
      possessionReqs: this.enquiryService
        .fetchPossessionRequirements()
        .pipe(
          map((res: any[]) => res.map(item => ({ possession_req_id: item.possession_req_id, possession_req: item.possession_req }))),
          catchError(() =>
            this.handleError<PossessionReqItem>('Failed to fetch possession requirement data.')
          ),
          shareReplay(1)
        ),
      buyingPurposes: this.enquiryService.fetchBuyingPurposes().pipe(
        map((res: any[]) => res.map(item => ({ buying_purpose_id: item.buying_purpose_id, buying_purpose: item.buying_purpose }))),
        catchError(() =>
          this.handleError<BuyingPurposeItem>('Failed to fetch buying purpose data.')
        ),
        shareReplay(1)
      ),
      preferredBanks: this.enquiryService.fetchPreferredBanks().pipe(
        map((res: any[]) => res.map(item => ({ preferred_bank_id: item.preferred_bank_id, preferred_bank: item.preferred_bank }))),
        catchError(() => this.handleError<PreferredBankItem>('Failed to fetch preferred bank data.')),
        shareReplay(1)
      ),
      bookingPlans: this.enquiryService.fetchBookingPlans().pipe(
        map((res: any[]) => res.map(item => ({ booking_plan_id: item.booking_plan_id, booking: item.booking }))),
        catchError(() => this.handleError<BookingPlanItem>('Failed to fetch booking plans data.')),
        shareReplay(1)
      ),
    })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (results: {
          sources: SourceItem[];
          ageRanges: AgeRangeItem[];
          preferredLocations: PreferredLocationItem[];
          salutations: SalutationItem[];
          nativePlaces: NativePlaceItem[];
          industries: IndustryItem[];
          possessionReqs: PossessionReqItem[];
          buyingPurposes: BuyingPurposeItem[];
          preferredBanks: PreferredBankItem[];
          bookingPlans: BookingPlanItem[];
        }) => {
          this.sourcesList.set(results.sources || []);
          this.ageRangeDropdown.set(results.ageRanges || []);
          this.preferredLocationDropdown.set(results.preferredLocations || []);
          this.salutationDropdown.set(results.salutations || []);
          this.nativePlaceDropdown.set(results.nativePlaces || []);
          this.industryDropdown.set(results.industries || []);
          this.possessionReqDropdown.set(results.possessionReqs || []);
          this.buyingPurposeDropdown.set(results.buyingPurposes || []);
          this.preferredBankDropdown.set(results.preferredBanks || []);
          this.allBookingPlans.set(results.bookingPlans || []);
        },
      });
  }

  // ==================== FORM VALUE CHANGES ====================
  private setupFormValueChanges(): void {
    // Initialize sourceIdSignal with current form value
    const initialSourceId = this.addEnquiryform.get('source_id')?.value;
    if (initialSourceId !== null && initialSourceId !== undefined) {
      this.sourceIdSignal.set(Number(initialSourceId));
    }

    // Source ID changes
    this.addEnquiryform
      .get('source_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((sourceId): sourceId is string | number => sourceId !== null && sourceId !== undefined),
        distinctUntilChanged()
      )
      .subscribe((sourceId) => {
        this.handleSourceIdChange(Number(sourceId));
      });

    // Track form value changes to trigger computed signal updates
    // this.addEnquiryform.valueChanges
    //   .pipe(
    //     takeUntilDestroyed(this.destroyRef),
    //     debounceTime(50)
    //   )
    //   .subscribe(() => {
    //     // Force change detection to update computed signals
    //   });

    // Channel Partner ID changes
    this.addEnquiryform
      .get('channel_partner_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        debounceTime(50)
      )
      .subscribe((cpId) => {
        const sourceExecutiveControl = this.addEnquiryform.get('source_executive_id');
        if (cpId && Number(cpId) > 0) {
          this.fetchAllCPExecutives(Number(cpId));
        } else {
          // Reset source_executive_id when channel partner is cleared
          sourceExecutiveControl?.reset();
          this.allCPExeuctiveList.set([]);
        }
      });

    this.addEnquiryform
      .get('source_executive_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(50)
      )
      .subscribe();

    this.addEnquiryform
      .get('source_detail_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(50)
      )
      .subscribe();

    // Lead Level ID changes
    this.addEnquiryform
      .get('lead_level_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((leadLevelId: string | number | null): leadLevelId is string | number =>
          leadLevelId !== null && leadLevelId !== undefined && leadLevelId !== ''
        ),
        distinctUntilChanged()
      )
      .subscribe((leadLevelId) => {
        this.fetchAllCallStatus(Number(leadLevelId));
      });

    // Budget changes - show source fields when both budgets are set
    this.addEnquiryform
      .get('min_budget')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(() => this.checkAndShowSourceFields());

    this.addEnquiryform
      .get('max_budget')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(() => this.checkAndShowSourceFields());
  }

  private handleSourceIdChange(sourceId: number): void {
    const sourceDetailControl = this.addEnquiryform.get('source_detail_id');
    const channelPartnerControl = this.addEnquiryform.get('channel_partner_id');
    const sourceExecutiveControl = this.addEnquiryform.get('source_executive_id');
    // Reset all source-related fields
    sourceDetailControl?.reset();
    channelPartnerControl?.reset();
    sourceExecutiveControl?.reset();

    if (sourceId === 3) {
      // Channel Partner source (source_id = 3)
      // Load initial channel partner data
      this.onPartnerSearch('', true);
    } else {
      // All other sources (source_id ≠ 3)
      // Clear channel partner list for non-channel partner sources
      this.allChannelPartnerList.set([]);
      this.allCPExeuctiveList.set([]);
    }

    this.applySourceDependentValidators(sourceId);
    this.fetchAllSourceDetails(sourceId);
  }

  /**
   * Applies validators to source-related controls based on sourceId.
   * When sourceId === 3 (Channel Partner): channel_partner_id and source_executive_id are required.
   * Otherwise: source_detail_id is required.
   */
  private applySourceDependentValidators(sourceId: number): void {
    this.sourceIdSignal.set(sourceId);
    const sourceDetailControl = this.addEnquiryform.get('source_detail_id');
    const channelPartnerControl = this.addEnquiryform.get('channel_partner_id');
    const sourceExecutiveControl = this.addEnquiryform.get('source_executive_id');

    if (sourceId === 3) {
      sourceDetailControl?.clearValidators();
      channelPartnerControl?.setValidators(Validators.required);
      sourceExecutiveControl?.setValidators(Validators.required);
    } else {
      sourceDetailControl?.setValidators(Validators.required);
      channelPartnerControl?.clearValidators();
      sourceExecutiveControl?.clearValidators();
    }

    sourceDetailControl?.updateValueAndValidity();
    channelPartnerControl?.updateValueAndValidity();
    sourceExecutiveControl?.updateValueAndValidity();
  }

  private checkAndShowSourceFields(): void {
    const minBudget = this.addEnquiryform.get('min_budget')?.value ?? 0;
    const maxBudget = this.addEnquiryform.get('max_budget')?.value ?? 0;
    this.showSourceFields.set(minBudget > 0 && maxBudget > 0);
  }

  // ==================== VALIDATION METHODS ====================
  get isFormInvalid(): boolean {
    return this.addEnquiryform.invalid;
  }


  // ==================== API CALLS ====================
  private fetchSingleProject(): void {
    this.loading.set(true);
    this.enquiryService
      .fetchProjectInfo(this.slug())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.handleProjectFetchError(err);
          return of(null as any);
        }),
        finalize(() => {
          this.loading.set(false);
        }),
        shareReplay(1)
      )
      .subscribe({
        next: (res) => {
          this.projectData.set(res.data);
          this.patchProjectFormValues();

          const projectId = res.data?.project_id;
          if (projectId) {
            this.fetchProjectConfig(projectId);
            this.fetchAllSubregions();
          }
        },
      });
  }

  private patchProjectFormValues(): void {
    const project = this.projectData();
    if (!project) return;

    // Initialize budget values with project min/max cost if not already set
    const minBudget = this.addEnquiryform.get('min_budget')?.value;
    const maxBudget = this.addEnquiryform.get('max_budget')?.value;

    this.addEnquiryform.patchValue(
      {
        project_id: project.project_id || null,
        min_cost: project.min_cost || null,
        max_cost: project.max_cost || null,
        // Set initial budget values if not already set
        min_budget: minBudget || project.min_cost || null,
        max_budget: maxBudget || project.max_cost || null,
      },
      { emitEvent: false }
    );
  }

  private fetchAllSubregions(): void {
    const cityId = this.projectData()?.city_id;
    if (!cityId) return;

    this.enquiryService
      .fetchSubRegions(cityId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((res: any[]) => res.map(item => ({ sub_region_id: item.sub_region_id, sub_region: item.sub_region }))),
        catchError(() => {
          return this.handleError<SubRegionItem>('Unable to fetch sub-regions.');
        }),
        shareReplay(1)
      )
      .subscribe({
        next: (res: SubRegionItem[]) => {
          this.allSubregions.set(res || []);
        },
      });
  }

  private handleProjectFetchError(err: unknown): void {
    const error = err as { status?: number };
    const message =
      error.status === 404
        ? 'QR code has been expired please contact your admin.'
        : 'Unable to fetch project details.';
    this.errorMessage.set(message);
    this.showError(message, 5000);
  }

  private fetchProjectConfig(projectId: number): void {
    this.enquiryService
      .fetchWebConfig(projectId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((res: any[]) => res.map(item => ({ project_configuration_id: item.project_configuration_id, configuration: item.configuration, bhk: item.bhk, carpet_area: item.carpet_area, feet: item.feet }))),
        catchError(() => {
          return this.handleError<ProjectConfigurationItem>('Unable to fetch project config.');
        }),
        shareReplay(1)
      )
      .subscribe({
        next: (res: ProjectConfigurationItem[]) => {
          this.confiList.set(res || []);
        },
      });
  }

  fetchAllCPExecutives(channelPartnerID: number): void {
    if (channelPartnerID <= 0) return;

    this.loading.set(true);
    this.enquiryService
      .fetchCPExecutives({
        channel_partner_id: [channelPartnerID],
        active_status_id: 1,
        approve_status_id: 1,
        is_dummy: 1,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((res: any[]) => res.map((item: any) => ({ user_id: item.user_id, first_name: item.first_name, last_name: item.last_name, user_phone: item.user_phone, full_name: `${item.first_name} ${item.last_name} --(${item.user_phone})` }))),
        finalize(() => {
          this.loading.set(false);
        }),
        catchError(() => {
          return this.handleError<CPExecutive>('Unable to fetch channel partners.');
        }),
        shareReplay(1)
      )
      .subscribe({
        next: (res: CPExecutive[]) => {
          const executives: CPExecutive[] = (res || []).map(
            (item: CPExecutive, index: number) => ({
              ...item,
              user_id:
                item.user_id ?? (`temp_null_${index}` as string | number),
              full_name: `${item.first_name} ${item.last_name} --(${item.user_phone})`,
            })
          );

          this.allCPExeuctiveList.set(executives);

          // Verify temporary ID still exists
          const currentValue =
            this.addEnquiryform.get('source_executive_id')?.value;
          if (this.isTempNullId(currentValue)) {
            const exists = executives.some(
              (item) => item.user_id === currentValue
            );
            if (!exists) {
              this.addEnquiryform.patchValue(
                { source_executive_id: null },
                { emitEvent: false }
              );
            }
          }
        },
      });
  }

  private fetchAllSourceDetails(sourceId: number): void {
    if (!sourceId || sourceId <= 0) return;

    this.enquiryService
      .fetchSourceDetails(sourceId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((res: any[]) => res.map(item => ({ source_detail_id: item.source_detail_id, source_detail: item.source_detail }))),
        catchError(() => {
          return this.handleError<SourceDetailItem>('Unable to fetch source details.');
        }),
        shareReplay(1)
      )
      .subscribe({
        next: (res: SourceDetailItem[]) => {
          this.sourceDetailedList.set(res || []);
        },
      });
  }

  onPartnerSearch(
    searchText: string,
    loadInitialData?: boolean,
    channelPartnerId?: number
  ): void {
    const trimmedSearch = searchText.trim();

    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.allChannelPartnerList.set([]);
      return;
    }

    const idToUse =
      channelPartnerId !== undefined
        ? channelPartnerId
        : (this.addEnquiryform.value.channel_partner_id as number | undefined);

    this.enquiryService
      .searchChannelPartners(trimmedSearch, loadInitialData, idToUse)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((res: any[]) => res.map(item => ({ channel_partner_id: Number(item.channel_partner_id), full_name: item.full_name || item.firm_name, rera: item.rera }))),
        catchError(() => {
          return this.handleError<ChannelPartner>('Unable to fetch partners.');
        }),
        shareReplay(1)
      )
      .subscribe({
        next: (res: ChannelPartner[]) => {
          this.allChannelPartnerList.set(res || []);
        },
      });
  }

  onPartnerSelected(selectedId: number): void {
    const selectedPartner = this.allChannelPartnerList().find(
      (p) => p.channel_partner_id === selectedId
    );

    if (selectedPartner) {
      this.addEnquiryform.patchValue({
        rera_no: selectedPartner.rera || ' ',
      });
      this.fetchAllCPExecutives(selectedId);
    } else {
      this.addEnquiryform.patchValue({ rera_no: ' ' });
      this.allCPExeuctiveList.set([]);
    }
  }

  private fetchAllCallStatus(leadLevelID: number): void {
    if (leadLevelID <= 0) return;

    this.enquiryService
      .fetchCallStatus(leadLevelID)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((res: any[]) => res.map(item => ({ call_status_id: item.call_status_id, call_status: item.call_status }))),
        catchError(() => {
          return this.handleError<CallStatusItem>('Unable to fetch call statuses.');
        }),
        shareReplay(1)
      )
      .subscribe({
        next: (res: CallStatusItem[]) => {
          this.allCallStatus.set(res || []);
        },
      });
  }

  // ==================== UTILITY FOR DEBUGGING ====================

  getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      salution_id: 'Salutation',
      first_name: 'First Name',
      last_name: 'Last Name',
      mobile_no: 'Mobile Number',
      email_id: 'Email',
      project_configuration_id: 'Configurations',
      age_range_id: 'Age Range',
      job_location: 'Job Location',
      company_name: 'Company Name',
      current_living_place_id: 'Current Location',
      preferred_location_id: 'Preferred Location',
      native_place_id: 'Native Location',
      industry_id: 'Industry',
      possession_req_id: 'Possession Requirement',
      booking_plan_within_id: 'Booking Plan',
      buying_purpose_id: 'Buying Purpose',
      min_budget: 'Minimum Budget',
      max_budget: 'Maximum Budget',
      source_id: 'Source',
      source_detail_id: 'Source Detail',
      channel_partner_id: 'Channel Partner',
      source_executive_id: 'CP Executive',
      source_description: 'Source Info',

    };
    return labels[controlName] || this.capitalizeAndReplace(controlName);
  }

  private capitalizeAndReplace(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  // ==================== FORM SUBMISSION ====================
  onSubmit(): void {
    // Mark all fields as touched to ensure validation messages are shown
    this.markFormGroupTouched(this.addEnquiryform);

    if (this.addEnquiryform.invalid) {
      // Optionally scroll to the first invalid field or just let the user see the summary
      return;
    }

    this.loading.set(true);
    const formData = this.prepareFormData();

    this.enquiryService
      .addProjectEnquiry(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        }),
        catchError((err) => {
          this.handleSubmissionError(err);
          return of(null as any);
        })
      )
      .subscribe({
        next: (res: unknown) => {
          const response = res as ApiResponse<unknown>;
          if (response.success && response.status !== false) {
            this.isEnquirySubmitted.set(true);
            this.handleSuccessResponse(response);
          } else if (response.success === true && response.status === false) {
            this.showErrorDialog(
              response?.message || 'An error occurred',
              false
            );
          } else if (response.code === 201) {
            this.showErrorDialog(
              response?.message ||
              'An error occurred while updating payment stage',
              false
            );
          }
        },
      });
  }

  private handleSuccessResponse(res: ApiResponse<unknown>): void {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      data: { status: true, message: res.message },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.addEnquiryform.reset();
      this.fetchSingleProject();
      this.showSourceFields.set(false);
      this.isEnquirySubmitted.set(false);
    });
  }

  private prepareFormData(): FormData {
    const formData = new FormData();
    const formValue = this.addEnquiryform.getRawValue();

    if (this.leadID()) {
      formValue.project_lead_id = String(this.leadID());
    }

    const sourceExecutiveId = this.isTempNullId(formValue.source_executive_id)
      ? null
      : formValue.source_executive_id;

    Object.entries(formValue).forEach(([key, value]) => {
      const val = key === 'source_executive_id' ? sourceExecutiveId : value;

      if (key === 'source_executive_id') {
        formData.append(key, val ? String(val) : 'null');
      } else if (val != null) {
        if (Array.isArray(val)) {
          val.forEach((item) => formData.append(`${key}[]`, String(item)));
        } else {
          formData.append(key, String(val));
        }
      }
    });

    return formData;
  }

  private handleSubmissionError(error: unknown): void {
    const err = error as { error?: { message?: string } };
    this.showErrorDialog(
      err.error?.message || 'Something went wrong. Please try again.',
      false
    );
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // ==================== MOBILE NUMBER HANDLING ====================
  onMobileNumberChange(event: Event): void {
    const mobileNo = (event.target as HTMLInputElement).value;
    this.showAlternateMobile.set(mobileNo.trim().length > 0);

    if (/^(?:\d{10}|\d{12})$/.test(mobileNo)) {
      this.fetchSingleLead(mobileNo);
    }
  }

  private fetchSingleLead(mobNo: string): void {
    const projectId = this.addEnquiryform.get('project_id')?.value;
    if (!projectId) return;

    this.loading.set(true);
    this.enquiryService
      .fetchSingleLead({
        project_id: Number(projectId),
        mobile_no: mobNo,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (res: unknown) => {
          const response = res as { data?: Record<string, unknown> };
          if (response?.data) {
            const leadData = response.data;
            this.leadID.set((leadData['project_lead_id'] as number) || 0);
            this.patchFormData(leadData);
            this.disableFormFieldsAfterLeadFetch();

            if (leadData['channel_partner_id']) {
              this.onPartnerSearch(
                '',
                true,
                leadData['channel_partner_id'] as number
              );
            }
          }
        },
        error: () => {
          this.showError('Lead Not Found');
        },
      });
  }

  private patchFormData(responseData: Record<string, unknown>): void {
    this.isPatching.set(true);

    const formData: Record<string, unknown> = {
      project_lead_id: responseData['project_lead_id'],
      first_name: responseData['customer_name'],
      telecaller_name_string: responseData['telecaller_name_string'],
      status_id: responseData['status_id'],
      lead_type_id: responseData['lead_type_id'],
      follow_up_date: responseData['follow_up_date'],
      follow_up_time: responseData['follow_up_time'],
      mobile_no: responseData['mobile_no']
        ? String(responseData['mobile_no'])
        : '',
      alternate_mob_no: responseData['alternate_mob_no']
        ? String(responseData['alternate_mob_no'])
        : '',
      whatsapp_no: responseData['whatsapp_no']
        ? String(responseData['whatsapp_no'])
        : '',
      email_id: responseData['email_id'],
      project_configuration_id: Array.isArray(
        responseData['project_configuration_id']
      )
        ? responseData['project_configuration_id']
        : responseData['project_configuration_id'] != null
          ? [responseData['project_configuration_id']]
          : [],
      is_site_visited: responseData['is_site_visited'],
      site_visited_date: responseData['site_visited_date'],
      is_booked: responseData['is_booked'],
      remark: responseData['remark'],
      telecaller_id: Array.isArray(responseData['telecaller_id'])
        ? responseData['telecaller_id'][0]
        : responseData['telecaller_id'] ?? null,
      sales_executive_id: responseData['sales_executive_id'],
      source_id: responseData['source_id'],
      source_detail_id: responseData['source_detail_id'],
      channel_partner_id: responseData['channel_partner_id'],
      source_description: responseData['source_description'],
      data_from_id: responseData['data_from_id'],
      salution_id: responseData['salution_id'],
    };

    this.addEnquiryform.patchValue(formData, { emitEvent: false });

    if (responseData['channel_partner_id']) {
      this.onPartnerSearch(
        '',
        true,
        responseData['channel_partner_id'] as number
      );
    }

    const sourceId = responseData['source_id'];
    if (sourceId) {
      this.applySourceDependentValidators(Number(sourceId));
      this.fetchAllSourceDetails(Number(sourceId));
    }
    this.checkAndShowSourceFields();
    this.isPatching.set(false);
  }

  private disableFormFieldsAfterLeadFetch(): void {
    const fieldsToDisable = ['telecaller_name_string', 'mobile_no'];

    fieldsToDisable.forEach((field) => {
      const control = this.addEnquiryform.get(field);
      if (control) {
        control.setErrors(null);
        control.disable({ emitEvent: false });
      }
    });

    const mobileControl = this.addEnquiryform.get('mobile_no');
    if (mobileControl) {
      mobileControl.setErrors(null);
    }
  }


  // ==================== UTILITY METHODS ====================
  private isTempNullId(value: unknown): boolean {
    return typeof value === 'string' && value.startsWith('temp_null_');
  }

  private handleError<T>(message: string) {
    this.showError(message);
    return of([] as T[]);
  }

  private showError(message: string, duration = 3000): void {
    this.snackBar.open(message, 'Close', { duration });
  }

  private showErrorDialog(message: string, status: boolean): void {
    this.dialog.open(SuccessDialogComponent, {
      data: { status, message },
    });
  }
}
