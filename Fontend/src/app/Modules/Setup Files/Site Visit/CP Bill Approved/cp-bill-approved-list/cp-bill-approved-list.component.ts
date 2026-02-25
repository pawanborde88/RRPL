import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';

import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';

import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AuthService } from '../../../../../Service/auth.service';
import { CommonService } from '../../../../../Service/common/common.service';
import { ChangeApprovedStatusDialogComponent } from '../change-approved-status-dialog/change-approved-status-dialog.component';
import { ApprovalLevelDialogComponent } from '../approval-level-dialog/approval-level-dialog.component';
import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';

interface BookingBill {
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
  payment_staus_id: number;
  created_by_name: string;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-cp-bill-approved-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableTableComponent,
    TemplateComponent,
    BreadcrumbComponent,
    ConfigurableAgGridDataComponent,
    AutocompleteReusableComponent
  ],
  templateUrl: './cp-bill-approved-list.component.html',
  styleUrl: './cp-bill-approved-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe]
})
export class CpBillApprovedListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly roleId = Number(sessionStorage.getItem('role_id'));
  readonly userId = this.authService.userId();

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  private readonly formValues = signal<any>({});
  readonly selectedBooking = signal<any[]>([]);
  readonly currentStatus = signal<number | null>(3); // Default to Pending (3)

  bookingID = 0;

  readonly bookingForm = new FormGroup({
    project_id: new FormControl(null, Validators.required),
  });

  readonly bookingDisplayedColumns = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'created_at', label: 'Bill Date', type: 'mediumDate' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing Name' },
    { key: 'applicant_name', label: 'Client Name' },
    {
      key: 'attachment',
      label: 'Attachment',
      type: 'attachment',
      nullImage: 'assets/Images/null_image.png',
    },
    { key: 'approve_level', label: 'Approve Level' },
    { key: 'sales_executive', label: 'Executive' },
    { key: 'source', label: 'Source' },
    { key: 'source_detail', label: 'Source Details' },
    { key: 'bill_no', label: 'Bill No' },
    { key: 'basic_bill_amount', label: 'Basic Amount' },
    { key: 'gst', label: 'GST (%)' },
    { key: 'total_bill', label: 'Total Amount' },
    { key: 'remark', label: 'Bill Remark' },
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
        element.payment_staus_id === 1 ? 'green' : 'red',
    },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  readonly bookingActions = [
    {
      action: 'editBookingBill',
      icon: 'file_copy',
      tooltip: 'CP Invoice',
      color: 'primary',
      show: () => [1, 2, 4].includes(this.roleId)
    },
  ];

  readonly headerButtons = [
    {
      label: 'Level Approval',
      icon: 'stairs_2',
      color: 'primary',
      disabled: () => this.selectedBooking().length === 0,
      action: () => this.changeApprovalDialog(),
      show: () => true,
    },
    {
      label: 'Change Status',
      icon: 'update',
      color: 'primary',
      disabled: () => this.selectedBooking().length === 0,
      action: () => this.changeStatusDialog(),
      show: () => true,
    },
  ];

  // Computed signal for AG Grid payload
  readonly apiPayload = computed(() => {
    const values = this.formValues();
    const payload: any = {

      filters: {
        bill_status_id: this.currentStatus()
      }
    };

    if (values.project_id) {
      payload.filters.project_id = values.project_id;
    }

    return payload;
  });

  ngOnInit(): void {
    this.loadInitialData();
    this.route.params.subscribe((params) => {
      this.bookingID = params['booking_id'];
    });

    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValues());
  }

  private loadInitialData(): void {
    const userId = Number(sessionStorage.getItem('session_id')) || 0;
    this.commonService.fetchUserProjectDropdown(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) this.projectsList.set(res);
        },
        error: () => this.showError('Unable to fetch projects.')
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  fetchAllBookings(): void {
    this.updateFormValues();
    this.agGridTable?.refreshData();
  }

  private updateFormValues(): void {
    this.formValues.set(this.bookingForm.value);
  }

  onBookingSelectionChange(checked: boolean, booking: BookingBill): void {
    if (checked) {
      this.selectedBooking.set([booking]);
    } else {
      this.selectedBooking.set([]);
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    const tabIndex = event.index;
    switch (tabIndex) {
      case 0: this.currentStatus.set(3); break;
      case 1: this.currentStatus.set(1); break;
      case 2: this.currentStatus.set(2); break;
    }
    this.fetchAllBookings();
  }

  openAddBookingBillDialog(row?: BookingBill): void {
    const dialogRef = this.dialog.open(UnifiedDocumentDialogComponent, {
      minWidth: '700px',
      data: {
        dialogType: DocumentDialogType.CP_INVOICE,
        rowData: row,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.agGridTable?.refreshData();
      }
    });
  }

  onBookingAction(action: string, row: BookingBill): void {
    if (action === 'editBookingBill') {
      this.openAddBookingBillDialog(row);
    }
  }

  changeStatusDialog(): void {
    if (this.selectedBooking().length === 0) return;

    const dialogRef = this.dialog.open(ChangeApprovedStatusDialogComponent, {
      width: '500px',
      data: {
        currentStatus: this.selectedBooking()[0],
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.agGridTable?.refreshData();
      }
    });
  }

  changeApprovalDialog(): void {
    if (this.selectedBooking().length === 0) return;

    const dialogRef = this.dialog.open(ApprovalLevelDialogComponent, {
      width: '500px',
      data: {
        currentStatus: this.selectedBooking()[0],
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.agGridTable?.refreshData();
      }
    });
  }
}
