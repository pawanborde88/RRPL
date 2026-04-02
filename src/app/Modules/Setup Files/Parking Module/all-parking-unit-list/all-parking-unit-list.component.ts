import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { CommonService } from '../../../../Service/common/common.service';
import { AddFloorUnitsComponent } from '../../Floor Unit/add-floor-units/add-floor-units.component';
import { ChangeFloorUnitStatusComponent } from '../../Floor Unit/change-floor-unit-status/change-floor-unit-status.component';
import { ImportFloorUnitsComponent } from '../../Floor Unit/import-floor-units/import-floor-units.component';
import { UpdateFloorUnitComponent } from '../../Floor Unit/update-floor-unit/update-floor-unit.component';
import { AddNewParkingDialogComponent } from '../add-new-parking-dialog/add-new-parking-dialog.component';

@Component({
  selector: 'app-all-parking-unit-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    AutocompleteReusableComponent,
    ReactiveFormsModule,
    TruncatePipe,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-parking-unit-list.component.html',
  styleUrl: './all-parking-unit-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllParkingUnitListComponent {
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  projectsList: any[] = [];
  allWingslist: any[] = [];
  parkingStatusList: any[] = [];
  selectedFloorUnits: any[] = [];

  filterForm!: FormGroup;
  columnDefinitions: TableColumn[] = [

    { key: 'parking_plan_id', label: 'Parking Plan ID' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'parking_no', label: 'Parking No' },
    { key: 'parking_type', label: 'Parking Type' },
    { key: 'parking_level', label: 'Parking Level' },

    { key: 'updated_by', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },
  ];

  // ==================== VIEWCHILD ====================
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  headerButtons = [
    {
      label: 'Change Status',
      icon: 'delete', // Add appropriate icon
      color: 'primary',
      disabled: () => this.selectedFloorUnits.length === 0,
      action: () => this.updateFloorUnitStatus(),
      show: () => this.hasOnlyRoles([1, 2, 14]),
    },
    {
      label: 'Delete Parking Unit',
      icon: 'delete', // Add appropriate icon
      color: 'warn',
      disabled: () => this.selectedFloorUnits.length === 0,
      action: () => this.deleteFloorUnits(),
      show: () => this.hasOnlyRoles([1, 2]),

    },
    {
      label: 'Update Floor Unit',
      icon: 'update', // Add appropriate icon
      color: 'primary',
      disabled: () => false,
      action: () => this.updateImportFloorUnit(),
      show: () => this.hasOnlyRoles([1, 2]),

    },
    {
      label: 'Add Parking',
      icon: 'add_plus', // Add appropriate icon
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddnewParkingUnit(),
      show: () => this.hasOnlyRoles([1, 2]),

    },
    {
      label: 'Upload Floor Unit',
      icon: 'import_export', // Add appropriate icon
      color: 'primary',
      disabled: () => false,
      action: () => this.openImportFloorUnit(),
      show: () => this.hasOnlyRoles([1, 2]),


    },
    // {
    //   label: 'Add Floor Unit',
    //   icon: 'add', // Add appropriate icon
    //   color: 'primary',
    //   disabled: () => false,
    //   action: () => this.openAddEditFloorUnit('add'),
    //   show: () => this.hasOnlyRoles([1, 2]),

    // }
  ];
  getAgGridApiPayload(): any {
    if (!this.filterForm) {
      return {
        offset: 0,
        limit: 100,
        sortBy: 'created_at',
        sortOrder: 'desc' as const,
        search: '',
        filters: {},
      };
    }

    const formValue = this.filterForm.value;
    return {
      offset: 0,
      limit: 100,
      sortBy: 'created_at',
      sortOrder: 'desc' as const,
      search: '',
      filters: {
        project_id: formValue.project_id || null,
        wing_id: formValue.wing_id || null,
        booking_status_id: formValue.booking_status_id || null,
      },
    };
  }

  ngOnInit(): void {
    this.initializeForm();
    this.fetchAllProjects();
    this.fetchBookingStatus();
    this.setupFormListeners();
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      project_id: [null, Validators.required],
      wing_id: [null],
      parking_status_id: [null],
    });
  }

  setupFormListeners(): void {
    // When project changes, fetch wings and reset wing selection
    this.filterForm.get('project_id')?.valueChanges.subscribe((projectId) => {
      if (projectId) {
        this.allWingslist = [];
        this.filterForm.patchValue({ wing_id: null }, { emitEvent: false });
        this.fetchAllWings(projectId);
      } else {
        this.allWingslist = [];
        this.filterForm.patchValue({ wing_id: null }, { emitEvent: false });
      }
    });
  }

  fetchAllFloorUnits(clearFilters = false): void {
    if (clearFilters) {
      // Clear any preserved filters if needed
    }

    if (this.agGridTable) {
      this.agGridTable.refreshData();
    }
  }


  fetchAllProjects(): void {
    this.commonService.fetchUserProjectDropdown(this.userId).subscribe({
      next: (res: any) => {
        this.projectsList = res || [];
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.snackBar.open('Unable to fetch projects. Please try again later.', 'Close', {
          duration: 3000,
        });
        this.projectsList = [];
      },
    });
  }

  private readonly roleData = sessionStorage.getItem('role_id');

  hasOnlyRoles(allowedRoles: number[]): boolean {
    if (!this.roleData) return false;
    // Assume roleData is a comma-separated string of role ids, e.g. "1,2,3"
    const userRoles = this.roleData.split(',').map(role => Number(role.trim()));
    // Return true if the user has at least one of the allowed roles
    return userRoles.some(role => allowedRoles.includes(role));
  }

  fetchAllWings(selectedProjectId: number): void {
    this.commonService.fetchWingDropdown(selectedProjectId).subscribe({
      next: (res: any) => {
        this.allWingslist = res || [];
      },
      error: () => {
        this.snackBar.open('Unable to fetch wings.', 'Close', {
          duration: 3000,
        });
        this.allWingslist = [];
      },
    });
  }
  deleteFloorUnits(): void {
    if (this.selectedFloorUnits.length === 0) {
      this.snackBar.open('No Floor Units selected to delete.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: {
        message: 'Are you sure you want to delete selected Floor Units?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const floorUnitIds = this.selectedFloorUnits.map((unit) => unit.floor_unit_id);
        this.commonService.deleteFloorUnit(floorUnitIds).subscribe({
          next: () => {
            this.snackBar.open('Floor Units deleted successfully', 'Close', {
              duration: 3000,
            });
            this.selectedFloorUnits = [];
            // The ag-grid will automatically refresh when payload changes
          },
          error: () => {
            this.snackBar.open('Unable to delete Floor Units.', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  updateFloorUnitStatus(): void {
    if (this.selectedFloorUnits.length === 0) {
      this.snackBar.open('No Floor Units selected.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const dialogRef = this.dialog.open(ChangeFloorUnitStatusComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Change Floor Unit Status',
        rowData: this.selectedFloorUnits.map((unit) => unit.floor_unit_id),
      },
    });

    dialogRef.afterClosed().subscribe({
      next: (res: any) => {
        if (res) {
          // The ag-grid will automatically refresh when payload changes
        }
      },
      error: (err: any) => {
        console.error('Error updating floor unit status:', err);
        this.snackBar.open('An error occurred, please try later', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }



  openAddEditFloorUnit(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddFloorUnitsComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Floor Unit' : 'Edit Floor Unit',
        apiUrl: action === 'add' ? 'add_floor_unit' : 'edit_floor_unit',
        successMessage:
          action === 'add'
            ? 'Floor Unit added successfully'
            : 'Floor Unit updated successfully',
        rowData: row,
        for: 'floor-unit', // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Fetch updated floor units after the dialog closes
        if (row && row.project_id) {
        }
      }
    });
  }

  openImportFloorUnit() {
    let dialogRef = this.dialog.open(ImportFloorUnitsComponent, {
      width: '500px', // Adjust width as needed
      disableClose: true,

      data: {
        for: 'Parking-Unit',
        API_URL: `import_parking_plan`,
      },
    });

    dialogRef.afterClosed().subscribe({
      next: (res: any) => { },
      error: (err: any) => {
        console.error('Error uploading applicant:', err);
        this.snackBar.open('An error occurred, please try later', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }
  updateImportFloorUnit() {
    let dialogRef = this.dialog.open(UpdateFloorUnitComponent, {
      width: '500px', // Adjust width as needed
      disableClose: true,

    });

    dialogRef.afterClosed().subscribe({
      next: (res: any) => { },
      error: (err: any) => {
        console.error('Error uploading applicant:', err);
        this.snackBar.open('An error occurred, please try later', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }
  fetchBookingStatus(): void {
    this.commonService.fetchParkingStatus().subscribe({
      next: (res: any) => {
        this.parkingStatusList = res.data || [];
      },
      error: () => {
        this.snackBar.open('Unable to fetch booking status.', 'Close', {
          duration: 3000,
        });
        this.parkingStatusList = [];
      },
    });
  }

  onFloorUnitSelectionChange(checked: boolean, row: any): void {
    if (checked) {
      if (!this.selectedFloorUnits.find(unit => unit.floor_unit_id === row.floor_unit_id)) {
        this.selectedFloorUnits.push(row);
      }
    } else {
      this.selectedFloorUnits = this.selectedFloorUnits.filter(
        (unit) => unit.floor_unit_id !== row.floor_unit_id
      );
    }
  }
  openAddnewParkingUnit() {
    let dialogRef = this.dialog.open(AddNewParkingDialogComponent, {
      maxWidth: '100vh',

      disableClose: true,

    });

    dialogRef.afterClosed().subscribe({
      next: (res: any) => { },
      error: (err: any) => {
        console.error('Error uploading applicant:', err);
        this.snackBar.open('An error occurred, please try later', 'Close', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }
}
