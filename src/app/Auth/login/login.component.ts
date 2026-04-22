import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  OnInit,
  PLATFORM_ID,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterModule } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  map,
  merge,
  Subscription,
  timer,
} from 'rxjs';
import { AngularMaterialModule } from '../../../angular-material.module';
import { environment } from '../../../environments/environment';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { AuthFacade } from '../auth.facade';
import { SupportChatService } from '../../Service/support-chat.service';

// ============================================================================
// Type Definitions
// ============================================================================

interface LoginResponse {
  success: boolean;
  message: string;
  auth_token?: string;
  data?: UserSessionData;
  requiresOtp?: boolean;
  retryAfter?: number;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  auth_token?: string;
  data?: UserSessionData;
  retryAfter?: number;
}

interface UserSessionData {
  user_id: string;
  account_id: string;
  role_id: string;
  user_email: string;
  username: string;
  first_name: string;
  last_name: string;
  account_display_name: string;
  profile_image: string;
  manager_name: string;
  permissions: string;
  account_logo: string;
  product_display_name: string;
  partner_code: string;
  email: string;
  channel_partner_id: string;
  role_name: string;
  two_factor_enabled?: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface OtpPayload {
  email: string;
  otp: string;
}

type ErrorType = 'required' | 'email' | 'minlength' | 'dangerousInput' | 'pattern';

// ============================================================================
// Constants
// ============================================================================

const PASSWORD_MIN_LENGTH = 8;
const OTP_LENGTH = 6;
const OTP_RESEND_DELAY = 30000; // 30 seconds
const FORM_DEBOUNCE_TIME = 300; // ms
const SNACKBAR_DURATION = 3000;
const OTP_FOCUS_DELAY = 100; // ms

// ============================================================================
// Component
// ============================================================================

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    RouterModule,
  ],
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class LoginComponent implements OnInit {
  // ============================================================================
  // Dependency Injection
  // ============================================================================
  private readonly authFacade = inject(AuthFacade);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly supportChatService: SupportChatService = inject(SupportChatService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly baseUrl = environment.API_URL;
  private timerSubscription?: Subscription;

  // ============================================================================
  // State Signals
  // ============================================================================
  public readonly isLoading = this.authFacade.isLoading;
  public readonly showOtpForm = this.authFacade.showOtpForm;
  public readonly isLoadingOtp = this.authFacade.isLoadingOtp;
  readonly showPassword = signal<boolean>(false);
  readonly userEmail = this.authFacade.userEmail;

  private readonly formValid = signal<boolean>(false);
  private readonly otpValue = signal<string>('');

  public readonly resendCountdown = signal<number>(0);

  // ============================================================================
  // Constants
  // ============================================================================
  readonly PASSWORD_MIN_LENGTH = PASSWORD_MIN_LENGTH;
  readonly currentYear = new Date().getFullYear();

  // ============================================================================
  // Form Groups
  // ============================================================================
  loginForm!: FormGroup;
  otpForm!: FormGroup;

  // ============================================================================
  // Computed Signals (Derived State)
  // ============================================================================
  readonly canSignIn = computed(() => this.formValid() && !this.isLoading());

  readonly isEmailInvalid = computed(() => {
    const emailControl = this.loginForm?.get('email');
    return !!(emailControl?.invalid && emailControl?.touched);
  });

  readonly isPasswordInvalid = computed(() => {
    const passwordControl = this.loginForm?.get('password');
    return !!(passwordControl?.invalid && passwordControl?.touched);
  });

  readonly isOtpInvalid = computed(() => {
    return !!(this.otpForm?.invalid && this.otpForm?.touched);
  });

  readonly canVerifyOtp = computed(() => {
    return this.otpValue().trim().length === OTP_LENGTH && !this.isLoadingOtp();
  });

  public readonly canResendOtp = computed(() => this.resendCountdown() === 0);

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================
  ngOnInit(): void {
    this.initializeBodyStyles();
    this.initializeForm();
    this.initializeOtpForm();
    this.setupFormValidation();
    this.setupEffects();
  }

  // ============================================================================
  // Initialization Methods
  // ============================================================================
  private initializeBodyStyles(): void {
    if (isPlatformBrowser(this.platformId)) {
      const body = this.document.body;
      body.style.margin = '0';
      body.style.padding = '0';
      body.style.overflow = 'hidden';
      body.classList.add('login-page');

      // Cleanup on destroy
      this.destroyRef.onDestroy(() => {
        body.classList.remove('login-page');
        body.style.margin = '';
        body.style.padding = '';
        body.style.overflow = 'auto';
      });
    }
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email, this.sanitizeInput]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(PASSWORD_MIN_LENGTH),
            this.sanitizeInput,
          ],
        ],
      }
    );
  }

  private initializeOtpForm(): void {
    const otpControls: Record<string, [string, any[]]> = {};
    for (let i = 1; i <= OTP_LENGTH; i++) {
      otpControls[`otp${i}`] = [
        '',
        [Validators.required, Validators.pattern(/^[0-9]$/)],
      ];
    }

    this.otpForm = this.fb.group(otpControls, { updateOn: 'change' });

    // Optimized OTP value tracking
    this.otpForm.valueChanges
      .pipe(
        debounceTime(50),
        map(() => this.getOtpValue()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((otp) => {
        this.otpValue.set(otp);
      });
  }

  private setupFormValidation(): void {
    this.updateFormValidity();

    // Optimized form validation with merged streams
    merge(
      this.loginForm.valueChanges.pipe(
        debounceTime(FORM_DEBOUNCE_TIME),
        distinctUntilChanged((prev, curr) =>
          prev.email === curr.email && prev.password === curr.password
        )
      ),
      this.loginForm.statusChanges.pipe(
        debounceTime(FORM_DEBOUNCE_TIME),
        distinctUntilChanged()
      )
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValidity());
  }

  private setupEffects(): void {
    // Effect for OTP auto-focus when form is shown
    runInInjectionContext(this.injector, () => {
      effect(() => {
        if (this.showOtpForm() && isPlatformBrowser(this.platformId)) {
          setTimeout(() => {
            const firstInput = this.document.getElementById('otp-input-1');
            if (firstInput instanceof HTMLInputElement) {
              firstInput.focus();
            }
          }, OTP_FOCUS_DELAY);
        }
      });
    });
  }

  // ============================================================================
  // Custom Validators
  // ============================================================================
  private sanitizeInput = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const value = control.value.toString().trim();
    // Enhanced XSS prevention
    const dangerousPatterns = /[<>]/;
    if (dangerousPatterns.test(value)) {
      return { dangerousInput: true };
    }

    return null;
  };

  // ============================================================================
  // Form Validation Helpers
  // ============================================================================
  private updateFormValidity(): void {
    const emailControl = this.loginForm.get('email');
    const passwordControl = this.loginForm.get('password');

    if (!emailControl || !passwordControl) {
      this.formValid.set(false);
      return;
    }

    const email = emailControl.value?.trim() ?? '';
    const password = passwordControl.value?.trim() ?? '';

    const isEmailValid = emailControl.valid && email.length > 0;
    const isPasswordValid =
      passwordControl.valid && password.length >= PASSWORD_MIN_LENGTH;

    this.formValid.set(isEmailValid && isPasswordValid);
  }

  hasEmailError(errorType: ErrorType): boolean {
    const emailControl = this.loginForm.get('email');
    return !!(emailControl?.errors?.[errorType]);
  }

  hasPasswordError(errorType: ErrorType): boolean {
    const passwordControl = this.loginForm.get('password');
    return !!(passwordControl?.errors?.[errorType]);
  }

  // ============================================================================
  // UI Helpers
  // ============================================================================
  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  // ============================================================================
  // Login Methods
  // ============================================================================
  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      return;
    }

    const email = this.loginForm.get('email')?.value?.trim() ?? '';
    const password = this.loginForm.get('password')?.value?.trim() ?? '';

    if (!email || !password) {
      this.showError('Please enter valid credentials');
      return;
    }

    this.isLoading.set(true);

    // Get current location
    if (!navigator.geolocation) {
      this.showError('Geolocation is not supported by this browser');
      this.isLoading.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const credentials = {
          email,
          password,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        this.authFacade.login(credentials).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe();
      },
      (error) => {
        this.showError('Unable to fetch location. Please allow location access.');
      }
    );
  }

  private handleLoginSuccess(res: LoginResponse, email: string): void {
    if (res.success) {
      this.showSuccess(
        res.message || 'OTP has been sent to your email. Please verify.'
      );
      this.userEmail.set(email);
      this.showOtpForm.set(true);
      this.otpForm.reset();
      this.otpValue.set('');
      this.startResendTimer();
    } else {
      this.showError(
        res.message || 'Login failed. Please check your credentials.'
      );
    }
  }

  private handleLoginError(error: HttpErrorResponse): void {
    console.error('Login error:', error);

    let message = 'Login failed. Please try again.';
    if (error.status === 429) {
      message = 'Too many login attempts. Please try again later.';
    } else if (error.status === 403) {
      message = 'Access denied. Please contact support.';
    } else if (error.error?.message) {
      message = error.error.message;
    }

    this.showError(message);
  }

  // ============================================================================
  // OTP Methods
  // ============================================================================
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Ensure single character
    if (value.length > 1) {
      value = value.slice(0, 1);
      input.value = value;
    }

    // Validate numeric input
    if (value && !/^[0-9]$/.test(value)) {
      input.value = '';
      return;
    }

    const controlName = `otp${index + 1}`;
    this.otpForm.get(controlName)?.setValue(value, { emitEvent: true });

    // Auto-verify if 6 digits are reached
    if (this.getOtpValue().length === OTP_LENGTH) {
      this.onOtpSubmit();
    }

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      setTimeout(() => {
        const nextInput = this.document.getElementById(`otp-input-${index + 2}`);
        if (nextInput instanceof HTMLInputElement) {
          nextInput.focus();
        }
      }, 10);
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Handle backspace navigation
    if (event.key === 'Backspace' && !input.value && index > 0) {
      event.preventDefault();
      const prevInput = this.document.getElementById(`otp-input-${index}`);
      if (prevInput instanceof HTMLInputElement) {
        prevInput.focus();
      }
    }

    // Block non-numeric characters
    if (event.key.length === 1 && !/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').trim() || '';

    if (/^[0-9]{6}$/.test(pastedData)) {
      for (let i = 0; i < OTP_LENGTH; i++) {
        this.otpForm.get(`otp${i + 1}`)?.setValue(pastedData[i], {
          emitEvent: i === OTP_LENGTH - 1, // Emit only on last update
        });
      }

      this.onOtpSubmit();

      setTimeout(() => {
        const lastInput = this.document.getElementById('otp-input-6');
        if (lastInput instanceof HTMLInputElement) {
          lastInput.focus();
        }
      }, 10);
    }
  }

  onOtpSubmit(): void {
    const otp = this.getOtpValue();
    const email = this.userEmail();

    if (otp.length !== OTP_LENGTH || this.isLoadingOtp() || !email) {
      return;
    }

    this.authFacade.verifyOtp(email, otp).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res: any) => this.handleOtpVerificationSuccess(res),
      error: (err) => this.handleOtpVerificationError(err)
    });
  }

  private handleOtpVerificationSuccess(res: VerifyOtpResponse): void {
    if (res.success) {
      this.showSuccess(res.message || 'OTP verified successfully!');

      if (res.auth_token && isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem('auth_token', res.auth_token);
      }

      if (res.data) {
        this.saveSessionData(res.data);
      }

      this.router.navigate(['/home-page']).then((success) => {
        if (success) {
          console.log('Successfully navigated to home-page');
          setTimeout(() => this.supportChatService.openSupportChat(), 500);
        } else {
          console.error('Navigation to home-page failed');
        }
      });
    } else {
      this.showError(res.message || 'Invalid OTP. Please try again.');
    }
  }

  private handleOtpVerificationError(error: HttpErrorResponse): void {
    console.error('OTP verification error:', error);

    let message = 'Invalid OTP. Please try again.';
    if (error.status === 429) {
      message = 'Too many OTP attempts. Please request a new OTP.';
    } else if (error.error?.message) {
      message = error.error.message;
    }

    this.showError(message);
  }

  onResendOtp(): void {
    if (!this.canResendOtp()) return;

    const email = this.loginForm.get('email')?.value?.trim() ?? '';
    const password = this.loginForm.get('password')?.value?.trim() ?? '';

    if (!email || !password) {
      this.showError('Unable to resend OTP. Please go back to login.');
      return;
    }

    this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        catchError(() => {
          this.showError('Failed to resend OTP');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.showSuccess('New OTP sent to your email');
          this.startResendTimer();
        } else {
          this.showError(res.message || 'Failed to resend OTP');
        }
      });
  }

  goBackToLogin(): void {
    this.isLoading.set(false);
    this.isLoadingOtp.set(false);
    this.showOtpForm.set(false);
    this.otpForm.reset();
    this.otpValue.set('');
    this.loginForm.get('password')?.reset();
    this.loginForm.get('password')?.markAsUntouched();
    this.updateFormValidity();
    this.stopResendTimer();
  }

  // ============================================================================
  // OTP Helper Methods
  // ============================================================================
  private getOtpValue(): string {
    let otp = '';
    for (let i = 1; i <= OTP_LENGTH; i++) {
      otp += this.otpForm.get(`otp${i}`)?.value || '';
    }
    return otp;
  }

  // ============================================================================
  // Timer Management (RxJS-based)
  // ============================================================================
  private startResendTimer(): void {
    this.stopResendTimer();
    const totalSeconds = OTP_RESEND_DELAY / 1000;
    this.resendCountdown.set(totalSeconds);

    this.timerSubscription = timer(0, 1000)
      .pipe(
        map((elapsed) => Math.max(0, totalSeconds - elapsed)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((remaining) => {
        this.resendCountdown.set(remaining);
        if (remaining === 0) {
          this.stopResendTimer();
        }
      });
  }

  private stopResendTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
    this.resendCountdown.set(0);
  }

  // ============================================================================
  // Session Management
  // ============================================================================
  private saveSessionData(data: UserSessionData): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const sessionItems: Record<string, string> = {
      session_id: data.user_id,
      account_id: data.account_id,
      role_id: data.role_id,
      user_email: data.user_email,
      username: data.username,
      user_full_name: `${data.first_name} ${data.last_name}`,
      account_display_name: data.account_display_name,
      profile_image: data.profile_image,
      permission: data.permissions,
      manager_name: data.manager_name,
      logo: data.account_logo,
      product_display_name: data.product_display_name,
      partner_id: data.partner_code,
      email: data.email,
      channel_partner_id: data.channel_partner_id,
      role_name: data.role_name,
      login_time: Date.now().toString(),
      two_factor_enabled: String(data.two_factor_enabled ?? false),
    };

    // Batch storage operations
    Object.entries(sessionItems).forEach(([key, value]) => {
      sessionStorage.setItem(key, value);
    });

    localStorage.setItem('rememberedUsername', data.username);
  }

  // ============================================================================
  // Notification Helpers
  // ============================================================================
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: SNACKBAR_DURATION,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: SNACKBAR_DURATION,
      panelClass: ['error-snackbar'],
    });
  }

  // ============================================================================
  // Forgot Password Dialog
  // ============================================================================
  openForgotPasswordDialog(): void {
    const dialogRef = this.dialog.open(ForgotPasswordComponent, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '95vh',
      disableClose: false,
      autoFocus: true,
      hasBackdrop: true,
      panelClass: 'forgot-password-dialog-container'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Password was successfully updated
        this.showSuccess('Password updated successfully! Please login with your new password.');
      }
    });
  }
}
