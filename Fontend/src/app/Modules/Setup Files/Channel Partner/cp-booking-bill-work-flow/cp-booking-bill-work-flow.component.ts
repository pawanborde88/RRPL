import { Component, ViewChild } from '@angular/core';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from 'express';
import { environment } from '../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AddCpBookingBillWorkFlowComponent } from '../add-cp-booking-bill-work-flow/add-cp-booking-bill-work-flow.component';

@Component({
  selector: 'app-cp-booking-bill-work-flow',
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
    
    ReusableTableComponent // Add the pipe here
  ],
  templateUrl: './cp-booking-bill-work-flow.component.html',
  styleUrl: './cp-booking-bill-work-flow.component.scss'
})
export class CpBookingBillWorkFlowComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
cpTargetLoggedData: any;

  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    
    private fetch: FetchFunctionsService
  ) {}

  displayedColumns = [
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
  
    {
      key: 'approval_level',
      label: 'Approval Level',
    },
 
    {
      key: 'role_name',
      label: 'Role Name',
    },
    
    {
      key: 'highest_status',
      label: 'Highest Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.is_highest === 1 ? 'green' : 'red',
    },

    {
      key: 'created_by_name',
      label: 'Created By',
    },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },
    {
      key: 'updated_by_name',
      label: 'Updated By',
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      type: 'date',
    }
  ];
  
  columnKeys: string[] = this.displayedColumns.map((col) => col.key); // ✅ Define it as a property

  ngOnInit(): void {
          this.cpTargetLoggedData = history.state.data;
    console.log('CP Target Logged Data:', this.cpTargetLoggedData);

    this.fetchApprovalLevelList();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchApprovalLevelList(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/fetch_approval_levels`).subscribe({
      next: (res: any) => {
                this.dataSource = new MatTableDataSource(res.data);

        this.dataSource.data = res.data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch channel partners.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  channelPartnerActions = [
    {
      action: 'editApprovalLevel', // Must match what you check in onBookingAction
      icon: 'edit_note', // Material icon name
      tooltip: 'Edit Level', // Tooltip text
      color: 'primary', // Optional button color
      disabled: false, // Optional disabled state
    },
    {
      action: 'deleteBooking',
      icon: 'delete',
      tooltip: 'Delete Level',
      color: 'warn',
      disabled: false,
    },
  ];
  headerButtons = [
    {
      label: 'Level Approval',
      icon: 'add_circle',
      color: 'primary',
      disabled:()=> false,
      action: () => this.changeApprovalDialog(),
      show: () => true,
    },
 


];
  getChannelPartneractions(action: string, row: any): void {
    if (action === 'deleteBooking') {
      this.deleteChannelPartner(row.approval_level_id);
    } 
    if (action === 'editApprovalLevel') {
      this.changeApprovalDialog(row);
    }
  }

  selectedBooking: any = null; // Change from selectedBookingId to selectedBooking

  onLeadSelectionChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedBooking = booking;
      console.log('Selected booking:', this.selectedBooking);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedBooking &&
        this.selectedBooking.channel_partner_id === booking.channel_partner_id
      ) {
        this.selectedBooking = null;
      }
    }
  }
  
  deleteChannelPartner(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Level?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          approval_level_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_approval_level`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Level deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchApprovalLevelList(); // Ensure this is called here to update the teams
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
  changeApprovalDialog(row?: any): void {
    console.log("changeApprovalDialog");
    const dialogRef = this.dialog.open(AddCpBookingBillWorkFlowComponent, {
      width: '500px',
      data: {
        row: row,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchApprovalLevelList();
      }
    });
  }
}
