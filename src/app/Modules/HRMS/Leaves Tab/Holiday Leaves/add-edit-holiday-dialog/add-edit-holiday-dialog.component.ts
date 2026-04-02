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
  selector: 'app-add-edit-holiday-dialog',
  standalone: true,
  imports: [AngularMaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './add-edit-holiday-dialog.component.html',
  styleUrls: ['./add-edit-holiday-dialog.component.scss'],
})
export class AddEditHolidayDialogComponent implements OnInit {
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
    private dialogRef: MatDialogRef<AddEditHolidayDialogComponent>,
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
      date: new FormControl(this.updateData?.date || '', Validators.required),
      occasion: new FormControl(this.updateData?.occasion || '', Validators.required),
      occasion_type_id: new FormControl(this.updateData?.occasion_type_id || '', Validators.required),
      comment: new FormControl(this.updateData?.comment || ''),
   ...(this.title ===  'Update Holiday' && { holiday_calendar_id: new FormControl(this.updateData?.holiday_calendar_id), }),
   ...(this.title !==  'Update Holiday' && {  created_by: new FormControl(sessionStorage.getItem('session_id'))}),
   ...(this.title ===  'Update Holiday' && {  updated_by: new FormControl(sessionStorage.getItem('session_id') ) }),

    });
  }

  fetchLeaveType(): void {
    this.http.get(`${this.baseUrl}/fetch_occasion_types`).subscribe({
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
      date: this.pipe.transform(this.addHolidayForm.value['date'], 'yyyy-MM-dd'),
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
