import { Component, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SuccessDialogComponent } from '../../../Common/success-dialog/success-dialog.component';

export interface BookingBillDialogData {
  bookingID: number;
  editData?: {
    booking_bill_id: number;
    bill_no: string;
    basic_bill_amount: number;
    gst: number;
    total_bill: number;
    remark: string;
    booking_bill_status_id: number;
  };
}

export interface BookingBillResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Component for adding/editing booking bills
 * Uses Angular 17+ features: signals, OnPush change detection, inject(), optimized RxJS
 */
@Component({
  selector: 'app-addbooking-bill',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './addbooking-bill.component.html',
  styleUrl: './addbooking-bill.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddbookingBillComponent {
  // ============================================================================
  // Dependency Injection using inject() function
  // ============================================================================
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef = inject(MatDialogRef<AddbookingBillComponent>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogData = inject<BookingBillDialogData>(MAT_DIALOG_DATA);
  private readonly baseUrl = environment.API_URL;

  // ============================================================================
  // Signals for reactive state management
  // ============================================================================
  readonly selectedFile = signal<File | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly bookingBillId = signal<number | null>(null);


  readonly submitButtonText = computed(() => 
    this.isSubmitting() ? 'Saving...' : (this.isEditMode() ? 'Update' : 'Save')
  );

  // ============================================================================
  // Form Definition
  // ============================================================================
  readonly addBookingbillform = new FormGroup({
    bill_no: new FormControl<string>('', { 
      validators: [Validators.required],
      nonNullable: true 
    }),
    user_id: new FormControl<number>(this.getUserId(), { 
      nonNullable: true 
    }),
    booking_id: new FormControl<number>(this.dialogData.bookingID, { 
      nonNullable: true 
    }),
    basic_bill_amount: new FormControl<number | null>(null, { 
      validators: [Validators.required] 
    }),
    gst: new FormControl<number | null>(null),
    total_bill: new FormControl<number | null>(null, { 
      validators: [Validators.required] 
    }),
    attachment: new FormControl<string>(''),
    remark: new FormControl<string>(''),
    booking_bill_status_id: new FormControl<number>(1, { 
      nonNullable: true 
    }),
    created_by: new FormControl<number>(this.getUserId(), { 
      nonNullable: true 
    }),
    booking_bill_id: new FormControl<number | null>(null),
    updated_by: new FormControl<number>(this.getUserId(), { 
      nonNullable: true 
    }),
  });

  constructor() {
    this.initializeComponent();
  }

  // ============================================================================
  // Initialization
  // ============================================================================
  private initializeComponent(): void {
    if (this.dialogData.editData) {
      this.isEditMode.set(true);
      this.bookingBillId.set(this.dialogData.editData.booking_bill_id);
      this.patchFormValues();
    }
  }

  // ============================================================================
  // Form Methods
  // ============================================================================
  private patchFormValues(): void {
    const editData = this.dialogData.editData;
    if (!editData) return;

    this.addBookingbillform.patchValue({
      bill_no: editData.bill_no,
      basic_bill_amount: editData.basic_bill_amount,
      gst: editData.gst,
      total_bill: editData.total_bill,
      remark: editData.remark,
      booking_bill_status_id: editData.booking_bill_status_id,
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile.set(file);
  }

  // ============================================================================
  // Submit Handler
  // ============================================================================
  onSubmit(): void {
    if (!this.addBookingbillform.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValues = this.addBookingbillform.getRawValue();
    const formData = this.buildFormData(
      formValues,
      this.dialogData.bookingID,
      this.selectedFile()
    );

    const apiCall = this.bookingBillId()
      ? this.updateBookingBill(formData)
      : this.createBookingBill(formData);

    apiCall
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.handleSuccess(response.message);
          } else {
            this.handleError(response.message || 'Operation failed');
          }
        },
        error: (error) => {
          this.handleError(
            error.error?.message || 'An error occurred. Please try again.'
          );
        },
      });
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================
  private getUserId(): number {
    return Number(sessionStorage.getItem('session_id')) || 0;
  }

  private buildFormData(
    formValues: Record<string, unknown>,
    bookingId: number,
    file?: File | null
  ): FormData {
    const formData = new FormData();
    formData.append('booking_id', bookingId.toString());

    Object.entries(formValues).forEach(([key, value]) => {
      if (key !== 'attachment' && value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    if (file) {
      formData.append('attachment', file);
    }

    return formData;
  }

  private createBookingBill(formData: FormData) {
    return this.http.post<BookingBillResponse>(
      `${this.baseUrl}/add_booking_bill`,
      formData
    );
  }

  private updateBookingBill(formData: FormData) {
    return this.http.post<BookingBillResponse>(
      `${this.baseUrl}/edit_booking_bill`,
      formData
    );
  }

  private markFormGroupTouched(): void {
    Object.keys(this.addBookingbillform.controls).forEach((key) => {
      const control = this.addBookingbillform.get(key);
      control?.markAsTouched();
    });
  }

  private handleSuccess(message: string): void {
    this.dialog.open(SuccessDialogComponent, {
      data: { 
        status: true,
        message,
        showButton: false 
      },
    });
    this.dialogRef.close(true);
  }

  private handleError(message: string): void {
    this.dialog.open(SuccessDialogComponent, {
      data: { 
        status: false,
        message,
        showButton: false 
      },
    });
  }
}
