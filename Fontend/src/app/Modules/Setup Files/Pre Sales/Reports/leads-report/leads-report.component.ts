import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { PaginationComponent } from '../../../../../Common/pagination/pagination.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { CommentLogComponent } from '../../../comment-log/comment-log.component';

// Interface definitions
interface ColumnDefinition {
  key: string;
  label: string;
  type?: 'actions' | 'index' | 'date' | 'truncate';
  sticky?: boolean;
  disabled?: boolean;
  isAmount?: boolean;
  applyChequeStatusColor?: boolean;
  colorCondition?: (element: any) => string;
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
  sortOrder: 'asc' | 'desc';
  search: string;
  filters: Record<string, any>;
  filteredCount: number;
}

interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
  ignore_date_filters: FormControl<boolean | null>;
}

interface LeadReportResponse {
  data: any[];
  total: number;
  total_pages?: number;
  current_page?: number;
  filteredCount?: number;
}
@Component({
  selector: 'app-leads-report',
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
  templateUrl: './leads-report.component.html',
  styleUrl: './leads-report.component.scss'
})
export class LeadsReportComponent {
 // Constants
 private readonly API_ENDPOINTS = {
  DISCARD_LEAD_REPORT: `${environment.API_URL}/fetch_discard_lead_report`,
  PROJECT_DROPDOWN: `${environment.API_URL}/user_project_dropdown`,
};
private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly datePipe = new DatePipe('en-US');

// Component state
loading = false;
showClaimedEnquiries = false;
isFiltered = false;
totalLeads = 0;

// Pagination
paginationParams: PaginationParams = {
  offset: 0,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
  search: '',
  filters: {},
  filteredCount: 0,
};

// Data sources
dataSource = new MatTableDataSource<any>();
projectsList: any[] = [];

// View children
@ViewChild(MatSort) sort!: MatSort;
@ViewChild(MatPaginator) paginator: MatPaginator | null = null;
currentDate: Date = new Date();
startOfMonth: Date = new Date(
  this.currentDate.getFullYear(),
  this.currentDate.getMonth(),
  1
);
endOfMonth: Date = new Date(
  this.currentDate.getFullYear(),
  this.currentDate.getMonth() + 1,
  0
);
// Column definitions
displayedColumns: ColumnDefinition[] = [
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
  { key: 'project_names', label: 'Project Name' },
  { key: 'project_lead_id', label: 'Lead ID' },
     { key: 'customer_name', label: 'Client Name' },
         { key: 'created_at', label: 'Lead Date', type: 'date' },

  { key: 'follow_up_date', label: 'Follow-up Date' },
  { key: 'source', label: 'Source' },
  { key: 'source_description', label: 'Source Description' },
  { key: 'source_detail', label: 'Source Type' },
  { key: 'remark', label: 'Comment', type: 'truncate' },
  { key: 'lead_type', label: 'Lead Type' },
  // { key: 'preference', label: 'Configuration' },
  { key: 'telecaller_names', label: 'Telecaller' },

];

columnKeys: string[] = this.displayedColumns.map(col => col.key);
selectedColumns = [...this.columnKeys];

// Form definition
enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
project_id: new FormControl<any[]>([], Validators.required),
start_date: new FormControl(this.startOfMonth),
end_date: new FormControl(this.endOfMonth),
ignore_date_filters: new FormControl<boolean>(false),
});

// Action definitions
enquiryActions: LeadAction[] = [
  {
    action: 'addComment',
    icon: 'add_comment',
    tooltip: 'Add Follow-up',
    color: 'primary',
    disabled: () => false,
  },
];
totalItems = 0;
totalPages = 0;

constructor(
  private http: HttpClient,
  private dialog: MatDialog,
  private router: Router,
  private snackBar: MatSnackBar,
) {}

ngOnInit(): void {
  this.fetchAllProjects();
}

ngAfterViewInit(): void {
  this.dataSource.paginator = this.paginator;
  this.dataSource.sort = this.sort;
}

// ==================== PERMISSION METHODS ====================
get userId(): number {
  return Number(sessionStorage.getItem('session_id'));
}

get roleData(): string | null {
  return sessionStorage.getItem('role_id');
}

hasPermission(...permissions: number[]): boolean {
  if (!this.roleData) return false;
  return permissions.some(permission => 
    this.roleData!.includes(permission.toString())
  );
}

hasOnlyRoles(allowedRoles: number[]): boolean {
  if (!this.roleData) return false;
  const currentRoles = this.roleData.split(',').map(Number);
  return currentRoles.every(role => allowedRoles.includes(role));
}

// ==================== DATA FETCHING ====================
fetchAllDiscardLeadReports(): void {
  this.loading = true;
  const payload = this.buildRequestPayload();

  this.http.post<LeadReportResponse>(this.API_ENDPOINTS.DISCARD_LEAD_REPORT, payload)
    .subscribe({
      next: res => this.handleEnquiryResponse(res),
      error: err => this.handleEnquiryError(err),
    });
}

private buildRequestPayload(): any {
  const formValues = this.enquiryFilterForm.value;
  
  return {
    offset: this.paginationParams.offset,
    limit: this.paginationParams.limit,
    sortBy: this.paginationParams.sortBy,
    sortOrder: this.paginationParams.sortOrder,
    filters: this.buildFilters(formValues),
  };
}

private buildFilters(formValues: any): Record<string, any> {
  const filters: Record<string, any> = {
    project_id: formValues.project_id?.length ? formValues.project_id : null,
    ignore_date_filters: formValues.ignore_date_filters,
    claim_status: this.showClaimedEnquiries ? 1 : 0,
  };


  // Add date filters if not ignored
  if (!filters['ignore_date_filters']) {
    if (formValues['start_date']) {
      filters['start_date'] = this.formatDate(formValues['start_date']);
    }
    if (formValues.end_date) {
      filters['end_date'] = this.formatDate(formValues.end_date);
    }
  }

  return filters;
}

private formatDate(date: Date): string | null {
  return this.datePipe.transform(date, this.DATE_FORMAT);
}

private handleEnquiryResponse(res: LeadReportResponse): void {
  if (res?.data) {
    this.totalItems = res.total || 0;
    this.totalPages = res.total_pages || Math.ceil(this.totalItems / this.paginationParams.limit);
    this.paginationParams.filteredCount = res.filteredCount || 0;
    this.totalLeads = res.total;

    this.updatePaginator(res);
    this.dataSource.data = res.data;
    this.dataSource.sort = this.sort;
  }
  this.loading = false;
}

private updatePaginator(res: LeadReportResponse): void {
  if (this.paginator) {
    this.paginator.length = this.totalLeads;
    this.paginator.pageIndex = res.current_page ? res.current_page - 1 : 0;
    this.dataSource.paginator = this.paginator;
  }
}

private handleEnquiryError(err: any): void {
  console.error('Error fetching discard lead report:', err);
  this.loading = false;
  this.showSnackBar('Unable to fetch discard lead report.');
}

fetchAllProjects(): void {
  this.loading = true;
  const payload = {
    user_id: this.hasPermission(2) ? null : this.userId,
  };

  this.http.post(this.API_ENDPOINTS.PROJECT_DROPDOWN, payload).subscribe({
    next: (res: any) => {
      this.projectsList = res || [];
      this.loading = false;
    },
    error: (err: any) => {
      console.error('Error fetching projects:', err);
      this.loading = false;
      this.showSnackBar('Unable to fetch projects.');
    },
  });
}

// ==================== PAGINATION ====================
onPageChange(page: number): void {
  this.paginationParams.offset = (page - 1) * this.paginationParams.limit;
  this.fetchAllDiscardLeadReports();
}

onPageSizeChange(size: number | string): void {
  this.paginationParams.limit = size === 'All' 
    ? this.paginationParams.filteredCount 
    : size as number;
  this.paginationParams.offset = 0;
  this.fetchAllDiscardLeadReports();
}

// ==================== DIALOG METHODS ====================
handleLeadAction(action: string, row: any): void {
  const actionHandlers: Record<string, (row: any) => void> = {
    addComment: this.openAddCommentDialog.bind(this),
  };

  const handler = actionHandlers[action];
  if (handler) {
    handler(row);
  } else {
    console.warn(`Unknown action: ${action}`);
  }
}

private openAddCommentDialog(data: any): void {
  const dialogRef = this.dialog.open(CommentLogComponent, {
    minWidth: '60vw',
    maxWidth: '50vw',
    maxHeight: '100vh',
    data: {
      title: 'Add FollowUp',
      payload: 'project_lead_id',
      request: data?.project_lead_id,
      apiUrl: 'add_lead_follow_up',
      successMessage: 'Follow-up Added Successfully...',
      rowData: data,
      for: 'lead-followUp',
    },
  });

  dialogRef.afterClosed().subscribe((result: boolean) => {
    if (result) {
      this.fetchAllDiscardLeadReports();
    }
  });
}

// ==================== HELPER METHODS ====================
private showSnackBar(message: string): void {
  this.snackBar.open(message, 'Close', { duration: 3000 });
}
}
