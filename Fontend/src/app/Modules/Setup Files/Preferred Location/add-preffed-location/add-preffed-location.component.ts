import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AssignLeadsComponent } from '../../Projects/Leads/assign-leads/assign-leads.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-add-preffed-location',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-preffed-location.component.html',
  styleUrl: './add-preffed-location.component.scss'
})
export class AddPreffedLocationComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  allTelecallerlist: any[] = [];
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddPreffedLocationComponent> // Reference to the dialog
  ) {}
  ngOnInit(): void {
    console.log(this.data);
  }

 
  addPreffedLocation = new FormGroup({
    preferred_location: new FormControl(this.data?.rowData?.preferred_location),
    preferred_location_id: new FormControl(this.data?.rowData?.preferred_location_id),
    updated_by: new FormControl(this.userId),
    created_by: new FormControl(this.userId),
  });
  
  onSubmit(): void {
    const payload = { ...this.addPreffedLocation.value }; // Extract form values
  
    const { apiUrl, successMessage } = this.data;
  
    if (this.data?.rowData?.preferred_location_id) {
      payload.preferred_location_id = this.data.rowData.preferred_location_id;
      payload.updated_by = this.userId;

    }
  
    this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe(
      (res:any) => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
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
  
}
