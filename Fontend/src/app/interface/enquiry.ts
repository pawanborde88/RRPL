export interface enquiryData {
  account_id: number
  enquiry_id: number
  user_id: any
  business_name: string
  sales_manager: number
  credit_manager: number
  cibil_score: string
  current_ownership: number
  permanent_ownership: number
  profile: string
  already_applied: string
  dist_location: string
  live_loan: string
  requested_loan_amount: number
  office_location: string
  solution_for_process: any
  rejection_reason: string
  Recall_date: any
  closer_date: string
  applicant_type_id: any
  user_created: any
  fname: string
  lname: string
  phone: number
  whatsapp_no: number
  email: string
  enquiry_date: string
  loan_type: number
  loan_amount: any
  disbursed_lone_amount: any
  partner_commision_percentage: any
  partner_commision_amount: any
  payment_status: any
  state: string
  city: string
  address: string
  pin: string
  date_of_birth: string
  lead_level_id: number
  company_name: string
  estimated_closure_date: any
  pan_number: string
  notes: string
  enq_detail_msg: string
  next_appointment_date: string
  enquiry_mode_id: number
  enquiry_type_id: any
  data_source: string
  enquiry_details: any
  enquiry_status_id: number
  assigned_to: number
  partner_id: number
  created_by: number
  created_at: string
  updated_by: any
  updated_at: string
  is_deleted: any
  created_fname: string
  created_lname: string
  assigned_name: string
  enquiry_status: string
}


export interface DocumentData {
  account_id: string | null;
  category_id: string | null;
  comment: string | null;
  created_at: string | null;
  created_by: string | null;
  created_fname: string | null;
  created_lname: string | null;
  doc_category_name: string | null;
  doc_id: string | null;
  loan_type: string | null;
  loan_type_id: string | null;
  document_name: string | null;
  mandatory: string | null;
  updated_at: string | null;
  updated_by: string | null;
  updated_fname: string | null;
  updated_lname: string | null;
}



export interface PersonalInformation {
  fname: string
  lname: string
  phone: number
  whatsapp_no: number
  email: string
  account_id: number
  mother_name: string
  created_by: number
  state: number
  city: number
  pin: number
  company_name: string
  current_address: string
  permanent_address: string
  pan_number: string
  date_of_birth: string
  case_date: string
  loan_type: number
  business_name: string
  sales_manager: number
  credit_manager: number
  cibil_score: number
  residential_office_ownership: number
  office_permanent_ownership: number
  residential_home_ownership: number
  home_permanent_ownership: number
  business_profile: string
  already_applied: number
  dist_location: string
}
