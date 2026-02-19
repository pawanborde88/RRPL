import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { SnackbarService } from '../../../../../../Service/snackbar.service';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';

@Component({
  selector: 'app-add-update-address-dialog',
  standalone: true,
  imports: [AngularMaterialModule, CommonModule, ReactiveFormsModule],
  templateUrl: './add-update-address-dialog.component.html',
  styleUrls: ['./add-update-address-dialog.component.scss']
})
export class AddUpdateAddressDialogComponent implements OnInit {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  uploading = false;
  makeReadonly = false;
  apiUrl: string;
  successMessage: string;
  updateData: any;
  title: string;
  addressForm!: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<AddUpdateAddressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackbarService: SnackbarService
  ) {
    this.title = data.title || '';
    this.apiUrl = data?.apiUrl || '';
    this.successMessage = data?.successMessage || 'Address saved successfully!';
    this.updateData = data?.onUploadComplete || [];
    this.initializeAddressForm(this.updateData); // Initialize the form
  }

  ngOnInit(): void {
    console.log(this.data);
  }

  // Centralized method to initialize or reset the form
  initializeAddressForm(data: any = {}): void {
    this.addressForm = new FormGroup({
      employee_id: new FormControl(data?.employee_id || ''),
      current_address_1: new FormControl(data?.current_address_1 || ''),
      current_address_2: new FormControl(data?.current_address_2 || ''),
      permanent_address_1: new FormControl(data?.permanent_address_1 || '', Validators.required),
      permanent_address_2: new FormControl(data?.permanent_address_2 || ''),
      current_state: new FormControl(data?.current_state || ''),
      current_city: new FormControl(data?.current_city || ''),
      current_country: new FormControl(data?.current_country || ''),
      current_pin: new FormControl(data?.current_pin || '', [
        Validators.required,
        Validators.pattern('^[0-9]*$')
      ]),
      permanent_country: new FormControl(data?.permanent_country || '', Validators.required),
      permanent_city: new FormControl(data?.permanent_city || ''),
      permanent_state: new FormControl(data?.permanent_state || ''),
      permanent_pin: new FormControl(data?.permanent_pin || '', [
        Validators.required,
        Validators.pattern('^[0-9]*$')
      ])
    });
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.snackbarService.showDataSnackbar('Please fill out all required fields.');
      return;
    }

    this.uploading = true;
    const url = `${this.baseUrl}/${this.apiUrl}`;
    const body = this.addressForm.value;

    this.http.post(url, body).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.data.onUploadComplete().then(() => {
            this.snackbarService.showDataSnackbar(this.successMessage);
          });
        } else {
          this.snackbarService.showDataSnackbar('An error occurred, please try again.');
        }
      },
      error: () => {
        this.snackbarService.showDataSnackbar('An error occurred, please try again.');
      },
      complete: () => {
        this.uploading = false;
        this.dialogRef.close({ success: true, data: this.addressForm.value });
      }
    });
  }

  copyCurrentAddressToPermanent(event: any): void {
    if (event.checked) {
      const currentAddress = this.addressForm.value;
      this.makeReadonly = true;

      this.addressForm.patchValue({
        permanent_address_1: currentAddress.current_address_1,
        permanent_address_2: currentAddress.current_address_2,
        permanent_country: currentAddress.current_country,
        permanent_city: currentAddress.current_city,
        permanent_state: currentAddress.current_state,
        permanent_pin: currentAddress.current_pin
      });

      // Disable permanent address fields
      this.setPermanentAddressControlsState(false);
    } else {
      this.makeReadonly = false;

      this.addressForm.patchValue({
        permanent_address_1: '',
        permanent_address_2: '',
        permanent_country: '',
        permanent_city: '',
        permanent_state: '',
        permanent_pin: ''
      });

      // Enable permanent address fields
      this.setPermanentAddressControlsState(true);
    }
  }

  // Helper method to enable or disable permanent address fields
  private setPermanentAddressControlsState(enable: boolean): void {
    const controls = [
      'permanent_address_1',
      'permanent_address_2',
      'permanent_country',
      'permanent_city',
      'permanent_state',
      'permanent_pin'
    ];

    controls.forEach(control => {
      if (enable) {
        this.addressForm.controls[control].enable();
      } else {
        this.addressForm.controls[control].disable();
      }
    });
  }
}
