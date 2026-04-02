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
  selector: 'app-consolidated-collection-report',
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
  templateUrl: './consolidated-collection-report.component.html',
  styleUrl: './consolidated-collection-report.component.scss'
})
export class ConsolidatedCollectionReportComponent implements OnInit {
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
    // Index column
    { key: 'sr_no', label: 'Sr.no', type: 'index' },
    
    // Basic booking info
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_unit', label: 'Unit No' },
    { key: 'unit_type', label: 'Unit Type' },
    { key: 'applicant_name', label: 'Client Name' },
       
    { key: 'applicant_mobile', label: 'Mobile No', type: 'sensitive' },
    { key: 'alternate_mobile_no', label: 'Alt Mobile No', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    { key: 'applicant_email', label: 'Email ID', type: 'sensitive' },
    { key: 'booking_date', label: 'Booking Date' , type: 'short_date' },
    { key: 'agreement_status', label: 'Agreement Status' },
    { key: 'agreement_date', label: 'Agreement Date' },
    { key: 'agreement_no', label: 'Agreement Reg.No.' },
    { key: 'registration_office', label: 'Registration Office' },
    { key: 'day_taken_from_agreement', label: 'Day Taken From Agree.' },
    { key: 'day_pending_from_agreement', label: 'Day Pending From Agree.' },
    { key: 'sales_executive', label: 'Executive' },
    { key: 'agreement_cost', label: 'Agreement Cost'   , isAmount: true }, 
    { key: 'total_received_with_gst', label: 'Total Received With GST' , isAmount: true },
    { key: 'till_date_due_percentage', label: 'Due %' , isAmount: true }, 
    { key: 'total_installment_due_till', label: 'Till Date Due' , isAmount: true }, 
    { key: 'balance_amount', label: 'Till Date Due Balance' , isAmount: true  },
    { key: 'd', label: 'Estimated Due %' , isAmount: true },
    { key: 'r', label: 'Estimated Due' , isAmount: true },
    { key: 't', label: 'Estimated Due Balance' , isAmount: true },
    { key: 'total_balance', label: 'Total Balance' , isAmount: true },
    { key: 'gst_per', label: 'GST %' , isAmount: true },
    { key: 'gst', label: 'GST Amount ' , isAmount: true },
    { key: 'total_gst_due', label: ' GST Received '   , isAmount: true    },
    { key: 'balance_gst', label: 'GST Pending' , isAmount: true },
    { key: 'current_gst', label: 'As Per Stage GST' , isAmount: true },
    { key: 'till_date_gst_pending', label: 'Till Date GST Pending' , isAmount: true },
    { key: 'current_out_standing', label: 'Current Outstanding' , isAmount: true },
    { key: 'l', label: 'TDS Amount' , isAmount: true },
    { key: 'm', label: 'TDS Received' , isAmount: true },
    { key: 'x', label: 'TDS Amount' , isAmount: true },
    { key: 'bank_name', label: 'Banker Type' },
    { key: 'banker_type_name', label: 'Banker Type' },
    { key: 'banker_name', label: 'Bank Person '  , isAmount: true },
    { key: 'package_total', label: 'Package Total' , isAmount: true },
    { key: 'package_received', label: 'Package Received' , isAmount: true },
    { key: 'package_balance', label: 'Package Balance' , isAmount: true },
    { key: 'remark', label: 'Remark'  , type: 'truncate'},
 
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
      this.fetchMISReport();
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


  fetchMISReport(): void {
    if (!this.selectedProjectId) {
      return; // Don't proceed if no project is selected
    }
    
    this.loading = true;
    const formData = {
      project_id: this.selectedProjectId, 
    };
    
    this.http
      .post(`${this.baseUrl}/fetch_consolidated_collection_report`, formData)
      .subscribe({
        next: (res: any) => {
          this.dataSource = new MatTableDataSource(res);
          this.dataSource.data = res;
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
