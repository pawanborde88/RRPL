import {
    Component,
    ViewChild,
    OnInit,
    ChangeDetectionStrategy,
    signal,
    computed,
    inject,
    effect,
    DestroyRef
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import {
    combineLatest,
    distinctUntilChanged,
    filter,
    map,
    startWith,
    switchMap,
    of,
    catchError
} from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';

import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';


import { ReusableTableComponent, HeaderButton } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { CancelTokenDialogComponent } from '../../Toktens/cancel-token-dialog/cancel-token-dialog.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';

import { AllReceiptsDialogComponent } from '../all-receipts-dialog/all-receipts-dialog.component';
import { ImportFloorUnitsComponent } from '../../../Floor Unit/import-floor-units/import-floor-units.component';
import { EditBookingPageComponent } from '../edit-booking-page/edit-booking-page.component';
import { EnquiryManagementService } from '../../../Enquiry/services/enquiry-management.service';
import { AuthService } from '../../../../../Service/auth.service';
import { ColumnDynamicColorService } from '../../../../../Service/Column-Colors/column-dynamic-color.service';
import { CommonService } from '../../../../../Service/common/common.service';
import { BookingFilterService } from './services/booking-filter.service';
import { BookingUpdatedLogDialogComponent } from '../booking-updated-log-dialog/booking-updated-log-dialog.component';

// ==================== TYPE DEFINITIONS ====================

export interface BookingInfo {
    project_enq_id?: number;
    token_id?: number;
    floor_unit_id?: number;
    agreement_status_id?: number;
    disbursement_status_id?: number;
    [key: string]: unknown;
    project_name?: string;
    firm_name?: string;
    source_detail?: string;
    sales_executive?: string;
    closed_by_name?: string;
    booking_date?: string;
    booking_id?: number;
    floor_unit?: string;
    wing_name?: string;
    unit_type?: string;
    source?: string;
}

export interface Project {
    project_id: number;
    property_name: string;
    [key: string]: unknown;
}

export interface Wing {
    wing_id: number;
    wing_name: string;
    [key: string]: unknown;
}

export interface Floor {
    floor_id: number;
    floor_name: string;
    [key: string]: unknown;
}

export interface BookingFilterPayload {
    user_id?: number | null;
    project_id?: number | number[] | null;
    wing_id?: number | null;
    floor_id?: number | null;
    booking_status_id?: number | null;
    agreement_status_id?: number | null;
    booking_date?: string | Date | null;
    project_configuration_id?: number | null;
    start_date?: string | null;
    end_date?: string | null;
    sales_executive_id?: number | number[] | null;
    booking_id?: number | null;
    channel_partner_id?: number[] | null;
    source_id?: number | null;
    source_detail_id?: number | null;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface BookingColumn {
    key: string;
    label: string;
    type?: string;
    sticky?: boolean;
    disabled?: boolean;
    isAmount?: boolean;
    showAverage?: boolean;
    applyChequeStatusColor?: boolean;
    cellStyle?: (params: { data: BookingInfo }) => Record<string, string> | undefined;
}

interface BookingAction {
    action: string;
    icon: string;
    tooltip: string;
    color?: string;
    disabled?: boolean;
    show: () => boolean;
}

interface HistoryState {
    extraText?: string;
    data?: number | BookingInfo;
}

// ==================== CONSTANTS ====================

const ROLE_ADMIN = 2;

// ==================== COMPONENT ====================

@Component({
    selector: 'app-all-bookings',
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

    ],
    templateUrl: './all-bookings.component.html',
    styleUrl: './all-bookings.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllBookingsComponent implements OnInit {
    // ==================== DEPENDENCY INJECTION ====================
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly columnDynamicColorService = inject(ColumnDynamicColorService);
    private readonly commonService = inject(CommonService);
    private readonly filterService = inject(BookingFilterService);
    private readonly enquiryService: EnquiryManagementService = inject(EnquiryManagementService);
    private readonly destroyRef = inject(DestroyRef);

    // ==================== USER CONTEXT ====================
    private readonly roleId = this.authService.roleId();
    private readonly userId = this.authService.userId();

    // ==================== FORM ====================
    readonly bookingForm = new FormGroup({
        user_id: new FormControl<number>(this.userId),
        project_id: new FormControl<number | number[] | null>(null, [Validators.required]),
        wing_id: new FormControl<number | null>(null),
        floor_id: new FormControl<number | null>(null),
        booking_status_id: new FormControl<number | null>(null),
        agreement_status_id: new FormControl<number | null>(null),
        booking_date: new FormControl<Date | null>(null),
        project_configuration_id: new FormControl<number | null>(null),
        start_date: new FormControl<Date | null>(null),
        end_date: new FormControl<Date | null>(null),
        sales_executive_id: new FormControl<number | null>(null),
        source_id: new FormControl<any>(null),
        source_detail_id: new FormControl<any>(null),
        channel_partner_id: new FormControl<any>(null),
    });

    // ==================== STORE EMULATION ====================
    // Reactive form value signal
    private readonly formValue = toSignal(this.bookingForm.valueChanges.pipe(startWith(this.bookingForm.value)));

    // Emulating the store structure from AllEnquiryStore to match user's template request
    readonly store = {
        sources: signal<any[]>([]),
        sourceDetails: signal<any[]>([]),
        channelPartners: signal<any[]>([]),
        isChannelPartnerSource: computed(() => {
            const sourceId = this.formValue()?.source_id;
            return sourceId === '3' || sourceId === 3;
        }),
        isNotChannelPartnerSource: computed(() => {
            const sourceId = this.formValue()?.source_id;
            return sourceId && sourceId !== '3' && sourceId !== 3;
        })
    };

    // ==================== SIGNALS ====================
    readonly loading = signal<boolean>(false);
    readonly selectedBooking = signal<BookingInfo[]>([]);
    readonly allWingslist = signal<Wing[]>([]);
    readonly projectsList = signal<Project[]>([]);
    readonly FloorUnitDropdown = signal<Floor[]>([]);
    private readonly preservedBookingId = signal<number | null>(null);
    private cpTargetLoggedData: BookingInfo | null = null;

    // ==================== COMPUTED SIGNALS ====================
    readonly hasSelectedBooking = computed(() => this.selectedBooking().length > 0);
    readonly selectedBookingItem = computed(() => {
        const selected = this.selectedBooking();
        return selected.length > 0 ? selected[0] : null;
    });
    readonly preservedBookingIdValue = computed(() =>
        this.preservedBookingId() ?? this.cpTargetLoggedData?.booking_id ?? null
    );

    // ==================== VIEWCHILD ====================
    @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<BookingInfo>;

    // ==================== USER CONTEXT ====================


    // ==================== CONFIGURATION ====================
    private readonly useAgGrid = true;

    readonly bookingDisplayedColumns: BookingColumn[] = [
        {
            key: 'actions',
            label: 'Actions',
            type: 'actions',
            sticky: true,
            disabled: false,
        },
        { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },
        { key: 'project_name', label: 'Project Name' },
        { key: 'wing_name', label: 'wing' },
        { key: 'floor_unit', label: 'Unit No' },
        { key: 'floor_id', label: 'Floor No' },

        { key: 'unit_type', label: 'Unit Type' },
        { key: 'applicant_name', label: 'Client Name' },
        { key: 'sales_executive', label: 'Executive' },
        { key: 'closed_by_name', label: 'Closed By' },

        {
            key: 'agreement_status',
            label: 'Agreement Status',
            applyChequeStatusColor: true,
            cellStyle: ({ data }) => data ? this.columnDynamicColorService.getAgreementStatusStyle(data.agreement_status_id) : undefined,
        },
        {
            key: 'agreement_date',
            label: 'Agreement Date',
            type: 'mediumDate'
        },
        {
            key: 'disbursement_status',
            label: 'Disbursement',
            applyChequeStatusColor: true,
            cellStyle: ({ data }) => data ? this.columnDynamicColorService.getDisbursementStatusStyle(data.disbursement_status_id) : undefined,
        },
        {
            key: 'disbursement_date',
            label: 'Disbursement Date',
            type: 'mediumDate'
        },
        { key: 'booking_from', label: 'Booking From' },
        { key: 'token_type', label: 'Token Type' },
        { key: 'project_enq_id', label: 'Enquiry No' },
        { key: 'applicant_email', label: 'Email ID', type: 'sensitive' },
        { key: 'applicant_mobile', label: 'Mobile', type: 'sensitive' },
        { key: 'applicant_alternate_mobile', label: 'Alternate Mobile', type: 'sensitive' },
        { key: 'booking_amount', label: 'Booking Amount', isAmount: true },
        { key: 'transaction_date', label: 'Transaction Date', type: 'mediumDate' },
        { key: 'transaction_no', label: 'Transaction No' },
        { key: 'carpet', label: 'Carpet' },
        { key: 'balcony', label: 'Balcony' },
        { key: 'terrace', label: 'Terrace' },
        { key: 'rate', label: 'Rate', isAmount: true },
        { key: 'floor_rise_rate', label: 'Floor Rise Rate', isAmount: true },
        { key: 'floor_rise_amt', label: 'Floor Rise Amount', isAmount: true },
        { key: 'idc', label: 'IDC', isAmount: true },
        { key: 'market_value', label: 'Market value', isAmount: true },
        { key: 'basic_cost', label: 'Basic Cost', isAmount: true },
        { key: 'agreement_cost', label: 'Agreement Cost', isAmount: true },
        { key: 'gst_per', label: 'GST %' },
        { key: 'gst', label: 'GST', isAmount: true },
        { key: 'sd_per', label: 'SD %' },
        { key: 'stamp_duty', label: 'Stamp Duty', isAmount: true },
        { key: 'reg_per', label: 'Reg %' },
        { key: 'reg', label: 'Reg', isAmount: true },
        { key: 'society_for', label: 'Society For', isAmount: true },
        { key: 'legal', label: 'Legal', isAmount: true },
        { key: 'maintenance', label: 'Maintenance', isAmount: true },
        { key: 'corpus', label: 'Corpus', isAmount: true },
        { key: 'other', label: 'Other', isAmount: true },
        { key: 'parking_no', label: 'Parking No' },
        { key: 'parking_charges', label: 'Parking Charges', isAmount: true },
        { key: 'parking_type', label: 'Parking Type' },
        { key: 'package_total', label: 'Package Total', isAmount: true },
        { key: 'source', label: 'Source' },
        { key: 'source_detail', label: 'Source Type' },
        { key: 'firm_name', label: 'Channel Partner' },
        { key: 'source_description', label: 'Source Info', type: 'truncate' },
        { key: 'remark', label: 'Comment', type: 'truncate' },
        { key: 'offer_name', label: 'Offer Name', type: 'truncate' },
        { key: 'created_by_name', label: 'Created By' },
        { key: 'created_at', label: 'Created At', type: 'date' },
        { key: 'updated_by_name', label: 'Updated By' },
        { key: 'updated_at', label: 'Updated At', type: 'date' },
    ];

    readonly bookingActions: BookingAction[] = [
        {
            action: 'editBooking',
            icon: 'edit_note',
            tooltip: 'Edit Booking',
            color: 'primary',
            disabled: false,
            show: () => this.hasPermission('489'),
        },
        {
            action: 'viewBookingeditLog',
            icon: 'list_alt_check',
            tooltip: 'View Edit booking Log',
            color: 'primary',
            disabled: false,
            show: () => this.hasPermission('489'),
        },
        {
            action: 'cancelBooking',
            icon: 'cancel',
            tooltip: 'Cancel Booking',
            color: 'primary',
            show: () => this.hasPermission('490'),
        },
        {
            action: 'shareOnWhatsApp',
            icon: 'share',
            tooltip: 'Share Details',
            color: 'primary',
            show: () => this.hasPermission('663'),
        },
    ];

    readonly headerButtons: HeaderButton[] = [
        {
            label: 'Allotment',
            icon: 'receipt_long',
            color: 'primary',
            disabled: () => !this.hasSelectedBooking(),
            action: () => this.allotmentLetter(),
            show: () => this.hasPermission('482'),
        },
        {
            label: 'Cost Sheet',
            icon: 'receipt_long',
            color: 'primary',
            disabled: () => !this.hasSelectedBooking(),
            action: () => this.costSheetDialog(),
            show: () => this.hasPermission('483'),
        },
        {
            label: 'Booking Form',
            icon: 'request_quote',
            color: 'primary',
            disabled: () => !this.hasSelectedBooking(),
            action: () => this.bookingReceiptFormDialog(),
            show: () => this.hasPermission('484'),
        },
        {
            label: 'Receipt',
            icon: 'receipt_long',
            color: 'primary',
            disabled: () => !this.hasSelectedBooking(),
            action: () => this.allReceiptsDialog(),
            show: () => this.hasPermission('486'),
        },
        {
            label: 'Upload Booking',
            icon: 'post_add',
            color: 'primary',
            disabled: () => false,
            action: () => this.openImportFloorUnit(),
            show: () => this.hasPermission('593'),
        },
        {
            label: 'Add Booking',
            icon: 'add_circle',
            color: 'primary',
            disabled: () => false,
            action: () => this.router.navigate(['/add-bookings']),
            show: () => this.hasPermission('487'),
        },
    ];

    // ==================== LIFECYCLE ====================

    constructor() {
        // Effect to handle ag-grid refresh when preserved booking ID changes
        effect(() => {
            const bookingId = this.preservedBookingIdValue();
            if (bookingId && this.agGridTable) {
                this.agGridTable.refreshData();
            }
        });
    }

    ngOnInit(): void {
        this.initializeFromHistoryState();
        this.setupReactiveFormSubscriptions();
        this.loadInitialData();
        this.loadSources();
        this.setupSourceListeners();
    }

    private loadSources(): void {
        this.enquiryService.fetchSources()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((sources: any[]) => this.store.sources.set(sources || []));
    }

    private setupSourceListeners(): void {
        this.bookingForm.get('source_id')?.valueChanges
            .pipe(
                distinctUntilChanged(),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((sourceId: any) => {
                if (sourceId) {
                    this.enquiryService.fetchSourceDetails(sourceId)
                        .pipe(takeUntilDestroyed(this.destroyRef))
                        .subscribe((details: any[]) => this.store.sourceDetails.set(details || []));
                } else {
                    this.store.sourceDetails.set([]);
                }
            });
    }

    // ==================== PERMISSION HELPERS ====================
    readonly hasPermission = (permission: string): boolean =>
        this.authService.hasPermission(permission);

    readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
        this.authService.hasOnlyRoles(allowedRoles);

    // ==================== TRACKBY FUNCTIONS ====================
    readonly trackByBookingId = (_index: number, item: BookingInfo): number =>
        item.booking_id ?? _index;

    readonly trackByProjectId = (_index: number, item: Project): number =>
        item.project_id;

    readonly trackByWingId = (_index: number, item: Wing): number =>
        item.wing_id;

    readonly trackByFloorId = (_index: number, item: Floor): number =>
        item.floor_id;

    onPartnerSearch(searchText: string): void {
        const trimmedSearch = searchText.trim();
        if (trimmedSearch.length <= 3) {
            this.store.channelPartners.set([]);
            return;
        }

        this.enquiryService.searchChannelPartners(trimmedSearch)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                catchError((err) => {
                    console.error(err);
                    this.snackBar.open('Unable to fetch channel partners.', 'Close', { duration: 3000 });
                    return of([]);
                })
            )
            .subscribe((res: any) => {
                this.store.channelPartners.set(res || []);
            });
    }

    // ==================== INITIALIZATION ====================

    private initializeFromHistoryState(): void {
        const state = history.state as HistoryState;

        if (state.extraText === 'BookingSuccess' && typeof state.data === 'number') {
            this.bookingForm.patchValue({
                project_id: state.data,
            }, { emitEvent: false });
        }


    }

    private setupReactiveFormSubscriptions(): void {
        const projectIdControl = this.bookingForm.get('project_id');
        const wingIdControl = this.bookingForm.get('wing_id');

        if (!projectIdControl || !wingIdControl) return;

        // Project selection triggers wing loading
        projectIdControl.valueChanges.pipe(
            distinctUntilChanged(),
            filter((projectId) => !!projectId),
            switchMap((projectId) => {
                const normalizedIds = this.filterService.normalizeProjectId(projectId);
                return normalizedIds.length > 0
                    ? this.commonService.fetchWingDropdown(
                        normalizedIds.length === 1 ? normalizedIds[0] : normalizedIds
                    ).pipe(
                        map((wings) => wings),
                        catchError(() => {
                            this.showError('Failed to load wings.');
                            return of([]);
                        })
                    )
                    : of([]);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((wings) => {
            this.allWingslist.set(wings);
        });

        // Wing selection triggers floor loading
        combineLatest([
            projectIdControl.valueChanges.pipe(
                startWith(projectIdControl.value)
            ),
            wingIdControl.valueChanges.pipe(
                startWith(wingIdControl.value)
            )
        ]).pipe(
            filter(([projectId, wingId]) => !!projectId && !!wingId),
            distinctUntilChanged((prev, curr) =>
                prev[0] === curr[0] && prev[1] === curr[1]
            ),
            switchMap(([projectId, wingId]) => {
                const normalizedIds = this.filterService.normalizeProjectId(projectId);
                return normalizedIds.length > 0 && wingId
                    ? this.commonService.fetchFloorDropdown(
                        normalizedIds.length === 1 ? normalizedIds[0] : normalizedIds,
                        wingId
                    ).pipe(
                        catchError(() => {
                            this.showError('Failed to load floors.');
                            return of([]);
                        })
                    )
                    : of([]);
            }),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe((floors) => {
            this.FloorUnitDropdown.set(floors);
        });
    }

    private loadInitialData(): void {
        const userId = this.userId;
        this.commonService.fetchUserProjectDropdown(userId)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                catchError(() => {
                    this.showError('Unable to fetch projects.');
                    return of([]);
                })
            )
            .subscribe((projects) => {
                this.projectsList.set(projects);
            });
    }

    // ==================== DATA FETCHING ====================

    fetchAllBookings(clearPreservedBookingId = false): void {
        if (clearPreservedBookingId) {
            this.preservedBookingId.set(null);
        }

        if (this.useAgGrid && this.agGridTable) {
            this.agGridTable.refreshData();
        } else {
            this.loading.set(true);
            const payload = this.filterService.buildFilterPayload(
                this.bookingForm.value,
                this.preservedBookingIdValue()
            );

            this.commonService.fetchBookings(payload)
                .pipe(
                    takeUntilDestroyed(this.destroyRef),
                    catchError(() => {
                        this.loading.set(false);
                        this.showError('Unable to fetch bookings.');
                        return of([]);
                    })
                )
                .subscribe((bookings: any[]) => {
                    this.loading.set(false);
                    // Handle bookings if not using ag-grid
                });
        }
    }

    getAgGridApiPayload(): { filters: BookingFilterPayload } {
        return this.filterService.buildAgGridApiPayload(
            this.bookingForm.value,
            this.preservedBookingIdValue()
        );
    }

    // ==================== ACTION HANDLERS ====================

    onBookingAction(action: string, row: BookingInfo): void {
        const actionMap: Record<string, (row: BookingInfo) => void> = {

            'deleteBooking': (r) => this.deleteBookings(r.booking_id!),
            'editBooking': (r) => this.editBooking(r),
            'cancelBooking': (r) => this.cancelBooking(r),
            'viewBookingeditLog': (r) => this.viewBookingeditLog(r),
            'shareOnWhatsApp': (r) => this.shareOnWhatsApp(r),
        };

        const handler = actionMap[action];
        if (handler) {
            handler(row);
        } else {
            console.warn('Unknown action:', action);
        }
    }

    readonly onBookingSelectionChange = (checked: boolean, booking: BookingInfo): void => {
        this.selectedBooking.set(checked ? [booking] : []);
    };

    // ==================== CRUD OPERATIONS ====================

    viewBookingeditLog(row: BookingInfo): void {
        const dialogRef = this.dialog.open(BookingUpdatedLogDialogComponent, {
            minWidth: '70vw',
            maxWidth: '50vh',
            data: {
                booking_id: row.booking_id,
            },
        });
    }
    shareOnWhatsApp(row: BookingInfo): void {
        const projectName = row['project_name']
            ? String(row['project_name']).toUpperCase()
            : 'N/A';

        const source = row['source'] || 'N/A';
        const isCP = source?.toUpperCase() === 'CP';

        const firmSection = isCP
            ? `🏢 *Firm:* ${row['firm_name'] || 'N/A'}\n\n`
            : '';

        const sourceDetailSection = !isCP
            ? `📌 *Source Detail:* ${row['source_detail'] || 'N/A'}\n\n`
            : '\n';

        const message =
            `🎉 *CONGRATULATIONS!* 🎉\n\n` +

            `               🏢 *${projectName}*\n\n` +

            `📅 *Booking Date:* ${row['booking_date'] || 'N/A'}\n` +

            `👤 *Client:* ${row['applicant_name'] || 'N/A'}\n` +
            `🚪 *Unit No:* ${row['floor_unit'] || 'N/A'}\n` +
            `🏬 *Wing:* ${row['wing_name'] || 'N/A'}\n` +
            `📌 *Unit Type:* ${row['unit_type'] || 'N/A'}\n` +
            `📌 *Source:* ${source}\n` +

            sourceDetailSection +   // 👈 only when NOT CP
            firmSection +           // 👈 only when CP

            `🤝 *TEAM DETAILS*\n` +
            `👨‍💼 *Attended By:* ${row['sales_executive'] || 'N/A'}\n` +
            `🏆 *Closed By:* ${row['closed_by_name'] || 'N/A'}\n\n` +

            `🙏 *Thank you for choosing us!*`;

        if (navigator.share) {
            navigator.share({
                title: 'Booking Details',
                text: message
            }).catch(err => console.error('Share failed:', err));
        } else {
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
        }
    }
    cancelBooking(row: BookingInfo): void {
        const dialogRef = this.dialog.open(CancelTokenDialogComponent, {
            width: 'auto',
            data: {
                ...row,
                title: 'Cancel Booking',
                message: 'Are you sure you want to cancel this booking?',
                for: this.bookingForm,
            },
        });

        dialogRef.afterClosed()
            .pipe(
                filter((result) => !!result),
                switchMap((result) =>
                    this.commonService.cancelBooking(
                        row.booking_id!,
                        this.userId,
                        result.cancel_remark || ''
                    ).pipe(
                        catchError(() => {
                            this.showError('Failed to cancel booking.');
                            return of({ success: false, message: 'Failed to cancel booking.' });
                        })
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((response) => {
                if (response.success) {
                    this.fetchAllBookings();
                    this.dialog.open(SuccessDialogComponent, {
                        width: 'auto',
                        data: { message: response.message || 'Booking cancelled successfully!' },
                    });
                } else {
                    this.showError(response.message || 'Failed to cancel booking.');
                }
            });
    }

    editBooking(booking: BookingInfo): void {
        const dialogRef = this.dialog.open(EditBookingPageComponent, {
            width: 'auto',
            data: { rowData: booking },
        });

        dialogRef.afterClosed()
            .pipe(
                filter((result) => !!result),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {
                this.fetchAllBookings();
            });
    }

    deleteBookings(bookingId: number): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '25vw',
            data: { message: 'Are you sure you want to delete Booking?' },
        });

        dialogRef.afterClosed()
            .pipe(
                filter((result) => !!result),
                switchMap(() =>
                    this.commonService.deleteBooking(bookingId).pipe(
                        catchError(() => {
                            this.showError('Unable to delete booking.');
                            return of({ success: false, message: 'Unable to delete booking.' });
                        })
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((response) => {
                if (response.success) {
                    this.showSuccess('Booking deleted successfully');
                    this.fetchAllBookings();
                } else {
                    this.showError(response.message || 'Unable to delete booking.');
                }
            });
    }

    // ==================== DIALOG HANDLERS ====================

    readonly costSheetDialog = (): void => {
        const booking = this.selectedBookingItem();
        if (!booking) return;

        this.dialog.open(UnifiedDocumentDialogComponent, {
            width: 'auto',
            height: 'auto',
            maxWidth: '90vw',
            maxHeight: '90vh',
            panelClass: 'custom-dialog-container',
            data: {
                dialogType: DocumentDialogType.BOOKING_COST_SHEET,
                rowData: booking,
            },
        });
    };

    readonly allotmentLetter = (): void => {
        const booking = this.selectedBookingItem();
        if (!booking) return;

        this.dialog.open(UnifiedDocumentDialogComponent, {
            width: 'auto',
            height: 'auto',
            maxWidth: '90vw',
            maxHeight: '90vh',
            panelClass: 'custom-dialog-container',
            data: {
                dialogType: DocumentDialogType.ALLOTMENT_LETTER,
                rowData: booking,
            },
        });
    };

    readonly bookingReceiptFormDialog = (): void => {
        const booking = this.selectedBookingItem();
        if (!booking) return;

        this.dialog.open(UnifiedDocumentDialogComponent, {
            width: 'auto',
            height: 'auto',
            maxWidth: '90vw',
            maxHeight: '90vh',
            panelClass: 'custom-dialog-container',
            data: {
                dialogType: DocumentDialogType.BOOKING_FORM,
                rowData: booking,
            },
        });
    };

    readonly allReceiptsDialog = (): void => {
        const booking = this.selectedBookingItem();
        if (!booking) return;

        const dialogRef = this.dialog.open(AllReceiptsDialogComponent, {
            minWidth: '60vw',
            maxWidth: '50vh',
            maxHeight: '100vh',
            data: {
                bookingId: booking.booking_id,
                selectedBooking: booking.floor_unit_id,
            },
        });

        dialogRef.afterClosed()
            .pipe(
                filter((result) => !!result),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe(() => {
                this.fetchAllBookings();
            });
    };

    openImportFloorUnit(): void {
        const dialogRef = this.dialog.open(ImportFloorUnitsComponent, {
            width: '500px',
            disableClose: true,
            data: {
                for: 'bookingImport',
                API_URL: 'import_booking',
            },
        });

        dialogRef.afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
                if (res) {
                    this.fetchAllBookings();
                }
            });
    }

    // ==================== FILTER HANDLING ====================

    handleAdvancedFilterApplied(filterData: Partial<BookingFilterPayload>): void {
        const updates: Partial<{
            user_id: number | null;
            project_id: number | number[] | null;
            wing_id: number | null;
            floor_id: number | null;
            booking_status_id: number | null;
            agreement_status_id: number | null;
            booking_date: Date | null;
            project_configuration_id: number | null;
            start_date: Date | null;
            end_date: Date | null;
            sales_executive_id: number | number[] | null;
        }> = {};

        // Load wings if project is selected
        if (filterData.project_id) {
            updates.project_id = filterData.project_id;
            const normalizedIds = this.filterService.normalizeProjectId(filterData.project_id);
            this.commonService.fetchWingDropdown(
                normalizedIds.length === 1 ? normalizedIds[0] : normalizedIds
            )
                .pipe(
                    takeUntilDestroyed(this.destroyRef),
                    catchError(() => {
                        this.showError('Failed to load wings.');
                        return of([]);
                    })
                )
                .subscribe((wings) => {
                    this.allWingslist.set(wings);
                });
        }

        // Load floors if wing and project are selected
        if (filterData.wing_id && filterData.project_id) {
            updates.wing_id = filterData.wing_id;
            const normalizedIds = this.filterService.normalizeProjectId(filterData.project_id);
            this.commonService.fetchFloorDropdown(
                normalizedIds.length === 1 ? normalizedIds[0] : normalizedIds,
                filterData.wing_id
            )
                .pipe(
                    takeUntilDestroyed(this.destroyRef),
                    catchError(() => {
                        this.showError('Failed to load floors.');
                        return of([]);
                    })
                )
                .subscribe((floors) => {
                    this.FloorUnitDropdown.set(floors);
                });
        }

        // Update other filter fields
        if (filterData.floor_id) updates.floor_id = filterData.floor_id;
        if (filterData.booking_status_id) updates.booking_status_id = filterData.booking_status_id;
        if (filterData.agreement_status_id) updates.agreement_status_id = filterData.agreement_status_id;
        if (filterData.sales_executive_id) updates.sales_executive_id = filterData.sales_executive_id;
        if (filterData.start_date) {
            updates.start_date = typeof filterData.start_date === 'string'
                ? new Date(filterData.start_date)
                : filterData.start_date;
        }
        if (filterData.end_date) {
            updates.end_date = typeof filterData.end_date === 'string'
                ? new Date(filterData.end_date)
                : filterData.end_date;
        }

        // Convert Date objects to strings for form compatibility
        const formUpdates = {
            ...updates,
            start_date: updates.start_date
                ? (typeof updates.start_date === 'string' ? new Date(updates.start_date) : updates.start_date)
                : null,
            end_date: updates.end_date
                ? (typeof updates.end_date === 'string' ? new Date(updates.end_date) : updates.end_date)
                : null,
        };
        this.bookingForm.patchValue(formUpdates as any, { emitEvent: false });
        this.fetchAllBookings(true);
    }

    // ==================== HELPER METHODS ====================

    private showError(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: ['snackbar-error'],
        });
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
        });
    }
}
