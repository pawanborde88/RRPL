import { Component, Inject, OnInit } from '@angular/core';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { environment } from '../../../../../../environments/environment';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';

@Component({
  selector: 'app-add-cpbill-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AmountDirective,
  ],
  templateUrl: './add-cpbill-payment-dialog.component.html',
  styleUrl: './add-cpbill-payment-dialog.component.scss'
})
export class AddCPBillPaymentDialogComponent implements OnInit{
  baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));
  selectedStatus: number = 0;
  rejectionReason: string = '';
  minDate: Date = new Date();

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    public dialogRef: MatDialogRef<AddCPBillPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,   ) {

  }
 // Initialize form with empty/default values
 addCPpaymentBillFom = new FormGroup({
  booking_bill_id: new FormControl(this.data.booking_bill_id),
  bill_date: new FormControl(null),
  bill_no: new FormControl(null),
  date_of_bill: new FormControl(null),
  basic_bill_amount: new FormControl(null),
  total_bill: new FormControl(null),
  gst_amount: new FormControl(null),
  tds_amount: new FormControl(),
  paid_bill_amount: new FormControl(),
  cheque_no: new FormControl(''),
  cheque_date: new FormControl(''),
  bank_details: new FormControl(''),
  remark: new FormControl(''),
  payment_date: new FormControl(''),
  payment_remark: new FormControl(''),
  created_by: new FormControl(this.userId)
});

ngOnInit(): void {
  console.log(this.data);
  
  if (this.data) {
    // Determine basic_bill_amount based on bill_type_id
    // bill_type_id = 2 (FOS Bill) -> use fos_amount
    // bill_type_id = 1 (Main Bill) -> use total_booking_commission
    const basicBillAmount = this.data.bill_type_id === 2 
      ? (this.data.fos_amount || 0)
      : (this.data.basic_bill_amount || 0);
    
    // Calculate TDS (2% of basic bill amount)
    const totalBill = basicBillAmount;
    const tdsAmount = totalBill * 0.02;
    const paidAmount = totalBill - tdsAmount;

    this.addCPpaymentBillFom.patchValue({
      booking_bill_id: this.data.booking_bill_id,
      bill_no: this.data.bill_no,
      bill_date: this.data.bill_date,
      date_of_bill: this.data.date_of_bill, 
      basic_bill_amount: basicBillAmount,
      total_bill: totalBill,
      gst_amount: this.data.gst,
      tds_amount: tdsAmount,
      paid_bill_amount: paidAmount,
      remark: this.data.remark
    });
  }
}
  onConfirm() {
    if (this.addCPpaymentBillFom.invalid) {
      return;
    }
  
    const payload = {
      ...this.addCPpaymentBillFom.value,
      created_by: this.userId
    };
  
    this.http.post(`${this.baseUrl}/add_bill_payment`, payload).subscribe({
      next: (response: any) => {
        this.dialog.open(SuccessDialogComponent, {
          autoFocus: false,
          data: { message: response.message },
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.snackBar.open(error.error.message || 'Failed to add payment', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
