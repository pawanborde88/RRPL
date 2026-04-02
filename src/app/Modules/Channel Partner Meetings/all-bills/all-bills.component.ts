import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
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
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../Common/Reusable/reusable-table/reusable-table.component';

import { TemplateComponent } from '../../../Common/template/template.component';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../Service/fetch-functions.service';
import { AddbookingBillComponent } from '../addbooking-bill/addbooking-bill.component';

@Component({
  selector: 'app-all-bills',
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
  templateUrl: './all-bills.component.html',
  styleUrl: './all-bills.component.scss',
})
export class AllBillsComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  allWingslist: any[] = []; // Initialize allWingslist as an empty array
  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  confiList: any[] = []; // Initialize confiList as an empty array
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  searchText: string = '';
  pipe = new DatePipe('en-US');
  bookingID: number = 0;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private fetch: FetchFunctionsService
  ) {}
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.bookingID = params['booking_id'];
      this.fetchAllBookingBills(null);
      if (this.bookingID) {
        this.fetchAllBookingBills(this.bookingID);
      }
    });
  }
  applyFilter(searchText: string): void {
    this.searchText = searchText;
    this.fetchAllBookingBills(this.bookingID);
  }
  channelPartnerMeetingForm = new FormGroup({
    project_id: new FormControl([]),
    channel_partner_id: new FormControl([]), // Initialize as number array
    cp_executive_id: new FormControl([]),
    sales_executive_id: new FormControl([]),
  });
  bookingBills = [
 
    {
      key: 'sr_no',
      label: 'Sr. No',
      type: 'index',
    },
    { key: 'bill_date', label: 'Bill Date ', type: 'short_date' },
    { key: 'bill_no', label: 'Bill No' },

    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing Name' },
    { key: 'floor_unit', label: 'Unit No' },

    { key: 'applicant_name', label: 'Client Name' },
    {
      key: 'attachment',
      label: 'Attachment',
      type: 'attachment',
      nullImage: 'assets/Images/null_image.png',
    },
    { key: 'source', label: 'Source ' },
    { key: 'source_detail', label: 'Source Details' },

    { key: 'basic_bill_amount', label: 'Basic Amount' },
    { key: 'gst', label: 'GST (%)' },
    { key: 'total_bill', label: 'Total Amount' },

    { key: 'remark', label: 'Bill Remark' },
    {
      key: 'bill_status',
      label: 'Approved Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.bill_status_id === 1 ? 'green' : 'red',
    },
    {
      key: 'payment_status',
      label: 'Payment',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.payment_staus_id === 1 ? 'green' : 'red',
    },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];
  openAddBookingBillDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddbookingBillComponent, {
      width: '600px',
      data: {
        bookingID: this.bookingID, // Pass bookingID as part of the data
        editData: row, // Pass the row data when editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllBookingBills(this.bookingID);
      }
    });
  }

  onBookingAction(action: string, row: any): void {
    if (action === 'editChannelPartnerBooking') {
      this.openAddBookingBillDialog(row);
    }
  }

  bookingActions = [
    {
      action: 'editChannelPartnerBooking', // Must match what you check in onBookingAction
      icon: 'edit_note', // Material icon name
      tooltip: 'Edit Booking', // Tooltip text
      color: 'primary', // Optional button color
      disabled: false, // Optional disabled state
    },
  ];

  fetchAllBookingBills(bookingId: any): void {
    this.loading = true;

    const payload = {
      booking_id: bookingId ? bookingId : null,
    };

    this.http
      .post(`${this.baseUrl}/fetch_all_booking_bill`, payload)
      .subscribe({
        next: (res: any) => {
          this.dataSource = new MatTableDataSource(res);

          this.dataSource.data = res.data;
          this.loading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.loading = false;
          this.snackBar.open('Unable to fetch bookings.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  selectedBooking: any[] = []; // Change from selectedBookingId to selectedBooking

 
   onBookingSelectionChange(checked: boolean, row: any) {
    if (checked) {
      this.selectedBooking = row; // Changed from selectedBooking to selectedBooking
      console.log('Selected user:', this.selectedBooking);
    } else {
      if (this.selectedBooking && this.selectedBooking === row.booking_bill_id) {
        this.selectedBooking = [];
      }
    }
  }
}
