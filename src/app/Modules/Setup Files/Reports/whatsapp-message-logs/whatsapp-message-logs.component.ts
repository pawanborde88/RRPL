import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';

@Component({
  selector: 'app-whatsapp-message-logs',
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
  ],
  templateUrl: './whatsapp-message-logs.component.html',
  styleUrl: './whatsapp-message-logs.component.scss'
})
export class WhatsappMessageLogsComponent implements AfterViewInit {
  baseUrl = environment.API_URL;
  loading: boolean = false;

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  displayedColumns = [
    { key: 'project', label: 'Project' },
    { key: 'receiver_mobile', label: 'Receiver Mobile' },
    { key: 'integration_mobile', label: 'Integration Mobile' },
    { key: 'sending_by', label: 'Sending By' },
    { key: 'message', label: 'Message' },
    { key: 'group', label: 'Group' },
    { key: 'status', label: 'Status' },
    { key: 'status_msg', label: 'Status Message' },
    { key: 'message_group', label: 'Message Group' },
    { key: 'sent_status', label: 'Sent Status' },
    { key: 'sending_on', label: 'Sending On' },
    { key: 'delivered_status', label: 'Delivered Status' },
    { key: 'delivered_on', label: 'Delivered On' },
    { key: 'read_status', label: 'Read Status' },
    { key: 'read_on', label: 'Read On' },
    { key: 'message_id', label: 'Message ID' },
    { key: 'channel_name', label: 'Channel Name' },
    { key: 'integration_group', label: 'Integration Group' },
    { key: 'file', label: 'File' },
    { key: 'caption', label: 'Caption' },
    { key: 'size', label: 'Size' },
    { key: 'created_on', label: 'Created On' }
  ];
  columnKeys: string[] = this.displayedColumns.map((col) => col.key);

  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}

  ngAfterViewInit(): void {
    this.fetchMessageLogs();
  }

  fetchMessageLogs() {
    this.loading = true;
    
    // Dummy static data for now (replace with API call)
    const mockData = [
      {
        project: 'Godrej Group',
        receiver_mobile: '+91-1234567890',
        integration_mobile: '0123-4567',
        sending_by: 'Anol Chile',
        message: 'Dear MARK R CLAUDEL,\nThank you for inquiring about our project...',
        group: 'Inquiry',
        status: 'Success',
        status_msg: 'WhatsApp message successfully sent',
        message_group: 'Message',
        sent_status: 'No',
        sending_on: '',
        delivered_status: 'No',
        delivered_on: '',
        read_status: 'No',
        read_on: '',
        message_id: 'BA345HCBCFTY997',
        channel_name: 'Anol_Chile_BPOS_01',
        integration_group: 'PreSales',
        file: '',
        caption: '',
        size: '',
        created_on: '09/01/2024 6:37 PM'
      },
      {
        project: 'Godrej Group',
        receiver_mobile: '+91-9876543210',
        integration_mobile: '0456-7890',
        sending_by: 'Rohit Sharma',
        message: 'Dear JOHN DOE,\nWe appreciate your interest in our project...',
        group: 'Inquiry',
        status: 'Failed',
        status_msg: 'Message not delivered',
        message_group: 'Follow-up',
        sent_status: 'Yes',
        sending_on: '09/02/2024 10:15 AM',
        delivered_status: 'No',
        delivered_on: '',
        read_status: 'No',
        read_on: '',
        message_id: 'BA5621XYZ1234',
        channel_name: 'Rohit_BPOS_02',
        integration_group: 'Sales',
        file: 'brochure.pdf',
        caption: 'Project Brochure',
        size: '2.1MB',
        created_on: '09/02/2024 10:30 AM'
      },
      {
        project: 'DLF Limited',
        receiver_mobile: '+91-7894561230',
        integration_mobile: '0987-6543',
        sending_by: 'Neha Kapoor',
        message: 'Dear ALEX SMITH,\nCheck out our latest property offers...',
        group: 'Promotion',
        status: 'Success',
        status_msg: 'Message delivered',
        message_group: 'Broadcast',
        sent_status: 'Yes',
        sending_on: '09/03/2024 12:00 PM',
        delivered_status: 'Yes',
        delivered_on: '09/03/2024 12:05 PM',
        read_status: 'Yes',
        read_on: '09/03/2024 12:10 PM',
        message_id: 'BA789ABC5678',
        channel_name: 'Neha_Sales_03',
        integration_group: 'Marketing',
        file: 'flyer.jpg',
        caption: 'Exciting Offers!',
        size: '500KB',
        created_on: '09/03/2024 12:15 PM'
      },
      {
        project: 'Tata Housing',
        receiver_mobile: '+91-7418529630',
        integration_mobile: '0321-6548',
        sending_by: 'Amit Jain',
        message: 'Dear PETER PARKER,\nNew projects launching soon!',
        group: 'Announcement',
        status: 'Success',
        status_msg: 'Message sent successfully',
        message_group: 'Marketing',
        sent_status: 'Yes',
        sending_on: '09/04/2024 03:45 PM',
        delivered_status: 'Yes',
        delivered_on: '09/04/2024 03:50 PM',
        read_status: 'No',
        read_on: '',
        message_id: 'BA963ZYX4321',
        channel_name: 'Amit_Marketing_04',
        integration_group: 'Business',
        file: '',
        caption: '',
        size: '',
        created_on: '09/04/2024 04:00 PM'
      },
      {
        project: 'Mahindra Lifespaces',
        receiver_mobile: '+91-8523697410',
        integration_mobile: '0765-1234',
        sending_by: 'Sneha Verma',
        message: 'Dear JANE DOE,\nExclusive deals just for you!',
        group: 'Sales',
        status: 'Pending',
        status_msg: 'Awaiting delivery',
        message_group: 'Lead Generation',
        sent_status: 'Yes',
        sending_on: '09/05/2024 05:10 PM',
        delivered_status: 'No',
        delivered_on: '',
        read_status: 'No',
        read_on: '',
        message_id: 'BA456MNO7890',
        channel_name: 'Sneha_Sales_05',
        integration_group: 'PreSales',
        file: 'offer.pdf',
        caption: 'Special Discount!',
        size: '1.2MB',
        created_on: '09/05/2024 05:20 PM'
      },
      {
        project: 'Lodha Group',
        receiver_mobile: '+91-1237894560',
        integration_mobile: '0456-9874',
        sending_by: 'Rajesh Kumar',
        message: 'Dear LUCAS JONES,\nWe are here to assist you with your dream home...',
        group: 'Customer Support',
        status: 'Failed',
        status_msg: 'User blocked messages',
        message_group: 'Support',
        sent_status: 'Yes',
        sending_on: '09/06/2024 09:00 AM',
        delivered_status: 'No',
        delivered_on: '',
        read_status: 'No',
        read_on: '',
        message_id: 'BA987LMN3214',
        channel_name: 'Rajesh_Support_06',
        integration_group: 'Customer Care',
        file: '',
        caption: '',
        size: '',
        created_on: '09/06/2024 09:15 AM'
      },
      {
        project: 'Hiranandani Developers',
        receiver_mobile: '+91-9873216540',
        integration_mobile: '0654-7896',
        sending_by: 'Priya Sharma',
        message: 'Dear SAM WILSON,\nLuxury living redefined!',
        group: 'Marketing',
        status: 'Success',
        status_msg: 'Message seen',
        message_group: 'Brand Awareness',
        sent_status: 'Yes',
        sending_on: '09/07/2024 02:30 PM',
        delivered_status: 'Yes',
        delivered_on: '09/07/2024 02:35 PM',
        read_status: 'Yes',
        read_on: '09/07/2024 02:40 PM',
        message_id: 'BA654PQR8521',
        channel_name: 'Priya_Brand_07',
        integration_group: 'Marketing',
        file: 'video.mp4',
        caption: 'Watch Now!',
        size: '10MB',
        created_on: '09/07/2024 02:45 PM'
      },
      {
        project: 'Sobha Limited',
        receiver_mobile: '+91-7419638520',
        integration_mobile: '0451-2365',
        sending_by: 'Vikram Mehta',
        message: 'Dear TONY STARK,\nSmart homes for a smart future...',
        group: 'Innovation',
        status: 'Success',
        status_msg: 'Message delivered',
        message_group: 'Technology Updates',
        sent_status: 'Yes',
        sending_on: '09/08/2024 11:00 AM',
        delivered_status: 'Yes',
        delivered_on: '09/08/2024 11:05 AM',
        read_status: 'Yes',
        read_on: '09/08/2024 11:10 AM',
        message_id: 'BA741XYZ9635',
        channel_name: 'Vikram_Tech_08',
        integration_group: 'R&D',
        file: 'brochure.pdf',
        caption: 'Future Ready Homes',
        size: '3.5MB',
        created_on: '09/08/2024 11:20 AM'
      }
    ];
    
    this.dataSource.data = mockData;
    this.loading = false;

    // Attach paginator and sort after setting data
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}