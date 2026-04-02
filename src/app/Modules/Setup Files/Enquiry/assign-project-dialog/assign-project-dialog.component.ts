import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-assign-project-dialog',
  standalone: true,
   imports: [
     CommonModule,
     RouterModule,
     AngularMaterialModule,
     FormsModule,
     ReactiveFormsModule,
     AutocompleteReusableComponent,
   ],
  templateUrl: './assign-project-dialog.component.html',
  styleUrl: './assign-project-dialog.component.scss'
})
export class AssignProjectDialogComponent {
 baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
roleId = Number(sessionStorage.getItem('role_id'));
userId = Number(sessionStorage.getItem('session_id'));
pipe = new DatePipe('en-US');
allTelecallerlist: any[] = [];
allSalesExecutive: any[] = [];
projectsList: any[] = [];

constructor(
  private http: HttpClient,
  private dialog: MatDialog,
  private snackBar: MatSnackBar,
  @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
  private dialogRef: MatDialogRef<AssignProjectDialogComponent> // Reference to the dialog
) {}

ngOnInit(): void {
  console.log(this.data);
  this.fetchAllProjects();


}

leadAssignForm = new FormGroup({
  project_lead_id: new FormControl(
    this.data.rowData?.map(
      (item: { project_lead_id: any }) => item.project_lead_id
    ) || []
  ),
  project_enq_id: new FormControl(
    this.data.rowData?.map(
      (item: { project_enq_id: any }) => item.project_enq_id
    ) || []
  ),
  sales_executive_id: new FormControl(null),
  project_id: new FormControl(
    // Get the first element if it's an array, or use the value directly
    Array.isArray(this.data.rowData[0].project_id) 
      ? this.data.rowData[0].project_id[0] 
      : this.data.rowData[0].project_id
  ),  updated_by: new FormControl(this.userId),
  telecaller_id: new FormControl(null, Validators.required), // Make it required
  user_id: new FormControl(),
});




onSubmit(): void {
  const { apiUrl, successMessage, for: actionFor } = this.data;

  let payload: any;

  if (actionFor === 'leadAssign') {
    payload = {
      project_id: this.leadAssignForm.get('project_id')?.value,
      project_enq_id: this.leadAssignForm.get('project_enq_id')?.value,
      sales_executive_id: this.leadAssignForm.get('sales_executive_id')?.value,
      updated_by: this.userId,
    };
  } else {
    payload = {
      project_id: this.leadAssignForm.get('project_id')?.value,
      project_lead_id: this.leadAssignForm.get('project_lead_id')?.value,
      telecaller_id: this.leadAssignForm.get('telecaller_id')?.value,
    };
  }

  this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe(
    (res: any) => {
      this.dialog.open(SuccessDialogComponent, {
        autoFocus: false,
        data: { message: res.message },
      });
      this.dialogRef.close(true);
    },
    () => {
      this.snackBar.open('Something went wrong. Please try again.', 'Close', {
        duration: 3000,
      });
    }
  );
}

fetchAllProjects(): void {
  const payload = {
    user_id:  this.userId,
  };

  this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
    next: (res: any) => {
      if (res) {
        this.projectsList = res;
      }
    },
    error: (err: any) => {
      console.error(err);
      this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
        duration: 3000,
      });
    },
  });
}

}
