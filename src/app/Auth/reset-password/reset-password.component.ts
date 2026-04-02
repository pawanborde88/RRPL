import { Component, Inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { BreadcrumbComponent } from '../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../Common/template/template.component';
import { HttpClient } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SuccessDialogComponent } from '../../Common/success-dialog/success-dialog.component';
import { environment } from '../../../environments/environment';
import { CustomValidators } from '../../Common/customValidators';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
    email = sessionStorage.getItem('user_email')
    baseUrl = environment.API_URL;
  hidePassword = true;
  hideConfirmPassword = true;

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('new_password')?.value;
    const confirmPassword = control.get('confirm_password')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  resetPasswordForm = new FormGroup(
    {
      email: new FormControl(this.email, [Validators.required, Validators.email]),
      new_password: new FormControl('', [
        Validators.required,
        CustomValidators.PasswordStrength()
      ]),
      confirm_password: new FormControl('', [Validators.required])
    },
    { validators: this.passwordMatchValidator.bind(this) }
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ResetPasswordComponent>,
    private http: HttpClient,
        private dialog: MatDialog
,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit(): void {
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      return;
    }

    const payload = {
      email: this.resetPasswordForm.value.email,
      new_password: this.resetPasswordForm.value.new_password,
      confirm_password: this.resetPasswordForm.value.confirm_password,
    };

    this.http.post(`${this.baseUrl}/create_password`, payload).subscribe({
      next: (res: any) => {
      this.dialog.open(SuccessDialogComponent, {
            data: { message: res.message },
          });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBar.open(
          err.error.message || 'Failed to reset password',
          'Close',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }
}
