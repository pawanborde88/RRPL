import { Component, Input, OnInit, SimpleChanges, ViewChild, signal, inject, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { environment } from '../../../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { FetchFunctionsService } from '../../../../../../Service/fetch-functions.service';
import { filter } from 'rxjs';
import { AddNewAgreementComponent } from '../add-new-agreement/add-new-agreement.component';
import { ReceiptPreviewDialogComponent } from '../../receipt-preview-dialog/receipt-preview-dialog.component';
import { ConfigurableAgGridDataComponent } from '../../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { AuthService } from '../../../../../../Service/auth.service';
import { CommonService } from '../../../../../../Service/common/common.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, computed } from '@angular/core';

@Component({
  selector: 'app-all-agreement-details-list',
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
  templateUrl: './all-agreement-detials-list.component.html',
  styleUrl: './all-agreement-detials-list.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllAgreementDetialsListComponent implements OnInit {
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
    user_id: new FormControl(this.userId),
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl(null),
    floor_id: new FormControl(null),
    booking_status_id: new FormControl(null),
    agreement_status_id: new FormControl(null),
    booking_date: new FormControl(null),
    project_configuration_id: new FormControl(null),
    start_date: new FormControl(null),
    end_date: new FormControl(null),
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
    { key: 'floor_unit', label: 'Unit' },
    { key: 'applicant_name', label: 'Client Name' },

    { key: 'agreement_no', label: 'Agreement No.' },
    { key: 'agreement_date', label: 'Agreement Date', type: 'mediumDate' },




    // Added new fields from your JSON data
    { key: 'registration_office_name', label: 'Registration Office' },
    { key: 'days_since_booking', label: 'Days Since Booking' },

    { key: 'remark', label: 'Remark' },
    { key: 'agreement_created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'agreement_updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ] as const;

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};

    if (values.project_id) filters.project_id = values.project_id;
    if (values.wing_id) filters.wing_id = values.wing_id;
    if (values.floor_id) filters.floor_id = values.floor_id;
    if (values.booking_status_id) filters.booking_status_id = values.booking_status_id;
    if (values.agreement_status_id) filters.agreement_status_id = values.agreement_status_id;

    if (!filters.agreement_status_id && this.agreementStatus) {
      filters.agreement_status_id = this.agreementStatus;
    }

    if (values.start_date) {
      filters.start_date = this.datePipe.transform(values.start_date, 'yyyy-MM-dd');
    }
    if (values.end_date) {
      filters.end_date = this.datePipe.transform(values.end_date, 'yyyy-MM-dd');
    }

    return { filters };
  });

  readonly bookingActions = [
    {
      action: 'editBooking', // Must match what you check in onBookingAction
      icon: 'edit_note', // Material icon name
      tooltip: 'Edit Agreement', // Tooltip text
      color: 'primary', // Optional button color
      disabled: (row: any) => row.agreement_status_id !== 1,

    },
    {
      action: 'viewAttachment',
      icon: 'attach_file',
      tooltip: 'View Attachment',
      color: 'accent',
      show: (row: any) => !!row.attachment,
    },
    {
      action: 'attachmentReceipt',
      icon: 'file_present',
      tooltip: 'View Index Attachment',
      color: 'primary',
      show: (row: any) => !!row.index_attachment,
    },
    {
      action: 'downloadAttachment',
      icon: 'download',
      tooltip: 'Download Attachment',
      color: 'primary',
      show: (row: any) => !!row.index_attachment || !!row.attachment,
    },

  ];
  onBookingAction(action: string, row: any): void {
    if (action === 'editBooking') {
      this.editBooking(row.booking_id);
    }
    if (action === 'attachmentReceipt') {
      this.openPreviewDialog(row, 'index_attachment', 'Index Attachment');
    }
    if (action === 'viewAttachment') {
      this.openPreviewDialog(row, 'attachment', 'Attachment');
    }
    if (action === 'downloadAttachment') {
      this.downloadAnyAttachment(row);
    }
  }

  downloadAnyAttachment(row: any): void {
    const attachment = row.index_attachment || row.attachment;
    if (!attachment) {
      this.showError('No attachment found to download.');
      return;
    }
    const cleanPath = attachment.replace(/\\/g, '');
    const fileUrl = `${this.storageUrl}/${cleanPath}`;
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = cleanPath.split('/').pop() || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openPreviewDialog(receiptData: any, field: string = 'index_attachment', title: string = 'Attachment Details'): void {
    const attachment = receiptData?.[field];
    if (!attachment) {
      this.snackBar.open(`${title} not found`, 'Close', {
        duration: 3000,
      });
      return;
    }

    const cleanPath = attachment.replace(/\\/g, '');
    const fileUrl = `${this.storageUrl}/${cleanPath}`;

    this.dialog.open(ReceiptPreviewDialogComponent, {
      width: '80%',
      maxWidth: '900px',
      data: {
        title: title,
        fileUrl: fileUrl,
      },
    });
  }

  editBooking(bookingId: any): void {
    const dialogRef = this.dialog.open(AddNewAgreementComponent, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: false,
      data: { booking_id: bookingId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridTable.refreshData();
      }
    });
  }


  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();

    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValues());
  }

  ngOnChanges(changes: SimpleChanges) {
    const activeChange = changes['active'];
    const statusChange = changes['agreementStatus'];

    if ((activeChange || statusChange) && this.active) {
      this.fetchAllBookings();
    }
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
        if (projectId) {
          this.fetchallProjectFloors(projectId, wingID);
        }
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  fetchAllBookings(): void {
    this.updateFormValues();
    this.agGridTable?.refreshData();
  }
  fetchallProjectFloors(selectedProjectId: any, wingID: any): void {
    this.http
      .post<any[]>(`${this.baseUrl}/fetch_floor_dropdown`, {
        project_id: selectedProjectId,
        wing_id: wingID,
      })
      .subscribe({
        next: (res) => {
          this.FloorUnitDropdown.set(res);
        },
        error: () => {
          this.showError('Unable to fetch floors.');
        },
      });
  }

  headerButtons = [
    {
      label: 'Add Agreement',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddNewAgreementDialog(),
      show: () => true,
    },
  ];

  openAddNewAgreementDialog(): void {
    const dialogRef = this.dialog.open(AddNewAgreementComponent, {
      width: '900px',
      maxWidth: '95vw',
      disableClose: false,
      data: {},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridTable.refreshData();
      }
    });
  }

  fetchAllWings(projectID: any): void {
    this.http
      .post<any[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectID })
      .subscribe({
        next: (res) => {
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
        this.selectedBooking.booking_id === booking.booking_id
      ) {
        this.selectedBooking = null;
      }
    }
  }

}
