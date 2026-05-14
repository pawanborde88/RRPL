import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table'; // Ensure to import MatTableDataSource
import { SopPreviewComponent } from '../sop-preview/sop-preview.component';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-soplist',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ReusableTableComponent, // Add the pipe here
  ],

  templateUrl: './all-soplist.component.html',
  styleUrls: ['./all-soplist.component.scss'],
})
export class AllSOPListComponent implements OnInit {
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
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
      label: '',
      type: 'index',
    },
    { key: 'title', label: 'Title', type: 'truncate' },
    { key: 'sop_detail', label: 'SOP Detail', type: 'truncate' },
    { key: 'sop_category', label: 'Category' },
    { key: 'team_name', label: 'Team' },
    { key: 'team_member_name', label: 'Team Member' },
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
    {
      key: 'started_at',
      label: 'Started At',
      type: 'date',
    },
    {
      key: 'ended_at',
      label: 'Ended At',
      type: 'date',
    },
  ];
  loading: boolean = false; // Initialize loading state

  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  userIdData: number | null =
     this.userId;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router,

    private fetch: FetchFunctionsService
  ) {}

  ngOnInit(): void {
    this.fetchAllSopList(); // Call the function on component initialization
  }
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit SOP',
      action: 'editEnquiry',
      disabled: () => false,

      color: 'primary',
    },
    {
      icon: 'history',
      tooltip: 'Execution History',
      action: 'executionHistory',
      color: 'primary',
    },
      {
      icon: 'ads_click',
      tooltip: 'Execute SOP',
      action: 'executeSOP',
      color: 'primary',
    },
    {
      icon: 'delete',
      tooltip: 'Delete SOP',
      action: 'deleteEnquiry',
      disabled: () => false,

      color: 'primary',
    },
  ];
 getLeadActions(action: string, row: any): void {
    switch (action) {
      case 'editEnquiry':
        this.router.navigate(['/add-editSOP', row.sop_detail_id]);
        break;
      case 'executionHistory':
        this.router.navigate(['/execution-history'], {
          queryParams: { data: row.sop_detail_id }
        });
        break;
              case 'executeSOP':
        this.openSOPsteps(row);
        break;
      case 'deleteEnquiry':
        this.deleteSop(row.sop_detail_id);
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }
headerButtons = [
  {
    label: 'Add SOP',
    icon: 'add_circle',
    color: 'primary',
    action: () => this.router.navigate(['/add-editSOP']),
    disabled: () => false,
  },
];
  fetchAllSopList(): void {
    this.loading = true; // Set loading to true before API call
    this.http
      .post(`${this.baseUrl}/fetch_sop_details`, { user_id: this.userIdData })
      .subscribe({
        next: (res: any) => {
          this.dataSource.data = res || []; // Populate dataSource with fetched data
          this.loading = false; // Set loading to false after successful response
        },
        error: (err: any) => {
          console.error(err);
          this.loading = false; // Set loading to false if an error occurs
          this.snackBar.open('Unable to fetch SOP details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  deleteSop(sopId: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this SOP?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          sop_detail_id: sopId,
        };
        this.http.post(`${this.baseUrl}/delete_sop`, requestPayload).subscribe({
          next: (data: any) => {
            console.log(data);
            this.snackBar.open('SOP deleted successfully', 'Close', {
              duration: 3000,
            });
            this.fetchAllSopList(); // Ensure this is called here to update the plans
          },
          error: (err: any) => {
            console.log(err);
            this.snackBar.open('Unable to Delete Records.', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }
  openSOPsteps(item: any) {
    this.dialog
      .open(SopPreviewComponent, {
        autoFocus: false,
        minWidth: '50vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
        data: { item },
      })
      .afterClosed()
      .subscribe((result: boolean) => {});
  }
}
