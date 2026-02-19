import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';

@Component({
  selector: 'app-add-floor-units',
  standalone: true,
   imports: [
     CommonModule,
     RouterModule,
     TemplateComponent,
     BreadcrumbComponent,
     AngularMaterialModule,
     FormsModule,
     ReactiveFormsModule,
     TruncatePipe, // Add the pipe here
   ],
  templateUrl: './add-floor-units.component.html',
  styleUrl: './add-floor-units.component.scss',
})
export class AddFloorUnitsComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  projectsList: any[] = [];
  allWingslist: any[] = [];
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddFloorUnitsComponent> // Reference to the dialog
  ) {}
  addFloorUnit = new FormGroup({
    user_id: new FormControl(this.data?.rowData?.user_id || this.userId), // Default userId if no rowData
  
    floor_unit_id: new FormControl(this.data?.rowData?.floor_unit_id || null),
    project_id: new FormControl(
      this.data?.rowData?.project_id ,
      Validators.required
    ), // Default project_id
    wing_id: new FormControl(), // Default wing
    floor_unit: new FormControl(
      this.data?.rowData?.floor_unit,
      Validators.required
    ), // Default floor unit
    active_status_id: new FormControl(
      this.data?.rowData?.active_status_id,
      Validators.required
    ), // Default active status
  });
  ngOnInit(): void {
    if (this.data?.for === 'floor-unit') {
      // safe to access properties
    }
    console.log(this.data);
    this.fetchAllProjects();

    this.addFloorUnit.get('project_id')?.valueChanges.subscribe((projectID) => {
      if (projectID) {
        this.fetchAllWings(projectID);
      }
    });
  }


  fetchAllProjects(): void {

    this.http.post(`${this.baseUrl}/fetch_projects`, {}).subscribe({
      next: (res: any) => {
        this.projectsList = res;
      
      },
      error: () => {
     
        this.snackBar.open('Unable to fetch project details.', 'Close', { duration: 3000 });
      },
    });
  }

fetchAllWings(projectID: number): void {

    this.http.post(`${this.baseUrl}/wing_dropdown`, {project_id: projectID}).subscribe({
      next: (res: any) => {
        this.allWingslist = res;
      
      },
      error: () => {
     
        this.snackBar.open('Unable to fetch project details.', 'Close', { duration: 3000 });
      },
    });
  }





  onSubmit(): void { 
    // Retrieve the form values
    const formData = {
      ...this.addFloorUnit.value, // Spread the existing form values
      updated_by: this.userId,    // Add updated_by
      user_id: this.userId,       // Ensure user_id is set to the current userId
    };
  
    // Initialize the apiUrl from the passed data
    const apiUrl = this.data.apiUrl;
  
    // Send the request
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (response) => {
        console.log('Response:', response);
        this.snackBar.open(this.data.successMessage, 'Close', {
          duration: 3000,
        });
        this.dialogRef.close(true); // Close the dialog and notify the parent component
      },
      (error) => {
        // Handle error response
        console.error('Error:', error);
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }
  
}
