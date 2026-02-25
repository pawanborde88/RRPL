import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { CancelTokenDialogComponent } from '../cancel-token-dialog/cancel-token-dialog.component';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
@Component({
  selector: 'app-all-cancelled-tokens',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableTableComponent,
    AutocompleteReusableComponent,
    TemplateComponent,
    BreadcrumbComponent
  ],
  templateUrl: './all-cancelled-tokens.component.html',
  styleUrl: './all-cancelled-tokens.component.scss'
})
export class AllCancelledTokensComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  projectsList: any[] = [];
  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allFloorUnits: any[] = [];
  allTokenType: any[] = [];
  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    public router: Router,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) { }
  addTokenForm = new FormGroup({
    project_id: new FormControl<any[]>([], Validators.required),
    token_type_id: new FormControl(),
  });
  displayedColumns = [

    {
      key: 'sr_no',
      label: 'Sr.no',
      type: 'index', // Add this to identify it as an index column
    },

    { key: 'created_at', label: 'EOI Date', type: 'short_date' },

    { key: 'property_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing  ' },
    { key: 'floor_unit', label: ' Unit' },
    { key: 'customer_name', label: 'Client Name' },


    { key: 'token_type', label: 'EOI Type' },
    { key: 'token_amount', label: 'EOI Amount', isAmount: true },
    { key: 'balance', label: 'Balance', isAmount: true },

    { key: 'amount_paid', label: 'Pay Till Date' },

    { key: 'payment_status', label: 'Payment Status' },
    { key: 'refunded', label: 'Is Refund' },

    { key: 'sales_executive_name', label: 'Executive' },

    { key: 'source', label: 'Visit Source' },
    { key: 'channel_partner', label: 'Channel Partner' },
    { key: 'source_detail', label: 'Visit Source Type' },

    { key: 'created_by_name', label: 'Cancelled  By' },

  ];
  columnKeys: string[] = this.displayedColumns.map((col) => col.key); // ✅ Define it as a property

  ngOnInit(): void {
    this.fetchAllProjects();

    this.addTokenForm.get('project_id')?.valueChanges.subscribe((projectID) => {
      if (projectID) {
        this.fetchAllTokenTypes(projectID);
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }


  fetchAllProjects(): void {
    this.loading = true;
    const payload = {
      user_id: this.userId,
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
  fetchAllTokenTypes(projectID: any): void {
    if (!projectID) return;

    // Fetch token types for the project
    this.http
      .post<any>(`${this.baseUrl}/token_type_dropdown`, {
        project_id: projectID,
      })
      .subscribe({
        next: (tokenTypes: any) => {
          this.allTokenType = tokenTypes;
        },
        error: (error) => {
          console.error('Error fetching token types:', error);
          this.snackBar.open('Failed to load token types', 'Close', {
            duration: 3000,
          });
        },
      });
  }


  fetchAllTokens(): void {
    this.loading = true;
    const formData = {
      project_id: this.addTokenForm.value.project_id,
      token_type_id: this.addTokenForm.value.token_type_id,


    };
    this.http
      .post(`${this.baseUrl}/fetch_cancel_tokens`, formData)
      .subscribe({
        next: (res: any) => {
          this.dataSource = new MatTableDataSource(res);

          this.dataSource = new MatTableDataSource(res);

          this.dataSource.data = res;
          this.loading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.loading = false;
          this.snackBar.open('Unable to fetch Tokens.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

}
