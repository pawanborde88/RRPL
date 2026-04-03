import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
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
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { AuthService } from '../../../../../Service/auth.service';
import { CommonService } from '../../../../../Service/common/common.service';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
interface BookingColumn {
  key: string;
  label: string;
  type?: string;
  sticky?: boolean;
  disabled?: boolean;
  isAmount?: boolean;
  showAverage?: boolean;
  applyChequeStatusColor?: boolean;
}
@Component({
  selector: 'app-agreement-report',
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
  providers: [DatePipe],
  templateUrl: './agreement-report.component.html',
  styleUrl: './agreement-report.component.scss',


})
export class AgreementReportComponent implements OnInit {
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

  readonly agreementDetailsColumnsNames: BookingColumn[] = [
    {
      key: 'project_name',
      label: 'Project Name'
    },
    {
      key: 'wing_name',
      label: 'Wing'
    },
    {
      key: 'floor_unit',
      label: 'Unit No'
    },
    {
      key: 'applicant_name',
      label: 'Client Name'
    },
    {
      key: 'mobile_no',
      label: 'Mobile No',
      type: 'sensitive'

    },
    {
      key: 'email',
      label: 'Email',
      type: 'sensitive'
    },
    {
      key: 'agreement_status',
      label: 'Agree Status',
    },
    {
      key: 'booking_date',
      label: 'Booking Date',
      type: 'mediumDate'
    },
    {
      key: 'agreement_no',
      label: 'Agreement No'
    },

    {
      key: 'agreement_date',
      label: 'Agreement Date',
      type: 'mediumDate'
    },
    {
      key: 'lodge_receipt_no',
      label: 'Lodge Receipt No'
    },

    {
      key: 'date_of_execution',
      label: 'Execuation Date',
      type: 'mediumDate'
    },
    {
      key: 'agreement_tat',
      label: 'Agreement TAT'
    },
    {
      key: 'agreement_cost',
      label: 'Agreement Cost'
      , isAmount: true
    },
    {
      key: 'market_value',
      label: 'Market Value'
    },

    {
      key: 'challan_status',
      label: 'Challan Status'
    },
    {
      key: 'challan_date',
      label: 'Agreement Challan Date',
      type: 'mediumDate'
    },
    {
      key: 'scheduled_tat',
      label: 'Scheduled TAT'
    },
    {
      key: 'agreement_shadule_date',
      label: 'Agreement Schedule Date',
      type: 'mediumDate'
    },
    {
      key: 'day_pending_from_agreement',
      label: 'Agg. Pending Days'
    },
    {
      key: 'agreement_input_form',
      label: 'Agreement Input Form'
    },
    {
      key: 'agreement_copy_received',
      label: 'Agreement Copy Received'
    },
    {
      key: 'registration_office',
      label: 'Registration Office'
    },

    {
      key: 'updated_by_name',
      label: 'Updated By'
    },
    {
      key: 'updated_at',
      label: 'Updated At',
      type: 'date'
    },
  ] as const;

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};

    if (values.project_id) filters.project_id = values.project_id;
    if (values.wing_id) filters.wing_id = values.wing_id;

    return { filters };
  });




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


}
