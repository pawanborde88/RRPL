
import { SelectionModel } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import { Component, Input, signal, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { MainPermissionComponent } from '../../main-permission/main-permission.component';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { TemplateComponent } from '../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';


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
  selector: 'app-fetch-role-permissions',
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
  templateUrl: './fetch-role-permissions.component.html',
  styleUrl: './fetch-role-permissions.component.scss'
})
export class FetchRolePermissionsComponent {
  baseUrl = environment.API_URL;
  constructor(private http: HttpClient, private snackBar: MatSnackBar, private router: Router, private dialog: MatDialog) { }
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


  @Input() value: string = '';

  // This variable will be used, to enable disable the main Delete button (In table header)
  deleteButtonDisabled: boolean = true;
  displayedColumns: string[] = [
    'index',
    'permission_name',
    'role_name',
    'valid_from',
    'valid_till',
    'active_status_id',
    'created_at',
    'updated_at',
    'created_by_string',
    'updated_by_string',
    'actions',



  ];
  readonly panelOpenState = signal(false);
  dataSource = new MatTableDataSource(this.moduleList);
  selection = new SelectionModel<Object>(true, []);




  ngOnInit(): void {
    this.FetchAllModuleList();
  }

  DeleteSelected(row?: any) {
    this.dialog
      .open(ConfirmDialogComponent)
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.loadingState = true;
          this.snackBar.open(`Loading...`, undefined, { duration: undefined });
          let enqIdArray: number[] = [];
          if (row) {
            enqIdArray.push(Number(row.role_permission_id));
          } else
            enqIdArray = this.selection.selected.map((enq: any) =>
              Number(enq.role_permission_id)
            );

          const obj = {
            account_id: row.account_id,
            role_permission_id: enqIdArray,
            role_id: row.role_id,
          };
          console.log(obj);
          this.http.post(`${this.baseUrl}/delete_assigned_permission`, obj).subscribe({
            next: async (res: any) => {
              console.log(obj);

              await this.FetchAllModuleList();
              // await this.FetchCustomers();
              this.selection.clear();
              this.loadingState = false;
              this.snackBar.open(`${enqIdArray.length} record(s) deleted.`);
            },
            error: (err: any) => {
              console.log(err);
              this.loadingState = false;
              this.snackBar.open(
                `An error occurred while deleting record(s), please try later`
              );
            },
          });
        }
      });
  }


  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  togglePanel(element: any) {
    element.isOpen = !element.isOpen;
  }
  FetchAllModuleList() {
    this.loadingState = true;
    this.http.get(`${this.baseUrl}/fetch_all_role_permissions`).subscribe({
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
