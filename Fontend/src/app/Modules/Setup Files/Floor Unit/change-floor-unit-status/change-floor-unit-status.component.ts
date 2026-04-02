import { Component, Inject, OnInit } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';

@Component({
  selector: 'app-change-floor-unit-status',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './change-floor-unit-status.component.html',
  styleUrl: './change-floor-unit-status.component.scss'
})
export class ChangeFloorUnitStatusComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  bookingStatusList: any[] = [];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<ChangeFloorUnitStatusComponent> // Reference to the dialog
  ) {}
  ngOnInit(): void {
    console.log(this.data);
    this.fetchBookingStatus();
  }

  addSourceForm = new FormGroup({
    booking_status_id: new FormControl(null, [Validators.required]), // Default userId if no rowData
    floor_unit_id: new FormControl( this.data?.rowData),
  });

  onSubmit(): void {
    const formData = this.addSourceForm.value;

    // Initialize the apiUrl from the passed data
    let apiUrl = "update_unit_status";

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
  fetchBookingStatus(): void {
    this.http
      .get(`${this.baseUrl}/fetch_booking_status`)
      .subscribe({
        next: (res: any) => {
          this.bookingStatusList = res.data  ; // Store wings list
          // Don't modify dataSource here - it's for floor/unit data only
        },
        error: () => {
          this.snackBar.open('Unable to fetch wings.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

}
