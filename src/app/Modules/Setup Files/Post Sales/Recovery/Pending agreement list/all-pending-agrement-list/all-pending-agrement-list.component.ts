import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal, ChangeDetectionStrategy, ViewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, switchMap, of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { SuccessDialogComponent } from '../../../../../../Common/success-dialog/success-dialog.component';
import { IndianCurrencyPipe } from '../../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../../Pipes/truncate.pipe';
import { TemplateComponent } from '../../../../../../Common/template/template.component';
import { EmailConfirmationDialogComponent } from '../email-confirmation-dialog/email-confirmation-dialog.component';
import { PendingAgreementService, AgreementPayload, FilterPayload } from './services/pending-agreement.service';

interface ColumnDefinition {
  key: string;
  label: string;
  type?: string;
  applyChequeStatusColor?: boolean;
  colorCondition?: (element: any) => string;
}

interface HeaderButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}

@Component({
  selector: 'app-all-pending-agreement-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
    IndianCurrencyPipe,
    ActionColumnComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-pending-agrement-list.component.html',
  styleUrl: './all-pending-agrement-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllPendingAgrementListComponent {
  // Services
  private readonly agreementService = inject(PendingAgreementService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private datePipe: DatePipe = new DatePipe('en-US'); private readonly destroyRef = inject(DestroyRef);

  // ViewChild references
  @ViewChild('agGridComponent') agGridComponent!: ConfigurableAgGridDataComponent;
  @ViewChild('mailLogGridComponent') mailLogGridComponent!: ConfigurableAgGridDataComponent;

  // User session data (computed from sessionStorage)
  private readonly roleId = signal(Number(sessionStorage.getItem('role_id')) || 0);
  private readonly userId = signal(Number(sessionStorage.getItem('session_id')) || 0);
  private readonly accountID = signal(Number(sessionStorage.getItem('account_id')) || 0);

  // State signals
  readonly loading = signal(false);
  readonly searchText = signal('');
  readonly selectedPendingAgreement = signal<any[]>([]);

  // Dropdown data signals
  readonly projectsList = signal<any[]>([]);
  readonly allWingslist = signal<any[]>([]);
  readonly floorUnitDropdown = signal<any[]>([]);
  readonly confiList = signal<any[]>([]);

  // Pagination params signals
  readonly paginationParams = signal({
    offset: 0,
    limit: 30,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  readonly mailLogPaginationParams = signal({
    offset: 0,
    limit: 30,
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  // Form definition
  readonly bookingForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null),
    floor_id: new FormControl<number | null>(null),
    booking_status_id: new FormControl<number | null>(null),
    booking_date: new FormControl<Date | null>(null),
    project_configuration_id: new FormControl<number | null>(null),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
  });

  // ==================== PAYLOAD CACHE ====================
  private agGridPayloadCache: AgreementPayload | null = null;
  private mailLogPayloadCache: AgreementPayload | null = null;
  private lastFormValueHash: string = '';
  private lastMailLogFormValueHash: string = '';

  // Column definitions
  readonly agreemnetDetailsColumnsNames: ColumnDefinition[] = [
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_unit', label: 'Unit No' },
    { key: 'booking_date', label: 'Booking Date' },
    { key: 'applicant_name', label: 'Client Name' },
    { key: 'applicant_mobile', label: 'Mobile', type: 'sensitive' },
    { key: 'applicant_email', label: 'Email', type: 'sensitive' },
    { key: 'days_since_booking', label: 'Days From Received' },
    {
      key: 'data_received_status',
      label: 'Data Received',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.data_received_status_id === 1 ? 'green' : 'red',
    },
    {
      key: 'link_send_status',
      label: 'Link Sent',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.link_send === 1 ? 'green' : 'red',
    },
  ];

  readonly columnKeys = computed(() =>
    this.agreemnetDetailsColumnsNames.map((col) => col.key)
  );

  readonly mailLogColumns: ColumnDefinition[] = [
    { key: 'booking_id', label: 'Booking ID' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'unit_no', label: 'Unit No' },
    { key: 'applicant_name', label: 'Customer Name' },
    { key: 'applicant_email', label: 'Email', type: 'sensitive' },
    { key: 'email_subject', label: 'Email Subject' },
    { key: 'email_status', label: 'Email Status' },
    { key: 'sent_at', label: 'Sent At', type: 'date' },
    { key: 'created_at', label: 'Created At', type: 'date' },
  ];

  // Header buttons with computed disabled state (like AllEnquirysComponent)
  readonly headerButtons = computed<HeaderButton[]>(() => {
    const hasSelected = this.selectedPendingAgreement().length > 0;

    return [
      {
        label: 'Email ID',
        icon: 'email',
        color: 'primary',
        disabled: () => !hasSelected,
        action: () => this.sendEmail(),
        show: () => true,
      },
      {
        label: 'WhatsApp',
        icon: 'chat',
        color: 'primary',
        disabled: () => !hasSelected,
        action: () => this.sendWhatsApp(),
        show: () => true,
      },
      {
        label: 'SMS',
        icon: 'sms',
        color: 'primary',
        disabled: () => !hasSelected,
        action: () => this.sendSMS(),
        show: () => true,
      },
    ];
  });

  readonly bookingActions: any[] = [];

  constructor() {
    this.initializeComponent();
    this.setupFormListeners();
  }

  private initializeComponent(): void {
    this.fetchAllProjects();
  }

  private setupFormListeners(): void {
    // Project ID changes - fetch wings
    this.bookingForm
      .get('project_id')
      ?.valueChanges.pipe(
        distinctUntilChanged(),
        filter((projectID): projectID is number => !!projectID),
        switchMap((projectID) => {
          this.allWingslist.set([]);
          this.floorUnitDropdown.set([]);
          this.bookingForm.patchValue({ wing_id: null, floor_id: null }, { emitEvent: false });
          return this.agreementService.fetchWings(projectID);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (wings) => this.allWingslist.set(wings),
        error: () => this.showError('Unable to fetch wings.'),
      });

    // Wing ID changes - fetch floors
    this.bookingForm
      .get('wing_id')
      ?.valueChanges.pipe(
        distinctUntilChanged(),
        filter((wingID): wingID is number => !!wingID),
        switchMap((wingID) => {
          const projectID = this.bookingForm.get('project_id')?.value;
          if (projectID && wingID) {
            this.floorUnitDropdown.set([]);
            this.bookingForm.patchValue({ floor_id: null }, { emitEvent: false });
            return this.agreementService.fetchFloors(projectID, wingID);
          }
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (floors) => this.floorUnitDropdown.set(floors),
        error: () => this.showError('Unable to fetch floors.'),
      });

    // Remove automatic form valueChanges subscription to prevent loops
    // Form values will be updated only when explicitly needed (on filter apply, etc.)
  }

  fetchAllProjects(): void {
    this.loading.set(true);
    this.agreementService.fetchProjects(this.userId()).subscribe({
      next: (projects) => {
        this.projectsList.set(projects);
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);
        this.showError('Unable to fetch projects.');
      },
    });
  }

  // ==================== AG-GRID PAYLOAD ====================
  getAgGridPayload(): AgreementPayload {
    const formValues = this.bookingForm.value;
    const pagination = this.paginationParams();
    const search = this.searchText();

    const currentHash = JSON.stringify({
      formValues,
      offset: pagination.offset,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      search,
    });

    if (this.agGridPayloadCache && this.lastFormValueHash === currentHash) {
      return this.agGridPayloadCache;
    }

    const filters = this.buildFilters(formValues, search);

    this.agGridPayloadCache = {
      offset: pagination.offset,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      filters: {
        ...filters,
        search: search || '',
      }
    };

    this.lastFormValueHash = currentHash;
    return this.agGridPayloadCache;
  }

  getMailLogPayload(): AgreementPayload {
    const formValues = this.bookingForm.value;
    const pagination = this.mailLogPaginationParams();
    const search = this.searchText();

    const currentHash = JSON.stringify({
      formValues,
      offset: pagination.offset,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      search,
    });

    if (this.mailLogPayloadCache && this.lastMailLogFormValueHash === currentHash) {
      return this.mailLogPayloadCache;
    }

    const filters = this.buildFilters(formValues, search);

    this.mailLogPayloadCache = {
      offset: pagination.offset,
      limit: pagination.limit,
      sortBy: pagination.sortBy,
      sortOrder: pagination.sortOrder,
      filters: {
        ...filters,
        search: search || '',
      }
    };

    this.lastMailLogFormValueHash = currentHash;
    return this.mailLogPayloadCache;
  }

  fetchAllPendingAgreementList(): void {
    // Reset offset when applying filters
    this.paginationParams.update((params) => ({ ...params, offset: 0 }));
    this.lastFormValueHash = ''; // Invalidate cache
    setTimeout(() => {
      if (this.agGridComponent) {
        this.agGridComponent.refreshData();
      }
    }, 0);
  }

  fetchCustomerMailLog(): void {
    // Reset offset when switching to mail log tab
    this.mailLogPaginationParams.update((params) => ({ ...params, offset: 0 }));
    this.lastMailLogFormValueHash = ''; // Invalidate cache
    setTimeout(() => {
      if (this.mailLogGridComponent) {
        this.mailLogGridComponent.refreshData();
      }
    }, 100);
  }

  private buildFilters(formValues: any, search: string): FilterPayload {
    const filters: FilterPayload = {};

    if (formValues.project_id != null) {
      filters.project_id = formValues.project_id;
    }
    if (formValues.wing_id != null) {
      filters.wing_id = formValues.wing_id;
    }
    if (formValues.floor_id != null) {
      filters.floor_id = formValues.floor_id;
    }
    if (formValues.booking_status_id != null) {
      filters.booking_status_id = formValues.booking_status_id;
    }
    if (formValues.start_date) {
      filters.start_date = this.datePipe.transform(
        formValues.start_date,
        'yyyy-MM-dd'
      )!;
    }
    if (formValues.end_date) {
      filters.end_date = this.datePipe.transform(
        formValues.end_date,
        'yyyy-MM-dd'
      )!;
    }
    if (search) {
      filters.search = search;
    }

    return filters;
  }

  onTabChange(event: MatTabChangeEvent): void {
    if (event.index === 0) {
      this.fetchAllPendingAgreementList();
    } else if (event.index === 1) {
      this.fetchCustomerMailLog();
    }
  }

  onSortChange(sort: { active: string; direction: string }): void {
    this.paginationParams.update((params) => ({
      ...params,
      sortBy: sort.active,
      sortOrder: (sort.direction || 'desc') as 'asc' | 'desc',
    }));
    this.lastFormValueHash = ''; // Invalidate cache
    this.fetchAllPendingAgreementList();
  }

  applyFilter(searchText: string): void {
    this.searchText.set(searchText);
    this.paginationParams.update((params) => ({ ...params, offset: 0 }));
    this.lastFormValueHash = ''; // Invalidate cache
    this.fetchAllPendingAgreementList();
  }

  onGlobalSearchChange(searchTerm: string): void {
    this.searchText.set(searchTerm);
    this.paginationParams.update((params) => ({ ...params, offset: 0 }));
    this.lastFormValueHash = ''; // Invalidate cache
    this.fetchAllPendingAgreementList();
  }

  onRowSelected(rows: any[]): void {
    this.selectedPendingAgreement.set(rows);
  }

  sendEmail(): void {
    const selected = this.selectedPendingAgreement();
    if (!selected || selected.length === 0) return;

    const dialogRef = this.dialog.open(EmailConfirmationDialogComponent, {
      width: '500px',
      data: {
        customerName: selected[0].applicant_name,
        customerEmail: selected[0].applicant_email,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.loading.set(true);
        this.agreementService
          .sendEmailToCustomer(selected[0].booking_id)
          .subscribe({
            next: (res) => {
              this.loading.set(false);
              this.dialog.open(SuccessDialogComponent, {
                data: { message: res.message },
              });
              this.fetchAllPendingAgreementList();
            },
            error: (err) => {
              console.error(err);
              this.loading.set(false);
              this.showError('Failed to send email.');
            },
          });
      }
    });
  }

  sendWhatsApp(): void {
    const selected = this.selectedPendingAgreement();
    if (selected && selected.length > 0) {
      console.log('Sending WhatsApp message for:', selected);
      // Implement WhatsApp sending logic
    }
  }

  sendSMS(): void {
    const selected = this.selectedPendingAgreement();
    if (selected && selected.length > 0) {
      console.log('Sending SMS for:', selected);
      // Implement SMS sending logic
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
