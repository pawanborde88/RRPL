import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  computed,
  signal,
  inject,
  DestroyRef,
  NgZone
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap,
  EMPTY,
  Observable,
  of,
  Subject
} from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { CommonService } from '../../../../../Service/common/common.service';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { CostomLoadingComponent } from '../../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { CommentLogService } from '../../../comment-log/comment-log.service';
import { LeadLevel, CallStatus } from '../../../comment-log/comment-log.models';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  RowClassParams,
  ICellRendererParams,
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  ICellRendererComp
} from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule]);

// Type definitions
interface GroupRow {
  rowType: 'group';
  enquiry_id: number;
  serial_no: number;
  project_name: string;
  customer_name: string;
  sales_executive_name: string;
  follow_up_date?: any;
  follow_up_period?: string;
  comment?: string;
  lead_level?: string;
  call_status?: string;
  total: number;
  expanded: boolean;
  uniqueId: string;
  [key: string]: any;
}

interface DetailRow {
  rowType: 'detail';
  enquiry_id: number;
  serial_no: number;
  uniqueId: string;
  [key: string]: any;
}

type TableRow = GroupRow | DetailRow;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface EnquirySummary {
  enquiry_id: number;
  project_name?: string;
  customer_name?: string;
  sales_executive_name?: string;
  total: number;
  follow_up_data: any[];
}

@Component({
  selector: 'app-enquiry-summary-report',
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
    AutocompleteReusableComponent,
    CostomLoadingComponent,
    AgGridAngular
  ],
  templateUrl: './enquiry-summary-report.component.html',
  styleUrl: './enquiry-summary-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class EnquirySummaryReportComponent implements OnInit, OnDestroy {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  private readonly commentLogService = inject(CommentLogService);

  // Signals
  readonly loading = signal<boolean>(false);
  readonly totalLeads = signal<number>(0);
  readonly rowData = signal<TableRow[]>([]);
  readonly originalData = signal<EnquirySummary[]>([]);
  readonly expandedIds = signal<Set<number>>(new Set());

  // Dropdown signals
  readonly projectsList = signal<any[]>([]);
  readonly allCallStatus = signal<any[]>([]);
  readonly allLeadLevels = signal<any[]>([]);
  readonly allSalesExecutive = signal<any[]>([]);

  leadLevels$: Observable<LeadLevel[]> = of([]);
  callStatus$: Observable<CallStatus[]> = of([]);
  private destroy$ = new Subject<void>();

  // AG Grid
  private gridApi?: GridApi;
  readonly columnDefs = signal<ColDef[]>([]);

  readonly agGridTheme = themeQuartz.withParams({
    wrapperBorder: { style: 'solid', width: 1, color: '#94a3b8' }, // Darker border (slate-400)
    headerRowBorder: { style: 'solid', width: 1, color: '#cbd5e1' }, // slate-300
    rowBorder: { style: 'solid', width: 1, color: '#e2e8f0' }, // slate-200
    columnBorder: { style: 'solid', width: 1, color: '#e2e8f0' }, // Vertical Borders
    headerHeight: '40px',
    headerBackgroundColor: '#f1f5f9', // slate-100
    headerTextColor: '#0f172a',
    headerFontSize: '0.875rem',
    headerFontWeight: 600,
  });

  readonly defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    floatingFilter: true, // Enable floating filter by default
    suppressMovable: false,

  };

  readonly leadForm = new FormGroup({
    project_id: new FormControl<number[]>([], Validators.required),
    sales_executive_id: new FormControl<number[]>([], Validators.required),
    from_date: new FormControl<Date | null>(null),
    to_date: new FormControl<Date | null>(null),
    lead_level_id: new FormControl<number | null>(null),
    call_status_id: new FormControl<number | null>(null),
  });

  private readonly roleData = sessionStorage.getItem('role_id');
  private readonly userId = Number(sessionStorage.getItem('session_id'));

  constructor() { }

  ngOnInit(): void {
    this.buildColumnDefs();
    this.setupFormSubscriptions();
    this.fetchAllProjects();
    this.fetchAllLeadLevels();

    if (this.hasOnlyRoles([7])) {
      const salesExecControl = this.leadForm.get('sales_executive_id');
      if (salesExecControl) {
        salesExecControl.patchValue(this.userId ? [this.userId] : []);
        salesExecControl.disable();
      }
    }

    this.leadLevels$ = this.commentLogService.fetchLeadLevels().pipe(
      catchError(() => {
        this.snackBar.open('Unable to fetch lead levels.', 'Close', { duration: 3000 });
        return of([]);
      })
    );

    this.setupLeadLevelListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  private buildColumnDefs(): void {
    const cols: ColDef[] = [
      {
        headerName: 'S.No.',
        field: 'serial_no',
        width: 100,
        minWidth: 100,
        pinned: 'left',
        filter: false,
        floatingFilter: false,
        // Simple Expand renderer using cellRenderer function for simplicity in standalone setup
        cellRenderer: (params: ICellRendererParams) => {
          const row = params.data as TableRow;
          if (row.rowType === 'group') {
            const isExpanded = (row as GroupRow).expanded;
            // We can return simple HTML structure
            // Assuming Material Icons font is available globally as per other components
            return `<div class="flex items-center gap-2 cursor-pointer select-none" style="height: 100%; width: 100%;">
                      <span class="material-icons text-gray-500" style="font-size: 20px;">${isExpanded ? 'expand_less' : 'expand_more'}</span>
                      <span>${params.value}</span>
                    </div>`;
          } else if (row.rowType === 'detail') {
            return `<div class="pl-8 ">→</div>`;
          }
          return params.value;
        },
        onCellClicked: (params) => {
          if (params.data.rowType === 'group') {
            this.toggleRow(params.data as GroupRow);
          }
        },
        cellStyle: { cursor: 'pointer', display: 'flex', alignItems: 'center' }
      },
      {
        headerName: 'Enquiry ID',
        field: 'enquiry_id',
        width: 100,
        minWidth: 100,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams) => params.data.rowType === 'group' ? params.value : ''
      },
      {
        headerName: 'Project',
        field: 'project_name',
        width: 180,
        minWidth: 150,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams) => params.data.rowType === 'group' ? params.value : ''
      },
      {
        headerName: 'Customer',
        field: 'customer_name',
        width: 180,
        minWidth: 150,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams) => params.data.rowType === 'group' ? params.value : ''
      },
      {
        headerName: 'Sales Executive',
        field: 'sales_executive_name',
        width: 180,
        minWidth: 150,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams) => params.data.rowType === 'group' ? params.value : ''
      },
      {
        headerName: 'Follow-up Date',
        field: 'follow_up_date',
        width: 150,
        filter: 'agDateColumnFilter',
        valueFormatter: (params) => {
          if (!params.value) return '-';
          try {
            return this.datePipe.transform(params.value, 'd,MMM, y') || '-';
          } catch { return '-'; }
        }
      },
      {
        headerName: 'Follow-up Time',
        field: 'follow_up_period',
        width: 130,
        filter: 'agTextColumnFilter',
        valueFormatter: (params) => params.value || '-'
      },
      {
        headerName: 'Remark',
        field: 'comment',
        width: 250,
        filter: 'agTextColumnFilter',
        tooltipField: 'comment',
        cellRenderer: (params: ICellRendererParams) => {
          const val = params.value || '-';
          return `<span class="truncate block w-full" title="${val}">${val}</span>`;
        }
      },
      {
        headerName: 'Lead Level',
        field: 'lead_level',
        width: 150,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.value) return '-';
          return params.value;
        }
      },
      {
        headerName: 'Call Status',
        field: 'call_status',
        width: 150,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.value) return '-';
          return params.value
        }
      }
    ];

    this.columnDefs.set(cols);
  }

  getRowClass = (params: RowClassParams): string | string[] | undefined => {
    const row = params.data as TableRow;
    if (row.rowType === 'group') return 'bg-blue-50 group-row';
    if (row.rowType === 'detail') return 'bg-gray-50 detail-row';
    return undefined;
  };

  getRowId = (params: any) => params.data.uniqueId;

  private setupFormSubscriptions(): void {
    this.leadForm.get('project_id')?.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      filter(projectID => !!projectID && projectID.length > 0),
      switchMap(projectID => this.fetchSalesExecutive(projectID as number[])),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private setupLeadLevelListener(): void {
    this.leadForm.get('lead_level_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged(),
      filter((value: any): value is number => typeof value === 'number' && value > 0),
      switchMap(leadLevelId =>
        this.commentLogService.fetchCallStatus(leadLevelId).pipe(
          catchError(() => {
            this.snackBar.open('Unable to fetch call statuses.', 'Close', { duration: 3000 });
            return of([]);
          })
        )
      )
    ).subscribe(callStatuses => {
      this.callStatus$ = of(callStatuses);
      this.cdr.markForCheck();
    });

    this.leadForm.get('lead_level_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter((value: any) => !value || value === 0)
    ).subscribe(() => {
      this.callStatus$ = of([]);
      this.leadForm.get('call_status_id')?.reset();
      this.cdr.markForCheck();
    });
  }

  private fetchAllProjects(): void {
    this.commonService.fetchUserProjectDropdown(this.userId).pipe(
      catchError(this.handleError<any[]>('Unable to fetch projects.')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      this.projectsList.set(Array.isArray(res) ? res : (res as any)?.data || []);
      this.cdr.markForCheck();
    });
  }

  private fetchAllLeadLevels(): void {
    this.commonService.fetchLeadLevels().pipe(
      catchError(this.handleError<any[]>('Unable to fetch lead levels.')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(res => {
      this.allLeadLevels.set(Array.isArray(res) ? res : (res as any)?.data || []);
      this.cdr.markForCheck();
    });
  }

  private fetchSalesExecutive(projectID: number[]): Observable<any[]> {
    return this.commonService.fetchSalesExecutives(projectID).pipe(
      catchError(this.handleError<any[]>('Unable to fetch sales executives.')),
      map(res => Array.isArray(res) ? res : (res as any)?.data || []),
      tap(executives => {
        this.allSalesExecutive.set(executives);
        this.cdr.markForCheck();
      })
    );
  }

  fetchAllProjectLeads(): void {
    if (this.loading()) return;
    this.loading.set(true);

    const formValue = this.leadForm.value;
    const payload = this.buildPayload(formValue);

    this.commonService.fetchEnquirySummaryReport(payload).pipe(
      catchError(this.handleError<ApiResponse<EnquirySummary[]>>('Unable to fetch leads')),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const validData = Array.isArray(res.data) ? res.data : [];
          this.originalData.set(validData);
          this.expandedIds.set(new Set()); // Collapse all on new search
          this.processData();
        } else {
          this.handleNoData();
        }
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  private buildPayload(formValue: any): any {
    let salesExecutiveID: any = null;
    if (this.hasOnlyRoles([7])) {
      salesExecutiveID = this.userId ? [this.userId] : null;
    } else {
      salesExecutiveID = Array.isArray(formValue.sales_executive_id)
        ? formValue.sales_executive_id
        : (formValue.sales_executive_id ? [formValue.sales_executive_id] : null);
    }

    return {
      project_id: formValue.project_id?.length ? formValue.project_id : null,
      sales_executive_id: salesExecutiveID,
      lead_level_id: formValue.lead_level_id ? formValue.lead_level_id : null,
      call_status_id: formValue.call_status_id ? formValue.call_status_id : null,
      from_date: formValue.from_date ? this.datePipe.transform(formValue.from_date, 'yyyy-MM-dd') : null,
      to_date: formValue.to_date ? this.datePipe.transform(formValue.to_date, 'yyyy-MM-dd') : null,
    };
  }

  private processData(): void {
    const rawData = this.originalData();
    const expanded = this.expandedIds();
    const rows: TableRow[] = [];
    let serialNo = 1;

    rawData.forEach(summary => {
      // Logic from old createGroupRow:
      const firstFollowUp = summary.follow_up_data?.[0] || {};
      const isExpanded = expanded.has(summary.enquiry_id);

      const groupRow: GroupRow = {
        rowType: 'group',
        enquiry_id: summary.enquiry_id,
        serial_no: serialNo++,
        project_name: summary.project_name || firstFollowUp.project_name || '',
        customer_name: summary.customer_name || firstFollowUp.customer_name || '',
        sales_executive_name: (summary as any).sales_executive_name || firstFollowUp.sales_executive_name || '',
        follow_up_date: firstFollowUp.follow_up_date || null,
        follow_up_period: firstFollowUp.follow_up_period || null,
        comment: firstFollowUp.comment || null,
        lead_level: firstFollowUp.lead_level || null,
        call_status: firstFollowUp.call_status || null,
        total: summary.total,
        expanded: isExpanded,
        uniqueId: `group-${summary.enquiry_id}`,
        // Flatten children to help with search if we implement deep search later
        children: summary.follow_up_data || []
      };

      rows.push(groupRow);

      if (isExpanded && summary.follow_up_data && summary.follow_up_data.length > 1) {
        // Skip first child as it is effectively the group row
        const childrenToDisplay = summary.follow_up_data.slice(1);
        childrenToDisplay.forEach((child, idx) => {
          rows.push({
            ...child,
            rowType: 'detail',
            enquiry_id: summary.enquiry_id,
            serial_no: groupRow.serial_no, // Keep same serial number parent
            uniqueId: `detail-${summary.enquiry_id}-${idx}`
          } as DetailRow);
        });
      }
    });

    this.totalLeads.set(rawData.reduce((acc, curr) => acc + (curr.follow_up_data?.length || 0), 0));
    this.rowData.set(rows);

    // If grid API exists, we might need to refresh specific nodes to keep scroll,
    // but full replacement is fine for this list size usually.
    // For smooth expand, using getRowId helps Ag-Grid map rows.
  }

  toggleRow(groupRow: GroupRow): void {
    const expanded = this.expandedIds();
    if (expanded.has(groupRow.enquiry_id)) {
      expanded.delete(groupRow.enquiry_id);
    } else {
      expanded.add(groupRow.enquiry_id);
    }
    this.expandedIds.set(expanded);
    this.processData();
  }

  trackByLeadLevelId(index: number, level: LeadLevel): number {
    return level.lead_level_id;
  }

  trackByCallStatusId(index: number, status: CallStatus): number {
    return status.call_status_id;
  }

  hasOnlyRoles(allowedRoles: number[]): boolean {
    if (!this.roleData) return false;
    const userRoles = this.roleData.split(',').map(r => Number(r.trim())).filter(r => !isNaN(r));
    return userRoles.some(r => allowedRoles.includes(r));
  }

  private handleNoData(): void {
    this.rowData.set([]);
    this.originalData.set([]);
    this.snackBar.open('No data found', 'Close', { duration: 3000 });
  }

  private handleError<T>(message: string) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error('API Error:', error);
      this.snackBar.open(message, 'Close', { duration: 3000 });
      return EMPTY as Observable<T>;
    };
  }
}
