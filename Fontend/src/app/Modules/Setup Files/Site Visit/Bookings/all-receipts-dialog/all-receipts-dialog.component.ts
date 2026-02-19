import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, signal, computed, inject, DestroyRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { ReceiptPreviewDialogComponent } from '../../../Post Sales/Recovery/receipt-preview-dialog/receipt-preview-dialog.component';
import { ChekqueStatusDialogComponent } from '../../../Post Sales/Recovery/Recipts/chekque-status-dialog/chekque-status-dialog.component';
import { environment } from '../../../../../../environments/environment';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { ReceiptsService, Receipt, ReceiptType, PaymentMode, Bank } from '../../../Post Sales/Recovery/Recipts/receipts.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap, catchError, of } from 'rxjs';
import { TableColumn, TableRowData } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';

@Component({
  selector: 'app-all-receipts-dialog',
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
  templateUrl: './all-receipts-dialog.component.html',
  styleUrl: './all-receipts-dialog.component.scss'
})
export class AllReceiptsDialogComponent implements OnInit {
  private readonly receiptsService = inject(ReceiptsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<AllReceiptsDialogComponent>);

  @ViewChild(ConfigurableAgGridDataComponent) agGrid!: ConfigurableAgGridDataComponent;

  readonly storageUrl = environment.STORAGE_URL;
  readonly userId = Number(sessionStorage.getItem('session_id'));
  readonly loading = signal<boolean>(false);
  readonly selectedReceipts = signal<Array<{ booking_receipt_id: number; project_id: number }>>([]);

  readonly receiptTypeList = signal<ReceiptType[]>([]);
  readonly paymentModeList = signal<PaymentMode[]>([]);
  readonly bankList = signal<Bank[]>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.fetchReceiptTypeDropdown();
    this.fetchPaymentModes();
    this.fetchBanks();
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

  readonly agGridPayload = computed(() => {
    return {
      user_id: this.userId,
      filters: {
        floor_unit_id: this.data.selectedBooking
      }
    };
  });

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
    },
    { key: 'receipt_type', label: 'Receipt Type', columnType: 'agTextColumnFilter' },
    { key: 'received_amount', label: 'Received Amount', isAmount: true, columnType: 'agNumberColumnFilter' },
    { key: 'trn_no', label: 'Transaction No', columnType: 'agTextColumnFilter' },
    { key: 'trn_date', label: 'Transaction Date', type: 'mediumDate', columnType: 'agDateColumnFilter' },
    { key: 'payment_mode', label: 'Payment Mode', columnType: 'agTextColumnFilter' },
    { key: 'bank_details', label: 'Branch', columnType: 'agTextColumnFilter' },
    { key: 'bank_name', label: 'Bank Name', columnType: 'agTextColumnFilter' },
    { key: 'remark', label: 'Approved Remark', columnType: 'agTextColumnFilter' },
    { key: 'created_at', label: 'Created At', type: 'date', columnType: 'agDateColumnFilter' },
    { key: 'updated_by_name', label: 'Updated By', columnType: 'agTextColumnFilter' },
    { key: 'created_by_name', label: 'Approved By', columnType: 'agTextColumnFilter' },
    { key: 'updated_at', label: 'Updated At', type: 'date', columnType: 'agDateColumnFilter' },
  ];

  readonly reciptActions = [
    {
      action: 'deleteReceipt',
      icon: 'delete',
      tooltip: 'Delete Receipt',
      color: 'warn',
      disabled: false,
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

  readonly headerButtons = [
    {
      label: 'Receipts',
      icon: 'forum',
      color: 'primary',
      disabled: () => this.selectedReceipts().length === 0,
      action: () => this.openRecepitDialog(),
      show: () => true,
    },
  ];

  onSelectedItemsChange(items: TableRowData[]): void {
    const receipts = items as Receipt[];
    this.selectedReceipts.set(receipts.map(i => ({
      booking_receipt_id: i.booking_receipt_id,
      project_id: i.project_id
    })));
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

  onReciptActions(action: string, row: TableRowData): void {
    const receipt = row as Receipt;
    switch (action) {
      case 'deleteReceipt':
        this.deleteReceipt(receipt);
        break;
      case 'chequeReceipt':
        this.handleChequeAction(receipt);
        break;
      case 'attachmentReceipt':
        this.openReceiptDialog(receipt);
        break;
      default:
        console.warn('Unknown action:', action);
    }
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

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap(() =>
        this.receiptsService.changeChequeStatus(
          receiptData.booking_receipt_id,
          receiptData.cheque_status_id === 1 ? 0 : 1
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.agGrid.refreshData();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to change cheque status', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      }
    });
  }

  openReceiptDialog(receiptData: Receipt): void {
    if (receiptData && receiptData.attachment) {
      const fileUrl = `${this.storageUrl}/${receiptData.attachment}`;
      this.dialog.open(ReceiptPreviewDialogComponent, {
        width: '80%',
        maxWidth: '900px',
        data: {
          title: 'Receipt Details',
          fileUrl: fileUrl,
        },
      });
    } else {
      this.snackBar.open('Receipt attachment not found', 'Close', {
        duration: 3000,
      });
    }
  }

  deleteReceipt(receiptData: Receipt): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete this receipt?',
        title: 'Confirm Deletion',
      },
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap(() =>
        this.receiptsService.deleteReceipt(
          receiptData.booking_receipt_id,
          receiptData.floor_unit_id
        )
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackBar.open('Receipt deleted successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.agGrid.refreshData();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to delete receipt', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      }
    });
  }
}
