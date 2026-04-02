import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-add-token',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-token.component.html',
  styleUrl: './add-token.component.scss',
})
export class AddTokenComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
 
  projectsList: any[] = [];
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddTokenComponent> // Reference to the dialog
  ) {}
  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllprojectsList();
  }

  addTokenTypeForm = new FormGroup({
    user_id: new FormControl(this.userId),
    project_id: new FormControl(this.data?.rowData?.project_id),
    token_type: new FormControl(this.data?.rowData?.token_type),
        token_start_no: new FormControl(this.data?.rowData?.token_start_no),

    enforced_flat_selection: new FormControl(
      !!this.data?.rowData?.enforced_flat_selection
    ),
    is_highest: new FormControl(!!this.data?.rowData?.is_highest),
    amount: new FormControl(this.data?.rowData?.amount),

    active_status_id: new FormControl(this.data?.rowData?.active_status_id),
    token_type_id: new FormControl(this.data?.rowData?.token_type_id),
    updated_by: new FormControl(this.userId),
  });

  fetchAllprojectsList(): void {
    this.http.get(`${this.baseUrl}/project_dropdown`).subscribe({
      next: (res: any) => {
        this.projectsList = res;
      },
      error: (err: any) => {
        console.error(err);

        this.snackBar.open('Unable to fetch Tokens.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  

  onSubmit(): void {
    let formData = {
      ...this.addTokenTypeForm.value,
      enforced_flat_selection: this.addTokenTypeForm.value
        .enforced_flat_selection
        ? 1
        : 0,
      is_highest: this.addTokenTypeForm.value.is_highest ? 1 : 0,
    };

    if (this.data?.rowData?.token_type_id) {
      formData = {
        ...formData,
        token_type_id: this.data.rowData.token_type_id,
        updated_by: this.userId, // Assuming userId represents the current user
      };
    }

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
