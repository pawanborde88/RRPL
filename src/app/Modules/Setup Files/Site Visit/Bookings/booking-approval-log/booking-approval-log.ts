import { CommonModule } from '@angular/common';

import { Component, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

import { RouterModule } from '@angular/router';

import { AngularMaterialModule } from '../../../../../../angular-material.module';

import { environment } from '../../../../../../environments/environment';

import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TemplateComponent } from '../../../../../Common/template/template.component';

import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';

import { BookingApprovalLogFacade } from './booking-approval-log.facade';

import { CommonService } from '../../../../../Service/common/common.service';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { catchError, filter, of, switchMap } from 'rxjs';

import { AuthService } from '../../../../../Service/auth.service';

import { HttpClient } from '@angular/common/http';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { CancelTokenDialogComponent } from '../../Toktens/cancel-token-dialog/cancel-token-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ReceiptPreviewDialogComponent } from '../../../Post Sales/Recovery/receipt-preview-dialog/receipt-preview-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    approval_log_id?: number;
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



interface BookingFilterForm {

    project_id: FormControl<any[] | null>;

}



interface TableColumn {

    key: string;

    label: string;

    type?: string;

    isAmount?: boolean;

    sticky?: boolean;

    disabled?: boolean;

}



@Component({

    selector: 'app-booking-approval-log',

    imports: [

        CommonModule,

        RouterModule,

        TemplateComponent,

        BreadcrumbComponent,

        AngularMaterialModule,

        FormsModule,

        ReactiveFormsModule,



        AutocompleteReusableComponent,







        MatTableModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        ConfigurableAgGridDataComponent
    ],

    templateUrl: './booking-approval-log.html',

    styleUrl: './booking-approval-log.scss',

})

export class BookingApprovalLog implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);

    private readonly roleId = this.authService.roleId();
    readonly storageUrl = environment.STORAGE_URL;

    constructor() {
        this.bookingForm = new FormGroup({
            project_id: new FormControl<any>(null, Validators.required),
        });
    }
    ngOnInit(): void {

        this.loadInitialData()

    }

    // Dependency Injection




    readonly facade = inject(BookingApprovalLogFacade);

    private readonly commonService = inject(CommonService);

    private readonly http = inject(HttpClient);

    readonly projectsList = signal<Project[]>([]);

    private readonly destroyRef = inject(DestroyRef);

    private readonly userId = this.authService.userId();

    // Expose facade properties for template
    readonly columns = this.facade.columns;
    readonly apiEndpoint = this.facade.apiEndpoint;

    @ViewChild(ConfigurableAgGridDataComponent) grid!: ConfigurableAgGridDataComponent;
    readonly hasPermission = (permission: string): boolean =>
        this.authService.hasPermission(permission);

    readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
        this.authService.hasOnlyRoles(allowedRoles);

    // Actions Configuration
    readonly actions = [
        {
            action: 'rejectBookingApprove',
            icon: 'cancel',
            tooltip: 'Reject Booking Approve',
            color: 'primary',
            show: () => this.hasPermission('672'),

        },
        {
            action: 'AcceptBookingApprove',
            icon: 'check',
            tooltip: 'Accept Booking Approve',
            color: 'primary',
            show: () => this.hasPermission('671'),

        },
        {
            action: 'viewAttachment',
            icon: 'attach_file',
            tooltip: 'View Attachment',
            color: 'accent',
            disabled: (row: any) => !row['approval_attachment'],
            show: () => this.hasPermission('671'),


        },

    ];

    // Handle Action Clicks
    onBookingAction(action: string, row: BookingInfo): void {
        const actionMap: Record<string, (row: BookingInfo) => void> = {

            'rejectBookingApprove': (r) => this.rejectBookingApprove(r),
            'AcceptBookingApprove': (r) => this.AcceptBookingApprove(r),
            'viewAttachment': (r) => this.openPreviewDialog(r, 'approval_attachment', 'Attachment'),

        };

        const handler = actionMap[action];
        if (handler) {
            handler(row);
        } else {
            console.warn('Unknown action:', action);
        }
    }

    approvalLogs = signal<any[]>([]);
    isLoading = signal(false);


    // Configuration properties

    private readonly baseUrl = environment.API_URL;
    openPreviewDialog(receiptData: any, field: string = 'approval_attachment', title: string = 'Attachment Details'): void {
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
            width: 'auto',
            height: 'auto',
            maxWidth: '50vw',
            maxHeight: '60vh',
            data: {
                title: title,
                fileUrl: fileUrl,
            },
        });
    }

    rejectBookingApprove(row: BookingInfo): void {
        const dialogRef = this.dialog.open(CancelTokenDialogComponent, {
            width: 'auto',
            height: 'auto',
            maxWidth: '50vw',
            maxHeight: '50vh',
            data: {
                ...row,
                title: 'Reject Booking Approve',
                message: 'Are you sure you want to reject this booking?',
                label: 'Reject Remark',
                placeholder: 'Please enter reason for rejection',
                for: this.bookingForm,
            },
        });

        dialogRef.afterClosed()
            .pipe(
                filter((result) => !!result),
                switchMap((result) =>
                    this.commonService.rejectBookingChanges({
                        approval_log_id: Number(row['approval_log_id']),
                        approved_by: this.userId,
                        approval_remarks: result.cancel_remark || 'Rejected successfully'
                    }).pipe(
                        catchError(() => {
                            return of({ success: false, message: 'Failed to reject booking.' });
                        })
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((response) => {
                this.fetchAllBookings();
            });
    }
    AcceptBookingApprove(row: BookingInfo): void {
        const dialogRef = this.dialog.open(CancelTokenDialogComponent, {
            width: 'auto',
            height: 'auto',
            maxWidth: '50vw',
            maxHeight: '60vh',
            data: {
                ...row,
                title: 'Accept Booking Approve',
                message: 'Are you sure you want to Accept this Booking Approve?',
                label: 'Approval Remark',
                placeholder: 'Please enter approval remarks',
                for: this.bookingForm,
            },
        });

        dialogRef.afterClosed()
            .pipe(
                filter((result) => !!result),
                switchMap((result) =>
                    this.commonService.approveBookingChanges({
                        approval_log_id: Number(row['approval_log_id']),
                        approved_by: this.userId,
                        approval_remarks: result.cancel_remark || 'Approved successfully'
                    }).pipe(
                        catchError(() => {
                            return of({ success: false, message: 'Failed to approve booking.' });
                        })
                    )
                ),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((response) => {
                this.fetchAllBookings();
            });
    }


    // Form definition

    bookingForm: FormGroup<BookingFilterForm> = new FormGroup({

        project_id: new FormControl<any>(null, Validators.required),

    });

    private loadInitialData(): void {

        const userId = this.userId;

        this.commonService.fetchUserProjectDropdown(userId)

            .pipe(

                takeUntilDestroyed(this.destroyRef),

                catchError(() => {

                    return of([]);

                })

            )

            .subscribe((projects) => {

                this.projectsList.set(projects);

            });

    }

    payload(): any {
        const formValues = this.bookingForm.value;
        return {
            filters: {
                project_id: formValues.project_id,
                ...(this.roleId === 14 && { requested_by: this.userId })
            }
        };
    }
    // Method to handle filter button click
    fetchAllBookings(): void {
        if (!this.bookingForm.valid) return;

        if (this.grid) {
            this.grid.refreshData();
        }
    }
}

