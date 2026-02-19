import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AddChannelPartnerComponent } from '../../Channel Partner/add-channel-partner/add-channel-partner.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { MatTableDataSource } from '@angular/material/table';
import { TemplateComponent } from '../../../../Common/template/template.component';

@Component({
  selector: 'app-add-site-visit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    ReusableTableComponent
  ],
  templateUrl: './add-site-visit.component.html',
  styleUrl: './add-site-visit.component.scss',
})
export class AddSiteVisitComponent {
  baseUrl = environment.API_URL; // Ensure API_URL exists in the environment file
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
dataSource = new MatTableDataSource<any>([]); // Initialize with empty array
  loading: boolean = false; // Initialize loading state

  projectsList: any[] = [];
  projectConfigList: any[] = [];
  allProjectEnquiries: any[] = [];
  sourcesList: any[] = [];
  allEnquiryList: any[] = [];
  allRevisitList: any[] = [];


  bookingDisplayedColumns = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions', // Make sure this is set to 'actions'
      sticky: true, // boolean, not string
      disabled: false, // Should be false to show actions
    },
    {
      key: 'sr_no',
      label: 'Sr.no',
      type: 'index', // Add this to identify it as an index column
    },
    { key: 'client_name', label: 'Name ' },
    { key: 'date', label: ' Date', type: 'date'},

    { key: 'reason', label: 'Reason' },
    { key: 'remark', label: 'Remark' },

    { key: 'created_at', label: 'Created  At', type: 'date' },
  ];
  columnKeys: string[] = this.bookingDisplayedColumns.map((col) => col.key); // ✅ Define it as a property

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any, // Injected dialog data
    private dialogRef: MatDialogRef<AddChannelPartnerComponent>
  ) {}
  ngOnInit(): void {
    console.log(this.data);
    if (this.data?.rowData?.site_visit_id) {
      this.fetchRevisits();
    }
  }

  addSiteVisitForm = new FormGroup({
    user_id: new FormControl(this.userId, Validators.required), // Fixed user ID
    project_id: new FormControl(
      this.data.rowData?.project_id,
      Validators.required
    ),
    enquiry_id: new FormControl(this.data.rowData?.project_enq_id), // Required enquiry ID
    site_visit_id: new FormControl(this.data.rowData?.site_visit_id),
    date: new FormControl(''), // Required date
    time: new FormControl(''), // Required time
    remark: new FormControl(''), // Required remark
    reason: new FormControl(''), // Required reason
    is_revisit: new FormControl(''), // Default to 0, required
  });

  fetchRevisits(): void {
    this.loading = true;

    this.http
      .post(`${this.baseUrl}/fetch_re_visits`, {
        site_visit_id: this.data.rowData.site_visit_id,
      })
      .subscribe({
        next: (res: any) => {
                 this.dataSource = new MatTableDataSource(res);

          this.dataSource.data = res.site_visit_log;
          this.loading = false;

        },
        error: () => {
          this.snackBar.open('Unable to fetch projects.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onSubmit(): void {
    // Clone the form value to avoid mutating the original form data
    const payload = { ...this.addSiteVisitForm.value };

    // Convert the date field to 'YYYY-MM-DD' format if it exists
    if (payload.date) {
      payload.date = new Date(payload.date).toISOString().split('T')[0];
    }

    // Convert is_revisit to 0 or 1
    payload.is_revisit = payload.is_revisit === 'Revisit' ? '1' : '0';

    const apiUrl = `${this.baseUrl}/add_revisit`;

    // Send the request
    this.http.post(apiUrl, payload).subscribe({
      next: (response) => {
        console.log('Success:', response);
        this.snackBar.open(this.data.successMessage, 'Close', {
          duration: 3000,
        });
        this.fetchRevisits();
      },
      error: (error) => {
        console.error('Error:', error);
        this.snackBar.open('Something went wrong. Please try again.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
}
