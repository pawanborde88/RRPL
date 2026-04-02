import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-add-update-education-dialog',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './add-update-education-dialog.component.html',
  styleUrls: ['./add-update-education-dialog.component.scss']
})
export class AddUpdateEducationDialogComponent implements OnInit {

  educationForm!: FormGroup;
  title: string;
  apiUrl: string;
  successMessage: string;
  updateData: any;
  employeeData: any;
  uploading = false;
  deleteLoading = false;
  makeReadonly = false;

  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;

  EducationLevels: any[] = [];
  Specializations: any[] = [];
  Courses: any[] = [];

  constructor(
    private dialogRef: MatDialogRef<AddUpdateEducationDialogComponent>,
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
    this.initializeForm();
    this.fetchLevels();

    if (this.title === 'Update Education Details') {
      this.educationForm.get('course')?.disable();
      this.educationForm.get('specialization')?.disable();
    } else if ([1, 3, 6].includes(this.updateData?.level)) {
      this.educationForm.get('course')?.disable();
      this.educationForm.get('specialization')?.disable();
    } else {
      this.fetchCourses(this.updateData?.level);
      this.fetchSpecializations(this.updateData?.course);
    }
  }

  private initializeForm(): void {
    this.educationForm = new FormGroup({
      employee_id: new FormControl( this.employeeData),
      institution: new FormControl(this.updateData?.institution || '', Validators.required),
      level: new FormControl(this.updateData?.level || '' , Validators.required),
      course: new FormControl(this.updateData?.course || '', Validators.required),
      specialization: new FormControl(this.updateData?.specialization || '', Validators.required),
      grade: new FormControl(this.updateData?.grade || '', Validators.required),
      year_of_completion: new FormControl(this.updateData?.year_of_completion || '', Validators.required),
      city: new FormControl(this.updateData?.city || '', Validators.required),
      country: new FormControl(this.updateData?.country || '', Validators.required),
      university: new FormControl(this.updateData?.university || '', Validators.required),
      comment: new FormControl(this.updateData?.comment || ''),
      state: new FormControl(this.updateData?.state),
      ...(this.title === 'Update Education Details' && { education_id: new FormControl(this.updateData?.education_id || ''), }),    });


  }

  fetchLevels(): void {
    const url = `${this.baseUrl}/fetch_education_level`;
    this.http.get(url).subscribe({
      next: (response: any) => (this.EducationLevels = response),
      error: (error) => console.error(error)
    });
  }

  fetchSpecializations(course_id: string): Promise<void> {
    const url = `${this.baseUrl}/fetch_specialization`;
    const requestBody = { course_id };
    return this.http.post(url, requestBody).toPromise().then((response: any) => {
      this.Specializations = response.length ? response : [];
      if (!response.length) this.educationForm.get('specialization')?.disable();
    });
  }

  fetchCourses(education_level_id: string): Promise<void> {
    const url = `${this.baseUrl}/fetch_courses`;
    const requestBody = { education_level_id };
    return this.http.post(url, requestBody).toPromise().then((response: any) => {
      this.Courses = response;
    });
  }

  onLevelChange(event: any): void {
    const selectedOption = event.value;
    this.educationForm.get('course')?.reset();
    this.educationForm.get('specialization')?.reset();
    if ([1, 3, 6].includes(selectedOption)) {
      this.educationForm.get('course')?.disable();
      this.educationForm.get('specialization')?.disable();
    } else {
      this.fetchCourses(selectedOption).then(() => {
        this.educationForm.get('course')?.enable();
      });
    }
  }

  onCourseChange(event: any): void {
    const selectedOption = event.value;
    this.educationForm.get('specialization')?.reset();
    this.fetchSpecializations(selectedOption).then(() => {
      this.educationForm.get('specialization')?.enable();
    });
  }

  saveEducation(): void {
    this.uploading = true;
    const url = `${this.baseUrl}/${this.apiUrl}`;
    const body = this.educationForm.value;
    this.http.post(url, body).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.data.onUploadComplete().then(() => {
            this.snackbarService.showDataSnackbar(this.successMessage);
          });

        } else {
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: () => this.snackbarService.showDataSnackbar('An error occurred, please try later'),
      complete: () => {
        this.uploading = false;
        this.dialogRef.close({ success: true });
      }
    });
  }

  deleteEducation(): void {
    this.deleteLoading = true;
    const url = `${this.baseUrl}/delete_education_information`;
    this.http.post(url, { education_id: this.updateData?.education_id }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.data.onUploadComplete().then(() => {
            this.snackbarService.showDataSnackbar('Education deleted');
          });
        } else {
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },

      error: () => this.snackbarService.showDataSnackbar('An error occurred, please try later'),
      complete: () => {
        this.deleteLoading = false;
        this.dialogRef.close();
      }
    });
  }




}
