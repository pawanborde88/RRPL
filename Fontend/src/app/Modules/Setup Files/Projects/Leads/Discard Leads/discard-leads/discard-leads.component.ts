import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal, ViewChild, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import { ResizableColumnDirective } from '../../../../../../Common/directives/resizable-column.directive';
import { PaginationComponent } from '../../../../../../Common/pagination/pagination.component';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, distinctUntilChanged, of, shareReplay } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
import { ViewInfoMobEmailComponent } from '../../../../../../Common/View Mobile Email/view-info-mob-email/view-info-mob-email.component';
import { ConfirmDialogComponent } from '../../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { CommonService } from '../../../../../../Service/common/common.service';
import { ViewMobEmailLogComponent } from '../../../../../view Logs/view-mob-email-log/view-mob-email-log.component';
import { CommentLogComponent } from '../../../../comment-log/comment-log.component';
import { ImportFloorUnitsComponent } from '../../../../Floor Unit/import-floor-units/import-floor-units.component';
import { AddProjectleadComponent } from '../../add-projectlead/add-projectlead.component';
import { AssignLeadsComponent } from '../../assign-leads/assign-leads.component';
import * as XLSX from 'xlsx';
import { ConfigurableAgGridDataComponent } from '../../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';

@Component({
  selector: 'app-discard-leads',
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
    ConfigurableAgGridDataComponent,
    // Add the pipe here
  ],
  templateUrl: './discard-leads.component.html',
  styleUrl: './discard-leads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiscardLeadsComponent implements OnInit {
  // Dependency Injection
  private readonly http = inject(HttpClient);
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  // Session data - computed signals for reactive access
  readonly roleId = computed(() => Number(sessionStorage.getItem('role_id')) || 0);
  readonly userId = computed(() => Number(sessionStorage.getItem('session_id')) || 0);
  readonly roleData = computed(() => sessionStorage.getItem('role_id') || '');

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly statusDropdown = signal<any[]>([]);
  readonly allTelecallerlist = signal<any[]>([]);
  readonly allLeadLevels = signal<any[]>([]);
  readonly scrollIndex = signal<number>(0);
  readonly globalSearchTerm = signal<string>('');
  readonly isPanelExpanded = signal<boolean>(true);
  readonly selectedColumns = signal<string[]>([]);

  // Pagination state
  readonly paginationParams = signal<{
    offset: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    search: string;
    filters: Record<string, any>;
    filteredCount: number;
  }>({
    offset: 0,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: '',
    filters: {},
    filteredCount: 0,
  });

  // ViewChild
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Form
  readonly columnsControl = new FormControl<string[]>([]);
  // Column definitions
  readonly columnDefinitions = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'project_lead_id', label: 'Lead ID' },
    { key: 'date', label: 'Lead Date', type: 'mediumDate'},
    { key: 'follow_up_date', label: 'Follow-Up Date', type: 'mediumDate' },
    { key: 'project_names', label: 'Project Name' },
    { key: 'customer_name', label: 'Client Name' },
    { key: 'preference', label: 'Configuration' },
    { key: 'mobile_no', label: 'Phone', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    {
      key: 'alternate_mob_no',
      label: 'Secondary Mobile No',
      type: 'sensitive',
    },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
    { key: 'source', label: 'Source' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'telecaller_names', label: 'Talecaller Name' },
    { key: 'remark', label: 'Remark' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
  ] as const;

  readonly displayedColumns = this.columnDefinitions.map((col) => col.key);

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;
  ngOnInit(): void {
    this.fetchallLeadLevels();
    this.fetchAllEnquiryStatus();
    this.fetchAllProjects();
    
    // Set initial selected columns
    const initialColumns = this.columnDefinitions.map((col) => col.key);
    this.selectedColumns.set(initialColumns);
    this.columnsControl.setValue(initialColumns);
    
    this.columnsControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((selectedKeys) => {
        this.selectedColumns.set(selectedKeys || []);
      });

    // Project ID listener
    this.leadForm.get('project_id')?.valueChanges
      .pipe(
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((projectID) => {
        if (projectID && Array.isArray(projectID) && projectID.length > 0) {
          this.fetchAllTalecallerList(projectID);
        } else {
          this.allTelecallerlist.set([]);
        }
      });
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

  readonly panelOpenState = signal(false);

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.leadForm.value;
    const telecallerIdValue = this.getTelecallerIdValue(formValues);
    const filters = this.buildFiltersObject(formValues, telecallerIdValue);
    const paginationState = this.paginationParams();

    return {
      offset: paginationState.offset,
      limit: paginationState.limit,
      sortBy: paginationState.sortBy,
      sortOrder: paginationState.sortOrder,
      filters: {
        ...filters,
        search: this.globalSearchTerm(),
        assigned_status: 1,
      }
    };
  });
  fetchallLeadLevels(): void {
    this.commonService
      .fetchLeadLevels()
      .pipe(
        catchError((err: any) => {
          console.error(err);
          this.snackBar.open('Unable to fetch lead levels.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.allLeadLevels.set(res);
          }
        }
      });
  }

  fetchAllEnquiryStatus(): void {
    this.commonService
      .fetchEnquiryStatusDropdown()
      .pipe(
        catchError((err: any) => {
          console.error(err);
          this.snackBar.open('Unable to fetch enquiry status.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.statusDropdown.set(res);
          }
        }
      });
  }

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
  hasOnlyRoles(allowedRoles: number[]): boolean {
    const roleData = this.roleData();
    if (!roleData) return false;
    const currentRoles = roleData.split(',').map(Number);

    // Check if all user roles are within the allowed roles
    return currentRoles.every((role) => allowedRoles.includes(role));
  }

  private getTelecallerIdValue(formValues: any): number[] | null {
    if (this.hasOnlyRoles([14, 13])) {
      return this.userId() ? [this.userId()] : null;
    }
    
    if (formValues.telecaller_id?.length) {
      return Array.isArray(formValues.telecaller_id)
        ? formValues.telecaller_id.map((id:any) => Number(id))
        : [Number(formValues.telecaller_id)];
    }
    
    return null;
  }
  private formatDate(date: any): string | null {
    return date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;
  }

  onScrollIndexChange(index: number): void {
    const currentIndex = this.scrollIndex();
    
    // Only fetch more data if the index has changed significantly
    if (index > currentIndex + 15) {
      this.scrollIndex.set(index);
      
      this.paginationParams.update(params => ({
        ...params,
        offset: index
      }));
      
      this.fetchAllProjectLeads();
    }
  }
  
  private buildFiltersObject(formValues: any, telecallerIdValue: number[] | null): any {
    return {
      project_id: formValues.project_id?.length ? formValues.project_id : null,
      lead_level_id: 13,
      status_id: formValues.status_id?.length ? formValues.status_id : null,
      telecaller_id: telecallerIdValue,
      start_date: this.formatDate(formValues.start_date),
      end_date: this.formatDate(formValues.end_date),
      start_followup_date: this.formatDate(formValues.start_followup_date),
      end_followup_date: this.formatDate(formValues.end_followup_date),
      user_id: this.userId()
    };
  }

  applyFilters(): void {
    // Reset pagination when applying filters
    this.paginationParams.update(params => ({
      ...params,
      offset: 0
    }));
    this.scrollIndex.set(0);
    
    // Refresh the AG Grid with new filters
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }
  
  fetchAllProjectLeads(): void {
    // Refresh the AG Grid with current filters
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }
bookingActions = [
  {
    action: 'addComment',
    icon: 'add_comment',
    tooltip: 'Follow Up',
    color: 'primary',
    show: (row: any) => row?.telecaller_id !== null
  },
  
];

  onBookingAction(action: string, row: any): void {
     if (action === 'addComment') {
      this.openAddCommentDialog(row);
    } 
  }



  onSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.globalSearchTerm.set(searchValue);
    this.paginationParams.update(params => ({
      ...params,
      search: searchValue,
      offset: 0
    }));
    this.fetchAllProjectLeads();
  }

  onPageChange(page: number): void {
    this.paginationParams.update(params => ({
      ...params,
      offset: (page - 1) * params.limit
    }));
    this.fetchAllProjectLeads();
  }

  onPageSizeChange(size: number | string): void {
    const paginationState = this.paginationParams();
    const newLimit = size === 'All' 
      ? paginationState.filteredCount 
      : (size as number);
    
    this.paginationParams.update(params => ({
      ...params,
      limit: newLimit,
      offset: 0
    }));
    this.fetchAllProjectLeads();
  }



  fetchAllTalecallerList(projectId: any): void {
    if (!Array.isArray(projectId) || projectId.length === 0) {
      this.allTelecallerlist.set([]);
      return;
    }

    this.commonService
      .fetchTelecallerDropdown(projectId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch telecallers.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          const telecallers = (res || []).map((item: any) => ({
            ...item,
            full_name: `${item.first_name} ${item.last_name}`,
          }));
          this.allTelecallerlist.set(telecallers);
        }
      });
  }



  fetchAllProjects(): void {
    const userId = this.userId();

    if (!this.projectsCache$) {
      this.loading.set(true);

      this.projectsCache$ = this.commonService
        .fetchUserProjectDropdown(userId)
        .pipe(
          shareReplay(1),
          catchError((err: any) => {
            console.error(err);
            this.snackBar.open('Unable to fetch projects.', 'Close', {
              duration: 3000,
            });
            return of([]);
          })
        );
    }

    this.projectsCache$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.projectsList.set(res);
          }
          this.loading.set(false);
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

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: boolean) => {
        if (result) {
          this.fetchAllProjectLeads(); // Refresh the list if data was modified
        }
      });
  }

}
