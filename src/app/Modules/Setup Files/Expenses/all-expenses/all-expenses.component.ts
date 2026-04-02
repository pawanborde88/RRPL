import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { AngularMaterialModule } from '../../../../../angular-material.module';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddExpensesComponent } from '../add-expenses/add-expenses.component';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { environment } from '../../../../../environments/environment';

// 2. ADD LOCAL INTERFACES FOR STRONG TYPING
interface Project { project_id: number; property_name: string; }
interface Source { source_id: number; source: string; }
interface SourceDetail { source_detail_id: number; source_detail: string; }
interface Vendor { vendor_id: number; vendor_name: string; }
interface ChannelPartner {
  channel_partner_id: number;
  firm_name: string;
  cp_owner: string;
  full_name?: string;
}
interface Expense {
  expense_id: number;
  project_name: string;
  amount: number;
  total_amount: number;
  gst_amount: number;
  expense_date: string;
  source: string;
  source_detail: string;
  channel_partner: string;
  remark: string;
  vendor_name: string;
  updated_by_name: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
}
@Component({
  selector: 'app-all-expenses',
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
    ReusableTableComponent,
    AutocompleteReusableComponent
  ],
  templateUrl: './all-expenses.component.html',
  styleUrls: ['./all-expenses.component.scss'],
})
export class AllExpensesComponent implements OnInit {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  datePipe = new DatePipe('en-US');
  loading = false;
  allChannelPartnerList: ChannelPartner[] = [];
  dataSource = new MatTableDataSource<Expense>();
  projectsList: Project[] = [];
  sourcesList: Source[] = [];
  sourcerDetailedList: SourceDetail[] = [];
  vendorsList: Vendor[] = [];


  displayedColumns = [ 
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
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
      key: 'amount',
      label: 'Amount',
      isAmount: true
    },
    {
      key: 'total_amount',
      label: 'Total Amount',
      isAmount: true
    },
    {
      key: 'gst_amount',
      label: 'GST Amount',
      isAmount: true
    },
    {
      key: 'expense_date',
      label: 'Expense Date',
      type: 'short_date'
    },
    {
      key: 'source',
      label: 'Source'
    },
    {
      key: 'source_detail',
      label: 'Source Type'
    },
    {
      key: 'channel_partner',
      label: 'Channel Partner'
    },
    {
      key: 'remark',
      label: 'Remark'
    },
   
    {
      key: 'vendor_name',
      label: 'Vendor Name'
    },
    {
      key: 'updated_by_name',
      label: 'Updated By'
    },
    {
      key: 'created_by_name',
      label: 'Created By'
    },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'short_date'
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      type: 'short_date'
    }
  ];
  addExpense = new FormGroup({
    project_id: new FormControl('', []), // Optional field, no validation
    source_id: new FormControl(''), // Required field
    channel_partner_id: new FormControl('', []), // Optional field, no validation
    source_detail_id: new FormControl('', []), // Optional field, no validation
    vendor_id: new FormControl('', []), // Optional field, no validation
    start_date: new FormControl('', []), // Optional field, no validation
    end_date: new FormControl('', []), // Optional field, no validation
  });

  constructor(
    private readonly http: HttpClient,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly fetch: FetchFunctionsService,
  ) {}

  /**
   * Utility method to format dates consistently.
   */
  private formatDate(date: unknown): string | null {
    return date ? this.datePipe.transform(date as Date, 'yyyy-MM-dd') ?? null : null;
  }

  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchAllSources();
    this.fetchAllVendors();

    // Subscribe to source_id changes to fetch source details when source is selected
    this.addExpense.get('source_id')?.valueChanges.subscribe((sourceId) => {
      if (sourceId) {
        this.fetchAllSourceDetails(sourceId);
      }
    });
  }
  headerButtons: ActionButton[] = [
    {
    label: 'Add Expense',
    icon: 'add_circle',
    color: 'primary',
    disabled: () => false,
    action: () => this.onAddExpenses(),
  },

];

  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length <= 3) {
      this.allChannelPartnerList = [];
      return;
    }
  
    this.http
      .post(`${this.baseUrl}/channel_partner_dropdown`, { firm_name: trimmedSearch })
      .subscribe({
        next: (res: any) => {
          this.allChannelPartnerList = (res || []).map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner})`,
          }));
        },
      });
  } 
  leadActions = [
    {
      action: 'addSiteVisit',
      icon: 'edit_note',
      tooltip: 'Edit Expense',
      color: 'primary',
      disabled: false
    },
 
  { 
    action: 'deleteEnquiry',
    icon: 'delete', 
    tooltip: 'Delete Expense', 
    color: 'warn',
    disabled: false,
    show: (element: any) => this.roleId === 2
  }
];

  getLeadActions(action: string, row: any): void {
    switch (action) {
      case 'addSiteVisit':
        this.openEditExpense(row);
        break;
    case 'deleteEnquiry':
        this.deleteExpense(row.expense_id);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }
  fetchAllProjects(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/project_dropdown`).subscribe({
      next: (res: any) => {
        this.projectsList = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch project details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllSources(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/source_dropdown`).subscribe({
      next: (res: any) => {
        this.sourcesList = res;
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

  fetchAllVendors(): void {
    this.http.get(`${this.baseUrl}/vendor_dropdown`).subscribe({
      next: (res: any) => {
        this.vendorsList = res;
      },
      error: () => {
        this.snackBar.open('Unable to fetch vendors.', 'Close', {
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
            this.sourcerDetailedList = res;
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

  onAddExpenses(): void {
    this.dialog
      .open(AddExpensesComponent, {
        autoFocus: false,
        minWidth: '50vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
      })
      .afterClosed()
      .subscribe((result: boolean) => {});
  }

  openEditExpense(item: any): void {
    this.dialog
      .open(AddExpensesComponent, {
        autoFocus: false,
        minWidth: '50vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
        data: { item },
      })
      .afterClosed()
      .subscribe((result: boolean) => {
        const {
          project_id,
          source_id,
          source_detail_id,
          vendor_id,
          start_date,
          end_date,
        } = this.addExpense.value;

        // Format start_date and end_date
        const formattedStartDate = this.formatDate(start_date);
        const formattedEndDate = this.formatDate(end_date);

        this.fetchAllExpenses(
          project_id ?? [],
          source_id ?? [],
          source_detail_id ?? [],
          vendor_id ?? [],
          formattedStartDate,
          formattedEndDate
        );
      });
  }

  fetchAllExpenses(
    project_id: any,
    source_id: any,
    source_detail_id: any,
    vendor_id: any,
    start_date: any,
    end_date: any
  ): void {
    this.loading = true;
    this.http
      .post(`${this.baseUrl}/fetch_expense`, {
        project_id,
        source_id,
        source_detail_id,
        vendor_id,
        start_date,
        end_date,
      })
      .subscribe({
        next: (res: any) => {
          this.dataSource.data = res as Expense[];
          this.loading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.loading = false;
          this.snackBar.open('Unable to fetch expense details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  filterData(): void {
    const {
      project_id,
      source_id,
      source_detail_id,
      vendor_id,
      start_date,
      end_date,
    } = this.addExpense.value;

    // Provide a default empty array if project_id, source_id, source_detail_id, or vendor_id is null or undefined
    const projectIds = project_id ?? [];
    const sourceIds = source_id ?? [];
    const sourceDetailIds = source_detail_id ?? [];
    const vendorIds = vendor_id ?? [];
    const formattedStartDate = this.formatDate(start_date);
    const formattedEndDate = this.formatDate(end_date);

    console.log('filterData values:', {
      project_id,
      source_id,
      source_detail_id,
      vendor_id,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
    });

    // Check if at least one of the fields is filled or selected
    if (
      (Array.isArray(projectIds) && projectIds.length > 0) ||
      (Array.isArray(sourceIds) && sourceIds.length > 0) ||
      (Array.isArray(sourceDetailIds) && sourceDetailIds.length > 0) ||
      (Array.isArray(vendorIds) && vendorIds.length > 0) ||
      formattedStartDate ||
      formattedEndDate
    ) {
      // Call the method to fetch filtered expenses
      this.fetchAllExpenses(
        projectIds,
        sourceIds,
        sourceDetailIds,
        vendorIds,
        formattedStartDate,
        formattedEndDate
      );
    } else {
      // Optionally, show a message if none of the fields are filled (if needed)
      this.snackBar.open(
        'Please fill in at least one field to filter.',
        'Close',
        {
          duration: 3000,
        }
      );
    }
  }
  deleteExpense(expenseID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Expense?' },
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const requestPayload = {
          expense_id: expenseID,
        };
  
        this.http
          .post(`${this.baseUrl}/delete_expense`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Expense deleted successfully', 'Close', {
                duration: 3000,
              });
  
              // Call fetchAllExpenses after successful deletion
              const {
                project_id,
                source_id,
                source_detail_id,
                vendor_id,
                start_date,
                end_date,
              } = this.addExpense.value;
  
              // Format start_date and end_date
              const formattedStartDate = this.formatDate(start_date);
              const formattedEndDate = this.formatDate(end_date);
  
              this.fetchAllExpenses(
                project_id ?? [],
                source_id ?? [],
                source_detail_id ?? [],
                vendor_id ?? [],
                formattedStartDate,
                formattedEndDate
              );
            },
            error: (err: any) => {
              console.error(err);
              this.snackBar.open('Unable to delete the budget.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
  
}
