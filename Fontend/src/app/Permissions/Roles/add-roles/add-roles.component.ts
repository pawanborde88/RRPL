
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'app-add-roles',
  standalone: true,
  imports: [
    AngularMaterialModule,

    ReactiveFormsModule,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './add-roles.component.html',
  styleUrl: './add-roles.component.scss'
})
export class AddRolesComponent {
  pipe = new DatePipe('en-US');

  // URls
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  storageUrl = environment.STORAGE_URL;
  loadingState: boolean = false;

  roleId = sessionStorage.getItem('role_id');

  ngOnInit(): void {
    console.log(this.data.rowData);
    if (this.data.rowData) {
      this.fetchSingleModule(this.data.rowData);
    }
  }

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddRolesComponent> // Reference to the dialog
  ) { }

  addPermissionForm = new FormGroup({
    role_name: new FormControl('', [Validators.required]),
    active_status_id: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    account_id: new FormControl(sessionStorage.getItem('account_id')),
    created_by: new FormControl(sessionStorage.getItem('session_id')),
    role_id: new FormControl(''),
  },);

  fetchSingleModule(roleID: any) {
    this.snackBar.open('Loading...', undefined, { duration: undefined });

    let obj = { account_id: sessionStorage.getItem('account_id'), role_id: roleID };

    this.http.post(`${this.baseUrl}/fetch_single_role`, obj)
      .subscribe({
        next: (res: any) => {
          this.addPermissionForm.patchValue({
            role_name: res.role_name,
            active_status_id: res.active_status_id,
            description: res.description,
            role_id: res.role_id
          });

        }, error: (err: any) => {
          console.log(err);
          this.snackBar.open('Error occurred while fetching data, please try later');
        }, complete: () => {
          this.snackBar.dismiss();
        }
      })

  }



  onSubmit(): void {
    if (this.addPermissionForm.invalid) {
      return;
    }

    const formData = this.addPermissionForm.value;
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
