import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, signal, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { ConfigurableAgGridDataComponent } from '../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { ActionColumnComponent } from '../../../Common/action-column/action-column.component';
import { AuthService } from '../../../Service/auth.service';
import { CommonService } from '../../../Service/common/common.service';
import { FetchFunctionsService } from '../../../Service/fetch-functions.service';
import { AddEditFloorriseComponent } from '../add-edit-floorrise/add-edit-floorrise.component';

@Component({
  selector: 'app-all-floor',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,

    ActionColumnComponent,
  ],
  templateUrl: './all-floor.component.html',
  styleUrl: './all-floor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],


})
export class AllFloorComponent {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly userId = this.authService.userId();
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;
  private readonly datePipe = inject(DatePipe);

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly allWingslist = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);
  readonly FloorUnitDropdown = signal<any[]>([]);

  // Form signal for reactive payload
  private readonly formValues = signal<any>({});

  @Input() agreementStatus: number = 1;
  @Input() active: boolean = false;

  readonly bookingForm = new FormGroup({
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl(null),

  });

  readonly agreementDetailsColumnsNames = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },

    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_id', label: 'Floor' },
    { key: 'floor_rise_amount', label: 'Floor Rise Amount', isAmount: true },
    { key: 'created_at', label: 'Created At', type: 'date' },

  ] as const;

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};

    if (values.project_id) filters.project_id = values.project_id;
    if (values.wing_id) filters.wing_id = values.wing_id;

    return { filters };
  });

  readonly bookingActions = [
    {
      action: 'EditFloorRise', // Must match what you check in onBookingAction
      icon: 'edit_note', // Material icon name
      tooltip: 'Edit Floor Rise', // Tooltip text
      color: 'primary', // Optional button color

    },
    {
      action: 'DeleteFloorRise',
      icon: 'delete',
      tooltip: 'Delete',
      color: 'warn',
      disabled: false,
    },

  ];
  onBookingAction(action: string, row: any): void {
    if (action === 'EditFloorRise') {
      this.openAddEditFloorRiseDialog(row);
    }
    if (action === 'DeleteFloorRise') {
      this.DeleteFloorRise(row.floor_rise_id);
    }
  }
  DeleteFloorRise(floorRiseId: any): void {

  }



  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();

    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValues());
  }

  fetchAllBookings(): void {
    this.updateFormValues();
    this.agGridTable?.refreshData();
  }

  private updateFormValues(): void {
    this.formValues.set(this.bookingForm.value);
  }

  private loadInitialData(): void {
    this.commonService.fetchUserProjectDropdown(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) this.projectsList.set(res);
        },
        error: () => this.showError('Unable to fetch projects.')
      });
  }

  private setupFormSubscriptions(): void {
    this.bookingForm.get('project_id')?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(id => !!id)
      )
      .subscribe(projectID => {
        this.fetchAllWings(projectID);
      });

    this.bookingForm.get('wing_id')?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(id => !!id)
      )
      .subscribe(wingID => {
        const projectId = this.bookingForm.get('project_id')?.value;

      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }


  headerButtons = [
    {
      label: 'Add Floor Rise',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddEditFloorRiseDialog(),
      show: () => true,
    },
  ];

  openAddEditFloorRiseDialog(data: any = null): void {
    const dialogRef = this.dialog.open(AddEditFloorriseComponent, {
      maxWidth: '50vw',
      disableClose: false,
      data: data ? { floorRiseID: data } : null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridTable.refreshData();
      }
    });
  }

  fetchAllWings(projectID: any): void {
    this.commonService.fetchWingDropdown(projectID)
      .subscribe({
        next: (res: any) => {
          this.allWingslist.set(res);
        },
        error: () => {
          this.showError('Unable to fetch wings.');
        },
      });
  }
  selectedBooking: any = null; // Change from selectedBookingId to selectedBooking

  onBookingSelectionChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedBooking = booking;
      console.log('Selected booking:', this.selectedBooking);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedBooking &&
        this.selectedBooking.floor_rise_id === booking.floor_rise_id
      ) {
        this.selectedBooking = null;
      }
    }
  }

}
