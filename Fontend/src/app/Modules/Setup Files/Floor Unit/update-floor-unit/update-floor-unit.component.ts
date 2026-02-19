import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { HttpClient } from '@angular/common/http';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-update-floor-unit',
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
    AutocompleteReusableComponent, // Add the pipe here
  ],
  templateUrl: './update-floor-unit.component.html',
  styleUrl: './update-floor-unit.component.scss',
})
export class UpdateFloorUnitComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  storageUrl = environment.STORAGE_URL;
  projectsList: any[] = [];
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<UpdateFloorUnitComponent> // Reference to the dialog
  ) {}

  excelUploadForm = new FormGroup({
    file: new FormControl(null),
    user_id: new FormControl(this.userId),
    project_id: new FormControl(),
    created_by: new FormControl(this.userId),
  });

  selectedFile?: File;
  loading = false;

  ngOnInit(): void {
    console.log(this.data);

    this.fetchAllProjects();
  }

  selectFile(event: any): void {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

fetchAllProjects(): void {
  this.loading = true;

  const payload = {
    user_id:  this.userId
  };

  this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
    next: (res: any) => {
      if (res) {
        this.projectsList = res;
      }
      this.loading = false;
    },
    error: (err: any) => {
      console.error(err);
      this.loading = false;
      this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
        duration: 3000,
      });
    },
  });
}

  submitFile(): void {
    if (!this.selectedFile) {
      console.log('No file selected');
      return;
    }

    this.loading = true;
    const formData = new FormData();

    formData.append('file', this.selectedFile);

    let projectId: any = this.excelUploadForm.value.project_id;
    if (Array.isArray(projectId)) {
      projectId = projectId[0];
    }

    if (projectId) {
      formData.append('project_id', projectId.toString());
    }

    if (this.userId) {
      formData.append('created_by', this.userId.toString());
      formData.append('user_id', this.userId.toString());
    }

    for (const pair of (formData as any).entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

    this.http
      .post(`${this.baseUrl}/${'update_floor_unit'}`, formData)
      .subscribe({
        next: (res: any) => {
          this.dialog.open(SuccessDialogComponent, {
            autoFocus: false,
            data: { message: res.message },
          });
          this.dialogRef.close(res?.success || false);
        },
        error: (err: any) => {
          console.error('Error:', err);
          this.dialogRef.close(false);
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
