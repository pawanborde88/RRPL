import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { CommonModule } from '@angular/common';

import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';





@Component({
  selector: 'app-approval-level-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,






  ],
  templateUrl: './approval-level-dialog.component.html',
  styleUrl: './approval-level-dialog.component.scss',
})
export class ApprovalLevelDialogComponent implements OnInit {
  baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));
  approvalForm: FormGroup;
  approvelevelList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ApprovalLevelDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.approvalForm = this.fb.group({
      approval_status_id: ['', Validators.required],
      approval_level_id: ['', Validators.required],
      remark: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit(): void {
    console.log(this.data);
    this.fetchApprovalLevelList();
  }
  private readonly roleData = sessionStorage.getItem('role_id');


  fetchApprovalLevelList(): void {
    this.http.get(`${this.baseUrl}/fetch_approval_levels`).subscribe({
      next: (res: any) => {
        if (!this.roleData) {
          this.approvelevelList = []; // No roles, no approval levels
          return;
        }

        const currentRoles = this.roleData.split(',').map(Number);

        // Filter approval levels where ALL of the user's roles are included in the approval level's role_id
        this.approvelevelList = res.data.filter((level: any) =>
          currentRoles.some(role => level.role_id.includes(role))
        );

        // If you want STRICT matching (approval level must have EXACTLY the user's role)
        // this.approvelevelList = res.data.filter((level: any) => 
        //   level.role_id.some(roleId => currentRoles.includes(roleId))
        // );
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch approval levels.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  onConfirm() {
    if (this.approvalForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    const payload = {
      booking_bill_id: this.data.currentStatus.booking_bill_id,
      remark: this.approvalForm.value.remark,
      approval_status_id: this.approvalForm.value.approval_status_id,
      approval_level_id: this.approvalForm.value.approval_level_id,
      created_by: this.userId,
    };

    this.http.post(`${this.baseUrl}/add_bill_approval`, payload).subscribe({
      next: (response: any) => {
        if (response.success && response.status !== false) {
          const dialogRef = this.dialog.open(SuccessDialogComponent, {
            data: { status: true, message: response.message }
          });

          dialogRef.afterClosed().subscribe(() => {
            this.dialogRef.close(true);
          });
        }
        else if (response.success === true && response.status === false) {
          this.dialog.open(SuccessDialogComponent, {
            data: {
              status: false,
              message: response?.message || 'An error occurred'
            }
          });
        }
        else if (response.code === 201) {
          this.dialog.open(SuccessDialogComponent, {
            data: {
              status: false,
              message: response?.message || 'An error occurred while updating approval status'
            }
          });
        }
      },
      error: (error) => {
        const errorMessage = error.error?.message || error.message || 'Failed to update approval status';
        this.dialog.open(SuccessDialogComponent, {
          autoFocus: false,
          data: { status: false, message: errorMessage },
        });
        this.dialogRef.close(false);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
