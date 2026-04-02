
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-add-edit-family-details-dialog',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule, ReactiveFormsModule],
  templateUrl: './add-edit-family-details-dialog.component.html',
  styleUrl: './add-edit-family-details-dialog.component.scss'
})
export class AddEditFamilyDetailsDialogComponent {
  baseUrl = environment.API_URL;
  uploading = false;
  deleteLoading = false;
  currentlyWorking = false;
  invalidDateRange = false;

  familyDeatilsForm!: FormGroup;
  title: string;
  apiUrl: string;
  successMessage: string;
  updateData: any;
  employeeData:any;

  pipe = new DatePipe('en-US');

  constructor(
    private dialogRef: MatDialogRef<AddEditFamilyDetailsDialogComponent>,
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
    this.familyDeatilsForm = new FormGroup({

      employee_id: new FormControl(this.employeeData),
      relation: new FormControl(this.updateData?.relation || '', Validators.required),
      first_name: new FormControl(this.updateData?.first_name || '', Validators.required),
      last_name: new FormControl(this.updateData?.last_name || '', Validators.required),
      phone: new FormControl(this.updateData?.phone || ''),
      email: new FormControl(this.updateData?.email || ''),

      ...(this.title !== 'Update Family Details' && {  created_by: new FormControl(this.updateData?.created_by || ''), }),
      ...(this.title === 'Update Family Details' && {  updated_by: new FormControl(this.updateData?.updated_by || ''), }),

      ...(this.title === 'Update Family Details' && { employee_family_id: new FormControl(this.updateData?.employee_family_id), }),    });
  }




  submit(): void {
    if (this.familyDeatilsForm.invalid) return;

    this.uploading = true;
    const url = `${this.baseUrl}/${this.apiUrl}`;
    const body = {
      ...this.familyDeatilsForm.value };

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


}
