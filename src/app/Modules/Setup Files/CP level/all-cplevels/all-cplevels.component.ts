import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddCPLevelsComponent } from '../add-cplevels/add-cplevels.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
interface ActionButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}
@Component({
  selector: 'app-all-cplevels',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableTableComponent,
    TruncatePipe,
    // Add the pipe here
  ],
  templateUrl: './all-cplevels.component.html',
  styleUrl: './all-cplevels.component.scss',
})
export class AllCPLevelsComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state

  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  allTeamList: any[] = [];

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  displayedColumns = [
       {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'sr_no',
      label: '',
      type: 'index',
    },
    { key: 'cp_type', label: 'CP Type' },
    { key: 'description', label: 'Description' , type: 'truncate'},
    {
      key: 'active_status',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.active_status_id === 1 ? 'green' : 'red',
    },
    { key: 'created_at', label: 'Created At', type: 'date' },
        { key: 'updated_at', label: 'Updated At', type: 'date' },

   
  ];

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}

  ngOnInit(): void {
    this.fetchAllCPLevels();
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  private readonly roleData = sessionStorage.getItem('role_id');
  hasPermission(...permissions: number[]): boolean {
    if (!this.roleData) return false;
    return this.roleData != null && permissions.some(permission => this.roleData!.includes(permission.toString()));
  }
  headerButtons: ActionButton[] = [
    {
      label: 'Add CP Level',
      icon: 'assignment_ind',
      color: 'primary',
      disabled: () => false,
      action: () => this.openaddEditCPLevelDialog('add'),
      show: () => true,
    },
    
  ];
  fetchAllCPLevels(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/fetch_all_cp_level`).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource<any>(res);
        this.dataSource.data = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch channel partners.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Source',
      action: 'leadAssign',
      color: 'primary',
    },
    ...(this.roleId === 2
      ? [
          {
            icon: 'delete',
            tooltip: 'Delete Project',
            action: 'deleteProject',
            color: 'warn',
          },
        ]
      : []),
  ];
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.openaddEditCPLevelDialog('edit', row);

        break;
      case 'deleteProject':
        this.deleteCPLevels(row.cp_type_id);
        break;
      default:
        break;
    }
  }
  selectedProjects: any[] = [];

  toggleSelection(isChecked: boolean, row: any): void {
    if (!row || !row.project_id) {
      console.error('Invalid row data');
      return;
    }

    if (isChecked) {
      if (!this.selectedProjects.some((p) => p.user_id === row.user_id)) {
        this.selectedProjects.push({ ...row }); // Add a copy of the project
      }
    } else {
      this.selectedProjects = this.selectedProjects.filter(
        (p) => p.user_id !== row.user_id
      );
    }

    console.log('Selected Projects:', this.selectedProjects);
  }
  openaddEditCPLevelDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddCPLevelsComponent, {
      minWidth: '30vw',
      maxWidth: '30vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add CP Level' : 'Edit CP Level',
        apiUrl: action === 'add' ? 'add_cp_level' : 'edit_cp_level',
        successMessage:
          action === 'add'
            ? 'CP Level added successfully'
            : 'CP Level updated successfully',
        rowData: row, // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllCPLevels();
      }
    });
  }

  deleteCPLevels(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Channel Partner?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          cp_type_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_cp_type`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Team deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllCPLevels();
              // Ensure this is called here to update the teams
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Team.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
