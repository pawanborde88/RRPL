import { Component, Inject, OnInit } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-assign-leads',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './assign-leads.component.html',
  styleUrl: './assign-leads.component.scss',
})
export class AssignLeadsComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  allTelecallerlist: any[] = [];
  allSalesExecutive: any[] = [];
  projectsList: any[] = [];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AssignLeadsComponent> // Reference to the dialog
  ) { }

  ngOnInit(): void {
    console.log(this.data);
    this.fetchAllProjects();

    // Set initial values for dropdowns with default project_id
    const defaultProjectId = this.data?.rowData?.[0]?.project_id;
    if (defaultProjectId) {
      if (this.data.for === 'leadAssign') {
        this.fetchSalesExcutives(defaultProjectId);
        this.leadAssignForm.get('project_id')?.disable();
      } else {
        this.fetchalltelecallerList(defaultProjectId);
        this.leadAssignForm.get('project_id')?.enable();
      }
    }

    this.leadAssignForm.get('project_id')?.valueChanges.subscribe((projectID) => {
      if (projectID) {
        if (this.data.for === 'leadAssign') {
          this.fetchSalesExcutives(projectID);
        } else {
          this.fetchalltelecallerList(projectID);
        }
      }
    });
  }

  leadAssignForm = new FormGroup({
    project_lead_id: new FormControl(
      (this.data?.rowData ?? []).map(
        (item: { project_lead_id: any }) => item.project_lead_id
      )
    ),
    project_enq_id: new FormControl(
      (this.data?.rowData ?? []).map(
        (item: { project_enq_id: any }) => item.project_enq_id
      )
    ),
    sales_executive_id: new FormControl(),
    project_id: new FormControl(this.data?.rowData?.[0]?.project_id ?? null),
    updated_by: new FormControl(this.userId),
    telecaller_id: new FormControl([]), // Make it required
    user_id: new FormControl(),
    remark: new FormControl(null, Validators.required),
  });

  fetchalltelecallerList(projectID: any): void {
    const payload = { project_id: projectID };

    this.http.post(`${this.baseUrl}/telecaller_dropdown`, payload).subscribe({
      next: (res: any) => {
        this.allTelecallerlist = res.map((item: any) => ({
          ...item,
          full_name: `${item.first_name} ${item.last_name}`,
        }));
      },
      error: () => {
        this.snackBar.open('Unable to fetch source details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchSalesExcutives(projectID: any): void {
    this.http
      .post(`${this.baseUrl}/project_sales_executive_dropdown`, { project_id: projectID })
      .subscribe({
        next: (res: any) => {
          this.allSalesExecutive = res;
        },
        error: (err: any) => {
          console.error(err);
          this.snackBar.open('Unable to fetch sales executives.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onSubmit(): void {
    const { apiUrl, successMessage, for: actionFor } = this.data;

    // Use project_id as a single value (not wrapped in an array)
    const projectIdValue = this.leadAssignForm.get('project_id')?.value;

    let payload: any;

    if (actionFor === 'leadAssign') {
      payload = {
        project_id: projectIdValue,
        project_enq_id: this.leadAssignForm.get('project_enq_id')?.value,
        sales_executive_id: this.leadAssignForm.get('sales_executive_id')?.value,
        updated_by: this.userId,
        created_by: this.userId,
        remark: this.leadAssignForm.get('remark')?.value,
      };
    } else {
      const telecallerValue = this.leadAssignForm.get('telecaller_id')?.value;
      payload = {
        project_id: this.data?.rowData?.[0]?.property_id,
        project_lead_id: this.leadAssignForm.get('project_lead_id')?.value,
        telecaller_id: Array.isArray(telecallerValue)
          ? telecallerValue[0]
          : telecallerValue,
        updated_by: this.userId,
        created_by: this.userId,
        remark: this.leadAssignForm.get('remark')?.value,
      };
    }

    this.http.post(`${this.baseUrl}/${apiUrl}`, payload).subscribe(
      (res: any) => {
        this.dialog.open(SuccessDialogComponent, {
          autoFocus: false,
          data: { message: res.message },
        });
        this.dialogRef.close(true);
      },
      () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }

  fetchAllProjects(): void {
    const payload = {
      user_id: this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.projectsList = res;
        }
      },
      error: (err: any) => {
        console.error(err);
        this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
