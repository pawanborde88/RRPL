import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-change-approved-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './change-approved-status-dialog.component.html',
  styleUrl: './change-approved-status-dialog.component.scss',
})
export class ChangeApprovedStatusDialogComponent implements OnInit {
  baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));
  selectedStatus: number = 0;
  rejectionReason: string = '';
  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    public dialogRef: MatDialogRef<ChangeApprovedStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}
  ngOnInit(): void {
    console.log(this.data);
    
  }
  onConfirm() {
    const payload = {
      booking_bill_id: this.data.currentStatus.booking_bill_id,
      reason: this.rejectionReason,
      bill_status_id: this.selectedStatus,
    };

    this.http.post(`${this.baseUrl}/change_bill_status`, payload).subscribe({
      next: (response: any) => {
        this.dialog.open(SuccessDialogComponent, {
          autoFocus: false,
          data: { message: response.message },
        });
        this.dialogRef.close(true);
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.snackBar.open('Failed to update user status', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
