import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AddFloorUnitsComponent } from '../add-floor-units/add-floor-units.component';
import { ImportFloorUnitsComponent } from '../import-floor-units/import-floor-units.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { UpdateFloorUnitComponent } from '../update-floor-unit/update-floor-unit.component';
import { ChangeFloorUnitStatusComponent } from '../change-floor-unit-status/change-floor-unit-status.component';
import { CommonService } from '../../../../Service/common/common.service';
import { TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { AuthService } from '../../../../Service/auth.service';
interface BookingAction {
  action: string;
  icon: string;
  tooltip: string;
  color?: string;
  disabled?: boolean;
  show: () => boolean;
}
@Component({
  selector: 'app-all-floor-units',
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
  templateUrl: './all-floor-units.component.html',
  styleUrl: './all-floor-units.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class AllFloorUnitsComponent implements OnInit {
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  projectsList: any[] = [];
  allWingslist: any[] = [];
  bookingStatusList: any[] = [];
  selectedFloorUnits: any[] = [];

  filterForm!: FormGroup;
  columnDefinitions: TableColumn[] = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'floor_unit_id', label: 'Floor Unit ID' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_id', label: 'Floor No' },
    { key: 'floor_order', label: 'Floor Order' },
    { key: 'flat_type', label: 'Flat Type' },
    { key: 'unit_type', label: 'Unit Type' },
    { key: 'floor_unit', label: 'Flat No' },
    { key: 'flat_order', label: 'Flat Order' },
    { key: 'carpet_sqft', label: 'Carpet Sqft' },
    { key: 'carpet_sqm', label: 'Carpet Sqm' },
    { key: 'balcony_sqft', label: 'Balcony Sqft' },
    { key: 'balcony_sqm', label: 'Balcony Sqm' },
    { key: 'enclosed_balcony_sqft', label: 'Enclosed Balcony Sqft' },
    { key: 'enclosed_balcony_sqm', label: 'Enclosed Balcony Sqm' },
    { key: 'dry_balcony_sqft', label: 'Dry Balcony Sqft' },
    { key: 'dry_balcony_sqm', label: 'Dry Balcony Sqm' },
    { key: 'terrace_sqft', label: 'Terrace Sqft' },
    { key: 'terrace_sqm', label: 'Terrace Sqm' },
    { key: 'garden_sqft', label: 'Garden Sqft' },
    { key: 'garden_sqm', label: 'Garden Sqm' },
    { key: 'mezzanine_sqft', label: 'Mezzanine Sqft' },
    { key: 'mezzanine_sqm', label: 'Mezzanine Sqm' },
    { key: 'loft_area_sqft', label: 'Loft Area Sqft' },
    { key: 'loft_area_sqm', label: 'Loft Area Sqm' },
    { key: 'sitout_area_sqft', label: 'Sitout Area Sqft' },
    { key: 'sitout_area_sqm', label: 'Sitout Area Sqm' },
    { key: 'udf1_area_sqft', label: 'UDF1 Area Sqft' },
    { key: 'udf1_area_sqm', label: 'UDF1 Area Sqm' },
    { key: 'udf2_area_sqft', label: 'UDF2 Area Sqft' },
    { key: 'udf2_area_sqm', label: 'UDF2 Area Sqm' },
    { key: 'udf3_area_sqft', label: 'UDF3 Area Sqft' },
    { key: 'udf3_area_sqm', label: 'UDF3 Area Sqm' },
    { key: 'udf4_area_sqft', label: 'UDF4 Area Sqft' },
    { key: 'udf4_area_sqm', label: 'UDF4 Area Sqm' },
    { key: 'udf5_area_sqft', label: 'UDF5 Area Sqft' },
    { key: 'udf5_area_sqm', label: 'UDF5 Area Sqm' },
    { key: 'total_carpet_area_sqft', label: 'Total Carpet Area Sqft' },
    { key: 'total_carpet_area_sqm', label: 'Total Carpet Area Sqm' },
    { key: 'unit_id', label: 'Unit ID' },
    { key: 'rate', label: 'Rate', isAmount: true },
    { key: 'idc', label: 'IDC', isAmount: true },
    { key: 'agreement_cost', label: 'Agreement Cost', isAmount: true },
    { key: 'market_value', label: 'Market Value', isAmount: true },
    { key: 'gst_percent', label: 'GST Percent' },
    { key: 'gst', label: 'GST', isAmount: true },
    { key: 'stamp_duty_percent', label: 'Stamp Duty Percent' },
    { key: 'stamp_duty', label: 'Stamp Duty', isAmount: true },
    { key: 'registration_percent', label: 'Registration Percent' },
    { key: 'registration', label: 'Registration', isAmount: true },
    { key: 'society_formation_charges', label: 'Society Formation Charges', isAmount: true },
    { key: 'legal_charges', label: 'Legal Charges', isAmount: true },
    { key: 'maintenance_charges', label: 'Maintenance Charges', isAmount: true },
    { key: 'corpus_fund', label: 'Corpus Fund', isAmount: true },
    { key: 'other_charges', label: 'Other Charges', isAmount: true },
    { key: 'parking_charges', label: 'Parking Charges', isAmount: true },
    { key: 'package_total', label: 'Package Total', isAmount: true },
    { key: 'ownership', label: 'Ownership' },
    { key: 'landowner_name', label: 'Landowner Name' },
    { key: 'parking_avail', label: 'Parking Available' },
    { key: 'parking_type', label: 'Parking Type' },
    { key: 'parking_no', label: 'Parking No.' },
    { key: 'floor_sanctioned_status', label: 'Floor Sanctioned Status' },
    { key: 'north_side_details', label: 'North Side Details' },
    { key: 'south_side_details', label: 'South Side Details' },
    { key: 'east_side_details', label: 'East Side Details' },
    { key: 'west_side_details', label: 'West Side Details' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'created_at', label: 'Created At', type: 'date' },
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
      show: () => this.hasPermission('431'),

    },
    {
      label: 'Delete Floor Unit',
      icon: 'delete', // Add appropriate icon
      color: 'warn',
      disabled: () => this.selectedFloorUnits.length === 0,
      action: () => this.deleteFloorUnits(),
      show: () => this.hasPermission('432'),

    },
    {
      label: 'Update Floor Unit',
      icon: 'update', // Add appropriate icon
      color: 'primary',
      disabled: () => false,
      action: () => this.updateImportFloorUnit(),
      show: () => this.hasPermission('433'),

    },
    {
      label: 'Upload Floor Unit',
      icon: 'import_export', // Add appropriate icon
      color: 'primary',
      disabled: () => false,
      action: () => this.openImportFloorUnit(),
      show: () => this.hasPermission('434'),


    },
    {
      label: 'Add Floor Plan',
      icon: 'add_plus', // Add appropriate icon
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddEditFloorPlan('add'),
      show: () => this.hasPermission('435'),


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
  readonly hasPermission = (permission: string): boolean =>
    this.authService.hasPermission(permission);

  readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
    this.authService.hasOnlyRoles(allowedRoles);
  actions = [
    {
      action: 'edit',
      icon: 'edit_note',
      tooltip: 'Edit Floor Plan',
      color: 'primary',
      show: () => this.hasPermission('435'),
    },
  ];

  onBookingAction(action: string, row: any): void {
    if (action === 'edit') {
      this.openAddEditFloorPlan('edit', row);
    }
  }
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
      booking_status_id: [null],
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



  openAddEditFloorPlan(action: string, row?: any): void {
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
        for: 'Floor-unit',
        API_URL: `import_floor_unit`,
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
    this.commonService.fetchBookingStatus().subscribe({
      next: (res: any) => {
        this.bookingStatusList = res.data || [];
      },
      error: () => {
        this.snackBar.open('Unable to fetch booking status.', 'Close', {
          duration: 3000,
        });
        this.bookingStatusList = [];
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
}