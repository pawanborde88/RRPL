import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { UnifiedDocumentDialogComponent } from '../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { AuthService } from '../../../../Service/auth.service';
import { CommonService } from '../../../../Service/common/common.service';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
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
  selector: 'app-deleted-receipts-log',
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
  templateUrl: './deleted-receipts-log.html',
  styleUrl: './deleted-receipts-log.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class DeletedReceiptsLog implements OnInit {
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
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_unit', label: 'Floor Unit' },
    { key: 'applicant_name', label: 'Applicant Name' },
    { key: 'receipt_date', label: 'Receipt Date', type: 'mediumDate' },
    { key: 'receipt_type', label: 'Receipt Type' },
    { key: 'received_amount', label: 'Received Amount', isAmount: true },
    { key: 'trn_no', label: 'Transaction No' },
    { key: 'trn_date', label: 'Transaction Date', type: 'mediumDate' },
    { key: 'payment_mode', label: 'Payment Mode' },
    { key: 'bank_details', label: 'Branch' },
    { key: 'bank_name', label: 'Bank Name' },
    { key: 'cheque_status', label: 'Status' },
    { key: 'reason', label: 'Delete Reason' },
    { key: 'remark', label: 'Approved Remark' },
    { key: 'deleted_by_name', label: 'Deleted By' },
    { key: 'updated_at', label: 'Deleted At', type: 'date' },
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