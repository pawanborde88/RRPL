import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EMPTY, catchError, finalize, switchMap, of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { IndianCurrencyFormatPipe } from '../../../../Pipes/currency/indian-currency-format.pipe';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { AmountDirective } from '../../../../Common/Amount Direcitve/amount.directive';
import { EnquiryManagementService } from '../services/enquiry-management.service';

interface DropdownItem {
  [key: string]: any;
}

@Component({
  selector: 'app-claim-enquiry',
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
    AmountDirective,
  ],
  templateUrl: './claim-enquiry.component.html',
  styleUrl: './claim-enquiry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClaimEnquiryComponent {
  // ==================== DEPENDENCY INJECTION ====================
  private readonly enquiryService = inject(EnquiryManagementService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private datePipe: DatePipe = new DatePipe('en-US');
  public readonly dialogRef = inject(MatDialogRef<ClaimEnquiryComponent>);
  public readonly data = inject<any>(MAT_DIALOG_DATA);

  // ==================== CONSTANTS ====================
  private readonly storageUrl = environment.STORAGE_URL;
  private readonly roleId = isPlatformBrowser(this.platformId) ? Number(sessionStorage.getItem('role_id')) : 0;
  private readonly userId = isPlatformBrowser(this.platformId) ? Number(sessionStorage.getItem('session_id')) : 0;
  readonly minDate = new Date();
  readonly maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));

  // ==================== SIGNALS ====================
  readonly loading = signal<boolean>(false);
  readonly imagePreview = signal<string | null>(null);
  readonly imageSize = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly projectsList = signal<DropdownItem[]>([]);
  readonly allCallStatus = signal<DropdownItem[]>([]);
  readonly salutationDropdown = signal<DropdownItem[]>([]);
  readonly ageRangeDropdown = signal<DropdownItem[]>([]);
  readonly livingPlaceDropdown = signal<DropdownItem[]>([]);
  readonly nativePlaceDropdown = signal<DropdownItem[]>([]);
  readonly industryDropdown = signal<DropdownItem[]>([]);
  readonly possessionReqDropdown = signal<DropdownItem[]>([]);
  readonly buyingPurposeDropdown = signal<DropdownItem[]>([]);
  readonly allChannelPartnerList = signal<DropdownItem[]>([]);
  readonly sourcesList = signal<DropdownItem[]>([]);
  readonly allLeadLevels = signal<DropdownItem[]>([]);
  readonly allSalesExecutive = signal<DropdownItem[]>([]);
  readonly sourceDetailedList = signal<DropdownItem[]>([]);
  readonly preferredBankDropdown = signal<DropdownItem[]>([]);
  readonly preferenceDropdown = signal<DropdownItem[]>([]);

  readonly allBookingPlans = signal<DropdownItem[]>([]);
  readonly enqStatusDropdown = signal<DropdownItem[]>([]);
  readonly allSubregions = signal<DropdownItem[]>([]);
  readonly allCPExeuctiveList = signal<DropdownItem[]>([]);

  private readonly pendingSubregionProjectId = signal<number | null>(null);



  // ==================== FORM ====================
  readonly addEnquiryform = new FormGroup({
    rera_no: new FormControl(''),
    min_budget: new FormControl(3000000, Validators.required),
    max_budget: new FormControl(4000000, Validators.required),
    user_id: new FormControl(this.userId),
    first_name: new FormControl('', Validators.required),
    date: new FormControl(this.getFormattedDate()),
    middle_name: new FormControl(''),
    last_name: new FormControl('', Validators.required),
    mobile_no: new FormControl('', [
      Validators.required,
      Validators.pattern(/^\d{10}$/),
      Validators.minLength(10),
      Validators.maxLength(10),
    ]),
    email_id: new FormControl('', [Validators.required, Validators.email]),
    project_id: new FormControl('', Validators.required),
    call_status_id: new FormControl('', Validators.required),
    enquiry_status_id: new FormControl(''),
    booking_plan_within_id: new FormControl('', Validators.required),
    alternate_mob_no: new FormControl('', Validators.pattern(/^[6-9][0-9]{9}$/)),
    whatsapp_no: new FormControl('', Validators.pattern(/^[6-9]\d{9}$/)),
    salutation_id: new FormControl(''),
    possession_req_id: new FormControl('', Validators.required),
    channel_partner_id: new FormControl(''),
    age_range_id: new FormControl('', Validators.required),
    current_living_place_id: new FormControl('', Validators.required),
    native_place_id: new FormControl(''),
    industry_id: new FormControl(''),
    company_name: new FormControl(''),
    sales_executive_id: new FormControl<string | number | null>('', Validators.required),
    buying_purpose_id: new FormControl(''),
    preferred_bank_id: new FormControl(''),
    project_configuration_id: new FormControl('', Validators.required),

    job_location: new FormControl(''),
    follow_up_date: new FormControl(this.getFormattedDate(), Validators.required),
    source_id: new FormControl('', Validators.required),
    source_detail_id: new FormControl(''),
    source_executive_id: new FormControl(''),
    sourcing_manager: new FormControl(''),
    source_description: new FormControl(''),
    remark: new FormControl('', Validators.required),
    lead_level_id: new FormControl('', Validators.required),
    follow_up_period: new FormControl(this.getCurrentTime(), Validators.required),
    enquiry_photo: new FormControl<File | ''>(''),
  });



  // ==================== LIFECYCLE ====================
  constructor() {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.fetchSingleEnquiry();
    this.fetchAllDropdowns();
    this.fetchPreferenceDropdown(this.data.project_id);
    this.fetchAllSalesExecutive(this.data.project_id);
    this.fetchAllSourceList();
    this.fetchAllSourceDetails(this.data.source_id);
    this.setupFormSubscriptions();
  }

  // ==================== FORM SUBSCRIPTIONS ====================
  private setupFormSubscriptions(): void {
    // Lead level changes -> fetch call status
    this.addEnquiryform
      .get('lead_level_id')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((leadLevelID) => {
        if (leadLevelID) {
          this.fetchAllCallStatus(leadLevelID);
        }
      });

    // Channel partner changes -> update RERA number and fetch CP executives
    this.addEnquiryform
      .get('channel_partner_id')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        if (id) {
          this.onPartnerSelected(Number(id));
        }
      });

    // Source ID changes -> update validators
    this.addEnquiryform
      .get('source_id')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sourceID) => {
        const channelPartnerControl = this.addEnquiryform.get('channel_partner_id');
        const sourceDetailControl = this.addEnquiryform.get('source_detail_id');

        if (sourceID === '3') {
          channelPartnerControl?.setValidators(Validators.required);
          sourceDetailControl?.clearValidators();
        } else {
          sourceDetailControl?.setValidators(Validators.required);
          channelPartnerControl?.clearValidators();
        }

        channelPartnerControl?.updateValueAndValidity();
        sourceDetailControl?.updateValueAndValidity();
      });
  }

  // ==================== HELPER METHODS ====================
  private getFormattedDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getCurrentTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }

  // ==================== API CALLS ====================
  private fetchSingleEnquiry(): void {
    this.loading.set(true);
    this.enquiryService
      .fetchSingleProjectEnquiry(this.data.project_enq_id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.snackBar.open('Error fetching data, please try later', 'Close', {
            duration: 3000,
          });
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.disableReadOnlyFields();
            this.patchFormValues(res);
            this.handleRoleBasedSalesExecutive();
            if (res.channel_partner_id) {
              this.onPartnerSearch('', true, res.channel_partner_id);
              this.fetchAllCPExecutives(res.channel_partner_id);
            }
            this.tryLoadSubregionsForProject(res.project_id);
          }
        },
      });
  }

  private disableReadOnlyFields(): void {
    ['project_id', 'source_id', 'channel_partner_id', 'source_detail_id', 'source_description', 'rera_no', 'source_executive_id'].forEach(
      (field) => this.addEnquiryform.get(field)?.disable()
    );
  }

  private patchFormValues(res: any): void {
    // Store rera_no first before patching channel_partner_id to prevent override
    const reraNoFromResponse = res.rera_no || res.rera || '';

    this.addEnquiryform.patchValue({
      user_id: res.user_id,
      project_id: res.project_id,
      date: res.date,
      first_name: res.first_name,
      middle_name: res.middle_name,
      last_name: res.last_name,
      mobile_no: res.mobile_no,
      email_id: res.email_id,
      enquiry_status_id: res.enquiry_status_id,
      alternate_mob_no: res.alternate_mob_no,
      whatsapp_no: res.whatsapp_no,
      salutation_id: res.salution_id || res.salutation_id,
      age_range_id: res.age_range_id,
      current_living_place_id: res.current_living_place_id,
      native_place_id: res.native_place_id,
      industry_id: res.industry_id,
      company_name: res.company_name,
      possession_req_id: res.possession_req_id,
      buying_purpose_id: res.buying_purpose_id,
      booking_plan_within_id: res.booking_plan_within_id,

      preferred_bank_id: res.preferred_bank_id,
      job_location: res.job_location,
      source_id: res.source_id,
      rera_no: reraNoFromResponse,
      source_detail_id: res.source_detail_id,
      channel_partner_id: res.channel_partner_id,
      source_executive_id: res.source_executive_id,
      sourcing_manager: res.sourcing_manager,
      source_description: res.source_description,
      remark: res.remark,
      lead_level_id: res.lead_level_id,
      call_status_id: res.call_status_id,
      project_configuration_id: res.project_configuration_id,
      min_budget: res.min_budget,
      max_budget: res.max_budget,
    }, { emitEvent: false }); // Prevent valueChanges from firing during initial patch
  }

  private handleRoleBasedSalesExecutive(): void {
    if (this.roleId === 7) {
      this.addEnquiryform.get('sales_executive_id')?.patchValue(this.userId);
      this.addEnquiryform.get('sales_executive_id')?.disable();
    }
  }

  private fetchAllDropdowns(): void {
    this.fetchAllProjects();
    this.fetchSalutationDropdown();
    this.fetchAgeRangeDropdown();
    this.fetchLivingPlaceDropdown();
    this.fetchNativePlaceDropdown();
    this.fetchIndustryDropdown();
    this.fetchPossessionReqDropdown();
    this.fetchBuyingPurposeDropdown();
    this.fetchPreferredBankDropdown();

    this.fetchEnqStatusDropdown();
    this.fetchAllLeadLevels();
    this.fetchAllBookingPlans();
  }

  private fetchAllProjects(): void {
    this.loading.set(true);
    this.enquiryService
      .fetchUserProjects(this.userId, this.roleId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          const projectRecords = Array.isArray(res) ? res : [];
          this.projectsList.set(projectRecords);

          const selectedProjectId =
            this.addEnquiryform.get('project_id')?.value ??
            this.pendingSubregionProjectId();
          if (selectedProjectId) {
            this.tryLoadSubregionsForProject(selectedProjectId);
          }
        },
      });
  }

  private fetchSalutationDropdown(): void {
    this.enquiryService
      .fetchSalutations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.salutationDropdown.set(res));
  }

  private fetchAgeRangeDropdown(): void {
    this.enquiryService
      .fetchAgeRange()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.ageRangeDropdown.set(res));
  }

  private fetchLivingPlaceDropdown(): void {
    this.enquiryService
      .fetchPreferredLocations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.livingPlaceDropdown.set(res));
  }

  private fetchAllSubregions(cityId: number): void {
    if (!cityId) return;

    this.enquiryService
      .fetchSubRegions(cityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allSubregions.set(res),
        error: () => {
          this.snackBar.open('Unable to fetch sub-regions.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  private tryLoadSubregionsForProject(projectId: any): void {
    if (!projectId) return;

    const cityId = this.getCityIdFromProject(projectId);
    if (cityId) {
      this.fetchAllSubregions(cityId);
      this.pendingSubregionProjectId.set(null);
    } else {
      this.pendingSubregionProjectId.set(projectId ?? null);
    }
  }

  private getCityIdFromProject(projectId: any): number | undefined {
    if (!projectId || !Array.isArray(this.projectsList())) {
      return undefined;
    }

    const project = this.projectsList().find(
      (p: any) => p.project_id == projectId
    );
    return project?.['city_id'];
  }

  private fetchNativePlaceDropdown(): void {
    this.enquiryService
      .fetchNativePlaces()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.nativePlaceDropdown.set(res));
  }

  private fetchIndustryDropdown(): void {
    this.enquiryService
      .fetchIndustries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.industryDropdown.set(res));
  }

  private fetchPossessionReqDropdown(): void {
    this.enquiryService
      .fetchPossessionRequirements()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.possessionReqDropdown.set(res));
  }

  private fetchBuyingPurposeDropdown(): void {
    this.enquiryService
      .fetchBuyingPurposes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.buyingPurposeDropdown.set(res));
  }

  private fetchPreferredBankDropdown(): void {
    this.enquiryService
      .fetchPreferredBanks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.preferredBankDropdown.set(res));
  }



  private fetchEnqStatusDropdown(): void {
    // Note: This endpoint might need to be added to the service
    // For now, keeping as placeholder
  }

  private fetchAllLeadLevels(): void {
    this.enquiryService
      .fetchLeadLevels()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any[]) => this.allLeadLevels.set(res));
  }

  private fetchAllSalesExecutive(projectID: any): void {
    if (!projectID) return;

    this.enquiryService
      .fetchSalesExecutives(projectID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allSalesExecutive.set(res),
        error: () => {
          this.snackBar.open('Unable to fetch sales executives.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  private fetchAllCallStatus(leadLevelID: any): void {
    if (!leadLevelID) return;

    this.enquiryService
      .fetchCallStatus(leadLevelID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.allCallStatus.set(res),
        error: () => {
          this.snackBar.open('Unable to fetch call statuses.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  private fetchAllBookingPlans(): void {
    this.enquiryService
      .fetchBookingPlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.allBookingPlans.set(res));
  }

  private fetchAllSourceList(): void {
    this.enquiryService
      .fetchSources()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.sourcesList.set(res),
        error: () => {
          this.snackBar.open('Unable to fetch source details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onPartnerSearch(searchText: string, loadInitialData?: boolean, channelPartnerId?: any): void {
    const trimmedSearch = searchText.trim();

    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.allChannelPartnerList.set([]);
      return;
    }

    const idToUse = channelPartnerId !== undefined
      ? channelPartnerId
      : this.addEnquiryform.value.channel_partner_id;

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

  onPartnerSelected(selectedId: number | string): void {
    const idNum = typeof selectedId === 'string' ? Number(selectedId) : selectedId;
    const selectedPartner = this.allChannelPartnerList().find(
      (p) => p['channel_partner_id'] == idNum || p['channel_partner_id'] == selectedId
    );

    if (selectedPartner) {
      // Only update rera_no if partner has a rera value and it's different from current
      const partnerRera = selectedPartner['rera'] || selectedPartner['rera_no'] || '';
      if (partnerRera) {
        this.addEnquiryform.patchValue({
          rera_no: partnerRera,
        }, { emitEvent: false });
      }
      this.fetchAllCPExecutives(idNum);
    } else {
      // Don't clear rera_no if partner not found yet (might be loading)
      // Only clear if we have an empty list (meaning search completed with no results)
      if (this.allChannelPartnerList().length === 0) {
        const currentReraNo = this.addEnquiryform.get('rera_no')?.value;
        // Only clear if not already set from response
        if (!currentReraNo) {
          this.addEnquiryform.patchValue({ rera_no: '' }, { emitEvent: false });
        }
      }
      this.allCPExeuctiveList.set([]);
    }
  }

  private fetchPreferenceDropdown(projectID: any): void {
    if (!projectID) return;

    this.enquiryService
      .fetchWebConfig(projectID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.preferenceDropdown.set(res),
        error: () => { },
      });
  }

  private fetchAllSourceDetails(sourceId: any): void {
    if (!sourceId) return;

    this.enquiryService
      .fetchSourceDetails(sourceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.sourceDetailedList.set(res),
        error: () => {
          this.snackBar.open('Unable to fetch source details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchAllCPExecutives(channelPartnerID: number): void {
    if (!channelPartnerID) return;

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
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.snackBar.open('Unable to fetch CP executives.', 'Close', {
            duration: 3000,
          });
          return of([]);
        })
      )
      .subscribe({
        next: (res) => {
          const mappedList = res.map((item: any, index: number) => ({
            ...item,
            user_id: item.user_id ?? `temp_null_${index}`,
            full_name: `${item.first_name} ${item.last_name} --(${item.user_phone})`,
          }));
          this.allCPExeuctiveList.set(mappedList);
        },
      });
  }

  private isTempNullId(value: any): boolean {
    return typeof value === 'string' && value.startsWith('temp_null_');
  }



  // ==================== FORM SUBMISSION ====================
  onSubmit(closeResult: any = true): void {
    if (this.addEnquiryform.invalid) return;

    const formData = this.prepareFormData();
    this.loading.set(true);

    this.enquiryService
      .editProjectEnquiry(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.dialog.open(SuccessDialogComponent, {
            data: { message: error.error?.message || 'Something went wrong' },
          });
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(closeResult);
        },
      });
  }

  private prepareFormData(): FormData {
    const formData = new FormData();

    // Ensure sales_executive_id is set for role 7
    if (this.roleId === 7) {
      this.addEnquiryform.get('sales_executive_id')?.patchValue(this.userId);
    }

    const formValues = this.addEnquiryform.getRawValue() as any;

    Object.keys(formValues).forEach((key) => {
      if (key === 'enquiry_photo') return; // Handled separately below

      let value = formValues[key];

      if (key === 'follow_up_date' || key === 'date') {
        value = this.datePipe.transform(value, 'yyyy-MM-dd');
      }

      if (key === 'project_configuration_id' && Array.isArray(value)) {
        value.forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    const file = this.selectedFile();
    if (file) {
      formData.append('enquiry_photo', file, file.name);
    }

    // Explicitly append disabled fields
    ['source_id', 'channel_partner_id', 'source_detail_id', 'sales_executive_id'].forEach((field) => {
      if (!formData.has(field)) {
        const value = this.addEnquiryform.get(field)?.value;
        if (value !== null && value !== undefined) {
          formData.append(field, value);
        }
      }
    });

    formData.append('project_enq_id', this.data.project_enq_id.toString());
    formData.append('updated_by', this.userId.toString());

    return formData;
  }

  claimEnquiry(): void {
    const salesExecutiveId =
      this.roleId === 7
        ? this.userId.toString()
        : this.addEnquiryform.getRawValue().sales_executive_id;

    this.enquiryService
      .claimProjectEnquiry({
        project_enq_id: this.data.project_enq_id,
        sales_executive_id: Number(salesExecutiveId),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.snackBar.open(
            error.error?.message || 'Something went wrong. Please try again.',
            'Close',
            { duration: 3000 }
          );
          return EMPTY;
        })
      )
      .subscribe({
        next: (res: any) => {
          this.dialog.open(SuccessDialogComponent, {
            data: { message: res.message },
          });
          this.onSubmit('claimed');
        },
      });
  }
}