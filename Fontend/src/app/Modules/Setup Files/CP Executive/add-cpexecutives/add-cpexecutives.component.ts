import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-add-cpexecutives',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent
  ],
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
  selectedFile: File | null = null;
  imageSize: string | null = null;
  imagePreview: string | null = null;
  storageUrl = environment.STORAGE_URL;
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddCPExecutivesComponent> // Reference to the dialog
  ) {}

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
    dob: new FormControl(this.data?.rowData?.dob, Validators.required),

    user_phone: new FormControl(this.data?.rowData?.user_phone , [
      Validators.required,
      Validators.pattern(/^\d{10}$/),
    ]), // For 10 digit phone number
    pan_no: new FormControl(this.data?.rowData?.pan_no || '', [
      Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/), // PAN regex validation directly here
    ]),
    address: new FormControl(
      this.data?.rowData?.address || '',
      Validators.required
    ),
    country: new FormControl(
      this.data?.rowData?.country || 'India',
      Validators.required
    ),
    state: new FormControl(
      this.data?.rowData?.state || 'Maharashtra',
      Validators.required
    ),
    pin_code: new FormControl(this.data?.rowData?.pin_code || '', [
      Validators.required,
      Validators.pattern(/^\d{6}$/), // Assuming it's a 6-digit PIN code
    ]),
    password: new FormControl(
      this.data?.rowData?.password || '',
      Validators.required
    ),
    aadhar_no: new FormControl(this.data?.rowData?.aadhar_no || '', [
      Validators.required,
      Validators.pattern(/^\d{12}$/), // Aadhar number validation (12 digits)
    ]),
    channel_partner_id: new FormControl(
      this.data?.rowData?.channel_partner_id || ''
    ), // Static value for channel_partner_id
    city_id: new FormControl(
      this.data?.rowData?.city_id || [],
      Validators.required
    ),
    profile_image: new FormControl<File | null>(null),

    sub_region_id: new FormControl(
      this.data?.rowData?.sub_region_id || [],
      Validators.required
    ),
    user_id: new FormControl(this.data?.rowData?.user_id || null),
  });

  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllCities();

    if (this.data?.rowData?.city_id) {
      this.fetchAllSubregions(this.data?.rowData?.city_id);
    }

    this.addCpExecutiveForm
      .get('city_id')
      ?.valueChanges.subscribe((cityIds) => {
        if (Array.isArray(cityIds) && cityIds.length > 0) {
          this.fetchAllSubregions(cityIds); // Fetch subregions for selected cities
        }
      });
  }

  fetchAllCities(): void {
    this.http.get<any[]>(`${this.baseUrl}/city_dropdown`).subscribe({
      next: (res) => {
        this.allCities = res;
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
            this.allSubregions = res; // Update subregions
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

  onChangeFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      this.selectedFile = input.files[0];
      this.imageSize = `${(this.selectedFile.size / 1024).toFixed(2)} KB`;

      // Generate image preview if it's an image file
      if (this.selectedFile.type.startsWith('image')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.imagePreview = reader.result as string; // Store the image preview
        };
        reader.readAsDataURL(this.selectedFile);
      } else {
        this.imagePreview = null; // Reset preview if not an image
      }

      // Patch the form with the selected file (for file upload)
      this.addCpExecutiveForm.patchValue({ profile_image: this.selectedFile });
    }
  }
  deleteFile(): void {
    this.selectedFile = null;
    this.imageSize = null;
    this.addCpExecutiveForm.patchValue({ profile_image: null });
  }
  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length <= 3) {
      this.allChannelPartnerList = []; // Clear dropdown if too short
      return;
    }
  
    this.http.post(`${this.baseUrl}/channel_partner_dropdown`, { firm_name: trimmedSearch })
      .subscribe({
        next: (res: any) => {
          this.allChannelPartnerList = res.map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner})`,
          }));
        },
        error: () => {
          this.snackBar.open('Unable to fetch source details.', 'Close', { duration: 3000 });
        },
      });
  }

  onSubmit(): void {
    const formData = new FormData();
    const formValues = this.addCpExecutiveForm.value;
  
    const appendField = (key: string, value: any) => {
      formData.append(
        key,
        value !== null && value !== undefined ? value.toString() : ''
      );
    };
    const expenseDate = this.addCpExecutiveForm.get('dob')?.value;
    let formattedDate = '';
    if (expenseDate) {
      const dateObj = new Date(expenseDate);
      formattedDate = dateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

  
    appendField('role_id', formValues.role_id);
    appendField('first_name', formValues.first_name);
    appendField('last_name', formValues.last_name);
    appendField('user_email', formValues.user_email);
    appendField('user_phone', formValues.user_phone);
    appendField('pan_no', formValues.pan_no);
    appendField('address', formValues.address);
    appendField('dob', formattedDate);
    appendField('country', formValues.country);
    appendField('state', formValues.state);
    appendField('pin_code', formValues.pin_code);
    appendField('password', formValues.password);
    appendField('aadhar_no', formValues.aadhar_no);
    appendField('channel_partner_id', formValues.channel_partner_id);
    appendField('created_by', this.userId);
    appendField('user_id', this.data?.rowData?.user_id );

  
    // Append city_id in the desired format
    const cityIds = Array.isArray(formValues.city_id) ? formValues.city_id : [formValues.city_id];
    cityIds.forEach((cityId, index) => {
      formData.append(`city_id[${index}]`, cityId.toString());
    });
  
    // Append sub_region_id in the desired format
    const subRegionIds = Array.isArray(formValues.sub_region_id) ? formValues.sub_region_id : [formValues.sub_region_id];
    subRegionIds.forEach((subRegionId, index) => {
      formData.append(`sub_region_id[${index}]`, subRegionId.toString());
    });

  
    // Handle profile image
    if (this.selectedFile) {
      formData.append('profile_image', this.selectedFile, this.selectedFile.name);
    }
  
    // Make the API call
    const apiUrl = this.data.apiUrl;
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (response:any) => {
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
