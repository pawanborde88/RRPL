import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { TemplateComponent } from '../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { environment } from '../../../../environments/environment';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { log } from 'console';

@Component({
  selector: 'app-view-mob-email-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    MatCardModule,
    MatProgressBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule


  ],
  templateUrl: './view-mob-email-log.component.html',
  styleUrl: './view-mob-email-log.component.scss'
})
export class ViewMobEmailLogComponent implements OnInit {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  pipe = new DatePipe('en-US');
  dataSource = new MatTableDataSource<any>([]);
  loading: boolean = false; // Initialize loading state
  projectLeadID: string = '';
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,

    private route: ActivatedRoute

  ) { }
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.projectLeadID = params['project_lead_id'];
      console.log(this.projectLeadID);

    });
    this.fetchAllLogs();

  }
  displayedColumns = [

    { key: 'user_name', label: 'User Name' },
    { key: 'mob_no', label: 'Mobile Number' },
    { key: 'created_at', label: 'View At' },


  ];

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);

  fetchAllLogs(): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/fetch_viewed_mob_no`, { project_lead_id: this.projectLeadID }).subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  applyFilter(searchText: string) {
    this.dataSource.filter = searchText.trim().toLowerCase();
  }
}
