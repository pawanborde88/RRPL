import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { AddCPreportComponent } from '../../add-cpreport/add-cpreport.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
interface TableColumn {
  key: string;
  label: string;
  type?: string;
  sticky?: boolean;
  disabled?: boolean;
  clickable?: boolean;
  route?: (row: any) => any[];
  queryParams?: (row: any) => any;
  state?: (row: any) => any;
}

interface ActionItem {
  action: string;
  icon: string;
  tooltip: string;
  color: string;
  disabled: boolean;
}

interface HeaderButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}
@Component({
  selector: 'app-event-attendance-report',
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
  templateUrl: './event-attendance-report.component.html',
  styleUrl: './event-attendance-report.component.scss'
})
export class EventAttendanceReportComponent {
  baseUrl: string = environment.API_URL;
  storageUrl: string = environment.STORAGE_URL;
  loading: boolean = false;
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);
  searchText: string = '';

  roleId: number = Number(sessionStorage.getItem('role_id'));
  userId: number = Number(sessionStorage.getItem('session_id'));
  accountId: number = Number(sessionStorage.getItem('account_id'));
  allSourcingManagerDropdown: any[] = [];
  allDirectorDropdown: any[] = [];
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  projectsList: any[] = [];
  allChannelPartnerList: any[] = [];
  allEvents: any[] = [];

  eventFilterForm: FormGroup = new FormGroup({
    event_id: new FormControl(null),
  });

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



  channelPartnerActions: ActionItem[] = [
    {
      action: 'editCPTargetReport',
      icon: 'edit_note',
      tooltip: 'Edit Target Report',
      color: 'primary',
      disabled: false,
    },
  ];

  channelPartnerMeetingColumns: TableColumn[] = [
    { key: 'sr_no', label: 'Sr. No', type: 'index' },
    { key: 'event_title', label: 'Event Title' },
    { key: 'firm_name', label: 'Firm Name' },
    { key: 'firm_email', label: 'Firm Email' },
    { key: 'firm_phone', label: 'Firm Phone' },
    { key: 'cp_owner_name', label: 'CP Owner Name' },
    { key: 'cp_owner_email', label: 'CP Owner Email' },
    { key: 'cp_owner_phone', label: 'CP Owner Phone' },
    { key: 'event_date', label: 'Event Date' },
    { key: 'event_start_time', label: 'Start Time' },
    { key: 'event_end_time', label: 'End Time' },
    { key: 'event_venue', label: 'Venue' },
    { key: 'no_of_guest', label: 'Guests' },

    { key: 'created_at', label: 'Created At', type: 'date' },




  ];

  headerButtons: HeaderButton[] = [
    {
      label: 'Add Target ',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddCPReportDialog(),
      show: () => true,
    },
  ];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.fetchEvents();
    this.fetchAllProjects();
    this.fetchAllSourcingManagers();
    this.fetchAllDirectors();
  }

  onBookingAction(action: string, row: any): void {
    if (action === 'editCPTargetReport') {
      this.openAddCPReportDialog(row);
    }
  }

  fetchAllProjects(): void {
    this.loading = true;

    const payload = {
      user_id:  this.userId,
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
  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length <= 3) {
      this.allChannelPartnerList = [];
      return;
    }

    this.http.post(`${this.baseUrl}/channel_partner_dropdown`, {
      firm_name: trimmedSearch,
    }).subscribe({
      next: (res: any) => {
        this.allChannelPartnerList = (res || []).map((item: any) => ({
          ...item,
          full_name: `${item.firm_name} -(${item.cp_owner || '--'})`,
        }));
      },
      error: () => {
        this.snackBar.open('Unable to fetch channel partners.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  private fetchAllSourcingManagers(): void {
    this.http
      .post(`${this.baseUrl}/sourcing_manger_dropdown`, { role_id: [18] })
      .subscribe({
        next: (managers: any) =>
          (this.allSourcingManagerDropdown = managers || []),
        error: () => this.showSnackBar('Unable to fetch sourcing managers.'),
      });
  }

  openAddCPReportDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddCPreportComponent, {
      width: '600px',
      data: { row },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchCPTargetReport();
      }
    });
  }
  private fetchAllDirectors(): void {
    this.http
      .post(`${this.baseUrl}/director_dropdown`, { role_id: [8] })
      .subscribe({
        next: (directors: any) => (this.allDirectorDropdown = directors || []),
      });
  }

  fetchEvents(): void {
    const payload: any = {};
    if (this.accountId) {
      payload.account_id = this.accountId;
    }

    this.http.post(`${this.baseUrl}/fetch_event`, payload).subscribe({
      next: (res: any) => {
        let events: any[] = [];
        if (Array.isArray(res?.data)) {
          events = res.data;
        } else if (Array.isArray(res)) {
          events = res;
        } else if (res?.data) {
          events = [res.data];
        } else if (res) {
          events = [res];
        }

        this.allEvents = events.filter(Boolean);

        if (!this.eventFilterForm.get('event_id')?.value && this.allEvents.length) {
          this.eventFilterForm.get('event_id')?.setValue(this.allEvents[0]?.event_id);
          this.fetchCPTargetReport();
        }
      },
      error: () => {
        this.showSnackBar('Unable to fetch events.');
      },
    });
  }

  fetchCPTargetReport(): void {
    const eventId = this.eventFilterForm.get('event_id')?.value;
    if (!eventId) {
      this.showSnackBar('Please select an event.');
      // Clear dataSource when no event is selected
      this.dataSource = new MatTableDataSource<any>([]);
      return;
    }

    // Clear previous data immediately when event changes
    this.dataSource = new MatTableDataSource<any>([]);
    this.loading = true;
    const payload = {
      event_id: eventId,
    };

    this.http.post(`${this.baseUrl}/fetch_event_attendance`, payload).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res.data || []);
        // Reset paginator and sort if they exist
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching CP target report:', err);
        this.loading = false;
        this.showSnackBar(err.error.message);
        // Ensure dataSource is cleared on error
        this.dataSource = new MatTableDataSource<any>([]);
      },
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
    });
  }
}
