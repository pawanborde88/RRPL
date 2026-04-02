import { Component, OnInit, Inject } from '@angular/core';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonService } from '../../../../Service/common/common.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-add-projects',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-projects.component.html',
  styleUrls: ['./add-projects.component.scss'], // Fixed typo
})
export class AddProjectsComponent implements OnInit {
  roleId = Number(sessionStorage.getItem('role_id')) || null;
  userId = Number(sessionStorage.getItem('session_id')) || null;
  baseUrl = environment.API_URL;
  allCities: any[] = [];
  allSubregions: any[] = [];
  selectedFiles: any[] = [];
  selectedFile: any = null;
  selectedLogo: any = null;
  imagePreview: string | null = null; // For project thumbnail preview
  logoPreview: string | null = null;
  allProjectStatus: any[] = [];
  constructor(
    private commonService: CommonService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddProjectsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  addProjects = new FormGroup({
    user_id: new FormControl(this.userId),
    property_name: new FormControl('', Validators.required),
    descriptions: new FormControl(''),
    amenities: new FormControl(''),
    min_cost: new FormControl(''),
    max_cost: new FormControl(''),
    builder: new FormControl(''),
    address: new FormControl('', Validators.required), // required added here
    project_code: new FormControl(''),

    map_location: new FormControl(''),
    pricing_desc: new FormControl(''),
    is_featured: new FormControl('0'),
    website: new FormControl(''),
    project_thumbnail_img: new FormControl<File | null>(
      null,

    ),
    project_logo: new FormControl<File | null>(
      null,

    ),
    project_status_id: new FormControl(),

    active_status_id: new FormControl(),
    footer_description: new FormControl(''),
    is_retro: new FormControl(false), // Changed to boolean for clarity
    city_id: new FormControl(''),
    sub_region_id: new FormControl(''),

  });

  ngOnInit(): void {
    this.fetchAllCities();
    this.fetchProejctStatus();


    this.addProjects
      .get('city_id')
      ?.valueChanges.subscribe((cityId: any) => {
        if (cityId) {
          this.fetchAllSubregions(cityId);
        }
      });
  }

  fetchAllCities(): void {
    this.commonService.fetchCities().subscribe({
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
  fetchProejctStatus(): void {
    this.commonService.fetchProjectStatus().subscribe({
      next: (res) => {
        this.allProjectStatus = res;
      },
      error: () => {
        this.snackBar.open('Unable to fetch cities.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  deleteFile(controlName: string): void {
    if (controlName === 'project_image') {
      this.selectedFiles = [];
    } else if (controlName === 'project_thumbnail_img') {
      this.addProjects.patchValue({
        project_thumbnail_img: null
      });
      this.selectedFile = null;
      this.imagePreview = null;
    } else if (controlName === 'project_logo') {
      this.addProjects.patchValue({
        project_logo: null
      });
      this.selectedLogo = null;
      this.logoPreview = null;
    }
  }

  fetchAllSubregions(cityIds: number): void {
    if (cityIds) {
      this.commonService
        .fetchSubregions(cityIds)
        .subscribe({
          next: (res: any) => {
            this.allSubregions = res; // Store the response in `allSubregions`
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
  onChangeFile(event: any, controlName: string): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      if (controlName === 'project_thumbnail_img') {
        this.imagePreview = e.target.result;
        this.addProjects.patchValue({ project_thumbnail_img: file });
      } else if (controlName === 'project_logo') {
        this.logoPreview = e.target.result;
        this.addProjects.patchValue({ project_logo: file });
      } else {
        console.warn(`Unknown controlName: ${controlName}`);
      }
    };

    reader.readAsDataURL(file);
  }




  onSubmit() {
    if (this.addProjects.invalid) {
      this.snackBar.open('Please fill all required fields.', 'Close', { duration: 3000 });
      return;
    }

    const formData = new FormData();

    // Append all form values to FormData
    Object.keys(this.addProjects.controls).forEach((key) => {
      let value = this.addProjects.get(key)?.value;

      // Convert checkboxes (boolean) to '0' or '1'
      if (key === 'is_retro' || key === 'is_featured') {
        value = value ? '1' : '0';
      }

      // Append files separately
      if (key === 'project_thumbnail_img' || key === 'project_logo') {
        if (value instanceof File) {
          formData.append(key, value);
        }
      } else {
        formData.append(key, value);
      }
    });

    this.commonService.addProjectDetails(formData).subscribe({
      next: (response) => {
        this.snackBar.open('Project added successfully!', 'Close', { duration: 3000 });
        this.dialogRef.close(true); // Close dialog and return success
      },
      error: () => {
        this.snackBar.open('Failed to add project.', 'Close', { duration: 3000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }


}
