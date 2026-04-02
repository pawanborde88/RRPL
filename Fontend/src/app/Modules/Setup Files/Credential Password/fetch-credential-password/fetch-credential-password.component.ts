
import { SelectionModel } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';


interface CredentialForm {
  institute_name: string;
  login_id: string;
  password: string;
  sm_name: string;
  link: string;
  dsa_code: string;
  created_by: string | null,
  created_at: string | null,
  updated_by: string | null,
  updated_at: string | null,
}




    @Component({
      selector: 'app-fetch-credential-password',
      standalone: true,
    imports: [AngularMaterialModule, CommonModule, RouterOutlet, TemplateComponent,BreadcrumbComponent, ReactiveFormsModule , RouterModule,FormsModule],

      templateUrl: './fetch-credential-password.component.html',
      styleUrl: './fetch-credential-password.component.scss'
    })
    export class FetchCredentialPasswordComponent {

  baseUrl = environment.API_URL;
  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @ViewChild(MatSort) sort!: MatSort;

  roleId = sessionStorage.getItem('role_id');
  CredentialList: CredentialForm[] = [];
  loadingState: boolean = true;

  @Input() value: string = '';

  // This variable will be used, to enable disable the main Delete button (In table header)
  deleteButtonDisabled: boolean = true;
  displayedColumns: string[] = [
   'index',
  'institute_name',
  'login_id',
  'password',
  'link',
  'sm_name',
  'dsa_code',
  'created_at',
  'updated_at',
  'created_by_string',
  'updated_by_string'
];

  dataSource = new MatTableDataSource(this.CredentialList);
  selection = new SelectionModel<Object>(true, []);

  ngOnInit(): void {
    this.FetchCredential();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  FetchCredential() {
    this.loadingState = true;
    this.http.get(`${this.baseUrl}/fetch_credentials`).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.length > 0) {
          this.CredentialList = res.filter((x: any) => x.role_id !== 1);
          this.dataSource = new MatTableDataSource(this.CredentialList);
        } else {
          this.CredentialList = [];
          this.dataSource = new MatTableDataSource(this.CredentialList);
        }
        this.dataSource.paginator = this.paginator;
      },
      error: (err: any) => {
        console.log(err);
        this.snackBar.open('Unable to fetch account Credential.');
      },
      complete: () => {
        this.loadingState = false;
        this.dataSource.sort = this.sort;
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
