
import { SelectionModel } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import { Component, Input, signal, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

import { MainPermissionComponent } from '../../main-permission/main-permission.component';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { AddEditUserRoleDialogComponent, AddEditUserRoleDialogData } from '../add-edit-user-role-dialog/add-edit-user-role-dialog.component';

interface moduleListForm {
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
  selector: 'app-fetch-user-role',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    RouterOutlet,
    TemplateComponent,
    BreadcrumbComponent,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    MainPermissionComponent
  ],
  templateUrl: './fetch-user-role.component.html',
  styleUrl: './fetch-user-role.component.scss'
})
export class FetchUserRoleComponent {
  baseUrl = environment.API_URL;
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}
  pipe = new DatePipe('en-US');
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  roleId = sessionStorage.getItem('role_id');
  moduleList: moduleListForm[] = [];
  loadingState: boolean = true;

  handleChipClick(event: { index: number; route: string }) {
    const { index, route } = event;
    console.log('Chip clicked:', index);
    console.log('Route:', route);

    // Navigate to the route
    this.router.navigate([route]);
  }

  openAddEditUserRoleDialog(mode: 'add' | 'edit', row?: { user_role_id?: string | number }): void {
    const data: AddEditUserRoleDialogData = {
      mode,
      userRoleId: row?.user_role_id,
    };
    const dialogRef = this.dialog.open(AddEditUserRoleDialogComponent, {
      width: 'min(90vw, 420px)',
      data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.FetchAllModuleList();
    });
  }


  @Input() value: string = '';

  // This variable will be used, to enable disable the main Delete button (In table header)
  deleteButtonDisabled: boolean = true;
  displayedColumns: string[] = [
    'index',
    'username',
    'role_name',
    'valid_from',
    'valid_till',
    'active_status_id',
    'created_at',
    'updated_at',
    'created_by_string',
    'updated_by_string',



  ];
  readonly panelOpenState = signal(false);
  dataSource = new MatTableDataSource(this.moduleList);
  selection = new SelectionModel<Object>(true, []);





  ngOnInit(): void {
    this.FetchAllModuleList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  togglePanel(element: any) {
    element.isOpen = !element.isOpen;
  }
  FetchAllModuleList() {
    this.loadingState = true;
    this.http.get(`${this.baseUrl}/fetch_all_user_roles`).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res) {
          this.moduleList = res;
          this.dataSource = new MatTableDataSource(this.moduleList);
        } else {
          this.moduleList = [];
          this.dataSource = new MatTableDataSource(this.moduleList);
        }
        this.dataSource.paginator = this.paginator;
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch Module.');
      },
      complete: () => {
        this.loadingState = false;
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
