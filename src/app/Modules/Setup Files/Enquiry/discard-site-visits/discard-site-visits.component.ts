import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ResizableColumnDirective } from '../../../../Common/directives/resizable-column.directive';
import { PaginationComponent } from '../../../../Common/pagination/pagination.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn, ActionButton, ActionEvent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ViewInfoMobEmailComponent } from '../../../../Common/View Mobile Email/view-info-mob-email/view-info-mob-email.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { CommentLogComponent } from '../../comment-log/comment-log.component';
import { ImportFloorUnitsComponent } from '../../Floor Unit/import-floor-units/import-floor-units.component';
import { AddProjectleadComponent } from '../../Projects/Leads/add-projectlead/add-projectlead.component';
import { AssignLeadsComponent } from '../../Projects/Leads/assign-leads/assign-leads.component';
interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  source_id: FormControl<any>;
  user_id: FormControl<any[] | null>;
  sales_executive_id: FormControl<number[] | null>; // More specific type
  channel_partner_id: FormControl<any>;
  source_detail_id: FormControl<any>;
  start_date: FormControl<any | null>;
  end_date: FormControl<any | null>;
  project_configuration_id: FormControl<any>;
  ignore_date_filters: FormControl<boolean | null>;
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
@Component({
  selector: 'app-discard-site-visits',
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
    ResizableColumnDirective, // Add the component here
    AutocompleteReusableComponent,

    DragDropModule,
    PaginationComponent,
    ReusableTableComponent,
    ConfigurableAgGridDataComponent,
    // Add the pipe here
  ],
  templateUrl: './discard-site-visits.component.html',
  styleUrl: './discard-site-visits.component.scss'
})
export class DiscardSiteVisitsComponent implements OnInit, AfterViewInit{
  // Constants and configuration
  private readonly baseUrl = environment.API_URL;
  private readonly storageUrl = environment.STORAGE_URL;
  private readonly datePipe = new DatePipe('en-US');
  roleId = Number(sessionStorage.getItem('role_id'));

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
  preferenceDropdown:any[]=[]

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
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Column definitions for AG Grid (actions and sr_no are handled automatically)
  columnDefinitions: TableColumn[] = [
    { key: 'project_name', label: 'Project Name' },
    { key: 'enquiry_date', label: 'Date', type: 'mediumDate' },
    { key: 'full_name', label: 'Client Name' },
    { key: 'mobile_no', label: 'Mobile No', type: 'sensitive' },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
    { key: 'project_config', label: 'Configuration' },
    { key: 'min_budget', label: 'Min Budget', isAmount: true },
    { key: 'max_budget', label: 'Max Budget', isAmount: true },
    { key: 'remark', label: 'Comment', type: 'truncate' },
    { key: 'sales_executive', label: 'Executive' },
    { key: 'is_lead_present', label: 'Is Re-Enquiry' },
    { key: 'age_range', label: 'Age Range' },
    { key: 'alternate_mob_no', label: 'Secondary Mobile No', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    { key: 'source', label: 'Source' },
    { key: 'firm_name', label: 'Channel Partner' },
    { key: 'source_description', label: 'Source Description' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'sourcing_manager', label: 'Sourcing Manager' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  // Legacy column definitions (kept for backward compatibility if needed)
  displayedColumns = [
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

    { key: 'enquiry_date', label: 'Date', type: 'short_date' },

    { key: 'full_name', label: 'Client Name' },
    { key: 'mobile_no', label: 'Mobile No', type: 'sensitive' },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
    { key: 'project_config', label: 'Configuration' },

    { key: 'min_budget', label: 'Min Budget', isAmount: true },
    { key: 'max_budget', label: 'Max Budget', isAmount: true },
    { key: 'remark', label: 'Comment', type: 'truncate' },
    { key: 'sales_executive', label: 'Executive' },

    { key: 'is_lead_present', label: 'Is Re-Enquiry' },

    { key: 'age_range', label: 'Age Range' },

    { key: 'alternate_mob_no', label: 'Secondary Mobile No', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    { key: 'source', label: 'Source' },
    { key: 'firm_name', label: 'Channel Partner' },
    { key: 'source_description', label: 'Source Description' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'sourcing_manager', label: 'Sourcing Manager' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  // Actions for AG Grid (can be populated later if needed)
  bookingActions: ActionButton[] = [];

  // For the template
  columns = this.displayedColumns;

  // Form definition
  enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any[]>([], Validators.required),
    source_id: new FormControl(),
    project_configuration_id : new FormControl(),

    user_id: new FormControl<any[]>([], Validators.required),
sales_executive_id: new FormControl<number[]>([]),
    channel_partner_id: new FormControl(),
    source_detail_id: new FormControl(),
    start_date: new FormControl(null),
    end_date: new FormControl(null),
    ignore_date_filters: new FormControl(false),
  });



  onRowClick(row: any): void {
    // Implement your row click logic here
    console.log('Row clicked:', row);
    // Or navigate to detail view:
    // this.router.navigate(['/enquiry-details', row.project_enq_id]);
  }
  // Note: AG Grid handles scrolling and pagination automatically, so scrollIndex is no longer needed


  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    public router: Router,
    private snackBar: MatSnackBar
  ) {}
  cpTargetLoggedData: any;
  successBookingData: any;

  ngOnInit(): void {
    this.cpTargetLoggedData = history.state.data;
    this.successBookingData = history.state.successBookingData;
 
    
    if (this.cpTargetLoggedData) {
      this.enquiryFilterForm.patchValue({
        project_id: this.cpTargetLoggedData.project_id ? [this.cpTargetLoggedData.project_id] : []
      });
    }
    
    if (this.successBookingData && this.successBookingData.project_id) {
      this.enquiryFilterForm.patchValue({
        project_id: [this.successBookingData.project_id]
      });
    }
    
    this.fetchAllProjects();
    this.fetchAllSources();
    this.setupFormListeners();
    
  
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

  // ==================== FORM HANDLING ====================
  private setupFormListeners(): void {
    this.enquiryFilterForm.get('source_id')?.valueChanges.subscribe(sourceId => {
      if (sourceId) {
        this.fetchAllSourceDetails(sourceId);
      }
    });

    this.enquiryFilterForm.get('project_id')?.valueChanges.subscribe(projectID => {
      if (projectID) {
        this.fetchAllSalesExecutive(projectID);
        this.fechpreferencedropdown(projectID)
      }
    });
  }


  // ==================== DATA FETCHING ====================
  fetchAllEnquiry(): void {
    // Refresh AG Grid data instead of making direct HTTP call
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }

  getAgGridPayload(): any {
    const formValues = this.enquiryFilterForm.value;
    const filters = this.buildFilters(formValues);

    // AG Grid will handle offset and limit automatically, but we include them for initial values
    return {
      offset: 0,
      limit: this.paginationParams.limit,
      sortBy: this.paginationParams.sortBy,
      sortOrder: this.paginationParams.sortOrder,
      filters,
    };
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
        source_id: formValues.source_id || null,
        project_configuration_id: formValues.project_configuration_id || null,

        user_id: formValues.user_id?.length ? formValues.user_id : this.userId,
        channel_partner_id: formValues.channel_partner_id || null,
        source_detail_id: formValues.source_detail_id || null,
        sales_executive_id: telecallerIdValue && telecallerIdValue.length > 0 ? telecallerIdValue : null, // Pass null if empty array
        ignore_date_filters: formValues.ignore_date_filters,
        claim_status:1 ,
        search: this.globalSearchTerm,
        project_enq_id: this.cpTargetLoggedData?.month_project_enq_id || null,
        success_booking_project_id: this.successBookingData?.project_id || null,
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

      // Initial load or filter change - replace data
      // Note: This method is kept for backward compatibility but is no longer used with AG Grid
      console.log('Setting initial data:', res.data.length, 'items');
      this.dataSource = new MatTableDataSource<any>(res.data);
      
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

  fetchAllSources(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/source_dropdown`).subscribe({
      next: (res: any) => {
        this.sourcesList = res || [];
        this.loading = false;
      },
      error: (err: any) => this.handleDataFetchError('source details', err),
    });
  }
  fechpreferencedropdown(projectID: any): void {
    this.http
      .post(`${this.baseUrl}/web_config_dropdown`, { project_id: projectID })
      .subscribe({
        next: (res: any) => {
          this.preferenceDropdown = res;
        },
        error: () => {},
      });
  }
  fetchAllSalesExecutive(projectID: any): void {
    this.http
      .post(`${this.baseUrl}/project_sales_executive_dropdown`, { project_id: projectID })
      .subscribe({
        next: (res: any) => this.allSalesExecutive = res || [],
        error: (err: any) => this.handleDataFetchError('channel partners', err),
      });
  }

  fetchAllSourceDetails(sourceId: any): void {
    this.http
      .post(`${this.baseUrl}/source_detail_dropdown`, { source_id: sourceId })
      .subscribe({
        next: (res: any) => {
          this.sourceDetailedList = (res || []).map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner})`,
          }));
        },
        error: () => this.handleDataFetchError('source details'),
      });
  }

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
        error: () => this.handleDataFetchError('source details'),
      });
  }

  private handleDataFetchError(dataType: string, err?: any): void {
    console.error(err);
    this.loading = false;
    this.snackBar.open(`Unable to fetch ${dataType}.`, 'Close', { duration: 3000 });
  }


  // ==================== AG GRID EVENT HANDLERS ====================
  onActionClick(event: ActionEvent<any>): void {
    // Handle action clicks here
    console.log('Action clicked:', event.action, event.row);
    // Add your action handling logic here
  }

  onRowSelected(selectedRows: any[]): void {
    // Handle row selection changes
    this.selectedBookings = selectedRows;
    console.log('Selected rows:', selectedRows);
  }

 





}
