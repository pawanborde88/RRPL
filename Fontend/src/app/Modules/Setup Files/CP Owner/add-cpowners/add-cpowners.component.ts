import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-add-cpowners',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-cpowners.component.html',
  styleUrl: './add-cpowners.component.scss'
})
export class AddCPOwnersComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allChannelPartnerList: any[] = [];
  pipe = new DatePipe('en-US');
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddCPOwnersComponent> // Reference to the dialog
  ) { }
  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllChannelPartner();
  }

  addCPOwnerForm = new FormGroup({
    role_id: new FormControl(5),

    first_name: new FormControl(this.data?.rowData?.first_name || '', Validators.required),
    last_name: new FormControl(this.data?.rowData?.last_name || '', Validators.required),
    user_email: new FormControl(this.data?.rowData?.user_email || '', [Validators.required, Validators.email]),
    user_phone: new FormControl(this.data?.rowData?.user_phone || '', [
      Validators.required,
      Validators.pattern(/^[6-9]\d{9}$/), // Example: Indian mobile number validation
    ]),
    dob: new FormControl(this.data?.rowData?.dob || ''),
    gender: new FormControl(this.data?.rowData?.gender),
    pan_no: new FormControl(this.data?.rowData?.pan_no || ''),
    address: new FormControl(this.data?.rowData?.address || 1),
    city: new FormControl(this.data?.rowData?.city || ''),
    country: new FormControl(this.data?.rowData?.country || 'India'),
    state: new FormControl(this.data?.rowData?.state || ''),
    pin_code: new FormControl(this.data?.rowData?.pin_code || ''),
    password: new FormControl(this.data?.rowData?.password || ''),
    rera: new FormControl(this.data?.rowData?.rera || ''),
    aadhar_no: new FormControl(this.data?.rowData?.aadhar_no || ''),
    channel_partner_id: new FormControl(this.data?.rowData?.channel_partner_id, Validators.required),
    updated_by: new FormControl(this.data?.rowData?.created_by || this.userId),
    user_id: new FormControl(
      this.data?.rowData?.user_id || null
    ),// Assuming you will set this value dynamically

  });

  fetchAllChannelPartner(): void {
    this.http.get<any[]>(`${this.baseUrl}/fetch_all_channel_partner`).subscribe({
      next: (res) => {
        this.allChannelPartnerList = res;
      },
      error: () => {
        this.snackBar.open('Unable to fetch cities.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  onSubmit(): void {
    // Get the form data
    const formData = { ...this.addCPOwnerForm.value }; // Create a copy to avoid directly mutating the form

    // Format the dob field
    formData.dob = formData.dob ? this.pipe.transform(formData.dob, 'yyyy-MM-dd') : null;

    // Initialize the apiUrl from the passed data
    const apiUrl = this.data.apiUrl;

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
