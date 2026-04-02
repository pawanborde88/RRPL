import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { AuthService } from '../../../../../Service/auth.service';
import { CommonService } from '../../../../../Service/common/common.service';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddEditFloorriseComponent } from '../../../../Floor Rise/add-edit-floorrise/add-edit-floorrise.component';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';

@Component({
  selector: 'app-ledget-report',
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
  templateUrl: './ledget-report.component.html',
  styleUrl: './ledget-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class LedgetReportComponent implements OnInit {
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
    wing_id: new FormControl(null, Validators.required),

  });

  readonly agreementDetailsColumnsNames = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },

    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'unit_type', label: 'Unit Type' },
    { key: 'floor_unit', label: 'Floor Unit' },
    { key: 'applicant_name', label: 'Client Name' },


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
      action: 'OpenViewLadgerReport', // Must match what you check in onBookingAction
      icon: 'visibility', // Material icon name
      tooltip: 'View Ledger Report', // Tooltip text
      color: 'primary', // Optional button color

    },
  
  ];
  onBookingAction(action: string, row: any): void {
    if (action === 'OpenViewLadgerReport') {
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



  openAddEditFloorRiseDialog(row: any): void {
    const dialogRef = this.dialog.open(UnifiedDocumentDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: {
        dialogType: DocumentDialogType.LEDGER_REPORT,
        rowData: {
          booking_id: row.booking_id,
          project_id: row.project_id || this.bookingForm.get('project_id')?.value || null,
        },
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {

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