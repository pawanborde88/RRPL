import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe, // Add the pipe here
  ],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss'
})
export class SummaryComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state

  dataSource = new MatTableDataSource<any>();

  roleId = Number(sessionStorage.getItem('role_id'));
  pipe = new DatePipe('en-US');

  userId = Number(sessionStorage.getItem('session_id'));
  tableData: any[] = [];
  allSubregions: any[] = [];

  groupsColumns: string[] = []; // Dynamic month columns

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  displayedColumns: string[] = ['city', 'subRegion', 'report']; // Static columns

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.fetchAllExpenseSummary();
  }

  ngAfterViewInit(): void {
    // Apply sorting and pagination after view initialization
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  getDynamicMonthColumns(jsonData: any): string[] {
    const allGroups = new Set<string>();
    jsonData.forEach((cityData: any) => {
      cityData.subRegions.forEach((subRegion: any) => {
        Object.keys(subRegion.groups).forEach((items: string) => allGroups.add(items));
      });
    });
    return Array.from(allGroups);
  }

  flattenTableData(jsonData: any): any[] {
    const flattenedData: any[] = [];
    jsonData.forEach((cityData: any) => {
      cityData.subRegions.forEach((subRegion: any, index: number) => {
        flattenedData.push({
          city: index === 0 ? cityData.city : null, // Merge cells for city
          subRegion: subRegion.sub_region,
          months: subRegion.groups,
          // rowSpan: index === 0 ? cityData.subRegions.length : null // Row span for city
        });
      });
    });
    return flattenedData;
  }

  fetchAllExpenseSummary(): void {
    this.loading = true;

    let obj = {
      project_id: [1],
      start_date: null,
      end_date: null,
      source_id: null,
      source_detail_id: null,
      city_id: null,
      sub_region_id: null
    };

    this.http
      .post(`${this.baseUrl}${'/summary_yearly_by_sub_region'}`, obj)
      .subscribe({
        next: (res: any) => {
          this.dataSource.data = res;
          this.tableData = res;
          this.groupsColumns = this.getDynamicMonthColumns(this.tableData);
          this.tableData = this.flattenTableData(this.tableData);
          this.displayedColumns = ['city', 'subRegion','report', ...this.groupsColumns];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Unable to fetch data.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
}
