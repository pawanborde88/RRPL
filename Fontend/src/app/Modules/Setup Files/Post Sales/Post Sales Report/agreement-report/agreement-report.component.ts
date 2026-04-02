import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';

@Component({
  selector: 'app-agreement-report',
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
    ReusableTableComponent, // Add the pipe here
  ],
  templateUrl: './agreement-report.component.html',
  styleUrl: './agreement-report.component.scss'
})
export class AgreementReportComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  projectsList: any[] = [];
  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  selectedProjectId: number | null = null;

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  allSalesExecutive: any[] = [];
  constructor(
    private http: HttpClient,
   
    private snackBar: MatSnackBar,
  ) {}

  displayedColumns = [
    {
        key: 'sr_no',
        label: 'Sr.no',
        type: 'index',
    },
   
    { 
        key: 'project_name', 
        label: 'Project Name' 
    },
    { 
        key: 'wing_name', 
        label: 'Wing' 
    },
    { 
        key: 'floor_unit', 
        label: 'Unit No' 
    },
    { 
        key: 'applicant_name', 
        label: 'Client Name' 
    },
    { 
      key: 'mobile_no', 
      label: 'Mobile No' ,
      type: 'sensitive'

    },
    { 
      key: 'email', 
      label: 'Email' ,
      type: 'sensitive'
    },
    { 
      key: 'agreement_status', 
      label: 'Agree Status',
  },
    { 
      key: 'booking_date', 
      label: 'Booking Date',
      type: 'short_date'
  },
    { 
        key: 'agreement_no', 
        label: 'Agreement No' 
    },
   
    { 
        key: 'agreement_date', 
        label: 'Agreement Date',
        type: 'short_date'
    },
    { 
      key: 'lodge_receipt_no', 
      label: 'Lodge Receipt No' 
  },
     
  { 
    key: 'date_of_execution', 
    label: 'Execuation Date',
    type: 'short_date'
},
{ 
  key: 'agreement_tat', 
  label: 'Agreement TAT' 
},

{ 
  key: 'agreement_cost', 
  label: 'Agreement Cost'
  , isAmount: true
},
{ 
    key: 'market_value', 
    label: 'Market Value' 
  },

{ 
  key: 'challan_status', 
label: 'Challan Status' 
},
{ 
  key: 'challan_date', 
  label: 'Agreement Challan Date',
  type: 'short_date'
},
{ 
  key: 'scheduled_tat', 
  label: 'Scheduled TAT' 
},
{ 
  key: 'agreement_shadule_date', 
  label: 'Agreement Schedule Date',
  type: 'short_date'
},  
{ 
  key: 'day_pending_from_agreement', 
  label: 'Agg. Pending Days' 
},
{ 
  key: 'agreement_input_form', 
  label: 'Agreement Input Form' 
},
{ 
  key: 'agreement_copy_received', 
  label: 'Agreement Copy Received' 
},
{ 
  key: 'registration_office', 
  label: 'Registration Office' 
},

{ 
  key: 'updated_by_name', 
  label: 'Updated By' 
},
{ 
  key: 'updated_at', 
  label: 'Updated At',
  type: 'date'
},
];
  columnKeys: string[] = this.displayedColumns.map((col) => col.key); // ✅ Define it as a property
cpTargetLoggedData: any;

  ngOnInit(): void {
    this.fetchAllProjects();

    
  }
  onProjectChange(projectId: number): void {
    if (projectId !== null && projectId !== undefined) {
      this.selectedProjectId = projectId;
      // Clear previous data
      this.dataSource.data = [];
      // Fetch visitors for the selected project
      this.fetchAgreementReport();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


 
  fetchAllProjects(): void {
    this.loading = true;
    const payload = {
      user_id:  this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.projectsList = res;
        }
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


  fetchAgreementReport(): void {
    if (!this.selectedProjectId) {
      return; // Don't proceed if no project is selected
    }
    
    this.loading = true;
    const formData = {
      project_id: this.selectedProjectId, 
    };
    
    this.http
      .post(`${this.baseUrl}/fetch_booking_agreement_report`, formData)
      .subscribe({
        next: (res: any) => {
          this.dataSource = new MatTableDataSource(res.data);
          this.dataSource.data = res.data;
          this.loading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.loading = false;
          this.snackBar.open('Unable to fetch visitors.', 'Close', {
            duration: 3000,
          });
        },
      });
  }




}
