import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddbookingBillComponent } from '../../../../Channel Partner Meetings/addbooking-bill/addbooking-bill.component';
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

interface LoadingState {
  pending: boolean;
  approved: boolean;
  rejected: boolean;
}
@Component({
  selector: 'app-cp-bill-approved-list',
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
  templateUrl: './cp-bill-approved-list.component.html',
  styleUrl: './cp-bill-approved-list.component.scss',
})
export class CpBillApprovedListComponent {
  baseUrl = environment.API_URL;
  storageUrl = environment.STORAGE_URL;

  loading: LoadingState = {
    pending: false,
    approved: false,
    rejected: false,
  };

  pendingDataSource = new MatTableDataSource<BookingBill>();
  approvedDataSource = new MatTableDataSource<BookingBill>();
  rejectedDataSource = new MatTableDataSource<BookingBill>();

  selectedBooking: any[] = [];
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  bookingID = 0;
  searchText = '';
  pipe = new DatePipe('en-US');
  // Add these properties to your component class
  pendingCount: number = 0;
  approvedCount: number = 0;
  rejectedCount: number = 0;
  @ViewChild('pendingPaginator') pendingPaginator!: MatPaginator;
  @ViewChild('approvedPaginator') approvedPaginator!: MatPaginator;
  @ViewChild('rejectedPaginator') rejectedPaginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  channelPartnerMeetingForm = new FormGroup({
    project_id: new FormControl<number[]>([]),
    channel_partner_id: new FormControl<number[]>([]),
    cp_executive_id: new FormControl<number[]>([]),
    sales_executive_id: new FormControl<number[]>([]),
  });

  bookingBillsColumns = [
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'sr_no',
      label: 'Sr. No',
      type: 'index',
    },
    { key: 'bill_date', label: 'Bill Date', type: 'short_date' },
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

  bookingActions = [
    {
      action: 'editBookingBill',
      icon: 'file_copy',
      tooltip: 'CP Invoice',
      color: 'primary',
      show: () => [1, 2, 4].includes(this.roleId) // Only show for specific roles

    },
  ];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private fetch: FetchFunctionsService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.bookingID = params['booking_id'];
      this.fetchAllBookingBills(this.bookingID);
    });
  }

  applyFilter(searchText: string, type: keyof LoadingState): void {
    this.searchText = searchText;
    this.fetchBillsByStatus(
      type === 'pending' ? 3 : type === 'approved' ? 1 : 2,
      type,
      this.bookingID
    );
  }

  fetchAllBookingBills(bookingId?: number): void {
    this.fetchBillsByStatus(3, 'pending', bookingId);
    this.fetchBillsByStatus(1, 'approved', bookingId);
    this.fetchBillsByStatus(2, 'rejected', bookingId);
  }

  fetchBillsByStatus(
    status: number,
    type: keyof LoadingState,
    bookingId?: number
  ): void {
    this.loading[type] = true;

    const payload = {
      booking_id: bookingId || null,
      bill_status_id: status,
    };

    this.http
      .post<{ success: boolean; data: BookingBill[] }>(
        `${this.baseUrl}/fetch_all_booking_bill`,
        payload
      )
      .subscribe({
        next: (res: any) => {
          // Handle both response structures: { success: true, data: [...] } or direct array
          let data: BookingBill[] = [];
          if (Array.isArray(res)) {
            data = res;
          } else if (res?.data && Array.isArray(res.data)) {
            data = res.data;
          } else if (res?.data) {
            data = Array.isArray(res.data) ? res.data : [];
          }

          // Create new MatTableDataSource instance to trigger change detection in reusable table
          // The reusable table uses OnPush change detection, so we need a new reference
          switch (type) {
            case 'pending':
              this.pendingDataSource = new MatTableDataSource<BookingBill>(data);
              this.pendingCount = data.length;
              setTimeout(
                () => (this.pendingDataSource.paginator = this.pendingPaginator)
              );
              break;
            case 'approved':
              this.approvedDataSource = new MatTableDataSource<BookingBill>(data);
              this.approvedCount = data.length;
              setTimeout(
                () =>
                  (this.approvedDataSource.paginator = this.approvedPaginator)
              );
              break;
            case 'rejected':
              this.rejectedDataSource = new MatTableDataSource<BookingBill>(data);
              this.rejectedCount = data.length;
              setTimeout(
                () =>
                  (this.rejectedDataSource.paginator = this.rejectedPaginator)
              );
              break;
          }
          this.loading[type] = false;
        },
        error: (err) => {
          console.error(err);
          this.loading[type] = false;
          this.snackBar.open(`Unable to fetch ${type} bills.`, 'Close', {
            duration: 3000,
          });
        },
      });
  }

  headerButtons = [
    {
      label: 'Level Approval',
      icon: 'stairs_2',
      color: 'primary',
      disabled: () => false,
      action: () => this.changeApprovalDialog(),
      show: () => true,
    },
    {
      label: 'Change Status',
      icon: 'update',
      color: 'primary',
      disabled: () => false,
      action: () => this.changeStatusDialog(),
      show: () => true,
    },

  ];
  openAddBookingBillDialog(row?: BookingBill): void {
    const dialogRef = this.dialog.open(UnifiedDocumentDialogComponent, {
      minWidth: '700px',
      data: {
        dialogType: DocumentDialogType.CP_INVOICE,
        rowData: row,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllBookingBills(this.bookingID);
      }
    });
  }

  onBookingAction(action: string, row: BookingBill): void {
    if (action === 'editBookingBill') {
      this.openAddBookingBillDialog(row);
    }
  }

  onSelectedBookingChange(checked: boolean, booking: BookingBill): void {
    if (checked) {
      this.selectedBooking[0] = booking;
    } else if (
      this.selectedBooking[0].booking_bill_id === booking.booking_bill_id
    ) {
      this.selectedBooking[0] = null;
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    // Index 0 = Pending, 1 = Approved, 2 = Rejected
    const tabIndex = event.index;

    switch (tabIndex) {
      case 0:
        this.fetchBillsByStatus(3, 'pending', this.bookingID);
        break;
      case 1:
        this.fetchBillsByStatus(1, 'approved', this.bookingID);
        break;
      case 2:
        this.fetchBillsByStatus(2, 'rejected', this.bookingID);
        break;
    }
  }

  changeStatusDialog(): void {
    if (!this.selectedBooking) return;

    const dialogRef = this.dialog.open(ChangeApprovedStatusDialogComponent, {
      width: '500px',
      data: {
        currentStatus: this.selectedBooking[0], // assuming your booking has a status property
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }

  changeApprovalDialog(): void {
    if (!this.selectedBooking) return;

    const dialogRef = this.dialog.open(ApprovalLevelDialogComponent, {
      width: '500px',
      data: {
        currentStatus: this.selectedBooking[0], // assuming your booking has a status property
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }
}
