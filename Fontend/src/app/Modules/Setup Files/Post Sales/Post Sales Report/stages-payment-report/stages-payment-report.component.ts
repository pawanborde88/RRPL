import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { IndianCurrencyPipe } from '../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { UnitDetailsDialogComponent } from '../../../Sales/Reports/unit-details-dialog/unit-details-dialog.component';

@Component({
  selector: 'app-stages-payment-report',
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
    AutocompleteReusableComponent,
    IndianCurrencyPipe,
    ActionColumnComponent,
    ReusableTableComponent,
  ],
  templateUrl: './stages-payment-report.component.html',
  styleUrl: './stages-payment-report.component.scss'
})
export class StagesPaymentReportComponent implements OnInit, AfterViewInit {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  allWingslist: any[] = []; // Initialize allWingslist as an empty array
  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  selectedWingId: number | null = null;

  projectsList: any[] = []; // Initialize projectsList as an empty array
  confiList: any[] = []; // Initialize confiList as an empty array
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChildren(MatPaginator) paginators!: QueryList<MatPaginator>;
  @ViewChild(MatSort) sort!: MatSort;
  searchText: string = '';
  pipe = new DatePipe('en-US');
  selectedProjectId: number | null = null;
  maxUnitsPerFloor: number = 0;
  displayedColumns = [
   
    {
      key: 'sr_no',
      label: 'Sr.no',
      type: 'index', // Add this to identify it as an index column
    },
    { 
      key: 'payment_stage', 
      label: 'Particulars' 
    },
    { 
      key: 'percentage', 
      label: 'Percent (%)',
       isAmount: true 
    },
   
    {
      key: 'status_string',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.status === 1 ? 'green' : 'red',
    },
    { 
      key: 'stage_date', 
      label: 'Stage Date',
      type: 'short_date'
    },
    { 
      key: 'stage_wise', 
      label: 'Stage Wise' ,
      isAmount: true 


    },
    { 
      key: 'stage_complete_wise', 
      label: 'Completed Stage Wise' ,
      isAmount: true 

   
    },
    { 
      key: 'received_amount', 
      label: 'Received' ,
      isAmount: true 

    },
     
    { 
      key: 'balance_amount', 
      label: 'Balance' ,
      isAmount: true 

    },
     
    { 
      key: 'stage_wise_gst', 
      label: 'Stage Wise (GST)' ,
      isAmount: true 

    },
    { 
      key: 'stage_complete_wise_gst', 
      label: 'Completed Stage Wise (GST)' ,
      isAmount: true 

    },
    { 
      key: 'received_gst', 
      label: 'Received (GST)' ,
      isAmount: true 

    },
    { 
      key: 'balance_gst', 
      label: 'Balance (GST)' ,
      isAmount: true 

    },
     
      
    
  ];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}
  
  ngOnInit(): void {
    this.fetchAllProjects();
  }

  ngAfterViewInit(): void {
    // Set up main paginator
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }
 
  
  onProjectChange(projectId: number): void {
    if (projectId !== null && projectId !== undefined) {
      this.selectedProjectId = projectId;
      // Clear previous wing and floor unit selections
      this.allWingslist = [];
      this.dataSource.data = [];
    
      
      this.fetchAllWings(projectId);
    }
  }
  
  onWingChange(wingId: number): void {
    this.selectedWingId = wingId;

    if (!this.dataSource) {
      this.dataSource = new MatTableDataSource<any>([]);
    }
    if (
      wingId !== null &&
      wingId !== undefined &&
      this.selectedProjectId !== null
    ) {
      this.fetchStagesPaymentReportList(this.selectedProjectId, wingId); // Consistent parameter order
    } else {
      this.dataSource.data = []; // Clear floor units if no wing selected
      // Optionally fetch all units for the project if wing is cleared
      if (this.selectedProjectId) {
        this.fetchStagesPaymentReportList(this.selectedProjectId, null);
      }
    }
  }
  
  fetchStagesPaymentReportList(projectId: any, wingId: any = null): void {
    this.loading = true;
    this.http
      .post(`${this.baseUrl}/stage_wise_payment_report`, {
        project_id: projectId,
        wing_id: wingId, // Pass wingID only if it's not null
      })
      .subscribe({
        next: (res: any) => {
          if (res && res.data) {
            this.dataSource = new MatTableDataSource(res.data);
            this.dataSource.sort = this.sort;
            this.loading = false;
          }
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Unable to fetch floor units.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
 
  fetchAllProjects(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/project_dropdown`).subscribe({
      next: (res: any) => {
        this.projectsList = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Unable to fetch projects.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllWings(selectedProjectId: number): void {
    this.loading = true;
    this.http
      .post(`${this.baseUrl}/wing_dropdown`, { project_id: selectedProjectId })
      .subscribe({
        next: (res: any) => {
          this.allWingslist = res; // Store wings list
          this.loading = false;
          // Don't modify dataSource here - it's for floor/unit data only
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Unable to fetch wings.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  
 
}
