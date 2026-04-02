import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-project-owner',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableTableComponent,
  ],
  templateUrl: './project-owner.html',
  styleUrl: './project-owner.scss',
})
export class ProjectOwner implements OnInit {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  dataSource = new MatTableDataSource<any>([]);
  isAddLandOwner = false;
  isEditing = false;
  loading = false;
  currentEditId: number | null = null;

  landOwnerForm = new FormGroup({
    land_owner_name: new FormControl('', Validators.required),
    project_id: new FormControl(this.data.rowData[0].project_id, Validators.required),
    created_by: new FormControl(this.userId),
    land_owner_setup_id: new FormControl(),
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
    { key: 'land_owner_name', label: 'Land Owner Name' },
    { key: 'property_name', label: 'Property Name' },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },
  ];

  headerButtons = [
    {
      label: 'Add Land Owner',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => !this.isAddLandOwner ? this.isAddLandOwner = true : this.isAddLandOwner = false,
      show: () => true,
    }
  ];

  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Land Owner',
      action: 'editLandOwner',
      color: 'primary',
    },
    {
      icon: 'delete',
      tooltip: 'Delete Land Owner',
      action: 'deleteLandOwner',
      color: 'warn',
    },
  ];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<ProjectOwner>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    console.log(this.data);
    this.fetchProjectLandOwners(this.data.rowData[0].project_id);
  }

  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'editLandOwner':
        this.editLandOwner(row);
        break;
      case 'deleteLandOwner':
        this.deleteLandOwner(row.land_owner_setup_id);
        break;
      default:
        break;
    }
  }

  editLandOwner(row: any): void {
    this.isEditing = true;
    this.isAddLandOwner = true;
    this.currentEditId = row.land_owner_setup_id;
    this.landOwnerForm.patchValue({
      land_owner_name: row.land_owner_name,
      project_id: row.project_id
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.isAddLandOwner = false;
    this.currentEditId = null;
    this.landOwnerForm.reset({
      project_id: this.data.rowData[0].project_id,
      created_by: this.userId
    });
  }

  deleteLandOwner(landOwnerSetupId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Land Owner?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload: any = {
          land_owner_setup_id: landOwnerSetupId,
        };

        this.http.post(`${this.baseUrl}/delete_land_owner`, requestPayload).subscribe({
          next: (data: any) => {
            this.snackBar.open('Land owner deleted successfully', 'Close', {
              duration: 3000,
            });
            this.fetchProjectLandOwners(this.data.rowData[0].project_id);
          },
          error: (err: any) => {
            this.snackBar.open('Unable to delete land owner.', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  fetchProjectLandOwners(project_id: number): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.http.post(`${this.baseUrl}/fetch_land_owners`, { project_id: project_id }).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res.data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open('Unable to fetch land owners.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onSubmit(): void {
    if (this.landOwnerForm.invalid) {
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    const formData: any = { ...this.landOwnerForm.value };

    const apiEndpoint = this.isEditing
      ? 'update_land_owner'
      : 'add_land_owner';

    if (this.isEditing) {
      formData.land_owner_setup_id = this.currentEditId;
      formData.updated_by = this.userId;
      delete formData.created_by;
    } else {
      delete formData.land_owner_setup_id;
    }

    this.http.post(`${this.baseUrl}/${apiEndpoint}`, formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.snackBar.open(response.message || 'Operation successful', 'Close', {
          duration: 3000
        });
        this.fetchProjectLandOwners(this.data.rowData[0].project_id);
        this.cancelEdit();
      },
      error: (error) => {
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Error:', error);
        this.snackBar.open(error.error?.message || 'Error occurred', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
