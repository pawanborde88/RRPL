import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
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
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { CommonAddEditInsentiveDialogComponent } from '../../Insentive Slabs/common-add-edit-insentive-dialog/common-add-edit-insentive-dialog.component';
import { ImportFloorUnitsComponent } from '../../../Floor Unit/import-floor-units/import-floor-units.component';

@Component({
  selector: 'app-all-incentive-plans',
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
    ActionColumnComponent,
    ReusableTableComponent,

    TemplateComponent
    // Add the pipe here
  ],
  templateUrl: './all-incentive-plans.component.html',
  styleUrl: './all-incentive-plans.component.scss'
})
export class AllIncentivePlansComponent implements OnInit {

  selectedProjectId: any | null = null;
  selectedWingId: any | null = null;
  dataSource = new MatTableDataSource<any>([]);
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  storageUrl = environment.STORAGE_URL;
  selectedUsers: any[] = [];
  selectedUser: any[] = [];
  projectsList: any[] = [];
  allWingslist: any[] = []; // Initialize allWingslist as an empty array


  loading = false;
  baseUrl = environment.API_URL;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private router: Router,
  ) {}
  displayedColumns = [
  
    {
      key: 'sr_no',
      label: 'Sr. No',
      type: 'index',
    },
    { key: 'project_name', label: 'Project' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_unit', label: 'Floor Unit' },
    { key: 'total_incentive', label: 'Total Incentive' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },
  ];

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);
  selectedColumns = this.displayedColumns.map((col) => col.key); // Default select all columns
  projectActions = [
    {
      action: 'editIncentiveSlab',
      icon: 'edit',
      tooltip: 'Edit Incentive Slab',
      color: 'primary',
    },
    {
      action: 'deleteIncentiveSlab',
      icon: 'delete',
      tooltip: 'Delete Incentive Slab',
      color: 'warn',
      show: () => [1, 2, 4].includes(this.roleId) // Only show for specific roles
    },
  ];
  onColumnSelectionChange() {
    // Update columnKeys based on selected columns
    this.columnKeys = this.selectedColumns;
  }
  headerButtons = [
    {
      label: '  Incentive Slabs',
      icon: 'view_timeline',
      color: 'primary',
      disabled: () => false,
      action: () => this.router.navigate(['/target-achievement/incentive-slabs/all-insentive-slabs']),
      show: () => true,
    },
    {
      label: '  Role Wise Incentives',
      icon: 'view_timeline',
      color: 'primary',
      disabled: () => false,
      action: () => this.router.navigate(['/target-achievement/rolewise-insentives/all-role-wise-insentives']),
      show: () => true,
    },
    {
      label: '  Import Incentive Plans',
      icon: 'view_timeline',
      color: 'primary',
      disabled: () => false,
      action: () => this.ImportInsentivePlans(),
      show: () => true,

    },


    
 
  ];
  ngOnInit(): void {
    this.fetchAllProjects();
    if(this.selectedProjectId) {
      this.fetchAllIncentiveSlabs();
    }
  }
  onProjectChange(event: any): void {
      this.selectedProjectId = event;
      this.selectedWingId = null; // Reset wing selection when project changes
    this.fetchAllWings(this.selectedProjectId);
    // Don't fetch incentive slabs here - wait for wing selection
  }
  onWingChange(event: any): void {
    this.selectedWingId = event;
    this.fetchAllIncentiveSlabs();
  }
  fetchAllProjects(): void {
    this.loading = true;
    this.http.post<any>(`${this.baseUrl}/user_project_dropdown`, { user_id:  this.userId }).subscribe({
      next: (res:any) => {
        this.projectsList = res || [];
        this.loading = false;
      },
    });
  }
  fetchAllWings(selectedProjectId: number | null | undefined): void {
    if (!selectedProjectId) {
      this.allWingslist = [];
      this.selectedWingId = null; // Clear wing selection
      return;
    }
    this.loading = true;
    this.http
      .post(`${this.baseUrl}/wing_dropdown`, { project_id: Number(selectedProjectId) })
      .subscribe({
        next: (res: any) => {
          this.allWingslist = res || []; // Store wings list
          this.loading = false;
          this.selectedWingId = null; // Reset wing selection when wings are fetched
          // Fetch incentive plans after wings are loaded (with no wing filter initially)
          this.fetchAllIncentiveSlabs();
        },
        error: () => {
          this.loading = false;
          this.allWingslist = [];
          this.selectedWingId = null;
          this.snackBar.open('Unable to fetch wings.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
 
  onProjectAction(action: string, row: any): void {
    switch (action) {
 
      case 'deleteIncentiveSlab':
        this.deleteSources(row.incentive_slab_id);
        break;
      default:
        break;
    }
  }
  ImportInsentivePlans() {
    let dialogRef = this.dialog.open(ImportFloorUnitsComponent, {
      width: '500px', // Adjust width as needed
      disableClose: true,
      data: {
        for: 'incentivePlanImport',
        API_URL:`import_incentive_plan`,
      }, 
    });

    dialogRef.afterClosed().subscribe({
      next: (res: any) => {
        console.log('Import completed:', res);
      },
      error: (err: any) => {
        console.error('Error uploading applicant:', err);
        this.snackBar.open('An error occurred, please try later', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  deleteSources(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
        data: { message: 'Are you sure you want to delete incentive slab?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          incentive_slabe_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_incentive_slab`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open(data.message, 'Close', {
                duration: 3000,
              });
              this.fetchAllIncentiveSlabs(); // Ensure this is called here to update the teams
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
  fetchAllIncentiveSlabs(): void {
    if (!this.selectedProjectId) {
      this.dataSource = new MatTableDataSource<any>([]);
      return;
    }
    this.loading = true;
    const requestPayload: any = { 
      project_id: Number(this.selectedProjectId) 
    };
    if (this.selectedWingId) {
      requestPayload.wing_id = Number(this.selectedWingId);
    }
    this.http.post(`${this.baseUrl}/fetch_incentive_plans`, requestPayload).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res.data || []);
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch incentive plans.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  bookingActions = [
    {
      action: 'deleteIncentiveSlab',
      icon: 'delete',
      tooltip: 'Delete Incentive Slab',
      color: 'warn',
      show: () => [1, 2, 4].includes(this.roleId) // Only show for specific roles
    },
  ];



}
