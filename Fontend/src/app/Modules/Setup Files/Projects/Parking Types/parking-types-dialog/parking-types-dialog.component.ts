import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { ProjectStampSignatureDialogComponent } from '../../Project Stamp Signature/project-stamp-signature-dialog/project-stamp-signature-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-parking-types-dialog',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableTableComponent,
  ],
  templateUrl: './parking-types-dialog.component.html',
  styleUrl: './parking-types-dialog.component.scss'
})
export class ParkingTypesDialogComponent implements OnInit {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  dataSource = new MatTableDataSource<any>([]);
isAddParking = false;
  isEditing = false;
  loading = false;
  currentEditId: number | null = null;

  parkingTypeForm = new FormGroup({
    parking_type: new FormControl('', Validators.required),
    project_id: new FormControl(this.data.rowData[0].project_id, Validators.required),
    created_by: new FormControl(this.userId),
    parking_type_id: new FormControl(),
  });

  displayedColumns = [
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'sr_no',
      label: '',
      type: 'index',
    },
    { key: 'parking_type', label: 'Parking Type' },
    { key: 'created_by_name', label: 'Created By' },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      type: 'date',
    },
  ];
  headerButtons = [
    {
   label: 'Add Parking',
   icon: 'add_circle',
   color: 'primary',
 disabled: () => false,
   action: () => !this.isAddParking ? this.isAddParking = true : this.isAddParking = false,
   show: () => true,

 }
];
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Parking Type',
      action: 'editParking',
      color: 'primary',
    },
    {
      icon: 'delete',
      tooltip: 'Delete Parking Type',
      action: 'deleteParking',
      color: 'warn',
    },
  ];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ParkingTypesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    console.log(this.data);
    
    this.fetchProjectParkingTypes(this.data.rowData[0].project_id);

  }

  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'editParking':
        this.editParking(row);
        break;
      case 'deleteParking':
        this.deleteParking(row.parking_type_id);
        break;
      default:
        break;
    }
  }

  editParking(row: any): void {
    this.isEditing = true;
    this.isAddParking = true;
    this.currentEditId = row.parking_type_id;
    this.parkingTypeForm.patchValue({
      parking_type: row.parking_type,
      project_id: row.project_id
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isAddParking = false;
    this.currentEditId = null;
    this.parkingTypeForm.reset({
      project_id: this.data.rowData[0].project_id,
      created_by: this.userId
    });
  }

  deleteParking(parkingTypeId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Parking Type?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const requestPayload = {
          parking_type_id: parkingTypeId,
          reason: result.reason,
          created_by: this.userId,
        };

        this.http.post(`${this.baseUrl}/delete_parking_type`, requestPayload).subscribe({
          next: (data: any) => {
            this.snackBar.open('Parking type deleted successfully', 'Close', {
              duration: 3000,
            });
            this.fetchProjectParkingTypes(this.data.rowData[0].project_id);
          },
          error: (err: any) => {
            this.snackBar.open('Unable to delete parking type.', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  fetchProjectParkingTypes(project_id: number): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/get_parking_types`, { project_id: project_id }).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res.data);
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch parking types.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onSubmit(): void {


    this.loading = true;
    const formData = this.parkingTypeForm.value;

    const apiEndpoint = this.isEditing 
      ? 'edit_parking_type' 
      : 'add_parking_type';

    if (this.isEditing) {
      formData.parking_type_id = this.currentEditId;
    }

    this.http.post(`${this.baseUrl}/${apiEndpoint}`, formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.snackBar.open(response.message || 'Operation successful', 'Close', { 
          duration: 3000 
        });
        this.fetchProjectParkingTypes(this.data.rowData[0].project_id);
        this.cancelEdit();
        this.isAddParking = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error:', error);
        this.snackBar.open(error.error?.message || 'Error occurred', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
