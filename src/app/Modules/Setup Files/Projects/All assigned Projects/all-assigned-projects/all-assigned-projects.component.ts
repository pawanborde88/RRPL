import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-assigned-projects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    ReusableTableComponent
     // Add the pipe here
  ],
  templateUrl: './all-assigned-projects.component.html',
  styleUrl: './all-assigned-projects.component.scss',
})
export class AllAssignedProjectsComponent {
 baseUrl = environment.API_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  loading = false;
  allAssignedProjects: any[] = [];
  allSalesExecutives: any[] = [];

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
    { key: 'user_name', label: 'User Names' },
    { key: 'role', label: 'Roles' },
  ];
  columnKeys: string[] = this.displayedColumns.map((col) => col.key);

  dataSource = new MatTableDataSource<any>([]);
  leadAssignForm: FormGroup;
  projectActions = [
    {
      icon: 'no_accounts',
      tooltip: 'Unassign Project',
      action: 'deleteProject',
      color: 'primary',
    },
  ];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AllAssignedProjectsComponent>
  ) {
    this.leadAssignForm = new FormGroup({
      user_id: new FormControl([]),
      project_id: new FormControl(this.data.project_id),
      created_by: new FormControl(this.userId),
    });
  }

  ngOnInit(): void {
    this.fetchAllAssignedProjects();
    this.fetchAllSalesExecutives();
  }

  fetchAllAssignedProjects(): void {
    this.loading = true;
    this.http
      .post(`${this.baseUrl}/fetch_assigned_projects`, {
        project_id: this.data.project_id,
      })
      .subscribe({
        next: (res: any) => {
          this.dataSource = new MatTableDataSource(res);

          this.dataSource.data = res;

          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Unable to fetch assigned projects.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchAllSalesExecutives(): void {
    this.http
      .post(`${this.baseUrl}/assign_users_dropdown`, { project_id: this.data.project_id })
      .subscribe({
        next: (res: any) => {
          this.allSalesExecutives = res.map((item: any) => ({
            ...item,
            full_name: `${item.first_name} ${item.last_name}`,
          }));
        },
        error: () => {
          this.snackBar.open('Unable to fetch sales executives.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onSubmit(): void {
    if (this.leadAssignForm.invalid) {
      return;
    }

    const payload = {
      project_id: Array.isArray(this.leadAssignForm.get('project_id')?.value)
        ? this.leadAssignForm.get('project_id')?.value
        : [this.leadAssignForm.get('project_id')?.value],
      user_id: Array.isArray(this.leadAssignForm.get('user_id')?.value)
        ? this.leadAssignForm.get('user_id')?.value
        : [this.leadAssignForm.get('user_id')?.value],
      created_by: this.leadAssignForm.get('created_by')?.value,
    };

    this.http.post(`${this.baseUrl}/assign_project`, payload).subscribe(
      () => {
        this.snackBar.open('Project Assigned Successfully', 'Close', {
          duration: 3000,
        });
        this.fetchAllAssignedProjects();
        this.leadAssignForm.patchValue({
          user_id: [],
        });
      },
      () => {
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    );
  }

  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'deleteProject':
        this.unAssignProjects(row.assign_project_id);
        break;
      default:
        break;
    }
  }

  unAssignProjects(projectID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to unassign this project?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.http
          .post(`${this.baseUrl}/delete_sales_executive`, {
            assign_project_id: [projectID]
          })
          .subscribe({
            next: () => {
              this.snackBar.open('Project unassigned successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllAssignedProjects();
            },
            error: () => {
              this.snackBar.open('Unable to unassign project.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
