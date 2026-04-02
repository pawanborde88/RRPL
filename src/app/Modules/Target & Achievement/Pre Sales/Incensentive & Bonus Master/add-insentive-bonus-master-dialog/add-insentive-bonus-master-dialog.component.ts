import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { AddPresalesTargetDialogComponent } from '../../add-presales-target-dialog/add-presales-target-dialog.component';

@Component({
  selector: 'app-add-insentive-bonus-master-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-insentive-bonus-master-dialog.component.html',
  styleUrl: './add-insentive-bonus-master-dialog.component.scss'
})
export class AddInsentiveBonusMasterDialogComponent implements OnInit{
  private readonly baseUrl = environment.API_URL;
  private readonly roleId = Number(sessionStorage.getItem('role_id'));
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  
  projectsList: any[] = [];
  allRoleList: any[] = [];
  allUserList: any[] = [];
  isEditMode: boolean = false;
  preSaleTargetId: number | null = null;

  private pipe = new DatePipe('en-US');

  addTargetForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    month_id: new FormControl<number | null>(null, Validators.required),
    role_id: new FormControl<number | null>(null, Validators.required),
    user_id: new FormControl<number[]>([], Validators.required),
    incentive_per_visit: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0)
    ]),
    bonus_per_visit: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0)
    ]),
    bonus_eligibility_visit: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1)
    ]),
    incentive_per_booking: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0)
    ]),
    bonus_per_booking: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0)
    ]),
    bonus_eligibility_booking: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1)
    ]),
    created_by: new FormControl<number>(this.userId)
  });
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddInsentiveBonusMasterDialogComponent>
  ) {
    this.isEditMode = !!data?.rowData;
  }
  months = [
    { id: 1, name: 'January' },
    { id: 2, name: 'February' },
    { id: 3, name: 'March' },
    { id: 4, name: 'April' },
    { id: 5, name: 'May' },
    { id: 6, name: 'June' },
    { id: 7, name: 'July' },
    { id: 8, name: 'August' },
    { id: 9, name: 'September' },
    { id: 10, name: 'October' },
    { id: 11, name: 'November' },
    { id: 12, name: 'December' }
];
  ngOnInit(): void {
    console.log(this.data);
    
    this.initializeForm();
    this.fetchAllProjects();
    this.fetchAllRoles();
    
    this.addTargetForm.get('role_id')?.valueChanges.subscribe(roleId => {
      if (roleId) {
        this.fetchAllUsersList(roleId);
      }
    });
  }

  private initializeForm(): void {
    if (this.isEditMode) {
      this.preSaleTargetId = this.data.rowData.pre_sale_target_id;
      this.fetchAllUsersList(this.data.rowData.role_id);
      this.addTargetForm.patchValue({
        ...this.data.rowData,
        user_id: this.data.rowData.user_id || []
      });
    }
  }

  private prepareFormData(): any {
    const formValue = this.addTargetForm.value;
    return {
      ...formValue,
      pre_sale_target_id: this.isEditMode ? this.preSaleTargetId : undefined
    };
  }
  onSubmit(): void {
    if (this.addTargetForm.invalid) {
      this.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
      });
      return;
    }

    const formData = this.prepareFormData();
    const apiEndpoint = this.isEditMode 
      ? 'update_pre_sale_incentive' 
      : 'add_pre_sale_incentive';

    this.http.post(`${this.baseUrl}/${apiEndpoint}`, formData).subscribe({
      next: () => this.handleSuccess(),
      error: (error) => this.handleError(error)
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.addTargetForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }


  private handleSuccess(): void {
    this.snackBar.open(this.data.successMessage, 'Close', {
      duration: 3000,
    });
    this.dialogRef.close(true);
  }

  private handleError(error: any): void {
    console.error('Error:', error);
    this.snackBar.open(
      error.error?.message || 'Something went wrong. Please try again.', 
      'Close', 
      { duration: 3000 }
    );
  }

  private fetchAllProjects(): void {
    const payload = {
      user_id:  this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        this.projectsList = res || [];
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch projects.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  private fetchAllRoles(): void {
    this.http.get(`${this.baseUrl}/roles_dropdown`).subscribe({
      next: (res: any) => {
        this.allRoleList = res || [];
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch roles.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  private fetchAllUsersList(roleId: number): void {
    this.http.post(`${this.baseUrl}/fetch_users`, { role_id: roleId }).subscribe({
      next: (res: any) => {
        this.allUserList = res || [];
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch users.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
