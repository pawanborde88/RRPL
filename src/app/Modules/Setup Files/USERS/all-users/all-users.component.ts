import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntilDestroyed, toSignal, toObservable } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  switchMap,
  tap,
} from 'rxjs';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ActionColumnComponent } from '../../../../Common/action-column/action-column.component';
import { InactiveUserComponent } from '../inactive-user/inactive-user.component';
import { ResetUserPasswordComponent } from '../add-user/Reset Password/reset-user-password/reset-user-password.component';
import { UserProjctsComponent } from './User Projects/user-projcts/user-projcts.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { AddUserComponent } from '../add-user/add-user.component';
import { CostomLoadingComponent } from '../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { AddCPExecutivesComponent } from '../../CP Executive/add-cpexecutives/add-cpexecutives.component';
import { AddCPOwnersComponent } from '../../CP Owner/add-cpowners/add-cpowners.component';
import { UserService, User } from '../services/user.service';
import { UserFacade } from '../services/user.facade';
import { BulkSendMessageDialogComponent } from '../bulk-send-message-dialog/bulk-send-message-dialog.component';
import * as XLSX from 'xlsx';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface HeaderButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}

interface CardAction {
  action: string;
  icon: string;
  tooltip: string;
  color: string;
  disabled?: (item: User) => boolean;
  show?: (item: User) => boolean;
}

type Mode = 'users' | 'cp-executives' | 'cp-owners';

interface PageConfig {
  breadcrumb: string;
  collectionLabelPlural: string;
  collectionLabelSingular: string;
  countIcon: string;
  loadingText: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  emptySearchDescription: string;
  emptyActionLabel: string;
  emptyActionIcon: string;
  emptyIcon: string;
}

interface ModeDefinition {
  pageConfig: PageConfig;
  headerButtons: HeaderButton[];
  cardActions: CardAction[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SEARCH_DEBOUNCE_MS = 300;
const SNACKBAR_DURATION_MS = 3000;
const ROLE_IDS = {
  ADMIN: 2,
  CP_EXECUTIVE: 6,
  CP_OWNER: 5,
} as const;

const SEARCH_FIELD_MAP: Record<Mode, readonly string[]> = {
  'cp-executives': [
    'full_name',
    'user_email',
    'user_phone',
    'firm_name',
    'channel_partner',
    'city',
    'state',
    'designation',
  ] as const,
  'cp-owners': [
    'full_name',
    'user_email',
    'user_phone',
    'channel_partner',
    'city_name',
    'state',
  ] as const,
  'users': [
    'full_name',
    'user_email',
    'user_phone',
    'role',
    'active_status',
    'email_status',
  ] as const,
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
    ActionColumnComponent,
    CostomLoadingComponent,
    ReusableTableComponent,
    TemplateComponent,
    BreadcrumbComponent,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
  ],
  templateUrl: './all-users.component.html',
  styleUrl: './all-users.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllUsersComponent implements AfterViewInit {
  // ============================================================================
  // DEPENDENCY INJECTION
  // ============================================================================

  private readonly userService = inject(UserService);
  private readonly facade = inject(UserFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // ============================================================================
  // PUBLIC PROPERTIES
  // ============================================================================

  readonly dataSource = new MatTableDataSource<User>([]);
  readonly roleId = Number(sessionStorage.getItem('role_id')) || 0;
  readonly userId = Number(sessionStorage.getItem('session_id')) || 0;
  readonly storageUrl = environment.STORAGE_URL;

  // ============================================================================
  // REACTIVE STATE (SIGNALS)
  // ============================================================================

  private readonly routeListType = toSignal(
    this.route.data.pipe(
      map((data) => data['listType'] as string | undefined)
    ),
    { initialValue: undefined }
  );

  private readonly modeSignal = signal<Mode>('users');
  readonly searchTextSignal = signal('');

  private readonly debouncedSearchTextSignal = toSignal(
    toObservable(this.searchTextSignal).pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      tap(searchValue => {
        this.pageIndexSignal.set(0);
        if (this.modeSignal() === 'users' && this.dataSource) {
          this.dataSource.filter = searchValue.trim().toLowerCase();
        }
        this.cdr.markForCheck();
      })
    ),
    { initialValue: '' }
  );

  readonly pageIndexSignal = signal(0);
  readonly pageSizeSignal = signal(50);
  private readonly selectedUserSignal = signal<User[]>([]);

  // State from facade
  readonly users = this.facade.users;
  readonly loading = this.facade.loading;

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================

  readonly mode = computed(() => this.modeSignal());
  readonly allUsers = computed(() => this.users());

  private readonly modeDefinitionSignal = computed<ModeDefinition>(() =>
    this.buildModeDefinition(this.modeSignal())
  );

  readonly pageConfig = computed(() => this.modeDefinitionSignal().pageConfig);
  readonly headerButtons = computed(() => this.modeDefinitionSignal().headerButtons);
  readonly cardActions = computed(() => this.modeDefinitionSignal().cardActions);

  private readonly filteredUsersSignal = computed<User[]>(() => {
    const search = this.debouncedSearchTextSignal().trim().toLowerCase();
    const currentMode = this.modeSignal();
    const usersList = this.users();

    if (!search) {
      return usersList;
    }

    const fields = SEARCH_FIELD_MAP[currentMode];

    return usersList.filter((user: User) =>
      fields.some((field) => {
        const value = user?.[field];
        return value && value.toString().toLowerCase().includes(search);
      })
    );
  });

  readonly filteredUsers = computed(() => this.filteredUsersSignal());

  readonly paginatedUsers = computed(() => {
    const users = this.filteredUsersSignal();
    const startIndex = this.pageIndexSignal() * this.pageSizeSignal();
    return users.slice(startIndex, startIndex + this.pageSizeSignal());
  });

  private readonly selectedUserIds = computed(() =>
    new Set(this.selectedUserSignal().map((u) => u.user_id))
  );

  readonly isAllSelected = computed(() => {
    const filtered = this.filteredUsers();
    if (filtered.length === 0) return false;
    const selectedIds = this.selectedUserIds();
    return filtered.every((u) => selectedIds.has(u.user_id));
  });

  readonly isIndeterminate = computed(() => {
    const filtered = this.filteredUsers();
    if (filtered.length === 0) return false;
    const selectedCount = filtered.filter((u) => this.isSelected(u)).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  });

  // ============================================================================
  // CONSTRUCTOR & INITIALIZATION
  // ============================================================================

  constructor() {
    this.initializeRouteMode();
    this.setupModeChangeEffect();
  }

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  // ============================================================================
  // INITIALIZATION METHODS
  // ============================================================================

  private initializeRouteMode(): void {
    const listType = this.routeListType();
    this.setMode(listType);
    this.loadData();
  }

  private setupModeChangeEffect(): void {
    effect(
      () => {
        const mode = this.modeSignal();
        if (mode) {
          this.pageIndexSignal.set(0);
          this.loadData();
        }
      },
      { allowSignalWrites: true }
    );
  }

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  onPageChange(event: any): void {
    this.pageIndexSignal.set(event.pageIndex);
    this.pageSizeSignal.set(event.pageSize);
  }

  get selectedUser(): User[] {
    return this.selectedUserSignal();
  }

  set selectedUser(value: User[]) {
    this.selectedUserSignal.set(value ?? []);
  }

  applyFilter(event: Event | string): void {
    const searchValue =
      typeof event === 'string'
        ? event
        : (event?.target as HTMLInputElement)?.value ?? '';
    this.searchTextSignal.set(searchValue);
  }

  clearSearch(): void {
    this.searchTextSignal.set('');
    if (this.modeSignal() === 'users' && this.dataSource) {
      this.dataSource.filter = '';
    }
    this.selectedUser = [];
  }

  getInitials(fullName: string): string {
    const mode = this.modeSignal();
    const fallback =
      mode === 'cp-executives' ? 'CE' : mode === 'cp-owners' ? 'CO' : '??';

    if (!fullName) return fallback;
    const names = fullName.trim().split(' ').filter(Boolean);
    if (names.length === 0) {
      return fallback;
    }
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  isSelected(user: User): boolean {
    return this.selectedUserIds().has(user.user_id);
  }

  onCheckboxSelected(checked: boolean, row: User): void {
    const current = this.selectedUser;
    if (checked) {
      this.selectedUser = [...current, row];
    } else {
      this.selectedUser = current.filter((u) => u.user_id !== row.user_id);
    }
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      // Deselect all filtered users
      const filteredIds = new Set(this.filteredUsers().map((u) => u.user_id));
      this.selectedUser = this.selectedUser.filter(
        (u) => !filteredIds.has(u.user_id)
      );
    } else {
      // Select all filtered users
      const current = this.selectedUser;
      const currentIds = this.selectedUserIds();
      const toAdd = this.filteredUsers().filter(
        (u) => !currentIds.has(u.user_id)
      );
      this.selectedUser = [...current, ...toAdd];
    }
  }

  visibleCardActions(item: User): CardAction[] {
    const actions = this.cardActions();
    return actions.filter((action) => !action.show || action.show(item));
  }

  onEmptyAction(): void {
    const mode = this.modeSignal();
    if (mode === 'cp-executives') {
      this.openCPExecutivesDialog('add');
    } else if (mode === 'cp-owners') {
      this.openCPOwnerDialog('add');
    } else {
      this.editUser();
    }
  }

  // ============================================================================
  // USER ACTIONS
  // ============================================================================

  editUser(row?: User): void {
    const dialogRef = this.dialog.open(AddUserComponent, {
      minWidth: '60vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { userId: row?.user_id },
    });

    this.refreshAfterDialogClose(dialogRef);
  }

  resetPassword(): void {
    const dialogRef = this.dialog.open(ResetUserPasswordComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { userId: this.selectedUser },
    });

    this.refreshAfterDialogClose(dialogRef);
  }

  inactiveUser(): void {
    const dialogRef = this.dialog.open(InactiveUserComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { userId: this.selectedUser },
    });

    this.refreshAfterDialogClose(dialogRef);
  }

  allUserProjects(): void {
    const dialogRef = this.dialog.open(UserProjctsComponent, {
      minWidth: '60vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { userId: this.selectedUser },
    });

    this.refreshAfterDialogClose(dialogRef);
  }

  resendEmail(): void {
    const selectedUsers = this.selectedUser;
    if (selectedUsers.length === 0) return;

    const userIds = selectedUsers.map((u: User) => u.user_id);

    this.userService
      .resendEmails(userIds)
      .pipe(
        tap((response) => {
          this.dialog.open(SuccessDialogComponent, {
            autoFocus: false,
            data: { message: response.message },
          });
          this.loadData();
        }),
        catchError(() => {
          this.showSnackBar('Unable to resend emails.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe();
  }

  bulkSendMessage(): void {
    const selectedUsers = this.selectedUser;
    if (selectedUsers.length === 0) {
      this.showSnackBar('Please select users first.');
      return;
    }

    const activeUsers = selectedUsers.filter(u => u.active_status_id === 1);

    const dialogRef = this.dialog.open(BulkSendMessageDialogComponent, {
      minWidth: '25vw',
      maxWidth: '50vh',
      data: { activeUsers: activeUsers },
    });

    this.refreshAfterDialogClose(dialogRef);
  }

  // ============================================================================
  // CP EXECUTIVES ACTIONS
  // ============================================================================

  openCPExecutivesDialog(action: 'add' | 'edit', row?: User): void {
    const dialogRef = this.dialog.open(AddCPExecutivesComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add CP Executive' : 'Edit CP Executive',
        apiUrl: action === 'add' ? 'add_cp_executive' : 'edit_cp_executive',
        successMessage:
          action === 'add'
            ? 'CP Executive added successfully'
            : 'CP Executive updated successfully',
        rowData: row,
      },
    });

    this.refreshAfterDialogClose(dialogRef);
  }

  deleteCPExecutives(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete CP Executive?' },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        switchMap(() => this.userService.deleteCPExecutive(id)),
        tap(() => {
          this.showSnackBar('CP Executive deleted successfully');
          this.loadData();
        }),
        catchError(() => {
          this.showSnackBar('Unable to delete CP Executive.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe();
  }

  // ============================================================================
  // CP OWNERS ACTIONS
  // ============================================================================

  openCPOwnerDialog(action: 'add' | 'edit', row?: User): void {
    const dialogRef = this.dialog.open(AddCPOwnersComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add CP Owner' : 'Edit CP Owner',
        apiUrl: action === 'add' ? 'add_cp_owner' : 'edit_cp_owner',
        successMessage:
          action === 'add'
            ? 'CP Owner added successfully'
            : 'CP Owner updated successfully',
        rowData: row,
      },
    });

    this.refreshAfterDialogClose(dialogRef);
  }

  deleteCPOwner(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete CP Owner?' },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        switchMap(() => this.userService.deleteCPOwner(id)),
        tap(() => {
          this.showSnackBar('CP Owner deleted successfully');
          this.loadData();
        }),
        catchError(() => {
          this.showSnackBar('Unable to delete CP Owner.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe();
  }

  onCardAction(action: string, record: User): void {
    const mode = this.modeSignal();

    if (mode === 'cp-executives') {
      switch (action) {
        case 'edit':
          this.openCPExecutivesDialog('edit', record);
          break;
        case 'delete':
          this.deleteCPExecutives(record.user_id);
          break;
      }
      return;
    }

    if (mode === 'cp-owners') {
      switch (action) {
        case 'edit':
          this.openCPOwnerDialog('edit', record);
          break;
        case 'delete':
          this.deleteCPOwner(record.user_id);
          break;
      }
      return;
    }

    if (action === 'edit') {
      this.editUser(record);
    }
  }

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

  private formatFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  exportToExcel(): void {
    const mode = this.modeSignal();
    const dataToExport = this.filteredUsers();

    if (!dataToExport || dataToExport.length === 0) {
      this.showSnackBar('No data available to export');
      return;
    }

    try {
      // Prepare export data based on mode
      let exportData: any[] = [];
      let fileName = '';

      if (mode === 'users') {
        fileName = 'Users_Export';
        exportData = dataToExport.map((user) => ({
          'Full Name': this.formatFieldValue(user.full_name),
          'Email': this.formatFieldValue(user.user_email),
          'Phone': this.formatFieldValue(user.user_phone),
          'Role': this.formatFieldValue(user.role),
          'Status': this.formatFieldValue(user.active_status),
          'Email Verified': user.email_confirm === 1 ? 'Yes' : 'No',
          'Created Date': user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
        }));
      } else if (mode === 'cp-executives') {
        fileName = 'CP_Executives_Export';
        exportData = dataToExport.map((executive) => ({
          'Full Name': this.formatFieldValue(executive.full_name),
          'Email': this.formatFieldValue(executive.user_email),
          'Phone': this.formatFieldValue(executive.user_phone),
          'Designation': this.formatFieldValue(executive['designation']),
          'Firm Name': this.formatFieldValue(executive['firm_name']),
          'Channel Partner': this.formatFieldValue(executive['channel_partner']),
          'City': this.formatFieldValue(executive['city']),
          'State': this.formatFieldValue(executive['state']),
          'Status': this.formatFieldValue(executive.active_status),
          'Created Date': executive.created_at ? new Date(executive.created_at).toLocaleDateString() : '',
        }));
      } else if (mode === 'cp-owners') {
        fileName = 'CP_Owners_Export';
        exportData = dataToExport.map((owner) => ({
          'Full Name': this.formatFieldValue(owner.full_name),
          'Email': this.formatFieldValue(owner.user_email),
          'Phone': this.formatFieldValue(owner.user_phone),
          'Channel Partner': this.formatFieldValue(owner['channel_partner']),
          'City': this.formatFieldValue(owner['city_name']),
          'State': this.formatFieldValue(owner['state']),
          'Status': this.formatFieldValue(owner.active_status),
          'Created Date': owner.created_at ? new Date(owner.created_at).toLocaleDateString() : '',
        }));
      }

      // Create worksheet
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const maxWidth = 50;
      const minWidth = 10;
      const colWidths = Object.keys(exportData[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map((row) => String(row[key] || '').length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, minWidth), maxWidth) };
      });
      ws['!cols'] = colWidths;

      // Create workbook
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Generate filename with timestamp
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
      const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
      const finalFileName = `${fileName}_${dateStr}_${timeStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, finalFileName);

      this.showSnackBar(`Exported ${dataToExport.length} records successfully`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.showSnackBar('Error exporting data. Please try again.');
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setMode(listType?: string): void {
    const mode: Mode =
      listType === 'cp-executives'
        ? 'cp-executives'
        : listType === 'cp-owners'
          ? 'cp-owners'
          : 'users';
    this.modeSignal.set(mode);
  }

  private loadData(): void {
    this.clearSearch();
    this.fetchUsersByMode();
  }

  private fetchUsersByMode(): void {
    const mode = this.modeSignal();
    let roleId: number | null = null;
    let transform: ((record: any) => User) | undefined;

    switch (mode) {
      case 'cp-executives':
        roleId = ROLE_IDS.CP_EXECUTIVE;
        transform = (executive: any): User => {
          const firstName = executive.first_name?.trim() || '';
          const lastName = executive.last_name?.trim() || '';
          const fullName =
            `${firstName} ${lastName}`.trim() ||
            executive.full_name ||
            'CP Executive';
          return {
            ...executive,
            full_name: fullName,
          };
        };
        break;
      case 'cp-owners':
        roleId = ROLE_IDS.CP_OWNER;
        transform = (owner: any): User => {
          const firstName = owner.first_name?.trim() || '';
          const lastName = owner.last_name?.trim() || '';
          const fullName =
            `${firstName} ${lastName}`.trim() || owner.full_name || 'CP Owner';
          return {
            ...owner,
            full_name: fullName,
          };
        };
        break;
      default:
        roleId = null;
        transform = (user: any): User => ({
          ...user,
          selected: false,
        });
        break;
    }

    this.facade
      .loadUsers(roleId, transform)
      .then(() => {
        if (mode === 'users') {
          this.dataSource.data = this.users();
        } else {
          this.dataSource.data = [];
        }
        this.selectedUserSignal.set([]);
        this.cdr.markForCheck();
      })
      .catch((error: Error | any) => {
        const errorMessage =
          mode === 'cp-executives'
            ? 'Unable to fetch CP executives.'
            : mode === 'cp-owners'
              ? 'Unable to fetch CP owners.'
              : 'Unable to fetch users.';
        this.showSnackBar(errorMessage);
        console.error('Error fetching users:', error);
        this.cdr.markForCheck();
      });
  }

  private refreshAfterDialogClose(dialogRef: MatDialogRef<any>): void {
    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.loadData();
        this.cdr.markForCheck();
      });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: SNACKBAR_DURATION_MS,
    });
  }

  private buildModeDefinition(mode: Mode): ModeDefinition {
    const isAdmin = this.roleId === ROLE_IDS.ADMIN;
    const selectedUsers = this.selectedUser;

    if (mode === 'cp-executives') {
      return {
        pageConfig: {
          breadcrumb: 'All CP Executives',
          collectionLabelPlural: 'CP executives',
          collectionLabelSingular: 'CP executive',
          countIcon: 'groups',
          loadingText: 'Loading CP executives',
          searchPlaceholder: 'Search CP executives...',
          emptyTitle: 'No CP Executives Found',
          emptyDescription: 'Get started by adding a new CP executive',
          emptySearchDescription: 'Try adjusting your search criteria',
          emptyActionLabel: 'Add CP Executive',
          emptyActionIcon: 'add_circle',
          emptyIcon: 'groups',
        },
        headerButtons: [
          {
            label: 'Add CP Executive',
            icon: 'assignment_ind',
            color: 'primary',
            disabled: () => false,
            action: () => this.openCPExecutivesDialog('add'),
            show: () => isAdmin,
          },
          {
            label: 'Reset Password',
            icon: 'pin',
            color: 'primary',
            disabled: () => selectedUsers.length === 0,
            action: () => this.resetPassword(),
            show: () => isAdmin,
          },
          {
            label: 'Change Status',
            icon: 'contact_emergency',
            color: 'primary',
            disabled: () => selectedUsers.length === 0,
            action: () => this.inactiveUser(),
            show: () => isAdmin,
          },
          {
            label: 'Send',
            icon: 'send',
            color: 'primary',
            disabled: () => selectedUsers.length === 0,
            action: () => this.bulkSendMessage(),
            show: () => isAdmin,
          },
          {
            label: 'Export to Excel',
            icon: 'download',
            color: 'accent',
            disabled: () => this.filteredUsers().length === 0,
            action: () => this.exportToExcel(),
            show: () => true,
          },
        ],
        cardActions: [
          {
            action: 'edit',
            icon: 'edit_note',
            tooltip: 'Edit CP Executive',
            color: 'primary',
          },
          {
            action: 'delete',
            icon: 'delete',
            tooltip: 'Delete CP Executive',
            color: 'warn',
            show: () => isAdmin,
          },
        ],
      };
    }

    if (mode === 'cp-owners') {
      return {
        pageConfig: {
          breadcrumb: 'All CP Owners',
          collectionLabelPlural: 'CP owners',
          collectionLabelSingular: 'CP owner',
          countIcon: 'groups',
          loadingText: 'Loading CP owners',
          searchPlaceholder: 'Search CP owners...',
          emptyTitle: 'No CP Owners Found',
          emptyDescription: 'Get started by adding a new CP owner',
          emptySearchDescription: 'Try adjusting your search criteria',
          emptyActionLabel: 'Add CP Owner',
          emptyActionIcon: 'add_circle',
          emptyIcon: 'groups',
        },
        headerButtons: [
          {
            label: 'Add CP Owner',
            icon: 'add_circle',
            color: 'primary',
            disabled: () => false,
            action: () => this.openCPOwnerDialog('add'),
            show: () => isAdmin,
          },
          {
            label: 'Reset Password',
            icon: 'pin',
            color: 'primary',
            disabled: () => selectedUsers.length === 0,
            action: () => this.resetPassword(),
            show: () => isAdmin,
          },
          {
            label: 'Change Status',
            icon: 'contact_emergency',
            color: 'primary',
            disabled: () => selectedUsers.length === 0,
            action: () => this.inactiveUser(),
            show: () => isAdmin,
          },
          {
            label: 'Send',
            icon: 'send',
            color: 'primary',
            disabled: () => selectedUsers.length === 0,
            action: () => this.bulkSendMessage(),
            show: () => isAdmin,
          },
          {
            label: 'Export to Excel',
            icon: 'download',
            color: 'accent',
            disabled: () => this.filteredUsers().length === 0,
            action: () => this.exportToExcel(),
            show: () => true,
          },
        ],
        cardActions: [
          {
            action: 'edit',
            icon: 'edit',
            tooltip: 'Edit CP Owner',
            color: 'primary',
          },
          {
            action: 'delete',
            icon: 'delete',
            tooltip: 'Delete CP Owner',
            color: 'warn',
          },
        ],
      };
    }

    return {
      pageConfig: {
        breadcrumb: 'All Users',
        collectionLabelPlural: 'users',
        collectionLabelSingular: 'user',
        countIcon: 'people',
        loadingText: 'Loading users',
        searchPlaceholder: 'Search users...',
        emptyTitle: 'No Users Found',
        emptyDescription: 'Get started by adding a new user',
        emptySearchDescription: 'Try adjusting your search criteria',
        emptyActionLabel: 'Add New User',
        emptyActionIcon: 'person_add',
        emptyIcon: 'people_outline',
      },
      headerButtons: [
        {
          label: 'Resend Email',
          icon: 'drafts',
          color: 'primary',
          disabled: () => selectedUsers.length === 0,
          action: () => this.resendEmail(),
          show: () => isAdmin,
        },
        {
          label: 'User projects',
          icon: 'view_timeline',
          color: 'primary',
          disabled: () => selectedUsers.length === 0,
          action: () => this.allUserProjects(),
          show: () => isAdmin,
        },
        {
          label: 'Reset Password',
          icon: 'pin',
          color: 'primary',
          disabled: () => selectedUsers.length === 0,
          action: () => this.resetPassword(),
          show: () => isAdmin,
        },
        {
          label: 'Change Status',
          icon: 'contact_emergency',
          color: 'primary',
          disabled: () => selectedUsers.length === 0,
          action: () => this.inactiveUser(),
          show: () => isAdmin,
        },
        {
          label: 'Export to Excel',
          icon: 'download',
          color: 'accent',
          disabled: () => this.filteredUsers().length === 0,
          action: () => this.exportToExcel(),
          show: () => true,
        },
        {
          label: 'Send',
          icon: 'send',
          color: 'primary',
          disabled: () => selectedUsers.length === 0,
          action: () => this.bulkSendMessage(),
          show: () => isAdmin,
        },
        {
          label: 'Add New User',
          icon: 'person_add',
          color: 'primary',
          disabled: () => false,
          action: () => this.editUser(),
          show: () => isAdmin,
        },
      ],
      cardActions: [
        {
          action: 'edit',
          icon: 'edit_note',
          tooltip: 'Edit User',
          color: 'primary',
        },
      ],
    };
  }
}
