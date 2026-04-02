import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../../../Service/common/common.service';
import { AddAminitiesComponent } from '../Aminities/add-aminities/add-aminities.component';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-add-document',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-document.component.html',
  styleUrl: './add-document.component.scss',
})
export class AddDocumentComponent {
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  selectedFileName: string = ''; // To display the selected file nam
  private readonly storageUrl = environment.STORAGE_URL;

  constructor(
    private commonService: CommonService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddDocumentComponent> // Reference to the dialog
  ) { }


  addDocumentForm = new FormGroup({
    user_id: new FormControl(this.userId ?? '',),
    project_id: new FormControl(this.data?.projectid ?? '',),
    active_status_id: new FormControl(this.data?.active_status_id ?? '',),
    name: new FormControl(this.data?.name ?? '',),
    project_attachment: new FormControl<File | null>(null,),
  });


  ngOnInit(): void {
    console.log('Project ID:', this.data?.projectid);
    console.log(this.data);

  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Only PDF, DOC, and DOCX files are allowed', 'Close', { duration: 3000 });
        return;
      }

      this.selectedFileName = file.name;
      this.addDocumentForm.patchValue({ project_attachment: file });
      this.addDocumentForm.get('project_attachment')?.updateValueAndValidity();
    }
  }


  onSubmit(): void {
    const formData = new FormData();
    formData.append('user_id', this.userId?.toString() || '');
    formData.append('project_id', this.data.projectid?.toString() || '');
    formData.append('name', this.addDocumentForm.get('name')?.value);

    formData.append('active_status_id', this.addDocumentForm.get('active_status_id')?.value?.toString() || '');

    const file = this.addDocumentForm.get('project_attachment')?.value as File;
    if (!file) {
      this.snackBar.open('Please upload a document before submitting', 'Close', { duration: 3000 });
      return;
    }

    formData.append('project_attachment', file);

    this.commonService.uploadFile(this.data.apiUrl, formData).subscribe({
      next: (response: any) => {
        console.log(response);
        this.snackBar.open(this.data.successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.snackBar.open('Something went wrong. Please try again.', 'Close', { duration: 3000 });
      },
    });
  }


}
