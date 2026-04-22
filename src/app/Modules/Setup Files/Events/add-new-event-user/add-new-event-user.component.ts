import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { environment } from '../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { EventRegistrationStore } from './add-new-event-user.store';
import { takeUntil, Subject } from 'rxjs';

// ============ INTERFACE DEFINITIONS ============
// Note: Interfaces moved to store for clean separation

// Form control interfaces
interface UserFormControls {
  event_id: FormControl<number | null>;
  name: FormControl<string | null>;
  mobile: FormControl<string | null>;
  email: FormControl<string | null>;
  firm_name: FormControl<string | null>;
  rera_no: FormControl<string | null>;
  no_of_guest: FormControl<number | null>;
  cp_type: FormControl<string | null>;
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
  styleUrls: ['./add-new-event-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddNewEventUserComponent implements OnInit, OnDestroy {
  // ============ INJECTED SERVICES ============
  private fb = inject(FormBuilder);
  private store = inject(EventRegistrationStore);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);

  // ============ PUBLIC PROPERTIES (SIGNALS) ============
  readonly storageUrl = environment.STORAGE_URL;
  readonly eventDetails = this.store.eventDetails;
  readonly userData = this.store.userData;
  readonly isLoading = this.store.isLoading;
  readonly isSubmitting = this.store.isSubmitting;
  readonly error = this.store.error;

  userForm!: FormGroup<UserFormControls>;
  eventId = signal<number>(0);
  eventSlug = signal<string>('');
  private destroy$ = new Subject<void>();

  // ============ CONSTRUCTOR ============
  constructor() {
    // React to pre-filled user data from store
    effect(() => {
      const userData = this.userData();
      if (userData && this.userForm) {
        this.userForm.patchValue(userData);
      }
    });

    // React to event details for dynamic validation
    effect(() => {
      const details = this.eventDetails();
      if (details && this.userForm) {
        this.applyConditionalValidation(details.event_type_id);
      }
    });
  }

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

    // Trigger store fetch
    if (this.eventId() > 0) {
      this.store.fetchEventDetails(this.eventId(), this.eventSlug());
    }
  }

  private parseRouteParams(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const slugParam = this.route.snapshot.paramMap.get('slug');

    this.eventId.set(idParam ? Number(idParam) : 0);
    this.eventSlug.set(slugParam || '');

    if (!this.eventId() || isNaN(this.eventId()) || this.eventId() <= 0) {
      console.warn('Event ID is missing or invalid:', idParam);
    }
  }

  // ============ FORM MANAGEMENT ============
  private initForm(): void {
    this.userForm = this.fb.group<UserFormControls>({
      event_id: this.fb.control({
        value: this.eventId(),
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
        Validators.minLength(2),
        Validators.maxLength(200)
      ]),
      rera_no: this.fb.control('', [
        Validators.minLength(3),
        Validators.maxLength(50)
      ]),
      cp_type: this.fb.control('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(200)
      ]),
      no_of_guest: this.fb.control(null, [
        Validators.required,
        Validators.min(1)
      ])
    });
  }

  private applyConditionalValidation(eventTypeId?: number): void {

    const isPublicEvent = eventTypeId === 1;
    const isTypeThreeEvent = eventTypeId === 3;

    if (isPublicEvent) {
      // Disable fields for public events (id 1)
      this.nameControl.disable();
      this.emailControl.disable();
      this.mobileControl.disable();
      this.noOfGuestControl.setValidators([Validators.required, Validators.min(1)]);
      this.firmNameControl.setValidators([Validators.minLength(2), Validators.maxLength(200)]);
      this.reraNoControl.setValidators([Validators.minLength(3), Validators.maxLength(50)]);
      this.userForm.get('cp_type')?.setValidators([Validators.required]);

    } else if (isTypeThreeEvent) {
      // Event Type 3: Only Name, Email, Mobile required
      this.nameControl.enable({ emitEvent: false });
      this.mobileControl.enable({ emitEvent: false });
      this.emailControl.enable({ emitEvent: false });

      // Clear validators for other fields
      this.noOfGuestControl.clearValidators();
      this.firmNameControl.clearValidators();
      this.reraNoControl.clearValidators();
      this.userForm.get('cp_type')?.clearValidators();

    } else {
      // Enable fields for other non-public events (e.g., id 2)
      this.nameControl.enable({ emitEvent: false });
      this.mobileControl.enable({ emitEvent: false });
      this.emailControl.enable({ emitEvent: false });

      this.noOfGuestControl.clearValidators();
      this.firmNameControl.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(200)
      ]);
      this.reraNoControl.setValidators([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]);
      this.userForm.get('cp_type')?.setValidators([Validators.required]);
    }

    // Update validation
    this.noOfGuestControl.updateValueAndValidity({ emitEvent: false });
    this.firmNameControl.updateValueAndValidity({ emitEvent: false });
    this.reraNoControl.updateValueAndValidity({ emitEvent: false });
    this.userForm.get('cp_type')?.updateValueAndValidity({ emitEvent: false });

  }

  private handleEventDetailsError(error: any): void {
    console.error('Event details fetch error:', error);
    this.showErrorMessage(
      'Unable to fetch event details. Please try again later.'
    );
  }

  // ============ FORM SUBMISSION ============
  async onSubmit(): Promise<void> {
    if (this.userForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    const payload = this.prepareRegistrationPayload();

    try {
      const response = await this.store.submitRegistration(payload);
      if (response?.status) {
        this.showSuccessDialog(response.message);
      } else {
        this.showErrorMessage(response?.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.status === 409) {
        this.showErrorMessage('You have already registered for this event.');
      } else {
        this.showErrorMessage(this.error() || 'An error occurred during registration.');
      }
    }
  }

  private prepareRegistrationPayload(): any {
    const formValue = this.userForm.getRawValue();
    const details = this.eventDetails();

    const payload: any = {
      event_id: this.eventId(),
      event_type_id: details?.event_type_id,
      name: formValue.name?.trim() || '',
      mobile: formValue.mobile?.trim() || '',
      email: formValue.email?.trim().toLowerCase() || '',
      firm_name: formValue.firm_name?.trim() || '',
      rera_no: formValue.rera_no?.trim().toUpperCase() || '',
      no_of_guest: formValue.no_of_guest,
      cp_type: formValue.cp_type?.trim() || '',
    };

    const userData: any = this.userData();
    if (details?.event_type_id === 1 && userData) {
      payload.token_id = userData.token_id;
    }

    if (details?.event_type_id === 3 && userData) {
      payload.user_id = userData.user_id;
    }

    return payload;
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
      event_id: this.eventId()
    } as any);

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

  get noOfGuestControl(): FormControl<number | null> {
    return this.userForm.get('no_of_guest') as FormControl<number | null>;
  }

  get isFormValid(): boolean {
    return this.userForm.valid && !this.isSubmitting();
  }

  get eventImageUrl(): string {
    const details = this.eventDetails();
    if (!details?.event_image) {
      return 'assets/images/event-placeholder.jpg';
    }

    return `${this.storageUrl}/${details.event_image}`;
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
    return this.isLoading() && !this.eventDetails();
  }

  get showFormLoader(): boolean {
    return this.isLoading() && !!this.eventDetails();
  }
}
