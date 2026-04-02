export interface Agent {
    id: number;
    name: string;
    initials: string;
    deals: number;
    revenue: number;
}

export interface MarketInsight {
    id: number;
    title: string;
    description: string;
    type: 'up' | 'down' | 'stable';
}

export interface ScheduledViewing {
    id: number;
    propertyName: string;
    clientName: string;
    location: string;
    time: string;
}

export interface LocationPerformance {
    name: string;
    properties: number;
    percentage: number;
}

export interface RecentActivity {
    id: number;
    title: string;
    description: string;
    time: string;
    type: 'sale' | 'listing' | 'inquiry' | 'viewing';
    amount?: number;
}

export interface ClientInquiry {
    id: number;
    clientName: string;
    propertyInterest: string;
    time: string;
    priority: 'high' | 'medium' | 'low';
}

export interface LeadLevel {
    lead_level: string;
    lead_level_id: number | string;
    lead_level_count: number;
}

export interface MergedSource {
    source: string;
    presale_leads: number;
    presale_followups: number;
    sales_enquiries: number;
    sales_followups: number;
}

export interface PresaleSource {
    source: string;
    source_id: number | null;
    lead_count: number;
    followup_count: number;
}

export interface PresaleSummary {
    total_lead_count: number;
    unassigned_count: number;
    site_visit_count: number;
    token_count: number;
    booking_count: number;
}

export interface SalesSource {
    source: string;
    source_id: number | null;
    enquiry_count: number;
    followup_count: number;
}

export interface UnitCount {
    unit_type: string | null;
    total_unit: number;
    book_unit: number;
    available_unit: number;
}

export interface BookingStatus {
    booking_status_id: number;
    booking_status: string;
    color_code: string;
    unit_count: number;
}

export interface DigitalIntegration {
    integration_name: string;
    form_id: string;
    duplicate_leads: number;
    lead_count: number;
    site_visit_count: number;
    booking_count: number;
}

export interface EnquiryFlowData {
    enquiries: number;
    tokens: number;
    bookings: number;
    booking_agreements: number;
    disbursements: number;
}

export interface HeaderMetric {
    id: string;
    title: string;
    description: string;
    value: string;
    change: string;
    trend: 'up' | 'down' | 'neutral';
    baseline: string;
    icon: string;
}

export interface Property {
    id: number;
    title: string;
    price: number;
    location: string;
    type: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    image: string;
    status: string;
    daysOnMarket: number;
    priceChange: number;
}

export interface MarketStats {
    totalProperties: number;
    averagePrice: number;
    priceChange: number;
    propertiesSold: number;
    averageDaysOnMarket: number;
    marketTrend: 'up' | 'down' | 'stable';
}

export interface DashboardParams {
    project_id: number[];
    start_date: string;
    end_date: string;
    telecaller_id?: number[];
    sales_executive_id?: number[];
}

export interface DemographicData {
    industry: any[];
    age_range: any[];
    native_place: any[];
    possession_required: any[];
    buying_purpose: any[];
    booking_plan: any[];
    preferred_location: any[];
}
