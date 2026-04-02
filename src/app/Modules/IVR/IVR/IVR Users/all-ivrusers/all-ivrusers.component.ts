import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddEditIVRUserComponent } from '../add-edit-ivruser/add-edit-ivruser.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { of } from 'rxjs';
import {
  catchError,
  shareReplay,
  retry
} from 'rxjs/operators';

// Constants
const DEFAULT_PAGE_SIZE = 30;
const RETRY_ATTEMPTS = 2;
const CACHE_SIZE = 1;

interface IVRUserData {
  ivr_id: number;
  project_id: number;
  user_id: number;
  [key: string]: any;
}

interface PaginationState {
  offset: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search: string;
  filters: Record<string, any>;
  filteredCount: number;
}

@Component({
  selector: 'app-all-ivrusers',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-ivrusers.component.html',
  styleUrl: './all-ivrusers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllIVRUsersComponent implements OnInit, AfterViewInit {
  // Dependency Injection
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Constants
  readonly baseUrl = environment.API_URL;
  readonly roleId = Number(sessionStorage.getItem('role_id'));
  readonly userId = Number(sessionStorage.getItem('session_id'));
  readonly permissionData = sessionStorage.getItem('permission') || '';

  // ViewChild references
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent<IVRUserData>;

  // Reactive state using signals
  readonly loading = signal<boolean>(false);
  readonly selectedUsers = signal<IVRUserData[]>([]);

  // Dropdown data signals
  readonly projectsList = signal<any[]>([]);

  // Pagination state
  readonly paginationParams = signal<PaginationState>({
    offset: 0,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: 'ivr_id',
    sortOrder: 'desc',
    search: '',
    filters: {},
    filteredCount: 0,
  });

  // Form controls
  readonly filterForm = new FormGroup({
    project_id: new FormControl<number[]>([], [Validators.required]),
    active_status_id: new FormControl<number>(1),
  });

  // Computed signals
  readonly hasSelectedUsers = computed(() => this.selectedUsers().length > 0);

  // Column definitions
  readonly columnDefinitions = [
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'property_name', label: 'Project' },
    { key: 'user_name', label: 'User Name' },

    { key: 'call_no', label: 'Call No' },
    { key: 'did_no', label: 'DID No' },
    { key: 'phone_no', label: 'Phone No' },
    { key: 'cli_no', label: 'CLI No' },
    { key: 'active_status', label: 'Status' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ] as const;

  // Action buttons configuration
  readonly userActions = [
    {
      action: 'delete',
      icon: 'delete',
      tooltip: 'Delete IVR User',
      color: 'warn' as const,
      show: (row: IVRUserData) => this.hasPermission('404'),
    },
    {
      action: 'edit',
      icon: 'edit_note',
      tooltip: 'Edit IVR User',
      color: 'primary' as const,
      show: (row: IVRUserData) => this.hasPermission('407'),
    },
  ] as const;

  readonly headerButtons = [
    {
      label: 'Add New IVR User',
      icon: 'add_box',
      color: 'primary' as const,
      disabled: () => false,
      action: () => this.openAddEditDialog('add'),
      show: () => this.hasPermission('402'),
    },
  ] as const;

  constructor() { }

  ngOnInit(): void {
    this.fetchAllProjects();
  }

  ngAfterViewInit(): void { }

  // Permission checking
  hasPermission(permission: string): boolean {
    return this.permissionData.includes(permission);
  }

  // Method to get payload for ag-grid
  getAgGridPayload(): any {
    const formValues = this.filterForm.value;
    const paginationState = this.paginationParams();

    // Extract project_id - handle both array and single value
    let projectId: number | null = null;
    if (formValues.project_id) {
      if (Array.isArray(formValues.project_id) && formValues.project_id.length > 0) {
        projectId = formValues.project_id[0];
      } else if (typeof formValues.project_id === 'number') {
        projectId = formValues.project_id;
      }
    }

    // Get active_status_id from form or default to 1
    const activeStatusId = formValues.active_status_id ?? 1;

    // Build filters object
    const filters: Record<string, any> = {};
    if (projectId !== null) {
      filters['project_id'] = projectId;
    }
    if (activeStatusId !== null && activeStatusId !== undefined) {
      filters['active_status_id'] = activeStatusId;
    }

    return {
      filters: filters,
      offset: paginationState.offset,
      limit: paginationState.limit,
      search: paginationState.search || '',
      sortBy: paginationState.sortBy,
      sortOrder: paginationState.sortOrder,
    };
  }

  // Fetch projects
  fetchAllProjects(): void {
    const payload = {
      user_id: this.userId,
    };

    this.http
      .post<any[]>(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(
        retry(RETRY_ATTEMPTS),
        shareReplay({ bufferSize: CACHE_SIZE, refCount: true }),
        catchError((err) => {
          console.error(err);
          this.snackBar.open('Unable to fetch projects.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.projectsList.set(res);
            this.cdr.markForCheck();
          }
        }
      });
  }

  // Apply filter
  applyFilter(): void {
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }

  // Action handlers
  onUserAction(action: string, row: IVRUserData): void {
    switch (action) {
      case 'delete':
        this.deleteIVRUser(row.ivr_id);
        break;
      case 'edit':
        this.openAddEditDialog('edit', row);
        break;
    }
  }

  // Selection methods
  onUserSelectionChange(checked: boolean, user: IVRUserData): void {
    const selectedData: IVRUserData = {
      ivr_id: user.ivr_id,
      project_id: user.project_id,
      user_id: user.user_id,
    };

    if (checked) {
      this.selectedUsers.update(users => [...users, selectedData]);
    } else {
      this.selectedUsers.update(users =>
        users.filter(item => item.ivr_id !== selectedData.ivr_id)
      );
    }
  }

  // Dialog methods
  openAddEditDialog(mode: 'add' | 'edit', row?: IVRUserData): void {
    const dialogRef = this.dialog.open(AddEditIVRUserComponent, {
      width: '600px',
      data: {
        mode,
        ivrUser: row || null,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {


          // Show success dialog
          this.dialog.open(SuccessDialogComponent, {
            data: {
              status: true,
              message: result.message || 'Operation completed successfully'
            },
          });
          setTimeout(() => {
            if (this.agGridComponent) {
              this.agGridComponent.refreshData();
            }
          }, 0);

          // Refresh the grid with updated filters and pagination
          // Use setTimeout to ensure form values are updated before refresh

        }
      });
  }

  // Delete IVR User
  deleteIVRUser(ivrId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this IVR User?' },
    });

    dialogRef.afterClosed()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((result) => {
        if (result) {
          const requestPayload = {
            ivr_id: ivrId,
            created_by: this.userId,
          };

          this.http.post(`${this.baseUrl}/delete_ivr`, requestPayload)
            .pipe(
              retry(RETRY_ATTEMPTS),
              catchError((err) => {
                this.snackBar.open('Unable to delete IVR User.', 'Close', {
                  duration: 3000,
                });
                return of(null);
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
              next: (data) => {
                if (data) {
                  this.snackBar.open('IVR User deleted successfully', 'Close', {
                    duration: 3000,
                  });
                  if (this.agGridComponent) {
                    this.agGridComponent.refreshData();
                  }
                }
              }
            });
        }
      });
  }
}
