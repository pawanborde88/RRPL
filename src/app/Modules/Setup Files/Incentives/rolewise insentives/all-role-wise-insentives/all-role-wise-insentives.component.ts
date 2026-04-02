import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { CommonAddEditInsentiveDialogComponent } from '../../Insentive Slabs/common-add-edit-insentive-dialog/common-add-edit-insentive-dialog.component';

@Component({
  selector: 'app-all-role-wise-insentives',
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
    ActionColumnComponent,
    ReusableTableComponent
  ],
  templateUrl: './all-role-wise-insentives.component.html',
  styleUrl: './all-role-wise-insentives.component.scss'
})
export class AllRoleWiseInsentivesComponent implements OnInit {
  selectedProjectId: any | null = null;
  dataSource = new MatTableDataSource<any>([]);
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  storageUrl = environment.STORAGE_URL;
  selectedUsers: any[] = [];
  selectedUser: any[] = [];
  projectsList: any[] = [];

  loading = false;
  baseUrl = environment.API_URL;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private router: Router,
  ) {}
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
      label: 'Sr. No',
      type: 'index',
    },
    { key: 'project_name', label: 'Project' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'role_name', label: 'Role' },
    { key: 'incentive_percentage', label: 'Incentive (%)' },
    
    { 
      key: 'created_at', 
      label: 'Created At', 
      type: 'date' 
    },
    { 
      key: 'updated_at', 
      label: 'Updated At', 
      type: 'date' 
    },
    { key: 'created_by_name', label: 'Created By' },
  ];

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);
  selectedColumns = this.displayedColumns.map((col) => col.key); // Default select all columns
  projectActions = [
    {
      action: 'editRoleWiseIncentive',
      icon: 'edit',
      tooltip: 'Edit Role Wise Incentive',
      color: 'primary',
    },
    {
      action: 'deleteRoleWiseIncentive',
      icon: 'delete',
      tooltip: 'Delete Role Wise Incentive',
      color: 'warn',
      show: () => [1, 2, 4].includes(this.roleId) // Only show for specific roles
    },
  ];
  onColumnSelectionChange() {
    // Update columnKeys based on selected columns
    this.columnKeys = this.selectedColumns;
  }
  headerButtons = [
    {
      label: '  Incentive Slabs',
      icon: 'view_timeline',
      color: 'primary',
      disabled: () => false,
      action: () => this.router.navigate(['/target-achievement/incentive-slabs/all-insentive-slabs']),
      show: () => true,
    },
    
    {
      label: '  Add Role Wise Incentive',
      icon: 'view_timeline',
      color: 'primary',
      disabled: () => false,
      action: () => this.addRoleWiseIncentive(),
      show: () => true,

    },
    
 
  ];
  ngOnInit(): void {
    this.fetchAllProjects();
    if(this.selectedProjectId) {
      this.fetchAllIncentiveSlabs();
    }
  }
  onProjectChange(event: any): void {
      this.selectedProjectId = event;
    this.fetchAllIncentiveSlabs();
  }
  fetchAllProjects(): void {
    this.loading = true;
    this.http.post<any>(`${this.baseUrl}/user_project_dropdown`, { user_id:  this.userId }).subscribe({
      next: (res:any) => {
        this.projectsList = res || [];
        this.loading = false;
      },
    });
  }
 
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'editRoleWiseIncentive':
        this.openRoleWiseIncentiveDialog('edit', row);
        break;
      case 'deleteRoleWiseIncentive':
        this.deleteRoleWiseIncentive(row);
        break;
      default:
        break;
    }
  }
  deleteRoleWiseIncentive(row: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
        data: { message: 'Are you sure you want to delete role wise incentive?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          role_wise_incentive_percentage_id: row.role_wise_incentive_percentage_id || row.id,
        };
        this.http
          .post(`${this.baseUrl}/delete_role_wise_incentive`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open(data.message, 'Close', {
                duration: 3000,
              });
              this.fetchAllIncentiveSlabs(); // Ensure this is called here to update the list
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Role Wise Incentive.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
  fetchAllIncentiveSlabs(): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/fetch_role_wise_incentives`, { project_id: this.selectedProjectId }).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res.data);
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch project Users.', 'Close', {
          duration: 3000,
        });
      },
    });
  }


  addRoleWiseIncentive() {
    this.openRoleWiseIncentiveDialog('add');
  }

  openRoleWiseIncentiveDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(CommonAddEditInsentiveDialogComponent, {
      width: '700px',
      data: { action, row, type: 'role-wise' },
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllIncentiveSlabs();
      }
    });
  }

}
