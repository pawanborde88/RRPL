import { CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER, Z } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-add-city-subregion',
  standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      AngularMaterialModule,
      FormsModule,
      ReactiveFormsModule,
    ],
  templateUrl: './add-city-subregion.component.html',
  styleUrl: './add-city-subregion.component.scss'
})
export class AddCitySubregionComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allCitys: any[] = [];
  AllSubRegions: string[] = [];
  addCitySubRegionForm!: FormGroup; // Declare it as a class property

  announcer = inject(LiveAnnouncer);
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddCitySubregionComponent> // Reference to the dialog
  ) {}
  ngOnInit(): void {
    console.log(this.data); // Check the injected data
    this.fetchAllCity(); // Fetch the list of cities
  
    // Initialize AllSubRegions from rowData for editing
    this.AllSubRegions = this.data?.rowData?.sub_region
      ? (Array.isArray(this.data.rowData.sub_region)
          ? this.data.rowData.sub_region
          : this.data.rowData.sub_region.split(',')
        ).map((subRegion: string) => subRegion.trim()) // Ensure no extra spaces
      : [];
  
    // Initialize form
    this.addCitySubRegionForm = new FormGroup({
      user_id: new FormControl(this.userId),
      city_name: new FormControl(this.data?.rowData?.city_name || '', Validators.required),
      sub_regions: new FormControl(this.AllSubRegions.join(','), Validators.required), // Bind as string initially
      city_id: new FormControl(this.data?.rowData?.city_id || null),
      sub_region_id: new FormControl(this.data?.rowData?.sub_region_id || null),
    });
  }
  
  fetchAllCity(): void {
    this.http.get(`${this.baseUrl}/fetch_cities`).subscribe({
      next: (res: any) => {
        this.allCitys = res;
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch cities.', 'Close', { duration: 3000 });
      },
    });
  }
  
  // Remove a tag from the list and update form value
  remove(tag: string): void {
    const index = this.AllSubRegions.indexOf(tag);
    if (index >= 0) {
      this.AllSubRegions.splice(index, 1);
      this.announcer.announce(`Removed ${tag}`);
      this.addCitySubRegionForm.controls['sub_regions'].setValue(this.AllSubRegions.join(',')); // Update input value
    }
  }
  
  // Add a new tag and update form value
  addTagsToArray(tagInput: HTMLInputElement): void {
    const value = tagInput.value.trim();
    if (value) {
      this.AllSubRegions.push(value);
      this.addCitySubRegionForm.controls['sub_regions'].setValue(this.AllSubRegions.join(',')); // Update input value
      tagInput.value = ''; // Clear input field
    }
  }
  
  // Handle form submission
  onSubmit(): void {
    const formData = { ...this.addCitySubRegionForm.value };
  
    // Ensure sub_regions is an array
    formData.sub_regions = this.AllSubRegions;
  
    const apiUrl = this.data.apiUrl;
  
    this.http.post(`${this.baseUrl}/${apiUrl}`, formData).subscribe(
      (response) => {
        console.log(response);
        this.snackBar.open(this.data.successMessage, 'Close', { duration: 3000 });
        this.dialogRef.close({ success: true, city_id: this.addCitySubRegionForm.controls['city_id'].value });
      },
      (error) => {
        console.error('Error:', error);
        this.snackBar.open('Something went wrong. Please try again.', 'Close', { duration: 3000 });
      }
    );
  }
  
  
    
}
