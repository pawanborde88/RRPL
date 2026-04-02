import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { environment } from '../../../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import { CustomValidators } from '../../../../../../Common/customValidators';

@Component({
  selector: 'app-reset-user-password',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, ReactiveFormsModule],

  templateUrl: './reset-user-password.component.html',
  styleUrl: './reset-user-password.component.scss'
})
export class ResetUserPasswordComponent implements OnInit {
  baseUrl = environment.API_URL;
  resetPassword: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ResetUserPasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.resetPassword = this.fb.group({
      user_id: [null],
      token_id: [null],
      password: ['', [Validators.required, CustomValidators.PasswordStrength()]],
    });
  }

  ngOnInit(): void {
    if (this.data?.userId && this.data.userId.length > 0) {
      const firstItem = this.data.userId[0];
      this.resetPassword.patchValue({
        user_id: firstItem.user_id,
        token_id: firstItem.token_id || firstItem.token_visitor_id,
      });
    }
  }

  onSubmit() {
    if (this.resetPassword.invalid) return;

    const formValue = this.resetPassword.value;
    const payload: any = {
      password: formValue.password,
    };

    const isVisitor = this.data?.for === 'visitor';
    const firstItem = this.data?.userId?.[0];

    if (isVisitor) {
      payload.token_id = firstItem?.token_id || firstItem?.token_visitor_id || formValue.token_id;
    } else {
      payload.user_id = firstItem?.user_id || formValue.user_id;
    }

    if (!payload.token_id && !payload.user_id) {
      this.snackBar.open('User or Token ID is missing', 'Close', { duration: 3000 });
      return;
    }

    const apiUrl = isVisitor
      ? `${this.baseUrl}/set_customer_password`
      : `${this.baseUrl}/reset_password`;

    this.http.post(apiUrl, payload).subscribe({
      next: (response: any) => {
        this.dialog.open(SuccessDialogComponent, {
          autoFocus: false,
          data: { message: response.message },
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to reset password', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
