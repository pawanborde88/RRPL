import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  ViewChild
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { environment } from '../../../../../../environments/environment';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  catchError,
  finalize,
  of,
  switchMap,
  tap,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { ReusableTableComponent, type TableRowData } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';
import { ReceiptPreviewDialogComponent } from '../receipt-preview-dialog/receipt-preview-dialog.component';
import { ChekqueStatusDialogComponent } from './chekque-status-dialog/chekque-status-dialog.component';
import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { ImportFloorUnitsComponent } from '../../../Floor Unit/import-floor-units/import-floor-units.component';
import {
  ReceiptsService,
  type Project,
  type Wing,
  type Unit,
  type ReceiptType,
  type PaymentMode,
  type Bank,
  type Receipt,
} from './receipts.service';
import { AuthService } from '../../../../../Service/auth.service';
import { TableColumn, ActionButton as TableActionButton } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ColumnDynamicColorService } from '../../../../../Service/Column-Colors/column-dynamic-color.service';

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}

interface ReceiptAction {
  action: string;
  icon: string;
  tooltip: string;
  color: string;
  disabled: boolean | (() => boolean);
  show?: () => boolean;
}

// Using TableColumn from reusable table component

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
    AmountDirective,
  ],
  templateUrl: './receipts.component.html',
  styleUrl: './receipts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReceiptsComponent implements OnInit {
  // Dependency injection using inject() for better tree-shaking
  private readonly receiptsService = inject(ReceiptsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');
  private readonly authService = inject(AuthService);
  @ViewChild(ConfigurableAgGridDataComponent) agGrid!: ConfigurableAgGridDataComponent;
  private readonly columnDynamicColorService = inject(ColumnDynamicColorService);

  // Environment and user data
  readonly storageUrl = environment.STORAGE_URL;
  readonly userId = Number(sessionStorage.getItem('session_id'));

  // Signals for reactive state management
  readonly loading = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly selectedFile = signal<File | null>(null);
  readonly projectsList = signal<Project[]>([]);
  readonly receiptTypeList = signal<ReceiptType[]>([]);
  readonly paymentModeList = signal<PaymentMode[]>([]);
  readonly bankList = signal<Bank[]>([]);
  readonly wingsList = signal<Wing[]>([]);
  readonly unitList = signal<Unit[]>([]);
  readonly selectedReceipts = signal<
    Array<{ booking_receipt_id: number; project_id: number }>
  >([]);
  readonly currentReceiptId = signal<number | null>(null);
  readonly receiptsData = signal<Receipt[]>([]);
  private readonly formValues = signal<any>({});

  // Computed properties
  readonly hasSelectedReceipts = computed(
    () => this.selectedReceipts().length > 0
  );
  readonly isFormDisabled = computed(
    () => this.isSubmitting() || this.loading()
  );
  readonly dataSource = computed(() => {
    const data = this.receiptsData();
    return new MatTableDataSource<Receipt>(data);
  });

  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};
    if (values.project_id) filters.project_id = values.project_id;
    if (values.wing_id) filters.wing_id = values.wing_id;
    if (values.floor_unit_id) filters.floor_unit_id = values.floor_unit_id;

    return {
      user_id: this.userId,
      filters: filters
    };
  });

  readonly addProjectsRecipts = new FormGroup({
    project_id: new FormControl<number | null>(null, [Validators.required]),
    wing_id: new FormControl<number | null>(null, [Validators.required]),
    floor_unit_id: new FormControl<number | null>(null, [
      Validators.required,
    ]),
    receipt_date: new FormControl<string | null>(null, [Validators.required]),
    receipt_type_id: new FormControl<number | null>(null, [
      Validators.required,
    ]),
    received_amount: new FormControl<number | null>(null, [
      Validators.required,
    ]),
    split_gst: new FormControl<number>(0),
    reverse_gst: new FormControl<number>(0),
    gst_percentage: new FormControl<number | null>(null),
    gst: new FormControl<number | null>(null),
    trn_no: new FormControl<string>('', [Validators.required]),
    trn_date: new FormControl<string | null>(null),
    payment_mode_id: new FormControl<number | null>(null, [
      Validators.required,
    ]),
    bank_id: new FormControl<number | null>(null),
    attachment: new FormControl<File | null>(null),
    bank_details: new FormControl<string>(''),
    remark: new FormControl<string>(''),
    created_by: new FormControl<number>(this.userId),
  });
  readonly hasPermission = (permission: string): boolean =>
    this.authService.hasPermission(permission);

  readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
    this.authService.hasOnlyRoles(allowedRoles);
  // Table configuration
  readonly bookingReciptColumns: TableColumn<Receipt>[] = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
      columnType: 'agTextColumnFilter',
    },

    { key: 'receipt_date', label: 'Receipt Date', type: 'mediumDate', columnType: 'agDateColumnFilter' },
    {
      key: 'cheque_status',
      label: 'Status',
      cellStyle: ({ data }: { data: Receipt }) => data ? this.columnDynamicColorService.getChequeStatusStyle(data.cheque_status_id) : undefined,
    },
    { key: 'receipt_type', label: 'Receipt Type' },
    { key: 'received_amount', label: 'Received Amount', isAmount: true },
    { key: 'trn_no', label: 'Transaction No' },
    { key: 'trn_date', label: 'Transaction Date', type: 'mediumDate' },
    { key: 'payment_mode', label: 'Payment Mode' },
    { key: 'bank_details', label: 'Branch' },
    { key: 'bank_name', label: 'Bank Name' },
    { key: 'remark', label: 'Approved Remark' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'created_by_name', label: 'Approved By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  readonly reciptActions: ReceiptAction[] = [
    {
      action: 'editReceipt',
      icon: 'edit_note',
      tooltip: 'Edit Receipt',
      color: 'primary',
      disabled: false,
    },
    {
      action: 'deleteReceipt',
      icon: 'delete',
      tooltip: 'Delete Receipt',
      color: 'warn',
      disabled: false,
      show: () => this.hasPermission('523'),
    },
    {
      action: 'chequeReceipt',
      icon: 'payments',
      tooltip: 'Cheque Status',
      color: 'accent',
      disabled: false,
    },
    {
      action: 'attachmentReceipt',
      icon: 'attach_file',
      tooltip: 'View Attachment',
      color: 'primary',
      disabled: false,
    },
  ];

  readonly headerButtons: ActionButton[] = [
    {
      label: 'Receipts',
      icon: 'forum',
      color: 'primary',
      disabled: () => !this.hasSelectedReceipts(),
      action: () => this.openRecepitDialog(),
      show: () => true,
    },
    {
      label: 'Import Receipts',
      icon: 'file_upload',
      color: 'primary',
      disabled: () => false,
      action: () => this.openImportReceiptDialog(),
      show: () => true,
    },

  ];

  constructor() {
    // Setup form value changes with optimized RxJS
    this.setupFormValueChanges();
  }

  ngOnInit(): void {
    const elementData = history.state.data;
    this.fetchProjects();
    this.handleEditCase(elementData);

    // Track form values for reactive agGridPayload
    this.addProjectsRecipts.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValues.set(this.addProjectsRecipts.getRawValue());
      });
  }

  private setupFormValueChanges(): void {
    const projectIdControl = this.addProjectsRecipts.get('project_id');
    const wingIdControl = this.addProjectsRecipts.get('wing_id');
    const floorUnitIdControl = this.addProjectsRecipts.get('floor_unit_id');

    if (!projectIdControl || !wingIdControl || !floorUnitIdControl) return;

    // Project ID changes
    projectIdControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((projectId): projectId is number => projectId !== null),
        tap((projectId) => {
          this.fetchWings(projectId);
          wingIdControl.reset(null, { emitEvent: false });
          floorUnitIdControl.reset(null, { emitEvent: false });
          this.selectedReceipts.set([]);
          this.receiptsData.set([]);
        }),
        switchMap((projectId) =>
          wingIdControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            filter((wingId): wingId is number => wingId !== null),
            tap((wingId) => {
              this.fetchUnits(projectId, wingId);
              floorUnitIdControl.reset(null, { emitEvent: false });
              this.selectedReceipts.set([]);
              this.receiptsData.set([]);
            }),
            switchMap((wingId) =>
              floorUnitIdControl.valueChanges.pipe(
                debounceTime(300),
                distinctUntilChanged(),
                filter((floorId): floorId is number => floorId !== null),
                tap((floorId) => {
                  this.fetchReceiptTypeDropdown();
                  this.fetchPaymentModes();
                  this.fetchBanks();
                  this.selectedReceipts.set([]);
                  this.agGrid?.refreshData();
                })
              )
            )
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private handleEditCase(elementData: any): void {
    if (!elementData?.[0]?.project_id) return;

    const bookingData = elementData[0];
    this.fetchWings(bookingData.project_id);

    this.addProjectsRecipts.patchValue(
      {
        project_id: bookingData.project_id,
        wing_id: bookingData.wing_id,
        floor_unit_id: bookingData.floor_unit_id,
      },
      { emitEvent: false }
    );
    this.formValues.set(this.addProjectsRecipts.getRawValue());

    if (bookingData.wing_id) {
      this.fetchUnits(bookingData.project_id, bookingData.wing_id);
    }

    if (bookingData.floor_unit_id) {
      this.fetchReceipts(bookingData.floor_unit_id);
      this.fetchReceiptTypeDropdown();
      this.fetchPaymentModes();
      this.fetchBanks();
    }
  }

  private fetchProjects(): void {
    const userId = this.userId;
    this.receiptsService.fetchProjects(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.showError('Unable to fetch projects.');
          return of([]);
        })
      )
      .subscribe((projects) => {
        this.projectsList.set(projects);
      });
  }
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error'],
    });
  }
  private fetchWings(projectId: number): void {
    if (!projectId) return;

    this.receiptsService
      .fetchWings(projectId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch project wings.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((wings) => {
        this.wingsList.set(wings);
      });
  }

  private fetchUnits(projectId: number, wingId: number): void {
    if (!projectId || !wingId) return;

    this.loading.set(true);
    this.receiptsService
      .fetchUnits(projectId, wingId)
      .pipe(
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.snackBar.open('Unable to fetch units.', 'Close', {
            duration: 3000,
          });
          return of({ data: [] });
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        const units = (response.data || []).map((item) => ({
          ...item,
          full_name: `${item.floor_unit} - ${item.applicant_name}`,
        }));
        this.unitList.set(units);
      });
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

  private fetchPaymentModes(): void {
    this.receiptsService
      .fetchPaymentModes()
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch payment modes.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((modes) => {
        this.paymentModeList.set(modes);
      });
  }

  private fetchBanks(): void {
    this.receiptsService
      .fetchBanks()
      .pipe(
        catchError(() => {
          this.snackBar.open('Failed to fetch banks.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((banks) => {
        this.bankList.set(banks);
      });
  }

  private fetchReceipts(floorUnitId: number): void {
    if (!floorUnitId) return;

    this.loading.set(true);
    this.selectedReceipts.set([]);

    this.receiptsService
      .fetchReceipts(floorUnitId)
      .pipe(
        map((res) => {
          if (Array.isArray(res)) return res;
          if (res && typeof res === 'object' && 'data' in res) {
            return Array.isArray(res.data) ? res.data : [];
          }
          return [];
        }),
        finalize(() => this.loading.set(false)),
        catchError(() => {
          this.snackBar.open('Failed to fetch receipts.', 'Close', {
            duration: 3000,
          });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((receipts) => {
        this.receiptsData.set(receipts);
      });
  }

  editReceipt(receiptData: Receipt): void {
    const projectIdControl = this.addProjectsRecipts.get('project_id');
    const wingIdControl = this.addProjectsRecipts.get('wing_id');
    const floorUnitIdControl = this.addProjectsRecipts.get('floor_unit_id');

    projectIdControl?.disable({ emitEvent: false });
    wingIdControl?.disable({ emitEvent: false });
    floorUnitIdControl?.disable({ emitEvent: false });

    this.addProjectsRecipts.patchValue(
      {
        project_id: receiptData.project_id,
        wing_id: receiptData.wing_id,
        floor_unit_id: receiptData.floor_unit_id,
        receipt_date:
          receiptData.receipt_date !== '0000-00-00'
            ? receiptData.receipt_date
            : null,
        receipt_type_id:
          receiptData.receipt_type_id !== 0
            ? receiptData.receipt_type_id
            : null,
        received_amount: receiptData.received_amount,
        split_gst: receiptData.split_gst ?? 0,
        reverse_gst: receiptData.reverse_gst ?? 0,
        gst_percentage: receiptData.gst_percentage ?? null,
        gst: receiptData.gst ?? null,
        trn_no: receiptData.trn_no,
        trn_date:
          receiptData.trn_date !== '0000-00-00'
            ? receiptData.trn_date
            : null,
        payment_mode_id: receiptData.payment_mode_id,
        bank_id: receiptData.bank_id ?? null,
        bank_details: receiptData.bank_details ?? '',
        remark: receiptData.remark ?? '',
      },
      { emitEvent: false }
    );
    this.formValues.set(this.addProjectsRecipts.getRawValue());

    this.currentReceiptId.set(receiptData.booking_receipt_id);
  }

  onSubmit(): void {
    if (this.addProjectsRecipts.invalid) {
      this.addProjectsRecipts.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.buildFormData();
    const floorUnitId = this.addProjectsRecipts.get('floor_unit_id')?.value;

    const request$ = this.currentReceiptId()
      ? this.receiptsService.updateReceipt(formData)
      : this.receiptsService.createReceipt(formData);

    request$
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.currentReceiptId.set(null);
            this.dialog.open(SuccessDialogComponent, {
              data: { message: res.message },
            });

            this.clearFormAfterSubmit();

            if (floorUnitId) {
              this.agGrid.refreshData();
            } else {
              this.resetFormAndSelections();
            }
          }
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Failed to save receipt.',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.addProjectsRecipts.value;
    const receiptId = this.currentReceiptId();

    Object.entries(formValue).forEach(([key, value]) => {
      if (key === 'attachment') return;

      let formattedValue: string;
      if (key === 'trn_date' || key === 'receipt_date') {
        formattedValue =
          value && (typeof value === 'string' || value instanceof Date)
            ? (this.datePipe.transform(value, 'yyyy-MM-dd') || '')
            : '';
      } else {
        formattedValue =
          value !== null && value !== undefined ? String(value) : '';
      }

      formData.append(key, formattedValue);
    });

    const file = this.selectedFile();
    if (file) {
      formData.append('attachment', file);
    }

    if (receiptId) {
      formData.append('booking_receipt_id', receiptId.toString());
      formData.append('updated_by', this.userId.toString());
    } else {
      formData.append('created_by', this.userId.toString());
    }

    return formData;
  }

  onLeadSelectionChange(checked: boolean, booking: Receipt): void {
    const currentSelection = this.selectedReceipts();
    const selectedData = {
      booking_receipt_id: booking.booking_receipt_id,
      project_id: booking.project_id,
    };

    if (checked) {
      if (
        !currentSelection.some(
          (item) =>
            item.booking_receipt_id === selectedData.booking_receipt_id
        )
      ) {
        this.selectedReceipts.set([...currentSelection, selectedData]);
      }
    } else {
      this.selectedReceipts.set(
        currentSelection.filter(
          (item) =>
            item.booking_receipt_id !== selectedData.booking_receipt_id
        )
      );
    }
  }

  getSelectedReceiptsForTable(): Receipt[] {
    const selected = this.selectedReceipts();
    const allReceipts = this.receiptsData();
    return selected
      .map((selectedItem) =>
        allReceipts.find(
          (receipt) =>
            receipt.booking_receipt_id === selectedItem.booking_receipt_id
        )
      )
      .filter((receipt): receipt is Receipt => receipt !== undefined);
  }

  onSelectedItemsChange(items: Receipt[]): void {
    const simplified = items.map((item) => ({
      booking_receipt_id: item.booking_receipt_id,
      project_id: item.project_id,
    }));
    this.selectedReceipts.set(simplified);
  }

  // TrackBy functions for better performance
  trackByWingId(_index: number, wing: Wing): number {
    return wing.wing_id;
  }

  trackByUnitId(_index: number, unit: Unit): number {
    return unit.floor_unit_id;
  }

  trackByReceiptTypeId(_index: number, type: ReceiptType): number {
    return type.receipt_type_id;
  }

  trackByPaymentModeId(_index: number, mode: PaymentMode): number {
    return mode.payment_mode_id;
  }

  onReciptActions(action: string, row: Receipt): void {
    switch (action) {
      case 'editReceipt':
        this.editReceipt(row);
        break;
      case 'deleteReceipt':
        this.deleteReceipt(row);
        break;
      case 'chequeReceipt':
        this.handleChequeAction(row);
        break;
      case 'attachmentReceipt':
        this.openReceiptDialog(row);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  openImportReceiptDialog(): void {
    const dialogRef = this.dialog.open(ImportFloorUnitsComponent, {
      width: '500px',
      disableClose: true,
      data: {
        for: 'receiptsImport',
        API_URL: `import_booking_receipt`,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((res) => !!res),
        switchMap(() => {
          const floorUnitId =
            this.addProjectsRecipts.get('floor_unit_id')?.value;
          if (floorUnitId) {
            this.fetchReceipts(floorUnitId);
          }
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  openRecepitDialog(): void {
    const selected = this.selectedReceipts();
    if (selected.length === 0) {
      this.snackBar.open('Please select at least one receipt', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.dialog.open(UnifiedDocumentDialogComponent, {
      minWidth: '60vw',
      panelClass: 'custom-dialog-container',
      data: {
        dialogType: DocumentDialogType.RECEIPT,
        receiptData: selected,
      },
    });
  }

  handleChequeAction(receiptData: Receipt): void {
    const dialogRef = this.dialog.open(ChekqueStatusDialogComponent, {
      width: '350px',
      data: {
        title: 'Cheque Status',
        message: `Are you sure you want to change the cheque status to ${receiptData.cheque_status_id === 1 ? 'Bounce' : 'Cleared'
          }?`,
        confirmText: 'Confirm',
        cancelText: 'Cancel',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        switchMap(() =>
          this.receiptsService.changeChequeStatus(
            receiptData.booking_receipt_id,
            receiptData.cheque_status_id === 1 ? 0 : 1
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.fetchReceipts(receiptData.floor_unit_id);
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to change cheque status',
            'Close',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  openReceiptDialog(receiptData: Receipt): void {
    if (!receiptData?.attachment) {
      this.snackBar.open('Receipt attachment not found', 'Close', {
        duration: 3000,
      });
      return;
    }

    const fileUrl = `${this.storageUrl}/${receiptData.attachment}`;

    this.dialog.open(ReceiptPreviewDialogComponent, {
      width: '80%',
      maxWidth: '900px',
      data: {
        title: 'Receipt Details',
        fileUrl: fileUrl,
      },
    });
  }

  deleteReceipt(receiptData: Receipt): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this receipt?',
        title: 'Confirm Deletion',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => result && result.confirmed),
        switchMap((result) =>
          this.receiptsService.deleteReceipt(
            receiptData.booking_receipt_id,
            receiptData.floor_unit_id,
            this.userId,
            result.reason
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Receipt deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.fetchReceipts(receiptData.floor_unit_id);
        },
        error: (err) => {
          this.snackBar.open(
            err.error?.message || 'Failed to delete receipt',
            'Close',
            {
              duration: 3000,
              panelClass: ['error-snackbar'],
            }
          );
        },
      });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile.set(file);
    }
  }

  clearSelectedFile(): void {
    this.selectedFile.set(null);
    const fileInput = document.getElementById('receipt-attachment') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private clearFormAfterSubmit(): void {
    const projectIdControl = this.addProjectsRecipts.get('project_id');
    const wingIdControl = this.addProjectsRecipts.get('wing_id');
    const floorUnitIdControl = this.addProjectsRecipts.get('floor_unit_id');

    // Preserve project_id, wing_id, and floor_unit_id values
    const preservedProjectId = projectIdControl?.value;
    const preservedWingId = wingIdControl?.value;
    const preservedFloorUnitId = floorUnitIdControl?.value;

    projectIdControl?.enable({ emitEvent: false });
    wingIdControl?.enable({ emitEvent: false });
    floorUnitIdControl?.enable({ emitEvent: false });

    // Reset form but preserve project_id, wing_id, and floor_unit_id
    this.addProjectsRecipts.reset({
      project_id: preservedProjectId,
      wing_id: preservedWingId,
      floor_unit_id: preservedFloorUnitId,
      split_gst: 0,
      reverse_gst: 0,
      created_by: this.userId,
    }, { emitEvent: false });
    this.formValues.set(this.addProjectsRecipts.getRawValue());

    this.selectedFile.set(null);
    this.currentReceiptId.set(null);
  }

  private resetFormAndSelections(): void {
    this.addProjectsRecipts.reset({
      split_gst: 0,
      reverse_gst: 0,
      created_by: this.userId,
    });

    const projectIdControl = this.addProjectsRecipts.get('project_id');
    const wingIdControl = this.addProjectsRecipts.get('wing_id');
    const floorUnitIdControl = this.addProjectsRecipts.get('floor_unit_id');

    projectIdControl?.enable({ emitEvent: false });
    wingIdControl?.enable({ emitEvent: false });
    floorUnitIdControl?.enable({ emitEvent: false });

    this.selectedReceipts.set([]);
    this.receiptsData.set([]);
    this.currentReceiptId.set(null);
    this.selectedFile.set(null);
    this.wingsList.set([]);
    this.unitList.set([]);
  }
}
