import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { catchError, distinctUntilChanged, filter, finalize, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { CommonService } from '../../../../../Service/common/common.service';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ReceiptsService } from '../../Recovery/Recipts/receipts.service';



interface ReceiptFilters {
  project_id: number | null;
  wing_id: number | null;
  receipt_type_id: number | null;
}

interface Project {
  project_id: number;
  property_name: string;
  [key: string]: any;
}

interface Wing {
  wing_id: number;
  wing_name: string;
  [key: string]: any;
}

interface UserSession {
  session_id: string | null;
  role_id: string | null;
}

interface ReceiptType {
  receipt_type_id: number;
  receipt_type: string;
  [key: string]: any;
}

const DEFAULT_PAGE_SIZE = 30;
const DEFAULT_SORT_BY = 'created_at';
const DEFAULT_SORT_ORDER = 'desc';
const SESSION_KEYS = {
  SESSION_ID: 'session_id',
  ROLE_ID: 'role_id'
} as const;

const RECEIPT_REPORT_COLUMNS: readonly TableColumn[] = [
  { key: 'receipt_date', label: 'Receipt Date', type: 'mediumDate' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'wing_name', label: 'Wing' },
  { key: 'floor_unit', label: 'Unit No' },
  { key: 'applicant_name', label: 'Applicant Name' },
  { key: 'applicant_mobile', label: 'Mobile No', type: 'sensitive' },
  { key: 'applicant_email', label: 'Email', type: 'sensitive' },
  { key: 'booking_status', label: 'Booking Status' },
  { key: 'receipt_type', label: 'Receipt Type' },
  { key: 'payment_mode', label: 'Payment Mode' },
  { key: 'bank_name', label: 'Bank Name' },
  { key: 'received_amount', label: 'Received Amount', isAmount: true },
  { key: 'trn_no', label: 'Transaction No' },
  { key: 'trn_date', label: 'Transaction Date', type: 'mediumDate' },
  { key: 'remark', label: 'Remark', type: 'truncate' },
  { key: 'created_by_name', label: 'Created By' },
  { key: 'created_at', label: 'Created At', type: 'date' },
] as const;

@Component({
  selector: 'app-receipt-report',
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
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule
  ],
  templateUrl: './receipt-report.component.html',
  styleUrl: './receipt-report.component.scss',
})
export class ReceiptReportComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) private agGridComponent!: ConfigurableAgGridDataComponent;

  // ============ INJECTIONS ============
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly receiptsService = inject(ReceiptsService);

  // ============ SIGNALS ============
  readonly isLoading = signal(false);
  readonly projects = signal<Project[]>([]);
  readonly wings = signal<Wing[]>([]);
  readonly receiptTypeList = signal<ReceiptType[]>([]);

  // ============ FORM ============
  readonly filterForm = new FormGroup({
    project_id: new FormControl<number | number[] | null>(null, [Validators.required]),
    wing_id: new FormControl<number | null>(null),
    receipt_type_id: new FormControl<number | null>(null),
  });

  // ============ COMPUTED VALUES ============
  readonly userSession = computed<UserSession>(() => ({
    session_id: sessionStorage.getItem(SESSION_KEYS.SESSION_ID),
    role_id: sessionStorage.getItem(SESSION_KEYS.ROLE_ID)
  }));

  readonly userId = computed(() => {
    const sessionId = this.userSession().session_id;
    return sessionId ? Number(sessionId) : 0;
  });

  // Reactive signal for form values
  private readonly formValues = toSignal(this.filterForm.valueChanges.pipe(
    startWith(this.filterForm.value)
  ));

  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    if (!values) return { filters: {} };

    return {
      filters: this.buildFilters(values)
    };
  });

  private buildFilters(formValues: any): Record<string, any> {
    const filters: Record<string, any> = {};

    if (formValues['project_id']) {
      filters['project_id'] = formValues['project_id'];
    }

    if (formValues['wing_id']) {
      filters['wing_id'] = formValues['wing_id'];
    }

    if (formValues['receipt_type_id']) {
      filters['receipt_type_id'] = formValues['receipt_type_id'];
    }

    return filters;
  }
  // FIX: Remove signal wrapper, use as constant or computed
  readonly columnDefinitions = RECEIPT_REPORT_COLUMNS;

  // ============ TEMPLATE-EXPOSED SIGNALS (to match template) ============
  readonly projectsList = computed(() => this.projects());
  readonly allWingslist = computed(() => this.wings());
  readonly loading = computed(() => this.isLoading());

  // ============ OBSERVABLE SIGNALS ============
  private readonly projectIdChanges$ = this.filterForm.get('project_id')!.valueChanges.pipe(
    startWith(this.filterForm.value.project_id),
    distinctUntilChanged(),
    filter((projectId) => !!projectId)
  );

  private readonly wings$ = this.projectIdChanges$.pipe(
    switchMap(projectId => this.fetchWingsForProject(projectId!)),
    shareReplay(1)
  );

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.loadProjects();
    this.subscribeToWings();
    this.fetchReceiptTypeDropdown();

    // Load initial wings if project is pre-selected
    const projectId = this.filterForm.value.project_id;
    if (projectId) {
      this.fetchWingsForProject(projectId).subscribe(wings => this.wings.set(wings));
    }
  }
  private fetchReceiptTypeDropdown(): void {
    this.receiptsService
      .fetchReceiptTypes()
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch receipt types.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((types) => {
        this.receiptTypeList.set(types);
      });
  }
  trackByReceiptTypeId(_index: number, type: ReceiptType): number {
    return type.receipt_type_id;
  }
  private loadProjects(): void {
    this.isLoading.set(true);

    // Fix: Extract primitive value from computed signal
    const userId = this.userId();

    this.commonService.fetchUserProjectDropdown(userId).pipe(
      catchError(error => this.handleError('Error fetching projects', error, [])),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: projects => this.projects.set(projects),
      error: () => this.showNotification('Unable to fetch projects', 'error')
    });
  }

  private subscribeToWings(): void {
    this.wings$.subscribe({
      next: wings => this.wings.set(wings),
      error: () => this.showNotification('Failed to load wings', 'error')
    });
  }

  private fetchWingsForProject(projectId: number | number[]) {
    // If it's an array and has more than 1 item, we might not want to fetch wings 
    // or we might need a different API. Based on all-bookings, it handles array.
    return this.commonService.fetchWingDropdown(projectId).pipe(
      map(wings => wings || []),
      catchError(error => this.handleError('Error fetching wings', error, []))
    );
  }

  private hasPermission(...permissions: number[]): boolean {
    const roleId = this.userSession().role_id;
    return roleId ? permissions.some(permission => roleId.includes(permission.toString())) : false;
  }

  // Public method called from template
  fetchAllReceipts(): void {
    console.log(this.filterForm.value);
    this.filterForm.markAllAsTouched();

    // Ensure form is valid before fetching
    if (this.filterForm.invalid) {
      this.showNotification('Please select a project first', 'error');
      return;
    }

    // This should trigger agGridComponent to use the updated agGridPayload
    this.agGridComponent?.refreshData();
  }

  // Template binding methods
  trackByWingId = (index: number, wing: Wing): number => wing.wing_id;



  // Reset filters and fetch
  resetAndFetch(): void {
    this.filterForm.reset();
    this.wings.set([]);
    this.agGridComponent?.refreshData();
  }

  private showNotification(message: string, type: 'error' | 'success' | 'info' = 'info'): void {
    const panelClass = `snackbar-${type}`;
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: [panelClass] });
  }

  private handleError<T>(context: string, error: any, fallback: T): T {
    console.error(`${context}:`, error);
    return fallback;
  }
}