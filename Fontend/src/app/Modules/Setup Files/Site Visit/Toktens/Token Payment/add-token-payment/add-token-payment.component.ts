import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../../../environments/environment';
import { CommonModule, DatePipe } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';

import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AmountDirective } from '../../../../../../Common/Amount Direcitve/amount.directive';

@Component({
  selector: 'app-add-token-payment',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    AmountDirective,


  ],
  templateUrl: './add-token-payment.component.html',
  styleUrl: './add-token-payment.component.scss',
})
export class AddTokenPaymentComponent implements OnInit {
  allPaymentMode: any[] = [];
  baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));
  @Input() tokenId: number | null = null; // Initialize as null
  selectedFile: File | null = null;
  pipe = new DatePipe('en-US');
  minDate: Date = new Date();

  addTokenForm = new FormGroup({
    transaction_id: new FormControl(''),
    token_id: new FormControl(this.tokenId), // Initialize with tokenId
    payment_mode_id: new FormControl('', Validators.required),
    amount: new FormControl('', [
      Validators.required,
      Validators.min(1),
      this.amountNotGreaterThanBalance(),
    ]),
    balance: new FormControl(''),

    cheque_no: new FormControl(''),
    upi_id: new FormControl(''),
    card_no: new FormControl(''),
    created_by: new FormControl(this.userId),
    bank_name: new FormControl(''),
    ifsc_code: new FormControl(''),
    bank_branch: new FormControl(''),

    date: new FormControl(this.pipe.transform(new Date(), 'yyyy-MM-dd')),
    payment_attachment: new FormControl(''),
  });

  constructor(
    private http: HttpClient,
    private _activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    if (this.tokenId) {
      this.fetchSingleToken(this.tokenId);
      this.addTokenForm.patchValue({ token_id: this.tokenId });
    }

    this.fetchPaymentModeDropdown();

    // Add valueChanges listener to payment_mode_id to update validations
    this.addTokenForm.get('payment_mode_id')?.valueChanges.subscribe((mode) => {
      this.updateValidators(mode);
    });
  }

  updateValidators(paymentMode: string | null) {
    const transactionIdControl = this.addTokenForm.get('transaction_id');
    const bankNameControl = this.addTokenForm.get('bank_name');

    // Reset validators
    transactionIdControl?.clearValidators();
    bankNameControl?.clearValidators();

    // Set validators based on payment mode
    if (paymentMode === '2' || paymentMode === '3' || paymentMode === '4') {
      transactionIdControl?.setValidators([Validators.required]);
    }

    if (paymentMode === '2') {
      bankNameControl?.setValidators([Validators.required]);
    }

    // Update validity
    transactionIdControl?.updateValueAndValidity();
    bankNameControl?.updateValueAndValidity();
  }

  amountNotGreaterThanBalance(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!this.addTokenForm) return null;

      const amount = control.value;
      const balance = this.addTokenForm.get('balance')?.value;

      if (amount && balance && parseFloat(amount) > parseFloat(balance)) {
        return { amountExceedsBalance: true };
      }
      return null;
    };
  }
  fetchSingleToken(tokenID: any): void {
    this.http
      .post(`${this.baseUrl}/fetch_single_token`, { token_id: tokenID })
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.addTokenForm.patchValue({
              balance: res.balance,
              token_id: res.token_id,
            });
          }
        },
        error: () => {
          this.snackBar.open(
            'Error occurred while fetching data, please try later',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }
  fetchPaymentModeDropdown(): void {
    this.http.get(`${this.baseUrl}/payment_mode_dropdown`).subscribe({
      next: (res: any) => {
        this.allPaymentMode = res;
      },
      error: (err: any) => {
        console.error('Error fetching payment modes:', err);
        this.snackBar.open('Unable to fetch payment modes.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onSubmit() {
    if (this.addTokenForm.invalid || !this.tokenId) {
      this.snackBar.open(
        'Please fill all required fields and ensure token ID is available',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    const formData = new FormData();

    Object.keys(this.addTokenForm.controls).forEach((key) => {
      if (key !== 'payment_attachment') {
        const control = this.addTokenForm.get(key);
        if (control) {
          const value = control.value;
          if (value !== null && value !== undefined) {
            // Special handling for date field
            if (key === 'date' && value instanceof Date) {
              formData.append(
                key,
                this.pipe.transform(value, 'yyyy-MM-dd') || ''
              );
            } else {
              formData.append(key, value.toString());
            }
          }
        }
      }
    });

    // Explicitly ensure these fields are included
    formData.append('token_id', this.tokenId.toString());
    formData.append('created_by', this.userId.toString()); // Explicitly add created_by

    // Append file if selected
    if (this.selectedFile) {
      formData.append('payment_attachment', this.selectedFile);
    }

    const apiUrl = `${this.baseUrl}/add_token_payment`;

    this.http.post(apiUrl, formData).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (res.code === 201) {
            this.snackBar.open(res.message, 'Close', { duration: 3000 });
          } else {
            this.addTokenForm.reset();
            this.addTokenForm.patchValue({
              token_id: this.tokenId,
              created_by: this.userId, // Keep created_by after reset
            });
            this.dialog.open(SuccessDialogComponent, {
              data: { message: res.message },
            });
            this.router.navigate(['/setup/sales-tokens']);
          }
        }
      },
      error: (error) => {
        this.dialog.open(SuccessDialogComponent, {
          data: { message: error.error?.message || 'Something went wrong' },
        });
      },
    });
  }
}
