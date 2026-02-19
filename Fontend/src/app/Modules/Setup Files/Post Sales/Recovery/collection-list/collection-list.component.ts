import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { IndianCurrencyPipe } from '../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { catchError, filter, of } from 'rxjs';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { AuthService } from '../../../../../Service/auth.service';
import { CommonService } from '../../../../../Service/common/common.service';

@Component({
  selector: 'app-collection-list',
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
  templateUrl: './collection-list.component.html',
  styleUrl: './collection-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class CollectionListComponent implements OnInit {
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
      key: 'project_info',
      label: 'Project & Unit Details',
      headerClass: 'bg-project-info',
      children: [
        { key: 'project_name', label: 'Project Name', width: '150px', headerClass: 'bg-project-info', cellClass: 'bg-project-info' },
        { key: 'wing_name', label: 'Wing', width: '100px', headerClass: 'bg-project-info', cellClass: 'bg-project-info' },
        { key: 'floor_unit', label: 'Unit No', width: '100px', headerClass: 'bg-project-info', cellClass: 'bg-project-info' },
        { key: 'unit_type', label: 'Unit Type', width: '100px', headerClass: 'bg-project-info', cellClass: 'bg-project-info' },
        { key: 'carpet', label: 'Carpet', width: '100px', headerClass: 'bg-project-info', cellClass: 'bg-project-info' },
        { key: 'floor_unit_id', label: 'Unit Id (SqFt)', width: '120px', headerClass: 'bg-project-info', cellClass: 'bg-project-info' },
      ]
    },
    {
      key: 'client_info',
      label: 'Client Details',
      headerClass: 'bg-client-info',
      children: [
        { key: 'applicant_name', label: 'Client Name', width: '150px', headerClass: 'bg-client-info', cellClass: 'bg-client-info' },
        { key: 'applicant_email', label: 'Email ID', type: 'sensitive', width: '150px', headerClass: 'bg-client-info', cellClass: 'bg-client-info' },
        { key: 'applicant_mobile', label: 'Mobile', type: 'sensitive', width: '120px', headerClass: 'bg-client-info', cellClass: 'bg-client-info' },
      ]
    },
    {
      key: 'booking_details',
      label: 'Booking Status & Cost',
      headerClass: 'bg-booking-details',
      children: [
        { key: 'booking_date', label: 'Booking Date', width: '120px', headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
        {
          key: 'agreement_status',
          label: 'Agreement Status',
          applyChequeStatusColor: true,
          colorCondition: (element: any) =>
            element.agreement_status_id === 1 ? 'green' : 'red',
          width: '150px',
          headerClass: 'bg-booking-details',
          cellClass: 'bg-booking-details'
        },
        { key: 'rate', label: 'Rate', isAmount: true, width: '100px', headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
        { key: 'basic_cost', label: 'Basic Cost', isAmount: true, width: '120px', headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
        { key: 'agreement_cost', label: 'Agreement Cost', isAmount: true, width: '130px', headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
        { key: 'package_total', label: 'Package Total', isAmount: true, width: '130px', headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
      ]
    },
    {
      key: 'gov_taxes',
      label: 'Govt. Taxes & Charges',
      headerClass: 'bg-gov-taxes',
      children: [
        { key: 'gst_per', label: 'GST %', width: '80px', headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
        { key: 'gst', label: 'GST Amount', isAmount: true, width: '120px', headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
        { key: 'sd_per', label: 'SD %', showAverage: true, width: '80px', headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
        { key: 'stamp_duty', label: 'Stamp Duty', isAmount: true, width: '120px', headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
        { key: 'reg_per', label: 'Reg %', width: '80px', headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
        { key: 'reg', label: 'Registration', isAmount: true, width: '120px', headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
      ]
    },
    {
      key: 'additional_charges',
      label: 'Additional Charges',
      headerClass: 'bg-additional-charges',
      children: [
        { key: 'society_for', label: 'Society Formation', isAmount: true, width: '120px', headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
        { key: 'legal', label: 'Legal Charges', isAmount: true, width: '120px', headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
        { key: 'maintenance', label: 'Maintenance', isAmount: true, width: '120px', headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
        { key: 'parking_type', label: 'Parking Type', width: '120px', headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
        { key: 'parking_no', label: 'Parking No', width: '100px', headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
        { key: 'charges', label: 'Parking Charges', isAmount: true, width: '120px', headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
      ]
    },
    {
      key: 'installment_summary',
      label: 'Installment Summary',
      headerClass: 'bg-installment-summary',
      children: [
        { key: 'installment.total', label: 'Total', isAmount: true, width: '120px', headerClass: 'bg-installment-summary', cellClass: 'bg-installment-summary' },
        { key: 'installment.received', label: 'Received', isAmount: true, width: '120px', headerClass: 'bg-installment-summary', cellClass: 'bg-installment-summary' },
        { key: 'installment.pending', label: 'Pending', isAmount: true, width: '120px', headerClass: 'bg-installment-summary', cellClass: 'bg-installment-summary' },
      ]
    },
    {
      key: 'tax_summary',
      label: 'Tax Summary',
      headerClass: 'bg-tax-summary',
      children: [
        { key: 'tax.total', label: 'Total', isAmount: true, width: '120px', headerClass: 'bg-tax-summary', cellClass: 'bg-tax-summary' },
        { key: 'tax.received', label: 'Received', isAmount: true, width: '120px', headerClass: 'bg-tax-summary', cellClass: 'bg-tax-summary' },
        { key: 'tax.pending', label: 'Pending', isAmount: true, width: '120px', headerClass: 'bg-tax-summary', cellClass: 'bg-tax-summary' },
      ]
    },
    {
      key: 'annexure_summary',
      label: 'Annexure Summary',
      headerClass: 'bg-annexure-summary',
      children: [
        { key: 'annexure.total', label: 'Total', isAmount: true, width: '120px', headerClass: 'bg-annexure-summary', cellClass: 'bg-annexure-summary' },
        { key: 'annexure.received', label: 'Received', isAmount: true, width: '120px', headerClass: 'bg-annexure-summary', cellClass: 'bg-annexure-summary' },
        { key: 'annexure.pending', label: 'Pending', isAmount: true, width: '120px', headerClass: 'bg-annexure-summary', cellClass: 'bg-annexure-summary' },
      ]
    },
    {
      key: 'other_summary',
      label: 'Other Details Summary',
      headerClass: 'bg-other-summary',
      children: [
        { key: 'other.total', label: 'Total', isAmount: true, width: '120px', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' },
        { key: 'other.received', label: 'Received', isAmount: true, width: '120px', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' },
        { key: 'other.pending', label: 'Pending', isAmount: true, width: '120px', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' },
      ]
    },
    {
      key: 'grand_total_summary',
      label: 'Grand Total',
      headerClass: 'bg-grand-total',
      children: [
        { key: 'grand_total.total', label: 'Total', isAmount: true, width: '130px', headerClass: 'bg-grand-total', cellClass: 'bg-grand-total' },
        { key: 'grand_total.received', label: 'Received', isAmount: true, width: '130px', headerClass: 'bg-grand-total', cellClass: 'bg-grand-total' },
        { key: 'grand_total.pending', label: 'Pending', isAmount: true, width: '130px', headerClass: 'bg-grand-total', cellClass: 'bg-grand-total' },
      ]
    }
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
    {
      action: 'DeleteFloorRise',
      icon: 'delete',
      tooltip: 'Delete',
      color: 'warn'
    }
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
