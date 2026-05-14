import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';

import { CommonService } from '../../../../Service/common/common.service';
import { catchError, tap, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddPresalesTargetDialogComponent } from '../add-presales-target-dialog/add-presales-target-dialog.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { TemplateComponent } from '../../../../Common/template/template.component';

@Component({
  selector: 'app-all-presale-target-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    RouterModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    MatExpansionModule,
    BreadcrumbComponent,
    AutocompleteReusableComponent,
    TemplateComponent,
    ConfigurableAgGridDataComponent
  ],
  templateUrl: './all-presale-target-list.component.html',
  styleUrl: './all-presale-target-list.component.scss',
})
export class AllPresaleTargetListComponent implements OnInit {
  // ============================================================================
  // DEPENDENCY INJECTION
  // ============================================================================
  private readonly http = inject(HttpClient);
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  baseUrl = environment.API_URL;
  loading = signal<boolean>(false); // Use signal for loading
  allUSerList: any[] = [];
  readonly allRoleList = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);
  // Use a simple array if needed locally, but the grid will hold the data
  allPresaleTargets: any[] = [];

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent;

  leadForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    role_id: new FormControl<number | null>(null),
    user_id: new FormControl<number | null>(null),

  });
  displayedColumns = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },

    { key: 'property_name', label: 'Project' },
    { key: 'role_name', label: 'Role' },
    { key: 'user_name', label: 'Employee Name' },
    { key: 'booking_target', label: 'Booking Target', isAmount: true },
    { key: 'booking_achievement', label: 'Booking Achievement', isAmount: true },
    { key: 'token_target', label: 'Token Target', isAmount: true },
    { key: 'token_achievement', label: 'Token Achievement', isAmount: true },

    {
      key: 'target_from',
      label: 'Target From',
      type: 'short_date',
    },
    {
      key: 'target_to',
      label: 'Target To',
      type: 'short_date',
    },

    { key: 'remark', label: 'Remark' },
    {
      key: 'active_status',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.active_status_id === 1 ? 'green' : 'red',
    },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchAllRoles();
    this.setupFormReactivity();
  }

  private setupFormReactivity(): void {
    // React to role_id changes
    this.leadForm.get('role_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((roleID) => {
      if (roleID) {
        this.fetechAllUsersList(roleID);
      }
    });

    // React to project_id changes - refetch users if role is selected
    this.leadForm.get('project_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      const roleId = this.leadForm.get('role_id')?.value;
      if (roleId) {
        this.fetechAllUsersList(roleId);
      }
    });


  }


  selectedProjects: any[] = [];
  headerButtons = [
    {
      label: 'Add Target',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddEditSorceDialog('add'),
      show: () => true,
    },
  ];

  fetchAllPresalesTargets(): void {
    if (this.agGridTable) {
      this.agGridTable.refreshData();
    }
  }

  getAgGridPayload(): any {
    // Get values from form
    const projectId = this.leadForm.get('project_id')?.value;
    const roleId = this.leadForm.get('role_id')?.value;
    const userId = this.leadForm.get('user_id')?.value;

    // Build payload with selected values
    const payload: any = {};

    if (projectId) {
      payload.project_id = projectId;
    }

    if (roleId) {
      // Handle both array and single value
      if (Array.isArray(roleId)) {
        payload.role_id = roleId.map((r: any) => r.role_id || r);
      } else {
        payload.role_id = (roleId as any).role_id || roleId;
      }
    }

    if (userId) {
      // Handle both array and single value
      payload.user_id = Array.isArray(userId) ? userId.map((u: any) => u.user_id || u) : ((userId as any).user_id || userId);
    }

    return payload;
  }

  // Keep old method for reference or if needed elsewhere, but renamed or simplified
  private _fetchDataLegacy(userID?: any): void {
    this.loading.set(true);
    const payload = this.getAgGridPayload();
    if (userID) {
      payload.user_id = Array.isArray(userID) ? userID.map((u: any) => u.user_id || u) : (userID?.user_id || userID);
    }

    this.http
      .post(`${this.baseUrl}/fetch_pre_sale_targets`, payload)
      .subscribe({
        next: (res: any) => {
          this.allPresaleTargets = res.data;
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error(err);
          this.loading.set(false);
          this.snackBar.open('Unable to fetch results.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Target',
      color: 'primary',
      disabled: () => false,
      action: 'leadAssign',
    },
    {
      icon: 'delete',
      tooltip: 'Delete Target',
      color: 'warn',
      disabled: () => false,
      action: 'deleteTarget',
    },
  ];

  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.openAddEditSorceDialog('edit', row);

        break;
      case 'deleteTarget':
        this.deletePresalesTarget(row.pre_sale_target_id);
        break;
      default:
        break;
    }
  }
  deletePresalesTarget(targetId: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Target?' },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.http.post(`${this.baseUrl}/delete_pre_sale_target`, { pre_sale_target_id: targetId }).subscribe({
          next: (res: any) => {
            this.fetchAllPresalesTargets();
          },
        });
      }
    });
  }
  openAddEditSorceDialog(action: string, row?: any): void {
    this.router.navigate(['/target-achievement/pre-sales/add-presale-target'], {
      state: {
        title: action === 'add' ? 'Add Target' : 'Edit Target',
        apiUrl: action === 'add' ? 'add_pre_sale_target' : 'edit_source',
        rowData: row,
      },
    });
  }
  fetchAllProjects(): void {
    this.commonService
      .fetchUserProjectDropdown(this.userId)
      .pipe(
        tap((projects) => this.projectsList.set(projects || [])),
        catchError((error) => {
          this.snackBar.open('Unable to fetch projects.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  fetchAllRoles(): void {
    this.commonService
      .fetchRolesDropdown()
      .pipe(
        tap((roles) => this.allRoleList.set(roles || [])),
        catchError((error) => {
          this.snackBar.open('Unable to fetch roles.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  fetechAllUsersList(roleID: any): void {
    const projectId = this.leadForm.get('project_id')?.value;
    const payload: { role_id: number; project_id?: number } = {
      role_id: roleID.role_id || roleID
    };

    if (projectId) {
      payload.project_id = projectId;
    }

    this.commonService
      .fetchUsers(payload)
      .pipe(
        tap((users) => {
          const mappedUsers = (users || []).map((user: any) => ({
            ...user,
            full_name:
              user.full_name ||
              [user.first_name, user.last_name].filter(Boolean).join(' ').trim(),
          }));
          this.allUSerList = mappedUsers;
        }),
        catchError((error) => {
          this.snackBar.open('Unable to fetch users.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
