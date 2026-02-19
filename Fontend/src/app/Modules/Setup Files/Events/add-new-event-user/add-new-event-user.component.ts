import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';

// ============ INTERFACE DEFINITIONS ============
interface EventDetails {
  event_id: number;
  event_title: string;
  event_description: string;
  event_date: string;
  event_venue: string;
  event_image?: string;
  [key: string]: any; // For additional properties
}

interface UserRegistration {
  event_id: number;
  name: string;
  mobile: string;
  email: string;
  firm_name: string;
  rera_no: string;
}

interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data?: T;
}

// Form control interfaces
interface UserFormControls {
  event_id: FormControl<number | null>;
  name: FormControl<string | null>;
  mobile: FormControl<string | null>;
  email: FormControl<string | null>;
  firm_name: FormControl<string | null>;
  rera_no: FormControl<string | null>;
}

@Component({
  selector: 'app-add-new-event-user',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    TruncatePipe
  ],
  templateUrl: './add-new-event-user.component.html',
  styleUrls: ['./add-new-event-user.component.scss']
})
export class AddNewEventUserComponent implements OnInit, OnDestroy {
  // ============ PUBLIC PROPERTIES ============
  readonly storageUrl = environment.STORAGE_URL;
  readonly baseUrl = environment.API_URL;

  eventDetails: EventDetails | null = null;
  userForm!: FormGroup<UserFormControls>;
  eventId!: number;

  // Loading states
  isLoading = false;
  isSubmitting = false;

  // ============ PRIVATE PROPERTIES ============
  private destroy$ = new Subject<void>();

  // ============ CONSTRUCTOR ============
  constructor(
    private fb: FormBuilder,
    private fetchService: FetchFunctionsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  // ============ LIFECYCLE HOOKS ============
  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============ INITIALIZATION ============
  private initializeComponent(): void {
    this.parseRouteParams();
    this.initForm();
  }

  private parseRouteParams(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.eventId = idParam ? Number(idParam) : 0;

    if (!this.eventId || isNaN(this.eventId) || this.eventId <= 0) {
      this.showErrorMessage('Invalid event ID provided');
      return;
    }
  }

  // ============ FORM MANAGEMENT ============
  private initForm(): void {
    this.userForm = this.fb.group<UserFormControls>({
      event_id: this.fb.control({
        value: this.eventId,
        disabled: true
      }, {
        validators: [Validators.required, Validators.min(1)]
      }),
      name: this.fb.control('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-Z\s.'-]+$/)
      ]),
      mobile: this.fb.control('', [
        Validators.required,
        Validators.pattern('^[0-9]{10}$')
      ]),
      email: this.fb.control('', [
        Validators.required,
        Validators.email,
        Validators.maxLength(150)
      ]),
      firm_name: this.fb.control('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(200)
      ]),
      rera_no: this.fb.control('', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ])
    });

    // Fetch event details after form initialization
    if (this.eventId) {
      this.fetchEventDetails();
    }
  }

  // ============ DATA FETCHING ============
  private fetchEventDetails(): void {
    this.isLoading = true;

    const payload = { event_id: this.eventId };

    this.http.post<ApiResponse<EventDetails>>(
      `${this.baseUrl}/fetch_single_events`,
      payload
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleEventDetailsResponse(response),
        error: (error) => this.handleEventDetailsError(error)
      });
  }

  private handleEventDetailsResponse(response: any): void {
    console.log('API Response received:', response);
    this.isLoading = false;

    // Handle various response structures (object, array, wrapped in data)
    let eventData = null;

    if (response?.data) {
      eventData = Array.isArray(response.data) ? response.data[0] : response.data;
    } else if (Array.isArray(response)) {
      eventData = response[0];
    } else if (response && typeof response === 'object' && !response.status) {
      // If the response is the object itself (no wrapper)
      eventData = response;
    }

    console.log('Parsed Event Data:', eventData);

    if (eventData && typeof eventData === 'object' && eventData.event_id) {
      this.eventDetails = eventData;
      console.log('eventDetails set successfully:', this.eventDetails);
      this.cdr.detectChanges(); // Force update if parent is OnPush
    } else {
      const errorMsg = response?.message || 'Event details not found';
      this.showErrorMessage(errorMsg);
      console.warn('Invalid event details structure:', response);
    }
  }

  private handleEventDetailsError(error: any): void {
    console.error('Event details fetch error:', error);
    this.isLoading = false;
    this.showErrorMessage(
      'Unable to fetch event details. Please try again later.'
    );
  }

  // ============ FORM SUBMISSION ============
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload = this.prepareRegistrationPayload();

    this.fetchService.AddEventUser(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => this.handleRegistrationResponse(response),
        error: (error) => this.handleRegistrationError(error)
      });
  }

  private prepareRegistrationPayload(): UserRegistration {
    const formValue = this.userForm.getRawValue();

    return {
      event_id: this.eventId,
      name: formValue.name?.trim() || '',
      mobile: formValue.mobile?.trim() || '',
      email: formValue.email?.trim().toLowerCase() || '',
      firm_name: formValue.firm_name?.trim() || '',
      rera_no: formValue.rera_no?.trim().toUpperCase() || ''
    };
  }

  private handleRegistrationResponse(response: ApiResponse<any>): void {
    this.isSubmitting = false;

    if (response?.status) {
      this.showSuccessDialog(response.message);
    } else {
      this.showErrorMessage(
        response?.message || 'Registration failed. Please try again.'
      );
    }
  }

  private handleRegistrationError(error: any): void {
    console.error('Registration error:', error);
    this.isSubmitting = false;

    if (error.status === 409) {
      this.showErrorMessage('You have already registered for this event.');
    } else if (error.status === 400) {
      this.showErrorMessage('Invalid registration data. Please check your inputs.');
    } else {
      this.showErrorMessage(
        'An error occurred during registration. Please try again later.'
      );
    }
  }

  // ============ FORM VALIDATION HELPERS ============
  private markFormAsTouched(): void {
    Object.values(this.userForm.controls).forEach(control => {
      control.markAsTouched();
    });

    this.showErrorMessage('Please fill in all required fields correctly.');
  }

  // ============ INPUT VALIDATION ============
  numberOnly(event: KeyboardEvent): boolean {
    const allowedKeys = [
      'Backspace', 'Tab', 'Delete', 'ArrowLeft',
      'ArrowRight', 'Home', 'End'
    ];

    if (allowedKeys.includes(event.key)) {
      return true;
    }

    // Allow only numbers
    return /^\d$/.test(event.key);
  }

  // ============ DIALOG & NOTIFICATION ============
  private showSuccessDialog(message: string): void {
    const dialogRef = this.dialog.open(SuccessDialogComponent, {
      width: '500px',
      disableClose: false,
      autoFocus: false,
      data: {
        message,
        title: 'Registration Successful',
        icon: 'check_circle',
        iconColor: 'text-green-500'
      },
      panelClass: 'success-dialog-overlay'
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetForm();
      });
  }

  private showErrorMessage(message: string, action: string = 'Close'): void {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: ['mat-mdc-snackbar-error'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  // ============ FORM RESET ============
  private resetForm(): void {
    this.userForm.reset();

    // Reset form with event ID
    this.userForm.patchValue({
      event_id: this.eventId
    });

    // Clear validation states
    this.userForm.markAsUntouched();
    this.userForm.markAsPristine();
  }

  // ============ PUBLIC GETTERS FOR TEMPLATE ============
  get nameControl(): FormControl<string | null> {
    return this.userForm.get('name') as FormControl<string | null>;
  }

  get mobileControl(): FormControl<string | null> {
    return this.userForm.get('mobile') as FormControl<string | null>;
  }

  get emailControl(): FormControl<string | null> {
    return this.userForm.get('email') as FormControl<string | null>;
  }

  get firmNameControl(): FormControl<string | null> {
    return this.userForm.get('firm_name') as FormControl<string | null>;
  }

  get reraNoControl(): FormControl<string | null> {
    return this.userForm.get('rera_no') as FormControl<string | null>;
  }

  get isFormValid(): boolean {
    return this.userForm.valid && !this.isSubmitting;
  }

  get eventImageUrl(): string {
    if (!this.eventDetails?.event_image) {
      return 'assets/images/event-placeholder.jpg';
    }

    return `${this.storageUrl}/${this.eventDetails.event_image}`;
  }

  get eventDateFormatted(): string {
    if (!this.eventDetails?.event_date) return 'Date not specified';

    try {
      const date = new Date(this.eventDetails.event_date);
      if (isNaN(date.getTime())) return 'Invalid date';

      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Date format error';
    }
  }

  get eventTimeFormatted(): string {
    if (!this.eventDetails?.event_date) return 'Time not specified';

    try {
      const date = new Date(this.eventDetails.event_date);
      if (isNaN(date.getTime())) return 'Invalid time';

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Time format error';
    }
  }

  get eventDateTimeFormatted(): string {
    return `${this.eventDateFormatted} at ${this.eventTimeFormatted}`;
  }

  // ============ HELPER METHODS FOR TEMPLATE ============
  hasError(controlName: keyof UserFormControls, errorType: string): boolean {
    const control = this.userForm.get(controlName);
    return control ? control.hasError(errorType) && control.touched : false;
  }

  getError(controlName: keyof UserFormControls, errorType: string): string {
    const errors: { [key: string]: string } = {
      required: 'This field is required',
      email: 'Please enter a valid email address',
      pattern: 'Invalid format',
      minlength: 'Value is too short',
      maxlength: 'Value is too long',
      min: 'Invalid value'
    };

    return errors[errorType] || 'Invalid input';
  }

  // ============ LOADING STATE CHECK ============
  get showEventLoader(): boolean {
    return this.isLoading && !this.eventDetails;
  }

  get showFormLoader(): boolean {
    return this.isLoading && !!this.eventDetails;
  }

  // ============ VALIDATION MESSAGES ============
  get nameErrorMessage(): string {
    if (this.nameControl.hasError('required')) return 'Name is required';
    if (this.nameControl.hasError('minlength')) return 'Name must be at least 2 characters';
    if (this.nameControl.hasError('maxlength')) return 'Name cannot exceed 100 characters';
    if (this.nameControl.hasError('pattern')) return 'Name can only contain letters, spaces, and basic punctuation';
    return '';
  }

  get mobileErrorMessage(): string {
    if (this.mobileControl.hasError('required')) return 'Mobile number is required';
    if (this.mobileControl.hasError('pattern')) return 'Please enter a valid 10-digit mobile number';
    return '';
  }

  get emailErrorMessage(): string {
    if (this.emailControl.hasError('required')) return 'Email is required';
    if (this.emailControl.hasError('email')) return 'Please enter a valid email address';
    if (this.emailControl.hasError('maxlength')) return 'Email cannot exceed 150 characters';
    return '';
  }

  get firmNameErrorMessage(): string {
    if (this.firmNameControl.hasError('required')) return 'Firm name is required';
    if (this.firmNameControl.hasError('minlength')) return 'Firm name must be at least 2 characters';
    if (this.firmNameControl.hasError('maxlength')) return 'Firm name cannot exceed 200 characters';
    return '';
  }

  get reraNoErrorMessage(): string {
    if (this.reraNoControl.hasError('required')) return 'RERA number is required';
    if (this.reraNoControl.hasError('minlength')) return 'RERA number must be at least 3 characters';
    if (this.reraNoControl.hasError('maxlength')) return 'RERA number cannot exceed 50 characters';
    return '';
  }
}