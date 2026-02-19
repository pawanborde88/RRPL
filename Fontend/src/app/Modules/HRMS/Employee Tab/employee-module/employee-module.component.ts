
import { SelectionModel } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { environment } from '../../../../../environments/environment';
export interface Employee {
  serial_no: number;
  user_name: string;
  designation: string;
  department_name: string;
  description: string;
  reporting_manager: string;
  department: string;
  permanent_address: string;
  current_address: string;
  join_date: string;
  exit_date: string;
  exit_reason: string;
  phone: string;
  alternate_phone: string;
  official_email: string;
  personal_email: string;
  emergency_contact_person: string;
  emergency_contact_no: string;
  relation: string;
  aadhaar_no: string;
  pan_no: string;
  active_status_id: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  status: string;
}
@Component({
  selector: 'app-employee-module',
  standalone: true,
  imports: [
    AngularMaterialModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    RouterModule,
  ],
  templateUrl: './employee-module.component.html',
  styleUrl: './employee-module.component.scss',
})
export class EmployeeModuleComponent {
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  filteredDataSource: any[] = [];
  usernameFilter: string = '';
  loadingState: boolean = true;
  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  selection = new SelectionModel<Object>(true, []);
  storageUrl = environment.STORAGE_URL;
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) // private fetch: FetchFunctionsService
  {}

  ngOnInit(): void {
    this.fetchEmployees();
  }
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  displayedColumns: string[] = [
    'serial_no',
    'employee_id',
    'emp_photo',
    'user_name',
    'designation',
    'department_name',
    'employment_type',
    'reporting_manager',
    'join_date',
    'phone',
    'official_email',
    'status',
    'created_by',
    'created_at',
    'updated_by',
    'updated_at',
    'actions',
  ];
  fetchEmployees(): void {
    this.loadingState = true;
    const obj = {
      account_id: sessionStorage.getItem('account_id'),
    };

    console.log('Fetching Employees with Data:', obj);

    this.http
      .post<{ users: Employee[] }>(`${this.baseUrl}/fetch_employees`, obj)
      .subscribe({
        next: (response) => {
          if (response && response.users) {
            this.dataSource.data = response.users;
            console.log('Data fetched successfully');
          } else {
            console.error('Unexpected response format:', response);
            this.snackBar.open('Unexpected response format received.', '', {
              duration: 3000,
            });
          }
        },
        error: (err) => {
          this.snackBar.open('Unable to fetch employee data.', '', {
            duration: 3000,
          });
          console.error('Error fetching data:', err);
        },
        complete: () => {
          this.loadingState = false;
          console.log('Fetch employees operation complete');
        },
      });
  }
  deleteEmployee(employeeID: any): void {
    // const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
    //    minWidth: '25vw',
    //   data: { message: 'Are you sure you want to delete this employee?' }
    // });
    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     let requestPayload  = {
    //       employee_id: employeeID
    //     };
    //     this.http.post(`${this.baseUrl}/delete_employee`, requestPayload).subscribe({
    //       next: (data: any) => {
    //         console.log(data);
    //         this.snackBar.open('Employee deleted successfully', 'Close', {
    //           duration: 3000,
    //         });
    //         this.fetchEmployees(); // Ensure this is called here to update the plans
    //       },
    //       error: (err: any) => {
    //         console.log(err);
    //         this.snackBar.open('Unable to Delete Records.', 'Close', {
    //           duration: 3000,
    //         });
    //       }
    //     });
    //   }
    // });
  }
  applyFilter() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filterValue = filter.trim().toLowerCase();
      return data.user_name.toLowerCase().includes(filterValue);
    };
    this.dataSource.filter = this.usernameFilter.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  clearFilter() {
    this.usernameFilter = '';
    this.applyFilter();
  }
}
