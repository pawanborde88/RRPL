import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  computed,
  signal,
  inject,
  DestroyRef,
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
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { ConfigurableAgGridDataComponent } from '../../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import type { TableColumn, TableRowData } from '../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { environment } from '../../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AddCPBillPaymentDialogComponent } from '../../add-cpbill-payment-dialog/add-cpbill-payment-dialog.component';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ApprovalLevelDialogComponent } from '../../../CP Bill Approved/approval-level-dialog/approval-level-dialog.component';
import { CpBillApprovedLogComponent } from '../cp-bill-approved-log/cp-bill-approved-log.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EMPTY,
  Observable,
  combineLatest,
  of,
} from 'rxjs';
import {
  catchError,
  map,
  shareReplay,
  tap,
} from 'rxjs/operators';
import { ReceiptPreviewDialogComponent } from '../../../../Post Sales/Recovery/receipt-preview-dialog/receipt-preview-dialog.component';

// ============================================================================
// Type Definitions
// ============================================================================

interface BookingBill extends Record<string, unknown> {
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
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-cppayout.component.html',
  styleUrl: './all-cppayout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class AllCPPayoutComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent;

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly roleId = Number(sessionStorage.getItem('role_id')) || 0;
  readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  readonly loading = signal<boolean>(false);
  readonly selectedBooking = signal<BookingBill[]>([]);
  readonly selectedTabIndex = signal<TabIndex>(0);
  readonly bookingID = signal<number>(0);

  readonly projectsList = signal<Project[]>([]);
  readonly approvalLevels = signal<ApprovalLevel[]>([]);
  private readonly formValues = signal<Record<string, any>>({});

  private projects$: Observable<Project[]> | null = null;
  private approvalLevels$: Observable<ApprovalLevel[]> | null = null;

  readonly bookingForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    approval_level_id: new FormControl<number | null>(null),
    bill_status_id: new FormControl<number | null>(null),
  });

  // Computed API payloads per tab – request shape: { filters: { ... }, search, offset, limit } (offset/limit added by grid)
  // 1st tab: approval_level_id null, bill_status_id null, payment_status_id 0
  readonly apiPayloadPendingApproval = computed(() => {
    const values = this.formValues();
    const filters: Record<string, number | null> = {
      bill_status_id: null,
      approval_level_id: null,

    };
    if (values['project_id'] != null) filters['project_id'] = values['project_id'];
    return { filters };
  });

  // 2nd tab: project_id, approval_level_id null, bill_status_id null, payment_status_id 0
  readonly apiPayloadPendingPayment = computed(() => {
    const values = this.formValues();
    const filters: Record<string, number | null> = {
      approval_level_id: null,
      bill_status_id: null,
      payment_status_id: 0,
    };
    if (values['project_id'] != null) filters['project_id'] = values['project_id'];
    return { filters };
  });

  // 3rd tab: booking_id null, bill_status_id 1, payment_status_id 1
  readonly apiPayloadPaidBills = computed(() => {
    const values = this.formValues();
    const filters: Record<string, number | null> = {
      booking_id: null,
      bill_status_id: 1,
      payment_status_id: 1,
    };
    if (values['project_id'] != null) filters['project_id'] = values['project_id'];
    return { filters };
  });

  readonly bookingBillsColumns: TableColumn<BookingBill>[] = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
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

    { key: 'source', label: 'Source' },
    { key: 'firm_name', label: 'Firm' },
    { key: 'remark', label: 'Bill Remark' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  readonly bookingActions = computed(() => [
    {
      action: 'CpBillApprovedLog',
      icon: 'history',
      tooltip: 'CP Bill Approved Log',
      color: 'primary' as const,
      show: () => [1, 2, 4].includes(this.roleId),
    },
    {
      action: 'attachmentReceipt',
      icon: 'attach_file',
      tooltip: 'View Attachment',
      color: 'primary',
      disabled: false,
    },
  ]);

  readonly headerButtons = computed(() => {
    const tabIndex = this.selectedTabIndex();
    return [
      {
        label: 'Level Approval',
        icon: 'stairs_2',
        color: 'primary' as const,
        disabled: () => this.selectedBooking().length === 0,
        action: () => this.changeApprovalDialog(),
        show: () => tabIndex === 0,
      },
      {
        label: 'Add Payment Bill',
        icon: 'add_circle',
        color: 'primary' as const,
        disabled: () => this.selectedBooking().length === 0,
        action: () => this.changeStatusDialog(),
        show: () => tabIndex === 1,
      },
    ];
  });

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.bookingID.set(Number(params['booking_id']) || 0);
      });

    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValues());

    this.fetchInitialData();
  }

  private updateFormValues(): void {
    this.formValues.set(this.bookingForm.value ?? {});
  }

  private fetchInitialData(): void {
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

  searchCPPayout(): void {
    if (!this.bookingForm.get('project_id')?.value) {
      this.snackBar.open('Please select a project first.', 'Close', {
        duration: 3000,
      });
      return;
    }
    this.updateFormValues();
    this.agGridTable?.refreshData();
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex.set(event.index as TabIndex);
    this.selectedBooking.set([]);
    this.agGridTable?.refreshData();
  }

  onBookingSelectionChange(checked: boolean, row: TableRowData): void {
    if (checked) {
      this.selectedBooking.set([row as BookingBill]);
    } else {
      this.selectedBooking.set([]);
    }
  }

  onRowSelected(rows: TableRowData[]): void {
    this.selectedBooking.set(rows as BookingBill[]);
  }

  onBookingAction(action: string, row: TableRowData): void {
    const booking = row as BookingBill;
    if (action === 'CpBillApprovedLog') {
      this.openCpBillApprovedLogDialog(booking);
    }
    if (action === 'attachmentReceipt') {
      this.viewAttachment(booking);
    }
  }
  viewAttachment(bookingData: BookingBill): void {
    if (!bookingData?.attachment) {
      this.snackBar.open('Attachment not found', 'Close', {
        duration: 3000,
      });
      return;
    }

    const fileUrl = `${this.storageUrl}/${bookingData.attachment}`;

    this.dialog.open(ReceiptPreviewDialogComponent, {
      width: '80%',
      maxWidth: '900px',
      data: {
        title: 'Receipt Details',
        fileUrl: fileUrl,
      },
    });
  }
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private fetchAllProjects(): Observable<Project[]> {
    if (this.projects$) return this.projects$;
    this.projects$ = this.http
      .post<Project[]>(`${this.baseUrl}/user_project_dropdown`, {
        user_id: this.userId,
      })
      .pipe(
        tap((projects) => this.projectsList.set(projects || [])),
        catchError((err) => {
          console.error('Error fetching projects:', err);
          this.showError('Unable to fetch projects.');
          return of([]);
        }),
        shareReplay(1)
      );
    return this.projects$;
  }

  private fetchApprovalLevels(): Observable<ApprovalLevel[]> {
    if (this.approvalLevels$) return this.approvalLevels$;
    this.approvalLevels$ = this.http
      .get<ApiResponse<ApprovalLevel[]>>(`${this.baseUrl}/fetch_approval_levels`)
      .pipe(
        map((res) => res.data || []),
        tap((levels) => this.approvalLevels.set(levels)),
        catchError((err) => {
          console.error('Error fetching approval levels:', err);
          this.showError('Unable to fetch approval levels.');
          return of([]);
        }),
        shareReplay(1)
      );
    return this.approvalLevels$;
  }

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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.agGridTable?.refreshData();
      });
  }

  changeStatusDialog(): void {
    const selected = this.selectedBooking()[0];
    if (!selected) {
      this.showError('Please select a booking first.');
      return;
    }

    const dialogRef = this.dialog.open(AddCPBillPaymentDialogComponent, {
      width: '40vw',
      data: selected,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.agGridTable?.refreshData();
      });
  }

  changeApprovalDialog(): void {
    const selected = this.selectedBooking()[0];
    if (!selected) {
      this.showError('Please select a booking first.');
      return;
    }

    const dialogRef = this.dialog.open(ApprovalLevelDialogComponent, {
      width: '500px',
      data: { currentStatus: selected },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.agGridTable?.refreshData();
      });
  }

  trackByApprovalLevelId(_index: number, item: ApprovalLevel): number {
    return item.approval_level_id;
  }
}
