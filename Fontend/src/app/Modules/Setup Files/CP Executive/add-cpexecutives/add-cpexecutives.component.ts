import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { BookingCalculationsStateService } from '../../Site Visit/Bookings/booking-calculations/services/booking-calculations.state.service';
import { AadharcardNoformatDirective } from '../../../../Common/directives/Aadhar/aadharcard-noformat.directive';
import { PANNoDirective } from '../../../../Common/directives/panno.directive';

@Component({
  selector: 'app-add-cpexecutives',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    AadharcardNoformatDirective,
    PANNoDirective
  ],
  providers: [BookingCalculationsStateService],
  templateUrl: './add-cpexecutives.component.html',
  styleUrls: ['./add-cpexecutives.component.scss'],
})
export class AddCPExecutivesComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allCities: any[] = [];
  allChannelPartnerList: any[] = [];
  allSubregions: any[] = [];
  storageUrl = environment.STORAGE_URL;
  private readonly stateService = inject(BookingCalculationsStateService);
  PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddCPExecutivesComponent>, // Reference to the dialog
    private cdr: ChangeDetectorRef
  ) { }

  private extractArrayIds(data: any, key: string): any[] {
    if (!data) return [];
    try {
      let parsed = typeof data === 'string' ? JSON.parse(data) : data;
      // If double encoded
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => (item && typeof item === 'object' && item[key]) ? item[key] : item);
      }
      return [parsed];
    } catch {
      return [data];
    }
  }

  addCpExecutiveForm = new FormGroup({
    role_id: new FormControl(this.data.title === 'Add CP Executive' ? 6 : 7),
    first_name: new FormControl(this.data?.rowData?.first_name),
    last_name: new FormControl(
      this.data?.rowData?.last_name || '',
      Validators.required
    ),
    user_email: new FormControl(this.data?.rowData?.user_email || '', [
      Validators.required,
      Validators.email,
    ]),
    dob: new FormControl(this.data?.rowData?.dob,),

    user_phone: new FormControl(this.data?.rowData?.user_phone, [
      Validators.required,
      Validators.pattern(/^[6789]\d{9}$/),
    ]), // For 10 digit phone number starting with valid Indian digits
    pan_no: new FormControl<string>(this.data?.rowData?.pan_no || '', [
      Validators.required,
      Validators.pattern(this.PAN_PATTERN)
    ]),
    address: new FormControl(
      this.data?.rowData?.address || '',

    ),
    country: new FormControl(
      this.data?.rowData?.country || 'India',

    ),
    state: new FormControl(
      this.data?.rowData?.state || 'Maharashtra',

    ),
    pin_code: new FormControl(this.data?.rowData?.pin_code || '', [
      Validators.required,
      Validators.pattern(/^[0-9]{6}$/), // 6-digit PIN code
    ]),
    password: new FormControl(this.data?.rowData?.password || ''),
    aadhar_no: new FormControl<string>(
      this.data?.rowData?.aadhar_no || '',
      [
        Validators.required,
        Validators.pattern(/^\d{4}-\d{4}-\d{4}$/)
      ]
    ),
    channel_partner_id: new FormControl(
      this.data?.rowData?.channel_partner_id || null,
      Validators.required
    ), // Static value for channel_partner_id
    city_id: new FormControl(
      this.extractArrayIds(this.data?.rowData?.city_id, 'city_id'),

    ),
    sub_region_id: new FormControl(
      this.extractArrayIds(this.data?.rowData?.sub_region_id, 'sub_region_id'),

    ),
    bank_account_no: new FormControl(this.data?.rowData?.bank_account_no || ''),
    account_name: new FormControl(this.data?.rowData?.account_name || ''),
    bank_type_id: new FormControl(this.data?.rowData?.bank_type_id || 1),
    bank_name: new FormControl(this.data?.rowData?.bank_name || ''),
    ifsc_code: new FormControl(this.data?.rowData?.ifsc_code || ''),
    branch_name: new FormControl(this.data?.rowData?.branch_name || ''),
    user_id: new FormControl(this.data?.rowData?.user_id || null),
  });

  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllCities();

    this.stateService.channelPartners$.subscribe((partners) => {
      setTimeout(() => {
        this.allChannelPartnerList = partners;
        this.cdr.markForCheck();
      });
    });

    const userId = this.data?.rowData?.user_id;
    if (userId) {
      this.fetchSingleCPExecutive(userId);
    } else {
      // Logic for Add mode or if data is already partially shared
      if (this.data?.rowData?.city_id) {
        this.fetchAllSubregions(this.data?.rowData?.city_id);
      }
      if (this.data?.rowData?.channel_partner_id) {
        this.onPartnerSearch('', true, this.data?.rowData?.channel_partner_id);
      }
    }

    this.addCpExecutiveForm
      .get('city_id')
      ?.valueChanges.subscribe((cityIds) => {
        if (Array.isArray(cityIds) && cityIds.length > 0) {
          this.fetchAllSubregions(cityIds);
        }
      });
  }

  fetchSingleCPExecutive(userId: number): void {
    const payload = { user_id: userId };
    this.http.post(`${this.baseUrl}/fetch_single_cp_executive`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          const executiveData = res; // Assuming the API returns the executive object directly

          // Prepare array fields
          const cityIds = this.extractArrayIds(executiveData.city_id, 'city_id');
          const subRegionIds = this.extractArrayIds(executiveData.sub_region_id, 'sub_region_id');

          // Patch form with fetched data
          this.addCpExecutiveForm.patchValue({
            ...executiveData,
            city_id: cityIds,
            sub_region_id: subRegionIds
          });

          // Fetch sub-regions for the patched city_ids
          if (cityIds && cityIds.length > 0) {
            this.fetchAllSubregions(cityIds);
          }

          // Search for partner firm to populate autocomplete
          if (executiveData.channel_partner_id) {
            this.onPartnerSearch('', true, executiveData.channel_partner_id);
          }

          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error fetching executive data:', err);
        this.snackBar.open('Failed to fetch executive details.', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  fetchAllCities(): void {
    this.http.get<any[]>(`${this.baseUrl}/city_dropdown`).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.allCities = res;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.snackBar.open('Unable to fetch cities.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllSubregions(cityIds: number[]): void {
    if (cityIds && cityIds.length > 0) {
      this.http
        .post<any[]>(`${this.baseUrl}/sub_region_dropdown`, {
          city_id: cityIds,
        })
        .subscribe({
          next: (res) => {
            setTimeout(() => {
              this.allSubregions = res; // Update subregions
              this.cdr.markForCheck();
            });
          },
          error: () => {
            this.snackBar.open('Unable to fetch sub-regions.', 'Close', {
              duration: 3000,
            });
          },
        });
    } else {
      this.snackBar.open('Please select at least one city.', 'Close', {
        duration: 3000,
      });
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
      loadInitialData ? initialPartnerId || this.addCpExecutiveForm.value.channel_partner_id : undefined
    );
  }

  sanitizePinCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      const sanitized = input.value.replace(/[^0-9]/g, '').slice(0, 6);
      this.addCpExecutiveForm.get('pin_code')?.setValue(sanitized, { emitEvent: true });
    }
  }

  onSubmit(): void {
    const formValues = this.addCpExecutiveForm.getRawValue();

    const expenseDate = formValues.dob;
    let formattedDate = '';
    if (expenseDate) {
      const dateObj = new Date(expenseDate);
      formattedDate = dateObj.toISOString().split('T')[0];
    }

    const payload: any = {
      ...formValues,
      dob: formattedDate,
      created_by: this.userId,
      updated_by: this.userId,
      user_id: this.data?.rowData?.user_id
    };

    // Ensure city_id and sub_region_id are arrays
    payload.city_id = Array.isArray(formValues.city_id) ? formValues.city_id : (formValues.city_id ? [formValues.city_id] : []);
    payload.sub_region_id = Array.isArray(formValues.sub_region_id) ? formValues.sub_region_id : (formValues.sub_region_id ? [formValues.sub_region_id] : []);

    const apiUrl = this.data.apiUrl;
    this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe(
      (response: any) => {
        this.dialog.open(SuccessDialogComponent, {
          data: { message: response.message },
        });
        this.dialogRef.close(true);
      },
      (error) => {
        console.error('Error:', error);
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }

}
