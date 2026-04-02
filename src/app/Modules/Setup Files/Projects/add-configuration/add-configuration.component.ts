import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { forkJoin } from 'rxjs';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-add-configuration',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './add-configuration.component.html',
  styleUrl: './add-configuration.component.scss',
})
export class AddConfigurationComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  selectedFile: File | null = null; // To handle file uploads
  allFeetList: any[] = [];
  allPhaseList: any[] = [];
  allPriceList: any[] = [];
  allBHKList: any[] = [];
  pipe = new DatePipe('en-US');
  constructor(
    private http: HttpClient,
        private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddChannelPartnerComponent> // Reference to the dialog
  ) {}
  selectedFiles: any[] = [];
  ngOnInit(): void {
    console.log(this.data);
    
    console.log(this.data.projectid);
    this.fetchAllDropdowns();
    if (this.data.rowData) {
      this.patchFormValues(this.data.rowData);
    }
  }

  // Define the form
  addProjectConfigurationForm = new FormGroup({
    user_id: new FormControl(this.userId),
    project_id: new FormControl(this.data.projectid),
    configuration: new FormControl(''),
    bhk_id: new FormControl(''),
    variant_name: new FormControl(''),
    price_starts: new FormControl(''),
    price_ends: new FormControl(''),
    start_price_id: new FormControl(''),
    end_price_id: new FormControl(''),
    active_status_id: new FormControl(''),
    feet_id: new FormControl(''),
    phase_id: new FormControl(''),
    valid_till_date: new FormControl(''), // Optional field, no validation
    valid_from_date: new FormControl(''), // Optional field, no validation
    carpet_area: new FormControl(''),
    config_image: new FormControl<File[]>([]),
  });
  private patchFormValues(rowData: any): void {
    this.addProjectConfigurationForm.patchValue({
      user_id: rowData.user_id,
      project_id: rowData.project_id,
      configuration: rowData.configuration,
      bhk_id: rowData.bhk_id, // Ensure string value if needed
      variant_name: rowData.variant_name,
      price_starts: rowData.price_starts,
      price_ends: rowData.price_ends,
      start_price_id: rowData.start_price_id,
      active_status_id: rowData.active_status_id || 1,
      end_price_id: rowData.end_price_id,
      feet_id: rowData.feet_id,
      phase_id: rowData.phase_id ? rowData.phase_id : '',
      valid_till_date: rowData.valid_till_date ? this.formatDate(rowData.valid_till_date) : '',
      valid_from_date: rowData.valid_from_date ? this.formatDate(rowData.valid_from_date) : '',
      carpet_area: rowData.carpet_area
    });
  
  }
  private formatDate(date: any): string {
    if (typeof date === 'number') {
      return date.toString();
    }
    // Add additional date formatting logic if needed
    return date;
  }
  fetchAllDropdowns(): void {
    const project_id = this.data.projectid; // Ensure you have the project_id available
  
    const requests = {
      allFeetList: this.http.get<any>(`${this.baseUrl}/feet_dropdown`),
      allBHKList: this.http.get<any>(`${this.baseUrl}/bhk_dropdown`),
      allPriceList: this.http.get<any>(`${this.baseUrl}/price_dropdown`),
      allPhaseList: this.http.post<any>(`${this.baseUrl}/fetch_phases`, { project_id }),
    };
  
    forkJoin(requests).subscribe({
      next: (responses) => {
        this.allFeetList = responses.allFeetList;
        this.allBHKList = responses.allBHKList;
        this.allPriceList = responses.allPriceList;
        this.allPhaseList = responses.allPhaseList;
      },
      error: () => {
        this.snackBar.open('Unable to fetch data.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onSubmit(): void {
    const { projectid, apiUrl, successMessage, rowData } = this.data;
    const formValues = this.addProjectConfigurationForm.value;

    // Prepare the request payload with all form values
    const payload: any = {
        project_id: projectid?.toString() || '',
        user_id: this.userId?.toString() || '',
        phase_id: formValues.phase_id?.toString() || '',
        configuration: formValues.configuration || '',
        bhk_id: formValues.bhk_id?.toString() || '',
        active_status_id: formValues.active_status_id?.toString() || '',
        variant_name: formValues.variant_name || '',
        price_starts: formValues.price_starts?.toString() || '',
        price_ends: formValues.price_ends?.toString() || '',
        start_price_id: formValues.start_price_id?.toString() || '',
        end_price_id: formValues.end_price_id?.toString() || '',
        feet_id: formValues.feet_id?.toString() || '',
        carpet_area: formValues.carpet_area?.toString() || '',
    };

    // Add project_configuration_id if editing existing configuration
    if (rowData?.project_configuration_id) {
        payload.project_configuration_id = rowData.project_configuration_id.toString();
    }

    // Handle dates
    if (formValues['valid_from_date']) {
        const fromDate = this.pipe.transform(formValues['valid_from_date'], 'yyyy-MM-dd');
        if (fromDate) payload.valid_from_date = fromDate;
    }

    if (formValues['valid_till_date']) {
        const tillDate = this.pipe.transform(formValues['valid_till_date'], 'yyyy-MM-dd');
        if (tillDate) payload.valid_till_date = tillDate;
    }

    // Send request
    this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe(
        () => {
            this.snackBar.open(successMessage, 'Close', { duration: 3000 });
            this.dialogRef.close(true);
        },
        (error) => {
            console.error('Error:', error);
            this.snackBar.open('Something went wrong. Please try again.', 'Close', { duration: 3000 });
        }
    );
}
    deleteConfiguaration(configID: any): void {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
         minWidth: '25vw',
        data: {
          message: 'Are you sure you want to delete this Configuration?',
        },
      });
  
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.http
            .post(`${this.baseUrl}/delete_project_configuration`, {
              project_configuration_id: configID,
            })
            .subscribe({
              next: (data: any) => {
                this.dialogRef.close(true);
  
                this.snackBar.open(` Wing  deleted successfully`, 'Close', {
                  duration: 3000,
                });
              },
              error: (err: any) => {
                console.error(err);
                this.snackBar.open('Unable to delete the image.', 'Close', {
                  duration: 3000,
                });
              },
            });
        }
      });
    }
}
