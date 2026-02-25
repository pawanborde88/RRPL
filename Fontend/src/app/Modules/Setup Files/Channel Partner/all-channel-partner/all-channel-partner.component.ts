import {
  Component,
  ViewChild,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { TableColumn, ActionButton } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { AuthService } from '../../../../Service/auth.service';
import { EMPTY, Subject, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap,
  finalize,
  startWith
} from 'rxjs/operators';
import { ReceiptPreviewDialogComponent } from '../../Post Sales/Recovery/receipt-preview-dialog/receipt-preview-dialog.component';
import { Receipt } from '../../Post Sales/Recovery/Recipts/receipts.service';
import { ReraApproveDialog } from '../rera-approve-dialog/rera-approve-dialog';

interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  channel_partner_id: FormControl<any | null>;
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
  cp_start_date: FormControl<Date | null>;
  cp_end_date: FormControl<Date | null>;
}

interface ChannelPartner {
  channel_partner_id: number;
  firm_name: string;
  cp_owner: string;
  full_name?: string;
}

interface Project {
  project_id: number;
  property_name: string;
}

interface FilterPayload {
  filters: Record<string, unknown>;
  search: string;
}

@Component({
  selector: 'app-all-channel-partner',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    ConfigurableAgGridDataComponent,
    AutocompleteReusableComponent
  ],
  templateUrl: './all-channel-partner.component.html',
  styleUrl: './all-channel-partner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllChannelPartnerComponent implements OnInit {
  // Dependency injection using inject()
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private datePipe: DatePipe = new DatePipe('en-US');
  // Constants
  private readonly baseUrl = environment.API_URL;
  private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly MIN_SEARCH_LENGTH = 3;
  private readonly SEARCH_DEBOUNCE_MS = 300;
  private readonly SNACKBAR_DURATION = 3000;

  // Signals for state management
  readonly cpTargetLoggedData = signal<unknown>(null);
  readonly projectsList = signal<Project[]>([]);
  readonly allChannelPartnerList = signal<ChannelPartner[]>([]);
  readonly isLoadingProjects = signal<boolean>(false);
  readonly isLoadingPartners = signal<boolean>(false);
  readonly storageUrl = environment.STORAGE_URL;

  // Search subject for debounced partner search
  private readonly partnerSearchSubject = new Subject<string>();

  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  readonly columnDefinitions: readonly TableColumn[] = [
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'firm_name', label: 'Firm Name' },
    { key: 'rera', label: 'RERA' },
    { key: 'rera_approvel', label: 'Is Approved' },
    { key: 'booking_count', label: 'Booking Count' },
    { key: 'token_count', label: 'Token Count' },
    { key: 'site_visit_count', label: 'Site Visit Count' },
    { key: 'firm_email', label: 'Firm Email' },
    { key: 'firm_phone', label: 'Firm Phone' },
    { key: 'bank_name', label: 'Bank Name' },
    { key: 'ifsc_code', label: 'IFSC Code' },
    { key: 'account_no', label: 'Account No' },
    { key: 'bank_address', label: 'Bank Address' },
    { key: 'branch_name', label: 'Branch Name' },

    { key: 'created_by', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ] as const;

  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any[] | null>([]),
    channel_partner_id: new FormControl<any | null>(null),
    start_date: new FormControl<any | null>(null),
    end_date: new FormControl<any | null>(null),
    cp_start_date: new FormControl<any | null>(null),
    cp_end_date: new FormControl<any | null>(null),
  });

  // Convert form valueChanges to signal using toSignal()
  private readonly formValues = toSignal(
    this.enquiryFilterForm.valueChanges.pipe(
      startWith(this.enquiryFilterForm.value),
      map((value) => ({
        project_id: value.project_id ?? null,
        channel_partner_id: value.channel_partner_id ?? null,
        start_date: value.start_date ?? null,
        end_date: value.end_date ?? null,
        cp_start_date: value.cp_start_date ?? null,
        cp_end_date: value.cp_end_date ?? null,
      }))
    ),
    { initialValue: { project_id: null, channel_partner_id: null, start_date: null, end_date: null, cp_start_date: null, cp_end_date: null } }
  );

  readonly channelPartnerActions: ActionButton<any>[] = [
    {
      action: 'deleteBooking',
      icon: 'delete',
      tooltip: 'Delete CP',
      color: 'warn',
      disabled: false,
    },
    {
      action: 'editBooking',
      icon: 'edit_note',
      tooltip: 'Edit CP',
      color: 'primary',
      disabled: false,
    },
    {
      action: 'RERACertificate',
      icon: 'attach_file',
      tooltip: ' RERA Certificate',
      color: 'primary',
      disabled: (row: any) => !row['rera_certificate'],
    },
    {
      action: 'RERAApprove',
      icon: 'fact_check',
      tooltip: ' RERA Approve',
      color: 'primary',
    },
  ];

  readonly headerButtons = [
    {
      label: ' Add Channel Partner',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.router.navigate(['/setup/add-channel-partner']),
      show: () => true,
    },
  ] as const;

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed<FilterPayload>(() => {
    const formValues = this.formValues();
    const filters = this.buildFilters(formValues);

    return {
      filters,
      search: '', // Search is handled by AG Grid component internally
    };
  });

  ngOnInit(): void {
    this.cpTargetLoggedData.set(history.state.data || null);
    this.fetchAllProjects();
    this.setupPartnerSearch();
  }

  /**
   * Setup debounced partner search using RxJS operators
   */
  private setupPartnerSearch(): void {
    this.partnerSearchSubject
      .pipe(
        debounceTime(this.SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((searchText) => {
          const trimmed = searchText.trim();
          if (trimmed.length < this.MIN_SEARCH_LENGTH) {
            this.allChannelPartnerList.set([]);
            return EMPTY;
          }
          return this.searchPartners(trimmed);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private buildFilters(formValues: {
    project_id: any[] | null;
    channel_partner_id: any | null;
    start_date: Date | null;
    end_date: Date | null;
    cp_start_date: Date | null;
    cp_end_date: Date | null;
  }): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    const loggedData = this.cpTargetLoggedData() as Record<string, unknown> | null;

    // Handle project_id - multi-select returns array
    if (formValues.project_id && Array.isArray(formValues.project_id) && formValues.project_id.length > 0) {
      filters['project_id'] = formValues.project_id;
    }

    // Handle channel_partner_id - single-select returns single value, but payload needs array
    if (formValues.channel_partner_id) {
      filters['channel_partner_id'] = Array.isArray(formValues.channel_partner_id)
        ? formValues.channel_partner_id
        : [formValues.channel_partner_id];
    }

    // Handle dates - format as YYYY-MM-DD
    if (formValues.start_date) {
      const formatted = this.formatDate(formValues.start_date);
      if (formatted) {
        filters['start_date'] = formatted;
      }
    }

    if (formValues.end_date) {
      const formatted = this.formatDate(formValues.end_date);
      if (formatted) {
        filters['end_date'] = formatted;
      }
    }

    if (formValues.cp_start_date) {
      const formatted = this.formatDate(formValues.cp_start_date);
      if (formatted) {
        filters['cp_start_date'] = formatted;
      }
    }

    if (formValues.cp_end_date) {
      const formatted = this.formatDate(formValues.cp_end_date);
      if (formatted) {
        filters['cp_end_date'] = formatted;
      }
    }

    // Override with cpTargetLoggedData if available
    if (loggedData) {
      if (loggedData['till_channel_partner_id']) {
        filters['channel_partner_id'] = Array.isArray(loggedData['till_channel_partner_id'])
          ? loggedData['till_channel_partner_id']
          : [loggedData['till_channel_partner_id']];
      }
      if (loggedData['project_id']) {
        filters['project_id'] = loggedData['project_id'];
      }
    }

    return filters;
  }

  private formatDate(date: Date): string | null {
    return this.datePipe.transform(date, this.DATE_FORMAT);
  }

  fetchAllEnquiry(): void {


    // Refresh AG Grid data - payload is computed and will update automatically
    this.agGridComponent?.refreshData();
  }

  getChannelPartnerActions(action: string, row: Record<string, unknown>): void {
    switch (action) {
      case 'deleteBooking':
        this.deleteChannelPartner(Number(row['channel_partner_id']));
        break;

      case 'editBooking':
        this.router.navigate(
          ['/setup/edit-channel-partner', row['firm_name'], row['channel_partner_id']],
          { state: { data: row } }
        );
        break;

      case 'RERACertificate':
        this.openReceiptDialog(row);
        break;

      case 'RERAApprove':
        this.openRERADialog(row);
        break;

      default:
        console.warn('Unknown action:', action);
        break;
    }
  }

  openRERADialog(receiptData: any): void {
    const dialogRef = this.dialog.open(ReraApproveDialog, {
      width: '400px',
      data: {
        title: 'RERA Approval',
        data: receiptData
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.agGridComponent?.refreshData();
      }
    });
  }
  openReceiptDialog(receiptData: any): void {
    if (!receiptData?.rera_certificate) {
      this.snackBar.open('Receipt attachment not found', 'Close', {
        duration: 3000,
      });
      return;
    }

    const fileUrl = `${this.storageUrl}/${receiptData.rera_certificate}`;

    this.dialog.open(ReceiptPreviewDialogComponent, {
      width: '80%',
      maxWidth: '900px',
      data: {
        title: 'RERA Certificate',
        fileUrl: fileUrl,
      },
    });
  }
  fetchAllProjects(): void {
    this.isLoadingProjects.set(true);

    this.http
      .post<Project[]>(`${this.baseUrl}/user_project_dropdown`, {
        user_id: this.authService.userId(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching projects:', error);
          this.showError('Unable to fetch projects.');
          return of<Project[]>([]);
        }),
        finalize(() => this.isLoadingProjects.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.projectsList.set(res ?? []);
        },
      });
  }

  onPartnerSearch(searchText: string): void {
    this.partnerSearchSubject.next(searchText);
  }

  private searchPartners(searchText: string) {
    this.isLoadingPartners.set(true);

    return this.http
      .post<ChannelPartner[]>(`${this.baseUrl}/channel_partner_dropdown`, {
        firm_name: searchText,
      })
      .pipe(
        map((res) =>
          (res ?? []).map((item) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner})`,
          }))
        ),
        tap((partners) => {
          this.allChannelPartnerList.set(partners);
          this.isLoadingPartners.set(false);
        }),
        catchError(() => {
          this.isLoadingPartners.set(false);
          this.showError('Unable to fetch channel partner details.');
          return of<ChannelPartner[]>([]);
        })
      );
  }

  deleteChannelPartner(channelPartnerId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Channel Partner?' },
    });

    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        switchMap(() =>
          this.http.post<{ success: boolean }>(`${this.baseUrl}/delete_channel_partner`, {
            channel_partner_id: channelPartnerId,
          })
        ),
        tap(() => {
          this.showSuccess('CP deleted successfully');
          this.agGridComponent?.refreshData();
        }),
        catchError(() => {
          this.showError('Unable to delete channel partner.');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: this.SNACKBAR_DURATION,
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: this.SNACKBAR_DURATION,
    });
  }
}
