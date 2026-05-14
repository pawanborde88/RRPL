import { CommonModule, formatDate } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AddCPOwnersStore } from './add-cpowners.store';
import { AadharcardNoformatDirective } from '../../../../Common/directives/Aadhar/aadharcard-noformat.directive';
import { PANNoDirective } from '../../../../Common/directives/panno.directive';
import { BookingCalculationsStateService } from '../../Site Visit/Bookings/booking-calculations/services/booking-calculations.state.service';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-add-cpowners',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    AadharcardNoformatDirective,
    PANNoDirective,
    AutocompleteReusableComponent
  ],
  templateUrl: './add-cpowners.component.html',
  styleUrl: './add-cpowners.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AddCPOwnersStore, BookingCalculationsStateService] // Encapsulated component-level state
})
export class AddCPOwnersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly dialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AddCPOwnersComponent>);
  private readonly snackBar = inject(MatSnackBar);
  readonly store = inject(AddCPOwnersStore);
  private readonly stateService = inject(BookingCalculationsStateService);

  readonly roleId = Number(sessionStorage.getItem('role_id'));
  readonly userId = Number(sessionStorage.getItem('session_id'));
  readonly allChannelPartnerList = this.stateService.channelPartners;

  readonly addCPOwnerForm = this.fb.group({
    role_id: [5],
    first_name: [this.dialogData?.rowData?.first_name || '', Validators.required],
    last_name: [this.dialogData?.rowData?.last_name || '', Validators.required],
    user_email: [this.dialogData?.rowData?.user_email || '', [Validators.required, Validators.email]],
    user_phone: [this.dialogData?.rowData?.user_phone || '', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    dob: [this.dialogData?.rowData?.dob || ''],
    gender: [this.dialogData?.rowData?.gender ?? null],
    pan_no: [this.dialogData?.rowData?.pan_no || ''],
    address: [this.dialogData?.rowData?.address || ''],
    city: [this.dialogData?.rowData?.city || ''],
    country: [this.dialogData?.rowData?.country || 'India'],
    state: [this.dialogData?.rowData?.state || 'Maharashtra'],
    pin_code: [this.dialogData?.rowData?.pin_code || '', Validators.pattern(/^[0-9]{6}$/)],
    password: [this.dialogData?.rowData?.password || ''],
    aadhar_no: [this.dialogData?.rowData?.aadhar_no || ''],
    channel_partner_id: [this.dialogData?.rowData?.channel_partner_id ?? null, Validators.required],
    updated_by: [this.dialogData?.rowData?.created_by || this.userId],
    user_id: [this.dialogData?.rowData?.user_id ?? null]
  });

  ngOnInit(): void {
    console.log(this.dialogData?.rowData);
    if (this.dialogData?.rowData) {
      this.onPartnerSearch('', true, this.dialogData?.rowData.channel_partner_id);
    }

  }

  sanitizeMobileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      const sanitized = input.value.replace(/[^0-9]/g, '').slice(0, 10);
      this.addCPOwnerForm.get('user_phone')?.setValue(sanitized, { emitEvent: true });
    }
  }

  sanitizePinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      const sanitized = input.value.replace(/[^0-9]/g, '').slice(0, 6);
      this.addCPOwnerForm.get('pin_code')?.setValue(sanitized, { emitEvent: true });
    }
  }
  onPartnerSearch(
    searchText: string,
    loadInitialData = false,
    initialPartnerId?: any
  ): void {
    const trimmedSearch = searchText.trim();

    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.stateService.fetchChannelPartners();
      return;
    }

    this.stateService.fetchChannelPartners(
      loadInitialData ? undefined : trimmedSearch,
      loadInitialData ? initialPartnerId || this.addCPOwnerForm.value.channel_partner_id : undefined
    );
  }
  onSubmit(): void {
    if (this.addCPOwnerForm.invalid) return;

    const formData = this.addCPOwnerForm.getRawValue();
    const formattedDob = formData.dob ? formatDate(formData.dob, 'yyyy-MM-dd', 'en-US') : null;

    const payload = {
      ...formData,
      dob: formattedDob
    };

    const apiUrl = this.dialogData.apiUrl;

    this.store.saveCPOwner(apiUrl, payload).subscribe({
      next: () => {
        this.snackBar.open(this.dialogData.successMessage || 'Saved successfully.', 'Close', {
          duration: 3000,
        });
        this.dialogRef.close(true);
      }
    });
  }
}
