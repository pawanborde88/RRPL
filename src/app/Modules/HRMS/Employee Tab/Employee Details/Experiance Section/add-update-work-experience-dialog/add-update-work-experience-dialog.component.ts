import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-add-update-work-experience-dialog',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule, ReactiveFormsModule],
  templateUrl: './add-update-work-experience-dialog.component.html',
  styleUrls: ['./add-update-work-experience-dialog.component.scss'],
})
export class AddUpdateWorkExperienceDialogComponent implements OnInit {
  baseUrl = environment.API_URL;
  uploading = false;
  deleteLoading = false;
  currentlyWorking = false;
  invalidDateRange = false;

  workExperienceForm!: FormGroup;
  title: string;
  apiUrl: string;
  successMessage: string;
  updateData: any;
  employeeData:any;

  pipe = new DatePipe('en-US');

  constructor(
    private dialogRef: MatDialogRef<AddUpdateWorkExperienceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) {
    this.title = data?.title || '';
    this.apiUrl = data?.apiUrl || '';
    this.successMessage = data?.successMessage || '';
    this.updateData = data?.onUploadComplete || {};
    this.employeeData = data?.employeeData || ''
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.workExperienceForm = new FormGroup({
      employee_id: new FormControl(this.employeeData),
      work_experience: new FormControl(this.updateData?.work_experience || ''),
      from_date: new FormControl(this.updateData?.from_date || '', Validators.required),
      to_date: new FormControl(this.updateData?.to_date || ''),
      organization: new FormControl(this.updateData?.organization || '', Validators.required),
      designation: new FormControl(this.updateData?.designation || '', Validators.required),
      current_ctc: new FormControl(this.updateData?.current_ctc || ''),
      summary: new FormControl(this.updateData?.summary || ''),
      ...(this.title === 'Update Work experience' && { work_experience_id: new FormControl(this.updateData?.work_experience_id), }),    });
  }

  onCurrentlyWorkingChange(event: any): void {
    this.currentlyWorking = event.checked;
    this.workExperienceForm.patchValue({
      to_date: this.currentlyWorking ? new Date() : '',
    });
    this.calculateWorkExperience();
  }

  calculateWorkExperience(): void {
    const fromDate = this.workExperienceForm.controls['from_date'].value;
    const toDate = this.workExperienceForm.controls['to_date'].value;

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      if (from <= to) {
        this.invalidDateRange = false;
        const diff = to.getTime() - from.getTime();
        const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
        const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

        const experience = `${years > 0 ? `${years} years` : ''} ${
          months > 0 ? `${months} months` : ''
        }`.trim();
        this.workExperienceForm.patchValue({
          work_experience: experience || 'Less than a month',
        });
      } else {
        this.invalidDateRange = true;
        this.workExperienceForm.patchValue({ work_experience: 'Invalid date range' });
      }
    } else {
      this.invalidDateRange = true;
      this.workExperienceForm.patchValue({ work_experience: '' });
    }
  }

  saveWorkExperience(): void {
    if (this.workExperienceForm.invalid) return;

    this.uploading = true;
    const url = `${this.baseUrl}/${this.apiUrl}`;
    const body = {
      ...this.workExperienceForm.value,
      from_date: this.pipe.transform(this.workExperienceForm.controls['from_date'].value, 'MM/dd/yyyy'),
      to_date: this.pipe.transform(this.workExperienceForm.controls['to_date'].value, 'MM/dd/yyyy'),
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
      complete: () =>{
        this.uploading = false,
        this.dialogRef.close({ success: true });
      }
    });
  }

  deleteWorkExperience(): void {
    this.deleteLoading = true;
    const url = `${this.baseUrl}/delete_employee_work_experience`;

    this.http.post(url, { work_experience_id: this.updateData?.work_experience_id }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackbarService.showDataSnackbar('Work experience deleted');
          this.dialogRef.close({ success: true });
        } else {
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: () => {
        this.snackbarService.showDataSnackbar('An error occurred, please try later');

      },
      complete: () => (this.deleteLoading = false),
    });
  }
}
