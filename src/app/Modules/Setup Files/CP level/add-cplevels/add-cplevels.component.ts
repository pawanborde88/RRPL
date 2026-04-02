import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { QuillModule } from 'ngx-quill';

@Component({
  selector: 'app-add-cplevels',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    QuillModule,
  ],
  templateUrl: './add-cplevels.component.html',
  styleUrl: './add-cplevels.component.scss',
})
export class AddCPLevelsComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddCPLevelsComponent> // Reference to the dialog
  ) {}
  ngOnInit(): void {
    console.log(this.data);
  }

  addCPLevelsForm = new FormGroup({
    user_id: new FormControl(this.userId), // Assuming you will set this value dynamically

    cp_type: new FormControl(this.data?.rowData?.cp_type), // Assuming you will set this value dynamically
    description: new FormControl(this.data?.rowData?.description), 
    active_status_id: new FormControl(
      this.data?.rowData?.active_status_id || null
    ),//
    cp_type_id: new FormControl(
      this.data?.rowData?.cp_type_id || null
    ),// Assuming you will set this value dynamically
  });

  onSubmit(): void {
    const formData = this.addCPLevelsForm.value;

    // Initialize the apiUrl from the passed data
    let apiUrl = this.data.apiUrl;

    // Send the request
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (response) => {
        console.log(response);
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
