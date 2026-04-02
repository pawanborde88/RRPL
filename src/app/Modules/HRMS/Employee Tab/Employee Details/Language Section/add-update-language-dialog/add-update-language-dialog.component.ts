import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { environment } from '../../../../../../../environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-update-language-dialog',
  standalone: true,
  imports: [AngularMaterialModule, ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './add-update-language-dialog.component.html',
  styleUrls: ['./add-update-language-dialog.component.scss'],
})
export class AddUpdateLanguageDialogComponent implements OnInit {
  uploading: boolean = false;
  deleteLoading: boolean = false;
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;

  LanguageForm: FormGroup;
  title: string;
  apiUrl: string;
  successMessage: string;
  updateData: any;
  employeeData: any;
  Ratings: any = [];
  Languages: any = [];

  constructor(
    private dialogRef: MatDialogRef<AddUpdateLanguageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) {
    this.title = data?.title || '';
    this.apiUrl = data?.apiUrl || '';
    this.successMessage = data?.successMessage || '';
    this.updateData = data?.onUploadComplete || {};
    this.employeeData = data?.employeeData || '';

    this.LanguageForm = new FormGroup({
      employee_id: new FormControl(  this.employeeData),
      language_id: new FormControl(this.updateData?.language_id, Validators.required),
      read_language: new FormControl(this.updateData?.read_language, Validators.required),
      write_language: new FormControl(this.updateData?.write_language, Validators.required),
      speak_language: new FormControl(this.updateData?.speak_language, Validators.required),
      ...(this.title === 'Update Work experience' && { employee_language_id: new FormControl(this.updateData?.employee_language_id), }),    });

  }

  ngOnInit(): void {
    this.fetchLanguages();
    this.fetchLanguageRatings();
  }

  // ==============================================================================
  fetchLanguages(): void {
    const url = `${this.baseUrl}/fetch_languages`;

    this.http.get(url).subscribe({
      next: (response: any) => {
        console.log(response);
        this.Languages = response;
      },
      error: (error) => {
        console.error('Error fetching languages:', error);
      },
    });
  }

  // ==============================================================================
  fetchLanguageRatings(): void {
    const url = `${this.baseUrl}/fetch_rating`;

    this.http.get(url).subscribe({
      next: (response: any) => {
        console.log(response);
        this.Ratings = response;
      },
      error: (error) => {
        console.error('Error fetching ratings:', error);
      },
    });
  }

  // ==============================================================================
  saveLanguage(): void {
    this.uploading = true;

    const url = `${this.baseUrl}/${this.apiUrl}`;
    const body = this.LanguageForm.value;

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
      error: (error) => {
        console.error('Error saving language:', error);
        this.snackbarService.showDataSnackbar('An error occurred, please try later');
      },
      complete: () => {
        this.uploading = false;
        this.dialogRef.close({ success: true });
      },
    });
  }

  // ==============================================================================
  deleteLanguage(): void {
    this.deleteLoading = true;

    const url = `${this.baseUrl}/delete_employee_language`;

    this.http.post(url, { employee_language_id: this.updateData?.employee_language_id }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.data.onUploadComplete().then(() => {
            this.snackbarService.showDataSnackbar('Language deleted');
          });
        } else {
          this.snackbarService.showDataSnackbar('An error occurred, please try later');
        }
      },
      error: (error) => {
        console.error('Error deleting language:', error);
        this.snackbarService.showDataSnackbar('An error occurred, please try later');
      },
      complete: () => {
        this.deleteLoading = false;
        this.dialogRef.close();
      },
    });
  }
}
