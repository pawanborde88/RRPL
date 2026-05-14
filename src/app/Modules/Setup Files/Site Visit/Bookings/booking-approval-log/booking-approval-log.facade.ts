import { Injectable } from '@angular/core';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Injectable({
    providedIn: 'root'
})
export class BookingApprovalLogFacade {

    readonly apiEndpoint = 'fetch_booking_approval_logs';

    // Column Definitions
    readonly columns: readonly TableColumn[] = [
        {
            key: 'actions',
            label: 'Actions',
            type: 'actions',
            sticky: true,
            disabled: false,
        },
        {
            key: 'log_info',
            label: 'Primary Information',
            headerClass: 'log-bg-blue',
            children: [
                { key: 'property_name', label: 'Project', headerClass: 'log-bg-blue' },
                { key: 'wing_name', label: 'Wing', headerClass: 'log-bg-blue' },
                { key: 'floor_unit', label: 'Unit', headerClass: 'log-bg-blue' },
                { key: 'full_name', label: 'Customer', headerClass: 'log-bg-blue' },
            ]
        },
        {
            key: 'source_changes',
            label: 'Source Modifications',
            headerClass: 'log-bg-orange',
            children: [
                {
                    key: 'source',
                    label: 'Source',
                    headerClass: 'log-bg-orange',
                    children: [
                        { key: 'changes.0.existing_value', label: 'Previous', headerClass: 'log-bg-previous', cellClass: 'log-bg-previous' },
                        { key: 'changes.0.requested_value', label: 'Requested', headerClass: 'log-bg-requested', cellClass: 'log-bg-requested' }
                    ]
                },
                {
                    key: 'source_detail',
                    label: 'Source Detail',
                    headerClass: 'log-bg-orange',
                    children: [
                        { key: 'changes.2.existing_value', label: 'Previous', headerClass: 'log-bg-previous', cellClass: 'log-bg-previous' },
                        { key: 'changes.2.requested_value', label: 'Requested', headerClass: 'log-bg-requested', cellClass: 'log-bg-requested' }
                    ]
                },
                {
                    key: 'cp',
                    label: 'Channel Partner',
                    headerClass: 'log-bg-orange',
                    children: [
                        { key: 'changes.4.existing_value', label: 'Previous', headerClass: 'log-bg-previous', cellClass: 'log-bg-previous' },
                        { key: 'changes.4.requested_value', label: 'Requested', headerClass: 'log-bg-requested', cellClass: 'log-bg-requested' }
                    ]
                },
                {
                    key: 'source_desc',
                    label: 'Source Description',
                    headerClass: 'log-bg-orange',
                    children: [
                        { key: 'changes.7.existing_value', label: 'Previous', headerClass: 'log-bg-previous', cellClass: 'log-bg-previous' },
                        { key: 'changes.7.requested_value', label: 'Requested', headerClass: 'log-bg-requested', cellClass: 'log-bg-requested' }
                    ]
                }
            ]
        },
        {
            key: 'execution_changes',
            label: 'Booking & Execution',
            headerClass: 'log-bg-emerald',
            children: [
                {
                    key: 'booking_date_change',
                    label: 'Booking Date',
                    headerClass: 'log-bg-emerald',
                    children: [
                        { key: 'changes.6.existing_value', label: 'Previous', headerClass: 'log-bg-previous', cellClass: 'log-bg-previous' },
                        { key: 'changes.6.requested_value', label: 'Requested', headerClass: 'log-bg-requested', cellClass: 'log-bg-requested' }
                    ]
                },
                {
                    key: 'closed_by',
                    label: 'Closed By',
                    headerClass: 'log-bg-emerald',
                    children: [
                        { key: 'changes.1.existing_value', label: 'Previous', headerClass: 'log-bg-previous', cellClass: 'log-bg-previous' },
                        { key: 'changes.1.requested_value', label: 'Requested', headerClass: 'log-bg-requested', cellClass: 'log-bg-requested' }
                    ]
                },
                {
                    key: 'source_exec',
                    label: 'Source Executive',
                    headerClass: 'log-bg-emerald',
                    children: [
                        { key: 'changes.3.existing_value', label: 'Previous', headerClass: 'log-bg-previous', cellClass: 'log-bg-previous' },
                        { key: 'changes.3.requested_value', label: 'Requested', headerClass: 'log-bg-requested', cellClass: 'log-bg-requested' }
                    ]
                },
                {
                    key: 'sales_exec',
                    label: 'Sales Executive',
                    headerClass: 'log-bg-emerald',
                    children: [
                        { key: 'changes.5.existing_value', label: 'Previous', headerClass: 'log-bg-previous', cellClass: 'log-bg-previous' },
                        { key: 'changes.5.requested_value', label: 'Requested', headerClass: 'log-bg-requested', cellClass: 'log-bg-requested' }
                    ]
                }
            ]
        },
        {
            key: 'status_audit',
            label: 'Approval Status & Audit',
            headerClass: 'log-bg-purple',
            children: [
                { key: 'approval_status', label: 'Status', type: 'status', headerClass: 'log-bg-purple', cellClass: 'log-bg-purple' },
                { key: 'created_at', label: 'Request Date', type: 'date', headerClass: 'log-bg-purple' },
                { key: 'requested_by', label: 'Requested By', headerClass: 'log-bg-purple' },
                { key: 'approved_by', label: 'Approved By', headerClass: 'log-bg-purple' },
                { key: 'request_remarks', label: 'Request Remark', headerClass: 'log-bg-purple' },
                { key: 'approval_remarks', label: 'Approval Remark', headerClass: 'log-bg-purple' },


            ]
        }
    ] as const;
}
