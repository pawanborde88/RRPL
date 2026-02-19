import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';

@Component({
  selector: 'app-booking-details-chart',
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
  templateUrl: './booking-details-chart.component.html',
  styleUrl: './booking-details-chart.component.scss',
})
export class BookingDetailsChartComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false;
  projectsList: { project_id: number; property_name: string }[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  projectName: string = '';

  roleId: number = Number(sessionStorage.getItem('role_id'));
  userId: number = Number(sessionStorage.getItem('session_id'));

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = [
    { key: 'floor_unit', label: 'Floor Unit' },
    { key: 'token_no', label: 'Token No' },
    { key: 'token_amount', label: 'Token Amount' },
    { key: 'token_given_on', label: 'Token Given On' },
    { key: 'customer_name', label: 'Client Name' },
    { key: 'customer_mob_no', label: 'Customer Mobile No' },
    { key: 'booked', label: 'Booked' },
    { key: 'booked_on', label: 'Booked On' },
  ];
  
  selectedProjectId: number | null = null; // Track selected project

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchAllProjects();
  }
  fetchAllTokenBookings(projectID: number): void {
    this.http.post(`${this.baseUrl}/fetch_token_details`, { project_id: projectID }).subscribe({
      next: (res: any) => {
        if (res && res.length > 0) {
          this.projectName = res[0].project_name; // Assuming all entries belong to the same project
        } else {
          this.projectName = 'No Project Name Available';
        }
        this.dataSource.data = res || [];
      },
      error: () => {
        this.snackBar.open('Unable to fetch bookings.', 'Close', { duration: 3000 });
      },
    });
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  onProjectChange(projectId: number): void {
    this.selectedProjectId = projectId; // Store selected project

    this.fetchAllTokenBookings(projectId);
  }



  applyFilter(searchText: string): void {
    this.dataSource.filter = searchText.trim().toLowerCase();
  }

  fetchAllProjects(): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/fetch_projects`, {}).subscribe({
      next: (res: any) => {
        this.projectsList = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Unable to fetch project details.', 'Close', { duration: 3000 });
      },
    });
  }
}
