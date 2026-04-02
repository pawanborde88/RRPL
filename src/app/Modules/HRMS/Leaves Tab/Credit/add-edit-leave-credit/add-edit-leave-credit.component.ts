


import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { SnackbarService } from '../../../../../Service/snackbar.service';

@Component({
  selector: 'app-add-edit-leave-credit',
  standalone: true,
  imports: [AngularMaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './add-edit-leave-credit.component.html',
  styleUrl: './add-edit-leave-credit.component.scss'
})
export class AddEditLeaveCreditComponent implements OnInit {
  baseUrl = environment.API_URL;
  uploading = false;
  deleteLoading = false;
  loadingState = false;
  invalidDateRange = false;

  addHolidayForm!: FormGroup;
  title: string;
  apiUrl: string;
  successMessage: string;
  updateData: any;
  employeeData: any;

  pipe = new DatePipe('en-US');
  leaveType: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<AddEditLeaveCreditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) {
    this.title = data?.title || '';
    this.apiUrl = data?.apiUrl || '';
    this.successMessage = data?.successMessage || '';
    this.updateData = data?.onUploadComplete || {};
    this.employeeData = data?.employeeData || '';
  }

  ngOnInit(): void {
    this.fetchLeaveType();
    this.initializeForm();
  }

  private initializeForm(): void {
    this.addHolidayForm = new FormGroup({
      leave_type_id: new FormControl(this.updateData?.leave_type_id || '', Validators.required),
      monthly_credit: new FormControl(this.updateData?.monthly_credit || '', Validators.required),
      annual_credit: new FormControl(this.updateData?.annual_credit || '', Validators.required),
      annual_carry_forward: new FormControl(this.updateData?.annual_carry_forward || ''),
   ...(this.title ===  'Update Leave Credit' && { leave_credit_id: new FormControl(this.updateData?.leave_credit_id), }),
   ...(this.title !==  'Update Leave Credit' && {  created_by: new FormControl(sessionStorage.getItem('session_id'))}),
   ...(this.title ===  'Update Leave Credit' && {  updated_by: new FormControl(sessionStorage.getItem('session_id') ) }),

    });
  }

  fetchLeaveType(): void {
    this.http.post(`${this.baseUrl}/fetch_leave_types`, {account_id : 1}).subscribe({
      next: (res: any) => {
        this.leaveType = res.data || [];
      },
      error: (err: any) => {
        console.error(err);
      },
    });
  }

  onSubmit(): void {
    if (this.addHolidayForm.invalid) return;

    this.uploading = true;
    const url = `${this.baseUrl}/${this.apiUrl}`;
    const body = {
      ...this.addHolidayForm.value,
    };

    this.http.post(url, body).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackbarService.showDataSnackbar(this.successMessage);
          this.dialogRef.close({ success: true });
        } else {
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: () => {
        this.snackbarService.showDataSnackbar('An error occurred, please try later');
      },
      complete: () => {
        this.uploading = false;
      },
    });
  }




}
