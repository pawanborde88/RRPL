import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';

@Component({
  selector: 'app-add-cp-booking-bill-work-flow',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
    ReusableTableComponent,
  ],
  templateUrl: './add-cp-booking-bill-work-flow.component.html',
  styleUrl: './add-cp-booking-bill-work-flow.component.scss'
})
export class AddCpBookingBillWorkFlowComponent implements OnInit {
  baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));
  approvalForm: FormGroup;
  allRoleList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<AddCpBookingBillWorkFlowComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.approvalForm = this.fb.group({
      approval_level: ['', Validators.required],
      role_id: ['', [Validators.required]],
      is_highest: [false, []],
      created_by: [this.userId]
    });
  }

  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllRoles();
    if (this.data.row) {
      this.approvalForm.patchValue(this.data.row);
    }
  }

  fetchAllRoles(): void {
    this.http.get(`${this.baseUrl}/roles_dropdown`).subscribe({
      next: (res: any) => {
        this.allRoleList = res;
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch Tokens.', 'Close', {
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
      approval_level_id: this.data.row?.approval_level_id,
      approval_level: this.approvalForm.value.approval_level,
      role_id: this.approvalForm.value.role_id,
      created_by: this.userId,
      updated_by: this.userId,
      is_highest: this.approvalForm.value.is_highest ? 1 : 0,
    };

    if (this.data.row) {
      this.http.post(`${this.baseUrl}/update_approval_level`, payload).subscribe({
        next: (response: any) => {
          this.dialog.open(SuccessDialogComponent, {
            autoFocus: false,
            data: { message: response.message },
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.snackBar.open('Failed to update approval status', 'Close', {
            duration: 3000,
          });
        },
      });
    } else {
      this.http.post(`${this.baseUrl}/add_approval_level`, payload).subscribe({
        next: (response: any) => {
          this.dialog.open(SuccessDialogComponent, {
            autoFocus: false,
            data: { message: response.message },
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.snackBar.open('Failed to add approval level', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}