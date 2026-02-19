import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { AddAminitiesComponent } from '../Aminities/add-aminities/add-aminities.component';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';

@Component({
  selector: 'app-brokerage-images',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './brokerage-images.component.html',
  styleUrl: './brokerage-images.component.scss',
})
export class BrokerageImagesComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  selectedFile: File | null = null; // To handle file uploads
  allConfiguration: any[] = [];
  allcpList: any[] = [];
  allProjectPhases: any[] = [];

  pipe = new DatePipe('en-US');
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<BrokerageImagesComponent> // Reference to the dialog
  ) { }
  selectedFiles: any[] = [];

  ngOnInit(): void {
    console.log(this.data.projectid);
    this.fetchConfidropdwon();
    this.fetchCPtypes();
    this.fetchAllPhases();
  }
  addBrokerageOfferImages = new FormGroup({
    project_id: new FormControl(this.data.projectid),
    phase_id: new FormControl(this.data?.phaseID || this.data?.rowData?.phase_id),
    project_config_id: new FormControl(this.data?.rowData?.project_config_id), // Uncommented
    cp_type_id: new FormControl(this.data.cpTypeID),
    valid_from: new FormControl(this.data?.rowData?.valid_from),
    valid_till: new FormControl(this.data?.rowData?.valid_till),
    active_status_id: new FormControl(this.data?.rowData?.active_status_id),
    brokerage_slab_image: new FormControl(null),
    created_by: new FormControl(this.userId),
  });

  selectFile(event: any): void {
    const files = event.target.files;
    if (files.length) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.selectedFiles.push({
            file: file,
            preview: e.target.result // Set preview URL
          });
        };
        reader.readAsDataURL(file);
      }
    }
  }

  onSubmit(): void {
    const formData = new FormData();
    const formValues = this.addBrokerageOfferImages.value as { [key: string]: any };

    // Append non-null values except brokerage_slab_image
    Object.entries(formValues).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'valid_from' || key === 'valid_till') {
          // Format date as MM/dd/yyyy before appending
          const formattedDate = this.pipe.transform(value, 'MM/dd/yyyy') || '';
          formData.append(key, formattedDate);
        } else {
          formData.append(key, value);
        }
      }
    });

    // Append files separately
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((fileObj, index) => {
        formData.append('brokerage_slab_image', fileObj.file, fileObj.file.name);
      });
    }

    this.http.post(`${this.baseUrl}/${this.data.apiUrl}`, formData).subscribe(
      () => {
        this.snackBar.open(this.data.successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', { duration: 3000 });
      }
    );
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  fetchConfidropdwon(): void {
    this.http.post(`${this.baseUrl}/config_dropdown`, { project_id: this.data.projectid, phase_id: this.data?.phaseID, }).subscribe({
      next: (res: any) => (this.allConfiguration = res),
      error: () =>
        this.snackBar.open('Unable to fetch CP type.', 'Close', {
          duration: 3000,
        }),
    });
  }
  fetchCPtypes(): void {
    this.http.get(`${this.baseUrl}/cp_type_dropdown`).subscribe({
      next: (res: any) => (this.allcpList = res),
      error: () =>
        this.snackBar.open('Unable to fetch CP type.', 'Close', {
          duration: 3000,
        }),
    });
  }
  fetchAllPhases(): void {
    this.http.post(`${this.baseUrl}/fetch_phases`, { project_id: this.data.projectid, }).subscribe({
      next: (res: any) => (this.allProjectPhases = res),
      error: () =>
        this.snackBar.open('Unable to fetch CP type.', 'Close', {
          duration: 3000,
        }),
    });
  }


}
