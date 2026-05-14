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
import { TableColumn, TableRowData, ActionButton } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
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
import { AddFollowUpDialog } from '../add-follow-up-dialog/add-follow-up-dialog';
import { ColumnDynamicColorService } from '../../../../Service/Column-Colors/column-dynamic-color.service';
import { AddChannelPartnerComponent } from '../add-channel-partner/add-channel-partner.component';
import { AssignSourceExecutivesDialog } from '../assign-source-executives-dialog/assign-source-executives-dialog';
import { ChannelPartnerStore } from '../assign-source-executives-dialog/channel-partner.store';
import { ChannelPartnerMeetingService } from '../../../Channel Partner Meetings/all-channel-partner-meeting/channel-partner-meeting.service';

interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  channel_partner_id: FormControl<any | null>;
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
  cp_start_date: FormControl<Date | null>;
  cp_end_date: FormControl<Date | null>;
  source_executive_id: FormControl<any | null>;
}

interface ChannelPartner {
  channel_partner_id: number;
  firm_name: string;
  cp_owner: string;
  full_name?: string;
  rera_approvel_id?: number;
  source_executive_id?: number;
}

/** Column definition that may include applyChequeStatusColor (used by AG Grid column service) */
type ChannelPartnerTableColumn = TableColumn<TableRowData> & { applyChequeStatusColor?: boolean };

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
  providers: [ChannelPartnerStore],
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
  protected readonly store = inject(ChannelPartnerStore);
  private readonly service = inject(ChannelPartnerMeetingService);
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  // Signals for state management
  readonly cpTargetLoggedData = signal<unknown>(null);
  readonly projectsList = signal<Project[]>([]);
  readonly allChannelPartnerList = signal<ChannelPartner[]>([]);
  readonly isLoadingProjects = signal<boolean>(false);
  readonly isLoadingPartners = signal<boolean>(false);
  readonly storageUrl = environment.STORAGE_URL;
  readonly selectedCPId = signal<any>(null);
  readonly selectedBooking = signal<any[]>([]);

  readonly activePartners = computed(() => {
    const fromDropdown = this.formValues().channel_partner_id;
    const gridSelections = this.selectedBooking().map(b => ({
      id: b.channel_partner_id,
      name: b.firm_name
    }));

    const partnersMap = new Map<any, string>();

    // Process grid selections first
    gridSelections.forEach(p => partnersMap.set(p.id, p.name));

    // Process dropdown selections
    if (fromDropdown) {
      const dropdownIds = Array.isArray(fromDropdown) ? fromDropdown : [fromDropdown];
      dropdownIds.forEach(id => {
        if (!partnersMap.has(id)) {
          const partner = this.allChannelPartnerList().find(p => p.channel_partner_id === id);
          partnersMap.set(id, partner ? partner.firm_name : `ID: ${id}`);
        }
      });
    }

    // Process single selectedCPId if any
    const singleId = this.selectedCPId();
    if (singleId && !partnersMap.has(singleId)) {
      const partner = this.allChannelPartnerList().find(p => p.channel_partner_id === singleId);
      partnersMap.set(singleId, partner ? partner.firm_name : `ID: ${singleId}`);
    }

    return Array.from(partnersMap.entries()).map(([id, name]) => ({ id, name }));
  });

  // Search subject for debounced partner search
  private readonly partnerSearchSubject = new Subject<string>();
  private readonly columnDynamicColorService = inject(ColumnDynamicColorService);

  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  readonly columnDefinitions: readonly ChannelPartnerTableColumn[] = [
    {
      key: 'actions',
      label: 'Action',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    { key: 'firm_name', label: 'Firm Name' },
    { key: 'rera', label: 'RERA' },
    { key: 'rera_approvel', label: 'RERA Approved', applyChequeStatusColor: true, cellStyle: ({ data }: { data: TableRowData }) => data ? this.columnDynamicColorService.getChequeStatusStyle((data as unknown as ChannelPartner).rera_approvel_id) : undefined },

    { key: 'sourcing_executive_name', label: 'Source Executive' },
    { key: 'sale_executive_name', label: 'Sales Executive' },

    { key: 'booking_count', label: 'Booking Count', isAmount: true },
    { key: 'token_count', label: 'Token Count', isAmount: true },
    { key: 'site_visit_count', label: 'Site Visit Count', isAmount: true },
    { key: 'latest_followup_message', label: 'Latest Followup Message' },
    { key: 'latest_followup_date', label: 'Latest Followup Date', type: 'date' },
    { key: 'latest_followup_prospect_count', label: 'Latest Followup Prospect Count', isAmount: true },
    { key: 'latest_followup_created_at', label: 'Latest Followup Created At', type: 'date' },
    { key: 'firm_email', label: 'Firm Email', type: 'sensitive' },
    { key: 'firm_phone', label: 'Firm Phone', type: 'sensitive' },
    { key: 'firm_city', label: 'Firm City' },

    { key: 'created_by_name', label: 'Created By' },
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
    source_executive_id: new FormControl<any | null>(null),
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
        source_executive_id: value.source_executive_id ?? null,
      }))
    ),
    {
      initialValue: {
        project_id: null,
        channel_partner_id: null,
        start_date: null,
        end_date: null,
        cp_start_date: null,
        cp_end_date: null,
        source_executive_id: null
      }
    }
  );
  fetchSalesExecutives(roleIds: number[]): void {
    this.store.setLoading(true);
    this.service.fetchSalesExecutives(roleIds).pipe(
      tap((res) => {
        const executives = (res || []).map((item) => ({
          ...item,
          full_name: `${item.first_name} ${item.last_name}`.trim(),
        }));
        this.store.patchState({ executives });
      }),
      finalize(() => this.store.setLoading(false))
    ).subscribe({
      error: (err) => this.store.setError('Failed to fetch executives')
    });
  }
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
    {
      action: 'addFollowUpCP',
      icon: 'add_comment',
      tooltip: 'Add Follow Up ',
      color: 'primary',
      disabled: false,
    },
    {
      action: 'viewAllCPData',
      icon: 'zoom_out_map',
      tooltip: 'View',
      color: 'primary',
      disabled: false,
    },
  ];

  readonly headerButtons = [
    {
      label: 'Assign Source Executive',
      icon: 'person_add',
      color: 'accent',
      disabled: () => this.activePartners().length === 0,
      action: () => this.openAssignSourceExecutiveDialog(),
      show: () => true,
    },
    {
      label: ' Add Channel Partner',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddEditCPDialog(),
      show: () => true,
    },

  ];

  // Computed signal for AG Grid payload
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
    this.fetchSalesExecutives([18]);
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
    source_executive_id: any | null;
  }): Record<string, unknown> {
    const filters: Record<string, unknown> = {};
    const loggedData = this.cpTargetLoggedData() as Record<string, unknown> | null;

    // Handle project_id - multi-select returns array
    if (formValues.project_id && Array.isArray(formValues.project_id) && formValues.project_id.length > 0) {
      filters['project_id'] = formValues.project_id;
    }
    if (this.roleId === 7) {
      filters['sales_executive_id'] = [this.userId];
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

    if (formValues.source_executive_id) {
      filters['source_executive_id'] = formValues.source_executive_id;
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
    this.agGridComponent?.refreshData();

  }

  getChannelPartnerActions(action: string, row: Record<string, unknown>): void {
    switch (action) {
      case 'deleteBooking':
        this.deleteChannelPartner(Number(row['channel_partner_id']));
        break;

      case 'editBooking':
        this.openAddEditCPDialog(row);
        break;

      case 'RERACertificate':
        this.openReceiptDialog(row);
        break;

      case 'RERAApprove':
        this.openRERADialog(row);
        break;

      case 'addFollowUpCP':
        this.openAddFollowUpDialog(row);
        break;

      case 'viewAllCPData':
        this.viewAllCPData(row);
        break;

      default:
        console.warn('Unknown action:', action);
        break;
    }
  }

  viewAllCPData(row: any): void {
    const slug = row.firm_name ? row.firm_name.replace(/\s+/g, '-').toLowerCase() : 'cp';
    this.router.navigate(['/single-cp-all-data', slug, row.channel_partner_id]);
  }

  openAddFollowUpDialog(row: Record<string, unknown>): void {
    const channelPartnerId = Number(row['channel_partner_id']);
    if (!channelPartnerId) {
      this.showError('Invalid channel partner.');
      return;
    }
    const dialogRef = this.dialog.open(AddFollowUpDialog, {
      width: '40vw',
      maxWidth: '50vw',
      data: {
        channel_partner_id: channelPartnerId,
        title: 'Add Follow Up' + ' - ' + (row['firm_name'] ?? undefined),
        addApi: 'add_cp_follow_up',
        fetchApi: 'fetch_cp_follow_up',
        showProspectCount: true
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridComponent?.refreshData();
      }
    });
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
      this.snackBar.open('RERA Certificate not found', 'Close', {
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

  openAddEditCPDialog(data?: any): void {
    const dialogRef = this.dialog.open(AddChannelPartnerComponent, {
      width: '80vw',
      maxWidth: '1000px',
      data: { data }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridComponent?.refreshData();
      }
    });
  }

  onCpchange(eventOrId: any, row?: any): void {
    if (row) {
      // Called from checkbox: (checkboxChange)="onCpchange($event.checked, $event.row)"
      this.selectedCPId.set(eventOrId ? row.channel_partner_id : null);
    } else {
      // Called from autocomplete: (selectedIdChange)="onCpchange($event)"
      this.selectedCPId.set(eventOrId);
    }
  }

  openAssignSourceExecutiveDialog(): void {
    const partners = this.activePartners();
    if (partners.length === 0) return;

    const dialogRef = this.dialog.open(AssignSourceExecutivesDialog, {
      width: '30vw',
      data: { partners }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridComponent?.refreshData();
      }
    });
  }
}
