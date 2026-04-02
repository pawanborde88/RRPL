import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';
import { inject, ChangeDetectionStrategy } from '@angular/core';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-inactive-user',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    HttpClientModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inactive-user.component.html',
  styleUrl: './inactive-user.component.scss'
})
export class InactiveUserComponent implements OnInit {
  baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  public readonly dialogRef = inject(MatDialogRef<InactiveUserComponent>);
  public readonly data = inject(MAT_DIALOG_DATA);

  constructor() { }

  inactiveForm = new FormGroup({
    user_id: new FormControl(this.data.userId[0].user_id),

    active_status_id: new FormControl(this.data.userId[0].active_status_id, [Validators.required]),
    created_by: new FormControl(this.userId),
    reason: new FormControl('', [Validators.required]),

  });
  ngOnInit(): void {
    console.log(this.data);

  }

  onSubmit() {
    const payload = {
      user_id: this.data.userId[0].user_id,
      reason: this.inactiveForm.value.reason,
      active_status_id: this.inactiveForm.value.active_status_id,
      created_by: this.userId
    };

    this.http.post(`${this.baseUrl}/inactive_user`, payload).subscribe({
      next: (response: any) => {
        this.dialog.open(SuccessDialogComponent, {
          autoFocus: false,
          data: { message: response.message },
        });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.snackBar.open('Failed to update user status', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
