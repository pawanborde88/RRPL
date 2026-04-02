
import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AddLeaveDialogComponent } from '../../Leaves Tab/view Leave/add-leave-dialog/add-leave-dialog.component';
import { EditLeaveDialogComponent } from '../../Leaves Tab/view Leave/edit-leave-dialog/edit-leave-dialog.component';
import { AddEditPerformanceListComponent } from '../add-edit-performance-list/add-edit-performance-list.component';

@Component({
  selector: 'app-performance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    TemplateComponent,
    BreadcrumbComponent,
    FormsModule,
  ],
  templateUrl: './performance-list.component.html',
  styleUrl: './performance-list.component.scss',
})
export class PerformanceListComponent {
  loadingState: boolean = true;
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  pipe = new DatePipe('en-US');
  EnquiryList: any[] = [];
  // dataSource = new MatTableDataSource(this.EnquiryList);

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
    'select',
    'user_name',
    'parameter',
    'rating',
    'date',
    'comment',
    'created_by_string',
    'updated_by_string',
    'created_at',
    'updated_at',
  ];

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog 
  ) {}

  ngOnInit(): void {
    this.getAllLeave();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  getAllLeave(): Promise<void> {
    this.loadingState = true;
    this.snackBar.open(`Loading...`, undefined, { duration: undefined });
    let obj = {
      user_id: this.userIdData,
    };
    console.log(obj);

    let promise = new Promise<void>((resolve, reject) => {
      this.http.post(`${this.baseUrl}/fetch_user_performance`, obj).subscribe({
        next: (res: any) => {
          console.log(res);
          this.EnquiryList = res;
          this.dataSource = new MatTableDataSource(this.EnquiryList);
        },
        error: (err: any) => {
          console.log(err);
          this.EnquiryList = [];
          this.dataSource = new MatTableDataSource(this.EnquiryList);
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
  openPerformanceDialog(action: string, Item?: any): void {
    const dialogRef = this.dialog.open(AddEditPerformanceListComponent, {
      data: {
        title: action === 'add' ? 'Add Performance' : 'Update Performance',
        apiUrl:
          action === 'add' ? 'add_user_performance' : 'update_user_performance',
        successMessage:
          action === 'add'
            ? 'Performance added successfully'
            : 'Performance updated successfully',
        onUploadComplete: Item,
      },
    });
    dialogRef.disableClose = true;
    dialogRef.afterClosed().subscribe((result) => {
      debugger;
      if (result && result.success) {
        console.log('Dialog closed with result:', result);
        this.getAllLeave();
      } else {
        console.log('Dialog closed without a successful result.');
      }
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



