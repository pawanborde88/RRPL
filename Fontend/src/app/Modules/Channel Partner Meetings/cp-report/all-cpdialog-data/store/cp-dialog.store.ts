import { Injectable, computed, signal } from '@angular/core';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';

export type DialogType = 'site_visit' | 'token' | 'booking' | 'unique_cp' | 'retention' | 'default';

export interface DialogData {
    readonly rowData?: Record<string, unknown>;
    readonly apiEndpoint?: string;
    readonly payload?: Record<string, unknown>;
    readonly type?: DialogType;
}

export interface DialogState {
    data: DialogData;
}

const INITIAL_STATE: DialogState = {
    data: {}
};

@Injectable({
    providedIn: 'root' // Identifying as a service, acting as a store
})
export class CpDialogStore {
    // State signal
    private readonly state = signal<DialogState>(INITIAL_STATE);

    // Selectors
    readonly data = computed(() => this.state().data);
    readonly type = computed<DialogType>(() => this.state().data.type ?? 'default');
    readonly rowData = computed(() => this.state().data.rowData ?? {});
    readonly payload = computed(() => this.state().data.payload ?? {});

    readonly dialogTitle = computed(() => this.getDialogTitleForType(this.type()));
    readonly idProperty = computed(() => this.getUniqueKeyForType(this.type()));
    readonly columnDefinitions = computed(() => this.getColumnDefinitionsForType(this.type()));

    readonly apiEndpoint = computed(() => {
        const currentType = this.type();
        const specificEndpoint = this.state().data.apiEndpoint; // Prefer direct endpoint if provided

        const endpointMap: Record<DialogType, string> = {
            site_visit: 'fetch_project_enquiries',
            token: 'fetch_all_token',
            booking: 'fetch_all_bookings',
            unique_cp: 'fetch_all_cp_site_visit_report',
            retention: 'fetch_all_cp_site_visit_report',
            default: specificEndpoint ?? ''
        };
        return endpointMap[currentType] || endpointMap.default;
    });

    readonly agGridPayload = computed(() => {
        const basePayload = { ...this.payload() };
        return {
            offset: 0,
            limit: 100,
            sortBy: 'created_at',
            sortOrder: 'desc' as const,
            search: '',
            filters: basePayload
        } as const;
    })

    // Actions
    initialize(data: DialogData) {
        this.state.set({ data });
    }

    // --- Logic Helpers (Moved from Component) ---

    private getUniqueKeyForType(type: DialogType): string {
        const keyMap: Record<DialogType, string> = {
            site_visit: 'site_visit_id',
            token: 'token_id',
            booking: 'booking_id',
            unique_cp: 'channel_partner_id',
            retention: 'channel_partner_id',
            default: 'id',
        };
        return keyMap[type] || keyMap.default;
    }

    private getDialogTitleForType(type: DialogType): string {
        const titleMap: Record<DialogType, string> = {
            site_visit: 'Site Visit Details',
            token: 'Token Details',
            booking: 'Booking Details',
            unique_cp: 'Unique Channel Partner Details',
            retention: 'Retention Details',
            default: 'Channel Partner Details',
        };
        return titleMap[type] || titleMap.default;
    }

    private getColumnDefinitionsForType(type: DialogType): readonly TableColumn[] {
        const columnMaps: Record<DialogType, readonly TableColumn[]> = {
            site_visit: this.getSiteVisitColumns(),
            token: this.getTokenColumns(),
            booking: this.getBookingColumns(),
            unique_cp: this.getUniqueCPColumns(),
            retention: this.getRetentionColumns(),
            default: [{ key: 'sr_no', label: 'Sr.No', type: 'index' }]
        };
        return columnMaps[type] || columnMaps.default;
    }

    // --- Column Definitions ---

    private getSiteVisitColumns(): readonly TableColumn[] {
        return [
            { key: 'project_enq_id', label: 'Client ID' },
            { key: 'project_name', label: 'Project Name' },
            { key: 'enquiry_date', label: 'Date', type: 'mediumDate' },
            { key: 'follow_up_date', label: 'Follow-up Date', type: 'mediumDate' },
            { key: 'site_visit_date', label: 'Site Visit Date', type: 'mediumDate' },
            { key: 'full_name', label: 'Customer Name' },
            { key: 'project_configuration', label: 'Configuration' },
            { key: 'min_budget', label: 'Min Budget', isAmount: true },
            { key: 'max_budget', label: 'Max Budget', isAmount: true },
            { key: 'sales_executive', label: 'Sales Executive' },
            { key: 'mobile_no', label: 'Mobile No', type: 'sensitive' },
            { key: 'email_id', label: 'Email ID', type: 'sensitive' },
            { key: 'lead_level', label: 'Enquiry Level' },
            { key: 'call_status', label: 'Call Status' },
            { key: 'remark', label: 'Remark', type: 'truncate' },
            { key: 'source', label: 'Visit Source' },
            { key: 'firm_name', label: 'Channel Partner' },
            { key: 'source_description', label: 'Source Description' },
            { key: 'source_detail', label: 'Source Type' },
            { key: 'sourcing_manager', label: 'Sourcing Manager' },
            { key: 'is_booked', label: 'Booked' },
            { key: 'is_imported', label: 'Imported' },
            { key: 'age_range', label: 'Age Range' },
            { key: 'alternate_mob_no', label: 'Secondary Mobile No', type: 'sensitive' },
            { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
            { key: 'preferred_location', label: 'Preferred Location' },
            { key: 'current_living_place', label: 'Current Living Place' },
            { key: 'company_name', label: 'Company Name' },
            { key: 'buying_purpose', label: 'Buying Purpose' },
            { key: 'possession_req', label: 'Possession Req' },
            { key: 'booking_plan_within', label: 'Booking Plan Within' },
            { key: 'job_location', label: 'Job Location' },
            { key: 'industry', label: 'Industry' },
            { key: 'created_by', label: 'Created By' },
            { key: 'updated_by', label: 'Updated By' },
            { key: 'created_at', label: 'Created At', type: 'date' },
            { key: 'updated_at', label: 'Updated At', type: 'date' },
        ] as const;
    }

    private getTokenColumns(): readonly TableColumn[] {
        return [
            { key: 'token_id', label: 'EOI ID' },
            { key: 'token_date', label: 'EOI Date', type: 'mediumDate' },
            { key: 'customer_name', label: 'Client Name' },
            { key: 'property_name', label: 'Project Name' },
            { key: 'wing_name', label: 'Wing' },
            { key: 'unit_type', label: 'Unit Type' },
            { key: 'preference_name', label: 'Configuration' },
            { key: 'floor_unit', label: 'Unit No' },
            { key: 'token_no', label: 'EOI No' },
            { key: 'token_type', label: 'EOI Type' },
            { key: 'token_amount', label: 'EOI Amount', isAmount: true },
            { key: 'balance', label: 'Balance', isAmount: true },
            { key: 'amount_paid', label: 'Pay Till Date' },
            { key: 'booked', label: 'Booking Status' },

            { key: 'mob_no', label: 'Mobile Number', type: 'sensitive' },
            { key: 'email_id', label: 'Email ID', type: 'sensitive' },
            { key: 'payment_status', label: 'Payment Status' },
            { key: 'sales_executive_name', label: 'Executive' },
            { key: 'source', label: 'Source' },
            { key: 'source_detail', label: 'Source Type' },
            { key: 'channel_partner', label: 'Channel Partner' },
            { key: 'source_description', label: 'Source Description' },
            { key: 'created_by_name', label: 'Created By' },
            { key: 'created_at', label: 'Created At', type: 'date' },
            { key: 'updated_at', label: 'Updated At', type: 'date' },
            { key: 'updated_by_name', label: 'Updated By' },
        ] as const;
    }

    private getBookingColumns(): readonly TableColumn[] {
        return [
            { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },
            { key: 'project_name', label: 'Project Name' },
            { key: 'wing_name', label: 'Wing' },
            { key: 'floor_unit', label: 'Unit No' },
            { key: 'unit_type', label: 'Unit Type' },
            { key: 'applicant_name', label: 'Client Name' },
            { key: 'sales_executive', label: 'Executive' },
            { key: 'booking_status', label: 'Booking Status' },
            { key: 'booking_from', label: 'Booking From' },
            { key: 'token_type', label: 'Token Type' },
            { key: 'project_enq_id', label: 'Enquiry No' },
            { key: 'applicant_email', label: 'Email ID', type: 'sensitive' },
            { key: 'applicant_mobile', label: 'Mobile', type: 'sensitive' },
            { key: 'applicant_alternate_mobile', label: 'Alternate Mobile', type: 'sensitive' },
            { key: 'disbursement_status', label: 'Disbursement' },
            { key: 'booking_amount', label: 'Booking Amount', isAmount: true },
            { key: 'transaction_date', label: 'Transaction Date', type: 'mediumDate' },
            { key: 'transaction_no', label: 'Transaction No' },
            { key: 'carpet', label: 'Carpet', isAmount: true },
            { key: 'balcony', label: 'Balcony' },
            { key: 'terrace', label: 'Terrace' },
            { key: 'rate', label: 'Rate', isAmount: true },
            { key: 'floor_rise_rate', label: 'Floor Rise Rate', isAmount: true },
            { key: 'floor_rise_amt', label: 'Floor Rise Amount', isAmount: true },
            { key: 'idc', label: 'IDC', isAmount: true },
            { key: 'market_value', label: 'Market value', isAmount: true },
            { key: 'basic_cost', label: 'Basic Cost', isAmount: true },
            { key: 'agreement_cost', label: 'Agreement Cost', isAmount: true },
            { key: 'gst_per', label: 'gst %' },
            { key: 'gst', label: 'GST', isAmount: true },
            { key: 'reg', label: 'Reg', isAmount: true },
            { key: 'society_for', label: 'Society For', isAmount: true },
            { key: 'legal', label: 'Legal', isAmount: true },
            { key: 'maintenance', label: 'Maintenance', isAmount: true },
            { key: 'corpus', label: 'Corpus', isAmount: true },
            { key: 'other', label: 'Other', isAmount: true },
            { key: 'parking_no', label: 'Parking No' },
            { key: 'parking_charges', label: 'Parking Charges', isAmount: true },
            { key: 'package_total_with_parking', label: 'Package Total With Parking', isAmount: true },
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
        ] as const;
    }

    private getUniqueCPColumns(): readonly TableColumn[] {
        return [
            { key: 'project_names', label: 'Project Name' },
            { key: 'firm_name', label: 'Firm Name' },
            { key: 'site_visit_count', label: 'CP Visit' },
            { key: 'token_count', label: 'Token Count' },
            { key: 'booking_count', label: 'CP Booking' },
            { key: 'firm_address', label: 'Firm Address' },
            { key: 'firm_email', label: 'Firm Email', type: 'sensitive' },
            { key: 'firm_phone', label: 'Firm Mobile', type: 'sensitive' },

        ] as const;
    }
    private getRetentionColumns(): readonly TableColumn[] {
        return [
            { key: 'project_names', label: 'Project Name' },
            { key: 'firm_name', label: 'Firm Name' },
            { key: 'site_visit_count', label: 'CP Visit' },
            { key: 'token_count', label: 'Token Count' },
            { key: 'booking_count', label: 'CP Booking' },
            { key: 'firm_address', label: 'Firm Address', type: 'sensitive' },
            { key: 'firm_email', label: 'Firm Email', type: 'sensitive' },

        ] as const;
    }
}
