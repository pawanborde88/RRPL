import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  computed,
  signal,
  effect,
  inject,
  DestroyRef,
  AfterViewInit,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import {
  ReusableTableComponent,
  TableRowData,
} from '../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../../Pipes/truncate.pipe';
import { environment } from '../../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FetchFunctionsService } from '../../../../../../Service/fetch-functions.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { AddbookingBillComponent } from '../../../../../Channel Partner Meetings/addbooking-bill/addbooking-bill.component';
import { AddCPBillPaymentDialogComponent } from '../../add-cpbill-payment-dialog/add-cpbill-payment-dialog.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ApprovalLevelDialogComponent } from '../../../CP Bill Approved/approval-level-dialog/approval-level-dialog.component';
import { CpBillApprovedLogComponent } from '../cp-bill-approved-log/cp-bill-approved-log.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  combineLatest,
  of,
} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  filter,
  finalize,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

// ============================================================================
// Type Definitions
// ============================================================================

interface BookingBill extends TableRowData {
  booking_bill_id: number;
  bill_date: string;
  project_name: string;
  wing_name: string;
  applicant_name: string;
  attachment: string;
  sales_executive: string;
  source: string;
  source_detail: string;
  bill_no: string;
  basic_bill_amount: number;
  gst: number;
  total_bill: number;
  remark: string;
  bill_status: string;
  bill_status_id: number;
  payment_status: string;
  payment_status_id: number;
  created_by_name: string;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
  floor_unit?: string;
  bill_type?: string;
  approve_level?: string;
  paid_bill_amount?: number;
  payment_remark?: string;
  firm_name?: string;
}

interface Project {
  project_id: number;
  property_name: string;
}

interface ApprovalLevel {
  approval_level_id: number;
  approval_level: string;
}

interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

type TabIndex = 0 | 1 | 2;

// ============================================================================
// Component
// ============================================================================

@Component({
  selector: 'app-all-cppayout',
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
    ReusableTableComponent,
  ],
  templateUrl: './all-cppayout.component.html',
  styleUrl: './all-cppayout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllCPPayoutComponent implements OnInit, AfterViewInit {
  // ============================================================================
  // Dependency Injection
  // ============================================================================
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly fetchService = inject(FetchFunctionsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // Constants
  // ============================================================================
  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly pipe = new DatePipe('en-US');
  readonly roleId = Number(sessionStorage.getItem('role_id')) || 0;
  readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  // ============================================================================
  // Signals for Reactive State Management
  // ============================================================================
  readonly selectedBooking = signal<BookingBill | null>(null);
  readonly selectedTabIndex = signal<TabIndex>(0);
  readonly bookingID = signal<number>(0);

  // Loading states
  readonly loading = signal({
    pendingApproval: false,
    pendingPayment: false,
    paidBills: false,
  });

  // Data sources
  readonly pendingApprovalDataSource = signal(
    new MatTableDataSource<BookingBill>([])
  );
  readonly pendingPaymentDataSource = signal(
    new MatTableDataSource<BookingBill>([])
  );
  readonly paidBillsDataSource = signal(
    new MatTableDataSource<BookingBill>([])
  );

  // Dropdown data with caching
  readonly projectsList = signal<Project[]>([]);
  readonly approvalLevels = signal<ApprovalLevel[]>([]);

  // ============================================================================
  // ViewChild References
  // ============================================================================
  @ViewChild('pendingApprovalPaginator')
  pendingApprovalPaginator!: MatPaginator;
  @ViewChild('pendingPaymentPaginator')
  pendingPaymentPaginator!: MatPaginator;
  @ViewChild('paidBillsPaginator')
  paidBillsPaginator!: MatPaginator;

  // ============================================================================
  // Form Group
  // ============================================================================
  readonly bookingForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    approval_level_id: new FormControl<number | null>(null),
    bill_status_id: new FormControl<number | null>(null),
  });

  // ============================================================================
  // RxJS Subjects for Reactive Streams
  // ============================================================================
  private readonly searchTrigger$ = new Subject<void>();
  private readonly tabChange$ = new Subject<TabIndex>();

  // ============================================================================
  // Computed Signals
  // ============================================================================
  readonly hasSelectedBooking = computed(() => this.selectedBooking() !== null);
  readonly isPendingApprovalTab = computed(() => this.selectedTabIndex() === 0);
  readonly isPendingPaymentTab = computed(() => this.selectedTabIndex() === 1);
  readonly isPaidBillsTab = computed(() => this.selectedTabIndex() === 2);

  // ============================================================================
  // Cached Observables (shareReplay for performance)
  // ============================================================================
  private projects$: Observable<Project[]> | null = null;
  private approvalLevels$: Observable<ApprovalLevel[]> | null = null;
  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================
  ngOnInit(): void {
    this.initializeRouteParams();
    this.initializeReactiveStreams();
    this.fetchInitialData();
  }

  ngAfterViewInit(): void {
    this.connectPaginators();
  }

  // ============================================================================
  // Initialization Methods
  // ============================================================================
  private initializeRouteParams(): void {
    this.route.params
      .pipe(
        map((params) => Number(params['booking_id']) || 0),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((bookingId) => {
        this.bookingID.set(bookingId);
        this.cdr.markForCheck();
      });
  }

  private initializeReactiveStreams(): void {
    // Debounced search trigger
    this.searchTrigger$
      .pipe(
        debounceTime(300),
        exhaustMap(() => this.fetchCurrentTabData()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Tab change handler with lazy loading
    this.tabChange$
      .pipe(
        distinctUntilChanged(),
        tap((tabIndex) => {
          this.selectedTabIndex.set(tabIndex);
          this.selectedBooking.set(null);
          this.cdr.markForCheck();
        }),
        exhaustMap(() => this.fetchCurrentTabData()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private connectPaginators(): void {
    // Use setTimeout to ensure ViewChild references are available
    setTimeout(() => {
      const pendingApprovalData = this.pendingApprovalDataSource();
      const pendingPaymentData = this.pendingPaymentDataSource();
      const paidBillsData = this.paidBillsDataSource();

      if (this.pendingApprovalPaginator) {
        pendingApprovalData.paginator = this.pendingApprovalPaginator;
      }
      if (this.pendingPaymentPaginator) {
        pendingPaymentData.paginator = this.pendingPaymentPaginator;
      }
      if (this.paidBillsPaginator) {
        paidBillsData.paginator = this.paidBillsPaginator;
      }
      this.cdr.markForCheck();
    }, 0);
  }

  private fetchInitialData(): void {
    // Fetch dropdowns in parallel
    combineLatest([this.fetchAllProjects(), this.fetchApprovalLevels()])
      .pipe(
        catchError((err) => {
          console.error('Error fetching initial data:', err);
          this.showError('Unable to fetch initial data.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  // ============================================================================
  // Public Methods - User Interactions
  // ============================================================================
  onTabChange(event: MatTabChangeEvent): void {
    const tabIndex = event.index as TabIndex;
    this.tabChange$.next(tabIndex);
  }

  searchCPPayout(): void {
    if (!this.bookingForm.get('project_id')?.value) {
      this.snackBar.open('Please select a project first.', 'Close', {
        duration: 3000,
      });
      return;
    }
    this.searchTrigger$.next();
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================
  private fetchCurrentTabData(): Observable<BookingBill[]> {
    const tabIndex = this.selectedTabIndex();
    switch (tabIndex) {
      case 0:
        return this.fetchPendingApprovalBills();
      case 1:
        return this.fetchPendingPaymentBills();
      case 2:
        return this.fetchPaidBills();
      default:
        return of([]);
    }
  }

  private updateLoadingState(
    tab: 'pendingApproval' | 'pendingPayment' | 'paidBills',
    isLoading: boolean
  ): void {
    this.loading.update((state) => ({
      ...state,
      [tab]: isLoading,
    }));
    this.cdr.markForCheck();
  }

  private updateDataSource(
    tab: 'pendingApproval' | 'pendingPayment' | 'paidBills',
    data: BookingBill[]
  ): void {
    const newDataSource = new MatTableDataSource<BookingBill>(data);
    let paginator: MatPaginator | null = null;

    switch (tab) {
      case 'pendingApproval':
        paginator = this.pendingApprovalPaginator;
        this.pendingApprovalDataSource.set(newDataSource);
        break;
      case 'pendingPayment':
        paginator = this.pendingPaymentPaginator;
        this.pendingPaymentDataSource.set(newDataSource);
        break;
      case 'paidBills':
        paginator = this.paidBillsPaginator;
        this.paidBillsDataSource.set(newDataSource);
        break;
    }

    if (paginator) {
      newDataSource.paginator = paginator;
    }
    this.cdr.markForCheck();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
    });
  }

  // ============================================================================
  // Data Fetching Methods - Optimized with RxJS
  // ============================================================================
  private fetchPendingApprovalBills(): Observable<BookingBill[]> {
    this.updateLoadingState('pendingApproval', true);

    const payload = {
      ...this.bookingForm.value,
      bill_status_id: null,
    };

    return this.http
      .post<ApiResponse<BookingBill[]>>(
        `${this.baseUrl}/fetch_all_booking_bill`,
        payload
      )
      .pipe(
        map((res) => res.data || []),
        tap((data) => {
          this.updateDataSource('pendingApproval', data);
          this.updateLoadingState('pendingApproval', false);
        }),
        catchError((err) => {
          console.error('Error fetching pending approval bills:', err);
          this.updateLoadingState('pendingApproval', false);
          this.showError('Unable to fetch pending approval bills.');
          return of([]);
        })
      );
  }
  private fetchPendingPaymentBills(): Observable<BookingBill[]> {
    this.updateLoadingState('pendingPayment', true);

    const payload = {
      project_id: this.bookingForm.get('project_id')?.value,
      approval_level_id: this.bookingForm.get('approval_level_id')?.value,
      bill_status_id: this.bookingForm.get('bill_status_id')?.value,
      payment_status_id: 0,
    };

    return this.http
      .post<ApiResponse<BookingBill[]>>(
        `${this.baseUrl}/fetch_all_booking_bill`,
        payload
      )
      .pipe(
        map((res) => res.data || []),
        tap((data) => {
          this.updateDataSource('pendingPayment', data);
          this.updateLoadingState('pendingPayment', false);
        }),
        catchError((err) => {
          console.error('Error fetching pending payment bills:', err);
          this.updateLoadingState('pendingPayment', false);
          this.showError('Unable to fetch pending payment bills.');
          return of([]);
        })
      );
  }

  private fetchPaidBills(): Observable<BookingBill[]> {
    this.updateLoadingState('paidBills', true);

    const payload = {
      booking_id: null,
      bill_status_id: 1,
      payment_status_id: 1,
    };

    return this.http
      .post<ApiResponse<BookingBill[]>>(
        `${this.baseUrl}/fetch_all_booking_bill`,
        payload
      )
      .pipe(
        map((res) => res.data || []),
        tap((data) => {
          this.updateDataSource('paidBills', data);
          this.updateLoadingState('paidBills', false);
        }),
        catchError((err) => {
          console.error('Error fetching paid bills:', err);
          this.updateLoadingState('paidBills', false);
          this.showError('Unable to fetch paid bills.');
          return of([]);
        })
      );
  }

  private fetchAllProjects(): Observable<Project[]> {
    // Return cached observable if available
    if (this.projects$) {
      return this.projects$;
    }

    const payload = {
      user_id:  this.userId,
    };

    this.projects$ = this.http
      .post<Project[]>(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(
        tap((projects) => {
          this.projectsList.set(projects || []);
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error('Error fetching projects:', err);
          this.showError('Unable to fetch projects.');
          return of([]);
        }),
        shareReplay(1) // Cache the result
      );

    return this.projects$;
  }

  private fetchApprovalLevels(): Observable<ApprovalLevel[]> {
    // Return cached observable if available
    if (this.approvalLevels$) {
      return this.approvalLevels$;
    }

    this.approvalLevels$ = this.http
      .get<ApiResponse<ApprovalLevel[]>>(`${this.baseUrl}/fetch_approval_levels`)
      .pipe(
        map((res) => res.data || []),
        tap((levels) => {
          this.approvalLevels.set(levels);
          this.cdr.markForCheck();
        }),
        catchError((err) => {
          console.error('Error fetching approval levels:', err);
          this.showError('Unable to fetch approval levels.');
          return of([]);
        }),
        shareReplay(1) // Cache the result
      );

    return this.approvalLevels$;
  }

  // ============================================================================
  // Selection Handling
  // ============================================================================
  onSelectedBookingChange(checked: boolean, booking: BookingBill): void {
    if (checked) {
      this.selectedBooking.set(booking);
    } else {
      const current = this.selectedBooking();
      if (current?.booking_bill_id === booking.booking_bill_id) {
        this.selectedBooking.set(null);
      }
    }
    this.cdr.markForCheck();
  }
  // ============================================================================
  // Column Definitions - Memoized for Performance
  // ============================================================================
  readonly bookingBillsColumns = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'sr_no',
      label: 'Sr. No',
      type: 'index',
    },
    { key: 'bill_no', label: 'Bill No' },
    { key: 'bill_date', label: 'Bill Date', type: 'short_date' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing Name' },
    { key: 'floor_unit', label: 'Unit' },
    { key: 'bill_type', label: 'Bill Type' },
    { key: 'applicant_name', label: 'Client Name' },
    { key: 'approve_level', label: 'Level' },
    {
      key: 'bill_status',
      label: 'Approved Status',
      applyChequeStatusColor: true,
      colorCondition: (element: BookingBill) =>
        element.bill_status_id === 1 ? 'green' : 'red',
    },
    {
      key: 'payment_status',
      label: 'Payment',
      applyChequeStatusColor: true,
      colorCondition: (element: BookingBill) =>
        element.payment_status_id === 1 ? 'green' : 'red',
    },
    { key: 'paid_bill_amount', label: 'Paid Bill Amount' },
    { key: 'payment_remark', label: 'Payment Remark' },
    { key: 'sales_executive', label: 'Executive' },
    {
      key: 'attachment',
      label: 'Attachment',
      type: 'attachment',
      nullImage: 'assets/Images/null_image.png',
    },
    { key: 'source', label: 'Source' },
    { key: 'firm_name', label: 'Firm' },
    { key: 'remark', label: 'Bill Remark' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ] as const;

  // Computed actions based on role
  readonly bookingActions = computed(() => [
    {
      action: 'CpBillApprovedLog',
      icon: 'history',
      tooltip: 'CP Bill Approved Log',
      color: 'primary' as const,
      show: () => [1, 2, 4].includes(this.roleId),
    },
  ]);

  onBookingAction(action: string, row: BookingBill): void {
    if (action === 'CpBillApprovedLog') {
      this.openCpBillApprovedLogDialog(row);
    }
  }

  // ============================================================================
  // Computed Header Buttons - Reactive to State Changes
  // ============================================================================
  readonly headerButtons = computed(() => {
    const selectedBooking = this.selectedBooking();
    const tabIndex = this.selectedTabIndex();

    return [
      {
        label: 'Level Approval',
        icon: 'stairs_2',
        color: 'primary' as const,
        disabled: () => !selectedBooking,
        action: () => this.changeApprovalDialog(),
        show: () => tabIndex === 0,
      },
      {
        label: 'Add Payment Bill',
        icon: 'add_circle',
        color: 'primary' as const,
        disabled: () => !selectedBooking,
        action: () => this.changeStatusDialog(),
        show: () => tabIndex === 1,
      },
    ];
  });

  // ============================================================================
  // Dialog Methods - Optimized with RxJS
  // ============================================================================
  openCpBillApprovedLogDialog(row?: BookingBill): void {
    const dialogRef = this.dialog.open(CpBillApprovedLogComponent, {
      width: '600px',
      data: {
        bookingID: this.bookingID(),
        editData: row,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result: unknown) => !!result),
        exhaustMap(() => this.fetchCurrentTabData()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  changeStatusDialog(): void {
    const selectedBooking = this.selectedBooking();
    if (!selectedBooking) {
      this.showError('Please select a booking first.');
      return;
    }

    const dialogRef = this.dialog.open(AddCPBillPaymentDialogComponent, {
      width: '40vw',
      data: selectedBooking,
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result: unknown) => !!result),
        exhaustMap(() => this.fetchCurrentTabData()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  changeApprovalDialog(): void {
    const selectedBooking = this.selectedBooking();
    if (!selectedBooking) {
      this.showError('Please select a booking first.');
      return;
    }

    const dialogRef = this.dialog.open(ApprovalLevelDialogComponent, {
      width: '500px',
      data: {
        currentStatus: selectedBooking,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result: unknown) => !!result),
        exhaustMap(() => this.fetchCurrentTabData()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  // ============================================================================
  // TrackBy Functions for Performance
  // ============================================================================
  trackByBookingBillId(_index: number, item: BookingBill): number {
    return item.booking_bill_id;
  }

  trackByProjectId(_index: number, item: Project): number {
    return item.project_id;
  }

  trackByApprovalLevelId(_index: number, item: ApprovalLevel): number {
    return item.approval_level_id;
  }

  // ============================================================================
  // Template Helper Methods for Type Safety
  // ============================================================================
  getSelectedItemsArray(): BookingBill[] {
    const selected = this.selectedBooking();
    return selected ? [selected] : [];
  }

  onSelectedItemsChange(items: TableRowData[]): void {
    const firstItem = items[0] as BookingBill | undefined;
    this.selectedBooking.set(firstItem || null);
  }

  onCheckboxChange(checked: boolean, row: TableRowData): void {
    this.onSelectedBookingChange(checked, row as BookingBill);
  }

  onActionClick(action: string, row: TableRowData): void {
    this.onBookingAction(action, row as BookingBill);
  }
}
