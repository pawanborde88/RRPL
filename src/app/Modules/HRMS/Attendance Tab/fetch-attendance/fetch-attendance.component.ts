import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule, DatePipe } from '@angular/common';
import { environment } from '../../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';

@Component({
  selector: 'app-fetch-attendance',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    TemplateComponent,
    BreadcrumbComponent,
    FormsModule,
  ],
  templateUrl: './fetch-attendance.component.html',
  styleUrls: ['./fetch-attendance.component.scss'],
})
export class FetchAttendanceComponent implements OnInit, AfterViewInit {
  loadingState: boolean = true;
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  pipe = new DatePipe('en-US');
  dataSource = new MatTableDataSource<any>();
  selection = new SelectionModel<Object>(true, []);
  @Input() value: string = '';
  usernameFilter: string = '';
  dateFilter: Date | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'select',
    'serial_no',
    'user_name',
    'Punched_In',
    'Punched_Out',
    'total_hours',
    'created_at',
    'updated_at',
  ];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.getAllAttendance();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getAllAttendance(): void {
    this.loadingState = true;
    const obj = {
      account_id: sessionStorage.getItem('account_id'),
    };

    this.http.post(`${this.baseUrl}/fetch_all_attendance`, obj).subscribe({
      next: (response: any) => {
        this.dataSource.data = response;
        console.log('Data fetched successfully');
      },
      error: (err) => {
        this.snackBar.open('Unable to fetch attendance.', '', {
          duration: 3000,
        });
        console.error('Error fetching data:', err);
      },
      complete: () => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.loadingState = false;
        console.log('Fetch attendance complete');
      },
    });
  }

  applyFilter(event?: Event): void {
    const filterValue = this.value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  }

  clearFilter(): void {
    this.value = '';
    this.applyFilter();
  }

  handleSelect(row: any): void {
    this.selection.toggle(row);
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }
}
