import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonService } from '../../../../Service/common/common.service';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { MatCardModule } from '@angular/material/card'; // Add this import if missing
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'; // For clean subscriptions
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { DialogRef } from '@angular/cdk/dialog';

@Component({
  selector: 'app-add-new-parking-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    AutocompleteReusableComponent,
    ReactiveFormsModule,
    TruncatePipe,
    ConfigurableAgGridDataComponent,
    MatCardModule // Make sure this is imported
  ],
  templateUrl: './add-new-parking-dialog.component.html',
  styleUrl: './add-new-parking-dialog.component.scss'
})
export class AddNewParkingDialogComponent implements OnInit, OnDestroy {
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private dialogRef = inject(DialogRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.API_URL;

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  projectsList: any[] = [];
  allWingslist: any[] = [];
  parkingStatusList: any[] = [];
  allParkingTypeList: any[] = [];
  filterForm!: FormGroup;

  ngOnInit(): void {
    this.initializeForm();
    this.fetchAllProjects();
    this.fetchParkingStatus();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      project_id: [null, Validators.required],
      wing_id: [{ value: null, disabled: true }, Validators.required],
      parking_no: ['', Validators.required],
      parking_type: ['', Validators.required],
      parking_level: ['', Validators.required],
      parking_status_id: [null]
    });
  }

  setupFormListeners(): void {
    // When project changes, fetch wings and reset wing selection
    this.filterForm.get('project_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((projectId) => {
        const wingControl = this.filterForm.get('wing_id');

        if (projectId) {
          this.allWingslist = [];
          wingControl?.enable({ emitEvent: false });
          wingControl?.setValue(null, { emitEvent: false });
          this.fetchAllWings(projectId);
          this.allParkingTypes(projectId);
        } else {
          this.allWingslist = [];
          wingControl?.setValue(null, { emitEvent: false });
          wingControl?.disable({ emitEvent: false });
        }
      });
  }
  allParkingTypes(projectId: number): void {
    this.http
      .post<any>(`${this.baseUrl}/parking_type_dropdown`, {
        project_id: projectId,
      })
      .subscribe({
        next: (response) => {
          this.allParkingTypeList = response.data;
        },
        error: (error) => {
          console.error('Error fetching tokenTypeDropdown:', error);
          this.snackBar.open(
            'Unable to fetch token type dropdown data.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
  }
  fetchAllProjects(): void {
    this.commonService.fetchUserProjectDropdown(this.userId).subscribe({
      next: (res: any) => {
        this.projectsList = res || [];
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.snackBar.open('Unable to fetch projects. Please try again later.', 'Close', {
          duration: 3000,
        });
        this.projectsList = [];
      },
    });
  }

  fetchAllWings(selectedProjectId: number): void {
    this.commonService.fetchWingDropdown(selectedProjectId).subscribe({
      next: (res: any) => {
        this.allWingslist = res || [];
      },
      error: (err) => {
        console.error('Error fetching wings:', err);
        this.snackBar.open('Unable to fetch wings.', 'Close', {
          duration: 3000,
        });
        this.allWingslist = [];
      },
    });
  }

  fetchParkingStatus(): void {
    this.commonService.fetchParkingStatus().subscribe({
      next: (res: any) => {
        this.parkingStatusList = res.data || res || [];
      },
      error: (err) => {
        console.error('Error fetching parking status:', err);
        this.snackBar.open('Unable to fetch parking status.', 'Close', {
          duration: 3000,
        });
        this.parkingStatusList = [];
      },
    });
  }


  saveParking(): void {
    if (this.filterForm.valid) {
      const formData = this.filterForm.getRawValue();

      // Prepare the data as per your JSON structure
      const parkingData = {
        project_id: formData.project_id,
        wing_id: formData.wing_id,
        parking_no: formData.parking_no,
        parking_type: formData.parking_type,
        parking_level: formData.parking_level,
        parking_status_id: formData.parking_status_id
      };

      // Call your service to save parking
      this.http
        .post<any>(`${this.baseUrl}/add_parking_plan`, parkingData)
        .subscribe({
          next: (res: any) => {
            if (res.success) {
              this.snackBar.open(res.message || 'Parking saved successfully!', 'Close', {
                duration: 3000,
              });
              this.dialogRef.close();
            } else {
              this.snackBar.open(res.message || 'Failed to save parking.', 'Close', {
                duration: 3000,
              });
            }
          },
          error: (err) => {
            console.error('Error saving parking:', err);
            const errorMessage = err.error?.message || 'Failed to save parking. Please try again.';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 3000,
            });
          }
        });
    } else {
      // Mark all fields as touched to trigger validation messages
      this.filterForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly.', 'Close', {
        duration: 3000,
      });
    }
  }
}