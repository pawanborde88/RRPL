import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';

import { TemplateComponent } from '../../template/template.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-delete-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
     // Add the pipe here
  ],
  templateUrl: './delete-log.component.html',
  styleUrl: './delete-log.component.scss',
})
export class DeleteLogComponent implements OnInit {
  dataSource = new MatTableDataSource<any>([]);
  baseUrl = environment.API_URL;
  loading: boolean = false; // To show the progress bar while loading data
  columnKeys: string[] = [];
  apiName: string = '';
  message: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  ngOnInit() {
    const stateData = history.state;
    this.apiName = stateData.api || '';
    this.message = stateData.message || 'Delete Logs';
  
    // 💡 Now call setDisplayedColumns AFTER apiName is assigned
    this.setDisplayedColumns();
  
    if (this.apiName) {
      this.fetchAllLogs();
    } else {
      this.snackBar.open('API Name is missing!', 'Close', { duration: 3000 });
    }
  }
  
  displayedColumns: any[] = [];
  

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) { 

    
  }

  setDisplayedColumns(): void {
    this.displayedColumns = [
      { key: 'sr_no', label: 'Sr. No.' },
      { key: 'reason', label: 'Reason' },
      ...(this.apiName === 'project_delete_history'
        ? [{ key: 'project_name', label: 'Project Name' }]
        : [{ key: 'customer_name', label: 'Client Name' }]),
      ...(this.apiName !== 'project_delete_history'
        ? [{ key: 'mobile_no', label: 'Mobile Number' }]
        : []),
      { key: 'deleted_by', label: 'Deleted By' },
      { key: 'created_at', label: 'Deleted At' },
    ];
  
    // Update column keys for rendering the table
    this.columnKeys = this.displayedColumns.map((col) => col.key);
  }
  
  fetchAllLogs(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/${this.apiName}`).subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
        this.loading = false;
        
        // Assign paginator and sort
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      error: (err: any) => {
        this.loading = false;
        console.error(err);
        this.snackBar.open('Unable to fetch delete logs.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
