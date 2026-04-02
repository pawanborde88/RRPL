import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';

@Component({
  selector: 'app-project-stamp-signature-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './project-stamp-signature-dialog.component.html',
  styleUrl: './project-stamp-signature-dialog.component.scss',
})
export class ProjectStampSignatureDialogComponent implements OnInit {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');

  selectedFiles: any[] = [];
  existingStamp: string | null = null;
  existingSignature: string | null = null;
  isEditing = false;
  loading = false;

  stampSignatureForm = new FormGroup({
    project_id: new FormControl(this.data.projectId, Validators.required),
    project_stamp: new FormControl(null),
    project_signature: new FormControl(null),
  });

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ProjectStampSignatureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    console.log(this.data);

    // If editing existing images
    if (this.data.action === 'edit') {
      this.isEditing = true;
      if (this.data.imageType === 'project_stamp' && this.data.currentImage) {
        this.existingStamp = this.data.currentImage;
      }
      if (
        this.data.imageType === 'project_signature' &&
        this.data.currentImage
      ) {
        this.existingSignature = this.data.currentImage;
      }
    }
  }

  onFileSelected(event: any, field: string): void {
    const file = event.target.files[0];
    if (file) {
      if (field === 'project_stamp') {
        this.stampSignatureForm.get('project_stamp')?.setValue(file);
        this.previewImage(file, 'stamp');
      } else if (field === 'project_signature') {
        this.stampSignatureForm.get('project_signature')?.setValue(file);
        this.previewImage(file, 'signature');
      }
    }
  }

  previewImage(file: File, type: string): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (type === 'stamp') {
        this.existingStamp = e.target.result;
      } else {
        this.existingSignature = e.target.result;
      }
    };
    reader.readAsDataURL(file);
  }

  removeImage(type: string): void {
    if (type === 'stamp') {
      this.existingStamp = null;
      this.stampSignatureForm.get('project_stamp')?.setValue(null);
    } else {
      this.existingSignature = null;
      this.stampSignatureForm.get('project_signature')?.setValue(null);
    }
  }

  onSubmit(): void {
    this.loading = true;
    const formData = new FormData();

    // Append all form values
    Object.keys(this.stampSignatureForm.value).forEach((key) => {
      const value = this.stampSignatureForm.get(key)?.value;
      if (value instanceof File) {
        formData.append(key, value, value.name);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString()); // Ensure non-file values are converted to strings
      }
    });

    this.http.post(`${this.baseUrl}/${this.data.apiUrl}`, formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.snackBar.open(
          response.message || 'Operation successful',
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(true); // Close dialog and indicate success
      },
      error: (error) => {
        this.loading = false;
        console.error('Error:', error);
        this.snackBar.open(error.error?.message || 'Error occurred', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
