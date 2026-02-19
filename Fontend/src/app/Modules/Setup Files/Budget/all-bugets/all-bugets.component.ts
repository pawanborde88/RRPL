import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { environment } from '../../../../../environments/environment';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { AddBudgetComponent } from '../add-budget/add-budget.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { MatDatepicker } from '@angular/material/datepicker';
import { Moment } from 'moment';
import moment from 'moment';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
interface ActionButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
}
export const MONTH_YEAR_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@Component({
  selector: 'app-all-bugets',
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
    ReusableTableComponent// Add the pipe here
  ],
  templateUrl: './all-bugets.component.html',
  styleUrl: './all-bugets.component.scss',
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS },
  ],
})
export class AllBugetsComponent implements OnInit {
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  loading: boolean = false; // Initialize loading state
  projectsList: any[] = []; // Will hold project data
  sourcesList: any[] = []; // Will hold source data
  sourcerDetailedList: any[] = []; // Will hold source detail data
  allBudgetList: any[] = []; // Will hold all budget data

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  totalAmount: number = 0;
  allChannelPartnerList: any[] = [];
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
    key: 'year',
    label: 'Year'
  },
  {
    key: 'month_name',
    label: 'Month'
  },
  {
    key: 'amount',
    label: 'Amount',
    isAmount: true
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
    key: 'created_by_name',
    label: 'Created By'
  },
  {
    key: 'updated_by_name',
    label: 'Updated By'
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
  columnKeys: string[] = this.displayedColumns.map((col) => col.key); // ✅ Define it as a property
  selectedColumns = this.displayedColumns.map((col) => col.key); // Default select all columns
  dataSource = new MatTableDataSource<any>(); // Data source for the table
 selectedBookings: number = 0;

  selectedBooking: any = null; // Change from selectedBookingId to selectedBooking

  onBookingSelectionChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedBooking = booking;
      console.log('Selected booking:', this.selectedBooking);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedBooking &&
        this.selectedBooking.booking_id === booking.booking_id
      ) {
        this.selectedBooking = null;
      }
    }
  }
  headerButtons: ActionButton[] = [
    {
    label: 'Add Budget',
    icon: 'add',
    color: 'primary',
    disabled: () => false,
    action: () => this.onaddBudget(),
  },

];
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}
  addBudget = new FormGroup({
    project_id: new FormControl([]), // Initialize as an array
    source_id: new FormControl(null), // Initialize as null for dropdown
    source_detail_id: new FormControl(null), // Initialize as null
    channel_partner_id: new FormControl(null), // Added for channel partner selection
    
    month: new FormControl(''),
    year: new FormControl(''),
  });
  
  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchAllSources();
    this.addBudget.get('source_id')?.valueChanges.subscribe((sourceId) => {
      if (sourceId) {
        this.fetchAllSourceDetails(sourceId);
      }
    });

  }
  
  leadActions = [
    {
      action: 'addSiteVisit',
      icon: 'edit_note',
      tooltip: 'Add Budget',
      color: 'primary',
      disabled: false
    },
 
  { 
    action: 'deleteEnquiry',
    icon: 'delete', 
    tooltip: 'Delete Lead', 
    color: 'warn',
    disabled: false,
    show: (element: any) => this.roleId === 2
  }
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
date = new FormControl(moment());

setMonthAndYear(normalizedMonthAndYear: Moment, datepicker: MatDatepicker<Moment>) {
  const ctrlValue = this.date.value ?? moment();
  ctrlValue.month(normalizedMonthAndYear.month());
  ctrlValue.year(normalizedMonthAndYear.year());
  this.date.setValue(ctrlValue);

  // Update the reactive form so year & month get submitted automatically
  this.addBudget.patchValue({
    year: ctrlValue.year().toString(),
    month: (ctrlValue.month() + 1).toString(), // moment months are 0-indexed, API expects 1-12
  });

  datepicker.close();
}
// Handle lead actions
getLeadActions(action: string, row: any): void {
  switch (action) {
    case 'addSiteVisit':
      this.openEditbudget(row);
      break;
  case 'deleteEnquiry':
      this.deleteBudget(row.budget_id);
      break;
    default:
      console.warn('Unknown action:', action);
  }
}
  months = [
    { name: 'January', value: 1 },
    { name: 'February', value: 2 },
    { name: 'March', value: 3 },
    { name: 'April', value: 4 },
    { name: 'May', value: 5 },
    { name: 'June', value: 6 },
    { name: 'July', value: 7 },
    { name: 'August', value: 8 },
    { name: 'September', value: 9 },
    { name: 'October', value: 10 },
    { name: 'November', value: 11 },
    { name: 'December', value: 12 },
  ];

  getTotalAmount(): number {
    return this.dataSource.data.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

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

  fetchAllSourceDetails(sourceId: any): void {
    if (sourceId) {
      this.loading = true;
      this.http
        .post(`${this.baseUrl}/source_detail_dropdown`, { source_id: sourceId }) // Pass source_id in the request body
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

  // Modified function to accept parameters
 

  onaddBudget() {
    this.dialog
      .open(AddBudgetComponent, {
        autoFocus: false,
        minWidth: '50vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
      })
      .afterClosed()
      .subscribe((result: boolean) => {});
  }
  fetchAllBudgets(
    project_id: any[],
    source_id: any[],
    source_detail_id: any[],
    channel_partner_id: any[],
    year: any,
    month: any
  ): void {
    this.loading = true;
    this.http
      .post(`${this.baseUrl}/fetch_budget`, {
        project_id, 
        source_id, 
        source_detail_id,
        channel_partner_id,
        year,
        month,
      })
      .subscribe({
        next: (res: any) => {
          this.dataSource.data = res;
          this.loading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.loading = false;
          this.snackBar.open('Unable to fetch budget details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  
  filterData(): void {
    const { project_id, source_id, source_detail_id, month, year, channel_partner_id } = this.addBudget.value;
  
    // Ensure values are properly formatted as arrays
    const projectIds = Array.isArray(project_id) ? project_id : [];
    const sourceIds = source_id ? [source_id] : []; 
    const sourceDetailIds = source_detail_id ? [source_detail_id] : []; 
    const channelPartnerIds = channel_partner_id ? [channel_partner_id] : []; 
  
    if (
      projectIds.length > 0 ||
      sourceIds.length > 0 ||
      sourceDetailIds.length > 0 ||
      channelPartnerIds.length > 0 ||
      (month && month.toString().trim() !== '') ||
      (year && year.toString().trim() !== '')
    ) {
      this.fetchAllBudgets(projectIds, sourceIds, sourceDetailIds, channelPartnerIds, year, month);
    } else {
      this.snackBar.open('Please fill in at least one field to filter.', 'Close', {
        duration: 3000,
      });
    }
  }
  
 
  openEditbudget(item: any): void {
    this.dialog
      .open(AddBudgetComponent, {
        autoFocus: false,
        minWidth: '50vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
        data: { item },
      })
      .afterClosed()
      .subscribe((result: boolean) => {
        if (result) {
          const { project_id, source_id, source_detail_id, year, month, channel_partner_id } = this.addBudget.value;
  
          // Ensure values are correctly formatted
          const projectIds = Array.isArray(project_id) ? project_id : [];
          const sourceIds = source_id ? [source_id] : [];
          const sourceDetailIds = source_detail_id ? [source_detail_id] : [];
          const channelPartnerIds = channel_partner_id ? [channel_partner_id] : [];
  
          if (
            projectIds.length > 0 &&
            sourceIds.length > 0 &&
            sourceDetailIds.length > 0 &&
            channelPartnerIds.length > 0 &&
            year &&
            month
          ) {
            this.fetchAllBudgets(projectIds, sourceIds, sourceDetailIds, channelPartnerIds, year, month);
          } else {
            this.snackBar.open('Please fill in all required fields.', 'Close', {
              duration: 3000,
            });
          }
        }
      });
  }
  

  deleteBudget(budgetID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this budget?' }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const requestPayload = { budget_id: budgetID };
  
        this.http.post(`${this.baseUrl}/delete_budget`, requestPayload).subscribe({
          next: () => {
            this.snackBar.open('Budget deleted successfully', 'Close', {
              duration: 3000,
            });
  
            // Fetch updated filtered data
            this.filterData();
          },
          error: (err: any) => {
            console.error(err);
            this.snackBar.open('Unable to delete the budget.', 'Close', {
              duration: 3000,
            });
          }
        });
      }
    });
  }
}
