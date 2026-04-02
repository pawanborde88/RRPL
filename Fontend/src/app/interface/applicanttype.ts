export  interface ContactData {
  contact_type: number;
  contact_name: string;
  contact_phone: number;
  cibil?: number;

}

export interface RTRDetails {
  loan_case_id: number
  financer_name: string
  products: number
  sanction_amount: number
  open_date: Date
  emi_amount: string
  tenure: number
  emi_date: Date
  emi_bank_name: string
  emi_bank_type: string
  out_standing: number
  emi_closer_date: Date
  created_by: number
}
