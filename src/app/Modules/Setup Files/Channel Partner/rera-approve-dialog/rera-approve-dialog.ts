import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-rera-approve-dialog',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, FormsModule, ReactiveFormsModule, MatButtonToggleModule],
  templateUrl: './rera-approve-dialog.html',
  styleUrl: './rera-approve-dialog.scss',
})
export class ReraApproveDialog {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<ReraApproveDialog>);
  private readonly baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));

  form: FormGroup;
  isLoading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    console.log(this.data);

    let initialStatus: string | number = '';

    if (this.data?.data) {
      const statusId = this.data.data.rera_approvel_id;
      const status = this.data.data.rera_approvel;

      if (statusId === 1 || status === 'Approve' || status === 'Approved') {
        initialStatus = 1;
      } else if (statusId === 2 || status === 'Unapprove' || status === 'Unapproved') {
        initialStatus = 2;
      }
    }

    this.form = this.fb.group({
      rera_approvel_id: [initialStatus, Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const payload = {
      channel_partner_id: this.data.data.channel_partner_id,
      rera_approvel_id: this.form.value.rera_approvel_id,
      approved_by: this.userId,
    };

    this.http.post(`${this.baseUrl}/change_rera_status`, payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.snackBar.open(res?.message || 'RERA status updated successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error updating RERA status', 'Close', { duration: 3000 });
      }
    });
  }
}
