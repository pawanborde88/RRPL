import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { CancelTokenDialogComponent } from '../../../Site Visit/Toktens/cancel-token-dialog/cancel-token-dialog.component';
import { RefundTokenPaymentComponent } from '../../../Site Visit/Toktens/refund-token-payment/refund-token-payment.component';
import { AddNewMomMeetingDialogComponent } from '../../Add Meeting/add-new-mom-meeting-dialog/add-new-mom-meeting-dialog.component';
import { AttendMeetingDialogComponent } from '../../attend-meeting-dialog/attend-meeting-dialog.component';
interface Project {
  project_id: number;
  property_name: string;
  // Add other properties as needed
}
@Component({
  selector: 'app-all-mommeetings',
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
    ReusableTableComponent, // Add the pipe here
  ],
  templateUrl: './all-mommeetings.component.html',
  styleUrl: './all-mommeetings.component.scss'
})
export class AllMOMMeetingsComponent implements OnInit{
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  projectsList: any[] = [];
  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allFloorUnits: any[] = [];
  allTokenType: any[] = [];
  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  allSalesExecutive: any[] = [];
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}

  displayedColumns = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions', // Make sure this is set to 'actions'
      sticky: true, // boolean, not string
      disabled: false, // Should be false to show actions
    },
    {
      key: 'sr_no',
      label: 'Sr.no',
      type: 'index', // Add this to identify it as an index column
    },
    { key: 'project_name', label: 'Project' },

    { key: 'date', label: 'Date', type: 'short_date' },

    { key: 'day', label: 'Day' },
    { key: 'title', label: 'Title' },
    { key: 'attendee_names', label: 'Attendee Names' },
    { key: 'venue', label: 'Venue' },
   
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },

    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
  ];
  columnKeys: string[] = this.displayedColumns.map((col) => col.key); // ✅ Define it as a property
  cpTargetLoggedData: any;

  ngOnInit(): void {
    this.fetchCPTargetReport();
    this.fetchAllProjects();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  private readonly roleData = sessionStorage.getItem('role_id');

  private datePipe: DatePipe = new DatePipe('en-US');
  currentDate: Date = new Date();
  startOfMonth: Date = new Date(
    this.currentDate.getFullYear(),
    this.currentDate.getMonth(),
    1
  );

  endOfMonth: Date = new Date(
    this.currentDate.getFullYear(),
    this.currentDate.getMonth() + 1,
    0
  );
  permissionData = sessionStorage.getItem('permission');

  hasPermission(permission: string): boolean {
    return this.permissionData?.includes(permission) ?? false;
  }
  channelPartnerMeetingForm: FormGroup = new FormGroup({
    start_date: new FormControl(
      this.datePipe.transform(this.startOfMonth, 'yyyy-MM-dd')
    ),
     end_date: new FormControl(
      this.datePipe.transform(this.endOfMonth, 'yyyy-MM-dd')
    ),
    project_id: new FormControl<any[]>([], Validators.required),
   
   
  });


  tokenActions = [
    {
      action: 'deleteMeeting',
      icon: 'delete',
      tooltip: 'Delete Meeting',
      color: 'warn',
      show: () =>  this.hasPermission('603'),
    },
    {
      action: 'attendMeeting',
      icon: 'event_upcoming',
      tooltip: 'Attend Meeting',
      color: 'primary',
      show: () =>  this.hasPermission('605'),
    },



    {
      action: 'editMeeting',
      icon: 'receipt',
      tooltip: 'Edit Meeting',
      color: 'primary',
      show: () =>  this.hasPermission('604'),

    },
   
  ];

  headerButtons = [
    {
      label: 'Add Meeting',
      icon: 'groups_3',
      color: 'primary',
      action: () => this.openMeetingDialog(),
      disabled: () => false,
      show: () =>  this.hasPermission('601'),
    },
   
  ];
  onTokenAction(action: string, row: any): void {
    switch (action) {
      case 'editMeeting':
        this.openMeetingDialog(row);
        break;
      case 'deleteMeeting':
        this.deleteMeetings(row.meeting_id);
        break;
      case 'attendMeeting':
        this.attendMeeting(row.meeting_id);
        break;
    }
  }
  attendMeeting(meetingId: any): void {
    const dialogRef = this.dialog.open(AttendMeetingDialogComponent, {
      minWidth: '25vw',
      data: { meetingId },
    });
  }

  fetchAllProjects(): void {
    this.loading = true;
    const payload = {
      user_id:  this.userId,
    };

    this.http.post<Project[]>(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res) => {
        this.projectsList = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.loading = false;
        this.snackBar.open('Unable to fetch projects. Please try again later.', 'Close', {
          duration: 3000,
        });
        this.projectsList = [];
      },
    });
  }
  openMeetingDialog(meetingData?: any): void {
    const dialogRef = this.dialog.open(AddNewMomMeetingDialogComponent, {
      minWidth: '25vw',
      data: meetingData, // Pass the entire meeting object for edit, undefined for add
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchCPTargetReport(); // Refresh the list if meeting was saved
      }
    });
  }
  fetchCPTargetReport(): void {
    this.loading = true;
    const formValue = this.channelPartnerMeetingForm.value;

    const payload = {
      start_date: this.datePipe.transform(formValue.start_date, 'yyyy-MM-dd'),
      end_date: this.datePipe.transform(formValue.end_date, 'yyyy-MM-dd'),
      project_id: formValue.project_id && formValue.project_id.length > 0 ? formValue.project_id : null
    };

    this.http.post(`${this.baseUrl}/fetch_internal_meeting`, payload).subscribe({
      next: (res: any) => {
        if(res.success){
          this.loading = false;

          this.dataSource = new MatTableDataSource(res.data);
        }
      },
     
    });
  }

  deleteMeetings(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Meeting?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          meeting_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_internal_meeting`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.fetchCPTargetReport()
              this.snackBar.open('Meeting deleted successfully', 'Close', {
                duration: 3000,
              });
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Team.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
