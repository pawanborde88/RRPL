import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../../../../environments/environment';
import { AddUpdateAddressDialogComponent } from '../add-update-address-dialog/add-update-address-dialog.component';
import { NoDataErrorMessageComponent } from '../../../../no-data-error-message/no-data-error-message.component';

@Component({
  selector: 'app-address-card-view',
  standalone: true,
  imports: [
    AngularMaterialModule,
    AngularMaterialModule,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NoDataErrorMessageComponent,
    FormsModule,
  ],
  templateUrl: './address-card-view.component.html',
  styleUrl: './address-card-view.component.scss',
})
export class AddressCardViewComponent implements OnInit {
  constructor(public dialog: MatDialog, private http: HttpClient) {}

  @Input() EmployeeID!: string | number;

  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;

  applicantAddresses: any[] = [];
  ngOnInit(): void {
   console.log(this.EmployeeID );
   if(this.EmployeeID){
    this.fetchApplicantAddress();
    console.log( this.applicantAddresses );
   }
 }


  fetchApplicantAddress() {
    debugger
    const url = `${this.baseUrl}/employee_address_details`;
    const requestBody = {
      employee_id: this.EmployeeID,
    };

    this.http.post(url, requestBody).subscribe({
      next: (response: any) => {
        console.log(response);
        this.applicantAddresses = response;
      },
      error: (error) => {
        console.error(error);

      },
      complete: () => {

      },
    });
  }


  openAddressDialog(action: string): void {
    const dialogRef = this.dialog.open(AddUpdateAddressDialogComponent, {
      data: {
        title: action === 'add' ? 'Add Address' : 'Update Address',
        apiUrl: action === 'add' ? 'add_employee_address' : 'update_employee_address',
        successMessage: action === 'add' ? 'Address added successfully' : 'Address updated successfully',
        onUploadComplete: this.applicantAddresses[0],
      },
    });

    dialogRef.disableClose = true;

    dialogRef.afterClosed().subscribe((result) => {
      debugger
      if (result && result.success) {
        console.log('Dialog closed with result:', result);
        this.fetchApplicantAddress();
      } else {
        console.log('Dialog closed without a successful result.');
      }
    });
  }





}
