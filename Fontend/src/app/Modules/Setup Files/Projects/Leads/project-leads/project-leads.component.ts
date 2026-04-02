import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { catchError, forkJoin, of } from 'rxjs';
import { CommentLogComponent } from '../../../comment-log/comment-log.component';
import { AddProjectleadComponent } from '../add-projectlead/add-projectlead.component';
import { AssignLeadsComponent } from '../assign-leads/assign-leads.component';
import { ViewInfoMobEmailComponent } from '../../../../../Common/View Mobile Email/view-info-mob-email/view-info-mob-email.component';
import { ImportFloorUnitsComponent } from '../../../Floor Unit/import-floor-units/import-floor-units.component';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { ViewMobEmailLogComponent } from '../../../../view Logs/view-mob-email-log/view-mob-email-log.component';
import { ResizableColumnDirective } from '../../../../../Common/directives/resizable-column.directive';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

import { PaginationComponent } from '../../../../../Common/pagination/pagination.component';

import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { AssignProjectDialogComponent } from '../../../Enquiry/assign-project-dialog/assign-project-dialog.component';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { FacebookQuestionComponent } from '../facebook-question/facebook-question.component';

@Component({
  selector: 'app-project-leads',
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
    ResizableColumnDirective,
    AutocompleteReusableComponent,
    ReusableTableComponent,
    PaginationComponent,
  ],
  templateUrl: './project-leads.component.html',
  styleUrl: './project-leads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectLeadsComponent implements OnInit, AfterViewInit {
  sendWhatsApp() {}
  sendEmail() {}
  dataSource = new MatTableDataSource<any>([]);
  loading :boolean=true;
  totalLeads = 0;
  currentPage = 0;
  pageSize = 30;
  baseUrl = environment.API_URL;
  projectsList: any[] = [];
  projectID: any[] = [];
  leadlevelID: any[] = [];
  statusID: any[] = [];
  roleId = Number(sessionStorage.getItem('role_id'));

  selectedRows = new Set<number>();

  selectedLeads: number[] = []; // Array to store selected lead_level_id values

  pipe = new DatePipe('en-US');
  statusDropdown: any[] = [];
  allTelecallerlist: any[] = [];
  talecallerID: any[] = [];
  allLeadLevels: any[] = [];
  customerName: string = '';
  columnsControl = new FormControl<string[]>([]);

  storageUrl = environment.STORAGE_URL;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  columnDefinitions: TableColumn[] = [
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
    { key: 'project_lead_id', label: 'Lead ID' },
    { key: 'project_names', label: 'Project Name' },

    { key: 'date', label: 'Lead Date', type: 'short_date' },
    { key: 'follow_up_date', label: 'Follow-Up Date', type: 'short_date' },
    { key: 'follow_up_time', label: 'Follow-Up Time' },

    { key: 'customer_name', label: 'Client Name' },
    { key: 'lead_type', label: 'Lead Type' },
    { key: 're_enquiry', label: 'Is Re-enquiry' },
    { key: 'integration_name', label: 'Campaign Name' },

    { key: 'imported', label: 'Imported' },
    { key: 'mobile_no', label: 'Phone', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    {
      key: 'alternate_mob_no',
      label: 'Secondary Mobile No',
      type: 'sensitive',
    },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },

    { key: 'telecaller_names', label: 'Telecaller' },
    { key: 'is_booked', label: 'Is Booked' },

    { key: 'source', label: 'Lead Source' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'preference', label: 'Configuration' },
    { key: 'status', label: 'Status' },
    { key: 'remark', label: 'Comment', type: 'truncate' },
    { key: 'site_visited', label: 'Site Visit' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
  ];
  totalItems = 0;

  columns = this.columnDefinitions;
  columnKeys: string[] = this.columnDefinitions.map((col) => col.key);
  selectedColumns = this.columnDefinitions.map((col) => col.key);

  roleData = sessionStorage.getItem('role_id');
  userId = Number(sessionStorage.getItem('session_id'));
  isPanelExpanded: boolean = true;
  searchText: string = '';

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}
  ngOnInit(): void {
   
    this.dataSource.filterPredicate = this.createFilter();
    this.fetchAllProjects();

    this.leadForm
      .get('ignore_date_filters')
      ?.valueChanges.subscribe((checked) => {
        if (checked) {
          this.leadForm.get('start_date')?.reset();
          this.leadForm.get('end_date')?.reset();
          this.leadForm.get('start_followup_date')?.reset();
          this.leadForm.get('end_followup_date')?.reset();
        }
      });

    this.leadForm.get('project_id')?.valueChanges.subscribe((projectID) => {
      if (projectID) {
        this.fetchAllTalecallerList(projectID);
        this.fetchAllEnquiryStatus();
        this.fetchallLeadLevels();
      }
    });
  }

  //  hasPermission(permission: string): boolean {
  //     return this.permissionData?.includes(permission) ?? false;
  //   }
  permissionData = sessionStorage.getItem('permission');

  hasPermission(permission: string): boolean {
    return this.permissionData?.includes(permission) ?? false;
  }


  trackByEnquiryId(index: number, item: any): number {
    return item.project_enq_id;
  }
  leadForm = new FormGroup({
    project_id: new FormControl([], Validators.required),
    lead_level_id: new FormControl([]),
    status_id: new FormControl([]),
    telecaller_id: new FormControl([]),
    start_date: new FormControl(null),
    end_date: new FormControl(null),
    start_followup_date: new FormControl(null),
    end_followup_date: new FormControl(null),
    ignore_date_filters: new FormControl(false), // Add this new control
  });
  globalSearchTerm: string = '';

  onSearchTermChange(searchTerm: string) {
    this.globalSearchTerm = searchTerm;
    this.paginationParams.offset = 0; // Reset to first page when searching
    this.fetchAllProjectLeads();
  }
  togglePanel(): void {
    this.isPanelExpanded = !this.isPanelExpanded;
  }

  readonly panelOpenState = signal(false);
  ngAfterViewInit() {
    if (this.paginator) {
      this.paginator.pageSize = this.pageSize;
      this.paginator.pageIndex = this.currentPage;
      // Initial data load
      this.fetchAllProjectLeads();
    }
  }
  isFiltered: boolean = false;
  totalPages: number = 0;

  selectedProjects: any;
  paginationParams = {
    offset: 0,
    limit: 30,
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: '',
    filters: {},
    filteredCount: 0,
  };
  assignedStatus: number = 0; // 0 = Unassigned (default), 1 = Assigned
 
fetchAllProjectLeads(): void {
  const formValues = this.leadForm.value;
  this.loading = true;

  // Determine if filters are applied
  this.isFiltered = this.hasFiltersApplied(formValues);

  // Prepare telecaller ID based on user role

  // Build filters object
  const filters = this.buildFiltersObject(formValues);
  // const filters = this.buildFilters(formValues);

  // Prepare API payload
  const payload = {
    offset: this.scrollIndex,
    limit: this.paginationParams.limit,
    sortBy: this.paginationParams.sortBy,
    sortOrder: this.paginationParams.sortOrder,
    filters,

  };

  this.http.post(`${this.baseUrl}/fetch_all_lead`, payload).subscribe({
    next: (res: any) => {
      if (res?.status) {
        this.handleFetchSuccess(res);
      }
    },
    error: (err: any) => this.handleFetchError(err),
  });
}

// Helper methods
private hasFiltersApplied(formValues: any): boolean {
  return !!(
    (formValues.project_id ?? []).length ||
    (formValues.lead_level_id ?? []).length ||
    (formValues.status_id ?? []).length ||
    (formValues.telecaller_id ?? []).length ||
    formValues.start_date ||
    formValues.end_date ||
    formValues.start_followup_date ||
    formValues.end_followup_date
  );
}



private buildFiltersObject(formValues: any): any {

  const userId = Number(sessionStorage.getItem('session_id'));
    
    if (this.hasOnlyRoles([7,13])) {
      return userId ? [userId] : null;
    }
    
    if (formValues.telecaller_id?.length) {
      return Array.isArray(formValues.telecaller_id)
        ? formValues.telecaller_id.map((id:any) => Number(id))
        : [Number(formValues.telecaller_id)];
    }
  return {
    project_id: formValues.project_id?.length ? formValues.project_id : null,
    lead_level_id: formValues.lead_level_id?.length ? formValues.lead_level_id : null,
    status_id: formValues.status_id?.length ? formValues.status_id : null,
    telecaller_id: formValues.telecaller_id?.length ? formValues.telecaller_id : null,
    start_date: this.formatDate(formValues.start_date),
    end_date: this.formatDate(formValues.end_date),
    start_followup_date: this.formatDate(formValues.start_followup_date),
    end_followup_date: this.formatDate(formValues.end_followup_date),
    user_id: this.userId,
    assigned_status: 1,
    search: this.globalSearchTerm,

  };
}

private formatDate(date: any): string | null {
  return date ? this.pipe.transform(date, 'yyyy-MM-dd') : null;
}

handleFetchSuccess(res: any) {
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

private handleFetchError(err: any): void {
  console.error('Error fetching leads:', err);
  this.snackBar.open('Failed to fetch leads. Please try again.', 'Close', {
    duration: 3000,
    panelClass: ['snackbar-error']
  });
}

private updatePaginationData(res: any): void {
  this.totalItems = res.total || 0;
  this.totalPages = res.total_pages || Math.ceil(this.totalItems / this.paginationParams.limit);
  this.paginationParams.filteredCount = res.filteredCount || 0;
  this.totalLeads = res.total;

  if (this.paginator) {
    this.paginator.length = this.totalLeads;
    this.paginator.pageIndex = res.current_page ? res.current_page - 1 : 0;
  }
}

private processTableData(newData: any[]): any[] {
  // If this is a scroll-based fetch (not initial load), append data
  if (this.scrollIndex > 0 && this.dataSource.data.length > 0) {
    const combinedData = [...this.dataSource.data, ...newData];
    return this.removeDuplicates(combinedData, 'project_enq_id');
  }
  
  // Initial load or filter change - return new data
  return newData;
}

private setupTableFeatures(): void {
  this.dataSource.sort = this.sort;
  
  if (this.paginator) {
    this.dataSource.paginator = this.paginator;
  }
}


  private removeDuplicates(array: any[], key: string): any[] {
    return Array.from(
      new Map(array.map(item => [item[key], item])).values()
    );
  }

  onSortChange(sort: Sort): void {
    this.paginationParams.sortBy = sort.active;
    this.paginationParams.sortOrder = sort.direction;
    this.fetchAllProjectLeads();
  }
  toggleAssignedStatus(): void {
    this.assignedStatus = this.assignedStatus === 0 ? 1 : 0;
    this.fetchAllProjectLeads(); // Re-fetch with new status
  }
 

  bookingActions = [
    {
      action: 'delete',
      icon: 'delete',
      tooltip: 'Delete Lead',
      color: 'warn',
      show: (row: any) => row?.telecaller_id !== null && this.hasPermission('400'),
    },
    {
      action: 'addComment',
      icon: 'add_comment',
      tooltip: 'Follow Up',
      color: 'primary',
      show: (row: any) =>  this.hasPermission('405'),
    },
    // {
    //   action: 'viewLog',
    //   icon: 'dataset',
    //   tooltip: 'View Log',
    //   color: 'primary',
    //   show: (row: any) => row?.telecaller_id !== null,
    // },
    {
      action: 'editLead',
      icon: 'edit_note',
      tooltip: 'Edit Lead',
      color: 'primary',
      show: (row: any) =>
        row?.telecaller_id !== null && this.hasPermission('402'),
      // show: (row:any) => [1, 2, 4].includes(this.roleId) && ?.telecaller_id !== null,
    },
  ];

  onBookingAction(action: string, row: any): void {
    if (action === 'delete') {
      this.deleteProjectLead(row.project_lead_id);
    } else if (action === 'addComment') {
      this.openAddCommentDialog(row);
    } else if (action === 'viewLog') {
      this.navigateToViewLog(row.project_lead_id);
    } else if (action === 'editLead') {
      this.addProjectLead(row.project_lead_id ? 'edit' : 'add', row);
    }
  }

  onSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.paginationParams.search = searchValue;
    this.paginationParams.offset = 0;
    this.currentPage = 1;
    this.fetchAllProjectLeads();
  }

  onPageChange(page: number) {
    this.paginationParams.offset = (page - 1) * this.paginationParams.limit;
    this.fetchAllProjectLeads();
  }
  onPageSizeChange(size: number | string) {
    if (size === 'All') {
      this.paginationParams.limit = this.paginationParams.filteredCount;
    } else {
      this.paginationParams.limit = size as number;
    }
    this.paginationParams.offset = 0; // Reset to first page
    this.fetchAllProjectLeads();
  }

  filterValues: any = {};

  applyColumnFilter(event: { key: string; value: string }) {
    this.filterValues[event.key] = event.value;
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }
  createFilter(): (data: any, filter: string) => boolean {
    return (data: any, filter: string): boolean => {
      const searchTerms = JSON.parse(filter);
      return Object.keys(searchTerms).every((key) => {
        return data[key]?.toString().toLowerCase().includes(searchTerms[key]);
      });
    };
  }
  navigateToViewLog(projectLeadId: number) {
    this.router.navigate(['/all-viewLogs', projectLeadId]);
  }

  applyFilter(searchText: string): void {
    this.searchText = searchText;
    this.fetchAllProjectLeads();
  }

  // Check if all rows are selected
  isAllSelected(): boolean {
    return (
      this.dataSource?.data?.length > 0 &&
      this.dataSource.data.every((row) =>
        this.selectedRows.has(row.project_lead_id)
      )
    );
  }
  
  isSomeSelected(): boolean {
    return this.selectedRows.size > 0 && !this.isAllSelected();
  }
  selectedBookings: any[] = [];
  onLeadSelectionChange(checked: boolean, booking: any) {
    debugger;
    // Extract only the needed fields
    const selectedData = {
      project_lead_id: booking.project_lead_id,
      project_id: booking.project_id,
    };

    if (checked) {
      // Add to array if checked
      this.selectedBookings.push(selectedData);
    } else {
      // Remove from array if unchecked
      this.selectedBookings = this.selectedBookings.filter(
        (item: { project_lead_id: any }) =>
          item.project_lead_id !== selectedData.project_lead_id
      );
    }
    console.log('Selected bookings:', this.selectedBookings);
  }
  assignLead(): void {
    if (this.selectedBookings.length === 0) {
      alert('Please select at least one lead');
      return;
    }

    const dialogRef = this.dialog.open(AssignLeadsComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: 'Assign Lead',
        apiUrl: 'assign_lead',
        successMessage: 'Lead assigned successfully',
        rowData: this.selectedBookings,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllProjectLeads();
        this.selectedBookings = []; // Clear the selection
      }
    });
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
      this.fetchAllProjectLeads();
    }
  }
 
  openDialog(title: string, value: string, project_lead_id: number, call_masking_ids?: number): void {
    const dialogRef = this.dialog.open(ViewInfoMobEmailComponent, {
      minWidth: '20vw',
      data: { title, value, project_lead_id, call_masking_ids },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllProjectLeads(); // Refresh the list if data was modified
      }
    });
  }
  fetchAllTalecallerList(projectId: any): void {
    this.http
      .post(`${this.baseUrl}/telecaller_dropdown`, { project_id: projectId })
      .subscribe({
        next: (res: any) => {
          this.allTelecallerlist = res.map((item: any) => ({
            ...item,
            full_name: `${item.first_name} ${item.last_name}`,
          }));
        },
        error: () =>
          this.snackBar.open('Unable to fetch telecallers.', 'Close', {
            duration: 3000,
          }),
      });
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
  fetchallLeadLevels(): void {
 

    this.http.get(`${this.baseUrl}/fetch_lead_level`).subscribe({
      next: (res: any) => {
        if (res) {
          this.allLeadLevels = res;
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
  fetchAllEnquiryStatus(): void {
 

    this.http.get(`${this.baseUrl}/enq_status_dropdown`).subscribe({
      next: (res: any) => {
        if (res) {
          this.statusDropdown = res;
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


  deleteProjectLead(leadID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Lead?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const reason = result.reason; // Get the reason from the dialog response

        let requestPayload = {
          project_lead_id: leadID,
          reason: reason, // Set the reason from the dialog
          created_by: this.userId, // Set created_by value here
        };

        this.http
          .post(`${this.baseUrl}/delete_lead`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Lead deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllProjectLeads(); // Ensure this is called here to update the teams
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete lead.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
  addProjectLead(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddProjectleadComponent, {
      minWidth: '70vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Project Lead' : 'Edit Project Lead',
        apiUrl: action === 'add' ? 'add_lead' : 'update_lead',
        successMessage:
          action === 'add'
            ? 'Project Lead added successfully'
            : 'Project Lead updated successfully',
        rowData: row, // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllProjectLeads(); // Refresh the list if data was modified
      }
    });
  }

  openAddCommentDialog(data: any): void {
    const dialogRef = this.dialog.open(CommentLogComponent, {
      minWidth: '60vw',
      maxWidth: '50vw',
      maxHeight: '100vh',
      data: {
        title: `Add FollowUp `,
        payload: 'project_lead_id',
        request: data?.project_lead_id,
        apiUrl: 'add_lead_follow_up', // Adjust API if necessary
        successMessage: 'Follow-up Added Successfully...', // Dynamically include property_name
        rowData: data,
        for: 'lead-followUp',
      },
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.fetchAllProjectLeads(); // Refresh the list if data was modified
      }
    });
  }

  hasOnlyRoles(allowedRoles: number[]): boolean {
    if (!this.roleData) {
      return false;
    }
    const userRoles = this.roleData
      .split(',')
      .map((role) => Number(role.trim()))
      .filter((role) => !isNaN(role));

    // Return true if user has at least one of the allowed roles
    return userRoles.some((role) => allowedRoles.includes(role));
  }


  headerButtons = [
    {
      label: 'Assign Project',
      icon: 'assignment_ind',
      color: 'primary',
       disabled: () => this.selectedBookings.length === 0,
      action: () => this.assignProject(),
      show: () => this.hasPermission('398'),
    },
    {
      label: 'Transfer/Assign',
      icon: 'assignment_ind',
      color: 'accent',
      action: () => this.assignLead(),
      disabled: () => this.selectedBookings.length === 0,
      show: () => this.hasPermission('399'),
    },

    {
      label: 'Facebook Question',
      icon: 'facebook',
      color: 'primary',
       disabled: () => this.selectedBookings.length === 0,
      action: () => this.openFacebookQuestion(),
      show: () => this.hasPermission('398'),
    },
    {
      label: 'Upload leads',
      icon: 'post_add',
      color: 'primary',
      disabled: () => false,
      action: () => this.openImportFloorUnit(),
      show: () => this.hasPermission('401'),
    },

    {
      label: 'Add New Lead',
      icon: 'add_box',
      color: 'primary',
      disabled: () => false,
      action: () => this.addProjectLead('add'),
      show: () => this.hasPermission('402'),


    },
  ];
  openFacebookQuestion(): void {
    // Check if there are any selected bookings
    if (this.selectedBookings.length === 0) {
      alert('Please select at least one booking to assign');
      return;
    }

    const dialogRef = this.dialog.open(FacebookQuestionComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
   
        rowData: this.selectedBookings[0].project_lead_id,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllProjectLeads(); // Refresh the list if data was modified
        // Optionally clear the selection after assignment
        this.selectedBookings = [];
      }
    });
  }
  assignProject(): void {
    // Check if there are any selected bookings
    if (this.selectedBookings.length === 0) {
      alert('Please select at least one booking to assign');
      return;
    }

    const dialogRef = this.dialog.open(AssignProjectDialogComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: 'Assign Project',
        apiUrl: 'assign_lead',
        successMessage: 'Enquiry assigned successfully',
        rowData: this.selectedBookings,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllProjectLeads(); // Refresh the list if data was modified
        // Optionally clear the selection after assignment
        this.selectedBookings = [];
      }
    });
  }
  openImportFloorUnit() {
    let dialogRef = this.dialog.open(ImportFloorUnitsComponent, {
      width: '500px', // Adjust width as needed
      disableClose: true,
      data: {
        for: 'projectLead',
        API_URL:`import_project_lead`,
      }, 
    });

    dialogRef.afterClosed().subscribe({
      next: (res: any) => {
        console.log('Import completed:', res);
      },
      error: (err: any) => {
        console.error('Error uploading applicant:', err);
        this.snackBar.open('An error occurred, please try later', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }
}
