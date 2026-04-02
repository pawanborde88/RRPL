import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  DestroyRef,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { AadharcardNoformatDirective } from '../../../../../Common/directives/Aadhar/aadharcard-noformat.directive';
import { PANNoDirective } from '../../../../../Common/directives/panno.directive';
import { BookingService, Applicant, BookingInfo, ApiResponse } from '../../../../../Service/booking.service';
import { AuthService } from '../../../../../Service/auth.service';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';

// Constants
const MAX_APPLICANTS = 4;
const MOBILE_PATTERN = /^\d{10}$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|in)$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface ApplicantFormValue {
  salutation_id: number | null;
  gender: number | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  occupation_id: number | null;
  alternate_mobile_no: string;
  whatsapp_no: string;
  pan_no: string;
  aadhar_no: string;
  dob: string | Date | null;
  anniversary_date: string | Date | null;
  current_address: string;
  permanent_address: string;
  mobile_no: string;
  email: string;
}

@Component({
  selector: 'app-add-applicants',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    AadharcardNoformatDirective,
    PANNoDirective
  ],
  templateUrl: './add-applicants.component.html',
  styleUrl: './add-applicants.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddApplicantsComponent implements OnInit {
  // ============================================================================
  // Dependency Injection
  // ============================================================================
  private readonly bookingService = inject(BookingService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // Inputs & Outputs
  // ============================================================================
  bookingId = input<number | undefined>();
  applicantBooked = output<boolean>();
  saveSuccess = output<void>();

  // ============================================================================
  // Signals for Reactive State
  // ============================================================================
  readonly allOccupations = signal<Array<{ occupation_id: number; occupation: string }>>([]);
  readonly salutationDropdown = signal<Array<{ salution_id: number; salution: string }>>([]);
  readonly bookingInfo = signal<BookingInfo | null>(null);
  readonly savedApplicants = signal<boolean[]>([false, false, false, false]);
  readonly isLoading = signal<boolean>(false);
  readonly selectedTabIndex = signal<number>(0);

  // Computed signals
  readonly hasBookingId = computed(() => !!this.bookingId());
  readonly userId = computed(() => this.authService.userId());

  // ============================================================================
  // Form Management
  // ============================================================================
  readonly addBookingForm = new FormGroup({
    applicants: new FormArray<FormGroup<Record<keyof ApplicantFormValue, AbstractControl>>>([])
  });

  get applicants(): FormArray<FormGroup> {
    return this.addBookingForm.get('applicants')! as FormArray<FormGroup>;
  }

  // ============================================================================
  // Constructor & Lifecycle
  // ============================================================================
  constructor() {
    // Effect to handle booking info updates
    effect(() => {
      const info = this.bookingInfo();
      if (!info) return;

      const { project_enq_id, token_id } = info;
      if (project_enq_id) {
        this.loadEnquiryData(project_enq_id);
      }
      if (token_id) {
        this.loadTokenData(token_id);
      }
    });

    // Effect to emit applicantBooked status
    effect(() => {
      const isAnySaved = this.savedApplicants().some(saved => saved);
      this.applicantBooked.emit(isAnySaved);
    });

    // Reactive bookingId changes
    toObservable(this.bookingId)
      .pipe(takeUntilDestroyed())
      .subscribe(newBookingId => {
        if (newBookingId) {
          this.loadBookingData(newBookingId);
        }
      });
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  // ============================================================================
  // Initialization
  // ============================================================================
  private initializeComponent(): void {
    this.initializeForm();
    this.loadDropdownData();

    const currentBookingId = this.bookingId();
    if (currentBookingId) {
      this.loadBookingData(currentBookingId);
    }
  }

  private initializeForm(): void {
    this.applicants.clear();
    this.savedApplicants.set([false, false, false, false]);

    for (let i = 0; i < MAX_APPLICANTS; i++) {
      this.applicants.push(this.createApplicantForm());
    }
  }

  private loadDropdownData(): void {
    combineLatest([
      this.bookingService.fetchAllOccupations().pipe(
        catchError(() => of([]))
      ),
      this.bookingService.fetchAllSalutations().pipe(
        catchError(() => of([]))
      )
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([occupations, salutations]) => {
        this.allOccupations.set(occupations as Array<{ occupation_id: number; occupation: string }>);
        this.salutationDropdown.set(salutations as Array<{ salution_id: number; salution: string }>);
      });
  }

  // ============================================================================
  // Form Creation
  // ============================================================================
  private createApplicantForm(): FormGroup {
    return new FormGroup({
      salutation_id: new FormControl<number | null>(null),
      gender: new FormControl<number | null>(null, Validators.required),
      first_name: new FormControl<string>('', Validators.required),
      middle_name: new FormControl<string>(''),
      last_name: new FormControl<string>('', Validators.required),
      occupation_id: new FormControl<number | null>(null, Validators.required),
      alternate_mobile_no: new FormControl<string>('', [
        Validators.pattern(MOBILE_PATTERN)
      ]),
      whatsapp_no: new FormControl<string>('', [
        Validators.pattern(MOBILE_PATTERN)
      ]),
      pan_no: new FormControl<string>('', [
        Validators.required,
        Validators.pattern(PAN_PATTERN)
      ]),
      aadhar_no: new FormControl<string>(
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{4}-\d{4}-\d{4}$/)
        ]
      ), dob: new FormControl<string | Date | null>(null),
      anniversary_date: new FormControl<string | Date | null>(null),
      current_address: new FormControl<string>('', Validators.required),
      permanent_address: new FormControl<string>(''),
      mobile_no: new FormControl<string>('', [
        Validators.required,
        Validators.pattern(MOBILE_PATTERN),
        Validators.minLength(10),
        Validators.maxLength(10)
      ]),
      email: new FormControl<string>('', [
        Validators.required,
        Validators.email,
        Validators.pattern(EMAIL_PATTERN)
      ])
    });
  }

  // ============================================================================
  // Booking Data Loading
  // ============================================================================
  private loadBookingData(bookingId: number): void {
    this.isLoading.set(true);

    combineLatest([
      this.bookingService.fetchSingleBooking(bookingId).pipe(
        catchError(() => of({ success: false, data: null }))
      ),
      this.bookingService.fetchBookingApplicants(bookingId).pipe(
        catchError(() => of([]))
      )
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([bookingResponse, applicants]) => {
        this.isLoading.set(false);

        if (bookingResponse.success && bookingResponse.data) {
          this.bookingInfo.set(bookingResponse.data);
        }

        if (Array.isArray(applicants) && applicants.length > 0) {
          // Update forms and ensure buttons are disabled for existing applicants
          this.updateApplicantForms(applicants);
          // Ensure saved status is set correctly after fetchBookingApplicants
          const updatedStatus = [...this.savedApplicants()];
          for (let i = 0; i < Math.min(applicants.length, MAX_APPLICANTS); i++) {
            updatedStatus[i] = true; // Mark as saved if data exists from server
          }
          this.savedApplicants.set(updatedStatus);
        }
      });
  }

  private updateApplicantForms(applicantsData: Applicant[]): void {
    this.applicants.clear();
    const savedStatus = Array(MAX_APPLICANTS).fill(false);

    const formsToCreate = Math.min(applicantsData.length, MAX_APPLICANTS);
    for (let i = 0; i < formsToCreate; i++) {
      this.applicants.push(this.createApplicantForm());
      this.patchApplicantForm(i, applicantsData[i]);
      savedStatus[i] = true;
    }

    for (let i = formsToCreate; i < MAX_APPLICANTS; i++) {
      this.applicants.push(this.createApplicantForm());
    }

    this.savedApplicants.set(savedStatus);
  }

  // Another approach - using type assertion
  private patchApplicantForm(index: number, data: Applicant): void {
    if (index >= this.applicants.length) return;

    const formGroup = this.applicants.at(index);
    const applicantData = data as any; // Temporary type assertion

    const patchData: Partial<ApplicantFormValue> = {
      salutation_id: applicantData.salutation_id || applicantData.salution_id || null,
      first_name: applicantData.first_name || '',
      middle_name: applicantData.middle_name || '',
      last_name: applicantData.last_name || '',
      mobile_no: applicantData.mobile_no || '',
      alternate_mobile_no: applicantData.alternate_mobile_no || '',
      whatsapp_no: applicantData.whatsapp_no || '',
      email: applicantData.email || '',
      pan_no: applicantData.pan_no || '',
      aadhar_no: applicantData.aadhar_no || '',
      occupation_id: applicantData.occupation_id || null,
      current_address: applicantData.current_address || '',
      permanent_address: applicantData.permanent_address || '',
      gender: (applicantData.gender !== undefined && applicantData.gender !== null) ? Number(applicantData.gender) : null,
    };

    if (applicantData.dob) {
      patchData.dob = this.convertToDate(applicantData.dob);
    }
    if (applicantData.anniversary_date) {
      patchData.anniversary_date = this.convertToDate(applicantData.anniversary_date);
    }

    formGroup.patchValue(patchData as any, { emitEvent: false });
  }

  private convertToDate(dateString: string | Date | null): Date | null {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;

    try {
      const parsedDate = new Date(dateString);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    } catch {
      return null;
    }
  }

  // ============================================================================
  // Enquiry & Token Data Loading
  // ============================================================================
  private loadEnquiryData(projectEnquiryID: number): void {
    this.bookingService.fetchSingleEnquiry(projectEnquiryID)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null))
      )
      .subscribe((enquiryData) => {
        if (enquiryData && this.applicants.length > 0) {
          this.patchFirstApplicantFromEnquiry(enquiryData.data);
        }
      });
  }

  private loadTokenData(tokenID: number): void {
    this.bookingService.fetchSingleToken(tokenID)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of(null))
      )
      .subscribe((tokenData) => {
        if (tokenData && this.applicants.length > 0) {
          this.patchFirstApplicantFromToken(tokenData);
        }
      });
  }

  private patchFirstApplicantFromEnquiry(enquiryData: any): void {
    const firstApplicant = this.applicants.at(0);
    firstApplicant.patchValue({
      first_name: enquiryData.first_name || '',
      last_name: enquiryData.last_name || '',
      mobile_no: enquiryData.mobile_no || '',
      email: enquiryData.email || ''
    }, { emitEvent: false });
  }

  private patchFirstApplicantFromToken(tokenData: any): void {
    const firstApplicant = this.applicants.at(0);
    firstApplicant.patchValue({
      first_name: tokenData.first_name || '',
      last_name: tokenData.last_name || '',
      mobile_no: tokenData.mobile_no || '',
      email: tokenData.email || ''
    }, { emitEvent: false });
  }

  // ============================================================================
  // Applicant Booking
  // ============================================================================
  bookApplicant(index: number): void {
    const applicant = this.applicants.at(index);
    const bookingId = this.bookingId();
    const savedStatus = this.savedApplicants();

    // Prevent saving if already saved, invalid, or no booking ID
    if (savedStatus[index] || !applicant.valid || !bookingId) {
      return;
    }

    this.isLoading.set(true);
    const formData = this.prepareBookingData(applicant.value, bookingId);

    this.bookingService.addBookingApplicant(formData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.isLoading.set(false)),
        catchError((error) => {
          this.isLoading.set(false);
          this.handleError('Unable to save applicant details.', error);
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response?.status) {
          // Mark as saved immediately to disable button
          this.updateSavedStatus(index, true);

          // Open success dialog
          const dialogRef = this.dialog.open(SuccessDialogComponent, {
            data: {
              status: true,
              message: 'Applicant added'
            },
          });

          // After dialog closes, fetch booking applicants
          dialogRef.afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.saveSuccess.emit(); // Emit success to parent
              if (bookingId) {
                this.refreshApplicants(bookingId);
              }
            });
        } else {
          this.handleError(response?.message || 'Failed to save applicant details.');
        }
      });
  }

  private prepareBookingData(formValue: any, bookingId: number): any {
    const data = { ...formValue, booking_id: bookingId };

    if (data.dob) {
      data.dob = this.formatDate(data.dob);
    }
    if (data.anniversary_date) {
      data.anniversary_date = this.formatDate(data.anniversary_date);
    }

    const userId = this.userId();
    data.created_by = userId;
    data.updated_by = userId;

    return data;
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  private refreshApplicants(bookingId: number): void {
    this.bookingService.fetchBookingApplicants(bookingId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => of([]))
      )
      .subscribe((applicants) => {
        if (applicants.length > 0) {
          // Update forms with fetched data - this will also update saved status
          this.updateApplicantForms(applicants);
          // Ensure all fetched applicants are marked as saved to disable buttons
          const updatedStatus = [...this.savedApplicants()];
          for (let i = 0; i < Math.min(applicants.length, MAX_APPLICANTS); i++) {
            updatedStatus[i] = true; // Mark as saved if data exists from server
          }
          this.savedApplicants.set(updatedStatus);
        }
      });
  }

  private updateSavedStatus(index: number, status: boolean): void {
    const current = this.savedApplicants();
    const updated = [...current];
    updated[index] = status;
    this.savedApplicants.set(updated);
  }

  // ============================================================================
  // UI Helpers
  // ============================================================================
  sanitizeMobileInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      const sanitized = input.value.replace(/[^0-9]/g, '').slice(0, 10);
      const applicant = this.applicants.at(index);
      applicant.get('mobile_no')?.setValue(sanitized, { emitEvent: true });
    }
  }

  copyCurrentToPermanent(index: number): void {
    const applicant = this.applicants.at(index);
    const currentAddress = applicant.get('current_address')?.value;

    if (currentAddress) {
      applicant.get('permanent_address')?.setValue(currentAddress);
    } else {
      this.snackBar.open('Current address is empty', 'Close', {
        duration: 2000
      });
    }
  }

  // ============================================================================
  // Error & Success Handlers
  // ============================================================================
  private handleSuccess(index: number): void {
    this.snackBar.open(`Applicant ${index + 1} details saved successfully!`, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private handleError(message: string, error?: any): void {
    if (error) {
      console.error('Error:', error);
    }
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}
