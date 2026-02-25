import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { finalize, catchError, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-add-incentive-slabs-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    AutocompleteReusableComponent,
    AngularMaterialModule
  ],
  templateUrl: './add-incentive-slabs-dialog.component.html',
  styleUrl: './add-incentive-slabs-dialog.component.scss'
})
export class AddIncentiveSlabsDialogComponent implements OnInit {
  private readonly baseUrl = environment.API_URL;
  loading = false;
  allWingslist: any[] = [];
  dataSource = new MatTableDataSource<any>();
  projectsList: any[] = [];
  allStatusList: any[] = [];
  preferredBankDropdown: any[] = [];
  allUnitNoList: any[] = [];

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private pipe = new DatePipe('en-US');

  addDemandGenerationForm = new FormGroup({
    project_id: new FormControl(this.data.project_id),
    wing_id: new FormControl([], Validators.required),

    percentage_from: new FormControl('', Validators.required),
    percentage_to: new FormControl('', Validators.required),
    incentive_percentage: new FormControl('', Validators.required),
    created_by: new FormControl(this.userId),
    updated_by: new FormControl(this.userId),
    incentive_slabe_id: new FormControl()
  });

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<AddIncentiveSlabsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    console.log(this.data);
    if (this.data?.project_id) {
      this.fetchAllWings(this.data?.project_id);

    }

  }




  fetchAllWings(projectId: number): void {
    this.http.post(`${this.baseUrl}/wing_dropdown`, { project_id: projectId }).subscribe({
      next: (res: any) => {
        this.allWingslist = res || [];
      },
      error: () => {
        this.showSnackBar('No units available for selection');
      }
    });
  }



  fetchStages(projectId: any, wingId: any, agreementStatusId: any): void {
    this.http.post(`${this.baseUrl}/fetch_payment_stage`, {
      project_id: projectId,
      wing_id: wingId,
      status_id: 1,
      agreement_status_id: agreementStatusId
    }).subscribe({
      next: (res: any) => {
        this.allStatusList = res.data || [];
      },
      error: () => {
        this.allStatusList = [];
      }
    });
  }



  addDemand(): void {

    const formData = this.addDemandGenerationForm.value;
    if (this.data?.editData?.incentive_slabe_id) {
      formData.incentive_slabe_id = this.data?.editData?.incentive_slabe_id;
      formData.updated_by = this.userId;

    }

    const apiUrl = this.data?.editData?.incentive_slabe_id
      ? `${this.baseUrl}/edit_incentive_slab`
      : `${this.baseUrl}/add_incentive_slab`;

    this.http.post(apiUrl, formData).subscribe({
      next: (res: any) => {

        this.showSuccessDialog(res.message);
        this.dialogRef.close(true);
      },
      error: () => {
        this.showSnackBar('Failed to create demand.');
      }
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
    });
  }

  private showSuccessDialog(message: string): void {
    this.dialog.open(SuccessDialogComponent, {
      data: { message }
    });
  }

}
