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
import { MainPermissionComponent } from '../../main-permission/main-permission.component';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { TemplateComponent } from '../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';


interface permissionForm {
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
  selector: 'app-fetch-permission',
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

  templateUrl: './fetch-permission.component.html',
  styleUrls: ['./fetch-permission.component.scss'],
})
export class FetchPermissionComponent {
  baseUrl = environment.API_URL;
  constructor(private http: HttpClient, private snackBar: MatSnackBar, private router: Router) { }
  pipe = new DatePipe('en-US');
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @ViewChild(MatSort) sort!: MatSort;

  roleId = sessionStorage.getItem('role_id');
  permissionList: permissionForm[] = [];
  loadingState: boolean = true;

  @Input() value: string = '';

  // This variable will be used, to enable disable the main Delete button (In table header)
  deleteButtonDisabled: boolean = true;
  displayedColumns: string[] = [
    'index',
    'module_name',
    'permission_id',
    'permission_name',
    'permission_code',
    'active_status_id',
    'description',
    'created_at',
    'updated_at',
    'created_by_string',
    'updated_by_string',
  ];
  readonly panelOpenState = signal(false);
  dataSource = new MatTableDataSource(this.permissionList);
  selection = new SelectionModel<Object>(true, []);

  handleChipClick(event: { index: number; route: string }) {
    const { index, route } = event;
    console.log('Chip clicked:', index);
    console.log('Route:', route);

    // Navigate to the route
    this.router.navigate([route]);
  }



  ngOnInit(): void {
    this.FetchAllpermissionList();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  togglePanel(element: any) {
    element.isOpen = !element.isOpen;
  }
  FetchAllpermissionList() {
    this.loadingState = true;
    this.http.get(`${this.baseUrl}/fetch_all_permissions`).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res) {
          this.permissionList = res;
          this.dataSource = new MatTableDataSource(this.permissionList);
        } else {
          this.permissionList = [];
          this.dataSource = new MatTableDataSource(this.permissionList);
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
          this.FetchAllpermissionList();
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
