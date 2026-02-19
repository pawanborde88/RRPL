import { Component, Inject, OnInit } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddChannelPartnerComponent } from '../../../Channel Partner/add-channel-partner/add-channel-partner.component';

@Component({
  selector: 'app-add-deal-value',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-deal-value.component.html',
  styleUrl: './add-deal-value.component.scss',
})
export class AddDealValueComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allPriceList: any[] = []; // Will hold project data
  allvalueList:any[]=[]
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddChannelPartnerComponent> // Reference to the dialog
  ) {}
  ngOnInit(): void {
    this.fetchAllPrices();
    this.fetchAllValues();
  }

  addDealValueForm = new FormGroup({
    created_by: new FormControl(this.userId),
    price_id: new FormControl(this.data.projectid),
    project_id: new FormControl(this.data.projectid),
    price_from: new FormControl(this.data?.rowData?.price_from),
    price_till: new FormControl(this.data?.rowData?.price_till),
    extra_bonus: new FormControl(this.data?.rowData?.valid_from),
    value: new FormControl(this.data?.rowData?.value),
    value_unit_id: new FormControl(this.data?.rowData?.value_unit_id),
    valid_till: new FormControl(this.data?.rowData?.valid_till),
    valid_from: new FormControl(this.data?.rowData?.valid_from),
  });

  fetchAllPrices(): void {
    this.http
      .get(`${this.baseUrl}/price_dropdown`)
      .subscribe({
        next: (res: any) => {
          this.allPriceList = res;
        },
        error: (err: any) => {
          console.error(err);

          this.snackBar.open('Unable to fetch Site Visits.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  fetchAllValues(): void {
    this.http
      .get(`${this.baseUrl}/brokerage_value_unit_dropdown`)
      .subscribe({
        next: (res: any) => {
          this.allvalueList = res;
        },
        error: (err: any) => {
          console.error(err);

          this.snackBar.open('Unable to fetch Site Visits.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  onSubmit() {
    const { apiUrl, successMessage } = this.data;
    const formData = new FormData();
    
    // Append single fields
    formData.append('project_id', this.addDealValueForm.get('project_id')?.value);
    formData.append('valid_from', new Date(this.addDealValueForm.get('valid_from')?.value).toISOString().split('T')[0]);
    formData.append('valid_till', new Date(this.addDealValueForm.get('valid_till')?.value).toISOString().split('T')[0]);
    formData.append('created_by', this.userId.toString());
    
    // Append array fields
    const fields = ['price_from', 'value','value_unit_id', 'price_till', 'price_id', 'extra_bonus'];
    let indexedValues: { [key: string]: any[] } = {};
  
    fields.forEach(field => {
      indexedValues[field] = [];
    });
  
    const formValues: { [key: string]: any } = this.addDealValueForm.value;
    Object.keys(formValues).forEach((key) => {
      if (fields.includes(key)) {
        indexedValues[key].push(formValues[key]);
      }
    });
    
    Object.keys(indexedValues).forEach((key) => {
      indexedValues[key].forEach((value, index) => {
        formData.append(`${key}[${index}]`, value);
      });
    });
  
    // Send HTTP request with FormData
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      () => {
        this.snackBar.open(successMessage, 'Close', { duration: 3000 });
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
