import { Component, Inject, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { EnquiryManagementService } from '../../../../Enquiry/services/enquiry-management.service';
import { finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DialogData {
  mobile_no: string;
  email_id: string;
  project_id: number;
  first_name: string;
  last_name: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-otp-verification-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule],
  templateUrl: './otp-verification-dialog.component.html',
  styleUrl: './otp-verification-dialog.component.scss'
})
export class OtpVerificationDialogComponent implements OnInit, OnDestroy {
  private readonly enquiryService = inject(EnquiryManagementService);
  private readonly snackBar = inject(MatSnackBar);

  readonly otpFields = [
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]),
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]),
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]),
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]),
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)]),
    new FormControl('', [Validators.required, Validators.pattern(/^\d$/)])
  ];

  readonly isOtpLoading = signal<boolean>(false);
  readonly otpTimer = signal<number>(60);
  readonly canResendOtp = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  private timerInterval: any;

  constructor(
    public dialogRef: MatDialogRef<OtpVerificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit(): void {
    this.startResendTimer();

  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  onInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    if (!/^\d*$/.test(value)) {
      value = value.replace(/\D/g, '');
      input.value = value;
      this.otpFields[index].setValue(value);
    }

    if (value && index < 5) {
      const inputs = document.querySelectorAll('.otp-input');
      (inputs[index + 1] as HTMLInputElement)?.focus();
    }

    this.errorMessage.set('');

    if (this.otpFields.every(ctrl => ctrl.valid)) {
      this.verifyOtp();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(event.key) ||
      event.key.startsWith('Arrow') ||
      event.ctrlKey ||
      event.metaKey
    ) {
      if (event.key === 'Backspace' && !this.otpFields[index].value && index > 0) {
        const inputs = document.querySelectorAll('.otp-input');
        (inputs[index - 1] as HTMLInputElement)?.focus();
      }
      return;
    }

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text').slice(0, 6);
    if (pasteData && /^\d+$/.test(pasteData)) {
      const digits = pasteData.split('');
      digits.forEach((digit, i) => {
        if (this.otpFields[i]) {
          this.otpFields[i].setValue(digit);
        }
      });
      if (digits.length === 6) {
        this.verifyOtp();
      }
    }
  }

  verifyOtp(): void {
    const otp = this.otpFields.map(f => f.value).join('');
    if (otp.length !== 6) return;

    const payload = {
      mobile_no: this.data.mobile_no,
      project_id: this.data.project_id,
      otp: otp
    };

    this.isOtpLoading.set(true);
    this.enquiryService.verifyEnqOtp(payload)
      .pipe(finalize(() => this.isOtpLoading.set(false)))
      .subscribe({
        next: (res: ApiResponse) => {
          if (res.success) {
            this.errorMessage.set('');
            this.showSuccess('OTP verified successfully!');
            this.dialogRef.close(true);
          } else {
            this.errorMessage.set(res.message || 'Incorrect OTP entered. Please try again.');
            this.showError(res.message || 'Verification failed. Please check the OTP.');
          }
        },
        error: () => {
          this.errorMessage.set('An error occurred during verification.');
          this.showError('An error occurred during verification.');
        }
      });
  }

  resendOtp(): void {
    if (!this.canResendOtp()) return;

    const payload = {
      mobile_no: this.data.mobile_no,
      email_id: this.data.email_id,
      project_id: this.data.project_id,
      first_name: this.data.first_name,
      last_name: this.data.last_name
    };

    this.isOtpLoading.set(true);
    this.errorMessage.set('');
    this.enquiryService.sendOtpToEnquiry(payload)
      .pipe(finalize(() => this.isOtpLoading.set(false)))
      .subscribe({
        next: (res: ApiResponse) => {
          if (res.success) {
            this.showSuccess('OTP resent successfully.');
            this.startResendTimer();
          } else {
            this.showError(res.message || 'Failed to resend OTP.');
          }
        },
        error: () => this.showError('An error occurred while resending OTP.')
      });
  }

  private startResendTimer(): void {
    this.canResendOtp.set(false);
    this.otpTimer.set(60);

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const current = this.otpTimer();
      if (current > 0) {
        this.otpTimer.set(current - 1);
      } else {
        this.canResendOtp.set(true);
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['bg-green-600', 'text-white']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
