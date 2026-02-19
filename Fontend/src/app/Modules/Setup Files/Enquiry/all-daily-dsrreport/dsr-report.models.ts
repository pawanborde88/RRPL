export interface SourceData {
    source: string;
    today: number;
    monthly: number;
    till_date: number;
}

export interface ReportSection {
    sources: SourceData[];
    totals: {
        today: number;
        monthly: number;
        till_date: number;
    };
}

export interface DailyReportResponse {
    date: string;
    project_name: string;
    leads_report: ReportSection;
    enquiry_report: ReportSection;
    booking_report: ReportSection;
    post_sales_report: {
        total_agreements: {
            today: number;
            monthly: number;
            till_date: number;
        };
        total_disbursements: {
            today: number;
            monthly: number;
            till_date: number;
        };
    };
    token_report: {
        types: {
            token_type: string;
            today: number;
            monthly: number;
            till_date: number;
        }[];
        totals: {
            today: number;
            monthly: number;
            till_date: number;
        };
    };
}

export interface Project {
    project_id: number;
    property_name: string;
}

export interface Telecaller {
    user_id: number;
    first_name: string;
    last_name: string;
    full_name: string;
}

export interface SalesExecutive {
    user_id: number;
    user_name: string;
}
