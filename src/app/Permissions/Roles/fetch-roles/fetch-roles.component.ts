import { SelectionModel } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import { Component, Input, signal, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MainPermissionComponent } from '../../main-permission/main-permission.component';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { ReusableTableComponent } from '../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';
import { AddRolesComponent } from '../add-roles/add-roles.component';
import { MatDialog } from '@angular/material/dialog';


interface CredentialForm {
  institute_name: string;
  login_id: string;
  password: string;
  sm_name: string;
  link: string;
  dsa_code: string;
  created_by: string | null;
  created_at: string | null;
  updated_by: string | null;
  updated_at: string | null;
}



@Component({
  selector: 'app-fetch-roles',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    ReactiveFormsModule,
    MainPermissionComponent,
    ReusableTableComponent

  ],
  templateUrl: './fetch-roles.component.html',
  styleUrl: './fetch-roles.component.scss'
})
export class FetchRolesComponent {
  baseUrl = environment.API_URL;
  constructor(
    private http: HttpClient,
    private router: Router,
    private dialog: MatDialog,

    private snackBar: MatSnackBar,
  ) { } pipe = new DatePipe('en-US');
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @ViewChild(MatSort) sort!: MatSort;

  roleId = sessionStorage.getItem('role_id');
  accountID = sessionStorage.getItem('account_id');
  moduleList: CredentialForm[] = [];
  loading: boolean = true;

  @Input() value: string = '';

  handleChipClick(event: any) {
    const { index, route } = event;
    console.log('Chip clicked:', index);
    console.log('Route:', route);

    // Navigate to the route
    this.router.navigate([route]);
  }


  // This variable will be used, to enable disable the main Delete button (In table header)
  deleteButtonDisabled: boolean = true;


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
      label: 'Sr.No',
      type: 'index', // Add this to identify it as an index column
    },

    { key: 'role_name', label: 'Role' },
    { key: 'role_id', label: 'Role ID' },
    { key: 'description', label: 'Description' },

    {
      key: 'active_status',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.active_status_id === 1 ? 'green' : 'red',
    },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Role',
      action: 'leadAssign',
      color: 'primary',
    },
    ,
  ];
  readonly panelOpenState = signal(false);
  dataSource = new MatTableDataSource(this.moduleList);
  selection = new SelectionModel<Object>(true, []);


  headerButtons = [
    {
      label: 'Add Role',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddEditSorceDialog('add'),
      show: () => true,
    }
  ];

  openAddEditSorceDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddRolesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Role' : 'Edit Role',
        apiUrl: action === 'add' ? 'add_role' : 'update_role',
        successMessage:
          action === 'add'
            ? 'Role added successfully'
            : 'Role updated successfully',
        rowData: row?.role_id, // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.FetchAllModuleList(); // Refresh the list if data was modified
      }
    });
  }


  ngOnInit(): void {
    this.FetchAllModuleList();
  }

  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.openAddEditSorceDialog('edit', row);

        break;
      // case 'deleteProject':
      //   this.deleteButtonDisabled(row.source_id);
      //   break;
      // default:
      //   break;
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  togglePanel(element: any) {
    element.isOpen = !element.isOpen;
  }
  FetchAllModuleList() {
    this.loading = true;
    this.http.get(`${this.baseUrl}/fetch_all_roles`).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.length > 0) {
          this.moduleList = res;
          this.dataSource = new MatTableDataSource(this.moduleList);
        } else {
          this.moduleList = [];
          this.dataSource = new MatTableDataSource(this.moduleList);
        }
        this.dataSource.paginator = this.paginator;
        this.loading = false;

      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch Module.');
      },
      complete: () => {
        this.loading = false;
        this.dataSource.sort = this.sort;
      },
    });
  }

  deleteModule(id: any) {
    this.http
      .post(`${this.baseUrl}/delete_module`, { module_id: id })
      .subscribe({
        next: (res: any) => {
          console.log(res);
          if (res.success) {
            this.snackBar.open('Module Deleted Successfully');
          }
        },
        error: (err: any) => {
          console.log(err);
          this.snackBar.open(
            'Error occurred while adding user, please try later'
          );
        },
        complete: () => {
          this.FetchAllModuleList();
        },
      });
  }

  /* Filter field logic */
  applyFilter(event: Event) {
    const filterValue = this.value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  handleSelect(row: any) {
    this.selection.toggle(row);
    if (this.selection.hasValue()) this.deleteButtonDisabled = false;
    else this.deleteButtonDisabled = true;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.deleteButtonDisabled = true;
      return;
    }
    this.selection.select(...this.dataSource.data);
    this.deleteButtonDisabled = false;
  }
}
