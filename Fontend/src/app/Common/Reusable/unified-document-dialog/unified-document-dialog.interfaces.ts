// Type definitions for unified document dialog

export interface ReplacementMap {
  [key: string]: string;
}

export enum DocumentDialogType {
  ALLOTMENT_LETTER = 'allotment_letter',
  BOOKING_COST_SHEET = 'booking_cost_sheet',
  BOOKING_FORM = 'booking_form',
  RECEIPT = 'receipt',
  CP_INVOICE = 'cp_invoice',
  DEMAND_LETTER = 'demand_letter',
  LETTER_CONFIG_PREVIEW = 'letter_config_preview',
  TOKEN_FORM = 'token_form',
  TOKEN_RECEIPT = 'token_receipt',
  LEDGER_REPORT = 'ledger_report',
  QUATATION_REPORT = 'quatation_report'
}

export interface BookingData {
  booking_id?: number;
  project_id?: number;
  project_name?: string;
  site_address?: string;
  floor_unit?: string;
  wing_name?: string;
  rera_no?: string;
  booking_date?: string;
  applicant_name?: string;
  coapplicant_name?: string;
  applicant_current_address?: string;
  coapplicant_current_address?: string;
  applicant_dob?: string;
  coapplicant_dob?: string;
  applicant_pan_no?: string;
  coapplicant_pan_no?: string;
  applicant_aadhar_no?: string;
  coapplicant_aadhar_no?: string;
  applicant_email?: string;
  coapplicant_email?: string;
  applicant_mobile?: string;
  coapplicant_mobile?: string;
  applicant_occupation?: string;
  coapplicant_occupation?: string;
  applicant_age?: string;
  coapplicant_age?: string;
  floor_name?: number | string;
  carpet?: number | string;
  booking_amount?: number;
  agreement_cost?: number;
  stamp_duty?: number;
  maintenance?: number;
  corpus?: number;
  reg?: number;
  gst?: number;
  parking_no?: string;
  parking_size_sqft?: string;
  parking_size_sqm?: string;
  package_total?: number;
  transaction_no?: string;
  transaction_date?: string;
  payment_mode?: string;
  source?: string;
  source_description?: string;
  firm_name?: string;
  company_logo?: string;
  project_logo?: string;
  stages?: PaymentStage[];
  phases?: Array<{ rera_no?: string }>;
  floor_units?: {
    total_carpet_area_sqft?: string;
    total_carpet_area_sqm?: string;
    carpet_sqm?: string;
    balcony_sqm?: string;
    enclosed_balcony_sqft?: string;
    enclosed_balcony_sqm?: string;
    parking_type?: string;
    maintenance_charges?: string | number;
    corpus_fund?: string | number;
  };
  parking_type?: string;
  parking_charges?: string;
  sd_per?: string;
  reg_per?: string;
  gst_per?: string;
  source_executive_name?: string;
  unit_type?: string;
  bank_name?: string;
  bank_branch?: string;
  remark?: string;
  sales_executive?: string;
  // CP Invoice specific
  net_commission?: number;
  sgst?: number;
  cgst?: number;
  igst?: number;
  invoice_no?: string;
  gst_no?: string;
  pan?: string;
  customer_name?: string;
  basic_cost?: number;
  booking_commission?: number;
  bank_account_name?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  firm_email?: string;
  rera?: string;
  firm_address?: string;
  firm_city?: string;
  firm_phone?: number;
  firm_website?: string;
  commission_percentage?: string;
  tds?: number;
  booking_count?: number;
  total_project?: number;
  common_data?: {
    project_name?: string;
    project_id?: number;
    address?: string;
    rera_no?: string;
    receipt_date?: string;
    applicant_name?: string;
    floor_unit?: string;
    builder_name?: string;
    floor_id?: number;
    wing_name?: string;
    project_logo?: string;
    project_thumbnail_img?: string;
  };
  data?: ReceiptData[];
  project_bank_master?: Array<{
    project_bank_id?: number;
    project_id?: number;
    bank_id?: number;
    wing_id?: number;
    account_type?: string;
    bank_name?: string | null;
    branch_name?: string;
    account_no?: string;
    ifsc_code?: string;
    Ifsc_code?: string; // API may use capital I
    beneficiary_name?: string;
    address?: string;
  }>;
}

export interface PaymentStage {
  percentage: number | string;
  amount: number | string;
  payment_stage?: string;
  gst_amount?: number | string;
}

export interface ReceiptData {
  booking_receipt_id?: number;
  receipt_date?: string;
  receipt_no?: string;
  receipt_type?: string;
  trn_no?: string;
  payment_mode?: string;
  bank_name?: string;
  received_amount?: number;
  amount?: number;
}

export interface DemandData {
  demand_id?: number;
  project_id?: number;
  project_name?: string;
  site_address?: string;
  floor_unit?: string;
  floor_id?: number;
  wing_name?: string;
  stage_name?: string;
  agreement_cost?: number;
  till_date_due_percentage?: string;
  payment_stage?: string;
  total_installment_due_till?: number;
  parking_no?: string;
  total_due?: number;
  gst_per?: string;
  gst_total?: number;
  received_amount?: number;
  received_gst?: number;
  balance_amount?: number;
  balance_gst?: number;
  total_pending_with_gst?: number;
  pending_amount_in_words?: string;
  project_stamp?: string;
  applicant?: {
    mobile_no?: string;
  };
  applicant_name?: string;
  applicant_name1?: string;
  applicant_name2?: string;
  bank_detail?: BankDetail[];
  created_at?: any;
}

export interface BankDetail {
  account_type: string;
  beneficiary_name?: string;
  account_no?: string;
  bank_name?: string;
  ifsc_code?: string;
  branch_name?: string;
}

export interface LetterParking {
  parking_no?: string;
  parking_level?: string;
  parking_type?: string;
  wing_name?: string;
  [key: string]: any;
}

export interface LetterData {
  letter_generation_id?: number;
  project_id?: number;
  letter_type_id?: number;
  bank_id?: number;
  project_name?: string;
  site_address?: string;
  floor_unit?: string;
  wing_name?: string;
  letter_date?: string;
  applicant1_name?: string;
  coapplicant_name?: string;
  all_applicant?: string;
  applicant_mobile?: string;
  agreement_no?: string;
  agreement_date?: string;
  agreement_cost?: number;
  booking_date?: string;
  total_carpet_area_sqft?: string;
  total_carpet_area_sqm?: string;
  gst_percent?: string;
  gst?: number;
  received_amount?: number;
  balance_amount?: number;
  sanction_amount?: number;
  funding_amount?: number;
  bank_name?: string;
  branch_name?: string;
  builder_name?: string;
  created_at?: any;
  /** From API when parkings array is absent; or fallback */
  parking_no?: string;
  parking_level?: string;
  parking_type?: string;
  /** From letter API: array of parking with parking_no, parking_level, parking_type */
  parkings?: LetterParking[];
}

export interface TokenData {
  token_id?: number;
  project_id?: number;
  property_name?: string;
  project_address?: string;
  token_type?: string;
  token_date?: string;
  token_no?: string;
  wing_name?: string;
  total_carpet_area_sqft?: string | number;
  floor_unit_id?: number;
  floor_id?: string | number;
  floor_unit?: string;
  salution?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  mob_no?: string;
  email_id?: string;
  source?: string;
  source_detail?: string;
  firm_name?: string;
  token_amount?: number | string;
  payment_status?: string;
  preference_name?: string;
  sales_executive_name?: string;
  project_code?: string;
  channel_partner?: string;
  balance?: number | string;
  unit_type?: string;
  company_logo?: string;
  project_logo?: string;
  token_transactions?: Array<{
    amount?: number;
    bank_branch?: string;
    bank_name?: string;
    transaction_id?: string;
  }>;
}

export interface DocumentDialogData {
  dialogType: DocumentDialogType;
  rowData?: {
    booking_id?: number;
    demand_id?: number | number[];
    project_id?: number;
    channel_partner_id?: number;
    letter_generation_id?: number;
    token_id?: number;
    booking_receipt_id?: number;
    quotation_log_id?: number;
  };
  project_id?: number;
  receiptData?: ReceiptData[] | ReceiptData;
  booking_receipt_id?: number;
  demand_id?: number | number[];
  letter_generation_id?: number;
  token_id?: number;
}

export interface TemplateResponse {
  status?: boolean;
  success?: boolean;
  html_content?: string;
}

export interface ApiResponse<T = any> {
  status?: boolean;
  success?: boolean;
  data?: T;
  [key: string]: any;
}

export interface ReceiptApiResponse {
  success: boolean;
  data: ReceiptData[];
  common_data: {
    project_name?: string;
    project_id?: number;
    rera_no?: string;
    project_logo?: string;
    receipt_date?: string;
    address?: string;
    builder_name?: string;
    project_thumbnail_img?: string;
    project_stamp?: string;
    floor_unit?: string;
    floor_id?: number;
    wing_name?: string;
    total_amount?: number;
    applicant_name?: string;
    applicant_name1?: string;
    applicant_name2?: string;
    applicant_name3?: string;
    applicant_mobile?: string;
    applicant_email?: string;
  };
}

// Module ID mapping
export const MODULE_ID_MAP: Record<DocumentDialogType, number> = {
  [DocumentDialogType.ALLOTMENT_LETTER]: 9,
  [DocumentDialogType.BOOKING_COST_SHEET]: 10,
  [DocumentDialogType.BOOKING_FORM]: 1,
  [DocumentDialogType.RECEIPT]: 4,
  [DocumentDialogType.CP_INVOICE]: 18,
  [DocumentDialogType.DEMAND_LETTER]: 5,
  [DocumentDialogType.LETTER_CONFIG_PREVIEW]: 0,
  [DocumentDialogType.TOKEN_FORM]: 13,
  [DocumentDialogType.TOKEN_RECEIPT]: 7,
  [DocumentDialogType.LEDGER_REPORT]: 20,
  [DocumentDialogType.QUATATION_REPORT]: 6
};

// Title mapping
export const TITLE_MAP: Record<DocumentDialogType, string> = {
  [DocumentDialogType.ALLOTMENT_LETTER]: 'Allotment Letter',
  [DocumentDialogType.BOOKING_COST_SHEET]: 'Cost Sheet',
  [DocumentDialogType.BOOKING_FORM]: 'Booking Form',
  [DocumentDialogType.RECEIPT]: 'Receipt',
  [DocumentDialogType.CP_INVOICE]: 'CP Invoice',
  [DocumentDialogType.DEMAND_LETTER]: 'Demand Letter',
  [DocumentDialogType.LETTER_CONFIG_PREVIEW]: 'Letter',
  [DocumentDialogType.TOKEN_FORM]: 'EOI Form',
  [DocumentDialogType.TOKEN_RECEIPT]: 'Token Receipt',
  [DocumentDialogType.LEDGER_REPORT]: 'Ledger Report',
  [DocumentDialogType.QUATATION_REPORT]: 'Quatation Report'
};

