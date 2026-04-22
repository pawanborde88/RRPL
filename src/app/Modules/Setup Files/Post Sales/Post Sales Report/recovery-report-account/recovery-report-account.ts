import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { AuthService } from '../../../../../Service/auth.service';
import { ColumnDynamicColorService } from '../../../../../Service/Column-Colors/column-dynamic-color.service';
import { CommonService } from '../../../../../Service/common/common.service';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';

@Component({
  selector: 'app-recovery-report-account',
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
  templateUrl: './recovery-report-account.html',
  styleUrl: './recovery-report-account.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class RecoveryReportAccount implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly authService = inject(AuthService);
  private readonly columnDynamicColorService = inject(ColumnDynamicColorService);
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
    // If you need your original sticky actions column, uncomment the block below:
    // { key: 'actions', label: 'Actions', type: 'actions', sticky: true, disabled: false },

    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_unit', label: 'Flat no' },
    { key: 'unit_type', label: 'Type of unit' },
    { key: 'applicant_name', label: 'Name Of customer' },
    { key: 'booking_date', label: 'Date of booking', type: 'mediumDate' },
    {
      key: 'agreement_status',
      label: 'Agreement Status',
      applyChequeStatusColor: true,
      cellStyle: ({ data }: any) =>
        data ? this.columnDynamicColorService.getAgreementStatusStyle(data.agreement_status_id) : undefined,
    },
    { key: 'agreement_date', label: 'Agreement Date', type: 'mediumDate' },
    { key: 'agreement_cost', label: 'Agreement Cost', isAmount: true }, // Note: This key wasn't in your JSON snippet, ensure your backend provides it
    {
      key: 'disbursement_status',
      label: 'Disbursement Status',
      applyChequeStatusColor: true,
      cellStyle: ({ data }: any) =>
        data ? this.columnDynamicColorService.getDisbursementStatusStyle(data.disbursement_status_id) : undefined,
    },
    { key: 'disbursement_date', label: 'Disbursement Date', type: 'mediumDate' },
    { key: 'received_amount', label: 'Total received', isAmount: true },
    { key: 'source', label: 'Source' },

    { key: 'source_detail', label: 'Source Details' }
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
