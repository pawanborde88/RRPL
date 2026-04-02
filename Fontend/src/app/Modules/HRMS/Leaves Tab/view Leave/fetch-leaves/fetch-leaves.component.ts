import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule, DatePipe } from '@angular/common';
import { environment } from '../../../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { AddLeaveDialogComponent } from '../add-leave-dialog/add-leave-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { EditLeaveDialogComponent } from '../edit-leave-dialog/edit-leave-dialog.component';

  @Component({
    selector: 'app-fetch-leaves',
    standalone: true,
    imports: [
      CommonModule,
      RouterModule,
      AngularMaterialModule,
      TemplateComponent,
      BreadcrumbComponent,
      FormsModule,
    ],
    templateUrl: './fetch-leaves.component.html',
    styleUrl: './fetch-leaves.component.scss'
  })
  export class FetchLeavesComponent {
  loadingState: boolean = true;
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  pipe = new DatePipe('en-US');
  EnquiryList:any[]=[];
  // dataSource = new MatTableDataSource(this.EnquiryList);


  dataSource = new MatTableDataSource<any>();
  selection = new SelectionModel<Object>(true, []);
  @Input() value: string = '';
  usernameFilter: string = '';
  dateFilter: Date | null = null;

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  userIdData: number| null =
  this.roleId === 1 || this.roleId === 10  ?  null : this.userId;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'select',
    'user_name',
    'leave_type',
    'leave_date',
    'return_to_office',
    'crdr',
    'amount',
    'reason',
    'leave_status',
    'comments',
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
      this.http.post(`${this.baseUrl}/fetch_leave_transaction`, obj).subscribe({
        next: (res: any) => {
          console.log(res);
          this.EnquiryList = res.data;
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

  openAddLeaveDialog() {
    this.dialog
      .open(AddLeaveDialogComponent)
      .afterClosed()
      .subscribe({
        next: async (res: any) => {
          console.log(res);
          if (res) {
            await this.getAllLeave();
            this.snackBar.open('New Leave added');
          } else if (res === false) {
            this.snackBar.open('An Error occurred, please try later');
          } else {
            // Dialog closed by clicking outside or close button
          }
        },
      });
  }

  openEditLeaveDialog(item:any) {
    this.dialog
      .open(EditLeaveDialogComponent,{
        data : item
      })
      .afterClosed()
      .subscribe({
        next: async (res: any) => {
          console.log(res);
          if (res) {
            await this.getAllLeave();
            this.snackBar.open('New Leave updated');
          } else if (res === false) {
            this.snackBar.open('An Error occurred, please try later');
          } else {
            // Dialog closed by clicking outside or close button
          }
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



