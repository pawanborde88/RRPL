import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';

@Component({
  selector: 'app-add-sources',
  standalone: true,
 imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-sources.component.html',
  styleUrl: './add-sources.component.scss'
})
export class AddSourcesComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddSourcesComponent> // Reference to the dialog
  ) {}
  ngOnInit(): void {
    console.log(this.data);
  }

  addSourceForm = new FormGroup({
    user_id: new FormControl(this.userId), // Default userId if no rowData
    source: new FormControl( this.data?.rowData?.source), // Default userId if no rowData
    active_status_id: new FormControl(
      this.data?.rowData?.active_status_id || null
    ),
    source_id: new FormControl(
      this.data?.rowData?.source_id || null
    ),
  });

  onSubmit(): void {
    const formData = this.addSourceForm.value;

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
