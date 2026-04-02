export interface LeadData {
    readonly project_lead_id: number;
    readonly project_id: number;
    readonly project_enq_id: number;
    readonly [key: string]: unknown;
}

export interface PaginationState {
    readonly offset: number;
    readonly limit: number;
    readonly sortBy: string;
    readonly sortOrder: 'asc' | 'desc';
    readonly search: string;
    readonly filters: Record<string, unknown>;
    readonly filteredCount: number;
}

export interface EnquiryStatus {
    readonly enquiry_status_id: number;
    readonly enquiry_status: string;
    readonly [key: string]: unknown;
}

export interface Telecaller {
    readonly user_id: number;
    readonly first_name: string;
    readonly last_name: string;
    readonly full_name: string;
}

export interface Source {
    source_id: number;
    source: string;
}

export interface SourceDetail {
    source_detail_id: number;
    source_detail: string;
}

export interface ChannelPartner {
    channel_partner_id: number;
    firm_name: string;
    cp_owner?: string;
    full_name?: string;
}
