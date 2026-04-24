import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, computed, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import {
  catchError,
  finalize,
  forkJoin,
  of,
  filter,
  distinctUntilChanged,
  debounceTime,
  EMPTY,
} from 'rxjs';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { IndianCurrencyFormatPipe } from '../../../../Pipes/currency/indian-currency-format.pipe';
import { AmountDirective } from '../../../../Common/Amount Direcitve/amount.directive';
import { trigger, transition, style, animate } from '@angular/animations';
import { EnquiryManagementService } from '../services/enquiry-management.service';
import { OtpVerificationDialogComponent } from '../../Projects/QRCODE/qrproject-forom/otp-verification-dialog/otp-verification-dialog.component';

@Component({
  selector: 'app-add-enquiry',
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
  templateUrl: './add-enquiry.component.html',
  styleUrl: './add-enquiry.component.scss',
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
export class AddEnquiryComponent {
  // ============================================================================
  // Dependency Injection
  // ============================================================================
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<AddEnquiryComponent>);
  private readonly enquiryService = inject(EnquiryManagementService);
  readonly data = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly datePipe = new DatePipe('en-US');

  // ============================================================================
  // Constants
  // ============================================================================
  private readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  private readonly roleId = Number(sessionStorage.getItem('role_id'));
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  readonly currentStep = 500000;

  // ============================================================================
  // State Signals
  // ============================================================================
  readonly loading = signal<boolean>(false);
  readonly minDate = signal<Date | null>(new Date());
  readonly maxDate = signal<Date>(this.calculateMaxDate());
  readonly projectEnqID = signal<string>('');
  readonly selectedFile = signal<File | null>(null);
  readonly imageSize = signal<string | null>(null);
  readonly imagePreview = signal<string | null>(null);
  readonly leadID = signal<number>(0);

  // Dropdown data signals
  readonly projectsList = signal<any[]>([]);
  readonly salutationDropdown = signal<any[]>([]);
  readonly ageRangeDropdown = signal<any[]>([]);
  readonly livingPlaceDropdown = signal<any[]>([]);
  readonly nativePlaceDropdown = signal<any[]>([]);
  readonly industryDropdown = signal<any[]>([]);
  readonly possessionReqDropdown = signal<any[]>([]);
  readonly buyingPurposeDropdown = signal<any[]>([]);
  readonly allChannelPartnerList = signal<any[]>([]);
  readonly sourcesList = signal<any[]>([]);
  readonly allLeadLevels = signal<any[]>([]);
  readonly allSalesExecutive = signal<any[]>([]);
  readonly currentLivingPlaceDropdown = signal<any[]>([]);
  readonly sourceDetailedList = signal<any[]>([]);
  readonly preferredBankDropdown = signal<any[]>([]);
  readonly preferenceDropdown = signal<any[]>([]);
  readonly preferredLocationDropdown = signal<any[]>([]);
  readonly allBookingPlans = signal<any[]>([]);
  readonly enqStatusDropdown = signal<any[]>([]);
  readonly allCPExeuctiveList = signal<any[]>([]);
  readonly allSubregions = signal<any[]>([]);
  readonly allCallStatus = signal<any[]>([]);
  readonly projectData = signal<any>({});
  readonly showSourceFields = signal<boolean>(false);

  readonly isOtpSent = signal<boolean>(false);
  readonly isOtpVerified = signal<boolean>(false);
  readonly isOtpLoading = signal<boolean>(false);
  readonly otpErrorMessage = signal<string>('');

  // ============================================================================
  // Private State
  // ============================================================================
  private hasLoadedStaticDropdowns = false;
  private isPatching = false;

  // ============================================================================
  // Computed Signals
  // ============================================================================
  readonly isEditMode = computed(() => !!this.projectEnqID());

  // ============================================================================
  // Helper Methods
  // ============================================================================
  private calculateMaxDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }
  ngOnInit(): void {
    this.fetchAllProjects();
    this.ensureSalesExecutiveIdForRole7();

    // Data from Dialog instead of Route params
    if (this.data) {
      const projectEnqID = this.data.project_enq_id || '';
      const projectID = this.data.project_id || '';

      this.projectEnqID.set(projectEnqID);

      if (projectEnqID) {
        this.minDate.set(null); // Allow past dates in edit mode
        this.fetchSingleEnquiry();
        this.toggleFormFields(this.roleId === 2);
      } else {
        this.toggleFormFields(true);
      }

      if (projectID) {
        this.fetchSingleProject(projectID);
        // If adding a new enquiry for a specific project, patch it
        this.addEnquiryform.get('project_id')?.patchValue(projectID, { emitEvent: true });
      }
    }

    // Project selection with debounce and distinctUntilChanged
    this.addEnquiryform
      .get('project_id')
      ?.valueChanges.pipe(
        filter(() => !this.isPatching),
        distinctUntilChanged(),
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((projectID) => {
        if (projectID) {
          this.handleProjectSelection(projectID);
        }
      });

    // Lead level changes
    this.addEnquiryform
      .get('lead_level_id')
      ?.valueChanges.pipe(
        filter((leadLevelID) => !!leadLevelID),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((leadLevelID) => this.fetchAllCallStatus(leadLevelID));

    // Source ID changes - combined subscription
    this.addEnquiryform
      .get('source_id')
      ?.valueChanges.pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((sourceID) => {
        this.updateSourceValidators(sourceID);
        if (sourceID) {
          this.fetchAllSourceDetails(sourceID);
        }
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

    this.addEnquiryform.get('mobile_no')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.otpErrorMessage.set(''); this.isOtpVerified.set(false); this.isOtpSent.set(false); });
    this.addEnquiryform.get('email_id')?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => { this.otpErrorMessage.set(''); this.isOtpVerified.set(false); this.isOtpSent.set(false); });
  }

  private checkAndShowSourceFields(): void {
    if (this.isEditMode()) {
      this.showSourceFields.set(true);
      return;
    }
    const minBudget = this.addEnquiryform.get('min_budget')?.value ?? 0;
    const maxBudget = this.addEnquiryform.get('max_budget')?.value ?? 0;
    this.showSourceFields.set(minBudget > 0 && maxBudget > 0);
  }

  private updateSourceValidators(sourceId: any): void {
    const channelPartnerControl = this.addEnquiryform.get('channel_partner_id');
    const sourceDetailControl = this.addEnquiryform.get('source_detail_id');

    // Clear existing validators
    channelPartnerControl?.clearValidators();
    sourceDetailControl?.clearValidators();

    if (sourceId === 3) {
      // For source_id = 3, make channel_partner_id required
      channelPartnerControl?.setValidators(Validators.required);
      sourceDetailControl?.setValidators(null);
    } else {
      // For other sources, make source_detail_id required
      channelPartnerControl?.setValidators(null);
      sourceDetailControl?.setValidators(Validators.required);
    }

    // Update validity
    channelPartnerControl?.updateValueAndValidity();
    sourceDetailControl?.updateValueAndValidity();
  }

  // ============================================================================
  // Form Group
  // ============================================================================
  readonly addEnquiryform = new FormGroup({
    min_cost: new FormControl<number | null>(null),
    max_cost: new FormControl<number | null>(null),
    min_budget: new FormControl<number | null>(null, Validators.required),
    max_budget: new FormControl<number | null>(null, Validators.required),
    project_id: new FormControl<string>('', Validators.required),
    user_id: new FormControl<number>(this.userId),
    first_name: new FormControl<string>('', Validators.required),
    date: new FormControl<string>(
      this.datePipe.transform(new Date(), 'yyyy-MM-dd') || '',
      Validators.required
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
    enquiry_status_id: new FormControl<string>(''),
    sales_executive_id: new FormControl<number | null>(null, Validators.required),
    telecaller_name_string: new FormControl<string>(''),
    alternate_mob_no: new FormControl<string>('', [
      Validators.pattern(/^(?:$|[6-9][0-9]{9})$/),
    ]),
    whatsapp_no: new FormControl<string>('', [
      Validators.pattern(/^[6-9]\d{9}$/),
    ]),
    salution_id: new FormControl<string>('', Validators.required),
    age_range_id: new FormControl<string>(' ', Validators.required),
    current_living_place_id: new FormControl<string>('', Validators.required),
    native_place_id: new FormControl<string>('', Validators.required),
    industry_id: new FormControl<string>('', Validators.required),
    company_name: new FormControl<string>(''),
    possession_req_id: new FormControl<string>('', Validators.required),
    buying_purpose_id: new FormControl<string>('', Validators.required),
    booking_plan_within_id: new FormControl<string>('', Validators.required),
    preferred_bank_id: new FormControl<string>(''),
    project_configuration_id: new FormControl<number[]>([], Validators.required),
    project_lead_id: new FormControl<string>(''),
    preferred_location_id: new FormControl<string>(' ', Validators.required),
    job_location: new FormControl<string>(''),
    rera_no: new FormControl<string>(''),
    follow_up_date: new FormControl<string>(
      this.datePipe.transform(new Date(), 'yyyy-MM-dd') || ''
    ),
    source_id: new FormControl<string>('', Validators.required),
    source_detail_id: new FormControl<string>(''),
    channel_partner_id: new FormControl<string>(''),
    source_executive_id: new FormControl<number | string | null>(null),
    sourcing_manager: new FormControl<string>(''),
    source_description: new FormControl<string>(''),
    remark: new FormControl<string>(''),
    lead_level_id: new FormControl<number | null>(null),
    call_status_id: new FormControl<number | null>(null),
    follow_up_period: new FormControl<string>(
      this.datePipe.transform(new Date(), 'HH:mm') || ''
    ),
    enquiry_photo: new FormControl<File | string>(' '),
    created_by: new FormControl<number>(this.userId),
    updated_by: new FormControl<number>(this.userId),
  });

  /**
   * Ensures sales_executive_id is set to userId and disabled when roleId is 7
   */
  private ensureSalesExecutiveIdForRole7(): void {
    if (this.roleId === 7) {
      const salesExecutiveControl = this.addEnquiryform.get('sales_executive_id');
      salesExecutiveControl?.patchValue(this.userId, { emitEvent: false });
      salesExecutiveControl?.disable({ emitEvent: false });
    }
  }

  onMobileNumberChange(event: Event) {
    const mobileNo = (event.target as HTMLInputElement).value;

    // Only fetch lead if mobile number is valid, don't reset fields on invalid input
    if (this.addEnquiryform.get('project_id')?.value && /^(?:\d{10}|\d{12})$/.test(mobileNo)) {
      this.fetchSingleLead(mobileNo);
    }
  }

  private resetFormFields() {
    if (this.isPatching) return;

    this.isPatching = true;

    // Enable all controls before resetting so the user can edit again
    // But keep sales_executive_id disabled for roleId 7
    Object.keys(this.addEnquiryform.controls).forEach(key => {
      if (key === 'sales_executive_id' && this.roleId === 7) {
        // Keep disabled for roleId 7
        return;
      }
      this.addEnquiryform.get(key)?.enable({ emitEvent: false });
    });

    // Reset key patched fields to blank / default state
    const resetValues = {
      first_name: null, middle_name: null, last_name: null, email_id: null,
      enquiry_status_id: null, sales_executive_id: null, alternate_mob_no: null,
      whatsapp_no: null, salution_id: null, age_range_id: null,
      current_living_place_id: null, native_place_id: null, industry_id: null,
      company_name: null, possession_req_id: null, buying_purpose_id: null,
      booking_plan_within_id: null, preferred_location_id: null,
      preferred_bank_id: null, job_location: null, source_id: null,
      source_detail_id: null, channel_partner_id: null, source_executive_id: null,
      sourcing_manager: null, source_description: null, remark: null,
      lead_level_id: null, call_status_id: null, project_configuration_id: null,
      telecaller_name_string: null,

    };

    this.addEnquiryform.patchValue(resetValues, { emitEvent: false });

    // Ensure sales_executive_id is set for roleId 7
    this.ensureSalesExecutiveIdForRole7();

    this.isPatching = false;
  }

  // Helper to lock the form after a lead is auto-filled, keeping only specific fields disabled
  private disableFormFieldsAfterLeadFetch(): void {
    const fieldsToDisable = [
      'telecaller_name_string',
      'mobile_no',
    ];

    fieldsToDisable.forEach(field => {
      this.addEnquiryform.get(field)?.disable({ emitEvent: false });
    });
  }

  fetchSingleLead(mobNo: string): void {
    const projectId = this.addEnquiryform.get('project_id')?.value;
    if (!projectId) return;

    this.http
      .post<any>(`${this.baseUrl}/fetch_single_lead`, {
        project_id: projectId,
        mobile_no: mobNo,
      })
      .pipe(
        catchError(() => {
          this.snackBar.open('Lead Not Found', 'Close', { duration: 3000 });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res?.data) {
            const leadData = res.data;
            this.leadID.set(leadData.project_lead_id || 0);

            const formData = {
              project_lead_id: leadData.project_lead_id,
              first_name: leadData.customer_name,
              telecaller_name_string: leadData.telecaller_name_string,
              status_id: leadData.status_id,
              lead_type_id: leadData.lead_type_id,
              follow_up_date: leadData.follow_up_date,
              follow_up_time: leadData.follow_up_time,
              mobile_no: leadData.mobile_no?.toString() || '',
              alternate_mob_no: leadData.alternate_mob_no?.toString() || '',
              whatsapp_no: leadData.whatsapp_no?.toString() || '',
              email_id: leadData.email_id,
              project_configuration_id: Array.isArray(leadData.project_configuration_id)
                ? leadData.project_configuration_id
                : leadData.project_configuration_id != null
                  ? [leadData.project_configuration_id]
                  : [],
              is_site_visited: leadData.is_site_visited,
              site_visited_date: leadData.site_visited_date,
              is_booked: leadData.is_booked,
              remark: leadData.remark,
              telecaller_id: leadData.telecaller_id?.[0] || null,
              sales_executive_id: leadData.sales_executive_id,
              source_id: leadData.source_id,
              source_detail_id: leadData.source_detail_id,
              channel_partner_id: leadData.channel_partner_id,
              source_description: leadData.source_description,
              data_from_id: leadData.data_from_id,
            };

            this.patchFormData(formData);
            this.disableFormFieldsAfterLeadFetch();

            if (leadData.channel_partner_id) {
              this.onPartnerSearch('', true, leadData.channel_partner_id);
            }
          }
        },
      });
  }
  fetchAllSubregions(cityId: number): void {
    if (!cityId) return;

    this.http
      .post<any[]>(`${this.baseUrl}/sub_region_dropdown`, { city_id: cityId })
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch sub-regions.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.allSubregions.set(res || []));
  }

  /**
   * Utility method: returns the city_id for the given project_id, if available.
   */
  private getCityIdFromProject(projectId: any): number | undefined {
    if (!projectId) return undefined;
    const project = this.projectsList().find((p: any) => p.project_id == projectId);
    return project?.city_id;
  }

  private handleProjectSelection(projectID: any): void {
    if (!projectID) {
      return;
    }
    if (!this.hasLoadedStaticDropdowns) {
      // Ensure sales_executive_id is set for roleId 7


      this.fetchAllDropdowns();
      this.hasLoadedStaticDropdowns = true;
    }
    this.fetchSingleProject(projectID);
    this.fechpreferencedropdown(projectID);

    this.fetchAllSalesExecutive(projectID);
    this.fetchAllSourceList();
    const cityId = this.getCityIdFromProject(projectID);
    if (cityId) {
      this.fetchAllSubregions(cityId);
    }
  }


  private patchFormData(responseData: any) {
    this.isPatching = true;



    this.addEnquiryform.patchValue({
      ...responseData,
      salution_id: responseData.salution_id // Handle typo from API
    }, { emitEvent: false });
    if (responseData.channel_partner_id) {
      this.onPartnerSearch('', true, responseData.channel_partner_id);
      this.fetchAllCPExecutives(responseData.channel_partner_id);
    }
    this.fetchAllSourceList();
    if (responseData.source_id) {
      this.updateSourceValidators(responseData.source_id);
      this.fetchAllSourceDetails(responseData.source_id);
    }

    // Ensure sales_executive_id is set for roleId 7
    this.ensureSalesExecutiveIdForRole7();

    this.isPatching = false;
  }

  fetchSingleEnquiry(): void {
    const projectEnqID = this.projectEnqID();
    if (!projectEnqID) return;

    this.http
      .post<any>(`${this.baseUrl}/fetch_single_project_enq`, {
        project_enq_id: projectEnqID,
      })
      .pipe(
        catchError(() => {
          this.snackBar.open('Error fetching data, please try later', 'Close', {
            duration: 3000,
          });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.isPatching = true;

            this.addEnquiryform.patchValue({ ...res, date: res.date }, { emitEvent: false });

            if (res.channel_partner_id) {
              this.onPartnerSearch('', true, res.channel_partner_id);
              this.fetchAllCPExecutives(res.channel_partner_id);
            }
            if (res.source_id) {
              this.updateSourceValidators(res.source_id);
              this.fetchAllSourceDetails(res.source_id);
            }

            this.imagePreview.set(
              res.enquiry_photo ? `${this.storageUrl}/${res.enquiry_photo}` : null
            );

            ['lead_level_id', 'call_status_id', 'follow_up_period', 'follow_up_date', 'remark'].forEach(
              (field) => this.addEnquiryform.get(field)?.disable()
            );

            this.ensureSalesExecutiveIdForRole7();
            this.isPatching = false;
            this.handleProjectSelection(res.project_id);
          }
        },
      });
  }

  fetchSingleProject(projectID: any): void {
    const projectEnqID = this.projectEnqID();
    const requestData = projectEnqID
      ? { project_enq_id: projectEnqID }
      : { project_id: projectID };

    this.http
      .post<any>(`${this.baseUrl}/fetch_project_budget`, requestData)
      .pipe(
        catchError((err) => {
          console.error(err);
          this.snackBar.open('Unable to fetch project details.', 'Close', {
            duration: 3000,
          });
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const data = res.data || res;
          this.projectData.set(data);

          this.addEnquiryform.patchValue({
            min_cost: data?.min_cost,
            max_cost: data?.max_cost,
          });
          this.checkAndShowSourceFields();
        },
      });
  }

  onChangeFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    this.selectedFile.set(file);
    this.imageSize.set(`${(file.size / 1024).toFixed(2)} KB`);

    if (file.type.startsWith('image')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.imagePreview.set(null);
    }

    this.addEnquiryform.patchValue({ enquiry_photo: file });
  }

  onSubmit(): void {
    if (this.addEnquiryform.invalid) return;

    if (this.projectData()?.enq_otp_status === 1 && !this.isOtpVerified() && !this.projectEnqID()) {
      this.snackBar.open('Please verify OTP before submitting.', 'Close', { duration: 3000 });
      return;
    }

    const formData = new FormData();
    this.loading.set(true);

    const formValues = this.addEnquiryform.getRawValue();
    const leadIDValue = this.leadID();
    const projectEnqIDValue = this.projectEnqID();

    if (leadIDValue) {
      formData.append('project_lead_id', leadIDValue.toString());
    }

    const sourceExecutiveId = this.isTempNullId(formValues.source_executive_id)
      ? null
      : formValues.source_executive_id;

    Object.keys(formValues).forEach((key) => {
      const val =
        key === 'source_executive_id' ? sourceExecutiveId : (formValues as any)[key];
      let value = val;

      if (key === 'follow_up_date' || key === 'date') {
        value = this.datePipe.transform(value, 'yyyy-MM-dd');
      }

      if (key === 'source_executive_id') {
        formData.append(key, value ?? 'null');
      } else if (value != null) {
        if (key === 'project_configuration_id' && Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else {
          formData.append(key, value);
        }
      }
    });

    const selectedFile = this.selectedFile();
    if (selectedFile) {
      formData.append('enquiry_photo', selectedFile, selectedFile.name);
    }

    const apiUrl = projectEnqIDValue
      ? `${this.baseUrl}/edit_project_enquiry`
      : `${this.baseUrl}/add_project_enquiry`;

    if (projectEnqIDValue) {
      formData.append('project_enq_id', projectEnqIDValue);
      formData.append('updated_by', this.userId.toString());
    }

    this.http
      .post<any>(apiUrl, formData)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const dialogData = {
            status: res.success && res.status !== false,
            message: res?.message || 'An error occurred',
          };

          if (res.success && res.status !== false) {
            this.dialog.open(SuccessDialogComponent, { data: dialogData });
            this.dialogRef.close(true);
          } else if (res.success === true && res.status === false) {
            dialogData.status = false;
            this.dialog.open(SuccessDialogComponent, { data: dialogData });
          } else if (res.code === 201) {
            dialogData.status = false;
            dialogData.message =
              res?.message ||
              'An error occurred while updating payment stage';
            this.dialog.open(SuccessDialogComponent, { data: dialogData });
          }
        },
      });
  }

  sendOtp(): void {
    const firstName = this.addEnquiryform.get('first_name')?.value;
    const lastName = this.addEnquiryform.get('last_name')?.value;
    const mobileNo = this.addEnquiryform.get('mobile_no')?.value;
    const emailId = this.addEnquiryform.get('email_id')?.value;
    const projectId = this.addEnquiryform.get('project_id')?.value;

    if (!firstName || !lastName || !mobileNo || !emailId || !projectId) {
      this.snackBar.open('Please fill in Name, Mobile, and Email before sending OTP.', 'Close', { duration: 3000 });
      return;
    }

    const payload = {
      mobile_no: mobileNo,
      email_id: emailId,
      project_id: Number(projectId),
      first_name: firstName,
      last_name: lastName
    };

    this.otpErrorMessage.set('');
    this.isOtpLoading.set(true);
    this.enquiryService.sendOtpToEnquiry(payload)
      .pipe(
        finalize(() => this.isOtpLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          if (res.success && res.status !== false) {
            this.isOtpSent.set(true);
            this.snackBar.open('OTP sent successfully. Opening verification window...', 'Close', { duration: 3000, panelClass: ['bg-green-600', 'text-white'] });
            this.openOtpDialog(payload);
          } else {
            const errorMsg = res.message || 'Failed to send OTP. Please try again.';
            this.otpErrorMessage.set(errorMsg);
            this.snackBar.open(errorMsg, 'Close', { duration: 3000 });
          }
        },
        error: () => {
          this.otpErrorMessage.set('An error occurred while sending OTP.');
          this.snackBar.open('An error occurred while sending OTP.', 'Close', { duration: 3000 });
        }
      });
  }

  private openOtpDialog(data: any): void {
    const dialogRef = this.dialog.open(OtpVerificationDialogComponent, {
      data,
      width: '30vw',
      disableClose: true,
      panelClass: 'custom-otp-dialog'
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.isOtpVerified.set(true);
        this.isOtpSent.set(true);
      }
    });
  }

  fetchAllDropdowns(): void {
    this.ensureSalesExecutiveIdForRole7();

    // Parallel fetch for static dropdowns using forkJoin
    forkJoin({
      salutation: this.http.get<any[]>(`${this.baseUrl}/salutation_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch salutation data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      ageRange: this.http.get<any[]>(`${this.baseUrl}/age_range_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch age range data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      livingPlace: this.http.get<any[]>(`${this.baseUrl}/current_living_place_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch living place data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      nativePlace: this.http.get<any[]>(`${this.baseUrl}/native_place_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch native place data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      industry: this.http.get<any[]>(`${this.baseUrl}/industry_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch industry data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      possessionReq: this.http.get<any[]>(`${this.baseUrl}/possession_req_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch possession requirement data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      buyingPurpose: this.http.get<any[]>(`${this.baseUrl}/buying_purpose_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch buying purpose data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      preferredBank: this.http.get<any[]>(`${this.baseUrl}/preferred_bank_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch preferred bank data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      preferredLocation: this.http.get<any[]>(`${this.baseUrl}/fetch_preferred_location`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch preferred location data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      enqStatus: this.http.get<any[]>(`${this.baseUrl}/enq_status_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch enquiry status data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      leadLevels: this.http.get<any[]>(`${this.baseUrl}/fetch_lead_level`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch lead levels.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      currentLivingPlace: this.http.get<any[]>(`${this.baseUrl}/preferred_location_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch current living place data.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
      bookingPlans: this.http.get<any[]>(`${this.baseUrl}/booking_plan_dropdown`).pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch booking plans.', 'Close', { duration: 3000 });
          return of([]);
        })
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results) => {
        this.salutationDropdown.set(results.salutation || []);
        this.ageRangeDropdown.set(results.ageRange || []);
        this.livingPlaceDropdown.set(results.livingPlace || []);
        this.nativePlaceDropdown.set(results.nativePlace || []);
        this.industryDropdown.set(results.industry || []);
        this.possessionReqDropdown.set(results.possessionReq || []);
        this.buyingPurposeDropdown.set(results.buyingPurpose || []);
        this.preferredBankDropdown.set(results.preferredBank || []);
        this.preferredLocationDropdown.set(results.preferredLocation || []);
        this.enqStatusDropdown.set(results.enqStatus || []);
        this.allLeadLevels.set(results.leadLevels || []);
        this.currentLivingPlaceDropdown.set(results.currentLivingPlace || []);
        this.allBookingPlans.set(results.bookingPlans || []);
      });
  }

  fetchAllProjects(): void {
    this.loading.set(true);

    this.http
      .post<any>(`${this.baseUrl}/user_project_dropdown`, { user_id: this.userId })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error(err);
          this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const projectRecords = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];

        this.projectsList.set(projectRecords);

        // If a project is already selected, load its sub-regions
        const selectedProjectId = this.addEnquiryform.get('project_id')?.value;
        const cityId = this.getCityIdFromProject(selectedProjectId);
        if (cityId) {
          this.fetchAllSubregions(cityId);
        }
      });
  }

  /**
   * Helper method to check if a value is a temporary ID for null user_id
   */
  private isTempNullId(value: any): boolean {
    return typeof value === 'string' && value.startsWith('temp_null_');
  }

  fetchAllCPExecutives(channelPartnerID: number): void {
    this.loading.set(true);
    this.http
      .post<any[]>(`${this.baseUrl}/fetch_cp_executives`, {
        channel_partner_id: [channelPartnerID],
        active_status_id: 1,
        approve_status_id: 1,
        is_dummy: 1,
      })
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError((err) => {
          console.error('Error fetching CP executives:', err);
          this.snackBar.open('Unable to fetch channel partners.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const mappedList = res.map((item: any, index: number) => ({
            ...item,
            user_id: item.user_id ?? `temp_null_${index}`,
            full_name: `${item.first_name} ${item.last_name} --(${item.user_phone})`,
          }));
          this.allCPExeuctiveList.set(mappedList);

          // Verify temporary ID still exists
          const currentValue =
            this.addEnquiryform.get('source_executive_id')?.value;
          if (
            this.isTempNullId(currentValue) &&
            !mappedList.some((item: any) => item.user_id === currentValue)
          ) {
            this.addEnquiryform.patchValue(
              { source_executive_id: null },
              { emitEvent: false }
            );
          }
        },
      });
  }

  fetchAllSalesExecutive(projectID: any): void {
    this.http
      .post<any[]>(`${this.baseUrl}/project_sales_executive_dropdown`, {
        project_id: projectID,
      })
      .pipe(
        catchError((err) => {
          console.error(err);
          this.snackBar.open('Unable to fetch sales executives.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.allSalesExecutive.set(res || []));
  }

  fetchAllSourceList(): void {
    this.http
      .get<any[]>(`${this.baseUrl}/source_dropdown`)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch source details.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.sourcesList.set(res || []));
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

    const requestBody: any = loadInitialData
      ? {}
      : {
        firm_name: trimmedSearch,
        channel_partner_id: null,
      };

    const idToUse =
      channelPartnerId !== undefined
        ? channelPartnerId
        : this.addEnquiryform.value.channel_partner_id;

    if (loadInitialData && idToUse) {
      requestBody.channel_partner_id = idToUse;
    }

    this.http
      .post<any[]>(`${this.baseUrl}/channel_partner_dropdown`, requestBody)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch partners.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const mappedList = res.map((item: any) => ({
          ...item,
          full_name: `${item.firm_name} --(${item.cp_owner})`,
        }));
        this.allChannelPartnerList.set(mappedList);
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
  fechpreferencedropdown(projectID: any): void {
    this.http
      .post<any[]>(`${this.baseUrl}/web_config_dropdown`, { project_id: projectID })
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.preferenceDropdown.set(res || []));
  }

  fetchAllSourceDetails(sourceId: any): void {
    if (!sourceId) {
      this.sourceDetailedList.set([]);
      return;
    }

    this.http
      .post<any[]>(`${this.baseUrl}/source_detail_dropdown`, { source_id: sourceId })
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch source details.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.sourceDetailedList.set(res || []));
  }

  fetchAllCallStatus(leadLevelID: any): void {
    if (!leadLevelID) {
      this.allCallStatus.set([]);
      return;
    }

    this.http
      .post<any[]>(`${this.baseUrl}/call_status_dropdown`, {
        lead_level_id: leadLevelID,
      })
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch call statuses.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => this.allCallStatus.set(res || []));
  }
  private toggleFormFields(enable: boolean): void {
    const fields = [
      'project_id',
      'sales_executive_id',
      'channel_partner_id',
      'source_id',
      'rera_no',

      'source_executive_id',
      'source_description',
      'follow_up_date',
    ];

    fields.forEach((field) => {
      const control = this.addEnquiryform.get(field);
      // Keep sales_executive_id disabled for roleId 7 even if enabling other fields
      if (field === 'sales_executive_id' && this.roleId === 7) {
        control?.disable({ emitEvent: false });
      } else {
        enable ? control?.enable() : control?.disable();
      }
    });
  }
  getInvalidFields(): string[] {
    const invalidFields: string[] = [];
    const form = this.addEnquiryform;

    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control?.invalid && control?.errors?.['required']) {
        // Convert camelCase to space-separated words for better readability
        const fieldName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        invalidFields.push(fieldName);
      }
    });

    return invalidFields;
  }

  private parseNumberValue(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  getBudgetValue(controlName: string, fallbackControl: string): number {
    const primary = this.parseNumberValue(
      this.addEnquiryform.get(controlName)?.value
    );
    if (primary > 0) {
      return primary;
    }
    return this.parseNumberValue(
      this.addEnquiryform.get(fallbackControl)?.value
    );
  }

  hasValidBudgetRange(): boolean {
    return (
      this.parseNumberValue(this.addEnquiryform.get('min_budget')?.value) > 0 &&
      this.parseNumberValue(this.addEnquiryform.get('max_budget')?.value) > 0
    );
  }
}
