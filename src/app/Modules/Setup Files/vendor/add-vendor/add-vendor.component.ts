import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-add-vendor',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-vendor.component.html',
  styleUrl: './add-vendor.component.scss'
})
export class AddVendorComponent implements OnInit {
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  baseUrl = environment.API_URL;
  loading = false; 
  addVendorForm = new FormGroup({
    vendor_name: new FormControl('', Validators.required),
    contact_person_name: new FormControl('', Validators.required),
    contact_no: new FormControl('', Validators.required),
    status_id: new FormControl('', Validators.required),
    updated_by: new FormControl(this.userId),


    gst_number: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[A-Z]{1}[A-Z0-9]{1}$/)
    ])
  });
  


  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
       @Inject(MAT_DIALOG_DATA) public data: { item: any }, 
        private dialogRef: MatDialogRef<AddVendorComponent>
  ) {}
  ngOnInit(): void {
    if(this.data?.item?.vendor_id){
      this.fetchSingleVendors();

    }
  }

  fetchSingleVendors(): void {
    // Check if vendor_id exists in data to fetch specific vendor
    if (this.data?.item?.vendor_id) {
      const payload = { vendor_id: this.data.item.vendor_id }; // Pass vendor_id in the request
  
      this.http.post(`${this.baseUrl}/fetch_single_vendor`, payload).subscribe({
        next: (res: any) => {
          if (res) {
            // Assuming 'res.data' contains the vendor data returned from the API
            // Patch the form with the data from the API response
            this.addVendorForm.patchValue({
              vendor_name: res.vendor_name || '',
              contact_person_name: res.contact_person_name || '',
              contact_no: res.contact_no || '',
              status_id: res.status_id || '',
              gst_number: res.gst_number || '',
            });
          } else {
            this.snackBar.open('Invalid data received from server.', 'Close', {
              duration: 3000,
            });
          }
        },
        error: (err: any) => {
          console.error('Error fetching vendor details:', err);
          this.snackBar.open('Unable to fetch vendor details.', 'Close', {
            duration: 3000,
          });
        },
      });
    } 
    
  }
  
  onSubmit(): void {
    // Clone form data and allow dynamic properties
    const formData = { ...this.addVendorForm.value };
  
    console.log('Form Data:', formData);
  
    // Retrieve user_id from sessionStorage (or use the one already stored in the class)
    const userId = this.userId;
  
    // Create the request payload with dynamic properties
    const requestPayload: Record<string, any> = {
      ...formData, // Spread the form data
      user_id: userId // Add user_id to the request payload, but not in formData
    };
  
    this.loading = true;
  
    // Add vendor_id if editing an existing vendor
    if (this.data?.item?.vendor_id) {
      requestPayload['vendor_id'] = this.data.item.vendor_id;
    }
  
    // Determine the correct endpoint for add or edit operation
    const apiEndpoint = this.data?.item?.vendor_id
      ? `${this.baseUrl}/edit_vendor`
      : `${this.baseUrl}/add_vendor`;
  
    // Make the API request to save the vendor data
    this.http.post(apiEndpoint, requestPayload).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Vendor saved successfully:', response);
  
        // Success message depending on whether it's an update or add operation
        const successMessage = this.data?.item?.vendor_id
          ? 'Vendor updated successfully!'
          : 'Vendor added successfully!';
        this.snackBar.open(successMessage, 'Close', {
          duration: 3000,
        });
  
        // Close the dialog and pass success flag
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error saving vendor:', err);
        this.snackBar.open('Failed to save vendor.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  
  
}
