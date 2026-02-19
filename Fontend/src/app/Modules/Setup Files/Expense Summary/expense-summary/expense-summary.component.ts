import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { CommonModule, DatePipe } from '@angular/common';

import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-expense-summary',
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
  templateUrl: './expense-summary.component.html',
  styleUrl: './expense-summary.component.scss',
})
export class ExpenseSummaryComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state

  // Initialize dataSource as a MatTableDataSource

  roleId = Number(sessionStorage.getItem('role_id'));
  pipe = new DatePipe('en-US');

  userId = Number(sessionStorage.getItem('session_id'));
  projectsList: any[] = [];
  tableData: any[] = [];
  allCities: any[] = [];
  sourcesList: any[] = [];
  sourceDetailedList: any[] = [];

  cityId: number | null = null;
  projectId: number | null = null;
  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  dataSource = new MatTableDataSource(this.tableData);
  allGroupsList: any[] = [];
  allTimeIntervalList: any[] = [];
  allReportGroupList: any[] = [];

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  filterExpenseSummaryForm = new FormGroup({
    project_id: new FormControl('', []),
    source_id: new FormControl(''),
    source_detail_id: new FormControl('', []),
    city_id: new FormControl('', []),
    sub_region_id: new FormControl('', []),
    start_date: new FormControl('', []),
    end_date: new FormControl('', []),
    expense_group_id: new FormControl(''),
    time_interval_id: new FormControl(''),
    report_group_id: new FormControl('', []),
  });

  displayedColumns: any[] = []; // Static columns
  displayedRows: any[] = [];
  columnFields: any[] = [];

  ngOnInit(): void {
    this.fetchAllData();

    this.filterExpenseSummaryForm
      .get('city_id')
      ?.valueChanges.subscribe((cityIds) => {
        if (Array.isArray(cityIds) && cityIds.length > 0) {
          // this.fetchAllSubregions(cityIds);
        }
      });

    this.filterExpenseSummaryForm
      .get('source_id')
      ?.valueChanges.subscribe((sourceId) => {
        if (sourceId) {
          this.fetchAllSourceDetails(sourceId);
        }
      });
    // Extract dynamic month columns
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchAllData(): void {
    this.loading = true;

    forkJoin({
      cities: this.http.get<any[]>(`${this.baseUrl}/city_dropdown`),
      groups: this.http.get<any[]>(`${this.baseUrl}/fetch_group`),
      timeIntervals: this.http.get<any[]>(
        `${this.baseUrl}/fetch_time_intervals`
      ),
      reportGroups: this.http.get<any[]>(`${this.baseUrl}/fetch_report_groups`),
      sources: this.http.get<any[]>(`${this.baseUrl}/source_dropdown`),
      projects: this.http.post(`${this.baseUrl}/fetch_projects`, {}),
    }).subscribe({
      next: (res) => {
        this.allCities = res.cities;
        this.allGroupsList = res.groups;
        this.allTimeIntervalList = res.timeIntervals;
        this.allReportGroupList = res.reportGroups;
        this.sourcesList = res.sources;
        this.projectsList = res.projects as any[];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch data.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllSourceDetails(sourceId: any): void {
    if (sourceId) {
      this.loading = true;
      this.http
        .post(`${this.baseUrl}/source_detail_dropdown`, { source_id: sourceId })
        .subscribe({
          next: (res: any) => {
            this.sourceDetailedList = res;
            this.loading = false;
          },
          error: (err: any) => {
            console.error(err);
            this.loading = false;
            this.snackBar.open('Unable to fetch source details.', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  }

  columns: any[] = [];
  applyFilters(): void {
    const filterValues = this.filterExpenseSummaryForm.value;
  
    // Format the start and end dates
    const formattedStartDate = filterValues.start_date
      ? this.pipe.transform(filterValues.start_date, 'yyyy-MM-dd')!
      : null;
    const formattedEndDate = filterValues.end_date
      ? this.pipe.transform(filterValues.end_date, 'yyyy-MM-dd')!
      : null;
  
    // Prepare the payload
    const payload = {
      project_id: filterValues.project_id?.length ? filterValues.project_id : null,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      source_id: filterValues.source_id?.length ? filterValues.source_id : null,
      source_detail_id: filterValues.source_detail_id?.length
        ? filterValues.source_detail_id
        : null,
      city_id: filterValues.city_id?.length ? filterValues.city_id : null,
      sub_region_id: filterValues.sub_region_id?.length
        ? filterValues.sub_region_id
        : null,
      expense_group_id: filterValues.expense_group_id,
      time_interval_id: filterValues.time_interval_id,
      report_group_id: filterValues.report_group_id?.length
        ? filterValues.report_group_id
        : null,
    };
  
    this.loading = true;
  
    // Perform the API request
    this.http.post(`${this.baseUrl}/fetch_report`, payload).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
  
        if (response?.data) {
          this.dataSource = new MatTableDataSource(response.data.rows || []);
          this.columns = response.data.columns;
          this.displayedColumns = this.columns.map((col: any) => col.fieldName);
          console.log(this.displayedColumns);
          console.log(this.columns);
        } else {
          this.dataSource = new MatTableDataSource<any>([]);
          this.displayedColumns = [];
        }
      },
      error: (error: any) => {
        console.error('Error:', error);
        this.snackBar.open(
          'Error while fetching expense summary, please try again.',
          undefined,
          { duration: 3000 }
        );
        this.dataSource = new MatTableDataSource<any>([]);
        this.loading = false;
      },
      complete: () => {
        if (this.dataSource) {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        }
        this.loading = false;
        this.snackBar.dismiss();
      },
    });
  }
  
  exportToExcel(): void {
    if (!this.dataSource || !this.dataSource.data || this.dataSource.data.length === 0) {
      this.snackBar.open('No data available to export.', undefined, { duration: 3000 });
      return;
    }
  
    const exportData = this.dataSource.data.map((row: any) => {
      const formattedRow: any = {};
      this.columns.forEach((col) => {
        formattedRow[col.title] = row[col.fieldName]; // Use column titles for readability
      });
      return formattedRow;
    });
  
    // Convert to worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  
    // Auto-size columns
    const columnWidths = this.columns.map(col => ({ wch: col.title.length + 5 }));
    worksheet['!cols'] = columnWidths;
  
    // Add styling for header row
    const headerRowIndex = XLSX.utils.decode_range(worksheet['!ref']!).s.r; // Get first row index
    this.columns.forEach((col, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: index });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          fill: { fgColor: { rgb: '4F81BD' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: { top: { style: 'thin' }, bottom: { style: 'thin' } },
        };
      }
    });
  
    // Create a workbook and add the sheet
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Expense Report': worksheet },
      SheetNames: ['Expense Report'],
    };
  
    // Apply formatting for date columns
    this.columns.forEach((col, index) => {
      if (col.title.toLowerCase().includes('date')) {
        worksheet[XLSX.utils.encode_col(index) + '1'].z = 'yyyy-mm-dd'; // Format as date
      }
    });
  
    // Generate and download Excel file
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  }
  
}
