import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { IndianCurrencyPipe } from '../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';

@Component({
  selector: 'app-common-add-edit-insentive-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
    IndianCurrencyPipe,
    ActionColumnComponent,
    ReusableTableComponent,
  ],
  templateUrl: './common-add-edit-insentive-dialog.component.html',
  styleUrl: './common-add-edit-insentive-dialog.component.scss'
})
export class CommonAddEditInsentiveDialogComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  
  isEditMode = false;
  dialogTitle = 'Add Incentive Slab';
  incentiveType: 'slab' | 'role-wise' = 'slab'; // Default to 'slab' type

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    public dialogRef: MatDialogRef<CommonAddEditInsentiveDialogComponent> // Reference to the dialog
  ) {}

  projectsList: any[] = [];
  allWingslist: any[] = [];
  allRoleList: any[] = [];
  loading = false;
  addIncentiveSlabForm = new FormGroup({
    project_id: new FormControl('', [Validators.required]),
    wing_id: new FormControl<any[]>([]), // Array for multi-select
    percentage_from: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(100)]),
    percentage_to: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(100)]),
    incentive_percentage: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(100)]),
    role_id: new FormControl('', [Validators.required]),
  });
  
  ngOnInit(): void {
    // Determine incentive type from data (default to 'slab')
    this.incentiveType = this.data?.type || 'slab';
    
    this.fetchAllProjects();
    
    // Fetch roles if it's role-wise type
    if (this.incentiveType === 'role-wise') {
      this.fetchAllRoles();
    }
    
    // Configure validators based on type
    this.configureFormValidators();
    
    // Check if it's edit mode
    if (this.data?.action === 'edit' && this.data?.row) {
      this.isEditMode = true;
      this.dialogTitle = this.incentiveType === 'role-wise' ? 'Edit Role Wise Incentive' : 'Edit Incentive Slab';
      this.populateFormForEdit();
    } else {
      this.dialogTitle = this.incentiveType === 'role-wise' ? 'Add Role Wise Incentive' : 'Add Incentive Slab';
    }
  }
  
  configureFormValidators(): void {
    if (this.incentiveType === 'slab') {
      // Slab type requires percentage_from and percentage_to, role_id is optional
      this.addIncentiveSlabForm.get('percentage_from')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.addIncentiveSlabForm.get('percentage_to')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.addIncentiveSlabForm.get('role_id')?.clearValidators();
    } else {
      // Role-wise type requires role_id, percentage_from and percentage_to are not needed
      this.addIncentiveSlabForm.get('role_id')?.setValidators([Validators.required]);
      this.addIncentiveSlabForm.get('percentage_from')?.clearValidators();
      this.addIncentiveSlabForm.get('percentage_to')?.clearValidators();
      // Set to 0 for role-wise as they're not used
      this.addIncentiveSlabForm.patchValue({ percentage_from: 0, percentage_to: 0 });
    }
    
    // Update validity
    this.addIncentiveSlabForm.get('percentage_from')?.updateValueAndValidity();
    this.addIncentiveSlabForm.get('percentage_to')?.updateValueAndValidity();
    this.addIncentiveSlabForm.get('role_id')?.updateValueAndValidity();
  }
  
  populateFormForEdit(): void {
    const row = this.data.row;
    
    // Handle wing_id - convert to array if it's not already (for multi-select)
    let wingIdValue = row.wing_id;
    if (wingIdValue !== null && wingIdValue !== undefined && !Array.isArray(wingIdValue)) {
      wingIdValue = [wingIdValue];
    } else if (wingIdValue === null || wingIdValue === undefined) {
      wingIdValue = [];
    }
    
    if (this.incentiveType === 'slab') {
      this.addIncentiveSlabForm.patchValue({
        project_id: row.project_id,
        wing_id: wingIdValue,
        percentage_from: row.percentage_from,
        percentage_to: row.percentage_to,
        incentive_percentage: row.incentive_percentage,
      });
    } else {
      // Role-wise type
      this.addIncentiveSlabForm.patchValue({
        project_id: row.project_id,
        wing_id: wingIdValue,
        role_id: row.role_id,
        incentive_percentage: row.incentive_percentage,
      });
    }
    
    // Fetch wings for the selected project
    if (row.project_id) {
      this.fetchAllWings(row.project_id);
    }
  }
  fetchAllProjects(): void {
    this.loading = true;
    const payload = {
      user_id:  this.userId,
    };
  
    this.http.post<any>(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res:any) => {
        this.projectsList = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.loading = false;
        this.snackBar.open('Unable to fetch projects. Please try again later.', 'Close', {
          duration: 3000,
        });
        this.projectsList = [];
      },
    });
  }
  
  fetchAllRoles(): void {
    this.http.get(`${this.baseUrl}/roles_dropdown`).subscribe({
      next: (res: any) => {
        this.allRoleList = res || [];
      },
      error: (err: any) => {
        console.error('Error fetching roles:', err);
        this.snackBar.open('Unable to fetch roles.', 'Close', {
          duration: 3000,
        });
        this.allRoleList = [];
      },
    });
  }
  fetchAllWings(selectedProjectId: number): void {
    this.loading = true;
    const payload = { project_id: Number(selectedProjectId) };
    
    this.http
      .post(`${this.baseUrl}/wing_dropdown`, payload)
      .subscribe({
        next: (res: any) => {
          this.allWingslist = res || []; // Store wings list
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching wings:', err);
          this.loading = false;
          this.allWingslist = []; // Clear wings list on error
          this.snackBar.open('Unable to fetch wings.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  
  onProjectChange(projectId: number | null): void {
    // Clear wing selection and wings list immediately (use empty array for multi-select)
    this.addIncentiveSlabForm.patchValue({ wing_id: [] });
    this.allWingslist = [];
    
    // Fetch wings only if valid project is selected
    if (projectId && projectId > 0) {
      this.fetchAllWings(projectId);
    }
  }
  
  onSubmit(): void {
    if (this.addIncentiveSlabForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.loading = true;
    const formValue = this.addIncentiveSlabForm.value;

    // Prepare the payload based on type
    const payload: any = {
      incentive_percentage: Number(formValue.incentive_percentage) || 0,
      project_id: Number(formValue.project_id),
      created_by: this.userId,
    };

    if (this.incentiveType === 'slab') {
      // Add slab-specific fields
      payload.percentage_from = Number(formValue.percentage_from) || 0;
      payload.percentage_to = Number(formValue.percentage_to) || 0;
    } else {
      // Add role-wise specific fields
      payload.role_id = Number(formValue.role_id);
      payload.updated_by = this.userId;
    }

    // Add wing_id if provided (handle as array for multi-select)
    if (formValue.wing_id && Array.isArray(formValue.wing_id) && formValue.wing_id.length > 0) {
      // Filter out empty strings and convert to numbers
      const wingIds = formValue.wing_id
        .filter((id: any) => id !== '' && id !== null && id !== undefined)
        .map((id: any) => Number(id));
      
      if (wingIds.length > 0) {
        payload.wing_id = wingIds;
      }
    } else if (formValue.wing_id && !Array.isArray(formValue.wing_id)) {
      // Handle single value case if it exists
      payload.wing_id = [Number(formValue.wing_id)];
    }

    // Add appropriate ID for edit mode
    if (this.isEditMode) {
      if (this.incentiveType === 'slab' && this.data?.row?.incentive_slab_id) {
        payload.incentive_slab_id = this.data.row.incentive_slab_id;
      } else if (this.incentiveType === 'role-wise' && this.data?.row?.role_wise_incentive_percentage_id) {
        payload.role_wise_incentive_percentage_id = this.data.row.role_wise_incentive_percentage_id;
      }
    }

    // Determine the API endpoint based on type and mode
    let apiEndpoint: string;
    let successMessage: string;
    
    if (this.incentiveType === 'slab') {
      apiEndpoint = this.isEditMode ? 'edit_incentive_slab' : 'add_incentive_slab';
      successMessage = `Incentive Slab ${this.isEditMode ? 'updated' : 'added'} successfully!`;
    } else {
      apiEndpoint = this.isEditMode ? 'edit_role_wise_incentive' : 'add_role_wise_incentive';
      successMessage = `Role Wise Incentive ${this.isEditMode ? 'updated' : 'added'} successfully!`;
    }

    // Make the API call
    this.http.post(`${this.baseUrl}/${apiEndpoint}`, payload).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.snackBar.open(
          response.message || successMessage,
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(true); // Close dialog and return success
      },
      error: (error) => {
        this.loading = false;
        console.error(`Error submitting ${this.incentiveType} incentive:`, error);
        this.snackBar.open(
          error?.error?.message || `Failed to ${this.isEditMode ? 'update' : 'add'} incentive. Please try again.`,
          'Close',
          { duration: 3000 }
        );
      },
    });
  }
}
