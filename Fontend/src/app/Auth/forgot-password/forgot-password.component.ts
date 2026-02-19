import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { CustomValidators } from '../../Common/customValidators';
import { AngularMaterialModule } from '../../../angular-material.module';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  standalone: true,
  imports: [ AngularMaterialModule, ReactiveFormsModule, CommonModule],
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy  {

  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  public readonly dialogRef = inject(MatDialogRef<ForgotPasswordComponent>);

  constructor() { }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
    // Clear timer when component is destroyed
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  baseUrl = environment.API_URL;

  // Three-step workflow state management
  enterEmailDiv: boolean = true;
  enterOtpDiv: boolean = false;
  enterPasswordDiv: boolean = false;
  
  userEmail: string = '';
  
  // Password visibility toggles
  showNewPassword: boolean = false;
  showConfirmPassword: boolean = false;

  // Resend OTP timer
  resendTimer: any = null;
  resendCountdown: number = 0;
  canResendOTP: boolean = false;

  // Step 1: Email Form
  emailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  // Step 1: Send OTP to email
  emailSubmit() {
    if (this.emailForm.valid) {
      const obj = { email: this.emailForm.value.email };

      this.http.post(`${this.baseUrl}/send_otp_forgot_password`, obj)
        .subscribe({
          next: (res: any) => {
            console.log(res);
            if (res.success) {
              this.snackBar.open('OTP sent successfully to your email', 'Close', { duration: 3000 });
              this.userEmail = this.emailForm.value.email || '';
              this.enterEmailDiv = false;
              this.enterOtpDiv = true;
              // Start the resend countdown timer
              this.startResendTimer();
              // Auto-focus first OTP input after view updates
              setTimeout(() => {
                const firstInput = document.getElementById('otp-input-1');
                if (firstInput) {
                  firstInput.focus();
                }
              }, 100);
            } else {
              console.log(res);
              this.snackBar.open(res.message || "An error occurred, please try again", 'Close', { duration: 3000 });
            }
          }, 
          error: (err: any) => {
            console.log(err);
            this.snackBar.open(err.error?.message || "An error occurred, please try again", 'Close', { duration: 3000 });
          }
        });
    }
  }

  // Start the 30-second countdown timer
  startResendTimer() {
    this.canResendOTP = false;
    this.resendCountdown = 30;

    // Clear any existing timer
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }

    this.resendTimer = setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        this.canResendOTP = true;
        this.resendCountdown = 0;
      }
    }, 1000);
  }

  // Resend OTP
  ResendOTP() {
    if (!this.canResendOTP) {
      return; // Prevent resend if timer is still running
    }

    const obj = { email: this.userEmail };

    this.http.post(`${this.baseUrl}/send_otp_forgot_password`, obj)
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            console.log(res);
            this.snackBar.open('OTP resent successfully', 'Close', { duration: 3000 });
            // Reset OTP form
            this.otpForm.reset();
            // Restart the countdown timer
            this.startResendTimer();
            // Auto-focus first OTP input
            setTimeout(() => {
              const firstInput = document.getElementById('otp-input-1');
              if (firstInput) {
                firstInput.focus();
              }
            }, 100);
          } else {
            console.log(res);
            this.snackBar.open(res.message || "An error occurred, please try again", 'Close', { duration: 3000 });
          }
        },
        error: (err: any) => {
          console.log(err);
          this.snackBar.open(err.error?.message || "An error occurred, please try again", 'Close', { duration: 3000 });
        }
      });
  }

  // Step 2: OTP Form - Individual fields for each digit
  otpForm = new FormGroup({
    otp1: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otp2: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otp3: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otp4: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otp5: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    otp6: new FormControl('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
  });

  // Step 2: Verify OTP
  otpSubmit() {
    if (this.otpForm.valid) {
      // Combine all OTP digits into a single string
      const otpValue = `${this.otpForm.value.otp1}${this.otpForm.value.otp2}${this.otpForm.value.otp3}${this.otpForm.value.otp4}${this.otpForm.value.otp5}${this.otpForm.value.otp6}`;
      
      const obj = {
        email: this.userEmail,
        otp: otpValue
      };

      console.log('Verifying OTP:', obj);
      this.http.post(`${this.baseUrl}/verify_otp_forgot_password`, obj)
        .subscribe({
          next: (res: any) => {
            if (res.success) {
              this.snackBar.open('OTP verified successfully', 'Close', { duration: 3000 });
              this.enterOtpDiv = false;
              this.enterPasswordDiv = true;
            } else {
              console.log(res);
              this.snackBar.open(res.message || "OTP was incorrect, please try again", 'Close', { duration: 3000 });
            }
          }, 
          error: (err: any) => {
            console.log(err);
            this.snackBar.open(err.error?.message || "OTP was incorrect, please try again", 'Close', { duration: 3000 });
          }
        });
    }
  }

  // Step 3: Password Form
  passwordForm = new FormGroup({
    new_password: new FormControl('', [
      Validators.required,
      CustomValidators.PasswordStrength()
    ]),
    confirm_password: new FormControl('', [Validators.required]),
  }, {
    validators: [CustomValidators.MatchValidator('new_password', 'confirm_password')],
  });

  passwordMatchError() {
    return this.passwordForm.hasError('mismatch') && this.passwordForm.controls.confirm_password.touched;
  }

  // Toggle password visibility
  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Handle OTP input with auto-focus to next field
  onOtpInput(event: any, index: number): void {
    const input = event.target;
    const value = input.value;

    // Only allow single digit
    if (value.length > 1) {
      input.value = value.slice(0, 1);
    }

    // Only allow digits
    if (value && !/^[0-9]$/.test(value)) {
      input.value = '';
      return;
    }

    // Update form control
    const controlName = `otp${index + 1}` as keyof typeof this.otpForm.controls;
    this.otpForm.controls[controlName].setValue(input.value);

    // Auto-focus to next field if digit entered
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 2}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  // Handle backspace to move to previous field
  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;

    // Handle backspace
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index}`);
      if (prevInput) {
        prevInput.focus();
      }
    }

    // Prevent non-digit characters
    if (event.key.length === 1 && !/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Handle paste event for OTP
  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').trim() || '';
    
    // Only process if pasted data contains 6 digits
    if (/^[0-9]{6}$/.test(pastedData)) {
      for (let i = 0; i < 6; i++) {
        const controlName = `otp${i + 1}` as keyof typeof this.otpForm.controls;
        this.otpForm.controls[controlName].setValue(pastedData[i]);
      }
      
      // Focus on the last input
      const lastInput = document.getElementById('otp-input-6');
      if (lastInput) {
        lastInput.focus();
      }
    }
  }

  // Step 3: Create new password
  passwordSubmit() {
    if (this.passwordForm.valid) {
      const obj = {
        email: this.userEmail,
        new_password: this.passwordForm.value.new_password,
        confirm_password: this.passwordForm.value.confirm_password
      };

      console.log('Creating new password:', { email: obj.email });
      this.http.post(`${this.baseUrl}/create_password`, obj)
        .subscribe({
          next: (res: any) => {
            if (res.success) {
              this.snackBar.open('Password updated successfully! Please login with your new password.', 'Close', { duration: 4000 });
              this.dialogRef.close(true);
            } else {
              console.log(res);
              this.snackBar.open(res.message || "Failed to update password, please try again", 'Close', { duration: 3000 });
            }
          }, 
          error: (err: any) => {
            console.log(err);
            this.snackBar.open(err.error?.message || "Failed to update password, please try again", 'Close', { duration: 3000 });
          }
        });
    } else {
      if (this.passwordForm.controls.confirm_password.value !== "" && this.passwordForm.hasError('mismatch')) {
        this.snackBar.open('Passwords do not match', 'Close', { duration: 3000 });
      }
    }
  }

  // Close dialog
  closeDialog(): void {
    this.dialogRef.close();
  }

}
