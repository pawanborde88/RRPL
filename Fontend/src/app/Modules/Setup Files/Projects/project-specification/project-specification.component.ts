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
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-specification',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './project-specification.component.html',
  styleUrl: './project-specification.component.scss',
})
export class ProjectSpecificationComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  projectsList: any[] = []; // Will hold project data

  selectedFile: File | null = null; // To handle file uploads
  allFeetList: any[] = [];

  imageSize: string | null = null;
  imagePreview: string | null = null;
  storageUrl = environment.STORAGE_URL;

  pipe = new DatePipe('en-US');
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
         private dialog: MatDialog,
    
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<ProjectSpecificationComponent> // Reference to the dialog
  ) {}
  selectedFiles: any[] = [];
  ngOnInit(): void {
  
    console.log(this.data);
    if (this.data.rowData?.specification_id) {
      this.patchFormData();
    }
  }
  addProjectSpecification = new FormGroup({
    project_id: new FormControl(this.data.projectid),
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
    specification_icon: new FormControl<File[]>([]),
  });

  patchFormData(): void {
    const attachmentUrl = this.data?.rowData?.specification_icon
      ? `${this.storageUrl}/${this.data?.rowData?.specification_icon}`
      : null;
  
    this.http
      .post(`${this.baseUrl}/fetch_single_specification`, {
        specification_id: this.data?.rowData?.specification_id,
      })
      .subscribe({
        next: async (data: any) => {
          // Patch form data with API response
          this.addProjectSpecification.patchValue({
            project_id: data.project_id,
            title: data.title,
            description: data.description,
          });
  
          // Handle specification_icon (if exists)
          if (data.specification_icon) {
            this.selectedFiles = [
              {
                file: null, // Since it's from API, no actual file is selected
                preview: `${this.storageUrl}/${data.specification_icon}`, // Display the stored image
              },
            ];
          }
        },
        error: (err: any) => {
          this.snackBar.open('Unable to fetch specification data.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  


  onChangeFile(event: Event): void {
    const input = event.target as HTMLInputElement;
  
    if (input.files && input.files.length > 0) {
      const newFiles: any[] = [];
  
      Array.from(input.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          newFiles.push({ file, preview: reader.result as string });
  
          // Update FormControl after all images are processed
          if (newFiles.length === input.files?.length) {
            this.selectedFiles = [...this.selectedFiles, ...newFiles]; 
            this.addProjectSpecification.patchValue({ specification_icon: this.selectedFiles.map(f => f.file) });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.addProjectSpecification.patchValue({
      specification_icon: this.selectedFiles.map((f) => f.file), // Update form control after file removal
    });
  }



  onSubmit(): void {
  
  
    const formData = new FormData();
    const formValues = this.addProjectSpecification.value;
    const { apiUrl, successMessage } = this.data;
  
    // Append text fields
    formData.append('user_id', this.userId?.toString() || '');
    formData.append('project_id', formValues.project_id?.toString() || '');
    formData.append('title', formValues.title?.toString() || '');
    formData.append('description', formValues.description?.toString() || '');
  
    // Append multiple files in binary format
    this.selectedFiles.forEach((fileObj) => {
      formData.append('specification_icon', fileObj.file); // API receives multiple 'specification_icon' fields
    });
    if (this.data?.rowData?.specification_id) {
      formData.append('specification_id', this.data?.rowData?.specification_id?.toString() || '');
      formData.append('updated_by', this.userId?.toString() || '');


    }
  
    // Submit form via HTTP
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      () => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }
  deleteProjectspecification(spcificationID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this Spcification Icon?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_project_specification`, {
            specification_id: spcificationID,
          })
          .subscribe({
            next: (data: any) => {
              this.dialogRef.close(true);

              this.snackBar.open(
                ` Specifiction icon deleted successfully`,
                'Close',
                {
                  duration: 3000,
                }
              );
       
            },
            error: (err: any) => {
              console.error(err);
              this.snackBar.open('Unable to delete the image.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
  


}
