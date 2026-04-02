



import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { MatDialog } from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { SnackbarService } from '../../../../../Service/snackbar.service';
import { AddEditLeaveCreditComponent } from '../add-edit-leave-credit/add-edit-leave-credit.component';

@Component({
  selector: 'app-leave-credit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    TemplateComponent,
    BreadcrumbComponent,
    FormsModule,
  ],
  templateUrl: './leave-credit.component.html',
  styleUrl: './leave-credit.component.scss',
})
export class LeaveCreditComponent {
  loadingState: boolean = true;
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  pipe = new DatePipe('en-US');
  leaveCreditList: any[] = [];
  dataSource = new MatTableDataSource<any>();
  selection = new SelectionModel<Object>(true, []);
  @Input() value: string = '';
  usernameFilter: string = '';
  dateFilter: Date | null = null;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  userIdData: number | null =
    this.roleId === 1 || this.roleId === 10 ? null : this.userId;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'index',
    'leave_type',
    'monthly_credit',
    'annual_credit',
    'annual_carry_forward',
    'created_by_string',
    'updated_by_string',
    'created_at',
    'updated_at',
    'actions',
  ];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.getAllHoliday();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getAllHoliday(): Promise<void> {
    this.loadingState = true;
    this.snackBar.open(`Loading...`, undefined, { duration: undefined });
    let promise = new Promise<void>((resolve, reject) => {
      this.http.get(`${this.baseUrl}/fetch_leave_credits`).subscribe({
        next: (res: any) => {
          console.log(res);
          this.leaveCreditList = res;
          this.dataSource = new MatTableDataSource(this.leaveCreditList);
        },
        error: (err: any) => {
          console.log(err);
          this.leaveCreditList = [];
          this.dataSource = new MatTableDataSource(this.leaveCreditList);
          this.loadingState = false;
          this.snackBar.open(
            'Error while fetching enquiries, please try later'
          );
          return reject();
        },
        complete: async () => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.loadingState = false;
          this.snackBar.dismiss();
          return resolve();
        },
      });
    });

    return promise;
  }

  openHolidayDialog(action: string, Item?: any): void {
    const dialogRef = this.dialog.open(AddEditLeaveCreditComponent, {
      data: {
        title: action === 'add' ? 'Add Leave Credit' : 'Update Leave Credit',
        apiUrl:
          action === 'add' ? 'add_leave_credits' : 'update_leave_credits',
        successMessage:
          action === 'add'
            ? 'leave Credit added successfully'
            : 'leave Credit updated successfully',
        onUploadComplete: Item,
      },
    });
    dialogRef.disableClose = true;
    dialogRef.afterClosed().subscribe((result) => {
      debugger;
      if (result && result.success) {
        console.log('Dialog closed with result:', result);
        this.getAllHoliday();
      } else {
        console.log('Dialog closed without a successful result.');
      }
    });
  }

  deleteLoading: boolean = false;
  deleteHoliday(ID: any): void {
    debugger
    this.deleteLoading = true;
    const url = `${this.baseUrl}/delete_leave_credits`;

    this.http.post(url, { leave_credit_id: ID }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.snackbarService.showDataSnackbar('Leave Credit deleted');
          this.getAllHoliday();
        } else {
          this.snackbarService.showDataSnackbar(
            'An error occurred, please try later'
          );
        }
      },
      error: () => {
        this.snackbarService.showDataSnackbar(
          'An error occurred, please try later'
        );
      },
      complete: () => {
        this.deleteLoading = false;
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



