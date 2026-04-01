import { HttpClient } from '@angular/common/http';
import { Component, inject, Inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { CommonService } from '../../../../Service/common/common.service';

@Component({
  selector: 'app-add-floor-units',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe, // Add the pipe here
    AutocompleteReusableComponent,

  ],
  templateUrl: './add-floor-units.component.html',
  styleUrl: './add-floor-units.component.scss',
})
export class AddFloorUnitsComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  private readonly commonService = inject(CommonService);

  projectsList = signal<any[]>([]);
  bookingStatusList = signal<any[]>([]);
  allWingslist = signal<any[]>([]);
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddFloorUnitsComponent> // Reference to the dialog
  ) { }
  addFloorUnit = new FormGroup({
    user_id: new FormControl(this.data?.rowData?.user_id || this.userId), // Default userId if no rowData
    floor_unit_id: new FormControl(this.data?.rowData?.floor_unit_id || null),
    project_id: new FormControl(this.data?.rowData?.project_id, Validators.required),
    wing_id: new FormControl(this.data?.rowData?.wing_id),
    floor_id: new FormControl(this.data?.rowData?.floor_id),
    floor_unit: new FormControl(this.data?.rowData?.floor_unit, Validators.required),
    active_status_id: new FormControl(this.data?.rowData?.active_status_id || 1, Validators.required),

    floor_order: new FormControl(this.data?.rowData?.floor_order),
    flat_type: new FormControl(this.data?.rowData?.flat_type),
    unit_type: new FormControl(this.data?.rowData?.unit_type),
    flat_order: new FormControl(this.data?.rowData?.flat_order),

    carpet_sqft: new FormControl(this.data?.rowData?.carpet_sqft),
    carpet_sqm: new FormControl(this.data?.rowData?.carpet_sqm),

    balcony_sqft: new FormControl(this.data?.rowData?.balcony_sqft),
    balcony_sqm: new FormControl(this.data?.rowData?.balcony_sqm),

    enclosed_balcony_sqft: new FormControl(this.data?.rowData?.enclosed_balcony_sqft),
    enclosed_balcony_sqm: new FormControl(this.data?.rowData?.enclosed_balcony_sqm),

    dry_balcony_sqft: new FormControl(this.data?.rowData?.dry_balcony_sqft),
    dry_balcony_sqm: new FormControl(this.data?.rowData?.dry_balcony_sqm),

    terrace_sqft: new FormControl(this.data?.rowData?.terrace_sqft),
    terrace_sqm: new FormControl(this.data?.rowData?.terrace_sqm),

    garden_sqft: new FormControl(this.data?.rowData?.garden_sqft),
    garden_sqm: new FormControl(this.data?.rowData?.garden_sqm),

    mezzanine_sqft: new FormControl(this.data?.rowData?.mezzanine_sqft),
    mezzanine_sqm: new FormControl(this.data?.rowData?.mezzanine_sqm),

    loft_area_sqft: new FormControl(this.data?.rowData?.loft_area_sqft),
    loft_area_sqm: new FormControl(this.data?.rowData?.loft_area_sqm),

    sitout_area_sqft: new FormControl(this.data?.rowData?.sitout_area_sqft),
    sitout_area_sqm: new FormControl(this.data?.rowData?.sitout_area_sqm),

    udf1_area_sqft: new FormControl(this.data?.rowData?.udf1_area_sqft || 0),
    udf1_area_sqm: new FormControl(this.data?.rowData?.udf1_area_sqm || 0),

    udf2_area_sqft: new FormControl(this.data?.rowData?.udf2_area_sqft || 0),
    udf2_area_sqm: new FormControl(this.data?.rowData?.udf2_area_sqm || 0),

    udf3_area_sqft: new FormControl(this.data?.rowData?.udf3_area_sqft || 0),
    udf3_area_sqm: new FormControl(this.data?.rowData?.udf3_area_sqm || 0),

    udf4_area_sqft: new FormControl(this.data?.rowData?.udf4_area_sqft || 0),
    udf4_area_sqm: new FormControl(this.data?.rowData?.udf4_area_sqm || 0),

    udf5_area_sqft: new FormControl(this.data?.rowData?.udf5_area_sqft || 0),
    udf5_area_sqm: new FormControl(this.data?.rowData?.udf5_area_sqm || 0),

    total_carpet_area_sqft: new FormControl(this.data?.rowData?.total_carpet_area_sqft),
    total_carpet_area_sqm: new FormControl(this.data?.rowData?.total_carpet_area_sqm),

    unit_id: new FormControl(this.data?.rowData?.unit_id),
    rate: new FormControl(this.data?.rowData?.rate),
    idc: new FormControl(this.data?.rowData?.idc),

    agreement_cost: new FormControl(this.data?.rowData?.agreement_cost),
    market_value: new FormControl(this.data?.rowData?.market_value),

    gst_percent: new FormControl(this.data?.rowData?.gst_percent),
    gst: new FormControl(this.data?.rowData?.gst),

    stamp_duty_percent: new FormControl(this.data?.rowData?.stamp_duty_percent),
    stamp_duty: new FormControl(this.data?.rowData?.stamp_duty),

    registration_percent: new FormControl(this.data?.rowData?.registration_percent),
    registration: new FormControl(this.data?.rowData?.registration),

    society_formation_charges: new FormControl(this.data?.rowData?.society_formation_charges),
    legal_charges: new FormControl(this.data?.rowData?.legal_charges),
    maintenance_charges: new FormControl(this.data?.rowData?.maintenance_charges),
    corpus_fund: new FormControl(this.data?.rowData?.corpus_fund),
    other_charges: new FormControl(this.data?.rowData?.other_charges),
    parking_charges: new FormControl(this.data?.rowData?.parking_charges),

    package_total: new FormControl(this.data?.rowData?.package_total),
    ownership: new FormControl(this.data?.rowData?.ownership),
    landowner_name: new FormControl(this.data?.rowData?.landowner_name),

    parking_avail: new FormControl(this.data?.rowData?.parking_avail),
    parking_type: new FormControl(this.data?.rowData?.parking_type),
    parking_no: new FormControl(this.data?.rowData?.parking_no),

    booking_status: new FormControl(this.data?.rowData?.booking_status || 'Available'),
    floor_sanctioned_status: new FormControl(this.data?.rowData?.floor_sanctioned_status),

    north_side_details: new FormControl(this.data?.rowData?.north_side_details),
    south_side_details: new FormControl(this.data?.rowData?.south_side_details),
    east_side_details: new FormControl(this.data?.rowData?.east_side_details),
    west_side_details: new FormControl(this.data?.rowData?.west_side_details),
  });
  ngOnInit(): void {
    if (this.data?.for === 'floor-unit') {
      // safe to access properties
    }
    console.log(this.data);
    this.fetchAllProjects();
    this.fetchBookingStatus();

    const initialProjectId = this.addFloorUnit.get('project_id')?.value;
    if (initialProjectId) {
      this.fetchAllWings(initialProjectId);
    }

    this.addFloorUnit.get('project_id')?.valueChanges.subscribe((projectID) => {
      if (projectID) {
        this.fetchAllWings(projectID);
      }
    });
  }


  fetchAllProjects(): void {

    this.http.post(`${this.baseUrl}/fetch_projects`, {}).subscribe({
      next: (res: any) => {
        this.projectsList.set(res);

      },
      error: () => {

        this.snackBar.open('Unable to fetch project details.', 'Close', { duration: 3000 });
      },
    });
  }

  fetchAllWings(projectID: number): void {

    this.http.post(`${this.baseUrl}/wing_dropdown`, { project_id: projectID }).subscribe({
      next: (res: any) => {
        this.allWingslist.set(res);

      },
      error: () => {

        this.snackBar.open('Unable to fetch project details.', 'Close', { duration: 3000 });
      },
    });
  }
  fetchBookingStatus(): void {
    this.commonService.fetchBookingStatus().subscribe({
      next: (res: any) => {
        this.bookingStatusList.set(res.data || []);
      },
      error: () => {
        this.snackBar.open('Unable to fetch booking status.', 'Close', {
          duration: 3000,
        });
        this.bookingStatusList.set([]);
      },
    });
  }




  onSubmit(): void {
    // Retrieve the form values
    const formData = {
      ...this.addFloorUnit.value, // Spread the existing form values
      updated_by: this.userId,    // Add updated_by
      user_id: this.userId,       // Ensure user_id is set to the current userId
    };

    // Initialize the apiUrl from the passed data
    const apiUrl = this.data.apiUrl;

    // Send the request
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (response) => {
        console.log('Response:', response);
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
