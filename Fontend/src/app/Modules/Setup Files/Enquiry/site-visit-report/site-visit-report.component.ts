import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { PaginationComponent } from '../../../../Common/pagination/pagination.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { CommentLogComponent } from '../../comment-log/comment-log.component';
import { AssignLeadsComponent } from '../../Projects/Leads/assign-leads/assign-leads.component';
import { AddSiteVisitComponent } from '../../Site Visit/add-site-visit/add-site-visit.component';
import { AssignProjectDialogComponent } from '../assign-project-dialog/assign-project-dialog.component';
import { ClaimEnquiryComponent } from '../claim-enquiry/claim-enquiry.component';

// Interface definitions for better type safety
interface ActionButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}

interface LeadAction {
  action: string;
  icon: string;
  tooltip: string;
  color: string;
  disabled: (row?: any) => boolean;
  show?: () => boolean;
}

interface PaginationParams {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
  search: string;
  filters: any;
  filteredCount: number;
}

interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
 
  start_date: FormControl<any | null>;
  end_date: FormControl<any | null>;
  ignore_date_filters: FormControl<boolean | null>;
}

@Component({
  selector: 'app-site-visit-report',
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
    ActionColumnComponent,
    
    AutocompleteReusableComponent,
    ReusableTableComponent,
    PaginationComponent,
  ],
  templateUrl: './site-visit-report.component.html',
  styleUrl: './site-visit-report.component.scss'
})
export class SiteVisitReportComponent  implements OnInit, AfterViewInit{
// Constants and configuration
private readonly baseUrl = environment.API_URL;
private readonly storageUrl = environment.STORAGE_URL;
private readonly datePipe = new DatePipe('en-US');
 userId = Number(sessionStorage.getItem('session_id'));
private readonly roleData = sessionStorage.getItem('role_id');

// Component state
loading = false;
showClaimedEnquiries = false;
isFiltered = false;
totalLeads = 0;
currentPage = 0;
pageSize = 30;
totalItems = 0;
totalPages = 0;
selectedBookings: any[] = [];
globalSearchTerm: string = '';

// Data sources
dataSource = new MatTableDataSource<any>();
projectsList: any[] = [];
allSalesExecutive: any[] = [];
sourceDetailedList: any[] = [];
sourcesList: any[] = [];
allChannelPartnerList: any[] = [];

// Pagination and sorting
paginationParams: PaginationParams = {
  offset: 0,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
  search: '',
  filters: {},
  filteredCount: 0,
};

@ViewChild(MatSort) sort!: MatSort;
@ViewChild(MatPaginator) paginator: MatPaginator | null = null;

displayedColumns= [
  {
    key: 'actions',
    label: 'Actions',
    type: 'actions',
    sticky: true,
    disabled: false,
  },
  {
    key: 'sr_no',
    label: 'Sr.no',
    type: 'index',
  },
  { key: 'project_name', label: 'Project Name' },
  { key: 'customer_name', label: 'Name' },
  { key: 'last_follow_up_date', label: 'Follow-up Date', type: 'short_date' },
  { key: 'is_lead_present', label: 'Is Re-Enquiry' },
  { key: 'project_config', label: 'Configuration' },
  { key: 'sales_executive', label: 'Executive' },
  { key: 'lead_level', label: 'Lead Level' },
  { key: 'enquiry_status', label: 'Call Status' },
  { key: 'source', label: 'Source' },
  { key: 'firm_name', label: 'Channel Partner' },
  { key: 'source_detail', label: 'Source Type' },
  {
    key: 'is_token_created',
    label: 'Token Status',
    applyChequeStatusColor: true,
    colorCondition: (element: any) => (element.is_token_created === "Created" ? 'green' : 'red'),
  },
  { key: 'source_executive', label: 'Sourcing Manager' },
  { key: 'remark', label: 'Comment', type: 'truncate' },
  { key: 'created_at', label: 'Created At', type: 'short_date' },

  { key: 'created_by', label: 'Created By' },
  { key: 'updated_by', label: 'Updated By' },
];

// For the template
columns = this.displayedColumns;
columnKeys: string[] = this.displayedColumns.map(col => col.key);
selectedColumns = this.displayedColumns.map(col => col.key);

// Form definition
enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
  project_id: new FormControl<any[]>([], Validators.required),
 
  start_date: new FormControl(null),
  end_date: new FormControl(null),
  ignore_date_filters: new FormControl(false),
});

// Action definitions
enquiryActions: LeadAction[] = [
 
  {
    action: 'addComment',
    icon: 'add_comment',
    tooltip: 'Add Follow-up',
    color: 'primary',
    disabled: () => this.showClaimedEnquiries,
  }
 
];

onRowClick(row: any): void {
  // Implement your row click logic here
  console.log('Row clicked:', row);
  // Or navigate to detail view:
  // this.router.navigate(['/enquiry-details', row.project_enq_id]);
}
scrollIndex: number = 0;
onScrollIndexChange(index: number): void {
  console.log('Scroll index change triggered with index:', index);
  
  // Only fetch more data if the index has changed significantly
  // This prevents multiple API calls when scrolling quickly
  if (index > this.scrollIndex + 15) {
    this.scrollIndex = index;
    console.log('Fetching more data at index:', this.scrollIndex);
    
    // Update the pagination offset based on the scroll index
    // This ensures we're loading the correct page of data
    this.paginationParams.offset = this.scrollIndex;
    
    // Fetch more data
    this.fetchAllEnquiry();
  }
}


constructor(
  private http: HttpClient,
  private dialog: MatDialog,
  private snackBar: MatSnackBar
) {}
cpTargetLoggedData: any;

ngOnInit(): void {
  this.cpTargetLoggedData = history.state.data;
  console.log('CP Target Logged Data:', this.cpTargetLoggedData);
  

  
  this.fetchAllProjects();

}

ngAfterViewInit(): void {
  this.dataSource.paginator = this.paginator;
  this.dataSource.sort = this.sort;
}

// ==================== UTILITY METHODS ====================
hasPermission(...permissions: number[]): boolean {
  if (!this.roleData) return false;
  return this.roleData != null && permissions.some(permission => this.roleData!.includes(permission.toString()));
}

trackByEnquiryId(index: number, item: any): number {
  return item.project_enq_id;
}

onSortChange(sort: Sort): void {
  this.paginationParams.sortBy = sort.active;
  this.paginationParams.sortOrder = sort.direction;
  this.fetchAllEnquiry();
}
getRowClass(row: any): any {
  return {
    'bg-light-yellow': row.sales_executive_id === null,
  };
}



onColumnSelectionChange(): void {
  this.columnKeys = this.selectedColumns;
}

// ==================== DATA FETCHING ====================
fetchAllEnquiry(): void {
  const formValues = this.enquiryFilterForm.value;
  const { limit } = this.paginationParams;

  this.loading = true;

  const filters = this.buildFilters(formValues);

  const payload = {
    offset: this.scrollIndex,
    limit,
    sortBy: this.paginationParams.sortBy,
    sortOrder: this.paginationParams.sortOrder,
    filters,
  };

  console.log('Fetching enquiries with payload:', payload);

  this.http.post(`${this.baseUrl}/site_visit_report`, payload).subscribe({
    next: (res: any) => {
      // Only process the response if success is true
      if (res?.success) {
        this.handleEnquiryResponse(res);
      } else {
        // If not successful, stop loading and show error
        this.loading = false;
        this.snackBar.open(res?.message || 'Failed to fetch enquiries', 'Close', { duration: 3000 });
      }
    },
    error: (err: any) => this.handleEnquiryError(err),
  });
}
onSearchTermChange(searchTerm: string) {
  this.globalSearchTerm = searchTerm;
  this.paginationParams.offset = 0; // Reset to first page when searching
  this.fetchAllEnquiry();
}
hasOnlyRoles(allowedRoles: number[]): boolean {
  if (!this.roleData) return false;
  const currentRoles = this.roleData.split(',').map(Number);
  
  // Check if all user roles are within the allowed roles
  return currentRoles.every(role => allowedRoles.includes(role));
}

private buildFilters(formValues: any): any {
  const userId = sessionStorage.getItem('session_id');
  let telecallerIdValue: any = null; // Default to null
  if (this.hasOnlyRoles([7, 13])) {
    telecallerIdValue = userId ? [Number(userId)] : null;
} else {
    // Always ensure we're passing an array
    // Convert to array if it's not already an array
    telecallerIdValue = Array.isArray(formValues.sales_executive_id) 
        ? formValues.sales_executive_id 
        : (formValues.sales_executive_id ? [formValues.sales_executive_id] : null);
}

  const filters: any = {
      project_id: formValues.project_id?.length ? formValues.project_id : null,
     
      ignore_date_filters: formValues.ignore_date_filters,

  };

  if (!filters.ignore_date_filters) {
      if (formValues.start_date) {
          filters.start_date = this.datePipe.transform(formValues.start_date, 'yyyy-MM-dd');
      }
      if (formValues.end_date) {
          filters.end_date = this.datePipe.transform(formValues.end_date, 'yyyy-MM-dd');
      }
  }

  return filters;
}

private handleEnquiryResponse(res: any): void {
  if (res?.data) {
    this.totalItems = res.total || 0;
    this.totalPages = res.total_pages || Math.ceil(this.totalItems / this.paginationParams.limit);
    this.paginationParams.filteredCount = res.filteredCount || 0;
    this.totalLeads = res.total;

    if (this.paginator) {
      this.paginator.length = this.totalLeads;
      this.paginator.pageIndex = res.current_page ? res.current_page - 1 : 0;
    }

    // If this is a scroll-based fetch (not the initial load), append data instead of replacing
    if (this.scrollIndex > 0 && this.dataSource.data.length > 0) {
      console.log('Appending data from scroll fetch:', res.data.length, 'items');
      // Create a new array with existing data plus new data
      const combinedData = [...this.dataSource.data, ...res.data];
      // Remove duplicates by project_enq_id
      const uniqueData = this.removeDuplicates(combinedData, 'project_enq_id');
      this.dataSource = new MatTableDataSource<any>(uniqueData);
    } else {
      // Initial load or filter change - replace data
      console.log('Setting initial data:', res.data.length, 'items');
      this.dataSource = new MatTableDataSource<any>(res.data);
    }
    
    this.dataSource.sort = this.sort;
    
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }
  
  // Always set loading to false when handling response is complete
  this.loading = false;
}

// Helper method to remove duplicates from the combined data array
private removeDuplicates(array: any[], key: string): any[] {
  return Array.from(
    new Map(array.map(item => [item[key], item])).values()
  );
}

private handleEnquiryError(err: any): void {
  console.error(err);
  this.loading = false;
  this.snackBar.open('Unable to fetch Enquiry.', 'Close', { duration: 3000 });
}

fetchAllProjects(): void {
  this.loading = true;
  const payload = {
    user_id: this.hasPermission(2) ? null : this.userId,
  };

  this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
    next: (res: any) => {
      this.projectsList = res || [];
      this.loading = false;
    },
    error: (err: any) => this.handleDataFetchError('Enquiry', err),
  });
}



private handleDataFetchError(dataType: string, err?: any): void {
  console.error(err);
  this.loading = false;
  this.snackBar.open(`Unable to fetch ${dataType}.`, 'Close', { duration: 3000 });
}

// ==================== PAGINATION ====================
onPageChange(page: number): void {
  this.paginationParams.offset = (page - 1) * this.paginationParams.limit;
  this.fetchAllEnquiry();
}

onPageSizeChange(size: number | string): void {
  this.paginationParams.limit = size === 'All' 
    ? this.paginationParams.filteredCount 
    : size as number;
  this.paginationParams.offset = 0;
  this.fetchAllEnquiry();
}

// ==================== UI ACTIONS ====================
toggleAssignedStatus(): void {
  this.showClaimedEnquiries = !this.showClaimedEnquiries;
 
  this.fetchAllEnquiry();
}



onLeadSelectionChange(checked: boolean, booking: any): void {
  const selectedData = {
    project_enq_id: booking.project_enq_id,
    project_id: booking.project_id,
  };

  if (checked) {
    this.selectedBookings.push(selectedData);
  } else {
    this.selectedBookings = this.selectedBookings.filter(
      item => item.project_enq_id !== selectedData.project_enq_id
    );
  }
}

// ==================== DIALOG METHODS ====================
getLeadActions(action: string, row: any): void {
  const actionHandlers: Record<string, () => void> = {
  
    addComment: () => this.openAddCommentDialog(row),
  };

  if (actionHandlers[action]) {
    actionHandlers[action]();
  } else {
    console.warn('Unknown action:', action);
  }
}



openAddCommentDialog(data: any): void {
  const dialogRef = this.dialog.open(CommentLogComponent, {
    minWidth: '40vw',
    maxWidth: '50vw',
    maxHeight: '100vh',
    data: {
      title: `Add Comment to ${data?.project_name || 'Project'}`,
      payload: 'enquiry_id',
      request: data?.project_enq_id,
      apiUrl: 'add_comment',
      successMessage: 'Follow-up Added Successfully...',
      rowData: data,
      for: 'Enquiries',
    },
  });

  dialogRef.afterClosed().subscribe((result: boolean) => {
    if (result) {
      this.fetchAllEnquiry();
    }
  });
}



}
