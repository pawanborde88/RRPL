import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
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
import { AddUploaedAttachmentComponent } from '../add-uploaed-attachment/add-uploaed-attachment.component';

@Component({
  selector: 'app-all-uploaded-attachment',
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
  templateUrl: './all-uploaded-attachment.component.html',
  styleUrl: './all-uploaded-attachment.component.scss',
})
export class AllUploadedAttachmentComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  allWingslist: any[] = []; // Initialize allWingslist as an empty array
  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  projectsList: any[] = []; // Initialize confiList as an empty array
  selectedBooking: any = null; // Change from selectedBookingId to selectedBooking
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
  ) { }
  ngOnInit(): void {
    this.fetchAllAttachments();
    this.unitSelectForm
      .get('project_id')
      ?.valueChanges.subscribe((projectId) => {
        if (projectId) {
          this.fetchAllWings(projectId);
        }
      });
  }

  unitSelectForm = new FormGroup({
    project_id: new FormControl('', Validators.required),
    wing_id: new FormControl('', Validators.required),
  });
  bookingBills = [
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
    { key: 'booking_date', label: 'Booking Date', type: 'short_date' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing Name' },
    { key: 'unit_no', label: 'Unit No' },
    { key: 'applicant_name', label: 'Client Name' },
    { key: 'applicant_mobile', label: 'Customer Mobile' },
    { key: 'applicant_email', label: 'Customer Email' },
    {
      key: 'attachment',
      label: 'Attachment',
      type: 'attachment',
      nullImage: 'assets/Images/null_image.png',
    },
    { key: 'sales_executive', label: 'Executive' },
    { key: 'source', label: 'Source' },
    { key: 'source_detail', label: 'Source Details' },
    { key: 'document_name', label: 'Document Name' },
    { key: 'days_since_booking', label: 'Days Since Booking' },
    {
      key: 'link_send_status',
      label: 'Link Send Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.link_send_status === 'Sent' ? 'green' : 'red',
    },
    {
      key: 'data_received_status',
      label: 'Data Received Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.data_received_status === 'Yes' ? 'green' : 'red',
    },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];



  bookingActions = [
    {
      action: 'editUploadedAttachment', // Must match what you check in onBookingAction
      icon: 'edit_note', // Material icon name
      tooltip: 'Edit File', // Tooltip text
      color: 'primary', // Optional button color
      disabled: false, // Optional disabled state
    },
  ];
  headerButtons = [

    {
      label: 'Add Attachment',
      icon: 'add_circle',
      color: 'primary',
      action: () => this.openAddBookingVisitorDialog(null),
      disabled: () => false,
      show: () => true,
    },
  ];
  openAddBookingVisitorDialog(row: any): void {
    const dialogRef = this.dialog.open(AddUploaedAttachmentComponent, {
      width: '50vw',
      data: { row },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }
  onBookingAction(action: string, row: any): void {
    if (action === 'editUploadedAttachment') {
      this.editUploadedAttachment(row);
    }

  }
  editUploadedAttachment(row: any): void {
    const dialogRef = this.dialog.open(AddUploaedAttachmentComponent, {
      width: '50vw',
      data: { row },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }
  fetchAllAttachments(): void {
    this.loading = true;

    const payload = {};

    this.http.post(`${this.baseUrl}/fetch_unit_attachment`, payload).subscribe({
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
  fetchAllProjects(): void {
    this.loading = true;

    const payload = {
      user_id: this.userId
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.projectsList = res;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllWings(projectID: any): void {
    this.http
      .post(`${this.baseUrl}/wing_dropdown`, { project_id: projectID })
      .subscribe({
        next: (res: any) => {
          this.allWingslist = res;
        },
        error: () => {
          this.snackBar.open('No units available for selection', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onselectedMeetingChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedBooking = booking;
      console.log('Selected booking:', this.selectedBooking);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedBooking &&
        this.selectedBooking.project_unit_attachment_id ===
        booking.project_unit_attachment_id
      ) {
        this.selectedBooking = null;
      }
    }
  }
}
