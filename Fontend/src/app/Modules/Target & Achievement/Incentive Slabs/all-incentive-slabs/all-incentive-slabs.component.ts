import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';

import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { AddIncentiveSlabsDialogComponent } from '../add-incentive-slabs-dialog/add-incentive-slabs-dialog.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { MatCardModule } from '@angular/material/card';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-all-incentive-slabs',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReusableTableComponent,
    AngularMaterialModule,
    MatCardModule,
    BreadcrumbComponent,
    TemplateComponent,
    AutocompleteReusableComponent
  ],
  templateUrl: './all-incentive-slabs.component.html',
  styleUrl: './all-incentive-slabs.component.scss'
})
export class AllIncentiveSlabsComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  storageUrl = environment.STORAGE_URL;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  selectedfacebookSetupID: any = null; // Change from selectedBookingId to selectedBooking

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatSort) sort!: MatSort;
  searchText: string = '';
  pipe = new DatePipe('en-US');
  projectsList: any[] = [];
  selectedProjectId: any | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) { }
  bookingBills = [
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
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing Name' },

    { key: 'percentage_from', label: '% From' },
    { key: 'percentage_to', label: '% To' },
    { key: 'incentive_percentage', label: 'Incentive %' },


    {
      key: 'created_by_name',
      label: 'Created By',
    },
    {
      key: 'updated_by',
      label: 'Updated By',
    },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      type: 'date',
    },
  ];
  headerButtons = [

    {
      label: ' Add Incentive Slab',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openaddFacebookDialog(),
      show: () => this.selectedProjectId
    },
  ];
  ngOnInit(): void {
    this.fetchAllProjects();
  }
  onProjectChange(projectId: number): void {
    if (projectId !== null && projectId !== undefined) {
      this.selectedProjectId = projectId;
      this.fetchAllFaceBookList(this.selectedProjectId);


    }
  }

  fetchAllProjects(): void {
    this.loading = true;
    const payload = {
      user_id: this.userId,
    };

    this.http.post<any>(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
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
  fetchAllFaceBookList(projectId: number): void {
    this.loading = true;

    this.http.post(`${this.baseUrl}/fetch_incentive_slabs`, { project_id: projectId }).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res.data);

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
  openaddFacebookDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddIncentiveSlabsDialogComponent, {
      width: '600px',

      data: {
        project_id: this.selectedProjectId,
        editData: row,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllFaceBookList(this.selectedProjectId);
      }
    });
  }

  onBookingAction(action: string, row: any): void {
    if (action === 'editChannelPartnerBooking') {
      this.openaddFacebookDialog(row);
    } else if (action === 'deleteFacebookID') {
      this.deleteFaceBookID(row.incentive_slabe_id);
    }
  }

  deleteFaceBookID(projectEnquiryID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Incentive Slab?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const reason = result.reason; // Get the reason from the dialog response

        let requestPayload = {
          incentive_slabe_id: projectEnquiryID,
          reason: reason, // Set the reason from the dialog
          created_by: this.userId, // Set created_by value here
        };

        this.http
          .post(`${this.baseUrl}/delete_incentive_slab`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Facebook deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllFaceBookList(this.selectedProjectId); // Ensure this is called here to update the teams
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
  bookingActions = [
    {
      action: 'editChannelPartnerBooking', // Must match what you check in onBookingAction
      icon: 'edit_note', // Material icon name
      tooltip: 'Edit Incentive Slab', // Tooltip text
      color: 'primary', // Optional button color
      disabled: false, // Optional disabled state
    },
    {
      action: 'deleteFacebookID', // Must match what you check in onBookingAction
      icon: 'delete', // Material icon name
      tooltip: 'Delete Incentive Slab ', // Tooltip text
      color: 'warn', // Optional button color
      disabled: false, // Optional disabled state
    },
  ];
  onselectedMeetingChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedfacebookSetupID = booking;
      console.log('Selected booking:', this.selectedfacebookSetupID);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedfacebookSetupID &&
        this.selectedfacebookSetupID.incentive_slabe_id ===
        booking.incentive_slabe_id
      ) {
        this.selectedfacebookSetupID = null;
      }
    }
  }
}
