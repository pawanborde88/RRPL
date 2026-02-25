import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent, themeQuartz } from 'ag-grid-community';

import { MainPermissionComponent } from '../../main-permission/main-permission.component';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { AddEditModuleDialogComponent, AddEditModuleDialogData } from '../add-edit-module-dialog/add-edit-module-dialog.component';
import { ModuleActionsCellRendererComponent, ModuleActionsContext } from './cell-renderers/module-actions-cell-renderer.component';
import { ModuleTreeCellRendererComponent } from './cell-renderers/module-tree-cell-renderer.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';

export interface ModuleRow {
  module_id?: string | number;
  module_name?: string;
  created_at?: string | null;
  updated_at?: string | null;
  created_by_string?: string | null;
  updated_by_string?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  child?: ModuleRow[];
  path: string[];
  level?: number;
}

export interface ModuleGridContext extends ModuleActionsContext {
  isExpanded: (data: ModuleRow) => boolean;
  toggleExpand: (data: ModuleRow) => void;
}

@Component({
  selector: 'app-fetch-module',
  standalone: true,
  imports: [
    AgGridAngular,
    CommonModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    RouterModule,
    MainPermissionComponent,
  ],
  templateUrl: './fetch-module.component.html',
  styleUrl: './fetch-module.component.scss',
})
export class FetchModuleComponent {
  baseUrl = environment.API_URL;
  loadingState = true;
  rowData: ModuleRow[] = [];
  flatRows: ModuleRow[] = [];
  expandedIds = new Set<string>();
  private gridApi: GridApi | null = null;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) { }

  readonly columnDefs: ColDef<ModuleRow>[] = [
    {
      headerName: '#',
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1,
      width: 64,
      maxWidth: 80,
      sortable: false,
      filter: false,
      floatingFilter: false,
    },
    {
      field: 'module_name',
      headerName: 'Module',
      flex: 1,
      minWidth: 250,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      cellRenderer: ModuleTreeCellRendererComponent,
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      width: 120,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      valueFormatter: (p) => this.formatDate(p.value),
    },
    {
      field: 'updated_at',
      headerName: 'Updated At',
      width: 120,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      valueFormatter: (p) => this.formatDate(p.value),
    },
    {
      field: 'created_by_string',
      headerName: 'Created By',
      width: 130,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
    },
    {
      field: 'updated_by_string',
      headerName: 'Updated By',
      width: 130,
      sortable: true,
      filter: 'agTextColumnFilter',
      floatingFilter: true,
    },
    {
      headerName: 'Actions',
      width: 110,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: ModuleActionsCellRendererComponent,
      pinned: 'right',
    },
  ];

  readonly defaultColDef: ColDef<ModuleRow> = {
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    sortable: true,
    resizable: true,
    suppressHeaderMenuButton: true,
  };

  readonly agGridTheme = themeQuartz.withParams({
    wrapperBorder: { style: 'solid', width: 1, color: 'rgba(0,0,0,0.12)' },
    headerRowBorder: { style: 'solid', width: 1, color: 'rgba(0,0,0,0.12)' },
    rowBorder: { style: 'solid', width: 1, color: 'rgba(0,0,0,0.08)' },
    columnBorder: { style: 'solid', width: 1, color: 'rgba(0,0,0,0.12)' },
    wrapperBorderRadius: '8px',
    headerHeight: '44px',
    headerBackgroundColor: '#f1f5f9',
    headerTextColor: '#0f172a',
    headerFontSize: '14px',
    headerFontWeight: 600,
    cellTextColor: '#334155',
    dataFontSize: '14px',
    dataBackgroundColor: '#ffffff',
    oddRowBackgroundColor: '#f8fafc',
    rowHoverColor: 'rgba(59, 130, 246, 0.08)',
    headerCellHoverBackgroundColor: 'rgba(0,0,0,0.04)',
    cellHorizontalPadding: '12px',
  });

  readonly floatingFiltersHeight = 40;

  readonly getRowId = (params: { data?: ModuleRow }): string =>
    (params.data?.path ?? []).join('/') || `row-${Math.random().toString(36).slice(2, 9)}`;

  readonly gridContext: ModuleGridContext = {
    openEdit: (data) => this.openAddEditModuleDialog('edit', data),
    deleteModule: (id) => this.deleteModule(id),
    isExpanded: (d) => this.expandedIds.has(String(d?.path?.slice(-1)[0] ?? '')),
    toggleExpand: (d) => {
      const id = d?.path?.slice(-1)[0];
      if (id == null) return;
      const s = String(id);
      if (this.expandedIds.has(s)) this.expandedIds.delete(s);
      else this.expandedIds.add(s);
      this.applyExpandFilter();
      this.gridApi?.refreshCells({ force: true });
    },
  };

  handleChipClick(event: { index: number; route: string }): void {
    this.router.navigate([event.route]);
  }

  openAddEditModuleDialog(mode: 'add' | 'edit', module?: { module_id?: string | number }): void {
    const data: AddEditModuleDialogData = {
      mode,
      moduleId: module?.module_id != null ? String(module.module_id) : undefined,
    };
    const dialogRef = this.dialog.open(AddEditModuleDialogComponent, {
      width: 'min(90vw, 420px)',
      data,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.FetchAllModuleList();
    });
  }

  ngOnInit(): void {
    this.FetchAllModuleList();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  FetchAllModuleList(): void {
    this.loadingState = true;
    this.http.get<{ data?: ModuleRow[] }>(`${this.baseUrl}/fetch_all_modules`).subscribe({
      next: (res) => {
        const list = res?.data ?? [];
        this.flatRows = this.flattenModuleTree(list);
        this.expandedIds = new Set(this.flatRows.flatMap((r) => r.path.map(String)));
        this.applyExpandFilter();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Unable to fetch Module.');
        this.flatRows = [];
        this.rowData = [];
      },
      complete: () => {
        this.loadingState = false;
      },
    });
  }

  /** Filters flatRows by expandedIds so only visible branches are shown (AG-Grid Community, no treeData). */
  applyExpandFilter(): void {
    this.rowData = this.flatRows.filter((row) =>
      row.path.slice(0, -1).every((pid) => this.expandedIds.has(String(pid)))
    );
  }

  deleteModule(id: string | number): void {
    this.http.post(`${this.baseUrl}/delete_module`, { module_id: id }).subscribe({
      next: (res: unknown) => {
        if ((res as { success?: boolean })?.success) {
          this.snackBar.open('Module Deleted Successfully');
        }
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error occurred while deleting, please try later');
      },
      complete: () => this.FetchAllModuleList(),
    });
  }

  /** Flattens API tree (nested `child` arrays) into rows with `path` and `level`. AG-Grid Community only. */
  private flattenModuleTree(nodes: ModuleRow[] | unknown[], path: string[] = []): ModuleRow[] {
    const out: ModuleRow[] = [];
    (nodes || []).forEach((n) => {
      const row = n as ModuleRow;
      const id = row?.module_id ?? row?.module_name ?? '';
      const p = path.concat(String(id));
      out.push({ ...row, path: p, level: p.length - 1 });
      if (row?.child?.length) {
        out.push(...this.flattenModuleTree(row.child, p));
      }
    });
    return out;
  }

  private formatDate(v: unknown): string {
    if (v == null || v === '') return '';
    const d = new Date(v as string | number);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
