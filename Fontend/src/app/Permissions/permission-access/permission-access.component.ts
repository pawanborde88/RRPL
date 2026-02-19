import { CommonModule } from '@angular/common';
import {
  Component,
  ViewChild,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
  DestroyRef,
  untracked
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent } from '../../Common/success-dialog/success-dialog.component';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap
} from 'rxjs';
import { TemplateComponent } from '../../Common/template/template.component';
import { BreadcrumbComponent } from '../../Common/breadcrumb/breadcrumb.component';
import { AngularMaterialModule } from '../../../angular-material.module';
import { TruncatePipe } from '../../Pipes/truncate.pipe';
import { environment } from '../../../environments/environment';
import { MainPermissionComponent } from '../main-permission/main-permission.component';
import { HighlightPipe } from '../../Pipes/highlight.pipe';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClassParams,
  ICellRendererParams,
  ITooltipParams,
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz
} from 'ag-grid-community';
import { ModuleCellRendererComponent } from './cell-renderers/module-cell-renderer.component';
import { CheckboxCellRendererComponent } from './cell-renderers/checkbox-cell-renderer.component';

ModuleRegistry.registerModules([AllCommunityModule]);

// Type definitions
interface PermissionRow {
  serialNo?: number;
  module_id: number;
  module_name: string;
  permission_id?: number;
  permission_name?: string;
  description?: string;
  isExpanded?: boolean;
  isChild?: boolean;
  parentModuleId?: number;
  level?: number;
  rowType?: 'module' | 'permission';
  hierarchy?: string[];
  id?: string;
  [key: string]: unknown;
}

interface ModuleData {
  module_id: number;
  module_name: string;
  permissions?: PermissionData[];
  children?: ModuleData[];
  [key: string]: unknown;
}

interface PermissionData {
  permission_id: number;
  permission_name: string;
  description?: string;
  [key: string]: unknown;
}

interface ColumnConfig {
  fieldName: string;
  title: string;
  text_type: string;
  role_id?: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    totalModules: number;
    columns: ColumnConfig[];
    rows: ModuleData[];
  };
}

@Component({
  selector: 'app-permission-access',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    TruncatePipe,
    MainPermissionComponent,
    HighlightPipe,
    AgGridAngular,
    ModuleCellRendererComponent,
    CheckboxCellRendererComponent
  ],
  templateUrl: './permission-access.component.html',
  styleUrl: './permission-access.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PermissionAccessComponent implements OnInit {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  // Dependency Injection using inject()
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly baseUrl = environment.API_URL;
  private readonly userId = Number(sessionStorage.getItem('session_id')) || 0;
  private readonly roleId = Number(sessionStorage.getItem('role_id')) || 0;

  // Signals for reactive state management
  readonly loadingState = signal<boolean>(true);
  readonly expandingState = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly columnData = signal<ColumnConfig[]>([]);
  readonly rowData = signal<PermissionRow[]>([]);
  readonly expandedModules = signal<Set<number>>(new Set());
  readonly originalModuleData = signal<ModuleData[]>([]);
  readonly permissionStates = signal<Map<number, Map<number, boolean>>>(new Map());

  // Computed signals
  readonly filteredRowData = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const rows = this.rowData();

    if (!query) return rows;

    return rows.filter(row =>
      Object.values(row)
        .map(v => String(v ?? '').toLowerCase())
        .some(val => val.includes(query))
    );
  });

  // Signal to store valid permission IDs for checkbox interaction
  readonly validPermissionIds = signal<Set<number>>(new Set());

  // AG Grid properties
  private gridApi?: GridApi;
  readonly columnDefs = signal<ColDef[]>([]);

  readonly agGridTheme = themeQuartz.withParams({
    wrapperBorder: { style: 'solid', width: 1, color: '#e2e8f0' },
    headerRowBorder: { style: 'solid', width: 1, color: '#e2e8f0' },
    rowBorder: { style: 'solid', width: 1, color: '#e2e8f0' },
    columnBorder: { style: 'solid', width: 1, color: '#e2e8f0' },
    wrapperBorderRadius: '8px',
    headerHeight: '40px',
    headerBackgroundColor: '#f8fafc',
    headerTextColor: '#0f172a',
    headerFontSize: '0.875rem',
    headerFontWeight: 600,
    cellTextColor: '#334155',
    dataFontSize: '0.875rem',
    dataBackgroundColor: '#ffffff',
    oddRowBackgroundColor: '#ffffff',
    rowHoverColor: 'rgba(59, 130, 246, 0.08)',
    headerCellHoverBackgroundColor: 'rgba(0,0,0,0.04)',
    cellHorizontalPadding: '8px',
  });

  readonly defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true,
    suppressMovable: false,
    filterParams: {
      suppressAndOrCondition: true
    },
    tooltipValueGetter: (params: ITooltipParams) => {
      return this.getRowTooltip(params.data as PermissionRow);
    }
  };

  // RxJS subjects for optimized streams
  private readonly searchSubject$ = new Subject<string>();
  private readonly toggleCheckboxSubject$ = new Subject<{ col: ColumnConfig; row: PermissionRow }>();

  // Data fetching observable with caching
  private readonly permissionsData$ = this.http.get<ApiResponse>(`${this.baseUrl}/fetch_role_wise_permissions`).pipe(
    map(res => res?.data || { totalModules: 0, columns: [], rows: [] }),
    shareReplay(1),
    catchError(err => {
      console.error('Error fetching permissions:', err);
      this.showErrorToast('Failed to load permissions');
      return of({ totalModules: 0, columns: [], rows: [] });
    })
  );

  constructor() {
    // Setup search debouncing
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
      tap(query => {
        untracked(() => {
          this.searchQuery.set(query);
          if (query) {
            this.updateExpandedModulesForSearch(query.toLowerCase());
          }
          this.processModuleData(this.originalModuleData());
          this.updateGridData();
        });
      })
    ).subscribe();

    // Setup checkbox toggle with error handling
    this.toggleCheckboxSubject$.pipe(
      switchMap(({ col, row }) => this.toggleCheckboxRequest(col, row)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  ngOnInit(): void {
    this.fetchRolePermissions();
  }

  // Optimized data fetching with RxJS
  private fetchRolePermissions(): void {
    this.loadingState.set(true);

    this.permissionsData$.pipe(
      tap(data => {
        this.originalModuleData.set(data.rows || []);
        this.columnData.set(data.columns || []);
        this.processModuleData(data.rows || []);
        this.buildColumnDefs();
        this.updateGridData();
      }),
      finalize(() => this.loadingState.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // Optimized checkbox toggle with RxJS
  toggleCheckbox(col: ColumnConfig, row: PermissionRow): void {
    if (!row.permission_id) return;
    this.toggleCheckboxSubject$.next({ col, row });
  }

  private toggleCheckboxRequest(col: ColumnConfig, row: PermissionRow) {
    const currentValue = row[col.fieldName] as number | null;
    const isCurrentlyChecked = currentValue != null && currentValue !== 0;
    const oldValue = currentValue;
    const newValue = !isCurrentlyChecked;

    // Update local state immediately
    this.updatePermissionState(row.permission_id!, col.role_id!, newValue);
    row[col.fieldName] = newValue ? -1 : null;

    const endpoint = isCurrentlyChecked ? '/delete_assigned_permission' : '/assign_permissions_to_role';
    const payload = isCurrentlyChecked
      ? { account_id: 1, role_permission_id: oldValue, updated_by: this.userId }
      : {
        account_id: 1,
        active_status_id: 1,
        permission_id: [row.permission_id!],
        role_id: col.role_id!,
        created_by: this.userId,
      };

    return this.http.post(`${this.baseUrl}${endpoint}`, payload).pipe(
      tap(res => {
        const resBody = res as { data?: { role_permission_id?: number }; message?: string; success?: boolean };
        if (newValue) {
          // If API returns role_permission_id, use it; otherwise keep -1 (already set) to show checked
          if (resBody?.data?.role_permission_id != null) {
            row[col.fieldName] = resBody.data.role_permission_id;
          }
          // else: row[col.fieldName] is already -1 from the optimistic update
        } else {
          row[col.fieldName] = null;
        }
        const message = resBody?.message || 'Permission updated successfully';
        this.dialog.open(SuccessDialogComponent, {
          data: { status: true, message, showButton: true, buttonText: 'OK' }
        });
        this.refreshGridRow(row);
      }),
      catchError(err => {
        console.error(err);
        this.updatePermissionState(row.permission_id!, col.role_id!, isCurrentlyChecked);
        row[col.fieldName] = oldValue;
        this.refreshGridRow(row);
        this.snackBar.open('Error updating permission', 'Close', { duration: 3000 });
        return of(null);
      })
    );
  }

  private updatePermissionState(permissionId: number, roleId: number, checked: boolean): void {
    const states = new Map(this.permissionStates());
    if (!states.has(permissionId)) {
      states.set(permissionId, new Map());
    }
    states.get(permissionId)!.set(roleId, checked);
    this.permissionStates.set(states);
  }

  private refreshGridRow(row: PermissionRow): void {
    // We can use getRowNode with the ID directly now
    const id = row.id || (row.permission_id ? `perm-${row.permission_id}` : `mod-${row.module_id}`);
    const rowNode = this.gridApi?.getRowNode(id);
    if (rowNode) {
      this.gridApi?.refreshCells({ rowNodes: [rowNode] });
    }
  }

  // Optimized search with debouncing
  applyFilter(searchText: string): void {
    this.searchSubject$.next(searchText);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.expandedModules.set(new Set());
    this.processModuleData(this.originalModuleData());
    this.updateGridData();
  }

  // Process module data with expansion logic for Manual Tree
  private processModuleData(modules: ModuleData[]): void {
    const rows: PermissionRow[] = [];
    let serialNo = 1;
    const expandedSet = this.expandedModules();
    const columnConfigs = this.columnData();
    const permissionStatesMap = this.permissionStates();

    const convertCheckboxValues = (permission: PermissionData): PermissionData => {
      const converted = { ...permission };
      columnConfigs.forEach(col => {
        if (col.text_type === 'check_box' && converted.hasOwnProperty(col.fieldName)) {
          converted[col.fieldName] = converted[col.fieldName] != null ? converted[col.fieldName] : null;
        }
      });
      return converted;
    };

    const restorePermissionStates = (permission: PermissionData): PermissionData => {
      if (!permission.permission_id || !permissionStatesMap.has(permission.permission_id)) {
        return permission;
      }

      const roleMap = permissionStatesMap.get(permission.permission_id)!;
      const restored = { ...permission };

      roleMap.forEach((checked, roleId) => {
        const roleColumn = columnConfigs.find(col => col.role_id === roleId);
        if (roleColumn) {
          restored[roleColumn.fieldName] = checked ? (restored[roleColumn.fieldName] || -1) : null;
        }
      });

      return restored;
    };

    // Helper to get all search text for a module (self + children) for proper filtering
    const getModuleSearchText = (module: ModuleData): string => {
      let text = module.module_name || '';
      if (module.permissions) {
        text += ' ' + module.permissions.map(p => p.permission_name + ' ' + (p.description || '')).join(' ');
      }
      if (module.children) {
        text += ' ' + module.children.map(c => getModuleSearchText(c)).join(' ');
      }
      return text;
    };

    const processModule = (
      module: ModuleData,
      level = 0,
      parentModuleId?: number,
      parentVisible = true
    ): void => {
      if (!parentVisible) return;

      const hasNestedChildModules = Array.isArray(module.children) && module.children.length > 0;
      const hasPermissions = Array.isArray(module.permissions) && module.permissions.length > 0;
      const isExpandedState = expandedSet.has(module.module_id);
      const searchTextForAll = getModuleSearchText(module);

      const moduleRow: PermissionRow = {
        serialNo: serialNo++,
        module_id: module.module_id,
        module_name: module.module_name,
        isExpanded: isExpandedState,
        isChild: level > 0,
        parentModuleId,
        level,
        rowType: 'module',
        id: `mod-${module.module_id}`,
        // Hidden field to help with searching parent when child matches
        searchText: searchTextForAll
      };

      if (hasPermissions && module.permissions!.length > 0) {
        const firstPermission = restorePermissionStates(convertCheckboxValues(module.permissions![0]));

        Object.assign(moduleRow, {
          permission_id: firstPermission.permission_id,
          permission_name: firstPermission.permission_name,
          description: firstPermission.description
        });

        columnConfigs.forEach(col => {
          if (col.text_type === 'check_box' && firstPermission.hasOwnProperty(col.fieldName)) {
            moduleRow[col.fieldName] = firstPermission[col.fieldName];
          }
        });
      }

      rows.push(moduleRow);

      // Only add children if expanded
      if (isExpandedState) {
        if (hasPermissions && module.permissions!.length > 1) {
          module.permissions!.slice(1).forEach(permission => {
            const permissionCopy = restorePermissionStates(convertCheckboxValues(permission));

            rows.push({
              ...permissionCopy,
              serialNo: serialNo++,
              module_id: module.module_id,
              module_name: module.module_name,
              isChild: true,
              parentModuleId: module.module_id,
              level: level + 1,
              rowType: 'permission',
              id: `perm-${permissionCopy.permission_id}`,
              permission_id: permissionCopy.permission_id,
              permission_name: permissionCopy.permission_name,
              description: permissionCopy.description
            } as PermissionRow);
          });
        }

        if (hasNestedChildModules) {
          module.children!.forEach(child => {
            processModule(child, level + 1, module.module_id, true);
          });
        }
      }
    };

    modules.forEach(module => processModule(module));
    this.rowData.set(rows);
  }

  // Build column definitions
  private buildColumnDefs(): void {
    const colDefs: ColDef[] = [];
    const columnConfigs = this.columnData();

    // Serial Number Column
    colDefs.push({
      headerName: '#',
      field: 'serialNo',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      pinned: 'left',
      lockPosition: true,
      cellRenderer: (params: ICellRendererParams) => params.data?.serialNo || '',
      cellStyle: { textAlign: 'center' },
      headerClass: 'ag-center-aligned-header',
      sortable: false,
      resizable: false,
      filter: false,
      floatingFilter: false,
    });

    // Module Name Column with Filter Value Getter for Deep Search
    colDefs.push({
      headerName: 'Module Name',
      field: 'module_name',
      width: 250,
      minWidth: 200,
      pinned: 'left',
      lockPosition: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      filterParams: {
        filterOptions: ['contains', 'equals', 'startsWith', 'endsWith'],
        defaultOption: 'contains',
        caseSensitive: false,
        suppressAndOrCondition: true,
        // MAGIC FIX: Allow module row to match if any of its content (including hidden children) matches
        valueGetter: (params: any) => {
          // If it's a module row, use the pre-calculated deep search text
          if (params.data.rowType === 'module' && params.data.searchText) {
            return params.data.searchText;
          }
          // For permission rows, match on module name so they show up if filter matches module name?
          // Or better: ensure standard matching.
          return params.data.module_name;
        }
      },
      cellRenderer: ModuleCellRendererComponent,
      cellStyle: (params) => {
        if (params.data?.rowType === 'module') {
          return { backgroundColor: '#eff6ff', fontWeight: '500', color: '#1e40af' };
        }
        return null;
      }
    });

    // Permission ID Column
    colDefs.push({
      headerName: 'Permission ID',
      field: 'permission_id',
      width: 120,
      minWidth: 120,
      pinned: 'left',
      lockPosition: true,
      filter: 'agNumberColumnFilter',
      floatingFilter: true,
      filterParams: {
        filterOptions: ['equals', 'notEqual', 'lessThan', 'lessThanOrEqual', 'greaterThan', 'greaterThanOrEqual'],
        defaultOption: 'equals',
        suppressAndOrCondition: true
      },
      cellRenderer: (params: ICellRendererParams) => params.value ? params.value.toString() : '-',
      cellStyle: (params) => {
        if (params.data?.rowType === 'permission') {
          return { paddingLeft: '20px' };
        }
        return null;
      },
    });

    // Role Checkbox Columns
    columnConfigs.forEach(col => {
      if (['module_name', 'permission_id', 'permission_name', 'description'].includes(col.fieldName)) {
        return;
      }

      if (col.text_type === 'check_box') {
        colDefs.push({
          headerName: col.title,
          field: col.fieldName,
          width: 120,
          minWidth: 100,
          maxWidth: 150,
          cellRenderer: CheckboxCellRendererComponent,
          cellRendererParams: {
            checkboxColumn: col,
            onToggleCheckbox: (checkboxCol: ColumnConfig, row: PermissionRow) =>
              this.toggleCheckbox(checkboxCol, row)
          },
          cellStyle: { textAlign: 'center' },
          headerClass: 'ag-center-aligned-header',
          sortable: false,
          filter: false,
          floatingFilter: false,
        });
      } else {
        colDefs.push({
          headerName: col.title,
          field: col.fieldName,
          width: 150,
          minWidth: 100,
          cellRenderer: (params: ICellRendererParams) => params.value || '-'
        });
      }
    });

    this.columnDefs.set(colDefs);
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.updateGridData();
  }

  getRowClass = (params: RowClassParams): string | string[] | undefined => {
    if (!params?.data || params.node?.rowPinned) return '';

    const row = params.data as PermissionRow;
    if (!row) return '';

    const classes: string[] = [];
    const expandedSet = this.expandedModules();

    if (row.rowType === 'module') {
      classes.push('module-row');
      if (expandedSet.has(row.module_id)) {
        classes.push('expanded-module-row');
      }
    } else {
      classes.push('child-row');
      if (row.parentModuleId && expandedSet.has(row.parentModuleId)) {
        classes.push('expanded-child-row');
      }
    }

    return classes;
  };

  toggleModuleExpand(module: PermissionRow): void {
    this.expandingState.set(true);
    const expandedSet = new Set(this.expandedModules());

    if (expandedSet.has(module.module_id)) {
      expandedSet.delete(module.module_id);
    } else {
      expandedSet.add(module.module_id);
    }

    this.expandedModules.set(expandedSet);
    this.processModuleData(this.originalModuleData());
    this.updateGridData();
    this.gridApi?.refreshCells({ force: true });
    this.expandingState.set(false);
  }

  hasChildren(moduleId: number): boolean {
    const module = this.findModuleInData(this.originalModuleData(), moduleId);
    if (!module) return false;

    const hasNestedModules = Array.isArray(module.children) && module.children.length > 0;
    const hasPermissions = Array.isArray(module.permissions) && module.permissions.length > 0;

    return hasNestedModules || (hasPermissions && module.permissions!.length > 0);
  }

  private findModuleInData(modules: ModuleData[], moduleId: number): ModuleData | null {
    for (const module of modules) {
      if (module.module_id === moduleId) return module;
      if (module.children) {
        const found = this.findModuleInData(module.children, moduleId);
        if (found) return found;
      }
    }
    return null;
  }

  private updateExpandedModulesForSearch(query: string): void {
    const newExpanded = new Set<number>();
    const modules = this.originalModuleData();

    const recurse = (module: ModuleData): boolean => {
      let hasMatch = module.module_name?.toLowerCase().includes(query);

      // Search in permissions too
      if (Array.isArray(module.permissions)) {
        const permMatch = module.permissions.some(perm =>
          Object.values(perm)
            .map(v => String(v ?? '').toLowerCase())
            .some(val => val.includes(query))
        );
        hasMatch = hasMatch || permMatch;
      }

      if (Array.isArray(module.children) && module.children.length > 0) {
        const childMatches = module.children.map(child => recurse(child));
        hasMatch = hasMatch || childMatches.some(Boolean);
      }

      if (hasMatch) {
        newExpanded.add(module.module_id);
      }

      return hasMatch;
    };

    modules.forEach(mod => recurse(mod));
    this.expandedModules.set(newExpanded);
  }

  private updateGridData(): void {
    if (!this.gridApi) return;

    const data = this.filteredRowData();
    // Use applyTransaction if possible (not needed if using ID based updates,
    // but relying on setGridOption with getRowId is cleanest for replacement)

    // When expanding/collapsing, we are technically replacing the list.
    // If getRowId is constant, AG Grid 31+ handles this gracefully without full redraw.
    requestAnimationFrame(() => {
      if (this.gridApi) {
        this.gridApi.setGridOption('rowData', data);
      }
    });
  }

  // Callback to return the unique ID for each row
  getRowId = (params: any) => params.data.id;

  // Grid context for expand/collapse (same pattern as FetchModuleComponent)
  readonly gridContext = {
    isExpanded: (d: PermissionRow) => this.expandedModules().has(d.module_id),
    toggleExpand: (d: PermissionRow) => this.toggleModuleExpand(d),
    hasChildren: (id: number) => this.hasChildren(id),
    searchQuery: () => this.searchQuery(),
  };

  handleChipClick(event: { index: number; route: string }): void {
    this.router.navigate([event.route]);
  }

  showErrorToast(message: string): void {
    this.snackBar.open(message || 'Error occurred, please try later', 'Close', { duration: 3000 });
  }

  // Not used directly in new setup but good for future tooltip reference
  getRowTooltip(row: PermissionRow): string | null {
    if (!row || !row.permission_name) return null;
    const parts: string[] = [];
    if (row.permission_name) parts.push(`Permission Name: ${row.permission_name}`);
    if (row.description) parts.push(`Description: ${row.description}`);
    return parts.length > 0 ? parts.join('\n') : null;
  }
}
